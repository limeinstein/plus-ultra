/* 세키가하라 전투·에도 막부 성립 (G.Sekigahara) 2026-11-01 사용자 요청
   사람·소지품·조정값: js/data/sekigahara.js (G.HIST_FIG sk_* · sekigahara_shuin · sekigahara_globe · G.BALANCE.sekigahara)
   날짜는 게임의 양력이다 (세키가하라 1600.10.21 · 이에야스 쇼군 1603.3.24)
   ■ ① 리프데호의 항해사 (1600.5.1~9.30, 사카이): 분고에 표착한 네덜란드 배 리프데호 — 오사카 성에서 이에야스가 잉글랜드인 항해사 윌리엄 애덤스를 심문한다.
        예수회 통역이 「해적」이라 몰아세운다 → 제독이 (가) 변호한다 (나) 입을 다문다 (다) 해적이라 거든다.
        이에야스가 세상의 모양을 묻고, 리프데호의 대포를 다룰 포수를 청한다 → 가르친다(동군 편) / 사양
   ■ ② 미쓰나리의 부름 (1600.8.1~10.20, 사카이·쿄토): 이에야스가 우에스기를 치러 동쪽으로 간 사이 이시다 미쓰나리가 거병 — 후시미 성이 떨어졌다.
        서군에 선다(금화) / 동군(이에야스) 편에 선다 / 어느 편에도 서지 않는다
   ■ ③ 세키가하라 (1600.10.1~11.15, 뭍 — 쿄토에서 북동쪽 136.43, 35.37): 안개 낀 새벽
        동군: 정오, 마쓰오산의 고바야카와가 움직이지 않는다 — 「그 진에 총을 쏘아라」(문철포) → 고바야카와가 서군을 친다 → 육상전
        서군: 미쓰나리의 봉화 — 제독이 마쓰오산으로 달려가 고바야카와를 붙잡는다(웅변) → 그래도 배신 → 육상전 → 시마 사콘의 마지막 돌격 · 무너진 서군 속의 젊은 검객 무사시 (동료)
        이기든 지든 역사는 그대로 — 동군이 이긴다
   ■ ④ 에도 막부 (1603.3.24~1606.12.31, 에도·사카이·쿄토): 쇼군이 된 이에야스 — 주인장(朱印状)을 내린다 (동군 공짜 · 중립·서군은 값 · 애덤스를 변호했으면 절반)
   ■ 소식: 리프데호 표착(1600.4.19) · 후시미 성 함락(9.8) · 세키가하라(10.21) · 미쓰나리 처형(11.6) · 에도 막부(1603.3.24) · 미우라 안진(1605)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/sekigahara_*.webp
   ■ 저장: s.sekigahara = { adams: 'defend'|'quiet'|'accuse', teach, side: 'east'|'west'|'none', turned, battle, shot, persuade, musashi, shogun, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var SK = G.Sekigahara = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.sekigahara) || {}; }
  var SAKAI = 192, KYOTO = 193, EDO = 297;
  var D = SK.D = { adamsFrom: 16000501, adamsTo: 16000930, sideFrom: 16000801, sideTo: 16001020, battleFrom: 16001001, battleTo: 16001115, shogun: 16030324, shogunTo: 16061231 };
  var NEWS_AT = { liefde: 16000419, fushimi: 16000908, battleNews: 16001021, mitsunari: 16001106, shogunNews: 16030324, anjin: 16050601 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.sekigahara) {
      s.sekigahara = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.sekigahara.told[k] = 1; });   // 옛 저장
    }
    if (!s.sekigahara.told) s.sekigahara.told = {};
    return s.sekigahara;
  }
  SK.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var MESSENGER = { name: '서군의 사자', lang: 3 }, ASHIGARU = { name: '아시가루', lang: 3 };
  var WHO = { P: me, F: first, M: function (e) { return mateSp('h_musashi', e); } };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w && WHO[w] ? WHO[w](l[2]) : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function battleOf(ctx) { return ctx && ctx.battle ? ctx.battle : function (nm, n, o) { return G.Scenes.land.landBattle(nm, n, false, o); }; }

  // ================================================================ 소식
  SK.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.adams || b.side), east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 120);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('liefde', east, 'ship', '【리프데호】 큐슈 분고 앞바다에 낯선 남만 배 한 척이 떠밀려 왔다. 다섯 척으로 떠난 네덜란드 선단의 마지막 배로, 살아남은 선원은 스무 명 남짓 — 서 있을 수 있는 사람은 여섯뿐이었다고 한다.');
    news('fushimi', east, 'castle', '【후시미 성】 이시다 미쓰나리가 도요토미 가문을 지킨다며 군사를 일으켜 후시미 성을 에워쌌다. 성을 지키던 도리이 모토타다가 끝까지 싸우다 죽었다. 일본이 동과 서로 갈라졌다.');
    news('battleNews', east, 'flag', b.battle
      ? '【세키가하라】 미노의 세키가하라에서 동군과 서군 십오만이 맞붙었다. 정오 무렵 마쓰오산의 고바야카와 히데아키가 서군을 치면서 싸움은 반나절 만에 끝났다. ' + (b.side === 'east' ? '이에야스의 진에서는 남만 선장의 포수들이 쏜 총소리가 고바야카와를 움직였다고 수군거린다.' : '서군의 진에서 끝까지 버틴 이방인 선장의 이름이 오사카까지 퍼졌다.')
      : '【세키가하라】 미노의 세키가하라에서 동군과 서군 십오만이 맞붙었다. 정오 무렵 마쓰오산의 고바야카와 히데아키가 서군을 치면서 싸움은 반나절 만에 끝났다. 도쿠가와 이에야스가 이겼다.');
    news('mitsunari', east, 'skull', '【로쿠조가와라】 이부키산에 숨었던 이시다 미쓰나리가 붙잡혀 교토 로쿠조가와라에서 목이 베였다. 끌려가며 목이 마르다 하자 감을 내밀었는데, 「담에 해롭다」며 먹지 않았다고 한다. 죽는 순간까지 큰 뜻을 품은 사람은 몸을 아낀다는 것이었다.');
    news('shogunNews', east, 'crown', '【에도 막부】 조정이 도쿠가와 이에야스를 정이대장군에 올렸다. 이에야스는 에도에 막부를 연다. 백 년 넘은 전국의 난세가 끝났다.' + (b.side === 'west' ? ' 세키가하라에서 서군에 섰던 다이묘들은 영지를 빼앗기거나 멀리 옮겨졌다.' : ''));
    news('anjin', met, 'scroll', '【미우라 안진】 리프데호의 잉글랜드인 항해사 윌리엄 애덤스가 쇼군에게서 사무라이의 칼 두 자루와 미우라 반도의 영지를 받았다. 이제 그는 「미우라 안진(물길잡이)」이라 불린다. 쇼군은 그를 일본 밖으로 내보내 주지 않는다고 한다.' + (b.adams === 'defend' ? ' 오사카 성에서 그를 변호해 준 선장의 이야기를 그는 지금도 한다.' : ''));
    return out;
  };

  // ================================================================ ① 리프데호의 항해사 (사카이)
  function adamsOpen() { var b = st(), t = today(); return !!(b && !b.adams && cityNow() === SAKAI && t >= D.adamsFrom && t <= D.adamsTo); }
  async function adams() {
    var b = st(), s = S(), cath = ['PT', 'ES'].indexOf(s.player.nation) >= 0;
    await withPic('sekigahara_adams', '오사카 성의 심문 (1600)', function () { return play([
      [null, '오사카 성. 다다미 넓은 방 끝에 살집 있는 노인이 앉아 있다. 그 앞에 해진 외투의 서양 사내가 무릎을 꿇었다. 분고에 떠밀려 온 네덜란드 배의 항해사라 한다.'],
      ['sk_ieyasu', '도쿠가와 이에야스요. 남만의 선장이라 들었소. 마침 잘 왔구려. 이 자의 말을 들어 보시오.'],
      ['sk_adams', '(서툰 포르투갈 말로) 윌리엄 애덤스, 잉글랜드 사람이오. 우리는 장사를 하러 왔소. 다섯 척 가운데 한 척만 살아 닿았고, 살아남은 이도 몇 되지 않소.'],
      ['sk_jesuit', '(이에야스에게) 나리, 속지 마십시오. 이자들은 하느님을 저버린 이단이고 바다를 떠도는 해적입니다. 그 배의 대포를 보십시오. 모두 십자가에 매달아야 합니다.'],
      ['sk_ieyasu', '(쥘부채를 천천히 접으며) 선장, 그대는 바다를 아는 사람이니 묻겠소. 저 자는 해적이오, 상인이오?']
    ]); });
    var v = await UI.ask('이에야스가 묻는다 — 애덤스는 해적인가?', [
      { label: '「해적이 아니라 상인이오」 — 애덤스를 변호한다', value: 'defend', icon: 'scales' },
      { label: '「바다의 일은 바다 사람도 모르는 법이오」 — 입을 다문다', value: 'quiet' },
      { label: '「신부님 말씀이 옳소」 — 해적이라 거든다', value: 'accuse', icon: 'skull' }], me());
    b.adams = v;
    if (v === 'defend') {
      var a = fame('so', 'adams');
      await play([
        ['P', '해적은 굶주린 선원 스무 명을 데리고 반년을 떠돌지 않소. 저 배는 짐칸 가득 모직과 상아를 싣고 왔다 들었소. 장사꾼이오. 신부님이 미워하는 것은 해적이 아니라 다른 나라 사람이겠지요.'],
        ['sk_jesuit', '(얼굴이 붉어지며) …' + (cath ? '같은 하느님을 믿는 분이 이 무슨 말씀이오!' : '이교도가 이교도를 감싸는구려.')],
        ['sk_ieyasu', '흐흐. 남만 사람끼리도 사이가 나쁘구려. 좋소, 그것만 알아도 이 심문은 쓸모가 있었소.'],
        ['sk_adams', '(제독에게 작게) 고맙소, 선장. 목숨 하나를 빚졌소. …이것을 받아 주시오. 배에서 건진 지구의의 받침이오. 저 노인이 세상 모양을 물을 때 썼지.']
      ]);
      give('sekigahara_globe');
      log('오사카 성에서 리프데호의 항해사 윌리엄 애덤스를 해적이 아니라고 변호했다. (사교 명성 +' + a + ')');
    } else if (v === 'quiet') await play([['sk_ieyasu', '…신중한 사람이구려. 나도 그런 사람을 좋아하오.']]);
    else await play([['sk_adams', '(제독을 한참 바라보다가) …그렇게 말하리라 생각했소.'], ['sk_ieyasu', '흠. 그런데 해적이라기엔 말이 너무 정직하군. 저 자는 내가 데리고 있겠소.']]);
    await play([
      ['sk_ieyasu', '애덤스가 그러더군. 지구는 둥글고, 바다를 따라 서쪽으로 가면 동쪽에서 돌아온다고. 그대 배도 그렇게 왔소?'],
      ['sk_ieyasu', '그리고 하나 더. 저 배에는 대포가 열아홉 문 있소. 일본에는 저것을 제대로 쏠 줄 아는 사람이 드물지. 머지않아 동쪽에서 싸움이 있을 것이오. 그대의 포수들이 내 사람들에게 쏘는 법을 가르쳐 주겠소?']
    ]);
    var w = await UI.ask('이에야스가 포수를 청한다', [
      { label: '가르쳐 준다 — 이에야스(동군) 편에 선다', value: 'teach', icon: 'cannon' },
      { label: '「일본의 싸움에는 끼지 않겠소」', value: 'no' }], me());
    b.teach = w === 'teach' ? 1 : 0;
    if (b.teach) {
      b.side = 'east';
      if (G.Growth && G.Growth.once) G.Growth.once('sekigahara_teach', 'mar', 1, '리프데호의 대포를 다루는 법을 일본 포수들에게 가르쳤다');
      await play([[null, '열흘 동안 제독의 포수들이 오사카 성 밖 강가에서 리프데호의 컬버린포를 쏘았다. 굉음이 날 때마다 아시가루들이 귀를 막고 엎드렸다.'], ['sk_ieyasu', '좋소. 싸움이 나면 부르겠소. 동쪽 미노의 들판일 것이오.']]);
      G.Game.passDays(10);
      log('도쿠가와 이에야스의 청으로 리프데호의 대포를 일본 포수들에게 가르쳤다 — 동군 편에 섰다.');
    } else await play([['sk_ieyasu', '그렇다면 구경이나 하시오. 머지않아 볼만한 구경거리가 생길 테니.']]);
    refresh();
  }

  // ================================================================ ② 미쓰나리의 부름 (사카이·쿄토)
  function sideOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.called && (c === SAKAI || c === KYOTO) && t >= D.sideFrom && t <= D.sideTo); }
  async function side() {
    var b = st(), s = S(), k = K(); b.called = 1;
    await withPic('sekigahara_mitsunari', '오사카 성의 미쓰나리 (1600)', function () { return play([
      [null, '이에야스가 우에스기를 치러 동쪽으로 떠난 사이, 오사카에 「대일대만대길(大一大万大吉)」의 깃발이 섰다. 후시미 성이 불탄다는 소식에 거리가 술렁인다.'],
      [MESSENGER, '이시다 지부쇼 님께서 남만의 선장을 찾으십니다. 함께 가 주시지요.'],
      ['sk_mitsunari', '이시다 미쓰나리요. 태합 전하께서 돌아가시며 어린 히데요리 님을 우리 다섯 봉행과 다섯 다이로에게 맡기셨소. 그런데 이에야스는 약조를 하나씩 어기며 천하를 제 것으로 삼으려 하오.'],
      ['sk_mitsunari', b.side === 'east' ? '그대가 이에야스의 포수를 가르쳤다는 말은 들었소. 그래도 묻겠소. 의리를 아는 사람이라면 — 이 미쓰나리의 편에 서 주시오.' : '그대의 배와 포수가 필요하오. 의리를 아는 사람이라면 — 이 미쓰나리의 편에 서 주시오.'],
      ['sk_sakon', '(뒤에서 창을 짚고) 주군은 사람 마음을 사는 데 서투르시오. 그러나 거짓은 말하지 않으시오. 이 늙은이가 보증하오.']
    ]); });
    var opts = [{ label: '서군에 선다 (금화 ' + U.num(k.westGold || 3000) + '닢)', value: 'west', icon: 'flag' }];
    opts.push({ label: b.side === 'east' ? '「나는 이에야스와 약조했소」 — 동군에 남는다' : '이에야스(동군) 편에 서겠다고 한다', value: 'east', icon: 'boot' });
    opts.push({ label: '어느 편에도 서지 않는다', value: 'none' });
    var v = await UI.ask('미쓰나리가 서군에 서 달라고 한다', opts, me());
    if (v === 'west') {
      if (b.side === 'east') b.turned = 1;
      b.side = 'west'; s.player.gold += k.westGold || 3000;
      await play([['sk_mitsunari', '고맙소. 싸움은 미노의 세키가하라가 될 것이오. 시월 중순, 그 들판에서 만납시다.'], ['F', '제독, 세키가하라는 교토에서 북동쪽으로 뭍길입니다.']]);
      log('이시다 미쓰나리의 서군에 섰다. (금화 +' + U.num(k.westGold || 3000) + ')');
    } else if (v === 'east') {
      b.side = 'east';
      await play([['sk_mitsunari', '…그렇구려. 의리보다 이길 편을 고르는 사람이 이리도 많으니.'], ['sk_sakon', '(웃으며) 그럼 들판에서 봅시다, 선장. 이 늙은이의 창끝을 기억해 두시오.'], ['F', '제독, 이에야스의 군은 미노의 세키가하라로 모입니다. 교토에서 북동쪽 뭍길입니다.']]);
      log('미쓰나리의 부름을 물리치고 이에야스의 동군 편에 섰다.');
    } else {
      b.side = b.side || 'none';
      if (b.side === 'none') await play([['sk_mitsunari', '바다의 사람은 땅의 싸움에 끼지 않는다라. 현명하구려. …부럽소.']]);
      else await play([['sk_mitsunari', '중립이라 하면서 이에야스의 포수를 가르쳤다지. 좋소, 들판에서 보면 알겠지.']]);
    }
    UI.toast(b.side === 'none' ? '세키가하라에 끼지 않는다' : '세키가하라로 — 교토에서 북동쪽 (10월)', 'map', 5000);
    refresh();
  }

  // ================================================================ ③ 세키가하라 (뭍)
  function fieldDue(lon, lat) {
    var b = st(), k = K(), t = today(), f = k.field || [136.43, 35.37];
    return !!(b && (b.side === 'east' || b.side === 'west') && !b.battle && t >= D.battleFrom && t <= D.battleTo && G.Geo.dist(lon, lat, f[0], f[1]) < (k.fieldR || 0.3));
  }
  SK.fieldDue = fieldDue;
  SK.onLand = async function (lon, lat, ctx) {
    if (!fieldDue(lon, lat) || SK._busy) return false;
    SK._busy = true;
    try { if (ctx && ctx.stop) ctx.stop(); await battle(ctx || {}); } catch (e) { console.error(e); }
    SK._busy = false; refresh(); return true;
  };
  async function battle(ctx) {
    var b = st(), k = K(), east = b.side === 'east';
    await withPic('sekigahara_fog', '세키가하라의 새벽 (1600.10.21)', function () { return play([
      [null, '미노의 세키가하라. 밤새 내린 비가 그치고 짙은 안개가 들판을 덮었다. 사방의 산자락에 깃발 수천 개가 젖은 채 늘어졌다. 동군 칠만, 서군 팔만.'],
      [null, '진시(오전 여덟 시) 무렵 안개가 걷히자 — 총성이 울렸다. 이이 나오마사의 붉은 갑옷 부대가 앞으로 쏟아져 나간다.']
    ]); });
    var res;
    if (east) {
      await play([
        [null, '정오. 서군은 생각보다 질기다. 오타니 요시쓰구와 우키타의 군이 동군을 밀어낸다. 남쪽 마쓰오산의 고바야카와 일만오천은 아침부터 꼼짝하지 않는다.'],
        ['sk_ieyasu', '(손톱을 깨물며) 저 애송이가… 이쪽이라고 약조해 놓고 아직도 저울질을 하는구나. 선장! 그대의 포수들을 마쓰오산 쪽으로 돌리시오. 저 진에 총을 쏘아라 — 어느 편인지 대답하라고!']
      ]);
      var v = await UI.ask('이에야스가 마쓰오산에 총을 쏘라 한다 (문철포)', [
        { label: '포수들에게 마쓰오산을 향해 쏘게 한다', value: 'shoot', icon: 'cannon' },
        { label: '「같은 편에 총을 쏠 수는 없소」 — 기다린다', value: 'wait' }], me());
      b.shot = v;
      await play(v === 'shoot'
        ? [[null, '탕, 탕, 탕! 제독의 포수들이 쏜 총소리가 마쓰오산의 숲을 울린다. 잠시 뒤 — 산 위의 깃발이 일제히 아래로 기울었다.'], ['sk_kobayakawa', '(떨리는 목소리로) 내, 내부의 적은 오타니다! 오타니의 진을 쳐라!']]
        : [[null, '이에야스의 아시가루들이 대신 쏘았다. 총소리가 마쓰오산을 울리고 — 산 위의 깃발이 일제히 아래로 기울었다.'], ['sk_kobayakawa', '(떨리는 목소리로) 오타니의 진을 쳐라!']]);
      res = await battleOf(ctx)('오타니 요시쓰구의 군', k.foe && k.foe.east || 60, { kind: 'garrison', guns: true, leader: '오타니 요시쓰구' });
    } else {
      await play([
        [null, '사사오산의 미쓰나리 본진. 서군은 생각보다 잘 버틴다. 미쓰나리가 남쪽 마쓰오산으로 공격하라는 봉화를 올린다. 그러나 고바야카와의 깃발은 움직이지 않는다.'],
        ['sk_mitsunari', '봉화가 보이지 않는단 말인가! …선장, 부탁하오. 마쓰오산으로 가 히데아키에게 말해 주시오. 태합 전하의 은혜를 잊었느냐고!']
      ]);
      var p = Math.min(0.9, (k.persuade || 0.35) + skill('speech') * 0.1);
      await UI.ask('마쓰오산으로 말을 달린다', [{ label: '고바야카와를 붙잡는다 (가망 ' + Math.round(p * 100) + '%)', value: 'go', icon: 'horse' }], me());
      b.persuade = U.chance(p) ? 'held' : 'fail';
      await play(b.persuade === 'held'
        ? [['sk_kobayakawa', '(창백한 얼굴로) 태, 태합 전하의 은혜는… 압니다. 조금만, 조금만 더 기다려 주시오.'], [null, '그 순간 동쪽에서 총소리가 마쓰오산을 울렸다. 이에야스가 보낸 「묻는 총소리」였다. 젊은 다이묘의 얼굴이 하얗게 질린다.'], ['sk_kobayakawa', '…용서하시오. 오타니의 진을 쳐라!']]
        : [['sk_kobayakawa', '(눈을 마주치지 못하며) 나는… 나는 이미 정했소. 돌아가시오!'], [null, '동쪽에서 총소리가 마쓰오산을 울렸다. 산 위의 깃발이 일제히 아래로 — 서군 쪽으로 기울었다.']]);
      await play([[null, '고바야카와가 산을 내려와 오타니의 진을 덮쳤다. 그것을 본 와키자카·구쓰키·오가와·아카자 넷이 줄줄이 등을 돌렸다. 제독은 무너지는 진 한가운데로 말머리를 돌린다.']]);
      res = await battleOf(ctx)('배신한 고바야카와의 군', k.foe && k.foe.west || 70, { kind: 'garrison', guns: true, leader: '고바야카와 히데아키' });
    }
    b.battle = res === 'win' ? 'win' : 'lose';
    var bt = fame('bt', 'battle');
    if (east) {
      s_gold(k.eastGold || 3000);
      await play([
        [null, '미시(오후 두 시) — 서군이 무너졌다. 이부키산 쪽으로 깃발들이 흩어진다. 시마즈의 군만이 동군 한가운데를 뚫고 남쪽으로 빠져나갔다.'],
        ['sk_ieyasu', '(투구 끈을 매며) 이긴 뒤에야 투구 끈을 졸라매라 — 옛말이오. 선장, 그대의 총소리를 잊지 않겠소. 이것은 오늘의 몫이오.']
      ]);
      log('세키가하라에서 이에야스의 동군과 함께 싸웠다. 정오의 총소리에 고바야카와가 돌아섰고, 동군이 이겼다. (금화 +' + U.num(k.eastGold || 3000) + ' · 전투 명성 +' + bt + ')');
    } else {
      await withPic('sekigahara_sakon', '시마 사콘의 마지막 돌격', function () { return play([
        [null, '서군이 무너진다. 미쓰나리의 본진 앞에서 늙은 장수 하나가 창을 고쳐 잡는다.'],
        ['sk_sakon', '선장! 주군을 모시고 이부키산으로 가시오. 나는 여기서 동군에게 시마 사콘의 창맛을 보여 주겠소. 하하!'],
        [null, '흰 수염의 노장이 남은 군사를 이끌고 동군 한가운데로 뛰어든다. 훗날 그날 동군 병사들은 「귀신 사콘」의 목소리를 꿈에서 들었다고 한다.']
      ]); });
      await play([
        [null, '무너진 진 사이로 빠져나오는 길. 피투성이의 앳된 사내 하나가 두 자루 칼을 쥔 채 진흙 속에서 일어선다. 열일곱쯤 되어 보인다.'],
        ['M', '(숨을 몰아쉬며) …졌군. 그래도 나는 아직 지지 않았소. 미야모토 무사시라 하오. 서군의 떠돌이 졸병이었지. 당신, 이 들판에서 끝까지 말머리를 돌리지 않더군.']
      ]);
      var j = await UI.ask('젊은 검객 무사시가 길을 묻는다', [
        { label: '「내 배에 타겠나?」 — 무사시를 부하로 맞는다', value: 'yes', icon: 'sword' },
        { label: '「살아남게, 젊은이」 — 보낸다', value: 'no' }], me());
      b.musashi = j;
      if (j === 'yes' && !row('h_musashi') && G.Legend && G.Legend.join) { var m = G.Legend.join('h_musashi', G.CITY_DATA[KYOTO]); if (m) m.loyal = 85; await play([['M', '배 위에서도 칼은 칼이지. 바다 위의 승부라 — 재미있겠소.']]); }
      else if (j !== 'yes') await play([['M', '언젠가 또 보겠지. 그때는 내가 이기는 쪽에 서 있을 것이오.']]);
      log('세키가하라에서 이시다 미쓰나리의 서군에 섰다. 고바야카와의 배신으로 서군이 무너졌다.' + (b.musashi === 'yes' ? ' 무너진 진에서 젊은 검객 미야모토 무사시를 거두었다.' : '') + ' (전투 명성 +' + bt + ')');
    }
    UI.toast('세키가하라 — 동군이 이겼다', 'flag', 5000);
  }
  function s_gold(n) { S().player.gold += n; UI.toast('금화 +' + U.num(n), 'coin', 3600); }

  // ================================================================ ④ 에도 막부 (1603~)
  function shogunOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.shogun && (b.adams || b.side) && (c === EDO || c === SAKAI || c === KYOTO) && t >= D.shogun && t <= D.shogunTo); }
  async function shogun() {
    var b = st(), s = S(), k = K(), side = b.side || 'none';
    await withPic('sekigahara_edo', '에도의 쇼군 (1603)', function () { return play([
      [null, '에도. 갈대밭이던 바닷가에 해자가 파이고 성이 올라간다. 거리마다 목수와 석공이 넘친다. 막부를 연 쇼군의 사자가 제독을 부른다.'],
      ['sk_ieyasu', side === 'east' ? '왔구려, 세키가하라의 총소리. 이제 나는 쇼군이오. 그대에게 줄 것이 있소.' : side === 'west' ? '세키가하라에서 미쓰나리 편에 섰던 선장이구려. (잠시 말이 없다가) …싸움은 끝났소. 이제는 장사의 때요.' : '싸움에 끼지 않은 선장이구려. 현명했소. 이제는 장사의 때요.'],
      ['sk_ieyasu', '일본의 배든 남만의 배든, 이 붉은 인장이 찍힌 허가장을 가진 배만 바다 건너 장사를 하게 할 것이오. 주인장(朱印状)이라 하오. 난세의 왜구와 장사꾼을 가려내려는 것이지.']
    ]); });
    if (b.adams === 'defend') await play([['sk_adams', '(이에야스 곁에서, 이제는 사무라이의 옷을 입고) 선장! 나요, 애덤스. 쇼군께 그대 이야기를 했소. 오사카 성에서 내 목숨을 구한 사람이라고.']]);
    var fee = side === 'east' ? 0 : ((k.shuinFee || {})[side] || 1500);
    if (b.adams === 'defend') fee = Math.round(fee / 2);
    var got = false;
    if (fee <= 0) { got = true; s_gold(2000); await play([['sk_ieyasu', '받으시오. 그리고 이것은 세키가하라 뒤에 미처 주지 못한 몫이오.']]); }
    else {
      var v = await UI.ask('주인장을 받겠는가?', [
        { label: '예물을 바치고 받는다 (금화 ' + U.num(fee) + '닢)', value: 'pay', icon: 'coin', dis: s.player.gold < fee },
        { label: '받지 않는다', value: 'no' }], me());
      if (v === 'pay' && s.player.gold >= fee) { s.player.gold -= fee; got = true; }
    }
    b.shogun = got ? 'shuin' : 'no';
    if (got) {
      give('sekigahara_shuin');
      var so = fame('so', 'shogun');
      await play([['sk_ieyasu', side === 'west' ? '옛 적이라도 바다에서는 이 인장을 따르시오. …다만 오사카의 히데요리에게는 배를 빌려주지 마시오. 그것만은 잊지 마오.' : '이 인장이 있으면 나가사키든 사카이든 주인선으로 대접받을 것이오. 바다 건너 소식도 가끔 들려주시오.']]);
      log('에도의 쇼군 도쿠가와 이에야스에게서 주인장(朱印状)을 받았다. (사교 명성 +' + so + ')');
      UI.toast('주인장 (朱印状) — 에도 막부의 교역 허가장', 'scroll', 5600);
    } else { await play([['sk_ieyasu', '그렇다면 뜻대로 하시오. 바다는 넓으니.']]); log('에도의 쇼군 도쿠가와 이에야스를 만났다. 주인장은 받지 않았다.'); }
    refresh();
  }

  // ================================================================ 도시에 들어설 때
  var STEPS = [[adamsOpen, adams], [sideOpen, side], [shogunOpen, shogun]];
  SK.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  SK.check = async function () {
    if (SK._busy) return false; SK._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    SK._busy = false; refresh();
    return true;
  };
  SK._t = { adams: adams, side: side, battle: battle, shogun: shogun };
})(window.G = window.G || {});
