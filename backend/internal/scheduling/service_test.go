package scheduling

import (
	"context"
	"errors"
	"log/slog"
	"testing"
	"time"

	"photo-vitoria-backend/internal/notifications"
)

type mockRepo struct{}
func (m *mockRepo) SaveAppointment(ctx context.Context, appointment any) error { return nil }

type testNotifier struct {
	occupied bool
	err      error
}

func (t *testNotifier) SendAppointmentCreated(ctx context.Context, msg notifications.AppointmentCreatedMessage) error {
	return t.err
}

func (t *testNotifier) IsSlotOccupied(ctx context.Context, start, end time.Time) (bool, error) {
	return t.occupied, t.err
}

func TestService_CreateAppointment(t *testing.T) {
	logger := slog.Default()
	repo := &mockRepo{}

	t.Run("conflito de horário", func(t *testing.T) {
		notifier := &testNotifier{occupied: true}
		service := NewService(repo, notifier, logger)
		
		msg := notifications.AppointmentCreatedMessage{
			AppointmentID: "1",
			CustomerName:  "Test",
			Date:          time.Now(),
			StartTime:     "10:00",
		}
		
		err := service.CreateAppointment(context.Background(), msg)
		if err == nil || err.Error() != "desculpe, este horário já está ocupado por outro ensaio" {
			t.Errorf("esperava erro de conflito, obtive: %v", err)
		}
	})

	t.Run("campos faltando", func(t *testing.T) {
		notifier := &testNotifier{occupied: false}
		service := NewService(repo, notifier, logger)
		
		msg := notifications.AppointmentCreatedMessage{AppointmentID: "1"}
		
		err := service.CreateAppointment(context.Background(), msg)
		if err == nil {
			t.Error("esperava erro de campos obrigatórios")
		}
	})

	t.Run("sucesso total", func(t *testing.T) {
		notifier := &testNotifier{occupied: false}
		service := NewService(repo, notifier, logger)
		
		msg := notifications.AppointmentCreatedMessage{
			AppointmentID: "1",
			CustomerName:  "Sucesso",
			Date:          time.Now(),
			StartTime:     "10:00",
		}
		
		err := service.CreateAppointment(context.Background(), msg)
		if err != nil {
			t.Errorf("esperava sucesso, obtive: %v", err)
		}
	})
}
