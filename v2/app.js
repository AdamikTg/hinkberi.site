/* Вариант 2: сборка страницы из общих данных. Меню подано лентами карточек. */
(function () {
  'use strict';
  var H = window.HB, U = window.HBU, esc = U.esc;

  /* ---------- Меню ---------- */
  function card(item) {
    var src = U.photo(item.photo);
    var pic = src
      ? '<div class="card-photo"><img src="' + src + '" alt="" loading="lazy" width="600" height="600"></div>'
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
        '<p>' + esc(cat.note) + '</p><img class="soon-icon" src="assets/img/logo/logo-mark-white.png" alt="" width="306" height="306"></div></section>';
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

  document.querySelector('[data-menu]').innerHTML = H.menu.map(category).join('');

  var strip = document.querySelector('[data-strip]');
  strip.innerHTML = H.menu.map(function (c) {
    return '<a class="chip" href="#' + c.id + '" data-cat="' + c.id + '">' + esc(c.title) + '</a>';
  }).join('');

  /* Стрелки листают все ленты своей категории на ширину двух карточек. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rail]');
    if (!b) return;
    var dir = +b.getAttribute('data-rail');
    var cat = b.closest('.cat');
    [].slice.call(cat.querySelectorAll('.rail')).forEach(function (r) {
      var c = r.querySelector('.card');
      var step = c ? (c.offsetWidth + 16) * 2 : r.clientWidth * 0.8;
      r.scrollBy({ left: dir * step, behavior: document.documentElement.classList.contains('reduce') ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Отзывы ---------- */
  var stars = document.querySelector('[data-stars]');
  stars.innerHTML = [0, 1, 2, 3, 4].map(function () { return window.hbIcon('star-fill'); }).join('');
  stars.setAttribute('aria-hidden', 'true');
  document.querySelector('[data-quotes]').innerHTML = H.reviews.map(function (r) {
    return '<figure class="q"><blockquote>«' + esc(r.text) + '»</blockquote>' +
      '<figcaption>' + esc(r.name) + '</figcaption></figure>';
  }).join('');

  /* ---------- Движение ---------- */
  window.HBIcons();
  window.HBScrolled(document.querySelector('.top-sentinel'));

  window.HBBurger({
    section: document.querySelector('.hero'),
    canvas: document.querySelector('.burger-canvas'),
    base: 'assets/burger/',
    zoom: window.innerWidth < 720 ? 1.18 : 1.08
  });

  window.HBMenuNav({
    menu: document.querySelector('.menu'),
    cats: document.querySelectorAll('.cat'),
    links: document.querySelectorAll('.chip'),
    strip: strip
  });
})();
