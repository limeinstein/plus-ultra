/* 전체 발견물의 실제 획득·중복 방지·저장 복원. 선택 대화와 부가 사건만 자동 응답한다. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/discovery-gif-qa-20261126');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; localStorage.clear(); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      G.Scenes.title.exit(); await G.Loader.hide(); G.UI.clearScreen(); await G.Game.ensureGeo();
      G.State.newGame({ name: '발견 획득 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.res = .35; s.flags.relicTip = 1; s.date = { y: 1699, m: 3, d: 21 };
      // 각 발견의 고유 선택·전투는 이 검사의 범위가 아니다. 실제 획득과 보상 함수는 그대로 둔다.
      G.UI.say = async () => {}; G.UI.toast = () => {}; G.U.sleep = async () => {};
      G.Scenes.discoveryCard = async () => {}; G.Scenes.discoveryVoices = async () => {};
      G.Scenes.city.news = async () => {}; G.Game.refreshHud = () => {};
      const shown = [];
      G.Scenes.discoveryReveal = async d => { shown.push(d.id); return true; };
      for (const [name, method] of [['Names', 'offer'], ['FolkJoin', 'afterFind'], ['Achieve', 'afterFind'],
        ['Banter', 'play'], ['Mirage', 'vanish'], ['OlympianApostles', 'afterFind']]) {
        if (G[name]) G[name][method] = async () => {};
      }
      G.Disc.takeRelic = async () => {};
      const check = (value, label) => { if (!value) throw Error(label); };
      const results = [];
      for (const d of G.DISCOVERIES) {
        delete s.disc[d.id]; s.player.items = [];
        // 춘분 발견의 실제 자료 조건을 먼저 충족한다. 다른 발견물의 경로·규칙은 바꾸지 않는다.
        for (const id of d.need || []) s.disc[id] = { me: true, found: 16990320 };
        if (d.needRelic) s.player.items.push({ id: d.needRelic });
        const prior = s.stats.found;
        check(await G.Disc.find(d, 'special'), '획득 실패:' + d.id);
        check(G.Disc.foundByMe(d.id) && s.disc[d.id].evidence && s.stats.found === prior + 1, '발견 기록:' + d.id);
        const before = JSON.stringify({ stats: s.stats.found, gold: s.player.gold, fame: s.player.fame, relics: s.disc[d.id].relics });
        check(await G.Disc.find(d, 'special') === false, '중복 획득 허용:' + d.id);
        check(before === JSON.stringify({ stats: s.stats.found, gold: s.player.gold, fame: s.player.fame, relics: s.disc[d.id].relics }), '중복 보상:' + d.id);
        results.push({ id: d.id, cat: d.cat, found: true, duplicateBlocked: true });
      }
      const beforeSave = results.map(r => ({ id: r.id, found: s.disc[r.id] && s.disc[r.id].found, me: s.disc[r.id] && s.disc[r.id].me }));
      G.Game.state = G.State.deserialize(G.State.serialize());
      check(beforeSave.every(r => G.Disc.foundByMe(r.id)), '전체 발견 저장 복원');
      return { total: results.length, revealCalls: shown.length, saved: beforeSave.length, results };
    });
    assert.deepEqual(errors, []);
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'find.json'), JSON.stringify({ ...report, consoleErrors: errors, pass: true }, null, 2));
    console.log('PASS:', report.total, '종 실제 획득·중복 방지·저장 복원, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
