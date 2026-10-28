/* 하늘을 재는 사람들 — 나침반과 망원경 (tests/sky_smoke.js) — node tests/sky_smoke.js   (BROWSER_EXE=크롬 경로)
   ① 코페르니쿠스: 때 · 사양 → 두 달 · 뉘른베르크(머리말 맞섬) · 첫 책이 온다 · 임종의 책 · 늦으면 기제 주교 · 기한 실패 · 죽음 소식
   ② 케플러: 초판을 알아본다 · 네 바다 가운데 셋(나침반이 없으면 못 잼) · 타원 · 편차 나침반 · 『새 천문학』·머리말의 주인·금서·세 번째 법칙·루돌프 표(물건)·죽음 · 동료로 타 있으면 어디서나
   ③ 갈릴레이: 종탑 · 목성의 달(1610.1.7부터) · 갈릴레이의 망원경(발견 거리 ×1.5) · 먼 바다의 시험 · 알림
   ④ 『대화』 · 로마의 재판(증언) · 맹세 소식은 본 사람에게 다시 오지 않음 · 베니스의 원고 → 암스테르담 · 죽음 · 뉴턴 · 재판을 놓치면 소식
   옛 저장 · 마지막에 베니스 화면에서 갈릴레이 대화 한 장. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => {
    const TT = window.TT = { raf: [], auto: true, n: 0 };
    window.requestAnimationFrame = cb => { TT.raf.push(cb); return ++TT.n; };
    TT.pump = () => { const q = TT.raf; TT.raf = []; q.forEach(cb => { try { cb(performance.now()); } catch (e) { console.error(e); } }); };
    setInterval(() => { if (TT.auto) TT.pump(); }, 16);
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Sky, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, SK = G.Sky, B = G.BALANCE.sky, C = G.CITY_DATA;
      await G.Game.ensureGeo(); TT.auto = false;
      const said = [], asks = []; let answer = {}, toasts = [];
      window.__ui = { say: UI.say, ask: UI.ask, alert: UI.alert, confirm: UI.confirm, toast: UI.toast, save: G.State.save };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.ask = async (t, o) => { asks.push(String(t) + ' [' + o.map(x => x.value).join(',') + ']'); for (const k in answer) if (String(t).indexOf(k) >= 0) return answer[k]; return o[0].value; };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); }; UI.confirm = async () => true; UI.toast = t => { toasts.push(String(t)); };
      G.State.save = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const fresh = () => { const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' }); s.settings.res = 0.35; s.player.gold = 50000; return s; };
      const setDate = (s, y, m, d) => { const nd = { y, m, d }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd; };
      const items = s => JSON.stringify(s.player.items || []) + JSON.stringify(G.R.storage ? G.R.storage() : []);
      const atSea = (s, lat, lon, days) => { s.loc = { mode: 'sea', lon, lat, heading: 0 }; s.fleet.daysOut = days || 1; };
      const dz = C[B.danzig], nu = C[B.nuremberg], pr = C[B.prague], ve = C[B.venice], fl = C[B.florence], ro = C[B.rome], am = C[B.amsterdam], lis = C[0];
      // ================= ① 코페르니쿠스
      let s = fresh();
      setDate(s, 1539, 5, 31); said.length = 0; await SK.arrival(dz); out.copEarly = said.length === 0 && !s.sky;
      setDate(s, 1539, 6, 10);
      out.rumor = G.EVENT_RUMORS.filter(x => x.id === 'sky_cop')[0].live(s);
      answer = { '코페르니쿠스의 원고': 'no' }; said.length = 0; await SK.arrival(dz);
      out.copLines = said.slice(); out.copDecline = s.sky.cop === 0 && s.sky.next.cop > s.day;
      said.length = 0; await SK.arrival(dz); out.copNoRepeat = said.length === 0;
      setDate(s, 1539, 8, 20); answer = {}; said.length = 0; await SK.arrival(dz);
      out.copAccept = s.sky.cop === 1 && /아직 서랍/.test(said[0] || '') && s.sky.due.cop === 15400819;
      out.html1 = SK.html().replace(/<[^>]+>/g, ' ');
      setDate(s, 1540, 8, 18); const rdy = G.U.dateNum(G.U.addDays(s.date, 240)); answer = { '오시안더': 'protest' }; said.length = 0; await SK.arrival(nu);
      out.nur = s.sky.cop === 2 && s.sky.pref === 'protest' && s.sky.ready === rdy && rdy === 15410415 && said.some(t => /^안드레아스 오시안더: .*가설일 뿐/.test(t));
      setDate(s, 1541, 4, 14); out.notYet = SK.daily().length === 0 && s.sky.cop === 2;
      setDate(s, 1541, 4, 15); const bc = SK.daily(); out.bookCome = s.sky.cop === 3 && bc.length === 1 && /첫 책이다/.test(bc[0].text) && !bc[0].history;
      setDate(s, 1543, 5, 1); const g0 = s.player.gold; said.length = 0; await SK.arrival(dz);
      out.deathbed = s.sky.cop === 'done' && s.player.gold - g0 === 4000 && items(s).indexOf('sky_derev') >= 0 && said.some(t => /나왔구려/.test(t)) && said.some(t => /가설이라/.test(t));
      setDate(s, 1543, 5, 24); out.copDeath = SK.daily().map(x => x.text).join('|');
      // 늦으면 · 기한
      s = fresh(); s.sky = { cop: 3, kep: 0, gal: 0, trial: 0, ms: 0, due: { cop: 15450101 }, next: {}, seen: {}, reads: {} }; setDate(s, 1543, 6, 1); const g1 = s.player.gold; said.length = 0;
      await SK.arrival(dz); out.copLate = s.sky.cop === 'late' && s.player.gold === g1 && said.some(t => /^티데만 기제 주교: /.test(t)) && items(s).indexOf('sky_derev') >= 0;
      s = fresh(); setDate(s, 1540, 1, 1); answer = {}; await SK.arrival(dz); setDate(s, 1541, 1, 2); const f1 = SK.daily(); out.copFail = s.sky.cop === 'failed' && /레티쿠스가 직접/.test(f1.map(x => x.text).join('|'));
      // ================= ② 케플러와 나침반
      s = fresh(); setDate(s, 1600, 3, 1); G.R.addItem('sky_derev'); answer = {}; said.length = 0;
      s.sky = { cop: 'done', copDone: 15430501, pref: 'protest', kep: 0, gal: 0, trial: 0, ms: 0, due: {}, next: {}, seen: { 0: 1 }, reads: {} };
      await SK.arrival(pr);
      out.kepLines = said.slice();
      out.kepAccept = s.sky.kep === 1 && said.some(t => /^요하네스 케플러: .*8분/.test(t)) && said.some(t => /초판입니까/.test(t));
      atSea(s, -35.5, 20.5); out.agPending = SK.seaPending(); toasts = []; await SK.atSea();
      out.read1 = SK.reads() === 1 && !SK.seaPending() && /아굴랴스 곶 앞바다에서 나침반을 재었다.*\(1\/3\)/.test(toasts.join('|'));
      s.player.items = s.player.items.filter(x => x.id !== 'compass' && x.id !== 'sky_kcompass'); atSea(s, 38.0, -31.0); toasts = []; await SK.atSea();
      out.noCompass = SK.reads() === 1 && /나침반이 없어/.test(toasts.join('|'));
      G.R.addItem('compass'); s.day += 1; await SK.atSea(); atSea(s, 15.2, 71.0); toasts = []; await SK.atSea();
      out.read3 = SK.reads() === 3 && /프라하의 케플러에게/.test(toasts.join('|'));
      out.html2 = SK.html().replace(/<[^>]+>/g, ' ');
      setDate(s, 1602, 1, 1); said.length = 0; await SK.arrival(pr);
      out.kepDone = s.sky.kep === 'done' && items(s).indexOf('sky_kcompass') >= 0 && said.some(t => /타원입니다/.test(t));
      const nk = [];
      for (const d of [[1609, 9, 1], [1616, 3, 5], [1618, 5, 15], [1627, 9, 15], [1630, 11, 15]]) { setDate(s, d[0], d[1], d[2]); nk.push(SK.daily().length); }
      out.kepNews = nk.join(','); out.tables = items(s).indexOf('sky_rudolph') >= 0;
      // 동료로 타 있으면 어디서나
      s = fresh(); setDate(s, 1601, 1, 1); s.mates.push({ id: 'kepler', role: 'none', loyal: 80 }); said.length = 0; await SK.arrival(lis);
      out.kepAboard = s.sky && s.sky.kep === 1;
      // ================= ③ 갈릴레이
      s = fresh(); setDate(s, 1609, 8, 21); s.player.items.push({ id: 'telescope' });
      const r0 = G.Explore.seaRange(); said.length = 0; answer = {};
      await SK.arrival(ve);
      out.galLines = said.slice();
      out.galAccept = s.sky.gal === 1 && items(s).indexOf('sky_gscope') >= 0 && said.some(t => /^갈릴레오 갈릴레이: .*두 시간이나 먼저/.test(t)) && said.some(t => /겨울이 오면 목성/.test(t)) && !said.some(t => /메디치의 별/.test(t));
      out.scope = Math.abs(G.Explore.seaRange() - r0 - 0.7) < 0.01;
      atSea(s, 40, -20, 3); out.test3 = !SK.seaPending();
      atSea(s, 40, -20, 4); answer = { '흔들리는 갑판': 'calm' }; said.length = 0; await SK.atSea();
      out.test = s.sky.gal === 2 && s.sky.test === 'calm' && said.some(t => /스무 배로 흔들렸다/.test(t));
      out.html3 = SK.html().replace(/<[^>]+>/g, ' ');
      setDate(s, 1610, 6, 1); said.length = 0; await SK.arrival(ve);
      out.galDone = s.sky.gal === 'done' && said.some(t => /투구 망원경/.test(t));
      // 목성의 달 · 피렌체는 1610.9부터
      let s2 = fresh(); setDate(s2, 1610, 2, 1); said.length = 0; await SK.arrival(fl); out.flEarly = said.length === 0;
      await SK.arrival(ve); out.moons = said.some(t => /메디치의 별/.test(t));
      G.Game.state = s;
      // ================= ④ 재판 · 원고
      setDate(s, 1632, 2, 21); out.dialogo = SK.daily().map(x => x.text).join('|');
      setDate(s, 1633, 4, 11); said.length = 0; await SK.arrival(ro); out.trialEarly = said.length === 0;
      setDate(s, 1633, 5, 1); answer = { '할 말이 있으면': 'testify' }; said.length = 0; await SK.arrival(ro);
      out.trial = s.sky.trial === 'seen' && s.sky.testify === 'testify' && said.some(t => /그래도, 돈다/.test(t));
      setDate(s, 1633, 6, 22); out.noAbjNews = SK.daily().length === 0;
      setDate(s, 1636, 2, 1); answer = {}; said.length = 0; await SK.arrival(ve);
      out.msOffer = s.sky.ms === 1 && said.some(t => /^풀젠치오 미칸치오 수사: /.test(t));
      said.length = 0; await SK.arrival(am);
      out.msDone = s.sky.ms === 'done' && items(s).indexOf('sky_twosci') >= 0 && said.some(t => /^로데베이크 엘제비르: /.test(t));
      const ng = [];
      for (const d of [[1638, 7, 15], [1642, 1, 8], [1643, 1, 4]]) { setDate(s, d[0], d[1], d[2]); ng.push(SK.daily().length); }
      out.galNews = ng.join(',');
      // 재판을 놓치면 소식 · 원고를 나르지 않으면 책 소식
      s = fresh(); s.sky = { cop: 0, kep: 0, gal: 'done', galDone: 16100601, trial: 0, ms: 0, due: {}, next: {}, seen: {}, reads: {} };
      setDate(s, 1633, 6, 22); out.missTrial = /무릎을 꿇었다/.test(SK.daily().map(x => x.text).join('|'));
      setDate(s, 1638, 7, 15); out.missMs = /레이던/.test(SK.daily().map(x => x.text).join('|'));
      // 옛 저장
      s = fresh(); delete s.sky; setDate(s, 1640, 1, 1); out.old = SK.daily().length === 0 && SK.html() === '' && !s.sky;
      return out;
    });
    console.log('  코페르니쿠스:', r.copLines[4]);
    console.log('  수첩:', r.html1.replace(/\s+/g, ' '), '\n        ', r.html2.replace(/\s+/g, ' '), '\n        ', r.html3.replace(/\s+/g, ' '));
    console.log('  케플러 소식 수:', r.kepNews, '· 갈릴레이 소식 수:', r.galNews);
    ok(r.copEarly && r.rumor, '1539.6 전에는 없다 · 단치히 소문');
    ok(r.copLines.some(t => /^레티쿠스: /.test(t)) && r.copLines.some(t => /나침반 바늘/.test(t)) && r.copDecline && r.copNoRepeat, '단치히: 레티쿠스·코페르니쿠스(나침반 이야기) · 사양하면 두 달 동안 없다');
    ok(r.copAccept && /뉘른베르크/.test(r.html1), '다시 찾아 맡는다 — 기한 1년 · 수첩');
    ok(r.nur, '뉘른베르크: 오시안더의 「가설일 뿐」 머리말에 맞선다 · 240일 뒤 첫 책');
    ok(r.notYet && r.bookCome, '다 찍히면 첫 책이 제독에게 온다');
    ok(r.deathbed, '단치히: 임종의 코페르니쿠스가 첫 책을 받는다 · 머리말 이야기 · 초판·금화 4,000');
    ok(/세상을 떠났다/.test(r.copDeath), '1543.5.24 코페르니쿠스의 죽음 소식');
    ok(r.copLate && r.copFail, '죽은 뒤에 닿으면 기제 주교가 받는다(금화 없음) · 원고 기한 실패');
    ok(r.kepAccept, '프라하: 케플러의 8분 · 초판을 알아본다 · 맡는다');
    ok(r.agPending && r.read1, '아굴랴스 곶에서 나침반을 잰다 (1/3) · 같은 바다는 한 번');
    ok(r.noCompass && r.read3 && /✔ 아조레스/.test(r.html2) && /3\/3/.test(r.html2), '나침반이 없으면 못 잰다 · 세 바다를 채운다 · 수첩 ✔');
    ok(r.kepDone, '프라하: 타원 — 케플러의 편차 나침반');
    ok(r.kepNews === '2,1,1,1,1' && r.tables, '『새 천문학』+머리말의 주인 · 금서 · 세 번째 법칙 · 루돌프 표(물건) · 케플러의 죽음');
    ok(r.kepAboard, '케플러가 동료로 타 있으면 리스본에서도 부탁한다');
    ok(r.galAccept, '베니스 1609.8: 종탑에서 제독의 배를 두 시간 먼저 · 달의 산 · (아직 목성의 달 없음) · 갈릴레이의 망원경');
    ok(r.scope, '갈릴레이의 망원경은 보통 망원경보다 바다 발견 거리 +0.7° (1.4 × 1.5)');
    ok(r.test3 && r.test && /갈릴레이에게 알린다/.test(r.html3), '항구를 떠나 4일째 밤 시험 — 흔들리는 갑판 · 잔잔한 밤');
    ok(r.galDone, '베니스에서 알린다 — 투구 망원경 이야기');
    ok(r.flEarly && r.moons, '1610.9 전 피렌체에는 없다 · 1610.2에는 목성의 달(메디치의 별)');
    ok(/두 우주 체계/.test(r.dialogo) && r.trialEarly && r.trial && r.noAbjNews, '『대화』 소식 · 1633.4.12부터 로마의 재판 — 증언 · 「그래도, 돈다」 · 본 사람에게 맹세 소식 없음');
    ok(r.msOffer && r.msDone, '1636 베니스의 미칸치오 수사 → 암스테르담의 엘제비르 · 『새로운 두 과학』');
    ok(r.galNews === '0,1,1', '원고를 나른 사람에게 책 소식 없음 · 갈릴레이의 죽음 · 뉴턴');
    ok(r.missTrial && r.missMs, '재판·원고를 놓친 사람에게는 소식으로');
    ok(r.old, '옛 저장(state.sky 없음)은 그대로');

    // ---- 실제 화면: 베니스에서 갈릴레이
    const shot = await page.evaluate(async () => {
      const k = window.__ui; Object.assign(G.UI, { say: k.say, ask: k.ask, alert: k.alert, confirm: k.confirm, toast: k.toast }); G.State.save = k.save;
      TT.auto = true;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.settings.autosave = false;
      const nd = { y: 1610, m: 2, d: 1 }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd;
      s.loc = { mode: 'city', city: 29, lon: 12.35, lat: 45.48 };
      G.Game.go('city', { cityId: 29 });
      await new Promise(r => setTimeout(r, 2500));
      window.__sp = G.Sky.arrival(G.CITY_DATA[29]);
      return G.Game.sceneName;
    });
    let seen = '';
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      seen = await page.evaluate(() => document.getElementById('ui').innerText);
      if (/목성입니다/.test(seen)) break;
      await page.keyboard.press('Space').catch(() => {});
    }
    await page.screenshot({ path: path.join(require('os').tmpdir(), 'sky_galileo.png') });
    ok(shot === 'city' && /목성입니다/.test(seen), '실제 도시 화면 — 베니스에서 갈릴레이의 목성 (임시 폴더 sky_galileo.png)');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.slice(0, 3).join(' / ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗', e.message); process.exit(1); });
