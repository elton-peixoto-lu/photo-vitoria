# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY go.mod ./

# Copia o código fonte
COPY . .

RUN go mod tidy

# Build do binário
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./main.go

# Final stage
FROM alpine:latest

WORKDIR /root/

# Instala certificados CA e dados de fuso horário
RUN apk --no-cache add ca-certificates tzdata

# Copia o binário e as credenciais do builder
COPY --from=builder /app/main .
COPY --from=builder /app/credentials.json .

# O Cloud Run passa a porta via variável de ambiente PORT
ENV PORT 8080

EXPOSE 8080

CMD ["./main"]
