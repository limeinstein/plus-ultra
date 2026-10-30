/* file://에서 추가 발견물·소지품의 실제 해독, 발견·다시 보기, 수첩 그림을 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/additions-20261030');
const baseRows = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art/additions-20261030-prompts.json'), 'utf8')).assets;
const insectSpec = path.join(ROOT, 'docs/art/insects-20261030-prompts.json');
const insectRows = fs.existsSync(insectSpec) ? JSON.parse(fs.readFileSync(insectSpec, 'utf8')).assets : [];
const rows = baseRows.concat(insectRows);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Reel && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const report = await page.evaluate(async rows => {
      const loaded = [], animated = [];
      function ok(value, message) { if (!value) throw new Error(message); }
      for (const row of rows) {
        const id = row.id;
        if (row.kind === 'nature' || row.kind === 'ruin' || row.kind === 'animal') {
          const d = G.DISC[id];
          ok(d && G.Img.has('discoveries/' + id) && G.Reel.has(d), id + ': 발견 그림 등록');
          const reel = await G.Reel.load(G.Reel.key(d));
          ok(reel && reel.cols === 6 && reel.cw === 576 && reel.ch === 256, id + ': 시트 실제 해독');
          ok(reel.n === (row.kind === 'nature' ? 24 : 18), id + ': 장면 수');
          const end = await G.Img.load('discovery-ends/' + id);
          ok(end && end.naturalWidth === 576 && end.naturalHeight === 256, id + ': 끝 장면 해독');
        } else {
          const data = row.kind === 'relic' ? G.RELIC[id] : G.ITEM[id];
          const key = (row.kind === 'relic' ? 'relics/' : 'items/') + id;
          ok(data, id + ': 아이템 등록');
          const chain = row.kind === 'relic' ? G.Img.chain.relic(data) : G.Img.chain.item(data);
          ok(G.Img.pick(chain) === key, id + ': 공통 대용 그림보다 전용 아이콘 우선');
          const im = await G.Img.load(key);
          ok(im && im.naturalWidth === 256 && im.naturalHeight === 256, id + ': 전용 아이콘 해독');
          const cv = document.createElement('canvas'); cv.width = cv.height = 256;
          const ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0);
          ok(ctx.getImageData(0, 0, 1, 1).data[3] === 0, id + ': 브라우저 투명 배경');
        }
        loaded.push(id);
      }
      ok(G.RESORTS.every(id => G.Reel.has(G.DISC[id])), '기존 두 곳을 포함해 휴양지 40곳에 모두 발견 연출');
      const bugs=rows.filter(r=>r.kind==='animal').map(r=>r.id);
      for(const relic of Object.values(G.RELIC).filter(r=>bugs.includes(r.relic))) {
        const key=G.Img.pick(G.Img.chain.relic(relic));
        ok(key==='discovery-ends/'+relic.relic || key==='relics/'+relic.id, relic.id+': 곤충 표본 전용 그림');
        ok(await G.Img.load(key),relic.id+': 곤충 표본 그림 해독');
      }
      for (const id of ['jeju', 'capri', 'septizodium', 'manwoldae'].concat(bugs.length ? ['morpho','cometmoth'] : [])) {
        const reel = G.Reel.now('discovery-sheets/' + id), cv = document.createElement('canvas');
        cv.width = 576; cv.height = 256; document.body.appendChild(cv);
        const movie = G.Reel.play(cv, reel, { ms: 180 });
        const first = cv.toDataURL(); await movie.done;
        const last = cv.toDataURL(); ok(first !== last, id + ': 실제 애니메이션');
        G.Reel.drawLast(cv, reel); ok(last === cv.toDataURL(), id + ': 마지막 장면에서 정지');
        cv.remove(); animated.push(id);
      }
      const prefer = G.PREFER_GIF;
      try {
        G.PREFER_GIF = true;
        ok(rows.filter(r => /nature|ruin|animal/.test(r.kind)).every(r => !G.Reel.has(G.DISC[r.id]) && G.Img.isAnim(G.Img.pick(['discoveries/' + r.id]))), 'GIF 팩 원본 경로');
      } finally { G.PREFER_GIF = prefer; }
      return { loaded, animated };
    }, rows);
    console.log('PASS: '+rows.length+'종 file:// 그림 해독·투명도·전용 아이콘 체인·휴양지 40곳·실제 재생');
    await page.evaluate(async rows => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.State.newGame({ name: '발견 그림 검수', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Game.state.settings.res = .35;
      await G.Game.ensureGeo(); G.Game.go('sea', { depart: 0 });
      G.Game.scene.update = function () {};
      G.Game.state.player.items = rows.filter(r => r.kind === 'item' || r.kind === 'relic').map(r => ({ id: r.id }));
      G.Info.open('items');
    }, rows);
    await page.waitForSelector('.items-tbl .relic-ic');
    assert.strictEqual(await page.locator('.items-tbl .relic-ic').count(), 31, '수첩에 아이콘 31개');
    await page.screenshot({ path: path.join(OUT, 'items-runtime.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.waitForSelector('.items-tbl', { state: 'detached' });
    await page.evaluate(() => {
      G.FX.reveal.playMs = 220; G.FX.reveal.titleMs = 1600; G.FX.reveal.replayTitleMs = 100;
      window.additionLines = []; G.UI.say = async text => { window.additionLines.push(text); };
    });
    const revealIds=['jeju','septizodium'].concat(insectRows.length?['morpho']:[]);
    for (const id of revealIds) {
      await page.evaluate(id => {
        window.additionRevealDone = false;
        G.Scenes.discoveryReveal(G.DISC[id], 100).then(v => { window.additionRevealDone = v; });
      }, id);
      await page.waitForSelector('.reveal.on.titled .rv-reel', { state: 'visible', timeout: 15000 });
      await page.screenshot({ path: path.join(OUT, id + '-reveal.png'), animations: 'disabled' });
      await page.waitForFunction(() => window.additionRevealDone, null, { timeout: 15000 });
      assert.strictEqual(await page.locator('.reveal').count(), 0, id + ': 발견 장면 정리');
      assert(await page.evaluate(id => G.Scenes.discoveryReplay(G.DISC[id]), id), id + ': 수첩 다시 보기');
    }
    const catalog = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    catalog.on('pageerror', e => errors.push('도감: ' + e.message));
    catalog.on('console', m => { if (m.type() === 'error') errors.push('도감: ' + m.text()); });
    await catalog.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await catalog.goto(pathToFileURL(path.join(ROOT, 'catalog.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await catalog.waitForSelector('#tab-items');
    const catalogCount = await catalog.evaluate(rows => {
      for (const row of rows) {
        const data = row.kind === 'item' ? G.ITEM[row.id] : row.kind === 'relic' ? G.RELIC[row.id] : G.DISC[row.id];
        if (!data) throw new Error('도감 자료 누락: ' + row.id);
      }
      return rows.length;
    }, rows);
    await catalog.locator('#tab-items').click();
    await catalog.locator('#q').fill('imjin_gat');
    await catalog.waitForFunction(() => document.querySelectorAll('.card').length === 1);
    await catalog.waitForSelector('.card .thumb canvas, .card .thumb img');
    assert.strictEqual(await catalog.locator('.card').count(), 1, '도감에서 새 사건 소지품 찾기');
    await catalog.locator('.card').click();
    await catalog.waitForSelector('#detail[open]');
    await catalog.screenshot({ path: path.join(OUT, 'catalog-gat.png'), animations: 'disabled' });
    assert.deepStrictEqual(errors, [], '브라우저 콘솔 오류');
    fs.writeFileSync(path.join(OUT, 'runtime-report.json'), JSON.stringify({ ...report, inventoryIcons: 31, catalogCount, revealAndReplay: revealIds, errors }, null, 2));
    console.log('PASS: 실제 수첩 아이콘 31개·자연/유적/곤충 발견·다시 보기·도감 '+catalogCount+'종, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
