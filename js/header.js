/* Header: scrolled state, search bar, overlay menu */
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
