# Photo Vitoria - SPA (Cloudflare + jsDelivr)

SPA de fotografia com deploy estático no Cloudflare Pages.
As imagens são servidas diretamente do GitHub via jsDelivr.

## Arquitetura

- Frontend: React + Vite (SPA)
- Deploy: Cloudflare Pages
- Fotos: `cdn.jsdelivr.net/gh/elton-peixoto-lu/photo-vitoria@master/public/images/galeria/**`
- Índice das galerias: `gallery-index.json` no repositório

## Rodar local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy no Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: `Vite`

O arquivo `public/_redirects` já está configurado para SPA:

```txt
/* /index.html 200
```

## Variáveis opcionais

- `VITE_GALLERY_INDEX_URL`
- `VITE_GALLERY_MEDIA_BASE_URL`

Sem variáveis, o app usa jsDelivr por padrão.
