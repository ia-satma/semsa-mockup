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

      // Ficha técnica PDF (si el admin subió una): añade/actualiza un botón de descarga
      // dentro del bloque de acciones, sin tocar el HTML estático si no hay PDF.
      if (p.pdf) applyDatasheet(root, p.pdf);

      // SEO editable (agente SEO): actualiza title + meta description/keywords en vivo.
      // Nota: para el crawler, lo definitivo es regenerar la ficha estática; esto mantiene
      // el título de pestaña y previews de compartir alineados con la BD.
      if (p.seo) applySeo(p.seo);
    })
    .catch(function () { /* fail-soft */ });

  function setMeta(name, content) {
    if (!content) return;
    var el = document.head.querySelector('meta[name="' + name + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  function applySeo(seo) {
    if (seo.title) document.title = seo.title;
    if (seo.metaDescription) setMeta('description', seo.metaDescription);
    if (Array.isArray(seo.keywords) && seo.keywords.length) setMeta('keywords', seo.keywords.join(', '));
  }

  function applyDatasheet(root, pdf) {
    var cta = root.querySelector('.prod__cta');
    if (!cta) return;
    var link = root.querySelector('.prod__datasheet');
    if (!link) {
      link = document.createElement('a');
      link.className = 'btn btn--ghost btn--icon prod__datasheet';
      link.setAttribute('download', '');
      link.innerHTML = '<span>Descargar ficha técnica (PDF)</span>' +
        '<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg></span>';
      cta.appendChild(link);
    }
    link.setAttribute('href', '../assets/docs/' + pdf);
  }
})();
