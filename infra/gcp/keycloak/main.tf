locals {
  required_services = toset([
    "compute.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "secretmanager.googleapis.com",
  ])
}

resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "random_password" "keycloak_admin" {
  length  = 24
  special = true

  keepers = {
    rotation = var.secret_rotation_version
  }
}

resource "random_password" "postgres" {
  length  = 32
  special = true

  keepers = {
    rotation = var.secret_rotation_version
  }
}

resource "random_id" "caddy_domain" {
  byte_length = 4
}

resource "google_secret_manager_secret" "keycloak_admin_password" {
  secret_id = "photo-vitoria-keycloak-admin-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "keycloak_admin_password" {
  secret      = google_secret_manager_secret.keycloak_admin_password.id
  secret_data = random_password.keycloak_admin.result
}

resource "google_secret_manager_secret" "postgres_password" {
  secret_id = "photo-vitoria-keycloak-postgres-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "postgres_password" {
  secret      = google_secret_manager_secret.postgres_password.id
  secret_data = random_password.postgres.result
}

resource "google_compute_address" "keycloak" {
  name         = "${var.instance_name}-ip"
  region       = var.region
  address_type = "EXTERNAL"
  network_tier = "STANDARD"

  depends_on = [google_project_service.required]
}

locals {
  keycloak_hostname = "keycloak-${random_id.caddy_domain.hex}.${replace(google_compute_address.keycloak.address, ".", "-")}.sslip.io"
}

resource "google_compute_firewall" "keycloak_http_https" {
  name    = "${var.instance_name}-http-https"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["photo-vitoria-keycloak"]

  depends_on = [google_project_service.required]
}

resource "google_compute_firewall" "keycloak_ssh" {
  count   = length(var.allowed_ssh_cidrs) > 0 ? 1 : 0
  name    = "${var.instance_name}-ssh"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.allowed_ssh_cidrs
  target_tags   = ["photo-vitoria-keycloak"]

  depends_on = [google_project_service.required]
}

resource "google_service_account" "keycloak" {
  account_id   = var.instance_name
  display_name = "Photo Vitoria Keycloak VM"

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_iam_member" "keycloak_admin_password_accessor" {
  secret_id = google_secret_manager_secret.keycloak_admin_password.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.keycloak.email}"
}

resource "google_secret_manager_secret_iam_member" "postgres_password_accessor" {
  secret_id = google_secret_manager_secret.postgres_password.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.keycloak.email}"
}

resource "google_secret_manager_secret_iam_member" "turnstile_secret_accessor" {
  count     = var.turnstile_secret_key_secret_id != "" ? 1 : 0
  secret_id = var.turnstile_secret_key_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.keycloak.email}"
}

resource "google_compute_instance" "keycloak" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["photo-vitoria-keycloak"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = var.disk_size_gb
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"

    access_config {
      nat_ip       = google_compute_address.keycloak.address
      network_tier = "STANDARD"
    }
  }

  metadata = {
    google-logging-enabled    = "true"
    google-monitoring-enabled = "true"
    startup-script = templatefile("${path.module}/startup.sh.tftpl", {
      project_id                           = var.project_id
      admin_email                          = var.admin_email
      keycloak_hostname                    = local.keycloak_hostname
      keycloak_realm                       = var.keycloak_realm
      keycloak_client_id                   = var.keycloak_client_id
      keycloak_admin_user                  = var.keycloak_admin_user
      keycloak_admin_password_secret_id    = google_secret_manager_secret.keycloak_admin_password.secret_id
      keycloak_postgres_password_secret_id = google_secret_manager_secret.postgres_password.secret_id
      turnstile_site_key                   = var.turnstile_site_key
      turnstile_secret_key_secret_id       = var.turnstile_secret_key_secret_id
    })
  }

  service_account {
    email  = google_service_account.keycloak.email
    scopes = ["cloud-platform"]
  }

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  depends_on = [
    google_project_service.required,
    google_compute_firewall.keycloak_http_https,
    google_secret_manager_secret_iam_member.keycloak_admin_password_accessor,
    google_secret_manager_secret_iam_member.postgres_password_accessor,
    google_secret_manager_secret_iam_member.turnstile_secret_accessor,
  ]
}
