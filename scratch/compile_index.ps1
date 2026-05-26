# compile_index.ps1
# Script to compile standalone QMS Fabric Testing Web App (Index.html) from placeholders/fabric_testing.html.

$sourcePath = "d:\QC_APP\placeholders\fabric_testing.html"
$outputPathIndexPlaceholders = "d:\QC_APP\placeholders\Index.html"
$outputPathIndexRoot = "d:\QC_APP\Index_GAS.html"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source file not found: $sourcePath"
    exit 1
}

Write-Output "Compiling Index.html from fabric_testing.html..."
$content = [System.IO.File]::ReadAllText($sourcePath, [System.Text.Encoding]::UTF8)

# Define the GAS wrapper script
$adapterScript = @"
    <!-- Standalone Google Apps Script QMS API Wrapper -->
    <script>
      if (typeof google !== 'undefined' && google.script && google.script.run) {
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
    </script>
"@

# Replace the api.js reference with the GAS adapter script
$targetTag = '<script src="../api.js"></script>'
if ($content.Contains($targetTag)) {
    $compiledContent = $content.Replace($targetTag, $adapterScript)
    Write-Output "Successfully injected QMS API Adapter script."
} else {
    Write-Warning "Could not find api.js script tag in fabric_testing.html. Saving as-is."
    $compiledContent = $content
}

# Write files in UTF-8
[System.IO.File]::WriteAllText($outputPathIndexPlaceholders, $compiledContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($outputPathIndexRoot, $compiledContent, [System.Text.Encoding]::UTF8)

Write-Output "Compilation successful! Output files updated: $outputPathIndexPlaceholders and $outputPathIndexRoot"
