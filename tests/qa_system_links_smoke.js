/* QA 회귀 6건: 현재 괴물 위치·단서·선수상, 사망 시 정산, 사라진 도시 소문, 자동항해 재개.
   실제 게임 규칙과 저장을 사용하고 긴 대화만 생략한다. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url'), { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = process.env.OUT || path.join(ROOT, 'artifacts', 'qa-system-links-20261028');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const timeout = setTimeout(() => browser.close(), 120000);
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    page.on('pageerror', e => errors.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('console', m => { if (m.type() === 'log' && m.text().startsWith('QA:')) console.log(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { const raf = requestAnimationFrame; window.requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title' && G.SeaMonsters);
    const checks = await page.evaluate(async () => {
      const done = [], G = window.G, M = G.SeaMonsters, D = G.Disc, C = G.Scenes.city, UI = G.UI, R = G.R;
      const ok = (v, text) => { if (!v) throw Error(text); done.push(text); console.log('QA: ' + text); };
      function fresh(dying) {
        const s = G.Game.state = G.State.newGame({ name: '회귀 수정 확인', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 },
          st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        s.settings.res = .35; s.player.gold = 50000; s.flags.prologue = true;
        if (dying) { s.player.born = { y: 1400, m: 6, d: 10 }; s.date = { y: 1480, m: 6, d: 9 }; }
        return s;
      }
      let s = fresh(); await G.Game.ensureGeo();
      const e = M.sync().kraken, d = G.DISC.kraken, old = [d.lon, d.lat, d.hint];
      const c = G.CITY_DATA.filter(c => c.port && R.cityExists(c)).sort((a, b) => G.Geo.dist(e.lon, e.lat, a.lon, a.lat) - G.Geo.dist(e.lon, e.lat, b.lon, b.lat))[0];
      const keepSay = UI.say; UI.say = async () => {};
      try { await M.tell(c, {}, true); } finally { UI.say = keepSay; }
      ok(D.hasHint('kraken') && /^monster:/.test(s.hints.kraken.src), '3: 책 전용 크라켄도 실제 항구 목격을 단서로 기록');
      ok(!D.foundByMe('kraken'), '3: 소식만으로 발견 보상은 지급하지 않음');
      const unknown = G.DISCOVERIES.find(x => x.bookOnly && !M.is(x.id));
      ok(!D.addHint(unknown.id, 'monster:' + c.id + ':1'), '3: 일반 전설의 책 전용 제한은 유지');
      const goal = G.Plan.goalPoint(d);
      ok(goal.sea[0] === e.lon && goal.sea[1] === e.lat, '1: 원정 계획이 실제 괴물 출몰 좌표를 사용');
      ok(D.hintText(d).includes('현재 출몰:') && D.hintText(d).includes(G.U.fmtLat(e.lat)) && D.hintText(d).includes(G.U.fmtLon(e.lon)), '1: 단서에 현재 해역과 좌표 안내');
      ok(old[0] === d.lon && old[1] === d.lat && old[2] === d.hint && D.hintText(d).includes('옛 기록:'), '1: 기존 발견물 데이터와 문헌 내용 보존');
      const regular = G.DISCOVERIES.find(x => x.how === 'sea' && !M.is(x.id));
      ok(D.hintText(regular) === regular.hint && G.Plan.goalPoint(regular).sea[0] === regular.lon, '1: 일반 해상 발견물의 단서와 좌표는 유지');
      s.contract = { disc: d.id, sponsor: 'pt_king', due: 14850501, advance: 1000, reward: 5000 };
      const seen = [], canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      G.Info.chartMarks(ctx, (lon, lat) => { seen.push([lon, lat]); return [0, 0]; }, 12, 360, 960, 480, null, { noMarks: true });
      ok(seen.some(p => p[0] === e.lon && p[1] === e.lat) && !seen.some(p => p[0] === d.lon && p[1] === d.lat), '1: 계약 해도 표시도 현재 좌표를 사용');
      ok(C.B.tavern.targets(c).some(x => x.id === d.id), '1: 실제 출몰 항구에서 목표의 행방을 물을 수 있음');
      const raw = G.State.serialize(); G.Game.state = G.State.deserialize(raw); s = G.Game.state;
      ok(G.Plan.goalPoint(d).sea[0] === e.lon && D.hasHint(d.id), '1·3: 저장 후에도 좌표와 목격 단서 유지');
      const saved = G.U.clone(s.seaMonsters), date = G.U.clone(s.date);
      s.seaMonsters.entries.kraken.active = false;
      ok(G.Plan.goalPoint(d) === null && D.hintText(d).includes('최근 목격 소식은 없다'), '1: 출몰하지 않는 괴물은 옛 좌표를 목적지로 안내하지 않음');
      s.seaMonsters = saved; s.date = date;
      const chance = G.U.chance, current = M.sync().kraken;
      let odds = null; G.U.chance = p => { odds = p; return true; };
      try {
        s.fleet.ships[0].fig = null;
        ok(!M.repel(current), '2: 보호 선수상이 없으면 회피 효과 없음');
        s.fleet.ships[0].fig = 'unicorn';
        ok(M.repel(current) && odds === R.fleetBonus('monster'), '2: 일각수상의 실제 표시 확률로 괴물을 쫓음');
        ok(current.avoidUntil === G.U.dayIndex(s.date) + G.BALANCE.seaMonsters.avoidDays, '2: 보호 성공 뒤 회피 기한을 기록');
        G.U.chance = () => false; current.avoidUntil = -1;
        ok(!M.repel(current) && current.avoidUntil === -1, '2: 보호 판정 실패 시 조우를 허용');
      } finally { G.U.chance = chance; }
      s.fleet.ships[0].fig = null;
      s.disc.kraken = { found: G.U.dateNum(s.date), me: true };
      s.loc = { mode: 'sea', lon: current.lon, lat: current.lat, heading: 0 };
      G.Game.go('sea', { fresh: true });
      const rt = G.Scenes.sea.runtime(), ask = UI.ask;
      UI.ask = async () => 'leave';
      try {
        rt.path = [[current.lon, current.lat], [current.lon + 1, current.lat]]; rt.pathI = 1;
        rt.target = { lon: current.lon + 1, lat: current.lat }; rt.paused = false; rt.manual = false;
        await G.Scenes.sea.meetMonster('kraken');
        ok(!rt.paused && !!rt.path && rt.busy === 0, '6: 괴물에게서 물러나면 진행 중이던 자동항해 재개');
        rt.paused = true;
        await G.Scenes.sea.meetMonster('kraken');
        ok(rt.paused && rt.busy === 0, '6: 원래 정지 중이었다면 임의로 항해를 시작하지 않음');
        s.fleet.ships[0].fig = 'seagod'; G.U.chance = () => true;
        rt.paused = false; rt.frame = 9; current.avoidUntil = -1;
        let asked = false; UI.ask = async () => { asked = true; return 'leave'; };
        G.Scenes.sea.update(.01);
        ok(current.avoidUntil > G.U.dayIndex(s.date) && !asked && !rt.paused, '2·6: 실제 자동 조우에서 선수상이 막으면 대화 없이 항해 유지');
      } finally { UI.ask = ask; G.U.chance = chance; }
      G.Game.go('title');
      s = fresh(); const gone = G.CITY_DATA.find(c => c.until && c.goods.length);
      s.date.y = gone.until; s.known = [gone.id]; s.ledger = {};
      ok(!R.cityExists(gone) && G.Explore.marketTip() === null, '5: 사라진 도시만 알면 일반 시세 소문도 추천하지 않음');
      s.known.push(0);
      ok(Array.from({ length: 20 }, () => G.Explore.marketTip()).every(t => t && !t.includes(gone.name)), '5: 일반 소문 20회에서 유효한 도시만 추천');
      const fade = UI.fade, choose = UI.choose, confirm = UI.confirm, cask = C.ask, csay = C.say, hud = G.Game.refreshHud;
      const hometown = G.CITY_DATA[0]; let messages = [];
      UI.fade = async fn => fn(); UI.confirm = async () => true; C.ask = async () => 90;
      C.say = async (w, t) => messages.push(t); G.Game.refreshHud = () => {};
      try {
        s = fresh(true); const day = s.day, gold = s.player.gold;
        await C.B.inn.work(hometown);
        const pay = Math.round((8 + hometown.size * 4) * (0.8 + R.stat('str') / 150));
        ok(s.day - day === 1 && s.life.end && s.player.innJob.used === 1 && s.player.gold - gold === pay, '4: 사망일에 중단된 허드렛일은 실제 하루만 정산');
        ok(!messages.length && !(s.player.lg[hometown.lang] > 0), '4: 사망 후 완료 대사와 언어 습득 없음');
        const g = s.player.gold; await C.B.inn.work(hometown);
        ok(s.player.gold === g && s.player.innJob.used === 1, '4: 이미 사망한 상태에서는 일당을 반복 지급하지 않음');
        G.U.chance = () => true;
        s = fresh(true); messages = []; UI.choose = async () => 'survey';
        await C.B.guild.train(hometown);
        ok(s.life.end && !s.player.sk.survey && !messages.length, '4: 사망으로 중단된 특기 수행은 성공 처리하지 않음');
        s = fresh(true); UI.choose = async () => hometown.lang;
        await C.B.guild.lang(hometown);
        ok(s.life.end && !s.player.lg[hometown.lang] && !messages.length, '4: 사망으로 중단된 언어 공부도 성공 처리하지 않음');
        s = fresh(); UI.choose = async () => 'survey';
        await C.B.guild.train(hometown);
        ok(s.player.sk.survey === 1, '4: 정상적으로 끝난 수행의 보상은 유지');
        s = fresh(true); s.player.hp = 10;
        await C.B.home.rest(hometown);
        ok(s.life.end && s.player.hp === 10, '4: 자택 휴식 중 사망한 경우도 완료 회복 없음');
      } finally { UI.fade = fade; UI.choose = choose; UI.confirm = confirm; C.ask = cask; C.say = csay; G.Game.refreshHud = hud; G.U.chance = chance; }
      s = fresh(); s.seaMonsters = saved;
      const say = UI.say; UI.say = async () => {}; try { await M.tell(c, {}, true); } finally { UI.say = say; }
      s.contract = { disc: 'kraken', sponsor: 'pt_king', due: 14850501, advance: 1000, reward: 5000 };
      s.player.fame = 99999;
      G.Loader.hide(); G.Info.open('hints');
      return done;
    });
    await page.locator('.hint-item').first().waitFor();
    await page.waitForFunction(() => !G.Loader.shown());
    assert((await page.locator('.hint-item').allTextContents()).some(t => t.includes('현재 출몰:') && t.includes('괴물 목격 소식')));
    await page.screenshot({ path: path.join(OUT, 'monster-hints.png') });
    await page.keyboard.press('Escape');
    await page.evaluate(() => { G.Info.open('contract'); });
    await page.screenshot({ path: path.join(OUT, 'monster-contract.png') });
    assert((await page.locator('.win').innerText()).includes('현재 출몰:'));
    assert.deepEqual(errors, []);
    console.log('통과 ' + checks.length + '건 + 실제 단서·계약 화면, 콘솔 오류 0');
  } finally { clearTimeout(timeout); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
