/* 발견하는 순간의 말 — 같은 말이 되풀이되지 않게, 발견 갈래와 그때의 사정(계약한 것인가, 경쟁자가 가까운가, 모두 지쳤는가, 전설인가)에 따라 고른다.
   js/scenes/common.js 의 발견 연출(discoveryReveal)이 쓴다. {d} 발견 이름 · {sponsor} 계약한 후원자 · {rival} 경쟁자
   고르는 법: G.RevealTalk.shout(d) · reply(d) · noSkill(d) — U.pickFresh 로 바로 앞에 나온 말은 피한다. */
(function (G) {
  'use strict';
  var T = {};
  G.RevealTalk = T;

  // 부관(또는 앞장선 부하)이 외치는 말
  T.SHOUT = {
    geo: ['제독, 해도에 없는 물길입니다! 이 바다는 아직 누구의 지도에도 없습니다.', '측심줄이 바닥에 닿질 않습니다, 제독. 우리가 처음 지나는 바다가 틀림없습니다.',
      '저기 보십시오, 바다가 저쪽으로 열려 있습니다! 이게 바로 {d}입니다.', '나침반을 몇 번이나 다시 봤습니다. 틀림없습니다, 제독. 여기가 {d}입니다.',
      '망대에서 소리칩니다! 물빛이 바뀌었답니다, 제독. {d}에 들어섰습니다.'],
    ruin: ['제독, 풀숲 사이로 돌벽이 보입니다. 사람이 쌓은 것입니다!', '이렇게 큰 돌을 누가 어떻게 옮겼을까요. {d}, 이야기 그대로입니다.',
      '발밑을 조심하십시오, 제독. 이 계단은 몇백 년 동안 아무도 밟지 않은 것 같습니다.', '길잡이가 더는 못 가겠다며 손을 내젓습니다. 저 너머가 {d}{^d|이랍니다/랍니다}.',
      '벽에 새긴 그림이 아직 또렷합니다. 제독, 여기가 {d}입니다.'],
    treasure: ['제독, 뚜껑이 열렸습니다! 이 빛 좀 보십시오.', '손이 떨려서 들 수가 없습니다. 이게 정말 {d}입니까?',
      '모두 손대지 마라! 제독께서 먼저 보셔야 한다.', '먼지를 털어 내니 금빛이 올라옵니다. {d}, 틀림없습니다.'],
    creature: ['쉿, 제독. 소리를 내면 달아납니다. 저기, 바위 그늘에 있습니다.', '선원들이 겁을 먹었습니다. 저런 짐승은 처음 봅니다.',
      '{d}입니다, 제독! 책에서 본 그림하고는 사뭇 다릅니다.', '저 녀석이 우리를 빤히 보고 있습니다. 더 다가가지 마십시오.'],
    people: ['제독, 마을 사람들이 나왔습니다. 손에 든 건 무기가 아니라 선물 같습니다.', '처음 듣는 말입니다만, 웃는 얼굴은 어디나 같군요.',
      '아이들이 배를 보고 뛰어옵니다. 이 사람들이 {d}입니다.', '어른으로 보이는 노인이 앞으로 나섭니다. 예를 갖추시지요, 제독.'],
    nature: ['제독, 저 너머를 보십시오. 말이 나오지 않습니다.', '이런 경치를 두고 돌아가면 아무도 우리 말을 믿지 않을 겁니다.',
      '땅이 울리는 것 같습니다. {d}, 소문보다 훨씬 큽니다.', '선원들이 모두 일손을 놓고 넋을 잃었습니다.'],
    trade: ['제독, 이 냄새 맡아 보십시오! 이게 {d}입니다.', '이 고장 사람들은 이걸 흔한 것처럼 씁니다. 유럽에 가져가면 금값일 텐데요.',
      '한 자루만 실어 가도 배값이 나오겠습니다, 제독.', '맛을 보니 혀가 얼얼합니다. 장사꾼들 눈이 뒤집히겠군요.'],
    any: ['제독, 보십시오! 저것이 바로 소문으로만 듣던 {d}입니다!', '우리가 찾아냈습니다, 제독. {d}입니다!'],
    legend: ['이야기 속에서나 듣던 {d}{^d|이/가} 정말 눈앞에 있습니다!', '할머니가 들려주시던 옛이야기가 참말이었군요, 제독.', '다들 꿈인 줄 압니다. 서로 꼬집어 보고 있습니다, 제독.'],
    contract: ['제독, 이것입니다! {sponsor}께서 찾으시던 바로 그것입니다.', '이걸 가지고 돌아가면 {sponsor}께서 뭐라 하실지 벌써 궁금합니다.'],
    rival: ['{rival}보다 우리가 먼저입니다, 제독!', '{rival}의 배는 보이지 않습니다. 우리가 먼저 닿았습니다!']
  };
  // 제독의 대답
  T.REPLY = {
    any: ['마침내 찾았구나. 먼 길을 함께 와 준 덕분이다.', '이 눈으로 직접 보게 될 줄이야… 모두 수고했다.', '세상에 이런 것이 있었다니. 빠짐없이 기록해 두자.',
      '잘했다. 오늘 밤엔 다들 한 잔씩 더 받아라.', '서두르지 마라. 천천히, 하나도 놓치지 말고 보자.'],
    legend: ['전설이 거짓이 아니었군… 모두 잘해 주었다.', '꿈을 꾸는 것만 같구나. 이 광경을 잊지 말자.', '옛사람들 말을 비웃던 자들에게 보여 주고 싶구나.'],
    tired: ['다들 지쳤을 텐데 끝까지 버텨 주었구나. 이 광경이 그 값이다.', '굶주리고 지친 날들이 오늘 하루로 다 갚아지는구나.'],
    contract: ['후원자께 가져갈 선물이 생겼구나. 꼼꼼히 기록해라.', '약속을 지킬 수 있겠구나. 하나도 빠뜨리지 말고 적어라.'],
    rival: ['한발 늦었으면 남의 이름으로 남을 뻔했구나.', '이번만큼은 우리가 빨랐구나. 서둘러 돌아가 알리자.'],
    creature: ['겁주지 마라. 우리가 손님이다.', '조용히, 멀리서 보자. 저 녀석들 땅이다.'],
    people: ['무기를 내려라. 우리는 장사하러 온 것이지 싸우러 온 게 아니다.', '선물을 꺼내라. 첫인사가 앞날을 정한다.'],
    treasure: ['함부로 손대지 마라. 하나하나 적어 두고 옮긴다.', '이건 우리 것이 아니라 이 땅의 이야기다. 조심히 다뤄라.']
  };
  // 그림·세공·학문에 밝은 사람이 없을 때 (가끔만)
  T.NOSKILL = {
    creature: ['생물에 밝은 사람이나 화가가 함께였다면 생김새를 더 자세히 남겼을 텐데요. 눈에 새겨 두겠습니다.', '가까이 갈 수는 없으니 발자국과 생김새를 잘 기억해 두어야겠습니다.',
      '저 녀석 생김새를 말로 옮기자니 막막합니다. 그림 그릴 줄 아는 친구가 하나 있었으면 좋겠습니다.'],
    nature: ['그림을 그릴 줄 아는 사람이 있었더라면 이 넓은 풍경을 그대로 옮겨 갈 수 있었을 텐데요.', '산줄기와 물길의 생김새를 화첩에 남기지 못해 아쉽습니다. 눈에 새겨 두어야겠습니다.'],
    any: ['그림을 그릴 줄 아는 사람이 있었더라면 이 모습을 그대로 옮겨 갈 수 있었을 텐데요. 말로만 전하면 믿어 줄지 모르겠습니다.', '솜씨 좋은 화가나 장인이 함께였다면 짜임새까지 자세히 적어 갔을 텐데, 아쉽습니다.',
      '손재주 있는 사람이 하나만 있었어도 본이라도 떠 갔을 텐데요.']
  };
  // 짐승 앞에서 덧붙이는 말 (늘 하지는 않는다)
  T.ANIMAL = ['새끼 뒤에 성체가 있습니다. 더 다가가면 위험합니다. 이 자리에서 조용히 살펴보시지요.', '새끼를 지키러 성체가 나왔습니다. 놀라게 하지 않도록 물러서서 기록하겠습니다.',
    '바람이 저쪽으로 붑니다. 냄새를 맡기 전에 한 걸음 물러서시지요.'];

  function S() { return G.Game.state; }
  function fill(t, ctx) {
    var U = G.U;
    return t.replace(/\{(\^?)(\w+)(?:\|([^}]+))?\}/g, function (m, only, k, pair) {
      var v = ctx[k] == null ? '' : String(ctx[k]);
      return pair ? (only ? U.jx(v, pair) : v + U.jx(v, pair)) : v;
    });
  }
  /** 이 발견의 사정 */
  T.context = function (d) {
    var s = S(), k = s.contract, ctx = { d: d.name };
    if (k && !k.small && (k.disc === d.id) && G.SPONSOR[k.sponsor]) { ctx.contract = true; ctx.sponsor = G.Sponsor.holderName(G.SPONSOR[k.sponsor]); }
    if (d.rival && !(s.disc[d.id] && s.disc[d.id].rival)) {
      var left = (d.rival[0] + (s.flags['delay_' + d.id] || 0)) * 12 + d.rival[1] - (s.date.y * 12 + s.date.m);
      if (left > 0 && left <= 12) { ctx.rival = d.rival[2]; ctx.close = true; }
    }
    ctx.legend = !!(d.real && d.real.legend);
    ctx.tired = !!(s.fleet && (s.fleet.fatigue || 0) >= 60);
    return ctx;
  };
  function pick(key, list, ctx) { return fill(G.U.pickFresh('reveal:' + key, list), ctx); }
  /** 부하의 첫 외침 */
  T.shout = function (d, ctx) {
    ctx = ctx || T.context(d);
    if (ctx.close && G.U.chance(0.7)) return pick('rival', T.SHOUT.rival, ctx);
    if (ctx.contract && G.U.chance(0.6)) return pick('contract', T.SHOUT.contract, ctx);
    if (ctx.legend && G.U.chance(0.6)) return pick('legend', T.SHOUT.legend, ctx);
    var L = (T.SHOUT[d.cat] || []).concat(G.U.chance(0.25) ? T.SHOUT.any : []);
    return pick(d.cat || 'any', L.length ? L : T.SHOUT.any, ctx);
  };
  /** 제독의 대답 */
  T.reply = function (d, ctx) {
    ctx = ctx || T.context(d);
    if (ctx.tired && G.U.chance(0.6)) return pick('r-tired', T.REPLY.tired, ctx);
    if (ctx.close && G.U.chance(0.6)) return pick('r-rival', T.REPLY.rival, ctx);
    if (ctx.contract && G.U.chance(0.5)) return pick('r-contract', T.REPLY.contract, ctx);
    if (ctx.legend) return pick('r-legend', T.REPLY.legend, ctx);
    var L = T.REPLY.any.concat(T.REPLY[d.cat] || []);
    return pick('r-' + (d.cat || 'any'), L, ctx);
  };
  /** 기록할 사람이 없을 때의 아쉬움 — 셋 중 하나꼴로만 (증거 등급 알림이 따로 있다) */
  T.noSkill = function (d) {
    if (!G.U.chance(0.35)) return null;
    var key = d.cat === 'creature' ? 'creature' : (d.cat === 'nature' || d.natural) ? 'nature' : 'any';
    return pick('n-' + key, T.NOSKILL[key], { d: d.name });
  };
  T.animal = function () { return G.U.chance(0.5) ? pick('animal', T.ANIMAL, {}) : null; };
})(window.G = window.G || {});
