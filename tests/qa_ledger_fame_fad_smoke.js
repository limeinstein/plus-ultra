/* QA 6·7·8: 사라진 도시 추천 제외 · 명성 칭호 200만까지 · 실제 유행 조건 안내.
   node tests/qa_ledger_fame_fad_smoke.js (BROWSER_EXE=크롬 경로) */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href,
      { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Ledger && G.Fad && G.Guidebook);
    const passed = await page.evaluate(async () => {
      const passed = [];
      function ok(v, msg) { if (!v) throw new Error(msg); passed.push(msg); }
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.State.newGame({ name: '칭호 시험', nation: 'PT', job: 'merchant', age: 24,
        birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35;
      const R = G.R, L = G.Ledger, B = G.BALANCE;
      const gone = G.CITY_DATA.find(c => c.until && c.until > 1480 && !c.founded);
      const lis = G.CITY_DATA[0], gid = 'pepper', g = G.GOOD[gid];
      function row(c, buy, sell) { const r = { t: s.day, b: {}, s: [], ci: { spice: 100 } }; r.b[gid] = buy; r.s[g.idx] = sell; return r; }
      s.date = { y: gone.until - 1, m: 12, d: 31 };
      s.ledger = {}; s.ledger[lis.id] = row(lis, 20, 10); s.ledger[gone.id] = row(gone, 5, 500);
      ok(R.cityExists(gone) && L.bestSell(gid).city === gone.id && L.bestBuy(gid).city === gone.id,
        '도시가 존재할 때는 유리한 시세를 정상 추천한다');
      const saved = G.State.serialize();
      G.Game.state = G.State.deserialize(saved);
      const loaded = G.Game.state; loaded.date = { y: gone.until, m: 1, d: 1 }; loaded.day++;
      ok(!R.cityExists(gone) && L.bestSell(gid).city === lis.id && L.bestBuy(gid).city === lis.id,
        '옛 저장의 하루 전 시세도 도시가 사라지면 매입·매각 추천에서 제외한다');
      ok(L.bestRoute(lis.id) === null && L.bestRoute(gone.id) === null && L.bestRoute() === null,
        '사라진 도시로 가거나 거기서 출발하는 수익 항로를 추천하지 않는다');
      ok(L.table().every(r => (!r.buy || r.buy.city !== gone.id) && (!r.sell || r.sell.city !== gone.id)),
        '교역 수첩의 품목별 추천도 사라진 도시를 제외한다');
      ok(!!loaded.ledger[gone.id] && L.quoteRows(lis.id).some(r => r.city === gone.id),
        '과거 시세 기록은 지우지 않는다');
      const future = G.CITY_DATA.find(c => c.founded && c.founded > 1480);
      loaded.date = { y: future.founded - 1, m: 12, d: 31 }; loaded.ledger = {}; loaded.ledger[future.id] = row(future, 1, 999);
      loaded.ledger[999999] = row(lis, 1, 999);
      ok(L.bestBuy(gid) === null && L.bestSell(gid) === null && L.bestRoute() === null,
        '아직 세워지지 않은 도시·잘못된 도시 번호만 남아도 추천이 나오지 않는다');
      loaded.date = { y: future.founded, m: 1, d: 1 };
      ok(L.bestSell(gid).city === future.id, '건국 연도에 도달하면 해당 도시를 정상 추천한다');

      loaded.date = { y: 1480, m: 5, d: 1 };
      ok(B.fameTitleNames.length === 10 && B.fameTitles[B.fameTitles.length - 1] === 2000000,
        '명성 칭호는 200만까지 10단계다');
      B.fameTitles.forEach((f, i) => {
        ok(R.fameTitle(f - 1) === B.fameTitleNames[i] && R.fameTitle(f) === B.fameTitleNames[i + 1],
          f.toLocaleString('en-US') + ' 경계 직전·직후 칭호가 맞다');
      });
      ok(R.fameTitle(0) === '무명의 항해자' && R.fameTitle(400000) === '대항해자' && R.fameTitle(9999999) === '불멸의 항해자',
        '초반·기존 40만 칭호를 유지하고 200만 이후는 마지막 칭호를 쓴다');
      const toast = G.UI.toast, sound = G.Audio.sfx, notices = [];
      G.UI.toast = t => notices.push(t); G.Audio.sfx = () => {};
      loaded.titleSeen = '대항해자'; loaded.player.fame = 650000; G.Game.checkTitle(); G.Game.checkTitle();
      ok(notices.length === 1 && notices[0].includes('세계적인 대항해자'), '옛 저장 칭호에서 새 단계로 승급할 때 한 번만 알린다');
      loaded.player.fame = 400000; G.Game.checkTitle();
      ok(notices.length === 1, '명성 하락은 승급으로 알리지 않는다');
      G.UI.toast = toast; G.Audio.sfx = sound;
      const guide = G.Guidebook.pages().map(p => p.html).join('');
      const box = document.createElement('div'); box.innerHTML = guide;
      const rows = [...box.querySelectorAll('.fame-titles tbody tr')];
      ok(rows.length === 10 && rows.every((r, i) => r.cells[1].textContent === B.fameTitleNames[i]) &&
        rows[9].textContent.includes('2,000,000') && !guide.includes('{{명성_칭호}}') && !guide.includes('25,000 미만'),
        '가이드북 칭호 표가 현재 설정의 10단계·200만 기준과 일치한다');

      const C = G.Scenes.city, current = C.current, say = C.say, chance = G.U.chance;
      let heard = '';
      C.current = () => ({ talked: false }); C.say = async (who, text) => { heard = text; }; G.U.chance = () => false;
      try {
        await C.B.trade.talk(lis);
        const f = B.fad;
        ok(heard.includes(f.window + '일 안에 ' + f.need + '번 이상') && heard.includes(Math.round(f.profit * 100) + '% 이상') &&
          heard.includes(Math.round(f.chance * 100) + '% 확률') && heard.includes(f.days + '일 동안 값이 ' + f.mult + '배') &&
          heard.includes(f.cooldown + '일 동안') && !heard.includes('세 번쯤'),
          '교역소 회화에 실제 유행 횟수·기간·이익률·확률·효과·재발생 간격을 안내한다');
        window.__qaFadTip = heard.split('\f').find(t => t.includes('확률로 유행'));
        const oldNeed = f.need;
        try { f.need = 7; await C.B.trade.talk(lis); ok(heard.includes('7번 이상'), '유행 설정이 바뀌면 대사도 같이 바뀐다'); }
        finally { f.need = oldNeed; }
      } finally { C.current = current; C.say = say; G.U.chance = chance; }
      window.__qaFamePage = G.Guidebook.pages().findIndex(p => p.html.includes('fame-titles'));
      return passed;
    });
    passed.forEach(s => console.log('  ✓ ' + s));
    // 진행을 직접 돌리는 시험에서는 RAF를 막았으므로 부팅 덮개를 명시적으로 걷고 화면을 확인한다.
    await page.evaluate(async () => { await G.Loader.hide(); });
    await page.evaluate(() => { G.Guidebook.open(window.__qaFamePage); });
    await page.waitForSelector('.gb-page .fame-titles');
    assert.strictEqual(await page.locator('.gb-page .fame-titles tbody tr').count(), 10);
    assert((await page.locator('.gb-page .fame-titles').innerText()).includes('불멸의 항해자'));
    await page.evaluate(() => document.querySelector('.gb-page .fame-titles').scrollIntoView({ block: 'end' }));
    if (process.env.OUT) { fs.mkdirSync(process.env.OUT, { recursive: true }); await page.screenshot({ path: path.join(process.env.OUT, 'fame-guide.png') }); }
    await page.keyboard.press('Escape');
    await page.evaluate(() => { G.Game.state.player.fame = 2000000; G.Info.open('hero'); });
    assert((await page.locator('.modal-back').last().innerText()).includes('불멸의 항해자'));
    await page.keyboard.press('Escape');
    await page.evaluate(() => { G.UI.say(window.__qaFadTip, { name: '교역소 주인', lang: 3 }); });
    const tip = await page.locator('.modal-back').last().innerText();
    assert(tip.includes('90일 안에 5번 이상') && tip.includes('30% 확률'));
    if (process.env.OUT) await page.screenshot({ path: path.join(process.env.OUT, 'fad-tip.png') });
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('  ✓ 가이드북·제독 수첩·유행 대화 화면 확인, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
