/* 현상수배 벽보 · 해적 소문 · 해적 깃발 (G.Wanted) — 2026-11-10 사용자 요청
   「식당에 현상수배 포스터를 볼 수 있게 하고, 해적 소문도 여급이나 식당을 통해 들을 수 있게. 해적 깃발을 아이템으로.」
   ■ 현상수배 벽보 (식당 메뉴 「현상수배 벽보를 본다」)
     · 그 도시가 있는 바다에서 지금 활약하는 이름난 해적(G.Captains.namedFree)을 현상금 순으로 posters명까지 붙인다.
       벽보마다 해적을 그린 먹빛 초상(images/wanted/<id>.webp) · 해적단 · 깃발 · 현상금 · 한 줄.
     · 현상금 = G.BALANCE.wanted.base × (역사 인물 hist) × (바다 하나 더할 때마다 +multi). 이름난 해적의 함대를 무찌르면(이기면)
       「받을 현상금」에 적히고, 아무 항구의 식당에서나 받는다 (식당 메뉴 「현상금을 받는다」). 한 해적에 한 번.
       (기함을 나포해 사로잡으면 예전처럼 그 자리에서 몸값도 받는다 — js/systems/seacaptains.js CP.afterBattle)
   ■ 해적 소문
     · 식당: 「손님들의 해적 이야기를 듣는다」 — 들르는 동안 한 번, chance로 그 바다 이름난 해적 하나의 행방(어느 앞바다 · days일 안)을 듣는다.
       못 들으면 그냥 뱃사람들의 허풍. 들은 소문은 여급의 귀띔과 같은 장부(s.maidTips, kind 'named')에 적혀 수첩 「할 일」에 보인다.
     · 술집 여급: 「사례하고 소식을 묻는다」에 「이름난 해적의 소문」(사례금 maid) — 여급의 귀띔답게 기한이 넉넉하다.
     · 그 앞바다에 기한 안에 들어가면 그 해적의 함대가 정말 나타난다 (js/systems/maidtip.js MT.spawn → G.Captains.forceNamed).
       소굴을 찾는 데 아직 세지 않은 해적을 먼저 알려 준다 (js/systems/pirate_lair.js — 같은 해적을 또 무찔러도 세지 않으므로).
   ■ 해적 깃발 (아이템 kind 'flag' — js/data/pirate_roster.js)
     · 해적단마다 깃발 하나. 그 해적단의 이름난 해적을 처음 무찌르면 그 해적단의 깃발을 손에 넣는다. 소굴을 손에 넣으면 소굴 해적단의 깃발.
       소지품이 가득하면 자택 보관함으로 간다. 수첩 「해적의 소굴」 아래에 모은 깃발 수.
     · 그림: images/items/flag_<해적단>.webp (코덱스 — docs/codex/09_pirate_roster_flags.md). 그림이 없으면 아래 flagArt가 대강 그린다.
   ■ 흡수: 무찌른 이름난 해적의 남은 무리는 같은 바다의 다른 이름난 해적에게 흘러든다 — 한 해적이 둘까지. 흡수한 해적은 강해진다 (아래 W.absorb).
   저장: s.wanted = {due: {해적 id: 현상금}, paid: {해적 id: 받은 날}, flags: {해적단: 얻은 날}, rest: {도시: [날, 입항 번호]},
                    abs: {흡수한 해적: [흡수된 해적…]}, gone: {흡수된 해적: 흡수한 해적}}
   조정값: G.BALANCE.wanted (js/data/base.js) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var W = G.Wanted = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.wanted) || { base: 2000, hist: 2, multi: 0.2, round: 100, posters: 8, chance: 0.75, days: 12, maid: 650 }; }
  function st() { var s = S(); if (!s) return null; var w = s.wanted || (s.wanted = {}); w.due = w.due || {}; w.paid = w.paid || {}; w.flags = w.flags || {}; w.rest = w.rest || {}; w.abs = w.abs || {}; w.gone = w.gone || {}; return w; }
  W.st = st;
  var BY = null;
  function index() { if (!BY) { BY = {}; (G.SEA_PIRATES || []).forEach(function (p) { BY[p.id] = p; }); } return BY; }
  /** 이름난 해적의 명부 자료 */
  W.pirate = function (id) { return index()[id] || null; };
  W.band = function (c) { var p = c && (c.band ? c : W.pirate(c.id)); return p && p.band && G.PIRATE_BANDS ? G.PIRATE_BANDS[p.band] || null : null; };
  /** 현상금 (금화) */
  W.bounty = function (c) {
    var p = W.pirate(c.id) || c, k = K();
    var v = k.base * (p.hist ? k.hist : 1) * (1 + k.multi * Math.max(0, ((p.zones || []).length || 1) - 1));
    var ab = W.absorbed(p.id), A2 = AB();   // 흡수한 해적의 현상금 일부가 얹힌다
    ab.forEach(function (id) { var q = W.pirate(id); if (q) v += A2.bounty * k.base * (q.hist ? k.hist : 1); });
    return Math.round(v / k.round) * k.round;
  };
  // ---------------------------------------------------------------- 흡수 (2026-11-10 사용자 요청)
  //   「해적은 토벌당하면 다른 해적에 흡수되고, 2명까지 흡수될 수 있어. 흡수되면 흡수한 해적은 강해져.」
  //   · 이름난 해적의 함대를 무찌르면(이기면) 그 해적의 남은 무리가 같은 바다의 다른 이름난 해적에게 흘러든다.
  //     받는 쪽: 지금 그 바다에서 활약하고, 아직 둘을 다 채우지 않은 해적 — 같은 해적단을 먼저. 받을 해적이 없으면 무찌른 해적이 다시 배를 모은다(예전처럼).
  //   · 흡수된 해적은 다시 바다에 나오지 않는다 (명부에서 빠짐 — js/systems/seacaptains.js active). 소굴 단서(무찌른 수)는 그대로 센다.
  //   · 흡수한 해적은 한 명마다 배 ships척 · 선원 crew · 포술 gun · 일기토 boss가 늘고, 현상금에 흡수한 해적 현상금의 bounty배가 얹힌다.
  //     그 해적이 다시 무찔리면 그도 다른 해적에게 흡수된다 (그가 거느렸던 잔당은 흩어진다).
  //   저장: s.wanted.abs = {흡수한 해적: [흡수된 해적…]}, s.wanted.gone = {흡수된 해적: 흡수한 해적}
  function AB() { return K().absorb || { max: 2, ships: 1, crew: 0.08, gun: 0.1, boss: 4, bounty: 0.5 }; }
  W.absorbed = function (id) { var w = st(); return (w && w.abs[id]) || []; };
  W.gone = function (id) { var w = st(); return !!(w && w.gone[id]); };
  W.absorb = function (npc, lines) {
    var w = st(), c = npc && npc.cap, p = c && W.pirate(c.id); if (!w || !p || w.gone[p.id]) return null;
    var zone = p.zones.indexOf(npc.zone) >= 0 ? npc.zone : p.zones[0], max = AB().max;
    var list = (G.Captains && G.Captains.namedFree ? G.Captains.namedFree(zone) : []).filter(function (q) { return q.id !== p.id && W.absorbed(q.id).length < max; });
    if (!list.length) { if (lines) lines.push(U.esc(p.name) + '의 남은 무리를 받아 줄 해적이 이 바다에 없다 — 언젠가 다시 배를 모을 것이다.'); return null; }
    var same = list.filter(function (q) { return q.band && q.band === p.band; });
    var y = U.pick(same.length ? same : list), b = W.band(y);
    w.abs[y.id] = W.absorbed(y.id).concat([p.id]); w.gone[p.id] = y.id;
    delete w.abs[p.id];   // 무찌른 해적이 거느렸던 잔당은 흩어진다
    var n2 = w.abs[y.id].length;
    var t = U.esc(p.name) + '의 남은 무리가 ' + U.esc((b ? b.name + '의 ' : '') + y.name) + '에게 흘러들었다 — ' + U.esc(y.name) + '의 함대가 더 강해졌다 (흡수 ' + n2 + '/' + max + ', 현상금 ' + U.num(W.bounty(y)) + '닢).';
    if (lines) lines.push(t);
    if (G.State && G.State.log) G.State.log(t.replace(/<[^>]+>/g, ''));
    return y;
  };
  /** 흡수한 해적의 함대를 키운다 — 바다에서 해적 떼를 꾸민 뒤 (SeaFolk.decorate · 여급 소문 MT.spawn) */
  W.empower = function (n) {
    if (!n || n.kind !== 'pirate' || !n.cap || n.empowered) return n;
    var ab = W.absorbed(n.cap.id); if (!ab.length) return n;
    var a = AB(), k = ab.length, sh = n.ships || (n.ships = []);
    var extra = sh[1] || sh[0]; if (extra) for (var i = 0; i < k * a.ships; i++) sh.push(sh[0] && i === 0 && k >= 2 ? sh[0] : extra);
    n.n = sh.length;
    n.K = Math.min(1, (n.K || 0.5) + 0.1 * k);
    n.crewK = Math.min(1, (n.crewK || 0.75) + a.crew * k);
    n.gunK = Math.min(1, (n.gunK || 0.6) + a.gun * k);
    if (n.boss) { n.boss.str = Math.min(99, (n.boss.str || 80) + a.boss * k); n.boss.atk = (n.boss.atk || 12) + k; n.boss.def = (n.boss.def || 6) + k; }
    var names = ab.map(function (id) { var q = W.pirate(id); return q ? q.name : id; });
    n.absorbedNames = names; n.empowered = true;
    if (n.label) n.label += ' · 잔당 ' + k;
    n.tacticNote = (n.tacticNote ? n.tacticNote + ' ' : '') + names.join('·') + '의 잔당까지 거느려 배가 ' + (k * a.ships) + '척 늘고 선원도 독이 올랐다!';
    return n;
  };
  function zoneOf(c) { return G.Ships && c ? G.Ships.zone(c.lon, c.lat) : null; }
  function zoneName(z) { return (G.Ships && G.Ships.ZONE_NAME && G.Ships.ZONE_NAME[z]) || z; }
  function lairKills(zone) { var x = G.Lair && G.Lair.st ? G.Lair.st() : null; return (x && x.kills && x.kills[zone]) || []; }

  /** 벽보: 이 바다에서 지금 활약하는 이름난 해적 (현상금 큰 순) */
  W.posters = function (zone) {
    if (!G.Captains || !G.Captains.namedFree) return [];
    return G.Captains.namedFree(zone).slice().sort(function (a, b) { return W.bounty(b) - W.bounty(a) || a.y[0] - b.y[0]; }).slice(0, K().posters);
  };
  /** 소문으로 알려 줄 해적 하나: 소굴을 찾는 데 아직 세지 않았고 현상금을 받지 않은 사람을 먼저 */
  W.rumorPick = function (zone) {
    var w = st(), list = G.Captains && G.Captains.namedFree ? G.Captains.namedFree(zone) : [];
    if (!list.length) return null;
    var kills = lairKills(zone), fresh = list.filter(function (c) { return kills.indexOf(c.id) < 0 && !(w && (w.paid[c.id] != null || w.due[c.id])); });
    return U.pick(fresh.length ? fresh : list);
  };
  W.due = function () { var w = st(); if (!w) return 0; return Object.keys(w.due).reduce(function (n, id) { return n + (w.due[id] || 0); }, 0); };
  W.flagCount = function () { var w = st(); return w ? Object.keys(w.flags).length : 0; };
  W.flagTotal = function () { return Object.keys(G.PIRATE_BANDS || {}).length; };

  // ---------------------------------------------------------------- 싸운 뒤: 현상금 · 깃발
  function giveFlag(bandId, lines, why) {
    var w = st(), b = G.PIRATE_BANDS && G.PIRATE_BANDS[bandId]; if (!w || !b || w.flags[bandId] != null) return false;
    var id = 'flag_' + bandId, s = S();
    w.flags[bandId] = s.day;
    var ok = R.addItem(id), where = ok ? '' : ' (소지품이 가득해 자택 보관함으로 보냈다)';
    if (!ok) R.storage().push({ id: id });
    if (lines) lines.push('<b>' + U.esc(b.name) + '의 깃발</b>' + U.jx('깃발', '을/를') + ' 손에 넣었다! ' + (why || '') + where + ' <span class="muted">— 해적 깃발 ' + W.flagCount() + '/' + W.flagTotal() + '</span>');
    if (G.State && G.State.log) G.State.log(b.name + '의 깃발을 손에 넣었다.');
    return true;
  }
  W.giveFlag = giveFlag;
  W.afterWin = function (npc, lines) {
    var w = st(), c = npc && npc.cap; if (!w || !c || npc.kind !== 'pirate') return;
    var p = W.pirate(c.id); if (!p) return;   // 철새가 된 항해사(prom) 두목은 명부 밖 — 현상수배도 없다
    if (w.paid[c.id] == null && !w.due[c.id]) {
      var v = W.bounty(p); w.due[c.id] = v;
      if (lines) lines.push('현상수배된 ' + U.esc(c.name) + U.jx(c.name, '을/를') + ' 무찔렀다 — 아무 항구 식당에서나 현상금 금화 <b>' + U.num(v) + '닢</b>을 받을 수 있다.');
    }
    if (p.band) giveFlag(p.band, lines, '깃대에서 끌어 내렸다.');
    W.absorb(npc, lines);
  };

  // ---------------------------------------------------------------- 식당
  function owner() { var C = G.Scenes.city; return C.npc('innkeeper', '식당 주인'); }
  function speakerOf(p) { var n = { kind: 'pirate', zone: p.zones[0], cap: { id: p.id, name: p.name, g: p.g, desc: p.desc, band: p.band, k: 'p', src: 'hist' } }; return G.Captains && G.Captains.speaker ? G.Captains.speaker(n) : null; }
  function flagImg(bandId, size) {
    var d = G.ITEM['flag_' + bandId]; if (!d) return null;
    return G.Img.make(G.Img.chain.item(d), size, size, function () { return W.flagArt(bandId, size, size); }, { fit: 'contain' });
  }
  // 글자는 게임에서 얹는다. 흡수·토벌 뒤의 현상금과 도장이 현재 장부를 따른다.
  function warrantSheet(p, slot) {
    var w = st(), band = W.band(p);
    return '<span class="wp-sheet" style="--wp-name-length:' + p.name.length + '"><span class="wp-face" data-face="' + slot + '"></span>' +
      '<span class="wp-head">현상수배</span><span class="wp-caption"><strong class="wp-name">' + U.esc(p.name) + '</strong>' +
      '<span class="wp-band">' + U.esc(band ? band.name : '해적단') + '</span>' +
      '<strong class="wp-pay">현상금 ' + U.num(W.bounty(p)) + '닢</strong></span>' +
      (w.paid[p.id] != null || w.due[p.id] ? '<span class="wp-stamp">무찌름</span>' : '') + '</span>';
  }
  function drawWarrant(el, p, slot) {
    var face = el.querySelector('[data-face="' + slot + '"]'), key = 'wanted/' + p.id;
    function oldFace() {
      var sp = speakerOf(p);
      var canvas = A.canvas(320, 480), x = canvas.getContext('2d');
      x.fillStyle = '#dededb'; x.fillRect(0, 0, 320, 480);
      if (sp && sp.portrait) {
        var sketch = A.canvas(224, 224);
        A.drawPortrait(sketch.getContext('2d'), 224, sp.portrait);
        x.filter = 'grayscale(1)';
        x.drawImage(sketch, 48, 90);
      }
      return canvas;
    }
    face.appendChild(G.Img.make([key], 320, 480, oldFace, { fit: 'contain' }));
  }
  function posterHtml(p, i, zone) {
    var note = (p.g === 'f' ? '여해적 · ' : '') + (p.hist ? '실존 인물' : '소문 속 해적');
    if (lairKills(zone).indexOf(p.id) >= 0) note += ' · 소굴 단서';
    var count = W.absorbed(p.id).length;
    if (count) note += ' · 잔당 흡수 ' + count + '/' + AB().max;
    return '<button type="button" class="wp-card" data-wp="' + i + '">' + warrantSheet(p, i) +
      '<span class="wp-meta"><span data-flag="' + i + '"></span>' + note + '</span></button>';
  }
  W.board = async function (c) {
    var zone = zoneOf(c), list = W.posters(zone);
    if (!list.length) { await G.Scenes.city.say(owner(), '요즘 ' + zoneName(zone) + '에는 이름난 해적 소식이 없습니다. 벽보 자리가 비었지요.'); return; }
    var due = W.due();
    var html = '<div style="font-size:17px;margin-bottom:10px">' + U.esc(zoneName(zone)) + '에서 활약하는 이름난 해적들의 현상수배 벽보입니다. 벽보를 누르면 자세히 봅니다.' +
      (due ? ' <b>받을 현상금 ' + U.num(due) + '닢</b>' : '') + '</div><div class="wp-grid">' + list.map(function (p, i) { return posterHtml(p, i, zone); }).join('') + '</div>';
    var pick = null;
    var win = UI.window({ title: c.name + ' 식당 — 현상수배 벽보', icon: 'skull', width: 920, html: html, buttons: [{ label: '닫는다', value: null }],
      onBuild: function (el, api) {
        list.forEach(function (p, i) {
          drawWarrant(el, p, i);
          var fl = el.querySelector('[data-flag="' + i + '"]'), im = p.band ? flagImg(p.band, 26) : null; if (fl && im) fl.appendChild(im);
          var card = el.querySelector('[data-wp="' + i + '"]'); if (card) card.onclick = function () { pick = p; api.close('pick'); };
        });
      } });
    var v = await win.result;
    if (v === 'pick' && pick) await W.detail(c, pick);
  };
  /** 벽보 한 장을 크게 — 글로 붙은 벽보라 말을 몰라도 읽는다 */
  W.detail = async function (c, p) {
    var w = st(), b = W.band(p), zs = p.zones.map(zoneName).join(' · ');
    var state = w.paid[p.id] != null ? '현상금은 이미 받았다.' : w.due[p.id] ? '이미 무찔렀다 — 이 식당에서 현상금을 받을 수 있다.' : '이 해적의 함대를 무찌르면 어느 항구 식당에서나 현상금을 준다.';
    var html = '<div class="wp-big"><div class="wp-detail-sheet">' + warrantSheet(p, 'big') + '</div>' +
      '<div style="flex:1;font-size:17px;line-height:1.6"><div style="font-size:26px;font-weight:700">' + U.esc(p.name) + '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin:4px 0 8px"><span data-flag="big"></span><b>' + U.esc(b ? b.name : '해적단') + '</b>' + (b && b.real ? '' : ' <small style="color:#6a5434">(소문 속 해적단)</small>') + '</div>' +
      '<div>' + (p.g === 'f' ? '여해적 · ' : '') + (p.hist ? '실존 인물' : '소문 속 해적') + ' · 무대: ' + U.esc(zs) + '</div>' +
      '<div style="margin:8px 0">' + U.esc(p.desc) + '</div>' +
      (W.absorbed(p.id).length ? '<div style="margin:0 0 8px;color:#7a1e14"><b>흡수한 해적</b> — ' + W.absorbed(p.id).map(function (id) { var q = W.pirate(id); return U.esc(q ? q.name : id); }).join(', ') +
        ' (' + W.absorbed(p.id).length + '/' + AB().max + ') · 배와 선원이 늘어 더 강하다</div>' : '') +
      (b ? '<div style="font-size:15px;color:#5a4424"><b>깃발</b> — ' + U.esc(b.flag) + '</div>' : '') +
      '<div style="margin-top:10px;font-weight:700;color:#7a1e14">' + state + '</div></div></div>';
    var win = UI.window({ title: c.name + ' 식당 — 현상수배 벽보', icon: 'skull', width: 820, html: html, buttons: [{ label: '벽보 앞을 떠난다', value: null }], clickAny: true,
      onBuild: function (el) {
        drawWarrant(el, p, 'big');
        var fl = el.querySelector('[data-flag="big"]'), im = p.band ? flagImg(p.band, 64) : null; if (fl && im) { im.style.width = '64px'; im.style.height = '64px'; fl.appendChild(im); }
      } });
    await win.result;
  };
  W.claim = async function (c) {
    var w = st(), s = S(), ids = Object.keys(w.due); if (!ids.length) return;
    var sum = 0, names = [];
    ids.forEach(function (id) { sum += w.due[id] || 0; w.paid[id] = s.day; var p = W.pirate(id); names.push(p ? p.name : id); delete w.due[id]; });
    s.player.gold += sum;
    if (G.Fame) G.Fame.add('so', Math.min(60, 10 * ids.length));
    if (G.Audio) G.Audio.sfx('coin');
    if (G.Game.refreshHud) G.Game.refreshHud();
    G.State.log(c.name + ' 식당에서 현상금 ' + U.num(sum) + '닢을 받았다 (' + names.join(', ') + ').');
    await G.Scenes.city.say(owner(), names.join(', ') + U.jx(names[names.length - 1], '을/를') + ' 무찌르셨다니! 벽보에 붉은 도장을 찍어 두겠습니다.\f현상금 금화 ' + U.num(sum) + '닢입니다. 손님들이 다들 제독을 쳐다보는군요.');
  };
  W.gossip = async function (c) {
    var w = st(), s = S(), C = G.Scenes.city, k = K(), last = w.rest[c.id];
    if (last && R.sameStay(last[0], last[1])) { await C.say(owner(), '오늘 손님들이 한 이야기는 다 들으셨습니다. 다음에 들르시면 또 새 이야기가 있겠지요.'); return; }
    w.rest[c.id] = [s.day, R.stayNo()];
    var tip = null;
    if (G.MaidTip && U.chance(k.chance)) tip = G.MaidTip.make('named', c, { id: 'restaurant' }, { aff: 40 }, { days: k.days, who: '식당 손님' });
    if (!tip) {
      await C.say(owner(), U.pick(['옆자리 뱃사람들이 크라켄을 봤다느니 인어를 봤다느니 떠드는데… 술이 문제지요. 쓸 만한 이야기는 없었습니다.',
        '오늘은 해적 이야기가 없네요. 다들 날씨와 짐값 이야기뿐입니다.', '해적 두목이 바다 밑 궁전에 산다나요? 허풍이지요. 오늘 들은 건 그게 다입니다.']));
      return;
    }
    var line = G.MaidTip.text(tip);
    G.State.log('식당 손님의 소문: ' + line);
    await C.say(owner(), U.pick(['저쪽 탁자의 선원들이 하는 이야기를 들었는데요… ', '방금 들어온 어부가 그러는데, ']) + '\n' + line + '\f소문이라 오래 머물지는 않을 겁니다. 서두르셔야 할 거예요.');
    UI.toast('수첩 「할 일」에 적었다 — ' + G.CITY_DATA[tip.port].name + ' 앞바다', 'scroll', 4200);
  };

  // ---------------------------------------------------------------- 깃발 그림 (images/items/flag_<해적단>.webp 이 없을 때)
  function flatFlag(b, fw, fh) {
    var c = A.canvas(fw, fh), x = c.getContext('2d'), a = b.art || {};
    if (a.st) { var n = a.st.length; a.st.forEach(function (col, i) { x.fillStyle = col; x.fillRect(0, Math.floor(fh * i / n), fw, Math.ceil(fh / n) + 1); }); }
    else { x.fillStyle = a.bg || '#141414'; x.fillRect(0, 0, fw, fh); }
    if (a.cv) { x.fillStyle = a.cv; x.fillRect(fw * 0.06, fh * 0.2, fw * 0.16, fh * 0.07); x.fillRect(fw * 0.115, fh * 0.08, fw * 0.05, fh * 0.32); }
    if (a.e === 'stgeorge') { x.fillStyle = a.c; x.fillRect(0, fh * 0.42, fw, fh * 0.16); x.fillRect(fw * 0.44, 0, fw * 0.12, fh); }
    var e = A.canvas(fw, fh), y = e.getContext('2d'), cx = fw / 2, cy = fh / 2, Rr = fh * 0.36, col = a.c || '#fff';
    y.fillStyle = col; y.strokeStyle = col; y.lineCap = 'round'; y.lineJoin = 'round';
    emblem(y, a, cx, cy, Rr, col, fw, fh);
    x.drawImage(e, 0, 0);
    return c;
  }
  function circ(y, cx, cy, r) { y.beginPath(); y.arc(cx, cy, r, 0, 7); y.fill(); }
  function hole(y, f) { y.save(); y.globalCompositeOperation = 'destination-out'; f(); y.restore(); }
  function skull(y, cx, cy, r) {
    circ(y, cx, cy - r * 0.15, r * 0.62); y.fillRect(cx - r * 0.34, cy + r * 0.25, r * 0.68, r * 0.38);
    hole(y, function () { circ(y, cx - r * 0.24, cy - r * 0.12, r * 0.15); circ(y, cx + r * 0.24, cy - r * 0.12, r * 0.15); y.beginPath(); y.moveTo(cx, cy + r * 0.05); y.lineTo(cx - r * 0.07, cy + r * 0.18); y.lineTo(cx + r * 0.07, cy + r * 0.18); y.fill();
      for (var i = -1; i <= 1; i++) y.fillRect(cx + i * r * 0.15 - r * 0.02, cy + r * 0.38, r * 0.04, r * 0.25); });
  }
  function bones(y, cx, cy, r) {
    [-1, 1].forEach(function (sd) { y.save(); y.translate(cx, cy); y.rotate(sd * 0.75); y.fillRect(-r * 1.05, -r * 0.08, r * 2.1, r * 0.16); circ(y, -r * 1.05, -r * 0.1, r * 0.11); circ(y, -r * 1.05, r * 0.1, r * 0.11); circ(y, r * 1.05, -r * 0.1, r * 0.11); circ(y, r * 1.05, r * 0.1, r * 0.11); y.restore(); });
  }
  function crescent(y, cx, cy, r) { circ(y, cx, cy, r); hole(y, function () { circ(y, cx + r * 0.35, cy - r * 0.08, r * 0.82); }); }
  function star(y, cx, cy, r, n) { n = n || 5; y.beginPath(); for (var i = 0; i < n * 2; i++) { var rr = i % 2 ? r * 0.45 : r, an = -Math.PI / 2 + i * Math.PI / n; y.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } y.closePath(); y.fill(); }
  function saber(y, cx, cy, r, ang) { y.save(); y.translate(cx, cy); y.rotate(ang); y.beginPath(); y.moveTo(-r * 0.05, r); y.quadraticCurveTo(r * 0.35, 0, -r * 0.05, -r); y.quadraticCurveTo(r * 0.12, 0, r * 0.08, r); y.fill(); y.fillRect(-r * 0.25, r * 0.78, r * 0.5, r * 0.08); y.restore(); }
  function hourglass(y, cx, cy, r) { y.fillRect(cx - r * 0.45, cy - r * 0.8, r * 0.9, r * 0.1); y.fillRect(cx - r * 0.45, cy + r * 0.7, r * 0.9, r * 0.1);
    y.beginPath(); y.moveTo(cx - r * 0.35, cy - r * 0.7); y.lineTo(cx + r * 0.35, cy - r * 0.7); y.lineTo(cx, cy); y.lineTo(cx + r * 0.35, cy + r * 0.7); y.lineTo(cx - r * 0.35, cy + r * 0.7); y.lineTo(cx, cy); y.closePath(); y.fill(); }
  function heart(y, cx, cy, r) { y.beginPath(); y.moveTo(cx, cy + r * 0.7); y.bezierCurveTo(cx - r * 1.1, cy - r * 0.1, cx - r * 0.5, cy - r * 0.9, cx, cy - r * 0.3); y.bezierCurveTo(cx + r * 0.5, cy - r * 0.9, cx + r * 1.1, cy - r * 0.1, cx, cy + r * 0.7); y.fill(); }
  function lily(y, cx, cy, r) {
    y.beginPath(); y.moveTo(cx, cy - r); y.quadraticCurveTo(cx + r * 0.35, cy - r * 0.3, cx, cy + r * 0.2); y.quadraticCurveTo(cx - r * 0.35, cy - r * 0.3, cx, cy - r); y.fill();
    [-1, 1].forEach(function (sd) { y.beginPath(); y.moveTo(cx, cy + r * 0.1); y.quadraticCurveTo(cx + sd * r * 0.9, cy - r * 0.6, cx + sd * r * 0.6, cy + r * 0.3); y.quadraticCurveTo(cx + sd * r * 0.3, cy, cx, cy + r * 0.25); y.fill(); });
    y.fillRect(cx - r * 0.45, cy + r * 0.25, r * 0.9, r * 0.14); y.fillRect(cx - r * 0.08, cy + r * 0.35, r * 0.16, r * 0.45);
  }
  function text(y, ch, cx, cy, r, col) {
    y.fillStyle = col; y.textAlign = 'center'; y.textBaseline = 'middle';
    if (ch.length > 2) { var sz = r * 2 / ch.length; y.font = 'bold ' + Math.round(sz) + 'px serif'; for (var i = 0; i < ch.length; i++) y.fillText(ch[i], cx, cy - r + sz * (i + 0.5)); return; }
    y.font = 'bold ' + Math.round(r * (ch.length > 1 ? 1.1 : 1.7)) + 'px serif'; y.fillText(ch, cx, cy + r * 0.05);
  }
  function emoSil(y, emo, cx, cy, r, col) {
    var sz = Math.round(r * 2), t = A.canvas(sz * 2, sz * 2), z = t.getContext('2d');
    z.textAlign = 'center'; z.textBaseline = 'middle'; z.font = sz + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    z.fillText(emo, sz, sz * 1.05); z.globalCompositeOperation = 'source-in'; z.fillStyle = col; z.fillRect(0, 0, sz * 2, sz * 2);
    y.drawImage(t, cx - sz, cy - sz);
  }
  function emblem(y, a, cx, cy, r, col, fw, fh) {
    var e = a.e;
    if (a.emo && e !== 'stgeorge') { emoSil(y, a.emo, cx, cy, r, col); return; }
    if (a.ch && e !== 'ringch') { text(y, a.ch, cx, cy, r, col); return; }
    switch (e) {
      case 'skull': bones(y, cx, cy + r * 0.25, r * 0.75); skull(y, cx, cy - r * 0.1, r * 0.8); break;
      case 'skullglass': skull(y, cx - r * 0.55, cy, r * 0.75); hourglass(y, cx + r * 0.75, cy, r * 0.65); break;
      case 'skullheart': skull(y, cx, cy - r * 0.15, r * 0.7); heart(y, cx + r * 1.05, cy + r * 0.2, r * 0.4); y.fillRect(cx - r * 1.3, cy - r * 0.05, r * 0.5, r * 0.08); y.fillRect(cx - r * 0.75, cy - r * 0.15, r * 0.06, r * 0.3); y.fillRect(cx - r * 0.5, cy + r * 0.55, r, r * 0.12); break;
      case 'skullsabers': skull(y, cx, cy - r * 0.3, r * 0.65); saber(y, cx - r * 0.3, cy + r * 0.45, r * 0.6, -0.9); saber(y, cx + r * 0.3, cy + r * 0.45, r * 0.6, 0.9); break;
      case 'skullpalm': skull(y, cx - r * 0.35, cy - r * 0.15, r * 0.65); y.fillRect(cx + r * 0.75, cy - r * 0.2, r * 0.1, r * 0.9); for (var p = 0; p < 5; p++) { y.save(); y.translate(cx + r * 0.8, cy - r * 0.25); y.rotate(-2.6 + p * 0.55); y.beginPath(); y.ellipse(r * 0.35, 0, r * 0.38, r * 0.09, 0, 0, 7); y.fill(); y.restore(); } break;
      case 'skullcrown': skull(y, cx, cy + r * 0.1, r * 0.7); y.beginPath(); y.moveTo(cx - r * 0.5, cy - r * 0.55); y.lineTo(cx - r * 0.5, cy - r * 0.95); y.lineTo(cx - r * 0.25, cy - r * 0.72); y.lineTo(cx, cy - r * 1.02); y.lineTo(cx + r * 0.25, cy - r * 0.72); y.lineTo(cx + r * 0.5, cy - r * 0.95); y.lineTo(cx + r * 0.5, cy - r * 0.55); y.closePath(); y.fillStyle = '#e8c35a'; y.fill(); y.fillStyle = col; break;
      case 'hourglass': hourglass(y, cx, cy, r); break;
      case 'crescent': crescent(y, cx - r * 0.1, cy, r * 0.8); break;
      case 'crescent3': crescent(y, cx - r * 0.65, cy - r * 0.35, r * 0.45); crescent(y, cx + r * 0.45, cy - r * 0.35, r * 0.45); crescent(y, cx - r * 0.1, cy + r * 0.5, r * 0.45); break;
      case 'crescentwave': crescent(y, cx - r * 0.1, cy - r * 0.25, r * 0.6); y.lineWidth = r * 0.12; [0.55, 0.85].forEach(function (dy) { y.beginPath(); for (var i = 0; i <= 20; i++) { var xx = cx - r * 1.1 + i * r * 0.11; y.lineTo(xx, cy + r * dy + Math.sin(i * 0.9) * r * 0.08); } y.stroke(); }); break;
      case 'zulfiqar': y.fillRect(cx - r * 0.07, cy - r * 0.35, r * 0.14, r * 1.2); y.beginPath(); y.moveTo(cx - r * 0.07, cy - r * 0.35); y.lineTo(cx - r * 0.25, cy - r * 0.75); y.lineTo(cx, cy - r * 0.5); y.lineTo(cx + r * 0.25, cy - r * 0.75); y.lineTo(cx + r * 0.07, cy - r * 0.35); y.fill(); y.fillRect(cx - r * 0.35, cy + r * 0.55, r * 0.7, r * 0.1);
        crescent(y, cx - r * 0.85, cy - r * 0.55, r * 0.22); crescent(y, cx + r * 0.75, cy - r * 0.55, r * 0.22); crescent(y, cx - r * 0.85, cy + r * 0.4, r * 0.22); star(y, cx + r * 0.85, cy + r * 0.4, r * 0.25, 6); break;
      case 'sabers': saber(y, cx - r * 0.25, cy + r * 0.15, r * 0.75, -0.7); saber(y, cx + r * 0.25, cy + r * 0.15, r * 0.75, 0.7); y.fillStyle = '#fff'; crescent(y, cx, cy - r * 0.75, r * 0.25); break;
      case 'maltese': for (var q = 0; q < 4; q++) { y.save(); y.translate(cx, cy); y.rotate(q * Math.PI / 2); y.beginPath(); y.moveTo(0, -r * 0.08); y.lineTo(-r * 0.45, -r * 0.85); y.lineTo(0, -r * 0.62); y.lineTo(r * 0.45, -r * 0.85); y.closePath(); y.fill(); y.restore(); } break;
      case 'ordercross': y.fillRect(cx - r * 0.2, cy - r * 0.85, r * 0.4, r * 1.7); y.fillRect(cx - r * 0.85, cy - r * 0.2, r * 1.7, r * 0.4); y.fillStyle = '#fff'; y.fillRect(cx - r * 0.05, cy - r * 0.75, r * 0.1, r * 1.5); y.fillRect(cx - r * 0.75, cy - r * 0.05, r * 1.5, r * 0.1); break;
      case 'stgeorge': if (a.emo) emoSil(y, a.emo, cx, cy, r * 0.55, '#141414'); break;
      case 'burgundy': y.lineWidth = r * 0.2; [-1, 1].forEach(function (sd) { y.beginPath(); y.moveTo(cx - r * 1.1, cy - sd * r * 0.9); y.lineTo(cx + r * 1.1, cy + sd * r * 0.9); y.stroke(); for (var k = -2; k <= 2; k++) circ(y, cx + k * r * 0.42, cy + sd * k * r * 0.35, r * 0.12); }); break;
      case 'huguenot': y.fillRect(cx - r * 0.12, cy - r * 0.9, r * 0.24, r * 1.2); y.fillRect(cx - r * 0.55, cy - r * 0.45, r * 1.1, r * 0.22); y.beginPath(); y.ellipse(cx, cy + r * 0.62, r * 0.32, r * 0.16, 0, 0, 7); y.fill(); y.beginPath(); y.moveTo(cx - r * 0.1, cy + r * 0.6); y.lineTo(cx - r * 0.45, cy + r * 0.35); y.lineTo(cx - r * 0.2, cy + r * 0.6); y.fill(); break;
      case 'lily3': lily(y, cx - r * 0.75, cy - r * 0.35, r * 0.42); lily(y, cx + r * 0.75, cy - r * 0.35, r * 0.42); lily(y, cx, cy + r * 0.45, r * 0.42); break;
      case 'ship': y.beginPath(); y.moveTo(cx - r, cy + r * 0.35); y.lineTo(cx + r, cy + r * 0.35); y.lineTo(cx + r * 0.7, cy + r * 0.7); y.lineTo(cx - r * 0.7, cy + r * 0.7); y.fill(); y.fillRect(cx - r * 0.04, cy - r * 0.9, r * 0.08, r * 1.25); y.beginPath(); y.moveTo(cx + r * 0.08, cy - r * 0.85); y.quadraticCurveTo(cx + r * 0.75, cy - r * 0.3, cx + r * 0.08, cy + r * 0.25); y.fill(); y.fillStyle = '#e8c35a'; lily(y, cx - r * 0.5, cy - r * 0.35, r * 0.3); break;
      case 'axe': y.lineWidth = r * 0.1; y.beginPath(); y.arc(cx, cy, r * 0.9, 0.3, 2.6); y.stroke(); y.fillRect(cx - r * 0.06, cy - r * 0.8, r * 0.12, r * 1.6); y.beginPath(); y.moveTo(cx, cy - r * 0.75); y.quadraticCurveTo(cx + r * 0.7, cy - r * 0.8, cx + r * 0.65, cy - r * 0.15); y.quadraticCurveTo(cx + r * 0.3, cy - r * 0.35, cx, cy - r * 0.3); y.fill(); break;
      case 'key': y.lineWidth = r * 0.16; y.beginPath(); y.arc(cx - r * 0.55, cy, r * 0.35, 0, 7); y.stroke(); y.fillRect(cx - r * 0.2, cy - r * 0.08, r * 1.15, r * 0.16); y.fillRect(cx + r * 0.6, cy, r * 0.12, r * 0.35); y.fillRect(cx + r * 0.82, cy, r * 0.12, r * 0.28); break;
      case 'coral': y.lineWidth = r * 0.14; (function br(x0, y0, an, len, d) { if (d > 4) return; var x1 = x0 + Math.cos(an) * len, y1 = y0 + Math.sin(an) * len; y.beginPath(); y.moveTo(x0, y0); y.lineTo(x1, y1); y.stroke(); circ(y, x1, y1, r * 0.06); br(x1, y1, an - 0.5, len * 0.72, d + 1); br(x1, y1, an + 0.45, len * 0.7, d + 1); })(cx, cy + r * 0.95, -Math.PI / 2, r * 0.6, 0); break;
      case 'flame': for (var f = -1; f <= 1; f++) { var fx = cx + f * r * 0.5, h2 = f ? r * 1.2 : r * 1.7; y.beginPath(); y.moveTo(fx, cy + r * 0.8 - h2); y.quadraticCurveTo(fx + r * 0.5, cy, fx + r * 0.3, cy + r * 0.8); y.lineTo(fx - r * 0.3, cy + r * 0.8); y.quadraticCurveTo(fx - r * 0.5, cy, fx, cy + r * 0.8 - h2); y.fill(); } break;
      case 'lotus': for (var l = -2; l <= 2; l++) { y.save(); y.translate(cx, cy + r * 0.45); y.rotate(l * 0.42); y.beginPath(); y.ellipse(0, -r * 0.55, r * 0.2, r * 0.55, 0, 0, 7); y.fill(); y.restore(); } y.lineWidth = r * 0.1; y.beginPath(); y.moveTo(cx - r * 1.1, cy + r); y.lineTo(cx + r * 1.1, cy + r * 0.6); y.moveTo(cx - r * 1.1, cy + r * 0.6); y.lineTo(cx + r * 1.1, cy + r); y.stroke(); break;
      case 'pillars': for (var c2 = -1; c2 <= 1; c2++) { y.fillRect(cx + c2 * r * 0.6 - r * 0.13, cy - r * 0.6 + Math.abs(c2) * r * 0.25, r * 0.26, r * 1.1); y.fillRect(cx + c2 * r * 0.6 - r * 0.2, cy - r * 0.68 + Math.abs(c2) * r * 0.25, r * 0.4, r * 0.1); } y.lineWidth = r * 0.12; y.beginPath(); for (var i2 = 0; i2 <= 22; i2++) y.lineTo(cx - r * 1.2 + i2 * r * 0.11, cy + r * 0.6 + Math.sin(i2) * r * 0.07); y.stroke(); break;
      case 'tree': y.fillRect(cx - r * 0.1, cy - r * 0.1, r * 0.2, r); y.beginPath(); y.ellipse(cx, cy - r * 0.35, r * 0.95, r * 0.45, 0, Math.PI, 0); y.fill(); for (var t2 = -2; t2 <= 2; t2++) y.fillRect(cx + t2 * r * 0.3 - r * 0.03, cy - r * 0.35, r * 0.06, r * (0.25 + (t2 + 2) % 3 * 0.12)); break;
      case 'island': circ(y, cx, cy, r * 0.85); hole(y, function () { y.fillRect(cx - r, cy - r * 0.07, r * 2, r * 0.14); }); break;
      case 'weed': y.lineWidth = r * 0.1; for (var w2 = -2; w2 <= 2; w2++) { y.beginPath(); for (var j = 0; j <= 16; j++) y.lineTo(cx + w2 * r * 0.35 + Math.sin(j * 0.8 + w2) * r * 0.18, cy + r - j * r * 0.12); y.stroke(); for (var j2 = 2; j2 < 16; j2 += 4) { y.beginPath(); y.ellipse(cx + w2 * r * 0.35 + r * 0.1, cy + r - j2 * r * 0.12, r * 0.12, r * 0.05, 0.6, 0, 7); y.fill(); } } break;
      case 'galley': y.beginPath(); y.moveTo(cx - r * 1.1, cy); y.lineTo(cx + r * 1.1, cy); y.lineTo(cx + r * 0.8, cy + r * 0.3); y.lineTo(cx - r * 0.8, cy + r * 0.3); y.fill(); y.lineWidth = r * 0.06; for (var o = 0; o < 8; o++) { var ox = cx - r * 0.7 + o * r * 0.2; y.beginPath(); y.moveTo(ox, cy + r * 0.2); y.lineTo(ox - r * 0.15, cy + r * 0.75); y.stroke(); } y.fillRect(cx - r * 0.04, cy - r * 0.9, r * 0.08, r * 0.9); y.beginPath(); y.moveTo(cx - r * 0.5, cy - r * 0.8); y.lineTo(cx + r * 0.5, cy - r * 0.8); y.lineTo(cx + r * 0.4, cy - r * 0.15); y.lineTo(cx - r * 0.4, cy - r * 0.15); y.fill(); break;
      case 'tower': y.beginPath(); y.moveTo(cx - r * 0.3, cy + r * 0.9); y.lineTo(cx - r * 0.18, cy - r * 0.55); y.lineTo(cx + r * 0.18, cy - r * 0.55); y.lineTo(cx + r * 0.3, cy + r * 0.9); y.fill(); y.fillRect(cx - r * 0.26, cy - r * 0.8, r * 0.52, r * 0.22); circ(y, cx, cy - r * 0.95, r * 0.12); saber(y, cx - r * 0.75, cy + r * 0.2, r * 0.55, -0.4); saber(y, cx + r * 0.75, cy + r * 0.2, r * 0.55, 0.4); break;
      case 'hook': y.lineWidth = r * 0.16; y.beginPath(); y.moveTo(cx - r * 0.2, cy - r * 0.9); y.lineTo(cx - r * 0.2, cy + r * 0.3); y.arc(cx + r * 0.15, cy + r * 0.3, r * 0.35, Math.PI, 0, true); y.lineTo(cx + r * 0.5, cy); y.stroke(); y.beginPath(); y.ellipse(cx + r * 0.7, cy - r * 0.55, r * 0.35, r * 0.13, 0.3, 0, 7); y.fill(); break;
      case 'sun': circ(y, cx, cy, r * 0.5); y.lineWidth = r * 0.1; for (var s2 = 0; s2 < 12; s2++) { var an = s2 * Math.PI / 6; y.beginPath(); y.moveTo(cx + Math.cos(an) * r * 0.62, cy + Math.sin(an) * r * 0.62); y.lineTo(cx + Math.cos(an) * r * 0.95, cy + Math.sin(an) * r * 0.95); y.stroke(); } hole(y, function () { circ(y, cx - r * 0.17, cy - r * 0.08, r * 0.07); circ(y, cx + r * 0.17, cy - r * 0.08, r * 0.07); y.fillRect(cx - r * 0.18, cy + r * 0.18, r * 0.36, r * 0.06); }); break;
      case 'armsword': y.fillRect(cx - r * 1.0, cy + r * 0.25, r * 0.95, r * 0.28); circ(y, cx - r * 0.05, cy + r * 0.38, r * 0.2); y.save(); y.translate(cx + r * 0.05, cy + r * 0.3); y.rotate(-0.6); y.fillRect(-r * 0.05, -r * 1.2, r * 0.1, r * 1.1); y.fillRect(-r * 0.25, -r * 0.12, r * 0.5, r * 0.08); y.restore(); break;
      case 'motto': y.fillStyle = col; y.textAlign = 'center'; y.textBaseline = 'middle'; y.font = 'bold ' + Math.round(fh * 0.16) + 'px serif'; y.fillText('A DEO', cx, cy - fh * 0.12); y.fillText('A LIBERTATE', cx, cy + fh * 0.12); break;
      case 'kris': [-1, 1].forEach(function (sd) { y.save(); y.translate(cx, cy); y.rotate(sd * 0.7); y.beginPath(); for (var i3 = 0; i3 <= 12; i3++) y.lineTo(Math.sin(i3 * 1.3) * r * 0.08 + r * 0.06, -r * 0.95 + i3 * r * 0.11); for (var i4 = 12; i4 >= 0; i4--) y.lineTo(Math.sin(i4 * 1.3) * r * 0.08 - r * 0.06, -r * 0.95 + i4 * r * 0.11); y.fill(); y.fillRect(-r * 0.12, r * 0.4, r * 0.24, r * 0.45); y.restore(); }); break;
      case 'durian': circ(y, cx, cy, r * 0.6); for (var d2 = 0; d2 < 16; d2++) { var a2 = d2 * Math.PI / 8; y.beginPath(); y.moveTo(cx + Math.cos(a2 - 0.15) * r * 0.55, cy + Math.sin(a2 - 0.15) * r * 0.55); y.lineTo(cx + Math.cos(a2) * r * 0.85, cy + Math.sin(a2) * r * 0.85); y.lineTo(cx + Math.cos(a2 + 0.15) * r * 0.55, cy + Math.sin(a2 + 0.15) * r * 0.55); y.fill(); } break;
      case 'coconut': y.beginPath(); y.ellipse(cx - r * 0.35, cy, r * 0.45, r * 0.65, 0, 0, 7); y.fill(); y.beginPath(); y.ellipse(cx + r * 0.35, cy, r * 0.45, r * 0.65, 0, 0, 7); y.fill(); break;
      case 'peaks': for (var k2 = 0; k2 < 5; k2++) { var px = cx - r * 1.0 + k2 * r * 0.5, ph = k2 === 2 ? r * 1.5 : k2 % 2 ? r * 1.1 : r * 0.8; y.beginPath(); y.moveTo(px - r * 0.35, cy + r * 0.7); y.lineTo(px, cy + r * 0.7 - ph); y.lineTo(px + r * 0.35, cy + r * 0.7); y.fill(); } break;
      case 'fish2': [-1, 1].forEach(function (sd) { y.save(); y.translate(cx, cy + sd * r * 0.4); y.scale(-sd, 1); y.beginPath(); y.ellipse(r * 0.15, 0, r * 0.55, r * 0.22, 0, 0, 7); y.fill(); y.beginPath(); y.moveTo(-r * 0.35, 0); y.lineTo(-r * 0.75, -r * 0.25); y.lineTo(-r * 0.75, r * 0.25); y.fill(); y.restore(); }); break;
      case 'ringch': y.lineWidth = r * 0.16; y.beginPath(); y.arc(cx, cy, r * 0.85, 0, 7); y.stroke(); text(y, a.ch || '上', cx, cy, r * 0.62, col); break;
      case 'twoisles': circ(y, cx - r * 0.5, cy + r * 0.25, r * 0.45); circ(y, cx + r * 0.55, cy + r * 0.3, r * 0.38); hole(y, function () { y.fillRect(0, cy + r * 0.35, fw, fh); }); y.lineWidth = r * 0.1; y.beginPath(); for (var i5 = 0; i5 <= 22; i5++) y.lineTo(cx - r * 1.2 + i5 * r * 0.11, cy + r * 0.65 + Math.sin(i5) * r * 0.07); y.stroke(); break;
      case 'mermaid': circ(y, cx - r * 0.35, cy - r * 0.62, r * 0.2); y.beginPath(); y.moveTo(cx - r * 0.55, cy - r * 0.42); y.quadraticCurveTo(cx - r * 0.35, cy - r * 0.48, cx - r * 0.15, cy - r * 0.42); y.lineTo(cx - r * 0.05, cy);
        y.quadraticCurveTo(cx + r * 0.1, cy + r * 0.45, cx + r * 0.55, cy + r * 0.5); y.quadraticCurveTo(cx + r * 0.2, cy + r * 0.62, cx - r * 0.2, cy + r * 0.35); y.quadraticCurveTo(cx - r * 0.55, cy + r * 0.1, cx - r * 0.55, cy - r * 0.42); y.fill();
        y.beginPath(); y.moveTo(cx + r * 0.5, cy + r * 0.5); y.lineTo(cx + r * 0.95, cy + r * 0.2); y.lineTo(cx + r * 0.8, cy + r * 0.55); y.lineTo(cx + r * 1.0, cy + r * 0.85); y.closePath(); y.fill();
        y.lineWidth = r * 0.07; y.beginPath(); y.moveTo(cx - r * 0.5, cy - r * 0.75); y.quadraticCurveTo(cx - r * 0.9, cy - r * 0.4, cx - r * 0.75, cy - r * 0.05); y.stroke(); break;
      case 'naga': y.lineWidth = r * 0.2; y.beginPath(); y.moveTo(cx - r * 0.9, cy + r * 0.8); y.bezierCurveTo(cx - r * 0.1, cy + r * 1.0, cx + r * 0.6, cy + r * 0.5, cx, cy + r * 0.1); y.bezierCurveTo(cx - r * 0.4, cy - r * 0.2, cx - r * 0.1, cy - r * 0.4, cx, cy - r * 0.35); y.stroke();
        for (var h3 = -3; h3 <= 3; h3++) { var ha = -Math.PI / 2 + h3 * 0.36, hx = cx + Math.cos(ha) * r * 0.75, hy = cy - r * 0.3 + Math.sin(ha) * r * 0.55; y.lineWidth = r * 0.09; y.beginPath(); y.moveTo(cx, cy - r * 0.3); y.lineTo(hx, hy); y.stroke(); y.beginPath(); y.ellipse(hx, hy, r * 0.13, r * 0.09, ha, 0, 7); y.fill(); } break;
      case 'pennant': break;
      default: skull(y, cx, cy, r * 0.8);
    }
  }
  /** 해적 깃발 그림 — 깃대에 매달려 나부끼는 깃발 (그림이 없을 때) */
  W.flagArt = function (bandId, w, h, opts) {
    w = w || 256; h = h || w; opts = opts || {};
    var b = (G.PIRATE_BANDS || {})[bandId] || { art: {} }, c = A.canvas(w, h), x = c.getContext('2d'), m = Math.min(w, h);
    if (!opts.transparent) {
      var g = x.createRadialGradient(w / 2, h * 0.42, m * 0.05, w / 2, h / 2, m * 0.75); g.addColorStop(0, '#3a2a1a'); g.addColorStop(1, '#100804'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    var px = w * 0.16, fy = h * 0.16, fw = Math.round(w * 0.72), fh = Math.round(h * 0.5);
    var flat = flatFlag(b, fw, fh), pen = b.art && b.art.e === 'pennant';
    // 나부끼는 깃발: 세로 띠마다 조금씩 내려 그린다
    var strips = Math.max(8, Math.round(fw / 3));
    x.save();
    if (pen) { x.beginPath(); x.moveTo(px, fy); x.lineTo(px + fw, fy + fh * 0.5); x.lineTo(px, fy + fh); x.closePath(); x.clip(); }
    for (var i = 0; i < strips; i++) {
      var sx = Math.floor(fw * i / strips), sw = Math.ceil(fw / strips) + 1, t = i / strips, dy = Math.sin(t * Math.PI * 2.2) * fh * 0.06 * t;
      x.drawImage(flat, sx, 0, sw, fh, px + sx, fy + dy, sw, fh);
      x.fillStyle = 'rgba(0,0,0,' + (0.18 * Math.max(0, Math.cos(t * Math.PI * 2.2))) + ')'; x.fillRect(px + sx, fy + dy, sw, fh);
    }
    x.restore();
    // 깃대
    x.fillStyle = '#5a3a1e'; x.fillRect(px - m * 0.03, h * 0.1, m * 0.035, h * 0.82);
    x.fillStyle = '#d9a93e'; x.beginPath(); x.arc(px - m * 0.013, h * 0.1, m * 0.035, 0, 7); x.fill();
    return c;
  };
  // 소지품·진열 그림: kind 'flag'는 깃발 그림 (js/art/pictures.js relicArt를 감싼다)
  if (A && A.relicArt && !A._flagArt) {
    A._flagArt = true;
    var ora = A.relicArt;
    A.relicArt = function (r, w, h, opts) {
      if (!r || r.kind !== 'flag') return ora.apply(this, arguments);
      var band = r.band || String(r.id).replace(/^flag_/, '');
      w = w || 256; h = h || w;
      function fallback() { return W.flagArt(band, w, h, opts); }
      return G.Img.make(['items/flag_' + band], w, h, fallback, { fit: 'contain' });
    };
  }

  // ---------------------------------------------------------------- 잇기
  function hook() {
    if (W.hooked) return;
    var C = G.Scenes && G.Scenes.city, T = C && C.B && C.B.restaurant;
    if (!T || !G.Captains || !G.Lair) return;
    W.hooked = true;
    var om = T.menu;
    T.menu = function (c) {
      var rows = om.apply(this, arguments) || [], zone = zoneOf(c), n = W.posters(zone).length, due = W.due(), w = st(), last = w && w.rest[c.id];
      rows.push({ label: '현상수배 벽보를 본다', icon: 'skull', sub: n ? zoneName(zone) + '의 이름난 해적 ' + n + '명' : '붙은 벽보가 없다', onClick: function () { return W.board(c); } });
      if (due) rows.push({ label: '현상금을 받는다', icon: 'coin', sub: '금화 ' + U.num(due) + '닢', onClick: function () { return W.claim(c); } });
      rows.push({ label: '손님들의 해적 이야기를 듣는다', icon: 'people', sub: last && R.sameStay(last[0], last[1]) ? '이번에는 이미 들었다' : '이름난 해적의 행방을 들을지도', onClick: function () { return W.gossip(c); } });
      return rows;
    };
    var SF = G.SeaFolk, osd = SF && SF.decorate;
    if (osd) SF.decorate = function (n) { var r = osd.apply(this, arguments); try { if (n && n.cap && n.kind === 'pirate') W.empower(n); } catch (e) { console.error(e); } return r; };
    var oca = G.Captains.afterBattle;
    G.Captains.afterBattle = function (n, res, ships, lines) {
      var r = oca.apply(this, arguments);
      try { if (res === 'win' && n && !n.lairChief) W.afterWin(n, lines); } catch (e) { console.error(e); }
      return r;
    };
    var ola = G.Lair.afterBattle;
    G.Lair.afterBattle = function (npc, res, ships, lines) {
      var z = npc && npc.lairChief, before = z ? G.Lair.held(z) : true;
      var r = ola.apply(this, arguments);
      try { if (z && !before && G.Lair.held(z)) { var d = G.Lair.data(z); if (d && d.band) giveFlag(d.band, lines, U.esc(d.place) + ' 소굴의 깃대에서 내렸다.'); } } catch (e) { console.error(e); }
      return r;
    };
    var olh = G.Lair.html;
    if (olh) G.Lair.html = function () { var h = olh.apply(this, arguments) || ''; return h + (h ? '<p class="muted" style="margin:6px 0 0">모은 해적 깃발 ' + W.flagCount() + '/' + W.flagTotal() + ' — 식당의 현상수배 벽보 · 여급과 식당 손님의 해적 소문</p>' : ''); };
  }
  W.hook = hook;
  hook();
  if (!W.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
