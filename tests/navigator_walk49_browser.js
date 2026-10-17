/* 하얀 남방 항해사 49프레임 걷기: 거리 배치·순차 재생·화면 캡처.
   NODE_PATH=<playwright node_modules> node tests/navigator_walk49_browser.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'player-motion-sheets', 'navigator_white', 'walk49');
const SHOT = path.join(OUT, 'navigator_white_town_walk.png');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    const text = m.text() + ' ' + ((m.location() || {}).url || '');
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(text)) errors.push('console: ' + m.text());
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const state = G.State.newGame({ name: '걷기검수', nation: 'PT', job: 'adventurer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk,
        lg: G.LANGS.map(() => 3), diff: 'normal' });
      state.player.look = 'navigator_white';
      state.player.portrait = state.player.portrait || {};
      state.player.portrait.img = ['portraits/player/navigator_white'];
      state.settings.res = 0.35;
      G.Game.state = state;
      G.UI.fade = async fn => { await fn(); };
      G.Scenes.city.prologue = async function () { G.Game.state.flags.prologue = true; };
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Town.active() && !G.Town.hidden() && G.Town.runtime().heroMotion.walk, null, { timeout: 60000 });

    const linked = await page.evaluate(() => {
      const key = G.Img.chain.heroMotion('walk')[0], atlas = G.Town.runtime().heroMotion.walk;
      return { look: G.Img.heroLook(), key, width: atlas.naturalWidth || atlas.width, height: atlas.naturalHeight || atlas.height };
    });
    ok(linked.look === 'navigator_white', '거리 인물이 navigator_white로 생성됨');
    ok(linked.key === 'characters/navigator_white/motion/walk', '49프레임 걷기 아틀라스가 선택됨');
    ok(linked.width === 1400 && linked.height === 2100, '7×7 아틀라스 크기 1400×2100');

    await page.evaluate(() => {
      window.__navigatorFrames = [];
      const old = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (img) {
        const a = Array.prototype.slice.call(arguments, 1);
        if (a.length === 8 && (img.naturalWidth || img.width) === 1400 && (img.naturalHeight || img.height) === 2100 && a[2] === 200 && a[3] === 300) {
          const frame = Math.round(a[0] / 200) + Math.round(a[1] / 300) * 7;
          const q = window.__navigatorFrames;
          const st = G.Town && G.Town.runtime();
          const expected = st ? Math.floor(st.hero.dist / (52 * 8 / 49)) % 49 : -1;
          if (!q.length || q[q.length - 1].frame !== frame) q.push({ frame, expected, moving: !!(st && st.hero.walking) });
        }
        return old.apply(this, arguments);
      };
      const st = G.Town.runtime();
      // 검수 캡처에서는 영웅을 화면 중앙에 두고, 캐릭터를 가리는 조작 패널만 숨긴다.
      document.querySelectorAll('.cmdmenu, .todo').forEach(el => { el.style.visibility = 'hidden'; });
      st.hero.x = Math.min(300, st.streetW / 3);
      st.hero.dist = 0;
      st.cam = st.camTo = Math.max(0, Math.min(st.streetW - 1600, st.hero.x - 800));
      G.Town.walkTo(st.streetW - 180);
    });
    await page.waitForTimeout(320);
    await page.screenshot({ path: SHOT });
    await page.waitForTimeout(3200);

    const run = await page.evaluate(() => {
      const q = window.__navigatorFrames || [], seen = Array.from(new Set(q.map(x => x.frame)));
      const matched = q.filter(x => x.moving).every(x => x.frame === x.expected);
      const h = G.Town.runtime().hero;
      return { frames: q, unique: seen.length, matched, walking: h.walking, x: h.x };
    });
    console.log('  프레임 표본 ' + run.frames.map(x => x.frame).join(','));
    if (!run.matched) console.log('  불일치 ' + run.frames.filter(x => x.moving && x.frame !== x.expected).slice(0, 8).map(x => x.frame + '/' + x.expected).join(','));
    ok(run.frames.length >= 12 && run.unique >= 12, '거리 이동 중 49프레임 아틀라스의 여러 칸을 실제로 그림 (' + run.unique + '개)');
    ok(run.matched, '매 렌더링에서 이동 거리 순서에 맞는 0~48번 칸이 선택됨');
    ok(fs.existsSync(SHOT) && fs.statSync(SHOT).size > 10000, '거리 걷기 화면 캡처 저장');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
    console.log('스크린샷: ' + SHOT);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
