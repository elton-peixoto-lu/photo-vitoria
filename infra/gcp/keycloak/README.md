# Keycloak no GCP Free Tier

Este Terraform sobe Keycloak em uma VM `e2-micro` com disco `pd-standard` de 30GB em `us-central1`, usando Docker Compose com:

- Keycloak
- Postgres local
- Caddy para HTTPS via `sslip.io`

O desenho prioriza custo controlado/free tier. Para alto volume ou producao critica, prefira Cloud SQL ou um servico gerenciado de identidade.

## Deploy

```bash
cd infra/gcp/keycloak
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

## Turnstile (anti-bot) no login

Este deploy usa uma imagem Keycloak customizada (build no boot) com:

- tema de login `photo-vitoria` (renderiza o widget Turnstile)
- provider SPI que valida Turnstile server-side via siteverify antes de validar usuário/senha

Variáveis Terraform:

- `turnstile_site_key` (não é segredo)
- `turnstile_secret_key_secret_id` (um Secret Manager `secret_id` existente com a secret key)

Guia completo: `docs/SEGURANCA-TURNSTILE-KEYCLOAK.md`.

## Outputs importantes

- `keycloak_url`
- `keycloak_issuer`
- `keycloak_client_id`
- `keycloak_admin_password_secret`

Use `keycloak_issuer` no Cloud Run (`KEYCLOAK_ISSUER`) e `keycloak_url` no frontend (`VITE_KEYCLOAK_URL`).
