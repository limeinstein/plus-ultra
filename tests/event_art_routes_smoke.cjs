/* 완성된 사건 그림·미완성 그림의 대체 표시·실제 소식 전달 경로를 검사한다. */
'use strict';
const assert = require('assert'), path = require('path'), { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const s = G.State.newGame({ name: '사건 전달 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const UI = G.UI, saved = { say: UI.say, ask: UI.ask, pic: G.FamEv.showPic, wedding: G.EventShot.princess, events: G.REL_EVENTS, history: G.HISTORY };
      const seen = [], stopped = [], news = []; let weddings = 0;
      UI.say = async () => {}; UI.ask = async () => 'no';
      G.FamEv.showPic = e => { seen.push(e.img); return { stop: async () => stopped.push(e.img) }; };
      G.EventShot.princess = async () => { weddings++; return { stop: async () => stopped.push('wedding') }; };
      const missing = 'legend-events/__release_unfinished__';
      try {
        const e = saved.events.find(e => e.id === 'ib_wed1497');
        if (!e || !G.Img.has(e.img)) throw Error('검사할 완성된 왕실 그림 없음');
        for (const img of [e.img, missing]) {
          G.REL_EVENTS = [{ ...e, img, need: null, who: { princess: G.COURT.princesses[0].id } }];
          s.date = { y: e.y, m: e.m, d: e.d || 1 }; delete s.rel;
          G.Rel.daily(); s.rel.pend = [e.id]; await G.Rel.present();
        }
        for (const img of [e.img, missing]) {
          G.REL_EVENTS = [{ ...e, img, need: null, who: null, ask: null }]; delete s.rel;
          news.push(G.Rel.daily().find(n => n.img === img));
        }
        G.REL_EVENTS = [];
        const h = saved.history.find(h => h.img && G.Img.has(h.img));
        if (!h) throw Error('검사할 완성된 세계 소식 그림 없음');
        for (const img of [h.img, missing]) {
          G.HISTORY = [{ ...h, img, quiet: false }]; s.history = 0; s.date = { y: h.y, m: h.m || 1, d: h.d || 1 };
          news.push(G.World.daily().find(n => n.text === h.text));
        }
        return { expected: e.img, seen, stopped, weddings, pictureNews: [news[0]?.icon?.src, news[2]?.icon?.src], fallbackNews: [news[1]?.icon, news[3]?.icon] };
      } finally {
        UI.say = saved.say; UI.ask = saved.ask; G.FamEv.showPic = saved.pic; G.EventShot.princess = saved.wedding; G.REL_EVENTS = saved.events; G.HISTORY = saved.history;
      }
    });
    assert.deepStrictEqual(result.seen, [result.expected]);
    assert.deepStrictEqual(result.stopped, [result.expected, 'wedding']); assert.equal(result.weddings, 1);
    assert(result.pictureNews.every(Boolean)); assert.deepStrictEqual(result.fallbackNews, ['heart', 'scroll']);
    assert.deepStrictEqual(errors, []);
    console.log('왕실 장면 표시·종료, 미완성 장면의 혼례 대체, 외교·세계 소식의 그림/기본 아이콘, 브라우저 오류 0 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
