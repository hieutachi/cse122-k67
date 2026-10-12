# QA nội dung tự học phần cuối CSE122

## Phạm vi và nguồn đối chiếu

Đối chiếu chuyên đề với Chương 7–9 trong bản đề cương Markdown đã chỉnh sửa
và các bài đọc async/API/dự án hiện có. Đây là đề xuất học liệu, không xác nhận
sinh viên đã học tới tuần nào và không thay thế quy định đánh giá của giảng viên.
Số chương của ebook cũ khác số chương trong đề cương; link ôn tập trỏ theo tên
kiến thức, không suy từ số chương. Ebook Chương 8 hiện chứa JS nền tảng và DOM.

## Vấn đề phát hiện và chỉnh sửa

| Vấn đề | Điều chỉnh | Minh chứng sinh viên cần làm được |
| --- | --- | --- |
| Sơ đồ ASCII khó đọc trên điện thoại | Thay bảy sơ đồ cơ chế bằng thẻ HTML/CSS, thêm so sánh chờ nối tiếp/đồng thời, pipeline tìm/lọc và cây component | Đọc thứ tự theo số và phân biệt nhánh kết quả, không dựa riêng vào màu |
| Thuật ngữ xuất hiện nhanh | Từ điển render/state/schema/payload/guard/persist/props | Nói lại bằng lời thường và chỉ ra dữ liệu cụ thể |
| Code có kết quả nhưng thiếu cách trace | 12 khối hướng dẫn đọc code/quan sát demo, cộng 2 bài thực hành có kỳ vọng | Nêu đầu vào, thao tác, kết quả và việc chưa xảy ra |
| Tìm/lọc/phân trang chưa thành bài | Demo GET thật rồi filter/slice tại client; giải thích server-side contract | Giữ 6 phần tử gốc, lọc còn 2, reset page, empty đúng nghĩa |
| Tư duy component còn sơ lược | Cây component, props/state/event, demo lựa chọn dùng chung, routing và khảo sát React/Vue/Angular | Card và summary đọc cùng lựa chọn; phân biệt routing với lưu dữ liệu/quyền |
| Nguy cơ nhầm đã có framework/backend | Ghi rõ demo JS thuần, localStorage, GET tĩnh; JSX chỉ ở dự án React có tooling | Không tìm POST không tồn tại, không dán JSX vào Console |
| Thiếu tự kiểm nội dung mới | Thêm sáu câu có giải thích; tổng 21 câu, 17 mục tiến độ | Trả lời về total, page, shared state và giới hạn framework |
| Link/thuật ngữ dễ gây nhầm | Ôn đúng ebook JS/DOM; thống nhất cancelled với mã nguồn; tránh hứa “toàn bộ” không có ranh giới | Đối chiếu theo nội dung và giải thích giới hạn frontend |

## Phân tầng học

- Lõi buổi 1: callback → stack/task/microtask → Promise → async/await.
- Lõi buổi 2: resource/HTTP/JSON → UI states → Fetch → tìm/lọc/phân trang → xử lý lỗi.
- Lõi buổi 3: đặc tả → form/dashboard → component/luồng dữ liệu → test/deploy.
- Đào sâu: thenable/resolved, Promise.any, idempotency và ví dụ JSX.
- Nếu phải thực hiện chuyển framework theo đề cương: làm trong dự án/nhánh
  riêng, chọn công cụ theo yêu cầu giảng viên và kiểm thử vùng đã chuyển.
  Demo JS thuần và đoạn JSX đọc hiểu không thay thế bài thực hành chuyển framework.

## Những giới hạn phải giữ nguyên

- Doctor GET dùng HTTP thật tới fixture cùng origin. File tĩnh không tự hiểu query tìm kiếm/phân trang.
- Lịch hẹn và các cập nhật dashboard chỉ lưu trên trình duyệt/origin hiện tại.
- Không có backend, xác thực admin, kiểm tra giờ trống hay đồng bộ nhiều người.
- Thời gian chờ mô phỏng không phải số đo mạng. Component demo không gọi HTTP hoặc lưu storage.
- Chỉ dùng tên/số điện thoại giả. Không đặt secret trong JS/frontend.
- Kiểm thử tự động xác nhận cấu trúc và hành vi, không chứng minh tất cả sinh viên đã hiểu bài.

## Kiểm chứng

Chạy từ thư mục repository:

```text
python -m unittest discover -s tests -v
node --check demo/tu-hoc-api/course.js
node --check demo/tu-hoc-api/project.js
node --check tests/api_browser_checks.cjs
node --test tests/test_runtime.cjs
node tests/browser_smoke.cjs
git diff --check
```

Browser harness dùng Chromium thật qua HTTP dưới đường dẫn con, kiểm tra các
demo cũ và mới, keyboard/focus, schema/HTTP failure, retry, booking/dashboard,
desktop và các viewport tablet/mobile. Kết quả lần chạy mới nhất và ngày chạy
nằm ở `.preview/browser-results.json`; không lấy số lần chạy cũ làm kết luận
cho mã vừa chỉnh. Ảnh mới gồm `desktop-api-search`, `desktop-api-components`
và các ảnh `mobile-api-*`/`tablet-api-*` cho Event Loop, Promise, tìm kiếm, component.

Các bảng và code dài cuộn trong vùng riêng; sơ đồ giải thích mới không cần
cuộn ngang. Cần đọc ảnh ở chính các mục giảng dạy, không chỉ ảnh hero trang chủ.

Chưa commit, push hoặc deploy trong lượt QA này.

### Kết quả đã kiểm chứng ngày 12/10/2026

- Python: 18/18 tests đạt, exit code 0.
- JavaScript runtime: 5/5 tests đạt, exit code 0; các syntax checks đạt.
- Chrome 154: 302 assertions đạt; lần chạy cuối kết thúc
  `2026-10-12T03:53:50.241Z`, exit code 0.
- Viewport: desktop 1440×1000, tablet 768×844, mobile 390×844 và 320×844.
- Không có uncaught JavaScript exception trong lượt chạy đạt; các kiểm tra
  overflow trang và thẻ sơ đồ đều đạt ở các viewport được kiểm tra.
- Đã đọc ảnh desktop của nội dung mới và ảnh mobile ở chính sơ đồ Event Loop,
  Promise, tìm kiếm và demo component; không chỉ xem hero.
- `git diff --check` đạt; homepage generator giữ entry chuyên đề và workflow
  stage thư mục demo trong artifact Pages.

Trong quá trình mở rộng tests đã sửa lỗi dấu nháy của biểu thức CDP và số mục
tiến độ cũ 15 → 17. Có một lượt kiểm thử lại bị timeout khi điều hướng; lần
chạy kế tiếp hoàn tất toàn bộ. Không dùng báo cáo PASS cũ để che lượt thất bại.

Nội dung hiện có 17 mục tự kiểm, 9 demo, 10 sơ đồ dạng thẻ và 21 câu hỏi có
giải thích. Phần đào sâu và bài chuyển framework nên bố trí tự học/thực hành
riêng nếu 150 phút trên lớp không đủ; thời lượng lộ trình chỉ là gợi ý.