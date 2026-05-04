package notifications

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/resend/resend-go/v2"
)

type ResendProvider struct {
	client *resend.Client
	from   string
	logger *slog.Logger
}

func NewResendProvider(apiKey string, from string, logger *slog.Logger) *ResendProvider {
	if logger == nil {
		logger = slog.Default()
	}
	return &ResendProvider{
		client: resend.NewClient(apiKey),
		from:   from,
		logger: logger,
	}
}

func (p *ResendProvider) SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error {
	if msg.CustomerEmail == "" {
		p.logger.Warn("pulo envio de e-mail: cliente sem e-mail informado")
		return nil
	}

	html := fmt.Sprintf(`
		<h1>Confirmação de Agendamento</h1>
		<p>Olá, <strong>%s</strong>!</p>
		<p>Seu ensaio fotográfico foi agendado com sucesso.</p>
		<ul>
			<li><strong>Serviço:</strong> %s</li>
			<li><strong>Data:</strong> %s</li>
			<li><strong>Horário:</strong> %s</li>
		</ul>
		<p>Estamos ansiosos para te ver!</p>
		<br/>
		<p>Atenciosamente,<br/>Estúdio Photo Vitória</p>
	`, msg.CustomerName, msg.ServiceType, msg.Date.Format("02/01/2006"), msg.StartTime)

	params := &resend.SendEmailRequest{
		From:    p.from,
		To:      []string{msg.CustomerEmail},
		Subject: "Confirmação de Agendamento - Photo Vitória",
		Html:    html,
	}

	sent, err := p.client.Emails.SendWithContext(ctx, params)
	if err != nil {
		return fmt.Errorf("erro ao enviar e-mail via Resend: %w", err)
	}

	p.logger.Info("e-mail de confirmação enviado com sucesso", "emailID", sent.Id, "to", msg.CustomerEmail)

	return nil
}

func (p *ResendProvider) IsSlotOccupied(ctx context.Context, start, end time.Time) (bool, error) {
	return false, nil
}

func (p *ResendProvider) GetBusySlots(ctx context.Context, date time.Time) ([]Slot, error) {
	return []Slot{}, nil
}
