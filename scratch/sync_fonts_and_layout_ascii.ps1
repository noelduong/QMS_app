# sync_fonts_and_layout_ascii.ps1
$gasFile = "d:\QC_APP\Index_GAS.html"
$returnFile = "d:\QC_APP\placeholders\return.html"
$kpiSourceFile = "d:\QC_APP\scratch\new_return_kpis.html"

# --- 1. PROCESS Index_GAS.html ---
if (Test-Path $gasFile) {
    Write-Output "Reading and processing Index_GAS.html for font synchronization..."
    $gasText = [System.IO.File]::ReadAllText($gasFile, [System.Text.Encoding]::UTF8)
    
    # Replace link element
    $oldLink = '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />'
    $newLink = '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />'
    $gasText = $gasText.Replace($oldLink, $newLink)

    # Replace Outfit font references
    $gasText = $gasText.Replace("'Outfit', sans-serif", "'Plus Jakarta Sans', sans-serif")
    $gasText = $gasText.Replace("'Outfit'", "'Plus Jakarta Sans'")
    
    # Replace Google Sans inside chart config
    $gasText = $gasText.Replace("family: 'Google Sans'", "family: 'Plus Jakarta Sans'")

    [System.IO.File]::WriteAllText($gasFile, $gasText, [System.Text.Encoding]::UTF8)
    Write-Output "Index_GAS.html processed successfully!"
} else {
    Write-Warning "Index_GAS.html not found."
}

# --- 2. COMPILE Index_GAS.html to fabric_testing.html ---
Write-Output "Re-compiling fabric_testing.html..."
& powershell -ExecutionPolicy Bypass -File d:\QC_APP\scratch\update_fabric_testing_ascii.ps1

# --- 3. SYNC TO Index.html ---
if (Test-Path "d:\QC_APP\placeholders\fabric_testing.html") {
    Write-Output "Syncing compiled fabric_testing.html to placeholders/Index.html..."
    Copy-Item "d:\QC_APP\placeholders\fabric_testing.html" "d:\QC_APP\placeholders\Index.html" -Force
}

# --- 4. PROCESS placeholders/return.html ---
if (Test-Path $returnFile) {
    Write-Output "Processing return.html for layout & font synchronization..."
    $retText = [System.IO.File]::ReadAllText($returnFile, [System.Text.Encoding]::UTF8)
    
    # Normalize to LF
    $retText = $retText.Replace("`r`n", "`n")
    
    # Update glass-card styling to be solid white card with border and shadow to match Fabric Testing cards
    $oldGlassCardStyle = "    /* Modern Glass Cards */`n    .glass-card {`n      background: rgba(255, 255, 255, 0.85);`n      backdrop-filter: blur(12px);`n      -webkit-backdrop-filter: blur(12px);`n      border: 1px solid rgba(226, 232, 240, 0.8);`n      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);`n      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`n    }`n    `n    .glass-card:hover {`n      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.06);`n    }"
    
    $newGlassCardStyle = "    /* Modern Solid Cards like Fabric Testing */`n    .glass-card {`n      background: #ffffff;`n      border: 1px solid #f1f5f9;`n      border-radius: 20px;`n      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02);`n      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`n    }`n    `n    .glass-card:hover {`n      transform: translateY(-2px);`n      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.05);`n      border-color: rgba(99, 102, 241, 0.2);`n    }"
    
    if ($retText.Contains($oldGlassCardStyle)) {
        $retText = $retText.Replace($oldGlassCardStyle, $newGlassCardStyle)
        Write-Output "Successfully updated .glass-card styling inside return.html!"
    } else {
        Write-Warning "Could not find original .glass-card style block in return.html."
    }

    # Replace the gradient stats grid with the premium flat white cards loaded from new_return_kpis.html
    if (Test-Path $kpiSourceFile) {
        $newKpisHtml = [System.IO.File]::ReadAllText($kpiSourceFile, [System.Text.Encoding]::UTF8)
        $newKpisHtml = $newKpisHtml.Replace("`r`n", "`n")
        
        $lines = $retText -split "`n"
        $newLines = @()
        $skip = $false
        $replacedStats = $false
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            # Detect start of Stats / KPIs Grid block
            if ($line.Contains('<!-- Stats / KPIs Grid -->')) {
                $newLines += $line
                # Skip until the end of this grid row (which is at the closing div before Actionable Insights)
                $skip = $true
                $newLines += $newKpisHtml
                $replacedStats = $true
                continue
            }
            
            if ($skip) {
                # Find the closing grid row div
                if ($line.Trim() -eq '</div>' -and $lines[$i+1].Contains('<!-- Actionable Insights Dashboard -->')) {
                    $skip = $false
                }
                continue
            }
            
            $newLines += $line
        }
        
        if ($replacedStats) {
            $retText = $newLines -join "`n"
            Write-Output "Successfully updated KPIs grid inside return.html!"
        } else {
            Write-Warning "Could not find KPIs grid inside return.html."
        }
    } else {
        Write-Error "new_return_kpis.html source file not found."
    }
    
    # Save processed return.html back with CRLF line endings
    [System.IO.File]::WriteAllText($returnFile, $retText.Replace("`n", "`r`n"), [System.Text.Encoding]::UTF8)
    Write-Output "return.html saved successfully!"
} else {
    Write-Warning "return.html not found."
}

Write-Output "All sync and layout tasks successfully executed!"
