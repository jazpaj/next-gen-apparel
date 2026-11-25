/* Header: scrolled state, search bar, overlay menu, shared dialogs (bag drawer, account) */

/* NGDialog — shared modal behavior for .ng-dialog wrappers: focus trap, Escape /
   overlay / [data-dialog-close] closes, focus returns to the opener, body scroll lock.
   window.NGDialog.open(idOrEl, opener?) / .close(idOrEl, returnFocus = true) / .isOpen(idOrEl) */
window.NGDialog = window.NGDialog || (() => {
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const state = new WeakMap(); // el -> { opener, timer }
  let current = null;
  const get = (x) => (typeof x === 'string' ? document.getElementById(x) : x);
  const focusables = (el) => [...el.querySelectorAll(SEL)].filter(n => !n.closest('[hidden]') && n.getClientRects().length);
  const setExpanded = (el, v) => document.querySelectorAll(`[aria-controls="${el.id}"]`).forEach(b => b.setAttribute('aria-expanded', String(v)));

  function open(x, opener) {
    const el = get(x);
    if (!el) return;
    if (current && current !== el) close(current, false);
    const st = state.get(el) || {};
    clearTimeout(st.timer);
    if (opener !== undefined || !st.opener) st.opener = opener || document.activeElement;
    state.set(el, st);
    if (current === el && !el.hidden) return;
    el.hidden = false;
    el.getBoundingClientRect(); // flush so the transition runs
    el.classList.add('is-open');
    setExpanded(el, true);
    document.body.classList.add('dialog-open');
    current = el;
    const panel = el.querySelector('[role="dialog"]') || el;
    const target = el.querySelector('[data-dialog-initial]') || focusables(panel)[0] || panel;
    target.focus({ preventScroll: true });
    el.dispatchEvent(new CustomEvent('dialog:open'));
  }

  function close(x, returnFocus = true) {
    const el = get(x);
    if (!el || el.hidden || !el.classList.contains('is-open')) return;
    const st = state.get(el) || {};
    el.classList.remove('is-open');
    setExpanded(el, false);
    if (current === el) current = null;
    if (!current) document.body.classList.remove('dialog-open');
    st.timer = setTimeout(() => { el.hidden = true; }, reduced() ? 0 : 360);
    if (returnFocus && st.opener && document.contains(st.opener)) st.opener.focus({ preventScroll: true });
    st.opener = null;
    state.set(el, st);
    el.dispatchEvent(new CustomEvent('dialog:close'));
  }

  document.addEventListener('click', (e) => {
    const closer = e.target.closest('.ng-dialog [data-dialog-close]');
    if (closer) close(closer.closest('.ng-dialog'));
  });
  document.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); close(current); return; }
    if (e.key !== 'Tab') return;
    const panel = current.querySelector('[role="dialog"]') || current;
    const f = focusables(panel);
    if (!f.length) { e.preventDefault(); panel.focus(); return; }
    const first = f[0], last = f[f.length - 1];
    if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  return { open, close, isOpen: (x) => { const el = get(x); return !!el && el.classList.contains('is-open'); } };
})();

(() => {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  /* Scrolled state (passive + rAF throttled) */
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  /* Search bar */
  const searchToggle = header.querySelector('[data-search-toggle]');
  const searchPanel = document.getElementById('header-search');
  const searchInput = document.getElementById('header-search-input');
  const searchClose = header.querySelector('[data-search-close]');

  const setSearch = (open, returnFocus = true) => {
    if (!searchPanel) return;
    searchPanel.hidden = !open;
    searchToggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-search-open', open);
    if (open) searchInput && searchInput.focus();
    else if (returnFocus) searchToggle.focus();
  };
  searchToggle && searchToggle.addEventListener('click', () => setSearch(searchPanel.hidden));
  searchClose && searchClose.addEventListener('click', () => setSearch(false));
  searchPanel && searchPanel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); setSearch(false); }
  });

  /* Search submits a GET to shop.html?q=… ; an empty query stays put */
  const searchForm = header.querySelector('[data-search-form]');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      const q = searchInput.value.trim();
      if (!q) { e.preventDefault(); searchInput.value = ''; searchInput.focus(); return; }
      searchInput.value = q;
    });
    const current = new URLSearchParams(location.search).get('q');
    if (current && /(^|\/)shop\.html$/.test(location.pathname)) searchInput.value = current;
  }

  /* Account: "coming soon" dialog with a local-only early-access signup */
  const accountBtn = header.querySelector('[data-account-open]');
  const accountDlg = document.getElementById('account-dialog');
  if (accountBtn && accountDlg) {
    accountBtn.addEventListener('click', () => {
      if (searchPanel && !searchPanel.hidden) setSearch(false, false);
      window.NGDialog.open(accountDlg, accountBtn);
    });
    const form = accountDlg.querySelector('[data-account-form]');
    const done = accountDlg.querySelector('[data-account-done]');
    const email = form.elements.email;
    const err = document.getElementById('account-email-error');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const check = () => {
      email.setCustomValidity('');
      const v = email.value.trim();
      const msg = !v ? 'Please enter your email address.'
        : (!EMAIL_RE.test(v) || !email.checkValidity()) ? 'Please enter a valid email address, like name@example.com.' : '';
      email.setCustomValidity(msg);
      if (msg) { email.setAttribute('aria-invalid', 'true'); err.textContent = msg; err.hidden = false; }
      else { email.removeAttribute('aria-invalid'); err.textContent = ''; err.hidden = true; }
      return !msg;
    };
    email.addEventListener('input', () => { if (email.getAttribute('aria-invalid') === 'true') check(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!check()) { email.focus(); return; }
      // No backend: nothing is sent anywhere.
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  }

  /* Overlay menu */
  const menuToggle = header.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('menu-overlay');
  if (!menuToggle || !menu) return;
  const menuClose = menu.querySelector('[data-menu-close]');
  const focusables = () => [...menu.querySelectorAll('a[href], button:not([disabled])')];
  let closeTimer;

  const openMenu = () => {
    clearTimeout(closeTimer);
    if (searchPanel && !searchPanel.hidden) setSearch(false, false);
    menu.hidden = false;
    menu.getBoundingClientRect(); // flush so the transition runs
    menu.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    (menuClose || focusables()[0]).focus();
  };
  const closeMenu = (returnFocus = true) => {
    if (menu.hidden) return;
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    closeTimer = setTimeout(() => { menu.hidden = true; }, reduced ? 0 : 320);
    if (returnFocus) menuToggle.focus();
  };

  menuToggle.addEventListener('click', openMenu);
  // The toggle is hidden on desktop; close the overlay if the viewport widens while it's open
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
    if (e.matches) closeMenu(false);
  });
  menuClose && menuClose.addEventListener('click', () => closeMenu());
  menu.addEventListener('click', (e) => {
    if (e.target.closest('.menu-overlay__link')) closeMenu(false);
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
