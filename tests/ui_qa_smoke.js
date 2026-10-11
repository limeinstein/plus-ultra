/* UI QA 2026-10-11 고친 것 1~4
   1 작은 화면에서 글씨·창 키우기(UI 층 zoom · 설정 「글씨·창 크기」 · 윗줄 맞춤 · 휴대폰 화면이 넓어지지 않음)
   2 창이 열려 있으면 알림이 창을 덮지 않음 · 3 두 칸 명령 메뉴가 낱말 중간에서 꺾이지 않음 · 4 두 사람 대화에서 말하는 사람 이름표만 밝게
   node tests/ui_qa_smoke.js  (BROWSER_EXE=크로미움 경로 · PAGE=다른 html 경로) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
async function open(browser, vp, opt) {
  const ctx = await browser.newContext(Object.assign({ viewport: vp }, opt || {}));
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) page.errors.push(m.text()); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
  return { ctx, page };
}
const NEWGAME = async () => {
  await G.Game.ensureGeo();
  G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
  G.Game.state.prologueDone = true;
};
const STAGE_RECT = (sel) => {
  const st = document.getElementById('stage').getBoundingClientRect(), k = st.width / 1600;
  return [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return { x: (r.left - st.left) / k, y: (r.top - st.top) / k, r: (r.right - st.left) / k, b: (r.bottom - st.top) / k }; });
};
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  try {
    // ---- 1 (a) 1600×900: 그대로 · 1280×720: 1.15배 · 1024×768: 1.3배
    for (const [w, h, want] of [[1600, 900, 1], [1280, 720, 1.15], [1024, 768, 1.3]]) {
      const { ctx, page } = await open(browser, { width: w, height: h });
      const r = await page.evaluate(async () => { const ui = document.getElementById('ui'); return { z: G.Game.uiZoom, css: ui.style.zoom, uw: ui.offsetWidth }; });
      ok(Math.abs(r.z - want) < 0.011 && (want === 1 ? !r.css : Math.abs(+r.css - want) < 0.011), w + '×' + h + ': 글씨·창 ' + Math.round(r.z * 100) + '% (UI 층 너비 ' + r.uw + ')');
      if (w === 1024) {
        // 도시 화면: 윗줄이 넘치지 않고(소지금·직위까지 보임) 창이 무대 안에 들어온다
        const c = await page.evaluate(async (NG) => {
          await (new Function('return ' + NG)())();
          G.UI.say = async () => {}; G.UI.alert = async () => {};
          G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 2500));
          const hud = document.querySelector('.hud');
          G.Info.open('trade'); await new Promise(r => setTimeout(r, 1200));
          const win = document.querySelector('.modal-back .win'), st = document.getElementById('stage').getBoundingClientRect(), wr = win.getBoundingClientRect();
          return { hudFit: hud.scrollWidth <= hud.clientWidth + 1, hz: hud.style.zoom, winIn: wr.left >= st.left - 1 && wr.right <= st.right + 1 && wr.top >= st.top - 1 && wr.bottom <= st.bottom + 1 };
        }, NEWGAME.toString());
        ok(c.hudFit, '1024×768 도시: 윗줄 상태 표시가 다 보인다 (윗줄 맞춤 ' + (c.hz || '1') + ')');
        ok(c.winIn, '1024×768: 수첩 창이 화면 안에 들어온다');
        // 바다: 아래 단추줄과 해도·바람 판이 겹치지 않는다
        const s = await page.evaluate(async () => {
          document.querySelectorAll('.modal-back .win .title .x').forEach(x => x.click());
          if (G.SEA_RISK) { G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; }
          G.Game.go('sea', { depart: 0 }); await new Promise(r => setTimeout(r, 2500));
          const R = s => { const e = document.querySelector(s); return e && e.getBoundingClientRect(); };
          const a = R('.sailbar'), m = R('.minimap'), wb = R('.windbox');
          const hit = (p, q) => p && q && p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom;
          return { mm: hit(a, m), wb: hit(a, wb), have: !!(a && m && wb) };
        });
        ok(s.have && !s.mm && !s.wb, '1024×768 바다: 아래 단추줄이 작은 해도·바람 판과 겹치지 않는다');
      }
      errs.push(...page.errors); await ctx.close();
    }
    // ---- 1 (b) 설정 「글씨·창 크기」: 고르면 바로 바뀌고 이 기기에 남는다
    {
      const { ctx, page } = await open(browser, { width: 1600, height: 900 });
      const r = await page.evaluate(async (NG) => {
        await (new Function('return ' + NG)())();
        G.UI.say = async () => {}; G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 2000));
        G.Info.open('menu'); await new Promise(r => setTimeout(r, 900));
        const opts = [...document.querySelectorAll('[data-uisz]')].map(o => o.innerText);
        document.querySelector('[data-uisz="max"]').click(); await new Promise(r => setTimeout(r, 400));
        const z1 = G.Game.uiZoom, saved = localStorage.getItem('pu.uiSize');
        const hud = document.querySelector('.hud'), fit = hud.scrollWidth <= hud.clientWidth + 1;
        document.querySelector('[data-uisz="auto"]').click(); await new Promise(r => setTimeout(r, 300));
        return { opts, z1, saved, fit, z2: G.Game.uiZoom, note: (document.querySelector('[data-uisz]').closest('div').parentNode.innerText || '').slice(0, 80) };
      }, NEWGAME.toString());
      ok(r.opts.join(',') === '자동,보통,크게,아주 크게,최대', '설정에 「글씨·창 크기」 ' + r.opts.join('·'));
      ok(r.z1 === 1.45 && r.saved === 'max' && r.fit, '「최대」 → 145%, 이 기기에 기억, 윗줄도 맞춰 줄어든다');
      ok(r.z2 === 1, '「자동」(1600×900) → 100%');
      errs.push(...page.errors); await ctx.close();
    }
    // ---- 1 (c) 휴대폰: 1600px 무대가 화면을 넓히지 않는다 · 세로로 들면 돌리라는 안내
    {
      const { ctx, page } = await open(browser, { width: 844, height: 390 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const r = await page.evaluate(() => ({ iw: innerWidth, sw: document.documentElement.scrollWidth, z: G.Game.uiZoom, hint: getComputedStyle(document.getElementById('rotate-hint')).display }));
      ok(r.iw === 844 && r.sw <= 844, '휴대폰 가로 844×390: 화면이 넓어지지 않는다 (innerWidth ' + r.iw + ') · 글씨 ' + Math.round(r.z * 100) + '%');
      ok(r.hint === 'none', '가로로 들면 「돌려 주십시오」 안내가 없다');
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
      const p = await page.evaluate(() => getComputedStyle(document.getElementById('rotate-hint')).display);
      ok(p === 'flex', '세로로 들면 「화면을 가로로 돌려 주십시오」 안내');
      errs.push(...page.errors); await ctx.close();
    }
    // ---- 2·3·4 (1600×900)
    {
      const { ctx, page } = await open(browser, { width: 1600, height: 900 });
      const r = await page.evaluate(async (NG) => {
        await (new Function('return ' + NG)())();
        const out = {};
        G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 2000));
        while (document.querySelector('.modal-back')) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); await new Promise(r => setTimeout(r, 300)); }
        // 2 창 + 알림
        G.UI.toast('거리 — ←→ 걷기 · Shift 뛰기 · ↑ 건물에 들어가기 (건물을 눌러도 됩니다)', 'boot', 6000);
        G.Info.open('fleet'); await new Promise(r => setTimeout(r, 700));
        const t = document.querySelector('.toasts .toast').getBoundingClientRect(), tabs = document.querySelector('.modal-back .win .tabs').getBoundingClientRect(), ttl = document.querySelector('.modal-back .win .title').getBoundingClientRect();
        const hit = (p, q) => p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom;
        out.toastHitsTabs = hit(t, tabs) || hit(t, ttl);
        document.querySelector('.modal-back .win .title .x').click(); await new Promise(r => setTimeout(r, 300));
        const t2 = document.querySelector('.toasts').getBoundingClientRect();
        out.toastBackTop = t2.top < 200;
        // 3 술집 메뉴
        window._say = G.UI.say; window._ask = G.UI.ask;
        G.UI.say = async () => {}; G.UI.ask = async (t, ch) => ch[ch.length - 1].value;
        G.Scenes.city.visit('tavern');
        for (let i = 0; i < 60 && !document.querySelector('.cmdmenu .cmd.exit'); i++) await new Promise(r => setTimeout(r, 200));
        await new Promise(r => setTimeout(r, 300));
        out.many = !!document.querySelector('.cmdmenu.many');
        out.broken = [...document.querySelectorAll('.cmdmenu .cmd > span:not(.sub)')].filter(sp => { const lh = parseFloat(getComputedStyle(sp).lineHeight) || parseFloat(getComputedStyle(sp).fontSize) * 1.3; return sp.getClientRects().length > 1 || sp.offsetHeight > lh * 1.5; }).map(sp => sp.innerText);
        // 4 두 사람 대화
        G.UI.say = window._say; G.UI.ask = window._ask;
        return out;
      }, NEWGAME.toString());
      ok(!r.toastHitsTabs, '2 창이 열려 있으면 알림이 창 제목·탭줄을 가리지 않는다 (왼쪽 아래)');
      ok(r.toastBackTop, '2 창을 닫으면 알림은 다시 위 가운데');
      ok(r.many && !r.broken.length, '3 술집 두 칸 메뉴: 이름이 낱말 중간에서 꺾이지 않는다 ' + JSON.stringify(r.broken));
      const d = await page.evaluate(async () => {
        const s = G.Game.state, out = {};
        const who = G.Scenes.mateSpeaker('nav'); const p1 = G.UI.say('제독, 돛을 손봐 두었습니다.', { name: who.name, portrait: who.portrait });
        await new Promise(r => setTimeout(r, 700));
        out.say = [...document.querySelectorAll('.dlg-stage > .actor-name')].map(a => a.innerText.replace('▸ ', '').trim() + ':' + (a.classList.contains('speaking') ? 'S' : a.classList.contains('quiet') ? 'q' : '?'));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); await p1;
        const p2 = G.UI.ask('어떻게 할까?', ['한 잔 더', '그만둔다'], { name: s.player.name, portrait: s.player.portrait });
        await new Promise(r => setTimeout(r, 700));
        out.ask = [...document.querySelectorAll('.dlg-stage > .actor-name')].map(a => a.innerText.replace('▸ ', '').trim() + ':' + (a.classList.contains('speaking') ? 'S' : a.classList.contains('quiet') ? 'q' : '?'));
        const sp = document.querySelector('.dlg-stage > .actor-name.speaking'), qu = document.querySelector('.dlg-stage > .actor-name.quiet');
        out.op = sp && qu ? [getComputedStyle(sp).opacity, getComputedStyle(qu).opacity] : null;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await p2;
        return out;
      });
      ok(d.say.some(x => /:S$/.test(x) && x.indexOf('시험') < 0) && d.say.includes('시험:q'), '4 부하가 말할 때: 부하 이름표만 밝고 제독은 흐리다 ' + JSON.stringify(d.say));
      ok(d.ask.some(x => x === '시험:S') && d.ask.some(x => /:q$/.test(x)), '4 제독이 물을 때: 제독 이름표가 밝다 ' + JSON.stringify(d.ask));
      ok(d.op && +d.op[0] > +d.op[1], '4 듣는 사람 이름표는 흐리다 (불투명도 ' + (d.op || []).join(' > ') + ')');
      errs.push(...page.errors); await ctx.close();
    }
    ok(!errs.length, '콘솔 오류 없음 ' + errs.slice(0, 3).join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
