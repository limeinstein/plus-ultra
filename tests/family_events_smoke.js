/* 가족 사건 점검 (js/systems/familyevent.js · js/data/familyevents.js · images/family-events)
   node tests/family_events_smoke.js   (스크린샷: OUT 또는 임시 폴더/family_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'family_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      window.__fresh = function (o) {
        o = o || {};
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state, p = s.player; s.date = { y: 1520, m: 6, d: 1 }; s.day = 4000; p.home = 0;
        const maids = Object.keys(G.MAID); window.__maid = G.MAID[maids[0]]; window.__maid2 = G.MAID[maids[1]];
        if (o.wife) p.wife = window.__maid.id;
        p.kids = (o.kids || []).map((a, i) => ({ name: ['주앙', '마리아', '페드루'][i], sex: i === 1 ? 'f' : 'm', born: { y: 1520 - a, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, bond: 50, aboard: !!(o.aboard && i === 0) }));
        if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
        return s;
      };
      // 대화 창은 글만 모은다
      window.__said = []; window.__asks = [];
      G.UI.__say = G.UI.say; G.UI.__ask = G.UI.ask;
      G.UI.say = async (t, sp) => { window.__said.push([(sp && sp.name) || '', String(t), !!document.querySelector('.famscene')]); };
      G.UI.ask = async (t, opts) => { window.__asks.push(String(t)); const o = opts.filter(x => x && !x.dis)[0]; return o ? o.value : null; };
      G.UI.alert = async () => {}; G.UI.choose = async (t, rows) => rows[0].value; G.UI.prompt = async (t, v) => v; G.UI.confirm = async () => true;
      window.__fresh({ wife: true });
      const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });

    // ① 자료: 사건 32가지 · 그림 30장 모두 등록
    const data = await page.evaluate(() => {
      const E = G.FAMILY_EVENTS, ats = {};
      E.forEach(e => { ats[e.at] = (ats[e.at] || 0) + 1; });
      return { n: E.length, imgs: new Set(E.map(e => e.img)).size, missing: E.filter(e => !G.Img.file(e.img)).map(e => e.id), ats };
    });
    console.log(JSON.stringify(data));
    ok(data.n === 32 && data.imgs === 30 && !data.missing.length, '가족 사건 32가지, 그림 30장 모두 쓰고 모두 등록됨 — ' + JSON.stringify(data.ats));

    // ② 등장인물에 따라 대화가 늘고 준다 — 같은 귀환 장면, 아이 없음 / 어린 아이 둘 / 큰 아이·갓난아기
    const casts = await page.evaluate(() => {
      const FE = G.FamEv, ev = FE.EV('ret_door'), out = {};
      function run(kids, babyAge) {
        const s = window.__fresh({ wife: true, kids: kids });
        if (babyAge != null) s.player.kids.push({ name: '이네스', sex: 'f', born: { y: 1520, m: 1, d: 1 }, sk: {}, lg: {}, st: {}, edu: {} });
        const hk = FE.homeKids(), cs = FE.fits(ev, FE.cast({ at: 'return', love: FE.mainWife(), kids: hk.kids, babies: hk.babies, days: 200 }));
        return FE.lines(ev, cs).map(l => l[2] + ':' + l[1].slice(0, 18));
      }
      out.none = run([]); out.two = run([6, 4]); out.big = run([14], 0);
      // 같은 바다 장면: 애인(아내)만 / 부관 / 견습 아이
      const sea = FE.EV('sea_sunset');
      let s = window.__fresh({ wife: true }); s.player.wifeAboard = true;
      out.sea0 = FE.lines(sea, FE.fits(sea, FE.cast({ at: 'sea', love: FE.aboardWife(), kids: [], mate: false }))).map(l => l[2]);
      out.seaMate = FE.lines(sea, FE.fits(sea, FE.cast({ at: 'sea', love: FE.aboardWife(), kids: [], mate: true }))).map(l => l[2]);
      s = window.__fresh({ wife: true, kids: [6], aboard: true }); s.player.wifeAboard = true;
      out.seaKid = FE.lines(sea, FE.fits(sea, FE.cast({ at: 'sea', love: FE.aboardWife(), kids: FE.aboardKids(), aboard: true, mate: true }))).map(l => l[2] + ':' + l[1].slice(0, 12));
      // 애인만의 장면은 아내와는 나오지 않는다
      out.noteWife = !!FE.fits(FE.EV('tav_note'), FE.cast({ at: 'tavern', love: FE.mainWife(), kids: [] }));
      out.noteLover = !!FE.fits(FE.EV('tav_note'), FE.cast({ at: 'tavern', love: FE.lover(window.__maid2), kids: [] }));
      // 나이: 키 재기(3~15)는 큰 아이만 있으면 못 고르고, 잠자리(3~10)는 맞는 아이를 맏이 자리로
      s = window.__fresh({ wife: true, kids: [16] });
      out.heightOld = !!FE.fits(FE.EV('fam_height'), FE.cast({ at: 'home', love: FE.mainWife(), kids: FE.homeKids().kids }));
      s = window.__fresh({ wife: true, kids: [13, 5] });
      const bc = FE.fits(FE.EV('fam_bedtime'), FE.cast({ at: 'home', love: FE.mainWife(), kids: FE.homeKids().kids }));
      out.bedK1 = bc && bc.kids[0].name;
      return out;
    });
    console.log(JSON.stringify(casts));
    ok(casts.none.length === 3 && casts.two.length === 5 && casts.big.length === 5 && casts.two.some(l => /^k2:/.test(l)) && casts.big.some(l => /^k1:\(문간/.test(l)) && casts.big.some(l => /^love:.*이네스/.test(l)),
      '귀환: 아이 없으면 3줄 · 어린 아이 둘이면 5줄(둘째도 말함) · 큰 아이와 갓난아기면 큰 아이 대사·아기 이름이 들어감');
    ok(casts.sea0.indexOf('mate') < 0 && casts.seaMate.indexOf('mate') >= 0 && casts.seaKid.some(l => /^k1:아버지! 어머니/.test(l)) && casts.seaKid.indexOf('mate') < 0,
      '노을 진 난간: 부관이 있으면 자리를 비키고, 견습 아이가 타고 있으면 아이가 끼어든다 (부관 줄은 빠짐)');
    ok(!casts.noteWife && casts.noteLover, '탁자 아래의 쪽지는 애인(여급)과만');
    ok(!casts.heightOld && casts.bedK1 === '마리아', '아이 나이: 16살만 있으면 키 재기 없음 · 잠자리 장면은 5살 아이가 주인공');

    // ③ 바다 위 — 배에 아내가 있으면
    const sea = await page.evaluate(async () => {
      const s = window.__fresh({ wife: true, kids: [9], aboard: true }); s.player.wifeAboard = true; s.fleet.fatigue = 50;
      G.BALANCE.famEv.seaChance = 1; window.__said = [];
      const r1 = await G.FamEv.atSea(), r2 = await G.FamEv.atSea();
      return { r1, r2, said: window.__said.length, pic: window.__said.some(x => x[2]), fat: s.fleet.fatigue, seen: Object.keys(s.player.famEv.seen), love: s.player.wifeLove };
    });
    console.log(JSON.stringify(sea));
    ok(sea.r1 && !sea.r2 && sea.said >= 4 && sea.pic && sea.love > 70 && /^sea_/.test(sea.seen[0]), '바다: 아내와 「' + sea.seen[0] + '」 (그림과 함께), 정이 쌓임 · 20일 안에는 다시 안 일어남');

    // ④ 술집 데이트 · 배에 탄 아내와 한잔
    const tav = await page.evaluate(async () => {
      const s = window.__fresh({ wife: false }), m = window.__maid2, c = G.CITY_DATA[m.city];
      s.maids[m.id] = { aff: 30, met: 1 };
      const before = G.FamEv.canDate(m.id);
      s.maids[m.id].aff = 60; const can = G.FamEv.canDate(m.id);
      window.__said = []; await G.FamEv.date(c, m);
      const after = G.FamEv.canDate(m.id);
      const s2 = window.__fresh({ wife: true }); s2.player.wifeAboard = true;
      const menu = G.Scenes.city.B.tavern.menu(G.CITY_DATA[0]).filter(Boolean).map(x => x.label);
      return { before: before.ok, can: can.ok, aff: s.maids[m.id].aff, after: after.ok, why: after.why, seen: Object.keys(s.player.famEv.seen), menu: menu.indexOf('아내와 한잔한다') >= 0 };
    });
    console.log(JSON.stringify(tav));
    ok(!tav.before && tav.can && tav.aff > 60 && !tav.after && /^tav_/.test(tav.seen[0]), '여급: 호감 40부터 「함께 시간을 보낸다」 → ' + tav.seen[0] + ' (호감 60 → ' + tav.aff + ', 다음은 ' + tav.why + ')');
    ok(tav.menu, '배에 아내가 있으면 술집 메뉴에 「아내와 한잔한다」');

    // ⑤ 혼례: 여급 → 술집 잔치(본처·둘째), 부하 → 갑판 혼례
    const wed = await page.evaluate(async () => {
      let s = window.__fresh({ wife: true }); s.mates.forEach(m => { m.role = 'none'; });
      window.__said = []; await G.FamEv.wedding({ id: window.__maid.id, city: 0 });
      const a = window.__said.map(x => x[0] + ':' + x[1].slice(0, 16));
      s = window.__fresh({ wife: true }); G.Wives.list().push({ id: window.__maid2.id, kind: 'maid', city: window.__maid2.city, house: true, aboard: false });
      window.__said = []; await G.FamEv.wedding({ id: window.__maid2.id, second: true, city: window.__maid2.city });
      const b = window.__said.map(x => x[1]);
      s = window.__fresh({}); const mid = Object.keys(G.MATE).filter(id => G.MATE[id].g === 'f' || G.MATE[id].female)[0] || Object.keys(G.MATE)[0]; s.player.wife = mid;
      window.__said = []; await G.FamEv.wedding({ id: mid });
      return { a, b, ship: s.player.famEv.lastId, npc: window.__said.some(x => x[0] === '갑판장') };
    });
    console.log(JSON.stringify(wed));
    ok(wed.a.some(l => /^술집 주인:/.test(l)) && wed.b.some(t => /부인이 계신 걸 알아요/.test(t)) && !wed.a.some(l => /부인이 계신/.test(l)), '술집의 혼례 잔치: 술집 주인이 축하하고, 둘째 부인일 때만 「부인이 계신 걸 알아요」');
    ok(wed.ship === 'wed_ship' && wed.npc, '부하였던 사람과는 갑판 위의 혼례 (갑판장의 주례)');

    // ⑥ 집: 오래 떠났다 돌아온 날 · 아기 소식 · 해산 · 집의 하루
    const home = await page.evaluate(async () => {
      const s = window.__fresh({ wife: true, kids: [7] }), p = s.player, HM = G.Scenes.city.B.home, c = G.CITY_DATA[0];
      p.homeSeen = s.day - 100; p.preg = { since: s.day - 50, due: s.day + 216, told: false };
      G.BALANCE.famEv.homeChance = 1; window.__said = [];
      await HM.enter(c);
      const r = { seen: Object.assign({}, p.famEv.seen), told: p.preg.told, said: window.__said.map(x => x[1].slice(0, 14)) };
      // 다시 들어가면(같은 날) 귀환 장면은 없다 · 며칠 뒤 임신 중이면 배를 감싸는 손
      s.day += 10; p.homeEvt = null; window.__said = [];
      await HM.enter(c); r.second = Object.keys(p.famEv.seen).filter(id => !r.seen[id]);
      // 해산을 지켜본 아기 (이름을 지은 뒤 그림)
      p.preg = null; p.kids.push({ name: '', unnamed: true, sex: 'f', born: { y: 1520, m: 6, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, witness: true, bond: 60 });
      s.day += 30; window.__said = [];
      await G.Family.homeVisit(false);
      r.birth = p.famEv.lastId; r.birthNamed = window.__said.filter(x => x[2]).some(x => /강보/.test(x[1]));
      r.babyName = p.kids[p.kids.length - 1].name;
      return r;
    });
    console.log(JSON.stringify(home));
    ok(Object.keys(home.seen).some(id => /^ret_/.test(id)) && home.seen.preg_news && home.told, '100일 만에 집: 귀환 장면 ' + Object.keys(home.seen).join('·') + ' (아기 소식은 나침반 곁의 아기 신발)');
    ok(home.second.indexOf('preg_touch') >= 0, '임신 중에 다시 들르면 「창가에서 감싸는 손」');
    ok(home.birth === 'birth_hands' && home.birthNamed, '해산을 지켜본 아기는 이름을 지은 뒤 「두 사람의 손에 안긴 아기」 (' + home.babyName + ')');

    const day = await page.evaluate(async () => {
      const s = window.__fresh({ wife: true, kids: [9, 5] }), p = s.player; p.homeSeen = s.day - 3;
      G.BALANCE.famEv.homeChance = 1; const got = [];
      for (let i = 0; i < 8; i++) { s.day += 30; p.homeSeen = s.day - 3; p.homeEvt = null; G.FamEv.entry = null; await G.FamEv.homeDay(); got.push(p.famEv.lastId); }
      return got;
    });
    console.log(JSON.stringify(day));
    ok(new Set(day).size >= 5 && day.every(id => /^fam_/.test(id)), '집의 하루 여덟 번: ' + day.join(' · ') + ' (같은 장면이 잇달아 나오지 않게 고름)');

    // ⑦ 항구: 배에 탄 아이 · 고향 부두 마중
    const port = await page.evaluate(async () => {
      const s = window.__fresh({ wife: true, kids: [10], aboard: true }), p = s.player;
      G.BALANCE.famEv.portChance = 1; G.BALANCE.famEv.dockChance = 1;
      await G.FamEv.arrive(G.CITY_DATA[1]); const a = p.famEv.lastId;
      p.homeSeen = s.day - 200; await G.FamEv.arrive(G.CITY_DATA[0]); const b = p.famEv.lastId;
      window.__said = []; await G.FamEv.homeReturn(); const c = window.__said.length;
      return { a, b, c };
    });
    ok(port.a === 'fam_laundry' && port.b === 'dock_embrace' && port.c === 0, '항구: 견습 아이와 「정박한 배의 빨래」 · 200일 만의 고향 부두 마중 (그날 집에서는 귀환 장면을 되풀이하지 않음)');

    // ⑧ 화면: 실제 대화 창과 그림 (가족 등불 축제 · 술집 춤)
    await page.evaluate(() => { G.UI.say = G.UI.__say; G.UI.ask = G.UI.__ask; });
    for (const [id, opt, name] of [['fam_lanterns', { wife: true, kids: [9, 6] }, 'lanterns'], ['tav_dance', { wife: true }, 'dance']]) {
      await page.evaluate(([id, opt]) => {
        const s = window.__fresh(opt), FE = G.FamEv, hk = FE.homeKids();
        window.__done = false; FE.play(id, FE.cast({ love: FE.mainWife(), kids: hk.kids, babies: hk.babies, mate: true })).then(() => { window.__done = true; });
      }, [id, opt]);
      await page.waitForTimeout(1800);
      await page.keyboard.press('Enter'); await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, 'family_' + name + '.png') });
      if (name === 'lanterns') { var vis = await page.evaluate(() => { const b = document.querySelector('.famscene img'); return b ? [b.naturalWidth, b.getBoundingClientRect().width | 0] : null; }); }
      for (let i = 0; i < 12 && !(await page.evaluate(() => window.__done)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
    }
    ok(vis && vis[0] === 576, '그림이 화면에 뜬다 (원본 ' + (vis && vis[0]) + '×256)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
