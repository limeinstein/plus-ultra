/* Game state: creation, persistence, time. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var ST = {};
  G.State = ST;

  var CHART_W = 720, CHART_H = 360; // 0.5 degree cells
  ST.CHART_W = CHART_W; ST.CHART_H = CHART_H;

  /** params: {name, nation, job, age, birth:{m,d}, st:{...}, sk:{...}, lg:[...], diff} */
  ST.newGame = function (p) {
    var home = p.nation === 'PT' ? 0 : 7;
    var S = {
      version: 1,
      seed: Math.floor(U.rand() * 1e9),
      date: { y: 1480, m: 5, d: 1 },
      day: 0,
      player: {
        name: p.name, nation: p.nation, job: p.job, born: { y: 1480 - p.age, m: p.birth.m, d: p.birth.d },
        st: p.st, luck: U.ri(30, 70), sk: p.sk, lg: p.lg,
        fame: 0, notoriety: 0, gold: p.gold || 3000, bank: 0, items: [], equip: { weapon: 'rapier', armor: null },
        hp: 100, home: home, wife: null, kids: [], generation: 1, jailed: 0
      },
      fleet: { ships: [], crew: 0, food: 0, water: 0, cargo: {}, fatigue: 0, discipline: 80, daysOut: 0, sick: 0, scurvy: 0, rats: 0 },
      mates: [],
      loc: { mode: 'city', city: home, lon: G.CITY_DATA[home].lon, lat: G.CITY_DATA[home].lat, heading: Math.PI },
      contract: null,
      disc: {}, hints: {},
      known: [], chart: null,
      market: {}, sponsors: {}, maids: {}, owners: {},
      flags: {}, log: [], history: 0,
      stats: { trades: 0, profit: 0, battles: 0, wins: 0, sunk: 0, captured: 0, distance: 0, found: 0 },
      circ: null,
      settings: { diff: p.diff || 'normal', speed: 1, sound: 0.5, music: 0.35 }
    };
    S.player.items.push({ id: 'rapier' });
    S.player.items.push({ id: 'compass' });
    // starting ship depends on job (p.ships가 있으면 그 배들로 시작 — 앞의 것이 기함, 테스트용 캐릭터)
    var shipType = p.job === 'merchant' ? 'cog' : p.job === 'conq' || p.job === 'soldier' ? 'caravel' : 'caravel';
    var types = (p.ships || []).filter(function (id) { return G.SHIP[id]; }).slice(0, G.MAX_SHIPS || 5);
    if (!types.length) types = [shipType];
    var hc = G.CITY_DATA[S.player.home], wood = hc && G.Ships ? G.Ships.localWood(hc).id : null;
    types.forEach(function (id, i) {
      var ship = R.newShip(id, i ? null : p.nation === 'PT' ? '산 가브리엘' : '산타 클라라', wood);
      ship.guns = { type: 'saker', n: 4 };
      S.fleet.ships.push(ship);
    });
    S.fleet.crew = Math.min(U.sum(S.fleet.ships, function (s) { return s.crewMax; }), U.sum(S.fleet.ships, function (s) { return s.crewMin; }) + 8);
    S.fleet.food = Math.ceil(R.dailyUse(S.fleet.crew) * 20);
    S.fleet.water = Math.ceil(R.dailyUse(S.fleet.crew) * 20);
    S.fleet.mat = (G.BALANCE && G.BALANCE.matStart) || 10;     // 자재(수리용 목재·밧줄·돛천) — 바다 위 수리에 쓴다
    S.fleet.cargo = {};
    // starting mate
    S.mates.push({ id: 'rocco', role: 'first', joined: 0, loyal: 80 });
    // known cities: Iberia, western Med, Atlantic islands; home region
    G.CITY_DATA.forEach(function (c) {
      if (c.region === 0 || c.region === 2 || (c.region === 1 && c.port) || [78, 79, 81, 82, 83, 85].indexOf(c.id) >= 0) S.known.push(c.id);
    });
    if (S.known.indexOf(home) < 0) S.known.push(home);
    ST.chartInit(S);
    // reveal home waters on chart
    G.Game.state = S;
    if (G.Names) G.Names.apply();       // 이름(대륙·곶·해협)은 이 게임의 것으로 다시 입힌다
    if (G.Wander) G.Wander.apply();     // 철새(떠돌이 항해사)를 이 게임의 것으로
    ST.revealChart(-12, 38, 9);
    ST.revealChart(0, 40, 9);
    ST.revealChart(12, 38, 8);
    ST.revealChart(24, 37, 7);
    ST.revealChart(-2, 50, 7);
    ST.revealChart(-16, 30, 7);
    ST.log('항해자 ' + p.name + U.j(p.name, '이/가').slice(p.name.length) + ' ' + G.CITY_DATA[home].name + '에서 모험의 첫걸음을 내디뎠다.');
    return S;
  };

  // ---------------------------------------------------------------- sea chart bitset
  ST.chartInit = function (S) { S.chartBits = new Uint8Array(CHART_W * CHART_H / 8); };
  ST.revealChart = function (lon, lat, r) {
    var S = G.Game.state; if (!S.chartBits) ST.chartInit(S);
    var cx = Math.floor((lon + 180) * 2), cy = Math.floor((90 - lat) * 2), rr = Math.ceil(r * 2), n = 0;
    for (var y = cy - rr; y <= cy + rr; y++) {
      if (y < 0 || y >= CHART_H) continue;
      for (var x = cx - rr; x <= cx + rr; x++) {
        var dx = x - cx, dy = y - cy; if (dx * dx + dy * dy > rr * rr) continue;
        var xx = ((x % CHART_W) + CHART_W) % CHART_W, i = y * CHART_W + xx;
        if (!(S.chartBits[i >> 3] & (1 << (i & 7)))) { S.chartBits[i >> 3] |= 1 << (i & 7); n++; }
      }
    }
    if (n) S.chartDirty = true;
    return n;
  };
  ST.charted = function (lon, lat) {
    var S = G.Game.state; if (!S.chartBits) return false;
    var x = Math.floor((G.Geo.wrapLon(lon) + 180) * 2), y = Math.floor((90 - lat) * 2);
    if (y < 0 || y >= CHART_H) return false;
    var i = y * CHART_W + x; return !!(S.chartBits[i >> 3] & (1 << (i & 7)));
  };
  ST.chartPercent = function () {
    var S = G.Game.state, n = 0; for (var i = 0; i < S.chartBits.length; i++) { var b = S.chartBits[i]; while (b) { n += b & 1; b >>= 1; } }
    return n / (CHART_W * CHART_H);
  };

  // ---------------------------------------------------------------- log
  ST.log = function (text) {
    var S = G.Game.state; S.log.push({ d: U.dateNum(S.date), t: text }); if (S.log.length > 300) S.log.shift();
  };

  // ---------------------------------------------------------------- persistence
  /* 저장 (항해 일지)
     · 브라우저 저장소(localStorage)에 압축해서 넣는다 — 15비트 LZ 압축(lz-string의 UTF-16 방식)으로 약 1/6 크기.
       예전 저장(압축 안 함)도 그대로 읽는다.
     · IndexedDB에도 같은 것을 한 벌 더 넣어 둔다. localStorage가 가득 찼거나 막혀 있어도(사생활 보호 창, 다른 게임과 같은
       github.io 주소를 함께 써서 5MB가 찬 경우 등) 일지가 남고, 한쪽이 지워져도 다른 쪽에서 되살린다.
     · 브라우저에 「지우지 말아 달라」고 부탁한다(navigator.storage.persist — 아이폰 사파리는 7일 넘게 안 열면 지우기도 한다).
     · 일지를 파일로 내려받고 파일에서 불러올 수 있다 (기기를 옮기거나 웹판↔파일판을 오갈 때). */
  var KEY = 'plusultra_save_', PACK = '\u0001LZ1:';
  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); }
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function lzPack(input) {
    if (input == null) return '';
    var BITS = 15, out = [], val = 0, pos = 0;
    function bit(b) { val = (val << 1) | b; if (pos === BITS - 1) { pos = 0; out.push(String.fromCharCode(val + 32)); val = 0; } else pos++; }
    function bitsOf(v, n) { for (var i = 0; i < n; i++) { bit(v & 1); v >>= 1; } }
    var dict = {}, fresh = {}, w = '', enlarge = 2, dictSize = 3, numBits = 2, c, wc, i;
    function emit(w) {
      if (Object.prototype.hasOwnProperty.call(fresh, w)) {
        var code = w.charCodeAt(0);
        if (code < 256) { bitsOf(0, numBits); bitsOf(code, 8); } else { bitsOf(1, numBits); bitsOf(code, 16); }
        if (--enlarge === 0) { enlarge = Math.pow(2, numBits); numBits++; }
        delete fresh[w];
      } else bitsOf(dict[w], numBits);
      if (--enlarge === 0) { enlarge = Math.pow(2, numBits); numBits++; }
    }
    for (i = 0; i < input.length; i++) {
      c = input.charAt(i);
      if (!Object.prototype.hasOwnProperty.call(dict, c)) { dict[c] = dictSize++; fresh[c] = true; }
      wc = w + c;
      if (Object.prototype.hasOwnProperty.call(dict, wc)) w = wc;
      else { emit(w); dict[wc] = dictSize++; w = c; }
    }
    if (w !== '') emit(w);
    bitsOf(2, numBits);
    while (true) { val = val << 1; if (pos === BITS - 1) { out.push(String.fromCharCode(val + 32)); break; } else pos++; }
    return out.join('') + ' ';
  }
  function lzUnpack(s) {
    if (!s) return '';
    var BITS = 15, RESET = 16384, length = s.length;
    var dict = [], enlarge = 4, dictSize = 4, numBits = 3, entry = '', result = [], w, c, i;
    var data = { val: s.charCodeAt(0) - 32, pos: RESET, idx: 1 };
    function read(n) {
      var bits = 0, max = Math.pow(2, n), p = 1;
      while (p !== max) {
        var b = data.val & data.pos;
        data.pos >>= 1;
        if (data.pos === 0) { data.pos = RESET; data.val = data.idx < length ? s.charCodeAt(data.idx++) - 32 : 0; }
        bits |= (b > 0 ? 1 : 0) * p; p <<= 1;
      }
      return bits;
    }
    for (i = 0; i < 3; i++) dict[i] = i;
    var next = read(2);
    if (next === 0) c = String.fromCharCode(read(8));
    else if (next === 1) c = String.fromCharCode(read(16));
    else return '';
    dict[3] = c; w = c; result.push(c);
    while (true) {
      if (data.idx > length) return '';
      var cc = read(numBits);
      if (cc === 0) { dict[dictSize++] = String.fromCharCode(read(8)); cc = dictSize - 1; enlarge--; }
      else if (cc === 1) { dict[dictSize++] = String.fromCharCode(read(16)); cc = dictSize - 1; enlarge--; }
      else if (cc === 2) return result.join('');
      if (enlarge === 0) { enlarge = Math.pow(2, numBits); numBits++; }
      if (dict[cc]) entry = dict[cc];
      else if (cc === dictSize) entry = w + w.charAt(0);
      else return null;
      result.push(entry);
      dict[dictSize++] = w + entry.charAt(0);
      enlarge--;
      w = entry;
      if (enlarge === 0) { enlarge = Math.pow(2, numBits); numBits++; }
    }
  }
  /** 저장할 수 없는 것(화면 요소·함수·서로 가리키는 고리)이 섞여 있어도 일지가 깨지지 않게 건너뛴다 (어디서 걸렸는지 알린다) */
  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { /* 아래에서 다시 */ }
    var seen = typeof WeakSet === 'function' ? new WeakSet() : null, bad = [];
    var out = JSON.stringify(obj, function (k, v) {
      if (typeof v === 'function' || (typeof Node !== 'undefined' && v instanceof Node)) { bad.push(k); return undefined; }
      if (v && typeof v === 'object' && seen) { if (seen.has(v)) { bad.push(k); return undefined; } seen.add(v); }
      return v;
    });
    if (bad.length && window.console) console.warn('[저장] 저장할 수 없는 값을 건너뛰었습니다: ' + bad.slice(0, 8).join(', '));
    return out;
  }
  ST.serialize = function () {
    var S = G.Game.state;
    var copy = {}; for (var k in S) if (k !== 'chartBits' && k !== 'chartDirty') copy[k] = S[k];
    copy.chart = b64(S.chartBits);
    return safeStringify(copy);
  };
  ST.deserialize = function (json) {
    var S = JSON.parse(json);
    S.chartBits = S.chart ? unb64(S.chart) : new Uint8Array(CHART_W * CHART_H / 8);
    delete S.chart;
    return S;
  };
  function packed(data) { return PACK + lzPack(data); }
  function unpack(v) { if (!v) return null; if (v.indexOf(PACK) === 0) return lzUnpack(v.slice(PACK.length)); return v; }
  function metaNow() {
    var S = G.Game.state;
    return { name: S.player.name, date: U.fmtDate(S.date), place: S.loc.mode === 'city' ? G.CITY_DATA[S.loc.city].name : S.loc.mode === 'land' ? '뭍 탐험 중' : '해상', fame: S.player.fame, t: Date.now() };
  }
  function lsGet(k) { try { return window.localStorage ? localStorage.getItem(k) : null; } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return null; } catch (e) { return e || new Error('localStorage'); } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } }

  // ---- IndexedDB 한 벌 (비동기). 쓸 수 없는 브라우저면 조용히 빠진다
  var idbP = null, mem = {};      // mem[slot] = {meta, data} — IndexedDB에서 읽어 둔 것
  function idb() {
    if (idbP) return idbP;
    idbP = new Promise(function (res) {
      try {
        if (!window.indexedDB) return res(null);
        var rq = indexedDB.open('plusultra', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('saves'); };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = rq.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
    return idbP;
  }
  function idbPut(slot, rec) {
    return idb().then(function (db) {
      if (!db) return false;
      return new Promise(function (res) {
        try { var tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').put(rec, 'slot' + slot); tx.oncomplete = function () { res(true); }; tx.onerror = tx.onabort = function () { res(false); }; }
        catch (e) { res(false); }
      });
    });
  }
  function idbAll() {
    return idb().then(function (db) {
      if (!db) return {};
      return new Promise(function (res) {
        var out = {};
        try {
          var rq = db.transaction('saves', 'readonly').objectStore('saves').openCursor();
          rq.onsuccess = function () { var c = rq.result; if (c) { out[String(c.key).replace('slot', '')] = c.value; c.continue(); } else res(out); };
          rq.onerror = function () { res(out); };
        } catch (e) { res(out); }
      });
    });
  }
  /** 처음 열 때 IndexedDB의 일지를 읽어 둔다 (localStorage에 없는 일지도 목록에 나오게) */
  ST.ready = idbAll().then(function (all) { for (var k in all) if (all[k] && all[k].data) mem[k] = all[k]; }).catch(function () {});
  var askedPersist = false;
  function persist() {
    if (askedPersist) return; askedPersist = true;
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* 무시 */ }
  }
  /** 이 주소(같은 github.io를 쓰는 다른 페이지 포함)의 localStorage를 누가 얼마나 쓰나 — 글자 수 */
  ST.storageReport = function () {
    var r = { ours: 0, others: 0, top: [] };
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), n = k.length + (localStorage.getItem(k) || '').length;
        if (k.indexOf(KEY) === 0) r.ours += n; else { r.others += n; r.top.push([k, n]); }
      }
    } catch (e) { /* 무시 */ }
    r.top.sort(function (a, b) { return b[1] - a[1]; }); r.top = r.top.slice(0, 5);
    return r;
  };
  function man(n) { return n >= 10000 ? Math.round(n / 10000) + '만' : String(n); }
  function why(e) {
    var n = e && (e.name || ''), m = String(e && e.message || e || '');
    if (/Quota|quota|exceed/i.test(n + m)) {
      var r = ST.storageReport();
      return '브라우저 저장 공간이 가득 찼습니다 (이 주소에서 PLUS ULTRA 일지 ' + man(r.ours) + '자 · 같은 github.io의 다른 페이지 ' + man(r.others) + '자' + (r.top.length ? ' — 가장 큰 것: ' + r.top[0][0] : '') + ')';
    }
    if (/Security|denied|access/i.test(n + m)) return '이 브라우저(사생활 보호 창·앱 안 브라우저 등)가 저장을 막고 있습니다';
    return '브라우저 저장소에 쓰지 못했습니다 (' + (n || m).slice(0, 60) + ')';
  }
  /** 예전 형식(압축 안 함)으로 남은 일지를 압축해 자리를 만든다 */
  function repackOld() {
    for (var i = 0; i < 4; i++) { var v = lsGet(KEY + i); if (v && v.indexOf(PACK) !== 0) lsSet(KEY + i, packed(v)); }
  }

  /** 저장: 결과 {ok, where:'browser'|'backup'|null, msg} — 브라우저 저장소가 막혀도 IndexedDB에 남으면 ok */
  ST.saveAsync = function (slot) {
    persist();
    var data, meta;
    try { data = packed(ST.serialize()); meta = metaNow(); }
    catch (e) { console.error(e); ST.lastError = '일지를 만들지 못했습니다: ' + (e && e.message); return Promise.resolve({ ok: false, where: null, msg: ST.lastError }); }
    var err = lsSet(KEY + slot, data);
    if (err) { repackOld(); err = lsSet(KEY + slot, data); }
    if (!err) err = lsSet(KEY + slot + '_meta', JSON.stringify(meta));
    if (err) { lsDel(KEY + slot); console.warn('[저장] localStorage: ', err); }
    var rec = { meta: meta, data: data, t: meta.t };
    mem[slot] = rec;
    return idbPut(slot, rec).then(function (ok2) {
      if (!err) { ST.lastError = ''; return { ok: true, where: 'browser', msg: '' }; }
      ST.lastError = why(err);
      if (ok2) return { ok: true, where: 'backup', msg: ST.lastError + ' — 대신 보조 저장소(IndexedDB)에 기록했습니다.' };
      delete mem[slot];
      return { ok: false, where: null, msg: ST.lastError + '. 「일지를 파일로 내려받기」로 남겨 두십시오.' };
    });
  };
  /** 예전처럼 바로 돌려받는 저장 (자동 저장) — 브라우저 저장소에 넣었으면 true. 보조 저장소 기록은 뒤에서 이어진다 */
  ST.save = function (slot) {
    var p = ST.saveAsync(slot), ok = false;
    // localStorage 쓰기는 saveAsync 안에서 이미 끝났다 — 그 결과로 판단
    ok = !!lsGet(KEY + slot + '_meta') && (lsGet(KEY + slot) || '').indexOf(PACK) === 0;
    p.then(function (r) { if (!r.ok && G.UI && G.UI.toast) G.UI.toast('자동 저장 실패 — ' + r.msg, 'book', 6000); });
    return ok || !!mem[slot];
  };
  function rawOf(slot) {
    var v = lsGet(KEY + slot), m = mem[slot];
    var lm = ST.metaLocal(slot);
    // 두 곳 가운데 더 새것 (한쪽만 지워졌거나 한쪽 쓰기가 실패했을 때)
    if (v && m && m.meta && lm && m.meta.t > lm.t + 1000) return m.data;
    return v || (m && m.data) || null;
  }
  ST.load = function (slot) {
    try {
      var data = unpack(rawOf(slot));
      if (!data) return null;
      return ST.deserialize(data);
    } catch (e) { console.error(e); return null; }
  };
  ST.loadAsync = function (slot) { return ST.ready.then(function () { return ST.load(slot); }); };
  ST.metaLocal = function (slot) { try { var m = lsGet(KEY + slot + '_meta'); return m ? JSON.parse(m) : null; } catch (e) { return null; } };
  ST.meta = function (slot) {
    var a = ST.metaLocal(slot), b = mem[slot] && mem[slot].meta;
    if (a && lsGet(KEY + slot)) return b && b.t > a.t + 1000 ? b : a;
    return b || null;
  };
  ST.hasAnySave = function () { for (var i = 0; i < 4; i++) if (ST.meta(i)) return true; return false; };

  // ---- 파일로 내려받기 / 파일에서 불러오기
  ST.exportSlot = function (slot) {
    var raw = rawOf(slot), meta = ST.meta(slot);
    if (!raw || !meta) return false;
    return download(raw.indexOf(PACK) === 0 ? raw : packed(raw), meta, slot);
  };
  /** 지금 진행을 곧바로 파일로 (브라우저 저장소가 모두 막혔을 때) */
  ST.exportNow = function () { try { return download(packed(ST.serialize()), metaNow(), null); } catch (e) { console.error(e); return false; } };
  function download(data, meta, slot) {
    var body = JSON.stringify({ format: 'plusultra-save', v: 1, slot: slot, meta: meta, data: data });
    var d = new Date(meta.t || Date.now()), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    // 파일 이름은 영문·숫자만 (한글 이름은 브라우저에 따라 「download」로 바뀌어 버린다): 게임 날짜 + 저장한 날
    var name = 'PLUS_ULTRA_' + (slot == null ? 'now' : slot === 0 ? 'auto' : 'slot' + slot) + '_' + String(meta.date || '').replace(/[^0-9]+/g, '-').replace(/^-|-$/g, '') + '_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json';
    try {
      var url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
      var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
      return name;
    } catch (e) { console.error(e); return false; }
  };
  /** 파일 고르기 창 → {state, meta} (취소하면 null) */
  ST.importFile = function () {
    return new Promise(function (res, rej) {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = function () {
        var f = inp.files && inp.files[0]; if (!f) return res(null);
        var rd = new FileReader();
        rd.onload = function () {
          try {
            var o = JSON.parse(rd.result), raw;
            if (o && o.format === 'plusultra-save') raw = unpack(o.data);
            else if (o && o.player && o.date) raw = rd.result;          // 압축하지 않은 상태 그대로
            if (!raw) throw new Error('항해 일지 파일이 아닙니다');
            var S = ST.deserialize(raw);
            if (!S || !S.player || !S.date) throw new Error('일지 내용이 맞지 않습니다');
            res({ state: S, meta: o.meta || null });
          } catch (e) { rej(e); }
        };
        rd.onerror = function () { rej(rd.error || new Error('파일을 읽지 못했습니다')); };
        rd.readAsText(f);
      };
      inp.click();
    });
  };
})(window.G = window.G || {});
