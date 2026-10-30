/* 1700년 장기 QA (2026-10-31) — node tools/qa_longrun/run.js  (ROOT=게임 폴더, OUT=결과 폴더, LEGS=최대 항해 수, PASS=항해마다 흐르는 날, ENDY=끝 해)
   새 게임(1480, 포르투갈 탐험가)으로 항해·탐험·세월을 실제 장면 코드로 돌리며 대를 잇고, ENDY에 아들 없이 은퇴 → 「항해의 끝」 → 타이틀.
   그 뒤 같은 상태에서 수명(80세)이 다해 죽는 끝도 확인한다. 결과: OUT/log.jsonl(한 줄 = 항해·탐험·스냅숏), errors.json, ui.json, save_<해>.json
   끝나는 두 길(아들 없이 80세 · 선원 전멸)만 따로: node tools/qa_longrun/ends.js OUT/save_end.json
   2026-10-31 판: 항해 107번 모두 도착, 육상 탐험 35번, 대 잇기 4번(섭정 1번), 1700.1.1 은퇴 → 「항해의 끝」 → 타이틀, 45분 */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'qa_longrun');
const ENDY = +(process.env.ENDY || 1700);
const PASS = +(process.env.PASS || 900);
const LEGS = +(process.env.LEGS || 999);
fs.mkdirSync(OUT, { recursive: true });
const logF = fs.createWriteStream(path.join(OUT, 'log.jsonl'), { flags: 'w' });
function out(o) { const line = JSON.stringify(o); console.log(line); logF.write(line + '\n'); }

const PLAN = [
  // 유럽·지중해
  '세빌리아', '바르셀로나', '제노바', '베니스', '아테네', '나폴리', '마르세유', '리스본',
  // 북유럽
  '브리스틀', '런던', '앤트워프', '암스테르담', '함부르크', '코펜하겐', '스톡홀름', '베르겐', '에든버러', '리스본',
  // 아프리카 돌아 인도
  '마디라', '베르데 곶', '산호르헤', '르완다', '케이프', '모잠비크', '말린디', '캘리컷', '고아',
  // 동방
  '콜롬보', '말라카', '반탐', '테르나테', '오문', '나가사키', '오문', '말라카', '고아',
  // 돌아오는 길
  '무스카트', '말린디', '모잠비크', '케이프', '르완다', '산토메', '아조레스', '리스본',
  // 브라질
  '베르데 곶', '페르남부쿠', '바이앙', '리우데자네이루', '부에노스아이레스', '페르남부쿠', '리스본',
  // 카리브·북아메리카
  '아조레스', '산토도밍고', '아바나', '베라크루스', '아바나', '세인트오거스틴', '제임스타운', '보스턴', '뉴욕', '퀘벡', '세인트존스', '리스본'
];
// 대마다 아들을 둘 나이 (2대는 늦게 — 어린 맏아들의 섭정을 시험), 5대부터는 아들 없음
const SON_AGE = { 1: 30, 2: 70, 3: 40, 4: 30 };

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--js-flags=--max-old-space-size=4096', '--enable-precise-memory-info'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = {};
  function addErr(kind, msg, stack) {
    const k = kind + ': ' + String(msg).slice(0, 200);
    if (!errors[k]) { errors[k] = { n: 0, first: null, stack: stack || '' }; }
    errors[k].n++;
    if (errors[k].n <= 3) page.evaluate(() => (window.QA && G.Game && G.Game.state ? QA.date() + ' ' + G.Game.sceneName : '?')).then(d => { (errors[k].when = errors[k].when || []).push(d + ' leg' + legNow); }).catch(() => {});
  }
  var legNow = 0;
  page.on('pageerror', e => addErr('pageerror', e.message, String(e.stack || '').split('\n').slice(0, 4).join(' | ')));
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE_NOT_FOUND|ERR_NAME|ERR_TUNNEL|ERR_CONNECTION|net::|Failed to load resource/.test(t)) addErr('console', t, (m.location() || {}).url + ':' + (m.location() || {}).lineNumber);
    if (m.type() === 'warning' && /\[저장\]|quota|Quota/.test(t)) addErr('warn', t);
  });
  await page.route(/^https?:\/\//, route => { const u = route.request().url(); if (/fonts\.g/.test(u)) return route.fulfill({ status: 200, body: '' }); return route.fulfill({ status: 204, body: '' }); });
  await page.addInitScript({ path: path.join(__dirname, 'qalib.js') });
  const T0 = Date.now();
  let profN = 0;
  const watch = setInterval(async () => {
    if (profN >= 4 || watch.busy) return; watch.busy = true;
    try {
      const cdp = await page.context().newCDPSession(page);
      const r = await cdp.send('Runtime.evaluate', { expression: 'JSON.stringify({ms: window.QA && QA.tickMs, at: window.QA && QA.tickAt, scene: window.G && G.Game && G.Game.sceneName, c: window.QA && QA.counts && QA.counts()})', returnByValue: true });
      const v = JSON.parse(r.result.value || '{}');
      if (v.ms > 300 && v.scene === 'sea' && Date.now() - v.at < 15000) {
        profN++;
        await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
        await new Promise(r2 => setTimeout(r2, 15000));
        const { profile } = await cdp.send('Profiler.stop');
        const byId = {}, parent = {}, counts = {}; profile.nodes.forEach(n => { byId[n.id] = n; (n.children || []).forEach(c => { parent[c] = n.id; }); });
        profile.samples.forEach((id, i) => { counts[id] = (counts[id] || 0) + (profile.timeDeltas[i] || 0); });
        const self = {}, incl = {}, nm = id => { const cf = byId[id].callFrame; return cf.functionName + ' ' + path.basename(cf.url) + ':' + (cf.lineNumber + 1); };
        Object.keys(counts).forEach(id => { self[nm(id)] = (self[nm(id)] || 0) + counts[id]; let cur = +id; const seen = new Set(); while (cur != null) { const k = nm(cur); if (!seen.has(k)) { incl[k] = (incl[k] || 0) + counts[id]; seen.add(k); } cur = parent[cur]; } });
        const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, t]) => Math.round(t / 1000) + 'ms ' + k);
        fs.writeFileSync(path.join(OUT, 'slowprof_' + profN + '.json'), JSON.stringify({ when: v, self: top(self), incl: top(incl) }, null, 1));
        out({ t: 'slowprof', n: profN, ms: Math.round(v.ms), counts: v.c, self: top(self).slice(0, 6) });
      }
      await cdp.detach();
    } catch (e) { /* 다음에 */ }
    watch.busy = false;
  }, 20000);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    const start = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init(); G.UI.fade = async fn => { fn && fn(); };
      QA.stubGames();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; }); sk.nav = 2; sk.survey = 1; sk.ops = 1;
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 3, d: 9 }, st: { str: 62, int: 64, mar: 58, cha: 63 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true; s.settings.res = 0.35;
      s.player.gold = 20000;
      G.Game.go('city', { cityId: s.player.home }); await QA.settle(60000);
      return { date: QA.date(), scene: G.Game.sceneName, home: G.CITY_DATA[s.player.home].name, ships: s.fleet.ships.map(x => x.type), crew: s.fleet.crew };
    });
    out({ t: 'start', ...start });
    let leg = 0, pi = 0, landN = 0;
    const checkpoints = [1500, 1550, 1600, 1650, 1700];
    while (leg < LEGS) {
      const now = await page.evaluate(() => ({ y: G.Game.state.date.y, scene: G.Game.sceneName, city: G.Game.state.loc.city }));
      if (now.y >= ENDY || now.scene === 'title') break;
      // 다음 목적지 (없거나 들어갈 수 없는 항구는 건너뛴다)
      const dest = await page.evaluate((args) => {
        const [plan, pi] = args; const R = G.R, s = G.Game.state;
        for (let k = 0; k < plan.length; k++) {
          const nm = plan[(pi + k) % plan.length], c = G.CITY_DATA.find(x => x && x.name === nm);
          if (!c || !c.port || !R.cityExists(c) || c.id === s.loc.city) continue;
          let blk = null; try { blk = G.Scenes.city.entryCheck(c); } catch (e) { blk = null; }
          if (blk) continue;
          return { id: c.id, name: nm, skip: k, pi: (pi + k + 1) % plan.length };
        }
        return null;
      }, [PLAN, pi]);
      if (!dest) { out({ t: 'warn', msg: '갈 곳 없음' }); break; }
      pi = dest.pi;
      const prep = await page.evaluate(() => QA.prep(90));
      const v = await page.evaluate((id) => QA.voyage(id), dest.id);
      leg++; legNow = leg;
      if (v.anomaly) { fs.writeFileSync(path.join(OUT, 'anomaly_leg' + leg + '.json'), JSON.stringify(v.anomaly, null, 0)); v.anomaly = { file: 'anomaly_leg' + leg + '.json', log: v.anomaly.log.slice(-12) }; }
      out({ t: 'voyage', leg, ...v, prep });
      if (/title/.test(v.res || '')) {
        // 게임이 끝났다(선원 전멸 등) — 기록을 남기고 출항 전 상태로 되돌려 계속 간다
        const pre = JSON.parse(fs.readFileSync(path.join(OUT, 'anomaly_leg' + leg + '.json'), 'utf8')).pre;
        const back = await page.evaluate(async (pre) => { G.Game.state = G.State.deserialize(pre); const s = G.Game.state; G.Game.go('city', { cityId: s.loc.city }); await QA.settle(60000); return { date: QA.date(), scene: G.Game.sceneName }; }, pre);
        out({ t: 'reload', leg, ...back });
        continue;
      }
      // 육상 탐험 (세 번째 항해마다)
      if (leg % 3 === 0) {
        const e = await page.evaluate(() => { const s = G.Game.state; QA.prep(60); return QA.explore(s.loc.city, 12); });
        landN++;
        out({ t: 'land', n: landN, ...e });
      }
      // 아들
      const fam = await page.evaluate((SON_AGE) => {
        const s = G.Game.state, p = s.player, g = p.generation || 1, want = SON_AGE[g];
        s.qaSon = s.qaSon || {};
        if (want && !s.qaSon[g] && G.R.age() >= want) { s.qaSon[g] = 1; return { gen: g, son: QA.giveSon(g + '대 ' + G.R.age() + '세') }; }
        return null;
      }, SON_AGE);
      if (fam) out({ t: 'family', ...fam });
      // 세월
      const yNow = await page.evaluate(() => G.Game.state.date.y);
      const days = await page.evaluate((args) => { const [PASS, ENDY] = args; const s = G.Game.state; const left = G.U.dayIndex({ y: ENDY, m: 1, d: 1 }) - G.U.dayIndex(s.date); return Math.max(0, Math.min(PASS, left)); }, [PASS, ENDY]);
      const p = await page.evaluate((d) => QA.pass(d), days);
      if (p.events.length) out({ t: 'pass', ...p });
      const snap = await page.evaluate(() => Object.assign(QA.snap(), { cnt: QA.counts() }));
      out({ t: 'snap', leg, msDay: p.msDay, ...snap, realMin: +((Date.now() - T0) / 60000).toFixed(1) });
      for (const cy of checkpoints.slice()) {
        if (snap && +snap.date.split('.')[0] >= cy) { checkpoints.splice(checkpoints.indexOf(cy), 1); fs.writeFileSync(path.join(OUT, 'save_' + cy + '.json'), await page.evaluate(() => QA.export())); }
      }
      if (snap.bad && snap.bad.length) out({ t: 'bad', bad: snap.bad });
    }
    // ---------------------------------------------------------------- 끝: 아들 없이 은퇴
    fs.writeFileSync(path.join(OUT, 'save_end.json'), await page.evaluate(() => QA.export()));
    const end1 = await page.evaluate(async () => {
      const s = G.Game.state, F = G.Family, o = { date: QA.date(), name: s.player.name, gen: s.player.generation, age: G.R.age(), heirs: F.heirs().length, minor: !!F.minorSon(), scene0: G.Game.sceneName };
      s.contract = null;
      QA.want = /은퇴한다/;
      let seenEnd = false; const ob = new MutationObserver(() => { if (/항해의 끝/.test(document.body.innerText) && /FINIS/.test(document.body.innerText)) { seenEnd = true; o.endText = (document.querySelector('.win') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 300); } });
      ob.observe(document.body, { childList: true, subtree: true });
      const p = F.retire(false);
      await QA.settle(60000); await p.catch(e => { o.err = String(e); });
      await QA.settle(20000);
      ob.disconnect(); QA.want = null;
      o.seenEnd = seenEnd; o.scene = G.Game.sceneName;
      return o;
    });
    out({ t: 'end-retire', ...end1 });
    // ---------------------------------------------------------------- 끝: 수명이 다해 (같은 상태에서 다시)
    const json = fs.readFileSync(path.join(OUT, 'save_end.json'), 'utf8');
    const end2 = await page.evaluate(async (json) => {
      G.Game.state = G.State.deserialize(json); const s = G.Game.state, F = G.Family;
      s.contract = null;
      G.Game.go('city', { cityId: s.player.home }); await QA.settle(60000);
      const o = { date: QA.date(), age: G.R.age(), scene0: G.Game.sceneName };
      let seenEnd = false; const ob = new MutationObserver(() => { if (/FINIS/.test(document.body.innerText)) { seenEnd = true; o.endText = (document.querySelector('.win') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 300); } });
      ob.observe(document.body, { childList: true, subtree: true });
      const r = await QA.pass(366 * 12);
      ob.disconnect();
      o.pass = r; o.seenEnd = seenEnd; o.scene = G.Game.sceneName; o.dateEnd = G.Game.state ? QA.date() : null;
      return o;
    }, json);
    out({ t: 'end-death', ...end2 });
    const fin = await page.evaluate(() => ({ prompts: QA.prompts, picks: QA.picks, stuckUI: QA.stuckUI, fights: QA.fights, notes: QA.notes }));
    fs.writeFileSync(path.join(OUT, 'ui.json'), JSON.stringify(fin, null, 1));
    out({ t: 'fin', fights: fin.fights, stuckUI: fin.stuckUI.length, notes: fin.notes });
  } catch (e) { out({ t: 'crash', msg: String(e && e.stack || e) }); process.exitCode = 1; }
  finally {
    fs.writeFileSync(path.join(OUT, 'errors.json'), JSON.stringify(errors, null, 1));
    out({ t: 'errors', n: Object.keys(errors).length, list: Object.keys(errors).slice(0, 30).map(k => k + ' ×' + errors[k].n) });
    out({ t: 'done', realMin: +((Date.now() - T0) / 60000).toFixed(1) });
    clearInterval(watch); await browser.close(); logF.end();
  }
})();
