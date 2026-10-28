/* 철포 삼백 자루 (G.Teppo) — 자료·대사·조정값: js/data/teppo.js (G.TEPPO · G.BALANCE.teppo)  2026-10-28 사용자 요청
   ■ 언제: 1554~1581년에 일본의 항구 도시에 들어서면 오다 노부나가의 졸병 기노시타 도키치로(훗날의 도요토미 히데요시)가 찾아와
     남만 총 300자루를 부탁한다. 사양하면 두 달 뒤 일본의 항구에서 다시 묻는다. 한 번 끝나면(전했거나 기한을 넘겼거나) 다시 없다.
   ■ 흐름 (state.teppo.stage): 0 아직 · 1 맡았다(기한 2년) → 교역품 「총」 300을 싣고 사카이에 들어서면 부두에서 전한다 → end 'done'
     · 혼노지의 변(1582.6.21) 전: 도키치로가 세고 노부나가가 몸소 시험 사격 — 「말 탄 적이 달려들면?」 네 갈래 대답(tactic) → 값 + 명물 차통
     · 그 뒤: 하시바 히데요시가 받는다 → 값 + 금 표주박
     · 기한을 넘기면 end 'failed' (사교 명성 −)
   ■ 뒷이야기: 전한 사람·만난 사람에게만 오는 소식 (G.TEPPO.news) — 나가시노 · 기즈가와 어귀 · 혼노지 · 야마자키 · 천하 통일.
     제독이 노부나가에게 한 말이 들어맞으면 전투 명성이 붙는다.
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/teppo_*.webp — images/legend-events/TEPPO_PROMPT.md
   ■ 끼어드는 곳: 하루(js/systems/world.js) · 도시에 들어설 때(js/scenes/city.js) · 수첩(js/ui/info.js) · 소문(js/data/eventrumors.js)
   ■ 저장: state.teppo = { stage, met, next, taken, due, reminded, done, by: 'nobu'|'hide', tactic, paid, seen: {소식 번호: 1}, end: 'done'|'failed' }
     없으면 아직 일어나지 않은 것(옛 저장 그대로 열린다). */
(function (G) {
  'use strict';
  var U = G.U;
  var T = G.Teppo = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.teppo) || {}; }
  function L() { return G.TEPPO; }
  T.st = function () { var s = S(); return s ? s.teppo || null : null; };
  function ensure() { var s = S(); if (!s.teppo) s.teppo = { stage: 0 }; if (!s.teppo.seen) s.teppo.seen = {}; return s.teppo; }
  function today() { return U.dateNum(S().date); }
  /** [[날, 값], …] 표에서 오늘(또는 d)보다 뒤인 첫 줄의 값 */
  function byDate(tab, d) { d = d || today(); for (var i = 0; i < tab.length; i++) if (d < tab[i][0]) return tab[i][1]; return tab[tab.length - 1][1]; }
  function numDate(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }

  // ---------------------------------------------------------------- 말하는 사람
  /** 도키치로 → 하시바 → 도요토미 (날짜에 따라 이름이 바뀐다) */
  T.hideName = function (d) { d = d || today(); return d < 15730801 ? '기노시타 도키치로' : d < 15870101 ? '하시바 히데요시' : '도요토미 히데요시'; };
  function face(seed, role, g, key) {
    var A = G.Art; return { portrait: A.withImg(A.npcSpec(seed, role, 'jp', g), key ? [key] : []), half: key ? [key + '_half'] : null };
  }
  function who(code) {
    var f;
    if (code === 't') {
      var hideKey = today() < 15730801 ? 'teppo_tokichiro' : 'teppo_hideyoshi';
      f = face('teppo_hide', 'soldier', 'm', 'portraits/history/' + hideKey);
      return { name: T.hideName(), portrait: f.portrait, half: f.half, lang: 3, special: true };
    }
    if (code === 'o') { f = face('teppo_nobu', 'king', 'm', 'portraits/legendary/oda_nobunaga'); return { name: '오다 노부나가', portrait: f.portrait, half: f.half, lang: 3, special: true }; }
    if (code === 'm') return G.Scenes.mateSpeaker('first');
    return {};
  }
  function fill(t, extra) {
    var b = K(), o = { price: U.num(b.price), total: U.num(b.price * b.qty), need: b.qty, ago: Math.max(1, S().date.y - 1543),
      castle: byDate(L().castle), hide: byDate(L().hide) };
    for (var k in extra || {}) o[k] = extra[k];
    return String(t).replace(/\{(\w+)\}/g, function (m, a) { return o[a] != null ? o[a] : m; });
  }
  /** 'x:…' 줄들을 차례로 말한다 (x = 말하는 사람, n = 설명) */
  async function lines(list, extra) {
    list = [].concat(list || []);
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]), code = l.charAt(0), t = l.slice(2);
      await G.UI.say(fill(t, extra), code === 'n' ? {} : who(code));
    }
  }
  function pic(img, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + img, title: title }) : null; }

  // ---------------------------------------------------------------- 조건
  function japanPort(c) { return !!(c && c.port && c.region === 9 && (G.R.cityOwner ? /일본/.test(G.R.cityOwner(c) || c.nation) : c.nation === '일본')); }
  T.have = function () { var cg = S().fleet.cargo[K().good]; return cg ? cg.q : 0; };
  /** 부탁을 받을 수 있는가 (이 도시에 들어설 때) */
  T.ready = function (c) {
    var s = S(), t = T.st(), b = K(), d = today();
    if (!japanPort(c) || d < b.from || d > b.until) return false;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return false;
    if (t && (t.end || t.stage >= 1 || (t.next && s.day < t.next))) return false;
    return true;
  };
  T.active = function () { var t = T.st(); return !!(t && t.stage === 1 && !t.end); };
  T.remain = function () { var t = T.st(); return t && t.due ? U.dayIndex(numDate(t.due)) - U.dayIndex(S().date) : 0; };

  // ---------------------------------------------------------------- 도시에 들어설 때 (js/scenes/city.js)
  T.arrival = async function (c) {
    if (!c) return;
    if (T.ready(c)) return offer(c);
    if (!T.active() || c.id !== K().sakai) return;
    var have = T.have(), need = K().qty;
    if (have >= need) return deliver(c);
    G.UI.toast(fill(L().short, { have: have }), 'people', 5000);
  };

  async function offer(c) {
    var D = L(), s = S(), b = K(), t = ensure();
    var first = !t.met;
    if (first) t.met = today();
    var pc = pic('teppo_offer', '원숭이라 불리는 사내');
    try {
      if (first) await lines(D.offer.slice(0, 2).concat(['n:— 훗날 천하를 손에 넣는 도요토미 히데요시, 그 젊은 날의 모습이다.'], D.offer.slice(2)));
      else await lines(['t:남만의 선장님, 또 뵙습니다요! 지난번 그 이야기 — 철포 삼백 자루, 아직 마음이 없으십니까? 값은 그대로 한 자루에 {price}닢입니다.']);
      var v = await G.UI.ask(fill(D.offerAsk), [{ label: D.offerYes, value: 'yes' }, { label: D.offerNo, value: 'no' }], who('t'));
      if (v !== 'yes') { t.next = s.day + (b.retry || 60); await lines(D.offerNoSay); return; }
      t.stage = 1; t.taken = today();
      t.due = U.dateNum(U.addDays(s.date, Math.round((b.years || 2) * 365)));
      if (s.known && s.known.indexOf(b.sakai) < 0) s.known.push(b.sakai);   // 사카이를 해도에
      await lines(D.offerYesSay);
    } finally { if (pc) await pc.stop(); }
    G.State.log(T.hideName() + '에게서 오다 노부나가께 바칠 남만 총 ' + b.qty + '자루를 부탁받았다 (사카이 · 기한 ' + U.fmtDate(numDate(t.due)) + ').');
    G.UI.toast('철포 삼백 자루 — 교역품 「총」 ' + b.qty + '을 싣고 사카이로', 'cannon', 6000);
  }

  // ---------------------------------------------------------------- 사카이 부두: 전한다
  /** 총을 덜어 낸다 — 포르투갈 땅에서 산 몫이 있었는가 */
  function takeGuns() {
    var s = S(), b = K(), cg = s.fleet.cargo[b.good], pt = false;
    var lots = G.R.cargoLots ? G.R.cargoLots(cg) : {};
    for (var k in lots) { var c = G.CITY_DATA[k]; if (c && lots[k].q > 0 && /포르투갈/.test(G.R.cityOwner ? G.R.cityOwner(c) || '' : c.nation)) pt = true; }
    if (G.R.takeCargoLots) G.R.takeCargoLots(cg, null, b.qty, 0);
    cg.q -= b.qty; if (cg.q <= 0) delete s.fleet.cargo[b.good];
    return pt;
  }
  function give(id) {
    var def = G.ITEM[id]; if (!def) return '';
    var kept = G.R.addItem(id, { value: def.price });
    if (!kept && G.R.storage) G.R.storage().push({ id: id, value: def.price });   // 소지품이 가득하면 자택 보관함
    return def.name + (kept ? '' : ' (소지품이 가득해 자택 보관함에 맡겼다)');
  }
  async function deliver(c) {
    var D = L(), s = S(), b = K(), t = ensure();
    var late = today() >= b.honnoji, pay = b.price * b.qty;
    var pt = takeGuns();
    t.end = 'done'; t.done = today(); t.by = late ? 'hide' : 'nobu'; t.paid = pay;
    var got = '', pc;
    if (!late) {
      pc = pic('teppo_firing', '사카이 부두의 벼락');
      try {
        await lines(D.dock);
        if (pt) await lines([D.lisbon]);
        await lines(D.nobu, { era: byDate(D.era) });
        var opts = D.tactics.map(function (x) { return { label: x.label, value: x.id }; });
        var v = await G.UI.ask(D.ask, opts, who('o'));
        var tc = D.tactics.filter(function (x) { return x.id === v; })[0] || D.tactics[D.tactics.length - 1];
        t.tactic = tc.id;
        await lines([tc.say]);
        await lines(D.pay);
      } finally { if (pc) await pc.stop(); }
      got = give(b.gift);
    } else {
      pc = pic('teppo_hideyoshi', '표주박 깃발의 사내');
      try { await lines(D.late, { lateLine: byDate(D.lateLine) }); } finally { if (pc) await pc.stop(); }
      got = give(b.giftHide);
    }
    s.player.gold += pay;
    var tr = G.Fame ? G.Fame.add('tr', b.fameTr) : 0, so = G.Fame ? G.Fame.add('so', b.fameSo) : 0;
    // 교토의 천하인(노부나가·히데요시)과 가까워진다
    var SP = G.Sponsor, sp = G.SPONSOR && G.SPONSOR.jp_tenka;
    if (SP && sp && SP.present(sp) && SP.rel && SP.addTrust) SP.addTrust(SP.rel(sp.id), b.trust || 0);
    if (G.Growth) G.Growth.once('teppo', 'cha', 1, '천하인에게 남만 총을 전했다');
    var giver = late ? T.hideName() : '오다 노부나가';
    G.State.log('사카이에서 ' + giver + '에게 남만 총 ' + b.qty + '자루를 전했다 — 금화 ' + U.num(pay) + '닢' + (got ? ', 「' + got + '」' : '') + '.');
    if (G.Audio) G.Audio.sfx('cheer');
    await G.UI.alert('<div class="center" style="font-size:22px;font-weight:700">' + D.title + '</div><br>' +
      giver + '에게 총 ' + b.qty + '자루를 전했다.<br>값 금화 <b>' + U.num(pay) + '</b>닢' + (got ? ' · <b>' + U.esc(got) + '</b>' : '') +
      '<br>교역 명성 +' + tr + ' · 사교 명성 +' + so, D.title);
    if (G.Game.refreshHud) G.Game.refreshHud();
    if (s.settings && s.settings.autosave !== false && G.State.save) G.State.save(0);
  }

  // ---------------------------------------------------------------- 하루 (js/systems/world.js): 기한 · 뒷이야기
  T.daily = function () {
    var s = S(), out = [], t = T.st(), b = K(); if (!s || !t) return out;
    if (T.active() && t.due) {
      var left = T.remain();
      if (left <= 180 && !t.reminded) { t.reminded = 1; out.push({ icon: 'hourglass', text: L().remind }); }
      if (left < 0) {
        t.end = 'failed';
        var lost = G.Fame ? -G.Fame.add('so', -(b.fail || 0)) : 0;
        out.push({ icon: 'cannon', text: L().failed });
        G.State.log(L().failed + (lost ? ' (사교 명성 −' + lost + ')' : ''));
      }
    }
    var d = today(), N = L().news; if (!t.seen) t.seen = {};
    for (var i = 0; i < N.length; i++) {
      var n = N[i]; if (t.seen[i] || d < n.d) continue;
      var okNeed = n.need === 'nobu' ? (t.end === 'done' && t.by === 'nobu' && t.done < n.d) : (!!t.met && t.met < n.d);
      if (!okNeed || (n.tactic && t.tactic !== n.tactic)) { if (d >= n.d) t.seen[i] = 1; continue; }   // 지난 소식은 다시 보지 않는다
      t.seen[i] = 1;
      out.push({ icon: 'scroll', text: n.text, history: true });
      G.State.log(n.text);
      if (n.bt && G.Fame) G.Fame.add('bt', b.fameAdvice || 0);
    }
    return out;
  };

  // ---------------------------------------------------------------- 수첩
  T.html = function () {
    var t = T.st(); if (!T.active()) return '';
    var left = T.remain();
    return '<div class="sep"></div><h4 style="margin:0 0 8px">' + L().title + '</h4><div class="kv">' +
      '<div>부탁한 사람</div><div>' + T.hideName() + ' (오다 노부나가의 가신)</div>' +
      '<div>할 일</div><div>' + fill(L().note[1], { have: Math.min(T.have(), K().qty) }) + '</div>' +
      '<div>기한</div><div>' + U.fmtDate(numDate(t.due)) + (left < 0 ? ' <span class="warn-text">(지남)</span>' : ' (남은 ' + left + '일)') + '</div>' +
      '<div>값</div><div>한 자루에 금화 ' + U.num(K().price) + '닢 — 모두 ' + U.num(K().price * K().qty) + '닢</div></div>';
  };
})(window.G = window.G || {});
