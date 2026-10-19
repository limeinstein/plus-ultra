/* 튜토리얼 대사 점검 (js/data/tutorial.js · 자리표는 js/systems/tutorial.js fmt) 2026-10-20
   ① 모든 대사의 자리표({name} · {sk:누구:특기} · {pow:누구:특기})가 풀린다 — 남은 「{」 없음
   ② 역할·선실 단계에서 말하는 특기 단계가 실제와 맞는다 (특기 늘리기 js/data/renown.js가 바뀌어도 말이 틀리지 않는지)
      · 라 코사를 항해사로 두면 항해술이 오르고, 측량사로 두면 측량이 오른다 · 아라나는 남은 자리에서 늘려 줄 것이 없다
      · 선실 창의 파란 숫자(방의 힘) = 1 + 특기 단계
   ③ 옛 표현이 남아 있지 않다 (화약 · 「그대로 2」 · 「검술 2에」 …) ④ 선실 창 「선실 효과」의 부관 줄 ⑤ 콘솔 오류 0
   node tests/tutorial_text_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Tutorial && G.TUTORIAL, null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      G.Tutorial.start();
      const all = [], bad = [];
      const walk = (x) => { if (typeof x === 'string') all.push(x); else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.keys(x).forEach(k => walk(x[k])); };
      G.TUTORIAL.steps.forEach(st => walk(st));
      all.forEach(t => { const f = G.Tutorial.fmt(t); if (/\{[a-z]+(:[^}]*)?\}/i.test(f)) bad.push(f.slice(0, 80)); });
      const sk = G.Tutorial.skOf;
      const v = { P: { nav: sk('P', 'nav'), survey: sk('P', 'survey'), ops: sk('P', 'ops') }, lacosa: { nav: sk('lacosa', 'nav'), survey: sk('lacosa', 'survey') },
        arana: { sword: sk('arana', 'sword'), ops: sk('arana', 'ops') }, rocco: { sword: sk('rocco', 'sword') } };
      const roles = G.TUTORIAL.steps.find(s => s.id === 'roles'), cabin = G.TUTORIAL.steps.find(s => s.id === 'cabin');
      const said = { roles: roles.teach.concat(roles.done, roles.otherRole).map(l => G.Tutorial.fmt(l[1])), cabin: cabin.teach.map(l => G.Tutorial.fmt(l[1])) };
      const old = all.filter(t => /화약|그대로 2|검술 2에|측량 3에 항해 2|보통 색은|나리들마다|이분 아버님|개조하는 방|찾아 갑니다|이름이 나오 —/.test(t)).map(t => t.slice(0, 40));
      return { n: all.length, bad, v, said, old };
    });
    console.log('   ' + JSON.stringify(r.v));
    r.said.roles.concat(r.said.cabin).forEach(t => console.log('     · ' + t.replace(/\f/g, ' / ').slice(0, 230)));
    ok(r.n > 150 && !r.bad.length, '대사 ' + r.n + '줄 — 자리표가 모두 풀린다 ' + r.bad.join(' | '));
    ok(r.v.lacosa.nav > r.v.P.nav, '라 코사를 항해사로 두면 항해술 ' + r.v.P.nav + ' → ' + r.v.lacosa.nav + ' (「오르니 손해는 아닙니다」가 맞다)');
    ok(r.v.lacosa.survey > r.v.P.survey, '측량사로 두면 측량 ' + r.v.P.survey + ' → ' + r.v.lacosa.survey);
    ok(r.v.arana.sword <= r.v.rocco.sword && r.v.arana.ops <= r.v.P.ops, '아라나: 검술 ' + r.v.arana.sword + '(로코 ' + r.v.rocco.sword + ') · 운용술 ' + r.v.arana.ops + '(제독 ' + r.v.P.ops + ') — 남은 자리에서 늘려 줄 것이 없다');
    ok(!r.old.length, '옛 표현이 남아 있지 않다 ' + r.old.join(' | '));

    // 선실 창: 파란 숫자 = 1 + 특기 단계 · 부관 줄
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 300 });
    const cab = await page.evaluate(async () => {
      const s = G.Game.state; s.flags.prologue = true; s.settings.res = 0.5;
      const lc = G.Legend.join('lacosa', null); if (lc) lc.role = 'surveyor';
      G.Legend.join('arana', null);
      G.Game.go('sea', { depart: 7, fresh: true });
      await new Promise(r => { const t = setInterval(() => { if (G.Game.sceneName === 'sea') { clearInterval(t); r(); } }, 100); });
      await new Promise(r => setTimeout(r, 1500));
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      G.CabinView.open(); await new Promise(r => setTimeout(r, 800));
      const w = [...document.querySelectorAll('.modal-back')].pop();
      return { pow: G.Cabins.power('adjutant'), badge: [...w.querySelectorAll('.cb-pow')].map(e => e.textContent), fx: [...w.querySelectorAll('.cb-tfx')].map(e => e.innerText.replace(/\s+/g, ' ')) };
    });
    console.log('   ' + JSON.stringify(cab));
    await page.screenshot({ path: path.join(process.env.OUT || require('os').tmpdir(), 'tutorial_cabin.png') });
    ok(cab.pow === 1 + r.v.rocco.sword && cab.badge.indexOf(String(1 + r.v.rocco.sword)) >= 0, '부관실의 파란 숫자 ' + cab.pow + ' = 1 + 로코 검술 ' + r.v.rocco.sword);
    ok(cab.fx.some(t => /불만 다독이기 \(충성 70 아래 부하\) 충성 \+1\/달/.test(t)), '선실 효과: 「불만 다독이기 (충성 70 아래 부하) · 충성 +1/달」');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
