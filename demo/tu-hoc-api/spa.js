'use strict';
// Hash routes work on GitHub Pages without server rewrites or dependencies.
(() => {
  const panels = [...document.querySelectorAll('.course-content > .reading')];
  const toc = document.querySelector('.course-toc');
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const picker = document.getElementById('lesson-picker');
  const status = document.getElementById('lesson-status');
  const previous = document.getElementById('lesson-prev');
  const next = document.getElementById('lesson-next');
  const title = document.title;
  const names = panels.map(panel => panel.querySelector('h2').textContent);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let panelAnimation;
  const play = (element, frames, duration = 360) => {
    if (reducedMotion.matches || typeof element.animate !== 'function') return;
    return element.animate(frames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  let current = 0;
  panels.forEach((panel, index) => {
    const heading = panel.querySelector('h2');
    heading.tabIndex = -1;
    heading.id ||= `title-${panel.id}`;
    panel.setAttribute('aria-labelledby', heading.id);
    const option = document.createElement('option');
    option.value = panel.id;
    option.textContent = links.find(link => link.hash === '#' + panel.id)?.textContent || names[index];
    picker.append(option);
  });
  const mobile = matchMedia('(max-width:900px)');
  const fitMenu = () => { toc.open = !mobile.matches; };
  fitMenu();
  mobile.addEventListener('change', fitMenu);

  function route(focus = true) {
    const last = current;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
    const target = document.getElementById(id);
    const panel = target?.closest('.course-content > .reading');
    // The skip link is a document landmark, not an invalid lesson route.
    const landmark = id === 'main' && target;
    const index = landmark ? current : panels.indexOf(panel);
    current = index >= 0 ? index : 0;
    if (index < 0) history.replaceState(null, '', '#'+panels[current].id);
    panels.forEach((item, i) => { item.hidden = i !== current; });
    picker.value = panels[current].id;
    links.forEach(link => {
      if (link.hash === '#' + panels[current].id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    status.textContent = `${current + 1} / ${panels.length} · ${names[current]}`;
    document.getElementById('lesson-position').textContent = `${String(current + 1).padStart(2, '0')} / ${panels.length}`;
    const activeLink = links.find(link => link.hash === '#' + panels[current].id);
    let group = activeLink?.previousElementSibling;
    while (group && group.tagName !== 'STRONG') group = group.previousElementSibling;
    document.getElementById('lesson-group').textContent = group?.textContent || 'Tự học';
    if (last !== current) {
      panelAnimation?.cancel();
      panelAnimation = play(panels[current], [
        { opacity: .35, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ]);
    }
    previous.disabled = current === 0;
    next.disabled = current === panels.length - 1;
    document.title = `${names[current]} | CSE122`;
    if (mobile.matches) toc.open = false;
    const heading = landmark || panels[current].querySelector('h2');
    heading.tabIndex = -1;
    if (focus) heading.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      // Preserve nested links to maps/labs, not just top-level lesson routes.
      const destination = landmark || (index >= 0 && target !== panel ? target : document.getElementById('lesson-toolbar'));
      const headerHeight = document.querySelector('.topbar').getBoundingClientRect().height;
      window.scrollTo({ top: Math.max(0, window.scrollY + destination.getBoundingClientRect().top - headerHeight - 20), behavior: 'instant' });
      document.dispatchEvent(new Event('scroll'));
    });
  }
  picker.addEventListener('change', () => { location.hash = picker.value; });
  previous.addEventListener('click', () => { if (current > 0) location.hash = panels[current - 1].id; });
  next.addEventListener('click', () => { if (current < panels.length - 1) location.hash = panels[current + 1].id; });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.hash === location.hash) { event.preventDefault(); route(); }
  });
  window.addEventListener('hashchange', () => route());
  document.body.classList.add('spa-ready');
  document.getElementById('lesson-toolbar').hidden = false;
  document.getElementById('lesson-navigation').hidden = false;
  route(false);
  // Reapply after native initial-fragment scrolling and lazy layout settle.
  window.addEventListener('load', () => setTimeout(() => route(false), 0), { once: true });
  window.addEventListener('beforeprint', () => { document.title = title; });
  window.addEventListener('afterprint', () => { document.title = `${names[current]} | CSE122`; });
  // Progressive enhancement: content never depends on an observer or animation.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        play(entry.target, [{ opacity: .55, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], 500);
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll('.visual-map,.reading-coach').forEach(element => observer.observe(element));
  }
  const outputAnimations = new WeakMap();
  const outputObserver = new MutationObserver(records => {
    const changed = new Set(records.map(record => record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement));
    changed.forEach(element => {
      if (element.closest('.reading[hidden]')) return;
      outputAnimations.get(element)?.cancel();
      const animation = play(element, [{ boxShadow: '0 0 0 3px #31ad9566' }, { boxShadow: getComputedStyle(element).boxShadow }], 650);
      if (animation) outputAnimations.set(element, animation);
    });
  });
  document.querySelectorAll('.queue-box span,.lab .notice,.lab .log').forEach(element => outputObserver.observe(element, { childList: true, characterData: true, subtree: true }));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) document.getAnimations().forEach(animation => animation.cancel());
  });
})();