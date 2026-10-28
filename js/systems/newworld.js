/* 콜럼버스의 신대륙 발견과 그 뒤 (G.NewWorld) 2026-10-29 사용자 요청
   「콜럼버스의 신대륙 발견 · 콜럼버스의 달걀 · 유럽과 아메리카의 지속적인 접촉 — 정복·식민화·질병 확산 · 의사가 있으면 원주민을 살린다」
   콜론(크리스토발 콜론 = 콜럼버스)은 경쟁 탐험가로 이미 게임에 있다 (js/data/rivals.js · 탐험 함대 colon1 — js/systems/seafolk.js).
   역사는 바뀌지 않는다. 바뀌는 것은 제독이 그 곁에서 무엇을 보았고, 누구에게 손을 내밀었는가다. (사람·기념품: js/data/newworld.js)
   ■ 흐름
     ① 산타페의 약속 (세비야 1491.10.1~1492.4.16 · 그라나다 1492.1.2~4.16): 위원회에 퇴짜 맞고 떠나려는 콜론. 금화 invest닢을 대 주거나(산탄헬처럼)
        말로 북돋우거나 비웃는다. 그라나다라면 여왕의 전령이 그를 불러 세운다.
     ② 바다 한가운데의 사흘 (1492.9.7~10.11, 바다에서 콜론의 함대(colon1)에 신호): 선원들이 돌아가자고 들고일어난다 — 식량·물을 gift씩 나눠 준다.
     ③ 과나하니의 아침 (1492.10.12~12.24, 바다에서 콜론의 함대에 신호): 「육지다!」 첫 상륙과 타이노 사람들. 콜론의 일지에 적힌 불길한 한 줄.
        (함대가 부서져 항해가 늦어지면 ②③의 날짜도 그만큼 늦는다 — SeaFolk.delay)
     ④ 콜론의 달걀 (바르셀로나 1493.4.1~6.30 · 세비야 1493.4.1~9.20, 1496.6.11~1498.5.29, 1500.11.25~1502.5.10):
        멘도사 추기경의 잔치. 「누구라도 할 수 있었다」는 귀족들에게 콜론이 달걀을 세워 보라 한다. 제독도 해 본다 —
        그냥 세운다(실패) · 소금을 뿌린다(꼼수) · 밑동을 깨뜨린다(콜론보다 먼저!) · 못 하겠다. 기념품 「콜론의 달걀」. ①에 돈을 댔으면 payback배를 돌려받는다.
     ⑤ 엔코미엔다 (산토도밍고 1503.1.1~1511.12.20): 오반도 총독이 타이노 마을 하나를 맡으라 한다 — 받으면 금화 encGold·악명, 거절하면 사교 명성.
     ⑥ 「이들은 사람이 아닙니까?」 (산토도밍고 1511.12.21~1512.12.31): 몬테시노스 수사의 설교. 엔코미엔다를 가졌다면 마을을 놓아줄지 고른다. 젊은 라스 카사스.
     ⑦ 천연두 — 의원의 손 (1518.12.1~1520.8.31, 산토도밍고·산티아고·자메이카 — 도시마다 한 번):
        섬을 휩쓴 첫 천연두. 의학 특기를 가진 사람(제독·부하)이 있으면 마을을 돌봐 savedBase + 의학 단계×savedPerLv명을 살리고,
        약재 herbs를 쓰면 savedHerbs명을 더 살린다. 의원이 없으면 식량을 나눠 savedFood명 — 의원을 데려와 retry일 뒤 다시 올 수 있다.
        산토도밍고에서는 바오루코 산의 추장 엔리키요가 기념품 「타이노의 세미」를 건넨다. 산티아고(쿠바)는 담배, 자메이카는 카사바 빵(식량).
     소식 (이 사건의 누구라도 만난 사람만): 산타페 협약 · 귀환 · 두 번째 항해(말·돼지·사탕수수) · 라 나비다드 · 라 이사벨라 · 베가 레알과 공납 ·
           쇠사슬의 콜론 · 오반도의 함대 · 샤라과 · 콜론의 죽음 · 하투에이 · 라스 카사스의 회심 · 아프리카 사람들 · 천연두 · 엔리키요 · 새 법(1542) · 살아남은 사람들
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/nw_*.webp — images/legend-events/NEWWORLD_PROMPT.md
   ■ 저장: s.newworld = { met, santafe, invest, cross, land, egg, eggHow, paid, enc: 1|2(놓아줌)|3(거절), sermon, pox: {도시: 'doc'|'food'|'away'}, poxAt: {도시: 날}, saved, cemi, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var NW = G.NewWorld = {};
  var SEVILLE = 7, GRANADA = 10, BARCELONA = 12, SDOM = 194, SANTIAGO = 195, JAMAICA = 197, COLON = '크리스토발 콜론';
  function K() { return G.BALANCE.newWorld; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  function dayIdx(n) { return U.dayIndex({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }); }
  function since(n) { return U.dayIndex(S().date) - dayIdx(n); }
  function inR(a, b) { var t = today(); return t >= a && t <= b; }

  var NEWS = ['capit', 'back', 'second', 'navidad', 'isabela', 'tribute', 'chains', 'ovando', 'xaragua', 'colonDies', 'hatuey', 'lascasas', 'africa', 'pox', 'enriquillo', 'remember', 'newlaws'];
  var NEWS_AT = { capit: 14920417, back: 14930315, second: 14930925, navidad: 14931128, isabela: 14940106, tribute: 14950327, chains: 15001001, ovando: 15020415,
    xaragua: 15031001, colonDies: 15060520, hatuey: 15120202, lascasas: 15140815, africa: 15180818, pox: 15181210, enriquillo: 15190901, remember: 15200901, newlaws: 15421120 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.newworld) {
      s.newworld = { told: {}, pox: {}, poxAt: {} };
      NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.newworld.told[k] = 1; });
    }
    var b = s.newworld; b.told = b.told || {}; b.pox = b.pox || {}; b.poxAt = b.poxAt || {};
    return b;
  }
  NW.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker('nw_' + id) : { name: id, lang: 3 }; }
  function colon() {
    var A = G.Art, sp = { name: COLON, lang: 3 };
    try { if (A && A.rivalSpec) sp.portrait = A.rivalSpec(COLON); if (G.Img && G.Img.chain && G.Img.chain.rivalHalf) sp.half = G.Img.chain.rivalHalf(COLON); } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function mate() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관' }; }
  function who(k) { return k === 'P' ? me() : k === 'colon' ? colon() : k === 'first' ? mate() : k ? H(k) : {}; }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function infamy(n) { var p = S().player; p.notoriety = Math.max(0, (p.notoriety || 0) + n); }
  function foundWest() { var s = S(), d = s.disc && s.disc.westroute; return !!(d && d.me); }
  function log(t) { G.State.log(t); }

  // ================================================================ ① 산타페의 약속
  function santafeOpen() {
    var b = st(), c = cityNow();
    return !!(b && !b.santafe && ((c === SEVILLE && inR(14911001, 14920416)) || (c === GRANADA && inR(14920102, 14920416))));
  }
  async function santafe() {
    var b = st(), s = S(), gr = cityNow() === GRANADA; b.met = 1; b.santafe = 1;
    await withPic('nw_santafe', gr ? '산타페의 약속 (1492)' : '세비야의 콜론', function () { return play([
      [null, gr ? '그라나다가 막 함락된 겨울. 알람브라 궁전 탑에 카스티야의 깃발이 걸렸다. 성문 밖 길에서 노새에 짐을 실은 백발 섞인 사내가 고개를 떨군 채 북쪽으로 길을 잡는다.'
                : '세비야 강가 여인숙. 해도와 편지 뭉치를 상자에 쓸어 담는 사내가 있다. 낯익은 얼굴 — 술집 구석에서 늘 해도를 펼치던 그 사내다.'],
      ['colon', '…또 퇴짜요. 학자 양반들 말로는 내 셈이 틀렸다더군. 지구가 생각보다 훨씬 커서 서쪽으로 가면 인디아스에 닿기 전에 물과 식량이 떨어진다고. 그리고 내가 요구하는 게 너무 많다고 — 「대양 제독」의 칭호, 새 땅의 부왕 자리, 거기서 나는 것의 열에 하나.'],
      ['colon', '일곱 해를 기다렸소. 포르투갈 왕도 날 비웃었지. 이제 프랑스로 가 보려오. 거기서도 안 되면… 잉글랜드로.'],
      ['first', '(제독에게 낮게) 저 사람 셈이 정말 틀렸다면 바다 한가운데서 모두 굶어 죽습니다. 하지만 맞다면… 세상이 뒤집히겠지요.']
    ]); });
    var gold = s.player.gold, inv = K().invest;
    var v = await UI.ask('서쪽으로 곧장 가면 인디아스에 닿는다는 사내 — 어떻게 할까?', [
      { label: '항해 밑천에 보태라고 금화 ' + U.num(inv) + '닢을 내놓는다', value: 'invest', icon: 'coin', dis: gold < inv },
      { label: '「당신 같은 고집쟁이라면 해낼 거요」라고 북돋운다', value: 'cheer', icon: 'heart' },
      { label: '「바다 끝에서 떨어지지나 마시오」라며 웃는다', value: 'laugh' }], me());
    if (v === 'invest') {
      s.player.gold -= inv; b.invest = inv;
      await play([['colon', '…진심이오? 이름도 모르는 사람에게서 이런 돈을 받다니. 좋소, 장부에 적어 두겠소. 인디아스의 금을 싣고 돌아오는 날, 몇 곱으로 갚으리다.']]);
      log((gr ? '그라나다' : '세비야') + '에서 크리스토발 콜론의 서쪽 항해에 금화 ' + U.num(inv) + '닢을 보탰다.');
    } else if (v === 'cheer') {
      fame('so', 20);
      await play([['colon', '하하! 바다 사람의 말은 학자 열의 말보다 낫구려. 고맙소. 조금만 더 버텨 보리다.']]);
      log((gr ? '그라나다' : '세비야') + '에서 떠나려는 크리스토발 콜론을 북돋웠다.');
    } else {
      await play([['colon', '바다에 끝이 있다면 내가 제일 먼저 보고 오리다. 그때 다시 웃어 보시오.']]);
      log((gr ? '그라나다' : '세비야') + '에서 크리스토발 콜론의 서쪽 항해 이야기를 듣고 웃었다.');
    }
    if (gr) {
      await play([
        [null, '그때 말발굽 소리. 궁정의 전령이 먼지를 일으키며 달려와 콜론을 불러 세운다.'],
        [null, '「크리스토발 콜론! 여왕 폐하께서 다시 부르십니다. 재무관 산탄헬 나리가 폐하를 설득하셨소 — 돈은 아라곤 왕실 금고에서 빌려 오겠다고!」'],
        ['colon', '(노새 고삐를 놓치며) …하느님! 들었소? 서쪽이오, 곧장 서쪽! 8월이면 팔로스 항에서 배를 띄우겠소. 바다에서 만나거든 신호를 보내시오!']
      ]);
    } else await play([['colon', '마지막으로 한 번만 더 산타페의 여왕 진영에 가 보겠소. 일이 되면 여름에 팔로스에서 배를 띄울 거요. 바다에서 만나거든 신호를 보내시오.']]);
    UI.toast('1492년 8월 콜론의 함대가 팔로스에서 서쪽으로 — 9~12월 대서양에서 그 함대를 만나면 신호를 보내 보자', 'ship', 6000);
    refresh();
  }

  // ================================================================ ②③ 바다에서 — 콜론의 함대 (seafolk 탐험 함대 colon1)
  function off(n) { return G.SeaFolk && G.SeaFolk.delay && n && n.exp ? G.SeaFolk.delay(n.exp) : 0; }
  function inRy(a, b, dy) { return inR(a + dy * 10000, b + dy * 10000); }
  NW.seaOpen = function (n) {
    var b = st(); if (!b || !n || !n.exp || n.exp.id !== 'colon1') return null;
    var dy = off(n);
    if (!b.cross && inRy(14920907, 14921011, dy)) return 'cross';
    if (!b.land && inRy(14921012, 14921224, dy)) return 'land';
    return null;
  };
  async function cross() {
    var b = st(), s = S(), f = s.fleet, g = K().gift; b.met = 1; b.cross = 1;
    await withPic('nw_mutiny', '바다 한가운데의 사흘 (1492.10)', function () { return play([
      [null, '카나리아 제도를 떠난 지 한 달. 땅 그림자 하나 보이지 않는 바다 위에서 산타 마리아호의 갑판이 시끄럽다. 선원들이 돛대 밑에 모여 주먹을 휘두른다.'],
      ['colon', b.santafe ? '…당신이로군! 하느님이 보내셨나 보오. 보시오, 저 겁쟁이들을. 바다가 끝없다고, 돌아가지 않으면 나를 바다에 던지겠다고 하오.' : '낯선 배로군. 보시오, 저 겁쟁이들을. 바다가 끝없다고, 돌아가지 않으면 나를 바다에 던지겠다고 하오.'],
      ['colon', '사흘이오. 사흘만 더 서쪽으로 가 보고, 그래도 땅이 없으면 뱃머리를 돌리겠다고 약속했소. 갈대가 떠내려오고 새들이 남서쪽으로 날아가오. 땅은 가까이 있소. 나는 믿소.'],
      ['first', '제독, 저 배들 물통이 바닥을 드러냈습니다. 굶주린 선원은 무슨 짓이든 합니다.']
    ]); });
    var ok = f.food >= g && f.water >= g;
    var v = await UI.ask('바다 한가운데 — 콜론의 함대', [
      { label: '식량과 물을 ' + g + '씩 건네 사흘을 버티게 한다', value: 'give', icon: 'bread', dis: !ok },
      { label: '「약속한 사흘이 지나면 돌아가시오」라고 일러 준다', value: 'warn' },
      { label: '그대로 지나간다', value: 'pass' }], me());
    if (v === 'give') {
      f.food -= g; f.water -= g; var so = fame('so', 60);
      await play([['colon', '은혜는 잊지 않겠소. 땅에 닿거든 그 땅의 첫 이야기는 당신 몫이오.'], [null, '물통을 받은 선원들의 함성이 잦아든다. 세 척의 배가 다시 서쪽으로 돛을 편다.']]);
      log('대서양 한가운데에서 크리스토발 콜론의 함대에 식량과 물을 ' + g + '씩 건넸다. (사교 명성 +' + so + ')');
    } else if (v === 'warn') await play([['colon', '사흘이면 충분하오. 두고 보시오.']]);
    refresh();
  }
  async function land() {
    var b = st(), s = S(); b.met = 1; b.land = 1;
    await withPic('nw_guanahani', '과나하니의 아침 (1492.10.12)', function () { return play([
      [null, '10월 12일 새벽 두 시. 앞서 가던 핀타호에서 망꾼 로드리고 데 트리아나가 소리친다. 「티에라! 티에라! — 육지다!」 달빛 아래 하얀 모래톱이 빛난다.'],
      ['colon', '…내가 어젯밤 열 시에 이미 불빛을 보았소. 그러니 여왕 폐하께서 내건 첫 육지의 상금은 내 것이오. (트리아나가 입을 다문다)'],
      [null, '아침. 콜론이 카스티야의 깃발을 들고 모래 위에 무릎을 꿇는다. 섬의 이름은 과나하니 — 그는 「산살바도르(거룩한 구세주)」라 새로 부른다. 숲에서 벌거벗은 사람들이 조심스레 다가온다. 앵무새와 무명 실타래, 창끝 대신 물고기 이빨을 단 투창을 들고.'],
      [null, '그들은 스스로를 「타이노」 — 좋은 사람들 — 라 부른다. 유리구슬과 작은 방울을 받고는 아이처럼 웃는다. 칼날을 쥐었다가 손을 베이고는 놀라 바라본다. 쇠를 모르는 사람들이다.'],
      ['colon', b.cross ? '보시오, 내가 뭐랬소! 그리고 약속대로, 이 땅의 첫 이야기는 당신 몫이오.' : '보시오! 인디아스요. 대칸의 땅이 멀지 않을 거요.'],
      ['colon', '(일지에 적으며 혼잣말로) 「…그들은 순하고 무기를 모른다. 좋은 일꾼이 될 것이다. 쉰 명이면 모두 다스릴 수 있으리라. 그들 코에 금 조각이 걸려 있다. 금이 어디서 나는지 물어야 한다.」'],
      ['first', '(제독에게만 들리게) …방금 저 일지의 마지막 줄, 들으셨습니까? 이 해변의 웃음이 오래가지 않을 것 같습니다.']
    ]); });
    var so = fame('so', 80);
    log('과나하니 섬에서 크리스토발 콜론의 첫 상륙을 지켜보았다. 타이노 사람들이 앵무새와 무명 실타래를 들고 나왔다. (사교 명성 +' + so + ')');
    UI.toast('유럽과 아메리카가 처음 만났다 — 이 만남은 다시 끊기지 않는다', 'ship', 5600);
    refresh();
  }
  (function hookSea() {
    var SF = G.SeaFolk; if (!SF || SF._newworld) return; SF._newworld = true;
    var ot = SF.talk;
    SF.talk = async function (n, w) {
      var k = NW.seaOpen(n);
      if (k && !NW._busy) { NW._busy = true; try { if (k === 'cross') await cross(); else await land(); } catch (e) { console.error(e); } NW._busy = false; return; }
      return ot.apply(this, arguments);
    };
  })();

  // ================================================================ ④ 콜론의 달걀
  var EGG_SEV = [[14930401, 14930920], [14960611, 14980529], [15001125, 15020510]];
  function eggOpen() {
    var b = st(), c = cityNow(); if (!b || b.egg) return false;
    if (c === BARCELONA) return inR(14930401, 14930630);
    if (c === SEVILLE) return EGG_SEV.some(function (w) { return inR(w[0], w[1]); });
    return false;
  }
  async function egg() {
    var b = st(), s = S(), bcn = cityNow() === BARCELONA, beat = foundWest(); b.met = 1; b.egg = 1;
    await withPic('nw_egg', '콜론의 달걀', function () { return play([
      [null, bcn ? '바르셀로나. 국왕 부부가 「대양 제독」 콜론을 맞은 지 며칠 뒤, 멘도사 추기경의 연회장. 탁자 위에는 앵무새 깃털과 금 조각, 그리고 「인디오」라 불리는 낯선 사람 몇이 구경거리처럼 서 있다.'
                 : '세비야, 대주교관의 연회. 촛불 아래 귀족들이 포도주 잔을 기울인다. 상석에 「대양 제독」 크리스토발 콜론이 앉아 있다.'],
      ['mendoza', '제독, 그대의 이야기는 언제 들어도 즐겁구려. 자, 여러분, 잔을 드시오. 인디아스로 가는 길을 연 사람을 위하여!'],
      [null, '한 귀족이 비웃음을 섞어 말한다. 「대단한 일이긴 하지요. 하지만 따지고 보면 배를 띄워 서쪽으로 곧장 간 것뿐 아닙니까? 이 자리에 누구라도 배 세 척만 있었으면 했을 일이지요.」'],
      beat ? [null, '다른 귀족이 제독을 가리키며 거든다. 「게다가 저기 저 선장은 콜론 제독보다 먼저 서쪽 섬들에 닿았다지 않소?」 좌중이 웃음을 터뜨린다.'] : null,
      ['colon', '(말없이 삶은 달걀 하나를 집어 들며) 좋소. 그렇다면 여기 계신 분들 가운데 누구라도, 이 달걀을 아무것도 받치지 말고 탁자 위에 세워 보시오.'],
      [null, '귀족들이 차례로 달걀을 세워 본다. 손을 떼는 순간마다 달걀은 데구루루 굴러간다. 웃음과 투덜거림. 달걀이 제독 앞에 왔다.'],
      ['colon', '자, 선장. ' + (beat ? '서쪽 섬들에 먼저 닿은 당신이라면 이것쯤이야 쉽겠지요?' : (b.invest ? '내 항해에 돈을 댄 눈 밝은 분이니 이것쯤이야 쉽겠지요?' : '당신 차례요.'))]
    ]); });
    var craft = Math.max(R.skillBest('craft').lv || 0, R.skillBest('sci').lv || 0);
    var v = await UI.ask('달걀을 탁자 위에 세워라 — 아무것도 받치지 말고', [
      { label: '조심조심 손끝으로 세워 본다', value: 'try', icon: 'eye' },
      { label: '탁자에 소금을 한 꼬집 뿌리고 그 위에 세운다', value: 'salt', icon: 'sack' },
      { label: '밑동을 탁자에 톡 쳐서 살짝 깨뜨린 뒤 세운다' + (craft ? ' (세공·과학)' : ''), value: 'crack', icon: 'tools' },
      { label: '「못 하겠소」 하고 달걀을 돌려준다', value: 'give' }], me());
    b.eggHow = v;
    if (v === 'crack') {
      var so1 = fame('so', 120);
      await play([
        [null, '톡. 밑동이 살짝 우그러진 달걀이 탁자 위에 꼿꼿이 선다. 연회장이 조용해졌다가 웃음이 터진다.'],
        ['colon', '…허! 내가 하려던 것을 당신이 먼저 해 버렸구려. 내 달걀을 훔쳤소, 선장! (그러고는 소리 내어 웃는다)'],
        ['colon', '여러분, 보셨소? 방금 저 사람이 한 것을 보고 나니 이제 여러분 모두 「그건 나도 하겠다」 싶을 거요. 바로 그거요. 누군가 한 번 해 보이면, 그다음엔 누구나 쉽다고 말하지요. 서쪽 바다도 그렇소.'],
        ['mendoza', '하하! 오늘 밤 이야기의 주인이 둘이 되었구려.']
      ]);
      log('바르셀로나·세비야의 연회에서 「콜론의 달걀」을 콜론보다 먼저 세웠다. (사교 명성 +' + so1 + ')');
    } else {
      if (v === 'try') await play([[null, '숨을 죽이고 손끝을 뗀다. …달걀이 반 바퀴 돌더니 쓰러진다. 「거보시오!」 귀족들이 웃는다.']]);
      else if (v === 'salt') await play([[null, '소금 알갱이 위에 달걀이 아슬아슬하게 선다. 「속임수다! 받쳤잖소!」 귀족들이 소리친다.'], ['colon', '하하, 소금도 하나의 길이긴 하오. 처음 생각해 낸 사람에게는.']]);
      await play([
        ['colon', '그럼 내가 해 보리다.'],
        [null, '콜론이 달걀 밑동을 탁자에 톡 쳐서 살짝 깨뜨린 뒤 세운다. 달걀이 꼿꼿이 선다.'],
        [null, '「그거야 누구라도 하겠소!」 귀족들이 외친다.'],
        ['colon', '그렇소. 내가 하는 걸 보고 난 다음에는 누구라도 하지요. 서쪽 바다도 마찬가지요. 길이 열리고 나면 누구나 쉬웠다고 말하는 법이오.']
      ]);
      var so2 = fame('so', v === 'salt' ? 60 : 40);
      log('연회에서 크리스토발 콜론이 깨뜨려 세운 달걀을 보았다. 「길이 열리고 나면 누구나 쉬웠다고 말한다.」 (사교 명성 +' + so2 + ')');
    }
    var got = R.addItem ? R.addItem('colon_egg') : false;
    UI.toast(got !== false ? '기념품 「콜론의 달걀」' : '소지품이 가득 차 달걀은 탁자에 두고 왔다', 'star', 4600);
    if (b.invest && !b.paid) {
      var back = b.invest * K().payback; b.paid = back; s.player.gold += back;
      await play([['colon', '그리고 이것 — 약속했던 그 돈이오. 인디아스의 금으로 몇 곱 쳐서 갚소. 그날 그라나다·세비야에서 손을 내밀어 준 사람은 많지 않았지.']]);
      log('크리스토발 콜론이 항해 밑천에 보탰던 돈을 갚았다. (금화 +' + U.num(back) + ')');
      UI.toast('콜론의 빚 — 금화 +' + U.num(back), 'coin', 5000);
    }
    await play([['colon', '가을에 다시 떠나오. 이번엔 열일곱 척, 사람만 천이백. 말과 돼지, 밀과 사탕수수 모종까지 싣고. 그 섬들에 카스티야의 도시를 세울 거요.'], ['first', '…이제 저 바다는 다시는 닫히지 않겠군요.']]);
    refresh();
  }

  // ================================================================ ⑤ 엔코미엔다 · ⑥ 몬테시노스의 설교 (산토도밍고)
  function encOpen() { var b = st(); return !!(b && !b.enc && cityNow() === SDOM && inR(15030101, 15111220)); }
  async function encomienda() {
    var b = st(), s = S(); b.met = 1;
    await withPic('nw_encomienda', '엔코미엔다 — 산토도밍고', function () { return play([
      [null, '산토도밍고. 오사마 강가에 돌로 지은 집과 성당 터가 올라간다. 부두에는 말과 돼지, 사탕수수 모종이 내려지고, 거리를 오가는 타이노 사람들은 모두 등에 짐을 지고 있다.'],
      ['ovando', '먼 길 오셨소, 선장. 이 섬의 금은 시바오 산에 있소. 문제는 캘 손이 모자란다는 것이지.'],
      ['ovando', '폐하께서 「엔코미엔다」를 허락하셨소. 원주민 마을 하나를 맡아 그들에게 신앙을 가르치고 보호하는 대신, 그들의 일손을 쓰는 것이오. 그대도 한 몫 받으시오. 금광에서 반년이면 금화 ' + U.num(K().encGold) + '닢쯤은 나오오.'],
      [null, '총독의 어깨 너머로, 목에 쇠고리를 찬 사람들이 줄지어 산길을 오른다. 돌아오는 줄은 가는 줄보다 짧다.'],
      ['first', '(제독에게) 「보호」라는 말이 저렇게 무거운 쇠고리일 줄은 몰랐습니다.']
    ]); });
    var v = await UI.ask('엔코미엔다 — 타이노 마을 하나를 맡겠는가?', [
      { label: '받는다 — 금화 ' + U.num(K().encGold) + '닢 (악명 +' + K().encInfamy + ')', value: 'take', icon: 'coin' },
      { label: '거절한다 — 사람은 광산의 연장이 아니오', value: 'no', icon: 'heart' }], me());
    if (v === 'take') {
      b.enc = 1; s.player.gold += K().encGold; infamy(K().encInfamy);
      await play([['ovando', '현명하오. 이 섬에서 살아남는 법을 아는구려.'], [null, '그날 밤 장부에 마을 이름 하나와 사람 수 하나가 적혔다. 이름 옆의 숫자는 해마다 줄어들 것이다.']]);
      log('산토도밍고에서 오반도 총독에게서 엔코미엔다(타이노 마을 하나)를 받았다. (금화 +' + U.num(K().encGold) + ' · 악명 +' + K().encInfamy + ')');
      UI.toast('엔코미엔다 — 금화 +' + U.num(K().encGold) + ' · 악명 +' + K().encInfamy, 'skull', 5200);
    } else {
      b.enc = 3; var so = fame('so', 40);
      await play([['ovando', '…고결하시구려. 그 고결함으로 배가 불렀으면 좋겠소.']]);
      log('산토도밍고에서 엔코미엔다를 거절했다. (사교 명성 +' + so + ')');
    }
    refresh();
  }
  function sermonOpen() { var b = st(); return !!(b && !b.sermon && cityNow() === SDOM && inR(15111221, 15121231)); }
  async function sermon() {
    var b = st(), s = S(); b.met = 1; b.sermon = 1;
    await withPic('nw_sermon', '「이들은 사람이 아닙니까?」 (1511)', function () { return play([
      [null, '대림절 넷째 주일, 초가지붕 성당. 총독과 관리들, 엔코미엔다를 가진 정착민들이 맨 앞줄에 앉았다. 흰 수도복의 젊은 수사가 강단에 오른다.'],
      ['montesinos', '「나는 광야에서 외치는 소리다!」 여러분은 모두 죽을죄를 짓고 있습니다. 이 죄 없는 사람들에게 저지르는 잔인함과 폭정 때문에.'],
      ['montesinos', '말해 보시오. 무슨 권리로 이들을 이토록 끔찍한 종살이에 몰아넣었습니까? 제 땅에서 평화롭게 살던 이들에게 무슨 권리로 전쟁을 걸었습니까? 이들은 사람이 아닙니까? 이들에게는 이성을 가진 영혼이 없습니까? 여러분은 이들을 여러분 자신처럼 사랑해야 하지 않습니까?'],
      [null, '성당이 술렁인다. 총독의 얼굴이 붉어진다. 맨 뒷줄에서 둥근 얼굴의 젊은 사제 하나가 고개를 숙인 채 손을 꼭 쥐고 있다.'],
      ['lascasas', '(제독 곁에서 작게) …저도 쿠바에 엔코미엔다가 있습니다. 저 말이 가슴을 찌르는군요. 언젠가는 저도 대답을 해야겠지요.']
    ]); });
    if (b.enc === 1) {
      var v = await UI.ask('제독의 장부에도 타이노 마을 하나가 적혀 있다.', [
        { label: '마을을 놓아준다 — 엔코미엔다를 총독에게 돌려준다', value: 'free', icon: 'heart' },
        { label: '그대로 둔다 — 설교는 설교일 뿐이다', value: 'keep', icon: 'coin' }], me());
      if (v === 'free') {
        b.enc = 2; infamy(K().freeInfamy); var so = fame('so', 100);
        await play([['lascasas', '…당신이 먼저 했군요. 저도 곧 따르겠습니다.'], [null, '쇠고리를 벗은 사람들이 산길을 내려간다. 마을에 남은 사람은 처음의 절반도 되지 않는다.']]);
        log('몬테시노스 수사의 설교를 듣고 엔코미엔다를 돌려주었다. (사교 명성 +' + so + ' · 악명 ' + K().freeInfamy + ')');
      } else {
        s.player.gold += K().keepGold; infamy(K().keepInfamy);
        await play([[null, '총독 일행이 수도원에 몰려가 설교를 거두라 윽박지른다. 다음 주일, 몬테시노스는 같은 설교를 더 크게 되풀이했다.']]);
        log('몬테시노스 수사의 설교를 듣고도 엔코미엔다를 지켰다. (금화 +' + U.num(K().keepGold) + ' · 악명 +' + K().keepInfamy + ')');
      }
    } else {
      var so2 = fame('so', 30);
      log('산토도밍고에서 몬테시노스 수사의 「이들은 사람이 아닙니까?」 설교를 들었다. (사교 명성 +' + so2 + ')');
    }
    refresh();
  }

  // ================================================================ ⑦ 천연두 — 의원의 손
  var POX_CITIES = [SDOM, SANTIAGO, JAMAICA];
  function poxOpen() {
    var b = st(), c = cityNow(); if (!b || POX_CITIES.indexOf(c) < 0 || !inR(15181201, 15200831)) return false;
    var p = b.pox[c];
    if (!p) return true;
    return p === 'food' || p === 'away' ? NW.doctor().lv > 0 && since(b.poxAt[c]) >= K().retry : false;
  }
  NW.doctor = function () { return R.skillBest('med'); };
  function herbs() { var c = S().fleet.cargo || {}; return c.herbs ? c.herbs.q || 0 : 0; }
  async function pox() {
    var b = st(), s = S(), c = cityNow(), doc = NW.doctor(), first = !b.pox[c], sd = c === SDOM;
    b.met = 1;
    var place = sd ? '산토도밍고 서쪽, 바오루코 산 아래 타이노 마을' : c === SANTIAGO ? '산티아고 둘레의 타이노 마을' : '자메이카 해안의 타이노 마을';
    var chief = sd ? 'enriquillo' : 'cacique';
    await withPic('nw_pox', '천연두 (1518~1520)', function () { return play([
      first ? [null, '항구에 내리자 성당 종이 쉬지 않고 울린다. 사람들이 입을 천으로 가리고 다닌다. 「인디오들 사이에 고름 병이 돌아. 우리 같은 카스티야 사람은 어릴 때 다들 한 번씩 앓아서 괜찮다더군.」'] : [null, '다시 찾은 마을. 지난번보다 무덤이 늘었다.'],
      [null, place + '. 오두막(보이오)마다 사람들이 해먹에 누워 있다. 얼굴과 온몸에 고름 물집이 돋았다. 열에 들뜬 사람들이 몸을 식히려 강물에 뛰어들었다가 그대로 쓰러진다. 돌볼 사람마저 앓아누워 아이들이 굶는다.'],
      [chief, sd ? '(지친 얼굴로 에스파냐 말로) 나는 엔리키요요. 수도원에서 당신들 말과 글을 배웠소. …당신들 신이 이 병을 데려왔소. 우리 신들은 이 병의 이름을 모르오. 도와줄 수 있소? 아니면 당신도 구경하러 왔소?'
                 : '(통역을 거쳐) 바다 건너 사람들아, 이 병은 당신들 배에서 내렸다. 우리 무당의 담배 연기도 듣지 않는다. 도울 수 있다면 돕고, 아니면 떠나라.']
    ]); });
    var lv = doc.lv || 0, hb = herbs(), food = s.fleet.food, opts = [];
    if (lv > 0) {
      opts.push({ label: (doc.who || '제독') + '(의학 ' + lv + ')' + U.jx(doc.who || '제독', '이/가') + ' 마을을 돌본다 — 앓는 사람을 떼어 놓고, 물과 죽을 먹이고, 고름을 닦는다', value: 'doc', icon: 'heart' });
      opts.push({ label: '…거기에 짐칸의 약재 ' + K().herbs + '을 쓴다 (지금 ' + hb + ')', value: 'docHerb', icon: 'leaf', dis: hb < K().herbs });
    } else opts.push({ label: '식량 ' + K().foodGift + '을 나눠 주고 물을 길어다 준다 (의원이 없다)', value: 'food', icon: 'bread', dis: food < K().foodGift });
    opts.push({ label: '배로 물러난다', value: 'away' });
    var v = await UI.ask('천연두가 번진 마을 — ' + (lv > 0 ? '배에 의원이 있다' : '배에 의학을 아는 사람이 없다'), opts, me());
    b.poxAt[c] = today();
    if (v === 'doc' || v === 'docHerb') {
      var saved = K().savedBase + lv * K().savedPerLv + (v === 'docHerb' ? K().savedHerbs : 0);
      if (v === 'docHerb') { var cg = s.fleet.cargo.herbs; cg.q -= K().herbs; if (cg.q <= 0) delete s.fleet.cargo.herbs; }
      saved = Math.min(saved, K().village - 60);
      b.pox[c] = 'doc'; b.saved = (b.saved || 0) + saved;
      var so = fame('so', 60 + lv * 40 + (v === 'docHerb' ? 40 : 0));
      await play([
        [null, (doc.who || '제독') + U.jx(doc.who || '제독', '이/가') + ' 선원들을 둘로 나눈다. 어릴 때 마마를 앓은 자국이 있는 사람만 오두막에 들어간다. 앓는 사람은 마을 끝 오두막들로 옮기고, 성한 사람은 숲 위쪽으로 떼어 놓는다. 강물에 뛰어들지 못하게 막고, 끓인 물과 카사바 죽을 떠먹인다.' + (v === 'docHerb' ? ' 약재를 달인 물로 열을 내리고, 고름 자리를 씻어 덧나지 않게 한다.' : '')],
        [null, '열흘 밤낮. 죽는 사람을 모두 막을 수는 없었다. 그래도 마을 사람 ' + K().village + '명 가운데 ' + saved + '명이 일어났다. 의원이 없었다면 대부분 살아남지 못했을 사람들이다.'],
        [chief, sd ? '…당신들 가운데에도 이런 사람이 있었군. 이걸 받으시오. 우리 조상의 세미요. 세미가 당신 배를 지켜 줄 거요. 그리고 기억하시오 — 바오루코 산의 타이노는 은혜를 잊지 않소.' : '…우리 아이들이 살았다. 바다 건너 사람에게도 착한 손이 있구나.']
      ]);
      if (sd && !b.cemi) { var got = R.addItem ? R.addItem('cemi') : false; b.cemi = 1; UI.toast(got !== false ? '기념품 「타이노의 세미」' : '소지품이 가득 차 세미는 엔리키요에게 맡겨 두었다', 'star', 4800); }
      if (c === SANTIAGO) { s.fleet.cargo.tobacco = s.fleet.cargo.tobacco || { q: 0, cost: 0 }; s.fleet.cargo.tobacco.q += 10; UI.toast('추장이 담배 10을 건넸다', 'leaf', 4200); }
      if (c === JAMAICA) { s.fleet.food += 20; UI.toast('마을 사람들이 카사바 빵을 실어 주었다 (식량 +20)', 'bread', 4200); }
      log(place + '에서 천연두를 앓는 타이노 사람들을 ' + (doc.who || '제독') + U.jx(doc.who || '제독', '이/가') + ' 돌보아 ' + saved + '명을 살렸다. (사교 명성 +' + so + ')');
      UI.toast('천연두 — 타이노 ' + saved + '명이 살아남았다', 'heart', 5600);
    } else if (v === 'food') {
      s.fleet.food -= K().foodGift; b.pox[c] = 'food'; b.saved = (b.saved || 0) + K().savedFood; var so2 = fame('so', 30);
      await play([[null, '식량과 물을 나눠 주자 굶던 아이들이 손을 내민다. 하지만 열에 들뜬 사람들 앞에서 선원들은 무엇을 해야 할지 모른다. 몇몇이 일어났을 뿐이다.'],
        ['first', '제독, 의술을 아는 사람이 있었다면 훨씬 많이 살렸을 겁니다. 의학에 밝은 사람을 데려와 다시 오시지요.']]);
      log(place + '에 천연두가 번졌다. 의원이 없어 식량과 물만 나누었다. (' + K().savedFood + '명이 살아남았다 · 사교 명성 +' + so2 + ')');
      UI.toast('의학 특기를 가진 사람을 데려오면 더 많은 사람을 살릴 수 있다 (한 달 뒤 다시)', 'heart', 5600);
    } else {
      b.pox[c] = 'away';
      await play([['first', '…배로 돌아갑시다. 이 병은 우리가 들여온 겁니다. 그 생각이 떠나지 않는군요.']]);
      log(place + '에 천연두가 번진 것을 보고 배로 물러났다.');
      if (lv === 0) UI.toast('의학 특기를 가진 사람을 데려오면 마을을 도울 수 있다 (한 달 뒤 다시)', 'heart', 5200);
    }
    refresh();
  }

  // ================================================================ 소식 (만난 사람만)
  NW.daily = function () {
    var b = st(), out = []; if (!b || !b.met) return out;
    var t = today(), told = b.told, saved = b.saved || 0;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('capit', true, 'scroll', '【산타페 협약】 카스티야의 여왕과 아라곤의 왕이 크리스토발 콜론과 약속을 맺었다. 그가 찾는 바다와 땅의 「대양 제독」이자 부왕으로 삼고, 그곳에서 나는 것의 열에 하나를 준다고 한다.');
    news('back', true, 'ship', '【콜론의 귀환】 크리스토발 콜론이 니냐호를 타고 팔로스 항으로 돌아왔다. 산타 마리아호는 히스파니올라 섬 앞바다에서 좌초해, 그 배의 나무로 「라 나비다드」 요새를 짓고 서른아홉 명을 남겨 두었다고 한다. 앵무새와 금 조각, 그리고 「인디오」 몇 사람을 데려왔다.');
    news('second', true, 'ship', '【두 번째 항해】 열일곱 척의 함대가 카디스를 떠나 서쪽으로 갔다. 천이백 명의 사람과 함께 말·소·돼지·닭, 밀과 포도와 사탕수수 모종을 실었다. 바다 건너에서는 옥수수와 담배와 카사바가 돌아온다. 두 세계가 서로의 것을 나누기 시작했다 — 짐승과 곡식, 그리고 병까지.');
    news('navidad', true, 'skull', '【라 나비다드】 콜론이 돌아가 보니 라 나비다드 요새는 잿더미였다. 남겨 둔 서른아홉 명은 금과 여자를 빼앗다가 섬 추장 카오나보의 사람들에게 모두 죽었다고 한다.');
    news('isabela', true, 'castle', '【라 이사벨라】 히스파니올라 북쪽 해안에 유럽 사람이 아메리카에 세운 첫 도시 「라 이사벨라」가 섰다. 그러나 곧 열병이 번져 정착민도 타이노 사람도 쓰러졌다. 처음 겪는 병 앞에서 타이노 마을이 비어 간다.');
    news('tribute', true, 'cannon', '【베가 레알】 말과 사냥개와 화승총을 앞세운 에스파냐 군이 베가 레알 들판에서 타이노 연합군을 짓밟았다. 이제 열네 살이 넘은 타이노는 석 달마다 매의 방울 하나 가득한 금을 바쳐야 한다. 금이 없는 땅의 사람들은 무명 스물다섯 근을.');
    news('chains', true, 'skull', '【쇠사슬의 콜론】 왕실이 보낸 감찰관 보바디야가 산토도밍고에 닿아 「대양 제독」 콜론과 그 형제들을 쇠사슬에 묶어 본국으로 보냈다. 정착민들의 원성과 반란을 다스리지 못했다는 죄다. 콜론은 배 위에서 사슬을 풀어 주겠다는 선장의 말을 거절했다고 한다.');
    news('ovando', true, 'ship', '【오반도의 함대】 새 총독 니콜라스 데 오반도가 배 서른 척과 정착민 이천오백 명을 이끌고 산토도밍고에 닿았다. 섬의 주인은 이제 분명히 카스티야다.');
    news('xaragua', true, 'skull', '【샤라과】 오반도 총독이 잔치를 핑계로 샤라과의 추장들을 한 집에 모아 불을 질렀다. 시와 춤으로 이름 높던 여추장 아나카오나는 목매달렸다.');
    news('colonDies', true, 'skull', '【콜론의 죽음】 5월 20일, 바야돌리드에서 크리스토발 콜론이 숨을 거두었다. 네 번이나 서쪽 바다를 건넜지만, 그는 끝까지 자신이 닿은 곳이 아시아의 끝자락이라고 믿었다.' + (b.egg ? ' 바르셀로나·세비야 잔치의 그 달걀 이야기는 그보다 오래 살아남을 것이다.' : ''));
    news('hatuey', true, 'skull', '【하투에이】 히스파니올라에서 쿠바로 건너가 에스파냐 사람과 싸우던 추장 하투에이가 붙잡혀 화형을 당했다. 세례를 받으면 천국에 간다는 수사의 말에 그는 물었다고 한다. 「에스파냐 사람도 천국에 가오? 그렇다면 나는 그곳에 가지 않겠소.」');
    news('lascasas', true, 'scroll', '【라스 카사스의 회심】 쿠바의 사제 바르톨로메 데 라스 카사스가 제 엔코미엔다를 내놓고, 원주민을 부리는 일은 죄라고 설교하기 시작했다.' + (b.sermon ? ' 산토도밍고 성당 뒷줄에서 손을 꼭 쥐고 있던 그 젊은 사제다.' : ''));
    news('africa', true, 'skull', '【바다를 건너는 쇠사슬】 섬의 타이노가 줄어 사탕수수밭과 금광에 일손이 모자라자, 황제 카를로스가 아프리카 사람을 곧장 아메리카로 실어 나르는 허가장을 내주었다. 대서양을 가로지르는 노예선의 길이 열린다.');
    news('pox', true, 'skull', '【천연두】 히스파니올라에 처음으로 천연두가 번졌다. 이 병을 한 번도 겪어 본 적 없는 타이노 사람들이 마을째 쓰러진다. 섬에 남은 타이노의 셋에 하나, 어쩌면 절반이 죽을 거라고 한다. 병은 곧 쿠바·자메이카·푸에르토리코로, 그리고 바다 건너 대륙으로 번질 것이다.' + (NW.doctor().lv ? ' 제독의 배에는 의술을 아는 사람이 있다.' : ''));
    news('enriquillo', true, 'castle', '【엔리키요의 산】 수도원에서 자란 타이노 추장 엔리키요가 엔코미엔다를 박차고 바오루코 산으로 들어갔다. 도망친 타이노와 아프리카 사람들이 그 곁에 모인다. 에스파냐 군이 몇 번이나 산을 올랐지만 번번이 쫓겨 내려왔다.' + (b.pox[SDOM] === 'doc' ? ' 엔리키요는 「바다 건너 사람 가운데에도 착한 손이 있었다」고 말하곤 했다 한다.' : ''));
    news('remember', saved > 0, 'heart', '【살아남은 사람들】 섬을 휩쓴 천연두가 잦아들었다. 수많은 마을이 사라졌지만, 제독의 사람들이 돌본 마을에서는 ' + saved + '명의 타이노가 살아남아 다시 카사바 밭을 일군다. 아이들은 「흰 천을 두른 바다 사람」 이야기를 노래로 부른다.');
    news('newlaws', true, 'scroll', '【새 법】 황제 카를로스가 라스 카사스의 호소를 듣고 「새 법」을 내렸다. 원주민을 노예로 삼는 것을 금하고, 엔코미엔다를 대물림하지 못하게 한다. 그러나 바다 건너 정착민들은 들고일어났고, 섬의 타이노는 이미 거의 남지 않았다.');
    return out;
  };

  // ================================================================ 도시에 들어설 때 · 수첩
  var CITIES = [SEVILLE, GRANADA, BARCELONA, SDOM, SANTIAGO, JAMAICA];
  NW.pending = function () {
    var s = S(); if (!s) return false; var c = cityNow(); if (CITIES.indexOf(c) < 0) return false;
    if (c === SDOM && st()) st().met = 1;   // 산토도밍고에 들어서면 섬의 소식을 듣는다
    return santafeOpen() || eggOpen() || encOpen() || sermonOpen() || poxOpen();
  };
  NW.check = async function () {
    if (NW._busy) return false; NW._busy = true;
    try {
      if (santafeOpen()) await santafe();
      else if (eggOpen()) await egg();
      else if (poxOpen()) await pox();
      else if (sermonOpen()) await sermon();
      else if (encOpen()) await encomienda();
    } catch (e) { console.error(e); }
    NW._busy = false;
    return true;
  };
  NW.html = function () {
    var s = S(), b = s && s.newworld; if (!b) return '';
    var t = today(), li = [];
    if (b.santafe && !b.land && t <= 14921224) li.push('1492년 9~12월, 대서양 서쪽에서 콜론의 함대(산타 마리아호)를 만나면 신호를 보낸다');
    if (b.invest && !b.paid && t >= 14930401 && t <= 15020510) li.push('콜론에게 보탠 금화 ' + U.num(b.invest) + '닢 — 1493년 봄 바르셀로나나 세비야에서');
    if (b.met && t >= 15181201 && t <= 15200831) {
      var left = POX_CITIES.filter(function (c) { return !b.pox[c] || b.pox[c] !== 'doc'; }).map(function (c) { return G.CITY_DATA[c].name; });
      if (left.length) li.push('천연두가 번진 섬들 — ' + left.join('·') + ' (1520년 8월까지 · 의학에 밝은 사람을 데려가면 더 많이 살린다)');
    }
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">서쪽 바다 너머 — 콜론과 신대륙</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._nwHtml) { G.Court._nwHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + NW.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._newworld) return;
    W._newworld = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(NW.daily()); } catch (e) { console.error(e); } return out; };
  })();
  NW._t = { santafe: santafe, cross: cross, land: land, egg: egg, encomienda: encomienda, sermon: sermon, pox: pox };
})(window.G = window.G || {});
