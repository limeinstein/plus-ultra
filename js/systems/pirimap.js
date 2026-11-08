/* 피리 레이스의 해도 (G.PiriMap) — 2026-11-08 사용자 요청. 사람·조정값: js/data/pirimap.js (G.BALANCE.pirimap)
   ■ 도시에 들어설 때 (js/scenes/city.js)
     ① 이스탄불 (1555~1690 · 명성 minFame 이상): 책방 거리의 레일라 피리자데가 집안의 해도 사본을 펼친다 — 함께 간다 / 사양(decline일 뒤 다시)
     ③ 산토도밍고: 대성당 문서고의 콜롬보 지도 — (가) 금화 gift닢 기부 (나) 말로 설득(말솜씨 speech 이상) (다) 밤에 몰래(경비병과 뭍의 싸움 guards)
     ④ 바이아: 늙은 수로안내인 조앙 — 「abre os olhos(눈을 떠라)」 = 아브롤류스 암초 · (가) 금화 pilot닢에 뱃길을 맡긴다 (나) 우리 힘으로 간다
   ■ 바다의 하루 끝 (js/scenes/sea.js)
     ② 카나리아 서쪽 바다: 산 브랜던의 섬 — 고래였다 · (가) 따라간다(식량 food일분 · 용연향) (나) 보트를 내린다(웃음거리)
     ⑤ 아브롤류스 암초: 수로안내인이 없으면 배마다 선체 reef만큼 긁힌다 → 보물 사냥꾼 돈 로드리고(뭍의 싸움 army)
        이기면 금화 gold닢 · 보석 gems통(짐칸이 모자라면 그 값만큼 금화) · 아스트롤라베 · 붉은 쪽지 → 레일라가 동료로 남을지 묻는다
        지면 again일 뒤 다시 (사냥꾼들은 엉뚱한 곳을 파고 떠났다 — 싸움 없이 보물)
   ■ 저장: s.pirimap = { step: 0~5(끝), how: {단계: 고른 것}, pilot, lost, cool, joined }
   ■ 장면 그림: images/legend-events/pr_* — PIRIMAP_PROMPT.md */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var PM = G.PiriMap = {};
  function K() { return G.BALANCE.pirimap; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; if (!s.pirimap) s.pirimap = { step: 0, how: {} }; s.pirimap.how = s.pirimap.how || {}; return s.pirimap; }
  PM.state = st;
  function today() { return U.dateNum(S().date); }
  function num(n) { return U.num(Math.round(n)); }
  function log(t) { G.State.log(t); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function item(id) { return R.addItem ? R.addItem(id) !== false : false; }
  function giveItem(id) { if (!item(id)) S().player.items.push({ id: id }); }   // 보물은 짐 칸이 차도 챙긴다
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { var s = S(); return !!(s.flags && s.flags['gone_' + id]); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    if (k === 'leyla' && row('leyla') && G.Legend && G.Legend.speaker) return G.Legend.speaker('leyla');
    return G.Hist ? G.Hist.speaker('pr_' + k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function inBox(box) { var l = S().loc; return !!(l && l.mode === 'sea' && l.lon != null && l.lon >= box[0] && l.lon <= box[1] && l.lat >= box[2] && l.lat <= box[3]); }
  function cooled() { var b = st(); return !(b.cool > S().day); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : null; return { lv: (b && b.lv) || 0, who: (b && b.who) || S().player.name }; }
  /** 짐칸에 싣는다 (같은 품목이 있으면 합친다) — 실은 수량 */
  function load(id, q, cityId) {
    var s = S(), c = s.fleet.cargo = s.fleet.cargo || {};
    if (!c[id] && R.maxKinds && Object.keys(c).length >= R.maxKinds()) return 0;
    var room = G.Cargo && G.Cargo.room ? G.Cargo.room(id) : R.free(); q = Math.max(0, Math.min(q, Math.floor(room))); if (!q) return 0;
    var cg = c[id], cost = 0;
    if (cg) { R.addCargoLot(cg, cityId, q, cost); cg.cost = Math.round((cg.cost * cg.q) / (cg.q + q)); cg.q += q; }
    else { c[id] = { q: q, cost: cost, from: cityId, d: s.day, lots: {} }; c[id].lots[cityId] = { q: q, cost: cost }; }
    return q;
  }
  PM.TIP = { 1: '카나리아 제도 서쪽 바다 (산 브랜던의 섬)', 2: '산토도밍고 (콜롬보의 지도)', 3: '바이아 (「눈을 떠라」)', 4: '아브롤류스 암초 (붉은 점)' };
  /** 지금 찾아갈 곳 (소문·수첩용) */
  PM.goal = function () { var b = st(); return b && b.step >= 1 && b.step <= 4 ? PM.TIP[b.step] : null; };

  // ================================================================ ① 이스탄불 — 레일라 피리자데
  function startOpen() {
    var b = st(), k = K().start, t; if (!b || b.step || !cooled() || cityNow() !== k.city) return false;
    t = today(); if (t < k.from || t > k.to) return false;
    if (!G.MATE.leyla || row('leyla') || gone('leyla')) return false;
    return (G.Fame ? G.Fame.get() : S().player.fame) >= k.minFame;
  }
  PM.start = async function () {
    var b = st(), s = S(), found = !!(s.disc && s.disc.pirireis && s.disc.pirireis.found);
    await withPic('pr_bazaar', '책방 거리의 지도 장수 (이스탄불)', function () { return play([
      [null, '이스탄불, 대바자르 뒤편의 책방 거리. 종이 냄새와 먹 냄새 사이로, 한 젊은 여인이 낡은 탁자에 해도를 펼쳐 놓고 베끼고 있다. 펜 끝이 바람 장미의 서른두 갈래 선을 한 번에 그어 낸다.'],
      ['leyla', '바다에서 오신 분이군요. 손에 굳은살, 눈가에 소금기. — 지도를 사러 오셨나요, 아니면 지도를 믿을 줄 아는 분인가요?'],
      ['leyla', '저는 레일라 피리자데. 피리 레이스 제독의 집안 사람이에요. 제독께서 카이로에서 돌아가신 뒤로 집안은 모든 걸 잃었지만, 이것만은 남았어요.'],
      [null, '그녀가 가죽 통에서 꺼낸 것은 가젤 가죽에 그린 지도 한 장. 에스파냐와 아프리카의 해안, 대서양 건너 새 땅의 해안선, 그리고 바다 위의 배와 괴물 그림들.'],
      found ? ['P', '토프카프 궁에서 본 지도와 같군. 콜롬보의 지도까지 겹쳐 그렸다는 그 지도.'] : null,
      ['leyla', '술탄께 바친 지도와 같은 그림이에요. 하지만 이건 제독께서 집안에 남기신 사본이에요. 보세요 — 여백에 붉은 잉크로 쓴 글. 술탄께 바친 지도에는 없는 글이에요.'],
      ['leyla', '「1501년, 숙부 케말 레이스의 갤리가 잡은 포르투갈 수로안내인이 말하기를 — 진짜 십자가의 땅 남쪽, 눈을 떠야 하는 암초에 카브랄 선단의 금을 묻었다.」 그리고 여기, 바다 한가운데 붉은 점 하나.'],
      ['leyla', '집안 사람들은 다들 옛날이야기라고 웃었어요. 하지만 제독의 지도는 한 번도 틀린 적이 없어요. 붉은 선은 산 브랜던의 섬에서 시작해 콜롬보의 섬을 지나, 남쪽으로 내려가요.'],
      ['leyla', '저를 배에 태워 주세요. 길은 제가 읽을게요. 찾은 것은 반으로 나누지 않아도 돼요 — 저는 그 붉은 점이 진짜라는 것만 알면 돼요.']
    ]); });
    var v = await UI.ask('피리 레이스의 해도', [{ label: '레일라를 태우고 붉은 선을 따라간다', value: 'go' }, { label: '사양한다', value: 'no' }], who('leyla'));
    if (v !== 'go') { b.cool = s.day + (K().decline || 180); await play([['leyla', '…그래요. 지도는 기다릴 줄 알아요. 저도요.']]); refresh(); return true; }
    b.step = 1; b.cool = 0; b.since = today(); giveItem('pr_family_map');
    await play([['leyla', '고마워요! 첫 자리는 카나리아 제도의 서쪽 바다예요. 제독의 지도에 「산 브랜던의 섬」이 그려진 곳. 거기서 붉은 선이 시작돼요.']]);
    log('이스탄불 책방 거리에서 피리 레이스 집안의 후손 레일라 피리자데를 만났다. 집안의 해도 사본에 붉은 잉크로 찍힌 점을 찾아 함께 떠난다. 첫 자리는 카나리아 제도 서쪽 바다.');
    UI.toast('피리 레이스의 해도 — 첫 자리: 카나리아 서쪽 바다', 'map', 5600);
    refresh(); return true;
  };

  // ================================================================ ② 산 브랜던의 섬 (카나리아 서쪽 바다)
  PM.brendan = async function () {
    var b = st(), k = K().brendan, s = S();
    await withPic('pr_brendan', '산 브랜던의 섬', function () { return play([
      [null, '엘이에로 섬 서쪽, 짙은 안개. 해도에 아무것도 없는 바다에 검고 둥근 섬 하나가 떠 있다. 나무도 모래도 없는, 매끈한 바위섬.'],
      ['leyla', '(지도를 펼치며) 여기예요! 제독의 지도에도 이 자리에 섬이 있어요. 옆에 쓴 글 — 「옛날 산 브랜던이라는 수도사가 이 섬에 올라 불을 피웠더니, 섬이 움직였다. 그것은 물고기였다.」'],
      [null, '그 순간, 섬이 크게 숨을 내쉬었다. 물기둥이 하늘로 솟는다. 고래다 — 배보다 큰 향유고래가 느릿느릿 서쪽으로 헤엄치기 시작한다.']
    ]); });
    var v = await UI.ask('산 브랜던의 「섬」', [
      { label: '고래를 따라간다 (식량 ' + k.food + '일분)', value: 'follow' },
      { label: '보트를 내려 「섬」에 올라 본다', value: 'land' }], who('leyla'));
    if (v === 'follow') {
      s.fleet.food = Math.max(0, (s.fleet.food || 0) - Math.ceil(R.dailyUse() * k.food));
      var got = load('ambergris', k.ambergris, 88);
      await play([[null, '사흘 동안 고래를 따라갔다. 고래가 잠수한 자리에 회색 덩어리가 떠올랐다 — 뱃사람들이 꿈에도 그리는 용연향.' + (got ? '' : ' 하지만 짐칸에 실을 자리가 없었다.')],
        ['leyla', '(나침반과 지도를 번갈아 보며) 고래가 간 길이 붉은 선과 똑같아요! 바람 장미의 서남서 선 — 이 선 끝에는 「이슬라 데 에스파뇰라」, 콜롬보의 섬이 있어요.']]);
      b.how[2] = 'follow'; log('카나리아 서쪽 바다에서 산 브랜던의 「섬」 — 향유고래를 사흘 따라갔다.' + (got ? ' 용연향 ' + got + '통을 건졌다.' : '') + ' 붉은 선은 산토도밍고를 가리킨다.');
    } else {
      await play([[null, '보트가 「섬」에 닿아 선원 셋이 올라선 순간, 섬이 꼬리를 쳐들고 물속으로 사라졌다. 셋은 비명을 지르며 바다에 빠졌다가, 흠뻑 젖은 채 보트로 끌려 올라왔다. 갑판에서 웃음이 터졌다.'],
        ['leyla', '(웃음을 참으며) 산 브랜던의 수도사들도 똑같았대요. …그래도 고래가 간 방향을 봤어요. 서남서 — 붉은 선 그대로예요. 다음은 콜롬보의 섬, 산토도밍고예요.']]);
      b.how[2] = 'land'; log('카나리아 서쪽 바다에서 산 브랜던의 「섬」에 올랐다가 고래였음을 알았다. 붉은 선은 산토도밍고를 가리킨다.');
    }
    b.step = 2; UI.toast('피리 레이스의 해도 — 다음: 산토도밍고', 'map', 5200);
    refresh(); return true;
  };

  // ================================================================ ③ 산토도밍고 — 콜롬보의 지도
  PM.domingo = async function () {
    var b = st(), k = K().domingo, s = S(), sp = skill('speech');
    await withPic('pr_domingo', '대성당 문서고 (산토도밍고)', function () { return play([
      [null, '산토도밍고 대성당. 산호석으로 쌓은 벽 아래, 콜롬보의 유해가 잠든 제단 뒤로 문서고의 철문이 있다. 열쇠 꾸러미를 찬 늙은 수사가 문 앞을 막아선다.'],
      ['leyla', '피리 제독은 지도 여백에 이렇게 적으셨어요. 「제노바 사람 콜롬보의 지도를 보고 그렸다.」 그 지도의 원본이, 아니면 사본이 이곳에 있을 거예요. 붉은 선이 어디로 꺾이는지 봐야 해요.'],
      ['friar', '튀르크 여자가 제독의 문서를 보겠다고? 이단의 손이 성당 문서를 만질 수는 없소. …물론, 성당의 지붕을 고치는 데 보탬이 된다면 이야기가 달라지겠지만.']
    ]); });
    var opts = [
      { label: '성당에 금화 ' + num(k.gift) + '닢을 바친다', value: 'gift', dis: s.player.gold < k.gift },
      { label: '말로 설득한다 (말솜씨 ' + k.speech + ' 이상 — ' + sp.who + ' ' + sp.lv + ')', value: 'talk', dis: sp.lv < k.speech },
      { label: '밤에 문서고에 몰래 들어간다', value: 'sneak' }];
    var v = await UI.ask('콜롬보의 지도', opts, who('friar'));
    if (v === 'gift' && s.player.gold >= k.gift) {
      s.player.gold -= k.gift; fame('so', 30); b.how[3] = 'gift';
      await play([['friar', '(금화 주머니를 받아 들고) 주님께서 그대의 너그러움을 기억하실 것이오. 들어오시오. 단, 촛불은 내가 들겠소.']]);
    } else if (v === 'talk' && sp.lv >= k.speech) {
      b.how[3] = 'talk';
      await play([['P', '수사님, 이 여인의 할아버지는 콜롬보를 믿은 몇 안 되는 사람이었소. 제노바 사람의 지도를 바다 건너 술탄의 궁에까지 실어 간 사람이지. 콜롬보가 옳았다는 걸 증명한 지도를, 콜롬보 곁에서 보게 해 주시오.'],
        ['friar', '…콜롬보 제독을 믿은 사람이라. 이 섬에서도 그분을 믿은 사람은 드물었지. 좋소, 들어오시오.']]);
    } else {
      b.how[3] = 'sneak';
      await play([[null, '자정. 성당 뒤 담을 넘어 문서고 창문을 비틀었다. 그때 등불이 켜지고 고함 소리 — 「도둑이다!」 총독의 경비병들이 달려온다.']]);
      var L = G.Scenes && G.Scenes.land, res = 'win';
      if (L && L.landBattle) { var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew); try { res = await L.landBattle('산토도밍고 총독의 경비병', k.guards, false, { kind: 'garrison', guns: true, noSpecial: true }); } finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; } }
      if (res !== 'win') { s.player.notoriety = (s.player.notoriety || 0) + 3; await play([[null, '경비병에게 쫓겨 배로 달아났다. 레일라가 품에 무언가를 안고 있다 — 「한 장은… 건졌어요!」']]); }
      else await play([[null, '경비병들을 따돌리고 문서고에 들어갔다. 레일라가 촛불 아래서 재빨리 서가를 훑는다.']]);
    }
    await withPic('pr_columbus', '콜롬보의 지도', function () { return play([
      [null, '먼지 앉은 서가 맨 아래, 기름 먹인 천에 싼 해도 한 장. 에스파뇰라 섬과 쿠바, 그리고 남쪽으로 길게 뻗은 새 땅의 해안. 레일라가 집안의 사본을 그 옆에 펼친다. 해안선이 한 치도 어긋나지 않는다.'],
      ['leyla', '(숨을 삼키며) 똑같아요. 제독께서 정말로 이 지도를 보셨어요. 그리고 여기 — 남쪽 해안에 포르투갈 글씨. 「카브랄의 배가 폭풍에 밀려 닿은 곳, 산타 크루스의 땅.」'],
      ['leyla', '붉은 선이 여기서 남쪽으로 꺾여요. 진짜 십자가의 땅 — 브라질이에요. 포르투갈 사람들이 가장 먼저 자리 잡은 바이아로 가요. 그 바다를 아는 사람이 있을 거예요.']
    ]); });
    b.step = 3;
    log('산토도밍고 대성당 문서고에서 콜롬보의 지도를 보았다' + (b.how[3] === 'gift' ? ' (성당에 금화 ' + num(k.gift) + '닢)' : b.how[3] === 'talk' ? ' (수사를 설득했다)' : ' (밤에 몰래 들어갔다)') + '. 피리 레이스의 사본과 해안선이 똑같다. 붉은 선은 브라질 바이아로 꺾인다.');
    UI.toast('피리 레이스의 해도 — 다음: 바이아', 'map', 5200);
    refresh(); return true;
  };

  // ================================================================ ④ 바이아 — 「눈을 떠라」
  PM.bahia = async function () {
    var b = st(), k = K().bahia, s = S();
    await withPic('pr_bahia', '늙은 수로안내인 (바이아)', function () { return play([
      [null, '바이아, 모든 성인의 만. 부두 끝 그늘에서 측연줄을 감던 늙은 사내가 레일라의 지도를 흘끗 보더니 손을 멈춘다.'],
      ['pilot', '그 붉은 점… 어디서 났소? 우리 할아버지는 1500년에 카브랄 제독이 이 땅에 버리고 간 유배자였소. 투피남바 여자와 살며 평생 이 바다를 오르내렸지.'],
      ['pilot', '할아버지가 늘 하던 말이 있소. 「남쪽으로 내려가거든 눈을 떠라(abre os olhos)!」 — 그 말이 그대로 그 바다의 이름이 됐지. 아브롤류스. 물 밑에 숨은 산호 암초가 배 바닥을 찢는 곳이오.'],
      ['leyla', '(지도의 붉은 글씨를 짚으며) 「눈을 떠야 하는 암초」… 제독께서 쓰신 말 그대로예요! 붉은 점은 아브롤류스예요.'],
      ['pilot', '그런데 조심하시오. 며칠 전에 산토도밍고에서 온 에스파냐 놈들이 아브롤류스 가는 길을 묻고 다녔소. 손에 베낀 지도를 들고.'],
      ['pilot', '내가 뱃길을 잡아 주리다. 금화 ' + num(k.pilot) + '닢. 암초 사이 물길은 할아버지한테 배운 대로 내 발바닥이 기억하오.']
    ]); });
    var v = await UI.ask('아브롤류스로 가는 뱃길', [
      { label: '금화 ' + num(k.pilot) + '닢에 조앙에게 뱃길을 맡긴다', value: 'pilot', dis: s.player.gold < k.pilot },
      { label: '우리 힘으로 간다', value: 'self' }], who('pilot'));
    if (v === 'pilot' && s.player.gold >= k.pilot) { s.player.gold -= k.pilot; b.pilot = true; await play([['pilot', '좋소! 내 보트를 매달고 가겠소. 암초 앞에서 나를 앞세우시오.']]); }
    else { b.pilot = false; await play([['pilot', '배짱 하나는 좋군. 눈을 크게 뜨시오. 정말로.']]); }
    b.step = 4;
    log('바이아에서 늙은 수로안내인 조앙 히베이루를 만났다. 「눈을 떠라」 — 붉은 점은 아브롤류스 암초다.' + (b.pilot ? ' (금화 ' + num(k.pilot) + '닢에 뱃길을 맡겼다)' : '') + ' 에스파냐 보물 사냥꾼들이 먼저 길을 물었다고 한다.');
    UI.toast('피리 레이스의 해도 — 마지막: 아브롤류스 암초', 'map', 5200);
    refresh(); return true;
  };

  // ================================================================ ⑤ 아브롤류스 — 보물
  PM.abrolhos = async function () {
    var b = st(), k = K().abrolhos, s = S(), second = !!b.lost;
    if (!second) {
      await withPic('pr_abrolhos', '아브롤류스 암초', function () { return play([
        [null, '바이아 남쪽, 맑은 바다 밑으로 산호 암초가 갈색 그림자처럼 번진다. 낮은 바위섬 다섯이 물 위에 떠 있다.'],
        b.pilot ? ['pilot', '왼쪽! 더 왼쪽! …좋아, 이 물길이오. 할아버지 말이 맞지 — 눈을 뜨면 길이 보인다니까.'] : [null, '쿵 — 배 밑에서 둔한 소리가 울린다. 산호가 선체를 긁고 지나간다. 몇 번을 더 긁히고서야 바위섬 앞에 닻을 내렸다.']
      ]); });
      if (!b.pilot) s.fleet.ships.forEach(function (sh) { sh.hp = Math.max(1, Math.round(sh.hp - sh.maxHp * k.reef)); });
      await play([
        ['leyla', '(지도를 섬의 모양에 맞추며) 다섯 섬 가운데 가장 큰 섬. 붉은 글씨 마지막 줄 — 「십자가는 해 뜨는 쪽을 본다.」 바위에 새긴 십자가를 찾아요!'],
        [null, '섬에 오르자 모래 위에 이미 파헤친 구덩이들이 보인다. 그리고 바위 뒤에서 칼을 뽑은 사내들이 걸어 나온다.'],
        ['rodrigo', '역시 왔군, 튀르크 아가씨. 산토도밍고 수사한테 들었지 — 콜롬보의 지도를 보고 남쪽으로 갔다고. 지도는 고맙게 잘 베꼈소. 이제 남은 건 그 붉은 점이 정확히 어디냐는 것뿐이오.'],
        ['rodrigo', '지도를 내놓고 돌아가시오. 아니면 이 섬이 그대들 무덤이 될 거요.']
      ]);
      var L = G.Scenes && G.Scenes.land, res = 'win';
      if (L && L.landBattle) { var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew); try { res = await L.landBattle('돈 로드리고의 보물 사냥꾼들', k.army, false, { kind: 'garrison', guns: true, leader: '돈 로드리고 데 바야스', noSpecial: true }); } finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; } }
      if (res !== 'win') {
        b.lost = true; b.cool = s.day + (K().again || 30);
        await play([[null, '바위섬에서 밀려나 배로 물러났다. 해변에서 사냥꾼들이 삽을 들고 섬을 파헤치기 시작한다.'],
          ['leyla', '(이를 악물고) 괜찮아요. 마지막 줄은 제 머릿속에만 있어요. 저 사람들은 십자가가 어느 쪽을 보는지 몰라요. 한 달쯤 뒤에 다시 와요 — 그땐 빈손으로 떠나 있을 거예요.']]);
        log('아브롤류스 암초에서 돈 로드리고의 보물 사냥꾼들에게 밀려났다. 레일라는 마지막 줄을 아무에게도 말하지 않았다.');
        refresh(); return true;
      }
      await play([['rodrigo', '(칼을 떨어뜨리며) 제기랄… 튀르크 지도 하나 때문에! 물러난다, 물러나!'], [null, '사냥꾼들이 보트를 타고 달아났다.']]);
    } else {
      await play([[null, '한 달 뒤 다시 찾은 아브롤류스. 섬은 온통 파헤쳐져 있고, 사냥꾼들의 배는 보이지 않는다. 버려진 삽 몇 자루가 모래에 꽂혀 있다.'],
        ['leyla', '역시 엉뚱한 데만 팠군요. 「십자가는 해 뜨는 쪽을 본다」 — 동쪽 바위로 가요.']]);
    }
    return PM.treasure();
  };
  PM.treasure = async function () {
    var b = st(), K0 = K(), s = S();
    var gems = load('gems', K0.gems, 215), gemGold = (K0.gems - gems) * (G.GOOD.gems ? G.GOOD.gems.p : 210);
    s.player.gold += K0.gold + gemGold; giveItem('pr_astrolabe'); giveItem('pr_red_note');
    var ex = fame('ex', K0.fame);
    await withPic('pr_treasure', '붉은 점의 보물', function () { return play([
      [null, '섬 동쪽 끝, 해 뜨는 쪽을 향한 검은 바위. 비바람에 닳은 십자가 하나가 새겨져 있다. 그 발치를 두 자쯤 파자, 삽 끝에 쇠가 닿았다.'],
      [null, '쇠띠를 두른 참나무 상자. 뚜껑을 열자 포르투갈 크루자두 금화가 햇빛을 받아 쏟아질 듯 빛난다. 그 위에 청동 아스트롤라베, 그리고 기름 먹인 천에 싼 보석 주머니.'],
      ['leyla', '(상자 밑바닥에서 접힌 종이를 꺼내 들고, 한참을 말없이 읽다가) …제독의 글씨예요. 「이것을 찾은 이는 내 지도를 믿어 준 사람이다.」'],
      ['leyla', '제독께서 직접 여기 오셨던 거예요. 상자를 찾아 놓고도 가져가지 않으셨어요. 지도가 맞았다는 것만 확인하고, 다음 사람을 위해 다시 묻어 두신 거예요.'],
      ['P', '그리고 그 다음 사람이 우리였군.']
    ]); });
    log('아브롤류스 암초에서 피리 레이스의 붉은 점을 찾았다 — 카브랄 선단의 금화 상자. 금화 ' + num(K0.gold + gemGold) + '닢' + (gems ? ' · 보석 ' + gems + '통' : '') + ' · 청동 아스트롤라베 · 붉은 잉크의 마지막 쪽지. (탐험 명성 +' + ex + ')');
    UI.toast('피리 레이스의 보물 — 금화 +' + num(K0.gold + gemGold) + (gems ? ' · 보석 ' + gems + '통' : ''), 'coin', 6400);
    b.step = 5; b.done = today();
    // 레일라 — 동료로 남을까
    await play([['leyla', '제독, 저는 이제 집안 사람들에게 보여 줄 게 생겼어요. 그런데… 돌아가서 남의 지도를 베끼는 것보다, 아무도 그리지 않은 바다를 그리고 싶어요. 제가 이 배에 남아도 될까요?']]);
    var v = await UI.ask('레일라 피리자데', [{ label: '함께 가자 — 동료로 맞는다', value: 'join' }, { label: '이스탄불로 돌려보낸다', value: 'home' }], who('leyla'));
    if (v === 'join' && G.MATE.leyla && !row('leyla')) {
      var nm = G.Legend && G.Legend.join ? G.Legend.join('leyla', null) : null;
      if (!nm) { nm = { id: 'leyla', role: 'none', joined: today(), loyal: K0.loyal }; s.mates.push(nm); }
      nm.loyal = Math.max(nm.loyal || 0, K0.loyal || 80);
      if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire('leyla'); } catch (e) { console.error(e); } }
      b.joined = true;
      await play([['leyla', '고마워요! 그럼 첫 번째 일 — 이 배의 해도부터 다시 그릴게요. 틀린 데가 너무 많아요.']]);
      log('레일라 피리자데가 동료가 되었다.'); UI.toast('레일라 피리자데 — 동료가 되었다', 'heart', 5600);
    } else {
      b.joined = false;
      await play([['leyla', '…알겠어요. 이스탄불에 돌아가면 이 바다를 지도에 그려 넣을게요. 제독의 이름 옆에 당신 이름도요.']]);
      log('레일라 피리자데는 이스탄불로 돌아갔다.');
    }
    refresh(); return true;
  };

  // ================================================================ 도시 · 바다
  function cityStep() { var b = st(); if (!b) return null; if (startOpen()) return 'start'; if (b.step === 2 && cityNow() === K().domingo.city) return 'domingo'; if (b.step === 3 && cityNow() === K().bahia.city) return 'bahia'; return null; }
  function seaStep() { var b = st(); if (!b) return null; if (b.step === 1 && inBox(K().brendan.box)) return 'brendan'; if (b.step === 4 && cooled() && inBox(K().abrolhos.box)) return 'abrolhos'; return null; }
  PM.pending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && cityStep()); };
  PM.check = async function () {
    if (PM._busy) return false; PM._busy = true;
    try { var w = cityStep(); if (w) await PM[w](); } catch (e) { console.error(e); }
    PM._busy = false; return true;
  };
  PM.seaPending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'sea' && seaStep()); };
  PM.atSea = async function () {
    if (PM._busy) return false; PM._busy = true;
    try { var w = seaStep(); if (w) await PM[w](); } catch (e) { console.error(e); }
    PM._busy = false; return true;
  };
})(window.G = window.G || {});
