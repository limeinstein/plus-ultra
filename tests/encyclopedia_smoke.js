/* 발견물 백과사전 (2026-10-26) — js/systems/encyclopedia.js · 자택 메뉴 (js/city/misc.js)
   · 자택 메뉴에 「발견물 백과사전」 (수록 수) · 찾은 발견물만 실린다 · 갈래 탭: 찾은 수/전체 수 · 이름으로 찾기
   · 한 항목: 그림 · 이름(옛 이름) · 갈래 · 지역 · 찾은 날 · 보고 상태 · 손에 넣은 유물 · 설명 · 동료들의 특기별 관찰
   · 아이와 함께 읽는다: 사이 +3 (지력·그 갈래 특기 가끔) · 30일에 한 번
   · 한 갈래를 다 채우면 왕립 학회 포상(명성·금화) — 한 번만 · 발견(D.find)이 부른다 · 콘솔 오류 0
   node tests/encyclopedia_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    ok(/G\.Encyc\.onFind\(d\)/.test(fs.readFileSync(path.join(ROOT, 'js/systems/discovery.js'), 'utf8')), '발견(D.find)이 백과사전의 갈래 완성을 확인한다');
    const a = await page.evaluate(() => {
      const EN = G.Encyc, out = {};
      out.totals = EN.CATS.map(k => k + ':' + EN.total(k));
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '페르난두', nation: 'PT', job: 'explorer', age: 40, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true; s.date = { y: 1540, m: 5, d: 1 }; s.settings.res = 0.5;
      const pick = (cat, n) => G.DISCOVERIES.filter(d => d.cat === cat && !d.tale && G.DISC_FACTS && G.DISC_FACTS[d.id]).slice(0, n);
      const list = [].concat(pick('ruin', 3), pick('creature', 3), pick('geo', 2), pick('nature', 2), pick('treasure', 1), pick('people', 1), pick('trade', 1));
      list.forEach((d, i) => { s.disc[d.id] = { me: true, found: 15300101 + i * 100, evidence: true }; });
      const ang = G.DISC.angkor ? 'angkor' : list[0].id;
      s.disc[ang] = { me: true, found: 15320314, reported: true, relics: (G.RELICS[ang] || []).map(r => r.id) };
      s.encyc = { done: {}, last: ang };
      out.found = G.Encyc.found().length;
      out.ang = ang;
      // 아내와 아홉 살 딸이 집에 있다
      s.player.wife = 'm_lis'; s.player.kids = [{ name: '이네스', sex: 'f', born: { y: 1531, m: 2, d: 2 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, bond: 50 }];
      return out;
    });
    console.log('   갈래 전체 수: ' + a.totals.join(' · '));
    await page.evaluate(() => { const s = G.Game.state; s.loc = { mode: 'city', city: s.player.home, lon: 0, lat: 0 }; G.Game.go('city', { cityId: s.player.home }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 20 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
    const menu = await page.evaluate(() => { const it = G.Scenes.city.B.home.menu(G.CITY_DATA[G.Game.state.player.home]).filter(Boolean).filter(x => /백과사전/.test(x.label))[0]; return it ? it.label + ' — ' + it.sub : null; });
    ok(menu && /14종 수록/.test(menu), '자택 메뉴: ' + menu);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); window.__enc = G.Encyc.open(G.CITY_DATA[G.Game.state.player.home]); });
    await page.waitForSelector('.en-row', { timeout: 10000 });
    await page.waitForTimeout(1200);
    const v = await page.evaluate(() => ({
      rows: document.querySelectorAll('.en-row').length, tabs: Array.from(document.querySelectorAll('.en-tab')).map(b => b.textContent.replace(/\s+/g, ' ').trim()),
      name: (document.querySelector('.en-name') || {}).textContent, meta: (document.querySelector('.en-meta') || {}).textContent,
      facts: document.querySelectorAll('.en-facts li').length, img: !!document.querySelector('.en-pic img'), kid: (document.querySelector('.en-kid') || {}).textContent }));
    console.log('   ' + JSON.stringify(v));
    await page.screenshot({ path: path.join(OUT, 'encyclopedia.png') });
    ok(v.rows === 14 && v.tabs.length === 8 && /유적 \d+\/\d+/.test(v.tabs.join('|')), '찾은 14종만 실림 · 갈래 탭 「' + v.tabs.join(' / ') + '」');
    ok(v.name && /보고함/.test(v.meta) && v.facts >= 3 && v.img, '항목: 「' + v.name.trim() + '」 ' + v.meta.trim() + ' · 관찰 ' + v.facts + '개 · 그림');
    // 갈래 탭 · 찾기
    await page.evaluate(() => Array.from(document.querySelectorAll('.en-tab')).filter(b => b.getAttribute('data-cat') === 'creature')[0].click());
    const cr = await page.evaluate(() => document.querySelectorAll('.en-row').length);
    await page.fill('.en-q', '없는이름'); await page.waitForTimeout(200);
    const none = await page.evaluate(() => document.querySelectorAll('.en-row').length);
    await page.fill('.en-q', ''); await page.waitForTimeout(200);
    ok(cr === 3 && none === 0, '「생물」 탭 3종 · 이름으로 찾기');
    // 아이와 함께 읽는다
    ok(v.kid && /이네스와 함께 읽는다/.test(v.kid), '아이와 함께 읽기 단추: ' + v.kid.trim());
    const b0 = await page.evaluate(() => G.Game.state.player.kids[0].bond);
    await page.evaluate(() => document.querySelector('.en-kid').click());
    for (let i = 0; i < 20; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => !!document.querySelector('.en-row'))) break; await page.keyboard.press('Enter'); }
    await page.waitForSelector('.en-row', { timeout: 10000 });
    const k = await page.evaluate(() => { const k = G.Game.state.player.kids[0], b = document.querySelector('.en-kid'); return { bond: k.bond, edu: k.edu.encyc != null, dis: b && b.disabled, txt: b && b.textContent }; });
    ok(k.bond === b0 + 3 && k.edu && k.dis, '함께 읽은 뒤: 사이 ' + b0 + '→' + k.bond + ' · 「' + (k.txt || '').trim() + '」');
    await page.evaluate(() => Array.from(document.querySelectorAll('.win .foot button')).filter(b => /덮는다/.test(b.textContent))[0].click());
    await page.waitForTimeout(300);
    // 갈래 완성
    const c = await page.evaluate(() => {
      const EN = G.Encyc, s = G.Game.state, sizes = EN.CATS.map(k => [k, EN.total(k)]).sort((x, y) => x[1] - y[1]), cat = sizes[0][0];
      const ds = G.DISCOVERIES.filter(d => d.cat === cat && !d.tale);
      ds.slice(0, -1).forEach(d => { s.disc[d.id] = { me: true, found: 15400101 }; });
      const g0 = s.player.gold, before = EN.onFind(ds[0]);
      s.disc[ds[ds.length - 1].id] = { me: true, found: 15400102 };
      const r1 = EN.onFind(ds[ds.length - 1]), g1 = s.player.gold, r2 = EN.onFind(ds[0]);
      return { cat, n: ds.length, before, r1, gold: g1 - g0, r2, done: s.encyc.done[cat], tab: EN.complete(cat) };
    });
    console.log('   ' + JSON.stringify(c));
    ok(!c.before && c.r1 && c.gold > 0 && c.r1.fame > 0 && !c.r2 && c.done === 1540, '「' + c.cat + '」 ' + c.n + '종을 다 채우자 왕립 학회 포상 (금화 +' + c.gold + ' · 명성 +' + c.r1.fame + ') — 한 번만');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
