/* Вариант 4 (основной): раскладка варианта 2, меню лентами карточек. */
(function () {
  'use strict';
  var R = window.HBRender;

  /* ---------- Меню ----------
     Разметку даёт Остальное/render.js. В index.html она уже вписана при выкладке (для поисковиков),
     здесь рисуем её заново из data.js, чтобы правка data.js сразу была видна и без выкладки. */
  document.querySelector('[data-menu]').innerHTML = R.menu();

  /* Загружаем следующие две карточки до горизонтального перелистывания.
     Далёкие по вертикали разделы остаются с обычной отложенной загрузкой. */
  if ('IntersectionObserver' in window) {
    function loadAhead(rail) {
      var bounds = rail.getBoundingClientRect();
      var card = rail.querySelector('.card');
      var ahead = card ? (card.offsetWidth + 16) * 2 : rail.clientWidth;
      [].forEach.call(rail.querySelectorAll('.card-photo img[loading="lazy"]'), function (img) {
        var rect = img.getBoundingClientRect();
        if (rect.right >= bounds.left - ahead / 2 && rect.left <= bounds.right + ahead) {
          img.decoding = 'async';
          img.loading = 'eager';
        }
      });
    }
    var nearMenu = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { loadAhead(entry.target); nearMenu.unobserve(entry.target); }
      });
    }, { rootMargin: '700px 0px' });
    [].forEach.call(document.querySelectorAll('.rail'), function (rail) {
      nearMenu.observe(rail);
      var pending = false;
      rail.addEventListener('scroll', function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; loadAhead(rail); });
      }, { passive: true });
    });
  }

  var strip = document.querySelector('[data-strip]');
  strip.innerHTML = R.chips();

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

  /* Плитки на телефоне листаются вбок: стрелка сдвигает ряд на одну плитку,
     у края ряда стрелка в ту сторону гаснет. */
  var tiles = document.querySelector('[data-tiles]');
  var tileBtns = [].slice.call(document.querySelectorAll('[data-tiles-step]'));
  function tileEdges() {
    var max = tiles.scrollWidth - tiles.clientWidth;
    tileBtns.forEach(function (b) {
      var back = b.getAttribute('data-tiles-step') === '-1';
      b.disabled = max <= 2 || (back ? tiles.scrollLeft <= 2 : tiles.scrollLeft >= max - 2);
    });
  }
  tileBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = tiles.querySelector('.tile');
      var gap = parseFloat(getComputedStyle(tiles).columnGap) || 0;
      var step = t ? t.offsetWidth + gap : tiles.clientWidth * 0.8;
      tiles.scrollBy({ left: +b.getAttribute('data-tiles-step') * step, behavior: document.documentElement.classList.contains('reduce') ? 'auto' : 'smooth' });
    });
  });
  tiles.addEventListener('scroll', tileEdges, { passive: true });
  window.addEventListener('resize', tileEdges);
  tileEdges();

  /* ---------- Отзывы ---------- */
  var stars = document.querySelector('[data-stars]');
  stars.innerHTML = [0, 1, 2, 3, 4].map(function () { return window.hbIcon('star-fill'); }).join('');
  stars.setAttribute('aria-hidden', 'true');
  document.querySelector('[data-quotes]').innerHTML = R.quotes();

  /* ---------- Движение ---------- */
  window.HBIcons();
  window.HBScrolled(document.querySelector('.top-sentinel'));
  window.HBHeroHeader(document.querySelector('.hero'));   // шапка держится, пока собирается бургер

  window.HBScrollBurger({
    section: document.querySelector('.hero'),
    canvas: document.querySelector('.burger-canvas'),
    base: 'assets/burger-square-v3/'
  });

  window.HBMenuNav({
    menu: document.querySelector('.menu'),
    cats: document.querySelectorAll('.cat'),
    links: document.querySelectorAll('.chip'),
    strip: strip
  });
})();
