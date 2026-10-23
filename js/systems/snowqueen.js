/* 눈의 여왕 (G.SnowQueen) — 사람은 js/data/snowqueen.js, 조정값은 G.BALANCE.snowQueen. 2026-10-21
   ① 북유럽 호숫가(라도가·오네가·페이푸스·일멘·베네른·베테른·멜라렌·옐마렌·사이마·파이얀네·이나리·미에사)에서 야영하면(야영마다 chance)
      얼어붙은 물가에서 동생 카이를 찾는 소녀 게르다를 만난다. 「눈의 여왕이 카이를 하얀 썰매에 태워 북쪽으로 데려갔어요.」
      핀란드 할머니에게서 썰매가 모스크바로 갔다는 이야기를 들었다며, 모스크바까지 데려다 달라고 한다 → 무급 항해사로 합류.
   ② 게르다를 데리고 모스크바에 들어서면: 크렘린의 하얀 방에서 「눈의 여왕」을 만난다. 그녀는 러시아의 공주 엘리자베타 —
      게르다와 카이는 오래전에 사라진 공가(公家)의 아이들이고, 자기가 돌보려고 데려왔으니 의심하지 말라고 한다.
      의심한 대가로 수수께끼(얼음 원반 — 하노이의 탑 ★3, 원반 다섯)를 풀어야 한다.
        · 풀면: 「이걸 푼 당신이니 진실을 알겠지」 — 게르다와 카이에게 진실을 알리고, 러시아에 살겠느냐고 묻는다. 둘은 남는다(게르다는 배에서 내린다).
                엘리자베타는 「아이들에게도 속아 넘어가는 당신을 누가 지켜 주겠소」 하고 — 몰래 배에 오른다. 모스크바를 떠난 뒤(뭍의 하루·다른 도시 입항) 짐 사이에서 나타나 합류.
        · 못 풀면: 「의심만 할 줄 알지」 — 아이들은 그녀가 돌보고, 게르다는 그대로 함께 다닌다. retryDays 뒤 다시 모스크바에 들어서면 다시 도전.
   · 거절하면 coolDays 동안 호숫가에서 다시 만나지 않는다. 북유럽·러시아 도시의 술집 주인이 한 번 귀띔한다.
   · 저장: s.snowQ = { stage: 'met'|'escort'|'stow'|'done', cool, retry }  ('met' 쓰지 않음) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, SQ = {};
  G.SnowQueen = SQ;
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.snowQueen = G.BALANCE.snowQueen || { chance: 0.5, lakeR: 1.0, coolDays: 45, retryDays: 30, moscow: 60, puzzle: 'hanoi', puzzleLv: 3 };
  function K() { return G.BALANCE.snowQueen; }
  function S() { return G.Game.state; }
  function st() { var s = S(); return s.snowQ || (s.snowQ = {}); }
  SQ.state = st;
  function row(id) { return S().mates.filter(function (x) { return x.id === id; })[0] || null; }
  function who(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: G.MATE[id].name, portrait: G.Art.mateSpec(id), lang: 3, special: true }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function say(id, text, emo) { return UI.say(text, who(id, emo)); }
  function narrate(text) { return UI.say(text, {}); }
  var kaiSpec = null;
  function kai(emo) {
    if (!kaiSpec) {
      try {
        kaiSpec = G.Art.npcSpec('tale_kai', 'noble', 'ne', 'm');
        if (G.Art.withImg) G.Art.withImg(kaiSpec, ['portraits/legendary/kai']);
      } catch (e) { kaiSpec = null; }
    }
    return { name: '카이', portrait: kaiSpec, half: ['portraits/legendary/kai_half'], lang: 3, special: true, emotion: emo || null };
  }
  function moscow() { return G.CITY_DATA[K().moscow]; }

  // ---------------------------------------------------------------- 북유럽의 호수 [이름, 경도, 위도]
  SQ.LAKES = [['라도가 호', 31.5, 60.9], ['오네가 호', 35.4, 61.7], ['페이푸스 호', 27.5, 58.7], ['일멘 호', 31.3, 58.3], ['베네른 호', 13.3, 58.9], ['베테른 호', 14.6, 58.3],
    ['멜라렌 호', 17.1, 59.4], ['옐마렌 호', 15.9, 59.25], ['사이마 호', 28.4, 61.3], ['파이얀네 호', 25.5, 61.6], ['이나리 호', 27.9, 69.0], ['미에사 호', 10.7, 60.9]];
  /** 이 자리에서 가까운 북유럽 호수 (없으면 null) */
  SQ.lakeAt = function (lon, lat) {
    var r = K().lakeR || 1.0, best = null, bd = 1e9;
    SQ.LAKES.forEach(function (L) { var d = G.Geo.dist(lon, lat, L[1], L[2]); if (d <= r && d < bd) { bd = d; best = L[0]; } });
    return best;
  };
  /** 모스크바로 가는 도중 게르다가 배를 떠났으면 이야기를 처음으로 — 「escort」에 묶여 다시 만날 수도 모스크바 장면도 없던 것 (QA 2026-10-23) */
  function fixEscort() {
    var q = st(), s = S();
    if (q.stage === 'escort' && !row('gerda')) { delete q.stage; q.cool = s.day + (K().coolDays || 45); }
  }
  SQ.fixEscort = fixEscort;
  /** 아직 게르다를 만날 수 있는가 */
  SQ.ready = function () {
    fixEscort();
    var q = st(), s = S();
    if (q.stage || row('gerda') || s.flags.gone_gerda) return false;
    return !(q.cool && s.day < q.cool);
  };

  // ================================================================ ① 호숫가의 게르다
  SQ.meetGerda = async function (lake) {
    var q = st(), pc = G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/gerda_lake', title: '얼어붙은 호숫가의 소녀' }) : null;
    try {
      await narrate('밤새 ' + lake + '에서 바람이 불어와 모닥불이 몇 번이나 꺼질 뻔했다. 새벽, 살얼음이 낀 물가에 맨발의 소녀가 웅크리고 앉아 있다. 해진 털모자 아래로 볼이 새빨갛게 얼었다. 품에는 빨간 구두 한 켤레를 꼭 안고 있다.');
      await say('gerda', '아… 사람이다. 정말 사람이에요! 며칠째 까마귀하고 순록만 봤어요.\f저는 게르다예요. 제 동생 카이를 찾고 있어요.');
      await say('gerda', '겨울이 시작되던 날, 하얀 썰매가 우리 마을 광장을 지나갔어요. 눈처럼 하얀 털옷을 입은 여자가 타고 있었는데… 사람들은 「눈의 여왕」이라고 불렀어요. 카이가 장난삼아 썰매 뒤에 제 썰매를 묶었는데, 그대로 북쪽으로 끌려가 버렸어요.\f그날부터 카이는 이상했어요. 거울 조각이 눈에 들어갔다면서, 아무것도 예쁘지 않다고, 저도 싫다고…', 'sad');
      await say('gerda', '여기까지 오는 길에 핀란드 할머니를 만났어요. 생선 껍질에 글을 써 주신 분이요. 할머니 말씀이, 하얀 썰매는 북쪽 끝이 아니라 동쪽으로 — 모스크바로 갔대요. 거기 크렘린 안에 얼음처럼 하얀 방이 있다고요.\f…모스크바는 너무 멀어요. 저 혼자서는 못 가요.', 'sad');
      var v = await UI.ask('게르다를 모스크바까지 데려다줄까?', [
        { label: '탐험대에 태운다 — 「모스크바까지 함께 가자」', value: 1, icon: 'heart' },
        { label: '가까운 마을에 맡긴다', value: 0 }], me());
      if (!v) {
        await say('gerda', '…괜찮아요. 걸어서라도 갈게요. 빨간 구두가 아직 있으니까요.', 'sad');
        q.cool = S().day + (K().coolDays || 45); return false;
      }
      var nm = G.Legend && G.Legend.join ? G.Legend.join('gerda', null) : null;
      if (!nm) return false;
      q.stage = 'escort'; q.metDay = S().day;
      G.State.log(lake + '에서 동생 카이를 찾는 소녀 게르다를 만나, 모스크바까지 데려다주기로 했다.');
      await say('gerda', '고맙습니다, 정말 고맙습니다! 저, 불 피우는 거랑 다친 데 감싸는 거 잘해요. 짐이 되지 않을게요.\f기다려, 카이. 누나가 간다.', 'happy');
      UI.toast('게르다 — 모스크바까지 함께 간다 (품삯 없음)', 'heart', 4500);
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ================================================================ ② 모스크바의 하얀 방
  SQ.moscow = async function (c) {
    var q = st(), s = S(), pc = null;
    if (q.stage !== 'escort' || !row('gerda') || (q.retry && s.day < q.retry)) return false;
    var eliz = { name: '눈의 여왕', portrait: G.Art.mateSpec('elizaveta'), half: G.Img.chain.mateHalf ? G.Img.chain.mateHalf('elizaveta') : null, lang: 3, special: true };
    try {
      pc = G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/snow_queen_hall', title: '크렘린의 하얀 방' }) : null;
      if (!q.tried) {
        await narrate('게르다가 앞장서 크렘린의 뒷문으로 숨어든다. 복도 끝, 사방이 얼음처럼 하얀 방. 창가에 흰 담비 털옷을 두른 여인이 서 있고, 그 곁에서 소년 하나가 얼음 조각을 맞추고 있다.');
        await say('gerda', '카이! 카이야!', 'happy');
        await UI.say('…누나? 정말 게르다 누나야?', kai('happy'));
        await narrate('여인이 천천히 돌아선다. 은관 아래 눈동자가 겨울 호수처럼 맑다.');
        await UI.say('여기까지 찾아왔구나, 게르다. 그리고 너를 데려온 바다의 제독.\f나는 눈의 여왕이 아니다. 이 나라의 공주, 엘리자베타다. 북방 사람들이 내 흰 털옷을 보고 그렇게 부를 뿐이지.', eliz);
        await UI.say('이 아이들은 오래전에 사라진 공가(公家)의 아이들이다. 게르다는 그 집안의 공주, 카이는 공자. 난리 통에 강 건너 덴마크 땅 가난한 집에 맡겨졌지. 나는 그 아이들을 돌보려고 데려왔을 뿐이다.\f그러니 나를 의심하지 마라.', eliz);
        await UI.say('…지금 한 말을 그대로 믿기는 어렵소. 아이를 썰매에 묶어 끌고 간 사람의 말이라면 더욱.', me());
        await UI.say('흥. 의심하는 것도 대가가 따르는 법이다.\f이 얼음 원반을 옮겨 보아라. 큰 것은 작은 것 위에 놓일 수 없다. 이걸 풀 만큼 머리가 맑은 자라면 — 내 말이 참인지 거짓인지도 스스로 알게 될 것이다.', eliz);
        q.tried = 1;
      } else {
        await narrate('다시 크렘린의 하얀 방. 엘리자베타가 얼음 원반이 놓인 탁자를 턱으로 가리킨다.');
        await UI.say('또 왔군. 이번에는 풀 수 있겠지?', eliz);
      }
      var ok = G.Games && G.Games.puzzle ? await G.Games.puzzle({ id: 'snowqueen', name: '눈의 여왕의 얼음 원반', pw: 5, cat: 'treasure', how: 'land', pzTitle: '눈의 여왕의 수수께끼 — 얼음 원반', pzText: '얼음 탁자에 서리로 새겨진 글: 「큰 얼음은 작은 얼음 위에 놓일 수 없다. 모든 얼음 원반을 오른쪽 기둥으로 옮겨라.」' }, K().puzzle || 'hanoi', K().puzzleLv || 3) : true;
      if (!ok) {
        await UI.say('의심할 줄만 알지 풀 줄은 모르는군. 아이들은 내가 돌본다. 머리를 식히고 다시 오너라.', eliz);
        await say('gerda', '…제독님, 저 포기 안 해요. 다음에 꼭 다시 와요.', 'sad');
        q.retry = s.day + (K().retryDays || 30);
        UI.toast('수수께끼를 풀지 못했다 — ' + (K().retryDays || 30) + '일 뒤 모스크바에 다시 들어서면 다시 도전할 수 있다.', 'info', 5200);
        return true;
      }
      await narrate('마지막 원반이 오른쪽 기둥에 내려앉자, 방 안의 서리가 한꺼번에 녹아 물방울로 흘러내린다.');
      await UI.say('…풀었군. 이걸 푼 당신이라면, 이제 진실을 알겠지?', eliz);
      await UI.ask('엘리자베타가 묻는다.', [{ label: '「그렇소. 당신은 아이들을 지키려 했소. 아이들에게 사실대로 말해 주시오」', value: 1 }, { label: '「…아직은 모르겠소. 당신 입으로 직접 말해 주시오」', value: 2 }], me());
      await UI.say('게르다, 카이. 너희는 가난한 집 아이가 아니다. 너희 아버지는 모스크바 대공을 섬기던 공(公)이었고, 난리 때 목숨을 지키려고 너희를 멀리 보냈다. 나는 너희 어머니와 자매처럼 자랐다.\f썰매로 데려온 건 미안하다. 사람들 눈을 피해야 했으니까.', eliz);
      await say('gerda', '…우리가, 공주라고요? 카이가 이상해진 것도…', 'sad');
      await UI.say('거울 조각 같은 건 없었어, 누나. 그냥… 다 알게 될까 봐 무서웠어. 누나가 나 때문에 이 먼 데까지 올까 봐.', kai('sad'));
      await UI.say('이제 다 알았으니 묻겠다. 이 나라에 남아 살겠느냐? 너희 아버지의 집과 이름을 되찾아 주겠다.', eliz);
      await say('gerda', '…네. 카이랑 같이 있을 수 있다면, 어디든 좋아요. 여기서 살게요.', 'happy');
      await UI.say('응. 누나랑 여기 있을래.', kai('happy'));
      // 게르다가 배에서 내린다
      s.mates = s.mates.filter(function (m) { return m.id !== 'gerda'; }); if (R.tidyCaptains) R.tidyCaptains();
      s.flags.gone_gerda = 1;
      await say('gerda', '제독님, 여기까지 데려다주셔서 고맙습니다. 빨간 구두는… 제독님 배에 두고 갈게요. 언젠가 또 길을 잃은 아이를 만나면, 그 아이 발에 맞을지도 몰라요.', 'happy');
      if (R.addItem) R.addItem('redshoes');
      await UI.say('…그런데 제독. 아이 둘의 거짓말에도 넘어갈 사람이, 바다에서는 어떻게 살아남는지 모르겠군.', eliz);
      await narrate('엘리자베타는 그 말만 남기고 등을 돌려 방을 나간다. 털옷 자락이 문틈으로 사라진다.');
      q.stage = 'stow'; q.stowDay = s.day;
      G.State.log('모스크바에서 「눈의 여왕」 엘리자베타의 수수께끼를 풀었다. 게르다와 카이는 사라진 공가의 아이들 — 러시아에 남았다.');
      if (G.Fame && G.Fame.add) G.Fame.add('so', 15);
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ================================================================ ③ 짐 사이에서 나타난 공주
  SQ.reveal = async function () {
    var q = st(); if (q.stage !== 'stow' || S().day <= (q.stowDay || 0)) return false;
    await narrate('짐을 다시 묶던 선원이 소리를 지른다. 모피 꾸러미 하나가 꿈틀거린다 — 흰 담비 털옷의 여인이 아무렇지도 않게 일어나 옷깃의 먼지를 턴다.');
    await say('elizaveta', '놀랄 것 없소. 아이 둘의 거짓말에도 속아 넘어가는 사람이 바다에서 장사를 하고 지도를 그린다니, 아무래도 마음이 놓이지 않아서.\f내가 아니면 누가 당신을 지켜 주겠소?');
    await say('elizaveta', '장부는 내가 보겠소. 별도, 해도도. 품삯은 필요 없소 — 크렘린에서 받을 만큼 받았으니.');
    var nm = G.Legend && G.Legend.join ? G.Legend.join('elizaveta', moscow()) : null;
    q.stage = 'done'; q.doneDay = S().day;
    if (nm) {
      G.State.log('「눈의 여왕」 엘리자베타가 몰래 배에 올라 따라나섰다.');
      UI.toast('엘리자베타 — 신학 2 · 과학 3 · 측량 3 · 회계 3 · 웅변 2 · 다섯 나라 말 (' + G.wageNote('elizaveta') + ')', 'heart', 5200);
    }
    return true;
  };

  // ---------------------------------------------------------------- 술집 주인의 귀띔 (북유럽·러시아 도시에서 한 번)
  var NORTH = { '스웨덴': 1, '덴마크': 1, '노르웨이': 1, '모스크바': 1, '모스크바 대공국': 1, '러시아': 1, '리보니아': 1, '노브고로드': 1, '한자 동맹': 1, '폴란드': 1 };
  SQ.tavernHint = async function (c) {
    var s = S(); if (!c || s.flags.sqHint) return;
    var o = R.cityOwner ? R.cityOwner(c) : c.nation;
    if (c.id === K().moscow && st().stage === 'escort') return;
    if (!(NORTH[o] || (c.lat >= 55 && c.lon >= 5 && c.lon <= 45)) || !SQ.ready()) return;
    s.flags.sqHint = 1;
    var CC = G.Scenes.city;
    await UI.say('호숫가에서 야영할 거면 눈여겨보게. 맨발로 얼음 위를 헤매며 동생을 찾는 계집아이가 있다더군. 하얀 썰매가 그 동생을 태워 갔다나. 북방에선 다들 「눈의 여왕」 짓이라고 수군대지.', CC && CC.npc ? CC.npc('tavernkeeper', '술집 주인') : {});
  };

  // ---------------------------------------------------------------- 다른 코드에 잇기
  function hook() {
    var T = G.Tale, Cc = G.Scenes && G.Scenes.city;
    if (!T || !Cc || !Cc.arrival || SQ.hooked) return;
    SQ.hooked = true;
    // 야영: 북유럽 호숫가 → 게르다
    var oc = T.onCamp;
    T.onCamp = async function (v, lon, lat) {
      try {
        if (v && S().loc.mode === 'land' && SQ.ready()) {
          var lake = SQ.lakeAt(lon, lat);
          if (lake && U.chance(K().chance == null ? 0.5 : K().chance)) return await SQ.meetGerda(lake);
        }
      } catch (e) { console.error(e); }
      return oc.apply(this, arguments);
    };
    // 뭍의 하루: 몰래 탄 공주가 나타난다
    var ol = T.onLand;
    T.onLand = async function () {
      try { if (st().stage === 'stow' && await SQ.reveal()) return true; } catch (e) { console.error(e); }
      return ol.apply(this, arguments);
    };
    // 도시에 들어설 때: 모스크바의 하얀 방 / 다른 도시면 몰래 탄 공주
    var oa = Cc.arrival;
    Cc.arrival = async function (c) {
      var r = await oa.apply(this, arguments);
      try {
        fixEscort();
        if (c && c.id === K().moscow && st().stage === 'escort') await SQ.moscow(c);
        else if (c && c.id !== K().moscow && st().stage === 'stow') await SQ.reveal();
      } catch (e) { console.error(e); }
      return r;
    };
    // 술집 주인의 귀띔
    var oh = T.tavernHints;
    T.tavernHints = async function (c) { var r = await oh.apply(this, arguments); try { await SQ.tavernHint(c); } catch (e) { console.error(e); } return r; };
  }
  SQ.hook = hook;
  hook();
  if (!SQ.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
