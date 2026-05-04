package notifications

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// GoogleCalendarProvider implementa NotificationProvider usando a Google Calendar API.
// Ao criar um evento com attendees e SendUpdates("all"), o próprio Google
// envia um e-mail de convite/confirmação para o cliente automaticamente.
type GoogleCalendarProvider struct {
	calendarService *calendar.Service
	calendarID      string
	logger          *slog.Logger
}

// NewGoogleCalendarProvider cria uma nova instância do provider usando o arquivo
// de credenciais JSON de uma Service Account do Google Cloud.
// A service account precisa ter permissão de edição na agenda (calendarID).
func NewGoogleCalendarProvider(ctx context.Context, credentialsFile string, calendarID string, logger *slog.Logger) (*GoogleCalendarProvider, error) {
	if logger == nil {
		logger = slog.Default()
	}

	srv, err := calendar.NewService(ctx,
		option.WithCredentialsFile(credentialsFile),
		option.WithScopes(calendar.CalendarEventsScope),
	)
	if err != nil {
		return nil, fmt.Errorf("erro ao inicializar cliente do Google Calendar: %w", err)
	}

	return &GoogleCalendarProvider{
		calendarService: srv,
		calendarID:      calendarID,
		logger:          logger,
	}, nil
}

// generateEventID gera um ID idempotente baseado no AppointmentID.
// Isso evita eventos duplicados se a requisição for retentada por falha de rede.
// O Google Calendar exige IDs com 5-1024 caracteres alfanuméricos lowercase.
func generateEventID(appointmentID string) string {
	hash := sha256.Sum256([]byte(appointmentID))
	// Pegar os primeiros 32 chars do hex (64 chars no total do sha256)
	id := fmt.Sprintf("%x", hash[:16])
	return id
}

// buildDateTime constrói uma string RFC3339 a partir de uma data e um horário no formato "HH:MM".
func buildDateTime(date time.Time, timeStr string) (string, error) {
	if timeStr == "" {
		return "", fmt.Errorf("horário não informado")
	}

	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return "", fmt.Errorf("formato de horário inválido: %q (esperado HH:MM)", timeStr)
	}

	return fmt.Sprintf("%sT%s:00", date.Format("2006-01-02"), timeStr), nil
}

func (p *GoogleCalendarProvider) SendAppointmentCreated(ctx context.Context, msg AppointmentCreatedMessage) error {
	// 1. Construir horários de início e fim
	startDateTime, err := buildDateTime(msg.Date, msg.StartTime)
	if err != nil {
		return fmt.Errorf("erro ao montar horário de início: %w", err)
	}

	var endDateTime string
	if msg.EndTime != "" {
		endDateTime, err = buildDateTime(msg.Date, msg.EndTime)
		if err != nil {
			return fmt.Errorf("erro ao montar horário de fim: %w", err)
		}
	} else {
		// Se EndTime não for informado, assume 1 hora de duração
		parsedStart, parseErr := time.ParseInLocation("2006-01-02T15:04:05", startDateTime, time.FixedZone("BRT", -3*3600))
		if parseErr != nil {
			return fmt.Errorf("erro ao calcular horário de fim: %w", parseErr)
		}
		endDateTime = parsedStart.Add(1 * time.Hour).Format("2006-01-02T15:04:05")
	}

	// 2. Montar descrição com dados úteis para a fotógrafa (sem expor tokens)
	var descBuilder strings.Builder
	descBuilder.WriteString(fmt.Sprintf("📸 Serviço: %s\n", msg.ServiceType))
	descBuilder.WriteString(fmt.Sprintf("👤 Cliente: %s\n", msg.CustomerName))
	if msg.CustomerPhone != "" {
		descBuilder.WriteString(fmt.Sprintf("📱 Telefone: %s\n", msg.CustomerPhone))
	}
	if msg.CustomerEmail != "" {
		descBuilder.WriteString(fmt.Sprintf("📧 E-mail: %s\n", msg.CustomerEmail))
	}
	if msg.Notes != "" {
		descBuilder.WriteString(fmt.Sprintf("\n📝 Observações:\n%s", msg.Notes))
	}

	// 3. Montar lista de convidados (attendees)
	var attendees []*calendar.EventAttendee

	// Adicionar o e-mail do cliente (se informado) — o Google vai enviar o convite para ele
	if msg.CustomerEmail != "" {
		attendees = append(attendees, &calendar.EventAttendee{
			Email:       msg.CustomerEmail,
			DisplayName: msg.CustomerName,
		})
	}

	// 4. Montar o evento
	event := &calendar.Event{
		Id:          generateEventID(msg.AppointmentID),
		Summary:     fmt.Sprintf("Ensaio Fotográfico - %s", msg.CustomerName),
		Description: descBuilder.String(),
		Start: &calendar.EventDateTime{
			DateTime: startDateTime,
			TimeZone: "America/Sao_Paulo",
		},
		End: &calendar.EventDateTime{
			DateTime: endDateTime,
			TimeZone: "America/Sao_Paulo",
		},
		Attendees: attendees,
		Reminders: &calendar.EventReminders{
			UseDefault: false,
			Overrides: []*calendar.EventReminder{
				{Method: "popup", Minutes: 60},   // Lembrete 1h antes
				{Method: "popup", Minutes: 1440}, // Lembrete 1 dia antes
			},
			ForceSendFields: []string{"UseDefault"},
		},
	}

	// 5. Inserir o evento — SendUpdates("all") faz o Google enviar o e-mail
	// de confirmação/convite automaticamente para todos os attendees
	createdEvent, err := p.calendarService.Events.Insert(p.calendarID, event).
		SendUpdates("all").
		Context(ctx).
		Do()
	if err != nil {
		return fmt.Errorf("erro ao criar evento no Google Calendar: %w", err)
	}

	p.logger.Info("evento criado no Google Calendar com sucesso",
		"eventID", createdEvent.Id,
		"appointmentID", msg.AppointmentID,
		"htmlLink", createdEvent.HtmlLink,
	)

	return nil
}
