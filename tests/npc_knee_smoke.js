/* 실제 무릎상 전체 연결과 대화창 확인. 가짜 그림을 주입하지 않는다. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'npc-knee-check');

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
    await page.waitForFunction(() => window.G && G.Game && G.Sponsor && G.Img, null, { timeout: 90000 });
    const coverage = await page.evaluate(() => {
      const missing = [];
      const keys = new Set();
      G.MATES.filter(m => !m.native).forEach(m => {   // 고장 사람(regionfolk.js 실존 인물)은 얼굴 묶음 그림을 쓴다
        const k = G.Img.pick(G.Img.chain.mateHalf(m.id));
        if (!k) missing.push('동료:' + m.id); else keys.add(k);
      });
      G.SPONSORS.forEach(sp => sp.holders.forEach((h, i) => {
        const spec = G.Art.sponsorSpec(sp, i);
        const k = G.Img.pick(G.Img.chain.halfOf(G.Art.portraitKeys(spec)));
        if (!k) missing.push('후원자:' + sp.id + ':' + i); else keys.add(k);
      }));
      return { mates: G.MATES.filter(m => !m.native).length, sponsors: G.SPONSORS.length,
        tenures: G.SPONSORS.reduce((n, sp) => n + sp.holders.length, 0), missing, paths: [...keys] };
    });
    assert.strictEqual(coverage.mates, 87);
    assert.strictEqual(coverage.sponsors, 119);
    assert.deepStrictEqual(coverage.missing, []);
    const loads = await page.evaluate(async paths => {
      const failed = [];
      for (const src of paths) {
        const img = new Image();
        try {
          await new Promise((resolve, reject) => {
            img.onload = resolve; img.onerror = () => reject(new Error('이미지 읽기 실패'));
            img.src = G.Img.src(src);
          });
          await img.decode(); if (!img.naturalWidth) failed.push(src);
        }
        catch (e) { failed.push({ key: src, url: img.src, error: e.message }); }
      }
      return failed;
    }, coverage.paths);
    if (loads.length) console.log(JSON.stringify({ failures: loads.length, first: loads.slice(0, 3), network: errors.slice(0, 6) }));
    assert.strictEqual(loads.length, 0, '실제 이미지 파일을 모두 읽을 수 있어야 한다');
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20,
        birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.player.fame = 3000;
      G.Game.go('city', { cityId: 0 });
    });
    const clear = async () => {
      for (let i = 0; i < 16 && await page.evaluate(() => G.UI.busy()); i++) {
        await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      }
    };
    await page.waitForTimeout(1500); await clear();
    const cases = [
      { kind: 'mate', id: 'elcano', file: 'real-mate.png' },
      { kind: 'mate', id: 'amina', file: 'real-mate-woman.png' },
      { kind: 'sponsor', id: 'pt_king', year: 1492, file: 'real-sponsor.png' },
      { kind: 'sponsor', id: 'cn_grand', year: 1480, file: 'real-sponsor-new.png' },
      { kind: 'sponsor', id: 'nl_regent', year: 1507, file: 'real-sponsor-woman.png' }
    ];
    for (const c of cases) {
      const selected = await page.evaluate(c => {
        let speaker;
        if (c.kind === 'mate') {
          const m = G.MATE[c.id];
          const p = G.Game.state.player;
          speaker = { name: m.name, portrait: G.Art.mateSpec(m.id), half: G.Img.chain.mateHalf(m.id),
            layout: 'duo', side: 'right', partner: { name: p.name, portrait: p.portrait, half: G.Img.chain.heroHalf() } };
        } else {
          G.Game.state.date.y = c.year;
          speaker = G.Sponsor.speaker(G.SPONSORS.find(s => s.id === c.id));
        }
        G.UI.say('머리부터 무릎까지 보이는 실제 NPC 이미지 확인', speaker);
        return { name: speaker.name, image: G.Img.pick(speaker.half), gender: speaker.portrait.g };
      }, c);
      await page.waitForTimeout(1100);
      const actors = await page.locator('.dlg-actor.tall').count();
      assert.strictEqual(actors, 2, c.id + '의 대화에서 두 사람이 크게 보여야 한다');
      assert(selected.image && /_half$/.test(selected.image), c.id + ' 실제 무릎상');
      if (c.id === 'nl_regent') assert.strictEqual(selected.gender, 'f');
      await page.screenshot({ path: path.join(OUT, c.file) });
      console.log(c.id + ': ' + JSON.stringify(selected));
      await clear();
    }
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ ...coverage, paths: coverage.paths.length, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
