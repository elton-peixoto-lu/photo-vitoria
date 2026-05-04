package notifications

import (
	"context"
	"time"
)

type MultiProvider struct {
	providers []NotificationProvider
}

func NewMultiProvider(providers ...NotificationProvider) *MultiProvider {
	return &MultiProvider{providers: providers}
}

func (m *MultiProvider) SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error {
	for _, p := range m.providers {
		if err := p.SendAppointmentCreated(ctx, msg); err != nil {
			return err // Se um falhar, reportamos o erro
		}
	}
	return nil
}

func (m *MultiProvider) IsSlotOccupied(ctx context.Context, start, end time.Time) (bool, error) {
	for _, p := range m.providers {
		occupied, err := p.IsSlotOccupied(ctx, start, end)
		if err != nil {
			return false, err
		}
		if occupied {
			return true, nil
		}
	}
	return false, nil
}

func (m *MultiProvider) GetBusySlots(ctx context.Context, date time.Time) ([]Slot, error) {
	var all []Slot
	for _, p := range m.providers {
		slots, err := p.GetBusySlots(ctx, date)
		if err == nil {
			all = append(all, slots...)
		}
	}
	return all, nil
}
