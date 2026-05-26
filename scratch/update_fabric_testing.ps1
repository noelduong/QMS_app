# update_fabric_testing.ps1
$sourceFile = "d:\QC_APP\Index_GAS.html"
$targetFile = "d:\QC_APP\placeholders\fabric_testing.html"

if (-not (Test-Path $sourceFile)) {
    Write-Error "Source file not found: $sourceFile"
    exit 1
}

Write-Output "Reading source content from Index_GAS.html..."
$content = [System.IO.File]::ReadAllText($sourceFile, [System.Text.Encoding]::UTF8)

# 1. Update .control-bar CSS for right-alignment (justify-content: flex-end)
Write-Output "Replacing .control-bar styling..."
$oldStyle = '      .control-bar {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.6);
        transition: all 0.3s ease;
      }'

$newStyle = '      .control-bar {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08);
        display: flex;
        justify-content: flex-end;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.6);
        transition: all 0.3s ease;
      }'

if ($content.Contains($oldStyle)) {
    $content = $content.Replace($oldStyle, $newStyle)
    Write-Output "Successfully updated .control-bar styling."
} else {
    Write-Warning "Could not find original .control-bar styling block."
}

# 2. Remove control bar title from HTML body
Write-Output "Replacing control bar HTML..."
$oldHtml = '      <!-- Control Bar Panel -->
      <div class="control-bar">
        <div class="control-bar-title">
          <svg style="width:18px;height:18px;fill:var(--success);" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          BÁO CÁO CO RÚT VảI (FABRIC SHRINKAGE TEST)
        </div>
        <div class="toggle-wrap" onclick="toggleCleanView()">
          <span style="font-size:13px; font-weight: 700; color: var(--slate-700);">Chắ dộ chụp hỬnh (Clean View)</span>
          <label class="switch">
            <input type="checkbox" id="cleanViewToggle" onchange="handleToggleChange(this.checked)" />
            <span class="slider"></span>
          </label>
        </div>
      </div>'

$newHtml = '      <!-- Control Bar Panel -->
      <div class="control-bar">
        <div class="toggle-wrap" onclick="toggleCleanView()">
          <span style="font-size:13px; font-weight: 700; color: var(--slate-700);">Chế độ chụp hình (Clean View)</span>
          <label class="switch">
            <input type="checkbox" id="cleanViewToggle" onchange="handleToggleChange(this.checked)" />
            <span class="slider"></span>
          </label>
        </div>
      </div>'

if ($content.Contains($oldHtml)) {
    $content = $content.Replace($oldHtml, $newHtml)
    Write-Output "Successfully updated control bar HTML."
} else {
    # Try normalized spacing version
    $oldHtmlNormal = $oldHtml -replace "`r`n", "`n"
    $contentNormal = $content -replace "`r`n", "`n"
    if ($contentNormal.Contains($oldHtmlNormal)) {
        $content = $contentNormal.Replace($oldHtmlNormal, ($newHtml -replace "`r`n", "`n"))
        Write-Output "Successfully updated control bar HTML (with LF normalized)."
    } else {
        Write-Warning "Could not find original control bar HTML block."
    }
}

# 3. Replace script QMS_API wrapper block with hybrid one
Write-Output "Replacing QMS_API wrapper block..."
$oldScript = '    <script>
      if (typeof google !== ''undefined'' && google.script && google.script.run) {
        window.QMS_API = {
          submitFabricTesting: function(payload) {
            return new Promise((resolve, reject) => {
              google.script.run
                .withSuccessHandler(res => resolve(res))
                .withFailureHandler(err => reject(new Error(err)))
                .submitFabricTesting(payload);
            });
          },
          getFabricTesting: function() {
            return new Promise((resolve, reject) => {
              google.script.run
                .withSuccessHandler(res => resolve(res))
                .withFailureHandler(err => reject(new Error(err)))
                .getFabricTestingRows();
            });
          }
        };
      } else {
        // Local simulation fallback
        window.QMS_API = {
          submitFabricTesting: function(payload) {
            return new Promise((resolve) => {
              setTimeout(() => {
                console.log("Local Simulation Submit:", payload);
                let mockDb = JSON.parse(localStorage.getItem("mock_fabric_testing") || "[]");
                mockDb.push(payload);
                localStorage.setItem("mock_fabric_testing", JSON.stringify(mockDb));
                resolve({ ok: true, message: "[Giáº£ láº­p] LÆ°u thÃ nh cÃ´ng!" });
              }, 1000);
            });
          },
          getFabricTesting: function() {
            return new Promise((resolve) => {
              setTimeout(() => {
                let mockDb = JSON.parse(localStorage.getItem("mock_fabric_testing") || "[]");
                resolve({ ok: true, rows: mockDb.reverse() });
              }, 500);
            });
          }
        };
      }
    </script>'

$newScript = '    <!-- Central QMS Portal Client API -->
    <script src="../api.js"></script>
    <script>
      // Dynamically select the best available QMS_API implementation
      if (typeof google !== ''undefined'' && google.script && google.script.run) {
        // Deployed inside Google Apps Script as a standalone Web App
        window.QMS_API = {
          submitFabricTesting: function(payload) {
            return new Promise((resolve, reject) => {
              google.script.run
                .withSuccessHandler(res => resolve(res))
                .withFailureHandler(err => reject(new Error(err)))
                .submitFabricTesting(payload);
            });
          },
          getFabricTesting: function() {
            return new Promise((resolve, reject) => {
              google.script.run
                .withSuccessHandler(res => resolve(res))
                .withFailureHandler(err => reject(new Error(err)))
                .getFabricTestingRows();
            });
          }
        };
      } else if (typeof QMS_API !== ''undefined'' && QMS_API.submitFabricTesting) {
        // Running inside the main portal iframe, using standard api.js client
        console.log("QMS_API: Using real database client from api.js");
      } else {
        // Local simulation fallback
        console.log("QMS_API: Using local simulation fallback (localStorage)");
        window.QMS_API = {
          submitFabricTesting: function(payload) {
            return new Promise((resolve) => {
              setTimeout(() => {
                console.log("Local Simulation Submit:", payload);
                let mockDb = JSON.parse(localStorage.getItem("mock_fabric_testing") || "[]");
                mockDb.push(payload);
                localStorage.setItem("mock_fabric_testing", JSON.stringify(mockDb));
                resolve({ ok: true, message: "[Giả lập] Lưu thành công!" });
              }, 1000);
            });
          },
          getFabricTesting: function() {
            return new Promise((resolve) => {
              setTimeout(() => {
                let mockDb = JSON.parse(localStorage.getItem("mock_fabric_testing") || "[]");
                resolve({ ok: true, rows: mockDb.reverse() });
              }, 500);
            });
          }
        };
      }
    </script>'

if ($content.Contains($oldScript)) {
    $content = $content.Replace($oldScript, $newScript)
    Write-Output "Successfully updated QMS_API script block."
} else {
    # Try normalized spacing version
    $oldScriptNormal = $oldScript -replace "`r`n", "`n"
    $contentNormal = $content -replace "`r`n", "`n"
    if ($contentNormal.Contains($oldScriptNormal)) {
        $content = $contentNormal.Replace($oldScriptNormal, ($newScript -replace "`r`n", "`n"))
        Write-Output "Successfully updated QMS_API script block (with LF normalized)."
    } else {
        Write-Warning "Could not find original QMS_API script block."
    }
}

# 4. Save compiled output to fabric_testing.html
Write-Output "Saving compiled content to $targetFile..."
[System.IO.File]::WriteAllText($targetFile, $content, [System.Text.Encoding]::UTF8)
Write-Output "Finished updating fabric_testing.html!"
