/* 조합 의뢰 「보물 찾기」 (G.TreasureHunt) — 대항해시대 2처럼 조합에서 보물 지도를 받아, 지도에 그려진 섬·해안을 찾아가
   상륙해서 X 표시된 곳을 파면 보물(금화 1만~10만 닢)이 나온다.
   · 지도: 그 자리를 크게 확대한 중세 해도(포르톨라노) 풍 — 양피지, 잉크 해안선과 물가 빗금, 나침반 장미와 방위선, 산·숲 그림, 붉은 X.
     경위도는 적혀 있지 않다. 조합장이 「○○에서 ○쪽, 뱃길로 ○일쯤」이라고 일러 준다.
   · 받을 때 지도값(사례의 4%)을 낸다. 기한 안에 찾지 못하면 다른 조합 의뢰처럼 명성이 깎인다.
   · 바다에서 가까이(1.2° 안) 가면 항해사가, 상륙해서 1.5° 안이면 날마다 측량사가 방향을 일러 주고, 0.35° 안에 들면 판다.
   조정값: G.BALANCE.treasureHunt (아래 DEF). 의뢰 상태는 state.quests (js/systems/quest.js — 이 파일이 kind 'treasure'를 더한다). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var TH = {};
  G.TreasureHunt = TH;
  function S() { return G.Game.state; }
  var DEF = {
    chance: 0.55,          // 조합 게시판(열흘마다)에 보물 지도가 붙을 확률
    minFame: 0,            // 이 명성부터 보물 지도를 준다
    minD: 4, maxD: 38,     // 조합 도시에서 보물까지 거리(°)
    reward: [10000, 100000],
    feeK: 0.04,            // 지도값 = 사례 × feeK
    digR: 0.35,            // 이만큼(°) 안에 들면 판다
    seaHintR: 0.9,         // 바다에서 항해사가 해안선을 알아보는 거리
    evChance: 0.4,         // 술집에서 정보를 물을 때 지도의 증거를 들을 확률 (보물에서 20° 안 도시면 +0.2, 웅변 단계마다 +0.05)
    landHintR: 1.6,        // 상륙해서 측량사가 방향을 일러 주는 거리
    mapSpan: 6.5           // 지도에 담는 가로 폭(°, 경도 — 위도에 따라 늘린다)
  };
  function B() { var b = G.BALANCE && G.BALANCE.treasureHunt, o = {}; for (var k in DEF) o[k] = b && b[k] != null ? b[k] : DEF[k]; return o; }
  TH.KIND = { name: '보물 찾기', icon: 'chest', desc: '조합이 손에 넣은 보물 지도를 받아, 지도에 그려진 섬·해안을 찾아가 상륙해서 X 표시된 곳을 판다.' };

  // ---------------------------------------------------------------- 보물 자리 고르기
  /** 섬이나 해안가: 뭍이지만 바다가 0.1~0.35° 안에 있고, 도시와는 떨어진 곳. 둘레에 뭍이 적은 곳(섬)을 더 반긴다 */
  function landFrac(lon, lat, r) {
    var n = 0, k = 0;
    for (var dy = -r; dy <= r; dy += r / 3) for (var dx = -r; dx <= r; dx += r / 3) { k++; if (G.Geo.isLand(lon + dx, lat + dy)) n++; }
    return n / k;
  }
  function pickSpot(rng, from) {
    var b = B(), ns = G.Nav && G.Nav.ready() ? G.Nav.nearestSea(from.lon, from.lat, 12) : null;
    if (G.Nav && G.Nav.ready() && !ns) return null;      // 바다가 먼 내륙 도시(아가데스 같은 사막의 대상 도시)의 조합에는 보물 지도가 없다
    var want = ns ? G.Nav.component(ns[0], ns[1]) : null;
    for (var tries = 0; tries < 900; tries++) {
      var a = rng() * Math.PI * 2, d = b.minD + rng() * (b.maxD - b.minD);
      var lon = G.Geo.wrapLon ? G.Geo.wrapLon(from.lon + Math.cos(a) * d) : from.lon + Math.cos(a) * d, lat = from.lat + Math.sin(a) * d * 0.75;
      if (Math.abs(lat) > 60) continue;
      var s = G.Geo.sdf(lon, lat);
      if (s < 1 || s > 4) continue;                                  // 해안에서 0.1~0.35° 안쪽 뭍
      if (G.CITY_DATA.some(function (c) { return c && G.Geo.dist(c.lon, c.lat, lon, lat) < 0.9; })) continue;
      var fr = landFrac(lon, lat, 1.5);
      if (fr > 0.55 && rng() < 0.75) continue;                       // 큰 대륙 안쪽보다 섬·곶을
      var sea = G.Nav ? G.Nav.nearestSea(lon, lat, 6) : null;
      if (!sea || G.Geo.dist(sea[0], sea[1], lon, lat) > 0.6) continue;
      if (want != null && G.Nav.component(sea[0], sea[1]) !== want) continue;   // 그 조합에서 배로 갈 수 있는 바다
      return { lon: +lon.toFixed(3), lat: +lat.toFixed(3), island: fr < 0.3, d: d };
    }
    return null;
  }
  var DIRS = ['동', '북동', '북', '북서', '서', '남서', '남', '남동'];
  function dirWord(dx, dy) { var a = Math.atan2(dy, dx); return DIRS[(Math.round(a / (Math.PI / 4)) + 8) % 8]; }
  TH.dirWord = dirWord;
  /** 지도를 읽는 실마리: 가장 가까운(이름이 알려진) 항구에서 어느 쪽, 뱃길 며칠 */
  function hintOf(q) {
    var s = S(), best = null, bd = 1e9;
    G.CITY_DATA.forEach(function (c) {
      if (!c || !c.port || (R.cityExists && !R.cityExists(c))) return;
      var d = G.Geo.dist(c.lon, c.lat, q.tlon, q.tlat), known = s.known.indexOf(c.id) >= 0;
      if (!known) d += 2.5;                                          // 아는 항구를 먼저
      if (d < bd) { bd = d; best = c; }
    });
    if (!best) return '';
    var dd = G.Geo.dist(best.lon, best.lat, q.tlon, q.tlat), days = Math.max(1, Math.round(dd / 1.0));
    return best.name + '에서 ' + dirWord(G.Geo.wrapLon ? G.Geo.wrapLon(q.tlon - best.lon) : q.tlon - best.lon, q.tlat - best.lat) + '쪽, 뱃길로 ' + days + '일쯤 되는 ' + (q.island ? '섬' : '해안');
  }

  // ---------------------------------------------------------------- 실마리: 술집의 증거 → 부하들과 추론 (측량 실력만큼 좁힌다)
  /* 지도만으로는 어디인지 모른다. 술집 주인에게 정보를 물으면 가끔(확률) 지도에 대한 증거를 하나씩 이야기한다 (q.ev).
     「부하들과 지도를 살핀다」: 측량에 가장 밝은 사람이 증거를 엮어 자리를 좁힌다 — 측량 0단계는 대륙까지, 1단계 나라(땅)까지,
     2단계 가까운 항구까지, 3단계 위도·경도까지. 증거가 모자라면 그만큼만. 좁힌 것은 q.clue (0~4) */
  var CONT = ['유럽 서쪽(이베리아)', '유럽 북쪽', '지중해', '아프리카', '아라비아·중근동', '인도양', '동아시아(중국)', '중앙아시아', '동남아시아', '동아시아(일본 바다)', '신대륙'];
  function nearCity(q, portOnly) {
    var best = null, bd = 1e9;
    G.CITY_DATA.forEach(function (c) { if (!c || (portOnly && !c.port) || (R.cityExists && !R.cityExists(c))) return; var d = G.Geo.dist(c.lon, c.lat, q.tlon, q.tlat); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  function placeWord(q) { return q.island ? '섬' : '해안'; }
  function contOf(q) { var c = nearCity(q); return c ? (CONT[c.region] || G.REGIONS[c.region]) : '먼 바다'; }
  function landOf(q) { var c = nearCity(q); if (!c) return '어느 나라'; var o = R.cityOwner ? R.cityOwner(c) : c.nation; return (o || '') + (G.REGIONS[c.region] ? ' 땅(' + G.REGIONS[c.region] + ')' : ' 땅'); }
  function latlon(q) {
    var r = function (v) { return (Math.round(Math.abs(v) * 2) / 2).toFixed(1); };
    return (q.tlat >= 0 ? '북위 ' : '남위 ') + r(q.tlat) + '°, ' + (q.tlon >= 0 ? '동경 ' : '서경 ') + r(q.tlon) + '°';
  }
  /** 좁힌 단계마다의 결론 */
  TH.clueText = function (q, lv) {
    if (lv >= 4) return latlon(q) + ' 언저리의 ' + placeWord(q) + ' — ' + hintOf(q);
    if (lv === 3) return hintOf(q);
    if (lv === 2) return landOf(q) + '의 ' + placeWord(q);
    if (lv === 1) return contOf(q) + ' 어딘가의 ' + placeWord(q);
    return '';
  };
  TH.clueLabel = ['아직 어디인지 모른다', '대륙', '나라', '항구 근처', '위도·경도'];
  /** n번째 증거 (술집에서 듣는 이야기) — 차례대로 대륙·나라·항구·천측의 실마리가 된다 */
  function evidence(q, n) {
    var c = nearCity(q), p = nearCity(q, true), rng = U.makeRng((q.seed || 1) + n * 31);
    var lang = c && G.LANGS && G.LANGS[c.lang] ? G.LANGS[c.lang] : '낯선 나라';
    var star = q.tlat >= 0 ? '북극성' : '남쪽 하늘의 별';
    var L = [
      ['그 지도? 방위선 끝에 그려 넣은 바람 얼굴 장식 말이야, ' + contOf(q) + ' 바다를 다니는 지도장이들 버릇이지. 그쪽 바다를 그린 걸세.',
       '그 지도를 그린 해적 말인가… ' + contOf(q) + ' 바다를 휘젓던 놈이라고 들었네.'],
      ['지도 뒷면에 희미한 글씨가 있다지? 들은 바로는 ' + lang + '로 적혀 있다더군. 그 말을 쓰는 땅 어딘가겠지.',
       '그 지도를 판 사람이 ' + lang + ' 억양이 섞인 사내였다던데. 그 나라 바닷가에서 주웠다고 하더군.'],
      ['그 지도의 곶 모양… 늙은 선원 하나가 ' + (p ? p.name : '어느 항구') + ' 근처에서 비슷한 해안을 봤다고 떠들더군.',
       (p ? p.name : '어느 항구') + ' 뱃사람들 사이에 그 바위 이야기가 돈다네. X 옆의 바위 말이야.'],
      ['지도 귀퉁이 숫자 말인가? 그건 천측 기록일세. ' + star + ' 높이와 해 뜨는 시각을 적어 둔 거지. 측량에 밝은 사람이면 자리를 셈해 낼 수 있을 걸세.',
       '그 숫자들은 아스트롤라베로 잰 값이라더군. 제대로 읽을 줄 아는 사람이 있으면 위도와 경도가 나오지.']
    ];
    var a = L[Math.min(n, 3)];
    return a[Math.floor(rng() * a.length)];
  }
  /** 술집: 보물 지도를 들고 있으면 정보를 물을 때 이 이야기 (증거를 들을 확률: 기본 + 보물 가까운 도시면 더) */
  TH.tavern = async function (c, talk) {
    var s = S(), ls = TH.list().filter(function (q) { return (q.ev || []).length < 4; });
    if (!ls.length) { await talk('그 지도 이야기라면 내가 아는 건 다 말해 줬네.'); return; }
    var q = ls[0];
    if (ls.length > 1) { q = await UI.choose('어느 지도를 물을까', ls.map(function (x) { return { label: x.title, right: x.city + ' 조합', value: x, icon: 'chest' }; }), { width: 520 }); if (!q) return; }
    q.ev = q.ev || [];
    var near = G.Geo.dist(c.lon, c.lat, q.tlon, q.tlat) < 20, p = (B().evChance || 0.4) + (near ? 0.2 : 0) + R.skill('speech') * 0.05;
    q.asked = (q.asked || 0) + 1;
    if (!U.chance(p)) {
      await talk(U.pick(['보물 지도라… 그런 건 열에 아홉은 가짜일세. 들은 게 없네.', '글쎄, 그런 지도 이야기는 처음 듣는군. 다른 항구 술집에서도 물어보게.', '요즘 손님들 입에서 그런 이야기는 안 나오는군. 며칠 뒤에 다시 와 보게.']));
      return;
    }
    var line = evidence(q, q.ev.length);
    q.ev.push(line);
    await talk(line);
    UI.toast('보물 지도의 증거를 들었다 (' + q.ev.length + '/4). 수첩에서 지도를 펼쳐 부하들과 살펴보자.', 'chest', 5200);
    G.State.log('술집에서 보물 지도의 실마리를 들었다 — ' + q.title);
  };
  /** 「부하들과 지도를 살핀다」 */
  TH.deduce = async function (q) {
    q.ev = q.ev || []; q.clue = q.clue || 0;
    var sv = G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('surveyor') : { name: '측량사' }, fm = G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : sv;
    var sk = R.skill('survey'), cap = Math.min(4, 1 + sk), can = Math.min(cap, q.ev.length);
    if (!q.ev.length) { await UI.say('제독, 지도 하나만 봐서는 어디인지 알 수가 없습니다. 해안선 모양이야 또렷하지만 이런 곶은 어느 바다에나 있지요.\f항구 술집에서 이 지도 이야기를 물어보시죠. 증거가 모이면 자리를 좁혀 보겠습니다.', sv); return; }
    if (can <= q.clue) {
      if (q.ev.length > cap) await UI.say('들어 온 증거는 꽤 되는데… 제 측량 솜씨로는 여기서 더 좁히기 어렵습니다.\f측량에 밝은 사람을 측량사로 두거나 지도 제작실에 앉히면 더 좁힐 수 있을 겁니다.', sv);
      else await UI.say('지금까지의 증거로는 여기까지입니다. 술집에서 이야기를 더 들어 오시면 좁혀 보겠습니다.', sv);
      return;
    }
    var pages = ['증거를 늘어놓고 지도와 견주어 보겠습니다.'];
    for (var lv = q.clue + 1; lv <= can; lv++) {
      if (lv === 1) pages.push('방위선과 장식으로 보아 이 지도는 「' + contOf(q) + '」 바다를 그린 겁니다.');
      if (lv === 2) pages.push('뒷면 글씨가 그 말이라면… ' + landOf(q) + '입니다. 해안선이 그 땅과 들어맞습니다.');
      if (lv === 3) pages.push('늙은 선원이 봤다는 곶과 바위 — 해도와 견주니 ' + hintOf(q) + '입니다.');
      if (lv === 4) pages.push('귀퉁이 천측 기록을 셈해 보았습니다. ' + latlon(q) + '. 이제 자리를 거의 짚을 수 있습니다!');
    }
    await UI.say(pages, sv);
    q.clue = can;
    var tail = can < 4 && q.ev.length <= can ? '증거가 더 모이면 더 좁힐 수 있을 겁니다.' : can < 4 ? '증거는 더 있지만 측량 솜씨가 더 있어야 좁힐 수 있겠군요.' : '';
    if (fm && fm.name !== sv.name) await UI.say(U.pick(['좋습니다. 해도에 적어 두지요. 그 언저리로 가 봅시다.', '역시 믿음직하군. 그쪽으로 뱃머리를 돌려 봅시다.', '거기까지 알았으면 반은 찾은 셈입니다.']) + (tail ? '\f' + tail : ''), fm);
    else if (tail) await UI.say(tail, sv);
    G.State.log('보물 지도의 자리를 좁혔다 — ' + TH.clueText(q, can));
  };

  // ---------------------------------------------------------------- 조합 의뢰에 붙이기 (js/systems/quest.js 감싸기)
  function make(c, blk) {
    var s = S(), b = B();
    if (s.player.fame < b.minFame) return null;
    var rng = U.makeRng(U.strHash('treasure' + c.id + ':' + blk));
    if (rng() > b.chance) return null;
    var sp = pickSpot(rng, c); if (!sp) return null;
    var r = b.reward, k = (sp.d - b.minD) / Math.max(1, b.maxD - b.minD);
    var pay = Math.round((r[0] + (r[1] - r[0]) * (0.6 * k + 0.4 * rng())) / 100) * 100;   // 멀수록 많다 (가까운 섬은 1만 닢 남짓)
    pay = U.clamp(pay, r[0], r[1]);
    var q = { key: c.id + ':' + blk + ':t', kind: 'treasure', from: c.id, city: c.name, to: c.id, tlon: sp.lon, tlat: sp.lat, island: sp.island,
      seed: Math.floor(rng() * 1e9), pay: pay, reward: pay, fee: Math.max(300, Math.round(pay * b.feeK / 100) * 100), fame: 10 + Math.round(pay / 5000) };
    q.dayNeed = Math.max(8, Math.round(sp.d / 1.05));
    q.limit = Math.round(q.dayNeed * 3) + 120;          // 실마리를 모으는 날까지 넉넉히
    q.title = (sp.island ? '섬' : '해안') + '에 묻힌 보물 (지도)';
    q.ev = []; q.clue = 0;                                // 어디인지는 조합도 모른다 — 술집에서 증거를 모아 부하들과 좁힌다
    return q;
  }
  function wrapQuest() {
    var Q = G.Quest; if (!Q || Q._th) return; Q._th = true;
    Q.KINDS.treasure = TH.KIND;
    var offers = Q.offers;
    Q.offers = function (c) {
      var out = offers.apply(this, arguments);
      try {
        var s = S(), blk = Math.floor(s.day / 10), q = make(c, blk);
        if (q && !Q.list().some(function (x) { return x.key === q.key; }) && !(s.questDone && s.questDone[q.key])) out.push(q);
      } catch (e) { console.error(e); }
      return out;
    };
    var canAccept = Q.canAccept;
    Q.canAccept = function (q) {
      var no = canAccept.apply(this, arguments); if (no) return no;
      if (q.kind === 'treasure' && S().player.gold < q.fee) return '지도값 금화 ' + U.num(q.fee) + '닢이 있어야 합니다.';
      return null;
    };
    var accept = Q.accept;
    Q.accept = function (q) {
      var k = accept.apply(this, arguments);
      if (k && k.kind === 'treasure') { S().player.gold -= k.fee; G.State.log('조합에서 보물 지도를 샀다 (금화 ' + U.num(k.fee) + '닢).'); if (G.Game.refreshHud) G.Game.refreshHud(); }
      return k;
    };
  }
  TH.list = function () { return G.Quest ? G.Quest.list().filter(function (q) { return q.kind === 'treasure'; }) : []; };

  // ---------------------------------------------------------------- 중세 해도 풍 보물 지도 (Canvas)
  var mapCache = {};
  function rngOf(seed) { return U.makeRng(seed >>> 0); }
  /** 보물 지도 캔버스 (w×h). 그 자리를 크게 확대해, 경위도 없이 해안선·섬·산과 X만 */
  TH.mapCanvas = function (q, w, h) {
    w = w || 720; h = h || 480;
    var key = q.key + ':' + w + 'x' + h;
    if (mapCache[key]) return mapCache[key];
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d'), rng = rngOf(q.seed || U.strHash(q.key)), b = B();
    var kx = Math.cos(q.tlat * Math.PI / 180), spanX = b.mapSpan, spanY = spanX * (h / w) * kx;
    // X는 가운데에서 조금 비켜 둔다 (지도마다 다르게)
    var cx = q.tlon + (rng() - 0.5) * spanX * 0.36, cy = q.tlat + (rng() - 0.5) * spanY * 0.36;
    function toLL(px, py) { return [cx + (px / w - 0.5) * spanX, cy - (py / h - 0.5) * spanY]; }
    function toPx(lon, lat) { var dx = G.Geo.wrapLon ? G.Geo.wrapLon(lon - cx) : lon - cx; return [(dx / spanX + 0.5) * w, (0.5 - (lat - cy) / spanY) * h]; }
    // 양피지
    var bg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.72);
    bg.addColorStop(0, '#efe0bb'); bg.addColorStop(0.7, '#dcc391'); bg.addColorStop(1, '#a98450');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 26; i++) {                               // 얼룩
      var sx = rng() * w, sy = rng() * h, sr = 20 + rng() * 90, st = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
      st.addColorStop(0, 'rgba(120,82,40,' + (0.03 + rng() * 0.06) + ')'); st.addColorStop(1, 'rgba(120,82,40,0)');
      g.fillStyle = st; g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
    // 뭍/물 칸 (2px)
    var S2 = 2, cols = Math.ceil(w / S2), rows = Math.ceil(h / S2), land = new Float32Array(cols * rows);
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) { var ll = toLL(x * S2 + 1, y * S2 + 1); land[y * cols + x] = G.Geo.sdf(ll[0], ll[1]); }
    function L(x, y) { x = U.clamp(x, 0, cols - 1); y = U.clamp(y, 0, rows - 1); return land[y * cols + x]; }
    // 뭍은 황토빛으로 칠하고(해안 쪽은 조금 짙게), 바다는 엷게 씻어 둔다
    var img = g.getImageData(0, 0, w, h), D = img.data, sea = document.createElement('canvas'); sea.width = w; sea.height = h;
    var sg = sea.getContext('2d'), sm = sg.createImageData(w, h), M = sm.data;
    for (var py = 0; py < h; py++) for (var px = 0; px < w; px++) {
      var v = L(px / S2 | 0, py / S2 | 0), o = (py * w + px) * 4;
      if (v > 0) {
        var n = 1, edgeK = v < 1.2 ? 0.78 : 1;
        D[o] = (D[o] * 0.35 + 196 * 0.65) * n * edgeK; D[o + 1] = (D[o + 1] * 0.35 + 166 * 0.65) * n * edgeK; D[o + 2] = (D[o + 2] * 0.35 + 104 * 0.65) * n * edgeK;
      } else {
        D[o] = D[o] * 0.9 + 214 * 0.1; D[o + 1] = D[o + 1] * 0.9 + 222 * 0.1; D[o + 2] = D[o + 2] * 0.9 + 206 * 0.1;
        M[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0); sg.putImageData(sm, 0, 0);
    // 뭍의 점찍기 (펜으로 톡톡)
    g.fillStyle = 'rgba(95,65,30,.22)';
    for (var dd = 0; dd < w * h / 90; dd++) { var dx2 = rng() * w, dy2 = rng() * h; if (L(dx2 / S2 | 0, dy2 / S2 | 0) > 0.6) g.fillRect(dx2, dy2, 1.2, 1.2); }
    // 바다: 나침반 장미에서 32갈래 방위선 (포르톨라노처럼 검정·초록·빨강) — 바다에만
    var rose = [w * (0.18 + rng() * 0.64), h * (0.2 + rng() * 0.6)];
    var tries = 0; while (tries++ < 40) { var rl = toLL(rose[0], rose[1]); if (G.Geo.sdf(rl[0], rl[1]) < -3) break; rose = [w * (0.12 + rng() * 0.76), h * (0.15 + rng() * 0.7)]; }
    var rh = document.createElement('canvas'); rh.width = w; rh.height = h; var rg = rh.getContext('2d');
    var RC = ['rgba(60,40,25,.42)', 'rgba(40,110,60,.42)', 'rgba(170,50,40,.42)'];
    for (var k = 0; k < 32; k++) {
      var a = k / 32 * Math.PI * 2; rg.strokeStyle = RC[k % 4 === 0 ? 0 : k % 2 === 0 ? 1 : 2]; rg.lineWidth = k % 4 === 0 ? 1.1 : 0.7;
      rg.beginPath(); rg.moveTo(rose[0], rose[1]); rg.lineTo(rose[0] + Math.cos(a) * w * 1.5, rose[1] + Math.sin(a) * w * 1.5); rg.stroke();
    }
    rg.globalCompositeOperation = 'destination-in'; rg.drawImage(sea, 0, 0);
    g.drawImage(rh, 0, 0);
    g.strokeStyle = 'rgba(70,45,22,.55)'; g.lineWidth = 1;
    for (y = 1; y < rows - 1; y += 2) for (x = 1; x < cols - 1; x += 2) {          // 물가 빗금 (바다 쪽으로)
      if (L(x, y) > 0) continue;
      var nb = (L(x + 2, y) > 0) || (L(x - 2, y) > 0) || (L(x, y + 2) > 0) || (L(x, y - 2) > 0);
      if (!nb || rng() < 0.35) continue;
      var gx = L(x + 1, y) - L(x - 1, y), gy = L(x, y + 1) - L(x, y - 1), gl = Math.hypot(gx, gy) || 1;
      var ln = 3 + rng() * 5; g.beginPath(); g.moveTo(x * S2, y * S2); g.lineTo(x * S2 - gx / gl * ln, y * S2 - gy / gl * ln); g.stroke();
    }
    g.fillStyle = 'rgba(55,32,16,.92)';                          // 해안선
    for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
      var a0 = L(x, y) > 0;
      if (a0 !== (L(x + 1, y) > 0) || a0 !== (L(x, y + 1) > 0)) g.fillRect(x * S2, y * S2, 2.2, 2.2);
    }
    // 산·숲 (손으로 그린 그림표)
    for (var m = 0; m < 260; m++) {
      var mx = rng() * w, my = rng() * h, ml = toLL(mx, my); if (G.Geo.sdf(ml[0], ml[1]) < 2) continue;
      var tr = G.Geo.terrain(ml[0], ml[1]);
      g.strokeStyle = 'rgba(70,45,22,.75)'; g.fillStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 1.2;
      if (tr === 'mountain' || tr === 'snow') { g.beginPath(); g.moveTo(mx - 7, my + 5); g.lineTo(mx, my - 7); g.lineTo(mx + 7, my + 5); g.fill(); g.stroke(); g.beginPath(); g.moveTo(mx, my - 7); g.lineTo(mx + 2, my + 5); g.stroke(); }
      else if ((tr === 'forest' || tr === 'jungle') && rng() < 0.7) { g.beginPath(); g.moveTo(mx - 4, my + 3); g.lineTo(mx, my - 6); g.lineTo(mx + 4, my + 3); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(mx, my + 3); g.lineTo(mx, my + 6); g.stroke(); }
    }
    // 바다의 물결 표시와 작은 배
    g.strokeStyle = 'rgba(70,55,40,.45)'; g.lineWidth = 1;
    for (m = 0; m < 40; m++) {
      var wx = rng() * w, wy = rng() * h, wl = toLL(wx, wy); if (G.Geo.sdf(wl[0], wl[1]) > -2) continue;
      g.beginPath(); g.moveTo(wx - 8, wy); g.quadraticCurveTo(wx - 4, wy - 4, wx, wy); g.quadraticCurveTo(wx + 4, wy + 4, wx + 8, wy); g.stroke();
    }
    // 나침반 장미
    g.save(); g.translate(rose[0], rose[1]);
    for (k = 0; k < 8; k++) {
      var aa = k / 8 * Math.PI * 2, len = k % 2 ? 18 : 34;
      g.fillStyle = k % 2 ? 'rgba(40,110,60,.85)' : 'rgba(150,40,30,.9)';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(aa - 0.22) * len * 0.3, Math.sin(aa - 0.22) * len * 0.3); g.lineTo(Math.cos(aa) * len, Math.sin(aa) * len); g.lineTo(Math.cos(aa + 0.22) * len * 0.3, Math.sin(aa + 0.22) * len * 0.3); g.closePath(); g.fill();
    }
    g.fillStyle = '#e9d6a8'; g.strokeStyle = 'rgba(60,40,25,.9)'; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(60,40,25,.9)'; g.font = '700 13px "Cinzel", serif'; g.textAlign = 'center'; g.fillText('N', 0, -40);   // 위가 북쪽
    g.restore();
    // X 표시 (붉은 잉크)와 점선 발자국
    var X = toPx(q.tlon, q.tlat);
    g.strokeStyle = 'rgba(165,28,22,.95)'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(X[0] - 11, X[1] - 11); g.lineTo(X[0] + 11, X[1] + 11); g.moveTo(X[0] + 11, X[1] - 11); g.lineTo(X[0] - 11, X[1] + 11); g.stroke();
    var shore = null;
    for (var rr = 4; rr < 120 && !shore; rr += 4) for (k = 0; k < 16; k++) { var q2 = [X[0] + Math.cos(k / 16 * 6.283) * rr, X[1] + Math.sin(k / 16 * 6.283) * rr], l2 = toLL(q2[0], q2[1]); if (G.Geo.sdf(l2[0], l2[1]) < -0.5) { shore = q2; break; } }
    if (shore) { g.setLineDash([3, 6]); g.lineWidth = 2; g.strokeStyle = 'rgba(165,28,22,.7)'; g.beginPath(); g.moveTo(shore[0], shore[1]); g.lineTo(X[0], X[1]); g.stroke(); g.setLineDash([]); }
    // 제목 띠와 라틴어 한 줄 (옛 지도처럼)
    g.fillStyle = 'rgba(236,222,186,.88)'; g.strokeStyle = 'rgba(80,50,25,.7)'; g.lineWidth = 1.5;   // 두루마리 띠
    g.beginPath(); g.moveTo(16, 14); g.lineTo(212, 14); g.quadraticCurveTo(222, 40, 212, 66); g.lineTo(16, 66); g.quadraticCurveTo(26, 40, 16, 14); g.fill(); g.stroke();
    g.fillStyle = 'rgba(60,38,18,.88)'; g.font = '700 22px "Nanum Myeongjo", serif'; g.textAlign = 'left';
    g.fillText('보물 지도', 22, 36);
    g.font = 'italic 15px "Cinzel", serif'; g.fillStyle = 'rgba(90,55,30,.75)';
    g.fillText(q.island ? 'Insula thesauri' : 'Hic iacet thesaurus', 24, 56);
    // 가장자리: 찢기고 그을린 테두리
    var edge = g.createLinearGradient(0, 0, 0, h);
    g.lineWidth = 14; g.strokeStyle = 'rgba(90,55,25,.35)'; g.strokeRect(0, 0, w, h);
    g.lineWidth = 2; g.strokeStyle = 'rgba(70,40,20,.8)'; g.strokeRect(10, 10, w - 20, h - 20);
    g.lineWidth = 1; g.strokeRect(15, 15, w - 30, h - 30);
    void edge;
    return (mapCache[key] = cv);
  };
  /** 지도를 펼쳐 보여 준다 */
  TH.show = async function (keyOrQ) {
    var q = typeof keyOrQ === 'string' ? (G.Quest.list().concat(TH._offered || []).filter(function (x) { return x.key === keyOrQ; })[0]) : keyOrQ;
    if (!q) return;
    var mine = G.Quest.list().indexOf(q) >= 0, left = mine ? G.Quest.remain(q) : null;
    var win = UI.window({ title: '보물 지도 — ' + U.esc(q.city) + ' 조합', icon: 'chest', width: 780, clickAny: true,
      html: '<div class="tmap-wrap"></div><div class="tmap-note">' + clueHtml(q) +
        '사례: 보물을 파내면 금화 약 <b>' + U.num(q.pay) + '</b>닢 · 명성 +' + G.Fame.mul(G.Fame.questCat('treasure'), q.fame) + (left != null ? ' · 남은 기한 ' + (left < 0 ? '지남' : left + '일') : ' · 기한 ' + q.limit + '일') +
        '<br><span class="muted">어디인지는 조합도 모른다. 항구 술집에서 정보를 물으면 가끔 이 지도의 증거를 듣는다 — 모인 증거를 부하들과 살펴 측량 실력만큼 자리를 좁힌다(대륙 → 나라 → 항구 근처 → 위도·경도). 가까이 가면 항해사가 해안선을 알아보고, 상륙해 X 자리에 서면 땅을 판다.</span></div>',
      buttons: mine ? [{ label: '부하들과 지도를 살핀다', value: 'deduce' }, { label: '지도를 접는다', value: 1, cls: 'navy' }] : [{ label: '지도를 접는다', value: 1, cls: 'navy' }] });
    var cv = TH.mapCanvas(q, 720, 480); cv.className = 'tmap-cv';
    win.content.querySelector('.tmap-wrap').appendChild(cv);
    var v = await win.result;
    if (v === 'deduce') { await TH.deduce(q); return TH.show(q); }
    return v;
  };
  function clueHtml(q) {
    var lv = q.clue || 0, ev = (q.ev || []).length;
    return '<b>알아낸 자리</b> <small class="muted">(들은 증거 ' + ev + '/4' + (lv ? ' · ' + TH.clueLabel[lv] + '까지' : '') + ')</small>: ' + (lv ? '<b>' + U.esc(TH.clueText(q, lv)) + '</b>' : '<span class="muted">아직 어디인지 모른다</span>') + '<br>';
  }
  TH.clueHtml = clueHtml;
  /** 수첩 「계약·의뢰」에 붙는 줄: 맡은 보물 지도마다 「지도를 펼친다」 */
  TH.html = function () {
    var ls = TH.list(); if (!ls.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">보물 지도</h4>' + ls.map(function (q) {
      return '<div class="hint-item"><div class="flex"><span class="nm">' + G.icon('chest') + ' ' + U.esc(q.title) + '</span><span class="right muted" style="font-size:14px">' + U.esc(q.city) + ' 조합 · 사례 ' + U.num(q.pay) + '닢</span></div>' +
        '<div class="tx">' + clueHtml(q) + ' <button class="btn small" onclick="G.TreasureHunt.show(\'' + q.key + '\')">지도를 펼친다</button></div></div>';
    }).join('');
  };

  // ---------------------------------------------------------------- 바다·뭍에서 찾기
  /** 바다: 보물 자리가 가까우면 항해사가 한 번 알아본다 (js/systems/explore.js의 망루 살피기에 얹는다) */
  TH.onSea = function (lon, lat) {
    TH.list().forEach(function (q) {
      if (q.seaTold) return;
      if (G.Geo.dist(lon, lat, q.tlon, q.tlat) > B().seaHintR) return;
      q.seaTold = true;
      var sp = G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('nav') : { name: '항해사' };
      UI.toast(sp.name + ': 제독, 저 해안선이 보물 지도와 꼭 닮았습니다! ' + dirWord(G.Geo.wrapLon ? G.Geo.wrapLon(q.tlon - lon) : q.tlon - lon, q.tlat - lat) + '쪽 해안에 배를 대고 상륙해 보시지요.', 'chest', 8000);
    });
  };
  /** 뭍: 날마다 (js/scenes/land.js runDay). 가까우면 방향을 일러 주고, X 자리에 서면 판다 */
  TH.onLand = async function (lon, lat, hooks) {
    var b = B();
    for (var i = 0; i < TH.list().length; i++) {
      var q = TH.list()[i], d = G.Geo.dist(lon, lat, q.tlon, q.tlat);
      if (d > b.landHintR) continue;
      var sv = G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('surveyor') : { name: '측량사' };
      if (d > b.digR) {
        var dw = dirWord(G.Geo.wrapLon ? G.Geo.wrapLon(q.tlon - lon) : q.tlon - lon, q.tlat - lat), far = d < 0.7 ? '바로 코앞' : d < 1.1 ? '반나절 거리' : '하루 남짓 거리';
        if (q.lastHint !== dw + far) { q.lastHint = dw + far; UI.toast(sv.name + ': 지도의 X는 여기서 ' + dw + '쪽, ' + far + '입니다.', 'chest', 5200); }
        continue;
      }
      if (hooks && hooks.stop) hooks.stop();
      await dig(q, sv);
      return;
    }
  };
  async function dig(q, sv) {
    var s = S();
    await UI.say('제독, 지도에 X로 그려진 바로 그 자리입니다! 저 바위와 나무가 지도 그대로군요.\f선원들에게 삽을 들려 파 보겠습니다.', sv);
    var cv = TH.mapCanvas(q, 720, 480);
    void cv;
    var gold = q.late ? Math.round(q.pay * 0.5) : q.pay;   // 기한을 넘겨 유예 기간에 찾았다: 조합 몫을 떼고 절반 (js/systems/quest.js)
    var rng = U.makeRng(q.seed + 7), finds = ['녹슨 쇠 상자', '밀랍으로 봉한 궤짝', '썩은 돛천에 싸인 항아리', '쇠사슬로 묶인 함'];
    var box = finds[Math.floor(rng() * finds.length)];
    s.player.gold += gold;
    var gotFame = G.Fame.add(G.Fame.questCat ? G.Fame.questCat('treasure') : 'ad', q.late ? Math.round(q.fame * 0.5) : q.fame);
    var i = G.Quest.list().indexOf(q); if (i >= 0) G.Quest.list().splice(i, 1);
    if (!s.questDone) s.questDone = {};
    s.questDone[q.key] = 'done';
    s.stats.quests = (s.stats.quests || 0) + 1;
    s.stats.treasures = (s.stats.treasures || 0) + 1;
    if (G.Audio) { G.Audio.sfx('latch'); setTimeout(function () { if (G.Audio) G.Audio.sfx('prize'); }, 330); }   // 상자 걸쇠를 열고 금화

    await UI.alert('<div style="font-size:19px;line-height:1.7">땅속 깊이에서 ' + box + U.jx(box, '이/가') + ' 나왔다!<br>안에는 금화와 은괴, 보석이 가득하다.<br><br><b>금화 ' + U.num(gold) + '닢</b>을 손에 넣었다. (명성 +' + gotFame + ')</div>', '보물 발견');
    G.State.log(q.city + ' 조합의 보물 지도대로 보물을 찾았다 — 금화 ' + U.num(gold) + '닢.');
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  TH._dig = dig;

  // 조합 의뢰 모듈이 먼저 읽힌 뒤 감싼다. 바다의 망루 살피기(하루 한 번)에 보물 자리 알아보기를 얹는다.
  function hookExplore() {
    var E = G.Explore; if (!E || E._th) return; E._th = true;
    var sense = E.sense;
    E.sense = function (mode, lon, lat) {
      var out = sense.apply(this, arguments);
      if (mode === 'sea') { try { TH.onSea(lon, lat); } catch (e) { console.error(e); } }
      return out;
    };
  }
  function hookFame() {
    var F = G.Fame; if (!F || F._th) return; F._th = true;
    var qc = F.questCat; F.questCat = function (kind) { return kind === 'treasure' ? 'ex' : qc.apply(this, arguments); };   // 보물 찾기는 탐험 명성
  }
  /** 술집 「정보를 묻는다」: 보물 지도를 들고 있으면 지도 이야기도 물을 수 있다 (계약이 없어도) */
  function hookTavern() {
    var T = G.Scenes && G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.tavern; if (!T || !T.info || T._th) return; T._th = true;
    var info = T.info;
    T.info = async function (c) {
      if (!TH.list().length) return info.apply(this, arguments);
      var C = G.Scenes.city, cur = C.current ? C.current() : {}, s = S();
      var m = C.npc ? C.npc('tavernkeeper', '술집 주인') : { name: '술집 주인' };
      var talk = function (t) { return C.say ? C.say(m, t) : UI.say(t, m); };
      if (C.langLv && C.langLv(c) === 0) return info.apply(this, arguments);
      var what = 'map';
      if (s.contract) { what = await UI.choose('무엇을 물을까', [{ label: '계약한 일', value: 'k', icon: 'scroll' }, { label: '보물 지도', value: 'map', icon: 'chest' }], { width: 420 }); if (!what) return; }
      if (what === 'k') return info.apply(this, arguments);
      if ((cur.asked || 0) >= 2) { await talk('정보? 오늘은 더 이상 그런 것은 없네.'); return; }
      var price = 20 + c.size * 15;
      var v = C.ask ? await C.ask(m, '보물 지도라고? 자, 우리 가게 술을 마시면 들은 대로 말해 주지. 한 잔에 금화 ' + price + '닢이네.', [{ label: '술을 산다', value: 1 }, { label: '그만둔다', value: 0 }]) : 1;
      if (!v) return;
      if (s.player.gold < price) { await talk('돈 먼저 지불하게.'); return; }
      s.player.gold -= price; cur.asked = (cur.asked || 0) + 1;
      await TH.tavern(c, talk);
    };
  }
  function hookLate() { try { hookTavern(); } catch (e) { console.error(e); } }
  if (typeof document !== 'undefined' && document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookLate); else setTimeout(hookLate, 0);
  wrapQuest(); hookExplore(); hookFame();
  TH.init = function () { wrapQuest(); hookExplore(); hookFame(); hookTavern(); };
})(window.G = window.G || {});
