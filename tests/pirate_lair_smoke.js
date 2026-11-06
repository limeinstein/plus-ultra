/* 해적의 소굴 · 본가의 네 공주 (2026-11-06) — node tests/pirate_lair_smoke.js   (BROWSER_EXE=크롬 경로)
   ① 자료: 일곱 바다의 소굴 · 소굴 간부가 이름난 해적 명부에 · 소굴 자리가 뭍(지도 표식)·물(배 대는 곳) · 바다 갈래가 맞는다
   ② 이름난 해적 셋(서로 다른 사람, 마지막은 실제 해전) → 사로잡은 해적의 실토 · 지도에 「제르바 섬 해적 소굴」 · 수첩
   ③ 손에 넣기 전: 항구에 들어갈 수 없다 · 소굴 앞바다에서만 두목 함대가 나온다(놓치면 며칠 뒤)
   ④ 두목 둘(둘째는 실제 해전) → 섬을 손에 넣는다 · 이름 「제르바 섬」 · 간부들은 더는 바다에 나오지 않는다 · 금화·명성
   ⑤ 거리: 항구·교역소·술집·여관·해적 본부만 · 해적 본부 메뉴(쉬기·부인·금고·보관함·저장) · 부인과 아이를 데려온다 · 본부인에게 달마다 들키지 않는다
   ⑥ 저장·불러오기 · 일곱 소굴 → 업적 「해적왕」
   ⑦ 네 공주: 모두 혼인하면 알림 → 본가로 모신다 · 아이들도 본가로 · 다툼 없음 · 거리에 따로 집 없음 · 숨은 거처 거절 · 업적 「Dream Come True」
   콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => {
      const TT = window.TT = { raf: [], auto: true, n: 0 };
      window.requestAnimationFrame = cb => { TT.raf.push(cb); return ++TT.n; };
      TT.pump = () => { const q = TT.raf; TT.raf = []; q.forEach(cb => { try { cb(performance.now()); } catch (e) { console.error(e); } }); };
      setInterval(() => { if (TT.auto) TT.pump(); }, 16);
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Lair && G.FairyHome, null, { timeout: 90000 });

    // ---------------------------------------------------------------- ① 자료
    let r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); TT.auto = false;
      const out = {};
      out.n = G.PIRATE_LAIRS.length;
      out.zones = G.PIRATE_LAIRS.map(d => d.zone).sort().join(',');
      out.geo = G.PIRATE_LAIRS.map(d => d.zone + ':' + (G.Ships.zone(d.lon, d.lat) === d.zone) + ':' + G.Geo.isSea(d.dock[1], d.dock[0], 0.05) + ':' + (G.CITY_DATA[d.id] ? 'TAKEN' : 'free') + ':' + d.chiefs.length + ':' + d.mates.length).join(' ');
      out.mates = G.SEA_PIRATES.filter(p => p.lair).length;
      out.pool = G.Captains.pirates().filter(p => p.lair).length;
      return out;
    });
    ok(r.n === 7 && r.zones === 'amer,atl,east,ind,med,north,sea', '일곱 바다에 소굴 하나씩 — ' + r.zones);
    ok(!/false|TAKEN/.test(r.geo), '소굴 자리가 그 바다에 있고, 배 대는 곳은 물, 도시 번호는 비어 있다 — ' + r.geo);
    ok(r.mates === 21 && r.pool === 21, '소굴 간부 21명이 이름난 해적 명부에 들어갔다');

    // ---------------------------------------------------------------- ② 이름난 해적 셋 → 소굴이 드러난다 (셋째는 실제 해전)
    r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, LR = G.Lair;
      const said = [];
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.confirm = async () => true; UI.toast = () => {}; UI.fade = async fn => { fn(); };
      UI.ask = async (t, o) => o[0].value; UI.choose = async (t, o) => (o && o[0] ? o[0].value : null);
      window.__said = said;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.date = { y: 1520, m: 5, d: 1 }; s.settings.res = 0.35;
      out.fresh = !s.lair || !Object.keys((s.lair || {}).rev || {}).length;
      out.noCity = !G.CITY_DATA[1200];
      const meds = G.Captains.pirates().filter(p => p.zones.indexOf('med') >= 0);
      const mk = c => ({ kind: 'pirate', zone: 'med', cap: { id: c.id, name: c.name, src: 'hist', desc: c.desc, k: 'p' } });
      const lines = [];
      LR.afterBattle(mk(meds[0]), 'win', [], lines);
      LR.afterBattle(mk(meds[0]), 'win', [], lines);   // 같은 사람은 한 번만
      LR.afterBattle(mk(meds[1]), 'lose', [], lines);  // 진 해전은 세지 않는다
      LR.afterBattle({ kind: 'pirate', zone: 'med' }, 'win', [], lines);   // 이름 없는 해적
      out.count1 = s.lair.kills.med.length;
      LR.afterBattle(mk(meds[1]), 'win', [], lines);
      out.count2 = s.lair.kills.med.length;
      out.progressLine = lines.some(t => /2\/3/.test(t));
      out.notYet = !LR.revealed('med');
      // 셋째: 실제 해전 (튀니스 앞바다)
      const B = G.Scenes.battle, tn = G.CITY_DATA[82];
      s.loc = { mode: 'sea', lon: tn.lon + 1.5, lat: tn.lat + 0.6, heading: 0 };
      const npc = { id: 't3', kind: 'pirate', zone: 'med', lon: s.loc.lon + 0.5, lat: s.loc.lat, n: 2, K: 0.3, hostile: true,
        ships: G.Ships.enemyTypes('pirate', 'med', null, 2, 0.3, s.date.y), cap: { id: meds[2].id, name: meds[2].name, src: 'hist', desc: meds[2].desc, g: 'm', k: 'p' } };
      G.Game.go('battle', { npc });
      await new Promise(r2 => setTimeout(r2, 300));
      B.runtime().ships.filter(b => b.side === 'en').forEach(b => { b.alive = false; b.sunk = true; b.hp = 0; });
      const t0 = Date.now();
      while (G.Game.sceneName === 'battle' && Date.now() - t0 < 90000) {
        if (!G.UI.busy()) B.update(1 / 6);
        const m = [...document.querySelectorAll('#ui .modal-back')].pop();
        if (m) { const b = [...m.querySelectorAll('.btn')].pop() || m.querySelector('.dlg') || m; b.click(); }
        await new Promise(r2 => setTimeout(r2, 40));
      }
      out.scene = G.Game.sceneName;
      out.revealed = LR.revealed('med');
      const c = G.CITY_DATA[1200];
      out.city = c ? c.name + ':' + c.lair + ':' + c.port + ':' + c.nation : null;
      out.known = s.known.indexOf(1200) >= 0;
      out.confess = said.some(t => /모이는 곳은 제르바 섬/.test(t)) && said.some(t => /해도에 적어 두었습니다/.test(t));
      out.html = LR.html().replace(/<[^>]+>/g, ' ');
      return out;
    });
    ok(r.fresh && r.noCity, '새 게임: 드러난 소굴 없음 · 소굴 도시는 자료에 없다');
    ok(r.count1 === 1 && r.count2 === 2 && r.progressLine && r.notYet, '서로 다른 이름난 해적만 센다 (같은 사람·진 해전·이름 없는 해적은 빼고) · 결과 창에 2/3');
    ok(r.scene === 'sea' && r.revealed && r.city === '제르바 섬 해적 소굴:med:1:해적' && r.known, '셋째 이름난 해적을 실제 해전에서 무찌르면 「제르바 섬 해적 소굴」이 지도에 나타난다');
    ok(r.confess, '해전 뒤: 사로잡은 해적이 소굴과 두목들을 털어놓고, 부관이 해도에 적었다고 알린다');
    ok(/지중해/.test(r.html) && /제르바 섬/.test(r.html) && /두목 0\/2/.test(r.html), '수첩: 바다마다 해적의 소굴 진행');

    // ---------------------------------------------------------------- ③ 손에 넣기 전
    r = await page.evaluate(async () => {
      const out = {}, s = G.Game.state, LR = G.Lair, d = G.PIRATE_LAIR.med, c = G.CITY_DATA[1200], said = window.__said;
      said.length = 0;
      out.entry = await G.Scenes.city.handleEntry(c);
      out.blockSay = said.some(t => /두목들의 함대를 먼저 꺾어야/.test(t));
      s.loc = { mode: 'sea', lon: G.CITY_DATA[82].lon + 1, lat: G.CITY_DATA[82].lat + 1, heading: 0 };
      out.far = LR.spawn([]) === null;
      s.loc = { mode: 'sea', lon: d.dock[1] + 0.8, lat: d.dock[0] + 0.3, heading: 0 };
      const n = LR.spawn([]);
      out.chief = n ? [n.kind, n.lairChief, n.chiefNo, n.cap.name, n.n >= 4, n.ships.length === n.n, n.hostile].join(':') : null;
      out.dup = LR.spawn([n]) === null;
      out.cool = LR.spawn([]) === null;
      window.__chief0 = n;
      return out;
    });
    ok(r.entry === false && r.blockSay, '손에 넣기 전: 소굴 항구에 들어갈 수 없다 (수비대가 막는다)');
    ok(r.far && r.chief === 'pirate:med:0:붉은 터번의 살림 바바:true:true:true' && r.dup && r.cool, '소굴 앞바다에서만 첫째 두목의 함대(4척 이상)가 나온다 · 하나씩 · 놓치면 며칠 뒤');

    // ---------------------------------------------------------------- ④ 두목 둘 → 섬을 손에 넣는다 (둘째는 실제 해전)
    r = await page.evaluate(async () => {
      const out = {}, s = G.Game.state, LR = G.Lair, d = G.PIRATE_LAIR.med, said = window.__said, B = G.Scenes.battle;
      const lines = [];
      LR.afterBattle(window.__chief0, 'win', [], lines);
      out.beat1 = s.lair.beat.med === 1 && !LR.held('med') && lines.some(t => /아직 모래톱의 아이샤 레이스/.test(t));
      await LR.tell();
      s.day += 3;
      s.loc = { mode: 'sea', lon: d.dock[1] + 0.8, lat: d.dock[0] + 0.3, heading: 0 };
      const n2 = LR.spawn([]);
      out.chief2 = n2 ? n2.chiefNo + ':' + n2.cap.name + ':' + n2.cap.g : null;
      const gold0 = s.player.gold, fame0 = s.player.fame;
      said.length = 0;
      G.Game.go('battle', { npc: n2 });
      await new Promise(r2 => setTimeout(r2, 300));
      B.runtime().ships.filter(b => b.side === 'en').forEach(b => { b.alive = false; b.sunk = true; b.hp = 0; });
      const t0 = Date.now();
      while (G.Game.sceneName === 'battle' && Date.now() - t0 < 90000) {
        if (!G.UI.busy()) B.update(1 / 6);
        const m = [...document.querySelectorAll('#ui .modal-back')].pop();
        if (m) { const b = [...m.querySelectorAll('.btn')].pop() || m.querySelector('.dlg') || m; b.click(); }
        await new Promise(r2 => setTimeout(r2, 40));
      }
      out.scene = G.Game.sceneName;
      out.held = LR.held('med');
      out.name = G.CITY_DATA[1200].name;
      out.reward = s.player.gold - gold0 >= G.BALANCE.lair.gold && s.player.fame > fame0;
      out.kneel = said.some(t => /무기를 내려놓았다/.test(t)) && said.some(t => /해적의 섬|손에 넣었다/.test(t));
      const r0 = s.capRoster || {};
      out.lieutOut = G.SEA_PIRATES.filter(p => p.lair === 'med').every(p => r0.out && r0.out[p.id]);
      out.atlStill = G.SEA_PIRATES.filter(p => p.lair === 'atl').every(p => !(r0.out && r0.out[p.id]));
      out.entry = await G.Scenes.city.handleEntry(G.CITY_DATA[1200]);
      out.noSpawn = LR.spawn([]) === null;
      return out;
    });
    ok(r.beat1 && r.chief2 === '1:모래톱의 아이샤 레이스:f', '첫째 두목을 꺾으면 둘째(여해적 아이샤 레이스)가 나온다');
    ok(r.scene === 'sea' && r.held && r.name === '제르바 섬' && r.reward && r.kneel, '둘째 두목을 실제 해전에서 꺾으면 「제르바 섬」을 손에 넣는다 · 금화·명성 · 해적들이 무릎 꿇는 장면');
    ok(r.lieutOut && r.atlStill, '지중해 소굴의 간부들은 더는 바다에 나오지 않는다 (다른 바다는 그대로)');
    ok(r.entry === true && r.noSpawn, '손에 넣은 섬은 들어갈 수 있고, 두목 함대는 더 나오지 않는다');

    // ---------------------------------------------------------------- ⑤ 거리 · 해적 본부 · 부인
    r = await page.evaluate(async () => {
      const out = {}, s = G.Game.state, LR = G.Lair, C = G.Scenes.city, W = G.Wives, c = G.CITY_DATA[1200];
      const f = G.R.facilities(c); out.fac = ['harbor', 'trade', 'tavern', 'inn', 'church', 'market', 'shipyard', 'gate'].map(k => k + '=' + !!f[k]).join(',');
      // 둘째 부인(여급 출신)과 그 아이 — 리스본 아닌 도시에 집
      s.player.wife = 'm_lis';
      const maid = Object.keys(G.MAID).map(k => G.MAID[k]).find(m => m.city !== s.player.home && m.city !== 1200);
      W.list().push({ id: maid.id, kind: 'maid', city: maid.city, house: true, aboard: false, wed: s.day, no: 2 });
      s.player.kids.push({ name: '아기', given: '아기', sex: 'f', born: { y: s.date.y - 4, m: 1, d: 1 }, mother: maid.id, house: maid.city, st: {}, sk: {}, lg: {}, edu: {} });
      const hq = C.B.lairhq;
      out.title = hq.title(c);
      out.menu = hq.menu(c).filter(Boolean).map(x => x.label).join(',');
      const w = W.of(maid.id);
      LR.moveHere(w, c);
      out.moved = w.city === 1200 && w.lodge && w.lodge.kind === 'lair' && w.lodge.from === maid.city && s.player.kids[s.player.kids.length - 1].house === 1200;
      out.place = W.placeName(w);
      s.loc = { mode: 'city', city: 1200, lon: c.lon, lat: c.lat };
      out.blds = C.buildings(c).map(b => b.kind).join(',');
      out.sub = hq.sub(c);
      let caught = 0; for (let i = 0; i < 60; i++) caught += W.lodgeMonth().length;
      out.caught = caught;
      // 실제 도시 화면: 해적 본부에 들어가 메뉴를 본다
      C.findInside = async () => {};
      TT.auto = true;
      G.Game.go('city', { cityId: 1200 });
      const t0 = Date.now();
      while (!(G.Game.sceneName === 'city' && document.querySelector('.city-banner') && document.querySelector('.cmdmenu .cmd') && !G.UI.busy()) && Date.now() - t0 < 60000) await new Promise(r2 => setTimeout(r2, 100));
      await new Promise(r2 => setTimeout(r2, 500));
      out.banner = (document.querySelector('.city-banner') || {}).textContent || '';
      out.street = [...document.querySelectorAll('.cmdmenu .cmd')].map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' | ');
      C.visit('lairhq');
      const t1 = Date.now(); let labels = [];
      while (Date.now() - t1 < 30000) {
        labels = document.querySelector('.bld-notebook') ? [...document.querySelectorAll('.cmdmenu .cmd')].map(e => e.textContent.replace(/\s+/g, ' ').trim()) : [];
        if (labels.length) break;
        await new Promise(r2 => setTimeout(r2, 100));
      }
      TT.auto = false;
      out.cmds = labels.join(' | ');
      out.dbg = [G.Game.sceneName, G.UI.busy(), document.querySelectorAll('.cmdmenu').length, (document.querySelector('#ui') || {}).innerText ? document.querySelector('#ui').innerText.slice(0, 300) : ''].join(' # ');
      return out;
    });
    ok(r.fac === 'harbor=true,trade=true,tavern=true,inn=true,church=false,market=false,shipyard=false,gate=false', '해적의 섬 시설: 항구·교역소·술집·여관만');
    ok(r.title === '해적 본부' && /쉰다/.test(r.menu) && /부인을 데려온다/.test(r.menu) && /금고/.test(r.menu) && /보관함/.test(r.menu) && /저장/.test(r.menu), '해적 본부 메뉴: 쉬기 · 부인을 데려온다 · 금고 · 보관함 · 저장 — ' + r.menu);
    ok(r.moved && r.place === '해적 본부 — ' + r.place.split(' — ')[1], '둘째 부인과 그 아이를 해적 본부로 데려온다 (본래 집을 기억) — ' + r.place);
    ok(r.blds === 'harbor,trade,tavern,inn,lairhq,house2', '거리: 항구·교역소·술집·여관·해적 본부·데려온 부인의 집 — ' + r.blds);
    ok(/부인 1명/.test(r.sub) && r.caught === 0, '본부에 부인이 있음을 표시 · 외딴 섬이라 달마다 본부인에게 들키지 않는다');
    ok(/제르바 섬/.test(r.banner) && /쉰다/.test(r.cmds) && /부인을 데려온다/.test(r.cmds), '실제 도시 화면에서 해적 본부에 들어가 메뉴를 본다 — ' + r.cmds + ' / 거리: ' + r.street + ' / ' + r.dbg);

    // ---------------------------------------------------------------- ⑥ 저장·불러오기 · 해적왕
    r = await page.evaluate(async () => {
      const out = {}, LR = G.Lair, AC = G.Achieve;
      const json = G.State.serialize ? G.State.serialize(G.Game.state) : JSON.stringify(G.Game.state);
      delete G.CITY_DATA[1200];
      const S2 = G.State.deserialize(json); G.Game.state = S2; LR.apply();
      out.reload = !!G.CITY_DATA[1200] && G.CITY_DATA[1200].name === '제르바 섬' && LR.held('med') && !G.CITY_DATA[1201];
      out.before = AC.done('pirateking');
      ['atl', 'north', 'amer', 'ind', 'sea'].forEach(z => LR._hold(z));
      out.six = LR.heldCount() === 6 && !AC.progress(AC.list().find(a => a.id === 'pirateking')).done;
      LR._hold('east');
      const p = AC.progress(AC.list().find(a => a.id === 'pirateking'));
      out.prog = p.have + '/' + p.need + ':' + p.done;
      const got = AC.check().map(a => a.id);
      out.granted = got.indexOf('pirateking') >= 0 && AC.done('pirateking');
      out.cities = G.PIRATE_LAIRS.every(d => G.CITY_DATA[d.id] && G.CITY_DATA[d.id].name === d.place);
      return out;
    });
    ok(r.reload, '저장·불러오기: 손에 넣은 섬이 그대로 (드러나지 않은 소굴은 없다)');
    ok(!r.before && r.six && r.prog === '7/7:true' && r.granted && r.cities, '일곱 바다의 소굴을 모두 손에 넣으면 업적 「해적왕」');

    // ---------------------------------------------------------------- ⑦ 본가의 네 공주
    r = await page.evaluate(async () => {
      const out = {}, FH = G.FairyHome, W = G.Wives, AC = G.Achieve, C = G.Scenes.city, said = window.__said;
      const scenes = []; AC.scene = async a => { scenes.push(a.id); };   // 업적 장면은 이 시험에서 건너뛴다 (그림 창)
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '동화 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.date = { y: 1530, m: 3, d: 1 };
      const p = s.player, home = p.home;
      p.wife = 'm_lis';
      const cities = { cinderella: 23, snow_white: 30, sleeping_beauty: 26, little_mermaid: 44 };
      const ids = FH.ids();
      ids.slice(0, 3).forEach((id, i) => W.list().push({ id, kind: 'mate', city: cities[id], house: true, aboard: false, wed: s.day, no: i + 2 }));
      out.notYet = !FH.married() && !FH.canInvite();
      W.list().push({ id: 'little_mermaid', kind: 'mate', city: cities.little_mermaid, house: true, aboard: false, wed: s.day, no: 5, lodge: { kind: 'gov', from: 44 } });
      p.kids.push({ name: '꼬마', given: '꼬마', sex: 'm', born: { y: 1526, m: 1, d: 1 }, mother: 'cinderella', house: 23, st: {}, sk: {}, lg: {}, edu: {} });
      out.can = FH.married() && FH.canInvite() && !FH.together();
      const news = FH.daily(); out.note = news.length === 1 && /본가로 모셔/.test(news[0].text) && FH.daily().length === 0;
      out.menu0 = C.B.home.menu(G.CITY_DATA[home]).filter(Boolean).map(x => x.label).join(',');
      said.length = 0;
      out.invited = await FH.invite(G.CITY_DATA[home]);
      out.together = FH.together();
      out.wives = W.list().map(w => w.id + ':' + w.city + ':' + !!w.dream + ':' + !!w.lodge).join(' ');
      out.kidHome = p.kids[p.kids.length - 1].house === undefined;
      out.lines = ids.every(id => said.some(t => t.indexOf(G.MATE[id].name + ':') === 0)) && said.some(t => t.indexOf(G.Family.wifeName() + ':') === 0);   // 본부인의 한마디
      out.achv = AC.done('dreamcome') && scenes.indexOf('dreamcome') >= 0;
      // 다툼이 없다: 본처 + 공주 · 공주끼리
      const pr = G.WifeFeud.pair(home);
      out.peace = pr === null;
      out.present = G.WifeFeud.present(home).length;
      // 다른 둘째 부인(여급)이 같은 도시에 있으면 본처와는 여전히 다툴 수 있다
      const maid = Object.keys(G.MAID).map(k => G.MAID[k])[0];
      W.list().push({ id: maid.id, kind: 'maid', city: home, house: true, aboard: false, wed: s.day, no: 6 });
      const pr2 = G.WifeFeud.pair(home);
      out.otherFeud = !!pr2 && [pr2.a.id, pr2.b.id].sort().join('|') === ['m_lis', maid.id].sort().join('|');
      W.list().pop();
      // 거리에 따로 집이 없다 · 숨은 거처로 보내지 않는다 · 가족이 옮기면 따라간다
      s.loc = { mode: 'city', city: home, lon: G.CITY_DATA[home].lon, lat: G.CITY_DATA[home].lat };
      out.houses = C.buildings(G.CITY_DATA[home]).filter(b => b.kind === 'house2').length;
      said.length = 0; await W.lodgeAsk(W.of('snow_white'));
      out.lodgeNo = !W.of('snow_white').lodge && said.some(t => /다른 곳으로 가고 싶지 않아요/.test(t));
      out.menu1 = C.B.home.menu(G.CITY_DATA[home]).filter(Boolean).map(x => x.label).join(',');
      // 해적 본부로도 데려가지 않는다
      return out;
    });
    ok(r.notYet && r.can && r.note, '네 공주와 모두 혼인해야 본가로 모실 수 있다 · 한 번 알림');
    ok(/공주들을 본가로 모신다/.test(r.menu0), '자택 메뉴 「공주들을 본가로 모신다」');
    ok(r.invited && r.together && !/false/.test(r.wives.split(' ').map(x => x.split(':')[2]).join(' ')) && !/true$/.test(r.wives.split(' ').map(x => x.split(':')[3]).join(' ')), '공주 넷이 본가에 함께 산다 (숨은 거처도 풀린다) — ' + r.wives);
    ok(r.kidHome && r.lines, '공주의 아이도 본가로 · 본부인과 네 공주의 한마디');
    ok(r.achv, '업적 「Dream Come True」');
    ok(r.peace && r.present === 5 && r.otherFeud, '본처와 네 공주가 한 집에 있어도 다투지 않는다 (공주가 아닌 둘째 부인과 본처는 그대로) — ' + [r.peace, r.present, r.otherFeud].join(','));
    ok(r.houses === 0 && r.lodgeNo && /공주들과 함께/.test(r.menu1) && !/본가로 모신다/.test(r.menu1), '거리에 따로 집 없음 · 숨은 거처 거절 · 자택 메뉴 「공주들과 함께」');

    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('통과: 해적의 소굴 · 본가의 네 공주');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
