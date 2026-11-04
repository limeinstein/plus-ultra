/* 17세기 아프리카의 다섯 이야기 (G.Afr17) — 2026-11-03 사용자 요청 「누락된 역사 이벤트 · 에피소드마다 다른 여성 캐릭터 · 동료가 될 계기 · 전래 동화를 살짝」
   사람·조정값: js/data/africa17.js (G.BALANCE.afr17). 역사는 바뀌지 않는다 — 제독이 그 곁에 있었고, 한 사람을 데려왔을 뿐이다.
   ■ ① 쿠바 왕국 (1625~1680, 카사이 너머 쿠바의 뭍을 걸을 때 — js/scenes/land.js 가 G.Afr17.onLand 를 부른다)
        샤암 왕이 여러 무리를 하나로 묶고 궁정과 솜씨를 일으킨다. 옥수수·담배(gift통)를 바치면 왕이 기뻐한다(새 땅의 작물을 들여온 왕).
        직녀 카샤: 「짜는 동안 들여다보지 마세요」(학의 보은). 약속을 지키면 새벽에 물결 무늬 천과 함께 동료가 된다 · 들여다보면 천만 남기고 숲으로 사라진다.
   ■ ② 곤다르 (1636~1667, 악숨에 들면 「사흘 길 남쪽 곤다르로」)
        파실리다스 황제가 성을 쌓는다. 웨흐니 산꼭대기 왕족 감옥의 세나이트가 땋은 머리 줄을 내려 준다(라푼젤).
        (가) 황제 앞에서 그녀를 위해 말한다 — 신학 theo 이상 또는 성 쌓는 데 금화 gold → 사면, 동료
        (나) 밤에 머리 줄을 타고 데리고 내려온다 — 감옥 수비대(육상전) 이기면 동료 (다) 떠난다
   ■ ③ 케이프 (1652.4.6~1680, 케이프에 들면): 판리베크의 보급기지. 네덜란드 병사들이 코이코이 목자 코아네 소를 끌고 갔다.
        (가) 소값 ransom을 치러 돌려받게 한다 (나) 밤에 울타리를 열어 소를 돌려보낸다 — 들키면 VOC 병사들과 싸움 (다) 모른 척
        도운 날 밤, 코아가 「뭍에 닿지 못하는 배」 이야기를 한다(방황하는 네덜란드인 — 유령선 발견물의 실마리) → 동료
   ■ ④ 음빌라 뒤 (1665.11~1668, 르완다에 들면): 콩고 왕 안토니우 1세의 머리가 루안다의 나자레 성당에 묻혔다.
        밤마다 성당 벽에 대고 말을 거는 빨래꾼 — 콩고의 귀부인 도나 루지아(거위 치는 소녀).
        (가) 총독에게 몸값 ransom을 치른다 (나) 배에 숨겨 데리고 나간다 — 부두 수비대와 싸움 (다) 모른 척 → (가)(나) 동료
   ■ ⑤ 몸바사 (1696.3.15~1698.12.12, 몸바사에 들면): 오만 군이 예수 요새를 에워쌌다. 요새 안은 역병.
        리옹고의 노래를 지키는 시인 음와나 자흐라. (가) 필사본과 그녀를 밤바다로 빼낸다 — 오만 순찰선 사람들과 싸움
        (나) 요새에 약재(herbs통)를 들여보내는 길을 그녀가 안내한다 (다) 떠난다 → (가)(나) 동료
   ■ 소식 (누구나): 쿠바 왕국의 통합 · 곤다르 · 희망봉 보급기지 · 첫 코이코이 전쟁 · 음빌라 전투 · 상살바도르의 몰락 (몸바사 함락은 js/systems/ottomaneurope.js)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/af_* — images/legend-events/AFRICA17_PROMPT.md
   ■ 물러서거나(떠난다·모른 척) 싸움에 막히면 again(180)일 뒤 다시 — 그 사이 기한이 지나면 끝. 쿠바에서 들여다본 일은 되돌릴 수 없다.
   ■ 저장: s.afr17 = { told: {}, kuba, gondar, cape, mbwila, mombasa, <열쇠>How, <열쇠>Cool } — 옛 저장은 처음 쓸 때 만든다(지난 소식은 알린 것으로) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var AF = G.Afr17 = {};
  function K() { return G.BALANCE.afr17; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['kuba', 'gondar', 'cape', 'khoiwar', 'mbwila', 'kongofall'];
  var NEWS_AT = { kuba: 16250601, gondar: 16360901, cape: 16520406, khoiwar: 16590519, mbwila: 16651029, kongofall: 16780101 };
  AF.NEWS_AT = NEWS_AT;
  function st() {
    var s = S(); if (!s) return null;
    if (!s.afr17) { s.afr17 = { told: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.afr17.told[k] = 1; }); }
    s.afr17.told = s.afr17.told || {};
    return s.afr17;
  }
  AF.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { var s = S(); return !!(s.flags && s.flags['gone_' + id]); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var ALIAS = { kasha: '라피아 직녀', senait: '산꼭대기의 아가씨', koa: '코이코이 목자', luzia: '빨래꾼 여인', zahra: '베일 쓴 시인' };
  var known = {};   // 이름을 밝히기 전에는 별칭으로
  function mate(id) { var sp = G.Legend && G.Legend.speaker ? G.Legend.speaker(id) : { name: G.MATE[id].name, portrait: G.Scenes.mateSpec(id), lang: 3 }; return known[id] ? sp : Object.assign({}, sp, { name: ALIAS[id] || sp.name }); }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    if (G.MATE[k] && ALIAS[k]) return mate(k);
    return G.Hist ? G.Hist.speaker('af_' + k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; if (l[2] === 'name') known[l[0]] = true; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id), who: null }; return { lv: (b && b.lv) || 0, who: (b && b.who) || '제독' }; }
  function item(id) { return R.addItem ? R.addItem(id) !== false : false; }
  function qty(id) { var c = S().fleet.cargo || {}; return c[id] ? c[id].q || 0 : 0; }
  function take(id, n) { var c = S().fleet.cargo, cg = c && c[id]; if (!cg) return 0; n = Math.min(cg.q, n); if (R.takeCargoLots) R.takeCargoLots(cg, null, n, 0); cg.q -= n; if (cg.q <= 0) delete c[id]; return n; }
  /** 동료가 된다 (이야기 동료 규칙 — G.Legend.join) */
  function join(id, cityId) {
    var s = S(), c = G.CITY_DATA[cityId];
    var nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null;
    if (!nm) { nm = { id: id, role: 'none', joined: today(), loyal: K().loyal }; s.mates.push(nm); }
    nm.loyal = Math.max(nm.loyal || 0, K().loyal || 80);
    known[id] = true;
    if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    return nm;
  }
  /** 물러섰거나 막혔다 — 곧바로 끝내지 않고 again일 뒤 다시 만날 수 있다 (쿠바에서 들여다본 일만 되돌릴 수 없다) */
  function later(key, how) { var b = st(), s = S(); b[key] = null; b[key + 'How'] = how; b[key + 'Cool'] = s.day + (K().again || 180); }
  function cooled(key) { var b = st(); return !(b[key + 'Cool'] > S().day); }
  function free(id) { return !!(G.MATE[id] && !row(id) && !gone(id)); }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party, land = s.loc.mode === 'land';
    if (!land) s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (!land) { if (keep != null) s.loc.party = keep; else delete s.loc.party; } }
  }

  // ================================================================ ① 쿠바 왕국 — 라피아 직녀 카샤 (학의 보은)
  AF.inKuba = function (lon, lat) {
    var b = K().kuba.box; if (!(lon >= b[0] && lon <= b[1] && lat >= b[2] && lat <= b[3])) return false;
    var t = G.Geo.terrain(lon, lat); return !!t && t !== 'sea';
  };
  function kubaOpen(lon, lat) { var b = st(), t = today(), k = K().kuba; return !!(b && !b.kuba && free('kasha') && t >= k.from && t <= k.to && AF.inKuba(lon, lat)); }
  AF.onLand = async function (lon, lat, api) {
    var s = S(); if (!s || s.loc.mode !== 'land' || !kubaOpen(lon, lat)) return false;
    if (api && api.stop) api.stop();
    return AF.kuba();
  };
  AF.kuba = async function () {
    var b = st(), k = K().kuba; b.kuba = 'met';
    await withPic('af_kuba_court', '쿠바 왕국의 궁정', function () { return play([
      [null, '카사이 강을 건너 숲과 풀밭이 번갈아 나오는 땅. 북소리를 따라가자 야자 잎 지붕이 끝없이 이어진 왕도가 나타났다. 서로 다른 말을 쓰던 무리들이 한 왕 아래 모여 산다는 쿠바의 도읍이다.'],
      ['shyaam', '바다에서 온 사람인가. 나는 샤암. 이 땅의 무리들은 저마다 제 조상의 북을 쳤다. 나는 그 북들을 한 궁정에 모았다. 대장장이, 조각가, 직녀 — 솜씨 있는 자는 누구든 내 곁에 앉는다.'],
      ['shyaam', '서쪽 바다 사람들이 가져온 이상한 씨앗 이야기를 들었다. 노란 알이 박힌 큰 곡식, 연기를 마시는 잎. 그대 짐에 그런 것이 있는가?']
    ]); });
    var gift = ['maize', 'tobacco'].filter(function (id) { return qty(id) >= k.gift; })[0];
    if (gift) {
      var v = await UI.ask('샤암 왕이 새 땅의 작물을 묻는다', [{ label: G.GOOD[gift].name + ' ' + k.gift + '통을 바친다', value: 'give' }, { label: '바치지 않는다', value: 'no' }], who('shyaam'));
      if (v === 'give') {
        take(gift, k.gift); b.kubaGift = gift; var so = fame('so', 120);
        await play([['shyaam', gift === 'maize' ? '이것이 그 노란 곡식이로군! 우리 밭에 심겠다. 쿠바의 아이들이 배고프지 않게 되면, 그대 이름도 함께 자랄 것이다.' : '연기를 마시는 잎이라! 원로들이 둘러앉아 이것을 피우며 이야기하겠지. 좋다, 그대는 이 궁정의 손님이다.']]);
        log('쿠바 왕국의 샤암 왕에게 ' + G.GOOD[gift].name + ' ' + k.gift + '통을 바쳤다. (사교 명성 +' + so + ')');
      }
    }
    await withPic('af_kuba_loom', '들여다보지 말라는 직녀', function () { return play([
      [null, '궁정 한쪽 그늘에서 젊은 여인이 무릎에 라피아 천을 펼치고 있었다. 야자 잎 실로 짠 천에 바늘로 짧은 털을 심어, 손바닥에 닿으면 벨벳처럼 도톰한 무늬가 솟아난다. 같은 무늬가 하나도 없다.'],
      ['kasha', '바다에서 오셨다고요? …바다는 어떤 무늬예요? 이 땅의 무늬는 다 짜 봤어요. 강의 굽이, 거북 등, 왕의 북. 그런데 물결은 아직 한 번도 못 봤어요.'],
      ['kasha', '저는 카샤예요. 오늘 밤 바다 무늬를 짜 볼게요. 제독님 이야기를 듣고서요. 그런데 한 가지만 약속해 주세요 — 제가 짜는 동안에는 누구도 오두막 안을 들여다보면 안 돼요.', 'name']
    ]); });
    await play([[null, '밤이 깊었다. 오두막 안에서 바늘 소리가 끊이지 않는다. 가끔 낮은 노랫소리와 함께, 숨을 고르는 듯한 소리가 섞인다. 대원 하나가 슬그머니 거적문 쪽으로 다가간다.'],
      ['first', '제독님, 무슨 소리일까요? 사람 혼자서 저렇게 쉬지 않고 짤 수가 있습니까? 살짝만 들여다보면…']]);
    var v2 = await UI.ask('카샤가 짜는 동안 들여다보지 말라고 했다', [{ label: '약속을 지킨다 — 대원을 말린다', value: 'keep' }, { label: '살짝 들여다본다', value: 'peek' }], me());
    if (v2 === 'peek') {
      b.kuba = 'peek';
      await withPic('af_kuba_peek', '거적문 너머', function () { return play([
        [null, '거적문 틈으로 본 것은 — 등잔불 아래 손끝이 갈라져 피가 맺힌 채 바늘을 놀리는 카샤였다. 쉬지 않고 짜느라 손톱이 깨지고, 눈가는 붉게 젖어 있다. 그녀가 고개를 들었다. 눈이 마주쳤다.'],
        ['kasha', '…보셨군요. 짜는 동안의 저는 아무에게도 보여 주고 싶지 않았어요. 아프고, 못생기고, 필사적인 얼굴이니까요.'],
        [null, '새벽, 오두막에는 다 짠 천 한 장만 반듯하게 개어져 있었다. 물결 무늬였다. 카샤는 보이지 않았다. 궁정 사람들은 그녀가 숲 너머 고향 마을로 돌아갔다고만 했다.']
      ]); });
      var g = item('kuba_velvet');
      log('쿠바 왕국에서 직녀 카샤가 짜는 모습을 들여다보았다. 그녀는 물결 무늬 천만 남기고 숲으로 떠났다.');
      UI.toast(g ? G.ITEM.kuba_velvet.name + '만 남았다…' : '카샤는 떠났다…', 'scroll', 5200);
      refresh(); return true;
    }
    b.kuba = 'joined';
    await withPic('af_kuba_dawn', '새벽의 물결 무늬', function () { return play([
      [null, '새벽. 거적문이 열리고 카샤가 나왔다. 손끝에 천을 감았지만 얼굴은 환했다. 품에 안은 라피아 천에는 이 땅 누구도 본 적 없는 무늬 — 겹겹이 밀려오는 물결이 짜여 있었다.'],
      ['kasha', '끝까지 들여다보지 않으셨네요. 고마워요. …이 물결, 맞아요? 제독님 이야기만 듣고 짰어요. 진짜 바다를 보면 틀린 데가 보이겠죠.'],
      ['shyaam', '(천을 받아 들고 한참 쓰다듬더니) 내 궁정에 물결이 들어왔구나. 카샤, 너는 이 무늬를 바다에서 다시 짜 와라. 쿠바의 천이 바다 너머까지 가도록.'],
      ['kasha', '네, 왕이시여! 제독님, 저를 바다에 데려가 주세요. 진짜 물결을 보고, 틀린 데를 고칠래요.']
    ]); });
    join('kasha', 100); item('kuba_velvet');
    var so2 = fame('so', 100);
    log('쿠바 왕국에서 샤암 왕의 궁정을 보았다. 직녀 카샤와의 약속을 지켰고, 카샤가 진짜 물결을 보겠다며 동료가 되었다. (사교 명성 +' + so2 + ')');
    UI.toast('카샤가 동료가 되었다 — 세공 3 · 그림·측량 2', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ ② 곤다르 — 웨흐니 산꼭대기의 세나이트 (라푼젤)
  function gondarOpen() { var b = st(), t = today(), k = K().gondar; return !!(b && !b.gondar && cooled('gondar') && free('senait') && cityNow() === k.city && t >= k.from && t <= k.to); }
  AF.gondar = async function () {
    var b = st(), k = K().gondar, s = S(); b.gondar = 'met';
    await withPic('af_gondar_castle', '곤다르의 성 (1636~)', function () { return play([
      [null, '악숨에서 사흘 길 남쪽, 타나 호수 북쪽의 높은 들판 곤다르. 돌을 쌓아 올린 네모난 탑과 둥근 망루 — 에티오피아에서 처음 보는 성이 올라가고 있다. 떠돌던 황제의 궁정이 이제 한곳에 머문다.'],
      ['fasilides', '바다 너머 프랑크 사람이로군. 경계하지 마라. 내가 내쫓은 것은 너희 예수회 신부들이지, 장사꾼은 아니다. 아버지 수세뇨스께서 우리 교회를 로마에 바치려 하셨지만, 나는 조상의 믿음을 되찾았다.'],
      ['fasilides', '이 성은 다시는 흔들리지 않을 에티오피아의 자리다. 그대 나라의 석수들 못지않은 솜씨지 않은가?'],
      [null, '— 돌아오는 길, 깎아지른 산이 하늘로 솟은 곳을 지났다. 웨흐니 — 황제의 핏줄 가운데 왕좌를 넘볼 만한 이들을 가두는 산꼭대기 감옥이다. 해 질 녘, 절벽 위 작은 창에서 노랫소리가 흘러내렸다.']
    ]); });
    await withPic('af_gondar_wehni', '웨흐니 산의 노래', function () { return play([
      ['senait', '(절벽 위에서) 거기 아래 누구세요? 이 산 아래로 사람 지나가는 걸 몇 해 만에 봐요. …잠깐만요, 줄을 내려 드릴게요.'],
      [null, '창에서 검은 줄이 스르르 내려왔다. 가까이서 보니 목화실과 — 사람의 머리카락을 촘촘히 땋은 줄이다. 줄을 붙잡고 오르자, 창가에 발목까지 닿는 머리를 땋은 젊은 여인이 앉아 있었다.'],
      ['senait', '저는 세나이트예요. 아버지가 예수회 신부들의 말을 따랐다는 죄로, 저는 열 살 때부터 여기 있었어요. 머리카락이 이만큼 자랄 동안요. 이 줄은 해마다 조금씩 땋은 거예요 — 언젠가 내려갈 날을 위해서.', 'name'],
      ['senait', '저는 아버지의 신앙이 아니라 우리 교회의 시편으로 자랐어요. 게에즈어 시편 백오십 편을 다 외워요. 그런데 황제께서는 제 이름도 모르실 거예요.']
    ]); });
    var th = skill('theo'), gold = s.player.gold;
    var canPlead = th.lv >= k.theo || gold >= k.gold;
    var v = await UI.ask('세나이트를 어떻게 할까?', [
      { label: '황제 앞에서 그녀를 위해 말한다' + (th.lv >= k.theo ? ' (신학 ' + th.lv + ' — ' + th.who + ')' : gold >= k.gold ? ' (성 쌓는 데 금화 ' + U.num(k.gold) + '닢)' : ' — 신학 ' + k.theo + ' 또는 금화 ' + U.num(k.gold) + '닢이 있어야 한다'), value: 'plead', dis: !canPlead },
      { label: '밤에 머리 줄을 타고 그녀를 데리고 내려온다', value: 'escape' },
      { label: '떠난다', value: 'leave' }], who('senait'));
    if (v === 'plead' && canPlead) {
      var byTheo = th.lv >= k.theo;
      if (!byTheo) s.player.gold -= k.gold;
      await play([
        ['P', byTheo ? '폐하, 웨흐니의 세나이트는 아버지의 죄가 아니라 우리 교회의 시편으로 자랐습니다. 게에즈어 시편 백오십 편을 외우는 사람을 로마의 사람이라 하실 수 있겠습니까?' : '폐하, 이 금화를 곤다르의 성 쌓는 데 보태겠습니다. 다만 한 가지 — 웨흐니에 갇힌 세나이트라는 아가씨를 풀어 주십시오.'],
        ['fasilides', byTheo ? '(눈썹을 치켜올리고 한참 침묵하더니) …프랑크 사람이 우리 시편을 들어 나를 가르치는가. 좋다. 그 아이를 불러 시편 하나를 외워 보게 하라.' : '…금화로 내 핏줄을 사겠다는 건가. (돌로 쌓은 탑을 올려다보며) 하지만 이 성이 빨리 서는 것은 나라를 위한 일이지.'],
        ['senait', byTheo ? '(황제 앞에서 떨리는 목소리로, 그러나 끝까지) 「주께서 나의 목자시니…」' : null],
        ['fasilides', '세나이트라 했나. 너를 풀어 준다. 산 아래 세상을 보아라. 다만 다시는 이 나라의 믿음을 바다 너머에 팔지 마라.']
      ]);
      b.gondar = 'pardon';
      var so = fame('so', byTheo ? 200 : 120);
      log('곤다르의 파실리다스 황제 앞에서 웨흐니 산에 갇혀 있던 세나이트를 위해 말해 사면을 받아 냈다.' + (byTheo ? ' (신학으로)' : ' (금화 ' + U.num(k.gold) + '닢)') + ' (사교 명성 +' + so + ')');
    } else if (v === 'escape') {
      await play([[null, '달 없는 밤. 세나이트가 머리 줄을 창틀에 단단히 묶었다. 그녀를 업고 절벽을 반쯤 내려왔을 때, 위에서 횃불이 켜지고 호각이 울렸다.']]);
      var r = await fight('웨흐니 산 감옥의 수비대', k.guards, { guns: false, leader: '감옥지기 대장', noSpecial: true });
      if (r !== 'win') {
        later('gondar', 'caught');
        await play([[null, '수비대에 막혀 물러났다. 마지막으로 올려다본 창가에서, 세나이트가 머리 줄을 거두어 들이고 있었다. 노랫소리는 다시 들리지 않았다.']]);
        log('웨흐니 산에서 세나이트를 데리고 내려오려다 감옥 수비대에 막혔다.');
        refresh(); return true;
      }
      b.gondar = 'escape';
      await play([['senait', '…발밑이 땅이에요. 열한 해 만에 처음 밟는 땅. (머리 줄을 칼로 끊어 한 토막을 건넨다) 이건 제독님이 가지세요. 저는 이제 이 줄이 없어도 돼요.']]);
      log('밤에 세나이트의 머리 줄을 타고 웨흐니 산 감옥에서 그녀를 데리고 내려왔다.');
    } else {
      later('gondar', 'leave');
      await play([['senait', '…그래요. 그래도 오늘은 사람 목소리를 들었으니 됐어요. 줄은 계속 땋을게요.']]);
      log('곤다르의 웨흐니 산에서 갇힌 세나이트를 만났지만 그대로 떠났다.');
      refresh(); return true;
    }
    await play([['senait', '바다가 하늘보다 넓다고요? 정말이에요? …보여 주세요. 시편은 배 위에서도 외울 수 있으니까요.']]);
    join('senait', k.city); item('senait_braid');
    UI.toast('세나이트가 동료가 되었다 — 신학 3 · 역사학·음악 2', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ ③ 케이프 — 코이코이 목자 코아 (방황하는 네덜란드인)
  function capeOpen() { var b = st(), t = today(), k = K().cape; return !!(b && !b.cape && cooled('cape') && free('koa') && cityNow() === k.city && t >= k.from && t <= k.to); }
  AF.cape = async function () {
    var b = st(), k = K().cape, s = S(); b.cape = 'met';
    await withPic('af_cape_fort', '희망봉 보급기지 (1652~)', function () { return play([
      [null, '탁자처럼 평평한 산 아래 만. 진흙과 나무로 쌓은 작은 요새, 그 곁에 반듯하게 갈아엎은 채소밭. 네덜란드 동인도 회사가 바타비아로 오가는 배들에 물과 채소, 고기를 대려고 세운 보급기지다.'],
      ['riebeeck', '어서 오시오. 나는 판리베크, 이 기지를 맡고 있소. 회사의 명령은 간단하오 — 배에 채소와 고기를 대라, 원주민과는 다투지 말고 소를 사라. …말이야 쉽지.'],
      [null, '요새 울타리 안에서 소 떼가 울고 있다. 울타리 밖에서 짐승 가죽 망토를 두른 젊은 여인이 병사들과 언성을 높인다.'],
      ['koa', '그 소들은 우리 집안 거예요! 구리 막대 몇 개로 「샀다」고요? 우리는 우유를 짤 소를 빌려준 거지, 판 게 아니에요! 그리고 왜 우리 풀밭에 울타리를 쳐요?'],
      ['riebeeck', '(제독에게 낮은 목소리로) 저 여자는 우리 말을 제법 하오. 코이코이 사람들은 소를 사고판다는 생각이 우리와 다르오. 병사들은 「값을 치렀다」고 하고, 저들은 「빌려줬다」고 하지. 이러다 큰 싸움이 나겠소.']
    ]); });
    var v = await UI.ask('코이코이 여인의 소 떼', [
      { label: '소값 금화 ' + U.num(k.ransom) + '닢을 치러 돌려받게 한다', value: 'pay', dis: s.player.gold < k.ransom },
      { label: '밤에 울타리를 열어 소를 돌려보낸다', value: 'night' },
      { label: '모른 척한다', value: 'leave' }], who('koa'));
    if (v === 'pay' && s.player.gold >= k.ransom) {
      s.player.gold -= k.ransom; b.cape = 'pay';
      await play([['riebeeck', '…좋소. 회사 장부에는 「선한 이웃과의 거래」라 적겠소. 다들 울타리를 열어라.'], ['koa', '(소 떼를 몰고 나가다 돌아서서) 금화로 소를 사서 우리한테 돌려준 사람은 처음 봐요. 당신들 바다 사람들은 정말 이상해요.']]);
    } else if (v === 'night') {
      var sv = skill('survey');
      await play([[null, '달이 기울 무렵, 제독의 사람들이 울타리 말뚝을 하나씩 뽑았다. 코이코이 여인이 낮게 휘파람을 불자 소들이 소리 없이 밤 풀밭으로 걸어 나간다.']]);
      if (sv.lv >= 2 || U.chance(0.5)) {
        b.cape = 'night';
        await play([[null, (sv.lv >= 2 ? sv.who + (sv.who === '제독' ? '이' : U.jx(sv.who, '이/가')) + ' 바람의 방향과 보초의 걸음을 재어 둔 덕에' : '운 좋게도') + ' 보초는 끝까지 눈치채지 못했다.']]);
      } else {
        await play([[null, '「도둑이다!」 보초가 소리치고 요새에서 병사들이 횃불을 들고 쏟아져 나왔다.']]);
        var r = await fight('VOC 보급기지의 병사들', k.soldiers, { guns: true, leader: '하사관', noSpecial: true });
        b.cape = 'nightFight';
        if (r !== 'win') {
          later('cape', 'caught');
          await play([[null, '병사들에게 밀려났다. 소 떼는 다시 울타리 안으로 몰려 들어갔고, 여인은 어둠 속으로 사라졌다.']]);
          log('케이프에서 코이코이 여인의 소를 밤에 돌려보내려다 VOC 병사들에게 밀려났다.');
          refresh(); return true;
        }
      }
    } else {
      later('cape', 'leave');
      await play([['koa', '(제독을 한 번 쳐다보고는) 당신도 구리 막대로 소를 「사는」 사람이군요.']]);
      log('케이프 보급기지에서 코이코이 사람들과 VOC의 소 다툼을 모른 척했다.');
      refresh(); return true;
    }
    await withPic('af_cape_night', '뭍에 닿지 못하는 배', function () { return play([
      [null, '그날 밤, 여인이 모닥불가로 찾아왔다. 부쿠 풀잎을 태운 향이 바다 바람에 섞인다.'],
      ['koa', '저는 코아예요. 고마워요. …제 할머니가 그러셨어요. 바다 사람들이 오기 훨씬 전부터, 폭풍 치는 밤이면 남쪽 바다에 초록 불을 켠 배가 보인대요. 그 배는 아무리 저어도 뭍에 닿지 못한대요. 바다에 저주받은 사람들이 탄 배라고.', 'name'],
      ['koa', '당신들 배는 뭍에 닿잖아요. 그리고 또 떠나요. 소들은 어디로 가는 거예요? 배들은 어디서 와서 어디로 가요? …저도 보고 싶어요. 제 소들이 어떤 바다를 건너는지.'],
      ['first', '제독님, 희망봉 남쪽의 초록 불 배라면… 뱃사람들 사이에서 도는 「방황하는 네덜란드인」 이야기와 똑같습니다.']
    ]); });
    if (G.Disc && G.DISC && G.DISC['ghost-ship'] && !G.Disc.foundByMe('ghost-ship') && G.Disc.addHint) G.Disc.addHint('ghost-ship', 'lead:afr17');
    join('koa', k.city); item('buchu_pouch');
    var so = fame('so', b.cape === 'pay' ? 120 : 80);
    log('케이프에서 코이코이 목자 코아의 소를 되찾아 주었다. 코아가 배들이 오가는 바다를 보겠다며 동료가 되었다. 그녀의 할머니는 뭍에 닿지 못하는 초록 불 배 이야기를 했다. (사교 명성 +' + so + ')');
    UI.toast('코아가 동료가 되었다 — 측량·의학·요리 2 · 유령선의 실마리', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ ④ 음빌라 뒤 — 루안다의 빨래꾼, 도나 루지아 (거위 치는 소녀)
  function mbwilaOpen() { var b = st(), t = today(), k = K().mbwila; return !!(b && !b.mbwila && cooled('mbwila') && free('luzia') && cityNow() === k.city && t >= k.from && t <= k.to); }
  AF.mbwila = async function () {
    var b = st(), k = K().mbwila, s = S(); b.mbwila = 'met';
    await withPic('af_mbwila_chapel', '나자레 성당의 밤', function () { return play([
      [null, '루안다. 음빌라 싸움에서 포르투갈 군이 콩고 왕 안토니우 1세를 쓰러뜨렸다는 소식이 아직 거리에 뜨겁다. 왕의 목은 이 도시로 옮겨져 바닷가 나자레 성모 성당에 묻혔다고 한다.'],
      [null, '— 밤. 성당 담 밑에서 빨래 바구니를 내려놓은 여인이 벽에 이마를 대고 낮게 말하고 있다.'],
      ['luzia', '(킥콩고어로) 폐하, 오늘도 왔어요. 왕관은 리스본으로 보내졌대요. 상살바도르에서는 또 왕을 두고 다툰대요. …폐하, 왕비 마마께서 아시면 가슴이 찢어지실 거예요.'],
      ['first', '(속삭이며) 제독님, 저 여자 — 빨래꾼 손이 아닙니다. 걸음걸이도, 말씨도. 궁정 사람입니다.'],
      ['luzia', '(돌아보며 포르투갈어로, 놀랄 만큼 또렷하게) 엿들으셨군요. …좋아요, 숨기지 않을게요. 저는 루지아. 상살바도르 궁정에서 왕비 마마를 모시던 사람이에요. 음빌라에서 살아남아 빨래꾼 옷을 입었죠.', 'name'],
      ['luzia', '총독의 사람들이 왕실 사람을 찾고 있어요. 붙잡히면 브라질의 사탕수수 밭으로 보내지겠죠. 저는 이 도시를 떠나야 해요. 콩고로 돌아가도 지금은 왕이 셋이에요 — 차라리 바다로 가서, 언젠가 콩고를 위해 말할 수 있는 사람이 되고 싶어요.']
    ]); });
    var v = await UI.ask('도나 루지아를 어떻게 할까?', [
      { label: '총독에게 몸값 금화 ' + U.num(k.ransom) + '닢을 치르고 그녀를 정식으로 데려간다', value: 'pay', dis: s.player.gold < k.ransom },
      { label: '배에 숨겨 데리고 나간다', value: 'smuggle' },
      { label: '모른 척한다', value: 'leave' }], who('luzia'));
    if (v === 'pay' && s.player.gold >= k.ransom) {
      s.player.gold -= k.ransom; b.mbwila = 'pay';
      await play([['vidal', '빨래꾼 하나에 금화를 이만큼? …(눈을 가늘게 뜨고) 누군지 묻지 않겠소. 다만 다시는 이 도시에 발을 들이지 않게 하시오.'], ['luzia', '(총독 앞에서 고개를 숙이지 않은 채) 감사는 하지 않겠어요, 총독 나리. 제독님께만 하겠어요.']]);
      log('루안다에서 총독 비달 드 네그레이루스에게 몸값을 치르고 콩고의 귀부인 도나 루지아를 데려왔다.');
    } else if (v === 'smuggle') {
      await play([[null, '새벽, 빨래 바구니를 인 여인들 틈에 섞여 부두로 내려간다. 배에 오르기 직전, 총독의 병사 하나가 그녀의 손목을 붙잡았다. 「빨래꾼 손이 이렇게 고울 리 없지!」']]);
      var r = await fight('루안다 부두의 수비대', k.guards, { guns: true, leader: '부두 수비대장', noSpecial: true });
      if (r !== 'win') {
        later('mbwila', 'caught');
        await play([[null, '부두에서 밀려났다. 루지아는 병사들에게 끌려가며 한 번 돌아보았다 — 원망이 아니라, 고맙다는 눈빛이었다.']]);
        log('루안다에서 도나 루지아를 배에 숨겨 데려가려다 부두 수비대에 막혔다.');
        refresh(); return true;
      }
      b.mbwila = 'smuggle';
      await play([['luzia', '(빨래꾼 머릿수건을 벗어 바다에 던지며) 이걸로 빨래꾼은 끝이에요. 칼 한 자루 빌려주세요 — 왕실 호위대에게 배운 솜씨가 아직 남아 있으니까요.']]);
      log('루안다 부두에서 수비대를 물리치고 콩고의 귀부인 도나 루지아를 배에 태웠다.');
    } else {
      later('mbwila', 'leave');
      await play([['luzia', '…그래요. 들은 건 잊어 주세요. 저는 내일도 빨래를 할 거예요.']]);
      log('루안다에서 빨래꾼으로 숨은 콩고의 귀부인을 모른 척했다.');
      refresh(); return true;
    }
    join('luzia', k.city); item('kongo_rosary');
    var so = fame('so', 120);
    UI.toast('도나 루지아가 동료가 되었다 — 웅변 3 · 신학·검술 2 (사교 명성 +' + so + ')', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ ⑤ 몸바사 — 리옹고의 노래를 지키는 음와나 자흐라
  function mombasaOpen() { var b = st(), t = today(), k = K().mombasa; return !!(b && !b.mombasa && cooled('mombasa') && free('zahra') && cityNow() === k.city && t >= k.from && t <= k.to); }
  AF.mombasa = async function () {
    var b = st(), k = K().mombasa; b.mombasa = 'met';
    await withPic('af_mombasa_siege', '포위된 예수 요새', function () { return play([
      [null, '몸바사. 산호석으로 쌓은 예수 요새 위로 포르투갈 깃발이 아직 걸려 있지만, 섬 둘레의 바다와 거리는 오만의 배와 군사가 쥐고 있다. 포위가 몇 해째 이어지고, 요새 안에서는 역병이 돈다는 소문이다.'],
      ['saif', '프랑크의 배를 탄 상인인가. 장사는 해도 좋다. 다만 저 요새에 쌀 한 톨이라도 들여보내면, 그대 배도 저 요새와 같은 꼴이 된다.'],
      [null, '— 골목 깊은 곳, 금실 수놓은 검은 부이부이를 두른 여인이 제독의 소매를 끌었다. 헤나로 물들인 손끝에 낡은 필사본 한 묶음이 들려 있다.'],
      ['zahra', '바다 사람, 놀라지 마세요. 저는 자흐라, 이 섬의 시인이에요. 이건 우리 할아버지가 평생 모은 리옹고의 노래예요. 활 한 자루로 왕의 군대를 물리치고, 감옥 안에서도 노래로 탈출할 길을 찾았던 시인 영웅이요.', 'name'],
      ['zahra', '리옹고는 어떤 칼에도 죽지 않았지만, 배꼽에 꽂힌 구리 바늘 하나에 쓰러졌대요. 성벽도 그래요 — 저 요새도 결국 무너질 거예요. 하지만 노래는 성벽보다 오래 남아요. 이 노래를 불길에서 지키고 싶어요.'],
      ['zahra', '그리고… 요새 안에는 우리 스와힐리 사람들도 있어요. 역병에 걸린 아이들이요. 약만 들어가면 몇이라도 살 텐데.']
    ]); });
    var herbsOk = qty('herbs') >= k.herbs, md = skill('med');
    var v = await UI.ask('자흐라의 부탁', [
      { label: '필사본과 그녀를 밤바다로 빼낸다', value: 'escape' },
      { label: herbsOk ? '그녀의 안내로 요새에 약재 ' + k.herbs + '통을 들여보낸다' + (md.lv ? ' (의학 ' + md.lv + ' — ' + md.who + ')' : '') : '요새에 약을 들여보낸다 — 약재가 ' + k.herbs + '통 있어야 한다', value: 'medicine', dis: !herbsOk },
      { label: '떠난다', value: 'leave' }], who('zahra'));
    if (v === 'escape') {
      await play([[null, '달이 지자 작은 거룻배에 필사본 상자와 자흐라를 태웠다. 노를 반쯤 저었을 때, 오만의 순찰선에서 횃불이 비추었다. 「거기 서라!」 순찰선이 거룻배 옆에 붙어 사람들이 뛰어든다.']]);
      var r = await fight('오만 순찰선의 군사들', k.raiders, { guns: true, leader: '순찰선 대장', noSpecial: true });
      if (r !== 'win') {
        later('mombasa', 'caught');
        await play([[null, '순찰선에 밀려 거룻배를 돌렸다. 자흐라는 필사본 상자를 끌어안고 다시 골목 속으로 사라졌다.']]);
        log('몸바사에서 시인 음와나 자흐라와 필사본을 빼내려다 오만 순찰선에 막혔다.');
        refresh(); return true;
      }
      b.mombasa = 'escape';
      await play([['zahra', '(젖은 상자를 열어 필사본이 무사한지 한 장 한 장 넘겨 보더니, 비로소 웃는다) 리옹고는 오늘 밤도 살아남았어요. 제독님 덕분에요.']]);
      log('몸바사 포위 속에서 시인 음와나 자흐라와 『리옹고의 노래』 필사본을 밤바다로 빼냈다.');
    } else if (v === 'medicine' && herbsOk) {
      take('herbs', k.herbs); b.mombasa = 'medicine';
      await play([[null, '자흐라가 앞장섰다. 요새 성벽 아래 바다로 난 좁은 물길 — 스와힐리 어부들만 아는 길이다. 약재 꾸러미가 밧줄에 매달려 성벽 위로 올라갔다.'],
        ['zahra', md.lv ? '안에 계신 분들께 쓰는 법도 적어 올려 보냈어요. ' + md.who + '님이 알려 주신 대로요. …몇 명이라도 살 거예요.' : '안에 늙은 수사님이 계세요. 그분이라면 약재 쓰는 법을 아실 거예요. …몇 명이라도 살 거예요.'],
        ['zahra', '고마워요. 이제 이 섬에서 제가 할 일은 끝났어요. 노래를 들고 바다로 가고 싶어요. 리옹고도 끝내 바다 건너 이야기가 되었으니까요.']]);
      var so0 = fame('so', 150);
      log('몸바사 포위 속에서 시인 음와나 자흐라의 안내로 예수 요새에 약재 ' + k.herbs + '통을 들여보냈다. (사교 명성 +' + so0 + ')');
    } else {
      later('mombasa', 'leave');
      await play([['zahra', '…그래요. 그럼 이 노래 한 줄만 기억해 주세요. 「바다는 넓고, 노래는 그보다 넓다.」']]);
      log('포위된 몸바사에서 시인 음와나 자흐라의 부탁을 듣고도 떠났다.');
      refresh(); return true;
    }
    join('zahra', k.city); item('liongo_utenzi');
    UI.toast('음와나 자흐라가 동료가 되었다 — 역사학 3 · 웅변·항해술 2 · 『리옹고의 노래』', 'heart', 5200);
    refresh(); return true;
  };

  // ================================================================ 날마다 — 소식
  AF.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told;
    function news(key, icon, text) { if (!told[key] && t >= NEWS_AT[key]) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('kuba', 'crown', '【쿠바 왕국의 통합】 카사이 강 너머에서 샤암 왕이 서로 다른 말을 쓰던 무리들을 한 궁정 아래 모았다는 소문이다. 대장장이·조각가·직녀를 곁에 두고, 바다 사람들이 들여온 옥수수와 담배까지 심게 했다고 한다. 쿠바의 라피아 무늬 천은 그 뒤로 더욱 이름을 떨친다.');
    news('gondar', 'crown', '【곤다르】 에티오피아의 파실리다스 황제가 타나 호수 북쪽 곤다르에 돌로 성을 쌓고 도읍으로 삼았다. 떠돌던 황제의 궁정이 한곳에 머물고, 성과 교회가 잇달아 선다. 예수회 신부들은 이미 나라 밖으로 쫓겨났다.');
    news('cape', 'scroll', '【희망봉 보급기지】 네덜란드 동인도 회사의 얀 판리베크가 희망봉의 탁자 산 아래 보급기지를 세웠다. 바타비아로 오가는 배들에 물과 채소, 고기를 대기 위해서다. 코이코이 사람들에게서 소를 사들이기 시작한다.');
    news('khoiwar', 'skull', '【첫 코이코이 전쟁】 희망봉의 자유 시민들이 코이코이 사람들의 풀밭에 울타리를 치고 밭을 갈자, 코이코이 사람들이 소 떼를 끌고 가며 맞섰다. 보급기지와 원주민 사이의 첫 전쟁이다.');
    news('mbwila', 'skull', '【음빌라 전투】 콩고 왕국의 안토니우 1세가 음빌라에서 포르투갈 군과 싸우다 전사했다. 왕의 목은 루안다로 옮겨져 성당에 묻히고, 왕관은 리스본으로 보내졌다. 콩고에서는 왕위를 두고 다툼이 시작된다.');
    news('kongofall', 'skull', '【상살바도르의 몰락】 왕위 다툼 끝에 콩고 왕국의 도읍 상살바도르가 불타고 버려졌다. 여러 왕을 내세운 귀족 집안들이 저마다 땅을 나누어 다스린다.');
    return out;
  };

  // ================================================================ 도시에 들어설 때
  AF.pending = function () { var s = S(); if (!s || !s.loc || s.loc.mode !== 'city') return false; return gondarOpen() || capeOpen() || mbwilaOpen() || mombasaOpen(); };
  AF.check = async function () {
    if (AF._busy) return false; AF._busy = true;
    try {
      if (gondarOpen()) await AF.gondar();
      else if (capeOpen()) await AF.cape();
      else if (mbwilaOpen()) await AF.mbwila();
      else if (mombasaOpen()) await AF.mombasa();
    } catch (e) { console.error(e); }
    AF._busy = false;
    return true;
  };
  (function hookDaily() {
    var W = G.World; if (!W || W._afr17) return;
    W._afr17 = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(AF.daily()); } catch (e) { console.error(e); } return out; };
  })();
})(window.G = window.G || {});
