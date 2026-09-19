// JavaScript thuần: điều hướng, hiệu ứng cuộn, lọc sự kiện và form demo.
(() => {
  'use strict';

  const root = document.documentElement;
  const header = document.querySelector('#site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 700px)');

  root.classList.add('js-enabled');
  document.querySelector('#current-year').textContent = new Date().getFullYear();

  // Menu dùng được bằng bàn phím; Escape đóng menu và trả lại focus.
  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng');
    nav.classList.toggle('is-open', open);
  }

  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });

  header.addEventListener('focusout', (event) => {
    if (!header.contains(event.relatedTarget)) setMenu(false);
  });

  mobileLayout.addEventListener('change', () => setMenu(false));

  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Nội dung mặc định luôn hiện nếu JavaScript hoặc IntersectionObserver không có.
  const revealItems = document.querySelectorAll('.reveal');
  let revealObserver;

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    root.classList.add('reveal-ready');
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      root.classList.remove('reveal-ready');
      revealObserver?.disconnect();
    }
  });

  // Lọc trên DOM, không tải lại trang hoặc gọi dịch vụ bên ngoài.
  const filters = document.querySelectorAll('[data-filter]');
  const eventCards = document.querySelectorAll('[data-category]');
  const filterStatus = document.querySelector('#filter-status');

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      let visibleCount = 0;

      filters.forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle('active', active);
        filter.setAttribute('aria-pressed', String(active));
      });

      eventCards.forEach((card) => {
        const visible = category === 'all' || card.dataset.category === category;
        card.classList.remove('filter-enter');
        card.hidden = !visible;

        if (visible) {
          visibleCount += 1;
          card.classList.add('is-visible', 'filter-enter');
          revealObserver?.unobserve(card);
        }
      });

      filterStatus.textContent = `Đang hiển thị ${visibleCount} sự kiện minh họa.`;
    });
  });

  // Form chỉ kiểm tra và hiển thị dữ liệu trong bộ nhớ của trang hiện tại.
  // Không có fetch(), localStorage, cookie hoặc tạo tài khoản thật.
  const form = document.querySelector('#signup-form');
  const formContent = document.querySelector('#form-content');
  const successState = document.querySelector('#success-state');
  const formStatus = document.querySelector('#form-status');
  const nameInput = document.querySelector('#full-name');
  const emailInput = document.querySelector('#email');
  const schoolInput = document.querySelector('#school');
  const fields = [nameInput, emailInput, schoolInput];
  const selectedEventBox = document.querySelector('#selected-event');
  const selectedEventName = document.querySelector('#selected-event-name');
  let selectedEvent = '';

  form.noValidate = true;

  function getError(input) {
    const value = input.value.trim();

    if (!value) {
      if (input === nameInput) return 'Cho CampusConnect biết tên của bạn nhé.';
      if (input === emailInput) return 'Bạn chưa nhập địa chỉ email.';
      return 'Bạn chưa nhập tên trường.';
    }

    if (value.length > input.maxLength) return 'Thông tin quá dài. Bạn rút gọn lại nhé.';

    if (input === emailInput) {
      if (input.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email chưa đúng định dạng, ví dụ: ban@example.com.';
      }
    } else if (value.length < 2) {
      return input === nameInput ? 'Tên cần có ít nhất 2 ký tự.' : 'Tên trường cần có ít nhất 2 ký tự.';
    }

    return '';
  }

  function validateField(input) {
    const error = getError(input);
    document.getElementById(input.getAttribute('aria-describedby')).textContent = error;
    input.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  }

  fields.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      formStatus.textContent = '';
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
  });

  function updateSelectedEvent(name) {
    selectedEvent = name;
    selectedEventName.textContent = name;
    selectedEventBox.hidden = !name;
  }

  function resetDemo() {
    form.reset();
    formStatus.textContent = '';
    fields.forEach((input) => {
      input.removeAttribute('aria-invalid');
      document.getElementById(input.getAttribute('aria-describedby')).textContent = '';
    });
    updateSelectedEvent('');
    successState.hidden = true;
    formContent.hidden = false;
    document.querySelector('#success-title').textContent = 'Chào bạn mới!';
    document.querySelector('#success-message').textContent = '';
  }

  document.querySelectorAll('[data-event]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!successState.hidden) resetDemo();
      updateSelectedEvent(button.dataset.event);
      nameInput.focus({ preventScroll: true });
      document.querySelector('#signup').scrollIntoView({
        behavior: reducedMotion.matches ? 'instant' : 'smooth',
        block: 'start'
      });
    });
  });

  document.querySelector('#clear-event').addEventListener('click', () => {
    updateSelectedEvent('');
    nameInput.focus({ preventScroll: true });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let firstInvalid = null;
    let errorCount = 0;

    fields.forEach((input) => {
      input.value = input.value.trim();
      if (!validateField(input)) {
        firstInvalid ??= input;
        errorCount += 1;
      }
    });

    if (firstInvalid) {
      formStatus.textContent = `Có ${errorCount} thông tin cần kiểm tra lại.`;
      firstInvalid.focus();
      return;
    }

    // textContent tránh diễn giải tên/trường nhập vào thành HTML.
    document.querySelector('#success-title').textContent = `Chào ${nameInput.value}!`;
    document.querySelector('#success-message').textContent = selectedEvent
      ? `Thông tin của bạn hợp lệ. Bạn đã chọn trải nghiệm “${selectedEvent}” trong bản demo.`
      : `Thông tin của bạn tại ${schoolInput.value} hợp lệ. Cảm ơn bạn đã thử CampusConnect!`;

    formContent.hidden = true;
    successState.hidden = false;
    form.reset();
    updateSelectedEvent('');
    successState.focus({ preventScroll: true });
    successState.scrollIntoView({
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
      block: 'nearest'
    });
  });

  document.querySelector('#reset-form').addEventListener('click', () => {
    resetDemo();
    nameInput.focus({ preventScroll: true });
  });

  // Chỉ cho submit khi trình xử lý demo đã sẵn sàng.
  form.querySelector('[type="submit"]').disabled = false;
})();