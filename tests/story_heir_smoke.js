/* 이야기 모드에서 대를 이은 뒤 (js/systems/story.js · js/data/story.js G.STORY.homeLife.heir · heirTrace · ending.heirMeet)
   · 대를 잇는 순간 기록(s.story.line) — 물러난 제독의 본처(1부인)가 어머니, 사진·시계가 「할아버지의 …」로, 수첩 탭도 「할아버지의 사진」
   · 처음 집에 들어서면 어머니(본처)와 할머니(레오노르)가 맞고 사진을 물려준다 · 「어머니와 이야기」 메뉴는 본처의 이름
   · 「어머니와 이야기」·비상금 7,777닢은 본처가 한다 · 할머니는 가끔 들른다(신트라에서) · 새 제독의 아내와 어머니의 장면은 첫 대의 것 대신 새 장면
   · 흔적 장면: 제독의 대사는 손자의 것, 다른 사람의 「아버지」는 「할아버지」 · 아틀란티스에서는 할아버지와 손자의 만남
   · 콘솔 오류 0 · 스크린샷(어머니와 할머니가 마주 선 장면)
   node tests/story_heir_smoke.js   (스크린샷: OUT 또는 임시 폴더/story_heir) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'story_heir');
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
    await page.evaluate(() => { if (window.G && G.BALANCE && G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0; });
    await page.waitForFunction(() => window.G && G.Story && G.Family && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    const r = await page.evaluate(async () => {
      const UI = G.UI, log = [], keep = { say: UI.say, ask: UI.ask, alert: UI.alert, toast: UI.toast, fade: UI.fade, confirm: UI.confirm, choose: UI.choose, window: UI.window };
      UI.say = async (t, sp) => { log.push(((sp && sp.name) || '') + '│' + String(t)); };
      UI.ask = async (t, opts) => { log.push('?' + t); return opts[0].value; };
      UI.alert = async (t) => { log.push('!' + String(t).replace(/<[^>]+>/g, ' ')); }; UI.toast = () => {}; UI.fade = async fn => { if (fn) await fn(); };
      UI.confirm = async () => true; UI.choose = async (t, rows) => rows[0].value;
      UI.window = () => ({ result: Promise.resolve('ok'), content: document.createElement('div'), close() {} });
      const keepGo = G.Game.go; G.Game.go = () => {};
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: async () => {} });
      if (G.Siblings) G.Siblings.fromRetire = async () => [];
      G.Family.pickStorage = async () => [];
      const out = {};
      try {
        const s = G.Story.start(), c = G.CITY_DATA[s.player.home], HM = G.Scenes.city.B.home, INN = G.Scenes.city.B.inn;
        s.story.prologue = 1;
        const take = () => log.splice(0).join('\n');
        // 첫 대: 본처와 맏아들(17세), 흔적 하나를 찾은 상태
        const maid = G.MAIDS.filter(m => !m.royal)[0];
        s.player.wife = maid.id;
        s.date = { y: 1500, m: 6, d: 1 };
        s.player.kids = [{ name: '주앙', sex: 'm', mother: null, born: { y: 1482, m: 3, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 }];
        s.story.found = ['ft_granada']; s.disc.ft_granada = { me: true, found: 14820101, evidence: true };
        out.gen1Mother = G.Story.motherName();
        // 대를 잇는다
        await G.Family.succeed(s.player.kids[0], false);
        const S2 = G.Game.state, t = S2.story;
        out.succeedLog = take();
        out.gen = S2.player.generation; out.line = t.line && t.line[0];
        out.photo = (S2.player.items.find(i => i.id === 'photo') || {}).name;
        out.tab = G.Story.photoName();
        out.mother = G.Story.motherName(); out.grandma = G.Story.grandma().name;
        // 처음 집에 들어선다: 소개 장면 → 메뉴
        S2.player.gold = 9000; S2.player.bank = 0;
        await HM.enter(c); out.intro = take();
        out.menu = HM.menu(c).filter(Boolean).map(x => x.label + (x.sub ? '(' + x.sub + ')' : ''));
        await G.Story.motherTalk(); out.talk = take();
        // 비상금
        S2.player.gold = 1000;
        S2.date = G.U.addDays(S2.date, 3);
        await HM.enter(c); out.allow = take(); out.goldAfter = S2.player.gold;
        // 할머니가 들른다 (강제)
        const vis = [];
        for (let i = 0; i < 4; i++) { S2.date = G.U.addDays(S2.date, 40); if (await G.Story.grandmaVisit(c, true)) vis.push(take()); }
        out.visits = vis; out.gmSeen = Object.keys(t.gmSeen || {});
        // 새 제독이 장가를 들면: 아내와 어머니의 장면은 새 것만
        const maid2 = G.MAIDS.filter(m => !m.royal && m.id !== maid.id)[1];
        S2.player.wife = maid2.id;
        const fam = [];
        for (let i = 0; i < 6; i++) { S2.date = G.U.addDays(S2.date, 25); if (await G.Story.family(c, ['home', 'inn', 'mansion'][i % 3], true)) fam.push(take()); }
        out.fam = fam; out.famSeen = Object.keys(t.famSeen || {});
        // 흔적 장면: 카이로
        const sc = G.Story._heirScene('ft_granada', G.STORY.scenes.ft_granada.scene);
        out.traceP = sc.filter(l => l[0] === 'P').map(l => l[1]);
        out.traceOther = sc.filter(l => l[0] !== 'P' && l[0] !== 'N').map(l => l[1]).join(' ');
        await G.Story.onFind(G.DISC.ft_cairo); out.cairo = take();
        // 아틀란티스
        t.letter = 15010101;
        await G.Story.ending(); out.ending = take();
        out.watchless = !S2.player.items.some(i => i.id === 'watch');
      } finally { Object.assign(UI, keep); G.Game.go = keepGo; }
      return out;
    });
    const short = x => String(x || '').replace(/\n/g, ' / ').slice(0, 300);
    console.log('  대를 이을 때: ' + short(r.succeedLog));
    ok(r.gen1Mother === '레오노르 다 코스타', '첫 대의 어머니는 레오노르');
    ok(r.gen === 2 && r.line && r.line.mom && r.line.dadGiven === '마테우스', '대를 이으며 기록: 둘째 대, 아버지 마테우스, 어머니 = 물러난 제독의 본처 (' + (r.line && r.line.mom) + ')');
    ok(/집에 남아 .*어머니로 집을 지킨다/.test(r.succeedLog), '대를 잇는 창: 본처는 「집에 남아 어머니로 집을 지킨다」');
    ok(r.photo === '할아버지의 사진' && r.tab === '할아버지의 사진', '사진·수첩 탭이 「할아버지의 사진」');
    ok(r.mother !== '레오노르 다 코스타' && /레오노르 할머니/.test(r.grandma), '어머니 = ' + r.mother + ' · 할머니 = ' + r.grandma);
    console.log('  소개: ' + short(r.intro));
    ok(r.intro.indexOf(r.mother + '│') >= 0 && /레오노르 할머니│/.test(r.intro) && /할아버지의 사진/.test(r.intro) && /신트라/.test(r.intro), '처음 집에 들어서면 어머니(본처)와 할머니가 맞고 할아버지의 사진을 물려준다 (할머니는 신트라에서)');
    ok(r.menu.some(m => m.indexOf('어머니와 이야기(' + r.mother + ')') === 0), '「어머니와 이야기」는 본처: ' + r.menu.join(', '));
    ok(r.talk.indexOf(r.mother + '│') === 0, '어머니와 이야기 — 본처가 말한다: ' + short(r.talk));
    ok(r.goldAfter === 1000 + 7777 && r.allow.indexOf(r.mother + '│') >= 0, '비상금 7,777닢도 본처가 준다');
    console.log('  할머니가 들른다: ' + short(r.visits[0]));
    ok(r.visits.length === 4 && r.gmSeen.length === 4 && r.visits.every(v => /레오노르 할머니│/.test(v)), '할머니가 가끔 들른다 — 장면 ' + r.gmSeen.join(','));
    const gen1Only = ['h_kitchen', 'h_photo', 'h_preg', 'h_end', 'i_rumor', 'i_news', 'm_dinner', 'm_watch', 'm_giacomo'];
    ok(r.fam.length >= 3 && r.famSeen.some(id => /^hh_/.test(id)) && !r.famSeen.some(id => gen1Only.indexOf(id) >= 0), '새 제독의 아내와 어머니 장면: 첫 대의 장면은 빠지고 새 장면 — ' + r.famSeen.join(','));
    ok(/\{gf\}|할아버지/.test(r.traceP[0]) && !/아버지가 내 손바닥/.test(r.traceP[0]) && /자네 \{gf\}는 그라나다/.test(r.traceOther) && !/자네 아버지는 그라나다/.test(r.traceOther) && /남작 아버지/.test(r.traceOther), '흔적 장면: 제독 대사는 손자의 것, 다른 사람의 「아버지」는 「할아버지」 (자코모의 「남작 아버지」는 그대로)');
    ok(/아버지 마테우스가 밤마다 들려주던 이야기/.test(r.cairo), '흔적의 기억은 「아버지 마테우스가 밤마다 들려주던 이야기」로');
    console.log('  아틀란티스: ' + short(r.ending));
    ok(/마테우스\? 아니/.test(r.ending) && /마테우스의 아들, 주앙/.test(r.ending) && /신트라/.test(r.ending), '아틀란티스: 할아버지가 손자를 알아본다');

    // 화면: 어머니(본처)와 할머니가 마주 선 장면
    await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[s.player.home];
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: c.id });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Town && G.Town.active(), null, { timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); G.Game.state.story.gmSeen = {}; G.Story.grandmaVisit(G.CITY_DATA[G.Game.state.player.home], true); });
    await page.waitForFunction(() => document.querySelector('.dlg'), null, { timeout: 10000 });
    for (let i = 0; i < 2; i++) { await page.waitForTimeout(1200); await page.mouse.click(800, 820); }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, 'grandma_visit.png') });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
