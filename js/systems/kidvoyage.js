/* 배에 함께 탄 아이의 하루 (G.KidVoy) — 사건은 js/data/kidvoyage.js (G.KID_VOYAGE), 조정값 G.BALANCE.kidVoy. 2026-10-21 사용자 요청
   · 아이의 성격(k.temper): 활발 lively · 차분 calm · 다정 warm · 고집 stubborn — 태어날 때 타고난 능력(체력→활발, 지력→차분, 매력→다정, 무력→고집)을
     바탕으로 정해진다. 옛 저장의 아이는 처음 볼 때 같은 방법으로 정한다 (이름·생일로 정한 난수라 불러올 때마다 같다).
   · 언제: 바다 위 하루(js/scenes/sea.js) — 견습·동행으로 배에 탄 아이(G.Family.aboard())가 있으면 날마다 chance(2%).
     같은 아이는 gap(60)일에 한 번까지. 앞 사건과 실제 시간 간격(G.Pace 'kidvoy'). 튜토리얼 중에는 없다.
   · 무엇: 아이의 나이(견습 12~15 young · 어른 16~ adult) × 성별 × 성격에 맞는 사건 가운데 그 아이가 아직 겪지 않은 것 하나 (조합마다 3가지).
     세 가지를 다 겪으면 그 아이에게는 더 일어나지 않는다 (어른이 되면 어른의 세 가지가 새로 열린다).
   · 저장: k.temper · k.voy = { last: 날번호, seen: {사건 id: 날번호} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var KV = G.KidVoy = {};
  function S() { return G.Game && G.Game.state; }
  function F() { return G.Family; }
  function K() { var b = (G.BALANCE && G.BALANCE.kidVoy) || {}; return { chance: b.chance == null ? 0.02 : b.chance, gap: b.gap == null ? 60 : b.gap }; }
  KV.K = K;
  var ORDER = ['lively', 'calm', 'warm', 'stubborn'];

  // ---------------------------------------------------------------- 성격
  /** 이름·생일로 정한 0~1 난수 (불러올 때마다 같다) */
  function seeded(k, salt) { var h = U.strHash(String(k.name || '') + ':' + (k.born ? k.born.y + '-' + k.born.m + '-' + k.born.d : '') + ':' + (k.sex || '') + ':' + salt); return (Math.abs(h) % 10007) / 10007; }
  /** 타고난 능력으로 성격을 고른다 — 높은 능력일수록 그 성격이 될 가능성이 크다 */
  KV.rollTemper = function (k, r) {
    var st = k.st || {}, v = [st.str || 55, st.int || 55, st.cha || 55, st.mar || 55];   // 활발·차분·다정·고집
    var w = v.map(function (x) { return Math.pow(Math.max(5, x - 25), 2); }), tot = w.reduce(function (a, b) { return a + b; }, 0);
    var t = (r == null ? seeded(k, 'temper') : r) * tot;
    for (var i = 0; i < 4; i++) { t -= w[i]; if (t <= 0) return ORDER[i]; }
    return ORDER[3];
  };
  /** 아이의 성격 (없으면 정해서 적는다) */
  KV.temper = function (k) {
    if (!k) return null;
    if (!k.temper || !G.KID_TEMPER[k.temper]) k.temper = KV.rollTemper(k);
    return k.temper;
  };
  KV.temperName = function (k) { var t = KV.temper(k); return t && G.KID_TEMPER[t] ? G.KID_TEMPER[t].name : ''; };
  /** 정보 창의 꼬리표 (아기는 아직 없다) */
  KV.tag = function (k) { if (!k || k.unnamed || F().kidAge(k) < 3) return ''; return ' · ' + KV.temperName(k); };

  // ---------------------------------------------------------------- 고르기
  function adultAge() { return ((G.BALANCE && G.BALANCE.family) || {}).adult || 16; }
  KV.band = function (k) { var a = F().kidAge(k); return a >= adultAge() ? 'adult' : a >= 12 ? 'young' : null; };
  function mem(k) { return k.voy || (k.voy = { seen: {} }); }
  /** 이 아이가 아직 겪지 않은, 나이·성별·성격에 맞는 사건들 */
  KV.pool = function (k) {
    var band = KV.band(k); if (!band) return [];
    var sex = k.sex === 'f' ? 'f' : 'm', t = KV.temper(k), seen = mem(k).seen;
    return (G.KID_VOYAGE || []).filter(function (e) { return e.age === band && e.sex === sex && e.temper === t && !Object.prototype.hasOwnProperty.call(seen, e.id); });   // 날번호가 0일 수도 있다
  };
  /** 지금 사건을 겪을 수 있는 아이들 (같은 아이는 gap일에 한 번) */
  KV.ready = function () {
    var s = S(); if (!s || !F()) return [];
    var gap = K().gap;
    return F().aboard().filter(function (k) {
      if (k.unnamed || k.lost || k.married) return false;
      var m = mem(k); if (m.last != null && s.day - m.last < gap) return false;
      return KV.pool(k).length > 0;
    });
  };

  // ---------------------------------------------------------------- 바다 위 하루 (js/scenes/sea.js)
  KV.atSea = async function () {
    var s = S(); if (!s || s.loc.mode !== 'sea') return false;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return false;
    var list = KV.ready(); if (!list.length) return false;
    if (!U.chance(K().chance)) return false;
    var k = U.pick(list), ev = U.pick(KV.pool(k));
    return KV.play(k, ev);
  };

  // ---------------------------------------------------------------- 펼치기
  function first() { return G.Scenes.mateSpeaker('first'); }
  function mateName() { var sp = first(); return sp && sp.name ? sp.name : '부관'; }
  function shipName() { var f = S().fleet; return f && f.ships && f.ships[0] ? f.ships[0].name : '기함'; }
  KV.fill = function (t, k) {
    var V = { k: k.name, me: S().player.name, mate: mateName(), ship: shipName() };
    return String(t).replace(/\{(\w+)(?::([^}]*))?\}/g, function (all0, key, post) {
      var v = V[key] == null ? '' : V[key];
      if (post == null) return v;
      return v + (post.indexOf('/') >= 0 ? U.jx(v, post) : post);
    });
  };
  var sailors = {};
  function sailor(name) {
    if (sailors[name]) return sailors[name];
    var A = G.Art, role = /요리사/.test(name) ? 'cook' : /경리/.test(name) ? 'merchant' : /의원/.test(name) ? 'scholar' : 'sailor';
    var sp = { name: name, lang: 3 };
    try { sp.portrait = A.withImg(A.npcSpec('kidvoy_' + name, role === 'cook' ? 'sailor' : role, 'ib', 'm'), G.Img.chain.npc ? G.Img.chain.npc(role === 'cook' ? 'cook' : 'boatswain') : []); } catch (e) { /* 그림 없이 */ }
    return (sailors[name] = sp);
  }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function kidSp(k) { return G.HomeLife && G.HomeLife.speaker ? G.HomeLife.speaker(k, true) : { name: k.name, portrait: F().kidSpec(k), lang: 3 }; }
  /** 한 줄을 말한다 */
  async function line(raw, k) {
    var m = /^(\w)(?:\[([^\]]+)\])?:([\s\S]*)$/.exec(raw); if (!m) return;
    var who = m[1], text = KV.fill(m[3], k);
    var sp = who === 'k' ? kidSp(k) : who === 'p' ? me() : who === 'm' ? first() : who === 's' ? sailor(m[2] || '선원') : {};
    await UI.say(text, sp);
  }
  KV.line = line;
  /** 효과를 매기고 알림 글을 돌려준다 */
  KV.apply = function (fx, k) {
    var s = S(), f = s.fleet, out = [];
    if (!fx) return '';
    if (fx.bond) { F().addBond(k, fx.bond); out.push('사이 ' + (fx.bond > 0 ? '+' : '') + fx.bond); }
    var SN = { str: '체력', int: '지력', mar: '무력', cha: '매력' };
    ['str', 'int', 'mar', 'cha'].forEach(function (x) {
      if (!fx[x]) return; if (!k.st) k.st = { str: 55, int: 55, mar: 55, cha: 55 };
      var b = k.st[x] || 55; k.st[x] = Math.max(1, Math.min(90, b + fx[x])); if (k.st[x] !== b) out.push(SN[x] + ' ' + (fx[x] > 0 ? '+' : '') + fx[x]);
    });
    if (fx.sk) {
      if (!k.sk) k.sk = {};
      Object.keys(fx.sk).forEach(function (id) {
        var cap = fx.sk[id], cur = k.sk[id] || 0; if (cur >= cap) return;
        k.sk[id] = cur + 1;
        var nm = (G.SKILLS.filter(function (x) { return x.id === id; })[0] || {}).name || id;
        out.push(nm + ' ' + k.sk[id]);
      });
    }
    if (fx.fatigue) { f.fatigue = Math.max(0, Math.min(100, (f.fatigue || 0) + fx.fatigue)); out.push('함대 피로 ' + (fx.fatigue > 0 ? '+' : '') + fx.fatigue); }
    if (fx.disc) { f.discipline = Math.max(0, Math.min(100, (f.discipline == null ? 60 : f.discipline) + fx.disc)); out.push('규율 ' + (fx.disc > 0 ? '+' : '') + fx.disc); }
    if (fx.gold) { var g = fx.gold < 0 ? -Math.min(s.player.gold, -fx.gold) : fx.gold; if (g) { s.player.gold += g; out.push('금화 ' + (g > 0 ? '+' : '') + g); } }
    if (fx.food) { var room = G.R && G.R.free ? Math.max(0, Math.floor(G.R.free())) : fx.food, q = Math.min(fx.food, room); if (q > 0) { f.food = (f.food || 0) + q; out.push('식량 +' + q + '통'); } }
    return out.join(' · ');
  };
  /** 사건 하나를 펼친다 */
  KV.play = async function (k, ev) {
    if (!k || !ev) return false;
    var s = S(), m = mem(k);
    m.last = s.day; m.seen[ev.id] = s.day;
    try {
      UI.toast((ev.title || '배 위의 하루') + ' — ' + k.name + ' (' + KV.temperName(k) + ')', 'heart', 3600);
      for (var i = 0; i < ev.lines.length; i++) await line(ev.lines[i], k);
      var fx = ev.fx || null, say = null;
      if (ev.pick) {
        var opts = ev.pick.opts.map(function (o, j) { return { label: KV.fill(o.label, k), value: j }; });
        var v = await UI.ask(KV.fill(ev.pick.text, k), opts, Object.assign(me(), { cancel: false }));
        var o = ev.pick.opts[v == null ? 0 : v] || ev.pick.opts[0];
        fx = o.fx; say = o.say;
      }
      for (var j = 0; say && j < say.length; j++) await line(say[j], k);
      var note = KV.apply(fx, k);
      if (note) UI.toast(k.name + ' — ' + note, 'heart', 4600);
      G.State.log('배 위의 하루: ' + k.name + ' — ' + (ev.title || ev.id));
    } catch (e) { console.error(e); }
    return true;
  };
})(window.G = window.G || {});
