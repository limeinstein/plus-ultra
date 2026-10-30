/* 하늘과 날씨의 드문 사건 (G.JourneyEv) — 항해·육상 탐험 중 낮은 확률로 2026-10-29 사용자 요청
   「코덱스가 만든 탐험과 항해 중 발생하는 이벤트(오아시스, 별똥별, 메뚜기 등)를 낮은 확률로 — 너무 자주 발생하면 안 된다」
   그림: images/effects/events/exploration-20261029/<id>.png (4열×2행 8장면, 1774×887 — 자르는 자리는 아래 SHEETS, 같은 폴더 event_sprites.json)
   ■ 언제 일어나나 (자주 일어나지 않게 세 겹으로 막는다)
     · 항해: 바다의 하루마다 seaDaily × seaShare (바다의 우연한 사건과 같은 7%의 15% ≈ 1%) — 그 사건과 나흘 간격·실제 시간 간격(G.Pace)을 함께 쓴다 (js/scenes/sea.js crises)
     · 육상 탐험: 뭍의 우연한 만남(js/scenes/land.js — 하루 10%)이 일어날 때 landShare 확률로 대신 일어난다
     · 이 사건들끼리는 gap일 안에 다시 일어나지 않고, 같은 사건은 저마다의 cool일 안에 다시 일어나지 않는다 (일식은 몇 해에 한 번)
     → 바다에서 대략 백여 날에 한 번, 뭍에서는 탐험 대여섯 번에 한 번쯤
   ■ 사건 (조건 · 결과 — 특기가 있으면 덜 다치거나 덕을 본다)
     별똥별(바다·뭍): 소원 — 규율 +4 · 피로 −4 · 제독의 행운 +1
     은하수(먼바다·맑은 뭍): 별을 보며 쉰다 — 피로 −8, 항해술이 있으면 별자리로 둘레 바다를 다시 잰다(해도가 열린다)
     일식(어디서나, 아주 드물게): 과학·신학을 아는 사람이 있으면 기록하고 탐험 명성 +15, 없으면 겁에 질려 규율 −12
     월식(어디서나, 드물게): 과학을 아는 사람이 있으면 월식 시각으로 경도를 재 해도가 열리고 탐험 명성 +10, 없으면 규율 −6
     혹서기(더운 바다·사막·밀림의 여름): 물이 빨리 준다(바다 — 물 감소 / 뭍 — 물 값) · 피로 +8, 운용술이 덜어 준다
     혹한기(높은 위도의 겨울·설원): 피로 +8, 의학을 아는 사람이 없으면 선원 0~2명이 앓아 눕는다
     용오름(따뜻한 바다): 배 한 척이 내구력 5~12%를 잃는다(가라앉지는 않는다) — 항해술 3이면 키를 돌려 피한다
     쓰나미(지진이 잦은 바다의 먼바다, 아주 드물게): 먼바다라 배 밑으로 큰 너울이 지나갈 뿐 — 피로 +4, 해안이 걱정이다
     메뚜기떼(아프리카·아라비아·인도의 사막·초원·스텝): 대원의 식량을 갉아먹는다 — 물자를 다시 사는 금화 · 피로 +6
     오아시스: 원래 있던 사막의 오아시스 사건(js/scenes/land.js)에 그림만 띄운다 (JE.during('oasis'))
   조정값 G.BALANCE.journeyEv · 저장 s.journeyEv = {any: 마지막 날, last: {사건: 날}} (옛 저장은 처음 쓸 때 만든다) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var JE = G.JourneyEv = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.journeyEv = G.BALANCE.journeyEv || {
    seaDaily: 0.07, seaShare: 0.15, landShare: 0.15, gap: 20,   // 바다: 하루 seaDaily × seaShare (바다의 우연한 사건과 같은 7%의 15%) · 뭍: 우연한 만남(하루 10%)의 landShare
    cool: { shooting_star: 120, milky_way: 120, solar_eclipse: 1500, lunar_eclipse: 900, extreme_heat: 90, extreme_cold: 90, waterspout: 180, tsunami: 2000, locust_swarm: 365 }
  };
  function K() { return G.BALANCE.journeyEv; }
  function S() { return G.Game && G.Game.state; }
  function mem() { var s = S(); var m = s.journeyEv || (s.journeyEv = { last: {} }); m.last = m.last || {}; return m; }

  // ================================================================ 그림 — 4열×2행 시트 재생
  var XB = [0, 444, 887, 1330, 1774];
  var SHEETS = {
    oasis: { name: '오아시스', ms: 160, loop: true, pivot: 'bottom' },
    shooting_star: { name: '별똥별', ms: 100, loop: false, pivot: 'center', hold: 1.2 },
    milky_way: { name: '은하수', ms: 200, loop: true, pivot: 'center' },
    solar_eclipse: { name: '일식', ms: 230, loop: false, pivot: 'center', hold: 99 },
    lunar_eclipse: { name: '월식', ms: 230, loop: false, pivot: 'center', hold: 99 },
    extreme_heat: { name: '혹서기', ms: 140, loop: true, pivot: 'bottom' },
    extreme_cold: { name: '혹한기', ms: 120, loop: true, pivot: 'bottom' },
    waterspout: { name: '용오름', ms: 110, loop: true, pivot: 'bottom' },
    tsunami: { name: '쓰나미', ms: 120, loop: false, pivot: 'bottom', hold: 0.6, yb: [0, 465, 887] },
    locust_swarm: { name: '메뚜기떼', ms: 90, loop: true, pivot: 'bottom' }
  };
  JE.SHEETS = SHEETS;
  function key(id) { return 'effects/events/exploration-20261029/' + id; }
  function img(id) { var I = G.Img; if (!I || !I.has || !I.has(key(id))) return null; var g = I.get(key(id)); if (!g && I.want) I.want(key(id)); return g; }
  JE.preload = function (ids) { (ids || Object.keys(SHEETS)).forEach(function (id) { img(id); }); };
  /** 장면 번호 (시간 t초) */
  JE.frameAt = function (id, t) {
    var m = SHEETS[id], n = 8, i = Math.floor(t * 1000 / m.ms);
    if (m.loop) return i % n;
    var cyc = n + Math.round((m.hold || 0) * 1000 / m.ms);
    if (m.hold >= 99) return Math.min(n - 1, i);
    i = i % cyc; return i < n ? i : -1;   // 쉬는 동안은 그리지 않는다 (별똥별이 다시 떨어지기 전)
  };
  /** 한 장면을 ctx에 그린다 (w×h 창 안에) */
  JE.draw = function (ctx, id, f, w, h) {
    var m = SHEETS[id], im = img(id); if (!m || !im || f < 0) return false;
    var yb = m.yb || [0, 444, 887], col = f % 4, row = Math.floor(f / 4);
    var sx = XB[col], sy = yb[row], sw = XB[col + 1] - sx, sh = yb[row + 1] - sy;
    var k = h * 0.98 / sh, dw = sw * k, dh = sh * k, dx = (w - dw) / 2, dy = m.pivot === 'center' ? (h - dh) / 2 : h - dh;
    ctx.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh);
    return true;
  };
  var NOOP = { stop: function () { return Promise.resolve(); }, alive: false };
  var cur = null;
  function UIW() { return G.Game && G.Game.uiW ? G.Game.uiW() : 1600; }
  function UIH() { return G.Game && G.Game.uiH ? G.Game.uiH() : 900; }
  /** 대화창 바로 위에 그림을 띄운다 (사건 그림 G.EventFx와 같은 자리·모양). 그림이 없으면 아무것도 띄우지 않는다 */
  JE.show = function (id, o) {
    o = o || {};
    var m = SHEETS[id], cf = (G.FX && G.FX.sprites) || {};
    if (!m || cf.events === false || !G.Img || !G.Img.has || !G.Img.has(key(id))) return NOOP;
    var root = document.getElementById('ui'); if (!root) return NOOP;
    img(id);
    if (cur) cur.stop();
    var w = cf.eventW || 640, h = cf.eventH || 280;
    var box = document.createElement('div');
    box.className = 'eventfx bare journeyev';
    box.style.cssText = 'left:' + Math.round((UIW() - w - 20) / 2) + 'px;top:' + Math.round(UIH() - (cf.eventBottom || 205) - h - 20) + 'px';
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    box.appendChild(cv);
    var tl = document.createElement('div'); tl.className = 'eventfx-title'; tl.textContent = o.title || m.name; box.appendChild(tl);
    root.appendChild(box);
    var ctx = cv.getContext('2d'), h0 = { alive: true, id: id }, t0 = performance.now(), shown = false;
    function frame() {
      if (!h0.alive) return;
      if (!img(id)) { t0 = performance.now(); requestAnimationFrame(frame); return; }
      if (!shown) { shown = true; box.classList.add('on'); }
      ctx.clearRect(0, 0, w, h);
      try { JE.draw(ctx, id, JE.frameAt(id, (performance.now() - t0) / 1000), w, h); } catch (e) { console.warn('[하늘과 날씨]', e); h0.alive = false; return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    h0.stop = function () {
      if (!box.parentNode) return Promise.resolve();
      h0.alive = false; box.classList.remove('on'); if (cur === h0) cur = null;
      return new Promise(function (res) { setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); res(); }, 280); });
    };
    h0.box = box; h0.canvas = cv; cur = h0;
    return h0;
  };
  /** fn()이 끝날 때까지 그림을 띄워 둔다 */
  JE.during = async function (id, fn, o) { var h = JE.show(id, o); try { return await fn(); } finally { h.stop(); } };

  // ================================================================ 조건
  function loc() { return S().loc || {}; }
  function month() { return S().date.m; }
  function summer(lat) { var m = month(); return lat >= 0 ? (m >= 6 && m <= 8) : (m === 12 || m <= 2); }
  function winter(lat) { var m = month(); return lat >= 0 ? (m === 12 || m <= 2) : (m >= 6 && m <= 8); }
  function nearLand(l, r) { return G.Geo && G.Geo.isSea ? !G.Geo.isSea(l.lon, l.lat, r) : false; }
  /** 지진이 잦은 바다 (불의 고리·지중해 동쪽) */
  function seismic(l) {
    var x = l.lon, y = l.lat;
    return (x > 120 && x < 156 && y > 25 && y < 46) || (x > 95 && x < 135 && y > -12 && y < 8) || (x > -82 && x < -68 && y > -45 && y < 5) || (x > 18 && x < 30 && y > 34 && y < 41) || (x > -125 && x < -95 && y > 12 && y < 40);
  }
  function locustLand(l) { return l.lon > -20 && l.lon < 90 && l.lat > 0 && l.lat < 40; }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id), who: null }; return { lv: b.lv || 0, who: b.who || '제독' }; }
  // [사건, 바다 무게, 뭍 무게] — 조건에 맞지 않으면 0
  function table(where, terr) {
    var l = loc(), lat = l.lat || 0, alat = Math.abs(lat), sea = where === 'sea', t = terr || '';
    var clear = sea ? !nearLand(l, 2.5) : /desert|steppe|tundra|grass/.test(t);
    return [
      ['shooting_star', 3],
      ['milky_way', clear ? 3 : 0],
      ['solar_eclipse', 0.5],
      ['lunar_eclipse', 0.9],
      ['extreme_heat', sea ? (alat < 30 && summer(lat) ? 3 : 0) : (/desert|jungle/.test(t) || (alat < 35 && summer(lat) && /grass|steppe/.test(t)) ? 2.5 : 0)],
      ['extreme_cold', sea ? (alat > 45 && winter(lat) ? 3 : 0) : (/snow|tundra|ice/.test(t) || (alat > 45 && winter(lat)) ? 2.5 : 0)],
      ['waterspout', sea && alat < 35 && !winter(lat) ? 2 : 0],
      ['tsunami', sea && seismic(l) && !nearLand(l, 1.2) ? 0.3 : 0],
      ['locust_swarm', !sea && /desert|steppe|grass/.test(t) && locustLand(l) ? 4 : 0]
    ];
  }
  /** 지금 일어날 수 있는 사건 [[사건, 무게]] */
  JE.eligible = function (where, terr) {
    var s = S(), m = mem(), cool = K().cool;
    return table(where, terr).filter(function (e) {
      if (!(e[1] > 0)) return false;
      var d = m.last[e[0]]; if (d != null && s.day - d < (cool[e[0]] || 90)) return false;
      if (G.Pace && !G.Pace.ok('je:' + e[0], { noGap: true })) return false;
      return true;
    });
  };
  /** 오늘 이 사건들 가운데 하나가 일어나는가 → 사건 이름 또는 null */
  JE.roll = function (where, terr) {
    var s = S(), m = mem(); if (!s || s.regency) return null;
    if (m.any != null && s.day - m.any < K().gap) return null;
    if (!U.chance(where === 'sea' ? K().seaShare : K().landShare)) return null;
    var list = JE.eligible(where, terr); if (!list.length) return null;
    return U.weighted(list, function (e) { return e[1]; })[0];
  };
  function mark(id) { var s = S(), m = mem(); m.any = s.day; m.last[id] = s.day; if (G.Pace) G.Pace.mark('je:' + id); }

  // ================================================================ 사건
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {}; }
  function say(t, who) { return UI.say(t, who || {}); }
  function toast(t, ic) { UI.toast(t, ic || 'star', 4600); }
  function log(t) { G.State.log(t); }
  var RUN = {
    shooting_star: async function (where) {
      var s = S(), f = s.fleet, p = s.player;
      await say(where === 'sea' ? '밤 당직 중에 하늘을 가르며 별똥별 하나가 길게 떨어졌다. 갑판의 선원들이 저마다 눈을 감고 소원을 빈다.' : '야영지 불가에서 고개를 드니 별똥별 하나가 길게 꼬리를 끌며 떨어졌다. 대원들이 저마다 눈을 감고 소원을 빈다.');
      f.discipline = Math.min(100, f.discipline + 4); f.fatigue = Math.max(0, f.fatigue - 4);
      var lb = p.luck == null ? 50 : p.luck; p.luck = Math.min(99, lb + 1);
      toast('별똥별에 소원을 빌었다 — 규율 +4 · 피로 −4 · 행운 +' + (p.luck - lb), 'star');
      log('별똥별을 보았다. 모두 소원을 빌었다.');
    },
    milky_way: async function (where) {
      var s = S(), f = s.fleet, l = loc(), nav = skill('nav');
      await say((where === 'sea' ? '구름 한 점 없는 밤바다. 하늘 한가운데로 은하수가 강처럼 흐른다. 키잡이도 잠시 손을 놓고 하늘을 올려다본다.' : '맑은 밤, 하늘 한가운데로 은하수가 강처럼 흐른다. 대원들이 모닥불을 끄고 누워 별을 센다.') +
        (nav.lv ? '\n\n' + nav.who + U.jx(nav.who, '이/가') + ' 별자리로 지금 자리를 다시 잡았다.' : ''));
      var fat = Math.round(f.fatigue); f.fatigue = Math.max(0, f.fatigue - 8);
      if (nav.lv && G.State.revealChart) G.State.revealChart(l.lon, l.lat, 1 + nav.lv * 0.6);
      toast('은하수 아래 쉬었다 — 피로 −' + (fat - Math.round(f.fatigue)) + (nav.lv ? ' · 별자리로 둘레를 다시 쟀다' : ''), 'star');
      log('은하수가 흐르는 밤을 보냈다.');
    },
    solar_eclipse: async function () {
      var s = S(), f = s.fleet, sci = skill('sci'), theo = skill('theo'), wise = sci.lv ? sci : theo.lv ? theo : null;
      await say('한낮인데 해가 이지러지기 시작한다. 검은 원이 해를 갉아먹고, 하늘이 저녁처럼 어두워진다. 새들이 울음을 그치고 별이 돋는다…', first());
      if (wise) {
        await say(wise.who + ': 겁낼 것 없다! 달이 해를 가리는 것뿐이다. ' + (sci.lv ? '시각과 그림자 길이를 모두 적어 두어라. 학자들이 몹시 탐낼 기록이다.' : '하느님이 지으신 하늘의 이치일 뿐이니, 모두 기도하며 기다려라.'));
        var ex = G.Fame ? G.Fame.add('ex', 15) : 0;
        toast('일식 — ' + wise.who + U.jx(wise.who, '이/가') + ' 선원들을 달래고 기록했다 (탐험 명성 +' + ex + ')', 'eye');
        log('일식을 보았다. ' + wise.who + U.jx(wise.who, '이/가') + ' 하늘의 이치를 설명하며 시각을 기록했다.');
      } else {
        f.discipline = Math.max(0, f.discipline - 12); f.fatigue = Math.min(100, f.fatigue + 5);
        await say('「세상이 끝나려나 보다!」 선원들이 무릎을 꿇고 울부짖는다. 해가 돌아온 뒤에도 수군거림이 그치지 않는다.');
        toast('일식에 선원들이 겁에 질렸다 — 규율 −12 · 피로 +5 (과학·신학을 아는 사람이 있었다면…)', 'skull');
        log('일식을 보았다. 선원들이 하늘의 벌이라며 겁에 질렸다.');
      }
    },
    lunar_eclipse: async function (where) {
      var s = S(), f = s.fleet, l = loc(), sci = skill('sci');
      await say('보름달이 한쪽부터 어두워지더니 이윽고 핏빛 구릿빛으로 물든다. 붉은 달이 ' + (where === 'sea' ? '밤바다' : '야영지') + '를 내려다본다.', first());
      if (sci.lv) {
        if (G.State.revealChart) G.State.revealChart(l.lon, l.lat, 2 + sci.lv);
        var ex = G.Fame ? G.Fame.add('ex', 10) : 0;
        await say(sci.who + ': 월식이 시작된 시각을 리스본의 천문표와 맞추면 여기가 얼마나 서쪽인지 잴 수 있다. 모래시계를 뒤집어라!');
        toast('월식 시각으로 경도를 쟀다 — 둘레 해도가 열렸다 (탐험 명성 +' + ex + ')', 'eye');
        log('월식을 보았다. ' + sci.who + U.jx(sci.who, '이/가') + ' 월식 시각으로 경도를 쟀다.');
      } else {
        f.discipline = Math.max(0, f.discipline - 6);
        toast('붉은 달에 선원들이 수군거린다 — 규율 −6', 'skull');
        log('핏빛으로 물든 월식을 보았다. 선원들이 불길하다며 수군거렸다.');
      }
    },
    extreme_heat: async function (where, terr, ctx) {
      var s = S(), f = s.fleet, ops = skill('ops'), cut = Math.max(0.3, 1 - ops.lv * 0.2);
      await say(where === 'sea' ? '돛이 축 늘어지고 갑판 널이 맨발을 데울 만큼 달아올랐다. 혹서다. 송진이 녹아 흐르고, 물통의 물이 미지근하게 줄어든다.' : '숨이 턱 막히는 더위. 땅에서 아지랑이가 피어오르고, 대원들이 그늘을 찾아 헐떡인다.');
      var fat = Math.round(8 * cut);
      f.fatigue = Math.min(100, f.fatigue + fat);
      if (where === 'sea') {
        var w = Math.min(f.water, Math.round(R.dailyUse() * U.rf(3, 5) * cut)); f.water -= w;
        toast('혹서기 — 물 ' + w + '통이 줄고 피로 +' + fat + (ops.lv ? ' (운용술로 덜었다)' : ''), 'drop');
      } else {
        var cost = ctx && ctx.dailyCost ? Math.round(ctx.dailyCost() * U.rf(0.5, 1) * cut) : 0, paid = Math.min(s.player.gold, cost); s.player.gold -= paid;
        toast('혹서기 — 물을 더 사 마셨다 (금화 ' + U.num(paid) + ') · 피로 +' + fat, 'drop');
      }
      log('혹서를 견뎠다.');
    },
    extreme_cold: async function (where, terr, ctx) {
      var s = S(), f = s.fleet, med = skill('med'), l = loc();
      await say(where === 'sea' ? '칼바람에 진눈깨비가 섞여 몰아친다. 밧줄이 얼어 손바닥에 들러붙고, 돛에 고드름이 매달린다. 혹한이다.' : '살을 에는 칼바람에 눈발이 날린다. 혹한이다. 대원들이 모포를 뒤집어쓰고 모닥불에 바싹 붙는다.');
      f.fatigue = Math.min(100, f.fatigue + 8);
      var sick = med.lv ? 0 : Math.max(0, Math.min(U.ri(0, 2), f.crew - 1, where === 'land' && l.party ? l.party - 1 : 99));
      if (sick) { f.crew -= sick; if (where === 'land' && l.party) l.party = Math.max(1, l.party - sick); }
      toast('혹한기 — 피로 +8' + (sick ? ' · 선원 ' + sick + '명이 동상과 고뿔로 쓰러졌다' : med.lv ? ' · ' + med.who + U.jx(med.who, '이/가') + ' 동상을 돌봐 아무도 쓰러지지 않았다' : ''), sick ? 'skull' : 'people');
      log('혹한을 견뎠다.' + (sick ? ' 선원 ' + sick + '명을 잃었다.' : ''));
    },
    waterspout: async function () {
      var s = S(), f = s.fleet, nav = skill('nav');
      await say('수평선 쪽 먹구름 밑에서 잿빛 기둥이 바다를 빨아올린다. 용오름이다! 물기둥이 비틀거리며 이쪽으로 다가온다!', first());
      if (nav.lv >= 3) {
        await say(nav.who + ': 키를 오른쪽 끝까지! 돛을 내려라! …비켜 갔다. 저것에 휘말렸으면 돛대가 남아나지 않았을 거다.');
        toast('용오름을 피했다 — ' + nav.who + '의 항해술', 'wind');
        log('용오름을 만났지만 ' + nav.who + U.jx(nav.who, '이/가') + ' 키를 돌려 피했다.');
        return;
      }
      var sh = U.pick(f.ships), k = U.rf(0.05, 0.12) * (1 - nav.lv * 0.2), dm = Math.round(sh.maxHp * k);
      sh.hp = Math.max(1, sh.hp - dm);
      await say('물기둥이 ' + sh.name + '호의 고물을 스치고 지나갔다! 돛이 찢기고 활대가 부러졌다.');
      toast('용오름 — ' + sh.name + '호 내구력 −' + dm + ' (항해술 3이면 피할 수 있다)', 'wind');
      log('용오름에 ' + sh.name + '호가 부서졌다.');
    },
    tsunami: async function () {
      var s = S(), f = s.fleet;
      await say('바람도 없는데 바다가 크게 부풀어 오른다. 산만 한 너울 하나가 배 밑을 조용히 지나 해안 쪽으로 밀려간다. 먼바다라 배는 들렸다 내려앉았을 뿐이다.', first());
      await say('…저 너울이 뭍에 닿으면 무슨 일이 벌어질지, 노련한 선원들은 말없이 성호를 긋는다. 땅이 흔들린 것이 틀림없다.');
      f.fatigue = Math.min(100, f.fatigue + 4);
      toast('먼바다에서 쓰나미의 너울을 만났다 — 배는 무사하다 (피로 +4)', 'drop');
      log('먼바다에서 해안으로 밀려가는 쓰나미의 너울을 보았다.');
    },
    locust_swarm: async function (where, terr, ctx) {
      var s = S(), f = s.fleet, ops = skill('ops');
      await say('지평선이 누렇게 흐려지더니 웅웅거리는 소리와 함께 메뚜기떼가 하늘을 덮는다! 대원들이 자루를 끌어안지만, 놈들은 짐 틈까지 파고들어 곡식과 마른 고기를 갉아먹는다.');
      var cost = ctx && ctx.dailyCost ? Math.round(ctx.dailyCost() * U.rf(1, 2) * Math.max(0.4, 1 - ops.lv * 0.2)) : 0, paid = Math.min(s.player.gold, cost);
      s.player.gold -= paid; f.fatigue = Math.min(100, f.fatigue + 6);
      toast('메뚜기떼가 식량을 갉아먹었다 — 물자를 다시 샀다 (금화 ' + U.num(paid) + ') · 피로 +6', 'skull');
      log('메뚜기떼를 만나 식량을 잃었다.');
    }
  };
  /** 사건 하나를 그림과 함께 (시험에서 바로 부른다) */
  JE.run = async function (id, where, terr, ctx) {
    mark(id);
    await JE.during(id, function () { return RUN[id](where, terr, ctx); });
    if (ctx && ctx.refresh) ctx.refresh();
    else if (G.Game && G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  /** 육상 탐험의 우연한 만남 자리에서 (js/scenes/land.js) — 일어났으면 true */
  JE.landDay = async function (terr, ctx) {
    var id = JE.roll('land', terr); if (!id) return false;
    return JE.run(id, 'land', terr, ctx);
  };

  // ================================================================ 바다의 하루 (js/scenes/sea.js crises — 바다의 우연한 사건 바로 앞)
  /** 일어났으면 true. 바다의 우연한 사건(하루 7%)과 같은 나흘 간격을 함께 쓴다 */
  JE.seaDay = async function (ctx) {
    var s = S(), st = ctx && ctx.st;
    if (st && st.lastEvt != null && s.day - st.lastEvt < 4) return false;
    if (!U.chance(K().seaDaily)) return false;
    var id = JE.roll('sea'); if (!id) return false;
    if (st) st.lastEvt = s.day;
    return JE.run(id, 'sea', null, ctx);
  };
  JE._RUN = RUN;
})(window.G = window.G || {});
