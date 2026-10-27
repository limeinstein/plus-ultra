/* LV3 특기 3종 숨은 능력 20개와 실제 규칙 연결. */
'use strict';
const assert = require('assert/strict');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function ok(v, msg) { assert(v, msg); passed++; console.log('  ✓ ' + msg); }

(async function () {
  const browser = await playwright.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  const localBuild = /^http:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(process.env.PAGE_URL || '');
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    const msg = m.text();
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(msg) &&
      !(localBuild && /plus-ultra-telemetry.*\/api\/presence.*CORS/i.test(msg))) errors.push(msg);
  });
  try {
    await page.goto(process.env.PAGE_URL || pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Loader.shown(), null, { timeout: 120000 });
    const base = await page.evaluate(() => {
      G.State.newGame({ name: '조합시험', nation: 'ES', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 90, mar: 70, cha: 70 }, sk: {}, lg: [], diff: 'normal' });
      const C = G.SkillCombos, p = G.Game.state.player;
      p.sk = {};
      const all = C.ALL.map(x => ({ id: x.id, name: x.name, sk: x.sk.slice(), fx: Object.keys(x.fx) }));
      const skillIds = new Set(G.SKILLS.map(x => x.id));
      return { n: all.length, ids: new Set(all.map(x => x.id)).size, names: new Set(all.map(x => x.name)).size,
        triples: all.every(x => x.sk.length === 3 && new Set(x.sk).size === 3 && x.sk.every(k => skillIds.has(k))),
        named: ['무적제독', '생존전문가', '마피아', '성녀탄생'].every(n => all.some(x => x.name === n)), active: C.active().length };
    });
    ok(base.n === 20 && base.ids === 20 && base.names === 20, '서로 다른 숨은 능력 20개');
    ok(base.triples, '모든 능력이 서로 다른 유효 특기 LV3 세 가지를 요구한다');
    ok(base.named, '요청한 네 조합 이름을 포함한다');
    ok(base.active === 0, '조건을 채우기 전에는 숨은 능력이 없다');

    const inv = await page.evaluate(() => {
      const p = G.Game.state.player, C = G.SkillCombos;
      p.sk = { sword: 3, shoot: 3, gun: 3 };
      return { names: C.active().map(x => x.name), land: C.factor('landPower'), html: C.html() };
    });
    ok(inv.names.length === 1 && inv.names[0] === '무적제독' && Math.abs(inv.land - 1.10) < 1e-9, '검술3+사격3+포술3 → 무적제독·육상 피해 +10%');
    ok(/무적제독/.test(inv.html) && /육상전/.test(inv.html), '인물 정보용 활성 능력 설명');

    const survival = await page.evaluate(() => {
      const s = G.Game.state, p = s.player;
      p.sk = {};
      s.loc = { mode: 'land', lon: -4.4, lat: 36.7, party: 30, mount: { id: 'walk', n: 0 }, base: { type: 'city', city: 0, lon: -4.4, lat: 36.7 } };
      const plain = G.Scenes.land.dailyCost();
      p.sk = { nav: 3, ops: 3, med: 3 };
      return { plain, reduced: G.Scenes.land.dailyCost(), name: G.SkillCombos.active()[0].name,
        costK: G.SkillCombos.factor('landCost'), fatK: G.SkillCombos.factor('landFatigue') };
    });
    ok(survival.name === '생존전문가' && survival.costK === 0.85 && survival.reduced < survival.plain, '생존전문가가 육상 이동 경비를 15% 줄인다');
    ok(Math.abs(survival.fatK - 0.9) < 1e-9, '생존전문가가 육상 피로 증가를 10% 줄인다');

    const econ = await page.evaluate(() => {
      const s = G.Game.state, p = s.player, c = G.CITY_DATA[0];
      p.sk = {}; const buy0 = G.R.buyPrice(c, 'eaart'), sell0 = G.R.sellPrice(c, 'eaart'), use0 = G.R.dailyUse(100);
      p.sk = { acct: 3, speech: 3, survey: 3 }; const buy1 = G.R.buyPrice(c, 'eaart'), sell1 = G.R.sellPrice(c, 'eaart');
      p.sk = { acct: 3, ops: 3, cook: 3 }; const use1 = G.R.dailyUse(100);
      return { buy0, buy1, sell0, sell1, use0, use1 };
    });
    ok(econ.buy1 < econ.buy0 && econ.sell1 > econ.sell0, '대상인의 구입가 −2%·매각가 +2%가 실제 시세에 적용된다');
    ok(Math.abs(econ.use1 / econ.use0 - 0.92) < 0.001, '병참의 달인이 식량·물 소비를 8% 줄인다');

    const discovery = await page.evaluate(() => {
      const p = G.Game.state.player, d = G.DISCOVERIES.filter(x => x && x.val)[0];
      p.sk = {}; const v0 = G.Disc.value(d);
      p.sk = { hist: 3, craft: 3, survey: 3 }; const v1 = G.Disc.value(d);
      return { v0, v1, k: G.SkillCombos.factor('discoveryReward') };
    });
    ok(discovery.k === 1.06 && discovery.v1 > discovery.v0, '보물박사의 발견 가치·명성 +6%가 실제 가치에 적용된다');

    const all = await page.evaluate(() => {
      const p = G.Game.state.player; G.SKILLS.forEach(x => { p.sk[x.id] = 3; });
      return { active: G.SkillCombos.active().length, repair: G.SkillCombos.factor('repairPower'), storm: G.SkillCombos.factor('stormDamage'),
        cannon: G.SkillCombos.factor('cannonPower'), board: G.SkillCombos.factor('boardingPower'), haggle: G.SkillCombos.bonus('haggle') };
    });
    ok(all.active === 20, '모든 특기 LV3이면 20개 조합이 모두 활성화된다');
    ok(Math.abs(all.repair - 1.2) < 1e-9 && Math.abs(all.storm - 0.8) < 1e-9 && Math.abs(all.cannon - 1.1) < 1e-9 && Math.abs(all.board - 1.08) < 1e-9 && Math.abs(all.haggle - 0.08) < 1e-9, '중복 효과가 수리 20%·폭풍 20%·함포 10%·백병전 8%·흥정 8%p 상한을 지킨다');

    const sources = ['js/core/rules.js', 'js/scenes/land.js', 'js/games/landwar.js', 'js/scenes/sea.js', 'js/scenes/battle.js', 'js/city/trade.js', 'js/systems/discovery.js']
      .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    const comboSource = fs.readFileSync(path.join(ROOT, 'js/systems/skillcombos.js'), 'utf8');
    const keys = [...new Set((comboSource.match(/fx: \{[^}]+\}/g) || [])
      .flatMap(x => [...x.matchAll(/([A-Za-z]+):/g)].map(m => m[1])))];
    ok(keys.every(k => sources.includes("'" + k + "'")), '20개 조합의 모든 효과가 실제 규칙에 연결된다');
    ok(!errors.length, '브라우저 콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('\n통과 ' + passed);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
