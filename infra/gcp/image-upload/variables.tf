variable "project_id" {
  description = "ID do projeto GCP."
  type        = string
}

variable "region" {
  description = "Regiao principal usada para recursos auxiliares."
  type        = string
  default     = "us-central1"
}

variable "upload_bucket_name" {
  description = "Bucket privado para uploads temporarios."
  type        = string
}

variable "admin_api_service_account_email" {
  description = "Service account usada pelo admin-api no Cloud Run."
  type        = string
}

variable "cors_origins" {
  description = "Origins permitidas para upload direto no bucket."
  type        = list(string)
  default     = []
}

variable "temp_object_age_days" {
  description = "Dias para expirar uploads temporarios nao processados."
  type        = number
  default     = 7
}
