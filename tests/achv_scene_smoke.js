/* 업적 장면: 업적마다 하나의 사건처럼 (그림·금빛 띠·이야기·부하·제독·보상 창) — node tests/achv_scene_smoke.js
   그림: /tmp/achv/*.png */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/achv';
fs.mkdirSync(OUT, { recursive: true });
const res = [];
function ok(v, msg) { res.push(!!v); console.log((v ? '  ✓ ' : '  ✗ ') + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 1000; s.date = { y: 1500, m: 6, d: 1 };
      G.UI.fade = async fn => { await fn(); };
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    for (let i = 0; i < 20 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
    await page.waitForTimeout(800);

    async function run(label, setup) {
      const info = await page.evaluate(setup);
      const p = page.evaluate(() => { window.__got = null; return G.Achieve.afterFind(null).then(g => { window.__got = g.map(a => a.id); }); });
      const seen = [];
      for (let i = 0; i < 40; i++) {
        await page.waitForTimeout(700);
        const st = await page.evaluate(() => ({ busy: G.UI.busy(), rib: !!document.querySelector('.achv-ribbon.on'), pic: (document.querySelector('.famscene .eventfx-title') || {}).textContent || '', txt: (document.querySelector('.dlg') || {}).textContent || '', win: !!document.querySelector('.achv-pop'), done: window.__got }));
        if (st.done) break;
        seen.push(st);
        if (i < 6) await page.screenshot({ path: path.join(OUT, label + '_' + i + '.png') });
        if (st.win) { await page.screenshot({ path: path.join(OUT, label + '_win.png') }); await page.click('.modal-back button.navy').catch(() => {}); }
        else await page.keyboard.press('Enter');
      }
      await p;
      return { info, seen, got: await page.evaluate(() => window.__got), left: await page.evaluate(() => ({ rib: !!document.querySelector('.achv-ribbon'), pic: !!document.querySelector('.famscene') })) };
    }

    // ① 일곱 불가사의 — 발견물 그림을 차례로, 역사학 부하가 말한다
    const r1 = await run('wonders7', () => {
      const s = G.Game.state, ids = G.ACHIEVEMENTS.find(a => a.id === 'wonders7').ids;
      ids.forEach(id => { s.disc[id] = { me: 1, found: 1, d: 15000601 }; });
      const hid = G.MATES.find(d => d.sk && d.sk.hist >= 3 && d.wage && !d.eventOnly);
      s.mates = [{ id: hid.id, role: 'none', loyal: 80, sk: Object.assign({}, hid.sk) }];
      return { hist: hid.name, pics: ids.filter(id => G.Img.file('discoveries/' + id)).length };
    });
    const t1 = r1.seen.map(x => x.txt).join(' | ');
    ok(r1.got && r1.got.indexOf('wonders7') >= 0, '업적 「일곱 불가사의」를 이룬다');
    ok(r1.seen.some(x => x.rib), '금빛 띠 「업적 달성」');
    ok(/필론이 책상 앞에서/.test(t1) && t1.indexOf(r1.info.hist) >= 0 && /헤로도토스도/.test(t1), '이야기 → 역사학 부하(' + r1.info.hist + ')의 한마디');
    ok(/여덟 번째 경이/.test(t1), '제독의 한마디');
    ok(r1.seen.some(x => x.win), '마지막에 보상 창');
    const pn = new Set(r1.seen.map(x => x.pic).filter(Boolean));
    ok(r1.info.pics === 0 || pn.size >= Math.min(3, r1.info.pics), '발견물 그림을 차례로 (' + [...pn].join(', ') + ')');
    ok(!r1.left.rib && !r1.left.pic, '끝나면 띠·그림이 걷힌다');

    // ② Once Upon a Time — 네 아가씨가 직접 말한다
    const r2 = await run('onceupon', () => {
      const s = G.Game.state, ids = ['cinderella', 'snow_white', 'sleeping_beauty', 'little_mermaid'];
      s.mates = ids.filter(id => G.MATE[id]).map(id => ({ id, role: 'none', loyal: 80, sk: Object.assign({}, G.MATE[id].sk) }));
      return { n: s.mates.length };
    });
    const t2 = r2.seen.map(x => x.txt).join(' | ');
    ok(r2.got && r2.got.indexOf('onceupon') >= 0 && /유리 구두/.test(t2) && /일곱 난쟁이/.test(t2) && /백 년을 잤으니/.test(t2), '옛이야기의 아가씨들이 차례로 말한다 (' + r2.info.n + '명)');

    // ③ 대사 없는 업적이 생겨도 장면은 뜬다 (자료가 빠진 경우)
    const r3 = await run('nodata', () => {
      const s = G.Game.state; delete G.ACHV_EVENTS.egypt;
      G.ACHIEVEMENTS.find(a => a.id === 'egypt').ids.forEach(id => { s.disc[id] = { me: 1, found: 1, d: 15000601 }; });
      return {};
    });
    ok(r3.got && r3.got.indexOf('egypt') >= 0 && r3.seen.some(x => x.win) && r3.seen.some(x => x.rib), '대사가 없어도 띠·설명·보상 창');
    // ④ 하루 셈에서 이룬 업적(혼인 등): 알림 → 다음 항구에 들어설 때 장면 · 옛 저장 첫날은 알림만
    const d4 = await page.evaluate(() => {
      const s = G.Game.state, A = G.Achieve;
      delete s.achv._init;
      G.ACHIEVEMENTS.find(a => a.id === 'rome').ids.forEach(id => { s.disc[id] = { me: 1, found: 1, d: 15000601 }; });
      const first = A.daily().filter(m => /업적/.test(m.text)).length, pend1 = (s.achvPend || []).length;
      G.ACHIEVEMENTS.find(a => a.id === 'incas').ids.forEach(id => { s.disc[id] = { me: 1, found: 1, d: 15000601 }; });
      const msgs = A.daily().filter(m => /업적/.test(m.text)).map(m => m.text);
      return { first, pend1, msgs, pend: (s.achvPend || []).slice() };
    });
    ok(d4.first === 1 && d4.pend1 === 0, '옛 저장 첫날 채워진 업적은 알림만 (장면 없음)');
    ok(d4.pend.join() === 'incas' && /다음 항구에서/.test(d4.msgs.join()), '그 뒤 하루 셈에서 이룬 업적은 다음 항구 장면으로 미룬다');
    const p4 = page.evaluate(() => G.Scenes.city.arrival(G.CITY_DATA[0], { arrive: true }).then(() => { window.__arr = 1; }));
    const seen4 = [];
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(700);
      const st = await page.evaluate(() => ({ done: window.__arr, rib: (document.querySelector('.achv-ribbon') || {}).textContent || '', win: !!document.querySelector('.achv-pop'), busy: G.UI.busy() }));
      if (st.done) break;
      seen4.push(st);
      if (st.win) await page.click('.modal-back button.navy').catch(() => {}); else if (st.busy) await page.keyboard.press('Enter');
    }
    await p4;
    ok(seen4.some(x => /태양의 아들들/.test(x.rib)) && seen4.some(x => x.win) && !(await page.evaluate(() => (G.Game.state.achvPend || []).length)), '항구에 들어서면 밀린 업적 장면이 뜬다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  const bad = res.filter(x => !x).length;
  console.log(bad ? '실패 ' + bad : '모두 통과 ' + res.length);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
