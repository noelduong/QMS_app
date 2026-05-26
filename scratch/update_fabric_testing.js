const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'Index_GAS.html');
const targetFile = path.join(__dirname, '..', 'placeholders', 'fabric_testing.html');

if (!fs.existsSync(sourceFile)) {
  console.error("Source file not found: " + sourceFile);
  process.exit(1);
}

console.log("Reading source content from Index_GAS.html...");
let content = fs.readFileSync(sourceFile, 'utf8');

// 1. Update .control-bar CSS for right-alignment (justify-content: flex-end)
console.log("Replacing .control-bar styling...");
const oldStyle = `      .control-bar {
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
      }`;

const newStyle = `      .control-bar {
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
      }`;

if (content.includes(oldStyle)) {
  content = content.replace(oldStyle, newStyle);
  console.log("Successfully updated .control-bar styling.");
} else {
  // Try normalized line endings
  const oldStyleLf = oldStyle.replace(/\r\n/g, '\n');
  const contentLf = content.replace(/\r\n/g, '\n');
  if (contentLf.includes(oldStyleLf)) {
    content = contentLf.replace(oldStyleLf, newStyle.replace(/\r\n/g, '\n'));
    console.log("Successfully updated .control-bar styling (normalized line endings).");
  } else {
    console.warn("Warning: Could not find original .control-bar styling block.");
  }
}

// 2. Remove control bar title from HTML body
console.log("Replacing control bar HTML...");
const oldHtml = `      <!-- Control Bar Panel -->
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
      </div>`;

const newHtml = `      <!-- Control Bar Panel -->
      <div class="control-bar">
        <div class="toggle-wrap" onclick="toggleCleanView()">
          <span style="font-size:13px; font-weight: 700; color: var(--slate-700);">Chế độ chụp hình (Clean View)</span>
          <label class="switch">
            <input type="checkbox" id="cleanViewToggle" onchange="handleToggleChange(this.checked)" />
            <span class="slider"></span>
          </label>
        </div>
      </div>`;

if (content.includes(oldHtml)) {
  content = content.replace(oldHtml, newHtml);
  console.log("Successfully updated control bar HTML.");
} else {
  // Try normalized line endings
  const oldHtmlLf = oldHtml.replace(/\r\n/g, '\n');
  const contentLf = content.replace(/\r\n/g, '\n');
  if (contentLf.includes(oldHtmlLf)) {
    content = contentLf.replace(oldHtmlLf, newHtml.replace(/\r\n/g, '\n'));
    console.log("Successfully updated control bar HTML (normalized line endings).");
  } else {
    console.warn("Warning: Could not find original control bar HTML block.");
  }
}

// 3. Replace script QMS_API wrapper block with hybrid one
console.log("Replacing QMS_API wrapper block...");
const oldScript = `    <script>
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
    </script>`;

const newScript = `    <!-- Central QMS Portal Client API -->
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
    </script>`;

if (content.includes(oldScript)) {
  content = content.replace(oldScript, newScript);
  console.log("Successfully updated QMS_API script block.");
} else {
  // Try normalized line endings
  const oldScriptLf = oldScript.replace(/\r\n/g, '\n');
  const contentLf = content.replace(/\r\n/g, '\n');
  if (contentLf.includes(oldScriptLf)) {
    content = contentLf.replace(oldScriptLf, newScript.replace(/\r\n/g, '\n'));
    console.log("Successfully updated QMS_API script block (normalized line endings).");
  } else {
    console.warn("Warning: Could not find original QMS_API script block.");
  }
}

// Save compiled output to fabric_testing.html
console.log("Saving compiled content to " + targetFile + "...");
fs.writeFileSync(targetFile, content, 'utf8');
console.log("Finished updating fabric_testing.html!");
