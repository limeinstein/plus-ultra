/* 라이벌 → 일반 NPC → 지역·역할 NPC → 동료 무릎상 전체 연결과 실제 대화 구도를 확인한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'portrait-knee-extension');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure().errorText));
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Img && G.Scenes && G.Scenes.city, null, { timeout: 90000 });
    const coverage = await page.evaluate(() => {
      const groups = ['rivals', 'npc', 'npc-roles', 'mates'];
      const all = {}, missing = [], mismatch = [];
      groups.forEach(group => {
        const prefix = 'portraits/' + group + '/';
        const base = G.Img.list(prefix).filter(k => !/_half$/.test(k));
        all[group] = base;
        base.forEach(k => { if (!G.Img.has(k + '_half')) missing.push(k); });
      });
      const rivals = all.rivals.map(k => k.slice('portraits/rivals/'.length));
      rivals.forEach(name => {
        const bust = G.Img.pick(G.Img.chain.rival(name));
        const half = G.Img.pick(G.Img.chain.rivalHalf(name));
        if (!bust || half !== bust + '_half') mismatch.push('경쟁자:' + name + ':' + bust + ':' + half);
      });
      G.CITY_DATA.forEach(c => G.Img.NPCS.forEach(n => {
        const bust = G.Img.pick(G.Img.chain.npc(n[0], c));
        const half = G.Img.pick(G.Img.chain.npcHalf(n[0], c));
        if (bust && half !== bust + '_half') mismatch.push('마을:' + c.id + ':' + n[0] + ':' + bust + ':' + half);
      }));
      return { counts: Object.fromEntries(groups.map(g => [g, all[g].length])), missing, mismatch,
        paths: groups.flatMap(g => all[g].map(k => k + '_half')) };
    });
    assert.deepStrictEqual(coverage.counts, { rivals: 6, npc: 32, 'npc-roles': 240, mates: 57 });
    assert.deepStrictEqual(coverage.missing, []);
    assert.deepStrictEqual(coverage.mismatch, []);
    const failedLoads = await page.evaluate(async paths => {
      const failed = [];
      for (const key of paths) {
        const img = new Image();
        try {
          await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = G.Img.src(key); });
          await img.decode(); if (!img.naturalWidth) failed.push(key);
        } catch (e) { failed.push(key); }
      }
      return failed;
    }, coverage.paths);
    assert.deepStrictEqual(failedLoads, []);

    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20,
        birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.player.fame = 3000;
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForTimeout(1200);
    async function clear() {
      for (let i = 0; i < 18 && await page.evaluate(() => G.UI.busy()); i++) {
        await page.keyboard.press('Escape'); await page.waitForTimeout(120);
      }
    }
    await clear();
    const cases = [
      { kind: 'npc', id: 'trader', city: 0, file: 'npc-europe.png' },
      { kind: 'npc', id: 'harbormaster', style: 'cn', file: 'npc-role-china.png' },
      { kind: 'rival', file: 'rival.png' }
    ];
    for (const c of cases) {
      const selected = await page.evaluate(c => {
        let who;
        if (c.kind === 'rival') {
          const name = G.Img.list('portraits/rivals/').filter(k => !/_half$/.test(k))[0].slice('portraits/rivals/'.length);
          who = G.Scenes.city.B.tavern.duo({ name, portrait: G.Art.rivalSpec(name), half: G.Img.chain.rivalHalf(name) });
        } else {
          const city = c.style ? G.CITY_DATA.find(x => x.style === c.style) : G.CITY_DATA[c.city];
          G.Game.state.loc.city = city.id;
          who = G.Scenes.city.npc(c.id, '확인용 NPC');
        }
        G.UI.say('머리부터 무릎까지 보이는 실제 인물 이미지 확인', who);
        return { name: who.name, image: G.Img.pick(who.half) };
      }, c);
      await page.waitForTimeout(1000);
      assert.strictEqual(await page.locator('.dlg-actor.tall').count(), 2, c.kind + ' 두 사람이 크게 보여야 한다');
      assert(selected.image && /_half$/.test(selected.image));
      await page.screenshot({ path: path.join(OUT, c.file) });
      await clear();
    }
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ counts: coverage.counts, decoded: coverage.paths.length, dialogCases: cases.length, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
