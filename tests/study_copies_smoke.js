/* 자택 서고의 필사본 — 도서관에서 읽은 책을 꽂는다 (js/systems/logbooks.js LBK.copies · js/city/bookshelf.js LB.homeRead) — node tests/study_copies_smoke.js
   · 읽은 책만 꽂을 수 있다 · 「책을 꽂는다」 → 「모두 꽂는다」 · 서고에 필사본 책등 · 펼치면 이 책에서 얻은 단서와 찾은 곳(날은 지나지 않는다)
   · 「서고에서 뺀다」 → 다시 꽂을 책으로 · 자택 메뉴의 「서고」 칸 · 저장/불러오기 · 콘솔 오류 0 · 화면: /tmp/study_copies (BROWSER_EXE=크롬 경로) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/study_copies';
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.LogBooks && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const prep = await page.evaluate(() => {
      const UI = G.UI; UI.toast = () => {}; UI.say = async () => {}; G.State.save = () => {}; G.Game.refreshHud = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
      const books = G.BOOKS.filter(b => (b.discs || []).filter(id => G.DISC[id] && G.Disc.clueOk(G.DISC[id], 'book')).length >= 2).slice(0, 3);
      books.forEach(b => { s.flags['read_' + b.id] = 1; });
      const b0 = books[0], ds = b0.discs.filter(id => G.DISC[id] && G.Disc.clueOk(G.DISC[id], 'book'));
      s.hints[ds[0]] = { src: 'book:' + b0.id, d: 14800510 };                       // 이 책에서 얻은 단서
      s.disc[ds[1]] = { found: 14800601, me: true, evidence: true };              // 이 책에 적힌 곳 가운데 이미 찾은 곳
      window.__b = books.map(b => b.id); window.__d = ds;
      const unread = G.BOOKS.find(b => !s.flags['read_' + b.id]);
      return { n: books.length, cand: G.LogBooks.copyCandidates().length, unreadShelve: G.LogBooks.shelveCopy(unread), canAdd: G.LogBooks.canAdd(),
        sub: (G.Scenes.city.B.home.menu(G.CITY_DATA[0]).filter(Boolean).find(m => m.label === '서고') || {}).sub, day: s.day };
    });
    ok(prep.n === 3 && prep.cand === 3 && prep.canAdd, '읽은 책 3권이 「꽂을 책」이 된다');
    ok(prep.unreadShelve === false, '읽지 않은 책은 꽂을 수 없다');
    ok(/꽂을 책 3권/.test(prep.sub || ''), '자택 메뉴의 「서고」 칸에 꽂을 책 수가 보인다 (' + prep.sub + ')');

    // 서고 → 책을 꽂는다 → 모두 꽂는다
    await page.evaluate(() => { window.__done = false; G.LogBooks.open(G.CITY_DATA[0], '리스본 자택').then(() => { window.__done = true; }); });
    await page.waitForSelector('.studywin .foot button');
    await page.locator('.studywin .foot button', { hasText: '책을 꽂는다' }).click();
    await page.waitForSelector('.modal-back .choice');
    const opts = await page.$$eval('.modal-back .choice', a => a.map(e => e.innerText.replace(/\s+/g, ' ')));
    ok(opts.some(t => /모두 꽂는다 \(3권\)/.test(t)) && opts.filter(t => /필사본/.test(t)).length === 3, '꽂을 책 목록에 필사본 3권과 「모두 꽂는다」');
    await page.locator('.modal-back .choice', { hasText: '모두 꽂는다' }).click();
    await page.waitForSelector('.studywin .bk.copy');
    const shelf = await page.evaluate(() => ({ copies: G.LogBooks.copies().slice(), spines: document.querySelectorAll('.studywin .bk.real.copy').length, cnt: document.querySelector('.studywin .cnt').textContent }));
    await page.screenshot({ path: path.join(OUT, 'study.png') });
    ok(shelf.copies.length === 3 && shelf.spines === 3 && /필사본 3권/.test(shelf.cnt), '서고에 필사본 책등 3권 (' + shelf.cnt + ')');
    await page.hover('.studywin .bk.real.copy');
    const plate = await page.$eval('.studywin .bplate', e => e.innerText.replace(/\s+/g, ' '));
    ok(/필사본/.test(plate) && /단서 1곳/.test(plate) && /찾은 곳 1곳/.test(plate), '책등에 가까이 가면 제목·지은이·얻은 단서·찾은 곳 (' + plate + ')');

    // 펼쳐 본다 — 날은 지나지 않는다
    await page.locator('.studywin .bk.real.copy').first().click();
    await page.locator('.modal-back .choice', { hasText: '펼쳐 본다' }).click();
    await page.waitForSelector('.modal-back .obook');
    const opened = await page.evaluate(() => ({ gain: document.querySelector('.modal-back .bgain').innerText.replace(/\s+/g, ' '), note: (document.querySelector('.modal-back .bnote') || {}).innerText || '',
      h: G.DISC[__d[0]].name, f: G.DISC[__d[1]].name, day: G.Game.state.day }));
    await page.screenshot({ path: path.join(OUT, 'read.png') });
    ok(opened.gain.indexOf(opened.h) >= 0 && opened.gain.indexOf(opened.f) >= 0, '펼치면 이 책에서 얻은 단서와 이미 찾은 곳이 보인다');
    ok(/날은 지나지 않는다/.test(opened.note) && opened.day === prep.day, '집에서 펼쳐도 날은 지나지 않는다');
    await page.locator('.modal-back .foot button', { hasText: '책을 덮는다' }).click();

    // 서고에서 뺀다
    await page.waitForSelector('.studywin .bk.copy');
    await page.locator('.studywin .bk.real.copy').first().click();
    await page.locator('.modal-back .choice', { hasText: '서고에서 뺀다' }).click();
    await page.waitForSelector('.studywin .bk.copy');
    const out = await page.evaluate(() => ({ n: G.LogBooks.copies().length, cand: G.LogBooks.copyCandidates().map(b => b.id), first: __b[0] }));
    ok(out.n === 2 && out.cand.length === 1 && out.cand[0] === out.first, '「서고에서 뺀다」 → 다시 꽂을 책으로 돌아간다');
    await page.locator('.studywin .foot button', { hasText: '닫는다' }).click();
    await page.waitForFunction(() => window.__done, null, { timeout: 5000 });

    // 저장/불러오기 · 대를 이어도 그대로 (서고는 집에 있다)
    const saved = await page.evaluate(() => { const S2 = G.State.deserialize(G.State.serialize()); return (S2.studyCopies || []).length; });
    ok(saved === 2, '저장/불러오기에 필사본이 남는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
