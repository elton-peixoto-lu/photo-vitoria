package scheduling

import (
	"context"
	"errors"
	"log/slog"
	"testing"
	"time"

	"photo-vitoria-backend/internal/notifications"
)

// mockRepo implementa a interface Repository para os testes
type mockRepo struct{}

func (m *mockRepo) SaveAppointment(ctx context.Context, appointment any) error {
	return nil
}

// errorNotifier simula um provider de notificação que sempre falha
type errorNotifier struct{}

func (e *errorNotifier) SendAppointmentCreated(ctx context.Context, msg notifications.AppointmentCreatedMessage) error {
	return errors.New("simulated notification failure")
}

// successNotifier simula um provider que funciona e contabiliza as chamadas
type successNotifier struct {
	calls int
}

func (s *successNotifier) SendAppointmentCreated(ctx context.Context, msg notifications.AppointmentCreatedMessage) error {
	s.calls++
	return nil
}

func TestService_CreateAppointment_NotificationFails(t *testing.T) {
	logger := slog.Default()
	repo := &mockRepo{}
	notifier := &errorNotifier{}

	service := NewService(repo, notifier, logger)

	msg := notifications.AppointmentCreatedMessage{
		AppointmentID: "123",
		CustomerName:  "Test",
		Date:          time.Now(),
	}

	// O agendamento DEVE retornar sucesso mesmo que o notifier falhe
	err := service.CreateAppointment(context.Background(), msg)
	if err != nil {
		t.Errorf("esperava sucesso mesmo com falha no notifier, obtive %v", err)
	}
}

func TestService_CreateAppointment_NotificationSucceeds(t *testing.T) {
	logger := slog.Default()
	repo := &mockRepo{}
	notifier := &successNotifier{}

	service := NewService(repo, notifier, logger)

	msg := notifications.AppointmentCreatedMessage{
		AppointmentID: "456",
		CustomerName:  "Test",
		Date:          time.Now(),
	}

	err := service.CreateAppointment(context.Background(), msg)
	if err != nil {
		t.Errorf("esperava sucesso, obtive %v", err)
	}

	if notifier.calls != 1 {
		t.Errorf("esperava que o notifier fosse chamado 1 vez, obtive %d", notifier.calls)
	}
}

func TestService_CreateAppointment_MissingFields(t *testing.T) {
	logger := slog.Default()
	repo := &mockRepo{}
	notifier := &successNotifier{}

	service := NewService(repo, notifier, logger)

	// Faltando CustomerName e Date
	msg := notifications.AppointmentCreatedMessage{
		AppointmentID: "789",
	}

	err := service.CreateAppointment(context.Background(), msg)
	if err != nil {
		t.Errorf("esperava sucesso (pois a falha na notificação não deve quebrar), obtive %v", err)
	}

	if notifier.calls != 0 {
		t.Errorf("esperava que o notifier não fosse chamado devido à falta de campos obrigatórios, obtive %d", notifier.calls)
	}
}
