/* 아틀란티스 길잡이·먼저 찾은 아틀란티스 (2026-11-04 피드백) — node tests/story_atlantis_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }
async function boot(page) {
  await page.goto(GAME);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
  await page.evaluate(() => {
    const UI = G.UI; window.SAID = []; window.TOAST = [];
    UI.say = async (t, who) => { SAID.push((who && who.name || '') + ': ' + String(t).slice(0, 60)); };
    UI.ask = async (t, opts) => opts[0].value; UI.alert = async () => {}; UI.fade = async (fn) => { fn && fn(); };
    const ot = UI.toast; UI.toast = function (t) { TOAST.push(String(t)); };
    UI.window = (o) => ({ result: Promise.resolve(o.buttons ? o.buttons[o.buttons.length - 1].value : null), el: document.createElement('div'), content: document.createElement('div') });
  });
  await page.evaluate(async () => { await G.Game.ensureGeo(); G.Story.start(); G.Game.go('city', { cityId: 0, story: true }); });
  await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.story && G.Game.state.story.prologue, null, { timeout: 90000 });
  await page.evaluate(() => { G.Scenes.discoveryCard = async () => {}; if (G.Names) G.Names.offer = async () => {}; });
}
(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    // ① 편지를 먼저: 「지금 할 일」에 다음 고리가 곳과 함께, 고리를 찾을 때마다 다음 단서
    let page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
    await boot(page);
    const a = await page.evaluate(async () => {
      const s = G.Game.state, D = G.Disc, out = {};
      for (const tr of G.STORY.traces) await D.find(G.DISC[tr[0]], 'city');
      const guide = () => { const el = document.createElement('div'); G.Story.page(el); return el.textContent; };
      out.g0 = guide(); out.todo0 = G.Story.todo(G.CITY_DATA[0]).map(x => x.text).join();
      out.steps = [];
      for (const id of ['knossos', 'akrotiri', 'timaeus', 'gibraltar', 'gadir', 'azoresridge']) {
        await D.find(G.DISC[id], G.DISC[id].how);
        out.steps.push({ id, next: G.Story.atlNext(), hinted: G.Story.atlNext().every(n => !!s.hints[n]), g: guide() });
      }
      SAID.length = 0;
      await D.find(G.DISC.atlantis, 'sea');
      out.end = s.story.end; out.said = SAID.length;
      return out;
    });
    ok(/크노소스/.test(a.g0) && /크레타/.test(a.g0) && /지브롤터 해협/.test(a.g0), '편지 뒤 수첩 「지금 할 일」: ' + a.g0.split('지금 할 일')[1].slice(0, 120));
    ok(/크노소스/.test(a.todo0), '도시 할 일에도 다음 고리');
    a.steps.forEach(st => ok(st.hinted, st.id + ' 찾음 → 다음: ' + st.next.join(',') + ' (단서 있음)'));
    ok(/아소르스 남서쪽/.test(a.steps[5].g), '마지막 고리: 아소르스 남서쪽 바다');
    ok(a.end === 'done' && a.said > 3, '아틀란티스 → 끝 (' + a.said + '줄)');
    await page.close();

    // ② 아틀란티스를 편지 전에 먼저 찾아 발표 → 편지 → 다시 가면 끝 장면
    page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
    await boot(page);
    const b = await page.evaluate(async () => {
      const s = G.Game.state, D = G.Disc, out = {};
      for (const id of ['knossos', 'akrotiri', 'timaeus', 'gibraltar', 'gadir', 'azoresridge', 'atlantis']) await D.find(G.DISC[id], G.DISC[id].how);
      out.early = s.story.earlyAtlantis; out.end0 = s.story.end || null; out.toastEarly = TOAST.filter(t => /다시 오면/.test(t)).length;
      for (const tr of G.STORY.traces) await D.find(G.DISC[tr[0]], 'city');
      out.letterToast = TOAST.filter(t => /전에 찾은 아틀란티스/.test(t)).length;
      const el = document.createElement('div'); G.Story.page(el); out.g = el.textContent.split('지금 할 일')[1].slice(0, 100);
      // 바다에서 아틀란티스 자리로
      const d = G.DISC.atlantis; s.loc.mode = 'sea'; s.loc.lon = d.lon; s.loc.lat = d.lat; SAID.length = 0;
      try { G.Scenes.sea.update(0.016); } catch (e) { out.err = String(e); }
      await new Promise(r => setTimeout(r, 300));
      out.end = s.story.end; out.said = SAID.length;
      // 한 번 더 지나가도 다시 뜨지 않는다 (두 해가 안 지났다)
      SAID.length = 0; try { G.Scenes.sea.update(0.016); } catch (e) {} await new Promise(r => setTimeout(r, 200)); out.said2 = SAID.length;
      return out;
    });
    ok(b.early && !b.end0 && b.toastEarly === 1, '편지 전에 먼저 닿음: 끝나지 않고 「다시 오면」 알림');
    ok(b.letterToast === 1 && /이미 찾아/.test(b.g), '편지 → 「전에 찾은 아틀란티스로」 · 할 일: ' + b.g);
    ok(b.end === 'done' && b.said > 3, '다시 들르니 아버지와의 만남 · 끝 (' + b.said + '줄)' + (b.err ? ' [update 오류 ' + b.err + ']' : ''));
    ok(b.said2 === 0, '곧바로 다시 지나가도 만남이 되풀이되지 않는다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
    console.log('통과 ' + passed);
  } catch (e) { console.log('실패: ' + e.message); if (errors.length) console.log(errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})();
