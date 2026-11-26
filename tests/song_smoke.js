/* 이야기 모드 「바닷길 노래」 점검 (js/data/song.js · js/systems/song.js) — node tests/song_smoke.js   (BROWSER_EXE=크롬 경로)
   - 공개일 전에는 타이틀에 단추가 없고, ?song=1 이면 있다
   - 시작: 김소영(조선·여성·한산도)·황규·박월담·맹선 「물마루」·사또와 곡부 계약·단서·명나라 노인(路引)
   - 프롤로그부터 12막까지 사건을 차례로 일으켜 본다 (대화창은 저절로 넘김) — 동료 합류·목소리·아틀란티스·끝
   - 바닷길 공연: 실제 무대 창·음악·관객·사례·고장 노래 배우기·같은 도시 다시 열기 막힘·목소리 잃었을 때 막힘
   - 보통 항해에서는 이 모드의 발견물·후원자가 나오지 않는다. 수첩 「소영의 지도」 쪽. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const BASE = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
let passed = 0;
function ok(v, msg) { if (!v) throw new Error('✗ ' + msg); passed++; console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  function watch(page) {
    page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  }
  try {
    // ── 공개일 잠금
    const p0 = await browser.newPage({ viewport: { width: 1280, height: 720 } }); watch(p0);
    await p0.goto(BASE);
    await p0.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const t0 = await p0.evaluate(() => ({ list: G.StorySelect.list().map(m => m.id), rel: G.SONG.release, now: Date.now(), released: G.SongStory.released() }));
    if (Date.now() < Date.parse(t0.rel)) ok(!t0.list.includes('song') && !t0.released, '공개일(' + t0.rel + ') 전: 이야기 고르기 지도에 소영이 없다 — ' + t0.list.join(' · '));
    await p0.close();

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); watch(page);
    await page.goto(BASE + '?song=1');
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const btns = await page.evaluate(() => G.StorySelect.list().map(m => m.id));
    ok(btns.includes('song'), '?song=1 미리 보기: 이야기 고르기 지도에 소영 — ' + btns.join(' · '));
    await page.evaluate(() => { window.SSOPEN = G.StorySelect.open(); });
    await page.waitForSelector('.ss-card', { timeout: 60000 });
    const e0 = await page.evaluate(() => ({ page: document.querySelector('.ss-stage').dataset.page, arrow: !!document.querySelector('.ss-arrow'), card: Array.from(document.querySelectorAll('.ss-card')).filter(c => c.dataset.page === 'ea').map(c => c.textContent) }));
    ok(e0.page === 'world' && !e0.arrow && e0.card.join() === '김소영', '이야기 고르기: 처음엔 세계 지도 · 지역 단추 없이 소영도 보임');
    for (let k = 0; k < 6 && await page.evaluate(() => document.querySelector('.ss-stage').dataset.page !== 'ea'); k++) await page.keyboard.press('ArrowRight');   // 유럽의 주인공을 다 지나면 동쪽 바다로
    await page.waitForTimeout(900);
    const e1 = await page.evaluate(() => ({ page: document.querySelector('.ss-stage').dataset.page, on: (document.querySelector('.ss-card.on') || {}).textContent, kr: !!(G.StorySelect._labels || {})['ea:조선'] }));
    ok(e1.page === 'ea' && e1.on === '김소영' && e1.kr, '→ 키로 소영 선택 — 동아시아 지도·소개가 함께 열림');
    await page.evaluate(() => document.querySelector('.ss-card[data-story="photo"]').click()); await page.waitForTimeout(200);
    ok(await page.evaluate(() => document.querySelector('.ss-stage').dataset.page === 'eu'), '마테우스 초상으로 유럽에 돌아옴');
    await page.evaluate(() => document.querySelector('.ss-return').click());
    await page.evaluate(() => window.SSOPEN);

    // 대화창은 저절로 넘긴다. 공연 창만 진짜 창으로
    await page.evaluate(() => {
      const UI = G.UI; window.SAID = []; window.ASKS = []; window.CHOOSE = null;
      window._win = UI.window;
      UI.say = async (t, who) => { SAID.push((who && who.name || '') + ': ' + String(t).slice(0, 50)); };
      UI.ask = async (t, opts) => { ASKS.push(t); const o = window.CHOOSE != null ? opts.filter(x => x.value === window.CHOOSE)[0] : null; return (o || opts[0]).value; };
      UI.alert = async () => {}; UI.fade = async (fn) => { fn && fn(); };
      UI.window = (o) => /^바닷길 공연/.test(o.title || '') ? window._win(o) : ({ result: Promise.resolve(o.buttons ? o.buttons[o.buttons.length - 1].value : null), el: document.createElement('div'), content: document.createElement('div') });
      G.Scenes.discoveryCard = async () => {}; if (G.Names) G.Names.offer = async () => {};
      G.FX.song = { sec: 1.2, fast: true };   // fast: 제목 카드·노랫가락을 기다리지 않는다
    });
    await page.evaluate(async () => { await G.Game.ensureGeo(); G.SongStory.start(); G.Game.go('city', { cityId: 229, song: true }); });
    // ── 도입부: 한산도를 걸으며 한 장면씩 (거리 → 자택 → 항구 → 술집 → 한산 관아 → 항구)
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.song && G.Game.state.song.pro >= 1 && !G.Scenes.city.isBusy(), null, { timeout: 120000 });
    const p1 = await page.evaluate(() => { const s = G.Game.state, t = s.song, td = G.SongStory.todo(G.CITY_DATA[229]); return { pro: t.pro, done: !!t.prologue, said: SAID.length, mates: s.mates.map(m => m.id).join(), contract: !!s.contract, todo: td.map(x => x.kind + ':' + x.text.replace(/<[^>]*>/g, '')), shots: G.SongStory._shots, cards: G.SongStory._cards, shotOn: G.SongStory.shotOn(), can: G.SongStory.canConcert(G.CITY_DATA[229]).ok }; });
    ok(p1.pro === 1 && !p1.done && p1.said >= 10 && p1.said < 20 && p1.mates === 'sy_hwanggyu' && !p1.contract, '도입부 ① 거리: 갯바위의 기억과 황규 — 대사 ' + p1.said + '줄만 보고 걸을 수 있다 (계약·출항은 아직)');
    ok(p1.todo.length === 1 && /^home:자택/.test(p1.todo[0]) && p1.shots === 1 && p1.cards === 2 && !p1.shotOn && !p1.can, '할 일 맨 위에 다음 갈 곳 하나 — ' + p1.todo[0] + ' · 이벤트 샷 ' + p1.shots + ' · 제목 카드 ' + p1.cards);
    async function goIn(kind) {
      await page.evaluate(async (k) => { SAID.length = 0; const td = G.SongStory.todo(G.Scenes.city.city())[0]; await G.Scenes.city.visit(k, td && td.kind === k ? td.arg : (k === 'mansion' ? G.R.bldArg(G.SPONSOR.sy_imsato) : undefined)); }, kind);
      await page.waitForFunction(() => !G.Scenes.city.isBusy(), null, { timeout: 60000 });
      return page.evaluate(() => { const s = G.Game.state, t = s.song, td = G.SongStory.todo(G.CITY_DATA[229])[0]; return { pro: t.pro, done: !!t.prologue, said: SAID.length, first: SAID[0] || '', who: Array.from(new Set(SAID.map(x => x.split(':')[0]))), cur: G.Scenes.city.current() && G.Scenes.city.current().kind, next: td ? td.kind : '', mates: s.mates.map(m => m.id).join(), shots: G.SongStory._shots, shotOn: G.SongStory.shotOn(), last: G.SongStory._lastShot || {} }; });
    }
    const n1 = await goIn('harbor');
    ok(n1.pro === 1 && n1.said === 1 && !n1.cur && /집부터/.test(n1.first), '아직 때가 아닌 항구: 한마디 듣고 거리로 — ' + n1.first);
    const n2 = await goIn('mansion');
    ok(n2.pro === 1 && n2.said === 1 && !n2.cur && /^관아 아전/.test(n2.first), '아직 때가 아닌 관아: ' + n2.first);
    const dep = await page.evaluate(async () => { SAID.length = 0; const r = await G.Scenes.city.B.harbor.depart(G.CITY_DATA[229]); return { r, scene: G.Game.sceneName, said: SAID.length }; });
    ok(dep.r === false && dep.scene === 'city' && dep.said === 1, '도입부를 마치기 전에는 출항이 막힌다');
    const freeIn = await goIn('trade');
    ok(freeIn.pro === 1 && freeIn.cur === 'trade', '교역소 같은 다른 건물은 언제든 드나든다');
    await page.evaluate(() => G.Scenes.city.leave());
    const h1 = await goIn('home');
    ok(h1.pro === 2 && !h1.cur && h1.next === 'harbor' && ['도현 아저씨', '어린 소영', '소영의 어머니'].every(n => h1.who.includes(n)) && h1.shots - n2.shots === 3 && !h1.shotOn, '② 자택: 지도와 끝맺지 못한 노래 — ' + h1.said + '줄 · 이벤트 샷 3장(이야기·노래·빈방) → 다음은 항구');
    const h2 = await goIn('harbor');
    ok(h2.pro === 3 && !h2.cur && h2.next === 'tavern' && h2.who.includes('박월담') && h2.mates === 'sy_hwanggyu' && h2.last.cast === 2, '③ 항구: 황규의 품삯 꾸러미 · 새 갓을 쓴 선비 — ' + h2.said + '줄 → 다음은 술집');
    const h3 = await goIn('tavern');
    ok(h3.pro === 4 && !h3.cur && h3.next === 'mansion' && h3.last.cast === 3 && /주막의 밤/.test(h3.last.title), '④ 술집: 주막의 밤(셋이 선 이벤트 샷) · 다음 날 아침 — ' + h3.said + '줄 → 다음은 한산 관아');
    const h4 = await goIn('mansion');
    ok(h4.pro === 5 && !h4.done && !h4.cur && h4.next === 'harbor' && h4.mates === 'sy_hwanggyu,sy_woldam' && h4.who.includes('사또 임처사'), '⑤ 한산 관아: 사또의 조건 · 박월담이 일행이 됨 — ' + h4.said + '줄 → 다음은 항구');
    const h5 = await goIn('harbor');
    ok(h5.pro === 6 && h5.done && h5.cur === 'harbor' && !h5.shotOn, '⑥ 항구: 물마루호 — 도입부 끝, 그대로 항구 메뉴(출항 준비)');
    await page.evaluate(() => { SAID.length = 200; G.Scenes.city.leave(); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.song && G.Game.state.song.prologue && !G.Scenes.city.isBusy(), null, { timeout: 120000 });
    const a = await page.evaluate(() => {
      const s = G.Game.state;
      return { name: s.player.name, given: s.player.given, nation: s.player.nation, g: s.player.g, home: s.player.home, city: s.loc.city, look: s.player.look,
        mates: s.mates.map(m => m.id + ':' + m.role), ship: s.fleet.ships[0].name + '/' + s.fleet.ships[0].type, contract: s.contract && s.contract.disc + '@' + s.contract.sponsor,
        hints: Object.keys(s.hints), pass: s.song.pass, said: SAID.length, who: Array.from(new Set(SAID.map(x => x.split(':')[0]))),
        nat: G.R.nationName('KR'), lang: G.R.nativeLang('KR'), homeNat: G.R.isHomeNation(G.CITY_DATA[190]), ming: G.Scenes.city.entryCheck(G.CITY_DATA[177]),
        face: G.Img.pick(s.player.portrait.img || []), half: G.Img.pick(G.Img.chain.heroHalf()), wd: G.Img.pick(G.Img.chain.mateHalf('sy_woldam')), hg: G.Img.pick(G.Art.mateSpec('sy_hwanggyu').img || []),
        map: s.player.items.some(it => it.id === 'sy_map'), known: s.known.length, rocco: s.mates.some(m => m.id === 'rocco') };
    });
    ok(a.name === '김소영' && a.given === '소영' && a.nation === 'KR' && a.g === 'f' && a.home === 229 && a.city === 229, '제독: ' + a.name + ' · ' + a.nation + ' · 여 · 한산도');
    ok(a.nat === '조선' && a.lang === 14 && a.homeNat === true, '조선 사람 제독: 나라 이름·모국어·조선 도시가 고국');
    ok(a.mates.join() === 'sy_hwanggyu:nav,sy_woldam:first' && !a.rocco, '동료: ' + a.mates.join(' · '));
    ok(a.ship === '물마루/maengseon' && a.map, '배 「물마루」(맹선) · 도현의 지도를 지님');
    ok(a.contract === 'qufu@sy_imsato' && a.hints.includes('qufu') && a.hints.includes('sy_longmen') && a.pass, '사또와 곡부 계약 · 단서 ' + a.hints.join(',') + ' · 노인(路引)');
    ok(a.ming === null, '노인이 있으면 명나라 항구(항주)에 들어갈 수 있다');
    ok(a.face === 'portraits/player/soyoung' && a.half === 'characters/player_half_soyoung' && a.wd === 'portraits/mates/sy_woldam_half' && a.hg === 'portraits/mates/sy_hwanggyu', '그림: 소영 얼굴·무릎상 · 월담·황규 초상');

    // ── 바닷길 공연 (진짜 무대 창)
    async function concertAt(id, choose) {
      return page.evaluate(async ([id, choose]) => {
        const s = G.Game.state, c = G.CITY_DATA[id]; s.loc.mode = 'city'; s.loc.city = id;
        window.CHOOSE = choose || null;
        const can = G.SongStory.canConcert(c);
        if (!can.ok) return { blocked: can.why };
        const g0 = s.player.gold, pr = G.SongStory.concert(c);
        await new Promise(r => setTimeout(r, 400));
        const stage = document.querySelector('.song-stage'), cast = stage ? stage.querySelectorAll('.who').length : 0;
        const phase = stage ? stage.querySelector('.phase').textContent + '|' + stage.querySelector('.lyric .cur').textContent : '';
        await new Promise(r => setTimeout(r, 1500));
        const res = document.querySelector('.song-stage .result'); const txt = res ? res.textContent : '';
        const btn = Array.from(document.querySelectorAll('.win .foot button')).filter(b => /무대를 정리한다|막을 내린다/.test(b.textContent))[0]; if (btn) btn.click();
        const r = await pr; window.CHOOSE = null;
        return { r, cast, txt, phase, bow: !!(stage && stage.classList.contains('bowing')), gold: s.player.gold - g0, rep: s.song.rep.slice(), todo: G.SongStory.todo(c).map(x => x.text) };
      }, [id, choose]);
    }
    const c1 = await concertAt(229);
    ok(c1.r && c1.r.crowd > 0 && c1.gold === c1.r.gold && c1.cast === 3 && /공연장이 되었다/.test(c1.txt), '한산도 공연: 무대에 셋 · 관객 ' + c1.r.crowd + ' · 사례 ' + c1.gold + '닢');
    ok(/^(길놀이|첫 소절|둘째 소절)\|.+/.test(c1.phase) && c1.bow, '공연의 흐름: 길놀이 → 소절 → 인사 (' + c1.phase.slice(0, 40) + ' … 인사)');
    const op = await page.evaluate(() => ({ open: SAID.filter(x => /^(황규|박월담): /.test(x)).length, close: SAID.filter(x => /^: /.test(x)).length }));
    ok(op.open >= 1 && op.close >= 1, '공연의 여는 말(동료)과 맺는 말(해설)이 있다');
    const c1b = await concertAt(229);
    ok(c1b.blocked, '같은 도시·바로 다음 공연은 막힌다 — ' + c1b.blocked);

    // 날을 넘기는 도우미
    await page.evaluate(() => {
      window.ADV = (n) => { const s = G.Game.state; s.date = G.U.addDays(s.date, n); s.day += n; };
      window.AT = (id) => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat, heading: 0 }; SAID.length = 0; return G.SongStory.arrive(c, {}); };
      window.SEA = (lon, lat) => { const s = G.Game.state; s.loc = { mode: 'sea', lon, lat, heading: 0 }; SAID.length = 0; return G.SongStory.seaPending() ? G.SongStory.atSea() : false; };
      window.FIND = (id) => { SAID.length = 0; return G.Disc.find(G.DISC[id], G.DISC[id].how); };
      window.REP = (id) => { const s = G.Game.state; s.disc[id] = s.disc[id] || {}; s.disc[id].reported = true; if (s.contract && s.contract.disc === id) s.contract = null; };
      window.DONE = (id) => G.SongStory.done(id);
      window.BATTLES = [];
      const go = G.Game.go; G.Game.go = function (n, arg) { if (n === 'battle') { BATTLES.push(arg.npc); G.Game.state.stats.battles = (G.Game.state.stats.battles || 0) + 1; G.StoryBattle.finish(arg.npc, 'win'); return; } return go.apply(this, arguments); };
    });
    async function step(label, fn, check) {
      const r = await page.evaluate(fn);
      ok(r && r.ok, label + (r && r.note ? ' — ' + r.note : ''));
    }
    await step('1막 곡부·용문: 장면과 지도 고쳐 쓰기', async () => {
      ADV(30); await FIND('qufu'); const a = SAID.length; ADV(10); await FIND('sy_longmen'); const b = SAID.length;
      const L = G.SongStory._lastShot || {};
      return { ok: DONE('a1_qufu') && DONE('a1_longmen') && a > 8 && b > 6 && L.painted && /용문/.test(L.title) && !G.SongStory.shotOn() && G.Game.state.song.actSeen[1] != null, note: a + '줄 · ' + b + '줄 · 원화 이벤트 샷 「' + L.title + '」 · 제1막 카드' };
    });
    await step('1막 보고 → 둘째 계약(도다이지)', async () => {
      REP('qufu'); ADV(20); await AT(229); const s = G.Game.state;
      const L = G.SongStory._lastShot || {};
      return { ok: DONE('a1_report') && s.contract && s.contract.disc === 'sy_todaiji' && s.song.act >= 2 && !L.painted && L.cast >= 2 && /한산 관아/.test(L.title) && /mansion/.test(L.key) && !G.SongStory.shotOn(), note: SAID.length + '줄 · 꾸린 이벤트 샷 「' + L.title + '」(' + L.cast + '명)' };
    });
    await step('2막 항주(견우)·사카이(직녀) → 둘이 동료', async () => {
      ADV(15); await AT(177); const h = SAID.length; ADV(10); await AT(192); const s = G.Game.state;
      return { ok: DONE('a2_hangzhou') && DONE('a2_sakai') && s.mates.some(m => m.id === 'gyeonwoo') && s.mates.some(m => m.id === 'jiknyeo') && s.gw && s.gw.end === 'crew' && !G.Gyeonwoo.ready(G.CITY_DATA[229]), note: h + '줄 · ' + SAID.length + '줄' };
    });
    await step('2막 도다이지 → 보고 → 사또 사직(저택에 없음)', async () => {
      ADV(5); await FIND('sy_todaiji'); REP('sy_todaiji'); ADV(20); await AT(229);
      return { ok: DONE('a2_todaiji') && DONE('a2_report') && !G.Sponsor.present(G.SPONSOR.sy_imsato), note: SAID.length + '줄' };
    });
    await step('3막 사흘 뒤 바다: 하회탈 → 임처사 합류', async () => {
      ADV(1); await SEA(128.6, 34.4); const early = DONE('a3_stow'); ADV(3); await SEA(128.6, 34.4);
      return { ok: !early && DONE('a3_stow') && G.Game.state.mates.some(m => m.id === 'sy_imcheosa') && SAID.some(x => /하회탈의 악사/.test(x)), note: SAID.length + '줄' };
    });
    const c2 = await concertAt(177, 'learn');
    ok(c2.r && c2.cast === 4 && c2.rep.includes(6), '넷의 첫 공연(항주): 무대에 넷 · 고장 노래를 배움 — 관객 ' + c2.r.crowd);
    await step('4막 왜구 → 해전 → 밧줄', async () => {
      ADV(7); await SEA(126, 30); const b = BATTLES.length; await SEA(126, 30);
      return { ok: DONE('a4_wako') && b === 1 && BATTLES[0].kind === 'pirate' && DONE('a4_after') && G.Game.state.song.flags.wakoFriends != null, note: '해전 ' + b + '번 · ' + SAID.length + '줄' };
    });
    await step('5막 금봉호: 계약 거절 → 누명 → 지나 합류', async () => {
      ADV(5); await AT(174); ADV(13); await AT(175); ADV(11); await AT(177); const s = G.Game.state;
      return { ok: DONE('a5_contract') && DONE('a5_framed') && DONE('a5_jina') && s.mates.some(m => m.id === 'jina') && s.wangMerch.jina != null, note: SAID.length + '줄' };
    });
    await step('6막 돌 속의 도시: 앙코르·페트라 (지도 고쳐 쓰기)', async () => {
      ADV(30); await FIND('angkor'); const a = SAID.length; ADV(30); await FIND('petra'); const s = G.Game.state;
      return { ok: s.song.marks.angkor != null && s.song.marks.petra != null && a > 4 && SAID.some(x => /알리바바/.test(x)), note: a + '줄 · ' + SAID.length + '줄' };
    });
    await step('7막 리스본: 마테우스 · 「다시 올 곳」', async () => {
      ADV(40); await AT(0); const a = SAID.length; ADV(5); await AT(18);
      return { ok: DONE('a7_lisbon') && DONE('r2_letter') && SAID.length > 6 && a > 15, note: a + '줄 · 편지 ' + SAID.length + '줄' };
    });
    await step('8막 프랑스(파리) → 말린디 몰래 승선', async () => {
      ADV(10); await AT(14); const a = SAID.length; ADV(5); await SEA(-5, 46); const s = G.Game.state;
      return { ok: DONE('a8_france') && DONE('a8_malindi') && s.mates.some(m => m.id === 'sy_malindi') && s.song.flags.europeBand != null && SAID.some(x => /^말린디/.test(x)), note: a + '줄 · ' + SAID.length + '줄' };
    });
    await step('9막 다시 만난 마테우스 → 같은 사람 → 합작 사고 → 고백 → 위로', async () => {
      ADV(9); await AT(0); const a = DONE('a9_mateus'); ADV(11); await AT(18); ADV(13); await AT(0); ADV(8); await AT(14); const conf = SAID.slice(); ADV(1); await AT(15);
      return { ok: a && DONE('r4_same') && DONE('r6_mishap') && DONE('r7_confess') && DONE('r8_comfort') && conf.some(x => /좋아해요/.test(x)), note: '고백 ' + conf.length + '줄 · 위로 ' + SAID.length + '줄' };
    });
    await step('10막 카리브: 후크 → 폭풍(목소리 잃음·후크 합류)', async () => {
      ADV(30); await AT(213); ADV(3); await SEA(-70, 15); const s = G.Game.state;
      return { ok: DONE('a10_hook') && DONE('a10_storm') && s.mates.some(m => m.id === 'sy_hook') && G.SongStory.voiceLost(), note: SAID.length + '줄' };
    });
    const c3 = await concertAt(213);
    ok(c3.blocked && /목소리/.test(c3.blocked), '목소리를 잃은 동안 공연은 막힌다 — ' + c3.blocked);
    await step('10막 선장 노릇 → 콧노래 (목소리가 돌아옴)', async () => {
      ADV(2); await AT(212); const care = DONE('a10_care'); ADV(10); await AT(211); const early = DONE('a10_hum'); ADV(80); await AT(211);
      return { ok: care && !early && DONE('a10_hum') && !G.SongStory.voiceLost(), note: SAID.length + '줄' };
    });
    await step('11막 편지 사본 → 아틀란티스 사슬 단서 → 마지막 소절', async () => {
      ADV(5); await AT(0); const hints = Object.keys(G.Game.state.hints).filter(h => /knossos|gibraltar|akrotiri|timaeus|gadir|azores|atlantis/.test(h));
      ADV(60); await FIND('atlantis'); const s = G.Game.state;
      return { ok: DONE('a11_letter') && hints.length >= 1 && s.song.end === 'done' && SAID.some(x => /마지막 소절, 제가 붙였어요/.test(x)), note: '단서 ' + hints.join(',') + ' · 끝 장면 ' + SAID.length + '줄' };
    });
    await step('11막 작별 · 12막 귀향 (끝)', async () => {
      ADV(10); await AT(0); ADV(30); await AT(229); const s = G.Game.state;
      return { ok: DONE('a11_farewell') && DONE('a12_home') && s.song.finale != null && SAID.some(x => /그다음은 네가 가서 알려 줘/.test(x)), note: SAID.length + '줄' };
    });
    const c4 = await concertAt(0, 'full');
    ok(c4.r && c4.cast === 4, '끝난 뒤 「바닷길 노래」를 끝까지 — 관객 ' + c4.r.crowd);
    const late = await page.evaluate(async () => { ADV(40); SAID.length = 0; window.CHOOSE = null; const s = G.Game.state; s.loc.city = 14; return 1; });
    const c5 = await concertAt(14);
    const r12 = await page.evaluate(() => ({ done: DONE('r12_song'), last: G.SongStory._lastShot || {} }));
    ok(c5.r && r12.done, '공연 뒤 「아직 조금 슬퍼요. 그런데 이제는 이 노래가 좋아요.」');
    ok(r12.last.painted && /^song\/concerts\//.test(r12.last.key) && r12.last.title === '그 노래', '공연 뒤 사건 「그 노래」는 그 고장의 공연 원화 위에서 — ' + r12.last.key);
    // 공연 원화: 넷이 모이면 네 명 원화, 임처사가 오기 전의 셋은 <지역>_trio 가 있을 때만
    const art = await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA[229], keep = s.mates.slice(), F = G.IMAGE_FILES, A = G.SongStory.concertArt;
      const four = A(c);
        s.mates = keep.filter(m => m.id !== 'sy_imcheosa'); const trio0 = A(c);
        const has0 = G.Img.has; G.Img.has = k => k !== 'song/concerts/kr_trio' && has0.call(G.Img, k); const trioAbsent = A(c); G.Img.has = has0;
      const has = G.Img.has; G.Img.has = k => k === 'song/concerts/kr_trio' || has.call(G.Img, k); const trio1 = A(c);
      s.mates = keep.filter(m => m.id !== 'sy_imcheosa' && m.id !== 'sy_woldam'); const duo = A(c);
      G.Img.has = has; s.mates = keep; void F;
        return { four, trio0, trioAbsent, trio1, duo };
    });
      ok(art.four === 'song/concerts/kr' && art.trio0 === 'song/concerts/kr_trio' && art.trioAbsent === null && art.trio1 === 'song/concerts/kr_trio' && art.duo === null, '공연 원화: 넷 → ' + art.four + ' · 셋(임처사 전) → ' + art.trio0 + ' · 그림이 없는 묶음은 무릎상 무대');

    // 대사에 이름 없는 사람·자리표가 남지 않았나
    const bad = await page.evaluate(() => {
      const D = G.SONG, out = [];
      const codes = new Set(['P', 'Y', 'W', 'H', 'I', 'D', 'M', 'J', 'GW', 'JN', 'MA', 'JI', 'HK', 'ML', 'DA', 'AB', 'N'].concat(Object.keys(D.npcs)));
      function walk(lines) { (lines || []).forEach(l => { if (Array.isArray(l)) { const k = String(l[0]).replace(/^\?/, ''); if (!codes.has(k)) out.push(k); } else if (l && l.opts) l.opts.forEach(o => walk(o[1])); }); }
      D.prologue.stages.forEach(st => walk(st.lines)); Object.values(D.prologue.notYet).forEach(v => (Array.isArray(v) ? [v] : Object.values(v)).forEach(l => walk([l]))); D.beats.forEach(b => walk(b.lines)); Object.values(D.markScenes).forEach(walk); walk(D.ending.meet);
      D.beats.forEach(b => (b.after || []).forEach(x => { if (x !== 'end' && !D.beats.some(y => y.id === x)) out.push('after:' + x); }));
      return out;
    });
    ok(!bad.length, '대사의 말하는 사람·앞 사건 이름이 모두 있다' + (bad.length ? ' — ' + bad.join(',') : ''));
    const whoNames = await page.evaluate(() => ['P', 'W', 'H', 'I', 'D', 'M', 'J', 'GW', 'JN', 'MA', 'JI', 'HK', 'ML', 'DA', 'AB', 'RO', 'wako', 'keeper_qufu'].map(k => k + '=' + (G.SongStory.who(k).name || '')).join(' '));
    ok(!/=( |$)|undefined/.test(whoNames), '말하는 사람 이름: ' + whoNames);

    // 수첩
    const pg = await page.evaluate(() => { const d = document.createElement('div'); G.SongStory.page(d); return { rows: d.querySelectorAll('tr').length, map: !!d.querySelector('.song-map canvas'), txt: d.textContent.slice(0, 80) }; });
    ok(pg.rows >= 9 && pg.map, '수첩 「소영의 지도」: 지도 그림 · 표시 ' + (pg.rows - 1) + '곳');

    // 보통 항해에서는 나오지 않는다
    const g = await page.evaluate(() => {
      const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 0), diff: 'normal' });
      G.Game.state = s; const d = G.DISC.sy_todaiji;
      return { avail: G.Disc.available(d), hint: G.Disc.addHint('sy_todaiji', 'test'), land: G.Disc.checkLand(d.lon, d.lat, { search: true }).hits.map(x => x.id), sp: G.Sponsor.present(G.SPONSOR.sy_imsato), active: G.SongStory.active(), nat: G.R.nationName('PT') };
    });
    ok(!g.avail && !g.hint && !g.land.includes('sy_todaiji') && !g.sp && !g.active && g.nat === '포르투갈', '보통 항해: 이 모드의 발견물·후원자는 나오지 않는다');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? '\n' + errors.slice(0, 8).join('\n') : ''));
    console.log('\n통과 ' + passed);
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
