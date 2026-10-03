/* Вариант 3: сборка страницы из общих данных. Меню подано сеткой карточек-панелей. */
(function () {
  'use strict';
  var H = window.HB, U = window.HBU, esc = U.esc;

  /* ---------- Меню ---------- */
  function card(item) {
    var src = U.photo(item.photo);
    var pic = src
      ? '<div class="c-photo"><img src="' + src + '" alt="" loading="lazy" width="600" height="600"></div>'
      : '<div class="c-photo c-photo--none"><img src="assets/img/logo/logo-mark.png" alt="" loading="lazy" width="306" height="306"><span>Фото скоро</span></div>';
    return '<li class="c" data-item>' + pic +
      '<div class="c-body">' +
        '<p class="c-name">' + esc(item.name) + '</p>' +
        (item.star ? '<p class="c-star">Фирменный</p>' : '') +
        (item.desc ? '<p class="c-desc">' + esc(item.desc) + '</p>' : '') +
        '<div class="c-foot">' + U.options(item) +
          '<p class="c-price" data-price-out>' + U.price(U.firstPrice(item)) + '</p></div>' +
      '</div></li>';
  }

  function listPanel(items) {
    return '<ul class="lp">' + items.map(function (item) {
      return '<li class="lp-row" data-item>' +
        '<p class="c-name">' + esc(item.name) + '</p>' + U.options(item) +
        '<p class="c-price" data-price-out>' + U.price(U.firstPrice(item)) + '</p></li>';
    }).join('') + '</ul>';
  }

  function category(cat) {
    var h = '<section class="cat" id="' + cat.id + '" aria-labelledby="cat-' + cat.id + '">' +
      '<h3 class="cat-title" id="cat-' + cat.id + '">' + esc(cat.title) + '</h3>';
    if (cat.soon) {
      return h + '<div class="soon"><img class="mark" src="assets/img/logo/logo-mark.png" alt="" width="306" height="306"><p>' + esc(cat.note) + '</p>' +
        '<span class="soon-tag">Скоро</span></div></section>';
    }
    var list = cat.items ? [{ items: cat.items }] : cat.groups;
    list.forEach(function (g) {
      if (g.title) h += '<h4 class="group-title">' + esc(g.title) + '</h4>';
      h += g.compact ? listPanel(g.items) : '<ul class="grid" data-n="' + Math.min(g.items.length, 6) + '">' + g.items.map(card).join('') + '</ul>';
    });
    if (cat.note) h += '<p class="cat-note">' + esc(cat.note) + '</p>';
    return h + '</section>';
  }

  document.querySelector('[data-menu]').innerHTML = H.menu.map(category).join('');

  var strip = document.querySelector('[data-strip]');
  strip.innerHTML = H.menu.map(function (c) {
    return '<a class="chip" href="#' + c.id + '" data-cat="' + c.id + '">' + esc(c.title) + '</a>';
  }).join('');

  /* ---------- Отзывы ---------- */
  var star = window.hbIcon('star-fill');
  var five = [0, 1, 2, 3, 4].map(function () { return star; }).join('');
  [].slice.call(document.querySelectorAll('[data-stars],[data-stars-b]')).forEach(function (el) {
    el.innerHTML = five;
    el.setAttribute('aria-hidden', 'true');
  });
  document.querySelector('[data-quotes]').innerHTML = H.reviews.map(function (r) {
    return '<li class="rc"><figure><span class="rc-stars" aria-hidden="true">' + five + '</span>' +
      '<blockquote>«' + esc(r.text) + '»</blockquote>' +
      '<figcaption>' + esc(r.name) + '</figcaption></figure></li>';
  }).join('') +
    '<li class="rc rc--more"><a href="' + H.info.mapsReviews + '" target="_blank" rel="noopener">' +
    '<strong>Все отзывы</strong><small>Читать и оставить свой в Яндекс Картах</small>' +
    window.hbIcon('arrow-up-right', 'rc-go') + '</a></li>';

  /* ---------- Движение ---------- */
  window.HBIcons();
  window.HBScrolled(document.querySelector('.top-sentinel'));

  window.HBBurger({
    section: document.querySelector('.hero'),
    canvas: document.querySelector('.burger-canvas'),
    base: 'assets/burger/',
    zoom: window.innerWidth < 720 ? 1.12 : 1
  });

  window.HBMenuNav({
    menu: document.querySelector('.menu'),
    cats: document.querySelectorAll('.cat'),
    links: document.querySelectorAll('.chip'),
    strip: strip,
    band: '-84px 0px -76% 0px'
  });
})();
