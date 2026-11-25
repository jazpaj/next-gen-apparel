/* Home extras: "Most Wanted" chart (from window.NGProducts), category index counts,
   Drop 08 hang-tag countdown, access-pass newsletter. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
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
  const colorName = (c) => (c === 'cream' ? 'Bone' : c.charAt(0).toUpperCase() + c.slice(1));

  /* ---------------------------------------------------- Index counts */
  document.querySelectorAll('[data-cat-count]').forEach((el) => {
    const n = products.filter((p) => p.category === el.dataset.catCount).length;
    if (n) el.textContent = n;
  });
  const total = $('[data-total-count]');
  if (total && products.length) total.textContent = products.length;

  /* -------------------------------------------------------- The chart */
  const list = $('[data-chart]');
  if (list && products.length) {
    // Most popular in-stock pieces, round-robin across categories so the chart stays varied.
    const byCat = {};
    products.filter((p) => p.stock === 'in-stock')
      .sort((a, b) => b.popularity - a.popularity)
      .forEach((p) => (byCat[p.category] = byCat[p.category] || []).push(p));
    const queues = Object.values(byCat).sort((a, b) => b[0].popularity - a[0].popularity);
    const picks = [];
    for (let i = 0; picks.length < 8 && queues.some((q) => q[i]); i++) {
      queues.forEach((q) => { if (q[i] && picks.length < 8) picks.push(q[i]); });
    }

    list.innerHTML = picks.map((p, i) => {
      const [src, w, h] = p.img;
      return `<li class="hx-row${i === 0 ? ' is-active' : ''}" data-i="${i}">
        <a class="hx-row__link" href="shop.html?product=${encodeURIComponent(p.id)}">
          <span class="hx-row__no">${pad(i + 1)}</span>
          <img class="hx-row__thumb" src="${src}" width="${w}" height="${h}" alt="" loading="lazy" decoding="async">
          <span class="hx-row__name">${esc(p.name)}<span class="hx-row__meta">${CAT[p.category]} · ${p.colors.map(colorName).join(' / ')}</span></span>
          <span class="hx-row__price">$${p.price}</span>
          <svg class="hx-row__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      </li>`;
    }).join('');

    // Hover / focus a row → swap the big preview on the left.
    const frame = $('[data-chart-frame]');
    const img = $('[data-chart-img]');
    const rank = $('[data-chart-rank]');
    const fig = $('[data-chart-fig]');
    const name = $('[data-chart-name]');
    let active = 0, swapTimer;
    const activate = (i) => {
      if (i === active) return;
      list.children[active]?.classList.remove('is-active');
      list.children[i].classList.add('is-active');
      active = i;
      const p = picks[i];
      rank.textContent = fig.textContent = pad(i + 1);
      name.textContent = p.name;
      clearTimeout(swapTimer);
      if (img.getAttribute('src') === p.img[0]) return;
      frame.classList.add('is-swapping');
      swapTimer = setTimeout(() => {
        img.src = p.img[0];
        frame.classList.remove('is-swapping');
      }, 200);
    };
    const pick = (e) => {
      const row = e.target.closest('.hx-row');
      if (row) activate(+row.dataset.i);
    };
    list.addEventListener('mouseover', pick);
    list.addEventListener('focusin', pick);
    name.textContent = picks[0].name;
    img.src = picks[0].img[0];
  }

  /* -------------------------------------------------------- Countdown */
  const cd = $('[data-countdown]');
  if (cd) {
    const target = Date.parse(cd.dataset.countdown);
    const units = ['d', 'h', 'm', 's'].map((u) => $(`[data-unit="${u}"]`, cd));
    let timer;
    const tick = () => {
      const left = Math.max(0, target - Date.now());
      const s = Math.floor(left / 1000);
      [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
        .forEach((v, i) => { units[i].textContent = pad(v); });
      if (!left) {
        clearInterval(timer);
        $('[data-count-label]', cd).textContent = 'Doors are open';
        $('[data-count-text]', cd).textContent = 'Drop 08 is live now.';
      }
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ----------------------------------------------------- Access pass */
  const form = $('[data-news-form]');
  if (form) {
    const input = form.querySelector('input[type="email"]');
    const error = $('[data-news-error]', form);
    const done = $('[data-news-done]');
    const stubNo = document.querySelector('.hx-pass__stub span:last-child');
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
      if (stubNo) stubNo.textContent = 'No. ' + String(1000 + Math.floor(Math.random() * 9000));
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  }
})();
