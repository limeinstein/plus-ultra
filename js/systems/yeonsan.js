/* 연산군과 장녹수, 그리고 흥청망청 (G.Yeonsan) 2026-11-03 사용자 요청 「연산군과 장녹수 그리고 흥청 망청 관련 에피소드를 이벤트로」
   사람·소지품·조정값: js/data/yeonsan.js (G.BALANCE.yeonsan). 장녹수 = 지역 사람 동료 h_jangnoksu (이 사건으로만 만난다 — 반정의 밤에 살아 나가면 그 뒤로 술집에도)
   큰 역사는 그대로다 — 갑자사화(1504) · 흥청(1505) · 중종반정(1506.9.28) · 연산군은 교동도에서 죽는다(1506.12.30). 날짜는 게임의 양력.
   ■ ① 노비의 노래 (1501.1.1~1503.12.31, 한양): 제안대군 집 잔치에서 노래하는 노비 장녹수. 서른 살이라는데 열여섯처럼 보인다.
        「바다 건너의 노래를 하나 가르쳐 주세요」 → 뱃노래를 가르친다 / 구슬 목걸이를 준다(금화) / 지나친다 — 「언젠가 노비 문서를 불태울 거예요」
   ■ ② 흥청의 잔치 (1505.5.20~1506.9.27, 한양): 성균관이 놀이터가 되고 전국에서 뽑아 온 기녀 「흥청」이 대궐에 가득하다. 바른말을 한 내시 김처선은 칼에 맞아 죽었다.
        연산군이 시를 읊고, 숙용이 된 장녹수가 제독을 알아본다(①). 임금의 명: 흥청의 잔치에 쓸 장신구 30·견직물 30을 120일 안에 — 값은 시세의 2.5배
        → 약조한다(뒤에 짐을 싣고 오면 큰돈 · 악명) / 사양한다 · 장녹수가 몰래 묻는다 — 「그날이 오면 저를 데려가 줄 배가 있나요?」(약속한다 / 모른 척)
   ■ ③ 채홍사 (1505.5.20~1506.9.27, 동래·경주·평양): 혼례날 신부를 끌고 가는 채홍사 임숭재 → 배에 숨긴다(육상전) / 매수한다(금화) / 지나친다
   ■ ④ 반정의 밤 (1506.9.10~9.28, 한양 — 9.28까지 날이 지나간다): 박원종의 반정군이 대궐로 —
        (가) 반정군 편에서 대궐 문을 연다(육상전) → 조선의 명예 작위
        (나) 장녹수를 빼낸다 — ①의 정·②의 약속이 있으면 따른다(없으면 웅변으로) → 수구문의 반정군(육상전) → 불타는 장례원에서 노비 문서의 재 → 배에 태운다 / 놓아준다(술집에)
             실패하면 역사대로 — 군기시 앞, 장녹수가 던진 은가락지
        (다) 연산군 곁에 남는다 → 「인생은 풀잎의 이슬 같아」 — 연산군의 시
   ■ 소식: 대궐에 든 장녹수(1502.10) · 갑자사화(1504.4.25) · 언문 금지(1504.9.8) · 김처선(1505.5.14) · 흥청(1505.7.20) · 반정(1506.9.28) · 교동도의 죽음(1506.12.30) · 「흥청망청」(1507.3)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/ys_*.webp
   ■ 저장: s.yeonsan = { song, feast, order, orderDay, delivered, promise, bride, coup, noksu, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var YS = G.Yeonsan = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.yeonsan) || {}; }
  var HANYANG = 190, PROVINCE = [226, 227, 228];
  var D = YS.D = { songFrom: 15010101, songTo: 15031231, feastFrom: 15050520, feastTo: 15060927, coupFrom: 15060910, coup: 15060928 };
  var NEWS_AT = { palace: 15021015, gapja: 15040425, hangul: 15040908, cheoseon: 15050514, heungcheong: 15050720, coupNews: 15060928, death: 15061230, mangcheong: 15070301 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.yeonsan) {
      s.yeonsan = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.yeonsan.told[k] = 1; });
    }
    if (!s.yeonsan.told) s.yeonsan.told = {};
    return s.yeonsan;
  }
  YS.state = st;
  // 장녹수는 이 사건으로만 만난다 — 반정의 밤에 살아 나가 놓아주면 그 뒤로 조선 술집에 (js/systems/frontier.js — eventOnly)
  (function setup() {
    var m = G.MATE && G.MATE.h_jangnoksu; if (!m) return;
    try { Object.defineProperty(m, 'eventOnly', { configurable: true, enumerable: true, get: function () { var s = S(), b = s && s.yeonsan; return !(b && b.noksu === 'free'); } }); }
    catch (e) { m.eventOnly = true; }
  })();
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function atSeoul() { return cityNow() === HANYANG; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var EUNUCH = { name: '대궐의 내관', lang: 3 }, CROWD = { name: '마을 사람', lang: 3 }, GROOM = { name: '신랑', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w === 'P' ? me() : w === 'F' ? first() : w === 'N' ? mateSp('h_jangnoksu', l[2]) : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function join(id, loyal) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var m = G.Legend.join(id, G.CITY_DATA[HANYANG]); if (m && loyal) m.loyal = loyal; return m; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  async function titleUp(by, why) {
    var CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms.KR, s = S();
    if (!CT || !realm) return null;
    var c = CT.state(), n = CT.rank(realm) + 1, tt = CT.title(realm, n);
    if (!tt) { s.player.gold += 4000; UI.toast('조선 조정의 하사금 금화 +4,000', 'coin', 5000); log(why + ' 조선 조정이 하사금 금화 4,000닢을 내렸다.'); return 'gold'; }
    c.titles[realm.id] = n;
    if (G.Growth && G.Growth.event) G.Growth.event('cha', 1, tt.ko + ' 제수 — 조선 조정의 예법을 익혔다');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + ' · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="font-size:16px" class="muted">' + U.esc(by) + '</div><div style="margin-top:10px">' + U.esc(why) + '</div></div>', '명예 작위');
    log(why + ' 조선의 명예 작위 ' + (CT.fullName ? CT.fullName(tt, true) : tt.ko) + '를 받았다.');
    UI.toast((CT.fullName ? CT.fullName(tt, true) : tt.ko) + ' — 조선의 명예 작위', 'crown', 6000);
    return tt.ko;
  }
  function cargo(id) { var c = S().fleet.cargo[id]; return c ? c.q : 0; }
  function takeCargo(id, n) { var f = S().fleet, c = f.cargo[id]; if (!c) return; c.q -= n; if (c.q <= 0) delete f.cargo[id]; }
  function orderGold() { var o = K().order || {}, G0 = G.GOOD || {}; return Math.round(((o.jewelry || 30) * ((G0.jewelry || {}).p || 125) + (o.silk || 30) * ((G0.silk || {}).p || 105)) * (o.k || 2.5)); }
  YS.orderGold = orderGold;

  // ================================================================ 소식
  YS.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.song || b.feast || b.bride), east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('palace', b.song === 'kind' || b.song === 'gift' || b.song === 'pass', 'crown', '【대궐에 든 노비】 제안대군 집의 노비 장녹수가 임금의 눈에 들어 대궐에 들어갔다고 한다. 남편과 아들이 있는 몸이었다. 임금은 그녀를 「숙원」으로 삼았다.' + (b.song === 'kind' ? ' 대궐에서 들리는 노래 가운데, 바다 건너의 뱃노래 가락이 섞여 있다는 말이 돈다.' : ''));
    news('gapja', east, 'skull', '【갑자사화】 임금이 어머니 폐비 윤씨가 사약을 받던 날의 피 묻은 적삼을 보았다고 한다. 그날의 일에 얽힌 대신들이 줄줄이 죽고, 무덤 속의 사람까지 꺼내어 벌했다.');
    news('hangul', met, 'scroll', '【언문 금지】 임금의 잘못을 언문(한글)으로 적은 투서가 거리에 나붙었다. 임금은 범인을 찾지 못하자 언문을 가르치지도 배우지도 말라 명하고, 언문 책을 불태우게 했다.');
    news('cheoseon', met, 'skull', '【김처선】 세 임금을 모신 늙은 내시 김처선이 「이 늙은 것이 네 임금을 섬겼으나 이런 임금은 없었다」며 바른말을 하다가 임금의 칼에 맞아 죽었다. 임금은 「처」 자와 「선」 자를 쓰지 말라 명했다.');
    news('heungcheong', east, 'note', '【흥청】 임금이 전국에서 뽑아 올린 기녀들을 「운평」, 대궐에 든 이들을 「흥청」이라 부르게 했다. 성균관은 놀이터가 되고 원각사는 흥청의 집이 되었다. 채홍사가 고을마다 다니며 여인을 뽑아 간다.');
    var saved = b.noksu === 'ship' || b.noksu === 'free';
    news('coupNews', east, 'castle', '【중종반정】 박원종·성희안의 군사가 대궐로 들어가 임금을 내쫓고 진성대군을 새 임금으로 세웠다. 쫓겨난 임금은 「연산군」으로 강등되어 교동도로 귀양 갔다. ' + (saved
      ? '숙용 장녹수는 그 밤 대궐에서 사라졌다. 군기시 앞에 끌려 나온 흥청들 가운데 그녀는 없었다. 불타는 장례원 앞에서 노비 문서의 재를 쥔 여인을 보았다는 사람이 있다.'
      : '숙용 장녹수는 군기시 앞에서 목이 베였다. 사람들이 그 주검에 돌을 던져 돌무더기가 되었다고 한다.' + (b.noksu === 'lost' ? ' 그녀가 마지막에 던진 은가락지 하나가 이방인 선장의 손에 떨어졌다는 말도 있다.' : '')));
    news('death', met, 'skull', '【교동도】 교동도에 귀양 간 연산군이 병으로 죽었다. 서른하나였다. 마지막으로 「어머니가 보고 싶다」고 했다고 한다.' + (b.coup === 'king' ? ' 그의 머리맡에는 이방인에게 써 주었다는 시의 첫 줄만 적힌 종이가 놓여 있었다.' : ''));
    news('mangcheong', met, 'scroll', '【흥청망청】 저잣거리에서 새 말이 돈다. 「흥청(興淸)」 때문에 나라가 「망청(亡淸)」이 되었다고 — 흥청망청. 흥에 겨워 재물을 마구 쓰는 사람을 그렇게 부른다고 한다.' + (b.delivered ? ' 그 잔치의 비단과 장신구 가운데 바다 건너에서 온 것이 많았다는 말도 따라 붙는다.' : ''));
    return out;
  };

  // ================================================================ ① 노비의 노래 (1501~1503)
  function songOpen() { var b = st(), t = today(); return !!(b && !b.song && !row('h_jangnoksu') && atSeoul() && t >= D.songFrom && t <= D.songTo); }
  async function song() {
    var b = st(), s = S(), k = K();
    await withPic('ys_song', '제안대군 집의 잔치', function () { return play([
      [null, '한양, 제안대군의 저택. 등불이 늘어선 마당에서 잔치가 한창이다. 바다 건너에서 온 상인이라고 제독도 말석에 불려 앉았다.'],
      ['ys_jean', '(술잔을 들고 껄껄 웃으며) 이방인, 우리 집 노래꾼 소리를 들어 보게. 얼굴은 열여섯 같은데 나이가 서른이라네. 남편도 있고 아들도 있지. 허허.'],
      [null, '마당 한가운데 수수한 무명 치마의 여인이 선다. 입을 열자 잔치판이 조용해진다. 입술을 거의 움직이지 않는데도 소리가 마당 끝까지 맑게 닿는다.'],
      ['N', '(노래를 마치고 제독 앞에 와 술을 따르며) 바다 건너에서 오셨다고요. …바다 건너의 노래는 어떤 소리예요? 하나만 가르쳐 주세요. 저는 노래 말고는 가진 게 없거든요.']
    ]); });
    var v = await UI.ask('장녹수가 바다 건너의 노래를 청한다', [
      { label: '뱃노래를 가르쳐 준다', value: 'kind', icon: 'note' },
      { label: '구슬 목걸이를 준다 (금화 ' + U.num(k.gift) + '닢)', value: 'gift', icon: 'coin', dis: s.player.gold < k.gift },
      { label: '「노비의 노래는 노비의 노래요」 — 지나친다', value: 'pass' }], me());
    b.song = v === 'gift' && s.player.gold < k.gift ? 'pass' : v;
    if (b.song === 'kind') {
      await play([[null, '제독이 낮게 뱃노래를 부른다 — 밧줄을 당길 때 부르는, 파도처럼 오르내리는 가락. 여인은 두 번 듣고 세 번째에는 함께 불렀다.'], ['N', '(웃으며) 밧줄을 당기는 노래군요. 이 노래를 부르면 언젠가 저도 무언가를 당겨서 끊을 수 있을까요. …노비 문서 같은 거요.']]);
      var sf = fame('so', 'song'); log('한양 제안대군의 잔치에서 노비 가수 장녹수에게 뱃노래를 가르쳐 주었다. (사교 명성 +' + sf + ')');
    } else if (b.song === 'gift') {
      s.player.gold -= k.gift;
      await play([['N', '(구슬 목걸이를 받아 들고 한참 들여다보다가) …이런 걸 받아 본 건 처음이에요. 노비는 목에 아무것도 걸 수 없거든요. 이건 숨겨 둘게요. 언젠가 노비 문서를 불태우는 날에 걸 거예요.']]);
      log('한양 제안대군의 잔치에서 노비 가수 장녹수에게 구슬 목걸이를 주었다.');
    } else {
      await play([['N', '(웃음을 잃지 않은 채 물러나며) 그렇지요. 노비의 노래는 노비의 노래예요. …하지만 언젠가는 아무도 그렇게 말하지 못하게 할 거예요.']]);
    }
    refresh();
  }

  // ================================================================ ② 흥청의 잔치 (1505.5~1506.9)
  function feastOpen() { var b = st(), t = today(); return !!(b && !b.feast && !row('h_jangnoksu') && atSeoul() && t >= D.feastFrom && t <= D.feastTo); }
  async function feast() {
    var b = st(), s = S(), k = K(), o = k.order || {}, knew = b.song === 'kind' || b.song === 'gift';
    b.feast = 1;
    await withPic('ys_feast', '흥청의 잔치', function () { return play([
      [null, '대궐 후원. 밤새 등불이 꺼지지 않는다. 전국에서 뽑아 올린 기녀 「흥청」 수백이 비단 저고리를 입고 춤춘다. 성균관의 선비들은 쫓겨나고 그 자리는 놀이터가 되었다.'],
      [EUNUCH, '(작게) 지난달 늙은 내시 김처선이 바른말을 하다가 전하의 칼에 맞았소. 그 뒤로 대궐에서 「처」 자를 입에 올리는 사람이 없소. …조심하시오, 이방인.'],
      ['ys_king', '(술잔을 높이 들며) 바다 건너에서 온 장사치라고? 이리 오라. (흥청들 사이에서 일어나 시를 읊는다) 「인생은 풀잎의 이슬 같아, 만날 날이 많지 않구나.」 …그러니 마셔라! 내일은 없을지도 모르니.'],
      ['N', '(임금 곁, 금가락지를 열 개 낀 손으로 잔을 채우며) 전하, 이 사람은 ' + (knew ? '제게 바다의 노래를 가르쳐 준 사람이에요. (제독에게만 보이게 은가락지 낀 손가락을 살짝 든다)' : '처음 보는 얼굴이네요. 바다의 상인이라니 귀한 걸 가졌겠지요.')],
      ['ys_king', '좋다. 흥청들에게 입힐 비단과 장신구가 모자라다. 바다 건너의 것을 가져오라. 장신구 ' + (o.jewelry || 30) + '통, 견직물 ' + (o.silk || 30) + '통 — ' + (o.days || 120) + '일 안에. 값은 시세의 곱절 넘게 쳐 주마. 나라의 곳간은 내 것이니.']
    ]); });
    var v = await UI.ask('임금이 흥청의 잔치에 쓸 물건을 명한다 (금화 약 ' + U.num(orderGold()) + '닢)', [
      { label: '약조한다 — 「' + (o.days || 120) + '일 안에 싣고 오겠소」', value: 'yes', icon: 'coin' },
      { label: '「그 곳간은 백성의 것이오」 — 사양한다', value: 'no' }], me());
    b.order = v;
    if (v === 'yes') { b.orderDay = s.day; UI.toast('흥청의 주문 — 장신구 ' + (o.jewelry || 30) + ' · 견직물 ' + (o.silk || 30) + '통을 ' + (o.days || 120) + '일 안에 한양으로', 'scroll', 6000); }
    else await play([['ys_king', '(잔을 내던지며 웃는다) 백성의 것? 하하! 이 나라에서 내 것 아닌 것이 무엇이냐. …흥이 깨졌다. 썩 물러가라.']]);
    // 숙용의 귓속말
    await play([
      [null, '잔치가 파할 무렵, 회랑 그늘에서 장녹수가 제독의 소매를 잡는다.'],
      ['N', '(웃음기 없는 얼굴로) 저는 웃지 않으면 죽어요. 전하가 화를 내면 제가 웃어야 사람이 살아요. 어제도 둘을 살렸어요. …그런데 언젠가 이 잔치가 끝나는 날이 와요. 그날은 제가 웃어도 아무도 못 살아요. 저도요.'],
      ['N', '그날이 오면 — 저를 데려가 줄 배가 있을까요?']
    ]);
    var p = await UI.ask('장녹수가 묻는다 — 「그날이 오면 저를 데려가 줄 배가 있을까요?」', [
      { label: '「있소. 그날 내가 대궐 담 밖에 있겠소」', value: 'yes', icon: 'heart' },
      { label: '못 들은 척한다', value: 'no' }], me());
    b.promise = p;
    await play(p === 'yes' ? [['N', '(처음으로 숙용이 아닌 얼굴로 웃는다) …기억할게요. 노비였을 때부터 저는 약속을 잊은 적이 없어요.']] : [['N', '(다시 웃음을 걸치며) 그렇지요. 농이었어요, 선장님. 숙용의 농.']]);
    log('한양 대궐 흥청의 잔치에서 연산군을 만났다.' + (v === 'yes' ? ' 흥청에게 입힐 장신구와 비단을 들여오기로 약조했다.' : ' 흥청의 주문을 사양했다.') + (p === 'yes' ? ' 숙용 장녹수에게 「그날」 데리러 오겠다고 약속했다.' : ''));
    refresh();
  }
  function deliverOpen() { var b = st(); return !!(b && b.order === 'yes' && !b.delivered && atSeoul() && today() <= D.feastTo); }
  async function deliver() {
    var b = st(), s = S(), k = K(), o = k.order || {};
    var late = s.day - (b.orderDay || 0) > (o.days || 120), enough = cargo('jewelry') >= (o.jewelry || 30) && cargo('silk') >= (o.silk || 30);
    if (late) { b.order = 'late'; await play([[EUNUCH, '기한이 지났소. 전하께서는 벌써 다른 장사치의 비단을 흥청들에게 입히셨소. …목이 붙어 있는 걸 다행으로 아시오.']]); return; }
    if (!enough) { UI.toast('흥청의 주문 — 장신구 ' + cargo('jewelry') + '/' + (o.jewelry || 30) + ' · 견직물 ' + cargo('silk') + '/' + (o.silk || 30), 'scroll', 4800); b.remind = s.day; return; }
    takeCargo('jewelry', o.jewelry || 30); takeCargo('silk', o.silk || 30);
    var g = orderGold(); s.player.gold += g; b.delivered = 1;
    s.player.notoriety = (s.player.notoriety || 0) + (k.orderNoto || 6);
    await play([
      [null, '대궐 창고 앞. 내관들이 비단 필을 세며 혀를 찬다. 그날 밤 흥청들은 바다 건너의 비단을 두르고 춤을 추었다.'],
      [EUNUCH, '(금화 자루를 내밀며) 전하께서 흡족해하시오. …이 돈이 어디서 나왔는지는 묻지 마시오. 지난가을 삼남의 세금이오.']
    ]);
    log('흥청의 잔치에 장신구와 비단을 바쳤다. 금화 ' + U.num(g) + '닢 — 그 돈은 삼남의 세금이었다. (악명 +' + (k.orderNoto || 6) + ')');
    UI.toast('흥청의 값 금화 +' + U.num(g) + ' · 악명 +' + (k.orderNoto || 6), 'coin', 5600);
    refresh();
  }

  // ================================================================ ③ 채홍사 (1505.5~1506.9, 동래·경주·평양)
  function brideOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.bride && PROVINCE.indexOf(c) >= 0 && t >= D.feastFrom && t <= D.feastTo); }
  async function bride() {
    var b = st(), s = S(), k = K(), c = G.CITY_DATA[cityNow()];
    await withPic('ys_chae', '채홍사 (' + c.name + ')', function () { return play([
      [null, c.name + ' 장터 어귀. 혼례 행렬이 멈춰 섰다. 비단 갓을 쓴 사내와 군졸들이 가마의 발을 걷어 올린다.'],
      ['ys_sungjae', '채홍사 임숭재다. 전하의 명으로 고을의 고운 여인을 뽑아 대궐로 보낸다. …이 신부, 흥청으로 쓰겠다. 데려가라!'],
      [GROOM, '(군졸에게 매달리며) 오늘 혼례를 올린 제 아내입니다! 제발—'],
      ['ys_bride', '(족두리가 벗겨진 채 끌려 나오며) 어머니! 어머니!'],
      [CROWD, '(작게) 지난달엔 옆 마을에서 셋을 데려갔소. 돌아온 사람은 없소.']
    ]); });
    var v = await UI.ask('채홍사가 신부를 끌고 간다', [
      { label: '신부를 배에 숨긴다 — 군졸들을 막는다', value: 'fight', icon: 'sword' },
      { label: '채홍사에게 금화를 건넨다 (' + U.num(k.bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < k.bribe },
      { label: '지나친다', value: 'pass' }], me());
    var ok = false;
    if (v === 'fight') { var r = await fight('채홍사의 군졸', (k.foe || {}).chae || 14, { leader: '채홍사 임숭재' }); ok = r === 'win'; }
    else if (v === 'bribe' && s.player.gold >= k.bribe) {
      s.player.gold -= k.bribe; ok = true;
      await play([['ys_sungjae', '(금화를 저울질하며 비웃는다) 시골 신부 하나쯤이야. 옆 고을에 더 고운 것이 있다더군. 가자!']]);
    }
    b.bride = ok ? v : v === 'pass' ? 'pass' : 'lost';
    if (ok) {
      await play([
        [null, '그날 밤, 신랑과 신부는 제독의 배 화물칸에 숨어 포구를 빠져나갔다. 이튿날 아침 이웃 고을 나루에 내린다.'],
        ['ys_bride', '(신랑의 손을 꼭 잡고) 은혜는… 평생 잊지 않을게요. 저 같은 사람이 백 명, 천 명이에요. 사람들은 이걸 「흥청」이라 불러요. 흥청 때문에 나라가 망할 거라고요.']
      ]);
      var bf = fame('so', 'bride');
      log(c.name + '에서 채홍사가 혼례날 끌고 가던 신부를 ' + (v === 'bribe' ? '금화로 빼내' : '군졸들을 막아') + ' 배에 숨겨 보냈다. (사교 명성 +' + bf + ')');
    } else {
      await play([[null, v === 'pass' ? '행렬이 흩어지고 가마만 길가에 남았다. 신랑이 빈 가마 앞에 주저앉아 운다.' : '군졸들에게 밀려나는 사이, 신부를 태운 수레가 한양 쪽으로 사라졌다.']]);
      log(c.name + '에서 채홍사가 혼례날 신부를 끌고 가는 것을 보았다.');
    }
    refresh();
  }

  // ================================================================ ④ 반정의 밤 (1506.9.28)
  function coupOpen() { var b = st(), t = today(); return !!(b && !b.coup && b.feast && atSeoul() && t >= D.coupFrom && t <= D.coup); }
  async function coup() {
    var b = st(), s = S(), k = K();
    await passTo(D.coup);
    await withPic('ys_coup', '반정의 밤 (1506)', function () { return play([
      [null, '밤. 훈련원 쪽에서 횃불이 일어선다. 갑옷 입은 군사들이 돈화문 앞에 모인다. 「반정이다! 진성대군을 임금으로!」'],
      ['ys_wonjong', '박원종이오. 이방인, 이 나라 일에 끼지 말라 하고 싶지만 — 오늘 밤은 칼 한 자루가 아쉽소. 대궐 문을 지키는 금군을 뚫어야 하오.' + (b.delivered ? ' (차갑게) 흥청의 비단을 날라 온 장사치라는 것은 알고 있소.' : '')],
      [null, '대궐 안쪽에서는 아직 풍악 소리가 들린다. 그 소리가 하나둘 끊긴다.']
    ]); });
    var talk = Math.min(0.85, 0.35 + skill('speech') * 0.15), bond = b.promise === 'yes' || b.song === 'kind' || b.song === 'gift';
    var v = await UI.ask('반정의 밤 — 어디에 설 것인가?', [
      { label: '반정군 편에서 대궐 문을 연다', value: 'rebels', icon: 'sword' },
      { label: '장녹수를 빼낸다' + (bond ? ' — 약속을 지킨다' : ' (말로 설득 ' + Math.round(talk * 100) + '%)'), value: 'noksu', icon: 'heart' },
      { label: '연산군 곁에 남는다', value: 'king', icon: 'crown' }], me());
    b.coup = v;
    if (v === 'rebels') {
      var r = await fight('대궐 문을 지키는 금군', (k.foe || {}).gate || 30, { leader: '금군 장수' });
      await play([
        [null, r === 'win' ? '금군이 흩어지고 돈화문이 열렸다. 횃불이 대궐 안으로 쏟아져 들어간다.' : '금군에게 밀리는 사이, 반정군 본대가 담을 넘었다. 새벽이 오기 전 돈화문이 열렸다.'],
        ['ys_wonjong', '(동이 튼 대궐 뜰에서) 끝났소. 전하… 아니, 연산군은 옥새를 내놓았소. 흥청들은 모두 끌려 나갔고. 이방인, 그대의 칼을 새 임금께 아뢰겠소.']
      ]);
      var tt = await titleUp('새 임금 중종의 이름으로', '중종반정의 밤, 반정군과 함께 대궐 문을 연 공으로.');
      b.title = tt || 'none';
      var cf = fame('bt', 'coup');
      log('1506년 반정의 밤 — 박원종의 반정군과 함께 대궐 문을 열었다. (전투 명성 +' + cf + ')' + (b.delivered ? ' 흥청의 비단을 날랐던 일은 반정 공신들의 입에 오르내렸다.' : ''));
    } else if (v === 'noksu') {
      var agree = bond || U.chance(talk);
      await play([[null, '대궐 북쪽, 숙용의 처소. 비단 장막이 찢기고 흥청들이 비명을 지르며 달아난다. 장녹수는 화장도 지우지 않은 채 거울 앞에 앉아 있다.']]);
      if (!agree) {
        await play([['N', '(돌아보지도 않고) 누구신지요? …바다의 상인이 숙용을 구하러 왔다고요? 저는 이 대궐에서 웃다가 끝날 사람이에요. 가세요.'], [null, '반정군의 횃불이 처소 앞에 닿았다.']]);
        b.noksu = 'lost'; give('ys_ring');
      } else {
        await play([['N', (b.promise === 'yes' ? '(일어서며 웃는다, 숙용이 아닌 얼굴로) 정말 오셨네요. 대궐 담 밖에 있겠다더니 — 담 안까지 오셨어요.' : '(거울 속의 제독을 보고 굳는다) …뱃노래의 선장님. 그 노래, 아직 외워요.') + ' 수구문으로 가요. 저만 아는 길이 있어요.']]);
        var r2 = await fight('수구문을 막은 반정군', (k.foe || {}).escape || 18, { leader: '반정군 부장' });
        if (r2 === 'win') {
          await withPic('ys_ash', '불타는 장례원', function () { return play([
            [null, '수구문을 빠져나오는 길, 장례원이 불타고 있다. 노비 문서를 쌓아 둔 곳이다. 장녹수가 걸음을 멈춘다.'],
            ['N', '(불길 앞에서 맨손으로 재를 한 줌 쥐어 비단 주머니에 담으며) 제 이름이 여기 있었어요. 제안대군 댁 계집종 녹수. …이제 없어요. 열 개의 금가락지는 다 두고 왔어요. 이것만 끼고요. (은가락지를 쓰다듬는다)'],
            b.song === 'gift' ? ['N', '(품에서 구슬 목걸이를 꺼내 목에 건다) 노비 문서를 불태우는 날에 걸겠다고 했죠. 오늘이에요.'] : null
          ]); });
          give('ys_ash');
          var j = await UI.ask('장녹수가 묻는다 — 「이제 저는 누구일까요?」', [
            { label: '「내 배의 소리꾼이오」 — 배에 태운다', value: 'ship', icon: 'ship' },
            { label: '「이제 누구도 아니오. 가고 싶은 데로 가시오」 — 놓아준다', value: 'free' }], me());
          var m = G.MATE.h_jangnoksu; if (m && m.y && m.y[1] < 1540) m.y = [m.y[0], 1540];
          b.noksu = j;
          if (j === 'ship') { join('h_jangnoksu', 85); await play([['N', '배 위에서는 웃지 않아도 사람이 죽지 않겠죠. …그래도 노래는 할게요. 밧줄 당기는 그 노래로요.']]); }
          else await play([['N', '누구도 아닌 사람이라니. (웃는다, 처음 보는 얼굴로) 좋아요. 그럼 조선 어느 장터에서든, 이름 없는 소리꾼으로 다시 만나요.']]);
          var nf = fame('so', 'noksu');
          log('1506년 반정의 밤 — 숙용 장녹수를 수구문으로 빼냈다. 그녀는 불타는 장례원에서 노비 문서의 재를 쥐었다.' + (j === 'ship' ? ' 장녹수가 배에 올랐다.' : ' 장녹수는 이름 없는 소리꾼이 되어 떠났다 (조선 땅의 술집에서 다시 만날 수 있다).') + ' (사교 명성 +' + nf + ')');
        } else { b.noksu = 'lost'; give('ys_ring'); }
      }
      if (b.noksu === 'lost') {
        await play([
          [null, '횃불을 든 군사들이 처소로 들이닥쳤다. 장녹수는 끌려 나가면서 마지막으로 제독 쪽을 보았다. 손가락에서 무언가를 빼어 던졌다 — 투박한 은가락지 하나가 제독의 발치에 굴렀다.'],
          [null, '이튿날, 군기시 앞. 사람들이 숙용의 주검에 돌을 던졌다. 돌무더기가 되었다.']
        ]);
        log('1506년 반정의 밤 — 장녹수를 빼내지 못했다. 그녀가 던진 은가락지만 남았다.');
      }
    } else {
      await withPic('ys_last', '마지막 잔치', function () { return play([
        [null, '편전. 흥청들도 내관들도 다 달아났다. 임금 혼자 술병을 안고 앉아 있다.'],
        ['ys_king', '(제독을 보고 웃는다) 이방인이 남았구나. 다 떠났는데. …나는 어머니를 사약으로 잃었다. 그걸 안 날부터 이 대궐이 무덤 같았다. 그래서 날마다 잔치를 열었지. 무덤 위에서.'],
        ['ys_king', '(붓을 들어 종이에 휘갈긴다) 「인생은 풀잎의 이슬 같아, 만날 날이 많지 않구나.」 …가져가라. 내가 쓴 것 가운데 이것만은 거짓이 아니다.'],
        [null, '문이 부서지고 횃불이 들어왔다. 임금은 일어서지 않았다.']
      ]); });
      give('ys_poem');
      log('1506년 반정의 밤 — 끝까지 연산군 곁에 남았다. 쫓겨나는 임금이 시 한 장을 건넸다.');
    }
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[coupOpen, coup], [deliverOpen, deliver], [feastOpen, feast], [brideOpen, bride], [songOpen, song]];
  YS.pending = function () {
    if (!S()) return false;
    var b = st();
    return STEPS.some(function (x) { if (x[0] === deliverOpen && b && b.remind === S().day) return false; return x[0](); });   // 짐이 모자라다는 알림은 하루 한 번
  };
  YS.check = async function () {
    if (YS._busy) return false; YS._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { if (STEPS[i][0] === deliverOpen && st().remind === S().day) continue; await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    YS._busy = false; refresh();
    return true;
  };
  YS._t = { song: song, feast: feast, deliver: deliver, bride: bride, coup: coup };
})(window.G = window.G || {});
