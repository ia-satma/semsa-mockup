/* ============================================================
   SEMSA — jobs-bridge.js  (solo reclutamiento.html)
   Pinta las vacantes ACTIVAS desde /api/public/jobs en .job-list. "Postularme" abre WhatsApp
   a SEMSA con la vacante prellenada. Fail-soft: sin backend, quedan las tarjetas del HTML.
   ============================================================ */
(function () {
  'use strict';
  if (!window.fetch) return;

  var WA = '5218117998535';           // WhatsApp SEMSA (mismo del sitio)
  var ARROW = '<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function card(j) {
    var meta = [j.area, j.location].filter(Boolean)
      .map(function (t) { return '<span class="mono-tag">' + esc(t) + '</span>'; }).join('');
    var desc = j.description ? '<p class="job-card__desc">' + esc(j.description) + '</p>' : '';
    var reqs = j.requirements ? '<p class="job-card__desc">' + esc(j.requirements) + '</p>' : '';
    var wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola SEMSA, me gustaría postularme a la vacante: ' + (j.title || ''));
    return '<article class="job-card">' +
      '<h2 class="job-card__title">' + esc(j.title) + '</h2>' +
      (meta ? '<div class="job-card__meta">' + meta + '</div>' : '') +
      desc + reqs +
      '<a href="' + wa + '" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--icon job-card__cta">' +
        '<span>Postularme</span>' + ARROW + '</a>' +
    '</article>';
  }

  function load() {
    fetch('/api/public/jobs', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (list) {
        if (!Array.isArray(list)) return;
        var wrap = document.querySelector('.job-list');
        if (!wrap) return;
        if (!list.length) {
          wrap.innerHTML = '<p class="page-note" style="grid-column:1/-1"><span class="mono-tag">Por ahora no hay vacantes abiertas. Escríbenos por WhatsApp y con gusto recibimos tu CV.</span></p>';
        } else {
          wrap.innerHTML = list.map(card).join('');
        }
      })
      .catch(function () { /* fail-soft */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
