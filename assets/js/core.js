/*
  Общий движок для всех вариантов ХинкБери.
  1. HBBurger: бургер собирается по кадрам, пока посетитель листает главный экран.
  2. HBMenuNav: когда посетитель дошёл до меню, сверху появляется строка разделов и стрелка наверх.
  3. Переключение порций: кнопки S / M / L меняют цену на месте.
*/
(function () {
  'use strict';

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var REDUCE = mq.matches;
  document.documentElement.classList.add('js');
  if (REDUCE) document.documentElement.classList.add('reduce');

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad3(n) { n = String(n); while (n.length < 3) n = '0' + n; return n; }

  /* ------------------------------------------------------------------
     1. Сборка бургера
     section: высокая секция (например 260vh), внутри липкая сцена;
     canvas:  холст внутри сцены;
     base:    путь к папке с кадрами (внутри lg/ и sm/).
     ------------------------------------------------------------------ */
  function HBBurger(opts) {
    var section = opts.section;
    var canvas = opts.canvas;
    var ctx = canvas.getContext('2d');
    var TOTAL = 107;              // кадров в ролике
    var INTRO = opts.intro || 9;  // до этого кадра бургер доезжает сам при загрузке
    var LAST = TOTAL - 1;
    var POSTER = 79;              // собранный бургер для режима без анимации
    var zoom = opts.zoom || 1;
    var onProgress = opts.onProgress || function () {};

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var big = Math.min(window.innerWidth, 1400) * dpr > 1000;
    var base = opts.base + (big ? 'lg/' : 'sm/');

    var frames = new Array(TOTAL);
    var ready = new Array(TOTAL);
    var shown = -1;
    var cur = 0;
    var introStart = 0;
    var introDone = REDUCE;
    var running = false;
    var raf = 0;
    var lastP = -1;

    function load(i) {
      if (frames[i]) return;
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        ready[i] = true;
        if (shown < 0 || Math.abs(i - cur) < 3) { shown = -2; paint(); }
      };
      im.src = base + 'f' + pad3(i + 1) + '.webp';
      frames[i] = im;
    }

    /* Порядок загрузки: сначала начало ролика, потом редкие кадры по всей длине, потом остальные. */
    function preload() {
      if (REDUCE) { load(POSTER); return; }
      var i, order = [];
      for (i = 0; i <= INTRO; i++) order.push(i);
      [8, 4, 2, 1].forEach(function (step) {
        for (var k = 0; k < TOTAL; k += step) if (order.indexOf(k) < 0) order.push(k);
      });
      order.forEach(load);
    }

    function nearest(i) {
      for (var d = 0; d < TOTAL; d++) {
        if (i - d >= 0 && ready[i - d]) return i - d;
        if (i + d < TOTAL && ready[i + d]) return i + d;
      }
      return -1;
    }

    function size() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      shown = -2;
      paint();
    }

    function paint() {
      var want = REDUCE ? POSTER : Math.round(cur);
      var n = nearest(want);
      if (n < 0 || n === shown) return;
      shown = n;
      var im = frames[n];
      var cw = canvas.width, ch = canvas.height;
      var s = Math.min(cw / im.naturalWidth, ch / im.naturalHeight) * zoom;
      var w = im.naturalWidth * s, h = im.naturalHeight * s;
      w = Math.round(w); h = Math.round(h);
      var x = Math.round((cw - w) / 2), y = Math.round((ch - h) / 2);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(im, x, y, w, h);
      feather(x, y, w, h);
    }

    /* Края кадра мягко уходят в цвет фона, чтобы тень из ролика не давала видимую границу. */
    var bg = opts.bg || '#ffffff';
    var bgRGB = (function (hex) {
      var n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
    })(bg);
    /* Плавная кривая: у края фон плотный, внутрь уходит мягко, без заметной линии. */
    var STOPS = [[0, 1], [0.2, 0.92], [0.4, 0.7], [0.6, 0.42], [0.8, 0.16], [1, 0]];
    function band(x0, y0, x1, y1, rx, ry, rw, rh) {
      var g = ctx.createLinearGradient(x0, y0, x1, y1);
      STOPS.forEach(function (st) { g.addColorStop(st[0], 'rgba(' + bgRGB + ',' + st[1] + ')'); });
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    }
    function feather(x, y, w, h) {
      /* Растворяем края именно видимой части кадра: при увеличении кадр шире холста. */
      var cw = canvas.width, ch = canvas.height;
      /* Полосы начинаются на пиксель за краем кадра, чтобы первая строка изображения не проступала линией. */
      var l = Math.max(x - 1, 0), r = Math.min(x + w + 1, cw), t = Math.max(y - 1, 0), b = Math.min(y + h + 1, ch);
      var vw = r - l, vh = b - t;
      var sx = Math.min(vw * 0.11, cw * 0.14), top = vh * 0.24, bot = vh * 0.12;
      band(l, 0, l + sx, 0, l, t, sx, vh);
      band(r, 0, r - sx, 0, r - sx, t, sx, vh);
      band(0, t, 0, t + top, l, t, vw, top);
      band(0, b, 0, b - bot, l, b - bot, vw, bot);
    }

    function progress() {
      var r = section.getBoundingClientRect();
      var total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return 1;
      return clamp(-r.top / total, 0, 1);
    }

    function tick(now) {
      raf = 0;
      var p = progress();
      var target = INTRO + p * (LAST - INTRO);
      if (!introDone) {
        if (!introStart) introStart = now;
        var t = clamp((now - introStart) / 1100, 0, 1);
        var e = 1 - Math.pow(1 - t, 3);
        var introFrame = e * INTRO;
        if (p < 0.002) target = introFrame;
        if (t >= 1) introDone = true;
      }
      cur += (target - cur) * 0.22;
      if (Math.abs(target - cur) < 0.04) cur = target;
      paint();
      if (Math.abs(p - lastP) > 0.0005) { lastP = p; onProgress(p); }
      if (running) raf = requestAnimationFrame(tick);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(tick); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    preload();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas);
    else window.addEventListener('resize', size);
    size();

    if (REDUCE) { onProgress(1); return; }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) start(); else { stop(); onProgress(progress()); }
      }).observe(section);
    } else start();
  }

  /* ------------------------------------------------------------------
     2. Строка разделов меню
     menu:  секция меню;
     cats:  блоки категорий с id;
     links: кнопки разделов с data-cat;
     strip: прокручиваемая лента с кнопками (для телефона).
     ------------------------------------------------------------------ */
  function HBMenuNav(opts) {
    var root = document.documentElement;
    var menu = opts.menu;
    var links = [].slice.call(opts.links || []);
    var strip = opts.strip;
    function edges() {
      if (!strip) return;
      var max = strip.scrollWidth - strip.clientWidth;
      strip.classList.toggle('fade-l', max > 2 && strip.scrollLeft > 2);
      strip.classList.toggle('fade-r', max > 2 && strip.scrollLeft < max - 2);
    }
    if (strip) {
      strip.addEventListener('scroll', edges, { passive: true });
      window.addEventListener('resize', edges);
      edges();
    }
    var band = opts.band || '-72px 0px -78% 0px';
    var active = null;

    function setActive(id) {
      if (id === active) return;
      active = id;
      links.forEach(function (a) {
        var on = a.getAttribute('data-cat') === id;
        a.classList.toggle('is-on', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        if (on && strip && strip.scrollWidth > strip.clientWidth) {
          var left = a.offsetLeft - strip.clientWidth / 2 + a.offsetWidth / 2;
          strip.scrollTo({ left: left, behavior: REDUCE ? 'auto' : 'smooth' });
        }
      });
    }

    if (!('IntersectionObserver' in window)) return;

    new IntersectionObserver(function (en) {
      root.classList.toggle('is-menu', en[0].isIntersecting);
    }, { rootMargin: band }).observe(menu);

    /* Активный раздел: последний, чей верх уже поднялся выше линии на 35% высоты экрана. */
    var cats = [].slice.call(opts.cats || []);
    function pick() {
      var line = window.innerHeight * 0.35, id = cats.length ? cats[0].id : null;
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].getBoundingClientRect().top <= line) id = cats[i].id; else break;
      }
      setActive(id);
    }
    var catIO = new IntersectionObserver(pick, { rootMargin: '0px 0px -65% 0px', threshold: [0, 1] });
    cats.forEach(function (c) { catIO.observe(c); });
    /* После окончания прокрутки (в том числе по кнопке раздела) сверяем активный раздел ещё раз. */
    window.addEventListener('scrollend', pick, { passive: true });
    window.addEventListener('hashchange', function () { setTimeout(pick, 400); });

    [].slice.call(document.querySelectorAll('[data-to-top]')).forEach(function (b) {
      b.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' });
      });
    });
  }

  /* ------------------------------------------------------------------
     3. Порции: кнопка с data-price внутри [data-item] меняет цену в [data-price-out],
        а кнопка с data-photo ещё и фото в карточке
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.opt[data-price]');
    if (!b) return;
    var item = b.closest('[data-item]');
    if (!item) return;
    [].slice.call(item.querySelectorAll('.opt[data-price]')).forEach(function (o) {
      var on = o === b;
      o.classList.toggle('is-on', on);
      o.setAttribute('aria-pressed', String(on));
    });
    var out = item.querySelector('[data-price-out]');
    if (out) {
      out.textContent = window.HBU.price(+b.getAttribute('data-price'));
      if (!REDUCE) {
        out.classList.remove('bump');
        void out.offsetWidth;
        out.classList.add('bump');
      }
    }
    /* Своё фото у порции: меняем картинку, когда новая уже загружена, чтобы не мигала пустота. */
    var ph = b.getAttribute('data-photo');
    var img = ph && item.querySelector('img');
    if (img && img.getAttribute('src') !== ph) {
      var pre = new Image();
      pre.onload = function () { if (b.classList.contains('is-on')) img.src = ph; };
      pre.src = ph;
    }
  });

  /* ------------------------------------------------------------------
     4. Иконки из атрибутов: data-icon и data-icon-before ставят иконку перед текстом,
        data-icon-after после текста.
     ------------------------------------------------------------------ */
  function HBIcons(root) {
    root = root || document;
    [].slice.call(root.querySelectorAll('[data-icon],[data-icon-before]')).forEach(function (el) {
      var name = el.getAttribute('data-icon') || el.getAttribute('data-icon-before');
      el.insertAdjacentHTML('afterbegin', window.hbIcon(name));
      el.removeAttribute('data-icon'); el.removeAttribute('data-icon-before');
    });
    [].slice.call(root.querySelectorAll('[data-icon-after]')).forEach(function (el) {
      el.insertAdjacentHTML('beforeend', window.hbIcon(el.getAttribute('data-icon-after')));
      el.removeAttribute('data-icon-after');
    });
  }

  /* 5. Класс is-scrolled на html, когда страница ушла от самого верха. */
  function HBScrolled(sentinel) {
    if (!sentinel || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) {
      document.documentElement.classList.toggle('is-scrolled', !en[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ------------------------------------------------------------------
     6. Адреса разделов без решётки
     На основном сайте (index.html с атрибутом data-clean-urls, открыт по http/https) раздел
     открывается по адресу вида hinkberi.site/меню: ссылки ведут на такие адреса, страница плавно
     прокручивается, адрес меняется без перезагрузки. Чтобы такой адрес открывался и напрямую,
     хостинг отдаёт index.html на любой адрес без точки (vercel.json, .htaccess).
     В архивных вариантах и при открытии файла с диска адрес не меняется: ссылка просто прокручивает.
     Старые ссылки с решёткой (#кофе, #coffee, #о-нас) переводятся на новые адреса.
     ------------------------------------------------------------------ */
  var OLD_IDS = { top: 'главная', menu: 'меню', reviews: 'отзывы', about: 'онас', 'о-нас': 'онас', burgers: 'бургеры',
    rolls: 'роллы', sandwiches: 'сэндвичи', snacks: 'закуски', drinks: 'напитки', coffee: 'кофе', chudu: 'чуду' };
  var HTTP = /^https?:$/.test(location.protocol);   // сайт открыт с хостинга, а не файлом с диска
  var CLEAN = document.documentElement.hasAttribute('data-clean-urls') && HTTP;
  var POLICY = '/политика';                            // адрес страницы политики (vercel.json, .htaccess)

  function decode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
  function idOf(name) { name = decode(name); return OLD_IDS[name] || name; }
  function pathFor(id) { return id === 'главная' ? '/' : '/' + id; }
  function setUrl(url, push) {
    try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (e) { /* файл с диска: адрес не трогаем */ }
  }

  /* Прокрутка к разделу. Первый переход при загрузке мгновенный, по клику плавный. */
  function goTo(id, smooth) {
    var el = id && document.getElementById(id);
    var root = document.documentElement, was = root.style.scrollBehavior;
    var how = smooth && !REDUCE ? 'smooth' : 'auto';
    if (how === 'auto') root.style.scrollBehavior = 'auto';
    if (!el || id === 'главная') window.scrollTo({ top: 0, behavior: how });
    else el.scrollIntoView({ block: 'start', behavior: how });
    if (how === 'auto') root.style.scrollBehavior = was;
    if (el && smooth) { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
  }

  function idFromUrl() {
    if (location.hash.length > 1) return idOf(location.hash.slice(1));
    return CLEAN ? idOf(location.pathname.replace(/^\/+|\/+$/g, '')) : '';
  }

  /* Ссылки между страницами написаны так, чтобы работать и с диска: politika.html, index.html#меню.
     На хостинге они получают чистые адреса: /политика, /меню. */
  function cleanPageLinks() {
    if (!HTTP) return;
    [].slice.call(document.querySelectorAll('a[href^="politika.html"], a[href^="index.html"]')).forEach(function (a) {
      var h = a.getAttribute('href'), hash = h.split('#')[1] || '';
      if (h.indexOf('politika.html') === 0) a.setAttribute('href', POLICY + (hash ? '#' + hash : ''));
      else a.setAttribute('href', hash ? pathFor(idOf(hash)) : '/');
    });
    if (/\/politika\.html$/.test(location.pathname)) setUrl(POLICY + location.search + location.hash);
  }

  /* Ждём, пока скрипт варианта построит меню, иначе разделов меню ещё нет на странице. */
  document.addEventListener('DOMContentLoaded', function () {
    cleanPageLinks();
    [].slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (a) {
      var id = idOf(a.getAttribute('href').slice(1));
      if (!document.getElementById(id)) return;
      a.setAttribute('data-sec', id);
      if (CLEAN) a.setAttribute('href', pathFor(id));
    });
    var id = idFromUrl();
    var known = !!(id && document.getElementById(id));

    /* Приводим адрес к чистому виду, только если в нём решётка или незнакомый раздел. */
    var path = CLEAN ? (known ? pathFor(id) : '/') : location.pathname;
    if (location.hash || (CLEAN && decode(location.pathname) !== path)) setUrl(path + location.search);

    /* Переход по ссылке: сразу встаём на раздел. При обновлении страницы и кнопках «назад» и
       «вперёд» браузер сам возвращает посетителя туда, где тот был, поэтому не вмешиваемся. */
    var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (known && (!nav || nav.type === 'navigate')) {
      goTo(id, false);
      /* Шрифты могли чуть сдвинуть страницу: встаём на раздел ещё раз, когда они загрузятся,
         если посетитель к этому времени сам ничего не листал. */
      var moved = false;
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) {
        window.addEventListener(t, function () { moved = true; }, { once: true, passive: true });
      });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!moved) goTo(id, false); });
    }
  });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[data-sec]');
    var top = !a && e.target.closest && e.target.closest('[data-to-top]');
    if (!a && !top) return;
    var id = a ? a.getAttribute('data-sec') : 'главная';
    if (a) { e.preventDefault(); goTo(id, true); }
    if (CLEAN && decode(location.pathname) !== pathFor(id)) setUrl(pathFor(id), true);
  });

  /* ------------------------------------------------------------------
     7. Карта Яндекса и согласие посетителя
     Сайт сам не ставит cookies и не подключает аналитику. Единственный сторонний сервис — карта
     «Яндекс Карты»: при загрузке она передаёт ООО «ЯНДЕКС» IP-адрес и сведения о браузере,
     обращается к Яндекс Метрике и сохраняет cookies Яндекса, в том числе рекламные. Поэтому карта
     (iframe с атрибутом data-consent-src вместо src) загружается только после согласия: кнопкой
     в плашке, кнопкой «Показать карту» на месте карты или в настройках на странице политики.
     Подтверждение выбора хранится в браузере (localStorage): решение, дата и время, откуда оно
     дано и редакция текста, плюс журнал последних 20 решений. Оператору оно не передаётся.
     ------------------------------------------------------------------ */
  var CONSENT_KEY = 'hb-consent', CONSENT_LOG = 'hb-consent-log';
  var CONSENT_VER = '2026-10-02';   // редакция политики и текста согласия; в новой редакции выбор спрашивается заново
  var memConsent = null;            // если браузер не даёт хранить выбор, помним его до закрытия страницы

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* хранилище недоступно */ } }

  function consent() {
    var c = lsGet(CONSENT_KEY);
    return c && c.v === CONSENT_VER && typeof c.maps === 'boolean' ? c : memConsent;
  }

  function decide(maps, via) {
    var rec = { maps: !!maps, at: new Date().toISOString(), via: via, v: CONSENT_VER };
    memConsent = rec;
    lsSet(CONSENT_KEY, rec);
    var log = lsGet(CONSENT_LOG);
    if (!Array.isArray(log)) log = [];
    log.push(rec);
    lsSet(CONSENT_LOG, log.slice(-20));
    applyMaps();
    renderState();
    closeBanner();
  }

  function policyHref(hash) { return (HTTP ? POLICY : 'politika.html') + (hash ? '#' + hash : ''); }
  function frames() { return [].slice.call(document.querySelectorAll('iframe[data-consent-src]')); }
  function fmtDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('ru-RU') + ' в ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  var MAP_NOTE = 'Если её показать, ООО «ЯНДЕКС» получит ваш IP-адрес и сведения о браузере и может сохранить свои cookies, в том числе для статистики и рекламы.';

  function applyMaps() {
    var ok = !!(consent() && consent().maps);
    frames().forEach(function (f) {
      var slot = f.parentNode, ph = slot.querySelector('.map-consent');
      if (ok) {
        if (f.getAttribute('src') !== f.getAttribute('data-consent-src')) f.setAttribute('src', f.getAttribute('data-consent-src'));
        if (ph) ph.hidden = true;
        return;
      }
      if (f.getAttribute('src') && f.getAttribute('src') !== 'about:blank') f.setAttribute('src', 'about:blank');
      if (!ph) {
        ph = document.createElement('div');
        ph.className = 'map-consent';
        ph.innerHTML = '<strong>Карта Яндекса не загружена</strong><p>' + MAP_NOTE + '</p>' +
          '<button type="button" class="hb-btn" data-consent-allow="map">Показать карту</button>' +
          '<a href="' + policyHref('cookies') + '">Подробнее в политике</a>';
        slot.classList.add('map-slot');
        slot.appendChild(ph);
      }
      ph.hidden = false;
    });
  }

  /* Текущее состояние в плашке и в настройках на странице политики. */
  function stateText() {
    var c = consent();
    if (!c) return 'Выбор пока не сделан: карта не загружается.';
    return (c.maps ? 'Сейчас карта разрешена' : 'Сейчас карта не загружается') + ' (решение от ' + fmtDate(c.at) + ').';
  }
  function renderState() {
    [].slice.call(document.querySelectorAll('[data-consent-state]')).forEach(function (el) {
      el.textContent = consent() || el.closest('[data-consent-settings]') ? stateText() : '';
    });
  }

  var banner = null, opener = null;
  function buildBanner() {
    banner = document.createElement('section');
    banner.className = 'hb-consent';
    banner.setAttribute('aria-labelledby', 'hb-consent-title');
    banner.hidden = true;
    banner.innerHTML =
      '<h2 class="hb-consent-title" id="hb-consent-title">Карта и cookies</h2>' +
      '<p>В разделе «О нас» есть карта Яндекса. Если её показать, ООО «ЯНДЕКС» получит ваш IP-адрес и может сохранить свои cookies, в том числе для рекламы. Сам сайт cookies не использует. <a href="' + policyHref('cookies') + '">Подробнее</a></p>' +
      '<p class="hb-consent-state" data-consent-state></p>' +
      '<div class="hb-consent-actions">' +
        '<button type="button" class="hb-btn" data-consent-allow="banner">Разрешить</button>' +
        '<button type="button" class="hb-btn hb-btn--line" data-consent-deny="banner">Отклонить</button>' +
      '</div>' +
      '<button type="button" class="hb-consent-close" data-consent-close aria-label="Закрыть" hidden>×</button>';
    document.body.appendChild(banner);
  }
  function openBanner(byUser) {
    if (!banner) buildBanner();
    renderState();
    banner.querySelector('[data-consent-close]').hidden = !consent();
    banner.hidden = false;
    if (byUser) banner.querySelector('.hb-btn').focus();
  }
  function closeBanner() {
    if (!banner || banner.hidden) return;
    banner.hidden = true;
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-consent-allow], [data-consent-deny], [data-consent-open], [data-consent-close]');
    if (!t) return;
    if (t.hasAttribute('data-consent-allow')) decide(true, t.getAttribute('data-consent-allow'));
    else if (t.hasAttribute('data-consent-deny')) decide(false, t.getAttribute('data-consent-deny'));
    else if (t.hasAttribute('data-consent-close')) closeBanner();
    else { opener = t; openBanner(true); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && banner && !banner.hidden && consent()) closeBanner();
  });

  document.addEventListener('DOMContentLoaded', function () {
    applyMaps();
    renderState();
    /* Плашка появляется сама только там, где есть карта, и только пока выбор не сделан. */
    if (frames().length && !consent()) openBanner(false);
  });

  window.HBBurger = HBBurger;
  window.HBMenuNav = HBMenuNav;
  window.HBIcons = HBIcons;
  window.HBScrolled = HBScrolled;
})();
