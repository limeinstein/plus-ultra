/* 발견물 단서 이름 — 「너무 모호해」 · 대항해시대 3처럼 단서와 발견물 이름이 같은 것도 (2026-10-23)
   · 같은 것(약 3할): 찾기 전에도 진짜 이름이 보인다 (d.clue 없음)
   · 다른 것: 단서 이름이 보이고, 찾으면 진짜 이름으로 바뀐다 · 이름 붙이기 대상(곶·해협·항로·대륙)은 늘 단서가 따로
   node tests/cluename_smoke.js   (스크린샷: OUT 또는 임시 폴더/cluename_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'cluename_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, D = G.DISCOVERIES, N = G.DISC_NAMES, out = {};
      out.n = D.length;
      out.noEntry = D.filter(d => !N[d.id] || !N[d.id].clue).map(d => d.id);
      const same = D.filter(d => !d.clue), diff = D.filter(d => d.clue);
      out.same = same.length; out.diff = diff.length;
      out.sameOk = same.every(d => N[d.id].clue === d.name && !G.discKnown(d));
      out.diffBad = diff.filter(d => !(d.name === d.clue && d.clue !== d.realName)).map(d => d.id + ":" + d.name + "|" + d.clue + "|" + G.discKnown(d)); out.diffOk = !out.diffBad.length;
      out.long = D.filter(d => d.clue).map(d => d.clue).filter(c => c.length > 12);
      out.avg = Math.round(D.filter(d => d.clue).reduce((a, d) => a + d.clue.length, 0) / D.filter(d => d.clue).length * 10) / 10;
      const seen = {}; out.dup = D.map(d => N[d.id].clue).filter(c => (seen[c] = (seen[c] || 0) + 1) === 2);
      out.nameable = Object.keys(G.NAMEABLE).filter(id => G.DISC[id] && !G.DISC[id].clue);
      const nm = id => G.DISC[id].name;
      out.famous = ['giza', 'colosseum', 'greatwall', 'tajmahal', 'tiger', 't_pepper', 'kraken', 'machupicchu'].map(nm);
      out.concrete = ['pamukkale', 'drepung', 'teotihuacan', 'belemmonstrance', 'maehwa'].map(nm);
      // 찾으면 진짜 이름
      s.disc.pamukkale = { found: true, me: true, day: s.day };
      out.found = nm('pamukkale');
      delete s.disc.pamukkale;
      // 수첩 「단서」 — 같은 것과 다른 것이 섞여 보인다
      ['giza', 'pamukkale', 'tiger', 'drepung', 'colosseum', 'teotihuacan', 't_pepper', 'belemmonstrance', 'machupicchu', 'maehwa'].forEach(id => { s.hints[id] = s.hints[id] || { src: ['lib'], day: s.day }; });
      G.Info.open('hints');
      await new Promise(res => setTimeout(res, 600));
      out.page = (document.querySelector('.modal-back:last-child .win') || document.body).innerText;
      return out;
    });
    await page.screenshot({ path: path.join(OUT, 'cluename_hints.png') });
    ok(r.n > 900 && !r.noEntry.length, '발견물 ' + r.n + '종 모두 단서 이름이 정해져 있다');
    ok(r.same >= r.n * 0.2 && r.same <= r.n * 0.45, '단서와 이름이 같은 것 ' + r.same + '종 (' + Math.round(r.same / r.n * 100) + '%)');
    ok(r.sameOk, '같은 것은 찾기 전에도 진짜 이름으로 보인다');
    ok(r.diffOk, '다른 것은 찾기 전에 단서 이름으로 보인다 (' + r.diff + '종)' + (r.diffOk ? '' : ' ' + r.diffBad.join(' ; ')));
    ok(!r.long.length && !r.dup.length, '따로 지은 단서는 12자 안 (평균 ' + r.avg + '자) · 겹치지 않는다' + (r.long.length ? ' ' + r.long.join(',') : '') + (r.dup.length ? ' 겹침: ' + r.dup.join(',') : ''));
    ok(!r.nameable.length, '이름 붙이기 대상(곶·해협·항로·대륙)은 단서가 따로 있다');
    ok(r.famous.join() === '기자의 3대 피라미드,콜로세움,만리장성,타지마할,호랑이,후추,크라켄,마추픽추', '이름난 것은 그대로: ' + r.famous.join(' · '));
    ok(r.concrete.join() === '흰 온천 계단,라사의 큰 절,멕시코 피라미드,인도 황금 성물,서호의 매화', '짧고 무엇인지 보이는 단서: ' + r.concrete.join(' · '));
    ok(r.found === '파묵칼레', '찾으면 진짜 이름 「파묵칼레」');
    ok(/기자의 3대 피라미드/.test(r.page) && /흰 온천 계단/.test(r.page), '수첩 단서 목록에 두 가지가 섞여 보인다');
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ': ' + errors.join(' / ') : ''));
    console.log('스크린샷: ' + OUT);
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
