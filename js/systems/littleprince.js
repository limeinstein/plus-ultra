/* 사막에서 만난 어린 왕자 (G.LittlePrince) — 2026-10-24 사용자 요청. 사람은 js/data/littleprince.js
   ■ 언제: 명성 7만(G.BALANCE.littlePrince.minFame) 이상의 제독이 사막(G.Geo.terrain 'desert')에서 야영하며 「정찰한다」를 마쳤을 때 (js/scenes/land.js camp)
   ■ 남장 여자 컨셉: 푸른 꽃무늬 두건과 아이보리색 여행옷 차림으로 소년 왕자라 소개한다. 마지막 우물가에서 여자임을 밝힌다.
     (밝히기 전까지는 남자로 다룬다 — 성별 G.MATE.little_prince.g 는 s.lprince.revealed 를 따른다 · 그 자리에 없으면 지도 뒷면의 글씨로 밝힌다)
     혼자 여행하는 여자아이에게는 다들 집에 가라고만 해서, 별을 떠날 때부터 왕자로 다녔다. 밝힌 뒤에도 「어린 왕자」로 불러 달라며 옷과 말투는 그대로.
   ■ 흐름: ① 정찰대가 모래 언덕 위에 혼자 선 배고픈 소년을 데려온다.
            · 「모닥불 곁에서 음식과 고기를 나눠 준다」(식량 2일분) → 캠프파이어 (G.Scenes.land.drawCampfire)
            · 「갈 길이 바쁘다」 → 소년은 해 지는 쪽으로 사라진다 (다음에 사막에서 정찰하면 또 만난다)
          ② 배를 채운 소년이 「지도를 그려 줘」 — 그가 내려온 곳에서 걸어서 며칠, 모래 언덕 셋 사이에 숨은 우물.
            제독이 경위도만 빼곡한 어른의 지도를 그리면 퇴짜, 언덕과 별을 그림으로 그리면 좋아한다 (몇 번이든 다시 그릴 수 있다).
          ③ 지도를 받아 든 소년은 이 탐험이 재미있다며 따라나선다 — 동료가 된다 (G.Legend.join).
          ④ 지도의 X(사막 속 숨은 우물 — 야영한 곳에서 뭍으로 이어진 사막 2.5~6°)에 서면 우물가를 판다: 금화 10만 닢 (G.BALANCE.littlePrince.reward)
            1.6° 안에 들면 날마다 방향을 일러 준다 (소년이 함께 있으면 소년이, 아니면 측량사가).
   · 수첩 「계약·의뢰」에 「어린 왕자의 지도」(js/ui/info.js — TreasureHunt.html 곁)
   · 저장: s.lprince = { phase: 'met'(지나쳐 보냄)|'map'(지도를 받음)|'done', met: 만난 횟수, tlon, tlat, seed, at: 날번호 } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var LP = G.LittlePrince = {};
  var ID = 'little_prince';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.littlePrince = G.BALANCE.littlePrince || {};
  (function (b) {
    if (b.minFame == null) b.minFame = 70000;   // 이 명성부터
    if (b.chance == null) b.chance = 1;          // 사막에서 정찰을 마쳤을 때 만날 확률
    if (b.reward == null) b.reward = 100000;     // 우물가의 보물
    if (b.food == null) b.food = 2;              // 나눠 주는 식량 (탐험대 하루치 × 이만큼)
    if (b.minD == null) b.minD = 2.5;            // 보물까지 거리 (°)
    if (b.maxD == null) b.maxD = 6;
    if (b.digR == null) b.digR = 0.35;           // 이만큼 안에 서면 판다
    if (b.hintR == null) b.hintR = 1.6;          // 이만큼 안이면 방향을 일러 준다
  })(G.BALANCE.littlePrince);
  function K() { return G.BALANCE.littlePrince; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.lprince || (s.lprince = {}); }
  LP.state = st;
  function row() { return S().mates.filter(function (x) { return x.id === ID; })[0] || null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function boy(emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID, emo) : { name: '어린 왕자', portrait: G.Art.mateSpec(ID), lang: 3 }; }
  function stranger() { var sp = boy(); return { name: '푸른 두건의 소년', portrait: sp.portrait, half: sp.half, lang: 3, special: true }; }
  function first() { return G.Scenes.mateSpeaker('first'); }
  function narrate(t) { return UI.say(t, {}); }
  function shot(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/little_prince_' + key, title: title }) : null; }

  // ---------------------------------------------------------------- 조건
  LP.ready = function () {
    var s = S(); if (!s || !G.MATE[ID]) return false;
    var p = st();
    return (!p.phase || p.phase === 'met') && !row() && !s.flags['gone_' + ID];
  };
  LP.isDesert = function (lon, lat) { return G.Geo.terrain(lon, lat) === 'desert'; };
  /** 야영을 마친 뒤 (js/scenes/land.js — v: 한 일) */
  LP.onCamp = async function (v, lon, lat) {
    var s = S();
    if (v !== 'scout' || !s || s.loc.mode !== 'land' || !LP.ready()) return false;
    if ((s.player.fame || 0) < K().minFame) return false;
    if (!LP.isDesert(lon, lat)) return false;
    if (!U.chance(K().chance)) return false;
    return meet(lon, lat);
  };

  // ---------------------------------------------------------------- 보물 자리: 뭍으로 이어진 사막, 도시와 떨어진 곳
  function lineLand(a, b, c, d) {
    var n = Math.ceil(G.Geo.dist(a, b, c, d) / 0.2);
    for (var i = 1; i <= n; i++) { var t = i / n; if (!G.Geo.isLand(a + G.Geo.wrapLon(c - a) * t, b + (d - b) * t)) return false; }
    return true;
  }
  function farCity(lon, lat) { return !G.CITY_DATA.some(function (c) { return c && G.Geo.dist(c.lon, c.lat, lon, lat) < 0.9; }); }
  LP.pickSpot = function (lon, lat, seed) {
    var rng = U.makeRng(seed >>> 0), k = K(), tries = [[k.minD, k.maxD, true], [1.5, k.minD, true], [1.2, k.maxD, false], [0.8, 2, false]];
    for (var ti = 0; ti < tries.length; ti++) {
      var lo = tries[ti][0], hi = tries[ti][1], desert = tries[ti][2];
      for (var i = 0; i < 80; i++) {
        var a = rng() * Math.PI * 2, d = lo + rng() * (hi - lo), kx = Math.max(0.3, Math.cos(lat * Math.PI / 180));
        var tlon = G.Geo.wrapLon(lon + Math.cos(a) * d / kx), tlat = lat + Math.sin(a) * d;
        if (Math.abs(tlat) > 70 || !G.Geo.isLand(tlon, tlat)) continue;
        if (desert && !LP.isDesert(tlon, tlat)) continue;
        if (!farCity(tlon, tlat) || !lineLand(lon, lat, tlon, tlat)) continue;
        return { lon: tlon, lat: tlat };
      }
    }
    return { lon: lon, lat: lat };   // 어디도 없으면 바로 이 야영지 밑 (이어진 사막이 없을 만큼 작은 땅)
  };
  var DIRS = ['동', '북동', '북', '북서', '서', '남서', '남', '남동'];
  function dirWord(dx, dy) { var a = Math.atan2(dy, dx); return DIRS[(Math.round(a / (Math.PI / 4)) + 8) % 8]; }
  LP.dirWord = dirWord;
  function walkDays(d) { return Math.max(2, Math.round(d / 0.45)); }   // 사막을 걷는 날수 (대강)

  // ---------------------------------------------------------------- ① 만남과 캠프파이어
  async function meet(lon, lat) {
    var s = S(), p = st(), again = p.phase === 'met';
    p.met = (p.met || 0) + 1;
    var v, pc = shot('meet', '모래 언덕의 낯선 여행자');
    try {
      if (again) await narrate('정찰대가 돌아오며 또 그 이야기를 한다 — 모래 언덕 꼭대기에 푸른 꽃무늬 두건을 쓴 아이가 혼자 서서 해 지는 쪽을 보고 있더라고. 지난번 사막에서 자신을 왕자라고 소개한 그 아이다. 이번에도 정찰대를 따라 야영지까지 걸어왔다.');
      else {
        await narrate('해 질 녘, 사흘 걸음 거리를 둘러본 정찰대가 이상한 손님을 데리고 돌아왔다. 아이보리색 여행옷 위에 푸른 꽃무늬 두건과 숄을 두른 가냘픈 아이가, 끝없는 모래 언덕 한가운데 혼자 서 있었다고 한다. 정찰대에게는 자신을 「어린 왕자」라고 소개했다.');
        await UI.say('물 한 방울 없는 데서 혼자 무얼 하느냐고 물었더니, 「해 지는 걸 보고 있었어」라고만 합니다. 어디서 왔느냐니까 하늘을 가리키고요. …제독, 아무래도 며칠 굶은 것 같습니다.', first());
      }
      await UI.say('안녕. 나는 어린 왕자야. 너희 모닥불 냄새를 따라왔어.\f…배가 고파. 별에서 내려온 뒤로 아무것도 못 먹었거든.', stranger());
      v = await UI.ask('푸른 두건의 어린 왕자가 모닥불 쪽을 바라본다. 어떻게 할까?', [
        { label: '모닥불 곁에 앉히고 음식과 고기를 나눠 준다 (식량 ' + K().food + '일분)', value: 'share' },
        { label: '갈 길이 바쁘다', value: 'leave' }], me());
    } finally { if (pc) await pc.stop(); }
    if (v !== 'share') {
      p.phase = 'met';
      await UI.say('그래, 어른들은 늘 바쁘지. 바빠서 해 지는 것도 못 보고.\f괜찮아. 나는 저 언덕에서 해 지는 걸 마저 볼게.', stranger());
      await narrate('소년은 모래 언덕 너머로 걸어가 보이지 않게 되었다. 이 사막 어딘가에서 또 만날지도 모른다.');
      G.State.log('사막의 야영지에서 배고픈 어린 왕자를 만났지만 그냥 보냈다.');
      return true;
    }
    var f = s.fleet, use = (R.dailyUse ? R.dailyUse() : 1) * K().food, gave = Math.min(f.food || 0, Math.max(1, Math.round(use)));
    f.food = Math.max(0, (f.food || 0) - gave);
    pc = shot('campfire', '별빛 아래 모닥불');
    try {
      await campfire();
      await UI.say('(입가에 기름을 묻힌 채) 맛있다! 별에서는 이런 걸 먹어 본 적이 없어. 내 별은 아주 작아서, 의자를 조금만 옮기면 하루에 해 지는 걸 마흔 번도 넘게 볼 수 있어.\f그런데 너희는 왜 이렇게 많아? 배에서 왔다고? 배는 뭘 먹고 바다를 건너? 바람? 바람은 어디서 와?', boy('happy'));
      await UI.say('바람은 바다 건너에서 오지. 우리는 그 바람으로 세상 끝까지 가 보려는 사람들이다.', me());
      await UI.say('세상 끝! 그거 정말 멋지다.\f…있잖아, 부탁이 하나 있어.', boy());
    } finally { if (pc) await pc.stop(); }
    return drawMap(lon, lat);
  }
  async function campfire() {
    var A = G.Art, cv = A && A.canvas ? A.canvas(720, 300) : null, l = S().loc, LS = G.Scenes.land;
    var win = UI.window({ title: '캠프파이어', icon: 'tent', width: 780, html: '<div class="campfire"><div class="cf-art"></div><div class="cf-text">' +
      '대원들이 모닥불에 말린 고기를 굽고 빵과 대추야자를 꺼냈다. 어린 왕자는 고기 한 점을 두 손으로 받아 들고 한참 들여다보더니 조심조심 먹기 시작한다. 모닥불 위로 사막의 별이 쏟아진다.' +
      '</div><div class="cf-res">식량을 나누어 주었다 — 어린 왕자가 모닥불 곁에서 배를 채운다</div></div>', buttons: [{ label: '어린 왕자의 이야기를 듣는다', value: 1, cls: 'navy' }] });
    var live = true, t0 = performance.now();
    if (cv && LS && LS.drawCampfire) {
      win.content.querySelector('.cf-art').appendChild(cv);
      (function loop() { if (!live) return; LS.drawCampfire(cv.getContext('2d'), 720, 300, (performance.now() - t0) / 1000, l.lon, { desert: true }); requestAnimationFrame(loop); })();
    }
    win.result.then(function () { live = false; });
    if (G.Audio) G.Audio.sfx('discover');
    await win.result;
  }

  // ---------------------------------------------------------------- ② 지도를 그려 줘
  async function drawMap(lon, lat) {
    var s = S(), p = st(), seed = U.strHash('lprince:' + s.day + ':' + Math.round(lon * 10) + ':' + Math.round(lat * 10));
    var sp = LP.pickSpot(lon, lat, seed), d = G.Geo.dist(lon, lat, sp.lon, sp.lat);
    var dw = dirWord(G.Geo.wrapLon(sp.lon - lon), sp.lat - lat), days = walkDays(d);
    var pc = shot('map', '별과 우물이 있는 지도');
    try {
      await UI.say('지도를 그려 줘!\f여기서 ' + dw + '쪽으로 ' + days + '밤쯤 걸어가면, 모래 언덕 셋이 나란히 누워 있는 데가 있어. 가운데 언덕 그늘에 우물이 숨어 있어. 도르래도 있고, 물이 아주 달아.\f우물가에 옛날 낙타 상인들이 묻어 두고 간 궤짝이 있어. 나는 무거워서 못 꺼냈어. 그런데 나는 지도를 못 그려. 네가 그려 줘.', boy());
      var sv = R.skillBest ? R.skillBest('survey') : null, svWho = sv && sv.who && sv.who !== '제독' ? sv.who : null;
      for (var n = 0; ; n++) {
        var v = await UI.ask('어린 왕자의 이야기를 듣고 지도를 그린다. 어떻게 그릴까?', [
          { label: '위도·경도와 방위, 걸음 수를 빼곡히 적은 정확한 지도', value: 'grown' },
          { label: '모래 언덕 셋과 우물, 그 위의 별을 그림으로 그린 지도', value: 'child' }], me());
        if (v === 'child' || n >= 2) break;
        if (n === 0) await UI.say((svWho ? '(' + svWho + U.jx(svWho, '이/가') + ' 옆에서 거들어 숫자를 적어 넣었다)\f' : '') + '…이건 숫자뿐이잖아. 어른들 지도는 다 이래. 우물이 몇 도 몇 분에 있는지는 적으면서, 물맛이 어떤지, 도르래가 무슨 소리를 내는지는 하나도 안 적어.\f다시 그려 줘. 그 우물이 어떻게 생겼는지 알 수 있게.', boy());
        else await UI.say('또 숫자야! …그래도 너 참 열심히 그린다. 마지막으로 한 번만 더 그려 줘.', boy());
      }
      p.phase = 'map'; p.tlon = sp.lon; p.tlat = sp.lat; p.seed = seed; p.at = s.day; p.dir = dw; p.days = days;
      await UI.say('바로 이거야! 언덕 셋, 우물, 그리고 내 별!\f봐, 이 지도 예쁘지? 사막도 그래 — 어딘가에 우물이 숨어 있으니까 그렇게 예쁜 거야.', boy('happy'));
    } finally { if (pc) await pc.stop(); }
    await LP.showMap();
    await UI.say('있잖아… 나도 같이 가도 돼? 지도를 따라가서 진짜로 우물을 찾는 거, 한 번도 해 본 적 없어. 정말 재미있을 것 같아!\f그리고 너희 배도 보고 싶어. 바람으로 가는 집이라니, 그런 건 어느 별에서도 못 봤어.', boy('happy'));
    var nmRow = G.Legend && G.Legend.join ? G.Legend.join(ID, null) : null;
    G.State.log('사막의 야영지에서 별에서 왔다는 어린 왕자에게 음식을 나눠 주고, 그가 말하는 우물의 지도를 그려 주었다. 어린 왕자가 따라왔다.', 'A');
    if (nmRow) {
      UI.toast('어린 왕자 — 동료가 되었다 (' + G.wageNote(ID) + ')', 'heart', 4200);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(ID); } catch (e) { console.error(e); } }
      await UI.say('좋아, 이제 나는 너희 배의 선원이야. 이 두건을 쓰고 왕자로 다니는 이유는… 우물을 찾으면 말해 줄게. 길은 내가 별을 보고 찾아 줄게.\f우물은 ' + dw + '쪽이야. 빨리 가자!', boy('happy'));
    }
    UI.toast('어린 왕자의 지도 — 우물은 여기서 ' + dw + '쪽, 걸어서 ' + days + '밤쯤 (수첩 「계약·의뢰」에서 지도를 펼칠 수 있다)', 'chest', 6500);
    return true;
  }

  // ---------------------------------------------------------------- 지도
  function mapQ() { var p = st(); return { key: 'lprince', seed: p.seed || 1, tlon: p.tlon, tlat: p.tlat }; }
  /** 지도 캔버스: 보물 지도(js/systems/treasurehunt.js)와 같은 땅 그림 위에 아이가 좋아하는 별과 언덕·우물을 그린다 */
  LP.mapCanvas = function (w, h) {
    w = w || 720; h = h || 480;
    var TH = G.TreasureHunt, base = TH && TH.mapCanvas ? TH.mapCanvas(mapQ(), w, h) : null;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d');
    if (base) g.drawImage(base, 0, 0);
    else { g.fillStyle = '#e6d2a4'; g.fillRect(0, 0, w, h); }
    // 모래 언덕 셋과 우물 (지도의 X 곁 — 아이 그림처럼 굵은 선)
    // X 자리 (js/systems/treasurehunt.js TH.mapCanvas 와 같은 셈 — 첫 두 난수가 지도 가운데를 비킨다)
    var q = mapQ(), r0 = U.makeRng(q.seed >>> 0), span = ((G.BALANCE.treasureHunt || {}).mapSpan) || 6.5, kx = Math.cos(q.tlat * Math.PI / 180);
    var mcx = q.tlon + (r0() - 0.5) * span * 0.36, mcy = q.tlat + (r0() - 0.5) * span * (h / w) * kx * 0.36;
    var xx = (G.Geo.wrapLon(q.tlon - mcx) / span + 0.5) * w, xy = (0.5 - (q.tlat - mcy) / (span * (h / w) * kx)) * h;
    var rng = U.makeRng((st().seed || 1) + 11), x0 = U.clamp(xx - 46, 60, w - 150), y0 = U.clamp(xy + 52, 90, h - 40);
    g.lineWidth = 3; g.strokeStyle = 'rgba(120,70,20,.85)'; g.fillStyle = 'rgba(214,160,70,.55)';
    for (var i = 0; i < 3; i++) { var bx = x0 + i * 46; g.beginPath(); g.moveTo(bx - 34, y0); g.quadraticCurveTo(bx, y0 - 40 - (i === 1 ? 10 : 0), bx + 34, y0); g.closePath(); g.fill(); g.stroke(); }
    var wx = x0 + 46, wy = y0 + 18;
    g.fillStyle = 'rgba(90,60,30,.9)'; g.fillRect(wx - 10, wy - 8, 20, 12); g.beginPath(); g.moveTo(wx - 12, wy - 8); g.lineTo(wx - 12, wy - 26); g.lineTo(wx + 12, wy - 26); g.lineTo(wx + 12, wy - 8); g.strokeStyle = 'rgba(90,60,30,.9)'; g.lineWidth = 2; g.stroke();
    // 별 (위에 크게) — 「내 별」
    function star(cx, cy, r, col) { g.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(140,90,10,.9)'; g.lineWidth = 1.5; g.stroke(); }
    star(w * 0.84, h * 0.18, 22, 'rgba(250,210,80,.95)');
    for (var j = 0; j < 6; j++) star(w * (0.55 + rng() * 0.4), h * (0.08 + rng() * 0.22), 5 + rng() * 4, 'rgba(250,220,120,.85)');
    g.font = '18px serif'; g.fillStyle = 'rgba(110,60,20,.9)'; g.fillText('우물', wx - 16, wy + 26);
    return cv;
  };
  /** 지도를 펼친다 */
  LP.showMap = async function () {
    var p = st(); if (p.tlon == null) return;
    var s = S(), l = s.loc, here = l && l.mode === 'land' && l.lon != null;
    var where = here ? '지금 자리에서 ' + dirWord(G.Geo.wrapLon(p.tlon - l.lon), p.tlat - l.lat) + '쪽, 약 ' + walkDays(G.Geo.dist(l.lon, l.lat, p.tlon, p.tlat)) + '밤 거리' : '만난 야영지에서 ' + (p.dir || '') + '쪽, 걸어서 ' + (p.days || '') + '밤쯤';
    var win = UI.window({ title: '어린 왕자의 지도', icon: 'chest', width: 780, clickAny: true,
      html: '<div class="tmap-wrap"></div><div class="tmap-note">' + (p.phase === 'done' ? '<b>우물가의 보물을 찾았다.</b>' : '<b>모래 언덕 셋 사이의 숨은 우물</b> — ' + where + '<br><span class="muted">우물가를 파면 옛 낙타 상인들이 묻어 둔 궤짝이 나온다고 한다 (금화 약 ' + U.num(K().reward) + '닢). 가까이 가면 날마다 방향을 일러 준다.</span>') + '</div>',
      buttons: [{ label: '지도를 접는다', value: 1, cls: 'navy' }] });
    var cv = LP.mapCanvas(720, 480); cv.className = 'tmap-cv';
    win.content.querySelector('.tmap-wrap').appendChild(cv);
    return win.result;
  };
  /** 수첩 「계약·의뢰」에 붙는 줄 (js/ui/info.js) */
  LP.html = function () {
    var p = S() && st(); if (!p || p.phase !== 'map') return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">어린 왕자의 지도</h4><div class="hint-item"><div class="flex"><span class="nm">' + G.icon('chest') + ' 사막에 숨은 우물</span><span class="right muted" style="font-size:14px">보물 약 ' + U.num(K().reward) + '닢</span></div>' +
      '<div class="tx">만난 야영지에서 ' + U.esc(p.dir || '') + '쪽, 걸어서 ' + (p.days || '') + '밤쯤 — 모래 언덕 셋 사이 <button class="btn small" onclick="G.LittlePrince.showMap()">지도를 펼친다</button></div></div>';
  };

  // ---------------------------------------------------------------- ④ 우물가의 보물
  /** 뭍: 날마다 (js/scenes/land.js runDay). 가까우면 방향을 일러 주고, 우물가에 서면 판다 */
  LP.onLand = async function (lon, lat, hooks) {
    var s = S(), p = st(); if (!s || p.phase !== 'map' || p.tlon == null) return false;
    var d = G.Geo.dist(lon, lat, p.tlon, p.tlat), k = K();
    if (d > k.hintR) return false;
    var with_ = !!row(), sp = with_ ? boy() : (G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('surveyor') : { name: '측량사' });
    if (d > k.digR) {
      var dw = dirWord(G.Geo.wrapLon(p.tlon - lon), p.tlat - lat), far = d < 0.7 ? '바로 코앞' : d < 1.1 ? '반나절 거리' : '하루 남짓 거리';
      if (p.lastHint !== dw + far) { p.lastHint = dw + far; UI.toast(sp.name + ': ' + (with_ ? '저기 봐! 언덕이 지도랑 닮았어. 우물은 ' + dw + '쪽, ' + far + '야!' : '어린 왕자의 지도에 그린 언덕이 보입니다. 우물은 ' + dw + '쪽, ' + far + '입니다.'), 'chest', 5200); }
      return false;
    }
    if (hooks && hooks.stop) hooks.stop();
    await dig(with_);
    return true;
  };
  async function dig(with_) {
    var s = S(), p = st(), gold = K().reward, pc = shot('well', '사막에 숨은 우물');
    try {
      await narrate('모래 언덕 셋이 나란히 누운 곳 — 가운데 언덕 그늘에 돌을 둥글게 쌓은 우물이 있다. 낡은 도르래와 밧줄, 두레박까지 그대로다. 마을도 대상의 길도 없는 사막 한가운데에.');
      if (with_) await UI.say('찾았다! 내가 말한 그대로지?\f도르래를 돌려 봐. 우물이 노래해! …물맛 좀 봐, 아주 달아. 걸어서 온 다음이라 더 단 거야.', boy('happy'));
      else await UI.say('어린 왕자가 말한 그대로입니다, 제독. 언덕 셋, 도르래 우물… 우물가를 파 보겠습니다.', first());
      s.player.gold += gold;
      var fame = G.Fame && G.Fame.add ? G.Fame.add('ex', 30) : 0;
      s.stats.treasures = (s.stats.treasures || 0) + 1;
      p.phase = 'done'; p.found = s.day;
      if (G.Audio) { G.Audio.sfx('latch'); setTimeout(function () { if (G.Audio) G.Audio.sfx('prize'); }, 330); }
      await UI.alert('<div style="font-size:19px;line-height:1.7">우물가 모래 밑에서 쇠띠를 두른 궤짝 세 개가 나왔다!<br>옛 낙타 상인들이 모래 폭풍을 피해 묻어 두고 끝내 찾으러 오지 못한 금화와 은괴다.<br><br><b>금화 ' + U.num(gold) + '닢</b>을 손에 넣었다.' + (fame ? ' (명성 +' + fame + ')' : '') + '</div>', '어린 왕자의 우물');
      G.State.log('어린 왕자의 지도를 따라 사막 속 숨은 우물을 찾아, 우물가에서 금화 ' + U.num(gold) + '닢을 파냈다.', 'A');
      if (with_) await UI.say('금화가 이렇게 많은데, 나는 아까 그 물 한 모금이 더 좋았어. 이상하지?\f…그래도 너희가 기뻐하니까 나도 좋아.', boy('happy'));
    } finally { if (pc) await pc.stop(); }
    await reveal(with_);
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ---------------------------------------------------------------- ⑤ 마지막: 남장 여자인 어린 왕자
  /** 우물을 찾은 뒤에 정체를 밝힌다. 그 자리에 없으면 지도 뒷면의 글씨로 */
  async function reveal(with_) {
    var p = st(); if (p.revealed) return;
    p.revealed = true;
    if (!with_) {
      await narrate('지도를 접다가 뒷면에 가느다란 글씨가 적혀 있는 것을 보았다. 지도를 그리던 밤, 어린 왕자가 몰래 써 둔 것이다.\f「우물을 찾으면 말하려고 했어. 사실 나 여자야. 혼자 별을 여행하는 여자아이한테는 다들 집에 가라고만 해서, 두건으로 머리를 가리고 왕자로 다녔어. 그래도 계속 「어린 왕자」라고 불러 줘. — 어린 왕자」');
      G.State.log('어린 왕자의 지도 뒷면에서 그 아이가 남긴 글을 보았다 — 왕자로 다니던 소녀였다.', 'D');
      return;
    }
    var pc = shot('reveal', '어린 왕자의 비밀');
    try {
      await UI.say('…있잖아. 우물을 찾으면 말하려고 한 게 있어. 거짓말하는 선원은 안 되잖아.', boy());
      await narrate('어린 왕자가 늘 머리에 둘렀던 푸른 꽃무늬 두건을 뒤로 젖힌다. 감춰 두었던 머리칼을 쓸어 넘기고 우물물로 얼굴을 씻는다. 제독 일행은 그제야 소년 왕자라 믿었던 이가 소녀였음을 알아본다.');
      await UI.say('사실 나 여자야.\f혼자 별을 여행하는 여자아이한테는 다들 「집에 가라」고만 해. 그런데 왕자라고 하면 길을 물어봐 주고 지도 이야기도 해 줘. 그래서 별을 떠날 때부터 두건으로 머리를 가리고 왕자로 다녔어.', boy());
      await UI.say('…그, 그럼 사막을 건너는 내내 「꼬마 녀석」이라고 부른 건 전부… 실례했습니다, 아가씨.', first());
      await UI.say('아가씨 말고 「어린 왕자」라고 불러 줘. 두건과 옷도 이대로 입을 거야 — 이 차림이 제일 편하고, 제일 멋지거든.', boy('happy'));
      var v = await UI.ask('「여자라서 이제 배에서 내리라고 할 거야?」 — 어린 왕자가 두건 자락을 쥔 채 올려다본다.', [
        { label: '「어린 왕자든 아가씨든, 별을 보고 길을 찾는 선원이면 우리 배에 있어야지.」', value: 'yes' },
        { label: '「배 위는 험하다. 그래도 남겠다면 말리지 않겠다.」', value: 'ok' }], me());
      if (v === 'ok') await UI.say('험한 건 괜찮아. 내 별에서는 바오바브나무 싹이 날마다 올라와서, 그걸 뽑느라 손이 다 거칠어졌는걸.\f…그래도 고마워. 집에 가라고 안 해서.', boy());
      else await UI.say('…거봐, 너는 숫자만 좋아하는 어른이 아니라니까!\f다음엔 어디 가? 바다 끝? 같이 가자!', boy('happy'));
      var m = (S().mates || []).filter(function (x) { return x.id === ID; })[0];
      if (m) m.loyal = Math.min(100, (m.loyal || 80) + 10);
      UI.toast('어린 왕자 — 왕자로 다니던 소녀였다 (충성 +10)', 'heart', 4600);
      G.State.log('사막의 우물가에서 어린 왕자가 두건을 젖혔다 — 왕자로 다니던 소녀였다.', 'D');
    } finally { if (pc) await pc.stop(); }
  }
  LP.reveal = reveal;
  /** 성별: 밝히기 전에는 남자(소년)로, 밝힌 뒤에는 여자로 (js/data/littleprince.js 의 g) */
  LP.gender = function () { var s = S(); return s && s.lprince && s.lprince.revealed ? 'f' : 'm'; };
})(window.G = window.G || {});
