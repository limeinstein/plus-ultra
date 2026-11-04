/* 동인도 회사의 탄생 (G.EIndia) — 2026-11-04 사용자 요청 「동인도 회사(영국·네덜란드 따로) 설립 · 미인·미남이 동료가 되는 위기의 절정」
   사람·조정값: js/data/eastindia.js (G.BALANCE.eindia). 역사는 바뀌지 않는다 — 제독이 그 자리에 있었고, 한 사람을 건져 왔을 뿐이다.
   ■ 설립
     ① 잉글랜드 (1600.9.22~1601.2.13, 런던): 토머스 스마이스가 출자 명부를 돌린다 · 12월 31일 엘리자베스 여왕의 특허장.
        출자(opts 가운데 하나) → 1604년 봄, 랭커스터의 첫 항해가 후추를 싣고 돌아와 원금의 ret배를 돌려준다 (소식과 함께 금화).
     ② 네덜란드 (1602.3.20~8.31, 암스테르담): 연합 동인도 회사(VOC) — 누구나 살 수 있는 세상의 첫 주식. 이삭 르메르.
        청약 → 1610년 첫 배당(액면의 div — 메이스로 받아 팔아 금화) · 1603년부터 암스테르담에 들르면 그해 주가(curve)로 팔 수 있다.
   ■ 위기의 절정 — 동료가 되는 네 사람
     ③ 1612 수왈리 해전 (10~12월, 디우): 베스트의 레드 드래건호와 포르투갈 함대가 맞붙은 혼란 속, 바람이 멎은 아르메니아 배를 말라바르 해적이 덮친다.
        갑판의 싸움(육상전)에 이기면 마리암 하코비안 · 지면 다음에(again일)
     ④ 1619 자야카르타의 불 (1618.12~1619.5.30, 반탐): 쿤이 자야카르타를 불태운다. 왕가의 아가씨 칸차나가 백성들을 반텐으로 피신시킨다.
        (가) 피란민의 길을 막는 VOC 병사들과 싸운다 (나) VOC 대위에게 금화 bribe를 쥐여 준다 (다) 떠난다 → (가)(나) 동료
     ⑤ 1621 반다의 비극 (2~12월, 암보이나 → 남쪽 반다): 오랑 카야들이 처형되던 날, 육두구 묘목을 안고 달아나는 이드리스.
        해안의 VOC 병사들과 싸워 그를 배에 태운다 → 동료 (육두구 묘목)
     ⑥ 1623 암보이나 사건 (2.15~3.8, 암보이나): 반역 누명을 쓴 잉글랜드 상관 사람들 — 젊은 서기 에드먼드 헤일.
        (가) 판스페울트 앞에서 그를 변호한다 (웅변 speech 이상 — 역사에서도 두 사람은 사면받았다) (나) 처형 전날 밤 감옥을 깬다(육상전) (다) 떠난다
   ■ 소식 (누구나): 동인도 회사 특허장 · VOC(네덜란드 독립 전쟁에서 이미 들은 사람은 빼고) · 수왈리 해전 · 바타비아 · 반다 · 암보이나
   ■ 물러서거나 막히면 again일 뒤 다시(기한 안에서). 장면 그림: images/legend-events/ei_* — EASTINDIA_PROMPT.md
   ■ 저장: s.eindia = { told: {}, eic: 낸 돈, eicPaid, voc: 낸 돈(액면), vocDiv, vocSold, swally, jakatra, banda, amboyna, <열쇠>How, <열쇠>Cool } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var EI = G.EIndia = {};
  function K() { return G.BALANCE.eindia; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['eic', 'voc', 'swally', 'batavia', 'banda', 'amboyna'];
  var NEWS_AT = { eic: 16001231, voc: 16020320, swally: 16121130, batavia: 16190530, banda: 16210508, amboyna: 16230309 };
  EI.NEWS_AT = NEWS_AT;
  function st() {
    var s = S(); if (!s) return null;
    if (!s.eindia) { s.eindia = { told: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.eindia.told[k] = 1; }); }
    s.eindia.told = s.eindia.told || {};
    return s.eindia;
  }
  EI.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { var s = S(); return !!(s.flags && s.flags['gone_' + id]); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var ALIAS = { mariam: '아르메니아 아가씨', kancana: '금 장식의 아가씨', idris: '묘목을 안은 사내', edmund: '사슬에 묶인 젊은이' };
  var known = {};
  function mate(id) { var sp = G.Legend && G.Legend.speaker ? G.Legend.speaker(id) : { name: G.MATE[id].name, portrait: G.Scenes.mateSpec(id), lang: 3 }; return known[id] ? sp : Object.assign({}, sp, { name: ALIAS[id] || sp.name }); }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    if (G.MATE[k] && ALIAS[k]) return mate(k);
    return G.Hist ? G.Hist.speaker('ei_' + k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; if (l[2] === 'name') known[l[0]] = true; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id), who: null }; return { lv: (b && b.lv) || 0, who: (b && b.who) || '제독' }; }
  function item(id) { return R.addItem ? R.addItem(id) !== false : false; }
  function num(n) { return U.num(Math.round(n)); }
  function join(id, cityId) {
    var s = S(), c = G.CITY_DATA[cityId];
    var nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null;
    if (!nm) { nm = { id: id, role: 'none', joined: today(), loyal: K().loyal }; s.mates.push(nm); }
    nm.loyal = Math.max(nm.loyal || 0, K().loyal || 80);
    known[id] = true;
    if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    return nm;
  }
  function free(id) { return !!(G.MATE[id] && !row(id) && !gone(id)); }
  function later(key, how) { var b = st(); b[key] = null; b[key + 'How'] = how; b[key + 'Cool'] = S().day + (K().again || 180); }
  function cooled(key) { var b = st(); return !(b[key + 'Cool'] > S().day); }
  function open(key, mateId) { var b = st(), k = K()[key], t = today(); return !!(b && !b[key] && cooled(key) && (!mateId || free(mateId)) && cityNow() === k.city && t >= k.from && t <= k.to); }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 출자·청약 고르기 — 소지금 안에서 */
  async function invest(opts, title, sp) {
    var g = S().player.gold;
    var v = await UI.ask(title + ' — 소지금 ' + num(g) + '닢', opts.map(function (n) { return { label: '금화 ' + num(n) + '닢을 낸다', value: n, dis: g < n }; }).concat([{ label: '내지 않는다', value: 0 }]), sp);
    v = +v || 0;
    if (v > 0 && g >= v) { S().player.gold -= v; return v; }
    return 0;
  }

  // ================================================================ ① 잉글랜드 동인도 회사 (1600)
  EI.eic = async function () {
    var b = st(), k = K().eic; b.eicMet = 1;
    await withPic('ei_eic_founders', '런던 상인들의 출자 (1600)', function () { return play([
      [null, '런던, 레든홀 거리의 한 저택. 털옷을 입은 상인들이 긴 탁자에 둘러앉아 서로의 이름을 명부에 적고 있다. 지난해 네덜란드 배들이 향료 제도에서 후추를 가득 싣고 돌아와 값을 세 배로 올렸다는 소식이 런던을 뒤흔들었다.'],
      ['smythe', '바다에서 오신 분이로군. 나는 토머스 스마이스, 이 모임의 총재를 맡았소. 우리 잉글랜드 상인들도 희망봉 너머로 직접 배를 보내려 하오. 네덜란드 놈들 손에 후추 값을 맡길 수는 없지.'],
      ['smythe', '여왕 폐하께서 특허장을 내려 주시면, 희망봉에서 마젤란 해협까지 — 동쪽 바다의 장사는 열다섯 해 동안 우리 회사만 할 수 있소. 첫 함대는 랭커스터 선장이 이끌고 내년 봄에 떠나오.'],
      ['lancaster', '배 네 척, 사람 사백. 지난번 항해에서 선원 절반을 괴혈병으로 잃었소. 이번엔 레몬 즙을 싣고 가겠소. …돌아오는 데는 두 해, 운이 나쁘면 세 해가 걸리오.'],
      ['smythe', '어떻소, 그대도 한 몫 넣겠소? 배가 돌아오면 원금과 이익을 나누오. 돌아오지 못하면 — 바다의 일이지.']
    ]); });
    var paid = await invest(k.opts, '잉글랜드 동인도 회사에 출자할까?', who('smythe'));
    if (paid) {
      b.eic = paid; item('eic_charter');
      await play([['smythe', '좋소! 명부에 그대 이름을 적겠소. 랭커스터의 레드 드래건호가 후추를 싣고 돌아오는 날, 그대 몫을 셈해 보내리다.']]);
      log('런던에서 잉글랜드 동인도 회사에 금화 ' + num(paid) + '닢을 출자했다. 랭커스터의 첫 항해가 돌아오면 셈해 준다.');
      UI.toast('동인도 회사에 출자했다 — 금화 ' + num(paid) + '닢 (첫 항해가 돌아오면 정산)', 'coin', 5200);
    } else {
      b.eic = -1;
      await play([['smythe', '하하, 신중한 분이로군. 바다의 장사는 원래 그런 거요.']]);
    }
    refresh(); return true;
  };

  // ================================================================ ② 네덜란드 연합 동인도 회사 (1602)
  EI.vocPrice = function (y) {
    var c = K().voc.curve; y = y || S().date.y;
    if (y <= c[0][0]) return c[0][1];
    for (var i = 1; i < c.length; i++) if (y <= c[i][0]) { var a = c[i - 1], z = c[i]; return a[1] + (z[1] - a[1]) * (y - a[0]) / (z[0] - a[0]); }
    return c[c.length - 1][1];
  };
  EI.voc = async function () {
    var b = st(), k = K().voc; b.vocMet = 1;
    await withPic('ei_voc_house', '연합 동인도 회사 (1602)', function () { return play([
      [null, '암스테르담. 운하 옆 회사 사무소 앞에 줄이 늘어섰다. 상인, 목수, 하녀, 목사 — 누구든 몫을 살 수 있다는 소문에 도시가 들썩인다. 여섯 도시의 작은 회사들이 서로 값을 깎아 먹다 못해 하나로 묶였다. 「연합 동인도 회사」, VOC다.'],
      ['lemaire', '나는 이삭 르메르. 이 회사에 가장 많이 넣은 사람 가운데 하나지. 잘 보시오 — 이건 배 한 번에 몫을 거는 장사가 아니오. 회사가 스물한 해 동안 계속 배를 보내고, 몫을 가진 자는 그 몫을 남에게 팔 수도 있소. 세상에 처음 생긴 물건이지.'],
      ['lemaire', '「주식」이라고들 부르더군. 몫을 쥔 사람은 배가 돌아올 때마다 이익을 나누어 받고, 급하면 거래소에서 팔면 그만이오. …물론 값은 오르기도 하고 내리기도 하지. 하하.']
    ]); });
    var paid = await invest(k.opts, 'VOC 주식을 청약할까?', who('lemaire'));
    if (paid) {
      b.voc = paid; item('voc_share');
      await play([['lemaire', '좋소! 그대 이름이 장부에 올랐소. 몇 해 기다리시오. 그동안 몫이 필요 없어지면 암스테르담 거래소에서 사겠다는 사람을 찾을 수 있을 거요.']]);
      log('암스테르담에서 연합 동인도 회사(VOC) 주식을 금화 ' + num(paid) + '닢어치 청약했다.');
      UI.toast('VOC 주식 청약 — 액면 금화 ' + num(paid) + '닢 (1610년 첫 배당 · 암스테르담에서 팔 수 있다)', 'coin', 5200);
    } else {
      b.voc = -1;
      await play([['lemaire', '아쉽구려. 언젠가 이 종이 한 장이 배 한 척보다 비싸지는 날이 올 거요.']]);
    }
    refresh(); return true;
  };
  function vocSellOpen() { var b = st(), t = today(); return !!(b && b.voc > 0 && !b.vocSold && cityNow() === K().voc.city && t >= 16030101 && b.vocAsk !== S().day); }
  EI.vocSell = async function () {
    var b = st(); b.vocAsk = S().day;
    var px = EI.vocPrice(), val = Math.round(b.voc * px);
    var v = await UI.ask('암스테르담 거래소 — VOC 주식(액면 ' + num(b.voc) + '닢)의 오늘 값은 액면의 ' + px.toFixed(2) + '배, 금화 ' + num(val) + '닢', [{ label: '판다 (금화 ' + num(val) + '닢)', value: 'sell' }, { label: '계속 쥐고 있는다', value: 'keep' }], who('lemaire'));
    if (v === 'sell') {
      b.vocSold = val; S().player.gold += val;
      log('암스테르담 거래소에서 VOC 주식(액면 ' + num(b.voc) + '닢)을 금화 ' + num(val) + '닢에 팔았다.');
      UI.toast('VOC 주식을 팔았다 — 금화 +' + num(val), 'coin', 5200);
      refresh();
    }
    return true;
  };

  // ================================================================ ③ 1612 수왈리 해전 — 마리암 하코비안
  EI.swally = async function () {
    var b = st(), k = K().swally; b.swally = 'met';
    await withPic('ei_swally', '수왈리 앞바다 (1612)', function () { return play([
      [null, '디우에서 북동쪽, 수라트 앞 수왈리의 얕은 물목. 잉글랜드 동인도 회사의 레드 드래건호와 호시앤더호가 포르투갈 갤리온들과 포연 속에 맞붙었다. 해안에서는 무굴 사람들이 구경하듯 지켜본다 — 이긴 쪽이 수라트의 장사를 얻는다.'],
      ['best', '(멀리서 확성 나팔로) 물러서지 마라! 무굴 황제가 보고 있다! 오늘 이기면 수라트에 잉글랜드 상관이 선다!'],
      [null, '— 그때 포연 너머, 바람이 멎은 작은 상선 한 척에 말라바르 해적의 쾌속선들이 달라붙는 것이 보였다. 큰 배들의 싸움에 아무도 눈길을 주지 않는다. 상선 뱃전에서 한 여인이 칼을 든 채 소리친다.'],
      ['mariam', '(페르시아어로, 이어 포르투갈어로) 거기 큰 배! 아무나 좋아요, 도와주세요! 이 배에는 아버지와 사람들이 있어요!']
    ]); });
    var v = await UI.ask('바람이 멎은 아르메니아 상선이 해적에게 붙잡혔다', [{ label: '해적의 배에 뛰어든다', value: 'help' }, { label: '큰 배들의 싸움에 휘말리지 않게 물러선다', value: 'no' }], me());
    if (v !== 'help') { later('swally', 'leave'); await play([[null, '제독의 배는 포연을 피해 물러났다. 뒤에서 그 여인의 외침이 오래 들렸다.']]); log('1612년 수왈리 앞바다에서 해적에게 붙잡힌 상선을 두고 물러섰다.'); refresh(); return true; }
    await play([[null, '쾌속선 사이로 배를 들이밀어 상선 뱃전에 갈고리를 걸었다. 갑판 위는 이미 칼과 칼이 부딪는 아수라장이다.']]);
    var r = await fight('말라바르 해적', k.pirates, { guns: true, leader: '해적 두목', noSpecial: true });
    if (r !== 'win') { later('swally', 'lost'); await play([[null, '해적에게 밀려 제 배로 물러났다. 상선은 쾌속선들에 끌려 남쪽으로 사라졌다.']]); log('1612년 수왈리 앞바다에서 해적과 싸웠지만 밀려났다.'); refresh(); return true; }
    b.swally = 'won';
    await withPic('ei_swally_mariam', '수왈리의 밤', function () { return play([
      [null, '해적들이 물러가고, 수왈리의 포성도 멎었다. 잉글랜드의 두 배가 포르투갈 갤리온들을 몰아냈다는 함성이 해안에서 들려온다. 상선 갑판에서 칼을 내려놓은 여인이 길게 숨을 내쉬었다.'],
      ['mariam', '저는 마리암, 마리암 하코비안이에요. 아르메니아 사람이고, 수라트에 살아요. 아버지는 이스파한에서 수라트까지 비단과 석류석을 사고팔죠. …오늘 아버지가 살아 계신 건 제독님 덕분이에요.', 'name'],
      ['mariam', '이 바다는 이제 누구 것이 될까요? 포르투갈일까요, 잉글랜드일까요, 네덜란드일까요. 우리 아르메니아 사람들은 늘 그 사이를 오가며 살아왔어요. 어느 깃발도 아닌 배 — 제독님 배 같은 배를 타고 그 바다들을 다 보고 싶어요.'],
      [null, '노인이 다가와 딸의 손에 석류석 반지를 쥐여 주고, 그 손을 제독에게 내밀었다. 「길 위의 형제에게 맡깁니다.」']
    ]); });
    join('mariam', k.city); item('armenian_ring');
    var so = fame('so', 120), bt = fame('bt', 80);
    log('1612년 수왈리 해전의 혼란 속에서 해적에게 붙잡힌 아르메니아 상선을 구했다. 상인의 딸 마리암 하코비안이 동료가 되었다. (사교 명성 +' + so + ' · 전투 명성 +' + bt + ')');
    UI.toast('마리암 하코비안이 동료가 되었다 — 웅변 3 · 회계·세공 2', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ ④ 1619 자야카르타의 불 — 라덴 아유 칸차나
  EI.jakatra = async function () {
    var b = st(), k = K().jakatra, s = S(); b.jakatra = 'met';
    await withPic('ei_jakatra_fire', '자야카르타의 불 (1619)', function () { return play([
      [null, '반탐에서 하루 뱃길 동쪽, 칠리웅 강 어귀의 자야카르타. 강 건너 네덜란드 요새를 잉글랜드 함대와 반텐 군사가 몇 달째 에워쌌지만, 요새는 버텼다. 그리고 지금 — 암보이나에서 함대를 끌고 돌아온 쿤이 도시에 불을 놓고 있다.'],
      ['coen', '이 땅 위에 회사의 도시를 세운다. 바타비아 — 조상의 이름을 붙이겠다. 이 바다의 장사는 우리가 정한다. 저 잉글랜드 놈들도, 반텐의 술탄도 아니다.'],
      [null, '불길 사이 좁은 길로 사람들이 밀려 나온다. 그 맨 앞에서, 금 장식을 머리에 꽂은 젊은 여인이 아이들의 손을 잡고 노인들을 이끈다. 길 끝을 VOC 병사들이 창으로 막아섰다.'],
      ['kancana', '(자바 말로, 이어 포르투갈어로) 비켜 주세요! 이 사람들은 군사가 아니에요. 반텐으로 가는 길을 열어 주세요!']
    ]); });
    var v = await UI.ask('피란민의 길을 VOC 병사들이 막았다', [
      { label: '병사들을 밀어내고 길을 연다', value: 'fight' },
      { label: 'VOC 대위에게 금화 ' + num(k.bribe) + '닢을 쥐여 준다', value: 'bribe', dis: s.player.gold < k.bribe },
      { label: '떠난다', value: 'leave' }], who('kancana'));
    if (v === 'leave') { later('jakatra', 'leave'); await play([[null, '제독의 배는 연기를 등지고 반탐으로 돌아갔다.']]); log('1619년 불타는 자야카르타를 두고 떠났다.'); refresh(); return true; }
    if (v === 'bribe' && s.player.gold >= k.bribe) {
      s.player.gold -= k.bribe;
      await play([[null, 'VOC 대위가 금화 자루의 무게를 손으로 가늠하더니, 병사들에게 턱짓했다. 「밤이 되기 전에 다 지나가게 해라. 우리는 아무것도 보지 못했다.」']]);
    } else {
      var r = await fight('자야카르타의 VOC 병사들', k.soldiers, { guns: true, leader: 'VOC 대위', noSpecial: true });
      if (r !== 'win') { later('jakatra', 'lost'); await play([[null, '병사들에게 밀려났다. 여인은 사람들을 이끌고 강가의 다른 길을 찾아 연기 속으로 사라졌다.']]); log('1619년 자야카르타에서 VOC 병사들과 싸웠지만 밀려났다.'); refresh(); return true; }
    }
    b.jakatra = v === 'bribe' ? 'bribe' : 'won';
    await withPic('ei_jakatra_kancana', '반텐 가는 길', function () { return play([
      [null, '밤새 걸어 피란민의 행렬이 반텐 땅에 닿았다. 동이 틀 무렵, 여인이 그을린 징 하나를 품에서 꺼내 가볍게 쳤다. 낮고 긴 소리가 새벽 들판에 오래 남는다.'],
      ['kancana', '저는 라덴 아유 칸차나. 자야카르타 왕가의 사람이에요. 이 징은 우리 가믈란 악단에서 건진 단 하나예요. 도시는 불탔고, 저 사람들은 그 위에 새 이름을 붙이겠지요.', 'name'],
      ['kancana', '하지만 노래는 옛 이름을 기억해요. 저는 이 노래를 들고 바다로 가고 싶어요 — 자야카르타가 어떤 도시였는지, 어디서든 연주할 수 있게. 제독님 배에 악사 자리 하나 있나요?']
    ]); });
    join('kancana', k.city); item('gamelan_gong');
    var so = fame('so', 140);
    log('1619년 쿤이 자야카르타를 불태우던 날, 자야카르타 왕가의 아가씨 라덴 아유 칸차나와 피란민들을 반텐까지 데려갔다. 칸차나가 동료가 되었다. (사교 명성 +' + so + ')');
    UI.toast('라덴 아유 칸차나가 동료가 되었다 — 음악 3 · 그림·웅변 2', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ ⑤ 1621 반다의 비극 — 이드리스
  EI.banda = async function () {
    var b = st(), k = K().banda; b.banda = 'met';
    await withPic('ei_banda', '반다의 비극 (1621)', function () { return play([
      [null, '암보이나에서 남쪽으로 사흘 뱃길, 화산이 솟은 작은 반다 제도. 세상의 육두구는 모두 이 몇 개의 섬에서만 자란다. 그리고 지금 — 쿤의 함대가 섬들을 에워쌌다. 반다 사람들이 잉글랜드와도 육두구를 거래했다는 까닭이다.'],
      ['coen', '이 섬들의 오랑 카야들은 약속을 어겼다. 육두구는 회사에만 판다고 하지 않았던가. 본보기를 보여야 한다.'],
      [null, '— 해 질 녘, 반다네이라 섬의 요새 앞에서 원로들이 끌려 나갔다. 숲 쪽 해안에서 한 사내가 젖은 자루를 품에 안고 바다로 뛰어든다. VOC 병사들이 해안을 따라 쫓는다.'],
      ['idris', '(헤엄쳐 제독의 거룻배에 매달리며) 부탁이오, 이 자루만은 — 이 나무들만은 지켜야 하오!']
    ]); });
    var v = await UI.ask('묘목을 안은 사내가 거룻배에 매달렸다. 해안에서 VOC 병사들이 다가온다', [{ label: '그를 끌어올리고 병사들을 막는다', value: 'save' }, { label: '못 본 척 노를 돌린다', value: 'no' }], me());
    if (v !== 'save') { later('banda', 'leave'); await play([[null, '거룻배를 돌렸다. 손이 미끄러져 사내는 물속으로 가라앉았다가, 멀리 바위 쪽으로 헤엄쳐 갔다.']]); log('1621년 반다에서 묘목을 안고 달아나던 사내를 못 본 척했다.'); refresh(); return true; }
    var r = await fight('반다 해안의 VOC 병사들', k.soldiers, { guns: true, leader: 'VOC 하사관', noSpecial: true });
    if (r !== 'win') { later('banda', 'lost'); await play([[null, '해안의 병사들에게 밀렸다. 사내는 자루를 안은 채 숲속으로 몸을 숨겼다.']]); log('1621년 반다 해안에서 VOC 병사들에게 밀려났다.'); refresh(); return true; }
    b.banda = 'won';
    await withPic('ei_banda_idris', '육두구 묘목', function () { return play([
      [null, '배가 반다를 멀리 벗어났을 때, 사내는 젖은 자루를 풀었다. 흙을 감싼 잎 속에서 어린 육두구 묘목 여섯 그루가 나왔다. 그는 그제야 무릎을 꿇고 오래 울었다.'],
      ['idris', '나는 이드리스. 반다 오랑 카야의 아들이오. 오늘 아버지가 저 요새 앞에서… (말을 잇지 못한다) 이 나무가 이 섬들에만 자라니, 저들은 섬을 통째로 가지려 하오. 이 나무가 세상 곳곳에 자란다면 아무도 한 섬의 사람들을 죽이지 않겠지.', 'name'],
      ['idris', '나는 바다를 아오. 별과 바람으로 길을 찾고, 쪽배로 화산섬 사이를 누볐소. 그대의 배에서 이 바다를 함께 읽겠소. 그리고 언젠가 이 묘목을 심을 땅을 찾겠소.']
    ]); });
    join('idris', k.city); item('nutmeg_seedling');
    var bt = fame('bt', 120);
    log('1621년 쿤의 함대가 반다를 짓밟던 날, 육두구 묘목을 안고 달아난 반다 오랑 카야의 아들 이드리스를 구했다. 이드리스가 동료가 되었다. (전투 명성 +' + bt + ')');
    UI.toast('이드리스가 동료가 되었다 — 항해술 3 · 조선기술·측량 2 · 육두구 묘목', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ ⑥ 1623 암보이나 사건 — 에드먼드 헤일
  EI.amboyna = async function () {
    var b = st(), k = K().amboyna; b.amboyna = 'met';
    await withPic('ei_amboyna', '암보이나 (1623)', function () { return play([
      [null, '암보이나의 빅토리아 요새. VOC 총독 판스페울트가 잉글랜드 상관 사람들을 반역 혐의로 붙잡았다 — 일본인 용병 하나가 성벽을 묻고 다녔다는 것이 시작이었다. 감옥에서는 밤마다 물고문의 비명이 새어 나온다.'],
      ['speult', '저들이 요새를 빼앗으려 했다. 자백도 받았다. 사흘 뒤 처형한다. …그대는 이 일에 끼어들 까닭이 없을 텐데.'],
      [null, '— 감옥 창살 너머, 사슬에 묶인 금발의 젊은이가 피 묻은 장부를 끌어안고 있다. 물에 젖은 얼굴이 창백하지만 눈빛은 꺾이지 않았다.'],
      ['edmund', '그들이 원하는 말을 하면 물을 멈춘다고 했소. 다른 사람들은 그렇게 했지. 나는 하지 않았소. 장부에는 거짓을 적지 않는다 — 그것이 내가 아는 단 하나의 맹세요.'],
      ['edmund', '나는 에드먼드 헤일, 회사의 서기요. 스물넷. 집안 빚을 갚으러 동방에 왔다가 남의 나라 요새를 빼앗을 반역자가 되었구려. 하하… 어머니가 들으면 웃으시겠소.', 'name']
    ]); });
    var sp = skill('speech');
    var v = await UI.ask('에드먼드 헤일을 어떻게 할까?', [
      { label: '판스페울트 앞에서 그를 변호한다' + (sp.lv >= k.speech ? ' (웅변 ' + sp.lv + ' — ' + sp.who + ')' : ' — 웅변 ' + k.speech + '이 있어야 한다'), value: 'plead', dis: sp.lv < k.speech },
      { label: '처형 전날 밤 감옥을 깬다', value: 'break' },
      { label: '떠난다', value: 'leave' }], who('edmund'));
    if (v === 'leave') { later('amboyna', 'leave'); await play([['edmund', '…그렇소. 남의 나라 일이지. 가시오. 그래도 오늘 누군가 내 이름을 물어 주어 고마웠소.']]); log('1623년 암보이나에서 반역 누명을 쓴 잉글랜드 서기를 두고 떠났다.'); refresh(); return true; }
    if (v === 'plead' && sp.lv >= k.speech) {
      await play([
        ['P', '총독, 이 젊은이는 물고문에도 자백하지 않았소. 자백하지 않은 자를 자백했다고 적는 것은 회사의 장부를 더럽히는 일이오. 게다가 그는 장부를 적는 서기일 뿐 — 요새를 빼앗을 칼 한 자루 없소.'],
        ['speult', '(오래 침묵하더니) …두 사람은 살려 두라는 말이 이미 있었소. 그중 하나로 이 서기를 넣지. 다만 이 섬에서 데려가시오. 다시는 이 바다의 회사 장부에 이름이 오르지 않게.']
      ]);
      b.amboyna = 'plead';
    } else {
      await play([[null, '처형 전날 밤. 제독의 사람들이 요새 뒤쪽 바위를 타고 감옥 담에 닿았다. 쇠창살을 끊는 소리에 보초들이 횃불을 들고 달려온다.']]);
      var r = await fight('빅토리아 요새의 보초들', k.guards, { guns: true, leader: '보초장', noSpecial: true });
      if (r !== 'win') { later('amboyna', 'lost'); await play([[null, '보초들에게 막혀 물러났다. 감옥 창살 너머에서 젊은이가 고개를 저었다 — 오지 말라는 듯이.']]); log('1623년 암보이나에서 감옥을 깨려다 보초들에게 막혔다.'); refresh(); return true; }
      b.amboyna = 'break';
    }
    await withPic('ei_amboyna_edmund', '살아남은 서기', function () { return play([
      [null, '배가 암보이나를 벗어났다. 에드먼드는 갑판에 앉아 젖은 장부를 한 장 한 장 말렸다. 섬 쪽에서 북소리가 울렸다 — 남은 사람들의 처형을 알리는 소리였다. 그는 고개를 들지 않았다.'],
      ['edmund', '…열 사람이 죽었소. 그들 이름을 이 장부에 적어 두겠소. 거짓 없이. 런던 사람들이 이 일을 잊지 않도록.'],
      ['edmund', '그대의 배에 장부를 볼 사람이 필요하다면 — 나는 숫자 하나 틀리지 않소. 목숨을 빚졌으니, 이 빚은 장부에 적지 않고 평생 갚겠소.']
    ]); });
    join('edmund', k.city); item('hale_ledger');
    var so = fame('so', b.amboyna === 'plead' ? 160 : 80);
    log('1623년 암보이나 사건 — 반역 누명을 쓴 잉글랜드 동인도 회사의 서기 에드먼드 헤일을 ' + (b.amboyna === 'plead' ? '판스페울트 앞에서 변호해 살려 냈다' : '처형 전날 밤 감옥에서 빼냈다') + '. 에드먼드가 동료가 되었다. (사교 명성 +' + so + ')');
    UI.toast('에드먼드 헤일이 동료가 되었다 — 회계 3 · 역사학·웅변 2', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ 날마다 — 소식 · 정산
  EI.daily = function () {
    var b = st(), out = [], s = S(); if (!b) return out;
    var t = today(), told = b.told;
    function news(key, icon, text, ok) { if (!told[key] && t >= NEWS_AT[key] && ok !== false) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('eic', 'scroll', '【동인도 회사 특허장】 12월 31일, 엘리자베스 여왕이 「동인도 무역 런던 상인 회사」에 특허장을 내렸다. 희망봉에서 마젤란 해협까지 동쪽 바다의 장사를 열다섯 해 동안 이 회사만 한다. 첫 함대는 제임스 랭커스터가 이끈다.' + (b.eic > 0 ? ' 그대의 이름도 출자 명부에 있다.' : ''));
    var heard = s.dutchwar && s.dutchwar.told && s.dutchwar.told.voc;
    if (heard && !told.voc) told.voc = 1;   // 네덜란드 독립 전쟁 소식으로 이미 들었다
    news('voc', 'ship', '【연합 동인도 회사】 3월 20일, 네덜란드의 여섯 도시 회사가 하나로 묶여 「연합 동인도 회사(VOC)」가 섰다. 스물한 해의 특허 — 누구든 몫(주식)을 사서 배와 장사에 걸 수 있고, 그 몫을 남에게 팔 수도 있다. 세상의 첫 주식회사다.');
    news('swally', 'cannon', '【수왈리 해전】 수라트 앞 수왈리에서 잉글랜드 동인도 회사의 두 배가 포르투갈 갤리온들을 물리쳤다. 이를 지켜본 무굴 황제 자한기르가 잉글랜드에 수라트 상관을 허락한다.');
    news('batavia', 'skull', '【바타비아】 VOC의 쿤이 자야카르타를 불태우고 그 자리에 회사의 도시를 세웠다. 이름은 바타비아. 동쪽 바다 VOC의 머리가 된다.');
    news('banda', 'skull', '【반다의 비극】 쿤의 함대가 반다 제도를 정복했다. 오랑 카야들이 처형되고 섬사람 대부분이 죽거나 끌려가거나 달아났다. 육두구 숲은 회사가 들여온 노예들이 일구게 된다.');
    news('amboyna', 'skull', '【암보이나 사건】 암보이나의 VOC 총독이 잉글랜드 상관 사람들을 반역 혐의로 고문하고 열 명을 처형했다. 런던이 들끓는다. 잉글랜드 동인도 회사는 향료 제도에서 물러나 인도로 눈을 돌린다.');
    // 정산: 잉글랜드 첫 항해의 귀환 · VOC 첫 배당 (메이스로 받아 팔아)
    if (b.eic > 0 && !b.eicPaid && t >= K().eic.payAt) {
      var pay = Math.round(b.eic * K().eic.ret); b.eicPaid = pay; s.player.gold += pay;
      out.push({ icon: 'coin', history: true, text: '【동인도 회사의 정산】 랭커스터의 첫 함대가 후추를 가득 싣고 돌아왔다. 출자자들에게 원금과 이익이 돌아간다 — 그대 몫 금화 ' + num(pay) + '닢(출자 ' + num(b.eic) + '닢).' });
    }
    if (b.voc > 0 && !b.vocDiv && t >= K().voc.divAt) {
      var dv = b.vocSold ? 0 : Math.round(b.voc * K().voc.div); b.vocDiv = dv || -1;
      if (dv) { s.player.gold += dv; out.push({ icon: 'coin', history: true, text: '【VOC의 첫 배당】 연합 동인도 회사가 처음으로 배당을 냈다 — 액면의 75%를 돈이 아니라 메이스(육두구 껍질)로! 그대 몫을 상인에게 넘겨 금화 ' + num(dv) + '닢을 받았다.' }); }
    }
    return out;
  };

  // ================================================================ 도시에 들어설 때 · 수첩
  function eicOpen() { var b = st(), k = K().eic, t = today(); return !!(b && !b.eic && cityNow() === k.city && t >= k.from && t <= k.to); }
  function vocOpen() { var b = st(), k = K().voc, t = today(); return !!(b && !b.voc && cityNow() === k.city && t >= k.from && t <= k.to); }
  EI.pending = function () {
    var s = S(); if (!s || !s.loc || s.loc.mode !== 'city') return false;
    return eicOpen() || vocOpen() || vocSellOpen() || open('swally', 'mariam') || open('jakatra', 'kancana') || open('amboyna', 'edmund') || open('banda', 'idris');
  };
  EI.check = async function () {
    if (EI._busy) return false; EI._busy = true;
    try {
      if (eicOpen()) await EI.eic();
      else if (vocOpen()) await EI.voc();
      else if (open('swally', 'mariam')) await EI.swally();
      else if (open('jakatra', 'kancana')) await EI.jakatra();
      else if (open('amboyna', 'edmund')) await EI.amboyna();
      else if (open('banda', 'idris')) await EI.banda();
      else if (vocSellOpen()) await EI.vocSell();
    } catch (e) { console.error(e); }
    EI._busy = false;
    return true;
  };
  EI.html = function () {
    var s = S(), b = s && s.eindia; if (!b) return '';
    var li = [];
    if (b.eic > 0 && !b.eicPaid) li.push('잉글랜드 동인도 회사 출자 금화 ' + num(b.eic) + '닢 — 랭커스터의 첫 함대가 돌아오면 정산');
    if (b.voc > 0 && !b.vocSold) li.push('VOC 주식 액면 금화 ' + num(b.voc) + '닢 — 오늘 값 약 ' + num(b.voc * EI.vocPrice()) + '닢 (암스테르담에서 팔 수 있다)');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">동인도 회사의 몫</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._eindiaHtml) { G.Court._eindiaHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + EI.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._eindia) return;
    W._eindia = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(EI.daily()); } catch (e) { console.error(e); } return out; };
  })();
})(window.G = window.G || {});
