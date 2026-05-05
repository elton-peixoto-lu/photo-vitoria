# Upload temporario com GCS privado

Este modulo cria a base da próxima fase do portal:

- bucket privado para uploads temporarios
- expiracao automatica de objetos antigos
- permissao para o `admin-api` emitir `Signed URLs`

## Objetivo

Retirar o upload bruto do corpo da requisição HTTP do portal e migrar para:

1. frontend pede uma `Signed URL`
2. arquivo sobe direto para o bucket privado
3. backend recebe apenas metadados/confirmacao
4. processamento futuro promove o resultado para a área publicada

## Aplicação

```bash
cd infra/gcp/image-upload
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## Variáveis importantes

- `upload_bucket_name`: bucket privado temporario
- `admin_api_service_account_email`: service account do Cloud Run
- `cors_origins`: domínios autorizados para upload direto

## Integração com o backend

Depois do apply, configure no `admin-api`:

- `UPLOAD_TEMP_BUCKET`
- `SIGNED_UPLOAD_URL_EXPIRATION_SECONDS`

Endpoint preparado:

- `POST /api/admin/upload-url`

Esse endpoint já retorna uma `Signed URL` v4 para `PUT` direto no bucket.
