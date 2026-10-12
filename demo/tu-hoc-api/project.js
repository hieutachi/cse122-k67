'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'cse122-api-lab-appointments-v1';
  const labels = { pending: 'Chờ duyệt', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' };
  const slots = ['08:00', '09:00', '10:00', '14:00', '15:00'];
  let doctors = [], appointments = [], step = 1, submitting = false, loading = false, storageValid = true;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  $('date').min = today();
  const validAppointment = a => a && typeof a.id === 'string' && typeof a.patient === 'string' &&
    typeof a.phone === 'string' && Number.isInteger(a.doctorId) && typeof a.doctorName === 'string' &&
    typeof a.specialty === 'string' && typeof a.date === 'string' && typeof a.time === 'string' && Object.hasOwn(labels, a.status);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.every(validAppointment) || new Set(saved.map(a => a.id)).size !== saved.length) throw new Error('Dữ liệu cũ sai cấu trúc');
      appointments = saved;
    }
    $('storage-status').textContent = 'Kho cục bộ sẵn sàng · dữ liệu chỉ nằm trên browser/origin này.';
  } catch (error) {
    storageValid = false;
    $('storage-status').textContent = 'Không đọc được kho cục bộ: ' + error.message + '. Không tự ghi đè dữ liệu cũ. Kiểm tra quyền hoặc chỉ xóa key của demo trong DevTools rồi tải lại.';
    $('storage-status').classList.add('error');
  }
  function persist(next) {
    if (!storageValid) throw new Error('Kho chưa sẵn sàng; chưa lưu để tránh ghi đè dữ liệu cũ');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    appointments = next;
    $('storage-status').textContent = 'Đã lưu ' + next.length + ' lịch vào localStorage. Không gửi backend.';
    $('storage-status').classList.remove('error');
    renderDashboard();
  }
  function dashboardError(error) {
    $('storage-status').textContent = 'Chưa lưu thay đổi: ' + error.message; $('storage-status').classList.add('error');
  }
  function renderDashboard() {
    $('metric-total').textContent = appointments.length;
    for (const status of Object.keys(labels)) $('metric-' + status).textContent = appointments.filter(a => a.status === status).length;
    const keyword = $('dashboard-query').value.trim().toLocaleLowerCase('vi');
    const status = $('dashboard-filter').value;
    const visible = appointments.filter(a => a.patient.toLocaleLowerCase('vi').includes(keyword) && (status === 'all' || a.status === status));
    $('dashboard-status').textContent = visible.length ? `Hiển thị ${visible.length} / ${appointments.length} lịch.` : 'Không có lịch phù hợp. Hãy tạo lịch hoặc bỏ bộ lọc.';
    $('appointments-body').replaceChildren();
    visible.forEach(a => {
      const tr = document.createElement('tr');
      [a.patient, a.doctorName, `${a.date} ${a.time}`, labels[a.status]].forEach(text => { const td = document.createElement('td'); td.textContent = text; tr.append(td); });
      const actions = document.createElement('td');
      [['confirmed', 'Xác nhận'], ['cancelled', 'Hủy lịch'], ['delete', 'Xóa']].forEach(([action, title]) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary';
        button.textContent = title; button.dataset.action = action; button.dataset.id = a.id;
        button.disabled = submitting || a.status === action; button.style.margin = '3px'; actions.append(button);
      });
      tr.append(actions); $('appointments-body').append(tr);
    });
  }
  $('dashboard-query').addEventListener('input', renderDashboard); $('dashboard-filter').addEventListener('change', renderDashboard);
  $('appointments-body').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || submitting) return;
    const a = appointments.find(item => item.id === button.dataset.id); if (!a) return;
    const action = button.dataset.action;
    if (!['confirmed', 'cancelled', 'delete'].includes(action)) return;
    if (action === 'delete' && !window.confirm('Xóa lịch của ' + a.patient + '? Chỉ xóa bản ghi demo này.')) return;
    try { persist(action === 'delete' ? appointments.filter(item => item.id !== a.id) : appointments.map(item => item.id === a.id ? { ...item, status: action } : item)); }
    catch (error) { dashboardError(error); }
  });
  function syncButtons() {
    $('booking-back').disabled = submitting || step === 1;
    $('booking-next').disabled = submitting || loading || !doctors.length;
    $('booking-submit').disabled = submitting || loading || !doctors.length;
    $('reload-doctors').disabled = loading || submitting;
    $('specialty').disabled = loading || submitting;
    document.querySelectorAll('#booking-form fieldset').forEach(el => { el.disabled = submitting || loading; });
    document.querySelectorAll('[data-pick-doctor]').forEach(el => { el.disabled = submitting || loading; });
    $('booking-form').setAttribute('aria-busy', String(submitting));
  }
  function selectedDoctor() { return doctors.find(d => d.id === Number($('doctor').value)); }
  function payload() {
    return { doctorId: Number($('doctor').value), date: $('date').value, time: $('time').value, patient: $('patient').value.trim(), phone: $('phone').value.trim() };
  }
  function review() {
    const d = selectedDoctor();
    $('booking-review').textContent = d ? `${d.name} · ${d.specialty}\n${$('date').value} lúc ${$('time').value} · ${d.fee.toLocaleString('vi-VN')} đ` : 'Chưa chọn bác sĩ.';
    $('booking-payload').textContent = JSON.stringify(payload(), null, 2) + '\n\nChưa gửi HTTP. Demo sẽ lưu cục bộ khi xác nhận.';
  }
  function showStep(next, focus = false) {
    step = next;
    for (let i = 1; i <= 3; i++) {
      $('booking-step-' + i).hidden = i !== step;
      if (i === step) $('step-label-' + i).setAttribute('aria-current', 'step');
      else $('step-label-' + i).removeAttribute('aria-current');
    }
    $('booking-next').hidden = step === 3; $('booking-submit').hidden = step !== 3;
    $('booking-error').hidden = true;
    document.querySelectorAll('#booking-form [aria-invalid]').forEach(el => {
      el.removeAttribute('aria-invalid');
      if (['patient', 'phone'].includes(el.id)) el.setAttribute('aria-describedby', 'privacy-note');
      else el.removeAttribute('aria-describedby');
    });
    review(); syncButtons();
    if (focus) $('booking-step-' + step).querySelector('select,input')?.focus();
  }
  function fail(message, field, fieldStep) {
    if (fieldStep !== step) showStep(fieldStep);
    $('booking-error').textContent = message; $('booking-error').hidden = false;
    if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'booking-error'); field.focus(); }
    return false;
  }
  function validate(n) {
    if (n === 1 && !selectedDoctor()) return fail('Chọn một bác sĩ trong danh sách đã tải.', $('doctor'), 1);
    if (n === 2) {
      $('date').min = today();
      if (!$('date').value || !$('date').validity.valid || $('date').value < today()) return fail('Chọn ngày khám hợp lệ, từ hôm nay trở đi.', $('date'), 2);
      if (!slots.includes($('time').value)) return fail('Chọn giờ thuộc danh sách demo.', $('time'), 2);
    }
    if (n === 3) {
      if ($('patient').value.trim().length < 2) return fail('Nhập tên giả ít nhất 2 ký tự.', $('patient'), 3);
      if (!/^0\d{9}$/.test($('phone').value.trim())) return fail('Điện thoại demo gồm 10 chữ số, bắt đầu bằng 0.', $('phone'), 3);
    }
    return true;
  }
  $('booking-next').addEventListener('click', () => { if (!submitting && validate(step)) showStep(Math.min(step + 1, 3), true); });
  $('booking-back').addEventListener('click', () => { if (!submitting) showStep(Math.max(1, step - 1), true); });
  $('booking-form').addEventListener('input', review);
  $('booking-form').addEventListener('change', review);
  $('booking-form').addEventListener('submit', async event => {
    event.preventDefault(); if (submitting || loading) return;
    if (step !== 3) { if (validate(step)) showStep(step + 1, true); return; }
    for (let n = 1; n <= 3; n++) if (!validate(n)) return;
    const data = payload(), d = selectedDoctor(), simulate = $('simulate-failure').checked;
    submitting = true; syncButtons(); renderDashboard(); $('booking-error').hidden = true;
    $('booking-status').textContent = 'submitting · Chờ mô phỏng 700ms, rồi thử lưu localStorage. Không gửi POST.';
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      if (simulate) throw new Error('Lỗi lưu giả lập (dữ liệu chưa được ghi)');
      const a = { ...data, id: crypto.randomUUID(), doctorName: d.name, specialty: d.specialty, status: 'pending', createdAt: new Date().toISOString() };
      persist([...appointments, a]);
      $('booking-form').reset(); showStep(1);
      $('booking-status').textContent = `saved · Đã lưu lịch ${a.id} cho ${a.patient}. Xem dashboard bên dưới. Đây là xác nhận cục bộ, không phải lịch khám thật.`;
    } catch (error) {
      $('booking-error').textContent = 'Chưa lưu được: ' + error.message + '. Dữ liệu form vẫn được giữ để thử lại.'; $('booking-error').hidden = false;
      $('booking-status').textContent = 'error · Chưa tạo lịch. Bỏ giả lập lỗi hoặc kiểm tra quyền lưu rồi thử lại.';
    } finally {
      submitting = false; syncButtons(); renderDashboard();
      if ($('booking-status').textContent.startsWith('saved')) $('doctor').focus();
    }
  });
  function renderDoctors() {
    const selected = $('specialty').value;
    const visible = doctors.filter(d => selected === 'all' || d.specialty === selected);
    $('doctors-list').replaceChildren();
    visible.forEach(d => {
      const card = document.createElement('article'); card.className = 'doctor-card';
      const title = document.createElement('h3'); title.textContent = d.name;
      const detail = document.createElement('p'); detail.textContent = `${d.specialty} · ${d.fee.toLocaleString('vi-VN')} đ`;
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Chọn đặt lịch'; button.dataset.pickDoctor = d.id;
      button.addEventListener('click', () => { if (submitting || loading) return; $('doctor').value = String(d.id); showStep(1); $('doctor').focus(); });
      card.append(title, detail, button); $('doctors-list').append(card);
    });
    if (!loading) $('doctors-status').textContent = visible.length ? `success · Hiển thị ${visible.length} / ${doctors.length} bác sĩ từ GET thật.` : 'empty · Không có bác sĩ phù hợp.';
    syncButtons();
  }
  async function loadDoctors() {
    if (loading || submitting) return;
    loading = true; syncButtons(); $('doctors-list').setAttribute('aria-busy', 'true');
    $('doctors-status').classList.remove('error'); $('doctors-status').textContent = 'loading · Đang GET data/doctors.json…';
    const previous = $('doctor').value;
    try {
      const response = await fetch('data/doctors.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(d => d && Number.isInteger(d.id) && typeof d.name === 'string' && typeof d.specialty === 'string' && Number.isFinite(d.fee)) || new Set(data.map(d => d.id)).size !== data.length) throw new Error('Cấu trúc bác sĩ không hợp lệ');
      doctors = data;
      $('doctor').replaceChildren(new Option('— Chọn bác sĩ —', ''));
      doctors.forEach(d => $('doctor').append(new Option(`${d.name} · ${d.specialty}`, String(d.id))));
      if (doctors.some(d => String(d.id) === previous)) $('doctor').value = previous;
      $('specialty').replaceChildren(new Option('Tất cả', 'all'));
      [...new Set(doctors.map(d => d.specialty))].forEach(s => $('specialty').append(new Option(s, s)));
    } catch (error) {
      doctors = []; $('doctors-list').replaceChildren(); $('doctor').replaceChildren(new Option('Chưa tải được bác sĩ', ''));
      $('doctors-status').textContent = 'error · Chưa tải được: ' + error.message + '. Bấm Tải lại bác sĩ. Mở qua HTTP, không dùng file://.'; $('doctors-status').classList.add('error');
    } finally {
      loading = false; $('doctors-list').setAttribute('aria-busy', 'false');
      if (!$('doctors-status').classList.contains('error')) renderDoctors();
      syncButtons(); review();
    }
  }
  $('specialty').addEventListener('change', renderDoctors); $('reload-doctors').addEventListener('click', loadDoctors);
  renderDashboard(); showStep(1); loadDoctors();
})();