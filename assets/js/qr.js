/*
  QR-код бонусной карты (07.10.2026, просьба владельца: «у каждого клиента свой QR»).
  В коде строка «HINKBERI:» и шесть цифр карты (HB.loyalty.qr в data.js); касса читает её камерой.
  Свой маленький кодировщик вместо библиотеки: для такой строки хватает буквенно-цифрового режима,
  версий 1-4 и уровня коррекции Q (код читается, даже если четверть его не видна). Рисуется прямо
  в браузере, номер карты никуда не отправляется.
  Алгоритм по стандарту QR (ISO/IEC 18004), устройство как в QR Code generator Project Nayuki.
  Проверено декодером jsQR на тысячах номеров карт и по контрольным таблицам стандарта.

  HBQR.svg(text) -> разметка <svg>: тёмные модули цвета currentColor на белом квадрате с полем 4 модуля.
  HBQR.encode(text) -> { version, size, mask, modules[y][x] } для проверок.
*/
(function () {
  'use strict';
  var ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  /* Уровень Q, версии 1-4: [кодовых слов всего, слов коррекции в блоке, блоков] и центры выравнивающих узоров. */
  var TABLE = [null, [26, 13, 1], [44, 22, 1], [70, 18, 2], [100, 26, 2]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26]];
  var LEVEL_Q = 3;   // два бита уровня в служебной строке

  /* ---------- Рида-Соломона над GF(256), многочлен 0x11D ---------- */
  function mul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function divisor(degree) {
    var r = [], root = 1, i, j;
    for (i = 0; i < degree - 1; i++) r.push(0);
    r.push(1);
    for (i = 0; i < degree; i++) {
      for (j = 0; j < r.length; j++) {
        r[j] = mul(r[j], root);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      root = mul(root, 2);
    }
    return r;
  }
  function remainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift();
      r.push(0);
      div.forEach(function (c, i) { r[i] ^= mul(c, f); });
    });
    return r;
  }

  /* ---------- Данные: буквенно-цифровой режим, добивка, коррекция, чередование блоков ---------- */
  function codewords(text) {
    var bits = [], i, k;
    function put(v, n) { for (var b = n - 1; b >= 0; b--) bits.push((v >>> b) & 1); }
    for (i = 0; i < text.length; i++) {
      if (ALNUM.indexOf(text.charAt(i)) < 0) throw new Error('QR: допустимы только цифры, A-Z и « $%*+-./:»');
    }
    put(2, 4);              // режим 0010: буквы и цифры
    put(text.length, 9);    // длина, 9 бит для версий 1-9
    for (i = 0; i + 1 < text.length; i += 2) put(ALNUM.indexOf(text.charAt(i)) * 45 + ALNUM.indexOf(text.charAt(i + 1)), 11);
    if (text.length % 2) put(ALNUM.indexOf(text.charAt(text.length - 1)), 6);

    var ver = 1;
    while (ver <= 4 && bits.length > (TABLE[ver][0] - TABLE[ver][1] * TABLE[ver][2]) * 8) ver++;
    if (ver > 4) throw new Error('QR: слишком длинная строка');
    var t = TABLE[ver], cap = (t[0] - t[1] * t[2]) * 8;
    put(0, Math.min(4, cap - bits.length));    // конец данных
    put(0, (8 - bits.length % 8) % 8);          // до целого байта
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);

    var data = [];
    for (i = 0; i < bits.length; i += 8) {
      var byte = 0;
      for (k = 0; k < 8; k++) byte = (byte << 1) | bits[i + k];
      data.push(byte);
    }
    /* В версиях 1-4 уровня Q блоки одной длины, поэтому чередование простое. */
    var per = t[0] / t[2] - t[1], div = divisor(t[1]), blocks = [], words = [];
    for (i = 0; i < t[2]; i++) {
      var dat = data.slice(i * per, (i + 1) * per);
      blocks.push(dat.concat(remainder(dat, div)));
    }
    for (i = 0; i < blocks[0].length; i++) blocks.forEach(function (b) { words.push(b[i]); });
    return { version: ver, words: words };
  }

  /* ---------- Матрица ---------- */
  function encode(text) {
    text = String(text).toUpperCase();
    var cw = codewords(text), ver = cw.version, size = ver * 4 + 17;
    var m = [], fn = [], x, y, i, j, dx, dy;
    for (y = 0; y < size; y++) {
      m.push([]);
      fn.push([]);
      for (x = 0; x < size; x++) { m[y].push(false); fn[y].push(false); }
    }
    function set(cx, cy, dark) { m[cy][cx] = dark; fn[cy][cx] = true; }

    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }   // полосы синхронизации
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {                     // три искателя с рамкой
      for (var ry = -4; ry <= 4; ry++) {
        for (var rx = -4; rx <= 4; rx++) {
          var px = c[0] + rx, py = c[1] + ry, d = Math.max(Math.abs(rx), Math.abs(ry));
          if (px >= 0 && px < size && py >= 0 && py < size) set(px, py, d !== 2 && d !== 4);
        }
      }
    });
    var al = ALIGN[ver], last = al.length - 1;
    for (i = 0; i < al.length; i++) {
      for (j = 0; j < al.length; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
        for (dy = -2; dy <= 2; dy++) {
          for (dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
    function format(mask) {   // 15 бит: уровень и маска, код БЧХ (0x537), XOR 0x5412; две копии и тёмный модуль
      var d = (LEVEL_Q << 3) | mask, r = d, k;
      for (k = 0; k < 10; k++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var b = ((d << 10) | r) ^ 0x5412;
      function bit(n) { return ((b >>> n) & 1) !== 0; }
      for (k = 0; k <= 5; k++) set(8, k, bit(k));
      set(8, 7, bit(6));
      set(8, 8, bit(7));
      set(7, 8, bit(8));
      for (k = 9; k < 15; k++) set(14 - k, 8, bit(k));
      for (k = 0; k < 8; k++) set(size - 1 - k, 8, bit(k));
      for (k = 8; k < 15; k++) set(8, size - 15 + k, bit(k));
      set(8, size - 8, true);
      return b;
    }
    format(0);   // занять служебные места до раскладки данных

    var n = 0, total = cw.words.length * 8;   // раскладка змейкой по парам столбцов снизу вверх и обратно
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var v = 0; v < size; v++) {
        for (j = 0; j < 2; j++) {
          x = right - j;
          y = ((right + 1) & 2) === 0 ? size - 1 - v : v;
          if (!fn[y][x] && n < total) {
            m[y][x] = ((cw.words[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0;
            n++;
          }
        }
      }
    }

    function masked(k, cx, cy) {
      switch (k) {
        case 0: return (cx + cy) % 2 === 0;
        case 1: return cy % 2 === 0;
        case 2: return cx % 3 === 0;
        case 3: return (cx + cy) % 3 === 0;
        case 4: return (Math.floor(cx / 3) + Math.floor(cy / 2)) % 2 === 0;
        case 5: return cx * cy % 2 + cx * cy % 3 === 0;
        case 6: return (cx * cy % 2 + cx * cy % 3) % 2 === 0;
        default: return ((cx + cy) % 2 + cx * cy % 3) % 2 === 0;
      }
    }
    function flip(k) {
      for (var fy = 0; fy < size; fy++) {
        for (var fx = 0; fx < size; fx++) if (!fn[fy][fx] && masked(k, fx, fy)) m[fy][fx] = !m[fy][fx];
      }
    }
    /* Штраф за неудобные для камеры узоры (правила стандарта N1-N4): из восьми масок берём лучшую. */
    function penalty() {
      var s = 0, dark = 0, a, b;
      function line(get) {
        var run = 1, str = '';
        for (var p = 0; p < size; p++) {
          str += get(p) ? '1' : '0';
          if (p > 0 && get(p) === get(p - 1)) {
            run++;
            s += run === 5 ? 3 : run > 5 ? 1 : 0;
          } else run = 1;
        }
        str = '0000' + str + '0000';
        ['10111010000', '00001011101'].forEach(function (pat) {
          for (var at = str.indexOf(pat); at >= 0; at = str.indexOf(pat, at + 1)) s += 40;
        });
      }
      for (a = 0; a < size; a++) {
        line(function (p) { return m[a][p]; });
        line(function (p) { return m[p][a]; });
      }
      for (a = 0; a < size; a++) {
        for (b = 0; b < size; b++) {
          if (m[a][b]) dark++;
          if (a + 1 < size && b + 1 < size && m[a][b] === m[a][b + 1] && m[a][b] === m[a + 1][b] && m[a][b] === m[a + 1][b + 1]) s += 3;
        }
      }
      return s + (Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1) * 10;
    }
    var best = 0, bestScore = Infinity;
    for (var k = 0; k < 8; k++) {
      flip(k);
      format(k);
      var score = penalty();
      if (score < bestScore) { best = k; bestScore = score; }
      flip(k);   // повторный XOR снимает маску
    }
    flip(best);
    var formatBits = format(best);
    return { version: ver, size: size, mask: best, format: formatBits, words: cw.words, modules: m };
  }

  function svg(text, label) {
    var q = encode(text), quiet = 4, n = q.size + quiet * 2, d = '';
    for (var y = 0; y < q.size; y++) {
      for (var x = 0; x < q.size; x++) {
        if (!q.modules[y][x]) continue;
        var run = 1;
        while (x + run < q.size && q.modules[y][x + run]) run++;
        d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h' + run + 'v1h-' + run + 'z';
        x += run - 1;
      }
    }
    return '<svg class="qr" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="' +
      String(label || 'QR-код').replace(/"/g, '&quot;') + '"><rect width="' + n + '" height="' + n + '" fill="#fff"/>' +
      '<path fill="currentColor" d="' + d + '"/></svg>';
  }

  window.HBQR = { encode: encode, svg: svg };
})();
