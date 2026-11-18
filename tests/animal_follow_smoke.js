/* 동물 발자국 따라가기 (2026-11-17) — 앞의 몇 자국만 보이고, 밟은 만큼 흑백 그림에 색이 오르며, 거의 다 오면 놀라 달아날 수 있다
   node tests/animal_follow_smoke.js  (SHOT=1 이면 /tmp/animal_follow_*.png) */
'use strict';
const fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT=process.env.OUT||path.join(ROOT,'artifacts/animal-follow-20261118');fs.mkdirSync(OUT,{recursive:true});
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      await G.Game.ensureGeo();
      const s = G.Game.state, A = G.AnimalTracking, toasts = []; s.date = { y: 1600, m: 3, d: 1 };
      G.UI.toast = (t) => toasts.push(String(t));
      const pick = ['whitetiger', 'mammoth', 'unicorn', 'phoenix', 'smilodon', 'reddragon'].map(id => G.DISC[id]).find(x => x && x.how === 'land' && G.Disc.needMet(x) && G.Disc.built(x) && G.Disc.opened(x) && A.is(x));
      window.__aid = pick.id; G.Disc.addHint(pick.id, 'test');
      const d = pick, pts = A.trail(d), out = { n: pts.length };
      const pos0 = A.position(d);
      A.follow(d, pts[10].lon, pts[10].lat, 'land');   // 앞을 건너뛰면 읽지 못한다
      out.skip = s.track && s.track[d.id] ? s.track[d.id].hit : -1;
      const prog = [];
      const rnd = Math.random; Math.random = () => 0;   // 거의 다 와서 놀라 달아나게
      for (let i = 0; i < 400; i++) {
        const P = A.trail(d), st = s.track[d.id] || { hit: -1 }; let j = st.hit + 1; while (j < P.length - 1 && !G.Geo.isLand(P[j].lon, P[j].lat)) j++; const nx = P[Math.min(P.length - 1, j)];   // 물 위 자국은 건너뛴다
        if (st.hit >= P.length - 1) break;
        A.follow(d, nx.lon, nx.lat, 'land'); prog.push(+A.progress(d).toFixed(2));
      }
      Math.random = rnd;
      const pos1 = A.position(d);
      out.prog = [prog[0], prog[Math.floor(prog.length / 2)], prog[prog.length - 1]];
      out.monotone = prog.every((v, i) => !i || v >= prog[i - 1] - 0.15);   // 달아나면 자국이 늘어 잠깐 줄어든다
      out.bolt = !!s.track[d.id].shift; out.id = d.id; out.moved = +G.Geo.dist(pos0.lon, pos0.lat, pos1.lon, pos1.lat).toFixed(2);
      out.len2 = A.trail(d).length; out.fameK = +A.fameK(d).toFixed(2);
      out.clues = toasts.filter(t => /자국|털|배설물|바람|숨 쉬는|겹쳐|달아났다|찾았다/.test(t));
      out.kind = A.kindName(d);
      // 끝에 서면 발견할 수 있다 (옮겨 간 자리에서)
      const chk = G.Disc.checkLand(pos1.lon, pos1.lat);
      out.found = chk.hits.some(x => x.id === d.id);
      const chk0 = G.Disc.checkLand(pos0.lon, pos0.lat);
      out.foundOld = chk0.hits.some(x => x.id === d.id);
      // 바다: 돌고래의 물결·물보라 자국 — 뭍 위 자국은 건너뛰고 따라간다
      const dl = G.DISC.dolphin; s.track[dl.id] = { hit: -1, said: {} };
      out.dTrace = A.traceKind(dl, 'sea'); out.fTrace = A.traceKind(G.DISC.flamingo, 'land');
      for (let i = 0; i < 300; i++) { const P = A.trail(dl), st = s.track[dl.id]; if (st.hit >= P.length - 1) break; let j = st.hit + 1; while (j < P.length - 1 && G.Geo.isLand(P[j].lon, P[j].lat)) j++; A.follow(dl, P[j].lon, P[j].lat, 'sea'); }
      out.dProg = +A.progress(dl).toFixed(2); out.dBolt = !!s.track[dl.id].shift;
      out.waterClue = toasts.some(t => /거품|물결|물보라|수면/.test(t));
      return out;
    });
    console.log(JSON.stringify(r).slice(0, 900));
    ok(r.dTrace === 'water' && r.fTrace === 'feather' && r.dProg === 1 && !r.dBolt && r.waterClue, '바다에서는 물결·물보라를 끝까지 따라간다 (뭍 위 자국은 건너뜀 · 바다에서는 달아나지 않음 · 새는 깃털)');
    ok(r.skip === -1, '앞의 자국을 건너뛰면 읽지 못한다');
    ok(r.prog[0] > 0 && r.prog[2] === 1 && r.monotone, '한 자국씩 밟을수록 따라간 정도가 오른다 (' + r.prog.join(' → ') + ')');
    ok(r.bolt && r.moved > 0.8 && r.len2 > r.n, '거의 다 오면 놀라 달아나고 새 자국이 이어진다 (' + r.moved + '° · 자국 ' + r.n + '→' + r.len2 + ')');
    ok(r.clues.length >= 4, '처음 자국·25/50/75%·달아남에 부하가 한마디 (' + r.clues.length + ')');
    ok(r.fameK >= 1.39, '끝까지 따라오면 명성 배율 ' + r.fameK);
    ok(r.found && !r.foundOld, '달아난 자리에서 찾는다 (처음 자리에는 없다)');
    if (process.env.SHOT) {
      for (const hit of [-1, 6, 14, 24]) {
        await page.evaluate(async (hit) => {
          const s = G.Game.state, d = G.DISC[window.__aid], A = G.AnimalTracking;
          if (G.Game.sceneName !== 'land') { const c = G.CITY_DATA.filter(c => G.R.cityExists(c)).sort((a, b) => G.Geo.dist(a.lon, a.lat, d.lon, d.lat) - G.Geo.dist(b.lon, b.lat, d.lon, d.lat))[0]; await G.Game.go('land', { from: c.id }); }
          const L = G.Scenes.land.runtime(); L.paused = true; L.cam.zoom = 420; L.cam.zoomT = 0;
          s.track[d.id].hit = hit; delete s.track[d.id].shift;
          const P = A.trail(d), at = P[Math.max(0, Math.min(P.length - 1, hit))];
          s.loc.lon = at.lon; s.loc.lat = at.lat; const pp = A.position(d); window.__cam = [(at.lon + pp.lon) / 2, (at.lat + pp.lat) / 2];
        }, hit);
        for (let w = 0; w < 8; w++) { await page.evaluate(() => { const L = G.Scenes.land.runtime(); L.cam.lon = window.__cam[0]; L.cam.lat = window.__cam[1]; }); await page.waitForTimeout(200); }
        await page.screenshot({ path: path.join(OUT,'animal-follow-'+(hit+1)+'.png') });
      }
    }
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    if (fail) { console.log('실패 ' + fail); process.exitCode = 1; } else console.log('통과');
  } catch (e) { console.error('실패:', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
