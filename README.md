# Photo Vitoria

![Status](https://img.shields.io/badge/status-active-success)
![Production](https://img.shields.io/badge/production-GCP-4285F4)
![Frontend](https://img.shields.io/badge/frontend-React%2019-61DAFB)
![Admin](https://img.shields.io/badge/admin-Cloud%20Run-34A853)
![Auth](https://img.shields.io/badge/auth-Firebase%20Google-FFCA28)
![Media](https://img.shields.io/badge/media-GCS%20%2B%20Worker%20Go-0F9D58)
![Security](https://img.shields.io/badge/security-Turnstile%20%2B%20Signed%20URLs-111827)

Frontend institucional, portal administrativo e pipeline de mídia da Photo Vitoria, hoje operando no GCP.

## Visão geral

O repositório concentra quatro partes principais:

- site público em `React + Vite`
- portal administrativo de fotos em `/admin/galeria`
- APIs e gateways em `Cloud Run`
- worker de mídia em `Go` para processamento e publicação das imagens

A produção já está orientada ao alvo final:

- site público servido no GCP
- login administrativo via `Firebase Auth + Google`
- proteção anti-bot com `Cloudflare Turnstile`
- upload com `Signed URLs`
- mídia final em `Cloud Storage`
- índice remoto da galeria em `gallery-index.json`
- GitHub usado para código, não como caminho principal de publicação de fotos

## Arquitetura atual

### Fluxo público

1. o usuário acessa `https://www.estudiovitoriafreitas.com.br`
2. a borda entrega o frontend
3. o frontend consome a galeria pelo `media-gateway`
4. o `media-gateway` lê:
   - `images/galeria/**`
   - `gallery-index.json`
   no bucket final de mídia

### Fluxo do admin

1. a usuária entra em `/admin/galeria`
2. passa por `Turnstile`
3. faz login com Google via Firebase
4. o frontend pede ao `admin-api` uma `Signed URL`
5. o arquivo sobe para o bucket temporário privado
6. o `admin-api` confirma que o objeto existe
7. o `admin-api` chama o `image-worker`
8. o worker processa a imagem e publica no bucket final
9. o worker atualiza `gallery-index.json`
10. a nova foto passa a ser servida pelo `media-gateway`

### Desenho resumido

```text
[User]
  -> Cloud CDN / Load Balancer
    -> frontend-gateway (Cloud Run)
    -> media-gateway (Cloud Run)
         -> gs://photo-vitoria-gallery-prod
            - images/galeria/*
            - gallery-index.json

[Admin User]
  -> /admin/galeria
  -> Firebase Auth + Turnstile
  -> admin-api (Cloud Run)
      -> signed upload URL
      -> gs://photo-vitoria-upload-temp
      -> image-worker (Cloud Run, Go)
           -> AVIF + watermark
           -> gs://photo-vitoria-gallery-prod
           -> gallery-index.json
```

## Serviços e endpoints

### `frontend-gateway`

Responsabilidades:

- servir a SPA pública
- validar o Turnstile global do site

Endpoints:

- `POST /api/turnstile/verify`
- `GET /healthz`

### `admin-api`

Responsabilidades:

- validar sessão Firebase
- aplicar allowlist de e-mails
- validar Turnstile do admin
- emitir `Signed URL`
- disparar o worker de mídia

Endpoints:

- `POST /api/admin/turnstile-verify`
- `POST /api/admin/upload-url`
- `POST /api/admin/gallery-pr-manifest`
- `GET /`

Observação:

- `GET /` responde `200 {"ok":true}` e hoje funciona como health básico do serviço.

### `image-worker`

Responsabilidades:

- baixar imagem do bucket temporário
- processar AVIF
- aplicar watermark
- publicar mídia final
- atualizar `gallery-index.json`

Endpoints:

- `POST /process-manifest`
- `GET /health`

### `media-gateway`

Responsabilidades:

- servir imagens publicadas
- servir o índice remoto da galeria

Endpoints:

- `GET /images/...`
- `GET /gallery-index.json`
- `GET /healthz`

## Buckets

### Temporário

- `gs://photo-vitoria-upload-temp`
- privado
- recebe uploads brutos via `Signed URL`

### Final de mídia

- `gs://photo-vitoria-gallery-prod`
- armazena:
  - `images/galeria/**`
  - `gallery-index.json`

## Segurança

O portal e o fluxo de mídia operam com estas travas:

- login Google via Firebase
- allowlist em `ADMIN_ALLOWED_EMAILS`
- validação server-side do Turnstile
- bucket temporário privado
- `Signed URL` curta para upload
- verificação de existência do objeto antes do processamento
- worker protegido por token interno
- bucket final servido por gateway dedicado
- watermark aplicada na imagem publicada

## Stack principal

- `React 19`
- `Vite`
- `Firebase Auth`
- `Firebase Admin SDK`
- `Express`
- `Go`
- `Cloud Run`
- `Cloud Storage`
- `Cloud CDN`
- `HTTPS Load Balancer`
- `GitHub Actions`
- `Sharp`

## Estrutura importante

- `src/`: frontend público e tela administrativa atual
- `server/`: gateways e handlers Node/Express
- `backend/`: worker Go e backend de agendamento
- `scripts/`: utilitários de build, sync e testes
- `.github/workflows/`: deploys e automações
- `infra/gcp/`: infraestrutura como código e documentação de apoio
- `public/images/galeria/`: acervo legado local ainda útil como seed/teste

## Como rodar localmente

### Pré-requisitos

- Node.js 22+
- npm
- Go 1.24+

### Instalação

```bash
npm install
```

### Frontend local

```bash
npm run dev
```

### Admin API local

```bash
npm run admin-api
```

### Frontend gateway local

```bash
npm run server
```

### Worker Go local

```bash
cd backend
go run ./cmd/image-worker
```

## Scripts úteis

- `npm run dev`: frontend local
- `npm run build`: build de produção
- `npm run preview`: preview do build
- `npm run server`: frontend gateway local
- `npm run admin-api`: admin API local
- `npm run process:uploads`: processador legado local
- `npm run test:uploads`: testes do pipeline e loaders
- `npm run smoke:gcp`: smoke test da entrega pública

## Variáveis de ambiente

### Frontend

- `VITE_ADMIN_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_PUBLIC_TURNSTILE_SITE_KEY`
- `VITE_GALLERY_INDEX_FIRST`
- `VITE_MEDIA_BASE_URL`

### `admin-api`

- `TURNSTILE_SECRET_KEY`
- `ADMIN_ALLOWED_EMAILS`
- `ADMIN_ALLOWED_ORIGINS`
- `UPLOAD_TEMP_BUCKET`
- `FINAL_MEDIA_BUCKET`
- `FIREBASE_AUTH_PROJECT_ID`
- `SIGNED_UPLOAD_URL_EXPIRATION_SECONDS`
- `IMAGE_WORKER_URL`
- `IMAGE_WORKER_TOKEN`

### `image-worker`

- `PROCESSING_BUCKET`
- `FINAL_MEDIA_BUCKET`
- `GALLERY_INDEX_OBJECT`
- `WATERMARK_LOGO_PATH`
- `WORKER_AUTH_TOKEN`

## Workflows principais

### Deploy do frontend

- arquivo: `.github/workflows/deploy-frontend-gcp.yml`
- origem: `master`
- alvo: GCP produção

### Deploy do admin panel

- arquivo: `.github/workflows/deploy-admin.yml`
- publica:
  - `photo-vitoria-admin-panel`
  - `photo-vitoria-admin-api`

### Deploy do worker de mídia

- arquivo: `.github/workflows/deploy-image-worker.yml`
- publica:
  - `photo-vitoria-image-worker`

## Estado da migração

### Concluído

- runtime principal no GCP
- `frontend-gateway`, `admin-api`, `media-gateway` e `image-worker` em `Cloud Run`
- upload com `Signed URL`
- bucket temporário privado
- bucket final de mídia
- `gallery-index.json` remoto
- publicação de imagem fora do fluxo GitOps principal
- remoção do Vercel do caminho ativo de produção

### Em endurecimento contínuo

- padronização de health checks (`/healthz`, `/readyz`)
- ativação de `Cloud Armor` quando a quota permitir
- limpeza progressiva de dependências legadas ainda presentes no código-base

## Documentação complementar

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
- [docs/GUIA-PORTAL-ADMIN.md](docs/GUIA-PORTAL-ADMIN.md)
- [infra/gcp/image-upload/README.md](infra/gcp/image-upload/README.md)
- [backend/README.md](backend/README.md)
