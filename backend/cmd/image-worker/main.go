package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"photo-vitoria-backend/internal/media"

	"google.golang.org/api/idtoken"
)

func main() {
	logger := slog.Default()
	ctx := context.Background()

	service, err := media.NewService(ctx, logger)
	if err != nil {
		logger.Error("falha ao iniciar image worker", "error", err)
		os.Exit(1)
	}
	var reprocessRunning atomic.Bool
	reprocessState := &galleryReprocessState{}

	mux := http.NewServeMux()
	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true, "service": "image-worker"})
	}
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/healthz", healthHandler)
	mux.HandleFunc("/readyz", healthHandler)
	mux.HandleFunc("/reprocess-status", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, reprocessState.snapshot(reprocessRunning.Load()))
	})
	mux.HandleFunc("/process-manifest", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", "POST")
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		if err := authorizeRequest(r.Context(), r); err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
			return
		}

		var req media.ProcessRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "json invalido"})
			return
		}

		result, err := service.ProcessManifest(r.Context(), req)
		if err != nil {
			status := http.StatusBadRequest
			if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
				status = http.StatusGatewayTimeout
			}
			logger.Error("falha ao processar manifesto", "error", err)
			writeJSON(w, status, map[string]string{"error": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, result)
	})
	mux.HandleFunc("/reprocess-published-media", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", "POST")
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		if err := authorizeRequest(r.Context(), r); err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
			return
		}

		if !reprocessRunning.CompareAndSwap(false, true) {
			writeJSON(w, http.StatusConflict, map[string]any{
				"error":  "reprocess already running",
				"status": reprocessState.snapshot(true),
			})
			return
		}
		reprocessState.markStarted()

		go func() {
			defer reprocessRunning.Store(false)
			result, err := service.ReprocessPublishedMedia(context.Background())
			if err != nil {
				reprocessState.markFinished(err)
				logger.Error("falha ao reprocessar galeria publicada", "error", err)
				return
			}
			reprocessState.markFinished(nil)
			logger.Info("reprocesso da galeria publicado concluido", "folder", result.Folder, "processed", result.Processed)
		}()

		writeJSON(w, http.StatusAccepted, map[string]any{
			"accepted": true,
			"message":  "reprocess started",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           withCORS(mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	logger.Info("image worker iniciado", "port", port)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Error("falha ao iniciar image worker", "error", err)
		os.Exit(1)
	}
}

type galleryReprocessState struct {
	mu           sync.Mutex
	LastStarted  time.Time `json:"last_started,omitempty"`
	LastFinished time.Time `json:"last_finished,omitempty"`
	LastError    string    `json:"last_error,omitempty"`
}

func (s *galleryReprocessState) markStarted() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.LastStarted = time.Now().UTC()
	s.LastError = ""
}

func (s *galleryReprocessState) markFinished(err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.LastFinished = time.Now().UTC()
	if err != nil {
		s.LastError = err.Error()
		return
	}
	s.LastError = ""
}

func (s *galleryReprocessState) snapshot(running bool) map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()
	payload := map[string]any{
		"running": running,
	}
	if !s.LastStarted.IsZero() {
		payload["last_started"] = s.LastStarted.Format(time.RFC3339)
	}
	if !s.LastFinished.IsZero() {
		payload["last_finished"] = s.LastFinished.Format(time.RFC3339)
	}
	if s.LastError != "" {
		payload["last_error"] = s.LastError
	}
	return payload
}

func authorizeRequest(ctx context.Context, r *http.Request) error {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return errors.New("missing bearer token")
	}
	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))

	expected := strings.TrimSpace(os.Getenv("IMAGE_WORKER_BEARER_TOKEN"))
	if expected != "" && token == expected {
		return nil
	}

	audience := strings.TrimSpace(os.Getenv("IMAGE_WORKER_AUDIENCE"))
	allowedCaller := strings.TrimSpace(os.Getenv("IMAGE_WORKER_ALLOWED_CALLER"))
	if audience != "" && allowedCaller != "" {
		payload, err := idtoken.Validate(ctx, token, audience)
		if err == nil {
			email, _ := payload.Claims["email"].(string)
			emailVerified, _ := payload.Claims["email_verified"].(bool)
			if email == allowedCaller && emailVerified {
				return nil
			}
		}
	}

	return errors.New("invalid bearer token")
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
