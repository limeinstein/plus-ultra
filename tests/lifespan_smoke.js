/* 제독의 수명(최대 80세) · 충성 90 이상 부하의 생일 선물 · 여관 허드렛일 한도 점검.
   node tests/lifespan_smoke.js   (스크린샷: OUT 또는 임시 폴더/lifespan_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'lifespan_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  async function newGame(extra) {
    await page.evaluate((extra) => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 50000; if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
      s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 });
    }, extra || {});
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
  }
  async function clickWin() { await page.waitForTimeout(500); await page.locator('.win .foot button').last().click(); await page.waitForTimeout(300); }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });

    // ① 생일 선물: 가장 충성스러운 부하 한 사람(충성 90 이상) + 배에 함께 탄 아내·견습 아이
    await newGame();
    const pre = await page.evaluate(() => {
      const s = G.Game.state;
      const pick = (sk) => G.MATES.find(d => d.sk && d.sk[sk] >= 2 && !s.mates.some(m => m.id === d.id) && d.id !== 'rocco').id;
      const ids = [pick('nav'), pick('cook'), pick('music'), pick('acct')];
      ids.forEach((id, i) => s.mates.push({ id, role: 'none', joined: 0, loyal: [96, 95, 85, 99][i] }));
      s.mates.find(m => m.id === 'rocco').loyal = 92;
      // 둘째 부인(부하 출신, 충성 99)이 배에 함께 탔다 — 부하 몫이 아니라 아내 몫으로 준다
      s.player.wives2 = [{ id: ids[3], kind: 'mate', city: 0, house: false, aboard: true, wed: 0 }];
      // 견습으로 탄 아이 둘(8세 딸 · 17세 아들), 집에 있는 아이 하나
      s.player.kids = [
        { name: '마리아', sex: 'f', born: { y: 1474, m: 2, d: 2 }, sk: {}, lg: {}, st: {}, edu: {}, aboard: true, bond: 50 },
        { name: '주앙', sex: 'm', born: { y: 1465, m: 3, d: 3 }, sk: {}, lg: {}, st: {}, edu: {}, aboard: true, bond: 50 },
        { name: '루이스', sex: 'm', born: { y: 1476, m: 4, d: 4 }, sk: {}, lg: {}, st: {}, edu: {}, bond: 50 }];
      s.fleet.fatigue = 60;
      s.date = { y: 1482, m: 6, d: 9 };
      const items0 = s.player.items.length;
      G.Game.passDays(1);
      return { ids, items0, givers: G.Life.givers().map(g => g.kind + ':' + (g.m ? g.m.id : g.w ? g.w.id : g.k.name)) };
    });
    console.log(JSON.stringify(pre));
    ok(pre.givers.join(',') === ['mate:' + pre.ids[0], 'wife:' + pre.ids[3], 'kid:마리아', 'kid:주앙'].join(','), '선물: 가장 충성스러운 부하 한 사람(충성 96) + 둘째 부인 + 견습 아이 둘 (집에 있는 아이·다른 부하는 빠짐)');
    await page.waitForSelector('.bday', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, 'birthday_gifts.png') });
    const bd = await page.evaluate(() => ({ rows: document.querySelectorAll('.bday-row').length, text: document.querySelector('.bday').innerText, faces: document.querySelectorAll('.bd-face canvas').length }));
    await clickWin();
    const post = await page.evaluate((ids) => { const s = G.Game.state; return { fat: s.fleet.fatigue, loyal: ids.map(id => s.mates.find(m => m.id === id).loyal), rocco: s.mates.find(m => m.id === 'rocco').loyal, bond: s.player.kids.map(k => k.bond), life: s.life }; }, pre.ids);
    console.log(JSON.stringify(post), bd.text.replace(/\n/g, ' / ').slice(0, 400));
    ok(bd.rows === 4 && bd.faces === 4 && /둘째 부인/.test(bd.text) && /8세/.test(bd.text) && /17세/.test(bd.text), '생일 선물 창: 4줄 · 얼굴 4장 (부하·둘째 부인·딸 8세·아들 17세)');
    ok(post.fat < 60, '선물 효과: 피로 60 → ' + Math.round(post.fat));
    ok(post.loyal[0] === 98 && post.loyal[1] === 95 && post.rocco === 92 && post.loyal[3] === 99, '고맙다는 말에 선물한 부하만 충성 96 → 98 (다른 부하 그대로)');
    ok(post.bond[0] === 53 && post.bond[1] === 53 && post.bond[2] === 50, '선물한 아이와의 사이 50 → 53 (집에 있는 아이는 그대로)');
    ok(post.life.bdayDone === 1482 && !post.life.bday, '한 해에 한 번');
    const again = await page.evaluate(() => { const s = G.Game.state; G.Game.passDays(1); return !!(s.life.bday); });
    ok(!again, '생일 다음 날에는 다시 주지 않는다');
    // 본처가 배에 타고 있으면 본처도 / 아무도 없으면 선물 없음
    const wf = await page.evaluate(() => {
      const s = G.Game.state, p = s.player; p.wives2 = []; p.kids = [];
      const maid = Object.keys(G.MAID)[0]; p.wife = maid; p.wifeAboard = true;
      const a = G.Life.givers().map(g => g.kind + (g.w ? (g.w.main ? ':main' : '') : ''));
      p.wifeAboard = false; s.mates.forEach(m => { m.loyal = 80; });
      return { a, none: G.Life.givers().length, gift: G.Life.wifeGift(G.Life.wivesAboard()[0] || { id: maid, main: true }).line };
    });
    ok(wf.a.indexOf('wife:main') >= 0 && wf.none === 0, '본처가 타면 본처 선물 (' + wf.a.join(',') + '), 충성 90 넘는 부하도 가족도 없으면 선물 없음');

    // ② 수명: 80세 생일에 세상을 떠남 — 아들이 없으면 끝
    await newGame();
    await page.evaluate(() => { const s = G.Game.state; s.player.born = { y: 1480 - 80, m: 6, d: 10 }; s.date = { y: 1480, m: 6, d: 9 }; });
    const a79 = await page.evaluate(() => G.R.age());
    const warn = await page.evaluate(() => { const s = G.Game.state; s.date = { y: 1479, m: 6, d: 9 }; const m = G.Game.passDays(1); s.date = { y: 1480, m: 6, d: 9 }; return m.filter(x => x.lifeWarn).length; });
    await page.evaluate(() => G.Game.passDays(1));
    await page.waitForSelector('.win .title', { timeout: 10000 });
    await page.waitForFunction(() => [...document.querySelectorAll('.win .title')].some(e => /세월/.test(e.textContent)), null, { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'life_end.png') });
    const deathTxt = await page.evaluate(() => document.querySelector('.win .content').innerText);
    await clickWin();
    await page.waitForTimeout(1500);
    const end = await page.evaluate(() => ({ html: document.body.innerText.slice(0, 4000) }));
    await page.screenshot({ path: path.join(OUT, 'life_end_ending.png') });
    ok(a79 === 79 && warn === 1, '79세 생일 앞: 79세, 75세 넘은 생일에는 「남은 날이 많지 않다」 귀띔');
    ok(/80세 생일/.test(deathTxt) && /막을 내린다/.test(deathTxt), '80세 생일: 「' + deathTxt.split('\n')[0].slice(0, 50) + '…」');
    ok(/생을 마치다/.test(end.html), '뒤를 이을 아들이 없으면 마지막 장면 (생을 마치다)');

    // ③ 아들이 있으면 뒤를 잇는다
    await newGame();
    await page.evaluate(() => {
      const s = G.Game.state; s.player.born = { y: 1400, m: 6, d: 10 }; s.date = { y: 1480, m: 6, d: 9 };
      s.player.kids = [{ name: '주앙', sex: 'm', born: { y: 1455, m: 3, d: 3 }, sk: {}, lg: {}, st: { str: 60, int: 60, mar: 60, cha: 60 }, edu: {} }];
      G.Game.passDays(1);
    });
    let heirName = null;
    for (let i = 0; i < 8; i++) {
      const has = await page.evaluate(() => { const b = document.querySelector('.win .foot button'); return b ? b.textContent : null; });
      if (has) { await clickWin(); await page.waitForTimeout(400); }
      heirName = await page.evaluate(() => G.Game.state.player.name);
      if (/주앙/.test(heirName)) break;
    }
    const heir = await page.evaluate(() => ({ name: G.Game.state.player.name, age: G.R.age(), end: G.Game.state.life && G.Game.state.life.end }));
    ok(/주앙/.test(heir.name) && heir.age < 80 && !heir.end, '아들이 뒤를 이었다: ' + heir.name + ' (' + heir.age + '세)');
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });

    // ④ 옛 저장: 이미 85세 — 다음 날 세상을 떠난다
    await newGame();
    const old = await page.evaluate(() => { const s = G.Game.state; delete s.life; s.player.born = { y: 1395, m: 1, d: 1 }; s.date = { y: 1480, m: 6, d: 1 }; G.UI.alert = async () => true; G.Ending.show = async (r) => { window.__end = r; }; G.Game.passDays(1); return { age: G.R.age(), end: s.life && s.life.end }; });
    await page.waitForFunction(() => window.__end, null, { timeout: 10000 });
    ok(old.end === 85, '옛 저장 85세: 다음 날 수명이 다함 (' + old.end + '세)');

    // ⑤ 여관 허드렛일 한도: 한 번에 최대 150일, 하루 명성 −1
    await newGame();
    const inn = await page.evaluate(async () => {
      const s = G.Game.state, C = G.Scenes.city, c = G.CITY_DATA[0], K = G.BALANCE.innWork;
      let opts = null, num = null;
      C.ask = async (w, t, o) => { opts = o.map(x => x.label + ':' + x.value); return -1; };
      C.say = async () => {};
      G.UI.number = async (o) => { num = { max: o.max }; return 999; };
      G.UI.fade = async (fn) => { fn(); };
      s.player.fame = 1000; G.Fame.add('so', 500);
      const d0 = s.day, f0 = G.Fame.total ? G.Fame.total() : s.player.fame;
      await C.B.inn.work(c);
      const f1 = G.Fame.total ? G.Fame.total() : s.player.fame;
      return { K, opts, num, days: s.day - d0, fame: f0 - f1 };
    });
    console.log(JSON.stringify(inn));
    ok(inn.K.maxDays === 150 && inn.num.max === 150 && inn.days === 150, '허드렛일: 999일을 넣어도 한 번에 ' + inn.days + '일까지 (최대 ' + inn.K.maxDays + '일 = 다섯 달)');
    ok(inn.fame > 0, '허드렛일 150일에 명성이 ' + inn.fame + ' 내려감');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
