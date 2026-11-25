/* About page: banner load-in (reuses .shop-hero styles) + image settle on scroll */
(() => {
  const hero = document.querySelector('.about-hero');
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));

  const sections = document.querySelectorAll('.about-who, .about-mission, .about-values, .about-join');
  if (!('IntersectionObserver' in window)) {
    sections.forEach(s => s.classList.add('is-inview'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-inview'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  sections.forEach(s => io.observe(s));
})();
