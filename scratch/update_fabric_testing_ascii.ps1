# update_fabric_testing_ascii.ps1
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
# We will do this by replacing just the justify-content rule inside the .control-bar style block
$oldStyleString = "        display: flex;`r`n        justify-content: space-between;`r`n        align-items: center;"
$newStyleString = "        display: flex;`r`n        justify-content: flex-end;`r`n        align-items: center;"

if ($content.Contains($oldStyleString)) {
    $content = $content.Replace($oldStyleString, $newStyleString)
    Write-Output "Successfully updated .control-bar styling (CRLF)."
} else {
    $oldStyleStringLf = "        display: flex;`n        justify-content: space-between;`n        align-items: center;"
    $newStyleStringLf = "        display: flex;`n        justify-content: flex-end;`n        align-items: center;"
    if ($content.Contains($oldStyleStringLf)) {
        $content = $content.Replace($oldStyleStringLf, $newStyleStringLf)
        Write-Output "Successfully updated .control-bar styling (LF)."
    } else {
        Write-Warning "Could not find original .control-bar styling block."
    }
}

# 2. Remove control bar title from HTML body
# We will search for '<div class="control-bar-title">' and the closing '</div>' of that element, and remove it.
Write-Output "Removing control bar title..."
$startTitleTag = '<div class="control-bar-title">'
$endTitleTag = '</div>'

$startIndex = $content.IndexOf($startTitleTag)
if ($startIndex -ge 0) {
    # Find the next </div> after the start tag
    $endIndex = $content.IndexOf($endTitleTag, $startIndex)
    if ($endIndex -gt $startIndex) {
        $lengthToRemove = ($endIndex + $endTitleTag.Length) - $startIndex
        $content = $content.Remove($startIndex, $lengthToRemove)
        Write-Output "Successfully removed control bar title."
    } else {
        Write-Warning "Could not find closing </div> for control-bar-title."
    }
} else {
    Write-Warning "Could not find start tag for control-bar-title."
}

# 3. Clean up the "Chắ dộ chụp hỬnh" or "Chế độ chụp hình" text in the HTML body
# Instead of hardcoding accented characters, let's find '<div class="toggle-wrap"' and replace the inner text safely.
Write-Output "Updating Clean View toggle label text..."
$toggleWrapTag = '<div class="toggle-wrap" onclick="toggleCleanView()">'
$startIndexToggle = $content.IndexOf($toggleWrapTag)
if ($startIndexToggle -ge 0) {
    $spanStartTag = '<span style="font-size:13px; font-weight: 700; color: var(--slate-700);">'
    $startIndexSpan = $content.IndexOf($spanStartTag, $startIndexToggle)
    if ($startIndexSpan -gt $startIndexToggle) {
        $spanEndTag = '</span>'
        $endIndexSpan = $content.IndexOf($spanEndTag, $startIndexSpan)
        if ($endIndexSpan -gt $startIndexSpan) {
            # Extract the old label
            $oldLabelLength = ($endIndexSpan) - ($startIndexSpan + $spanStartTag.Length)
            $oldLabel = $content.Substring($startIndexSpan + $spanStartTag.Length, $oldLabelLength)
            # Replace it with correct Vietnamese "Chế độ chụp hình (Clean View)"
            $newLabel = "Chế độ chụp hình (Clean View)"
            
            # Since $newLabel has Vietnamese, let's construct it from bytes to avoid any script encoding parse errors!
            $newLabelBytes = @(67, 104, 225, 186, 191, 32, 196, 145, 225, 187, 153, 32, 99, 104, 225, 187, 165, 112, 32, 104, 195, 172, 110, 104, 32, 40, 67, 108, 101, 97, 110, 32, 86, 105, 101, 119, 41)
            $newLabelString = [System.Text.Encoding]::UTF8.GetString($newLabelBytes)
            
            $content = $content.Replace(($spanStartTag + $oldLabel + $spanEndTag), ($spanStartTag + $newLabelString + $spanEndTag))
            Write-Output "Successfully updated Clean View label."
        }
    }
}

# 4. Replace script QMS_API wrapper block with hybrid one
# We will find the unique marker "if (typeof google !== 'undefined' && google.script && google.script.run)"
Write-Output "Replacing QMS_API script block..."
$apiMarker = "if (typeof google !== 'undefined' && google.script && google.script.run)"
$markerIndex = $content.IndexOf($apiMarker)
if ($markerIndex -ge 0) {
    $scriptStartTag = '<script>'
    $startIndexScript = $content.LastIndexOf($scriptStartTag, $markerIndex)
    if ($startIndexScript -ge 0) {
        $scriptEndTag = '</script>'
        $endIndexScript = $content.IndexOf($scriptEndTag, $markerIndex)
        if ($endIndexScript -gt $markerIndex) {
            # We want to replace everything from the $startIndexScript to the end of $scriptEndTag
            $oldBlockLength = ($endIndexScript + $scriptEndTag.Length) - $startIndexScript
            
            # Define the new script block safely using ASCII characters and constructing Vietnamese/accents from bytes if needed.
            # No Vietnamese characters are inside the script block!
            $newBlock = '<!-- Central QMS Portal Client API -->' + "`r`n" +
                        '    <script src="../api.js"></script>' + "`r`n" +
                        '    <script>' + "`r`n" +
                        '      // Dynamically select the best available QMS_API implementation' + "`r`n" +
                        '      if (typeof google !== ''undefined'' && google.script && google.script.run) {' + "`r`n" +
                        '        // Deployed inside Google Apps Script as a standalone Web App' + "`r`n" +
                        '        window.QMS_API = {' + "`r`n" +
                        '          submitFabricTesting: function(payload) {' + "`r`n" +
                        '            return new Promise((resolve, reject) => {' + "`r`n" +
                        '              google.script.run' + "`r`n" +
                        '                .withSuccessHandler(res => resolve(res))' + "`r`n" +
                        '                .withFailureHandler(err => reject(new Error(err)))' + "`r`n" +
                        '                .submitFabricTesting(payload);' + "`r`n" +
                        '            });' + "`r`n" +
                        '          },' + "`r`n" +
                        '          getFabricTesting: function() {' + "`r`n" +
                        '            return new Promise((resolve, reject) => {' + "`r`n" +
                        '              google.script.run' + "`r`n" +
                        '                .withSuccessHandler(res => resolve(res))' + "`r`n" +
                        '                .withFailureHandler(err => reject(new Error(err)))' + "`r`n" +
                        '                .getFabricTestingRows();' + "`r`n" +
                        '            });' + "`r`n" +
                        '          }' + "`r`n" +
                        '        };' + "`r`n" +
                        '      } else if (typeof QMS_API !== ''undefined'' && QMS_API.submitFabricTesting) {' + "`r`n" +
                        '        // Running inside the main portal iframe, using standard api.js client' + "`r`n" +
                        '        console.log("QMS_API: Using real database client from api.js");' + "`r`n" +
                        '      } else {' + "`r`n" +
                        '        // Local simulation fallback' + "`r`n" +
                        '        console.log("QMS_API: Using local simulation fallback (localStorage)");' + "`r`n" +
                        '        window.QMS_API = {' + "`r`n" +
                        '          submitFabricTesting: function(payload) {' + "`r`n" +
                        '            return new Promise((resolve) => {' + "`r`n" +
                        '              setTimeout(() => {' + "`r`n" +
                        '                console.log("Local Simulation Submit:", payload);' + "`r`n" +
                        '                let mockDb = JSON.parse(localStorage.getItem("mock_fabric_testing") || "[]");' + "`r`n" +
                        '                mockDb.push(payload);' + "`r`n" +
                        '                localStorage.setItem("mock_fabric_testing", JSON.stringify(mockDb));' + "`r`n" +
                        '                // Constructing [Gia lap] Luu thanh cong! using bytes to avoid encoding issues' + "`r`n" +
                        '                let successMsgBytes = [91, 71, 105, 225, 186, 163, 32, 108, 225, 187, 173, 112, 93, 32, 76, 198, 176, 117, 32, 116, 104, 225, 187, 167, 110, 104, 32, 99, 111, 110, 103, 33];' + "`r`n" +
                        '                let successMsg = new TextDecoder("utf-8").decode(new Uint8Array(successMsgBytes));' + "`r`n" +
                        '                resolve({ ok: true, message: successMsg });' + "`r`n" +
                        '              }, 1000);' + "`r`n" +
                        '            });' + "`r`n" +
                        '          },' + "`r`n" +
                        '          getFabricTesting: function() {' + "`r`n" +
                        '            return new Promise((resolve) => {' + "`r`n" +
                        '              setTimeout(() => {' + "`r`n" +
                        '                let mockDb = JSON.parse(localStorage.getItem("mock_fabric_testing") || "[]");' + "`r`n" +
                        '                resolve({ ok: true, rows: mockDb.reverse() });' + "`r`n" +
                        '              }, 500);' + "`r`n" +
                        '            });' + "`r`n" +
                        '          }' + "`r`n" +
                        '        };' + "`r`n" +
                        '      }' + "`r`n" +
                        '    </script>'
            
            $content = $content.Remove($startIndexScript, $oldBlockLength)
            $content = $content.Insert($startIndexScript, $newBlock)
            Write-Output "Successfully updated script block."
        }
    }
} else {
    Write-Warning "Could not find QMS_API script block via marker."
}

# 5. Save compiled output to fabric_testing.html in UTF-8
Write-Output "Saving compiled content to $targetFile..."
[System.IO.File]::WriteAllText($targetFile, $content, [System.Text.Encoding]::UTF8)
Write-Output "Finished updating fabric_testing.html successfully!"
