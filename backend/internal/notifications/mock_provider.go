package notifications

import (
	"context"
	"log/slog"
	"time"
)

type MockProvider struct {
	logger *slog.Logger
}

func NewMockProvider(logger *slog.Logger) *MockProvider {
	if logger == nil {
		logger = slog.Default()
	}
	return &MockProvider{logger: logger}
}

func (m *MockProvider) SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error {
	m.logger.Info("MockProvider: Sending appointment created notification",
		"appointmentID", msg.AppointmentID,
		"customerName", msg.CustomerName,
		"customerPhone", msg.CustomerPhone,
		"adminPhone", msg.AdminPhone,
		"serviceType", msg.ServiceType,
		"date", msg.Date.Format("2006-01-02"),
		"startTime", msg.StartTime,
	)
	return nil
}

func (m *MockProvider) IsSlotOccupied(ctx context.Context, start, end time.Time) (bool, error) {
	return false, nil
}

func (m *MockProvider) GetBusySlots(ctx context.Context, date time.Time) ([]Slot, error) {
	return []Slot{}, nil
}
