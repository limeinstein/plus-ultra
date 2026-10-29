/* 지도 제작과 해도 보고 (G.Carto) — 2026-10-29 사용자 요청
   「지도 제작과 지도를 보고하는 기능을 게임에 녹여 줘. 왕이나 학자를 통해 보고하고 돈도 명성도 얻을 수 있어.
    그 지도가 상세하면 상세할수록 돈을 더 받는 개념이고, 지도 제작실과 파수꾼에 능력이 있는 인원이 있을수록 지도가 빨리 보충되는 형태야.」
   ■ 해도의 상세함은 칸(0.5°)마다 다시 지나간 횟수 — G.State.surveyChart · chartLevel (js/core/state.js, 해도 그림은 Codex의 재탐사 해도)
       ① 윤곽(해안선·바다) ② 강 ③ 산 ④ 지형. 시야 밖으로 나갔다가 다시 들어와야 한 번 더 센다.
   ■ 빨리 채우기: 바다에서 새로 시야에 든 칸마다 「지도 제작 속도」만큼 덧 기록 (확률) — 지도 제작실(측량·★, 그림·☆)
       · 기함의 파수꾼(파수대) · 다른 배의 파수꾼 자리에 앉은 부하의 측량 솜씨. 속도 +100%면 한 번 지나갈 때 두 번 지나간 만큼 채운다.
   ■ 보고: 왕(type 'king')이나 학자(type 'scholar') 후원자에게 「해도 보고」 — 지난 보고 뒤 새로 그린 몫(가치)만큼
       값어치 = 칸마다 단계 가치(① 1 · ② 2.5 · ③ 4.5 · ④ 7.5 — 상세할수록 더) 의 합 − 이미 보고한 몫
       왕: 사례금이 크고 · 학자: 명성이 크고 큰 해도면 그 바다의 단서 하나. 지리(geo) 취향의 후원자는 +20%. 신뢰도 오른다.
   ■ 저장: s.carto = { rep: 보고한 몫, n: 보고 횟수, last: {날짜·누구·금화·명성} } — 옛 저장은 처음 열 때 지금까지를 보고한 셈으로 둔다(덧 지나간 몫부터 받는다)
   조정값: G.BALANCE.carto */
(function (G) {
  'use strict';
  var C = G.Carto = {};
  var U = G.U, UI = G.UI;
  var W = 720, H = 360;
  function S() { return G.Game.state; }
  function R() { return G.R; }
  C.DEF = {
    weights: [0, 1, 2.5, 4.5, 7.5],          // 단계마다 칸 하나의 가치 (쌓인 값) — 상세할수록 더
    minUnits: 60,                             // 이보다 적으면 보고할 거리가 못 된다
    king: { gold: 2.0, fame: 0.06 },          // 가치 1마다 금화·명성 (× 후원자 재력)
    scholar: { gold: 0.9, fame: 0.12, clueUnits: 300 },
    geoTaste: 1.2,                            // 지리 취향 후원자
    speed: { chart: 0.10, lookout: 0.06, ship: 0.05, max: 1.5 }   // 지도 제작 속도: 지도 제작실 힘·기함 파수대 힘·다른 배 파수꾼 측량 단계마다
  };
  function cfg() { var b = G.BALANCE && G.BALANCE.carto; if (!b) return C.DEF; var o = {}; for (var k in C.DEF) o[k] = b[k] != null ? b[k] : C.DEF[k]; return o; }
  C.LEVEL = ['미탐사', '윤곽', '강', '산', '지형'];

  // ---------------------------------------------------------------- 상세함 세기
  /** 칸마다 단계(0~4)를 세어 [n0, n1, n2, n3, n4] */
  C.counts = function (s) {
    s = s || S(); var out = [0, 0, 0, 0, 0]; if (!s || !s.chartBits) return out;
    var bits = s.chartBits, pas = s.chartPasses, max = 4;
    for (var i = 0; i < W * H; i++) {
      var lv = pas ? pas[i] : 0;
      if (!lv && (bits[i >> 3] & (1 << (i & 7)))) lv = 1;
      out[lv > max ? max : lv]++;
    }
    return out;
  };
  /** 해도 전체의 가치 */
  C.value = function (s, counts) {
    var n = counts || C.counts(s), w = cfg().weights, v = 0;
    for (var lv = 1; lv <= 4; lv++) v += n[lv] * w[lv];
    return Math.round(v);
  };
  /** 보고 기록 — 없으면(옛 저장) 지금까지를 보고한 셈으로 */
  C.st = function (s) {
    s = s || S();
    if (!s.carto) s.carto = { rep: C.value(s), n: 0, last: null };
    return s.carto;
  };
  /** 아직 보고하지 않은 몫 {units, counts, value} */
  C.pending = function (s) {
    s = s || S(); var n = C.counts(s), v = C.value(s, n), st = C.st(s);
    return { units: Math.max(0, v - st.rep), counts: n, value: v };
  };

  // ---------------------------------------------------------------- 지도 제작 속도
  var spdCache = { key: '', v: 0, parts: null };
  /** 지도 제작 속도 (0 ~ max): 새로 시야에 든 칸마다 덧 기록할 몫 */
  C.speedParts = function () {
    var s = S(), k = cfg().speed, CB = G.Cabins, CA = G.CrewAuto, RR = R();
    var chart = CB ? CB.power('chart') : 0, look = CB ? CB.power('lookout') : 0, ships = 0, names = [];
    if (CA && s.fleet) s.fleet.ships.slice(1).forEach(function (sh) {
      var m = CA.crewOf(sh).lookout; if (!m) return;
      var lv = RR.mateSkill(m, 'survey'); if (lv > 0) { ships += lv; names.push((G.MATE[m.id] ? G.MATE[m.id].name : '') + '(' + sh.name + '호)'); }
    });
    var v = Math.min(k.max, chart * k.chart + look * k.lookout + ships * k.ship);
    return { v: v, chart: chart * k.chart, lookout: look * k.lookout, ships: ships * k.ship, shipNames: names };
  };
  C.speed = function () {
    var s = S(); if (!s) return 0;
    var key = s.day + ':' + (s.mates || []).length + ':' + (s.fleet ? s.fleet.ships.length : 0);
    if (spdCache.key !== key) { var p = C.speedParts(); spdCache = { key: key, v: p.v, parts: p }; }
    return spdCache.v;
  };
  C.resetSpeed = function () { spdCache.key = ''; };

  // 바다에서 새로 시야에 든 칸: 지도 제작 속도만큼 덧 기록 (G.State.surveyChart 뒤)
  var ST = G.State;
  if (ST && ST.surveyChart && !ST.surveyChart._carto) {
    var orig = ST.surveyChart;
    ST.surveyChart = function (lon, lat, r) {
      var s = G.Game.state, prev = s && s.chartLast ? { x: s.chartLast.x, y: s.chartLast.y, r: s.chartLast.r } : null;
      var n = orig.apply(this, arguments);
      if (!n || !s || !s.loc || s.loc.mode !== 'sea' || !s.chartPasses) return n;
      var b = C.speed(); if (b <= 0) return n;
      var cap = (G.BALANCE && G.BALANCE.chartSurvey && G.BALANCE.chartSurvey.max) || 4, whole = Math.floor(b), frac = b - whole;
      var cx = Math.floor((G.Geo.wrapLon(lon) + 180) * 2), cy = Math.floor((90 - lat) * 2), rr = Math.ceil(r * 2), extra = 0;
      for (var y = Math.max(0, cy - rr); y <= Math.min(H - 1, cy + rr); y++) {
        for (var x = cx - rr; x <= cx + rr; x++) {
          var dx = x - cx, dy = y - cy; if (dx * dx + dy * dy > rr * rr) continue;
          var xx = ((x % W) + W) % W, i = y * W + xx;
          if (prev) { var pdx = Math.abs(xx - prev.x); pdx = Math.min(pdx, W - pdx); var pdy = y - prev.y; if (pdx * pdx + pdy * pdy <= prev.r * prev.r) continue; }
          var add = whole + (frac > 0 && Math.random() < frac ? 1 : 0);
          if (add > 0 && s.chartPasses[i] < cap) { var to = Math.min(cap, s.chartPasses[i] + add); extra += to - s.chartPasses[i]; s.chartPasses[i] = to; }
        }
      }
      if (extra) { s.chartDirty = true; s.chartRevision = (s.chartRevision || 0) + 1; }
      return n + extra;
    };
    ST.surveyChart._carto = true;
  }
  // 새 게임: 처음부터 아는 바다(고향 둘레)는 보고할 거리가 아니다
  if (ST && ST.newGame && !ST.newGame._carto) {
    var ng = ST.newGame;
    ST.newGame = function () { var s = ng.apply(this, arguments); if (s) s.carto = { rep: C.value(s), n: 0, last: null }; return s; };
    ST.newGame._carto = true;
  }

  // ---------------------------------------------------------------- 보고
  C.canHear = function (sp) { return !!sp && (sp.type === 'king' || sp.type === 'scholar'); };
  /** 이 후원자에게 지금 보고하면: {units, gold, fame, clue} */
  C.offer = function (sp, pend) {
    pend = pend || C.pending();
    var c = cfg(), k = sp.type === 'king' ? c.king : c.scholar, wk = 0.6 + 0.1 * (sp.wealth || 3);
    var tk = (sp.taste || []).indexOf('geo') >= 0 ? c.geoTaste : 1;
    var u = pend.units;
    return { units: u, gold: Math.round(u * k.gold * wk * tk / 10) * 10, fame: Math.round(u * k.fame * tk), clue: sp.type === 'scholar' && u >= (c.scholar.clueUnits || 300), taste: tk > 1 };
  };
  /** 단계마다 얼마나 그렸는지 한 줄 */
  C.countsText = function (n) {
    n = n || C.counts();
    return [1, 2, 3, 4].map(function (lv) { return '①②③④'[lv - 1] + ' ' + C.LEVEL[lv] + ' ' + U.num(n[lv]) + '칸'; }).join(' · ');
  };
  C.menuItem = function (sp) {
    if (!C.canHear(sp)) return null;
    var p = C.pending(), o = C.offer(sp, p), ok = p.units >= cfg().minUnits;
    return { label: '해도 보고', icon: 'chart', sub: ok ? '새로 그린 몫 ' + U.num(p.units) + ' · 사례 약 ' + U.num(o.gold) + '닢' : '새로 그린 해도가 아직 적다', dim: !ok, onClick: function () { return C.report(sp); } };
  };
  C.report = async function (sp) {
    var s = S(), SP = G.Sponsor, who = SP.speaker(sp), p = C.pending(), o = C.offer(sp, p), c = cfg(), king = sp.type === 'king';
    if (p.units < c.minUnits) {
      await UI.say(king ? '지난번에 바친 해도와 크게 다르지 않구려. 새 바다를 더 그려 오시오. 같은 바다라도 다시 지나며 강과 산까지 그려 오면 더 쳐 주겠소.'
        : '이 해도는 지난번에 본 것과 거의 같군요. 새 바다를 더 그리거나, 지나온 바다를 다시 지나며 강·산·지형까지 채워 오십시오.', who);
      return;
    }
    var sp2 = C.speedParts();
    var html = '<div style="font-size:18px;line-height:1.7">' +
      '<div>지금 해도: ' + C.countsText(p.counts) + '</div>' +
      '<div class="muted" style="font-size:15px">칸 하나의 값어치 — ① 윤곽 1 · ② 강 2.5 · ③ 산 4.5 · ④ 지형 7.5 (상세할수록 더 받는다)</div>' +
      '<div>지난 보고 뒤 새로 그린 몫: <b>' + U.num(p.units) + '</b></div>' +
      '<div>' + (king ? '왕실의 사례' : '학자의 사례') + ': 금화 <b>' + U.num(o.gold) + '</b>닢 · 탐험 명성 <b>+' + U.num(o.fame) + '</b>' + (o.taste ? ' <small>(지리에 밝은 후원자 +20%)</small>' : '') + (o.clue ? ' · 그 바다의 단서 하나' : '') + '</div>' +
      '<div class="muted" style="font-size:15px">지도 제작 속도 +' + Math.round(sp2.v * 100) + '% — 지도 제작실 +' + Math.round(sp2.chart * 100) + '% · 파수대 +' + Math.round(sp2.lookout * 100) + '% · 다른 배 파수꾼 +' + Math.round(sp2.ships * 100) + '%</div></div>';
    var yes = await UI.confirm(html, '해도를 바친다', '그만둔다', '해도 보고 — ' + (sp.title || ''));
    if (!yes) return;
    await UI.say(king ? U.pick(['오오, 이 해안선과 강줄기를 보시오! 우리 함대가 이 길로 가면 되겠구려. 수고했소.', '세상의 끝이 이렇게 생겼단 말이오? 이 해도는 왕실 문서고에 넣어 두겠소.', '경의 해도 한 장이 함대 열 척보다 낫소. 넉넉히 상을 내리겠소.'])
      : U.pick(['이 산줄기와 물길을 보십시오. 프톨레마이오스의 지도가 틀린 곳을 바로잡을 수 있겠습니다!', '경도와 위도를 이렇게 촘촘히 적어 오신 분은 처음입니다. 제 우주지에 실어 학자들에게 돌리겠습니다.', '해안선만 있던 곳에 강과 산이 들어서니 비로소 땅이 보입니다. 고맙습니다.']), who);
    s.player.gold += o.gold;
    var fg = G.Fame ? G.Fame.add('ex', o.fame) : 0;
    SP.addTrust(SP.rel(sp.id), Math.min(6, 1 + Math.floor(p.units / 400)));
    var st = C.st(s); st.rep = p.value; st.n = (st.n || 0) + 1; st.last = { d: U.clone(s.date), sp: sp.id, gold: o.gold, fame: o.fame, units: p.units };
    var clue = o.clue ? C.scholarClue(sp) : null;
    G.State.log((sp.title || '') + '에게 해도를 바쳤다 — 새로 그린 몫 ' + U.num(p.units) + ', 금화 ' + U.num(o.gold) + '닢 · 탐험 명성 +' + U.num(o.fame) + '.');
    UI.toast('해도 보고 — 금화 ' + U.num(o.gold) + '닢 · 탐험 명성 +' + U.num(fg || o.fame), 'chart', 4800);
    if (clue) await UI.say('이 해도에서 눈여겨볼 곳이 있습니다. 「' + clue.name + '」 — 옛 기록에 나오는 곳이 이 근처일 겁니다. ' + (G.Disc.hintText ? G.Disc.hintText(clue) : ''), who);
    if (G.Game.refreshHud) G.Game.refreshHud();
  };
  /** 학자가 큰 해도를 보고 일러 주는 단서: 가장 상세하게 그린 바다 가까이의 아직 모르는 발견물 */
  C.scholarClue = function (sp) {
    var s = S(), D = G.Disc; if (!D || !G.DISCOVERIES) return null;
    var c0 = G.CITY_DATA[sp.city] || {}, lon = s.loc.lon != null ? s.loc.lon : c0.lon, lat = s.loc.lat != null ? s.loc.lat : c0.lat;
    var cand = G.DISCOVERIES.filter(function (d) {
      if (d.how === 'special' || d.how === 'trade' || d.bookOnly || D.foundByMe(d.id) || s.hints[d.id] || !D.available(d)) return false;
      return G.State.chartLevel(d.lon, d.lat) >= 2;   // 강까지 그린 바다·땅
    }).map(function (d) { return { d: d, k: G.Geo.dist(lon, lat, d.lon, d.lat) }; }).sort(function (a, b) { return a.k - b.k; });
    for (var i = 0; i < Math.min(10, cand.length); i++) if (D.addHint(cand[i].d.id, 'map') !== false && s.hints[cand[i].d.id]) return cand[i].d;
    return null;
  };

  // ---------------------------------------------------------------- 수첩에 보이는 한 줄
  C.statusHtml = function () {
    var p = C.pending(), sp = C.speedParts();
    return '<div class="muted" style="font-size:15px;margin:2px 0 8px">해도의 상세함: ' + C.countsText(p.counts) + ' · 보고하지 않은 몫 <b>' + U.num(p.units) + '</b>' +
      ' (왕·학자 후원자에게 「해도 보고」) · 지도 제작 속도 +' + Math.round(sp.v * 100) + '%</div>';
  };
})(window.G = window.G || {});
