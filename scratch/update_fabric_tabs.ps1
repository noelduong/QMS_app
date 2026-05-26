$fabricPath = "d:\QC_APP\placeholders\fabric_testing.html"
$rebuildPath = "d:\QC_APP\scratch\rebuild_fabric_testing.ps1"

# 1. Update fabric_testing.html
if (Test-Path $fabricPath) {
    $content = [System.IO.File]::ReadAllText($fabricPath, [System.Text.Encoding]::UTF8)

    # Update .container max-width to 100% by default
    $content = [regex]::Replace($content, '(\.container\s*\{\s*width:\s*100%;\s*max-width:\s*)820px(;\s*display:\s*flex;)', '$1100%$2')

    # Update .report-card to display: none by default
    $content = [regex]::Replace($content, '(?s)(\.report-card\s*\{\s*background:\s*var\(--card-bg\);.*?\s*width:\s*100%;)', '$1' + "`n        display: none;")

    # Update .action-row to display: none by default
    $content = [regex]::Replace($content, '(\.action-row\s*\{\s*display:\s*)flex(;\s*justify-content:\s*flex-end;)', '$1none$2')

    # Update .history-card to display: flex by default
    $content = [regex]::Replace($content, '(?s)(\.history-card\s*\{\s*background:\s*var\(--card-bg\);.*?\s*display:\s*)none(;\s*flex-direction:\s*column;)', '$1flex$2')

    # Update Tab buttons HTML (swap active/inactive and texts)
    $btnPattern = '(?s)<div style="display:\s*flex;\s*gap:\s*12px;">\s*<button id="tabFormBtn".*?<\/button>\s*<button id="tabListBtn".*?<\/button>\s*<\/div>'
    $newButtonsHtml = @'
<div style="display: flex; gap: 12px;">
          <button id="tabListBtn" onclick="switchTab('list')" class="tab-btn active">
            <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24">
              <path d="M4 14h6v-10h-6v10zm0 6h6v-4h-6v4zm8-16v6h6v-6h-6zm0 16h6v-8h-6v8z"/>
            </svg> 1. Testing Analysis</button>
          <button id="tabFormBtn" onclick="switchTab('form')" class="tab-btn inactive">
            <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z"/>
            </svg> 2. Testing Report</button>
        </div>
'@
    $content = [regex]::Replace($content, $btnPattern, $newButtonsHtml)

    # Show historyCounter by default
    $content = $content.Replace('div style="display: none; font-size:12px; font-weight:700; color: var(--slate-500);" id="historyCounter"', 'div style="display: inline-block; font-size:12px; font-weight:700; color: var(--slate-500);" id="historyCounter"')

    # Update onload handler to switchTab('list')
    $onloadPattern = '(?s)window\.onload\s*=\s*function\(\)\s*\{(.*?)\s*loadHistoryData\(\);\s*\/\/\s*Load historical data on startup\s*\}'
    $newOnload = 'window.onload = function() {$1' + "`n        switchTab('list'); // Default to Testing Analysis`n      }"
    $content = [regex]::Replace($content, $onloadPattern, $newOnload)

    [System.IO.File]::WriteAllText($fabricPath, $content, [System.Text.Encoding]::UTF8)
    Write-Host "fabric_testing.html updated successfully!"
}

# 2. Update rebuild_fabric_testing.ps1
if (Test-Path $rebuildPath) {
    $content = [System.IO.File]::ReadAllText($rebuildPath, [System.Text.Encoding]::UTF8)

    # Update rename the tabs section
    $content = $content.Replace(
        '$fabricContent = $fabricContent -replace ''(?s)(<button id="tabFormBtn"[^>]*>.*?svg>)\s*[^<]+'', ''$1 1. Testing Report''',
        '$fabricContent = $fabricContent -replace ''(?s)(<button id="tabFormBtn"[^>]*>.*?svg>)\s*[^<]+'', ''$1 2. Testing Report'''
    )
    $content = $content.Replace(
        '$fabricContent = $fabricContent -replace ''(?s)(<button id="tabListBtn"[^>]*>.*?svg>)\s*[^<]+'', ''$1 2. Testing Analysis''',
        '$fabricContent = $fabricContent -replace ''(?s)(<button id="tabListBtn"[^>]*>.*?svg>)\s*[^<]+'', ''$1 1. Testing Analysis'''
    )

    [System.IO.File]::WriteAllText($rebuildPath, $content, [System.Text.Encoding]::UTF8)
    Write-Host "rebuild_fabric_testing.ps1 updated successfully!"
}
