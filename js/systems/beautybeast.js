/* 미녀와 야수 — 보르네오 밀림의 짐승 가면 (G.Beauty) 2026-11-01 사용자 요청. 사람·조정값: js/data/beautybeast.js (G.BALANCE.beauty)
   ■ 조건: 1570년부터, 장미(장미가 든 교역품이나 소지품 — 장미수·파란 장미·야음의 장미…)를 지닌 채 보르네오 섬의 뭍을 걸을 때
     (js/scenes/land.js 가 하루를 걸을 때마다 G.Beauty.onLand 를 부른다). 날마다 chance, 장미를 지니고 sure일을 걸으면 반드시.
   ■ 흐름
     ① 짐승 가면을 쓴 거구의 사내가 길을 막는다. 짐 속의 장미 냄새를 맡고 — 「장미를 지닌 사람은 어머니 정원의 손님」이라며 도움을 청한다.
        저 아래 강가에서 한 여자가 멧돼지 떼와 말레이곰에게 쫓기고 있다. (가) 돕는다 (나) 가면의 사내를 믿지 못해 물러선다 (coolDays일 뒤 다시)
     ② 돕는다: 강가의 짐승 떼와 싸운다(육상전 — 가면의 사내가 함께 싸운다). 지면 사내가 다친 몸으로 여자를 업고 밀림으로 사라진다 (coolDays일 뒤 다시)
     ③ 이기면: 꽃집 아가씨 에이미 벨라지오 — 그리고 며칠째 자기를 「따라다닌」 가면의 사내와 티격태격. 사내는 랜던 아이작이라는 이름만 밝힌다.
        몰락한 왕가의 사생아, 이복형들의 자객, 어머니가 남긴 장미 정원과 산의 찬물을 끌어온 물레바퀴.
        제독이 함께 가자 하면 — 에이미는 장미를 살릴 서늘한 땅과 책을 찾아, 랜던은 자객이 정원을 찾아냈기에(그리고 말은 안 하지만 저 여자가 또 짐승에게 쫓길까 봐) 배에 오른다.
        두 사람은 아직 연인이 아니다. (기념품: 짐승 가면의 엄니 한 쌍)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/bb_mask · bb_river · bb_rescue · bb_garden — images/legend-events/BEAUTYBEAST_PROMPT.md
   ■ 저장: s.beauty = { walk: 장미를 지니고 걸은 날, met, cool, done, how: 'won'|'lost'|'declined' } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var BB = G.Beauty = {};
  function K() { return G.BALANCE.beauty; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.beauty || (s.beauty = {}); }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {}; }
  function sp(id) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id) : { name: G.MATE[id].name, portrait: G.Scenes.mateSpec(id), lang: 3 }; }
  function masked() { return Object.assign({}, sp('landon'), { name: '짐승 가면의 사내' }); }   // 이름을 알기 전
  function lady() { return Object.assign({}, sp('amy'), { name: '꽃바구니의 아가씨' }); }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  function today() { return U.dateNum(S().date); }

  /** 짐 속의 장미 — 장미가 든 교역품이나 소지품의 이름 (없으면 null) */
  BB.rose = function () {
    var s = S(), c = s.fleet.cargo || {};
    for (var k in c) { var g = G.GOOD[k]; if (c[k] && c[k].q > 0 && g && (/장미/.test(g.name) || /rose/.test(k))) return g.name; }
    var its = s.player.items || [];
    for (var i = 0; i < its.length; i++) { var it = its[i], d = G.ITEM[it.id] || {}; var nm = R.itemName ? R.itemName(it) : d.name || ''; if (/장미/.test(nm || '') || /rose/.test(it.id || '')) return nm || d.name; }
    return null;
  };
  /** 보르네오 섬의 뭍인가 */
  BB.borneo = function (lon, lat) {
    var b = K().box; if (!(lon >= b[0] && lon <= b[1] && lat >= b[2] && lat <= b[3])) return false;
    var t = G.Geo.terrain(lon, lat);
    return !!t && t !== 'sea' && t !== 'ice' && t !== 'snow';
  };
  BB.ready = function () {
    var s = S(); if (!s || !G.MATE.landon || !G.MATE.amy) return false;
    if (row('landon') || row('amy') || s.flags['gone_landon'] || s.flags['gone_amy']) return false;
    var o = s.beauty || {}; if (o.done) return false;
    if (today() < K().from) return false;
    return !(o.cool > s.day);
  };

  /** 뭍에서 하루를 걸을 때 (js/scenes/land.js) */
  BB.onLand = async function (lon, lat, api) {
    var s = S(); if (!s || s.loc.mode !== 'land' || !BB.ready() || !BB.borneo(lon, lat)) return false;
    var rose = BB.rose(); if (!rose) return false;
    var o = st(); o.walk = (o.walk || 0) + 1;
    if (o.walk < K().sure && !U.chance(K().chance)) return false;
    if (api && api.stop) api.stop();
    return BB.meet(rose);
  };

  BB.meet = async function (rose) {
    var s = S(), o = st(), k = K(), pc = null;
    rose = rose || BB.rose() || '장미';
    o.met = (o.met || 0) + 1; o.walk = 0;
    try {
      // ① 짐승 가면
      pc = pic('bb_mask', '짐승 가면의 사내');
      await narrate('무화과나무 뿌리가 길을 덮은 축축한 밀림. 앞서 가던 대원이 갑자기 멈춰 섰다. 덩굴 사이로 사람보다 머리 하나는 큰 그림자가 길을 막고 있다. 멧돼지 엄니가 솟은 곰 가죽 가면 — 가면 아래로 뜨거운 숨이 새어 나온다.');
      await UI.say('짐승이냐, 사람이냐! 총을 겨눠라!', first());
      await UI.say('…총을 내리시오. (가면이 고개를 돌려 짐 꾸러미 쪽으로 코를 킁킁거린다) 이 냄새… 장미요. 그대들 짐 속에 장미가 있군.', masked());
      await narrate('「' + rose + '」— 짐 속에 넣어 둔 것이다. 사내는 그 냄새를 맡자 한 걸음 물러서더니, 커다란 손을 펴 보였다.');
      await UI.say('장미를 지닌 사람은 내 어머니 정원의 손님이오. 해치지 않소. 그러니 부탁하오 — 저 아래 강가에서 여자 하나가 짐승들에게 쫓기고 있소. 멧돼지 떼에 큰 곰까지. 나 혼자서는 다 막지 못하오. 서두르시오!', masked());
      if (pc) { await pc.stop(); pc = null; }
      var v = await UI.ask('짐승 가면의 사내가 강가 쪽을 가리킨다. 어떻게 할까?', [
        { label: '사내를 따라 강가로 달려간다', value: 'help', icon: 'sword' },
        { label: '가면을 쓴 자를 믿을 수 없다 — 물러선다', value: 'no', icon: 'boot' }
      ], Object.assign(me(), { cancel: false }));
      if (v !== 'help') {
        await UI.say('…(가면 아래에서 낮게 으르렁거리는 소리가 났다) 장미를 지닌 사람도 결국 겉모습을 보는군.', masked());
        await narrate('사내는 덩굴을 헤치고 혼자 강가 쪽으로 사라졌다. 멀리서 짐승의 비명과 여자의 외침이 섞여 들리다가, 이윽고 조용해졌다.');
        o.cool = s.day + (k.coolDays || 45); o.how = 'declined';
        G.State.log('보르네오 밀림에서 짐승 가면을 쓴 사내가 도움을 청했지만 믿지 못하고 물러섰다.');
        return false;
      }
      // ② 강가의 짐승 떼
      pc = pic('bb_river', '강가의 짐승 떼');
      await narrate('물안개 낀 강가. 꽃모종이 쏟아진 바구니를 끌어안은 젊은 여자가 커다란 바위를 등지고 서 있다. 멧돼지 떼가 엄니를 들이밀고, 그 뒤에서 가슴에 흰 달무늬가 있는 큰 말레이곰이 일어선다. 강물 속에서는 악어 등이 소리 없이 미끄러진다.');
      await UI.say('오, 오지 마! 저리 가!', lady());
      await UI.say('내가 곰을 맡겠소! 그대들은 멧돼지를!', masked());
      if (pc) { await pc.stop(); pc = null; }
      var L = G.Scenes && G.Scenes.land, res = 'win';
      if (L && L.landBattle) res = await L.landBattle('강가의 짐승 떼', k.beasts || 9, true, { kind: 'beast', beast: ['boar', 'bear'], leader: '큰 말레이곰', flee: false });
      if (res !== 'win') {
        await narrate('짐승 떼에 밀려 대원들이 흩어졌다. 그 틈에 가면의 사내가 곰과 뒤엉켜 강가를 구르더니, 피투성이가 된 채 여자를 어깨에 들쳐 업고 밀림 속으로 달려 사라졌다. 바위 밑에는 짓밟힌 장미 모종만 남았다.');
        o.cool = s.day + (k.coolDays || 45); o.how = 'lost';
        G.State.log('보르네오 강가에서 짐승 떼에 쫓기는 여자를 구하려 했지만 밀려났다. 짐승 가면의 사내가 그녀를 업고 밀림으로 사라졌다.');
        return false;
      }
      // ③ 구했다 — 그리고 티격태격
      pc = pic('bb_rescue', '꽃바구니의 아가씨');
      await narrate('마지막 멧돼지가 덤불로 꽁무니를 빼고, 말레이곰이 가면의 사내에게 떠밀려 강물로 첨벙 넘어지더니 허둥지둥 건너편으로 달아났다. 사내의 가면에서 엄니 하나가 부러져 진흙에 박혔다.');
      await UI.say('가, 감사합니다… 정말 죽는 줄 알았어요. 저는 에이미, 에이미 벨라지오예요. 브루나이 항구에서 작은 꽃집을 해요.', lady());
      await UI.say('장미가 이 더위에 자꾸 시들어서요. 산 위 서늘한 숲에 열대에서도 피는 장미 정원이 있다는 이야기를 책에서 읽고 왔는데… (그러다 가면의 사내를 보고 바구니를 꼭 끌어안는다) 다, 당신! 며칠째 저를 따라다니던 그 가면이죠!', sp('amy'));
      await UI.say('따라다닌 게 아니오. 지켜본 거요. 그 정원은 내 어머니의 것이고, 이 숲은 짐승이 많소. 아가씨처럼 겁 없이 들어오는 사람은 처음이라.', masked());
      await UI.say('지켜봤다고요? 그게 따라다닌 거예요! 그리고 저는 겁이 없는 게 아니라 장미 접붙이기 할 대목이 필요했던 거예요!', sp('amy'));
      await UI.say('…제독님, 저분들 원래 아는 사이입니까?', first());
      await UI.say('(가면 아래로 한숨 소리) 랜던 아이작. 이름은 그것뿐이오. 얼굴은 보여 줄 수 없소.', sp('landon'));
      if (pc) { await pc.stop(); pc = null; }
      // 어머니의 정원
      pc = pic('bb_garden', '밀림 속 장미 정원');
      await narrate('랜던은 일행을 산허리의 무너진 돌집으로 데려갔다. 담장 안은 딴 세상이었다. 대나무 홈통을 따라 산의 찬물이 흐르고, 물레바퀴가 삐걱이며 그늘막에 물안개를 뿜는다. 그 아래 붉고 흰 장미가 열대의 한복판에서 피어 있다.');
      await UI.say('…세상에. 이 더위에 장미가. 물을 끌어다 땅을 식힌 거예요? 이런 건 어느 식물지에도 없었어요.', sp('amy'));
      await UI.say('어머니가 심었고, 나는 물만 끌어왔소. 어머니는 바다 건너 어느 왕의 사랑을 받았지만 왕비는 아니었소. 왕가가 무너지자 이복형들은 왕의 피가 섞인 나를 지우려 했지. 그래서 이 섬까지 왔고, 이 가면을 썼소. 짐승보다 사람을 쫓기 위해서요.', sp('landon'));
      await UI.say('그런데 이제 그것도 끝이오. 지난달 브루나이 항구에 형들이 보낸 자들이 나타났소. 이 정원도 곧 찾아낼 거요.', sp('landon'));
      await UI.say('…그럼 둘 다 우리 배에 타지 않겠소? 바다는 넓고, 배 위에서는 아무도 가면을 묻지 않소. 장미를 살릴 서늘한 땅도, 책이 쌓인 항구도 많지.', me());
      await UI.say('정말요? 아버지가 남긴 책 상자도 실을 수 있다면요. 장부라면 제가 봐 드릴게요 — 꽃집 장부보다는 덜 슬프겠죠.\f…그런데 저 사람도 같이 가요?', sp('amy'));
      await UI.say('(팔짱을 끼며) 저 아가씨가 또 짐승한테 쫓기면 누가 구하겠소. 그리고 그대의 배에는 밧줄 당길 팔이 모자라 보이오. 물레바퀴를 만든 손이니 쓸모는 있을 거요.', sp('landon'));
      await UI.say('흥, 누가 구해 달랬나요. …뭐, 배는 넓으니까요.', sp('amy'));
      if (pc) { await pc.stop(); pc = null; }
      // 동료가 된다
      var c = G.CITY_DATA[k.city];
      ['landon', 'amy'].forEach(function (id) {
        var nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null;
        if (!nm) { nm = { id: id, role: 'none', joined: today(), loyal: k.loyal || 80 }; s.mates.push(nm); }
        nm.loyal = Math.max(nm.loyal || 0, k.loyal || 80);
      });
      var got = R.addItem ? R.addItem('beast_mask') !== false : false;
      o.done = s.day; o.how = 'won';
      var so = G.Fame ? G.Fame.add('so', 60) : 0;
      G.State.log('보르네오 밀림에서 짐승 가면을 쓴 몰락한 왕가의 사생아 랜던 아이작을 도와, 짐승 떼에 쫓기던 브루나이의 꽃집 아가씨 에이미 벨라지오를 구했다. 두 사람이 동료가 되었다 — 아직은 티격태격하는 사이다. (사교 명성 +' + so + ')');
      UI.toast('랜던 아이작(과학·운용술 3)과 에이미 벨라지오(회계·역사학·신학 3)가 동료가 되었다' + (got ? ' · ' + G.ITEM.beast_mask.name : ''), 'heart', 5600);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire('landon'); await G.Achieve.afterHire('amy'); } catch (e) { console.error(e); } }
      if (G.Game.refreshHud) G.Game.refreshHud();
      return true;
    } finally { if (pc) await pc.stop(); }
  };
})(window.G = window.G || {});
