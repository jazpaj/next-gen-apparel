/* Shop listing: filters, sorting, pagination, grid/list view, wishlist, filter drawer */
(() => {
  const root = document.querySelector('[data-listing]');
  if (!root) return;

  /* ---------------------------------------------------------------- Data */
  const IMG = {
    hoodie: ['assets/img/product-tech-hoodie.webp', 675, 666],
    tee: ['assets/img/product-graphic-tee.webp', 669, 663],
    cargo: ['assets/img/product-cargo-pants.webp', 615, 654],
    jacket: ['assets/img/product-utility-jacket.webp', 618, 654],
    cap: ['assets/img/product-signature-cap.webp', 597, 654],
    sling: ['assets/img/product-tech-sling-bag.webp', 600, 657],
  };
  const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  const OS = ['OS'];
  // [id, name, category, price, colors, sizes, stock, date, popularity, image]
  const RAW = [
    ['v01-tech-hoodie', 'V-01 Tech Hoodie', 'hoodies', 139, ['black', 'grey'], ['S', 'M', 'L', 'XL', '2XL'], 'in-stock', '2026-11-20', 95, 'hoodie'],
    ['graphic-tee-02', 'Graphic Tee 02', 'tees', 79, ['black'], ALL_SIZES, 'in-stock', '2026-11-18', 88, 'tee'],
    ['cargo-pants', 'Cargo Pants', 'pants', 179, ['black'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-11-15', 90, 'cargo'],
    ['utility-jacket', 'Utility Jacket', 'jackets', 229, ['cream'], ['S', 'M', 'L', 'XL', '2XL'], 'in-stock', '2026-11-12', 84, 'jacket'],
    ['signature-cap', 'Signature Cap', 'accessories', 49, ['black'], OS, 'in-stock', '2026-11-10', 92, 'cap'],
    ['tech-sling-bag', 'Tech Sling Bag', 'accessories', 89, ['black', 'orange'], OS, 'in-stock', '2026-11-08', 80, 'sling'],
    ['v02-shell-hoodie', 'V-02 Shell Hoodie', 'hoodies', 149, ['grey'], ['XS', 'S', 'M', 'L', 'XL'], 'in-stock', '2026-11-05', 70, 'hoodie'],
    ['graphic-tee-03-bone', 'Graphic Tee 03 — Bone', 'tees', 75, ['cream'], ALL_SIZES, 'in-stock', '2026-11-02', 66, 'tee'],
    ['ripstop-cargo-olive', 'Ripstop Cargo — Olive', 'pants', 189, ['olive'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-10-29', 74, 'cargo'],
    ['field-jacket-olive', 'Field Utility Jacket — Olive', 'jackets', 239, ['olive'], ['M', 'L', 'XL', '2XL'], 'in-stock', '2026-10-25', 61, 'jacket'],
    ['core-cap-orange', 'Core Logo Cap — Orange', 'accessories', 45, ['orange'], OS, 'in-stock', '2026-10-22', 58, 'cap'],
    ['crossbody-sling-grey', 'Crossbody Sling — Grey', 'accessories', 79, ['grey'], OS, 'in-stock', '2026-10-19', 52, 'sling'],
    ['v01-tech-hoodie-signal', 'V-01 Tech Hoodie — Signal', 'hoodies', 139, ['orange'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-10-15', 77, 'hoodie'],
    ['boxy-tee-01', 'Boxy Tee 01', 'tees', 65, ['black', 'grey'], ALL_SIZES, 'in-stock', '2026-10-12', 63, 'tee'],
    ['tech-jogger', 'Tech Jogger', 'pants', 159, ['black'], ['XS', 'S', 'M', 'L', 'XL'], 'in-stock', '2026-10-08', 69, 'cargo'],
    ['storm-shell-jacket', 'Storm Shell Jacket', 'jackets', 259, ['black'], ['S', 'M', 'L', 'XL', '2XL'], 'in-stock', '2026-10-04', 81, 'jacket'],
    ['heavyweight-hoodie-bone', 'Heavyweight Hoodie — Bone', 'hoodies', 129, ['cream'], ALL_SIZES, 'in-stock', '2026-09-30', 72, 'hoodie'],
    ['utility-tee-grey', 'Utility Tee — Grey', 'tees', 69, ['grey'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-09-26', 49, 'tee'],
    ['six-pocket-pant', 'Six-Pocket Pant — Black', 'pants', 199, ['black'], ['M', 'L', 'XL', '2XL'], 'in-stock', '2026-09-22', 56, 'cargo'],
    ['waxed-cap-olive', 'Waxed Cap — Olive', 'accessories', 55, ['olive'], OS, 'in-stock', '2026-09-18', 44, 'cap'],
    ['v03-gore-hoodie', 'V-03 Gore Hoodie', 'hoodies', 169, ['black'], ['S', 'M', 'L', 'XL'], 'pre-order', '2026-12-10', 85, 'hoodie'],
    ['expedition-parka', 'Expedition Parka', 'jackets', 329, ['black', 'olive'], ['M', 'L', 'XL', '2XL'], 'pre-order', '2026-12-05', 83, 'jacket'],
    ['graphic-tee-04-signal', 'Graphic Tee 04 — Signal', 'tees', 85, ['orange'], ALL_SIZES, 'pre-order', '2026-12-01', 60, 'tee'],
    ['modular-sling-pack', 'Modular Sling Pack', 'accessories', 119, ['grey', 'olive'], OS, 'pre-order', '2026-11-28', 64, 'sling'],
  ];
  const PRODUCTS = RAW.map(([id, name, category, price, colors, sizes, stock, date, popularity, img]) => ({
    id, name, category, price, colors, sizes, stock, date: Date.parse(date), popularity, img: IMG[img],
  }));

  const CATALOG_TOTAL = 124;   // notional catalog size shown with default filters
  const CATALOG_PAGES = 12;
  const PAGE1 = 6;             // page 1: 6 products + 2-column promo = 8 slots
  const PER_PAGE = 8;
  const PRICE_MAX = 300;       // slider max == "no upper limit"
  const CATS = ['hoodies', 'jackets', 'tees', 'pants', 'accessories'];

  /* ---------------------------------------------------------------- DOM */
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const form = $('[data-filters-form]');
  const grid = $('[data-grid]');
  const promo = $('[data-promo]');
  const pager = $('[data-pager]');
  const empty = $('[data-empty]');
  const countEl = $('[data-count]');
  const applyCount = $('[data-apply-count]');
  const sortEl = $('[data-sort]');
  const minEl = $('[data-price-min]');
  const maxEl = $('[data-price-max]');
  const track = $('.price__track');

  const wishlist = new Set();
  const params = new URLSearchParams(location.search);
  const urlSort = params.get('sort');
  const state = {
    sort: ['newest', 'popular', 'price-asc', 'price-desc'].includes(urlSort) ? urlSort : 'newest',
    view: 'grid',
    page: 1,
  };
  sortEl.value = state.sort;

  /* ------------------------------------------------------------ Filters */
  const checked = (name) => $$(`input[name="${name}"]:checked`).map((i) => i.value);
  const pressed = (sel, attr) => $$(`${sel}[aria-pressed="true"]`).map((b) => b.dataset[attr]);

  function readFilters() {
    return {
      availability: checked('availability'),
      categories: checked('category'),
      sizes: pressed('.size', 'size'),
      colors: pressed('.swatch', 'color'),
      min: +minEl.value,
      max: +maxEl.value,
    };
  }
  function isDefault(f) {
    return f.availability.length === 1 && f.availability[0] === 'in-stock' &&
      !f.categories.length && !f.sizes.length && !f.colors.length && f.min === 0 && f.max === PRICE_MAX;
  }
  function apply(f) {
    const list = PRODUCTS.filter((p) =>
      (!f.availability.length || f.availability.includes(p.stock)) &&
      (!f.categories.length || f.categories.includes(p.category)) &&
      (!f.sizes.length || p.sizes.some((s) => f.sizes.includes(s))) &&
      (!f.colors.length || p.colors.some((c) => f.colors.includes(c))) &&
      p.price >= f.min && (f.max >= PRICE_MAX || p.price <= f.max));
    const by = {
      newest: (a, b) => b.date - a.date,
      popular: (a, b) => b.popularity - a.popularity,
      'price-asc': (a, b) => a.price - b.price || b.date - a.date,
      'price-desc': (a, b) => b.price - a.price || b.date - a.date,
    }[state.sort];
    return list.sort(by);
  }

  /* -------------------------------------------------------------- Render */
  const money = (n) => `$${n.toFixed(2)}`;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.3s-7.8-4.7-7.8-10.4A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.8 2.7c0 5.7-7.8 10.4-7.8 10.4z"/></svg>';
  const catLabel = { hoodies: 'Hoodie', jackets: 'Jacket', tees: 'Tee', pants: 'Pants', accessories: 'Accessory' };

  function card(p, i) {
    const li = document.createElement('li');
    li.className = 'card';
    li.style.setProperty('--i', i);
    const n = esc(p.name);
    const [src, w, h] = p.img;
    li.innerHTML = `
      <div class="card__media">
        <img class="card__img" src="${src}" width="${w}" height="${h}" alt="${n}" loading="lazy" decoding="async">
        ${p.stock === 'pre-order' ? '<span class="card__tag">Pre-order</span>' : ''}
        <button class="card__wish" type="button" aria-pressed="${wishlist.has(p.id)}" aria-label="Add ${n} to wishlist" data-wish="${p.id}">${heart}</button>
        <button class="card__quick" type="button" aria-label="Quick add ${n}" data-quick="${p.id}">Quick add <span aria-hidden="true">+</span></button>
      </div>
      <div class="card__body">
        <h3 class="card__name"><a class="card__link" href="#">${n}</a></h3>
        <p class="card__price">${money(p.price)}</p>
        <p class="card__meta">${catLabel[p.category]} · ${p.colors.join(' / ')} · ${p.sizes.join(' ')}</p>
      </div>`;
    return li;
  }

  function pageList(cur, total) {
    if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur - 1, cur, cur + 1, '…', total];
  }
  const chev = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

  function renderPager(total) {
    if (total <= 1) { pager.innerHTML = ''; return; }
    const cur = state.page;
    let html = `<button class="pager__btn pager__btn--edge" type="button" data-page="${cur - 1}" aria-label="Previous page" ${cur === 1 ? 'disabled' : ''}>${chev('m15 6-6 6 6 6')}</button>`;
    for (const n of pageList(cur, total)) {
      html += n === '…'
        ? '<span class="pager__gap" aria-hidden="true">…</span>'
        : `<button class="pager__btn" type="button" data-page="${n}" aria-label="Page ${n}"${n === cur ? ' aria-current="page"' : ''}>${n}</button>`;
    }
    html += `<button class="pager__btn pager__btn--edge" type="button" data-page="${cur + 1}" aria-label="Next page" ${cur === total ? 'disabled' : ''}>${chev('m9 6 6 6-6 6')}</button>`;
    pager.innerHTML = html;
  }

  let lastTotal = 1;
  function render() {
    const f = readFilters();
    const list = apply(f);
    const def = isDefault(f) && list.length > 0;
    const count = def ? CATALOG_TOTAL : list.length;
    const pages = def ? CATALOG_PAGES : Math.max(1, list.length <= PAGE1 ? 1 : 1 + Math.ceil((list.length - PAGE1) / PER_PAGE));
    lastTotal = pages;
    state.page = Math.min(Math.max(1, state.page), pages);

    const start = state.page === 1 ? 0 : PAGE1 + (state.page - 2) * PER_PAGE;
    const size = state.page === 1 ? PAGE1 : PER_PAGE;
    const items = [];
    for (let k = 0; k < size; k++) {
      const idx = start + k;
      if (def) items.push(list[idx % list.length]);          // notional catalog: cycle the sample data
      else if (idx < list.length) items.push(list[idx]);
    }

    const label = `${count} ${count === 1 ? 'Product' : 'Products'}`;
    if (countEl.textContent !== label) countEl.textContent = label;
    applyCount.textContent = count;

    grid.querySelectorAll('.card').forEach((c) => c.remove());
    const showPromo = state.page === 1 && items.length > 0;
    promo.hidden = !showPromo;
    items.forEach((p, i) => {
      const el = card(p, i);
      if (showPromo && i === 0) grid.insertBefore(el, promo);
      else grid.appendChild(el);
    });

    empty.hidden = items.length > 0;
    grid.hidden = items.length === 0;
    renderPager(items.length ? pages : 0);
  }

  /* ------------------------------------------------------------- Price UI */
  function syncPrice(e) {
    let lo = +minEl.value, hi = +maxEl.value;
    if (lo > hi - 10) {
      if (e && e.target === minEl) lo = minEl.value = hi - 10;
      else hi = maxEl.value = lo + 10;
    }
    track.style.setProperty('--min', `${(lo / PRICE_MAX) * 100}%`);
    track.style.setProperty('--max', `${(hi / PRICE_MAX) * 100}%`);
    minEl.style.zIndex = lo > PRICE_MAX / 2 ? 2 : 1;
    maxEl.style.zIndex = lo > PRICE_MAX / 2 ? 1 : 2;
    $('[data-price-min-label]').textContent = `$${lo}`;
    $('[data-price-max-label]').textContent = hi >= PRICE_MAX ? `$${PRICE_MAX}+` : `$${hi}`;
    minEl.setAttribute('aria-valuetext', `$${lo}`);
    maxEl.setAttribute('aria-valuetext', hi >= PRICE_MAX ? `$${PRICE_MAX} and up` : `$${hi}`);
  }
  let priceTimer;
  [minEl, maxEl].forEach((el) => el.addEventListener('input', (e) => {
    syncPrice(e);
    clearTimeout(priceTimer);
    priceTimer = setTimeout(() => { state.page = 1; render(); }, 140);
  }));

  /* --------------------------------------------------------- Category sync */
  function categoryValue() {
    const c = checked('category');
    return c.length === 1 ? c[0] : 'all';
  }
  function syncOut() {
    document.dispatchEvent(new CustomEvent('shop:category-sync', { detail: { category: categoryValue() } }));
  }
  document.addEventListener('shop:category', (e) => {
    const cat = e.detail && e.detail.category;
    if (cat !== 'all' && !CATS.includes(cat)) return;
    $$('input[name="category"]').forEach((i) => { i.checked = i.value === cat; });
    state.page = 1;
    render();
  });

  /* --------------------------------------------------------------- Events */
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    state.page = 1;
    render();
    if (e.target.name === 'category') syncOut();
  });
  $$('.size, .swatch').forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    state.page = 1;
    render();
  }));

  function clearFilters() {
    $$('input[name="availability"]').forEach((i) => { i.checked = i.value === 'in-stock'; });
    $$('input[name="category"]').forEach((i) => { i.checked = false; });
    $$('.size, .swatch').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    minEl.value = 0; maxEl.value = PRICE_MAX;
    syncPrice();
    state.page = 1;
    render();
    syncOut();
  }
  $$('[data-filters-clear]').forEach((b) => b.addEventListener('click', () => {
    const fromEmpty = b.closest('[data-empty]');
    clearFilters();
    if (fromEmpty) grid.querySelector('.card__link')?.focus();
  }));

  sortEl.addEventListener('change', () => { state.sort = sortEl.value; state.page = 1; render(); });

  $$('[data-view]').forEach((b) => b.addEventListener('click', () => {
    state.view = b.dataset.view;
    $$('[data-view]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    grid.classList.toggle('is-list', state.view === 'list');
  }));

  pager.addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    const n = +b.dataset.page;
    if (n < 1 || n > lastTotal || n === state.page) return;
    const wasEdge = b.classList.contains('pager__btn--edge');
    const edgeLabel = b.getAttribute('aria-label');
    state.page = n;
    render();
    // keep keyboard focus in the pager
    const next = wasEdge ? pager.querySelector(`[aria-label="${edgeLabel}"]:not(:disabled)`) : null;
    (next || pager.querySelector('[aria-current="page"]'))?.focus({ preventScroll: true });
    const top = root.getBoundingClientRect().top;
    if (top < 0) root.scrollIntoView({ block: 'start' });
  });

  grid.addEventListener('click', (e) => {
    const wish = e.target.closest('[data-wish]');
    if (wish) {
      const id = wish.dataset.wish;
      const on = !wishlist.has(id);
      on ? wishlist.add(id) : wishlist.delete(id);
      // update every rendered copy of this product
      grid.querySelectorAll(`[data-wish="${id}"]`).forEach((w) => w.setAttribute('aria-pressed', on));
      return;
    }
    const quick = e.target.closest('[data-quick]');
    if (quick) {
      if (quick.classList.contains('is-added')) return;
      document.dispatchEvent(new CustomEvent('cart:add', { detail: { id: quick.dataset.quick, qty: 1 } }));
      quick.classList.add('is-added');
      quick.innerHTML = 'Added <span aria-hidden="true">✓</span>';
      setTimeout(() => {
        quick.classList.remove('is-added');
        quick.innerHTML = 'Quick add <span aria-hidden="true">+</span>';
      }, 1600);
      return;
    }
    if (e.target.closest('.card__link')) e.preventDefault(); // no product pages yet
  });

  /* ------------------------------------------------------- Filter drawer */
  const drawer = $('[data-filters]');
  const backdrop = $('[data-filters-backdrop]');
  const openBtn = $('[data-filters-open]');
  const mq = matchMedia('(max-width: 900px)');
  let lastFocus = null;
  const focusables = () => $$('button:not([disabled]), input:not([disabled]), select, summary, a[href], [tabindex]:not([tabindex="-1"])', drawer)
    .filter((el) => el.offsetParent !== null || el === document.activeElement);

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'filters-title');
    drawer.removeAttribute('aria-label');
    backdrop.hidden = false;
    requestAnimationFrame(() => { drawer.classList.add('is-open'); backdrop.classList.add('is-open'); });
    openBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    setTimeout(() => $('[data-filters-close]', drawer).focus(), 30);
  }
  function closeDrawer(restore = true) {
    if (!drawer.classList.contains('is-open') && backdrop.hidden) return;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.removeAttribute('role');
    drawer.removeAttribute('aria-modal');
    drawer.removeAttribute('aria-labelledby');
    drawer.setAttribute('aria-label', 'Filters');
    openBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { backdrop.hidden = true; }, 320);
    if (restore) (lastFocus && document.contains(lastFocus) ? lastFocus : openBtn).focus();
  }
  openBtn.addEventListener('click', openDrawer);
  backdrop.addEventListener('click', () => closeDrawer());
  $$('[data-filters-close]', drawer).forEach((b) => b.addEventListener('click', () => closeDrawer()));
  mq.addEventListener('change', (e) => { if (!e.matches) closeDrawer(false); });

  /* ----------------------------------------------------------------- Init */
  syncPrice();
  render();
})();
