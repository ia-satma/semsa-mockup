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

// ── CATÁLOGO DINÁMICO: 496 productos desde data/catalogo.json (catalogo.html) ──
(function initCatalog() {
  const root = document.querySelector('[data-catalog]');
  if (!root) return;
  const grid = root.querySelector('[data-cat-grid]');
  const brandsBox = root.querySelector('[data-cat-brands]');
  const catSelect = root.querySelector('[data-cat-category]');
  const searchInput = root.querySelector('[data-cat-search]');
  const countEl = root.querySelector('[data-cat-count]');
  const emptyEl = root.querySelector('[data-cat-empty]');
  const moreBtn = root.querySelector('[data-cat-more]');
  const resetBtn = root.querySelector('[data-cat-reset]');
  const PER = 60;

  let all = [], filtered = [], shown = 0;
  let fBrand = '', fCat = '', fQuery = '';
  const added = new Set();   // lista de cotización (persiste entre re-renders)

  const norm = function (s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  const esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function cardHTML(p) {
    const isAdded = added.has(p.name);
    const sku = p.sku ? '<p class="pcard__sku">SKU: ' + esc(p.sku) + '</p>' : '';
    const desc = p.desc ? '<p class="product-card__spec">' + esc(p.desc) + '</p>' : '';
    const img = p.img
      ? '<img class="product-card__img" src="assets/img/catalogo/' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="300" height="300">'
      : '';
    return '<article class="product-card">' +
      '<div class="product-card__media">' + img +
        '<span class="product-card__cat">' + esc(p.cat) + '</span>' +
      '</div>' +
      '<div class="product-card__body">' +
        '<span class="pcard__brand">' + esc(p.brand) + '</span>' +
        '<h2 class="product-card__title">' + esc(p.name) + '</h2>' +
        sku + desc +
        '<div class="product-card__actions">' +
          '<button type="button" class="product-card__add' + (isAdded ? ' is-added' : '') +
            '" data-add-quote data-product="' + esc(p.name) + '">' +
            (isAdded ? '✓ Agregado' : '+ Agregar a cotización') + '</button>' +
          '<a class="product-card__quote" href="index.html#cotizar">Cotizar</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function applyFilters() {
    filtered = all.filter(function (p) {
      if (fBrand && p.brand !== fBrand) return false;
      if (fCat && p.cat !== fCat) return false;
      if (fQuery) {
        const hay = norm(p.name) + ' ' + norm(p.sku) + ' ' + norm(p.brand);
        if (hay.indexOf(fQuery) === -1) return false;
      }
      return true;
    });
    shown = 0;
    grid.innerHTML = '';
    render();
  }

  function render() {
    const next = filtered.slice(shown, shown + PER);
    grid.insertAdjacentHTML('beforeend', next.map(cardHTML).join(''));
    shown += next.length;
    countEl.textContent = String(filtered.length);
    if (emptyEl) emptyEl.hidden = filtered.length !== 0;
    if (moreBtn) moreBtn.hidden = shown >= filtered.length;
    grid.setAttribute('aria-busy', 'false');
  }

  function buildBrands() {
    const counts = {};
    all.forEach(function (p) { counts[p.brand] = (counts[p.brand] || 0) + 1; });
    const brands = Object.keys(counts).sort(function (a, b) {
      if (a === 'Otros') return 1; if (b === 'Otros') return -1;
      return counts[b] - counts[a];
    });
    let html = '<button type="button" class="catalog__filter is-active" data-brand="">Todas <b>' + all.length + '</b></button>';
    brands.forEach(function (b) {
      html += '<button type="button" class="catalog__filter" data-brand="' + esc(b) + '">' + esc(b) + ' <b>' + counts[b] + '</b></button>';
    });
    brandsBox.innerHTML = html;
  }

  function buildCats() {
    const counts = {};
    all.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
    const cats = Object.keys(counts).sort(function (a, b) {
      if (a === 'Otros') return 1; if (b === 'Otros') return -1;
      return a.localeCompare(b, 'es');
    });
    cats.forEach(function (c) {
      const o = document.createElement('option');
      o.value = c; o.textContent = c + ' (' + counts[c] + ')';
      catSelect.appendChild(o);
    });
  }

  brandsBox.addEventListener('click', function (e) {
    const btn = e.target.closest('.catalog__filter');
    if (!btn) return;
    fBrand = btn.getAttribute('data-brand') || '';
    brandsBox.querySelectorAll('.catalog__filter').forEach(function (b) {
      b.classList.toggle('is-active', b === btn);
    });
    applyFilters();
  });
  catSelect.addEventListener('change', function () { fCat = catSelect.value; applyFilters(); });
  let tDeb;
  searchInput.addEventListener('input', function () {
    clearTimeout(tDeb);
    tDeb = setTimeout(function () { fQuery = norm(searchInput.value.trim()); applyFilters(); }, 180);
  });
  if (moreBtn) moreBtn.addEventListener('click', render);
  if (resetBtn) resetBtn.addEventListener('click', function () {
    fBrand = ''; fCat = ''; fQuery = '';
    searchInput.value = ''; catSelect.value = '';
    brandsBox.querySelectorAll('.catalog__filter').forEach(function (b, i) { b.classList.toggle('is-active', i === 0); });
    applyFilters();
  });

  // Lista de cotización (delegación, tolera cards dinámicas)
  (function () {
    const bar = document.querySelector('[data-quote-bar]');
    if (!bar) return;
    const countQ = bar.querySelector('[data-quote-count]');
    const wordQ = bar.querySelector('[data-quote-word]');
    grid.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-add-quote]');
      if (!btn) return;
      const id = btn.getAttribute('data-product') || '';
      if (added.has(id)) {
        added.delete(id); btn.classList.remove('is-added'); btn.textContent = '+ Agregar a cotización';
      } else {
        added.add(id); btn.classList.add('is-added'); btn.textContent = '✓ Agregado';
      }
      if (countQ) countQ.textContent = String(added.size);
      if (wordQ) wordQ.textContent = added.size === 1 ? 'producto' : 'productos';
      bar.hidden = added.size === 0;
    });
  })();

  fetch('data/catalogo.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      all = data;
      buildBrands();
      buildCats();
      applyFilters();
    })
    .catch(function (err) {
      grid.setAttribute('aria-busy', 'false');
      grid.innerHTML = '<p class="catalog__disclaimer">No se pudo cargar el catálogo (' + esc(err.message) +
        '). La página debe servirse por HTTP (no funciona abriendo el archivo directo).</p>';
    });
})();

/* ─── Accesos rápidos: preseleccionan el "tipo de necesidad" en el formulario ─── */
(function initNeedChips() {
  const sel = document.getElementById('f-tipo');
  document.querySelectorAll('[data-tipo]').forEach(function (chip) {
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

/* ─── HERO VIDEO: reproduce con gates + pausa fuera de viewport ─── */
(function initHeroVideo() {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;
  const hero = video.closest('.hero');
  const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  const saveData = !!(conn && (conn.saveData || /(^|[^a-z])2g$/.test(conn.effectiveType || '')));

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
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pause(); return; }
    const r = video.getBoundingClientRect();
    if (r.bottom > 0 && r.top < (window.innerHeight || 0)) tryPlay();
  });
})();

/* ─── Menú animado: expansión hover/focus, columna 01 activa por defecto ─── */
(function initHeroSol() {
  const group = document.querySelector('[data-hero-panels]');
  if (!group) return;
  const panels = Array.prototype.slice.call(group.querySelectorAll('.hp'));
  if (!panels.length) return;
  function clearOn() { panels.forEach(function (x) { x.classList.remove('on'); }); }
  panels.forEach(function (p) {
    p.addEventListener('mouseenter', clearOn);
    p.addEventListener('focus', function () { clearOn(); p.classList.add('on'); });
  });
  group.addEventListener('mouseleave', function () { clearOn(); panels[0].classList.add('on'); });
})();
