/* Contact page: banner load-in (reuses .shop-hero), concrete settle on scroll,
   message form (floating labels, validation, local success state — no network),
   inquiry-type shortcuts (?type=… and data-inquiry links), live-chat toast,
   order tracking (#track; ?order=&email= deep link; uses window.NGOrders). */
(() => {
  const hero = document.querySelector('.contact-hero');
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));

  const main = document.querySelector('.cp-main');
  if (main) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-inview'); io.unobserve(e.target); } });
      }, { threshold: 0.15 });
      io.observe(main);
    } else main.classList.add('is-inview');
  }

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const card = form.closest('.cp-card');
  const sent = card.querySelector('[data-contact-sent]');
  const typeSel = form.elements.type;
  const typeField = typeSel.closest('.cp-field');
  const TYPES = Array.from(typeSel.options).map(o => o.value).filter(Boolean);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const syncSelect = () => typeField.classList.toggle('is-filled', typeSel.value !== '');
  typeSel.addEventListener('change', syncSelect);

  const setType = (value) => {
    if (!TYPES.includes(value)) return false;
    typeSel.value = value;
    syncSelect();
    if (typeSel.getAttribute('aria-invalid') === 'true') validate(typeSel);
    return true;
  };

  /* Validation ------------------------------------------------------------ */
  const errorFor = (el) => {
    const v = el.value.trim();
    switch (el.name) {
      case 'name': return v ? '' : 'Please enter your name.';
      case 'email':
        if (!v) return 'Please enter your email address.';
        return EMAIL_RE.test(v) ? '' : 'Please enter a valid email address, like name@example.com.';
      case 'type': return v ? '' : 'Please choose an inquiry type.';
      case 'message':
        if (!v) return 'Please write a message.';
        return v.length >= 10 ? '' : 'Your message needs at least 10 characters.';
      default: return '';
    }
  };

  function validate(el) {
    const msg = errorFor(el);
    const err = document.getElementById(el.id + '-error');
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      err.textContent = msg;
      err.hidden = false;
    } else {
      el.removeAttribute('aria-invalid');
      err.textContent = '';
      err.hidden = true;
    }
    return !msg;
  }

  const fields = ['name', 'email', 'type', 'message'].map(n => form.elements[n]);

  fields.forEach(el => {
    // once a field has been flagged, re-check as the user fixes it
    const live = () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); };
    el.addEventListener('input', live);
    el.addEventListener('change', live);
    el.addEventListener('blur', () => { if (el.value.trim()) validate(el); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalid = fields.filter(el => !validate(el));
    if (invalid.length) { invalid[0].focus(); return; }

    // No backend yet: show the confirmation in place of the form.
    form.hidden = true;
    sent.hidden = false;
    card.classList.add('is-sent');
    sent.querySelector('.cp-sent__text').focus();
  });

  card.querySelector('[data-contact-reset]').addEventListener('click', () => {
    form.reset();
    fields.forEach(clearErr);
    syncSelect();
    sent.hidden = true;
    card.classList.remove('is-sent');
    form.hidden = false;
    form.elements.name.focus();
  });
  function clearErr(el) {
    el.removeAttribute('aria-invalid');
    const err = document.getElementById(el.id + '-error');
    err.textContent = '';
    err.hidden = true;
  }

  /* ?type=partnerships preselects the inquiry type ------------------------ */
  const params = new URLSearchParams(location.search);
  if (params.has('type')) setType(params.get('type'));
  syncSelect();

  /* In-page shortcuts: preselect type, scroll to the form, focus name ----- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const openForm = (type) => {
    if (!sent.hidden) { form.hidden = false; sent.hidden = true; card.classList.remove('is-sent'); }
    setType(type);
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    form.elements.name.focus({ preventScroll: true });
    if (history.replaceState) {
      const url = new URL(location.href);
      url.searchParams.set('type', type);
      url.hash = 'message-form';
      history.replaceState(null, '', url);
    }
  };
  document.querySelectorAll('[data-inquiry]').forEach(a => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      e.preventDefault();
      openForm(a.dataset.inquiry);
    });
  });

  /* Live chat placeholder ------------------------------------------------- */
  const chatBtn = document.querySelector('[data-live-chat]');
  const toast = document.querySelector('[data-chat-toast]');
  let toastTimer;
  if (chatBtn && toast) {
    chatBtn.addEventListener('click', () => {
      toast.textContent = 'Live chat opens during business hours (Mon – Fri, 9AM – 6PM PHT).';
      toast.classList.add('is-shown');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('is-shown');
        setTimeout(() => { if (!toast.classList.contains('is-shown')) toast.textContent = ''; }, 400);
      }, 3600);
    });
  }
  /* Order tracking (#track) ---------------------------------------------- */
  const track = document.getElementById('track');
  const tForm = document.querySelector('[data-track-form]');
  const Orders = window.NGOrders;
  if (!track || !tForm || !Orders) return;
  const tOrder = tForm.elements.order;
  const tEmail = tForm.elements.email;
  const tFields = [tOrder, tEmail];
  const notFound = track.querySelector('[data-track-notfound]');
  const result = track.querySelector('[data-track-result]');
  const ORDER_RE = /^(?:NGA)?-?(\d{6})$/;

  // "nga 100248", "100248", "NGA100248" -> "NGA-100248"; null when malformed
  const normalizeId = (v) => {
    const m = String(v || '').toUpperCase().replace(/\s+/g, '').match(ORDER_RE);
    return m ? 'NGA-' + m[1] : null;
  };
  const trackError = (el) => {
    const v = el.value.trim();
    if (el === tOrder) {
      if (!v) return 'Please enter your order number.';
      return normalizeId(v) ? '' : 'Order numbers look like NGA-123456.';
    }
    if (!v) return 'Please enter the email you used at checkout.';
    return EMAIL_RE.test(v) ? '' : 'Please enter a valid email address, like name@example.com.';
  };
  const showErr = (el, msg) => {
    el.setCustomValidity('');   // reset before re-checking
    const err = document.getElementById(el.id + '-error');
    if (msg) { el.setCustomValidity(msg); el.setAttribute('aria-invalid', 'true'); err.textContent = msg; err.hidden = false; }
    else { el.removeAttribute('aria-invalid'); err.textContent = ''; err.hidden = true; }
    return !msg;
  };
  const checkTrack = (el) => showErr(el, trackError(el));
  const setNotFound = (msg) => { notFound.textContent = msg || ''; };

  tFields.forEach(el => {
    const live = () => { if (el.getAttribute('aria-invalid') === 'true') checkTrack(el); setNotFound(''); };
    el.addEventListener('input', live);
    el.addEventListener('blur', () => { if (el.value.trim()) checkTrack(el); });
  });
  tOrder.addEventListener('blur', () => { const id = normalizeId(tOrder.value); if (id) tOrder.value = id; });

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const fmtFull = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ARROW = '<svg class="cp-btn__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12h17M14 6l6 6-6 6"/></svg>';

  let shown = null;   // order currently displayed

  const render = (order) => {
    const st = Orders.status(order);
    const delivered = st.current === 'delivered';
    const curIdx = st.steps.findIndex(s => s.key === st.current);
    const curLabel = st.steps[curIdx].label;
    const steps = st.steps.map((s, i) => {
      const state = i < curIdx || (delivered && i === curIdx) ? 'is-done' : i === curIdx ? 'is-current' : 'is-future';
      const linked = st.steps[i + 1] && st.steps[i + 1].done ? ' is-linked' : '';
      const when = s.done ? `${esc(fmtDay(s.at))}<br>${esc(fmtTime(s.at))}` : 'Pending';
      const sr = state === 'is-current' ? ' (current status)' : state === 'is-future' ? ' (not yet)' : ' (complete)';
      return `<li class="cp-step ${state}${linked}"${state === 'is-current' ? ' aria-current="step"' : ''}>
          <span class="cp-step__dot" aria-hidden="true">${state === 'is-done' ? CHECK : ''}</span>
          <span class="cp-step__text"><span class="cp-step__label">${esc(s.label)}<span class="visually-hidden">${sr}</span></span><span class="cp-step__time">${when}</span></span>
        </li>`;
    }).join('');
    const eta = delivered
      ? `Delivered on <strong>${esc(fmtDay(st.eta.to))}</strong>`
      : `Estimated delivery: <strong>${esc(fmtDay(st.eta.from))}${fmtDay(st.eta.from) === fmtDay(st.eta.to) ? '' : ' &ndash; ' + esc(fmtDay(st.eta.to))}</strong>`;
    const ship = Orders.SHIPPING[order.shippingMethod] || Orders.SHIPPING.standard;
    const a = order.address || {};
    const name = [a.firstName, a.lastName].filter(Boolean).join(' ');
    const place = [a.city, a.region].filter(Boolean).join(', ');
    const items = (order.items || []).map(it => {
      const opts = [it.size && (/size/i.test(it.size) ? it.size : 'Size ' + it.size), it.color].filter(Boolean).join(' · ');
      return `<li class="cp-item">
          <img class="cp-item__thumb" src="${esc(it.image)}" width="64" height="64" alt="" loading="lazy" decoding="async">
          <span class="cp-item__body"><span class="cp-item__name">${esc(it.name)}</span><span class="cp-item__opts">${esc(opts)}${opts ? ' · ' : ''}Qty ${esc(it.qty || 1)}</span></span>
          <span class="cp-item__price">${esc(Orders.money((it.price || 0) * (it.qty || 1)))}</span>
        </li>`;
    }).join('');
    const sumRow = (k, v, mod = '') => `<div class="cp-sum__row${mod}"><span>${k}</span><span>${esc(v)}</span></div>`;
    result.innerHTML = `
      <article class="cp-order" aria-labelledby="cp-order-id">
        <header class="cp-order__head">
          <div>
            <h3 class="cp-order__id" id="cp-order-id" tabindex="-1">Order ${esc(order.id)}</h3>
            <p class="cp-order__placed">Placed ${esc(fmtFull(order.createdAt))} at ${esc(fmtTime(order.createdAt))}</p>
          </div>
          <p class="cp-order__badge">${esc(curLabel)}</p>
        </header>
        <ol class="cp-steps" aria-label="Order progress">${steps}</ol>
        <div class="cp-order__meta">
          <div><span class="cp-order__k">Delivery</span><span class="cp-order__v">${eta}</span></div>
          <div><span class="cp-order__k">Shipping method</span><span class="cp-order__v">${esc(ship.label)} &middot; ${esc(ship.detail)}</span></div>
          <div><span class="cp-order__k">Ship to</span><span class="cp-order__v">${esc(name) || '&mdash;'}<br>${esc(place)}</span></div>
        </div>
        <div class="cp-order__body">
          <ul class="cp-items" aria-label="Items">${items}</ul>
          <div class="cp-sum">
            ${sumRow('Subtotal', Orders.money(order.subtotal))}
            ${order.discount ? sumRow('Discount' + (order.promo ? ' (' + esc(order.promo) + ')' : ''), '−' + Orders.money(order.discount)) : ''}
            ${sumRow('Shipping', order.shipping ? Orders.money(order.shipping) : 'Free')}
            ${sumRow('Total', Orders.money(order.total), ' cp-sum__row--total')}
          </div>
        </div>
        <div class="cp-order__actions">
          <button class="cp-btn cp-btn--cream" type="button" data-track-help>Need help with this order?${ARROW}</button>
          <button class="cp-btn cp-btn--outline" type="button" data-track-reset>Track another order${ARROW}</button>
        </div>
      </article>`;
  };

  const syncUrl = (order) => {
    if (!history.replaceState) return;
    const url = new URL(location.href);
    if (order) { url.searchParams.set('order', order.id); url.searchParams.set('email', order.email); url.hash = 'track'; }
    else { url.searchParams.delete('order'); url.searchParams.delete('email'); }
    history.replaceState(null, '', url);
  };

  // Returns true when an order was shown.
  const lookup = ({ scroll = true } = {}) => {
    setNotFound('');
    const invalid = tFields.filter(el => !checkTrack(el));
    if (invalid.length) { invalid[0].focus(); return false; }
    const id = normalizeId(tOrder.value);
    tOrder.value = id;
    const order = Orders.find(id, tEmail.value);
    if (!order) {
      shown = null;
      result.innerHTML = '';
      track.classList.remove('is-found');
      setNotFound('We couldn’t find an order with that number and email.');
      return false;
    }
    shown = order;
    render(order);
    track.classList.add('is-found');
    syncUrl(order);
    const head = result.querySelector('#cp-order-id');
    head.focus({ preventScroll: true });
    if (scroll) result.firstElementChild.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    return true;
  };

  tForm.addEventListener('submit', (e) => { e.preventDefault(); lookup(); });

  track.querySelector('[data-track-sample]').addEventListener('click', () => {
    tOrder.value = Orders.DEMO_ID;
    tEmail.value = Orders.DEMO_EMAIL;
    lookup();
  });

  const resetTrack = () => {
    tForm.reset();
    tFields.forEach(el => showErr(el, ''));
    setNotFound('');
    result.innerHTML = '';
    shown = null;
    track.classList.remove('is-found');
    syncUrl(null);
    tOrder.focus();
  };

  result.addEventListener('click', (e) => {
    if (e.target.closest('[data-track-reset]')) { resetTrack(); return; }
    if (!e.target.closest('[data-track-help]') || !shown) return;
    if (!sent.hidden) { form.hidden = false; sent.hidden = true; card.classList.remove('is-sent'); }
    setType('orders');
    const f = form.elements;
    const prefix = `Order ${shown.id}: `;
    const msg = f.message.value;
    if (!msg.trim() || /^Order NGA-\d{6}: ?$/.test(msg)) f.message.value = prefix;
    else if (!msg.includes(shown.id)) f.message.value = prefix + '\n' + msg;
    f.email.value = shown.email;
    const a = shown.address || {};
    const name = [a.firstName, a.lastName].filter(Boolean).join(' ');
    if (!f.name.value.trim() && name && !shown.demo) f.name.value = name;
    [f.email, f.message].forEach(el => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    const target = f.name.value.trim() ? f.message : f.name;
    target.focus({ preventScroll: true });
    if (target === f.message) { const n = f.message.value.length; f.message.setSelectionRange(n, n); }
  });

  // Shipping-support tile + "Track order" row jump here instead of the form
  const jumpToTrack = () => {
    track.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    tOrder.focus({ preventScroll: true });
    if (history.replaceState) { const url = new URL(location.href); url.hash = 'track'; history.replaceState(null, '', url); }
  };
  document.querySelectorAll('[data-track-jump]').forEach(a => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      e.preventDefault();
      jumpToTrack();
    });
  });

  // Deep link: contact.html?order=NGA-…&email=…#track
  if (params.has('order') || params.has('email')) {
    tOrder.value = params.get('order') || '';
    tEmail.value = params.get('email') || '';
    const hashOk = !location.hash || location.hash === '#track';
    const ok = lookup({ scroll: false });
    // The browser's own #fragment scroll can run after this and reset focus,
    // so settle scroll + focus once the page has loaded.
    const settle = () => {
      if (hashOk) track.scrollIntoView({ behavior: 'auto', block: 'start' });
      const head = ok && result.querySelector('#cp-order-id');
      if (head && (document.activeElement === document.body || !document.activeElement)) head.focus({ preventScroll: true });
    };
    if (document.readyState === 'complete') requestAnimationFrame(settle);
    else window.addEventListener('load', () => setTimeout(settle, 0), { once: true });
  }
})();
