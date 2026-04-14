# Admin API no GCP Cloud Run

Este Terraform publica apenas o backend do portal admin no GCP Cloud Run. O frontend continua chamando `VITE_ADMIN_API_URL`, que deve apontar para a URL do Cloud Run.

## Arquitetura

- Cloud Run com `min_instance_count = 0` e `max_instance_count = 1`.
- Secret Manager para `GITHUB_UPLOAD_TOKEN`.
- Artifact Registry para a imagem Docker.
- IAM publico no Cloud Run (`allUsers` com `roles/run.invoker`) porque a autenticacao real e feita pelo JWT do Keycloak dentro da aplicacao.
- Budget opcional para alertas de custo.

## Build da imagem

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
docker build -f Dockerfile.admin-api -t us-central1-docker.pkg.dev/fotovitoria/photo-vitoria/admin-api:latest .
docker push us-central1-docker.pkg.dev/fotovitoria/photo-vitoria/admin-api:latest
```

## Terraform

```bash
cd infra/gcp/admin-api
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Depois do apply, copie o output `cloud_run_url` para `VITE_ADMIN_API_URL` no deploy do frontend.

## Controle de custo

Para custo controlado, mantenha:

- `min_instance_count = 0`
- `max_instance_count = 1`
- `region = "us-central1"` se quiser priorizar free tier/custo
- `monthly_budget_amount` baixo, por exemplo `5`

Se preferir menor latencia no Brasil, troque `region` para `southamerica-east1`, sabendo que isso pode ter custo diferente.
