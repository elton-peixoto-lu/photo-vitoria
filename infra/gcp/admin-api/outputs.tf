output "artifact_registry_repository" {
  value = google_artifact_registry_repository.docker.name
}

output "cloud_run_url" {
  value = google_cloud_run_v2_service.admin_api.uri
}

output "service_account_email" {
  value = google_service_account.admin_api.email
}
