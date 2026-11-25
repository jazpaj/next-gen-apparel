/* LET'S TALK footer: draw the hand-drawn arrow in when it scrolls into view */
(() => {
  const arrow = document.querySelector('.cf-draw');
  if (!arrow) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { arrow.classList.add('is-drawn'); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { arrow.classList.add('is-drawn'); io.disconnect(); }
    });
  }, { threshold: 0.6 });
  io.observe(arrow);
})();
