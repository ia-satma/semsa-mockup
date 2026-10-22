/* Directorio conectado al CMS. En Pages usa el snapshot del mismo export. */
(function () {
  'use strict';
  if (!window.fetch) return;
  var script = document.currentScript;
  var version = script && /[?&]v=([^&]+)/.exec(script.src);
  var snapshot = 'data/marcas.json' + (version ? '?v=' + version[1] : '');
  function apply(list) {
    if (!Array.isArray(list)) return;
    var map = {};
    list.forEach(function (b) { if (b && b.slug) map[b.slug] = b; });
    document.querySelectorAll('.bcard, .brow').forEach(function (card) {
      var match = /[?&]marca=([^&]+)/.exec(card.getAttribute('href') || '');
      var slug = card.getAttribute('data-brand-slug') || (match && decodeURIComponent(match[1]));
      var b = map[slug];
      if (!b) return;
      var offer = card.querySelector('.bcard__offer, .brow__offer');
      if (offer && b.oferta && card.getAttribute('data-offer-source') !== 'division') offer.textContent = b.oferta;
      var count = card.querySelector('.bcard__cta, .brow__count');
      if (b.count > 0) {
        if (card.tagName !== 'A') {
          var link = document.createElement('a');
          Array.prototype.forEach.call(card.attributes, function (a) { link.setAttribute(a.name, a.value); });
          while (card.firstChild) link.appendChild(card.firstChild);
          card.parentNode.replaceChild(link, card);
          card = link;
        }
        card.href = 'catalogo.html?marca=' + encodeURIComponent(slug);
        card.classList.remove('brow--sin-catalogo');
        if (count) {
          var strong = count.querySelector('strong');
          if (!strong) { count.textContent = ''; strong = document.createElement('strong'); count.appendChild(strong); count.appendChild(document.createTextNode(' productos')); }
          strong.textContent = String(b.count);
          count.classList.remove('brow__count--vacio');
        }
      } else {
        card.href = 'index.html#cotizar';
        if (count) count.textContent = 'Consultar productos';
      }
    });
  }
  function read(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('Respuesta no disponible');
      return r.json();
    }).then(function (list) {
      if (!Array.isArray(list)) throw new Error('Directorio inválido');
      return list;
    });
  }
  function load() {
    var pages = /(^|\.)github\.io$/i.test(window.location.hostname);
    (pages ? read(snapshot) : read('/api/public/marcas').catch(function () { return read(snapshot); }))
      .then(apply).catch(function () { /* El HTML ya contiene el export del CMS. */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
