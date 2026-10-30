/* 휴양지 섬 40곳 (2026-10-30) — js/data/resortdisc.js · resortdisc_fam.js · 발견의 여파 「휴양」
   · 40곳 모두 자연 발견물 (새로 38곳 + 몰디브(지리 → 자연) · 갈라파고스), 제주도 포함
   · 모두 배로 찾는다 — 배가 닿을 수 있는 바다 칸이 반경 안에 있다 (섬 한가운데만 찍어 못 찾는 곳이 없게)
   · 새 38곳: 단서 이름 12자 안 · 특기별 관찰 3개 · 가족의 한마디 4줄
   · 휴양: 찾으면 피로 −25 · 규율 +8, 여파 이름 「휴양」 — 감동(자연 기본)보다 크다
   · 그 자리 가까이 배를 대면 찾는다 (D.checkSea) · 콘솔 오류 0
   node tests/resort_islands_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, D = G.Disc, out = {};
      const ids = G.RESORTS, all = ids.map(id => G.DISC[id]).filter(Boolean), fresh = all.filter(d => d.added === 'regional' && d.resort && ids.indexOf(d.id) >= 0 && d.id !== 'galapagos' && d.id !== 'maldives');
      out.n = all.length; out.uniq = new Set(ids).size; out.miss = ids.filter(id => !G.DISC[id]);
      out.names = all.map(d => d.realName || d.name);
      out.nature = all.filter(d => d.cat === 'nature').length;
      out.rest = all.filter(d => D.impactKind(d) === 'rest').length;
      out.sea = all.filter(d => d.how === 'sea').length;
      out.fresh = fresh.length;
      out.facts = fresh.filter(d => (G.DISC_FACTS[d.id] || []).length !== 3 || G.DISC_FACTS[d.id].some(f => f.length !== 3)).map(d => d.id);
      out.clues = fresh.filter(d => !G.DISC_NAMES[d.id] || G.DISC_NAMES[d.id].clue.length > 12).map(d => d.id);
      out.fam = all.filter(d => (G.DISC_FAM[d.id] || []).length < 4).map(d => d.id);
      // 배가 닿는 바다 칸이 반경 안에
      out.unreach = all.filter(d => { const p = G.Nav.nearestSea(d.lon, d.lat, 30); return !p || G.Geo.dist(p[0], p[1], d.lon, d.lat) >= d.r * 0.95; }).map(d => d.id + '(' + d.r + ')');
      // 다른 발견물과 같은 자리에 겹치지 않는다 (0.15° 안)
      out.overlap = all.filter(d => G.DISCOVERIES.some(o => o !== d && o.how === 'sea' && G.Geo.dist(o.lon, o.lat, d.lon, d.lat) < 0.15)).map(d => d.id);
      // 제주도
      const jj = G.DISC.jeju; out.jeju = jj && { name: jj.realName || jj.name, cat: jj.cat, far: G.Geo.dist(jj.lon, jj.lat, G.DISC.seongsan.lon, G.DISC.seongsan.lat) };
      // 휴양의 여파
      s.fleet.fatigue = 60; s.fleet.discipline = 50;
      const im = D.applyImpact(G.DISC.jeju);
      out.impact = { key: im.key, name: im.name, fatigue: im.fatigue, discipline: im.discipline, after: [s.fleet.fatigue, s.fleet.discipline] };
      s.fleet.fatigue = 60; s.fleet.discipline = 50; delete s.disc.akrotiri;
      const aw = G.BALANCE.discoveryImpact.awe; out.awe = aw;
      // 배를 대면 찾는다 — 몰타 앞바다 (단서가 있으면 그날 꼭 본다)
      s.hints.malta = { src: 'lib', d: 0 }; s.date = { y: 1500, m: 6, d: 1 };
      const mt = G.DISC.malta, p = G.Nav.nearestSea(mt.lon, mt.lat, 30);
      const hits = D.checkSea(p[0], p[1], { search: true }) || [];
      out.findMalta = (Array.isArray(hits) ? hits : hits.hits || [hits]).some(h => h && h.id === 'malta');
      // 갈라파고스는 여전히 1630년부터
      s.date = { y: 1600, m: 1, d: 1 }; out.galOpen1600 = D.opened(G.DISC.galapagos);
      s.date = { y: 1631, m: 1, d: 1 }; out.galOpen1631 = D.opened(G.DISC.galapagos);
      return out;
    });
    console.log('   ' + r.names.join(' · '));
    ok(r.n === 40 && r.uniq === 40 && !r.miss.length, '휴양지 섬 40곳 ' + r.miss.join(','));
    ok(r.nature === 40 && r.rest === 40 && r.sea === 40, '모두 자연 발견물 · 여파 「휴양」 · 배로 찾는다 (자연 ' + r.nature + ' · 휴양 ' + r.rest + ' · 바다 ' + r.sea + ')');
    ok(r.fresh === 38 && !r.facts.length && !r.clues.length && !r.fam.length, '새 38곳: 관찰 3개 · 단서 이름 12자 안 · 가족의 한마디 4줄 ' + [r.facts, r.clues, r.fam].map(x => x.join(',')).join(' / '));
    ok(!r.unreach.length, '반경 안에 배가 닿는 바다 칸이 있다 ' + r.unreach.join(','));
    ok(!r.overlap.length, '다른 바다 발견물과 같은 자리에 겹치지 않는다 ' + r.overlap.join(','));
    ok(r.jeju && r.jeju.name === '제주도' && r.jeju.cat === 'nature' && r.jeju.far > 0.5, '제주도: 서쪽 바닷가 — 성산일출봉과 ' + (r.jeju && r.jeju.far.toFixed(2)) + '° 떨어져 따로 찾는다');
    ok(r.impact.key === 'rest' && r.impact.name === '휴양' && r.impact.fatigue === -25 && r.impact.discipline === 8 && -r.impact.fatigue > -r.awe.fatigue && r.impact.discipline > r.awe.discipline, '여파 「휴양」: 피로 ' + r.impact.fatigue + ' · 규율 +' + r.impact.discipline + ' (감동 ' + r.awe.fatigue + '/+' + r.awe.discipline + '보다 크다) → ' + r.impact.after.join('/'));
    ok(r.findMalta, '몰타 앞바다에 배를 대면 찾는다');
    ok(!r.galOpen1600 && r.galOpen1631, '갈라파고스는 그대로 1630년부터');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 2).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
