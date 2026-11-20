param(
  [Parameter(Mandatory=$true)][string]$ProjectRoot
)
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'package.json') -PathType Leaf)) { throw 'ProjectRoot harus menunjuk folder root KudapKita yang berisi package.json.' }
$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupRoot = Join-Path $ProjectRoot '.local-backups\storefront-refinement-20261118'
$Files = @('CHANGELOG.md','apps/web/src/areas/owner/operations/OwnerOperationsPages.tsx','apps/web/src/areas/storefront/components/BrandStorySection.tsx','apps/web/src/areas/storefront/components/BundleBuilder.tsx','apps/web/src/areas/storefront/components/CampaignCarousel.tsx','apps/web/src/areas/storefront/components/DemoBanner.tsx','apps/web/src/areas/storefront/components/ProductCard.tsx','apps/web/src/areas/storefront/layouts/StorefrontLayout.tsx','apps/web/src/areas/storefront/pages/CartPage.tsx','apps/web/src/areas/storefront/pages/CatalogPage.tsx','apps/web/src/areas/storefront/pages/CheckoutPage.tsx','apps/web/src/areas/storefront/pages/HomePage.tsx','apps/web/src/data/fixtures/starter-catalog.ts','apps/web/src/shared/styles/index.css','apps/web/src/shared/utils/product-image.ts','docs/audit/PROJECT_AUDIT_IMPLEMENTATION_2026-11-18.md','docs/catalog/KUDAPKITA_STARTER_CATALOG.md','docs/operations/IMPLEMENTATION_ROADMAP.md')
New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
foreach ($RelativePath in $Files) {
  $Source = Join-Path $PatchRoot $RelativePath
  $Target = Join-Path $ProjectRoot $RelativePath
  $Backup = Join-Path $BackupRoot $RelativePath
  if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "File patch tidak ditemukan: $RelativePath" }
  if ((Test-Path -LiteralPath $Target -PathType Leaf) -and -not (Test-Path -LiteralPath $Backup -PathType Leaf)) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Backup) | Out-Null
    Copy-Item -LiteralPath $Target -Destination $Backup -Force
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Target -Force
  Write-Host "Updated: $RelativePath" -ForegroundColor Green
}
Write-Host "Patch selesai. Backup tersimpan di: $BackupRoot" -ForegroundColor Cyan
