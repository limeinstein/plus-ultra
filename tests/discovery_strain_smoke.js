/* 발견 여파가 규율·피로를 0으로 만들면 해당 수치가 10으로 회복될 때까지 야외 발견 반경이 줄어드는지 점검한다. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Disc && G.State, null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '발견시험', nation: 'PT', job: 'adventurer', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const D = G.Disc, f = s.fleet, out = {}, toasts = [];
      G.UI.toast = t => toasts.push(t);

      // 다른 발견물과 떨어진 시험 좌표에서 평소에는 닿지만, 반경 35%일 때는 닿지 않는 발견물을 둔다.
      const at = { lon: 147.25, lat: 78.4 }, probe = { id: '__strain_probe', name: '시험 발견물', how: 'land', cat: 'geo', lon: 148.25, lat: 78.4, r: 1, pw: 1, val: 1 };
      const dist = G.Geo.dist(at.lon, at.lat, probe.lon, probe.lat);
      probe.r = dist / (1 + G.R.skill('hist') * 0.25) * 1.2;
      G.DISCOVERIES.push(probe); G.DISC[probe.id] = probe;
      function probeHit() { s.discDay = null; return D.checkLand(at.lon, at.lat).hits.some(d => d.id === probe.id); }
      out.normalHit = probeHit();

      f.fatigue = 5; f.discipline = 50;
      const fatigueImpact = D.applyImpact({ id: '__strain_fatigue', cat: 'nature', impact: 'awe' }, {});
      out.fatigue = { value: f.fatigue, marked: !!(fatigueImpact.strain && fatigueImpact.strain.fatigue), k0: D.findK(true), hit: probeHit() };
      f.fatigue = 9; out.fatigue.k9 = D.findK(true);
      f.fatigue = 10; out.fatigue.k10 = D.findK(false); out.fatigue.recoveredHit = probeHit();

      delete s.flags.discoveryStrain;
      f.fatigue = 50; f.discipline = 3;
      const disciplineImpact = D.applyImpact({ id: '__strain_discipline', cat: 'creature', impact: 'fear' }, {});
      out.discipline = { value: f.discipline, marked: !!(disciplineImpact.strain && disciplineImpact.strain.discipline), k0: D.findK(true) };
      f.discipline = 9; out.discipline.k9 = D.findK(true);
      f.discipline = 10; out.discipline.k10 = D.findK(false);

      delete s.flags.discoveryStrain;
      f.fatigue = 0; f.discipline = 50;
      const alreadyZero = D.applyImpact({ id: '__strain_already_zero', cat: 'nature', impact: 'awe' }, {});
      out.alreadyZero = !!alreadyZero.strain;
      out.recoveryToast = toasts.filter(t => /평소처럼/.test(t)).length;
      G.DISCOVERIES.splice(G.DISCOVERIES.indexOf(probe), 1); delete G.DISC[probe.id];
      return out;
    });
    ok(r.normalHit, '평상시 발견 반경에서는 발견물이 잡힘');
    ok(r.fatigue.value === 0 && r.fatigue.marked && r.fatigue.k0 === 0.35 && !r.fatigue.hit, '발견 여파로 피로 0 → 발견 반경 35%');
    ok(r.fatigue.k9 === 0.35 && r.fatigue.k10 === 1 && r.fatigue.recoveredHit, '피로 9까지 유지, 10부터 정상 반경 회복');
    ok(r.discipline.value === 0 && r.discipline.marked && r.discipline.k0 === 0.35, '발견 여파로 규율 0 → 발견 반경 35%');
    ok(r.discipline.k9 === 0.35 && r.discipline.k10 === 1, '규율 9까지 유지, 10부터 정상 반경 회복');
    ok(!r.alreadyZero, '발견 전에 이미 0이던 수치는 새 제약을 만들지 않음');
    ok(r.recoveryToast === 2, '회복 시 정상 탐색 복귀 안내');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | '));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
