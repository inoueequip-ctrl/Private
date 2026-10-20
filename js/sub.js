/* KOTAKI MOTORS — sub pages: smooth scroll, header, reveal */
(() => {
  'use strict';
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hdr = document.getElementById('hdr');

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // reveal on scroll
  const items = $$('[data-r], .sub-hero__title');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
    setTimeout(() => $$('.sub-hero__title').forEach((el) => el.classList.add('is-in')), 150);
  }

  // header: hide on scroll down, dark text over light sections
  let last = window.scrollY;
  const light = $$('[data-theme="light"]');
  const onScroll = () => {
    const y = window.scrollY;
    hdr.classList.toggle('is-hidden', y > 240 && y > last);
    last = y;
    const on = light.some((s) => { const r = s.getBoundingClientRect(); return r.top < 46 && r.bottom > 46; });
    hdr.classList.toggle('is-dark', on);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
