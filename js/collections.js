/* Collections page: banner load-in (reuses the shop-hero banner styles). */
(() => {
  const hero = document.querySelector('.shop-hero--collections');
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));
})();
