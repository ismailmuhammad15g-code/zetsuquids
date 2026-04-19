$srcPath = "src/components"
$jsFiles = Get-ChildItem -Path $srcPath -Recurse -File | Where-Object { $_.Extension -match "\.(jsx|js)$" -and $_.FullName -notmatch "\\ui\\" }
$tsxFiles = Get-ChildItem -Path $srcPath -Recurse -File | Where-Object { $_.Extension -eq ".tsx" }

$jsWithoutTsx = @()
foreach ($jsFile in $jsFiles) {
    $basePath = $jsFile.FullName -replace "\.(jsx|js)$", ""
    $tsxPath = $basePath + ".tsx"
    if (-not (Test-Path $tsxPath)) {
        $jsWithoutTsx += $jsFile
    }
}

Write-Host "1. Total .jsx/.js files (excluding ui/): 0"
Write-Host "2. Total .tsx files: 0"
Write-Host "3. Files without .tsx versions: 0"
if ($jsFiles.Count -gt 0) {
    $converted = $jsFiles.Count - $jsWithoutTsx.Count
    $percent = [math]::Round(($converted / $jsFiles.Count) * 100, 2)
    Write-Host "4. Conversion percentage: $percent%"
}
