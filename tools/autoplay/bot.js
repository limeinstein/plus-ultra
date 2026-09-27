/* PLUS ULTRA 자동 플레이 봇 — 실제 게임 코드를 그대로 돌리고, 사람 대신 대화·선택을 고른다.
   · 대화상자(UI.say/ask/choose/confirm/number/window)를 가로채 규칙에 따라 고르고 모두 기록한다
   · 도시에서는 실제 건물 기능(C.visit → 건물 함수)을 부르고, 바다에서는 SEA.update를 직접 돌린다
   · 뱃길은 해도 위 바다 지점을 차례로 찍어 곧장 가는 침로(직항 침로)로 잡는다 — 자동항해(익숙한 항로)는 쓰지 않는다 */
(function () {
  'use strict';
  var BOT = window.BOT = { ev: [], trace: [], status: 'init', stage: '', err: [] };
  var G = window.G, U = G.U, R = G.R, UI = G.UI;
  var S = function () { return G.Game.state; };
  var C = G.Scenes.city, SEA = G.Scenes.sea, BAT = G.Scenes.battle;
  var tx = function (s) { s = s == null ? '' : String(s); return G.Names && G.Names.tx ? G.Names.tx(s) : s; };
  var strip = function (h) { return String(h == null ? '' : h).replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim(); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var mc = new MessageChannel(), mcq = [];
  mc.port1.onmessage = function () { var f = mcq.shift(); if (f) f(); };
  function yieldM() { return new Promise(function (r) { mcq.push(r); mc.port2.postMessage(0); }); }
  async function tick(n) { for (var i = 0; i < (n || 1); i++) await yieldM(); }

  // ================================================================ 기록
  function stamp() { var s = S(); return s ? { date: U.fmtDate(s.date), y: s.date.y, m: s.date.m, dd: s.date.d, day: s.day, gold: Math.round(s.player.gold), fame: s.player.fame } : {}; }
  function ev(type, o) { var e = Object.assign({ type: type }, stamp(), o || {}); BOT.ev.push(e); return e; }
  BOT.evf = ev;
  function tr(kind, a, b) { BOT.trace.push([S() ? S().day : 0, kind, a == null ? '' : String(a).slice(0, 400), b == null ? '' : String(b).slice(0, 300)]); if (BOT.trace.length > 6000) BOT.trace.splice(0, 1000); }
  BOT.drain = function () { var t = BOT.trace; BOT.trace = []; return t; };
  BOT.drainEv = function (from) { return BOT.ev.slice(from || 0); };

  // ================================================================ 규칙 (대화 선택)
  var rules = [];
  function rule(kind, re, pick, tag, once) { var r = { kind: kind, re: re, pick: pick, tag: tag || '', once: !!once }; rules.unshift(r); return r; }
  function unrule(tag) { rules = rules.filter(function (r) { return r.tag !== tag; }); }
  function applyRules(kind, text, list, extra) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.kind !== kind) continue;
      if (r.re && !r.re.test(text)) continue;
      var v = r.pick(list, text, extra);
      if (v !== undefined) { if (r.once) rules.splice(i, 1); return { v: v }; }
    }
    return null;
  }
  function opts(list) { return (list || []).map(function (o, i) { return typeof o === 'string' ? { label: o, value: i } : o; }); }
  function lab(o) { return strip(tx(o.label)); }
  function by(list, re) { for (var i = 0; i < list.length; i++) { var o = list[i]; if (!o || o.dis || o.disabled) continue; if (re.test(lab(o))) return o.value; } return undefined; }
  function first(list) { for (var i = 0; i < list.length; i++) if (list[i] && !list[i].dis && !list[i].disabled) return list[i].value; return null; }
  function labelOf(list, v) { for (var i = 0; i < list.length; i++) if (list[i] && list[i].value === v) return lab(list[i]); return String(v); }

  // ---------------------------------------------------------------- ask
  var mateTalk = {};
  function defAsk(text, list) {
    var s = S(), p = s.player, v;
    // 바다: 해적·함대
    if (/해적|막아섭니다|척이 있다/.test(text) && by(list, /도망/) !== undefined) {
      var o = list.filter(function (x) { return /도망/.test(lab(x)); })[0], pct = +((lab(o).match(/(\d+)%/) || [0, 50])[1]);
      var toll = SEA.tollOf ? SEA.tollOf() : Math.round(200 + p.gold * 0.12);
      BOT.lastEnc = { text: text, pct: pct, toll: toll };
      if (by(list, /사정한다/) !== undefined) return by(list, /사정한다/);
      if (pct >= 75) return by(list, /도망/);
      if (by(list, /통행료/) !== undefined && p.gold >= toll && toll <= 6000) return by(list, /통행료/);
      if (pct >= 35) return by(list, /도망/);
      return fightOK() ? by(list, /싸운다/) : by(list, /도망/);
    }
    if (/반란/.test(text)) return p.gold > s.fleet.crew * 5 * 3 ? 'pay' : 'talk';
    if (/표류하는 보트/.test(text)) return BOT.leg && BOT.leg.some(function (x) { return x.ocean; }) ? by(list, /지나/) : by(list, /구조/);
    if (/소리 없이 다가온다/.test(text)) return by(list, /지나/) !== undefined ? by(list, /지나/) : first(list);
    if (/물과 식량이 남는데/.test(text)) return Math.min(R.daysOfFood(), R.daysOfWater()) < 25 ? first(list) : by(list, /필요|괜찮|지나|사지 않/) !== undefined ? by(list, /필요|괜찮|지나|사지 않/) : list[list.length - 1].value;
    if (/상륙해서 탐험하겠습니까/.test(text)) return false;
    // 출항
    if (/출항하겠습니까|속도가 늦어지지만/.test(text)) return by(list, /출항/);
    if (/바로 출항할까요/.test(text)) return !!BOT.departNow;
    // 후원자
    if (/기간 \d+년 · 선금/.test(text)) return by(list, /승낙/);
    if (/빌려주겠네/.test(text)) return BOT.noLoan ? 0 : 1;
    if (/몫을 기대/.test(text)) return by(list, /나누어/);
    if (/나포한/.test(text)) return 'sell';
    if (/기한이 이미 지났네|아직 찾지 못했는가|아직 다 못 했는가/.test(text)) return BOT.giveUp ? 'fail' : null;
    if (/제독끼리 승부/.test(text)) return by(list, /부관/) !== undefined ? by(list, /부관/) : by(list, /병사끼리/);
    if (/도전을 받는다|결투하자/.test(text) || by(list, /도전을 받는다/) !== undefined) return by(list, /부관/) !== undefined ? by(list, /부관/) : 0;
    // 술집
    if (/술을 마시고 있다\.$/.test(text) && /\[/.test(text)) { var nm = (text.match(/\[([^\]]+)\]/) || [])[1]; BOT.curMate = G.MATES.filter(function (m) { return m.name === nm; })[0] || null; return 1; }
    if (/술을 마시고 있는 남자/.test(text)) return 0;
    if (/무슨 용건인가/.test(text)) {
      var who = BOT.curMate; if (!who) return null;
      var st = mateTalk[who.id] || (mateTalk[who.id] = { n: 0 });
      st.n++;
      if (st.n === 1 && BOT.wantRumour) return 'info';
      if (BOT.hireIds && BOT.hireIds.indexOf(who.id) >= 0 && !st.tried) { st.tried = 1; return 'hire'; }
      return null;
    }
    if (/한 잔에 금화|한 잔 사면/.test(text)) return 1;
    if (/어떻게 할까요\?/.test(text) && by(list, /교섭한다/) !== undefined) {
      BOT.entryTry = (BOT.entryTry || 0) + 1;
      if (BOT.entryTry <= 1 && p.gold > 6000 && BOT.bribeOK) return by(list, /교섭/);
      return by(list, /떠난다/);
    }
    if (/어떻게 할까요\?/.test(text) && by(list, /떠난다/) !== undefined) return by(list, /떠난다/);
    if (/어떻게 할까\?/.test(text) && by(list, /포기하고 돌아간다/) !== undefined) return by(list, /포기하고/);
    if (by(list, /그만둔다|무시한다|지나친다|돌아간다|떠난다/) !== undefined && /일손|허드렛/.test(text)) return by(list, /그만둔다/);
    return undefined;
  }
  function fightOK() {
    var f = S().fleet; return f.crew >= 40 && f.ships.length >= 2;
  }

  // ---------------------------------------------------------------- choose
  function defChoose(title, list, o) {
    if (/무엇을 요구할까/.test(title)) return by(list, /변경 없음/);
    if (/이름을 붙입니다/.test(title)) return first(list);
    if (/에 쓸 목재/.test(title)) return first(list);
    if (/어느 곳을 물어볼까/.test(title)) return first(list);
    if (/^수리$/.test(title)) return -1;
    if (/보고할 의뢰/.test(title)) return first(list);
    if (/뒤를 이을 자녀/.test(title)) return first(list);
    return undefined;
  }

  // ---------------------------------------------------------------- confirm
  function defConfirm(text, title) {
    if (/모두 팔겠습니까/.test(text)) return true;
    if (/바로 장비하겠습니까/.test(text)) return true;
    if (/고용하겠습니까/.test(text)) return true;
    if (/사겠습니까/.test(text)) return !!BOT.buyingNow;
    if (/부관의 경고/.test(title || '') || /배반자/.test(text)) return !!BOT.rivalOK;
    if (/한턱/.test(text)) return !!BOT.treatNow;
    if (/수행하겠습니까|공부하겠습니까/.test(text)) return !!BOT.trainNow;
    if (/헌금하겠습니까/.test(text)) return true;
    if (/건네고 교섭/.test(text)) return true;
    return undefined;
  }

  // ---------------------------------------------------------------- number
  function defNumber(o) {
    var t = strip(tx(o.title || '')), min = o.min || 0, max = Math.max(min, o.max);
    var cl = function (v) { return U.clamp(Math.round(v), min, max); };
    if (/^출항 준비/.test(t)) return BOT.prepDays == null ? null : cl(BOT.prepDays);
    if (/항해일수 보급/.test(t)) return BOT.supplyDays == null ? null : cl(BOT.supplyDays);
    if (/ 구입$/.test(t)) return BOT.qty == null ? max : cl(BOT.qty);
    if (/ 매각$/.test(t)) return BOT.qty == null ? max : cl(BOT.qty);
    if (/숙박/.test(t)) return cl(BOT.innNights || 1);
    return undefined;
  }

  // ---------------------------------------------------------------- window
  function defWindow(o, api) {
    var t = strip(tx(o.title || ''));
    var el = api.content;
    if (/^구입 — /.test(t)) {
      var id = BOT.buyGood, row = id && el.querySelector('tr.click[data-id="' + id + '"]');
      BOT.buyGood = null;
      if (row) { row.click(); return true; }
      api.close(null); return true;
    }
    if (/^매각 — /.test(t)) {
      var sid = BOT.sellGood; BOT.sellGood = null;
      if (sid === 'all') { api.close('all'); return true; }
      var r2 = sid && el.querySelector('tr.click[data-id="' + sid + '"]');
      if (r2) { r2.click(); return true; }
      api.close(null); return true;
    }
    if (/^배 구입/.test(t)) {
      var card = BOT.buyShip && el.querySelector('.shipcard.click[data-id="' + BOT.buyShip + '"]'); BOT.buyShip = null;
      if (card) { card.click(); return true; }
      api.close(null); return true;
    }
    if (/^항해사를 찾는다/.test(t)) { var m = BOT.pickMate || null; BOT.pickMate = null; BOT.curMate = m; api.close(m); return true; }
    if (/^열람$/.test(t)) { ev('library_hints', { text: strip(el.innerText || el.textContent) }); api.close(1); return true; }
    return false;
  }

  // ================================================================ UI 가로채기
  var origWindow = UI.window;
  BOT.patchUI = function () {
    UI.say = function (text, o) { var t = Array.isArray(text) ? text.join('\f') : String(text); t = tx(t); tr('say', o && o.name, t); hook('say', t, o); return Promise.resolve(); };
    UI.talk = async function (lines) { for (var i = 0; i < lines.length; i++) await UI.say(lines[i][1], { name: lines[i][0] && lines[i][0].name }); };
    UI.ask = function (text, choices, o) {
      var t = tx(text), list = opts(choices), res = applyRules('ask', t, list, o), v = res ? res.v : defAsk(t, list, o);
      if (v === undefined) { v = first(list); tr('ask?', t, list.map(lab).join(' | ') + ' => ' + labelOf(list, v)); }
      else tr('ask', (o && o.name ? o.name + ': ' : '') + t, list.map(lab).join(' | ') + ' => ' + labelOf(list, v));
      hook('ask', t, o, list, v);
      return Promise.resolve(v);
    };
    UI.choose = function (title, options, o) {
      var t = strip(tx(title)), list = opts(options), res = applyRules('choose', t, list, o), v = res ? res.v : defChoose(t, list, o);
      if (v === undefined) { v = null; tr('choose?', t, list.map(lab).join(' | ') + ' => (취소)'); }
      else tr('choose', t, list.map(lab).join(' | ').slice(0, 300) + ' => ' + (v == null ? '(취소)' : labelOf(list, v)));
      hook('choose', t, o, list, v);
      return Promise.resolve(v);
    };
    UI.confirm = function (text, yes, no, title) {
      var t = strip(tx(text)), res = applyRules('confirm', t, null, title), v = res ? res.v : defConfirm(t, title);
      if (v === undefined) { v = false; tr('confirm?', t, '=> 아니오'); } else tr('confirm', t, '=> ' + (v ? yes || '예' : no || '아니오'));
      return Promise.resolve(!!v);
    };
    UI.alert = function (text, title) { var t = strip(tx(text)); tr('alert', title, t); hook('alert', t, { title: title }); return Promise.resolve(true); };
    UI.number = function (o) {
      var res = applyRules('number', strip(tx(o.title || '')), null, o), v = res ? res.v : defNumber(o);
      if (v === undefined) { v = null; tr('number?', o.title, '=> 취소'); } else tr('number', strip(o.title), strip(o.text || '').slice(0, 120) + ' => ' + v);
      return Promise.resolve(v);
    };
    UI.prompt = function (title, value) { tr('prompt', title, value); return Promise.resolve(value || ''); };
    UI.fade = async function (fn) { if (fn) await fn(); };
    UI.toast = function (text, icon) { var t = strip(tx(text)); tr('toast', icon, t); hook('toast', t, { icon: icon }); };
    UI.window = function (o) {
      var api = origWindow.call(UI, o);
      var t = strip(tx(o.title || ''));
      var done = false;
      try { done = defWindow(o, api); } catch (e) { BOT.err.push('win ' + t + ' ' + e.message); }
      if (!done) {
        var b = (o.buttons || []).filter(function (x) { return /navy/.test(x.cls || ''); })[0] || (o.buttons || [])[0];
        tr('window', t, strip(api.content.innerText || '').slice(0, 300));
        api.close(b ? b.value : null);
      }
      return api;
    };
    // 발견 카드·세상의 소식은 기록만
    G.Scenes.discoveryCard = async function (d, fame) { tr('DISCOVERY', d.name, fame); };
    C.news = async function (list) { list.forEach(function (m) { tr('news', m.icon, m.text); ev('news', { text: tx(m.text) }); }); };
    // 결투: 힘·검술을 견주어 판정 (그림 미니게임 대신)
    G.Games.duel = async function (enemy, opt) {
      var s = S(), mate = opt && opt.mate, me;
      if (mate) { var f = G.Games.mateFighter(mate); me = { name: f.name, pow: f.maxHp * 0.5 + f.atk * 4 + f.def * 3 + (f.skill || 0) * 10 }; }
      else { var p = s.player; me = { name: p.name, pow: (60 + p.st.str * 0.6) * 0.5 + R.atk() * 4 + R.def() * 3 + (p.sk.sword || 0) * 10 }; }
      var en = (60 + (enemy.str || 60) * 0.6) * 0.5 + (enemy.atk || 8) * 4 + (enemy.def || 3) * 3 + (enemy.skill || 1) * 10;
      var pw = U.clamp(0.5 + (me.pow - en) / 80, 0.15, 0.9), res = Math.random() < pw ? 'win' : 'lose';
      ev('duel', { who: me.name, vs: enemy.name, proxy: !!mate, p: Math.round(pw * 100), res: res });
      return res;
    };
    // 육상전: 부대전 화면 대신 힘을 견주어 판정 (js/games/landwar.js 와 같은 모양의 결과)
    G.Games.landWar = async function (o) {
      var P = o.party, n = o.enemy.n, k = o.enemy.kind === 'beast' ? 1.35 : 1.1;
      var me = P * (1 + R.skill('sword') * 0.1 + R.skill('shoot') * 0.1) * (1 - S().fleet.fatigue / 250), en = n * k;
      var pw = U.clamp(0.5 + (me - en) / Math.max(20, me + en), 0.1, 0.95), res = Math.random() < pw ? 'win' : 'lose';
      var dead = Math.min(P - 1, Math.round(en * U.rf(0.15, 0.35) * (res === 'win' ? 0.6 : 1.4))), back = Math.round(dead * (0.25 + R.skill('med') * 0.15));
      ev('landwar', { vs: o.enemy.name, kind: o.enemy.kind, party: P, n: n, p: Math.round(pw * 100), res: res, dead: dead - back });
      return { res: res, dead: dead - back, back: back, left: P - dead + back, leaderDown: res === 'win' };
    };
    // 도시·그림 준비는 건너뛴다 (빠르게)
    C.preloadImages = async function () {};
    G.Img.preload = async function () {};
    if (G.Town) G.Town.available = function () { return false; };
    G.Game.setScene = function () {};
    C.view = function () { return null; };
    C.interior = function () { return null; };
    // 게임 일지도 모두 받아 적는다
    var slog = G.State.log;
    G.State.log = function (text) { slog.call(G.State, text); ev('journal', { text: tx(text) }); };
  };

  // 대화 속 중요한 결과를 사건으로 적는다
  function hook(kind, t, o, list, v) {
    if (kind === 'toast') {
      if (/단서를 얻었다|새로운 항구|작은 계약 성립|계약 성립|의뢰를 맡았다|의뢰 완료|폭풍|해적에게 금화|따돌렸다|따라잡혔다|동료가 되었다|괴혈병|라임|쥐가|새로운 바다|적도|넘었다|발견 \d+가지|해도에 「|목표 해역|지구를 한 바퀴|함대에 편입|를 팔았다|빌렸다|돌려주었다|떠났다|상하기/.test(t)) ev('note', { text: t });
    } else if (kind === 'say') {
      if (/폭풍이 지나갔다|침몰|반란|선원들이 웅성|몸값|벌금형|정신을 잃었|도둑맞았|쓰러졌다/.test(t)) ev('note', { text: t.slice(0, 200) });
    } else if (kind === 'alert') {
      if (/보고|승리|패배|퇴각|얻었다/.test(t) || /보고|해전|패배/.test((o && o.title) || '')) ev('note', { text: ((o && o.title) ? '[' + o.title + '] ' : '') + t.slice(0, 200) });
    }
  }

  // ================================================================ 기다리기
  async function settle(max) {
    for (var i = 0; i < (max || 400); i++) {
      var st = SEA.runtime();
      var busy = UI.busy() || (G.Game.scene === C && C.isBusy()) || (G.Game.scene === SEA && st && st.busy > 0);
      if (!busy) return true;
      await tick(); if (i > 50) await sleep(5);
    }
    // 닫히지 않은 창이 있으면 기록하고 닫는다
    var bk = document.querySelector('.modal-root .modal-back, .modal-back');
    if (bk) { tr('STUCK', strip(bk.innerText).slice(0, 200)); BOT.err.push('stuck modal: ' + strip(bk.innerText).slice(0, 120)); var b = bk.querySelector('.foot .btn, .askrow .btn, .choice'); if (b) b.click(); else bk.remove(); }
    return false;
  }
  BOT.settle = settle;

  // ================================================================ 도시
  function city() { return C.city(); }
  function here() { var s = S(); return s.loc.mode === 'city' ? s.loc.city : null; }
  function fac(c) { return R.facilities(c || city()); }
  async function visit(kind, arg, fn) {
    await settle();
    if (G.Game.scene !== C) return false;
    await C.visit(kind, arg);
    await settle();
    if (!C.current()) { tr('visit-refused', kind, arg); return false; }
    var ok = true;
    try { if (fn) ok = (await fn()) !== false; } catch (e) { BOT.err.push(kind + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]); tr('ERR', kind, e.message); }
    await settle();
    if (G.Game.scene === C && C.current()) { await C.leave(); await settle(); }
    return ok;
  }
  BOT.visit = visit;

  // ---------------------------------------------------------------- 교역
  function ledgerSell(cityId, gid) { var b = S().ledger || {}, row = b[cityId]; if (!row || S().day - row.t > 540) return null; return row.s[G.GOOD[gid].idx] || null; }
  function goodsHere(c) { return R.cityGoods(c).filter(function (id) { return G.GOOD[id] && (!G.GOOD[id].nw || c.region === 10 || S().date.y >= 1520); }); }
  /** 앞으로 들를 도시에서 이 물건을 가장 비싸게 파는 값 */
  function futureBest(gid, stops) {
    var best = null;
    (stops || []).forEach(function (cid) { var p = ledgerSell(cid, gid); if (p && (!best || p > best.p)) best = { p: p, city: cid }; });
    return best;
  }
  function reserveNeed(days) { var f = S().fleet, use = R.dailyUse(Math.max(f.crew, R.crewMin() + 4)); return Math.max(0, Math.ceil(days * use * 2 - f.food - f.water)); }
  async function tradeSell(c, stops) {
    var s = S(), T = C.B.trade, sold = [];
    var keep = procureKeep();
    for (var gid in Object.assign({}, s.fleet.cargo)) {
      var cg = s.fleet.cargo[gid]; if (!cg) continue;
      var q = cg.q - (keep[gid] || 0); if (q <= 0) continue;
      var p = T.sellP(c, gid), fut = futureBest(gid, stops), g = G.GOOD[gid];
      var old = s.day - cg.d, spoil = g.life ? g.life - old : 999;
      var go = false, why = '';
      if (p >= cg.cost * 1.08 && !(fut && fut.p > p * 1.15)) { go = true; why = '이익'; }
      else if (spoil < 25 && p >= cg.cost * 0.6) { go = true; why = '상하기 전에'; }
      else if (old > 420) { go = true; why = '오래 묵음'; }
      else if (BOT.clearCargo && p >= cg.cost * 0.7) { go = true; why = '짐칸 비우기'; }
      if (!go) continue;
      var g0 = s.player.gold;
      BOT.sellGood = gid; BOT.qty = q;
      await T.sell(c);
      BOT.sellGood = null; BOT.qty = null;
      var got = s.player.gold - g0;
      if (got > 0) { sold.push(gid); ev('sell', { city: c.id, cityName: c.name, good: gid, goodName: g.name, q: q, got: got, unit: Math.round(got / q), cost: cg.cost, profit: got - cg.cost * q, why: why }); }
    }
    return sold;
  }
  function procureKeep() { var k = S().contract, out = {}; if (k && k.task && k.task.kind === 'procure') out[k.task.good] = k.task.qty; return out; }
  async function tradeBuy(c, stops, legDays) {
    var s = S(), T = C.B.trade, bought = [];
    var reserveGold = Math.max(1500, 800 + reserveNeed(legDays) * R.supplyCost(c) * 3 + Math.max(0, R.crewMin() + 4 - s.fleet.crew) * R.hireCost(c) + (BOT.goldKeep || 0));
    // 조달 일거리 물건
    var k = s.contract;
    if (k && k.task && k.task.kind === 'procure' && goodsHere(c).indexOf(k.task.good) >= 0) {
      var have = s.fleet.cargo[k.task.good] ? s.fleet.cargo[k.task.good].q : 0;
      if (have < k.task.qty) await buyGood(c, k.task.good, k.task.qty - have, '조달 일거리', bought);
    }
    // 처음 보는 교역품은 한 통씩 사 본다 (교역품 발견)
    var fresh = goodsHere(c).filter(function (gid) { return G.DISCOVERIES.some(function (d) { return d.how === 'trade' && d.good === gid && d.regions.indexOf(c.region) >= 0 && !G.Disc.foundByMe(d.id); }); });
    for (var i = 0; i < fresh.length; i++) if (s.player.gold > reserveGold + 400 && R.free() - reserveNeed(legDays) > 3) await buyGood(c, fresh[i], 1, '새 교역품 시험 구매', bought);
    // 되팔 곳이 알려진 물건 — 그 도시에 닿을 때까지의 구간들에 쓸 식량·물 자리는 남겨 둔다
    var use = R.dailyUse(Math.max(s.fleet.crew, R.crewMin() + 4));
    var needTo = BOT.needDaysTo || function () { return legDays; };
    for (var round = 0; round < 3; round++) {
      var budget = s.player.gold - reserveGold;
      if (budget < 200) break;
      if (Object.keys(s.fleet.cargo).length >= R.maxKinds()) break;
      var best = null;
      goodsHere(c).forEach(function (gid) {
        if (s.fleet.cargo[gid] && round === 0 && s.fleet.cargo[gid].q > 5) return;
        var bp = T.buyP(c, gid), fut = futureBest(gid, stops);
        if (!fut) return;
        var gain = fut.p * 0.86 - bp;
        if (gain < Math.max(6, bp * 0.18)) return;
        if (bought.indexOf(gid) >= 0 && round > 0) return;
        var room = R.fleetCap() - R.cargoQty() - Math.ceil(Math.max(legDays, needTo(fut.city)) * use * 2) - 2;
        if (room < 5) return;
        if (!best || gain > best.gain) best = { gid: gid, bp: bp, gain: gain, fut: fut, room: room };
      });
      if (!best) break;
      var q = Math.min(R.supply(c, best.gid), best.room, Math.floor(budget / best.bp));
      if (q < 3) break;
      await buyGood(c, best.gid, q, '되팔 곳 ' + G.CITY_DATA[best.fut.city].name + ' ' + best.fut.p + '닢', bought);
    }
    return bought;
  }
  async function buyGood(c, gid, q, why, bought) {
    var s = S(), T = C.B.trade, g0 = s.player.gold, q0 = s.fleet.cargo[gid] ? s.fleet.cargo[gid].q : 0;
    BOT.buyGood = gid; BOT.qty = q;
    await T.buy(c);
    BOT.buyGood = null; BOT.qty = null;
    var got = (s.fleet.cargo[gid] ? s.fleet.cargo[gid].q : 0) - q0, paid = g0 - s.player.gold;
    if (got > 0) { bought.push(gid); ev('buy', { city: c.id, cityName: c.name, good: gid, goodName: G.GOOD[gid].name, q: got, paid: paid, unit: Math.round(paid / got), why: why }); }
  }

  async function doTrade(stops, legDays, mode) {
    var c = city();
    if (!fac(c).trade) return;
    await visit('trade', undefined, async function () {
      if (mode !== 'buy') await tradeSell(c, stops);
      if (mode !== 'sell') await tradeBuy(c, stops, legDays);
    });
  }

  // ---------------------------------------------------------------- 도서관 · 술집 · 시장 · 교회 · 여관
  async function doLibrary() {
    var c = city(); if (!fac(c).library) return;
    var LB = C.B.library, s = S();
    var books = LB.books(c).filter(function (b) { var st = LB.status(b); return !s.flags['read_' + b.id] && st.lang > 0 && st.skOK && st.fresh > 0; });
    if (!books.length) return;
    await visit('library', undefined, async function () {
      for (var i = 0; i < books.length; i++) {
        var h0 = Object.keys(s.hints).length;
        rule('choose', /^서적 선택/, function (list) { return books[i].id; }, 'book', true);
        await LB.read(c);
        unrule('book');
        var got = Object.keys(s.hints).filter(function (id) { return s.hints[id].src === 'book:' + books[i].id; }).map(function (id) { return G.DISC[id].name; });
        ev('library', { city: c.id, cityName: c.name, book: books[i].title, hints: got });
      }
    });
  }
  async function doTavern(o) {
    var c = city(); o = o || {};
    if (C.langLv(c) === 0) return;
    var s = S(), T = C.B.tavern;
    await visit('tavern', undefined, async function () {
      // 소문 (단서)
      if (o.rumour) {
        for (var i = 0; i < 2; i++) {
          var h0 = Object.keys(s.hints);
          await T.info(c);
          var nh = Object.keys(s.hints).filter(function (id) { return h0.indexOf(id) < 0; });
          ev('tavern_rumour', { city: c.id, cityName: c.name, hints: nh.map(function (id) { return G.DISC[id].name; }) });
        }
      }
      // 목표 수소문
      var tg = T.targets(c);
      if (o.ask && tg.length) { await T.askTarget(c); ev('tavern_ask', { city: c.id, cityName: c.name, target: tg[0].name }); }
      // 한턱 (장거리 전)
      if (o.treat) { BOT.treatNow = true; await T.treat(c); BOT.treatNow = false; ev('tavern_treat', { city: c.id, cityName: c.name }); }
      // 항해사 고용
      if (o.hire) {
        var cands = T.candidates(c).filter(function (m) { return s.player.fame >= m.fame && T.comm(m).lv > 0 && wantMate(m); });
        for (var j = 0; j < cands.length && s.mates.length < Math.min(G.MAX_MATES, BOT.maxMates || 4); j++) {
          var m = cands[j]; BOT.hireIds = [m.id]; BOT.pickMate = m; BOT.curMate = m;
          var n0 = s.mates.length;
          await T.hire(c);
          BOT.hireIds = null;
          if (s.mates.length > n0) ev('hire', { city: c.id, cityName: c.name, mate: m.name, skills: skillLine(m), wage: m.wage });
        }
      }
    });
  }
  function skillLine(m) { var out = []; for (var k in m.sk) { var d = G.SKILL_BY_ID[k]; if (d) out.push(d.name + m.sk[k]); } return out.join(' '); }
  function wantMate(m) {
    var s = S();
    if (m.wage > Math.max(150, s.player.gold / 60)) return false;
    var sk = m.sk || {};
    var have = function (id) { return R.skill(id); };
    var score = 0;
    ['nav', 'survey', 'med', 'sci', 'ops', 'speech', 'acct', 'gun', 'ship'].forEach(function (id) { if ((sk[id] || 0) > have(id)) score += (sk[id] - have(id)) * (id === 'nav' || id === 'med' ? 2 : 1); });
    return score >= 2;
  }
  async function doMarket(want) {
    var c = city(); if (!fac(c).market) return;
    var MK = C.B.market, s = S();
    var st = MK.stock(c).map(function (it) { return it.id; });
    var need = want.filter(function (w) { return st.indexOf(w.id) >= 0 && countItem(w.id) < w.n && s.player.gold > G.ITEM[w.id].price + (w.keep || 3000); });
    if (!need.length) return;
    await visit('market', undefined, async function () {
      for (var i = 0; i < need.length; i++) {
        var w = need[i];
        while (countItem(w.id) < w.n && s.player.gold > G.ITEM[w.id].price + (w.keep || 3000)) {
          var n0 = countItem(w.id);
          rule('choose', /^구입 아이템 선택/, function (list) { return countItem(w.id) === n0 ? w.id : null; }, 'item');
          BOT.buyingNow = true; await MK.buy(c); BOT.buyingNow = false; unrule('item');
          if (countItem(w.id) === n0) break;
          ev('item', { city: c.id, cityName: c.name, item: G.ITEM[w.id].name, price: G.ITEM[w.id].price });
        }
      }
    });
  }
  function countItem(id) { return S().player.items.filter(function (it) { return it.id === id; }).length; }
  async function doInn(nights) {
    var c = city(); BOT.innNights = nights || 1;
    await visit('inn', undefined, async function () { await C.B.inn.stay(c); ev('inn', { city: c.id, cityName: c.name, nights: BOT.innNights }); });
  }
  async function doChurch() {
    var c = city(); if (!fac(c).church) return;
    await visit('church', undefined, async function () { await C.B.church.pray(c); ev('church', { city: c.id, cityName: c.name, what: '기도' }); });
  }

  // ---------------------------------------------------------------- 조선소
  async function doShipyard(buyType) {
    var c = city(); if (!fac(c).shipyard) return false;
    var Y = C.B.shipyard, s = S(), ok = false;
    await visit('shipyard', undefined, async function () {
      if (buyType && Y.types(c).indexOf(buyType) >= 0 && !Y.locked(c, buyType) && s.player.gold >= Y.priceOf(c, buyType) + 3000) {
        var n0 = s.fleet.ships.length, g0 = s.player.gold;
        BOT.buyShip = buyType; BOT.buyingNow = true;
        await Y.buy(c);
        BOT.buyShip = null; BOT.buyingNow = false;
        if (s.fleet.ships.length > n0) { ok = true; var sh = s.fleet.ships[s.fleet.ships.length - 1]; ev('ship_buy', { city: c.id, cityName: c.name, ship: G.SHIP[sh.type].name, name: sh.name, price: g0 - s.player.gold }); }
      }
    });
    return ok;
  }

  // ---------------------------------------------------------------- 후원자
  function sponsorsHere(c) { return G.SPONSORS.filter(function (x) { return x.city === c.id && G.Sponsor.present(x); }); }
  function bldOf(sp) { return sp.bld === 'palace' ? ['palace', undefined] : ['mansion', sp.id]; }
  /** 이 후원자와 이야기할 수 있나 (명성 또는 뇌물) */
  function canMeet(sp) { var need = G.Sponsor.fameNeed(sp), f = S().player.fame; return f >= need; }
  async function reportContract() {
    var s = S(), k = s.contract; if (!k) return false;
    var sp = G.SPONSOR[k.sponsor], c = city();
    if (!sp || sp.city !== c.id || !G.Errand.done(k)) return false;
    var b = bldOf(sp), g0 = s.player.gold, f0 = s.player.fame, name = G.Errand.name(k);
    await visit(b[0], b[1], async function () { await G.Sponsor.report(sp); });
    if (!s.contract) { ev('report', { sponsor: G.Sponsor.holderName(sp), title: sp.title, what: name, small: !!k.small, gold: s.player.gold - g0, fameGain: s.player.fame - f0 }); return true; }
    // 명성이 모자라 집사에게 (작은 일거리)
    return false;
  }
  /** 후원자에게 모험을 제안 (want: 발견 id 목록, 순서대로) — 계약이 맺어지면 true */
  async function propose(sp, want, o) {
    var s = S(); o = o || {};
    if (s.contract) return false;
    var b = bldOf(sp), g0 = s.player.gold, f0 = s.player.fame;
    var names = want.map(function (id) { return id === 'circum' ? '세계일주' : G.DISC[id].name; });
    var tried = [];
    rule('choose', /^제안 선택/, function (list) {
      for (var i = 0; i < names.length; i++) {
        if (tried.indexOf(names[i]) >= 0) continue;
        var v = by(list, new RegExp('^' + names[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( |$)'));
        if (v !== undefined) { tried.push(names[i]); return v; }
      }
      if (o.errand) { var e = by(list, /작은 일거리/); if (e !== undefined && tried.indexOf('errand') < 0) { tried.push('errand'); return e; } }
      return null;
    }, 'prop');
    if (o.errand) errandRule(o.errandKinds, o.errandPick);
    if (o.rivalOK) BOT.rivalOK = true;
    var met = false;
    await visit(b[0], b[1], async function () { met = true; await G.Sponsor.propose(sp); });
    unrule('prop'); unrule('errand'); BOT.rivalOK = false;
    var k = s.contract;
    ev('propose', { sponsor: G.Sponsor.holderName(sp), title: sp.title, want: names, met: met, result: k ? (k.small ? '작은 일거리: ' + G.Errand.name(k) : '계약: ' + G.Errand.name(k)) : (s.player.gold > g0 ? '보고(사례)' : '거절/무산'), gold: s.player.gold - g0, fameGain: s.player.fame - f0, reward: k ? k.reward : null, advance: k ? k.advance : null });
    return !!k;
  }
  function errandRule(kinds, pick) {
    kinds = kinds || ['procure', 'survey', 'confirm'];
    rule('choose', /^작은 일거리/, function (list) {
      if (pick != null) return pick;
      for (var i = 0; i < kinds.length; i++) {
        var re = kinds[i] === 'procure' ? /조달/ : kinds[i] === 'survey' ? /해도/ : /소문 확인/;
        var v = by(list, re); if (v !== undefined) return v;
      }
      return -1;
    }, 'errand');
  }
  /** 명성이 모자란 후원자에게 집사를 통해 작은 일거리를 맡는다 */
  async function errandVia(sp, kinds, pick) {
    var s = S(); if (s.contract) return false;
    rule('ask', /어떻게 할까\?/, function (list) { return by(list, /작은 일/); }, 'aud', true);
    errandRule(kinds, pick);
    var b = bldOf(sp);
    await visit(b[0], b[1], async function () { });
    unrule('aud'); unrule('errand');
    var k = s.contract;
    ev('errand_take', { sponsor: G.Sponsor.holderName(sp), title: sp.title, via: '집사', result: k ? G.Errand.name(k) : '없음', reward: k ? k.reward : null, desc: k && k.task ? k.task.desc : null });
    return !!k;
  }
  /** 명성이 모자라도 작은 일거리 보고는 집사가 받는다 */
  async function reportViaButler() {
    var s = S(), k = s.contract; if (!k || !k.small) return false;
    var sp = G.SPONSOR[k.sponsor], c = city(); if (!sp || sp.city !== c.id || !G.Errand.done(k)) return false;
    var b = bldOf(sp), g0 = s.player.gold, f0 = s.player.fame, name = G.Errand.name(k);
    await visit(b[0], b[1], async function () { if (C.current()) await G.Sponsor.report(sp); });
    if (!s.contract) { ev('report', { sponsor: G.Sponsor.holderName(sp), title: sp.title, what: name, small: true, via: canMeet(sp) ? '직접' : '집사', gold: s.player.gold - g0, fameGain: s.player.fame - f0 }); return true; }
    return false;
  }
  async function announceAll() {
    var c = city(); if (!fac(c).harbor) return;
    var un = G.Disc.unreported(); if (!un.length) return;
    await visit('harbor', undefined, async function () {
      var list = G.Disc.unreported();
      for (var i = 0; i < list.length; i++) { var f = G.Disc.announce(list[i].id); if (f) ev('announce', { city: c.id, cityName: c.name, disc: list[i].name, fameGain: f }); }
    });
  }

  // ---------------------------------------------------------------- 수리 · 역할
  async function repair() {
    var c = city(), s = S(); if (!fac(c).shipyard) return;
    if (!s.fleet.ships.some(function (sh) { return sh.hp < sh.maxHp * 0.97; })) return;
    var g0 = s.player.gold;
    await visit('shipyard', undefined, async function () { await C.B.shipyard.repair(c); });
    if (s.player.gold < g0) ev('repair', { city: c.id, cityName: c.name, cost: g0 - s.player.gold });
  }
  /** 선수상: 폭풍을 피하는 것을 배마다 단다 (선수상의 덕은 함대 전체에 더해진다) */
  async function figureheads(pref) {
    var c = city(), s = S(); if (!fac(c).shipyard) return;
    pref = pref || ['angel', 'swan', 'owl', 'dolphin'];
    for (var i = 0; i < s.fleet.ships.length; i++) {
      var sh = s.fleet.ships[i]; if (sh.loan) continue;
      var cur = sh.fig ? pref.indexOf(sh.fig) : -1; if (cur === 0) continue;
      var step = 0, idx = i, before = sh.fig;
      rule('choose', /^개조할 배/, function () { return idx; }, 'fg1', true);
      rule('choose', /호 개조$/, function () { return step++ === 0 ? 'fig' : null; }, 'fg2');
      rule('choose', /^선수상$/, function (list) {
        for (var k = 0; k < pref.length; k++) { if (cur >= 0 && k >= cur) break; var v = list.filter(function (o) { return o.value === pref[k]; })[0]; if (v && s.player.gold > G.FIGUREHEAD[pref[k]].price + 3000) return pref[k]; }
        return null;
      }, 'fg3');
      await visit('shipyard', undefined, async function () { await C.B.shipyard.refit(c); });
      unrule('fg1'); unrule('fg2'); unrule('fg3');
      if (sh.fig !== before) ev('figurehead', { city: c.id, cityName: c.name, ship: sh.name + '호', fig: G.FIGUREHEAD[sh.fig].name, desc: G.FIGUREHEAD[sh.fig].desc });
    }
  }
  async function assignRole(mateId, role) {
    var s = S(), c = city(), m = s.mates.filter(function (x) { return x.id === mateId; })[0];
    if (!m || m.role === role) return;
    var step = 0;
    rule('choose', /^부하편성/, function () { return step++ === 0 ? s.mates.indexOf(m) : null; }, 'org');
    rule('choose', /의 역할$/, function () { return role; }, 'orgr', true);
    await visit('tavern', undefined, async function () { await C.B.tavern.organize(); });
    unrule('org'); unrule('orgr');
    ev('role', { mate: G.MATE[m.id].name, role: role, now: m.role });
  }

  // ---------------------------------------------------------------- 선원 줄이기 · 금고
  async function trimCrew(target) {
    var s = S(), c = city(), n = s.fleet.crew - target;
    if (n <= 0 || !fac(c).harbor) return;
    var asked = 0, from = s.fleet.crew;
    rule('ask', /현재 선원은/, function () { return asked++ === 0 ? 'fire' : null; }, 'crew');
    rule('number', /선원해고/, function () { return n; }, 'crewn', true);
    await visit('harbor', undefined, async function () { await C.B.harbor.crew(c); });
    unrule('crew'); unrule('crewn');
    if (s.fleet.crew < from) ev('crew_trim', { city: c.id, cityName: c.name, from: from, to: s.fleet.crew, why: '긴 뱃길에 식량·물을 아끼려고 남는 선원을 내린다' });
  }
  async function bank(keep) {
    var s = S(), c = city(), p = s.player;
    if (c.id !== p.home) return;
    var dep = Math.floor(p.gold - keep), wd = Math.ceil(keep - p.gold);
    if (dep < 2000 && (wd <= 0 || p.bank <= 0)) return;
    var v = dep >= 2000 ? 'in' : 'out', amt = v === 'in' ? dep : Math.min(wd, p.bank);
    if (amt <= 0) return;
    rule('choose', /^금고/, function () { return v; }, 'bank', true);
    rule('number', /맡기기|찾기/, function () { return amt; }, 'bankn', true);
    await visit('home', undefined, async function () { await C.B.home.bank(c); });
    unrule('bank'); unrule('bankn');
    ev('bank', { what: v === 'in' ? '맡김' : '찾음', amount: amt, onHand: Math.round(p.gold), bank: Math.round(p.bank) });
  }

  // ---------------------------------------------------------------- 항구: 출항 준비와 출항
  async function departFor(days, stops, o) {
    var c = city(), s = S(); o = o || {};
    if (!fac(c).harbor) throw new Error('항구 없음: ' + c.name);
    BOT.legFrom = c.id;
    var ok = false;
    BOT.prepDays = Math.ceil(days); BOT.supplyDays = Math.ceil(days); BOT.departNow = true;
    var g0 = s.player.gold, crew0 = s.fleet.crew;
    await visit('harbor', undefined, async function () {
      await C.B.harbor.prep(c);
    });
    BOT.departNow = false;
    ok = G.Game.scene === SEA;
    ev('depart', { city: c.id, cityName: c.name, days: Math.min(R.daysOfFood(), R.daysOfWater()), plan: Math.ceil(days), cost: g0 - s.player.gold, crew: s.fleet.crew, hired: s.fleet.crew - crew0, ok: ok, next: (stops || []).map(stopName).join(' → ') });
    return ok;
  }
  function stopName(st) { return st.city != null ? G.CITY_DATA[st.city].name : (st.label || ('(' + st.lat.toFixed(1) + ',' + st.lon.toFixed(1) + ')')); }
  BOT.stopName = stopName;

  // ================================================================ 바다
  function dockOf(id) { var c = G.CITY_DATA[id], d = c.dock || [c.lat, c.lon]; return [d[1], d[0]]; }
  function pathLen(p) { var d = 0; for (var i = 1; i < p.length; i++) d += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return d; }
  BOT.spd = 0.9;          // 실제로 하루에 나아간 거리(°) — 항해할수록 고친다
  function legEstimate(from, stops) {
    var x = from[0], y = from[1], dist = 0;
    for (var i = 0; i < stops.length; i++) {
      var t = stops[i].city != null ? dockOf(stops[i].city) : [stops[i].lon, stops[i].lat];
      var p = G.Nav.path(x, y, t[0], t[1]);
      if (!p) return null;
      dist += pathLen(p); x = t[0]; y = t[1];
      if (stops[i].city != null) break;
    }
    return { dist: dist, days: dist / Math.max(0.5, BOT.spd) };
  }
  BOT.legEstimate = legEstimate;
  function setPath(tlon, tlat, cityObj) {
    var st = SEA.runtime(), l = S().loc;
    var p = G.Nav.path(l.lon, l.lat, tlon, tlat);
    if (!p || p.length < 2) return false;
    st.path = p; st.pathI = 1; st.target = { lon: p[p.length - 1][0], lat: p[p.length - 1][1], city: cityObj || null };
    st.manual = false; st.warnedFor = null; st.repath = 0; st.direct = true;
    st.braking = false; st.dirCrs = null; st.crs = null; st.dW = Infinity; st.xt = 0; st.tackSide = 0; st.tackTheta = 0; st.noTack = 0; st.cruise = false; st.thr = 0;
    st.stopping = false; st.paused = false;
    return true;
  }
  /** 뭍에 막힌 자리에서 비켜 갈 트인 바다 한 점 (가는 길이 모두 바다이고 목적지에 가까운 쪽) */
  function detourPoint(lon, lat, tgt) {
    var best = null;
    [1.0, 1.6, 2.4].forEach(function (rr) {
      for (var k = 0; k < 16; k++) {
        var a = k / 16 * Math.PI * 2, px = lon + Math.cos(a) * rr, py = lat + Math.sin(a) * rr;
        if (!G.Geo.isSea(px, py, 0.5)) continue;
        var clear = true; for (var j = 1; j <= 8; j++) { if (!G.Geo.isSea(lon + (px - lon) * j / 8, lat + (py - lat) * j / 8, 0.12)) { clear = false; break; } }
        if (!clear) continue;
        var sc = G.Geo.dist(px, py, tgt[0], tgt[1]) + rr * 0.3;
        if (!best || sc < best.sc) best = { p: [px, py], sc: sc };
      }
    });
    return best && best.p;
  }
  /** 한 구간: 바다 지점들을 지나 도시에 들어가거나 마지막 바다 지점에 닿을 때까지 */
  async function sailLeg(stops) {
    var s = S(), i = 0, t0 = s.day, lastDay = s.day, dist0 = s.stats.distance, stuck = 0, replans = 0, battles = 0, seaDays = 0;
    var DT = 0.3;
    while (i < stops.length) {
      var stp = stops[i];
      if (G.Game.scene === BAT) { battles++; await runBattle(); continue; }
      if (G.Game.scene === C) {
        await settle();
        var cc = here();
        updSpd(seaDays, s.stats.distance - dist0);
        return { arrived: cc, idx: i, days: seaDays };
      }
      if (G.Game.scene !== SEA) { await sleep(20); stuck++; if (stuck > 500) return { fail: 'scene ' + G.Game.sceneName }; continue; }
      var st = SEA.runtime(); if (!st) { await sleep(10); continue; }
      if (st.busy || UI.busy()) { await settle(); continue; }
      var l = s.loc;
      var tgt = stp.city != null ? dockOf(stp.city) : [stp.lon, stp.lat];
      var dd = G.Geo.dist(l.lon, l.lat, tgt[0], tgt[1]);
      // 바다 지점에 닿았다
      if (stp.city == null && (dd < (stp.r || 0.6) || ((stp._tries || 0) >= 2 && dd < 3 && !st.path && (st.paused || st.stopping)))) { ev('waypoint', { label: stopName(stp), lat: +l.lat.toFixed(2), lon: +l.lon.toFixed(2) }); i++; st.path = null; continue; }
      if (stp.city != null) {
        var known = s.known.indexOf(stp.city) >= 0;
        var near = SEA.portNear();
        if (near && near.id === stp.city && (st.paused || dd < 0.35)) {
          st.paused = true; st.path = null; BOT.entryTry = 0;
          await SEA.enterPort(); await settle();
          if (G.Game.scene === C) continue;
          ev('entry_fail', { city: stp.city, cityName: G.CITY_DATA[stp.city].name });
          return { refused: stp.city, idx: i };
        }
        if (dd < 0.6 && !known && st.paused) { ev('port_missing', { city: stp.city, cityName: G.CITY_DATA[stp.city].name }); return { missing: stp.city, idx: i }; }
      }
      // 항로를 잡는다
      if ((!st.path || st.paused) && !st.stopping) {
        if (replans > 40) { if (stp.city != null) { BOT.bad = BOT.bad || {}; BOT.bad[stp.city] = 1; } return { fail: 'replan', idx: i, city: stp.city }; }
        if (stp.city != null && (stp._tries || 0) >= 1 && dd < 2.5) {
          if (!stp._direct) { stp._direct = true; SEA.setCourse(tgt[0], tgt[1], null); replans++; }
          else if (st.paused) { ev('port_unreachable', { city: stp.city, cityName: G.CITY_DATA[stp.city].name, dist: +dd.toFixed(2) }); return { missing: stp.city, idx: i }; }
        } else {
          // 지난번 침로가 같은 자리에서 뭍에 막혔으면(섬 곁) 곁의 트인 바다로 한 번 비켜 간다
          var ls = BOT.lastSet;
          if (ls && ls.i === i && G.Geo.dist(l.lon, l.lat, ls.lon, ls.lat) < 0.25 && st.paused && !stp.detour) {
            var dt = detourPoint(l.lon, l.lat, tgt);
            BOT.lastSet = null;
            if (dt) { stops.splice(i, 0, { lon: dt[0], lat: dt[1], r: 0.4, detour: true, label: '비켜 가기' }); ev('detour', { lat: +l.lat.toFixed(2), lon: +l.lon.toFixed(2), to: stopName(stp) }); replans++; continue; }
          }
          BOT.lastSet = { i: i, lon: l.lon, lat: l.lat };
          if (!setPath(tgt[0], tgt[1], null)) {
            var ns = G.Nav.nearestSea(l.lon, l.lat, 10);
            if (ns && replans < 3) { l.lon = ns[0]; l.lat = ns[1]; replans++; continue; }
            return { fail: 'nopath', idx: i };
          }
          stp._tries = (stp._tries || 0) + 1;
          replans++;
        }
      }
      st.speed = 4;
      var rd = G.Game.renderer; if (rd && !rd.__stub) { rd.draw = function () {}; rd.__stub = true; }
      SEA.update(DT);
      await tick();
      if (st.busy) await settle();
      if (s.day !== lastDay) {
        lastDay = s.day;
        if (s.day % 5 === 0) tr('pos', l.lat.toFixed(2) + ',' + l.lon.toFixed(2), 'to ' + stopName(stp) + ' d=' + dd.toFixed(1) + ' food=' + Math.min(R.daysOfFood(), R.daysOfWater()) + ' fat=' + Math.round(s.fleet.fatigue) + ' crew=' + s.fleet.crew + ' hp=' + s.fleet.ships.map(function (x) { return Math.round(x.hp) + '/' + x.maxHp; }).join(','));
        seaDays = s.day - t0;
        // 남은 식량·물로 목적지까지 닿을 수 있는가 (이틀마다 셈) — 모자라면 닿을 수 있는 가까운 항구로 돌린다
        var left = Math.min(R.daysOfFood(), R.daysOfWater());
        // 선원을 많이 잃어 최저 인원에 한참 못 미치면 가까운 항구에서 채운다
        if (s.fleet.crew < R.crewMin() * 0.75 && !BOT.emergency && !stops.some(function (x) { return x.ocean; })) {
          var emc = reachablePort(l.lon, l.lat, left + 0, stp.city, null);
          ev('crew_short', { crew: s.fleet.crew, min: R.crewMin(), to: emc != null ? G.CITY_DATA[emc].name : '(없음)' });
          BOT.emergency = true;
          if (emc != null && emc !== stp.city) { stops.splice(i, 0, { city: emc, divert: true }); st.path = null; }
        }
        if (left < 70 && (s.day % 2 === 0 || left < 8) && !BOT.emergency) {
          var rem = remainDist(stops, i), eta = rem == null ? null : rem / Math.max(0.5, BOT.spd);
          if (eta != null && left < eta * 0.97 + 1 && !BOT.noDivert && !stops.some(function (x) { return x.ocean; })) {
            var em = reachablePort(l.lon, l.lat, left, stp.city, left < eta * 0.7 ? null : BOT.legFrom);
            ev('supply_short', { left: left, eta: Math.round(eta), to: em != null ? G.CITY_DATA[em].name : '(없음 — 그대로 간다)' });
            BOT.emergency = true;
            if (em != null && em !== stp.city) { stops.splice(i, 0, { city: em, divert: true }); st.path = null; }
          }
        }
        if (s.day - t0 > (stops.some(function (x) { return x.ocean; }) ? 280 : (BOT.maxLegDays || 200))) return { fail: 'toolong', idx: i };
      }
    }
    updSpd(seaDays, s.stats.distance - dist0);
    return { reached: true, days: seaDays };
  }
  function updSpd(days, dist) { if (days >= 3 && dist > 1) { var v = dist / days; BOT.spd = BOT.spd * 0.6 + v * 0.4; } }
  /** 지금 자리에서 이 구간 끝(첫 도시)까지 남은 뱃길 (°) */
  function remainDist(stops, i) {
    var l = S().loc, x = l.lon, y = l.lat, d = 0;
    for (var k = i; k < stops.length; k++) {
      var t = stops[k].city != null ? dockOf(stops[k].city) : [stops[k].lon, stops[k].lat];
      var p = G.Nav.path(x, y, t[0], t[1], 400000); if (!p) return null;
      d += pathLen(p); x = t[0]; y = t[1];
      if (stops[k].city != null) break;
    }
    return d;
  }
  /** 남은 날 안에 닿을 수 있는, 들어갈 수 있는 아는 항구 가운데 가장 가까운 곳 (목적지가 가장 가까우면 목적지) */
  function reachablePort(lon, lat, left, target, exclude) {
    var s = S(), best = null, bd = 1e9, cand = [];
    s.known.forEach(function (id) {
      var c = G.CITY_DATA[id]; if (!c.port || !R.cityExists(c) || C.entryCheck(c) || id === exclude || (BOT.bad && BOT.bad[id])) return;
      var gd = G.Geo.dist(lon, lat, c.lon, c.lat); if (gd > left * BOT.spd * 1.2 + 2) return;
      cand.push({ id: id, gd: gd });
    });
    cand.sort(function (a, b) { return a.gd - b.gd; });
    cand.slice(0, 6).forEach(function (o) {
      var dk = dockOf(o.id), p = G.Nav.path(lon, lat, dk[0], dk[1], 250000); if (!p) return;
      var d = pathLen(p); if (d < bd) { bd = d; best = o.id; }
    });
    return best;
  }
  BOT.reachablePort = reachablePort;
  function nearestFriendlyPort(lon, lat) {
    var s = S(), best = null, bd = 1e9;
    s.known.forEach(function (id) { var c = G.CITY_DATA[id]; if (!c.port || !R.cityExists(c) || C.entryCheck(c) || (BOT.bad && BOT.bad[id])) return; var d = G.Geo.dist(lon, lat, c.lon, c.lat); if (d < bd) { bd = d; best = id; } });
    return best;
  }
  // ---------------------------------------------------------------- 해전
  async function runBattle() {
    var st = BAT.debug(); if (!st) { await sleep(20); return; }
    var npc = st.npc, s = S(), crew0 = s.fleet.crew, g0 = s.player.gold, ships0 = s.fleet.ships.length;
    var n = 0;
    while (G.Game.scene === BAT && n < 20000) {
      st = BAT.debug(); if (!st) break;
      if (!st.over && !st.busy) think(st);
      BAT.update(0.25);
      await tick();
      if (st.over || st.busy) await sleep(4);
      n++;
    }
    await settle();
    if (s.stats.battles === BOT.battlesLogged) return;
    BOT.battlesLogged = s.stats.battles;
    ev('battle', { enemy: npc.kind, n: npc.n, result: s.stats.wins > (BOT.wins || 0) ? '승리' : '끝', crewLost: crew0 - s.fleet.crew, gold: s.player.gold - g0, shipsLost: ships0 - s.fleet.ships.length });
    BOT.wins = s.stats.wins;
  }
  function think(st) {
    var me = st.ships.filter(function (b) { return b.side === 'me' && b.alive; }), en = st.ships.filter(function (b) { return b.side === 'en' && b.alive; });
    if (!me.length || !en.length) return;
    var pw = function (arr) { return arr.reduce(function (a, b) { return a + b.hp + b.crew * 0.6 + b.guns.n * 3; }, 0); };
    if (pw(me) < pw(en) * 0.75) { if (!st.retreat) { st.retreat = true; } return; }
    var fs = me[0];
    if (!fs.target || !fs.target.alive) {
      var best = null, bd = 1e9; en.forEach(function (o) { var d = Math.hypot(o.x - fs.x, o.y - fs.y); if (d < bd) { bd = d; best = o; } });
      fs.target = best; fs.moveTo = null;
    }
    st.mode = 'free';
  }

  // ================================================================ 한 도시에서 할 일 (계획에 따라)
  BOT.cityHooks = [];
  async function inCity(plan) {
    var c = city(), s = S();
    ev('visit', { city: c.id, cityName: c.name, region: G.REGIONS[c.region], visits: (s.visited || {})[c.id] || 0 });
    await settle();
    // 계약 보고
    if (s.contract && G.Errand.done(s.contract) && G.SPONSOR[s.contract.sponsor].city === c.id) {
      if (!(await reportContract())) await reportViaButler();
    }
  }
  BOT.inCity = inCity;

  // ================================================================ 내보내기
  Object.assign(BOT, {
    S: S, C: C, SEA: SEA, rule: rule, unrule: unrule, tick: tick, sleep: sleep, city: city, here: here, fac: fac,
    doTrade: doTrade, tradeSell: tradeSell, tradeBuy: tradeBuy, doLibrary: doLibrary, doTavern: doTavern, doMarket: doMarket, doInn: doInn, doChurch: doChurch,
    doShipyard: doShipyard, sponsorsHere: sponsorsHere, canMeet: canMeet, reportContract: reportContract, reportViaButler: reportViaButler,
    propose: propose, errandVia: errandVia, announceAll: announceAll, departFor: departFor, sailLeg: sailLeg, dockOf: dockOf, pathLen: pathLen,
    reserveNeed: reserveNeed, countItem: countItem, nearestFriendlyPort: nearestFriendlyPort, strip: strip, tx: tx, trimCrew: trimCrew, bank: bank, repair: repair, assignRole: assignRole, figureheads: figureheads
  });
})();
