locals {
  required_services = toset([
    "storage.googleapis.com",
    "iamcredentials.googleapis.com",
  ])
}

resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "temp_uploads" {
  name                        = var.upload_bucket_name
  location                    = "US"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = var.temp_object_age_days
    }

    action {
      type = "Delete"
    }
  }

  dynamic "cors" {
    for_each = length(var.cors_origins) > 0 ? [1] : []

    content {
      origin          = var.cors_origins
      method          = ["PUT", "HEAD", "GET"]
      response_header = ["Content-Type", "x-goog-resumable"]
      max_age_seconds = 3600
    }
  }

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket_iam_member" "admin_api_object_admin" {
  bucket = google_storage_bucket.temp_uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.admin_api_service_account_email}"
}

resource "google_service_account_iam_member" "admin_api_token_creator" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.admin_api_service_account_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${var.admin_api_service_account_email}"
}
