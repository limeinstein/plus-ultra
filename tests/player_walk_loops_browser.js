/* 주인공 14종: file:// 실제 거리의 시트 선택·49칸 재생·크기·발밑·정지 자세 검사. */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const MOTION = process.env.HERO_MOTION || 'walk';
const OUT = process.env.HERO_MOTION_OUT || path.join(ROOT, 'artifacts', MOTION === 'run' ? 'run-loop-update-20261027' : 'walk-loop-update-20261027');
fs.mkdirSync(OUT, { recursive: true });
const EXE = process.env.BROWSER_EXE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
function ok(v, label) { if (!v) throw new Error(label); }

(async () => {
  const browser = await playwright.chromium.launch({ executablePath: EXE,
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  try {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const state = G.State.newGame({ name: '걷기크기검수', nation: 'PT', job: 'adventurer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk,
        lg: G.LANGS.map(() => 3), diff: 'normal' });
      state.settings.res = .35;
      G.Game.state = state;
      G.UI.fade = async fn => { await fn(); };
      G.Scenes.city.prologue = async () => { G.Game.state.flags.prologue = true; };
    });
    const allLooks = await page.evaluate(() => Object.keys(G.HERO_MOTION));
    const looks = process.argv.length > 2 ? process.argv.slice(2) : allLooks;
    const results = [];
    for (const look of looks) {
      await page.evaluate(look => {
        G.Game.state.player.look = look;
        G.Game.state.player.portrait = { img: ['portraits/player/' + look] };
        G.Town.close();
        G.Game.go('city', { cityId: 0 });
      }, look);
      await page.waitForFunction(({ look, motion }) => {
        const s = G.Town.runtime();
        return G.Game.sceneName === 'city' && s && !G.Town.hidden() && s.heroMotion[motion] &&
          G.Img.heroLook() === look && s.heroMotion[motion] === G.Img.get('characters/' + look + '/motion/' + motion);
      }, { look, motion: MOTION }, { timeout: 60000 });
      const result = await page.evaluate(({ look, motion }) => {
        const s = G.Town.runtime(), atlas = s.heroMotion[motion], cfg = G.HERO_MOTION[look];
        const w = atlas.naturalWidth / 7, h = atlas.naturalHeight / 7;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const c = cv.getContext('2d', { willReadFrequently: true });
        const heights = [], bottoms = [], edges = [], hashes = [];
        for (let i = 0; i < 49; ++i) {
          c.clearRect(0, 0, w, h);
          c.drawImage(atlas, i % 7*w, Math.floor(i / 7)*h, w, h, 0, 0, w, h);
          const d = c.getImageData(0, 0, w, h).data;
          let top = h, bottom = -1, left = w, right = -1, hash = 2166136261;
          for (let y = 0; y < h; ++y) for (let x = 0; x < w; ++x) {
            const p = (y*w+x)*4, a = d[p+3];
            if (a > 40) { top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x); }
            // 보이는 RGB와 알파만 비교한다.
            for (let k = 0; k < 4; ++k) hash = Math.imul(hash ^ (k < 3 && !a ? 0 : d[p+k]), 16777619);
          }
          heights.push(bottom-top+1); bottoms.push(bottom); hashes.push(hash);
          if (left <= 1 || right >= w-2 || top <= 1 || bottom >= h-2) edges.push(i);
        }
        const selected = [], walkTransitions = [], renderedRunHeights = [], renderedWalkHeights = [];
        const walk = s.heroMotion.walk;
        const original = CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
          if (img === atlas && a.length === 8) {
            const index = Math.round(a[0]/w) + 7*Math.round(a[1]/h);
            selected.push(index);
            if (motion === 'run') renderedRunHeights.push(heights[index]*a[7]/a[3]);
          }
          if (motion === 'run' && img === walk && a.length === 8) {
            walkTransitions.push(Math.round(a[0]/(walk.naturalWidth/7)) + 7*Math.round(a[1]/(walk.naturalHeight/7)));
            const sw = walk.naturalWidth/7, sh = walk.naturalHeight/7;
            const wc = document.createElement('canvas'); wc.width = sw; wc.height = sh;
            const wx = wc.getContext('2d'); original.call(wx,walk,a[0],a[1],sw,sh,0,0,sw,sh);
            const px = wx.getImageData(0,0,sw,sh).data;
            let top = sh, bottom = -1;
            for (let y = 0; y < sh; ++y) for (let x = 0; x < sw; ++x) if (px[(y*sw+x)*4+3] > 40) {
              top = Math.min(top,y); bottom = Math.max(bottom,y);
            }
            renderedWalkHeights.push((bottom-top+1)*a[7]/a[3]);
          }
          return original.call(this, img, ...a);
        };
        try {
          s.hero.x = Math.min(450, s.streetW/2); s.hero.to = null; s.hero.entering = false;
          s.hero.fade = 1; s.keys = { right: true, shift: motion === 'run' }; s.hero.walkV = null;
          const start = cfg[motion + 'Start'] || 0, n = 49 - start;
          const cycles = cfg[motion + 'Cycles'] || (motion === 'run' ? 2 : 1);
          for (let i = 0; i < 50; ++i) {
            s.hero.gaitPhase = ((i % n + .25) / n) * cycles;
            s.dirty = true; G.Town.update(0);
          }
          if (motion === 'run') {
            const walkStart = cfg.walkStart || 0;
            s.keys = { right: true }; s.hero.gaitPhase = (7-walkStart+.25)/(49-walkStart)*(cfg.walkCycles || 1);
            s.dirty = true; G.Town.update(0);
          }
          s.keys = {}; s.hero.walking = false; s.hero.running = false; s.hero.keyRun = null;
          s.dirty = true; G.Town.update(0);
        } finally { CanvasRenderingContext2D.prototype.drawImage = original; }
        // 실제 이동을 통해 벽 앞 제자리 달리기, 장면 시간에 따른 자세 튐,
        // Shift 전환의 발 교대 초기화를 검사한다.
        const movement = (() => {
          s.hero.x = 600; s.hero.to = null; s.hero.entering = false;
          s.keys = { right: true }; s.hero.keyRun = null; s.hero.gaitPhase = 0;
          G.Town.update(1/30);
          const walking = s.hero.gaitPhase, x = s.hero.x;
          s.keys.shift = true; G.Town.update(1/30);
          const running = s.hero.gaitPhase;
          s.keys = {}; G.Town.update(1/30);
          const stopped = s.hero.gaitPhase;
          s.t += 600; s.dirty = true; G.Town.update(1/30);
          const afterWait = s.hero.gaitPhase;
          s.hero.x = s.streetW-40; s.keys = { right: true, shift: true };
          G.Town.update(1/30);
          const wall = { phase: s.hero.gaitPhase, walking: s.hero.walking, running: s.hero.running };
          s.hero.x = 600; s.keys = {}; s.hero.walking = false; s.hero.running = false;
          s.hero.keyRun = null; s.dirty = true; G.Town.update(0);
          return { walking, running, stopped, afterWait, wall, walkDistance: x-600 };
        })();
        return { look, width: w, height: h, heightMin: Math.min(...heights), heightMax: Math.max(...heights),
          bottomMin: Math.min(...bottoms), bottomMax: Math.max(...bottoms), edges,
          unique: new Set(hashes).size, selected, walkTransitions, renderedRunHeights, renderedWalkHeights,
          idle: cfg.idle, start: cfg[motion + 'Start'] || 0, movement, skip: cfg.skip || [] };
      }, { look, motion: MOTION });
      ok(!result.skip.includes(MOTION), look + ' 새 동작 시트가 제외됨');
      ok(result.heightMax-result.heightMin <= 2, look + ' 크기 변화');
      ok(result.bottomMin === result.bottomMax, look + ' 발밑 흔들림');
      ok(!result.edges.length, look + ' 가장자리 잘림');
      ok(result.unique >= 8, look + ' 보행 자세 누락');
      ok(result.selected.length === (MOTION === 'run' ? 50 : 51) && result.selected.slice(0,50).every((v,i) => v === result.start+i%(49-result.start)), look + ' 프레임 순서/루프 경계');
      const m = result.movement;
      ok(m.walkDistance > 0 && m.walking > 0 && m.running > m.walking, look + ' 이동에 따른 걷기·뛰기 재생');
      ok(m.running-m.walking < .2, look + ' Shift 전환 때 보행 주기 초기화');
      ok(m.stopped === m.afterWait && m.wall.phase === m.afterWait && !m.wall.walking && !m.wall.running, look + ' 정지·벽 앞에서 제자리 달리기');
      if (MOTION === 'run') {
        ok(result.walkTransitions[0] === 7 && result.walkTransitions[1] === result.idle, look + ' 달리기→걷기→대기 전환');
        const hs = result.renderedRunHeights.concat(result.renderedWalkHeights);
        ok(Math.max(...hs)-Math.min(...hs) <= .65, look + ' 걷기/달리기 실제 표시 크기 차이');
      }
      else ok(result.selected[50] === result.idle, look + ' 대기 자세');
      if (['admiral', 'armored_navigator', 'navigator_white', 'hat_spinner'].includes(look)) {
        await page.evaluate(motion => {
          const s = G.Town.runtime();
          s.hero.x = 600; s.cam = s.camTo = 0;
          s.keys = { right: true, shift: motion === 'run' };
          s.hero.gaitPhase = .38; s.dirty = true; G.Town.update(0);
        }, MOTION);
        await page.screenshot({ path: path.join(OUT, look + '-town.png') });
      }
      results.push(result);
      console.log(`${look}: 키 ${result.heightMin}~${result.heightMax}px, 발밑 ${result.bottomMin}px, 서로 다른 ${result.unique}자세, 49→1 재생·정지 통과`);
    }
    ok(!errors.length, errors.join('\n'));
    const reportName = process.argv.length > 2 ? 'browser-results-selected.json' : 'browser-results.json';
    fs.writeFileSync(path.join(OUT, reportName), JSON.stringify({ results, errors }, null, 2));
    console.log(`file:// 실제 거리에서 ${looks.length}종 검사 통과 · 콘솔 오류 0`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
