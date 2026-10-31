/* 도크(선거): 함대에서 뺀 배를 항구에 맡겨 둔다 (2026-10-31 사용자 요청)
   · 모항(s.player.home)의 도크는 G.BALANCE.dock.home척(10)까지, 다른 항구는 other척(3)까지
   · 모항이 아닌 항구의 도크에 keepDays일(730 = 2년) 넘게 둔 배는 폐기된다 — warn 날 남았을 때마다 부관이 일러 준다
   · 자리는 예전의 「계류」와 같다: s.moored[도시번호] = [배…]. 배마다 맡긴 날 sh.dockDay를 적는다
     (옛 저장의 배에는 없으므로 처음 날이 지날 때 그날로 적는다 — 옛 저장에서 갑자기 사라지지 않게)
   · 옛 저장에 한도보다 많이 맡긴 도크는 그대로 둔다. 더 넣을 수만 없다 */
(function (G) {
  'use strict';
  var U = G.U;
  var D = G.Dock = {};
  function S() { return G.Game && G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.dock) || {}; }
  function num(v, d) { return v == null ? d : v; }
  function cid(c) { return c && typeof c === 'object' ? c.id : c; }

  D.isHome = function (c) { var s = S(); return !!(s && s.player && s.player.home === cid(c)); };
  /** 이 항구 도크에 둘 수 있는 배 수 */
  D.cap = function (c) { return D.isHome(c) ? num(B().home, 10) : num(B().other, 3); };
  D.keepDays = function () { return num(B().keepDays, 730); };
  D.list = function (c) { var s = S(), k = cid(c); if (!s.moored) s.moored = {}; return s.moored[k] || (s.moored[k] = []); };
  D.free = function (c) { return Math.max(0, D.cap(c) - D.list(c).length); };
  D.full = function (c) { return D.free(c) <= 0; };
  /** 모항이 아닌 도크에서 폐기까지 남은 날 (모항이면 null) */
  D.left = function (c, sh) {
    if (D.isHome(c)) return null;
    var s = S(), d0 = sh.dockDay != null ? sh.dockDay : s.day;
    return Math.max(0, d0 + D.keepDays() - s.day);
  };
  /** 도크에 넣는다. 가득 찼으면 false */
  D.put = function (c, sh) {
    if (D.full(c)) return false;
    sh.dockDay = S().day; sh.dockWarn = {};
    D.list(c).push(sh);
    return true;
  };
  /** 도크에서 꺼낸다 (i번째) */
  D.take = function (c, i) {
    var sh = D.list(c).splice(i, 1)[0];
    if (sh) { delete sh.dockDay; delete sh.dockWarn; }
    return sh;
  };
  /** 「도크 3/10척」 같은 짧은 글 */
  D.note = function (c) { return '도크 ' + D.list(c).length + '/' + D.cap(c) + '척'; };
  D.leftText = function (c, sh) {
    var l = D.left(c, sh); if (l == null) return '모항 — 기한 없음';
    return l >= 365 ? Math.floor(l / 365) + '년 ' + Math.floor((l % 365) / 30) + '달 남음' : l + '일 남음';
  };

  /** 날마다 (js/systems/world.js W.daily): 모항이 아닌 도크의 기한을 일러 주고, 지나면 폐기 */
  D.daily = function () {
    var s = S(), out = []; if (!s || !s.moored) return out;
    var warn = B().warn || [90, 30], yrs = Math.round(D.keepDays() / 365);
    Object.keys(s.moored).forEach(function (k) {
      var id = +k, arr = s.moored[k], c = G.CITY_DATA[id], place = c ? c.name : '어느 항구';
      if (!arr || !arr.length || D.isHome(id)) return;
      arr.slice().forEach(function (sh) {
        if (sh.dockDay == null) { sh.dockDay = s.day; sh.dockWarn = {}; return; }   // 옛 저장: 오늘부터 센다
        var left = sh.dockDay + D.keepDays() - s.day;
        if (left <= 0) {
          arr.splice(arr.indexOf(sh), 1);
          if (G.FigFx) G.FigFx.salvage(sh);   // 유물·전설 선수상은 떼어 돌려받는다 (조선소 파기와 같게)
          G.State.log(place + ' 도크에 맡겨 둔 ' + sh.name + '호가 ' + yrs + '년이 지나 폐기되었다.');
          out.push({ icon: 'skull', text: place + ' 도크에 맡겨 둔 ' + sh.name + '호는 ' + yrs + '년이 지나도록 찾으러 가지 않아 폐기되었다.', history: true });
          return;
        }
        sh.dockWarn = sh.dockWarn || {};
        warn.forEach(function (w) {
          if (left <= w && !sh.dockWarn[w]) { sh.dockWarn[w] = 1; if (left > 1) out.push({ icon: 'hourglass', text: place + ' 도크에 맡긴 ' + sh.name + '호가 ' + left + '일 뒤면 폐기됩니다. 그 전에 찾으러 가거나 모항으로 옮기십시오.' }); }
        });
      });
    });
    return out;
  };
})(window.G = window.G || {});
