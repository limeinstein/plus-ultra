/* 네르친스크 조약 (1689) — 청과 러시아의 국경 (G.Nerchinsk) 2026-11-01 사용자 요청
   사람·소지품·조정값: js/data/nerchinsk.js. 날짜는 게임의 양력. 네르친스크에는 도시가 없다 — 사절단과 함께 길을 떠나면 날이 지나가고(G.Game.passDays) 천막 진영의 장면이 된다.
   ■ 앞일(소식): 알바진의 첫 포위(1685.6.23) · 두 번째 포위(1686.7.18) · 강희제가 포위를 풀다(1686.12.1)
   ■ ① 사절단 (청: 1689.5.1~6.12 북경 / 러시아: 1689.5.1~7.25 이르쿠츠크): 예수회의 페레이라(청) 또는 대사 골로빈(러시아)이 라틴어를 아는 서양 선장을 찾는다
        → 함께 간다(1689.8.22 회담이 열리는 날까지 날이 지나간다) / 사양
   ■ ② 실카 강가의 천막 (1689.8.22~): ⑴ 경계 — 아르군 강과 외흥안령(실제 조약) / 아무르 강(러시아가 바란 것) / 바이칼 호(청의 첫 요구)
        ⑵ 알바진 — 성을 허물고 러시아 사람을 물린다(실제 조약) / 성을 남겨 둔다
        ⑶ 깨어진 회담의 밤 — 양쪽 천막을 오가며 라틴어 초안을 다듬는다(로망스어·웅변·상대 말로 확률) / 군사를 보여 겁준다 / 신부들에게 맡긴다
   ■ ③ 조약 (1689.9.7): 늘 맺어진다(역사 그대로). 잘 풀리면(경계를 아르군 강으로 + 밤의 초안이 이루어지면) 「좋은 조약」 —
        라틴어 조약문 사본 · 명성 · 하사금 (청: 강희제의 하사금 / 러시아: 골로빈의 하사금과 러시아의 명예 작위 한 칸 — js/data/court.js RU)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/nc_*.webp
   ■ 저장: s.nerchinsk = { met, side: 'qing'|'ru', joined: 'yes'|'no', border, albazin, night, draft, grade: 'good'|'ok', done, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var NC = G.Nerchinsk = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.nerchinsk) || {}; }
  var PEKING = 188, IRKUTSK = 291, LATIN = 2, SLAV = 4, CHINESE = 7;
  NC.PLACE = [116.6, 51.98];
  var D = NC.D = { from: 16890501, qingTo: 16890612, ruTo: 16890725, talks: 16890822, treaty: 16890907 };
  var NEWS_AT = { albazin1: 16850623, albazin2: 16860718, truce: 16861201, embassy: 16890613, treatyNews: 16890907 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.nerchinsk) {
      s.nerchinsk = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.nerchinsk.told[k] = 1; });   // 옛 저장
    }
    if (!s.nerchinsk.told) s.nerchinsk.told = {};
    return s.nerchinsk;
  }
  NC.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var COSSACK = { name: '알바진에서 온 카자크', lang: 3 }, BANNER = { name: '팔기의 장교', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w === 'P' ? me() : w === 'F' ? first() : w && typeof w === 'object' ? w : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function lang(li) { return R.lang ? R.lang(li) || 0 : 0; }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  /** 밤의 초안이 이루어질 확률 — 라틴어(로망스어)·웅변·상대편 말 */
  function draftP() {
    var b = st(), k = K(), other = b && b.side === 'ru' ? CHINESE : SLAV;
    return U.clamp((k.base || 0.35) + lang(LATIN) * 0.15 + skill('speech') * 0.1 + lang(other) * 0.05, 0.1, 0.95);
  }
  NC.draftP = draftP;
  async function titleUp() {
    var CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms.RU;
    if (!CT || !realm) return null;
    var c = CT.state(), n = CT.rank(realm) + 1, tt = CT.title(realm, n); if (!tt) return null;
    c.titles[realm.id] = n;
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + ' · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="margin-top:10px">네르친스크에서 차르의 대사를 도와 조약을 맺은 공으로.</div></div>', '명예 작위');
    UI.toast((CT.fullName ? CT.fullName(tt, true) : tt.ko) + ' — 러시아의 명예 작위', 'crown', 6000);
    return tt.ko;
  }

  // ================================================================ 소식
  NC.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, near = !!b.met || !!(s.loc && s.loc.lon != null && s.loc.lon > 60 && s.loc.lat > 30);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('albazin1', near, 'castle', '【알바진】 청의 팔기군이 아무르 강가의 러시아 성채 알바진을 에워쌌다. 카자크들은 성을 내주고 네르친스크로 물러났다 — 그리고 청군이 돌아가자 몰래 돌아와 성을 다시 쌓았다.');
    news('albazin2', near, 'skull', '【두 번째 알바진】 청군이 다시 쌓은 알바진을 또 에워쌌다. 지휘관 톨부진이 대포에 맞아 쓰러지고, 성 안의 카자크 팔백 명 가운데 남은 사람은 수십뿐이라 한다.');
    news('truce', near, 'scroll', '【포위를 풀다】 모스크바의 사자가 북경에 닿자 강희제가 알바진의 포위를 풀라고 명했다. 두 나라가 국경을 의논할 사절을 보낸다고 한다.');
    news('embassy', near && b.joined !== 'yes', 'flag', '【사절단】 영시위내대신 송고투가 이끄는 청의 사절단이 북경을 떠났다. 예수회의 페레이라와 제르비용 신부가 라틴어 통역으로 따라간다.');
    news('treatyNews', near && b.joined !== 'yes', 'scroll', '【네르친스크 조약】 청과 러시아가 실카 강가의 네르친스크에서 조약을 맺었다. 아르군 강과 외흥안령을 경계로 삼고, 알바진은 허물며, 여권을 가진 상인은 오갈 수 있다. 조약문은 라틴어로 썼다 — 두 나라 모두 서로의 말을 몰랐기 때문이다.');
    return out;
  };

  // ================================================================ ① 사절단
  function embassyOpen() {
    var b = st(), t = today(), c = cityNow(); if (!b || b.joined || t < D.from) return false;
    return (c === PEKING && t <= D.qingTo) || (c === IRKUTSK && t <= D.ruTo);
  }
  async function embassy() {
    var b = st(), s = S(), qing = cityNow() === PEKING;
    b.met = 1; b.side = qing ? 'qing' : 'ru';
    var latin = lang(LATIN);
    await withPic(qing ? 'nc_peking' : 'nc_irkutsk', qing ? '북경의 예수회 (1689)' : '이르쿠츠크의 대사 (1689)', function () { return play(qing ? [
      [null, '북경 남당. 망원경과 혼천의 사이에서 청나라 관복을 입은 서양 신부 둘이 지도를 펼쳐 놓고 있다. 아무르 강 위쪽이 텅 비어 있다.'],
      ['nc_pereira', '토마스 페레이라 신부요. 포르투갈 사람이지요. 황제께서 러시아와 국경을 정하라며 송고투 대인을 보내시는데, 두 나라는 서로의 말을 한 마디도 모르오. 그래서 라틴어로 이야기하기로 했소.'],
      ['nc_gerbillon', '제르비용이오. 라틴어를 아는 사람은 우리 둘뿐인데, 저쪽 대사 골로빈도 라틴어 통역을 데려온다더군요. 서양의 바다를 다닌 선장이 곁에 있으면 든든하겠소.' + (latin ? ' 라틴어도 하신다니 더욱 좋소.' : ' 라틴어를 몰라도 괜찮소 — 서양 사람들이 어떻게 흥정하는지 아는 눈이 필요하오.')],
      ['nc_songgotu', '(문간에 서서) 서양 선장이라. 황제 폐하께서는 서양 사람들이 정직하다고 믿으시지. …나는 아직 모르겠소. 따라오겠다면 오시오. 길은 멀고, 초원에서는 갈단의 준가르가 날뛰고 있소.']
    ] : [
      [null, '이르쿠츠크의 나무 성채. 담비 모피를 실은 썰매가 줄지어 들어온다. 성채 안 통나무 집에서 털모자를 쓴 사내가 지도를 노려보고 있다.'],
      ['nc_golovin', '차르의 전권 대사 표도르 골로빈이오. 모스크바를 떠난 지 세 해째요. 셀렌긴스크에서는 몽골 사람들에게 에워싸여 겨울을 났지. 이제 네르친스크에서 청의 사절과 만나오.'],
      ['nc_golovin', '청은 예수회 신부를 통역으로 데려온다 하오. 라틴어로 이야기한다더군. 그 신부들이 누구 편에 설지 누가 아오? 우리 쪽에도 서양을 아는 눈이 하나 더 있어야 하오.' + (latin ? ' 그대는 라틴어를 한다지?' : ''),],
      [COSSACK, '(문간에서) 대사 나리, 알바진은 우리 피로 쌓은 성입니다. 그걸 내주시면 안 됩니다!']
    ]); });
    var v = await UI.ask(qing ? '청의 사절단과 함께 네르친스크로 가겠는가?' : '골로빈의 사절단과 함께 네르친스크로 가겠는가?', [
      { label: '함께 간다 — 회담이 열리는 날(8월 22일)까지 날이 지나간다', value: 'yes', icon: 'map' },
      { label: '사양한다', value: 'no' }], me());
    b.joined = v === 'yes' ? 'yes' : 'no';
    if (b.joined !== 'yes') { await play([[qing ? 'nc_pereira' : 'nc_golovin', '그렇다면 할 수 없지요. 하느님이 좋은 경계를 그어 주시길.']]); log('네르친스크로 가는 사절단에 함께하지 않았다.'); return; }
    log((qing ? '북경에서 송고투의 청 사절단' : '이르쿠츠크에서 골로빈의 러시아 사절단') + '과 함께 네르친스크로 떠났다.');
    await UI.fade(function () { var d = Math.max(1, Math.min(130, U.dayIndex({ y: 1689, m: 8, d: 22 }) - U.dayIndex(s.date))); if (G.Game.passDays) G.Game.passDays(d); });
    await talks();
  }

  // ================================================================ ② 실카 강가의 천막
  async function talks() {
    var b = st(), qing = b.side === 'qing';
    await withPic('nc_tents', '실카 강가의 천막 (1689)', function () { return play([
      [null, '실카 강과 네르차 강이 만나는 곳. 한쪽 강가에는 청의 비단 천막과 팔기의 깃발, 강 위에는 청의 배 수십 척. 맞은편 나무 성채 앞에는 러시아의 천막이 섰다. 두 천막 사이 들판 한가운데 회담 천막이 하나.'],
      [null, '양쪽 대사가 같은 때에 말에서 내리고, 같은 걸음으로 천막에 들어가 같은 높이의 의자에 앉는다. 누가 먼저 앉느냐로 반나절을 다투었다.'],
      ['nc_golovin', '(라틴어로) 아무르 강을 경계로 합시다. 강 북쪽은 차르의 땅, 남쪽은 황제의 땅.'],
      ['nc_songgotu', '(페레이라의 통역을 듣고) 아무르 강 북쪽에 사는 사람들은 예부터 우리 만주의 사람들이오. 바이칼 호까지가 우리 땅이오. 네르친스크도 우리 땅이고.'],
      ['nc_pereira', '(제독에게 낮은 목소리로) 이대로면 오늘 안에 깨지겠소. 선장, 그대라면 어디에 선을 긋겠소?']
    ]); });
    var v1 = await UI.ask('경계를 어디에 그을까', [
      { label: '아르군 강과 외흥안령(스타노보이 산맥)의 산마루', value: 'argun', icon: 'map' },
      { label: '아무르 강 — 러시아가 바라는 대로', value: 'amur' },
      { label: '바이칼 호 — 청이 처음 요구한 대로', value: 'baikal' }], me());
    b.border = v1;
    await play(v1 === 'argun'
      ? [['nc_gerbillon', '산마루라… 산은 옮길 수 없으니 다툴 일도 적지요. 아르군 강 서쪽은 러시아, 외흥안령 남쪽은 청. 네르친스크는 러시아에 남고.'], ['nc_golovin', '(지도를 한참 보다가) …네르친스크를 지킨다면 생각해 볼 수 있소.']]
      : v1 === 'amur'
        ? [['nc_songgotu', qing ? '(얼굴이 굳으며) 그대는 누구의 사람이오? 아무르 강을 내주라니.' : '아무르 강이라니, 그건 전쟁을 하자는 말이오.'], ['nc_pereira', '…회담 천막의 공기가 차가워졌소.']]
        : [['nc_golovin', qing ? '바이칼이라고? 그렇다면 우리는 여기서 돌아가겠소!' : '(제독을 노려보며) 그대는 대체 누구 편이오?'], ['nc_gerbillon', '…오늘은 여기까지 해야겠소.']]);
    var v2 = await UI.ask('알바진 성은 어떻게 할까', [
      { label: '성을 허물고 러시아 사람을 물린다', value: 'raze', icon: 'castle' },
      { label: '성을 남겨 둔다', value: 'keep' }], me());
    b.albazin = v2;
    await play(v2 === 'raze'
      ? [['nc_songgotu', '좋소. 그 성 하나 때문에 두 번이나 군사를 보냈소. 허물어 버리면 다툴 까닭이 없소.'], ['nc_golovin', '(한숨) …카자크들이 나를 원망하겠군. 하지만 그들도 살아서 돌아가야 하오.']]
      : [['nc_songgotu', '알바진을 남기면 내년에 또 카자크가 내려올 것이오. 그렇게는 못 하오.'], ['nc_golovin', '(고개를 저으며) 저 사람이 받아들이지 않을 것이오.']]);
    // ⑶ 깨어진 회담의 밤
    await play([
      [null, '여드레째. 회담이 깨졌다. 청의 팔기가 강을 건너 러시아 성채를 에워싸고, 러시아 쪽 부랴트 사람들이 청의 진영으로 넘어온다. 성채 위에서 대포를 끌어올리는 소리가 들린다.'],
      [BANNER, '대인께서 이르시길, 내일 아침까지 답이 없으면 성채를 치라 하셨소.'],
      ['nc_gerbillon', '(천막 밖, 등불 아래에서) 선장… 오늘 밤이 마지막이오. 누군가 두 천막을 오가며 말을 이어 붙여야 하오.']
    ]);
    var p = draftP();
    var v3 = await UI.ask('깨어진 회담의 밤', [
      { label: '밤새 두 천막을 오가며 라틴어 초안을 다듬는다 (' + Math.round(p * 100) + '%)', value: 'draft', icon: 'scroll' },
      { label: '배의 대포 이야기를 꺼내 한쪽에 겁을 준다', value: 'threat', icon: 'cannon' },
      { label: '신부들에게 맡기고 천막에서 기다린다', value: 'wait' }], me());
    b.night = v3;
    if (v3 === 'draft') {
      b.draft = U.chance(p) ? 'ok' : 'fail';
      await play(b.draft === 'ok'
        ? [[null, '등불 하나를 들고 강가의 들판을 몇 번이나 건넜다. 「…두 나라의 사냥꾼은 경계를 넘지 않는다. 넘으면 그 나라가 붙잡아 돌려보낸다…」 한 줄씩, 양쪽이 고개를 끄덕일 때까지 고쳐 썼다.'],
          ['nc_pereira', '(새벽, 지친 얼굴로 웃으며) 됐소. 골로빈이 서명하겠다 하오. 송고투 대인도. …그대가 쓴 그 문장, 「여권을 가진 상인은 오갈 수 있다」 — 그게 마음을 돌렸소.']]
        : [[null, '등불을 들고 두 천막을 오갔지만, 말 한 마디가 두 번 옮겨질 때마다 뜻이 비틀어졌다. 새벽녘, 신부들이 지친 얼굴로 제독의 초안을 내려놓았다.'],
          ['nc_gerbillon', '애썼소, 선장. 나머지는 우리가 이어 붙이겠소. 결국 양쪽 다 전쟁은 원하지 않으니까.']]);
    } else if (v3 === 'threat') {
      b.draft = 'fail';
      await play([[qing ? 'nc_golovin' : 'nc_songgotu', '(차갑게) 바다의 대포로 초원에서 무엇을 하겠다는 거요? …그대의 말은 듣지 않겠소.'], ['nc_pereira', '선장, 오늘 밤은 칼 이야기를 할 때가 아니었소.']]);
    } else {
      b.draft = 'wait';
      await play([[null, '천막 밖에서 밤새 말발굽 소리와 낮은 목소리들이 오갔다. 새벽에 신부들이 돌아와 고개를 끄덕였다.']]);
    }
    b.grade = b.border === 'argun' && b.albazin === 'raze' && b.draft === 'ok' ? 'good' : 'ok';
    await treaty();
  }

  // ================================================================ ③ 조약 (1689.9.7)
  async function treaty() {
    var b = st(), s = S(), qing = b.side === 'qing', k = K(), good = b.grade === 'good';
    await UI.fade(function () { var d = U.dayIndex({ y: 1689, m: 9, d: 7 }) - U.dayIndex(s.date); if (d > 0 && G.Game.passDays) G.Game.passDays(Math.min(d, 30)); });
    await withPic('nc_treaty', '네르친스크 조약 (1689.9.7)', function () { return play([
      [null, '1689년 9월 7일. 회담 천막 안, 라틴어로 쓴 두 벌의 조약문이 탁자 위에 놓였다. 만주어와 러시아어로 옮긴 글도 곁에 있다.'],
      [null, '송고투와 골로빈이 차례로 서명하고 도장을 찍는다. 두 대사가 일어나 조약문을 바꿔 들고 — 하늘과 신의 이름으로 맹세한다. 「이 경계를 넘는 자는 벌을 받으리라.」'],
      ['nc_golovin', good ? '(제독에게) 네르친스크는 우리에게 남았소. 상인들은 여권을 들고 북경까지 갈 수 있소. 이 정도면 차르께 고개를 들 수 있겠소.' : '(굳은 얼굴로) 알바진을 잃었소. 그래도 전쟁보다는 낫겠지.'],
      ['nc_songgotu', good ? '(처음으로 웃으며) 서양 선장, 황제께서 그대 이야기를 들으시면 기뻐하실 것이오. 흑룡강의 사냥꾼들이 이제 서로를 쏘지 않겠구려.' : '이것으로 북쪽은 조용해질 것이오. 이제 서쪽의 갈단을 칠 수 있겠소.']
    ]); });
    give('nc_copy');
    var key = good ? 'good' : 'ok';
    var f = G.Fame.add('so', (k.fame || {})[key] || 0), g = (k.gold || {})[key] || 0; s.player.gold += g;
    var tt = null;
    if (qing) await play([['nc_pereira', '황제께서 사람을 보내셨소. 「서양 선장에게 비단과 은을 내리라」 하셨다는구려. …폐하는 이 조약을 「서양 사람들이 정직하게 통역한 덕」이라 하셨다오.']]);
    else { await play([['nc_golovin', '차르께 그대의 이름을 올리겠소. 모피 상인들이 그대의 이름으로 건배할 것이오.']]); if (good) tt = await titleUp(); }
    b.done = 1;
    log('네르친스크에서 청과 러시아의 조약을 지켜보았다' + (good ? ' — 경계를 아르군 강과 외흥안령으로 긋고 밤새 라틴어 초안을 다듬어 「좋은 조약」을 이끌었다.' : '.') + ' (사교 명성 +' + f + ' · 금화 +' + U.num(g) + (tt ? ' · 러시아의 명예 작위 ' + tt : '') + ')');
    UI.toast('네르친스크 조약문 사본 (라틴어) · 금화 +' + U.num(g), 'scroll', 6000);
    if (G.Audio) G.Audio.sfx('discover');
    refresh();
  }

  // ================================================================ 도시에 들어설 때
  NC.pending = function () { return !!S() && embassyOpen(); };
  NC.check = async function () {
    if (NC._busy) return false; NC._busy = true;
    try { if (embassyOpen()) await embassy(); } catch (e) { console.error(e); }
    NC._busy = false; refresh();
    return true;
  };
  NC._t = { embassy: embassy, talks: talks, treaty: treaty };
})(window.G = window.G || {});
