locals {
  base_tags = tomap({
    "Created_with"    = "Terraform v1.7.4 on windows_amd64",
    "Created_on"      = "2024-03-05",
    "Initiated_by"    = "Manually",
    "GiHub_repo"      = "https://github.com/embergershared/rate-lang-v2",
    "Subscription"    = "s4",
    "Terraform_state" = "tfstates-446692-s4-spokes/rate-lang-poc"
  })
}
