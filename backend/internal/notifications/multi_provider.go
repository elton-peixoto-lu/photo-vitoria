package notifications

import (
	"context"
)

type MultiProvider struct {
	providers []NotificationProvider
}

func NewMultiProvider(providers ...NotificationProvider) *MultiProvider {
	return &MultiProvider{providers: providers}
}

func (m *MultiProvider) SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error {
	for _, p := range m.providers {
		// Dispara cada notificação. Erros individuais são ignorados para não travar o fluxo completo,
		// ou podem ser logados se os providers já tiverem loggers (o que é o nosso caso).
		_ = p.SendAppointmentCreated(ctx, msg)
	}
	return nil
}
