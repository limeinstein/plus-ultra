/* 부하와 이야기 — 술집·여관의 「부하와 이야기」 (G.MateTalk)
   · 데리고 다니는 부하 한 사람과 마주 앉는다: 요즘 이야기(하루 한 번 충성↑), 살아온 이야기(실존 인물은 인물 이야기, 철새는 제 이야기),
     한잔 사기(하루 한 번), 여성 부하에게는 선물과 청혼, 마녀에게는 점괘.
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
          right: R.roleName(m) + ' · 충성 ' + Math.round(m.loyal || 70) + (d.g === 'f' ? ' · ' + heart(m.aff) : '') };
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
  function speaker(d, emotion, asking) {
    var who = T().mateSpeaker(d), o = {}, k; for (k in who) o[k] = who[k];
    o.layout = 'duo'; o.side = 'right'; o.partner = T().playerSpeaker(); o.emotion = emotion || 'warm';
    if (asking) o.choiceSide = 'left';
    return o;
  }

  /** 한 사람과 마주 앉는다 */
  MT.talk = async function (c, m) {
    var s = S(), d = G.MATE[m.id], cf = cfg(); if (!d) return;
    var f = d.g === 'f', today = U.dateNum(s.date);
    function say(t, e) { return UI.say(t, speaker(d, e, false)); }
    function ask(t, ch) { return UI.ask(t, ch, speaker(d, 'warm', true)); }
    function gainAff(n) { if (f) m.aff = Math.min(100, (m.aff || 0) + n); }
    for (;;) {
      var bio = G.Bio && G.Bio.find(d.name);
      var opts = [{ label: '요즘 어떤가', value: 'chat' }, { label: '살아온 이야기', value: 'life' }, { label: '한잔 산다', value: 'drink' }];
      if (d.witch) opts.push({ label: '점괘를 본다', value: 'fortune' });
      var w2 = G.Wives && G.Wives.of(d.id);     // 둘째 부인으로 함께 다니는 사람 (js/systems/wives.js)
      if (f) opts.push({ label: '선물한다', value: 'gift' }, w2 ? { label: '집으로 보낸다', value: 'w2home' } : { label: '청혼한다', value: 'wed', dis: !((m.aff || 0) >= (cf.wedAff || 90)) });
      opts.push({ label: '그만둔다', value: null });
      var v = await ask(d.name + ' — 충성 ' + Math.round(m.loyal || 70) + (f ? ' · 호감 ' + heart(m.aff) : ''), opts);
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
        if (m.drink === today) { await say(f ? '오늘은 이미 충분히 마셨어요. 내일 또 한잔해요.' : '오늘은 이미 충분히 마셨소. 내일 또 한잔합시다.', 'warm'); continue; }
        if (s.player.gold < pr) { UI.toast('소지금이 모자랍니다. (금화 ' + pr + '닢)', 'coin'); continue; }
        s.player.gold -= pr; m.drink = today;
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
        var gifts = s.player.items.filter(function (it) { return G.ITEM[it.id] && G.ITEM[it.id].kind === 'gift' && !G.ITEM[it.id].ring && !R.isProof(it); });
        if (!gifts.length) { UI.toast('선물할 장신구가 없습니다. 시장에서 살 수 있습니다.', 'info'); continue; }
        var gi = await UI.choose('선물', gifts.map(function (it, i) { return { label: G.ITEM[it.id].name, right: '♥' + G.ITEM[it.id].gv, value: i, icon: 'heart', thumb: G.Img.itemSrc(it) }; }), { width: 460 });
        if (gi == null) continue;
        var it = gifts[gi]; s.player.items.splice(s.player.items.indexOf(it), 1);
        gainAff(G.ITEM[it.id].gv + R.skill('craft'));
        m.loyal = Math.min(100, (m.loyal || 70) + 2);
        await say(U.pick(['어머, 이걸 저에게요? 소중히 할게요.', '배 위에서 이런 선물을 받을 줄은 몰랐어요. 고마워요.']), 'happy');
      } else if (v === 'w2home') {
        var wv = G.Wives.of(d.id), here = s.loc.mode === 'city' && s.loc.city === wv.city;
        var okH = await UI.confirm(d.name + U.jx(d.name, '을/를') + ' ' + G.CITY_DATA[wv.city].name + '의 집으로 보낼까요?<br><small class="muted">' + (here ? '여기서 배에서 내려 그 집에서 삽니다.' : '혼자 먼저 가서 그 집에서 기다립니다.') + ' 그 집에서 다시 배에 태울 수 있습니다.</small>', '보낸다', '그만둔다');
        if (!okH) continue;
        await say(here ? '집에서 기다릴게요. 자주 들러요.' : '먼저 가 있을게요. 꼭 들러요, 당신.', 'warm');
        G.Wives.settle(wv, !here);
        return;
      } else if (v === 'wed') {
        if (!R.hasItem('ring')) { UI.toast('청혼하려면 약속 반지가 필요합니다.', 'ring'); continue; }
        if (s.player.wife) { if (G.Wives) { if (await G.Wives.proposeMate(d, m, say)) return; continue; } UI.toast('이미 결혼했습니다.', 'ring'); continue; }   // 본처가 있으면 둘째 부인으로
        var ok = await UI.confirm(d.name + '에게 청혼하겠습니까?<br><small>결혼하면 부하에서 물러나 고향 ' + G.CITY_DATA[s.player.home].name + '의 자택에서 기다리게 됩니다.</small>', '청혼한다', '그만둔다');
        if (!ok) continue;
        R.removeItem('ring');
        await say(d.witch ? '…마녀에게 청혼하는 사람은 처음 봐요. 좋아요, 당신의 운명은 제가 지켜 줄게요.' : '…정말요? 바다에서 만난 사람과 이렇게 될 줄은 몰랐어요. 네, 기꺼이요!', 'shy');
        s.player.wife = d.id;
        s.mates = s.mates.filter(function (x) { return x !== m; });
        s.flags['gone_' + d.id] = 1;       // 이제 술집에 나타나지 않는다
        s.flags['wed_' + d.id] = 1;
        R.tidyCaptains();
        G.State.log(d.name + U.jx(d.name, '과/와') + ' 결혼했다.');
        await UI.alert(d.name + U.jx(d.name, '과/와') + ' 결혼했다! 배에서 내려 고향 ' + G.CITY_DATA[s.player.home].name + '의 자택에서 기다리고 있을 것이다.', '결혼');
        return;
      }
    }
  };
})(window.G = window.G || {});
