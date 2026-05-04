locals {
  required_services = toset([
    "certificatemanager.googleapis.com",
    "compute.googleapis.com",
    "dns.googleapis.com",
    "networksecurity.googleapis.com",
    "storage.googleapis.com",
  ])

  certificate_domains = distinct(concat([var.main_domain], var.additional_domains))
}

resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "frontend" {
  name                        = var.bucket_name
  location                    = "US"
  force_destroy               = false
  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  versioning {
    enabled = var.enable_versioning
  }

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_compute_backend_bucket" "frontend" {
  name        = "${var.site_name}-backend"
  bucket_name = google_storage_bucket.frontend.name
  enable_cdn  = true
  edge_security_policy = var.enable_cloud_armor ? google_compute_security_policy.frontend[0].id : null

  custom_response_headers = [
    "X-Frame-Options: SAMEORIGIN",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin"
  ]

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
    client_ttl  = 3600
  }
}

resource "google_compute_security_policy" "frontend" {
  count       = var.enable_cloud_armor ? 1 : 0
  name        = "${var.site_name}-armor"
  description = "Protecao basica do frontend estatico."

  rule {
    priority = 1000

    action = "throttle"

    match {
      versioned_expr = "SRC_IPS_V1"

      config {
        src_ip_ranges = ["*"]
      }
    }

    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"

      rate_limit_threshold {
        count        = var.armor_rate_limit_count
        interval_sec = var.armor_rate_limit_interval_sec
      }

      enforce_on_key = "IP"
    }

    description = "Rate limiting basico por IP"
  }

  rule {
    priority = 2147483647
    action   = "allow"

    match {
      versioned_expr = "SRC_IPS_V1"

      config {
        src_ip_ranges = ["*"]
      }
    }

    description = "Fallback allow"
  }
}

resource "google_compute_url_map" "frontend" {
  name            = "${var.site_name}-urlmap"
  default_service = google_compute_backend_bucket.frontend.id
}

resource "google_compute_url_map" "frontend_http_redirect" {
  name = "${var.site_name}-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_managed_ssl_certificate" "frontend" {
  name = "${var.site_name}-cert"

  managed {
    domains = local.certificate_domains
  }
}

resource "google_compute_target_https_proxy" "frontend" {
  name             = "${var.site_name}-https-proxy"
  url_map          = google_compute_url_map.frontend.id
  ssl_certificates = [google_compute_managed_ssl_certificate.frontend.id]
}

resource "google_compute_target_http_proxy" "frontend_redirect" {
  name    = "${var.site_name}-http-proxy"
  url_map = google_compute_url_map.frontend_http_redirect.id
}

resource "google_compute_global_address" "frontend" {
  name = "${var.site_name}-ip"
}

resource "google_compute_global_forwarding_rule" "frontend_https" {
  name                  = "${var.site_name}-https"
  ip_address            = google_compute_global_address.frontend.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.frontend.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_compute_global_forwarding_rule" "frontend_http" {
  name                  = "${var.site_name}-http"
  ip_address            = google_compute_global_address.frontend.address
  port_range            = "80"
  target                = google_compute_target_http_proxy.frontend_redirect.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
