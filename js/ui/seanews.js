/* 항해 중에 들려오는 소식 (G.SeaNews)
   예전에는 「세상의 소식」 창이 화면 한가운데에 떠서 바다를 어둡게 덮고, 확인을 누를 때까지 항해가 멈췄다.
   이제 항해 중에는 오른쪽 위 작은 두루마리에 쌓였다가 저절로 사라진다 (배는 계속 간다).
   · 마우스를 올리면 사라지지 않고 기다린다. 누르거나 ✕를 누르면 바로 닫힌다.
   · 같은 때에 들어온 소식이 많으면 최근 것 몇 개만 보이고 「+n건」으로 줄인다 (일지에는 모두 남는다).
   · 항해 중에는 알림(토스트)도 작고 적게 — 배가 가려지지 않게 (#ui.at-sea, css/style.css).
   조정값 G.FX.seaNews */
(function (G) {
  'use strict';
  var U = G.U;
  var N = G.SeaNews = {};
  G.FX = G.FX || {};
  G.FX.seaNews = G.FX.seaNews || { ms: 8000, perItem: 2200, max: 3, toastMax: 3 };
  function cfg() { return G.FX.seaNews; }
  var box = null, list = null, timer = null, hold = false, items = [], extra = 0;

  /** 바다 장면에 들어오고 나갈 때 (sea.js SEA.enter / SEA.exit) */
  N.on = function (on) {
    var root = document.getElementById('ui');
    if (root) root.classList.toggle('at-sea', !!on);
    if (!on) N.clear();
  };
  N.clear = function () {
    if (timer) { clearTimeout(timer); timer = null; }
    if (box && box.parentNode) box.parentNode.removeChild(box);
    box = null; items = []; extra = 0; hold = false;
  };
  function close() {
    if (!box) return;
    var b = box; box = null;
    b.classList.add('out');
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 450);
    if (timer) { clearTimeout(timer); timer = null; }
    items = []; extra = 0; hold = false;
  }
  function arm() {
    if (timer) clearTimeout(timer);
    var c = cfg();
    timer = setTimeout(function () { if (hold) arm(); else close(); }, (c.ms || 8000) + Math.min(items.length, c.max || 3) * (c.perItem || 2200));
  }
  function draw() {
    var c = cfg(), max = c.max || 3, shown = items.slice(-max), more = extra + Math.max(0, items.length - max);
    list.innerHTML = shown.map(function (m) {
      return '<div class="sn-item">' + G.icon(m.icon || 'scroll') + '<div>' + U.esc(m.text) + '</div></div>';
    }).join('') + (more > 0 ? '<div class="sn-more">+ ' + more + '건 더 (일지에서 볼 수 있습니다)</div>' : '');
  }
  /** 소식을 보여 준다 — 기다리지 않는다 */
  N.show = function (news) {
    if (!news || !news.length) return;
    var root = document.getElementById('ui'); if (!root) return;
    if (!box) {
      box = U.el('div', 'sea-news wood brass-frame', '<div class="sn-head">' + G.icon('scroll') + '<span>세상의 소식</span><span class="sn-x" title="닫기">✕</span></div><div class="sn-list"></div>');
      list = box.querySelector('.sn-list');
      box.addEventListener('mouseenter', function () { hold = true; });
      box.addEventListener('mouseleave', function () { hold = false; });
      box.addEventListener('click', function (e) { e.stopPropagation(); close(); });
      root.appendChild(box);
    }
    news.forEach(function (m) { items.push(m); });
    var keep = (cfg().max || 3) * 3;
    if (items.length > keep) { extra += items.length - keep; items = items.slice(-keep); }
    draw();
    arm();
  };
})(window.G = window.G || {});
