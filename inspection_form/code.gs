const TIMEZONE = "GMT+7";

/* =====================================================
   AQL CONFIG
   lot size = PO quantity
   sampleSize = số mẫu cần kiểm theo lot size
   ===================================================== */
const AQL_RULES = [
  {
    minQty: 2,
    maxQty: 50,
    sampleSize: 8,
    levels: {
      "2.5": { accept: 0, reject: 1 },
      "4.0": { accept: 1, reject: 2 }
    }
  },
  {
    minQty: 51,
    maxQty: 90,
    sampleSize: 13,
    levels: {
      "2.5": { accept: 1, reject: 2 },
      "4.0": { accept: 2, reject: 3 }
    }
  },
  {
    minQty: 91,
    maxQty: 150,
    sampleSize: 20,
    levels: {
      "2.5": { accept: 1, reject: 2 },
      "4.0": { accept: 2, reject: 3 }
    }
  },
  {
    minQty: 151,
    maxQty: 280,
    sampleSize: 32,
    levels: {
      "2.5": { accept: 2, reject: 3 },
      "4.0": { accept: 3, reject: 4 }
    }
  },
  {
    minQty: 281,
    maxQty: 500,
    sampleSize: 50,
    levels: {
      "2.5": { accept: 3, reject: 4 },
      "4.0": { accept: 5, reject: 6 }
    }
  },
  {
    minQty: 501,
    maxQty: 1200,
    sampleSize: 80,
    levels: {
      "2.5": { accept: 5, reject: 6 },
      "4.0": { accept: 7, reject: 8 }
    }
  },
  {
    minQty: 1201,
    maxQty: 3200,
    sampleSize: 125,
    levels: {
      "2.5": { accept: 7, reject: 8 },
      "4.0": { accept: 10, reject: 11 }
    }
  },
  {
    minQty: 3201,
    maxQty: 10000,
    sampleSize: 200,
    levels: {
      "2.5": { accept: 10, reject: 11 },
      "4.0": { accept: 14, reject: 15 }
    }
  }
];

/* -------------------------
   Serve form
------------------------- */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    try {
      if (action === "getCategories") {
        return ContentService.createTextOutput(JSON.stringify({ ok: true, categories: getCategories() }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getSpecs") {
        return ContentService.createTextOutput(JSON.stringify(getSpecs(e.parameter.category)))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getFinalResults") {
        return ContentService.createTextOutput(JSON.stringify(getFinalResults()))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getInspectionReport") {
        return ContentService.createTextOutput(JSON.stringify(getInspectionReport(e.parameter.general_id)))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, err: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Fallback
  return HtmlService.createHtmlOutput("<h1>QC API is running</h1>").setTitle("Inspection App API");
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload;
    let result = { ok: false, err: "Unknown action" };

    if (action === "submitGeneral") result = submitGeneral(payload);
    else if (action === "submitMeasurementsBulk") result = submitMeasurementsBulk(payload);
    else if (action === "submitInspectionDetails") result = submitInspectionDetails(payload);
    else if (action === "submitOverallSummary") result = submitOverallSummary(payload);
    else if (action === "previewAqlResult") result = previewAqlResult(payload);
    else if (action === "uploadImageBase64") result = uploadImageBase64(payload);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, err: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* -------------------------
   Helpers
------------------------- */
function _nowStr_() {
  return Utilities.formatDate(
    new Date(),
    TIMEZONE || Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm:ss"
  );
}

function _toNumber_(v) {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function _getOrCreateSheet_(ss, name, headerRow) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  } else {
    const maxCols = sh.getMaxColumns();
    if (maxCols < headerRow.length) {
      sh.insertColumnsAfter(maxCols, headerRow.length - maxCols);
    }
    const existing = sh.getRange(1, 1, 1, headerRow.length).getValues()[0];
    let needRewrite = false;
    for (let i = 0; i < headerRow.length; i++) {
      if ((existing[i] || "") !== headerRow[i]) {
        needRewrite = true;
        break;
      }
    }
    if (needRewrite) {
      sh.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }
  }
  return sh;
}

function getLatestGeneralId(criteria) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("General");
  if (!sh) return null;

  const vals = sh.getDataRange().getValues();
  if (!vals || vals.length < 2) return null;

  const header = vals[0].map(h => (h || "").toString().trim().toLowerCase());
  const idxId = header.indexOf("general_id");
  const idxFob = header.indexOf("fob_supplier");
  const idxProd = header.indexOf("product_name");
  const idxInsp = header.indexOf("inspector");

  for (let r = vals.length - 1; r >= 1; r--) {
    const row = vals[r];
    const gid = (idxId >= 0 ? row[idxId] : "").toString().trim();
    const fob = (idxFob >= 0 ? row[idxFob] : "").toString().trim();
    const prod = (idxProd >= 0 ? row[idxProd] : "").toString().trim();
    const insp = (idxInsp >= 0 ? row[idxInsp] : "").toString().trim();

    let ok = true;
    if (criteria) {
      if (criteria.fob_supplier && criteria.fob_supplier.toString().trim() !== "" && criteria.fob_supplier.toString().trim() !== fob) ok = false;
      if (criteria.product_name && criteria.product_name.toString().trim() !== "" && criteria.product_name.toString().trim() !== prod) ok = false;
      if (criteria.inspector && criteria.inspector.toString().trim() !== "" && criteria.inspector.toString().trim() !== insp) ok = false;
    }
    if (ok && gid) return gid;
  }
  return null;
}

function getGeneralRowById(generalId) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("General");
  if (!sh) return null;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  const idxId = header.indexOf("general_id");
  if (idxId === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxId] || "").trim() === String(generalId || "").trim()) {
      const obj = {};
      header.forEach((h, c) => obj[h] = data[i][c]);
      return obj;
    }
  }
  return null;
}

function getAqlRuleByQty(qty, aqlLevel) {
  const numQty = Number(qty || 0);
  const key = String(aqlLevel || "").trim();

  const matched = AQL_RULES.find(r => numQty >= r.minQty && numQty <= r.maxQty);
  if (!matched) return null;
  if (!matched.levels[key]) return null;

  return {
    minQty: matched.minQty,
    maxQty: matched.maxQty,
    sampleSize: matched.sampleSize,
    aqlLevel: key,
    accept: matched.levels[key].accept,
    reject: matched.levels[key].reject
  };
}

/* -------------------------
   Quick helper for UI
------------------------- */
function getSampleSizeByLotSize(lotSize) {
  const n = _toNumber_(lotSize);
  if (!n) return { ok: false, err: "Lot size is empty or invalid" };

  const rule = AQL_RULES.find(r => n >= r.minQty && n <= r.maxQty);
  if (!rule) return { ok: false, err: "No AQL rule for this lot size" };

  return {
    ok: true,
    lotSize: n,
    sampleSize: rule.sampleSize,
    rangeText: `${rule.minQty}-${rule.maxQty}`
  };
}

/* =====================================================
   SPECS
   ===================================================== */
function getAllSpecs() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("Specs");
  if (!sh) return {};

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return {};

  const headerRow = values[0].map(h => (h || "").toString().trim());
  const rows = values.slice(1);

  const findIdx = candidates => {
    for (let i = 0; i < headerRow.length; i++) {
      const hn = headerRow[i].toString().trim().toLowerCase();
      for (const c of candidates) {
        if (hn === c.toLowerCase()) return i;
      }
    }
    return -1;
  };

  const catIdx = findIdx(["Category","category","type"]);
  const pointIdx = findIdx(["Point","point","point_name","point name","inspectpoint","inspect point"]);
  const sizeIdx = findIdx(["Size","size"]);
  const specIdx = findIdx(["Spec","spec","spec_value","spec value","specvalue"]);
  const tolIdx = findIdx(["Tol","tol","Tolerance","tolerance"]);

  const map = {};

  rows.forEach(r => {
    const cat = (catIdx >= 0 && r[catIdx] !== undefined) ? String(r[catIdx]).trim() : "";
    const point = (pointIdx >= 0 && r[pointIdx] !== undefined) ? String(r[pointIdx]).trim() : "";
    const size = (sizeIdx >= 0 && r[sizeIdx] !== undefined) ? String(r[sizeIdx]).trim() : "";
    if (!cat || !point || !size) return;

    const specRaw = (specIdx >= 0 ? r[specIdx] : "");
    const tolRaw = (tolIdx >= 0 ? r[tolIdx] : "");

    const sVal = (specRaw === "" || specRaw === null) ? "" : (isFinite(specRaw) ? Number(specRaw) : specRaw);
    const tVal = (tolRaw === "" || tolRaw === null) ? "" : (isFinite(tolRaw) ? Number(tolRaw) : tolRaw);

    map[cat] = map[cat] || {};
    map[cat][point] = map[cat][point] || {};
    map[cat][point][size] = { spec: sVal, tol: tVal };
  });

  return map;
}

function getCategories() {
  const map = getAllSpecs();
  return Object.keys(map).sort();
}

function getSpecs(category) {
  try {
    if (!category) return { ok: true, specs: {} };
    const all = getAllSpecs();
    return { ok: true, specs: all[category] || {} };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

function getFinalResults() {
  try {
    const ss = SpreadsheetApp.getActive();
    
    // 1. Get General sheet data
    const genSh = ss.getSheetByName("General");
    let generalData = [];
    if (genSh) {
      const vals = genSh.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const rows = vals.slice(1);
        generalData = rows.map(r => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = r[i];
          });
          return obj;
        });
      }
    }

    // 2. Get Summary sheet data
    const sumSh = ss.getSheetByName("Summary");
    let summaryData = [];
    if (sumSh) {
      const vals = sumSh.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const rows = vals.slice(1);
        summaryData = rows.map(r => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = r[i];
          });
          return obj;
        });
      }
    }

    return {
      ok: true,
      general: generalData,
      summary: summaryData
    };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

function getInspectionReport(generalId) {
  try {
    const ss = SpreadsheetApp.getActive();
    
    // 1. Get General data
    const genSh = ss.getSheetByName("General");
    let general = null;
    if (genSh) {
      const vals = genSh.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const gidIdx = headers.indexOf("general_id");
        for (let i = 1; i < vals.length; i++) {
          if (String(vals[i][gidIdx] || "").trim() === String(generalId).trim()) {
            general = {};
            headers.forEach((h, col) => {
              general[h] = vals[i][col];
            });
            break;
          }
        }
      }
    }
    if (!general) throw new Error("Không tìm thấy thông tin chung của báo cáo: " + generalId);

    // 2. Get Summary data
    const sumSh = ss.getSheetByName("Summary");
    let summary = null;
    if (sumSh) {
      const vals = sumSh.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const gidIdx = headers.indexOf("general_id");
        for (let i = 1; i < vals.length; i++) {
          if (String(vals[i][gidIdx] || "").trim() === String(generalId).trim()) {
            summary = {};
            headers.forEach((h, col) => {
              summary[h] = vals[i][col];
            });
            break;
          }
        }
      }
    }

    // 3. Get InspectionDetails (Defects) data
    const detSh = ss.getSheetByName("InspectionDetails");
    let defects = [];
    if (detSh) {
      const vals = detSh.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const gidIdx = headers.indexOf("general_id");
        for (let i = 1; i < vals.length; i++) {
          if (String(vals[i][gidIdx] || "").trim() === String(generalId).trim()) {
            const obj = {};
            headers.forEach((h, col) => {
              obj[h] = vals[i][col];
            });
            defects.push(obj);
          }
        }
      }
    }

    // 3.5. Fallback: Lookup Google Drive subfolder for any uploaded images
    let driveImages = [];
    try {
      const folderId = "1uvecR9Li8dwl6xZUJpZ6tE_BV_9v2dqh";
      let main;
      try {
        main = DriveApp.getFolderById(folderId);
      } catch (e) {
        const folderName = "InspectionImages";
        const mainFolders = DriveApp.getFoldersByName(folderName);
        if (mainFolders.hasNext()) {
          main = mainFolders.next();
        }
      }
      if (main) {
        const subs = main.getFoldersByName(generalId);
        if (subs.hasNext()) {
          const sub = subs.next();
          const files = sub.getFiles();
          while (files.hasNext()) {
            const file = files.next();
            driveImages.push(file.getUrl());
          }
        }
      }
    } catch (err) {
      // Ignore background image scanning errors
    }

    if (driveImages.length > 0) {
      // Assign driveImages to defects that don't have images
      let imgIdx = 0;
      defects.forEach(d => {
        if (!d.image && imgIdx < driveImages.length) {
          d.image = driveImages[imgIdx];
          imgIdx++;
        }
      });

      // If there are more drive images left, append them as extra defect rows so they display
      while (imgIdx < driveImages.length) {
        defects.push({
          timestamp: "",
          general_id: generalId,
          section: "PHOTOS",
          point: "Ảnh đính kèm",
          description: "Hình ảnh từ Google Drive",
          quantity: "",
          critical: "",
          major: "",
          minor: "",
          corrective_action: "",
          image: driveImages[imgIdx]
        });
        imgIdx++;
      }
    }

    // 4. Get Measurements data
    const measSh = ss.getSheetByName("Measurements");
    let measurements = [];
    if (measSh) {
      const vals = measSh.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const gidIdx = headers.indexOf("general_id");
        for (let i = 1; i < vals.length; i++) {
          if (String(vals[i][gidIdx] || "").trim() === String(generalId).trim()) {
            const obj = {};
            headers.forEach((h, col) => {
              obj[h] = vals[i][col];
            });
            measurements.push(obj);
          }
        }
      }
    }

    return {
      ok: true,
      general,
      summary,
      defects,
      measurements
    };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

/* =====================================================
   GENERAL
   ===================================================== */
function submitGeneral(form) {
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = _getOrCreateSheet_(ss, "General", [
      "timestamp","general_id","fob_supplier","product_name","product_code","color",
      "inspection_date","inspection_location","po_qty","sample_size","size_range","po_month","inspector","category","status","submit_time"
    ]);

    const ts = _nowStr_();
    const gid = "G" + Utilities.formatDate(new Date(), TIMEZONE, "yyyyMMddHHmmss");

    const row = [
      ts,
      gid,
      form.fob_supplier || "",
      form.product_name || "",
      form.product_code || "",
      form.color || "",
      form.inspection_date || "",
      form.inspection_location || "",
      form.po_qty || "",
      form.sample_size || "",
      form.size_range || "",
      form.po_month || "",
      form.inspector || "",
      form.category || "",
      form.status || "",
      ts
    ];

    sh.appendRow(row);
    return { ok: true, general_id: gid };
  } catch (err) {
    return { ok: false, err: err.message };
  }
}

/* =====================================================
   MEASUREMENTS
   ===================================================== */
function submitMeasurementsBulk(payload) {
  try {
    if (!payload || !payload.points || !Array.isArray(payload.points)) {
      return { ok: false, err: "Invalid payload" };
    }

    const ss = SpreadsheetApp.getActive();
    const sh = _getOrCreateSheet_(ss, "Measurements", [
      "timestamp","general_id","category","point_name","tol","size","sample_no","measured_value","spec_value","result"
    ]);

    const ts = _nowStr_();
    const rows = [];

    payload.points.forEach(pt => {
      const sizes = pt.sizes || [];
      const samples = Math.max(1, pt.samples || 1);
      const specs = pt.specs || {};

      sizes.forEach(size => {
        for (let i = 0; i < samples; i++) {
          const raw = (pt.values && pt.values[size] && pt.values[size][i] !== undefined) ? pt.values[size][i] : "";
          const specObj = specs[size] || {};
          const specVal = (specObj.spec !== undefined && specObj.spec !== "") ? specObj.spec : "";
          const tolVal = (specObj.tol !== undefined && specObj.tol !== "") ? specObj.tol : "";

          let result = "";
          const mnum = (raw === "") ? "" : Number(raw);
          const sNum = (specVal === "") ? "" : Number(specVal);
          const tNum = (tolVal === "") ? "" : Number(tolVal);

          if (sNum !== "" && mnum !== "" && !isNaN(mnum) && tNum !== "" && !isNaN(tNum)) {
            result = (Math.abs(mnum - sNum) <= tNum) ? "Đạt" : "Không đạt";
          }

          rows.push([
            ts,
            pt.general_id || "",
            pt.category || "",
            pt.point_name || "",
            tolVal,
            size,
            i + 1,
            raw,
            specVal,
            result
          ]);
        }
      });
    });

    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    return { ok: true, count: rows.length };
  } catch (err) {
    return { ok: false, err: err.message };
  }
}

/* =====================================================
   PHOTOS
   ===================================================== */
function uploadImageBase64(payload) {
  try {
    if (!payload || !payload.fileName || !payload.contentBase64 || !payload.general_id) {
      return { ok: false, err: "Invalid image payload" };
    }

    const folderId = "1uvecR9Li8dwl6xZUJpZ6tE_BV_9v2dqh";
    let main;
    try {
      main = DriveApp.getFolderById(folderId);
    } catch (e) {
      const folderName = "InspectionImages";
      const mainFolders = DriveApp.getFoldersByName(folderName);
      main = mainFolders.hasNext() ? mainFolders.next() : DriveApp.createFolder(folderName);
    }

    const subs = main.getFoldersByName(payload.general_id);
    const sub = subs.hasNext() ? subs.next() : main.createFolder(payload.general_id);

    const content = payload.contentBase64.substring(payload.contentBase64.indexOf(",") + 1);
    const blob = Utilities.newBlob(Utilities.base64Decode(content), "image/jpeg", payload.fileName);
    const file = sub.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {}

    return { ok: true, url: file.getUrl(), id: file.getId() };
  } catch (err) {
    return { ok: false, err: err.message };
  }
}

/* =====================================================
   INSPECTION DETAILS
   ===================================================== */
function submitInspectionDetails(payload) {
  try {
    if (!payload) return { ok: false, err: "Missing payload" };

    let gid = payload.general_id || "";
    if (!gid) gid = getLatestGeneralId(payload.criteria || {});
    if (!gid) return { ok: false, err: "Missing general_id and unable to infer. Save General first." };

    const ss = SpreadsheetApp.getActive();
    const headers = [
      "timestamp",
      "general_id",
      "section",
      "point",
      "description",
      "quantity",
      "critical",
      "major",
      "minor",
      "corrective_action",
      "image"
    ];
    const sh = _getOrCreateSheet_(ss, "InspectionDetails", headers);

    const now = _nowStr_();
    const rows = [];

    if (Array.isArray(payload.rows)) {
      payload.rows.forEach(r => {
        rows.push([
          now,
          gid,
          r.section || "",
          r.point || "",
          r.description || "",
          _toNumber_(r.quantity),
          _toNumber_(r.critical),
          _toNumber_(r.major),
          _toNumber_(r.minor),
          r.corrective_action || r.correctiveAction || r.corrective || "",
          r.image || ""
        ]);
      });
    }

    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
    }

    return { ok: true, saved: rows.length, general_id_used: gid };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

/* =====================================================
   CALCULATION
   ===================================================== */
function getInspectionDefectSummary(generalId) {
  const ss = SpreadsheetApp.getActive();

  let measurementFailCount = 0;
  let measurementTotalCount = 0;

  let criticalQty = 0;
  let majorQty = 0;
  let minorQty = 0;
  let appearanceTotalQty = 0;

  const measSh = ss.getSheetByName("Measurements");
  if (measSh) {
    const data = measSh.getDataRange().getValues();
    if (data.length >= 2) {
      const header = data[0].map(h => String(h || "").trim().toLowerCase());
      const idxGid = header.indexOf("general_id");
      const idxResult = header.indexOf("result");

      if (idxGid !== -1 && idxResult !== -1) {
        for (let i = 1; i < data.length; i++) {
          const gid = String(data[i][idxGid] || "").trim();
          if (gid !== String(generalId || "").trim()) continue;

          const result = String(data[i][idxResult] || "").trim().toLowerCase();
          if (result === "đạt" || result === "không đạt") {
            measurementTotalCount += 1;
            if (result === "không đạt") measurementFailCount += 1;
          }
        }
      }
    }
  }

  const detSh = ss.getSheetByName("InspectionDetails");
  if (detSh) {
    const data = detSh.getDataRange().getValues();
    if (data.length >= 2) {
      const header = data[0].map(h => String(h || "").trim().toLowerCase());
      const idxGid = header.indexOf("general_id");
      const idxQty = header.indexOf("quantity");
      const idxCritical = header.indexOf("critical");
      const idxMajor = header.indexOf("major");
      const idxMinor = header.indexOf("minor");

      if (idxGid !== -1) {
        for (let i = 1; i < data.length; i++) {
          const gid = String(data[i][idxGid] || "").trim();
          if (gid !== String(generalId || "").trim()) continue;

          const qty = idxQty !== -1 ? _toNumber_(data[i][idxQty]) : 0;
          const critical = idxCritical !== -1 ? _toNumber_(data[i][idxCritical]) : 0;
          const major = idxMajor !== -1 ? _toNumber_(data[i][idxMajor]) : 0;
          const minor = idxMinor !== -1 ? _toNumber_(data[i][idxMinor]) : 0;

          appearanceTotalQty += qty;
          criticalQty += critical;
          majorQty += major;
          minorQty += minor;
        }
      }
    }
  }

  return {
    measurementFailCount,
    measurementTotalCount,
    measurementFailRate: measurementTotalCount ? measurementFailCount / measurementTotalCount : 0,
    criticalQty,
    majorQty,
    minorQty,
    appearanceTotalQty
  };
}

function calculateAqlResult(payload) {
  const generalId = payload.general_id;
  const general = getGeneralRowById(generalId);
  if (!general) return { ok: false, err: "General not found" };

  const lotSize = _toNumber_(general["po_qty"]);
  if (!lotSize) return { ok: false, err: "PO quantity (lot size) is empty or invalid" };

  const sampleRuleMajor = getAqlRuleByQty(lotSize, "2.5");
  const sampleRuleMinor = getAqlRuleByQty(lotSize, "4.0");
  if (!sampleRuleMajor || !sampleRuleMinor) {
    return { ok: false, err: "No AQL rule for this lot size" };
  }

  const defectSummary = getInspectionDefectSummary(generalId);

  const measurementPass = defectSummary.measurementFailRate <= 0.30;
  const criticalPass = defectSummary.criticalQty === 0;
  const majorPass = defectSummary.majorQty <= sampleRuleMajor.accept;
  const minorPass = defectSummary.minorQty <= sampleRuleMinor.accept;
  const appearancePass = criticalPass && majorPass && minorPass;
  const finalPass = measurementPass && appearancePass;

  const sampleSize = sampleRuleMajor.sampleSize;

  return {
    ok: true,
    general_id: generalId,
    lotSize,
    sampleSize,

    measurement: {
      totalChecked: defectSummary.measurementTotalCount,
      failCount: defectSummary.measurementFailCount,
      failRate: defectSummary.measurementFailRate,
      threshold: 0.30,
      pass: measurementPass,
      fail: !measurementPass,
      resultText: measurementPass ? "PASS" : "FAIL"
    },

    appearance: {
      criticalQty: defectSummary.criticalQty,
      majorQty: defectSummary.majorQty,
      minorQty: defectSummary.minorQty,
      totalQty: defectSummary.appearanceTotalQty,

      criticalPass,
      criticalFail: !criticalPass,

      major: {
        aql: "2.5",
        sampleSize: sampleRuleMajor.sampleSize,
        accept: sampleRuleMajor.accept,
        reject: sampleRuleMajor.reject,
        qty: defectSummary.majorQty,
        pass: majorPass,
        fail: !majorPass
      },

      minor: {
        aql: "4.0",
        sampleSize: sampleRuleMinor.sampleSize,
        accept: sampleRuleMinor.accept,
        reject: sampleRuleMinor.reject,
        qty: defectSummary.minorQty,
        pass: minorPass,
        fail: !minorPass
      },

      pass: appearancePass,
      fail: !appearancePass,
      resultText: appearancePass ? "PASS" : "FAIL"
    },

    final: {
      pass: finalPass,
      fail: !finalPass,
      resultText: finalPass ? "PASS" : "FAIL"
    }
  };
}

function previewAqlResult(payload) {
  return calculateAqlResult(payload);
}

/* =====================================================
   SUMMARY
   ===================================================== */
function submitOverallSummary(payload) {
  try {
    if (!payload) return { ok: false, err: "Missing payload" };

    let gid = payload.general_id || "";
    if (!gid) gid = getLatestGeneralId(payload.criteria || {});
    if (!gid) return { ok: false, err: "Missing general_id" };

    payload.general_id = gid;

    const calc = calculateAqlResult(payload);
    if (!calc.ok) return { ok: false, err: calc.err };

    const ss = SpreadsheetApp.getActive();
    const headers = [
      "timestamp","general_id",
      "po_qty","sample_size",
      "meas_total_checked","meas_fail_count","meas_fail_rate","meas_threshold","meas_pass","meas_fail",
      "app_critical_qty","app_major_qty","app_minor_qty","app_total_qty","app_defect_rate",
      "major_aql","major_accept","major_reject","major_pass","major_fail",
      "minor_aql","minor_accept","minor_reject","minor_pass","minor_fail",
      "app_pass","app_fail",
      "final_pass","final_fail",
      "meas_cause","meas_impact_yes","meas_impact_no","meas_impact_reinspect","meas_impact_time",
      "app_cause","app_impact_yes","app_impact_no","app_impact_reinspect","app_impact_time",
      "remark","ack_factory","ack_polomanor","ack_date"
    ];
    const sh = _getOrCreateSheet_(ss, "Summary", headers);

    const now = _nowStr_();
    const m = payload.measurement || {};
    const a = payload.appearance || {};

    const appDefectRate = calc.sampleSize
      ? (calc.appearance.totalQty / calc.sampleSize)
      : 0;

    const row = [
      now,
      gid,
      calc.lotSize,
      calc.sampleSize,

      calc.measurement.totalChecked,
      calc.measurement.failCount,
      calc.measurement.failRate,
      calc.measurement.threshold,
      calc.measurement.pass ? 1 : 0,
      calc.measurement.fail ? 1 : 0,

      calc.appearance.criticalQty,
      calc.appearance.majorQty,
      calc.appearance.minorQty,
      calc.appearance.totalQty,
      appDefectRate,

      calc.appearance.major.aql,
      calc.appearance.major.accept,
      calc.appearance.major.reject,
      calc.appearance.major.pass ? 1 : 0,
      calc.appearance.major.fail ? 1 : 0,

      calc.appearance.minor.aql,
      calc.appearance.minor.accept,
      calc.appearance.minor.reject,
      calc.appearance.minor.pass ? 1 : 0,
      calc.appearance.minor.fail ? 1 : 0,

      calc.appearance.pass ? 1 : 0,
      calc.appearance.fail ? 1 : 0,

      calc.final.pass ? 1 : 0,
      calc.final.fail ? 1 : 0,

      m.cause || "",
      m.impact_yes ? 1 : 0,
      m.impact_no ? 1 : 0,
      m.impact_reinspect ? 1 : 0,
      m.impact_time || "",

      a.cause || "",
      a.impact_yes ? 1 : 0,
      a.impact_no ? 1 : 0,
      a.impact_reinspect ? 1 : 0,
      a.impact_time || "",

      payload.remark || "",
      payload.ack_factory || "",
      payload.ack_polomanor || "",
      payload.ack_date || ""
    ];

    sh.appendRow(row);

    try {
      const gsh = ss.getSheetByName("General");
      if (gsh) {
        const data = gsh.getDataRange().getValues();
        const header = data[0].map(h => String(h || "").trim().toLowerCase());
        const idxId = header.indexOf("general_id");
        const idxSubmit = header.indexOf("submit_time");

        if (idxId !== -1 && idxSubmit !== -1) {
          for (let r = 1; r < data.length; r++) {
            if (String(data[r][idxId]) === String(gid)) {
              gsh.getRange(r + 1, idxSubmit + 1).setValue(now);
              break;
            }
          }
        }
      }
    } catch (e) {}

    return {
      ok: true,
      saved: 1,
      auto_result: calc
    };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}