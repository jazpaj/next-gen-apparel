/* Cart: local bag (localStorage "nga-cart"), header badge, slide-in drawer, add toast.
   No backend — the drawer's Checkout button opens checkout.html (preview checkout).

   window.NGCart = { add(item), remove(key), setQty(key, qty), items(), count(), clear(), open(), close(), keyOf(item) }
   item = { id, name, price: number, image: url, size: string|null, color: string|null, qty: number = 1 }
   Line key = `${id}|${size || ''}|${color || ''}`; adding an existing key increments qty.
   document.dispatchEvent(new CustomEvent('cart:add', { detail: item })) also adds.
   Fires 'cart:change' on document ({ detail: { items, count, subtotal } }) after every change. */
(() => {
  const STORE = 'nga-cart';
  const MAX_QTY = 99;
  const money = (n) => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const str = (v) => (v === null || v === undefined || v === '' ? null : String(v));
  const keyOf = (it) => `${it.id}|${it.size || ''}|${it.color || ''}`;

  const normalize = (raw) => {
    if (!raw || raw.id === undefined || raw.id === null || raw.id === '') return null;
    const price = Number(raw.price);
    const qty = Math.floor(Number(raw.qty === undefined ? 1 : raw.qty));
    const it = {
      id: String(raw.id),
      name: String(raw.name || 'Item'),
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      image: typeof raw.image === 'string' ? raw.image : '',
      size: str(raw.size),
      color: str(raw.color),
      qty: Number.isFinite(qty) && qty > 0 ? Math.min(qty, MAX_QTY) : 1,
    };
    it.key = keyOf(it);
    return it;
  };

  /* Storage (optional — the bag still works in memory without it) */
  const load = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORE) || '[]');
      return Array.isArray(data) ? data.map(normalize).filter(Boolean) : [];
    } catch (e) { return []; }
  };
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(lines.map(({ key, ...rest }) => rest))); } catch (e) { /* no storage */ }
  };

  let lines = load();
  const find = (key) => lines.find(l => l.key === key);
  const count = () => lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = () => lines.reduce((n, l) => n + l.price * l.qty, 0);
  const snapshot = () => lines.map(l => ({ ...l }));

  /* DOM */
  const drawer = document.getElementById('cart-drawer');
  const openBtn = document.querySelector('[data-cart-open]');
  const badge = document.querySelector('[data-cart-badge]');
  const label = document.querySelector('[data-cart-label]');
  const live = document.querySelector('[data-cart-live]');
  const toastRegion = document.querySelector('[data-cart-toast]');
  const $ = (sel) => (drawer ? drawer.querySelector(sel) : null);
  const list = $('[data-cart-list]');
  const empty = $('[data-cart-empty]');
  const foot = $('[data-cart-foot]');
  const subEl = $('[data-cart-subtotal]');
  const headcount = $('[data-cart-headcount]');
  const msg = $('[data-cart-msg]');
  const onShop = /(^|\/)shop\.html$/.test(location.pathname);
  const itemsText = (n) => `${n} ${n === 1 ? 'item' : 'items'}`;

  let lastCount = count();
  const renderBadge = (announce) => {
    const n = count();
    if (badge) { badge.hidden = n === 0; badge.textContent = n > 99 ? '99+' : String(n); }
    if (label) label.textContent = `Bag, ${itemsText(n)}`;
    if (headcount) headcount.textContent = n ? `(${n})` : '';
    if (announce && live && n !== lastCount) live.textContent = `${itemsText(n)} in bag`;
    lastCount = n;
  };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  const renderLine = (l) => {
    const li = el('li', 'cart-line');
    li.dataset.key = l.key;
    const img = el('img', 'cart-line__img');
    img.alt = '';
    img.width = 88; img.height = 104;
    img.loading = 'lazy'; img.decoding = 'async';
    if (l.image) img.src = l.image;
    li.append(img);

    const info = el('div', 'cart-line__info');
    const top = el('div', 'cart-line__top');
    top.append(el('p', 'cart-line__name', l.name), el('p', 'cart-line__price', money(l.price * l.qty)));
    info.append(top);
    const meta = [l.size && `Size ${l.size}`, l.color].filter(Boolean).join(' / ');
    if (meta || l.qty > 1) {
      const m = el('p', 'cart-line__meta', meta);
      if (l.qty > 1) m.append(el('span', 'cart-line__each', `${money(l.price)} each`));
      info.append(m);
    }

    const row = el('div', 'cart-line__row');
    const qty = el('div', 'cart-qty');
    qty.setAttribute('role', 'group');
    qty.setAttribute('aria-label', `Quantity of ${l.name}`);
    const dec = el('button', 'cart-qty__btn', '−');
    dec.type = 'button'; dec.dataset.action = 'dec';
    dec.setAttribute('aria-label', `Decrease quantity of ${l.name}`);
    if (l.qty <= 1) dec.setAttribute('aria-disabled', 'true');
    const val = el('span', 'cart-qty__val', String(l.qty));
    const inc = el('button', 'cart-qty__btn', '+');
    inc.type = 'button'; inc.dataset.action = 'inc';
    inc.setAttribute('aria-label', `Increase quantity of ${l.name}`);
    if (l.qty >= MAX_QTY) inc.setAttribute('aria-disabled', 'true');
    qty.append(dec, val, inc);
    const rm = el('button', 'cart-line__remove', 'Remove');
    rm.type = 'button'; rm.dataset.action = 'remove';
    rm.setAttribute('aria-label', `Remove ${l.name} from bag`);
    row.append(qty, rm);
    info.append(row);
    li.append(info);
    return li;
  };

  const renderDrawer = () => {
    if (!list) return;
    const has = lines.length > 0;
    list.replaceChildren(...lines.map(renderLine));
    list.hidden = !has;
    empty.hidden = has;
    foot.hidden = !has;
    subEl.textContent = money(subtotal());
  };

  const changed = (announce = true) => {
    save();
    renderBadge(announce);
    renderDrawer();
    if (msg) msg.textContent = '';
    document.dispatchEvent(new CustomEvent('cart:change', { detail: { items: snapshot(), count: count(), subtotal: subtotal() } }));
  };

  /* Public API */
  const add = (raw) => {
    const it = normalize(raw);
    if (!it) return null;
    const existing = find(it.key);
    if (existing) existing.qty = Math.min(existing.qty + it.qty, MAX_QTY);
    else lines.push(it);
    changed();
    toast(it.name);
    return { ...(existing || it) };
  };
  const remove = (key) => {
    const before = lines.length;
    lines = lines.filter(l => l.key !== key);
    if (lines.length !== before) changed();
  };
  const setQty = (key, q) => {
    const l = find(key);
    if (!l) return;
    q = Math.floor(Number(q));
    if (!Number.isFinite(q) || q <= 0) { remove(key); return; }
    q = Math.min(q, MAX_QTY);
    if (q === l.qty) return;
    l.qty = q;
    changed();
  };
  const clear = () => { if (lines.length) { lines = []; changed(); } };

  const open = (opener) => drawer && window.NGDialog && window.NGDialog.open(drawer, opener || openBtn);
  const close = () => drawer && window.NGDialog && window.NGDialog.close(drawer);

  window.NGCart = { add, remove, setQty, items: snapshot, count, clear, open, close, keyOf };
  document.addEventListener('cart:add', (e) => add(e.detail));

  /* Drawer controls */
  openBtn && openBtn.addEventListener('click', () => {
    const search = document.getElementById('header-search');
    const toggle = document.querySelector('[data-search-toggle]');
    if (search && !search.hidden) { search.hidden = true; toggle && toggle.setAttribute('aria-expanded', 'false'); document.querySelector('[data-header]')?.classList.remove('is-search-open'); }
    open(openBtn);
  });

  if (list) {
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
      const li = btn.closest('.cart-line');
      const key = li.dataset.key;
      const l = find(key);
      if (!l) return;
      const action = btn.dataset.action;
      const idx = lines.indexOf(l);
      if (action === 'remove') remove(key);
      else setQty(key, l.qty + (action === 'inc' ? 1 : -1));
      // Re-rendering replaces the buttons; put focus back somewhere sensible.
      const sameLine = [...list.children].find(n => n.dataset.key === key);
      let target = sameLine && sameLine.querySelector(`[data-action="${action}"]`);
      if (target && target.getAttribute('aria-disabled') === 'true') target = sameLine.querySelector('[data-action]:not([aria-disabled="true"])');
      if (!target && action === 'remove') {
        const next = list.children[Math.min(idx, list.children.length - 1)];
        target = next ? next.querySelector('[data-action="remove"]') : empty.querySelector('a');
      }
      target && target.focus();
    });

    // Footer (with this button) is hidden while the bag is empty; guard anyway.
    $('[data-cart-checkout]').addEventListener('click', () => {
      if (!lines.length) return;
      location.href = 'checkout.html';
    });
    const stayOnShop = (e) => {
      if (!onShop || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      e.preventDefault();
      close();
    };
    $('[data-cart-continue]').addEventListener('click', stayOnShop);
    $('[data-cart-shopnow]').addEventListener('click', stayOnShop);
    drawer.addEventListener('dialog:close', () => { msg.textContent = ''; });
  }

  /* Toast: "Added to bag — <name>" + VIEW BAG */
  let toastTimer, hideToast = () => {};
  drawer && drawer.addEventListener('dialog:open', () => hideToast());
  function toast(name) {
    if (!toastRegion) return;
    clearTimeout(toastTimer);
    const t = el('div', 'cart-toast');
    const text = el('p', 'cart-toast__text');
    text.append(el('span', 'cart-toast__label', 'Added to bag'), document.createTextNode(' — '), el('span', 'cart-toast__name', name));
    const view = el('button', 'cart-toast__btn', 'View bag');
    view.type = 'button';
    view.addEventListener('click', () => { hide(); open(openBtn); });
    t.append(text, view);
    toastRegion.replaceChildren(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-visible')));
    let paused = false;
    const schedule = () => { clearTimeout(toastTimer); toastTimer = setTimeout(() => { if (!paused) hide(); }, 4000); };
    t.addEventListener('mouseenter', () => { paused = true; clearTimeout(toastTimer); });
    t.addEventListener('mouseleave', () => { paused = false; schedule(); });
    t.addEventListener('focusin', () => { paused = true; clearTimeout(toastTimer); });
    t.addEventListener('focusout', () => { paused = false; schedule(); });
    schedule();
    hideToast = hide;
    function hide() {
      clearTimeout(toastTimer);
      t.classList.remove('is-visible');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => t.remove(), reduced ? 0 : 320);
    }
  }

  /* Keep tabs in sync */
  window.addEventListener('storage', (e) => {
    if (e.key !== STORE && e.key !== null) return;
    lines = load();
    renderBadge(true);
    renderDrawer();
  });

  renderBadge(false);
  renderDrawer();
})();
