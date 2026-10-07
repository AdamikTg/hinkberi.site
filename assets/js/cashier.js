/*
  Касса бонусов (кассир.html, hinkberi.site/кассир; просьба владельца 06.10.2026).
  Кассир входит общим паролем, находит карту гостя по номеру, вводит сумму чека и сколько баллов списать,
  проводит чек. Последний чек можно отменить в течение 15 минут, если по карте не было новых покупок.
  С 07.10.2026 карту можно отсканировать: у каждого гостя в окне «Ваши баллы» свой QR-код («HINKBERI:» и номер),
  кнопка «Сканировать QR-код» включает камеру этого устройства. Ручной сканер, который печатает код в поле номера,
  тоже работает: из строки берутся цифры.

  Баллы считает сервер (папка «сервер/бонусы»): 1 балл за каждые полные 10 ₽, оплаченные деньгами
  (250 ₽ = 25 баллов), 1 балл = 1 ₽. Здесь тот же расчёт только для подсказки до проведения.
  В браузере хранится только ключ смены (hb-cashier); сервер принимает его 12 часов.
*/
(function () {
  'use strict';
  var U = window.HBU, esc = U.esc, RULE = window.HB.loyalty;
  var KEY = 'hb-cashier', MAX_CHECK = 100000;
  var FINE = !!(window.matchMedia && matchMedia('(pointer: fine)').matches);

  /* ---------- Слова и числа ---------- */
  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    return b >= 2 && b <= 4 ? few : many;
  }
  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function nb(s) { return s.replace(/ /g, ' '); }
  function pts(n) { return nb(group(n) + ' ' + plural(n, 'балл', 'балла', 'баллов')); }
  function rub(n) { return nb(U.price(n)); }
  function cardNo(n) { return nb('№ ' + String(n).replace(/(\d{3})(?=\d)/g, '$1 ')); }
  function when(ms) {
    return new Date(ms).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function earnFor(paid) { return Math.floor(paid * RULE.points / RULE.spend); }
  function newOp() {
    var a = new Uint8Array(12);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return [].map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  var MESSAGES = {
    network: 'Нет связи с сервером. Проверьте интернет и нажмите ещё раз: чек не проведётся дважды.',
    locked: 'Слишком много неудачных попыток с этого устройства. Подождите 15 минут.',
    not_found: 'Карты с таким номером нет. Переспросите номер у гостя.',
    too_much: 'Столько баллов списать нельзя: баланс изменился. Найдите карту заново.',
    not_last: 'Отменить нельзя: по карте уже была новая покупка.',
    too_late: 'Прошло больше 15 минут, этот чек уже не отменить.',
    old: 'Браузер слишком старый для кассы. Обновите его или откройте страницу в другом браузере.',
    unknown: 'Что-то пошло не так на сервере. Попробуйте ещё раз через минуту.'
  };
  function say(err) { return MESSAGES[err && err.code] || MESSAGES.unknown; }

  /* ---------- Ключ смены ---------- */
  var memory = null;
  function token() { try { return localStorage.getItem(KEY) || memory; } catch (e) { return memory; } }
  function keepToken(t) { memory = t; try { localStorage.setItem(KEY, t); } catch (e) { /* хватит памяти вкладки */ } }
  function dropToken() { memory = null; try { localStorage.removeItem(KEY); } catch (e) { /* стирать нечего */ } }

  /* ---------- Элементы ---------- */
  function $(s) { return document.querySelector(s); }
  var view = { login: $('[data-view="login"]'), work: $('[data-view="work"]') };
  var out = $('[data-out]');
  var login = { form: $('[data-login]'), submit: $('[data-login-submit]'), note: $('[data-login-note]'), title: $('#login-title') };
  var find = { form: $('[data-find]'), input: $('#till-card'), submit: $('[data-find-submit]'), err: $('#till-card-err') };
  var guestBox = $('[data-guest]');
  var check = {
    form: $('[data-check]'), fields: $('[data-check-fields]'), wait: $('[data-wait]'), note: $('[data-check-note]'),
    amount: $('#till-amount'), spend: $('#till-spend'), hint: $('#till-spend-hint'),
    error: $('[data-check-error]'), submit: $('[data-check-submit]'), max: $('[data-spend="max"]'),
    pay: $('[data-sum-pay]'), spent: $('[data-sum-spend]'), earn: $('[data-sum-earn]'), after: $('[data-sum-after]')
  };
  var done = $('[data-done]');
  var hist = { list: $('[data-hist]'), empty: $('[data-hist-empty]') };

  var state = { guest: null, op: null, last: null, busy: false, seq: 0, pending: null };

  function fieldError(input, errEl, msg) {
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    errEl.textContent = msg || '';
    errEl.hidden = !msg;
  }
  function show(el, msg) { el.textContent = msg || ''; el.hidden = !msg; }
  function busyBtn(btn, on, text, idle) {
    btn.disabled = on;
    btn.setAttribute('aria-busy', String(on));
    btn.textContent = on ? text : idle;
  }

  /* ---------- Вход и выход ---------- */
  function go(name) {
    view.login.hidden = name !== 'login';
    view.work.hidden = name !== 'work';
    out.hidden = name !== 'work';
  }
  function toLogin(msg) {
    dropToken();
    camStop();
    show(cam.err, '');
    resetGuest();
    go('login');
    show(login.note, msg);
    login.form.elements.password.value = '';
    if (FINE) login.form.elements.password.focus(); else login.title.focus();
  }
  /* Любой ответ «ключ не подходит»: смена закончилась или пароль кассира сменили. */
  function guard(err) {
    if (err && err.code === 'auth') { toLogin('Смена закончилась. Введите пароль кассира снова.'); return true; }
    return false;
  }

  login.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.busy) return;
    var input = login.form.elements.password, err = $('#till-password-err');
    fieldError(input, err, '');
    show(login.note, '');
    if (!input.value) { fieldError(input, err, 'Введите пароль'); input.focus(); return; }
    state.busy = true;
    busyBtn(login.submit, true, 'Входим…', 'Войти');
    U.api({ action: 'cashier_login', password: input.value }).then(function (r) {
      state.busy = false;
      busyBtn(login.submit, false, '', 'Войти');
      keepToken(r.token);
      input.value = '';
      go('work');
      find.input.focus();
    }, function (er) {
      state.busy = false;
      busyBtn(login.submit, false, '', 'Войти');
      fieldError(input, err, er.code === 'credentials' ? 'Пароль не подходит' : say(er));
      input.focus();
    });
  });
  login.form.addEventListener('input', function () { fieldError(login.form.elements.password, $('#till-password-err'), ''); });

  var toggle = login.form.querySelector('.pass-toggle');
  toggle.addEventListener('click', function () {
    var input = login.form.elements.password, open = input.type === 'password';
    input.type = open ? 'text' : 'password';
    toggle.textContent = open ? 'Скрыть' : 'Показать';
    toggle.setAttribute('aria-label', open ? 'Скрыть пароль' : 'Показать пароль');
  });

  out.addEventListener('click', function () {
    var t = token();
    if (t) U.api({ action: 'logout', token: t }).catch(function () { /* ключ и так стёрт в браузере */ });
    toLogin('Вы вышли. Чтобы продолжить, введите пароль снова.');
  });

  /* ---------- Гость ---------- */
  function paintGuest(loading) {
    var g = state.guest;
    guestBox.hidden = !g && !loading;
    guestBox.setAttribute('aria-busy', String(!!loading));
    if (loading) {
      guestBox.innerHTML = '<div class="till-guest-who"><span class="till-skel"></span><span class="till-skel till-skel--short"></span></div>' +
        '<span class="till-skel till-skel--num"></span>';
    } else if (g) {
      guestBox.innerHTML =
        '<div class="till-guest-who">' +
          '<p class="till-guest-name">' + esc(g.name) + '</p>' +
          '<p class="till-guest-card">Карта ' + esc(cardNo(g.number)) + '</p>' +
        '</div>' +
        '<p class="till-guest-pts"><span>' + group(g.points) + '</span><span class="till-guest-unit">' +
          plural(g.points, 'балл', 'балла', 'баллов') + '</span></p>';
    }
    paintHistory(loading);
  }

  function paintHistory(loading) {
    var g = state.guest, ops = g && !loading ? g.history || [] : [];
    hist.list.hidden = !ops.length;
    hist.empty.hidden = !!ops.length;
    hist.empty.textContent = loading ? 'Загружаем…'
      : g ? 'У этой карты ещё не было покупок.' : 'Найдите карту гостя: здесь появятся его последние покупки.';
    hist.list.innerHTML = ops.map(function (x) {
      var sub = when(x.at) + (x.spent ? ', списано ' + pts(x.spent) : '');
      return '<li class="me-op">' +
        '<span class="me-op-what">Покупка на ' + esc(rub(x.amount)) + '</span>' +
        '<span class="me-op-pts">+' + group(x.earned) + '</span>' +
        '<span class="me-op-when">' + esc(sub) + '</span>' +
      '</li>';
    }).join('');
  }

  function resetGuest() {
    state.seq++;
    state.pending = null;
    state.guest = null;
    state.op = null;
    state.last = null;
    find.input.value = '';
    fieldError(find.input, find.err, '');
    check.amount.value = '';
    check.spend.value = '0';
    show(check.note, '');
    done.hidden = true;
    check.form.hidden = false;
    paintGuest(false);
    paintCheck();
  }

  function lookUp() {
    var no = digits(find.input.value);
    fieldError(find.input, find.err, '');
    if (no.length !== 6) { fieldError(find.input, find.err, 'В номере карты 6 цифр'); find.input.focus(); return; }
    if (state.guest && String(state.guest.number) === no && done.hidden) { check.amount.focus(); return; }
    if (state.pending === no) return;   // этот номер уже ищем: ручной сканер после кода жмёт ещё и Enter
    if (cam.running) camStop();
    show(cam.err, '');
    var mine = ++state.seq;
    state.pending = no;
    state.guest = null;
    state.op = null;
    state.last = null;
    done.hidden = true;
    check.form.hidden = false;
    show(check.note, '');
    paintGuest(true);
    paintCheck();
    busyBtn(find.submit, true, 'Ищем…', 'Найти');
    U.api({ action: 'cashier_find', token: token(), card: no }).then(function (r) {
      if (mine !== state.seq) return;
      state.pending = null;
      busyBtn(find.submit, false, '', 'Найти');
      state.guest = r.guest;
      check.amount.value = '';
      check.spend.value = '0';
      paintGuest(false);
      paintCheck();
      check.amount.focus();
    }, function (er) {
      if (mine !== state.seq) return;
      state.pending = null;
      busyBtn(find.submit, false, '', 'Найти');
      paintGuest(false);
      if (guard(er)) return;
      fieldError(find.input, find.err, say(er));
      find.input.focus();
    });
  }

  /* Номер набирается как «123 456»; на шестой цифре карта ищется сама. */
  find.input.addEventListener('input', function () {
    var d = digits(find.input.value).slice(0, 6);
    var v = d.length > 3 ? d.slice(0, 3) + ' ' + d.slice(3) : d;
    if (find.input.value !== v) find.input.value = v;
    fieldError(find.input, find.err, '');
    if (d.length === 6 && !(state.guest && String(state.guest.number) === d)) lookUp();
  });
  find.form.addEventListener('submit', function (e) { e.preventDefault(); lookUp(); });

  /* ---------- QR-код карты: камера ----------
     Кадры разбираются здесь же, в браузере: встроенным распознаванием (BarcodeDetector, Chrome на Android)
     или библиотекой jsQR (iPhone, Windows и остальные). На сервер уходит только номер карты, как при наборе. */
  var cam = {
    open: $('[data-scan]'), box: $('[data-cam]'), video: $('[data-cam-video]'), status: $('[data-cam-status]'),
    close: $('[data-cam-close]'), err: $('[data-cam-err]'),
    stream: null, running: false, gen: 0, busy: false, last: 0, native: undefined, ctx: null
  };
  var CAM_ERRORS = {
    NotAllowedError: 'Нет доступа к камере. Разрешите камеру для этого сайта в настройках браузера и нажмите «Сканировать QR-код» ещё раз.',
    NotFoundError: 'Камера не найдена. Наберите номер карты вручную.',
    NotReadableError: 'Камера занята другой программой. Закройте её и попробуйте ещё раз.',
    nocam: 'Этот браузер не даёт доступ к камере. Наберите номер карты вручную.',
    nodecoder: 'Не удалось запустить распознавание QR-кода. Обновите страницу или наберите номер вручную.'
  };
  CAM_ERRORS.SecurityError = CAM_ERRORS.NotAllowedError;
  CAM_ERRORS.OverconstrainedError = CAM_ERRORS.NotFoundError;

  /* «HINKBERI:465480» -> «465480»; чужой код -> null. */
  function cardFromCode(text) {
    text = String(text || '').trim().toUpperCase();
    var rest = text.indexOf(RULE.qr) === 0 ? text.slice(RULE.qr.length) : '';
    return /^\d{6}$/.test(rest) ? rest : null;
  }

  function camSay(msg, warn) {
    cam.status.textContent = msg;
    cam.status.classList.toggle('is-warn', !!warn);
  }
  function camStop() {
    cam.gen++;               // ответы камеры, запрошенные раньше, больше не нужны
    cam.running = false;
    if (cam.stream) cam.stream.getTracks().forEach(function (t) { t.stop(); });
    cam.stream = null;
    cam.video.srcObject = null;
    cam.box.hidden = true;
    cam.open.hidden = false;
  }
  function camFail(name) {
    var focused = cam.box.contains(document.activeElement);
    camStop();
    show(cam.err, CAM_ERRORS[name] || 'Камера не включилась. Попробуйте ещё раз или наберите номер вручную.');
    if (focused) cam.open.focus();
  }

  /* Встроенное распознавание есть не везде; узнаём один раз. */
  function pickDetector() {
    if (cam.native !== undefined) return Promise.resolve();
    cam.native = null;
    if (!('BarcodeDetector' in window)) return Promise.resolve();
    return window.BarcodeDetector.getSupportedFormats().then(function (formats) {
      if (formats.indexOf('qr_code') >= 0) cam.native = new window.BarcodeDetector({ formats: ['qr_code'] });
    }, function () { /* остаётся jsQR */ });
  }

  function camStart() {
    if (cam.running) return;
    show(cam.err, '');
    fieldError(find.input, find.err, '');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camFail('nocam'); return; }
    var mine = ++cam.gen;
    cam.running = true;
    cam.box.hidden = false;
    cam.open.hidden = true;
    cam.close.focus();
    camSay('Включаем камеру…');
    cam.box.scrollIntoView({ block: 'nearest' });
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(function (stream) {
      if (mine !== cam.gen) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }   // закрыли, пока включалась
      cam.stream = stream;
      cam.video.srcObject = stream;
      return Promise.all([cam.video.play(), pickDetector()]).then(function () {
        if (mine !== cam.gen) return;
        if (!cam.native && !window.jsQR) { camFail('nodecoder'); return; }
        camSay('Наведите камеру на QR-код в телефоне гостя');
        requestAnimationFrame(camTick);
      });
    }).catch(function (err) {
      if (mine === cam.gen) camFail(err && err.name);
    });
  }

  function camTick(now) {
    if (!cam.running) return;
    requestAnimationFrame(camTick);
    if (cam.busy || cam.video.readyState < 2 || now - cam.last < 120) return;   // не чаще 8 кадров в секунду
    cam.last = now;
    cam.busy = true;
    var mine = cam.gen;
    readFrame().then(function (texts) {
      cam.busy = false;
      if (mine === cam.gen) camSeen(texts);
    }, function () { cam.busy = false; });
  }
  function readFrame() {
    var v = cam.video, w = v.videoWidth, h = v.videoHeight;
    if (!w || !h) return Promise.resolve([]);
    if (cam.native) {
      return cam.native.detect(v).then(function (codes) { return codes.map(function (c) { return c.rawValue; }); });
    }
    /* jsQR: середина кадра под рамкой, не больше 480 точек по стороне, чтобы и слабый телефон успевал. */
    var side = Math.round(Math.min(w, h) * 0.8), n = Math.min(480, side);
    if (!cam.ctx) cam.ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    var ctx = cam.ctx;
    if (ctx.canvas.width !== n) { ctx.canvas.width = n; ctx.canvas.height = n; }
    ctx.drawImage(v, Math.round((w - side) / 2), Math.round((h - side) / 2), side, side, 0, 0, n, n);
    var found = window.jsQR(ctx.getImageData(0, 0, n, n).data, n, n, { inversionAttempts: 'dontInvert' });
    return Promise.resolve(found ? [found.data] : []);
  }
  function camSeen(texts) {
    if (!texts.length) return;
    var no = null;
    texts.some(function (t) { no = cardFromCode(t); return !!no; });
    if (!no) {
      camSay('Это не QR-код карты ХинкБери. Попросите гостя открыть на сайте окно «Ваши баллы».', true);
      return;
    }
    if (navigator.vibrate) navigator.vibrate(40);
    camStop();
    find.input.value = no.slice(0, 3) + ' ' + no.slice(3);
    lookUp();
  }

  cam.open.addEventListener('click', camStart);
  cam.close.addEventListener('click', function () { camStop(); cam.open.focus(); });
  cam.box.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { camStop(); cam.open.focus(); }
  });
  /* Ушли со вкладки или свернули браузер: камеру выключаем, чтобы не держать её зря. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && cam.running) camStop();
  });

  /* ---------- Чек ---------- */
  function numbers() {
    var amount = parseInt(digits(check.amount.value), 10) || 0;
    var spend = parseInt(digits(check.spend.value), 10) || 0;
    return { amount: amount, spend: spend };
  }
  function maxSpend(amount) { return state.guest ? Math.min(state.guest.points, amount || state.guest.points) : 0; }

  function paintCheck() {
    var g = state.guest, on = !!g;
    check.fields.disabled = !on || state.busy;
    check.wait.hidden = on || !done.hidden;
    var n = numbers(), top = maxSpend(n.amount);
    check.max.textContent = on ? 'Все доступные: ' + group(top) : 'Все доступные';
    check.max.disabled = !on || top === 0;
    check.hint.textContent = !on ? '' : g.points === 0 ? 'На карте пока нет баллов, списать нечего.'
      : 'Можно списать до ' + pts(top) + ': не больше, чем на карте, и не больше суммы чека.';
    [].forEach.call(check.form.querySelectorAll('[data-spend]'), function (b) {
      var v = b.getAttribute('data-spend') === 'max' ? top : 0;
      var pressed = on && n.spend === v && !(v === 0 && b.getAttribute('data-spend') === 'max');
      b.classList.toggle('is-on', pressed);
      b.setAttribute('aria-pressed', String(pressed));
    });
    var spend = Math.min(n.spend, on ? g.points : 0, n.amount);
    var pay = Math.max(n.amount - spend, 0), earn = earnFor(pay);
    check.pay.textContent = rub(pay);
    check.spent.textContent = pts(spend);
    check.earn.textContent = '+' + pts(earn);
    check.after.textContent = on ? pts(g.points - spend + earn) : '…';
  }

  function only(input, max) {
    var d = digits(input.value).replace(/^0+(?=\d)/, '');
    if (d.length > max) d = d.slice(0, max);
    if (input.value !== d) input.value = d;
  }
  check.amount.addEventListener('input', function () {
    only(check.amount, 6);
    state.op = null;
    fieldError(check.amount, $('#till-amount-err'), '');
    show(check.error, '');
    paintCheck();
  });
  check.spend.addEventListener('input', function () {
    only(check.spend, 6);
    state.op = null;
    fieldError(check.spend, $('#till-spend-err'), '');
    show(check.error, '');
    paintCheck();
  });
  check.form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-spend]');
    if (!b || !state.guest) return;
    var n = numbers();
    check.spend.value = b.getAttribute('data-spend') === 'max' ? String(maxSpend(n.amount)) : '0';
    state.op = null;
    fieldError(check.spend, $('#till-spend-err'), '');
    paintCheck();
  });

  function validate(n) {
    var g = state.guest, bad = [];
    if (!n.amount) bad.push([check.amount, '#till-amount-err', 'Введите сумму чека']);
    else if (n.amount > MAX_CHECK) bad.push([check.amount, '#till-amount-err', 'Слишком большая сумма, проверьте чек']);
    if (n.spend > g.points) bad.push([check.spend, '#till-spend-err', 'На карте только ' + pts(g.points)]);
    else if (n.amount && n.spend > n.amount) bad.push([check.spend, '#till-spend-err', 'Списать можно не больше суммы чека']);
    return bad;
  }

  check.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.busy || !state.guest) return;
    var n = numbers(), g = state.guest;
    show(check.error, '');
    show(check.note, '');
    var bad = validate(n);
    if (bad.length) {
      bad.forEach(function (b) { fieldError(b[0], $(b[1]), b[2]); });
      bad[0][0].focus();
      return;
    }
    /* Одна метка на этот чек: если ответ потерялся и кассир нажмёт ещё раз, сервер не начислит дважды. */
    state.op = state.op || newOp();
    state.busy = true;
    busyBtn(check.submit, true, 'Проводим…', 'Провести чек');
    paintCheck();
    var mine = state.seq;
    U.api({ action: 'cashier_txn', token: token(), card: g.number, amount: n.amount, spend: n.spend, op: state.op })
      .then(function (r) {
        state.busy = false;
        busyBtn(check.submit, false, '', 'Провести чек');
        if (mine !== state.seq) return;
        state.last = { op: state.op, amount: n.amount, spend: n.spend };
        state.op = null;
        state.guest = r.guest;
        paintGuest(false);
        paintDone(r.done);
      }, function (er) {
        state.busy = false;
        busyBtn(check.submit, false, '', 'Провести чек');
        paintCheck();
        if (guard(er)) return;
        if (er.code !== 'network') state.op = null;
        show(check.error, say(er));
        check.submit.focus();
      });
  });

  /* ---------- Готово и отмена ---------- */
  function paintDone(d) {
    check.form.hidden = true;
    check.wait.hidden = true;
    done.hidden = false;
    done.innerHTML =
      '<h3 class="till-done-title">Чек проведён</h3>' +
      '<p class="till-done-pts">+' + group(d.earned) + ' <span>' + plural(d.earned, 'балл', 'балла', 'баллов') + '</span></p>' +
      '<p class="till-done-text">Чек ' + esc(rub(d.amount)) + ': гость платит ' + esc(rub(d.amount - d.spent)) +
        (d.spent ? ', списано ' + esc(pts(d.spent)) : '') + '. На карте теперь ' + esc(pts(d.balance)) + '.</p>' +
      '<div class="me-actions">' +
        '<button type="button" class="btn btn--green" data-next>Следующий гость</button>' +
        '<button type="button" class="btn btn--line" data-undo>Отменить чек</button>' +
      '</div>' +
      '<p class="field-hint">Ошиблись в сумме? Отменить можно в течение 15 минут, пока по карте не было новых покупок.</p>' +
      '<p class="auth-error" role="alert" data-undo-error hidden></p>';
    done.focus();
  }

  done.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) { resetGuest(); find.input.focus(); return; }
    var undo = e.target.closest('[data-undo]');
    if (!undo || state.busy || !state.last) return;
    var errEl = done.querySelector('[data-undo-error]'), last = state.last, mine = state.seq;
    show(errEl, '');
    state.busy = true;
    busyBtn(undo, true, 'Отменяем…', 'Отменить чек');
    U.api({ action: 'cashier_undo', token: token(), card: state.guest.number, op: last.op }).then(function (r) {
      state.busy = false;
      if (mine !== state.seq) return;
      state.last = null;
      state.guest = r.guest;
      paintGuest(false);
      /* Возвращаем форму с теми же числами: кассир исправляет ошибку и проводит заново. */
      done.hidden = true;
      check.form.hidden = false;
      check.amount.value = String(last.amount);
      check.spend.value = String(last.spend);
      paintCheck();
      show(check.note, 'Чек отменён, баланс вернулся: ' + pts(r.guest.points) + '. Исправьте сумму и проведите заново.');
      check.amount.focus();
    }, function (er) {
      state.busy = false;
      busyBtn(undo, false, '', 'Отменить чек');
      if (guard(er)) return;
      show(errEl, say(er));
      if (er.code === 'not_last' || er.code === 'too_late') undo.disabled = true;
    });
  });

  /* ---------- Старт ---------- */
  paintGuest(false);
  paintCheck();
  if (token()) {
    go('work');
    if (FINE) find.input.focus();
    U.api({ action: 'cashier_me', token: token() }).catch(guard);
  } else {
    go('login');
    if (FINE) login.form.elements.password.focus();
  }
})();
