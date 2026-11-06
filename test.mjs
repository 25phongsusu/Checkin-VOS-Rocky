import fs from 'node:fs';
import assert from 'node:assert/strict';
import worker from './lib/worker.js';

console.log('--- KIỂM TRA HỆ THỐNG ROCKY CHECK-IN ---');

// 1. Kiểm tra các file ảnh trong assets/
const requiredImages = ['image-1.png', 'image-2.png', 'image-3.png', 'image-4.png'];
for (const img of requiredImages) {
  assert.ok(fs.existsSync('assets/' + img), `Thiếu file ảnh assets/${img}`);
  const stat = fs.statSync('assets/' + img);
  assert.ok(stat.size > 1000, `Ảnh assets/${img} có kích thước bất thường`);
}
console.log('✓ Tất cả 4 file ảnh trong assets/ hợp lệ.');

// 2. Kiểm tra đường dẫn ảnh trong index.html không bị dấu gạch chéo đầu (gây lỗi file://)
const html = fs.readFileSync('index.html', 'utf8');
assert.ok(!html.includes('"/assets/'), 'index.html vẫn còn đường dẫn tuyệt đối "/assets/"');
assert.ok(!html.includes("'/assets/"), 'index.html vẫn còn đường dẫn tuyệt đối \'/assets/\'');
assert.ok(html.includes('assets/image-2.png'), 'index.html thiếu logo Rocky');
assert.ok(html.includes('assets/image-3.png'), 'index.html thiếu móc khóa Rocko');
assert.ok(html.includes('assets/image-4.png'), 'index.html thiếu ly nước Rocky');
console.log('✓ Đường dẫn ảnh trong index.html đã được sửa chuẩn tương đối.');

// 3. Kiểm tra validation số điện thoại và họ tên trong worker
async function callRegister(body, env = {}) {
  const req = new Request('https://test.local/api/register', {
    method: 'POST',
    headers: { 'Origin': 'https://test.local', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const res = await worker.fetch(req, env);
  return [res.status, await res.json()];
}

// Tên quá ngắn
const [s1, r1] = await callRegister({ name: 'A', phone: '0901234567' });
assert.equal(s1, 400);

// Số điện thoại không đúng chuẩn VN 10 số
const [s2, r2] = await callRegister({ name: 'Nguyễn Văn A', phone: '12345' });
assert.equal(s2, 400);

// Đăng ký hợp lệ khi chưa có GOOGLE_SCRIPT_URL
const [s3, r3] = await callRegister({ name: 'Nguyễn Văn A', phone: '0901234567' });
assert.equal(s3, 503);
assert.ok(r3.error.includes('GOOGLE_SCRIPT_URL'));

console.log('✓ Logic kiểm tra họ tên, số điện thoại hoạt động chuẩn xác.');

// 4. Kiểm tra mã Apps Script tồn tại
assert.ok(fs.existsSync('google-apps-script.js'), 'Thiếu file google-apps-script.js');
const scriptContent = fs.readFileSync('google-apps-script.js', 'utf8');
assert.ok(scriptContent.includes('1qmJmkqoiD5aboxQPj_r6CqTSvIBTdP_gXhzZ5iEtu9U'), 'Thiếu ID Google Sheet trong script');
assert.ok(scriptContent.includes('doPost'), 'Thiếu hàm doPost trong google-apps-script.js');
assert.ok(scriptContent.includes('doGet'), 'Thiếu hàm doGet trong google-apps-script.js');
console.log('✓ File google-apps-script.js đã sẵn sàng.');

console.log('TẤT CẢ KIỂM TRA ĐÃ VƯỢT QUA!');
