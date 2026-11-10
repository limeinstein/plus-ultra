/* 두 부인이 한 도시에 — 질투와 질시, 부부싸움 (G.WifeFeud) 2026-11-05 사용자 요청
   ■ 누가 「그 도시에 있다」고 보나
     · 본처: 고향(자택 — R.seat)에 있거나, 배에 함께 타고 있으면(p.wifeAboard) 배가 들어선 도시
     · 둘째 부인부터: 그 도시에 집이 있거나(w.house · w.city), 배에 함께 타고 있으면(w.aboard) 배가 들어선 도시
       (마음이 상해 문을 닫은 부인 — W.isCold — 은 나오지 않는다)
   ■ 둘 이상이 한 도시에 있으면 도시에 들어설 때 chance로 일이 터진다 (전체 gap일에 한 번 · 같은 두 사람은 pairCool일에 한 번)
     먼저 맞은 부인(A)과 나중 부인(B) — 판:
       · 선실의 비밀: 본국 항구에서 선실에 숨은 둘째 부인(R.mateHidden)을 본처가 찾아낸다
       · 부두에서 마주치다: 한 사람은 배에서 내리고, 한 사람은 그 도시에서 기다리던 참
       · 한 도시의 두 집: 같은 도시에 집이 있는 두 부인이 시장에서 마주친다
     싸움이 커진다(서로의 선물·아이·제독이 머문 날을 견준다) → 제독이 고른다
       (가) 둘 다 소중하다고 달랜다 — 웅변·매력으로 (실패하면 둘 다 더 화난다)
       (나) 선물로 마음을 산다 — 금화 giftGold (둘 다 조금 풀린다)
       (다) 먼저 맞은 부인 편을 든다 / (라) 나중 부인 편을 든다 — 편든 쪽 정 +, 다른 쪽 정 −, 집에 사는 둘째 부인이면 문을 닫는다(cold)
       (마) 슬그머니 자리를 피한다 — 둘 다 조금 서운하고, 배에서는 웃음거리(규율 −)
   ■ 아내와의 정: 본처 p.wifeLove · 둘째 부인 w.love (가족 사건 js/systems/familyevent.js 와 같은 값, 없으면 70에서)
   ■ 장면 그림 (없으면 건너뜀): images/family-events/wife_feud_cabin · wife_feud_dock · wife_feud_market · wife_feud_peace — WIFEFEUD_PROMPT.md
   ■ 저장: s.player.wifeFeud = { last, pairs: {'a|b': 날}, roll: {day, city, hit}, n } — 옛 저장에는 없다(쓸 때 만든다) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var WF = G.WifeFeud = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.wifeFeud = G.BALANCE.wifeFeud || { chance: 0.5, gap: 45, pairCool: 365, giftGold: 2000, win: 6, lose: 10, side: 12, slight: 20, flee: 8, coldK: 0.5 };
  function K() { return G.BALANCE.wifeFeud; }
  function S() { return G.Game && G.Game.state; }
  function P() { return S().player; }
  function Fm() { return G.Family; }
  function W() { return G.Wives; }
  function mem() { var p = P(); return p.wifeFeud || (p.wifeFeud = { pairs: {}, n: 0 }); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function mateRow(id) { return (S().mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  function me() { var p = P(); return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {}; }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'family-events/' + key, title: title }) : null; }
  function seat() { return R.seat ? R.seat() : P().home; }

  // ================================================================ 그 도시에 있는 부인들
  /** [{kind: 'main'|'w2', id, name, no, aboard, hidden, local, w}] — 먼저 맞은 차례로 */
  WF.present = function (cid) {
    var p = P(), out = []; if (cid == null || !W()) return out;
    if (p.wife && (p.wifeAboard || cid === seat())) out.push({ kind: 'main', id: p.wife, name: Fm().wifeName(), no: 1, aboard: !!p.wifeAboard, local: !p.wifeAboard });
    W().list().forEach(function (w) {
      if (W().isCold(w)) return;
      var m = w.kind === 'mate' ? mateRow(w.id) : null;
      if (w.aboard) out.push({ kind: 'w2', id: w.id, w: w, name: W().name(w), no: W().no(w), aboard: true, hidden: !!(m && R.mateHidden && R.mateHidden(m)) });
      else if (w.house && w.city === cid) out.push({ kind: 'w2', id: w.id, w: w, name: W().name(w), no: W().no(w), aboard: false, local: true });
    });
    return out.sort(function (a, b) { return a.no - b.no; });
  };
  function speaker(x) { return x.kind === 'main' ? Fm().wifeSpeaker() : W().speaker(x.w); }
  function pairKey(a, b) { return [a.id, b.id].sort().join('|'); }
  /** 다툴 두 사람: 배에서 내린 사람과 그 도시에서 기다리던 사람을 먼저, 아니면 같은 도시에 사는 두 사람 */
  WF.pair = function (cid) {
    var ps = WF.present(cid), m = mem(), day = S().day, K0 = K();
    function ok(a, b) { if (WF.peace && WF.peace(a, b)) return false; var d = m.pairs[pairKey(a, b)]; return d == null || day - d >= K0.pairCool; }   // WF.peace: 다투지 않는 두 사람 (본가에서 함께 사는 동화의 공주들 — js/systems/fairy_home.js)
    var best = null;
    for (var i = 0; i < ps.length; i++) for (var j = i + 1; j < ps.length; j++) {
      var a = ps[i], b = ps[j]; if (!ok(a, b)) continue;
      var score = (a.aboard !== b.aboard ? 2 : 0) + (b.hidden ? 3 : 0);
      if (!best || score > best.score) best = { a: a, b: b, score: score };
    }
    return best;
  };
  function love(x) { return x.kind === 'main' ? (P().wifeLove == null ? 70 : P().wifeLove) : (x.w.love == null ? 70 : x.w.love); }
  function addLove(x, n) {
    var v = U.clamp(love(x) + n, 0, 100);
    if (x.kind === 'main') P().wifeLove = v; else x.w.love = v;
    return v;
  }
  function kidsOf(x) { var p = P(); return x.kind === 'main' ? (p.kids || []).filter(function (k) { return k.house == null && !k.married && !k.lost && !k.away; }) : W().kidsOf(x.w); }

  // ================================================================ 도시에 들어설 때
  WF.pending = function () {
    var s = S(); if (!s || !s.player || !s.loc || s.loc.mode !== 'city' || !W() || !Fm()) return false;
    var cid = cityNow(), m = mem();
    if (m.last != null && s.day - m.last < K().gap) return false;
    if (m.roll && m.roll.day === s.day && m.roll.city === cid) return !!m.roll.hit;
    var pr = WF.pair(cid), hit = !!pr && U.chance(K().chance);
    m.roll = { day: s.day, city: cid, hit: hit };
    return hit;
  };
  WF.check = async function () {
    if (WF._busy) return false; WF._busy = true;
    try { var m = mem(); if (m.roll) m.roll.hit = false; var pr = WF.pair(cityNow()); if (pr) await WF.feud(pr.a, pr.b); } catch (e) { console.error(e); }
    WF._busy = false;
    return true;
  };

  // ================================================================ 싸움
  function opening(a, b, cname) {
    var A = a.name, B = b.name, main = a.kind === 'main';
    if (b.hidden) return { pic: 'wife_feud_cabin', title: '선실의 비밀', lines: [
      [null, cname + ' 항구. ' + A + U.jx(A, '이/가') + ' 반가운 얼굴로 배에 올라왔다. 「당신 선실 좀 치워 줄게요.」 — 말릴 틈도 없이 선실 문이 열렸다.'],
      [null, '선실 구석, 담요를 뒤집어쓰고 숨어 있던 ' + B + U.jx(B, '과/와') + ' ' + A + '의 눈이 마주쳤다. 갑판의 선원들이 일제히 하던 일을 멈췄다.'],
      ['a', '…' + (main ? '당신, 이분은 누구예요? 항구마다 숨겨 둔 사람이 있다는 소문이, 그럼 정말이었어요?' : '여기 숨어서 뭐 하는 거예요? 제독님 배에 같이 탄다는 그 사람이 당신이었군요.')],
      ['b', '숨고 싶어서 숨은 줄 알아요? 항구마다 이렇게 선실에 갇혀 지내는 게 얼마나 서러운지 알기나 해요?']
    ] };
    if (a.aboard !== b.aboard) {
      var off = a.aboard ? a : b, wait = a.aboard ? b : a, O = off.name, Wt = wait.name;
      return { pic: 'wife_feud_dock', title: '부두에서 마주치다', lines: [
        [null, cname + ' 부두. 배다리가 내려지고, 제독의 팔짱을 낀 ' + O + U.jx(O, '이/가') + ' 웃으며 내려선다. 그리고 부두 끝에서 손을 흔들던 ' + Wt + '의 손이 허공에서 멈췄다.'],
        [wait === a ? 'a' : 'b', '…당신, 편지에는 혼자 온다고 했잖아요. 옆의 그분은 누구죠?'],
        [off === a ? 'a' : 'b', '혼자라뇨? 저는 이 사람과 바다를 같이 건너왔어요. 당신이야말로 누구예요? 이 도시에서 기다린다는 사람이 당신이에요?'],
        [wait === a ? 'a' : 'b', '기다린다는 사람이라니요! 나는 이 사람이 ' + (main && wait === a ? '고향을 떠날 때마다 등불을 밝혀 둔 사람이에요.' : '올 때마다 문을 열어 준 사람이에요. 몇 달이고, 몇 해고.')]
      ] };
    }
    return { pic: 'wife_feud_market', title: '한 도시의 두 집', lines: [
      [null, cname + '의 시장. 제독이 ' + A + U.jx(A, '과/와') + ' 함께 천을 고르고 있는데, 옆 가게에서 바구니를 든 ' + B + U.jx(B, '이/가') + ' 걸어 나왔다. 한 도시에 집이 둘 — 언젠가는 일어날 일이었다.'],
      ['b', '어머, 제독님. 어제는 우리 집에 들르신다더니… 오늘은 이쪽 집이셨군요.'],
      ['a', '「이쪽 집」이라뇨? 먼저 이 도시에 집을 마련한 건 나예요. 당신이 「저쪽 집」이죠.']
    ] };
  }
  function escalate(a, b) {
    var ka = kidsOf(a).length, kb = kidsOf(b).length, lines = [];
    lines.push(['b', a.kind === 'main' ? '본처라고 다 가진 줄 알아요? 이 사람이 일 년에 고향에 며칠이나 있는지 세어 보기나 했어요?' : '먼저 왔다고 다 가진 줄 알아요? 이 사람이 요즘 어느 집에서 더 오래 머무는지 물어보시죠.']);
    lines.push(['a', '그 목걸이, 지난번에 이 사람이 내게 준 것과 똑같네요. 한꺼번에 두 개를 산 모양이죠? 하! 하나 사면 하나 더 주던가요?']);
    if (ka && kb) lines.push(['b', '우리 아이가 아버지를 더 닮았어요. 눈매가 꼭 이 사람이에요.'], ['a', '우리 아이는 벌써 아버지 배 이름을 다 외워요!']);
    else if (ka || kb) lines.push([ka ? 'a' : 'b', '나는 이 사람 아이를 낳아 키우고 있어요. 당신은 이 사람에게 뭘 주었죠?']);
    lines.push([null, '목소리가 점점 높아진다. 구경꾼이 하나둘 모이고, 누군가 손에 들고 있던 그릇이 바닥에 떨어져 깨졌다. 두 사람의 눈이 동시에 제독에게 꽂혔다.']);
    lines.push(['a', '당신이 말해 봐요. 누가 먼저예요?'], ['b', '그래요, 지금 여기서 똑똑히 말해요!']);
    return lines;
  }
  async function play(lines, a, b) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l || !l[1]) continue;
      await UI.say(l[1], l[0] === 'a' ? speaker(a) : l[0] === 'b' ? speaker(b) : l[0] === 'P' ? me() : l[0] === 'first' ? first() : {});
    }
  }
  WF.odds = function () { var sp = R.skill ? R.skill('speech') : 0, cha = R.stat ? R.stat('cha') || 50 : 50; return U.clamp(0.35 + sp * 0.15 + (cha - 50) * 0.005, 0.1, 0.9); };
  WF.feud = async function (a, b) {
    var s = S(), p = P(), m = mem(), K0 = K(), cid = cityNow(), cname = (G.CITY_DATA[cid] || {}).name || '이 도시', pc = null;
    m.last = s.day; m.pairs[pairKey(a, b)] = s.day; m.n = (m.n || 0) + 1;
    var op = opening(a, b, cname), res = '';
    try {
      pc = pic(op.pic, op.title);
      await play(op.lines, a, b);
      await play(escalate(a, b), a, b);
      if (pc) { await pc.stop(); pc = null; }
      var odds = WF.odds(), goldOk = p.gold >= K0.giftGold;
      var v = await UI.ask('두 부인 사이에서 — 어떻게 할까?', [
        { label: '둘 다 소중하다고 달랜다 (말발 ' + Math.round(odds * 100) + '%)', value: 'calm' },
        { label: '선물로 마음을 산다 — 금화 ' + U.num(K0.giftGold) + '닢으로 둘에게 하나씩', value: 'gift', dis: !goldOk },
        { label: a.name + '의 편을 든다 (먼저 맞은 ' + (a.kind === 'main' ? '본처' : '부인') + ')', value: 'sideA' },
        { label: b.name + '의 편을 든다', value: 'sideB' },
        { label: '슬그머니 자리를 피한다', value: 'flee' }], Object.assign(me(), { cancel: false }));
      if (v === 'gift' && goldOk) {
        p.gold -= K0.giftGold; addLove(a, K0.win); addLove(b, K0.win);
        await play([['P', '자, 자. 오늘 둘에게 주려고 준비한 게 있었소. 하나는 진주, 하나는 산호요.'],
          ['a', '…(진주 목걸이를 받아 들고 흘끔 옆을 본다) 그쪽이 받은 산호가 더 커 보이는데요.'],
          ['b', '(산호를 목에 대 보며) 진주가 더 비싼 거 다 알아요. …뭐, 예쁘긴 하네요.'],
          [null, '두 사람은 서로의 목걸이를 곁눈질하면서도, 일단은 입을 다물었다. 제독의 지갑만 가벼워졌다.']], a, b);
        res = '선물로 달랬다 (금화 ' + U.num(K0.giftGold) + '닢)';
      } else if (v === 'calm') {
        if (U.chance(odds)) {
          addLove(a, K0.win); addLove(b, K0.win);
          await play([['P', '둘 다 내게는 바다 위의 별 같은 사람이오. 하나는 북극성처럼 길을 알려 주고, 하나는 남십자성처럼 먼 바다에서 위로가 되지. 별끼리 다투면 뱃사람은 길을 잃소.'],
            ['a', '…말은 청산유수네요. 뱃사람 말을 다 믿으면 안 된다던데.'],
            ['b', '(피식 웃고는) 별이래요. 듣기 싫진 않네요.'],
            [null, '어색한 침묵 끝에, 두 사람이 동시에 한숨을 쉬었다. 「저 사람 고생시키는 건 우리 둘 다 똑같네요.」 — 그날 저녁 두 사람은 한 식탁에서 제독의 흉을 보며 밥을 먹었다.']], a, b);
          res = '말로 두 사람을 달랬다';
        } else {
          addLove(a, -K0.lose); addLove(b, -K0.lose);
          await play([['P', '둘 다 똑같이 소중하오. 정말이오. 둘 다 똑같이…'],
            ['a', '「똑같이」라고요?'], ['b', '「똑같이」라니요!'],
            [null, '그날 제독은 두 사람에게서 동시에 등을 돌림받았다. 갑판의 선원들은 며칠 동안 그 이야기만 했다.']], a, b);
          res = '달래려다 둘 다 더 화나게 했다';
        }
      } else if (v === 'sideA' || v === 'sideB') {
        var win = v === 'sideA' ? a : b, lose = v === 'sideA' ? b : a;
        addLove(win, K0.side); addLove(lose, -K0.slight);
        var shut = lose.kind === 'w2' && !lose.aboard;
        if (shut) lose.w.cold = s.day + Math.round(((G.BALANCE.wives || {}).coldDays || 120) * K0.coldK);
        await play([['P', win.name + U.jx(win.name, '이/가') + ' 맞소. 오늘은 그만합시다.'],
          [win === a ? 'a' : 'b', '…(턱을 치켜들고) 들었죠?'],
          [lose === a ? 'a' : 'b', shut ? '…잘 알겠어요. 우리 집 문은 한동안 열리지 않을 거예요.' : lose.kind === 'main' ? '…그래요. 당신 마음이 어디 있는지 잘 알았어요. 오늘은 혼자 있고 싶어요.' : '…알겠어요. (선실 문이 쾅 닫혔다)']], a, b);
        res = win.name + '의 편을 들었다 — ' + lose.name + U.jx(lose.name, '이/가') + ' 크게 서운해했다' + (shut ? ' (한동안 집 문을 닫는다)' : '');
      } else {
        addLove(a, -K0.flee); addLove(b, -K0.flee);
        if (s.fleet && s.fleet.discipline != null) s.fleet.discipline = Math.max(0, s.fleet.discipline - 2);
        await play([[null, '제독은 「아, 배에 급한 일이…」 하고 중얼거리며 뒷걸음질쳤다. 두 사람의 목소리가 등 뒤에서 하나로 합쳐졌다. 「거기 서요!」'],
          ['first', '(키득거리다 헛기침을 하며) 제독님, 폭풍 속에서도 키를 놓지 않으시던 분이… 오늘은 정말 빠르시더군요.']], a, b);
        res = '자리를 피했다 — 두 사람 모두 서운해했고, 선원들 사이에 웃음거리가 되었다';
      }
      var bothKids = kidsOf(a).length && kidsOf(b).length;
      if (bothKids && (v === 'calm' || v === 'gift')) await narrate('그 사이 두 집의 아이들은 어른들 싸움은 아랑곳없이 부두 끝에서 함께 게를 잡고 있었다. 「형!」, 「누나!」 — 아이들은 벌써 서로를 그렇게 불렀다.');
      G.State.log(cname + '에서 ' + a.name + U.jx(a.name, '과/와') + ' ' + b.name + U.jx(b.name, '이/가') + ' 마주쳐 부부싸움이 벌어졌다. ' + res + '. (정: ' + a.name + ' ' + love(a) + ' · ' + b.name + ' ' + love(b) + ')');
      UI.toast('두 부인의 다툼 — ' + res, 'heart', 5600);
      if (G.Game.refreshHud) G.Game.refreshHud();
      return v;
    } finally { if (pc) await pc.stop(); }
  };
})(window.G = window.G || {});
