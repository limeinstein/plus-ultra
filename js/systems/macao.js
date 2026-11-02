/* 포르투갈의 마카오 거점 (G.Macao) 2026-11-01 사용자 요청 — 사람·소지품·조정값: js/data/macao.js
   ■ ① 광동의 약조 (1553.6.1~1557.5.31, 광주에 다가갈 때 — js/scenes/sea.js): 레오넬 드 소자의 배가 다가와 해도부사 왕백과의 담판에 제독을 청한다
        (가) 선물을 바친다(금화 gift — 반드시 맺어진다) (나) 말로 설득(화술·매력) (다) 지금은 아니다 → 약조: 「짐의 절반에 2할」 · 광주에 들어갈 수 있는 허가첩
   ■ ② 아마항의 해적 (약조 pirateGap일 뒤~1557.12.31, 광주): 왕백이 향산 앞바다의 해적 떼를 청한다 → 큰 해전 (끝나면 광주로) — 지면 다시 청할 수 있다
   ■ ③ 땅을 빌리다 (1557.1.1~, 광주 또는 오문): 「아마항 반도에 집을 짓고 살아도 좋다 — 해마다 은 오백 냥」 (해적을 쳤어야)
   ■ ④ 오문의 첫 집들 (오문): 마조각의 늙은 어부 · 「아마가오」라는 이름 · 예수회의 첫 성당 → 명성 · 포르투갈 제독은 작위 한 칸, 다른 나라 제독은 몫(금화)
   ■ 허가첩을 가지고 있으면 광주의 통행 허가를 날마다 다시 써 준다 (js/systems/sneak.js 의 passD)
   ■ 소식: 상천도의 사비에르(1552.12.3) · 소자의 약조(1554.10 — 함께하지 않았으면) · 관갑(1573) · 마테오 리치(1582.8.7)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/macao_*.webp
   ■ 저장: s.macao = { met, deal: 'gift'|'talk', dealDay, cool, pirates: 'won'|'lost', waitSaid, grant, settle, title, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MC = G.Macao = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.macao) || {}; }
  var CANTON = 174, MACAO = 173;
  var D = MC.D = { from: 15530601, dealTo: 15570531, grant: 15570101, end: 15571231 };
  var NEWS_AT = { xavier: 15521203, sousa: 15541001, gate: 15730101, ricci: 15820807 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.macao) {
      s.macao = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.macao.told[k] = 1; });
    }
    if (!s.macao.told) s.macao.told = {};
    return s.macao;
  }
  MC.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var WHO = { P: me, F: first, X: function () { return G.Legend && G.MATE.xavier ? G.Legend.speaker('xavier') : { name: '사비에르', lang: 3 }; } };
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
  function has(id) { return !!(R.hasItem && R.hasItem(id)); }
  function give(id) { var s = S(); if (has(id)) return; if (!(R.addItem && R.addItem(id))) s.player.items.push({ id: id }); }
  /** 허가첩이 있으면 광주 통행 허가를 오늘 날짜로 (js/systems/sneak.js SN.hasPass 는 passD 로부터 365일) */
  function renewPass() { var s = S(); if (!s || !has('macao_chop')) return; s.flags['pass' + CANTON] = today(); s.flags['passD' + CANTON] = s.day; }
  MC.renewPass = renewPass;
  function talkP() {
    var k = K().talk || {}, p = S().player;
    return U.clamp((k.base || 0.3) + (R.skill ? R.skill('speech') || 0 : 0) * (k.speech || 0.15) + ((p.st && R.stat('cha')) || 50) / 100 * (k.cha || 0.25), 0.05, 0.95);
  }
  MC.talkP = talkP;

  // ================================================================ 소식
  MC.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    renewPass();
    var t = today(), told = b.told, east = !!b.met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('xavier', east || !!row('xavier'), 'book', row('xavier')
      ? '【상천도】 광동 앞바다의 상천도에 중국 땅을 바라보며 기다리던 예수회 신부가 있었다는 소문은 거짓이었다. 프란시스코 사비에르는 여전히 제독의 배에서 기도하고 있다.'
      : '【상천도】 예수회 신부 프란시스코 사비에르가 광동 앞바다의 작은 섬 상천도에서 숨을 거두었다. 바다 건너 중국 땅을 날마다 바라보며, 들어갈 배를 기다리다 열병에 쓰러졌다.');
    news('sousa', east && !b.deal, 'scroll', '【광동의 약조】 포르투갈의 레오넬 드 소자가 광동 해도부사 왕백과 약조를 맺었다. 포르투갈 배는 짐의 절반에 2할을 세금으로 내고 광주 교역에 든다고 한다.');
    news('gate', east || !!b.settle, 'castle', '【관갑】 명나라가 오문 반도의 목에 담과 문을 세웠다. 문은 열흘에 한 번만 열리고, 쌀과 물은 그 문으로만 오간다. ' + (b.settle ? '제독이 처음 보았던 짚지붕 마을은 이제 돌로 지은 성당과 창고의 도시가 되었다.' : '오문의 포르투갈 사람들은 명의 허락 안에서만 산다.'));
    news('ricci', east || !!b.settle, 'book', '【마테오 리치】 이탈리아의 예수회 신부 마테오 리치가 오문에 닿았다. 중국말과 글을 배워 명나라 땅 안으로 들어가겠다고 한다. 오문은 이제 유럽과 중국을 잇는 문이 되었다.');
    return out;
  };

  // ================================================================ ① 광동의 약조 (광주에 다가갈 때)
  function dealOpen(c) {
    var b = st(), t = today(); if (!b || !c || c.id !== CANTON || b.deal || t < D.from || t > D.dealTo) return false;
    return !(b.cool && S().day < b.cool);
  }
  MC.beforePort = async function (c) {
    if (!dealOpen(c) || MC._busy) return false;
    MC._busy = true;
    try { await deal(); } catch (e) { console.error(e); }
    MC._busy = false;
    return false;   // 약조를 맺었으면 허가첩으로, 아니면 늘 하던 대로 성문에서
  };
  async function deal() {
    var b = st(), s = S(), k = K(); b.met = 1;
    await withPic('macao_sousa', '광동 앞바다 (1554)', function () { return play([
      [null, '주강 어귀. 붉은 돛의 명나라 순찰선들이 강목을 막고 있다. 그 곁으로 포르투갈 깃발을 단 범선 한 척이 다가와 작은 배를 내린다.'],
      ['mc_leonel', '레오넬 드 소자요. 국왕 폐하께서 맡기신 중국 항해의 사령관이지. 우리 포르투갈 사람들은 서른 해째 이 해안에서 쫓겨 다니고 있소. 해적 취급을 받아서.'],
      ['mc_leonel', '광동의 해도부사 왕백이 오늘 저 순찰선에 타고 있소. 광주 교역을 열어 달라 청할 참인데 — 중국 관리 앞에서 말을 해 줄 사람이 하나 더 있으면 좋겠소. 함께 가 주겠소?'],
      [null, '순찰선 갑판. 비단 관복의 관리가 부채를 펴 든 채 이방인들을 내려다본다.'],
      ['mc_wangbo', '번인(蕃人)들이 또 왔는가. 너희는 몇 해 전 남의 땅에 성을 쌓고 아이를 사 갔다는 소문이 있다. 무엇을 믿고 광주의 문을 열어 달라는 것이냐.']
    ]); });
    var p = talkP();
    var v = await UI.ask('해도부사 왕백이 묻는다 — 무엇을 믿고 문을 열어 달라는가', [
      { label: '「예를 갖추겠습니다」 — 선물을 바친다 (금화 ' + U.num(k.gift) + '닢)', value: 'gift', icon: 'coin', dis: s.player.gold < k.gift },
      { label: '「세금을 내고 법을 따르겠습니다」 — 말로 설득한다 (' + Math.round(p * 100) + '%)', value: 'talk', icon: 'scroll' },
      { label: '「오늘은 물러나겠습니다」', value: 'no' }], me());
    if (v === 'gift' && s.player.gold >= k.gift) {
      s.player.gold -= k.gift;
      await play([[null, '상자 뚜껑이 열리자 용연향과 은 그릇이 반짝인다. 관리의 부채가 조금 느리게 부쳐진다.'], ['mc_wangbo', '…번인도 예를 아는구나.']]);
    } else if (v === 'talk') {
      if (!U.chance(p)) {
        b.cool = s.day + (k.talkCool || 30);
        await play([['mc_wangbo', '말은 그럴싸하다만, 번인의 말을 어찌 믿겠느냐. 돌아가라.'], ['mc_leonel', '(작게) 오늘은 틀렸소. 달이 바뀌면 다시 와 봅시다.']]);
        log('광동 해도부사 왕백을 설득하지 못했다. 한 달 뒤에 다시 와 볼 수 있다.');
        return;
      }
      await play([['P', '우리는 성을 쌓으러 온 것이 아니오. 짐을 사고팔러 왔소. 명의 법대로 세금을 내고, 해적을 만나면 함께 치겠소. 해안이 조용해지면 광동의 곳간도 차지 않겠소?'],
        ['mc_wangbo', '(부채를 접으며) …해적을 함께 친다. 그 말은 기억해 두마.']]);
    } else {
      b.cool = s.day + 10;
      await play([['mc_leonel', '그렇소? 아쉽구려. 생각이 바뀌면 다시 이 강목으로 오시오.']]);
      return;
    }
    b.deal = v; b.dealDay = s.day;
    await play([
      ['mc_wangbo', '좋다. 번선은 짐의 절반을 헤아려 그 2할을 세로 낸다. 그러면 광주의 교역에 들 수 있다. 다만 성 안에서 칼을 뽑는 자는 그날로 쫓겨날 것이다.'],
      [null, '관리가 붉은 관인을 찍은 종이 한 장을 내준다. 레오넬이 그것을 받아 들고 한참 들여다보다 웃는다.'],
      ['mc_leonel', '서른 해 만에 처음이오. 해적이 아니라 손님으로 이 강을 거슬러 오르는 건. 이 종이는 그대가 지니시오 — 그대가 아니었으면 받지 못했을 것이오.']
    ]);
    give('macao_chop'); renewPass();
    var f = fame('so', 'deal');
    log('광동 해도부사 왕백과 레오넬 드 소자 사이의 약조를 도왔다 — 「짐의 절반에 2할」. 광동 해도의 통상 허가첩을 받았다. (사교 명성 +' + f + ')');
    UI.toast('광동 해도의 통상 허가첩 — 광주에 들어갈 수 있다', 'scroll', 5600);
    refresh();
  }

  // ================================================================ ② 아마항 앞바다의 해적
  function piratesOpen() {
    var b = st(), t = today(); if (!b || !b.deal || b.pirates === 'won' || cityNow() !== CANTON || t > D.end) return false;
    return S().day - (b.dealDay || 0) >= (K().pirateGap || 20);
  }
  function pirateSpec() {
    var ships = ['ljunk', 'junk', 'junk', 'shachuan', 'sekibune', 'sekibune', 'kobaya'];
    return { id: 'macao_pirates', foe: '해적', ships: ships, names: ['해적 두목 하아팔의 큰 정크', '흑기 정크', '갈매기 정크', '소금 밀매선', '왜구의 관선', '왜구의 관선 둘째', '척후 소조'],
      foeLabel: '향산 앞바다의 해적 떼', allies: [{ type: 'carrack', name: '레오넬 드 소자의 범선', gun: 'culverin' }, { type: 'ljunk', name: '광동 수군의 전선', gun: 'saker' }],
      who: { hist: 'mc_wangbo' },
      intro: '번인. 약조 때 「해적을 함께 친다」고 했지. 향산 앞바다 아마항의 섬 그늘에 해적 떼가 숨어 상선을 턴다. 왜구도 섞였다. 우리 수군은 배가 느리다. 너희 배의 대포로 저것들을 쓸어 준다면 — 조정에 아뢰겠다.',
      ask: '향산 앞바다 — 해적 떼를 치겠는가?', fightLabel: '친다 — 「약조를 지키겠소」', noLabel: '아직은 아니다', decline: '…약조는 말뿐이었더냐. 생각이 바뀌면 다시 오너라.',
      gun: 'perrier', gunK: 0.8, crewK: 1.1, gunNote: '해적의 정크는 붙어서 뛰어든다 — 큰 포로 멀리서 부수시오. 두목의 큰 정크를 꺾으면 나머지는 흩어진다.',
      win: { fame: (K().fame || {}).pirates || 200, gold: 1500, text: '향산 앞바다의 해적 떼를 쓸어 냈다. 광동의 바닷길이 조용해졌다.' },
      lose: '향산 앞바다에서 해적 떼에 밀려 물러났다.',
      center: { lon: 113.62, lat: 22.12 }, backCity: CANTON, place: '향산 앞바다',
      onWin: function () { var b = st(); if (b) b.pirates = 'won'; }, onLose: function () { var b = st(); if (b && b.pirates !== 'won') b.pirates = 'lost'; } };
  }
  MC.pirateSpec = pirateSpec;
  async function pirates() {
    var s = S(), sp = pirateSpec();
    if (!G.Rel || !G.Rel.greatBattle) return;
    G.Rel.register(sp);
    if (s.rel && s.rel.battle) delete s.rel.battle[sp.id];   // 물러났거나 졌어도 다시 청할 수 있게
    await G.Rel.greatBattle(sp);
  }

  // ================================================================ ③ 땅을 빌리다 · ④ 오문의 첫 집들
  function grantOpen() { var b = st(), c = cityNow(); return !!(b && b.pirates === 'won' && !b.grant && (c === CANTON || c === MACAO) && (today() >= D.grant || !b.waitSaid)); }
  async function grant() {
    var b = st(), t = today();
    if (t < D.grant) {
      if (!b.waitSaid) { b.waitSaid = 1; await play([['mc_wangbo', '해적을 친 일은 북경에 아뢰었다. 조정의 답이 오려면 해가 바뀌어야 할 것이다. 정사년(1557)이 되면 다시 오너라.']]); }
      return;
    }
    b.grant = 1;
    await play([
      ['mc_wangbo', '조정의 뜻이다. 향산현 남쪽 끝, 마조각 앞의 반도 — 바다 사람들이 「아마항」이라 부르는 곳이다. 번인들은 그곳에 집을 짓고 살아도 좋다. 해마다 지대로 은 오백 냥을 바쳐라.'],
      ['mc_wangbo', '다만 그 땅은 대명의 땅이다. 너희는 빌려 사는 손님일 뿐임을 잊지 마라.'],
      ['mc_leonel', '(제독의 손을 붙잡고) 들었소? 땅이오, 땅! 리스본에 이 소식이 닿으면 폐하께서 무어라 하실지. …아마항으로 갑시다. 그대가 첫 집의 문지방을 넘어야 하오.']
    ]);
    log('광동 해도부사 왕백이 조정의 뜻을 전했다 — 아마항 반도에 집을 짓고 살아도 좋다 (해마다 지대 은 오백 냥).');
    if (cityNow() === MACAO) await settle();
    else UI.toast('오문(아마항)으로 — 광주 남쪽 주강 어귀', 'map', 5000);
  }
  function settleOpen() { var b = st(); return !!(b && b.grant && !b.settle && cityNow() === MACAO); }
  async function settle() {
    var b = st(), s = S(), k = K(); b.settle = 1;
    await withPic('macao_first', '아마항의 첫 집들 (1557)', function () { return play([
      [null, '반도의 바위 언덕 아래, 짚으로 지붕을 인 오두막 몇 채가 섰다. 포르투갈 선원들이 돛천을 걷어 벽을 두르고, 그 곁에 작은 나무 십자가가 꽂혔다.'],
      [null, '언덕 기슭에는 오래된 사당이 있다. 바다의 여신 마조(媽祖)를 모신 마조각이다. 향 연기가 바닷바람에 길게 흩어진다.'],
      ['mc_fisher', '(그물을 내려놓고) 이방인 나리들, 여기가 어디냐고 물으셨소? 마조각 앞의 포구 — 「마각(媽閣)」이오. 우리는 「아마의 항구」라고도 하오.'],
      ['mc_leonel', '아-마-가오… 마카오! 좋소, 이곳은 이제 마카오요. 하느님의 이름의 마카오 — 리스본의 왕에게 그렇게 써 보내겠소.']
    ]); });
    if (row('xavier')) await play([['X', '(작은 십자가 앞에 무릎을 꿇고) 상천도에서 바라보기만 하던 중국 땅의 문턱이 여기 있습니다. 이 문으로 언젠가 누군가는 북경까지 걸어 들어갈 것입니다.']]);
    else await play([[null, '십자가 곁에 선 젊은 예수회 수사가 중얼거린다. 「사비에르 신부님이 상천도에서 바라보던 땅이 여기 있습니다.」']]);
    await play([['mc_leonel', '일본의 은과 중국의 비단, 인도의 후추가 이 포구에서 만날 것이오. 고아에서 나가사키까지 — 이 짚지붕들이 그 길의 한가운데요.']]);
    var f = fame('ex', 'settle'), so = G.Fame.add('so', 80);
    var CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms.PT, tt = null;
    if (CT && realm && CT.isHome(realm)) {
      var c = CT.state(), n = CT.rank(realm) + 1; tt = CT.title(realm, n);
      if (tt) {
        c.titles[realm.id] = n; b.title = tt.ko;
        await UI.alert('<div class="center"><div style="font-size:17px" class="muted">포르투갈 · 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div>마카오에 첫 거점을 연 공으로</div></div>', '작위');
        UI.toast((CT.fullName ? CT.fullName(tt, true) : tt.ko) + ' — 포르투갈 국왕의 작위', 'crown', 6000);
      }
    }
    if (!tt) { s.player.gold += k.share || 3000; b.title = 'share'; UI.toast('마카오의 첫 교역 몫 — 금화 +' + U.num(k.share || 3000), 'coin', 5000); }
    log('아마항(마카오)의 첫 집들이 섰다. 중국과 유럽을 잇는 포구의 문지방을 넘었다. (탐험 명성 +' + f + ' · 사교 명성 +' + so + ')' + (b.title && b.title !== 'share' ? ' 포르투갈 국왕이 작위를 내렸다 — ' + b.title + '.' : ''));
    if (G.Audio) G.Audio.sfx('discover');
    refresh();
  }

  // ================================================================ 도시에 들어설 때
  var STEPS = [[settleOpen, settle], [grantOpen, grant], [piratesOpen, pirates]];
  MC.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  MC.check = async function () {
    if (MC._busy) return false; MC._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    MC._busy = false; refresh();
    return true;
  };
  MC._t = { deal: deal, pirates: pirates, grant: grant, settle: settle, dealOpen: dealOpen };
})(window.G = window.G || {});
