/* ============================================================
   SITE.JS — theme switch, language switch, and the visual-novel
   dialog on the homepage. Pages work without it.
   ============================================================ */
(function () {
  var html = document.documentElement;

  // 白天 / 夜间：记住选择，没选过就跟着系统
  var themeBtn = document.getElementById('theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('kn-theme', next); } catch (e) {}
    });
  }

  // 切换语言时记住选择，下次直接进对应的版本
  document.querySelectorAll('[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('kn-lang', a.getAttribute('data-lang')); } catch (e) {}
    });
  });

  // 首页的对话框：一行一行打字，最后一行出选项
  var data = document.getElementById('vn-lines');
  var el = document.getElementById('line');
  if (!data || !el) return;
  var lines = JSON.parse(data.textContent);
  var next = document.getElementById('next');
  var choices = document.getElementById('choices');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0, typing = null;

  function done(n) {
    if (n === lines.length - 1) { next.style.visibility = 'hidden'; choices.classList.add('show'); }
  }
  function stop() { clearInterval(typing); typing = null; }
  function show(n) {
    stop();
    var text = lines[n], k = 0;
    if (reduce) { el.textContent = text; done(n); return; }
    el.textContent = '';
    typing = setInterval(function () {
      el.textContent = text.slice(0, ++k);
      if (k >= text.length) { stop(); done(n); }
    }, 36);
  }
  function advance() {
    if (typing) { stop(); el.textContent = lines[i]; done(i); return; }
    if (i < lines.length - 1) show(++i);
  }
  function skip() { stop(); i = lines.length - 1; el.textContent = lines[i]; done(i); }

  document.getElementById('box').addEventListener('click', function (e) {
    if (!e.target.closest('button, a')) advance();
  });
  document.getElementById('box').addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'box') { e.preventDefault(); advance(); }
  });
  document.getElementById('skip').addEventListener('click', skip);
  document.getElementById('log').addEventListener('click', function () {
    stop();
    el.textContent = '';
    lines.forEach(function (t, n) {
      if (n) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(t));
    });
    done(lines.length - 1);
  });

  // ?end 直接跳到最后一行（从别的页面回来时不用再看一遍）
  if (/[?&]end\b/.test(location.search) || location.hash) skip(); else show(0);
})();
