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
		option.WithScopes(calendar.CalendarScope),
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
	// 4. Criar o objeto do evento (Sem attendees para evitar erro 403 da Service Account)
	event := &calendar.Event{
		Id:          generateEventID(msg.AppointmentID),
		Summary:     fmt.Sprintf("Ensaio: %s - %s", msg.CustomerName, msg.ServiceType),
		Description: descBuilder.String(),
		Start: &calendar.EventDateTime{
			DateTime: startDateTime,
			TimeZone: "America/Sao_Paulo",
		},
		End: &calendar.EventDateTime{
			DateTime: endDateTime,
			TimeZone: "America/Sao_Paulo",
		},
		Reminders: &calendar.EventReminders{
			UseDefault: false,
			Overrides: []*calendar.EventReminder{
				{Method: "popup", Minutes: 60},   // Lembrete 1h antes
				{Method: "popup", Minutes: 1440}, // Lembrete 1 dia antes
			},
			ForceSendFields: []string{"UseDefault"},
		},
	}

	// 5. Inserir o evento
	createdEvent, err := p.calendarService.Events.Insert(p.calendarID, event).
		SendUpdates("all").
		Context(ctx).
		Do()
	if err != nil {
		// Se o erro for 409 (Conflict), significa que o ID do evento já existe.
		if strings.Contains(err.Error(), "already exists") || strings.Contains(err.Error(), "409") {
			p.logger.Info("evento já existia no Google Calendar (idempotência)", "appointmentID", msg.AppointmentID)
			return nil
		}
		return fmt.Errorf("erro ao criar evento no Google Calendar: %w", err)
	}

	p.logger.Info("evento criado no Google Calendar com sucesso",
		"eventID", createdEvent.Id,
		"appointmentID", msg.AppointmentID,
		"htmlLink", createdEvent.HtmlLink,
	)

	return nil
}

func (p *GoogleCalendarProvider) IsSlotOccupied(ctx context.Context, start, end time.Time) (bool, error) {
	slots, err := p.GetBusySlots(ctx, start)
	if err != nil {
		return false, err
	}
	
	for _, s := range slots {
		// Ignorar eventos de "Dia Inteiro" (Holidays)
		duration := s.End.Sub(s.Start)
		if duration >= 23*time.Hour && s.Start.Hour() == 0 && s.Start.Minute() == 0 {
			p.logger.Debug("Ignorando slot de dia inteiro (provável feriado)", "start", s.Start, "duration", duration)
			continue
		}

		// Verifica sobreposição real
		if start.Before(s.End) && s.Start.Before(end) {
			p.logger.Warn("CONFLITO DETECTADO", 
				"solicitado_inicio", start, 
				"solicitado_fim", end, 
				"conflito_inicio", s.Start, 
				"conflito_fim", s.End,
			)
			return true, nil
		}
	}
	return false, nil
}

func (p *GoogleCalendarProvider) GetBusySlots(ctx context.Context, date time.Time) ([]Slot, error) {
	// Início e fim do dia (Garantir que usamos o fuso horário de Brasília na query)
	loc, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		loc = time.FixedZone("BRT", -3*3600)
	}
	
	timeMin := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc).Format(time.RFC3339)
	timeMax := time.Date(date.Year(), date.Month(), date.Day(), 23, 59, 59, 0, loc).Format(time.RFC3339)

	fbRequest := &calendar.FreeBusyRequest{
		TimeMin: timeMin,
		TimeMax: timeMax,
		Items: []*calendar.FreeBusyRequestItem{
			{Id: p.calendarID},
		},
	}

	fbResponse, err := p.calendarService.Freebusy.Query(fbRequest).Context(ctx).Do()
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar slots no Google: %w", err)
	}

	var result []Slot
	for _, cal := range fbResponse.Calendars {
		for _, b := range cal.Busy {
			start, errS := time.Parse(time.RFC3339, b.Start)
			end, errE := time.Parse(time.RFC3339, b.End)
			if errS == nil && errE == nil {
				p.logger.Debug("Google retornou slot ocupado", "start", start, "end", end)
				result = append(result, Slot{Start: start, End: end})
			}
		}
	}

	if len(result) > 0 {
		p.logger.Info("Total de slots ocupados encontrados", "count", len(result), "date", date.Format("2006-01-02"))
	}
	return result, nil
}
