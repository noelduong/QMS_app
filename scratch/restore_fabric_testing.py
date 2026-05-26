import os
import re

gas_file = r'd:\QC_APP\Index_GAS.html'
fabric_file = r'd:\QC_APP\placeholders\fabric_testing.html'

with open(gas_file, 'r', encoding='utf-8') as f:
    gas_content = f.read()

with open(fabric_file, 'r', encoding='utf-8') as f:
    fabric_content = f.read()

# 1. Add Chart.js to fabric_testing.html
if 'https://cdn.jsdelivr.net/npm/chart.js' not in fabric_content:
    fabric_content = fabric_content.replace(
        '<title>Fabric Shrinkage & Appearance Test Report</title>',
        '<title>Fabric Shrinkage & Appearance Test Report</title>\n    <!-- Chart.js for data visualization -->\n    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
    )

# 2. Add --report-border
if '--report-border' not in fabric_content.split('}')[0]:
    fabric_content = fabric_content.replace(
        '--card-bg: #ffffff;',
        '--card-bg: #ffffff;\n        --report-border: #cbd5e1;'
    )

fabric_content = fabric_content.replace(
    'border: 1px solid var(--slate-200);',
    'border: 1px solid var(--report-border);'
)

# 3. Fix the hardcoded #000 border in the first reportContent
fabric_content = fabric_content.replace(
    '<td class="header-logo-cell" style="border-right: 1px solid #000; border-bottom: 1px solid #000;">',
    '<td class="header-logo-cell" style="border-right: 1px solid var(--report-border); border-bottom: 1px solid var(--report-border);">'
)

# 4. Remove the duplicated reportContent block (lines 975 to EOF)
# Let's find the start of the second reportContent and remove everything up to the </script> tag
match_second_report = re.search(r'<!-- Main Report Card Document -->\s*<div class="report-card" id="reportContent">(.*?)</body>', fabric_content, re.DOTALL)
if match_second_report:
    # Remove the second reportContent block, but keep the closing body/html
    first_part = fabric_content[:match_second_report.start()]
    # Extract just the <script> block which is after the second reportContent
    script_match = re.search(r'(<script>.*?</script>)', match_second_report.group(0), re.DOTALL)
    if script_match:
        script_block = script_match.group(1)
        fabric_content = first_part + '\n      </div>\n    </div>\n\n    ' + script_block + '\n  </body>\n</html>'

# 5. Rename the tabs
fabric_content = fabric_content.replace('Nhập Mẫu Mới', '1. Testing Report')
fabric_content = fabric_content.replace('Dữ Liệu Đo Lường', '2. Testing Analysis')

# 6. Extract missing JS from Index_GAS.html
# We know it starts at /* Premium Tab Navigation & Historical Table Javascript Logic */ and goes to the end of the <script> block
js_match = re.search(r'(/\* Premium Tab Navigation & Historical Table Javascript Logic \*/.*?</script>)', gas_content, re.DOTALL)
if js_match:
    js_code = js_match.group(1)
    # Remove the trailing </script>
    js_code = js_code.replace('</script>', '')
    
    # Inject it into fabric_testing.html right before </script>
    fabric_content = fabric_content.replace('</script>\n  </body>', '\n      ' + js_code.strip() + '\n    </script>\n  </body>')

with open(fabric_file, 'w', encoding='utf-8') as f:
    f.write(fabric_content)

print("Restoration complete!")
