/* Вариант 1: сборка страницы из общих данных. */
(function () {
  'use strict';
  var H = window.HB, U = window.HBU, esc = U.esc;

  /* ---------- Меню ---------- */
  function photo(item) {
    var src = U.photo(item.photo);
    if (src) return '<div class="item-photo"><img src="' + src + '" alt="" loading="lazy" width="120" height="120"></div>';
    return '<div class="item-photo item-photo--empty" aria-hidden="true"></div>';
  }

  function row(item) {
    return '<li class="item" data-item>' + photo(item) +
      '<div class="item-main">' +
        '<p class="item-name">' + esc(item.name) + (item.star ? ' <span class="tag">фирменный</span>' : '') + '</p>' +
        (item.desc ? '<p class="item-desc">' + esc(item.desc) + '</p>' : '') +
        U.options(item) +
      '</div>' +
      '<p class="item-price" data-price-out>' + U.price(U.firstPrice(item)) + '</p>' +
    '</li>';
  }

  function compact(item) {
    return '<li class="citem" data-item>' +
      '<p class="item-name">' + esc(item.name) + '</p>' +
      U.options(item) +
      '<p class="item-price" data-price-out>' + U.price(U.firstPrice(item)) + '</p>' +
    '</li>';
  }

  function category(cat) {
    var h = '<section class="cat" id="' + cat.id + '" aria-labelledby="cat-' + cat.id + '">' +
      '<h3 class="cat-title" id="cat-' + cat.id + '">' + esc(cat.title) + '</h3>';
    if (cat.soon) {
      h += '<div class="soon"><img class="mark" src="assets/img/logo/logo-mark.png" alt="" width="306" height="306"><p>' + esc(cat.note) + '</p></div>';
    } else if (cat.items) {
      h += '<ul class="items">' + cat.items.map(row).join('') + '</ul>';
    } else {
      cat.groups.forEach(function (g) {
        h += '<h4 class="group-title">' + esc(g.title) + '</h4>';
        h += g.compact
          ? '<ul class="items items--compact">' + g.items.map(compact).join('') + '</ul>'
          : '<ul class="items">' + g.items.map(row).join('') + '</ul>';
      });
    }
    if (cat.note && !cat.soon) h += '<p class="cat-note">' + esc(cat.note) + '</p>';
    return h + '</section>';
  }

  var body = document.querySelector('[data-menu]');
  body.innerHTML = H.menu.map(category).join('');

  var strip = document.querySelector('[data-strip]');
  strip.innerHTML = H.menu.map(function (c) {
    return '<a class="chip" href="#' + c.id + '" data-cat="' + c.id + '">' + esc(c.title) + '</a>';
  }).join('');

  /* ---------- Отзывы ---------- */
  var stars = document.querySelector('[data-stars]');
  stars.innerHTML = [0, 1, 2, 3, 4].map(function () { return window.hbIcon('star-fill'); }).join('');
  stars.setAttribute('aria-hidden', 'true');

  document.querySelector('[data-quotes]').innerHTML = H.reviews.map(function (r) {
    return '<figure class="quote"><blockquote>«' + esc(r.text) + '»</blockquote>' +
      '<figcaption>' + esc(r.name) + ', отзыв в Яндекс Картах</figcaption></figure>';
  }).join('');

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
    strip: strip
  });
})();
