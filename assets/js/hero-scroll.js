/* Transparent square frames. Scroll remains native; only the artwork is eased. */
(function () {
  'use strict';
  window.HBScrollBurger = function (opts) {
    var canvas = opts.canvas, section = opts.section, ctx = canvas.getContext('2d');
    var total = 105, last = total - 1, intro = 6;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var small = window.innerWidth < 900 || (navigator.connection && navigator.connection.saveData);
    var base = opts.base + (small ? 'sm/' : 'lg/');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var frames = {}, pending = {}, used = {}, queue = [], active = 0, clock = 0;
    var current = 3, target = 3, raf = 0, previous = 0, visible = true, introStart = 0;
    var introDone = reduce.matches, lastPaint = -1;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function request(i, first) {
      i = clamp(Math.round(i), 0, last);
      if (frames[i]) return;
      if (pending[i]) {
        if (first && queue.indexOf(i) >= 0) { queue.splice(queue.indexOf(i), 1); queue.unshift(i); }
        return;
      }
      pending[i] = true; if (first) queue.unshift(i); else queue.push(i); pump();
    }
    function evict() {
      var keys = Object.keys(frames);
      while (keys.length > 28) {
        keys.sort(function (a, b) { return used[a] - used[b]; });
        var key = keys.shift(); delete frames[key]; delete used[key];
      }
    }
    function pump() {
      while (active < 3 && queue.length) (function (i) {
        active++;
        var im = new Image(); im.decoding = 'async';
        im.onload = function () {
          frames[i] = im; used[i] = ++clock; delete pending[i]; active--; evict();
          lastPaint = -1; wake(); pump();
        };
        im.onerror = function () { delete pending[i]; active--; pump(); };
        im.src = base + 'f' + String(i + 1).padStart(3, '0') + (i < 20 ? '-clean' : '') + '.webp';
      })(queue.shift());
    }
    function near(i) {
      var best = -1, distance = Infinity;
      Object.keys(frames).forEach(function (key) { var d = Math.abs(key - i); if (d < distance) { distance = d; best = +key; } });
      return best;
    }
    function draw() {
      var frame = near(Math.round(current));
      if (frame < 0 || frame === lastPaint) return;
      lastPaint = frame;
      var side = Math.min(canvas.width, canvas.height);
      var x = (canvas.width - side) / 2, y = (canvas.height - side) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(frames[frame], x, y, side, side); used[frame] = ++clock;
    }
    function size() {
      var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      lastPaint = -1; draw(); wake();
    }
    function progress() {
      return clamp(-section.getBoundingClientRect().top / Math.max(1, section.offsetHeight - window.innerHeight), 0, 1);
    }
    function neighbourhood(i) {
      request(i, true);
      for (var d = 1; d <= 5; d++) { request(i + d); request(i - d); }
      // Drop distant queued work during a fast swipe; in-flight requests can finish.
      queue = queue.filter(function (n) { if (Math.abs(n - i) <= 14 || n % 13 === 0) return true; delete pending[n]; return false; });
    }
    function tick(now) {
      raf = 0;
      if (!visible || document.hidden) { previous = 0; return; }
      var dt = previous ? Math.min(now - previous, 50) : 16.7; previous = now;
      var p = progress();
      target = reduce.matches ? last : intro + p * (last - intro);
      if (!introDone && !reduce.matches) {
        if (!introStart) introStart = now;
        var t = clamp((now - introStart) / 900, 0, 1);
        if (p < .002) target = 3 + (intro - 3) * (1 - Math.pow(1 - t, 3));
        introDone = t >= 1 || p >= .002;
      }
      current = reduce.matches ? last : current + (target - current) * (1 - Math.exp(-dt / 95));
      if (Math.abs(target - current) < .015) current = target;
      if (reduce.matches) request(last, true); else neighbourhood(Math.round(current));
      draw();
      if (!introDone || Math.abs(target - current) > .015) wake(); else previous = 0;
    }
    function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); }
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', wake);
    if (reduce.addEventListener) reduce.addEventListener('change', function () { introDone = true; lastPaint = -1; wake(); });
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible) wake(); }).observe(section);
    if (reduce.matches) { current = last; request(last, true); }
    else { request(3, true); for (var n = 0; n < total; n += 13) request(n); }
    size(); wake();
  };
})();
