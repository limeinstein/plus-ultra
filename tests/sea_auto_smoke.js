/* 항해 중 사건의 저절로 넘기기 (2026-10-20) — js/ui/ui.js UI.autoRun · js/scenes/sea.js
   · 처음 보는 말·물음은 답을 기다린다 (6초가 지나도 그대로)
   · 같은 말이 두 번째면 5초 뒤 저절로 넘어간다 · 같은 물음이 두 번째면 5초 뒤 지난번에 고른 것을 고른다 (「⏳ n초 뒤」 띠)
   · 기다리는 동안 키를 누르면 셈이 멈추고 직접 고른다 · UI.autoRun 밖(도시의 대화 등)은 언제나 기다린다
   · 실제 항해: 폭풍 — 첫 폭풍은 눌러야 넘어가고, 두 번째 폭풍은 저절로 · 콘솔 오류 0
   node tests/sea_auto_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  const wait = ms => page.waitForTimeout(ms);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    // 첫 입항의 이야기 창들을 넘긴다
    await wait(3000);
    for (let i = 0; i < 40 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await wait(500); }
    // ---------------- 말: 처음은 기다리고, 두 번째는 저절로
    await page.evaluate(() => { window.__d1 = false; G.UI.autoRun(() => G.UI.say('시험: 큰 파도가 뱃전을 넘는다!', { name: '항해사' })).then(() => { window.__d1 = true; }); });
    await wait(6200);
    const first = await page.evaluate(() => ({ done: window.__d1, bar: !!document.querySelector('.auto-left') }));
    ok(!first.done && !first.bar, '처음 보는 말은 6초가 지나도 기다린다');
    await page.keyboard.press('Enter'); await wait(400);
    ok(await page.evaluate(() => window.__d1), '누르면 넘어간다');
    await page.evaluate(() => { window.__d2 = false; window.__t2 = Date.now(); G.UI.autoRun(() => G.UI.say('시험: 큰 파도가 뱃전을 넘는다!', { name: '항해사' })).then(() => { window.__d2 = Date.now() - window.__t2; }); });
    await wait(1200);
    const bar = await page.evaluate(() => { const b = document.querySelector('.auto-left'); return b ? b.textContent : ''; });
    await wait(5000);
    const t2 = await page.evaluate(() => window.__d2);
    ok(/초 뒤 저절로 넘어갑니다/.test(bar) && t2 >= 4800 && t2 <= 6500, '두 번째는 「' + bar.replace(/\s+/g, ' ').trim() + '」 — ' + (t2 / 1000).toFixed(1) + '초 뒤 저절로 넘어갔다');
    // UI.autoRun 밖은 같은 말이어도 기다린다
    await page.evaluate(() => { window.__d3 = false; G.UI.say('시험: 큰 파도가 뱃전을 넘는다!', { name: '항해사' }).then(() => { window.__d3 = true; }); });
    await wait(6000);
    ok(!(await page.evaluate(() => window.__d3)), '항해 중 사건이 아니면(UI.autoRun 밖) 같은 말이어도 기다린다');
    await page.keyboard.press('Enter'); await wait(400);

    // ---------------- 물음: 처음 고른 것을 두 번째에 5초 뒤 그대로
    const Q = () => G.UI.autoRun(() => G.UI.ask('시험: 안개 속에서 낯선 배가 다가온다. 어떻게 할까?', [{ label: '피해 간다', value: 'away' }, { label: '다가가 본다', value: 'near' }, { label: '대포를 쏜다 (화약 3통)', value: 'fire' }], { name: '부관' }));
    await page.evaluate(q => { window.__a1 = null; (new Function('return ' + q))()().then(v => { window.__a1 = v; }); }, Q.toString());
    await wait(6000);
    ok(await page.evaluate(() => window.__a1 === null && !document.querySelector('.auto-left')), '처음 묻는 것은 6초가 지나도 기다린다');
    await page.evaluate(() => Array.from(document.querySelectorAll('.askrow button')).filter(b => /다가가 본다/.test(b.textContent))[0].click());
    await wait(300);
    ok(await page.evaluate(() => window.__a1 === 'near'), '처음에는 「다가가 본다」를 직접 고름');
    await page.evaluate(q => { window.__a2 = null; window.__ta = Date.now(); (new Function('return ' + q))()().then(v => { window.__a2 = v; window.__ta = Date.now() - window.__ta; }); }, Q.toString());
    await wait(1000);
    const abar = await page.evaluate(() => { const b = document.querySelector('.auto-left'); return b ? b.textContent : ''; });
    await wait(5000);
    const a2 = await page.evaluate(() => ({ v: window.__a2, t: window.__ta }));
    ok(/지난번처럼 「다가가 본다」/.test(abar) && a2.v === 'near' && a2.t >= 4800 && a2.t <= 6500, '두 번째는 「' + abar.replace(/\s+/g, ' ').trim() + '」 — ' + (a2.t / 1000).toFixed(1) + '초 뒤 그대로 골랐다');
    // 키를 누르면 셈이 멈춘다
    await page.evaluate(q => { window.__a3 = null; (new Function('return ' + q))()().then(v => { window.__a3 = v; }); }, Q.toString());
    await wait(800);
    await page.keyboard.press('ArrowRight');
    await wait(6000);
    const a3 = await page.evaluate(() => ({ v: window.__a3, bar: !!document.querySelector('.auto-left') }));
    ok(a3.v === null && !a3.bar, '기다리는 동안 키를 누르면 셈이 멈추고 직접 고르기를 기다린다');
    await page.evaluate(() => Array.from(document.querySelectorAll('.askrow button')).filter(b => /피해 간다/.test(b.textContent))[0].click());
    await wait(300);

    // ---------------- 실제 항해: 폭풍 두 번
    await page.evaluate(() => { const s = G.Game.state; s.flags.prologue = true; s.settings.res = 0.5; G.Game.go('sea', { depart: 0, fresh: true }); });
    await page.waitForFunction(() => G.Game.scene === G.Scenes.sea && G.Scenes.sea.runtime(), null, { timeout: 90000 });
    await wait(1500);
    async function storm() {
      return page.evaluate(() => {
        const st = G.Scenes.sea.runtime(); st.stormPending = true; window.__sd = false; window.__st0 = Date.now();
        const r = G.U.rng; G.U.rng = () => 0.999;   // 다른 사건(바다의 사건·반란)은 일어나지 않게
        G.Scenes.sea.runDay().then(() => { window.__sd = Date.now() - window.__st0; G.U.rng = r; });
      });
    }
    await storm();
    // 처음 비가 오면 묻는 비 대책 같은 것은 먼저 넘긴다
    for (let i = 0; i < 30 && !(await page.evaluate(() => /폭풍입니다/.test(document.body.innerText))); i++) {
      const had = await page.evaluate(() => { const b = document.querySelector('.askrow button'); if (b) { b.click(); return true; } return false; });
      if (!had && await page.evaluate(() => G.UI.busy())) await page.keyboard.press('Enter');
      await wait(500);
    }
    if (!(await page.evaluate(() => /폭풍입니다/.test(document.body.innerText)))) console.log((await page.evaluate(() => document.body.innerText)).slice(-500), await page.evaluate(() => [window.__sd, G.Scenes.sea.runtime().stormPending, G.Scenes.sea.runtime().storm]));
    ok(await page.evaluate(() => /폭풍입니다/.test(document.body.innerText)), '폭풍이 온다');
    await wait(6000);
    ok(await page.evaluate(() => window.__sd === false && /폭풍입니다/.test(document.body.innerText)), '첫 폭풍: 6초가 지나도 눌러야 넘어간다');
    for (let i = 0; i < 12 && !(await page.evaluate(() => window.__sd)); i++) { await page.keyboard.press('Enter'); await wait(600); }
    ok(await page.evaluate(() => !!window.__sd), '눌러서 첫 폭풍을 넘겼다');
    await storm();
    await page.waitForFunction(() => window.__sd !== false, null, { timeout: 30000 });
    const t = await page.evaluate(() => window.__sd);
    ok(t >= 4500 && t <= 20000, '두 번째 폭풍: 아무것도 누르지 않아도 ' + (t / 1000).toFixed(1) + '초 만에 지나갔다 (말마다 5초)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
