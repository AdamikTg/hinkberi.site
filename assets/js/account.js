/*
  Карта лояльности: регистрация, вход и карта гостя с баллами.
  Работает только на странице с атрибутом data-account у <html>. Сейчас это проверка.html:
  основной сайт (index.html) карту пока не показывает, там в шапке остаётся «Маршрут».

  Что делает скрипт:
  - вместо «Маршрута» в шапке ставит «Войти» и «Регистрация», после входа «Моя карта»;
  - после плиток вставляет блок «Карта лояльности»: правила, форма и карта гостя;
  - пока гость печатает имя, оно сразу появляется на карте.
  Правила начисления берутся из data.js (HB.loyalty).
  Вход по просьбе владельца по трём полям: имя, почта и пароль (04.10.2026).

  Где хранятся аккаунты. Пока база не подключена, работает проверочное хранилище demoStore:
  аккаунт живёт только в этом браузере (localStorage), кассир его не видит, с другого устройства
  войти нельзя. Пароль не хранится, хранится его хэш (PBKDF2, своя соль у каждого аккаунта).
  Чтобы подключить базу, достаточно написать объект с теми же методами, что у demoStore
  (current, signUp, signIn, signOut), и поставить его в store.
*/
(function () {
  'use strict';
  if (!document.documentElement.hasAttribute('data-account')) return;

  var H = window.HB, U = window.HBU, esc = U.esc, RULE = H.loyalty;
  var SECTION = 'карта';
  var FINE = !!(window.matchMedia && matchMedia('(pointer: fine)').matches);   // мышь: курсор можно сразу ставить в поле

  /* ---------- Слова и числа ---------- */
  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    return b >= 2 && b <= 4 ? few : many;
  }
  function pointsWord(n) { return plural(n, 'балл', 'балла', 'баллов'); }
  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function cardNo(n) { return n ? '№ ' + String(n).replace(/(\d{3})(?=\d)/g, '$1 ') : '№ ••• •••'; }
  function cleanName(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function cleanEmail(s) { return String(s || '').trim().toLowerCase(); }
  function sameName(a, b) {
    function key(s) { return cleanName(s).toLowerCase().replace(/ё/g, 'е'); }
    return key(a) === key(b);
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function nb(s) { return s.replace(/ /g, ' '); }        // число и слово не разрываются по строкам
  var EARN = nb(RULE.points + ' ' + pointsWord(RULE.points));      // «10 баллов»
  var PER = 'за каждые ' + nb(U.price(RULE.spend)) + ' покупки';  // «за каждые 100 ₽ покупки»
  var WORTH = nb('1 балл = ' + U.price(RULE.rub));                // «1 балл = 1 ₽»
  var AT_TILL = 'кассир начислит баллы или спишет их в счёт оплаты.';

  /* ---------- Ошибки ---------- */
  function fail(code) { var e = new Error(code); e.code = code; return e; }
  var MESSAGES = {
    credentials: 'Не нашли карту с таким именем, почтой и паролем. Проверьте их или зарегистрируйтесь.',
    exists: 'Эта почта уже зарегистрирована. Проверьте имя и пароль и нажмите «Войти».',
    storage: 'Браузер не даёт сохранить карту. Выйдите из режима инкогнито и попробуйте ещё раз.',
    old: 'Этот браузер не умеет безопасно хранить пароль. Обновите его или откройте сайт в другом браузере.',
    unknown: 'Что-то пошло не так. Попробуйте ещё раз.'
  };

  /* ---------- Проверочное хранилище: аккаунты только в этом браузере ---------- */
  var USERS = 'hb-demo-accounts', SESSION = 'hb-demo-session';
  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { throw fail('storage'); } }
  function b64(bytes) { return btoa(String.fromCharCode.apply(null, new Uint8Array(bytes))); }
  function unb64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  function canHash() { return !!(window.crypto && crypto.subtle && crypto.getRandomValues && window.TextEncoder); }
  function hash(password, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
      })
      .then(b64);
  }
  function profile(email, u) { return { name: u.name, email: email, number: u.card, points: u.points || 0 }; }

  var demoStore = {
    demo: true,
    current: function () {
      var users = read(USERS) || {}, email = read(SESSION);
      return Promise.resolve(email && users[email] ? profile(email, users[email]) : null);
    },
    signUp: function (d) {
      if (!canHash()) return Promise.reject(fail('old'));
      var users = read(USERS) || {};
      if (users[d.email]) return Promise.reject(fail('exists'));
      var salt = crypto.getRandomValues(new Uint8Array(16));
      return hash(d.password, salt).then(function (h) {
        var taken = {}, no;
        Object.keys(users).forEach(function (k) { taken[users[k].card] = true; });
        do { no = 100000 + Math.floor(Math.random() * 900000); } while (taken[no]);
        users[d.email] = { name: d.name, salt: b64(salt), hash: h, card: no, points: 0, created: new Date().toISOString() };
        write(USERS, users);
        write(SESSION, d.email);
        return profile(d.email, users[d.email]);
      });
    },
    signIn: function (d) {
      if (!canHash()) return Promise.reject(fail('old'));
      var u = (read(USERS) || {})[d.email];
      if (!u) return Promise.reject(fail('credentials'));
      return hash(d.password, unb64(u.salt)).then(function (h) {
        if (h !== u.hash || !sameName(d.name, u.name)) throw fail('credentials');
        write(SESSION, d.email);
        return profile(d.email, u);
      });
    },
    signOut: function () {
      try { localStorage.removeItem(SESSION); } catch (e) { /* стирать нечего */ }
      return Promise.resolve();
    }
  };
  var store = demoStore;

  /* ---------- Шапка: «Войти» и «Регистрация» вместо «Маршрута» ---------- */
  /* В проверка.html эти ссылки уже вписаны в разметку, чтобы «Маршрут» не мелькал до запуска скрипта;
     если страница без них, ставим их сами. */
  var end = document.querySelector('.header-end');
  if (!end.querySelector('[data-auth]')) {
    end.innerHTML =
      '<a class="btn btn--line acc-login" href="#' + SECTION + '" data-auth="login">Войти</a>' +
      '<a class="btn btn--green acc-join" href="#' + SECTION + '" data-auth="register">Регистрация</a>' +
      '<a class="btn btn--green acc-card" href="#' + SECTION + '" data-auth="card" hidden>Моя карта</a>';
  }
  var head = { login: end.querySelector('.acc-login'), join: end.querySelector('.acc-join'), card: end.querySelector('.acc-card') };

  /* ---------- Блок «Карта лояльности» после плиток ---------- */
  var tiles = document.querySelector('.tiles');
  tiles.classList.add('tiles--joined');
  tiles.insertAdjacentHTML('afterend',
    '<section class="loyalty" id="' + SECTION + '" aria-labelledby="loyalty-title">' +
      '<div class="loyalty-panel">' +
        '<h2 class="loyalty-title" id="loyalty-title" tabindex="-1">Карта лояльности</h2>' +
        '<div class="lcard" role="img" data-card>' +
          '<div class="lcard-top">' +
            '<img class="lcard-logo" src="assets/img/logo/logo-white.png" alt="" width="528" height="296">' +
            '<span class="lcard-no" data-card-no></span>' +
          '</div>' +
          '<p class="lcard-points"><span data-card-points>0</span><span class="lcard-unit" data-card-unit>баллов</span></p>' +
          '<p class="lcard-name" data-card-name></p>' +
        '</div>' +
        '<div class="loyalty-body">' +
          '<div class="loyalty-part" data-part="intro">' +
            '<p class="loyalty-rule"><span class="loyalty-earn">' + esc(EARN) + '</span><span class="loyalty-per">' + esc(PER) + '</span></p>' +
            '<p class="loyalty-sub">Баллами можно платить за новые заказы: ' + esc(WORTH) + '.</p>' +
            '<div class="loyalty-actions">' +
              '<a class="btn btn--green" href="#' + SECTION + '" data-auth="register">Регистрация</a>' +
              '<a class="btn btn--line" href="#' + SECTION + '" data-auth="login">Войти</a>' +
            '</div>' +
            '<p class="loyalty-note">Покажите карту на кассе: ' + esc(AT_TILL) + '</p>' +
          '</div>' +
          '<form class="auth loyalty-part" data-part="form" novalidate hidden aria-labelledby="loyalty-title">' +
            '<div class="auth-tabs" role="group" aria-label="Регистрация или вход">' +
              '<button type="button" data-mode="register" aria-pressed="true">Регистрация</button>' +
              '<button type="button" data-mode="login" aria-pressed="false">Вход</button>' +
            '</div>' +
            '<div class="field">' +
              '<label for="auth-name">Имя</label>' +
              '<input id="auth-name" name="name" autocomplete="given-name" maxlength="40" aria-describedby="auth-name-err">' +
              '<p class="field-err" id="auth-name-err" hidden></p>' +
            '</div>' +
            '<div class="field">' +
              '<label for="auth-email">Почта</label>' +
              '<input id="auth-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="120" aria-describedby="auth-email-err">' +
              '<p class="field-err" id="auth-email-err" hidden></p>' +
            '</div>' +
            '<div class="field">' +
              '<label for="auth-password">Пароль</label>' +
              '<div class="pass">' +
                '<input id="auth-password" name="password" type="password" autocomplete="new-password" maxlength="72" aria-describedby="auth-password-hint auth-password-err">' +
                '<button class="pass-toggle" type="button" aria-controls="auth-password" aria-label="Показать пароль">Показать</button>' +
              '</div>' +
              '<p class="field-hint" id="auth-password-hint">Не меньше 8 символов</p>' +
              '<p class="field-err" id="auth-password-err" hidden></p>' +
            '</div>' +
            '<div class="check" data-only="register">' +
              '<input id="auth-consent" name="consent" type="checkbox" aria-describedby="auth-consent-err">' +
              '<label for="auth-consent">Даю согласие на обработку персональных данных по <a href="politika.html" target="_blank" rel="noopener">политике конфиденциальности</a></label>' +
              '<p class="field-err" id="auth-consent-err" hidden></p>' +
            '</div>' +
            '<p class="auth-error" role="alert" hidden></p>' +
            '<div class="auth-actions">' +
              '<button class="btn btn--green" type="submit" data-submit>Зарегистрироваться</button>' +
              '<button class="auth-cancel" type="button" data-auth-cancel>Отмена</button>' +
            '</div>' +
          '</form>' +
          '<div class="loyalty-part" data-part="me" hidden>' +
            '<p class="loyalty-sub" data-me-text></p>' +
            '<p class="loyalty-small">' + esc(EARN + ' ' + PER + ', ' + WORTH) + '.</p>' +
            '<div class="loyalty-actions"><button class="btn btn--line" type="button" data-auth-logout>Выйти</button></div>' +
          '</div>' +
          (store.demo ? '<p class="auth-demo">Проверочная версия: карта хранится только в этом браузере, кассир её пока не видит.</p>' : '') +
        '</div>' +
      '</div>' +
    '</section>');

  var section = document.getElementById(SECTION);
  var panel = section.querySelector('.loyalty-panel');
  var title = panel.querySelector('.loyalty-title');
  var form = panel.querySelector('form');
  var submit = form.querySelector('[data-submit]');
  var card = panel.querySelector('[data-card]');
  var parts = {};
  [].slice.call(panel.querySelectorAll('[data-part]')).forEach(function (p) { parts[p.getAttribute('data-part')] = p; });

  var state = { user: null, view: 'intro', mode: 'register', busy: false, ready: false };

  /* ---------- Отрисовка ---------- */
  function paintCard() {
    var u = state.user;
    var name = u ? u.name : (state.view === 'form' ? cleanName(form.elements.name.value) : '');
    var pts = u ? u.points : 0;
    var nameEl = card.querySelector('[data-card-name]');
    nameEl.textContent = name || 'Ваше имя';
    nameEl.classList.toggle('is-empty', !name);
    card.querySelector('[data-card-no]').textContent = cardNo(u && u.number);
    card.querySelector('[data-card-points]').textContent = group(pts);
    card.querySelector('[data-card-unit]').textContent = pointsWord(pts);
    card.setAttribute('aria-label', u
      ? 'Карта лояльности ХинкБери: ' + u.name + ', ' + cardNo(u.number) + ', ' + group(pts) + ' ' + pointsWord(pts)
      : 'Так выглядит карта лояльности ХинкБери');
  }

  function paintHeader() {
    var inside = !!state.user;
    head.login.hidden = inside;
    head.join.hidden = inside;
    head.card.hidden = !inside;
  }

  function show(view) {
    state.view = view;
    panel.setAttribute('data-view', view);   // на телефоне от состояния зависит, где стоит карта
    Object.keys(parts).forEach(function (k) { parts[k].hidden = k !== view; });
    title.textContent = view === 'me' ? 'Ваша карта' : 'Карта лояльности';
    if (view === 'me') {
      parts.me.querySelector('[data-me-text]').textContent = state.user.name + ', ' +
        (state.user.points ? 'покажите карту на кассе: ' : 'карта готова. Покажите её на кассе: ') + AT_TILL;
    }
    paintCard();
    paintHeader();
    /* Короткое появление при смене состояния; при первой отрисовке без него. */
    var part = parts[view];
    if (state.ready) { part.classList.remove('is-entering'); void part.offsetWidth; part.classList.add('is-entering'); }
  }

  /* ---------- Форма ---------- */
  var FIELDS = ['name', 'email', 'password', 'consent'];
  function fieldError(name, msg) {
    var input = form.elements[name], p = form.querySelector('#auth-' + name + '-err');
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    p.textContent = msg || '';
    p.hidden = !msg;
    /* Подсказка «Не меньше 8 символов» не повторяет ошибку под тем же полем. */
    if (name === 'password') form.querySelector('#auth-password-hint').hidden = !!msg || state.mode !== 'register';
  }
  function formError(msg) {
    var p = form.querySelector('.auth-error');
    p.textContent = msg || '';
    p.hidden = !msg;
  }
  function clearErrors() { FIELDS.forEach(function (n) { fieldError(n, ''); }); formError(''); }

  function label() { return state.mode === 'register' ? 'Зарегистрироваться' : 'Войти'; }
  function setMode(mode) {
    state.mode = mode;
    var reg = mode === 'register';
    [].slice.call(form.querySelectorAll('[data-mode]')).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode));
    });
    form.querySelector('[data-only="register"]').hidden = !reg;
    form.querySelector('#auth-password-hint').hidden = !reg;
    form.elements.password.setAttribute('autocomplete', reg ? 'new-password' : 'current-password');
    submit.textContent = label();
    clearErrors();
  }

  function busy(on) {
    state.busy = on;
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    submit.textContent = on ? (state.mode === 'register' ? 'Создаём карту…' : 'Входим…') : label();
  }

  function check(d) {
    var bad = [], reg = state.mode === 'register';
    if (!d.name) bad.push(['name', 'Введите имя']);
    if (!d.email) bad.push(['email', 'Введите почту']);
    else if (!EMAIL.test(d.email)) bad.push(['email', 'Проверьте почту, например: anna@mail.ru']);
    if (!d.password) bad.push(['password', 'Введите пароль']);
    else if (reg && d.password.length < 8) bad.push(['password', 'Пароль должен быть не короче 8 символов']);
    if (reg && !d.consent) bad.push(['consent', 'Без согласия мы не сможем завести карту']);
    return bad;
  }

  function openForm(mode) {
    setMode(mode);
    show('form');
    if (FINE) form.elements.name.focus({ preventScroll: true });
  }

  function toTop() {
    var top = section.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) {
      section.scrollIntoView({ block: 'start', behavior: document.documentElement.classList.contains('reduce') ? 'auto' : 'smooth' });
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.busy) return;
    var d = {
      name: cleanName(form.elements.name.value),
      email: cleanEmail(form.elements.email.value),
      password: form.elements.password.value,
      consent: form.elements.consent.checked
    };
    clearErrors();
    var bad = check(d);
    if (bad.length) {
      bad.forEach(function (b) { fieldError(b[0], b[1]); });
      form.elements[bad[0][0]].focus();
      return;
    }
    busy(true);
    (state.mode === 'register' ? store.signUp(d) : store.signIn(d)).then(function (user) {
      busy(false);
      form.elements.password.value = '';
      state.user = user;
      show('me');
      title.focus({ preventScroll: true });
      toTop();
    }, function (err) {
      busy(false);
      var code = err && err.code;
      if (code === 'exists') setMode('login');   // почта уже есть: остаёмся в форме, но уже на входе
      formError(MESSAGES[code] || MESSAGES.unknown);
      if (document.activeElement === document.body || document.activeElement === submit) submit.focus();
    });
  });

  form.addEventListener('input', function (e) {
    var n = e.target.name;
    if (FIELDS.indexOf(n) >= 0) fieldError(n, '');
    if (n === 'name' && !state.user) paintCard();
  });
  form.addEventListener('change', function (e) { if (e.target.name === 'consent') fieldError('consent', ''); });

  form.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !state.busy) { e.preventDefault(); cancel(); }
  });

  var toggle = form.querySelector('.pass-toggle');
  toggle.addEventListener('click', function () {
    var input = form.elements.password, open = input.type === 'password';
    input.type = open ? 'text' : 'password';
    toggle.textContent = open ? 'Скрыть' : 'Показать';
    toggle.setAttribute('aria-label', open ? 'Скрыть пароль' : 'Показать пароль');
  });

  function cancel() {
    form.elements.password.value = '';
    clearErrors();
    show('intro');
    var b = parts.intro.querySelector('[data-auth="register"]');
    if (b) b.focus({ preventScroll: true });
  }

  /* ---------- Кнопки ---------- */
  /* Ссылки «Войти», «Регистрация» и «Моя карта» ведут к блоку: прокрутку делает core.js,
     здесь только выбираем, что в блоке показать. */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-auth], [data-mode], [data-auth-cancel], [data-auth-logout]');
    if (!t) return;
    if (t.hasAttribute('data-mode')) { if (!state.busy) setMode(t.getAttribute('data-mode')); return; }
    if (t.hasAttribute('data-auth-cancel')) { cancel(); return; }
    if (t.hasAttribute('data-auth-logout')) {
      store.signOut().then(function () {
        state.user = null;
        show('intro');
        title.focus({ preventScroll: true });
      });
      return;
    }
    if (state.user) { if (state.view !== 'me') show('me'); return; }
    var mode = t.getAttribute('data-auth');
    if (mode === 'register' || mode === 'login') openForm(mode);
  });

  /* Вход или выход в другой вкладке этого же браузера. */
  window.addEventListener('storage', function (e) {
    if (e.key !== SESSION && e.key !== USERS) return;
    store.current().then(function (u) {
      state.user = u;
      show(u ? 'me' : (state.view === 'form' ? 'form' : 'intro'));
    });
  });

  /* ---------- Старт ---------- */
  show('intro');
  store.current().then(function (u) {
    if (u) { state.user = u; show('me'); }
    state.ready = true;
  });
})();
