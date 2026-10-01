/* 제독 생김새(이강희 = ganghui) 연결 점검: 만들기 화면에서 「이강희」+엔터 → 얼굴·반신상·일기토 시트가 이강희 것으로 이어지는지.
   이강희 일기토 시트(duel/fighters/ganghui)가 아직 없으면 main_admiral로 대신 나오는지,
   시트가 생기면(시험에서는 main_admiral 색을 바꾼 가짜를 넣음) 그 시트로 그리는지, 옛 저장 파일(look 없음)도 얼굴로 알아내는지.
   node tests/hero_look_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'hero_look_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // 글꼴 CDN(fonts.googleapis.com)은 시험 환경에서 막혀 있을 수 있어 뺀다
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const hasSheet = await page.evaluate(() => G.Img.has('duel/fighters/ganghui'));
    console.log('이강희 일기토 시트: ' + (hasSheet ? '있음' : '아직 없음 (main_admiral로 대신)'));

    // 1) 테스트 캐릭터 이강희로 시작
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm', { timeout: 30000 });
    await page.fill('#nm', '이강희');
    await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.player, null, { timeout: 90000 });
    const r1 = await page.evaluate(() => {
      const p = G.Game.state.player;
      return { look: p.look, img: p.portrait && p.portrait.img, hero: G.Img.heroLook(), half: G.Img.pick(G.Img.chain.heroHalf()),
        duel: G.DUEL_ART.pick(G.Games.playerFighter(), {}), keys: G.Art.portraitKeys(p.portrait), st: p.st.str, gold: p.gold };
    });
    ok(r1.look === 'ganghui' && r1.hero === 'ganghui', '이강희 → 생김새 ganghui');
    ok(String(r1.keys) === 'portraits/player/ganghui', '대화창 얼굴 = portraits/player/ganghui (초상에 못 박음)');
    ok(r1.half === 'characters/player_half_ganghui', '수첩 반신상 = characters/player_half_ganghui');
    ok(r1.duel === (hasSheet ? 'ganghui' : 'main_admiral'), '일기토 시트 = ' + r1.duel);
    ok(r1.st === 99, '테스트 캐릭터 능력치 그대로 (힘 99)');

    // 2) 수첩 제독 쪽
    await page.evaluate(() => { G.Info.open('admiral'); });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, '1_info_admiral.png') });
    await page.keyboard.press('Escape');
    await page.evaluate(() => { document.querySelectorAll('.win .x, .win .close').forEach(b => b.click && b.click()); });
    await page.waitForTimeout(500);

    // 3) 일기토 — 지금 있는 그림으로
    await page.evaluate(() => { G.Game.state.settings.res = 0.35; G.Games.duel({ name: '해적 두목', look: 'pirate', str: 60, skill: 2 }, { place: 'deck' }); });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, '2_duel_now.png') });

    // 4) 이강희 시트가 생겼다고 치고(main_admiral 색을 돌린 가짜) — 그 시트를 고르고 그리는지
    const r2 = await page.evaluate(async () => {
      if (G.Img.has('duel/fighters/ganghui')) {      // 진짜 시트가 있으면 그것으로
        document.querySelectorAll('.rduel').forEach(e => { const w = e.closest('.win'); (w || e).remove(); });
        const f0 = G.Games.playerFighter();
        G.Games.duel({ name: '해적 두목', look: 'pirate', str: 60, skill: 2 }, { place: 'deck' });
        return { hero: f0.hero, pick: G.DUEL_ART.pick(f0, {}) };
      }
      const src = await G.Img.load('duel/fighters/main_admiral');
      const cv = document.createElement('canvas'); cv.width = src.naturalWidth || src.width; cv.height = src.naturalHeight || src.height;
      const c = cv.getContext('2d'); c.filter = 'hue-rotate(170deg) saturate(1.4)'; c.drawImage(src, 0, 0);
      G.IMAGE_FILES['duel/fighters/ganghui'] = cv.toDataURL('image/png');
      G.Img.reset();
      document.querySelectorAll('.rduel').forEach(e => { const w = e.closest('.win'); (w || e).remove(); });
      const f = G.Games.playerFighter();
      G.Games.duel({ name: '해적 두목', look: 'pirate', str: 60, skill: 2 }, { place: 'deck' });
      return { hero: f.hero, pick: G.DUEL_ART.pick(f, {}) };
    });
    ok(r2.hero === 'ganghui' && r2.pick === 'ganghui', '시트가 있으면 일기토 시트 = ganghui');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, '3_duel_with_sheet.png') });

    // 5) 옛 저장 파일: look·img 없이 얼굴 번호만 — 얼굴로 생김새를 알아낸다
    const r3 = await page.evaluate(() => {
      const faces = G.Img.list('portraits/player/'), gi = faces.indexOf('portraits/player/ganghui'), ai = faces.indexOf('portraits/player/admiral');
      const old = { portrait: { seed: 'player' + gi + 'PT' } }, adm = { portrait: { seed: 'player' + ai + 'PT' } }, none = { portrait: { seed: 'x' } };
      return { g: G.Img.heroLook(old), a: G.Img.heroLook(adm), n: G.Img.heroLook(none) };
    });
    ok(r3.g === 'ganghui' && r3.a === 'admiral' && r3.n === 'admiral', '옛 저장 파일: 얼굴 번호로 ganghui / admiral, 얼굴 그림 없으면 admiral');

    // 6) 일반 캐릭터(얼굴 admiral)는 예전 그대로
    const r4 = await page.evaluate(() => {
      const p = G.Game.state.player, save = { look: p.look, img: p.portrait.img };
      p.look = 'admiral'; delete p.portrait.img;
      const out = { half: G.Img.pick(G.Img.chain.heroHalf()), walk: G.Img.chain.heroWalk()[0], duel: G.DUEL_ART.pick(G.Games.playerFighter(), {}) };
      p.look = save.look; p.portrait.img = save.img;
      return out;
    });
    ok(r4.half === 'characters/player_half' && r4.walk === 'characters/walk_1' && r4.duel === 'main_admiral', '기본 제독은 예전 그림 그대로');

    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
    console.log('스크린샷: ' + OUT);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
