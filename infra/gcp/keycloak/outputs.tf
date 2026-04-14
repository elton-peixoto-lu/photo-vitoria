output "keycloak_url" {
  value = "https://${local.keycloak_hostname}"
}

output "keycloak_issuer" {
  value = "https://${local.keycloak_hostname}/realms/${var.keycloak_realm}"
}

output "keycloak_admin_user" {
  value = var.keycloak_admin_user
}

output "keycloak_client_id" {
  value = var.keycloak_client_id
}

output "keycloak_initial_client_user" {
  value = "cliente"
}

output "keycloak_admin_password_secret" {
  value = google_secret_manager_secret.keycloak_admin_password.secret_id
}

output "external_ip" {
  value = google_compute_address.keycloak.address
}
