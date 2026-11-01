/* 동료 명부·정렬·상세·술집 대화·해고/서약/재등용. file:// 본편에서 검증한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(ROOT, 'artifacts', 'matebook');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, ignoreDefaultArgs: ['--hide-scrollbars'],
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|net::ERR_/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({ name: '항해사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 6, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state;
      s.settings.sound = 0; s.settings.music = 0; s.settings.res = .35;
      s.player.fame = 99999; s.player.gold = 999999; s.loc = { mode: 'city', city: 0 };
      s.mates = ['rocco', 'monteiro', 'deleon', 'vandermeer', 'samios', 'beaumont', 'weiss', 'laskaris', 'ferraro', 'rosenthal', 'macleod', 'leonardo_de_valenca'].map((id, i) => ({ id, role: i === 0 ? 'first' : 'none', loyal: i === 1 ? 0 : 70 + i, joined: 14800501, aff: i * 7 }));
      s.mates.find(m => m.id === 'weiss').loyal = 49; s.mates.find(m => m.id === 'beaumont').loyal = 50;
      G.Info.open('mates');
    });
    await page.waitForSelector('.mb-table tbody tr');
    await page.waitForFunction(() => getComputedStyle(document.getElementById('boot-loader')).display === 'none');
    const overview = await page.evaluate(() => ({ rows: document.querySelectorAll('.mb-table tbody tr').length,
      faces: document.querySelectorAll('.mb-table .mb-face canvas').length,
      facesFit: [...document.querySelectorAll('.mb-table .mb-face')].every(e => {
        const f = e.getBoundingClientRect(), c = e.querySelector('canvas').getBoundingClientRect();
        return c.left >= f.left && c.top >= f.top && c.right <= f.right && c.bottom <= f.bottom && Math.abs(c.width - c.height) < 1 && Math.abs((c.left + c.right) - (f.left + f.right)) < 1;
      }),
      zero: document.querySelector('[data-mate="monteiro"] .mb-loyal').textContent,
      red49: document.querySelector('[data-mate="weiss"] .mb-loyal').classList.contains('low'),
      normal50: !document.querySelector('[data-mate="beaumont"] .mb-loyal').classList.contains('low'),
      allVisible: [...document.querySelectorAll('.mb-table tbody tr')].every(e => e.getBoundingClientRect().bottom <= document.querySelector('.mb-body').getBoundingClientRect().bottom),
      cols: [...document.querySelectorAll('.mb-table th')].map(e => e.textContent),
      storyCoverage: G.STORY_CREW.every(id => G.MATE_STORIES[id]) }));
    assert.strictEqual(overview.rows, 12); assert.strictEqual(overview.faces, 12);
    assert(overview.facesFit, '모든 얼굴은 자기 칸 안에 정사각형으로 가운데 정렬되고 잘리지 않는다');
    assert.strictEqual(overview.zero, '0', '충성 0을 백분율 기호 없이 표시');
    assert(overview.red49 && overview.normal50, '충성 50 미만만 빨간색');
    assert(overview.allVisible, '한 화면에서 동료 12명 전원을 한 줄씩 비교');
    assert(overview.storyCoverage, '창작 항해사 전원 고유 이야기');
    await page.screenshot({ path: path.join(OUT, '01-companion-list.png') });
    await page.selectOption('.mb-sort', 'st:2');
    const sorted = await page.evaluate(() => [...document.querySelectorAll('.mb-table tbody tr')].map(e => G.MATE[e.dataset.mate].st[2]));
    assert(sorted.every((v, i) => !i || sorted[i - 1] >= v), '무력 내림차순');
    await page.selectOption('.mb-sort', 'sk:nav');
    const levels = await page.evaluate(() => [...document.querySelectorAll('.mb-table tbody tr')].map(e => G.R.mateSkill(G.Game.state.mates.find(m => m.id === e.dataset.mate), 'nav')));
    assert(levels.every((v, i) => !i || levels[i - 1] >= v), '특기 단계 내림차순');
    await page.click('[data-mate="vandermeer"] .mb-person');
    const detail = await page.evaluate(() => {
      const chips = [...document.querySelectorAll('.mb-record .mb-tile')].map(e => ({ w: e.offsetWidth, h: e.offsetHeight }));
      return { nav: document.querySelectorAll('.mb-nav-person').length, name: document.querySelector('.mb-name').textContent,
        facts: document.querySelector('.mb-facts').textContent, story: document.querySelector('.mb-story').textContent,
        skills: document.querySelectorAll('.mb-all-skills .mb-tile').length, languages: document.querySelectorAll('.mb-all-languages .mb-tile').length,
        hearts: document.querySelectorAll('.mb-facts .mb-heart').length,
        facesFit: [...document.querySelectorAll('.mb-nav .mb-face')].every(e => {
          const f = e.getBoundingClientRect(), c = e.querySelector('canvas').getBoundingClientRect();
          return c.left >= f.left && c.top >= f.top && c.right <= f.right && c.bottom <= f.bottom && Math.abs(c.width - c.height) < 1;
        }),
        love: document.querySelector('.mb-facts .mb-hearts').getAttribute('aria-label'),
        loyal: document.querySelector('.mb-facts .mb-loyal').textContent,
        scrollbars: ['.mb-nav-list', '.mb-story'].every(s => getComputedStyle(document.querySelector(s)).overflowY === 'scroll'),
        sizes: new Set(chips.map(e => e.w + '/' + e.h)).size,
        colors: [0, 1, 2, 3].map(i => getComputedStyle(document.querySelector('.mb-all-skills .lv' + i) || document.querySelector('.mb-legend .skill.lv' + i)).backgroundColor),
        width: document.querySelector('.mb-body').scrollWidth <= document.querySelector('.mb-body').clientWidth };
    });
    assert.strictEqual(detail.nav, 12); assert.strictEqual(detail.skills, 17); assert.strictEqual(detail.languages, 16);
    assert(detail.facesFit, '좌측 동료 명단의 얼굴도 칸 크기에 맞게 표시');
    assert.strictEqual(detail.hearts, 5); assert.strictEqual(detail.love, '애정 21 / 100');
    assert.strictEqual(detail.loyal, '73'); assert(detail.scrollbars, '동료 선택과 이야기에 독립된 스크롤바');
    assert.strictEqual(detail.sizes, 1, '서로 다른 길이의 특기·언어 칸 크기 동일');
    assert.strictEqual(new Set(detail.colors).size, 4); assert(detail.width, '가로 잘림 없음');
    assert(/직위.*선실.*말투.*충성.*애정.*월급/.test(detail.facts)); assert(detail.story.includes('장부에서 지도보다 넓은 세상'));
    await page.screenshot({ path: path.join(OUT, '02-companion-detail.png') });
    await page.click('.mb-list-button');
    await page.fill('.mb-search', '마리나');
    assert.strictEqual(await page.locator('.mb-table tbody tr').count(), 1);
    await page.click('.mb-person');
    await page.click('.mb-list-button');
    assert.strictEqual(await page.locator('.mb-sort').inputValue(), 'sk:nav');
    assert.strictEqual(await page.locator('.mb-search').inputValue(), '마리나');
    await page.click('.mb-detail-button');
    assert.strictEqual(await page.locator('.mb-name').textContent(), '마리나 판 데르 메르', '상세로 돌아오면 선택한 동료 유지');
    await page.fill('.mb-search', '');
    const allFit = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('.mb-nav-person')].map(e => e.dataset.mate);
      return ids.every(id => {
        document.querySelector('.mb-nav-person[data-mate="' + id + '"]').click();
        const p = document.querySelector('.mb-profile'), stat = p.querySelector('.mb-stats').getBoundingClientRect();
        return p.scrollHeight <= p.clientHeight + 1 && stat.bottom <= p.getBoundingClientRect().bottom + 1;
      });
    });
    assert(allFit, '동료마다 이름 길이가 달라도 능력치 사각형까지 한 화면에 표시');
    await page.click('.mb-nav-person[data-mate="weiss"]');
    assert(await page.locator('.mb-facts .mb-loyal.low').count(), '상세에서도 충성 49는 빨간색');
    await page.click('.mb-nav-person[data-mate="beaumont"]');
    assert.strictEqual(await page.locator('.mb-facts .mb-loyal.low').count(), 0, '상세 충성 50은 일반색');
    await page.evaluate(() => {
      window.__matesBeforeScroll = G.Game.state.mates.slice();
      const extra = G.STORY_CREW.filter(id => !G.Game.state.mates.some(m => m.id === id));
      G.Game.state.mates.push(...extra.map(id => ({ id, role: 'none', loyal: 75, aff: 60, joined: 14800501 })));
      document.querySelector('.mb-list-button').click();
    });
    const last = page.locator('.mb-table tbody tr').last().locator('.mb-person');
    await last.scrollIntoViewIfNeeded();
    const listScroll = await page.locator('.mb-body').evaluate(e => e.scrollTop);
    assert(listScroll > 0, '인원이 많으면 전체 표를 스크롤해 조회');
    await last.click();
    const selectedName = await page.locator('.mb-name').textContent();
    await page.locator('.mb-nav-list').hover(); await page.mouse.wheel(0, -1200);
    await page.waitForFunction(() => document.querySelector('.mb-nav-list').scrollTop === 0);
    await page.mouse.wheel(0, 220);
    await page.waitForFunction(() => document.querySelector('.mb-nav-list').scrollTop > 0);
    assert.strictEqual(await page.locator('.mb-name').textContent(), selectedName, '명단 스크롤은 동료 선택을 바꾸지 않는다');
    await page.evaluate(() => {
      const id = document.querySelector('.matebook').dataset.selected;
      window.__longStoryMate = id; window.__originalStory = G.MATE[id].story;
      G.MATE[id].story = Array(40).fill('함께 항해하며 남긴 긴 이야기. 바다와 항구에서 겪은 일을 차례로 적는다.').join('\n');
      document.querySelector('.mb-detail-button').click();
    });
    await page.locator('.mb-story').hover(); await page.mouse.wheel(0, 240);
    await page.waitForFunction(() => document.querySelector('.mb-story').scrollTop > 0);
    const storyScroll = await page.locator('.mb-story').evaluate(e => e.scrollTop);
    await page.click('.mb-list-button');
    assert.strictEqual(await page.locator('.mb-body').evaluate(e => e.scrollTop), listScroll, '전체 표로 돌아오면 스크롤 위치 유지');
    await page.screenshot({ path: path.join(OUT, '05-full-roster-scroll.png') });
    await page.click('.mb-detail-button');
    assert.strictEqual(await page.locator('.mb-name').textContent(), selectedName);
    assert.strictEqual(await page.locator('.mb-story').evaluate(e => e.scrollTop), storyScroll, '이야기 읽던 위치 유지');
    await page.evaluate(() => {
      G.MATE[window.__longStoryMate].story = window.__originalStory;
      G.Game.state.mates = window.__matesBeforeScroll;
      document.querySelector('.mb-detail-button').click();
    });
    await page.click('.mb-nav-person[data-mate="rocco"]');
    assert.strictEqual(await page.locator('.mb-name').textContent(), await page.evaluate(() => G.MATE.rocco.name));
    await page.click('.mb-actions button:has-text("다음")');
    assert.notStrictEqual(await page.locator('.mb-name').textContent(), await page.evaluate(() => G.MATE.rocco.name));
    await page.fill('.mb-search', '없는이름'); assert(await page.locator('.mb-no-results').isVisible());
    await page.fill('.mb-search', '');
    await page.locator('.win .title .x').last().click();
    await page.evaluate(() => { window.__talked = null; G.MateTalk.talk = async (c, m) => { window.__talked = { city: c.id, id: m.id }; }; G.MateTalk.open(G.CITY_DATA[0]); });
    await page.click('[data-mate="monteiro"] .mb-person');
    await page.click('.mb-actions button:has-text("이야기한다")');
    assert.deepStrictEqual(await page.evaluate(() => window.__talked), { city: 0, id: 'monteiro' });
    await page.screenshot({ path: path.join(OUT, '03-tavern-companions.png') });
    await page.click('.mb-fire');
    await page.getByRole('button', { name: '그만둔다', exact: true }).click();
    assert.strictEqual(await page.locator('.mb-name').textContent(), await page.evaluate(() => G.MATE.monteiro.name), '해고 취소 후 같은 동료 화면 유지');
    await page.setViewportSize({ width: 960, height: 540 });
    const bounds = await page.locator('.matebook').boundingBox(); assert(bounds.x >= 0 && bounds.x + bounds.width <= 961);
    await page.screenshot({ path: path.join(OUT, '04-compact-detail.png') });
    await page.keyboard.press('Escape');
    const dismissal = await page.evaluate(async () => {
      const s = G.Game.state, MD = G.MateDismiss, R = G.R, T = G.Scenes.city.B.tavern, c = G.CITY_DATA[0];
      G.UI.confirm = async () => true; G.UI.say = async () => {};
      G.Achieve.afterHire = async () => {};
      const checks = {};
      const m = s.mates.find(x => x.id === 'monteiro');
      let chance; G.U.chance = p => { chance = p; return true; }; G.UI.ask = async () => true;
      s.leaving = [m.id]; s.mateLeave = { pend: [{ id: m.id, kind: 'other' }] };
      checks.stayed = !await MD.fire(m, c) && s.mates.includes(m);
      checks.chance = chance; checks.devotedWage = R.mateWage(m.id);
      R.setLoyal(m, 0); G.Cabins.monthly(false); checks.loyal = m.loyal;
      checks.pendingClear = !s.leaving.length && !s.mateLeave.pend.length;
      checks.noLeave = G.MateLeave.weight(m) === 0;
      const saved = G.State.deserialize(G.State.serialize()); G.Game.state = saved;
      checks.savedOath = R.mateWage(m.id) === 10 && saved.mates.find(x => x.id === m.id).devoted;
      G.Game.state = s;
      G.U.chance = () => false;
      const fired = s.mates.find(x => x.id === 'vandermeer'); fired.skg = { nav: 1 }; fired.lgx = { 14: 2 }; fired.aff = 42;
      const wage = R.mateWage(fired.id);
      checks.fired = await MD.fire(fired, c); checks.unhired = !s.mates.some(x => x.id === fired.id);
      checks.returned = MD.returning(fired.id) && T.candidates(c).some(x => x.id === fired.id);
      checks.wageIncrease = R.mateWage(fired.id) > wage;
      checks.returnList = G.MateKnow.wanderers().some(x => x.id === fired.id);
      checks.stay = G.MateMove.rumorStayLeft(fired.id);
      G.UI.ask = async () => null;
      await T.hireMate(c, G.MATE[fired.id]);
      const hired = s.mates.find(x => x.id === fired.id);
      checks.rehired = !!hired && hired.rehired === 1 && !MD.returning(fired.id);
      checks.preserved = hired.skg.nav === 1 && hired.lgx[14] === 2 && hired.aff === 42;
      checks.priced = R.mateWage(fired.id) === MD.record(fired.id).wage;
      const long = s.mates.find(x => x.id === 'deleon'); long.joinedDay = s.day - G.BALANCE.mateDismiss.returnMaxDays;
      await MD.fire(long, c); checks.longGone = !MD.returning(long.id) && !!s.flags['gone_' + long.id];
      const refuse = s.mates.find(x => x.id === 'beaumont'); G.U.chance = () => true; G.UI.ask = async () => false;
      await MD.fire(refuse, c); checks.refused = !s.mates.some(x => x.id === refuse.id) && MD.returning(refuse.id);
      const protectedMate = s.mates.find(x => x.id === 'rocco');
      checks.rocco = !await MD.fire(protectedMate, c) && s.mates.includes(protectedMate);
      const cancel = s.mates.find(x => x.id === 'weiss'); G.UI.confirm = async () => false;
      checks.cancel = !await MD.fire(cancel, c) && s.mates.includes(cancel) && !MD.record(cancel.id);
      G.UI.confirm = async () => true; G.U.chance = () => false;
      const pair = ['romeo', 'juliet'].map(id => ({ id, role: 'none', loyal: 80, joinedDay: s.day, joined: G.U.dateNum(s.date), ev: true }));
      s.mates.push(...pair);
      await MD.fire(pair[0], c);
      checks.spouse = pair.every(m => !s.mates.some(x => x.id === m.id) && MD.returning(m.id));
      checks.noDuplicateReturn = pair.every(m => !(s.oldGuard && s.oldGuard.ret || []).some(r => r.id === m.id && !r.done));
      checks.eventCandidate = T.candidates(c).some(m => m.id === 'romeo');
      checks.eventRange = G.MateMove.range('romeo').includes(c.id) && G.MateMove.range('romeo').length > 1;
      const restored = G.State.deserialize(G.State.serialize()); G.Game.state = restored;
      checks.savedReturn = MD.returning('romeo') && R.mateWage('romeo') > G.MATE.romeo.wage;
      delete restored.mateDismiss;
      checks.oldSave = R.mateWage('romeo') === G.MATE.romeo.wage && !MD.returning('romeo');
      G.Game.state = s;
      return checks;
    });
    assert.strictEqual(dismissal.chance, .005); assert.strictEqual(dismissal.devotedWage, 10); assert.strictEqual(dismissal.loyal, 100);
    assert.strictEqual(dismissal.stay, 60);
    for (const [key, value] of Object.entries(dismissal)) if (!['chance', 'devotedWage', 'loyal', 'stay'].includes(key)) assert(value, key);
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ overview, detail, dismissal, errors, screenshots: OUT }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
