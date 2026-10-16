/* 사건의 간격 (G.Pace) — 항해·육상 탐험의 우연한 사건이 너무 잦지 않게, 같은 사건이 곧바로 되풀이되지 않게.
   항해 하루는 실제로 1초 남짓이라(×4면 0.3초) 날수만으로 막으면 화면에서는 사건이 연달아 터진다. 그래서 실제 시간으로도 잰다.
   · 아무 사건이든 앞 사건에서 실제 시간 gapMs가 지나야 다음 우연한 사건이 일어난다 (폭풍·해적처럼 눈에 보이는 일은 이 간격을 건너뛰고, 대신 뒤의 사건을 늦춘다)
   · 같은 사건(열쇠)은 실제 시간 sameMs, 게임 날수 sameDays가 둘 다 지나야 다시 일어난다
   조정값: G.BALANCE.eventPace (js/data/base.js). 실제 시간 기록은 이 창에서만 기억한다(저장하지 않는다). 게임 날수는 s.paceDay에 남는다(없으면 빈 것으로). */
(function (G) {
  'use strict';
  var P = {};
  G.Pace = P;
  var lastAny = -Infinity, lastKey = {};
  function S() { return G.Game && G.Game.state; }
  /** 실제 시간(ms). 시험에서는 가상 시계로 바꿔 끼울 수 있다 */
  P.clock = function () { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); };
  function now() { return P.clock(); }
  P.cfg = function () { var c = (G.BALANCE && G.BALANCE.eventPace) || {}; return { gapMs: c.gapMs == null ? 40000 : c.gapMs, sameMs: c.sameMs == null ? 90000 : c.sameMs, sameDays: c.sameDays == null ? 30 : c.sameDays }; };
  /** 지금 이 사건이 일어나도 되나. key = 사건 열쇠(없으면 간격만 본다), o.noGap = 앞 사건과의 간격은 보지 않는다 */
  P.ok = function (key, o) {
    var c = P.cfg(), t = now(), s = S();
    if (!(o && o.noGap) && t - lastAny < c.gapMs) return false;
    if (key == null) return true;
    if (lastKey[key] != null && t - lastKey[key] < c.sameMs) return false;
    var d = s && s.paceDay && s.paceDay[key];
    if (d != null && s.day - d < c.sameDays) return false;
    return true;
  };
  /** 사건이 일어났다: 간격·같은 사건 시계를 새로 잰다. o.quiet = 같은 사건 시계만 */
  P.mark = function (key, o) {
    var t = now(), s = S();
    if (!(o && o.quiet)) lastAny = t;               // quiet: 작은 알림(무풍 등)은 다른 사건을 늦추지 않는다
    if (key == null) return;
    lastKey[key] = t;
    if (s) { s.paceDay = s.paceDay || {}; s.paceDay[key] = s.day; }
  };
  /** 시험·불러오기용: 실제 시간 기록을 비운다 */
  P.reset = function () { lastAny = -Infinity; lastKey = {}; };
  P.since = function (key) { var t = lastKey[key]; return t == null ? Infinity : now() - t; };
})(window.G = window.G || {});
