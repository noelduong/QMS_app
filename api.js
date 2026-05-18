/**
 * api.js — QMS API Client
 * 
 * Gọi Google Apps Script Web App (code.gs đã deploy)
 * API contract: responses dùng { ok: true/false, ... }
 * POST body: { action, payload }
 */

const QMS_API = (() => {

  const API_URL = 'https://script.google.com/macros/s/AKfycbz8lgi8wXdgg5xoZehK9uVkwux77bXFvoVE3rCwTBwAqCWUk777g4zI-kbTqCoKCpoW/exec';

  /* ---- Helper: GET request ---- */
  async function get(params = {}) {
    const url = new URL(API_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.ok === false) throw new Error(json.err || 'API Error');
    return json;
  }

  /* ---- Helper: POST request ---- */
  async function post(action, payload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, payload })
    });

    // GAS redirects POST → follow manually
    const json = await res.json();
    if (json.ok === false) throw new Error(json.err || 'API Error');
    return json;
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
      return await get({ action: 'getFinalResults' });
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
     * POST: Submit return analysis batch
     * payload: Array of return items
     */
    async submitReturnAnalysisBatch(payload) {
      return await post('submitReturnAnalysisBatch', payload);
    }
  };
})();
