/* 사용자가 청한 유적 발견물 (2026-10-30) — 새 일곱 · 이미 있던 넷 · 허물어진 해(goneY) · 단서 이름 · 특기별 관찰 · 실제로 찾기
   node tests/heritage1030_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const D = G.Disc, out = {};
      const NEW = ['constbaths', 'septizodium', 'worcesterwall', 'manwoldae', 'somnath', 'alnuri', 'aleppomosque'];
      const OLD = ['globe', 'nalanda', 'wisdom', 'ani'];
      out.newOk = NEW.map(id => { const d = G.DISC[id]; return d ? [id, d.cat, d.how, d.city || '', d.val, d.relic ? 1 : 0, (G.DISC_FACTS[id] || []).length, G.DISC_NAMES[id] && G.DISC_NAMES[id].clue].join(':') : id + ':없음'; });
      out.allNew = NEW.every(id => G.DISC[id] && G.DISC[id].cat === 'ruin' && (G.DISC_FACTS[id] || []).length === 3 && G.DISC_NAMES[id]);
      out.oldOk = OLD.every(id => !!G.DISC[id]);
      out.dup = G.DISCOVERIES.filter(d => /셉티조디움|만월대|솜나트|알 누리|알레포 대모스크|콘스탄티누스 욕장|우스터 성벽/.test(d.realName || d.name || '')).length;
      out.frontier = NEW.map(id => { const f = (G.FRONTIER_OF && G.FRONTIER_OF[id]) || (G.Frontier && G.Frontier.of ? G.Frontier.of(id) : ''); return id + '=' + f; });
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state;
      // 허물어진 해: 셉티조디움 1588 · 콘스탄티누스 욕장 1605 — 그 전에 로마에 가면 거리에 서 있다
      s.date = { y: 1500, m: 1, d: 1 }; s.loc = { mode: 'city', city: 33, lon: 12.524, lat: 41.88 };
      out.rome1500 = D.cityBuildings(33).map(d => d.id).filter(id => /constbaths|septizodium/.test(id));
      s.date = { y: 1590, m: 1, d: 1 }; out.rome1590 = D.cityBuildings(33).map(d => d.id).filter(id => /constbaths|septizodium/.test(id));
      s.date = { y: 1610, m: 1, d: 1 }; out.rome1610 = D.cityBuildings(33).map(d => d.id).filter(id => /constbaths|septizodium/.test(id));
      // 찾은 뒤에는 허물어져도 기록이 남는다
      s.date = { y: 1580, m: 1, d: 1 }; s.disc.septizodium = { me: true, found: 15800101 };
      s.date = { y: 1600, m: 1, d: 1 }; out.foundKept = D.foundByMe('septizodium') && D.built(G.DISC.septizodium);
      // 뭍의 발견물: 그 자리를 밟으면 걸린다
      const land = ['worcesterwall', 'manwoldae', 'somnath', 'alnuri', 'aleppomosque'];
      s.date = { y: 1520, m: 5, d: 1 };
      out.landHits = land.map(id => { const d = G.DISC[id]; s.hints[id] = { src: 'test', d: 15200501 }; const ch = D.checkLand(d.lon, d.lat, { search: true }); return id + ':' + (ch.hits.some(x => x.id === id) ? 'hit' : 'no'); });
      out.vals = NEW.map(id => G.DISC[id].val);
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.allNew && r.dup === 7, '새 발견물 일곱 — 유적 · 단서 이름 · 특기별 관찰 셋 (' + r.newOk.join(' | ') + ')');
    ok(r.oldOk, '이미 있던 넷(글로브 극장 · 날란다 대학 · 지혜의 집 · 아니)은 그대로');
    ok(r.rome1500.length === 2 && r.rome1590.join() === 'constbaths' && r.rome1610.length === 0, '로마: 1588년 셉티조디움 · 1605년 콘스탄티누스 욕장이 허물어진다 (1500 ' + r.rome1500 + ' / 1590 ' + r.rome1590 + ' / 1610 ' + r.rome1610 + ')');
    ok(r.foundKept, '허물어지기 전에 찾았으면 기록은 남는다');
    ok(r.landHits.every(x => /hit/.test(x)), '뭍의 다섯 곳은 단서를 듣고 그 자리를 밟으면 찾는다 — ' + r.landHits.join(', '));
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
