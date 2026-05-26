/**
 * =========================================================================
 * POLOMANOR - STANDALONE FABRIC TESTING APP BACKEND (code.gs)
 * =========================================================================
 * 
 * Hướng dẫn lắp đặt:
 * 1. Mở dự án Google Apps Script của bạn.
 * 2. Thay thế toàn bộ mã nguồn trong file code.gs bằng nội dung file này.
 * 3. Tạo một file HTML mới tên là "Index" (Index.html) và dán nội dung file Index.html của ứng dụng vào đó.
 * 4. Bấm "Triển khai" (Deploy) -> "Cấu hình triển khai mới" (New deployment) dưới dạng Web App để sử dụng.
 */

const TZ = "Asia/Ho_Chi_Minh";

/**
 * Hàm phục vụ giao diện Web App chính
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("POLOMANOR - BÁO CÁO CO RÚT VẢI")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/**
 * Lưu kết quả kiểm thử co rút & ngoại quan trực tiếp vào sheet có GID 465977407
 * 
 * @param {Object} payload Dữ liệu gửi từ giao diện người dùng
 * @return {Object} Kết quả phản hồi trạng thái
 */
function submitFabricTesting(payload) {
  try {
    if (!payload) throw new Error("Dữ liệu trống (Empty payload).");
    if (!payload.date) throw new Error("Vui lòng điền ngày kiểm thử.");
    if (!payload.supMill) throw new Error("Vui lòng điền SUP/MILL (Nhà máy).");
    if (!payload.fabricArticle) throw new Error("Vui lòng điền Fabric Name/Type (Tên/Mã vải).");
    if (!payload.color) throw new Error("Vui lòng điền mã màu (Color).");

    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
    if (!ss) throw new Error("Không thể kết nối đến Google Spreadsheet. Hãy đảm bảo tập lệnh được chạy trực tiếp từ Spreadsheet gắn kèm.");

    // Tìm kiếm sheet trực tiếp bằng GID 465977407
    const sheets = ss.getSheets();
    const testSheet = sheets.find(function(s) {
      return s.getSheetId() === 465977407;
    });

    if (!testSheet) {
      throw new Error("Không tìm thấy tab sheet có GID 465977407. Vui lòng kiểm tra lại cấu trúc Google Sheets của bạn.");
    }

    // Tự xử lý định dạng ngày tháng đầu vào để ghi chuẩn xác
    var parsedDate = null;
    if (payload.date) {
      var s = String(payload.date).trim();
      var iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (iso) {
        parsedDate = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      } else {
        var vn = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (vn) {
          parsedDate = new Date(Number(vn[3]), Number(vn[2]) - 1, Number(vn[1]));
        } else {
          var dt = new Date(s);
          parsedDate = isNaN(dt.getTime()) ? new Date() : dt;
        }
      }
    } else {
      parsedDate = new Date();
    }

    // Ghi trực tiếp 14 cột dữ liệu theo đúng cấu trúc tiêu chuẩn
    testSheet.appendRow([
      parsedDate,                              // A: DATE
      payload.supMill || "",                   // B: SUP/MILL
      payload.fabricArticle || "",             // C: FABRIC NAME/TYPE
      payload.color || "",                     // D: ART/COLOR
      Number(payload.warpBefore) || 50,        // E: WARP/ BEFORE WASH
      Number(payload.warpAfter) || 0,          // F: WARP/ AFTER WASH
      Number(payload.weftBefore) || 50,        // G: WEFT/ BEFORE WASH
      Number(payload.weftAfter) || 0,          // H: WEFT/ AFTER WASH
      payload.warpShrinkage || "",             // I: % Shrinkage (WARP)
      payload.weftShrinkage || "",             // J: % Shrinkage (WEFT)
      payload.visualResult || "Pass",          // K: Visual Appearance / Handfeel Result
      payload.shrinkageResult || "Pass",       // L: Shrinkage Result
      payload.finalResult || "Pass",           // M: Final Result
      payload.note || ""                       // N: Note
    ]);

    // Áp dụng định dạng ngày tháng đẹp đẽ cho dòng vừa chèn ở cột A
    var lastRow = testSheet.getLastRow();
    testSheet.getRange(lastRow, 1).setNumberFormat("dd/MM/yyyy");

    return {
      ok: true,
      message: "Đã lưu báo cáo co rút vải thành công vào sheet GID 465977407!"
    };

  } catch (e) {
    return {
      ok: false,
      message: "Lỗi hệ thống Apps Script: " + e.message
    };
  }
}

/**
 * Lấy lịch sử dữ liệu kiểm thử co rút vải từ sheet GID 465977407
 */
function getFabricTestingRows() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
    if (!ss) throw new Error("Không thể kết nối đến Google Spreadsheet.");

    const sheets = ss.getSheets();
    const testSheet = sheets.find(function(s) {
      return s.getSheetId() === 465977407;
    });

    if (!testSheet) {
      throw new Error("Không tìm thấy tab sheet có GID 465977407.");
    }

    const data = testSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { ok: true, rows: [] };
    }

    const rows = [];
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

    return { ok: true, rows: rows.reverse() }; // Trả về mẫu mới nhất lên đầu
  } catch (e) {
    return { ok: false, err: e.message || String(e) };
  }
}

