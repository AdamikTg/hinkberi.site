/*
  Бонусы: регистрация, вход и баллы гостя.
  Работает на странице с атрибутом data-account у <html>. С 04.10.2026 это основной сайт (index.html):
  владелец попросил показать бонусы всем, на телефоне и на ПК. Страница проверки больше не нужна.

  Что делает скрипт:
  - под плитками ставит зелёную полосу «Получать бонусы и скидки» (по референсу владельца, 04.10.2026);
  - полоса и кнопки «Войти» / «Регистрация» в шапке открывают окно с регистрацией и входом;
  - после входа полоса показывает баллы и номер карты, окно показывает баллы и кнопку «Выйти».
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

  var H = window.HB, U = window.HBU, esc = U.esc, RULE = H.loyalty, icon = window.hbIcon;
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
  function nb(s) { return s.replace(/ /g, ' '); }        // число и слово не разрываются по строкам
  function cardNo(n) { return nb('№ ' + String(n).replace(/(\d{3})(?=\d)/g, '$1 ')); }
  function cleanName(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function cleanEmail(s) { return String(s || '').trim().toLowerCase(); }
  function sameName(a, b) {
    function key(s) { return cleanName(s).toLowerCase().replace(/ё/g, 'е'); }
    return key(a) === key(b);
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var EARN = nb(RULE.points + ' ' + pointsWord(RULE.points));      // «10 баллов»
  var PER = 'за каждые ' + nb(U.price(RULE.spend)) + ' покупки';  // «за каждые 100 ₽ покупки»
  var WORTH = nb('1 балл = ' + U.price(RULE.rub));                // «1 балл = 1 ₽»

  /* ---------- Ошибки ---------- */
  function fail(code) { var e = new Error(code); e.code = code; return e; }
  var MESSAGES = {
    credentials: 'Не нашли аккаунт с таким именем, почтой и паролем. Проверьте их или зарегистрируйтесь.',
    exists: 'Эта почта уже зарегистрирована. Проверьте имя и пароль и нажмите «Войти».',
    storage: 'Браузер не даёт сохранить аккаунт. Выйдите из режима инкогнито и попробуйте ещё раз.',
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

  /* ---------- Шапка ---------- */
  /* В index.html кнопки уже вписаны в разметку, чтобы шапка не менялась после запуска скрипта;
     если страница без них, ставим их сами. */
  var end = document.querySelector('.header-end');
  if (!end.querySelector('[data-auth]')) {
    end.innerHTML =
      '<button type="button" class="btn btn--line acc-login" data-auth="login" aria-haspopup="dialog">Войти</button>' +
      '<button type="button" class="btn btn--green acc-join" data-auth="register" aria-haspopup="dialog">Регистрация</button>' +
      '<button type="button" class="btn btn--green acc-card" data-auth="me" aria-haspopup="dialog" hidden>' +
        '<span class="acc-long">Мои баллы</span><span class="acc-short">Баллы</span></button>';
  }
  var head = { login: end.querySelector('.acc-login'), join: end.querySelector('.acc-join'), card: end.querySelector('.acc-card') };

  /* ---------- Зелёная полоса под плитками ---------- */
  var tilesGrid = document.querySelector('.tiles-grid');
  var tilesNav = document.querySelector('.tiles-nav');
  (tilesNav || tilesGrid).insertAdjacentHTML('afterend',
    '<button type="button" class="bonus" data-auth="banner" aria-haspopup="dialog">' +
      '<img class="bonus-icon" src="assets/img/coins-white.png" alt="" width="99" height="96">' +
      '<span class="bonus-text">' +
        '<span class="bonus-title" data-bonus-title>Получать бонусы и скидки</span>' +
        '<span class="bonus-sub" data-bonus-sub>Войдите, чтобы копить и тратить баллы</span>' +
      '</span>' +
      icon('caret-right', 'bonus-go') +
    '</button>');
  var banner = document.querySelector('.bonus');

  /* ---------- Окно: регистрация, вход и баллы ---------- */
  document.body.insertAdjacentHTML('beforeend',
    '<dialog class="auth-dialog" aria-labelledby="auth-title">' +
     '<div class="auth-box">' +
      '<div class="auth-head">' +
        '<h2 class="auth-title" id="auth-title" tabindex="-1">Бонусы и скидки</h2>' +
        '<button type="button" class="auth-close" data-auth-close aria-label="Закрыть">' + icon('x') + '</button>' +
      '</div>' +
      '<form class="auth" data-part="form" novalidate>' +
        '<p class="auth-rule">' + esc(EARN + ' ' + PER + '. ' + WORTH) + '.</p>' +
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
        '<button class="btn btn--green auth-submit" type="submit" data-submit>Зарегистрироваться</button>' +
      '</form>' +
      '<div class="auth-me" data-part="me" hidden>' +
        '<p class="me-points"><span data-me-points>0</span><span class="me-unit" data-me-unit>баллов</span></p>' +
        '<p class="me-card" data-me-card></p>' +
        '<p class="me-hint">Назовите номер или покажите это окно на кассе: кассир начислит баллы или спишет их в счёт оплаты.</p>' +
        '<p class="me-rule">' + esc(EARN + ' ' + PER + ', ' + WORTH) + '.</p>' +
        '<div class="me-actions">' +
          '<button type="button" class="btn btn--green" data-auth-close>Готово</button>' +
          '<button type="button" class="btn btn--line" data-auth-logout>Выйти</button>' +
        '</div>' +
      '</div>' +
      (store.demo ? '<p class="auth-demo">Бонусы пока работают в тестовом режиме: аккаунт хранится только в этом браузере, кассир его ещё не видит.</p>' : '') +
     '</div>' +
    '</dialog>');

  var dlg = document.querySelector('.auth-dialog');
  var title = dlg.querySelector('.auth-title');
  var form = dlg.querySelector('form');
  var submit = form.querySelector('[data-submit]');
  var parts = { form: form, me: dlg.querySelector('[data-part="me"]') };
  var state = { user: null, view: 'form', mode: 'register', busy: false };
  var opener = null;

  /* ---------- Отрисовка ---------- */
  function paintOutside() {
    var u = state.user, inside = !!u;
    head.login.hidden = inside;
    head.join.hidden = inside;
    head.card.hidden = !inside;
    banner.querySelector('[data-bonus-title]').textContent = inside
      ? 'У вас ' + nb(group(u.points) + ' ' + pointsWord(u.points))
      : 'Получать бонусы и скидки';
    banner.querySelector('[data-bonus-sub]').textContent = inside
      ? 'Карта ' + cardNo(u.number) + '. Покажите её на кассе'
      : 'Войдите, чтобы копить и тратить баллы';
  }

  function show(view) {
    state.view = view;
    parts.form.hidden = view !== 'form';
    parts.me.hidden = view !== 'me';
    title.textContent = view === 'me' ? 'Ваши баллы' : 'Бонусы и скидки';
    if (view === 'me') {
      var u = state.user;
      parts.me.querySelector('[data-me-points]').textContent = group(u.points);
      parts.me.querySelector('[data-me-unit]').textContent = pointsWord(u.points);
      parts.me.querySelector('[data-me-card]').textContent = u.name + ', карта ' + cardNo(u.number);
    }
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
    form.elements.password.setAttribute('autocomplete', reg ? 'new-password' : 'current-password');
    submit.textContent = label();
    clearErrors();
  }

  function busy(on) {
    state.busy = on;
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    submit.textContent = on ? (state.mode === 'register' ? 'Создаём аккаунт…' : 'Входим…') : label();
  }

  function check(d) {
    var bad = [], reg = state.mode === 'register';
    if (!d.name) bad.push(['name', 'Введите имя']);
    if (!d.email) bad.push(['email', 'Введите почту']);
    else if (!EMAIL.test(d.email)) bad.push(['email', 'Проверьте почту, например: anna@mail.ru']);
    if (!d.password) bad.push(['password', 'Введите пароль']);
    else if (reg && d.password.length < 8) bad.push(['password', 'Пароль должен быть не короче 8 символов']);
    if (reg && !d.consent) bad.push(['consent', 'Без согласия мы не сможем завести аккаунт']);
    return bad;
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
      paintOutside();
      show('me');
      title.focus();
    }, function (err) {
      busy(false);
      var code = err && err.code;
      if (code === 'exists') setMode('login');   // почта уже есть: остаёмся в форме, но уже на входе
      formError(MESSAGES[code] || MESSAGES.unknown);
      if (document.activeElement === document.body || document.activeElement === submit) submit.focus();
    });
  });

  form.addEventListener('input', function (e) {
    if (FIELDS.indexOf(e.target.name) >= 0) fieldError(e.target.name, '');
  });
  form.addEventListener('change', function (e) { if (e.target.name === 'consent') fieldError('consent', ''); });

  var toggle = form.querySelector('.pass-toggle');
  toggle.addEventListener('click', function () {
    var input = form.elements.password, open = input.type === 'password';
    input.type = open ? 'text' : 'password';
    toggle.textContent = open ? 'Скрыть' : 'Показать';
    toggle.setAttribute('aria-label', open ? 'Скрыть пароль' : 'Показать пароль');
  });

  /* ---------- Открыть и закрыть окно ---------- */
  function open(what, from) {
    opener = from || null;
    if (state.user) show('me');
    else { setMode(what === 'login' ? 'login' : 'register'); show('form'); }
    if (!dlg.open) {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.classList.add('has-dialog');
    }
    /* С мышью сразу ставим курсор в первое поле; на телефоне клавиатура пусть не выскакивает сама. */
    if (state.view === 'form' && FINE) form.elements.name.focus();
    else title.focus();
  }
  function close() {
    if (state.busy) return;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
  }
  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('has-dialog');
    form.elements.password.value = '';
    clearErrors();
    /* Фокус возвращается туда, откуда окно открыли; если та кнопка скрылась (после выхода), на полосу. */
    var back = opener && document.contains(opener) && !opener.hidden ? opener : banner;
    back.focus({ preventScroll: true });
    opener = null;
  });
  dlg.addEventListener('cancel', function (e) { if (state.busy) e.preventDefault(); });   // Esc во время входа не закрывает
  /* Нажатие на затемнение вокруг окна закрывает его: всё содержимое лежит в .auth-box,
     поэтому сам dialog получает щелчок только снаружи окна. */
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-auth], [data-mode], [data-auth-close], [data-auth-logout]');
    if (!t) return;
    if (t.hasAttribute('data-mode')) { if (!state.busy) setMode(t.getAttribute('data-mode')); return; }
    if (t.hasAttribute('data-auth-close')) { close(); return; }
    if (t.hasAttribute('data-auth-logout')) {
      store.signOut().then(function () {
        state.user = null;
        paintOutside();
        close();
      });
      return;
    }
    open(t.getAttribute('data-auth'), t);
  });

  /* Вход или выход в другой вкладке этого же браузера. */
  window.addEventListener('storage', function (e) {
    if (e.key !== SESSION && e.key !== USERS) return;
    store.current().then(function (u) {
      state.user = u;
      paintOutside();
      if (dlg.open) show(u ? 'me' : 'form');
    });
  });

  /* ---------- Старт ---------- */
  paintOutside();
  store.current().then(function (u) {
    if (u) { state.user = u; paintOutside(); }
  });
})();
