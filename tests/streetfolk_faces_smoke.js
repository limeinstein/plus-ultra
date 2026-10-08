/* 거리 마을 사람의 얼굴·무릎상 = 걷는 그림과 같은 사람 (images/portraits/street-folk · js/systems/streetfolk.js SF.speaker)
   · 20곳 × 13종 모두 대화창 얼굴이 portraits/street-folk/<그림 이름>_<양식>, 무릎상이 …_half
   · 한양·리스본·캘리컷 거리에서 말을 걸면 대화창에 그 얼굴과 무릎상이 실제로 뜬다 (스크린샷) · 콘솔 오류 0
   node tests/streetfolk_faces_smoke.js   (스크린샷: OUT 또는 임시 폴더/streetfolk_faces) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'streetfolk_faces');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.StreetFolk && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    });
    // ① 양식마다 한 도시씩: 사람 13종 모두 같은 사람의 얼굴·무릎상
    const all = await page.evaluate(() => {
      const D = G.STREET_FOLK, bad = [], seen = {};
      G.CITY_DATA.forEach(c => {
        const st = G.Img.folkStyle(c); if (seen[st]) return; seen[st] = 1;
        Object.keys(D.types).filter(t => !D.types[t].animal).forEach(t => {
          const f = { type: t, name: D.types[t].name, seed: 7 }, sp = G.StreetFolk.speaker(f, c), k = 'portraits/street-folk/' + (D.sprites[t] || t) + '_' + st;
          const keys = G.Art.portraitKeys(sp.portrait) || [];
          if (G.Img.pick(keys) !== k || [].concat(sp.half || [])[0] !== k + '_half' || !G.Img.has(k + '_half') || !G.PORTRAIT_FACES[k]) bad.push(c.name + ':' + t);
        });
      });
      return { styles: Object.keys(seen).length, bad };
    });
    ok(all.styles === 20 && !all.bad.length, '양식 ' + all.styles + '곳 × 13종 모두 걷는 그림과 같은 사람의 얼굴·무릎상(얼굴 자리 있음) ' + all.bad.slice(0, 5).join(', '));

    // ② 실제로 말을 걸어 대화창에 뜨는지
    for (const [nm, type] of [['한양', 'man'], ['리스본', 'soldier'], ['캘리컷', 'grandma']]) {
      const id = await page.evaluate(n => G.CITY_DATA.find(c => c.name === n).id, nm);
      await page.evaluate(id => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: id }); }, id);
      await page.waitForFunction(id => G.Game.sceneName === 'city' && G.Town.active() && G.Town.city() && G.Town.city().id === id && !G.Town.hidden(), id, { timeout: 60000 });
      await page.waitForTimeout(1000);
      await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
      const key = await page.evaluate(async ([id, type]) => {
        const c = G.CITY_DATA[id], f = G.Town.folks().find(x => !x.animal) || {};
        const g = Object.assign({}, f, { type, name: G.STREET_FOLK.types[type].name, face: null });
        g.face = G.StreetFolk.speaker(g, c);
        const keys = [].concat(g.face.half || []);
        G.UI.say('시험 대사입니다.', g.face);
        return keys[0];
      }, [id, type]);
      await page.waitForFunction(() => document.querySelector('.dlg'), null, { timeout: 10000 });
      await page.waitForTimeout(1500);
      const shown = await page.evaluate(() => Array.from(document.querySelectorAll('.dlg-actor img, .dlg-actor canvas, .dlg .pframe canvas')).map(e => e.currentSrc || e.src || e.tagName).join(' '));
      await page.screenshot({ path: path.join(OUT, nm + '.png') });
      ok(!!shown && /street-folk|CANVAS|blob:|data:/.test(shown), nm + ' ' + type + ': 대화창에 ' + key + ' (그림 ' + shown.split(' ').length + '장)');
      await page.evaluate(() => { document.querySelectorAll('.modal-back, .dlg-stage, .dlg').forEach(e => e.remove()); });
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
