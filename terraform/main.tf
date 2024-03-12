resource "azurerm_resource_group" "this" {
  name     = "rg-${var.loc_sub}-${var.res_suffix}"
  location = var.location

  tags = local.base_tags
}

resource "azurerm_storage_account" "this" {
  name                     = substr(replace("st-${var.loc_sub}-${var.res_suffix}", "-", ""), 0, 24)
  resource_group_name      = azurerm_resource_group.this.name
  location                 = azurerm_resource_group.this.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = local.base_tags
}
resource "azurerm_storage_container" "this" {
  name                  = "tfstates-446692-s4-spokes"
  storage_account_name  = azurerm_storage_account.this.name
  container_access_type = "private"
}

resource "azurerm_cognitive_account" "this" {
  name                = "spsvc-${var.loc_sub}-${var.res_suffix}"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  kind                = "SpeechServices"

  sku_name = "F0"

  lifecycle {
    ignore_changes = [
      network_acls,
    ]
  }

  tags = local.base_tags
}

resource "azurerm_service_plan" "this" {
  name                = "svcpl-${var.loc_sub}-${var.res_suffix}"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  os_type             = "Linux"
  sku_name            = "P1v3"

  worker_count           = 1
  zone_balancing_enabled = false

  tags = local.base_tags
}

resource "azurerm_linux_web_app" "this" {
  # name                                           = "lwebapp-${var.loc_sub}-${var.res_suffix}"
  name                                           = "rate-lang"
  resource_group_name                            = azurerm_resource_group.this.name
  location                                       = azurerm_resource_group.this.location
  service_plan_id                                = azurerm_service_plan.this.id
  ftp_publish_basic_authentication_enabled       = false
  https_only                                     = true
  webdeploy_publish_basic_authentication_enabled = false
  public_network_access_enabled                  = true

  app_settings = {
    "FLASK_APP"                       = "application.py"
    "FLASK_ENV"                       = "development"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"  = "1"
    "SPEECH_SERVICE_REGION"           = azurerm_cognitive_account.this.location
    "SPEECH_SERVICE_SUBSCRIPTION_KEY" = azurerm_cognitive_account.this.primary_access_key
  }

  site_config {
    always_on                         = true
    ftps_state                        = "FtpsOnly"
    ip_restriction_default_action     = "Allow"
    scm_ip_restriction_default_action = "Allow"
    application_stack {
      python_version = "3.12"
    }
    worker_count          = 1
    managed_pipeline_mode = "Integrated"
  }

  tags = local.base_tags
}

# Connection to GitHub repo/Actions
resource "azurerm_user_assigned_identity" "this" {
  name                = "uai-${var.loc_sub}-${var.res_suffix}-github"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
}
# resource "azurerm_app_service_source_control" "this" {
#   app_id   = azurerm_linux_web_app.this.id
#   repo_url = "https://github.com/embergershared/rate-lang-v2"
#   branch   = "main"
# }
