/**
 * ROCKY VOS 2026 - GOOGLE APPS SCRIPT WEBHOOK
 * Đồng bộ trực tiếp form check-in vào Google Sheet:
 * https://docs.google.com/spreadsheets/d/1qmJmkqoiD5aboxQPj_r6CqTSvIBTdP_gXhzZ5iEtu9U/edit?gid=0#gid=0
 */

const SHEET_ID = '1qmJmkqoiD5aboxQPj_r6CqTSvIBTdP_gXhzZ5iEtu9U';

function getTargetSheet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    return ss.getSheetByName('Trang tính1') || ss.getSheets()[0];
  } catch (err) {
    return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }
}

/**
 * Hàm kiểm tra kết nối nhanh
 */
function testRun() {
  const sheet = getTargetSheet();
  Logger.log("Kết nối thành công tới Sheet: " + sheet.getName());
}

function doGet(e) {
  const p = e ? e.parameter : {};
  if (p && p.action === 'records') {
    return handleRecords();
  }
  if (p && p.action === 'config') {
    const fanpage = PropertiesService.getScriptProperties().getProperty('fanpage') || 'https://www.facebook.com/rockylensvietnam';
    return jsonResponse({ fanpage: fanpage });
  }
  return jsonResponse({
    status: 'ok',
    message: 'Rocky VOS Check-in API đang hoạt động!',
    sheet_id: SHEET_ID
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return jsonResponse({ error: 'Hệ thống đang bận xử lý, vui lòng nhấn thử lại sau 3 giây.' }, 503);
  }

  try {
    const sheet = getTargetSheet();
    
    // Parse dữ liệu từ body JSON hoặc query params
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const action = data.action || 'register';

    // 1. ACTION: ĐĂNG KÝ CHECK-IN (register)
    if (action === 'register') {
      const name = String(data.name || '').trim().replace(/\s+/g, ' ');
      let rawPhone = String(data.phone || '').trim().replace(/[\s().-]/g, '').replace(/^\+84/, '0').replace(/^84(?=\d{9}$)/, '0');

      if (!name || name.length < 2) {
        return jsonResponse({ error: 'Vui lòng nhập họ tên hợp lệ (từ 2 ký tự).' }, 400);
      }
      if (!/^0[35789]\d{8}$/.test(rawPhone)) {
        return jsonResponse({ error: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09).' }, 400);
      }

      // Kiểm tra trùng lặp số điện thoại trong Cột C (Số điện thoại) - TỐI ƯU TỐC ĐỘ ĐỌC 1 CỘT
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const phoneValues = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
        for (let i = 0; i < phoneValues.length; i++) {
          const existingPhone = String(phoneValues[i][0] || '').trim().replace(/[\s().-]/g, '').replace(/^'/, '').replace(/^\+84/, '0').replace(/^84(?=\d{9}$)/, '0');
          if (existingPhone === rawPhone) {
            return jsonResponse({
              error: 'Số điện thoại này đã đăng ký. Vui lòng đến nhân sự tại booth để kiểm tra và nhận quà; không cần gửi lại form.'
            }, 409);
          }
        }
      }

      // Tạo mã nhận quà
      const code = 'RK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
      const consentText = (data.consent === true || data.consent === 'true' || data.consent === 'Có' || data.consent === 1) ? 'Có' : 'Không';

      // Ghi hàng mới vào Sheet:
      // Cột A: Thời gian đăng ký
      // Cột B: Họ tên
      // Cột C: Số điện thoại
      // Cột D: Đồng ý nhận tư vấn
      // Cột E: Đã kiểm tra like
      // Cột F: Loại quà
      // Cột G: Nhân sự xác nhận
      sheet.appendRow([now, name, "'" + rawPhone, consentText, '', '', '']);

      return jsonResponse({
        success: true,
        code: code,
        name: name,
        phone: rawPhone,
        created_at: now
      }, 201);
    }

    // 2. ACTION: XÁC NHẬN PHÁT QUÀ (claim)
    if (action === 'claim') {
      const rowId = parseInt(data.id, 10);
      const gift = String(data.gift || '').trim();
      const staff = String(data.staff || '').trim();
      const liked = (data.liked === true || data.liked === 'true' || data.liked === 1) ? 'Đã like' : 'Chưa';

      if (!rowId || rowId < 2) {
        return jsonResponse({ error: 'Không tìm thấy dòng thông tin cần cập nhật.' }, 400);
      }
      if (!gift) {
        return jsonResponse({ error: 'Vui lòng chọn loại quà.' }, 400);
      }
      if (!staff) {
        return jsonResponse({ error: 'Vui lòng nhập tên nhân sự xác nhận.' }, 400);
      }

      sheet.getRange(rowId, 5).setValue(liked); // Cột E: Đã kiểm tra like
      sheet.getRange(rowId, 6).setValue(gift);  // Cột F: Loại quà
      sheet.getRange(rowId, 7).setValue(staff); // Cột G: Nhân sự xác nhận

      return jsonResponse({ success: true, message: 'Đã xác nhận phát quà thành công!' });
    }

    // 3. ACTION: CẤU HÌNH FANPAGE (config)
    if (action === 'config') {
      if (data.fanpage) {
        PropertiesService.getScriptProperties().setProperty('fanpage', String(data.fanpage).trim());
        return jsonResponse({ success: true, fanpage: data.fanpage });
      }
      const fanpage = PropertiesService.getScriptProperties().getProperty('fanpage') || 'https://www.facebook.com/rockylensvietnam';
      return jsonResponse({ fanpage: fanpage });
    }

    // 4. ACTION: LẤY DANH SÁCH (records)
    if (action === 'records') {
      return handleRecords();
    }

    return jsonResponse({ error: 'Hành động không hợp lệ: ' + action }, 400);

  } catch (err) {
    return jsonResponse({ error: 'Lỗi xử lý bảng tính: ' + err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function handleRecords() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonResponse([]);
  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const records = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[1] && !row[2]) continue; // Bỏ qua hàng trống
    const phoneClean = String(row[2] || '').trim().replace(/^'/, '');
    const isClaimed = !!(row[5] && String(row[5]).trim() !== '');
    records.push({
      id: i + 2, // Vị trí hàng thực tế trong sheet (bắt đầu từ hàng 2)
      created_at: row[0],
      name: row[1],
      phone: phoneClean,
      consent: (row[3] === 'Có' || row[3] === true || row[3] === 1) ? 1 : 0,
      liked: (row[4] === 'Đã like' || row[4] === 'Có' || row[4] === 1) ? 1 : 0,
      claimed: isClaimed ? 1 : 0,
      gift: row[5] || '',
      claimed_at: isClaimed ? row[0] : null,
      staff: row[6] || ''
    });
  }

  return jsonResponse(records);
}

function jsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
