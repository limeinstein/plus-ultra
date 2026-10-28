/* 고장에 맞는 음악 · 주점에서 나오면 거리의 곡 (tests/music_region_smoke.js) — node tests/music_region_smoke.js
   기존 음악(music/「제목.mp3」, js/data/music.js): 첫 화면 항해(태평양) · 도시마다 지역 곡 · 바다(지중해·대서양·인도양·태평양·남태평양·남극해 북극해) ·
   뭍(사막·정글·북부·동아시아·그 고장) · 주점·왕궁 · 고향 귀환 · 결혼 후 첫 항해 · 일기토·육상 전투·해상 전투 · 전설의 대륙
   콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.date = { y: 1500, m: 6, d: 1 }; s.player.home = 0;   // 22살로 시작한 해(1480)에서 20년 — 수명이 다해 눈을 감지 않게
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    });
    // ⓪ 첫 화면: 항해(태평양) · 곡 파일 41개가 모두 읽힌다
    const t0 = await page.evaluate(async () => {
      const files = Object.keys(G.MUSIC_FILES), bad = [];
      await Promise.all(files.map(t => new Promise(res => { const a = new Audio(); a.preload = 'metadata'; a.onloadedmetadata = () => res(); a.onerror = () => { bad.push(t); res(); }; a.src = G.MUSIC_FILES[t].split('/').map(encodeURIComponent).join('/'); })));
      return { files: files.length, bad, pick: G.Audio.pick('title') };
    });
    ok(t0.files === 44 && !t0.bad.length, '곡 파일 ' + t0.files + '개를 모두 읽었다 ' + t0.bad.join(','));
    ok(t0.pick === '항해(태평양)', '첫 화면의 곡: ' + t0.pick);
    await page.evaluate(() => { G.Game.state = null; G.Game.go('title'); });
    await page.mouse.click(5, 5); await page.waitForTimeout(400);
    ok(await page.evaluate(() => G.Audio.want === 'title' && G.Audio.now() === '항해(태평양)'), '첫 화면에서 항해(태평양)이 흐른다 (' + await page.evaluate(() => G.Audio.now()) + ')');
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.date = { y: 1500, m: 6, d: 1 }; s.player.home = 0;   // 22살로 시작한 해(1480)에서 20년 — 수명이 다해 눈을 감지 않게
    });

    // ① 도시마다 고장의 곡 · 바다 · 뭍
    const r = await page.evaluate(() => {
      const s = G.Game.state, A = G.Audio, M = G.MUSIC;
      window.__seN = G.CITY_DATA.find(c => c.style === 'se' && c.region === 8).name;
      const T = {}; G.CITY_DATA.forEach(c => { s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat }; A.place = null; T[c.name] = A.pick('town'); });
      const fnNull = G.CITY_DATA.filter(c => !M.cityRegion(c)).map(c => c.name);
      const used = {}; Object.values(T).forEach(t => { used[t] = (used[t] || 0) + 1; });
      const sea = (lon, lat) => { s.loc = { mode: 'sea', lon, lat }; return A.pick('sea'); };
      const seas = { med: sea(15, 37), black: sea(33, 43), ind: sea(70, 5), red: sea(38, 20), cape: sea(25, -37), atl: sea(-30, 30), north: sea(3, 56), carib: sea(-75, 15), gulf: sea(-90, 25),
        eastchina: sea(124, 30), javasea: sea(110, -5), pacN: sea(-150, 20), pacS: sea(-140, -20), peru: sea(-80, -12), panamaP: sea(-79, 7), chileP: sea(-75, -40), argA: sea(-60, -40), arctic: sea(20, 75), horn: sea(-65, -58), waus: sea(112, -25) };
      const land = (lon, lat) => { s.loc = { mode: 'land', lon, lat }; return G.Geo.terrain(lon, lat) + ':' + A.pick('land'); };
      const lands = { sahara: land(5, 25), mojave: land(-115, 35), gobi: land(103, 42), amazon: land(-60, -3), siberia: land(100, 55), scandinavia: land(15, 60), china: land(112, 33), spain: land(-3.7, 40.4), tibet: land(88, 32), india: land(78, 22), middleEast: land(35, 38), seAsia: land(105, 12), seForest: land(99, 12), seNorth: land(103, 18), mongol: land(103, 47), savanna: land(25, -15), kenya: land(37, 0), plains: land(-100, 40), germany: land(10, 50), france: land(2, 47), russia: land(40, 52), ukraine: land(33, 48) };
      return { T, fnNull, used, seas, lands };
    });
    console.log(JSON.stringify({ used: r.used, seas: r.seas, lands: r.lands }));
    const T = r.T;
    const want = { '리스본': '이베리아', '세빌리아': '이베리아', '그라나다': '이베리아', '파리': '프랑스 오스트리아', '비엔나': '프랑스 오스트리아', '마르세유': '프랑스 오스트리아', '런던': '영국', '에든버러': '영국', '더블린': '영국',
      '암스테르담': '독일 네덜란드', '함부르크': '독일 네덜란드', '뉘른베르크': '독일 네덜란드', '스톡홀름': '북유럽', '코펜하겐': '북유럽', '베니스': '이탈리아 그리스', '로마': '이탈리아 그리스', '아테네': '이탈리아 그리스',
      '바르샤바': '동유럽', '프라하': '동유럽', '부다페스트': '동유럽', '베오그라드': '동유럽', '모스크바': '러시아', '노브고르트': '러시아', '야쿠츠크': '러시아', '이스탄불': '오스만 제국', '앙카라': '오스만 제국', '카파': '오스만 제국',
      '카이로': '이집트 중동', '메카': '이집트 중동', '이스파한': '이집트 중동', '튀니스': '이집트 중동', '카사블랑카': '이집트 중동', '통북투': '남아프리카', '케이프': '남아프리카', '짐바브웨': '남아프리카', '몸바사': '동아프리카', '악숨': '동아프리카',
      '델리': '인도', '캘리컷': '인도', '라사': '티베트', '사마르칸트': '몽골 위구르', '카라코룸': '몽골 위구르', '북경': '중국', '천주': '중국', '한양': '조선', '나가사키': '일본', '쿄토': '일본', '말라카': '동남아시아', '아유타야': '동남아시아',
      '시드니': '오세아니아', '웰링턴': '오세아니아', '보스턴': '북아메리카 동부', '퀘벡': '북아메리카 동부', '타오스': '북아메리카 서부', '오제트': '북아메리카 서부', '아바나': '남아메리카', '테노치티틀란': '남아메리카', '쿠스코': '남아메리카', '리우데자네이루': '남아메리카' };
    const wrong = Object.keys(want).filter(n => T[n] !== want[n]).map(n => n + '=' + T[n] + '(바람:' + want[n] + ')');
    ok(!wrong.length, '도시 ' + Object.keys(want).length + '곳의 고장 곡 ' + wrong.join(' '));
    ok(!r.fnNull.length, '모든 도시(' + Object.keys(T).length + ')에 고장 곡이 있다 ' + r.fnNull.join(','));
    ok(Object.keys(r.used).length === 23, '도시 거리에서 쓰는 지역 곡 23가지 (무대륙 빼고): ' + Object.keys(r.used).join(','));
    const S = r.seas;
    ok(S.med === '항해(지중해)' && S.black === '항해(지중해)' && S.ind === '항해(인도양)' && S.red === '항해(인도양)' && S.cape === '항해(인도양)' && S.waus === '항해(인도양)', '지중해·흑해 / 인도양·홍해·희망봉 동쪽·서오스트레일리아');
    ok(S.atl === '항해(대서양)' && S.north === '항해(대서양)' && S.carib === '항해(대서양)' && S.gulf === '항해(대서양)' && S.argA === '항해(대서양)', '대서양·북해·카리브·멕시코만·아르헨티나 앞바다');
    ok(S.eastchina === '항해(태평양)' && S.javasea === '항해(태평양)' && S.pacN === '항해(태평양)' && S.panamaP === '항해(태평양)', '태평양 (동중국해·자와해·하와이 둘레·파나마 태평양 쪽)');
    ok(S.pacS === '항해(남태평양)' && S.peru === '항해(남태평양)' && S.chileP === '항해(남태평양)', '남태평양 (폴리네시아·페루·칠레 앞바다)');
    ok(S.arctic === '항해(남극해 북극해)' && S.horn === '항해(남극해 북극해)', '북극해·혼곶 남쪽');
    const L = r.lands;
    ok(/:탐험 \(사막 탐험\)$/.test(L.sahara) && /:탐험\(정글 탐험\)$/.test(L.amazon) && /:탐험\(북부 탐험\)$/.test(L.siberia), '뭍: 사막·정글·시베리아 ' + [L.sahara, L.amazon, L.siberia].join(' · '));
    ok(/:탐험 \(동아시아\)$/.test(L.china), '뭍: 중국 ' + L.china);
    const all = Object.values(L).join(' · ');
    ok(/forest:탐험 \(숲 탐험\)/.test(all) && /(grass|steppe):탐험\(평지 초원 탐험\)/.test(all), '뭍: 숲 → 숲 탐험, 평지·초원 → 평지 초원 탐험 (' + [L.germany, L.france, L.russia, L.ukraine, L.spain, L.mongol].join(' · ') + ')');
    ok(/mountain:티베트/.test(L.tibet), '뭍: 산지는 그 고장 곡 ' + L.tibet + ' · 그 밖 ' + [L.india, L.savanna, L.kenya, L.plains].join(' · '));

    ok([L.sahara, L.mojave, L.gobi].every(x => /:탐험 \(사막 탐험\)$/.test(x)), '사하라·모하비·고비 대형 사막 → 사막 탐험 ' + [L.sahara, L.mojave, L.gobi].join(' · '));
    ok([L.amazon, L.savanna, L.kenya, L.seAsia].every(x => /:탐험\(정글 탐험\)$/.test(x)), '아프리카·아마존·동남아시아 → 정글 탐험');
    ok([L.siberia, L.scandinavia].every(x => /:탐험\(북부 탐험\)$/.test(x)), '시베리아·북유럽 → 북부 탐험');
    ok([L.india, L.middleEast, L.seForest, L.seNorth].every(x => /:탐험 \(숲 탐험\)$/.test(x)), '인도·중동·동남아시아 숲 지형 → 숲 탐험 ' + [L.india, L.middleEast, L.seForest, L.seNorth].join(' · '));
    ok([L.spain, L.germany, L.france, L.russia, L.ukraine].every(x => /:탐험\(평지 초원 탐험\)$/.test(x)), '유럽 → 평지 초원 탐험');
    ok(!/:탐험 \(사막 탐험\)$/.test(L.plains), '대형 사막 권역 밖의 사막 지형에서는 사막 곡을 쓰지 않는다: ' + L.plains);
    if (process.env.LAND_ONLY === '1') { ok(!errors.length, '지역별 탐험 음악 콘솔 오류 0'); console.log('\n지역별 탐험 음악 점검 통과'); return; }

    // ② 실제 도시: 거리 → 주점 → 나오기 → 왕궁, 고향 귀환, 결혼 뒤 첫 항해, 일기토·육상전, 전설의 대륙
    async function city(i, from) {
      await page.evaluate(([i, from]) => { const s = G.Game.state, c = G.CITY_DATA[i]; if (from) G.Audio.want = from; s.loc = { mode: 'city', city: i, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: i }); }, [i, from || null]);
      await page.waitForFunction((i) => G.Game.sceneName === 'city' && G.Game.state.loc.city === i && !G.Scenes.city.isBusy(), i, { timeout: 30000 });
    }
    async function clickThrough(cond) {
      for (let k = 0; k < 120; k++) {
        if (await page.evaluate(cond)) return true;
        await page.evaluate(() => { const m = [...document.querySelectorAll('#ui .modal-back')].pop(); if (m) { const b = [...m.querySelectorAll('.btn')].pop() || m.querySelector('.dlg') || m; b.click(); } });
        await page.waitForTimeout(150);
      }
      return false;
    }
    const id = n => page.evaluate(n => G.CITY_DATA.findIndex(c => c.name === n), n);
    const kag = await id('나가사키'), sev = await id('세빌리아');
    await city(0, 'title');
    const st0 = await page.evaluate(() => G.Audio.now());
    await page.evaluate(() => { G.Scenes.city.visit('tavern'); });
    await clickThrough(() => G.Scenes.city.current() && G.Scenes.city.current().kind === 'tavern' && !G.Scenes.city.isBusy() && !document.querySelector('#ui .modal-back'));
    const inT = await page.evaluate(() => G.Audio.now() + '|' + G.Audio.place);
    await page.evaluate(() => G.Scenes.city.leave());
    await page.waitForTimeout(300);
    const out = await page.evaluate(() => G.Audio.now() + '|' + G.Audio.place);
    await page.evaluate(() => G.Audio.setPlace('palace')); const pal = await page.evaluate(() => G.Audio.now()); await page.evaluate(() => G.Audio.setPlace(null));
    ok(st0 === '이베리아' && inT === '주점|tavern' && out === '이베리아|null' && pal === '왕궁', '리스본(처음 들어옴) 거리 ' + st0 + ' → 주점 ' + inT + ' → 나오면 ' + out + ' · 왕궁 ' + pal);
    await page.evaluate(() => { G.Scenes.city.visit('tavern'); });
    await clickThrough(() => G.Scenes.city.current() && !G.Scenes.city.isBusy() && !document.querySelector('#ui .modal-back'));
    await page.evaluate(() => { G.UI.fade = async fn => { fn(); }; G.Game.go('sea', { depart: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'sea', null, { timeout: 30000 });
    const sea0 = await page.evaluate(() => G.Audio.now() + '|' + G.Audio.place);
    ok(/^항해\(대서양\)\|null$/.test(sea0), '주점에서 곧장 바다로: 리스본 앞바다 ' + sea0);
    await city(0);
    const home = await page.evaluate(() => G.Audio.now());
    await city(sev, 'sea');
    const sevT = await page.evaluate(() => G.Audio.now());
    ok(home === '귀환' && sevT === '이베리아', '바다에서 고향 리스본으로 돌아오면 「귀환」(' + home + '), 남의 항구 세빌리아는 ' + sevT);
    // 결혼 뒤 첫 항해
    await page.evaluate(() => { G.Game.state.player.wife = 'cinderella'; G.Game.go('sea', { depart: G.Game.state.loc.city }); });
    await page.waitForFunction(() => G.Game.sceneName === 'sea', null, { timeout: 30000 });
    const wed = await page.evaluate(() => G.Audio.now());
    await page.evaluate(() => G.Audio.daily()); await page.evaluate(() => G.Audio.daily()); await page.evaluate(() => G.Audio.daily());
    const wed2 = await page.evaluate(() => G.Audio.now());
    await city(kag);
    const kagT = await page.evaluate(() => G.Audio.now());
    await page.evaluate(() => { G.Game.go('sea', { depart: G.Game.state.loc.city }); });
    await page.waitForFunction(() => G.Game.sceneName === 'sea', null, { timeout: 30000 });
    const after = await page.evaluate(() => G.Audio.now());
    ok(wed === '결혼 후 첫 항해' && wed2 === wed && kagT === '일본' && after === '항해(태평양)', '혼인 뒤 첫 출항 「' + wed + '」(며칠 지나도 그대로) → 나가사키 ' + kagT + ' → 다음 출항은 ' + after);
    // 전설의 대륙: 단서가 없으면 그냥 바다, 단서를 얻으면 무대륙 아틀란티스
    const leg = await page.evaluate(() => { const s = G.Game.state, A = G.Audio; s.loc = { mode: 'sea', lon: -169, lat: -6 }; const a = A.pick('sea'); s.hints.mu = { src: 'test' }; const b = A.pick('sea'); delete s.hints.mu; return [a, b]; });
    ok(leg[0] === '항해(남태평양)' && leg[1] === '무대륙 아틀란티스', '무 제국 둘레: 단서 없이 ' + leg[0] + ' · 단서를 얻으면 ' + leg[1]);
    // 일기토 · 육상전 · 잠깐 곡(전설 발견)
    const fx = await page.evaluate(async () => {
      const A = G.Audio, o = {};
      A.music('duel'); o.duel = A.now(); A.music('landwar'); o.lw = A.now(); A.music('battle'); o.bat = A.now();
      A.music('sea'); o.sea = A.now();
      G.Audio.moment('minigame'); o.mini = A.now(); G.Audio.resume(); o.miniBack = A.now();
      G.Audio.moment('legend'); o.mom = A.now(); A.music('town'); o.momKeep = A.now(); A.music('sea'); G.Audio.resume(); o.back = A.now();
      return o;
    });
    ok(fx.duel === '일기토' && fx.lw === '육상 전투' && fx.bat === '해상 전투', '일기토 · 육상 전투 · 해상 전투');
    ok(fx.mini === '미니 게임' && fx.miniBack === fx.sea, '미니 게임(퍼즐·포커·낚시) 동안 「미니 게임」, 끝나면 ' + fx.miniBack);
    ok(fx.mom === '무대륙 아틀란티스' && fx.momKeep === fx.mom && fx.back === fx.sea, '전설의 대륙을 찾는 순간 「무대륙 아틀란티스」, 끝나면 바다 곡 (' + fx.back + ')');
    await city(kag);
    ok(await page.evaluate(() => G.Audio.now()) === '일본', '나가사키 거리: 일본 곡');

    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
