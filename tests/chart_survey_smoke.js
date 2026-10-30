/* 중세 양피지·네 단계 재탐사·저장 호환·실제 이동·기존 해도 조작을 Chromium에서 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/chart-survey-20261029');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { const raf = requestAnimationFrame.bind(window); window.__frames = true; window.requestAnimationFrame = cb => raf(t => { if (window.__frames) cb(t); }); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.ChartArt && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending && !G.Loader.shown(), null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const checks = [], ok = (v, m) => { if (!v) throw Error(m); checks.push(m); };
      G.State.newGame({ name: '양피지 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
        st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      await G.Game.ensureGeo(); await G.ChartArt.preload(); window.__frames = false;
      let s = G.Game.state; s.settings.res = .35;
      const p = [5, 43], radius = 13, box = { lon0: -20, lon1: 30, lat0: 25, lat1: 60 };
      G.State.chartInit(s);
      const originals = {}, names = ['isLand', 'sdfRaw', 'river', 'terrain', 'climate']; let geoCalls = 0;
      names.forEach(k => { originals[k] = G.Geo[k]; G.Geo[k] = function () { geoCalls++; return originals[k].apply(this, arguments); }; });
      const blank = G.Info.chartTerrain(900, 630, box); names.forEach(k => { G.Geo[k] = originals[k]; });
      ok(geoCalls === 0 && blank._chartStats.unknown === 900 * 630 && blank._chartStats.motifs > 0, '미지 영역은 실제 지형을 읽지 않고 양피지·상상 삽화만 표시');
      const images = [{ stage: 0, png: blank.toDataURL(), stats: blank._chartStats }];
      let pct;
      for (let stage = 1; stage <= 4; stage++) {
        if (stage > 1) G.State.surveyChart(100, 0, radius);
        G.State.surveyChart(p[0], p[1], radius);
        ok(G.State.chartLevel(p[0], p[1]) === stage, stage + '회 통과 단계 기록');
        const before = s.chartRevision;
        for (let n = 0; n < 20; n++) G.State.surveyChart(p[0], p[1], radius);
        G.State.revealChart(p[0], p[1], radius);
        ok(s.chartRevision === before && G.State.chartLevel(p[0], p[1]) === stage, stage + '회: 정지·반복 탐색·겹친 시야로 단계가 오르지 않음');
        if (stage === 2) pct = G.State.chartPercent();
        if (stage > 2) ok(G.State.chartPercent() === pct, '세부 조사로 해도 작성 면적을 중복 계산하지 않음');
        const image = G.Info.chartTerrain(900, 630, box), st = image._chartStats;
        ok(stage >= 2 ? st.river > 0 : st.river === 0, stage + '회: 강은 두 번째부터');
        ok(stage >= 3 ? st.mountain > 0 : st.mountain === 0, stage + '회: 산은 세 번째부터');
        ok(stage >= 4 ? st.terrain > 0 : st.terrain === 0, stage + '회: 지형 채색은 네 번째부터');
        images.push({ stage, png: image.toDataURL(), stats: st });
      }
      for (let n = 0; n < 3; n++) { G.State.surveyChart(100, 0, radius); G.State.surveyChart(p[0], p[1], radius); }
      ok(G.State.chartLevel(p[0], p[1]) === 4, '네 번째 뒤에는 상세도 상한 유지');
      const encoded = G.State.serialize(), record = JSON.parse(encoded);
      ok(typeof record.chartSurvey === 'string' && !record.chartPasses && !record.chartBits, '조사 횟수는 배열 객체가 아닌 압축 가능한 바이트 문자열로 저장');
      G.Game.state = G.State.deserialize(encoded); s = G.Game.state;
      const revision = s.chartRevision; G.State.surveyChart(p[0], p[1], radius);
      ok(G.State.chartLevel(p[0], p[1]) === 4 && s.chartRevision === revision, '저장·불러오기 뒤 단계 보존·같은 자리 중복 조사 방지');
      delete record.chartSurvey; delete record.chartLast; delete record.chartRevision;
      G.Game.state = G.State.deserialize(JSON.stringify(record)); s = G.Game.state;
      ok(G.State.chartLevel(p[0], p[1]) === 1 && G.State.charted(p[0], p[1]), '옛 저장은 탐험 범위를 보존하고 윤곽 단계로 시작');
      G.State.surveyChart(p[0], p[1], radius); ok(G.State.chartLevel(p[0], p[1]) === 1, '옛 해도 첫 실제 통과는 한 번으로 기록');
      G.State.surveyChart(100, 0, radius); G.State.surveyChart(p[0], p[1], radius);
      ok(G.State.chartLevel(p[0], p[1]) === 2, '옛 저장도 재방문부터 강이 드러남');
      G.State.chartInit(s); G.State.surveyChart(179.8, 0, 2); G.State.surveyChart(-179.8, 0, 2);
      ok(G.State.chartLevel(179.8, 0) === 1, '날짜 변경선을 건너도 겹친 시야를 재방문으로 잘못 세지 않음');
      G.State.surveyChart(160, 0, 2); G.State.surveyChart(179.8, 0, 2);
      ok(G.State.chartLevel(179.8, 0) === 2, '날짜 변경선 부근도 떠났다 돌아오면 재탐사');
      G.State.surveyChart(0, 89.9, 2); ok(G.State.chartLevel(0, 89.9) === 1, '극지 격자 범위 안전');
      G.State.chartInit(s); G.State.revealChart(0, 0, 4);
      const a = G.State.chartPercent(); for (let n = 0; n < 10; n++) G.State.revealChart(0, 0, 4);
      ok(G.State.chartLevel(0, 0) === 1 && G.State.chartPercent() === a, '책·임무·탐색으로 같은 해도를 받아도 조사 횟수는 늘지 않음');
      // 실제 이동 루프. 멈추거나 대화 중이면 조사 호출도 없어야 한다.
      G.Game.go('sea', { depart: 0 }); const sea = G.Scenes.sea.runtime(); sea.paused = true;
      const survey = G.State.surveyChart; let calls = 0;
      G.State.surveyChart = function () { calls++; return survey.apply(this, arguments); };
      for (let n = 0; n < 4; n++) G.Scenes.sea.update(1 / 30);
      ok(calls === 0, '실제 바다 화면에서 정지 중이면 재탐사하지 않음');
      G.Scenes.sea.takeCourse(Math.PI);
      for (let n = 0; n < 20; n++) G.Scenes.sea.update(1 / 30);
      ok(calls > 0, '실제 항해 이동에서 조사 기록 호출');
      calls = 0; G.Game.go('land', { from: 0 });
      const land = G.Scenes.land.runtime(); land.paused = false; land.dir = [1, 0];
      for (let n = 0; n < 10; n++) G.Scenes.land.update(1 / 30);
      ok(calls > 0, '실제 육상 이동에서도 조사 기록 호출'); G.State.surveyChart = survey;
      // 비교 그림을 만든 위치로 되돌리고 수첩 해도를 펼친다.
      G.State.chartInit(s); G.State.revealChart(-12, 38, 9); G.State.revealChart(0, 40, 9);
      for (let n = 0; n < 4; n++) { G.State.surveyChart(100, 0, 13); G.State.surveyChart(5, 43, 13); }
      G.Info.open('map');
      return { checks, images, saveBytes: encoded.length };
    });
    for (const row of result.images) fs.writeFileSync(path.join(OUT, `stage-${row.stage}.png`), Buffer.from(row.png.split(',')[1], 'base64'));
    await page.waitForSelector('.chartview canvas');
    await page.evaluate(() => { const api = document.querySelector('.chartview')._cv; api.view.lon = -5; api.view.lat = 36; api.view.span = 120; api.redraw(); });
    await page.waitForFunction(() => G.ChartArt.revision > 0, null, { polling: 100 });
    await page.waitForTimeout(900); // 확대 뒤 선명한 판으로 바뀌고 알림이 사라질 때까지 기다린다.
    await page.screenshot({ path: path.join(OUT, 'notebook-medieval-chart.png') });
    assert.deepStrictEqual(errors, [], '브라우저 오류 0');
    const report = { checks: result.checks, stages: result.images.map(({ stage, stats }) => ({ stage, stats })), saveBytes: result.saveBytes, errors };
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`PASS: ${report.checks.length} checks, stages 0→4, no browser errors, save ${report.saveBytes} bytes`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
