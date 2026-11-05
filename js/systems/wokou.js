/* 왜구의 대규모 침입과 척계광의 토벌 (G.Wokou) 2026-11-05 사용자 요청
   「1550~1560년대 왜구의 대규모 침입과 척계광의 토벌 — 동남 해안에서 약탈과 밀무역 세력의 활동이 격화. 척계광 등이 군대를 재편하고 왜구 토벌에 나섭니다」
   사람·소지품·조정값: js/data/wokou.js (G.BALANCE.wokou). 왕직·척계광·유대유 = 지역 사람 동료 h_wangzhi · h_qijiguang · h_yudayou. 큰 역사는 그대로다.
   ■ 입항: 명의 항구는 외국인을 막는다(X). 이 사건의 장면이 기다리는 항구에 바다로 다가가거나 「호종헌의 통행첩」을 가졌으면, 관군이 길을 열어 준다 (beforePort — js/scenes/sea.js)
   ■ ① 불타는 포구 (1553.4.1~1556.12.31, 항주·상해): 입항하려는데 성 밖 마을이 불탄다 — 왜구와 육상전 → 관군 천호 · 호종헌이 「왕직을 아는가」 묻고 통행첩을 준다 (명의 길)
   ■ ①' 정해왕의 잔치 (1553.1.1~1557.9.30, 나가사키): 히라도의 「휘왕」 왕직. 「해금이 바다를 도적으로 만든다」 → 은과 생사의 밀무역에 끼어든다(금화 · 악명 · 정해왕의 깃발) / 사양 (정해왕의 길)
   ■ ② 왕직의 귀순 (1557.10.1~1558.2.28, 항주 — ①이나 ①'를 지난 사람): 호종헌이 「귀순하면 통상을 열겠다」 약조했다. 잠항에 닿은 왕직, 의심하는 양아들 모해봉
        → 「믿어도 되오」 / 「덫이오」 / 말하지 않는다 — 어느 쪽이든 왕직은 뭍에 오른다(「내가 가지 않으면 해금은 영영 풀리지 않는다」) → 붙잡힌다
        제독이 이미 왕직을 부하로 데리고 있었으면 그가 먼저 배에서 내린다
   ■ ③ 원앙진 (1559.9.1~1561.5.15, 항주·상해): 척계광이 의오의 광부들을 모은다. 열두 사람의 진 — 물음 둘(등패 · 낭선)을 맞힐수록 태주의 왜구가 준다
        → 따라간다(1561.5.25까지 날이 지나간다) → 태주의 싸움(육상전) → 『기효신서』
   ■ ④ 평해위 (1563.4.1~5.20, 복주·천주·하문): 흥화부가 떨어졌다. 유대유·유현의 수군과 함께 왜구 선단과 싸운다(큰 해전 — 끝나면 그 항구로)
        → 척계광이나 유대유를 부하로 맞을 수 있다 (이미 데리고 있으면 그 사람은 빼고)
   ■ 소식: 대왜구(1553.6) · 남경 성문의 왜구(1555.8) · 서해의 최후(1556.9.29) · 왕직이 갇히다(1558.2) · 왕직의 처형(1560.1.22) · 태주(1561.6.10) · 흥화 함락(1563.1.15) · 평해위(1563.5.23) · 광동 남오(1565.8)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/wk_*.webp
   ■ 저장: s.wokou = { path: 'ming'|'wang', raid, wang, surrender, qi, quiz, taizhou, pinghai, join, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var WK = G.Wokou = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.wokou) || {}; }
  var HANGZHOU = 177, SHANGHAI = 288, FUZHOU = 176, QUANZHOU = 175, XIAMEN = 287, NAGASAKI = 191;
  var D = WK.D = { raidFrom: 15530401, raidTo: 15561231, wangFrom: 15530101, wangTo: 15570930, surFrom: 15571001, surTo: 15580228,
    qiFrom: 15590901, qiTo: 15610515, taizhou: 15610525, phFrom: 15630401, phTo: 15630520, pinghai: 15630523 };
  var NEWS_AT = { raids: 15530601, nanjing: 15550801, xuhai: 15560929, arrest: 15580201, execution: 15600122, taizhouNews: 15610610, xinghua: 15630115, pinghaiNews: 15630523, guangdong: 15650801 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.wokou) {
      s.wokou = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.wokou.told[k] = 1; });
    }
    if (!s.wokou.told) s.wokou.told = {};
    return s.wokou;
  }
  WK.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var WHO = { P: me, F: first, WZ: function (e) { return mateSp('h_wangzhi', e); }, QI: function (e) { return mateSp('h_qijiguang', e); }, YU: function (e) { return mateSp('h_yudayou', e); } };
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
  function join(id, loyal) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var m = G.Legend.join(id, G.CITY_DATA[cityNow()] || null); if (m && loyal) m.loyal = loyal; return m; }
  function leaveMate(id) { var s = S(), i = -1; s.mates.forEach(function (x, k) { if (x.id === id) i = k; }); if (i < 0) return false; s.mates.splice(i, 1); return true; }
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

  // ================================================================ 소식
  WK.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.path || b.qi || b.pinghai || b.wang), east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('raids', east, 'skull', '【대왜구】 절강과 강남의 바닷가가 불타고 있다. 수백 척의 왜구 선단이 상해와 영파 둘레를 휩쓸었다. 그 무리의 절반 넘게가 일본 사람이 아니라 해금으로 생업을 잃은 이 땅의 어부와 장사치라고 한다.');
    news('nanjing', east, 'castle', '【남경 성문】 왜구 칠십여 명이 절강에서 안휘를 지나 수천 리를 휩쓸고 남경 성문 앞까지 왔다. 남경의 군사 수만이 성문을 닫아걸고 내다보기만 했다고 한다.');
    news('xuhai', met, 'skull', '【서해】 절강 앞바다를 휩쓸던 왜구 두목 서해가 호종헌의 꾀에 걸려 내분 끝에 물에 빠져 죽었다. 중이었던 그는 「명산 화상」이라 불렸다.');
    news('arrest', met, 'scroll', '【왕직이 갇히다】 귀순하면 바다의 장사를 열어 주겠다는 약조를 믿고 뭍에 오른 「정해왕」 왕직이 항주에서 붙잡혀 옥에 갇혔다.' + (b.surrender === 'warn' ? ' 그는 덫인 줄 알고도 걸어 들어갔다고 한다.' : ''));
    news('execution', east, 'skull', '【왕직의 최후】 왕직이 항주 관항구에서 목이 베였다. 「죽는 것은 나 하나지만, 양절의 백성은 이제 더 고생할 것이다.」 — 그의 말대로 양아들 모해봉과 남은 무리가 바다로 흩어져 더 거친 왜구가 되었다.' + (b.wang === 'trade' ? ' 그의 깃발을 단 배 하나가 그날 히라도 쪽 바다에서 조기를 달았다고 한다.' : ''));
    news('taizhouNews', east, 'flag', '【태주】 참장 척계광의 「척가군」이 태주에서 왜구와 아홉 번 싸워 아홉 번 이겼다. 의오의 광부와 농부들로 짠 열두 사람의 진 — 원앙진이라 부른다.' + (b.taizhou ? ' 그 진 사이에 바다에서 온 이방인 선장의 사람들이 섞여 있었다고 한다.' : ''));
    news('xinghua', met, 'skull', '【흥화 함락】 복건의 흥화부가 왜구에게 떨어졌다. 두 달 동안 성이 불타고 사람들이 끌려갔다. 복건 사람들이 다시 척계광을 부른다.');
    news('pinghaiNews', east, 'ship', '【평해위】 척계광·유대유·유현이 평해위에서 왜구를 크게 무찔러 흥화를 되찾았다. 「유대유는 용, 척계광은 범」 — 사람들은 둘을 「유룡척호」라 부른다.' + (b.pinghai === 'won' ? ' 바다 쪽 날개에는 이방인 선장의 배가 있었다.' : ''));
    news('guangdong', met, 'ship', '【남오】 척계광과 유대유가 광동 남오섬에서 마지막 큰 해적 오평의 무리를 무찔렀다. 동남 바다의 큰 왜구가 이로써 잦아들었다. 두 해 뒤 해금이 조금 풀려 월항에서 민간의 배가 바다로 나가게 되었다.');
    return out;
  };

  // ================================================================ 입항 — 장면이 기다리는 항구, 통행첩 (js/scenes/sea.js)
  function dueAt(c) {
    var b = st(), t = today(); if (!b || c == null) return false;
    if (!b.path && (c === HANGZHOU || c === SHANGHAI) && t >= D.raidFrom && t <= D.raidTo) return true;
    if ((b.path === 'ming' || b.path === 'wang') && !b.surrender && c === HANGZHOU && t >= D.surFrom && t <= D.surTo) return true;
    if (!b.qi && (c === HANGZHOU || c === SHANGHAI) && t >= D.qiFrom && t <= D.qiTo) return true;
    if (!b.pinghai && [FUZHOU, QUANZHOU, XIAMEN].indexOf(c) >= 0 && t >= D.phFrom && t <= D.phTo) return true;
    if (b.pinghai && !b.join && t <= 15671231 && [FUZHOU, QUANZHOU, XIAMEN].indexOf(c) >= 0) return true;
    return false;
  }
  WK.dueAt = dueAt;
  WK.beforePort = async function (c) {
    if (!c || !st()) return false;
    var ports = K().ports || [];
    if (ports.indexOf(c.id) < 0) return false;
    if (dueAt(c.id) || has('wk_pass')) {
      if (G.Sneak && G.Sneak.givePass && !(G.Sneak.hasPass && G.Sneak.hasPass(c))) {
        G.Sneak.givePass(c);
        UI.toast(has('wk_pass') ? '호종헌의 통행첩 — 수비병이 길을 열었다' : c.name + '의 관군이 왜구를 쫓는 배라며 입항을 허락했다', 'seal', 3600);
      }
    }
    return false;   // 입항은 늘 원래대로 이어진다 (이 사건은 길만 연다)
  };

  // ================================================================ ① 불타는 포구 (1553.4~1556, 항주·상해)
  function raidOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.path && (c === HANGZHOU || c === SHANGHAI) && t >= D.raidFrom && t <= D.raidTo); }
  async function raid() {
    var b = st(), k = K(), c = G.CITY_DATA[cityNow()];
    await withPic('wk_raid', '불타는 포구 (' + c.name + ')', function () { return play([
      [null, c.name + ' 포구. 닻을 내리기도 전에 성 밖 마을에서 검은 연기가 오른다. 머리를 반쯤 민 사내들이 왜도를 휘두르며 창고 문을 부순다. 그 사이에 중국 옷을 입은 사내들도 섞여 있다.'],
      ['wk_refugee', '(아이를 업고 부두로 달려오며) 왜구요! 성문은 닫혔고 관군은 성 안에만 있어요! 제발 저 창고에 아직 사람이…!'],
      ['F', '제독, 명나라 관군은 나오지 않을 모양입니다. 우리 선원들뿐입니다!']
    ]); });
    var res = await fight('포구를 터는 왜구', (k.foe || {}).raid || 30, { guns: false, leader: '왜구 두목' });
    b.raid = res === 'win' ? 'win' : 'lose';
    var rf = fame('bt', 'raid');
    await play([
      [null, res === 'win' ? '왜구가 배로 달아났다. 불붙은 창고에서 사람들이 기어 나온다.' : '선원들이 밀리는 사이 왜구는 실을 만큼 싣고 배로 달아났다. 그래도 창고의 사람들은 살았다.'],
      ['wk_officer', '(성문이 열리고 나서야 달려 나와) …바다에서 온 이방인이 성 밖을 지켰단 말이오. 위에 아뢰어야겠소.'],
      ['wk_hu', '절강의 순안 호종헌이오. 이방인, 그대가 왜구와 싸우는 걸 성루에서 보았소. 한 가지 묻겠소 — 그대는 히라도의 왕직을 아오? 이 바다의 왜구 절반은 그의 깃발 아래 있소. 나는 그를 칼이 아니라 말로 부를 생각이오.'],
      ['wk_hu', '(붉은 관인이 찍힌 종이를 내밀며) 통행첩이오. 왜구를 쫓는 배라는 표시지. 절강과 복건의 항구가 그대에게 문을 열 것이오. 대신 — 바다에서 들은 것을 내게 알려 주시오.']
    ]);
    give('wk_pass'); b.path = 'ming';
    log(c.name + ' 포구에서 왜구를 막았다. 절강 순안 호종헌이 통행첩을 주었다. (전투 명성 +' + rf + ')');
    UI.toast('호종헌의 통행첩 — 항주·상해·복주·천주·하문에 들어갈 수 있다', 'seal', 6000);
    refresh();
  }

  // ================================================================ ①' 정해왕의 잔치 (1553~1557.9, 나가사키)
  function wangOpen() { var b = st(), t = today(); return !!(b && !b.wang && !b.path && cityNow() === NAGASAKI && t >= D.wangFrom && t <= D.wangTo && !row('h_wangzhi')); }
  async function wangFeast() {
    var b = st(), s = S(), k = K();
    await withPic('wk_hirado', '정해왕의 잔치 (히라도)', function () { return play([
      [null, '히라도. 포구를 메운 배마다 같은 깃발이 걸렸다. 언덕 위 저택에서는 비단옷의 중국 상인과 칼을 찬 일본 무사, 포르투갈 뱃사람이 한 상에 앉아 술을 마신다.'],
      ['WZ', '어서 오시오, 서쪽 바다의 선장. 나는 왕직이오. 휘주의 소금 장수였지. 사람들은 나를 「휘왕」이라 부르고, 명의 관리들은 「왜구의 괴수」라 부르오. (웃는다) 어느 쪽이든 상관없소.'],
      ['WZ', '명나라 조정은 바다에 나가는 배를 모두 도적이라 하오. 그러니 장사꾼이 도적이 될 수밖에. 해금을 풀어 주면 나는 내일이라도 이 바다의 도적을 다 잡아 바치겠소. …그런데 조정은 칼만 보내지.'],
      ['wk_mao', '(곁에서) 아버지, 이 이방인도 장사꾼입니다. 생사(生絲)를 일본 은과 바꾸는 길에 한 배쯤 더 끼워도 되겠지요.']
    ]); });
    var v = await UI.ask('정해왕이 밀무역에 끼라고 한다', [
      { label: '끼어든다 — 일본 은과 중국 생사를 실어 나른다 (금화 +' + U.num(k.trade || 4000) + ' · 악명)', value: 'trade', icon: 'coin' },
      { label: '「도적의 깃발 아래서는 장사하지 않소」', value: 'refuse' }], me());
    b.wang = v;
    if (v === 'trade') {
      s.player.gold += k.trade || 4000; s.player.notoriety = (s.player.notoriety || 0) + 4; give('wk_flag'); b.path = 'wang';
      var wf = fame('so', 'wang');
      await play([
        [null, '석 달. 제독의 배는 히라도의 은을 싣고 쌍서항 앞바다에서 생사와 바꾸었다. 바다에서 마주친 왜구들은 깃발을 보자 뱃머리를 돌렸다.'],
        ['WZ', '(은괴를 나누며) 보시오, 장사가 이렇게 쉬운 것을. …명나라에서 사절이 왔소. 총독 호종헌이 「귀순하면 통상을 열어 주겠다」고 한다오. 믿어야 할지. 그대 생각을 나중에 듣고 싶구려.']
      ]);
      log('히라도에서 「정해왕」 왕직의 밀무역에 끼어 금화 ' + U.num(k.trade || 4000) + '닢을 남겼다. 정해왕의 깃발을 받았다. (악명 +4 · 사교 명성 +' + wf + ')');
    } else {
      await play([['WZ', '(잔을 들어 보이며) 깨끗한 손이로군. 바다가 그 손을 오래 깨끗하게 두지는 않을 것이오. …언젠가 다시 봅시다.']]);
      log('히라도에서 「정해왕」 왕직의 밀무역 제안을 사양했다.');
    }
    refresh();
  }

  // ================================================================ ② 왕직의 귀순 (1557.10~1558.2, 항주)
  function surOpen() { var b = st(), t = today(); return !!(b && (b.path === 'ming' || b.path === 'wang') && !b.surrender && cityNow() === HANGZHOU && t >= D.surFrom && t <= D.surTo); }
  async function surrender() {
    var b = st(), s = S(), k = K(), aboard = !!row('h_wangzhi');
    if (aboard) {
      await play([['WZ', '(뱃전에서 항주 쪽을 바라보며) 선장, 여기서 내리겠소. 호종헌이 나를 부르오. 내 사람들이 잠항에서 기다리고. …내가 가야 해금이 풀릴지도 모르오.']]);
      leaveMate('h_wangzhi');
    }
    await withPic('wk_cengang', '잠항의 깃발 (1557)', function () { return play([
      [null, '주산 군도의 잠항. 「정해왕」의 깃발을 단 큰 배들이 닻을 내렸다. 항주 총독부에서는 날마다 사절이 오간다.'],
      b.path === 'ming'
        ? ['wk_hu', '(총독부 깊은 방에서) 왕직이 왔소. 나는 그에게 통상을 약조했소. …그러나 조정의 어사들은 「괴수의 목」을 원하오. 나는 약조를 지키고 싶소만, 내 목도 하나뿐이오. 그대가 그를 뭍으로 데려와 주오. 그대 말이라면 믿을 것이오.']
        : ['WZ', '(배 위에서) 호종헌이 친서를 보냈소. 「귀순하면 통상을 열고 벼슬을 주겠다」고. 내 양아들 모해봉은 덫이라 하오. 선장, 그대는 바다와 뭍을 다 보았소. 어찌 생각하오?'],
      ['wk_mao', '아버지, 가지 마십시오! 명나라 관리의 약조가 언제 지켜진 적이 있습니까!']
    ]); });
    var v = await UI.ask('왕직이 그대를 바라본다 — 뭍에 오를 것인가', [
      { label: '「총독의 약조를 믿어도 되오」', value: 'trust', icon: 'scroll' },
      { label: '「덫이오. 가지 마시오」', value: 'warn', icon: 'skull' },
      { label: '아무 말도 하지 않는다', value: 'quiet' }], me());
    b.surrender = v;
    await play(v === 'trust'
      ? [['WZ', '(웃으며) 그렇소? 그렇다면 가겠소. 해금이 풀리면 내 배들이 도적이 아니라 장사꾼이 될 테니까.']]
      : v === 'warn'
        ? [['WZ', '(오래 바다를 보다가) …알고 있소. 그래도 가겠소. 내가 가지 않으면 해금은 영영 풀리지 않소. 내가 덫에 걸려야 조정이 바다를 다시 생각할지도 모르지.'], ['wk_mao', '(이를 갈며) 아버지가 돌아오지 않으면, 이 바다는 피바다가 될 겁니다.']]
        : [['WZ', '…말이 없구려. 그것도 대답이오. 가겠소.']]);
    await play([[null, '며칠 뒤, 왕직은 몇 사람만 데리고 항주 성에 들어갔다. 총독부 잔치가 끝나던 밤, 순안 어사의 군사들이 그를 묶었다. 호종헌은 끝내 그 방에 나타나지 않았다.']]);
    if (b.path === 'ming') {
      s.player.gold += k.huGold || 3000; var hf = fame('so', 'hu');
      await play([['wk_hu', '(제독에게 금화 자루를 건네며, 눈을 마주치지 않는다) 그대의 몫이오. …나는 약조를 지키려 했소. 그 말만은 믿어 주오.']]);
      log('1557년 항주 — 「정해왕」 왕직이 뭍에 올라 붙잡혔다. 총독 호종헌이 사례 금화 ' + U.num(k.huGold || 3000) + '닢을 주었다. (사교 명성 +' + hf + ')');
    } else {
      var wf = fame('so', 'wang');
      await play([['wk_mao', '(잠항에서 제독을 노려보다가) …아버지는 그대를 믿었소. 그대 탓은 아니오. 그러나 이제 이 바다에서 우리 깃발은 장사꾼의 깃발이 아니오.']]);
      log('1557년 항주 — 「정해왕」 왕직이 귀순 약조를 믿고 뭍에 올랐다가 붙잡혔다. (사교 명성 +' + wf + ')');
    }
    refresh();
  }

  // ================================================================ ③ 원앙진 (1559.9~1561.5, 항주·상해)
  function qiOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.qi && (c === HANGZHOU || c === SHANGHAI) && t >= D.qiFrom && t <= D.qiTo); }
  async function qi() {
    var b = st(), k = K();
    b.qi = 1;
    await withPic('wk_yiwu', '의오의 광부들 (1559)', function () { return play([
      [null, '절강 의오현. 은광 다툼으로 칼부림이 잦던 광부들 삼천이 연병장에 모였다. 북소리에 맞추어 열두 사람씩 진을 짠다.'],
      ['QI', '참장 척계광이오. ' + (b.path === 'ming' ? '호 총독께서 왜구와 싸운 이방인 선장 이야기를 하셨소. ' : '') + '관군은 왜구를 보면 달아나오. 그래서 나는 겁 없는 사람들을 모았소 — 산에서 돌을 캐던 광부들을.'],
      ['QI', '왜구의 긴 칼은 무섭소. 일본도는 우리 창대를 한 번에 베어 버리지. 그래서 열두 사람이 한 몸처럼 움직이는 진을 짰소. 원앙(鴛鴦)처럼 짝을 지어. …선장, 그대라면 어떻게 짜겠소?']
    ]); });
    var c1 = await UI.ask('원앙진의 맨 앞 — 왜도를 받아 내는 자리에 무엇을 세울까?', [
      { label: '등나무 방패(등패)와 짧은 칼', value: 'shield', icon: 'shield' },
      { label: '긴 창', value: 'spear', icon: 'sword' },
      { label: '조총', value: 'gun', icon: 'cannon' }], me());
    var c2 = await UI.ask('방패 뒤에서 왜도를 얽어 막는 무기는?', [
      { label: '가지를 남긴 굵은 대나무(낭선)', value: 'langxian', icon: 'leaf' },
      { label: '쇠사슬', value: 'chain' },
      { label: '그물', value: 'net' }], me());
    var n = (c1 === 'shield' ? 1 : 0) + (c2 === 'langxian' ? 1 : 0);
    b.quiz = n;
    await play([['QI', n === 2 ? '(눈이 커진다) 바로 그것이오! 등패가 칼을 받고, 낭선의 가지가 칼을 얽고, 그 뒤에서 장창 넷이 찌르고, 당파가 마무리하오. 바다 사람이 어떻게 그걸 아오?'
      : n === 1 ? '반은 맞았소. 맨 앞은 등패, 그 뒤는 가지를 남긴 대나무 — 낭선이오. 대나무 가지에 칼이 얽히면 왜구는 칼을 빼지 못하오.'
        : '(웃으며) 바다에서는 그럴지도 모르지. 뭍에서는 등패가 칼을 받고, 낭선이 얽고, 장창이 찌르오. 열두 사람이 한 사람처럼.']]);
    var j = await UI.ask('척계광의 군대를 따라 태주로 가겠는가? (1561년 5월 25일까지 날이 지나간다)', [
      { label: '따라간다', value: 'go', icon: 'boot' },
      { label: '「바다의 일이 기다리오」', value: 'no' }], me());
    if (j !== 'go') { await play([['QI', '알겠소. 바다에서 왜구를 만나거든 사정 두지 마시오.']]); log('의오의 연병장에서 척계광의 원앙진을 보았다.'); return; }
    await passTo(D.taizhou);
    await withPic('wk_taizhou', '태주의 싸움 (1561)', function () { return play([
      [null, '태주 화가(花街). 왜구 이천이 마을을 에워쌌다. 척가군의 북이 세 번 울리자 열두 사람의 진들이 원앙처럼 짝을 지어 나아간다.'],
      ['wk_miner', '(낭선을 꼬나쥐고) 바다 양반, 우리 진 옆에 서시오! 방패 뒤에서 벗어나지만 마시오!']
    ]); });
    var foe = Math.round(((k.foe || {}).taizhou || 44) * (1 - (k.quizCut || 0.12) * n));
    var res = await fight('태주를 에워싼 왜구', foe, { guns: true, leader: '왜구 두목', hold: 2 });
    b.taizhou = res === 'win' ? 'win' : 'lose';
    give('wk_book');
    var tf = fame('bt', 'taizhou');
    await play([
      [null, res === 'win' ? '왜도가 낭선의 가지에 얽히고, 장창이 그 틈을 찔렀다. 왜구가 무너졌다. 척가군은 한 진도 흐트러지지 않았다.' : '제독의 일행은 왜구의 칼에 밀렸지만, 원앙진이 그 옆을 메웠다. 해 질 녘 왜구가 흩어졌다.'],
      ['QI', '아홉 번째 싸움이었소. 아홉 번 다 이겼소. (책 한 권을 내밀며) 내가 이 사람들을 어떻게 길렀는지 적은 책이오. 『기효신서』. 바다에서도 쓸모가 있을 것이오.']
    ]);
    log('1561년 태주 — 척계광의 원앙진과 함께 왜구를 무찔렀다. 『기효신서』를 받았다. (전투 명성 +' + tf + ')');
    refresh();
  }

  // ================================================================ ④ 평해위 (1563.4~5.20, 복주·천주·하문)
  var JP = ['왜구의 관선', '히라도의 관선', '고토의 관선', '사쓰마의 관선', '왜구의 소조', '척후 소조', '불화살 소조', '밀무역 정크', '해적 정크'];
  function phSpec() {
    var k = K(), f = (k.foe || {}).pinghai || [0, 4, 3, 2], ships = [], names = [], i;
    for (i = 0; i < f[0]; i++) { ships.push('atakebune'); names.push('왜구 두목의 안택선'); }
    for (i = 0; i < f[1]; i++) { ships.push('sekibune'); names.push(JP[i % 4]); }
    for (i = 0; i < f[2]; i++) { ships.push('kobaya'); names.push(JP[4 + i % 3]); }
    for (i = 0; i < f[3]; i++) { ships.push('junk'); names.push(JP[7 + i % 2]); }
    var sp = { id: 'wokou_pinghai', foe: '왜구', ships: ships, names: names, foeLabel: '흥화를 차지한 왜구 선단', backCity: cityNow(), noPrize: false, place: '평해위 앞바다',
      allies: [{ type: 'ljunk', name: '유대유의 복선', gun: 'culverin' }, { type: 'ljunk', name: '유현의 복선', gun: 'culverin' }, { type: 'junk', name: '척가군의 사선', gun: 'saker' }],
      who: { mate: 'h_yudayou' }, gun: 'perrier', gunK: 0.8, crewK: 1,
      intro: '천주의 유대유요. 왜구가 흥화를 차지하고 평해위 앞바다에 배를 모았소. 척 장군이 뭍에서 치면, 나와 유현이 바다에서 친다. 그대가 바다 쪽 날개를 맡아 주겠소? 저놈들의 배를 하나도 돌려보내지 않을 것이오.',
      ask: '평해위 — 유대유의 수군과 함께 왜구 선단과 싸우겠는가?', decline: '…좋소. 그대 없이도 싸우겠소. 그러나 바다 쪽 날개가 얇아지겠지.',
      gunNote: '왜구의 배는 가볍고 빠르다 — 붙어서 뛰어드는 무사들을 조심하시오. 복선의 높은 뱃전이 우리 편이오.',
      win: { fame: (k.fame || {}).pinghai || 260, gold: 2500, text: '평해위 앞바다 — 유대유의 수군과 함께 왜구 선단을 깨뜨렸다. 흥화가 돌아왔다.' },
      lose: '평해위 앞바다에서 물러났다. 유대유의 수군은 홀로 싸웠다.' };
    sp.onWin = function () { var b = st(); if (b) b.pinghai = 'won'; };
    sp.onLose = function () { var b = st(); if (b && b.pinghai !== 'won') b.pinghai = 'lost'; };
    return sp;
  }
  WK.phSpec = phSpec;
  function phOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.pinghai && [FUZHOU, QUANZHOU, XIAMEN].indexOf(c) >= 0 && t >= D.phFrom && t <= D.phTo); }
  async function pinghai() {
    var b = st(), s = S();
    await withPic('wk_pinghai', '평해위 (1563)', function () { return play([
      [null, '복건. 흥화부가 왜구에게 떨어진 지 넉 달. 불탄 성 둘레로 굶주린 사람들이 떠돈다. 척가군이 다시 남쪽으로 내려왔다.'],
      ['QI', b.taizhou ? '태주의 바다 양반! 또 만났구려. 이번엔 뭍과 바다를 함께 쳐야 하오.' : '참장 척계광이오. 왜구가 흥화를 차지했소. 뭍은 내가 맡겠소. 바다는 유대유가 맡소.'],
      ['YU', '(투박한 곤봉을 짚고) 칼보다 곤봉이 낫소. 칼은 부러지지만 곤봉은 부러지지 않지. …바다 쪽 날개에 배 한 척이 모자라오.']
    ]); });
    if (!G.Rel || !G.Rel.greatBattle) { b.pinghai = 'none'; return; }
    var sp = phSpec(); G.Rel.register(sp);
    if (s.rel && s.rel.battle) delete s.rel.battle[sp.id];
    var went = await G.Rel.greatBattle(sp);
    if (!went) log('평해위의 싸움에 나서지 않았다. 5월 20일까지 복주·천주·하문에서 다시 유대유를 만날 수 있다.');
  }
  function joinOpen() { var b = st(), c = cityNow(); return !!(b && b.pinghai && b.pinghai !== 'none' && !b.join && today() <= 15671231 && [FUZHOU, QUANZHOU, XIAMEN].indexOf(c) >= 0); }
  async function joinEnd() {
    var b = st();
    await play([
      [null, '싸움이 끝난 뒤 포구의 술집. 척가군의 병사들이 술독을 비운다.'],
      ['QI', b.pinghai === 'won' ? '흥화를 되찾았소. 바다 쪽이 막혀 왜구가 달아날 길이 없었지. 그대 덕이오.' : '흥화는 되찾았소. 바다 쪽은 힘들었지만.'],
      ['YU', '척 장군은 곧 북쪽 장성으로 불려 갈 것이오. 나는 이 바다에 남고. …그런데 선장, 그대의 배에 한 사람쯤은 자리가 있소? 바다 위의 왜구는 아직 다 사라지지 않았소.']
    ]);
    var opts = [];
    if (!row('h_qijiguang')) opts.push({ label: '척계광을 맞는다 — 「원앙진을 바다에서도 짜 봅시다」', value: 'qi', icon: 'people' });
    if (!row('h_yudayou')) opts.push({ label: '유대유를 맞는다 — 「곤봉을 뱃전에 걸어 둡시다」', value: 'yu', icon: 'people' });
    opts.push({ label: '「두 분은 이 바다에 필요하오」', value: 'none' });
    var v = await UI.ask('척계광과 유대유', opts, me());
    b.join = v;
    if (v === 'qi') { join('h_qijiguang', 88); await play([['QI', '장성은 다른 사람이 쌓겠지. …좋소, 바다에서 원앙진을 짜 봅시다. 뱃전이 방패요, 돛대가 낭선이오.']]); }
    else if (v === 'yu') { join('h_yudayou', 88); await play([['YU', '하하, 곤봉이 바다를 건너는구려. 좋소. 내 늙은 팔이 아직 쓸 만하오.']]); }
    else await play([['QI', '그렇소. 그래도 언젠가 다시 만납시다. 그때는 『기효신서』에 바다 이야기를 한 장 더 넣겠소.']]);
    log('평해위의 싸움 뒤' + (v === 'qi' ? ' 척계광이 배에 올랐다.' : v === 'yu' ? ' 유대유가 배에 올랐다.' : ' 척계광·유대유와 헤어졌다.'));
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[joinOpen, joinEnd], [phOpen, pinghai], [surOpen, surrender], [qiOpen, qi], [raidOpen, raid], [wangOpen, wangFeast]];
  WK.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  // 도시에서 평해위 해전으로 나간 직후 싸움을 빠르게 끝내면, 귀항한 새 도시 진입과 이전 WK.check의 마무리가 짧게 겹칠 수 있다.
  // 그 순간에 후속 동료 장면을 건너뛰지 않도록, 귀항 처리가 끝난 뒤 한 번 더 확인한다.
  function retryCheck() {
    if (!WK._again) return;
    var C = G.Scenes && G.Scenes.city;
    if (!S() || !WK.pending() || !G.Game || G.Game.sceneName !== 'city') { WK._again = false; return; }
    if (WK._busy || UI.busy() || (C && C.isBusy && C.isBusy())) { setTimeout(retryCheck, 100); return; }
    WK._again = false; WK.check();
  }
  WK.check = async function () {
    if (WK._busy) { WK._again = true; setTimeout(retryCheck, 100); return false; } WK._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    WK._busy = false; refresh(); if (WK._again) setTimeout(retryCheck, 0);
    return true;
  };
  WK._t = { raid: raid, wangFeast: wangFeast, surrender: surrender, qi: qi, pinghai: pinghai, joinEnd: joinEnd };
})(window.G = window.G || {});
