/* 둘째 부인 점검 (js/systems/wives.js)
   · 본처가 있을 때 여급에게 청혼 → 그 여급의 도시에 「○○의 집」, 거리·메뉴에 건물
   · 부하에게 청혼 → 함께 항해 / 본국 항구에서 숨으면 특기 0 / 다른 항구에서는 그대로
   · 본처를 배에 태우면 배의 둘째 부인은 제 집으로, 본처가 있는 동안 다시 태울 수 없음
   · 둘째 부인의 집에서 임신·출산·이름 짓기, 아이는 모두 합쳐 5명까지, 아이를 본국 자택으로
   · 뒤를 잇는 것은 아들뿐
   대화창은 시험용으로 저절로 넘긴다(UI.say·ask·confirm·choose를 바꿔 끼움). 마지막에 둘째 부인의 집 화면을 찍는다.
   node tests/wives_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'wives_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Wives && G.Wives.hooked, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      // 대화창 저절로 넘기기
      const UI = G.UI; window.PICK = {};
      const saved = { say: UI.say, ask: UI.ask, confirm: UI.confirm, alert: UI.alert, choose: UI.choose, prompt: UI.prompt };
      window.RESTORE = () => Object.assign(UI, saved);
      UI.say = async () => {}; UI.alert = async () => {}; UI.confirm = async () => true; UI.prompt = async (t, d) => d;
      UI.ask = async (t, ch) => { const l = ch.map(o => typeof o === 'string' ? o : o.value); return window.PICK.ask != null && l.includes(window.PICK.ask) ? window.PICK.ask : l[0]; };
      UI.choose = async (t, ch) => ch[0] && ch[0].value;
      const s = G.Game.state, p = s.player, W = G.Wives, by = n => G.CITY_DATA.find(c => c && c.name === n);
      const out = {};
      p.wife = 'm_lis';                                           // 본처: 리스본 여급
      // 1) 여급 둘째 부인
      const maid = G.MAIDS.find(m => m.city !== p.home && G.CITY_DATA[m.city] && G.CITY_DATA[m.city].port);
      p.items.push({ id: 'ring' });
      out.maidOK = await W.proposeMaid(G.CITY_DATA[maid.city], maid, async () => {});
      out.maidW = W.of(maid.id); out.maidCity = G.CITY_DATA[maid.city].name;
      out.bld = G.Scenes.city.buildings(G.CITY_DATA[maid.city]).map(b => b.kind + ':' + (b.arg || '')).filter(x => /house2/.test(x));
      out.bldHome = G.Scenes.city.buildings(G.CITY_DATA[p.home]).some(b => b.kind === 'house2');
      // 2) 부하 둘째 부인 — 함께 항해
      const md = G.MATES.find(m => m.g === 'f' && m.sk && Object.keys(m.sk).length);
      const sk = Object.keys(md.sk).sort((a, b) => md.sk[b] - md.sk[a])[0];
      const from = by('세빌리아') || by('카디스');
      s.mates.push({ id: md.id, role: 'first', joined: 0, loyal: 90, from: from.id, aff: 95 });
      p.items.push({ id: 'ring' });
      window.PICK.ask = 'sail';
      out.mateOK = await W.proposeMate(md, s.mates[s.mates.length - 1], async () => {});
      out.mateW = JSON.parse(JSON.stringify(W.of(md.id)));
      const row = () => s.mates.find(m => m.id === md.id);
      out.skillBefore = G.R.mateSkill(row(), sk);
      // 본국 항구(리스본)에 들어선다 — 반드시 숨게
      G.BALANCE.wives.hideHome = 1;
      const lis = G.CITY_DATA[p.home];
      s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat, heading: 0 };
      out.arrive = W.onArrive(lis).map(x => x.text);
      out.hidden = row().hidden; out.skillHidden = G.R.mateSkill(row(), sk); out.langHidden = G.R.mateLang(row(), 1);
      // 다른 나라 항구에서는 다시 보인다
      const ven = by('베니스');
      s.loc = { mode: 'city', city: ven.id, lon: ven.lon, lat: ven.lat, heading: 0 };
      W.onArrive(ven);
      out.skillAbroad = G.R.mateSkill(row(), sk);
      // 3) 본처를 배에 태운다 → 둘째 부인은 제 집(세빌리아)으로
      await W.boardWife();
      out.wifeAboard = p.wifeAboard; out.mateAfterWife = !!row(); out.mateHouse = JSON.parse(JSON.stringify(W.of(md.id)));
      await W.board(W.of(md.id));
      out.reboardBlocked = !row();
      await W.boardWife();                                         // 다시 집에 남긴다
      await W.board(W.of(md.id));
      out.reboard = !!row() && W.of(md.id).aboard;
      // 4) 둘째 부인(여급)의 집에서 아이
      const w = W.of(maid.id);
      w.preg = { since: s.day - 266, due: s.day, told: true };
      out.birth = W.daily().map(x => x.text);
      const kid = p.kids.find(k => k.mother === maid.id);
      out.kidHouse = kid && kid.house; out.kidCity = maid.city;
      s.loc = { mode: 'city', city: maid.city, lon: 0, lat: 0, heading: 0 };
      await W.visit(w, false);
      out.kidName = kid.name;
      // 아이 수 5명 제한
      for (let i = 0; i < 4; i++) p.kids.push({ name: 'K' + i, sex: i % 2 ? 'm' : 'f', born: { y: s.date.y - 20, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {} });
      out.total = W.kidTotal();
      w.tryDay = null; w.lastBirth = null; G.BALANCE.wives.conceive = 1;
      await W.visit(w, true);
      out.noMore = !w.preg;
      // 본국 자택으로 데려간다
      kid.born.y = s.date.y - 4;
      await W.sendHome(w);
      out.sentHouse = kid.house;
      s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat, heading: 0 };
      out.homeNews = W.onArrive(lis).map(x => x.text);
      out.atHome = kid.house == null;
      // 5) 후계자: 아들만
      out.heirs = G.Family.heirs().map(k => k.sex);
      out.info = G.Wives.infoWife();
      window.RESTORE();
      out.maidId = maid.id;
      return out;
    });
    ok(r.maidOK && r.maidW && r.maidW.house && !r.maidW.aboard, '여급 둘째 부인: ' + r.maidCity + '에 집');
    ok(r.bld.length === 1 && !r.bldHome, '그 도시에만 「…의 집」 건물 ' + JSON.stringify(r.bld));
    ok(r.mateOK && r.mateW.aboard && !r.mateW.house, '부하 둘째 부인: 함께 항해');
    ok(r.skillBefore > 0 && r.hidden != null && r.skillHidden === 0 && r.langHidden === 0, '본국 항구에서 숨음 → 특기·말 0 (전 ' + r.skillBefore + ')');
    ok(r.skillAbroad === r.skillBefore, '다른 나라 항구에서는 특기를 그대로 씀');
    ok(r.wifeAboard && !r.mateAfterWife && r.mateHouse.house && !r.mateHouse.aboard, '본처를 태우면 둘째 부인은 제 집으로');
    ok(r.reboardBlocked, '본처가 배에 있는 동안 둘째 부인은 탈 수 없음');
    ok(r.reboard, '본처를 집에 남기면 다시 함께 항해');
    ok(r.kidHouse === r.kidCity && r.birth.length, '둘째 부인의 집에서 출산 — ' + r.birth[0]);
    ok(r.kidName && r.kidName.length, '그 집에서 이름 짓기: ' + r.kidName);
    ok(r.total === 5 && r.noMore, '아이는 모두 합쳐 5명까지 (더 생기지 않음)');
    ok(r.sentHouse === -1 && r.atHome && r.homeNews.length, '아이를 본국 자택으로 — ' + r.homeNews[0]);
    ok(r.heirs.length && r.heirs.every(x => x === 'm'), '후계자는 아들만 (' + r.heirs.join(',') + ')');

    // 둘째 부인의 집 화면
    await page.evaluate((id) => { const m = G.MAID_BY ? null : G.MAIDS.find(x => x.id === id); G.Game.go('city', { cityId: m.city }); }, r.maidId);
    await page.waitForTimeout(2500);
    for (let i = 0; i < 10 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    await page.waitForTimeout(1500);
    await page.evaluate((id) => { G.Scenes.city.visit('house2', id); }, r.maidId);
    for (let i = 0; i < 40 && !(await page.evaluate(() => { const c = G.Scenes.city.current(); return c && c.kind === 'house2' && !G.UI.busy() && document.querySelector('.home-family'); })); i++) {
      if (await page.evaluate(() => G.UI.busy())) await page.mouse.click(800, 700);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(800);
    const menu = await page.evaluate(() => { const c = G.Scenes.city.current(); return c && c.kind === 'house2' ? c.B.menu(G.Scenes.city.city(), c.arg).filter(Boolean).map(x => x.label) : []; });
    await page.screenshot({ path: path.join(OUT, '1_house2.png') });
    ok(menu.some(t => /쉰다/.test(t)), '집 메뉴: ' + menu.slice(0, 6).join(' / '));
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ': ' + errors.join(' / ') : ''));
    console.log('스크린샷: ' + OUT);
  } catch (e) {
    console.error('✗ ' + e.message); if (errors.length) console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
