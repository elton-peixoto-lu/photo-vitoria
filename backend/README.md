# Photo Vitória - Backend Go

Backend em Go para o sistema de agendamento do estúdio de fotografia Photo Vitória.

## Arquitetura

```
POST /appointments
        ↓
Scheduling Service
        ↓
Appointment Repository (Postgres)
        ↓
NotificationProvider interface
        ↓
Mock / Google Calendar
```

Quando um agendamento é criado, o sistema insere um **evento no Google Agenda** da fotógrafa e envia automaticamente um **e-mail de confirmação/convite** para o cliente — tudo feito pelo próprio Google, sem necessidade de servidor de e-mail.

## Feature: Notificações via Google Calendar

### Como funciona

1. O cliente agenda um ensaio pelo site.
2. O backend cria um evento no Google Calendar da fotógrafa.
3. O Google envia automaticamente um e-mail bonito de convite para o cliente (com botão "Aceitar").
4. O evento aparece na agenda do Google da fotógrafa e do cliente.
5. Ambos recebem lembretes automáticos (1 dia antes e 1 hora antes).

### Regra de Negócio Crítica

A notificação **nunca impede** a criação do agendamento. Se o Google Calendar estiver fora do ar, o agendamento é salvo normalmente e um log de erro é emitido.

```go
if err := s.notifier.SendAppointmentCreated(ctx, msg); err != nil {
    s.logger.Warn("failed to send appointment notification", "error", err)
    // TODO: Futura tabela notification_attempts para retentativas
}
// Retorna sucesso para o cliente
```

## Configuração

### Modo Desenvolvimento (Mock)

Sem nenhuma variável de ambiente, o sistema usa o `MockProvider` que apenas loga as notificações no console:

```bash
go run main.go
```

### Modo Produção (Google Calendar)

#### 1. Criar credenciais no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com).
2. Crie um projeto (ou selecione um existente).
3. Ative a **Google Calendar API** em "APIs e Serviços".
4. Vá em **Credenciais > Criar Credenciais > Conta de Serviço**.
5. Dê um nome (ex: `photo-vitoria-calendar`) e clique em "Criar".
6. Na conta de serviço criada, vá na aba **Chaves > Adicionar Chave > JSON**.
7. O download de um arquivo `.json` será feito automaticamente. **Guarde-o com segurança.**

#### 2. Compartilhar a agenda

1. Abra o [Google Calendar](https://calendar.google.com) com a conta da fotógrafa.
2. Crie uma agenda dedicada (ex: "Ensaios Fotográficos") ou use a principal.
3. Nas configurações da agenda, clique em **"Compartilhar com pessoas específicas"**.
4. Adicione o **e-mail da Service Account** (algo como `photo-vitoria-calendar@projeto.iam.gserviceaccount.com`).
5. Dê permissão de **"Fazer alterações nos eventos"**.
6. Copie o **ID da agenda** (na seção "Integrar agenda", algo como `abc123@group.calendar.google.com`).

#### 3. Configurar variáveis de ambiente

```bash
# Caminho para o arquivo JSON de credenciais da Service Account
export GOOGLE_CREDENTIALS_FILE=/caminho/para/credentials.json

# ID da agenda do Google Calendar
export GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
```

#### 4. Executar

```bash
go run main.go
```

## Testes

```bash
go test ./internal/scheduling -v
```

Os testes garantem que:
- ✅ Agendamento é criado mesmo se a notificação falhar
- ✅ Notifier é chamado quando o agendamento é criado com sucesso
- ✅ Campos mínimos são validados antes de notificar

## Estrutura do Projeto

```
backend/
├── go.mod
├── main.go
├── README.md
└── internal/
    ├── notifications/
    │   ├── provider.go                    # Interface + struct da mensagem
    │   ├── mock_provider.go               # Provider para desenvolvimento
    │   └── google_calendar_provider.go    # Provider de produção
    └── scheduling/
        ├── service.go                     # Lógica de negócio
        └── service_test.go                # Testes unitários
```
