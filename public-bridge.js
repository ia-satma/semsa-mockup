/* ============================================================
   SEMSA — public-bridge.js
   Carga /api/public/site-config y aplica los overrides de CONTENIDO EDITABLE (estilo WordPress)
   a cualquier elemento con [data-bind="<page>.<campo>"] (textContent) o [data-bind-href="..."]
   (contacto: WhatsApp/tel/mailto). `content` llega como {page: {campo: valor}, ...} — sin
   override, el HTML hardcoded se queda tal cual (fail-soft total: sin red, sin JS, sin
   backend, el sitio se ve y lee igual).
   ============================================================ */
(function () {
  'use strict';
  var API = '/api/public/site-config';

  function applyContact(contact) {
    if (!contact) return;
    document.querySelectorAll('[data-bind-href]').forEach(function (el) {
      var key = el.getAttribute('data-bind-href');
      if (key === 'contact.whatsappLink' && contact.whatsapp) {
        var wa = String(contact.whatsapp).replace(/[^\d+]/g, '').replace(/^\+/, '');
        var msg = encodeURIComponent(contact.whatsappMessage || '');
        el.setAttribute('href', 'https://wa.me/' + wa + (msg ? '?text=' + msg : ''));
      } else if (key === 'contact.phoneLink' && contact.phone) {
        el.setAttribute('href', 'tel:' + String(contact.phone).replace(/\s+/g, ''));
      } else if (key === 'contact.emailLink' && contact.email) {
        el.setAttribute('href', 'mailto:' + contact.email);
      }
    });
  }

  // Genérico: cualquier [data-bind="page.campo"] -> content[page][campo] como texto.
  // (El namespace "contact" se resuelve igual, ya que content.contact también llega en el mapa.)
  function applyBinds(content) {
    if (!content) return;
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var key = el.getAttribute('data-bind') || '';
      var dot = key.indexOf('.');
      if (dot === -1) return;
      var ns = key.slice(0, dot), field = key.slice(dot + 1);
      var page = content[ns];
      if (page && page[field] != null && String(page[field]).trim() !== '') {
        el.textContent = page[field];
      }
    });
  }

  function load() {
    if (!window.fetch) return;
    fetch(API, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        if (!json || json.ok === false) return;
        applyContact(json.contact);
        applyBinds(json.content);
      })
      .catch(function () { /* fail-soft: se queda el hardcoded del HTML */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
