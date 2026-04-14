variable "project_id" {
  description = "ID do projeto GCP."
  type        = string
}

variable "region" {
  description = "Regiao do Cloud Run. us-central1 costuma ser melhor para custo/free tier; southamerica-east1 reduz latencia no Brasil."
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Nome do servico Cloud Run."
  type        = string
  default     = "photo-vitoria-admin-api"
}

variable "artifact_repository_id" {
  description = "Repositorio Docker no Artifact Registry."
  type        = string
  default     = "photo-vitoria"
}

variable "image" {
  description = "Imagem Docker do admin API. Ex: us-central1-docker.pkg.dev/PROJECT/photo-vitoria/admin-api:latest"
  type        = string
}

variable "admin_allowed_origins" {
  description = "Origins permitidas no CORS do admin, separadas por virgula."
  type        = string
}

variable "keycloak_issuer" {
  description = "Issuer do realm Keycloak. Ex: https://keycloak.exemplo.com/realms/photo-vitoria"
  type        = string
}

variable "keycloak_client_id" {
  description = "Client ID do Keycloak usado pelo portal admin."
  type        = string
}

variable "keycloak_allowed_roles" {
  description = "Roles permitidas, separadas por virgula. Deixe vazio para aceitar qualquer usuario autenticado do client/realm."
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "Repositorio alvo para abrir PR."
  type        = string
  default     = "elton-peixoto-lu/photo-vitoria"
}

variable "github_base_branch" {
  description = "Branch base do PR."
  type        = string
  default     = "master"
}

variable "github_upload_token" {
  description = "Token GitHub com permissao para criar branch, escrever arquivos e abrir PR."
  type        = string
  sensitive   = true
}

variable "max_instance_count" {
  description = "Teto de instancias para controle de custo."
  type        = number
  default     = 1
}

variable "billing_account" {
  description = "Billing account para criar budget. Opcional. Formato: XXXXXX-XXXXXX-XXXXXX"
  type        = string
  default     = ""
}

variable "monthly_budget_amount" {
  description = "Valor mensal do budget em USD. 0 desativa budget."
  type        = number
  default     = 5
}

variable "budget_notification_channels" {
  description = "IDs de notification channels para alertas de budget."
  type        = list(string)
  default     = []
}
