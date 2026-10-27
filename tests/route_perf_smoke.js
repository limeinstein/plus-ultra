/* 항로망이 커도 「출항」이 곧 열리는가 (QA 24·34·35) — node tests/route_perf_smoke.js   (BROWSER_EXE=크롬 경로, ROOT=다른 폴더를 재려면)
   · 리스본에서 가까운 항구 60곳을 차례로 이은 항로망 / 항구 180곳 + 항로 약 1500개 (무작위)
   · 출항 → 부관 질문이 뜰 때까지, 「자동항해로 출항」 → 목적지 창이 뜰 때까지, 목적지를 고른 뒤 바다로 나갈 때까지 (ms)
   · 불러온 뒤(페이지를 새로 열고) 첫 출항도 잰다 — 목표 50ms 미만
   · 고른 목적지의 뱃길이 바르다 (자동항해가 켜지고 길이 목적지 부두에서 끝남, 거친 길이 아님)
   · 없어진 항구는 항로망의 다리가 되지 않는다 · s.routes를 바꿔 끼우거나 손으로 고쳐도 항로망이 따라온다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = process.env.ROOT ? path.resolve(process.env.ROOT) : path.resolve(__dirname, '..');
const LIMIT = +(process.env.LIMIT || 50);          // 목표 (ms)
const HARD = +(process.env.HARD || LIMIT * 3);     // 이것을 넘으면 실패 — 목표~이것 사이는 경고만 (다른 시험이 함께 돌아 바쁜 기계에서 가끔 튄다)
let fails = 0;
function ok(v, msg) { if (!v) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }
function fast(ms, msg) { if (ms < LIMIT) console.log('  ✓ ' + msg + ' ' + ms + 'ms < ' + LIMIT); else if (ms < HARD) console.log('  ! ' + msg + ' ' + ms + 'ms — 목표 ' + LIMIT + 'ms 넘음 (기계가 바쁜지 확인, ' + HARD + 'ms 넘으면 실패)'); else ok(false, msg + ' ' + ms + 'ms ≥ ' + HARD); }

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.errs = [];
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  page.on('pageerror', e => page.errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) page.errs.push('console: ' + m.text()); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Routes && G.Scenes && G.Scenes.city && G.Scenes.city.B.harbor, null, { timeout: 120000 });
  await page.evaluate(async () => {
    await G.Game.ensureGeo(); G.Nav.init();
    // 실제 게임에서는 항구 화면의 한글이 이미 그려져 있다 — 브라우저의 첫 글자 배치 시간은 빼고 잰다
    const w = G.UI.window({ title: '항구', icon: 'anchor', html: '<div class="choices">' + G.CITY_DATA.filter(c => c && c.port).slice(0, 60).map(c => '<div class="choice">' + G.icon('anchor') + '<span>' + c.name + ' <small class="muted">이베리아</small></span><span class="r">북동쪽 · 약 3일</span></div>').join('') + '</div>' });
    w.content.offsetHeight; w.close(null);
  });
  return page;
}
// 페이지 안: 새 게임 + 항로망 만들기
function build(kind) {
  G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
  const RT = G.Routes, L = G.CITY_DATA[0];
  let ports;
  if (kind === 'chain60') {
    ports = G.CITY_DATA.filter(c => c && c.port && G.R.cityExists(c)).sort((a, b) => G.Geo.dist(a.lon, a.lat, L.lon, L.lat) - G.Geo.dist(b.lon, b.lat, L.lon, L.lat)).slice(0, 60).map(c => c.id);
    for (let i = 1; i < ports.length; i++) RT.record(ports[i - 1], ports[i], 4);
  } else {
    ports = G.CITY_DATA.filter(c => c && c.port).map(c => c.id);
    for (let i = 1; i < ports.length; i++) RT.record(ports[i - 1], ports[i], 5);
    let rng = 1; const rnd = n => { rng = (rng * 16807) % 2147483647; return rng % n; };
    for (let i = 0; i < 1500; i++) RT.record(ports[rnd(ports.length)], ports[rnd(ports.length)], 5);
    // 기록 날수가 없는 항로 (튜토리얼처럼) — 이런 곳이 뱃길 찾기를 부르던 곳
    Object.keys(G.Game.state.routes).forEach((k, i) => { if (i % 3 === 0) G.Game.state.routes[k].best = null; });
    if (RT.touch) RT.touch(); else RT.ver++;
  }
  const s = G.Game.state;
  s.fleet.food = 9999; s.fleet.water = 9999;
  return { nPorts: ports.length, nRoutes: Object.keys(s.routes).length };
}
// 페이지 안: 리스본 항구에서 출항 → 질문 → 자동항해 → 목적지 창 → 먼 항구 고르기, 각 단계 시간
async function depart(destHint) {
  const C = G.Scenes.city, H = C.B.harbor, c = G.CITY_DATA[0], s = G.Game.state, RT = G.Routes;
  const now = () => performance.now(), tick = () => new Promise(r => setTimeout(r, 0));
  const out = {};
  const keep = { mate: C.mate, ask: C.mateAsk, fade: G.UI.fade, go: G.Game.go };
  let t0, asked = 0, went = null;
  C.mate = async () => {};
  C.mateAsk = async (txt, opts) => { asked++; if (asked === 1) { out.askMs = +(now() - t0).toFixed(1); out.autoBtn = opts[1].label; out.autoDis = !!opts[1].dis; return 'auto'; } out.warn = txt; return true; };
  G.UI.fade = async fn => fn();
  G.Game.go = (sc, arg) => { went = { sc, arg, ms: +(now() - t1).toFixed(1) }; };
  // 가장 먼 항로망 항구(곧장 오간 적 없는 곳)를 즐겨찾기에 올려 맨 위에 둔다
  const far = destHint != null ? destHint : RT.reachable(c.id).filter(id => !RT.direct(c.id, id) && G.CITY_DATA[id].port && G.R.cityExists(G.CITY_DATA[id]))
    .sort((a, b) => G.Geo.dist(G.CITY_DATA[b].lon, G.CITY_DATA[b].lat, c.lon, c.lat) - G.Geo.dist(G.CITY_DATA[a].lon, G.CITY_DATA[a].lat, c.lon, c.lat))[0];
  s.autoFav = far != null ? [far] : [];
  let t1 = 0;
  try {
    t0 = now();
    const p = H.depart(c);
    let box = null;
    for (let i = 0; i < 4000 && !(box = document.querySelector('.autodest')); i++) await tick();
    out.winMs = +(now() - t0).toFixed(1);
    out.rows = box ? box.querySelectorAll('.choice').length : 0;
    const row = box && [...box.querySelectorAll('.choice')].find(e => e.textContent.indexOf(G.CITY_DATA[far].name) >= 0);
    out.farRow = row ? row.textContent.replace(/\s+/g, ' ').trim() : null;
    t1 = now();
    if (row) row.click();
    await p;
    out.pickMs = went ? went.ms : null;
  } finally { C.mate = keep.mate; C.mateAsk = keep.ask; G.UI.fade = keep.fade; G.Game.go = keep.go; }
  out.far = far; out.farName = G.CITY_DATA[far].name; out.went = went && went.arg;
  out.dests = H.autoDests(c).length;
  return out;
}
// 페이지 안: 고른 목적지로 실제로 바다에 나가 뱃길을 검사
function sail(arg) {
  const s = G.Game.state, RT = G.Routes;
  G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0;
  const L0 = performance.now();
  G.Game.go('sea', arg);
  const ms = +(performance.now() - L0).toFixed(0);
  const st = G.Scenes.sea.runtime(), B = G.CITY_DATA[arg.autoTo], db = B.dock || [B.lat, B.lon];
  const p = st.path || [], end = p[p.length - 1] || [0, 0];
  let L = 0, land = 0;
  for (let i = 1; i < p.length; i++) {
    L += Math.hypot(G.Geo.wrapLon(p[i][0] - p[i - 1][0]), p[i][1] - p[i - 1][1]);
    for (let f = 0.25; f < 1; f += 0.25) { const lo = p[i - 1][0] + G.Geo.wrapLon(p[i][0] - p[i - 1][0]) * f, la = p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f; if (!G.Geo.isSea(lo, la, -0.3)) land++; }
  }
  const est = RT.days(arg.depart, arg.autoTo), rough = RT.roughDays ? RT.roughDays(arg.depart, arg.autoTo) : null;
  return { goMs: ms, auto: !!st.autoOn, pilot: !!st.pilot, direct: !!st.direct, pts: p.length, len: +L.toFixed(1), land, endOff: +Math.hypot(G.Geo.wrapLon(end[0] - db[1]), end[1] - db[0]).toFixed(2), exactDays: est, rough };
}

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errs = [];
  const T = {};
  try {
    console.log('ROOT', ROOT);
    // ---------------- 60항구 체인
    let page = await open(browser);
    T.chain = await page.evaluate(build, 'chain60');
    T.chain.d1 = await page.evaluate(depart);
    T.chain.d2 = await page.evaluate(depart);
    T.chain.sail = T.chain.d1.went ? await page.evaluate(sail, T.chain.d1.went) : null;
    // 보급이 빠듯할 때: 고른 곳 하나만 뱃길을 재어 보급 경고 (새 페이지 — 재 둔 뱃길 없음)
    errs.push(...page.errs); await page.close(); page = await open(browser);
    await page.evaluate(build, 'chain60');
    T.chain.tight = await page.evaluate(async () => {
      const s = G.Game.state, R = G.R; s.fleet.food = 9999; s.fleet.water = 9999;
      const k = 40 / Math.min(R.daysOfFood(), R.daysOfWater()); s.fleet.food = Math.ceil(9999 * k); s.fleet.water = Math.ceil(9999 * k);
      const sup = Math.min(R.daysOfFood(), R.daysOfWater());
      const before = G.Routes.measured ? G.Routes.measured(0, 77) : null;
      return { sup, before, rough: G.Routes.roughDays ? G.Routes.roughDays(0, 77) : null };
    });
    T.chain.tight.d = await page.evaluate(depart, 77);
    T.chain.tight.exact = await page.evaluate(() => ({ measured: G.Routes.measured ? G.Routes.measured(0, 77) : null, days: G.Routes.days(0, 77) }));
    console.log('60항구 체인', JSON.stringify(T.chain));
    errs.push(...page.errs); await page.close();
    // ---------------- 180항구 + 항로 약 1500
    page = await open(browser);
    T.big = await page.evaluate(build, 'big');
    T.big.d1 = await page.evaluate(depart);
    T.big.d2 = await page.evaluate(depart);
    T.big.perFrame = await page.evaluate(() => {   // 해도·바다 미니맵이 매 장면 도시마다 묻는 것
      const RT = G.Routes, t0 = performance.now(); let n = 0;
      for (let k = 0; k < 20; k++) G.CITY_DATA.forEach(c => { if (c && RT.isOpen(0, c.id)) n++; });
      const a = (performance.now() - t0) / 20, t1 = performance.now(); RT.list(); return { isOpenAllCitiesMs: +a.toFixed(2), listMs: +(performance.now() - t1).toFixed(1) };
    });
    const json = await page.evaluate(() => G.State.serialize());
    console.log('180항구', JSON.stringify(T.big));
    errs.push(...page.errs); await page.close();
    // ---------------- 불러온 뒤 첫 출항 (새 페이지 — 기억해 둔 셈이 없다)
    page = await open(browser);
    T.loaded = await page.evaluate(j => { G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' }); G.Game.state = G.State.deserialize(j); const s = G.Game.state; s.fleet.food = 9999; s.fleet.water = 9999; return { nRoutes: Object.keys(s.routes).length }; }, json);
    T.loaded.d1 = await page.evaluate(depart);
    T.loaded.sail = T.loaded.d1.went ? await page.evaluate(sail, T.loaded.d1.went) : null;
    console.log('불러온 뒤', JSON.stringify(T.loaded));
    // ---------------- 없어진 항구 · 캐시 (QA 34·35)
    T.cache = await page.evaluate(async () => {
      const ng = () => G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const RT = G.Routes, out = {}, [A, B, C, D, F] = [0, 7, 83, 21, 38];
      ng();
      const gone = G.CITY_DATA.filter(c => c && c.port && !G.R.cityExists(c));
      out.goneN = gone.length;
      if (gone.length) {
        const X = gone[0].id, P = F;
        RT.record(A, X, 3); RT.record(X, P, 3);
        out.gone = { x: G.CITY_DATA[X].name, openAP: RT.isOpen(A, P), inDests: G.Scenes.city.B.harbor.autoDests(G.CITY_DATA[A]).some(d => d.c.id === P) };
        // 그 항구가 생기는 해가 되면 다시 다리가 된다 (달이 바뀌면 다시 센다)
        const c = G.CITY_DATA[X], y0 = G.Game.state.date.y;
        if (c.founded) { G.Game.state.date.y = c.founded; out.gone.openWhenFounded = RT.isOpen(A, P); G.Game.state.date.y = y0; out.gone.closedAgain = !RT.isOpen(A, P); }
      }
      ng(); const s = G.Game.state; RT.record(A, B, 3); RT.record(B, C, 3); const before = RT.isOpen(A, C);
      s.routes = { [RT.key(A, F)]: { n: 1, best: 3, last: 0 }, [RT.key(F, D)]: { n: 1, best: 3, last: 0 } };
      out.swap = { before, afterAC: RT.isOpen(A, C), afterAD: RT.isOpen(A, D) };
      ng(); G.Game.state.routes = {}; G.Game.state.routes[RT.key(A, B)] = { n: 0, best: null, last: 0 }; G.Game.state.routes[RT.key(B, C)] = { n: 1, best: 3, last: 0 };
      const ac0 = RT.isOpen(A, C); G.Game.state.routes[RT.key(A, B)] = { n: 1, best: null, last: 0 };   // 튜토리얼처럼 손으로
      await new Promise(r => setTimeout(r, 0));
      out.hand = { before: ac0, after: RT.isOpen(A, C) };
      return out;
    });
    console.log('캐시', JSON.stringify(T.cache));
    errs.push(...page.errs); await page.close();

    const st = x => [x.askMs, x.winMs, x.pickMs].join(' / ');
    console.log('\n[ms] 출항→질문 / 출항→목적지 창 / 고른 뒤→바다로');
    console.log('  60항구 체인 첫 번째 ', st(T.chain.d1), ' 두 번째 ', st(T.chain.d2));
    console.log('  180항구+' + T.big.nRoutes + '항로 첫 번째 ', st(T.big.d1), ' 두 번째 ', st(T.big.d2));
    console.log('  불러온 뒤 첫 번째 ', st(T.loaded.d1));
    ok(T.chain.d1.dests >= 59 && T.big.d1.dests >= 100, '목적지 수: 체인 ' + T.chain.d1.dests + ' · 180항구 ' + T.big.d1.dests);
    for (const [nm, x] of [['60항구 체인', T.chain.d1], ['180항구', T.big.d1], ['180항구 두 번째', T.big.d2], ['불러온 뒤', T.loaded.d1]]) {
      fast(x.askMs, nm + ': 출항 질문');
      fast(x.winMs, nm + ': 목적지 창');
      if (!/두 번째/.test(nm)) ok(x.farRow && /어림/.test(x.farRow), nm + ': 항로망 목적지는 어림 날수 — ' + x.farRow);
      ok(x.went && x.went.autoTo === x.far, nm + ': 고른 곳(' + x.farName + ')으로 자동항해 출항 (고른 뒤 ' + x.pickMs + 'ms)');
    }
    for (const [nm, v] of [['60항구 체인', T.chain.sail], ['불러온 뒤', T.loaded.sail]]) {
      ok(v && v.auto && !v.direct && v.pts > 2 && v.endOff < 1.5 && v.land === 0, nm + ': 바다에 나가 자동항해 ×4, 뱃길이 목적지 부두에서 끝나고 뭍을 지나지 않음 ' + JSON.stringify(v));
    }
    const ti = T.chain.tight;
    ok(ti.before === false && ti.rough && ti.rough.rough && ti.exact.measured && ti.d.warn && ti.d.warn.indexOf(ti.exact.days + '일쯤') >= 0 && ti.exact.days > ti.sup,
      '보급 ' + ti.sup + '일분: 어림 ' + (ti.rough && ti.rough.days) + '일 → 고른 뒤 그곳만 뱃길을 재어 ' + ti.exact.days + '일 · 보급 경고 (' + ti.d.pickMs + 'ms) — ' + ti.d.warn);
    // 59구간을 각각 4일로 기록한 시험 자료다. 목록은 익힌 항로의 합을 보수적으로 표시하고,
    // 목적지를 고른 뒤 재 둔 지름길이 있으면 다음 목록부터 현재 선속의 예상으로 바뀐다.
    ok(+T.chain.d1.farRow.match(/약 (\d+)일/)[1] === (T.chain.nPorts - 1) * 4,
      '항로망 어림은 익힌 구간 날수를 더한다 (직선거리로 대륙을 가로질러 줄이지 않음): ' + T.chain.d1.farRow);
    ok(!/어림/.test(T.chain.d2.farRow) && +T.chain.d2.farRow.match(/약 (\d+)일/)[1] < +T.chain.d1.farRow.match(/약 (\d+)일/)[1],
      '목적지 선택 때 실제 뱃길을 재면 다음 목록에서 측정 날수로 갱신된다: ' + T.chain.d2.farRow);
    ok(T.big.perFrame.isOpenAllCitiesMs < 2, '모든 도시 isOpen 한 번 (매 장면) ' + T.big.perFrame.isOpenAllCitiesMs + 'ms · 항로 수첩 ' + T.big.perFrame.listMs + 'ms');
    fast(T.big.perFrame.listMs, '항로 수첩 목록');
    ok(T.cache.goneN > 0 && T.cache.gone && !T.cache.gone.openAP && !T.cache.gone.inDests, '없어진 항구(' + (T.cache.gone && T.cache.gone.x) + ')는 항로망 다리가 아니다');
    if (T.cache.gone && T.cache.gone.openWhenFounded != null) ok(T.cache.gone.openWhenFounded && T.cache.gone.closedAgain, '그 항구가 생기는 해에는 다리가 되고, 날짜를 되돌리면 다시 아님');
    ok(T.cache.swap.before && !T.cache.swap.afterAC && T.cache.swap.afterAD, 's.routes를 바꿔 끼우면 항로망도 바뀐다');
    ok(!T.cache.hand.before && T.cache.hand.after, '항로를 손으로 고쳐도(튜토리얼) 다음 차례에 항로망이 따라온다');
  } catch (e) { fails++; console.log('✗ ' + (e.stack || e.message)); }
  finally { await browser.close(); }
  ok(!errs.length, '콘솔 오류 0 ' + errs.slice(0, 3).join(' | '));
  if (fails) { console.log(fails + '개 실패'); process.exit(1); }
})();
