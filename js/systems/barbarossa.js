/* 하이레딘 파샤(바르바로사)의 습격 — 툴롱의 겨울과 제노바의 협상 (G.Barb) 2026-10-18
   ■ 조건: 1542년이 끝날 때까지 카를 5세(카스티야 국왕 카를로스 1세 · 신성 로마 황제 카를 5세)와 신뢰 40 이상이고 귀족 작위(어느 나라든)가 있으면 열린다.
   ■ 흐름
     ① 1543년 3월~10월, 카를 5세의 왕궁(세빌리아 · 비엔나)에 들면 황제가 부른다 — 1540년 하이레딘에게 대제독·북아프리카 부왕 자리를 내밀었다 거절당한 일,
        1541년 알제 원정의 대패, 프랑스 왕과 손잡은 오스만 함대가 니스를 치고 툴롱에서 겨울을 난다는 소식. 툴롱을 살피고 이듬해 봄 제노바에서 안드레아 도리아를 도우라.
     ② (골라서) 1543년 9월~1544년 5월 툴롱 앞바다에 가면: 이슬람 도시가 된 툴롱 — 시난 파샤·소콜루 메메드·피얄레가 맞고, 하이레딘이 배에 불러 형 오루츠 이야기와
        「쉴레이만을 배신하지 않는다」는 말을 들려준다. (살펴 두면 제노바의 싸움에서 적 배가 하나 줄어든다)
     ③ 1544년 4월~7월 제노바에 들면: 하이레딘의 함대가 앞바다에 와 있다. 4년째 도리아의 갤리선에서 노를 젓는 투르구트 레이스를 풀어 주지 않으면 도시를 치겠다고 한다.
        도리아 가문의 궁전에서 안드레아 도리아와 하이레딘이 마주 앉는다 — 제독은 (가) 몸값 3,500두카트의 절반을 보태 협상을 돕거나 (나) 협상을 깨고 바다에서 싸우거나
        (다) 지켜본다. 역사대로라면 3,500두카트에 투르구트가 풀려난다.
     ④ 1544년 9월 황제와 술탄이 휴전 — 하이레딘은 코스탄티니예로 돌아간다. 1546년 7월 하이레딘이 세상을 떠나고, 미마르 시난이 베식타시에 무덤을 짓는다
        (이 일에 함께한 제독이 그 뒤 이스탄불에 들르면 미마르 시난이 무덤 이야기를 들려준다).
   ■ 인물: js/data/histfigures.js (hayreddin · oruc · sokollu · sinan · piyale · mimar · charles · turgut · adoria)
   ■ 저장: state.barb = {ok, stage: 'call'|'declined'|'genoa'|'done'|'missed', toulon, genoa: 'pay'|'fight'|'watch'|'won'|'lost', tomb} */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var BB = G.Barb = {};
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; return s.barb || (s.barb = {}); }
  function dn(d) { return d.y * 10000 + d.m * 100 + d.d; }
  function today() { return dn(S().date); }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function play(lines) { return G.Hist ? G.Hist.play(lines) : Promise.resolve(); }
  var K = { trust: 40, callFrom: 15430301, callTo: 15431031, toulonFrom: 15430901, toulonTo: 15440531, genoaFrom: 15440401, genoaTo: 15440731, ransom: 3500, share: 1750, tombFrom: 15460801 };
  BB.K = K;
  var TOULON = [5.5, 6.4, 42.75, 43.3];     // 툴롱 앞바다 [경도 서, 동, 위도 남, 북]
  var GENOA = 28, ISTANBUL = 112;
  function charlesSponsors() { return ['es_crown', 'de_emperor'].map(function (id) { return G.SPONSOR[id]; }).filter(Boolean); }
  function isCharles(sp) { return !!(sp && G.Sponsor && /카를/.test(G.Sponsor.holder(sp) || '') && ['es_crown', 'de_emperor'].indexOf(sp.id) >= 0); }
  /** 카를 5세와 신뢰 40 이상 + 귀족 작위 */
  function qualified() {
    var s = S(); if (!s || !G.Sponsor) return false;
    var trust = charlesSponsors().some(function (sp) { var r = s.sponsors && s.sponsors[sp.id]; return isCharles(sp) && r && r.met && (r.trust || 0) >= K.trust; });
    var titled = !!(G.Court && G.Court.titles && G.Court.titles().length);
    return trust && titled;
  }
  BB.qualified = qualified;
  function inBox(b) { var l = S().loc; return !!(l && l.mode === 'sea' && l.lon >= b[0] && l.lon <= b[1] && l.lat >= b[2] && l.lat <= b[3]); }

  // ================================================================ 날마다
  BB.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    hookCourt();
    var t = today();
    if (!b.ok && t <= 15421231 && qualified()) b.ok = 1;                    // 1542년이 끝날 때까지 조건을 갖췄다
    if (b.stage === 'call' && t >= K.genoaFrom && !b.toldGenoa) { b.toldGenoa = 1; out.push({ icon: 'cannon', history: true, text: '【바르바로사】 하이레딘 파샤가 툴롱을 떠나 티레니아해를 휩쓸고 있다. 에스파냐·나폴리 함대가 깨지고 이탈리아 해안의 마을들이 불탔다 — 그의 함대가 제노바로 향한다는 소문이다. (7월까지 제노바로)' }); }
    if (b.stage === 'call' && t > K.genoaTo) { b.stage = 'missed'; out.push({ icon: 'scroll', text: '제노바의 일은 제독 없이 끝났다. 안드레아 도리아가 3,500두카트를 받고 투르구트 레이스를 풀어 주었고, 하이레딘의 함대는 제노바를 치지 않고 떠났다고 한다.' }); }
    if (t >= 15440918 && !b.toldTruce && (b.stage === 'done' || b.stage === 'missed')) { b.toldTruce = 1; out.push({ icon: 'handshake', history: true, text: '【크레피 화약】 황제와 프랑스 왕이 화약을 맺었다. 하이레딘 파샤는 오스만 함대를 이끌고 툴롱을 떠나 코스탄티니예로 돌아갔다. 툴롱 사람들이 집으로 돌아온다.' }); }
    if (t >= 15460704 && !b.toldDeath && (b.met || b.stage === 'done')) { b.toldDeath = 1; out.push({ icon: 'scroll', history: true, text: '【하이레딘 파샤의 죽음】 「붉은 수염」 하이레딘 파샤가 코스탄티니예의 저택에서 세상을 떠났다. 술탄의 건축가 미마르 시난이 베식타시 바닷가에 그의 무덤을 짓는다고 한다.' }); }
    return out;
  };

  // ================================================================ ① 황제의 부름 (1543)
  BB.callDue = function (sp) { var b = st(); return !!(b && b.ok && !b.stage && isCharles(sp) && today() >= K.callFrom && today() <= K.callTo); };
  async function charlesCall(sp) {
    var b = st(), s = S(), w = G.Sponsor.speaker(sp); w.lang = 3; w.li = null;
    await UI.say('왔구려, 제독. 그대의 이름에 붙은 작위가 헛된 것이 아니라면, 오늘 내 이야기를 끝까지 들어 주시오.', w);
    await UI.say('세 해 전, 나는 하이레딘에게 사람을 보냈소. 이쪽으로 넘어오면 내 함대의 대제독으로 삼고 북아프리카 전부를 다스리는 부왕으로 봉하겠다고. …그 늙은 해적은 웃기만 했다더군. 쉴레이만이 베푼 은덕을 배신할 생각은 털끝만큼도 없다면서.', w);
    await UI.say('그래서 그 이듬해 가을, 내가 몸소 알제를 치러 갔소. 폭풍이 배 백오십 척을 바위에 내던졌고, 비에 젖은 화약은 터지지 않았지. …황제가 진흙탕에서 물러나는 꼴을 온 지중해가 보았소.', w);
    await UI.say('이제 그 하이레딘이 프랑스 왕과 손을 잡았소. 지난여름 레조를 불태우고, 프랑스 군대와 함께 니스를 에워쌌지. 그리고 이 겨울 — 프랑수아는 툴롱의 주민을 모두 내보내고 그 항구를 통째로 오스만 함대에 내주었다는군. 툴롱의 종탑에서 아잔이 울린다는 거요!', w);
    await UI.say('봄이 오면 그자는 다시 티레니아해로 나올 것이오. 안드레아 도리아가 제노바를 지키고 있소. 그대는 툴롱을 살펴 그자의 배와 사람을 알아 오고, 봄에는 제노바로 가서 도리아를 도와주시오.', w);
    var v = await UI.ask(G.Sponsor.holderName(sp) + '가 하이레딘 바르바로사에 맞서 달라고 청한다 (툴롱 앞바다 1543년 9월~1544년 5월 · 제노바 1544년 4월~7월)', [
      { label: '폐하의 바다를 지키겠습니다', value: 'yes' }, { label: '그 늙은 해적과는 엮이고 싶지 않습니다 — 사양한다', value: 'no' }], w);
    if (v !== 'yes') { b.stage = 'declined'; await UI.say('…그렇다면 하는 수 없지. 바다의 일은 도리아에게 맡기겠소.', w); return; }
    b.stage = 'call';
    G.Sponsor.addTrust(G.Sponsor.rel(sp.id), 5);
    await UI.say('고맙소. 툴롱 앞바다(프로방스 해안)는 겨울 동안, 제노바는 봄부터 여름까지요. 도리아에게는 내가 편지를 보내 두겠소.', w);
    G.State.log('카를 5세의 청으로 하이레딘 바르바로사에 맞서기로 했다 — 툴롱 앞바다를 살피고, 1544년 봄 제노바에서 안드레아 도리아를 돕는다.');
    UI.toast('툴롱 앞바다 (1543년 9월~1544년 5월) · 제노바 (1544년 4월~7월)', 'cannon', 6500);
  }
  function hookCourt() {
    var CT = G.Court; if (!CT || CT._barb) return; CT._barb = true;
    var onEnter = CT.onEnter;
    CT.onEnter = async function (sp) {
      try { if (BB.callDue(sp)) { await charlesCall(sp); return; } } catch (e) { console.error(e); }
      return onEnter.apply(this, arguments);
    };
  }

  // ================================================================ ② 툴롱의 겨울 (1543~1544)
  function toulonOpen() { var b = st(); return !!(b && b.stage === 'call' && !b.toulon && today() >= K.toulonFrom && today() <= K.toulonTo && inBox(TOULON)); }
  async function toulon() {
    var b = st(); b.toulon = 1; b.met = 1;
    await play([
      [null, '툴롱 앞바다. 항구에는 갤리선 백여 척이 빼곡하고, 성당 종탑 대신 첨탑처럼 세운 장대에서 아잔이 울려 퍼진다. 프랑스 사람은 보이지 않는다 — 이 겨울, 툴롱은 이슬람 도시다.'],
      ['sinan', '거기 서라, 프랑크의 배! …에스파냐의 깃발이 아니로군. 무슨 일로 대제독의 항구에 다가오나?'],
      ['sokollu', '시난 파샤, 이 제독의 이름은 이스탄불의 바자르에서도 들었습니다. 해치려 왔다면 저렇게 깃발을 내걸고 오지 않았겠지요.'],
      ['piyale', '대제독께서 그 배의 주인을 보고 싶어 하십니다. 갤리선으로 모시라는 분부입니다.'],
      ['hayreddin', '허허, 겁 없는 손님이로군. 이리 앉으시오. 내 수염이 붉을 때였다면 그대 배는 벌써 내 것이 되었을 거요.'],
      ['hayreddin', '나는 레스보스 섬 옹기장이의 아들이오. 형 오루츠와 함께 맨손으로 바다에 나섰지.'],
      [null, '— 1518년, 틀렘센. 에스파냐 군에 에워싸인 오루츠 레이스.'],
      ['oruc', '하이레딘, 알제를 지켜라. 나는 여기서 저들을 붙잡아 두마. …우리 형제는 바다에서 왔으니, 바다로 돌아가면 그만이다.'],
      ['hayreddin', '…형은 그날 돌아오지 못했소. 그 뒤로 알제를 지키려고 술탄 셀림 폐하께 무릎을 꿇었고, 쉴레이만 폐하께서 나를 대제독으로 세우셨지.'],
      ['hayreddin', '카를이 내게 대제독 자리와 북아프리카를 내밀었다지? 그대가 그 황제의 편지를 들고 왔다면 돌아가 전하시오 — 은혜를 베푼 이를 배신하는 바르바로사는 없다고.'],
      ['hayreddin', '봄이 오면 나는 제노바로 간다. 도리아의 갤리선에서 노를 젓는 내 아이, 투르구트를 데려와야 하니까. 그대가 그곳에 있다면… 바다에서 다시 봅시다.']
    ]);
    G.State.log('툴롱 앞바다에서 하이레딘 파샤의 함대를 살폈다. 하이레딘이 갤리선에 불러 형 오루츠의 이야기를 들려주었다.');
    UI.toast('툴롱의 오스만 함대를 살폈다 — 제노바의 싸움에서 도움이 된다', 'eye', 5000);
  }

  // ================================================================ ③ 제노바 (1544)
  function genoaOpen() { var b = st(), s = S(); return !!(b && b.stage === 'call' && today() >= K.genoaFrom && today() <= K.genoaTo && s.loc.mode === 'city' && s.loc.city === GENOA); }
  async function genoa() {
    var b = st(), s = S(); b.stage = 'genoa'; b.met = 1;
    await play([
      [null, '제노바 앞바다를 하이레딘의 갤리선들이 메우고 있다. 성벽 위의 사람들이 숨을 죽인다.'],
      ['adoria', '왔구려, 황제 폐하께서 편지에 적으신 그 제독이로군. 마침 잘 왔소. 저 늙은 해적이 내 집 앞까지 왔소.'],
      ['adoria', '네 해 전, 내 조카 자네티노가 코르시카에서 투르구트 레이스를 사로잡았소. 그 뒤로 투르구트는 내 갤리선에서 노를 젓고 있지. 하이레딘은 그를 풀어 주지 않으면 이 도시를 불태우겠다고 하오.'],
      ['adoria', '…그런데 그자가 내 궁전에서 마주 앉자는 청을 받아들였소. 함께 들어갑시다.'],
      [null, '— 도리아 가문의 궁전. 은빛 수염의 두 노제독이 긴 탁자를 사이에 두고 앉는다.'],
      ['hayreddin', '안드레아, 프레베자 이후로 처음이구려. 그때 당신은 바람 탓을 했지.'],
      ['adoria', '하이레딘, 그때의 바람은 당신 편이었소. 오늘의 바람은 누구 편일지 모르지. …투르구트 이야기를 합시다.'],
      ['turgut', '(쇠사슬을 찬 채로) 대제독…! 이 손목의 자국을 보시오. 네 해 동안 저 사람들의 노를 저었소.'],
      ['hayreddin', '3,500두카트. 그 돈이면 갤리선 노꾼 백 명을 사오. 이 사람 하나를 돌려주면 제노바의 지붕에는 불똥 하나 떨어지지 않을 것이오.'],
      ['adoria', '……']
    ]);
    var opts = [];
    if (s.player.gold >= K.share) opts.push({ label: '몸값의 절반(금화 ' + U.num(K.share) + '닢)을 보태 협상을 매듭짓는다', value: 'pay' });
    opts.push({ label: '해적과 거래할 수 없다 — 협상을 깨고 바다에서 싸운다', value: 'fight' }, { label: '두 노제독에게 맡기고 지켜본다', value: 'watch' });
    var v = await UI.ask('제노바의 협상 — 소지금 ' + U.num(s.player.gold) + '닢', opts, H('adoria'));
    if (v === 'pay' && s.player.gold >= K.share) {
      s.player.gold -= K.share; b.genoa = 'pay';
      await play([
        ['adoria', '…좋소. 제독이 절반을 대겠다니 나도 체면이 서는구려. 3,500두카트에 투르구트를 돌려주겠소.'],
        ['turgut', '(사슬이 풀린 손목을 문지르며) 이 은혜는 잊지 않겠소, 제독. …허나 바다에서 다시 만나면 그때는 다른 이야기요.'],
        ['hayreddin', '하하! 도리아의 집에서 이렇게 웃게 될 줄이야. 제독, 그대 덕에 오늘 이 도시는 불타지 않았소.']
      ]);
      var so = G.Fame.add('so', 400), bt = G.Fame.add('bt', 100);
      trustUp(10); if (G.Sponsor && G.SPONSOR.it_doria) G.Sponsor.addTrust(G.Sponsor.rel('it_doria'), 15);
      done('제노바의 협상을 매듭지었다 — 몸값 ' + U.num(K.share) + '닢을 보태 투르구트 레이스가 풀려나고 제노바는 불타지 않았다. (사교 명성 +' + so + ' · 전투 명성 +' + bt + ')');
      return;
    }
    if (v === 'fight') {
      b.genoa = 'fight';
      await play([
        ['adoria', '…제독! 그대가 그리 말한다면 나도 갤리선을 내겠소. 하지만 저 해적의 함대는 만만치 않소.'],
        ['hayreddin', '(일어서며) 그렇다면 바다에서 봅시다. 투르구트, 조금만 더 노를 저어라. 오늘 해가 지기 전에 데리러 오마.']
      ]);
      if (G.Rel) { var spec = genoaSpec(); G.Rel.register(spec); var go = await G.Rel.greatBattle(spec); if (!go) { b.genoa = 'watch'; await watchEnd(); } }
      return;
    }
    b.genoa = 'watch';
    await watchEnd();
  }
  async function watchEnd() {
    await play([
      ['adoria', '…3,500두카트. 받아들이겠소. 투르구트를 데려가시오.'],
      ['turgut', '네 해 만의 바닷바람이로군. 도리아, 다음에는 내가 그대의 배를 끌고 가겠소.'],
      ['hayreddin', '제독, 그대는 오늘 지켜보기만 했구려. 바다에서는 지켜보는 자가 가장 오래 살지.']
    ]);
    var so = G.Fame.add('so', 80);
    done('제노바의 협상을 지켜보았다. 안드레아 도리아가 3,500두카트를 받고 투르구트 레이스를 풀어 주었다. (사교 명성 +' + so + ')');
  }
  function trustUp(n) { charlesSponsors().forEach(function (sp) { if (isCharles(sp)) G.Sponsor.addTrust(G.Sponsor.rel(sp.id), n); }); }
  function done(text) { var b = st(); b.stage = 'done'; G.State.log(text); UI.toast(text, 'scroll', 6500); if (G.Game.refreshHud) G.Game.refreshHud(); }
  var GENOA_BATTLE = {
    id: 'barb_genoa', foe: '오스만 제국', foeLabel: '하이레딘 파샤의 함대',
    allies: [{ type: 'galley', name: '도리아의 기함 (안드레아 도리아)' }, { type: 'galley', name: '제노바 갤리선' }, { type: 'galley', name: '나폴리 갤리선' }],
    who: { hist: 'adoria' }, intro: '', ask: '제노바 앞바다 — 안드레아 도리아의 갤리선과 함께 하이레딘 파샤의 함대에 맞서겠습니까?',
    gunK: 0.85, crewK: 0.9,
    boss: { hist: 'hayreddin', str: 70, mar: 86, int: 80, cha: 78, line: '이 붉은 수염이 아직 칼을 놓지 않았다는 걸 보여 주마!' },
    win: { fame: 700, gold: 12000, so: 150, text: '제노바 앞바다에서 하이레딘 파샤의 함대를 물리쳤다! 늙은 대제독은 배를 돌렸고, 투르구트 레이스는 도리아의 갤리선에 남았다.' },
    lose: '제노바 앞바다에서 물러났다. 하이레딘은 끝내 3,500두카트에 투르구트를 데려갔다.',
    decline: '…그대가 물러난다면 나도 무리하지 않겠소. 결국 돈으로 매듭지어야겠군.',
    onWin: function () { var b = st(); b.genoa = 'won'; b.stage = 'done'; trustUp(15); if (G.SPONSOR.it_doria) G.Sponsor.addTrust(G.Sponsor.rel('it_doria'), 20); },
    onLose: function () { var b = st(); b.genoa = 'lost'; b.stage = 'done'; }
  };
  function genoaSpec() {
    var b = st(), spec = Object.assign({}, GENOA_BATTLE);
    var ships = [['galley', '하이레딘 파샤의 기함'], ['galley', '시난 파샤의 갤리선'], ['galley', '소콜루 메메드의 갤리선'], ['galley', '피얄레의 갤리선'], ['galliot', '알제의 갤리엇'], ['galley', '로도스의 갤리선'], ['galliot', '해적 갤리엇']];
    if (!G.SHIP.galliot) ships = ships.map(function (x) { return ['galley', x[1]]; });
    if (b.toulon) ships = ships.slice(0, 6);   // 툴롱에서 살펴 두었다: 하이레딘의 배와 진을 안다
    spec.ships = ships.map(function (x) { return x[0]; }); spec.names = ships.map(function (x) { return x[1]; });
    spec.council = [['adoria', '저들의 갤리선은 가볍고 빠르오. 붙으면 예니체리가 뛰어든다는 걸 잊지 마시오. 바람을 잡고 포로 먼저 두들기시오!']].concat(b.toulon ? [['adoria', '그대가 툴롱에서 저들의 배를 살펴 두었다니 든든하구려. 어느 배가 약한지 아니, 저들의 진이 우리에게 훤히 보이오.']] : []);
    spec.foeScene = [[null, '— 하이레딘 파샤의 기함.'], ['sinan', '대제독, 도리아의 갤리선이 나옵니다. 저 프랑크의 배도 함께요!'], ['hayreddin', '좋다. 투르구트를 데려가는 길이 조금 길어졌을 뿐이다. 노를 저어라!']];
    return spec;
  }

  // ================================================================ ④ 미마르 시난과 바르바로사의 무덤 (1546~)
  function tombOpen() { var b = st(), s = S(); return !!(b && b.met && !b.tomb && today() >= K.tombFrom && s.loc.mode === 'city' && s.loc.city === ISTANBUL); }
  async function tomb() {
    var b = st(); b.tomb = 1;
    await play([
      ['mimar', '그대가 툴롱과 제노바에서 대제독을 만났다는 그 제독이시오? 베식타시 바닷가로 가 봅시다. 대제독의 무덤을 내가 짓고 있소.'],
      ['mimar', '대제독께서는 바다가 보이는 자리에 묻히고 싶어 하셨소. 그래서 배들이 이스탄불로 드나들 때마다 이 무덤 앞을 지나도록 지었지요. 뱃사람들이 지날 때마다 대포를 쏘아 인사할 것이오.'],
      ['mimar', '여덟 모의 돔 아래 「붉은 수염」이 잠들어 계시오. …그대도 바다를 떠돌다 이 앞을 지나거든, 대포 한 방쯤 쏘아 드리시오.']
    ]);
    var so = G.Fame.add('so', 60);
    G.State.log('이스탄불에서 미마르 시난의 안내로 베식타시의 하이레딘 파샤 무덤을 보았다. (사교 명성 +' + so + ')');
  }

  // ================================================================ 바다의 하루 끝 · 도시에 들어설 때
  BB.pending = function () { var b = S() && S().barb; return !!(b && (toulonOpen() || genoaOpen() || tombOpen())); };
  BB.check = async function () {
    if (BB._busy) return false; BB._busy = true;
    try {
      if (toulonOpen()) await toulon();
      else if (genoaOpen()) await genoa();
      else if (tombOpen()) await tomb();
    } catch (e) { console.error(e); }
    BB._busy = false;
    return true;
  };
  /** 수첩 줄 */
  BB.html = function () {
    var b = S() && S().barb; if (!b || b.stage !== 'call') return '';
    var out = [];
    if (!b.toulon && today() <= K.toulonTo) out.push('1543년 9월~1544년 5월 툴롱 앞바다(프로방스 해안)에서 하이레딘의 함대를 살핀다 (골라서)');
    out.push('1544년 4월~7월 제노바에서 안드레아 도리아를 돕는다');
    return '<div class="sep"></div><h4 style="margin:0 0 8px">카를 5세의 청 — 바르바로사</h4><ul>' + out.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  hookCourt();
  if (G.Court && G.Court.taskHtml && !G.Court._barbHtml) { G.Court._barbHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + BB.html(); }; }
})(window.G = window.G || {});
