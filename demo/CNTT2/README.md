# CampusConnect

Landing page tiếng Việt bằng **HTML, CSS, JavaScript thuần**. Không cần cài thư viện, không dùng CDN, font hay ảnh từ bên ngoài.

## Chạy trang

Mở `C:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\ViDU\CNTT2\index.html` bằng Chrome, Edge hoặc Firefox hiện đại.

Có thể dùng Live Server trong VS Code. Hoặc chạy PowerShell:

```powershell
python -m http.server 5500 --bind 127.0.0.1 --directory "C:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\ViDU\CNTT2"
```

Sau đó mở http://127.0.0.1:5500. Nhấn `Ctrl+C` để dừng server.

## Tính năng

- Giao diện responsive, menu di động, điều hướng bằng bàn phím.
- Cuộn mượt, hiệu ứng xuất hiện khi cuộn, hover và các thẻ nổi.
- Tôn trọng tùy chọn **Reduce motion** của hệ điều hành.
- Bộ lọc sự kiện: tất cả, học tập, kết nối.
- Chọn một sự kiện để đưa tên sự kiện vào form; có thể bỏ chọn.
- Form họ tên, email, trường học; kiểm tra dữ liệu, hiển thị lỗi và trạng thái hoàn tất demo.
- Không lưu dữ liệu vào cookie/localStorage và không gửi dữ liệu lên máy chủ.

## Chỉnh sửa

- Nội dung: `C:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\ViDU\CNTT2\index.html`.
- Màu sắc, bố cục, hiệu ứng: `C:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\ViDU\CNTT2\style.css`. Các màu chính nằm trong `:root`.
- Tương tác và form: `C:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\ViDU\CNTT2\script.js`.
- Minh họa SVG: `C:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\ViDU\CNTT2\assets\campus.svg`.
- Favicon: `C:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\ViDU\CNTT2\assets\favicon.svg`.

## Giới hạn bản demo

Các sự kiện là nội dung minh họa, không phải lịch sự kiện thật. Form chỉ kiểm tra dữ liệu và hiển thị kết quả trên trình duyệt; **không tạo tài khoản, không đăng ký sự kiện thật và không gửi email**. Cần backend và kiểm tra dữ liệu phía máy chủ để triển khai đăng ký thực tế.

Nếu JavaScript bị tắt, nội dung và liên kết vẫn xem được; bộ lọc không hoạt động, nút gửi form được vô hiệu hóa để tránh gửi dữ liệu qua URL.