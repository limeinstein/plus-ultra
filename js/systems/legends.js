/* 전설 속 인물을 만나 부하로 맞는 일 (G.Legend) — 사람은 js/data/legends.js, 조정값은 G.BALANCE.legends
   ■ 도원의 세 형제 (유비·관우·장비)
     · 탁군 땅(zhuo 좌표 둘레 zhuoR도)을 밟으면 복숭아밭에서 만난다
     · 중국 도시 술집에서 한 번 들른 사이에 술을 drinks번 사면(술을 마신다·한턱 낸다) 그 술집에서 만난다
     · 만난 곳이 서로 다른 곳으로 meets번이 되면 형제가 함께 부하가 되기를 청한다. 명나라는 평화롭지만 새 세상을 보고 싶다고.
   ■ 제갈량 — 유비가 부관(first)일 때 여관에 innVisits번 들르면 여관에서 기다리고 있다가 부하가 되기를 청한다
   ■ 달타냥 — 프랑스 도시 시장에서 한 번 들른 사이에 물건을 dartBuys번 사면, 말 값이 모자란다며 금화 dartLoan닢을 빌려 달라고 한다. 빌려주면 부하가 된다
     ■ 삼총사 — 달타냥을 데리고 처음 가는 도시 술집에 들어설 때마다 아토스 → 포르토스 → 아라미스 차례로 한 사람이 결투를 걸어 온다(피할 수 없다).
       제독이나 달타냥이 이기면 그 사람이 부하가 된다. 지면 다음 새 도시에서 다시 온다.
   ■ 셰헤라자드 — 이슬람 도시 도서관에서 한 번 들른 사이에 서로 다른 책을 books권 읽으면(다시 읽은 책도 — 빨간 책은 못 읽으니 빼고) 다가와 부하가 되겠다고 한다
   ■ 알라딘·알리바바 — 셰헤라자드가 통역(interp)일 때 오스만 제국 도시 교역소 출자가 investLv등급이면 그 교역소에서 한 사람씩 만난다 (두 사람은 서로 다른 도시)
   · 저장: s.legend = {tao: {met: [자리]}, zhuge: {inn}, dart: {}, musk: {seen: [도시], lost: {id: 번}}, sche: {}, ott: {cities: []}}
   · 건물의 일(술·여관·서가·시장·교역소)은 그 건물 함수를 감싸서 본다 (install). 뭍은 js/scenes/land.js 가 G.Legend.onLand 를 부른다 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, LG = {};
  G.Legend = LG;
  function S() { return G.Game.state; }
  function C() { return G.Scenes.city; }
  function K() { return (G.BALANCE && G.BALANCE.legends) || {}; }
  function st() { var s = S(); var L = s.legend || (s.legend = {}); L.tao = L.tao || { met: [] }; L.zhuge = L.zhuge || { inn: 0 }; L.dart = L.dart || {}; L.musk = L.musk || { seen: [], lost: {} }; L.sche = L.sche || {}; L.ott = L.ott || { cities: [] }; return L; }
  LG.state = st;
  function row(id) { return S().mates.filter(function (x) { return x.id === id; })[0] || null; }
  LG.hired = function (id) { return !!row(id); };
  function gone(id) { return !!S().flags['gone_' + id]; }
  /** 이 사람의 말 (말이 서툴러도 뜻은 통한다 — 전설 속 사람이니까) */
  function who(id, emo) { var m = G.MATE[id]; return { name: m.name, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true, emotion: emo || null }; }   // special: 바다·뭍에서도 무릎상으로 마주 선다 (사건)
  LG.speaker = who;
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function cur() { return C() && C().current ? C().current() : null; }
  function say(id, text, emo) { return UI.say(text, who(id, emo)); }

  // ---------------------------------------------------------------- 어느 나라·어느 도시
  function owner(c) { return R.cityOwner ? R.cityOwner(c) : c.nation; }
  LG.isChina = function (c) { return !!c && (c.style === 'cn' || owner(c) === '명'); };
  LG.isFrance = function (c) { return !!c && owner(c) === '프랑스'; };
  LG.isIslam = function (c) { return !!c && c.rel === 'I'; };
  LG.isOttoman = function (c) { return !!c && owner(c) === '오스만 제국'; };

  /** 부하로 맞는다 — 고용 절차(js/city/tavern.js T.hireMate)처럼 빈 자리를 맡긴다. 말이 덜 통해도 마음은 처음부터 열려 있다 */
  function roleName(r) { if (r.role === 'captain') return '선장'; var d = G.ROLES.filter(function (x) { return x.id === r.role; })[0]; return d ? d.name : '대기'; }
  LG.join = function (id, c) {
    var s = S(), m = G.MATE[id]; if (!m || row(id)) return null;
    if (R.tidyCaptains) R.tidyCaptains();
    var role = G.ROLES.map(function (r) { return r.id; }).filter(function (rid) { return !s.mates.some(function (x) { return x.role === rid; }); })[0] || 'none';
    var nm = { id: id, role: role, joined: U.dateNum(s.date), loyal: K().loyal || 80, from: c ? c.id : (s.loc && s.loc.city != null ? s.loc.city : s.player.home) };
    if (role === 'none') { var free = s.fleet.ships.slice(1).filter(function (x) { return !R.captain(x); })[0]; if (free) { nm.role = 'captain'; nm.ship = free.uid; } }
    s.mates.push(nm);
    delete s.flags['gone_' + id];
    G.State.log(U.j(m.name, '이/가') + ' 동료가 되었다.');
    UI.toast(m.name + ' 동료가 되었다. (' + roleName(nm) + ')', 'people', 3600);
    if (G.Audio) G.Audio.sfx('discover');
    return nm;
  };
  /** 부하로 맞을지 묻는다 */
  function offer(ids, c, q) {
    var s = S(), wage = U.sum(ids, function (id) { return G.MATE[id].wage; });
    return UI.confirm((q || '') + (q ? '\n' : '') + ids.map(function (id) { return G.MATE[id].name; }).join('·') + U.jx(G.MATE[ids[ids.length - 1]].name, '을/를') + ' 부하로 맞이하겠습니까? (월급 금화 ' + U.num(wage) + '닢)', '부하로 맞이한다', '다음에').then(function (ok) {
      if (!ok) return false;
      ids.forEach(function (id) { LG.join(id, c); });
      return true;
    });
  }

  // ================================================================ 도원의 세 형제
  var BRO = ['liu_bei', 'guan_yu', 'zhang_fei'];
  function broReady() { return BRO.every(function (id) { return !row(id) && !gone(id); }) && !st().tao.done; }
  var TAO_LINES = [
    // 첫 만남
    [['zhang_fei', '어이, 거기 바다 냄새 나는 양반! 술을 이리 시원하게 사는 걸 보니 사내 중의 사내로군. 내 잔도 하나 받아 주게!'],
     ['guan_yu', '셋째야, 무례하다. ……실례했소. 나는 관우, 자는 운장이오. 이 덜렁이는 셋째 장비요.'],
     ['liu_bei', '유비, 자는 현덕이라 하오. 탁군에서 짚신을 삼던 사람이지요. 우리 셋은 복숭아밭에서 형제가 되기로 맹세한 사이요.'],
     ['P', '바다 건너 먼 나라에서 왔소. 세 분 같은 장부들이 어찌 술집을 떠돌고 있소?'],
     ['liu_bei', '대명의 천하는 지금 평화롭소. 칼을 들 일도, 백성이 굶어 쓰러질 일도 드물지요. 그것은 기쁜 일이오.'],
     ['guan_yu', '허나 평화로운 땅에 있으니 우리 칼이 녹스는 소리가 들리는구려. 형님은 저 바다 너머에 어떤 세상이 있는지 늘 궁금해하시오.'],
     ['zhang_fei', '하하! 또 만나세, 바다 양반! 다음엔 내가 사지. ……아니, 형님이 사실 거요!']],
    // 두 번째
    [['liu_bei', '또 만났구려! 하늘이 정한 인연이란 이런 것인가 보오.'],
     ['zhang_fei', '형님, 이 양반이 또 술을 샀소! 이 정도면 우리 넷째 아우로 삼아도 되지 않겠소?'],
     ['guan_yu', '셋째야. 남의 나라 장수를 아우로 삼다니…… 허나, 그 배에 실린 이야기를 더 듣고 싶은 것은 나도 마찬가지요.'],
     ['P', '바다에는 아직 아무도 본 적 없는 땅이 많소. 서쪽 끝에는 불타는 사막이, 남쪽 끝에는 얼음의 바다가 있다 하오.'],
     ['liu_bei', '……그런 세상을 내 눈으로 볼 수 있다면. 다음에 만날 때 우리 마음을 정해 두겠소.']],
    // 세 번째 — 부하가 되기를 청한다
    [['liu_bei', '세 번째 만남이오. 옛사람은 세 번 찾아가 사람을 얻었다지요. 이번에는 우리가 청하겠소.'],
     ['liu_bei', '명나라의 평화는 우리가 지키지 않아도 이어질 것이오. 허나 저 바다 너머 새 세상은 누군가 가서 보지 않으면 영영 모른 채 남겠지요.'],
     ['guan_yu', '이 관우, 청룡도를 노 대신 쥐더라도 제독의 배를 지키겠소. 의리를 저버리는 일은 없을 것이오.'],
     ['zhang_fei', '나는 술만 끊이지 않으면 되오! 하하하! ……아니, 진심이오. 바다의 적은 이 장팔사모로 모조리 쓸어 버리겠소!']]
  ];
  async function taoScene(c, where) {
    var T = st().tao, n = T.met.length, lines = TAO_LINES[Math.min(2, n)];
    T.met.push(where);
    for (var i = 0; i < lines.length; i++) { if (lines[i][0] === 'P') await UI.say(lines[i][1], me()); else await say(lines[i][0], lines[i][1]); }
    if (T.met.length < (K().meets || 3)) {
      UI.toast('도원의 세 형제를 만났다 (' + T.met.length + '/' + (K().meets || 3) + ') — 다른 곳에서 다시 만나면 마음을 정한다', 'people', 4500);
      return;
    }
    if (await offer(BRO, c, '세 형제가 함께 부하가 되기를 청한다.')) {
      T.done = 1;
      await say('liu_bei', '고맙소, 제독. 오늘부터 우리 셋의 목숨은 제독의 배와 함께하오.');
      await say('zhang_fei', '좋다! 오늘은 내가 산다! 주인장, 여기 술 한 동이!');
    } else {
      T.met.pop();   // 다음에 또 청한다 (같은 곳이라도)
      await say('liu_bei', '아직 때가 아니라면 기다리겠소. 우리는 이 땅 어딘가의 술집에 있을 것이오.');
    }
  }
  /** 중국 도시 술집에서 술을 샀다 */
  async function tavernBuy(c) {
    var cu = cur(); if (!cu || cu.kind !== 'tavern') return;
    cu.lgDrinks = (cu.lgDrinks || 0) + 1;
    if (!LG.isChina(c) || !broReady() || cu.lgTao || cu.lgDrinks < (K().drinks || 3)) return;
    if (st().tao.met.indexOf('c' + c.id) >= 0) return;          // 같은 도시에서는 한 번만
    cu.lgTao = 1;
    await UI.say('술잔이 세 번 돌자, 구석 자리의 세 사내가 잔을 들고 다가온다. 한 사람은 귀가 크고, 한 사람은 수염이 석 자, 한 사람은 고리눈이다.', {});
    await taoScene(c, 'c' + c.id);
  }
  /** 탁군 땅을 밟았다 (js/scenes/land.js 하루가 지날 때) */
  LG.onLand = async function (lon, lat) {
    var k = K(), T = st().tao;
    if (!broReady() || T.met.indexOf('zhuo') >= 0) return;
    if (G.Geo.dist(lon, lat, k.zhuoLon || 115.97, k.zhuoLat || 39.49) > (k.zhuoR || 0.45)) return;
    await UI.say('탁군 들판. 복숭아꽃이 흐드러진 밭 한가운데서 세 사내가 제사상을 차려 놓고 술잔을 나누고 있다.\f「한날한시에 태어나지는 못했으나, 한날한시에 죽기를 바라노라!」', {});
    await taoScene(null, 'zhuo');
  };

  // ================================================================ 제갈량
  async function innVisit(c) {
    var lb = row('liu_bei'), Z = st().zhuge;
    if (!lb || lb.role !== 'first' || row('zhuge_liang') || gone('zhuge_liang') || Z.done) return;
    Z.inn = (Z.inn || 0) + 1;
    var need = K().innVisits || 3;
    if (Z.inn === 1) { await say('liu_bei', '제독, 옛날에 나는 한 선비를 얻으려 초가집을 세 번 찾아갔소. 이 여관 저 여관을 다니다 보면 어쩌면…… 그런 사람의 소식이 들릴지도 모르오.'); return; }
    if (Z.inn < need) { await UI.say('여관 안주인: 「흰 깃털 부채를 든 선비 말인가요? 며칠 전에 머물다 가셨는데…… 별을 보러 지붕에 올라가 계시곤 했지요.」', {}); return; }
    Z.done = 1;
    await UI.say('여관 마루에 흰 옷의 선비가 깃털 부채를 부치며 앉아 있다. 탁자 위에는 바다의 해도가 펼쳐져 있고, 바람의 방향이 붉은 먹으로 적혀 있다.', {});
    await say('zhuge_liang', '현덕공께서 세 번이나 찾으셨으니, 이번에는 제가 찾아뵙는 것이 도리겠지요. 제갈량, 자는 공명이라 합니다.');
    await say('liu_bei', '공명! 그대가 어찌 여기에……!');
    await say('zhuge_liang', '천하삼분의 계책은 이제 쓸 데가 없습니다. 대명은 평화롭고, 제 부채는 바람만 기다리지요.\f헌데 제독과 주공께서 바다 끝까지 가신다기에 생각했습니다. 아무도 그린 적 없는 바다의 지도라면 제가 평생 그려 볼 만하다고.');
    await UI.say('주공의 뜻과 제독의 뜻이 같으니, 제 뜻도 거기 보태겠습니다.', who('zhuge_liang'));
    if (await offer(['zhuge_liang'], c, '제갈량이 스스로 부하가 되기를 청한다.')) await say('zhuge_liang', '남동풍이 필요하시면 언제든 말씀하십시오. ……농담입니다. 반쯤은.');
    else { Z.done = 0; Z.inn = need - 1; await say('zhuge_liang', '서두르지 않겠습니다. 다음 여관에서 또 뵙지요.'); }
  }

  // ================================================================ 달타냥과 삼총사
  async function marketBuy(c, n) {
    var cu = cur(), D = st().dart; if (!cu) return;
    cu.lgBuys = (cu.lgBuys || 0) + n;
    if (!LG.isFrance(c) || row('d_artagnan') || gone('d_artagnan') || D.done || cu.lgDart || cu.lgBuys < (K().dartBuys || 3)) return;
    cu.lgDart = 1;
    var s = S(), loan = K().dartLoan || 2000;
    await UI.say('물건을 세 번째 사 들고 돌아서는데, 노란 늙은 말의 고삐를 쥔 젊은이가 앞을 가로막는다.', {});
    await say('d_artagnan', '실례합니다, 나리! 그렇게 시원시원하게 물건을 사시는 걸 보니 마음이 넓은 분이 틀림없군요. 가스코뉴의 달타냥이라 합니다.');
    await say('d_artagnan', '파리에 올라와 총사대에 들어가려는데, 칼과 망토와 말을 새로 사야 해서요……. 아버지가 주신 돈은 길에서 다 떨어졌습니다.\f금화 ' + U.num(loan) + '닢만 빌려주실 수 있겠습니까? 가스코뉴 사람의 명예를 걸고 꼭 갚겠습니다!');
    var v = await UI.ask('달타냥에게 금화 ' + U.num(loan) + '닢을 빌려줄까?', [{ label: '빌려준다 (금화 ' + U.num(loan) + '닢)', value: 1, dis: s.player.gold < loan }, { label: '거절한다', value: 0 }], me());
    if (!v || s.player.gold < loan) {
      await say('d_artagnan', s.player.gold < loan ? '아, 나리 주머니도 가볍군요! 하하, 우리 둘 다 가스코뉴 사람 같습니다. 또 뵙지요!' : '그렇군요……. 아닙니다, 모르는 사람에게 큰돈을 청한 제가 경솔했습니다. 또 뵙지요!');
      return;
    }
    s.player.gold -= loan; D.lent = loan;
    if (G.Audio) G.Audio.sfx('coin');
    await say('d_artagnan', '……정말로 빌려주시는군요. 처음 보는 촌뜨기에게!\f나리, 이 은혜를 돈으로만 갚는다면 가스코뉴 사람이 아닙니다. 이 칼로 갚겠습니다. 나리의 배에 태워 주십시오!');
    if (await offer(['d_artagnan'], c, '달타냥이 부하가 되기를 청한다.')) {
      D.done = 1;
      st().musk.seen.push(c.id);
      await say('d_artagnan', '모두는 하나를 위하여, 하나는 모두를 위하여! ……아, 이건 제 친구들의 말인데, 언젠가 그 친구들도 소개해 드리지요.');
    } else await say('d_artagnan', '배에 오를 자리가 없다면 할 수 없지요. 빌린 돈은 언젠가 꼭 갚겠습니다!');
  }
  var MUSK = ['athos', 'porthos', 'aramis'];
  var MUSK_DUEL = {
    athos: { style: 'thrust', atk: 13, def: 6, open: '거기 당신. 방금 내 어깨를 치고도 사과 한마디 없군. ……달타냥? 자네가 이 사람 배에 탔다고? 그렇다면 더더욱 확인해야겠군. 칼을 뽑으시오.', win: '……훌륭하오. 오랜만에 피가 뜨거워졌소. 달타냥, 자네가 고른 사람이라면 나도 따르겠네.', lose: '아직 멀었소. 다음에 다시 보지.' },
    porthos: { style: 'bash', atk: 14, def: 5, open: '이봐! 내 어깨띠를 보고 웃었지? 이 금실 어깨띠를! 달타냥 녀석과 한패라고? 좋아, 둘 다 덤벼라!', win: '하하하! 졌다, 졌어! 이렇게 기분 좋게 져 본 건 처음이오. 배에 맛있는 것만 있다면 따라가지!', lose: '어떠냐, 이 포르토스의 팔 힘이! 다음에 또 오너라, 하하!' },
    aramis: { style: 'slash', atk: 12, def: 6, open: '실례합니다. 손수건을 떨어뜨리셨더군요……. 아, 아닙니까? 그럼 제가 오해를 했군요. 허나 이미 칼을 뽑았으니, 하느님께 용서를 빌며 한 판 겨룹시다.', win: '주여, 저를 이기게 하지 않으신 것도 뜻이 있으시겠지요. 두 형제가 탄 배라면, 저도 오르겠습니다.', lose: '기도할 시간을 드리지요. 다음 도시에서 다시 뵙겠습니다.' }
  };
  async function muskDuel(c) {
    var M = st().musk, dr = row('d_artagnan');
    if (!dr) return;
    var next = MUSK.filter(function (id) { return !row(id) && !gone(id); })[0];
    if (!next) return;
    if (M.seen.indexOf(c.id) >= 0) return;
    M.seen.push(c.id);
    var D = MUSK_DUEL[next], m = G.MATE[next];
    await UI.say('술집 문을 들어서자마자 푸른 망토의 총사 한 사람이 일어선다.', {});
    await say(next, D.open);
    await say('d_artagnan', next === 'athos' ? '아토스! 제독, 저 사람은 삼총사의 맏형입니다. 피할 수 없겠군요……. 제가 나설까요?' : next === 'porthos' ? '포르토스! 힘으로는 당할 사람이 없습니다. 제독, 제게 맡겨 주십시오!' : '아라미스! 기도서를 든 손이 칼을 쥐면 누구보다 빠릅니다. 조심하십시오!');
    var hurt = R.mateHurt && R.mateHurt(dr);
    var v = await UI.ask('결투를 피할 수 없다. 누가 나설까?', [{ label: '제독이 직접 맞선다', value: 1 }, { label: '달타냥에게 맡긴다', value: 2, dis: !!hurt }], Object.assign(me(), { cancel: false }));
    if (v === 2) await say('d_artagnan', '맡겨 주십시오! ' + m.name + ', 오늘은 내가 이긴다!');
    var res = await G.Games.duel({ name: m.name, portrait: G.Art.mateSpec(next), look: 'rival', str: m.st[0], atk: D.atk, def: D.def, skill: m.sk.sword || 2, mar: m.st[2], int: m.st[1], cha: m.st[3], style: D.style },
      v === 2 ? { mate: dr, place: 'tavern' } : { place: 'tavern' });
    if (res === 'win') {
      await say(next, D.win);
      LG.join(next, c);
      G.Fame.add('bt', 3);
      if (MUSK.every(function (id) { return row(id); })) {
        await say('d_artagnan', '아토스, 포르토스, 아라미스, 그리고 나! 제독, 이제 우리는 넷입니다. 모두는 하나를 위하여—');
        await UI.say('하나는 모두를 위하여!', who('porthos'));
      }
    } else {
      M.lost[next] = (M.lost[next] || 0) + 1;
      await say(next, D.lose);
      await say('d_artagnan', '괜찮습니다, 제독. 저 친구들은 또 나타납니다. 다음 도시에서는 꼭 이기지요!');
    }
  }

  // ================================================================ 셰헤라자드
  async function bookRead(c) {
    var cu = cur(), H = st().sche; if (!cu) return;
    cu.lgBooks = (cu.lgBooks || 0) + 1;
    if (!LG.isIslam(c) || row('scheherazade') || gone('scheherazade') || H.done || cu.lgSche || cu.lgBooks < (K().books || 5)) return;
    cu.lgSche = 1;
    await UI.say('다섯 번째 책을 덮자, 맞은편 서가 그늘에서 비단 너울을 쓴 여인이 웃음을 머금고 다가온다.', {});
    await say('scheherazade', '하루에 한 권씩, 다섯 권을 쉬지 않고 읽는 분은 오랜만에 보는군요. 저는 셰헤라자드. 천 하루 밤 동안 이야기를 하며 살아남은 사람이랍니다.');
    await say('scheherazade', '책 속의 이야기는 다 읽으셨지요? 그럼 아직 아무 책에도 쓰이지 않은 이야기는 어떠세요.\f저는 프랑크 사람들의 말도, 아랍과 페르시아의 말도, 바다 건너 아프리카의 말도 압니다. 당신의 배가 가는 곳마다 제가 말을 옮겨 드리지요.');
    await UI.say('……그 대신, 당신의 항해를 끝까지 이야기로 엮게 해 주세요. 끝나지 않는 이야기가 제일 좋거든요.', who('scheherazade'));
    if (await offer(['scheherazade'], c, '셰헤라자드가 부하가 되겠다고 한다.')) { H.done = 1; await say('scheherazade', '그럼 첫날 밤의 이야기를 시작할까요. 옛날 옛적, 바다를 건너온 한 제독이 있었는데……'); }
    else await say('scheherazade', '이야기는 기다림에서 더 맛있어지는 법이지요. 또 이 서가에서 뵈어요.');
  }

  // ================================================================ 알라딘·알리바바
  var OTT = [
    { id: 'aladdin', intro: '교역소 뒷방에 낡은 놋쇠 램프를 든 젊은이가 앉아 있다. 출자 장부에 적힌 제독의 이름을 보더니 벌떡 일어선다.',
      lines: ['당신이 이 교역소의 큰 출자자로군요! 저는 알라딘. 바그다드 뒷골목에서 왔습니다.', '셰헤라자드 누님! 누님이 이분 배에 계셨군요. 그럼 이야기가 빠르겠네요.', '이 램프요? 하하, 문지르지 마세요. 소원은 셋뿐이고 저는 벌써 둘을 썼거든요. 남은 하나는…… 넓은 바다를 보는 데 쓰고 싶습니다.'] },
    { id: 'ali_baba', intro: '교역소 창고에서 낙타 짐을 풀던 사내가 출자 장부를 넘겨보다 제독을 돌아본다. 허리에는 금화 자루가 묵직하다.',
      lines: ['이만큼 이 도시에 돈을 묻은 분이라면 보물이 어디 묻혔는지도 아시겠군요. 저는 알리바바라 합니다.', '셰헤라자드 아씨? 아씨께서 제 이야기를 퍼뜨리시는 바람에 도적들이 아직도 저를 찾습니다. 차라리 바다로 나가는 게 낫겠어요.', '「열려라 참깨」를 아는 사람이 하나쯤 있으면 쓸모가 있을 겁니다. 바위만이 아니라 굳게 닫힌 상인들의 금고도 열리거든요.'] }
  ];
  async function ottomanCheck(c) {
    var sr = row('scheherazade'), O = st().ott;
    if (!sr || sr.role !== 'interp' || !LG.isOttoman(c)) return;
    if (O.cities.indexOf(c.id) >= 0) return;                   // 한 도시에서는 한 사람
    if ((R.investLv ? R.investLv(c.id) : 0) < (K().investLv || 5)) return;
    var it = OTT.filter(function (o) { return !row(o.id) && !gone(o.id); })[0];
    if (!it) return;
    O.cities.push(c.id);
    await UI.say(it.intro, {});
    for (var i = 0; i < it.lines.length; i++) {
      if (i === 1) await say('scheherazade', it.id === 'aladdin' ? '알라딘! 램프는 아직 잘 있니? 제독, 이 아이 이야기는 제가 몇 밤이고 들려 드린 적이 있지요.' : '알리바바! 마흔 도적은 잘 따돌렸나요? 제독, 이분은 제 이야기 가운데 가장 운 좋은 사내랍니다.');
      await say(it.id, it.lines[i]);
    }
    if (await offer([it.id], c, G.MATE[it.id].name + U.jx(G.MATE[it.id].name, '이/가') + ' 부하가 되기를 청한다.')) await say(it.id, it.id === 'aladdin' ? '마지막 소원은 이걸로 됐습니다. 아니, 램프를 쓸 필요도 없었네요!' : '참깨! ……아, 그냥 기뻐서요.');
    else { O.cities.pop(); await say(it.id, '마음이 바뀌시면 이 교역소로 오세요.'); }
  }

  // ================================================================ 귀띔 (그 고장 사람들이 한 번씩 들려준다)
  async function hint(key, sp, text) {
    var s = S(); if (s.flags['lgHint_' + key]) return;
    s.flags['lgHint_' + key] = 1;
    await UI.say(text, sp);
  }

  // ================================================================ 건물 함수 감싸기
  function wrapAfter(obj, key, after) {
    var f = obj && obj[key]; if (typeof f !== 'function' || f._lg) return;
    var g = async function () {
      var ctx = { gold: S().player.gold, items: S().player.items.length, args: arguments };
      var r = await f.apply(this, arguments);
      try { await after.apply(this, [ctx].concat([].slice.call(arguments))); } catch (e) { console.error(e); }
      return r;
    };
    g._lg = true; obj[key] = g;
  }
  LG.install = function () {
    var CC = C(); if (!CC || !CC.B || LG._inst) return;
    LG._inst = true;
    var B = CC.B;
    // 술집: 술을 사면 / 들어서면(삼총사의 결투 · 세 형제 소문)
    // 산 술은 그 방문(C.current)의 drinks(술을 마신다)·treats(한턱 낸다)가 늘었는지로 본다 — 한턱 뒤의 결투 상금처럼 돈이 도로 늘어도 센다
    function sold(key, f) {
      var g0 = B.tavern[key]; if (typeof g0 !== 'function' || g0._lg) return;
      B.tavern[key] = async function (c) {
        var cu = cur(), n0 = cu ? (cu[f] || 0) : 0;
        var r = await g0.apply(this, arguments);
        try { if (cu && (cu[f] || 0) > n0 && cur() === cu) await tavernBuy(c); } catch (e) { console.error(e); }
        return r;
      };
      B.tavern[key]._lg = true;
    }
    sold('drink', 'drinks'); sold('treat', 'treats');
    wrapAfter(B.tavern, 'enter', async function (x, c) {
      if (cur() && cur().kind !== 'tavern') return;
      if (LG.isChina(c) && broReady()) await hint('tao', CC.npc('tavernkeeper', '술집 주인'), '요즘 이 고장 술집마다 세 사내가 돌아다닌다더군. 귀 큰 사내, 수염 긴 사내, 고리눈 사내. 탁군 복숭아밭에서 형제를 맺었다나.\f술을 시원하게 몇 잔 사는 손님한테는 저쪽에서 먼저 말을 건다지. 탁군은 북경에서 남서쪽으로 뭍길 하루 남짓일세.');
      if (LG.isFrance(c) && !row('d_artagnan') && !st().dart.done) await hint('dart', CC.npc('tavernkeeper', '술집 주인'), '가스코뉴에서 올라온 촌뜨기 하나가 노란 말을 끌고 시장을 기웃거리더군. 물건을 잔뜩 사는 손님만 보면 눈을 반짝인다지 뭔가.');
      await muskDuel(c);
    });
    // 여관: 들를 때마다 (제갈량)
    wrapAfter(B.inn, 'enter', function (x, c) { return innVisit(c); });
    // 시장: 물건을 산 만큼 (달타냥)
    wrapAfter(B.market, 'buy', function (x, c) { var n = Math.max(0, S().player.items.length - x.items); if (n > 0) return marketBuy(c, n); });
    // 도서관: 새로 읽은 책 (셰헤라자드)
    if (B.library) {
      var pick0 = B.library.pick;
      if (typeof pick0 === 'function' && !pick0._lg) {
        B.library.pick = async function (c, b) {
          var k = B.library.shelfState ? B.library.shelfState(b).kind : 'open';
          var r = await pick0.apply(this, arguments);
          // 읽은 책: 새로 읽은 것·다시 읽은 것 모두 (못 읽는 빨간 책은 빼고) — 한 번 들른 사이에 서로 다른 책으로 센다
          var cu = cur();
          if (k !== 'lock' && cu && b && !(cu.lgBookIds = cu.lgBookIds || {})[b.id]) { cu.lgBookIds[b.id] = 1; try { await bookRead(c); } catch (e) { console.error(e); } }
          return r;
        };
        B.library.pick._lg = true;
      }
      wrapAfter(B.library, 'enter', function (x, c) {
        if (LG.isIslam(c) && !row('scheherazade') && !st().sche.done) return hint('sche', CC.npc('librarian', '사서'), '요즘 밤마다 이야기를 들려주는 여인이 서가에 들르지요. 책을 쉬지 않고 여러 권 읽는 손님이 있으면 슬그머니 다가온다더군요.');
      });
    }
    // 교역소: 들어서거나 출자한 뒤 (알라딘·알리바바)
    wrapAfter(B.trade, 'enter', function (x, c) {
      if (LG.isOttoman(c) && row('scheherazade') && !st().ott.hinted) { st().ott.hinted = 1; return say('scheherazade', '제독, 이 도시 교역소에 큰돈을 맡긴 출자자에게는 이상한 손님들이 찾아온다는 이야기가 있어요. 램프를 든 젊은이라든가, 바위 문을 여는 사내라든가…… 제가 옆에서 말을 옮겨 드리면 더 반가워할 거예요.').then(function () { return ottomanCheck(c); }); }
      return ottomanCheck(c);
    });
    wrapAfter(B.trade, 'invest', function (x, c) { return ottomanCheck(c); });
  };
  LG._t = { tavernBuy: tavernBuy, innVisit: innVisit, marketBuy: marketBuy, bookRead: bookRead, ottomanCheck: ottomanCheck, muskDuel: muskDuel };   // 시험용
  // 도시 건물 스크립트(js/city/*.js)는 이 파일보다 먼저 읽힌다
  LG.install();
})(window.G = window.G || {});
