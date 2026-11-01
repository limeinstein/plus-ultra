/* 후금 건국·청 국호 선포 (G.Houjin) 2026-11-01 사용자 요청
   사람·소지품·조정값: js/data/houjin.js (G.HIST_FIG hj_* · houjin_cannon · houjin_seal · G.BALANCE.houjin)
   날짜는 게임의 양력이다 (후금 건국 1616.2.17 · 영원성 1626.2.19 · 대청 1636.5.15). 1644년 북경의 일은 js/systems/mingfall.js, 1627·1636년 조선 침공은 정묘·병자호란 사건이 맡는다
   ■ ① 허투알라의 칸 (1616.1.1~1617.12.31, 국내성·길림 또는 허투알라 둘레의 뭍 124.83, 41.66): 누르하치가 팔기를 거느리고 칸에 오른다 — 천명(天命).
        남만 선장에게 무엇을 가져왔느냐 묻는다 → (가) 교역품 총을 비싸게 판다(악명) — 칸의 통행 패 (나) 인삼과 담비 가죽을 산다 (다) 구경만 한다
   ■ ② 영원성의 홍이포 (1625.6.1~1626.2.21, 요동·북경): 원숭환의 군관이 서양 대포를 구한다 → 교역품 대포를 넘기거나, 오문(마카오)의 보카로 주조장에서 홍이포를 사 온다
        → 영원성 싸움 (육상전) — 홍이포에 맞은 누르하치가 물러난다 (이기든 지든 역사 그대로 성은 버틴다). 기한을 넘기면 끝
   ■ ③ 원숭환의 옥 (1630.1.13~9.21, 북경 — 영원성을 함께 지켰으면): 홍타이지의 이간책에 걸린 원숭환이 옥에 갇혔다 → 뇌물 / 감옥을 깬다(육상전) / 그만둔다
        빼내면 원숭환이 세상에서 사라져 제독의 배에 오른다 (동료, 1650년까지)
   ■ ④ 대청 (1636.5.15~1637.12.31, 심양): 홍타이지가 차하르의 옥새를 받고 황제에 올라 나라 이름을 대청으로 — 조선 사신 나덕헌·이확이 절하지 않는다
        → 사신을 감싼다 / 지켜본다 · 홍타이지가 명을 칠 배를 빌려 달라 한다 → 빌려준다(금화·악명) / 거절
        (s.houjin.envoys — 병자호란 사건이 읽을 수 있다)
   ■ 소식: 후금 건국(1616.2.17) · 칠대한(1618.5.7) · 사르후(1619.4.18) · 심양·요양(1621.5) · 심양 천도(1625.4) · 영원성(1626.2.22) · 누르하치의 죽음(1626.9.30)
           · 원숭환이 옥에(1630.1.13) · 원숭환 처형(1630.9.22) · 차하르의 옥새(1635.9) · 대청(1636.5.15)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/houjin_*.webp
   ■ 저장: s.houjin = { khan: 'guns'|'trade'|'watch', ning: 'quest'|'won'|'lost'|'no'|'late', ningAsk, bought, fire, yuan: 'bribe'|'jail'|'fail'|'no', joined, qing, envoys, ships, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var HJ = G.Houjin = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.houjin) || {}; }
  var GUNGNAE = 315, JILIN = 313, MUKDEN = 312, LIAODONG = 189, PEKING = 188, MACAO = 173;
  var HETU = [124.83, 41.66];
  var D = HJ.D = { khanFrom: 16160101, khanTo: 16171231, ningFrom: 16250601, ningTo: 16260221, yuanFrom: 16300113, yuanTo: 16300921, qingFrom: 16360515, qingTo: 16371231 };
  var NEWS_AT = { jin: 16160217, grievance: 16180507, sarhu: 16190418, liaoshen: 16210512, mukden: 16250501, ningNews: 16260222, nurhaci: 16260930, arrest: 16300113, execute: 16300922, seal: 16350901, qingNews: 16360515 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.houjin) {
      s.houjin = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.houjin.told[k] = 1; });   // 옛 저장
    }
    if (!s.houjin.told) s.houjin.told = {};
    return s.houjin;
  }
  HJ.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var BANNER = { name: '팔기의 기병', lang: 3 }, LIHWAK = { name: '이확', lang: 3 }, MONGOL = { name: '몽골의 왕공', lang: 3 };
  var WHO = { P: me, F: first };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w && WHO[w] ? WHO[w](l[2]) : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function has(id) { return !!(R.hasItem && R.hasItem(id)); }
  function notoriety(n, why) { var p = S().player; p.notoriety = (p.notoriety || 0) + n; UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200); }
  function cargoQ(id) { var cg = S().fleet.cargo[id]; return cg ? cg.q : 0; }
  /** 짐칸에서 덜어 내고 그 값(기본값 × k)을 받는다 */
  function sellCargo(id, q, k) {
    var s = S(), cg = s.fleet.cargo[id]; if (!cg || cg.q < q) return 0;
    if (R.takeCargoLots) R.takeCargoLots(cg, null, q, 0);
    cg.q -= q; if (cg.q <= 0) delete s.fleet.cargo[id];
    var gold = Math.round(((G.GOOD[id] || {}).p || 80) * q * k); s.player.gold += gold; return gold;
  }
  /** 짐칸에 싣는다 (짐칸이 모자라면 실을 수 있는 만큼) — js/systems/hunt.js 와 같다 */
  function loadCargo(id, q) {
    var s = S(), f = s.fleet; if (!G.GOOD[id]) return 0;
    var room = Math.max(0, Math.floor(R.free ? R.free() : q)), kindOk = f.cargo[id] || Object.keys(f.cargo).length < (R.maxKinds ? R.maxKinds() : 9);
    var n = kindOk ? Math.min(q, room) : 0; if (n <= 0) return 0;
    var cg = f.cargo[id], cost = Math.round((G.GOOD[id].p || 80) * 0.6);
    if (cg) { cg.cost = Math.round((cg.cost * cg.q + cost * n) / (cg.q + n)); cg.q += n; } else f.cargo[id] = { q: n, cost: cost, from: cityNow(), d: s.day };
    return n;
  }

  // ================================================================ 소식
  HJ.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.khan || b.ningAsk || b.qing), east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 105);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('jin', east, 'crown', '【후금】 건주여진의 누르하치가 허투알라에서 칸에 올랐다. 나라 이름은 금(金) — 옛 금나라를 잇는다는 뜻이다. 연호는 천명(天命). 노랑·하양·빨강·파랑 네 빛깔에 테두리를 두른 깃발 여덟 — 팔기(八旗)가 그를 둘러쌌다.');
    news('grievance', east, 'scroll', '【칠대한】 누르하치가 명나라에 대한 일곱 가지 원한(七大恨)을 하늘에 고하고 무순을 쳤다. 첫째 원한은 명군이 그의 할아버지와 아버지를 죽인 일이다.');
    news('sarhu', east, 'skull', '【사르후】 명나라 장수 양호가 네 갈래로 나누어 보낸 십만 대군이 사르후에서 누르하치에게 차례로 무너졌다. 명을 도우러 갔던 조선군의 강홍립은 싸움을 피하고 항복했다.' + (b.khan === 'guns' ? ' 팔기의 기병 가운데 남만 조총을 든 이들이 있었다고 한다.' : ''));
    news('liaoshen', east, 'castle', '【심양·요양】 후금의 팔기가 심양과 요양을 잇달아 빼앗았다. 요하 동쪽의 땅이 모두 누르하치의 것이 되었다.');
    news('mukden', east, 'castle', '【성경】 누르하치가 도읍을 심양으로 옮겼다. 만주 사람들은 이 성을 「묵던(盛京)」이라 부른다.');
    news('ningNews', east, 'cannon', b.ning === 'won' || b.ning === 'lost'
      ? '【영원성】 누르하치의 후금군이 영원성을 에워쌌다가 물러났다. 성벽 위의 서양 대포 — 홍이포가 불을 뿜었고, 그 포탄에 칸이 다쳤다고 한다. 그 대포를 오문에서 실어 온 이방인 선장의 이름을 성 안 사람들이 부른다. 누르하치가 싸움에서 진 것은 스물다섯 해 만에 처음이다.'
      : '【영원성】 누르하치의 후금군이 영원성을 에워쌌다가 물러났다. 원숭환이 성벽 위에 올린 서양 대포 — 홍이포가 불을 뿜었고, 그 포탄에 칸이 다쳤다고 한다. 누르하치가 싸움에서 진 것은 스물다섯 해 만에 처음이다.');
    news('nurhaci', east, 'skull', '【누르하치의 죽음】 후금의 칸 누르하치가 영원성의 상처를 끝내 이기지 못하고 숨을 거두었다. 여덟째 아들 홍타이지가 칸의 자리를 이었다.');
    news('arrest', east, 'skull', '【원숭환의 옥】 홍타이지의 군대가 장성을 돌아 북경 성 밑까지 내려왔다. 급히 달려온 원숭환이 북경을 지켰으나, 「원숭환이 적과 내통했다」는 소문에 숭정제가 그를 옥에 가두었다. 붙잡혀 온 환관 둘이 일부러 엿듣게 한 말이었다고도 한다.');
    news('execute', east && b.yuan !== 'bribe' && b.yuan !== 'jail', 'skull', '【원숭환 처형】 원숭환이 북경 서시에서 능지처참을 당했다. 성난 백성들이 앞다투어 그의 살점을 샀다고 한다. 명은 영원성을 지킨 장수를 제 손으로 죽였다.');
    news('execute', east && (b.yuan === 'bribe' || b.yuan === 'jail'), 'skull', '【원숭환 처형】 북경 서시에서 원숭환이 처형되었다고 한다. 그러나 옥에서 끌려 나온 죄수는 얼굴이 헝클어진 머리로 덮여 있었고, 끝내 한마디도 하지 않았다. 옥리들 사이에서는 「그 사람은 원 장군이 아니었다」는 말이 돈다.');
    news('seal', east, 'crown', '【차하르의 옥새】 몽골 차하르의 마지막 칸 릭단의 아들이 홍타이지에게 항복하며 원나라 황제의 옥새를 바쳤다. 몽골의 칸들이 홍타이지를 「복드 세첸 칸」으로 받들었다.');
    news('qingNews', east, 'crown', '【대청】 심양에서 홍타이지가 황제에 올랐다. 나라 이름을 대청(大淸)으로, 연호를 숭덕(崇德)으로 고쳤다. 만주·몽골·한인 신하들이 모두 머리를 조아렸으나, 조선의 사신 나덕헌과 이확만은 끝내 절하지 않았다.' + (b.envoys === 'help' ? ' 매를 맞던 두 사신을 감싼 것은 이방인 선장이었다.' : ''));
    return out;
  };

  // ================================================================ ① 허투알라의 칸
  function khanOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.khan && (c === GUNGNAE || c === JILIN) && t >= D.khanFrom && t <= D.khanTo); }
  function khanDue(lon, lat) { var b = st(), t = today(); return !!(b && !b.khan && t >= D.khanFrom && t <= D.khanTo && G.Geo.dist(lon, lat, HETU[0], HETU[1]) < 0.35); }
  HJ.onLand = async function (lon, lat, ctx) {
    if (!khanDue(lon, lat) || HJ._busy) return false;
    HJ._busy = true;
    try { if (ctx && ctx.stop) ctx.stop(); await khan(); } catch (e) { console.error(e); }
    HJ._busy = false; refresh(); return true;
  };
  async function khan() {
    var b = st(), s = S(), k = K();
    await withPic('houjin_khan', '허투알라의 칸 (1616)', function () { return play([
      [null, '허투알라. 산줄기에 둘러싸인 나무 울타리의 성. 노랑·하양·빨강·파랑의 깃발 여덟 아래 변발의 기병들이 말을 세웠다. 성 한가운데 높은 단 위에 담비 털옷의 노인이 앉는다.'],
      [BANNER, '(제독 일행을 막아서며) 남만 사람이다! …칸께서 보자 하신다.'],
      ['hj_nurhaci', '누르하치다. 오늘 하늘이 나를 칸으로 세웠다. 나라 이름은 금(金). 옛날 우리 조상이 송나라를 무릎 꿇린 그 이름이다.'],
      ['hj_nurhaci', '명나라는 우리 할아버지와 아버지를 죽이고, 인삼과 담비 가죽을 헐값에 빼앗아 갔다. 이제는 아니다. …그래, 바다의 사람. 너는 무엇을 가져왔느냐?']
    ]); });
    var gq = k.gunsQ || 50, hasGuns = cargoQ('guns') >= gq;
    var v = await UI.ask('누르하치가 무엇을 가져왔느냐 묻는다', [
      { label: '교역품 총 ' + gq + '통을 판다 — 값의 ' + (k.gunsK || 2.2) + '배 (악명 +' + (k.notoGuns || 6) + ')', value: 'guns', icon: 'cannon', dis: !hasGuns },
      { label: '인삼과 담비 가죽을 산다 (금화 ' + U.num(k.furGold || 1500) + '닢 → 약재·모피)', value: 'trade', icon: 'coin', dis: s.player.gold < (k.furGold || 1500) },
      { label: '「칸이 서는 날을 보러 왔을 뿐이오」 — 구경한다', value: 'watch', icon: 'eye' }], me());
    if (v === 'guns' && !hasGuns) v = 'watch';
    if (v === 'trade' && s.player.gold < (k.furGold || 1500)) v = 'watch';
    b.khan = v;
    if (v === 'guns') {
      var g = sellCargo('guns', gq, k.gunsK || 2.2);
      notoriety(k.notoGuns || 6, '후금의 칸에게 조총을 팔았다');
      give('houjin_seal');
      await play([['hj_nurhaci', '(조총 한 자루를 들어 어깨에 대 보며) 명나라 놈들이 성벽 위에서 쏘는 그 물건이로구나. 좋다. 이것은 칸의 패다 — 팔기의 땅 어디서든 너를 막지 않을 것이다.']]);
      log('허투알라에서 후금의 칸 누르하치에게 교역품 총 ' + gq + '통을 팔았다. (금화 +' + U.num(g) + ') 칸의 통행 패를 받았다.');
    } else if (v === 'trade') {
      s.player.gold -= k.furGold || 1500;
      var a = loadCargo('herbs', k.furQ || 15), f = loadCargo('fur', k.furQ || 15);
      await play([['hj_nurhaci', '하하! 명나라 상인들은 인삼 한 뿌리에 은 한 냥을 깎으려 든다. 너는 값을 아는구나. 장백산의 인삼과 송화강의 담비다.']]);
      log('허투알라에서 누르하치에게 인삼과 담비 가죽을 샀다 (약재 ' + a + '통 · 모피 ' + f + '통).');
      UI.toast('약재 +' + a + ' · 모피 +' + f, 'sack', 4200);
    } else {
      await play([['hj_nurhaci', '구경꾼이라. 좋다. 돌아가서 바다 건너 사람들에게 말해라 — 북쪽에 새 칸이 섰다고. 머지않아 명나라도 그 이름을 알게 될 것이다.']]);
      log('허투알라에서 누르하치가 후금의 칸에 오르는 것을 보았다.');
    }
    fame('ex', 'khan');
    refresh();
  }

  // ================================================================ ② 영원성의 홍이포
  function ningAskOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.ningAsk && (c === LIAODONG || c === PEKING) && t >= D.ningFrom && t < D.ningTo); }
  function bocarroOpen() { var b = st(), t = today(); return !!(b && b.ning === 'quest' && !b.bought && cityNow() === MACAO && t <= D.ningTo && !has('houjin_cannon')); }
  function deliverOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && b.ning === 'quest' && (c === LIAODONG || c === PEKING) && t <= D.ningTo && (has('houjin_cannon') || cargoQ('cannon') >= (K().cannonQ || 10))); }
  function lateOpen() { var b = st(); return !!(b && b.ning === 'quest' && today() > D.ningTo); }
  async function ningAsk() {
    var b = st(), k = K(); b.ningAsk = 1;
    await play([
      [null, '산해관 밖, 요서의 바닷가. 명나라 군관 하나가 부두에서 서양 배를 찾아다닌다. 화약에 그을린 얼굴이다.'],
      ['hj_officer', '영원성의 원숭환 대인께서 보내셨소. 누르하치가 해가 바뀌면 영원성으로 내려올 것이오. 대인께서는 서양의 큰 대포 — 홍이포가 있으면 성을 지킬 수 있다 하시오.'],
      ['hj_officer', '오문의 포르투갈 사람들이 그 대포를 부어 판다 들었소. 교역품 대포든, 오문의 홍이포든 — 정월이 가기 전에 요동이나 북경으로 가져다주시오. 값은 두 배로 치르겠소.']
    ]);
    var hasC = cargoQ('cannon') >= (k.cannonQ || 10);
    var v = await UI.ask('원숭환이 서양 대포를 구한다', [
      hasC ? { label: '짐칸의 교역품 대포 ' + (k.cannonQ || 10) + '통을 지금 넘긴다', value: 'now', icon: 'cannon' } : null,
      { label: '오문에서 홍이포를 사 오겠다 (1626년 2월 21일까지)', value: 'quest', icon: 'ship' },
      { label: '「명과 후금의 싸움에는 끼지 않겠소」', value: 'no' }].filter(Boolean), me());
    if (v === 'no') { b.ning = 'no'; await play([['hj_officer', '…그렇다면 하늘에 맡겨야겠구려.']]); return; }
    b.ning = 'quest';
    if (v === 'now') return ningyuan();
    log('영원성의 원숭환이 홍이포를 구한다 — 오문에서 사서 1626년 2월 21일까지 요동이나 북경으로.');
    UI.toast('홍이포 — 오문(마카오)의 포르투갈 주조장 → 요동·북경 (1626.2.21까지)', 'cannon', 6000);
  }
  async function bocarro() {
    var b = st(), s = S(), price = K().bocarro || 5000;
    await withPic('houjin_foundry', '오문의 대포 주조장 (1625)', function () { return play([
      [null, '오문 남쪽 언덕 아래의 주조장. 쇳물이 흙 거푸집으로 흘러들 때마다 붉은 빛이 지붕을 핥는다. 땀에 젖은 포르투갈 사내가 다가온다.'],
      ['hj_bocarro', '보카로요. 이 주조장의 청동 대포는 고아에서도, 명나라 황제의 성벽 위에서도 쏘고 있소. 영원성이라고? 열 문이면 되겠군. 값은 금화 ' + U.num(price) + '닢이오.']
    ]); });
    var v = await UI.ask('보카로의 홍이포 열 문', [
      { label: '산다 (금화 ' + U.num(price) + '닢)', value: 'buy', icon: 'coin', dis: s.player.gold < price },
      { label: '다음에', value: 'no' }], me());
    if (v !== 'buy' || s.player.gold < price) return;
    s.player.gold -= price; give('houjin_cannon'); b.bought = 1;
    await play([['hj_bocarro', '(대포에 기름을 먹이며) 포탄은 덤이오. 북쪽 오랑캐의 말들이 이 소리를 들으면 십 리를 달아날 거요.']]);
    log('오문의 보카로 주조장에서 홍이포 열 문을 샀다. (금화 −' + U.num(price) + ')');
    UI.toast('홍이포 — 요동이나 북경으로 (1626.2.21까지)', 'cannon', 5000);
  }
  async function ningyuan() {
    var b = st(), s = S(), k = K(), L = G.Scenes && G.Scenes.land;
    var paid = 0;
    if (has('houjin_cannon')) { R.removeItem('houjin_cannon'); paid = (k.bocarro || 5000) * 2; s.player.gold += paid; }
    else paid = sellCargo('cannon', k.cannonQ || 10, k.cannonK || 2.0);
    await withPic('houjin_ningyuan', '영원성의 홍이포 (1626)', function () { return play([
      [null, '영원성. 바다를 등진 작은 성. 얼어붙은 들판 저편에 팔기의 깃발이 끝없이 늘어섰다. 성벽 위에 새로 올린 청동 대포 열 문이 북쪽을 겨눈다.'],
      ['hj_yuan', '원숭환이오. 대포를 가져왔다니 — 하늘이 아직 명을 버리지 않았구려. (값을 치르며) 성 안 사람들은 성을 버리고 산해관으로 달아나자고 했소. 나는 피로 서약을 쓰고 남았소.'],
      [null, '정월, 누르하치의 군사가 성벽에 사다리를 걸고 땅굴을 판다. 원숭환이 손을 들자 — 홍이포가 한꺼번에 불을 뿜는다.']
    ]); });
    var v = await UI.ask('홍이포의 화승에 불을 붙인다', [
      { label: '적의 한가운데 — 노란 일산(日傘)을 겨눈다', value: 'center', icon: 'cannon' },
      { label: '성벽에 붙은 사다리를 겨눈다', value: 'wall', icon: 'castle' }], me());
    b.fire = v;
    var res = 'win';
    if (L && L.landBattle) {
      var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
      try { res = await L.landBattle('누르하치의 팔기', k.ningFoe || 80, false, { kind: 'garrison', guns: false, leader: '팔기의 버일러', hold: 3, noSpecial: true }); }
      finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
    }
    b.ning = res === 'win' ? 'won' : 'lost';
    var bt = fame('bt', 'ningyuan');
    if (res === 'win') s.player.gold += k.ningGold || 4000;
    await play([
      [null, v === 'center' ? '포탄 하나가 노란 일산 곁에 떨어져 흙기둥이 솟았다. 일산이 기울고 — 팔기가 술렁인다.' : '사다리가 부서지고, 성벽 밑의 팔기가 무너져 내린다. 멀리 노란 일산 곁에도 포탄이 떨어졌다.'],
      [null, '사흘 뒤, 후금의 군사가 포위를 풀고 물러났다. 칸이 다쳤다는 말이 들판에 돌았다.'],
      ['hj_yuan', res === 'win' ? '이겼소! 서른 해 동안 지지 않던 누르하치가 물러났소. 이것은 성 안 사람들의 고마움이오.' : '성벽 밑에서 그대의 사람들이 많이 쓰러졌구려. 그래도 성은 버텼소. 대포 덕이오. …고맙소, 바다의 사람.']
    ]);
    log('영원성에 서양 대포를 전하고 원숭환과 함께 성을 지켰다. 홍이포에 맞은 누르하치가 물러났다. (금화 +' + U.num(paid + (res === 'win' ? k.ningGold || 4000 : 0)) + ' · 전투 명성 +' + bt + ')');
    UI.toast('영원성 — 홍이포가 누르하치를 물리쳤다', 'cannon', 5600);
    refresh();
  }
  async function late() {
    var b = st(); b.ning = 'late';
    log('영원성으로 대포를 가져가기로 한 날이 지나갔다.');
    UI.toast('영원성으로 대포를 가져갈 날이 지났다', 'hourglass', 4200);
  }

  // ================================================================ ③ 원숭환의 옥 (1630, 북경)
  function yuanOpen() { var b = st(), t = today(); return !!(b && (b.ning === 'won' || b.ning === 'lost') && !b.yuan && cityNow() === PEKING && t >= D.yuanFrom && t <= D.yuanTo); }
  async function yuan() {
    var b = st(), s = S(), k = K();
    await withPic('houjin_jail', '북경의 옥 (1630)', function () { return play([
      [null, '북경. 홍타이지의 기병이 성 밑을 휩쓸고 지나간 뒤, 거리에는 「원숭환이 오랑캐를 불러들였다」는 벽보가 붙었다. 금의위 감옥 앞에 돌을 든 사람들이 몰려 있다.'],
      ['hj_jailer', '(제독을 훑어보며) 원 장군을 보러 왔소? 하, 반역자의 친구로구먼. 폐하께서는 곧 능지처참을 명하실 거요. …물론, 세상 일이란 은자 냄새를 맡으면 달라지기도 하지.'],
      ['hj_yuan', '(쇠창살 너머에서) 바다의 사람… 영원성의 그 대포 소리가 아직도 귀에 남았소. 나는 내통하지 않았소. 그러나 황제께서 믿지 않으시니, 그것으로 끝이오.']
    ]); });
    var bribe = k.bribe || 8000;
    var v = await UI.ask('원숭환을 빼낼 것인가?', [
      { label: '옥리에게 뇌물을 쥐여 준다 (금화 ' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '밤에 감옥을 깬다 (육상전)', value: 'jail', icon: 'sword' },
      { label: '그만둔다', value: 'no' }], me());
    if (v === 'bribe' && s.player.gold < bribe) v = 'no';
    if (v === 'no') { b.yuan = 'no'; await play([['hj_yuan', '…그것이 옳소. 이 나라의 일은 이 나라 사람이 짊어져야지.']]); log('북경의 옥에 갇힌 원숭환을 만났다.'); return; }
    var ok = true;
    if (v === 'bribe') { s.player.gold -= bribe; }
    else {
      var L = G.Scenes && G.Scenes.land, res = 'win';
      if (L && L.landBattle) {
        var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
        try { res = await L.landBattle('금의위 옥졸', k.jailFoe || 30, false, { kind: 'garrison', guns: true, leader: '금의위 백호', noSpecial: true }); }
        finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
      }
      ok = res === 'win';
    }
    if (!ok) { b.yuan = 'fail'; await play([[null, '횃불이 몰려오고 징이 울린다. 쇠창살을 끝내 부수지 못하고 물러났다.'], ['hj_yuan', '(멀어지는 목소리로) 돌아가시오! 그대까지 죽을 일은 없소!']]); log('북경의 감옥을 깨고 원숭환을 빼내려 했으나 실패했다.'); return; }
    b.yuan = v;
    await play([
      [null, v === 'bribe' ? '사흘 밤 뒤, 옥리가 열쇠 꾸러미를 흔들며 뒷문을 연다. 머리를 풀어 헤친 죄수 하나가 원 장군의 옷을 입고 감방에 들어가고, 원숭환은 짐꾼의 옷을 입고 걸어 나온다.' : '감방 문이 부서진다. 원숭환을 업고 골목을 달린다. 등 뒤에서 징 소리가 멀어진다.'],
      ['hj_yuan', '(성 밖 나루에서, 돌아보며) 영원성을 지키고, 북경을 지키고… 결국 나를 지킨 것은 바다의 사람이구려. 이 나라에서 원숭환은 오늘 죽었소. 그대의 배에서 남은 목숨을 대포와 함께 쓰겠소.']
    ]);
    var y = G.MATE.h_yuanchonghuan; if (y && y.y && y.y[1] < 1650) y.y = [y.y[0], 1650];
    if (!row('h_yuanchonghuan') && G.Legend && G.Legend.join) { var m = G.Legend.join('h_yuanchonghuan', G.CITY_DATA[PEKING]); if (m) m.loyal = 90; }
    b.joined = 1;
    var so = fame('so', 'yuan');
    log('북경의 옥에서 원숭환을 빼냈다. 「이 나라에서 원숭환은 오늘 죽었소」 — 원숭환이 제독의 배에 올랐다. (사교 명성 +' + so + ')');
    UI.toast('원숭환 — 옥에서 빼내 배에 태웠다', 'heart', 6000);
    refresh();
  }

  // ================================================================ ④ 대청 (1636, 심양)
  function qingOpen() { var b = st(), t = today(); return !!(b && !b.qing && cityNow() === MUKDEN && t >= D.qingFrom && t <= D.qingTo); }
  async function qing() {
    var b = st(), s = S(), k = K();
    await withPic('houjin_qing', '대청의 황제 (1636)', function () { return play([
      [null, '심양, 묵던의 궁. 하늘에 제사를 올리는 단 앞에 만주와 몽골과 한인의 신하들이 줄지어 섰다. 몽골의 왕공들이 원나라 황제의 옥새를 받쳐 든다.'],
      [MONGOL, '칭기스의 옥새가 이제 복드 세첸 칸께 갑니다!'],
      ['hj_hongtaiji', '짐은 오늘 황제에 올라 나라 이름을 대청(大淸)이라 한다. 여진이라는 이름도 버린다. 우리는 이제 만주(滿洲)다.' + (b.khan === 'guns' ? ' …거기 남만인. 아버지께 조총을 팔았다는 그 선장이로군. 아버지는 네 총을 오래 아끼셨다.' : '')],
      [null, '신하들이 일제히 세 번 무릎 꿇고 아홉 번 머리를 조아린다. 그런데 — 맨 뒷줄의 조선 관복 두 사람이 꼿꼿이 서 있다.'],
      ['hj_naduk', '조선의 신하는 명나라 황제 말고 다른 황제에게 절하지 않소!'],
      [null, '청의 군사들이 달려들어 두 사람의 갓을 벗기고 몽둥이로 무릎을 친다. 옷이 찢어지고 피가 흐른다. 그래도 둘은 엎드리지 않는다.']
    ]); });
    var v = await UI.ask('조선의 사신이 매를 맞는다', [
      { label: '「사신을 때리는 나라는 없소!」 — 사신 앞을 막아선다', value: 'help', icon: 'people' },
      { label: '지켜본다', value: 'silent' }], me());
    b.envoys = v;
    if (v === 'help') await play([
      ['hj_hongtaiji', '(손을 들어 군사를 멈추며) …남만인이 조선을 감싸는구나. 좋다. 사신은 죽이지 않는다. 대신 돌아가서 너희 임금에게 전해라 — 짐을 황제로 받들지 않으면 그 대가를 치르게 될 것이라고.'],
      [LIHWAK, '(피 묻은 입술로 제독에게) …고맙소. 이 은혜는 조선이 잊지 않을 것이오. 그러나 저 사람의 말은 빈말이 아니오. 올겨울 압록강이 얼면….']
    ]);
    else await play([[null, '매질은 한참 이어졌다. 두 사신은 끝내 엎드리지 않았고, 홍타이지는 그들을 돌려보내며 조선 임금에게 보내는 글을 들려 보냈다. 「올겨울 압록강이 얼면…」이라는 말이 그 글에 있었다고 한다.']]);
    await play([['hj_hongtaiji', '남만인, 하나 묻자. 명나라를 치려면 바다를 건널 배가 필요하다. 공유덕이 명의 배를 끌고 왔지만 아직 모자라다. 네 배와 포수를 빌려 다오. 값은 넉넉히 치르겠다.']]);
    var w = await UI.ask('홍타이지가 명을 칠 배를 빌려 달라 한다', [
      { label: '빌려준다 (금화 ' + U.num(k.qingGold || 5000) + '닢 · 악명 +' + (k.notoQing || 8) + ')', value: 'yes', icon: 'coin' },
      { label: '거절한다', value: 'no' }], me());
    b.ships = w; b.qing = 1;
    if (w === 'yes') { s.player.gold += k.qingGold || 5000; notoriety(k.notoQing || 8, '청에 명을 칠 배를 빌려주었다'); await play([['hj_hongtaiji', '좋다. 남만인의 배는 쓸모가 있다.']]); }
    else await play([['hj_hongtaiji', '(웃으며) 바다의 사람은 땅의 황제를 섬기지 않는다라. 상관없다. 배는 언젠가 저절로 짐에게 올 것이다.']]);
    var ex = fame('ex', 'qing');
    log('심양에서 홍타이지가 황제에 올라 나라 이름을 대청으로 고치는 것을 보았다.' + (v === 'help' ? ' 절하지 않아 매를 맞던 조선 사신을 감쌌다.' : '') + (w === 'yes' ? ' 청에 배를 빌려주었다.' : '') + ' (탐험 명성 +' + ex + ')');
    refresh();
  }

  // ================================================================ 도시에 들어설 때
  var STEPS = [[khanOpen, khan], [lateOpen, late], [deliverOpen, ningyuan], [bocarroOpen, bocarro], [ningAskOpen, ningAsk], [yuanOpen, yuan], [qingOpen, qing]];
  HJ.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  HJ.check = async function () {
    if (HJ._busy) return false; HJ._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    HJ._busy = false; refresh();
    return true;
  };
  HJ._t = { khan: khan, ningAsk: ningAsk, bocarro: bocarro, ningyuan: ningyuan, yuan: yuan, qing: qing };
})(window.G = window.G || {});
