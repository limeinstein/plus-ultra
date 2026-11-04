/* 두 왕자 — 「왕자와 거지」의 광해군, 「지킬과 하이드」의 임해군, 그리고 설화 (G.Brothers) 2026-11-02 사용자 요청
   「광해군을 왕자와 거지에, 임해군을 지킬과 하이드로 두 형제의 비극을 이벤트로 만들어줘. 둘이 공동으로 마음이 가는 여자가 있어」
   사람·동료·조정값: js/data/brothers.js (G.BALANCE.brothers). 큰 역사는 그대로다 — 광해가 세자가 되고, 임금이 되고, 형은 교동도에서 죽고(또는 사라지고), 광해는 반정으로 쫓겨난다.
   ■ ① 왕자와 거지 (1590.1.1~1592.5.22, 한양): 돈화문 앞에서 둘째 왕자와 똑같이 생긴 거지 소년 막동. 장난삼아 옷을 바꿔 입은 왕자가 궁 밖으로 쫓겨난다.
        「나는 왕자다!」 — 믿는다 / 웃어넘긴다(이야기 끝) → 장터와 혜민서 — 의녀 설화를 만난다 → 밤, 골목의 복면 사내(일기토 — 지면 설화가 침으로 찌른다)
        → 이튿날 궁으로: 맏왕자 임해군에게 부탁한다(오른팔에 감은 무명 — 어젯밤 그 자리) / 담을 넘는다(육상전)
        → 「어머니 무덤가에 함께 심은 나무」를 아는 쪽이 진짜 → 옥패를 받는다 · 막동을 태운다 / 궁에 남긴다
   ■ ② 두 얼굴 (①에서 20일 뒤~1592.5.22, 한양): 설화가 주운 서역 승려의 약병. 밤에 임해군을 따라가면 — 약을 마신 그가 복면의 사내가 된다.
        「맏이는 나다! 아버지는 왜 저 아이만…」 → 병을 깨뜨린다 / 비밀을 지킨다 / 동생에게 알린다
        두 왕자가 모두 설화를 마음에 둔다. 설화가 묻는다 — 「제 마음은 어디로」: 거지 옷의 도령(광해) / 낮의 임해군 / 둘 다 궁의 사람이다
   ■ ③ 세자를 세우는 날 (1592.3.1~6.8, 한양 — ② 뒤): 대신들이 「세자를 세우소서」. 임해군이 「밤마다 짐승이 되는 맏이가 왕이 되면 나라 전체가 밤이 된다」며
        왕자의 이름을 버리고 떠나겠다 한다. 설화가 그의 곁에 선다. 광해는 「남는 것이 내 몫이오」 — 남아서 세자가 되고, 임금이 된다.
        → 둘을 배에 태운다(임해·설화 동료 — 둘은 짝) / 「맏이는 떠날 수 없소」(역사대로 — ④ 교동도로)
        소식: 세자 책봉(1592.6.8) · 회령(1592.8.30) — 떠났으면 「임해군이라 자칭하던 자」
   ■ ④' 임금의 밤 (1608.3.18~1609.5.31, 한양 — 임해가 떠났으면): 「대신들이 사라진 맏이를 찾아 벌하라 하오. 형님의 이름을 이 땅에서 지우겠소」 — 형에게 보내는 편지 · 형의 답
   ■ ④ 교동도 (1608.3.18~1609.5.31, 한양): 임금이 된 광해의 밤 — 「형님을 죽이라 하오. 막으면 내가 무너지오」 · 형에게 보내는 편지
        교동도의 별장은 밀지를 품었다 → (가) 밤에 빼낸다 — 병을 깨뜨렸어야 형이 따른다 (싸운다 / 별장을 매수) → 이름을 버리고 바다 건너로
        (나) 편지를 전하고 곁을 지킨다 → 형은 「사람으로」 죽는다 · 편지 뒷장의 답 → 한양의 광해에게 돌려준다
        짐승을 깨운 채 빼내려 하거나 실패하면 역사 그대로. 설화는 마음이 임해군에게 있었고 그가 살아 떠나면 함께 배에 오른다 — 아니면 따로 제독의 배에 오를 수 있다
   ■ ⑤ 왕자와 거지, 마지막 장 (1623.3.20~4.11, 한양 — 반정의 밤): 늙은 막동이 다시 옷을 바꿔 입자 한다 → 막동이 대신 붙잡혀 가고 광해는 「이름 없는 선비」로 배에 오른다(동료) / 역사 그대로
   ■ 소식: 세자 책봉 · 회령 · 선조의 죽음과 광해 즉위(1608.3.18) · 교동도(1609.6.1) · 반정(1623.4.12) · 제주(1641.8.7) — 제독이 한 일에 맞게
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/br_*.webp
   ■ 저장: s.brothers = { swap, swapDay, night, back, makdong, faces, potion, heart, leave, kyodong, imhae: 'sea'|'fled'|'peace'|'killed', seolhwa: 'imhae'|'ship'|'stay', letterBack, last, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var BR = G.Brothers = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.brothers) || {}; }
  var HANYANG = 190;
  var D = BR.D = { swapFrom: 15900101, swapTo: 15920522, leaveFrom: 15920301, leaveTo: 15920608, kyoFrom: 16080318, kyoTo: 16090531, lastFrom: 16230320, lastTo: 16230411 };
  var NEWS_AT = { crown: 15920608, hoeryeong: 15920830, accession: 16080318, kyodongNews: 16090601, coup: 16230412, jeju: 16410807 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.brothers) {
      s.brothers = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.brothers.told[k] = 1; });
    }
    if (!s.brothers.told) s.brothers.told = {};
    return s.brothers;
  }
  BR.state = st;
  // 임해와 설화가 함께 떠났으면 둘은 짝이다 — 부하끼리의 썸·제독의 청혼 대상이 아니다 (js/systems/romance.js · js/city/matetalk.js 의 d.wed)
  (function setup() {
    [['br_seolhwa', 'br_imhae'], ['br_imhae', 'br_seolhwa']].forEach(function (x) {
      var m = G.MATE && G.MATE[x[0]]; if (!m) return;
      try { Object.defineProperty(m, 'wed', { configurable: true, enumerable: true, get: function () { var s = S(), b = s && s.brothers; return b && b.seolhwa === 'imhae' ? x[1] : undefined; } }); } catch (e) { /* 옛 브라우저 */ }
    });
  })();
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function atSeoul() { return cityNow() === HANYANG; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return BR.speaker(id, null, true, emo); }
  function H(id, variant) { return BR.speaker(id, variant); }
  // 분기는 그대로 두고, 옷을 바꿔 입은 대사에서만 전용 그림을 앞세운다.
  BR.speaker = function (id, variant, crew, emo) {
    var sp = crew && G.Legend && G.MATE[id] ? G.Legend.speaker(id, emo) : G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 };
    // 설화의 사건 대사는 장면 그림이 떠 있어도 새 무릎상으로 등장한다.
    if (id === 'br_seolhwa') sp.standInScene = true;
    var key = variant === 'beggar' && id === 'br_gwanghae' ? 'portraits/history/br_gwanghae_beggar'
      : variant === 'prince' && id === 'br_makdong' ? 'portraits/history/br_makdong_prince' : null;
    if (key && G.Art && G.Img && G.Img.has(key)) {
      var spec = sp.portrait || G.Art.npcSpec('brothers_' + id, 'noble', 'kr', 'm');
      sp.portrait = G.Art.withImg(Object.assign({}, spec), [key]);
      sp.half = [key + '_half'];
      sp.rigId = 'brothers:' + id + ':' + variant;
    }
    return sp;
  };
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var WHO = { P: me, F: first, SH: function (e) { return mateSp('br_seolhwa', e); }, MD: function (e) { return mateSp('br_makdong', e); }, IMM: function (e) { return mateSp('br_imhae', e); }, GH: 'br_gwanghae', IM: 'br_imhae', HY: 'br_hyde' };
  var CROWD = { name: '장터 사람', lang: 3 }, MONK = { name: '서역의 떠돌이 승려', lang: 3 }, EUNUCH = { name: '늙은 내관', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who;
      if (w && typeof w === 'object') who = w;
      else if (w === 'MD' && l[3]) who = BR.speaker('br_makdong', l[3], true, l[2]);
      else if (w && typeof WHO[w] === 'function') who = WHO[w](l[2]);
      else if (w && WHO[w]) who = H(WHO[w], l[3]);
      else who = w ? H(w) : {};
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
  function join(id, loyal) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var m = G.Legend.join(id, G.CITY_DATA[HANYANG]); if (m && loyal) m.loyal = loyal; return m; }
  function leaveMate(id) { var s = S(), i = -1; s.mates.forEach(function (x, k) { if (x.id === id) i = k; }); if (i < 0) return false; s.mates.splice(i, 1); return true; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passDays(n) {
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  function daysTo(day) { return U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date); }

  // ================================================================ 소식
  BR.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = b.swap === 'help', east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    var gone = b.leave === 'yes';
    news('crown', met, 'crown', gone
      ? '【세자 책봉】 피란길의 임금이 둘째 왕자 광해군을 세자로 세웠다. 맏이 임해군은 그해 봄 궁에서 모습을 감추었다. 「스스로 물러났다」는 말과 「쫓겨났다」는 말이 함께 돈다. 혜민서의 의녀 하나도 같은 날 사라졌다고 한다.'
      : '【세자 책봉】 피란길의 임금이 둘째 왕자 광해군을 세자로 세웠다. 맏이 임해군을 두고서였다. 「성품이 거칠다」는 말이 조정에 돌았다고 한다.' + (b.heart === 'g' ? ' 혜민서의 한 의녀가 그 소식을 듣고 오래 울었다고 한다.' : ''));
    news('hoeryeong', met, 'skull', gone
      ? '【회령】 함경도에서 「맏왕자 임해군」이라 자칭하며 군사를 모으던 자가 회령에서 백성들에게 붙잡혀 왜장 가토에게 넘겨졌다. 조정은 그를 임해군이라 했지만, 궁의 사람들은 고개를 갸웃했다.'
      : b.potion === 'break'
      ? '【회령】 함경도로 군사를 모으러 간 임해군이 회령에서 반란을 일으킨 아전 국경인에게 붙잡혀 왜장 가토에게 넘겨졌다. …그런데 이번에는 아무도 그가 밤마다 사람을 때렸다고 말하지 않았다.'
      : '【회령】 함경도로 군사를 모으러 간 임해군이 회령에서 백성들에게 붙잡혀 왜장 가토에게 넘겨졌다. 밤마다 사람을 때리고 재물을 빼앗았다는 원성이 높았다고 한다.');
    news('accession', met, 'crown', '【새 임금】 임금 선조가 세상을 떠나고 세자 광해군이 왕위에 올랐다. ' + (gone ? '대신들은 곧 「사라진 맏이 임해군을 찾아내 벌하라」며 들고일어났다.' : '대신들은 곧 「맏이 임해군이 군사를 모은다」며 그를 벌하라 들고일어났다.'));
    news('kyodongNews', east, 'skull', b.imhae === 'sea'
      ? '【교동도】 조정은 맏왕자 임해군이 교동도에서 죽었다고 알렸다. 그러나 교동도 섬사람들은 그런 사람을 본 적이 없다고 수군거린다. 그날 밤 임금은 바다 쪽을 향해 술잔을 부었다고 한다.'
      : b.imhae === 'fled'
      ? '【교동도】 교동도에 귀양 간 임해군이 죽었다고 조정이 알렸다. 그러나 섬사람들 사이에서는 그날 밤 배 한 척이 바다로 나갔다는 말이 돈다. 주검을 본 사람은 없다.'
      : b.imhae === 'peace'
        ? '【교동도】 교동도에 귀양 간 임해군이 죽었다. 그를 지키던 사람들은 그가 마지막 밤 내내 글을 쓰고, 아침에 단정히 앉아 있었다고 했다. 「짐승은 끝내 나오지 않았다」는 이상한 말도 남았다.'
        : '【교동도】 교동도에 귀양 간 임해군이 죽었다. 수비 장수가 조정의 뜻을 받들어 그를 해쳤다는 소문이다. 그날 밤 섬에서 짐승 같은 울음이 들렸다고 한다.');
    news('coup', east, 'castle', b.last === 'swap'
      ? '【반정】 서인 무리가 궁에 불을 지르고 능양군을 새 임금으로 세웠다. 붙잡혀 강화도로 끌려가는 폐주는 이상하게도 웃고 있었다고 한다 — 「오늘 하루 왕 노릇을 잘했구나」 하고.'
      : '【반정】 서인 무리가 궁에 불을 지르고 능양군을 새 임금으로 세웠다. 임금 광해는 의관의 집에 숨었다가 붙잡혀 강화도로 끌려갔다.');
    news('jeju', met, 'skull', b.last === 'swap'
      ? '【제주】 강화와 제주를 거친 폐주 광해가 제주에서 세상을 떠났다. 열여덟 해의 귀양을 그는 한 번도 원망하지 않았다고 한다. 마지막에 그가 남긴 말은 이랬다 — 「나는 궁궐 담장 밑의 거지였소. 그분은 바다에 계시오.」'
      : '【제주】 강화와 제주를 거친 폐주 광해가 제주에서 세상을 떠났다. 예순일곱이었다. 시중드는 사람들이 「영감」이라 불러도 그는 아무 말 하지 않았다고 한다.');
    return out;
  };

  // ================================================================ ① 왕자와 거지 (1590~1592.5)
  function swapOpen() { var b = st(), t = today(); return !!(b && !b.swap && atSeoul() && t >= D.swapFrom && t <= D.swapTo); }
  async function swap() {
    var b = st(), s = S(), k = K();
    await withPic('br_gate', '돈화문 앞 (' + s.date.y + ')', function () { return play([
      [null, '창덕궁 돈화문 앞. 궁궐 담장 밑에 누더기를 걸친 소년 하나가 쪼그려 앉아 동냥 그릇을 내밀다가, 수문장의 창 자루에 걷어차여 나뒹군다.'],
      ['br_guard', '이놈! 몇 번을 말해야 알아듣느냐, 궁궐 담 밑에서 비렁뱅이 짓은 안 된다고!'],
      ['GH', '(문 안에서 흰 도포의 소년이 달려 나오며) 그만두어라! 배고픈 아이를 때리는 게 궁궐의 법이냐! …얘, 괜찮으냐? 이름이 뭐냐?'],
      ['MD', '(코피를 닦으며 고개를 들다가 그대로 굳는다) 마, 막동인뎁쇼… 그런데 도련님… 도련님 얼굴이 제 얼굴이랑…'],
      [null, '두 소년이 서로를 들여다본다. 키도, 눈매도, 턱의 점 하나까지 — 쌍둥이처럼 똑같다.'],
      ['GH', '(눈을 반짝이며) 재미있구나! 얘, 잠깐 들어와 봐라. 우리 옷을 바꿔 입어 보자. 너는 하루쯤 왕자 노릇을 하고, 나는 궁 밖이 어떤지 좀 보고 싶다.']
    ]); });
    await play([
      [null, '반 시진 뒤. 돈화문이 열리고 누더기를 입은 소년이 수문장에게 멱살을 잡혀 길바닥에 내던져진다.'],
      ['GH', '(흙투성이로 일어나며) 이 무엄한 놈! 나는 왕자다, 선조 대왕의 둘째 아들 광해란 말이다! 저 안의 아이는 막동이고!', null, 'beggar'],
      ['br_guard', '허허, 비렁뱅이가 이제는 실성까지 했구나. 썩 꺼져라!'],
      ['GH', '(사람들의 웃음 속에서 이를 악물다가 제독을 본다) …거기 이방인! 당신 눈에도 내가 거지로 보이오?', null, 'beggar']
    ]);
    var v = await UI.ask('누더기의 소년이 「나는 왕자다」라고 한다', [
      { label: '「믿겠소. 손이 너무 곱구려」 — 소년을 데려간다', value: 'help', icon: 'people' },
      { label: '웃어넘긴다', value: 'no' }], me());
    if (v !== 'help') { b.swap = 'no'; await play([[null, '소년은 사람들 사이로 사라졌다. 그날 밤 궁궐에 큰 소동이 있었다는 소문만 남았다.']]); log('한양 돈화문 앞에서 「나는 왕자다」라고 외치는 거지 소년을 보았다.'); return; }
    b.swap = 'help'; b.swapDay = s.day;
    await withPic('br_market', '운종가와 혜민서', function () { return play([
      [null, '운종가 장터. 소년은 처음 보는 것처럼 모든 것을 본다. 쌀 한 되 값에 우는 아낙, 짚신 한 켤레를 사흘 굶어 산 짐꾼, 돌림병에 걸려 길가에 버려진 아이.'],
      ['GH', '(작게) 궁에서는… 이런 걸 아무도 말해 주지 않았소. 아바마마께 올리는 글에는 늘 「백성이 편안하다」고만 적혀 있었소.', null, 'beggar'],
      [null, '혜민서 앞. 흰 앞치마를 두른 젊은 의녀가 길가의 아이를 안아 들고 침을 놓는다. 눈 내린 날처럼 고요한 얼굴이다.'],
      ['SH', '(소년을 올려다보며) 거기 도령, 물 좀 길어다 줄래요? …어머, 손이 왜 이렇게 고와요? 물동이 한 번 안 들어 본 손이네.'],
      ['GH', '(얼굴이 빨개지며) 나, 나는… 물동이쯤이야!', null, 'beggar'],
      [null, '소년은 물동이를 두 번 엎지르고 세 번째에야 혜민서 마당까지 날랐다. 의녀가 웃었다. 소년은 그 웃음을 오래 보았다.'],
      ['SH', '설화예요. 혜민서에서 허준 나리께 침을 배우고 있어요. …도령은 이름이 뭐예요?'],
      ['GH', '(잠시 머뭇거리다) …막동이오.', null, 'beggar']
    ]); });
    // 밤 — 골목의 복면 사내
    await withPic('br_night', '한양의 밤 골목', function () { return play([
      [null, '그날 밤. 혜민서로 돌아가던 설화의 등 뒤로, 골목 어둠에서 검은 복면의 사내가 튀어나온다. 비단 도포 자락이 찢겨 있고, 숨소리가 짐승 같다.'],
      ['HY', '(쉰 목소리로 웃으며) 혜민서의 눈꽃이로구나… 낮에는 그렇게 웃더니. 나한테도 웃어 봐라!']
    ]); });
    var en = { name: '복면의 사내', look: 'brawler', str: 82, atk: 12, def: 4, skill: 2, mar: 76, int: 50, cha: 30, style: 'bash' };
    var res = G.Games && G.Games.duel ? await G.Games.duel(en, { place: 'land' }) : 'win';
    b.night = res === 'win' ? 'win' : 'lose';
    await play(res === 'win'
      ? [[null, '제독의 칼끝이 사내의 오른팔을 스쳤다. 사내는 짐승처럼 울부짖으며 담을 넘어 사라졌다. 골목에 핏방울이 떨어져 있다.']]
      : [[null, '사내의 주먹에 제독이 담벼락에 부딪힌다 — 그 순간 설화가 머리의 은비녀 대신 꽂아 두었던 긴 침을 뽑아 사내의 오른팔에 깊이 찔렀다. 사내는 울부짖으며 담을 넘어 사라졌다.']]);
    await play([['SH', '(떨리는 손으로 침을 닦으며) …저 사람 도포, 보셨어요? 운문 비단이었어요. 장사치는 저런 옷을 못 입어요.']]);
    // 이튿날 — 궁으로
    await passDays(1);
    await play([
      [null, '이튿날 아침. 궁 안에서는 「둘째 왕자가 실성해 자기가 거지라 한다」는 소문이 담장 밖까지 넘어왔다.'],
      ['GH', '막동이가 울고 있을 거요. 궁 안에서는 왕자가 울면 어의를 부르니까. …어떻게든 들어가야 하오.', null, 'beggar']
    ]);
    var w = await UI.ask('궁에 들어갈 길', [
      { label: '맏왕자 임해군에게 부탁한다 — 「형님이라면 나를 알아보실 거요」', value: 'imhae', icon: 'scroll' },
      { label: '밤에 후원 담을 넘는다 — 궁궐 군사와 싸울 수도', value: 'wall', icon: 'sword' }], me());
    b.back = w;
    if (w === 'imhae') {
      await play([
        [null, '경복궁 동쪽, 맏왕자의 거처. 책이 가득한 방에서 창백한 청년이 붓을 내려놓는다. 오른팔에 흰 무명을 감았다.'],
        ['IM', '(누더기의 동생을 보고 한참 말이 없다가 웃는다) …광해구나. 이 녀석, 또 무슨 장난이냐. 어린 날 담 넘어 저잣거리 엿을 사 먹던 그 버릇이 아직이구나.'],
        ['P', '(무명 감은 팔을 보며) 팔은 어찌 다치셨소?'],
        ['IM', '(소매를 내리며) …책장을 넘기다 칼에 베였소. 대수롭지 않소.']
      ]);
    } else {
      var r = await fight('후원의 궁궐 군사', k.guardFoe || 12, { leader: '수문장' });
      await play([[null, r === 'win' ? '군사들을 제압하고 후원의 연못가에 닿았다.' : '군사들에게 밀리는 사이, 소년이 군사들 앞으로 나섰다.'], ['br_guard', '이 비렁뱅이, 또 너냐! …(소년의 눈을 보고 멈칫하며) 가, 가만…']]);
    }
    await withPic('br_twins', '두 소년', function () { return play([
      [null, '대전의 뜰. 비단 옷의 소년과 누더기의 소년이 나란히 섰다. 임금이 두 얼굴을 번갈아 본다.'],
      ['br_seonjo', '…둘 중 누가 내 아들이냐. 어미 공빈의 무덤가에 너와 내가 함께 심은 나무가 무엇이었느냐?'],
      ['MD', '(비단 옷 속에서 벌벌 떨며) 소, 소나무… 아니 감나무… 전하, 쇤네는 정말 거지입니다요! 쇤네를 좀 내보내 주십시오!', null, 'prince'],
      ['GH', '(누더기 차림으로 무릎을 꿇으며) 회화나무입니다, 아바마마. 어머니께서 「학자의 나무」라 하셨다고. …그리고 이 아이를 벌하지 마소서. 옷을 바꾸자 한 것은 저입니다.', null, 'beggar'],
      ['br_seonjo', '(오래 아들을 보다가) …궁 밖은 어떻더냐.'],
      ['GH', '배고팠습니다, 아바마마. 저는 하루였지만 저 아이는 열여섯 해였습니다.', null, 'beggar']
    ]); });
    give('br_jade');
    await play([['GH', '(옥패를 풀어 제독의 손에 쥐여 주며) 그대가 가지시오. 내가 거지였던 하루를 잊지 않게. …그리고 혜민서의 그 의녀에게는 말하지 마시오. 그 사람에게 나는 아직 물동이를 엎지르는 「막동」이오.']]);
    var m = await UI.ask('막동이 제독을 바라본다 — 「바다에 데려가 주시면 안 돼요?」', [
      { label: '배에 태운다', value: 'ship', icon: 'ship' },
      { label: '「왕자님 곁에 있거라」 — 궁에 남긴다', value: 'palace' }], me());
    b.makdong = m;
    if (m === 'ship') { join('br_makdong', 80); await play([['MD', '야호! 왕자 노릇보다 뱃사람 노릇이 백 배 낫겠어요. 거기는 아무도 저를 「저하」라고 안 부르겠죠?']]); }
    else await play([['GH', '막동이는 내 곁에 두겠소. 내 얼굴을 한 사람이 다시는 담장 밑에서 걷어차이지 않게.']]);
    var sf = fame('so', 'swap');
    log('한양 — 둘째 왕자 광해군이 거지 소년 막동과 옷을 바꿔 입었다가 궁 밖으로 쫓겨났다. 그를 믿고 장터와 혜민서를 함께 다닌 뒤 궁으로 돌려보냈다. 「광해의 옥패」를 받았다. (사교 명성 +' + sf + ')');
    refresh();
  }

  // ================================================================ ② 두 얼굴 (①에서 20일 뒤 ~ 1592.5.22)
  function facesOpen() { var b = st(), s = S(), t = today(); return !!(b && b.swap === 'help' && !b.faces && atSeoul() && t <= D.swapTo && s.day - (b.swapDay || 0) >= (K().gap || 20)); }
  async function faces() {
    var b = st();
    await play([
      ['SH', '(혜민서 뒤뜰에서 제독을 붙잡으며) 선장님, 이것 좀 보세요. 새벽마다 맏왕자 임해군 나리가 몰래 오셔서 오른팔을 싸매고 가세요. 침 자국이 난 그 자리를요. 그리고 어제… 나리가 이걸 떨어뜨리고 가셨어요.'],
      [null, '설화가 내민 것은 검붉은 약이 든 작은 청자 병이다. 뚜껑을 열자 쇠 냄새와 단 냄새가 섞여 올라온다.'],
      ['br_oldmed', '(병 냄새를 맡고 얼굴이 굳는다) …서역에서 흘러온 승려가 판다는 약이오. 「마음속 짐승을 재운다」고들 하지. 허준 나리 말씀으로는, 재우는 게 아니라 깨운다 하셨소.']
    ]);
    await withPic('br_change', '맏왕자의 밤', function () { return play([
      [null, '그날 밤. 맏왕자 거처의 등잔 아래, 임해군이 병을 들고 오래 앉아 있다. 손이 떨린다.'],
      ['IM', '(혼잣말로) 맏이는 나다… 아바마마는 왜 늘 저 아이만 보시는가. 나는 글을 읽어도, 활을 쏘아도… (병을 들이켠다) …이 분노만 없으면, 나도 좋은 형일 수 있을 텐데.'],
      [null, '잠시 뒤 — 등잔불이 흔들린다. 청년의 어깨가 짐승처럼 둥글게 말리고, 눈에 핏발이 선다. 그가 검은 복면을 집어 든다.'],
      ['HY', '(쉰 목소리로 낄낄거리며) 착한 맏이는 잠들었다. 이제 내 차례다. …혜민서의 눈꽃은 오늘도 웃고 있으려나.'],
      [null, '담을 넘으려는 사내 앞을 제독이 막아섰다. 사내가 으르렁거리다가 — 갑자기 무릎을 꿇고 머리를 감싼다. 짐승의 얼굴이 녹아내리듯 사라지고 창백한 청년이 남았다.'],
      ['IM', '(숨을 몰아쉬며) …보았구려. 다 보았구려. 부탁이오, 아무에게도… 특히 설화에게는. 그 사람 앞에서만은, 나는 사람이고 싶소.']
    ]); });
    var v = await UI.ask('임해군의 약병', [
      { label: '병을 깨뜨린다 — 「짐승은 약이 키운 것이오」', value: 'break', icon: 'skull' },
      { label: '비밀을 지킨다 — 병을 돌려준다', value: 'keep' },
      { label: '동생 광해에게 알린다', value: 'told', icon: 'scroll' }], me());
    b.potion = v;
    await play(v === 'break'
      ? [[null, '청자 병이 돌바닥에 부서졌다. 검붉은 약이 등잔 그림자처럼 번진다.'], ['IM', '(오래 그것을 내려다보다가) …이것이 없으면 그 짐승이 나를 다 먹을 줄 알았소. 그런데 이상하구려. 조금… 가벼워졌소. 고맙소.']]
      : v === 'keep' ? [['IM', '(병을 받아 품에 넣으며) …고맙소. 그대가 본 것은 한 사람의 밤일 뿐이오. 낮의 나를 기억해 주시오.']]
        : [[null, '광해군의 거처. 동생은 말없이 이야기를 다 듣고, 오래 창밖을 보았다.'], ['GH', '형님은… 어려서 나를 업고 담을 넘어 엿을 사 주셨소. 그 등이 얼마나 넓었는지. (주먹을 쥐며) 내가 형님을 지키겠소. 아바마마가 모르시게.']]);
    // 두 왕자가 한 여인을
    await play([
      [null, '그 뒤로 설화의 혜민서에는 두 사람이 드나들었다. 낮이면 물동이를 엎지르는 「막동」 도령이 책 보따리를 들고 오고, 해 질 녘이면 맏왕자가 무명을 갈러 와 시 한 수를 읊고 갔다.'],
      ['SH', '(제독에게 조용히) 선장님. 「막동」 도령이 사실은 누군지 저도 알아요. 그 손으로 거지일 리 없죠. …그리고 임해군 나리가 밤에 누가 되는지도요. 침 자국은 거짓말을 안 하거든요.'],
      ['SH', '두 분 다 제게 마음을 주세요. 한 분은 웃게 해 주고, 한 분은 아프게 해요. 그런데 아픈 쪽이 더 마음에 걸려요. …선장님, 제 마음은 어디로 가야 할까요?']
    ]);
    var h = await UI.ask('설화가 묻는다 — 「제 마음은 어디로 가야 할까요」', [
      { label: '「물동이를 엎지르던 도령(광해)에게」', value: 'g', icon: 'heart' },
      { label: '「낮의 임해군에게 — 그 사람을 사람으로 붙잡아 줄 수 있는 건 그대뿐이오」', value: 'i', icon: 'heart' },
      { label: '「둘 다 궁의 사람이오. 궁은 사람을 삼키오」', value: 'none' }], me());
    b.heart = h; b.faces = 1;
    await play(h === 'g' ? [['SH', '(웃는데 눈이 젖는다) …그분은 언젠가 왕이 되실 거예요. 왕의 곁에는 의녀 자리가 없어요. 그래도 — 고마워요.']]
      : h === 'i' ? [['SH', '(오래 말이 없다가) 그 사람이 밤마다 저를 찾아오는 건 해치려고가 아니라, 낮의 자신을 찾으러 오는 건지도 몰라요. …제가 붙잡아 볼게요.']]
        : [['SH', '그렇죠. 저는 혜민서의 의녀예요. 궁궐 담장 밖의 사람들을 돌보는 사람이요. …그런데 마음이 말을 들을까요.']]);
    var nf = fame('so', 'night');
    log('한양 — 맏왕자 임해군이 서역 승려의 약을 마시고 밤의 「복면 사내」가 되는 것을 보았다. ' + (v === 'break' ? '약병을 깨뜨렸다.' : v === 'keep' ? '비밀을 지켰다.' : '동생 광해군에게 알렸다.') + ' 두 왕자가 모두 혜민서의 의녀 설화를 마음에 두었다. (사교 명성 +' + nf + ')');
    refresh();
  }


  // ================================================================ ③ 세자를 세우는 날 (1592.3.1~6.8) — 맏이는 떠나고 둘째는 남는다
  function leaveOpen() { var b = st(), t = today(); return !!(b && b.swap === 'help' && b.faces && !b.leave && atSeoul() && t >= D.leaveFrom && t <= D.leaveTo); }
  async function leave() {
    var b = st(), war = today() >= 15920523;
    await withPic('br_leave', '세자를 세우는 날 (1592)', function () { return play([
      [null, war ? '왜군이 부산에 올랐다는 장계가 날마다 올라온다. 대신들이 대전 앞에 엎드려 청한다 — 「나라가 위태롭습니다. 세자를 세우소서.」' : '대마도에 왜선이 모인다는 소문 속에, 대신들이 대전 앞에 엎드려 청한다 — 「세자를 세우소서.」'],
      [null, '대전 밖 회랑. 맏왕자와 둘째 왕자가 마주 섰다. 둘 다 무엇이 정해질지 안다.'],
      ['IM', '광해야. 아바마마는 너를 고르실 것이다. 대신들도. 그게 옳다. …나는 밤마다 짐승이 되는 맏이다. 그런 자가 왕이 되면 이 나라 전체가 밤이 된다.'],
      ['GH', '형님, 무슨 말씀이십니까. 형님이 맏이십니다 —'],
      ['IM', '(웃으며) 맏이는 먼저 태어난 사람이지, 먼저 왕이 될 사람이 아니다. 나는 떠나겠다. 이름도, 왕자의 옷도 두고.'],
      ['SH', '(회랑 끝에서 걸어 나와 임해군 곁에 선다) …저도 가요.'],
      [null, '둘째 왕자의 얼굴에서 핏기가 가신다.'],
      ['SH', b.heart === 'g' ? '도령. 도령께는 나라가 있어요. 저 사람에게는 아무도 없어요. 제가 저 사람의 낮을 붙잡지 않으면, 저 사람은 밤에 먹혀요. …미안해요, 물동이 도령.'
        : b.heart === 'i' ? '선장님이 그러셨죠. 저 사람을 사람으로 붙잡아 줄 수 있는 건 저뿐이라고. …물동이 도령, 미안해요.'
          : '궁은 사람을 삼켜요. 한 사람이라도 빠져나가야 해요. 저는 저 사람과 나갈게요. …물동이 도령, 미안해요.'],
      ['GH', '(오래 말이 없다가, 쥐었던 주먹을 천천히 편다) …가시오, 형님. 설화도. 나는 남겠소. 남는 것이 내 몫이오. 거지였던 하루를 기억하는 왕이 하나쯤은 있어야지.'],
      ['IM', '(제독을 돌아보며) 선장. 그대의 배에 사람 둘 자리가 있소? 이름 없는 사내 하나와 의녀 하나.']
    ]); });
    var v = await UI.ask('임해군과 설화를 배에 태우겠는가?', [
      { label: '태운다 — 「바다에는 왕자도 맏이도 없소」', value: 'yes', icon: 'ship' },
      { label: '「그대는 이 나라의 맏이요. 떠날 수 없소」', value: 'no' }], me());
    b.leave = v;
    if (v === 'yes') {
      await play([
        b.potion !== 'break' ? ['IM', '(품에서 마지막 약병을 꺼내 회랑 돌바닥에 내던진다) 이제 이건 필요 없소. 짐승을 재우는 건 약이 아니었소.'] : null,
        [null, '그날 밤, 마포 나루. 갓도 쓰지 않은 사내와 약 보따리를 멘 의녀가 제독의 배에 오른다. 한양의 불빛이 멀어진다.'],
        ['SH', '(사내의 오른팔 흉터를 쓰다듬으며) 침 자국이 다 아물었네요.'],
        ['IM', '아물지 않아도 되오. 그대가 기억하면 되니까.'],
        [null, '돈화문 누각 위에서, 열일곱 살의 둘째 왕자가 배가 보이지 않을 때까지 서 있었다. 며칠 뒤 그는 세자가 되었다.']
      ]);
      b.seolhwa = 'imhae'; join('br_imhae', 88); join('br_seolhwa', 88);
      var lf = fame('so', 'leave');
      log('1592년 세자를 세우는 날 — 맏왕자 임해군이 왕자의 이름을 버리고 의녀 설화와 함께 제독의 배에 올랐다. 둘째 왕자 광해군은 남아서 세자가 되었다. (사교 명성 +' + lf + ')');
      UI.toast('임해 · 설화 — 이름을 버리고 배에 올랐다 · 광해는 남는다', 'heart', 6500);
    } else {
      await play([['IM', '(쓸쓸히 웃으며) …그렇겠지. 맏이는 도망칠 수도 없구려.'], ['SH', '…그럼 저도 혜민서로 돌아갈게요. 두 분 다 궁의 사람이니까요.']]);
      log('1592년 세자를 세우는 날 — 떠나겠다는 맏왕자 임해군을 붙잡았다. 그는 궁에 남았다.');
    }
    refresh();
  }

  // ================================================================ ④' 임금의 밤 (1608.3.18~1609.5.31) — 임해가 떠났으면
  function kingOpen() { var b = st(), t = today(); return !!(b && b.leave === 'yes' && !b.kyodong && atSeoul() && t >= D.kyoFrom && t <= D.kyoTo); }
  async function kingNight() {
    var b = st(), aboard = !!row('br_imhae');
    await withPic('br_throne', '임금의 밤 (1608)', function () { return play([
      [null, '창덕궁 희정당. 붉은 곤룡포의 임금이 등잔 하나만 켜 두고 제독을 맞는다. 서른넷.'],
      ['GH', '바다의 사람… 아바마마가 돌아가시고 내가 왕이 되었소. 대신들은 첫날부터 「사라진 맏이를 찾아내 벌하라」 하오. 역모의 씨앗이라고. …형님은 잘 지내시오? 설화는?'],
      aboard ? ['P', '둘 다 내 배에 있소. 형님은 요즘 거문고를 뜯고, 설화는 선원들 맥을 짚소.'] : ['P', '…지금은 내 배를 떠났소. 어디 있는지는 나도 모르오.'],
      ['GH', '(소매에서 접힌 종이를 꺼내며) 그렇다면 이것을 전해 주시오. 조정은 곧 「임해군이 교동도에서 죽었다」고 알릴 것이오. 내가 그렇게 하라 했소. 이 땅에서 형님의 이름을 지우면, 아무도 형님을 찾지 않을 테니까.']
    ]); });
    give('br_letter');
    if (aboard) {
      await passDays(1);
      await withPic('br_reply', '배 위의 답장', function () { return play([
        [null, '마포 나루에 묶어 둔 배. 선실 등잔 아래서 「이름 없는 사내」가 편지를 펼친다.'],
        ['IMM', '(읽다가 목이 멘다) 「형님, 이 땅에서 형님의 이름을 지우겠습니다. 형님이 죽었다고 온 나라에 알리겠습니다. 용서하지 마십시오. 그래야 형님이 사십니다.」 …바보 같은 녀석.'],
        ['SH', '(그의 등을 쓸어 주며) 답장 쓰세요. 이번엔 짐승 말고, 형이 쓰는 걸로요.'],
        [null, '그는 밤새 편지 뒷장에 답을 썼다. 새벽에 제독이 그것을 궁으로 가져갔다.'],
        ['GH', '(편지 뒷장을 펼치고 한참 아무 말이 없다) 「아우야, 이름은 네게 두고 간다. 너는 좋은 왕이 되어라. 거지였던 하루를 잊지 말고. 설화가 네 안부를 묻는다.」 …(눈을 감는다) 형님은 끝까지 형님이셨구려.']
      ]); });
      R.removeItem && R.removeItem('br_letter'); b.letterBack = 1;
    } else await play([['GH', '그래도 가지고 가 주시오. 바다 어딘가에서 형님을 만나거든.']]);
    b.kyodong = 1; b.imhae = 'sea';
    var kf = fame('so', 'kyodong');
    log('1608년 — 임금이 된 광해가 사라진 형의 이름을 지우기로 했다. 「임해군이 교동도에서 죽었다」고 알리라 했다.' + (aboard ? ' 형에게 편지를 전하고 답장을 가져왔다.' : '') + ' (사교 명성 +' + kf + ')');
    refresh();
  }

  // ================================================================ ④ 교동도 (1608.3.18~1609.5.31) — 임해가 궁에 남았으면
  function kyoOpen() { var b = st(), t = today(); return !!(b && b.swap === 'help' && b.leave !== 'yes' && !b.kyodong && atSeoul() && t >= D.kyoFrom && t <= D.kyoTo); }
  async function kyodong() {
    var b = st(), s = S(), k = K();
    await withPic('br_throne', '임금의 밤 (1608)', function () { return play([
      [null, '창덕궁 희정당. 붉은 곤룡포의 임금이 등잔 하나만 켜 두고 제독을 맞는다. 서른넷. 열여섯 살 거지 옷의 소년과 같은 눈이다.'],
      ['GH', (has('br_jade') ? '그 옥패, 아직 가지고 있구려. ' : '') + '바다의 사람… 아바마마가 돌아가시고 내가 왕이 되었소. 대신들은 첫날부터 상소를 올리오 — 「맏이 임해군이 군사를 모아 역모를 꾸민다」고. 형님은 교동도로 귀양 갔소.'],
      ['GH', '그들은 형님을 죽이라 하오. 내가 막으면, 그들은 나를 「형을 감싸 나라를 위태롭게 하는 임금」이라 부르며 무너뜨릴 것이오. …나는 왕이라서 형님을 살릴 수 없소. 우습지 않소? 거지였을 때는 적어도 형님을 업을 수는 있었는데.'],
      [null, '임금이 소매에서 접힌 종이 한 장을 꺼낸다.'],
      ['GH', '형님께 이것을 전해 주시오. 조정의 눈을 피해서. …' + (b.potion === 'told' ? '형님의 밤을 나는 알고 있었소. 그래서 더 미안하오.' : '형님께 하지 못한 말이 있소.')]
    ]); });
    give('br_letter');
    await play([['SH', '(내의원 의녀의 옷을 입고 회랑 끝에서 나타나며) 선장님. 저도 데려가 주세요. ' + (b.heart === 'i' ? '그 사람을… 혼자 두고 싶지 않아요.' : '교동도에서 사람이 하나 죽는다면, 마지막에 곁에 의원 하나는 있어야죠.')]]);
    await passDays(3);
    await withPic('br_kyodong', '교동도 (1608)', function () { return play([
      [null, '강화 북쪽, 교동도. 갯벌 위 낡은 초가를 군사들이 둘러쌌다. 수비 장수가 품속의 밀지를 만지작거리며 제독을 훑어본다.'],
      ['br_jailer', '바다의 상인이 이 섬에 무슨 볼일이오? …맏왕자는 곧 「병으로」 돌아가실 몸이오. 괜한 일에 끼지 마시오.'],
      ['IM', '(초가 안, 수척해진 얼굴로 웃으며) …그대로구려. 열일곱 해 전 담장 앞에서 나를 막아선 그 사람. ' + (b.potion === 'break' ? '그대가 병을 깨뜨린 뒤로 그 짐승은 점점 작아졌소. 지금은 가끔 꿈에서만 우오.' : '그 짐승은 아직 내 안에 있소. 밤이면 문을 긁지.')]
    ]); });
    var v = await UI.ask('교동도의 밤 — 어떻게 하겠는가?', [
      { label: '밤에 바다로 빼낸다', value: 'escape', icon: 'ship' },
      { label: '편지를 전하고 곁을 지킨다', value: 'letter', icon: 'scroll' }], me());
    var ending = 'killed';
    if (v === 'escape') {
      if (b.potion !== 'break') {
        await play([
          ['IM', '(고개를 저으며) 안 되오. 내 안의 그것을 바다에 풀어놓을 수는 없소. 그대의 선원들을, 그대의 항구를… (손을 움켜쥐며) 벌써 문을 긁고 있소.'],
          [null, '자정. 초가 안에서 짐승의 울음이 터져 나왔다. 수비 장수가 그것을 핑계로 군사들을 들여보낸다. 막아서는 제독의 일행 앞에 창이 늘어선다.']
        ]);
        await fight('교동도의 수비군', k.escortFoe || 20, { leader: '교동도의 별장' });
        ending = 'killed';
      } else {
        var bribe = k.bribe || 1500;
        var w = await UI.ask('수비군을 어떻게 지나갈까', [
          { label: '수비군과 싸운다', value: 'fight', icon: 'sword' },
          { label: '별장에게 금화를 건넨다 (' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe }], me());
        var ok = false;
        if (w === 'bribe' && s.player.gold >= bribe) {
          s.player.gold -= bribe; ok = true;
          await play([['br_jailer', '(금화를 저울질하다 밀지를 불 속에 던지며) …맏왕자는 오늘 밤 「병으로」 돌아가셨소. 주검은 바다에 뿌렸다고 아뢰겠소. 동이 트기 전에 사라지시오.']]);
        } else { var r = await fight('교동도의 수비군', k.escortFoe || 20, { leader: '교동도의 별장' }); ok = r === 'win'; }
        ending = ok ? 'fled' : 'killed';
      }
    } else {
      await play([
        [null, '임해군이 동생의 편지를 펼친다. 등잔 아래서 한 번, 두 번, 세 번 읽는다. 어깨가 떨린다.'],
        ['IM', '(웃으며 울며) 「형님, 저를 업고 담을 넘던 그 등을 기억합니다. 왕이 된 저는 형님을 업을 수가 없습니다. 용서하지 마십시오.」 …바보 같은 녀석. 용서는 내가 빌어야지.'],
        [null, '그는 밤새 편지 뒷장에 답을 썼다. ' + (b.potion === 'keep' ? '품에서 마지막 약병을 꺼내 들었다가 — 창밖 갯벌에 던졌다.' : '새벽이 될 때까지 짐승은 한 번도 문을 긁지 않았다.')],
        ['IM', '(접은 편지를 제독에게 건네며) 동생에게 전해 주시오. 그리고 — 나는 오늘 사람으로 죽겠소. 그 짐승에게 마지막 밤까지 내주지는 않겠소.']
      ]);
      ending = 'peace';
    }
    b.imhae = ending; b.kyodong = 1;
    if (ending === 'fled') {
      await withPic('br_sea', '새벽의 갯벌', function () { return play([
        [null, '동이 트기 전, 갯벌 끝에서 제독의 배가 썰물을 타고 나간다. 임해군이 상투를 풀어 바닷물에 던졌다.'],
        ['IM', '이름을 버리겠소. 왕자도, 맏이도, 짐승도. 그대의 배에서 — 사람으로 살겠소.'],
        b.heart === 'i' ? ['SH', '(배에 오르며) 혼자 보내지 않을 거예요. 침 자국을 기억하는 사람이 하나는 곁에 있어야죠.'] : ['SH', '(갯벌에 서서) …잘 가세요, 나리. 사람으로요.']
      ]); });
      if (b.heart === 'i') b.seolhwa = 'imhae';
      join('br_imhae', 85); if (b.seolhwa === 'imhae') join('br_seolhwa', 85);
      log('교동도에서 귀양 간 임해군을 바다로 빼냈다. 그는 이름을 버리고 「임해」라는 이름 없는 사내로 제독의 배에 올랐다.' + (b.seolhwa === 'imhae' ? ' 의녀 설화가 그와 함께 배에 올랐다.' : ''));
    } else if (ending === 'peace') {
      await play([[null, '이튿날 아침. 군사들이 초가에 들어섰을 때, 임해군은 의관을 갖추고 단정히 앉아 있었다. 설화가 그의 손을 잡고 있었다. 짐승은 끝내 나오지 않았다.']]);
      log('교동도에서 임해군에게 임금의 편지를 전했다. 그는 밤새 답을 쓰고 사람으로 죽었다. 편지 뒷장의 답을 맡았다.');
    } else {
      R.removeItem && R.removeItem('br_letter');
      await play([[null, '군사들의 창이 초가로 쏟아져 들어갔다. 짐승의 울음이 길게 이어지다 끊겼다. 갯벌 위로 동이 텄다.'], ['SH', '(무너진 초가 앞에 주저앉아) …끝내 사람의 얼굴을 못 보고 보내 드렸어요.']]);
      log('교동도 — 임해군을 구하지 못했다. 그날 밤 섬에서 짐승 같은 울음이 들렸다.');
    }
    var kf = fame('so', 'kyodong');
    if (b.seolhwa !== 'imhae') {
      var j = await UI.ask('설화가 묻는다 — 「궁에는 더 있을 수 없어요. 선장님 배에 의원 자리가 있나요?」', [
        { label: '배에 태운다', value: 'yes', icon: 'heart' },
        { label: '「혜민서의 사람들이 그대를 기다리오」', value: 'no' }], me());
      if (j === 'yes') { join('br_seolhwa', 85); b.seolhwa = 'ship'; await play([['SH', '바다에도 아픈 사람은 많겠죠. …' + (b.heart === 'g' ? '전하께는 말하지 마세요. 제가 떠난 걸 아시면 또 우실 거예요.' : '고마워요, 선장님.')]]); }
      else { b.seolhwa = 'stay'; await play([['SH', '그렇네요. 혜민서 마당에는 오늘도 아이들이 기다리겠죠.']]); }
    }
    refresh();
  }
  function letterBackOpen() { var b = st(); return !!(b && (b.imhae === 'peace' || b.imhae === 'fled') && !b.letterBack && atSeoul() && has('br_letter') && today() <= 16230411); }
  async function letterBack() {
    var b = st(); b.letterBack = 1;
    R.removeItem('br_letter');
    await play(b.imhae === 'peace'
      ? [['GH', '(편지 뒷장을 펼치고 한참 아무 말이 없다) 「동생아, 업어 주던 등은 내가 기억하마. 너는 좋은 왕이 되어라. 거지였던 하루를 잊지 말고.」 …(눈을 감는다) 형님은 끝까지 형님이셨구려.']]
      : [['GH', '(빈 편지 뒷장을 보며 웃는다) 아무것도 안 쓰셨구려. …아니, 쓰셨소. 「살아 있다」는 말을 쓰면 내가 위태로우니까. 형님은 바다 어딘가에 계시는구려.']]);
    log('교동도에서 맡아 온 편지를 임금 광해에게 돌려주었다.');
  }

  // ================================================================ ⑤ 왕자와 거지, 마지막 장 (1623.3.20~4.11)
  function lastOpen() { var b = st(), t = today(); return !!(b && b.swap === 'help' && !b.last && atSeoul() && t >= D.lastFrom && t <= D.lastTo); }
  async function last() {
    var b = st(), s = S(), aboard = !!row('br_makdong');
    var n = daysTo(D.lastTo); if (n > 0) await passDays(n);
    await withPic('br_coup', '반정의 밤 (1623)', function () { return play([
      [null, '밤. 창덕궁 쪽 하늘이 붉다. 칼과 횃불을 든 무리가 돈화문을 넘었다는 소리가 장터까지 들린다. 「반정이다! 능양군을 임금으로!」'],
      [null, '의관 안국신의 집 뒷방. 마흔아홉의 임금이 평복 차림으로 앉아 있다. 그 앞에 — 그와 똑같은 얼굴의 사내가 무릎을 꿇었다.'],
      ['MD', (aboard ? '(제독의 배에서 함께 내려온 막동이 숨을 몰아쉬며) ' : '(늙은 궁궐 마구간지기 옷의 막동이) ') + '전하. 아니, 도련님. 서른세 해 전에 제가 하루 왕자 노릇을 했지요. 이번엔 제가 한 번 더 할 차례예요. 옷을 바꿔 입으세요.'],
      ['GH', '(굳은 얼굴로) 안 된다. 그들은 나를 강화로, 어쩌면 더 먼 곳으로 끌고 갈 것이다. 너를 대신 보낼 수는 없다.'],
      ['MD', '(웃으며) 도련님, 저는 궁궐 담장 밑에서 태어났어요. 거기서 하루 왕자가 돼 봤고요. 이제 귀양지에서 「왕」으로 늙는 것도 나쁘지 않아요. 밥은 주겠죠. …그리고 도련님은 바다로 가세요. 거지였던 그날처럼, 궁 밖을 보러.']
    ]); });
    var v = await UI.ask('막동이 다시 옷을 바꿔 입자 한다', [
      { label: '옷을 바꿔 입게 한다 — 광해를 배에 태운다', value: 'swap', icon: 'ship' },
      { label: '「그대를 대신 보낼 수는 없소」', value: 'history' }], me());
    b.last = v;
    if (v === 'swap') {
      if (aboard) leaveMate('br_makdong');
      await play([
        [null, '새벽. 횃불을 든 무리가 문을 부수고 들어와, 평복의 임금을 끌고 나간다. 끌려가는 사내는 고개를 들고 웃었다. 아무도 그가 누군지 묻지 않았다.'],
        [null, '그 시각, 마포 나루. 갓을 눌러쓴 중년의 선비 하나가 제독의 배에 오른다.'],
        ['GH', '(멀어지는 한양을 돌아보며) …열여섯 살에 하루 거지가 되어 궁 밖을 보았소. 이제 남은 날 내내 궁 밖에서 살겠구려. 나를 「이름 없는 선비」라 불러 주시오.'],
        row('br_imhae') ? ['IMM', '(뱃머리에서 돌아서며 목이 멘다) …광해야.'] : null,
        row('br_imhae') ? ['GH', '(그 자리에 무릎이 꺾인다) 형님. …서른 해 만입니다. 형님의 이름을 지운 것은 저였습니다.'] : null,
        row('br_imhae') ? ['IMM', '(동생을 일으켜 세워 끌어안으며) 이름 따위. 너는 끝까지 남아서 왕이었다. 이제 됐다. 이제 업어 줄 수 있겠구나.'] : null,
        (b.seolhwa === 'ship' || b.seolhwa === 'imhae') && row('br_seolhwa') ? ['SH', '(선실 문 앞에서 그를 보고 그대로 멈춘다) …물동이 도령.'] : null,
        (b.seolhwa === 'ship' || b.seolhwa === 'imhae') && row('br_seolhwa') ? ['GH', '(오래 그녀를 보다가) 설화. …물동이는 이제 엎지르지 않소. 서른 해 연습했으니.'] : null
      ]);
      var y = G.MATE.br_gwanghae; if (y && y.y && y.y[1] < 1650) y.y = [y.y[0], 1650];
      join('br_gwanghae', 90);
      var lf = fame('so', 'last');
      log('1623년 반정의 밤 — 막동이 다시 광해와 옷을 바꿔 입고 대신 끌려갔다. 광해는 「이름 없는 선비」로 제독의 배에 올랐다. (사교 명성 +' + lf + ')');
      UI.toast('광해 — 「이름 없는 선비」로 배에 올랐다', 'heart', 6000);
    } else {
      await play([['MD', '(눈물을 닦으며) …도련님은 끝까지 도련님이네요.'], [null, '새벽, 무리가 문을 부수고 들어와 평복의 임금을 끌고 나갔다. 그는 끌려가며 단 한 번 뒤돌아보았다 — 막동이 아니라, 담장 너머의 장터 쪽을.']]);
      log('1623년 반정의 밤 — 광해는 막동을 대신 보내지 않았다. 그는 붙잡혀 강화도로 끌려갔다.');
    }
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[lastOpen, last], [letterBackOpen, letterBack], [kingOpen, kingNight], [kyoOpen, kyodong], [leaveOpen, leave], [facesOpen, faces], [swapOpen, swap]];
  BR.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  BR.check = async function () {
    if (BR._busy) return false; BR._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    BR._busy = false; refresh();
    return true;
  };
  BR._t = { swap: swap, faces: faces, leave: leave, kingNight: kingNight, kyodong: kyodong, letterBack: letterBack, last: last };
})(window.G = window.G || {});
