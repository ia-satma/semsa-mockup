// =============================================================
// SEMSA — Mockup JavaScript · Elevación premium
// Reveals on-scroll (IntersectionObserver) · hover magnético
// nav island · menú móvil morph · respeta prefers-reduced-motion
// =============================================================

'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)');

// ── NAV ISLAND: estado al hacer scroll ────────────────────────
(function initNavScroll() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  let ticking = false;
  function update() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// ── MENÚ MÓVIL: morph hamburguesa→X + reveal escalonado ───────
(function initMobileMenu() {
  const burger = document.querySelector('[data-burger]');
  const menu   = document.querySelector('[data-mobile-menu]');
  if (!burger || !menu) return;

  const links = menu.querySelectorAll('.mobile-menu__link');
  links.forEach(function (link, i) { link.style.setProperty('--i', i); });

  function setOpen(open) {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () {
    setOpen(!menu.classList.contains('is-open'));
  });

  // Cerrar al navegar
  menu.querySelectorAll('a[href]').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  // Cerrar con Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
  });
})();

// ── SCROLL SUAVE con offset de la isla flotante ───────────────
(function initSmoothScroll() {
  const OFFSET = 80;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    link.addEventListener('click', function (e) {
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top: y, behavior: REDUCED.matches ? 'auto' : 'smooth' });
    });
  });
})();

// ── REVEALS ON-SCROLL: fade-up + blur→0, staggered ────────────
(function initReveals() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  // Asignar delay escalonado declarado en data-reveal-delay
  targets.forEach(function (el) {
    const d = el.getAttribute('data-reveal-delay');
    if (d) el.style.setProperty('--reveal-delay', d);
  });

  if (REDUCED.matches || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  function show(el) { el.classList.add('is-visible'); }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        show(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  targets.forEach(function (el) { observer.observe(el); });

  // Red de seguridad: revela de inmediato lo que ya está en/sobre el viewport
  // (cubre above-the-fold y entornos donde el observer no dispara).
  function revealInView() {
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    targets.forEach(function (el) {
      if (el.classList.contains('is-visible')) return;
      const top = el.getBoundingClientRect().top;
      if (!vh || top < vh * 0.92) { show(el); observer.unobserve(el); }
    });
  }
  requestAnimationFrame(revealInView);
  // Failsafe final: nada puede quedar permanentemente oculto.
  window.addEventListener('load', function () {
    setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains('is-visible')) { show(el); observer.unobserve(el); }
      });
    }, 1400);
  });
})();

// ── HOVER MAGNÉTICO (transform-only, solo puntero fino) ───────
(function initMagnetic() {
  if (REDUCED.matches || !FINE_POINTER.matches) return;
  const els = document.querySelectorAll('[data-magnetic]');
  const STRENGTH = 14;   // px máximos de desplazamiento

  els.forEach(function (el) {
    let raf = null;
    let tx = 0, ty = 0;

    function onMove(e) {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      tx = (mx / (r.width / 2)) * STRENGTH;
      ty = (my / (r.height / 2)) * STRENGTH;
      if (!raf) raf = requestAnimationFrame(apply);
    }
    function apply() {
      el.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)';
      raf = null;
    }
    function reset() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      el.style.transform = '';
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', reset);
  });
})();

// ── FORMULARIO: feedback visual (solo mockup) ─────────────────
(function initForm() {
  const form = document.querySelector('.form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    const label = btn.querySelector('span:first-child');
    const original = label ? label.textContent : btn.textContent;

    if (label) label.textContent = 'Enviando...';
    btn.disabled = true;
    btn.style.opacity = '.7';

    setTimeout(function () {
      if (label) label.textContent = 'Solicitud enviada — le contactaremos en breve';
      btn.style.background = '#4CA000';
      btn.style.opacity = '1';
      setTimeout(function () {
        if (label) label.textContent = original;
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 4000);
    }, 1100);
  });
})();

// ── TITULARES: reveal palabra por palabra (hero + page-hero) ──
(function initHeadlineReveal() {
  if (REDUCED.matches) return;
  const headings = document.querySelectorAll('.hero__heading, .page-hero__title');
  headings.forEach(function (h) {
    if (h.classList.contains('headline-split')) return;

    // Divide en "unidades": palabras de nodos de texto; los elementos
    // (p.ej. el acento "Ingersoll Rand") se conservan como una unidad.
    const units = [];
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) units.push(document.createTextNode(' '));
          else units.push(part);
        });
      } else {
        units.push(node);
      }
    });

    h.textContent = '';
    let i = 0;
    units.forEach(function (u) {
      if (typeof u !== 'string' && u.nodeType === 3) { h.appendChild(u); return; }
      const w = document.createElement('span');
      w.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'w__inner';
      inner.style.setProperty('--wi', i++);
      if (typeof u === 'string') inner.textContent = u;
      else inner.appendChild(u);
      w.appendChild(inner);
      h.appendChild(w);
    });

    h.classList.add('headline-split');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { h.classList.add('is-played'); });
    });
  });
})();

// ── TRUST BAND: contadores al entrar en viewport ──────────────
(function initCounters() {
  const nums = document.querySelectorAll('.trust__num');
  if (!nums.length || REDUCED.matches || !('IntersectionObserver' in window)) return;

  function animate(el) {
    const raw = el.textContent.trim();
    const plus = raw.charAt(0) === '+';
    const target = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;
    // Años ruedan desde cerca (target-24); conteos "+N" desde 0.
    const from = plus ? 0 : Math.max(0, target - 24);
    const dur = plus ? 900 : 800;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = Math.round(from + (target - from) * eased);
      el.textContent = (plus ? '+' : '') + val;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  nums.forEach(function (el) { io.observe(el); });
})();

// ── BARRA DE PROGRESO DE SCROLL ───────────────────────────────
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  let ticking = false;
  function update() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// ── HERO VIDEO: reproduce con gates + pausa fuera de viewport ──
(function initHeroVideo() {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;
  const hero = video.closest('.hero');
  const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  const saveData = !!(conn && (conn.saveData || /(^|[^a-z])2g$/.test(conn.effectiveType || '')));

  // Gates: reduced-motion o ahorro de datos → no se reproduce; queda el póster.
  if (REDUCED.matches || saveData) {
    if (hero) hero.classList.add('hero--static');
    return;
  }

  function tryPlay() {
    const p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () { if (hero) hero.classList.add('hero--static'); });
    }
  }
  function pause() { try { video.pause(); } catch (e) {} }

  // Reproduce sólo cuando el hero está a la vista (ahorra CPU/batería).
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) tryPlay(); else pause();
      });
    }, { threshold: 0.2 });
    io.observe(video);
  } else {
    tryPlay();
  }

  // Pausa al ocultar la pestaña; reanuda si el hero sigue a la vista.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pause(); return; }
    const r = video.getBoundingClientRect();
    if (r.bottom > 0 && r.top < (window.innerHeight || 0)) tryPlay();
  });
})();

// ── CATÁLOGO: filtro por categoría (solo en catalogo.html) ────
(function initCatalogFilter() {
  const filters = document.querySelector('[data-catalog-filters]');
  const grid = document.querySelector('[data-catalog-grid]');
  if (!filters || !grid) return;
  const cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
  filters.addEventListener('click', function (e) {
    const btn = e.target.closest('.catalog__filter');
    if (!btn) return;
    const cat = btn.getAttribute('data-filter');
    filters.querySelectorAll('.catalog__filter').forEach(function (b) {
      b.classList.toggle('is-active', b === btn);
    });
    cards.forEach(function (card) {
      const show = cat === 'all' || card.getAttribute('data-cat') === cat;
      card.classList.toggle('is-hidden', !show);
    });
  });
})();

// ── CATÁLOGO: lista de cotización (stub de mockup; cableado real en Fase 5) ──
(function initQuoteList() {
  const bar = document.querySelector('[data-quote-bar]');
  if (!bar) return;
  const countEl = bar.querySelector('[data-quote-count]');
  const added = new Set();
  document.querySelectorAll('[data-add-quote]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-product') || String(added.size);
      if (added.has(id)) {
        added.delete(id);
        btn.classList.remove('is-added');
        btn.textContent = '+ Agregar a cotización';
      } else {
        added.add(id);
        btn.classList.add('is-added');
        btn.textContent = '✓ Agregado';
      }
      const n = added.size;
      if (countEl) countEl.textContent = String(n);
      bar.hidden = n === 0;
    });
  });
})();

/* ─── Accesos rápidos: preseleccionan el "tipo de necesidad" en el formulario ─── */
(function initNeedChips() {
  const sel = document.getElementById('f-tipo');
  document.querySelectorAll('.hero__chip[data-tipo]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (!sel) return;
      const v = chip.getAttribute('data-tipo');
      const ok = Array.prototype.some.call(sel.options, function (o) { return o.value === v; });
      if (ok) sel.value = v;
    });
  });
})();

/* ─── Modal: urgencia en planta (foco gestionado + Esc + bloqueo de scroll) ─── */
(function initUrgencyModal() {
  const modal = document.getElementById('urg-modal');
  if (!modal) return;
  let opener = null;
  function open(trigger) {
    opener = trigger || null;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const closeBtn = modal.querySelector('.urg__close');
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (opener && typeof opener.focus === 'function') opener.focus();
    opener = null;
  }
  document.querySelectorAll('[data-urgencia]').forEach(function (btn) {
    btn.addEventListener('click', function (e) { e.preventDefault(); open(btn); });
  });
  modal.querySelectorAll('[data-urg-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();
