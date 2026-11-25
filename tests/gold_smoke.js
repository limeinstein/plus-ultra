/* 이야기 모드 「황금의 바다 — 세계를 잇는 상인」 점검 (js/data/gold.js · js/systems/gold.js · js/ui/storyselect.js) — node tests/gold_smoke.js
   - 이야기 고르기 지도(유럽)에 아드리안 · 「이 이야기로 시작」 → 1598년 4월 암스테르담 · 네덜란드 · 22세 · 엘리너르·마리커·피터르 · 플류트 「새벽별」 · 프롤로그 → 바다
   - 62개 사건을 차례로 (대화창은 저절로 넘김): 1장 첫 거래 → … → 9장 빈 금고(엘리너르가 사라지고 금화를 잃는다) → 10장 구출(엘리너르 복귀 · 피터르 이탈)
     → 11장 「반 닢」 → 4장 VOC 출자·입회 → 13장 1616 덴마크 → 15장 블랙웰 함대 · 1628 두아르트 → 16장 세 대륙 → 끝 · 대단한 거래·교역왕 사건 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const BASE = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
let passed = 0;
function ok(v, msg) { if (!v) throw new Error('✗ ' + msg); passed++; console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    // 원화를 기다리는 동안 실시간 항해가 시험용 날짜·위치를 움직이지 않게 한다.
    await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : raf(cb); });
    page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !document.querySelector('.title-menu .btn.disabled'), null, { timeout: 120000 });
    const t = await page.evaluate(() => ({ list: G.StorySelect.list().map(m => m.id), beats: G.GOLD.beats.length }));
    ok(t.list.includes('gold') && t.beats >= 60, '고르기 지도에 「황금의 바다」 · 사건 ' + t.beats + '개');

    await page.evaluate(() => {
      const UI = G.UI; window.SAID = []; window._win = UI.window;
      UI.say = async (t, who) => { SAID.push((who && who.name || '') + ': ' + String(t).slice(0, 60)); };
      UI.ask = async (t, opts) => opts[0].value;
      UI.alert = async () => {}; UI.fade = async (fn) => { fn && fn(); };
      UI.window = (o) => /^이야기 모드/.test(o.title || '') ? window._win(o) : ({ result: Promise.resolve(o.buttons ? o.buttons[o.buttons.length - 1].value : null), el: document.createElement('div'), content: document.createElement('div'), close() {} });
    });
    await page.evaluate(() => { window.OPEN = G.StorySelect.open(); });
    await page.waitForSelector('.ss-card', { timeout: 60000 });
    const cards = await page.evaluate(() => Array.from(document.querySelectorAll('.ss-card')).map(c => c.dataset.page + ':' + c.textContent));
    ok(cards.includes('eu:아드리안 판데르펠더'), '유럽 지도 위에 아드리안: ' + cards.join(' · '));
    const ci = cards.indexOf('eu:아드리안 판데르펠더');
    await page.evaluate((i) => document.querySelectorAll('.ss-card')[i].click(), ci);
    await page.waitForSelector('.ss-info', { timeout: 5000 });
    const info = await page.evaluate(() => document.querySelector('.ss-info').textContent);
    ok(/황금의 바다/.test(info) && /1598년/.test(info), '소개: ' + info.slice(0, 50));
    await page.evaluate(() => document.querySelector('.ss-go').click());
    await page.waitForFunction(() => G.Game.state && G.Game.state.gold && G.Game.state.gold.prologue && G.Game.sceneName === 'sea', null, { timeout: 240000 });
    const a = await page.evaluate(() => {
      const s = G.Game.state;
      return { name: s.player.name, nation: s.player.nation, g: s.player.g, date: s.date, age: G.R.age(), mates: s.mates.map(m => m.id + ':' + m.role).join(),
        ship: s.fleet.ships[0].name + '/' + s.fleet.ships[0].type, said: SAID.length, who: Array.from(new Set(SAID.map(x => x.split(':')[0]))),
        nat: G.R.nationName('NL'), lang: G.R.nativeLang('NL'), home: G.R.isHomeNation(G.CITY_DATA[24]), notHome: G.R.isHomeNation(G.CITY_DATA[0]),
        face: G.Img.pick(s.player.portrait.img || []), half: G.Img.chain.heroHalf()[0], rival: Object.values(s.disc).filter(x => x.rival).length };
    });
    ok(a.name === '아드리안 판데르펠더' && a.nation === 'NL' && a.g === 'm' && a.date.y === 1598 && a.date.m === 4 && a.age === 22, '제독: ' + a.name + ' · 네덜란드 · ' + a.date.y + '년 ' + a.date.m + '월 · ' + a.age + '세');
    ok(a.nat === '네덜란드' && a.lang === 3 && a.home && !a.notHome, '네덜란드 제독: 나라 이름 · 게르만어 · 암스테르담만 고국');
    ok(a.rival > 40, '1480~1598 경쟁자 발표가 반영됨: ' + a.rival + '건');
    ok(a.mates === 'gs_eleonore:purser,gs_marieke:interp,gs_pieter:none' && a.ship === '새벽별/fluyt', '엘리너르(경리)·마리커(통역)·피터르 · 플류트 「새벽별」');
    ok(a.said > 35 && ['어린 아드리안', '어린 엘리너르', '엘리너르 더비트', '마리커 판레이우언', '피터르 스하우턴'].every(n => a.who.includes(n)), '프롤로그 대사 ' + a.said + '줄 — ' + a.who.join('·'));
    ok(a.face === 'portraits/player/noble_scholar' && a.half === 'characters/player_half_noble_scholar', '아드리안 얼굴·무릎상: ' + a.face + ' · ' + a.half);

    await page.evaluate(() => {
      window.SETD = (y, m) => { const s = G.Game.state; s.date = { y, m, d: 2 }; };
      window.ADV = (n) => { const s = G.Game.state; s.date = G.U.addDays(s.date, n); s.day += n; };
      window.AT = (id) => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat, heading: 0 }; SAID.length = 0; return G.GoldSea.arrive(c, {}); };
      window.SEA = (lon, lat) => { const s = G.Game.state; s.loc = { mode: 'sea', lon, lat, heading: 0 }; SAID.length = 0; return G.GoldSea.seaPending() ? G.GoldSea.atSea() : false; };
      window.DONE = (id) => G.GoldSea.done(id); window.BATTLES = []; window.HAS = (id) => G.Game.state.mates.some(m => m.id === id);
      const go = G.Game.go; G.Game.go = function (n, arg) { if (n === 'battle') { BATTLES.push(arg.npc); G.Game.state.stats.battles = (G.Game.state.stats.battles || 0) + 1; G.StoryBattle.finish(arg.npc, 'win'); return; } return go.apply(this, arguments); };
    });
    async function step(label, fn) { const r = await page.evaluate(fn); ok(r && r.ok, label + (r && r.note ? ' — ' + r.note : '')); }
    await step('1장 첫 거래(함부르크) · 소문 · 루카스', async () => { ADV(3); await AT(44); const f = DONE('a1_first') && G.Game.state.player.items.some(i => i.id === 'gs_ring'); ADV(8); await SEA(3, 54); ADV(22); await AT(44); return { ok: f && DONE('i1_rumor') && DONE('i1_lucas') && HAS('gs_lucas'), note: SAID.length + '줄' }; });
    await step('2장 검은 깃발 해전 → 브람 합류 → 일흔넷의 제시카', async () => { ADV(20); await SEA(2, 52); const b = BATTLES.length; await SEA(2, 52); const br = DONE('a2_after') && HAS('gs_bram'); ADV(10); await SEA(-20, 35); return { ok: b === 1 && br && DONE('a2_jessica') && SAID.some(x => /^제시카 후크/.test(x)), note: '해전 ' + b + ' · ' + SAID.length + '줄' }; });
    await step('2장 미겔의 약상자 → 리스본', async () => { ADV(12); await AT(7); const m = DONE('i2_miguel'); ADV(10); await AT(0); return { ok: m && DONE('i2_miguel_done'), note: SAID.length + '줄' }; });
    await step('3장 에드워드 · 폭풍 · 회색 배 → 키를 돌린다 · 제시카의 징표', async () => { SETD(1600, 4); await SEA(-2, 50); const b = BATTLES.length; await SEA(-2, 50); const s = G.Game.state; return { ok: b === 2 && DONE('a3_after') && !!s.hints.atlantis && s.player.items.some(i => i.id === 'gs_token') && s.gold.titles.includes('깃발을 보지 않는 상인'), note: SAID.length + '줄' }; });
    await step('3장 1601 런던의 여왕 · 가스파르 · 피터르의 서른 닢', async () => { SETD(1601, 3); await AT(38); const q = DONE('a3_eic') && SAID.some(x => /^엘리자베스 여왕/.test(x)); ADV(5); await AT(7); ADV(25); await AT(0); return { ok: q && DONE('i3_gaspar') && DONE('i3_pieter'), note: SAID.length + '줄' }; });
    await step('4장 1602 암스테르담 — VOC 출자·입회 (야코프 포스)', async () => { SETD(1602, 5); const g0 = G.Game.state.player.gold; await AT(24); const s = G.Game.state; return { ok: DONE('a4_voc') && G.Company.isMember('voc') && (s.company.shares.voc || 0) > 0 && s.player.gold < g0 && s.eindia && s.eindia.voc > 0, note: '주식 ' + s.company.shares.voc + '주 · 금화 ' + g0 + '→' + s.player.gold }; });
    await step('4장 저녁 차 · 로드리고', async () => { ADV(30); await SEA(-10, 40); ADV(15); await AT(7); return { ok: DONE('i4_tea') && DONE('i4_rodrigo'), note: SAID.length + '줄' }; });
    await step('5장 유수프(아라비아 해) · 진문량(말라카) · 회사의 명령 · 마테오 → 광주', async () => { ADV(30); await SEA(60, 15); ADV(20); await AT(160); ADV(25); await AT(168); const tr = DONE('a5_trade'); ADV(20); await AT(168); ADV(20); await AT(174); return { ok: HAS('gs_yusuf') && HAS('gs_jin') && tr && DONE('i5_mateo_done'), note: SAID.length + '줄' }; });
    await step('【대단한 거래 · 유럽】 → 「가족 같은 사람」', async () => { G.Game.state.bigDeal = { eu: { p: 1200000, c: 24, d: 16050101 } }; ADV(5); await AT(24); return { ok: DONE('a5_eu_deal') && SAID.some(x => /가족 같은 사람/.test(x)), note: SAID.length + '줄' }; });
    await step('6·7장 돌섬의 세 조건 → 소영이 고쳐 쓴 지도', async () => { const d = G.DISC.atlantis; ADV(30); await SEA(d.lon, d.lat); const dh = DONE('a6_dohyun') && SAID.some(x => /^도현/.test(x)); ADV(35); await AT(0); return { ok: dh && DONE('a7_map') && SAID.some(x => /^소영/.test(x)) && G.Game.state.player.items.some(i => i.id === 'gs_map'), note: SAID.length + '줄' }; });
    await step('8장 콰메(산호르헤) · 마테우스의 일지 · 백이십 해 만의 편지 · 세 잔째', async () => { ADV(10); await AT(97); ADV(45); await AT(0); const mt = DONE('a8_mateus') && SAID.some(x => /^마테우스/.test(x)); const d = G.DISC.atlantis; ADV(10); await SEA(d.lon, d.lat); ADV(14); await AT(0); return { ok: HAS('gs_kwame') && mt && DONE('a8_letter') && DONE('i8_drink'), note: SAID.length + '줄' }; });
    await step('9장 빈 금고 — 엘리너르가 사라지고 금화 45%를 잃는다 → 마당섬의 제시카', async () => { ADV(20); const g0 = G.Game.state.player.gold; await AT(24); const s = G.Game.state; const e = DONE('a9_empty') && !HAS('gs_eleonore') && s.player.gold < g0 * 0.6 && s.flags.gone_gs_eleonore; ADV(30); await SEA(-70, 18); return { ok: e && DONE('a9_jessica') && SAID.some(x => /그게 사랑이다/.test(x)), note: '금화 ' + g0 + '→' + s.player.gold }; });
    await step('10장 열일곱 닢의 암호 → 회색 인장 해전 → 엘리너르 복귀 · 피터르 이탈 → 고백', async () => { ADV(5); await AT(196); const tr = DONE('a10_trail'); ADV(5); await SEA(-72, 18); const b = BATTLES.length; await SEA(-72, 18); const s = G.Game.state; const r = DONE('a10_after') && HAS('gs_eleonore') && !HAS('gs_pieter') && s.flags.gone_gs_pieter; ADV(14); await AT(196); return { ok: tr && r && DONE('a10_rest') && SAID.some(x => /열네 해 하고 아흐레/.test(x)), note: '해전 ' + b + ' · ' + s.mates.map(m => m.id).join(',') }; });
    await step('11장 르메르의 거래소 → 「반 닢」 나포 → 아홉 항구의 주문 · 「엘리너르」호', async () => { ADV(12); await AT(24); const l = DONE('a11_ledger'); ADV(12); await SEA(-5, 48); const b = BATTLES.length; await SEA(-5, 48); const s = G.Game.state; const half = s.fleet.ships.some(x => x.name === '반 닢'); ADV(45); await AT(0); return { ok: l && DONE('a11_end') && half && DONE('i11_orders') && s.fleet.ships.some(x => x.name === '엘리너르'), note: s.fleet.ships.map(x => x.name).join('·') }; });
    await step('12장 개척항(고아) → 몬탈보 해전 → 토마스 → 【아프리카】 → 마리커의 고백 → 계약', async () => { ADV(35); await AT(150); const p = DONE('a12_port'); ADV(5); await SEA(-75, 15); const b = BATTLES.length; await AT(196); const tm = DONE('i12_tomas'); G.Game.state.bigDeal.af = { p: 1100000, c: 97, d: 16130101 }; ADV(5); await AT(97); const af = DONE('a12_af_deal') && SAID.some(x => /먼저 춤춰요/.test(x)); ADV(50); await AT(0); const mk = DONE('a12_marieke'); ADV(35); await AT(0); return { ok: p && BATTLES[b - 1].kind === 'navy' && tm && af && mk && DONE('a12_promise') && G.Game.state.player.items.some(i => i.id === 'gs_contract'), note: SAID.length + '줄' }; });
    await step('13장 1616 닐스 란차우 → 선단을 둘로 → 【아시아】', async () => { SETD(1616, 5); await AT(24); const n = DONE('a13_niels'); ADV(65); await AT(168); G.Game.state.bigDeal.as = { p: 1300000, c: 168, d: 16170101 }; ADV(5); await AT(160); return { ok: n && DONE('i13_asia') && DONE('a13_as_deal'), note: SAID.length + '줄' }; });
    await step('14장 1619 자야카르타 · 1623 암보이나(에드먼드)', async () => { SETD(1619, 7); await AT(168); const j = DONE('a14_jakatra'); SETD(1623, 5); await AT(168); return { ok: j && DONE('a14_amboyna') && SAID.some(x => /^에드먼드 헤일/.test(x)), note: SAID.length + '줄' }; });
    await step('15장 해적섬을 사려는 자들 → 돌섬의 원본 → 블랙웰 함대 → 제시카 아흔아홉', async () => { ADV(65); await AT(24); const b0 = DONE('a15_buyers'); const d = G.DISC.atlantis; ADV(20); await SEA(d.lon, d.lat); const pr = DONE('a15_proof'); ADV(30); await SEA(-70, 18); const b = BATTLES.length; await SEA(-70, 18); return { ok: b0 && pr && BATTLES[b - 1].n === 3 && DONE('a15_bw_after') && SAID.some(x => /가까이 와라/.test(x)), note: [b0, pr, BATTLES.length, BATTLES[b - 1] && BATTLES[b - 1].n, DONE('a15_blackwell'), DONE('a15_bw_after')].join('/') + ' · ' + SAID.length + '줄' }; });
    await step('15장 1628 두아르트 → 폭풍 속의 경쟁자 → 【아메리카】 → 교역왕', async () => { SETD(1628, 10); await AT(0); const du = DONE('a15_duarte'); ADV(25); await SEA(-30, 38); G.Game.state.bigDeal.am = { p: 1500000, c: 196, d: 16281201 }; ADV(5); await AT(196); const am = DONE('a15_am_deal'); G.Game.state.achv = G.Game.state.achv || {}; G.Game.state.achv.tradeking = { d: 16281201 }; const kingOk = G.Achieve && G.Achieve.done && G.Achieve.done('tradeking'); if (kingOk) { ADV(5); await AT(196); } return { ok: du && DONE('i15_storm') && am && (!kingOk || DONE('x_king')), note: (kingOk ? '교역왕 사건 ✓' : '교역왕 업적 함수 없음 — 건너뜀') + ' · ' + SAID.length + '줄' }; });
    await step('16장 신용 위기 → 세 대륙 → 순자산 목표 → 현재 연도 결말', async () => { SETD(1629, 4); await AT(24); const c = DONE('a16_crisis'); ADV(10); await AT(168); ADV(10); await AT(97); ADV(10); await AT(196); ADV(10); await AT(24); const blocked = !DONE('a16_finale'), s = G.Game.state; s.player.gold += Math.max(0, G.GOLD.worthGoal - G.GoldSea.worth()); await AT(24); return { ok: c && blocked && DONE('a16_asia') && DONE('a16_africa') && DONE('a16_atlantic') && DONE('a16_finale') && s.gold.finale != null && SAID.some(x => /빚을 모두 빼고도/.test(x)), note: '이름 ' + s.gold.titles.length + '개 · 순자산 ' + G.GoldSea.worth() }; });
    const whoNames = await page.evaluate(() => ['P', 'E', 'M', 'B', 'L', 'YU', 'JN', 'KW', 'PT', 'JS', 'DH', 'EZ', 'SY', 'MT', 'ED', 'YK', 'RB', 'NR', 'DA', 'EA', 'RD', 'GS', 'HM', 'MG', 'TM', 'MO'].map(k => k + '=' + (G.GoldSea.who(k).name || '')).join(' '));
    ok(!/=( |$)|undefined/.test(whoNames), '말하는 사람: ' + whoNames);
    const pg = await page.evaluate(() => { const d = document.createElement('div'); G.GoldSea.page(d); return { tr: d.querySelectorAll('tr').length, worth: /순자산/.test(d.textContent) && /교역왕/.test(d.textContent) }; });
    ok(pg.tr >= 16 && pg.worth, '수첩 「황금의 바다」 ' + (pg.tr - 1) + '장 · 순자산 · 대단한 거래');
    const g = await page.evaluate(() => { const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 0), diff: 'normal' }); G.Game.state = s; return { sp: G.Sponsor.present(G.SPONSOR.gs_vos), active: G.GoldSea.active(), nat: G.R.nationName('PT') }; });
    ok(!g.sp && !g.active && g.nat === '포르투갈', '보통 항해: 포스 저택·이야기는 나오지 않는다');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? '\n' + errors.slice(0, 8).join('\n') : ''));
    console.log('\n통과 ' + passed);
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
