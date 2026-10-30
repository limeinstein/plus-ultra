/* 「항해의 끝」 — 생을 마친 곳 (js/systems/family.js G.Ending.show) — node tests/ending_place_smoke.js
   2026-10-31 QA (1700년까지 자동 플레이): 도시의 여관에서 80세로 눈을 감아도 끝 화면은 늘 「바다 위에서 생을 마치다」였다.
   · 도시에서 → 「리스본에서 생을 마치다」 · 뭍에서 → 「탐험 길에서」 · 바다에서 → 「바다 위에서」 · 은퇴 → 「은퇴하여 여생을 보내다」
   · 끝 화면의 「타이틀로」를 누르면 타이틀로 · 아들 없이 80세 수명이 다하면 실제로 끝 화면까지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      G.UI.fade = async fn => { fn && fn(); };
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, out = {};
      const shown = async (reason) => {
        const p = G.Ending.show(reason);
        await new Promise(r => setTimeout(r, 50));
        const w = [...document.querySelectorAll('.modal-back')].pop();
        const t = w ? w.innerText.replace(/\s+/g, ' ') : '';
        const b = w && [...w.querySelectorAll('button')].find(x => /타이틀로/.test(x.textContent)); if (b) b.click();
        await p; await new Promise(r => setTimeout(r, 30));
        return t;
      };
      const lis = G.CITY_DATA.find(c => c.name === '리스본');
      s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat }; out.city = await shown('death'); out.scene1 = G.Game.sceneName;
      G.Game.state = s; s.loc = { mode: 'land', lon: -5, lat: 40, base: { type: 'city', city: lis.id, lon: lis.lon, lat: lis.lat } }; out.land = await shown('death');
      G.Game.state = s; s.loc = { mode: 'sea', lon: -12, lat: 38, heading: 0 }; out.sea = await shown('death');
      G.Game.state = s; s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat }; out.retire = await shown('retire');
      // 실제로: 아들 없이 80세 생일을 맞는다 (도시에서)
      G.Game.state = s; s.player.kids = []; s.contract = null; s.player.born = { y: s.date.y - 80, m: s.date.m, d: Math.min(28, s.date.d + 2) };
      G.Game.go('city', { cityId: lis.id });
      for (let i = 0; i < 80 && G.UI.busy(); i++) { const w = [...document.querySelectorAll('.modal-back')].pop(); const b = w && (w.querySelector('.foot button') || w.querySelector('.dlg')); if (b) b.click(); await new Promise(r => setTimeout(r, 40)); }
      G.Game.passDays(5);
      let fin = '';
      for (let i = 0; i < 300 && G.Game.sceneName !== 'title'; i++) {
        G.Life.tick();
        const w = [...document.querySelectorAll('.modal-back')].pop();
        if (w) { const t = w.innerText.replace(/\s+/g, ' '); if (/FINIS/.test(t)) fin = t; const b = [...w.querySelectorAll('button')].find(x => /타이틀로|확인|고맙/.test(x.textContent)) || w.querySelector('.foot button') || w.querySelector('.dlg'); if (b) b.click(); }
        await new Promise(r => setTimeout(r, 40));
      }
      out.real = fin.slice(0, 120); out.realScene = G.Game.sceneName;
      return out;
    });
    console.log(JSON.stringify(r));
    ok(/리스본에서 생을 마치다/.test(r.city) && r.scene1 === 'title', '도시에서: 「' + (r.city.match(/\S+에서 생을 마치다/) || [''])[0] + '」 → 「타이틀로」 → 타이틀');
    ok(/탐험 길에서 생을 마치다/.test(r.land) && /바다 위에서 생을 마치다/.test(r.sea), '뭍에서 「탐험 길에서」 · 바다에서 「바다 위에서」');
    ok(/은퇴하여 여생을 보내다/.test(r.retire), '은퇴는 그대로 「은퇴하여 여생을 보내다」');
    ok(/FINIS/.test(r.real) && /리스본에서 생을 마치다/.test(r.real) && r.realScene === 'title', '아들 없이 80세 — 실제로 끝 화면(리스본에서 생을 마치다) → 타이틀');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
