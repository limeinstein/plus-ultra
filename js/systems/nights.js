/* 천일야화의 세 이야기 (G.Nights) — 2026-11-08 사용자 요청. 사람·조정값: js/data/nights.js (G.BALANCE.nights)
   ■ 세 이야기 모두 셰헤라자드가 해금되어야 시작된다 (동료로 맞았거나 맞은 적이 있다: s.legend.sche.done) — 알라딘·알리바바와 같다 (2026-11-09)
   ■ ① 신드바드의 모험 (s.nights.sinbad.step)
     0 → 바스라(명성 minFame 이상 · 바스라와 콜롬보에 다녀온 적이 있다 — 콜롬보를 아직 못 가 봤으면 한 번 귀띔): 늙은 신드바드가 「마지막으로 한 번 더」 세렌디브까지 태워 달라 한다 — 태운다 / 사양(again일 뒤)
     1 → 오만 앞바다(whale.box, 바다의 하루 끝): 섬인 줄 알고 상륙 — 고래였다 · (가) 닻줄을 끊고 달아난다(선체 hpCut · 선원 crewLeft가 고래 등에 남는다) (나) 물에 빠진 선원을 다 건진다(선체 hpSave · 식량 food일)
     2 → 라카디브 바다(roc.box): 하얀 둥근 지붕 — 로크의 알 · (가) 알은 두고 깃털만 줍는다(로크의 깃털) (나) 선원들이 알을 깬다(로크가 바위를 떨어뜨린다: 선체 hp · 선원 crew, 대신 알 껍데기 값 보석)
     3 → 콜롬보(세렌디브): 산속 다이아몬드 골짜기 · (가) 신드바드의 꾀 — 고깃덩이를 던진다(식량 food일 → 보석 gemsMeat통 · 큰 다이아몬드) (나) 골짜기로 내려간다(뭍의 싸움 army, 뱀 → 보석 gemsDive통 · 큰 다이아몬드) (다) 보기만 한다
       → 신드바드가 동료가 되기를 청한다(항해술 3). 사양하면 세렌디브에 남는다.
   ■ ② 하룬 알 라시드의 밤 산책 (s.nights.harun)
     바그다드(명성 minFame 이상 · 귀족 작위가 하나라도 있다 G.Court.best())의 밤 술집 — 모술에서 왔다는 상인 셋이 건달들에게 둘러싸였다
       (가) 술값을 대신 낸다(금화 pay) (나) 건달들과 맞선다(뭍의 싸움 thugs) (다) 말로 달랜다(웅변 speech 이상) (라) 모른 척한다(again일 뒤)
     → 다음 날 황금 문의 궁: 상인은 칼리프 하룬 알 라시드, 동행은 대신 자파르 · 영예의 옷 · 금화 gift · 후원자 ar_harun(신뢰 trust)
       후원자 ar_harun 은 이 일이 있기 전에는 자리에 없다(G.Sponsor.present 를 감싼다)
   ■ ③ 흑단 말 (s.nights.ebony.step)
     0 → 시라즈(명성 minFame 이상 · 운용술 ops·과학 sci 를 함께 지닌 동료 · 매력 cha 이상인 제독이나 동료 — 모자라면 한 번 귀띔): 왕자 카마르와 날지 못하는 흑단 말
         (가) 그 동료가 고친다 (나) 지금은 못 한다(다시 오면)
       → 왕자가 동료가 되어 함께 간다 · 흑단 말의 태엽 열쇠
     1 → 이스파한: 늙은 현자가 공주를 「미친 아내」라며 성주에게 바쳤다 · (가) 의원 행세(의학 med 이상이거나 왕자의 꾀) (나) 성주의 궁에 쳐들어간다(뭍의 싸움 army) (다) 때를 기다린다(again일 뒤)
       → 공주 나디라 알 사나니를 흑단 말에 태워 구한다 · 진주 목걸이 · 공주도 「다른 궁에 갇히러 돌아가지는 않겠다」며 동료가 된다 (왕자와 함께 배에 남는다)
   ■ 장면 그림: images/legend-events/an_* — NIGHTS_PROMPT.md */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var N = G.Nights = {};
  function K() { return G.BALANCE.nights; }
  function S() { return G.Game && G.Game.state; }
  function st() {
    var s = S(); if (!s) return null;
    if (!s.nights) s.nights = {};
    var n = s.nights; n.sinbad = n.sinbad || { step: 0 }; n.harun = n.harun || {}; n.ebony = n.ebony || { step: 0 };
    return n;
  }
  N.state = st;
  function today() { return U.dateNum(S().date); }
  function num(n) { return U.num(Math.round(n)); }
  function log(t) { G.State.log(t); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function fameNow() { return G.Fame ? G.Fame.get() : (S().player.fame || 0); }
  function giveItem(id) { if (!(R.addItem && R.addItem(id) !== false)) S().player.items.push({ id: id }); }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { var s = S(); return !!(s.flags && s.flags['gone_' + id]); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : null; return { lv: (b && b.lv) || 0, who: (b && b.who) || S().player.name }; }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function live(m) { return m && G.MATE[m.id] && !(R.mateHidden && R.mateHidden(m)); }
  /** 셰헤라자드가 해금되었나 — 지금 동료이거나, 동료로 맞은 적이 있다 */
  function scheOK() { var s = S(); return !!(row('scheherazade') || (s.legend && s.legend.sche && s.legend.sche.done)); }
  N.scheOK = scheOK;
  function visited(id) { var v = S().visited; return !!(v && v[id]); }
  function titled() { return !!(G.Court && G.Court.best && G.Court.best()); }
  /** 흑단 말을 고칠 동료 — 운용술과 과학을 함께 지닌 사람 */
  function fixer() { var k = K().ebony; return (S().mates || []).filter(function (m) { return live(m) && R.mateSkill(m, 'ops') >= k.ops && R.mateSkill(m, 'sci') >= k.sci; })[0] || null; }
  /** 매력이 cha 이상인 사람 — 제독이 먼저 { name, v } */
  function charmer() {
    var k = K().ebony, p = S().player, pv = ((p.st && p.st.cha) || 0) + (R.statBonus ? R.statBonus('cha') : 0);
    if (pv >= k.cha) return { name: p.name, v: pv, me: true };
    var best = null; (S().mates || []).forEach(function (m) { if (!live(m)) return; var v = R.mateStats ? R.mateStats(m).st[3] : (G.MATE[m.id].st || [])[3]; if (v >= k.cha && (!best || v > best.v)) best = { name: G.MATE[m.id].name, v: v }; });
    return best;
  }
  N.fixer = fixer; N.charmer = charmer;
  /** 이야기가 시작될 수 있나 (도시는 빼고) — 소문과 수첩용 */
  N.ready = function (key) {
    if (!st() || !scheOK()) return false;
    var k = K()[key], b = st()[key];
    if (key === 'sinbad') return b.step === 0 && !row('sinbad') && !gone('sinbad') && fameNow() >= k.minFame && visited(k.city) && visited(k.end);
    if (key === 'harun') return !b.done && fameNow() >= k.minFame && titled();
    if (key === 'ebony') return b.step === 0 && !row('qamar') && !gone('qamar') && fameNow() >= k.minFame && !!fixer() && !!charmer();
    return false;
  };
  function inBox(box) { var l = S().loc; return !!(l && l.mode === 'sea' && l.lon != null && l.lon >= box[0] && l.lon <= box[1] && l.lat >= box[2] && l.lat <= box[3]); }
  function cool(o) { return !(o.cool > S().day); }
  function later(o) { o.cool = S().day + (K().again || 180); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    if ((k === 'sinbad' || k === 'qamar' || k === 'nadira') && row(k) && G.Legend && G.Legend.speaker) return G.Legend.speaker(k);
    if (k === 'keeper') return { name: '술집 주인', portrait: G.Art.withImg(G.Art.npcSpec('an_keeper', 'merchant', 'is', 'm'), []), lang: 3 };
    if (k === 'thug') return { name: '건달 두목', portrait: G.Art.withImg(G.Art.npcSpec('an_thug', 'soldier', 'is', 'm'), []), lang: 3 };
    return G.Hist ? G.Hist.speaker('an_' + k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(6, Math.round(n)), !!(o && o.beasts), Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 짐칸에 싣는다 — 실은 수량 (못 실은 몫은 부른 쪽이 값으로 바꾼다) */
  function load(id, q, cityId) {
    var s = S(), c = s.fleet.cargo = s.fleet.cargo || {};
    if (!c[id] && R.maxKinds && Object.keys(c).length >= R.maxKinds()) return 0;
    var room = G.Cargo && G.Cargo.room ? G.Cargo.room(id) : R.free(); q = Math.max(0, Math.min(q, Math.floor(room))); if (!q) return 0;
    var cg = c[id];
    if (cg) { R.addCargoLot(cg, cityId, q, 0); cg.cost = Math.round((cg.cost * cg.q) / (cg.q + q)); cg.q += q; }
    else { c[id] = { q: q, cost: 0, from: cityId, d: s.day, lots: {} }; c[id].lots[cityId] = { q: q, cost: 0 }; }
    return q;
  }
  function gems(n, cityId) { var got = load('gems', n, cityId), rest = (n - got) * (G.GOOD.gems ? G.GOOD.gems.p : 210); if (rest) S().player.gold += rest; return { got: got, gold: rest }; }
  function hurtShips(k) { S().fleet.ships.forEach(function (sh) { sh.hp = Math.max(1, Math.round(sh.hp - sh.maxHp * k)); }); }
  function loseCrew(k) { var s = S(), n = Math.min(Math.max(0, s.fleet.crew - 1), Math.round(s.fleet.crew * k)); if (n > 0) { s.fleet.crew -= n; if (R.syncCrew) R.syncCrew(); } return n; }
  function joinMate(id, msg) {
    var nm = G.Legend && G.Legend.join ? G.Legend.join(id, G.CITY_DATA[cityNow()] || null) : null;
    if (!nm && !row(id)) { nm = { id: id, role: 'none', joined: today(), loyal: 85 }; S().mates.push(nm); }
    if (nm) nm.loyal = Math.max(nm.loyal || 0, 85);
    if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    log(msg); UI.toast(msg, 'heart', 5600);
  }

  // ================================================================ ① 신드바드의 모험
  function sbOpen() {
    var b = st().sinbad, k = K().sinbad, c = cityNow();
    if (!G.MATE.sinbad || row('sinbad') || gone('sinbad')) return null;
    if (b.step === 0 && c === k.city && cool(b) && fameNow() >= k.minFame && scheOK()) { if (visited(k.end)) return 'sbStart'; if (!b.hinted) return 'sbHint'; }
    if (b.step === 3 && c === k.end) return 'sbValley';
    return null;
  }
  function sbSea() {
    var b = st().sinbad, k = K().sinbad; if (row('sinbad') || gone('sinbad')) return null;
    if (b.step === 1 && inBox(k.whale.box)) return 'sbWhale';
    if (b.step === 2 && inBox(k.roc.box)) return 'sbRoc';
    return null;
  }
  /** 콜롬보(세렌디브)에 가 본 적이 없으면 — 한 번 귀띔 */
  N.sbHint = async function () {
    var b = st().sinbad; b.hinted = 1;
    await play([[null, '바스라 강가의 큰 저택 앞. 문간에 앉은 노인이 제독의 배를 오래 바라보다 묻는다.'],
      ['sinbad', '선장, 세렌디브에 가 본 적 있소? …없다고? 그럼 아직은 내 이야기를 들려줄 때가 아니구려. 콜롬보 항구의 계피 냄새를 맡고 오시오. 그때 다시 이 문을 두드리면 일곱 번의 항해 이야기를 해 주리다.']]);
    UI.toast('뱃사람 신드바드: 콜롬보(세렌디브)에 다녀온 선장이어야 함께 간다', 'info', 5600);
    refresh(); return true;
  };
  N.sbStart = async function () {
    var b = st().sinbad;
    await withPic('an_sinbad_house', '뱃사람 신드바드의 집 (바스라)', function () { return play([
      [null, '바스라, 샤트 알 아랍 강가의 큰 저택. 대문 앞 그늘에 짐꾼 하나가 쉬고 있는데, 안에서 웃음소리와 비파 소리가 흘러나온다. 제독을 알아본 하인이 안으로 모신다.'],
      ['sinbad', '어서 오시오, 바다의 손님! 나는 신드바드 — 사람들은 뱃사람 신드바드라 부르지. 일곱 번 바다로 나가 일곱 번 배를 잃고, 일곱 번 부자가 되어 돌아왔소.'],
      ['sinbad', '첫 항해에선 섬인 줄 알고 고래 등에 내려 불을 피웠고, 둘째 항해에선 로크라는 새의 다리에 터번으로 몸을 묶고 날아 다이아몬드 골짜기에 떨어졌지. 셋째엔 사람을 잡아먹는 거인, 다섯째엔 바다의 노인…'],
      ['sinbad', '여섯째 항해 끝에 닿은 곳이 세렌디브였소. 그곳 왕이 칼리프께 보내는 선물을 내게 맡겼지. 그 뒤로 다시는 바다에 나가지 않겠다 맹세했는데…'],
      ['sinbad', '(창밖의 돛대를 바라보며) …다리가 근질거려 견딜 수가 없소. 제독, 나를 세렌디브까지 태워 주시오. 내가 간 길을 그대로 밟아 가며, 내 이야기가 거짓이 아니었다는 걸 보여 주리다.']
    ]); });
    var v = await UI.ask('뱃사람 신드바드', [{ label: '신드바드를 태우고 세렌디브로 간다', value: 'go' }, { label: '사양한다', value: 'no' }], who('sinbad'));
    if (v !== 'go') { later(b); await play([['sinbad', '하하, 그대도 내 이야기를 믿지 않는구려. 괜찮소. 바다는 기다릴 줄 아니까.']]); refresh(); return true; }
    b.step = 1; b.cool = 0;
    await play([['sinbad', '좋소! 첫 자리는 오만 앞바다요. 내 첫 항해 때, 푸른 풀이 덮인 섬 하나가 거기 떠 있었지. …그대 선원들에게 불은 피우지 말라고 일러두시오.']]);
    log('바스라에서 뱃사람 신드바드를 만났다. 그가 일곱 번의 항해 길을 다시 밟으며 세렌디브(실론)까지 함께 간다. 첫 자리는 오만 앞바다.');
    UI.toast('신드바드의 모험 — 첫 자리: 오만 앞바다', 'map', 5600);
    refresh(); return true;
  };
  N.sbWhale = async function () {
    var b = st().sinbad, k = K().sinbad.whale, s = S();
    await withPic('an_whale', '섬이 된 고래', function () { return play([
      [null, '오만 앞바다. 해도에 없는 낮은 섬이 물 위에 떠 있다. 등성이에 푸른 이끼와 풀이 덮였고, 조개껍데기가 반짝인다. 선원들이 환호하며 보트를 내린다. 누군가 벌써 냄비와 장작을 들고 내린다.'],
      ['sinbad', '(얼굴이 하얗게 질려) 안 돼, 불은 안 돼—!'],
      [null, '늦었다. 장작에 불이 붙자 섬이 크게 떨렸다. 땅이 기울며 거대한 꼬리가 바다를 내리친다. 섬은 잠에서 깬 고래였다. 선원들이 비명을 지르며 물로 뛰어든다.']
    ]); });
    var v = await UI.ask('고래가 깨어났다', [
      { label: '닻줄을 끊고 곧바로 달아난다', value: 'cut' },
      { label: '물에 빠진 선원들을 끝까지 건진다', value: 'save' }], who('sinbad'));
    var lost = 0;
    if (v === 'save') {
      hurtShips(k.hpSave); s.fleet.food = Math.max(0, (s.fleet.food || 0) - Math.ceil(R.dailyUse() * k.food));
      await play([[null, '고래가 몸부림치는 사이, 보트를 몇 번이고 내려 물에 빠진 사람을 하나도 남김없이 건졌다. 꼬리에 맞은 뱃전이 크게 부서졌다.'],
        ['sinbad', '(물에 젖은 함지박을 끌어안은 선원을 보며) 나는 그때 저 함지박 하나에 매달려 며칠을 떠다녔소. 그대는 좋은 선장이오.']]);
    } else {
      hurtShips(k.hpCut); lost = loseCrew(k.crewLeft);
      await play([[null, '도끼로 닻줄을 끊고 돛을 올렸다. 배는 고래의 꼬리를 피해 빠져나왔지만, 몇 사람은 고래 등에 남겨진 채 바닷속으로 사라졌다.'],
        ['sinbad', '(한참 바다를 바라보다가) …내 첫 항해 때도 그랬소. 바다는 섬인 척하는 것을 좋아하지.']]);
    }
    b.step = 2; b.how = b.how || {}; b.how.whale = v;
    await play([['sinbad', '다음은 남쪽, 인도 서쪽 바다의 작은 섬들. 거기서 나는 하얗고 둥근 지붕을 보았소 — 문도 창도 없는.']]);
    log('오만 앞바다에서 섬인 줄 알고 상륙했다가 고래였음을 알았다.' + (v === 'save' ? ' 물에 빠진 선원을 모두 건졌다.' : ' 닻줄을 끊고 달아났다' + (lost ? ' — 선원 ' + lost + '명을 잃었다.' : '.')) + ' 다음은 라카디브 바다.');
    UI.toast('신드바드의 모험 — 다음: 라카디브 바다', 'map', 5200);
    refresh(); return true;
  };
  N.sbRoc = async function () {
    var b = st().sinbad, k = K().sinbad.roc;
    await withPic('an_roc', '로크의 알', function () { return play([
      [null, '라카디브 바다의 작은 산호섬. 야자나무 사이에 하얗고 둥근 것이 솟아 있다. 둘레가 쉰 걸음은 되고, 문도 창도 없다. 손바닥으로 두드리면 속이 빈 소리가 난다.'],
      ['sinbad', '로크의 알이오. 둘째 항해 때 나는 이 알 옆에서 잠들었다가, 내려앉은 어미 새의 다리에 터번으로 몸을 묶었지. 다섯째 항해 땐… 함께 간 상인들이 이 알을 깨서 새끼를 구워 먹었소.'],
      [null, '하늘이 갑자기 어두워진다. 구름인가 했더니, 날개다. 섬 위를 거대한 새 그림자가 천천히 돈다. 바닷가에 돛대만큼 긴 깃털 하나가 떨어져 있다.'],
      ['first', '제독, 저 알 껍데기만 갖고 가도 상아보다 비싸게 팔릴 겁니다. 선원들이 벌써 도끼를 들었습니다!']
    ]); });
    var v = await UI.ask('로크의 알', [
      { label: '알은 그대로 두고 깃털만 주워 간다', value: 'feather' },
      { label: '선원들이 알을 깨게 둔다', value: 'break' }], who('sinbad'));
    var g = null, lost = 0;
    if (v === 'break') {
      hurtShips(k.hp); lost = loseCrew(k.crew); g = gems(8, 155);
      await play([[null, '도끼질 몇 번에 알이 갈라졌다. 그 순간 하늘에서 천둥 같은 울음. 로크 두 마리가 발톱에 집채만 한 바위를 움켜쥐고 내려꽂는다. 바위 하나가 뱃전을 스치고 바다로 떨어지며 배가 크게 기울었다.'],
        ['sinbad', '(돛대를 끌어안고) 그러니까 내가 말했잖소! 다섯째 항해와 똑같구려!']]);
    } else {
      giveItem('an_roc_feather');
      await play([[null, '선원들을 불러들이고 깃털 한 가닥만 배에 실었다. 섬을 떠날 때, 어미 로크가 알 위에 내려앉아 날개를 접는 것이 보였다.'],
        ['sinbad', '현명하오. 다섯째 항해의 상인들도 그대 같았다면 살아 돌아왔을 텐데.']]);
    }
    b.step = 3; b.how = b.how || {}; b.how.roc = v;
    await play([['sinbad', '그날 밤 로크는 동쪽으로 날아갔소. 세렌디브의 산 쪽으로. 다이아몬드 골짜기는 거기 있지 — 콜롬보에 닿거든 산으로 갑시다.']]);
    log('라카디브 바다에서 거대한 새 로크의 알을 보았다.' + (v === 'break' ? ' 선원들이 알을 깨자 로크가 바위를 떨어뜨렸다' + (lost ? ' (선원 ' + lost + '명을 잃었다)' : '') + ' — 알 껍데기를 보석 값으로 챙겼다.' : ' 알은 두고 깃털만 주워 왔다.') + ' 다음은 세렌디브, 콜롬보.');
    UI.toast('신드바드의 모험 — 다음: 콜롬보 (세렌디브)', 'map', 5200);
    refresh(); return true;
  };
  N.sbValley = async function () {
    var b = st().sinbad, k = K().sinbad.valley, s = S(), need = Math.ceil(R.dailyUse() * k.food), foodOk = (s.fleet.food || 0) >= need, got = null;
    await withPic('an_valley', '다이아몬드 골짜기 (세렌디브)', function () { return play([
      [null, '세렌디브. 콜롬보에서 사흘을 걸어 아담의 봉우리가 구름 위로 솟은 산속에 들어섰다. 깎아지른 절벽 아래, 햇빛이 닿는 골짜기 바닥이 별처럼 반짝인다. 그 반짝임 사이로 기둥처럼 굵은 뱀들이 느릿느릿 기어 다닌다.'],
      ['sinbad', '저기요, 다이아몬드 골짜기! 아무도 내려갈 수 없는 곳이지. 그래서 이곳 사람들은 꾀를 냈소 — 양을 잡아 고깃덩이를 골짜기로 던지면, 다이아몬드가 고기에 박히지. 그걸 큰 독수리가 물고 올라오면 소리를 질러 쫓아내고 다이아몬드만 줍는 거요.'],
      ['sinbad', '나는 둘째 항해 때 그 고깃덩이에 몸을 묶고 독수리에게 실려 올라왔다오. 하하! 자, 제독은 어떻게 하겠소?']
    ]); });
    var v = await UI.ask('다이아몬드 골짜기', [
      { label: '신드바드의 꾀 — 고깃덩이를 던진다 (식량 ' + k.food + '일분)', value: 'meat', dis: !foodOk },
      { label: '밧줄을 타고 골짜기로 내려간다', value: 'dive' },
      { label: '보기만 하고 돌아간다', value: 'look' }], who('sinbad'));
    if (v === 'meat' && foodOk) {
      s.fleet.food -= need; got = gems(k.gemsMeat, 155); giveItem('an_valley_diamond');
      await play([[null, '절벽 위에서 고깃덩이를 던지자 한참 뒤 독수리들이 하나둘 고기를 물고 날아올랐다. 선원들이 냄비를 두드리며 소리치자 독수리가 고기를 떨어뜨린다. 고기마다 반짝이는 돌이 박혀 있다. 그 가운데 하나는 주먹만 했다.']]);
    } else if (v === 'dive') {
      await play([[null, '밧줄을 타고 골짜기 바닥에 내려서자, 바위 그늘마다 뱀들이 고개를 쳐든다.']]);
      var res = await fight('다이아몬드 골짜기의 큰 뱀들', k.army, { beasts: true });
      if (res === 'win') { got = gems(k.gemsDive, 155); giveItem('an_valley_diamond'); await play([[null, '뱀들을 물리치고 골짜기 바닥의 다이아몬드를 자루 가득 쓸어 담았다. 그 가운데 하나는 주먹만 했다.']]); }
      else await play([[null, '뱀들에게 쫓겨 빈손으로 밧줄을 타고 올라왔다.']]);
    } else await play([[null, '골짜기 바닥의 반짝임을 오래 내려다보다가, 산을 내려왔다.']]);
    b.step = 4; b.how = b.how || {}; b.how.valley = v;
    log('세렌디브 산속의 다이아몬드 골짜기에 갔다.' + (got ? ' 보석 ' + got.got + '통' + (got.gold ? ' (실을 자리가 없어 금화 ' + num(got.gold) + '닢으로)' : '') + '과 큰 다이아몬드를 얻었다.' : ''));
    // 동료가 될까
    await play([['sinbad', '세렌디브의 왕은 이제 없지만, 산과 골짜기는 그대로구려. 내 이야기는 거짓이 아니었소 — 그대가 증인이오.'],
      ['sinbad', '…그런데 말이오, 제독. 바스라로 돌아가 이야기만 하며 늙느니, 그대 배에서 여덟째 항해를 하고 싶소. 나를 뱃사람으로 써 주겠소?']]);
    var j = await UI.ask('뱃사람 신드바드', [{ label: '함께 가자 — 동료로 맞는다', value: 'join' }, { label: '세렌디브에서 작별한다', value: 'bye' }], who('sinbad'));
    if (j === 'join') { joinMate('sinbad', '뱃사람 신드바드가 동료가 되었다 (항해술 3)'); b.step = 5; b.joined = true; await play([['sinbad', '하하! 여덟째 항해의 시작이오. 이번엔 배를 잃지 않게 해 주시오.']]); }
    else { b.step = 5; b.joined = false; await play([['sinbad', '그것도 좋지. 세렌디브에서 차나 마시며 아홉째 이야기를 기다리리다.']]); log('신드바드는 세렌디브에 남았다.'); }
    refresh(); return true;
  };

  // ================================================================ ② 하룬 알 라시드의 밤 산책
  function hrOpen() { var b = st().harun, k = K().harun; return !!(!b.done && cool(b) && cityNow() === k.city && fameNow() >= k.minFame && G.SPONSOR.ar_harun && scheOK() && titled()); }
  N.harun = async function () {
    var b = st().harun, k = K().harun, s = S(), sp = skill('speech');
    await withPic('an_tavern', '티그리스 강가의 밤 술집 (바그다드)', function () { return play([
      [null, '바그다드의 밤. 티그리스 강가 골목의 작은 술집에 등불이 흔들린다. 구석 자리에 상인 셋이 앉아 있다. 수수한 옷차림인데, 가운데 사내의 손가락에서 큰 루비가 언뜻 빛난다. 곁에는 장부를 든 영리해 보이는 사내, 뒤에는 말없이 서 있는 아주 큰 사내.'],
      ['harun', '우리는 모술에서 온 상인이오. 바그다드의 밤이 얼마나 평안한지 구경하러 왔지. 칼리프께서 백성을 잘 돌보신다는 소문이 정말인지 말이오.'],
      ['thug', '(탁자를 걷어차며) 모술 촌놈들이 루비 반지를 끼고 다녀? 이 골목은 우리 구역이야. 반지랑 지갑 내려놓고 가.'],
      ['jafar', '(가운데 사내에게 낮게) 나리, 오늘 밤은 지갑을 두고 나왔습니다. 술값도… 마스루르, 아직은 칼을 뽑지 마라.'],
      ['keeper', '술값부터 내시오! 안 그러면 경비대를 부르겠소!'],
      ['harun', '(제독을 흘끗 보며, 재미있다는 듯) 바다에서 온 손님, 그대라면 이럴 때 어떻게 하겠소?']
    ]); });
    var opts = [
      { label: '그들의 술값을 대신 낸다 (금화 ' + num(k.pay) + '닢)', value: 'pay', dis: s.player.gold < k.pay },
      { label: '건달들과 맞선다', value: 'fight' },
      { label: '말로 달랜다 (웅변 ' + k.speech + ' 이상 — ' + sp.who + ' ' + sp.lv + ')', value: 'talk', dis: sp.lv < k.speech },
      { label: '모른 척한다', value: 'no' }];
    var v = await UI.ask('모술에서 왔다는 상인들', opts, who('harun'));
    if (v === 'pay' && s.player.gold >= k.pay) {
      s.player.gold -= k.pay;
      await play([['P', '주인장, 이분들 술값은 내가 내겠소. 그리고 너희는 — 오늘 밤 이 집에서 내 손님들한테 손대지 마라.'], [null, '건달들은 제독의 선원들을 훑어보더니 침을 뱉고 물러났다.']]);
    } else if (v === 'fight') {
      var res = await fight('골목의 건달들', k.thugs, {});
      if (res !== 'win') { later(b); await play([[null, '건달들에게 밀려 골목 밖으로 쫓겨났다. 돌아보니 상인 셋은 어느새 사라지고 없었다.']]); log('바그다드 밤 술집에서 건달들과 맞섰다가 밀려났다.'); refresh(); return true; }
      await play([[null, '탁자가 뒤집히고 그릇이 날았다. 건달들이 골목으로 달아나자, 큰 사내가 처음으로 입가에 웃음을 띠었다.']]);
    } else if (v === 'talk' && sp.lv >= k.speech) {
      await play([['P', '이 바그다드에서 손님을 털다니, 칼리프께서 아시면 너희 목이 티그리스에 떠다닐 거다. 칼리프께서 밤마다 몰래 골목을 돈다는 소문도 못 들었나?'], [null, '건달 두목이 움찔하더니, 투덜거리며 물러났다. 가운데 상인이 소리 내어 웃었다.']]);
    } else { later(b); await play([[null, '제독은 고개를 돌렸다. 등 뒤에서 큰 소리가 오갔지만, 이윽고 조용해졌다.']]); refresh(); return true; }
    b.how = v;
    await withPic('an_palace', '황금 문의 궁', function () { return play([
      [null, '이튿날 아침, 숙소 앞에 금빛 옷을 입은 궁의 전령들이 늘어섰다. 제독은 원형 도시 한가운데, 초록 돔이 솟은 황금 문의 궁으로 안내되었다.'],
      [null, '옥좌에 앉은 사람의 얼굴이 낯익다. 루비 반지. 곁에는 장부 대신 대신의 홀을 든 사내, 뒤에는 언월도를 찬 큰 사내.'],
      ['harun', '놀라셨소? 나는 하룬 알 라시드, 신자들의 지도자요. 밤마다 상인 옷을 입고 자파르와 마스루르를 데리고 바그다드를 걷지. 내 도시가 정말로 평안한지 내 눈으로 보려고.'],
      ['jafar', '어젯밤 나리께서 지갑을 잊으신 건 제 탓입니다. 그대가 없었다면 마스루르가 칼을 뽑았을 테고, 그럼 칼리프의 밤 산책은 온 바그다드가 알게 되었겠지요.'],
      ['harun', '이방인이 아무 대가 없이 낯선 상인을 도왔소. 이것이 내가 듣고 싶던 이야기요. 이 옷을 받으시오. 앞으로 그대의 발견과 항해는 칼리프가 뒤를 대겠소. 이 궁의 문은 언제나 그대에게 열려 있소.']
    ]); });
    b.done = today(); s.player.gold += k.gift; giveItem('an_khilat');
    if (G.Sponsor) { var rl = G.Sponsor.rel('ar_harun'); rl.met = 1; rl.trust = Math.max(rl.trust || 0, k.trust); }
    var so = fame('so', 200);
    log('바그다드 밤 술집에서 모술 상인 차림의 칼리프 하룬 알 라시드와 대신 자파르를 도왔다 — 칼리프가 후원자가 되었다. 영예의 옷 · 금화 +' + num(k.gift) + ' (사교 명성 +' + so + ')');
    UI.toast('하룬 알 라시드가 후원자가 되었다 — 황금 문의 궁 (바그다드)', 'crown', 6400);
    refresh(); return true;
  };
  /** 칼리프는 밤 산책에서 도와준 뒤에만 후원자 자리에 있다 */
  (function wrapPresent() {
    var SP = G.Sponsor; if (!SP || SP._nights) return; SP._nights = true;
    var op = SP.present;
    SP.present = function (sp) { if (sp && sp.nights) { var s = S(); if (!(s && s.nights && s.nights.harun && s.nights.harun.done)) return false; } return op.apply(this, arguments); };
  })();

  // ================================================================ ③ 흑단 말
  function ebOpen() {
    var b = st().ebony, k = K().ebony, c = cityNow();
    if (!G.MATE.qamar || gone('qamar')) return null;
    if (b.step === 0 && !row('qamar') && c === k.shiraz && cool(b) && fameNow() >= k.minFame && scheOK()) { if (fixer() && charmer()) return 'ebShiraz'; if (!b.hinted) return 'ebHint'; }
    if (b.step === 1 && row('qamar') && c === k.isfahan && cool(b)) return 'ebIsfahan';
    return null;
  }
  /** 고칠 사람이나 왕자의 마음을 열 사람이 없으면 — 한 번 귀띔 */
  N.ebHint = async function () {
    var b = st().ebony, k = K().ebony, f = fixer(), c = charmer(); b.hinted = 1;
    await play([[null, '시라즈의 장미 정원 담 너머, 검게 윤이 나는 나무 말 한 필 옆에서 고운 얼굴의 젊은이가 낯선 사람들을 경계하며 말의 배를 닫는다.'],
      ['qamar', !c ? '(제독 일행을 훑어보고는 고개를 돌리며) …볼일 없소. 이 말은 아무에게나 보여 줄 물건이 아니오.' : '이 말 속을 들여다볼 줄 아는 사람이 그대 배에 있소? 톱니만 알아서도 안 되고, 돛줄만 알아서도 안 되오. 둘 다 아는 사람이어야 하오.']]);
    var miss = [];
    if (!f) miss.push('운용술 ' + k.ops + '·과학 ' + k.sci + ' 이상을 함께 지닌 동료');
    if (!c) miss.push('매력 ' + k.cha + ' 이상인 제독이나 동료');
    UI.toast('흑단 말: ' + miss.join(' · ') + '가 있어야 왕자가 마음을 연다', 'info', 6400);
    refresh(); return true;
  };
  N.ebShiraz = async function () {
    var b = st().ebony, k = K().ebony, s = S(), fx = fixer(), ch = charmer(), fxName = G.MATE[fx.id].name;
    await withPic('an_ebony', '흑단 말 (시라즈)', function () { return play([
      [null, '시라즈. 장미 정원 담 너머로, 검게 윤이 나는 나무 말 한 필이 서 있다. 갈기와 꼬리까지 흑단을 깎아 만들었고, 안장에는 금실 술이 달렸다. 그 옆에서 고운 얼굴의 젊은이가 말의 귀를 붙잡고 씨름하고 있다.'],
      ['qamar', '아, 바다의 손님! 나는 카마르 알 아크마르, 페르시아 사부르 왕의 아들이오. 이 말은 하늘을 나오. 오른쪽 귀의 못을 돌리면 오르고, 왼쪽 못을 돌리면 내리지.'],
      ['qamar', '이 말을 타고 예멘 사나까지 날아가 나디라 공주를 만났소. 그런데 이 말을 만든 늙은 현자가 앙심을 품고 — 내가 잠든 사이 말 속 태엽을 망가뜨리고, 공주를 납치해 이스파한으로 달아났소!'],
      [null, ch.me ? '처음엔 낯선 사람들을 경계하던 왕자가, 제독의 시원한 웃음에 슬며시 경계를 푼다.' : '처음엔 낯선 사람들을 경계하던 왕자가, ' + ch.name + '의 시원한 웃음에 슬며시 경계를 푼다.'],
      ['qamar', '(말의 배를 열어 보이며) 안에 톱니와 태엽이 별자리처럼 얽혀 있소. 나는 돌릴 줄만 알지 고칠 줄은 모르오. 이걸 고쳐 줄 수 있소?']
    ]); });
    var opts = [
      { label: fxName + U.jx(fxName, '이/가') + ' 고친다 (운용술 ' + R.mateSkill(fx, 'ops') + ' · 과학 ' + R.mateSkill(fx, 'sci') + ')', value: 'fix' },
      { label: '지금은 고칠 수 없다', value: 'no' }];
    var v = await UI.ask('흑단 말', opts, who('qamar'));
    if (v === 'fix') {
      await play([[null, fxName + U.jx(fxName, '이/가') + ' 말의 배 속을 들여다보며 톱니 수를 세고, 별자리 표처럼 그려진 태엽의 길을 따라간다. 휘어진 축 하나, 빠진 핀 둘. 날개 대신 몸통 속에 숨은 돛줄 같은 끈들을 배의 삭구처럼 하나하나 다시 맨다. 반나절 만에 말의 눈에 다시 푸른 빛이 돌았다.']]);
    } else { b.cool = 0; await play([['qamar', '…그렇군. 마음이 바뀌면 다시 와 주시오. 나는 이 정원에서 기다리겠소.']]); refresh(); return true; }
    b.how = v; b.step = 1; giveItem('an_ebony_key');
    await play([['qamar', '날개 소리다! 고맙소! 이 은 열쇠의 짝을 가져가시오. 그리고… 나를 그대 배에 태워 주시오. 이스파한까지 함께 가 주시오. 흑단 말만으로는 공주를 지키는 성주의 병사들을 당해 낼 수 없소.']]);
    joinMate('qamar', '페르시아 왕자 카마르 알 아크마르가 동료가 되었다 — 공주를 구하러 이스파한으로');
    log('시라즈에서 ' + fxName + U.jx(fxName, '이/가') + ' 흑단 말을 고쳤다. 왕자 카마르와 함께 이스파한으로 사나의 공주를 구하러 간다.');
    refresh(); return true;
  };
  N.ebIsfahan = async function () {
    var b = st().ebony, k = K().ebony, md = skill('med');
    await withPic('an_isfahan', '이스파한의 성주 궁', function () { return play([
      [null, '이스파한. 넓은 광장 끝 성주의 궁. 성문 앞 장터 사람들이 수군댄다 — 늙은 현자가 데려온 「미친 아내」를 성주가 빼앗아 궁에 가두었는데, 그 여인이 밤낮 소리를 지르며 아무도 곁에 오지 못하게 한다고.'],
      ['qamar', '(이를 악물고) 나디라는 미치지 않았소. 미친 척하는 거요. 성주에게서도, 그 현자에게서도 자기를 지키려고.'],
      ['qamar', '내게 꾀가 있소. 성주는 공주를 고칠 의원을 찾고 있지. 내가 의원 행세를 하고 들어가, 「공주의 병은 흑단 말에 붙은 귀신 탓이니 말을 광장에 내다 놓고 향을 피워야 한다」고 하겠소. 그러면 말 위에서 공주를 안고 날아오를 수 있소.'],
      ['sage', '(광장 한쪽에서 쇠사슬에 묶인 늙은 현자가 소리친다) 그 말은 내 것이다! 공주도 내 것이야! 성주가 나를 가두고 둘 다 빼앗았어!']
    ]); });
    var medOk = md.lv >= k.med;
    var v = await UI.ask('사나의 공주 나디라', [
      { label: '왕자와 함께 의원 행세를 하고 들어간다' + (medOk ? ' (의학 — ' + md.who + ' ' + md.lv + ')' : ' (의학을 아는 사람이 없어 들킬 수도 있다)'), value: 'doctor' },
      { label: '성주의 궁에 쳐들어간다', value: 'storm' },
      { label: '때를 기다린다', value: 'wait' }], who('qamar'));
    var ok = false;
    if (v === 'doctor') {
      if (medOk || U.chance(0.5)) {
        ok = true;
        await play([[null, (medOk ? md.who + U.jx(md.who, '이/가') + ' 공주의 맥을 짚고 그럴듯한 처방을 늘어놓자 성주가 고개를 끄덕였다.' : '어설픈 처방에 성주가 눈썹을 찌푸렸지만, 왕자의 말솜씨가 끝내 그를 넘어뜨렸다.') + ' 광장에 흑단 말이 끌려 나오고, 향 연기가 자욱하게 피어오른다.']]);
      } else {
        await play([[null, '처방이 엉터리라는 것이 금세 들통났다. 「가짜 의원이다!」 성주의 병사들이 창을 겨눈다.']]);
        v = 'storm';
      }
    }
    if (v === 'storm' && !ok) {
      var res = await fight('이스파한 성주의 병사들', k.army, { guns: true, leader: '이스파한 성주' });
      if (res === 'win') { ok = true; await play([[null, '병사들을 뚫고 광장에 이르자, 왕자가 흑단 말에 뛰어올라 공주의 손을 붙잡는다.']]); }
      else { later(b); await play([[null, '병사들에게 밀려 성 밖으로 물러났다. 왕자가 주먹을 쥔다. 「다시 오겠소, 공주.」']]); log('이스파한에서 사나의 공주를 구하려다 성주의 병사들에게 밀려났다.'); refresh(); return true; }
    }
    if (!ok) { later(b); await play([['qamar', '…좋소, 기다리지. 하지만 너무 오래는 못 기다리오.']]); refresh(); return true; }
    await withPic('an_flight', '하늘을 나는 흑단 말', function () { return play([
      [null, '공주가 말 등에 오르자 왕자가 오른쪽 귀의 못을 돌린다. 흑단 말이 날개를 펴듯 몸을 떨더니, 향 연기를 가르고 이스파한의 푸른 돔들 위로 솟아오른다. 광장의 사람들이 모두 입을 벌리고 하늘을 올려다본다.'],
      ['nadira', '(하늘에서 흐트러진 머리를 걷어 올리며, 또렷한 목소리로) 미친 척하느라 목이 다 쉬었어요. 바다의 제독님, 고마워요. 이건 제 어머니의 진주예요 — 받아 주세요.'],
      ['qamar', '이제 사나의 왕께 그대를 데려다드리겠소. 아버님께서 얼마나 걱정하셨을지—'],
      ['nadira', '(왕자의 말을 끊으며) 싫어요. 사나로 돌아가면 아버지는 저를 또 궁 깊숙이 가두실 거예요. 이번엔 「다시는 납치되지 않게」라면서요. 현자의 궁, 성주의 궁, 아버지의 궁 — 궁은 이제 지긋지긋해요.'],
      ['nadira', '아버지께는 편지를 쓰겠어요. 저는 제독님의 배로 가겠어요. 바다엔 담장이 없잖아요. …카마르, 당신도 그 배에 남을 거죠?'],
      ['qamar', '(얼떨떨하게 웃으며) …공주가 그렇다면 나도 그렇소. 제독, 손님이 하나 더 늘었구려.']
    ]); });
    giveItem('an_sanaa_pearls'); b.step = 2; b.how2 = v; b.done = today(); var so = fame('so', 250);
    log('이스파한에서 사나의 공주 나디라 알 사나니를 구했다. 왕자 카마르가 흑단 말에 공주를 태워 날아올랐다. 진주 목걸이 (사교 명성 +' + so + ')');
    if (G.MATE.nadira && !row('nadira') && !gone('nadira')) joinMate('nadira', '사나의 공주 나디라 알 사나니가 동료가 되었다 — 「바다엔 담장이 없잖아요」');
    else UI.toast('흑단 말 — 공주를 구했다', 'heart', 6000);
    refresh(); return true;
  };

  // ================================================================ 도시 · 바다
  function cityStep() { if (!st()) return null; return sbOpen() || (hrOpen() ? 'harun' : null) || ebOpen(); }
  N.cityStep = cityStep;
  N.pending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && cityStep()); };
  N.check = async function () {
    if (N._busy) return false; N._busy = true;
    try { var w = cityStep(); if (w) await N[w](); } catch (e) { console.error(e); }
    N._busy = false; return true;
  };
  N.seaPending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'sea' && st() && sbSea()); };
  N.atSea = async function () {
    if (N._busy) return false; N._busy = true;
    try { var w = sbSea(); if (w) await N[w](); } catch (e) { console.error(e); }
    N._busy = false; return true;
  };
})(window.G = window.G || {});
