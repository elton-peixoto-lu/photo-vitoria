package main

import (
	"context"
	"log/slog"
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

	// Resend Email
	resendAPIKey := os.Getenv("RESEND_API_KEY")
	resendFrom := os.Getenv("RESEND_FROM") // ex: "onboarding@resend.dev" ou "seu@dominio.com"
	if resendAPIKey != "" && resendFrom != "" {
		resendProvider := notifications.NewResendProvider(resendAPIKey, resendFrom, logger)
		activeProviders = append(activeProviders, resendProvider)
		logger.Info("Resend Email provider inicializado")
	}

	// Se não houver nenhum real, usa Mock
	if len(activeProviders) == 0 {
		activeProviders = append(activeProviders, notifications.NewMockProvider(logger))
		logger.Info("Usando MockProvider")
	}

	notifier = notifications.NewMultiProvider(activeProviders...)

	// 2. Instanciar o repositório (Fake — substituir por Postgres futuramente)
	repo := &DummyRepo{}

	// 3. Inicializar o Service injetando o Notifier e Repo
	service := scheduling.NewService(repo, notifier, logger)

	// 4. Simular a criação de um agendamento
	logger.Info("Iniciando criação de agendamento...")

	msg := notifications.AppointmentCreatedMessage{
		AppointmentID: "apt-001",
		CustomerName:  "Maria Silva",
		CustomerPhone: "+5511999999999",
		CustomerEmail: "maria@exemplo.com",
		ServiceType:   "Ensaio Fotográfico",
		Date:          time.Now().Add(48 * time.Hour),
		StartTime:     "14:00",
		EndTime:       "16:00",
		Notes:         "Preferência por locação ao ar livre",
		AdminPhone:    "+5511888888888",
	}

	err := service.CreateAppointment(ctx, msg)
	if err != nil {
		logger.Error("Erro ao criar agendamento", "error", err)
	} else {
		logger.Info("Processo de agendamento finalizado com sucesso!")
	}
}
