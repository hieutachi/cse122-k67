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
node --check demo/tu-hoc-api/spa.js
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

### Báo cáo trước SPA ngày 12/10/2026

Các số liệu dưới đây được ghi ở lượt trước; không dùng chúng để kết luận
về bản SPA. Lượt tiếp tục chỉ kiểm chứng độc lập mã và kết quả local mới.

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

## Tích hợp SPA local

- JavaScript thuần, hash routing, không thêm dependency hoặc yêu cầu server rewrite.
- 23 màn hình bài đọc/thực hành; vẫn có 17 mục đánh dấu tự kiểm.
- Chọn bài, Bài trước/Bài tiếp, mục lục active, tiêu đề trang và live status.
- Hash tới lab/sơ đồ mở đúng bài cha; Back/Forward không tải lại trang.
- Hash lạ hoặc encode lỗi trở về lộ trình. Skip link vẫn đưa focus tới main
  mà không đổi bài đang đọc.
- Không tháo các panel khỏi DOM: demo và iframe phòng khám giữ state khi chuyển bài.
- Phòng khám có route `#practice` riêng; `project.html` vẫn mở độc lập được.
- Mobile thu gọn mục lục, in/PDF hiện toàn bộ bài, tắt JavaScript vẫn đọc được.
- Tests tương tác mở đúng bài trước khi thao tác; kiểm tra thực tế cả click mục lục,
  Enter, focus, tiến độ, lưu state, print media và tắt script execution.
- Workflow chỉ được bổ sung syntax check SPA; không chạy deploy trong lượt này.

Kết quả mới và exit code được lưu local trong `.preview/browser-results.json`,
`.preview/qa-detail.exit.json` và `.preview/spa-qa.stdout.log` /
`.preview/spa-qa.stderr.log`. Các lượt browser chạy nối tiếp, không chồng nhau.

### Kết quả SPA được kiểm chứng độc lập ngày 12/10/2026

- Python: 19/19 tests đạt, exit code 0.
- JavaScript runtime: 5/5 tests đạt, exit code 0.
- Syntax checks: course.js, project.js, spa.js và hai browser test files đạt.
- Chrome 154: 395 assertions đạt; hoàn tất `2026-10-12T04:57:24.424Z`,
  wrapper exit code 0. Không có uncaught JavaScript exception.
- Viewport: 1440×1000, 768×844, 390×844, 320×844; toàn bộ 23 panel được
  kiểm tra overflow ở ba viewport tablet/mobile.
- Kiểm tra riêng: initial/nested/invalid/malformed hash, Back/Forward, picker,
  boundary buttons, mobile TOC, focus/skip link, retained demo/iframe state,
  persisted progress, print media và no-JavaScript fallback.
- Có một lượt QA thất bại khi kiểm tra nhãn picker bị sticky header che ở 390px.
  Đã sửa cuộn theo chiều cao header thực tế; lượt cuối xác nhận nhãn hiện đầy đủ
  ở 768, 390 và 320px. Không dùng báo cáo PASS cũ để thay cho lượt thất bại.
- `git diff --check` đạt. Chưa commit, push hoặc deploy SPA.

## Learning Studio — tiếp tục ngày 12/10/2026

- Banner navy–teal, nhãn nhóm/vị trí bài, mục lục có trạng thái hoàn thành,
  thanh tiến độ native có accessible name và giao diện phòng khám đồng bộ.
- Sơ đồ tuần tự dùng một cột và đường nối theo đúng thứ tự số ở mọi viewport;
  các kết quả Promise/UI vẫn là nhánh, không diễn đạt thành chuỗi thao tác.
- Chuyển bài, reveal sơ đồ và nhấn mạnh đầu ra demo dùng progressive enhancement.
  Nội dung không bị ẩn để chờ animation; reduced motion tắt cả CSS và Web Animations.
- Cập nhật đầu ra dùng viền sáng thay vì nền sáng trên log có chữ sáng.
- CSS cache version được đồng bộ giữa bài học và phòng khám; print giữ tương phản code.
- Browser checks bổ sung banner, số demo, metadata, progress/accessible completion,
  reduced motion, thứ tự sơ đồ và print contrast. Screenshot chờ animation ổn định.
- Harness hỗ trợ `CSE122_BASE_URL` để chạy cùng bộ tương tác trên site đã publish.
  Không sửa dữ liệu repo hay server; localStorage của bài test thuộc profile tạm.

Kết quả đã quan sát ở lượt tiếp tục: Python 19/19, runtime 5/5; Chrome 154
đạt 400 assertions, exit code 0 lúc `2026-10-12T07:13:00.315Z`.
Lượt đầu thất bại do escape nháy trong biểu thức test CDP mới, không phải lỗi ứng dụng;
đã sửa test và chạy lại toàn bộ. Hai assertions print/order và thời gian chờ ảnh
được bổ sung sau đó; phải dùng kết quả lượt cuối và workflow cho trạng thái deploy.

Lượt release cuối đạt **403 assertions**, Chrome 154, exit code 0 lúc
`2026-10-12T07:17:22.559Z`, trên 1440×1000, 768×844, 390×844 và 320×844.
Đã xem ảnh desktop studio/Promise/phòng khám và mobile studio/Event Loop/Promise/
phòng khám. Nhánh Promise xếp dọc bỏ đường nối để tránh đọc thành chuỗi;
assertion mới xác nhận điều này. Syntax checks và `git diff --check` đều đạt.

Lệnh kiểm tra bản đã publish (từ repository, PowerShell):

```powershell
$env:CSE122_BASE_URL = 'https://hieutachi.github.io/cse122-k67/'
node tests/browser_smoke.cjs
```