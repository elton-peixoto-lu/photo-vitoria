package notifications

import (
	"context"
	"time"
)

type AppointmentCreatedMessage struct {
	AppointmentID string    `json:"appointmentID"`
	CustomerName  string    `json:"customerName"`
	CustomerPhone string    `json:"customerPhone"`
	CustomerEmail string    `json:"customerEmail"`
	ServiceType   string    `json:"serviceType"`
	Date          time.Time `json:"date"`
	StartTime     string    `json:"startTime"`
	EndTime       string    `json:"endTime"`
	Notes         string    `json:"notes"`
	AdminPhone    string    `json:"adminPhone"`
}

type NotificationProvider interface {
	SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error
	// IsSlotOccupied retorna true se o horário estiver ocupado
	IsSlotOccupied(ctx context.Context, startTime, endTime time.Time) (bool, error)
	// GetBusySlots retorna uma lista de intervalos ocupados no dia
	GetBusySlots(ctx context.Context, date time.Time) ([]Slot, error)
}

type Slot struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}
