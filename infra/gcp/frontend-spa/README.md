# Frontend SPA no GCP

Este modulo publica o frontend React/Vite como SPA estatica com:

- `Cloud Storage` para armazenar o `dist/`
- `Cloud CDN` na frente do bucket
- `HTTPS Load Balancer` global
- `Cloud Armor` para rate limiting basico
- certificado HTTPS gerenciado pelo GCP

## Arquitetura

```text
Usuario
  -> Cloud CDN
  -> HTTPS Load Balancer
  -> Cloud Armor
  -> Backend Bucket (Cloud Storage)
```

O rewrite de SPA e resolvido no bucket website:

- `index.html` como pagina principal
- `index.html` como fallback de not found

## Aplicar infraestrutura

```bash
cd infra/gcp/frontend-spa
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Depois do apply:

1. pegue o output `global_ip_address`
2. aponte `A` de `estudiovitoriafreitas.com.br` e `www` para esse IP
3. aguarde o certificado gerenciado ficar `ACTIVE`

## Deploy do frontend

O build continua vindo do repositório Git.

```bash
npm install
npm run build
gcloud storage rsync dist gs://SEU_BUCKET --recursive --delete-unmatched-destination-objects
```

## Observacoes

- O bucket serve apenas arquivos publicos do site.
- O `admin-api` continua em `Cloud Run`.
- As imagens continuam no Git e no build do site, sem mudar a logica atual de PR/processamento.
