# sync_fonts_and_layout.ps1
$gasFile = "d:\QC_APP\Index_GAS.html"
$returnFile = "d:\QC_APP\placeholders\return.html"

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
    
    # Replace Google Sans in chart Config
    $gasText = $gasText.Replace("family: 'Google Sans'", "family: 'Plus Jakarta Sans'")
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

    # Replace the gradient stats grid with the premium flat white cards that perfectly match Fabric Testing
    $lines = $retText -split "`n"
    $newLines = @()
    $skip = $false
    $replacedStats = $false
    
    # Construct the dong sign character dynamically using UTF-8 bytes to avoid PowerShell compile issues
    $dongBytes = @(226, 130, 171) # UTF-8 representation of ₫
    $dongStr = [System.Text.Encoding]::UTF8.GetString($dongBytes)
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Detect start of Stats / KPIs Grid block
        if ($line.Contains('<!-- Stats / KPIs Grid -->')) {
            $newLines += $line
            # Skip until the end of this grid row (which is at the closing div before Actionable Insights)
            $skip = $true
            
            # Insert the new synchronized KPIs grid matching fabric testing's card design
            $newKpis = '      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">' + "`n" +
                       '        ' + "`n" +
                       '        <!-- Total Quantity KPI -->' + "`n" +
                       '        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]">' + "`n" +
                       '          <div class="flex flex-col justify-between h-[72px]">' + "`n" +
                       '            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tổng sản phẩm lỗi</span>' + "`n" +
                       '            <div class="text-2xl font-extrabold text-slate-800" id="stat-total-qty">0</div>' + "`n" +
                       '            <span class="text-[10px] text-slate-400 font-semibold">Sản phẩm bị lỗi trả về</span>' + "`n" +
                       '          </div>' + "`n" +
                       '          <div class="w-12 h-12 rounded-[14px] bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100/50">' + "`n" +
                       '            <i data-feather="package" class="w-5 h-5"></i>' + "`n" +
                       '          </div>' + "`n" +
                       '        </div>' + "`n" +
                       '' + "`n" +
                       '        <!-- Total Financial Value KPI -->' + "`n" +
                       '        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]">' + "`n" +
                       '          <div class="flex flex-col justify-between h-[72px]">' + "`n" +
                       '            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Thiệt hại tài chính</span>' + "`n" +
                       '            <div class="text-xl font-extrabold text-slate-800" id="stat-total-val">0 ' + $dongStr + '</div>' + "`n" +
                       '            <span class="text-[10px] text-slate-400 font-semibold">Theo đơn giá sản phẩm</span>' + "`n" +
                       '          </div>' + "`n" +
                       '          <div class="w-12 h-12 rounded-[14px] bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100/50">' + "`n" +
                       '            <i data-feather="dollar-sign" class="w-5 h-5"></i>' + "`n" +
                       '          </div>' + "`n" +
                       '        </div>' + "`n" +
                       '' + "`n" +
                       '        <!-- Defect Ratio KPI -->' + "`n" +
                       '        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]">' + "`n" +
                       '          <div class="flex flex-col justify-between h-[72px]">' + "`n" +
                       '            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tổng Lỗi Sản Xuất</span>' + "`n" +
                       '            <div class="flex items-baseline gap-1.5">' + "`n" +
                       '              <span class="text-2xl font-extrabold text-slate-800" id="stat-prod-defects">0 pcs</span>' + "`n" +
                       '              <span class="text-[10px] font-bold text-emerald-500" id="stat-defect-rate-sub">Rate: 0%</span>' + "`n" +
                       '            </div>' + "`n" +
                       '            <span class="text-[9px] font-black tracking-wide block text-emerald-500" id="stat-defect-alert-sub">✓ Đang tính toán...</span>' + "`n" +
                       '          </div>' + "`n" +
                       '          <div class="w-12 h-12 rounded-[14px] bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100/50 transition-all duration-300" id="stat-defect-icon-container">' + "`n" +
                       '            <i data-feather="alert-circle" id="stat-defect-icon" class="w-5 h-5"></i>' + "`n" +
                       '          </div>' + "`n" +
                       '        </div>' + "`n" +
                       '' + "`n" +
                       '        <!-- Top Defective Factory KPI -->' + "`n" +
                       '        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]" id="stat-top-supplier-card">' + "`n" +
                       '          <div class="flex flex-col justify-between h-[72px] min-w-0 flex-1 pr-2">' + "`n" +
                       '            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Nhà máy lỗi nhiều nhất</span>' + "`n" +
                       '            <div class="text-xl font-extrabold text-slate-800 truncate" id="stat-top-supplier">N/A</div>' + "`n" +
                       '            <span class="text-[10px] text-slate-400 font-semibold truncate" id="stat-top-supplier-sub">Chưa có dữ liệu</span>' + "`n" +
                       '          </div>' + "`n" +
                       '          <div class="w-12 h-12 rounded-[14px] bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200/50" id="stat-top-supplier-icon-container">' + "`n" +
                       '            <i data-feather="home" class="w-5 h-5"></i>' + "`n" +
                       '          </div>' + "`n" +
                       '        </div>' + "`n" +
                       '' + "`n" +
                       '      </div>'
            
            $newLines += $newKpis
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
    
    # Save processed return.html back with CRLF line endings
    [System.IO.File]::WriteAllText($returnFile, $retText.Replace("`n", "`r`n"), [System.Text.Encoding]::UTF8)
    Write-Output "return.html saved successfully!"
} else {
    Write-Warning "return.html not found."
}

Write-Output "Sync font and layout tasks successfully executed!"
