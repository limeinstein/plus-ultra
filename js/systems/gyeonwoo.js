/* 견우와 직녀 (G.Gyeonwoo) — 자료·대사·조정값: js/data/gyeonwoo.js (G.GYEONWOO · G.BALANCE.gyeonwoo)
   ■ 언제: 거북선을 기함으로 두고 조선 도시에 들어설 때, 항주·사카이를 이미 알고 있으면 오작 할멈이 부탁한다 (한 번 끝나면 다시 없다).
   ■ 흐름 (state.gw.stage): 1 항주에서 견우를 태운다 → 2 사카이에서 직녀를 태운다 → 3 한산도에서 혼례 → 끝(end).
     혼례 뒤 부부로 부하가 되면 두 사람은 「부부」로 묶인다(G.Romance의 커플 한 쌍 규칙과는 따로 — pairOf).
     부하로 맞지 않으면 직녀가 일본도를 건넨다.
   ■ 저장: state.gw = { stage, since, next, how(항주에서 어떻게 데려왔나), aboard: ['gyeonwoo', …], end: 'crew'|'gift', wed: yyyymmdd } */
(function (G) {
  'use strict';
  var U = G.U, GW = {};
  G.Gyeonwoo = GW;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.gyeonwoo) || {}; }
  function L() { return G.GYEONWOO; }
  GW.st = function () { var s = S(); return s ? s.gw || null : null; };
  function ensure() { var s = S(); if (!s.gw) s.gw = { stage: 0, aboard: [] }; return s.gw; }

  // ---------------------------------------------------------------- 말하는 사람
  function face(seed, role, style, g, key) {
    var A = G.Art; return { portrait: A.withImg(A.npcSpec(seed, role, style, g), key ? [key] : []), half: key ? [key + '_half'] : null };
  }
  function mate(id) {
    var d = G.MATE[id]; return { name: d.name, rigId: 'mate:' + id, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };
  }
  function who(code) {
    var f;
    if (code === 'a') return mate('gyeonwoo');
    if (code === 'c') return mate('jiknyeo');
    if (code === 'g') { f = face('gw_ojak', 'keeper', 'kr', 'f', 'portraits/street-folk/grandmother_kr'); return { name: '오작 할멈', portrait: f.portrait, half: f.half, lang: 3 }; }
    if (code === 'b') { f = face('gw_master', 'soldier', 'cn', 'm', 'portraits/street-folk/elder_cn'); return { name: '견(甄) 사부', portrait: f.portrait, half: f.half, lang: 3 }; }
    if (code === 'o') { f = face('gw_nobunaga', 'king', 'jp', 'm', 'portraits/legendary/oda_nobunaga'); return { name: '오다 노부나가', portrait: f.portrait, half: f.half, lang: 3, special: true }; }
    if (code === 'r') { f = face('gw_retainer', 'soldier', 'jp', 'm', 'portraits/npc-roles/jp/soldier'); return { name: '오다 가문의 가신', portrait: f.portrait, half: f.half, lang: 3 }; }
    return {};
  }
  /** 'x:…' 줄들을 차례로 말한다 (x = 말하는 사람, n = 설명) */
  async function lines(list, extra) {
    list = [].concat(list || []);
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]), code = l.charAt(0), t = l.slice(2);
      for (var k in extra || {}) t = t.split('{' + k + '}').join(extra[k]);
      await G.UI.say(t, code === 'n' ? {} : who(code));
    }
  }

  // ---------------------------------------------------------------- 조건
  function joseon(c) { var own = G.R.cityOwner ? G.R.cityOwner(c) : c.nation; return own === '조선' || (c.style === 'kr' && c.nation === '조선'); }
  function flagship() { var sh = S().fleet.ships[0]; return sh && sh.type === (K().ship || 'geobukseon'); }
  function knows(id) { var s = S(); return (s.known || []).indexOf(id) >= 0 || !!(s.visited && s.visited[id]); }
  /** 부탁을 받을 수 있는가 */
  GW.ready = function (c) {
    var s = S(), g = GW.st(), b = K();
    if (!c || !joseon(c) || (g && (g.end || g.stage > 0)) || (g && g.next && s.day < g.next)) return false;
    if (!flagship()) return false;
    if (!knows(b.hangzhou) || !knows(b.sakai)) return false;
    return !['gyeonwoo', 'jiknyeo'].some(function (id) { return s.mates.some(function (m) { return m.id === id; }); });
  };
  /** 항주 수문장은 오작 할멈의 편지(견 사부의 도장)를 보면 이번만 눈을 감는다 — 견우를 태우러 가는 동안만 (js/scenes/city.js C.entryCheck) */
  GW.letIn = function (c) { var g = GW.st(); return !!(c && g && !g.end && g.stage === 1 && c.id === K().hangzhou); };
  GW.active = function () { var g = GW.st(); return !!(g && g.stage > 0 && !g.end); };

  // ---------------------------------------------------------------- 도시에 들어설 때 (js/scenes/city.js)
  GW.arrival = async function (c) {
    var g = GW.st(), b = K(); if (!c) return;
    if (GW.ready(c)) return offer(c);
    if (!GW.active()) return;
    if (g.stage === 1 && c.id === b.hangzhou) return hangzhou(c);
    if (g.stage === 2 && c.id === b.sakai) return sakai(c);
    if (g.stage === 3 && c.id === b.hansan) return hansan(c);
  };

  async function offer(c) {
    var D = L(), s = S(), g = ensure();
    await lines(D.offer);
    var v = await G.UI.ask(D.offerAsk, [{ label: D.offerYes, value: 'yes' }, { label: D.offerNo, value: 'no' }], who('g'));
    if (v !== 'yes') { g.next = s.day + (K().retry || 30); await lines([D.offerNoSay]); return; }
    g.stage = 1; g.since = s.day; g.aboard = [];
    await lines([D.offerYesSay]);
    G.State.log('오작 할멈에게서 견우와 직녀를 한산도로 데려와 달라는 부탁을 받았다.');
    G.UI.toast('견우와 직녀 — 항주에서 견우를 태우자', 'heart', 5000);
  }
  async function hangzhou(c) {
    var D = L(), g = GW.st();
    var pc = G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/gyeonwoo_hangzhou', title: '은하수 건너편의 사내' }) : null;
    try {
      await lines(D.hz);
      var v = await G.UI.ask(D.hzAsk, [{ label: D.hzTalk, value: 'talk' }, { label: D.hzNight, value: 'night' }], who('b'));
      await lines(v === 'talk' ? D.hzTalkSay : D.hzNightSay);
      g.how = v; g.aboard = ['gyeonwoo']; g.stage = 2;
      G.State.log('항주에서 견우를 배에 태웠다.');
      G.UI.toast(D.hzBoard, 'sail', 5000);
    } finally { if (pc) await pc.stop(); }
  }
  async function sakai(c) {
    var D = L(), g = GW.st(), y = S().date.y;
    var pc = G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/jiknyeo_sakai', title: '몇 해 만의 상봉' }) : null;
    try {
      await lines(D.sk);
      await lines(y <= (K().nobunagaUntil || 1582) ? D.nobu : D.nobuGone);
      g.aboard = ['gyeonwoo', 'jiknyeo']; g.stage = 3;
      G.State.log('사카이에서 직녀를 배에 태웠다.');
      G.UI.toast(D.skBoard, 'sail', 5000);
    } finally { if (pc) await pc.stop(); }
  }
  async function hansan(c) {
    var D = L(), g = GW.st(), s = S(), b = K(), UI = G.UI;
    var pc = G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'romance-events/05_harbor_wedding', title: '한산도의 칠석 혼례' }) : null;
    try { await lines(D.hs); } finally { if (pc) await pc.stop(); }
    g.wed = U.dateNum(s.date); g.aboard = [];
    if (G.Fame) G.Fame.add('so', b.fame || 0);
    if (G.Audio) G.Audio.sfx('cheer');
    var wage = G.MATE.gyeonwoo.wage + G.MATE.jiknyeo.wage;
    var v = await UI.ask(D.joinAsk, [{ label: D.joinYes.replace('{wage}', U.num(wage)), value: 'yes' }, { label: D.joinNo, value: 'no' }], who('c'));
    if (v === 'yes') {
      ['gyeonwoo', 'jiknyeo'].forEach(function (id) {
        var nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null;
        if (!nm) nm = s.mates.filter(function (x) { return x.id === id; })[0] || null;   // 이미 배에 있으면 그 줄을 쓴다 (두 줄이 되지 않게)
        if (!nm) { nm = { id: id, role: 'none', joined: U.dateNum(s.date), loyal: b.loyal || 90, from: c.id }; s.mates.push(nm); }
        nm.loyal = Math.max(nm.loyal || 0, b.loyal || 90);
      });
      await lines(D.joinYesSay);
      g.end = 'crew';
      G.State.log('견우와 직녀가 부부로 부하가 되었다.');
      UI.toast('견우 ♥ 직녀 — 부부로 부하가 되었다', 'heart', 5000);
    } else {
      await lines(D.joinNoSay);
      var ok = G.R.addItem(b.gift || 'katana');
      g.end = 'gift';
      await UI.say(D.joinNoAfter, {});
      UI.toast(ok ? '직녀의 선물 — ' + ((G.ITEM[b.gift || 'katana'] || {}).name || '일본도') + U.jx((G.ITEM[b.gift || 'katana'] || {}).name || '일본도', '을/를') + ' 받았다' : '소지품이 가득 차 선물을 받지 못했다', 'chest', 5000);
      G.State.log('견우와 직녀를 한산도에 남겨 두고, 직녀에게서 일본도를 받았다.');
    }
  }

  // ---------------------------------------------------------------- 부부 (G.Romance.pairOf에서 함께 본다)
  GW.pairOf = function (id) {
    var g = GW.st(), s = S(); if (!g || g.end !== 'crew' || (id !== 'gyeonwoo' && id !== 'jiknyeo')) return null;
    var here = function (x) { return s.mates.some(function (m) { return m.id === x; }); };
    if (!here('gyeonwoo') || !here('jiknyeo')) return null;
    return { m: 'gyeonwoo', f: 'jiknyeo', stage: 'wed', heat: 100, wed: g.wed, fixed: true };
  };

  // ---------------------------------------------------------------- 수첩
  GW.html = function () {
    var g = GW.st(); if (!GW.active()) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">견우와 직녀</h4><div class="kv"><div>할 일</div><div>' + (L().note[g.stage] || '') + '</div>' +
      '<div>태운 사람</div><div>' + ((g.aboard || []).map(function (id) { return G.MATE[id].name; }).join(' · ') || '없음') + '</div></div>';
  };
})(window.G = window.G || {});
