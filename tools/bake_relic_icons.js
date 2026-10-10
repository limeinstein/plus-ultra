/* 발견 유물의 코드 그림(G.Art.relicArt)을 개별 256x256 WEBP로 굽는다.
   기존 전용 그림은 덮어쓰지 않으며, --force를 붙였을 때만 전부 다시 만든다.

   node tools/bake_relic_icons.js
   node tools/bake_relic_icons.js --force
*/
'use strict';

const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'images', 'relics');
const REPORT = path.join(ROOT, 'docs', 'art', 'relic-icons-generation.json');
const FORCE = process.argv.includes('--force');

let pw;
try {
  pw = require(path.join(HERE, 'procedural_art', 'node_modules', 'playwright-core'));
} catch (e) {
  pw = require('playwright');
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = process.platform === 'win32'
    ? [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
    ]
    : ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
  return candidates.find(fs.existsSync);
}

function dataScripts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = Array.from(html.matchAll(/<script src="([^"]+)"/g), m => m[1]);
  const chosen = ['js/core/util.js'];
  for (const script of scripts) {
    if (script.startsWith('js/data/')) chosen.push(script);
    if (script === 'js/data/relics.js') break;
  }
  chosen.push('js/art/paint.js', 'js/art/pictures.js');
  return Array.from(new Set(chosen)).map(file => path.join(ROOT, file));
}

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const executablePath = chromePath();
  if (!executablePath) throw new Error('Chrome 또는 Edge를 찾지 못했습니다. CHROME_PATH를 지정해 주세요.');
  const browser = await pw.chromium.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 320, height: 320 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setContent('<!doctype html><html><body></body></html>');
  for (const file of dataScripts()) await page.addScriptTag({ path: file });

  const relics = await page.evaluate(() => Object.keys(G.RELIC).sort().map(id => ({
    id,
    name: G.RELIC[id].name,
    kind: G.RELIC[id].kind,
    desc: G.RELIC[id].desc || ''
  })));
  const made = [], kept = [];
  for (const relic of relics) {
    const out = path.join(OUT, relic.id + '.webp');
    if (!FORCE && fs.existsSync(out)) {
      kept.push(relic.id);
      continue;
    }
    const data = await page.evaluate(id => G.Art.relicArt(G.RELIC[id], 256, 256, { transparent: true }).toDataURL('image/webp', 0.92), relic.id);
    fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
    made.push(relic.id);
  }
  await browser.close();
  if (errors.length) throw new Error('브라우저 오류: ' + errors.slice(0, 5).join(' / '));

  const now = new Date();
  const localDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  const report = {
    date: localDate,
    tool: 'G.Art.relicArt + headless Chromium',
    size: [256, 256],
    format: 'WEBP',
    total: relics.length,
    generated: made.length,
    preserved: kept.length,
    assets: relics
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`유물 ${relics.length}종: 새로 생성 ${made.length}종, 기존 보존 ${kept.length}종`);
  console.log(path.relative(ROOT, REPORT));
})().catch(error => {
  console.error(error && error.stack || error);
  process.exit(1);
});
