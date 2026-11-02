/* 소지품 능력치·동료 무장 효과의 실제 브라우저 회귀 검사. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let chromium; try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.R && G.Games && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      const s = G.State.newGame({ name: '물건 능력 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const ids = Object.keys(G.ITEM), by = kind => ids.filter(id => G.ITEM[id] && G.ITEM[id].kind === kind && (G.ITEM[id].price || 0) > 0).sort((a, b) => G.ITEM[a].price - G.ITEM[b].price);
      const books = by('book'), instruments = by('instrument'), weapons = by('weapon').filter(id => G.ITEM[id].atk > 0), armors = by('armor').filter(id => G.ITEM[id].def > 0);
      if (books.length < 2 || instruments.length < 2 || !weapons.length || !armors.length) throw new Error('시험할 물건이 부족합니다.');
      const lowBook = books[0], highBook = books[books.length - 1], lowInst = instruments[0], highInst = instruments[instruments.length - 1];
      s.player.items = [{ id: lowBook }, { id: highBook }, { id: lowInst }, { id: highInst }];
      const hiInt = G.R.itemStatOf(highBook).v, hiCha = G.R.itemStatOf(highInst).v;
      const player = { intBonus: G.R.statBonus('int'), chaBonus: G.R.statBonus('cha'), int: G.R.stat('int'), cha: G.R.stat('cha'), intSource: G.R.statSource('int'), chaSource: G.R.statSource('cha') };
      s.player.st.int = 98; const capped = G.R.stat('int'); s.player.st.int = 60;
      const mateId = Object.keys(G.MATE).find(id => G.MATE[id] && Array.isArray(G.MATE[id].st) && G.MATE[id].st.length >= 4), mate = { id: mateId, role: 'none', items: [{ id: highBook }, { id: highInst }, { id: weapons[weapons.length - 1] }, { id: armors[armors.length - 1] }] };
      s.mates = [mate]; const ms = G.R.mateStats(mate), gear = G.R.mateGear(mate), fighter = G.Games.mateFighter(mate);
      const raw = G.State.serialize(), loaded = G.State.deserialize(raw), lm = loaded.mates[0];
      return { lowBook, highBook, lowInst, highInst, weapon: weapons[weapons.length - 1], armor: armors[armors.length - 1], hiInt, hiCha, player, capped, ms, gear: { atk: gear.atk, def: gear.def, weapon: gear.weapon && gear.weapon.name, armor: gear.armor && gear.armor.name }, fighter: { atk: fighter.atk, def: fighter.def, atkB: fighter.atkB, defB: fighter.defB }, savedItems: lm.items.map(x => x.id), texts: [G.R.itemStatText(highBook), G.R.itemStatText(highInst)] };
    });
    assert.equal(r.player.intBonus, r.hiInt, '책의 지력은 최고 효과 하나만');
    assert.equal(r.player.chaBonus, r.hiCha, '악기의 매력은 최고 효과 하나만');
    assert.equal(r.player.int, 60 + r.hiInt); assert.equal(r.player.cha, 60 + r.hiCha); assert.equal(r.capped, 100, '능력치 상한 100');
    assert(r.player.intSource && r.player.chaSource && /^\uC9C0력 \+\d+$/.test(r.texts[0]) && /^\uB9E4력 \+\d+$/.test(r.texts[1]));
    assert.equal(r.ms.bonus[1], r.hiInt); assert.equal(r.ms.bonus[3], r.hiCha);
    assert(r.gear.atk > 0 && r.gear.def > 0 && r.gear.weapon && r.gear.armor);
    assert.equal(r.fighter.atkB, r.gear.atk); assert.equal(r.fighter.defB, r.gear.def);
    assert.deepEqual(new Set(r.savedItems), new Set([r.highBook, r.highInst, r.weapon, r.armor]));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify(r));
    console.log('통과: 책·악기 최고 효과 하나·상한 100·동료 능력·무기·갑옷·결투·저장·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
