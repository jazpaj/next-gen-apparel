/* Checkout (preview store — nothing is sent anywhere).
   Reads the bag from NGCart, prices it (promo NEXTGEN10 = 10% off subtotal,
   standard shipping free at $150+ after discount), validates the form, saves the
   order with NGOrders.create(), clears the bag and swaps in a confirmation view.
   checkout.html?order=NGA-123456 re-opens the confirmation for a saved order. */
(() => {
  const root = document.querySelector('[data-checkout]');
  if (!root || !window.NGCart || !window.NGOrders) return;

  const Cart = window.NGCart;
  const Orders = window.NGOrders;
  const money = Orders.money;
  const SHIP = Orders.SHIPPING;
  const PROMOS = { NEXTGEN10: 0.10 };
  const PROMO_KEY = 'nga-promo';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^(?:09\d{9}|\+639\d{9})$/;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const round2 = (n) => Math.round(n * 100) / 100;
  const $ = (sel, ctx = root) => ctx.querySelector(sel);
  const $$ = (sel, ctx = root) => Array.from(ctx.querySelectorAll(sel));

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  const layout = $('[data-co-layout]');
  const emptyView = $('[data-co-empty]');
  const steps = $('[data-co-steps]');
  const confirmView = $('[data-co-confirm]');
  const form = $('[data-co-form]');
  const errorsBox = $('[data-co-errors]');
  const linesEl = $('[data-co-lines]');

  /* Dates ------------------------------------------------------------------ */
  const addBusinessDays = (ts, n) => {
    const d = new Date(ts);
    while (n > 0) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n--; }
    return d.getTime();
  };
  const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtRange = (from, to) => `${fmtDay(from)} – ${fmtDay(to)}`;
  const etaFor = (method, from = Date.now()) => {
    const m = SHIP[method] || SHIP.standard;
    return { from: addBusinessDays(from, m.days[0]), to: addBusinessDays(from, m.days[1]) };
  };

  /* Pricing ---------------------------------------------------------------- */
  let promo = null;
  try { const p = sessionStorage.getItem(PROMO_KEY); if (p && PROMOS[p]) promo = p; } catch (e) { /* no storage */ }
  const savePromo = () => {
    try { promo ? sessionStorage.setItem(PROMO_KEY, promo) : sessionStorage.removeItem(PROMO_KEY); } catch (e) { /* no storage */ }
  };

  const method = () => (form.elements.shippingMethod.value === 'express' ? 'express' : 'standard');
  const shippingCost = (m, afterDiscount) => {
    const s = SHIP[m];
    return s.freeOver !== null && afterDiscount >= s.freeOver ? 0 : s.price;
  };
  const totals = () => {
    const items = Cart.items();
    const subtotal = round2(items.reduce((n, l) => n + l.price * l.qty, 0));
    const discount = promo ? round2(subtotal * PROMOS[promo]) : 0;
    const after = round2(subtotal - discount);
    const m = method();
    const shipping = shippingCost(m, after);
    return { items, subtotal, discount, after, shipping, total: round2(after + shipping), method: m };
  };

  /* Summary rendering ------------------------------------------------------ */
  const metaText = (l) => [l.size && `Size ${l.size}`, l.color].filter(Boolean).join(' / ');

  const lineEl = (l, editable) => {
    const li = el('li', 'co-line' + (editable ? '' : ' co-line--static'));
    if (l.key) li.dataset.key = l.key;
    const img = el('img', 'co-line__img');
    img.alt = ''; img.width = 68; img.height = 82; img.decoding = 'async';
    if (l.image) img.src = l.image;
    const info = el('div', 'co-line__info');
    const top = el('div', 'co-line__top');
    top.append(el('p', 'co-line__name', l.name), el('p', 'co-line__price', money(l.price * l.qty)));
    info.append(top);
    const meta = metaText(l);
    const metaLine = [meta, editable ? (l.qty > 1 ? `${money(l.price)} each` : '') : `Qty ${l.qty}`].filter(Boolean).join(' · ');
    if (metaLine) info.append(el('p', 'co-line__meta', metaLine));
    if (editable) {
      const row = el('div', 'co-line__row');
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
      if (l.qty >= 99) inc.setAttribute('aria-disabled', 'true');
      qty.append(dec, val, inc);
      const rm = el('button', 'cart-line__remove', 'Remove');
      rm.type = 'button'; rm.dataset.action = 'remove';
      rm.setAttribute('aria-label', `Remove ${l.name} from bag`);
      row.append(qty, rm);
      info.append(row);
    }
    li.append(img, info);
    return li;
  };

  const setAll = (sel, text) => $$(sel).forEach((n) => { n.textContent = text; });

  const renderTotals = () => {
    const t = totals();
    const n = t.items.reduce((c, l) => c + l.qty, 0);
    setAll('[data-co-count]', n ? `(${n})` : '');
    setAll('[data-co-subtotal]', money(t.subtotal));
    $('[data-co-discount-row]').hidden = !t.discount;
    setAll('[data-co-discount]', '−' + money(t.discount));
    setAll('[data-co-discount-code]', promo ? `(${promo})` : '');
    setAll('[data-co-ship-name]', SHIP[t.method].label);
    setAll('[data-co-shipping]', t.shipping ? money(t.shipping) : 'Free');
    setAll('[data-co-total]', money(t.total));
    setAll('[data-co-total-label]', money(t.total));

    // Method cards: standard price + free-shipping nudge, delivery windows
    const stdFree = shippingCost('standard', t.after) === 0;
    const stdPrice = $('[data-co-ship-price="standard"]');
    stdPrice.textContent = stdFree ? 'Free' : money(SHIP.standard.price);
    stdPrice.classList.toggle('is-free', stdFree);
    const gap = round2(SHIP.standard.freeOver - t.after);
    $('[data-co-free-hint]').textContent = stdFree ? '' : `Add ${money(gap)} more for free standard shipping.`;
    ['standard', 'express'].forEach((m) => {
      const e = etaFor(m);
      setAll(`[data-co-eta="${m}"]`, `Arrives ${fmtRange(e.from, e.to)}`);
    });
  };

  const renderLines = () => {
    linesEl.replaceChildren(...Cart.items().map((l) => lineEl(l, true)));
  };

  const renderPromo = () => {
    const applied = $('[data-co-promo-applied]');
    const pform = $('[data-co-promo-form]');
    applied.hidden = !promo;
    pform.hidden = !!promo;
    setAll('[data-co-promo-code]', promo || '');
  };

  let placed = false;
  const renderCheckout = () => {
    if (placed) return;
    const has = Cart.count() > 0;
    layout.hidden = !has;
    steps.hidden = !has;
    emptyView.hidden = has;
    if (!has) return;
    renderLines();
    renderPromo();
    renderTotals();
  };

  /* Qty / remove in the summary ------------------------------------------- */
  linesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    const li = btn.closest('.co-line');
    const key = li.dataset.key;
    const line = Cart.items().find((l) => l.key === key);
    if (!line) return;
    const action = btn.dataset.action;
    const idx = Array.from(linesEl.children).indexOf(li);
    if (action === 'remove') Cart.remove(key);
    else Cart.setQty(key, line.qty + (action === 'inc' ? 1 : -1));
    // cart:change re-rendered the list; restore focus sensibly
    const same = Array.from(linesEl.children).find((n) => n.dataset.key === key);
    let target = same && same.querySelector(`[data-action="${action}"]`);
    if (target && target.getAttribute('aria-disabled') === 'true') target = same.querySelector('[data-action]:not([aria-disabled="true"])');
    if (!target && action === 'remove') {
      const next = linesEl.children[Math.min(idx, linesEl.children.length - 1)];
      target = next ? next.querySelector('[data-action="remove"]') : emptyView.querySelector('a');
    }
    target && target.focus();
  });
  document.addEventListener('cart:change', renderCheckout);

  /* Promo ------------------------------------------------------------------ */
  const promoForm = $('[data-co-promo-form]');
  const promoInput = $('#co-promo');
  const promoErr = $('#co-promo-error');
  const promoStatus = $('[data-co-promo-status]');
  const promoError = (msg) => {
    promoInput.setCustomValidity(msg);
    if (msg) promoInput.setAttribute('aria-invalid', 'true'); else promoInput.removeAttribute('aria-invalid');
    promoErr.textContent = msg;
    promoErr.hidden = !msg;
  };
  promoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    promoError('');
    const code = promoInput.value.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) { promoError('Enter a promo code.'); promoInput.focus(); return; }
    if (!PROMOS[code]) { promoError(`“${code}” isn’t a valid code.`); promoInput.focus(); return; }
    promo = code;
    savePromo();
    promoInput.value = '';
    renderPromo();
    renderTotals();
    promoStatus.textContent = `Promo ${code} applied: 10% off.`;
    $('[data-co-promo-remove]').focus();
  });
  promoInput.addEventListener('input', () => { if (promoInput.getAttribute('aria-invalid') === 'true') promoError(''); });
  $('[data-co-promo-remove]').addEventListener('click', () => {
    promo = null;
    savePromo();
    renderPromo();
    renderTotals();
    promoStatus.textContent = 'Promo code removed.';
    promoInput.focus();
  });

  form.addEventListener('change', (e) => { if (e.target.name === 'shippingMethod') renderTotals(); });

  /* Steps: highlight the section being worked on -------------------------- */
  const stepItems = $$('.co-steps__item');
  const setStep = (n) => {
    stepItems.forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle('is-active', s === n);
      li.classList.toggle('is-done', s < n);
      if (s === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  };
  form.addEventListener('focusin', (e) => {
    const set = e.target.closest('fieldset[data-step]');
    if (set) setStep(Number(set.dataset.step));
  });
  steps.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const set = document.querySelector(a.getAttribute('href'));
    if (!set) return;
    e.preventDefault();
    const first = set.querySelector('input:not([disabled]):not([readonly]), select');
    set.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    first && first.focus({ preventScroll: true });
  });

  /* Validation ------------------------------------------------------------- */
  const regionSel = form.elements.region;
  const regionField = regionSel.closest('.co-field');
  const syncSelect = () => regionField.classList.toggle('is-filled', regionSel.value !== '');
  regionSel.addEventListener('change', syncSelect);
  syncSelect();

  const LABELS = {
    email: 'Email', firstName: 'First name', lastName: 'Last name', phone: 'Mobile number',
    line1: 'Address', city: 'City / municipality', region: 'Province / region', postal: 'Postal code',
  };
  const errorFor = (input) => {
    const v = input.value.trim();
    switch (input.name) {
      case 'email':
        if (!v) return 'Please enter your email address.';
        return EMAIL_RE.test(v) ? '' : 'Please enter a valid email address, like name@example.com.';
      case 'firstName': return v ? '' : 'Please enter your first name.';
      case 'lastName': return v ? '' : 'Please enter your last name.';
      case 'phone':
        if (!v) return 'Please enter your mobile number.';
        return PHONE_RE.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a PH mobile number: 09XX XXX XXXX or +63 9XX XXX XXXX.';
      case 'line1': return v ? '' : 'Please enter your street address.';
      case 'city': return v ? '' : 'Please enter your city or municipality.';
      case 'region': return v ? '' : 'Please choose your province or region.';
      case 'postal':
        if (!v) return 'Please enter your postal code.';
        return /^\d{4}$/.test(v) ? '' : 'Postal codes in the Philippines have 4 digits.';
      default: return '';
    }
  };
  const fields = Object.keys(LABELS).map((n) => form.elements[n]);

  function validate(input) {
    input.setCustomValidity('');            // clear before re-checking
    const msg = errorFor(input);
    input.setCustomValidity(msg);
    const err = document.getElementById(input.id + '-error');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = msg;
      err.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      err.textContent = '';
      err.hidden = true;
    }
    return !msg;
  }

  fields.forEach((input) => {
    const live = () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        validate(input);
        if (!errorsBox.hidden) refreshSummary();
      }
    };
    input.addEventListener('input', live);
    input.addEventListener('change', live);
    input.addEventListener('blur', () => { if (input.value.trim()) validate(input); });
  });
  form.elements.postal.addEventListener('input', (e) => {
    const t = e.target, digits = t.value.replace(/\D/g, '').slice(0, 4);
    if (t.value !== digits) t.value = digits;
  });

  const showErrors = (invalid) => {
    errorsBox.replaceChildren();
    if (!invalid.length) { errorsBox.hidden = true; return; }
    const title = el('p', 'co-errors__title', invalid.length === 1 ? 'Please fix 1 problem' : `Please fix ${invalid.length} problems`);
    const list = el('ul', 'co-errors__list');
    invalid.forEach((input) => {
      const li = el('li');
      const a = el('a', '', `${LABELS[input.name]}: ${input.validationMessage || errorFor(input)}`);
      a.href = '#' + input.id;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        input.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        input.focus({ preventScroll: true });
      });
      li.append(a);
      list.append(li);
    });
    errorsBox.append(title, list);
    errorsBox.hidden = false;
  };
  function refreshSummary() { showErrors(fields.filter((f) => f.getAttribute('aria-invalid') === 'true')); }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Cart.count()) { renderCheckout(); return; }
    const invalid = fields.filter((f) => !validate(f));
    showErrors(invalid);
    if (invalid.length) {
      const first = invalid[0];
      first.scrollIntoView({ behavior: 'auto', block: 'center' });
      first.focus({ preventScroll: true });
      return;
    }
    placeOrder();
  });

  /* Place order ------------------------------------------------------------ */
  function placeOrder() {
    const f = form.elements;
    const t = totals();
    const order = Orders.create({
      email: f.email.value.trim().toLowerCase(),
      items: t.items.map(({ id, name, price, image, size, color, qty }) => ({ id, name, price, image, size, color, qty })),
      subtotal: t.subtotal,
      discount: t.discount,
      shipping: t.shipping,
      total: t.total,
      promo: promo || null,
      shippingMethod: t.method,
      address: {
        firstName: f.firstName.value.trim(),
        lastName: f.lastName.value.trim(),
        phone: f.phone.value.trim().replace(/\s+/g, ' '),
        line1: f.line1.value.trim(),
        line2: f.line2.value.trim(),
        city: f.city.value.trim(),
        region: f.region.value,
        postal: f.postal.value.trim(),
        country: 'Philippines',
      },
      payment: 'cod',
    });
    placed = true;
    promo = null;
    savePromo();
    Cart.clear();
    try {
      const url = new URL(location.href);
      url.search = '';
      url.hash = '';
      url.searchParams.set('order', order.id);
      history.replaceState(null, '', url);
    } catch (err) { /* file:// quirks: the view still renders */ }
    showConfirmation(order);
  }

  /* Confirmation ----------------------------------------------------------- */
  const SWOOSH = '<svg class="co-swoosh" viewBox="0 0 350 52" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="co-swoosh__path" pathLength="1" d="M2 49 C 60 37, 140 20, 206 8 C 214 7, 214 11, 205 15 C 185 25, 160 35, 150 43 C 146 47, 150 47, 160 44 C 230 28, 290 14, 348 4"/><path class="co-swoosh__path co-swoosh__path--thin" pathLength="1" d="M40 44 C 100 32, 160 20, 204 11 M 156 44 C 220 30, 280 16, 344 7"/></svg>';
  const ARROW = '<svg class="co-btn__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12h17M14 6l6 6-6 6"/></svg>';
  const COPY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>';

  const crumbs = (label) => {
    const nav = el('nav', 'co-crumbs');
    nav.setAttribute('aria-label', 'Breadcrumb');
    const ol = el('ol', 'co-crumbs__list');
    const home = el('a', 'co-crumbs__home', '/');
    home.href = 'index.html'; home.setAttribute('aria-label', 'Home');
    const li1 = el('li'); li1.append(home);
    const cur = el('span', '', label); cur.setAttribute('aria-current', 'page');
    const li2 = el('li'); li2.append(cur);
    ol.append(li1, li2);
    nav.append(ol);
    return nav;
  };
  const detail = (title, ...rows) => {
    const d = el('div', 'co-detail');
    d.append(el('h3', 'co-label co-detail__title', title));
    const body = el('div', 'co-detail__body');
    rows.filter((r) => r !== null && r !== undefined && r !== '').forEach((r) => body.append(typeof r === 'string' ? el('p', '', r) : r));
    d.append(body);
    return d;
  };
  const btnLink = (cls, text, href, arrow) => {
    const a = el('a', `co-btn ${cls}`);
    a.href = href;
    a.append(document.createTextNode(text));
    if (arrow) a.insertAdjacentHTML('beforeend', ARROW);
    return a;
  };

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function showConfirmation(order) {
    const a = order.address || {};
    const m = SHIP[order.shippingMethod] || SHIP.standard;
    const eta = Orders.status(order).eta;

    const head = el('header', 'co-confirm__head');
    const h1 = el('h1', 'co-title', 'Thank you');
    h1.id = 'co-confirm-title';
    h1.tabIndex = -1;
    h1.insertAdjacentHTML('beforeend', SWOOSH);
    const lede = el('p', 'co-confirm__lede');
    lede.append(
      document.createTextNode(`Your order is in${a.firstName ? ', ' + a.firstName : ''}. Updates go to `),
      el('strong', '', order.email),
      document.createTextNode('. You’ll pay in cash when it arrives. (Preview store: no emails are sent and no payment is taken.)'),
    );
    const num = el('div', 'co-ordernum');
    const numText = el('div');
    numText.append(el('p', 'co-label', 'Order number'), el('p', 'co-ordernum__id', order.id));
    const copy = el('button', 'co-copy');
    copy.type = 'button';
    copy.innerHTML = COPY_ICON;
    const copyLabel = el('span', '', 'Copy');
    copy.append(copyLabel);
    copy.setAttribute('aria-label', `Copy order number ${order.id}`);
    const copyStatus = el('span', 'visually-hidden');
    copyStatus.setAttribute('role', 'status');
    let copyTimer;
    copy.addEventListener('click', async () => {
      const ok = await copyText(order.id);
      copyLabel.textContent = ok ? 'Copied' : 'Copy failed';
      copy.classList.toggle('is-copied', ok);
      copyStatus.textContent = ok ? `Order number ${order.id} copied` : 'Could not copy — select the number instead';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copyLabel.textContent = 'Copy'; copy.classList.remove('is-copied'); }, 2200);
    });
    num.append(numText, copy, copyStatus);
    head.append(crumbs('Order confirmed'), h1, lede, num);

    // Details
    const addr = [
      `${a.firstName || ''} ${a.lastName || ''}`.trim(),
      a.line1, a.line2,
      [a.city, a.region, a.postal].filter(Boolean).join(', '),
      a.country, a.phone,
    ].filter(Boolean);
    const addrBody = el('div');
    addr.forEach((line) => addrBody.append(el('p', '', line)));
    const placedOn = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const shipCost = el('p', 'co-muted', `${m.detail} · ${order.shipping ? money(order.shipping) : 'Free'}`);
    const details = el('div', 'co-details');
    details.append(
      detail('Contact', order.email, el('p', 'co-muted', `Placed ${placedOn}`)),
      detail('Ship to', addrBody),
      detail('Delivery', `${m.label} shipping`, shipCost, el('p', '', `Estimated ${fmtRange(eta.from, eta.to)}`)),
      detail('Payment', order.payment === 'cod' ? 'Cash on delivery' : 'Card (preview)', el('p', 'co-muted', `Due on delivery: ${money(order.total)}`)),
    );
    const actions = el('div', 'co-confirm__actions');
    const track = `contact.html?order=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.email)}#track`;
    actions.append(btnLink('co-btn--cream', 'Track your order', track, true), btnLink('co-btn--outline', 'Continue shopping', 'shop.html'));
    const left = el('div');
    left.append(details, actions);

    // Items + totals card
    const card = el('div', 'co-card');
    const count = order.items.reduce((n, l) => n + l.qty, 0);
    const title = el('h2', 'co-card__title', 'Your order ');
    title.append(el('span', 'co-card__count', `(${count})`));
    const ul = el('ul', 'co-lines');
    ul.setAttribute('aria-label', 'Items ordered');
    order.items.forEach((l) => ul.append(lineEl(l, false)));
    const dl = el('dl', 'co-totals');
    const row = (dt, dd, cls) => {
      const d = el('div', 'co-totals__row' + (cls ? ' ' + cls : ''));
      d.append(el('dt', '', dt), el('dd', '', dd));
      return d;
    };
    dl.append(row('Subtotal', money(order.subtotal)));
    if (order.discount) dl.append(row(`Discount${order.promo ? ` (${order.promo})` : ''}`, '−' + money(order.discount), 'co-totals__row--discount'));
    dl.append(row(`Shipping · ${m.label}`, order.shipping ? money(order.shipping) : 'Free'), row('Total', money(order.total), 'co-totals__row--total'));
    card.append(title, ul, dl);
    const aside = el('aside');
    aside.setAttribute('aria-label', 'Order items and totals');
    aside.append(card);

    const grid = el('div', 'co-confirm__grid');
    grid.append(left, aside);
    confirmView.replaceChildren(head, grid);
    confirmView.hidden = false;
    root.setAttribute('aria-labelledby', h1.id);
    root.classList.add('is-confirmed');
    document.title = `Order ${order.id} confirmed — /// Next Gen Apparel`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    h1.focus({ preventScroll: true });
  }

  function showMissing(id) {
    const head = el('header', 'co-confirm__head');
    const h1 = el('h1', 'co-title', 'Order not found');
    h1.id = 'co-confirm-title';
    h1.tabIndex = -1;
    const p = el('p', 'co-confirm__notice', `We couldn’t find order ${id} in this browser. Orders in this preview store are saved only on the device they were placed on.`);
    const actions = el('div', 'co-confirm__actions');
    actions.append(btnLink('co-btn--cream', 'Track an order', 'contact.html#track', true), btnLink('co-btn--outline', 'Continue shopping', 'shop.html'));
    head.append(crumbs('Order'), h1, p, actions);
    confirmView.replaceChildren(head);
    confirmView.hidden = false;
    root.setAttribute('aria-labelledby', h1.id);
    root.classList.add('is-confirmed');
  }

  /* Boot ------------------------------------------------------------------- */
  const orderParam = new URLSearchParams(location.search).get('order');
  if (orderParam) {
    placed = true;
    const order = Orders.get(orderParam);
    if (order) showConfirmation(order); else showMissing(orderParam.toUpperCase());
  } else {
    renderCheckout();
    setStep(1);
  }
  root.classList.add('is-ready');
  // start the swoosh draw after first paint (timeout covers background tabs where rAF stalls)
  const draw = () => root.classList.add('is-drawn');
  requestAnimationFrame(() => requestAnimationFrame(draw));
  setTimeout(draw, 120);
})();
