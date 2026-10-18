/* 바다의 비 점검 (js/systems/searain.js · js/scenes/sea.js · js/systems/audio.js) — node tests/sea_rain_smoke.js   (BROWSER_EXE=크롬 경로)
   · 비가 올 확률: 우기 계절풍(벵골만 7월) > 건기(1월), 적도 무풍대 보탬
   · 피로: 더운 바다 소나기는 피로를 덜고, 추운 바다 폭우는 가장 지치게 한다 · 비 대책(작업 계속·교대 휴식·빗물 받기)에 따라 피로·속력·기강·빗물이 바뀐다
   · 바다에서 날이 바뀌며 비가 시작 → 처음이면 부관이 대책을 묻는다 → 비 대책 단추·상태 줄 「폭우 · 교대 휴식」 → 빗줄기가 짙어진다 → 며칠 뒤 그친다
   · 콘솔 오류 0 · 화면: /tmp/sea_rain */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = process.env.OUT || path.join(require('os').tmpdir(), 'sea_rain');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|404/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      const out = {}, RN = G.Rain, K = G.BALANCE.rain;
      const s = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s;
      // 1) 확률
      out.pJul = RN.chance(88, 15, { y: 1500, m: 7, d: 1 }); out.pJan = RN.chance(88, 15, { y: 1500, m: 1, d: 15 }); out.pItcz = RN.chance(-25, 2, { y: 1500, m: 3, d: 1 }); out.pDry = RN.chance(-25, 25, { y: 1500, m: 3, d: 1 });
      // 2) 피로 (요리 솜씨 없이)
      const at = (lat, lv, order) => { s.loc = { mode: 'sea', lon: -20, lat, heading: 0 }; s.rain = { lv, days: 2, order, asked: true, got: 0, n: 0 }; return { f: +RN.fatigue(false).toFixed(2), sp: RN.speedK(), d: RN.discipline() }; };
      out.hot1 = at(10, 1, 'work'); out.hot2 = at(10, 2, 'work'); out.mild1 = at(40, 1, 'work'); out.cold2 = at(58, 2, 'work');
      out.coldRest = at(58, 2, 'rest'); out.coldCatch = at(58, 2, 'catch'); out.none = at(40, 0, 'work');
      // 3) 바다에서: 날이 바뀌며 비가 시작 → 부관이 묻는다 → 교대 휴식
      G.Game.go('sea', { depart: 0 }); const SEA = G.Scenes.sea, st = SEA.runtime(); st.paused = true;
      await new Promise(res => setTimeout(res, 1500));
      s.rain = { lv: 0, days: 0, order: 'work', asked: false, got: 0, n: 0 };
      const asks = []; const ask0 = G.UI.ask, say0 = G.UI.say;
      G.UI.say = async () => {}; G.UI.ask = async (t, o) => { asks.push(t); const p = o.find(x => x.value === 'rest'); return p ? p.value : o[0].value; };
      const ch0 = RN.chance; RN.chance = () => 1;
      await SEA.runDay();
      RN.chance = ch0;
      out.began = { lv: s.rain.lv, order: s.rain.order, asked: s.rain.asked, ask: asks.find(t => /비 대책/.test(t)) || null };
      // 폭우로 바꾸고 화면을 본다
      s.rain.lv = 2; s.rain.days = 3;
      G.UI.ask = ask0; G.UI.say = say0;
      return out;
    });
    await page.waitForFunction(() => G.Rain.vis() > 0.6 && [...document.querySelectorAll('.status-strip')].some(e => /폭우/.test(e.textContent)), null, { timeout: 30000 }).catch(() => {});
    Object.assign(r, await page.evaluate(async () => {
      const s = G.Game.state, RN = G.Rain, out = {};
      out.vis = +RN.vis().toFixed(2); out.scene = G.Game.sceneName; out.nss = document.querySelectorAll('.status-strip').length; out.nb = document.querySelectorAll('button').length; out.busy = G.UI.busy(); out.dlg = [...document.querySelectorAll('.modal-back, .dialog, .say')].map(e => e.className + ':' + e.textContent.slice(0, 60)).join(' || ');
      const bar = [...document.querySelectorAll('button')].find(b => /비 대책/.test(b.textContent) && b.isConnected);
      out.btn = !!bar && bar.style.display !== 'none';
      out.status = [...document.querySelectorAll('.status-strip')].map(e => e.textContent).join(' / ');
      // 빗물 받기: 물이 는다
      s.rain.order = 'catch'; const w0 = s.fleet.water; s.fleet.water = Math.max(0, w0 - 60); const w1 = s.fleet.water; RN.daily([], {}); out.caught = s.fleet.water - w1;
      return out;
    }));
    await page.screenshot({ path: path.join(OUT, '1_heavy_rain.png') });
    // 비가 오는 중 해전에 들어가도 빗줄기·빗소리의 시각 상태가 끊기지 않는다.
    r.battleRain = await page.evaluate(async () => {
      const before = G.Rain.vis();
      G.Game.go('battle', { npc: { kind: 'pirate', n: 2, zone: 'med' } });
      await new Promise(res => setTimeout(res, 1300));
      return { before: +before.toFixed(2), after: +G.Rain.vis().toFixed(2), scene: G.Game.sceneName, lv: G.Rain.level() };
    });
    await page.screenshot({ path: path.join(OUT, '2_battle_rain.png') });
    await page.evaluate(async () => { G.Game.go('sea', { depart: 0 }); await new Promise(res => setTimeout(res, 700)); G.Scenes.sea.runtime().paused = true; });
    const r2 = await page.evaluate(async () => {
      const s = G.Game.state, RN = G.Rain, out = {};
      // 그칠 때까지
      s.rain.days = 1; const msgs = []; RN.daily(msgs, {}); out.stop = { lv: s.rain.lv, msg: msgs.map(m => m.text).join(' | ') };
      const t0 = Date.now(); while (Date.now() - t0 < 20000 && RN.vis() > 0.2) await new Promise(res => setTimeout(res, 300)); out.visAfter = +RN.vis().toFixed(2);
      const bar = [...document.querySelectorAll('button')].find(b => /비 대책/.test(b.textContent) && b.isConnected); out.btnHidden = !bar || bar.style.display === 'none';
      return out;
    });
    console.log(JSON.stringify(Object.assign(r, r2), null, 1));
    ok(r.pJul > r.pJan + 0.1 && r.pItcz > r.pDry, '비 올 확률: 벵골만 7월 ' + r.pJul.toFixed(2) + ' > 1월 ' + r.pJan.toFixed(2) + ' · 적도 ' + r.pItcz.toFixed(2) + ' > 아열대 ' + r.pDry.toFixed(2));
    ok(r.hot1.f < 0 && r.hot2.f > 0 && r.mild1.f > 0 && r.cold2.f > r.mild1.f && r.cold2.d < 0 && r.none.f === 0, '피로: 더운 바다 소나기 ' + r.hot1.f + ' · 폭우 +' + r.hot2.f + ' · 온대 소나기 +' + r.mild1.f + ' · 추운 바다 폭우 +' + r.cold2.f + ' (기강 ' + r.cold2.d + ')');
    ok(r.coldRest.f < r.cold2.f && r.coldRest.sp < 1 && r.coldRest.d > 0 && r.coldCatch.f > r.cold2.f && r.cold2.sp < 1, '비 대책: 교대 휴식 피로 ' + r.coldRest.f + ' · 속력 ×' + r.coldRest.sp + ' / 빗물 받기 피로 +' + r.coldCatch.f + ' / 작업 계속 폭우 속력 ×' + r.cold2.sp);
    ok(r.began.lv > 0 && r.began.asked && r.began.order === 'rest' && r.began.ask, '바다에서 비가 시작 → 부관이 묻는다 「' + r.began.ask + '」 → 교대 휴식');
    ok(r.vis > 0.5 && r.btn && /폭우/.test(r.status) && /교대 휴식/.test(r.status), '폭우 연출 짙기 ' + r.vis + ' · 「비 대책」 단추 · 상태 줄 「폭우 · 교대 휴식」');
    ok(r.battleRain.scene === 'battle' && r.battleRain.lv === 2 && r.battleRain.after >= r.battleRain.before - 0.1, '비가 오는 중 해전에 들어가도 연출이 이어진다 (' + r.battleRain.before + ' → ' + r.battleRain.after + ')');
    ok(r.caught > 0, '돛천에 빗물을 받아 물 +' + r.caught + '통');
    ok(r.stop.lv === 0 && /비가 그쳤다/.test(r.stop.msg) && r.visAfter < r.vis && r.btnHidden, '비가 그치면 알림 · 연출이 옅어지고(' + r.visAfter + ') 단추가 숨는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) { console.error('✗ ' + e.message + '\n  오류: ' + errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  await browser.close();
})();
