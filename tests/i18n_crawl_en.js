/* 영어판 화면 훑기 (2026-11-13) — 도시 거리 · 수첩 탭 전부 · 건물 메뉴 · 설정 · 선실 · 결투 · 바다 · 해전 · 유적 장치 6가지 · 낚시 · 포커 · 육상전 · 뭍 · 제독 만들기를
   차례로 열고, 화면에 남은 한국어(글자·title·placeholder·aria-label·label)와 I.missing()을 JSON으로 남긴다.
   node tests/i18n_crawl_en.js [도시 번호=7] [출력=/tmp/crawl.json]   · ONLYEXTRA=1 이면 수첩·건물은 건너뛴다 */
const { pathToFileURL } = require('url'); const path = require('path'); let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); } const fs = require('fs');
const CITY = +(process.argv[2] || 7), OUT = process.argv[3] || '/tmp/crawl.json';
(async () => {
  const b = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem('pu.lang', 'en'); });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && document.querySelector('.title-menu .btn:not(.disabled)'), null, { timeout: 120000 });
  await p.evaluate((cid) => {
    G.State.newGame({ name: 'Juan', nation: 'ES', job: 'merchant', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    G.Game.state.settings.res = 0.35; G.Game.state.player.gold = 200000;
    G.Game.ensureGeo().then(() => G.Game.go('city', { cityId: cid }));
  }, CITY);
  await p.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'), null, { timeout: 60000 });
  await p.waitForTimeout(2000);
  const found = {}; p.setDefaultTimeout(15000);
  const T0 = Date.now(); const TM = setTimeout(async () => { console.log('TIMEOUT dump'); try { fs.writeFileSync(OUT, JSON.stringify({ found, partial: 1 }, null, 1)); } catch (e) {} process.exit(0); }, 1500000);
  const grab = async (where) => {
    const left = await p.evaluate(() => {
      const H = /[가-힣]/, out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
      while ((n = w.nextNode())) {
        if (n.nodeType === 3) {
          const el = n.parentNode; if (!H.test(n.nodeValue)) continue;
          if (el.closest('script,style,[translate=no],.no-i18n,textarea')) continue;
          const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
          out.push('T|' + n.nodeValue.trim().slice(0, 200));
        } else for (const a of ['title', 'placeholder', 'aria-label', 'label']) { const v = n.getAttribute(a); if (v && H.test(v) && !n.closest('[translate=no]')) out.push('A|' + a + '|' + v.slice(0, 200)); }
      }
      return [...new Set(out)];
    });
    left.forEach(t => { (found[t] = found[t] || []).push(where); });
  };
  const esc = async (n) => { for (let i = 0; i < (n || 8); i++) { if (await p.evaluate(() => G.UI.busy())) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); } } };
  await esc(12); await grab('city');
  // info tabs and their sub tabs
  for (const tab of (process.env.ONLYEXTRA ? [] : ['admiral', 'fleet', 'items', 'disc', 'contract', 'map', 'log', null])) {
    await p.evaluate(t => { G.Info.open(t || undefined); return 1; }, tab); console.log('tab', tab); await p.waitForTimeout(900); await grab('info:' + tab);
    const ntabs = await p.evaluate(() => document.querySelectorAll('.win .tabs .tab, .win [role=tab], .info-tabs button, .nb-tabs button').length);
    for (let i = 0; i < Math.min(ntabs, 40); i++) {
      await p.evaluate(i => { const t = document.querySelectorAll('.win .tabs .tab, .win [role=tab], .info-tabs button, .nb-tabs button')[i]; if (t) t.click(); }, i);
      await p.waitForTimeout(500); await grab('info:' + tab + ':' + i);
    }
    await esc();
  }
  // buildings
  const blds = await p.evaluate(() => G.Scenes.city.buildings(G.CITY_DATA[G.Game.state.city || G.Game.state.fleet.city || 7] || G.CITY_DATA[7]).map(b => [b.kind, b.arg, b.name]));
  for (const [k, a] of (process.env.ONLYEXTRA ? [] : blds)) {
    try {
      await p.evaluate(([k, a]) => { G.Scenes.city.visit(k, a); return 1; }, [k, a]); console.log('bld', k); await p.waitForTimeout(1500); await grab('bld:' + k);
      // click each command of the building menu once (non-destructive look)
      const n = await p.evaluate(() => document.querySelectorAll('.cmdmenu .cmd').length);
      for (let i = 0; i < Math.min(n, 14); i++) {
        await p.evaluate(i => { const c = document.querySelectorAll('.cmdmenu .cmd')[i]; if (c && !/나가|Leave|Exit|Back|출항|Set Sail|Depart/.test(c.textContent)) c.click(); }, i);
        await p.waitForTimeout(900); await grab('bld:' + k + ':' + i); await esc(4);
      }
      await esc(8);
      await p.evaluate(() => { if (G.Game.sceneName !== 'city' || !document.querySelector('.city-banner')) G.Game.go('city', { cityId: G.Game.state.fleet.city || 7 }); });
      await p.waitForTimeout(1200);
    } catch (e) { errs.push('bld ' + k + ' ' + e.message); }
  }
  const phase = async (name, fn, wait) => { try { await p.evaluate(fn, name.split(':')[1]); await p.waitForTimeout(wait || 2500); await grab(name); } catch (e) { errs.push(name + ' ' + e.message); } await esc(8); };
  if (!process.env.NOEXTRA) {
    await phase('settings', () => { G.Info.settings(); return 1; });
    await phase('cabin', () => { G.CabinView.open(); return 1; });
    await phase('duel', () => { G.Games.duel({ name: '술꾼', look: 'brawler', str: 60, atk: 8, def: 3, skill: 1, mar: 50, int: 50, cha: 50 }, { place: 'tavern' }); return 1; }, 3000);
    await phase('sea', () => { G.Game.go('sea', { depart: G.Game.state.fleet.city || 7 }); return 1; }, 6000);
    await phase('sea-nb', () => { G.Info.open('fleet'); return 1; });
    await phase('battle', () => { G.Game.go('battle', { npc: { kind: 'pirate', n: 2, K: 0 } }); return 1; }, 7000);
    for (const k of ['hanoi', 'balance', 'cube', 'grail', 'maze', 'sphinx']) {
      await phase('pz:' + k, (k) => { const d = (G.DISCOVERIES || []).find(x => x.how === 'land' && (x.cat === 'treasure' || x.cat === 'ruin')); G.Games.puzzle(d, k, 2); return 1; }, 2500);
    }
    await phase('fishing', () => { G.Fishing.open({}); return 1; }, 2500);
    await phase('poker', () => { G.Games.poker(G.CITY_DATA[7]); return 1; }, 3000);
    await phase('landwar', () => { G.Games.landWar({ enemy: { name: '도적 떼', kind: 'bandit', n: 8 }, party: [], terr: 'mountain', guns: false }); return 1; }, 4000);
    await phase('land', () => { G.Game.go('land', { from: 7 }); return 1; }, 6000);
    await phase('create', () => { G.Game.go('create'); return 1; }, 3000);
  }
  const miss = await p.evaluate(() => G.I18N.missing().slice(0, 2000));
  fs.writeFileSync(OUT, JSON.stringify({ found, miss, errs }, null, 1));
  console.log('found', Object.keys(found).length, 'miss', miss.length, 'errs', errs.length);
  clearTimeout(TM); await b.close();
})();
