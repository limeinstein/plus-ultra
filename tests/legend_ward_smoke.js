/* 전설의 갑옷 5벌(시장에 한 벌씩) · 수호 유물 5가지(발견의 증거 — 지니면 특정 공격을 막는다)
   · 갑옷: 그 도시 시장 진열 맨 앞 「전설」, 한 벌만 사짐, 사면 다시 안 나옴, 상인의 자랑·이웃 지역 소문
   · 유물: 발견하면 손에 들어옴, 후원자에게 보고해도 돌려받음
   · 일기토: 아이기스(비밀무기) · 아이아스의 방패(일격필살) · 만파식적(호통) — 없을 때와 견줌
   · 해전: 성 게오르기우스의 방패(용머리 불길·연소) · 성 브렌던의 종(괴물 들이받기) — 없을 때와 견줌
   node tests/legend_ward_smoke.js */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'legend_ward_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FAILED|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Ward, null, { timeout: 120000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });

    // ① 전설의 갑옷 — 시장
    const a = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const MK = G.Scenes.city.B.market, R = G.R, o = {};
      const L = G.ITEMS.filter(it => it.legendCity != null);
      o.list = L.map(it => ({ id: it.id, name: it.name, def: it.def, city: G.CITY_DATA[it.legendCity].name, market: !!R.facilities(G.CITY_DATA[it.legendCity]).market, exists: R.cityExists(G.CITY_DATA[it.legendCity]) }));
      const ber = G.CITY_DATA[68];
      o.stock0 = MK.stock(ber).slice(0, 2).map(it => it.id);
      o.normalHas = G.CITY_DATA.filter(c => c.id !== 68 && c.id !== 11 && c.id !== 119 && c.id !== 130 && c.id !== 152).some(c => MK.stock(c).some(it => it.legendCity != null));
      o.talkHere = MK.legendTalk(ber);
      G.BALANCE.legendArmor.rumor = 1;
      o.talkLondon = MK.legendTalk(G.CITY_DATA[38]); o.londonAll = [...new Set(Array.from({ length: 40 }, () => MK.legendTalk(G.CITY_DATA[38])))];
      o.talkLisbon = MK.legendTalk(G.CITY_DATA[0]);   // 이베리아 — 발렌시아의 엘 시드 갑옷
      o.talkFar = MK.legendTalk(G.CITY_DATA.find(c => c.region === 9 && c.port));   // 일본 — 가까운 지역에 없음
      // 실제 구입 흐름 (선택·수량·확인 창을 대신 누른다)
      s.player.gold = 1e6;
      const ui = { choose: G.UI.choose, number: G.UI.number, confirm: G.UI.confirm, say: G.Scenes.city.say, ask: G.UI.ask };
      let picks = 0, maxSeen = null;
      G.UI.choose = async (title, list) => { picks++; if (picks === 1) { o.label = list.find(x => x.value === 'wayland').label; return 'wayland'; } return null; };
      G.UI.number = async (opt) => { maxSeen = opt.max; return 1; };
      G.UI.confirm = async () => true; G.UI.ask = async () => 'buy';
      G.Scenes.city.say = async () => {};
      G.Scenes.city.city = () => ber;
      await MK.buy(ber);
      Object.assign(G.UI, { choose: ui.choose, number: ui.number, confirm: ui.confirm, ask: ui.ask }); G.Scenes.city.say = ui.say;
      o.max = maxSeen; o.has = R.hasItem('wayland'); o.equip = s.player.equip.armor; o.gold = s.player.gold;
      o.stock1 = MK.stock(ber).some(it => it.id === 'wayland');
      o.sold = !!(s.legendSold && s.legendSold.wayland);
      o.talkLondon2 = [...new Set(Array.from({ length: 40 }, () => MK.legendTalk(G.CITY_DATA[38])))].join(' | ');
      o.stat = MK.itemStat({ id: 'wayland', kind: 'armor' });
      return o;
    });
    a.list.forEach(x => console.log('    ' + x.name + ' 방어 ' + x.def + ' — ' + x.city + (x.market ? ' 시장' : ' (시장 없음!)')));
    ok(a.list.length === 5 && a.list.every(x => x.market && x.exists && x.def >= 31), '전설의 갑옷 5벌, 도시마다 시장이 있다');
    ok(a.stock0[0] === 'wayland' && !a.normalHas, '베르겐 시장 진열 맨 앞에 웨일랜드의 사슬 갑옷 — 다른 도시 시장엔 없다');
    ok(/웨일랜드/.test(a.talkHere || '') && /딱 한 벌/.test(a.talkHere), '베르겐 상인의 자랑: ' + a.talkHere);
    ok(a.londonAll.some(t => /베르겐/.test(t || '')) && /시장에 「.+」.* 나왔다더군/.test(a.talkLisbon || '') && !a.talkFar, '이웃 지역 소문(가까운 곳일수록 자주) — 런던: ' + a.londonAll.length + '가지 중 「' + a.talkLondon + '」' + ' / 리스본: ' + a.talkLisbon + ' / 일본: 없음');
    ok(/전설/.test(a.label) && a.max === 1, '구입 목록에 「전설」 꼬리표, 한 벌만');
    ok(a.has && a.equip === 'wayland' && a.sold && !a.stock1, '사서 바로 입음(방어 31) — 베르겐 시장에서 사라짐, 금화 ' + a.gold);
    ok(!/웨일랜드/.test(a.talkLondon2 || ''), '팔린 뒤에는 소문도 없다: ' + a.talkLondon2);

    // ② 수호 유물 — 발견의 증거
    const b = await page.evaluate(() => {
      const ids = ['r_parthenon_aegis', 'r_troy_ajax', 'r_munmu_manpa', 'r_cappadocia_george', 'r_brendan_bell'];
      const o = { rel: ids.map(id => { const r = G.RELIC[id]; return r && { id, name: r.name, disc: r.relic, ward: r.ward, inDisc: G.RELICS[r.relic].indexOf(r) >= 0, price: r.price, def: r.def || 0 }; }) };
      // 후원자 보고: 수호 유물은 돌려받는다
      const s = G.Game.state, sp = G.SPONSORS.find(x => x.city === 0) || G.SPONSORS[0];
      s.player.items.push({ id: 'r_troy_ajax', disc: 'troy' }, { id: 'r_troy', disc: 'troy' });
      const pr = G.Sponsor.submitProof(sp, G.DISC.troy);
      o.back = pr.back.map(it => it.id); o.given = pr.given.map(it => it.id);
      o.still = G.R.hasItem('r_troy_ajax'); o.ward = !!G.Ward.item('deathblow');
      o.stat = G.Scenes.city.B.market.itemStat({ id: 'r_troy_ajax', kind: 'armor' });
      return o;
    });
    b.rel.forEach(x => console.log('    ' + (x ? x.name + ' — ' + x.disc + ' · 막음 ' + x.ward + ' · 방어 ' + x.def + ' · 값 ' + x.price : '없음')));
    ok(b.rel.every(x => x && x.inDisc && x.ward), '수호 유물 5가지가 발견(파르테논·트로이·문무대왕릉·카파도키아·성 브렌던)의 유물로');
    ok(b.back.includes('r_troy_ajax') && !b.given.includes('r_troy_ajax') && b.still && b.ward, '보고하면 증거로 보이고 돌려받는다 (같이 낸 다른 유물은 넘김: ' + b.given.join(',') + ')');
    ok(/일격필살/.test(b.stat), '시장·소지품 줄: ' + b.stat);

    // ③ 일기토
    async function duelCase(tech, ward) {
      await page.evaluate(([tech, ward]) => {
        const s = G.Game.state;
        s.player.items = s.player.items.filter(it => !(G.ITEM[it.id] && G.ITEM[it.id].ward));
        if (ward) s.player.items.push({ id: ward });
        s.settings.res = 0.5;
        window.__dres = G.Games.duel({ name: '카리브 해적', sprite: 'caribbean_pirate', look: 'pirate', style: 'slash', str: 70, mar: 70, skill: 2, atk: 7, def: 3 }, { place: 'deck', stance: 'guard', fastEnd: true });
      }, [tech, ward]);
      await page.waitForFunction(() => G.Games._duelDebug && document.querySelector('.rduel'), null, { timeout: 30000 });
      const r = await page.evaluate(async (tech) => {
        const d = G.Games._duelDebug, U = G.U;
        d.fast = true;
        d.me.maxHp = d.me.hp = 1000; d.en.maxHp = d.en.hp = 1000; d.en.spirit = 100; d.me.hp = 300;   // 일격필살 조건 (체력 45% 아래)
        const ch = U.chance; U.chance = () => true;                // 맞을지 말지 운에 맡기지 않는다
        const hp0 = d.me.hp; await d.useTech(tech, d.en); U.chance = ch;
        const lines = [...document.querySelectorAll('.rduel .rd-log div, .rduel .log div, .rduel [class*=log] div')].map(x => x.textContent).slice(-4);
        const o = { lost: hp0 - d.me.hp, stun: d.me.stun || 0, lines };
        return o;
      }, tech);
      await page.screenshot({ path: path.join(OUT, 'duel_' + tech + (ward ? '_ward' : '') + '.png') });
      await page.evaluate(async () => { const d = G.Games._duelDebug; d.en.hp = 0; d.me.hp = Math.max(1, d.me.hp); await d.step(); });
      for (let i = 0; i < 40; i++) { if (await page.evaluate(() => !document.querySelector('.rduel'))) break; await page.keyboard.press('Enter'); await page.waitForTimeout(150); }
      await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
      return r;
    }
    const g0 = await duelCase('secret', null), g1 = await duelCase('secret', 'r_parthenon_aegis');
    ok(g0.lost > 50 && g1.lost === 0, '비밀무기: 없으면 ' + Math.round(g0.lost) + ' 잃음 → 아이기스가 있으면 0 · ' + (g1.lines.join(' / ') || ''));
    const d0 = await duelCase('deathblow', null), d1 = await duelCase('deathblow', 'r_troy_ajax');
    ok(d0.lost >= 300 && d1.lost === 0, '일격필살: 없으면 ' + Math.round(d0.lost) + ' 잃음 → 아이아스의 방패면 0 (되받아침) · ' + (d1.lines.join(' / ') || ''));
    const r0 = await duelCase('roar', null), r1 = await duelCase('roar', 'r_munmu_manpa');
    ok(r0.stun === 1 && r1.stun === 0, '호통: 없으면 얼어붙음 → 만파식적이면 흔들리지 않음 · ' + (r1.lines.join(' / ') || ''));

    // ④ 해전: 용머리 불길 · 괴물 들이받기
    async function fireCase(ward) {
      await page.evaluate((ward) => {
        const s = G.Game.state;
        s.player.items = s.player.items.filter(it => !(G.ITEM[it.id] && G.ITEM[it.id].ward));
        if (ward) s.player.items.push({ id: ward });
        s.settings.res = 0.35;
        G.Game.go('battle', { npc: { kind: 'pirate', n: 1 } });
      }, ward);
      await page.waitForFunction(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime() && G.Scenes.battle.runtime().ships, null, { timeout: 30000 });
      return page.evaluate(() => {
        const st = G.Scenes.battle.runtime(), me = st.ships.find(b => b.side === 'me'), en = st.ships.find(b => b.side !== 'me');
        me.maxHp = me.hp = 2000; const hp0 = me.hp;
        st.balls.push({ x: en.x, y: en.y, tx: me.x, ty: me.y, t: 0, dur: 0.01, hit: true, target: me, from: en, gun: 'perrier', dmg: 60, kill: 1, dragonFire: true, element: 'fire' });
        for (let i = 0; i < 3; i++) G.Game.scene.update(1 / 30);
        return { lost: hp0 - me.hp, burn: !!me.fireBurn, log: st.log.slice(-2) };
      });
    }
    const f0 = await fireCase(null), f1 = await fireCase('r_cappadocia_george');
    await page.screenshot({ path: path.join(OUT, 'battle_fire_ward.png') });
    ok(f0.lost > 0 && f0.burn && f1.lost < 0.5 && !f1.burn, '용머리 불길: 없으면 ' + Math.round(f0.lost) + ' 잃고 불이 붙음 → 성 게오르기우스의 방패면 그대로 · ' + f1.log.join(' / '));

    async function ramCase(ward) {
      await page.evaluate((ward) => {
        const s = G.Game.state;
        s.player.items = s.player.items.filter(it => !(G.ITEM[it.id] && G.ITEM[it.id].ward));
        if (ward) s.player.items.push({ id: ward });
        const e = G.SeaMonsters.sync()['sea-serpent'];
        G.Game.go('battle', { npc: G.SeaMonsters.npc(e) });
      }, ward);
      await page.waitForFunction(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime() && G.Scenes.battle.runtime().ships && G.Scenes.battle.runtime().ships.some(b => b.monster), null, { timeout: 30000 });
      return page.evaluate(() => {
        const st = G.Scenes.battle.runtime(), me = st.ships.find(b => b.side === 'me'), m = st.ships.find(b => b.monster);
        me.maxHp = me.hp = 2000; const hp0 = me.hp;
        // 괴물을 우리 배 바로 뒤에 두고 우리 배 쪽으로 돌진시킨다
        m.monsterPhase = 'surface'; m.x = me.x - 60; m.y = me.y; m.heading = 0; m.chargeHeading = 0; m.chargeStage = 'rush'; m.chargeTime = 1; m.chargeHits = []; m.chargeTarget = me; m.attackCd = 99;
        for (let i = 0; i < 12; i++) { G.Game.scene.update(1 / 30); if (me.hp < hp0) break; }
        return { lost: hp0 - me.hp, hits: (m.chargeHits || []).length, log: st.log.slice(-2), stage: m.chargeStage };
      });
    }
    const m0 = await ramCase(null), m1 = await ramCase('r_brendan_bell');
    await page.screenshot({ path: path.join(OUT, 'battle_ram_ward.png') });
    ok(m0.lost > 0 && m1.lost === 0 && m1.hits >= 1, '괴물 들이받기: 없으면 ' + Math.round(m0.lost) + ' 잃음 → 성 브렌던의 종이면 비켜 감 · ' + m1.log.join(' / '));

    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (err) {
    console.error('실패:', err.message); console.error(errors.join('\n')); process.exitCode = 1;
    try { await page.screenshot({ path: path.join(OUT, 'fail.png') }); } catch (e) { /* */ }
  } finally { await browser.close(); }
})();
