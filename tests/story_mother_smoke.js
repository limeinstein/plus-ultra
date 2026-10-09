/* 이야기 모드 — 자택의 어머니 · 비상금 · 아내와 어머니 (js/systems/story.js · js/data/story.js G.STORY.homeLife · js/city/misc.js · js/city/palace.js)
   · 리스본 자택에 들어서면 어머니가 맞고, 「어머니와 이야기」 메뉴가 있다 (보통 항해의 집에는 어머니가 없다)
   · 가진 돈(소지금+금고)이 2,000 이하로 집에 가면 비상금 7,777닢 — 180일 안에 다시 오면 못 받고, 지나면 또 받는다
   · 결혼하면 자택·여관·카사노바 남작 저택에서 아내와 어머니가 함께 나오는 장면을 마주친다 (곳마다 조건에 맞는 장면) · 콘솔 오류 0
   node tests/story_mother_smoke.js   (스크린샷: OUT 또는 임시 폴더/story_mother) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'story_mother');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Story && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    // 화면 대화는 흉내: 말한 사람·글을 적어 둔다
    const r = await page.evaluate(async () => {
      const UI = G.UI, log = [];
      const keep = { say: UI.say, ask: UI.ask, toast: UI.toast, fade: UI.fade };
      UI.say = async (t, sp) => { log.push(((sp && sp.name) || '') + '│' + String(t)); };
      UI.ask = async (t, opts) => { log.push('?' + t); return opts[0].value; };
      UI.toast = () => {}; UI.fade = async fn => { await fn(); };
      const out = {};
      try {
        const s = G.Story.start(), c = G.CITY_DATA[s.player.home], HM = G.Scenes.city.B.home, INN = G.Scenes.city.B.inn;
        s.story.prologue = 1;
        const take = () => log.splice(0).join('\n');
        // ① 어머니가 맞는다 · 메뉴
        s.player.gold = 9000; s.player.bank = 0;
        await HM.enter(c); out.greet = take();
        out.menu = HM.menu(c).filter(Boolean).map(x => x.label);
        out.sub = HM.sub(c);
        await G.Story.motherTalk(); out.talk = take();
        // ② 비상금
        s.player.gold = 1500; s.player.bank = 300;
        await HM.enter(c); out.allow1 = take(); out.gold1 = s.player.gold;
        s.player.gold = 800; s.player.bank = 0;
        await HM.enter(c); out.allowSoon = take(); out.gold2 = s.player.gold;
        s.date = G.U.addDays(s.date, 181);
        await HM.enter(c); out.allow2 = take(); out.gold3 = s.player.gold;
        s.player.gold = 2500;
        s.date = G.U.addDays(s.date, 200);
        await HM.enter(c); out.noAllow = take(); out.gold4 = s.player.gold;
        // ③ 결혼 — 아내와 어머니 (곳마다 하나씩 강제로, 그다음 자연 발생)
        const maid = G.MAIDS.filter(m => !m.royal)[0]; s.player.wife = maid.id; s.player.kids = [];
        out.wife = G.Family.wifeName();
        await G.Story.family(c, 'home', true); out.famHome = take();
        await G.Story.family(c, 'inn', true); out.famInn = take();
        await G.Story.family(c, 'mansion', true); out.famMansion = take();
        out.seen = Object.keys(s.story.famSeen);
        // 아이·흔적 조건 장면
        s.player.kids = [{ name: '주앙', sex: 'm', born: { y: 1480, m: 1, d: 1 } }]; s.story.found = ['ft_granada'];
        const all = [];
        for (let i = 0; i < 12; i++) { s.date = G.U.addDays(s.date, 25); await G.Story.family(c, ['home', 'inn', 'mansion'][i % 3], true); all.push(take()); }
        out.seenAll = Object.keys(s.story.famSeen).sort();
        out.kidLine = all.join('\n').indexOf('주앙') >= 0;
        // 자연 발생: 여관에 들어서면 (확률을 1로)
        const keepChance = G.U.chance; G.U.chance = () => true;
        s.date = G.U.addDays(s.date, 30); await INN.enter(c); out.innNatural = take(); G.U.chance = keepChance;
        // 다른 도시 여관에서는 없다
        s.date = G.U.addDays(s.date, 30); G.U.chance = () => true; await INN.enter(G.CITY_DATA[7]); out.innElse = take(); G.U.chance = keepChance;
        // ④ 보통 항해: 어머니 없음
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        G.Game.state.player.gold = 100;
        await HM.enter(G.CITY_DATA[G.Game.state.player.home]); out.normal = take(); out.normalGold = G.Game.state.player.gold;
        out.normalMenu = HM.menu(G.CITY_DATA[G.Game.state.player.home]).filter(Boolean).map(x => x.label);
      } finally { Object.assign(UI, keep); }
      return out;
    });
    const short = t => (t || '').replace(/\n/g, ' / ').slice(0, 260);
    console.log('  인사: ' + short(r.greet));
    ok(/레오노르/.test(r.greet) && r.menu.indexOf('어머니와 이야기') >= 0 && /어머니/.test(r.sub), '리스본 자택에 들어서면 어머니(레오노르)가 맞고 「어머니와 이야기」 메뉴가 있다 (' + r.sub + ')');
    ok(/레오노르/.test(r.talk), '어머니와 이야기: ' + short(r.talk));
    ok(r.gold1 === 1500 + 7777 && /비상금/.test(r.allow1), '가진 돈 1,800닢으로 집에 가면 어머니의 비상금 7,777닢 (소지금 ' + r.gold1 + ')');
    ok(r.gold2 === 800 && /지난번/.test(r.allowSoon), '180일 안에 다시 빈손으로 오면 못 받는다: ' + short(r.allowSoon));
    ok(r.gold3 === 800 + 7777 && /7,777/.test(r.allow2), '180일이 지나면 또 받는다 (소지금 ' + r.gold3 + ')');
    ok(r.gold4 === 2500 && !/비상금/.test(r.noAllow), '2,000닢이 넘으면 비상금이 없다');
    console.log('  자택: ' + short(r.famHome)); console.log('  여관: ' + short(r.famInn)); console.log('  저택: ' + short(r.famMansion));
    const both = t => /레오노르/.test(t) && t.indexOf(r.wife) >= 0;
    ok(both(r.famHome) && both(r.famInn) && both(r.famMansion), '결혼하면 자택·여관·남작 저택에서 아내(' + r.wife + ')와 어머니가 함께 나오는 장면');
    ok(/남작/.test(r.famMansion), '남작 저택 장면에는 남작도 나온다');
    ok(r.seenAll.length >= 10 && r.kidLine, '조건에 맞춰 장면 ' + r.seenAll.length + '가지 (아이 이름이 나오는 장면 포함): ' + r.seenAll.join(','));
    ok(both(r.innNatural) && !/레오노르/.test(r.innElse), '고향 여관에 들어서면 저절로 마주치고, 다른 도시 여관에서는 없다');
    ok(/먼지/.test(r.normal) && !/레오노르/.test(r.normal) && r.normalGold === 100 && r.normalMenu.indexOf('어머니와 이야기') < 0, '보통 항해의 집에는 어머니도 비상금도 없다');

    // 화면: 실제 대화창 (어머니·아내가 마주 서는지)
    await page.evaluate(async () => {
      const s = G.Story.start(); s.story.prologue = 1; const c = G.CITY_DATA[s.player.home];
      s.player.wife = G.MAIDS.filter(m => !m.royal)[0].id;
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: c.id });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Town && G.Town.active(), null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); const c = G.CITY_DATA[G.Game.state.player.home]; G.Story.family(c, 'home', true); });
    await page.waitForFunction(() => document.querySelector('.dlg'), null, { timeout: 10000 });
    for (let i = 0; i < 2; i++) { await page.waitForTimeout(1200); await page.mouse.click(800, 820); }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, 'home_family.png') });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
