locals {
  required_services = toset([
    "artifactregistry.googleapis.com",
    "billingbudgets.googleapis.com",
    "cloudbilling.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])
}

resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

data "google_project" "current" {
  project_id = var.project_id

  depends_on = [google_project_service.required]
}

resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = var.artifact_repository_id
  description   = "Imagens Docker do Photo Vitoria"
  format        = "DOCKER"

  depends_on = [google_project_service.required]
}

resource "google_service_account" "admin_api" {
  account_id   = "photo-vitoria-admin-api"
  display_name = "Photo Vitoria Admin API"

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret" "github_upload_token" {
  secret_id = "photo-vitoria-github-upload-token"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "github_upload_token" {
  secret      = google_secret_manager_secret.github_upload_token.id
  secret_data = var.github_upload_token
}

resource "google_secret_manager_secret_iam_member" "github_upload_token_access" {
  secret_id = google_secret_manager_secret.github_upload_token.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.admin_api.email}"
}

resource "google_cloud_run_v2_service" "admin_api" {
  name                = var.service_name
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.admin_api.email

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instance_count
    }

    containers {
      image = var.image

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }

        cpu_idle          = true
        startup_cpu_boost = false
      }

      env {
        name  = "ADMIN_ALLOWED_ORIGINS"
        value = var.admin_allowed_origins
      }

      env {
        name  = "KEYCLOAK_ISSUER"
        value = var.keycloak_issuer
      }

      env {
        name  = "KEYCLOAK_CLIENT_ID"
        value = var.keycloak_client_id
      }

      env {
        name  = "KEYCLOAK_ALLOWED_ROLES"
        value = var.keycloak_allowed_roles
      }

      env {
        name  = "GITHUB_REPO"
        value = var.github_repo
      }

      env {
        name  = "GITHUB_BASE_BRANCH"
        value = var.github_base_branch
      }

      env {
        name = "GITHUB_UPLOAD_TOKEN"

        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.github_upload_token.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [
    google_artifact_registry_repository.docker,
    google_secret_manager_secret_iam_member.github_upload_token_access,
  ]

  lifecycle {
    ignore_changes = [scaling]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  location = google_cloud_run_v2_service.admin_api.location
  name     = google_cloud_run_v2_service.admin_api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_billing_budget" "monthly" {
  count = var.billing_account != "" && var.monthly_budget_amount > 0 ? 1 : 0

  billing_account = var.billing_account
  display_name    = "photo-vitoria-admin-api-budget"

  budget_filter {
    projects = ["projects/${data.google_project.current.number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.monthly_budget_amount)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }

  threshold_rules {
    threshold_percent = 0.9
  }

  threshold_rules {
    threshold_percent = 1.0
  }

  all_updates_rule {
    monitoring_notification_channels = var.budget_notification_channels
    disable_default_iam_recipients   = false
  }

  depends_on = [google_project_service.required]

  lifecycle {
    ignore_changes = [all_updates_rule]
  }
}
