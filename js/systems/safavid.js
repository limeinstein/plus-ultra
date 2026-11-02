/* 사파비 왕조의 성립(1501)과 찰디란 전투(1514) (G.Safavid) 2026-11-02 사용자 요청
   「이스마일 1세가 페르시아에 왕조를 세우고 시아파를 국가의 종교적 기반으로 삼음」 · 「찰디란 전투 — 오스만이 사파비 왕조를 격파」
   사람·소지품·조정값: js/data/safavid.js (G.BALANCE.safavid). 역사는 바뀌지 않는다 — 찰디란은 오스만이 이긴다.
   ■ ① 타브리즈의 금요일 (1501.7.1~12.31, 타브리즈): 열네 살의 이스마일이 붉은 모자의 키질바시를 이끌고 들어와 샤가 되었다.
        금요 사원의 설교가 열두 이맘의 이름으로 바뀌고, 칼을 뽑은 키질바시가 사람들 사이에 섰다. 고르는 것:
        (가) 숨어 있던 수니파 노학자를 대상 행렬에 숨겨 빼낸다 — 순찰대(육상전) 또는 말솜씨
        (나) 젊은 샤에게 선물을 바친다(금화) — 샤가 튀르크 말로 지은 시를 읊는다 → 「하타이의 시집」 · 페르시아 궁정의 신뢰
        (다) 지켜본다
        그 뒤 샤가 「프랑크의 대포」를 묻고 베네치아의 도제에게 편지를 맡긴다 (받는다 / 사양) → 1505년 말까지 베니스에 전하면 사례 · 도제의 답
   ■ ② 찰디란 (1514): 양쪽 어디에서든 —
        · 오스만 편 (1514.3.1~7.31, 이스탄불): 원정군의 화약 궤짝을 트레비존드로 → (1514.8.20까지 닿으면) 원정군에 붙어 찰디란으로
        · 사파비 편 (1514.6.1~8.20, 타브리즈): 샤의 진영 — 「잠든 적을 치는 것은 도적질」이라는 두르미시 칸 · 먼저 치자는 우스타질루
        8월 23일 찰디란 들판: 수레를 쇠사슬로 묶은 진 뒤의 대포와 예니체리의 총 대 키질바시 기병 (육상전 — 결과는 역사대로)
        사파비 편: 다친 샤가 달아난 뒤, 진영에 남은 베흐루제 하눔을 빼낸다 (늪의 지름길 — 육상전 / 예니체리 매수 — 금화 / 포기)
          → 구하면 페르시아의 명예 작위 한 칸
        오스만 편: 셀림의 포상 — 오스만의 명예 작위 한 칸 + 금화. 붙잡힌 베흐루제를 돌려보내자고 청할 수 있다(매력)
   ■ 소식: 시아파의 나라(1501.8, 만난 사람) · 찰디란(1514.8.23, 누구나) · 셀림의 타브리즈 입성(9.5) · 검은 옷의 샤(1514.10 — 만난 사람)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/sf_*.webp
   ■ 저장: s.safavid = { friday, mulla, gift, letter, side, powder, march, battle, wife, ask, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var SF = G.Safavid = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.safavid) || {}; }
  var TABRIZ = 131, TREBIZOND = 116, ISTANBUL = 112, VENICE = 29;
  var D = SF.D = { fridayFrom: 15010701, fridayTo: 15011231, letterTo: 15051231, otFrom: 15140301, otTo: 15140731, deliverTo: 15140820, sfFrom: 15140601, sfTo: 15140820, battle: 15140823 };
  var NEWS_AT = { shia: 15010815, chaldiran: 15140823, tabriz: 15140905, black: 15141015 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.safavid) {
      s.safavid = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.safavid.told[k] = 1; });
    }
    if (!s.safavid.told) s.safavid.told = {};
    return s.safavid;
  }
  SF.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function at(id) { return cityNow() === id; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var QIZIL = { name: '키질바시 병사', lang: 3 }, CROWD = { name: '타브리즈 사람', lang: 3 }, PASHA = { name: '병기창의 장교', lang: 3 }, JANI = { name: '예니체리', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w === 'P' ? me() : w === 'F' ? first() : w ? H(w) : {};
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
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function trust(id, n) { if (G.Sponsor && G.SPONSOR && G.SPONSOR[id] && G.Sponsor.addTrust && G.Sponsor.rel) G.Sponsor.addTrust(G.Sponsor.rel(id), n); }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 날을 보낸다 (원정길) — 지나간 날의 소식은 도시 소식 창으로 */
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  SF.passTo = passTo;
  /** 그 나라의 명예 작위 한 칸 (js/systems/court.js) */
  async function titleUp(rid, by, why) {
    var CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms[rid], s = S();
    if (!CT || !realm) return null;
    var c = CT.state(), n = CT.rank(realm) + 1, tt = CT.title(realm, n);
    if (!tt) { s.player.gold += 4000; UI.toast(realm.name + ' 궁정의 하사금 금화 +4,000', 'coin', 5000); log(why + ' ' + realm.name + ' 궁정이 하사금 금화 4,000닢을 내렸다.'); return 'gold'; }
    c.titles[realm.id] = n;
    if (G.Growth && G.Growth.event) G.Growth.event('cha', 1, tt.ko + ' 서임 — 궁정의 예법을 익혔다');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + ' · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="font-size:16px" class="muted">' + U.esc(by) + '</div><div style="margin-top:10px">' + U.esc(why) + '</div></div>', '명예 작위');
    log(why + ' ' + realm.name + '의 명예 작위 ' + (CT.fullName ? CT.fullName(tt, true) : tt.ko) + '를 받았다.');
    UI.toast((CT.fullName ? CT.fullName(tt, true) : tt.ko) + ' — ' + realm.name + '의 명예 작위', 'crown', 6000);
    if (G.Audio) G.Audio.sfx('discover');
    return tt.ko;
  }

  // ================================================================ 소식
  SF.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.friday || b.side);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('shia', met, 'pray', '【시아파의 나라】 타브리즈의 새 샤 이스마일이 열두 이맘의 시아파를 나라의 믿음으로 삼았다. 금요 설교에서 앞선 세 칼리프를 저주하라는 명이 내려졌고, 따르지 않는 자는 키질바시의 칼 앞에 섰다. 페르시아가 수니파의 이웃 나라들과 다른 길을 걷기 시작했다.' + (b.mulla === 'saved' ? ' 그 여름 늙은 수니파 학자 하나가 바다의 선장 덕에 트레비존드로 빠져나갔다고 한다.' : ''));
    news('chaldiran', true, 'skull', '【찰디란 전투】 술탄 셀림의 오스만 군이 찰디란 들판에서 샤 이스마일의 키질바시 기병을 무찔렀다. 쇠사슬로 묶은 수레 뒤의 대포와 예니체리의 총 앞에서, 붉은 모자의 기병들이 쓰러졌다. 샤는 다친 몸으로 달아났다.' + (b.battle ? ' 그 들판에 바다에서 온 이방인 선장이 ' + (b.side === 'ot' ? '술탄의 편에' : '샤의 편에') + ' 서 있었다고 한다.' : ''));
    news('tabriz', true, 'castle', '【타브리즈 입성】 술탄 셀림이 사파비의 도읍 타브리즈에 들어왔다. 그러나 군량이 떨어지고 예니체리가 더 가기를 거부해, 여드레 만에 장인과 학자 수천 명을 이끌고 서쪽으로 돌아갔다.' + (b.wife === 'saved' ? '' : ' 사로잡힌 샤의 아내 베흐루제 하눔은 이스탄불로 끌려갔다.'));
    news('black', met, 'flag', '【검은 옷의 샤】 찰디란 뒤로 샤 이스마일은 검은 옷을 입고 검은 깃발을 들었다고 한다. 다시는 몸소 군대를 이끌지 않았다.' + (b.wife === 'saved' ? ' 다만 그의 곁에는 찰디란의 진영에서 돌아온 아내가 있었다.' : ''));
    return out;
  };

  // ================================================================ ① 타브리즈의 금요일 (1501)
  function fridayOpen() { var b = st(), t = today(); return !!(b && !b.friday && at(TABRIZ) && t >= D.fridayFrom && t <= D.fridayTo); }
  async function friday() {
    var b = st(), s = S(), k = K();
    b.friday = 1;
    await withPic('sf_friday', '타브리즈의 금요일 (1501)', function () { return play([
      [null, '타브리즈의 금요 사원. 뜰을 메운 사람들 사이사이에, 열두 주름이 진 붉은 막대 모자를 쓴 사내들이 칼을 뽑아 들고 서 있다. 키질바시 — 「붉은 머리」라 불리는 사파비 교단의 전사들이다.'],
      [null, '설교단 아래 금실 겉옷의 소년이 앉아 있다. 열네 살. 사람들은 그를 「샤 이스마일」이라 부른다. 지난달 샤루르 들판에서 아크코윤루의 왕을 무찌르고 이 도시에 들어왔다.'],
      [{ name: '설교자', lang: 3 }, '알리는 하느님의 벗이다! …열두 이맘의 이름으로 기도하라. 그리고 그 길을 막은 자들을 저주하라.'],
      [CROWD, '(작게 떨며) 이 도시 사람 셋 가운데 둘은 수니파요… 따라 하지 않으면 저 칼이 내려온다는 말이 돌고 있소.'],
      ['sf_ismail', '(설교가 끝나자 일어서며) 이 땅은 이제 열두 이맘의 땅이다. 누구든 따르는 자는 내 형제이고, 따르지 않는 자는 — (말을 멈추고 사람들을 내려다본다) …하느님이 정하실 것이다.']
    ]); });
    await play([[null, '사원을 나서는 골목, 책방 문 틈에서 흰 수염의 노인이 손짓한다.'], ['sf_mulla', '바다의 선장이시오? …나는 이 도시에서 마흔 해 동안 법을 가르친 사람이오. 저 붉은 모자들이 내 이름을 적어 갔소. 트레비존드로 가는 대상 행렬이 내일 새벽 떠난다는데, 나를 그 짐 사이에 숨겨 줄 수 있겠소?']]);
    var v = await UI.ask('타브리즈의 금요일 — 어떻게 하겠는가?', [
      { label: '노학자를 대상 행렬에 숨겨 빼낸다', value: 'mulla', icon: 'people' },
      { label: '젊은 샤에게 선물을 바친다 (금화 ' + U.num(k.gift) + '닢)', value: 'gift', icon: 'coin', dis: s.player.gold < k.gift },
      { label: '지켜본다', value: 'watch' }], me());
    if (v === 'mulla') {
      var talk = Math.min(0.85, 0.3 + skill('speech') * 0.15);
      var w = await UI.ask('성문의 키질바시 순찰대가 대상 행렬을 세운다', [
        { label: '「상인의 짐이오」 — 말로 넘긴다 (' + Math.round(talk * 100) + '%)', value: 'talk', icon: 'scroll' },
        { label: '칼을 뽑는다 — 순찰대를 친다', value: 'fight', icon: 'sword' }], me());
      var ok = false;
      if (w === 'talk' && U.chance(talk)) { ok = true; await play([[QIZIL, '(짐 자루를 툭툭 치더니) 프랑크의 비단 장수로군. 가라. 샤께서 바다의 상인은 건드리지 말라 하셨다.']]); }
      else {
        if (w === 'talk') await play([[QIZIL, '이 자루에서 왜 숨소리가 나지? …수상하다! 열어라!']]);
        var res = await fight('키질바시 순찰대', (k.foe || {}).patrol || 18, { leader: '순찰대장' });
        ok = res === 'win';
      }
      b.mulla = ok ? 'saved' : 'lost';
      await play(ok ? [['sf_mulla', '(짐 사이에서 나와 동이 트는 고갯길을 돌아보며) …마흔 해의 책은 두고 왔지만, 머릿속의 것은 가지고 나왔소. 이 은혜는 이스탄불의 학자들에게 전하겠소.']]
        : [[null, '순찰대가 짐을 헤집는 사이 노인은 끌려갔다. 탐험대는 간신히 성문 밖으로 밀려났다.']]);
      if (ok) { var so = fame('so', 'friday'); log('1501년 타브리즈 — 숨어 있던 수니파 노학자를 대상 행렬에 숨겨 트레비존드로 빼냈다. (사교 명성 +' + so + ')'); }
      else log('1501년 타브리즈 — 수니파 노학자를 빼내려다 키질바시 순찰대에 막혔다.');
    } else if (v === 'gift' && s.player.gold >= k.gift) {
      s.player.gold -= k.gift; b.gift = 1; trust('pe_shah', 10);
      await play([
        ['sf_ismail', '(선물을 받아 들고 처음으로 소년답게 웃으며) 바다 건너에서 온 사람이 내게 무릎을 꿇는구나. 나는 시를 짓는다 — 「하타이」라는 이름으로. 들어 보겠느냐?'],
        ['sf_ismail', '「나는 하느님의 불꽃이요, 알리의 칼이다. 나는 오늘 이 세상에 온 소년, 그러나 내 눈은 천 년을 보았다.」 …튀르크 말로 지었다. 내 전사들이 알아듣는 말이니까.']
      ]);
      give('sf_divan');
      log('1501년 타브리즈 — 열네 살의 샤 이스마일에게 선물을 바쳤다. 샤가 「하타이의 시집」을 내렸다.');
    } else { b.mulla = 'watch'; await play([['F', '…제독, 이 도시는 오늘 다른 나라가 되었습니다. 상인에게는 그저 새 주인이지요.']]); }
    // 베네치아에 보내는 편지
    await play([
      ['sf_ismail', '그대는 프랑크의 배를 몬다지. 베네치아라는 도시를 아는가? 오스만과 오래 싸워 온 사람들이라 들었다.'],
      ['sf_ismail', '나는 서쪽의 오스만, 동쪽의 우즈베크 사이에 있다. 내 전사들은 말 위에서는 누구에게도 지지 않지만, 성벽을 무너뜨리는 쇠 대포가 없다. 베네치아의 도제에게 편지를 전해 다오.']
    ]);
    var l = await UI.ask('샤의 편지를 베네치아에 전하겠는가?', [
      { label: '받는다 — 「베니스의 도제에게 전하겠소」 (1505년 말까지)', value: 'take', icon: 'scroll' },
      { label: '「내 배는 정치를 싣지 않소」', value: 'no' }], me());
    if (l === 'take') { give('sf_letter'); b.letter = 'carry'; UI.toast('샤 이스마일의 편지 — 1505년 말까지 베니스의 도제에게', 'scroll', 5600); }
    else b.letter = 'no';
    refresh();
  }
  function letterOpen() { var b = st(); return !!(b && b.letter === 'carry' && at(VENICE) && today() <= D.letterTo && has('sf_letter')); }
  async function letter() {
    var b = st(), s = S(), k = K();
    R.removeItem('sf_letter'); b.letter = 'done';
    await withPic('sf_doge', '베네치아의 도제 (1502)', function () { return play([
      [null, '두칼레 궁전. 뿔 모양 모자를 쓴 늙은 도제가 페르시아 글씨로 쓴 편지를 통역관에게 넘긴다.'],
      ['sf_loredan', '…붉은 모자의 젊은 샤라. 오스만을 동쪽에서 치겠다는 사람이 나타났구려. 그러나 베네치아는 지난 전쟁에서 모돈과 코론을 잃었소. 지금 술탄과 다시 칼을 맞대는 것은 —'],
      ['sf_loredan', '(편지를 접으며) 사절을 보내 답하겠소. 대포는 보내기 어렵다고, 그러나 샤의 이름은 잊지 않겠다고. 바다의 상인이 이런 편지를 품고 왔다는 것이 더 놀랍구려. 수고비를 받으시오.']
    ]); });
    s.player.gold += k.letterGold || 2500; trust('it_doge', 6);
    var ex = fame('so', 'letter');
    log('샤 이스마일의 편지를 베네치아의 도제 로레단에게 전했다. 도제는 사절을 보내 답하기로 했다. (금화 +' + U.num(k.letterGold || 2500) + ' · 사교 명성 +' + ex + ')');
    UI.toast('도제의 사례 금화 +' + U.num(k.letterGold || 2500), 'coin', 4800);
  }

  // ================================================================ ② 찰디란 (1514) — 오스만 편
  function otOpen() { var b = st(), t = today(); return !!(b && !b.side && at(ISTANBUL) && t >= D.otFrom && t <= D.otTo); }
  async function otAsk() {
    var b = st();
    await withPic('sf_arsenal', '이스탄불 병기창 (1514)', function () { return play([
      [null, '이스탄불, 갈라타의 병기창. 화약 통과 납 탄환 궤짝이 산처럼 쌓였다. 술탄 셀림이 동쪽 원정을 떠났다 — 붉은 모자의 이단, 샤 이스마일을 치러.'],
      [PASHA, '그대가 프랑크의 선장이오? 원정군은 아나톨리아 고원을 넘고 있소. 길이 멀어 화약이 모자라오. 이 궤짝들을 흑해 건너 트레비존드로 실어 가 주시오. 술탄께서 왕자 시절 다스리신 도시요. 8월 20일 전에 닿아야 하오.']
    ]); });
    var v = await UI.ask('원정군의 화약을 트레비존드로 실어 가겠는가?', [
      { label: '싣는다 — 8월 20일 전에 트레비존드로', value: 'yes', icon: 'ship' },
      { label: '사양한다', value: 'no' }], me());
    if (v !== 'yes') { b.side = 'none'; await play([[PASHA, '알았소. 다른 배를 찾겠소.']]); return; }
    b.side = 'ot'; b.powder = 'carry'; give('sf_powder');
    log('이스탄불 병기창에서 술탄 셀림의 원정군에 보낼 화약 궤짝을 실었다 — 8월 20일 전에 트레비존드로.');
    UI.toast('원정군의 화약 궤짝 (팔 수 없다) — 8월 20일 전에 트레비존드로', 'ship', 6000);
  }
  function powderOpen() { var b = st(); return !!(b && b.side === 'ot' && b.powder === 'carry' && at(TREBIZOND)); }
  async function powder() {
    var b = st(), s = S(), k = K(), late = today() > D.deliverTo;
    R.removeItem('sf_powder'); b.powder = late ? 'late' : 'done';
    s.player.gold += late ? Math.round((k.powderGold || 3000) / 2) : (k.powderGold || 3000);
    await play([[null, '트레비존드 부두. 낙타와 노새가 궤짝을 받아 산길로 올라간다.'], [PASHA, late ? '늦었소! 원정군은 이미 동쪽 끝에 닿았을 것이오. …그래도 값은 치르겠소, 절반만.' : '시간 안에 왔구려! 이 화약이면 예니체리의 총이 마르지 않을 것이오. 값을 받으시오.']]);
    log('원정군의 화약을 트레비존드에 전했다.' + (late ? ' (늦어서 값의 절반)' : ''));
    if (late) return;
    var v = await UI.ask('원정군을 따라 찰디란으로 가겠는가? (8월 23일까지 날이 지나간다)', [
      { label: '따라간다 — 술탄의 진영으로', value: 'go', icon: 'boot' },
      { label: '여기서 돌아간다', value: 'no' }], me());
    if (v !== 'go') { b.march = 'no'; return; }
    b.march = 'go';
    await passTo(D.battle);
    await battle('ot');
  }

  // ================================================================ ② 찰디란 — 사파비 편
  function sfOpen() { var b = st(), t = today(); return !!(b && !b.side && at(TABRIZ) && t >= D.sfFrom && t <= D.sfTo); }
  async function sfCamp() {
    var b = st();
    await withPic('sf_camp', '샤의 진영 (1514)', function () { return play([
      [null, '타브리즈 서쪽, 샤의 진영. 붉은 모자의 기병이 들을 덮었다. 그러나 사람들의 얼굴이 밝지 않다. 셀림의 군대가 대포를 끌고 고원을 넘어오고 있다는 소식이다.'],
      ['sf_ismail', (b.friday ? '타브리즈의 금요일에 보았던 바다의 사람이구나. 열세 해가 지났다. ' : '바다에서 온 사람이로구나. ') + '셀림이 온다. 그는 제 아비를 몰아내고 형제들을 죽인 자다. 나를 「이단」이라 부르며 내 땅의 시아파 사만 명을 죽였다.'],
      ['sf_ustajlu', '샤, 저들이 들에 닿자마자 쳐야 하오. 수레를 쇠사슬로 묶고 대포를 그 뒤에 세우기 전에! 나는 디야르바크르에서 저들의 대포를 보았소.'],
      ['sf_durmish', '(웃으며) 지친 적, 잠든 적을 치는 것은 도적이나 하는 짓이오. 샤께서는 정정당당하게 이기실 것이오. 키질바시의 칼 앞에서 쇠막대기 따위가 무슨 소용이오.']
    ]); });
    var v = await UI.ask('샤가 그대를 바라본다', [
      { label: '「우스타질루가 옳소 — 대포가 서기 전에 치시오」', value: 'warn', icon: 'cannon' },
      { label: '「정정당당한 싸움이 키질바시의 이름을 높일 것이오」', value: 'honor' },
      { label: '말을 아낀다', value: 'quiet' }], me());
    b.advice = v;
    await play(v === 'warn'
      ? [['sf_ismail', '(오래 말이 없다가) …나는 자고 있는 사람의 목을 베지 않는다. 그것이 내 아버지의 길이고, 알리의 길이다. 우리는 저들이 진을 다 칠 때까지 기다린다.'], ['sf_ustajlu', '(이를 악물고) …알겠소, 샤.']]
      : v === 'honor' ? [['sf_ismail', '그렇다. 우리는 기다린다. 하느님이 우리 편이시다.'], ['sf_ustajlu', '(제독을 노려보며) 이방인… 그대도 저 대포를 모르는구려.']]
      : [['sf_ismail', '바다의 사람은 말이 없구나. 좋다. 함께 싸우겠느냐?']]);
    var j = await UI.ask('샤의 군대와 함께 찰디란으로 가겠는가? (8월 23일까지 날이 지나간다)', [
      { label: '함께 간다', value: 'go', icon: 'sword' },
      { label: '사양한다', value: 'no' }], me());
    if (j !== 'go') { b.side = 'none'; return; }
    b.side = 'sf'; b.march = 'go';
    await passTo(D.battle);
    await battle('sf');
  }

  // ================================================================ 찰디란 들판 (1514.8.23)
  async function battle(side) {
    var b = st(), k = K();
    await withPic('sf_chaldiran', '찰디란 들판 (1514.8.23)', function () { return play([
      [null, '찰디란. 마른 들판 저편에 오스만 군이 진을 쳤다. 수레 수백 대를 쇠사슬로 묶어 벽을 만들고, 그 틈마다 대포의 검은 입이 이쪽을 본다. 수레 뒤에는 예니체리의 총 줄이 섰다.'],
      [null, '새벽, 키질바시의 기병이 두 날개로 갈라져 달려 나간다. 땅이 울린다 — 그리고 대포가 터진다.'],
      side === 'ot' ? ['sf_selim', '(말 위에서 수레의 벽을 둘러보며) 붉은 모자의 이단들이 정말로 우리가 진을 다 치기를 기다려 주었구나. 하느님이 저들의 눈을 가리셨다. …바다의 선장, 그대의 화약이 오늘 저 붉은 모자들을 쓸어 낼 것이다.']
        : ['sf_ismail', '(칼을 뽑아 들며) 알리여! …내가 몸소 오른쪽 날개를 이끈다. 바다의 사람, 저 수레 벽의 틈을 열어 다오!']
    ]); });
    var res = side === 'ot'
      ? await fight('키질바시 기병', (k.foe || {}).battle || 80, { leader: '두르미시 칸', hold: 3 })
      : await fight('수레 벽 뒤의 예니체리와 오스만 포병', (k.foe || {}).battle || 80, { guns: true, leader: '셀림의 예니체리 아아', hold: 3 });
    b.battle = res === 'win' ? 'win' : 'lose';
    var bf = fame('bt', 'battle');
    if (side === 'ot') return otAfter(res, bf);
    return sfAfter(res, bf);
  }
  async function otAfter(res, bf) {
    var b = st(), s = S(), k = K();
    await play([
      [null, res === 'win' ? '키질바시의 왼쪽 날개가 수레 벽 앞에서 무너졌다. 두르미시 칸이 쓰러지고, 붉은 모자들이 사방으로 흩어진다.' : '제독의 일행은 키질바시의 돌격에 한때 밀렸다. 그러나 대포가 다시 울리자 붉은 모자들이 무너졌다.'],
      [null, '해 질 녘, 샤의 진영이 예니체리 손에 떨어졌다. 샤는 다친 몸으로 달아났다. 천막에서 비단 망토의 여인이 끌려 나온다 — 샤의 아내, 베흐루제 하눔이다.'],
      ['sf_selim', '(제독에게) 그대의 화약과 그대의 칼, 둘 다 보았다. 오스만은 공을 잊지 않는다.']
    ]);
    s.player.gold += 3000;
    var tt = await titleUp('OT', '술탄 셀림 1세의 칙령으로', '찰디란에서 원정군에 화약을 대고 함께 싸운 공으로.');
    b.title = tt || 'none'; trust('ot_sultan', 10);
    var cha = (s.player.st && R.stat('cha')) || 50, p = Math.min(0.8, 0.15 + cha / 200 + skill('speech') * 0.1);
    var v = await UI.ask('끌려온 샤의 아내 베흐루제 하눔', [
      { label: '「그 여인을 샤에게 돌려보내소서」 — 술탄에게 청한다 (' + Math.round(p * 100) + '%)', value: 'ask', icon: 'heart' },
      { label: '말하지 않는다', value: 'no' }], me());
    if (v === 'ask') {
      var ok = U.chance(p); b.ask = ok ? 'yes' : 'no';
      if (ok) { b.wife = 'saved'; await play([['sf_selim', '(한참 제독을 보다가 웃는다) 바다의 사람은 이상한 것을 청하는구나. …좋다. 오늘 나는 이겼으니 너그러워도 된다. 여인을 샤의 땅 경계까지 데려다주어라. 내가 그에게 내리는 마지막 모욕이다 — 내 손으로 그의 아내를 돌려보냈다는 것.']]); G.Fame.add('so', 80); }
      else await play([['sf_selim', '(차갑게) 이긴 자의 몫이다. 말을 아껴라, 선장. 그대의 공이 그대의 혀를 지켜 줄 때까지만.']]);
    }
    log('1514년 찰디란 — 술탄 셀림의 편에서 싸웠다. 오스만이 사파비를 무찔렀다. (전투 명성 +' + bf + ' · 금화 +3,000)' + (b.wife === 'saved' ? ' 술탄에게 청해 샤의 아내를 돌려보냈다.' : ''));
    refresh();
  }
  async function sfAfter(res, bf) {
    var b = st(), s = S(), k = K();
    await play([
      [null, res === 'win' ? '제독의 일행이 수레 벽의 틈 하나를 열었다. 샤의 오른쪽 날개가 그 틈으로 쏟아져 들어가 오스만의 왼쪽을 흔든다 — 그러나 왼쪽 날개에서 두르미시 칸이 대포에 쓰러졌다.' : '대포 소리에 말들이 미쳐 날뛴다. 제독의 일행은 수레 벽에 닿지도 못하고 밀려났다.'],
      [null, '샤가 말에서 떨어졌다. 어깨에 총알이 박혔다. 근위병 하나가 「내가 샤다!」 외치며 오스만 기병을 끌고 반대쪽으로 달려간다. 그 틈에 샤는 동쪽으로 실려 갔다.'],
      ['sf_ustajlu', '(피투성이로 말을 몰고 와) 이방인! 진영이 무너진다 — 샤의 아내께서 아직 천막에 계시오! 예니체리들이 진영을 털고 있소!']
    ]);
    var bribe = k.bribe || 2000;
    var v = await UI.ask('베흐루제 하눔을 빼내겠는가?', [
      { label: '늪의 지름길로 천막에 닿는다 — 진영을 터는 예니체리와 싸운다', value: 'marsh', icon: 'sword' },
      { label: '예니체리 아아에게 금화를 건넨다 (' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '살아 있는 사람부터 데리고 물러난다', value: 'no' }], me());
    var ok = false;
    if (v === 'marsh') { var r = await fight('진영을 터는 예니체리', (k.foe || {}).rescue || 24, { guns: true, leader: '예니체리 오다바시' }); ok = r === 'win'; }
    else if (v === 'bribe' && s.player.gold >= bribe) {
      s.player.gold -= bribe; ok = true;
      await play([[JANI, '(금화 자루를 저울질하며) 이 천막엔 아무도 없었다. 우린 아무것도 못 봤다. …빨리 가라, 프랑크.']]);
    }
    b.wife = ok ? 'saved' : 'lost';
    if (ok) {
      await withPic('sf_rescue', '베흐루제 하눔의 탈출 (1514)', function () { return play([
        ['sf_behruzeh', '(사슬 갑옷 위에 망토를 두른 채 말에 오르며) 나는 샤의 곁에서 싸우려고 왔소. 갑옷을 입고. …이렇게 이방인에게 구해질 줄은 몰랐구려.'],
        [null, '사흘 밤을 달려 동쪽 산마을에 닿았다. 어깨를 싸맨 샤가 아내를 보자 말없이 끌어안았다.'],
        ['sf_ismail', '…나는 오늘 모든 것을 잃은 줄 알았다. 대포에 내 전사들을, 이 들판에 내 이름을. 그대가 하나를 돌려주었다. 이 빚은 페르시아가 갚을 것이다.']
      ]); });
      var tt = await titleUp('PE', '샤 이스마일의 칙령으로', '찰디란에서 샤의 아내 베흐루제 하눔을 진영에서 구해 낸 공으로.');
      b.title = tt || 'none'; trust('pe_shah', 15);
      var rf = fame('so', 'rescue');
      log('1514년 찰디란 — 샤 이스마일의 편에서 싸웠다. 무너진 진영에서 샤의 아내 베흐루제 하눔을 구해 냈다. (전투 명성 +' + bf + ' · 사교 명성 +' + rf + ')');
    } else {
      await play([[null, v === 'no' ? '제독은 다친 사람들을 말에 태우고 동쪽으로 물러났다. 뒤에서 진영의 천막들이 불타올랐다.' : '천막에 닿았을 때는 이미 늦었다. 비단 망토의 여인은 예니체리들에게 끌려간 뒤였다.']]);
      log('1514년 찰디란 — 샤 이스마일의 편에서 싸웠다. 사파비 군은 무너졌다. (전투 명성 +' + bf + ')');
    }
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[letterOpen, letter], [powderOpen, powder], [fridayOpen, friday], [otOpen, otAsk], [sfOpen, sfCamp]];
  SF.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  SF.check = async function () {
    if (SF._busy) return false; SF._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    SF._busy = false; refresh();
    return true;
  };
  SF._t = { friday: friday, letter: letter, otAsk: otAsk, powder: powder, sfCamp: sfCamp, battle: battle };
})(window.G = window.G || {});
