# Photo Vitoria

![Status](https://img.shields.io/badge/status-active-success) ![Production](https://img.shields.io/badge/production-GCP-4285F4) ![Staging](https://img.shields.io/badge/staging-Vercel-black) ![Frontend](https://img.shields.io/badge/frontend-React%2019-61DAFB) ![Build](https://img.shields.io/badge/build-Vite%203-646CFF) ![Auth](https://img.shields.io/badge/auth-Firebase%20Google-FFCA28) ![Backend](https://img.shields.io/badge/backend-Cloud%20Run-34A853) ![Images](https://img.shields.io/badge/images-GitOps%20current-blueviolet)

Frontend institucional e portal administrativo de upload para o acervo da Photo Vitoria.

## Visao geral

Este repositório concentra 3 responsabilidades:

- site público em `React + Vite`
- portal administrativo em `/admin/galeria`
- pipeline GitOps de imagens com processamento automático via GitHub Actions

Hoje a operação está organizada assim:

- `master`: produção no GCP
- `staging`: homologação na Vercel
- `admin-api`: backend do portal em `Cloud Run`
- imagens publicadas: ainda versionadas no Git e servidas pelo frontend estático

## Arquitetura atual

### Produção

- frontend estático em `Cloud Storage`
- borda em `Cloud CDN + HTTPS Load Balancer`
- backend admin em `Cloud Run`
- autenticação do portal com `Firebase Auth (Google Sign-In)`
- validação anti-bot com `Cloudflare Turnstile`

### Homologação

- branch `staging`
- deploy na Vercel por workflow dedicado

### Publicação de imagens

1. Usuário autorizado acessa `/admin/galeria`
2. Faz login com Google via Firebase
3. Resolve o Turnstile
4. Envia fotos para o `admin-api`
5. O backend cria uma branch `gallery-upload/...` e abre um PR
6. O workflow `process-pending-uploads.yml` otimiza os arquivos, atualiza o mapa local e tenta concluir o merge automaticamente
7. O deploy do frontend publica a nova versão do site

## Segurança do portal

O fluxo administrativo já está endurecido com as seguintes travas:

- allowlist por e-mail em `ADMIN_ALLOWED_EMAILS`
- exigência de e-mail verificado no Firebase
- validação server-side do Turnstile antes do login
- validação de galeria, extensão, MIME type e base64 no backend
- PR limitado a `uploads/pendentes/**`
- auto-merge restrito a branches seguras do portal (`gallery-upload/**`)
- processamento CI com conversão para AVIF e aplicação de marca d'água nas imagens publicadas

## Estado da migração para GCP

### Concluído

- frontend de produção provisionado no GCP
- bucket público do site criado
- `Cloud CDN` ativo
- `HTTPS Load Balancer` ativo
- deploy de `master` para GCS configurado em workflow
- staging isolado na Vercel
- `admin-api` em `Cloud Run`

### Pendente

- ativação do `Cloud Armor`
- motivo atual: quota do projeto `fotovitoria` está com `SECURITY_POLICIES = 0`
- migração futura das imagens para `Cloud Storage + Signed URLs`
- base inicial dessa fase já adicionada com bucket privado temporário e endpoint de emissão de Signed URL

## Stack principal

- `React 19`
- `Vite`
- `Firebase Auth`
- `Firebase Admin SDK`
- `Express`
- `GitHub Actions`
- `Google Cloud Run`
- `Google Cloud Storage`
- `Cloud CDN`
- `Cloud Load Balancer`

## Estrutura importante

- `src/`: frontend público e portal admin
- `server/`: backend Express e handlers do portal
- `public/images/galeria/`: imagens publicadas no site
- `uploads/pendentes/`: área temporária dos uploads antes do processamento
- `.github/workflows/`: automações de deploy e pipeline de imagens
- `infra/gcp/frontend-spa/`: Terraform da borda/frontend no GCP
- `infra/gcp/admin-api/`: Terraform e apoio do backend admin
- `infra/gcp/image-upload/`: bucket privado temporário para uploads com Signed URLs
- `docs/`: documentação complementar

## Como rodar localmente

### Pré-requisitos

- Node.js 22+
- npm

### Instalação

```bash
npm install
```

### Frontend

```bash
npm run dev
```

### Backend local opcional

```bash
npm run server
```

### Admin API local opcional

```bash
npm run admin-api
```

## Scripts úteis

- `npm run dev`: sobe o frontend local
- `npm run build`: gera o build de produção
- `npm run preview`: sobe preview do build
- `npm run server`: sobe a API Express local
- `npm run admin-api`: sobe o backend do portal admin
- `npm run process:uploads`: processa uploads pendentes localmente
- `npm run test:uploads`: testa o pipeline de processamento

## Variáveis de ambiente

### Frontend

- `VITE_ADMIN_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_TURNSTILE_SITE_KEY`

### Backend admin

- `TURNSTILE_SECRET_KEY`
- `ADMIN_ALLOWED_EMAILS`
- `GITHUB_REPO`
- `GITHUB_BASE_BRANCH`
- `GITHUB_UPLOAD_TOKEN`
- `UPLOAD_TEMP_BUCKET`
- `SIGNED_UPLOAD_URL_EXPIRATION_SECONDS`

## Deploys

### Produção

Workflow:
- `.github/workflows/deploy-frontend-gcp.yml`

Origem:
- branch `master`

Destino:
- bucket `photo-vitoria-site-prod`
- borda GCP provisionada em `infra/gcp/frontend-spa/`

### Staging

Workflow:
- `.github/workflows/deploy-frontend-vercel-staging.yml`

Origem:
- branch `staging`

Destino:
- projeto Vercel de homologação

### Portal / pipeline de imagens

Workflow:
- `.github/workflows/process-pending-uploads.yml`

Responsabilidades:
- validar escopo do PR
- otimizar imagens
- aplicar marca d'água no pipeline
- atualizar `src/localAssetsLoader.js`
- limpar `uploads/pendentes/`
- habilitar auto-merge quando o PR estiver no trilho seguro

## Infraestrutura GCP relevante

Projeto:
- `fotovitoria`

Região principal do backend:
- `us-central1`

Serviço do portal:
- `photo-vitoria-admin-api`

Bucket do frontend:
- `photo-vitoria-site-prod`

## Próxima fase planejada

A próxima evolução da arquitetura é retirar os binários de imagem do fluxo Git principal e mover uploads para `Cloud Storage` privado. A base inicial já foi criada no backend e na infraestrutura, com:

- upload temporário em GCS
- `Signed URLs`
- processamento assíncrono
- promoção para área pública após validação

Até lá, o fluxo GitOps atual continua sendo a fonte de verdade para publicação das fotos no site.
