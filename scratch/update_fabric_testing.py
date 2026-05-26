# -*- coding: utf-8 -*-
import io
import os

source_file = "d:\\QC_APP\\Index_GAS.html"
target_file = "d:\\QC_APP\\placeholders\\fabric_testing.html"

if not os.path.exists(source_file):
    print("Source file not found: " + source_file)
    exit(1)

print("Reading source content from Index_GAS.html...")
with io.open(source_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update .control-bar CSS for right-alignment (justify-content: flex-end)
print("Replacing .control-bar styling...")
old_style = """      .control-bar {
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
      }"""

new_style = """      .control-bar {
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
      }"""

if old_style in content:
    content = content.replace(old_style, new_style)
    print("Successfully updated .control-bar styling.")
else:
    # Try with LF line endings
    old_style_lf = old_style.replace("\r\n", "\n")
    content_lf = content.replace("\r\n", "\n")
    if old_style_lf in content_lf:
        content = content_lf.replace(old_style_lf, new_style.replace("\r\n", "\n"))
        print("Successfully updated .control-bar styling (normalized line endings).")
    else:
        print("Warning: Could not find original .control-bar styling block.")

# 2. Remove control bar title from HTML body
print("Replacing control bar HTML...")
old_html = """      <!-- Control Bar Panel -->
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
      </div>"""

new_html = """      <!-- Control Bar Panel -->
      <div class="control-bar">
        <div class="toggle-wrap" onclick="toggleCleanView()">
          <span style="font-size:13px; font-weight: 700; color: var(--slate-700);">Chế độ chụp hình (Clean View)</span>
          <label class="switch">
            <input type="checkbox" id="cleanViewToggle" onchange="handleToggleChange(this.checked)" />
            <span class="slider"></span>
          </label>
        </div>
      </div>"""

if old_html in content:
    content = content.replace(old_html, new_html)
    print("Successfully updated control bar HTML.")
else:
    # Try normalized spacing
    old_html_lf = old_html.replace("\r\n", "\n")
    content_lf = content.replace("\r\n", "\n")
    if old_html_lf in content_lf:
        content = content_lf.replace(old_html_lf, new_html.replace("\r\n", "\n"))
        print("Successfully updated control bar HTML (normalized line endings).")
    else:
        print("Warning: Could not find original control bar HTML block.")

# 3. Replace script QMS_API wrapper block with hybrid one
print("Replacing QMS_API wrapper block...")
old_script = """    <script>
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
    </script>"""

new_script = """    <!-- Central QMS Portal Client API -->
    <script src="../api.js"></script>
    <script>
      // Dynamically select the best available QMS_API implementation
      if (typeof google !== 'undefined' && google.script && google.script.run) {
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
      } else if (typeof QMS_API !== 'undefined' && QMS_API.submitFabricTesting) {
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
    </script>"""

if old_script in content:
    content = content.replace(old_script, new_script)
    print("Successfully updated QMS_API script block.")
else:
    # Try normalized line endings
    old_script_lf = old_script.replace("\r\n", "\n")
    content_lf = content.replace("\r\n", "\n")
    if old_script_lf in content_lf:
        content = content_lf.replace(old_script_lf, new_script.replace("\r\n", "\n"))
        print("Successfully updated QMS_API script block (normalized line endings).")
    else:
        print("Warning: Could not find original QMS_API script block.")

# Save compiled output to fabric_testing.html
print("Saving compiled content to " + target_file + "...")
with io.open(target_file, "w", encoding="utf-8") as f:
    f.write(content)
print("Finished updating fabric_testing.html!")
