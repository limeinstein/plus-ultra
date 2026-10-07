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

    // ① 생일 선물: 충성 90 이상만
    await newGame();
    const pre = await page.evaluate(() => {
      const s = G.Game.state;
      const pick = (sk) => G.MATES.find(d => d.sk && d.sk[sk] >= 2 && !s.mates.some(m => m.id === d.id) && d.id !== 'rocco').id;
      const ids = [pick('nav'), pick('cook'), pick('music'), pick('acct')];
      ids.forEach((id, i) => s.mates.push({ id, role: 'none', joined: 0, loyal: i < 3 ? 95 : 85 }));
      s.mates.find(m => m.id === 'rocco').loyal = 92;
      s.fleet.fatigue = 60;
      s.date = { y: 1482, m: 6, d: 9 };
      const items0 = s.player.items.length, gold0 = s.player.gold;
      G.Game.passDays(1);
      return { ids, life: JSON.stringify(s.life), items0, gold0, givers: G.Life.givers().map(m => m.id) };
    });
    console.log(JSON.stringify(pre));
    ok(pre.givers.length === 4 && pre.givers.indexOf(pre.ids[3]) < 0, '선물할 부하 ' + pre.givers.length + '명 (충성 85는 빠짐)');
    await page.waitForSelector('.bday', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, 'birthday_gifts.png') });
    const bd = await page.evaluate(() => ({ rows: document.querySelectorAll('.bday-row').length, text: document.querySelector('.bday').innerText, faces: document.querySelectorAll('.bd-face canvas').length }));
    await clickWin();
    const post = await page.evaluate((ids) => { const s = G.Game.state; return { items: s.player.items.map(i => i.id), fat: s.fleet.fatigue, loyal: ids.map(id => s.mates.find(m => m.id === id).loyal), life: s.life }; }, pre.ids);
    console.log(JSON.stringify(post));
    ok(bd.rows === 4 && bd.faces === 4, '생일 선물 창: 4명 · 얼굴 4장');
    ok(post.items.length > pre.items0 && post.fat < 60, '선물을 받았다 (소지품 ' + pre.items0 + ' → ' + post.items.length + ', 피로 60 → ' + post.fat + ')');
    ok(post.loyal[0] === 97 && post.loyal[3] === 85 && post.life.bdayDone === 1482 && !post.life.bday, '고맙다는 말에 충성 95 → 97, 85는 그대로, 한 해에 한 번');
    const again = await page.evaluate(() => { const s = G.Game.state; G.Game.passDays(1); return !!(s.life.bday); });
    ok(!again, '생일 다음 날에는 다시 주지 않는다');

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
