'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const log = (id, text) => { $(id).textContent += '\n' + text; };
  const wait = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Đã hủy', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Đã hủy', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
  const storageKey = 'cse122-api-reading-v1';
  const checks = [...document.querySelectorAll('[data-complete]')];
  let completed = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) completed = saved.filter(id => checks.some(c => c.dataset.complete === id));
  } catch { /* Progress is optional; the reading remains usable. */ }
  const progressMeter = document.createElement('progress');
  progressMeter.className = 'course-progress-meter';
  progressMeter.max = checks.length;
  progressMeter.setAttribute('aria-label', 'Tiến độ tự kiểm bài học');
  $('course-progress').after(progressMeter);
  const updateProgress = suffix => {
    const count = checks.filter(c => c.checked).length;
    $('course-progress').textContent = `${count} / ${checks.length} mục đã tự kiểm${suffix || ''}`;
    progressMeter.value = count;
    checks.forEach(check => {
      const link = document.querySelector(`.course-toc a[href="#${check.dataset.complete}"]`);
      if (!link) return;
      link.classList.toggle('is-complete', check.checked);
      if (check.checked) link.setAttribute('aria-label', link.textContent + ' · Đã tự kiểm');
      else link.removeAttribute('aria-label');
    });
  };
  checks.forEach(c => {
    c.checked = completed.includes(c.dataset.complete);
    c.addEventListener('change', () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(checks.filter(x => x.checked).map(x => x.dataset.complete)));
        updateProgress();
      } catch { updateProgress(' · Không lưu được, chỉ giữ trong phiên này.'); }
    });
  });
  updateProgress();
  $('print-course').addEventListener('click', () => window.print());

  let webTimer;
  $('web-run').addEventListener('click', () => {
    clearTimeout(webTimer);
    $('web-board').textContent = 'Biển thông báo: đã nhận yêu cầu';
    $('web-log').textContent = '1. Handler bắt đầu\n2. DOM đã đổi\n3. Đăng ký timer; handler kết thúc';
    webTimer = setTimeout(() => {
      $('web-board').textContent = 'Biển thông báo: đến giờ nhắc!';
      log('web-log', '4. Timer callback chạy khi JS có thể xử lý.');
    }, 1000);
  });
  $('web-cancel').addEventListener('click', () => { clearTimeout(webTimer); log('web-log', 'Đã hủy timer còn chờ (không đảo ngược callback đã chạy).'); });

  const loopStates = [
    ['script → console.log(A)', '[]', '[]', 'A: bắt đầu', 'Task script bắt đầu, A chạy đồng bộ.'],
    ['script → setTimeout', '[]', '[B: timer đủ điều kiện]', 'A: bắt đầu', 'Timer được hẹn; mô hình giả sử timer đã đủ điều kiện nhưng vẫn chờ script kết thúc.'],
    ['script → Promise.resolve().then', '[C: then]', '[B: timer]', 'A: bắt đầu', 'Promise đã fulfilled, then xếp microtask chứ không gọi ngay.'],
    ['script → console.log(D)', '[C: then]', '[B: timer]', 'A: bắt đầu\nD: kết thúc script', 'D chạy ngay; sau đó script trả quyền điều khiển.'],
    ['C: Promise.then', '[]', '[B: timer]', 'A: bắt đầu\nD: kết thúc script\nC: Promise.then', 'Stack script đã rỗng, checkpoint xử lý microtask C.'],
    ['B: timer callback', '[]', '[]', 'A: bắt đầu\nD: kết thúc script\nC: Promise.then\nB: timer 0ms', 'Sau microtask, task timer có thể được xử lý.'],
    ['(rỗng)', '[]', '[]', 'A: bắt đầu\nD: kết thúc script\nC: Promise.then\nB: timer 0ms', 'Hoàn tất mô hình. Bấm lại để xem từ đầu.']
  ];
  let loopIndex = 0, loopTimer;
  const loopButtons = disabled => { $('loop-step').disabled = disabled; $('loop-real').disabled = disabled; };
  $('loop-step').addEventListener('click', () => {
    const [stack, micro, task, output, explanation] = loopStates[loopIndex];
    $('loop-stack').textContent = stack; $('loop-micro').textContent = micro; $('loop-task').textContent = task;
    $('loop-log').textContent = output; $('loop-explain').textContent = explanation;
    loopIndex = (loopIndex + 1) % loopStates.length;
  });
  $('loop-real').addEventListener('click', () => {
    loopButtons(true);
    $('loop-stack').textContent = 'Không quan sát nội bộ'; $('loop-micro').textContent = 'Xem mô hình riêng'; $('loop-task').textContent = 'Xem mô hình riêng';
    $('loop-explain').textContent = 'Đây là thứ tự thật từ console.log/timer/Promise của trình duyệt; các ô trên không phải stack thực.';
    $('loop-log').textContent = 'A: bắt đầu';
    loopTimer = setTimeout(() => { log('loop-log', 'B: timer 0ms'); loopButtons(false); }, 0);
    Promise.resolve().then(() => log('loop-log', 'C: Promise.then'));
    log('loop-log', 'D: kết thúc script');
  });
  $('loop-reset').addEventListener('click', () => {
    clearTimeout(loopTimer); loopIndex = 0; loopButtons(false);
    $('loop-stack').textContent = 'Chưa bắt đầu'; $('loop-micro').textContent = '[]'; $('loop-task').textContent = '[]';
    $('loop-log').textContent = 'Đoán trước: A → ? → ? → ?'; $('loop-explain').textContent = 'Bấm “Đi từng bước” để xem từng thay đổi.';
  });

  $('promise-run').addEventListener('click', () => {
    const fail = $('promise-result').value === 'error';
    const ms = Number($('promise-delay').value);
    $('promise-run').disabled = true; $('promise-state').textContent = 'pending · đang chờ';
    $('promise-log').textContent = '1. Chuẩn bị new Promise';
    new Promise((resolve, reject) => {
      log('promise-log', '2. Executor chạy ngay, đăng ký timer');
      setTimeout(() => {
        if (fail) { $('promise-state').textContent = 'rejected · hết nguyên liệu'; reject(new Error('Hết hạt cà phê')); }
        else { $('promise-state').textContent = 'fulfilled · đã có Latte'; resolve({ so: 17, mon: 'Latte' }); }
      }, ms);
    }).then(ticket => {
      log('promise-log', '4. then nhận: ' + ticket.mon); return ticket.so;
    }).then(number => log('promise-log', '5. then tiếp theo nhận giá trị return: ' + number))
      .catch(error => log('promise-log', '4. catch nhận lỗi: ' + error.message))
      .finally(() => { log('promise-log', '6. finally: dọn trạng thái bận'); $('promise-run').disabled = false; });
    log('promise-log', '3. new Promise đã trả phiếu; code ngoài tiếp tục');
  });
  async function parallel(together) {
    $('parallel-sequential').disabled = $('parallel-all').disabled = true;
    $('parallel-log').textContent = 'Bắt đầu ' + (together ? 'hai việc cùng lúc' : 'chờ nối tiếp');
    const start = performance.now();
    const job = async (name, ms) => { await wait(ms); log('parallel-log', name + ' xong'); return name; };
    try {
      if (together) await Promise.all([job('Bác sĩ', 400), job('Chuyên khoa', 700)]);
      else { await job('Bác sĩ', 400); await job('Chuyên khoa', 700); }
      log('parallel-log', `Tổng thời gian: ${Math.round(performance.now() - start)}ms (timer mô phỏng)`);
    } finally { $('parallel-sequential').disabled = $('parallel-all').disabled = false; }
  }
  $('parallel-sequential').addEventListener('click', () => parallel(false));
  $('parallel-all').addEventListener('click', () => parallel(true));

  let warehouse, nextId;
  const resetWarehouse = () => { warehouse = [{ id: 1, patient: 'An (giả định)', status: 'pending' }]; nextId = 2; $('http-output').textContent = 'Kho mẫu:\n' + JSON.stringify(warehouse, null, 2); };
  resetWarehouse(); $('http-reset').addEventListener('click', resetWarehouse);
  $('http-send').addEventListener('click', () => {
    const method = $('http-method').value;
    const first = warehouse[0];
    const path = '/api/appointments' + (['PUT', 'PATCH', 'DELETE'].includes(method) ? '/' + (first?.id || 1) : '');
    let status = '200 OK', payload, result, extra = '';
    if (method === 'GET') result = warehouse;
    else if (method === 'POST') {
      payload = { patient: 'Khách demo', status: 'pending' };
      result = { id: nextId++, ...payload }; warehouse.push(result); status = '201 Created'; extra = '\nLocation: /api/appointments/' + result.id;
    } else if (!first) { status = '404 Not Found'; result = { message: 'Không còn lịch để cập nhật/xóa' }; }
    else if (method === 'DELETE') { warehouse.shift(); status = '204 No Content'; }
    else {
      payload = method === 'PATCH' ? { status: 'confirmed' } : { patient: 'Khách thay thế', status: 'confirmed' };
      result = method === 'PATCH' ? { ...first, ...payload } : { id: first.id, ...payload }; warehouse[0] = result;
    }
    $('http-output').textContent = `[MÔ PHỎNG — KHÔNG GỬI MẠNG]\n${method} ${path} HTTP/1.1\n` +
      (payload ? 'Content-Type: application/json\n\n' + JSON.stringify(payload, null, 2) : '') +
      `\n\nHTTP/1.1 ${status}${extra}\n` + (result !== undefined ? 'Content-Type: application/json\n\n' + JSON.stringify(result, null, 2) : '(không có body)') +
      '\n\nKho hiện tại:\n' + JSON.stringify(warehouse, null, 2);
  });

  let fetchController;
  const fetchBusy = busy => { $('fetch-load').disabled = busy; $('fetch-scenario').disabled = busy; $('fetch-cancel').disabled = !busy; $('fetch-list').setAttribute('aria-busy', String(busy)); };
  const setFetchStatus = (state, message) => {
    $('fetch-status').textContent = state + ' · ' + message;
    $('fetch-status').classList.toggle('error', state === 'error');
    $('fetch-status').dataset.state = state;
  };
  async function loadDoctors() {
    const scenario = $('fetch-scenario').value;
    const paths = { ok: 'data/doctors.json', empty: 'data/empty.json', '404': 'data/missing-doctors.json', json: 'data/not-json.txt' };
    const controller = new AbortController(); fetchController = controller;
    fetchBusy(true); $('fetch-retry').hidden = true; $('fetch-list').replaceChildren();
    setFetchStatus('loading', 'Đang chờ minh họa 700ms rồi gửi request…');
    $('fetch-log').textContent = 'Kịch bản: ' + scenario;
    try {
      await wait(700, controller.signal);
      if (scenario === 'network') { log('fetch-log', 'Không gửi HTTP: reject giả lập để học nhánh lỗi.'); throw new TypeError('Lỗi kết nối giả lập'); }
      log('fetch-log', 'GET ' + paths[scenario]);
      const response = await fetch(paths[scenario], { signal: controller.signal });
      log('fetch-log', `Nhận Response: HTTP ${response.status}, ok=${response.ok}`);
      if (!response.ok) throw new Error('HTTP ' + response.status + ' · kiểm tra URL/tài nguyên');
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(d => d && Number.isInteger(d.id) && typeof d.name === 'string' && typeof d.specialty === 'string' && Number.isFinite(d.fee))) throw new Error('Dữ liệu không đúng hợp đồng bác sĩ');
      log('fetch-log', 'Đọc JSON + kiểm tra schema thành công.');
      data.forEach(d => {
        const card = document.createElement('article'); card.className = 'doctor-card';
        const name = document.createElement('h4'); name.textContent = d.name;
        const detail = document.createElement('p'); detail.textContent = `${d.specialty} · ${d.fee.toLocaleString('vi-VN')} đ`;
        card.append(name, detail); $('fetch-list').append(card);
      });
      setFetchStatus(data.length ? 'success' : 'empty', data.length ? `Đã tải ${data.length} bác sĩ.` : 'Request thành công nhưng không có bác sĩ.');
    } catch (error) {
      if (error.name === 'AbortError') { setFetchStatus('idle', 'Đã hủy lượt tải; có thể tải lại.'); log('fetch-log', 'AbortError: hủy chờ hoặc request, không phải HTTP 404.'); }
      else {
        setFetchStatus('error', error instanceof SyntaxError ? 'Body không phải JSON hợp lệ. Hãy kiểm tra Response.' : error.message);
        log('fetch-log', 'catch: ' + error.name + ' · ' + error.message); $('fetch-retry').hidden = false;
      }
    } finally { fetchBusy(false); log('fetch-log', 'finally: dọn trạng thái bận.'); fetchController = null; }
  }
  $('fetch-load').addEventListener('click', loadDoctors); $('fetch-retry').addEventListener('click', loadDoctors);
  $('fetch-cancel').addEventListener('click', () => fetchController?.abort());

  async function race(guard) {
    $('race-bad').disabled = $('race-good').disabled = true;
    $('race-screen').textContent = 'Ô tìm kiếm hiện tại: An · đang chờ';
    $('race-log').textContent = 'R1: gửi "A" (1000ms)';
    let latest = 1;
    const old = wait(1000).then(() => {
      if (guard && latest !== 1) { log('race-log', 'R1 về sau: bỏ qua kết quả cũ.'); return; }
      $('race-screen').textContent = 'Ô tìm kiếm: An · Kết quả hiển thị: A (cũ, sai ngữ cảnh)'; log('race-log', 'R1 ghi đè màn hình!');
    });
    await wait(100); latest = 2; log('race-log', 'R2: gửi "An" (300ms)');
    const newer = wait(300).then(() => { $('race-screen').textContent = 'Ô tìm kiếm: An · Kết quả hiển thị: An (đúng)'; log('race-log', 'R2 về trước: render An.'); });
    await Promise.all([old, newer]); $('race-bad').disabled = $('race-good').disabled = false;
  }
  $('race-bad').addEventListener('click', () => race(false)); $('race-good').addEventListener('click', () => race(true));

  // Keep the original array separate from filtered and paginated views.
  let searchDoctors = [], searchPage = 1, searchReady = false;
  const pageSize = 2;
  const searchBusy = busy => {
    $('search-load').disabled = busy;
    $('search-results').setAttribute('aria-busy', String(busy));
    for (const id of ['search-name', 'search-specialty', 'search-clear']) $(id).disabled = busy || !searchReady;
    if (busy) $('search-prev').disabled = $('search-next').disabled = true;
  };
  function renderSearch() {
    const keyword = $('search-name').value.trim().toLocaleLowerCase('vi');
    const specialty = $('search-specialty').value;
    const matched = searchDoctors.filter(d => d.name.toLocaleLowerCase('vi').includes(keyword) && (specialty === 'all' || d.specialty === specialty));
    const pageCount = Math.ceil(matched.length / pageSize);
    searchPage = Math.min(Math.max(searchPage, 1), Math.max(pageCount, 1));
    const start = (searchPage - 1) * pageSize;
    const visible = matched.slice(start, start + pageSize);
    $('search-total').textContent = String(searchDoctors.length);
    $('search-matched').textContent = String(matched.length);
    $('search-page').textContent = pageCount ? `${searchPage} / ${pageCount} · ${visible.length} thẻ` : '0 trang · 0 thẻ';
    $('search-prev').disabled = searchPage <= 1 || !pageCount;
    $('search-next').disabled = searchPage >= pageCount;
    $('search-results').replaceChildren();
    visible.forEach(d => {
      const card = document.createElement('article'); card.className = 'doctor-card';
      const name = document.createElement('h4'); name.textContent = d.name;
      const detail = document.createElement('p'); detail.textContent = d.specialty;
      card.append(name, detail); $('search-results').append(card);
    });
    $('search-status').classList.remove('error');
    $('search-status').textContent = matched.length ? `success · ${matched.length} kết quả, hiển thị ${start + 1}–${start + visible.length}.` : 'empty · Không có kết quả. Thử bỏ từ khóa hoặc bộ lọc; không phải lỗi mạng.';
    $('search-trace').textContent = `doctors: ${searchDoctors.length} phần tử (giữ nguyên)\nfilter: ${matched.length} phần tử\npageSize: ${pageSize}, pageCount: ${pageCount}\n${pageCount ? `start = (${searchPage} - 1) × ${pageSize} = ${start}\nslice(${start}, ${start + pageSize}) → id: ${visible.map(d => d.id).join(', ')}` : 'Không có trang để lấy.'}\nTìm/lọc/phân trang trên client: không gửi request mới.`;
  }
  $('search-load').addEventListener('click', async () => {
    searchReady = false; searchDoctors = []; searchPage = 1;
    renderSearch(); searchBusy(true);
    $('search-status').textContent = 'loading · Đang GET data/doctors.json…';
    try {
      const response = await fetch('data/doctors.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(d => d && Number.isInteger(d.id) && typeof d.name === 'string' && typeof d.specialty === 'string')) throw new Error('Dữ liệu bác sĩ sai cấu trúc');
      searchDoctors = data; searchReady = true; renderSearch();
    } catch (error) {
      $('search-status').textContent = 'error · Chưa tải được dữ liệu: ' + error.message + '. Kiểm tra Network rồi tải lại.';
      $('search-status').classList.add('error');
      $('search-trace').textContent = 'Chưa có dữ liệu hợp lệ để tìm/lọc/phân trang.';
    } finally { searchBusy(false); }
  });
  for (const [id, type] of [['search-name', 'input'], ['search-specialty', 'change']]) {
    $(id).addEventListener(type, () => { searchPage = 1; renderSearch(); });
  }
  $('search-clear').addEventListener('click', () => {
    $('search-name').value = ''; $('search-specialty').value = 'all'; searchPage = 1; renderSearch();
  });
  $('search-prev').addEventListener('click', () => { searchPage--; renderSearch(); });
  $('search-next').addEventListener('click', () => { searchPage++; renderSearch(); });

  const componentDoctors = [{ id: 1, name: 'BS. An' }, { id: 2, name: 'BS. Hà' }];
  const componentState = { selectedDoctorId: null };
  const componentButtons = componentDoctors.map(doctor => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary';
    button.dataset.doctorId = doctor.id;
    // Update existing buttons during render so keyboard focus is preserved.
    button.addEventListener('click', () => {
      componentState.selectedDoctorId = doctor.id;
      $('component-event').textContent = `Event: onSelect(${doctor.id}) → cha cập nhật state → render card và summary.`;
      renderComponents();
    });
    $('component-cards').append(button); return button;
  });
  function renderComponents() {
    const selected = componentDoctors.find(d => d.id === componentState.selectedDoctorId);
    componentButtons.forEach((button, i) => {
      const doctor = componentDoctors[i], active = doctor.id === componentState.selectedDoctorId;
      button.setAttribute('aria-pressed', String(active));
      button.textContent = doctor.name + (active ? ' · Đã chọn' : ' · Chọn');
    });
    $('component-state').textContent = `selectedDoctorId: ${componentState.selectedDoctorId}`;
    $('component-props').textContent = componentDoctors.map(d => `DoctorCard(id=${d.id}, selected=${d.id === componentState.selectedDoctorId})`).join('\n');
    $('component-summary').textContent = selected ? `Đang chọn: ${selected.name} (id=${selected.id})` : 'Chưa chọn bác sĩ';
  }
  $('component-reset').addEventListener('click', () => {
    componentState.selectedDoctorId = null; $('component-event').textContent = 'Đặt lại state ở cha → cả hai card và summary trở về chưa chọn.'; renderComponents();
  });
  renderComponents();
})();