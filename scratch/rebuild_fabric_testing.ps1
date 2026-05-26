$gasFile = "d:\QC_APP\Index_GAS.html"
$targetFile = "d:\QC_APP\placeholders\fabric_testing.html"

# Read Index_GAS.html
$gasContent = [System.IO.File]::ReadAllText($gasFile)

# Extract styling rules for tabs & history
$stylesPattern = '(?s)/\* Premium Tab Navigation & Historical Table Styles \*/(.*?)</style>'
if ($gasContent -match $stylesPattern) {
    $tabStyles = $matches[1]
} else {
    Write-Error "Could not find styles pattern in Index_GAS.html"
    exit
}

# Extract HTML blocks
$tabNavPattern = '(?s)(<!-- Premium Tab Navigation -->.*?)(?=<!-- Premium History Card)'
if ($gasContent -match $tabNavPattern) { $tabNavHtml = $matches[1] }

$historyCardPattern = '(?s)(<!-- Premium History Card.*?-->.*?)(?=<!-- Main Report Card Document -->)'
if ($gasContent -match $historyCardPattern) { $historyCardHtml = $matches[1] }

$reportCardPattern = '(?s)(<!-- Main Report Card Document -->.*?)(?=<!-- Notification Toast -->)'
if ($gasContent -match $reportCardPattern) { $reportCardHtml = $matches[1] }

$toastPattern = '(?s)(<!-- Notification Toast -->.*?)(?=\s*<script>)'
if ($gasContent -match $toastPattern) { $toastHtml = $matches[1] }

# Extract script blocks
$apiScriptPattern = '(?s)<!-- Notification Toast -->.*?<script>(.*?)</script>'
if ($gasContent -match $apiScriptPattern) { $apiScript = $matches[1] }

$mainScriptPattern = '(?s)<!-- Notification Toast -->.*?<script>.*?</script>\s*<script>(.*?)</script>'
if ($gasContent -match $mainScriptPattern) { $mainScript = $matches[1] }

# Rebuild fabric_testing.html from a clean base or discard previous broken styles
$fabricContent = [System.IO.File]::ReadAllText($targetFile)

# Remove any existing tab styles if they were appended by previous attempts
$fabricContent = $fabricContent -replace '(?s)/\* Premium Tab Navigation & Historical Table Styles \*/.*?</style>', "</style>"

# Replace the styles block (insert the tabs styles before </style>) using a safe literal replacement
$replacementStyles = "`n/* Premium Tab Navigation & Historical Table Styles */`n" + $tabStyles + "`n</style>"
$fabricContent = $fabricContent -replace '(?s)</style>', $replacementStyles

# Replace the root variable definitions in the styles to be desaturated
$newRoot = @"
      :root {
        --primary: #5c7099; /* Muted modern blue */
        --primary-hover: #48587d;
        --success: #59936f; /* Sage Green */
        --success-bg: #f0f6f2;
        --success-text: #375e46;
        --danger: #c75466; /* Terracotta */
        --danger-bg: #faf1f2;
        --danger-text: #8a3643;
        --slate-50: #f8fafc;
        --slate-100: #f1f5f9;
        --slate-200: #e2e8f0;
        --slate-300: #cbd5e1;
        --slate-500: #64748b;
        --slate-700: #4a4b50; /* Smoky Grey-ish */
        --slate-800: #3a3b40; /* Smoky Grey */
        --slate-900: #25262a; /* Dark Smoky Grey */
        --card-bg: #ffffff;
        --report-border: #cbd5e1;
      }
"@
$fabricContent = $fabricContent -replace '(?s):root\s*\{.*?\}', $newRoot

# Replace control bar title background gradient to desaturated Sage Green to Modern Blue
$fabricContent = $fabricContent -replace 'linear-gradient\(135deg,\s*#10b981\s*0%,\s*#4f46e5\s*100%\)', 'linear-gradient(135deg, var(--success) 0%, var(--primary) 100%)'

# Decode Vietnamese strings from UTF8 bytes to avoid PowerShell syntax errors
$titleBytes = @(66, 195, 129, 79, 32, 67, 195, 129, 79, 32, 67, 79, 32, 82, 195, 154, 84, 32, 86, 225, 186, 163, 73, 32, 40, 70, 65, 66, 82, 73, 67, 32, 83, 72, 82, 73, 78, 75, 65, 71, 69, 32, 84, 69, 83, 84, 41)
$titleText = [System.Text.Encoding]::UTF8.GetString($titleBytes)

$toggleBytes = @(67, 104, 225, 186, 175, 32, 100, 225, 187, 153, 32, 99, 104, 225, 187, 165, 112, 32, 104, 225, 187, 172, 110, 104, 32, 40, 67, 108, 101, 97, 110, 32, 86, 105, 101, 119, 41)
$toggleText = [System.Text.Encoding]::UTF8.GetString($toggleBytes)

# Clean the body content completely
$bodyHeader = @"
  <body>
    <div class="container">
      
      <!-- Control Bar Panel -->
      <div class="control-bar">
        <div class="control-bar-title">
          <svg style="width:18px;height:18px;fill:var(--success);" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          $titleText
        </div>
        <div class="toggle-wrap" onclick="toggleCleanView()">
          <span style="font-size:13px; font-weight: 700; color: var(--slate-700);">$toggleText</span>
          <label class="switch">
            <input type="checkbox" id="cleanViewToggle" onchange="handleToggleChange(this.checked)" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

$tabNavHtml

$historyCardHtml

$reportCardHtml
    </div>

$toastHtml

    <script src="../api.js"></script>

    <script>
$mainScript
    </script>
  </body>
"@

$fabricContent = $fabricContent -replace '(?s)<body>.*</html>', "$bodyHeader`n</html>"

# Apply javascript replacements for desaturated chart colors in the main script block
$fabricContent = $fabricContent -replace '#818cf8', '#5c7099'
$fabricContent = $fabricContent -replace 'rgba\(129,\s*140,\s*248,\s*0.15\)', 'rgba(92, 112, 153, 0.15)'
$fabricContent = $fabricContent -replace '#2dd4bf', '#59936f'
$fabricContent = $fabricContent -replace 'rgba\(45,\s*212,\s*191,\s*0.15\)', 'rgba(89, 147, 111, 0.15)'
$fabricContent = $fabricContent -replace 'rgba\(244,\s*63,\s*94,\s*0.6\)', 'rgba(199, 84, 102, 0.6)'
$fabricContent = $fabricContent -replace '#fda4af', 'rgba(199, 84, 102, 0.5)'
$fabricContent = $fabricContent -replace '#f43f5e', '#c75466'

# Replace materialDistChart gradient colors
$fabricContent = $fabricContent -replace "matGrad\.addColorStop\(0,\s*'.*?'\);", "matGrad.addColorStop(0, '#5c7099');"
$fabricContent = $fabricContent -replace "matGrad\.addColorStop\(1,\s*'.*?'\);", "matGrad.addColorStop(1, '#59936f');"

# Replace supplierDistChart colors
$supplierColors = @"
              backgroundColor: [
                'rgba(92, 112, 153, 0.85)',  // Modern Blue
                'rgba(89, 147, 111, 0.85)',  // Sage Green
                'rgba(214, 167, 76, 0.85)',  // Muted Gold
                'rgba(199, 84, 102, 0.85)',  // Terracotta
                'rgba(110, 115, 140, 0.85)', // Slate Grey
                'rgba(150, 130, 170, 0.85)'  // Muted Purple
              ].slice(0, supLabels.length),
"@
$fabricContent = $fabricContent -replace '(?s)backgroundColor:\s*\[\s*''\s*rgba\(129,.*?\].slice\(0,\s*supLabels.length\),', $supplierColors

# Rename the tabs
$fabricContent = $fabricContent -replace '(?s)(<button id="tabFormBtn"[^>]*>.*?svg>)\s*[^<]+', '$1 2. Testing Report'
$fabricContent = $fabricContent -replace '(?s)(<button id="tabListBtn"[^>]*>.*?svg>)\s*[^<]+', '$1 1. Testing Analysis'

# Write out the target file
[System.IO.File]::WriteAllText($targetFile, $fabricContent, [System.Text.Encoding]::UTF8)

Write-Host "Rebuild fabric_testing.html complete!"
