/* ============================================================
   SEMSA — blog-bridge.js  (solo blog.html)
   Pinta los artículos PUBLICADOS desde /api/public/blog en .post-grid; cada tarjeta enlaza a
   /blog/<slug>.html (página de artículo dinámica). Fail-soft: sin backend, quedan las del HTML.
   ============================================================ */
(function () {
  'use strict';
  if (!window.fetch) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return String(d).slice(0, 10); }
  }

  function card(p) {
    var cover = p.cover ? String(p.cover).replace(/^\/+/, '') : '';
    var media = cover
      ? '<div class="post-card__media"><img src="' + esc(cover) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async" width="255" height="255"></div>'
      : '';
    var date = fmtDate(p.created_at);
    return '<article class="post-card">' + media +
      '<div class="post-card__body">' +
        '<div class="post-card__meta"><span class="mono-tag">' + esc(p.category || 'Artículo') + '</span>' +
        (date ? '<span>' + esc(date) + '</span>' : '') + '</div>' +
        '<h2 class="post-card__title">' + esc(p.title) + '</h2>' +
        '<a class="post-card__link" href="blog/' + esc(p.slug) + '.html">Leer artículo →</a>' +
      '</div></article>';
  }

  function load() {
    fetch('/api/public/blog', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (list) {
        if (!Array.isArray(list)) return;
        var grid = document.querySelector('.post-grid');
        if (!grid) return;
        if (!list.length) {
          grid.innerHTML = '<p class="page-note" style="grid-column:1/-1"><span class="mono-tag">Pronto publicaremos artículos y novedades.</span></p>';
        } else {
          grid.innerHTML = list.map(card).join('');
        }
      })
      .catch(function () { /* fail-soft */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
