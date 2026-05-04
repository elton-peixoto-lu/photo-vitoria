variable "project_id" {
  description = "ID do projeto GCP."
  type        = string
}

variable "region" {
  description = "Regiao principal para recursos auxiliares."
  type        = string
  default     = "us-central1"
}

variable "site_name" {
  description = "Nome base dos recursos do frontend."
  type        = string
  default     = "photo-vitoria-site"
}

variable "bucket_name" {
  description = "Nome global do bucket publico que servira o build do SPA."
  type        = string
}

variable "main_domain" {
  description = "Dominio principal do frontend."
  type        = string
}

variable "additional_domains" {
  description = "Dominios extras cobertos pelo certificado HTTPS."
  type        = list(string)
  default     = []
}

variable "enable_versioning" {
  description = "Habilita versionamento no bucket do frontend."
  type        = bool
  default     = true
}

variable "enable_cloud_armor" {
  description = "Ativa Cloud Armor no backend bucket quando a quota do projeto permitir."
  type        = bool
  default     = false
}

variable "armor_rate_limit_count" {
  description = "Limite de requests por IP na regra de rate limiting."
  type        = number
  default     = 300
}

variable "armor_rate_limit_interval_sec" {
  description = "Janela em segundos da regra de rate limiting."
  type        = number
  default     = 60
}
