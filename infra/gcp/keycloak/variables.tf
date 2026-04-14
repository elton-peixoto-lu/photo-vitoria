variable "project_id" {
  type        = string
  description = "ID do projeto GCP."
}

variable "region" {
  type        = string
  description = "Regiao free-tier do Compute Engine."
  default     = "us-central1"
}

variable "zone" {
  type        = string
  description = "Zona free-tier do Compute Engine."
  default     = "us-central1-a"
}

variable "machine_type" {
  type        = string
  description = "Tipo de maquina free-tier."
  default     = "e2-micro"
}

variable "instance_name" {
  type        = string
  description = "Nome da VM Keycloak."
  default     = "photo-vitoria-keycloak"
}

variable "disk_size_gb" {
  type        = number
  description = "Tamanho do disco standard. 30GB fica dentro do Always Free."
  default     = 30
}

variable "keycloak_realm" {
  type        = string
  description = "Realm usado pelo portal admin."
  default     = "photo-vitoria"
}

variable "keycloak_client_id" {
  type        = string
  description = "Client publico usado pelo frontend."
  default     = "photo-vitoria-admin"
}

variable "keycloak_admin_user" {
  type        = string
  description = "Usuario admin inicial do Keycloak."
  default     = "admin"
}

variable "admin_email" {
  type        = string
  description = "Email para certificados Let's Encrypt via Caddy."
}

variable "allowed_ssh_cidrs" {
  type        = list(string)
  description = "CIDRs que podem acessar SSH. Vazio bloqueia SSH externo."
  default     = []
}

variable "secret_rotation_version" {
  type        = string
  description = "Altere este valor para rotacionar as senhas geradas pelo Terraform."
  default     = "v2"
}

variable "turnstile_site_key" {
  type        = string
  description = "Site key do Cloudflare Turnstile (nao e segredo)."
  default     = ""
}

variable "turnstile_secret_key_secret_id" {
  type        = string
  description = "Secret Manager secret_id que contem a secret key do Turnstile (payload)."
  default     = ""
}
