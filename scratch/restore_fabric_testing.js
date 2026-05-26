const fs = require('fs');

const gasFile = 'd:\\QC_APP\\Index_GAS.html';
const fabricFile = 'd:\\QC_APP\\placeholders\\fabric_testing.html';

let gasContent = fs.readFileSync(gasFile, 'utf8');
let fabricContent = fs.readFileSync(fabricFile, 'utf8');

// 1. Add Chart.js to fabric_testing.html
if (!fabricContent.includes('https://cdn.jsdelivr.net/npm/chart.js')) {
    fabricContent = fabricContent.replace(
        '<title>Fabric Shrinkage & Appearance Test Report</title>',
        '<title>Fabric Shrinkage & Appearance Test Report</title>\n    <!-- Chart.js for data visualization -->\n    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
    );
}

// 2. Add --report-border
if (!fabricContent.split('}')[0].includes('--report-border')) {
    fabricContent = fabricContent.replace(
        '--card-bg: #ffffff;',
        '--card-bg: #ffffff;\n        --report-border: #cbd5e1;'
    );
}

fabricContent = fabricContent.replace(
    /border: 1px solid var\(--slate-200\);/g,
    'border: 1px solid var(--report-border);'
);

// 3. Fix the hardcoded #000 border in the first reportContent
fabricContent = fabricContent.replace(
    '<td class="header-logo-cell" style="border-right: 1px solid #000; border-bottom: 1px solid #000;">',
    '<td class="header-logo-cell" style="border-right: 1px solid var(--report-border); border-bottom: 1px solid var(--report-border);">'
);

// 4. Remove the duplicated reportContent block (lines 975 to EOF)
const secondReportRegex = /<!-- Main Report Card Document -->\s*<div class="report-card" id="reportContent">([\s\S]*?)<\/body>/;
const matchSecondReport = fabricContent.match(secondReportRegex);

if (matchSecondReport) {
    const firstPart = fabricContent.substring(0, matchSecondReport.index);
    const scriptMatch = matchSecondReport[0].match(/(<script>[\s\S]*?<\/script>)/);
    
    if (scriptMatch) {
        const scriptBlock = scriptMatch[1];
        fabricContent = firstPart + '\n    ' + scriptBlock + '\n  </body>\n</html>';
    }
}

// 5. Rename the tabs
fabricContent = fabricContent.replace('Nhập Mẫu Mới', '1. Testing Report');
fabricContent = fabricContent.replace('Dữ Liệu Đo Lường', '2. Testing Analysis');

// 6. Extract missing JS from Index_GAS.html
const jsRegex = /(\/\* Premium Tab Navigation & Historical Table Javascript Logic \*\/[\s\S]*?)<\/script>/;
const jsMatch = gasContent.match(jsRegex);

if (jsMatch) {
    let jsCode = jsMatch[1];
    fabricContent = fabricContent.replace('</script>\n  </body>', '\n      ' + jsCode.trim() + '\n    </script>\n  </body>');
}

fs.writeFileSync(fabricFile, fabricContent, 'utf8');
console.log("Restoration complete!");
