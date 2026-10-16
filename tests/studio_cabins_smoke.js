/* 화실·음악실·참모실·조각실 점검 (js/systems/studio.js · js/data/cabins.js · js/data/masterworks.js) — node tests/studio_cabins_smoke.js   (BROWSER_EXE=크롬 경로)
   · 새 방 넷이 조선소에서 고칠 수 있는 방으로 나오고, 전용 그림이 없으면 비슷한 방 그림을 빌린다
   · 화실: 그림에 밝은 부하가 미술품을 그려 짐칸에 싣는다 (동아시아 화가는 동양 서화) — 이야기 속 인물은 명작이 없다
   · 실존 화가(레오나르도)는 명작을 완성해 바친다: 소지품(값)·사교 명성·기록 / 조각실의 미켈란젤로는 조각품과 조각 명작
   · 음악실: 하루 피로가 준다 · 참모실: 육상전 계략 성공률이 오른다. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'studio_cabins');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
async function boot(page) {
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
  await page.evaluate(async () => {
    await G.Game.ensureGeo();
    G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state;
    s.date = { y: 1505, m: 3, d: 1 };
    // 선실이 넉넉한 큰 배를 기함으로
    const big = Object.keys(G.SHIP).map(id => ({ id, n: G.Cabins.slots({ type: id }) })).sort((a, b) => b.n - a.n)[0];
    s.fleet.ships[0].type = big.id; s.fleet.ships[0].cabins = null; s.fleet.cabinUid = null;
    s.fleet.ships[0].cap = Math.max(s.fleet.ships[0].cap || 0, 400);
    s.fleet.cargo = {};
  });
}
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await boot(page);
    const r = await page.evaluate(async () => {
      const s = G.Game.state, CB = G.Cabins, ST = G.Studio, UI = G.UI, out = {};
      out.cabins = ['studio', 'sculpt', 'musicroom', 'staff'].map(id => { const c = G.CABIN[id]; return c && !c.fixed && c.cost > 0 && (G.Img.has('cabins/' + id) || G.Img.has('cabins/' + c.art)) ? id : null; });
      out.slots = CB.rooms().length - 1;
      CB.remodel(1, 'studio'); CB.remodel(2, 'sculpt'); CB.remodel(3, 'musicroom'); CB.remodel(4, 'staff'); CB.remodel(5, 'studio');
      const put = (id, i) => { if (!s.mates.some(m => m.id === id)) s.mates.push({ id, role: 'none', loyal: 90 }); CB.place(s.mates.filter(m => m.id === id)[0], i); };
      // 1) 이야기 속 인물(그림 2) — 미술품만, 명작 없음
      put('sleeping_beauty', 1);
      for (let d = 0; d < 40; d++) ST.daily();
      out.taleArt = (s.fleet.cargo.art || {}).q || 0; out.tazePend = s.studio.pend.length;
      // 2) 레오나르도 — 미술품 + 명작
      put('leonardo', 1);
      const msgs = []; for (let d = 0; d < 100; d++) ST.daily().forEach(m => msgs.push(m.text));
      out.leoArt = (s.fleet.cargo.art || {}).q || 0; out.msg = msgs[0];
      out.pend = s.studio.pend.map(p => [p.by, p.kind, p.name, p.value, p.so]);
      // 3) 조각실의 미켈란젤로 · 화실 둘째 칸의 김홍도
      put('michelangelo', 2); put('h_kimhongdo', 5);
      for (let d = 0; d < 100; d++) ST.daily();
      out.sculpture = (s.fleet.cargo.sculpture || {}).q || 0; out.eaart = (s.fleet.cargo.eaart || {}).q || 0;
      out.pend2 = s.studio.pend.map(p => p.by + ':' + p.kind + ':' + p.name);
      // 4) 바치기 (대화는 흘려보낸다)
      const say = UI.say, alert = UI.alert; let cards = 0;
      UI.say = async () => {}; UI.alert = async (h) => { if (/mw-card/.test(h) && /<img class="mw-img"/.test(h)) cards++; return true; };
      const so0 = G.Fame.sync().so, items0 = s.player.items.length;
      await ST.present();
      UI.say = say; UI.alert = alert;
      out.cards = cards; out.soGain = G.Fame.sync().so - so0; out.items = s.player.items.length - items0;
      out.mwItems = s.player.items.filter(it => it.mw).map(it => [it.name, it.value, G.R.itemName(it)]);
      out.works = ST.works().length; out.pendLeft = s.studio.pend.length;
      // 5) 음악실 · 참모실
      out.musicNo = CB.fx('musicroom', 'musicroom');
      put('h_hwangjini', 3);
      out.music = CB.fx('musicroom', 'musicroom');
      out.staffNo = CB.fx('staff', 'staff');
      const ops = G.MATES.filter(m => (m.sk.ops || 0) >= 2 && !s.mates.some(x => x.id === m.id))[0];
      put(ops.id, 4); out.staffMate = ops.name;
      out.staff = CB.fx('staff', 'staff'); out.staffDmg = CB.fx('staff', 'staffDmg');
      out.sculptGood = !!G.GOOD.sculpture && G.CITY_DATA.filter(c => c.name === '피렌체')[0].goods.indexOf('sculpture') >= 0;
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.cabins.every(Boolean) && r.slots >= 5, '새 방 넷(화실·조각실·음악실·참모실)을 조선소에서 고칠 수 있고 방 그림이 있다 (선실 ' + r.slots + '칸)');
    ok(r.taleArt > 0 && r.tazePend === 0, '이야기 속 인물(잠자는 숲속의 공주)은 미술품 ' + r.taleArt + '통만 그리고 명작은 없다');
    ok(r.leoArt > r.taleArt && /레오나르도 다 빈치.*미술품/.test(r.msg || '') && r.pend.length === 1 && r.pend[0][0] === 'leonardo' && r.pend[0][3] >= 10000, '레오나르도: 미술품을 싣고 백 일 안에 명작 「' + (r.pend[0] || [])[2] + '」 (값 ' + (r.pend[0] || [])[3] + ', 사교 +' + (r.pend[0] || [])[4] + ')');
    ok(r.sculpture > 0 && r.eaart > 0 && r.pend2.some(x => /^michelangelo:sculpt:/.test(x)) && r.pend2.some(x => /^h_kimhongdo:paint:/.test(x)), '조각실의 미켈란젤로: 조각품 ' + r.sculpture + '통 + 조각 명작 · 김홍도는 동양 서화 ' + r.eaart + '통 + 명작 (' + r.pend2.join(' / ') + ')');
    ok(r.cards === r.pend2.length && r.pendLeft === 0 && r.works === r.pend2.length && r.items === r.pend2.length && r.mwItems.every(x => x[1] >= 3000 && x[0] === x[2]), '명작을 바친다: 카드 ' + r.cards + '장 · 소지품 ' + r.items + '점 ' + r.mwItems.map(x => x[0] + '(' + x[1] + ')').join(', '));
    ok(r.soGain > 0, '사교 명성 +' + r.soGain);
    ok(r.musicNo === 0 && r.music > 0, '음악실: 음악에 밝은 사람을 두면 하루 피로 −' + r.music.toFixed(2));
    ok(r.staffNo === 0 && r.staff > 0 && r.staffDmg > 0, '참모실: ' + r.staffMate + ' → 계략 성공률 +' + Math.round(r.staff * 100) + '%, 피해 ×' + (1 + r.staffDmg).toFixed(2));
    ok(r.sculptGood, '교역품 조각품 — 피렌체에서도 판다');

    // 육상전: 참모실이 있으면 계략 버튼의 성공률이 오른다
    const lw = await page.evaluate(async () => {
      const read = () => [...document.querySelectorAll('.lw-btns .btn')].map(b => b.textContent).filter(t => /기습|함정|저격/.test(t)).join(' | ');
      const s = G.Game.state, CB = G.Cabins;
      s.loc = { mode: 'land', lon: 10, lat: 45 };
      const keep = s.mates.filter(m => m.room != null && CB.rooms()[m.room] === 'staff')[0];
      const run = async () => {
        G.Games.landWar({ enemy: { name: '도적 떼', kind: 'bandit', n: 30 }, party: 40, terr: 'forest', guns: false });
        await new Promise(r => setTimeout(r, 400));
        const go = [...document.querySelectorAll('.lw-btns .btn')].filter(b => /전투|개시|시작/.test(b.textContent))[0]; if (go) go.click();
        await new Promise(r => setTimeout(r, 1800));
        const t = read();
        document.querySelectorAll('.modal-back').forEach(m => m.remove());
        return t;
      };
      CB.place(keep, null); const without = await run();
      CB.place(keep, keep.roomOld != null ? keep.roomOld : 4); const withStaff = await run();
      return { without, withStaff };
    });
    console.log(JSON.stringify(lw));
    const pct = t => (t.match(/기습\s*(\d+)%/) || [])[1];
    ok(pct(lw.without) && +pct(lw.withStaff) > +pct(lw.without), '육상전 기습: 참모 없이 ' + pct(lw.without) + '% → 참모실 ' + pct(lw.withStaff) + '%');

    // 화면: 실제 명작 카드
    await page.evaluate(async () => { G.Game.go('city', { cityId: G.CITY_DATA.filter(c => c.name === '피렌체')[0].id }); await new Promise(r => setTimeout(r, 2500)); G.Studio.make('raffaello', 'paint'); G.Studio.present(); });
    await page.waitForTimeout(1500); await page.mouse.click(800, 860);
    await page.waitForSelector('.mw-card', { timeout: 15000 }); await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'masterwork.png') });
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back .btn')].pop(); if (b) b.click(); });
    await page.waitForTimeout(500);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) {
    console.error('✗', e.message); if (errors.length) console.error(errors.slice(0, 5).join(' | ')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
