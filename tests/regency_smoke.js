/* 어린 맏아들의 계승 (2026-10-25) — 은퇴·죽음 때 어른이 된 아들이 없고 어린 아들이 있으면 열여섯 살이 될 때까지 세월이 흐른 뒤 뒤를 잇는다.
   아들이 하나도 없으면 예전처럼 끝난다.   node tests/regency_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS || '';
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  async function newGame() {
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 40, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 50000; if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
      s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
  }
  // 대화 창은 바로 넘긴다 (세월이 흐르는 창은 그대로 둔다)
  const stubUI = () => page.evaluate(() => {
    window.__said = [];
    G.UI.alert = async (t, ti) => { window.__said.push((ti || '') + '|' + String(t).replace(/<[^>]+>/g, ' ')); return true; };
    G.UI.confirm = async (t) => { window.__said.push('Q|' + String(t).replace(/<[^>]+>/g, ' ')); return true; };
    G.UI.say = async () => true;
    G.UI.ask = async (t, ch) => (ch && ch[0] ? (ch[0].value !== undefined ? ch[0].value : 0) : null);
    G.UI.choose = async (t, ch) => (ch && ch[0] ? (ch[0].value !== undefined ? ch[0].value : 0) : null);
    window.__end = null; G.Ending.show = async (r) => { window.__end = r; return 'end'; };
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });

    // ① 은퇴: 열여섯 살 딸과 여섯 살 아들 — 딸은 뒤를 잇지 않으므로 아들이 열여섯 살이 될 때까지 기다린다
    await newGame();
    await stubUI();
    const a0 = await page.evaluate(() => {
      const s = G.Game.state, p = s.player, d = s.date;
      p.kids = [
        { name: '마리아', sex: 'f', born: { y: d.y - 17, m: 3, d: 2 }, sk: {}, lg: {}, st: { str: 50, int: 60, mar: 50, cha: 60 }, edu: {} },
        { name: '주앙', sex: 'm', born: { y: d.y - 6, m: 9, d: 20 }, sk: { nav: 1 }, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, aboard: true }
      ];
      s.mates.forEach(m => { m.loyal = 80; m.role = 'none'; m.room = null; });
      s.loc = { mode: 'sea', lon: -20, lat: 30, heading: 0 };   // 바다에 있다가 은퇴해도 고향 항구로
      return { y: d.y, gold: p.gold, mates: s.mates.length, minor: G.Family.minorSon() && G.Family.minorSon().name, wait: G.Family.waitText(G.Family.minorSon()), home: p.home };
    });
    ok(a0.minor === '주앙', '어른이 된 아들이 없고 맏아들 주앙은 6세 — 기다릴 아들 (' + a0.wait + ')');
    const p1 = page.evaluate(() => G.Family.retire(false));
    await page.waitForSelector('.regency', { timeout: 20000 });
    await page.waitForTimeout(800);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'regency_wait.png') });
    const mid = await page.evaluate(() => ({ txt: document.querySelector('.regency').textContent, reg: !!G.Game.state.regency }));
    ok(mid.reg && /주앙 \d+세/.test(mid.txt), '세월이 흐르는 창 — ' + mid.txt.slice(0, 40));
    await p1;
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    const a1 = await page.evaluate((a0) => {
      const s = G.Game.state, p = s.player;
      return { name: p.name, age: G.R.age(), y: s.date.y, gen: p.generation, reg: s.regency, end: window.__end, said: window.__said.join('\n'), gold: p.gold, mates: s.mates.length,
        loyal: Math.min.apply(null, s.mates.map(m => m.loyal == null ? 70 : m.loyal)), city: s.loc.mode + ':' + s.loc.city, scene: G.Game.sceneName, sis: (p.siblings || []).map(x => x.name).join(',') };
    }, a0);
    console.log('   ' + JSON.stringify({ name: a1.name, age: a1.age, y: a1.y, gold: a1.gold, mates: a1.mates, loyal: a1.loyal, city: a1.city, sis: a1.sis }));
    ok(/맏아들 주앙은 아직 \d+세/.test(a1.said) && /열여섯 살이 될 때까지/.test(a1.said), '은퇴를 물을 때 맏아들이 자라기를 기다린다고 알린다');
    ok(a1.name === '주앙' && a1.age === 16 && a1.gen === 2 && !a1.end, '주앙이 열여섯 살이 된 날 2대 제독이 된다 (게임이 끝나지 않는다)');
    ok(a1.y >= a0.y + 9 && a1.y <= a0.y + 11, '세월이 흘렀다 — ' + a0.y + '년 → ' + a1.y + '년');
    ok(!a1.reg && a1.city === 'city:' + a0.home && a1.scene === 'city', '고향 항구 도시에서 이어진다');
    ok(a1.gold >= a0.gold * 0.5 && a1.mates === a0.mates && a1.loyal > 0, '기다리는 동안 급료가 나가지 않고 부하들이 떠나지 않는다 (금화 ' + a0.gold + ' → ' + a1.gold + ', 충성 최저 ' + a1.loyal + ')');
    ok(/열여섯 살이 되었다/.test(a1.said) && /세월이 흘렀다/.test(a1.said), '끝에 흐른 세월과 그 사이의 일을 알린다');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'regency_after.png') });

    // ② 쓰러짐(죽음): 이름도 짓지 못한 갓난 아들 — 집안이 이름을 지어 두고 열여섯 살까지 기다린다
    await newGame();
    await stubUI();
    const b0 = await page.evaluate(() => { const s = G.Game.state; s.player.kids = [{ name: '', unnamed: true, sex: 'm', born: { y: s.date.y, m: s.date.m, d: s.date.d }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {} }]; return s.date.y; });
    await page.evaluate(() => G.Family.retire(true));
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    const b1 = await page.evaluate(() => { const s = G.Game.state; return { name: s.player.name, age: G.R.age(), y: s.date.y, end: window.__end }; });
    ok(!b1.end && b1.age === 16 && b1.name && b1.name !== '시험' && b1.y >= b0 + 15, '쓰러졌을 때 갓난 아들 — 이름(' + b1.name + ')을 짓고 16년 뒤 뒤를 잇는다');

    // ③ 아들이 없다: 딸만 있으면 끝
    await newGame();
    await stubUI();
    const c1 = await page.evaluate(async () => { const s = G.Game.state; s.player.kids = [{ name: '이네스', sex: 'f', born: { y: s.date.y - 3, m: 1, d: 1 }, sk: {}, lg: {}, st: {}, edu: {} }]; const y = s.date.y; await G.Family.retire(false); return { end: window.__end, same: s.date.y === y, said: window.__said.join('\n') }; });
    ok(c1.end === 'retire' && c1.same && /뒤를 이을 아들이 없으면/.test(c1.said), '뒤를 이을 아들이 없으면 예전처럼 모험이 끝난다');

    // ④ 어른이 된 아들이 있으면 예전처럼 바로 잇는다
    await newGame();
    await stubUI();
    const d1 = await page.evaluate(async () => { const s = G.Game.state; s.player.kids = [{ name: '디오구', sex: 'm', born: { y: s.date.y - 18, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 60, int: 60, mar: 60, cha: 60 }, edu: {} }, { name: '루이스', sex: 'm', born: { y: s.date.y - 4, m: 1, d: 1 }, sk: {}, lg: {}, st: {}, edu: {} }]; const y = s.date.y; await G.Family.retire(false); return { name: s.player.name, same: s.date.y === y }; });
    ok(d1.name === '디오구' && d1.same, '어른이 된 아들이 있으면 세월을 보내지 않고 바로 뒤를 잇는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error(errors.slice(0, 5).join('\n'));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
