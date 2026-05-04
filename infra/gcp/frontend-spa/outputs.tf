output "bucket_name" {
  value = google_storage_bucket.frontend.name
}

output "bucket_url" {
  value = google_storage_bucket.frontend.url
}

output "backend_bucket_name" {
  value = google_compute_backend_bucket.frontend.name
}

output "global_ip_address" {
  value = google_compute_global_address.frontend.address
}

output "https_lb_domains" {
  value = local.certificate_domains
}

output "cloud_armor_policy_name" {
  value = var.enable_cloud_armor ? google_compute_security_policy.frontend[0].name : null
}
