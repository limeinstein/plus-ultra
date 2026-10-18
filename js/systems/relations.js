/* 유럽 나라들 사이의 관계 (G.Rel) — 자료 js/data/relations.js(나라·역사 관계) · js/data/releevents.js(역사 사건). 2026-10-17
   ■ 관계 = 역사에 맞춘 기본값(G.RELATIONS.pairs) + 사건이 바꾼 값(state.rel.mod, 기한이 있다). −100 ~ 100.
     갈래: 동맹(60↑) · 우호(25↑) · 보통 · 냉랭(−25↓) · 전쟁(−60↓)
   ■ 제독의 나라(포르투갈·에스파냐)와 그 항구 주인 나라의 관계가
     · 전쟁이면: 그 나라 교역소가 문을 닫고(사고팔 수 없다), 그 나라 군함이 바다에서 덤빈다(쳐도 악명이 오르지 않는다)
     · 냉랭하면: 교역소 값이 손해(사는 값 +8%, 파는 값 −8%)
     · 우호·동맹이면: 교역이 활발 — 5%·10% 싸게 사고 비싸게 판다
   ■ 다른 나라끼리 전쟁이면 달마다 해전 소식이 들린다. 갈래가 바뀌면(전쟁이 벌어지거나 끝나면) 소식으로 알린다.
   ■ 역사 사건(이베리아 두 왕실의 혼인·향료 제도 다툼, 십자군·교황청·오스만의 일): 그날이 되면 소식과 함께 관계가 바뀐다.
     십자군 호소는 교황의 사절이 제독을 찾아와 기부를 청하고(사교 명성·교황의 신뢰), 레판토처럼 큰 해전은 그 바다로 가면 함께 싸울 수 있다.
   ■ 큰 해전(G.Rel.greatBattle): 우리 편 함대(allies)와 함께 싸운다 — 무적함대(js/systems/tudor.js)·레판토가 쓴다.
   ■ 저장: state.rel = {mod: {'키|키': {v, until, why}}, tier: {'키|키': 갈래}, seen: {사건 id: 1}, pend: [사절], battle: {id: 'won'|'lost'|…}} — 옛 저장에는 없다(쓸 때 만든다) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RL = G.Rel = {};
  function S() { return G.Game && G.Game.state; }
  function D() { return G.RELATIONS; }
  function B() { return G.BALANCE.relations; }
  function st() { var s = S(); if (!s) return null; var r = s.rel || (s.rel = {}); ['mod', 'tier', 'seen', 'battle'].forEach(function (k) { if (!r[k]) r[k] = {}; }); if (!r.pend) r.pend = []; return r; }
  function dn(d) { return d.y * 10000 + (d.m || 1) * 100 + (d.d || 1); }
  function today() { return dn(S().date); }
  function key(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  RL.key = key;

  // ================================================================ 나라
  /** 나라 이름(도시 주인·배의 나라) → 나라 열쇠 (유럽의 큰 나라가 아니면 null) */
  RL.power = function (name) { return name ? (D().alias[name] || (D().powers[name] ? name : null)) : null; };
  RL.name = function (k) { var p = D().powers[k]; if (!p) return k; if (k === 'ES' && S() && S().date.y < 1516) return '카스티야'; return p.name; };
  /** 그 해에 있는 나라들 */
  RL.powers = function (y) { y = y || S().date.y; return D().order.filter(function (k) { var p = D().powers[k]; return (!p.from || y >= p.from) && (!p.to || y < p.to); }); };
  /** 제독의 나라 */
  RL.mine = function () { var s = S(); return s && s.player ? (s.player.nation === 'ES' ? 'ES' : 'PT') : null; };
  /** 도시 주인의 나라 열쇠 */
  RL.cityPower = function (c) { return c ? RL.power(R.cityOwner(c)) : null; };

  // ================================================================ 관계
  function base(a, b, y) {
    var w = D().pairs[a + '|' + b] || D().pairs[b + '|' + a];
    if (w) for (var i = 0; i < w.length; i++) if (y >= w[i][0] && y < w[i][1]) return { v: w[i][2], why: w[i][3] || '' };
    var C = D().christian;
    if ((a === 'OT' && C.indexOf(b) >= 0) || (b === 'OT' && C.indexOf(a) >= 0)) return { v: -35, why: '십자가와 초승달' };
    return { v: 0, why: '' };
  }
  /** 두 나라의 관계 {v, why, tier, event} */
  RL.get = function (a, b) {
    if (!a || !b) return null;
    if (a === b) return { v: 100, why: '같은 나라', tier: 'ally' };
    var s = S(), y = s ? s.date.y : 1480, r = s ? st() : null, m = r && r.mod[key(a, b)];
    var x = base(a, b, y);
    if (m && (!m.until || today() < m.until)) x = { v: m.v, why: m.why || x.why, event: true };
    x.tier = RL.tier(x.v);
    return x;
  };
  RL.value = function (a, b) { var x = RL.get(a, b); return x ? x.v : 0; };
  RL.tier = function (v) { var t = B().tiers; return v >= t[0] ? 'ally' : v >= t[1] ? 'friend' : v > t[2] ? 'neutral' : v > t[3] ? 'cold' : 'war'; };
  RL.TIER = { ally: '동맹', friend: '우호', neutral: '보통', cold: '냉랭', war: '전쟁' };
  RL.atWar = function (a, b) { return RL.tier(RL.value(a, b)) === 'war' && a !== b; };
  /** 사건이 관계를 바꾼다: v(값), until(해 — 그해 1월 1일까지, 없으면 계속), why */
  RL.set = function (a, b, v, until, why) {
    var r = st(); if (!r) return;
    r.mod[key(a, b)] = { v: v, until: until ? (until > 99999 ? until : until * 10000 + 101) : 0, why: why || '' };
  };
  /** 이 나라(이름)가 제독의 나라와 전쟁 중인가 */
  RL.atWarWithMe = function (nation) { var k = RL.power(nation), me = RL.mine(); return !!(k && me && k !== me && RL.atWar(me, k)); };

  // ================================================================ 교역
  /** 이 도시의 교역소가 제독의 나라에 문을 닫았나 */
  RL.embargo = function (c) { var k = RL.cityPower(c), me = RL.mine(); return !!(k && me && k !== me && RL.atWar(me, k)); };
  /** 교역소 값의 배수: kind 'buy' | 'sell' */
  RL.priceK = function (c, kind) {
    var k = RL.cityPower(c), me = RL.mine(); if (!k || !me || k === me) return 1;
    var t = RL.get(me, k).tier, T = B().trade, d = t === 'ally' ? T.ally : t === 'friend' ? T.friend : t === 'cold' || t === 'war' ? T.cold : 0;
    return kind === 'buy' ? 1 - d : 1 + d;
  };
  /** 교역소 안내 줄 (없으면 '') */
  RL.tradeNote = function (c) {
    var k = RL.cityPower(c), me = RL.mine(); if (!k || !me || k === me) return '';
    var x = RL.get(me, k), nm = RL.name(k), my = RL.name(me), T = B().trade;
    if (x.tier === 'war') return '<div class="warn-text" style="margin-top:6px">' + my + U.jx(my, '과/와') + ' ' + nm + U.jx(nm, '은/는') + ' 전쟁 중 — 교역소가 문을 닫았습니다.</div>';
    if (x.tier === 'cold') return '<div class="warn-text" style="margin-top:6px">' + nm + U.jx(nm, '과/와') + '의 사이가 냉랭해 ' + Math.round(-T.cold * 100) + '% 손해를 보고 거래합니다.' + (x.why ? ' (' + U.esc(x.why) + ')' : '') + '</div>';
    if (x.tier === 'friend' || x.tier === 'ally') return '<div class="good-text" style="margin-top:6px">' + nm + U.jx(nm, '과/와') + ' ' + RL.TIER[x.tier] + ' 관계 — 교역이 활발해 ' + Math.round((x.tier === 'ally' ? T.ally : T.friend) * 100) + '% 싸게 사고 비싸게 팝니다.' + (x.why ? ' (' + U.esc(x.why) + ')' : '') + '</div>';
    return '';
  };
  function hookTrade() {
    var T = G.Scenes && G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.trade; if (!T || T._rel) return;
    T._rel = true;
    ['buy', 'sell'].forEach(function (k) {
      var f = T[k];
      T[k] = async function (c) {
        if (RL.embargo(c)) {
          var nm = RL.name(RL.cityPower(c)), my = RL.name(RL.mine());
          await UI.say('미안하오만 ' + my + U.jx(my, '과/와') + ' 우리 ' + nm + U.jx(nm, '은/는') + ' 지금 전쟁 중이오. 적국 사람과 거래했다가는 내 목이 날아가오. 돌아가시오.',
            { name: '교역소 주인', portrait: G.Art.withImg(G.Art.npcSpec('trade' + c.id, 'merchant', G.Img.folkStyle(c)), G.Img.chain.npc('trader', c)), lang: 3 });
          return;
        }
        return f.apply(this, arguments);
      };
    });
    var menu = T.menu;
    T.menu = function (c) {
      var items = menu.apply(this, arguments);
      if (RL.embargo(c)) items.forEach(function (it) { if (it && (it.label === '구입' || it.label === '매각')) { it.sub = '전쟁 — 교역 금지'; it.dim = true; } });
      return items;
    };
  }

  // ================================================================ 바다: 전쟁 중인 나라의 군함
  function hookSea() {
    var SF = G.SeaFolk;
    if (SF && !SF._rel) {
      SF._rel = true;
      var dec = SF.decorate;
      SF.decorate = function (n) {
        var r = dec.apply(this, arguments);
        if (n && n.kind === 'navy' && n.nation && B().warNavyK && RL.atWarWithMe(n.nation)) { n.hostile = true; n.war = true; }
        return r;
      };
    }
    var CT = G.Court;
    if (CT && !CT._relLaw) {
      CT._relLaw = true;
      var law = CT.lawful;
      CT.lawful = function (npc) { return law.apply(this, arguments) || !!(npc && npc.kind !== 'pirate' && npc.nation && RL.atWarWithMe(npc.nation)); };
    }
  }
  /** 바다에서 마주친 적국 함대의 말 */
  RL.encounterText = function (n) {
    var k = RL.power(n.nation), me = RL.mine(); if (!k || !me) return null;
    var x = RL.get(me, k);
    return '제독! ' + n.nation + ' 군함 ' + n.n + '척이 우리 깃발을 보고 달려듭니다! ' + RL.name(me) + U.jx(RL.name(me), '과/와') + ' ' + n.nation + U.jx(n.nation, '은/는') + ' 전쟁 중입니다.' + (x.why ? ' (' + x.why + ')' : '');
  };

  // ================================================================ 날마다·달마다
  /** 하루 (js/systems/world.js): 역사 사건, 관계 갈래의 바뀜. 알림 [{icon, text, history}] */
  RL.daily = function () {
    var s = S(), out = [], r = st(); if (!r) return out;
    hookTrade(); hookSea();
    var t = today();
    // 역사 사건
    (G.REL_EVENTS || []).forEach(function (e) {
      if (r.seen[e.id]) return;
      var at = dn({ y: e.y, m: e.m, d: e.d });
      if (t < at) return;
      r.seen[e.id] = 1;
      var fresh = U.dayIndex(s.date) - U.dayIndex({ y: e.y, m: e.m || 1, d: e.d || 1 }) <= 60;   // 오래전 일(게임을 늦게 시작했을 때)은 알리지 않고 관계만
      (e.mods || []).forEach(function (m) { RL.set(m[0], m[1], m[2], m[3], m[4] || e.title); });
      if (e.battle && t <= dn(e.battle.until)) r.pend.push(e.id);   // 큰 해전은 기한 안이면 늦게 시작한 판에서도 그 바다로 가면 싸울 수 있다
      if (!fresh) { r.told = r.told || {}; r.told[e.id] = 1; }   // 지난 일은 사절이 찾아오지 않는다
      if (!fresh || e.silent) return;
      var direct = (e.who || e.ask) && metNeed(e);
      if (!direct) out.push({ icon: e.icon || 'scroll', text: '【' + e.title + '】 ' + e.text, history: true });   // 직접 전하러 오는 사건은 그때 들려준다
      else if (r.pend.indexOf(e.id) < 0) r.pend.push(e.id);
    });
    // 갈래가 바뀌면 알린다 (처음 볼 때는 적어만 둔다)
    var ps = RL.powers(), first = !r.tierInit;
    for (var i = 0; i < ps.length; i++) for (var j = i + 1; j < ps.length; j++) {
      var a = ps[i], b = ps[j], k = key(a, b), x = RL.get(a, b), old = r.tier[k];
      if (old === x.tier) continue;
      r.tier[k] = x.tier;
      if (first || !old) continue;
      if (x.tier === 'war') out.push({ icon: 'cannon', history: true, text: RL.name(a) + U.jx(RL.name(a), '과/와') + ' ' + RL.name(b) + (x.event ? '의 관계가 파국을 맞았다.' : ' 사이에 전쟁이 벌어졌다.') + (x.why ? ' — ' + x.why : '') + mineNote(a, b, 'war') });
      else if (old === 'war') out.push({ icon: 'handshake', history: true, text: RL.name(a) + U.jx(RL.name(a), '과/와') + ' ' + RL.name(b) + U.jx(RL.name(b), '이/가') + ' 싸움을 멈췄다.' + (x.why ? ' — ' + x.why : '') + mineNote(a, b, 'peace') });
      else if (x.tier === 'ally' && old !== 'ally') out.push({ icon: 'handshake', history: true, text: RL.name(a) + U.jx(RL.name(a), '과/와') + ' ' + RL.name(b) + U.jx(RL.name(b), '이/가') + ' 손을 잡았다.' + (x.why ? ' — ' + x.why : '') });
    }
    r.tierInit = 1;
    // 달마다: 전쟁 중인 나라들의 해전 소식
    if (s.date.d === 1) {
      ps.forEach(function (a, i) { ps.slice(i + 1).forEach(function (b) {
        if (!RL.atWar(a, b) || !U.chance(B().seaWarMonth) || a === 'HU' || b === 'HU' || a === 'PL' || b === 'PL' || a === 'RU' || b === 'RU') return;
        out.push({ icon: 'cannon', text: U.pick(['{a} 함대와 {b} 함대가 {sea}에서 맞붙었다는 소식이 들려온다.', '{sea}에서 {a}의 군함이 {b}의 배를 쫓아 포를 쏘았다고 한다.', '{a}{과} {b}의 싸움이 바다로 번졌다 — {sea}에 화약 연기가 자욱하다고 한다.'])
          .replace('{a}', RL.name(a)).replace('{b}', RL.name(b)).replace('{과}', U.jx(RL.name(a), '과/와')).replace('{sea}', seaOf(a, b)) });
      }); });
    }
    return out;
  };
  function mineNote(a, b, kind) {
    var me = RL.mine(); if (a !== me && b !== me) return '';
    var o = a === me ? b : a;
    return kind === 'war' ? ' 이제 ' + RL.name(o) + '의 교역소는 우리와 거래하지 않고, 그 나라 군함이 덤빈다.' : ' ' + RL.name(o) + '의 교역소가 다시 문을 연다.';
  }
  var SEAS = { OT: '에게해', VE: '아드리아해', GE: '리구리아해', EN: '도버 해협', FR: '비스케이만', ES: '서지중해', PT: '대서양', DK: '외레순 해협', SW: '발트해', HAN: '발트해', NL: '북해', SC: '북해', PA: '티레니아해' };
  function seaOf(a, b) { return SEAS[b] || SEAS[a] || '먼바다'; }

  // ================================================================ 사절·큰 해전 (사건 중 제독에게 오는 것)
  function metNeed(e) {
    if (!e.need || !e.need.met) return true;
    return e.need.met.some(function (id) { var x = S().sponsors && S().sponsors[id]; return x && x.met; });
  }
  RL.pending = function () {
    var s = S(), r = s && s.rel; if (!r || !r.pend || !r.pend.length) return false;
    return r.pend.some(function (id) { var e = evOf(id); if (!e) return false; return ((e.who || e.ask) && !(r.told || {})[id] && metNeed(e)) || (e.battle && battleHere(e)); });
  };
  function evOf(id) { return (G.REL_EVENTS || []).filter(function (e) { return e.id === id; })[0] || null; }
  function battleHere(e) {
    var s = S(), l = s.loc, b = e.battle; if (!l || l.mode !== 'sea' || l.lon == null) return false;
    var t = today(); if (t > dn(b.until)) return false;
    return l.lon >= b.box[0] && l.lon <= b.box[1] && l.lat >= b.box[2] && l.lat <= b.box[3];
  }
  /** 바다의 하루 끝·도시에 들어설 때: 교황의 사절, 그 바다에 닿았으면 큰 해전 */
  RL.present = async function () {
    var s = S(), r = st(); if (!r || RL._busy) return false;
    RL._busy = true;
    try {
      var keep = [];
      while (r.pend.length) {
        var id = r.pend.shift(), e = evOf(id); if (!e) continue;
        r.told = r.told || {};
        if ((e.who || e.ask) && !r.told[id] && metNeed(e)) { r.told[id] = 1; await court(e); }
        if (e.battle) {
          if (today() > dn(e.battle.until)) { if (!r.battle[e.id]) r.battle[e.id] = 'missed'; continue; }
          if (!battleHere(e)) { keep.push(id); continue; }
          await RL.greatBattle(e.battle, e);
        }
      }
      r.pend = keep;
    } catch (err) { console.error(err); }
    RL._busy = false;
    return true;
  };
  /** 말하는 사람: 왕녀·후원자(그 해의 주인)·교황의 사절 */
  RL.speaker = function (who) {
    if (!who) return {};
    if (who.hist && G.Hist) return G.Hist.speaker(who.hist);   // 큰 해전의 실제 인물 (js/data/histfigures.js)
    if (who.princess) {
      var pr = ((G.COURT && G.COURT.princesses) || []).filter(function (x) { return x.id === who.princess; })[0];
      if (pr) return { name: pr.name, portrait: G.Art.withImg(G.Art.npcSpec('pr:' + pr.id, 'noble', pr.style, 'f'), [pr.face]), half: [pr.half], lang: 3 };
    }
    if (who.sponsor && G.SPONSOR[who.sponsor] && G.Sponsor) { var sp = G.SPONSOR[who.sponsor]; if (G.Sponsor.present(sp)) { var o = G.Sponsor.face(sp); o.lang = 3; return o; } }
    if (who.mate && G.MATE[who.mate]) return { name: G.MATE[who.mate].name, portrait: G.Scenes.mateSpec(who.mate), half: G.Img.chain.mateHalf(who.mate), lang: 3 };
    if (who.legate) return { name: '교황의 사절', portrait: G.Art.withImg(G.Art.npcSpec('legate', 'priest', 'it', 'm'), G.Img.chain.npc('priest')), lang: 3 };
    if (who.name) return { name: who.name, portrait: G.Art.withImg(G.Art.npcSpec('rel:' + who.name, 'noble', 'it', 'm'), []), lang: 3 };
    return {};
  };
  /** 궁정의 소식: 그 사람이 직접 전하고, 청(축하 예물·십자군 기부)이 있으면 묻는다 */
  async function court(e) {
    var s = S(), p = s.player, who = RL.speaker(e.who || L0), a = e.ask;
    var tt = String(e.title).replace(/\s*\(\d{3,4}\)\s*$/, '');   // 「신성 동맹 (1571)」 → 「신성 동맹」 (대화창은 괄호 속 숫자를 알림으로 떼어 낸다)
    // 왕녀가 직접 전하는 혼인 소식: 이벤트 샷 (js/art/eventshot.js)
    var pr = e.who && e.who.princess && G.EventShot ? ((G.COURT && G.COURT.princesses) || []).filter(function (x) { return x.id === e.who.princess; })[0] : null;
    var pc = pr ? await G.EventShot.princess('royal_wedding', { realm: pr.realm, name: pr.name, title: tt, city: (function () { var r = G.COURT.realms[pr.realm], sp = r && r.sponsors && G.SPONSOR[r.sponsors[0]]; return sp ? G.CITY_DATA[sp.city] : null; })() }) : null;
    try { await courtIn(e, s, p, who, a, tt); } finally { if (pc) await pc.stop(); }
  }
  async function courtIn(e, s, p, who, a, tt) {
    await UI.say('【' + tt + '】\f' + e.text, who);
    if (!a) return;
    await UI.say(a.text, who);
    var v = await UI.ask(tt + ' — 소지금 ' + U.num(p.gold) + '닢', [
      { label: (a.label || '예물을 바친다') + ' (금화 ' + U.num(a.gold) + '닢 · 사교 명성 +' + (G.Fame ? G.Fame.mul('so', a.so) : a.so) + (a.trust ? ' · 신뢰 +' + a.trust[1] : '') + ')', value: 'give' },
      { label: '정중히 사양한다', value: 'no' }], who);
    if (v === 'give' && p.gold >= a.gold) {
      p.gold -= a.gold;
      var so = G.Fame ? G.Fame.add('so', a.so) : a.so;
      var sp = a.trust && G.SPONSOR[a.trust[0]];
      if (sp && G.Sponsor) G.Sponsor.addTrust(G.Sponsor.rel(sp.id), a.trust[1]);
      await UI.say(a.thanks || (e.who && e.who.legate ? '성하께서 그대의 이름을 기억하실 것이오. 주님의 축복이 그대의 배와 함께하기를.' : '고맙소. 그대의 마음을 잊지 않겠소.'), who);
      G.State.log('「' + e.title + '」 — 금화 ' + U.num(a.gold) + '닢을 바쳤다. (사교 명성 +' + so + ')');
      UI.toast(e.title + ' — 사교 명성 +' + so + (sp ? ' · ' + G.Sponsor.holderName(sp) + '의 신뢰 +' + a.trust[1] : ''), e.who && e.who.legate ? 'pray' : 'heart', 5000);
    } else if (v === 'give') await UI.say('…마음만으로도 고맙소.', who);
    else await UI.say('그렇소? 하는 수 없지.', who);
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  var L0 = { legate: 1 };

  // ================================================================ 큰 해전 — 우리 편 함대와 함께
  /* spec: {id, foe: 나라 이름, n: 적 배 수, ships: [배 종류…], allies: [{type, name}], allyName: '돈 후안의 신성 동맹 함대', intro: 대사, who: {name, portrait}, win: {fame, gold, so, text}, lose: 글}
     싸우겠다고 하면 해전 장면으로 — 결과는 js/scenes/battle.js 가 G.Rel.afterBattle 로 알린다 */
  RL.greatBattle = async function (spec, e) {
    var s = S(), r = st(), id = spec.id || (e && e.id);
    if (r.battle[id]) return false;
    var who = spec.who ? RL.speaker(spec.who) : G.Scenes.mateSpeaker('first');
    if (spec.council && G.Hist) await G.Hist.play(spec.council);   // 싸움 앞의 작전 회의 (우리 편 장수들)
    if (spec.intro) await UI.say(spec.intro, who);
    if (spec.foeScene && G.Hist) await G.Hist.play(spec.foeScene);   // 그 무렵 적의 기함에서
    var v = await UI.ask(spec.ask || '함께 싸우겠습니까?', [{ label: '함께 싸운다', value: 'fight' }, { label: '물러난다', value: 'no' }], who);
    if (v !== 'fight') { r.battle[id] = 'declined'; await UI.say(spec.decline || '…그대의 사정도 있겠지. 우리끼리 싸우겠소.', who); return false; }
    r.battle[id] = 'fighting';
    var zone = G.Ships.zone(s.loc.lon, s.loc.lat);
    var npc = { id: 'great_' + id, kind: 'navy', nation: spec.foe, n: spec.ships.length, ships: spec.ships.slice(), K: 1, zone: zone, hostile: true, great: id,
      allies: (spec.allies || []).map(function (a) { return { type: a.type, name: a.name, gun: a.gun }; }), label: spec.foeLabel || spec.foe + ' 함대',
      gun: spec.gun, myGun: spec.myGun, crewK: spec.crewK, gunK: spec.gunK, gunNote: spec.gunNote,
      names: spec.names, boss: spec.boss };   // names: 적 배 이름(기함부터) · boss: 일기토에 나서는 적장 {hist: 인물 id, str, mar…}   // 대포: gun 적 함대 · myGun 우리 함대(이 싸움에서만) · allies[].gun 우리 편
    await UI.fade(function () { G.Game.go('battle', { npc: npc }); });
    return true;
  };
  /** 해전이 끝난 뒤 (js/scenes/battle.js finish) — 큰 해전이면 보상과 소식 */
  RL.afterBattle = function (npc, res, lines) {
    if (!npc || !npc.great) return;
    var s = S(), r = st(), id = npc.great, spec = RL.spec(id); if (!spec) return;
    r.battle[id] = res === 'win' ? 'won' : 'lost';
    if (res === 'win') {
      if (G.Growth) G.Growth.once('great_' + id, 'mar', 1, '큰 해전에서 이겼다');
      var w = spec.win || {}, fame = w.fame ? G.Fame.add('bt', w.fame) : 0, so = w.so ? G.Fame.add('so', w.so) : 0;
      s.player.gold += w.gold || 0;
      if (spec.onWin) spec.onWin();
      if (lines) lines.push('<b>' + U.esc(w.text || '큰 해전에서 이겼다!') + '</b><br>' + (w.gold ? '포상금 금화 ' + U.num(w.gold) + '닢 · ' : '') + '전투 명성 +' + fame + (so ? ' · 사교 명성 +' + so : ''));
      G.State.log(w.text || '큰 해전에서 이겼다.');
    } else {
      if (spec.onLose) spec.onLose();
      G.State.log(spec.lose || '큰 해전에서 물러났다.');
    }
  };
  /** 큰 해전의 자료 (사건 자료 또는 다른 시스템이 등록한 것) */
  var SPECS = {};
  RL.register = function (spec) { SPECS[spec.id] = spec; };
  RL.spec = function (id) {
    if (SPECS[id]) return SPECS[id];
    var e = (G.REL_EVENTS || []).filter(function (x) { return x.battle && (x.battle.id === id || x.id === id); })[0];
    return e ? Object.assign({ id: id }, e.battle) : null;
  };

  // ================================================================ 수첩: 유럽 정세
  RL.page = function (el) {
    var s = S(), ps = RL.powers(), me = RL.mine(), y = s.date.y;
    var COL = { ally: '#3f7f4a', friend: '#7aa35f', neutral: '#b9ab86', cold: '#c58a4a', war: '#a83a2e' };
    var h = '<div class="flex" style="margin-bottom:8px"><b style="font-size:18px">' + y + '년 유럽 정세</b><span class="right muted" style="font-size:14px">' +
      Object.keys(RL.TIER).map(function (k) { return '<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:' + COL[k] + ';vertical-align:-1px;margin:0 3px 0 10px"></span>' + RL.TIER[k]; }).join('') + '</span></div>';
    // 제독의 나라와의 관계
    h += '<div class="rel-mine"><b>' + RL.name(me) + '</b>에서 본 나라들 — ' + ps.filter(function (k) { return k !== me; }).map(function (k) {
      var x = RL.get(me, k); return '<span class="rel-tag" style="background:' + COL[x.tier] + '" title="' + U.esc(x.why || '') + '">' + RL.name(k) + ' ' + RL.TIER[x.tier] + '</span>';
    }).join(' ') + '</div>';
    h += '<div class="muted" style="font-size:14px;margin:4px 0 10px">전쟁: 그 나라 교역소가 문을 닫고 군함이 덤빈다(쳐도 악명이 오르지 않는다) · 냉랭: 교역 ' + Math.round(-B().trade.cold * 100) + '% 손해 · 우호/동맹: 교역이 활발해 ' + Math.round(B().trade.friend * 100) + '%/' + Math.round(B().trade.ally * 100) + '% 이득</div>';
    // 표
    h += '<div class="rel-wrap"><table class="rel-tbl"><tr><th></th>' + ps.map(function (k) { return '<th><span>' + RL.name(k) + '</span></th>'; }).join('') + '</tr>' +
      ps.map(function (a) {
        return '<tr><th>' + RL.name(a) + '</th>' + ps.map(function (b) {
          if (a === b) return '<td class="self"></td>';
          var x = RL.get(a, b); return '<td style="background:' + COL[x.tier] + '" title="' + U.esc(RL.name(a) + ' · ' + RL.name(b) + ' — ' + RL.TIER[x.tier] + ' (' + x.v + ')' + (x.why ? ' · ' + x.why : '') + (x.event ? ' · 사건' : '')) + '">' + (x.tier === 'war' ? '⚔' : x.event ? '•' : '') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</table></div>';
    // 지금 전쟁
    var wars = [];
    ps.forEach(function (a, i) { ps.slice(i + 1).forEach(function (b) { var x = RL.get(a, b); if (x.tier === 'war') wars.push(RL.name(a) + ' ⚔ ' + RL.name(b) + (x.why ? ' <small class="muted">(' + U.esc(x.why) + ')</small>' : '')); }); });
    h += '<div style="margin-top:10px"><b>지금 벌어진 전쟁</b> — ' + (wars.length ? wars.join(' · ') : '<span class="muted">없음</span>') + '</div>';
    // 최근 사건
    var r = st(), evs = (G.REL_EVENTS || []).filter(function (e) { return r.seen[e.id] && !e.silent; }).slice(-6).reverse();
    if (evs.length) h += '<div style="margin-top:10px"><b>최근의 일</b><ul class="rel-ev">' + evs.map(function (e) { return '<li><b>' + e.y + '년 ' + (e.m || 1) + '월 — ' + U.esc(e.title) + '</b> ' + U.esc(e.text) + '</li>'; }).join('') + '</ul></div>';
    el.innerHTML = h;
  };
  hookTrade(); hookSea();
})(window.G = window.G || {});
