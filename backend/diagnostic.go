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
	srv, err := calendar.NewService(ctx, option.WithCredentialsFile("credentials.json"))
	if err != nil { log.Fatal(err) }
	
	list, err := srv.CalendarList.List().Do()
	if err != nil { log.Fatal(err) }
	
	fmt.Println("Calendários acessíveis:")
	if len(list.Items) == 0 {
		fmt.Println("Nenhum calendário encontrado. A Service Account precisa ser convidada para a agenda!")
	}
	for _, item := range list.Items {
		fmt.Printf("- %s (ID: %s)\n", item.Summary, item.Id)
	}
}
