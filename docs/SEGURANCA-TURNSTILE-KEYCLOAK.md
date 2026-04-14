# Turnstile no login do Keycloak (server-side)

Este projeto adiciona Cloudflare Turnstile diretamente no **formulário real de login do Keycloak** (não no React).

## Visão geral

1. O tema `photo-vitoria` renderiza o widget Turnstile no `login.ftl`.
2. Um provider (Authentication SPI) substitui o autenticador padrão de usuário/senha e valida o token via siteverify **antes** de validar as credenciais.

## Arquivos principais

- Tema (login): `infra/gcp/keycloak/themes/photo-vitoria/login/login.ftl`
- Provider (SPI): `infra/gcp/keycloak/providers/turnstile-authenticator`
- Dockerfile do Keycloak customizado: `infra/gcp/keycloak/Dockerfile.keycloak`

## Configuração (variáveis)

- `TURNSTILE_SITE_KEY` (público; fica no HTML do login)
- `TURNSTILE_SECRET_KEY` (segredo; apenas no servidor Keycloak)
- opcionais:
  - `TURNSTILE_TIMEOUT_MS` (default `3500`)
  - `TURNSTILE_INCLUDE_REMOTE_IP` (default `false`)

## Como empacotar o provider em JAR

O build ocorre dentro do Dockerfile (não requer Maven instalado na VM):

- `docker build -f infra/gcp/keycloak/Dockerfile.keycloak .`

Se quiser buildar fora do Docker, use Maven (Java 17) dentro de `infra/gcp/keycloak/providers/turnstile-authenticator`.

## Como instalar no Keycloak (container/pod)

O `Dockerfile.keycloak` já faz:

- copia o JAR para `/opt/keycloak/providers/turnstile-authenticator.jar`
- copia o tema para `/opt/keycloak/themes/photo-vitoria`
- executa `/opt/keycloak/bin/kc.sh build`

## Como ativar no realm

### Tema

Admin Console → Realm Settings → Themes → **Login theme** = `photo-vitoria`

> No deploy GCP deste repositório isso já é aplicado no startup script.

### Flow (Browser)

1. Admin Console → Authentication → Flows
2. Copie o flow `browser` para um novo flow, ex: `browser-turnstile`
3. No novo flow, substitua o execution **Username Password Form** pelo provider:
   - `Username Password Form (Turnstile)`
4. Authentication → Bindings → **Browser Flow** = `browser-turnstile`

> Motivo: o token `cf-turnstile-response` vem junto com o POST de usuário/senha; por isso o provider substitui o formulário padrão.

## Teste local (Docker)

1. `cp infra/gcp/keycloak/.env.local.example infra/gcp/keycloak/.env.local`
2. Preencha `TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`
3. Suba: `docker compose -f infra/gcp/keycloak/compose.local.yml --env-file infra/gcp/keycloak/.env.local up --build`
4. Acesse `http://localhost:8080`

Checklist:
- Widget aparece na tela de login
- Sem resolver o Turnstile → login é bloqueado com mensagem
- Com Turnstile resolvido + credenciais válidas → login segue normal

## Produção (GCP VM + Terraform)

No módulo Terraform `infra/gcp/keycloak`:

- `turnstile_site_key` recebe o site key (não segredo)
- `turnstile_secret_key_secret_id` aponta para um secret existente no Secret Manager contendo o **secret key**

O startup script:
- faz `git clone` do repo
- builda a imagem Keycloak customizada
- injeta variáveis no container via `docker compose`

## Erros tratados (sem bypass)

- Token ausente → bloqueia login (`turnstileMissing`)
- Token inválido / success=false → bloqueia login (`turnstileFailed`)
- Timeout/rede/status != 2xx/resposta inválida → bloqueia login (`turnstileFailed`)
- Config ausente (site/secret) → bloqueia login (`turnstileMisconfigured`)

