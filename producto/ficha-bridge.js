/* ============================================================
   SEMSA — ficha-bridge.js (solo en producto/*.html)
   Sobrepone en vivo los campos editables de ESTE producto (nombre/SKU/descripción/imagen)
   leyendo /api/public/producto/:slug, sin tocar el cross-sell ni el JSON-LD generados
   estáticamente. Fail-soft: si el fetch falla o el producto no tiene overrides, el HTML
   estático (estable para SEO) se queda tal cual.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('.prod');
  if (!root) return;
  var slug = (window.location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  if (!slug) return;

  fetch('/api/public/producto/' + encodeURIComponent(slug), { credentials: 'same-origin', cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (p) {
      if (!p || p.ok === false) return;
      if (p.visible === false) return; // el estático se queda; no se oculta la página ya indexada
      var title = root.querySelector('.prod__title');
      var sku = root.querySelector('.prod__sku strong');
      var desc = root.querySelector('.prod__desc');
      var img = root.querySelector('.prod__img');
      if (title && p.name) title.textContent = p.name;
      if (sku && p.sku) sku.textContent = p.sku;
      if (desc && p.desc) desc.textContent = p.desc;
      if (img && p.img) { img.src = '../assets/img/catalogo/' + p.img; img.alt = p.name || img.alt; }
    })
    .catch(function () { /* fail-soft */ });
})();
