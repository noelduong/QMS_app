$fabricPath = "d:\QC_APP\placeholders\fabric_testing.html"
$content = [System.IO.File]::ReadAllText($fabricPath, [System.Text.Encoding]::UTF8)
$target = '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />'
$replacement = "$target`r`n    <!-- Chart.js for data visualization -->`r`n    <script src=`"https://cdn.jsdelivr.net/npm/chart.js`"></script>"
$content = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText($fabricPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Chart.js added to fabric_testing.html head!"
