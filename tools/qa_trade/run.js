/* 교역 1억 QA 실행기 (2026-11-07) — node tools/qa_trade/run.js
   환경값: RUNS=판 수(기본 1) · FROM=첫 판 번호 · OUT=결과 폴더 · REALMIN=판마다 실제 분 상한 · PLAN=판 설정 JSON 파일(배열, 판 번호로 고름)
   판마다 페이지를 새로 열어(이전 판의 전역 상태가 남지 않게) 새 게임 1480년에서 시작해 재산(소지금+예금) 1억까지 교역만 한다.
   결과: OUT/runs.jsonl (판 요약) · OUT/legs_<번호>.json (구간 기록) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const OUT = process.env.OUT || '/tmp/qa_trade';
fs.mkdirSync(OUT, { recursive: true });
const RUNS = +(process.env.RUNS || 1), FROM = +(process.env.FROM || 0);
const PLANS = process.env.PLAN ? JSON.parse(fs.readFileSync(process.env.PLAN, 'utf8')) : null;
function optFor(i) {
  if (PLANS) return PLANS[i % PLANS.length];
  return { i, seed: 1000 + i, nation: i % 2 ? 'ES' : 'PT', job: 'merchant', brain: i % 5 < 3 ? 'oracle' : 'ledger', maxLeg: [25, 40, 60][i % 3], ships: true, shipK: [3, 5][i % 2], windK: 1.0, endY: 1700, realMin: +(process.env.REALMIN || 12) };
}
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--js-flags=--max-old-space-size=4096'] });
  for (let i = FROM; i < FROM + RUNS; i++) {
    const opt = Object.assign({ i }, optFor(i));
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = {};
    page.on('pageerror', e => { const k = String(e.message).slice(0, 160); errors[k] = (errors[k] || 0) + 1; });
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) { const k = m.text().slice(0, 160); errors[k] = (errors[k] || 0) + 1; } });
    page.on('console', m => { if (/^TBP /.test(m.text())) console.log(m.text()); });
    await page.route(/^https?:\/\//, r => r.fulfill({ status: 204, body: '' }));
    await page.addInitScript('window.__QA_SEED=' + opt.seed);
    await page.addInitScript({ path: path.join(ROOT, 'tools/qa_longrun/qalib.js') });
    await page.addInitScript({ path: path.join(__dirname, 'tradebot.js') });
    const t0 = Date.now();
    let res;
    if (process.env.PROF) setTimeout(async () => {
      try {
        const cdp = await page.context().newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 300 }); await cdp.send('Profiler.start');
        await new Promise(r => setTimeout(r, 40000));
        const { profile } = await cdp.send('Profiler.stop');
        const byId = {}, parent = {}, counts = {}; profile.nodes.forEach(n => { byId[n.id] = n; (n.children || []).forEach(c => { parent[c] = n.id; }); });
        profile.samples.forEach((id, k) => { counts[id] = (counts[id] || 0) + (profile.timeDeltas[k] || 0); });
        const self = {}, incl = {}, nm = id => { const cf = byId[id].callFrame; return cf.functionName + ' ' + path.basename(cf.url) + ':' + (cf.lineNumber + 1); };
        Object.keys(counts).forEach(id => { self[nm(id)] = (self[nm(id)] || 0) + counts[id]; let cur = +id; const seen = new Set(); while (cur != null) { const k = nm(cur); if (!seen.has(k)) { incl[k] = (incl[k] || 0) + counts[id]; seen.add(k); } cur = parent[cur]; } });
        const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, t]) => Math.round(t / 1000) + 'ms ' + k);
        fs.writeFileSync(path.join(OUT, 'prof_' + i + '.txt'), 'SELF\n' + top(self).join('\n') + '\nINCL\n' + top(incl).join('\n'));
      } catch (e) { console.log('prof err', e.message); }
    }, 30000);
    try {
      await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
      res = await page.evaluate(async (opt) => {
        await G.Game.ensureGeo(); G.Nav.init(); G.UI.fade = async fn => { fn && fn(); };
        QA.stubGames();
        const job = G.JOBS.find(j => j.id === opt.job) || G.JOBS[0], sk = {};
        G.SKILLS.forEach(x => { sk[x.id] = 0; }); Object.assign(sk, job.skills || {});
        const lg = G.LANGS.map((_, k) => (opt.nation === 'PT' ? k === 1 : k === 0) ? 3 : 0);
        G.State.newGame({ name: '시험', nation: opt.nation, job: opt.job, age: 20, birth: { m: 3, d: 9 }, st: { str: 60, int: 64, mar: 56, cha: 66 }, sk, lg, diff: 'normal' });
        const s = G.Game.state; s.flags.prologue = true; s.settings.res = 0.35;
        G.Game.go('city', { cityId: s.player.home }); await QA.settle(60000);
        const r = await TB.run(opt);
        r.legsAll = TB.legs; r.toasts = Object.entries(TB.toasts || {}).sort((a, b) => b[1] - a[1]).slice(0, 60); r.busyWhy = Object.entries(TB.busyWhy).sort((a, b) => b[1] - a[1]).slice(0, 30); r.prof = TB.prof; r.prompts = Object.entries(QA.prompts).sort((a, b) => b[1] - a[1]).slice(0, 40); r.picks = QA.picks; r.stuck = QA.stuckUI.slice(0, 20); r.qnotes = QA.notes.slice(0, 20);
        return r;
      }, opt);
    } catch (e) { res = { opt, crash: String(e && e.stack || e).slice(0, 600) }; }
    res.errors = errors; res.wallS = Math.round((Date.now() - t0) / 1000);
    fs.writeFileSync(path.join(OUT, 'legs_' + i + '.json'), JSON.stringify(res.legsAll || [], null, 0));
    delete res.legsAll;
    fs.appendFileSync(path.join(OUT, 'runs.jsonl'), JSON.stringify(res) + '\n');
    console.log(JSON.stringify({ i, end: res.end, final: res.final && { y: res.final.y, wealth: res.final.wealth, ships: res.final.ships }, marks: res.marks, legs: res.legs, wallS: res.wallS, errs: Object.keys(errors).length, crash: res.crash }));
    await page.close();
  }
  await browser.close();
})();
