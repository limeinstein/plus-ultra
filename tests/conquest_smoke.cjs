/* 성문 돌파와 도시 점령의 분리·날짜·국가·증원·수도·성지·저장·실제 육상전 검사. */
'use strict';
const assert = require('assert'), path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/conquest-20261101');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => G.Game && G.Conquest && G.Scenes.city.B.gate, null, { timeout: 90000 });
    const checks = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const Q = G.Conquest, C = G.Scenes.city, UI = G.UI, by = name => G.CITY_DATA.find(c => c.name === name), checks = [];
      const check = (v, message) => { if (!v) throw new Error(message); checks.push(message); };
      let calls = [], answers = [], sayings = [], capturedOpts = [], battleResult = 'win', throwBattle = false;
      const originals = { say: UI.say, confirm: UI.confirm, ask: UI.ask, toast: UI.toast, mateAsk: C.mateAsk, battle: G.Scenes.land.landBattle };
      UI.say = async t => { sayings.push(String(t)); }; UI.toast = () => {};
      UI.confirm = async () => answers.length ? answers.shift() : true;
      UI.ask = async (t, opts) => { capturedOpts = opts; return null; };
      C.mateAsk = async (t, opts) => { capturedOpts = opts; return answers.shift() || 'leave'; };
      G.Scenes.land.landBattle = async (name, n, beast, o) => {
        calls.push({ name, n, o, party: G.Game.state.loc.party, owner: G.R.cityOwner(by('예루살렘')) });
        if (throwBattle) throw Error('검사용 전투 예외');
        G.Game.state.loc.party -= 10; G.Game.state.fleet.crew -= 10;
        return battleResult;
      };
      function fresh(date = { y: 1510, m: 11, d: 25 }, city = '예루살렘', routesKnown = true) {
        G.State.newGame({ name: '점령 시험', nation: 'PT', job: 'conq', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state, c = by(city); s.date = date; s.settings.autosave = false;
        s.fleet.crew = 2000; s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat, via: 'sea' };
        if (routesKnown) new Set(Object.values(G.BALANCE.conquest.regionRoutes).concat(G.BALANCE.conquest.routeAreas.map(a => a.disc))).forEach(id => { s.disc[id] = { me: true, found: G.U.dateNum(date) }; });
        G.Frontier.invalidate();
        calls = []; answers = []; sayings = []; capturedOpts = []; battleResult = 'win'; throwBattle = false;
        return s;
      }
      for (const [city, route] of [['짐바브웨', 'capegood'], ['델리', 'indiaroute'], ['사마르칸트', 'indiaroute'], ['아유타야', 'malacca'], ['수라바야', 'spiceis'], ['브루나이', 'spiceis'], ['북경', 'china'], ['한양', 'china'], ['나가사키', 'zipang'], ['키투와', 'westroute'], ['찬찬', 'newstrait'], ['오제트', 'newstrait'], ['시드니', 'australia']]) check(Q.route(by(city)) === route, city + ' 선행 항로 연결: ' + route);
      let s = fresh({ y: 1600, m: 1, d: 1 }, '북경', false);
      s.known.push(by('북경').id); s.visited = { [by('북경').id]: true }; s.routes = { '0-173': { n: 1 } };
      check(/항로가 발견/.test(Q.block(by('북경'))) && /항로가 발견/.test(Q.menuItem(by('북경')).sub), '도시 방문·자동항해 기록만으로 점령 개방 불가 / 필요한 항로 안내');
      check(!(await Q.assault(by('북경'))) && !calls.length && !s.player.notoriety && !s.conquests, '항로 미발견 시 직접 호출도 전투·악명·점령 없이 차단');
      answers = ['leave']; await C.handleEntry(by('북경'));
      check(capturedOpts.some(x => x.value === 'attack') && !capturedOpts.some(x => x.value === 'occupy'), '항로 미발견 시 성문 공격은 유지하고 점령 선택지만 숨김');
      s.disc.china = { hints: ['검사용 단서'] };
      check(!!Q.block(by('북경')), '항로 단서만 아는 상태로 점령 개방 불가');
      s.disc.indiaroute = { me: true, found: 15990101 };
      check(!!Q.block(by('북경')), '다른 지역 항로 발견으로 동아시아 점령 개방 불가');
      s.disc.china = { me: true, found: 15990101 };
      check(!Q.block(by('북경')) && Q.profile(by('북경')).protected, '직접 항로 발견 후 공략 시도 허용 / 수도 점령 불가 유지');
      s = fresh({ y: 1600, m: 1, d: 1 }, '한양', false);
      check(/항로가 발견/.test(Q.block(by('한양'))), '임진왜란 이후에도 한양은 동아시아 항로 발견 필요');
      s.disc.china = { rival: '검사용 경쟁자', found: 15990101 };
      check(!Q.block(by('한양')) && Q.profile(by('한양')).militia, '경쟁자 항로 발표 후 한양 공략 시도 허용 / 의병 방어 유지');
      check(!Q.route(by('예루살렘')) && !Q.block(by('예루살렘')), '처음부터 알려진 중근동은 추가 항로 발견 불필요');
      s = fresh({ y: 1510, m: 11, d: 24 });
      check(!!Q.block(by('예루살렘')), '고아 최종 함락 전 점령 금지');
      s.date.d = 25; check(!Q.block(by('예루살렘')), '1510.11.25 개방 / 예루살렘 공략 허용');
      for (const name of ['리스본', '파리', '세빌리아', '아바나', '고아']) check(!!Q.block(by(name)), name + ' 유럽 국가 영토 점령 금지');
      for (const name of ['예루살렘', '메카', '메디나', '이스탄불', '알렉산드리아', '아덴', '아스완']) check(!Q.block(by(name)), name + ' 비유럽·이슬람 국가 공략 시도 허용');
      s.date = { y: 1592, m: 5, d: 22 };
      for (const name of ['한양', '동래', '경주', '평양', '한산도']) check(!!Q.block(by(name)), name + ' 임진왜란 전 보호');
      s.date.d = 23; check(!Q.block(by('동래')) && !Q.profile(by('동래')).protected, '임진왜란 시작 당일 조선 일반 도시 개방');
      check(Q.profile(by('북경')).total === 100000 && Q.profile(by('북경')).waves.length === 3, '북경 3차 총 10만 동원');
      check(Q.profile(by('한양')).waves.join() === Q.profile(by('북경')).waves.join() && Q.profile(by('한양')).protected && /관군과 의병/.test(Q.note(by('한양'))), '한양은 북경과 같은 3차 10만 병력·관군과 의병 공동 방어');
      for (const name of ['메카', '메디나']) check(Q.profile(by(name)).total > 100000 && Q.profile(by(name)).protected, name + ' 12만 동원');
      check(!Q.profile(by('예루살렘')).protected, '예루살렘은 성지 예외');
      check(Q.profile(by('아스완')).waves[0] === 1000 && Q.profile(by('예루살렘')).waves[0] === 8000 && Q.profile(by('알렉산드리아')).waves[0] === 25000, '소·중·대도시 수비대 1천·8천·2만5천');
      check(C.B.gate.menu(by('예루살렘')).some(x => x.label === '도시 점령'), '성문 건물에 별도 도시 점령 메뉴');
      s = fresh(); answers = ['attack', true];
      check(await C.handleEntry(by('예루살렘')), '기존 성문 공격 승리로 입장');
      check(calls.length === 1 && calls[0].n === 70 && !calls[0].o.conquest && !s.conquests && G.R.cityOwner(by('예루살렘')) === '맘루크 왕조' && s.player.notoriety === 10, '기존 성문 공격 인원·악명·소유권 유지');
      s = fresh({ y: 1510, m: 11, d: 24 }); answers = ['attack', true];
      check(await C.handleEntry(by('예루살렘')), '1510 점령 개방 전에도 기존 성문 공격 유지');
      s = fresh(); answers = ['leave']; await C.handleEntry(by('예루살렘'));
      check(capturedOpts.some(x => x.value === 'attack') && capturedOpts.some(x => x.value === 'occupy'), '막힌 성문에서 공격·점령을 별도 선택');
      s = fresh(); answers = [false]; check(!(await Q.assault(by('예루살렘'))) && !calls.length && !s.conquests && !s.player.notoriety, '취소 시 전투·악명·점령 변화 없음');
      s = fresh(); const originalOwner = G.R.cityOwner(by('예루살렘'));
      check(await Q.assault(by('예루살렘')), '수비대와 두 차례 증원 격퇴 후 점령');
      check(calls.length === 3 && calls.map(x => x.n).join() === '8000,4000,4000' && calls.map(x => x.party).join() === '2000,1990,1980' && calls.every(x => x.o.conquest && x.owner === originalOwner), '실제 인원 증원·아군 손실 누적·마지막 승리 전 소유권 유지');
      check(G.R.cityOwner(by('예루살렘')) === '포르투갈' && s.conquests[120].from === originalOwner && s.fleet.crew === 1970 && s.loc.party == null && s.player.notoriety === 15, '점령국·이전 소유국 기록 / 선원 손실·임시 대원 정리');
      check(!C.entryCheck(by('예루살렘')), '점령 후 예전 이교도 출입 금지 해제');
      const serialized = G.State.serialize(); G.Game.state = G.State.deserialize(serialized); s = G.Game.state;
      s.date = { y: 1517, m: 1, d: 1 };
      check(G.R.cityOwner(by('예루살렘')) === '포르투갈' && G.Dominion.ownerAt(by('예루살렘'), 1517, 1) === '오스만 제국', '저장·불러오기 뒤 역사 소유권보다 점령 우선');
      check(!G.Dominion.monthly().some(x => /예루살렘/.test(x.text)), '점령지의 거짓 역사 소유권 변경 소식 제외');
      for (const fail of ['lose', 'flee', 'truce']) {
        s = fresh(); battleResult = fail;
        check(!(await Q.assault(by('예루살렘'))) && !s.conquests && calls.length === 1 && s.loc.party == null, fail + ' 시 점령 실패·임시 상태 정리');
      }
      s = fresh(); answers = [true, false];
      check(!(await Q.assault(by('예루살렘'))) && calls.length === 1 && !s.conquests, '증원군 도착 때 자진 철수하면 점령 실패');
      for (const name of ['북경', '한양', '메카', '메디나', '이스탄불']) {
        s = fresh({ y: 1600, m: 1, d: 1 }, name);
        check(!(await Q.assault(by(name))) && calls.length === 3 && !s.conquests, name + ' 3차 전투를 이겨도 점령 불가');
        if (name === '한양') check(calls.map(x => x.name).join('|') === '한양 관군 수비대|한양 1차 의병 증원군|한양 2차 관군·의병 연합군' && sayings.some(t => /의병이 한양 방어에 참전/.test(t)) && sayings.some(t => /관군과 의병이 함께 항전/.test(t)), '한양의 증원군 이름·의병 참전 소식·계속되는 항전 안내');
      }
      s = fresh(); s.loc.via = 'land'; s.landReturn = { party: 80 };
      await Q.assault(by('예루살렘'));
      check(calls.map(x => x.party).join() === '80,70,60' && s.landReturn.party === 50 && s.fleet.crew === 1970, '뭍에서 온 탐험대만 동원하고 귀환 인원 손실 반영');
      s = fresh(); s.loc = { mode: 'land', party: 80, lon: 35, lat: 31 };
      await Q.assault(by('예루살렘'));
      check(s.loc.party === 50 && s.loc.lon === 35 && s.loc.lat === 31, '뭍의 점령전 손실과 원래 좌표 보존');
      s = fresh(); throwBattle = true; let threw = false;
      try { await Q.assault(by('예루살렘')); } catch (_) { threw = true; }
      check(threw && !s.conquests && s.loc.party == null, '전투 예외에도 임시 상태 정리');
      throwBattle = false; check(await Q.assault(by('예루살렘')), '예외 뒤 다음 점령 시도 가능');
      s = fresh(); s.player.nation = 'ES'; await Q.assault(by('예루살렘'));
      check(G.R.cityOwner(by('예루살렘')) === '카스티야', '1510년 에스파냐 플레이어는 카스티야 영토로 기록');
      fresh(); Object.assign(UI, { say: originals.say, confirm: originals.confirm, ask: originals.ask, toast: originals.toast }); C.mateAsk = originals.mateAsk; G.Scenes.land.landBattle = originals.battle;
      return checks;
    });
    checks.forEach(x => console.log('통과: ' + x));
    // 실제 육상전: 지휘관만 쓰러뜨렸을 때 성문 전투는 끝나고 점령전은 계속된다.
    for (const conquest of [false, true]) {
      await page.evaluate(conquest => {
        const s = G.Game.state; s.loc = { mode: 'land', party: 2000, lon: 35.2, lat: 31.77, mount: { id: 'walk' } };
        window.__battleDone = null;
        G.Games.landWar({ enemy: { name: conquest ? '도시 점령 수비대' : '성문 수비대', kind: 'garrison', n: 1000 }, party: 2000, terr: 'grass', guns: true, conquest, fastEnd: true }).then(r => { window.__battleDone = r; });
      }, conquest);
      await page.waitForFunction(() => G.Games._landDebug && document.querySelector('.lwar'));
      await page.evaluate(() => { G.Games._landDebug.foes.find(x => x.leader).n = 0; [...document.querySelectorAll('.lwar button')].find(b => b.textContent === '전투 개시').click(); });
      await page.waitForTimeout(100);
      await page.evaluate(async () => { G.Games._landDebug.mine.forEach(u => { u.ord = { act: 'guard', auto: true }; }); await G.Games._landDebug.run(); });
      const ended = await page.evaluate(() => [...document.querySelectorAll('.lwar button')].some(b => b.textContent === '확인'));
      assert.equal(ended, !conquest, '지휘관 사망 후 종료 여부: ' + conquest);
      if (conquest) {
        await page.evaluate(async () => { G.Games._landDebug.foes.forEach(u => { u.n = 0; }); await G.Games._landDebug.run(); });
      }
      await page.evaluate(() => { [...document.querySelectorAll('.lwar button')].find(b => b.textContent === '확인').click(); });
      await page.waitForFunction(() => window.__battleDone);
      if (conquest) assert.equal((await page.evaluate(() => window.__battleDone)).spoils.gold, 0);
    }
    await page.evaluate(() => {
      const s = G.Game.state; s.loc = { mode: 'city', city: 120, lon: 35.2, lat: 31.77, via: 'sea' };
      G.Game.scene = G.Scenes.city; G.Scenes.city.B.gate.enter = async () => {};
      G.Game.passDays = () => []; G.Quest.showNotes = async () => {};
      G.Scenes.city.main(); G.Scenes.city.visit('gate');
    });
    try { await page.waitForFunction(() => document.body.textContent.includes('도시 점령') && [...document.querySelectorAll('[data-tip]')].some(x => x.dataset.tip.includes('8,000')), null, { timeout: 10000, polling: 100 }); }
    catch (e) { console.log(await page.evaluate(() => ({ text: document.body.innerText.slice(-6000), tips: [...document.querySelectorAll('[data-tip]')].map(x => x.dataset.tip), note: G.Conquest.note(G.CITY_DATA[120]), busy: G.UI.busy(), current: G.Scenes.city.current() && G.Scenes.city.current().kind }))); throw e; }
    await page.evaluate(() => [...document.querySelectorAll('.cmd')].find(x => x.textContent.includes('도시 점령')).dispatchEvent(new MouseEvent('mouseenter')));
    await page.evaluate(async () => { await G.Loader.hide(); });
    await page.screenshot({ path: path.join(OUT, 'gate-occupation-menu.png') });
    assert.deepEqual(errors, [], '브라우저 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ checks, errors }, null, 2));
    console.log('통과: 실제 전투 지휘관 격파 규칙 분리·점령 전리품 중복 방지·성문 메뉴·브라우저 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
