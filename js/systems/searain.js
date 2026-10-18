/* 바다의 비 (G.Rain) — 항해 중 비가 내리는 연출과 그에 따른 피로 관리. 2026-10-18
   ■ 비가 오는 날: 하루마다 그 바다의 습도(G.Geo.climate().m) · 적도 무풍대(위도 8° 안) · 우기 계절풍(인도양·남중국해 남서 계절풍) ·
     고위도(45° 너머)로 비가 올 확률이 정해진다. 한 번 오면 1~3일 — 소나기(1)이거나 폭우(2). 폭풍이 치는 날은 늘 폭우.
   ■ 연출: 바다 화면에 바람 쪽으로 기운 빗줄기 · 바다에 떨어지는 빗방울 고리 · 어두운 구름(렌더러 cloud·storm) · 빗소리(G.Audio.rain) ·
     폭풍 속 번개. 비가 오고 그칠 때 서서히 짙어지고 옅어진다. 상태 줄에 「소나기/폭우 · 대책」.
   ■ 피로 (하루마다 sea.js 피로 셈에 더한다 — G.Rain.fatigue()):
     · 더운 바다(위도 25° 안): 소나기는 더위를 식혀 피로가 준다(−0.6), 폭우는 +0.8
     · 온대(25~50°): 소나기 +0.5 · 폭우 +1.4        · 추운 바다(50° 너머): 소나기 +1.0 · 폭우 +2.0 (젖은 몸이 얼어 기강도 −0.3)
     · 요리 솜씨가 있으면 따뜻한 국물로 젖은 몸의 피로가 준다(더하는 피로 × (1 − 요리 × 0.15)) · 폭풍과 겹치면 비의 몫은 절반
   ■ 비 대책 (제독의 명령 — 처음 비가 올 때 부관이 묻고, 바다 화면의 「비 대책」 단추로 바꾼다):
     · work 갑판 작업 계속 — 속력 그대로(폭우면 ×0.92 — 앞이 안 보인다), 피로는 위 그대로, 빗물은 조금(통에 고인 만큼)
     · rest 교대로 선실에서 쉬게 한다 — 피로 −1.2 (비가 오는 날은 오히려 쉬는 날), 기강 +0.2, 속력 ×0.85 (돛 손질 일손이 준다)
     · catch 돛천을 펴 빗물을 받는다 — 하루 물 사용량의 1.2배(폭우 2.5배)를 받아 물통에 채운다(짐칸이 남는 만큼), 피로 +0.4, 속력 ×0.95
   ■ 저장: state.rain = {lv 0~2, days, order, asked, got 받은 빗물 합, n 비 온 날 합}
   ■ 조정값: G.BALANCE.rain */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RN = G.Rain = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.rain = G.BALANCE.rain || {
    base: 0.03, wet: 0.13, itcz: 0.08, monsoon: 0.14, high: 0.04,   // 하루에 비가 올 확률 = base + wet×습도 + (적도 itcz) + (우기 monsoon) + (고위도 high)
    heavy: 0.3, days: [1, 3],                                        // 폭우일 확률 · 이어지는 날
    fat: { hot: [-0.6, 0.8], mild: [0.5, 1.4], cold: [1.0, 2.0] },   // [소나기, 폭우] 하루 피로
    restFat: -1.2, catchFat: 0.4, cookCut: 0.15, coldDisc: 0.3, restDisc: 0.2,
    speed: { work: [1, 0.92], rest: [0.85, 0.85], catch: [0.95, 0.95] },
    water: { catch: [1.2, 2.5], work: [0.25, 0.5] }                  // 하루 물 사용량 × [소나기, 폭우]
  };
  function K() { return G.BALANCE.rain; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; return s.rain || (s.rain = { lv: 0, days: 0, order: 'work', asked: false, got: 0, n: 0 }); }
  RN.ORDERS = {
    work: { name: '갑판 작업 계속', short: '작업 계속', icon: 'sail', desc: '속력은 그대로 — 젖은 채 일하니 피로가 쌓인다 (폭우면 앞이 안 보여 조금 느려진다)' },
    rest: { name: '교대로 선실에서 쉬게 한다', short: '교대 휴식', icon: 'bed', desc: '비 오는 날을 쉬는 날로 — 피로가 풀리고 기강이 오른다, 대신 일손이 줄어 느려진다' },
    catch: { name: '돛천을 펴 빗물을 받는다', short: '빗물 받기', icon: 'drop', desc: '물통을 채운다 — 젖은 갑판에서 일하니 피로가 조금 더 쌓인다' }
  };
  RN.level = function () { var r = st(); return r ? r.lv : 0; };
  RN.raining = function () { return RN.level() > 0; };
  RN.name = function (lv) { lv = lv == null ? RN.level() : lv; return lv >= 2 ? '폭우' : lv ? '소나기' : ''; };
  /** 그 바다의 기온대: hot · mild · cold */
  RN.zone = function (lat) { var a = Math.abs(lat || 0); return a < 25 ? 'hot' : a < 50 ? 'mild' : 'cold'; };
  /** 오늘 비가 올 확률 */
  RN.chance = function (lon, lat, date) {
    var k = K(), cl = G.Geo && G.Geo.climate ? G.Geo.climate(lon, lat) : { m: 0.5 }, p = k.base + k.wet * (cl.m || 0);
    if (Math.abs(lat) < 8) p += k.itcz;                                 // 적도 무풍대: 날마다 소나기
    if (Math.abs(lat) > 45) p += k.high;                                // 고위도의 잦은 비
    var M = G.Monsoon, z = M && M.at ? M.at(lon, lat) : null;
    if (z && date && M.phase(z, date) === 'sw') p += k.monsoon;          // 남서 계절풍 = 우기
    return U.clamp(p, 0, 0.6);
  };

  // ================================================================ 하루 (js/scenes/sea.js 날 바뀜 — 날씨 다음)
  /** o: {storm: 폭풍 중인가}. 반환: 오늘 새로 비가 시작했으면 true (부관이 대책을 묻는다 — RN.ask) */
  RN.daily = function (msgs, o) {
    var r = st(), s = S(); if (!r || !s || !s.loc) return false;
    var l = s.loc, k = K(), began = false, ended = false;
    o = o || {};
    if (r.lv > 0) {
      r.n = (r.n || 0) + 1;
      // 빗물: 대책에 따라 물통에 채운다
      var wk = (k.water[r.order] || k.water.work)[r.lv >= 2 ? 1 : 0] || 0;
      if (wk > 0) {
        var want = Math.round(R.dailyUse() * wk), q = Math.min(want, Math.max(0, Math.floor(R.free())));   // 짐칸이 남는 만큼
        if (q > 0) { s.fleet.water += q; r.got = (r.got || 0) + q; r.today = q; if (r.order === 'catch' && msgs) msgs.push({ icon: 'drop', text: '돛천에 받은 빗물로 물 ' + U.num(q) + '통을 채웠다.' }); }
        else r.today = 0;
      }
      if (--r.days <= 0 && !o.storm) {
        r.lv = 0; r.days = 0;
        ended = true;   // 같은 날 바로 새 비를 다시 뽑아 「그쳤다→시작」이 한꺼번에 나오지 않게 한다
        if (msgs) msgs.push({ icon: 'sun', text: '비가 그쳤다. 젖은 돛과 옷을 말린다.' + (r.got ? ' (이번 비에 받은 빗물 ' + U.num(r.got) + '통)' : '') });
        r.got = 0;
      }
    }
    if (o.storm) { if (r.lv < 2) { began = r.lv === 0; r.lv = 2; } r.days = Math.max(r.days, 1); return began; }
    if (!ended && r.lv === 0 && U.chance(RN.chance(l.lon, l.lat, s.date))) {
      r.lv = U.chance(k.heavy) ? 2 : 1; r.days = U.ri(k.days[0], k.days[1]); r.got = 0; began = true;
      if (msgs) msgs.push({ icon: 'drop', text: (r.lv >= 2 ? '먹구름이 몰려와 폭우가 쏟아진다!' : '소나기가 내리기 시작했다.') + ' — 비 대책: ' + RN.ORDERS[r.order].short + RN.effectNote() });
    }
    return began;
  };
  /** 오늘의 피로 변화 (sea.js 피로 셈에 더한다) */
  RN.fatigue = function (storm) {
    var r = st(), s = S(); if (!r || !r.lv || !s || !s.loc) return 0;
    var k = K(), z = RN.zone(s.loc.lat), f = (k.fat[z] || k.fat.mild)[r.lv >= 2 ? 1 : 0];
    if (f > 0) f *= Math.max(0.4, 1 - R.skillRead('cook') * k.cookCut);   // 따뜻한 국물
    if (r.order === 'rest') f += k.restFat;
    else if (r.order === 'catch') f += k.catchFat;
    if (storm) f *= 0.5;
    return f;
  };
  /** 오늘의 기강 변화 */
  RN.discipline = function () {
    var r = st(), s = S(); if (!r || !r.lv || !s || !s.loc) return 0;
    var k = K(), d = 0;
    if (r.order === 'rest') d += k.restDisc;
    if (r.lv >= 2 && RN.zone(s.loc.lat) === 'cold' && r.order !== 'rest') d -= k.coldDisc;
    return d;
  };
  /** 속력 배수 */
  RN.speedK = function () { var r = st(); if (!r || !r.lv) return 1; var sp = K().speed[r.order] || K().speed.work; return sp[r.lv >= 2 ? 1 : 0]; };
  /** 대책에 따른 하루 효과 요약 (알림·고르는 창) */
  RN.effectNote = function (order) {
    var r = st(), s = S(); if (!r || !s || !s.loc) return '';
    var keep = r.order; if (order) r.order = order;
    var lv0 = r.lv; if (!r.lv) r.lv = 1;
    var f = RN.fatigue(false), sp = RN.speedK(); r.order = keep; r.lv = lv0;
    return ' (하루 피로 ' + (f > 0 ? '+' : '') + f.toFixed(1) + ' · 속력 ×' + sp.toFixed(2) + ')';
  };
  /** 비 대책을 고른다 (부관이 묻는다) — first: 처음 비가 왔을 때의 설명 */
  RN.ask = async function (first) {
    var r = st(); if (!r) return null;
    var who = G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    var z = RN.zone(S().loc.lat);
    if (first) await UI.say('제독, ' + (r.lv >= 2 ? '폭우' : '비') + '가 쏟아집니다. ' + (z === 'hot' ? '더운 바다라 소나기는 오히려 더위를 식혀 주지만, 폭우는 사람을 지치게 합니다.' : z === 'cold' ? '이 추운 바다의 비는 뼛속까지 스며듭니다. 젖은 채 일하면 금방 지치고 기강도 흐트러집니다.' : '젖은 옷으로 밧줄을 당기다 보면 다들 금세 지칩니다.') + ' 비가 오는 동안 선원들을 어떻게 부릴까요?', who);
    var opts = Object.keys(RN.ORDERS).map(function (id) {
      var o = RN.ORDERS[id];
      return { label: o.name + (r.order === id ? ' (지금)' : '') + '<br><small style="opacity:.8">' + U.esc(o.desc + RN.effectNote(id)) + '</small>', icon: o.icon, value: id };
    });
    var v = await UI.ask('비 대책 — ' + (RN.raining() ? RN.name() + ' · ' : '') + (z === 'hot' ? '더운 바다' : z === 'cold' ? '추운 바다' : '온대 바다'), opts.concat([{ label: '그대로 둔다', value: null }]), who);
    r.asked = true;
    if (v && RN.ORDERS[v]) { r.order = v; UI.toast('비 대책: ' + RN.ORDERS[v].name + '.', RN.ORDERS[v].icon, 3200); }
    return v;
  };
  /** 상태 줄 꼬리표 */
  RN.tag = function () {
    var r = st(); if (!r || !r.lv) return '';
    return ' · <span style="color:#a8d4ff" title="' + U.esc(RN.ORDERS[r.order].desc) + '">' + RN.name() + ' · ' + RN.ORDERS[r.order].short + '</span>';
  };

  // ================================================================ 연출: 빗줄기 · 빗방울 고리 · 번개 (바다 화면 덮개 1600×900)
  var vis = 0, drops = null, rings = [], ringCarry = 0, flash = 0, lastT = null;
  function makeDrops() {
    var rng = U.makeRng(7331), out = [];
    // z가 작으면 멀리 있는 가늘고 짧은 비, 크면 가까운 굵고 긴 비. 같은 흰 선이 화면을 균일하게 메우지 않게 한다.
    for (var i = 0; i < 420; i++) out.push({ x: rng(), y: rng(), l: 0.65 + rng() * 0.7, v: 0.78 + rng() * 0.42, a: 0.55 + rng() * 0.45, z: rng() });
    return out;
  }
  /** 렌더러에 넘길 구름·어둠 */
  RN.weather = function (base) {
    var w = Math.max(vis, 0);
    return { cloud: Math.max(base.cloud, 0.35 + 0.45 * w), storm: Math.max(base.storm, w > 0.55 ? 0.3 * w : 0) };
  };
  RN.vis = function () { return vis; };
  /** ctx: 덮개(1600×900 좌표) · t: 장면 시간(초) · windDir: 바람이 불어 가는 쪽 · storm · waterAt(x,y): 수면인가(충돌 고리용) */
  RN.draw = function (ctx, t, windDir, storm, waterAt) {
    var target = RN.level() >= 2 ? 1 : RN.level() ? 0.55 : 0;
    var now = (window.performance ? performance.now() : Date.now()) / 1000;   // 짙어지고 옅어지는 것은 실제 시간으로 (게임 배속·느린 장면과 상관없이)
    var dt = lastT == null ? 0.016 : U.clamp(now - lastT, 0, 0.25); lastT = now;
    vis += (target - vis) * Math.min(1, dt * 0.9);
    if (G.Audio && G.Audio.rain) G.Audio.rain(vis > 0.03 ? vis : 0);
    if (vis < 0.02) { rings.length = 0; return; }
    if (!drops) drops = makeDrops();
    var W = 1600, H = 900;
    ctx.save();
    var sk = (G.Game && G.Game.overlayScale) || 1;
    ctx.setTransform(sk, 0, 0, sk, 0, 0);   // 해전 카메라 확대와 무관한 화면 공간 날씨
    // 어두운 하늘빛
    ctx.fillStyle = 'rgba(24,34,48,' + (0.1 + 0.22 * vis).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    // 빗방울 고리: 프레임 수가 아니라 초당 수로 만들고, 육지에는 생기지 않는다.
    ringCarry += vis * (34 + 42 * vis) * dt;
    var nr = Math.floor(ringCarry); ringCarry -= nr;
    for (var i = 0; i < nr; i++) {
      for (var tr = 0; tr < 5; tr++) {
        var rx = Math.random() * W, ry = Math.random() * H;
        if (!waterAt || waterAt(rx, ry)) { rings.push({ x: rx, y: ry, t: 0, s: 0.65 + Math.random() * 0.7 }); break; }
      }
    }
    ctx.lineWidth = 1;
    for (var j = rings.length - 1; j >= 0; j--) {
      var g = rings[j]; g.t += dt;
      if (g.t > 0.58) { rings.splice(j, 1); continue; }
      var a = (1 - g.t / 0.58) * 0.24 * vis;
      ctx.strokeStyle = 'rgba(178,216,230,' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(g.x, g.y, (1.5 + g.t * 12) * g.s, (0.7 + g.t * 4.5) * g.s, 0, 0, 7); ctx.stroke();
    }
    if (rings.length > 120) rings.splice(0, rings.length - 120);
    // 빗줄기: 바람 쪽으로 기울되, 먼 비는 가늘고 짧게·가까운 비는 드물고 조금 굵게 보인다.
    var wx = Math.cos(windDir || 0), slant = 0.30 + 0.22 * vis;
    var dx = wx * slant, dy = 1, n = Math.round(drops.length * (0.20 + 0.80 * vis)), fall = 690 + 410 * vis;
    ctx.lineCap = 'round';
    for (var q = 0; q < n; q++) {
      var d = drops[q], gust = 0.84 + 0.16 * Math.sin(t * 0.85 + d.x * 17.0), len = (7 + d.z * 16 + 8 * vis) * d.l * gust;
      var y = ((d.y * H + t * fall * d.v) % (H + 60)) - 30;
      var x = ((d.x * W + t * fall * d.v * dx + W * 4) % (W + 60)) - 30;
      var da = (0.075 + 0.24 * vis) * d.a * (0.62 + d.z * 0.38);
      ctx.strokeStyle = 'rgba(202,224,238,' + da.toFixed(3) + ')';
      ctx.lineWidth = 0.55 + d.z * 0.75 + vis * 0.14;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dx * len, y - dy * len); ctx.stroke();
    }
    // 번개 (폭풍 속 폭우)
    if (storm && vis > 0.6) {
      if (flash <= 0 && Math.random() < dt * 0.12) { flash = 0.45; if (G.Audio && G.Audio.thunder) setTimeout(function () { G.Audio.thunder(); }, 300 + Math.random() * 900); }
      if (flash > 0) { ctx.fillStyle = 'rgba(235,240,255,' + (Math.max(0, flash) * (Math.sin(flash * 40) > 0 ? 0.55 : 0.2)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); flash -= dt; }
    } else flash = 0;
    ctx.restore();
  };
  /** 바다를 떠날 때 (빗소리 끄기) */
  RN.leave = function () { vis = 0; rings.length = 0; ringCarry = 0; lastT = null; if (G.Audio && G.Audio.rain) G.Audio.rain(0); };
})(window.G = window.G || {});
