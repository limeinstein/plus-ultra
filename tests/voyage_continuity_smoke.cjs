/* 발표된 발견의 재조사·교역 인맥·사건 준비 기간·친족 계승과 실제 계획 화면. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/voyage-continuity-20261104');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { const raf = requestAnimationFrame.bind(window); requestAnimationFrame = cb => window.__pauseFrames ? 0 : raf(cb); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.VoyagePlans && G.Game.sceneName === 'title' && !document.querySelector('#boot-loader.on'), null, { timeout: 120000 });
    await page.evaluate(() => { window.__pauseFrames = true; });
    const result = await page.evaluate(async () => {
      const D = G.Disc, V = G.VoyagePlans, F = G.Family, T = G.Scenes.city.B.trade, checks = [];
      const check = (v, m) => { if (!v) throw Error(m); checks.push(m); };
      function fresh(y = 1480) {
        const s = G.Game.state = G.State.newGame({ name: '계획 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: { nav: 3, survey: 3, hist: 3, acct: 3 }, lg: G.LANGS.map(() => 3), diff: 'normal' });
        s.date = { y, m: 1, d: 1 }; s.player.born = { y: y - 24, m: 1, d: 1 }; s.day = 0; s.loc = { mode: 'city', city: 0 }; s.settings.autosave = false; return s;
      }
      const saved = { say: G.UI.say, alert: G.UI.alert, toast: G.UI.toast, ask: G.UI.ask, choose: G.UI.choose, confirm: G.UI.confirm, refresh: G.Game.refreshHud,
        card: G.Scenes.discoveryCard, reveal: G.Scenes.discoveryReveal, voices: G.Scenes.discoveryVoices, hasReveal: G.Scenes.hasReveal, pic: G.FamEv.showPic, fame: G.Achieve.onFame };
      G.UI.say = async () => {}; G.UI.alert = async () => {}; G.UI.toast = () => {}; G.UI.confirm = async () => true; G.Game.refreshHud = () => {}; G.FamEv.showPic = () => null; G.Achieve.onFame = () => {};
      G.Scenes.hasReveal = () => false; let cards = 0; G.Scenes.discoveryCard = async () => { cards++; }; G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryVoices = async () => {};
      try {
        let s = fresh(1500); V.state(); const d = G.DISCOVERIES.find(d => d.rival && d.rival[0] < 1490 && !d.need && d.how === 'land');
        check(!!d, '기존 라이벌 발견 자료'); s.hints[d.id] = { src: 'book', d: 14800101 }; D.rivals();
        check(D.taken(d.id) && !!s.hints[d.id] && G.Frontier.available(d), '라이벌 발표 뒤 단서 보존·탐험 개방');
        delete s.hints[d.id]; check(D.addHint(d.id, 'rival-report:test') && !G.BookSeq.done(d.id), '후발 단서 획득·서가 순서를 직접 이어 감');
        check(V.accept(d.id), '항구 해도소 재조사 의뢰 수락'); const due = V.state().tasks[d.id].due;
        check(due === s.day + G.BALANCE.voyagePlans.investigationDays, '의뢰 기한은 역사 날짜가 아닌 수락일부터 계산');
        await D.find(d, 'special'); check(D.foundByMe(d.id) && cards > 0 && G.BookSeq.done(d.id), '발견 연출·유물 경로·독서 진행 유지');
        const money = s.player.gold; check(V.claim(d.id) && s.player.gold === money + G.BALANCE.voyagePlans.investigationGold && !V.claim(d.id), '재조사 보고·중복 보상 방지');
        s = fresh(1500); s.disc[d.id] = { rival: d.rival[2], found: 14880101 }; V.migrate(s);
        check(!!s.hints[d.id] && G.Frontier.available(d), '옛 저장에서 사라진 라이벌 단서 복구');
        delete s.voyagePlans; delete s.hints[d.id]; const recovered = G.State.deserialize(G.State.serialize());
        check(!!recovered.hints[d.id] && !!recovered.voyagePlans, '실제 저장 불러오기에서 재조사 단서 자동 복구'); V.migrate(s);
        s.player.fame = 5000; ['capegood', 'malacca', 'newstrait', 'circum'].forEach(id => { s.disc[id] = { rival: '선행 탐험가', found: 14900101 }; }); G.Frontier.invalidate();
        check(G.Sponsor.circReady(), '엘카노 발표 이후에도 세계일주 원정 수락 가능');
        check(V.accept(d.id), '옛 저장 재조사 수락'); s.day = V.state().tasks[d.id].due + 1; V.daily();
        check(!V.claim(d.id) && V.accept(d.id), '만료된 개인 의뢰 재수락·발견 봉쇄 없음');
        s = fresh(1490); D.rivals();
        const afterTenYears = G.DISCOVERIES.filter(x => s.disc[x.id] && s.disc[x.id].rival && !s.disc[x.id].me);
        check(afterTenYears.length > 0 && afterTenYears.every(x => s.hints[x.id] && G.Frontier.available(x)), '열 해 뒤 탐험으로 전환해도 발표된 발견의 단서·접근 경로 보존');
        s = fresh(); V.state(); s.disc[d.id] = { me: true, found: 14800101 }; const cash = s.player.gold;
        D.announce(d.id); check(s.player.gold === cash + G.BALANCE.voyagePlans.firstGold && V.titles().some(t => t.includes(d.name)), '최초 발표 특별 보상·칭호');
        const once = s.player.gold; D.announce(d.id); V.daily(); check(s.player.gold === once, '최초 발표 보상 저장·중복 방지');
        s = fresh(); const c = G.CITY_DATA[0]; const pre = s.player.gold;
        check(!V.trade(c, 1, 10) && !V.state().contacts[c.id], '소액 쪼개기 거래는 인맥을 만들지 않음');
        T.applyBuy(c, 'silk', 8, 50); const contact = V.state().contacts[c.id];
        check(contact && contact.level === 1 && contact.hint && !!s.hints[contact.hint], '실제 매입으로 현지 탐험 정보 획득');
        T.applyBuy(c, 'silk', 8, 50); check(contact.visits === 1, '같은 날 반복 매입으로 인맥 중복 증가 방지');
        s.day += G.BALANCE.voyagePlans.contactDays; T.sellQty(c, 'silk', 8); check(contact.visits === 2, '실제 매각도 거래처 인맥에 반영');
        s.day += G.BALANCE.voyagePlans.contactDays; T.applyBuy(c, 'silk', 8, 50); check(contact.level === 2, '거래처와 장기 교역하면 다음 탐험 정보');
        const roundtrip = G.State.deserialize(G.State.serialize()); check(roundtrip.voyagePlans.contacts[c.id].level === 2, '인맥·의뢰·기록 새 저장 필드 왕복');
        s = fresh(1601); s.date = { y: 1601, m: 7, d: 1 }; s.loc.city = G.BALANCE.eindia.eic.city;
        check(G.EIndia.pending(), '원래 출자 기한이 지나도 원정 왕복 참여 기간 보장');
        const win = V.window(G.BALANCE.eindia.eic, true);
        check(win.to > G.BALANCE.eindia.eic.to && win.to < G.BALANCE.eindia.eic.payAt, '출자 기간 연장·정산 이전 상한');
        G.UI.ask = async () => -1; await G.EIndia.eic();
        check(!s.eindia.eic && s.eindia.eicCool > s.day && !G.EIndia.pending(), '출자 미루기는 영구 거절·이중 출자가 아님');
        s.day = s.eindia.eicCool; check(G.EIndia.pending(), '준비 후 재방문 가능');
        const before = s.player.gold; G.UI.ask = async () => 1000; await G.EIndia.eic();
        check(s.eindia.eic === 1000 && s.player.gold === before - 1000 && !G.EIndia.pending(), '연장 기간의 실제 출자·정확한 한 번 결제');
        for (const [system, key] of [['eindia', 'eic'], ['eindia', 'voc'], ['colonyCo', 'wic'], ['colonyCo', 'fr'], ['colonyCo', 'darienSub']]) {
          const k = G.BALANCE[system][key], span = V.window(k, true), api = system === 'eindia' ? G.EIndia : G.ColonyCo;
          s = fresh(Math.floor(k.from / 10000)); s.loc.city = k.city;
          const toDate = n => ({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 });
          s.date = G.U.addDays(toDate(span.from), -1); check(!api.pending(), key + ' 역사적 시작일 전 참여 불가');
          s.date = toDate(span.to); check(api.pending(), key + ' 연장된 마지막 날 참여 가능');
          s.date = G.U.addDays(toDate(span.to), 1); check(!api.pending(), key + ' 참여 기간 종료 경계');
        }
        s = fresh(1599); V.state();
        check(!V.visibleEvents().length && !V.daily().length && !V.departureHtml(), '듣지 않은 미래·진행·과거 사건과 출항 알림은 노출하지 않음');
        check(!await V.review('eindia:amboyna'), '모르는 사건의 후일담 직접 열기 차단');
        const eicRumor = G.EVENT_RUMORS.find(r => r.id === 'ei_eic'), london = G.CITY_DATA[G.BALANCE.eindia.eic.city];
        G.EventRumor.heard(eicRumor, '런던 상인들이 먼 항해를 준비한다는 소문이오.', london);
        check(V.visibleEvents().length === 1 && V.visibleEvents()[0].story === '런던 상인들이 먼 항해를 준비한다는 소문이오.', '실제 들은 말 하나만 계획에 기록·미래 장면 평가 없음');
        check(!V.daily().length && !V.departureHtml().includes('1600') && !V.departureHtml().includes('1602'), '기다리는 소문은 정확한 미래 일정 숨김');
        s.date = { y: 1601, m: 1, d: 1 }; const news = V.daily();
        check(news.length === 1 && news[0].text.includes('잉글랜드 동인도'), '이미 들은 출자 소식만 실제 참여 기간에 한 번 안내');
        check(!V.daily().length, '들은 출자 소식 재알림 중복 방지');
        s = fresh(1601); s.evRumor = { heard: { ei_eic: 0 }, log: [{ id: 'ei_eic', text: '전에 직접 들은 이야기.', city: london.id, date: 16000601 }] };
        s.voyagePlans = { version: 1, notices: { 'eindia:voc:soon': 16000101 } }; V.migrate(s);
        check(V.visibleEvents().length === 1 && V.visibleEvents()[0].story === '전에 직접 들은 이야기.' && !V.state().knowledge['eindia:voc'], '옛 저장은 실제 대화만 복구·전 세계 자동 예고는 제외');
        const remembered = G.State.deserialize(G.State.serialize());
        check(remembered.voyagePlans.knowledge['eindia:eic'].text === '전에 직접 들은 이야기.', '들은 소식 저장·불러오기 보존');
        const chance = G.U.chance; G.U.chance = () => false;
        try { s.evRumor.heard = {}; check(G.EventRumor.at(london).length > 0 && !G.EventRumor.pick({ type: 'man' }, london), '기한 가까운 소문도 대화 확률을 건너뛰지 않음'); } finally { G.U.chance = chance; }
        s = fresh(1604); const event = V.events().find(e => e.id === 'eindia:eic'); s.loc.city = event.city.id;
        G.EventRumor.heard(eicRumor, '전에 런던에서 회사의 출자 이야기를 들었다.', london);
        const dateBefore = JSON.stringify(s.date); check(await V.review(event.id), '지난 역사 사건을 현지 기록 조사로 경험');
        check(!await V.review(event.id) && JSON.stringify(s.date) === dateBefore, '기록 조사 중복 보상·역사 시간 역행 없음');
        s = fresh(); const child = { name: '다음 제독', given: '다음', surname: '검사', sex: 'm', born: { y: 1464, m: 1, d: 1 }, st: { str: 20, int: 20, mar: 20, cha: 20 }, sk: {}, lg: [], bond: 0 };
        F.prepareHeir(child); check(child.st.int >= 55 && child.sk.nav >= 1 && child.sk.survey >= 1 && child.lg[G.R.nativeLang(s.player.nation)] === 3, '교육을 놓친 성인 후계자 기본 능력·모국어 보장');
        const unnamed = { unnamed: true, sex: 'm', born: { y: 1460, m: 1, d: 1 }, st: {}, sk: {}, lg: [] }; F.prepareHeir(unnamed);
        check(!unnamed.unnamed && !!unnamed.name, '성인이 되도록 이름을 못 지은 아이도 계승 준비');
        const kin = F.kinHeir(); check(F.kidAge(kin) === 20 && F.kinHeir() === kin && kin.sk.hist >= 1, '결혼·출산 없이 성인 친족 후계 준비');
        const oldSucceed = F.succeed; let chosen = null; F.succeed = async k => { chosen = k; }; G.UI.choose = async () => 'kin';
        try { await F.retire(true); check(chosen === kin, '자녀 없는 제독도 친족 계승 선택으로 계속'); } finally { F.succeed = oldSucceed; }
        const helpers = { surname: F.askSurname, storage: F.pickStorage, guard: G.OldGuard.atSucceed, siblings: G.Siblings.fromRetire };
        F.askSurname = async () => '검사'; F.pickStorage = async () => s.player.storage || [];
        G.OldGuard.atSucceed = async () => {}; G.Siblings.fromRetire = async () => [];
        s.player.fame = 1000; s.player.bank = 9000;
        const knowledge = { test: { src: 'book', d: 14800101 } }; s.hints = knowledge;
        const hull = s.fleet.ships[0]; const savedDate = JSON.stringify(s.date); V.trade(G.CITY_DATA[0], 8, 500);
        try {
          await F.succeed(kin, true);
          check(JSON.stringify(s.date) === savedDate && s.fleet.ships[0] === hull && s.player.bank === 9000, '친족의 실제 계승은 세월·함대·예금을 보존');
          check(s.hints === knowledge && s.player.sk.nav >= 1 && s.player.fame >= 500 && !!s.voyagePlans.contacts[0], '해도 단서·탐험 기초·명성·거래처 지식 계승');
        } finally { F.askSurname = helpers.surname; F.pickStorage = helpers.storage; G.OldGuard.atSucceed = helpers.guard; G.Siblings.fromRetire = helpers.siblings; }
        window.__voyageFresh = fresh;
        return { checks, deadline: due, companyWindow: win, tradeCost: pre - 800 };
      } finally {
        Object.assign(G.UI, { say: saved.say, alert: saved.alert, toast: saved.toast, ask: saved.ask, choose: saved.choose, confirm: saved.confirm });
        G.Game.refreshHud = saved.refresh; G.Scenes.discoveryCard = saved.card; G.Scenes.discoveryReveal = saved.reveal; G.Scenes.discoveryVoices = saved.voices; G.Scenes.hasReveal = saved.hasReveal; G.FamEv.showPic = saved.pic; G.Achieve.onFame = saved.fame;
      }
    });
    await page.evaluate(() => { window.__voyageFresh(1601); G.VoyagePlans.open(); });
    await page.getByText('탐험·교역 계획', { exact: true }).waitFor();
    assert(!(await page.locator('.win').last().innerText()).includes('잉글랜드 동인도'));
    await page.screenshot({ path: path.join(OUT, 'participation.png') });
    await page.locator('[data-vp-filter="soon"]').click();
    assert(!(await page.locator('.win').last().innerText()).includes('네덜란드 동인도'));
    await page.evaluate(() => { G.EventRumor.heard(G.EVENT_RUMORS.find(r => r.id === 'ei_voc'), '상인들이 새 회사를 의논한다는 소문이오.', G.CITY_DATA[G.BALANCE.eindia.voc.city]); });
    await page.locator('[data-vp-filter="soon"]').click();
    const knownUpcoming = await page.locator('.win').last().innerText();
    assert(knownUpcoming.includes('교역 소식') && !knownUpcoming.includes('네덜란드 동인도') && !knownUpcoming.includes('1602') && !knownUpcoming.includes('시작까지'));
    await page.screenshot({ path: path.join(OUT, 'upcoming.png') });
    await page.locator('[data-vp-filter="past"]').click(); await page.screenshot({ path: path.join(OUT, 'history-records.png') });
    await page.evaluate(() => { G.Disc.rivals(); }); await page.locator('[data-vp-filter="rival"]').click(); await page.screenshot({ path: path.join(OUT, 'rival-investigations.png') });
    await page.locator('[data-vp-filter="contacts"]').click(); await page.screenshot({ path: path.join(OUT, 'contacts.png') });
    await page.getByRole('button', { name: '닫기', exact: true }).last().click();
    await page.evaluate(() => { G.Info.open('contract'); }); await page.locator('[data-voyage-plans]').waitFor(); await page.locator('[data-voyage-plans]').click();
    await page.getByText('탐험·교역 계획', { exact: true }).last().waitFor();
    assert.deepEqual(errors, []); fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ result, errors }, null, 2));
    console.log(result.checks.join('\n')); console.log('통과: 계획 화면·수첩 연결·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
