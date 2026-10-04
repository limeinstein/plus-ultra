/* 신기루 — 게임의 시대(1480~1600년)를 넘어 세워질 발견물 (G.Mirage)
   · 불가사의 가운데 세운 해(built)가 1600년보다 뒤인 것은 1600년부터 소문·책·망루에 오르기 시작한다.
   · 아직 세워지기 전에 그 자리에 가면 발견 대신 「신기루」가 보인다: 흐릿하게 일렁이며 떠올랐다가 이내 사라진다.
     처음 보면 일지에 적고 명성이 조금 오르며(fame), 그 뒤로는 again일마다 한 번씩만 다시 나타난다.
   · 세운 해가 되면 여느 발견물처럼 찾을 수 있다.
   조정값 G.BALANCE.mirage — from: 이 해부터 신기루가 보인다, after: 이 해보다 뒤에 세워지는 것만, again: 다시 보이는 간격(일),
   fame: 처음 볼 때 명성, show: 떠 있는 시간(초) */
(function (G) {
  'use strict';
  var U = G.U;
  var M = {};
  G.Mirage = M;
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.mirage = G.BALANCE.mirage || { from: 1600, after: 1600, again: 45, fame: 12, show: 7 };
  function cfg() { return G.BALANCE.mirage; }
  function S() { return G.Game.state; }

  /** 아직 세워지지 않았지만 신기루로 보이는 때인가 */
  M.active = function (d) {
    var s = S(), c = cfg();
    if (!d || !d.built || !s) return false;
    var y = s.date.y;
    return d.built > (c.after || 1600) && y >= (c.from || 1600) && y < d.built;
  };
  /** 아직 세워지지 않아 아무것도 없는가 (신기루 때도 아닌) — 단서·발견 모두 막힌다 */
  M.hidden = function (d) {
    var s = S();
    return !!(d && d.built && s && s.date.y < d.built && !M.active(d));
  };
  M.seen = function (id) { var s = S(); return !!(s && s.mirage && s.mirage[id]); };

  var showing = null, queue = [];
  /** 그 자리에 닿았을 때 (discovery.js의 checkSea/checkLand/checkCity) */
  M.see = function (d) {
    var s = S(), c = cfg();
    if (!M.active(d)) return false;
    if (showing) { if (queue.indexOf(d) < 0 && queue.length < 4) queue.push(d); return false; }   // 한 번에 하나씩 — 끝나면 이어서
    s.mirage = s.mirage || {};
    var m = s.mirage[d.id];
    if (m && s.day - m.last < (c.again || 45)) return false;
    var first = !m;
    m = s.mirage[d.id] = m || { first: U.dateNum(s.date), n: 0 };
    m.n++; m.last = s.day;
    if (first) {
      G.Fame.add('ex', c.fame || 0);
      if (G.Disc && !s.hints[d.id]) s.hints[d.id] = { src: 'mirage', d: U.dateNum(s.date) };
      G.State.log('신기루를 보았다 — 「' + d.name + '」. 아직 세상에 없는 것이 잠시 떠올랐다가 사라졌다.');
    }
    M.show(d, first);
    return true;
  };

  /** 신기루 그림: 마지막 장면(discovery-ends) 또는 발견물 그림을 일렁이게 띄웠다가 흩어지게 한다 */
  M.show = function (d, first) {
    var root = document.getElementById('ui'); if (!root) return;
    var c = cfg(), ms = Math.round((c.show || 7) * 1000);
    var el = U.el('div', 'mirage');
    el.style.setProperty('--mirage-ms', ms + 'ms');
    var pic = U.el('div', 'mirage-pic');
    var key = G.Img && (G.Img.file('discovery-ends/' + d.id) ? 'discovery-ends/' + d.id : G.Img.pick(G.Img.chain.discovery(d)));
    var src = key && G.Img.src(key);
    if (src) { var im = new Image(); im.src = src; im.alt = d.name; pic.appendChild(im); }
    else if (G.Art && G.Art.discoveryArt) { try { pic.appendChild(G.Art.discoveryArt(d, 720, 320)); } catch (e) { /* 그림이 없으면 글만 */ } }
    el.appendChild(pic);
    el.appendChild(U.el('div', 'mirage-cap',
      '<b>신기루</b> — ' + U.esc(d.name) + '<small>' + (first ? '아직 세상에 없는 것이 잠시 떠올랐다가 흩어진다. 이 땅에 이것이 서는 것은 먼 훗날의 일이다.' : '또 그 신기루가 일렁이다 사라진다.') + '</small>'));
    root.appendChild(el);
    showing = el;
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (showing === el) showing = null;
      var nx = queue.shift(); if (nx) M.see(nx);
    }, ms + 200);
    if (UI()) UI().toast('신기루 — 「' + d.name + '」' + (first ? ' (명성 +' + (c.fame || 0) + ')' : ''), 'eye', 4200);
  };
  function UI() { return G.UI; }
})(window.G = window.G || {});
