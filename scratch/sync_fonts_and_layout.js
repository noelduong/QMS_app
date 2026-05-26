const fs = require('fs');
const path = require('path');

const gasFile = path.join(__dirname, '..', 'Index_GAS.html');
const returnFile = path.join(__dirname, '..', 'placeholders', 'return.html');

// --- 1. PROCESS Index_GAS.html ---
if (fs.existsSync(gasFile)) {
  console.log("Reading Index_GAS.html...");
  let gasText = fs.readFileSync(gasFile, 'utf8');

  // Replace font link
  const oldLink = '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />';
  const newLink = '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />';
  gasText = gasText.replace(oldLink, newLink);

  // Replace Outfit references
  gasText = gasText.replace(/'Outfit', sans-serif/g, "'Plus Jakarta Sans', sans-serif");
  gasText = gasText.replace(/'Outfit'/g, "'Plus Jakarta Sans'");

  // Replace Google Sans inside chart config
  gasText = gasText.replace(/family:\s*'Google Sans'/g, "family: 'Plus Jakarta Sans'");

  fs.writeFileSync(gasFile, gasText, 'utf8');
  console.log("Index_GAS.html processed successfully!");
} else {
  console.warn("Index_GAS.html not found.");
}

// --- 2. COMPILE Index_GAS.html to fabric_testing.html & Index.html ---
// We will trigger compile command from the runner or inside this script.

// --- 3. PROCESS return.html ---
if (fs.existsSync(returnFile)) {
  console.log("Reading return.html...");
  let retText = fs.readFileSync(returnFile, 'utf8');

  // Normalize line endings to LF to run clean string replaces
  retText = retText.replace(/\r\n/g, '\n');

  // Replace glass-card styling block
  const oldGlassCardStyle = `    /* Modern Glass Cards */
    .glass-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .glass-card:hover {
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.06);
    }`;

  const newGlassCardStyle = `    /* Modern Solid Cards like Fabric Testing */
    .glass-card {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .glass-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.05);
      border-color: rgba(99, 102, 241, 0.2);
    }`;

  if (retText.includes(oldGlassCardStyle)) {
    retText = retText.replace(oldGlassCardStyle, newGlassCardStyle);
    console.log("Successfully replaced glass-card style!");
  } else {
    console.warn("Could not find exact glass-card style block.");
  }

  // Replace KPIs Stats Grid block
  const lines = retText.split('\n');
  const newLines = [];
  let skip = false;
  let replacedStats = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('<!-- Stats / KPIs Grid -->')) {
      newLines.push(line);
      skip = true;

      // Insert new KPIs grid
      newLines.push(`      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Total Quantity KPI -->
        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]">
          <div class="flex flex-col justify-between h-[72px]">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tổng sản phẩm lỗi</span>
            <div class="text-2xl font-extrabold text-slate-800" id="stat-total-qty">0</div>
            <span class="text-[10px] text-slate-400 font-semibold">Sản phẩm bị lỗi trả về</span>
          </div>
          <div class="w-12 h-12 rounded-[14px] bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100/50">
            <i data-feather="package" class="w-5 h-5"></i>
          </div>
        </div>

        <!-- Total Financial Value KPI -->
        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]">
          <div class="flex flex-col justify-between h-[72px]">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Thiệt hại tài chính</span>
            <div class="text-xl font-extrabold text-slate-800" id="stat-total-val">0 ₫</div>
            <span class="text-[10px] text-slate-400 font-semibold">Theo đơn giá sản phẩm</span>
          </div>
          <div class="w-12 h-12 rounded-[14px] bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100/50">
            <i data-feather="dollar-sign" class="w-5 h-5"></i>
          </div>
        </div>

        <!-- Defect Ratio KPI -->
        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]">
          <div class="flex flex-col justify-between h-[72px]">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tổng Lỗi Sản Xuất</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl font-extrabold text-slate-800" id="stat-prod-defects">0 pcs</span>
              <span class="text-[10px] font-bold text-emerald-500" id="stat-defect-rate-sub">Rate: 0%</span>
            </div>
            <span class="text-[9px] font-black tracking-wide block text-emerald-500" id="stat-defect-alert-sub">✓ Đang tính toán...</span>
          </div>
          <div class="w-12 h-12 rounded-[14px] bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100/50 transition-all duration-300" id="stat-defect-icon-container">
            <i data-feather="alert-circle" id="stat-defect-icon" class="w-5 h-5"></i>
          </div>
        </div>

        <!-- Top Defective Factory KPI -->
        <div class="bg-white p-5 rounded-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] flex items-center justify-between min-h-[110px] transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.05)] hover:border-[rgba(99,102,241,0.2)]" id="stat-top-supplier-card">
          <div class="flex flex-col justify-between h-[72px] min-w-0 flex-1 pr-2">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Nhà máy lỗi nhiều nhất</span>
            <div class="text-xl font-extrabold text-slate-800 truncate" id="stat-top-supplier">N/A</div>
            <span class="text-[10px] text-slate-400 font-semibold truncate" id="stat-top-supplier-sub">Chưa có dữ liệu</span>
          </div>
          <div class="w-12 h-12 rounded-[14px] bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200/50" id="stat-top-supplier-icon-container">
            <i data-feather="home" class="w-5 h-5"></i>
          </div>
        </div>

      </div>`);
      replacedStats = true;
      continue;
    }

    if (skip) {
      if (line.trim() === '</div>' && lines[i+1] && lines[i+1].includes('<!-- Actionable Insights Dashboard -->')) {
        skip = false;
      }
      continue;
    }

    newLines.push(line);
  }

  if (replacedStats) {
    retText = newLines.join('\n');
    console.log("Successfully replaced KPIs stats grid!");
  } else {
    console.warn("Could not find exact stats grid block.");
  }

  // Restore line endings to CRLF for standard windows files
  fs.writeFileSync(returnFile, retText.replace(/\n/g, '\r\n'), 'utf8');
  console.log("return.html processed successfully!");
} else {
  console.warn("return.html not found.");
}
