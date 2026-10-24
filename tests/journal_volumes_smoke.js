/* 항해일지 책(40년마다 한 권)과 자택의 서고 — js/systems/logbooks.js (2026-10-24)
   · 40년이 안 되면 「<제독> 항해일지」 한 권, 넘기면 1부·2부 · 일지(800줄)에서 밀려난 줄도 책에는 남는다
   · 자택 「서고」 메뉴 · 모항 도서관 서가 맨 앞의 항해일지 · 발견물의 책을 꽂고 꺼낸다 · 저장/불러오기 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOT_DIR || '';

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  async function shot(name) { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name), timeout: 150000 }); } }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.LogBooks && !G.Scenes.title.bootPending, null, { timeout: 120000 });

    // ---------------- 40년이 안 된 일지: 한 권
    const one = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0;
      const t0 = { y: s.date.y, m: s.date.m, d: s.date.d };
      for (let i = 1; i <= 50; i++) { s.date = G.U.addDays(t0, i * 30); s.day = i * 30; G.State.log('짧은 항해 ' + i); }
      const v = G.LogBooks.volumes();
      return { n: v.length, title: v[0].title, count: v[0].count, d0: s.logArc.d0 };
    });

    // ---------------- 49년: 두 권 · 일지에서 밀려난 줄도 1부에 남는다
    const two = await page.evaluate(async () => {
      const s = G.Game.state, t0 = G.U.addDays(s.date, -s.day);
      const G4 = ['A', 'B', 'C', 'D', 'D', 'D'];
      for (let i = 0; i < 3000; i++) { const day = 1500 + i * 6; s.date = G.U.addDays(t0, day); s.day = day; G.State.log('사건 ' + i + ' — ' + s.date.y + '년의 일', G4[i % G4.length]); }
      const v = G.LogBooks.volumes(), a = s.logArc;
      const b2 = G.LogBooks.bound(2);
      const v1 = v[0].lines(), v2 = v[1].lines();
      return {
        n: v.length, titles: v.map(x => x.title), open: v.map(x => x.open),
        logLen: s.log.length, logOld: s.log.filter(l => l.d < b2).length,
        v1n: v1.length, v1max: Math.max(...v1.map(l => l.d)), v1min: Math.min(...v1.map(l => l.d)), v1has1: v1.some(l => l.t === '짧은 항해 1'),
        v1sorted: v1.every((l, i) => !i || v1[i - 1].d <= l.d),
        v2n: v2.length, v2min: Math.min(...v2.map(l => l.d)), b2,
        logInV2: s.log.filter(l => l.d >= b2).every(l => v2.indexOf(l) >= 0 || v2.some(x => x.d === l.d && x.t === l.t)),
        oldLen: a.old.length, vols: a.vols.length, range: G.LogBooks.stateText(v[0])
      };
    });

    // ---------------- 자택의 서고 메뉴와 창
    const study = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[s.player.home];
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat };
      const menu = G.Scenes.city.B.home.menu(c).filter(Boolean).map(m => m.label + (m.sub ? ' (' + m.sub + ')' : ''));
      window.__st = G.LogBooks.open(c, '자택');
      return { menu };
    });
    await page.waitForSelector('.studywin .bk.real.jv', { timeout: 10000 });
    const sw = await page.evaluate(() => ({ jv: document.querySelectorAll('.studywin .bk.jv.real').length, writing: document.querySelectorAll('.studywin .bk.jv.writing').length, title: document.querySelector('.studywin .title').textContent, cnt: document.querySelector('.studywin .cnt').textContent }));
    await page.hover('.studywin .bk.real.jv[data-i="0"]');
    await shot('01_서고.png');
    await page.click('.studywin .bk.real.jv[data-i="0"]');
    await page.waitForSelector('.lbkwin .lbk-year', { timeout: 10000 });
    const rd = await page.evaluate(() => ({ title: document.querySelector('.lbkwin .title').textContent, years: document.querySelectorAll('.lbkwin .lbk-year').length, lines: document.querySelectorAll('.lbkwin .lbk-line').length, head: document.querySelector('.lbkwin .lbk-head').textContent }));
    await shot('02_항해일지_1부.png');
    await page.evaluate(() => { [...document.querySelectorAll('.lbkwin .foot button')].pop().click(); });
    await page.waitForSelector('.studywin', { timeout: 10000 });
    await page.evaluate(() => { [...document.querySelectorAll('.studywin .foot button')].filter(b => /닫는다/.test(b.textContent))[0].click(); });
    await page.evaluate(() => window.__st);

    // ---------------- 발견물의 책을 꽂고 꺼낸다
    const books = await page.evaluate(async () => {
      const s = G.Game.state, p = s.player, R = G.R, L = G.LogBooks;
      const b1 = { id: 'r_thebes', disc: 'thebes', done: true }, b2 = { id: 'r_bulguksa', disc: 'bulguksa', done: true }, pr = { id: 'r_babel', disc: 'babel' };
      p.items.push(b1, pr); R.storage().push(b2);
      const used0 = R.slotsUsed();
      const cand = L.candidates().map(x => x.it.id + (x.proof ? ':proof' : '') + ':' + x.from);
      const okProof = L.shelve(pr);
      const ok1 = L.shelve(b1), ok2 = L.shelve(b2);
      const after = { used: R.slotsUsed(), inItems: p.items.some(x => x.id === 'r_thebes'), inStorage: R.storage().some(x => x.id === 'r_bulguksa'), study: L.study().map(x => x.id) };
      return { cand, used0, okProof, ok1, ok2, after, isBook: L.isBook({ id: 'rapier' }) };
    });
    await page.evaluate(() => { const s = G.Game.state; window.__st = G.LogBooks.open(G.CITY_DATA[s.player.home], '자택'); });
    await page.waitForSelector('.studywin .bk.real.tome', { timeout: 10000 });
    const tomes = await page.evaluate(() => document.querySelectorAll('.studywin .bk.real.tome').length);
    await page.hover('.studywin .bk.real.tome');
    await shot('03_서고_발견물책.png');
    await page.click('.studywin .bk.real.tome');
    await page.waitForSelector('.choices .choice', { timeout: 10000 });
    await page.evaluate(() => { [...document.querySelectorAll('.choices .choice')].filter(b => /꺼내/.test(b.textContent))[0].click(); });
    await page.waitForSelector('.studywin', { timeout: 10000 });
    await page.evaluate(() => { [...document.querySelectorAll('.studywin .foot button')].filter(b => /닫는다/.test(b.textContent))[0].click(); });
    await page.evaluate(() => window.__st);
    const took = await page.evaluate(() => ({ study: G.LogBooks.study().map(x => x.id), items: G.Game.state.player.items.map(x => x.id) }));

    // ---------------- 모항 도서관 서가: 항해일지가 맨 앞 · 다른 도시엔 없다
    const lib = await page.evaluate(async () => {
      const s = G.Game.state, LB = G.Scenes.city.B.library, home = G.CITY_DATA[s.player.home];
      const other = G.CITY_DATA.filter(c => c && c.id !== home.id && LB.shelfBooks(c).length)[0];
      const homeJ = G.LogBooks.forLibrary(home).length, otherJ = G.LogBooks.forLibrary(other).length;
      G.UI.say = async () => {};
      window.__lb = LB.shelf(home);
      return { homeJ, otherJ, home: home.name };
    });
    await page.waitForSelector('.shelfwin .bk.real', { timeout: 10000 });
    const ls = await page.evaluate(() => ({ jv: document.querySelectorAll('.shelfwin .bk.real.jv').length, legend: document.querySelector('.shelfwin .bshelf-head').textContent }));
    await page.hover('.shelfwin .bk.real.jv');
    const plate = await page.evaluate(() => document.querySelector('.shelfwin .bplate').textContent);
    await shot('04_모항도서관_서가.png');
    await page.click('.shelfwin .bk.real.jv');
    await page.waitForSelector('.lbkwin', { timeout: 10000 });
    await page.evaluate(() => { [...document.querySelectorAll('.lbkwin .foot button')].pop().click(); });
    await page.evaluate(() => { const x = document.querySelector('.shelfwin .title .x'); if (x) x.click(); });

    // ---------------- 저장/불러오기
    const rt = await page.evaluate(() => {
      const json = G.State.serialize(), S2 = G.State.deserialize(json);
      return { vols: S2.logArc && S2.logArc.vols.length, v1: S2.logArc && S2.logArc.vols[0].lines.length, study: (S2.study || []).map(x => x.id), d0: S2.logArc && S2.logArc.d0 };
    });

    assert.strictEqual(one.n, 1, '40년이 안 되면 한 권');
    assert.strictEqual(one.title, '시험 항해일지', '한 권이면 「제독 항해일지」');
    assert.strictEqual(two.n, 2);
    assert.deepStrictEqual(two.titles, ['시험 항해일지 1부', '시험 항해일지 2부']);
    assert.deepStrictEqual(two.open, [false, true]);
    assert.strictEqual(two.vols, 1, '다 쓴 권 하나가 엮였다');
    assert(two.logLen <= 800, '수첩의 일지는 그대로 800줄까지');
    assert(two.logOld < two.v1n / 3, '1부 시기의 줄은 수첩 일지에서는 대부분 밀려났다 (등급 몫만큼만 남는다): ' + two.logOld + '/' + two.v1n);
    assert(two.v1n > 1000 && two.v1n <= 1500, '그래도 1부에는 남는다 (1500줄까지): ' + two.v1n);
    assert(two.v1min < one.d0 + 20000, '1부에 처음 몇 해의 줄도 남았다 (수첩 일지에서는 지워진 것)');
    assert(two.v1max < two.b2 && two.v1sorted, '1부는 40년 안의 줄만, 날짜순');
    assert(two.v2min >= two.b2 && two.logInV2, '2부: 지금 일지의 줄을 모두 담는다');
    assert(study.menu.some(m => /^서고 \(항해일지 2권/.test(m)), '자택 메뉴에 서고: ' + study.menu.join(' / '));
    assert.strictEqual(sw.jv, 2); assert.strictEqual(sw.writing, 1, '쓰고 있는 권은 표시');
    assert(/자택 — 서고/.test(sw.title));
    assert(/시험 항해일지 1부/.test(rd.title) && rd.years >= 38 && rd.lines === two.v1n, '1부를 펼치면 해마다 묶인 줄: ' + JSON.stringify(rd));
    assert.deepStrictEqual(books.cand, ['r_thebes:items', 'r_babel:proof:items', 'r_bulguksa:storage']);
    assert.strictEqual(books.okProof, false, '보고하지 않은 증거는 꽂지 못한다');
    assert(books.ok1 && books.ok2);
    assert.strictEqual(books.after.used, books.used0 - 1, '꽂은 책은 소지품 칸을 비운다');
    assert(!books.after.inItems && !books.after.inStorage);
    assert.deepStrictEqual(books.after.study, ['r_thebes', 'r_bulguksa']);
    assert.strictEqual(books.isBook, false);
    assert.strictEqual(tomes, 2);
    assert.deepStrictEqual(took.study, ['r_bulguksa'], '하나를 꺼냈다');
    assert(took.items.indexOf('r_thebes') >= 0);
    assert.strictEqual(lib.homeJ, 2); assert.strictEqual(lib.otherJ, 0, '모항이 아닌 도서관엔 없다');
    assert.strictEqual(ls.jv, 2); assert(/항해일지/.test(ls.legend));
    assert(/항해일지/.test(plate) && !/undefined/.test(plate), plate);
    assert.strictEqual(rt.vols, 1); assert.strictEqual(rt.v1, two.v1n); assert.deepStrictEqual(rt.study, ['r_bulguksa']); assert.strictEqual(rt.d0, one.d0);
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ one, two, study, sw, rd, books, tomes, took, lib, ls, plate, rt }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
