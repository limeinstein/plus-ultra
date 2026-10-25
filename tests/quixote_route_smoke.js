/* 돈키호테와 산초의 산티아고 순례 — 톨레도에서 만남 → 투르 · 툴루즈(내륙 도시, 지도에 올린다) → 라코루냐에서 합류 (2026-10-25 「투르가 없다」 피드백)
   node tests/quixote_route_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  // 도시에 들어선다 — 그림이 없는 시험 환경에서는 도시 장면이 그림을 기다리느라 늦으므로, 들어선 뒤 순례 차례(C.enter가 부르는 G.Quix.check)를 직접 부른다
  const enter = async (id) => { await page.evaluate(async (id) => { const c = G.CITY_DATA[id]; G.Game.state.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat, via: c.port ? 'sea' : 'land' }; if (G.Quix.pending()) await G.Quix.check(); }, id); };
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 25, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 0 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
      window.__said = [];
      G.UI.say = async (t) => { window.__said.push(String(t)); return true; };
      G.UI.alert = async () => true;
      G.UI.ask = async (t, ch) => (ch && ch[0] ? (ch[0].value !== undefined ? ch[0].value : 0) : null);
      G.UI.choose = async (t, ch) => (ch && ch[0] ? (ch[0].value !== undefined ? ch[0].value : 0) : null);
    });
    const k0 = await page.evaluate(() => { const k = G.Game.state.known; return { toledo: k.includes(4), tours: k.includes(16), toulouse: k.includes(19), coruna: k.includes(2) }; });
    ok(k0.toledo && k0.coruna && !k0.tours && !k0.toulouse, '처음에는 투르·툴루즈(내륙)가 지도에 없다 — 톨레도·라코루냐는 있다');
    await enter(4);
    const a = await page.evaluate(() => { const s = G.Game.state, k = s.known; return { stage: s.quix && s.quix.stage, tours: k.includes(16), toulouse: k.includes(19), said: window.__said.join('\n'), task: G.Quix.html().replace(/<[^>]+>/g, ' ') }; });
    ok(a.stage === 'pilgrim', '톨레도: 풍차 앞에서 돈키호테·산초를 만나 순례를 시작한다');
    ok(a.tours && a.toulouse, '순례를 시작하면 투르·툴루즈가 지도에 올라온다');
    ok(/낭트/.test(a.said) && /보르도/.test(a.said), '산초가 어느 항구에 내려 육로로 가는지 알려 준다');
    ok(/낭트에 내려/.test(a.task) && /보르도에 내려/.test(a.task), '수첩 「할 일」에 가는 길 — ' + a.task.replace(/\s+/g, ' ').slice(0, 120));
    await enter(2);
    ok(await page.evaluate(() => G.Game.state.quix.warned === 1 && G.Game.state.quix.stage === 'pilgrim'), '라코루냐에 먼저 가면 아직 이르다고 한다');
    await enter(16);
    ok(await page.evaluate(() => !!G.Game.state.quix.tours), '투르: 생마르탱 대성당 — 망토 장면');
    await enter(19);
    ok(await page.evaluate(() => !!G.Game.state.quix.toulouse), '툴루즈: 생세르냉 — 물레방아 장면');
    await enter(2);
    const z = await page.evaluate(() => { const s = G.Game.state; return { stage: s.quix.stage, dq: s.mates.some(m => m.id === 'don_quixote'), sp: s.mates.some(m => m.id === 'sancho_panza') }; });
    ok(z.stage === 'done' && z.dq && z.sp, '라코루냐(산티아고): 순례를 마치고 두 사람이 품삯 없는 항해사로 합류');
    // 옛 저장: 순례 중인데 투르를 모르는 저장도 도시에 들어서면 지도에 올라온다
    const old = await page.evaluate(() => { const s = G.Game.state; s.quix = { stage: 'pilgrim' }; s.known = s.known.filter(id => id !== 16 && id !== 19); G.Quix.pending(); return s.known.includes(16) && s.known.includes(19); });
    ok(old, '옛 저장(순례 중)도 투르·툴루즈가 지도에 올라온다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error(errors.slice(0, 5).join('\n'));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
