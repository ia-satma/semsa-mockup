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
// Envía TODOS los forms de contacto/cotización del sitio a POST /api/public/quote (real,
// persistido en la BD, visible en admin → Clientes). Incluye los productos de la lista de
// cotización (localStorage, compartida con initCatalog/initProductQuote). Fail-visible: si el
// backend no responde (ej. sitio estático sin servidor), muestra error y no borra el form.
(function initForms() {
  var QUOTE_KEY = 'semsa_quote_items';
  function getQuoteItems() {
    try { return JSON.parse(localStorage.getItem(QUOTE_KEY) || '[]'); } catch (e) { return []; }
  }

  document.querySelectorAll('form.form').forEach(function (form) {
    var origen = form.classList.contains('urg__form') ? 'urgencia'
      : (document.querySelector('[data-catalog]') || document.querySelector('.prod')) ? 'ficha-producto'
      : 'web-cotizar';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var label = btn ? btn.querySelector('span:first-child') : null;
      var original = label ? label.textContent : (btn ? btn.textContent : '');
      var fd = new FormData(form);
      var payload = {
        nombre: fd.get('nombre') || '',
        empresa: fd.get('empresa') || '',
        telefono: fd.get('telefono') || '',
        email: fd.get('email') || '',
        tipo: fd.get('tipo') || fd.get('linea') || '',
        mensaje: fd.get('mensaje') || fd.get('ciudad') || '',
        origen: origen,
        items: getQuoteItems(),
      };

      if (btn) { btn.disabled = true; btn.style.opacity = '.7'; }
      if (label) label.textContent = 'Enviando...';

      fetch('/api/public/quote', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function () {
          if (label) label.textContent = 'Solicitud enviada — le contactaremos en breve';
          if (btn) { btn.style.background = '#4CA000'; btn.style.opacity = '1'; }
          try { localStorage.removeItem(QUOTE_KEY); } catch (e) {}
          var bar = document.querySelector('[data-quote-bar]');
          if (bar) bar.hidden = true;
          setTimeout(function () {
            if (label) label.textContent = original;
            if (btn) { btn.style.background = ''; btn.disabled = false; }
            form.reset();
          }, 4000);
        })
        .catch(function () {
          if (label) label.textContent = 'No se pudo enviar — intente de nuevo o use WhatsApp';
          if (btn) { btn.style.background = '#C0392B'; btn.style.opacity = '1'; }
          setTimeout(function () {
            if (label) label.textContent = original;
            if (btn) { btn.style.background = ''; btn.disabled = false; }
          }, 3500);
        });
    });
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
  let fMarca = '', fCat = '', fApp = '', fDiv = '', fQuery = '';
  const added = new Set();   // lista de cotización (persiste entre re-renders)

  const norm = function (s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  const jslug = function (s) {
    return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };
  const esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function cardHTML(p) {
    const isAdded = added.has(p.name);
    const href = 'producto/' + esc(p.slug) + '.html';
    const sku = p.sku ? '<p class="pcard__sku">SKU: ' + esc(p.sku) + '</p>' : '';
    const desc = p.desc ? '<p class="product-card__spec">' + esc(p.desc) + '</p>' : '';
    const img = p.img
      ? '<img class="product-card__img" src="assets/img/catalogo/' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="300" height="300">'
      : '';
    return '<article class="product-card">' +
      '<a class="product-card__media" href="' + href + '" aria-label="Ver ' + esc(p.name) + '">' + img +
        '<span class="product-card__cat">' + esc(p.cat) + '</span>' +
      '</a>' +
      '<div class="product-card__body">' +
        '<span class="pcard__brand">' + esc(p.brand) + '</span>' +
        '<h2 class="product-card__title"><a href="' + href + '">' + esc(p.name) + '</a></h2>' +
        sku + desc +
        '<div class="product-card__actions">' +
          '<button type="button" class="product-card__add' + (isAdded ? ' is-added' : '') +
            '" data-add-quote data-product="' + esc(p.name) + '">' +
            (isAdded ? '✓ Agregado' : '+ Agregar a cotización') + '</button>' +
          '<a class="product-card__quote" href="' + href + '">Ver ficha</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function matches(p) {
    if (fMarca && p.marca_slug !== fMarca) return false;
    if (fCat && p.cat_slug !== fCat) return false;
    if (fApp && !(p.aplicaciones || []).some(function (a) { return jslug(a) === fApp; })) return false;
    if (fDiv && jslug(p.division) !== fDiv) return false;
    if (fQuery) {
      const hay = norm(p.name) + ' ' + norm(p.sku) + ' ' + norm(p.brand);
      if (hay.indexOf(fQuery) === -1) return false;
    }
    return true;
  }

  function syncURL() {
    const q = [];
    if (fMarca) q.push('marca=' + fMarca);
    if (fCat) q.push('categoria=' + fCat);
    if (fApp) q.push('aplicacion=' + fApp);
    if (fDiv) q.push('division=' + fDiv);
    try { history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : '')); } catch (e) {}
  }

  function applyFilters() {
    filtered = all.filter(matches);
    shown = 0;
    grid.innerHTML = '';
    render();
    syncURL();
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
    const counts = {}, slugOf = {};
    all.forEach(function (p) { counts[p.brand] = (counts[p.brand] || 0) + 1; slugOf[p.brand] = p.marca_slug; });
    const brands = Object.keys(counts).sort(function (a, b) {
      if (a === 'Otros') return 1; if (b === 'Otros') return -1;
      return counts[b] - counts[a];
    });
    let html = '<button type="button" class="catalog__filter' + (fMarca ? '' : ' is-active') + '" data-marca="">Todas <b>' + all.length + '</b></button>';
    brands.forEach(function (b) {
      const s = slugOf[b] || jslug(b);
      html += '<button type="button" class="catalog__filter' + (fMarca === s ? ' is-active' : '') + '" data-marca="' + esc(s) + '">' + esc(b) + ' <b>' + counts[b] + '</b></button>';
    });
    brandsBox.innerHTML = html;
  }

  function buildCats() {
    const counts = {}, nameOf = {};
    all.forEach(function (p) { counts[p.cat_slug] = (counts[p.cat_slug] || 0) + 1; nameOf[p.cat_slug] = p.cat; });
    Object.keys(counts).sort(function (a, b) { return nameOf[a].localeCompare(nameOf[b], 'es'); })
      .forEach(function (s) {
        const o = document.createElement('option');
        o.value = s; o.textContent = nameOf[s] + ' (' + counts[s] + ')';
        if (s === fCat) o.selected = true;
        catSelect.appendChild(o);
      });
  }

  brandsBox.addEventListener('click', function (e) {
    const btn = e.target.closest('.catalog__filter');
    if (!btn) return;
    fMarca = btn.getAttribute('data-marca') || '';
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
    fMarca = ''; fCat = ''; fApp = ''; fDiv = ''; fQuery = '';
    searchInput.value = ''; catSelect.value = '';
    brandsBox.querySelectorAll('.catalog__filter').forEach(function (b, i) { b.classList.toggle('is-active', i === 0); });
    applyFilters();
  });

  // Lista de cotización (delegación, tolera cards dinámicas) — persiste en localStorage
  // para que el form de "Solicitar cotización" (initForms) la incluya al enviar.
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
      try { localStorage.setItem('semsa_quote_items', JSON.stringify(Array.from(added))); } catch (e) {}
    });
  })();

  fetch('/api/public/catalogo')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .catch(function () { return fetch('data/catalogo.json').then(function (r) { return r.json(); }); })
    .then(function (data) {
      all = data;
      const vM = {}, vC = {}, vA = {}, vD = {};
      all.forEach(function (p) {
        vM[p.marca_slug] = 1; vC[p.cat_slug] = 1;
        (p.aplicaciones || []).forEach(function (a) { vA[jslug(a)] = 1; });
        if (p.division) vD[jslug(p.division)] = 1;
      });
      const q = new URLSearchParams(location.search);
      fMarca = q.get('marca') || ''; if (!vM[fMarca]) fMarca = '';
      fCat = q.get('categoria') || ''; if (!vC[fCat]) fCat = '';
      fApp = q.get('aplicacion') || ''; if (!vA[fApp]) fApp = '';
      fDiv = q.get('division') || ''; if (!vD[fDiv]) fDiv = '';
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

/* ─── FICHA DE PRODUCTO: lista de cotización (páginas producto/<slug>.html) ─── */
(function initProductQuote() {
  if (document.querySelector('[data-catalog]')) return;   // el catálogo ya gestiona su propia lista
  const bar = document.querySelector('[data-quote-bar]');
  if (!bar) return;
  const countQ = bar.querySelector('[data-quote-count]');
  const wordQ = bar.querySelector('[data-quote-word]');
  let added = new Set();
  try { added = new Set(JSON.parse(localStorage.getItem('semsa_quote_items') || '[]')); } catch (e) {}
  if (added.size) {
    document.querySelectorAll('[data-add-quote]').forEach(function (btn) {
      if (added.has(btn.getAttribute('data-product'))) { btn.classList.add('is-added'); btn.textContent = '✓ Agregado'; }
    });
    if (countQ) countQ.textContent = String(added.size);
    if (wordQ) wordQ.textContent = added.size === 1 ? 'producto' : 'productos';
    bar.hidden = false;
  }
  document.addEventListener('click', function (ev) {
    const btn = ev.target.closest('[data-add-quote]');
    if (!btn) return;
    const id = btn.getAttribute('data-product') || '';
    if (added.has(id)) { added.delete(id); btn.classList.remove('is-added'); btn.textContent = '+ Agregar a cotización'; }
    else { added.add(id); btn.classList.add('is-added'); btn.textContent = '✓ Agregado'; }
    if (countQ) countQ.textContent = String(added.size);
    if (wordQ) wordQ.textContent = added.size === 1 ? 'producto' : 'productos';
    bar.hidden = added.size === 0;
    try { localStorage.setItem('semsa_quote_items', JSON.stringify(Array.from(added))); } catch (e) {}
  });
})();

/* ─── HOME: "Lo más solicitado" — tira de paneles estilo Soluciones, rotación semanal ─── */
(function initFeaturedStrip() {
  const strip = document.querySelector('[data-featured-strip]');
  if (!strip) return;
  var POOL=[{"s":"polipasto-electrico-de-cadena-de-1-t-elk50-2nd100","n":"Polipasto Electrico de Cadena de 1 t. ELK50-2ND100 Ingersoll Rand","b":"Ingersoll Rand","d":"Manejo de Material","ds":"manejo-de-material","i":"polipasto-electrico-de-cadena-de-1-t-elk50-2nd100.webp","r":1},{"s":"bomba-de-diafragma-9","n":"Bomba neumática Aro 666100-322-C","b":"Aro","d":"Equipo de Bombeo","ds":"equipo-de-bombeo","i":"bomba-de-diafragma-9.webp"},{"s":"bomba-endura-flo","n":"Bomba Endura-Flo","b":"Graco","d":"Manejo de Fluidos","ds":"manejo-de-fluidos","i":"bomba-endura-flo.webp","r":1},{"s":"riv710-herramienta-a-bateria-para-remaches","n":"RIV710 Remachadora de Batería Rivit","b":"Rivit","d":"Ensamble","ds":"ensamble","i":"riv710-herramienta-a-bateria-para-remaches.webp"},{"s":"polipasto-neumatico-7776e-2c10-c6s","n":"Polipasto neumatico 7776E-2C10-C6S","b":"Aro","d":"Manejo de Material","ds":"manejo-de-material","i":"polipasto-neumatico-7776e-2c10-c6s.webp"},{"s":"pistola-de-impacto","n":"Pistola de impacto 2190Ti","b":"Ingersoll Rand","d":"Ensamble","ds":"ensamble","i":"pistola-de-impacto.webp","r":1},{"s":"dosificador","n":"Dosificador PR70","b":"Graco","d":"Manejo de Fluidos","ds":"manejo-de-fluidos","i":"dosificador.webp"},{"s":"bomba-de-grasa","n":"Bomba de grasa Aro LP2002-W","b":"Aro","d":"Equipo de Bombeo","ds":"equipo-de-bombeo","i":"bomba-de-grasa.webp"},{"s":"llave-de-impacto-inalambrico","n":"Llave de impacto inalambrico WT01","b":"Makita","d":"Ensamble","ds":"ensamble","i":"llave-de-impacto-inalambrico.webp"},{"s":"polipasto-electricos-de-cadena-2","n":"Polipasto eléctrico de Cadena 1-5 T. Serie S Hitachi","b":"Hitachi","d":"Manejo de Material","ds":"manejo-de-material","i":"polipasto-electricos-de-cadena-2.webp"},{"s":"binks-bombas-de-serie-maple-2","n":"Binks Bombas de Serie Maple 15/25","b":"Carlisle","d":"Manejo de Fluidos","ds":"manejo-de-fluidos","i":"binks-bombas-de-serie-maple-2.webp"},{"s":"aprietatuercas-angular","n":"Aprietatuercas angular 19RAA04AM2 Cleco","b":"Cleco","d":"Ensamble","ds":"ensamble","i":"aprietatuercas-angular.webp"},{"s":"bomba-de-aceite-af0409a13pfl1","n":"Bomba de aceite Aro AF0409A13PFL1","b":"Aro","d":"Equipo de Bombeo","ds":"equipo-de-bombeo","i":"bomba-de-aceite-af0409a13pfl1.webp"},{"s":"polipasto-electrico-de-cadena-de-2-t-elk100-2nd200","n":"Polipasto Electrico de Cadena de 2 t. ELK100-2ND200 Ingersoll Rand","b":"Ingersoll Rand","d":"Manejo de Material","ds":"manejo-de-material","i":"polipasto-electrico-de-cadena-de-2-t-elk100-2nd200.webp"},{"s":"sanispray-hp-65","n":"SaniSpray HP 65 25R792","b":"Graco","d":"Manejo de Fluidos","ds":"manejo-de-fluidos","i":"sanispray-hp-65.webp"},{"s":"cizalla-neumatica","n":"Cizalla neumatica 7802SA","b":"Ingersoll Rand","d":"Ensamble","ds":"ensamble","i":"cizalla-neumatica.webp"},{"s":"bomba-de-diafragma-27","n":"Bomba de diafragma Aro 66605J-3EB","b":"Aro","d":"Equipo de Bombeo","ds":"equipo-de-bombeo","i":"bomba-de-diafragma-27.webp"},{"s":"atornillador-de-impacto-inalambrico","n":"Atornillador de impacto inalambrico DTD154RFE","b":"Makita","d":"Ensamble","ds":"ensamble","i":"atornillador-de-impacto-inalambrico.webp"},{"s":"paquetes-de-bomba-triton","n":"Paquetes de bomba Triton","b":"Graco","d":"Manejo de Fluidos","ds":"manejo-de-fluidos","i":"paquetes-de-bomba-triton.webp"},{"s":"balancin-neumatico-bw035080","n":"Balancin neumatico BW035080","b":"Ingersoll Rand","d":"Manejo de Material","ds":"manejo-de-material","i":"balancin-neumatico-bw035080.webp"}];
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    var ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() * 53 + Math.ceil((((t - ys) / 86400000) + 1) / 7);
  }
  var key = 0; try { key = isoWeek(new Date()); } catch (e) { key = 0; }
  var N = Math.min(10, POOL.length);
  var start = (key * 3) % POOL.length; if (start < 0) start += POOL.length;
  var picked = []; for (var i = 0; i < N; i++) picked.push(POOL[(start + i) % POOL.length]);

  function panel(p) {
    var rib = p.r ? '<span class="fpanel__ribbon">Más solicitado</span>' : '';
    var href = 'producto/' + esc(p.s) + '.html';
    return '<article class="fpanel" role="listitem">' +
      '<a class="fpanel__link" href="' + href + '" aria-label="Ver ' + esc(p.n) + '"></a>' +
      '<span class="fpanel__media"><img src="assets/img/catalogo/' + esc(p.i) + '" alt="' + esc(p.n) + '" loading="lazy" decoding="async">' + rib + '</span>' +
      '<span class="fpanel__content">' +
        '<span class="fpanel__brand">' + esc(p.b) + '</span>' +
        '<span class="fpanel__name">' + esc(p.n) + '</span>' +
        '<span class="fpanel__tag">' + esc(p.d) + '</span>' +
        '<span class="fpanel__cta">' +
          '<button type="button" class="fpanel__add" data-add-quote data-product="' + esc(p.n) + '">Agregar a cotización</button>' +
          '<a class="fpanel__ficha" href="' + href + '">Ver ficha →</a>' +
        '</span>' +
      '</span>' +
    '</article>';
  }
  strip.innerHTML = picked.map(panel).join('');

  var wrap = strip.closest('[data-featured]');
  var prev = wrap ? wrap.querySelector('[data-fprev]') : null;
  var next = wrap ? wrap.querySelector('[data-fnext]') : null;
  function stepW() { var c = strip.querySelector('.fpanel'); return c ? c.offsetWidth + 16 : 280; }
  function go(dir) { strip.scrollBy({ left: dir * stepW(), behavior: 'smooth' }); }
  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });
  function updateArrows() {
    var max = strip.scrollWidth - strip.clientWidth - 4;
    if (prev) prev.disabled = strip.scrollLeft <= 4;
    if (next) next.disabled = strip.scrollLeft >= max;
  }
  strip.addEventListener('scroll', updateArrows, { passive: true });
  updateArrows();

  var dir = 1, timer = null;
  function tick() {
    var max = strip.scrollWidth - strip.clientWidth - 4;
    if (max <= 0) return;
    if (strip.scrollLeft >= max) dir = -1; else if (strip.scrollLeft <= 4) dir = 1;
    go(dir);
  }
  function startAuto() { if (REDUCED.matches) return; stopAuto(); timer = setInterval(tick, 3600); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
  strip.addEventListener('mouseenter', stopAuto);
  strip.addEventListener('mouseleave', startAuto);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? startAuto() : stopAuto(); }); }, { threshold: 0.15 }).observe(strip);
  } else { startAuto(); }

  var down = false, moved = false, sx = 0, sl = 0;
  strip.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft; });
  strip.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 6) { moved = true; stopAuto(); } strip.scrollLeft = sl - dx; });
  function endDrag() { down = false; setTimeout(function () { moved = false; }, 0); startAuto(); }
  strip.addEventListener('pointerup', endDrag);
  strip.addEventListener('pointercancel', endDrag);
  strip.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
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

/* ─── TRAYECTORIA INTERACTIVA ─────────────────────────────────
   Mejora progresiva sobre el <ol class="timeline"> de nosotros.html: ese
   listado es la fuente de datos y también el fallback. Si no hay JS, la
   trayectoria se sigue leyendo como lista vertical, igual que antes.       */
(function initTimelineExplorer() {
  const wrap = document.querySelector('.about__timeline-wrap');
  if (!wrap) return;
  const lista = wrap.querySelector('.timeline');
  if (!lista) return;

  const hitos = Array.prototype.slice.call(lista.querySelectorAll('.timeline__item')).map(function (li) {
    return {
      anio: (li.querySelector('.timeline__year') || {}).textContent || '',
      titulo: (li.querySelector('.timeline__event') || {}).textContent || '',
      nota: (li.querySelector('.timeline__note') || {}).textContent || '',
      clave: li.classList.contains('timeline__item--key')
    };
  });
  if (hitos.length < 2) return;

  const explorador = document.createElement('div');
  explorador.className = 'tl';
  explorador.innerHTML =
    '<div class="tl__rail" role="tablist" aria-label="Años de la trayectoria de SEMSA"></div>' +
    '<div class="tl__panel">' +
      '<div class="tl__panel-inner" role="tabpanel" aria-live="polite">' +
        '<span class="tl__anio"></span>' +
        '<h3 class="tl__titulo"></h3>' +
        '<p class="tl__nota"></p>' +
      '</div>' +
      '<div class="tl__nav">' +
        '<button type="button" class="tl__flecha" data-paso="-1" aria-label="Hito anterior">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>' +
        '</button>' +
        '<span class="tl__contador" aria-hidden="true"></span>' +
        '<button type="button" class="tl__flecha" data-paso="1" aria-label="Hito siguiente">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';

  const riel = explorador.querySelector('.tl__rail');
  const elAnio = explorador.querySelector('.tl__anio');
  const elTitulo = explorador.querySelector('.tl__titulo');
  const elNota = explorador.querySelector('.tl__nota');
  const elCont = explorador.querySelector('.tl__contador');
  const panel = explorador.querySelector('.tl__panel-inner');

  const botones = hitos.map(function (h, i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tl__anio-btn' + (h.clave ? ' tl__anio-btn--clave' : '');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.tabIndex = -1;
    // Hay dos hitos en 2010: el título los distingue para lectores de pantalla.
    b.setAttribute('aria-label', h.anio + ' — ' + h.titulo);
    b.innerHTML = '<span class="tl__anio-txt">' + h.anio + '</span><span class="tl__anio-punto" aria-hidden="true"></span>';
    b.addEventListener('click', function () { mostrar(i, true); });
    riel.appendChild(b);
    return b;
  });

  let actual = -1;
  function mostrar(i, mover) {
    if (i < 0 || i >= hitos.length || i === actual) return;
    actual = i;
    const h = hitos[i];
    elAnio.textContent = h.anio;
    elTitulo.textContent = h.titulo;
    elNota.textContent = h.nota;
    elCont.textContent = (i + 1) + ' / ' + hitos.length;
    botones.forEach(function (b, j) {
      const on = j === i;
      b.classList.toggle('is-activo', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    if (!REDUCED.matches) {
      panel.classList.remove('tl__panel-inner--entra');
      void panel.offsetWidth;             // reinicia la animación
      panel.classList.add('tl__panel-inner--entra');
    }
    if (mover && botones[i].scrollIntoView) {
      botones[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: REDUCED.matches ? 'auto' : 'smooth' });
    }
  }

  explorador.querySelectorAll('.tl__flecha').forEach(function (b) {
    b.addEventListener('click', function () {
      const paso = parseInt(b.dataset.paso, 10);
      mostrar(Math.min(hitos.length - 1, Math.max(0, actual + paso)), true);
    });
  });

  riel.addEventListener('keydown', function (ev) {
    const salto = { ArrowLeft: -1, ArrowRight: 1, Home: -hitos.length, End: hitos.length }[ev.key];
    if (!salto) return;
    ev.preventDefault();
    const destino = Math.min(hitos.length - 1, Math.max(0, actual + salto));
    mostrar(destino, true);
    botones[destino].focus();
  });

  lista.hidden = true;                     // el fallback ya no hace falta
  wrap.appendChild(explorador);
  mostrar(0, false);
})();
