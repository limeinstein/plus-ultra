/* 새 백설공주로 교체한 사건 원화 네 장을 게임 규격으로 내보내고 실제 사건 액자로 검증한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('./procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const record = path.join(root, 'artifacts/snow-white-events-20261123');
const jobs = [
  ['snow_white_rescue', 'legend-events/snow_white_rescue', '왕비의 사냥꾼 — 안도와 감사'],
  ['onceupon', 'achievement-events/onceupon', 'Once Upon a Time — 새로운 항해의 설렘'],
  ['happily_after_all', 'legend-events/happily_after_all', 'Happily Ever After — 다정한 행복'],
  ['dreamcome', 'achievement-events/dreamcome', 'Dream Come True — 편안한 집']
];
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 670 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const results = [];
    for (const [id, key, title] of jobs) {
      const source = path.join(record, id + '.png');
      const data = 'data:image/png;base64,' + fs.readFileSync(source).toString('base64');
      const encoded = await page.evaluate(async data => {
        const image = new Image(); image.src = data; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = 1881; canvas.height = 836;
        const context = canvas.getContext('2d');
        const scale = Math.max(1881 / image.width, 836 / image.height);
        context.drawImage(image, (1881 - image.width * scale) / 2, (836 - image.height * scale) / 2,
          image.width * scale, image.height * scale);
        return { webp: canvas.toDataURL('image/webp', .95), png: canvas.toDataURL('image/png'),
          original: [image.width, image.height] };
      }, data);
      const target = path.join(root, 'images', key + '.webp');
      const backup = path.join(record, 'before', key + '.webp');
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
      fs.writeFileSync(target, Buffer.from(encoded.webp.split(',')[1], 'base64'));
      // 기존 자산 생성 도구가 읽는 구출 원화도 같은 새 그림으로 유지한다.
      if (id === 'snow_white_rescue') {
        const master = path.join(root, 'artifacts/legend-events/snow-white/snow_white_rescue.png');
        const oldMaster = path.join(record, 'before/snow_white_rescue-master.png');
        if (fs.existsSync(master) && !fs.existsSync(oldMaster)) fs.copyFileSync(master, oldMaster);
        fs.writeFileSync(master, Buffer.from(encoded.png.split(',')[1], 'base64'));
      }
      results.push({ id, key, title, original: encoded.original, size: [1881, 836], dataURL: encoded.webp });
    }
    // 게임의 실제 이미지 목록과 사건 액자 코드를 사용하되 전체 세계 렌더러는 띄우지 않는다.
    const sandbox = {};
    sandbox.window = sandbox;
    vm.runInNewContext(fs.readFileSync(path.join(root, 'images/manifest.js'), 'utf8'), sandbox);
    const manifest = sandbox.window.G.IMAGE_FILES || sandbox.window.G.IMAGE_MANIFEST;
    if (manifest) for (const row of results) if (!manifest[row.key]) throw new Error('이미지 목록 누락: ' + row.key);
    await page.setContent('<body style="margin:0;background:#262b31;color:#e9e4d9;font:16px sans-serif"><div id="ui" style="position:relative;width:1100px;height:670px"></div></body>');
    await page.evaluate(rows => {
      const images = Object.fromEntries(rows.map(r => [r.key, r.dataURL]));
      window.G = { U: {}, UI: {}, FX: { famScene: { w: 1008, top: 32 } },
        Game: { uiW: () => 1100, uiH: () => 670 },
        Img: { file: key => images[key], src: key => images[key], wait: promise => promise,
          load: async key => { const im = new Image(); im.src = images[key]; await im.decode(); return im; } } };
    }, results);
    await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'js/systems/familyevent.js'), 'utf8') });
    for (const row of results) {
      const shown = await page.evaluate(async ({ key, title }) => {
        const shot = G.FamEv.showPic({ img: key, title, noStand: true });
        await shot.ready; await new Promise(resolve => requestAnimationFrame(resolve));
        const im = document.querySelector('.famscene img');
        return { width: im.naturalWidth, height: im.naturalHeight, shown: im.complete };
      }, row);
      await page.screenshot({ path: path.join(record, row.id + '-frame.png') });
      await page.evaluate(async () => { await G.FamEv.stopPic(); });
      if (shown.width !== 1881 || shown.height !== 836 || !shown.shown) throw new Error('장면 표시 실패: ' + row.id);
      row.frame = shown; delete row.dataURL;
    }
    const validation = { images: results, errors };
    fs.writeFileSync(path.join(record, 'validation.json'), JSON.stringify(validation, null, 2));
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('사건 원화 4장 적용, 1881×836 규격·실제 사건 액자 로딩·정리 확인, 콘솔 오류 0.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
