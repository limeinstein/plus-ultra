/* 지역별 거리 바닥 회귀 점검:
   - 23개 건물 양식이 모두 알맞은 바닥 양식을 받는가
   - 지역 간 재료·문양이 충분히 다른가
   - 거리를 준비하는 동안 부라우저 오류가 없는가
   node tests/town_ground_smoke.js
   SHOT=1 node tests/town_ground_smoke.js  (점검 그림도 저장) */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) {
      errors.push('console: ' + m.text());
    }
  });

  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const result = await page.evaluate(async () => {
      G.Game.state = { date: { y: 1480, m: 5, d: 1 }, player: { look: 'admiral' }, settings: {} };
      const rows = [], old = {};
      for (let i = 0; i < G.Img.EXTSTYLES.length; i++) {
        const ext = G.Img.EXTSTYLES[i][0], id = 9000 + i;
        old[id] = G.Img.EXT_BY_CITY[id]; G.Img.EXT_BY_CITY[id] = ext;
        const city = { id, name: ext, style: 'ib', port: i % 2, size: 2, nation: '', rel: 'N', flags: '' };
        await G.Town.open(city, []);
        const st = G.Town.runtime(), ctx = st.ground.getContext('2d');
        const data = ctx.getImageData(0, 0, st.ground.width, st.ground.height).data;
        let hash = 2166136261;
        for (let p = 0; p < data.length; p += 997) { hash ^= data[p]; hash = Math.imul(hash, 16777619); }
        rows.push({ ext, style: st.groundStyle, hash: hash >>> 0, url: st.ground.toDataURL('image/png') });
      }
      Object.keys(old).forEach(k => { if (old[k] == null) delete G.Img.EXT_BY_CITY[k]; else G.Img.EXT_BY_CITY[k] = old[k]; });
      return rows;
    });

    ok(result.length === 23, '건물 양식 23개의 바닥을 모두 생성');
    ok(result.every(x => x.style && x.style.id && x.style.material), '모든 바닥에 지역·재료 정보가 있음');
    ok(new Set(result.map(x => x.style.id)).size >= 15, '지역 바닥 15종 이상으로 분류');
    ok(new Set(result.map(x => x.hash)).size >= 18, '색과 문양이 다른 바닥 18종 이상을 확인');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));

    if (process.env.SHOT) {
      const picked = ['iberia', 'italy', 'arabia', 'france', 'eastasia', 'africa', 'volcanic', 'native']
        .map(id => result.find(x => x.style.id === id)).filter(Boolean);
      const atlas = await page.evaluate(async rows => {
        const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900;
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#211b17'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.font = '700 25px serif'; ctx.textBaseline = 'top';
        for (let i = 0; i < rows.length; i++) {
          const x = 24 + (i % 2) * 788, y = 18 + Math.floor(i / 2) * 220;
          const img = new Image(); img.src = rows[i].url; await img.decode();
          ctx.fillStyle = '#e9ddc4'; ctx.fillText(rows[i].style.name + ' · ' + rows[i].style.material, x, y);
          // 바닥 띠는 이음 주기마다 되풀이되므로 늘이지 않고 그대로 이어 깐다(그림 띠는 폭이 218~511px)
          ctx.save(); ctx.beginPath(); ctx.rect(x, y + 36, 760, 164); ctx.clip();
          for (let gx = 0; gx < 760; gx += img.width) ctx.drawImage(img, x + gx, y + 36, img.width, 164);
          ctx.restore();
          ctx.strokeStyle = 'rgba(236,211,164,.5)'; ctx.strokeRect(x + .5, y + 36.5, 760, 164);
        }
        return cv.toDataURL('image/png');
      }, picked);
      fs.writeFileSync(path.join(ROOT, 'docs', 'art', 'regional-street-ground-runtime.png'),
        Buffer.from(atlas.split(',')[1], 'base64'));
      console.log('  · docs/art/regional-street-ground-runtime.png 저장');

      const scenes = await page.evaluate(async () => {
        const samples = [
          [0, '이베리아 · 리스본'], [21, '지중해 · 마르세유'], [78, '아랍·북아프리카 · 알렉산드리아'],
          [14, '서·북유럽 · 파리'], [190, '동아시아 · 한양'], [89, '아프리카 내륙 · 아르킨']
        ];
        const buildings = [{ kind: 'trade', name: '교역소', icon: 'scales' }, { kind: 'tavern', name: '술집', icon: 'mug' },
          { kind: 'market', name: '시장', icon: 'sack' }, { kind: 'church', name: '교회·사원', icon: 'church' }, { kind: 'gate', name: '성문', icon: 'gate' }];
        const out = [];
        G.Game.state.player.home = -1;
        G.Game.showLayers(false, false, true);
        for (const sample of samples) {
          const city = G.CITY_DATA[sample[0]];
          await G.Town.open(city, buildings);
          const st = G.Town.runtime();
          st.cam = st.camTo = Math.max(0, (st.streetW - 1600) / 2);
          st.hero.x = st.cam + 800; st.dirty = true;
          G.Town.update(0);
          out.push({ label: sample[1], url: G.Game.canvases().scene.toDataURL('image/jpeg', .88) });
        }
        return out;
      });
      const sceneAtlas = await page.evaluate(async rows => {
        const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900;
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#171310'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.font = '700 22px serif'; ctx.textBaseline = 'top';
        for (let i = 0; i < rows.length; i++) {
          const x = 20 + (i % 2) * 790, y = 14 + Math.floor(i / 2) * 294;
          const img = new Image(); img.src = rows[i].url; await img.decode();
          ctx.drawImage(img, x, y + 30, 770, 246);
          ctx.fillStyle = 'rgba(24,18,13,.82)'; ctx.fillRect(x, y + 30, 770, 34);
          ctx.fillStyle = '#f0dfbf'; ctx.fillText(rows[i].label, x + 12, y + 36);
          ctx.strokeStyle = 'rgba(236,211,164,.5)'; ctx.strokeRect(x + .5, y + 30.5, 770, 246);
        }
        return cv.toDataURL('image/jpeg', .9);
      }, scenes);
      fs.writeFileSync(path.join(ROOT, 'docs', 'art', 'regional-street-ground-in-game.jpg'),
        Buffer.from(sceneAtlas.split(',')[1], 'base64'));
      console.log('  · docs/art/regional-street-ground-in-game.jpg 저장');
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
