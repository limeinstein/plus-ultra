/* 1600~1700 QA: 일지·소식·창·발견 기록을 모은다 + 대항해시대의 끝(G.EraEnd.tick)을 곁일에 넣는다 */
(function () {
  'use strict';
  var Q = null;
  var rec = { log: [], hist: [], disc: [], era: null, t0: null };
  function hook() {
    if (!window.QA || !window.G || !G.State || !G.State.log || !G.Game || !G.Game.newDay || !G.UI || !G.UI.say) return false;
    Q = window.QA;
    if (!G.State.log.__ev) {
      var orig = G.State.log;
      G.State.log = function (t) { try { var s = G.Game.state; if (s && rec.t0) rec.log.push([s.date.y * 10000 + s.date.m * 100 + s.date.d, String(t).replace(/<[^>]+>/g, '').slice(0, 220)]); } catch (e) { /* 없음 */ } return orig.apply(this, arguments); };
      G.State.log.__ev = 1;
    }
    if (!G.Game.newDay.__ev) {
      var nd = G.Game.newDay;
      G.Game.newDay = function () { var out = nd.apply(this, arguments); try { var s = G.Game.state; if (rec.t0 && out && out.length) out.forEach(function (m) { if (m && m.text) rec.log.push([s.date.y * 10000 + s.date.m * 100 + s.date.d, '[소식] ' + String(m.text).replace(/<[^>]+>/g, '').slice(0, 220)]); }); } catch (e) { /* 없음 */ } return out; };
      G.Game.newDay.__ev = 1;
    }
    if (G.UI && !G.UI.toast.__ev) { var tt = G.UI.toast; G.UI.toast = function (t) { try { var s = G.Game.state; if (rec.t0 && s) rec.log.push([s.date.y * 10000 + s.date.m * 100 + s.date.d, '[토스트] ' + String(t).replace(/<[^>]+>/g, '').slice(0, 160)]); } catch (e) { /* 없음 */ } return tt.apply(this, arguments); }; G.UI.toast.__ev = 1; }
    if (G.UI && !G.UI.window.__ev) { var ww = G.UI.window; G.UI.window = function (o) { try { var s = G.Game.state; if (rec.t0 && s && o) rec.log.push([s.date.y * 10000 + s.date.m * 100 + s.date.d, '[창] ' + String(o.title || '') + ' :: ' + String(o.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)]); } catch (e) { /* 없음 */ } return ww.apply(this, arguments); }; G.UI.window.__ev = 1; }
    if (G.UI && !G.UI.say.__ev) { var sy = G.UI.say; G.UI.say = function (t) { try { var s = G.Game.state; if (rec.t0 && s) rec.log.push([s.date.y * 10000 + s.date.m * 100 + s.date.d, '[말] ' + String(t).replace(/<[^>]+>/g, '').slice(0, 160)]); } catch (e) { /* 없음 */ } return sy.apply(this, arguments); }; G.UI.say.__ev = 1; }
    var aux0 = Q.aux;
    Q.aux = function () {
      aux0();
      try { if (G.EraEnd && G.Game.state) G.EraEnd.tick(); } catch (e) { console.error(e); }
      var ov = document.querySelector('.era-end');
      if (ov) {
        if (!rec.era) { var s = G.Game.state; rec.era = { date: s ? s.date.y + '.' + s.date.m + '.' + s.date.d : '?', scene: G.Game.sceneName }; }
        var sk = ov.querySelector('.ee-skip'), nx = ov.querySelector('.ee-next');
        if (nx && !nx.hidden) nx.click(); else if (sk && !sk.hidden) sk.click();
      }
    };
    Q.evStart = function () { rec.t0 = Date.now(); var s = G.Game.state; rec.d0 = s.date.y * 10000 + s.date.m * 100 + s.date.d; rec.found0 = Object.keys(s.disc).filter(function (k) { return s.disc[k].me; }); };
    Q.eraFired = function () { return rec.era; };
    Q.evDump = function () {
      var s = G.Game.state, found = [];
      if (s) Object.keys(s.disc).forEach(function (k) { var x = s.disc[k]; if (x.me && rec.found0 && rec.found0.indexOf(k) < 0) found.push([k, x.d || x.date || null, (G.DISC[k] || {}).how]); });
      return { d0: rec.d0, log: rec.log, era: rec.era, found: found, prompts: Q.prompts, picks: Q.picks, mates: s ? (s.mates || []).map(function (m) { return m.id; }) : [], flags: s ? Object.keys(s.flags || {}) : [], history: s ? s.history : null };
    };
    return true;
  }
  var t = setInterval(function () { if (hook()) clearInterval(t); }, 50);
})();
