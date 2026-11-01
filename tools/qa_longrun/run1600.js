/* 1600→1700 시험 판 (2026-11-01) — run.js에서 갈라짐. START=저장.json(없으면 1480 새 게임) · ROUTE=europe|africa_india|east_asia|americas|world · SEED=난수 씨앗
   · 1600 저장 만들기: ENDY=1600 ERAEND=0 node tools/qa_longrun/run1600.js → OUT/save_1600.json
   · 그 저장에서: START=OUT/save_1600.json ROUTE=east_asia SEED=303 PASS=400 OUT=… node tools/qa_longrun/run1600.js
   · 한 번에 40°(약 120일)가 넘는 곳은 가는 길의 중간 항구에 들른다 · 1700년 1월 1일 대항해시대의 끝(G.EraEnd)까지 확인 · OUT/events.json = 일지·소식·창·말 기록(evlog.js)
   원래 머리말: 1700년 장기 QA (2026-10-31) — node tools/qa_longrun/run.js  (ROOT=게임 폴더, OUT=결과 폴더, LEGS=최대 항해 수, PASS=항해마다 흐르는 날, ENDY=끝 해)
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

const ROUTES = {
  europe: ['세빌리아', '바르셀로나', '마르세유', '제노바', '피사', '나폴리', '팔레르모', '베니스', '라구사', '아테네', '간디아', '이스탄불', '카파', '알렉산드리아', '베이루트', '튀니스', '알제', '말라가', '리스본',
    '보르도', '낭트', '런던', '브리스틀', '더블린', '에든버러', '앤트워프', '암스테르담', '브레멘', '함부르크', '코펜하겐', '스톡홀름', '단치히', '리가', '베르겐', '런던', '리스본'],
  africa_india: ['마디라', '라스팔마스', '베르데 곶', '시에라리온', '산호르헤', '산토메', '르완다', '케이프', '소팔라', '모잠비크', '킬와', '잔지바르', '몸바사', '말린디', '모가디슈', '아덴', '무스카트', '호르무즈', '바스라', '디우', '고아', '캘리컷', '코친', '콜롬보', '캘커타',
    '코친', '고아', '무스카트', '말린디', '모잠비크', '케이프', '산토메', '아조레스', '리스본'],
  east_asia: ['베르데 곶', '케이프', '모잠비크', '고아', '콜롬보', '아친', '말라카', '아유타야', '유에', '오문', '광주', '하문', '천주', '복주', '상해', '항주', '동래', '한양', '나가사키', '사카이', '에도', '나가사키', '오문', '브루나이', '테르나테', '암보이나', '수라바야', '반탐', '말라카', '페구', '콜롬보', '고아', '케이프', '리스본'],
  americas: ['아조레스', '산토도밍고', '산후안', '아바나', '베라크루스', '캄페체', '포르토벨로', '카르타헤나', '쿠마나', '파라마리보', '벨렝', '페르남부쿠', '바이앙', '리우데자네이루', '부에노스아이레스', '발파라이소', '리마', '과야킬', '파나마', '아카풀코', '파나마', '자메이카', '아바나', '세인트오거스틴', '찰스턴', '제임스타운', '필라델피아', '뉴욕', '보스턴', '퀘벡', '몬트리올', '세인트존스', '아조레스', '리스본'],
  world: null
};
const PLAN0 = [
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
const PLAN = ROUTES[process.env.ROUTE || 'world'] || PLAN0;
// 대마다 아들을 둘 나이 (2대는 늦게 — 어린 맏아들의 섭정을 시험), 5대부터는 아들 없음
const SON_AGE = process.env.START ? { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30, 6: 30, 7: 30, 8: 30, 9: 30, 10: 30, 11: 30, 12: 30 } : { 1: 30, 2: 70, 3: 40, 4: 30 };

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
  await page.addInitScript('window.__QA_SEED=' + (+(process.env.SEED || 20261031)));
  await page.addInitScript({ path: path.join(__dirname, 'qalib.js') });
  await page.addInitScript({ path: path.join(__dirname, 'evlog.js') });
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
    if (process.env.START) await page.addInitScript('window.__START=' + JSON.stringify(fs.readFileSync(process.env.START, 'utf8')));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    const start = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init(); G.UI.fade = async fn => { fn && fn(); };
      QA.stubGames();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; }); sk.nav = 2; sk.survey = 1; sk.ops = 1;
      if (window.__START) { G.Game.state = G.State.deserialize(window.__START); const s0 = G.Game.state; s0.player.gold = Math.max(s0.player.gold, 20000); if (s0.fleet.ships.length < 2) { s0.fleet.ships = [G.R.newShip('galleon', '산타 마리아'), G.R.newShip('fluyt', '희망')]; s0.fleet.crew = Math.max(s0.fleet.crew, Math.min(G.R.crewMax ? G.R.crewMax() : 120, 120)); }   /* 1600년 저장은 작은 배 하나 — 먼 바다를 가는 시험이라 갤리온·플류트로 */ G.Game.go('city', { cityId: s0.loc.city != null ? s0.loc.city : s0.player.home }); await QA.settle(60000); QA.evStart(); return { date: QA.date(), scene: G.Game.sceneName, home: G.CITY_DATA[s0.player.home].name, ships: s0.fleet.ships.map(x => x.type), crew: s0.fleet.crew, from: 'save' }; }
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
        const [plan, pi] = args; const R = G.R, s = G.Game.state; let far = null;
        for (let k = 0; k < plan.length; k++) {
          const nm = plan[(pi + k) % plan.length], c = G.CITY_DATA.find(x => x && x.name === nm);
          if (!c || !c.port || !R.cityExists(c) || c.id === s.loc.city) continue;
          let blk = null; try { blk = G.Scenes.city.entryCheck(c); } catch (e) { blk = null; }
          if (blk) continue;
          const here = G.CITY_DATA[s.loc.city] || { lon: s.loc.lon, lat: s.loc.lat };
          if (G.Geo.dist(here.lon, here.lat, c.lon, c.lat) > 40) { far = { id: c.id, name: nm, skip: k, pi: (pi + k + 1) % plan.length, d: G.Geo.dist(here.lon, here.lat, c.lon, c.lat) }; break; }   /* 한 번에 40°(약 120일) 넘게는 가지 않는다 — 보급 없이 가면 굶는다 */
          return { id: c.id, name: nm, skip: k, pi: (pi + k + 1) % plan.length };
        }
        if (far) { /* 가까운 계획 도시가 없으면 가는 길의 중간 항구(가장 가까운 항구 가운데 목적지 쪽) */
          const here = G.CITY_DATA[s.loc.city] || { lon: s.loc.lon, lat: s.loc.lat }, tgt = G.CITY_DATA[far.id];
          const mid = G.CITY_DATA.filter(c => c && c.port && R.cityExists(c) && c.id !== s.loc.city && G.Geo.dist(here.lon, here.lat, c.lon, c.lat) <= 40 && !(function () { try { return G.Scenes.city.entryCheck(c); } catch (e) { return null; } })())
            .sort((a, b) => G.Geo.dist(a.lon, a.lat, tgt.lon, tgt.lat) - G.Geo.dist(b.lon, b.lat, tgt.lon, tgt.lat))[0];
          if (mid && G.Geo.dist(mid.lon, mid.lat, tgt.lon, tgt.lat) < G.Geo.dist(here.lon, here.lat, tgt.lon, tgt.lat)) return { id: mid.id, name: mid.name + '(경유)', skip: 0, pi: pi };
          return far;
        }
        return null;
      }, [PLAN, pi]);
      if (!dest) { out({ t: 'warn', msg: '갈 곳 없음' }); break; }
      pi = dest.pi;
      const prep = await page.evaluate(() => QA.prep(180));
      const v = await page.evaluate((id) => QA.voyage(id), dest.id);
      leg++; legNow = leg;
      if (v.anomaly) { fs.writeFileSync(path.join(OUT, 'anomaly_leg' + leg + '.json'), JSON.stringify(v.anomaly, null, 0)); v.anomaly = { file: 'anomaly_leg' + leg + '.json', log: v.anomaly.log.slice(-12) }; }
      out({ t: 'voyage', leg, ...v, prep });
      if (/title/.test(v.res || '') && await page.evaluate(() => !!(QA.eraFired && QA.eraFired()))) { out({ t: 'era-in-voyage', leg, era: await page.evaluate(() => QA.eraFired()) }); break; }
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
    fs.writeFileSync(path.join(OUT, 'save_end.json'), await page.evaluate(() => QA.export()));
    if (process.env.ERAEND !== '0') {
      const ee = await page.evaluate(async () => {
        const o = { date0: QA.date(), scene0: G.Game.sceneName };
        G.EraEnd.fast = true; QA.eraWatch = true;
        let seen = false, fin = '';
        const ob = new MutationObserver(() => { if (document.querySelector('.era-end')) seen = true; if (/대항해시대가 막을 내리다/.test(document.body.innerText)) fin = (document.querySelector('.win') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 200); });
        ob.observe(document.body, { childList: true, subtree: true });
        const r = await QA.pass(40);
        for (let i = 0; i < 200 && G.Game.sceneName !== 'title'; i++) { QA.aux(); await QA.clear(10); await QA.sleep(30); }
        ob.disconnect();
        o.pass = r; o.seenOverlay = seen; o.fin = fin; o.scene = G.Game.sceneName; o.dateEnd = QA.date(); o.over = G.EraEnd.over(G.Game.state);
        return o;
      });
      out({ t: 'era-end', ...ee });
    }
    fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(await page.evaluate(() => QA.evDump()), null, 0));
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
