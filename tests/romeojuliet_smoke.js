/* 로미오와 줄리엣 (2026-10-31) — 거리 싸움 · 머큐시오의 죽음 · 티볼트를 살린다 · 잠의 약 · 성배 문제 · 무덤 · 동료 · 소식
   node tests/romeojuliet_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const RJ = G.Romeo, out = {}, said = [], asks = [], toasts = [];
      let picks = [];
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value === want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = (t) => { toasts.push(t); };
      function fresh(y, m, d, city, sk, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, sk || {});
        G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: [3, 3, 3, 3], diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = (o && o.gold != null) ? o.gold : 5000;
        const c = G.CITY_DATA[city]; s.loc = { mode: 'city', city, lon: c.lon, lat: c.lat }; s.fleet.cargo = (o && o.cargo) || {};
        said.length = 0; asks.length = 0; toasts.length = 0; delete s.romeo; return s;
      }
      const has = id => G.Game.state.mates.some(m => m.id === id);
      const Ro = G.MATE.romeo, Ju = G.MATE.juliet;
      out.data = { ro: Ro.sk, ju: Ju.sk, ev: Ro.eventOnly && Ju.eventOnly, figs: ['rj_mercutio', 'rj_tybalt', 'rj_laurence', 'rj_escalus', 'rj_balthasar'].every(id => G.HIST_FIG[id]), item: !!G.ITEM.lead_grail, adult: /열여덟/.test(Ju.desc) };
      out.puzzle = RJ.CUPS.map(c => c.id + ':' + RJ.truths(c.id));
      // 다른 도시·기간 밖에는 없다
      out.lisbon = (fresh(1520, 5, 1, 0), RJ.pending());
      out.late = (fresh(1591, 5, 1, 29), RJ.pending());
      // 1부 — 베니스: 거리 싸움 · 머큐시오 · 의학으로 티볼트를 살린다
      let s = fresh(1520, 5, 1, 29, { med: 2, sword: 2 }); picks = ['stop', 'med'];
      out.p1Pend = RJ.pending(); await RJ.check();
      out.p1 = { p1: !!s.romeo.p1, tybalt: s.romeo.tybalt, escalus: said.some(t => t.startsWith('영주 에스칼루스|')), lovers: said.some(t => t.startsWith('로미오|')) && said.some(t => t.startsWith('줄리엣|') && /장미/.test(t)),
        mercutio: said.some(t => t.startsWith('머큐시오|') && /두 집안 모두/.test(t)), tybaltLives: said.some(t => t.startsWith('티볼트|') && /빚/.test(t)), opts: asks[1].o, html: RJ.html().replace(/<[^>]+>/g, ' ') };
      out.p2Early = RJ.pending();
      // 2부 — 나흘 뒤 밀라노: 잠의 약 · 성배 — 한 번 틀리고 납잔
      s.date = G.U.addDays(s.date, 4); s.loc = { mode: 'city', city: 26, lon: G.CITY_DATA[26].lon, lat: G.CITY_DATA[26].lat }; picks = ['silver', 'lead']; said.length = 0; asks.length = 0;
      out.p2Pend = RJ.pending(); await RJ.check();
      out.p2 = { grail: s.romeo.grail, tries: s.romeo.tries, romeo: has('romeo'), juliet: has('juliet'), item: s.player.items.some(x => x.id === 'lead_grail'), hint: said.some(t => t.startsWith('로미오|') && /참이 둘/.test(t)), lostAntidote: said.some(t => /역병/.test(t) && /깨졌/.test(t)), wake: said.some(t => t.startsWith('줄리엣|') && /로미오\?/.test(t)), cupsShown: asks[0].o.length === 4, after: RJ.pending(),
        sk: { sword: G.R.skillBest('sword').lv, gun: G.R.skillBest('gun').lv, art: G.R.skillBest('art').lv, theo: G.R.skillBest('theo').lv } };
      // 1부 — 의원·약재·돈이 없으면 맨손으로 · 2부 — 세 번 다 틀리면 로렌스 수사가 (줄리엣이 지친다)
      s = fresh(1550, 3, 1, 29, {}, { gold: 0 }); picks = ['look', 'herbs']; await RJ.check();
      out.hand = { tybalt: s.romeo.tybalt, opts: asks[1].o };
      s.date = G.U.addDays(s.date, 5); picks = ['gold', 'silver', 'wood']; await RJ.check();
      const jr = s.mates.find(m => m.id === 'juliet');
      out.friar = { grail: s.romeo.grail, tries: s.romeo.tries, both: has('romeo') && has('juliet'), loyal: jr && jr.loyal };
      // 소식 — 반델로 · 브룩 · 셰익스피어(동료면 둘이 웃는다)
      s.date = { y: 1554, m: 5, d: 25 }; const news = [];
      for (let i = 0; i < 16000 && s.date.y < 1598; i++) { s.date = G.U.addDays(s.date, 1); RJ.daily().forEach(x => news.push(x.text)); }
      out.news = news.map(t => (t.match(/【([^】]+)】/) || [])[1]); out.laugh = news.some(t => /한참을 웃었다/.test(t)); out.tyb = news.some(t => /티볼트가 살아났다/.test(t));
      // 옛 저장(1600): 지난 소식은 몰아서 없음
      s = fresh(1600, 1, 1, 29); RJ.daily(); s.romeo.met = 1; out.old = RJ.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(JSON.stringify(r.data.ro) === JSON.stringify({ sword: 3, shoot: 3, gun: 3, speech: 3, acct: 2, sci: 2 }) && JSON.stringify(r.data.ju) === JSON.stringify({ craft: 2, art: 2, theo: 2, speech: 2 }) && r.data.ev && r.data.figs && r.data.item && r.data.adult, '로미오 검술·사격·포술·웅변 3 · 회계·과학 2 / 줄리엣 세공·그림·신학·웅변 2 (성인) · 사건으로만');
    ok(r.puzzle.join() === 'gold:2,silver:3,lead:1,wood:2', '성배 문제: 참이 하나뿐인 잔은 납잔 하나 (' + r.puzzle.join(' ') + ')');
    ok(r.lisbon === false && r.late === false, '베니스·밀라노 밖, 1590년 뒤에는 없다');
    ok(r.p1Pend && r.p1.p1 && r.p1.escalus && r.p1.lovers && r.p1.mercutio && r.p1.tybaltLives && r.p1.tybalt === 'med' && r.p1.opts[0] === 'med', '1부: 거리 싸움 · 안타깝게 바라보는 두 연인 · 머큐시오의 죽음 · 의학으로 티볼트를 살린다');
    ok(!r.p2Early && /베니스나 밀라노/.test(r.p1.html), '2부는 나흘 뒤부터 — 수첩에 안내');
    ok(r.p2Pend && r.p2.lostAntidote && r.p2.cupsShown && r.p2.hint && r.p2.grail === 'solved' && r.p2.tries === 2 && r.p2.wake && r.p2.romeo && r.p2.juliet && r.p2.item && !r.p2.after, '2부: 해독제를 잃었다 → 성배 문제(한 번 틀리면 로미오의 실마리) → 납잔 → 줄리엣이 깨어나 둘이 동료로');
    ok(r.p2.sk.sword === 3 && r.p2.sk.gun === 3 && r.p2.sk.art === 2 && r.p2.sk.theo === 2, '동료가 되면 검술·포술 3, 그림·신학 2가 배에 더해진다');
    ok(r.hand.tybalt === 'hand' && r.hand.opts.includes('herbs!') && r.hand.opts.includes('doctor!'), '약재·돈이 없으면 맨손으로 상처를 눌러 살린다');
    ok(r.friar.grail === 'friar' && r.friar.tries === 3 && r.friar.both && r.friar.loyal < 80, '세 번 다 틀려도 로렌스 수사가 마지막에 — 둘은 동료가 되지만 줄리엣이 지쳤다');
    ok(r.news.includes('반델로의 이야기') && r.news.includes('로메우스와 줄리엣') && r.news.includes('셰익스피어의 비극') && r.laugh && r.tyb, '소식: 반델로 · 브룩 · 셰익스피어 — 「배에서 둘이 한참을 웃었다」');
    ok(r.old === 0, '옛 저장은 지난 소식을 몰아서 알리지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
