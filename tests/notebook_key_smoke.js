/* 수첩 단축키 (js/ui/ui.js G.Keys notebook·nb_<탭> · UI.notebookKey · js/ui/info.js I.open onKey·I.preset) — node tests/notebook_key_smoke.js (BROWSER_EXE=크롬 경로)
   · 도시·바다에서 N(기본)으로 수첩을 열고 닫는다 · 창이 떠 있으면 열지 않는다 · 탭 단축키(기본 없음)로 그 탭으로 열고, 열려 있으면 넘어간다
   · 설정 「키보드 설정」: 수첩·수첩 탭 바로가기 칸 · 「빼기」로 없음 · 새 키로 바꾸기 · 꼭 있어야 하는 키(방향 등)는 빼앗지 않는다
   · 뺀 단축키는 다음 새 게임에도 없음 그대로 · 콘솔 오류 0 · 화면: /tmp/notebook_key */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/notebook_key';
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  const nbOpen = () => page.evaluate(() => [...document.querySelectorAll('.modal-back .win .title')].some(t => /항해 수첩/.test(t.textContent)));
  const tabOn = () => page.evaluate(() => { const t = document.querySelector('.modal-back .tabs .tab.on'); return t ? t.textContent : null; });
  async function settle(ms) { await page.waitForTimeout(ms || 450); }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    try { await page.evaluate(() => localStorage.clear()); } catch (e) { /* */ }
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
      s.settings.res = 0.35; G.State.save = () => {}; G.UI.toast = () => {};
      s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && [...document.querySelectorAll('#ui button')].some(b => b.offsetParent && b.textContent.replace(/\s+/g, '') === '수첩'), null, { timeout: 60000 });
    await settle(800);
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));   // 도착 알림 등

    const def = await page.evaluate(() => ({ nb: G.Keys.label('notebook'), mates: G.Keys.label('nb_mates'), n: G.Keys.actions.filter(a => a.id.indexOf('nb_') === 0).length }));
    ok(def.nb === 'N' && def.mates === '없음' && def.n === 13, '기본: 수첩 N · 수첩 탭 13칸은 없음');

    // 1) 도시에서 N으로 열고 닫기
    await page.keyboard.press('KeyN'); await settle();
    ok(await nbOpen(), '도시에서 N → 수첩이 열린다');
    await page.screenshot({ path: path.join(OUT, 'city_open.png') });
    await page.keyboard.press('KeyN'); await settle();
    ok(!(await nbOpen()), '수첩이 열려 있을 때 N → 닫힌다');

    // 2) 탭 단축키: 닫혀 있으면 그 탭으로 열고, 열려 있으면 넘어간다
    await page.evaluate(() => { const st = G.Game.state.settings; G.Keys.bind(st, 'nb_mates', 'KeyK'); G.Keys.bind(st, 'nb_fleet', 'KeyJ'); });
    await page.keyboard.press('KeyK'); await settle();
    ok((await nbOpen()) && (await tabOn()) === '동료', 'K(수첩 — 동료) → 동료 탭으로 열린다');
    await page.keyboard.press('KeyJ'); await settle();
    ok((await tabOn()) === '함대', '열린 수첩에서 J(수첩 — 함대) → 함대 탭으로 넘어간다');
    await page.keyboard.press('Escape'); await settle();
    ok(!(await nbOpen()), 'Esc로도 그대로 닫힌다');

    // 3) 다른 창이 떠 있으면 열지 않는다
    await page.evaluate(() => { window.__al = G.UI.alert('시험 알림'); });
    await settle(300);
    await page.keyboard.press('KeyN'); await settle();
    ok(!(await nbOpen()), '알림 창이 떠 있으면 N을 눌러도 수첩이 열리지 않는다');
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));

    // 4) 설정 「키보드 설정」
    await page.evaluate(() => { window.__set = G.Info.settings(); });
    await page.waitForSelector('.modal-back [data-keyact=notebook]');
    const ui = await page.evaluate(() => ({ sub: !!document.querySelector('.modal-back .keybind-sub'), nb: document.querySelector('[data-keyact=notebook]').textContent,
      mates: document.querySelector('[data-keyact=nb_mates]').textContent, clr: !!document.querySelector('[data-keyclr=notebook]'), upClr: !!document.querySelector('[data-keyclr=up]') }));
    await page.evaluate(() => document.querySelector('.modal-back .keybind-sub').scrollIntoView());
    await page.screenshot({ path: path.join(OUT, 'settings.png') });
    ok(ui.sub && ui.nb === 'N' && ui.mates === 'K' && ui.clr && !ui.upClr, '설정: 수첩(N)·수첩 탭 바로가기 묶음 · 수첩에는 「빼기」, 방향키에는 없음');
    // 꼭 있어야 하는 키는 빼앗지 않는다 (없음인 칸에 ↑를 주려 하면 막는다)
    const blocked = await page.evaluate(() => { const st = G.Game.state.settings, r = G.Keys.bind(st, 'nb_items', 'ArrowUp'); return { r, up: st.keys.up, it: st.keys.nb_items }; });
    ok(blocked.r.blocked === 'up' && blocked.up === 'ArrowUp' && blocked.it === '', '없음인 칸에 방향키를 주려 하면 막는다 (방향키를 빼앗지 않는다)');
    // 빼기 → 없음
    await page.click('[data-keyclr=notebook]'); await settle(200);
    ok((await page.$eval('[data-keyact=notebook]', b => b.textContent)) === '없음', '「빼기」 → 수첩 단축키 없음');
    await page.keyboard.press('Escape'); await settle();
    await page.keyboard.press('KeyN'); await settle();
    ok(!(await nbOpen()), '수첩 단축키를 빼면 N을 눌러도 열리지 않는다');
    // 다시 정하기: 설정에서 누르고 B
    await page.evaluate(() => { window.__set = G.Info.settings(); });
    await page.waitForSelector('.modal-back [data-keyact=notebook]');
    await page.click('[data-keyact=notebook]'); await page.keyboard.press('KeyB'); await settle(200);
    ok((await page.$eval('[data-keyact=notebook]', b => b.textContent)) === 'B', '설정에서 수첩 키를 B로 바꾼다');
    await page.click('[data-keyact=notebook]'); await page.keyboard.press('Delete'); await settle(200);
    const cleared = await page.$eval('[data-keyact=notebook]', b => b.textContent);
    ok(cleared === '없음', '키를 기다릴 때 Delete → 없음');
    await page.click('[data-keyact=notebook]'); await page.keyboard.press('KeyB'); await settle(200);
    await page.keyboard.press('Escape'); await settle();

    // 5) 뺀 단축키는 다음 새 게임에도 그대로 (설정 기억 — 탭 키 nb_items는 없음, nb_mates는 K)
    const carry = await page.evaluate(() => { G.State.rememberSettings(G.Game.state.settings); const s2 = G.State.newGame({ name: '다음', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' }); G.Keys.ensure(s2.settings); return { nb: s2.settings.keys.notebook, mates: s2.settings.keys.nb_mates, items: s2.settings.keys.nb_items, up: s2.settings.keys.up }; });
    ok(carry.nb === 'KeyB' && carry.mates === 'KeyK' && carry.items === '' && carry.up === 'ArrowUp', '바꾼·뺀 단축키가 새 게임에도 그대로 (' + JSON.stringify(carry) + ')');

    // 6) 바다에서도 — 단추를 누른 것처럼 (바다는 수첩이 열린 동안 멈춘다)
    await page.evaluate(() => { G.Game.go('sea', { depart: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'sea' && [...document.querySelectorAll('#ui button')].some(b => b.offsetParent && b.textContent.replace(/\s+/g, '') === '수첩'), null, { timeout: 60000 });
    await settle(800);
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));
    await page.keyboard.press('KeyB'); await settle();
    ok(await nbOpen(), '바다에서 B(바꾼 키) → 수첩이 열린다');
    await page.screenshot({ path: path.join(OUT, 'sea_open.png') });
    await page.keyboard.press('KeyB'); await settle();
    ok(!(await nbOpen()), '바다에서 다시 B → 닫힌다');
    await page.keyboard.press('KeyK'); await settle();
    ok((await nbOpen()) && (await tabOn()) === '동료', '바다에서 K → 동료 탭으로 열린다');
    await page.keyboard.press('Escape'); await settle();

    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
