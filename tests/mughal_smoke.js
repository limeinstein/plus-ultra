/* 무굴 제국의 성립 (2026-10-28) — 디우의 포술장 · 카불의 정원 · 델리의 술탄 · 파니파트 · 새 황제 · 소식
   node tests/mughal_smoke.js */
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
      const out = {}, said = [], battles = [], toasts = [];
      let pick = 'sell', fightRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { const o = opts.find(x => x.value === pick && !x.dis) || opts.filter(x => !x.dis).slice(-1)[0]; return o ? o.value : null; };
      G.UI.toast = (t) => { toasts.push(t); };
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, o }); return fightRes; };
      const MG = G.Mughal;
      function fresh(y, m, d, city, cargo) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.gold = 1000;
        const c = G.CITY_DATA[city]; s.loc = { mode: 'city', city, lon: c.lon, lat: c.lat };
        s.fleet.cargo = cargo || {};
        said.length = 0; battles.length = 0; toasts.length = 0; delete s.mughal;
        return s;
      }
      const lot = q => ({ q, cost: 50, d: 0, lots: { 0: { q, cost: 50 } } });
      out.gunP = G.GOOD.guns.p; out.figs = ['babur', 'humayun', 'aliquli', 'ibrahim'].every(id => G.HIST_FIG[id]); out.item = !!G.ITEM.babur_page;
      // ① 디우 — 총 15정을 알리 쿨리에게
      let s = fresh(1525, 6, 1, 148, { guns: lot(15) });
      out.diuPend = MG.pending(); await MG.check();
      out.diu = { side: s.mughal.side, gold: s.player.gold, guns: s.fleet.cargo.guns ? s.fleet.cargo.guns.q : 0, said: said.some(t => /알리 쿨리/.test(t)) };
      out.task = G.Mughal.html().replace(/<[^>]+>/g, ' ');
      // 디우 — 총이 없으면 한 번만 이야기하고 끝
      s = fresh(1522, 3, 1, 148, {}); await MG.check();
      out.diuNoArms = { side: s.mughal.side || null, again: MG.pending(), toast: toasts.some(t => /총 10정 또는 대포 3문/.test(t)) };
      out.tooEarly = (fresh(1515, 1, 1, 148, { guns: lot(20) }), MG.pending());
      // ① 카불 — 바부르를 직접 만나 대포를 판다
      s = fresh(1524, 5, 1, 136, { cannon: lot(4) });
      out.kabulPend = MG.pending(); await MG.check();
      out.kabul = { side: s.mughal.side, cannon: s.fleet.cargo.cannon ? 1 : 0, babur: said.some(t => /^바부르\|/.test(t) && /멜론/.test(t)), hint: !!(G.Disc.hints && G.Disc.hints('baburnama')) || true };
      // ② 델리의 술탄 — 총을 팔면 로디 편
      s = fresh(1520, 2, 1, 145, { guns: lot(12) });
      await MG.check();
      out.court = { side: s.mughal.side, ibrahim: said.some(t => /^이브라힘 로디\|/.test(t)) };
      // ③ 파니파트 — 바부르 편
      s = fresh(1526, 4, 1, 145, {}); s.mughal = { side: 'babur', sold: 'ali', met: 1, told: {} }; const g0 = s.player.gold;
      out.batPend = MG.pending(); fightRes = 'win'; await MG.check();
      out.bat = { res: s.mughal.panipat, gold: s.player.gold - g0, b: battles[0] && { name: battles[0].name, n: battles[0].n, guns: battles[0].o.guns, kind: battles[0].o.kind, leader: battles[0].o.leader } };
      // 이어서 새 황제
      s.date = { y: 1526, m: 5, d: 2 };
      const t0 = G.Sponsor.rel('in_delhi').trust;
      out.crownPend = MG.pending(); await MG.check();
      out.crown = { done: s.mughal.crown, page: s.player.items.some(x => x.id === 'babur_page'), trust: G.Sponsor.rel('in_delhi').trust - t0, humayun: said.some(t => /^후마윤\|/.test(t) && /금강석/.test(t)) };
      // ③ 파니파트 — 로디 편: 퇴각 판, 코끼리 없는 바부르의 군대
      s = fresh(1526, 4, 10, 145, {}); s.mughal = { side: 'lodi', sold: 'lodi', met: 1, told: {} };
      battles.length = 0; await MG.check();
      out.lodiBat = { res: s.mughal.panipat, o: battles[0] && battles[0].o };
      // 파니파트를 놓쳤다
      s = fresh(1526, 6, 1, 145, {}); s.mughal = { side: 'babur', met: 1, told: {} };
      out.missPend = MG.pending(); out.missed = s.mughal.panipat; await MG.check(); out.missCrown = s.mughal.crown;
      // 소식 (만난 사람만) — 1526.12 독, 1527.3 칸와
      s = fresh(1526, 12, 20, 0, {}); s.mughal = { side: 'babur', met: 1, panipat: 'win', told: {} };
      const news = []; for (let i = 0; i < 100; i++) { G.Game.state.date = G.U.addDays(G.Game.state.date, 1); MG.daily().forEach(x => news.push(x.text)); }
      out.news = news.map(t => (t.match(/【([^】]+)】/) || [])[1]);
      // 옛 저장(1560년)이면 지난 소식은 알리지 않는다
      s = fresh(1560, 1, 1, 0, {}); s.mughal = undefined; MG.daily(); s.mughal.met = 1; out.oldNews = MG.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify({ diu: r.diu, bat: r.bat, crown: r.crown }));
    ok(r.figs && r.item, '인물 넷(바부르·후마윤·알리 쿨리·이브라힘 로디) · 기념품 「바부르의 회고록 한 장」');
    ok(r.diuPend && r.diu.side === 'babur' && r.diu.guns === 0 && r.diu.gold === 1000 + Math.round(15 * r.gunP * 2.5) && r.diu.said, '디우: 알리 쿨리에게 총 15정을 시세 2.5배에 팔면 바부르의 벗');
    ok(/1526년 3월~4월 21일, 델리로/.test(r.task), '수첩 「할 일」에 파니파트 — ' + r.task.trim().slice(0, 60));
    ok(r.diuNoArms.side === null && r.diuNoArms.toast && !r.diuNoArms.again, '총포가 모자라면 조건만 알리고, 다시 들러도 되풀이하지 않는다');
    ok(r.tooEarly === false, '1519년 전에는 디우에 포술장이 없다');
    ok(r.kabulPend && r.kabul.side === 'babur' && !r.kabul.cannon && r.kabul.babur, '카불: 바부르를 만나(멜론·정원) 대포 4문을 판다 → 바부르의 벗');
    ok(r.court.side === 'lodi' && r.court.ibrahim, '델리: 술탄 이브라힘 로디에게 총을 팔면 로디 편');
    ok(r.batPend && r.bat.res === 'win' && r.bat.gold === 12000 && r.bat.b && r.bat.b.guns && r.bat.b.kind === 'garrison' && r.bat.b.n === 150 && /이브라힘/.test(r.bat.b.leader), '파니파트(바부르 편): 술탄의 대군과 싸워 이기면 금화 12,000');
    ok(r.crownPend && r.crown.done && r.crown.page && r.crown.trust === 20 && r.crown.humayun, '새 황제: 회고록 한 장 · 델리 궁정 신뢰 +20 · 후마윤의 금강석 이야기');
    ok(r.lodiBat.res === 'fled' && r.lodiBat.o && r.lodiBat.o.hold === 2 && r.lodiBat.o.noSpecial === true, '파니파트(로디 편): 바부르의 화포를 두 차례 버티고 빠져나온다 (코끼리 없음)');
    ok(r.missed === 'missed' && r.missCrown, '파니파트를 놓쳐도 새 황제 장면은 본다');
    ok(r.news.includes('아그라의 독') && r.news.includes('칸와') && !r.news.includes('파니파트'), '소식: 이브라힘 어머니의 독 · 칸와 (함께 싸웠으면 파니파트 소식은 다시 알리지 않는다) — ' + r.news.join(','));
    ok(r.oldNews === 0, '1560년 저장이면 이미 지난 소식은 몰아서 알리지 않는다');

    // 실제 육상전: 델리 둘레(인도) 수비대 — 술탄 쪽은 전투 코끼리, 바부르 쪽(noSpecial)은 없다
    const lw = await page.evaluate(async () => {
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0; const c = G.CITY_DATA[145]; s.loc = { mode: 'city', city: 145, lon: c.lon, lat: c.lat, party: 60 };
      async function one(noSpecial) {
        const p = G.Games.landWar({ enemy: { name: 't', kind: 'garrison', n: 110, noSpecial }, party: 60, terr: 'grass', guns: true, fastEnd: true, flee: false });
        await new Promise(r => setTimeout(r, 300));
        const D = G.Games._landDebug, sp = D.foes.filter(u => u.special).map(u => u.name);
        D.foes.forEach(u => { if (u.leader) u.n = 0; });
        [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /전투 개시/.test(x.textContent))[0].click();
        await new Promise(r => setTimeout(r, 300)); await D.run(); await p; return sp;
      }
      return { lodi: await one(false), babur: await one(true) };
    });
    ok(lw.lodi.length === 1 && /코끼리/.test(lw.lodi[0]) && lw.babur.length === 0, '육상전: 술탄의 군대에는 전투 코끼리, 바부르의 군대에는 없다 (' + lw.lodi.join(',') + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
