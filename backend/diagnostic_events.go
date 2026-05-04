package main
import (
	"context"
	"fmt"
	"log"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)
func main() {
	ctx := context.Background()
	calendarID := "36d68fae16e35fbd74c0f99e3bb132b1f15a3c632d63a66d2536610d0f0aa418@group.calendar.google.com"
	srv, err := calendar.NewService(ctx, option.WithCredentialsFile("credentials.json"))
	if err != nil { log.Fatal(err) }
	
	events, err := srv.Events.List(calendarID).TimeMin("2026-05-15T00:00:00Z").Do()
	if err != nil { log.Fatal(err) }
	
	fmt.Printf("Eventos encontrados para o período:\n")
	for _, item := range events.Items {
		fmt.Printf("- %s (ID: %s) | Início: %s | Ocupação: %s\n", item.Summary, item.Id, item.Start.DateTime, item.Transparency)
	}
}
