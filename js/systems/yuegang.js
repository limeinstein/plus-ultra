/* 융경개관 — 해금 정책의 부분 완화(1567), 복건 월항 (G.Yuegang) 2026-11-05 사용자 요청
   「푸젠성 월항을 통해 허가받은 민간 해외무역을 허용. 해상무역을 제한적으로 합법화한 중요한 전환」
   사람·소지품·조정값: js/data/yuegang.js (G.BALANCE.yuegang). 해금이 풀린 것은 명나라 상인이 「나가는」 길이었다 — 서양 배가 들어오는 길은 여전히 막혔다.
   그래서 제독은 명나라 상단의 동업자가 되어 들어간다 (js/scenes/city.js 의 s.flags.mingTrade 는 건드리지 않는다 — 하문·천주의 통행 허가만).
   ■ ① 월항의 밤배 (1565.1.1~1567.2.28, 하문·천주): 해징 월항 갯벌의 밀무역. 진씨 상단의 진대랑과 밤배 선주, 그리고 순찰 나온 순무 도택민.
        (가) 밀무역 짐을 싣는다 — 금화 · 악명 · 순찰에 걸리면 육상전 (나) 순무에게 「막으면 도적이 되고, 열면 백성이 된다」 — 상소에 힘을 보탠다 (다) 지나친다
   ■ ② 월항이 열리다 (1567.3.1~1572.12.31, 하문·천주): 허가받은 상선(선인)이 동서양으로 나간다. 일본으로는 여전히 못 간다.
        진대랑: 「서양 배는 여전히 안 되오. 대신 내 배의 동업자가 되시오」 → 금화 invest를 넣는다(월항의 선인 — 하문·천주 통행 허가) / 사양(60일 뒤 다시)
   ■ 배당: 선인을 가지고 하문에 들를 때마다 every일이 지났으면 invest × rate (1571.6.24 마닐라가 선 뒤로는 rateSilver) — payTo까지
        마닐라 뒤 처음 받는 배당 때 진대랑이 멕시코 은화를 보여 준다
   ■ 소식: 도택민의 상소(1566.12) · 월항이 열리다(1567.3.1) · 마닐라(1571.6.24) · 은의 바다(1573.6)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/yg_*.webp
   ■ 저장: s.yuegang = { night: 'smuggle'|'petition'|'pass', caught, open: 'yes'|'no', openCool, invest, payDay, paid, silver, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var YG = G.Yuegang = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.yuegang) || {}; }
  var AMOY = 287, QUANZHOU = 175, PORTS = [287, 175];
  var D = YG.D = { nightFrom: 15650101, nightTo: 15670228, open: 15670301, openTo: 15721231, manila: 15710624 };
  var NEWS_AT = { petitionNews: 15661201, openNews: 15670301, manilaNews: 15710624, silverNews: 15730601 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.yuegang) {
      s.yuegang = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.yuegang.told[k] = 1; });
    }
    if (!s.yuegang.told) s.yuegang.told = {};
    return s.yuegang;
  }
  YG.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
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
  function has(id) { return !!(R.hasItem && R.hasItem(id)); }
  function give(id) { var s = S(); if (has(id)) return; if (!(R.addItem && R.addItem(id))) s.player.items.push({ id: id }); }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 선인이 있으면 하문·천주 통행 허가를 오늘 날짜로 (js/systems/sneak.js SN.hasPass 는 passD 로부터 365일) */
  function renewPass() { var s = S(); if (!s || !has('yg_license')) return; PORTS.forEach(function (id) { s.flags['pass' + id] = today(); s.flags['passD' + id] = s.day; }); }
  YG.renewPass = renewPass;
  function rateNow() { var k = K(); return today() >= D.manila ? (k.rateSilver || 0.4) : (k.rate || 0.25); }

  // ================================================================ 소식
  YG.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    renewPass();
    var t = today(), told = b.told, met = !!b.night || !!b.open, east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('petitionNews', east, 'scroll', '【도택민의 상소】 복건 순무 도택민이 조정에 글을 올렸다 — 「바다를 막으니 상인이 도적이 되었습니다. 길을 열면 도적이 다시 백성이 될 것입니다.」 해징 월항의 바다 장사를 허락해 달라는 청이다.' + (b.night === 'petition' ? ' 상소에는 바다 건너에서 온 한 선장의 말도 적혀 있었다고 한다.' : ''));
    news('openNews', east, 'anchor', '【월항이 열리다】 새 임금 융경제가 해징 월항의 바다 장사를 허락했다. 관아의 허가장(선인)을 받은 명나라 상선이 동양과 서양의 나라들로 나갈 수 있다. 다만 일본으로 가는 배는 여전히 막혔고, 바깥 나라의 배가 들어오는 길도 열리지 않았다. 이백 년 묵은 해금이 처음으로 틈을 냈다.');
    news('manilaNews', east, 'castle', '【마닐라】 에스파냐의 레가스피가 여송(루손) 섬의 마닐라에 도시를 세웠다. 아카풀코에서 은을 실은 배가 오고, 월항의 정크선이 비단과 도자기를 싣고 그리로 간다.');
    news('silverNews', met, 'coin', '【은의 바다】 마닐라에서 돌아온 월항의 상선들이 멕시코 은화를 싣고 온다. 복건의 시장에는 「불랑기 은」이 넘친다. 은이 바다를 건너 명나라로 흘러든다.' + (b.invest ? ' 진씨 상단의 장부에도 바다 건너의 동업자 몫이 적혀 있다.' : ''));
    return out;
  };

  // ================================================================ ① 월항의 밤배 (1565.1.1~1567.2.28)
  function nightOpen() { var b = st(), t = today(); return !!(b && !b.night && PORTS.indexOf(cityNow()) >= 0 && t >= D.nightFrom && t <= D.nightTo); }
  async function night() {
    var b = st(), s = S(), k = K(), sm = k.smuggle || {};
    var wm = !!(s.wangMerch && s.wangMerch.met);
    await withPic('yg_night', '월항의 밤배', function () { return play([
      [null, '해징현 월항. 구룡강이 바다로 나가는 갯벌. 달 없는 밤, 작은 배 수십 척이 횃불도 없이 드나든다. 비단 짐과 도자기 상자가 어깨에서 어깨로 넘어간다.'],
      ['yg_chen', '(금니를 드러내며 웃는다) 바다의 선장이시군. 해징 진씨 상단의 셋째 진대랑이오. 보다시피 우리 복건 사람은 바다 아니면 먹고살 길이 없소. 그런데 나라는 바다를 막았지. 그러니 밤에 하는 수밖에.' + (wm ? ' 금봉호의 마대인도 우리 단골이오.' : '')],
      ['yg_smuggler', '선장, 짐 칸 남았으면 이 비단 좀 실어 주쇼. 남양까지만 가 주면 값은 두둑이 쳐 드리지.'],
      [null, '그때 갯벌 너머로 등불 행렬이 다가온다. 관복 차림의 늙은 관리가 군사들을 거느리고 갯벌에 섰다. 밤배들이 숨을 죽인다.'],
      ['yg_tu', '(군사들을 손짓으로 멈추게 하고 한참 갯벌을 바라본다) …복건 순무 도택민이다. 잡으러 온 것이 아니다. 보러 왔다. 이 많은 배가 모두 도적이란 말이냐. (제독을 보고) 그대는 바다 건너에서 왔구나. 그대 나라의 바다는 어떠냐?']
    ]); });
    var catchP = sm.catch == null ? 0.35 : sm.catch;
    var v = await UI.ask('월항의 밤 — 어떻게 하겠는가?', [
      { label: '밤배의 짐을 싣는다 (금화 ' + U.num(sm.gold || 2500) + ' · 악명 · 순찰에 걸릴 수도)', value: 'smuggle', icon: 'sack' },
      { label: '순무에게 답한다 — 「막으면 도적이 되고, 열면 백성이 되오」', value: 'petition', icon: 'scroll' },
      { label: '지나친다', value: 'pass' }], me());
    b.night = v;
    if (v === 'smuggle') {
      if (U.chance(catchP)) {
        await play([[null, '짐을 옮겨 싣는 사이, 순무의 군사 하나가 횃불을 들었다 — 「거기, 서양 배다!」 군사들이 갯벌로 뛰어든다.']]);
        var r = await fight('순무의 순찰 군사', (k.foe || {}).patrol || 16, { leader: '순찰 군관' });
        b.caught = r === 'win' ? 'escaped' : 'lost';
      }
      if (b.caught === 'lost') {
        await play([[null, '짐을 반쯤 빼앗기고 간신히 배를 뺐다. 남은 비단 몫만 진대랑이 셈해 주었다.']]);
        s.player.gold += Math.round((sm.gold || 2500) / 2);
      } else s.player.gold += sm.gold || 2500;
      s.player.notoriety = (s.player.notoriety || 0) + (sm.noto || 4);
      await play([['yg_chen', '하하, 이제 그대도 월항의 밤배 식구요. 나라가 언젠가 바다를 열면, 그때는 낮에 만납시다.']]);
      log('월항의 밤배에서 밀무역 짐을 실었다.' + (b.caught === 'lost' ? ' 순찰에 걸려 짐 절반을 잃었다.' : '') + ' (악명 +' + (sm.noto || 4) + ')');
    } else if (v === 'petition') {
      await play([
        ['P', '내 나라에서도 바다를 막은 적이 있소. 그러자 바다 장사꾼들은 해적이 되었소. 길을 열고 세금을 걷으니, 해적이 다시 상인이 되었소.'],
        ['yg_tu', '(오래 고개를 끄덕이다) 막으면 도적이 되고, 열면 백성이 된다…. 왜구를 쳐도 쳐도 끝이 없는 까닭이 거기 있었구나. 그 말을 내 상소에 적겠다. 바다 건너 사람의 말이라 하면 조정이 귀를 기울일지도 모르지.']
      ]);
      var pf = fame('so', 'petition');
      log('월항 갯벌에서 복건 순무 도택민에게 「막으면 도적이 되고 열면 백성이 된다」고 답했다. 순무가 그 말을 상소에 적겠다고 했다. (사교 명성 +' + pf + ')');
    } else await play([['yg_tu', '(제독을 지나쳐 갯벌로 걸어가며) …바다 건너 사람도 말이 없구나.']]);
    refresh();
  }

  // ================================================================ ② 월항이 열리다 (1567.3.1~1572.12.31)
  function openOpen() { var b = st(), s = S(), t = today(); return !!(b && b.open !== 'yes' && !(b.openCool && s.day < b.openCool) && PORTS.indexOf(cityNow()) >= 0 && t >= D.open && t <= D.openTo); }
  async function open() {
    var b = st(), s = S(), k = K(), inv = k.invest || 4000, wm = !!(s.wangMerch && s.wangMerch.met);
    await withPic('yg_open', '월항이 열리다 (1567)', function () { return play([
      [null, '월항. 이제 대낮이다. 관아 앞에 「선인」을 받으려는 상인들이 줄을 섰다. 돛대에 관아의 깃발을 단 정크선들이 비단과 도자기를 가득 싣고 강어귀를 빠져나간다.'],
      ['yg_clerk', '배 이름, 선주, 선원 수, 가는 나라. 동양이냐 서양이냐. …일본? 안 되오. 왜놈 땅으로 가는 배는 여전히 목이 달아나오. 다음!'],
      ['yg_chen', b.night === 'smuggle' ? '(낮의 햇볕 아래서 금니를 번쩍이며) 그때 그 밤배의 선장이로군! 보시오, 이제 우리는 낮에 장사하오. 관아 도장이 찍힌 종이 한 장으로.' : b.night === 'petition' ? '그대가 순무 영감께 그 말을 한 선장이오? 순무 영감이 상소에 「바다 건너 사람의 말」이라고 적었다더군. 덕분에 이렇게 낮에 장사하오.' : '진씨 상단의 진대랑이오. 보시오, 이제 우리는 낮에 장사하오. 관아 도장이 찍힌 종이 한 장으로.'],
      ['yg_chen', '그런데 말이오 — 해금이 풀린 것은 우리가 「나가는」 길이오. 그대 같은 서양 배가 들어오는 길은 여전히 막혀 있소. 그러니 이렇게 합시다. 내 배의 동업자가 되시오. 금화를 넣으면 짐 몫의 절반을 나누고, 그대는 「진씨 상단의 동업자」로 하문과 천주에 드나들 수 있소.' + (wm ? ' 금봉호의 마대인도 이제 선인을 받았다오.' : '')]
    ]); });
    var v = await UI.ask('진씨 상단의 동업자가 되겠는가?', [
      { label: '금화 ' + U.num(inv) + '닢을 넣는다 — 월항의 선인 · 하문·천주 통행 · 배당', value: 'yes', icon: 'handshake', dis: s.player.gold < inv },
      { label: '사양한다', value: 'no' }], me());
    if (v !== 'yes' || s.player.gold < inv) { b.open = 'no'; b.openCool = s.day + 60; await play([['yg_chen', '언제든 오시오. 월항의 배는 매달 나가니.']]); return; }
    s.player.gold -= inv; b.open = 'yes'; b.invest = inv; b.payDay = s.day; b.paid = 0;
    give('yg_license'); renewPass();
    var of = fame('so', 'open');
    await play([['yg_chen', '(관아 도장이 찍힌 종이 뒷장에 붓으로 이름을 적는다) 동업 증서요. 하문이나 천주의 관원이 막거든 이걸 보이시오. 배당은 하문에 들를 때마다 셈해 드리지. 바다가 순하면 두둑할 것이오.']]);
    log('1567년 월항이 열렸다. 해징 진씨 상단에 금화 ' + U.num(inv) + '닢을 넣고 동업자가 되었다 — 「월항의 선인」으로 하문·천주에 드나들 수 있다. (사교 명성 +' + of + ')');
    UI.toast('월항의 선인 — 하문·천주 통행 · 하문에 들르면 배당', 'anchor', 6000);
    refresh();
  }

  // ================================================================ 배당 (하문)
  function payOpen() { var b = st(), s = S(), k = K(); return !!(b && b.invest && cityNow() === AMOY && has('yg_license') && today() <= (k.payTo || 16200101) && s.day - (b.payDay || 0) >= (k.every || 180)); }
  async function pay() {
    var b = st(), s = S(), k = K(), r = rateNow(), g = Math.round(b.invest * r);
    b.payDay = s.day; b.paid = (b.paid || 0) + g; s.player.gold += g;
    if (today() >= D.manila && !b.silver) {
      b.silver = 1;
      await withPic('yg_silver', '은의 바다', function () { return play([
        ['yg_chen', '(상자를 열어 보이며) 보시오. 마닐라에서 실어 온 은화요. 바다 건너 신대륙에서 캔 은이라더군. 불랑기 사람들은 비단을 사려고 은을 산처럼 싣고 오오. 이번 배당은 은으로 셈하겠소 — 두 배 가까이.']
      ]); });
    }
    log('월항 진씨 상단의 배당 — 금화 ' + U.num(g) + '닢 (지금까지 ' + U.num(b.paid) + '닢)');
    UI.toast('월항의 배당 금화 +' + U.num(g), 'coin', 4800);
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[payOpen, pay], [openOpen, open], [nightOpen, night]];
  YG.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  YG.check = async function () {
    if (YG._busy) return false; YG._busy = true;
    try { renewPass(); for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    YG._busy = false; refresh();
    return true;
  };
  YG._t = { night: night, open: open, pay: pay };
})(window.G = window.G || {});
