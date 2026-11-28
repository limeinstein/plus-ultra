/* 이야기 모드 「돌아오는 배의 값」(아르슬란 편) 점검 (js/data/arslan.js · js/systems/arslan.js) — node tests/arslan_smoke.js
   - 이야기 고르기 지도에 아르슬란 · 시작: 세상을 1494년 4월까지 넘김 · 아르슬란(오스만·18세) · 타르타나 「달무리」 · 이스탄불 거리의 첫 장면
   - 프롤로그 네 장면(거리 → 조선소 → 도서관 → 항구) · 마치기 전엔 출항 불가 · 훈디·마흐·니사이 합류
   - 2막부터 종막까지 사건 72개를 차례로 (대화창은 저절로 넘김 · 이야기 해전은 이긴 것으로) · 세 바다의 선단 집계 · 청혼 미루기와 다시 열림
   - 남성 고용 거절(술집 · 사건 합류) · 수첩 쪽 · 보통 항해에는 나오지 않음 · 콘솔 오류 0 */
'use strict';
const path = require('path'),fs=require('fs');
const OUT=process.env.OUT||path.join(__dirname,'../artifacts/arslan-release-check');fs.mkdirSync(OUT,{recursive:true});
const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const BASE = (process.env.WEB_BASE ? new URL(process.env.PAGE||'index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href);
let passed = 0;
function ok(v, msg) { if (!v) throw new Error('✗ ' + msg); passed++; console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { const raf = requestAnimationFrame.bind(window); requestAnimationFrame = cb => (cb.name === 'loop'||String(cb).includes('.frameDue(')&&String(cb).includes('.scene.update(')) ? 0 : raf(cb); });
    await page.goto(BASE, { waitUntil: 'commit', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !document.querySelector('.title-menu .btn.disabled'), null, { timeout: 120000 });
    const list = await page.evaluate(() => G.StorySelect.list().map(m => m.id));
    ok(list.includes('arslan') && list.includes('photo') && list.includes('jhook') && list.includes('gold'), '이야기 고르기의 주인공: ' + list.join(' · '));

    // 자료 점검: 사건의 앞뒤·말하는 사람·제목·물건
    const data = await page.evaluate(() => {
      const D = G.ARSLAN, ids = { start: 1 }, bad = []; let lines = 0, longest = 0;
      D.beats.forEach(b => { if (ids[b.id]) bad.push('겹침 ' + b.id); ids[b.id] = 1; });
      const chk = (ls, id) => ls.forEach(l => { if (Array.isArray(l)) { lines++; longest = Math.max(longest, l[1].replace(/\f/g, '').length); const k = l[0].replace(/^\?/, ''); const w = G.Arslan.who(k); if (k !== 'N' && !(w && w.name)) bad.push('말하는 사람 ' + id + ':' + k); } else l.opts.forEach(o => o[1] && chk(o[1], id)); });
      D.beats.forEach(b => { (b.after || []).forEach(a => { if (!ids[a]) bad.push('after ' + b.id + '→' + a); }); if (b.then.chain && !ids[b.then.chain]) bad.push('chain ' + b.id); if (!D.titles[b.id]) bad.push('제목 ' + b.id);
        (b.then.items || []).forEach(i => { if (!D.items[i]) bad.push('물건 ' + i); }); (b.then.join || []).forEach(i => { if (!G.MATE[i]) bad.push('동료 ' + i); }); (b.where && Array.isArray(b.where) ? b.where : []).forEach(c => { if (!G.CITY_DATA[c]) bad.push('도시 ' + c); }); chk(b.lines, b.id); });
      D.prologue.stages.forEach(s => chk(s.lines, s.id));
      return { n: D.beats.length, lines, longest, bad, crew: D.crew.filter(id => !G.MATE[id]), looks: Object.keys(D.looks).length };
    });
    ok(!data.bad.length && !data.crew.length, '자료: 사건 ' + data.n + '개 · 대사 ' + data.lines + '줄 · 가장 긴 줄 ' + data.longest + '자 · 복식 묘사 ' + data.looks + '명' + (data.bad.length ? '\n' + data.bad.join('\n') : ''));
    ok(data.longest <= 150, '대사 한 줄은 150자를 넘지 않는다');
    const faces = await page.evaluate(() => { const D = G.ARSLAN, keys = D.mates.map(m => m.face).concat(Object.keys(D.npcs).map(k => D.npcs[k][4]).filter(Boolean)); return { n: keys.length, miss: keys.filter(k => !G.Img.has(k)) }; });
    ok(!faces.miss.length, '동료·인물의 얼굴 그림 ' + faces.n + '개가 모두 있다' + (faces.miss.length ? ' — 없는 것: ' + faces.miss.join(', ') : ''));

    // 대화창은 저절로
    await page.evaluate(() => {
      const UI = G.UI; window.SAID = []; window.PICK = 0; window._win = UI.window;
      window.outfits = {};
      UI.say = async (t, who) => {
        SAID.push((who && who.name || '') + ': ' + String(t).slice(0, 70));
        if (who && who.rigId === 'player') outfits[G.Arslan.currentBeat] = G.Img.pick(who.half);
      };
      UI.ask = async (t, opts) => { const v = opts[Math.min(PICK, opts.length - 1)].value; PICK = 0; return v; };
      UI.alert = async () => {}; UI.fade = async (fn) => { fn && fn(); };
      UI.window = (o) => ({ result: Promise.resolve(o.buttons ? o.buttons[o.buttons.length - 1].value : null), el: document.createElement('div'), content: Object.assign(document.createElement('div'), { innerHTML: o.html || '' }), close() {} });
    });
    await page.evaluate(() => { window.BEGIN = G.StorySelect.begin(G.STORY_MODES.find(m => m.id === 'arslan')); });
    await page.waitForFunction(() => G.Game.state && G.Game.state.arslan && G.Game.state.arslan.pro === 1 && G.Game.sceneName === 'city' && !G.Arslan._busy, null, { timeout: 180000 });
    await page.waitForTimeout(1500);
    const a = await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA[112], f = G.R.facilities(c);
      return { name: s.player.name, nation: s.player.nation, nat: G.R.nationName(s.player.nation), home: G.R.isHomeNation(c), date: s.date, age: G.R.age(), mates: s.mates.length, city: s.loc.city,
        ship: s.fleet.ships[0].name + '/' + s.fleet.ships[0].type, crew: s.fleet.crew, food: s.fleet.food, water: s.fleet.water, gold: s.player.gold,
        said: SAID.length, who: Array.from(new Set(SAID.map(x => x.split(':')[0]))), yard: !!f.shipyard, lib: !!f.library,
        rival: Object.values(s.disc).filter(x => x.rival).length, face: G.Img.pick(G.Art.portraitKeys(s.player.portrait)), half: G.Img.pick(G.Img.chain.heroHalf()), guide: G.Arslan.guide(), myNation: G.R.myNation() };
    });
    ok(a.name === '아르슬란 젬오을루' && a.nation === 'OT' && a.nat === '오스만 제국' && a.home && a.date.y === 1494 && a.date.m === 4 && a.age === 18 && a.city === 112, '제독: ' + a.name + ' · ' + a.nat + ' · ' + a.date.y + '년 ' + a.date.m + '월 · ' + a.age + '세 · 이스탄불');
    ok(a.ship === '달무리/tartane' && a.mates === 0 && a.myNation === null, '타르타나 「달무리」 · 처음엔 혼자 · 이야기 주인공의 나라 규칙');
    ok(a.crew === 8 && a.gold === 600 && a.food > 0 && a.water === a.food, '선원 8명 · 금화 600닢 · 식량과 물 ' + a.food + '씩');
    ok(a.face === 'portraits/story-player/arslan' && a.half === a.face + '_half', '프롤로그에 아르슬란 전용 얼굴상·무릎상');
    const portraits = await page.evaluate(() => {
      const mode = G.StorySelect.list().find(m => m.id === 'arslan');
      const ready = G.ARSLAN.mates.filter(m => G.Img.has('portraits/mates/' + m.id));
      return mode.face === G.Img.pick(G.Img.chain.heroPortrait()) && mode.party.includes('훈디') && mode.party.includes('열아홉') &&
        ['ar_firuze', 'ar_aylin', 'ar_gulizar'].every(id => ready.some(m => m.id === id)) &&
        ready.every(m => {
          const key = 'portraits/mates/' + m.id;
          return G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(m.id))) === key && G.Img.pick(G.Img.chain.mateHalf(m.id)) === key + '_half';
        });
    });
    ok(portraits, '이야기 선택 화면 · 동료별 전용 얼굴상과 무릎상');
    ok(a.said >= 15 && ['딜샤드', '어린 아르슬란', '훈디 뒤르다네', '아르슬란 젬오을루'].every(n => a.who.includes(n)), '첫 장면(거리 · 시장의 해도) ' + a.said + '줄 — ' + a.who.join('·'));
    ok(/조선소/.test(a.guide), '지금 할 일: ' + a.guide + ' (이스탄불 조선소 ' + a.yard + ' · 도서관 ' + a.lib + ')');
    console.log('    얼굴 ' + a.face + ' · 무릎상 ' + a.half + ' · 1480~1494 경쟁자 발표 ' + a.rival + '건');

    // 프롤로그: 출항은 아직 · 조선소 → 도서관 → 항구
    const pro = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[112], f = G.R.facilities(c), o = {};
      SAID.length = 0; o.depart = await G.Scenes.city.B.harbor.depart(c); o.departSaid = SAID.slice();
      o.other = await G.Arslan.enter(c, 'tavern');                                  // 다른 건물은 그냥 들어간다
      SAID.length = 0; o.yard = await G.Arslan.enter(c, f.shipyard ? 'shipyard' : 'harbor'); o.yardN = SAID.length; o.m1 = s.mates.map(m => m.id + ':' + m.role).join();
      SAID.length = 0; o.lib = await G.Arslan.enter(c, f.library ? 'library' : 'tavern'); o.libN = SAID.length; o.m2 = s.mates.map(m => m.id + ':' + m.role).join();
      SAID.length = 0; o.har = await G.Arslan.enter(c, 'harbor'); o.harN = SAID.length;
      o.pro = s.arslan.prologue; o.items = s.player.items.map(i => i.id); o.guide = G.Arslan.guide(); o.again = await G.Arslan.enter(c, 'shipyard');
      return o;
    });
    ok(pro.depart === false && pro.departSaid.length === 1 && pro.other === true, '도입부를 마치기 전에는 출항하지 않는다: ' + pro.departSaid[0]);
    ok(pro.yard === false && pro.yardN >= 12 && pro.m1 === 'ar_firuze:purser,ar_aylin:first', '조선소 ' + pro.yardN + '줄 → 훈디(경리)·마흐(부관)');
    ok(pro.lib === false && pro.libN >= 8 && /ar_gulizar:interp/.test(pro.m2), '도서관 ' + pro.libN + '줄 → 니사이(통역)');
    ok(pro.har === true && pro.harN >= 8 && pro.pro === 1 && pro.items.includes('ar_chart') && pro.again === true, '항구 ' + pro.harN + '줄 → 〈달무리〉 · 반쪽 해도 · 도입부 끝');
    ok(/카라만/.test(pro.guide), '지금 할 일: ' + pro.guide);

    await page.evaluate(() => {
      window.SETD = (y, m) => { const s = G.Game.state; s.date = { y, m, d: 2 }; };
      window.ADV = (n) => { const s = G.Game.state; s.date = G.U.addDays(s.date, n); s.day += n; };
      window.GOLD = (n) => { G.Game.state.player.gold = n; };
      window.AT = (id) => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat, heading: 0 }; SAID.length = 0; return G.Arslan.arrive(c, {}); };
      window.SEA = (lon, lat) => { const s = G.Game.state; s.loc = { mode: 'sea', lon, lat, heading: 0 }; SAID.length = 0; return G.Arslan.seaPending() ? G.Arslan.atSea() : false; };
      window.WIN = (lon, lat, n) => { const s = G.Game.state; s.loc = { mode: 'sea', lon, lat, heading: 0 }; for (let i = 0; i < n; i++) G.StoryBattle.finish({ id: 'npc' + i, kind: 'pirate', n: 1 }, 'win'); };
      window.DONE = (id) => G.Arslan.done(id); window.HAS = (id) => G.Game.state.mates.some(m => m.id === id); window.ITEM = (id) => G.Game.state.player.items.some(i => i.id === id);
      window.BATTLES = []; window.WED_DAYS = G.BALANCE.arslan.wedDays; G.BALANCE.arslan.wedDays = 100000;   // 청혼 이야기는 7막 점검 때 연다
      const go = G.Game.go; G.Game.go = function (n, arg) { if (n === 'battle') { BATTLES.push(arg.npc); G.Game.state.stats.battles = (G.Game.state.stats.battles || 0) + 1; G.StoryBattle.finish(arg.npc, 'win'); return; } return go.apply(this, arguments); };
    });
    async function step(label, fn) { const r = await page.evaluate(fn); ok(r && r.ok, label + (r && r.note ? ' — ' + r.note : '')); }

    await step('2막 카라만의 동전', async () => { ADV(4); await SEA(33, 36.2); return { ok: DONE('a2_karaman') && ITEM('ar_seal'), note: SAID.length + '줄' }; });
    await step('2막 알렉산드리아 → 수송선 호위(해전) → 선언문 거절 · 제빵사', async () => { ADV(5); await AT(78); const a = DONE('a2_alex'); await SEA(30, 32); const b = BATTLES.length; await AT(78); return { ok: a && b === 1 && BATTLES[0].kind === 'navy' && DONE('a2_convoy_after') && SAID.some(x => /^제빵사/.test(x)), note: SAID.length + '줄' }; });
    await step('2막 로도스의 안전통행증·빈방(릴아담 · 해전) → 장화 끈 · 「마흐에게 지휘를」', async () => { ADV(4); await SEA(28, 36.2); const b = BATTLES.length; await SEA(28, 36.2); return { ok: b === 2 && DONE('a2_rhodes_after') && G.Game.state.arslan.flags.helm != null && SAID.some(x => /장화 끈/.test(x)), note: SAID.length + '줄' }; });
    await step('3막 1495년 봄 소식 → 「욕해도 되는 사람이랑 저녁 먹자」', async () => { await AT(34); const early = DONE('a3_news'); SETD(1495, 3); await AT(34); return { ok: !early && DONE('a3_news') && DONE('a3_dinner') && SAID.some(x => /저녁 먹자/.test(x)), note: SAID.length + '줄' }; });
    await step('3막 겨울옷 값 → 닻터(탐험) → 어음(교역 · 금화 2,500) → 나포(해적) → 마흔 명', async () => {
      ADV(10); await AT(34); const coat = DONE('a3_coat'); await SEA(11.5, 37); const anc = DONE('a3_anchor');
      GOLD(1000); await AT(28); const poor = DONE('a3_bond'); const g1 = G.Arslan.todo(G.CITY_DATA[28]).map(x => x.text).join(' | ');
      GOLD(6000); await AT(28); const bond = DONE('a3_bond') && G.Game.state.player.gold === 3500 && ITEM('ar_bond');
      await SEA(12, 39); const b = BATTLES.length; await SEA(12, 39); const s = G.Game.state;
      return { ok: coat && anc && !poor && /2,500닢이 있어야/.test(g1) && bond && b === 3 && DONE('a3_after') && s.player.gold < 3500, note: '금화가 모자라면 열리지 않음 · 남은 금화 ' + s.player.gold };
    });
    await step('4막 케말 레이스의 부두 → 포로선(해전) → 아무도 환호하지 않았다 → 머릿수(에모탄 합류) → 펜다의 세 마을', async () => { ADV(3); await AT(82); await SEA(-17.5, 13.5); const b = BATTLES.length; await SEA(-17.5, 13.5); const f = DONE('a4_free') && DONE('j_emotan') && HAS('ar_emotan') && SAID.some(x => /^에모탄 아베나: 아이가 열하나/.test(x)); await SEA(-16.8, 16); return { ok: DONE('a4_kemal') && b === 4 && f && DONE('a4_yasin') && HAS('ar_yasin'), note: SAID.length + '줄' }; });
    await step('4막 해적섬: 마흐의 첫 배(해전) → 안에서 열린 창고(물밑의 빗장) → 종이 왕관 → 왕좌 대신 그물 침대', async () => { await SEA(-16.2, 11.3); const b = BATTLES.length; await SEA(-16.2, 11.3); const base = G.Game.state.arslan.base != null && DONE('j_diouma') && HAS('ar_diouma') && !HAS('ar_ceiba'); ADV(2); await SEA(-16.2, 11.3); const t = G.Game.state.arslan; return { ok: b === 5 && base && DONE('a4_crown') && t.titles.includes('노예들의 왕') && ITEM('ar_crown') && DONE('j_ceiba') && HAS('ar_ceiba') && SAID.some(x => /^세이바 카오나: 왕 거 아니야/.test(x)), note: t.titles.join(' · ') + ' · 시가 · 세이바 합류' }; });
    await step('4막 세 번의 항차(각 금화 800 · 열흘 간격) → 선주회의 보증', async () => {
      GOLD(5000); await SEA(-16.2, 11.3); const tooSoon = DONE('a4_grain1');
      const got = []; for (let i = 0; i < 3; i++) { ADV(10); await SEA(-16.2, 11.3); got.push(['ar_yunxian', 'ar_wulan', 'ar_soyara'].filter(HAS).length); }
      const t = G.Game.state.arslan; return { ok: !tooSoon && got.join() === '1,2,3' && SAID.some(x => /^아르슬란 젬오을루: 우리 배엔 문턱이 없소/.test(x)) && DONE('a4_grain3') && DONE('a4_guild') && t.flags.guild != null && G.Game.state.player.gold === 2600 && t.titles.includes('선주회가 보증하는 선장'), note: '금화 ' + G.Game.state.player.gold + ' · 항차마다 한 사람(윤현 · 울란 · 소야라)' };
    });
    await step('세 바다 ① 로도스 구호기사단: 그 바다의 해전 3승 → 노에 묶인 사람들(당부아즈 · 해전) → 오루츠 · 딜샤드의 원장', async () => {
      await SEA(28, 36.2); const early = DONE('a4_rho_head'); WIN(28, 36, 2); const two = G.Game.state.arslan.fleet.rho; WIN(-40, 40, 3); const stray = G.Game.state.arslan.fleet.rho; WIN(28, 36, 1);
      await SEA(28, 36.2); const b = BATTLES.length; await SEA(28, 36.2); const t = G.Game.state.arslan;
      return { ok: !early && two === 2 && stray === 2 && b === 6 && DONE('a4_rho_after') && ITEM('ar_ledger') && t.fleet.rho === 10 && t.flags.sea_rho != null && SAID.some(x => /^오루츠 레이스/.test(x)) && SAID.some(x => /카슴 베이/.test(x)) && !HAS('oruc'), note: '선단 ' + t.fleet.rho + '/10 · ' + SAID.length + '줄' };
    });
    await step('세 바다 ② 오스만 함대: 해도에 없는 정박지(탐험) → 케말 레이스의 괴케(해전) → 한 번은 놓아준다', async () => { WIN(25, 39, 3); const n = G.Game.state.arslan.fleet.ott; await SEA(25, 39.5); const anc = DONE('a4_ott_anchor'); ADV(2); await SEA(26.2, 40); const b = BATTLES.length; await SEA(26.2, 40); return { ok: n === 3 && anc && b === 7 && BATTLES[6].n === 3 && DONE('a4_ott_after') && SAID.some(x => /^케말 레이스/.test(x)), note: SAID.length + '줄' }; });
    await step('세 바다 ③ 교황청·프랑스: 그라빌 제독의 호송선(해전) → 빈 관 · 로마의 주소 · 후안의 쪽지', async () => { WIN(9, 42, 3); await SEA(9, 42); const b = BATTLES.length; await SEA(9, 42); return { ok: G.Game.state.arslan.fleet.pap === 10 && b === 8 && DONE('a4_pap_after') && ITEM('ar_address') && SAID.some(x => /후안 보르자/.test(x)), note: SAID.length + '줄' }; });
    await step('미켈레 다 쿠네오: 두 번 받은 몸값 → 「선장, 되삼.」', async () => { await AT(7); const sv = DONE('a4_seville') && SAID.some(x => /^미켈레 다 쿠네오/.test(x)); ADV(5); await SEA(-6, 36); return { ok: sv && DONE('a4_ransom') && SAID.some(x => /^카탈리나/.test(x)), note: SAID.length + '줄' }; });
    await step('5막 마테우스의 경고 → 폭풍(마흐에게 지휘를) → 얼음 장수의 골목', async () => { ADV(8); await AT(34); const w = DONE('a5_warn'); ADV(3); await SEA(-40, 40); const st = DONE('a5_storm') && G.Game.state.arslan.picks.includes('마흐에게 지휘를 맡긴다'); await AT(78); return { ok: w && st && DONE('a5_cairo') && SAID.some(x => /^마테우스/.test(x)) && !HAS('mateus'), note: SAID.length + '줄' }; });
    await step('5막 사카이: 최악의 첫 만남 → 솔기 그림 → 도주선(해전) → 붉은 옷·소개 편지 · 오토즈루', async () => { await AT(192); const sk = DONE('a5_sakai') && DONE('r_sayo') && SAID.some(x => /^황규/.test(x)) && SAID.some(x => /^박월담/.test(x)); await SEA(135, 34); const b = BATTLES.length; await SEA(135, 34); return { ok: sk && b === 9 && DONE('a5_after') && HAS('ar_sayo') && ITEM('ar_robe') && ITEM('ar_intro'), note: SAID.length + '줄' }; });
    await step('6막 동료들: 별에서 온 소년 · 셰헤라자드 · 카라야 · 마히나 · 브리트스 · 바사비', async () => {
      await AT(89); const lp = HAS('little_prince') && G.Game.state.lprince.revealed === true;
      ADV(6); await AT(78); await SEA(-70, 19); await SEA(-150, -17); await SEA(-8.7, 36.8); await AT(152); const s = G.Game.state;
      return { ok: lp && ['scheherazade', 'ar_inaya', 'ar_mahina', 'ar_leonor', 'ar_devi'].every(HAS) && s.legend.sche.done === 1, note: s.mates.length + '명' };
    });
    await step('6막 에스텔리나(감춘 편지 → 스무 날 뒤 고백) · 촉토(한 달 뒤 씨감자)', async () => { await AT(28); const v1 = DONE('r_viola') && !HAS('ar_viola'); ADV(20); await AT(34); await AT(34); const v2 = HAS('ar_viola'); await AT(220); const k1 = DONE('r_kya') && !HAS('ar_kya'); ADV(30); GOLD(3000); await AT(220); return { ok: v1 && v2 && k1 && HAS('ar_kya') && G.Game.state.mates.length === 19, note: '열아홉 동료' }; });
    await step('6막 배 위의 장면들: 물맛 지도 · 한 그릇 더 · 웃음 · 귀환로 · 처방 · 다섯 번만', async () => { for (let i = 0; i < 6; i++) { ADV(15); await SEA(-40, 40); } ADV(15); await AT(0); return { ok: ['s_prince', 's_sche', 's_inaya', 's_mahina', 's_kya', 's_devi'].every(DONE) && ITEM('ar_buckle'), note: '' }; });
    await step('7막 출항 1년 뒤: 청혼 — 미루면 다시 열린다 · 세 사람이 스스로 승낙한다', async () => {
      const t = G.Game.state.arslan; await AT(112); const early = DONE('w_firuze'); G.BALANCE.arslan.wedDays = WED_DAYS; ADV(400);
      PICK = 1; await SEA(-40, 40); const waited = !DONE('w_gulizar') && t.cool.w_gulizar > 0 && !t.wed.ar_gulizar && ITEM('ar_letter');
      await AT(112); const f = t.wed.ar_firuze != null && ITEM('ar_gem'); await SEA(-40, 40); const al = t.wed.ar_aylin != null && ITEM('ar_figure'); await SEA(-40, 40); const tb = DONE('w_table');
      ADV(41); await SEA(-40, 40); const g = t.wed.ar_gulizar != null;
      return { ok: !early && waited && f && al && tb && g && G.Game.state.mates.find(m => m.id === 'ar_aylin').loyal === 100, note: Object.keys(t.wed).join(' · ') };
    });
    await step('종막: 체사레 보르자의 거래 → 로마행 전날 → 자선 공연 → 준비한 질문 → 수프와 편지 → 「승객. 편도 한 사람.」', async () => {
      await AT(28); const off = DONE('f_offer') && SAID.some(x => /저 사람들 없는 데서 정하지 마/.test(x)) && SAID.some(x => /^체사레 보르자/.test(x)); await SEA(-40, 40); const eve = DONE('f_eve') && ITEM('ar_oar') && SAID.some(x => /팔자걸음/.test(x));
      await SEA(12.2, 41.7); const t = G.Game.state.arslan;
      return { ok: off && eve && DONE('f_rome') && DONE('f_bed') && DONE('f_soup') && DONE('f_roster') && t.finale != null && SAID.some(x => /^젬: 갈 수 있었던 날이 있었다/.test(x)) && SAID.some(x => /카슴 베이가 배신했다면서요/.test(x)) && SAID.some(x => /승객\. 편도 한 사람/.test(x)) && !G.Arslan.guide(), note: SAID.length + '줄 · 바다가 부른 이름 ' + t.titles.join(' · ') };
    });
    // 동료 이름: 서로 다르고, 게임의 다른 동료·인물과 겹치지 않는다 (부르는 이름까지)
    const nm = await page.evaluate(() => { const D = G.ARSLAN, mine = {}; D.mates.forEach(m => { mine[m.id] = 1; }); const names = D.mates.map(m => m.name), shorts = D.mates.map(m => m.short || m.name);
      const others = G.MATES.filter(m => !mine[m.id]).map(m => [m.name, m.short || '']).flat().filter(Boolean); const npcs = Object.values(D.npcs).map(x => x[0]);
      const tok = {}; others.concat(npcs).forEach(o => String(o).split(/[ ·]/).forEach(t => { tok[t] = 1; }));
      const clash = names.concat(shorts).filter(n => others.indexOf(n) >= 0 || npcs.indexOf(n) >= 0 || n.split(' ').some(t => tok[t]));
      return { names, dup: new Set(names.concat(shorts)).size !== new Set(names).size + new Set(shorts.filter(x => names.indexOf(x) < 0)).size, clash, n: others.length }; });
    ok(!nm.clash.length && !nm.dup, '동료 이름 ' + nm.names.length + '개는 낱말 하나도 다른 동료 ' + nm.n + '개 이름·이 이야기의 인물과 겹치지 않는다: ' + nm.names.join(' · ') + (nm.clash.length ? ' — 겹침: ' + nm.clash.join(', ') : ''));
    // 1판 저장(가공의 세력 이름)을 2판 이름으로 옮긴다
    const old = await page.evaluate(() => { const s = G.Game.state, keep = s.arslan;
      s.arslan = { act: 4, beats: { a4_yunus: 5, a4_isl_head: 9, a4_por_anchor: 11 }, flags: { sea_isl: 9 }, pro: 4, fleet: { isl: 10, por: 2, ita: 0 }, wed: {}, cool: {} };
      G.Arslan.active(); const t = s.arslan, r = { b: Object.keys(t.beats).sort().join(','), f: JSON.stringify(t.fleet), fl: Object.keys(t.flags).join(','), v: t.v }; s.arslan = keep; return r; });
    ok(old.b === 'a4_kemal,a4_ott_anchor,a4_rho_head' && old.f === '{"rho":10,"ott":2,"pap":0}' && old.fl === 'sea_rho' && old.v === 2, '1판 저장의 사건·선단 이름을 2판으로 옮긴다: ' + old.b + ' · ' + old.f);
    const all = await page.evaluate(() => ({ left: G.ARSLAN.beats.filter(b => !DONE(b.id)).map(b => b.id), battles: BATTLES.map(b => b.label) }));
    ok(data.n === 72 && !all.left.length && all.battles.length === 9, '사건 ' + data.n + '개를 모두 지났다 · 이야기 해전 9번: ' + all.battles.join(' · ') + (all.left.length ? '\n남은 사건 ' + all.left.join(',') : ''));
    const costume = await page.evaluate(() => ['f_eve', 'f_rome', 'f_bed'].every(id => outfits[id] === 'portraits/story-player/arslan_cardinal_half') &&
      outfits.f_roster === 'portraits/story-player/arslan_crown_half' && G.Img.pick(G.Img.chain.heroPortrait(G.Game.state.player, 45)) === 'portraits/story-player/arslan_crown_thirties' &&
      G.Img.pick(G.Img.chain.heroHalf(G.Game.state.player, 70)) === 'portraits/story-player/arslan_elderly_half');
    ok(costume, '붉은 무대의상과 일상복 · 중년 왕관 · 노년 터번');

    // 남성은 부하로 들이지 않는다
    const male = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[112], m = G.MATES.find(x => x.g === 'm' && !x.eventOnly && !x.legend) || G.MATE.jh_smith, n0 = s.mates.length;
      SAID.length = 0; const r = await G.Scenes.city.B.tavern.hireMate(c, m); const said = SAID.slice();
      const lg = G.MATES.find(x => x.g === 'm' && x.legend && !s.mates.some(y => y.id === x.id)); const j = G.Legend.join(lg.id, c);
      return { r, said, j, n: s.mates.length - n0, m: m.name, lg: lg.name, refuses: G.Arslan.refuses(m), girl: G.Arslan.refuses(G.MATE.ar_devi), lp: G.Arslan.refuses(G.MATE.little_prince) };
    });
    ok(male.r === false && /난 남자는 안 믿는 주의라/.test(male.said[0]) && male.said.length === 2 && male.j === null && male.n === 0 && male.refuses && !male.girl && !male.lp, '남성 고용 거절: ' + male.m + ' → ' + male.said.join(' / ') + ' · 사건 합류(' + male.lg + ')도 거절');

    const whoNames = await page.evaluate(() => ['P', 'F', 'G', 'A', 'LP', 'SH', 'IN', 'MH', 'LE', 'YS', 'DV', 'VI', 'KY', 'SA', 'EM', 'DU', 'CE', 'TY', 'WU', 'RM', 'DL', 'JM', 'KR', 'AY', 'KN', 'AM', 'OR', 'MC', 'CB', 'AL', 'MT', 'SY', 'HG', 'WD', 'BT', 'MB'].map(k => k + '=' + (G.Arslan.who(k).name || '')).join(' '));
    ok(!/=( |$)|undefined/.test(whoNames), '말하는 사람: ' + whoNames);
    const pg = await page.evaluate(() => { const d = document.createElement('div'); G.Arslan.page(d); return { rows: d.querySelectorAll('tr').length, tags: d.querySelectorAll('.tag').length, hearts: (d.textContent.match(/♥/g) || []).length, txt: d.textContent.length }; });
    ok(pg.rows === 8 && pg.hearts === 4, '수첩 「돌아오는 배」: ' + (pg.rows - 1) + '막 · 혼약 ♥ ' + (pg.hearts - 1));
    const restored = await page.evaluate(async () => {
      const current = G.Game.state;
      const raw = JSON.parse(G.State.serialize());
      const joins = G.ARSLAN.beats.filter(b => b.act === 4 && b.at === 'chain' && b.then.join);
      for (const b of joins) {
        delete raw.arslan.beats[b.id];
        raw.mates = raw.mates.filter(m => !b.then.join.includes(m.id));
      }
      raw.fleet.crew = G.ARSLAN.crew.slice();
      raw.fleet.food = null;
      raw.fleet.water = 0;
      const saved = G.State.deserialize(JSON.stringify(raw));
      G.Game.state = saved;
      try {
        const guild = saved.arslan.beats.a4_guild, gold = saved.player.gold;
        for (const b of joins) await SEA(-40, 40);
        return Number.isFinite(saved.fleet.crew) && saved.fleet.crew > 0 && saved.fleet.food > 0 && saved.fleet.water === 0 &&
          joins.every(b => DONE(b.id) && HAS(b.then.join[0])) && saved.mates.length === 19 &&
          !G.Arslan.seaPending() && saved.arslan.beats.a4_guild === guild && saved.player.gold === gold;
      } finally { G.Game.state = current; }
    });
    ok(restored, '구판 저장에서 선원·보급 복구 · 빠졌던 여섯 합류 장면을 한 번씩 재생');
    const g = await page.evaluate(() => { const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 0), diff: 'normal' }); G.Game.state = s; return { active: G.Arslan.active(), ready: G.Frontier.mateReady(G.MATE.ar_firuze), refuses: G.Arslan.refuses(G.MATE.jh_smith), todo: G.Arslan.todo(G.CITY_DATA[0]).length, sea: G.Arslan.seaPending() }; });
    ok(!g.active && !g.ready && !g.refuses && !g.todo && !g.sea, '보통 항해: 아르슬란의 동료·거절·할 일은 나오지 않는다');
    const meta=await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'}));
    fs.writeFileSync(path.join(OUT,'browser-checks.json'),JSON.stringify({...meta,data,start:a,progress:all,male,generic:g,restored,costume,names:nm,checks:passed,errors},null,2));
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? '\n' + errors.slice(0, 8).join('\n') : ''));
    console.log('\n통과 ' + passed);
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
