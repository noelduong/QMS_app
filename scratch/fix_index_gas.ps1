# fix_index_gas.ps1
$gasFile = "d:\QC_APP\Index_GAS.html"

if (-not (Test-Path $gasFile)) {
    Write-Error "File not found: $gasFile"
    exit 1
}

Write-Output "Reading Index_GAS.html..."
$text = [System.IO.File]::ReadAllText($gasFile, [System.Text.Encoding]::UTF8)

# Normalize line endings to LF
$text = $text.Replace("`r`n", "`n")

# Filter out the historyCounter block line-by-line to avoid string matching encoding issues
$lines = $text -split "`n"
$newLines = @()
$skip = $false
$removedCount = 0

foreach ($line in $lines) {
    if ($line.Contains('id="historyCounter"')) {
        $skip = $true
        $removedCount++
        continue
    }
    if ($skip) {
        if ($line.Contains('</div>')) {
            $skip = $false
        }
        continue
    }
    $newLines += $line
}
$text = $newLines -join "`n"
if ($removedCount -gt 0) {
    Write-Output "Successfully filtered out historyCounter block!"
} else {
    Write-Warning "Could not find historyCounter block."
}

# Safe toggleCleanView (ensure it's not already safe)
$tOld = "      function toggleCleanView() {`n        const checkbox = document.getElementById('cleanViewToggle');`n        checkbox.checked = !checkbox.checked;`n        handleToggleChange(checkbox.checked);`n      }"
$tNew = "      function toggleCleanView() {`n        const checkbox = document.getElementById('cleanViewToggle');`n        if (checkbox) {`n          checkbox.checked = !checkbox.checked;`n          handleToggleChange(checkbox.checked);`n        }`n      }"

if ($text.Contains($tOld)) {
    $text = $text.Replace($tOld, $tNew)
    Write-Output "Successfully updated toggleCleanView to be safe!"
} else {
    Write-Output "toggleCleanView already updated or safe."
}

# Safe resetForm checkbox toggle check
$cOld = "        const checkbox = document.getElementById('cleanViewToggle');`n        if (checkbox.checked) {`n          checkbox.checked = false;`n          handleToggleChange(false);`n        }"
$cNew = "        const checkbox = document.getElementById('cleanViewToggle');`n        if (checkbox && checkbox.checked) {`n          checkbox.checked = false;`n          handleToggleChange(false);`n        }"

if ($text.Contains($cOld)) {
    $text = $text.Replace($cOld, $cNew)
    Write-Output "Successfully updated resetForm cleanViewToggle check to be safe!"
} else {
    Write-Output "resetForm cleanViewToggle check already updated or safe."
}

# Write back to Index_GAS.html
Write-Output "Saving changes back to Index_GAS.html..."
[System.IO.File]::WriteAllText($gasFile, $text.Replace("`n", "`r`n"), [System.Text.Encoding]::UTF8)

# Compile Index_GAS.html into placeholders/fabric_testing.html by calling the compiler script
Write-Output "Compiling Index_GAS.html into placeholders/fabric_testing.html..."
& powershell -ExecutionPolicy Bypass -File d:\QC_APP\scratch\update_fabric_testing_ascii.ps1

Write-Output "All operations completed successfully!"
