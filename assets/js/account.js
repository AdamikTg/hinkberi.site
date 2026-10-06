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

  Где хранятся аккаунты (с 06.10.2026). На сервере бонусов в Yandex Cloud (HB.loyalty.api, код в папке
  «сервер/бонусы»): имя, почта, хэш пароля, номер карты, баллы и операции. Кассир видит карту на странице
  кассир.html. В браузере лежат только ключ входа (hb-session) и копия имени, номера карты и баллов (hb-me),
  чтобы шапка сразу показывала баллы, пока сервер отвечает. «Выйти» стирает и то и другое.
  В окне «Ваши баллы» есть последние операции и удаление аккаунта (отзыв согласия, нужен пароль).
  Проверочное хранилище в браузере (hb-demo-*), которое было до сервера, стирается при открытии сайта.
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
  function when(ms) {
    return new Date(ms).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var EARN = nb(RULE.points + ' ' + pointsWord(RULE.points));      // «10 баллов»
  var PER = 'за каждые ' + nb(U.price(RULE.spend)) + ' покупки';  // «за каждые 100 ₽ покупки»
  var WORTH = nb('1 балл = ' + U.price(RULE.rub));                // «1 балл = 1 ₽»
  /* Считается от любой суммы, не только от целых сотен (владелец: «250р - 25 баллов»). */
  var FOR250 = Math.floor(250 * RULE.points / RULE.spend);
  var EXAMPLE = nb(U.price(250)) + ' дают ' + nb(FOR250 + ' ' + pointsWord(FOR250));   // «250 ₽ дают 25 баллов»

  /* ---------- Ошибки ---------- */
  var MESSAGES = {
    credentials: 'Не нашли аккаунт с таким именем, почтой и паролем. Проверьте их или зарегистрируйтесь.',
    exists: 'Эта почта уже зарегистрирована. Проверьте имя и пароль и нажмите «Войти».',
    locked: 'Слишком много неудачных попыток. Подождите 15 минут и попробуйте снова.',
    bad: 'Проверьте имя, почту и пароль: что-то заполнено не так.',
    auth: 'Вход устарел. Войдите ещё раз.',
    network: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.',
    old: 'Этот браузер слишком старый для входа. Обновите его или откройте сайт в другом браузере.',
    unknown: 'Что-то пошло не так на нашей стороне. Попробуйте ещё раз через минуту.'
  };

  /* ---------- Сервер бонусов ---------- */
  var TOKEN = 'hb-session', ME = 'hb-me';
  var memory = {};   // если браузер не даёт localStorage (бывает в инкогнито), вход живёт до закрытия вкладки
  function read(k) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return memory[k] || null; }
  }
  function write(k, v) { memory[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* хватит памяти вкладки */ } }
  function forget() {
    memory = {};
    try { localStorage.removeItem(TOKEN); localStorage.removeItem(ME); } catch (e) { /* стирать нечего */ }
  }
  try { localStorage.removeItem('hb-demo-accounts'); localStorage.removeItem('hb-demo-session'); } catch (e) { /* нет доступа */ }

  function keep(r) {
    if (r.token) write(TOKEN, r.token);
    write(ME, { name: r.user.name, number: r.user.number, points: r.user.points });
    return r.user;
  }
  var store = {
    /* Копия из браузера: чтобы шапка сразу показала баллы, пока сервер отвечает. */
    cached: function () { return read(TOKEN) ? read(ME) : null; },
    current: function () {
      var token = read(TOKEN);
      if (!token) return Promise.resolve(null);
      return U.api({ action: 'me', token: token }).then(keep, function (err) {
        if (err.code === 'auth') { forget(); return null; }   // вход устарел или аккаунт удалён
        throw err;
      });
    },
    signUp: function (d) {
      return U.api({ action: 'register', name: d.name, email: d.email, password: d.password, consent: d.consent }).then(keep);
    },
    signIn: function (d) {
      return U.api({ action: 'login', name: d.name, email: d.email, password: d.password }).then(keep);
    },
    signOut: function () {
      var token = read(TOKEN);
      forget();
      if (token) U.api({ action: 'logout', token: token }).catch(function () { /* ключ и так стёрт в браузере */ });
      return Promise.resolve();
    },
    remove: function (password) {
      return U.api({ action: 'delete', token: read(TOKEN), password: password }).then(forget);
    }
  };

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
        '<p class="auth-note" role="status" hidden></p>' +
        '<p class="auth-rule">' + esc(EARN + ' ' + PER + ', ' + EXAMPLE + '. ' + WORTH) + '.</p>' +
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
          '<label for="auth-consent">Даю <a href="согласие.html" target="_blank" rel="noopener">согласие на обработку персональных данных</a> для бонусной программы</label>' +
          '<p class="field-err" id="auth-consent-err" hidden></p>' +
        '</div>' +
        '<p class="auth-error" role="alert" hidden></p>' +
        '<button class="btn btn--green auth-submit" type="submit" data-submit>Зарегистрироваться</button>' +
      '</form>' +
      '<div class="auth-me" data-part="me" hidden>' +
        '<p class="me-points"><span data-me-points>0</span><span class="me-unit" data-me-unit>баллов</span></p>' +
        '<p class="me-card" data-me-card></p>' +
        '<p class="me-hint">Назовите номер или покажите это окно на кассе: кассир начислит баллы или спишет их в счёт оплаты.</p>' +
        '<p class="me-rule">' + esc(EARN + ' ' + PER + ', ' + EXAMPLE + '. ' + WORTH) + '.</p>' +
        '<div class="me-actions">' +
          '<button type="button" class="btn btn--green" data-auth-close>Готово</button>' +
          '<button type="button" class="btn btn--line" data-auth-logout>Выйти</button>' +
        '</div>' +
        '<section class="me-ops" aria-labelledby="me-ops-title">' +
          '<h3 class="me-ops-title" id="me-ops-title">Последние операции</h3>' +
          '<ul class="me-ops-list" data-me-ops></ul>' +
          '<p class="me-ops-empty" data-me-empty hidden>Пока пусто. Баллы появятся после первой покупки с картой.</p>' +
        '</section>' +
        '<button type="button" class="me-delete" data-auth-delete>Удалить аккаунт</button>' +
      '</div>' +
      '<form class="auth" data-part="delete" novalidate hidden>' +
        '<p class="del-text" data-del-text></p>' +
        '<div class="field">' +
          '<label for="del-password">Пароль</label>' +
          '<input id="del-password" name="password" type="password" autocomplete="current-password" maxlength="72" aria-describedby="del-password-err">' +
          '<p class="field-err" id="del-password-err" hidden></p>' +
        '</div>' +
        '<div class="me-actions">' +
          '<button type="button" class="btn btn--green" data-del-cancel>Оставить аккаунт</button>' +
          '<button type="submit" class="btn btn--line" data-del-submit>Удалить навсегда</button>' +
        '</div>' +
      '</form>' +
     '</div>' +
    '</dialog>');

  var dlg = document.querySelector('.auth-dialog');
  var title = dlg.querySelector('.auth-title');
  var form = dlg.querySelector('form');
  var submit = form.querySelector('[data-submit]');
  var parts = { form: form, me: dlg.querySelector('[data-part="me"]'), del: dlg.querySelector('[data-part="delete"]') };
  var delSubmit = parts.del.querySelector('[data-del-submit]');
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

  function paintMe() {
    var u = state.user, me = parts.me, ops = u.history;
    me.querySelector('[data-me-points]').textContent = group(u.points);
    me.querySelector('[data-me-unit]').textContent = pointsWord(u.points);
    me.querySelector('[data-me-card]').textContent = u.name + ', карта ' + cardNo(u.number);
    /* У копии из браузера истории нет: раздел появляется, когда ответит сервер. */
    me.querySelector('.me-ops').hidden = !ops;
    if (!ops) return;
    var list = me.querySelector('[data-me-ops]');
    list.hidden = !ops.length;
    me.querySelector('[data-me-empty]').hidden = ops.length > 0;
    list.innerHTML = ops.map(function (x) {
      var sub = when(x.at) + (x.spent ? ', списано ' + nb(group(x.spent) + ' ' + pointsWord(x.spent)) : '');
      return '<li class="me-op">' +
        '<span class="me-op-what">Покупка на ' + esc(nb(U.price(x.amount))) + '</span>' +
        '<span class="me-op-pts">+' + group(x.earned) + '</span>' +
        '<span class="me-op-when">' + esc(sub) + '</span>' +
      '</li>';
    }).join('');
  }

  function show(view) {
    state.view = view;
    parts.form.hidden = view !== 'form';
    parts.me.hidden = view !== 'me';
    parts.del.hidden = view !== 'delete';
    title.textContent = view === 'me' ? 'Ваши баллы' : view === 'delete' ? 'Удалить аккаунт' : 'Бонусы и скидки';
    if (view === 'me') paintMe();
    if (view === 'delete') {
      var u = state.user;
      parts.del.querySelector('[data-del-text]').textContent = 'Аккаунт, карта ' + cardNo(u.number) + ' и ' +
        nb(group(u.points) + ' ' + pointsWord(u.points)) + ' удалятся навсегда, вернуть их будет нельзя. ' +
        'Чтобы подтвердить, введите пароль.';
      parts.del.elements.password.value = '';
      delError('');
    }
  }

  /* Свежие баллы с сервера: при открытии сайта, окна и при возврате на вкладку (кассир мог начислить). */
  var lastRefresh = 0;
  var gen = 0;   // растёт при входе, выходе и удалении: ответ, пришедший после них, уже не нужен
  function refresh() {
    var mine = gen;
    lastRefresh = Date.now();
    return store.current().then(function (u) {
      if (mine !== gen) return;
      var had = !!state.user;
      state.user = u;
      paintOutside();
      if (!dlg.open || state.busy) return;
      if (u && state.view === 'me') paintMe();
      if (!u && had && state.view !== 'form') { setMode('login'); show('form'); formError(MESSAGES.auth); }
    }, function () { /* нет связи: остаётся копия из браузера */ });
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
  function clearErrors() { FIELDS.forEach(function (n) { fieldError(n, ''); }); formError(''); note(''); }
  function note(msg) {
    var p = form.querySelector('.auth-note');
    p.textContent = msg || '';
    p.hidden = !msg;
  }
  function delError(msg) {
    var input = parts.del.elements.password, p = parts.del.querySelector('#del-password-err');
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    p.textContent = msg || '';
    p.hidden = !msg;
  }

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
      gen++;
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

  /* ---------- Удаление аккаунта ---------- */
  function delBusy(on) {
    state.busy = on;
    delSubmit.disabled = on;
    delSubmit.setAttribute('aria-busy', String(on));
    delSubmit.textContent = on ? 'Удаляем…' : 'Удалить навсегда';
  }
  parts.del.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.busy) return;
    var input = parts.del.elements.password;
    delError('');
    if (!input.value) { delError('Введите пароль'); input.focus(); return; }
    delBusy(true);
    store.remove(input.value).then(function () {
      delBusy(false);
      gen++;
      state.user = null;
      paintOutside();
      setMode('register');
      show('form');
      note('Аккаунт, карта и баллы удалены. Если захотите вернуться, зарегистрируйтесь заново.');
      title.focus();
    }, function (err) {
      delBusy(false);
      var code = err && err.code;
      if (code === 'auth') {   // вход устарел: удалять уже нечем, просим войти
        gen++;
        state.user = null;
        paintOutside();
        setMode('login');
        show('form');
        formError(MESSAGES.auth);
        title.focus();
        return;
      }
      delError(code === 'credentials' ? 'Пароль не подходит' : MESSAGES[code] || MESSAGES.unknown);
      input.focus();
    });
  });
  parts.del.addEventListener('input', function () { delError(''); });

  /* ---------- Открыть и закрыть окно ---------- */
  function open(what, from) {
    opener = from || null;
    if (state.user) {
      show('me');
      if (Date.now() - lastRefresh > 5000) refresh();
    }
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
    parts.del.elements.password.value = '';
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
    var t = e.target.closest && e.target.closest('[data-auth], [data-mode], [data-auth-close], [data-auth-logout], [data-auth-delete], [data-del-cancel]');
    if (!t) return;
    if (t.hasAttribute('data-mode')) { if (!state.busy) setMode(t.getAttribute('data-mode')); return; }
    if (t.hasAttribute('data-auth-close')) { close(); return; }
    if (t.hasAttribute('data-auth-delete')) {
      show('delete');
      if (FINE) parts.del.elements.password.focus(); else title.focus();
      return;
    }
    if (t.hasAttribute('data-del-cancel')) { if (!state.busy) { show('me'); title.focus(); } return; }
    if (t.hasAttribute('data-auth-logout')) {
      store.signOut().then(function () {
        gen++;
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
    if (e.key === TOKEN) { gen++; refresh(); return; }
    if (e.key !== ME || !state.user || state.busy) return;
    var c = store.cached();                    // другая вкладка получила свежие баллы
    if (!c) return;
    state.user.points = c.points;
    paintOutside();
    if (dlg.open && state.view === 'me') paintMe();
  });

  /* Гость вернулся на вкладку, например после кассы: баллы могли измениться. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && state.user && Date.now() - lastRefresh > 15000) refresh();
  });

  /* ---------- Старт ---------- */
  state.user = store.cached();
  paintOutside();
  refresh();
})();
