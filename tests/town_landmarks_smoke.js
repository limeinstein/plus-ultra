/* 도시 건축 발견물(볼거리)이 거리 건물과 어울리게 서는지 점검:
   건물 줄 사이 광장 한 칸에 건물과 같은 깊이로 선다 — 어떤 건물과도 겹치지 않고(가리지 않고), 바닥선은 길 위(하늘에 뜨지 않게),
   거리 건물보다 작아 보이지 않으며, 이름표가 있고, 앞에 서면 「↑ 살펴보기」, 누르면(아직 찾지 않았으면) 발견으로 이어진다.
   node tests/town_landmarks_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'town_landmark_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const CITIES = [112, 33, 14, 7, 145];   // 이스탄불·로마·파리·세비야·델리

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm', { timeout: 30000 });
    await page.fill('#nm', '이강희');   // 시험 캐릭터 — 엔터로 바로 시작
    await page.evaluate(() => { G.Scenes.city.prologue = async function () { G.Game.state.flags.prologue = true; }; });
    await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.player, null, { timeout: 90000 });
    await page.waitForTimeout(1200);
    let total = 0;
    for (const cid of CITIES) {
      await page.evaluate((cid) => { const s = G.Game.state, c = G.CITY_DATA[cid]; s.date = { y: 1700, m: 5, d: 1 }; s.loc = { mode: 'city', city: cid, lon: c.lon, lat: c.lat }; document.querySelectorAll('.modal-back,.dlg').forEach(w => w.remove()); G.Game.go('city', { cityId: cid }); }, cid);
      await page.waitForFunction(() => G.Town.active() && G.Town.runtime() && G.Town.runtime().marks, null, { timeout: 30000 });
      await page.waitForTimeout(2500);
      const r = await page.evaluate(() => {
        const st = G.Town.runtime(), out = { city: st.city.name, marks: [], overlap: [], floating: [], small: [], noName: [] };
        const hMin = Math.min.apply(null, st.items.map(it => it.h));
        st.marks.forEach(m => {
          out.marks.push(m.id);
          const a = m.x, b = m.x + m.cv.width;
          st.items.forEach(it => { if (it.x < b && it.x + it.w > a) out.overlap.push(m.id + '×' + it.kind); });
          if (Math.abs(m.y - 768) > 20) out.floating.push(m.id + '@' + m.y);
          if (m.d && m.cv.height < Math.min(hMin, 300) && m.cv.width < 800)   // 로마의 기둥 같은 작은 옛 자취는 빼고 — 건축 발견물만 out.small.push(m.id + ' ' + m.cv.width + '×' + m.cv.height);
          if (!m.name) out.noName.push(m.id);
        });
        return out;
      });
      total += r.marks.length;
      console.log('    ' + r.city + ': ' + r.marks.join(', '));
      ok(!r.overlap.length, r.city + ' — 볼거리가 어떤 건물에도 가리지 않는다 (' + r.overlap.join(', ') + ')');
      ok(!r.floating.length, r.city + ' — 볼거리 바닥선이 길 위 (' + r.floating.join(', ') + ')');
      ok(!r.small.length, r.city + ' — 거리 건물보다 작아 보이지 않는다 (' + r.small.join(', ') + ')');
      ok(!r.noName.length, r.city + ' — 볼거리마다 이름표 (' + r.noName.join(', ') + ')');
      // 앞에 서면 「살펴보기」, 누르면 발견으로
      if (r.marks.length) {
        const n = await page.evaluate(() => {
          const st = G.Town.runtime(), m = st.marks.filter(x => x.d && G.Disc.isBuilding(x.d))[0] || st.marks[0];
          st.hero.x = m.x + m.cv.width / 2; st.hero.to = null; G.Town.update(1 / 30);
          let picked = null; const keep = st.onPick; st.onPick = (k, a) => { picked = [k, a]; };
          const insp = G.Town.inspect; G.Town.inspect = async () => { picked = ['inspect', m.id]; };
          G.Town.lookMark(m);
          st.onPick = keep; G.Town.inspect = insp;
          st.cam = st.camTo = Math.max(0, Math.min(st.streetW - 1600, m.x + m.cv.width / 2 - 800)); st.dirty = true; G.Town.redraw(); G.Town.update(1 / 30);
          return { near: st.near === m, picked, id: m.id, building: !!(m.d && G.Disc.isBuilding(m.d) && !G.Disc.foundByMe(m.id)) };
        });
        ok(n.near, r.city + ' — 「' + n.id + '」 앞에 서면 「↑ 살펴보기」');
        ok(n.picked && (n.building ? n.picked[0] === 'landmark' && n.picked[1] === n.id : n.picked[0] === 'inspect'), r.city + ' — 누르면 ' + (n.building ? '발견(city.lookAt)으로' : '설명을 본다'));
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, cid + '_' + n.id + '.png') });
      }
    }
    ok(total >= 12, '볼거리 ' + total + '곳 점검');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join('\n'));
    console.log('OK');
  } catch (e) {
    console.error('FAIL:', e.message); process.exitCode = 1;
    await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {});
  } finally { await browser.close(); }
})();
