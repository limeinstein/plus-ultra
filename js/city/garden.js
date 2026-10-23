/* 왕실 정원 (G.Garden) — 군주의 왕궁 안에 있는 정원. 2026-10-21 사용자 요청
   · 식물(생물 발견물 가운데 나무·꽃·풀)과 식물 유물(씨앗·묘목·분재)은 박물관·미술관·동물원이 아니라 여기에 바친다 (규칙: js/systems/court.js — isPlant·plantItem·gardenPlants)
   · 왕궁 메뉴 「왕실 정원」 → 정원사가 맞는다 → 「정원을 거닌다」(바친 식물을 그림과 함께) · 「식물을 바친다」
   · 왕명 「왕실 정원 가꾸기」를 이 군주에게서 맡았으면, 여기서 넘긴 식물이 왕명으로 셈해지고 다 넘기면 군주가 정원으로 나와 작위를 내린다 (G.Court.report)
   · 왕명이 없을 때(또는 다른 군주의 왕명일 때) 바치면 한 종마다 사교 명성과 그 군주의 신뢰가 오른다 (박물관 기증과 같은 값)
   · 저장: s.court.garden[나라] = {city, sp, y, ids:[발견 id], items:[유물 기록], open, don} · s.court.gardenUsed[발견 id] */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var GD = G.Garden = {};
  function S() { return G.Game.state; }
  function CT() { return G.Court; }
  function C() { return G.Scenes.city; }
  function rec(realm) { return CT().state().garden[realm.id] || null; }
  function count(g) { return g ? g.ids.length + g.items.length : 0; }
  function myTask(sp) { var t = CT().task(); return t && t.kind === 'garden' && t.sp === sp.id ? t : null; }
  var GARDENER_GENDER = { ib: 'f', ne: 'm', it: 'm', gr: 'f', ru: 'm', is: 'f', pe: 'f', af: 'm', sw: 'f', in: 'm', se: 'f', cn: 'm', kr: 'f', jp: 'm', az: 'f', an: 'm', co: 'm', tr: 'm', st: 'f', na: 'f' };
  /** 지역 복식과 작업 도구가 보이는 전용 정원사. 얼굴상·무릎상은 같은 원화에서 만든 짝을 쓴다. */
  function gardener() {
    try {
      var c = C().city(), style = G.Img.folkStyle(c), g = GARDENER_GENDER[style] || 'm';
      var role = g === 'f' ? 'maid' : 'soldier', key = 'portraits/gardeners/' + style + '/gardener';
      var who = C().npc('gardener', '왕실 정원사');
      who.portrait = A.withImg(A.npcSpec('royal-gardener:' + c.id, role, style, g), [key, 'portraits/npc-roles/' + style + '/' + role]);
      who.half = [key + '_half', 'portraits/npc-roles/' + style + '/' + role + '_half'];
      return who;
    } catch (e) { return { name: '왕실 정원사', lang: 3 }; }
  }
  function discPic(d) { var k = G.Img && G.Img.pick ? G.Img.pick(G.Img.chain.discovery(d)) : null; return k ? G.Img.src(k) : null; }
  function regName(d) { return d.reg != null && G.REGIONS[d.reg] ? (G.Disc && G.Disc.regName ? G.Disc.regName(d) : G.REGIONS[d.reg]) || G.REGIONS[d.reg] : '먼 땅'; }   // 동아시아는 「동아시아 · 조선 / 중국」 (2026-10-23)

  /** 왕궁 메뉴의 한 줄 */
  GD.menuItem = function (sp, realm) {
    var g = rec(realm), t = myTask(sp), have = CT().gardenPlants().length, sub;
    if (t) sub = '왕명 — 바친 식물 ' + Math.min(t.got || 0, t.n) + '/' + t.n + '종';
    else if (have) sub = '바칠 수 있는 식물 ' + have + '종' + (count(g) ? ' · 자라는 것 ' + count(g) + '종' : '');
    else sub = count(g) ? '제독이 바친 식물 ' + count(g) + '종이 자란다' : '';
    return { label: '왕실 정원', icon: 'leaf', sub: sub, onClick: function () { return GD.visit(sp); } };
  };

  /** 정원에 들어선다 */
  GD.visit = async function (sp) {
    var realm = CT().realmOf(sp); if (!realm) return;
    var who = gardener(), g = rec(realm), me = S().player.name, t = myTask(sp);
    var first = g && g.ids.length ? G.DISC[g.ids[g.ids.length - 1]] : null;
    await UI.say(count(g)
      ? '어서 오십시오, ' + me + ' 제독. ' + (first ? '제독께서 주신 「' + first.name + '」' + U.jx('「' + first.name + '」', '이/가') + ' 이 땅의 흙에도 뿌리를 내렸습니다. ' : '제독께서 주신 씨앗과 묘목이 잘 자라고 있습니다. ') + '전하께서도 저녁마다 거닐며 보십니다.'
      : '왕실 정원에 오신 것을 환영합니다, 제독. 아직은 이 땅의 장미와 회양목, 약초밭뿐이지요.\f먼 땅에서 처음 보는 나무나 꽃을 찾으시거든, 그 씨앗이나 그림과 기록을 가져다주십시오. 이 정원에 심어 가꾸겠습니다.', who);
    if (t) await UI.say('전하께서 정원에 심을 식물을 제독께 부탁하셨다 들었습니다. 지금까지 ' + Math.min(t.got || 0, t.n) + '종, 앞으로 ' + Math.max(0, t.n - (t.got || 0)) + '종입니다.', who);
    for (;;) {
      g = rec(realm); t = myTask(sp);
      var have = CT().gardenPlants().length;
      var v = await UI.choose('왕실 정원', [
        { value: 'walk', icon: 'eye', label: '<b>정원을 거닌다</b><br><small class="muted">' + (count(g) ? '제독이 바친 식물 ' + count(g) + '종' : '아직 제독이 바친 식물이 없다') + '</small>' },
        { value: 'give', icon: 'leaf', label: '<b>' + (t ? '왕명 — 식물을 바친다' : '식물을 바친다') + '</b><br><small class="muted">' + (have ? '바칠 수 있는 것 ' + have + '종 (찾아낸 식물 · 씨앗·묘목·분재)' : '지금 바칠 식물이 없다') + '</small>', right: t ? Math.min(t.got || 0, t.n) + '/' + t.n : '' }
      ], { width: 640, icon: 'leaf', text: '식물은 박물관·동물원이 아니라 이곳 왕실 정원에 심습니다.' });
      if (!v) return;
      if (v === 'walk') await GD.show(sp, realm);
      else { var r = await GD.give(sp, realm, who); if (r === 'done') return; }
    }
  };

  /** 정원을 거닌다: 바친 식물 카드 */
  GD.show = function (sp, realm) {
    var g = rec(realm);
    if (!count(g)) return UI.say('정원 가운데 빈 화단이 하나 있습니다. 제독께서 가져오실 먼 땅의 식물을 위해 비워 두었지요.', gardener());
    var cards = g.ids.map(function (id) { var d = G.DISC[id]; return d ? { src: discPic(d), name: d.name, meta: '먼 땅의 식물 · ' + regName(d), desc: d.desc || '' } : null; }).filter(Boolean)
      .concat(g.items.map(function (x) { var dd = x.disc && G.DISC[x.disc]; return { src: CT().exhibitSrc(x), name: x.name, meta: '씨앗·묘목' + (dd ? ' · ' + dd.name : '') + (x.dy ? ' · ' + x.dy + '년' : ''), desc: x.desc || '' }; }));
    var html = '<div class="mu-sub muted">' + U.esc(G.CITY_DATA[g.city] ? G.CITY_DATA[g.city].name : '') + ' 왕궁 · ' + (g.y || '') + '년부터 ' + U.esc(S().player.name) + ' 제독이 바친 식물 ' + cards.length + '종</div><div class="mu-grid">' + cards.map(function (x) {
      return '<div class="mu-card"><div class="mu-pic">' + (x.src ? '<img alt="" src="' + x.src + '">' : G.icon('leaf')) + '</div>' +
        '<div class="mu-name">' + U.esc(x.name) + '</div><div class="mu-meta">' + U.esc(x.meta) + '</div><div class="mu-desc">' + U.esc(x.desc) + '</div></div>';
    }).join('') + '</div>';
    return UI.window({ title: realm.name + ' 왕실 정원', icon: 'leaf', width: 1040, html: html, buttons: [{ label: '돌아간다', value: true, cls: 'navy' }] }).result;
  };

  /** 식물을 바친다 — 한 종씩. 왕명을 다 채우면 'done' (군주의 서임까지 마친 뒤) */
  GD.give = async function (sp, realm, who) {
    var c = CT().state(), s = S(), n = 0;
    for (;;) {
      var t = myTask(sp), left = CT().gardenPlants();
      if (!left.length) {
        if (!n) await UI.say('지금은 바치실 식물이 없으시군요. 먼 땅의 나무나 꽃을 찾아내시거나, 발견한 자리에서 씨앗이나 묘목을 가져오시면 그때 심겠습니다.', who);
        return n;
      }
      var opts = left.map(function (x) {
        if (x.d) return { value: x, icon: discPic(x.d) ? { src: discPic(x.d), icon: 'leaf' } : 'leaf', label: '<b>' + U.esc(x.d.name) + '</b><br><small class="muted">찾아낸 식물 · ' + U.esc(regName(x.d)) + ' — 그림과 기록을 넘기면 사람을 보내 옮겨 온다</small>' };
        var src = G.Img && G.Img.itemSrc ? G.Img.itemSrc(x.it) : null;
        return { value: x, icon: src ? { src: src, icon: 'leaf' } : 'leaf', label: '<b>' + U.esc(R.itemName(x.it)) + '</b><br><small class="muted">씨앗·묘목 (소지품)</small>' };
      });
      var v = await UI.choose('왕실 정원에 바친다' + (t ? ' — 왕명 ' + Math.min(t.got || 0, t.n) + '/' + t.n + '종' : n ? ' (' + n + '종 바침)' : ''), opts, { width: 760, icon: 'leaf',
        text: t ? '정원사에게 넘긴 식물이 왕명으로 셈해집니다. ' + t.n + '종을 채우면 군주가 정원으로 나옵니다.' : '바친 식물은 이 정원에 심어집니다. 돈은 받지 않지만 한 종마다 사교 명성이 오르고 군주의 신뢰가 쌓입니다.' });
      if (!v) return n;
      var g = c.garden[realm.id] || (c.garden[realm.id] = { city: sp.city, sp: sp.id, y: s.date.y, ids: [], items: [] });
      if (g.open == null) g.open = count(g);
      var nm;
      if (v.d) { c.gardenUsed[v.d.id] = 1; g.ids.push(v.d.id); nm = v.d.name; }
      else { R.removeItemObject(v.it); var ex = CT().exhibitOf(v.it); ex.dy = s.date.y; g.items.push(ex); nm = R.itemName(v.it); }
      n++;
      if (t) {
        t.got = (t.got || 0) + 1;
        G.State.log('왕실 정원에 「' + nm + '」' + U.jx('「' + nm + '」', '을/를') + ' 바쳤다 (왕명 ' + Math.min(t.got, t.n) + '/' + t.n + ')');
        await UI.say(U.pick(['「' + nm + '」… 이런 잎은 처음 봅니다. 해가 잘 드는 남쪽 화단에 심겠습니다.', '「' + nm + '」이라니요! 흙부터 새로 골라야겠습니다. 정성껏 가꾸겠습니다.']) + (t.got < t.n ? '\n(왕명 ' + t.got + '/' + t.n + '종)' : ''), who);
        if (t.got >= t.n) {
          await UI.say('정원 저편에서 시종들이 길을 연다. ' + G.Sponsor.holderName(sp) + U.jx(G.Sponsor.holderName(sp), '이/가') + ' 몸소 정원으로 나왔다.', {});
          await CT().report(sp);
          return 'done';
        }
      } else {
        g.don = (g.don || 0) + 1;
        var got = CT().donateReward(g, 1);
        G.State.log('왕실 정원에 「' + nm + '」' + U.jx('「' + nm + '」', '을/를') + ' 바쳤다' + (got ? ' (사교 명성 +' + got + ')' : ''));
        await UI.say(U.pick(['「' + nm + '」… 전하께서 무척 기뻐하시겠습니다. 가장 좋은 자리에 심겠습니다.', '먼 땅의 「' + nm + '」' + U.jx('「' + nm + '」', '이/가') + ' 이 정원에서 자라게 되다니요. 고맙습니다, 제독.']) + (got ? '\n(사교 명성 +' + got + ')' : ''), who);
      }
      if (G.Game.refreshHud) G.Game.refreshHud();
    }
  };
})(window.G = window.G || {});
