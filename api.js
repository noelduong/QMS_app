/**
 * api.js — QMS API Client
 * 
 * Gọi Google Apps Script Web App (code.gs đã deploy)
 * API contract: responses dùng { ok: true/false, ... }
 * POST body: { action, payload }
 */

const QMS_API = (() => {

  const API_URL = 'https://script.google.com/macros/s/AKfycbx7OLkhCNm45PTfd92NmyEgOc82713CES2pEqtHJVlBdhZFA1lxOxDuJSUtj5n-Acu6/exec';

  /* ---- Helper: GET request ---- */
  async function get(params = {}) {
    const url = new URL(API_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('_t', Date.now()); // Tránh trình duyệt cache kết quả từ GAS

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.ok === false) throw new Error(json.err || json.message || json.msg || 'API Error');
    return json;
  }

  /* ---- Helper: POST request ---- */
  async function post(action, payload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload })
    });

    // GAS redirects POST → follow manually
    const json = await res.json();
    if (json.ok === false) throw new Error(json.err || json.message || json.msg || 'API Error');
    return json;
  }

  /* ---- Helper: Check and filter out test records ---- */
  function isTestRecord(fobSupplier, po, style) {
    const fob = String(fobSupplier || "").trim().toLowerCase();
    const poLower = String(po || "").trim().toLowerCase();
    const styleLower = String(style || "").trim().toLowerCase();
    
    // Check specific test factory/supplier names
    if (fob === 'agaga' || fob === 'test factory' || fob === 'khác' || fob === 'khac' || fob === 'test' || fob === 'test fob') {
      return true;
    }
    
    // Check if the PO or style name contains test/agaga keyword
    if (poLower.includes('test') || styleLower.includes('test') || poLower === 'agaga' || styleLower === 'agaga') {
      return true;
    }
    
    return false;
  }

  /* ---- Public API ---- */
  return {
    /** Check if API is configured */
    isConfigured() {
      return API_URL && !API_URL.includes('YOUR_GAS_DEPLOY_URL');
    },

    /**
     * GET: Load all specs as { category: { point: { size: {spec, tol} } } }
     * GAS returns: { ok: true, specs: {...} } for single category
     * We call without category to get all via getAllSpecs pattern
     */
    async getSpecs() {
      // First get categories
      const catRes = await get({ action: 'getCategories' });
      const categories = catRes.categories || [];
      
      // Then fetch specs for each category
      const allSpecs = {};
      const promises = categories.map(async (cat) => {
        const specRes = await get({ action: 'getSpecs', category: cat });
        if (specRes.ok !== false && specRes.specs) {
          // Convert from {point: {size: {spec, tol}}} to {point: {size: {s, t}}}
          const converted = {};
          Object.entries(specRes.specs).forEach(([point, sizes]) => {
            converted[point] = {};
            Object.entries(sizes).forEach(([size, data]) => {
              converted[point][size] = {
                s: data.spec !== undefined ? data.spec : (data.s || 0),
                t: data.tol !== undefined ? data.tol : (data.t || 0)
              };
            });
          });
          allSpecs[cat] = converted;
        }
      });
      await Promise.all(promises);
      return allSpecs;
    },

    /** GET: Load categories list */
    async getCategories() {
      const res = await get({ action: 'getCategories' });
      return res.categories || [];
    },

    /** GET: Load all final inspection results from General and Summary sheets */
    async getFinalResults() {
      const res = await get({ action: 'getFinalResults' });
      if (res && res.ok) {
        if (Array.isArray(res.general)) {
          res.general = res.general.filter(row => {
            if (!row.general_id || !row.general_id.trim()) return false;
            return !isTestRecord(row.fob_supplier, row.po_no || row.product_name, row.style_no);
          });
        }
        if (Array.isArray(res.summary)) {
          res.summary = res.summary.filter(row => {
            return row.general_id && row.general_id.trim();
          });
        }
      }
      return res;
    },

    /** GET: Load a specific inspection report details */
    async getInspectionReport(generalId) {
      return await get({ action: 'getInspectionReport', general_id: generalId });
    },

    /**
     * POST: Submit General info
     * Returns { ok: true, general_id: "G..." }
     */
    async submitGeneral(formData) {
      return await post('submitGeneral', formData);
    },

    /**
     * POST: Submit measurements bulk
     * payload: { general_id, points: [...] }
     */
    async submitMeasurements(payload) {
      return await post('submitMeasurementsBulk', payload);
    },

    /**
     * POST: Submit inspection details (defects)
     * payload: { general_id, rows: [...] }
     */
    async submitInspectionDetails(payload) {
      return await post('submitInspectionDetails', payload);
    },

    /**
     * POST: Submit overall summary → auto-calculates AQL result
     * payload: { general_id, measurement: {...}, appearance: {...}, remark, ack_factory, ack_polomanor, ack_date }
     */
    async submitOverallSummary(payload) {
      return await post('submitOverallSummary', payload);
    },

    /**
     * POST: Upload defect image (base64)
     * payload: { general_id, fileName, contentBase64 }
     */
    async uploadImageBase64(payload) {
      return await post('uploadImageBase64', payload);
    },

    /**
     * GET: Search master by style
     * Returns { ok: true/false, po, supplier, unitPrice, matchedStyle, ... }
     */
    async getMasterInfoByStyle(style) {
      return await get({ action: 'getMasterInfoByStyle', style });
    },

    /**
     * GET: Fetch all customer feedback rows for R&D
     */
    async getCustomerFeedback() {
      const res = await get({ action: 'getCustomerFeedback' });
      if (res && res.ok && Array.isArray(res.rows)) {
        res.rows = res.rows.filter(row => {
          return !isTestRecord(row.fob_supplier || row.supplier, row.orderId || row.po, row.product);
        });
      }
      return res;
    },

    /**
     * GET: Fetch all historical return rows
     */
    async getReturnRows() {
      const res = await get({ action: 'getReturnRows' });
      if (res && res.ok && Array.isArray(res.rows)) {
        res.rows = res.rows.filter(row => {
          return !isTestRecord(row.supplier, row.po, row.style);
        });
      }
      return res;
    },

    /**
     * GET: Fetch planned schedule data
     */
    async getPlanData() {
      const res = await get({ action: 'getPlanData' });
      if (res && res.ok && Array.isArray(res.data)) {
        res.data = res.data.filter(p => {
          const fob = p.fob || p.supplier || p.factory || p["nhà máy"] || p.fob_supplier || "";
          const po = p.po || p.po_number || p["po number"] || p["mã po"] || "";
          const style = p.style || p.product_code || p.product_name || "";
          return !isTestRecord(fob, po, style);
        });
      }
      return res;
    },

    /**
     * GET: Fetch schedule data from Schedule sheet
     */
    async getScheduleData() {
      const res = await get({ action: 'getScheduleData' });
      if (res && res.ok && Array.isArray(res.data)) {
        res.data = res.data.filter(p => {
          const fob = p.fob || p.supplier || p.factory || p["nhà máy"] || p.fob_supplier || "";
          const po = p.po || p.po_number || p["po number"] || p["mã po"] || "";
          const style = p.style || p.product_code || p.product_name || "";
          return !isTestRecord(fob, po, style);
        });
      }
      return res;
    },

    /**
     * POST: Submit return analysis batch
     * payload: Array of return items
     */
    async submitReturnAnalysisBatch(payload) {
      return await post('submitReturnAnalysisBatch', payload);
    },

    /**
     * POST: Delete a specific record by general_id across all relevant sheets
     * payload: { general_id }
     */
    async deleteRecord(generalId) {
      return await post('deleteRecord', { general_id: generalId });
    },

    /**
     * POST: Submit a planning record
     * payload: { date, type, factory, order_no, color, quantity, description }
     */
    async submitPlan(payload) {
      return await post('submitPlan', payload);
    },

    /**
     * POST: Delete a planning record
     * payload: { plan_id }
     */
    async deletePlan(planId) {
      return await post('deletePlan', { plan_id: planId });
    },

    /**
     * POST: Update status of a planning record
     * payload: { plan_id, status }
     */
    async updatePlanStatus(planId, status) {
      return await post('updatePlanStatus', { plan_id: planId, status: status });
    },

    /**
     * POST: Submit Materials Approval (NPL) record with optional testing data
     */
    async submitNPL(payload) {
      return await post('submitNPL', payload);
    },

    /**
     * POST: Submit Fabric Shrinkage & Appearance Testing report directly
     */
    async submitFabricTesting(payload) {
      return await post('submitFabricTesting', payload);
    },

    /**
     * GET: Fetch all historical fabric testing reports
     */
    async getFabricTesting() {
      return await get({ action: 'getFabricTesting' });
    }
  };
})();
