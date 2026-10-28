/* 은징가 여왕의 저항 — 은동고와 마탐바 (G.Nzinga) 2026-10-28 사용자 요청
   「은징가가 은동고와 마탐바를 기반으로 외교·동맹·전쟁을 활용해 포르투갈의 팽창에 맞섬」
   잉카·아즈텍·고아와 같은 꼴 — 역사 날짜에 루안다(포르투갈령 앙골라의 항구, 1641~1648년은 네덜란드령)에 들어서면 제독이 이야기에 끼어든다.
   내륙(은동고·킨동가 섬·마탐바·콤비)의 일은 사절과 함께 콴자 강을 거슬러 오르는 이야기로 그린다. 역사는 바뀌지 않는다 — 바뀌는 것은 제독이 누구 곁에 섰는가다.
   ■ 흐름 (사람: js/data/nzinga.js) — 모두 루안다(100)
     ① 앉을 자리 없는 방 (1621.10~1622.6, 외교): 총독이 의자를 내주지 않자 시녀가 무릎을 꿇고 은징가가 그 등에 앉는다.
        총독이 「해마다 조공을 바치라」 하자 제독에게 묻는다 — (가) 「조공은 정복당한 나라가 바치는 것」 (나) 총독 편 (다) 입을 다문다
     ② 킨동가의 섬 (1624.4~1626.6, 동맹): 왕이 된 은징가의 동생 키푼지가 몰래 총을 구한다 — (가) 총 60자루를 판다(값 ×1.6) (나) 거저 준다
        (다) 거절 (라) 총독에게 일러바친다(금화 · 은징가의 원수). 1626.7 킨동가 섬이 공격당하는 소식이 달라진다
     ③ 마탐바의 왕 (1632~1641.8.25, 외교): 마탐바를 정복한 은징가의 사절이 제독을 킬롬보(임방갈라 전사의 진영)로 부른다 —
        「여왕이 아니라 왕이라 부르라」. 사람을 사고판 제독이면 차갑게 맞는다. (가) 벗의 맹세(은징가의 전투 도끼 · 상아) (나) 장사만 한다 (다) 가지 않는다
     ④ 콤비 전투 (1647.9~10, 네덜란드령 루안다 — 전쟁): 네덜란드 서인도 회사와 은징가의 연합군. 포르투갈의 마상가누 요새로 —
        (가) 연합군에 들어 싸운다(육상전) (나) 포르투갈 요새에 화약을 몰래 실어 나른다 (다) 물러난다
     ⑤ 사의 함대 (1648.8.1~8.23): 살바도르 코헤이아 드 사의 함대가 루안다 앞바다에 — 은징가의 사절과 다친 네덜란드 병사들을 배에 태워 빼낸다 / 물러난다
     ⑥ 동생의 몸값 (1655~1656.10.11, 외교): 포르투갈에 붙잡힌 막냇동생 캄부. 총독은 몸값으로 사람 백삼십 명을 요구한다 —
        (가) 사람 대신 금화를 대겠다(웅변이 있으면 깎인다) (나) 끼지 않는다. 1656.10.12 강화 · 캄부가 돌아온다
     소식: 세례(1622) · 은징가가 왕이 되다(1624) · 킨동가 섬(1626) · 마탐바(1631) · 네덜란드의 루안다(1641.8) · 은골레메(1644) · 카방가(1646, 캄부가 붙잡힘) ·
           콤비(1647.10) · 키푼지(1647) · 루안다 탈환(1648.8) · 강화(1656.10) · 은징가의 죽음(1663.12.17)
     친분(trust): ①(가) ②(가)(나) ③(가) ④(가) ⑤(가) ⑥(가)마다 +1, 배신하면 −. 죽음 소식의 마지막 줄이 친분에 따라 달라진다.
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/nzinga_*.webp — 개발노트에 그림 주문
   ■ 조정값: G.Nzinga.K   ■ 저장: s.nzinga = { met, trust, emb, guns, court, kombi, kombiRes, sa, ransom, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var NZ = G.Nzinga = {};
  function S() { return G.Game && G.Game.state; }
  var LUANDA = 100;
  var K = NZ.K = {
    embFrom: 16211001, embTo: 16220630, baptism: 16220701,
    crown: 16240410, gunsFrom: 16240410, gunsTo: 16260630, kindonga: 16260715,
    matamba: 16311001, courtFrom: 16320101, courtTo: 16410825,
    dutch: 16410826, ngoleme: 16440301, kavanga: 16460301, kifunji: 16471201,
    kombiFrom: 16470901, kombiTo: 16471031, kombi: 16471101,
    saFrom: 16480801, saTo: 16480823, retake: 16480824,
    ransomFrom: 16550101, ransomTo: 16561011, peace: 16561012, death: 16631217,
    gunQty: 60, gunMult: 1.6, betrayGold: 2500, ivoryGold: 3000, kombiFoe: 90, kombiShare: 4000, powderGold: 3000,
    ransom: 6000, ransomSpeech: 0.15, ransomMin: 0.55
  };
  var NEWS_AT = { baptism: K.baptism, crown: K.crown, kindonga: K.kindonga, matamba: K.matamba, dutch: K.dutch, ngoleme: K.ngoleme, kavanga: K.kavanga,
    kifunji: K.kifunji, kombi: K.kombi, retake: K.retake, peace: K.peace, death: K.death };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.nzinga) {
      s.nzinga = { trust: 0, told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.nzinga.told[k] = 1; });   // 옛 저장: 이미 지난 소식은 알린 것으로
    }
    if (!s.nzinga.told) s.nzinga.told = {};
    return s.nzinga;
  }
  NZ.state = st;
  function today() { return U.dateNum(S().date); }
  function atLuanda() { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && s.loc.city === LUANDA); }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var WIC = H('nzinga_wic'), IMB = H('nzinga_imb'), SA = H('salvador_sa');
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      await UI.say(l[1], l[0] === 'P' ? me() : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {});
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function crownTrust(n) {
    if (!G.Sponsor || !G.SPONSOR) return;
    ['pt_king', 'pt_casaindia'].forEach(function (id) { if (G.SPONSOR[id]) { var r = G.Sponsor.rel(id); if (r.met || n < 0) G.Sponsor.addTrust(r, n); } });
  }
  function notoriety(n, why) { var p = S().player; p.notoriety = (p.notoriety || 0) + n; UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200); }
  function keepsake(id, name, desc) { var p = S().player; if (p.items.some(function (x) { return x.id === id; })) return; p.items.push({ id: id, kind: 'keepsake', name: name, desc: desc }); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function trust(n) { var b = st(); b.trust = (b.trust || 0) + n; }
  /** 사람을 사고판 적이 있는가 (js/systems/slavetrade.js) */
  function slaver() { var sv = S().slaver; return !!(sv && ((sv.bought || 0) + (sv.sold || 0) > 0)); }
  function gunsHave() { var cg = S().fleet.cargo.guns; return cg ? cg.q : 0; }
  function takeGuns(n) {
    var s = S(), cg = s.fleet.cargo.guns; if (!cg) return 0;
    n = Math.min(n, cg.q);
    if (R.takeCargoLots) { try { R.takeCargoLots(cg, -1, n, 0); } catch (e) { /* 옛 저장의 짐에는 산 곳 기록이 없다 */ } }
    cg.q -= n; if (cg.q <= 0) delete s.fleet.cargo.guns;
    return n;
  }
  function gunPrice() { var g = G.GOOD && G.GOOD.guns; return g ? g.p : 85; }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 */
  async function fight(name, n, kind) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, { kind: kind, guns: true }); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  // ================================================================ 날마다 — 소식
  NZ.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!b.met;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('baptism', met, 'scroll', '【루안다의 세례】 은동고의 사절 은징가가 루안다의 성당에서 세례를 받고 「아나 드 소우자」가 되었다. 대부는 총독 주앙 코헤이아 드 소우자. 은동고와 포르투갈은 강화를 맺었다 — 적어도 종이 위에서는.');
    news('crown', true, 'crown', '【은동고의 왕】 은동고의 응골라 음반데가 세상을 떠났다. 독을 먹었다는 소문이 돈다. 그의 누이 은징가가 나라를 잇고, 스스로를 「왕」이라 부르게 했다.');
    news('kindonga', true, 'skull', b.guns === 'sell' || b.guns === 'gift'
      ? '【킨동가의 섬】 총독 페르낭 드 소우자의 군대가 콴자 강의 킨동가 섬들을 쳤다. 은징가는 섬을 잃었지만, 섬의 퇴로를 지킨 총병들 덕에 동쪽으로 빠져나갔다고 한다. …제독이 실어다 준 총이었다.'
      : b.guns === 'betray'
        ? '【킨동가의 섬】 총독 페르낭 드 소우자의 군대가 콴자 강의 킨동가 섬들을 쳤다. 섬으로 가던 총은 강가에서 붙잡혔다고 한다. 은징가는 간신히 동쪽으로 달아났다. 포르투갈은 그녀 대신 꼭두각시 왕을 세웠다.'
        : '【킨동가의 섬】 포르투갈 군대가 콴자 강의 킨동가 섬들을 쳤다. 은징가는 동쪽으로 달아났고, 포르투갈은 그녀 대신 꼭두각시 왕을 세웠다.');
    news('matamba', true, 'castle', '【마탐바】 은징가가 임방갈라 전사들과 손잡고 동쪽의 마탐바 왕국을 정복했다. 은동고를 잃은 왕이 새 나라를 얻었다. 노예를 찾는 포르투갈 상인들의 길이 그녀의 땅에서 끊긴다.');
    news('dutch', true, 'ship', '【네덜란드의 루안다】 네덜란드 서인도 회사의 함대가 루안다를 빼앗았다. 포르투갈 사람들은 콴자 강 위쪽 마상가누 요새로 물러났다. 은징가가 곧 네덜란드에 사절을 보냈다고 한다.');
    news('ngoleme', met, 'sword', '【은골레메】 은징가의 군대가 은골레메에서 포르투갈 군을 쳐부수었다. 예순이 넘은 왕이 몸소 전투 도끼를 들었다고 한다.');
    news('kavanga', true, 'skull', '【카방가】 포르투갈 군이 카방가의 은징가 진영을 덮쳤다. 은징가는 빠져나갔지만 막냇동생 캄부가 붙잡혔다. 진영에서 나온 편지들 속에는, 포로로 지내던 동생 키푼지가 몰래 보낸 포르투갈 진영의 소식이 있었다.');
    news('kifunji', met, 'skull', '【키푼지】 포르투갈 사람들이 은징가의 동생 키푼지를 콴자 강에 빠뜨려 죽였다고 한다. 포로로 지내며 언니에게 몰래 편지를 보낸 것이 드러난 뒤였다.');
    news('kombi', true, 'sword', b.kombi === 'ally' && b.kombiRes === 'win'
      ? '【콤비】 은징가와 네덜란드 연합군이 콤비에서 포르투갈 군을 무찔렀다. 제독의 사람들도 그 들판에 있었다. 연합군은 마상가누 요새를 에워쌌다.'
      : '【콤비】 은징가와 네덜란드 서인도 회사의 연합군이 콤비에서 포르투갈 군을 무찌르고 마상가누 요새를 에워쌌다.');
    news('retake', true, 'ship', b.sa === 'evac'
      ? '【루안다 탈환】 살바도르 코헤이아 드 사의 함대가 루안다를 되찾았다. 네덜란드는 항복했고, 은징가는 마상가누의 포위를 풀고 마탐바로 물러났다. 제독이 태워 보낸 사절들은 무사히 마탐바에 닿았다.'
      : '【루안다 탈환】 브라질에서 온 살바도르 코헤이아 드 사의 함대가 루안다를 되찾았다. 네덜란드는 항복했고, 은징가는 포위를 풀고 마탐바로 물러났다.');
    news('peace', true, 'scroll', b.ransom === 'paid'
      ? '【강화】 은징가와 포르투갈이 마침내 강화를 맺었다. 십 년을 붙잡혀 있던 캄부가 언니 곁으로 돌아갔다. 몸값으로 사람이 아니라 제독의 금화가 건네졌다는 이야기가 루안다에 퍼졌다.'
      : '【강화】 은징가와 포르투갈이 강화를 맺었다. 십 년을 붙잡혀 있던 막냇동생 캄부가 몸값을 치르고 돌아갔다. 마탐바와 포르투갈의 경계가 정해졌다.');
    var tr = b.trust || 0;
    news('death', true, 'skull', '【은징가의 죽음】 마탐바의 왕 은징가가 여든 살로 세상을 떠났다. 사십 년 동안 외교와 동맹과 전쟁으로 포르투갈에 맞섰고, 끝내 자기 땅에서 왕으로 죽었다. 동생 캄부가 뒤를 잇는다.' +
      (b.guns === 'betray' ? '' : tr >= 3 ? ' …마탐바에서 온 사절이 전한다. 「왕께서는 마지막까지 바다 건너의 벗을 이야기하셨다.」' : tr >= 1 ? ' 마탐바에서 온 사절이 제독의 이름을 기억하고 있었다.' : ''));
    return out;
  };

  // ================================================================ ① 앉을 자리 없는 방 (1621.10~1622.6)
  function embOpen() { var b = st(), t = today(); return !!(b && !b.emb && atLuanda() && t >= K.embFrom && t <= K.embTo); }
  async function embassy() {
    var b = st(); b.met = 1;
    await withPic('nzinga_chair', '앉을 자리 없는 방 (1622)', function () { return play([
      [null, '루안다 총독 관저. 바다에서 온 손님이라며 제독도 회견장 한쪽에 세워졌다. 총독은 벨벳 의자에 앉아 있고, 그 앞 바닥에는 방석 하나가 놓여 있다 — 은동고의 사절이 앉을 자리다.'],
      [null, '은동고의 사절이 들어온다. 깃털과 구슬로 꾸민 여인이 바닥의 방석을 한 번 내려다본다. 손짓 하나에 따라온 시녀가 무릎을 꿇고 엎드린다. 사절은 그 등에 앉아, 총독과 같은 높이에서 눈을 맞춘다.'],
      ['njinga', '나는 은징가, 은동고의 응골라 음반데의 누이다. 내 오라비를 대신해 말하러 왔다. 은동고는 포르투갈의 벗이 되려고 왔지, 종이 되려고 온 것이 아니다.'],
      ['jcsousa', '벗이라. 좋소. 그렇다면 은동고는 해마다 폐하께 조공을 바쳐야 하오. 노예와 상아로. 그게 벗의 도리요.'],
      ['njinga', '조공은 싸움에 져서 정복당한 나라가 바치는 것이다. 은동고는 정복당하지 않았다. 너희는 우리 땅에 요새를 짓고, 임방갈라 용병들을 끌어들여 우리 마을을 불태웠다. 요새를 거두고 붙잡아 간 우리 사람들을 돌려보내라. 그러면 벗이 되겠다.'],
      ['jcsousa', '(얼굴이 굳어서, 제독 쪽을 돌아보며) …바다를 아는 선장, 그대도 세상의 나라들을 보았겠지. 이 여인의 말이 이치에 맞소?']
    ]); });
    var v = await UI.ask('총독이 제독의 말을 기다린다. 은징가도 제독을 본다.', [
      { label: '「조공은 정복당한 나라가 바치는 것입니다. 이분의 말이 맞습니다」', value: 'nz', icon: 'scales' },
      { label: '「총독 각하의 뜻이 옳습니다. 강한 나라가 정하는 법입니다」', value: 'pt', icon: 'crown' },
      { label: '입을 다문다', value: 'quiet' }], me());
    b.emb = v || 'quiet';
    if (b.emb === 'nz') {
      trust(1); crownTrust(-2);
      await play([
        ['jcsousa', '…흥. 바다 사람들은 말이 많군.'],
        ['njinga', '(회견이 끝나고 나가는 길에, 제독 곁을 지나며 낮게) 이방인 가운데 이치를 아는 자가 있구나. 기억해 두겠다.'],
        [null, '은징가가 일어선 뒤에도 시녀는 그 자리에 엎드려 있었다. 누군가 데려가라고 하자 은징가가 말했다 — 「은동고의 사절은 같은 의자에 두 번 앉지 않는다. 그 의자는 두고 간다.」']
      ]);
      var so = G.Fame.add('so', 60);
      G.State.log('루안다 총독 관저에서 은동고의 사절 은징가의 편에 서서 「조공은 정복당한 나라가 바치는 것」이라고 말했다. (사교 명성 +' + so + ')');
    } else if (b.emb === 'pt') {
      crownTrust(4); S().player.gold += 800;
      await play([['jcsousa', '옳소! 들었소, 사절? 바다 건너 사람들도 이렇게 말하오.'], ['njinga', '(제독을 한 번 쳐다보고) 장사꾼은 늘 강한 쪽에 서지. 바람이 바뀌는 날을 기다려 보아라.'], ['jcsousa', '(회견 뒤) 그대의 말이 도움이 되었소. 관저의 사례요.']]);
      G.State.log('루안다 총독 관저에서 총독의 편에 섰다. (금화 +800)');
      UI.toast('금화 +800', 'coin', 4200);
    } else {
      await play([[null, '제독은 아무 말도 하지 않았다. 회견은 몇 주 동안 이어졌고, 결국 총독은 요새 하나를 거두겠다고 약속했다. 사람들은 그 약속을 오래 믿지 않았다.']]);
      G.State.log('루안다 총독 관저에서 은동고의 사절 은징가와 총독의 회견을 지켜보았다.');
    }
    refresh();
  }

  // ================================================================ ② 킨동가의 섬 (1624.4~1626.6)
  function gunsOpen() { var b = st(), t = today(); return !!(b && !b.guns && atLuanda() && t >= K.gunsFrom && t <= K.gunsTo); }
  async function gunsScene() {
    var b = st(), s = S(); b.met = 1;
    var have = gunsHave(), price = Math.round(gunPrice() * K.gunMult), sum = price * K.gunQty;
    await withPic('nzinga_kifunji', '키푼지의 부탁 (1625)', function () { return play([
      [null, '루안다 노예 시장 뒤편 골목. 푸른 천을 머리에 두른 여인이 제독을 부른다. 곁의 사내들은 상인 옷을 입었지만 걸음걸이가 전사의 것이다.'],
      ['kifunji', '나는 키푼지, 은징가의 동생이다. 언니는 이제 은동고의 왕이다. 오라비가 죽자 포르투갈은 우리 땅의 영주들에게 언니를 따르지 말라고 부추긴다. 새 총독 페르낭 드 소우자는 군대를 모으고 있다.'],
      ['kifunji', b.emb === 'nz' ? '언니가 말하더라. 총독 관저에서 이치를 아는 이방인을 보았다고. 그대에게 부탁한다.' : '바다의 선장, 그대에게 부탁할 것이 있다.'],
      ['kifunji', '언니는 콴자 강 한가운데 킨동가 섬들로 궁을 옮겼다. 강이 성벽이다. 그러나 포르투갈의 총 앞에서는 화살로 오래 못 버틴다. 총이 필요하다. ' + K.gunQty + '자루. 값은 상아로 넉넉히 치르겠다.']
    ]); });
    var opts = [];
    if (have >= K.gunQty) {
      opts.push({ label: '총 ' + K.gunQty + '자루를 판다 (금화 ' + U.num(sum) + '닢)', value: 'sell', icon: 'coin' });
      opts.push({ label: '총 ' + K.gunQty + '자루를 거저 준다', value: 'gift', icon: 'heart' });
    }
    opts.push({ label: have >= K.gunQty ? '남의 전쟁에 총을 팔지 않겠다 — 거절한다' : '실은 총이 없다 (총 ' + K.gunQty + '자루가 있어야 한다) — 거절한다', value: 'no' });
    opts.push({ label: '총독에게 이 일을 일러바친다', value: 'betray', icon: 'skull' });
    var v = await UI.ask('키푼지가 은동고의 왕을 위해 총을 구한다. (실은 총 ' + have + '자루)', opts, me());
    b.guns = v || 'no';
    if (b.guns === 'sell' || b.guns === 'gift') {
      takeGuns(K.gunQty);
      if (b.guns === 'sell') { s.player.gold += sum; trust(1); }
      else { trust(2); }
      crownTrust(-3);
      await play([
        [null, '그날 밤, 총 상자들이 상아 더미 아래 숨겨져 강을 거슬러 오르는 카누에 실렸다.'],
        ['kifunji', b.guns === 'gift' ? '…값을 받지 않겠다고? 은동고 사람은 빚을 지고는 살지 못한다. 언니에게 그대의 이름을 전하겠다. 그 이름은 잊히지 않을 것이다.' : '값은 치렀다. 이제 그대와 은동고는 같은 강을 건넌 사이다.']
      ]);
      var so = G.Fame.add('so', b.guns === 'gift' ? 120 : 50);
      G.State.log('루안다에서 은징가의 동생 키푼지에게 총 ' + K.gunQty + '자루를 ' + (b.guns === 'gift' ? '거저 주었다' : '팔았다 (금화 +' + U.num(sum) + ')') + '. (사교 명성 +' + so + ')');
      UI.toast('총 −' + K.gunQty + (b.guns === 'sell' ? ' · 금화 +' + U.num(sum) : ''), 'coin', 5000);
    } else if (b.guns === 'betray') {
      s.player.gold += K.betrayGold; trust(-3); crownTrust(5);
      await play([
        ['fsousa', '(총독 관저에서) 은징가의 누이가 루안다 골목에 있었다고? …잘 알려 주었소. 강가에 사람을 풀겠소. 사례요.'],
        [null, '키푼지는 붙잡히지 않았다. 그러나 골목에서 그녀를 따르던 사내 둘이 강가에서 붙잡혀 사슬에 묶였다.']
      ]);
      notoriety(3, '은징가의 사람들을 총독에게 팔아넘겼다');
      G.State.log('루안다에서 은징가의 동생 키푼지가 총을 구한다는 것을 총독 페르낭 드 소우자에게 일러바쳤다. (금화 +' + U.num(K.betrayGold) + ')');
    } else {
      await play([['kifunji', have >= K.gunQty ? '…그렇군. 다른 배를 찾겠다.' : '총이 없다면 할 수 없지. 다음에 루안다에 올 때는 총을 실어 오너라. 언니는 기다리지 않겠지만.']]);
      G.State.log('루안다에서 은징가의 동생 키푼지의 부탁을 거절했다.');
    }
    refresh();
  }

  // ================================================================ ③ 마탐바의 왕 (1632~1641.8)
  function courtOpen() { var b = st(), t = today(); return !!(b && !b.court && b.guns !== 'betray' && atLuanda() && t >= K.courtFrom && t <= K.courtTo); }
  async function court() {
    var b = st(), s = S(); b.met = 1;
    await play([
      [IMB, '(부두에서 제독을 막아서며) 바다의 선장. 마탐바의 응골라께서 그대를 부르신다. 콴자 강을 거슬러, 우리 킬롬보로.']
    ]);
    var go = await UI.ask('은징가의 사절이 마탐바로 오라고 한다. 콴자 강을 거슬러 한 달 가까이 걸리는 길이다.', [
      { label: '간다', value: 'go', icon: 'boot' }, { label: '가지 않는다', value: 'no' }], me());
    if (go !== 'go') { b.court = 'no'; G.State.log('루안다에서 마탐바의 왕 은징가가 보낸 사절의 부름을 사양했다.'); return; }
    var cold = slaver();
    await withPic('nzinga_kilombo', '마탐바의 킬롬보 (1630년대)', function () { return play([
      [null, '카누로 강을 거슬러 오르고, 다시 풀숲을 걸어 동쪽으로. 마탐바의 킬롬보는 말뚝 울타리로 둘러싼 거대한 전사의 진영이다. 북과 쇠방울 소리가 그치지 않는다.'],
      [null, '높은 단 위에 표범 가죽을 두른 사람이 앉아 있다. 쉰이 넘었다는데 몸이 꼿꼿하다. 둘레의 전사들이 그 사람을 「응골라」 — 왕이라 부른다.'],
      ['njinga', '나는 여왕이 아니다. 왕이다. 은동고의 응골라이고, 이제 마탐바의 응골라다. 포르투갈은 내게서 은동고를 빼앗았지만, 나는 마탐바를 얻었다. 임방갈라 전사들은 나를 그들의 대장으로 모신다.'],
      cold ? ['njinga', '…그런데 그대의 배가 사람을 싣고 바다를 건넌 적이 있다고 들었다. 내 백성을 사슬에 묶어 가는 배와 나는 벗이 될 수 없다. 장사라면 하겠다. 그 이상은 없다.']
        : ['njinga', b.guns === 'gift' || b.guns === 'sell' ? '킨동가의 섬에서 그대의 총이 내 사람들의 퇴로를 지켰다. 키푼지가 그대의 이름을 말해 주었다.' : b.emb === 'nz' ? '루안다의 관저에서 「조공은 정복당한 나라가 바치는 것」이라 말한 이방인 — 그대였지.' : '바다 건너에서 온 자, 그대가 포르투갈의 종이 아니라면 이야기를 하자.'],
      ['njinga', '포르투갈은 끝없이 온다. 요새를 짓고, 영주들을 매수하고, 사람을 사슬에 묶어 바다 건너로 보낸다. 나는 칼로도 싸우고, 말로도 싸운다. 세례도 받았고, 임방갈라의 법도 따랐다. 은동고를 지키는 길이라면 무엇이든 한다.']
    ]); });
    var opts = [];
    if (!cold) opts.push({ label: '은징가와 벗의 맹세를 나눈다', value: 'oath', icon: 'heart' });
    opts.push({ label: '상아를 사는 장사만 한다 (금화 ' + U.num(K.ivoryGold) + '닢어치)', value: 'trade', icon: 'coin' });
    var v = await UI.ask('마탐바의 킬롬보에서 — 은징가가 제독의 대답을 기다린다.', opts, me());
    b.court = v || 'trade';
    if (b.court === 'oath') {
      trust(1);
      await play([
        [null, '은징가가 단에서 내려와 전투 도끼를 제독의 손에 쥐여 준다. 임방갈라 전사들이 북을 세 번 울린다.'],
        ['njinga', '이 도끼는 은골라 왕들의 것이다. 그대가 이것을 가지고 있는 한, 은동고와 마탐바의 사람은 그대를 해치지 않는다. 그리고 — 포르투갈이 무너지는 날이 오면, 그대의 배가 내 곁에 있기를 바란다.']
      ]);
      keepsake('njinga_axe', '은징가의 전투 도끼', '마탐바의 킬롬보에서 은징가가 벗의 맹세로 건넨 은골라 왕의 전투 도끼. 이것을 지닌 이를 은동고와 마탐바의 사람은 해치지 않는다.');
      var so = G.Fame.add('so', 150);
      G.State.log('마탐바의 킬롬보에서 왕 은징가와 벗의 맹세를 나누고 전투 도끼를 받았다. (사교 명성 +' + so + ')');
      UI.toast('은징가의 전투 도끼 — 벗의 맹세', 'heart', 5200);
    } else {
      s.player.gold += K.ivoryGold;
      await play([['njinga', cold ? '장사는 장사다. 상아를 가져가라. 그리고 다시는 사람을 싣지 마라.' : '좋다, 장사꾼. 상아를 가져가라. 그대가 언젠가 장사보다 큰 것을 볼 날이 오기를.']]);
      G.State.log('마탐바의 킬롬보에서 은징가와 상아를 거래했다. (금화 +' + U.num(K.ivoryGold) + ')');
      UI.toast('상아 거래 — 금화 +' + U.num(K.ivoryGold), 'coin', 4200);
    }
    refresh();
  }

  // ================================================================ ④ 콤비 전투 (1647.9~10, 네덜란드령 루안다)
  function kombiOpen() { var b = st(), t = today(); return !!(b && !b.kombi && atLuanda() && t >= K.kombiFrom && t <= K.kombiTo); }
  async function kombi() {
    var b = st(), s = S(); b.met = 1;
    var friend = (b.trust || 0) >= 1 && b.guns !== 'betray';
    await withPic('nzinga_kombi', '콤비로 가는 길 (1647)', function () { return play([
      [null, '루안다 성채에 네덜란드 서인도 회사의 주황·하양·파랑 깃발이 펄럭인다. 부두에서 머스킷을 멘 병사들이 카누에 오른다.'],
      [WIC, (s.player.nation === 'NL' ? '조국의 배로군! ' : '') + '마탐바의 왕과 우리는 동맹이오. 포르투갈 놈들은 콴자 강 위쪽 마상가누 요새에 틀어박혀 있지. 은징가가 군대를 이끌고 내려오는 중이오. 우리도 간다.'],
      [IMB, '(은징가의 전령) 응골라께서 전하신다. 「작년 카방가에서 포르투갈이 내 막냇동생 캄부를 끌고 갔다. 키푼지는 아직 그들 손에 있다. 이번에는 내가 그들의 요새를 찾아간다.」'],
      [IMB, friend ? '응골라께서 그대의 이름을 부르셨다. 바다의 벗이 함께 오기를 바라신다고.' : '바다의 선장, 그대의 총병이 있다면 연합군에 들어오라.']
    ]); });
    var v = await UI.ask('콤비 — 은징가와 네덜란드의 연합군이 포르투갈 군을 치러 간다.', [
      { label: '연합군에 들어 싸운다', value: 'ally', icon: 'sword' },
      { label: '몰래 마상가누의 포르투갈 요새에 화약을 실어 나른다 (금화 ' + U.num(K.powderGold) + '닢)', value: 'pt', icon: 'coin' },
      { label: '물러난다', value: 'leave' }], me());
    b.kombi = v || 'leave';
    if (b.kombi === 'ally') {
      var res = await fight('포르투갈 군과 「검은 군대」', K.kombiFoe, 'garrison');
      b.kombiRes = res; trust(1); crownTrust(-6);
      if (res === 'win') {
        s.player.gold += K.kombiShare;
        var bt = G.Fame.add('bt', 200);
        await play([
          [null, '콤비의 들판. 네덜란드 머스킷이 일제히 불을 뿜고, 은징가의 전사들이 함성을 지르며 달려든다. 포르투갈의 「검은 군대」가 먼저 무너졌고, 포르투갈 병사들도 뒤따라 달아났다.'],
          ['njinga', '(피 묻은 전투 도끼를 든 채, 예순이 넘은 왕이 웃는다) 보았느냐! 은동고의 땅이 은동고를 지켰다. 그대는 오늘 우리 편이었다. 이제 마상가누다.']
        ]);
        G.State.log('콤비에서 은징가와 네덜란드의 연합군에 들어 포르투갈 군을 무찔렀다. (금화 +' + U.num(K.kombiShare) + ' · 전투 명성 +' + bt + ')');
        UI.toast('콤비 전투 — 금화 +' + U.num(K.kombiShare), 'coin', 5200);
      } else {
        await play([[null, '제독의 사람들은 밀려났지만, 은징가의 전사들이 들판을 휩쓸었다. 그날 해가 질 때 콤비는 연합군의 것이었다.'], ['njinga', '물러섰어도 도망치지 않았다. 은동고는 그것을 기억한다.']]);
        G.State.log('콤비에서 연합군에 들어 싸웠다. 제독의 사람들은 밀려났지만 싸움은 연합군이 이겼다.');
      }
    } else if (b.kombi === 'pt') {
      s.player.gold += K.powderGold; trust(-2); crownTrust(6);
      await play([[null, '밤에 화약통을 실은 카누가 콴자 강을 거슬러 마상가누로 들어갔다. 요새의 포르투갈 사람들은 그 화약으로 포위를 버텼다.'], [null, '며칠 뒤 루안다 부두에서 임방갈라 전령이 제독의 배를 오래 노려보고 갔다.']]);
      G.State.log('콤비 전투 무렵 마상가누의 포르투갈 요새에 화약을 몰래 실어 날랐다. (금화 +' + U.num(K.powderGold) + ')');
      UI.toast('금화 +' + U.num(K.powderGold) + ' · 은징가와 멀어졌다', 'coin', 4800);
    } else G.State.log('네덜란드령 루안다에서 콤비로 가는 연합군을 배웅했다.');
    refresh();
  }

  // ================================================================ ⑤ 사의 함대 (1648.8.1~23)
  function saOpen() { var b = st(), t = today(); return !!(b && !b.sa && atLuanda() && t >= K.saFrom && t <= K.saTo); }
  async function saScene() {
    var b = st(); b.met = 1;
    await play([
      [null, '루안다 앞바다에 포르투갈 함대 열다섯 척이 나타났다. 브라질에서 온 배들이다. 성채의 네덜란드 병사들이 허둥지둥 성문을 닫는다.'],
      [SA, '(함대에서 보낸 전갈) 나는 살바도르 코헤이아 드 사, 리우데자네이루에서 왔다. 성채는 사흘 안에 항복하라. 이 항구의 배들은 닻을 내린 채 있으라.'],
      [IMB, '(제독을 찾아와 숨이 차서) 응골라의 사절들이 아직 성 안에 있다. 다친 네덜란드 병사들도. 포르투갈이 들어오면 우리를 가만두지 않을 거다. 그대 배로 빼내 줄 수 있겠나?']
    ]);
    var v = await UI.ask('루안다, 1648년 8월 — 포르투갈 함대가 성채를 에워쌌다.', [
      { label: '밤에 사절들과 다친 병사들을 배에 태워 빼낸다', value: 'evac', icon: 'ship' },
      { label: '닻을 내린 채 기다린다', value: 'wait' }], me());
    b.sa = v === 'evac' ? 'evac' : 'wait';
    if (b.sa === 'evac') {
      trust(1); crownTrust(-4);
      await play([[null, '등불을 끄고 해안을 따라 남쪽으로. 사흘 뒤 콴자 강 어귀에서 사절들을 내려 주었다. 다친 네덜란드 병사들은 산토메로 가는 배를 찾았다.'], [IMB, '응골라께서 이 일을 들으실 것이다.']]);
      var so = G.Fame.add('so', 100);
      G.State.log('포르투갈 함대가 루안다를 에워쌌을 때 은징가의 사절들과 다친 네덜란드 병사들을 배로 빼냈다. (사교 명성 +' + so + ')');
    } else G.State.log('루안다 앞바다에서 살바도르 코헤이아 드 사의 함대가 성채를 에워싸는 것을 보았다.');
    refresh();
  }

  // ================================================================ ⑥ 동생의 몸값 (1655~1656.10.11)
  function ransomOpen() { var b = st(), t = today(); return !!(b && !b.ransom && atLuanda() && t >= K.ransomFrom && t <= K.ransomTo); }
  NZ.ransomCost = function () { var sp = R.skill ? R.skill('speech') : 0; return Math.round(K.ransom * Math.max(K.ransomMin, 1 - K.ransomSpeech * sp)); };
  async function ransom() {
    var b = st(), s = S(); b.met = 1;
    var cost = NZ.ransomCost(), sp = R.skill ? R.skill('speech') : 0;
    await withPic('nzinga_kambu', '캄부의 몸값 (1656)', function () { return play([
      [null, '루안다 총독 관저의 안뜰. 갈색 수도복의 카푸친 수도사가 마탐바에서 온 사절들과 포르투갈 관리들 사이를 오간다. 한쪽 방에 마른 여인이 묵주를 쥐고 앉아 있다.'],
      ['kambu', '나는 캄부, 은징가의 동생이다. 카방가에서 붙잡혀 온 지 십 년이 되었다. 언니는 일흔이 넘었다. 죽기 전에 한 번만 보고 싶다.'],
      ['gaeta', '마탐바의 왕은 다시 하느님의 품으로 돌아오겠다고 하셨소. 강화의 조건도 거의 맞추었소. 그런데 몸값이 걸림돌이오. 총독은 동생의 몸값으로 사람 백삼십 명을 요구하오.'],
      ['gaeta', '은징가 왕은 「내 백성을 사슬에 묶어 동생과 바꾸라는 말이냐」 하며 몇 해째 버티고 계시오. …선장, 그대가 사람 대신 금화를 대겠다면, 총독도 체면을 세울 수 있을 거요.']
    ]); });
    var opts = [];
    if (s.player.gold >= cost) opts.push({ label: '사람 대신 금화 ' + U.num(cost) + '닢을 대겠다' + (sp ? ' (웅변으로 깎았다)' : ''), value: 'paid', icon: 'coin' });
    opts.push({ label: s.player.gold >= cost ? '끼지 않는다' : '금화가 모자라다 (' + U.num(cost) + '닢) — 끼지 않는다', value: 'no' });
    var v = await UI.ask('캄부의 몸값 — 사람 백삼십 명 대신 금화로?', opts, me());
    b.ransom = v === 'paid' && s.player.gold >= cost ? 'paid' : 'no';
    if (b.ransom === 'paid') {
      s.player.gold -= cost; trust(1);
      await play([
        ['gaeta', '하느님께서 그대를 기억하실 거요. 총독도 금화라면 받겠다고 하오. 이제 사람을 사슬에 묶지 않고도 강화를 맺을 수 있소.'],
        ['kambu', '(묵주를 제독의 손에 쥐여 주며) 십 년 동안 이것만 쥐고 기도했다. 이제 언니에게 간다. 이것은 그대가 가져라.']
      ]);
      keepsake('kambu_rosary', '캄부의 묵주', '포르투갈에 십 년 동안 붙잡혀 있던 은징가의 동생 캄부가 몸값을 대신 치른 제독에게 건넨 묵주. 구슬 하나하나가 손때로 닳았다.');
      var so = G.Fame.add('so', 200);
      G.State.log('루안다에서 은징가의 동생 캄부의 몸값을 사람 대신 금화 ' + U.num(cost) + '닢으로 치렀다. (사교 명성 +' + so + ')');
      UI.toast('금화 −' + U.num(cost) + ' · 캄부의 묵주', 'heart', 5200);
    } else G.State.log('루안다에서 은징가의 동생 캄부의 몸값을 둘러싼 협상을 지켜보았다.');
    refresh();
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  NZ.pending = function () { if (!S()) return false; return embOpen() || gunsOpen() || courtOpen() || kombiOpen() || saOpen() || ransomOpen(); };
  NZ.check = async function () {
    if (NZ._busy) return false; NZ._busy = true;
    try {
      if (embOpen()) await embassy();
      else if (gunsOpen()) await gunsScene();
      else if (courtOpen()) await court();
      else if (kombiOpen()) await kombi();
      else if (saOpen()) await saScene();
      else if (ransomOpen()) await ransom();
    } catch (e) { console.error(e); }
    NZ._busy = false;
    return true;
  };
  NZ.html = function () {
    var s = S(), b = s && s.nzinga; if (!b || !b.met) return '';
    var t = today(), li = [];
    if (!b.guns && t >= K.gunsFrom && t <= K.gunsTo) li.push('1626년 6월까지 루안다 — 은징가의 동생이 총 ' + K.gunQty + '자루를 구한다');
    if (!b.court && b.guns !== 'betray' && t >= K.courtFrom && t <= K.courtTo) li.push('1641년 8월까지 루안다 — 마탐바의 왕이 사절을 보낸다');
    if (!b.kombi && t >= K.dutch && t <= K.kombiTo) li.push('1647년 9~10월 루안다(네덜란드령) — 연합군이 콤비로 간다');
    if (!b.ransom && t >= K.kavanga && t <= K.ransomTo) li.push('1655~1656년 10월 루안다 — 붙잡힌 동생 캄부의 몸값');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">은동고와 마탐바 — 은징가</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._nzHtml) { G.Court._nzHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + NZ.html(); }; }
  NZ._t = { embassy: embassy, guns: gunsScene, court: court, kombi: kombi, sa: saScene, ransom: ransom };
})(window.G = window.G || {});
