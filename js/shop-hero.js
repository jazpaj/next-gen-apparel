/* Shop hero: load-in + category tab bar
   Event contract (on document):
   - dispatches  'shop:category'      { detail: { category } }  on tab click and once on load
   - listens for 'shop:category-sync' { detail: { category } }  updates the active tab, no re-dispatch
   category ∈ all | hoodies | jackets | tees | pants | accessories */
(() => {
  const hero = document.querySelector('.shop-hero');
  if (!hero) return;

  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));

  const bar = hero.querySelector('[data-shop-tabs]');
  if (!bar) return;
  const tabs = [...bar.querySelectorAll('[data-category]')];
  const valid = new Set(tabs.map(t => t.dataset.category));
  let current = 'all';

  function setActive(category, { focus = false } = {}) {
    if (!valid.has(category)) category = 'all';
    current = category;
    bar.dataset.active = category;
    tabs.forEach(t => {
      const on = t.dataset.category === category;
      t.setAttribute('aria-pressed', String(on));
      t.tabIndex = on ? 0 : -1;               // roving tabindex (toolbar pattern)
      if (on) {
        if (focus) t.focus();
        reveal(t);
      }
    });
    syncUrl(category);
    return category;
  }

  // keep the active tab visible in the horizontal-scroll row (mobile)
  function reveal(tab) {
    if (bar.scrollWidth <= bar.clientWidth) return;
    const pad = parseFloat(getComputedStyle(bar).paddingLeft) || 0;
    const left = tab.offsetLeft - bar.offsetLeft - pad;
    const right = left + tab.offsetWidth + pad * 2;
    if (left < bar.scrollLeft || right > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: Math.max(0, left), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  function syncUrl(category) {
    try {
      const url = new URL(location.href);
      if (category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', category);
      if (url.href !== location.href) history.replaceState(history.state, '', url);
    } catch (_) { /* file:// or sandboxed — ignore */ }
  }

  function emit(category) {
    document.dispatchEvent(new CustomEvent('shop:category', { detail: { category } }));
  }

  bar.addEventListener('click', e => {
    const tab = e.target.closest('[data-category]');
    if (!tab || !bar.contains(tab)) return;
    const category = tab.dataset.category;
    if (category === current) return;
    emit(setActive(category));
  });

  bar.addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    tabs.forEach(t => { t.tabIndex = t === next ? 0 : -1; });
    next.focus();
    reveal(next);
  });

  document.addEventListener('shop:category-sync', e => {
    const category = e.detail && e.detail.category;
    if (category && category !== current) setActive(category);
  });

  // Initial state from ?category= ; dispatch after all deferred scripts have attached listeners
  const initial = setActive((new URLSearchParams(location.search).get('category') || 'all').toLowerCase());
  const fire = () => emit(initial === current ? initial : current);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fire, { once: true });
  else fire();
})();
