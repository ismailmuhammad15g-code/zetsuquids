# Get all files excluding ui/ folder
$srcPath = "src/components"
$allFiles = Get-ChildItem -Path $srcPath -Recurse -File | Where-Object { $_.FullName -notmatch "\\ui\\" }

# Separate .jsx/.js and .tsx files
$jsFiles = $allFiles | Where-Object { $_.Extension -match "\.(jsx|js)$" }
$tsxFiles = $allFiles | Where-Object { $_.Extension -eq ".tsx" }

# Find unique base names that have .tsx versions
$tsxBasenames = $tsxFiles | ForEach-Object { $_.BaseName } | Select-Object -Unique

# Find .jsx/.js files without .tsx versions
$jsWithoutTsx = $jsFiles | Where-Object { $_.BaseName -notin $tsxBasenames }

Write-Host "=== React Component TypeScript Conversion Analysis ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Total .jsx/.js files (excluding ui/): " -ForegroundColor Green
Write-Host "2. Total .tsx files (excluding ui/): " -ForegroundColor Green
Write-Host ""
Write-Host "3. Files remaining to convert (.jsx/.js without .tsx):" -ForegroundColor Yellow
Write-Host "   Count: " -ForegroundColor Cyan

if ($jsWithoutTsx.Count -gt 0) {
    Write-Host ""
    Write-Host "   Files to convert:" -ForegroundColor Yellow
    $jsWithoutTsx | Select-Object -ExpandProperty Name | Sort-Object | ForEach-Object { Write-Host "     - $_" }
}

Write-Host ""

# Calculate conversion percentage
$totalJsFiles = $jsFiles.Count
if ($totalJsFiles -gt 0) {
    $converted = $totalJsFiles - $jsWithoutTsx.Count
    $conversionPercent = [math]::Round(($converted / $totalJsFiles) * 100, 2)
    Write-Host "4. Conversion Statistics:" -ForegroundColor Yellow
    Write-Host "   Already have .tsx versions: $converted files"
    Write-Host "   Still need conversion:  files"
    Write-Host "   Conversion percentage: $conversionPercent%" -ForegroundColor Green
} else {
    Write-Host "4. No .jsx/.js files found to analyze" -ForegroundColor Yellow
}
