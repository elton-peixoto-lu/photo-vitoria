package notifications

import (
	"context"
	"fmt"
	"log/slog"
	"net/smtp"
	"time"
)

type SMTPProvider struct {
	user   string
	pass   string
	logger *slog.Logger
}

func NewSMTPProvider(user, pass string, logger *slog.Logger) *SMTPProvider {
	return &SMTPProvider{
		user:   user,
		pass:   pass,
		logger: logger,
	}
}

func (p *SMTPProvider) SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error {
	to := []string{msg.CustomerEmail}
	
	fromHeader := fmt.Sprintf("From: Photo Vitória <%s>\r\n", p.user)
	toHeader := fmt.Sprintf("To: %s\r\n", msg.CustomerEmail)
	subject := "Subject: Confirmação de Agendamento - Photo Vitória\r\n"
	mime := "MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"
	
	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;">
			<div style="background-color: #111; padding: 20px; text-align: center;">
				<h1 style="color: #fff; margin: 0; font-weight: 300; letter-spacing: 2px;">PHOTO VITÓRIA</h1>
			</div>
			<div style="padding: 30px;">
				<h2 style="color: #333; margin-top: 0;">Olá, %s!</h2>
				<p>Este é um e-mail para confirmar que o seu <strong>%s</strong> foi agendado com sucesso.</p>
				
				<div style="background-color: #f9f9f9; border-left: 4px solid #ff69b4; padding: 15px; margin: 20px 0;">
					<p style="margin: 5px 0;"><strong>📅 Data:</strong> %s</p>
					<p style="margin: 5px 0;"><strong>⏰ Horário:</strong> %s</p>
					<p style="margin: 5px 0;"><strong>📍 Local:</strong> Estúdio Photo Vitória</p>
					<p style="margin: 5px 0; color: #666; font-size: 0.9em;">Estr. do Carneiro, 2923 - Jardim Sampaio Vidal, Mauá - SP, 09330-550</p>
					<p style="margin: 5px 0; color: #666; font-size: 0.9em;">📞 Contato do Estúdio: (11) 99690-6210</p>
					<div style="margin-top: 15px;">
						<a href="https://maps.google.com/?q=Estr.+do+Carneiro,+2923+-+Jardim+Sampaio+Vidal,+Mauá+-+SP,+09330-550" style="display: inline-block; background-color: #f0f0f0; padding: 10px; border-radius: 8px; text-decoration: none; color: #333; text-align: center; border: 1px solid #ddd; width: 100%%; max-width: 300px;">
							<img src="https://cdn-icons-png.flaticon.com/512/854/854878.png" width="24" height="24" style="vertical-align: middle; margin-right: 8px;" alt="Map">
							<span style="font-weight: bold; vertical-align: middle;">Abrir Rota no Google Maps</span>
						</a>
					</div>
				</div>
				
				<p>A fotógrafa já está com o seu horário reservado na agenda.</p>
				<p>Nos vemos lá!</p>
			</div>
		</div>
	`, msg.CustomerName, msg.ServiceType, msg.Date.Format("02/01/2006"), msg.StartTime)
	
	msgBytes := []byte(fromHeader + toHeader + subject + mime + body)
	
	auth := smtp.PlainAuth("", p.user, p.pass, "smtp.gmail.com")
	
	err := smtp.SendMail("smtp.gmail.com:587", auth, p.user, to, msgBytes)
	if err != nil {
		return fmt.Errorf("erro ao enviar e-mail via SMTP: %w", err)
	}
	
	p.logger.Info("e-mail de confirmação enviado via SMTP com sucesso", "to", msg.CustomerEmail)
	return nil
}

func (p *SMTPProvider) IsSlotOccupied(ctx context.Context, startTime, endTime time.Time) (bool, error) {
	return false, nil
}

func (p *SMTPProvider) GetBusySlots(ctx context.Context, date time.Time) ([]Slot, error) {
	return nil, nil
}
