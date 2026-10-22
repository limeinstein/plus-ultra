/* 지역별 성문지기·왕실 정원사 얼굴상/무릎상 연결 검사
   · 20개 주민 양식마다 성문은 npc-roles/<양식>/soldier, 정원은 gardeners/<양식>/gardener를 쓴다
   · 얼굴상과 무릎상이 모두 실제로 로드되고 얼굴 위치 자료가 있다 · 콘솔 오류 0
   node tests/regional_staff_portraits_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Garden && G.Scenes.city && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '초상 검사', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, UI = G.UI, cityScene = G.Scenes.city;
      s.flags.prologue = true; s.date = { y: 1550, m: 5, d: 1 };
      const original = { say: UI.say, choose: UI.choose };
      let speaker = null;
      UI.say = async (text, who) => { speaker = who || null; };
      UI.choose = async () => null;
      const byStyle = {};
      G.CITY_DATA.forEach(c => { const style = G.Img.folkStyle(c); if (!byStyle[style]) byStyle[style] = c; });
      const bad = [], keys = [];
      for (const style of Object.keys(byStyle).sort()) {
        const c = byStyle[style];
        s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat };
        speaker = null;
        await cityScene.B.gate.enter(c);
        const gate = 'portraits/npc-roles/' + style + '/soldier';
        const gateFace = speaker && G.Img.pick(G.Art.portraitKeys(speaker.portrait));
        const gateHalf = speaker && G.Img.pick(speaker.half);
        if (gateFace !== gate || gateHalf !== gate + '_half') bad.push(style + ':gate=' + gateFace + '|' + gateHalf);
        keys.push(gate, gate + '_half');

        speaker = null;
        await G.Garden.visit(G.SPONSOR.pt_king);
        const garden = 'portraits/gardeners/' + style + '/gardener';
        const gardenFace = speaker && G.Img.pick(G.Art.portraitKeys(speaker.portrait));
        const gardenHalf = speaker && G.Img.pick(speaker.half);
        if (gardenFace !== garden || gardenHalf !== garden + '_half') bad.push(style + ':garden=' + gardenFace + '|' + gardenHalf);
        if (!G.PORTRAIT_FACES[garden] || !G.PORTRAIT_FACES[garden + '_half']) bad.push(style + ':garden-face-metadata');
        keys.push(garden, garden + '_half');
      }
      Object.assign(UI, original);
      const loads = await Promise.all(keys.map(key => new Promise(resolve => {
        const im = new Image();
        im.onload = () => resolve({ key, w: im.naturalWidth, h: im.naturalHeight });
        im.onerror = () => resolve({ key, w: 0, h: 0 });
        im.src = G.Img.src(key);
      })));
      loads.filter(x => !x.w || !x.h || (/_half$/.test(x.key) && (x.w !== 1024 || x.h !== 1536))).forEach(x => bad.push(x.key + ':' + x.w + 'x' + x.h));
      return { styles: Object.keys(byStyle).sort(), assets: keys.length, bad };
    });
    ok(result.styles.length === 20, '주민 양식 20곳: ' + result.styles.join(', '));
    ok(result.assets === 80 && !result.bad.length, '성문지기·왕실 정원사 얼굴상/무릎상 80개가 지역별 짝으로 연결되고 모두 로드된다 ' + result.bad.join(', '));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
