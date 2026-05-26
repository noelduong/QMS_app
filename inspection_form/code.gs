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
      if (action === "getMasterInfoByStyle") {
        return ContentService.createTextOutput(JSON.stringify(getMasterInfoByStyle(e.parameter.style)))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getReturnRows") {
        return ContentService.createTextOutput(JSON.stringify(getReturnRows()))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getCustomerFeedback") {
        return ContentService.createTextOutput(JSON.stringify(getCustomerFeedbackRows()))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getPlanData") {
        return ContentService.createTextOutput(JSON.stringify(getPlanData()))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getScheduleData") {
        return ContentService.createTextOutput(JSON.stringify(getScheduleData()))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "getFabricTesting") {
        return ContentService.createTextOutput(JSON.stringify(getFabricTestingRows()))
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
    var rawContent = e.postData.contents || "";
    // Self-healing UTF-8 decoding for Google Apps Script ISO-8859-1 decoding bug
    try {
      var isAlreadyUtf8 = false;
      var hasIsoChars = false;
      for (var i = 0; i < rawContent.length; i++) {
        var code = rawContent.charCodeAt(i);
        if (code > 255) {
          isAlreadyUtf8 = true;
          break;
        }
        if (code > 127) {
          hasIsoChars = true;
        }
      }
      if (hasIsoChars && !isAlreadyUtf8) {
        var bytes = [];
        for (var i = 0; i < rawContent.length; i++) {
          bytes.push(rawContent.charCodeAt(i) & 0xFF);
        }
        rawContent = Utilities.newBlob(bytes).getDataAsString("UTF-8");
      }
    } catch (err) {
      // Fallback to original contents
    }

    const postData = JSON.parse(rawContent);
    const action = postData.action;
    const payload = postData.payload;
    let result = { ok: false, err: "Unknown action" };

    if (action === "submitGeneral") result = submitGeneral(payload);
    else if (action === "submitMeasurementsBulk") result = submitMeasurementsBulk(payload);
    else if (action === "submitInspectionDetails") result = submitInspectionDetails(payload);
    else if (action === "submitOverallSummary") result = submitOverallSummary(payload);
    else if (action === "previewAqlResult") result = previewAqlResult(payload);
    else if (action === "uploadImageBase64") result = uploadImageBase64(payload);
    else if (action === "submitReturnAnalysisBatch") result = submitReturnAnalysisBatch(payload);
    else if (action === "deleteRecord") result = deleteRecord(payload);
    else if (action === "submitPlan") result = submitPlan(payload);
    else if (action === "deletePlan") result = deletePlan(payload);
    else if (action === "updatePlanStatus") result = updatePlanStatus(payload);
    else if (action === "submitNPL") result = submitNPL(payload);
    else if (action === "setupNPL") result = setupNPL();
    else if (action === "submitFabricTesting") result = submitFabricTesting(payload);

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

    // Upsert logic: search for existing general_id row to overwrite
    let existingRowIdx = -1;
    try {
      const data = sh.getDataRange().getValues();
      if (data.length >= 2) {
        const header = data[0].map(h => String(h || "").trim().toLowerCase());
        const idxGid = header.indexOf("general_id");
        if (idxGid !== -1) {
          for (let i = 1; i < data.length; i++) {
            if (String(data[i][idxGid] || "").trim() === String(gid).trim()) {
              existingRowIdx = i + 1; // 1-indexed row number
              break;
            }
          }
        }
      }
    } catch (e) {
      // Fallback if sheet search fails
    }

    if (existingRowIdx !== -1) {
      sh.getRange(existingRowIdx, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }

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

/* =====================================================
   RETURN ANALYSIS
   ===================================================== */
const RETURN_CFG = {
  TARGET_SHEET_NAME: "Return Analysis",
  DATA_START_ROW: 2,
  DATA_START_COL: 1, // cột A

  MASTER_SPREADSHEET_ID: "1M4COiy0LqbZnFEwGy4gWJ9hyzZpNapWK2HLefFvt0gw",
  MASTER_SHEET_GID: 1971227034,

  // Master mapping
  MASTER_COL_STYLE: 3,      // C = Tên sản phẩm
  MASTER_COL_PO: 4,         // D = PO
  MASTER_COL_SUPPLIER: 5,   // E = Supplier
  MASTER_COL_UNIT_PRICE: 11 // K = Unit Price
};

/**
 * Dò master theo tên sản phẩm nhập tay
 * Ưu tiên:
 * 1. exact normalized
 * 2. regex loose match
 * 3. contains match
 */
function getMasterInfoByStyle(styleInput) {
  try {
    const rawInput = String(styleInput || "").trim();
    if (!rawInput) {
      return { ok: false, message: "Thiếu Tên sản phẩm." };
    }

    const sheet = getMasterSheet_();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow < 2) {
      return { ok: false, message: "Sheet master chưa có dữ liệu." };
    }

    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const inputNorm = normalizeSearchText_(rawInput);
    if (!inputNorm) {
      return { ok: false, message: "Tên sản phẩm không hợp lệ." };
    }

    const inputTokens = tokenizeStyle_(inputNorm);
    let bestHit = null;

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const styleRaw = String(row[RETURN_CFG.MASTER_COL_STYLE - 1] || "").trim();
      const styleNorm = normalizeSearchText_(styleRaw);
      if (!styleNorm) continue;

      const styleTokens = tokenizeStyle_(styleNorm);
      const score = scoreStyleMatch_(inputNorm, inputTokens, styleNorm, styleTokens);

      if (!bestHit || score > bestHit.score) {
        bestHit = {
          po: row[RETURN_CFG.MASTER_COL_PO - 1] || "",
          supplier: row[RETURN_CFG.MASTER_COL_SUPPLIER - 1] || "",
          unitPrice: row[RETURN_CFG.MASTER_COL_UNIT_PRICE - 1] || "",
          matchedStyle: styleRaw,
          rowNumber: i + 2,
          score: score
        };
      }
    }

    // Ngưỡng tối thiểu để tránh match sai
    if (!bestHit || bestHit.score < 0.45) {
      return { ok: false, message: "Không tìm thấy tên sản phẩm gần đúng trong master." };
    }

    return {
      ok: true,
      po: bestHit.po,
      supplier: (() => {
        const s = String(bestHit.supplier || "").trim().toUpperCase();
        if (s === "A THANH") return "TALYNO";
        if (s === "A BẢO" || s === "A BAO") return "ANH THƯ";
        return bestHit.supplier || "";
      })(),
      unitPrice: bestHit.unitPrice,
      matchedStyle: bestHit.matchedStyle,
      rowNumber: bestHit.rowNumber,
      matchType: "fuzzy",
      score: bestHit.score
    };
  } catch (e) {
    return { ok: false, message: String(e && e.message ? e.message : e) };
  }
}

function tokenizeStyle_(text) {
  return String(text || "")
    .split(" ")
    .map(s => s.trim())
    .filter(Boolean);
}

function scoreStyleMatch_(inputNorm, inputTokens, styleNorm, styleTokens) {
  if (!inputNorm || !styleNorm) return 0;

  // 1. exact
  if (inputNorm === styleNorm) return 1;

  // 2. contains full string
  if (styleNorm.includes(inputNorm) || inputNorm.includes(styleNorm)) {
    return 0.9;
  }

  // 3. token overlap
  const inputSet = new Set(inputTokens);
  const styleSet = new Set(styleTokens);

  let common = 0;
  inputSet.forEach(token => {
    if (styleSet.has(token)) common++;
  });

  const tokenScore = common / Math.max(inputSet.size, styleSet.size);

  // 4. partial token match
  let partial = 0;
  inputTokens.forEach(it => {
    if (styleTokens.some(st => st.includes(it) || it.includes(st))) {
      partial++;
    }
  });
  const partialScore = partial / Math.max(inputTokens.length, 1);

  // 5. ưu tiên tên có độ dài gần giống
  const lenGap = Math.abs(styleNorm.length - inputNorm.length);
  const lenScore = 1 / (1 + lenGap / 10);

  return (tokenScore * 0.5) + (partialScore * 0.3) + (lenScore * 0.2);
}

/**
 * Gửi nhiều dòng một lần
 */
function submitReturnAnalysisBatch(items) {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Danh sách gửi đang trống.");
    }

    const ctx = getReturnContext_();
    const outputRows = [];
    const resultItems = [];

    for (let i = 0; i < items.length; i++) {
      const payload = items[i];
      validateReturnPayload_(payload);

      const master = getMasterInfoByStyle(payload.style);
      if (!master || !master.ok) {
        throw new Error(`Dòng ${i + 1}: ${master && master.message ? master.message : "Không tìm thấy sản phẩm trong master."}`);
      }

      const inspectionDate = parseInputDate_(payload.inspectionDate);
      if (!inspectionDate) {
        throw new Error(`Dòng ${i + 1}: Inspection Date không hợp lệ.`);
      }

      const po = String(master.po || "").trim();
      const supplier = String(master.supplier || "").trim();
      const unitPrice = toNumber_(master.unitPrice);

      const style = String(payload.style || "").trim();
      const size = String(payload.size || "").trim();
      const art = String(payload.art || "").trim();
      const fabric = String(payload.fabric || "").trim();
      const defectType = String(payload.defectType || "").trim();
      const quantity = toNumber_(payload.quantity);
      const description = String(payload.description || "").trim();
      const note = String(payload.note || "").trim();

      const id = buildReturnId_(po, art, size);
      const week = getWeekLabel_(inspectionDate);
      const month = getMonthLabel_(inspectionDate);

      outputRows.push([
        id,            // C
        po,            // D
        style,         // E
        size,          // F
        art,           // G
        supplier,      // H
        fabric,        // I
        defectType,    // J
        quantity,      // K
        description,   // L
        inspectionDate,// M
        week,          // N
        month,         // O
        unitPrice,     // P
        note
      ]);

      resultItems.push({
        id,
        po,
        supplier,
        unitPrice,
        matchedStyle: master.matchedStyle,
        matchType: master.matchType
      });
    }

    const startRow = getNextWriteRow_(ctx.sheet);
    ctx.sheet
      .getRange(startRow, RETURN_CFG.DATA_START_COL, outputRows.length, outputRows[0].length)
      .setValues(outputRows);

    // format Inspection Date = cột K = start col 1 + index 10 => 11
    ctx.sheet.getRange(startRow, 11, outputRows.length, 1).setNumberFormat("dd/MM/yyyy");
    // format Unit Price = cột N = start col 1 + index 13 => 14
    ctx.sheet.getRange(startRow, 14, outputRows.length, 1).setNumberFormat("#,##0.00");

    return {
      ok: true,
      message: `Đã lưu ${outputRows.length} dòng vào Return Analysis.`,
      startRow,
      endRow: startRow + outputRows.length - 1,
      count: outputRows.length,
      items: resultItems
    };
  } catch (e) {
    return { ok: false, message: String(e && e.message ? e.message : e) };
  }
}

/**
 * Lấy danh sách toàn bộ dòng dữ liệu hàng lỗi trả về để hiển thị báo cáo
 */
function getReturnRows() {
  try {
    const ctx = getReturnContext_();
    const lastRow = ctx.sheet.getLastRow();
    if (lastRow < RETURN_CFG.DATA_START_ROW) {
      return { ok: true, rows: [] };
    }

    const numRows = lastRow - RETURN_CFG.DATA_START_ROW + 1;
    const values = ctx.sheet.getRange(RETURN_CFG.DATA_START_ROW, RETURN_CFG.DATA_START_COL, numRows, 15).getValues();

    // Map từng dòng thành object để frontend dễ sử dụng
    const rows = [];
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const hasData = row.some(cell => cell !== "" && cell !== null);
      if (hasData) {
        rows.push({
          id: row[0],
          po: row[1],
          style: row[2],
          size: row[3],
          art: row[4],
          supplier: (() => {
            const s = String(row[5] || "").trim().toUpperCase();
            if (s === "A THANH") return "TALYNO";
            if (s === "A BẢO" || s === "A BAO") return "ANH THƯ";
            return row[5] || "";
          })(),
          fabric: row[6],
          defectType: row[7],
          quantity: row[8],
          description: row[9],
          inspectionDate: row[10],
          week: row[11],
          month: row[12],
          unitPrice: row[13],
          note: row[14] || ""
        });
      }
    }

    return { ok: true, rows: rows.reverse() }; // đảo ngược để bản ghi mới nhất ở trên cùng
  } catch (e) {
    return { ok: false, message: String(e && e.message ? e.message : e) };
  }
}

/**
 * Lấy danh sách đánh giá khách hàng (Customer Feedback) liên quan đến phòng R&D
 */
function getCustomerFeedbackRows() {
  try {
    const ss = SpreadsheetApp.openById("1M4COiy0LqbZnFEwGy4gWJ9hyzZpNapWK2HLefFvt0gw");
    const sheets = ss.getSheets();
    let targetSheet = null;
    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === 1599526268) {
        targetSheet = sheets[i];
        break;
      }
    }
    if (!targetSheet) {
      targetSheet = ss.getSheetByName("Customer_feedback");
    }
    if (!targetSheet) {
      throw new Error("Không tìm thấy sheet Customer_feedback.");
    }

    const vals = targetSheet.getDataRange().getDisplayValues();
    if (vals.length < 2) return { ok: true, rows: [] };

    // Tìm hàng chứa header (thường nằm ở hàng 1 hoặc hàng 3)
    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(vals.length, 10); r++) {
      const rowNorm = vals[r].map(h => normalizeHeader_(h));
      if (rowNorm.indexOf("phongban") >= 0 || rowNorm.indexOf("department") >= 0 || rowNorm.indexOf("thang") >= 0) {
        headerRowIndex = r;
        break;
      }
    }

    const rawHeaders = vals[headerRowIndex];
    const headers = rawHeaders.map(h => normalizeHeader_(h));

    // Tìm vị trí các cột quan trọng
    const idxMonth = findHeaderIndex_(headers, ["thang", "month"]);
    const idxYear = findHeaderIndex_(headers, ["nam", "year"]);
    const idxDate = findHeaderIndex_(headers, ["ngayghinhan", "ngaytao", "ngay", "date"]);
    const idxTime = findHeaderIndex_(headers, ["thoidiem", "time"]);
    const idxOrder = findHeaderIndex_(headers, ["iddon", "orderid"]);
    const idxChannel = findHeaderIndex_(headers, ["kenh", "platform", "channel", "nguon"]);
    const idxRating = findHeaderIndex_(headers, ["danhgia", "rating", "star"]);
    const idxQty = findHeaderIndex_(headers, ["slg", "soluong", "quantity"]);
    const idxReason = findHeaderIndex_(headers, ["nguyennhandanhgia", "nguyennhan", "description", "reason", "ghichuchitiet", "ghichu"]);
    const idxStatus = findHeaderIndex_(headers, ["trangthai", "status"]);
    const idxProduct = findHeaderIndex_(headers, ["sanpham", "product", "style"]);
    const idxIssue = findHeaderIndex_(headers, ["vande", "vane", "issue", "defect"]);
    const idxCondition = findHeaderIndex_(headers, ["tinhtrang", "condition"]);
    const idxDept = findHeaderIndex_(headers, ["phongban", "department", "dept"]);

    const rows = [];
    for (let i = headerRowIndex + 1; i < vals.length; i++) {
      const row = vals[i];
      const dept = idxDept >= 0 ? String(row[idxDept] || "").trim().toUpperCase() : "";
      
      // Chỉ lấy phòng R&D
      if (dept === "R&D" || dept.includes("R&D")) {
        // Parse rating
        let ratingVal = 1; // Mặc định là đánh giá tiêu cực (1-3 sao) cho các ca khiếu nại
        if (idxRating >= 0 && row[idxRating]) {
          const rStr = String(row[idxRating] || "").trim();
          const match = rStr.match(/(\d+)/);
          if (match) ratingVal = parseInt(match[1], 10);
        } else if (idxStatus >= 0) {
          const statusStr = String(row[idxStatus] || "").trim().toLowerCase();
          if (statusStr.includes("5*") || statusStr.includes("5 sao")) {
            ratingVal = 5;
          } else if (statusStr.includes("4*") || statusStr.includes("4 sao")) {
            ratingVal = 4;
          }
        }

        // Xử lý Ngày ghi nhận
        let dateVal = "";
        if (idxDate >= 0 && row[idxDate]) {
          dateVal = row[idxDate];
        } else if (idxTime >= 0 && row[idxTime]) {
          dateVal = row[idxTime];
        }

        rows.push({
          rowNumber: i + 1,
          month: idxMonth >= 0 ? row[idxMonth] : "",
          year: idxYear >= 0 ? row[idxYear] : "",
          date: dateVal,
          orderId: idxOrder >= 0 ? row[idxOrder] : "",
          channel: idxChannel >= 0 ? row[idxChannel] : "",
          rating: ratingVal,
          qty: idxQty >= 0 ? Number(String(row[idxQty]).replace(/[^\d]/g, "")) || 1 : 1,
          reason: idxReason >= 0 ? row[idxReason] : "",
          status: idxStatus >= 0 ? row[idxStatus] : "",
          product: idxProduct >= 0 ? row[idxProduct] : "",
          issue: idxIssue >= 0 ? row[idxIssue] : "",
          condition: idxCondition >= 0 ? row[idxCondition] : "",
          dept: dept
        });
      }
    }

    return { ok: true, rows: rows.reverse() }; // mới nhất lên đầu
  } catch (e) {
    return { ok: false, err: e.message };
  }
}
function dummy() {
  // disabled
}

function normalizeHeader_(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findHeaderIndex_(headers, candidates) {
  for (const c of candidates) {
    const normCand = normalizeHeader_(c);
    const idx = headers.indexOf(normCand);
    if (idx >= 0) return idx;
    
    // Tìm kiếm tương đối nếu không tìm thấy exact
    const partialIdx = headers.findIndex(h => h.includes(normCand));
    if (partialIdx >= 0) return partialIdx;
  }
  return -1;
}

/* ================= HELPERS ================= */

function getReturnContext_() {
  const ss = SpreadsheetApp.getActive();
  if (!ss) throw new Error("Script chưa gắn với file spreadsheet hiện tại.");

  const headers = [
    "Mã Lỗi (ID)",
    "Mã PO",
    "Tên sản phẩm (Style)",
    "Size",
    "Art",
    "Nhà cung cấp (Supplier)",
    "Chất liệu (Fabric)",
    "Loại lỗi (Defect Type)",
    "Số lượng (Quantity)",
    "Mô tả chi tiết (Description)",
    "Ngày kiểm tra (Inspection Date)",
    "Tuần (Week)",
    "Tháng (Month)",
    "Đơn giá (Unit Price)",
    "Ghi chú (Note)"
  ];

  let sh = ss.getSheetByName(RETURN_CFG.TARGET_SHEET_NAME);
  if (!sh) {
    // Tự động tạo sheet "Return Analysis" nếu chưa có
    sh = ss.insertSheet(RETURN_CFG.TARGET_SHEET_NAME);
    
    sh.getRange(RETURN_CFG.DATA_START_ROW - 1, RETURN_CFG.DATA_START_COL, 1, headers.length)
      .setValues([headers])
      .setFontWeight("bold")
      .setBackground("#e2e8f0") // Slate-200
      .setHorizontalAlignment("center");
  } else {
    // Đảm bảo đủ ít nhất 14 cột để không bị lỗi Range
    const maxCols = sh.getMaxColumns();
    if (maxCols < headers.length) {
      sh.insertColumnsAfter(maxCols, headers.length - maxCols);
    }
  }

  return { spreadsheet: ss, sheet: sh };
}

function getMasterSheet_() {
  const ss = SpreadsheetApp.openById(RETURN_CFG.MASTER_SPREADSHEET_ID);
  const sheets = ss.getSheets();

  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === RETURN_CFG.MASTER_SHEET_GID) {
      return sheets[i];
    }
  }

  throw new Error("Không tìm thấy sheet master theo gid: " + RETURN_CFG.MASTER_SHEET_GID);
}

function getNextWriteRow_(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < RETURN_CFG.DATA_START_ROW) {
    return RETURN_CFG.DATA_START_ROW;
  }

  const numRows = lastRow - RETURN_CFG.DATA_START_ROW + 1;
  const values = sheet.getRange(RETURN_CFG.DATA_START_ROW, RETURN_CFG.DATA_START_COL, numRows, 15).getValues();

  let lastUsedOffset = -1;
  for (let i = 0; i < values.length; i++) {
    const hasData = values[i].some(cell => cell !== "" && cell !== null);
    if (hasData) lastUsedOffset = i;
  }

  if (lastUsedOffset === -1) return RETURN_CFG.DATA_START_ROW;
  return RETURN_CFG.DATA_START_ROW + lastUsedOffset + 1;
}

function validateReturnPayload_(payload) {
  if (!payload) throw new Error("Payload rỗng.");
  if (!payload.style) throw new Error("Thiếu Tên sản phẩm.");
  if (!payload.size) throw new Error("Thiếu Size.");
  if (!payload.art) throw new Error("Thiếu Art.");
  if (!payload.fabric) throw new Error("Thiếu Fabric.");
  if (!payload.defectType) throw new Error("Thiếu Defect Type.");
  if (!payload.quantity) throw new Error("Thiếu Quantity.");
  if (!payload.note) throw new Error("Thiếu Ghi chú.");
  if (!payload.inspectionDate) throw new Error("Thiếu Inspection Date.");
}

function normalizeSearchText_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLooseRegex_(normalizedText) {
  const parts = normalizedText
    .split(" ")
    .filter(Boolean)
    .map(escapeRegex_);
  return new RegExp(parts.join(".*"));
}

function escapeRegex_(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseInputDate_(value) {
  if (value instanceof Date && !isNaN(value)) return value;

  const s = String(value || "").trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const vn = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vn) {
    return new Date(Number(vn[3]), Number(vn[2]) - 1, Number(vn[1]));
  }

  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
}

function buildReturnId_(po, art, size) {
  return [po, art, size]
    .map(v => String(v || "").trim())
    .filter(Boolean)
    .join("-");
}

function getWeekLabel_(date) {
  const day = date.getDate();
  const weekNo = Math.ceil(day / 7);
  return `TUẦN ${weekNo}`;
}

function getMonthLabel_(date) {
  return `THÁNG ${date.getMonth() + 1}`;
}

function toNumber_(value) {
  if (typeof value === "number") return value;

  const cleaned = String(value || "")
    .replace(/[^\d.,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

function getPlanData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    let planSheet = null;
    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId().toString() === "1924232854") {
        planSheet = sheets[i];
        break;
      }
    }
    
    if (!planSheet) {
      planSheet = ss.getSheetByName("Plan") || ss.getSheetByName("Planning") || ss.getSheetByName("Schedule");
    }
    
    let planData = [];
    if (planSheet) {
      const vals = planSheet.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const rows = vals.slice(1);
        planData = rows.map(r => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = r[i];
          });
          return obj;
        });
      }
    }
    return { ok: true, data: planData };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

/* =====================================================
   DELETE RECORD
   ===================================================== */
function deleteRecord(payload) {
  try {
    if (!payload || !payload.general_id) {
      return { ok: false, err: "general_id is required" };
    }
    const generalId = String(payload.general_id).trim();
    if (!generalId) {
      return { ok: false, err: "general_id cannot be empty" };
    }

    const ss = SpreadsheetApp.getActive();
    const sheets = ["General", "Measurements", "InspectionDetails", "Summary"];
    let totalDeleted = 0;
    
    sheets.forEach(sheetName => {
      const sh = ss.getSheetByName(sheetName);
      if (!sh) return;
      const data = sh.getDataRange().getValues();
      if (data.length <= 1) return;
      
      const headers = data[0].map(h => String(h).trim().toLowerCase());
      let colIdx = headers.indexOf("general_id");
      if (colIdx === -1) colIdx = headers.indexOf("general id");
      if (colIdx === -1) colIdx = headers.indexOf("mã báo cáo");
      if (colIdx === -1) colIdx = 1; // Fallback to 2nd column
      
      let count = 0;
      // Delete rows backwards to avoid indexing issues
      for (let r = data.length - 1; r >= 1; r--) {
        if (String(data[r][colIdx]).trim() === generalId) {
          sh.deleteRow(r + 1);
          count++;
        }
      }
      totalDeleted += count;
    });

    return { ok: true, general_id: generalId, totalDeleted: totalDeleted };
  } catch (err) {
    return { ok: false, err: err.message };
  }
}
/* =====================================================
   PLANNING / SCHEDULING (QC SCHEDULES)
   ===================================================== */

/**
 * GET: Fetch schedule data from Schedule sheet
 */
function getScheduleData() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName("Schedule");
    let scheduleData = [];
    if (sh) {
      const vals = sh.getDataRange().getDisplayValues();
      if (vals.length >= 2) {
        const headers = vals[0].map(h => String(h || "").trim().toLowerCase());
        const rows = vals.slice(1);
        scheduleData = rows.map(r => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = r[i];
          });
          return obj;
        });
      }
    }
    return { ok: true, data: scheduleData };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

/**
 * POST: Submit a planning record to Schedule sheet
 */
function submitPlan(payload) {
  try {
    if (!payload || !payload.date || !payload.type) {
      return { ok: false, err: "Date and Type are required fields" };
    }

    const ss = SpreadsheetApp.getActive();
    const sh = _getOrCreateSheet_(ss, "Schedule", [
      "timestamp", "plan_id", "date", "type", "factory", "order_no", "color", "quantity", "description", "status", "creator"
    ]);

    const ts = _nowStr_();
    const planId = "P" + Utilities.formatDate(new Date(), TIMEZONE || "GMT+7", "yyyyMMddHHmmssSSS");

    const row = [
      ts,
      planId,
      payload.date,
      payload.type,
      payload.factory || "",
      payload.order_no || "",
      payload.color || "",
      payload.quantity ? _toNumber_(payload.quantity) : "",
      payload.description || "",
      payload.status || "Pending",
      payload.creator || ""
    ];

    sh.appendRow(row);
    return { ok: true, plan_id: planId };
  } catch (err) {
    return { ok: false, err: err.message };
  }
}

/**
 * POST: Delete a planning record from Schedule sheet
 */
function deletePlan(payload) {
  try {
    if (!payload || !payload.plan_id) {
      return { ok: false, err: "plan_id is required" };
    }
    const planId = String(payload.plan_id).trim();

    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName("Schedule");
    if (!sh) return { ok: false, err: "Schedule sheet not found" };

    const data = sh.getDataRange().getValues();
    if (data.length <= 1) return { ok: true, count: 0 };

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const planIdIdx = headers.indexOf("plan_id");
    if (planIdIdx === -1) {
      return { ok: false, err: "plan_id column not found in Schedule sheet" };
    }

    let count = 0;
    for (let r = data.length - 1; r >= 1; r--) {
      if (String(data[r][planIdIdx]).trim() === planId) {
        sh.deleteRow(r + 1);
        count++;
      }
    }

    return { ok: true, plan_id: planId, count: count };
  } catch (err) {
    return { ok: false, err: err.message };
  }
}

/**
 * POST: Update status of a planning record in Schedule sheet
 */
function updatePlanStatus(payload) {
  try {
    if (!payload || !payload.plan_id || !payload.status) {
      return { ok: false, err: "plan_id and status are required" };
    }
    const planId = String(payload.plan_id).trim();
    const newStatus = String(payload.status).trim();

    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName("Schedule");
    if (!sh) return { ok: false, err: "Schedule sheet not found" };

    const data = sh.getDataRange().getValues();
    if (data.length <= 1) return { ok: false, err: "No data in Schedule sheet" };

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const planIdIdx = headers.indexOf("plan_id");
    const statusIdx = headers.indexOf("status");
    if (planIdIdx === -1 || statusIdx === -1) {
      return { ok: false, err: "Required columns not found in Schedule sheet" };
    }

    let success = false;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][planIdIdx]).trim() === planId) {
        sh.getRange(r + 1, statusIdx + 1).setValue(newStatus);
        success = true;
        break;
      }
    }

    if (success) {
      return { ok: true, plan_id: planId, status: newStatus };
    } else {
      return { ok: false, err: "Plan ID not found" };
    }
  } catch (err) {
    return { ok: false, err: err.message };
  }
}

/* =====================================================
   MATERIALS APPROVAL (NPL) MODULE
   ===================================================== */
const NPL_TZ = "Asia/Ho_Chi_Minh";

const NPL_CFG = {
  DATA_SHEET_NAME: "materials_approval",
  ROOT_FOLDER_NAME: "NPL_FILES",

  // Sheet nguồn để dò timeline
  SYNC_SOURCE_SHEET_NAME: "ĐỒNG BỘ NPL Q1/26",
  SYNC_SOURCE_HEADER_ROW: 15,

  // Header trong sheet nguồn
  MAP: {
    MONTH: "THÁNG",
    PRODUCT_NAME: "TÊN SẢN PHẨM",
    COLOR: "MÀU",
    FACTORY: "NHÀ MÁY",
    TIMELINE: "TIMELINE NHẬP KHO",
    STATUS: "③ Trạng thái đồng bộ",
  },
};

/**
 * Run 1 lần để tạo tab + folder
 */
function setupNPL() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
  if (!ss) {
    throw new Error("Script không gắn với Spreadsheet. Hãy mở Google Sheet > Extensions > Apps Script.");
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty("CONTAINER_SPREADSHEET_ID", ss.getId());
  props.setProperty("DATA_SHEET_NAME", NPL_CFG.DATA_SHEET_NAME);

  const sh = getOrCreateNplSheet_(ss, NPL_CFG.DATA_SHEET_NAME);
  ensureNplHeader_(sh);

  sh.getRange("F:F").setNumberFormat("dd/MM/yyyy"); // Timeline nhập kho
  sh.getRange("H:H").setNumberFormat("dd/MM/yyyy"); // Ngày duyệt vải
  sh.getRange("J:J").setNumberFormat("dd/MM/yyyy"); // Ngày duyệt bo

  let folderId = props.getProperty("ROOT_FOLDER_ID");
  let folder;

  if (!folderId) {
    folder = DriveApp.createFolder(NPL_CFG.ROOT_FOLDER_NAME);
    folderId = folder.getId();
    props.setProperty("ROOT_FOLDER_ID", folderId);
  } else {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch(e) {
      folder = DriveApp.createFolder(NPL_CFG.ROOT_FOLDER_NAME);
      folderId = folder.getId();
      props.setProperty("ROOT_FOLDER_ID", folderId);
    }
  }

  return {
    ok: true,
    spreadsheetUrl: ss.getUrl(),
    sheetName: sh.getName(),
    folderUrl: folder.getUrl(),
  };
}

/**
 * Submit từ web app
 */
function submitNPL(payload) {
  try {
    validateNplPayload_(payload);

    const ctx = getNplContext_();
    const now = new Date();
    const monthKey = normalizeNplMonth_(payload.month || Utilities.formatDate(now, NPL_TZ, "yyyy-MM"));
    const monthFolder = getOrCreateNplFolder_(monthKey, ctx.rootFolder);

    // Luôn auto resolve timeline
    const resolved = resolveNplTimelineInStock_({
      spreadsheet: ctx.spreadsheet,
      month: monthKey,
      productName: payload.productName,
      color: payload.color,
      factory: payload.factory,
    });

    if (!resolved.ok) {
      throw new Error(resolved.message);
    }

    // Save image
    let fileId = "";
    let fileUrl = "";
    let imageFormula = "";

    if (payload.imageDataUrl) {
      const img = saveNplImage_(payload.imageDataUrl, payload, monthFolder);
      fileId = img.fileId;
      fileUrl = img.fileUrl;
      imageFormula = `=IMAGE("https://drive.google.com/uc?export=view&id=${fileId}")`;
    } else {
      throw new Error("Chưa có hình ảnh.");
    }

    ctx.sheet.appendRow([
      now,                                      // A Timestamp
      monthKey,                                 // B Tháng
      payload.productName || "",                // C Tên sản phẩm
      payload.color || "",                      // D Màu
      payload.factory || "",                    // E Nhà máy
      resolved.timeline,                        // F Timeline nhập kho (auto)
      payload.approveFabric ? "TRUE" : "FALSE", // G Duyệt vải
      payload.approveFabricDate || "",          // H Ngày duyệt vải
      payload.approveRib ? "TRUE" : "FALSE",    // I Duyệt bo
      payload.approveRibDate || "",             // J Ngày duyệt bo
      payload.issue || "",                      // K Vấn đề
      payload.status || "",                     // L Trạng thái
      fileId,                                   // M ImageFileId
      fileUrl,                                  // N ImageFileUrl
      imageFormula,                             // O ImagePreview
    ]);

    const lastRow = ctx.sheet.getLastRow();
    ctx.sheet.getRange(lastRow, 6).setNumberFormat("dd/MM/yyyy");
    ctx.sheet.getRange(lastRow, 8).setNumberFormat("dd/MM/yyyy");
    ctx.sheet.getRange(lastRow, 10).setNumberFormat("dd/MM/yyyy");

    // SAVE TESTING DATA
    let testingResultMsg = "";
    if (payload.hasTesting) {
      const testSheet = getNplTestingSheet_(ctx.spreadsheet);
      const testDate = payload.testDate ? parseNplSheetDate_(payload.testDate) : now;

      testSheet.appendRow([
        testDate,                             // A DATE
        payload.factory || "",                // B SUP/MILL
        payload.productName || "",            // C FABRIC NAME/TYPE
        payload.color || "",                  // D ART/COLOR
        Number(payload.warpBefore) || 50,     // E WARP/ BEFORE WASH
        Number(payload.warpAfter) || 0,       // F WARP/ AFTER WASH
        Number(payload.weftBefore) || 50,     // G WEFT/ BEFORE WASH
        Number(payload.weftAfter) || 0,       // H WEFT/ AFTER WASH
        payload.warpShrinkage || "",          // I % Shrinkage (WARP)
        payload.weftShrinkage || "",          // J % Shrinkage (WEFT)
        payload.visualResult || "Pass",       // K Visual Appearance / Handfeel Result
        payload.shrinkageResult || "Pass",    // L Shrinkage Result
        payload.testingFinalResult || "Pass", // M Final Result
        payload.testingNote || "",            // N Note
      ]);

      const lastTestRow = testSheet.getLastRow();
      testSheet.getRange(lastTestRow, 1).setNumberFormat("dd/MM/yyyy");
      testingResultMsg = "\nĐã lưu kết quả kiểm thử co rút.";
    }

    return {
      ok: true,
      message: "Đã lưu dữ liệu và tự dò timeline nhập kho." + testingResultMsg,
      resolvedTimeline: Utilities.formatDate(resolved.timeline, NPL_TZ, "dd/MM/yyyy"),
      matchedCount: resolved.matchedCount,
      pickedRow: resolved.pickedRow,
      fileUrl,
    };
  } catch (e) {
    return {
      ok: false,
      message: String(e && e.message ? e.message : e),
    };
  }
}

/* ================= TIMELINE RESOLVER ================= */

function resolveNplTimelineInStock_({ spreadsheet, month, productName, color, factory }) {
  const sh = spreadsheet.getSheetByName(NPL_CFG.SYNC_SOURCE_SHEET_NAME);
  if (!sh) {
    return {
      ok: false,
      message: `Không tìm thấy sheet nguồn: ${NPL_CFG.SYNC_SOURCE_SHEET_NAME}`,
    };
  }

  const headerRow = NPL_CFG.SYNC_SOURCE_HEADER_ROW;
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();

  if (lastRow <= headerRow) {
    return {
      ok: false,
      message: `Sheet nguồn chưa có dữ liệu: ${NPL_CFG.SYNC_SOURCE_SHEET_NAME}`,
    };
  }

  const headers = sh.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0];
  const colMap = buildNplHeaderMap_(headers);

  const monthCol = colMap[normalizeNplHeader_(NPL_CFG.MAP.MONTH)];
  const productCol = colMap[normalizeNplHeader_(NPL_CFG.MAP.PRODUCT_NAME)];
  const colorCol = colMap[normalizeNplHeader_(NPL_CFG.MAP.COLOR)];
  const factoryCol = colMap[normalizeNplHeader_(NPL_CFG.MAP.FACTORY)];
  const timelineCol = colMap[normalizeNplHeader_(NPL_CFG.MAP.TIMELINE)];
  const statusCol = colMap[normalizeNplHeader_(NPL_CFG.MAP.STATUS)];

  const missing = [];
  if (!monthCol) missing.push(NPL_CFG.MAP.MONTH);
  if (!productCol) missing.push(NPL_CFG.MAP.PRODUCT_NAME);
  if (!colorCol) missing.push(NPL_CFG.MAP.COLOR);
  if (!factoryCol) missing.push(NPL_CFG.MAP.FACTORY);
  if (!timelineCol) missing.push(NPL_CFG.MAP.TIMELINE);
  if (!statusCol) missing.push(NPL_CFG.MAP.STATUS);

  if (missing.length) {
    return {
      ok: false,
      message: `Thiếu header trong sheet nguồn: ${missing.join(", ")}`,
    };
  }

  const values = sh.getRange(headerRow + 1, 1, lastRow - headerRow, lastCol).getValues();

  const targetMonth = normalizeNplMonth_(month);
  const targetProduct = productName;
  const targetColor = normalizeNplText_(color);
  const targetFactory = normalizeNplText_(factory);

  const matches = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];

    const sourceMonth = normalizeNplMonth_(row[monthCol - 1]);
    const sourceProduct = row[productCol - 1];
    const sourceColor = normalizeNplText_(row[colorCol - 1]);
    const sourceFactory = normalizeNplText_(row[factoryCol - 1]);
    const sourceTimeline = parseNplSheetDate_(row[timelineCol - 1]);
    const sourceStatus = normalizeNplText_(row[statusCol - 1]);

    if (!sourceTimeline) continue;

    const timelineMonth = Utilities.formatDate(sourceTimeline, NPL_TZ, "yyyy-MM");

    const isSameKey =
      sourceMonth === targetMonth &&
      isNplProductMatch_(targetProduct, sourceProduct) &&
      sourceColor === targetColor &&
      sourceFactory === targetFactory;

    if (!isSameKey) continue;
    if (timelineMonth !== targetMonth) continue;

    // Bỏ dòng đã đồng bộ
    if (isNplSyncedStatus_(sourceStatus)) continue;

    matches.push({
      rowNumber: headerRow + 1 + i,
      timeline: sourceTimeline,
      status: sourceStatus,
    });
  }

  if (matches.length === 0) {
    return {
      ok: false,
      message:
        `Không còn timeline khả dụng trong tháng ${targetMonth} cho: ` +
        `${productName} | ${color} | ${factory}`,
    };
  }

  // Ưu tiên timeline từ bé -> lớn
  matches.sort((a, b) => stripNplTime_(a.timeline).getTime() - stripNplTime_(b.timeline).getTime());

  const picked = matches[0];

  return {
    ok: true,
    timeline: picked.timeline,
    pickedRow: picked.rowNumber,
    matchedCount: matches.length,
  };
}

function isNplSyncedStatus_(status) {
  const s = normalizeNplText_(status);

  return [
    "ĐÃ DUYỆT ĐỒNG BỘ",
    "DA DUYET DONG BO",
    "ĐÃ ĐỒNG BỘ",
    "DA DONG BO",
    "SYNCED",
    "DONE",
    "COMPLETED",
    "CLOSED",
  ].includes(s);
}

/* ================= NPL HELPERS ================= */

function getNplContext_() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty("CONTAINER_SPREADSHEET_ID");
  const sheetName = props.getProperty("DATA_SHEET_NAME") || NPL_CFG.DATA_SHEET_NAME;
  let folderId = props.getProperty("ROOT_FOLDER_ID");

  let ss;
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch(e) {
      ss = SpreadsheetApp.getActive();
    }
  } else {
    ss = SpreadsheetApp.getActive();
  }
  
  if (!ss) {
    throw new Error("Không thể truy cập Spreadsheet. Hãy chạy setupNPL() trước.");
  }

  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
    ensureNplHeader_(sh);
  }

  let folder;
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch(e) {
      // Ignore to recreate/find
    }
  }
  
  if (!folder) {
    const rootFolders = DriveApp.getFoldersByName(NPL_CFG.ROOT_FOLDER_NAME);
    if (rootFolders.hasNext()) {
      folder = rootFolders.next();
    } else {
      folder = DriveApp.createFolder(NPL_CFG.ROOT_FOLDER_NAME);
    }
    props.setProperty("ROOT_FOLDER_ID", folder.getId());
  }

  return { spreadsheet: ss, sheet: sh, rootFolder: folder };
}

function getOrCreateNplSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function getNplTestingSheet_(ss) {
  const sheets = ss.getSheets();
  const target = sheets.find(s => s.getSheetId() === 465977407);
  if (!target) {
    throw new Error("Không tìm thấy sheet testing có GID 465977407.");
  }
  return target;
}

function ensureNplHeader_(sh) {
  const header = [
    "Timestamp",
    "Tháng",
    "Tên sản phẩm",
    "Màu",
    "Nhà máy",
    "Timeline nhập kho",
    "Duyệt vải",
    "Ngày duyệt vải",
    "Duyệt bo",
    "Ngày duyệt bo",
    "Vấn đề",
    "Trạng thái",
    "ImageFileId",
    "ImageFileUrl",
    "ImagePreview",
  ];

  const first = sh.getRange(1, 1, 1, header.length).getValues()[0];
  const empty = first.every(c => c === "" || c === null);

  if (empty) {
    sh.getRange(1, 1, 1, header.length).setValues([header]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, header.length).setFontWeight("bold");
    sh.autoResizeColumns(1, header.length);
    sh.setColumnWidth(15, 180);
  }
}

function getOrCreateNplFolder_(name, parent) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function saveNplImage_(dataUrl, payload, folder) {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Image data invalid.");

  const mime = match[1];
  const bytes = Utilities.base64Decode(match[2]);

  const safeName = [
    normalizeNplMonth_(payload.month || Utilities.formatDate(new Date(), NPL_TZ, "yyyy-MM")),
    payload.productName || "product",
    payload.color || "color",
    payload.factory || "factory",
    Date.now(),
  ]
    .join("_")
    .replace(/[^\w\-]+/g, "_");

  const ext = mime.includes("png") ? "png" : "jpg";
  const file = folder.createFile(
    Utilities.newBlob(bytes, mime, `NPL_${safeName}.${ext}`)
  );

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    fileUrl: file.getUrl(),
  };
}

function validateNplPayload_(payload) {
  if (!payload) throw new Error("Payload rỗng.");
  if (!payload.month) throw new Error("Thiếu tháng.");
  if (!payload.productName) throw new Error("Thiếu tên sản phẩm.");
  if (!payload.color) throw new Error("Thiếu màu.");
  if (!payload.factory) throw new Error("Thiếu nhà máy.");
  if (!payload.status) throw new Error("Thiếu trạng thái.");
  if (!payload.imageDataUrl) throw new Error("Chưa có hình ảnh.");

  if (payload.hasTesting) {
    if (payload.warpBefore === undefined || payload.warpBefore === "") throw new Error("Thiếu WARP trước giặt.");
    if (payload.warpAfter === undefined || payload.warpAfter === "") throw new Error("Thiếu WARP sau giặt.");
    if (payload.weftBefore === undefined || payload.weftBefore === "") throw new Error("Thiếu WEFT trước giặt.");
    if (payload.weftAfter === undefined || payload.weftAfter === "") throw new Error("Thiếu WEFT sau giặt.");
  }
}

function buildNplHeaderMap_(headers) {
  const map = {};
  headers.forEach((h, i) => {
    const key = normalizeNplHeader_(h);
    if (key) map[key] = i + 1;
  });
  return map;
}

function normalizeNplHeader_(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizeNplText_(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizeNplProductKey_(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(basic|classic|new|ao|so mi|somi|tee|t shirt|t-shirt|shirt)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNplProductMatch_(inputProduct, sourceProduct) {
  const exactA = normalizeNplText_(inputProduct);
  const exactB = normalizeNplText_(sourceProduct);

  if (exactA && exactB && exactA === exactB) return true;

  const a = normalizeNplProductKey_(inputProduct);
  const b = normalizeNplProductKey_(sourceProduct);

  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const aTokens = a.split(" ").filter(Boolean);
  const bTokens = b.split(" ").filter(Boolean);
  const overlap = aTokens.filter(t => bTokens.includes(t));

  return overlap.length >= Math.min(2, Math.max(1, Math.min(aTokens.length, bTokens.length)));
}

function normalizeNplMonth_(value) {
  if (value instanceof Date && !isNaN(value)) {
    return Utilities.formatDate(value, NPL_TZ, "yyyy-MM");
  }

  const s = String(value || "").trim();

  if (/^\d{4}-\d{2}$/.test(s)) return s;

  if (/^\d{4}-\d{1}$/.test(s)) {
    const [y, m] = s.split("-");
    return `${y}-${String(Number(m)).padStart(2, "0")}`;
  }

  const viMonth = s.match(/tháng\s*(\d{1,2})/i);
  if (viMonth) {
    const year = new Date().getFullYear();
    const month = String(Number(viMonth[1])).padStart(2, "0");
    return `${year}-${month}`;
  }

  const dt = new Date(s);
  if (!isNaN(dt)) {
    return Utilities.formatDate(dt, NPL_TZ, "yyyy-MM");
  }

  return s;
}

function parseNplSheetDate_(value) {
  if (value instanceof Date && !isNaN(value)) {
    return value;
  }

  const s = String(value || "").trim();
  if (!s || s === "/") return null;

  const vn = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vn) {
    const d = Number(vn[1]);
    const m = Number(vn[2]) - 1;
    const y = Number(vn[3]);
    return new Date(y, m, d);
  }

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const d = Number(iso[3]);
    return new Date(y, m, d);
  }

  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
}

function stripNplTime_(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Backend function to submit fabric shrinkage & appearance test results directly to tab with GID 465977407
 */
function submitFabricTesting(payload) {
  try {
    if (!payload) throw new Error("Payload rỗng.");
    if (!payload.date) throw new Error("Thiếu ngày kiểm thử.");
    if (!payload.supMill) throw new Error("Thiếu SUP/MILL.");
    if (!payload.fabricArticle) throw new Error("Thiếu Fabric Article.");
    if (!payload.color) throw new Error("Thiếu Color.");

    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
    if (!ss) throw new Error("Không thể truy cập Spreadsheet.");

    const sheets = ss.getSheets();
    const testSheet = sheets.find(s => s.getSheetId() === 465977407);
    if (!testSheet) {
      throw new Error("Không tìm thấy sheet testing có GID 465977407.");
    }

    const testDate = parseNplSheetDate_(payload.date);

    testSheet.appendRow([
      testDate || new Date(),                  // A DATE
      payload.supMill || "",                   // B SUP/MILL
      payload.fabricArticle || "",             // C FABRIC NAME/TYPE
      payload.color || "",                     // D ART/COLOR
      Number(payload.warpBefore) || 50,        // E WARP/ BEFORE WASH
      Number(payload.warpAfter) || 0,          // F WARP/ AFTER WASH
      Number(payload.weftBefore) || 50,        // G WEFT/ BEFORE WASH
      Number(payload.weftAfter) || 0,          // H WEFT/ AFTER WASH
      payload.warpShrinkage || "",             // I % Shrinkage (WARP)
      payload.weftShrinkage || "",             // J % Shrinkage (WEFT)
      payload.visualResult || "Pass",          // K Visual Appearance / Handfeel Result
      payload.shrinkageResult || "Pass",       // L Shrinkage Result
      payload.finalResult || "Pass",           // M Final Result
      payload.note || "",                      // N Note
    ]);

    const lastTestRow = testSheet.getLastRow();
    testSheet.getRange(lastTestRow, 1).setNumberFormat("dd/MM/yyyy");

    return {
      ok: true,
      message: "Đã lưu kết quả kiểm thử co rút thành công vào hệ thống.",
    };
  } catch (e) {
    return {
      ok: false,
      message: String(e && e.message ? e.message : e),
    };
  }
}

/**
 * Backend function to retrieve historical fabric testing reports from sheet GID 465977407
 */
function getFabricTestingRows() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
    if (!ss) throw new Error("Không thể truy cập Spreadsheet.");

    const sheets = ss.getSheets();
    const testSheet = sheets.find(s => s.getSheetId() === 465977407);
    if (!testSheet) {
      throw new Error("Không tìm thấy sheet testing có GID 465977407.");
    }

    const data = testSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { ok: true, rows: [] };
    }

    const rows = [];
    // Column mappings:
    // 0: Date, 1: Sup/Mill, 2: Fabric Name, 3: Color, 4: Warp Before, 5: Warp After, 
    // 6: Weft Before, 7: Weft After, 8: Warp Shrinkage, 9: Weft Shrinkage, 
    // 10: Visual Result, 11: Shrinkage Result, 12: Final Result, 13: Note
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let formattedDate = "";
      if (row[0] instanceof Date) {
        const yr = row[0].getFullYear();
        const mo = String(row[0].getMonth() + 1).padStart(2, '0');
        const dy = String(row[0].getDate()).padStart(2, '0');
        formattedDate = `${yr}-${mo}-${dy}`;
      } else if (row[0]) {
        try {
          const d = new Date(row[0]);
          if (!isNaN(d.getTime())) {
            const yr = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const dy = String(d.getDate()).padStart(2, '0');
            formattedDate = `${yr}-${mo}-${dy}`;
          } else {
            formattedDate = String(row[0]);
          }
        } catch(e) {
          formattedDate = String(row[0]);
        }
      }

      rows.push({
        date: formattedDate,
        supMill: String(row[1] || ""),
        fabricArticle: String(row[2] || ""),
        color: String(row[3] || ""),
        warpBefore: row[4] !== undefined && row[4] !== "" ? String(row[4]) : "50",
        warpAfter: row[5] !== undefined && row[5] !== "" ? String(row[5]) : "",
        weftBefore: row[6] !== undefined && row[6] !== "" ? String(row[6]) : "50",
        weftAfter: row[7] !== undefined && row[7] !== "" ? String(row[7]) : "",
        warpShrinkage: String(row[8] || ""),
        weftShrinkage: String(row[9] || ""),
        visualResult: String(row[10] || "Pass"),
        shrinkageResult: String(row[11] || "Pass"),
        finalResult: String(row[12] || "Pass"),
        note: String(row[13] || "")
      });
    }

    return { ok: true, rows: rows.reverse() }; // Newest entries first
  } catch (e) {
    return { ok: false, err: e.message || String(e) };
  }
}