# JSX to TSX Auto-Converter with Type Generation

param(
    [string]$ComponentsPath = "src/components",
    [string]$ExcludePattern = "ui\\",
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

class ConversionStats {
    [int]$TotalFiles = 0
    [int]$SuccessfulConversions = 0
    [int]$SkippedFiles = 0
    [int]$FilesNeedingReview = 0
    [System.Collections.Generic.List[string]]$ConvertedFiles = @()
    [System.Collections.Generic.List[string]]$NeedsReview = @()
    [System.Collections.Generic.List[string]]$Errors = @()
}

$Stats = [ConversionStats]::new()

function Analyze-Imports {
    param([string]$Content)
    
    $imports = @{
        hooks = @()
        customHooks = @()
        contexts = @()
        radixUI = @()
        framerMotion = $false
    }
    
    $lines = $Content -split "`n"
    
    foreach ($line in $lines) {
        if ($line -match "useState") { $imports.hooks += "useState" }
        if ($line -match "useEffect") { $imports.hooks += "useEffect" }
        if ($line -match "useRef") { $imports.hooks += "useRef" }
        if ($line -match "useCallback") { $imports.hooks += "useCallback" }
        if ($line -match "useMemo") { $imports.hooks += "useMemo" }
        if ($line -match "framer-motion") { $imports.framerMotion = $true }
        if ($line -match "@radix-ui") { $imports.radixUI = $true }
    }
    
    return $imports
}

function Detect-EventHandlers {
    param([string]$Content)
    
    $handlers = @{
        onChange = $Content -match "onChange"
        onClick = $Content -match "onClick"
        onSubmit = $Content -match "onSubmit"
        onKeyDown = $Content -match "onKeyDown"
    }
    
    return $handlers
}

function Generate-TypeDefinition {
    param([string]$ComponentName, $Imports, $Handlers)
    
    $types = "// Type definitions for $ComponentName`n`n"
    $types += "interface ${ComponentName}Props {`n"
    $types += "  // Add prop types here`n"
    $types += "}`n`n"
    
    if ($Handlers.Values | Where-Object { $_ }) {
        $types += "// Event handler types`n"
        $types += "type HandleEvent = (e: React.SyntheticEvent<any>) => void;`n"
    }
    
    return $types
}

# Main execution
Write-Host "`nJSX to TSX Converter`n" -ForegroundColor Cyan

$jsxFiles = Get-ChildItem -Path $ComponentsPath -Recurse -File | 
    Where-Object { 
        $_.Extension -match '\.(jsx|js)$' -and 
        $_.FullName -notmatch $ExcludePattern
    }

$Stats.TotalFiles = $jsxFiles.Count
Write-Host "Found $($Stats.TotalFiles) JSX/JS files to process`n" -ForegroundColor Green

if ($Stats.TotalFiles -eq 0) {
    Write-Host "No files found." -ForegroundColor Yellow
    exit 0
}

$jsxFiles | ForEach-Object -Begin { $i = 0 } -Process {
    $i++
    $file = $_
    $componentName = $file.BaseName
    $txzPath = $file.FullName -replace '\.(jsx|js)$', '.tsx'
    
    if (Test-Path $txzPath) {
        Write-Host "[$i/$($Stats.TotalFiles)] SKIP: $($file.Name) (TSX exists)" -ForegroundColor Yellow
        $Stats.SkippedFiles++
        return
    }
    
    Write-Host "[$i/$($Stats.TotalFiles)] Processing: $($file.Name)" -ForegroundColor Cyan
    
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $imports = Analyze-Imports $content
        $handlers = Detect-EventHandlers $content
        $typeDefs = Generate-TypeDefinition $componentName $imports $handlers
        
        if (-not $DryRun) {
            $newContent = $typeDefs + "`n" + $content
            Set-Content -Path $txzPath -Value $newContent -Encoding UTF8
            Write-Host "  ✓ Created: $($file.BaseName).tsx" -ForegroundColor Green
            $Stats.SuccessfulConversions++
            $Stats.ConvertedFiles += $file.BaseName
            
            if ($Verbose) {
                Write-Host "    Hooks: $($imports.hooks -join ', ')" -ForegroundColor Gray
            }
        }
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $Stats.Errors += $file.BaseName
    }
}

# Summary
Write-Host "`nConversion Complete!`n" -ForegroundColor Cyan
Write-Host "Successfully converted: $($Stats.SuccessfulConversions)" -ForegroundColor Green
Write-Host "Skipped: $($Stats.SkippedFiles)" -ForegroundColor Yellow
Write-Host "Errors: $($Stats.Errors.Count)" -ForegroundColor Red

if ($Stats.ConvertedFiles.Count -gt 0) {
    Write-Host "`nConverted files:" -ForegroundColor Green
    $Stats.ConvertedFiles | ForEach-Object { Write-Host "  • $_" -ForegroundColor Green }
}

if ($Stats.NeedsReview.Count -gt 0) {
    Write-Host "`nFiles needing review:" -ForegroundColor Yellow
    $Stats.NeedsReview | ForEach-Object { Write-Host "  • $_" -ForegroundColor Yellow }
}

if ($Stats.Errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Red
    $Stats.Errors | ForEach-Object { Write-Host "  • $_" -ForegroundColor Red }
}
