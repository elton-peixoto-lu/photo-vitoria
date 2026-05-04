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
	if err != nil {
		log.Fatalf("Unable to retrieve Calendar client: %v", err)
	}

	emails := []string{"estudiovitoriafreitas@gmail.com", "pluizelton@gmail.com"}
	
	for _, email := range emails {
		rule := &calendar.AclRule{
			Scope: &calendar.AclRuleScope{
				Type:  "user",
				Value: email,
			},
			Role: "owner",
		}

		createdRule, err := srv.Acl.Insert(calendarID, rule).Do()
		if err != nil {
			fmt.Printf("Erro ao compartilhar com %s: %v\n", email, err)
		} else {
			fmt.Printf("Sucesso! Agenda compartilhada com %s (Acl ID: %s)\n", email, createdRule.Id)
		}
	}
}
