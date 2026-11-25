/* Contact page: banner load-in (reuses .shop-hero), concrete settle on scroll,
   message form (floating labels, validation, local success state — no network),
   inquiry-type shortcuts (?type=… and data-inquiry links), live-chat toast. */
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
})();
