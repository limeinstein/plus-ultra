/* 발견물 앞에서 배에 함께 탄 가족의 한마디 (G.FamVoice — 2026-10-28)
   · 발견하는 순간(js/scenes/common.js SC.discoveryReveal), 부하들의 관찰 뒤에 배에 함께 탄 아내·자식이 저마다 5% 확률로 한마디 한다
     (G.BALANCE.famVoice.chance). 아내: 본처(p.wifeAboard) · 배에 함께 탄 둘째 부인(G.Wives.aboard()) · 자식: 견습으로 탄 아이(G.Family.aboard())
   · 대사는 발견물마다 따로 썼다 — G.DISC_FAM[id] = [아내, 어린아이, 청소년, 어른 자식] (js/data/discfam_1~8.js)
       아내: 그 발견물 앞에서의 데이트·연애·사랑 (해요체, 「당신」) — 성품(G.Voice.wifeKey)에 따라 덧말을 가끔 붙인다
       자식: 13살까지 동심에 빗댄 말 · 14~19살 그 나이다운 말 · 20살부터 어른스러운 말(하십시오체). 5살 아래면 어린아이 말을 「아빠」 반말로
   · 노예 무역 같은 무거운 발견물(grim)에는 덧말을 붙이지 않는다 */
(function (G) {
  'use strict';
  var U = G.U || G.Util;
  var FV = G.FamVoice = {};
  function S() { return G.Game && G.Game.state; }
  function cfg() { var b = (G.BALANCE && G.BALANCE.famVoice) || {}; return { chance: b.chance == null ? 0.05 : b.chance, young: b.young || 14, adult: b.adult || 20, tod: b.tod || 6, flavor: b.flavor == null ? 0.4 : b.flavor }; }
  FV.cfg = cfg;
  var GRIM = { t_slaves: 1, goree: 1 };   // 노예 무역의 자취 — 덧말 없이

  // 아내의 성품(G.Voice.wifeKey)마다 가끔 붙는 덧말 — 어느 발견물에나 어울리게, 사랑 이야기의 결로
  var WIFE_POST = {
    brave: ['당신 옆이면 어디든 무섭지 않아요.', '다음 발견 때는 나도 맨 앞에 설래요.', '이런 데까지 같이 와 주는 남자는 당신뿐이에요.'],
    bold: ['이 정도는 돼야 내 남편이 찾은 거죠.', '오늘은 내가 당신을 자랑하고 다닐 거예요.', '두고 봐요, 이 이야기는 내가 동네방네 할 거예요.'],
    kind: ['여기까지 데려와 줘서 고마워요.', '오늘을 오래오래 기억할게요.', '당신이 웃는 얼굴을 봐서 더 좋아요.'],
    steady: ['오늘 일은 일기에 꼭 적어 둘게요.', '집에 돌아가면 이 이야기를 천천히 다시 해 줘요.', '이런 날이 우리한테 또 와서 다행이에요.'],
    delicate: ['…가슴이 아직도 두근거려요.', '꿈이 아닌지 당신 손을 잡아 봐도 돼요?', '눈물이 날 것 같아요. 놀라서 그런 거예요.'],
    generous: ['아이들한테도 꼭 보여 주고 싶어요.', '돌아가면 이웃들한테 한턱 내요, 우리.', '당신 덕분에 세상이 이렇게 넓다는 걸 알았어요.'],
    strong: ['…뭐, 나쁘지 않네요. 당신이랑 봐서 그런가 봐요.', '고생한 보람은 있네요. 그건 인정할게요.', '다음엔 덜 위험한 데로 데려가요. 그래도 좋았어요.'],
    willful: ['착각하지 마요, 당신이 좋아서 하는 말은 아니에요.', '…흥, 오늘만 특별히 칭찬해 줄게요.', '다른 여자한테는 이런 데 보여 주지 마요.'],
    witch: ['이곳 기운이 우리 둘을 오래 묶어 줄 거예요.', '달이 뜨면 여기서 당신 이름으로 작은 주문을 걸어 둘게요.', '별자리가 말하던 날이 오늘이었나 봐요.']
  };
  // 그 발견물의 대사가 없을 때(새로 들어온 발견물 등)의 짧은 말
  var FALLBACK = [
    ['당신이랑 이걸 함께 보다니, 오늘을 우리 둘만의 날로 해요.', '이 앞에서 당신 손을 잡고 있으니까 신혼 때 같아요.'],
    ['아버지, 이거 동화책에 나오는 거 같아요! 진짜 있었네요!', '아버지, 이거 집에 가져가면 안 돼요? 제 보물 상자에 넣고 싶어요!'],
    ['아버지, 친구들한테 말해도 아무도 안 믿을 거예요. 제가 그림으로 남겨 둘게요.', '처음 보는 거예요. 아버지는 어떻게 이런 데를 찾으셨어요?'],
    ['아버지와 함께 이것을 본 날을 오래 기억하겠습니다.', '이런 것을 찾아내는 일이 우리 집안의 일이라는 것이 자랑스럽습니다.']
  ];

  function kidAge(k) { return G.Family && G.Family.kidAge ? G.Family.kidAge(k) : 14; }
  /** 어린아이 말을 아기 말씨로: 해요체 → 반말, 「아버지」 → 「아빠」 */
  function tod(t) {
    var b = G.DiscVoice && G.DiscVoice.conv ? G.DiscVoice.conv([t, t], 'ban') : t;
    return b.replace(/아버지/g, '아빠')
      .replace(/(^|[\s,「])저(는|도|를|랑|한테|만)(?=[\s,.!?])/g, '$1나$2').replace(/(^|[\s,「])제가(?=[\s,.!?])/g, '$1내가').replace(/(^|[\s,「])제(?=\s)/g, '$1내');   // 「제가·저는·제 것」 → 「내가·나는·내 것」
  }
  FV.tod = tod;
  /** 그 사람의 몫: 0 아내 · 1 어린아이 · 2 청소년 · 3 어른 자식 */
  FV.slot = function (who) {
    if (who.kind === 'wife') return 0;
    var a = who.age, K = cfg();
    return a < K.young ? 1 : a < K.adult ? 2 : 3;
  };
  /** 배에 함께 탄 가족: [{kind: 'wife'|'kid', id, k, age, key, speaker}] */
  FV.members = function () {
    var s = S(); if (!s || !s.player) return [];
    var p = s.player, out = [], V = G.Voice;
    if (p.wife && p.wifeAboard && G.Family) out.push({ kind: 'wife', id: p.wife, main: true, key: V && V.wifeKey ? V.wifeKey(p.wife) : 'kind', speaker: function () { return G.Family.wifeSpeaker(); } });
    if (G.Wives && G.Wives.aboard) G.Wives.aboard().forEach(function (w) {
      if (out.some(function (x) { return x.id === w.id; })) return;
      out.push({ kind: 'wife', id: w.id, key: V && V.wifeKey ? V.wifeKey(w.id) : 'kind', speaker: function () { return G.Wives.speaker(w); } });
    });
    if (G.Family && G.Family.aboard) G.Family.aboard().filter(function (k) { return !k.unnamed; }).forEach(function (k) {
      out.push({ kind: 'kid', id: 'kid:' + k.name, k: k, age: kidAge(k), speaker: function () { return G.HomeLife && G.HomeLife.speaker ? G.HomeLife.speaker(k) : { name: k.name, portrait: G.Family.kidSpec(k), lang: 3 }; } });
    });
    return out;
  };
  /** 그 사람이 그 발견물 앞에서 하는 말 */
  FV.line = function (d, who) {
    var slot = FV.slot(who), L = (G.DISC_FAM || {})[d.id], t = L && L[slot];
    if (!t) t = U.pick(FALLBACK[slot]);
    if (slot === 1 && who.kind === 'kid' && who.age < cfg().tod) t = tod(t);
    if (slot === 0 && !GRIM[d.id] && who.key && WIFE_POST[who.key] && U.chance(cfg().flavor)) t = t + ' ' + U.pick(WIFE_POST[who.key]);
    return t;
  };
  /** 발견하는 순간: 배에 함께 탄 가족이 저마다 확률(5%)로 한마디 — [{text, speaker, who}]. opt.force: 확률 없이 모두 (시험) */
  FV.reveal = function (d, opt) {
    opt = opt || {};
    if (!d || d.id === 'circum') return [];
    var p = cfg().chance;
    return FV.members().filter(function () { return opt.force || U.chance(p); }).map(function (who) {
      return { text: FV.line(d, who), speaker: who.speaker(), who: who };
    });
  };
})(window.G = window.G || {});
