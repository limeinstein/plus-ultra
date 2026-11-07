/* 거리를 거니는 동료 (G.MateStroll) — 2026-11-07 사용자 요청
   · 옛이야기의 네 공주(신데렐라·백설공주·잠자는 숲속의 공주·인어공주)·셰에라자드·엘리자베타(눈의 여왕)·마녀들 —
     전용 걷는 그림이 있는 동료(G.MATE_WALKS, js/data/matewalks.js)가 일행에 있으면,
     항구·도시에 들어설 때마다(입항 번호 s.portVisit) G.BALANCE.mateStroll.chance(10%) 확률로 그 가운데 한 명이 거리를 돌아다닌다.
   · 한 번 들어온 동안(출항·탐험을 떠나기 전까지)은 딱 그 한 명만 — 건물에 들어갔다 나와도 같은 사람이다.
   · 다음 도시에 가면 다시 굴린다. 뽑힐 때는 지난번에 나온 사람이 아닌 사람을 먼저 고른다.
   · 누르면 제독이 다가가 말을 건다 — 그 사람 고유 말투(G.Voice: 첫마디 → 요즘 이야기).
   · 그림: images/characters/mates/<id>/walk (4열×2줄 8단계 시트). 없으면 코드 그림(G.Art.drawFolk 여자).
   · 저장: s.mateStroll = { v: 입항 번호, city, id(없으면 null), last: 지난번에 나온 사람 } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art;
  var MS = G.MateStroll = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.mateStroll) || {}; }

  /** 거리를 거닐 수 있는 동료 줄 (일행에 있고 전용 걷는 그림 자료가 있는 사람) */
  MS.pool = function () {
    var s = S(), W = G.MATE_WALKS || {};
    if (!s || !s.mates) return [];
    return s.mates.filter(function (m) { return m && W[m.id] && G.MATE[m.id]; });
  };
  /** 이번 입항에 거리를 거니는 동료 (없으면 null). 입항마다 한 번만 굴린다 */
  MS.pick = function (c) {
    var s = S(); if (!s || !c) return null;
    var v = s.portVisit || 0, r = s.mateStroll;
    if (!r || r.v !== v || r.city !== c.id) {
      var pool = MS.pool(), last = r ? (r.id || r.last || null) : null, id = null;
      if (pool.length && U.chance(K().chance != null ? K().chance : 0.1)) {
        var fresh = pool.filter(function (m) { return m.id !== last; });
        id = U.pick(fresh.length ? fresh : pool).id;
      }
      r = s.mateStroll = { v: v, city: c.id, id: id, last: id || last };
    }
    if (!r.id) return null;
    var m = s.mates.filter(function (x) { return x.id === r.id; })[0];
    if (!m) { r.id = null; return null; }   // 그사이 일행을 떠났다
    return m;
  };
  /** 걷는 그림 8칸 (시트 한 장 — 4열×2줄) */
  function frames(id) {
    var I = G.Img, d = (G.MATE_WALKS || {})[id]; if (!d || !I || !I.has || !I.has(d.key)) return null;
    if (I.want) I.want(d.key);
    var n = d.frames || 8, out = []; for (var i = 0; i < n; i++) out.push({ k: d.key, c: i });
    return out;
  }
  function speaker(m) {
    var T = G.Scenes && G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.tavern;
    var d = G.MATE[m.id];
    if (T && T.mateSpeaker) { var sp = T.mateSpeaker(m); sp.name = d.name; return sp; }
    return { name: d.name, portrait: A.mateSpec(m.id), half: G.Img.chain.mateHalf(m.id), lang: 3 };
  }
  /** 거리 사람 하나로 만든다 (js/systems/streetfolk.js SF.spawn 이 부른다) — 이번 입항에 거니는 사람이 없으면 null */
  MS.folk = function (c, streetW, heroX, ground, seed) {
    var m = MS.pick(c); if (!m) return null;
    var d = G.MATE[m.id], k = (G.FX && G.FX.streetFolk) || {}, dp = k.depth || [12, 52], sc = k.scale || [0.92, 1.06];
    var depth = U.rf(dp[0], dp[1]);
    return { type: 'mate', mate: m.id, name: d.name, animal: false, face: speaker(m),
      spec: A.folkSpec('woman', c, 'mate:' + m.id, { sex: d.g === 'm' ? 'm' : 'f' }), seed: seed + ':mate',
      x: heroX, y: ground + depth, sc: sc[0] + (depth - dp[0]) / Math.max(1, dp[1] - dp[0]) * (sc[1] - sc[0]),
      dir: U.chance(0.5) ? 1 : -1, state: 'idle', timer: U.rf(0, 2.5), ph: U.rf(0, 1), v: 0, target: heroX,
      minX: 60, maxX: streetW - 60, talked: 0, used: false, frames: frames(m.id) };
  };
  /** 말을 건다 — 첫 번에는 첫마디와 요즘 이야기, 다음부터는 요즘 이야기 */
  MS.talk = async function (f, c) {
    var s = S(), m = s.mates.filter(function (x) { return x.id === f.mate; })[0], d = G.MATE[f.mate];
    if (!m || !d) { await UI.say('……', f.face || { name: f.name }); return; }
    var sp = speaker(m), V = G.Voice;
    f.talked++;
    var first = f.talked === 1, hi = first && V && V.greet ? V.greet(d, m) : null, chat = V && V.chat ? V.chat(d, m) : null;
    if (first) await UI.say('(거리를 거닐던 ' + d.name + U.jx(d.name, '이/가') + ' 제독을 알아보고 다가온다.)', {});
    if (hi) await UI.say(hi, sp);
    await UI.say(chat || hi || U.pick(['제독님도 구경 나오셨어요? 이 도시는 볼 게 많네요.', '배에만 있으니 답답해서요. 출항 전에는 돌아갈게요.']), sp);
  };
})(window.G = window.G || {});
