/* 보고·발표 목록의 증거품 그림 (2026-11-11 피드백) — js/systems/discovery.js D.proofThumbs · harbor.js 발표 · sponsor.js 한 건·일괄 보고
   · 증거품(해도·지도)과 유물을 줄 끝의 작은 그림(30px)으로 보인다 — 증거품이 없는 발견은 그림 없음
   · 마우스를 올리면 떠 있는 카드에 큰 그림 · 이름 · 넘어가는 곳(발표: 해도소/제독 · 보고: 후원자)
   node tests/proof_thumbs_smoke.js  (스크린샷: tests/_out/proof_*.png) */
'use strict';
const path = require('path'), fs = require('fs'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async () => {
  const out = path.join(__dirname, '_out'); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    const setup = await page.evaluate(async () => {
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.date = { y: 1520, m: 3, d: 1 }; s.settings.res = 0.35; s.player.fame = 99999;
      const D = G.Disc, R = G.R;
      // 해도 증거품 + 유물이 둘 다 있는 발견 · 증거가 없는 발견
      const both = G.DISCOVERIES.find(d => d.evidence && D.relicsOf(d.id).length);
      const none = G.DISCOVERIES.find(d => !d.evidence && !D.relicsOf(d.id).length);
      [both, none].forEach(d => { s.disc[d.id] = Object.assign(s.disc[d.id] || {}, { me: true, found: 15200301 }); });
      s.player.items.push({ id: 'evidence', kind: 'evidence', evidence: true, name: both.evidence, disc: both.id });
      const rl = D.relicsOf(both.id)[0]; R.addItem(rl.id, { disc: both.id });
      G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 2500));
      document.querySelectorAll('.modal-back button').forEach(b => b.click());
      return { both: both.id, bothName: both.name, ev: both.evidence, relic: rl.name, none: none.id };
    });
    console.log(setup);
    // 1) 항구 발표 목록
    await page.evaluate(() => { window._pa = G.Scenes.city.B.harbor.pickAnnouncements(G.Disc.unreported()); });
    await page.waitForSelector('.proof-th .pt');
    await page.waitForFunction(() => [...document.querySelectorAll('.proof-th img')].every(im => im.complete && im.naturalWidth > 0));
    const a = await page.evaluate(id => {
      const row = document.querySelector('input[data-disc="' + id + '"]').closest('label');
      const imgs = [...row.querySelectorAll('.proof-th .pt')];
      return { n: imgs.length, names: imgs.map(i => i.dataset.pvName), fates: imgs.map(i => i.dataset.pvFate), loaded: imgs.map(i => i.tagName === 'IMG' && i.complete && i.naturalWidth > 0), h: Math.max(...imgs.map(i => i.getBoundingClientRect().height)),
        noneThumbs: document.querySelectorAll('.choice[data-ck]').length };
    }, setup.both);
    const noneRow = await page.evaluate(id => document.querySelector('input[data-disc="' + id + '"]').closest('label').querySelectorAll('.proof-th').length, setup.none);
    const box = await page.evaluate(id => { const r = document.querySelector('input[data-disc="' + id + '"]').closest('label').querySelector('.proof-th .pt').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, setup.both);
    await page.mouse.move(box.x, box.y); await page.waitForTimeout(200);
    const peek = await page.evaluate(() => { const c = document.querySelector('.proof-peek'), r = c.getBoundingClientRect(); const over = [...document.querySelectorAll('.proof-th .pt')].some(t => { const q = t.getBoundingClientRect(); return !(q.right <= r.left || q.left >= r.right || q.bottom <= r.top || q.top >= r.bottom); }); return c && { shown: getComputedStyle(c).display !== 'none', text: c.innerText, img: !!c.querySelector('img'), over }; });
    await page.screenshot({ path: path.join(out, 'proof_announce.png') });
    await page.mouse.move(5, 5); await page.waitForTimeout(100);
    const hidden = await page.evaluate(() => getComputedStyle(document.querySelector('.proof-peek')).display === 'none');
    await page.keyboard.press('Escape'); await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(m => m.remove()));
    // 2) 후원자 일괄 보고 표
    const sp = await page.evaluate(() => { const sp = Object.values(G.SPONSOR).find(x => x.pw >= 3) || Object.values(G.SPONSOR)[0]; window._bp = G.Sponsor.batchReport(sp); return sp.id; });
    await page.waitForTimeout(800);
    const b = await page.evaluate(() => { const imgs = [...document.querySelectorAll('.tbl .proof-th .pt')]; return { n: imgs.length, fates: imgs.map(i => i.dataset.pvFate) }; });
    await page.screenshot({ path: path.join(out, 'proof_batch.png') });
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(m => m.remove()));
    // 3) 후원자 한 건 보고 목록 (제안 선택): 글귀만 확인
    const c = await page.evaluate(async (id) => {
      const D = G.Disc; return D.proofThumbs(id, 'report');
    }, setup.both);
    return { setup, a, noneRow, peek, hidden, b, c };
  } catch (e) { throw e; } finally { await browser.close(); }
})().then(r => {
  console.log(JSON.stringify(r, null, 1));
  const { a, noneRow, peek, hidden, b, c, setup } = r;
  ok(a.n === 2 && a.names.some(n => n === setup.ev) && a.names.some(n => n === setup.relic), '발표 목록: 증거품(' + setup.ev + ')과 유물(' + setup.relic + ')을 작은 그림 2개로');
  ok(a.loaded.every(Boolean), '그림이 실제로 그려진다 (코드 그림이나 images/ 파일)');
  ok(a.fates.some(f => /해도소/.test(f)) && a.fates.some(f => /제독이 갖는다/.test(f)), '발표: 해도는 해도소로, 유물은 제독이 갖는다고 알린다');
  ok(noneRow === 0, '증거품 없는 발견은 그림 없음');
  ok(a.h <= 32, '작은 그림 (' + a.h + 'px) — 줄을 크게 늘리지 않는다');
  ok(peek && peek.shown && peek.img && /해도소|제독/.test(peek.text), '마우스를 올리면 큰 그림 카드: ' + (peek && peek.text.replace(/\n/g, ' / ')));
  ok(!peek.over, '카드가 다른 증거품 그림을 가리지 않는다');
  ok(hidden, '마우스를 떼면 카드가 사라진다');
  ok(b.n >= 2 && b.fates.every(f => /후원자에게 넘긴다/.test(f)), '일괄 보고 표에도 그림 — 「보고하면 후원자에게 넘긴다」');
  ok(/proof-th/.test(c) && /후원자/.test(c), '한 건 보고 목록용 그림 줄');
  console.log('\n통과');
}).catch(e => { console.error(e); process.exit(1); });
