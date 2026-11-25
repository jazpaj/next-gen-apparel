/* Hero carousel: slides, autoplay, keyboard, parallax */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const slides = [...hero.querySelectorAll('.hero__slide')];
  const controls = [...hero.querySelectorAll('[data-go]')];
  const fill = hero.querySelector('.hero__track-fill');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const DELAY = 6000;
  let index = 0;
  let timer = null;
  let hovering = false;
  let focusWithin = false;

  // Kick off load-in animations (image scale-in, swoosh draw)
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));

  function go(i, fromUser) {
    const n = slides.length;
    index = (i + n) % n;
    slides.forEach((s, k) => {
      const on = k === index;
      s.classList.toggle('is-active', on);
      if (on) { s.removeAttribute('aria-hidden'); s.inert = false; }
      else { s.setAttribute('aria-hidden', 'true'); s.inert = true; }
    });
    controls.forEach(c => {
      if (+c.dataset.go === index) c.setAttribute('aria-current', 'true');
      else c.removeAttribute('aria-current');
    });
    if (fill) fill.style.setProperty('--i', index);
    if (fromUser) restart();
  }

  function canPlay() {
    return !reduce.matches && !hovering && !focusWithin && !document.hidden;
  }
  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (canPlay()) timer = setInterval(() => go(index + 1), DELAY);
  }
  function restart() { start(); }

  controls.forEach(c => c.addEventListener('click', () => go(+c.dataset.go, true)));

  hero.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' && e.target.closest('.hero__counter')) {
      e.preventDefault(); go(index + 1, true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' && e.target.closest('.hero__counter')) {
      e.preventDefault(); go(index - 1, true);
    } else return;
    // keep focus on the matching control if a control was focused
    const t = e.target.closest('[data-go]');
    if (t) {
      const group = t.parentElement.querySelectorAll('[data-go]');
      group[index] && group[index].focus();
    }
  });

  hero.addEventListener('mouseenter', () => { hovering = true; stop(); });
  hero.addEventListener('mouseleave', () => { hovering = false; start(); });
  hero.addEventListener('focusin', () => { focusWithin = true; stop(); });
  hero.addEventListener('focusout', e => {
    if (!hero.contains(e.relatedTarget)) { focusWithin = false; start(); }
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduce.addEventListener && reduce.addEventListener('change', start);

  // Light scroll parallax on the photo (desktop only, motion allowed)
  const wide = matchMedia('(min-width: 901px)');
  let ticking = false;
  function parallax() {
    ticking = false;
    if (reduce.matches || !wide.matches) { hero.style.setProperty('--py', '0px'); return; }
    const y = Math.min(window.scrollY, hero.offsetHeight);
    hero.style.setProperty('--py', (y * 0.12).toFixed(1) + 'px');
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });

  go(0);
  start();
})();
