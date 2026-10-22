/* 부하 해고와 급료 (js/city/tavern.js T.organize 「해고한다」 · js/core/rules.js R.dedupeMates · js/systems/cabins.js CB.wages · js/systems/world.js W.newMonth)
   — node tests/mate_fire_smoke.js   (BROWSER_EXE=크롬 경로)
   · 술집 「부하편성」 창에서 해고하면 명단에서 빠지고 「대기」로 남지 않는다 · 다음 달 급료에서 빠진다
   · 같은 부하가 명단에 두 줄이어도(옛 저장·사건 합류가 겹침) 해고하면 두 줄 모두 빠진다 (2026-10-22 사용자 제보)
   · 두 줄인 옛 저장을 불러와도 급료는 한 사람 몫 · 달이 바뀌면 일을 맡은 줄 하나만 남는다 · 콘솔 오류 0 · 화면: /tmp/mate_fire */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/mate_fire';
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => {
      const UI = G.UI; UI.toast = () => {}; UI.say = async () => {}; UI.alert = async () => {}; G.State.save = () => {}; G.Game.refreshHud = () => {};
      window.__fresh = function (rows) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
        s.player.gold = 100000; s.player.bank = 0;
        rows.forEach(r => s.mates.push(Object.assign({ joined: 0, loyal: 70 }, r)));
        return s;
      };
      window.__rows = (id) => G.Game.state.mates.filter(m => m.id === id).length;
      window.__wageOf = (ids) => ids.reduce((a, id) => a + G.MATE[id].wage, 0);
      window.__open = function () { window.__done = false; G.Scenes.city.B.tavern.organize().then(() => { window.__done = true; }); };
    });
    const win = '.modal-back';
    async function fire(id) {
      const name = await page.evaluate(id => G.MATE[id].name, id);
      await page.evaluate(() => __open());
      await page.waitForSelector(win + ' .choice');
      await page.locator(win + ' .choice', { hasText: name }).first().click();
      await page.locator(win + ' .choice', { hasText: '해고한다' }).first().click();
      await page.locator(win + ' .foot button', { hasText: '예' }).last().click();
      await page.waitForTimeout(300);
      const listed = await page.evaluate(n => [...document.querySelectorAll('.modal-back .choice')].map(e => e.innerText.replace(/\s+/g, ' ')).filter(t => t.indexOf(n) >= 0), name);
      await page.screenshot({ path: path.join(OUT, 'after_' + id + '.png') });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.__done, null, { timeout: 5000 });
      return listed;
    }

    // 1) 보통 해고 — 명단에서 빠지고 다음 달 급료에서 빠진다
    await page.evaluate(() => __fresh([{ id: 'duarte', role: 'nav' }, { id: 'lacosa', role: 'none' }, { id: 'pinzon_m', role: 'none' }]));
    let listed = await fire('lacosa');
    let r = await page.evaluate(() => { const s = G.Game.state, g0 = s.player.gold; G.World.newMonth(); return { rows: __rows('lacosa'), gone: !!s.flags.gone_lacosa, paid: g0 - s.player.gold, want: Math.round(G.Cabins.wages()), wage: __wageOf(['rocco', 'duarte', 'pinzon_m']) }; });
    ok(!listed.length && r.rows === 0 && r.gone, '해고하면 명단에서 빠지고 「대기」로 남지 않는다');
    ok(r.paid === r.want && r.want <= r.wage, '다음 달 급료는 남은 사람 몫만 (' + r.paid + '닢)');

    // 2) 같은 부하가 두 줄 (항해사 + 대기) — 해고하면 둘 다 빠진다
    await page.evaluate(() => __fresh([{ id: 'duarte', role: 'nav' }, { id: 'duarte', role: 'none' }, { id: 'lacosa', role: 'none' }]));
    r = await page.evaluate(() => ({ wages: G.Cabins.wages(), want: __wageOf(['rocco', 'duarte', 'lacosa']) }));
    ok(r.wages === r.want, '두 줄이어도 급료는 한 사람 몫 (' + r.wages + '닢)');
    listed = await fire('duarte');
    r = await page.evaluate(() => ({ rows: __rows('duarte'), wages: G.Cabins.wages(), want: __wageOf(['rocco', 'lacosa']) }));
    ok(!listed.length && r.rows === 0, '두 줄인 부하를 해고하면 두 줄 모두 빠진다 — 「대기」 줄이 남지 않는다');
    ok(r.wages === r.want, '해고한 사람의 급료가 더 나가지 않는다 (' + r.wages + '닢)');

    // 3) 두 줄인 옛 저장을 불러온 뒤 달이 바뀌면: 일을 맡은 줄 하나만 남고 한 사람 몫만 치른다
    r = await page.evaluate(() => {
      const s = __fresh([{ id: 'pinzon_v', role: 'none' }, { id: 'pinzon_v', role: 'purser' }, { id: 'torres', role: 'none' }, { id: 'torres', role: 'none' }]);
      const S2 = G.State.deserialize(G.State.serialize()); G.Game.state = S2;
      const before = S2.mates.length, g0 = S2.player.gold; G.World.newMonth();
      return { before, after: S2.mates.map(m => m.id + ':' + m.role).join(','), paid: g0 - S2.player.gold, want: G.Cabins.wages(), wage: __wageOf(['rocco', 'pinzon_v', 'torres']) };
    });
    ok(r.before === 5 && r.after === 'rocco:first,pinzon_v:purser,torres:none', '옛 저장의 겹친 줄은 달이 바뀔 때 하나로 — 일을 맡은 줄이 남는다 (' + r.after + ')');
    ok(r.paid === r.want && r.want <= r.wage, '겹쳤던 사람의 급료도 한 번만 (' + r.paid + '닢)');

    // 4) 부하편성 창을 열기만 해도 정리된다 (명단에 같은 이름이 두 번 나오지 않는다)
    await page.evaluate(() => { __fresh([{ id: 'arana', role: 'none' }, { id: 'arana', role: 'none' }]); __open(); });
    await page.waitForSelector(win + ' .choice');
    const n = await page.evaluate(() => [...document.querySelectorAll('.modal-back .choice')].filter(e => e.innerText.indexOf(G.MATE.arana.name) >= 0).length);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => window.__done, null, { timeout: 5000 });
    ok(n === 1 && (await page.evaluate(() => __rows('arana'))) === 1, '부하편성 창에 같은 사람은 한 번만 나온다');

    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
