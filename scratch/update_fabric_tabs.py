import os
import re

fabric_path = r"d:\QC_APP\placeholders\fabric_testing.html"
rebuild_path = r"d:\QC_APP\scratch\rebuild_fabric_testing.ps1"

# 1. Update placeholders/fabric_testing.html
if os.path.exists(fabric_path):
    with open(fabric_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Update .container max-width to 100% by default
    content = re.sub(
        r"(\.container\s*\{\s*width:\s*100%;\s*max-width:\s*)820px(;\s*display:\s*flex;)",
        r"\g<1>100%\g<2>",
        content
    )

    # Update .report-card to display: none by default
    content = re.sub(
        r"(\.report-card\s*\{\s*background:\s*var\(--card-bg\);.*?\s*width:\s*100%;)",
        r"\g<1>\n        display: none;",
        content,
        flags=re.DOTALL
    )

    # Update .action-row to display: none by default
    content = re.sub(
        r"(\.action-row\s*\{\s*display:\s*)flex(;\s*justify-content:\s*flex-end;)",
        r"\g<1>none\g<2>",
        content
    )

    # Update .history-card to display: flex by default
    content = re.sub(
        r"(\.history-card\s*\{\s*background:\s*var\(--card-bg\);.*?\s*display:\s*)none(;\s*flex-direction:\s*column;)",
        r"\g<1>flex\g<2>",
        content,
        flags=re.DOTALL
    )

    # Update Tab buttons HTML (swap active/inactive and texts)
    # First, locate the buttons div
    old_buttons_block = (
        '<div style="display: flex; gap: 12px;">\n'
        '          <button id="tabFormBtn" onclick="switchTab(\'form\')" class="tab-btn active">\n'
        '            <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24">\n'
        '              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z"/>\n'
        '            </svg> 1. Testing Report</button>\n'
        '          <button id="tabListBtn" onclick="switchTab(\'list\')" class="tab-btn inactive">\n'
        '            <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24">\n'
        '              <path d="M4 14h6v-10h-6v10zm0 6h6v-4h-6v4zm8-16v6h6v-6h-6zm0 16h6v-8h-6v8z"/>\n'
        '            </svg> 2. Testing Analysis</button>\n'
        '        </div>'
    )
    # We will use a more robust regex replacement for the tab buttons block to ignore whitespace/newline differences
    btn_pattern = r'(?s)<div style="display:\s*flex;\s*gap:\s*12px;">\s*<button id="tabFormBtn".*?</button>\s*<button id="tabListBtn".*?</button>\s*</div>'
    new_buttons_html = (
        '<div style="display: flex; gap: 12px;">\n'
        '          <button id="tabListBtn" onclick="switchTab(\'list\')" class="tab-btn active">\n'
        '            <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24">\n'
        '              <path d="M4 14h6v-10h-6v10zm0 6h6v-4h-6v4zm8-16v6h6v-6h-6zm0 16h6v-8h-6v8z"/>\n'
        '            </svg> 1. Testing Analysis</button>\n'
        '          <button id="tabFormBtn" onclick="switchTab(\'form\')" class="tab-btn inactive">\n'
        '            <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24">\n'
        '              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z"/>\n'
        '            </svg> 2. Testing Report</button>\n'
        '        </div>'
    )
    content = re.sub(btn_pattern, new_buttons_html, content)

    # Show historyCounter by default
    content = content.replace(
        'div style="display: none; font-size:12px; font-weight:700; color: var(--slate-500);" id="historyCounter"',
        'div style="display: inline-block; font-size:12px; font-weight:700; color: var(--slate-500);" id="historyCounter"'
    )

    # Update onload handler to switchTab('list')
    onload_pattern = r'(?s)window\.onload\s*=\s*function\(\)\s*\{(.*?)\s*loadHistoryData\(\);\s*//\s*Load historical data on startup\s*\};'
    new_onload = r"window.onload = function() {\g<1>\n        switchTab('list'); // Default to Testing Analysis\n      };"
    content = re.sub(onload_pattern, new_onload, content)

    with open(fabric_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("fabric_testing.html updated successfully!")

# 2. Update scratch/rebuild_fabric_testing.ps1
if os.path.exists(rebuild_path):
    with open(rebuild_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Update rename the tabs section
    content = content.replace(
        "$fabricContent = $fabricContent -replace '(?s)(<button id=\"tabFormBtn\"[^>]*>.*?svg>)\\s*[^<]+', '$1 1. Testing Report'",
        "$fabricContent = $fabricContent -replace '(?s)(<button id=\"tabFormBtn\"[^>]*>.*?svg>)\\s*[^<]+', '$1 2. Testing Report'"
    )
    content = content.replace(
        "$fabricContent = $fabricContent -replace '(?s)(<button id=\"tabListBtn\"[^>]*>.*?svg>)\\s*[^<]+', '$1 2. Testing Analysis'",
        "$fabricContent = $fabricContent -replace '(?s)(<button id=\"tabListBtn\"[^>]*>.*?svg>)\\s*[^<]+', '$1 1. Testing Analysis'"
    )

    with open(rebuild_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("rebuild_fabric_testing.ps1 updated successfully!")
