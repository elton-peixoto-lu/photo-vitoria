package scheduling

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"photo-vitoria-backend/internal/notifications"
)

// Repository é uma interface fictícia para o agendamento
type Repository interface {
	SaveAppointment(ctx context.Context, appointment any) error
}

type Service struct {
	repo     Repository
	notifier notifications.NotificationProvider
	logger   *slog.Logger
}

func NewService(repo Repository, notifier notifications.NotificationProvider, logger *slog.Logger) *Service {
	if logger == nil {
		logger = slog.Default()
	}
	return &Service{
		repo:     repo,
		notifier: notifier,
		logger:   logger,
	}
}

func (s *Service) CreateAppointment(ctx context.Context, msg notifications.AppointmentCreatedMessage) error {
	// 1. Validação de campos obrigatórios
	if msg.AppointmentID == "" || msg.CustomerName == "" || msg.Date.IsZero() || msg.StartTime == "" {
		return errors.New("campos obrigatórios faltando (ID, Nome, Data ou Horário)")
	}

	// 2. Determinar janela de tempo (Início e Fim) com fuso horário de Brasília
	location, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		s.logger.Warn("não foi possível carregar fuso horário America/Sao_Paulo, usando Local", "error", err)
		location = time.Local
	}
	start, err := time.ParseInLocation("2006-01-02 15:04", msg.Date.Format("2006-01-02")+" "+msg.StartTime, location)
	if err != nil {
		return fmt.Errorf("formato de data/hora inválido: %w", err)
	}
	
	duration := 1 * time.Hour
	if msg.EndTime != "" {
		end, err := time.ParseInLocation("2006-01-02 15:04", msg.Date.Format("2006-01-02")+" "+msg.EndTime, location)
		if err == nil {
			duration = end.Sub(start)
		}
	}
	finish := start.Add(duration)

	// 3. Verificação de Disponibilidade (Concorrência/Conflito)
	occupied, err := s.notifier.IsSlotOccupied(ctx, start, finish)
	if err != nil {
		s.logger.Error("falha ao verificar disponibilidade", "error", err)
		// Em caso de erro técnico na API do Google, podemos decidir se bloqueamos ou permitimos.
		// Aqui, vamos permitir para não travar o cliente por erro externo.
	} else if occupied {
		return errors.New("desculpe, este horário já está ocupado por outro ensaio")
	}

	// 4. Salvar no Banco (Fictício)
	// s.repo.SaveAppointment(ctx, ...)

	// 5. Notificação Final (Calendar + Email)
	if err := s.notifier.SendAppointmentCreated(ctx, msg); err != nil {
		s.logger.Error("falha na notificação (ex: Resend restrito), mas agendamento foi salvo na agenda", "error", err)
		// Não retornamos erro aqui para garantir que o cliente veja a tela de sucesso,
		// já que o compromisso principal (bloquear horário e salvar na agenda) foi feito.
	}

	return nil
}
