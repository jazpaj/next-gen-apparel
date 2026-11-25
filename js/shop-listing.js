/* Shop listing: filters, sorting, pagination, grid/list view, wishlist, filter drawer,
   search (?q=), quick view dialog (?product=<id>), quick add.
   Cart contract: dispatches 'cart:add' on document with
   { id, name, price, image, size, color, qty } — js/cart.js owns the bag + toast. */
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
  const DESC = {
    'v01-tech-hoodie': 'Our signature 420gsm brushed-back fleece with a scuba hood, bonded zip pockets and the /// mark at the chest. Boxy through the body, dropped at the shoulder.',
    'graphic-tee-02': 'Heavyweight 260gsm cotton tee with a cracked-ink X graphic screen-printed by hand. Boxy cut with a tight ribbed collar that holds its shape.',
    'cargo-pants': 'Wide-leg cargos in a dense cotton twill with bellowed thigh pockets and adjustable ankle cinches. Built to stack over sneakers.',
    'utility-jacket': 'A water-resistant shell in bone with taped seams, storm flap and four utility pockets. Light enough to layer, tough enough for weather.',
    'signature-cap': 'Six-panel structured cap with the /// mark embroidered in 3D. Curved brim and an adjustable metal clasp at the back.',
    'tech-sling-bag': 'A 4L crossbody in coated ripstop with a signal-orange zip channel, quick-release buckle and padded phone sleeve.',
    'v02-shell-hoodie': 'A hooded overlayer in a soft-shell bonded fleece that blocks wind and sheds light rain. Laser-cut vents under the arms.',
    'graphic-tee-03-bone': 'The 03 graphic in tonal ink on an undyed bone body. Heavyweight 260gsm cotton, garment-washed for a lived-in hand.',
    'ripstop-cargo-olive': 'Olive ripstop cargos with articulated knees, hidden zip pockets and a gusseted crotch for full range of movement.',
    'field-jacket-olive': 'A four-pocket field jacket in waxed olive cotton with a corduroy-lined collar and snap-down storm cuffs.',
    'core-cap-orange': 'The core six-panel in signal orange with a tonal embroidered logo and an unstructured, broken-in crown.',
    'crossbody-sling-grey': 'A slim crossbody in grey nylon with two zip compartments and a webbing strap that adjusts with one pull.',
    'v01-tech-hoodie-signal': 'The V-01 Tech Hoodie in signal orange — same brushed-back fleece, scuba hood and bonded pockets, louder colour.',
    'boxy-tee-01': 'An everyday boxy tee in 220gsm combed cotton. Short body, wide sleeves, no graphics — the base layer for everything.',
    'tech-jogger': 'A tapered jogger in four-way stretch nylon with zip hand pockets and a bungee-cinch hem. Moves like sweats, looks sharper.',
    'storm-shell-jacket': 'A 3-layer waterproof shell rated 20K with fully taped seams, pit zips and a helmet-compatible hood.',
    'heavyweight-hoodie-bone': 'A 500gsm loopback hoodie in undyed bone with a double-layer hood and no drawcords for a clean, heavy drape.',
    'utility-tee-grey': 'A grey marl tee with a reinforced chest utility pocket and bar-tacked seams. Heavyweight cotton, relaxed fit.',
    'six-pocket-pant': 'Black six-pocket pants in brushed cotton sateen with a straight leg and an adjustable buckle waist.',
    'waxed-cap-olive': 'A waxed cotton cap in olive that sheds light rain and patinas with wear. Leather strap with a brass buckle.',
    'v03-gore-hoodie': 'The V-03 in a waterproof membrane fleece with welded seams and a laminated chest pocket. Shipping with the December drop.',
    'expedition-parka': 'An insulated expedition parka with a 700-fill synthetic core, removable hood baffle and eight pockets. Built for real cold.',
    'graphic-tee-04-signal': 'The 04 graphic printed in black on a signal-orange heavyweight body. Limited run, shipping with the December drop.',
    'modular-sling-pack': 'A modular sling with a detachable hip pouch, MOLLE webbing and a weather-sealed main zip. Wear it three ways.',
  };
  const PRODUCTS = RAW.map(([id, name, category, price, colors, sizes, stock, date, popularity, img]) => ({
    id, name, category, price, colors, sizes, stock, date: Date.parse(date), popularity, img: IMG[img], desc: DESC[id] || '',
  }));
  const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
  const ONE_SIZE = 'One size';
  const isOneSize = (p) => p.sizes.length === 1 && p.sizes[0] === 'OS';
  const colorName = (c) => c.charAt(0).toUpperCase() + c.slice(1);

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
  const searchBar = $('[data-search]');
  const emptyTitle = $('[data-empty-title]');
  const emptyText = $('[data-empty-text]');
  const EMPTY_COPY = [emptyTitle.textContent, emptyText.textContent];
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
    query: (params.get('q') || '').trim().slice(0, 80),
  };
  sortEl.value = state.sort;
  // A search covers the whole catalog, so include pre-orders (reverted on "clear search" if untouched)
  let searchWidened = false;
  if (state.query) {
    $$('input[name="availability"]').forEach((i) => { i.checked = true; });
    searchWidened = true;
  }

  function setUrlParam(key, value) {
    try {
      const url = new URL(location.href);
      if (value == null || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
      if (url.href !== location.href) history.replaceState(history.state, '', url);
    } catch (_) { /* file:// in some browsers — URL sync is a nice-to-have */ }
  }

  /* ------------------------------------------------------------ Filters */
  const checked = (name) => $$(`input[name="${name}"]:checked`).map((i) => i.value);
  const pressed = (sel, attr) => $$(`${sel}[aria-pressed="true"]`, form).map((b) => b.dataset[attr]);

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
  const catLabel = { hoodies: 'Hoodie', jackets: 'Jacket', tees: 'Tee', pants: 'Pants', accessories: 'Accessory' };
  function matchesQuery(p, q) {
    if (!q) return true;
    return [p.name, p.category, catLabel[p.category], ...p.colors].some((s) => s.toLowerCase().includes(q));
  }
  function apply(f) {
    const q = state.query.toLowerCase();
    const list = PRODUCTS.filter((p) =>
      matchesQuery(p, q) &&
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
        <h3 class="card__name"><a class="card__link" href="shop.html?product=${encodeURIComponent(p.id)}" data-product="${p.id}">${n}</a></h3>
        <p class="card__price">${money(p.price)}</p>
        <p class="card__meta">${catLabel[p.category]} · ${p.colors.map(colorName).join(' / ')} · ${isOneSize(p) ? ONE_SIZE : p.sizes.join(' ')}</p>
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
    const def = isDefault(f) && !state.query && list.length > 0;
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

    // search results bar + empty-state copy
    searchBar.hidden = !state.query;
    if (state.query) {
      $('[data-search-term]').textContent = state.query;
      $('[data-search-count]').textContent = label;
    }
    $$('[data-search-clear]', empty).forEach((b) => { b.hidden = !state.query; });
    if (state.query && !list.length) {
      emptyTitle.textContent = `No products match “${state.query}”.`;
      emptyText.textContent = 'Check the spelling, try a broader term like “hoodie” or “black”, or clear your filters.';
    } else {
      [emptyTitle.textContent, emptyText.textContent] = EMPTY_COPY;
    }

    grid.querySelectorAll('.card').forEach((c) => c.remove());
    const showPromo = state.page === 1 && items.length > 0 && !state.query;
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
  $$('.size, .swatch', form).forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    state.page = 1;
    render();
  }));

  function clearFilters() {
    $$('input[name="availability"]').forEach((i) => { i.checked = i.value === 'in-stock'; });
    $$('input[name="category"]').forEach((i) => { i.checked = false; });
    $$('.size, .swatch', form).forEach((b) => b.setAttribute('aria-pressed', 'false'));
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

  /* ------------------------------------------------------------ Wishlist */
  function setWish(id, on) {
    on ? wishlist.add(id) : wishlist.delete(id);
    // update every rendered copy of this product, plus the quick view
    grid.querySelectorAll(`[data-wish="${id}"]`).forEach((w) => w.setAttribute('aria-pressed', on));
    if (qv.id === id) syncQvWish();
  }

  /* ------------------------------------------------------------ Cart add */
  function defaultSize(p) {
    if (isOneSize(p)) return ONE_SIZE;
    const filtered = pressed('.size', 'size').find((s) => p.sizes.includes(s));
    return filtered || (p.sizes.includes('M') ? 'M' : p.sizes[0]);
  }
  function addToCart(p, { size, color, qty }) {
    document.dispatchEvent(new CustomEvent('cart:add', {
      detail: {
        id: p.id, name: p.name, price: p.price, image: p.img[0],
        size: size || null, color: color ? colorName(color) : null, qty,
      },
    }));
  }

  const QUICK_LABEL = 'Quick add <span aria-hidden="true">+</span>';
  grid.addEventListener('click', (e) => {
    const wish = e.target.closest('[data-wish]');
    if (wish) {
      setWish(wish.dataset.wish, !wishlist.has(wish.dataset.wish));
      return;
    }
    const quick = e.target.closest('[data-quick]');
    if (quick) {
      if (quick.classList.contains('is-added')) return;
      const p = BY_ID.get(quick.dataset.quick);
      if (!p) return;
      addToCart(p, { size: defaultSize(p), color: p.colors[0], qty: 1 });
      quick.classList.add('is-added');
      quick.innerHTML = 'Added <span aria-hidden="true">✓</span>';
      setTimeout(() => {
        quick.classList.remove('is-added');
        quick.innerHTML = QUICK_LABEL;
      }, 1500);
      return;
    }
    const link = e.target.closest('.card__link');
    if (link) {
      // let modified clicks open the shareable URL in a new tab
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openQv(link.dataset.product, link);
    }
  });

  /* -------------------------------------------------------------- Search */
  function clearSearch() {
    state.query = '';
    setUrlParam('q', null);
    if (searchWidened && checked('availability').length === 2) {
      $$('input[name="availability"]').forEach((i) => { i.checked = i.value === 'in-stock'; });
    }
    searchWidened = false;
    state.page = 1;
    render();
    (grid.querySelector('.card__link') || sortEl).focus({ preventScroll: true });
  }
  $$('[data-search-clear]').forEach((b) => b.addEventListener('click', clearSearch));

  /* --------------------------------------------------------------- Promo */
  // "New Arrivals": newest first incl. upcoming pre-order drops, without a page reload
  promo.querySelector('a').addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    $$('input[name="availability"]').forEach((i) => { i.checked = true; });
    state.sort = sortEl.value = 'newest';
    state.page = 1;
    setUrlParam('sort', 'newest');
    render();
    if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start' });
    grid.querySelector('.card__link')?.focus({ preventScroll: true });
  });

  /* ---------------------------------------------------------- Quick view */
  const qvRoot = $('[data-qv]');
  const qvPanel = $('[data-qv-panel]', qvRoot);
  const qvAdd = $('[data-qv-add]', qvRoot);
  const qvWish = $('[data-qv-wish]', qvRoot);
  const qvQty = $('[data-qty]', qvRoot);
  const qvError = $('[data-qv-error]', qvRoot);
  const qvSizes = $('[data-qv-sizes]', qvRoot);
  const qvColors = $('[data-qv-colors]', qvRoot);
  const qv = { id: null, size: null, color: null, opener: null, timer: 0, closeTimer: 0 };
  const swatchStyle = (c) => form.querySelector(`.swatch[data-color="${c}"]`)?.getAttribute('style') || '--swatch: var(--c-surface)';
  const QV_ADD_LABEL = 'Add to bag';

  function syncQvWish() {
    const p = BY_ID.get(qv.id);
    const on = wishlist.has(qv.id);
    qvWish.setAttribute('aria-pressed', on);
    qvWish.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${p.name} ${on ? 'from' : 'to'} wishlist`);
  }
  function setQty(n) {
    const v = Math.min(10, Math.max(1, Math.round(+n) || 1));
    qvQty.value = v;
    $('[data-qty-step="-1"]', qvRoot).disabled = v <= 1;
    $('[data-qty-step="1"]', qvRoot).disabled = v >= 10;
    return v;
  }
  function showSizeError(on) {
    qvError.hidden = !on;
    qvSizes.classList.toggle('is-invalid', on);
    if (on) qvSizes.setAttribute('aria-describedby', 'qv-size-error');
    else qvSizes.removeAttribute('aria-describedby');
  }
  function pickSize(s) {
    qv.size = s;
    $$('[data-qv-size]', qvSizes).forEach((b) => b.setAttribute('aria-pressed', b.dataset.qvSize === s));
    $('[data-qv-size-name]', qvRoot).textContent = s ? `— ${s}` : '';
    if (s) showSizeError(false);
  }
  function pickColor(c) {
    qv.color = c;
    $$('[data-qv-color]', qvColors).forEach((b) => b.setAttribute('aria-pressed', b.dataset.qvColor === c));
    $('[data-qv-color-name]', qvRoot).textContent = `— ${colorName(c)}`;
  }
  function resetAdd() {
    clearTimeout(qv.timer);
    qvAdd.classList.remove('is-added');
    qvAdd.textContent = QV_ADD_LABEL;
  }

  function fillQv(p) {
    const [src, w, h] = p.img;
    const img = $('[data-qv-img]', qvRoot);
    img.src = src; img.width = w; img.height = h; img.alt = p.name;
    $('[data-qv-tag]', qvRoot).hidden = p.stock !== 'pre-order';
    $('[data-qv-cat]', qvRoot).textContent = colorName(p.category);
    $('[data-qv-title]', qvRoot).textContent = p.name;
    $('[data-qv-price]', qvRoot).textContent = money(p.price);
    $('[data-qv-desc]', qvRoot).textContent = p.desc;
    $('[data-qv-ship]', qvRoot).textContent = p.stock === 'pre-order'
      ? `Pre-order · ships ${new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
      : 'In stock · ships in 1–2 business days';

    qvColors.innerHTML = p.colors.map((c) =>
      `<button class="swatch" type="button" aria-pressed="false" aria-label="${colorName(c)}" data-qv-color="${c}" style="${swatchStyle(c)}"></button>`).join('');
    const sizes = isOneSize(p) ? [ONE_SIZE] : p.sizes;
    qvSizes.innerHTML = sizes.map((s) =>
      `<button class="size${s === ONE_SIZE ? ' size--wide' : ''}" type="button" aria-pressed="false" data-qv-size="${s}">${s}</button>`).join('');

    const filtered = pressed('.size', 'size').filter((s) => p.sizes.includes(s));
    const filteredColor = pressed('.swatch', 'color').find((c) => p.colors.includes(c));
    pickColor(filteredColor || p.colors[0]);
    pickSize(isOneSize(p) ? ONE_SIZE : (filtered.length === 1 ? filtered[0] : null));
    showSizeError(false);
    setQty(1);
    resetAdd();
    syncQvWish();
  }

  const qvFocusables = () => $$('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])', qvPanel)
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
  function onQvKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeQv(); return; }
    if (e.key !== 'Tab') return;
    const f = qvFocusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !qvPanel.contains(document.activeElement) || document.activeElement === qvPanel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !qvPanel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  }

  function openQv(id, opener) {
    const p = BY_ID.get(id);
    if (!p) return false;
    const wasOpen = !qvRoot.hidden && qvRoot.classList.contains('is-open');
    qv.id = id;
    if (!wasOpen) qv.opener = opener || document.activeElement;
    fillQv(p);
    setUrlParam('product', id);
    if (wasOpen) return true;
    clearTimeout(qv.closeTimer);
    qvRoot.hidden = false;
    qvPanel.scrollTop = 0;
    void qvRoot.offsetWidth; // commit the hidden state so the enter transition runs
    qvRoot.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onQvKey);
    qvPanel.focus({ preventScroll: true });
    return true;
  }
  function closeQv() {
    if (qvRoot.hidden) return;
    qvRoot.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onQvKey);
    setUrlParam('product', null);
    resetAdd();
    qv.closeTimer = setTimeout(() => { qvRoot.hidden = true; }, 320);
    // return focus to the opener, or to this product's card if the dialog came from the URL
    let target = qv.opener && document.contains(qv.opener) && qv.opener !== document.body ? qv.opener : null;
    if (!target) target = grid.querySelector(`.card__link[data-product="${qv.id}"]`) || grid.querySelector('.card__link');
    target?.focus({ preventScroll: true });
    qv.opener = null;
    qv.id = null;
  }

  qvRoot.addEventListener('click', (e) => {
    if (e.target.closest('[data-qv-close]')) { closeQv(); return; }
    const sw = e.target.closest('[data-qv-color]');
    if (sw) { pickColor(sw.dataset.qvColor); return; }
    const sz = e.target.closest('[data-qv-size]');
    if (sz) { pickSize(sz.dataset.qvSize); return; }
    const step = e.target.closest('[data-qty-step]');
    if (step) { setQty(+qvQty.value + +step.dataset.qtyStep); return; }
  });
  qvQty.addEventListener('change', () => setQty(qvQty.value));
  qvQty.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); setQty(qvQty.value); } });
  qvWish.addEventListener('click', () => setWish(qv.id, !wishlist.has(qv.id)));
  qvAdd.addEventListener('click', () => {
    const p = BY_ID.get(qv.id);
    if (!p) return;
    if (!qv.size) {
      showSizeError(true);
      $('[data-qv-size]', qvSizes)?.focus();
      return;
    }
    addToCart(p, { size: qv.size, color: qv.color, qty: setQty(qvQty.value) });
    resetAdd();
    qvAdd.classList.add('is-added');
    qvAdd.innerHTML = 'Added <span aria-hidden="true">✓</span>';
    qv.timer = setTimeout(resetAdd, 1800);
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
  const initialProduct = params.get('product');
  if (initialProduct && !openQv(initialProduct, null)) setUrlParam('product', null);
})();
