# Admin New (SvelteKit 2)

Painel administrativo do Photo Vitoria com login via Firebase Auth e proteção de acesso com Cloudflare Turnstile validado no backend SvelteKit.

## Stack
- SvelteKit 2
- Firebase Authentication (Email/Senha)
- Cloudflare Turnstile (token validado server-side)

## Configuração
1. Copie `admin-new/.env.example` para `admin-new/.env`.
2. Preencha credenciais do Firebase e chaves do Turnstile.
3. Rode:

```bash
cd admin-new
npm install
npm run dev
```

## Migração Keycloak -> Firebase (GCP)

### 1) Projeto Firebase/GCP
- Acesse console Firebase e selecione o projeto GCP da sua conta `pluizelton@gmail.com`.
- Ative `Authentication`.
- Habilite provider `Email/Password`.
- Crie app Web e copie as variáveis `VITE_FIREBASE_*`.

### 2) Usuários administrativos
- Crie usuários admin em `Authentication > Users`.
- Recomendado: usar e-mails corporativos e MFA (quando aplicável).

### 3) Turnstile
- Criar site key e secret key no Cloudflare Turnstile para o domínio do admin.
- `VITE_TURNSTILE_SITE_KEY` fica no frontend.
- `TURNSTILE_SECRET_KEY` fica somente no servidor.

### 4) Segurança
- O token Turnstile é validado em `src/routes/api/auth/turnstile/+server.js`.
- Sem validação de captcha, o login não continua para o Firebase.
- Nunca exponha `TURNSTILE_SECRET_KEY` no cliente.

## Artefatos entregues nesta migração
- Endpoint server-side de validação Turnstile.
- Login integrado com Firebase Auth + bloqueio por Turnstile.
- Variáveis de ambiente padronizadas para GCP/Firebase.
