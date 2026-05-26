$gasFile = "d:\QC_APP\Index_GAS.html"
$fabricFile = "d:\QC_APP\placeholders\fabric_testing.html"

$gasContent = [System.IO.File]::ReadAllText($gasFile)
$fabricContent = [System.IO.File]::ReadAllText($fabricFile)

# 1. Add Chart.js to fabric_testing.html
if ($fabricContent -notmatch "https://cdn.jsdelivr.net/npm/chart.js") {
    $fabricContent = $fabricContent.Replace("<title>Fabric Shrinkage & Appearance Test Report</title>", "<title>Fabric Shrinkage & Appearance Test Report</title>`n    <!-- Chart.js for data visualization -->`n    <script src=`"https://cdn.jsdelivr.net/npm/chart.js`"></script>")
}

# 2. Add --report-border
if ($fabricContent -notmatch "--report-border") {
    $fabricContent = $fabricContent.Replace("--card-bg: #ffffff;", "--card-bg: #ffffff;`n        --report-border: #cbd5e1;")
}

$fabricContent = [regex]::Replace($fabricContent, "border: 1px solid var\(--slate-200\);", "border: 1px solid var(--report-border);")

# 3. Fix the hardcoded #000 border in the first reportContent
$fabricContent = $fabricContent.Replace('<td class="header-logo-cell" style="border-right: 1px solid #000; border-bottom: 1px solid #000;">', '<td class="header-logo-cell" style="border-right: 1px solid var(--report-border); border-bottom: 1px solid var(--report-border);">')

# 4. Remove the duplicated reportContent block
$pattern = '(?s)<!-- Main Report Card Document -->\s*<div class="report-card" id="reportContent">(.*?)</body>'
if ($fabricContent -match $pattern) {
    $matchSecondReport = $matches[0]
    $firstPart = $fabricContent.Substring(0, $fabricContent.IndexOf($matchSecondReport))
    if ($matchSecondReport -match '(?s)(<script>.*?</script>)') {
        $scriptBlock = $matches[1]
        $fabricContent = $firstPart + "`n    " + $scriptBlock + "`n  </body>`n</html>"
    }
}

# 5. Rename the tabs
$fabricContent = $fabricContent.Replace("Nhập Mẫu Mới", "1. Testing Report")
$fabricContent = $fabricContent.Replace("Dữ Liệu Đo Lường", "2. Testing Analysis")

# 6. Extract missing JS from Index_GAS.html
if ($gasContent -match '(?s)(/\* Premium Tab Navigation & Historical Table Javascript Logic \*/.*?)</script>') {
    $jsCode = $matches[1]
    $replacement = "`n      " + $jsCode.Trim() + "`n    </script>`n  </body>"
    $fabricContent = [regex]::Replace($fabricContent, '(?s)</script>\s*</body>', $replacement)
}

[System.IO.File]::WriteAllText($fabricFile, $fabricContent)
Write-Host "Restoration complete!"
