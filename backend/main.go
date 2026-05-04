package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"photo-vitoria-backend/internal/notifications"
	"photo-vitoria-backend/internal/scheduling"
)

// DummyRepo simula o repositório de banco de dados
type DummyRepo struct{}

func (d *DummyRepo) SaveAppointment(ctx context.Context, appointment any) error {
	slog.Info("DummyRepo: Agendamento salvo no banco com sucesso")
	return nil
}

func main() {
	logger := slog.Default()
	ctx := context.Background()

	// 1. Instanciar os Providers Reais ou Mocks
	var activeProviders []notifications.NotificationProvider

	// Google Calendar
	credentialsFile := os.Getenv("GOOGLE_CREDENTIALS_FILE")
	calendarID := os.Getenv("GOOGLE_CALENDAR_ID")
	if credentialsFile != "" && calendarID != "" {
		calendarProvider, err := notifications.NewGoogleCalendarProvider(ctx, credentialsFile, calendarID, logger)
		if err == nil {
			activeProviders = append(activeProviders, calendarProvider)
			logger.Info("Google Calendar provider inicializado")
		} else {
			logger.Error("falha ao inicializar Google Calendar", "error", err)
		}
	}

	// SMTP (Gmail API Alternative)
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	if smtpUser != "" && smtpPass != "" {
		smtpProvider := notifications.NewSMTPProvider(smtpUser, smtpPass, logger)
		activeProviders = append(activeProviders, smtpProvider)
		logger.Info("SMTP Email provider inicializado")
	} else {
		logger.Warn("SMTP não configurado. E-mails não serão enviados.")
	}

	if len(activeProviders) == 0 {
		activeProviders = append(activeProviders, notifications.NewMockProvider(logger))
		logger.Info("Usando MockProvider")
	}

	notifier := notifications.NewMultiProvider(activeProviders...)
	repo := &DummyRepo{}
	service := scheduling.NewService(repo, notifier, logger)

	// Middleware simples de CORS
	corsMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*") // Em produção, mude para seu domínio
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next(w, r)
		}
	}

	// 2. Configurar o Servidor HTTP
	http.HandleFunc("/schedule", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}

		var msg notifications.AppointmentCreatedMessage
		if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
			http.Error(w, "JSON inválido", http.StatusBadRequest)
			return
		}

		// Ajustar a data para garantir que seja válida
		if msg.Date.IsZero() {
			msg.Date = time.Now().Add(24 * time.Hour)
		}

		if err := service.CreateAppointment(r.Context(), msg); err != nil {
			logger.Error("Erro ao criar agendamento", "error", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"status": "error", "message": err.Error()})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "Agendamento processado"})
	}))

	// 3. Endpoint de disponibilidade (Slots ocupados)
	http.HandleFunc("/busy-slots", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		dateStr := r.URL.Query().Get("date") // formato 2006-01-02
		if dateStr == "" {
			http.Error(w, "parâmetro date é obrigatório", http.StatusBadRequest)
			return
		}

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			http.Error(w, "formato de data inválido (use YYYY-MM-DD)", http.StatusBadRequest)
			return
		}

		slots, err := notifier.GetBusySlots(r.Context(), date)
		if err != nil {
			http.Error(w, "erro ao buscar disponibilidade", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(slots)
	}))

	// Health check para o Cloud Run
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Info("Servidor iniciado", "port", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		logger.Error("Falha ao iniciar servidor", "error", err)
		os.Exit(1)
	}
}
