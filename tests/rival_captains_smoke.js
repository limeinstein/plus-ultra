/* Codex가 그린 탐험가 초상이 게임에 이어졌는지 (2026-10-08) — node tests/rival_captains_smoke.js   (BROWSER_EXE=크롬 경로)
   · images/portraits/rivals/<이름> 그림이 있는 사람은 모두 게임 어딘가에서 쓰인다:
     발견 경쟁자(d.rival) · 탐험 함대(G.EXPEDITIONS) · 바다의 이름난 선장(G.SEA_CAPTAINS — 말할 때 그 초상과 무릎상)
   · 그림이 없는 선장은 예전처럼 코드 얼굴. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const CP = G.Captains, man = G.IMAGE_FILES, list = CP.list();
      const files = Object.keys(man).filter(k => /^portraits\/rivals\/[^/]+$/.test(k) && !/_half$/.test(k)).map(k => k.split('/')[2]);
      const used = new Set();
      G.DISCOVERIES.forEach(d => { if (d.rival) used.add(d.rival[2]); });
      (G.EXPEDITIONS || []).forEach(e => used.add(e.who));
      list.forEach(c => used.add(c.name));
      // 후원자 자리의 사람은 그 초상을 후원자 그림(portraits/sponsors/<자리>_<몇째>)으로 옮겨 쓴다 — 마르틴 베하임 → pt_behaim_1
      (G.SPONSORS || []).forEach(sp => (sp.holders || []).forEach((h, i) => { if (man['portraits/sponsors/' + sp.id + '_' + G.Art.sponsorPic(sp, i)]) used.add(h[2]); }));
      const out = { files: files.length, unused: files.filter(n => !used.has(n)), noHalf: files.filter(n => !man['portraits/rivals/' + n + '_half']), caps: [] };
      const NAT = { PT: '포르투갈', ES: '카스티야', IT: '베네치아', FR: '프랑스', DK: '덴마크' };
      list.filter(c => man['portraits/rivals/' + c.name]).forEach(c => {
        const sp = CP.speaker({ cap: c, nation: NAT[c.nat] || '포르투갈', kind: 'navy' });
        const face = G.Img.pick(G.Art.portraitKeys(sp.portrait) || []), half = G.Img.pick(sp.half || []);
        out.caps.push([c.id, c.name, face === 'portraits/rivals/' + c.name, half === 'portraits/rivals/' + c.name + '_half', CP.roster(c.nat, c.y[0]).some(x => x.id === c.id)]);
      });
      const other = list.filter(x => !man['portraits/rivals/' + x.name] && !x.mate)[0];
      const sp2 = CP.speaker({ cap: other, nation: '카스티야', kind: 'navy' });
      out.other = [other.name, !!sp2.portrait, !sp2.half];
      const bh = (G.SPONSORS || []).filter(sp => sp.id === 'pt_behaim')[0];
      out.behaim = bh ? [G.Img.pick(G.Art.portraitKeys(G.Art.sponsorSpec(bh, 0)) || []), G.Img.pick(G.Art.portraitKeys(G.Art.sponsorSpec(bh, 1)) || [])] : null;
      return out;
    });
    console.log(JSON.stringify(r.caps.map(c => c[1])));
    ok(r.files >= 30, '경쟁자 초상 ' + r.files + '명');
    ok(!r.unused.length, '초상이 있는 사람은 모두 게임에 나온다 ' + r.unused.join(', '));
    ok(!r.noHalf.length, '모두 무릎상이 있다 ' + r.noHalf.join(', '));
    ok(r.caps.length >= 16 && r.caps.every(c => c[2] && c[3] && c[4]), '바다의 이름난 선장 ' + r.caps.length + '명 — 말할 때 그 초상·무릎상, 그 해의 나라 명부에 오른다');
    ok(r.other[1] && r.other[2], '그림이 없는 선장(' + r.other[0] + ')은 예전처럼 코드 얼굴');
    ok(r.behaim && r.behaim[0] === 'portraits/sponsors/pt_behaim_1' && r.behaim[1] === 'portraits/sponsors/pt_behaim', '우주지 학자 자리: 1480~1507 마르틴 베하임은 젊은 초상, 뒤의 페드루 누네스는 예전 그림 ' + JSON.stringify(r.behaim));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
