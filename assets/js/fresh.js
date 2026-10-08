/*
  Свежая страница сразу после выкладки (08.10.2026).
  Хостинг (GitHub Pages) разрешает браузеру 10 минут держать страницу в памяти. Поэтому сразу после
  выкладки телефон мог показывать старую страницу, пока её не обновят вручную, и владелец видел
  «ничего не поменялось». Теперь страница сверяет свою сборку (meta hb-build, её ставит stamp.py при
  каждой выкладке) с файлом /version.json, который берётся мимо памяти браузера. Не совпало: один раз
  открываем ту же страницу по адресу с меткой ?fresh=, которой нет в памяти, и сразу убираем метку
  из адреса. Второй раз за один заход не перезагружаем, поэтому зациклиться нельзя.
*/
(function () {
  'use strict';
  /* Метка ?fresh= нужна только чтобы обойти память браузера: из адреса её убираем. */
  if (/[?&]fresh=/.test(location.search)) {
    var rest = location.search.replace(/([?&])fresh=[^&]*&?/, '$1').replace(/[?&]$/, '');
    try { history.replaceState(history.state, '', location.pathname + rest + location.hash); } catch (e) { /* адрес оставляем как есть */ }
  }

  var meta = document.querySelector('meta[name="hb-build"]');
  if (!meta || !meta.content || !/^https?:$/.test(location.protocol) || !window.fetch) return;
  fetch('/version.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (v) {
      if (!v || !v.build || v.build === meta.content) return;
      try {
        if (sessionStorage.getItem('hb-fresh') === v.build) return;   // уже обновляли ради этой сборки
        sessionStorage.setItem('hb-fresh', v.build);
      } catch (e) { return; }                                          // без памяти вкладки не рискуем
      location.replace(location.pathname + location.search + (location.search ? '&' : '?') + 'fresh=' + v.build + location.hash);
    })
    .catch(function () { /* нет связи: остаёмся на том, что есть */ });
})();
