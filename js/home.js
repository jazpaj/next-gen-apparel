/* Home extras: trending rail (from window.NGProducts), category counts,
   Drop 08 countdown, newsletter form. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const IMG = {
    hoodie: ['assets/img/product-tech-hoodie.webp', 675, 666],
    tee: ['assets/img/product-graphic-tee.webp', 669, 663],
    cargo: ['assets/img/product-cargo-pants.webp', 615, 654],
    jacket: ['assets/img/product-utility-jacket.webp', 618, 654],
    cap: ['assets/img/product-signature-cap.webp', 597, 654],
    sling: ['assets/img/product-tech-sling-bag.webp', 600, 657],
  };
  const CAT = { hoodies: 'Hoodie', jackets: 'Jacket', tees: 'Tee', pants: 'Pants', accessories: 'Accessory' };
  // Row: [id, name, category, price, colors, sizes, stock, date, popularity, image, description]
  const products = (window.NGProducts || []).map(([id, name, category, price, colors, , stock, , popularity, img]) =>
    ({ id, name, category, price, colors, stock, popularity, img: IMG[img] || IMG.tee }));

  /* ------------------------------------------------- Category counts */
  document.querySelectorAll('[data-cat-count]').forEach((el) => {
    const n = products.filter((p) => p.category === el.dataset.catCount).length;
    if (n) el.textContent = n;
  });

  /* ---------------------------------------------------- Trending rail */
  const rail = $('[data-rail]');
  if (rail && products.length) {
    // Most popular in-stock pieces, taken round-robin across categories so the rail stays varied.
    const byCat = {};
    products.filter((p) => p.stock === 'in-stock')
      .sort((a, b) => b.popularity - a.popularity)
      .forEach((p) => (byCat[p.category] = byCat[p.category] || []).push(p));
    const queues = Object.values(byCat).sort((a, b) => b[0].popularity - a[0].popularity);
    const picks = [];
    for (let i = 0; picks.length < 10 && queues.some((q) => q[i]); i++) {
      queues.forEach((q) => { if (q[i] && picks.length < 10) picks.push(q[i]); });
    }
    const colorName = (c) => (c === 'cream' ? 'Bone' : c.charAt(0).toUpperCase() + c.slice(1));
    rail.innerHTML = picks.map((p, i) => {
      const [src, w, h] = p.img;
      return `<li class="hm-prod">
        <a class="hm-prod__link" href="shop.html?product=${encodeURIComponent(p.id)}">
          <div class="hm-prod__media">
            <img src="${src}" width="${w}" height="${h}" alt="" loading="lazy" decoding="async">
            <span class="hm-prod__rank" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
            <span class="hm-prod__cta" aria-hidden="true">Quick view</span>
          </div>
          <div class="hm-prod__body">
            <div>
              <h3 class="hm-prod__name">${esc(p.name)}</h3>
              <p class="hm-prod__meta">${CAT[p.category]} · ${p.colors.map(colorName).join(' / ')}</p>
            </div>
            <p class="hm-prod__price">$${p.price.toFixed(2)}</p>
          </div>
        </a>
      </li>`;
    }).join('');

    const nav = $('[data-rail-nav]');
    const prev = $('[data-rail-prev]');
    const next = $('[data-rail-next]');
    const step = () => {
      const item = rail.querySelector('.hm-prod');
      const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      return item ? (item.getBoundingClientRect().width + gap) * Math.max(1, Math.floor(rail.clientWidth / item.getBoundingClientRect().width)) : rail.clientWidth;
    };
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      nav.hidden = max <= 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max - 2;
    };
    const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const go = (dir) => {
      rail.scrollBy({ left: dir * step(), behavior: smooth });
      setTimeout(sync, 600);   // fallback for browsers without scroll/scrollend during smooth scroll
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    rail.addEventListener('scroll', sync, { passive: true });
    rail.addEventListener('scrollend', sync);
    addEventListener('resize', sync);
    sync();
  }

  /* -------------------------------------------------------- Countdown */
  const cd = $('[data-countdown]');
  if (cd) {
    const target = Date.parse(cd.dataset.countdown);
    const units = { d: $('[data-unit="d"]', cd), h: $('[data-unit="h"]', cd), m: $('[data-unit="m"]', cd), s: $('[data-unit="s"]', cd) };
    const pad = (n) => String(n).padStart(2, '0');
    let timer;
    const tick = () => {
      const left = Math.max(0, target - Date.now());
      const s = Math.floor(left / 1000);
      units.d.textContent = pad(Math.floor(s / 86400));
      units.h.textContent = pad(Math.floor((s % 86400) / 3600));
      units.m.textContent = pad(Math.floor((s % 3600) / 60));
      units.s.textContent = pad(s % 60);
      if (!left) {
        clearInterval(timer);
        $('[data-count-label]', cd).textContent = 'Live now';
        $('[data-count-text]', cd).textContent = 'Drop 08 is live now.';
      }
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ------------------------------------------------------- Newsletter */
  const form = $('[data-news-form]');
  if (form) {
    const input = form.querySelector('input[type="email"]');
    const error = $('[data-news-error]', form);
    const done = $('[data-news-done]');
    const show = (msg) => {
      error.textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    input.addEventListener('input', () => { if (error.textContent) show(''); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) { show('Enter your email address.'); input.focus(); return; }
      if (!input.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { show('Enter a valid email, like name@example.com.'); input.focus(); return; }
      show('');
      $('[data-news-echo]', done).textContent = v;
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  }
})();
