/* 실제 file:// 거리에서 14종의 경치 구경·인사·스트레칭과 이동·대화 우선권을 검사한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/player-idle-20261103/browser');
fs.mkdirSync(OUT, { recursive: true });
const ok = (v, message) => { if (!v) throw new Error(message); };

(async () => {
  const browser = await playwright.chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const errors = [], results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '거리대기검수', nation: 'PT', job: 'adventurer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk,
        lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Game.state.settings.res = .35;
      G.UI.fade = async fn => { await fn(); };
      G.Scenes.city.prologue = async () => { G.Game.state.flags.prologue = true; };
    });
    const looks = process.argv.slice(2);
    fs.writeFileSync(path.join(OUT, 'fx.json'), JSON.stringify(await page.evaluate(() => G.FX.townHeroGestures), null, 2));
    if (!looks.length) looks.push(...await page.evaluate(() => Object.keys(G.HERO_MOTION)));
    for (const look of looks) {
      await page.evaluate(look => {
        G.Game.state.player.look = look;
        G.Game.state.player.portrait = { img: ['portraits/player/' + look] };
        G.Town.close(); G.Game.go('city', { cityId: 0 });
      }, look);
      await page.waitForFunction(look => {
        const s = G.Town.runtime();
        return s && !s.hidden && s.heroMotion.idle && G.Img.heroLook() === look;
      }, look, { timeout: 60000 });
      const result = await page.evaluate(() => {
        const s = G.Town.runtime(), fx = G.FX.townHeroGestures, h = s.hero, atlas = s.heroMotion.idle;
        const folk = s.folks.find(f => !f.animal);
        if (!folk) throw new Error('검수용 거리 주민 없음');
        s.folks = []; s.keys = {}; h.x = 650; h.to = null; h.entering = false;
        h.walking = false; h.running = false; h.keyRun = null; h.gesture = null;
        h.nextGestureAt = s.t + fx.firstDelay; h.restTurn = 0; h.greeted = [];
        s.cam = s.camTo = 0;
        document.querySelectorAll('.cmdmenu,.todo').forEach(el => { el.style.visibility = 'hidden'; });
        G.Town.update(fx.firstDelay-.1);
        const premature = !!h.gesture;
        G.Town.update(.2);
        const first = h.gesture && h.gesture.kind;
        function sample() {
          const action = h.gesture, selected = [], original = CanvasRenderingContext2D.prototype.drawImage;
          CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
            if (img === atlas && a.length === 8) selected.push(Math.round(a[0]/a[2])+fx.cols*Math.round(a[1]/a[3]));
            return original.call(this, img, ...a);
          };
          try {
            for (let i = 0; i < fx.frames; ++i) {
              action.t = (fx.keyTimes[i]+.001)*action.seconds;
              s.dirty = true; G.Town.update(0);
            }
          } finally { CanvasRenderingContext2D.prototype.drawImage = original; }
          return selected;
        }
        const lookFrames = sample();
        G.Town.update(fx.seconds.look);
        const rested = !h.gesture;
        h.nextGestureAt = s.t+1000;
        const gender = G.Game.state.player.g || 'm';
        folk.spec = Object.assign({}, folk.spec, { sex: gender, child: false });
        folk.x = h.x+110; folk.y = 802; folk.state = 'walk'; folk.v = 1; folk.target = h.x+1000;
        s.folks = [folk]; G.Town.update(fx.greetDwell+.1);
        const sameSexIgnored = !h.gesture;
        folk.spec.sex = gender === 'm' ? 'f' : 'm'; folk.state = 'idle'; folk.timer = 999;
        G.Town.update(fx.greetDwell+.1);
        const standingIgnored = !h.gesture;
        folk.state = 'walk'; folk.spec.child = true; G.Town.update(fx.greetDwell+.1);
        const childIgnored = !h.gesture;
        folk.spec.child = false; G.Town.update(fx.greetDwell+.1);
        const greeting = h.gesture && h.gesture.kind, right = h.dir;
        const greetFrames = sample();
        G.Town.update(fx.seconds.greet);
        h.nextGestureAt = s.t+1000;
        s.t += fx.greetCooldown+1; G.Town.update(.1);
        const repeated = !!h.gesture;
        folk.x = h.x+fx.greetExit+30; G.Town.update(.1);
        folk.x = h.x-110; G.Town.update(fx.greetDwell+.1);
        const returnGreeting = h.gesture && h.gesture.kind, left = h.dir;
        const beforeX = h.x; s.keys = { right: true }; G.Town.update(1/30);
        const interrupted = !h.gesture && h.x>beforeX && h.walking;
        s.keys = {}; G.Town.update(.01);
        h.greeted = []; s.folks = [];
        h.restTurn = 1; h.nextGestureAt = s.t; G.Town.update(0);
        const stretching = h.gesture && h.gesture.kind, stretchFrames = sample();
        const busy = G.UI.busy;
        G.UI.busy = () => true;
        G.Town.update(.01);
        const busyCancelled = !h.gesture;
        G.UI.busy = busy;
        return { premature, first, rested, greeting, right, repeated, returnGreeting, left,
          interrupted, stretching, busyCancelled, sameSexIgnored, standingIgnored, childIgnored, lookFrames, greetFrames, stretchFrames,
          atlas: [atlas.naturalWidth, atlas.naturalHeight] };
      });
      ok(!result.premature && result.first === 'look' && result.rested, look+' 경치 구경 시작·완료');
      ok(result.greeting === 'greet' && result.right === 1 && !result.repeated && result.returnGreeting === 'greet' && result.left === -1, look+' 상대 방향·재인사 제한');
      ok(result.interrupted && result.stretching === 'stretch' && result.busyCancelled, look+' 이동·대화 우선권');
      for (const [row, key] of ['lookFrames','greetFrames','stretchFrames'].entries()) {
        ok(result[key].length === 12 && result[key].every((f,i) => f === row*12+i), look+' '+key+' 재생 순서');
      }
      ok(result.sameSexIgnored && result.standingIgnored && result.childIgnored, look+' 지나가는 성인 이성에게만 인사');
      if (['admiral','navigator_white','ganghui'].includes(look)) {
        for (const kind of ['look','greet','stretch']) {
          await page.evaluate(kind => {
            const s = G.Town.runtime(), h = s.hero, fx = G.FX.townHeroGestures;
            s.keys = {}; h.to = null; h.walking = false; h.running = false; h.keyRun = null;
            s.folks = []; h.nextGestureAt = s.t+1000;
            h.gesture = { kind, row: ['look','greet','stretch'].indexOf(kind), t: fx.seconds[kind]*.6,
              seconds: fx.seconds[kind], target: null, resolvers: [] };
            s.dirty = true; G.Town.update(0);
          }, kind);
          await page.screenshot({ path: path.join(OUT, look+'-'+kind+'.png') });
        }
      }
      results.push({ look, ...result });
      console.log(look+': 구경·인사·스트레칭 36칸, 방향·중복 제한·취소 통과');
      if (look === 'admiral') {
        const chat = await page.evaluate(async () => {
          const s = G.Town.runtime(), h = s.hero, fx = G.FX.townHeroGestures;
          s.keys = {}; h.to = null; h.walking = false; h.running = false; h.keyRun = null;
          const f = G.StreetFolk.make('woman', s.city, s.streetW, h.x, 768, '즉시대화검수');
          f.x = h.x+100; f.y = 802; s.folks = [f];
          h.gesture = { kind: 'greet', row: 1, t: 0, seconds: fx.seconds.greet, target: f };
          const oldTalk = G.StreetFolk.talk; let calls = 0;
          G.StreetFolk.talk = async () => { calls++; };
          const start = performance.now();
          try {
            await G.Scenes.city.chatFolk(f);
            await G.Scenes.city.chatFolk(f);
            const result = { calls, elapsed: performance.now()-start, gesture: !!h.gesture };
            h.gesture = { kind: 'greet', row: 1, t: 0, seconds: fx.seconds.greet, target: f };
            G.Town.hidden(true); result.hiddenCancelled = !h.gesture;
            G.Town.hidden(false); return result;
          } finally { G.StreetFolk.talk = oldTalk; }
        });
        ok(chat.calls === 2 && chat.elapsed < 500 && !chat.gesture, '두 번 연속 대화도 인사 대기 없이 즉시 열림: '+JSON.stringify(chat));
        ok(chat.hiddenCancelled, '화면을 떠나면 대기 동작 취소');
      }
    }
    ok(!errors.length, errors.join('\n'));
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(looks.length+'종 실제 거리 검사 통과 · 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
