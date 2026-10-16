/* 합성 효과음과 장면 연결 (tests/sfx_smoke.js) — node tests/sfx_smoke.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Audio && G.Audio.SFX, null, { timeout: 90000 });
    const played = await page.evaluate(async () => {
      G.Audio.unlock();
      await new Promise(r => setTimeout(r, 80));
      const out = [];
      for (const name of G.Audio.SFX) {
        const variants = [];
        for (let v = 0; v < G.Audio.SFX_VARIANTS; v++) { variants.push(G.Audio.sfx(name, v)); await new Promise(r => setTimeout(r, 18)); }
        out.push([name, variants]);
      }
      return out;
    });
    ok(played.length === 25 && played.every(x => x[1].length === 3 && x[1].every(Boolean)), '효과음 25종 × 세 변형을 Web Audio로 모두 생성');
    ok(await page.evaluate(() => G.Audio.travel('sea', 0.8) === true && G.Audio.travel('sea', 0.8) === false), '이동음은 실제 시간 간격으로 제한되어 배속에서도 겹치지 않음');

    const src = files => files.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    const code = src(['js/systems/audio.js', 'js/ui/tradefx.js', 'js/scenes/sea.js', 'js/scenes/city.js', 'js/scenes/land.js', 'js/scenes/town.js', 'js/scenes/battle.js', 'js/games/duel.js', 'js/games/landwar.js', 'js/city/tavern.js', 'js/city/trade.js', 'js/city/bookshelf.js', 'js/systems/discovery.js', 'js/systems/family.js']);
    const hooks = {
      wake: "travel('sea'", sail: "cfg[0] = 'sail'", depart: "sfx('depart'", dock: "sfx('dock'", breath: "'walk'", wagon: "'wagon'", horse: "'horse'",
      run: "'run'", townstep: "'townstep'", door: "sfx('door'", gull: "sfx('gull'", cannon: "sfx('cannon'", gun: "sfx('gun'", sword: "sfx('sword'",
      growl: "sfx('growl'", discover: "sfx('discover'", children: "sfx('children'", page: "sfx('page'", glasses: "sfx('glasses'", coin: "sfx('coin'", coinland: 'G.Audio.coinRain', unload: "sfx('unload'", cheer: "sfx('cheer'"
    };
    ok(Object.keys(hooks).every(k => code.indexOf(hooks[k]) >= 0), '기존 효과음 23종이 실제 게임 장면에 연결');
    ok(/f\.type === 'cat' \|\| f\.type === 'dog'[\s\S]{0,80}sfx\(f\.type\)/.test(code), '고양이·개를 누르면 종류에 맞는 작은 울음소리 연결');
    ok(/look === 'cav'[\s\S]{0,100}sfx\('horse'\)/.test(code), '육상전 기병 돌격에 말발굽 소리 연결');
    ok(/look === 'gun' \|\| look === 'musket'\) G\.Audio\.sfx\('gun'\)/.test(code), '육상전 총병은 대포가 아닌 총소리를 냄');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | '));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
