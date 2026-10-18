/* 사략선장 (js/systems/court.js CT.privateer · CT.pirateK, js/scenes/sea.js pirateChance):
   왕궁 「특허장」에서 사략허가장을 받으면 사략선장이 되어 해적이 덤비는 빈도가 80% 준다 (G.BALANCE.court.papers.pirateCut).
   ① 허가장 전: 해적 확률 그대로 ② 왕궁에서 받음 → 직위 「사략선장」·부하의 한마디·알림 ③ 확률 ×0.2 (지중해·카리브)
   ④ 실제로 바다에서 3,000번 굴려 해적 떼가 나타난 비율 ⑤ 기한이 끝나면 되돌아옴 ⑥ 저장·불러오기 ⑦ 콘솔 오류 0
   node tests/privateer_smoke.js  (BROWSER_EXE=크로미움 경로 · OUT=스크린샷 폴더) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = process.env.OUT || path.join(ROOT, 'tmp', 'privateer');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '디오구 페헤이라', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.prologueDone = true; s.date = { y: 1520, m: 3, d: 1 }; s.player.gold = 100000;
    });
    // ① 허가장 전
    const r0 = await page.evaluate(() => {
      const SEA = G.Scenes.sea;
      return { priv: G.Court.privateer(), k: G.Court.pirateK(), med: SEA.pirateChance(15, 38), car: SEA.pirateChance(-75, 18) };
    });
    ok(!r0.priv && r0.k === 1 && r0.med > 0 && r0.med > r0.car * 0.5, '허가장 전: 사략선장 아님 · 해적 확률 지중해 ' + r0.med.toFixed(3) + ' · 카리브 ' + r0.car.toFixed(3));
    // ② 리스본 왕궁에서 특허장 → 사략허가장 (포르투갈의 작위가 있어야 한다)
    await page.evaluate(() => { G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy(), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const got = await page.evaluate(async () => {
      const s = G.Game.state, CT = G.Court, king = G.SPONSOR.pt_king, UI = G.UI;
      if (!s.court) s.court = {}; s.court.titles = Object.assign(s.court.titles || {}, { PT: 3 });
      const chooseOld = UI.choose, sayOld = UI.say, says = [], toasts = [], toastOld = UI.toast;
      let step = 0;
      UI.choose = async (title, opts) => { step++; if (step === 1) return opts[0].value; if (step === 2) return opts[0].value; return null; };
      UI.say = async (t, who) => { says.push((who && who.name || '') + ': ' + t); };
      UI.toast = function (t) { toasts.push(t); return toastOld.apply(UI, arguments); };
      const g0 = s.player.gold;
      try { await CT.charters(king); } finally { UI.choose = chooseOld; UI.say = sayOld; UI.toast = toastOld; }
      return { paid: g0 - s.player.gold, marques: CT.marques().map(m => m.realm.name + '→' + m.nation), priv: CT.privateer(), k: CT.pirateK(), says, toasts,
        hud: (document.querySelector('.hud') || document.body).innerText, log: s.log.slice(-3).map(l => l.t || l.text || l) };
    });
    console.log('    ' + got.marques.join(', ') + ' · ' + got.paid + '닢');
    ok(got.priv && Math.abs(got.k - 0.2) < 1e-9 && got.paid > 0, '사략허가장을 받으면 사략선장 — 해적 빈도 ×' + got.k.toFixed(2));
    ok(/사략선장/.test(got.hud), '윗줄 직위에 「사략선장」');
    ok(got.toasts.some(t => /해적의 습격 −80%/.test(t)) && got.says.some(t => /해적 놈들|해적들도/.test(t)), '알림 「해적의 습격 −80%」 · 부하의 한마디: ' + (got.says.filter(t => /해적 놈들|해적들도/.test(t))[0] || '').slice(0, 60) + '…');
    await page.evaluate(() => G.Game.refreshHud && G.Game.refreshHud());
    await page.screenshot({ path: path.join(OUT, '01_hud_privateer.png') });
    // ③ 확률
    const r1 = await page.evaluate(() => { const SEA = G.Scenes.sea; return { med: SEA.pirateChance(15, 38), car: SEA.pirateChance(-75, 18) }; });
    ok(Math.abs(r1.med / r0.med - 0.2) < 1e-6 && Math.abs(r1.car / r0.car - 0.2) < 1e-6, '해적이 나타날 확률 80% 줄어듦: 지중해 ' + r0.med.toFixed(3) + ' → ' + r1.med.toFixed(3) + ' · 카리브 ' + r0.car.toFixed(3) + ' → ' + r1.car.toFixed(3));
    // ④ 바다에서 굴려 보기 (지중해 시칠리아 앞바다): 사략선장 전·후 3,000번씩
    await page.evaluate(() => { G.Game.go('sea', { depart: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'sea', null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const mc = await page.evaluate(() => {
      const s = G.Game.state, SEA = G.Scenes.sea, rt = SEA.runtime(), CT = G.Court;
      const keep = { loc: Object.assign({}, s.loc), pace: G.Pace && G.Pace.ok, sf: G.SeaFolk && G.SeaFolk.spawn, fk: G.Fakes && G.Fakes.spawnChaser, ct: CT.spawn, pr: G.Princess && G.Princess.spawn, npcs: rt.npcs };
      if (G.Pace) G.Pace.ok = () => true;   // 사건 사이의 간격은 빼고 확률만 본다
      if (G.SeaFolk) G.SeaFolk.spawn = () => null; if (G.Fakes) G.Fakes.spawnChaser = () => null; CT.spawn = () => null; if (G.Princess) G.Princess.spawn = () => null;
      s.loc.lon = 15; s.loc.lat = 37.6;
      function roll(N) { let p = 0; for (let i = 0; i < N; i++) { rt.npcs = []; SEA.spawnNpcsForTest(); if (rt.npcs.some(n => n.kind === 'pirate')) p++; } return p; }
      const mq = s.court.papers.marque; const saved = JSON.parse(JSON.stringify(mq));
      Object.keys(mq).forEach(k => delete mq[k]); const before = roll(3000);
      Object.assign(mq, saved); const after = roll(3000);
      rt.npcs = keep.npcs; Object.assign(s.loc, keep.loc);
      if (G.Pace) G.Pace.ok = keep.pace; if (G.SeaFolk) G.SeaFolk.spawn = keep.sf; if (G.Fakes) G.Fakes.spawnChaser = keep.fk; CT.spawn = keep.ct; if (G.Princess) G.Princess.spawn = keep.pr;
      return { before, after };
    });
    const ratio = mc.after / Math.max(1, mc.before);
    ok(mc.before > 80 && ratio > 0.1 && ratio < 0.32, '바다에서 3,000번 굴림 — 해적 떼: 허가장 없이 ' + mc.before + '번 → 사략선장 ' + mc.after + '번 (×' + ratio.toFixed(2) + ')');
    // ⑥ 저장·불러오기: 사략허가장과 사략선장은 저장된다
    const sv = await page.evaluate(() => { const js = JSON.stringify(G.Game.state); const s2 = JSON.parse(js); const k = Object.keys(s2.court.papers.marque); return k.length; });
    ok(sv === 1, '저장 상태에 사략허가장 ' + sv + '장');
    // ⑤ 기한이 끝나면
    const ex = await page.evaluate(() => {
      const s = G.Game.state, d0 = s.date; s.date = { y: d0.y + 3, m: d0.m, d: d0.d };
      const news = G.Court.daily().map(m => m.text);
      const r = { news, priv: G.Court.privateer(), k: G.Court.pirateK(), med: G.Scenes.sea.pirateChance(15, 38) };
      s.date = d0; return r;
    });
    ok(!ex.priv && ex.k === 1 && Math.abs(ex.med - r0.med) < 1e-9 && ex.news.some(t => /사략선장이 아니다/.test(t)), '기한이 끝나면 다시 여느 배: 「' + ex.news.filter(t => /사략/.test(t)).join(' / ') + '」');
    await page.waitForTimeout(500);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
    console.log('    스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
