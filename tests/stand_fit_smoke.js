/* 대화창 위 무릎상: 마주 선 두 사람의 머리끝을 맞춘다 — 머리 위 빈칸이 큰 제독 그림이 작아 보이지 않게 (js/ui/ui.js dialogShell)
   node tests/stand_fit_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'stand_fit');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(async () => {
      const T = G.Scenes.city.B.tavern, me = T.playerSpeaker();
      const who = { name: '로코 알베르티', portrait: G.Scenes.mateSpec('rocco'), half: ['portraits/mates/rocco_half'], layout: 'duo', side: 'right', partner: me, lang: 3 };
      const p = G.UI.say('덕분에 무사히 왔소, 제독!', who);
      await new Promise(r => setTimeout(r, 1800));
      const acts = [...document.querySelectorAll('.dlg-actor.tall')].map(el => { const top = parseFloat(el.style.top), h = parseFloat(el.style.height); return { side: el.classList.contains('left') ? 'left' : 'right', top, h, w: parseFloat(el.style.width), bottom: top + h, fit: +el.dataset.fit, top0: +el.dataset.top0 }; });
      return { acts, heroKey: G.Img.pick(G.Img.chain.heroHalf()) };
    });
    await page.screenshot({ path: path.join(OUT, 'duo.png') });
    console.log('   ' + JSON.stringify(r));
    const L = r.acts.find(a => a.side === 'left'), Rr = r.acts.find(a => a.side === 'right');
    ok(L && Rr, '두 사람이 무릎상으로 마주 선다 (제독 ' + r.heroKey + ')');
    const headL = L.top + L.h * L.top0, headR = Rr.top + Rr.h * Rr.top0;
    ok(L.fit > 1.1 && Math.abs(headL - headR) < 4 && Math.abs(L.bottom - Rr.bottom) < 2, '머리끝을 맞춘다: 제독 ×' + L.fit + ' (머리 위 빈칸 ' + Math.round(L.top0 * 100) + '%) — 머리끝 ' + Math.round(headL) + ' / ' + Math.round(headR) + 'px, 아랫단 같은 줄');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 그림: ' + OUT);
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
