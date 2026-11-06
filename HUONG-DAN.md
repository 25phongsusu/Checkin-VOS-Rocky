# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG CHECK-IN ROCKY VOS 2026
*(Đã loại bỏ SQL / Neon – Đồng bộ trực tiếp vào Google Sheets)*

---

## 1. ĐÃ SỬA LỖI KHÔNG HIỂN THỊ ẢNH
- **Nguyên nhân trước đó:** Đường dẫn ảnh được ghi ở dạng tuyệt đối `/assets/image-X.png`, khiến trình duyệt khi mở trực tiếp file `index.html` (giao thức `file://`) tìm ảnh tại thư mục gốc ổ đĩa `C:\assets` và báo lỗi không tìm thấy.
- **Cách khắc phục:** Đã chuẩn hóa toàn bộ đường dẫn thành `assets/...` tương đối và bổ sung cơ chế fallback tự động. Giờ đây bạn có thể:
  - Nhấp đúp chuột mở trực tiếp file `index.html` trên máy tính.
  - Hoặc đưa lên Vercel, GitHub Pages, Netlify,... ảnh đều hiển thị sắc nét 100%.

---

## 2. KẾT NỐI VÀ LƯU DỮ LIỆU VÀO GOOGLE SHEETS
Dữ liệu check-in sẽ được ghi trực tiếp vào Google Sheet của bạn:  
👉 **[Mở Google Sheet Rocky VOS](https://docs.google.com/spreadsheets/d/1qmJmkqoiD5aboxQPj_r6CqTSvIBTdP_gXhzZ5iEtu9U/edit?gid=0#gid=0)**

### Các bước cài đặt (chỉ cần làm 1 lần, mất 1 phút):
1. **Mở Google Sheet** theo link trên.
2. Trên thanh menu phía trên, bấm vào **Tiện ích mở rộng** *(Extensions)* ➔ chọn **Apps Script**.
3. Trong giao diện code mở ra, xóa toàn bộ nội dung mặc định và **dán toàn bộ nội dung trong file `google-apps-script.js`** vào.
4. Bấm biểu tượng **Lưu dự án** *(hình đĩa mềm 💾 hoặc Ctrl + S)*.
5. Nhấn nút xanh **Triển khai** *(Deploy)* ở góc trên bên phải ➔ chọn **Triển khai mới** *(New deployment)*.
6. Bấm vào biểu tượng bánh răng ⚙️ bên cạnh "Chọn loại" ➔ chọn **Ứng dụng web** *(Web app)*:
   - **Mô tả:** Rocky Checkin API
   - **Thực thi dưới dạng (Execute as):** Tôi (*Me - tài khoản Google của bạn*)
   - **Ai có quyền truy cập (Who has access):** **Bất kỳ ai** *(Anyone)* ⚠️ *(Rất quan trọng để form gửi được dữ liệu)*.
7. Nhấn nút **Triển khai** *(Deploy)*:
   - Nếu Google hiện thông báo yêu cầu cấp quyền, bấm **Ủy quyền truy cập** *(Authorize access)* ➔ chọn tài khoản Google của bạn ➔ bấm **Nâng cao** *(Advanced)* ➔ chọn **Đi tới (Không an toàn)** ➔ bấm **Cho phép** *(Allow)*.
8. Sau khi triển khai xong, copy dòng **URL ứng dụng web** *(Web app URL, có dạng `https://script.google.com/macros/s/.../exec`)*.

---

## 3. KÍCH HOẠT KẾT NỐI TRÊN GIAO DIỆN WEB

### Cách 1: Sử dụng trực tiếp trên máy tính / Landing page
1. Mở file `index.html` trên trình duyệt.
2. Thêm `#admin` vào cuối thanh địa chỉ (ví dụ: `index.html#admin` hoặc `https://domain/admin`).
3. Nhập mã truy cập nội bộ: `1234` và bấm **Mở bảng theo dõi**.
4. Tại mục **Cấu hình Google Sheet**, dán link Web App vừa copy ở Bước 2 vào ô và bấm **Lưu kết nối Google Sheet**.
5. Bấm quay lại trang khách và đăng ký thử: dữ liệu sẽ xuất hiện ngay lập tức trên file Google Sheet!

### Cách 2: Triển khai trên Vercel (nếu muốn có tên miền online)
1. Đẩy code lên GitHub (không còn cần database hay SQL nào).
2. Vào Vercel ➔ Import repository.
3. Thêm Environment Variable:
   - `GOOGLE_SCRIPT_URL`: Dán link Web App từ Apps Script ở Bước 2.
   - `ADMIN_PIN`: Mã bí mật trang quản lý (ví dụ: `1234`).
4. Bấm **Deploy**.

---

## 4. QUY TRÌNH HOẠT ĐỘNG TẠI BOOTH
1. **Khách quét mã QR / mở link:** Điền Họ tên + Số điện thoại (tùy chọn nhận tư vấn).
2. **Chống nhận trùng:** Hệ thống tự động kiểm tra cột C trong Google Sheet. Nếu số điện thoại đã tồn tại, form báo ngay: *"Số điện thoại này đã đăng ký. Vui lòng đến gặp nhân sự tại booth để nhận quà"*.
3. **Hiển thị mã vé:** Đăng ký thành công sẽ hiện mã vé `RK-XXXXXX` cùng nút mở Fanpage để like.
4. **Nhân sự trao quà:**
   - Nhân sự có thể mở trực tiếp Google Sheets trên điện thoại để xem dữ liệu nhảy vào theo thời gian thực.
   - Kiểm tra màn hình like Facebook của khách và ghi nhận trực tiếp trên sheet (hoặc dùng giao diện `/admin`).

---

## 5. DANH SÁCH FILE HIỆN TẠI
- `index.html`: Giao diện khách đăng ký và trang quản lý booth.
- `assets/`: 4 file ảnh đồ họa (logo Rocky, móc khóa Rocko, ly nước quà tặng).
- `google-apps-script.js`: Mã nguồn Apps Script gắn vào Google Sheet.
- `api/handler.js` & `lib/worker.js`: Cầu nối API (không còn SQL/Neon).
- `test.mjs`: Bộ kiểm tra tự động hệ thống.
