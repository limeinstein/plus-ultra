/* 신기루 — 게임의 시대(1480~1600년)를 넘어 세워질 발견물 (G.Mirage)
   · 불가사의 가운데 세운 해(built)가 1600년보다 뒤인 것은 1600년부터 소문·책·망루에 오르기 시작한다.
   · 아직 세워지기 전에 그 자리에 가면 발견 대신 「신기루」가 보인다: 흐릿하게 일렁이며 떠올랐다가 이내 사라진다.
     처음 보면 일지에 적고 명성이 조금 오르며(fame), 그 뒤로는 again일마다 한 번씩만 다시 나타난다.
   · 세운 해가 되면 여느 발견물처럼 찾을 수 있다.
   조정값 G.BALANCE.mirage — from: 이 해부터 신기루가 보인다, after: 이 해보다 뒤에 세워지는 것만, again: 다시 보이는 간격(일),
   fame: 처음 볼 때 명성, show: 떠 있는 시간(초)
   · 미래의 건물 (2026-10-18): 세운 해가 future(1800)년 이후인 건물은 그 자리·그 도시에 가면 언제든 「신기루로 본 발견」으로 끝난다
     (js/systems/discovery.js D.isFuture·D.mirageNow). 명성·가치는 futureK만 (거리·위치에 비해 적게), 유물은 없다.
     발견 카드를 닫으면 그 신기루가 흩어져 사라지는 장면(M.vanish, vanish초)이 이어진다. */
(function (G) {
  'use strict';
  var U = G.U;
  var M = {};
  G.Mirage = M;
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.mirage = G.BALANCE.mirage || { from: 1600, after: 1600, again: 45, fame: 12, show: 7, future: 1800, futureK: 0.2, vanish: 3.2 };
  function cfg() { return G.BALANCE.mirage; }
  function S() { return G.Game.state; }

  /** 새 신기루는 발견 위치에 맞는 외관을 쓴다. 없는 그림은 기존 끝 장면으로 돌아간다. */
  M.exteriorKey = function (d) {
    if (!d || !G.Img) return null;
    if (d.mirage50) {
      var key = (d.how === 'city' ? 'landmarks/' : 'map-discoveries/mirage/') + d.id;
      if (G.Img.file(key)) return key;
    }
    return G.Img.file('discovery-ends/' + d.id) ? 'discovery-ends/' + d.id : G.Img.pick(G.Img.chain.discovery(d));
  };
  var mapFades = {};
  function trackMap(d, ms) {
    if (!d.mirage50 || d.how === 'city') return;
    mapFades[d.id] = { at: performance.now(), ms: ms };
    if (G.DiscoveryIcon) G.DiscoveryIcon.preload([d]);
  }
  M.mapAlpha = function (d) {
    var item = d && mapFades[d.id];
    if (!item) return 0;
    var a = Math.max(0, 1 - (performance.now() - item.at) / item.ms);
    if (!a) delete mapFades[d.id];
    return a;
  };

  /** 아직 세워지지 않았지만 신기루로 보이는 때인가 */
  M.active = function (d) {
    var s = S(), c = cfg();
    if (!d || !d.built || !s) return false;
    var y = s.date.y;
    if (d.openY && y < d.openY) return false;   // 아직 드러나지 않은 곳 (js/data/amer1630.js — 1630년부터)
    if (G.Disc && G.Disc.isFuture && G.Disc.isFuture(d)) return (d.alwaysMirage || y < d.built) && y >= (d.mirageFrom || c.from || 1600);   // 미래의 건물: 1600년부터(mirageFrom이 있으면 그 해부터) 소문이 돈다 (찾는 것은 언제든)
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

  /** 위치에 맞는 외관(없으면 마지막 장면)을 일렁이게 띄웠다가 흩어지게 한다 */
  M.show = function (d, first) {
    var root = document.getElementById('ui'); if (!root) return;
    var c = cfg(), ms = Math.round((c.show || 7) * 1000);
    var el = U.el('div', 'mirage');
    el.style.setProperty('--mirage-ms', ms + 'ms');
    var pic = U.el('div', 'mirage-pic');
    var key = M.exteriorKey(d);
    if (key && /^(landmarks\/|map-discoveries\/mirage\/)/.test(key)) pic.classList.add('mirage-exterior');
    trackMap(d, ms);
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
  /** 신기루로 본 미래의 건물이 흩어져 사라진다 (발견 카드를 닫은 뒤) — 끝나면 풀린다 */
  M.vanish = function (d) {
    var root = document.getElementById('ui'); if (!root || !d) return Promise.resolve();
    var c = cfg(), ms = Math.round((c.vanish || 3.2) * 1000);
    var el = U.el('div', 'mirage vanish');
    el.style.setProperty('--mirage-ms', ms + 'ms');
    var pic = U.el('div', 'mirage-pic');
    var key = M.exteriorKey(d);
    if (key && /^(landmarks\/|map-discoveries\/mirage\/)/.test(key)) pic.classList.add('mirage-exterior');
    trackMap(d, ms);
    var src = key && G.Img.src(key);
    if (src) { var im = new Image(); im.src = src; im.alt = d.name; pic.appendChild(im); }
    else if (G.Art && G.Art.discoveryArt) { try { pic.appendChild(G.Art.discoveryArt(d, 720, 320)); } catch (e) { /* 그림이 없으면 글만 */ } }
    el.appendChild(pic);
    el.appendChild(U.el('div', 'mirage-cap', '<b>신기루</b> — ' + U.esc(d.name) + '<small>손을 뻗자 아지랑이처럼 흩어져 사라졌다. ' + (d.built ? d.built + '년에야 세워질 것이다.' : '') + '</small>'));
    root.appendChild(el);
    if (G.Audio && G.Audio.sfx) { try { G.Audio.sfx('wake'); } catch (e) { /* 소리가 없어도 된다 */ } }
    return new Promise(function (res) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); res(); }, ms + 150); });
  };
  function UI() { return G.UI; }
})(window.G = window.G || {});
