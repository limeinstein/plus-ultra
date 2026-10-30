/* 아메리카 대륙의 발견물 1630 (2026-10-28) — js/data/amer1630.js
   · 60곳(자연 15 · 동물 17 · 식물 10 · 유적·건물 18, 멕시코 땅 제외) — 1630년 전에는 단서도 발견도 없다
   · 1630년 뒤 세운 식민지 건물은 세운 해까지 신기루 · 대학 10곳은 1650년부터 언제나 신기루로 본 발견
   · 대학을 보면 부하 한 사람이 「나 같은 사람들도 배울 수 있는 학교라니…」 같은 바람을 말한다
   node tests/amer1630_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, D = G.Disc, out = {};
      const ids = G.AMER1630, all = ids.map(id => G.DISC[id]), unis = G.AMER_UNIS.map(id => G.DISC[id]);
      const main = all.filter(d => !d.alwaysMirage);
      out.n = all.length; out.miss = ids.filter(id => !G.DISC[id]);
      out.cats = { nature: main.filter(d => d.cat === 'nature').length, animal: main.filter(d => d.cat === 'creature' && !d.plant).length, plant: main.filter(d => G.Court.isPlant(d)).length, ruin: main.filter(d => d.cat === 'ruin').length };
      out.unis = unis.map(d => d.realName || d.name);
      out.reg = all.every(d => d.reg === 10);
      out.facts = all.every(d => (G.DISC_FACTS[d.id] || []).length === 2);
      out.clues = all.filter(d => !G.DISC_NAMES[d.id] || G.DISC_NAMES[d.id].clue.length > 12).map(d => d.id);
      // 1629년: 아무것도 없다 · 1630년: 단서가 돈다
      s.date = { y: 1629, m: 6, d: 1 };
      out.before = main.filter(d => G.Disc.available(d) || D.built(d)).map(d => d.id);
      const y = all.find(d => d.id === 'yosemite');
      s.hints.yosemite = { src: 'lib', d: 0 };
      out.findBefore = D.checkLand(y.lon, y.lat, { search: true }).hits.some(h => h.id === 'yosemite');
      s.date = { y: 1630, m: 6, d: 1 };
      out.after = main.filter(d => !d.built || d.built <= 1630).filter(d => !D.opened(d) || !D.built(d)).map(d => d.id);   // 단서가 실제로 도는지는 개척 단계(누에바 에스파냐·페루…)에 달렸다
      out.findAfter = D.checkLand(y.lon, y.lat, { search: true }).hits.some(h => h.id === 'yosemite');
      // 식민지 건물: 세운 해까지 신기루
      const fe = G.DISC.sanfelipe;
      s.date = { y: 1640, m: 1, d: 1 }; out.feMirage = G.Mirage.active(fe) && !D.built(fe);
      s.date = { y: 1660, m: 1, d: 1 }; out.feReal = D.built(fe) && !G.Mirage.active(fe) && !D.isMirageFind(fe);
      // 대학: 1650년부터 · 언제나 신기루로 본 발견
      const hv = G.DISC.harvard, st = G.DISC.stanford;
      s.date = { y: 1649, m: 12, d: 1 }; out.uniBefore = unis.some(d => G.Disc.available(d) || D.built(d) || G.Mirage.active(d));
      s.date = { y: 1650, m: 1, d: 1 }; out.uniAt = unis.every(d => G.Disc.available(d) && D.built(d) && D.isMirageFind(d));
      s.date = { y: 1720, m: 1, d: 1 }; out.harvardLater = D.isMirageFind(hv) && D.isMirageFind(st);
      // 부하의 바람 — 배운 것이 가장 적은 부하가 말한다
      s.mates = [{ id: 'rocco', role: 'first', loyal: 80 }];
      const scholar = G.MATES.find(d => d.sk && (d.sk.hist || 0) >= 2 && !d.eventOnly);
      if (scholar) s.mates.push({ id: scholar.id, role: 'none', loyal: 80 });
      const U = G.U, pf = U.pickFresh; U.pickFresh = (k, arr) => /wish/.test(k) ? arr[0] : pf(k, arr);
      const w = G.DiscVoice.wish(hv);
      U.pickFresh = pf;
      out.wish = w && { who: w.m.id, text: w.text, scholar: scholar && scholar.id };
      out.noWish = G.DiscVoice.wish(G.DISC.yosemite);
      // 장면 그림이 없는 발견물도 관찰·바람을 말한다
      const said = []; const say = G.UI.say; G.UI.say = async (t, o) => { said.push((o && o.name || '') + ': ' + t); };
      G.MATES.filter(d => d.sk && d.sk.sci && !d.eventOnly).slice(0, 1).forEach(d => s.mates.push({ id: d.id, role: 'none', loyal: 80 }));
      out.hasReveal = G.Scenes.hasReveal(hv);
      out.voices = await G.Scenes.discoveryVoices(hv);
      out.said = said;
      G.UI.say = say;
      return out;
    });
    console.log('   ' + JSON.stringify({ cats: r.cats, unis: r.unis.length }));
    ok(r.n === 70 && !r.miss.length, '발견물 70곳이 들어 있다 (60 + 대학 10)');
    ok(r.cats.nature === 15 && r.cats.animal === 17 && r.cats.plant === 10 && r.cats.ruin === 18, '자연 15 · 동물 17 · 식물 10 · 유적·건물 18 ' + JSON.stringify(r.cats));
    ok(r.reg && r.facts && !r.clues.length, '모두 아메리카 지역 · 관찰 2개씩 · 단서 이름 12자 안 ' + r.clues.join(','));
    ok(!r.before.length && !r.findBefore, '1629년에는 소문도 없고 그 자리에 가도 찾을 수 없다 ' + r.before.slice(0, 5).join(','));
    ok(!r.after.length && r.findAfter, '1630년부터 드러나고 그 자리에서 찾는다 (요세미티) ' + r.after.slice(0, 5).join(','));
    ok(r.feMirage && r.feReal, '카르타헤나 산펠리페 요새: 세운 해(1657) 전에는 신기루, 그 뒤에는 여느 발견물');
    ok(!r.uniBefore && r.uniAt && r.harvardLater, '대학 10곳은 1650년부터 · 하버드(1636)도 스탠퍼드(1885)도 언제나 신기루로 본 발견');
    ok(r.wish && /배울 수 있는 학교라니/.test(r.wish.text) && !/\{나\}/.test(r.wish.text) && r.wish.who !== r.wish.scholar && r.noWish === null, '대학을 보면 배운 것이 적은 부하가 바람을 말한다: 「' + (r.wish && r.wish.text) + '」');
    ok(r.voices >= 2 && r.said.some(t => /학교|배우|배울|공부|책/.test(t)), '발견 카드 뒤 부하들의 관찰·바람 (장면 그림이 생긴 뒤에도 — ' + r.voices + '마디)\n      ' + r.said.join('\n      '));
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 2).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
