/* 도요토미 히데요시의 일본 통일 — 오다와라 정벌 (G.Odawara) 2026-11-01 사용자 요청 — 사람·소지품·조정값: js/data/odawara.js
   ■ ① 사카이의 부름 (1590.1.1~6.20, 사카이): 구키 요시타카가 간토의 호조를 칠 수군에 남만의 배를 청한다 → 함께 간다 / 사양
        함께 가면 sail일 동안 바닷길 → 사가미 앞바다 큰 해전 (호조 수군의 바닷길을 끊는다 — 끝나면 에도로)
   ■ ② 이시가키야마의 진영 (해전 뒤 에도에 들어서면): 히데요시와 리큐의 차 · 「하룻밤 성」(돛천이나 종이로 흰 벽을) · 흰 수의의 다테 마사무네
        · 철포 삼백 자루(js/systems/teppo.js)로 만난 적이 있으면 히데요시가 알아본다
        → 8월 4일 성이 열릴 때까지 진영에 머문다(날이 지나간다) / 떠난다(포상 절반)
   ■ ③ 오다와라의 항복 (1590.8.4): 우지나오가 성을 나온다 · 히데요시가 이에야스에게 간토 여덟 주를 — 「에도로 가시오」 → 포상 · 진바오리
   ■ 소식: 에도성 개성(5.25) · 마사무네(7.10, 진영을 보지 않았으면) · 오다와라 항복(8.4, 철포 사건 소식이 없을 때만) · 우지마사 할복(8.10) ·
           이에야스 에도 입성(8.30) · 오슈 시오키 — 천하 통일(9.7) · 리큐 할복(1591.4.21, 진영에서 리큐를 만났으면)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/odawara_*.webp
   ■ 저장: s.odawara = { met, join: 'yes'|'no', sea: 'won'|'lost', camp, wall, masa, stay: 'yes'|'no', surrender, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var OD = G.Odawara = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.odawara) || {}; }
  var SAKAI = 192, EDO = 297;
  var D = OD.D = { from: 15900101, to: 15900620, surrender: 15900804, campTo: 15901031 };
  var NEWS_AT = { edoCastle: 15900525, masamune: 15900710, surrender: 15900804, ujimasa: 15900810, ieyasuEdo: 15900830, unify: 15900907, rikyu: 15910421 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.odawara) {
      s.odawara = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.odawara.told[k] = 1; });
    }
    if (!s.odawara.told) s.odawara.told = {};
    return s.odawara;
  }
  OD.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function teppo() { var t = S().teppo; return t && t.met ? t : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function mateSp(id) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var WHO = { P: me, F: first, KUKI: function () { return mateSp('h_yoshitaka'); }, RIKYU: function () { return mateSp('h_rikyu'); } };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w && WHO[w] ? WHO[w]() : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; if (!(R.addItem && R.addItem(id))) s.player.items.push({ id: id }); }
  /** 날을 보낸다 (js/systems/globe.js 와 같다) — 지난 소식은 도시 소식으로 */
  async function pass(n) {
    if (n <= 0 || !G.Game.passDays) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  function daysTo(dn) { var a = S().date, b = { y: Math.floor(dn / 10000), m: Math.floor(dn / 100) % 100, d: dn % 100 }; return Math.max(0, U.dayIndex(b) - U.dayIndex(a)); }

  // ================================================================ 소식
  OD.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, east = !!b.met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('edoCastle', east, 'castle', '【에도성】 호조 가문의 지성(支城) 에도성이 싸우지 않고 문을 열었다. 간토의 성들이 하나둘 히데요시의 군대 앞에 무릎을 꿇는다. 남은 것은 오다와라뿐이다.');
    news('masamune', east && !b.camp, 'eye', '【외눈박이 용】 오슈의 다테 마사무네가 늦게나마 오다와라 진영에 나타났다. 머리를 짧게 자르고 죽음을 각오한 흰 수의를 입었다고 한다. 히데요시는 지팡이로 그의 목덜미를 툭툭 치며 「조금만 늦었으면 여기가 날아갔을 것」이라 웃었다.');
    news('surrender', east && !b.surrender && !teppo(), 'flag', '【오다와라 항복】 석 달을 버틴 오다와라 성이 문을 열었다. 호조 우지나오가 성을 나와 항복했다. 다섯 대 백 년을 이어 온 간토의 호조 가문이 무너졌다.');
    news('ujimasa', east, 'skull', '【우지마사】 호조 가문의 늙은 가장 우지마사와 동생 우지테루가 할복했다. 우지나오는 이에야스의 사위라 하여 목숨을 건져 고야산으로 쫓겨났다.');
    news('ieyasuEdo', east || b.surrender, 'castle', '【에도】 도쿠가와 이에야스가 대대로 다스리던 미카와를 떠나, 히데요시가 내린 간토 여덟 주의 새 본거지 에도로 들어갔다. 갈대밭과 어촌뿐인 작은 성이다.' + (b.surrender ? ' 「에도로 가시오」 — 진영에서 들은 그 말이 정말이 되었다.' : ''));
    news('unify', east, 'crown', '【천하 통일】 히데요시가 아이즈에 들어 오슈의 다이묘들을 정리했다(오슈 시오키). 오닌의 난부터 백이십 년 넘게 이어진 전국의 난세가 끝났다. 일본은 이제 한 사람의 손 안에 있다.');
    news('rikyu', !!b.camp, 'skull', '【리큐】 다인 센노 리큐가 히데요시의 명으로 할복했다. 다이토쿠지 산문 위에 제 목상을 올렸다는 것이 죄라 한다. 오다와라 진영에서 그가 끓여 주던 차 한 잔이 떠오른다.');
    return out;
  };

  // ================================================================ ① 사카이의 부름
  function callOpen() { var b = st(), t = today(); return !!(b && !b.join && cityNow() === SAKAI && t >= D.from && t <= D.to); }
  function blockadeSpec() {
    return { id: 'odawara_blockade', foe: '호조', ships: ['atakebune', 'sekibune', 'sekibune', 'sekibune', 'sekibune', 'kobaya', 'kobaya'],
      names: ['가지와라 가게무네의 안택선', '이즈 수군의 관선', '미우라의 관선', '사가미의 관선', '시모다의 관선', '척후 소조', '전령 소조'], foeLabel: '호조 수군 (가지와라 가게무네)',
      allies: [{ type: 'atakebune', name: '구키 요시타카의 일본환', gun: 'culverin' }, { type: 'atakebune', name: '조소카베의 안택선', gun: 'saker' }, { type: 'sekibune', name: '와키자카의 관선', gun: 'saker' }],
      who: { mate: 'h_yoshitaka' },
      intro: '저기 오다와라 앞바다요. 호조의 수군이 이즈의 포구마다 숨어 성에 쌀을 나르고 있소. 저 바닷길만 끊으면 성은 굶소. 관백께서 바다는 우리에게 맡기셨소 — 남만의 대포, 오늘 한번 봅시다!',
      ask: '사가미 앞바다 — 호조 수군의 바닷길을 끊겠는가?', fightLabel: '함께 싸운다 — 바닷길을 끊는다', noLabel: '물러난다',
      decline: '…좋소. 우리끼리 끊겠소. 그대는 에도 쪽으로 돌아가 진영에서 기다리시오.',
      gun: 'saker', gunK: 0.8, crewK: 1.0, gunNote: '호조 수군은 작은 관선이 많다 — 붙어서 뛰어드는 무사들을 조심하시오. 기함(가지와라의 안택선)을 꺾으면 흩어진다.',
      win: { fame: (K().fame || {}).blockade || 220, gold: 1500, text: '사가미 앞바다에서 호조 수군을 흩었다. 오다와라 성으로 가는 바닷길이 끊겼다.' },
      lose: '사가미 앞바다에서 호조 수군에 밀려 물러났다. 구키 수군이 홀로 바닷길을 막았다.',
      center: { lon: 139.25, lat: 35.12 }, backCity: EDO, place: '사가미 앞바다',
      onWin: function () { var b = st(); if (b) b.sea = 'won'; }, onLose: function () { var b = st(); if (b && b.sea !== 'won') b.sea = 'lost'; } };
  }
  OD.blockadeSpec = blockadeSpec;
  async function call() {
    var b = st(), k = K(), tp = teppo(); b.met = 1;
    await withPic('odawara_kuki', '사카이의 수군 (1590)', function () { return play([
      [null, '사카이 부두가 북새통이다. 쌀가마와 화약 상자가 끝없이 배에 실린다. 깃발마다 금빛 표주박 — 관백 도요토미 히데요시의 문양이다.'],
      ['KUKI', '구키 요시타카요. 관백께서 간토의 호조를 치시오. 이십만 대군이 동해도를 따라 내려가고, 바다로는 우리 수군이 오다와라를 에워싸오.'],
      ['KUKI', tp ? '…그대 얼굴은 낯이 익소. 몇 해 전 이 부두에서 남만 총 상자를 부리던 선장 아니오? 관백께서도 그대 이야기를 하신 적이 있소.' : '남만의 배는 대포가 크고 바람을 잘 탄다지. 관백께서는 쓸 만한 것은 무엇이든 쓰시는 분이오.'],
      ['KUKI', '함께 가 주겠소? 오다와라 앞바다까지 열흘 남짓 뱃길이오. 호조의 수군만 흩으면 — 관백께서 그대를 잊지 않으실 것이오.']
    ]); });
    var v = await UI.ask('구키 수군과 함께 오다와라로 가겠는가?', [
      { label: '함께 간다 — 「바닷길을 끊읍시다」 (' + (k.sail || 12) + '일 뱃길)', value: 'yes', icon: 'ship' },
      { label: '「일본의 싸움에는 끼지 않겠소」', value: 'no' }], me());
    b.join = v === 'yes' ? 'yes' : 'no';
    if (b.join !== 'yes') { await play([['KUKI', '그렇소? 아쉽구려. 이 싸움이 끝나면 일본은 하나가 될 것이오. 그때 다시 봅시다.']]); log('구키 요시타카의 오다와라 원정 청을 사양했다.'); return; }
    log('구키 요시타카의 수군과 함께 오다와라 정벌에 나섰다.');
    await pass(k.sail || 12);
    await play([[null, '열이틀 뒤, 사가미 앞바다. 하코네 산 너머로 오다와라 성의 흰 망루가 보인다. 성 아래 포구에서 작은 배들이 쌀가마를 싣고 드나든다.']]);
    if (!G.Rel || !G.Rel.greatBattle) { b.sea = 'won'; return; }
    var s = S(), sp = blockadeSpec();
    G.Rel.register(sp); if (s.rel && s.rel.battle) delete s.rel.battle[sp.id];
    var went = await G.Rel.greatBattle(sp);
    if (!went) b.sea = 'declined';
  }

  // ================================================================ ② 이시가키야마의 진영 · ③ 항복
  function campOpen() { var b = st(); return !!(b && b.join === 'yes' && b.sea && !b.camp && cityNow() === EDO && today() <= D.campTo); }
  async function camp() {
    var b = st(), s = S(), k = K(), tp = teppo(), t = today();
    b.camp = 1;
    if (t > D.surrender) return late();
    await withPic('odawara_camp', '이시가키야마의 진영 (1590)', function () { return play([
      [null, '에도에서 서쪽으로 사흘. 오다와라 성이 내려다보이는 이시가키야마 산꼭대기에 진영이 섰다. 진막 사이로 다회가 열리고, 광대와 유녀까지 불려 와 마치 축제 같다.'],
      ['od_hideyoshi', b.sea === 'won' ? '오오, 바다에서 호조의 쌀배를 흩었다는 남만의 선장이 그대인가! 구키가 칭찬이 대단하더군.' : b.sea === 'lost' ? '바다에서 혼쭐이 났다지? 하하, 괜찮다. 바다는 구키가 막았다.' : '구키와 함께 왔다는 남만의 선장인가. 바다는 구키가 막았네. 그대는 구경이나 하게, 하하.'],
      tp ? ['od_hideyoshi', tp.end === 'done' ? '…가만, 그 얼굴. 사카이 부두에서 남만 총 삼백 자루를 세던 그 선장이로구나! 그때 짚신 들던 원숭이가 이제 관백이 되었다네. 하하하!' : '…가만, 그 얼굴. 총 삼백 자루를 가져오마 하고 끝내 못 가져온 그 선장 아닌가? 하하, 괜찮다. 이 원숭이는 은혜는 오래, 원한은 짧게 기억하지.'] : null,
      ['od_hideyoshi', '자, 리큐의 차 한 잔 들게. 싸움은 서두르지 않는다. 호조는 성 안에서 굶고, 우리는 밖에서 차를 마신다 — 그게 천하를 얻는 법이지.'],
      ['RIKYU', '(다다미 두 장의 진막 안에서 말없이 다완을 내밀며) …산 위의 물이라 맑습니다. 천천히 드십시오.']
    ]); });
    await play([['od_hideyoshi', '그런데 말일세. 이 산 위에 성을 하나 쌓았네. 오늘 밤 앞의 숲을 한꺼번에 베어 내면, 내일 아침 호조 놈들 눈앞에 하룻밤 사이 흰 성이 솟은 것처럼 보이겠지. 그런데 벽에 바를 회칠이 모자라. 무슨 좋은 꾀가 없나?']]);
    var w = await UI.ask('「하룻밤 성」 — 흰 벽이 모자란다', [
      { label: '배의 여분 돛천을 벽에 두른다', value: 'sail', icon: 'ship' },
      { label: '흰 종이를 벽에 바르자고 권한다', value: 'paper', icon: 'scroll' },
      { label: '「꾀는 관백께서 더 잘 아시겠지요」', value: 'none' }], me());
    b.wall = w;
    await play(w === 'sail'
      ? [[null, '밤새 선원들이 돛천을 펴 성벽에 둘렀다. 새벽, 숲이 쓰러지자 오다와라 성 사람들의 눈앞에 하얀 성벽이 해를 받아 빛났다.'], ['od_hideyoshi', '하하하! 남만의 돛이 일본의 성벽이 되었구나! 저것 보게, 성 위의 놈들이 넋을 잃었어!']]
      : w === 'paper'
        ? [[null, '사카이에서 실어 온 흰 종이 수천 장이 성벽에 발렸다. 새벽, 숲이 쓰러지자 오다와라 성 사람들의 눈앞에 하얀 성벽이 해를 받아 빛났다.'], ['od_hideyoshi', '종이! 하하, 그대는 장사꾼의 머리로구나. 회칠보다 싸고 빠르지!']]
        : [['od_hideyoshi', '하하, 영리한 대답이군. 실은 종이를 바를 생각이었네.'], [null, '새벽, 숲이 쓰러지자 오다와라 성 사람들의 눈앞에 하얀 성벽이 해를 받아 빛났다.']]);
    await withPic('odawara_masamune', '흰 수의의 사내 (1590)', function () { return play([
      [null, '그날 오후, 진영이 술렁인다. 오슈에서 왔다는 젊은 다이묘가 머리를 짧게 자르고, 흰 수의를 입은 채 진막 앞에 꿇어앉았다. 오른눈에는 검은 안대.'],
      ['od_masamune', '오슈의 다테 마사무네입니다. 부르심에 늦었습니다. 죽음을 각오하고 왔습니다.'],
      ['od_hideyoshi', '(지팡이로 마사무네의 목덜미를 툭툭 치며) …조금만 더 늦었으면, 여기가 날아갔을 걸세.']
    ]); });
    var m = await UI.ask('히데요시가 지팡이를 든 채 제독을 본다', [
      { label: '「늦어도 왔으니, 쓸 만한 사람 아니겠습니까」', value: 'spare', icon: 'people' },
      { label: '말없이 지켜본다', value: 'quiet' }], me());
    b.masa = m;
    await play(m === 'spare'
      ? [['od_hideyoshi', '하하! 남만 사람이 마사무네 편을 드는군. …좋다, 목은 붙여 두마. 대신 아이즈 땅은 내놓아라.'], ['od_masamune', '(고개를 들어 제독을 힐끗 보며) …빚을 졌소, 이방인.']]
      : [['od_hideyoshi', '(한참 노려보다 웃으며) 좋다, 목은 붙여 두마. 대신 아이즈 땅은 내놓아라.']]);
    fame('so', 'camp');
    t = today();
    var wait = daysTo(D.surrender);
    var v = await UI.ask('오다와라 성이 열릴 때까지 진영에 머물겠는가?', [
      { label: wait > 0 ? '머문다 (' + wait + '일이 지나간다)' : '머문다', value: 'yes', icon: 'hourglass' },
      { label: '떠난다 — 포상은 절반', value: 'no' }], me());
    b.stay = v === 'yes' ? 'yes' : 'no';
    if (b.stay !== 'yes') {
      var half = Math.round((k.gold || 6000) / 2); s.player.gold += half;
      await play([['od_hideyoshi', '바쁜 사람이군. 그럼 이것이라도 받아 가게. 바다의 공은 잊지 않겠네.']]);
      log('이시가키야마의 진영에서 히데요시와 리큐를 만나고 다테 마사무네를 보았다. 항복을 기다리지 않고 떠났다 (금화 +' + U.num(half) + ').');
      UI.toast('히데요시의 포상 — 금화 +' + U.num(half), 'coin', 4800);
      refresh(); return;
    }
    await pass(wait);
    await surrender();
  }
  async function surrender() {
    var b = st(), s = S(), k = K();
    b.surrender = 1;
    await withPic('odawara_surrender', '오다와라의 항복 (1590.8.4)', function () { return play([
      [null, '석 달 만에 오다와라 성문이 열렸다. 성 안에서는 날마다 「항복이냐 싸움이냐」를 두고 회의만 거듭했다고 한다 — 훗날 사람들은 끝없는 회의를 「오다와라 평정」이라 부르게 된다.'],
      ['od_ujinao', '(칼을 풀어 내려놓으며) 성 안의 사람들은 살려 주십시오. 죄는 우리 부자에게 있습니다.'],
      [null, '그날 저녁, 이시가키야마의 언덕. 히데요시와 이에야스가 나란히 서서 성을 내려다보며 오줌을 눈다. 제독은 몇 걸음 뒤에서 그것을 보았다.'],
      ['od_hideyoshi', '이에야스 공, 저 간토 여덟 주를 그대에게 주겠소. 대신 미카와와 스루가는 내놓으시오. …오다와라 말고 저 동쪽의 에도에 성을 두는 게 좋겠소. 바다가 가깝지.'],
      ['od_ieyasu', '(한참 말이 없다가, 고개를 숙이며) …분부대로 하겠습니다.'],
      ['od_ieyasu', '(돌아서며 제독에게만 들리게) 에도는 갈대밭뿐인 어촌이오. …그러나 갈대밭은 메우면 땅이 되지. 바다의 선장, 언젠가 에도 포구에 배를 대 주시오.']
    ]); });
    var gold = k.gold || 6000; s.player.gold += gold; give('odawara_jinbaori');
    var f = fame('bt', 'surrender');
    await play([['od_hideyoshi', '(금실 표주박 문양의 진바오리를 벗어 제독의 어깨에 걸쳐 주며) 이것으로 일본은 하나가 되었다. 다음은… 바다 건너다. 하하하! 그대 같은 선장이 또 필요할 걸세.']]);
    log('오다와라 성이 항복했다. 히데요시가 일본을 하나로 묶었다. 이에야스는 간토 여덟 주를 받고 에도로 간다. 히데요시의 진바오리와 금화 ' + U.num(gold) + '닢을 받았다. (전투 명성 +' + f + ')');
    UI.toast('천하 통일 — 히데요시의 진바오리 · 금화 +' + U.num(gold), 'crown', 6000);
    if (G.Audio) G.Audio.sfx('cheer');
    refresh();
  }
  async function late() {
    var b = st(), s = S(), half = Math.round((K().gold || 6000) / 2);
    await play([['od_hideyoshi', '이제 왔는가! 오다와라는 벌써 문을 열었네. 하하, 바다의 공은 잊지 않았지. 이것을 받게.']]);
    s.player.gold += half; b.stay = 'late';
    log('오다와라 항복 뒤에 에도에서 히데요시를 만나 바다의 공으로 금화 ' + U.num(half) + '닢을 받았다.');
    refresh();
  }

  // ================================================================ 도시에 들어설 때
  var STEPS = [[campOpen, camp], [callOpen, call]];
  OD.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  OD.check = async function () {
    if (OD._busy) return false; OD._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    OD._busy = false; refresh();
    return true;
  };
  OD._t = { call: call, camp: camp, surrender: surrender };
})(window.G = window.G || {});
