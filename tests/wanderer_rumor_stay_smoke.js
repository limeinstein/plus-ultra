/* 철새 행방: 처음 들은 날부터 59일 체류, 재문의·월별 이동·불러오기·세대 교체에도 남은 일수 유지.
   node tests/wanderer_rumor_stay_smoke.js (BROWSER_EXE=크롬 경로, OUT=화면 폴더) */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
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
    await page.waitForFunction(() => window.G && G.MateMove && G.MaidTip && G.Scenes.city.B.tavern && G.Info);
    const result = await page.evaluate(async () => {
      const passed = [];
      const ok = (v, msg) => { if (!v) throw new Error(msg); passed.push(msg); };
      const MM = G.MateMove, MT = G.MaidTip, T = G.Scenes.city.B.tavern;
      G.State.newGame({ name: '행방 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      let s = G.Game.state; s.settings.res = 0.35; s.player.gold = 100000;
      const source = G.CITY_DATA[0], target = G.CITY_DATA[1];
      const m = G.Wander.list().find(m => MM.range(m.id).includes(source.id) && MM.range(m.id).includes(target.id));
      ok(!!m, '이베리아의 실제 철새를 선택한다');
      MM.locs(); s.mateLoc[m.id] = target.id;
      // 정보 후보를 조회하기만 할 때는 다른 철새까지 붙잡아 두면 안 된다.
      MT.wanderers(source, { aff: 80 });
      ok(!s.mateRumorStay, '아직 정보를 듣지 않은 옛 저장·후보 조회에는 체류 기한을 만들지 않는다');
      const maid = G.MAIDS.find(x => x.city === source.id), st = s.maids[maid.id] = { aff: 20, met: 1 };
      const choose = G.UI.choose, nearby = MM.nearby, say = [];
      G.UI.choose = async () => 'wander';
      // 추첨만 고정하고 실제 여급 처리·체류·이동·저장 코드를 사용한다.
      MM.nearby = () => [{ m, c: target, d: 1 }];
      try {
        await MT.ask(source, maid, st, async text => { say.push(text); });
        const first = s.mateRumorStay[m.id].until;
        ok(MM.rumorStayLeft(m.id) === 59 && say[say.length - 1].includes('앞으로 59일'),
          '여급에게 처음 들으면 실제 그 항구에 59일 체류한다');
        s.day += 20; s.portVisit = (s.portVisit || 0) + 1;
        const another = G.MAIDS.find(x => x.id !== maid.id);
        await MT.ask(source, another, { aff: 20, met: 0 }, async text => { say.push(text); });
        ok(s.mateRumorStay[m.id].until === first && MM.rumorStayLeft(m.id) === 39 && say[say.length - 1].includes('앞으로 39일'),
          '20일 뒤 다른 여급에게 같은 인물을 물어도 39일만 남고 연장되지 않는다');
        const hint = T.mateHint(source);
        ok(hint.includes('앞으로 39일') && s.mateRumorStay[m.id].until === first,
          '술집 주인의 귀띔도 같은 기한·39일을 사용한다');
        const chance = G.U.chance;
        G.U.chance = () => false; // 보통 항해사는 머물지 않고 움직이게 한다.
        try {
          const moved = MM.month();
          ok(!moved.includes(m.id) && MM.where(m.id).id === target.id, '월별 이동을 실행해도 소식을 들은 철새는 움직이지 않는다');
          const normal = G.MATES.find(x => !x.wd && x.id !== 'rocco' && MM.range(x.id).filter(id => G.CITY_DATA[id] && G.R.cityExists(G.CITY_DATA[id])).length > 1);
          const at = MM.where(normal.id);
          ok(MM.hear(normal.id, at.id) === 0 && !s.mateRumorStay[normal.id], '이 규칙은 일반 실존 항해사에게 적용하지 않는다');
        } finally { G.U.chance = chance; }
        const data = G.State.serialize(); G.Game.state = G.State.deserialize(data); G.Wander.apply(); s = G.Game.state;
        ok(MM.rumorStayLeft(m.id) === 39 && MM.where(m.id).id === target.id, '저장·불러오기 후에도 같은 항구·39일이 유지된다');
        const heardAt = first - 59;
        s.day = heardAt + 58;
        ok(MM.rumorStayLeft(m.id) === 1, '58일이 지나면 1일 남는다');
        const chance2 = G.U.chance; G.U.chance = () => false;
        try {
          MM.month(); ok(MM.where(m.id).id === target.id, '마지막 1일에도 월별 이동을 막는다');
          s.day = first;
          ok(MM.rumorStayLeft(m.id) === 0, '59일이 지나면 체류 기한이 끝난다');
          const moved = MM.month();
          ok(moved.includes(m.id) && MM.where(m.id).id !== target.id, '기간이 끝난 철새는 다시 원래 규칙대로 이동한다');
        } finally { G.U.chance = chance2; }
        const next = MM.where(m.id);
        ok(MM.hear(m.id, next.id) === 59, '기간 종료 후 새 행방을 들으면 새 항구에서 59일을 시작한다');
        s.mates.push({ id: m.id, role: 'none', loyal: 80 });
        ok(MM.here(next.id).every(x => x.id !== m.id), '체류 중 고용하면 부하 후보에서 제외된다');
        s.mates = s.mates.filter(x => x.id !== m.id);
        // 30년 세대 교체가 와도 들은 소식이 갑자기 사라지지 않는다.
        s.date = { y: 1510, m: 1, d: 1 };
        G.Wander.newYear();
        ok(!!G.MATE[m.id] && !!s.wander.defs[m.id] && MM.rumorStayLeft(m.id) === 59 && MM.where(m.id).id === next.id,
          '세대 교체가 와도 체류 기간이 남은 인물은 사라지지 않는다');
        // 수첩 표시와 재문의 화면을 확인할 수 있게 남은 날을 49일로 둔다.
        s.day += 10;
        MM.nearby = () => [{ m: G.MATE[m.id], c: next, d: 1 }];
        const text = T.mateHint(source);
        ok(text.includes('49일'), '처음 소식을 들은 기한에서 지난 날만큼 줄여 안내한다');
        window.__rumorStayId = m.id; window.__rumorStayText = text;
      } finally { G.UI.choose = choose; MM.nearby = nearby; }
      return { passed, name: m.name };
    });
    result.passed.forEach(t => console.log('  ✓ ' + t));
    await page.evaluate(async () => { await G.Loader.hide(); G.Info.open('wander'); });
    await page.waitForSelector('.win .tbl');
    const notebook = await page.locator('.modal-back').last().innerText();
    assert(notebook.includes('체류 49일 남음') && notebook.includes(result.name));
    if (process.env.OUT) {
      fs.mkdirSync(process.env.OUT, { recursive: true });
      await page.evaluate(() => { const name = G.MATE[window.__rumorStayId].name; const rows = [...document.querySelectorAll('.win tr')]; const row = rows.find(r => r.innerText.includes(name)); if (row) row.scrollIntoView({ block: 'center' }); });
      await page.screenshot({ path: path.join(process.env.OUT, 'wander-stay.png') });
    }
    await page.keyboard.press('Escape');
    await page.evaluate(() => { G.UI.say(window.__rumorStayText, { name: '술집 주인', lang: 3 }); });
    assert((await page.locator('.modal-back').last().innerText()).includes('49일'));
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('  ✓ 철새 수첩·주인의 귀띔 화면 확인, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
