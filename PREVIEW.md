# Đợt 1 — kiểm tra bản phát hành Chương 1–5

Ngày kiểm tra: 21/09/2026. Bản preview đã được duyệt; người dùng yêu cầu hoàn thiện
5 chương đầu và commit/deploy. Phát hành từ `preview/learning-phase-1` tới `main`.

Chương 1–5 được bổ sung mục tiêu, kiến thức trọng tâm, thực hành theo bước,
thời gian gợi ý và tiêu chí tự kiểm tra; nguồn nằm trong `data/learning_guides.json`.
Giữ các cải thiện chung trên cả 9 chương và không thay đổi khóa tiến độ cũ.

## Xem thử

Trang công khai: https://hieutachi.github.io/cse122-k67/

Muốn xem cục bộ, chạy server theo README rồi mở **http://127.0.0.1:8122/**.
Không mặc định rằng server đang chạy.

1. Mở Chương 1–5 để xem lộ trình 4 bước, lý thuyết trọng tâm và thực hành có hướng dẫn.
2. Chọn **Tự kiểm tra**, trả lời một câu sai: thẻ HTML phải hiện như chữ;
   có đáp án đúng, giải thích và liên kết đọc lại. Hoàn thành rồi chọn **Làm lại**.
3. Mở một bài giảng, quay lại trang chủ hoặc danh sách: **Tiếp tục học** phải
   dẫn về bài vừa mở. Mở chương khác để kiểm tra trạng thái cập nhật.
4. Trong bài đọc, mục lục nằm trước nội dung; trên màn hình nhỏ có thể bung/gấp.
5. Mở slide, dùng ←/→, PageUp/PageDown, Tab/Shift+Tab và Escape. Mở lại slide
   rồi thử tiếp: phím vẫn hoạt động và tiêu điểm quay về ảnh khi đóng.
6. Thử liên kết **Bài 1–44**: bảng phải cuộn tới đúng dòng, dòng đích được tô nổi.

Localhost là origin riêng nên không nhìn thấy tiến độ đã lưu trên GitHub Pages.
Kiểm thử dùng hồ sơ Chrome tạm, không sửa dữ liệu trình duyệt cá nhân.

## Đã xác minh

- Test Python trong repository: generator, quiz, liên kết/anchor, mục lục,
  hướng dẫn Chương 1–5, điều hướng bài trước/sau và thứ tự/độ phủ 163 ảnh.
- 5 test Node: đảo đáp án, học tiếp, chuyển đổi khóa cũ, dữ liệu lưu trữ lỗi.
- 5 test generator cũ ở workspace vẫn qua, giữ tương thích tên `3;11.jpg`, `7,3.jpg`.
- 147 kiểm tra Chrome headless thật ở 1440×1000, 390×844, 320×844:
  điểm đúng/sai cả 9 chương, chống diễn giải HTML trong quiz, retry khi lỗi HTTP,
  bàn phím, lightbox mở lại, reduced motion, học tiếp và giữ đánh dấu đã học cũ;
  đủ 5 chương đầu không tràn trang và liên kết thực hành dùng được trên mobile.
- 64 nội dung bài đọc không đổi; 78 trang được sinh lại cho kết quả giống hệt
  khi chạy generator lần nữa.
- `git diff --check` và kiểm tra cú pháp JavaScript/Python không báo lỗi.

Ảnh chụp và báo cáo máy nằm trong thư mục `.preview` của repository, được Git bỏ qua
và không đưa vào artifact Pages. Workflow chỉ đóng gói tài nguyên/trang công khai.
Các lệnh kiểm thử, dựng lại trang và khởi động máy chủ có trong README.

## Giới hạn / chưa thực hiện

- Chưa kiểm thử trên điện thoại vật lý, Safari/Firefox hay trình đọc màn hình.
- Workflow kiểm tra Python, Node và Chrome trước khi deploy. Trạng thái triển khai
  thực tế xem tại https://github.com/hieutachi/cse122-k67/actions.
- Chưa làm tìm kiếm toàn văn, đồng bộ tiến độ, sandbox, ghi chú hay offline.
- Generator hiện được lưu cùng repository; nguồn Markdown upstream và demo gốc
  vẫn ở ngoài repository. Thư mục `cse122-site` cũ không phải bản preview lần này.
- Chương 6–9 giữ cải thiện chung; hướng dẫn tự học chi tiết mới bổ sung cho 1–5.

Việc công bố đã được người dùng phê duyệt. Kết quả triển khai được xác nhận riêng
bằng GitHub Actions và kiểm tra HTTP trang công khai, không suy ra từ kiểm thử local.