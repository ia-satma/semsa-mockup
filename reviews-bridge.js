/* ============================================================
   SEMSA — reviews-bridge.js  (solo resenas.html)
   Pinta las reseñas APROBADAS desde /api/public/reviews en .reviews__grid y cablea el
   formulario "Deja tu reseña" (→ POST /api/public/review, queda en moderación).
   Fail-soft: si el fetch falla (sin backend), quedan las tarjetas del HTML.
   ============================================================ */
(function () {
  'use strict';
  if (!window.fetch) return;

  var AVATAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function stars(n) {
    n = Math.max(0, Math.min(5, parseInt(n, 10) || 5));
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  function renderList(list) {
    var grid = document.querySelector('.reviews__grid');
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = '<p class="page-note" style="grid-column:1/-1"><span class="mono-tag">Aún no hay reseñas publicadas. Sé el primero en dejar la tuya.</span></p>';
    } else {
      grid.innerHTML = list.map(function (r) {
        var meta = [r.role, r.company].filter(Boolean).map(esc).join(' · ');
        return '<figure class="review-card">' +
          '<span class="review-card__stars" aria-hidden="true">' + stars(r.rating) + '</span>' +
          '<blockquote class="review-card__quote">' + esc(r.quote) + '</blockquote>' +
          '<figcaption class="review-card__author">' +
            '<span class="review-card__avatar" aria-hidden="true">' + AVATAR + '</span>' +
            '<span><span class="review-card__name">' + esc(r.name) + '</span>' +
            '<span class="review-card__company">' + meta + '</span></span>' +
          '</figcaption></figure>';
      }).join('');
    }
    // Promedio + conteo
    var num = document.querySelector('.reviews__rating-num');
    var metaEl = document.querySelector('.reviews__rating-meta');
    if (list.length) {
      var avg = list.reduce(function (a, r) { return a + (parseInt(r.rating, 10) || 5); }, 0) / list.length;
      if (num) num.textContent = avg.toFixed(1);
      if (metaEl) metaEl.textContent = list.length + (list.length === 1 ? ' reseña' : ' reseñas');
    } else {
      if (num) num.textContent = '—';
      if (metaEl) metaEl.textContent = 'Sé el primero';
    }
  }

  function wireForm() {
    var form = document.querySelector('[data-review-form]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var body = {
        name: fd.get('name'), company: fd.get('company'), role: fd.get('role'),
        rating: fd.get('rating') || 5, quote: fd.get('quote'),
      };
      var msg = form.querySelector('[data-review-msg]');
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      fetch('/api/public/review', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.ok) {
          form.reset();
          if (msg) { msg.textContent = '¡Gracias! Tu reseña quedó en revisión y se publicará pronto.'; msg.style.color = 'var(--green-deep, #2e7d32)'; }
        } else { throw new Error((j && j.error) || 'Error'); }
      }).catch(function () {
        if (msg) { msg.textContent = 'No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp.'; msg.style.color = '#c0392b'; }
      }).finally(function () { if (btn) btn.disabled = false; });
    });
  }

  function load() {
    wireForm();
    fetch('/api/public/reviews', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (list) { if (Array.isArray(list)) renderList(list); })
      .catch(function () { /* fail-soft */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
