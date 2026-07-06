/* ============================================================
   SEMSA — marcas-bridge.js  (solo marcas.html)
   Lee /api/public/marcas y superpone la oferta + el conteo de productos que
   vive en la base de datos sobre las tarjetas de marca ya renderizadas
   (.bcard / .brow), emparejando por el slug del enlace "catalogo.html?marca=<slug>".
   Fail-soft total: sin red / sin backend, quedan los valores hardcoded del HTML.
   ============================================================ */
(function () {
  'use strict';
  if (!window.fetch) return;

  function slugFromHref(a) {
    var m = /[?&]marca=([^&]+)/.exec(a.getAttribute('href') || '');
    return m ? decodeURIComponent(m[1]) : null;
  }

  function apply(list) {
    if (!Array.isArray(list)) return;
    var map = {};
    list.forEach(function (b) { if (b && b.slug) map[b.slug] = b; });

    document.querySelectorAll('a.bcard, a.brow').forEach(function (card) {
      var slug = slugFromHref(card);
      if (!slug || !map[slug]) return;
      var b = map[slug];

      var offer = card.querySelector('.bcard__offer, .brow__offer');
      if (offer && b.oferta && String(b.oferta).trim() !== '') offer.textContent = b.oferta;

      var strong = card.querySelector('.bcard__cta strong, .brow__count strong');
      if (strong && b.count != null && b.count > 0) strong.textContent = b.count;
    });
  }

  function load() {
    fetch('/api/public/marcas', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(apply)
      .catch(function () { /* fail-soft: se queda el hardcoded del HTML */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
