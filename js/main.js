/* KOTAKI MOTORS — interactions
   GSAP + ScrollTrigger + Lenis (vendored in /assets/vendor) */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  if (!window.gsap || !window.ScrollTrigger) {
    // libraries failed to load: leave the static page as-is
    root.classList.remove('js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  let seen = false;
  try { seen = !!sessionStorage.getItem('km-seen'); } catch (e) {}

  /* ------------------------------------------------------------
     Smooth scroll
  ------------------------------------------------------------ */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  if (reduce) root.classList.add('reduce');

  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else if (target === 0) window.scrollTo(0, 0);
    else target.scrollIntoView({ behavior: 'smooth' });
  };

  /* ------------------------------------------------------------
     Text splitting
  ------------------------------------------------------------ */
  // split an element's html by <br> into masked lines
  const splitLines = (el) => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => `<span class="ln"><span>${p}</span></span>`).join('');
    return $$('.ln > span', el);
  };
  // split plain text into phrase-sized spans (Japanese aware)
  const splitWords = (el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    let segs;
    if (window.Intl && Intl.Segmenter) {
      segs = Array.from(new Intl.Segmenter('ja', { granularity: 'word' }).segment(text), (s) => s.segment);
    } else {
      segs = Array.from(text);
    }
    el.innerHTML = segs.map((s) => `<span class="w" aria-hidden="true">${s}</span>`).join('');
    return $$('.w', el);
  };

  /* ------------------------------------------------------------
     Videos: play only while visible
  ------------------------------------------------------------ */
  const videos = $$('video');
  videos.forEach((v) => { v.muted = true; v.setAttribute('muted', ''); v.playsInline = true; });
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    });
  }, { threshold: 0.12 });
  videos.forEach((v) => vio.observe(v));

  /* ------------------------------------------------------------
     Loader
  ------------------------------------------------------------ */
  const heroVideo = $('.hero__video');
  const ready = Promise.race([
    Promise.all([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      new Promise((res) => {
        if (!heroVideo || heroVideo.readyState >= 3) return res();
        heroVideo.addEventListener('canplay', res, { once: true });
        heroVideo.addEventListener('error', res, { once: true });
      }),
    ]),
    new Promise((res) => setTimeout(res, 4500)),
  ]);

  const prepHero = () => {
    gsap.set('.hero__title .line > span', { yPercent: 112 });
    gsap.set('.hero__jp span', { yPercent: 110 });
    gsap.set('.hero__eyebrow > *', { yPercent: 120 });
    gsap.set('.hero__foot', { opacity: 0 });
    gsap.set('.hdr', { yPercent: -120 });
    gsap.set('.hero__media', { scale: 1.2 });
  };

  const heroIn = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__media', { scale: 1, duration: 2.6 }, 0)
      .to('.hero__eyebrow > *', { yPercent: 0, duration: 1.1, stagger: 0.08 }, 0.15)
      .to('.hero__title .line > span', { yPercent: 0, duration: 1.5, stagger: 0.12 }, 0.2)
      .to('.hero__jp span', { yPercent: 0, duration: 1.2, stagger: 0.1 }, 0.7)
      .to('.hero__foot', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1)
      .to('.hdr', { yPercent: 0, duration: 1.2 }, 0.9);
    return tl;
  };

  const runLoader = () => new Promise((resolve) => {
    const loader = $('#loader');
    if (!loader || reduce) {
      if (loader) loader.remove();
      return resolve();
    }
    const count = $('#count');
    const bar = $('.loader__line span');
    const dur = seen ? 0.9 : 2.0;
    const o = { v: 0 };
    const tl = gsap.timeline();
    tl.to('.loader__logo', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power4.out' }, 0)
      .to('.loader__row', { opacity: 1, duration: 0.6 }, 0.15)
      .to(o, { v: 100, duration: dur, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(o.v); } }, 0.1)
      .to(bar, { scaleX: 1, duration: dur, ease: 'power2.inOut' }, 0.1);
    tl.eventCallback('onComplete', () => {
      ready.then(() => {
        gsap.timeline({ onComplete: () => { loader.remove(); resolve(); } })
          .to('.loader__center', { y: -24, opacity: 0, duration: 0.55, ease: 'power3.in' })
          .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 0.3)
          .add(() => resolve(), 0.55); // start hero while the curtain lifts
      });
    });
  });

  /* ------------------------------------------------------------
     Header, menu, anchors
  ------------------------------------------------------------ */
  const hdr = $('#hdr');
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) hdr.classList.remove('is-hidden');
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = id === '#top' ? 0 : $(id);
      if (t === null) return;
      e.preventDefault();
      const wasOpen = menuOpen;
      if (wasOpen) setMenu(false);
      setTimeout(() => scrollTo(t), wasOpen ? 350 : 0);
    });
  });

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      $('#progress').style.transform = `scaleX(${self.progress})`;
      const y = self.scroll();
      if (menuOpen) return;
      if (y > 240 && self.direction === 1) hdr.classList.add('is-hidden');
      else if (self.direction === -1 || y <= 240) hdr.classList.remove('is-hidden');
    },
  });
  /* ------------------------------------------------------------
     Cursor + magnetic buttons
  ------------------------------------------------------------ */
  if (fine && !reduce) {
    document.body.classList.add('has-cursor');
    const cur = $('#cursor');
    const label = $('.cursor__ring em');
    const dx = gsap.quickTo('.cursor__dot', 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo('.cursor__dot', 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo('.cursor__ring', 'x', { duration: 0.55, ease: 'power3' });
    const ry = gsap.quickTo('.cursor__ring', 'y', { duration: 0.55, ease: 'power3' });
    gsap.set(cur, { opacity: 0 });
    let shown = false;
    addEventListener('mousemove', (e) => {
      if (!shown) { shown = true; gsap.set('.cursor__dot,.cursor__ring', { x: e.clientX, y: e.clientY }); gsap.to(cur, { opacity: 1, duration: 0.4 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      const light = !!(e.target.closest && e.target.closest('[data-theme="light"]'));
      cur.classList.toggle('is-dark', light);
    }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest ? e.target.closest('[data-cursor],a,button,label') : null;
      const kind = t ? (t.dataset.cursor || 'hover') : null;
      cur.classList.toggle('is-hover', kind === 'hover');
      const lbl = kind === 'scroll' ? 'SCROLL' : '';
      label.textContent = lbl;
      cur.classList.toggle('is-label', !!lbl);
    });
    document.addEventListener('mouseleave', () => gsap.to(cur, { opacity: 0, duration: 0.3 }));
    document.addEventListener('mouseenter', () => gsap.to(cur, { opacity: 1, duration: 0.3 }));

    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,.55)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,.55)' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* ------------------------------------------------------------
     Hero: parallax + light glint following the pointer
  ------------------------------------------------------------ */
  const heroEl = $('#hero');
  const glint = $('#glint');
  if (!reduce) {
    const g = { x: 70, y: 35, tx: 70, ty: 35 };
    heroEl.addEventListener('mousemove', (e) => {
      const r = heroEl.getBoundingClientRect();
      g.tx = ((e.clientX - r.left) / r.width) * 100;
      g.ty = ((e.clientY - r.top) / r.height) * 100;
    }, { passive: true });
    gsap.ticker.add(() => {
      g.x += (g.tx - g.x) * 0.06; g.y += (g.ty - g.y) * 0.06;
      glint.style.setProperty('--mx', g.x.toFixed(2) + '%');
      glint.style.setProperty('--my', g.y.toFixed(2) + '%');
    });

    gsap.to('#heroMedia', {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__inner', {
      yPercent: -14, opacity: 0.0, ease: 'none',
      scrollTrigger: { trigger: heroEl, start: '20% top', end: 'bottom 20%', scrub: true },
    });
  }

  /* ------------------------------------------------------------
     Scroll animations
  ------------------------------------------------------------ */
  const build = () => {
    if (reduce) return;

    // Pinned scenes first, in page order, so triggers created afterwards
    // measure positions that already include the pin spacing.
    // ALL CARS COATED — pinned expand
    const frame = $('#coatedFrame');
    gsap.set('#coatedQuote .ln > span', { yPercent: 112 });
    gsap.timeline({
      scrollTrigger: { trigger: '#coated', start: 'top top', end: '+=280%', scrub: 0.6, pin: '.coated__stage', anticipatePin: 1, invalidateOnRefresh: true },
    })
      .fromTo(frame, { clipPath: () => (innerWidth <= 860 ? 'inset(30% 14% 30% 14%)' : 'inset(26% 32% 26% 32%)') }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 1.5 }, 0)
      .fromTo('#coatedFrame video', { scale: 1.4 }, { scale: 1, ease: 'none', duration: 2.4 }, 0)
      .to('#coatedTitle .a', { xPercent: -118, ease: 'power2.in', duration: 1.5 }, 0.2)
      .to('#coatedTitle .b', { xPercent: 118, ease: 'power2.in', duration: 1.5 }, 0.2)
      .to('#coatedHint', { opacity: 0, duration: 0.3 }, 0.1)
      .to('#coatedShade', { opacity: 1, ease: 'none', duration: 0.9 }, 1.5)
      .to('#coatedQuote .ln > span', { yPercent: 0, ease: 'power3.out', duration: 0.8, stagger: 0.3 }, 1.9)
      .to({}, { duration: 1.0 });

    // process: pinned horizontal gallery (desktop) / swipe (mobile)
    ScrollTrigger.matchMedia({
      '(min-width: 861px)': () => {
        const track = $('#processTrack');
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + dist(), pin: '.process__pin', scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true },
        });
      },
    });

    // generic fade-ups
    ScrollTrigger.batch('[data-fade]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.fromTo(els, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: 0.12 }),
    });
    gsap.set('[data-fade]', { opacity: 0 });

    // masked line reveals
    $$('[data-lines]').forEach((el) => {
      const lines = splitLines(el);
      gsap.set(lines, { yPercent: 108 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(lines, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1 }),
      });
    });
    $$('.value__title .ln > span, .contact__title .ln > span').forEach((el) => {
      gsap.set(el, { yPercent: 108 });
      ScrollTrigger.create({
        trigger: el.parentNode, start: 'top 90%', once: true,
        onEnter: () => gsap.to(el, { yPercent: 0, duration: 1.5, ease: 'expo.out' }),
      });
    });
    $$('.ftr__word span').forEach((el, i) => {
      el.innerHTML = `<span style="display:block">${el.innerHTML}</span>`;
      const t = el.firstChild;
      gsap.set(t, { yPercent: 105 });
      ScrollTrigger.create({
        trigger: el, start: 'top 98%', once: true,
        onEnter: () => gsap.to(t, { yPercent: 0, duration: 1.6, ease: 'expo.out', delay: i * 0.12 }),
      });
    });

    // concept: scrubbed phrase highlight
    const lead = $('#lead');
    const words = splitWords(lead);
    gsap.to(words, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: lead, start: 'top 80%', end: 'bottom 48%', scrub: 0.5 },
    });

    // marquee (speed follows scroll velocity & direction)
    const track = $('.marquee__track');
    if (track) {
      let x = 0, dir = 1;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      gsap.ticker.add(() => {
        const period = (track.scrollWidth + gap) / 2;
        const v = lenis ? lenis.velocity : 0;
        if (lenis && Math.abs(v) > 0.05) dir = v > 0 ? 1 : -1;
        x -= (0.7 + Math.min(Math.abs(v) * 0.35, 14)) * dir;
        if (x <= -period) x += period;
        if (x > 0) x -= period;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    }

    // coating: ghost text + photo
    gsap.fromTo('#ghost', { xPercent: 4 }, {
      xPercent: -38, ease: 'none',
      scrollTrigger: { trigger: '#coating', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    const photo = $('#photo');
    gsap.fromTo(photo, { clipPath: 'inset(16% 14% 16% 14%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: photo, start: 'top 92%', end: 'top 35%', scrub: 0.5 },
    });
    gsap.fromTo('.coating__photoInner', { yPercent: -7, scale: 1.12 }, {
      yPercent: 7, scale: 1, ease: 'none',
      scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // value: ≠ drawing
    const neq = $('#neq');
    const paths = $$('path', neq);
    paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.timeline({ scrollTrigger: { trigger: neq, start: 'top 82%', once: true } })
      .to(paths[0], { strokeDashoffset: 0, duration: 0.8, ease: 'power3.out' })
      .to(paths[1], { strokeDashoffset: 0, duration: 0.8, ease: 'power3.out' }, 0.15);

    // value: cost-shift diagram
    const q = $$('#barK .seg.q');
    gsap.timeline({
      scrollTrigger: {
        trigger: '#shift', start: 'top 72%', end: 'center 38%', scrub: 0.7,
        onUpdate: (self) => q.forEach((s) => s.classList.toggle('on', self.progress > 0.55)),
      },
    })
      .to('#kFixed', { flexGrow: 20, ease: 'none', duration: 1 }, 0)
      .to(q, { flexGrow: 20, ease: 'none', duration: 1 }, 0);
    gsap.from('.returns li', {
      y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.returns', start: 'top 92%', once: true },
    });

    // footer / contact small touches
    gsap.from('.company__logo', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.company__logo', start: 'top 85%', once: true } });
  };

  /* ------------------------------------------------------------
     Service list: floating preview
  ------------------------------------------------------------ */
  const list = $('#svcList');
  const pv = $('#svcPreview');
  if (list && pv && fine && !reduce) {
    const imgs = $$('img', pv);
    gsap.set(pv, { x: 0, y: 0, scale: 0.8, rotate: -4 });
    const xTo = gsap.quickTo(pv, 'x', { duration: 0.7, ease: 'power3' });
    const yTo = gsap.quickTo(pv, 'y', { duration: 0.7, ease: 'power3' });
    let shown = false, lx = 0, ly = 0;
    const show = (x, y) => {
      if (shown) return;
      shown = true;
      gsap.set(pv, { x: x + 36, y: Math.min(Math.max(12, y - pv.offsetHeight / 2), innerHeight - pv.offsetHeight - 12) });
      gsap.to(pv, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
    };
    const hide = () => {
      if (!shown) return;
      shown = false;
      gsap.to(pv, { autoAlpha: 0, scale: 0.85, rotate: 3, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    };
    list.addEventListener('mouseenter', (e) => show(e.clientX, e.clientY));
    list.addEventListener('mouseleave', hide);
    addEventListener('mousemove', (e) => { lx = e.clientX; ly = e.clientY; }, { passive: true });
    list.addEventListener('mousemove', (e) => {
      show(e.clientX, e.clientY);
      const w = pv.offsetWidth, h = pv.offsetHeight;
      let x = e.clientX + 36;
      if (x + w > innerWidth - 12) x = e.clientX - w - 36;
      xTo(x);
      yTo(Math.min(Math.max(12, e.clientY - h / 2), innerHeight - h - 12));
    }, { passive: true });
    // the pointer can stay still while the page scrolls under it
    addEventListener('scroll', () => {
      if (!shown) return;
      const el = document.elementFromPoint(lx, ly);
      if (!el || !list.contains(el)) hide();
    }, { passive: true });
    $$('li', list).forEach((li) => {
      li.addEventListener('mouseenter', () => {
        const idx = +li.dataset.media;
        imgs.forEach((im, i) => im.classList.toggle('on', i === idx));
      });
    });
  }

  // choosing a service pre-selects it in the form
  const pills = $$('#pills input');
  $$('#svcList a[data-service]').forEach((a) => {
    a.addEventListener('click', () => {
      pills.forEach((p) => { if (p.value === a.dataset.service) p.checked = true; });
    });
  });

  /* ------------------------------------------------------------
     Contact: copy e-mail + mailto form
  ------------------------------------------------------------ */
  const MAIL = 'kotaki.company@gmail.com';
  const copyBtn = $('#copyMail');
  const copyState = $('#copyState');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(MAIL);
      copyState.textContent = 'コピーしました ✓';
    } catch (e) {
      location.href = 'mailto:' + MAIL;
      copyState.textContent = 'メールアプリを開きます';
    }
    setTimeout(() => (copyState.textContent = 'タップでコピー'), 2200);
  });

  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const topics = $$('input[name="topic"]:checked', f).map((i) => i.value);
    const name = f.name.value.trim();
    const contact = f.contact.value.trim();
    const msg = f.msg.value.trim();
    if (!name && !msg) { (name ? f.msg : f.name).focus(); return; }
    const subject = `【HPよりお問い合わせ】${topics.join('・') || 'ご相談'}`;
    const body = [
      `ご用件：${topics.join('、') || '（未選択）'}`,
      `お名前：${name}`,
      `ご連絡先：${contact}`,
      '',
      'ご相談内容：',
      msg,
    ].join('\n');
    location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  /* ------------------------------------------------------------
     Boot
  ------------------------------------------------------------ */
  if (!reduce) prepHero();
  build();
  // header colour on light sections
  $$('[data-theme="light"]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 46px', end: 'bottom 46px',
      toggleClass: { targets: [hdr, $('#progress').parentNode], className: 'is-dark' },
      refreshPriority: -1,
    });
  });

  window.scrollTo(0, 0);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const refresh = () => ScrollTrigger.refresh();
  addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  const start = () => {
    try { sessionStorage.setItem('km-seen', '1'); } catch (e) {}
    if (lenis) lenis.start();
    if (!reduce) heroIn();
    if (heroVideo) { const p = heroVideo.play(); if (p && p.catch) p.catch(() => {}); }
  };
  runLoader().then(start);
})();
