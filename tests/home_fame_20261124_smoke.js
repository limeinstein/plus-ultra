/* 고향 문화권에 따른 발견 명성 (2026-11-24 사용자 요청)
   처음 국적이 유럽(오스만 포함)이냐 동아시아냐에 따라 — 조선 제독에게 카르낙 거석군·로마 유적은 명성이 높고 불국사는 낮다, 유럽 제독은 거꾸로.
   G.BALANCE.homeFame · G.Disc.homeSphere / homeK · s.originNation
   node tests/home_fame_20261124_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const s = G.Game.state, D = G.Disc, out = {};
      const ids = ['carnac', 'colosseum', 'bulguksa', 'pyramid'].filter(id => G.DISC[id]);
      function look() { const o = { sphere: D.homeSphere() }; ids.forEach(id => { o[id] = { k: D.homeK(G.DISC[id]), fame: D.fameFor(G.DISC[id]) }; }); return o; }
      out.origin = s.originNation;
      out.pt = look();
      const keep = s.originNation;
      s.originNation = 'KR'; out.kr = look();
      s.originNation = 'OT'; out.ot = look();
      delete s.originNation; s.player.nation = 'KR'; out.oldKr = look();   // 옛 저장: 지금 국적으로
      s.player.nation = 'XX'; out.unknown = look();                        // 표에 없는 국적: 고향 도시(리스본)의 지역으로
      s.player.nation = 'PT'; s.originNation = keep;
      const bio = G.DISCOVERIES.find(d => d.cat === 'creature');
      out.bioK = D.homeK(bio);
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.origin === 'PT', '새 게임이 처음 국적을 적어 둔다 (' + r.origin + ')');
    ok(r.pt.sphere === 'eu' && r.kr.sphere === 'ea' && r.ot.sphere === 'eu', '포르투갈·오스만 = 유럽, 조선 = 동아시아');
    ok(r.pt.carnac.k < 1 && r.pt.colosseum.k < 1 && r.pt.bulguksa.k > 1, '유럽 제독: 카르낙·콜로세움 ↓, 불국사 ↑');
    ok(r.kr.carnac.k > 1 && r.kr.colosseum.k > 1 && r.kr.bulguksa.k < 1, '조선 제독: 카르낙·콜로세움 ↑, 불국사 ↓');
    ok(r.kr.carnac.fame > r.pt.carnac.fame && r.kr.bulguksa.fame < r.pt.bulguksa.fame, '명성 값에 실제로 반영 (카르낙 ' + r.pt.carnac.fame + '→' + r.kr.carnac.fame + ', 불국사 ' + r.pt.bulguksa.fame + '→' + r.kr.bulguksa.fame + ')');
    ok(r.oldKr.sphere === 'ea' && r.unknown.sphere === 'eu', '옛 저장은 지금 국적, 모르는 국적은 고향 도시 지역으로');
    ok(r.bioK === 1, '생물은 빼고 (bioK가 거리로 매긴다)');
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
