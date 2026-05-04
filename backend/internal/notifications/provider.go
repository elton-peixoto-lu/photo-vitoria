package notifications

import (
	"context"
	"time"
)

type AppointmentCreatedMessage struct {
	AppointmentID string
	CustomerName  string
	CustomerPhone string
	CustomerEmail string
	ServiceType   string
	Date          time.Time
	StartTime     string
	EndTime       string
	Notes         string
	AdminPhone    string
}

type NotificationProvider interface {
	SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error
}
