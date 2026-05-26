# sync_all_layouts_and_fonts.ps1
$gasFile = "d:\QC_APP\Index_GAS.html"
$returnFile = "d:\QC_APP\placeholders\return.html"
$statsHtmlFile = "d:\QC_APP\scratch\new_return_stats.html"

# --- 1. PROCESS Index_GAS.html FOR FONTS ---
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
    Write-Output "Processing return.html..."
    $retText = [System.IO.File]::ReadAllText($returnFile, [System.Text.Encoding]::UTF8)
    
    # Normalize to LF
    $retText = $retText.Replace("`r`n", "`n")
    
    # Replace Google Fonts link stylesheet in return.html
    $oldFontsLink = '<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />'
    $newFontsLink = '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />'
    $retText = $retText.Replace($oldFontsLink, $newFontsLink)

    # Replace body font family
    $retText = $retText.Replace("font-family: 'Google Sans', sans-serif;", "font-family: 'Plus Jakarta Sans', sans-serif;")

    # Replace glass-card styling block with clean solid cards matching Fabric Testing dashboard style
    $oldGlassCardStyle = "    /* Modern Glass Cards */`n    .glass-card {`n      background: rgba(255, 255, 255, 0.85);`n      backdrop-filter: blur(12px);`n      -webkit-backdrop-filter: blur(12px);`n      border: 1px solid rgba(226, 232, 240, 0.8);`n      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);`n      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`n    }`n    `n    .glass-card:hover {`n      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.06);`n    }"
    
    $newGlassCardStyle = "    /* Modern Solid Cards like Fabric Testing */`n    .glass-card {`n      background: #ffffff;`n      border: 1px solid #f1f5f9;`n      border-radius: 20px;`n      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02);`n      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`n    }`n    `n    .glass-card:hover {`n      transform: translateY(-2px);`n      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.05);`n      border-color: rgba(99, 102, 241, 0.2);`n    }"
    
    if ($retText.Contains($oldGlassCardStyle)) {
        $retText = $retText.Replace($oldGlassCardStyle, $newGlassCardStyle)
        Write-Output "Successfully updated glass-card styles!"
    }

    # Swap navigation tabs in HTML
    $oldTabsHtml = "      <!-- Navigation Tabs -->`n      <div class=\"flex bg-slate-200/60 p-1 rounded-xl self-start md:self-auto shrink-0\">`n        <button id=\"tab-input\" onclick=\"switchTab('input')\" class=\"px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all text-slate-700 bg-white shadow-sm\">`n          <i data-feather=\"edit-3\" class=\"w-3.5 h-3.5\"></i> 1. Nhập`n        </button>`n        <button id=\"tab-analysis\" onclick=\"switchTab('analysis')\" class=\"px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all text-slate-500 hover:text-slate-700\">`n          <i data-feather=\"bar-chart-2\" class=\"w-3.5 h-3.5\"></i> 2. Return Analysis`n        </button>`n      </div>"
    
    $newTabsHtml = "      <!-- Navigation Tabs -->`n      <div class=\"flex bg-slate-200/60 p-1 rounded-xl self-start md:self-auto shrink-0\">`n        <button id=\"tab-analysis\" onclick=\"switchTab('analysis')\" class=\"px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all text-slate-700 bg-white shadow-sm\">`n          <i data-feather=\"bar-chart-2\" class=\"w-3.5 h-3.5\"></i> 1. Return Analysis`n        </button>`n        <button id=\"tab-input\" onclick=\"switchTab('input')\" class=\"px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all text-slate-500 hover:text-slate-700\">`n          <i data-feather=\"edit-3\" class=\"w-3.5 h-3.5\"></i> 2. Input Data`n        </button>`n      </div>"

    if ($retText.Contains($oldTabsHtml)) {
        $retText = $retText.Replace($oldTabsHtml, $newTabsHtml)
        Write-Output "Successfully swapped navigation tabs!"
    }

    # Show dashboard and hide input by default
    $retText = $retText.Replace("<div id=`"content-input`" class=`"space-y-6`">", "<div id=`"content-input`" class=`"hidden space-y-6`">")
    $retText = $retText.Replace("<div id=`"content-analysis`" class=`"hidden space-y-6`">", "<div id=`"content-analysis`" class=`"space-y-6`">")

    # Replace the stats block HTML from new_return_stats.html
    if (Test-Path $statsHtmlFile) {
        $statsHtml = [System.IO.File]::ReadAllText($statsHtmlFile, [System.Text.Encoding]::UTF8)
        $statsHtml = $statsHtml.Replace("`r`n", "`n")
        
        $lines = $retText -split "`n"
        $newLines = @()
        $skip = $false
        $replacedKpis = $false
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            # Detect start of Stats / KPIs Grid block
            if ($line.Contains('<!-- Stats / KPIs Grid -->')) {
                $newLines += $line
                # Skip until the end of this grid row
                $skip = $true
                $newLines += $statsHtml
                $replacedKpis = $true
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
        
        if ($replacedKpis) {
            $retText = $newLines -join "`n"
            Write-Output "Successfully updated stats KPI block!"
        }
    }

    # --- 5. UPDATE JAVASCRIPT CODE IN return.html ---
    # Safe Defect Ratio color/icon switching Javascript
    $oldJsDefect = "      if (defectRatio > 25) {`n        // Trạng thái cảnh báo khi tỷ lệ lỗi vượt quá 25% (Tone màu pastel rose cực đẹp)`n        alertSubEl.textContent = `"⚠️ Cần phản hồi với nhà máy`\";`n        alertSubEl.className = `"text-[10px] font-black mt-0.5 tracking-wide text-rose-500 animate-pulse`\";`n        `n        iconContainerEl.className = `"p-4 bg-rose-100/50 text-rose-500 rounded-2xl shadow-sm shadow-rose-500/10`\";`n        iconEl.className = `"w-6 h-6`\";`n        iconEl.setAttribute(`"data-feather`\", `"alert-triangle`\");`n        glowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none`\";`n      } else {`n        // Trạng thái an toàn dưới hoặc bằng 25% (Tone màu pastel mint cực đẹp)`n        alertSubEl.textContent = `"✓ Tỷ lệ lỗi trong mức an toàn`\";`n        alertSubEl.className = `"text-[10px] font-black mt-0.5 tracking-wide text-emerald-500`\";`n        `n        iconContainerEl.className = `"p-4 bg-emerald-100/50 text-emerald-500 rounded-2xl shadow-sm shadow-emerald-500/10`\";`n        iconEl.className = `"w-6 h-6`\";`n        iconEl.setAttribute(`"data-feather`\", `"check-circle`\");`n        glowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none`\";`n      }"

    $newJsDefect = "      if (defectRatio > 25) {`n        alertSubEl.textContent = `"⚠️ Cần phản hồi với nhà máy`\";`n        alertSubEl.className = `"text-[9px] font-bold mt-1 tracking-wide text-rose-500 animate-pulse`\";`n        iconContainerEl.style.backgroundColor = `\"#fff1f2`\";`n        iconContainerEl.style.color = `\"#f43f5e`\";`n        iconEl.setAttribute(`"data-feather`\", `"alert-triangle`\");`n        if (glowEl) glowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none`\";`n      } else {`n        alertSubEl.textContent = `"✓ Tỷ lệ lỗi trong mức an toàn`\";`n        alertSubEl.className = `"text-[9px] font-bold mt-1 tracking-wide text-emerald-500`\";`n        iconContainerEl.style.backgroundColor = `\"#f0fdf4`\";`n        iconContainerEl.style.color = `\"#10b981`\";`n        iconEl.setAttribute(`"data-feather`\", `"check-circle`\");`n        if (glowEl) glowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none`\";`n      }"

    if ($retText.Contains($oldJsDefect)) {
        $retText = $retText.Replace($oldJsDefect, $newJsDefect)
        Write-Output "Successfully updated dynamic Defect JS!"
    }

    # Safe Supplier color/icon switching Javascript
    $oldJsSupplier1 = "          supplierCardEl.className = `"text-2xl font-extrabold text-rose-600 leading-none truncate max-w-[170px]`\";`n          supplierSubEl.className = `"text-[11px] text-rose-500 font-bold leading-none animate-pulse`\";`n          if (supplierContainerEl) supplierContainerEl.className = `"glass-card rounded-3xl p-6 flex items-center justify-between min-h-[142px] relative overflow-hidden`\";`n          if (supplierGlowEl) supplierGlowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none`\";`n          if (supplierIconContainerEl) supplierIconContainerEl.className = `"p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-sm shrink-0`\";"

    $newJsSupplier1 = "          supplierCardEl.className = `"text-2xl font-extrabold text-rose-600 leading-none truncate max-w-[170px]`\";`n          supplierSubEl.className = `"text-[10px] text-rose-500 font-bold leading-none animate-pulse mt-1`\";`n          if (supplierGlowEl) supplierGlowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none`\";`n          if (supplierIconContainerEl) {`n            supplierIconContainerEl.style.backgroundColor = `\"#fff1f2`\";`n            supplierIconContainerEl.style.color = `\"#f43f5e`\";`n          }"

    if ($retText.Contains($oldJsSupplier1)) {
        $retText = $retText.Replace($oldJsSupplier1, $newJsSupplier1)
        Write-Output "Successfully updated dynamic Supplier Alert JS!"
    }

    $oldJsSupplier2 = "          supplierCardEl.className = `"text-2xl font-extrabold text-slate-800 leading-none truncate max-w-[170px]`\";`n          supplierSubEl.className = `"text-[11px] text-slate-500 font-semibold leading-none`\";`n          if (supplierContainerEl) supplierContainerEl.className = `"glass-card rounded-3xl p-6 flex items-center justify-between min-h-[142px] relative overflow-hidden`\";`n          if (supplierGlowEl) supplierGlowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-slate-400/5 rounded-full blur-xl pointer-events-none`\";`n          if (supplierIconContainerEl) supplierIconContainerEl.className = `"p-4 bg-slate-100 text-slate-500 rounded-2xl shadow-sm shrink-0`\";"

    $newJsSupplier2 = "          supplierCardEl.className = `"text-2xl font-extrabold text-slate-800 leading-none truncate max-w-[170px]`\";`n          supplierSubEl.className = `"text-[10px] text-slate-400 font-semibold leading-none mt-1`\";`n          if (supplierGlowEl) supplierGlowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-slate-400/5 rounded-full blur-xl pointer-events-none`\";`n          if (supplierIconContainerEl) {`n            supplierIconContainerEl.style.backgroundColor = `\"#f8fafc`\";`n            supplierIconContainerEl.style.color = `\"#64748b`\";`n          }"

    if ($retText.Contains($oldJsSupplier2)) {
        $retText = $retText.Replace($oldJsSupplier2, $newJsSupplier2)
        Write-Output "Successfully updated dynamic Supplier Normal JS!"
    }

    $oldJsSupplier3 = "        supplierCardEl.className = `"text-2xl font-extrabold text-slate-500 leading-none truncate max-w-[170px]`\";`n        supplierSubEl.className = `"text-[11px] text-slate-400 font-semibold leading-none`\";`n        if (supplierContainerEl) supplierContainerEl.className = `"glass-card rounded-3xl p-6 flex items-center justify-between min-h-[142px] relative overflow-hidden`\";`n        if (supplierGlowEl) supplierGlowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-slate-500/5 rounded-full blur-xl pointer-events-none`\";`n        if (supplierIconContainerEl) supplierIconContainerEl.className = `"p-4 bg-slate-55 text-slate-400 rounded-2xl shadow-sm shrink-0`\";"

    # Fix possible typo from original (bg-slate-55 / bg-slate-50)
    $retText = $retText.Replace("bg-slate-55", "bg-slate-50")
    $oldJsSupplier3 = $oldJsSupplier3.Replace("bg-slate-55", "bg-slate-50")

    $newJsSupplier3 = "        supplierCardEl.className = `"text-2xl font-extrabold text-slate-500 leading-none truncate max-w-[170px]`\";`n        supplierSubEl.className = `"text-[10px] text-slate-400 font-semibold leading-none mt-1`\";`n        if (supplierGlowEl) supplierGlowEl.className = `"absolute -right-8 -bottom-8 w-24 h-24 bg-slate-500/5 rounded-full blur-xl pointer-events-none`\";`n        if (supplierIconContainerEl) {`n          supplierIconContainerEl.style.backgroundColor = `\"#f8fafc`\";`n          supplierIconContainerEl.style.color = `\"#64748b`\";`n        }"

    if ($retText.Contains($oldJsSupplier3)) {
        $retText = $retText.Replace($oldJsSupplier3, $newJsSupplier3)
        Write-Output "Successfully updated dynamic Supplier Blank JS!"
    }

    # Save processed return.html back with CRLF line endings
    [System.IO.File]::WriteAllText($returnFile, $retText.Replace("`n", "`r`n"), [System.Text.Encoding]::UTF8)
    Write-Output "return.html saved successfully!"
}

Write-Output "Layout and font sync completed successfully!"
