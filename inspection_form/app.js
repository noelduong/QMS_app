/* AQL Rules from code.gs */
const AQL_RULES = [
  {min:2,max:50,sample:8,levels:{"2.5":{a:0,r:1},"4.0":{a:1,r:2}}},
  {min:51,max:90,sample:13,levels:{"2.5":{a:1,r:2},"4.0":{a:2,r:3}}},
  {min:91,max:150,sample:20,levels:{"2.5":{a:1,r:2},"4.0":{a:2,r:3}}},
  {min:151,max:280,sample:32,levels:{"2.5":{a:2,r:3},"4.0":{a:3,r:4}}},
  {min:281,max:500,sample:50,levels:{"2.5":{a:3,r:4},"4.0":{a:5,r:6}}},
  {min:501,max:1200,sample:80,levels:{"2.5":{a:5,r:6},"4.0":{a:7,r:8}}},
  {min:1201,max:3200,sample:125,levels:{"2.5":{a:7,r:8},"4.0":{a:10,r:11}}},
  {min:3201,max:10000,sample:200,levels:{"2.5":{a:10,r:11},"4.0":{a:14,r:15}}}
];

let measurementData = {};
let defectRows = [
  {section:'I - APPEARANCE',point:'',desc:'',qty:0,critical:0,major:0,minor:0,action:''},
  {section:'II - WORKMANSHIP',point:'',desc:'',qty:0,critical:0,major:0,minor:0,action:''},
  {section:'III - DEFECT & FINISHING',point:'',desc:'',qty:0,critical:0,major:0,minor:0,action:''}
];
let overallDefectImages = [];

function getAqlRule(qty) {
  return AQL_RULES.find(r => qty >= r.min && qty <= r.max) || null;
}

function getSampleSize(qty) {
  const rule = getAqlRule(qty);
  return rule ? rule.sample : 0;
}

/* ---- SECTION 1: GENERAL ---- */
function onCategoryChange() {
  const cat = document.getElementById('inp-category').value;
  const specs = SPECS_DATA[cat];
  if (!specs) return;
  const sizes = new Set();
  Object.values(specs).forEach(pts => Object.keys(pts).forEach(sz => sizes.add(sz)));
  document.getElementById('inp-sizes').value = [...sizes].join(', ');
  buildMeasurementTable();
  buildSummary();
}

function onQtyChange() {
  const qty = parseInt(document.getElementById('inp-poqty').value) || 0;
  const sample = getSampleSize(qty);
  document.getElementById('inp-samplesize').value = sample || '';
  const rule = getAqlRule(qty);
  const infoEl = document.getElementById('aql-info');
  if (rule) {
    infoEl.textContent = `Lot ${rule.min}-${rule.max} → Sample: ${rule.sample} | Major(2.5): Ac≤${rule.levels["2.5"].a} Re≥${rule.levels["2.5"].r} | Minor(4.0): Ac≤${rule.levels["4.0"].a} Re≥${rule.levels["4.0"].r}`;
    infoEl.style.display = '';
  } else if (qty) {
    infoEl.textContent = 'Không tìm thấy AQL rule cho số lượng này';
    infoEl.style.display = '';
  } else {
    infoEl.style.display = 'none';
  }
  buildSummary();
}

/* ---- STEP 2: MEASUREMENTS ---- */
function buildMeasurementTable() {
  const cat = document.getElementById('inp-category').value;
  const specs = SPECS_DATA[cat];
  const container = document.getElementById('meas-table-container');
  if (!specs || !cat) {
    container.innerHTML = '<p class="text-center text-slate-400 py-10">Vui lòng chọn Category ở Step 1</p>';
    return;
  }
  const sizesStr = document.getElementById('inp-sizes').value;
  const sizes = sizesStr.split(',').map(s => s.trim()).filter(Boolean);
  const points = Object.keys(specs);
  const measSamplesEl = document.getElementById('inp-meas-samples');
  const numSamples = measSamplesEl ? (parseInt(measSamplesEl.value) || 3) : 3;

  let html = '<div class="overflow-x-auto"><table class="meas-tbl"><thead><tr><th class="sticky-col">Điểm đo</th><th>Tol</th>';
  sizes.forEach((sz, sIdx) => {
    const bgCls = sIdx % 2 === 0 ? 'bg-stripe-even' : 'bg-stripe-odd';
    html += `<th colspan="${numSamples}" class="text-center size-divider ${bgCls}">${sz}<br><span class="text-[10px] text-slate-400">Spec</span></th>`;
  });
  html += '<th>Kết quả</th></tr>';
  html += '<tr><th class="sticky-col"></th><th></th>';
  sizes.forEach((sz, sIdx) => {
    const bgCls = sIdx % 2 === 0 ? 'bg-stripe-even' : 'bg-stripe-odd';
    for (let i = 1; i <= numSamples; i++) {
      const isLast = i === numSamples;
      const borderCls = isLast ? 'size-divider' : '';
      const cls = `text-center text-xs text-slate-400 ${bgCls} ${borderCls}`.trim();
      html += `<th class="${cls}">${i}</th>`;
    }
  });
  html += '<th></th></tr></thead><tbody>';

  points.forEach(pt => {
    const firstSize = sizes[0];
    const tol = specs[pt] && specs[pt][firstSize] ? specs[pt][firstSize].t : '';
    html += `<tr><td class="sticky-col font-medium text-xs">${pt}</td><td class="text-center text-xs">±${tol}</td>`;
    sizes.forEach((sz, sIdx) => {
      const bgCls = sIdx % 2 === 0 ? 'bg-stripe-even' : 'bg-stripe-odd';
      const spec = specs[pt] && specs[pt][sz] ? specs[pt][sz].s : '';
      for (let i = 0; i < numSamples; i++) {
        const isLast = i === numSamples - 1;
        const borderCls = isLast ? 'size-divider' : '';
        const cls = `p-0 ${bgCls} ${borderCls}`.trim();
        const key = `${pt}|${sz}|${i}`;
        const val = measurementData[key] || '';
        html += `<td class="${cls}"><div class="text-[9px] text-slate-400 text-center">${spec}</div><input type="number" step="0.1" class="meas-input" data-key="${key}" data-spec="${spec}" data-tol="${tol}" value="${val}" oninput="onMeasInput(this)"></td>`;
      }
    });
    html += '<td class="text-center" id="result-' + CSS.escape(pt) + '">–</td></tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
  recalcAllMeasResults();
}

function onMeasInput(el) {
  measurementData[el.dataset.key] = el.value;
  const spec = parseFloat(el.dataset.spec);
  const tol = parseFloat(el.dataset.tol);
  const val = parseFloat(el.value);
  if (!isNaN(val) && !isNaN(spec) && !isNaN(tol)) {
    const pass = Math.abs(val - spec) <= tol;
    el.className = 'meas-input ' + (pass ? 'meas-pass' : 'meas-fail');
  } else {
    el.className = 'meas-input';
  }
  recalcAllMeasResults();
}

function recalcAllMeasResults() {
  const stats = {total: 0, pass: 0, fail: 0};
  const pointStats = {};

  document.querySelectorAll('.meas-input').forEach(el => {
    const val = parseFloat(el.value);
    const spec = parseFloat(el.dataset.spec);
    const tol = parseFloat(el.dataset.tol);
    const pointName = el.dataset.key.split('|')[0];

    if (!pointStats[pointName]) pointStats[pointName] = { total: 0, fail: 0 };

    if (!isNaN(val) && !isNaN(spec) && !isNaN(tol)) {
      stats.total++;
      pointStats[pointName].total++;
      if (Math.abs(val - spec) <= tol) {
        stats.pass++;
      } else {
        stats.fail++;
        pointStats[pointName].fail++;
      }
    }
  });

  // Update row results
  Object.keys(pointStats).forEach(pt => {
    const resEl = document.getElementById('result-' + CSS.escape(pt));
    if (resEl) {
      const pStat = pointStats[pt];
      if (pStat.total === 0) {
        resEl.innerHTML = '–';
        resEl.className = 'text-center text-slate-400';
      } else if (pStat.fail === 0) {
        resEl.innerHTML = '<span class="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Đạt</span>';
        resEl.className = 'text-center';
      } else {
        resEl.innerHTML = '<span class="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">Không đạt</span>';
        resEl.className = 'text-center';
      }
    }
  });

  const el = document.getElementById('meas-summary');
  if (el) {
    const rate = stats.total ? ((stats.fail / stats.total) * 100).toFixed(1) : '0.0';
    el.innerHTML = `Đã đo: <b>${stats.total}</b> | Đạt: <b class="text-emerald-600">${stats.pass}</b> | Không đạt: <b class="text-red-500">${stats.fail}</b> | Tỷ lệ lỗi: <b>${rate}%</b>`;
  }
  buildSummary();
}

function getMeasStats() {
  let total = 0, fail = 0;
  document.querySelectorAll('.meas-input').forEach(el => {
    const val = parseFloat(el.value);
    const spec = parseFloat(el.dataset.spec);
    const tol = parseFloat(el.dataset.tol);
    if (!isNaN(val) && !isNaN(spec) && !isNaN(tol)) {
      total++;
      if (Math.abs(val - spec) > tol) fail++;
    }
  });
  return {total, fail, rate: total ? fail / total : 0};
}

/* ---- STEP 3: DEFECTS ---- */
function renderDefectRows() {
  const container = document.getElementById('defect-rows');
  
  let html = `
    <div class="overflow-x-auto rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md shadow-sm mb-4">
      <table class="w-full text-left text-sm whitespace-nowrap">
        <thead class="bg-white/50 text-slate-500 font-medium border-b border-black/5">
          <tr>
            <th class="px-4 py-3 border-b border-black/5 w-48">Hạng mục kiểm</th>
            <th class="px-4 py-3 border-b border-black/5 min-w-[200px]">Mô tả lỗi</th>
            <th class="px-2 py-3 border-b border-black/5 w-16 text-center" title="Critical">Cri</th>
            <th class="px-2 py-3 border-b border-black/5 w-16 text-center" title="Major">Maj</th>
            <th class="px-2 py-3 border-b border-black/5 w-16 text-center" title="Minor">Min</th>
            <th class="px-2 py-3 border-b border-black/5 w-16 text-center">Qty</th>
            <th class="px-4 py-3 border-b border-black/5 min-w-[200px]">Hành động khắc phục</th>
            <th class="px-3 py-3 border-b border-black/5 w-10 text-center"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/5">
  `;

  defectRows.forEach((row, i) => {
    html += `
      <tr class="hover:bg-white/60 transition-colors group">
        <td class="p-2 border-r border-black/5">
          <select class="w-full bg-transparent border-0 text-sm p-1 outline-none focus:ring-2 focus:ring-blue-500/30 rounded" onchange="defectRows[${i}].section=this.value">
            <option ${row.section.includes('APPEARANCE')?'selected':''}>I - APPEARANCE</option>
            <option ${row.section.includes('WORKMANSHIP')?'selected':''}>II - WORKMANSHIP</option>
            <option ${row.section.includes('DEFECT')?'selected':''}>III - DEFECT & FINISHING</option>
          </select>
        </td>
        <td class="p-2 border-r border-black/5">
          <input type="text" class="w-full bg-transparent border-0 text-sm p-1 outline-none focus:ring-2 focus:ring-blue-500/30 rounded" placeholder="Nhập mô tả lỗi..." value="${row.desc}" oninput="defectRows[${i}].desc=this.value">
        </td>
        <td class="p-2 border-r border-black/5">
          <input type="number" class="w-full bg-transparent border-0 text-sm p-1 text-center outline-none focus:ring-2 focus:ring-blue-500/30 rounded" value="${row.critical || ''}" min="0" placeholder="0" oninput="defectRows[${i}].critical=+this.value; updateRowQty(${i}); updateDefectTotals()">
        </td>
        <td class="p-2 border-r border-black/5">
          <input type="number" class="w-full bg-transparent border-0 text-sm p-1 text-center outline-none focus:ring-2 focus:ring-blue-500/30 rounded" value="${row.major || ''}" min="0" placeholder="0" oninput="defectRows[${i}].major=+this.value; updateRowQty(${i}); updateDefectTotals()">
        </td>
        <td class="p-2 border-r border-black/5">
          <input type="number" class="w-full bg-transparent border-0 text-sm p-1 text-center outline-none focus:ring-2 focus:ring-blue-500/30 rounded" value="${row.minor || ''}" min="0" placeholder="0" oninput="defectRows[${i}].minor=+this.value; updateRowQty(${i}); updateDefectTotals()">
        </td>
        <td class="p-2 border-r border-black/5 text-center bg-white/20">
          <span class="font-semibold text-slate-700" id="def-qty-${i}">${row.qty || 0}</span>
        </td>
        <td class="p-2 border-r border-black/5">
          <input type="text" class="w-full bg-transparent border-0 text-sm p-1 outline-none focus:ring-2 focus:ring-blue-500/30 rounded" placeholder="Khắc phục..." value="${row.action}" oninput="defectRows[${i}].action=this.value">
        </td>
        <td class="p-2 text-center">
          <button onclick="removeDefectRow(${i})" class="text-slate-400 hover:text-red-500 w-6 h-6 flex items-center justify-center rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mx-auto" title="Xóa dòng này">✕</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
  updateDefectTotals();
  renderOverallDefectImages();
  if (typeof feather !== 'undefined') feather.replace();
}

function addDefectRow() {
  defectRows.push({section:'I - APPEARANCE',point:'',desc:'',qty:0,critical:0,major:0,minor:0,action:''});
  renderDefectRows();
}

function removeDefectRow(i) {
  defectRows.splice(i, 1);
  renderDefectRows();
}

function renderOverallDefectImages() {
  const listEl = document.getElementById('overall-defect-images-list');
  if (!listEl) return;

  let html = '';
  overallDefectImages.forEach((img, idx) => {
    const src = img.previewUrl || img.image;
    if (src) {
      html += `
        <div class="relative w-16 h-16 group">
          <img src="${src}" class="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition-all" onclick="window.open('${src}', '_blank')">
          <button onclick="removeOverallDefectImage(${idx})" class="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] shadow-md transition-colors" title="Xóa ảnh">✕</button>
        </div>
      `;
    }
  });

  // Dash add button at the end
  html += `
    <div class="relative w-16 h-16">
      <input type="file" accept="image/*" multiple id="overall-img-input" class="hidden" onchange="handleOverallDefectImageChange(this)">
      <label for="overall-img-input" class="cursor-pointer flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border border-dashed border-slate-300 shadow-sm" title="Thêm ảnh">
        <i data-feather="plus" class="w-5 h-5"></i>
        <span class="text-[9px] font-medium mt-0.5">Thêm ảnh</span>
      </label>
    </div>
  `;

  listEl.innerHTML = html;
  if (typeof feather !== 'undefined') feather.replace();
}

window.handleOverallDefectImageChange = function(input) {
  const files = input.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = function(e) {
      overallDefectImages.push({
        localImageBase64: e.target.result,
        previewUrl: e.target.result,
        image: null
      });
      renderOverallDefectImages();
    };
    reader.readAsDataURL(file);
  }
  // Clear input so selecting the same files again triggers change event
  input.value = '';
};

window.removeOverallDefectImage = function(index) {
  overallDefectImages.splice(index, 1);
  renderOverallDefectImages();
};

function updateRowQty(i) {
  const r = defectRows[i];
  r.qty = (r.critical || 0) + (r.major || 0) + (r.minor || 0);
  const el = document.getElementById(`def-qty-${i}`);
  if (el) el.textContent = r.qty;
}

function updateDefectTotals() {
  let c = 0, m = 0, mn = 0, q = 0;
  defectRows.forEach(r => { c += r.critical || 0; m += r.major || 0; mn += r.minor || 0; q += r.qty || 0; });
  const el = document.getElementById('defect-totals');
  if (el) el.innerHTML = `Tổng SL lỗi: <b>${q}</b> | Critical: <b class="text-red-500">${c}</b> | Major: <b class="text-orange-500">${m}</b> | Minor: <b class="text-yellow-600">${mn}</b>`;
  buildSummary();
}

function getDefectTotals() {
  let c = 0, m = 0, mn = 0, q = 0;
  defectRows.forEach(r => { c += r.critical || 0; m += r.major || 0; mn += r.minor || 0; q += r.qty || 0; });
  return {critical: c, major: m, minor: mn, totalQty: q};
}

/* ---- STEP 4: SUMMARY ---- */
function buildSummary() {
  const qty = parseInt(document.getElementById('inp-poqty').value) || 0;
  const rule = getAqlRule(qty);
  const meas = getMeasStats();
  const def = getDefectTotals();
  const container = document.getElementById('summary-content');

  if (!rule) {
    container.innerHTML = '<p class="text-red-500 text-center py-10">Không tìm thấy AQL rule. Kiểm tra PO Qty ở Step 1.</p>';
    return;
  }

  const measPass = meas.rate <= 0.30;
  const critPass = def.critical === 0;
  const majPass = def.major <= rule.levels["2.5"].a;
  const minPass = def.minor <= rule.levels["4.0"].a;
  const appPass = critPass && majPass && minPass;
  const finalPass = measPass && appPass;
  const appRate = ((def.totalQty / rule.sample) * 100).toFixed(2) + "%";

  let html = `
  <!-- EDITORIAL HERO VERDICT (GLASSMORPHISM) -->
  <div class="relative bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
    <!-- Accent Bar Navy -->
    <div class="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>
    
    <div class="flex-1">
      <div class="flex items-center gap-3 mb-3">
        <h3 class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Inspection Final Verdict</h3>
        <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${finalPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}">
          ${finalPass ? 'Approved' : 'Rejected'}
        </span>
      </div>
      
      <!-- Hero Underline -->
      <div class="h-1 w-16 bg-slate-800 mb-5"></div>
      
      <div class="flex items-baseline gap-4 mb-2">
        <h2 class="text-4xl md:text-5xl font-black tracking-tight ${finalPass ? 'text-emerald-600' : 'text-rose-600'}">
          ${finalPass ? 'PASS' : 'FAIL'}
        </h2>
        <span class="text-lg text-slate-400 font-light hidden md:inline-block">
          — ${finalPass ? 'Quality standards met.' : 'Quality standards failed.'}
        </span>
      </div>
      
      <!-- Italic Insight One-liner -->
      <p class="text-slate-500 italic text-sm mt-1 font-serif">
        ${finalPass 
          ? 'Tất cả các thông số đo và kiểm tra ngoại quan đều đạt yêu cầu AQL.' 
          : 'Có hạng mục vượt ngưỡng dung sai hoặc giới hạn lỗi AQL cho phép.'}
      </p>
    </div>

    <!-- Meta Band Right-Aligned -->
    <div class="md:text-right border-t md:border-t-0 md:border-l border-slate-200/60 pt-5 md:pt-0 md:pl-8 min-w-[200px]">
      <div class="mb-4">
        <div class="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-1 font-semibold">Lot Quantity</div>
        <div class="text-2xl font-bold text-slate-800">${qty} <span class="text-sm font-normal text-slate-400">pcs</span></div>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-1 font-semibold">Sample Size</div>
        <div class="text-2xl font-bold text-slate-800">${rule.sample} <span class="text-sm font-normal text-slate-400">pcs</span></div>
      </div>
    </div>
  </div>

  <!-- BREAKDOWN CARDS (GLASS STYLE) -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    
    <!-- Measurement Tab -->
    <div class="bg-white/50 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col h-full hover:bg-white/80 transition-colors">
      <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div class="text-slate-400"><i data-feather="crosshair" class="w-5 h-5"></i></div>
        <div>
          <h4 class="font-bold text-slate-800 text-sm uppercase tracking-wider">Measurement Check</h4>
        </div>
        <div class="ml-auto text-[11px] font-bold px-2 py-0.5 rounded ${measPass ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}">
          ${measPass ? 'PASS' : 'FAIL'}
        </div>
      </div>

      <div class="space-y-5 flex-1">
        <div>
          <div class="flex justify-between text-xs mb-2"><span class="text-slate-500 font-medium">Tỷ lệ lỗi (Ngưỡng ≤ 30%)</span><span class="font-bold ${measPass ? 'text-emerald-600' : 'text-rose-600'}">${(meas.rate*100).toFixed(1)}%</span></div>
          <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full ${measPass ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full transition-all duration-1000" style="width: ${Math.min(meas.rate*100, 100)}%"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="bg-white border border-slate-100 shadow-sm rounded-xl p-3 text-center">
            <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Tổng điểm đo</div>
            <div class="text-xl font-bold text-slate-700">${meas.total}</div>
          </div>
          <div class="bg-white border border-slate-100 shadow-sm rounded-xl p-3 text-center">
            <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Điểm lỗi</div>
            <div class="text-xl font-bold ${meas.fail > 0 ? 'text-rose-600' : 'text-slate-700'}">${meas.fail}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Appearance Tab -->
    <div class="bg-white/50 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col h-full hover:bg-white/80 transition-colors">
      <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div class="text-slate-400"><i data-feather="eye" class="w-5 h-5"></i></div>
        <div>
          <h4 class="font-bold text-slate-800 text-sm uppercase tracking-wider">Appearance Check</h4>
        </div>
        <div class="ml-auto text-[11px] font-bold px-2 py-0.5 rounded ${appPass ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}">
          ${appPass ? 'PASS' : 'FAIL'}
        </div>
      </div>

      <div class="space-y-3 flex-1">
        <div class="flex items-center justify-between p-2.5 rounded-lg border ${critPass ? 'border-slate-100 bg-white' : 'border-rose-100 bg-rose-50/30'}">
          <div><div class="text-xs font-bold text-slate-700 uppercase tracking-wide">Critical</div><div class="text-[10px] text-slate-400">Ac = 0</div></div>
          <div class="text-base font-bold ${critPass ? 'text-slate-700' : 'text-rose-600'}">${def.critical} <span class="text-xs font-normal ml-1">${critPass ? '✅' : '❌'}</span></div>
        </div>
        
        <div class="flex items-center justify-between p-2.5 rounded-lg border ${majPass ? 'border-slate-100 bg-white' : 'border-rose-100 bg-rose-50/30'}">
          <div><div class="text-xs font-bold text-slate-700 uppercase tracking-wide">Major</div><div class="text-[10px] text-slate-400">AQL 2.5 (Ac ≤ ${rule.levels["2.5"].a})</div></div>
          <div class="text-base font-bold ${majPass ? 'text-slate-700' : 'text-rose-600'}">${def.major} <span class="text-xs font-normal ml-1">${majPass ? '✅' : '❌'}</span></div>
        </div>

        <div class="flex items-center justify-between p-2.5 rounded-lg border ${minPass ? 'border-slate-100 bg-white' : 'border-rose-100 bg-rose-50/30'}">
          <div><div class="text-xs font-bold text-slate-700 uppercase tracking-wide">Minor</div><div class="text-[10px] text-slate-400">AQL 4.0 (Ac ≤ ${rule.levels["4.0"].a})</div></div>
          <div class="text-base font-bold ${minPass ? 'text-slate-700' : 'text-rose-600'}">${def.minor} <span class="text-xs font-normal ml-1">${minPass ? '✅' : '❌'}</span></div>
        </div>
      </div>
    </div>

  </div>
  `;
  container.innerHTML = html;
  if (typeof feather !== 'undefined') feather.replace();
}

/* ---- STEP 5: PDF EXPORT (Original format) ---- */
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCheckedImpactText(prefix) {
  const arr = [];
  if (document.getElementById(`impact_yes_${prefix}`)?.checked) arr.push("YES");
  if (document.getElementById(`impact_no_${prefix}`)?.checked) arr.push("NO");
  if (document.getElementById(`impact_reinspect_${prefix}`)?.checked) arr.push("RE-INSPECT");
  const time = document.getElementById(`impact_time_${prefix}`)?.value?.trim();
  return arr.join(", ") + (time ? ` | Deadline: ${time}` : "");
}

function exportInspectionPDF() {
  const v = id => (document.getElementById(id) || {}).value || '';
  const meas = getMeasStats();
  const def = getDefectTotals();
  const qty = parseInt(v('inp-poqty')) || 0;
  const rule = getAqlRule(qty);
  
  const measPass = meas.rate <= 0.30;
  const critPass = def.critical === 0;
  const majPass = rule ? def.major <= rule.levels["2.5"].a : true;
  const minPass = rule ? def.minor <= rule.levels["4.0"].a : true;
  const appPass = critPass && majPass && minPass;
  const finalPass = measPass && appPass;

  const general = {
    fob: v('inp-supplier'),
    product: v('inp-product'),
    product_code: v('inp-code'),
    category: v('inp-category'),
    color: v('inp-color'),
    ins_date: v('inp-date'),
    inspection_location: v('inp-location'),
    status: v('inp-status'),
    po_qty: v('inp-poqty'),
    sample_size: v('inp-samplesize'),
    size_range: v('inp-sizes'),
    po_month: v('inp-pomonth'),
    inspector: v('inp-inspector')
  };

  const sizesStr = v('inp-sizes');
  const sizes = sizesStr.split(',').map(s => s.trim()).filter(Boolean);
  const cat = v('inp-category');
  const specs = SPECS_DATA[cat] || {};
  const points = Object.keys(specs);
  const sampleCount = 5;
  
  const mRows = {};
  points.forEach(point => {
    mRows[point] = {};
    sizes.forEach(size => {
      const specObj = specs[point] && specs[point][size] ? specs[point][size] : { s: "", t: "" };
      const spec = specObj.s;
      const tol = specObj.t;
      const samples = [];
      for (let i = 0; i < sampleCount; i++) {
        const key = `${point}|${size}|${i}`;
        const val = measurementData[key] || '';
        let res = '';
        if (val !== '') {
           const nVal = parseFloat(val);
           const nSpec = parseFloat(spec);
           const nTol = parseFloat(tol);
           if (!isNaN(nVal) && !isNaN(nSpec) && !isNaN(nTol)) {
              res = Math.abs(nVal - nSpec) <= nTol ? "Đạt" : "Không đạt";
           }
        }
        samples.push({ value: val, result: res });
      }
      mRows[point][size] = { spec, tol, samples };
    });
  });

  const measurementDataPdf = {
    points,
    sizes,
    sampleCount,
    rows: mRows
  };

  const detailRows = defectRows.map(r => {
    return {
      section: r.section,
      point: r.point || r.section,
      description: r.desc,
      quantity: r.qty,
      critical: r.critical,
      major: r.major,
      minor: r.minor,
      corrective: r.action
    };
  }).filter(r => r.description || r.quantity > 0 || r.critical > 0 || r.major > 0 || r.minor > 0 || r.corrective);

  const summary = {
    meas_qty: meas.fail,
    meas_rate: (meas.rate * 100).toFixed(2) + "%",
    meas_cause: v('sum-meas-cause'),
    meas_impact: getCheckedImpactText("m"),
    meas_result: measPass ? "PASS" : "FAIL",

    app_qty: def.totalQty,
    app_rate: rule ? ((def.totalQty / rule.sample) * 100).toFixed(2) + "%" : "0.00%",
    app_cause: v('sum-app-cause'),
    app_impact: getCheckedImpactText("a"),
    app_result: appPass ? "PASS" : "FAIL",

    final_qty: `Critical ${def.critical} / Major ${def.major} / Minor ${def.minor}`,
    final_rate: finalPass ? "PASS" : "FAIL",
    final_cause: !measPass ? "Measurement fail rate > 30%" : (!critPass ? "Critical defect > 0" : (!appPass ? "AQL Major/Minor result" : "")),
    final_note: `PO Qty ${qty} | Sample Size ${rule?rule.sample:0} | Major Accept ${rule?rule.levels["2.5"].a:'-'} | Minor Accept ${rule?rule.levels["4.0"].a:'-'}`,
    final_result: finalPass ? "PASS" : "FAIL",

    remark: v('sum-remark'),
    ack_factory: v('sum-ack-factory'),
    ack_polomanor: v('sum-ack-qc'),
    ack_date: new Date().toLocaleDateString('vi-VN')
  };

  const thumbs = overallDefectImages
    .map((img, idx) => {
      const src = img.previewUrl || img.image;
      if (!src) return '';
      return `
        <div style="display:inline-block;margin:8px;text-align:center;border:1px solid #ddd;padding:6px;border-radius:8px;background:#fcfcfc;page-break-inside:avoid;">
          <img src="${src}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;display:block;margin-bottom:4px;">
          <div style="font-size:10px;color:#666;max-width:120px;word-break:break-all;">Defect Photo ${idx + 1}</div>
        </div>
      `;
    }).filter(h => h !== '').join("");

  const measurementHtml = (() => {
    if (!measurementDataPdf || !measurementDataPdf.points || !measurementDataPdf.points.length || !measurementDataPdf.sizes || !measurementDataPdf.sizes.length) {
      return `<div style="font-size:11px;color:#666;padding:8px 0">No measurement data</div>`;
    }

    const headerSizes = measurementDataPdf.sizes.map((size, sIdx) => {
      const bgCls = sIdx % 2 === 0 ? "bg-stripe-even" : "bg-stripe-odd";
      let html = `<th class="m-size ${bgCls}">${escapeHtml(size)}</th>`;
      for (let i = 1; i <= measurementDataPdf.sampleCount; i++) {
        const isLastSample = i === measurementDataPdf.sampleCount;
        const dividerCls = isLastSample ? "size-divider" : "";
        const cls = `m-sample ${bgCls} ${dividerCls}`.trim();
        html += `<th class="${cls}">${i}</th>`;
      }
      return html;
    }).join("");

    const bodyRows = measurementDataPdf.points.map((point, index) => {
      const firstSize = measurementDataPdf.sizes[0];
      const firstTol = measurementDataPdf.rows?.[point]?.[firstSize]?.tol ?? "";

      let rowHtml = `
        <tr>
          <td class="m-no">${index + 1}</td>
          <td class="m-point">${escapeHtml(point)}</td>
          <td class="m-tol">${escapeHtml(firstTol)}</td>
      `;

      measurementDataPdf.sizes.forEach((size, sIdx) => {
        const bgCls = sIdx % 2 === 0 ? "bg-stripe-even" : "bg-stripe-odd";
        const item = measurementDataPdf.rows?.[point]?.[size] || { spec:"", tol:"", samples:[] };

        rowHtml += `<td class="m-spec ${bgCls}">${escapeHtml(item.spec)}</td>`;

        for (let i = 0; i < measurementDataPdf.sampleCount; i++) {
          const sample = item.samples[i] || { value:"", result:"" };
          const resultCls = sample.result === "Đạt"
            ? "m-pass"
            : (sample.result === "Không đạt" ? "m-fail" : "");
          const isLastSample = i === measurementDataPdf.sampleCount - 1;
          const dividerCls = isLastSample ? "size-divider" : "";
          const combinedCls = `m-value ${resultCls} ${bgCls} ${dividerCls}`.trim();
          rowHtml += `<td class="${combinedCls}">${escapeHtml(sample.value)}</td>`;
        }
      });

      rowHtml += `</tr>`;
      return rowHtml;
    }).join("");

    return `
      <div class="measurement-pdf-wrap">
        <table class="measurement-pdf-table">
          <thead>
            <tr>
              <th class="m-no">No.</th>
              <th class="m-point">Inspect Points</th>
              <th class="m-tol">Tol</th>
              ${headerSizes}
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </div>
    `;
  })();

  const detailHtml = detailRows.length
  ? detailRows.map(row => `
    <tr>
      <td>${escapeHtml(row.point)}</td>
      <td class="pdf-note">${escapeHtml(row.description)}</td>
      <td>${escapeHtml(row.quantity)}</td>
      <td>${escapeHtml(row.critical)}</td>
      <td>${escapeHtml(row.major)}</td>
      <td>${escapeHtml(row.minor)}</td>
      <td class="pdf-note">${escapeHtml(row.corrective)}</td>
    </tr>
      `).join("")
      : `<tr><td colspan="7">No appearance/detail data</td></tr>`;

  const finalClass = summary.final_result === "PASS" ? "pdf-result-pass" : "pdf-result-fail";
  const gid = "N/A";
  const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

  const html = `
  <html>
  <head>
    <meta charset="utf-8">
    <base href="${baseUrl}">
    <title>Garment Inspection Report - Final</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box}
      body{
        font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
        color:#222;
        margin:0;
        background:#fff;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }
      .pdf-wrap{
        padding:10px 14px 76px 14px;
      }

      .report-header{
        width:100%;
        margin-bottom:10px;
        text-align:center;
      }

      .report-title-group{
        width:100%;
        margin:0 auto;
        text-align:center;
        padding-top:4px;
      }

      .report-top-line{
        font-size:14px;
        font-weight:700;
        line-height:1.35;
        margin-bottom:6px;
        letter-spacing:.2px;
      }

      .report-main-title{
        font-size:21px;
        font-weight:800;
        line-height:1.25;
        margin-bottom:6px;
        letter-spacing:.2px;
      }

      .report-sub-title{
        font-size:14.7px;
        font-weight:700;
        line-height:1.3;
      }

      .pdf-meta{
        font-size:11px;
        color:#555;
        margin:4px 0 10px 2px;
      }

      .pdf-section{
        margin-top:14px;
        page-break-inside:avoid;
      }

      .pdf-grid{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:6px 16px;
      }

      .pdf-item{
        font-size:11px;
        line-height:1.4;
      }

      .pdf-table,
      .pdf-detail-table,
      .measurement-pdf-table{
        width:100%;
        border-collapse:collapse;
      }

      .pdf-table th,.pdf-table td,
      .pdf-detail-table th,.pdf-detail-table td{
        border:1px solid #d7d7d7;
        padding:6px 7px;
        font-size:10px;
        vertical-align:top;
        word-break:break-word;
      }

      .pdf-table th,
      .pdf-detail-table th{
        background:#efefef;
        font-weight:700;
        text-align:center;
      }

      .pdf-note{
        white-space:pre-wrap;
      }

      .pdf-result-pass{
        color:#0a772a;
        font-weight:800;
      }

      .pdf-result-fail{
        color:#c33;
        font-weight:800;
      }

      .photo-wrap{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
      }

      .measurement-pdf-table th,
      .measurement-pdf-table td{
        border:1px solid #b8b8b8;
        padding:4px 3px;
        font-size:9px;
        text-align:center;
        vertical-align:middle;
        word-break:break-word;
      }

      .measurement-pdf-table thead th{
        background:#efefef;
        font-weight:700;
      }

      .measurement-pdf-table .m-no{ width:28px; }
      .measurement-pdf-table .m-point{
        width:140px;
        text-align:left;
        padding-left:6px;
        line-height:1.25;
      }
      .measurement-pdf-table .m-tol{
        width:36px;
        background:#fafafa;
      }
      .measurement-pdf-table .m-size{
        width:42px;
        color:#c96f00;
        font-weight:800;
        background:#efefef;
      }
      .measurement-pdf-table .m-spec{
        color:#d97706;
        font-weight:800;
        background:#fafafa;
      }
      .measurement-pdf-table .m-sample{
        width:28px;
        background:#efefef;
        font-size:8.5px;
      }
      .measurement-pdf-table .size-divider{
        border-right: 2.5px solid #4a5568 !important;
      }
      .measurement-pdf-table .bg-stripe-even{
        background:#f8fafc !important;
      }
      .measurement-pdf-table .bg-stripe-odd{
        background:#ffffff !important;
      }
      .measurement-pdf-table .m-value{
        background:#fff;
      }
      .measurement-pdf-table .m-pass{
        background:#edf9f0;
        color:#0a772a;
        font-weight:700;
      }
      .measurement-pdf-table .m-fail{
        background:#fff0f0;
        color:#b42318;
        font-weight:700;
      }

      .pdf-footer{
      margin-top:30px;
      padding-top:6px;
      border-top:1px solid #0F2942;
      font-size:9.5px;
      color:#0F2942;
      display:flex;
      justify-content:space-between;
    }

      .pdf-footer-left{
      text-align:left;
      line-height:1.4;
      }

      .pdf-footer-right{
      text-align:right;
      font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      font-size:12px;
      font-weight:500;
      letter-spacing:.4px;
      color:#0F2942;
      line-height:1;
      }

      @page{
      size:A4 landscape;
      margin:3mm 3mm 3.5mm 3mm;
      }
    </style>
  </head>
  <body>
    <div class="pdf-wrap">
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
  <tr style="background:#23314b;color:#e6edf3;">
    
    <!-- LEFT: LOGO -->
    <td style="width:25%;height:70px;text-align:center;vertical-align:middle;padding:4px;">
  
  <div style="
      width:240px;
      height:60px;
      margin:0 auto;
      overflow:hidden;
      border-radius:2px;
      position:relative;
      left:-25px;
  ">
    <img src="logo.png"
         style="
           width:100%;
           height:100%;
           object-fit:contain;
           object-position:center;
         ">
  </div>

</td>

    <!-- CENTER: TITLE -->
    <td style="width:50%;text-align:center;vertical-align:middle;padding:4px 6px;">
      
      <div style="font-size:12px;font-weight:600;color:#cfd8e3;margin-bottom:2px;">
        PHÒNG NGHIÊN CỨU & PHÁT TRIỂN SẢN PHẨM POLOMANOR
      </div>

      <div style="font-size:18px;font-weight:800;color:#ffffff;margin-bottom:2px;">
        GARMENT INSPECTION REPORT - FINAL
      </div>

      <div style="font-size:12px;font-weight:600;color:#d6dee8;">
        Biên bản kiểm hàng Final
      </div>

    </td>

    <!-- RIGHT: INFO -->
    <td style="width:25%;vertical-align:middle;padding:6px 20px 6px 6px;font-size:11px;text-align:right;">
      <div style="display:inline-block; text-align:left;">
        <div style="margin-bottom:4px;color:#e0e6ef;">
          <strong>PO / MONTH:</strong>
          ${escapeHtml(general.po_month)}
        </div>

        <div style="color:#e0e6ef;">
          <strong>INSPECTOR:</strong>
          ${escapeHtml(general.inspector)}
        </div>
      </div>
    </td>

  </tr>
</table>

      <div class="pdf-meta">General ID: ${escapeHtml(gid)}</div>

      <div class="pdf-section">
        <h4>A. GENERAL INFORMATION</h4>
        <div class="pdf-grid">
          <div class="pdf-item"><strong>Supplier / Factory:</strong> ${escapeHtml(general.fob)}</div>
          <div class="pdf-item"><strong>Product name:</strong> ${escapeHtml(general.product)}</div>
          <div class="pdf-item"><strong>Product code:</strong> ${escapeHtml(general.product_code)}</div>
          <div class="pdf-item"><strong>Category:</strong> ${escapeHtml(general.category)}</div>
          <div class="pdf-item"><strong>Color:</strong> ${escapeHtml(general.color)}</div>
          <div class="pdf-item"><strong>Inspection date:</strong> ${escapeHtml(general.ins_date)}</div>
          <div class="pdf-item"><strong>Location:</strong> ${escapeHtml(general.inspection_location)}</div>
          <div class="pdf-item"><strong>Status:</strong> ${escapeHtml(general.status)}</div>
          <div class="pdf-item"><strong>PO Qty:</strong> ${escapeHtml(general.po_qty)}</div>
          <div class="pdf-item"><strong>Sample size:</strong> ${escapeHtml(general.sample_size)}</div>
          <div class="pdf-item"><strong>Size range:</strong> ${escapeHtml(general.size_range)}</div>
          <div class="pdf-item"><strong>Inspector:</strong> ${escapeHtml(general.inspector)}</div>
        </div>
      </div>

      <div class="pdf-section">
        <h4>B. GARMENT MEASUREMENT CHART CHECKING</h4>
        ${measurementHtml}
      </div>

      <div class="pdf-section">
        <h4>C. GARMENT APPEARANCE & DETAIL INSPECTION CHECKLIST</h4>
        <table class="pdf-detail-table">
          <thead>
            <tr>
              <th style="width:16%">Inspection Point</th>
              <th style="width:28%">Detailed Description</th>
              <th style="width:8%">Qty</th>
              <th style="width:8%">Critical</th>
              <th style="width:8%">Major</th>
              <th style="width:8%">Minor</th>
              <th style="width:24%">Corrective Action</th>
            </tr>
          </thead>
          <tbody>
            ${detailHtml}
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <h4>D. OVERALL RESULT SUMMARY</h4>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Criteria</th>
              <th>Defective Qty</th>
              <th>Defect Rate</th>
              <th>Cause</th>
              <th>Impact / Time bound</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Measurement</td>
              <td>${escapeHtml(summary.meas_qty)}</td>
              <td>${escapeHtml(summary.meas_rate)}</td>
              <td class="pdf-note">${escapeHtml(summary.meas_cause)}</td>
              <td class="pdf-note">${escapeHtml(summary.meas_impact)}</td>
              <td>${escapeHtml(summary.meas_result)}</td>
            </tr>
            <tr>
              <td>Appearance</td>
              <td>${escapeHtml(summary.app_qty)}</td>
              <td>${escapeHtml(summary.app_rate)}</td>
              <td class="pdf-note">${escapeHtml(summary.app_cause)}</td>
              <td class="pdf-note">${escapeHtml(summary.app_impact)}</td>
              <td>${escapeHtml(summary.app_result)}</td>
            </tr>
            <tr style="background:#e9e9e9;font-weight:700;">
              <td><strong>FINAL RESULT</strong></td>
              <td>${escapeHtml(summary.final_qty)}</td>
              <td>${escapeHtml(summary.final_rate)}</td>
              <td class="pdf-note">${escapeHtml(summary.final_cause)}</td>
              <td class="pdf-note">${escapeHtml(summary.final_note)}</td>
              <td class="${finalClass}">${escapeHtml(summary.final_result)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:8px;font-size:11px">
          <strong>Remark:</strong> ${escapeHtml(summary.remark)}
        </div>

        <table style="width:100%;margin-top:40px;border-collapse:collapse;">
  
  <!-- ROW 1: DATE -->
  <tr>
    <td style="width:50%;"></td>
    <td style="width:50%;text-align:right;padding-bottom:10px; padding-right:250px;font-size:11px">
      <strong>Ngày:</strong> ${escapeHtml(summary.ack_date)}
    </td>
  </tr>

  <!-- ROW 2: SIGNATURE TITLE -->
  <tr>
    <td style="width:30%;text-align:center;padding-bottom:60px;font-size:11px">
      <strong>ĐẠI DIỆN NHÀ MÁY</strong>
    </td>
    <td style="width:30%;text-align:center;padding-bottom:60px;font-size:11px">
      <strong>ĐẠI DIỆN POLOMANOR</strong>
    </td>
  </tr>

  <!-- ROW 3: NAME -->
  <tr>
    <td style="width:50%;text-align:center;padding-top:8px;font-size:11px">
      ${escapeHtml(summary.ack_factory)}
    </td>
    <td style="width:50%;text-align:center;padding-top:8px;font-size:11px">
      ${escapeHtml(summary.ack_polomanor)}
    </td>
  </tr>

</table>
      </div>

      <div class="pdf-section">
        <h4>PHOTOS</h4>
        <div class="photo-wrap">${thumbs || "No photos"}</div>
      </div>

      <div class="pdf-footer">
        <div class="pdf-footer-left">
        <div>© 2026 Polomanor. All rights reserved.</div>
        <div>CONFIDENTIAL. Please do not distribute beyond your organization.</div>
        </div>
        <div class="pdf-footer-right">POLOMANOR</div>
      </div>
    </div>
  </body>
  </html>
  `;

  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', async () => {
  feather.replace();

  // Try loading specs from API, fallback to hardcoded SPECS_DATA
  let specsSource = 'local';
  if (typeof QMS_API !== 'undefined' && QMS_API.isConfigured()) {
    try {
      const apiSpecs = await QMS_API.getSpecs();
      if (apiSpecs && Object.keys(apiSpecs).length > 0) {
        // Override the global SPECS_DATA with API data
        Object.keys(SPECS_DATA).forEach(k => delete SPECS_DATA[k]);
        Object.assign(SPECS_DATA, apiSpecs);
        specsSource = 'API';
      }
    } catch (err) {
      console.warn('API specs load failed, using local fallback:', err.message);
    }
  }
  console.log(`[QMS] Specs loaded from: ${specsSource} (${Object.keys(SPECS_DATA).length} categories)`);

  // Populate category dropdown
  const catSel = document.getElementById('inp-category');
  if (catSel) {
    Object.keys(SPECS_DATA).sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      catSel.appendChild(opt);
    });
  }

  // Set today's date
  const dateInp = document.getElementById('inp-date');
  if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];

  // Update submit button state
  updateSubmitBtnState();

  renderDefectRows();
  buildMeasurementTable();
  buildSummary();
});

/* ---- SUBMIT BUTTON STATE ---- */
function updateSubmitBtnState() {
  const btn = document.getElementById('btn-submit');
  const status = document.getElementById('submit-status');
  if (!btn) return;

  if (typeof QMS_API === 'undefined' || !QMS_API.isConfigured()) {
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    if (status) status.textContent = '⚠ Chưa cấu hình API URL. Vui lòng cập nhật api.js';
  }
}

/* ---- SUBMIT TO DATABASE ---- */
async function submitToDatabase() {
  // Check API configuration
  if (typeof QMS_API === 'undefined' || !QMS_API.isConfigured()) {
    showToast('Chưa cấu hình API URL. Vui lòng cập nhật api.js', 'error');
    return;
  }

  // Confirm
  if (!confirm('Gửi dữ liệu kiểm hàng lên database?')) return;

  const v = id => (document.getElementById(id) || {}).value || '';
  const cat = v('inp-category');
  const specs = SPECS_DATA[cat] || {};

  // Show loading
  const loader = document.getElementById('submit-loader');
  if (loader) loader.classList.remove('opacity-0', 'pointer-events-none');

  try {
    // ========== STEP 1: Submit General ==========
    const generalPayload = {
      fob_supplier: v('inp-supplier'),
      product_name: v('inp-product'),
      product_code: v('inp-code'),
      color: v('inp-color'),
      inspection_date: v('inp-date'),
      inspection_location: v('inp-location'),
      po_qty: v('inp-poqty'),
      sample_size: v('inp-samplesize'),
      size_range: v('inp-sizes'),
      po_month: v('inp-pomonth'),
      inspector: v('inp-inspector'),
      category: cat,
      status: v('inp-status')
    };

    const genResult = await QMS_API.submitGeneral(generalPayload);
    const generalId = genResult.general_id;
    if (!generalId) throw new Error('Không nhận được general_id từ server');

    console.log(`[QMS] Step 1 done: General saved → ${generalId}`);

    // ========== STEP 2: Submit Measurements ==========
    const sizesStr = v('inp-sizes');
    const sizes = sizesStr.split(',').map(s => s.trim()).filter(Boolean);
    const points = Object.keys(specs);
    const sampleCount = parseInt(v('inp-meas-samples')) || 3;

    const measPoints = points.map(point => {
      const pointSpecs = specs[point] || {};
      const values = {};
      const specsForPoint = {};

      sizes.forEach(size => {
        const specObj = pointSpecs[size] || { s: 0, t: 0 };
        specsForPoint[size] = { spec: specObj.s, tol: specObj.t };
        values[size] = [];
        for (let i = 0; i < sampleCount; i++) {
          const key = `${point}|${size}|${i}`;
          values[size].push(measurementData[key] || '');
        }
      });

      return {
        general_id: generalId,
        category: cat,
        point_name: point,
        sizes: sizes,
        samples: sampleCount,
        specs: specsForPoint,
        values: values
      };
    });

    if (measPoints.length > 0) {
      await QMS_API.submitMeasurements({ general_id: generalId, points: measPoints });
      console.log(`[QMS] Step 2 done: ${measPoints.length} measurement points saved`);
    }

    // ========== STEP 3: Submit Inspection Details (Defects) ==========
    // First, upload all local overall defect images in bulk
    for (let j = 0; j < overallDefectImages.length; j++) {
      const img = overallDefectImages[j];
      if (img.localImageBase64 && !img.image) {
        console.log(`[QMS] Uploading overall defect image ${j + 1}...`);
        const statusEl = document.getElementById('submit-status');
        if (statusEl) {
          statusEl.innerHTML = `<span class="text-indigo-600 font-semibold">Đang tải ảnh lỗi đính kèm (${j + 1}/${overallDefectImages.length}) lên Drive...</span>`;
        }
        try {
          const imgResult = await QMS_API.uploadImageBase64({
            general_id: generalId,
            fileName: `defect_${Date.now()}_overall_${j}.jpg`,
            contentBase64: img.localImageBase64
          });
          if (imgResult.ok && imgResult.url) {
            img.image = imgResult.url;
            console.log(`[QMS] Uploaded image successfully: ${img.image}`);
          } else {
            console.warn(`[QMS] Image upload failed:`, imgResult.err);
          }
        } catch (imgErr) {
          console.error(`[QMS] Image upload error:`, imgErr);
        }
      }
    }

    const detailRows = defectRows
      .filter(r => r.desc || r.qty > 0 || r.critical > 0 || r.major > 0 || r.minor > 0 || r.action)
      .map(r => ({
        section: r.section,
        point: r.point || r.section,
        description: r.desc,
        quantity: r.qty,
        critical: r.critical,
        major: r.major,
        minor: r.minor,
        corrective_action: r.action,
        image: ""
      }));

    if (detailRows.length === 0 && overallDefectImages.length > 0) {
      detailRows.push({
        section: 'I - APPEARANCE',
        point: 'I - APPEARANCE',
        description: 'Đính kèm hình ảnh lỗi',
        quantity: 0,
        critical: 0,
        major: 0,
        minor: 0,
        corrective_action: '',
        image: ''
      });
    }

    if (detailRows.length > 0) {
      const uploadedUrls = overallDefectImages.map(img => img.image).filter(url => url);
      detailRows[0].image = uploadedUrls.join(', ');
    }

    if (detailRows.length > 0) {
      await QMS_API.submitInspectionDetails({ general_id: generalId, rows: detailRows });
      console.log(`[QMS] Step 3 done: ${detailRows.length} defect rows saved`);
    }

    // ========== STEP 4: Submit Overall Summary (auto-calculates AQL) ==========
    const summaryPayload = {
      general_id: generalId,
      measurement: {
        cause: v('sum-meas-cause'),
        impact_yes: document.getElementById('impact_yes_m')?.checked || false,
        impact_no: document.getElementById('impact_no_m')?.checked || false,
        impact_reinspect: document.getElementById('impact_reinspect_m')?.checked || false,
        impact_time: v('impact_time_m')
      },
      appearance: {
        cause: v('sum-app-cause'),
        impact_yes: document.getElementById('impact_yes_a')?.checked || false,
        impact_no: document.getElementById('impact_no_a')?.checked || false,
        impact_reinspect: document.getElementById('impact_reinspect_a')?.checked || false,
        impact_time: v('impact_time_a')
      },
      remark: v('sum-remark'),
      ack_factory: v('sum-ack-factory'),
      ack_polomanor: v('sum-ack-qc'),
      ack_date: new Date().toLocaleDateString('vi-VN')
    };

    const summaryResult = await QMS_API.submitOverallSummary(summaryPayload);
    console.log('[QMS] Step 4 done: Summary saved', summaryResult);

    // ========== SUCCESS ==========
    const finalResult = summaryResult.auto_result?.final?.resultText || '';
    showToast(`✅ Đã lưu thành công! ID: ${generalId} | ${finalResult}`, 'success');
    const statusEl = document.getElementById('submit-status');
    if (statusEl) {
      statusEl.innerHTML = `<span class="text-emerald-600 font-semibold">✅ Đã submit lúc ${new Date().toLocaleTimeString('vi-VN')} | ID: ${generalId} | Result: ${finalResult}</span>`;
    }

  } catch (err) {
    showToast(`❌ Lỗi: ${err.message}`, 'error');
    console.error('[QMS] Submit error:', err);
  } finally {
    if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
  }
}

/* ---- TOAST NOTIFICATION ---- */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300';

  if (type === 'success') {
    toast.classList.add('bg-emerald-600', 'text-white');
  } else if (type === 'error') {
    toast.classList.add('bg-red-600', 'text-white');
  } else {
    toast.classList.add('bg-slate-800', 'text-white');
  }

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  });

  // Auto-dismiss after 5s
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 5000);
}
