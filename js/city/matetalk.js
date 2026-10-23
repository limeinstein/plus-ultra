/* 부하와 이야기 — 술집·여관의 「부하와 이야기」 (G.MateTalk)
   · 데리고 다니는 부하 한 사람과 마주 앉는다: 요즘 이야기(하루 한 번 충성↑), 살아온 이야기(실존 인물은 인물 이야기, 철새는 제 이야기),
     한잔 사기(하루 한 번), 이성 부하에게는 선물(충성이 선물 값만큼 오른다 — BALANCE.mateTalk.giftLoyal), 여성 부하에게는 청혼, 마녀에게는 점괘.
   · 여성 부하의 호감: s.mates[i].aff (0~100). 호감이 BALANCE.mateTalk.wedAff 이상이고 약속 반지가 있으면 청혼할 수 있다.
     결혼하면 부하에서 물러나 고향 자택에서 기다린다 (s.player.wife = 그 항해사 ID — family.js가 여급과 똑같이 다룬다). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city;
  var MT = {};
  G.MateTalk = MT;
  function S() { return G.Game.state; }
  function cfg() { return (G.BALANCE && G.BALANCE.mateTalk) || {}; }
  function T() { return C.B.tavern; }
  function heart(a) { var n = Math.round((a || 0) / 20); return '♥♥♥♥♥'.slice(0, n) + '♡♡♡♡♡'.slice(0, 5 - n); }
  MT.heart = heart;

  /** 술집·여관 메뉴 한 줄 */
  MT.menuItem = function (c) {
    var n = S().mates.length;
    return { label: '부하와 이야기', icon: 'people', sub: n ? n + '명' : '없다', dim: !n, onClick: function () { return MT.open(c); } };
  };

  MT.open = async function (c) {
    var s = S();
    for (;;) {
      if (!s.mates.length) { UI.toast('데리고 다니는 부하가 없습니다.', 'people'); return; }
      var i = await UI.choose('부하와 이야기', s.mates.map(function (m, k) {
        var d = G.MATE[m.id]; if (!d) return { label: '—', value: -1, disabled: true };
        var tag = d.witch ? ' <span class="tag">마녀</span>' : d.wd ? ' <span class="tag">철새</span>' : '';
        return { label: U.esc(d.name) + tag, value: k, icon: d.g === 'f' ? 'heart' : 'people',
          right: R.roleName(m) + ' · 충성 ' + Math.round(m.loyal || 70) + (d.g === 'f' && !d.sib && !d.minor ? ' · ' + heart(m.aff) : '') + (G.Romance && G.Romance.tag(m.id) ? ' · ' + U.esc(G.Romance.tag(m.id)) : '') };
      }), { width: 620, icon: 'people', text: '누구와 이야기할까?' });
      if (i == null || i < 0) return;
      await MT.talk(c, s.mates[i]);
    }
  };

  function lines(d, m) {
    var lo = m.loyal || 70, f = d.g === 'f', aff = m.aff || 0;
    if (f && aff >= 80) return ['제독… 요즘은 바다보다 당신 얼굴을 더 자주 보게 되네요.', '다음 항구에 닿으면, 잠깐 둘이서 걸어요.', '당신 배에 오르길 정말 잘했어요.'];
    if (f && aff >= 50) return ['제독과 이야기하는 시간이 제일 좋아요.', '오늘은 파도가 잔잔해서 기분이 좋아요. 당신 덕분인가 봐요.'];
    if (f) return lo >= 80 ? ['제독과 함께라면 세상 끝이라도 갈 거예요.', '요즘 배 위가 즐거워요. 다음 바다는 어디예요?'] : lo >= 50 ? ['그럭저럭 지낼 만해요.', '다음 항구에서는 좀 쉬었으면 좋겠어요.', '선원들이 저를 조금씩 믿어 주는 것 같아요.'] : ['솔직히 요즘 마음이 좀 떠 있어요…', '급료가 조금만 더 오르면 좋겠어요.'];
    if (lo >= 80) return ['제독과 함께라면 세상 끝이라도 가겠소.', '요즘 배 위가 즐겁소. 다음 바다는 어디요?', '선원들도 제독을 믿고 있소. 나도 그렇고.'];
    if (lo >= 50) return ['그럭저럭 지낼 만하오.', '선원들 사이에 별 탈은 없소. 식량만 넉넉하면 되오.', '다음 항구에서는 좀 쉬었으면 좋겠군.'];
    return ['솔직히 요즘 마음이 좀 떠 있소…', '급료가 조금만 더 오르면 좋겠소.', '이 항해가 언제 끝날지 모르겠군.'];
  }
  // 요령 한마디 [남자 말씨, 여자 말씨]
  function tip(d) {
    var sk = d.sk || {}, f = d.g === 'f', t;
    if (sk.nav >= 2) t = ['긴 항해 전에는 물을 넉넉히 싣게. 바람이 멎으면 물이 먼저 바닥나는 법이지.', '긴 항해 전에는 물을 넉넉히 실어요. 바람이 멎으면 물이 먼저 바닥나거든요.'];
    else if (sk.med >= 2) t = ['괴혈병은 신 과일과 싱싱한 채소로 막을 수 있소. 항구에 닿으면 꼭 챙기시오.', '괴혈병은 신 과일과 싱싱한 채소로 막을 수 있어요. 항구에 닿으면 꼭 챙기세요.'];
    else if (sk.acct >= 2) t = ['멀리 갈수록 값이 오르지만, 상하는 물건은 오래 싣지 마시오.', '멀리 갈수록 값이 오르지만, 상하는 물건은 오래 싣지 마세요.'];
    else if (sk.sword >= 2) t = ['일기토에서는 상대의 첫 수를 흘려 보내는 게 좋소. 급한 놈은 제풀에 무너지지.', '일기토에서는 상대의 첫 수를 흘려 보내는 게 좋아요. 급한 사람은 제풀에 무너지거든요.'];
    else if (sk.gun >= 2) t = ['바람을 등지고 쏘면 포연이 눈을 가리지 않소.', '바람을 등지고 쏘면 포연이 눈을 가리지 않아요.'];
    else if (sk.theo >= 2) t = ['낯선 땅의 사람들에게도 그들의 신이 있소. 존중하면 길이 열리지.', '낯선 땅의 사람들에게도 그들의 신이 있어요. 존중하면 길이 열려요.'];
    else if (sk.survey >= 2) t = ['곶마다 방위를 적어 두면 돌아올 때 길을 잃지 않소.', '곶마다 방위를 적어 두면 돌아올 때 길을 잃지 않아요.'];
    else if (sk.ship >= 2) t = ['자재를 넉넉히 실어 두시오. 바다 위에서 배를 고칠 수 있으니.', '자재를 넉넉히 실어 두세요. 바다 위에서도 배를 고칠 수 있어요.'];
    else if (sk.speech >= 2) t = ['처음 가는 항구에서는 먼저 웃고, 나중에 흥정하시오.', '처음 가는 항구에서는 먼저 웃고, 흥정은 나중에 해요.'];
    else t = ['바다는 늘 한 걸음 앞을 보는 사람 편이지.', '바다는 늘 한 걸음 앞을 보는 사람 편이에요.'];
    return t[f ? 1 : 0];
  }
  /** 마주 앉았을 때 부하가 먼저 건네는 말 — 충성·호감 수치는 고르는 목록에 이미 있으니 말로만 (QA 2026-10-11) */
  function greet(d, m, f) {
    var lo = m.loyal || 70, a = m.aff || 0, L;
    if (f && a >= 70) L = ['오셨어요, 제독? 마침 이야기 상대가 필요했어요.', '제독이 먼저 불러 주시니 기분이 좋네요.', '무슨 일이세요? 얼굴 보니 좋은 일인가 봐요.'];
    else if (lo < 45) L = f ? ['…무슨 일이세요?', '부르셨어요? 할 말이 있으면 빨리 해 주세요.'] : ['…무슨 일이오?', '부르셨소? 용건부터 들읍시다.'];
    else if (lo >= 85) L = f ? ['부르셨어요, 제독? 언제든 말씀하세요.', '제독, 한숨 돌리시는 거예요? 저도 같이 쉴게요.'] : ['부르셨습니까, 제독? 언제든 말씀하십시오.', '제독, 잠깐 쉬어 가시는 겁니까? 저도 한숨 돌리지요.'];
    else L = f ? ['부르셨어요, 제독?', '무슨 일이세요, 제독?', '네, 제독. 듣고 있어요.'] : ['부르셨소, 제독?', '무슨 일이오, 제독?', '예, 제독. 말씀하시오.'];
    return U.pickFresh ? U.pickFresh('mt:greet:' + d.id, L) : U.pick(L);
  }
  function speaker(d, emotion, asking) {
    var who = T().mateSpeaker(d), o = {}, k; for (k in who) o[k] = who[k];
    o.layout = 'duo'; o.side = 'right'; o.partner = T().playerSpeaker(); o.emotion = emotion || 'warm';
    // 데리고 다니는 부하는 이미 제독과 말이 통한다 — 낯선 말 흉내·통역 없이 그대로 (QA 2026-10-11)
    o.lang = 3; o.li = null;
    if (asking) o.choiceSide = 'left';
    return o;
  }

  /* 선물 (「선물한다」): 받는 사람에 따라 고를 수 있는 것이 다르다
     · 여자 부하 = 장신구(kind 'gift', 약속 반지는 청혼용이라 뺀다)
     · 남자 부하 = 남자 선물(kind 'mgift': 술·카드·주사위·체스·장난감) + 검·방어구(제독이 차고 있는 것 한 벌은 남긴다)
     보고하지 않은 발견의 증거품은 내놓지 않는다 */
  MT.giftValue = function (d) {
    if (d.kind === 'weapon' || d.kind === 'armor') return d.rare && !d.price ? 30 : Math.min(30, Math.max(4, Math.round((d.price || 0) / 250)));   // 검·방어구: 값 250닢마다 1 (4~30)
    return d.gv || 0;
  };
  MT.giftsFor = function (md) {
    var s = S(), eq = s.player.equip || {}, keep = {};
    if (eq.weapon) keep[eq.weapon] = 1; if (eq.armor) keep[eq.armor] = 1;
    return s.player.items.filter(function (it) {
      var d = G.ITEM[it.id]; if (!d || R.isProof(it)) return false;
      if (md.g === 'f') return d.kind === 'gift' && !d.ring;
      if (d.kind === 'mgift') return true;
      if (d.kind === 'weapon' || d.kind === 'armor') { if (keep[it.id]) { keep[it.id] = 0; return false; } return true; }
      return false;
    });
  };
  var MEN_THANKS = {
    weapon: ['이건… 좋은 칼이군. 제독의 이름에 먹칠하지 않게 쓰겠소.', '손에 착 감기는구려. 다음 싸움에서는 이걸로 제독 곁을 지키겠소.'],
    armor: ['이런 갑옷을 내게? 이제 칼끝 따위는 무섭지 않소.', '제 몸 아끼라는 뜻으로 알겠소. 고맙소, 제독.'],
    drink: ['오, 이 술은! 오늘 밤 제독의 건강을 위해 한잔하겠소.', '크으, 냄새만 맡아도 취하는군. 아껴 마시겠소… 아마도.'],
    game: ['이걸로 선원들 주머니를 좀 털어 볼까. 고맙소, 제독!', '심심하던 참이었소. 다음에 한 판 붙읍시다, 제독.'],
    toy: ['허, 이런 걸 다… 어릴 적 생각이 나는군. 고맙소.', '뭘 이런 걸 다. …그래도 눈을 못 떼겠구려.']
  };

  /** 한 사람과 마주 앉는다 */
  MT.talk = async function (c, m) {
    var s = S(), d = G.MATE[m.id], cf = cfg(); if (!d) return;
    var f = d.g === 'f', today = U.dateNum(s.date);
    // 아이(d.minor: 게르다·심청)는 동생처럼 호감·청혼이 없다 — 옛 저장에 쌓인 호감은 조용히 비운다 (QA 2026-10-23)
    var noLove = !!(d.sib || d.minor);
    if (d.minor && m.aff) m.aff = 0;
    function say(t, e) { return UI.say(t, speaker(d, e, false)); }
    function ask(t, ch) { return UI.ask(t, ch, speaker(d, 'warm', true)); }
    var turn = 0;
    function gainAff(n) { if (f && !noLove) m.aff = Math.min(100, (m.aff || 0) + n); }
    for (;;) {
      var bio = G.Bio && G.Bio.find(d.name);
      var opts = [{ label: '요즘 어떤가', value: 'chat' }, { label: '살아온 이야기', value: 'life' }, { label: '한잔 산다', value: 'drink' }];
      if (d.witch) opts.push({ label: '점괘를 본다', value: 'fortune' });
      var w2 = G.Wives && G.Wives.of(d.id);     // 둘째 부인으로 함께 다니는 사람 (js/systems/wives.js)
      var opp = (d.g === 'f') !== (s.player.g === 'f');      // 제독과 다른 성(이성)
      opts.push({ label: '선물한다', value: 'gift' });   // 남자 부하에게도 늘 — 남자 선물은 애정 없이 충성만 오른다 (2026-10-20)
      if (f && !noLove) opts.push(w2 ? { label: '집으로 보낸다', value: 'w2home' } : { label: '청혼한다', value: 'wed', dis: !((m.aff || 0) >= (cf.wedAff || 90)) });
      opts.push({ label: '그만둔다', value: null });
      var v = await ask(turn++ ? U.pick(f ? ['또 무슨 이야기를 할까요?', '더 하실 말씀 있으세요?', '다른 건요, 제독?'] : ['또 무슨 이야기를 할까?', '더 할 말이 있소?', '다른 용건은 없소, 제독?']) : greet(d, m, f), opts);
      if (!v) return;
      if (v === 'chat') {
        await say(U.pick(lines(d, m)), f && (m.aff || 0) >= 50 ? 'happy' : 'warm');
        if (m.chat !== today) {
          m.chat = today; m.loyal = Math.min(100, (m.loyal || 70) + (cf.chatLoyal || 1)); gainAff(cf.chatAff || 2);
          if (U.chance(0.35)) {
            var dd = T().rumour(c);
            if (dd && G.Disc.addHint(dd.id, 'mate:' + d.id)) { await say((f ? '그러고 보니 이런 이야기를 들었어요. ' : '그러고 보니 이런 이야기를 들었소. ') + dd.hint, 'warm'); UI.toast('단서를 얻었다: 「' + dd.name + '」', 'scroll'); }
            else await say(tip(d), 'warm');
          } else await say(tip(d), 'warm');
        }
      } else if (v === 'life') {
        if (bio) { await say(f ? U.pick(['제 이야기요? 길어질 텐데 괜찮겠어요?', '그 이야기를 하려면 한 잔 더 있어야겠네요.']) : d.wd ? '내 이야기? 별로 대단할 건 없소만…' : U.pick(['내 지난 이야기라… 길어질 텐데 괜찮겠소?', '그 이야기를 하려면 술이 한 잔 더 필요하겠군.']), 'warm'); await G.Bio.show(d.name, { portrait: G.Scenes.mateSpec(d.id) }); }
        else await say(d.story || d.desc, 'warm');
      } else if (v === 'drink') {
        var pr = (cf.drinkCost || 8) * (2 + (c.size || 1));
        // 같은 날·같은 입항이면 한 번 — 건물을 드나들면 하루가 흘러 다시 마실 수 있던 것 (QA 2026-10-23). 바다·뭍에서는 날짜만
        if (m.drink === today || (m.drinkPv && G.R.stayNo && m.drinkPv === G.R.stayNo() && s.loc && s.loc.mode === 'city')) { await say(f ? '오늘은 이미 충분히 마셨어요. 내일 또 한잔해요.' : '오늘은 이미 충분히 마셨소. 내일 또 한잔합시다.', 'warm'); continue; }
        if (s.player.gold < pr) { UI.toast('소지금이 모자랍니다. (금화 ' + pr + '닢)', 'coin'); continue; }
        s.player.gold -= pr; m.drink = today; if (G.R.stayNo) m.drinkPv = G.R.stayNo();
        m.loyal = Math.min(100, (m.loyal || 70) + (cf.drinkLoyal || 2)); gainAff(cf.drinkAff || 3);
        await say(U.pick(f ? ['고마워요, 제독. 건배!', '당신이랑 마시니까 더 맛있네요.', '오늘은 제가 노래 한 곡 불러 드릴게요.'] : ['제독이 사는 술이라면 사양 않겠소!', '바다와 제독을 위하여!', '크으, 이 맛에 뱃일을 하지.']), 'happy');
      } else if (v === 'fortune') {
        var fd = cf.fortuneDays || 30;
        if (m.fortune != null && s.day - m.fortune < fd) { await say('수정 구슬도 쉬어야 해요. ' + (fd - (s.day - m.fortune)) + '일쯤 뒤에 다시 물어보세요.', 'warm'); continue; }
        m.fortune = s.day;
        var d2 = U.chance(0.65) ? T().rumour(c) : null;
        if (d2 && G.Disc.addHint(d2.id, 'witch:' + d.id)) { await say('…연기 속에 보이네요. ' + d2.hint, 'warm'); UI.toast('단서를 얻었다: 「' + d2.name + '」', 'scroll'); }
        else {
          s.player.luck = Math.min(99, (s.player.luck || 50) + 3);
          await say(U.pick(['이번 달은 바람이 당신 편이에요. 행운이 조금 늘었어요.', '물가에서 흰 새를 보거든 그 뒤를 따라가요. 좋은 일이 생길 거예요.']), 'happy');
          UI.toast('행운이 조금 올랐다.', 'star');
        }
      } else if (v === 'gift') {
        var gifts = MT.giftsFor(d);
        if (!gifts.length) { UI.toast(f ? '선물할 장신구가 없습니다. 시장에서 살 수 있습니다.' : '선물할 것이 없습니다 — 술·카드·장난감은 시장에서 사고, 남는 검이나 방어구도 줄 수 있습니다.', 'info', 4200); continue; }
        var gloy = function (gv) { return opp || !f ? Math.max(cf.giftLoyalMin || 3, Math.round(gv * (cf.giftLoyal == null ? 0.6 : cf.giftLoyal))) : 2; };   // 남자 부하(남자 선물·검·방어구)는 제독이 남자여도 선물 값만큼 충성
        var gi = await UI.choose(f ? '선물 — 장신구' : '선물 — 술·카드·장난감·검·방어구', gifts.map(function (it, i) { var dd = G.ITEM[it.id], v0 = MT.giftValue(dd); return { label: dd.name + (f ? '' : ' <small class="muted">' + (G.ITEM_KIND[dd.kind] || '') + '</small>'), right: f ? '♥' + v0 : '충성 +' + gloy(v0), value: i, icon: f ? 'heart' : 'handshake', thumb: G.Img.itemSrc(it) }; }), { width: 520 });
        if (gi == null) continue;
        var it = gifts[gi], gd = G.ITEM[it.id], gv = MT.giftValue(gd);
        if ((gd.kind === 'weapon' || gd.kind === 'armor') && s.player.equip && s.player.equip[gd.kind] === it.id && !s.player.items.some(function (x) { return x !== it && x.id === it.id; })) s.player.equip[gd.kind] = null;   // (차고 있던 마지막 한 벌이면 벗는다)
        R.removeItemObject(it);
        var af0 = m.aff || 0, lo0 = m.loyal || 70;
        gainAff(gv + R.skill('craft'));
        // 이성 부하: 선물 값만큼 충성도 오른다 (리본 +3 · 향수 +5 · 머리장식 +7 · 케이프 +8 · 진주 목걸이 +12), 여자 제독 → 여자 부하는 예전처럼 +2
        // 남자 부하: 남자 선물(술·카드·장난감)·검·방어구 — 애정(호감)은 오르지 않고 충성만 선물 값만큼 (제독이 남자여도)
        var gl = gloy(gv);
        m.loyal = Math.min(100, lo0 + gl);
        UI.toast(d.name + ' — 충성 +' + (m.loyal - lo0) + (f && !noLove ? ' · 호감 +' + ((m.aff || 0) - af0) : ''), 'heart', 3200);
        await say(U.pick(f ? ['어머, 이걸 저에게요? 소중히 할게요.', '배 위에서 이런 선물을 받을 줄은 몰랐어요. 고마워요.'] : MEN_THANKS[gd.kind === 'weapon' || gd.kind === 'armor' ? gd.kind : gd.mg] || ['이걸 내게? …고맙소, 제독. 이 은혜는 잊지 않겠소.']), 'happy');
      } else if (v === 'w2home') {
        var wv = G.Wives.of(d.id), here = s.loc.mode === 'city' && s.loc.city === wv.city;
        var okH = await UI.confirm(d.name + U.jx(d.name, '을/를') + ' ' + G.CITY_DATA[wv.city].name + '의 집으로 보낼까요?<br><small class="muted">' + (here ? '여기서 배에서 내려 그 집에서 삽니다.' : '혼자 먼저 가서 그 집에서 기다립니다.') + ' 그 집에서 다시 배에 태울 수 있습니다.</small>', '보낸다', '그만둔다');
        if (!okH) continue;
        await say(here ? '집에서 기다릴게요. 자주 들러요.' : '먼저 가 있을게요. 꼭 들러요, 당신.', 'warm');
        G.Wives.settle(wv, !here);
        return;
      } else if (v === 'wed') {
        var taken = G.Romance ? G.Romance.blocksWed(d.id) : '';   // 다른 부하와 연인·부부인 사람 (js/systems/romance.js)
        if (taken) { await say(taken, 'shy'); continue; }
        if (!R.hasItem('ring')) { UI.toast('청혼하려면 약속 반지가 필요합니다.', 'ring'); continue; }
        if (s.player.wife) { if (G.Wives) { if (await G.Wives.proposeMate(d, m, say)) return; continue; } UI.toast('이미 결혼했습니다.', 'ring'); continue; }   // 본처가 있으면 둘째 부인으로
        var ok = await UI.confirm(d.name + '에게 청혼하겠습니까?<br><small>결혼하면 부하에서 물러나 고향 ' + G.CITY_DATA[s.player.home].name + '의 자택에서 기다리게 됩니다.</small>', '청혼한다', '그만둔다');
        if (!ok) continue;
        R.removeItem('ring');
        if (G.Outcome) await G.Outcome.show('propose', { sub: d.name + U.jx(d.name, '이/가') + ' 반지를 받아 주었다' });   // 결과 연출 (js/ui/outcome.js)
        await say(d.witch ? '…마녀에게 청혼하는 사람은 처음 봐요. 좋아요, 당신의 운명은 제가 지켜 줄게요.' : '…정말요? 바다에서 만난 사람과 이렇게 될 줄은 몰랐어요. 네, 기꺼이요!', 'shy');
        s.player.wife = d.id;
        if (G.Growth) G.Growth.once('wed', 'cha', 1, '혼인 — 한 집안의 가장이 되었다');   // 첫 혼인: 매력 +1 (js/systems/growth.js)
        s.mates = s.mates.filter(function (x) { return x !== m; });
        s.flags['gone_' + d.id] = 1;       // 이제 술집에 나타나지 않는다
        s.flags['wed_' + d.id] = 1;
        R.tidyCaptains();
        G.State.log(d.name + U.jx(d.name, '과/와') + ' 결혼했다.');
        if (G.FamEv) { try { await G.FamEv.wedding({ id: d.id }); } catch (e) { console.error(e); } }   // 갑판 위의 혼례 (familyevent.js)
        await UI.alert(d.name + U.jx(d.name, '과/와') + ' 결혼했다! 배에서 내려 고향 ' + G.CITY_DATA[s.player.home].name + '의 자택에서 기다리고 있을 것이다.', '결혼');
        return;
      }
    }
  };
})(window.G = window.G || {});
