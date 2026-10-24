/* 발견물마다의 부하 대사 (G.DiscVoice) — 2026-10-24 사용자 요청
   「모든 발견물 개별에 따른 다른 내용의 대사를 만들고, 특기와 말투에 따라 다르게. 보고 거들기에도 그 발견물에 맞는 특기·말투의 대사를」
   · 내용: 발견물마다 특기별 관찰 3~4개 (G.DISC_FACTS[발견 id] = [[특기, 하십시오체, 해요체], …] — js/data/discfacts_1~8.js)
   · 누가: 그 특기가 가장 높은 부하 (특기가 없으면 그 관찰은 나오지 않는다)
   · 어떻게: 그 부하의 말씨(js/systems/voice.js — 하오·하게·해요·하십시오·반말)로 바꾸고, 성격(말투 갈래)에 맞는 첫마디·덧말,
     특기 단계(1단계는 조심스레, 3단계는 자신 있게)를 입힌다
   · 쓰는 곳: 발견하는 순간(js/scenes/common.js discoveryReveal) · 보고·발표 자리에서 거들 때(js/systems/pitch.js)
   말씨 바꾸기: 하십시오체 → 하오체·하게체 (…습니다 → …소 / …네, …ㅂ니다 → …오 / …네, …입니다 → …이오·요 / …이네·네),
              해요체 → 반말 (…요 → 뺌, …이에요 → …이야, …예요 → …야) — 그래서 관찰은 두 말씨로 적어 둔다 */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var DV = {};
  G.DiscVoice = DV;
  function S() { return G.Game.state; }

  // ---------------------------------------------------------------- 말씨 바꾸기
  function jong(ch) { var c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? c % 28 : -1; }
  function dropB(ch) { return String.fromCharCode(ch.charCodeAt(0) - 17); }   // 받침 ㅂ(17)을 뗀다: 합 → 하
  function split(t) { return String(t).split(/(?<=[.!?])\s+/); }
  function eachEnd(t, fn) { return split(t).map(function (x) { return fn(x); }).join(' '); }
  /** 하십시오체 한 문장 → 하오체(hao) · 하게체(hage) */
  function fromSp(x, reg) {
    var m;
    if ((m = x.match(/^(.*?)(.)입니(다|까)([.!?]?)$/))) {
      // 「바다입니다」(이다)와 「보입니다」(보이다)를 가를 수 없으니 늘 「이오·이네」 — 둘 다 맞는 말이 된다
      if (m[3] === '까') return m[1] + m[2] + (reg === 'hao' ? '이오?' : '인가?');
      return m[1] + m[2] + (reg === 'hao' ? '이오' : '이네') + m[4];
    }
    if ((m = x.match(/^(.*?)습니(다|까)([.!?]?)$/))) return m[1] + (m[2] === '까' ? (reg === 'hao' ? '소?' : '나?') : (reg === 'hao' ? '소' : '네') + m[3]);
    if ((m = x.match(/^(.*?)(.)니(다|까)([.!?]?)$/)) && jong(m[2]) === 17) {
      var st = m[1] + dropB(m[2]), cop = dropB(m[2]) === '거';   // …ㄹ 겁니다(것입니다) → …ㄹ 거요 / 거네
      if (cop && m[3] === '까' && reg !== 'hao') return st.slice(0, -1) + '건가?';
      return st + (m[3] === '까' ? (reg === 'hao' ? (cop ? '요?' : '오?') : '나?') : (reg === 'hao' ? (cop ? '요' : '오') : '네') + m[4]);
    }
    return x;
  }
  /** 해요체 한 문장 → 반말 */
  function toBan(x) {
    var m;
    if ((m = x.match(/^(.*?)이에요([.!?]?)$/))) return m[1] + '이야' + m[2];
    if ((m = x.match(/^(.*?)(예요|에요)([.!?]?)$/))) return m[1] + '야' + m[3];
    if ((m = x.match(/^(.*?)죠([.!?]?)$/))) return m[1] + '지' + m[2];
    if ((m = x.match(/^(.*?)요([.!?]?)$/))) return m[1] + m[2];
    return x;
  }
  /** [하십시오체, 해요체] 한 쌍을 그 말씨로 */
  DV.conv = function (pair, reg) {
    var sp = pair[0], yo = pair[1] || pair[0];
    if (reg === 'sp') return sp;
    if (reg === 'yo') return yo;
    if (reg === 'ban') return eachEnd(yo, toBan);
    if (reg === 'hao' || reg === 'hage') return eachEnd(sp, function (x) { return fromSp(x, reg); });
    return reg === 'yo' ? yo : sp;
  };
  DV._fromSp = fromSp; DV._toBan = toBan;

  // ---------------------------------------------------------------- 말투 갈래의 첫마디·덧말
  /* pre: 말씨와 상관없는 첫마디 (감탄·버릇) · post: [하십시오체, 해요체] 덧말 — 말씨대로 바뀐다
     pitchPre: 후원자 앞에서 거들 때의 첫마디 */
  var FLAVOR = {
    rush: { pre: ['하하!', '이거 봐라!', '좋아,', '오오,', '두말할 것 없이,'], post: [['당장 더 가까이 가 보고 싶습니다!', '당장 더 가까이 가 보고 싶어요!'], ['이런 건 직접 부딪쳐 봐야 압니다!', '이런 건 직접 부딪쳐 봐야 알아요!'], ['선원들한테 자랑할 거리가 생겼습니다!', '선원들한테 자랑할 거리가 생겼어요!']], pitchPre: ['제가 두 눈으로 똑똑히 봤습니다만,', '하하, 직접 보셨어야 했는데,'] },
    noble: { pre: ['흠, 과연.', '아름답군.', '예사롭지 않은 것이로군.', '이건 꽤 품위가 있군.'], post: [['궁정에서 이야기하면 모두 귀를 기울일 겁니다.', '궁정에서 이야기하면 모두 귀를 기울일 거예요.'], ['이런 것을 알아보는 눈이 있다는 게 다행입니다.', '이런 것을 알아보는 눈이 있다는 게 다행이에요.']], pitchPre: ['감히 말씀드리자면,', '품격 있는 분께 걸맞은 이야기입니다만,'] },
    merch: { pre: ['오호,', '이거 장사가 되겠는데,', '셈을 해 보니,', '눈여겨볼 건,'], post: [['값으로 치면 꽤 나가겠습니다.', '값으로 치면 꽤 나가겠어요.'], ['잘만 팔면 배 한 척 값은 나옵니다.', '잘만 팔면 배 한 척 값은 나와요.'], ['소문이 나기 전에 먼저 손을 써야 합니다.', '소문이 나기 전에 먼저 손을 써야 해요.']], pitchPre: ['장사꾼의 눈으로 말씀드리면,', '숫자로 말씀드리자면,'] },
    hidden: { pre: ['…', '음.', '예전에 비슷한 것을 본 적이 있는데,', '가만히 보니,'], post: [['뭐, 대단한 이야기는 아닙니다.', '뭐, 대단한 이야기는 아니에요.'], ['옛 버릇이라 눈에 들어올 뿐입니다.', '옛 버릇이라 눈에 들어올 뿐이에요.']], pitchPre: ['한마디만 보태자면,', '조용히 덧붙이자면,'] },
    genius: { pre: ['흥미롭군.', '재어 보니,', '하나 짚어 두자면,', '이치로 따지면,'], post: [['기록해 두면 학계가 한동안 시끄러울 겁니다.', '기록해 두면 학계가 한동안 시끄러울 거예요.'], ['수치는 따로 정리해 두겠습니다.', '수치는 따로 정리해 둘게요.'], ['이건 가설이 아니라 관찰입니다.', '이건 가설이 아니라 관찰이에요.']], pitchPre: ['관찰한 바를 정리해 말씀드리면,', '근거를 들어 말씀드리자면,'] },
    shonen: { pre: ['우와!', '대박!', '봤어요?', '이거 진짜 굉장해!'], post: [['언젠가 저도 이런 걸 처음 찾아낼 겁니다!', '언젠가 저도 이런 걸 처음 찾아낼 거예요!'], ['가슴이 막 뜁니다!', '가슴이 막 뛰어요!'], ['오늘 밤 일지에 크게 적어 둬야겠습니다!', '오늘 밤 일지에 크게 적어 둬야겠어요!']], pitchPre: ['저, 저기요! 진짜예요,', '제가 직접 봤는데요,'] },
    charm: { pre: ['후훗,', '어머,', '이것 좀 봐요,', '가까이서 보니,'], post: [['이런 걸 보여 주시다니, 제독도 참 짓궂습니다.', '이런 걸 보여 주시다니, 제독도 참 짓궂어요.'], ['오늘 일은 둘만의 비밀로 해 두고 싶습니다.', '오늘 일은 둘만의 비밀로 해 두고 싶어요.']], pitchPre: ['후훗, 들어 보시겠어요?', '어머, 이건 꼭 들으셔야 해요.'] },
    cute: { pre: ['와아,', '히힛,', '어, 어, 저기!', '우와앙,'], post: [['너무 신기합니다!', '너무 신기해요!'], ['나중에 또 보러 오고 싶습니다!', '나중에 또 보러 오고 싶어요!'], ['그림으로 그려서 간직하고 싶습니다!', '그림으로 그려서 간직하고 싶어요!']], pitchPre: ['저기요, 저기요!', '진짜 신기했는데요,'] },
    tsun: { pre: ['흥,', '딱히 감동한 건 아니지만,', '뭐, 나쁘지 않네.', '착각하지 마.'], post: [['…그래도 조금은 와 볼 만했습니다.', '…그래도 조금은 와 볼 만했어요.'], ['제독 때문에 신경 쓴 거 아닙니다.', '제독 때문에 신경 쓴 거 아니에요.']], pitchPre: ['흥, 제대로 들으세요.', '딱히 거들려는 건 아니지만,'] },
    grumpy: { pre: ['하아…', '여기까지 오느라 발이 다 부르텄는데,', '투덜대는 건 아니지만,', '뭐, 어쨌든,'], post: [['이것 하나 보자고 고생한 걸 생각하면 본전입니다.', '이것 하나 보자고 고생한 걸 생각하면 본전이에요.'], ['이제 좀 쉬어도 됩니까?', '이제 좀 쉬어도 돼요?']], pitchPre: ['고생한 보람이 있었으니 말씀드리면,', '하아, 그러니까요,'] },
    plain: { pre: ['와,', '보세요,', '그런데요,', '이것 봐요,'], post: [['돌아가서 다들 놀라겠습니다.', '돌아가서 다들 놀라겠어요.'], ['잘 적어 두겠습니다.', '잘 적어 둘게요.']], pitchPre: ['제가 본 대로 말씀드리면,', '보태 말씀드리면,'] },
    polite: { pre: ['실례지만,', '말씀드려도 될까요.', '삼가 아뢰자면,', '조심스레 살펴보니,'], post: [['빠짐없이 기록해 두겠습니다.', '빠짐없이 기록해 두겠어요.'], ['이런 것을 보게 되어 영광입니다.', '이런 것을 보게 되어 영광이에요.']], pitchPre: ['외람되오나,', '삼가 덧붙이자면,'] },
    old_m: { pre: ['허허,', '내 평생 바다를 다녔지만,', '늙은이 눈에도,', '거참,'], post: [['살다 보니 이런 것도 보는구먼, 하는 생각이 듭니다.', '살다 보니 이런 것도 보는구나 싶어요.'], ['젊은 녀석들한테 들려줄 이야기가 하나 늘었습니다.', '젊은 녀석들한테 들려줄 이야기가 하나 늘었어요.']], pitchPre: ['늙은이의 말이지만,', '허허, 제 평생에 걸고 말씀드리자면,'] },
    old_f: { pre: ['아이고,', '세상에,', '오래 살고 볼 일이네,', '얘들아, 이것 좀 보렴.'], post: [['우리 손주들한테 꼭 들려줘야겠습니다.', '우리 손주들한테 꼭 들려줘야겠어요.'], ['몸조심들 하고 천천히 봅시다.', '몸조심들 하고 천천히 봐요.']], pitchPre: ['아이고, 그게 말이에요,', '나이 든 사람 말 좀 들어 보세요,'] },
    child_m: { pre: ['우와!', '저기, 저기!', '진짜다!', '헤헤,'], post: [['어른들한테 자랑할 겁니다!', '어른들한테 자랑할 거예요!'], ['다음엔 제가 먼저 찾을 겁니다!', '다음엔 제가 먼저 찾을 거예요!']], pitchPre: ['저, 저도 봤는데요!', '진짜예요!'] },
    child_f: { pre: ['와아,', '어머나,', '저것 봐요!', '히잉, 신기해,'], post: [['꿈에 나올 것 같습니다.', '꿈에 나올 것 같아요.'], ['나중에 일기에 쓸 겁니다.', '나중에 일기에 쓸 거예요.']], pitchPre: ['저도 같이 봤어요!', '저기요, 있잖아요,'] },
    witch: { pre: ['후후,', '바람이 수군거리는군.', '연기가 그렇게 말하네.', '조짐이 보여,'], post: [['이런 곳엔 오래된 힘이 고여 있습니다.', '이런 곳엔 오래된 힘이 고여 있어요.'], ['함부로 손대면 탈이 납니다.', '함부로 손대면 탈이 나요.']], pitchPre: ['수정 구슬에 비친 대로 말씀드리면,', '후후, 숨은 이야기를 하나 보태자면,'] }
  };
  DV.FLAVOR = FLAVOR;
  // 특기 단계: 1단계는 조심스레(말씨와 상관없는 첫마디), 3단계는 자신 있게(덧말)
  var LV1 = ['잘은 모르지만,', '어설픈 눈으로 봐도,', '얕은 솜씨로 보기에도,', '짐작이 맞다면,'];
  var LV3 = [['이 방면이라면 틀릴 리 없습니다.', '이 방면이라면 틀릴 리 없어요.'], ['오래 다뤄 본 사람이라면 다 알아봅니다.', '오래 다뤄 본 사람이라면 다 알아봐요.']];
  // 보고 자리에서 쪽(학문·아름다움·돈·신앙·영광·부풀리기)마다 맺는 말
  var CLOSE = {
    scholar: [['이 한 가지만으로도 학자들의 책이 고쳐 쓰일 겁니다.', '이 한 가지만으로도 학자들의 책이 고쳐 쓰일 거예요.'], ['다음 탐험의 길잡이가 될 기록입니다.', '다음 탐험의 길잡이가 될 기록이에요.']],
    beauty: [['그 자리에 섰던 사람은 평생 잊지 못할 겁니다.', '그 자리에 섰던 사람은 평생 잊지 못할 거예요.'], ['그림으로 옮기면 어느 궁정 벽에 걸어도 빛날 겁니다.', '그림으로 옮기면 어느 궁정 벽에 걸어도 빛날 거예요.']],
    profit: [['먼저 손을 쓰는 쪽이 큰돈을 쥘 겁니다.', '먼저 손을 쓰는 쪽이 큰돈을 쥘 거예요.'], ['이것으로 이문을 남길 길이 여럿 보입니다.', '이것으로 이문을 남길 길이 여럿 보여요.']],
    faith: [['하느님의 섭리가 땅끝까지 미친다는 증거입니다.', '하느님의 섭리가 땅끝까지 미친다는 증거예요.'], ['그곳 사람들의 믿음도 우리처럼 깊었습니다.', '그곳 사람들의 믿음도 우리처럼 깊었어요.']],
    glory: [['이 길을 처음 연 이름은 오래도록 기억될 겁니다.', '이 길을 처음 연 이름은 오래도록 기억될 거예요.'], ['거기까지 배를 몰고 간 것만으로도 자랑입니다.', '거기까지 배를 몰고 간 것만으로도 자랑이에요.']],
    legend: [['게다가 그곳 사람들은 밤마다 그것이 노래를 한다고 믿습니다!', '게다가 그곳 사람들은 밤마다 그것이 노래를 한다고 믿어요!'], ['소문으로는 그걸 본 사람은 십 년을 더 산다고 합니다!', '소문으로는 그걸 본 사람은 십 년을 더 산대요!'], ['제가 본 것은 그 반도 안 됩니다. 나머지는 말로 다 못 합니다!', '제가 본 것은 그 반도 안 돼요. 나머지는 말로 다 못 해요!']]
  };
  DV.CLOSE = CLOSE;

  // ---------------------------------------------------------------- 누가 무엇을
  /** 그 발견물의 관찰 — 지금 해보다 뒤의 해(네 자리 숫자)가 적힌 관찰은 아직 말할 수 없으므로 뺀다 */
  DV.facts = function (d) {
    var F = (G.DISC_FACTS && d && G.DISC_FACTS[d.id]) || null, s = S(); if (!F) return null;
    var y = s && s.date ? s.date.y : 9999;
    var ok = F.filter(function (f) { return !((f[1] + ' ' + f[2]).match(/\d{4}/g) || []).some(function (x) { return +x > y && +x < 2100; }); });
    return ok.length ? ok : null;
  };
  DV.has = function (d) { return !!DV.facts(d); };
  /** 데리고 다니는 부하 가운데 그 특기가 가장 높은 사람 (숨은 부하 빼고) */
  function bestMate(sk, skip) {
    var s = S(), best = null;
    (s.mates || []).forEach(function (m) {
      var md = G.MATE[m.id]; if (!md || (skip && skip[m.id])) return;
      if (R.mateHidden && R.mateHidden(m)) return;
      var lv = R.mateSkill(m, sk) || 0;
      if (lv > 0 && (!best || lv > best.lv)) best = { m: m, d: md, lv: lv };
    });
    return best;
  }
  /** 말투 입히기: 관찰 한 쌍 → 그 부하의 말 */
  DV.render = function (md, pair, lv, opt) {
    opt = opt || {};
    var V = G.Voice, reg = V ? V.reg(md) : (md.g === 'f' ? 'yo' : 'hao'), type = V ? V.typeOf(md) : 'plain';
    if (opt.pitch && reg === 'ban') reg = 'yo';          // 후원자 앞에서는 반말을 삼간다
    var F = FLAVOR[type] || FLAVOR.plain, key = 'dv:' + md.id;
    var body = DV.conv(pair, reg), pre = '', post = '';
    if (opt.pitch) pre = F.pitchPre && U.chance(0.6) ? U.pickFresh(key + ':pp', F.pitchPre) : '';
    else if (lv <= 1 && U.chance(0.7)) pre = U.pickFresh(key + ':l1', LV1);
    else if (U.chance(0.55)) pre = U.pickFresh(key + ':pre', F.pre);
    if (opt.close) post = DV.conv(U.pickFresh('dv:close:' + opt.angle, opt.close), reg);
    else if (lv >= 3 && U.chance(0.35)) post = DV.conv(U.pickFresh(key + ':l3', LV3), reg);
    else if (U.chance(0.4)) post = DV.conv(U.pickFresh(key + ':post', F.post), reg);
    var t = (pre ? pre + ' ' : '') + body + (post ? ' ' + post : '');
    if (opt.d) t = t.replace(/\{d\}/g, '「' + opt.d + '」');
    return t;
  };
  /** 발견하는 순간: 특기가 맞는 부하들이 그 발견물의 관찰을 말한다 — [{m, d(부하 자료), sk, lv, text}] (서로 다른 사람, 최대 n) */
  DV.reveal = function (d, n) {
    var F = DV.facts(d); if (!F) return [];
    var used = {}, out = [];
    U.shuffle(F.slice()).forEach(function (f) {
      if (out.length >= (n || 2)) return;
      var b = bestMate(f[0], used); if (!b) return;
      used[b.m.id] = 1;
      out.push({ m: b.m, d: b.d, sk: f[0], lv: b.lv, text: DV.render(b.d, [f[1], f[2]], b.lv, { d: d.name }) });
    });
    // 발견 순서는 관찰 표의 순서대로 (역사 → 측량 … 처럼 이야기가 이어지게)
    out.sort(function (a, b) { return F.map(function (x) { return x[0]; }).indexOf(a.sk) - F.map(function (x) { return x[0]; }).indexOf(b.sk); });
    return out;
  };
  /** 보고 자리에서 거드는 부하 c(pitch.js candidates)의 말: 그 쪽의 특기에 맞는 관찰 + 쪽에 맞는 맺음말. 맞는 관찰이 없으면 null */
  DV.pitch = function (d, c, angleSk) {
    var F = DV.facts(d), md = G.MATE[c.id]; if (!F || !md) return null;
    var cand = F.filter(function (f) { return c.angle === 'legend' || (angleSk || []).indexOf(f[0]) >= 0 && (R.mateSkill(c.m, f[0]) || 0) > 0; });
    if (!cand.length && c.angle !== 'legend') return null;
    var f = U.pickFresh('dv:pf:' + d.id, cand.length ? cand : F);
    return DV.render(md, [f[1], f[2]], c.lv, { pitch: true, close: CLOSE[c.angle] || null, angle: c.angle, d: d.name });
  };
})(window.G = window.G || {});
