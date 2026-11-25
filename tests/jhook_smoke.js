/* 이야기 모드 「해적여제」 · 이야기 고르기 지도 점검 (js/data/jhook.js · js/systems/jhook.js · js/ui/storyselect.js) — node tests/jhook_smoke.js
   - 타이틀 「이야기 모드」 → 지도에 주인공 초상(마테우스·제시카, 공개일 뒤 소영) · 누르면 소개 · 「이 이야기로 시작」
   - 시작: 세상을 1545년 6월까지 넘김(경쟁자 발표) · 제시카(잉글랜드·여성·20세)·스미스·윌리엄·핀네스 「제비」 · 프롤로그 → 바다
   - 3막부터 16막까지 사건을 차례로 (대화창은 저절로 넘김) · 런던 수배 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const BASE = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
let passed = 0;
function ok(v, msg) { if (!v) throw new Error('✗ ' + msg); passed++; console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb)});
    await page.goto(BASE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !document.querySelector('.title-menu .btn.disabled'), null, { timeout: 120000 });
    const t = await page.evaluate(() => ({ btns: Array.from(document.querySelectorAll('.title-menu .btn')).map(b => b.textContent.trim()), list: G.StorySelect.list().map(m => m.id), rel: G.SONG && G.SONG.release }));
    ok(t.btns.some(b => /이야기 모드/.test(b)) && !t.btns.some(b => /아버지의 사진|바닷길 노래/.test(b)), '타이틀: 이야기 단추 하나 「이야기 모드」 — ' + t.btns.join(' · '));
    ok(t.list.includes('photo') && t.list.includes('jhook') && (Date.now() >= Date.parse(t.rel) || !t.list.includes('song')), '고르기 지도의 주인공: ' + t.list.join(' · '));

    // 대화창은 저절로 — 이야기 고르기 창만 진짜 창
    await page.evaluate(() => {
      const UI = G.UI; window.SAID = []; window._win = UI.window;
      UI.say = async (t, who) => { SAID.push((who && who.name || '') + ': ' + String(t).slice(0, 60)); };
      UI.ask = async (t, opts) => opts[0].value;
      UI.alert = async () => {}; UI.fade = async (fn) => { fn && fn(); };
      UI.window = (o) => /^이야기 모드/.test(o.title || '') ? window._win(o) : ({ result: Promise.resolve(o.buttons ? o.buttons[o.buttons.length - 1].value : null), el: document.createElement('div'), content: Object.assign(document.createElement('div'), {innerHTML:o.html || ''}), close() {} });
    });
    await page.evaluate(() => { window.OPEN = G.StorySelect.open(); });
    await page.waitForSelector('.ss-card', { timeout: 60000 });
    await page.waitForTimeout(800);
    const cards = await page.evaluate(() => Array.from(document.querySelectorAll('.ss-card .nm')).map(n => n.textContent));
    ok(cards.includes('마테우스 다 코스타') && cards.includes('제시카 후크'), '지도 위 초상: ' + cards.join(' · '));
    const mp = await page.evaluate(() => ({ page: document.querySelector('.ss-stage').dataset.page, labels: Object.keys(G.StorySelect._labels || {}).filter(k => /^world:/.test(k)).map(k => k.slice(6)),
      eu: Array.from(document.querySelectorAll('.ss-card')).filter(c => c.dataset.page === 'eu').map(c => c.textContent), arrow: !!document.querySelector('.ss-arrow'), song: G.SongStory.released() }));
    ok(mp.page === 'world' && ['북아메리카', '남아메리카', '유럽', '아프리카', '아시아', '오세아니아'].every(n => mp.labels.includes(n)) && mp.eu.length >= 2, '처음 지도는 세계 — 지역: ' + mp.labels.join('·'));
    ok(!mp.arrow, '지역 전환 화살표 없음 — 주인공을 누르면 출발 지도로 바뀐다');
    await page.screenshot({ path: path.join(process.env.SHOT_DIR || '/tmp', 'storyselect_map.png') });
    const ci = cards.indexOf('제시카 후크');
    await page.evaluate((i) => document.querySelectorAll('.ss-card')[i].click(), ci);
    await page.waitForSelector('.ss-info', { timeout: 5000 });
    const info = await page.evaluate(() => document.querySelector('.ss-info').textContent);
    ok(/해적여제/.test(info) && /1545년/.test(info), '초상을 누르면 소개: ' + info.slice(0, 60));
    await page.waitForTimeout(600); await page.screenshot({ path: path.join(process.env.SHOT_DIR || '/tmp', 'storyselect_info.png') });
    await page.evaluate(() => document.querySelector('.ss-go').click());
    await page.waitForFunction(() => G.Game.state && G.Game.state.jhook && G.Game.state.jhook.prologue && G.Game.sceneName === 'sea', null, { timeout: 180000 });
    const a = await page.evaluate(() => {
      const s = G.Game.state;
      return { name: s.player.name, nation: s.player.nation, g: s.player.g, date: s.date, born: s.player.born.y, age: G.R.age(), mates: s.mates.map(m => m.id + ':' + m.role).join(),
        ship: s.fleet.ships[0].name + '/' + s.fleet.ships[0].type, items: s.player.items.map(i => i.id), said: SAID.length, who: Array.from(new Set(SAID.map(x => x.split(':')[0]))),
        rival: Object.values(s.disc).filter(x => x.rival).length, nat: G.R.nationName('EN'), lang: G.R.nativeLang('EN'),
        wanted: !!G.Scenes.city.entryCheck(G.CITY_DATA[38]), face: G.Img.pick(s.player.portrait.img || []), half: G.Img.pick(G.Img.chain.heroHalf()) };
    });
    ok(a.name === '제시카 후크' && a.nation === 'EN' && a.g === 'f' && a.date.y === 1545 && a.date.m === 6 && a.age === 20, '제독: ' + a.name + ' · 잉글랜드 · 여 · ' + a.date.y + '년 ' + a.date.m + '월 · ' + a.age + '세');
    ok(a.nat === '잉글랜드' && a.lang === 3, '잉글랜드 제독: 나라 이름 · 모국어 게르만어');
    ok(a.rival > 30, '1480~1545 경쟁자 발표가 반영됨: ' + a.rival + '건');
    ok(a.mates === 'jh_smith:first,jh_william:nav' && a.ship === '제비/pinnace' && a.items.includes('jh_coat') && a.items.includes('jh_compass'), '스미스·윌리엄 · 핀네스 「제비」 · 외투·나침반');
    ok(a.said > 70 && ['스미스 호킨스', '로저 후크', '블랙웰', '어린 제시카', '제시카 후크'].every(n => a.who.includes(n)), '프롤로그·1막·2막 대사 ' + a.said + '줄 — ' + a.who.join('·'));
    ok(a.wanted && a.face === 'portraits/player/jessica' && a.half === 'characters/player_half_jessica', '런던은 수배 중 · 제시카 얼굴·무릎상');

    await page.evaluate(() => {
      window.SETD = (y, m) => { const s = G.Game.state; s.date = { y, m, d: 2 }; };
      window.ADV = (n) => { const s = G.Game.state; s.date = G.U.addDays(s.date, n); s.day += n; };
      window.AT = (id) => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat, heading: 0 }; SAID.length = 0; return G.JHook.arrive(c, {}); };
      window.SEA = (lon, lat) => { const s = G.Game.state; s.loc = { mode: 'sea', lon, lat, heading: 0 }; SAID.length = 0; return G.JHook.seaPending() ? G.JHook.atSea() : false; };
      window.DONE = (id) => G.JHook.done(id); window.BATTLES = [];
      const go = G.Game.go; G.Game.go = function (n, arg) { if (n === 'battle') { BATTLES.push(arg.npc); G.Game.state.stats.battles = (G.Game.state.stats.battles || 0) + 1; G.StoryBattle.finish(arg.npc, 'win'); return; } return go.apply(this, arguments); };
    });
    async function step(label, fn) { const r = await page.evaluate(fn); ok(r && r.ok, label + (r && r.note ? ' — ' + r.note : '')); }
    await step('3막 브리스틀: 킬리그루 · 코난 합류 · 「되새」호', async () => { ADV(5); await AT(40); const s = G.Game.state; return { ok: DONE('a3_killigrew') && s.mates.some(m => m.id === 'jh_conan') && s.fleet.ships.some(x => x.name === '되새'), note: SAID.length + '줄' }; });
    await step('4막 아일랜드 앞바다: 그레이스', async () => { ADV(5); await SEA(-9, 53); return { ok: DONE('a4_grace') && SAID.some(x => /그레이스/.test(x)), note: SAID.length + '줄' }; });
    await step('5막 루시아: 해전 → 남은 배를 구한다 → 합류', async () => { ADV(10); await SEA(-20, 34); const b = BATTLES.length; await SEA(-20, 34); return { ok: b === 1 && DONE('a5_lucia2') && G.Game.state.mates.some(m => m.id === 'jh_lucia'), note: '해전 ' + b + ' · ' + SAID.length + '줄' }; });
    await step('5막 코피(산호르헤) · 마리암(아라비아 해) · 첸레이(쌍서항)', async () => { ADV(20); await AT(97); ADV(20); await SEA(60, 15); ADV(20); await SEA(122, 29.7); const s = G.Game.state; return { ok: ['jh_kofi', 'jh_mariam', 'jh_chenlei'].every(id => s.mates.some(m => m.id === id)), note: s.mates.map(m => m.id).join(',') }; });
    await step('5막 헨리의 죽음(1547) · 해적여제의 규칙', async () => { SETD(1547, 4); await AT(0); const h = DONE('a5_henry'); ADV(3); await SEA(-15, 40); return { ok: h && DONE('a5_rules') && G.Game.state.jhook.titles.includes('해적여제'), note: SAID.length + '줄' }; });
    await step('6막 스미스의 고백 → 아틀란티스의 도현 → 아버지의 문서', async () => { ADV(5); await AT(0); const hint = !!G.Game.state.hints.atlantis; const d = G.DISC.atlantis; ADV(20); await SEA(d.lon, d.lat); const s = G.Game.state; return { ok: hint && DONE('a6_atlantis') && s.player.items.some(i => i.id === 'jh_license') && SAID.some(x => /^도현/.test(x)) && !G.Scenes.city.entryCheck(G.CITY_DATA[38]), note: SAID.length + '줄' }; });
    await step('7·8막 화이트홀 — 소년 왕과 제인 · 비밀 기사', async () => { SETD(1548, 6); await AT(38); return { ok: DONE('a7_palace') && DONE('a8_knight') && G.Game.state.player.items.some(i => i.id === 'jh_seal'), note: SAID.length + '줄' }; });
    await step('8막 편지 다섯 통 (1549~1553)', async () => { for (let y = 1549; y <= 1553; y++) { SETD(y, 2); await AT(40); } return { ok: [1, 2, 3, 4, 5].every(k => DONE('a8_letter' + k)) }; });
    await step('9막 1553년 7월 런던 — 제인 구출·합류', async () => { SETD(1553, 7); await AT(38); return { ok: DONE('a9_jane') && G.Game.state.mates.some(m => m.id === 'jh_jane'), note: SAID.length + '줄' }; });
    await step('10막 해협 — 스미스의 반대 · 탑의 엘리자베스', async () => { SETD(1554, 3); await SEA(-1.5, 50.3); const a = DONE('a10_hunt') && SAID.some(x => /그 명령은 못 따른다/.test(x)); ADV(5); await AT(38); return { ok: a && DONE('a10_tower'), note: SAID.length + '줄' }; });
    await step('11·12막 요크의 이별 → 마당섬', async () => { ADV(10); await AT(39); const m = G.Game.state.player.items.some(i => i.id === 'jh_map'); ADV(40); await SEA(-72, 18); return { ok: m && DONE('a11_york') && DONE('a12_island'), note: SAID.length + '줄' }; });
    await step('12·13막 1558년 겨울 편지 → 마당의 회의 → 여왕의 협력자', async () => { SETD(1558, 12); await AT(40); const l = DONE('a12_letter'); ADV(5); await AT(39); ADV(5); await AT(38); return { ok: l && DONE('a13_council') && DONE('a13_court'), note: SAID.length + '줄' }; });
    await step('14막 드레이크 → 무적함대 해전 → 키를 돌린다', async () => { ADV(25); await AT(39); const d = DONE('a14_drake'); ADV(5); await SEA(1, 51); const b = BATTLES.length; await SEA(1, 51); return { ok: d && DONE('a14_battle') && DONE('a14_after') && BATTLES[b - 1].kind === 'navy' && SAID.some(x => /키 돌려/.test(x)), note: SAID.length + '줄' }; });
    await step('15·16막 작위를 돌려주다 → 돌아온 해적여제 (끝)', async () => { ADV(10); await AT(38); const a = DONE('a15_title'); ADV(20); await AT(40); return { ok: a && DONE('a16_home') && G.Game.state.jhook.finale != null && SAID.some(x => /집 쪽이야, 여기/.test(x)), note: SAID.length + '줄' }; });
    const whoNames = await page.evaluate(() => ['P', 'S', 'W', 'C', 'LU', 'KO', 'MR', 'CL', 'JG', 'GO', 'KG', 'DR', 'DH', 'RG', 'BW', 'ED', 'MQ', 'EL', 'priest'].map(k => k + '=' + (G.JHook.who(k).name || '')).join(' '));
    ok(!/=( |$)|undefined/.test(whoNames), '말하는 사람: ' + whoNames);
    const pg = await page.evaluate(() => { const d = document.createElement('div'); G.JHook.page(d); return d.querySelectorAll('tr').length; });
    ok(pg >= 15, '수첩 「해적여제」 쪽 ' + (pg - 1) + '막');
    const g = await page.evaluate(() => { const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 0), diff: 'normal' }); G.Game.state = s; return { sp: G.Sponsor.present(G.SPONSOR.jh_killigrew), active: G.JHook.active(), lon: !!G.Scenes.city.entryCheck(G.CITY_DATA[38]) && G.Scenes.city.entryCheck(G.CITY_DATA[38]).reason === 'wanted' }; });
    ok(!g.sp && !g.active && !g.lon, '보통 항해: 킬리그루·수배는 나오지 않는다');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? '\n' + errors.slice(0, 8).join('\n') : ''));
    console.log('\n통과 ' + passed);
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
