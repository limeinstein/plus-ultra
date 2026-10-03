/* 콜론의 카르낙 항해 점검 (경쟁 탐험가가 발견물을 찾아 발표하는 첫 사례):
   1480년 5월 1일 시작 → 리스본 술집 「항해사를 찾는다」 명부에 콜론(고용 불가 — 이야기만, 주인 귀띔·단서) → 5월 6일 리스본을 떠나
   브르타뉴로 가는 탐험 함대(바다에 있는 동안 술집에 없음) → 6월 1일 리스본에서 「카르낙 거석군」 발표 → 다시 술집에.
   node tests/colon_carnac_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'colon_carnac_shots');
const NM = '크리스토발 콜론';
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  // 대화창을 넘기고(Enter), 선택지는 글자로 누른다
  async function advance(n) { for (let i = 0; i < (n || 1); i++) { await page.waitForTimeout(300); await page.keyboard.press('Enter'); } }
  async function choose(label) { await page.locator('.askrow button', { hasText: label }).first().click(); await page.waitForTimeout(350); }
  const bodyText = () => page.evaluate(() => [...document.querySelectorAll('.dlg .body')].map(e => e.innerText).join(' | '));
  const menuOf = () => page.evaluate(() => { const c = G.CITY_DATA[0]; return G.Scenes.city.B.tavern.menu(c).filter(Boolean).map(x => ({ label: x.label, sub: x.sub || '', dim: !!x.dim })); });
  const listNames = () => page.evaluate(() => G.Scenes.city.B.tavern.hireList(G.CITY_DATA[0]).map(m => m.name));
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm', { timeout: 30000 });
    await page.fill('#nm', '이강희');   // 시험 캐릭터 — 엔터로 바로 시작
    await page.evaluate(() => { G.Scenes.city.prologue = async function () { G.Game.state.flags.prologue = true; }; });
    await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.player, null, { timeout: 90000 });
    await page.waitForTimeout(1500);

    // 1) 자료
    const r0 = await page.evaluate((NM) => {
      const s = G.Game.state, d = G.DISC.carnac, ex = G.EXPEDITIONS.find(e => e.id === 'colon0');
      const P = G.SeaFolk.track(ex), land = P.filter(p => !G.Geo.isSea(p.lon, p.lat, 1)).length;
      return { date: s.date, city: s.loc.city, rival: d.rival, home: (G.SeaFolk.rivalCity(NM) || {}).name, atSea: G.SeaFolk.atSeaName(NM), n: P.length, land,
        span: G.SeaFolk.span(ex).map(t => G.U.fmtDate ? G.U.fmtDate(G.U.dateOf ? G.U.dateOf(t) : s.date) : t) };
    }, NM);
    console.log('  항로 점 ' + r0.n + '개, 뭍에 걸린 점 ' + r0.land);
    ok(r0.date.y === 1480 && r0.date.m === 5 && r0.city === 0, '1480년 5월 1일 리스본에서 시작');
    ok(r0.rival && r0.rival[0] === 1480 && r0.rival[1] === 6 && r0.rival[2] === NM, '카르낙 거석군 — 콜론이 1480년 6월 발표');
    ok(r0.home === '리스본' && !r0.atSea, '콜론은 리스본에 머문다 (아직 항구에)');

    // 2) 리스본 술집 — 주인 귀띔, 메뉴, 대화(고용 불가·계획·단서)
    let menu = await menuOf();
    ok(!menu.some(x => /콜론/.test(x.label)), '따로 있던 「콜론과 이야기」 메뉴는 없다');
    const cnt = await page.evaluate(() => G.Scenes.city.B.tavern.candidates(G.CITY_DATA[0]).length);
    const hm = menu.find(x => x.label === '항해사를 찾는다');
    ok(hm && hm.sub === (cnt + 1) + '명', '「항해사를 찾는다」 ' + hm.sub + ' (항해사 ' + cnt + ' + 콜론)');
    ok((await listNames()).includes(NM), '명부에 크리스토발 콜론');
    await page.evaluate(() => { G.Scenes.city.visit('tavern').catch(e => console.error(e)); });
    await page.waitForTimeout(2500);
    let t = await bodyText();
    for (let i = 0; i < 4 && !/콜론/.test(t); i++) { await advance(); t = await bodyText(); }
    ok(/크리스토발 콜론이라는 자/.test(t), '술집에 들어가면 주인이 콜론을 귀띔');
    await page.screenshot({ path: path.join(OUT, '1_keeper.png') });
    await advance(2);
    await page.waitForTimeout(800);
    // 「항해사를 찾는다」 → 명부에서 콜론 → 카드 → 만나서 이야기한다
    await page.locator('.menu .item, button, .btn, [role="button"], div', { hasText: /^항해사를 찾는다/ }).last().click().catch(() => {});
    await page.waitForTimeout(800);
    if (!(await page.locator('.hire-list').count())) { await page.evaluate(() => { G.Scenes.city.B.tavern.hire(G.CITY_DATA[0]).catch(e => console.error(e)); }); await page.waitForTimeout(800); }
    await page.locator('.hire-row', { hasText: NM }).click();
    await page.waitForTimeout(600);
    const card = await page.evaluate(() => document.querySelector('.hire-card').innerText);
    ok(/고용할 수 없다/.test(card) && /리스본에 머묾/.test(card) && /항해술/.test(card), '카드: 「고용할 수 없다」·리스본에 머묾·능력치/특기/말');
    const row = await page.evaluate((NM) => [...document.querySelectorAll('.hire-row')].find(r => r.innerText.indexOf(NM) >= 0).innerText, NM);
    ok(/고용 불가/.test(row), '명부 줄: ' + row.replace(/\s+/g, ' '));
    await page.screenshot({ path: path.join(OUT, '2_hirelist.png') });
    await page.locator('.hire-card button', { hasText: '만나서 이야기한다' }).click();
    await page.waitForTimeout(1500);
    t = await bodyText();
    ok(/제노바에서 났지만/.test(t), '처음 만나면 자기소개');
    await page.screenshot({ path: path.join(OUT, '3_intro.png') });
    await advance();
    await page.waitForTimeout(600);
    await choose('부하로 고용한다');
    t = await bodyText();
    ok(/남의 배에 타는 사람이 아니오/.test(t), '「부하로 고용한다」 → 거절');
    await page.screenshot({ path: path.join(OUT, '4_hire_refused.png') });
    await advance();
    await page.waitForTimeout(500);
    const hadHint = await page.evaluate(() => !!G.Game.state.hints.carnac);
    await choose('정보를 듣는다');
    t = await bodyText();
    ok(/카르낙/.test(t) && /다음 달 초/.test(t), '정보: 북쪽 카르낙으로 — 다음 달 초 리스본에서 알린다');
    await advance();
    await page.waitForTimeout(500);
    ok(await page.evaluate(() => !!G.Game.state.hints.carnac), '카르낙 단서 ' + (hadHint ? '(이미 있었음)' : '얻음'));
    await choose('떠난다');
    await page.waitForTimeout(600);
    const mates = await page.evaluate((NM) => G.Game.state.mates.map(m => (G.MATE[m.id] || {}).name || m.id).concat(G.MATES.filter(m => m.name === NM).map(m => m.name)), NM);
    ok(!mates.includes(NM), '동료가 되지 않았다 (G.MATES에도 없음)');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(w => w.remove()); });

    // 3) 5월 10일 — 바다에 나가 있다
    const r1 = await page.evaluate((NM) => {
      const msgs = G.Game.passDays(9), s = G.Game.state, ex = G.EXPEDITIONS.find(e => e.id === 'colon0');
      const p = G.SeaFolk.posAt(ex, G.U.dayIndex(s.date));
      return { date: s.date, atSea: G.SeaFolk.atSeaName(NM), p, voy: G.SeaFolk.voyages().map(e => e.id), msgs: msgs.map(m => m.text) };
    }, NM);
    ok(r1.atSea && r1.p && r1.voy.includes('colon0'), '5월 10일: 콜론의 탐험 함대가 바다에 (북위 ' + r1.p.lat.toFixed(1) + ' 서경 ' + (-r1.p.lon).toFixed(1) + ')');
    ok(!(await listNames()).includes(NM), '그동안 명부에 없다 (바다에 나가 있다)');
    const r15 = await page.evaluate(() => { G.Game.passDays(8); const s = G.Game.state, ex = G.EXPEDITIONS.find(e => e.id === 'colon0'); const p = G.SeaFolk.posAt(ex, G.U.dayIndex(s.date)); return { p, d: G.Geo.dist(p.lon, p.lat, G.DISC.carnac.lon, G.DISC.carnac.lat) }; });
    ok(r15.d < 1, '5월 18일: 카르낙 앞바다(키브롱만)에 머문다 (' + r15.d.toFixed(2) + '°)');

    // 4) 6월 1일 — 리스본에서 발표
    const r2 = await page.evaluate((NM) => {
      const s = G.Game.state, msgs = [];
      while (!(s.date.m === 6 && s.date.d === 1)) msgs.push(...G.Game.passDays(1));
      return { date: s.date, st: s.disc.carnac, atSea: G.SeaFolk.atSeaName(NM), msgs: msgs.map(m => m.text), log: JSON.stringify(s.log || '').indexOf('카르낙') >= 0 };
    }, NM);
    console.log('  소식: ' + r2.msgs.filter(x => /카르낙|콜론/.test(x)).join(' / '));
    ok(r2.st && r2.st.rival === NM, '6월 1일: 카르낙 거석군은 콜론의 발견으로 (s.disc.carnac.rival)');
    ok(r2.msgs.some(x => x.indexOf(NM + '이 리스본에서 「카르낙 거석군」의 발견을 발표했다') >= 0), '소식: 「크리스토발 콜론이 리스본에서 「카르낙 거석군」의 발견을 발표했다.」');
    ok(!r2.atSea, '돌아와서 다시 리스본 술집에');
    // 세상의 소식 창이 실제로 뜨는 모습 (도시에서 날이 지날 때 쓰는 함수가 있으면)
    await page.evaluate((msgs) => { if (G.UI.news) G.UI.news(msgs.map(t => ({ icon: 'flag', text: t, history: true }))); }, r2.msgs.filter(x => /카르낙/.test(x)));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '5_news.png') });
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(w => w.remove()); });
    ok((await listNames()).includes(NM), '명부에 다시 콜론');
    await page.evaluate((NM) => { const c = G.CITY_DATA[0]; G.Scenes.city.B.tavern.rivalTalk(c, NM).catch(e => console.error(e)); }, NM);
    await page.waitForTimeout(1200);
    await choose('정보를 듣는다');
    t = await bodyText();
    ok(/카르낙에 다녀왔소/.test(t), '발표 뒤 대화: 「카르낙에 다녀왔소!」');
    await page.screenshot({ path: path.join(OUT, '6_after.png') });
    await advance(); await page.waitForTimeout(400);
    t = await bodyText();
    ok(/토스카넬리/.test(t), '다음 꿈: 서쪽 바다 (서회항로는 아직 멀어 단서는 주지 않음)');
    await advance(); await page.waitForTimeout(400);
    await choose('떠난다');

    // 5) 제독이 먼저 보고했으면 콜론은 떠나지 않고 발표도 없다 (새 상태에서)
    const r3 = await page.evaluate((NM) => {
      const s = G.Game.state;
      s.date = { y: 1480, m: 5, d: 1 }; delete s.disc.carnac; s.flags = Object.assign({}, s.flags);
      s.disc.carnac = { me: true, found: 14800502, reported: 'pt_king' };
      const atSea = (G.Game.passDays(9), G.SeaFolk.atSeaName(NM));
      const msgs = []; while (!(s.date.m === 6 && s.date.d === 2)) msgs.push(...G.Game.passDays(1));
      return { atSea, rival: s.disc.carnac.rival, msg: msgs.some(m => /카르낙/.test(m.text)) };
    }, NM);
    ok(!r3.atSea && !r3.rival && !r3.msg, '제독이 먼저 보고하면 콜론은 떠나지 않고 발표도 없다');
    await page.evaluate((NM) => { const c = G.CITY_DATA[0]; G.Scenes.city.B.tavern.rivalTalk(c, NM).catch(e => console.error(e)); }, NM);
    await page.waitForTimeout(1000);
    await choose('정보를 듣는다');
    t = await bodyText();
    ok(/당신이 먼저 알렸더군/.test(t), '그때 콜론: 「당신이 먼저 알렸더군」');
    await advance(2); await page.waitForTimeout(300);

    ok(!errors.length, '콘솔 오류 0 ' + errors.join('\n'));
  } catch (e) {
    console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1;
    await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {});
  } finally { await browser.close(); }
})();
