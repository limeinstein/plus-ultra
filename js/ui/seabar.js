/* 항해·육상 하단의 공통 양피지 명령판·황동 배속 다이얼. 원래 단추와 배속 처리를 유지한다. */
(function (G) {
  'use strict';
  var B = G.SeaBar = {}, watching = false;
  var NS = 'http://www.w3.org/2000/svg';
  function point(r, deg) { var a = deg * Math.PI / 180; return [160 + r * Math.cos(a), 160 - r * Math.sin(a)]; }
  function xy(p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }
  function sector(index) {
    var a = 180 - index * 45, b = a - 45;
    return 'M' + xy(point(139, a)) + 'A139,139 0 0 1 ' + xy(point(139, b)) + 'L' + xy(point(76, b)) + 'A76,76 0 0 0 ' + xy(point(76, a)) + 'Z';
  }
  function hitArea(index) {
    var a = 180 - index * 45, b = a - 45, pts = [point(76, a)];
    for (var d = a; d >= b; d -= 5) pts.push(point(146, d));
    pts.push(point(146, b), point(76, b));
    return 'polygon(' + pts.map(function (p) { return (p[0] / 320 * 100).toFixed(3) + '% ' + (p[1] / 170 * 100).toFixed(3) + '%'; }).join(',') + ')';
  }
  function dialArt() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 320 170'); svg.setAttribute('class', 'sb-dial-art'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><linearGradient id="sb-gold" x2="0" y2="1"><stop stop-color="#fce3a0"/><stop offset=".35" stop-color="#a6752e"/><stop offset=".66" stop-color="#e8c87c"/><stop offset="1" stop-color="#8a5b26"/></linearGradient><linearGradient id="sb-paper" x2="0" y2="1"><stop stop-color="#fff3d5"/><stop offset="1" stop-color="#e6cf9f"/></linearGradient><radialGradient id="sb-hub"><stop stop-color="#866135"/><stop offset="1" stop-color="#3d2b18"/></radialGradient></defs>' +
      '<path d="M5 165V160A155 155 0 0 1 315 160V165Z" fill="url(#sb-gold)" stroke="#493017" stroke-width="4"/>' +
      '<path d="M12 160A148 148 0 0 1 308 160" fill="none" stroke="#ffe9b4" stroke-width="1.5"/>' +
      '<path d="M18 160A142 142 0 0 1 302 160Z" fill="#604521" stroke="#684518" stroke-width="2"/>' +
      [0, 1, 2, 3].map(function (i) { return '<path class="sb-segment" data-segment="' + i + '" d="' + sector(i) + '" fill="url(#sb-paper)" stroke="#9b7942" stroke-width="1.5"/>'; }).join('') +
      '<path d="M85 160A75 75 0 0 1 235 160Z" fill="url(#sb-hub)" stroke="#b58b48" stroke-width="2"/>' +
      [175, 155, 135, 115, 95, 75, 55, 35, 15, 5].map(function (d) { var p = point(149, d); return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="#795127" stroke="#f5d591" stroke-width=".7"/>'; }).join('') +
      '<g class="sb-needle"><path d="M155 160L157 102L151 110L160 76L169 110L163 102L165 160Z" fill="url(#sb-gold)" stroke="#493017" stroke-width="1.4"/></g>' +
      '<circle cx="160" cy="160" r="9" fill="url(#sb-gold)" stroke="#513318" stroke-width="2"/><circle cx="160" cy="160" r="4" fill="#b58641"/>' +
      '<path d="M7 166H313" stroke="#ffe5a9" stroke-width="2"/>';
    return svg;
  }
  B.sync = function (bar) {
    if (!bar || !bar.classList.contains('travel-command-bridge')) return;
    var sp = bar.querySelector('.speedctl'), opts = sp.querySelectorAll('.opt'), chosen = 0;
    [].forEach.call(opts, function (o, i) { var on = o.classList.contains('on'); o.setAttribute('aria-pressed', String(on)); if (on) chosen = i; });
    [].forEach.call(sp.querySelectorAll('.sb-segment'), function (p, i) { p.classList.toggle('on', i === chosen); });
    sp.querySelector('.sb-needle').setAttribute('transform', 'rotate(' + (-67.5 + chosen * 45) + ' 160 160)');
    sp.dataset.selected = opts[chosen].dataset.speed;
  };
  B.refresh = function (bar) {
    if (!bar || !bar.classList.contains('travel-command-bridge')) return;
    [].forEach.call(bar.querySelectorAll('.sb-wing .btn'), function (b) {
      var off = b.classList.contains('disabled');
      // 기존 장면 단축키는 누를 수 없는 이유도 알려 준다. 원래 onclick은 유지하고 초점 이동에서만 뺀다.
      b.tabIndex = off ? -1 : 0;
      if (b.getAttribute('aria-disabled') !== String(off)) b.setAttribute('aria-disabled', String(off));
    });
  };
  B.fit = function (bar) {
    if (!bar || !bar.isConnected || !bar.classList.contains('travel-command-bridge')) return;
    var follow = bar.querySelector('.btn.follow');
    // 따라가기 단추는 상태가 바뀔 때 기존 코드가 아이콘을 다시 만든다. 글 이름도 함께 복구한다.
    if (follow && !follow.querySelector('.sb-follow-label')) follow.appendChild(G.U.el('span', 'sb-follow-label', G.T ? G.T('따라가기') : '따라가기'));
    var f = G.FX.seaCommandBar, width = bar.parentNode.clientWidth, sig = width + '|' + (document.fonts ? document.fonts.status : '');
    if (bar._sbFit === sig) return;
    bar._sbFit = sig;
    var compact = width < f.compactAt, dw = compact ? f.compactDialWidth : f.dialWidth;
    var text = bar.classList.contains('land-command-bridge') ? G.FX.landCommandBar : f;
    bar.classList.toggle('sb-compact', compact);
    var vars = { margin: f.margin, bottom: f.bottom, dial: dw, height: dw * 170 / 320, wing: compact ? f.compactWingHeight : f.wingHeight, font: compact ? text.compactFont : text.font };
    Object.keys(vars).forEach(function (k) { bar.style.setProperty('--sb-' + k, vars[k] + 'px'); });
    // 글씨 크기 변경 뒤에도 해도·바람 판이 다이얼 뒤로 가리지 않게 다시 놓는다.
    if (G.HudPin) G.HudPin.fit();
  };
  B.mount = function (bar, h, options) {
    if (bar.classList.contains('travel-command-bridge')) return;
    options = options || {};
    var land = options.scene === 'land', name = land ? '탐험' : '항해';
    var U = G.U, sp = bar.querySelector('.speedctl'), left = U.el('div', 'sb-wing sb-left'), right = U.el('div', 'sb-wing sb-right');
    bar.classList.remove('wood', 'brass-frame'); bar.classList.add('travel-command-bridge', land ? 'land-command-bridge' : 'sea-command-bridge');
    bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', name + ' 명령');
    var actions = land ? [['pause', h.pause], ['back', h.back], ['city', h.city], ['camp', h.camp], ['apostles', h.apostles], ['chart', h.chart], ['notebook', h.notebook], ['follow', h.follow], ['zoom', h.zoom], ['settings', h.settings]] :
      [['pause', h.pause], ['search', h.search], ['port', h.port], ['land', h.land], ['fish', h.fish], ['rain', h.rain], ['chart', h.chart], ['notebook', h.notebook], ['follow', h.follow], ['settings', h.settings]];
    actions.forEach(function (a, i) {
      if (!a[1]) return;
      if (a[1].tagName === 'BUTTON') a[1].type = 'button';
      a[1].dataset[land ? 'landAction' : 'seaAction'] = a[0]; (i < 5 ? left : right).appendChild(a[1]);
    });
    left.style.setProperty('--sb-count', left.children.length); right.style.setProperty('--sb-count', right.children.length);
    var gear = h.settings.querySelector('svg');
    if (gear) gear.innerHTML = '<path d="M9 3l.5-1h5l.5 3 2 .9 2.5-1 2 3.4-2 2 .1 2.4 2 2-2 3.5-2.7-1-2 1L14 22h-4l-.5-2.8-2-1-2.6 1-2-3.5 2-2v-2.4l-2-2 2-3.4 2.6 1 2-.9z"/><circle cx="12" cy="12" r="3.4"/>';
    sp.setAttribute('role', 'group'); sp.setAttribute('aria-label', name + ' 배속'); sp.classList.add('sb-speed-dial');
    [].forEach.call(sp.querySelectorAll('.opt'), function (o, i) {
      var label = U.el('span', 'sb-speed-value'); label.textContent = o.textContent;
      var p = point(108, 157.5 - i * 45);
      label.style.left = p[0] / 320 * 100 + '%'; label.style.top = p[1] / 170 * 100 + '%';
      o.replaceChildren(label); o.style.clipPath = hitArea(i); o.setAttribute('aria-label', name + ' 배속 ' + o.textContent);
    });
    sp.insertBefore(dialArt(), sp.firstChild); bar.replaceChildren(left, sp, right);
    bar.addEventListener('keydown', function (e) {
      var b = e.target.closest('button'); if (!b || !bar.contains(b)) return;
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat && !b.classList.contains('disabled')) b.click(); return; }
      var bs = [].filter.call(bar.querySelectorAll('button'), function (x) { return !x.classList.contains('disabled') && !x.disabled; }), i = bs.indexOf(b), n = e.key === 'ArrowRight' ? (i + 1) % bs.length : e.key === 'ArrowLeft' ? (i + bs.length - 1) % bs.length : e.key === 'Home' ? 0 : e.key === 'End' ? bs.length - 1 : -1;
      if (n >= 0) { e.preventDefault(); e.stopPropagation(); bs[n].focus(); }
    });
    B.fit(bar); B.sync(bar); B.refresh(bar);
    if (!watching) {
      watching = true;
      var fitCurrent = function () { B.fit(document.querySelector('.travel-command-bridge')); };
      if (window.ResizeObserver) new ResizeObserver(fitCurrent).observe(document.getElementById('ui')); else window.addEventListener('resize', fitCurrent);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitCurrent);
    }
  };
})(window.G = window.G || {});
