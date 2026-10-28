/* 철포 삼백 자루 (tests/teppo_smoke.js) — node tests/teppo_smoke.js   (BROWSER_EXE=크롬 경로)
   부탁의 조건(1554~1581 · 일본 항구) → 사양 · 두 달 뒤 다시 → 맡는다(기한 2년 · 사카이를 해도에) → 모자라면 알림만
   → 총 300(리스본산) → 사카이 부두: 도키치로 · 노부나가 시험 사격 · 대답 · 값 75,000 · 명물 차통 · 남은 총
   → 뒷이야기(나가시노 · 고른 대답 · 혼노지 · 야마자키 · 천하 통일, 한 번씩) → 혼노지 뒤에는 히데요시가 받는다 → 기한을 넘기면 실패 · 옛 저장 · 소문.
   마지막에 실제 도시 화면에서 노부나가 대화를 한 장 찍는다. 콘솔 오류 0. */
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
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Teppo, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, T = G.Teppo, B = G.BALANCE.teppo;
      await G.Game.ensureGeo(); TT.auto = false;
      const said = [], asks = []; let answer = {}, toasts = [];
      window.__ui = { say: UI.say, ask: UI.ask, alert: UI.alert, confirm: UI.confirm, toast: UI.toast, save: G.State.save };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.ask = async (t, o) => { asks.push(String(t) + ' [' + o.map(x => x.value).join(',') + ']'); for (const k in answer) if (String(t).indexOf(k) >= 0) return answer[k]; return o[0].value; };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); }; UI.confirm = async () => true; UI.toast = t => { toasts.push(String(t)); };
      G.State.save = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const fresh = () => { const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' }); s.settings.res = 0.35; return s; };
      const setDate = (s, y, m, d) => { const nd = { y, m, d }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd; };
      const guns = (s, n, from) => { const cg = s.fleet.cargo.guns || (s.fleet.cargo.guns = { q: 0, cost: 80 }); G.R.addCargoLot(cg, from, n, 80); cg.q += n; };
      const sakai = G.CITY_DATA[192], nagasaki = G.CITY_DATA[191], kyoto = G.CITY_DATA[193], lisbon = G.CITY_DATA[0];
      // ---- 조건
      let s = fresh();
      setDate(s, 1553, 12, 31); out.early = !T.ready(sakai);
      setDate(s, 1582, 1, 1); out.lateY = !T.ready(sakai);
      setDate(s, 1560, 3, 1);
      out.where = T.ready(sakai) && T.ready(nagasaki) && !T.ready(kyoto) && !T.ready(lisbon);
      s.tut = { step: 0, f: {} }; out.tut = !T.ready(sakai); delete s.tut;
      out.rumor0 = G.EVENT_RUMORS.filter(x => x.id === 'teppo')[0].live(s);
      // ---- 사양 → 두 달 뒤 다시
      answer = { '도키치로의 부탁': 'no' };
      await T.arrival(nagasaki);
      out.offerLines = said.slice();
      out.decline = s.teppo && s.teppo.stage === 0 && s.teppo.met === 15600301 && s.teppo.next > s.day;
      said.length = 0; await T.arrival(sakai); out.noRepeat = said.length === 0;
      s.day += 61; out.again = T.ready(sakai);
      // ---- 맡는다
      answer = {}; said.length = 0;
      s.known = (s.known || []).filter(id => id !== 192);
      await T.arrival(nagasaki);
      out.second = said[0] || '';
      out.accept = s.teppo.stage === 1 && T.remain() > 700 && T.remain() <= 731 && s.known.includes(192);
      out.html = T.html().replace(/<[^>]+>/g, ' ');
      out.rumor1 = G.EVENT_RUMORS.filter(x => x.id === 'teppo')[0].live(s);
      // ---- 모자라면 알림만
      guns(s, 100, 0); said.length = 0; toasts = [];
      await T.arrival(sakai);
      out.short = s.teppo.stage === 1 && !s.teppo.end && said.length === 0 && /100\/300/.test(toasts.join('|'));
      // ---- 전한다 (리스본산 320)
      guns(s, 220, 0);
      const gold0 = s.player.gold, tr0 = G.Fame.get ? G.Fame.get('tr') : 0;
      answer = { '말 탄 적이 달려들면': 'volley' }; said.length = 0;
      await T.arrival(sakai);
      out.deliverLines = said.slice();
      out.asks = asks.slice();
      const inv = (s.player.items || s.items || []).map(x => x.id || x);
      out.done = s.teppo.end === 'done' && s.teppo.by === 'nobu' && s.teppo.tactic === 'volley' && s.player.gold - gold0 === 75000 && s.fleet.cargo.guns && s.fleet.cargo.guns.q === 20;
      out.item = JSON.stringify(s.player.items || s.items || null).indexOf('teppo_chaire') >= 0 || JSON.stringify(G.R.storage ? G.R.storage() : []).indexOf('teppo_chaire') >= 0;
      out.lisbon = said.some(t => /리스본 대장간/.test(t)) && said.some(t => /^오다 노부나가: /.test(t)) && said.some(t => /^기노시타 도키치로: /.test(t)) && said.some(t => /이마가와/.test(t));
      out.htmlDone = T.html() === '';
      // ---- 뒷이야기
      setDate(s, 1575, 6, 28); out.n0 = T.daily().length;
      setDate(s, 1575, 6, 29); const bt0 = s.player.fameBy ? JSON.stringify(s.player.fameBy) : s.player.fame;
      const n1 = T.daily(); out.naga = n1.map(x => x.text);
      out.nagaFame = (s.player.fameBy ? JSON.stringify(s.player.fameBy) : s.player.fame) !== bt0;
      out.dup = T.daily().length === 0;
      setDate(s, 1578, 12, 4); out.ships = T.daily().length === 0;   // 「배에 실으라」를 고르지 않았다
      setDate(s, 1582, 6, 21); out.honno = T.daily().map(x => x.text).join('|');
      setDate(s, 1582, 7, 2); out.yama = T.daily().map(x => x.text).join('|');
      setDate(s, 1590, 8, 4); out.unify = T.daily().map(x => x.text).join('|');
      // ---- 혼노지 뒤: 히데요시가 받는다
      s = fresh(); setDate(s, 1581, 6, 1); answer = {}; said.length = 0;
      await T.arrival(sakai);
      setDate(s, 1582, 6, 25); out.honnoLate = T.daily().map(x => x.text).join('|');
      guns(s, 300, 'x'); said.length = 0;
      await T.arrival(sakai);
      out.hide = s.teppo.end === 'done' && s.teppo.by === 'hide' && !s.fleet.cargo.guns && said.some(t => /^하시바 히데요시: .*빗추/.test(t)) && !said.some(t => /^오다 노부나가: /.test(t)) && !said.some(t => /리스본 대장간/.test(t));
      out.gourd = JSON.stringify(s.player.items || s.items || null).indexOf('teppo_gourd') >= 0 || JSON.stringify(G.R.storage ? G.R.storage() : []).indexOf('teppo_gourd') >= 0;
      setDate(s, 1582, 7, 2); out.yamaHide = T.daily().length === 1;
      setDate(s, 1590, 8, 4); out.unifyName = T.hideName() === '도요토미 히데요시' && T.daily().length === 1;
      // ---- 기한을 넘기면
      s = fresh(); setDate(s, 1570, 1, 10); answer = {};
      await T.arrival(sakai);
      const due = s.teppo.due;
      setDate(s, Math.floor(due / 10000), Math.floor(due / 100) % 100, due % 100); s.date = G.U.addDays(s.date, -180); s.day -= 180;
      out.remind = T.daily().some(x => /반년/.test(x.text));
      s.date = G.U.addDays(s.date, 181); s.day += 181;
      const f1 = T.daily(); out.fail = s.teppo.end === 'failed' && f1.some(x => /기한이 지났다/.test(x.text));
      guns(s, 300, 0); said.length = 0; await T.arrival(sakai); out.failNoDeliver = said.length === 0 && s.fleet.cargo.guns.q === 300;
      setDate(s, 1575, 6, 29); out.failNews = T.daily().length === 0;   // 전하지 않았으면 나가시노 소식은 없다
      setDate(s, 1582, 6, 21); out.failHonno = T.daily().length === 1; // 만난 사람에게는 혼노지 소식
      // ---- 옛 저장
      s = fresh(); delete s.teppo; setDate(s, 1590, 8, 4); out.old = T.daily().length === 0 && T.html() === '' && !s.teppo;
      return out;
    });
    console.log('  부탁:', r.offerLines.slice(0, 3).join('\n        '));
    console.log('  다시:', r.second);
    console.log('  수첩:', r.html.replace(/\s+/g, ' '));
    console.log('  묻기:', r.asks.join(' / '));
    console.log('  나가시노:', r.naga.join('\n          '));
    ok(r.early && r.lateY, '1554년 전·1582년부터는 부탁이 오지 않는다');
    ok(r.where && r.tut, '일본의 항구(사카이·나가사키)에서만 — 교토(뭍)·리스본·튜토리얼에서는 없다');
    ok(r.rumor0 && !r.rumor1, '소문은 맡기 전에만 돈다');
    ok(r.offerLines.some(t => /도요토미 히데요시/.test(t)) && r.offerLines.some(t => /^기노시타 도키치로: .*17년 전, 남쪽 다네가시마/.test(t)) && r.offerLines.some(t => /75,000/.test(t)), '첫 부탁: 도키치로(훗날의 도요토미 히데요시) · 다네가시마 이야기 · 값 75,000');
    ok(r.decline && r.noRepeat && r.again, '사양하면 두 달 동안 다시 묻지 않는다');
    ok(/또 뵙습니다/.test(r.second) && r.accept, '두 번째 부탁을 맡는다 — 기한 2년 · 사카이를 해도에');
    ok(/총 0\/300/.test(r.html) && /사카이/.test(r.html), '수첩에 「총 0/300 · 사카이」');
    ok(r.short, '총이 모자라면 사카이에서 알림만 (100/300)');
    ok(r.done && r.item && r.htmlDone, '총 300을 전한다 — 금화 75,000 · 명물 차통 · 남은 총 20 · 수첩에서 빠진다');
    ok(r.lisbon, '도키치로가 세고 노부나가가 시험 사격 · 리스본산 낙인 · 1560년의 한마디(이마가와)');
    ok(r.n0 === 0 && r.naga.length === 2 && /나가시노/.test(r.naga[0]) && /번갈아/.test(r.naga[1]) && r.nagaFame && r.dup, '나가시노 소식 + 고른 대답(번갈아 쏘기) · 전투 명성 · 한 번만');
    ok(r.ships && /혼노지/.test(r.honno) && /야마자키/.test(r.yama) && /도요토미 히데요시가 마침내/.test(r.unify), '고르지 않은 대답의 소식은 없다 · 혼노지 · 야마자키 · 천하 통일');
    ok(/혼노지/.test(r.honnoLate) && r.hide && r.gourd, '혼노지 뒤에 가져가면 하시바 히데요시가 받는다 — 금 표주박');
    ok(r.yamaHide && r.unifyName, '히데요시에게 전한 사람에게도 야마자키·천하 통일 소식 · 이름이 도요토미로');
    ok(r.remind && r.fail && r.failNoDeliver, '기한 반년 전 알림 → 넘기면 실패 · 그 뒤로는 받지 않는다');
    ok(r.failNews && r.failHonno, '전하지 않았으면 나가시노 소식은 없고, 만난 적이 있으면 혼노지 소식은 온다');
    ok(r.old, '옛 저장(state.teppo 없음)은 그대로');

    // ---- 실제 도시 화면: 사카이에 들어서면 노부나가와의 대화가 뜬다
    const shot = await page.evaluate(async () => {
      const k = window.__ui; Object.assign(G.UI, { say: k.say, ask: k.ask, alert: k.alert, confirm: k.confirm, toast: k.toast }); G.State.save = k.save;
      TT.auto = true;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.settings.autosave = false;
      const nd = { y: 1568, m: 5, d: 1 }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd;
      s.teppo = { stage: 1, met: 15660101, taken: 15670501, due: 15690501, seen: {} };
      const cg = s.fleet.cargo.guns = { q: 0, cost: 80 }; G.R.addCargoLot(cg, 0, 300, 80); cg.q = 300;
      s.loc = { mode: 'city', city: 192, lon: 135.48, lat: 34.58 };
      G.Game.go('city', { cityId: 192 });
      await new Promise(r => setTimeout(r, 2500));
      window.__tp = G.Teppo.arrival(G.CITY_DATA[192]);
      return G.Game.sceneName;
    });
    // 대화를 넘기며 노부나가의 시험 사격 장면까지 간다
    let seen = '';
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      seen = await page.evaluate(() => document.getElementById('ui').innerText);
      if (/오다 노부나가/.test(seen) && /하하하/.test(seen)) break;
      await page.keyboard.press('Space').catch(() => {});
    }
    await page.screenshot({ path: path.join(require('os').tmpdir(), 'teppo_nobunaga.png') });
    console.log('  화면 대화:', seen.replace(/\s+/g, ' ').slice(0, 160));
    ok(shot === 'city' && /오다 노부나가/.test(seen), '실제 도시 화면 — 사카이 부두에서 노부나가의 대화 (임시 폴더 teppo_nobunaga.png)');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.slice(0, 3).join(' / ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗', e.message); process.exit(1); });
