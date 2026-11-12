/* 다섯 왕녀의 특명, 전용 장면, 혼인, 달력으로 7년 간격과 옛 저장을 검사한다. */
'use strict';
const path = require('path');
const assert = require('assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    const root = path.resolve(__dirname, '..');
    await page.goto((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title');
    const visited = await page.evaluate(async () => {
      const P = G.Princess, U = G.U, list = G.PRINCESS_STORIES;
      function check(cond, label) { if (!cond) throw Error(label); }
      const fresh = () => {
        const s = G.Game.state = G.State.newGame({ name: '항해 시험', nation: 'PT', job: 'adventurer', age: 28,
          birth: { m: 5, d: 10 }, st: { str: 60, int: 65, mar: 70, cha: 60 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
        s.date = { y: 1484, m: 2, d: 29 }; s.settings.autosave = false; s.settings.res = 0.35;
        s.player.fame = 52000; s.player.fameBy = null; G.Fame.sync();
        return s;
      };
      let spoken = [], choice = '', frames = new Set();
      G.UI.say = async (text, speaker) => {
        spoken.push({ text, speaker });
        const img = document.querySelector('.famscene img');
        if (img) { await img.decode(); check(img.naturalWidth === 1881, img.src); frames.add(img.src.split('/').pop()); }
      };
      G.UI.ask = async (text, options) => text === G.PRINCESS_LINES.ask || text === G.PRINCESS_LINES.proposeAsk ? 'yes' : choice;
      G.UI.alert = async () => {}; G.UI.toast = () => {};
      await G.Game.ensureGeo();
      const done = [];
      for (let i = 1; i < list.length; i++) {
        const d = list[i]; let s = fresh(); frames = new Set(); spoken = [];
        const rng = U.rng;
        U.rng = () => (i + 0.5) / list.length;
        try { check(P.daily()[0].text.includes(d.name), d.name + ' 소환'); } finally { U.rng = rng; }
        const sp = G.SPONSOR[s.princess.sp], port = G.CITY_DATA[d.port], target = G.CITY_DATA[d.target];
        check(G.Court.realmOf(sp).id === d.realm && P.palaceItems(sp)[0].label === d.title, d.title);
        await P.onEnter(sp);
        check(s.princess.stage === 1 && s.known.includes(port.id) && P.html().includes(port.name), '출발 ' + d.name);
        s.loc = { mode: 'sea', lon: port.dock[1], lat: port.dock[0] };
        if (d.fleet) {
          const npc = P.spawn([]);
          check(npc && npc.lady === d.id && P.encounterText(npc).includes(d.fleet), '해상 추적 ' + d.name);
          P.afterBattle(npc, 'win', [], []); await P.tell();
        } else {
          check(!P.spawn([]), '비전투 사건');
          await P.arrival(port);
        }
        check(s.princess.stage === 2 && s.known.includes(target.id) && P.html().includes(d.trace), '단서 기록');
        s = G.Game.state = G.State.deserialize(G.State.serialize());
        check(s.princess.lady === d.id && !P.daily().length, '저장 후 인물 유지');
        choice = String(1 - d.answer); await P.arrival(target);
        check(s.princess.stage === 2 && spoken.some(l => l.text === d.retry), '선택 재시도');
        choice = String(d.answer); await P.todo(target)[0].onClick();
        check(s.princess.stage === 3 && spoken.some(l => l.text === d.greeting && l.speaker.half[0].endsWith(d.id + '_half')), '무릎상과 구출');
        check(await P.onEnter(sp), '귀환');
        check(s.player.wife === d.id && P.title() === '부마' && G.Court.rank(G.COURT.realms[d.realm]) === 1, '혼인과 작위');
        for (const k of ['clue', 'rescue', 'return', 'wedding']) check(frames.has(d.id + '_' + k + '.webp'), '실제 장면 ' + d.id + k);
        check(spoken.some(l => l.text === d.proposal), '고유 청혼');
        s.date = { y: 1491, m: 2, d: 27 }; check(!P.daily().length, '7년 전날');
        s.date.d = 28; check(P.daily().length === 1 && s.princess.lady !== d.id, '윤년에서 7년 되는 날');
        check(P.title() === '부마' && G.Family.wifeSpeaker().name === d.name && G.Game.hud.titleTip().includes(G.COURT.realms[d.realm].name), '다른 왕녀가 나와도 배우자와 칭호 유지');
        s.princess.stage = 3; s.date.y += 8; const current = s.princess;
        check(!P.daily().length && s.princess === current, '오래 진행한 의뢰와 겹치지 않는다');
        const gold = s.player.gold;
        await P.onEnter(G.SPONSOR[current.sp]);
        check(current.end === 'done' && s.player.wife === d.id && s.player.gold - gold === G.BALANCE.princess.gold, '혼인 뒤의 특명은 하사금만 받는다');
        done.push(d.title);
      }
      const s = fresh();
      s.princess = { stage: 3, sp: 'es_crown', day0: s.day };
      check(P.speaker().name === G.PRINCESS.name && !P.daily().length, '진행 중인 옛 블랑카');
      s.princess.end = 'done'; check(!P.daily().length && s.princess.nextCall === 14910228, '완료한 옛 저장에서 달력 복원');
      const seen = new Set([G.PRINCESS.id]);
      for (let i = 0; i < 5; i++) {
        s.date = { y: 1491 + 7 * i, m: 2, d: 28 };
        check(P.daily().length === 1 && !seen.has(s.princess.lady), '한 항해 안의 중복 추첨');
        seen.add(s.princess.lady); s.princess.end = i % 2 ? 'failed' : 'done';
      }
      s.date.y += 7; check(seen.size === list.length && !P.daily().length, '모든 이야기 완료');
      return done;
    });
    console.log('통과 · ' + visited.join(' / '));
    const gallery = await browser.newPage();
    gallery.on('pageerror', e => errors.push(e.message));
    gallery.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await gallery.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await gallery.goto((process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'catalog.html')).href) + '?view=player&all=1#events');
    await gallery.locator('[data-tab="events"]').first().click();
    const first = gallery.locator('.card').filter({ hasText: '거짓 등대의 밤 · 발단' }).first();
    await first.click(); await gallery.locator('#detail[open]').waitFor();
    assert((await gallery.locator('#dBody').innerText()).includes('리본'));
    assert.deepEqual(errors, []);
    console.log('통과 · 실제 사건 그림 20장, 도감 상세 화면, 7년 주기, 옛 저장, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
