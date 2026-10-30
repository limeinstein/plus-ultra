/* 세계의 나비와 딱정벌레 30 (js/data/insects.js) — node tests/insects_smoke.js
   · 사용자가 꼭 넣어 달라던 8종 · 유럽보다 아프리카·아시아·아메리카에 비중 · 단서·관찰·가족 한마디 · 실제로 찾아진다 */
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
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, D = G.Disc, ids = G.INSECTS || [], all = ids.map(id => G.DISC[id]), out = {};
      out.n = all.length; out.miss = ids.filter(id => !G.DISC[id]);
      out.names = all.map(d => d.realName || d.name);
      out.reg = { europe: all.filter(d => d.reg <= 2).length, africa: all.filter(d => d.reg === 3 || d.reg === 4).length, asia: all.filter(d => d.reg >= 5 && d.reg <= 9).length, americas: all.filter(d => d.reg === 10).length };
      out.land = all.filter(d => !G.Geo.isLand(d.lon, d.lat)).map(d => d.id);
      out.bad = all.filter(d => (G.DISC_FACTS[d.id] || []).length !== 3 || (G.DISC_FAM[d.id] || []).length !== 4 || !G.DISC_NAMES[d.id] || G.DISC_NAMES[d.id].clue.length > 12).map(d => d.id);
      out.animal = all.every(d => d.cat === 'creature' && d.animal && d.insect);
      out.relics = all.filter(d => (G.RELICS[d.id] || []).length).length;
      out.front = all.filter(d => !Object.keys(G.WONDERS.front).some(f => G.WONDERS.front[f].some(t => t.indexOf(d.id) >= 0))).map(d => d.id);
      // 실제로 그 자리에서 찾아진다 (호랑나비 · 모르포)
      out.find = ['swallowtail', 'morpho', 'sunsetmoth'].map(id => { const d = G.DISC[id]; if (!d) return id + ':없음'; s.hints[id] = { src: 'lib', d: 0 }; const h = D.checkLand(d.lon, d.lat, { search: true }).hits; return id + ':' + (h.some(x => x.id === id) ? 'ok' : (D.opened(d) ? 'opened-miss' : 'closed')); });
      return out;
    });
    console.log('   ' + r.names.join(' · '));
    console.log('   ' + JSON.stringify({ reg: r.reg, relics: r.relics, find: r.find }));
    ok(r.n === 30 && !r.miss.length, '발견물 30');
    const need = ['모르포나비', '에메랄드제비나비', '버드윙나비', '왕오색나비', '호랑나비', '마다가스카르 석양나방', '공작나비', '유리날개나비'];
    const has = n => r.names.some(x => x.replace(/\s/g, '').indexOf(n.replace(/\s/g, '')) >= 0);
    ok(need.every(has), '꼭 넣을 8종: ' + need.filter(n => !has(n)).join(',') + (need.every(has) ? '모두 있음' : ' 없음'));
    ok(r.names.some(n => /헤라클레스/.test(n)), '헤라클레스장수풍뎅이');
    ok(r.reg.europe <= 2 && r.reg.africa >= 5 && r.reg.asia >= 10 && r.reg.americas >= 8, '유럽보다 아프리카·아시아·아메리카 ' + JSON.stringify(r.reg));
    ok(!r.land.length, '모두 뭍 위 ' + r.land.join(','));
    ok(!r.bad.length, '단서 이름 12자 안 · 관찰 3 · 가족 4줄 ' + r.bad.join(','));
    ok(r.animal && r.relics >= 10, '동물 발견(왕립 동물원 기증) · 표본 유물 ' + r.relics);
    ok(!r.front.length, '모두 개척 단계에 들어 있다 (단서가 돈다) ' + r.front.join(','));
    ok(r.find.every(x => /:ok$/.test(x)), '단서가 있으면 그 자리에서 찾는다 ' + r.find.join(' '));
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 2).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
