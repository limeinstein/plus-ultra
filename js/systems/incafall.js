/* 잉카 제국의 멸망 — 태양의 아들들 (G.IncaFall) 2026-10-19 사용자 요청 「잉카 제국 멸망 시나리오 (대항해시대3 참고)」
   대항해시대 3은 잉카의 멸망을 이야기 사건으로 보여 주고, 쏟아져 들어온 금은이 값을 흔드는 「가격혁명」으로 이었다.
   여기서는 제독이 그 한가운데에 서 본다 — 정복자의 동업자로, 혹은 무너지는 제국의 벗으로. 역사는 바뀌지 않는다. 바뀌는 것은 제독이 무엇을 보았고 누구 곁에 섰는가다.
   ■ 흐름 (사람: js/data/incafall.js)
     ① 파나마의 세 동업자 (1524~1532년 10월, 파나마): 피사로·알마그로·루케 신부의 「레반테 회사」. 날짜에 따라 굶주림의 항구 · 갈로 섬의 선 · 툼베스의 황금 ·
        톨레도 협약 · 알마그로의 증원대 이야기가 나온다. 금화 3,000닢을 대면 동업자가 된다 (사양하면 이 줄은 끝나지만 ③④는 누구나 겪는다).
     ② 카하마르카 (동업자만, 툼베스·찬찬): 1532년 4~7월이면 내전으로 무너진 툼베스 / 8월~11월 16일이면 카하마르카의 매복 —
        (가) 피사로의 계획대로 광장 둘레에 숨는다 (나) 아타우알파에게 몰래 알린다 (다) 성 밖에서 지켜본다. 어느 쪽이든 황제는 사로잡힌다.
        이어서 몸값의 방 (1532년 11월~1533년 7월 25일): (가) 몫을 받는다 (나) 데 소토와 함께 황제의 목숨을 탄원한다 (몫은 절반, 아타우알파의 키푸를 받는다).
     ③ 쿠스코 입성 (1533년 11월 15일~1535년, 쿠스코 — 누구나): 벗겨지는 코리칸차의 황금, 금 정원, 꼭두각시로 세워진 망코 잉카.
     ④ 망코의 반란 (1536년 5월~1537년 4월, 쿠스코·리마 — 누구나): (가) 에스파냐 편에서 싸운다 (삭사이와만 / 리마) (나) 망코 편에 선다 — 올란타이탐보에서
        에르난도 피사로의 기병대를 막고, 빌카밤바로 가는 길을 듣는다 (다) 물러난다.
     ⑤ 마지막 잉카 (1572년 9~12월, 쿠스코 — 잉카의 벗만): 투팍 아마루의 처형.
     소식: 아타우알파의 처형(1533.7.26) · 잉카의 황금이 세비야에 — 금값이 떨어진다(1534.1, 시장 사건 incagold) · 빌카밤바(1537) · 피사로의 죽음(1541.6.26) ·
           포토시 은광(1545, 가격혁명) · 투팍 아마루(1572.9.24)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/inca_*.webp — images/legend-events/INCA_PROMPT.md
   ■ 저장: s.incaFall = { side: 'partner'|'declined', met, friend, tumbes, caja: 'ambush'|'warn'|'watch'|'late', ransom: 'take'|'plead'|'missed',
                          cusco: 'loot'|'manco'|'leave', siege: 'spain'|'manco'|'leave', siegeRes, tupac, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var IF = G.IncaFall = {};
  function S() { return G.Game && G.Game.state; }
  function st() {
    var s = S(); if (!s) return null;
    if (!s.incaFall) {
      s.incaFall = {};
      // 옛 저장(1534년 뒤)을 불러오면 잉카의 황금(금값 폭락)이 엉뚱한 해에 시작되던 것 — 이미 지난 일은 알린 것으로 친다 (QA 2026-10-23)
      if (U.dateNum(s.date) > K.goldAt) s.incaFall.told = { gold: 1 };
    }
    return s.incaFall;
  }
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l) continue; await UI.say(l[1], l[0] === 'P' ? me() : l[0] ? H(l[0]) : {}); }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  var PANAMA = 210, TUMBES = 220, CHANCHAN = 221, LIMA = 222, CUSCO = 223, SEVILLE = 7;
  var K = IF.K = {
    invest: 3000, share: 15000, loot: 4000, siegeGold: 5000,
    partnerFrom: 15240101, partnerTo: 15321015,
    tumbesFrom: 15320401, ambushFrom: 15320801, capture: 15321116, ransomTo: 15330725,
    cuscoFrom: 15331115, cuscoTo: 15351231, siegeFrom: 15360501, siegeTo: 15370430, tupacFrom: 15720901, tupacTo: 15721231,
    notoAmbush: 6, notoTake: 4, notoLoot: 3, goldAt: 15340109
  };
  // 잉카의 황금이 세비야로 — 금이 흔해진다 (대항해시대 3의 가격혁명). 시장 사건으로 일으킨다 (js/systems/economy.js)
  var GOLD_EV = { id: 'incagold', name: '잉카의 황금', scope: 'area', r: 6, regions: [0, 1, 2], need: 'big', years: [9999, 9999], dur: [150, 220], lead: [0, 0], glut: true,
    goods: { gold: 0.62, silver: 0.85, jewel: 0.9 },
    why: ['{place}에 잉카 황제의 몸값을 녹인 금괴가 쏟아져 들어와 금이 흔해졌다', '{place} 조폐소에 페루의 금이 넘쳐 금값이 떨어지고 다른 물건 값이 들썩인다'] };
  if (G.Econ && G.Econ.DEF && !G.Econ.DEF.incagold) G.Econ.DEF.incagold = GOLD_EV;

  function crownTrust(n) {
    if (!G.Sponsor || !G.SPONSOR) return;
    ['es_crown', 'es_peru', 'es_panama'].forEach(function (id) { if (G.SPONSOR[id]) { var r = G.Sponsor.rel(id); if (r.met || n < 0) G.Sponsor.addTrust(r, n); } });
  }
  function notoriety(n, why) {
    var p = S().player; p.notoriety = (p.notoriety || 0) + n;
    UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200);
  }
  function keepsake(id, name, desc) {
    var p = S().player; if (p.items.some(function (x) { return x.id === id; })) return;
    p.items.push({ id: id, kind: 'keepsake', name: name, desc: desc });
  }
  function hint(id) { if (G.Disc && G.DISC && G.DISC[id] && !G.Disc.foundByMe(id) && G.Disc.addHint) G.Disc.addHint(id, 'lead:incafall'); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }

  // ================================================================ 날마다 — 소식
  IF.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told || (b.told = {}), part = b.side === 'partner', met = !!(b.met || part);
    function news(key, when, ok, icon, text) { if (!told[key] && t >= when && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    if (part && !b.ransom && t > K.ransomTo) {
      b.ransom = 'missed';
      out.push({ icon: 'scroll', text: '카하마르카의 일은 제독 없이 끝났다. 몸값의 금은 원정대가 나누어 가졌고, 레반테 회사에 댄 금화는 알마그로의 장부에 「오지 않은 동업자」로 남았다.' });
    }
    news('capture', K.capture, part && !b.caja, 'cannon', '【카하마르카】 피사로의 원정대가 안데스의 도시 카하마르카에서 잉카 황제 아타우알파를 사로잡았다. 황제는 방 하나를 황금으로 채워 몸값으로 내겠다고 했다 한다. (툼베스·찬찬으로 — 1533년 7월까지)');
    news('execute', 15330726, met, 'skull', b.ransom === 'plead'
      ? '【아타우알파의 죽음】 카하마르카 광장에서 아타우알파가 교수형을 당했다. 방 하나를 황금으로 채우고도 목숨을 사지 못했다. 데 소토가 돌아와 그런 군대는 없었다고 피사로에게 소리쳤다 한다. …품속의 키푸 매듭이 무겁다.'
      : '【아타우알파의 죽음】 카하마르카 광장에서 잉카 황제 아타우알파가 교수형을 당했다. 세례를 받고 「프란시스코」라는 이름을 얻은 덕에 화형만은 면했다고 한다.');
    if (!told.gold && t >= K.goldAt) {
      told.gold = 1;
      if (G.Econ && G.Econ.start && G.Econ.DEF && G.Econ.DEF.incagold) { try { var e = G.Econ.start('incagold', SEVILLE, { k: 1 }); if (e) e.told = 'on'; } catch (er) { console.error(er); } }
      out.push({ icon: 'coin', history: true, text: '【잉카의 황금】 에르난도 피사로가 국왕의 몫(오분의 일)을 싣고 세비야에 들어왔다. 녹인 금괴가 산처럼 쌓여, 이베리아와 둘레의 큰 도시들에서 금값이 뚝 떨어진다. 사람들은 처음으로 「금이 흔한 세상」을 본다.' });
    }
    news('vilca', 15370801, met, 'scroll', '【빌카밤바】 망코 잉카가 쿠스코를 되찾지 못하고 아마존 숲 가장자리의 산속 빌카밤바로 물러났다. 「네 지방의 나라」는 이제 그 산골짜기에만 남았다.');
    news('pizarro', 15410626, met, 'skull', part
      ? '【피사로의 죽음】 리마의 총독 관저에서 알마그로의 아들 무리가 프란시스코 피사로를 칼로 찔렀다. 늙은 정복자는 제 피로 바닥에 십자가를 그리고 숨을 거두었다 한다. 파나마의 세 동업자는 이제 아무도 남지 않았다.'
      : '【피사로의 죽음】 리마의 총독 관저에서 알마그로의 아들 무리가 정복자 프란시스코 피사로를 살해했다.');
    news('potosi', 15450601, met, 'coin', '【포토시】 페루의 높은 산(지금의 볼리비아)에서 온통 은으로 된 산 「세로 리코」가 발견되었다. 앞으로 백 년, 이 은이 세비야로 흘러들어 유럽의 값을 모조리 끌어올릴 것이다 — 가격혁명이다.');
    news('tupac', 15720924, met && !b.tupac, 'skull', '【마지막 잉카】 부왕 톨레도가 빌카밤바를 쳐서 투팍 아마루를 사로잡아 쿠스코 광장에서 목을 베었다. 잉카 황제의 핏줄은 여기서 끊겼다.');
    return out;
  };

  // ================================================================ ① 파나마의 세 동업자 (1524~1532)
  function panamaOpen() { var b = st(), t = today(); return !!(b && !b.side && cityNow() === PANAMA && t >= K.partnerFrom && t <= K.partnerTo); }
  async function panama() {
    var b = st(), s = S(), t = today(); b.met = 1;
    if (t < 15270101) await play([
      [null, '파나마의 부둣가. 낡은 배 두 척 앞에서 세 사내가 말다툼을 하고 있다 — 깡마른 늙은 군인, 한쪽 눈에 안대를 한 땅딸막한 사내, 장부를 든 신부.'],
      ['almagro', '프란시스코, 이 눈을 보게. 남쪽 해안의 불탄 요새에서 원주민 화살에 잃은 눈이야. 그런데도 우린 아직 금 한 줌 못 봤어!'],
      ['pizarro', '…굶주림의 항구에서 서른 명을 묻었다. 맹그로브 뿌리를 씹고 버텼지. 그래도 남쪽 원주민들은 똑같은 말을 한다. 산 너머에 「비루」라는 나라가 있다고. 그 나라 왕은 금 그릇으로 물을 마신다고.'],
      ['luque', '두 분, 그만하시오. 내가 이 원정에 넣은 돈이 얼마인지 아시오? …그런데 제독, 그대는 바다를 아는 사람이구려. 남쪽 바다를 한번 같이 보지 않겠소?']
    ]);
    else if (t < 15281001) await withPic('inca_gallo_line', '갈로 섬의 선 (1527)', function () { return play([
      [null, '파나마의 부둣가. 남쪽 바다에서 막 돌아온 배에서 햇볕에 그을린 사내들이 내린다. 그들 사이에 라마 몇 마리와 금 그릇을 든 원주민 소년들이 있다.'],
      ['luque', '제독, 이 사람들 이야기를 들어 보시오. 총독은 원정을 그만두라고 배를 보내 이들을 데려오라 했는데….'],
      ['pizarro', '갈로 섬이었다. 총독의 배가 와서 다들 집에 가자고 했지. 나는 칼끝으로 모래에 선을 그었다.'],
      ['pizarro', '「이쪽은 페루로 가서 부자가 되는 길이고, 저쪽은 파나마로 돌아가 가난해지는 길이다. 좋은 카스티야 사람이라면 어느 쪽이 나은지 고르라.」 …열세 명이 선을 넘어왔다.'],
      ['felipillo', '(서툰 카스티야 말로) 툼베스. 내 고향. 큰 집, 돌로 지은 집. 태양의 집에는 금. 길에는 라마. 잉카의 길은 산을 넘어 끝이 없어요.'],
      ['pizarro', '보았다. 툼베스에서. 신전의 벽이 금이었다. 이번에는 거기서 멈추지 않는다.']
    ]); });
    else if (t < 15300201) await play([
      [null, '파나마의 작은 성당 곁. 안대를 한 사내와 신부가 장부를 펼쳐 놓고 있다. 늙은 군인은 보이지 않는다.'],
      ['almagro', '프란시스코는 에스파냐에 갔소. 황제 폐하께 직접 아뢰러. 이 총독 놈은 우리를 믿지 않으니 위에서 허가장을 받아 와야지.'],
      ['luque', '돌아오면 세 번째 원정이오. 이번에는 배도 사람도 말도 더 필요하오. 제독, 그대 같은 사람이 동업자로 들어온다면 내 장부가 한결 가벼워지겠소.']
    ]);
    else if (t < 15301227) await play([
      [null, '파나마의 부둣가에 말이 서른 마리 넘게 내려진다. 늙은 군인 곁에 덩치 큰 젊은이들이 서 있다 — 그가 고향 트루히요에서 데려온 아우들이다.'],
      ['pizarro', '톨레도에서 왕비 폐하께서 협약에 서명하셨다. 나는 「누에바 카스티야」의 총독이자 대장이다. 이 녀석은 내 아우 에르난도.'],
      ['hpizarro', '형님 말로는 바다를 안다는 제독이시라고. 우리 피사로 집안은 바다는 몰라도 칼은 알지.'],
      ['almagro', '(씁쓸하게) 총독은 프란시스코, 나는 툼베스 요새의 대장이라나. …뭐, 금만 나오면 그만이지. 제독, 연말에 떠나오.']
    ]);
    else await play([
      [null, '파나마의 부둣가. 안대를 한 사내가 새로 모은 병사들과 말을 배에 싣느라 고함을 지르고 있다.'],
      ['almagro', '프란시스코는 벌써 남쪽으로 떠났소. 백팔십 명에 말 서른일곱 마리. 나는 증원대를 모아 뒤따라가오.'],
      ['almagro', '들리는 말로는 잉카 사람들끼리 큰 싸움이 붙었다더군. 늙은 황제가 죽고 두 아들이 나라를 나눠 싸운다고. …때를 잘 만난 거요.'],
      ['luque', '제독, 원정은 이미 시작되었소. 지금이라도 회사에 들어온다면 몫은 똑같이 나누겠소.']
    ]);
    await play([['luque', '「레반테 회사」 — 우리 셋이 남쪽 바다의 일을 함께하기로 한 약정이오. 금화 ' + U.num(K.invest) + '닢을 대면 그대도 동업자로 장부에 올리겠소. 남쪽에서 무엇이 나오든 몫을 나누지.']]);
    var opts = [];
    if (s.player.gold >= K.invest) opts.push({ label: '금화 ' + U.num(K.invest) + '닢을 대고 동업자가 된다', value: 'yes' });
    opts.push({ label: '남의 나라를 칼로 찾아가는 일에는 끼지 않겠다 — 사양한다', value: 'no' });
    var v = await UI.ask('피사로·알마그로·루케 신부가 남쪽 「비루」 원정의 동업자가 되어 달라고 한다. (소지금 ' + U.num(s.player.gold) + '닢)', opts, H('luque'));
    if (v !== 'yes' || s.player.gold < K.invest) {
      b.side = 'declined';
      await play([['almagro', '허허, 겁이 많으시구려. 나중에 금이 산처럼 쌓인 걸 보고 배 아파하지 마시오.']]);
      G.State.log('파나마에서 피사로·알마그로·루케 신부의 남쪽 원정에 들어오라는 청을 사양했다.');
      return;
    }
    s.player.gold -= K.invest; b.side = 'partner'; b.joined = t;
    await play([
      ['luque', '(장부에 이름을 적으며) 하느님과 성모님 앞에서, 그대는 이제 우리 동업자요.'],
      [t < 15301227 ? 'pizarro' : 'almagro', t < 15301227 ? '좋다. 우리는 툼베스로 간다. 내년 이맘때쯤 툼베스나 찬찬 앞바다로 오라. 거기서 산으로 오른다.' : '좋소! 프란시스코는 툼베스 쪽에 있을 거요. 1532년 안에 툼베스나 찬찬으로 가시오. 거기서 산으로 오르는 길을 찾을 거요.']
    ]);
    hint('inca');
    G.State.log('파나마에서 피사로·알마그로·루케 신부의 「레반테 회사」에 금화 ' + U.num(K.invest) + '닢을 대고 동업자가 되었다.');
    UI.toast('레반테 회사의 동업자 — 1532년 툼베스·찬찬으로', 'scroll', 6000);
    refresh();
  }

  // ================================================================ ② 툼베스 · 카하마르카 (1532~1533)
  function tumbesOpen() {
    var b = st(), t = today(), c = cityNow();
    if (!b || b.side !== 'partner' || b.ransom || (c !== TUMBES && c !== CHANCHAN)) return false;
    if (t < K.tumbesFrom || t > K.ransomTo) return false;
    return !(b.tumbes && t < K.ambushFrom);
  }
  async function tumbes() {
    var b = st(), t = today();
    if (t < K.ambushFrom) {
      b.tumbes = 1;
      await play([
        [null, '툼베스. 펠리피요가 말하던 돌 집과 태양의 집은 무너지고 불에 그을려 있다. 거리는 텅 비었다.'],
        ['felipillo', '…없어요. 다 없어요. 잉카의 두 아들이 싸웠어요. 아타우알파의 군대가 지나갔어요. 사람들이 산으로 도망갔어요.'],
        ['pizarro', '왔군, 동업자. 보다시피 금은 없다. 대신 좋은 소식이 있지 — 이 나라는 둘로 갈라져 서로 죽이고 있다. 아타우알파라는 아들이 이겼고, 지금 산속 카하마르카에 있다더군.'],
        ['pizarro', '우리는 해안에 산미겔이라는 도시를 세우고 있다. 여름이 끝나면(8월 지나서) 산으로 오른다. 그때 다시 오라.']
      ]);
      G.State.log('툼베스에서 내전으로 무너진 도시와 피사로의 원정대를 보았다. 8월이 지나면 산으로 오른다고 한다.');
      UI.toast('카하마르카 원정 — 1532년 8월~11월 중순에 툼베스·찬찬으로', 'scroll', 5000);
      return;
    }
    if (t <= K.capture) await ambush();
    else { b.caja = 'late'; await play([['almagro', '이제야 왔구려, 동업자! 나도 방금 증원대를 끌고 도착했소. 놀라지 마시오 — 프란시스코가 잉카의 황제를 사로잡았다오. 카하마르카로 올라갑시다.']]); }
    await ransom();
  }
  async function ambush() {
    var b = st();
    await play([
      [null, '안데스를 오르는 길. 산허리에 계단처럼 깎은 밭, 줄에 매단 풀 다리, 길가마다 돌로 지은 창고. 잉카의 길은 정말로 끝이 없다.'],
      [null, '1532년 11월 15일, 카하마르카. 도시는 텅 비어 있고, 골짜기 건너편 온천 둘레에 하얀 천막이 산비탈을 덮었다. 수만의 군사다.'],
      ['desoto', '(말에서 내리며) 황제를 만나고 왔소. 내가 말을 몰아 코앞까지 달려갔는데, 눈썹 하나 까딱하지 않더군. 내일 광장으로 오겠다 하오.'],
      ['hpizarro', '병사 놈들 중에 무서워서 바지에 오줌을 지린 놈이 한둘이 아니오. 저 천막 수를 보시오.'],
      ['pizarro', '…멕시코의 코르테스는 목테수마를 붙잡아 나라를 얻었다. 우리도 그렇게 한다. 광장 둘레의 긴 집들에 기병과 보병을 숨긴다. 칸디아의 대포는 탑 위에. 「산티아고!」 소리가 나면 모두 뛰쳐나간다.'],
      ['pizarro', '동업자. 그대도 그대 사람들을 데리고 한 집을 맡아라.']
    ]);
    var v = await UI.ask('내일 광장에서 잉카 황제를 덮친다. 제독은 어떻게 하겠는가?', [
      { label: '피사로의 계획대로 광장 둘레에 숨는다', value: 'ambush' },
      { label: '밤에 몰래 황제의 진영에 사람을 보내 함정을 알린다', value: 'warn' },
      { label: '끼지 않는다 — 성 밖 언덕에서 지켜본다', value: 'watch' }], me());
    b.caja = v || 'watch';
    if (b.caja === 'warn') await play([
      [null, '밤. 제독이 보낸 사람이 돌아왔다. 황제의 진영까지 닿기는 했다고 한다.'],
      ['atahualpa', '(전갈로 돌아온 말) 수염 난 자들이 백육십. 내 땅에서, 내 군사 앞에서. 나는 그들의 말을 빼앗고, 그들을 내 종으로 부릴 것이다. 이방의 손님이 걱정할 일이 아니다.'],
      ['felipillo', '(제독 곁에서 낮게) …황제는 안 믿어요. 우리를 너무 작게 봐요. 그리고 나리, 이 일을 총독이 알면 큰일 나요.']
    ]);
    await withPic('inca_cajamarca', '카하마르카 광장 (1532.11.16)', function () { return play([
      [null, '11월 16일 해 질 무렵. 수천의 사람이 노래를 부르며 광장으로 들어온다. 맨 앞에서 길을 쓰는 사람들, 그 뒤로 금은으로 꾸민 가마. 가마 위의 사람은 움직이지 않는다.'],
      ['valverde', '(기도서를 들고 앞으로 나서서) 나는 하느님의 사제요. 이 책에 하느님의 말씀이 있소. 교황께서 이 땅을 우리 황제 폐하께 주셨으니, 그대는 신앙을 받아들이고 폐하의 신하가 되시오.'],
      ['felipillo', '(통역하다가 말을 더듬는다) …책… 하느님… 황제의 신하….'],
      ['atahualpa', '(책을 받아 펼쳐 귀에 대 보고) 이것은 아무 말도 하지 않는다. (책을 땅에 던진다) 너희가 내 땅에서 빼앗은 것을 모두 돌려놓기 전에는 나는 여기서 움직이지 않겠다.'],
      ['valverde', '나오시오, 기독교도들이여! 하느님의 말씀이 땅에 던져졌소!'],
      ['pizarro', '산티아고!']
    ]); });
    await play([
      [null, '대포가 울리고, 방울을 단 말들이 집 안에서 쏟아져 나왔다. 무기를 들지 않은 행렬은 달아날 곳이 없었다. 광장의 담이 무너질 만큼 사람들이 밀려났다.'],
      [null, '가마를 멘 사람들은 손이 잘려도 어깨로 가마를 받쳤다. 피사로가 맨손으로 황제의 팔을 붙잡았다. 황제를 치려던 칼을 막다가 피사로의 손이 베였다 — 그날 다친 에스파냐 사람은 그 하나뿐이었다.'],
      [null, b.caja === 'watch' ? '언덕 위에서 제독은 해가 지는 것을 보았다. 광장에서 들려오던 소리가 그쳤을 때, 사파 잉카는 피사로의 포로였다.' : b.caja === 'warn' ? '제독의 전갈은 아무것도 바꾸지 못했다. 사파 잉카는 피사로의 포로가 되었다.' : '제독의 사람들도 그 광장에 있었다. 해가 졌을 때, 사파 잉카는 피사로의 포로였다.']
    ]);
    if (b.caja === 'ambush') { G.Fame.add('bt', 60); crownTrust(5); notoriety(K.notoAmbush, '카하마르카 광장의 학살에 함께했다'); }
    else if (b.caja === 'warn') { b.friend = 1; G.Fame.add('so', 40); }
    else G.Fame.add('so', 20);
    G.State.log(b.caja === 'ambush' ? '카하마르카 광장에서 피사로의 매복에 함께했다. 잉카 황제 아타우알파가 사로잡혔다.' : b.caja === 'warn' ? '카하마르카에서 아타우알파에게 몰래 함정을 알렸지만, 황제는 믿지 않았다. 아타우알파가 사로잡혔다.' : '카하마르카 성 밖 언덕에서 잉카 황제 아타우알파가 사로잡히는 것을 지켜보았다.');
  }
  async function ransom() {
    var b = st(), s = S();
    await withPic('inca_ransom_room', '몸값의 방 (1533)', function () { return play([
      [null, '카하마르카, 황제가 갇힌 돌집. 아타우알파가 손을 뻗어 벽에 금을 긋는다 — 그 손이 닿는 높이까지.'],
      ['atahualpa', '이 방을 이 금까지 황금으로 채우겠다. 옆방은 두 번, 은으로. 두 달을 다오.'],
      [null, '그날부터 라마 떼와 짐꾼들이 나라의 네 지방에서 금을 지고 왔다. 신전의 벽에서 떼어 낸 금판, 금 항아리, 금 옥수수, 금 라마…. 방은 차올랐다.'],
      ['atahualpa', '(장기판 앞에서 말을 옮기며) 수염 난 자들의 놀이는 재미있구나. …그대가 바다를 건너온 사람인가. 바다 끝에는 무엇이 있지? 거기에도 태양이 뜨나?'],
      [null, '그사이 쿠스코 쪽에서 소식이 왔다. 갇혀 있던 황제의 형 와스카르가 강가에서 죽었다. 사람들은 아타우알파의 명령이었다고 수군거렸다.'],
      ['almagro', '나와 내 증원대도 몫을 받아야 하오! 금이 방에 들어온 뒤에 왔다고? 우리가 없었으면 이 산꼭대기에서 버틸 수 있었을 것 같소?'],
      [null, '봄이 되자 대장간에 불이 들어왔다. 잉카의 장인들이 수백 년 두드려 만든 것들이 녹아 똑같은 금괴가 되어 나왔다. 국왕의 몫 오분의 일을 떼고, 나머지를 나눈다.'],
      ['pizarro', '동업자, 그대의 몫이다. 회사 장부대로.']
    ]); });
    var v = await UI.ask('몸값의 금을 나눈다. 그런데 원정대 안에서는 「황제의 장군들이 군대를 모아 온다, 황제를 살려 두면 위험하다」는 말이 돈다.', [
      { label: '몫을 받는다 (금화 ' + U.num(K.share) + '닢)', value: 'take' },
      { label: '데 소토와 함께 황제의 목숨을 탄원한다 (몫은 절반)', value: 'plead' }], me());
    b.ransom = v === 'plead' ? 'plead' : 'take';
    if (b.ransom === 'plead') {
      await play([
        ['desoto', '총독, 황제는 몸값을 다 냈소. 약속을 지켜야 하오. 장군들의 군대가 온다는 말이 정말인지 내가 직접 말을 몰고 가 보겠소. 내가 돌아올 때까지만 기다리시오.'],
        ['P', '저도 같은 생각입니다. 황제를 에스파냐로 보내 폐하께서 판단하시게 하십시오.'],
        ['pizarro', '…데 소토, 가서 보고 오게. 동업자, 그대는 금을 반만 받겠다는 거로군. 좋을 대로.'],
        [null, '그날 밤, 갇힌 황제가 제독을 불렀다. 그의 손에 색색의 매듭을 지은 실 꾸러미가 들려 있다.'],
        ['atahualpa', '키푸다. 우리는 글 대신 매듭으로 셈하고 기록한다. 이것은 내가 다스린 땅의 창고와 길과 사람을 센 것이다. …수염 난 자들은 이것을 읽지 못한다. 그대가 가져가라.'],
        ['atahualpa', '내 아버지의 나라는 넓었다. 그대가 그 끝까지 가 보거든, 거기 무엇이 있었는지 기억해 다오.']
      ]);
      b.friend = 1;
      keepsake('atahualpa_quipu', '아타우알파의 키푸', '갇힌 잉카 황제가 건넨 색색의 매듭 끈. 그가 다스린 땅의 창고·길·사람을 매듭으로 센 기록이다. 몸값의 방을 채우고도 그는 살아 나가지 못했다.');
      var half = Math.round(K.share / 2); s.player.gold += half;
      var so = G.Fame.add('so', 150);
      G.State.log('카하마르카에서 몸값의 몫을 절반(금화 ' + U.num(half) + '닢)만 받고, 데 소토와 함께 아타우알파의 목숨을 탄원했다. 황제가 키푸를 건넸다. (사교 명성 +' + so + ')');
      UI.toast('금화 +' + U.num(half) + ' · 아타우알파의 키푸', 'coin', 5600);
    } else {
      var share = b.caja === 'warn' ? Math.round(K.share * 0.6) : K.share;
      s.player.gold += share; crownTrust(5);
      if (b.caja === 'warn') await play([['pizarro', '(금괴를 세어 넘기며) …그날 밤 황제의 진영에 다녀온 그대 사람이 있었다더군. 펠리피요가 다 말했다. 몫은 깎는다. 목은 남겨 두지. 동업자니까.']]);
      notoriety(K.notoTake, '잉카 황제의 몸값을 나누어 가졌다');
      G.State.log('카하마르카에서 잉카 황제의 몸값을 녹인 금괴로 몫(금화 ' + U.num(share) + '닢)을 받았다.');
      UI.toast('금화 +' + U.num(share), 'coin', 4800);
    }
    hint('inca');
    refresh();
  }

  // ================================================================ ③ 쿠스코 입성 (1533~1535)
  function cuscoOpen() { var b = st(), t = today(); return !!(b && !b.cusco && cityNow() === CUSCO && t >= K.cuscoFrom && t <= K.cuscoTo); }
  async function cusco() {
    var b = st(), s = S(), part = b.side === 'partner' && b.ransom && b.ransom !== 'missed'; b.met = 1;
    await withPic('inca_coricancha', '코리칸차의 금 정원 (1533)', function () { return play([
      [null, '쿠스코 — 「세상의 배꼽」. 네 지방으로 뻗은 잉카의 길이 모두 이 광장에서 시작한다. 그런데 거리에는 말 탄 수염 난 자들이 다닌다.'],
      [null, '태양의 신전 코리칸차. 병사들이 지렛대로 벽의 금판을 뜯어내고 있다. 칠백 장이 넘는다고 한다. 안뜰에는 금으로 빚은 옥수수밭이 있다 — 금 줄기, 은 이삭, 금 라마와 그 라마를 모는 금 목동.'],
      ['villacumu', '(멀리서 그것을 보며) 태양께서 보고 계신다. 저들은 금을 먹는 사람들인가. 저것을 녹여서 무엇을 하려는가.'],
      [null, '쿠스코에 들어오기 전 길에서, 피사로는 아타우알파의 장군 찰쿠치막을 산 채로 불태웠다. 장군은 끝내 세례를 거절하고 태양의 이름을 불렀다고 한다.'],
      ['manco', '나는 망코, 와이나 카팍의 아들이다. 수염 난 자들이 나에게 술 장식을 씌워 주겠다 한다. 사파 잉카로. …그들이 내 목에 건 것이 왕관인지 고삐인지, 아직은 모르겠다.'],
      ['curaocllo', '왕관을 씌운 손은 언제든 그 끈을 당길 겁니다. 나는 쿠라 오클로, 망코의 코야입니다. 저들이 금판만 가져간다고 믿지 마십시오.']
    ]); });
    var opts = [];
    if (part) opts.push({ label: '피사로가 내미는 몫 — 금 옥수숫대 하나를 받는다 (금화 ' + U.num(K.loot) + '닢어치)', value: 'loot' });
    opts.push({ label: '젊은 망코에게 다가가 말을 건넨다', value: 'manco' }, { label: '신전을 뒤로하고 떠난다', value: 'leave' });
    var v = await UI.ask('쿠스코, 1533년 — 무너지는 태양의 신전 앞에서', opts, me());
    b.cusco = v || 'leave';
    if (b.cusco === 'loot') {
      await play([['pizarro', '가져가라, 동업자. 어차피 녹으면 다 같은 금이다.'], [null, '금 옥수숫대는 손바닥에 묵직했다. 잎사귀 끝의 은 이삭이 덜렁거린다. …대장간의 불은 그날 밤에도 꺼지지 않았다.']]);
      s.player.gold += K.loot; notoriety(K.notoLoot, '태양의 신전에서 금을 나누어 가졌다');
      G.State.log('쿠스코 코리칸차에서 금 정원의 옥수숫대 하나를 몫으로 받았다 (금화 ' + U.num(K.loot) + '닢어치).');
    } else if (b.cusco === 'manco') {
      await play([
        ['manco', b.friend ? '…그대를 안다. 카하마르카에서 형님(아타우알파)을 위해 말해 준 이방인이라고 들었다. 형님과 나는 다른 편이었지만, 그 일은 고맙다.' : '이방인. 너는 저들과 같은 배를 타고 왔으면서 저 금에 손을 대지 않는구나.'],
        ['manco', '아버지 와이나 카팍이 돌아가실 때 북쪽에서 이상한 병이 올라왔다. 얼굴에 고름이 돋는 병. 수많은 사람이 죽었고, 그 뒤에 형제들이 싸웠다. …그리고 저들이 왔다. 저들은 병과 같다. 먼저 와서 우리를 약하게 만든다.'],
        ['manco', '나는 오늘은 저들이 씌워 주는 술 장식을 쓴다. 그러나 언젠가는 내 손으로 벗을 것이다. 그날이 오면 — 기억해 다오.']
      ]);
      b.friend = 1; var so = G.Fame.add('so', 80);
      G.State.log('쿠스코에서 꼭두각시 사파 잉카로 세워진 망코 잉카와 이야기를 나누었다. (사교 명성 +' + so + ')');
    } else G.State.log('쿠스코에서 에스파냐 사람들이 코리칸차의 금을 뜯어내는 것을 보았다.');
    refresh();
  }

  // ================================================================ ④ 망코의 반란 (1536~1537)
  function siegeOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.siege && (c === CUSCO || c === LIMA) && t >= K.siegeFrom && t <= K.siegeTo); }
  async function siege() {
    var b = st(), s = S(), atCusco = cityNow() === CUSCO; b.met = 1;
    if (atCusco) await withPic('inca_sacsayhuaman', '쿠스코 포위 (1536)', function () { return play([
      [null, '쿠스코를 둘러싼 산마루마다 불이 켜져 있다. 수만, 어쩌면 십만이 넘는 잉카의 군사다. 불붙인 돌이 날아와 초가지붕들이 타오른다.'],
      [null, '봄에 망코 잉카는 「아버지의 황금 상을 가져오겠다」며 쿠스코를 빠져나갔다. 그리고 군대를 이끌고 돌아왔다. 도시 위의 돌 요새 삭사이와만도 잉카의 손에 들어갔다.'],
      ['hpizarro', '말들이 지쳤소. 우리는 이백도 안 되오. 요새를 되찾지 못하면 다 죽소. 내 아우 후안이 내일 새벽 요새로 돌격하오.'],
      ['villacumu', '(요새의 성벽 위에서, 바람에 실려 오는 목소리) 태양의 아들이 돌아오셨다! 이 도시는 수염 난 자들의 무덤이 될 것이다!'],
      ['curaocllo', '(성벽 위에서 방패를 들며) 쿠스코의 길과 물길은 우리가 압니다. 돌 하나, 지붕 하나까지 오늘은 우리 편입니다!']
    ]); });
    else await play([
      [null, '리마, 총독이 세운 「왕들의 도시」. 동쪽 산에서 내려온 잉카 군대가 도시를 에워싸고 있다. 장군 키소 유팡키의 깃발이 보인다.'],
      ['pizarro', b.side === 'partner' ? '동업자, 마침 잘 왔다. 쿠스코의 내 아우들에게서 몇 달째 소식이 없다. 구하러 보낸 대장들은 산길에서 돌에 깔려 죽었다.' : '바다에서 온 제독인가. 쿠스코는 포위되었고, 리마도 이 꼴이다. 파나마와 멕시코에 구원을 청하는 편지를 보냈다.'],
      ['pizarro', '저들이 들판으로 내려오면 말이 이긴다. 그대의 사람들을 빌려 다오.']
    ]);
    var v = await UI.ask((atCusco ? '쿠스코' : '리마') + ', 1536년 — 망코 잉카의 반란', [
      { label: '에스파냐 편에서 싸운다', value: 'spain' },
      { label: '밤을 틈타 포위선 너머 망코 잉카에게 간다', value: 'manco' },
      { label: '싸움에 끼지 않고 물러난다', value: 'leave' }], me());
    b.siege = v || 'leave';
    if (b.siege === 'spain') {
      if (atCusco) await play([['hpizarro', '좋소! 후안과 함께 요새로 오르시오. 저들은 돌팔매와 별 곤봉을 쓰오. 투구를 꼭 쓰시오 — 어제 후안이 턱을 다쳐 투구를 못 쓰고 있소.']]);
      var res = await fight(atCusco ? '삭사이와만의 잉카 군 (비약 우무)' : '키소 유팡키의 잉카 군', atCusco ? 110 : 95, 'native');
      b.siegeRes = res;
      if (res === 'win') {
        s.player.gold += K.siegeGold; crownTrust(8);
        var bt = G.Fame.add('bt', 260);
        await play(atCusco ? [[null, '요새의 마지막 탑에서 잉카의 대장이 망토를 머리에 쓰고 성벽 아래로 몸을 던졌다. 삭사이와만은 에스파냐의 손에 돌아왔다.'], [null, '그러나 돌격을 이끈 후안 피사로는 돌에 머리를 맞고 며칠 뒤 숨을 거두었다.'], ['hpizarro', '…아우를 잃었소. 그대가 없었으면 우리 모두를 잃었을 거요.']]
          : [[null, '들판으로 내려온 잉카 군대를 기병이 짓밟았다. 키소 유팡키가 쓰러지고, 리마를 에워싼 군대는 산으로 물러갔다.'], ['pizarro', '리마는 살았다. 이 은혜는 잊지 않겠다.']]);
        G.State.log((atCusco ? '쿠스코 삭사이와만' : '리마') + '에서 에스파냐 편에 서서 망코 잉카의 군대를 물리쳤다. (금화 +' + U.num(K.siegeGold) + ' · 전투 명성 +' + bt + ')');
      } else {
        await play([[null, '산에서 쏟아지는 돌과 함성에 제독의 사람들은 물러섰다. 포위는 그 뒤로도 몇 달 더 이어졌다.']]);
        G.State.log((atCusco ? '쿠스코' : '리마') + '에서 망코 잉카의 군대와 싸웠지만 물러났다.');
      }
    } else if (b.siege === 'manco') {
      await withPic('inca_ollantaytambo', '올란타이탐보 (1537)', function () { return play([
        [null, '포위선의 잉카 병사들이 제독을 붙잡아 우루밤바 골짜기의 요새 올란타이탐보로 데려갔다. 계단처럼 쌓은 돌 밭이 산을 기어오른다.'],
        ['manco', b.friend ? '…왔구나. 기억해 달라던 그날이 왔다. 내 손으로 술 장식을 벗었다. 이제 이 머리에 있는 것은 내가 고른 것이다.' : '이방인, 너는 왜 우리 쪽으로 왔나. …좋다. 저들과 다른 수염 난 자가 있다는 것도 알아 두마.'],
        ['manco', '에르난도 피사로가 기병을 이끌고 이 골짜기로 온다. 우리는 강물을 막아 두었다. 저들이 들판에 들어서면 물길을 터서 말을 진창에 빠뜨릴 것이다. 그때까지 저 기병을 골짜기 어귀에서 붙잡아 다오. 너희의 총이 필요하다.'],
        ['curaocllo', '물이 터지면 내가 계단밭의 돌팔매꾼들을 이끌겠습니다. 말의 발이 멈추는 순간을 놓치지 마십시오.'],
        ['villacumu', '태양과 대지의 어머니 파차마마께서 보고 계신다.']
      ]); });
      var r2 = await fight('에르난도 피사로의 기병대', 70, 'garrison');
      b.siegeRes = r2; b.friend = 1;
      await play([
        [null, '물길이 터졌다. 골짜기 들판이 순식간에 늪이 되어 말들이 배까지 빠졌다. 계단 밭 위에서 돌팔매와 화살이 쏟아졌다. 에르난도 피사로는 밤을 틈타 쿠스코로 달아났다.'],
        ['manco', r2 === 'win' ? '보았느냐! 잉카의 땅이 잉카를 지켰다. 너는 오늘 우리 편이었다.' : '네 사람들이 많이 다쳤구나. 그래도 물러서지 않았다. 잉카는 그것을 잊지 않는다.'],
        ['manco', '그러나 저들은 또 올 것이다. 바다 너머에서 끝없이. …나는 숲 가장자리의 산속, 빌카밤바로 간다. 케스와차카의 풀 다리를 건너, 구름 아래 골짜기로. 네가 언젠가 그곳을 찾아온다면, 잉카의 문은 너에게 열려 있다.']
      ]);
      hint('qeswachaka'); hint('vilcabamba');
      var so = G.Fame.add('so', 220), bt2 = r2 === 'win' ? G.Fame.add('bt', 160) : 0;
      crownTrust(-10);
      G.State.log('망코 잉카의 편에 서서 올란타이탐보에서 에르난도 피사로의 기병대를 막았다. 망코가 빌카밤바로 가는 길을 일러 주었다. (사교 명성 +' + so + (bt2 ? ' · 전투 명성 +' + bt2 : '') + ')');
      UI.toast('빌카밤바로 가는 길을 들었다 — 케스와차카의 풀 다리 너머', 'scroll', 6000);
    } else G.State.log((atCusco ? '쿠스코' : '리마') + '를 에워싼 망코 잉카의 반란에서 어느 편에도 서지 않고 물러났다.');
    refresh();
  }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (js/scenes/city.js 의 도시 공격과 같은 방식) */
  async function fight(name, n, kind) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, n, false, { kind: kind, guns: kind === 'garrison' }); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  // ================================================================ ⑤ 마지막 잉카 (1572)
  function tupacOpen() { var b = st(), t = today(); return !!(b && b.friend && !b.tupac && cityNow() === CUSCO && t >= K.tupacFrom && t <= K.tupacTo); }
  async function tupac() {
    var b = st(); b.tupac = 1;
    var after = today() >= 15720924;
    await play([
      [null, after ? '쿠스코 광장. 며칠 전 이곳에 처형대가 섰다고 한다. 사람들은 아직도 광장 가장자리를 피해 걷는다.' : '쿠스코 광장에 처형대가 세워져 있다. 광장과 둘레의 지붕, 창문마다 사람이 빼곡하다. 울음소리가 바람처럼 낮게 깔린다.'],
      ['toledo', '빌카밤바의 반역자 투팍 아마루. 폐하의 이름으로 죽음을 명한다. 이로써 잉카의 반란은 끝난다.'],
      ['tupacamaru', '(손을 들어 광장의 울음을 그치게 하고) 대지의 어머니시여, 보소서. 나의 적들이 내 피를 흘리는 것을.'],
      [null, '광장은 쥐 죽은 듯 조용해졌다. 오래전 카하마르카에서, 쿠스코의 신전 앞에서, 올란타이탐보의 골짜기에서 제독이 보았던 나라가 — 그렇게 끝났다.'],
      [null, '훗날 잉카 공주의 아들 가르실라소 데 라 베가가 에스파냐에서 어머니의 나라 이야기를 책으로 쓸 것이다. 매듭으로 기록하던 나라는 그렇게 글로 남는다.']
    ]);
    var so = G.Fame.add('so', 120);
    G.State.log('쿠스코에서 마지막 잉카 투팍 아마루의 죽음을 보았다. (사교 명성 +' + so + ')');
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  IF.pending = function () { var s = S(); if (!s) return false; return panamaOpen() || tumbesOpen() || cuscoOpen() || siegeOpen() || tupacOpen(); };
  IF.check = async function () {
    if (IF._busy) return false; IF._busy = true;
    IF.evDay = U.dayIndex(S().date);   // 오늘 잉카 장면이 떴다 — 같은 입항의 포카혼타스는 다음으로 (QA 2026-10-23)
    try {
      if (panamaOpen()) await panama();
      else if (tumbesOpen()) await tumbes();
      else if (siegeOpen()) await siege();
      else if (cuscoOpen()) await cusco();
      else if (tupacOpen()) await tupac();
    } catch (e) { console.error(e); }
    IF._busy = false;
    return true;
  };
  IF.html = function () {
    var s = S(), b = s && s.incaFall; if (!b || b.side !== 'partner' || b.ransom) return '';
    var t = today(), li = [];
    if (t < K.tumbesFrom) li.push('1532년 툼베스나 찬찬으로 가서 피사로의 원정대와 만난다');
    else if (t < K.ambushFrom && !b.tumbes) li.push('툼베스·찬찬 — 피사로의 원정대 (8월이 지나면 산으로 오른다)');
    else if (t <= K.capture) li.push('1532년 11월 16일까지 툼베스·찬찬 — 카하마르카로 오른다');
    else li.push('1533년 7월까지 툼베스·찬찬 — 카하마르카, 몸값의 방');
    return '<div class="sep"></div><h4 style="margin:0 0 8px">레반테 회사 — 남쪽의 황금 제국</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._incaHtml) { G.Court._incaHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + IF.html(); }; }
  IF._t = { panama: panama, tumbes: tumbes, cusco: cusco, siege: siege, tupac: tupac };
})(window.G = window.G || {});
