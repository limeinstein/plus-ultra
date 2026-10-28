/* 포토시 은광 — 은의 산과 샛별 (G.Potosi) 2026-10-29 사용자 요청
   「포토시 은광 개발 시작 이벤트 · 에스파냐와 원주민의 대립 · 원주민 여성 가운데 미인 한 명 · 그 여인을 구하는 작전」
   사람·조정값: js/data/potosi.js (G.HIST_FIG · G.MATE.chaska · G.BALANCE.potosi). 장소는 내륙 도시 포토시(225, 1545년에 생긴다).
   ■ ① 바람의 불 (1545.4.21~1546.12.31, 포토시): 밤이면 은산 비탈에 수천 개의 와이라(바람 화로)가 별처럼 빛난다.
        은맥을 처음 찾은 목동 디에고 우알파의 이야기(「포토시 — 천둥」: 「이 은은 너희가 아니라 뒤에 올 자들의 것」).
        에스파냐 광구 주인(비야로엘)의 병사들이 원주민의 화로를 걷어차며 「산의 광석은 등록한 자의 것」이라 한다 — 대립.
        화로를 지키던 처녀 차스카가 앞을 막아선다. 제독은 (가) 에스파냐 편 — 등록을 돕는다 (나) 원주민 편 — 화로를 지킨다 (다) 사이에서 말린다
        (원주민이 와이라로 녹인 은을 에스파냐 사람에게 판다 — 실제로 첫 이십여 년은 그렇게 돌아갔다).
   ■ ② 볼모 (1546.1.1~1550.12.31, 포토시 — ①을 놓쳤어도): 엔코멘데로 로드리고 데 아얄라가 쿠라카 쿠시 마이타에게 「사내 백 명을 갱도에 들이라」 하고,
        채우지 못하자 딸 차스카를 볼모로 끌고 갔다. 아버지가 제독에게 딸을 구해 달라고 한다 → 구출 작전:
        ⑴ 작전을 고른다 — 옛 잉카 갱도로 숨어든다(우알파가 길잡이 — ①에서 에스파냐 편에 섰던 제독에게는 길을 열지 않는다 · 측량이 높을수록 잘 숨는다) /
           은을 나르는 라마 행렬에 숨는다(마부에게 뇌물) / 왕실 감찰관에게 청원한다(1542년의 「새 법」 — 원주민을 종으로 부릴 수 없다 · 웅변) /
           정면으로 쳐들어간다(육상전 · 에스파냐 왕실의 신뢰 −, 악명 +)
        ⑵ 숨어들기에 성공하면 감독관 멘도와 마주친다 — 일기토. 이기면 조용히 빠져나온다. 지거나 들키면 —
        ⑶ 탈출 — 「퇴각 판」 육상전(잠입대 20명, 적의 차례를 두 번 버티면 빠져나간다)
        구하면 차스카가 동료로 합류(세공 3·과학 2·음악 2·의학 1). 실패하면 retry일 뒤 다시 (1550년이 지나면 그녀는 마을로 돌아갔다는 소식).
   ■ 소식 (만난 사람에게): 1545.4 은산(이미 G.HISTORY에 있다 — 여기서는 겹치지 않는다) · 1547 「황제의 마을」 · 1573 톨레도의 미타 · 1574 수은 아말감
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/potosi_*.webp — 개발노트에 그림 주문
   ■ 저장: s.potosi = { met, fire: 'es'|'native'|'mid'|'missed', hostage: 1, plan, tries, cool, res: 'rescued'|'gone', how, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var PO = G.Potosi = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.potosi) || {}; }
  var POTOSI = 225;
  var D = PO.D = { fireFrom: 15450421, fireTo: 15461231, hostFrom: 15460101, hostTo: 15501231, gone: 15510101, villa: 15470101, mita: 15730101, mercury: 15740601 };
  var NEWS_AT = { villa: D.villa, gone: D.gone, mita: D.mita, mercury: D.mercury };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.potosi) {
      s.potosi = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.potosi.told[k] = 1; });   // 옛 저장
    }
    if (!s.potosi.told) s.potosi.told = {};
    return s.potosi;
  }
  PO.state = st;
  function today() { return U.dateNum(S().date); }
  function atPotosi() { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && s.loc.city === POTOSI); }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function chaska(emo) { var sp = G.Legend && G.Legend.speaker ? G.Legend.speaker('chaska', emo) : { name: '차스카', lang: 3 }; return sp; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var SOLDIER = { name: '에스파냐 병사', lang: 3 }, ARRIERO = { name: '라마 몰이꾼', lang: 3 }, OIDOR = { name: '왕실 감찰관', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var who = l[0] === 'P' ? me() : l[0] === 'chaska' ? chaska(l[2]) : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function crownTrust(n) {
    if (!G.Sponsor || !G.SPONSOR) return;
    ['es_crown', 'es_peru'].forEach(function (id) { if (G.SPONSOR[id]) { var r = G.Sponsor.rel(id); if (r.met || n < 0) G.Sponsor.addTrust(r, n); } });
  }
  function notoriety(n, why) { var p = S().player; p.notoriety = (p.notoriety || 0) + n; UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }

  // ================================================================ 날마다 — 소식
  PO.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!b.met, with_ = !!row('chaska');
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('villa', met, 'castle', '【황제의 마을】 포토시에 집이 수천 채 들어섰다. 「비야 임페리알 — 황제의 마을」이라 부른다. 해발 사천 미터, 나무 한 그루 없는 고원에 사람이 몰려든다. 은산의 비탈에는 밤마다 와이라의 불이 별처럼 빛난다.');
    if (!told.gone && t >= NEWS_AT.gone && b.hostage && b.res !== 'rescued') {
      told.gone = 1; b.res = 'gone';
      out.push({ icon: 'scroll', history: true, text: '【포토시】 엔코멘데로 아얄라의 엔코미엔다(원주민을 맡아 부리는 권리)가 왕실 감찰로 거두어졌다고 한다. 볼모로 잡혀 있던 쿠라카의 딸 차스카는 아버지의 마을로 돌아갔다. …그녀를 다시 볼 일은 없을 것 같다.' });
    }
    news('mita', met, 'skull', '【산이 사람을 먹는다】 페루 부왕 프란시스코 데 톨레도가 「미타」를 세웠다. 안데스 열여섯 지방의 사내 일곱에 하나가 해마다 포토시로 끌려가 갱도에서 일한다. 은산을 사람들은 이제 「사람을 먹는 산」이라 부른다.' +
      (with_ ? ' …소식을 들은 차스카가 오래 말이 없었다. 「아버지의 마을에서도 사내들이 떠나겠군요.」' : ''));
    news('mercury', met, 'coin', '【수은】 포토시에 수은으로 은을 녹여 내는 아말감 법이 들어왔다. 우앙카벨리카의 수은 광산과 산에서 흘러내리는 물길에 세운 방아들 — 은이 다시 쏟아지기 시작했다. 와이라의 불은 하나둘 꺼져 간다.' +
      (with_ ? ' 차스카가 말했다. 「바람의 불이 꺼지면, 산은 노래를 잊을 거예요.」' : ''));
    return out;
  };

  // ================================================================ ① 바람의 불 (1545.4.21~1546.12)
  function fireOpen() { var b = st(), t = today(); return !!(b && !b.fire && atPotosi() && t >= D.fireFrom && t <= D.fireTo); }
  async function fire() {
    var b = st(), s = S(); b.met = 1;
    await withPic('potosi_wayra', '은산의 바람 화로 (1545)', function () { return play([
      [null, '포토시. 나무 한 그루 없는 고원 위로 붉은 원뿔 같은 산이 솟아 있다. 해가 지자 산비탈에 불빛이 하나둘 켜지더니, 이윽고 수천 개가 별처럼 반짝인다.'],
      ['huallpa', '와이라요. 진흙으로 빚은 바람 화로. 구멍 뚫린 화로를 바람 부는 비탈에 놓고 은 광석을 넣으면, 산바람이 불을 키워 은이 녹아 흐르지요. 에스파냐 사람들의 풀무로는 이 높은 데서 은을 못 녹여요.'],
      ['huallpa', '나는 디에고 우알파. 올봄에 길 잃은 라마를 쫓다가 밤이 되어 이 비탈에 불을 피웠는데, 아침에 보니 불 밑에 은이 녹아 흘러 있었어요. …그 은맥을 내가 찾았지요.'],
      ['huallpa', '옛날 잉카 와이나 카팍께서도 이 산을 파려 하셨대요. 그때 산에서 천둥 같은 소리가 났다지요. 「이 은은 너희 것이 아니다. 뒤에 올 자들의 것이다.」 그래서 이 산 이름이 포토시 — 천둥이 터졌다는 뜻이에요. 뒤에 올 자들이… 저 사람들이었나 봐요.'],
      [null, '그때 비탈 아래에서 고함이 들린다. 칼을 찬 에스파냐 병사들이 화로를 걷어차며 올라온다. 맨 앞의 사내가 두루마리를 펼쳐 든다.'],
      ['villarroel', '나는 후안 데 비야로엘. 이 은맥은 카스티야 국왕 폐하의 이름으로 내가 등록했다! 이 산의 광석은 등록한 자의 것이다. 인디오는 광석에 손대지 마라!'],
      ['chaska', '(화로 앞을 가로막아 서며) 이 산은 우리의 와카(신성한 것)예요. 당신들이 오기 전부터 우리는 이 바람에 기도하고, 이 불로 은을 녹였어요. 화로를 차지 마세요!', 'angry'],
      [null, '불빛에 비친 처녀의 얼굴에 병사들까지 잠깐 멈칫한다. 검은 머리를 길게 땋아 내리고 은 핀으로 망토를 여몄다. 둘레의 원주민들이 그녀를 「차스카 — 샛별」이라 부른다.'],
      ['villarroel', '(제독을 보고) 바다에서 온 사람인가? 마침 잘 됐군. 문서는 바다 건너 사람이 증인을 서야 힘이 있지. 이 인디오들에게 법을 알려 주시오.']
    ]); });
    var v = await UI.ask('은산 비탈 — 에스파냐 광구 주인과 와이라를 지키는 원주민들이 맞섰다.', [
      { label: '비야로엘의 등록을 돕는다 — 「산의 광석은 등록한 자의 것」', value: 'es', icon: 'scroll' },
      { label: '원주민 편에 서서 화로를 지킨다', value: 'native', icon: 'heart' },
      { label: '사이에서 말린다 — 「광석은 캐되, 녹이는 일은 이들에게 맡기시오」', value: 'mid', icon: 'scales' }], me());
    b.fire = v || 'mid';
    if (b.fire === 'es') {
      s.player.gold += K().esGold; crownTrust(4);
      await play([
        ['villarroel', '현명하군! 첫 은의 몫이오. 이 산 하나면 폐하의 금고가 백 년은 마르지 않을 거요.'],
        ['chaska', '(화로의 불씨를 손으로 감싸 쥐고 물러나며) …바다 사람도 결국 저들과 같군요.', 'sad'],
        ['huallpa', '(낮게) 내가 찾은 은맥이 내 것이 아니게 되었네요. 뭐, 처음부터 그랬겠지만.']
      ]);
      G.State.log('포토시 은산에서 비야로엘의 광구 등록에 증인을 섰다. (금화 +' + U.num(K().esGold) + ')');
      UI.toast('첫 은의 몫 — 금화 +' + U.num(K().esGold), 'coin', 4600);
    } else if (b.fire === 'native') {
      crownTrust(-3);
      await play([
        ['P', '이 사람들의 불을 걷어차면 당신네 은도 녹지 않소. 풀무로는 이 높이에서 불이 안 붙는다는 걸 모르시오?'],
        ['villarroel', '…흥. 오늘은 물러나지. 하지만 문서는 문서요. 다음엔 병사를 더 데려오겠소.'],
        ['chaska', '(불씨를 다시 화로에 넣으며 처음으로 웃는다) 바다 사람이 우리 편을 들다니. 이 바람이 당신을 기억할 거예요.', 'happy'],
        ['huallpa', '산 위쪽 옛 잉카 갱도는 나만 알아요. 당신 같은 사람이라면 언젠가 길을 알려 드리지요.']
      ]);
      b.friend = 1;
      var so = G.Fame.add('so', 80);
      G.State.log('포토시 은산에서 에스파냐 병사들에게 맞서 원주민의 와이라 화로를 지켰다. 화로를 지키던 처녀 차스카를 만났다. (사교 명성 +' + so + ')');
    } else {
      s.player.gold += K().midGold;
      await play([
        ['P', '갱도는 당신들이 파고, 녹이는 일은 이 사람들에게 맡기시오. 이 높이에서 은을 녹일 줄 아는 건 이들뿐이오. 녹인 은은 당신들이 사면 되지 않소.'],
        ['villarroel', '…장사꾼다운 말이군. 좋소, 녹인 은은 우리가 산다. 값은 우리가 정하지만.'],
        ['chaska', '(작게) 값을 저들이 정한다면 반쪽짜리 평화네요. 그래도 오늘 밤 화로는 꺼지지 않겠어요. 고마워요, 바다 사람.']
      ]);
      b.friend = 1;
      var so2 = G.Fame.add('so', 50);
      G.State.log('포토시 은산에서 광구 주인과 원주민 사이를 말렸다 — 원주민이 녹인 은을 에스파냐 사람이 사기로 했다. (금화 +' + U.num(K().midGold) + ' · 사교 명성 +' + so2 + ')');
    }
    refresh();
  }

  // ================================================================ ② 볼모 — 구출 작전 (1546~1550)
  function hostOpen() {
    var b = st(), t = today(); if (!b || b.res || row('chaska') || !atPotosi() || t < D.hostFrom || t > D.hostTo) return false;
    return !(b.cool && S().day < b.cool);
  }
  PO.planOpts = function () {
    var b = st(), k = K(), s = S(), o = [];
    if (b.fire !== 'es') o.push({ label: '옛 잉카 갱도로 숨어든다 — 우알파가 길잡이 (성공률 ' + Math.round(sneakP() * 100) + '%)', value: 'tunnel', icon: 'map' });   // 에스파냐 편에 섰던 제독에게 우알파는 길을 열지 않는다
    if (s.player.gold >= k.caravan) o.push({ label: '은을 나르는 라마 행렬에 숨는다 — 몰이꾼에게 금화 ' + U.num(k.caravan) + '닢 (성공률 ' + Math.round(k.caravanSneak * 100) + '%)', value: 'caravan', icon: 'coin' });
    if (s.player.gold >= k.lawCost && !b.lawTried) o.push({ label: '왕실 감찰관에게 청원한다 — 「새 법」 (금화 ' + U.num(k.lawCost) + '닢 · 성공률 ' + Math.round(lawP() * 100) + '%)', value: 'law', icon: 'scroll' });
    o.push({ label: '선원들을 이끌고 정면으로 쳐들어간다 (육상전)', value: 'storm', icon: 'sword' });
    o.push({ label: '오늘은 물러난다', value: 'wait' });
    return o;
  };
  function sneakP() { var k = K().sneak || [0.55, 0.1]; return Math.min(0.95, k[0] + k[1] * skill('survey')); }
  function lawP() { var k = K().law || [0.25, 0.2]; return Math.min(0.9, k[0] + k[1] * skill('speech')); }
  async function hostage() {
    var b = st(), s = S(), k = K(); b.met = 1;
    var first = !b.hostage; b.hostage = 1; b.tries = b.tries || 0;
    if (first) await withPic('potosi_hostage', '쿠라카의 부탁 (1546)', function () { return play([
      [null, '포토시의 원주민 마을 쪽. 무너진 돌담 앞에 붉은 망토의 노인이 지팡이를 짚고 서 있다. 둘레의 사내들은 눈이 붉다.'],
      ['kusimayta', '나는 쿠시 마이타, 카라카라 사람들의 쿠라카요. ' + (b.fire === 'native' ? '은산에서 우리 화로를 지켜 준 바다 사람이구려. 내 딸이 그대 이야기를 했소.' : b.fire === 'mid' ? '은산에서 우리와 저들 사이를 말려 준 바다 사람이구려. 내 딸이 그대 이야기를 했소.' : b.fire === 'es' ? '…은산에서 비야로엘 편에 섰던 바다 사람이구려. 그래도 이제 부탁할 곳이 바다 사람밖에 없소.' : '바다에서 온 사람이라 들었소.')],
      ['kusimayta', '엔코멘데로 로드리고 데 아얄라가 우리 마을을 맡았소. 왕이 준 권리라 하오. 그자가 사내 백 명을 내놓아 갱도에 들이라 했소. 갱도에 들어간 사내들은 돌아오지 않소. 쉰 명밖에 못 보내자 —'],
      ['kusimayta', '— 내 딸 차스카를 끌고 갔소. 「나머지 쉰 명이 올 때까지 이 아이는 내 집에 둔다.」 …그 집은 산 아래 은 방아 곁, 돌담과 병사들로 둘러싸인 저택이오.'],
      ['ayala', '(멀리 저택의 발코니에서, 바람에 실려 오는 목소리) 쿠라카! 사람이 모자라면 딸이 은을 녹이게 될 거다! 듣자니 그 계집이 녹인 은은 빛깔이 다르다더군!'],
      ['kusimayta', '바다 사람, 그대에게 부탁하오. 내 딸을 구해 주시오. 우리에겐 칼도 총도 없소. 그러나 산은 우리 편이오.']
    ]); });
    else await play([['kusimayta', '다시 와 주었구려. ' + (b.lastFail ? '저번 일 뒤로 저택의 병사가 늘었소. 그래도 딸은 아직 그 안에 있소.' : '딸은 아직 그 저택 안에 있소.')]]);
    var v = await UI.ask('차스카 구출 작전 — 어떻게 들어가겠는가?', PO.planOpts(), me());
    if (!v || v === 'wait') { b.cool = s.day + 3; G.State.log('포토시에서 쿠라카 쿠시 마이타의 딸을 구할 방법을 궁리했다.'); return; }
    b.plan = v; b.tries++;
    var ok = false;
    if (v === 'law') ok = await lawRoute();
    else if (v === 'storm') ok = await storm();
    else ok = await sneak(v);
    if (ok) await rescued(v);
    else { b.cool = s.day + (k.retry || 20); b.lastFail = 1; G.State.log('포토시에서 차스카를 구하려 했지만 실패했다. (' + (k.retry || 20) + '일 뒤 다시)'); UI.toast('구출 실패 — ' + (k.retry || 20) + '일 뒤 다시 포토시로', 'scroll', 5200); }
    refresh();
  }
  async function lawRoute() {
    var b = st(), s = S(), k = K(); b.lawTried = 1; s.player.gold -= k.lawCost;
    await play([
      [null, '포토시 광장의 감찰관 집무실. 서기가 깃펜을 들고, 증인으로 데려온 원주민 사내들이 모자를 벗어 쥐고 서 있다.'],
      ['P', '1542년 폐하께서 내리신 「새 법」에 따르면, 어떤 이유로도 원주민을 종으로 부릴 수 없습니다. 아얄라는 쿠라카의 딸을 볼모로 가두어 사람을 갱도에 들이라 강요하고 있습니다.'],
      [OIDOR, '(서류를 넘기며) …아얄라 나리 말이오? 그분은 이 도시에 은 방아를 둘이나 가진 분이오.']
    ]);
    if (U.chance(lawP())) {
      await play([
        [OIDOR, '그러나 법은 법이오. 폐하께서는 인디오를 학대하는 엔코멘데로를 그냥 두지 말라 하셨지. 증인이 이만큼이면 덮을 수가 없소. 그 처녀를 풀어 주라는 명을 내리겠소.'],
        [null, '이튿날, 감찰관의 사람들이 아얄라 저택의 문을 두드렸다. 아얄라는 얼굴이 시뻘개졌지만 왕의 도장 앞에서는 어쩔 수 없었다.']
      ]);
      return true;
    }
    await play([
      [OIDOR, '…증인이 인디오뿐이로군. 인디오의 말은 에스파냐 사람의 말 반만큼만 셈하오. 이 청원은 받을 수 없소.'],
      [null, '집무실을 나서는데, 아얄라의 감독관 멘도가 문 밖에서 웃고 있었다. 감찰관과 아얄라는 같은 식탁에서 밥을 먹는 사이였다.']
    ]);
    return false;
  }
  async function storm() {
    var s = S(), k = K(), L = G.Scenes && G.Scenes.land;
    await play([['kusimayta', '정면으로? …우리 사내들도 돌팔매를 들겠소. 저택의 병사는 칠십쯤이오.']]);
    crownTrust(-6); notoriety(2, '포토시에서 엔코멘데로의 저택을 쳤다');
    var res = 'win';
    if (L && L.landBattle) {
      var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
      try { res = await L.landBattle('아얄라 저택의 병사들', k.storm || 70, false, { kind: 'garrison', guns: true, leader: '감독관 멘도' }); }
      finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
    }
    return res === 'win';
  }
  async function sneak(how) {
    var b = st(), s = S(), k = K(), p;
    if (how === 'caravan') {
      s.player.gold -= k.caravan; p = k.caravanSneak;
      await withPic('potosi_caravan', '은을 나르는 라마 행렬', function () { return play([
        [ARRIERO, '(금화를 받아 들고) 라마 등의 짐 바구니 아래 웅크리시오. 저택 안마당까지는 들어가 드리리다. 그 뒤로는 모르는 일이오.'],
        [null, '새벽, 은 광석을 실은 라마 서른 마리가 방울을 울리며 저택 문을 지난다. 짐 바구니 틈으로 병사들의 장화가 보인다.']
      ]); });
    } else {
      p = sneakP();
      await withPic('potosi_tunnel', '옛 잉카 갱도', function () { return play([
        ['huallpa', '이 갱도는 잉카 때 판 거예요. 에스파냐 사람들은 몰라요. 산 밑으로 이어져 아얄라 저택 뒤편 우물 곁으로 나오지요. 등불은 하나만, 말은 하지 마세요.'],
        [null, '허리를 굽혀야 겨우 지나가는 굴. 천장에서 물이 떨어지고, 갈림길마다 우알파가 벽에 그은 표시를 더듬는다. 멀리서 망치 소리가 울린다 — 다른 갱도에서 일하는 사람들이다.']
      ]); });
    }
    var hidden = U.chance(p), alarm = !hidden;
    if (hidden) {
      await play([
        [null, '저택 안마당. 은 방아의 물레바퀴 소리가 발소리를 덮는다. 창고 곁 작은 방의 창살 너머로 은 핀을 꽂은 처녀가 보인다.'],
        ['chaska', '(창살에 얼굴을 대고 숨죽여) …바다 사람? 정말 왔군요. 열쇠는 감독관 멘도가 차고 있어요. 저기 — 오고 있어요!', 'surprised'],
        ['mendo', '누구냐! …바다 냄새가 나는 놈이로군. 쿠라카가 보낸 쥐새끼냐? 칼을 뽑아라. 소리 지르기 전에 끝내 주지.']
      ]);
      var res = 'win';
      if (G.Games && G.Games.duel) {
        var hs = H('mendo');
        res = await G.Games.duel({ name: '감독관 멘도', portrait: hs.portrait, look: 'captain', str: 70, atk: 11, def: 4, skill: 2, mar: 66, int: 45, cha: 30 }, { place: 'land' });
      }
      if (res === 'win') {
        await play([[null, '멘도가 쓰러지며 열쇠 꾸러미가 돌바닥에 떨어진다. 자물쇠가 열리고, 차스카가 제독의 손을 붙잡는다. 아무도 눈치채지 못했다.']]);
        b.how = how + ':quiet';
        return true;
      }
      await play([['mendo', '(피 묻은 입으로 웃으며) 거기까지다! 경비병! 경비병!'], [null, '종이 울린다. 그래도 그 틈에 차스카가 창살 틈으로 빠져나왔다. 이제 뛰어야 한다.']]);
      alarm = true;
    } else {
      await play([[null, how === 'caravan' ? '라마 한 마리가 놀라 날뛰는 바람에 짐 바구니가 뒤집혔다. 「침입자다!」' : '갱도 끝 우물가에서 물동이를 지던 하인과 눈이 마주쳤다. 「누구냐!」'], [null, '종이 울린다. 그래도 그 틈에 창고 곁 방의 문을 부수고 차스카를 끌어냈다. 이제 뛰어야 한다.']]);
    }
    return escape(alarm);
  }
  /** 탈출 — 퇴각 판 (적의 차례를 두 번 버티면 빠져나간다) */
  async function escape(alarm) {
    var b = st(), s = S(), k = K(), team = Math.min(k.team || 20, Math.max(1, s.fleet.crew));
    var n = (k.escape || [22, 45])[alarm ? 1 : 0];
    await play([['chaska', '산 쪽으로! 와이라 비탈로 가면 우리 사람들이 있어요!', 'surprised']]);
    var r = { res: 'win', left: team };
    if (G.Games && G.Games.landWar) {
      r = await G.Games.landWar({ enemy: { name: '아얄라 저택의 병사들', kind: 'garrison', n: n, leader: '감독관 멘도' }, party: team, terr: 'mountain', guns: true, hold: 2, flee: false });
    }
    var lost = Math.max(0, team - (r.left == null ? team : r.left)); s.fleet.crew = Math.max(1, s.fleet.crew - lost);
    b.how = (b.plan || 'sneak') + ':escape';
    if (r.res === 'win') return true;
    await play([[null, '비탈 아래에서 병사들이 길을 막았다. 차스카가 다시 끌려가는 것을 보며 물러설 수밖에 없었다.'], ['chaska', '(멀어지며) 다시 와요! 바람이 길을 알려 줄 거예요!', 'sad']]);
    return false;
  }
  async function rescued(how) {
    var b = st(), s = S(), c = G.CITY_DATA && G.CITY_DATA[POTOSI];
    b.res = 'rescued'; b.cool = null;
    await withPic('potosi_star', '샛별 (1546)', function () { return play([
      [null, how === 'law' ? '아얄라 저택의 문이 열리고, 은 핀을 꽂은 처녀가 걸어 나온다. 마을 사람들이 길가에 늘어서 그녀의 이름을 부른다.' : '와이라 비탈. 수천 개의 바람 화로 불빛 사이로 카라카라 사람들이 달려 내려와 차스카를 끌어안는다. 뒤쫓던 병사들은 불빛 속의 사람 수를 보고 걸음을 멈췄다.'],
      ['kusimayta', '(딸의 얼굴을 두 손으로 감싸고) …바다 사람, 그대에게 무엇으로 갚아야 하오.'],
      ['chaska', '아버지. 저는 이제 이 마을에 있을 수 없어요. 아얄라는 다시 저를 찾을 거예요. 그러면 마을이 또 다쳐요.'],
      ['chaska', '(제독을 바라보며) 우알파 아저씨가 그랬어요. 이 산 너머에는 끝이 없는 물이 있다고. 저는 그 바다가 보고 싶어요. 은 빛깔을 보는 눈과 바람을 부르는 노래밖에 없지만… 데려가 주시겠어요?', 'shy'],
      ['kusimayta', '…산은 이제 저들의 것이 되었구나. 가거라, 샛별아. 바다 사람의 배라면 바람이 너를 지켜 줄 거다.']
    ]); });
    var nm = G.Legend && G.Legend.join ? G.Legend.join('chaska', c) : null;
    if (nm) nm.loyal = 90;
    var so = G.Fame.add('so', 160), bt = how === 'storm' ? G.Fame.add('bt', 80) : 0;
    G.State.log('포토시에서 엔코멘데로 아얄라에게 볼모로 잡힌 쿠라카의 딸 차스카를 구했다' + (how === 'law' ? ' — 왕실 감찰관의 명으로.' : how === 'storm' ? ' — 저택을 정면으로 쳐서.' : '.') + ' 차스카가 바다를 보고 싶다며 배에 올랐다. (사교 명성 +' + so + (bt ? ' · 전투 명성 +' + bt : '') + ')');
    UI.toast('차스카 — 세공 3 · 과학 2 · 음악 2 · 의학 1 (' + (G.wageNote ? G.wageNote('chaska') : '') + ')', 'heart', 5600);
    if (G.Audio) G.Audio.sfx('cheer');
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  PO.pending = function () {
    if (!S()) return false;
    var b = st(), t = today();
    if (b && !b.fire && t > D.fireTo) b.fire = 'missed';
    return fireOpen() || hostOpen();
  };
  PO.check = async function () {
    if (PO._busy) return false; PO._busy = true;
    try { if (fireOpen()) await fire(); else if (hostOpen()) await hostage(); } catch (e) { console.error(e); }
    PO._busy = false;
    return true;
  };
  PO.html = function () {
    var s = S(), b = s && s.potosi; if (!b || !b.hostage || b.res || row('chaska')) return '';
    var t = today(); if (t > D.hostTo) return '';
    var when = b.cool && s.day < b.cool ? ' (' + (b.cool - s.day) + '일 뒤)' : '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">은의 산 — 차스카 구출</h4><ul><li>' + U.esc('포토시 — 아얄라의 저택에 붙잡힌 쿠라카의 딸 차스카를 구한다 (1550년까지)' + when) + '</li></ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._potosiHtml) { G.Court._potosiHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + PO.html(); }; }
  PO._t = { fire: fire, hostage: hostage, escape: escape, sneakP: sneakP, lawP: lawP };
})(window.G = window.G || {});
