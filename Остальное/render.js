/*
  Разметка меню, строки разделов и отзывов из assets/js/data.js (09.10.2026).
  Одна и та же для страницы и для выкладки: app.js рисует ею меню в браузере, а stamp.py при каждой
  выкладке заранее вписывает тот же результат в index.html между метками <!--prerender:...-->,
  чтобы поисковики видели блюда, цены и отзывы, даже не выполняя скрипты (просьба владельца).
  Источник правды по-прежнему data.js: правите только его.
  У фото блюда в alt его название (для поиска по картинкам, 09.10.2026).
*/
(function () {
  'use strict';
  var H = window.HB, U = window.HBU, esc = U.esc;

  function card(item) {
    var src = U.photo(item.photo);
    var pic = src
      ? '<div class="card-photo"><img src="' + src + '" alt="' + esc(item.name) + '" loading="lazy" width="600" height="600"></div>'
      : '<div class="card-photo card-photo--none"><img src="assets/img/logo/logo-mark.png" alt="" loading="lazy" width="306" height="306"><span>Фото скоро</span></div>';
    return '<li class="card" data-item>' + pic +
      '<div class="card-body">' +
        '<p class="card-price" data-price-out>' + U.price(U.firstPrice(item)) + '</p>' +
        '<p class="card-name">' + esc(item.name) + '</p>' +
        (item.star ? '<p class="card-star">Фирменный</p>' : '') +
        (item.desc ? '<p class="card-desc">' + esc(item.desc) + '</p>' : '') +
        U.options(item) +
      '</div></li>';
  }

  function rail(items, label) {
    return '<div class="rail-wrap">' +
      '<ul class="rail" data-n="' + items.length + '" tabindex="0" aria-label="' + esc(label) + '">' + items.map(card).join('') + '</ul>' +
      '</div>';
  }

  function board(items) {
    return '<ul class="board">' + items.map(function (item) {
      return '<li class="board-row" data-item>' +
        '<p class="board-name">' + esc(item.name) + '</p>' +
        U.options(item) +
        '<p class="board-price" data-price-out>' + U.price(U.firstPrice(item)) + '</p></li>';
    }).join('') + '</ul>';
  }

  function arrows() {
    return '<div class="rail-nav">' +
      '<button class="sq sq--line" type="button" data-rail="-1" aria-label="Листать назад">' + window.hbIcon('arrow-left') + '</button>' +
      '<button class="sq sq--line" type="button" data-rail="1" aria-label="Листать вперёд">' + window.hbIcon('arrow-right') + '</button>' +
      '</div>';
  }

  function category(cat) {
    var h = '<section class="cat" id="' + cat.id + '" aria-labelledby="cat-' + cat.id + '">';
    if (cat.soon) {
      return h + '<div class="soon"><h3 class="soon-title" id="cat-' + cat.id + '">' + esc(cat.title) + ' скоро</h3>' +
        '<p>' + esc(cat.note) + '</p><img class="soon-icon" src="assets/img/chudu-white.png" alt="" width="330" height="222"></div></section>';
    }
    var list = cat.items ? [{ items: cat.items }] : cat.groups;
    var wide = list.some(function (g) { return !g.compact && g.items.length > 3; });
    h += '<div class="cat-head"><h3 class="cat-title" id="cat-' + cat.id + '">' + esc(cat.title) + '</h3>' + (wide ? arrows() : '') + '</div>';
    list.forEach(function (g) {
      if (g.title) h += '<h4 class="group-title">' + esc(g.title) + '</h4>';
      h += g.compact ? board(g.items) : rail(g.items, g.title || cat.title);
    });
    if (cat.note) h += '<p class="cat-note">' + esc(cat.note) + '</p>';
    return h + '</section>';
  }

  window.HBRender = {
    menu: function () { return H.menu.map(category).join(''); },
    chips: function () {
      return H.menu.map(function (c) {
        return '<a class="chip" href="#' + c.id + '" data-cat="' + c.id + '">' + esc(c.title) + '</a>';
      }).join('');
    },
    quotes: function () {
      return H.reviews.map(function (r) {
        return '<figure class="q"><blockquote>«' + esc(r.text) + '»</blockquote>' +
          '<figcaption>' + esc(r.name) + '</figcaption></figure>';
      }).join('');
    }
  };
})();
