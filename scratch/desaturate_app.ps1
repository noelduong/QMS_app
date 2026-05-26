# desaturate_app.ps1
# This script automatically scans and desaturates all HTML pages and the main stylesheet by injecting "filter: saturate(0.8) !important;"

$files = @(
    "d:\QC_APP\style.css",
    "d:\QC_APP\Index_GAS.html",
    "d:\QC_APP\placeholders\overall.html",
    "d:\QC_APP\placeholders\final_result.html",
    "d:\QC_APP\placeholders\inline_result.html",
    "d:\QC_APP\placeholders\return.html",
    "d:\QC_APP\placeholders\feedback.html",
    "d:\QC_APP\placeholders\fabric_testing.html",
    "d:\QC_APP\placeholders\plan.html",
    "d:\QC_APP\inspection_form\index.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Output "Processing $file..."
        $content = Get-Content $file -Raw -Encoding utf8
        
        # Check if filter: saturate is already present to prevent double insertion
        if ($content -match "saturate\(") {
            Write-Output "Already desaturated: $file"
            continue
        }

        # For style.css
        if ($file.EndsWith(".css")) {
            $newContent = $content -replace "body\s*\{", "body {`n  filter: saturate(0.8) !important;"
        } else {
            # For HTML files
            $newContent = $content -replace "body\s*\{", "body {`n      filter: saturate(0.8) !important;"
        }

        # Write back to file preserving UTF8 signature (BOM) for compatibility
        [System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
        Write-Output "Successfully desaturated: $file"
    } else {
        Write-Warning "File not found: $file"
    }
}
