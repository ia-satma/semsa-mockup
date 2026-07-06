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
      if (key === 'contact.whatsappLink' && (contact.whatsappLinkFull || contact.whatsapp)) {
        // Si hay un link completo (opcional), gana; si no, se arma con número + mensaje.
        if (contact.whatsappLinkFull && String(contact.whatsappLinkFull).trim()) {
          el.setAttribute('href', String(contact.whatsappLinkFull).trim());
        } else {
          var wa = String(contact.whatsapp).replace(/[^\d+]/g, '').replace(/^\+/, '');
          var msg = encodeURIComponent(contact.whatsappMessage || '');
          el.setAttribute('href', 'https://wa.me/' + wa + (msg ? '?text=' + msg : ''));
        }
      } else if (key === 'contact.phoneLink' && contact.phone) {
        el.setAttribute('href', 'tel:' + String(contact.phone).replace(/\s+/g, ''));
      } else if (key === 'contact.emailLink' && contact.email) {
        el.setAttribute('href', 'mailto:' + contact.email);
      }
    });
  }

  // Resuelve "page.campo" -> content[page][campo] (string no vacío) o null.
  function resolve(content, key) {
    var dot = (key || '').indexOf('.');
    if (dot === -1) return null;
    var page = content[key.slice(0, dot)];
    var v = page && page[key.slice(dot + 1)];
    return (v != null && String(v).trim() !== '') ? String(v) : null;
  }

  // Genérico: cualquier [data-bind="page.campo"] -> content[page][campo] como texto.
  // (El namespace "contact" se resuelve igual, ya que content.contact también llega en el mapa.)
  function applyBinds(content) {
    if (!content) return;
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var v = resolve(content, el.getAttribute('data-bind') || '');
      if (v != null) el.textContent = v;
    });
  }

  // Medios editables: imagen/video/fondo. Fail-soft — sin override queda el asset hardcoded.
  function applyMedia(content) {
    if (!content) return;
    document.querySelectorAll('[data-bind-src]').forEach(function (el) {
      var v = resolve(content, el.getAttribute('data-bind-src') || '');
      if (!v) return;
      el.setAttribute('src', v);
      if (el.tagName === 'SOURCE') { var vid = el.closest('video'); if (vid) { try { vid.load(); } catch (e) {} } }
    });
    document.querySelectorAll('[data-bind-poster]').forEach(function (el) {
      var v = resolve(content, el.getAttribute('data-bind-poster') || '');
      if (v) el.setAttribute('poster', v);
    });
    document.querySelectorAll('[data-bind-bg]').forEach(function (el) {
      var v = resolve(content, el.getAttribute('data-bind-bg') || '');
      if (v) el.style.backgroundImage = "url('" + v + "')";
    });
  }

  // Ocultar/mostrar secciones. content[page]._sections[key] === false -> se oculta.
  // Ausente o true = visible (queda como está el HTML). Fail-soft.
  function applySections(content) {
    if (!content) return;
    document.querySelectorAll('[data-section]').forEach(function (el) {
      var key = el.getAttribute('data-section') || '';
      var dot = key.indexOf('.');
      if (dot === -1) return;
      var page = content[key.slice(0, dot)];
      var secs = page && page._sections;
      if (secs && secs[key.slice(dot + 1)] === false) el.style.display = 'none';
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
        applyMedia(json.content);
        applySections(json.content);
      })
      .catch(function () { /* fail-soft: se queda el hardcoded del HTML */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
