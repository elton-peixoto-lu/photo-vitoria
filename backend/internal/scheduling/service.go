package scheduling

import (
	"context"
	"log/slog"

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
	// 1. Lógica de persistência do agendamento (fictícia neste exemplo)
	// err := s.repo.SaveAppointment(ctx, ...)
	// if err != nil { return err }

	// 2. Validação de campos mínimos para notificação
	if msg.AppointmentID == "" || msg.CustomerName == "" || msg.Date.IsZero() {
		s.logger.Warn("skipping notification: missing minimal fields", 
			"appointmentID", msg.AppointmentID,
		)
		return nil
	}

	// 3. Notificação (não pode quebrar a criação do agendamento)
	if err := s.notifier.SendAppointmentCreated(ctx, msg); err != nil {
		// Logamos o erro com detalhes para possível monitoramento
		s.logger.Warn("failed to send appointment notification", 
			"error", err, 
			"appointmentID", msg.AppointmentID,
		)
		
		// TODO: Futuramente, inserir o agendamento em uma tabela `notification_attempts`
		// para realizar retentativas por cron/worker.

		// Retorna nil pois o agendamento em si ocorreu com sucesso.
		return nil
	}

	return nil
}
