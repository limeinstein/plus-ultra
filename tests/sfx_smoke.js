/* 합성 효과음 16종과 장면 연결 (tests/sfx_smoke.js) — node tests/sfx_smoke.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
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
    ok(played.length === 22 && played.every(x => x[1].length === 3 && x[1].every(Boolean)), '요청한 효과음 22종 × 세 변형을 Web Audio로 모두 생성');
    ok(await page.evaluate(() => G.Audio.travel('sea', 0.8) === true && G.Audio.travel('sea', 0.8) === false), '이동음은 실제 시간 간격으로 제한되어 배속에서도 겹치지 않음');

    const src = files => files.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    const code = src(['js/systems/audio.js', 'js/scenes/sea.js', 'js/scenes/city.js', 'js/scenes/land.js', 'js/scenes/town.js', 'js/scenes/battle.js', 'js/games/duel.js', 'js/games/landwar.js', 'js/city/tavern.js', 'js/city/trade.js', 'js/city/bookshelf.js', 'js/systems/discovery.js', 'js/systems/family.js']);
    const hooks = {
      wake: "travel('sea'", sail: "cfg[0] = 'sail'", depart: "sfx('depart'", dock: "sfx('dock'", breath: "'walk'", wagon: "'wagon'", horse: "'horse'",
      run: "'run'", townstep: "'townstep'", door: "sfx('door'", gull: "sfx('gull'", cannon: "sfx('cannon'", gun: "sfx('gun'", sword: "sfx('sword'",
      growl: "sfx('growl'", discover: "sfx('discover'", children: "sfx('children'", page: "sfx('page'", glasses: "sfx('glasses'", coin: "sfx('coin'", unload: "sfx('unload'", cheer: "sfx('cheer'"
    };
    ok(Object.keys(hooks).every(k => code.indexOf(hooks[k]) >= 0), '22종 모두 실제 게임 장면에 연결');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | '));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
