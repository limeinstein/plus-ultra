/* 왕립 박물관·미술관·동물원 기증 (G.Court.donate — js/systems/court.js · 메뉴 js/city/museum.js) 2026-10-19
   ① 건물이 선 뒤 메뉴에 「기증한다」와 기증할 수 있는 수 ② 박물관: 유물·명작을 골라 기증 → 소지품에서 빠지고 전시에 더해진다
   ③ 미술관: 명작만 ④ 동물원: 새로 찾은 동물 — 옛 저장(해만 있는 동물원)도 ⑤ 한 점마다 사교 명성·군주 신뢰 ⑥ 전시실 머리말 「그 뒤 기증 N점」
   ⑦ 기증할 것이 없으면 메뉴가 흐리고 관장이 일러 준다 ⑧ 저장·불러오기 ⑨ 콘솔 오류 0
   node tests/donate_smoke.js   (OUT=스크린샷 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'donate_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 300 });
    const setup = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '기증 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i < 4 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true; s.settings.res = 0.5; s.date = { y: 1530, m: 5, d: 1 };
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
      G.Court.sync && G.Court.sync();
      const sp = G.SPONSOR.pt_king, city = sp.city, c = s.court || (s.court = {});
      ['titles', 'offers', 'called', 'herald', 'seen', 'wait', 'zoo', 'zooUsed', 'zooAt', 'museum', 'gallery'].forEach(k => { if (!c[k]) c[k] = {}; });
      // 이미 선 건물 (왕명으로 세운 것과 같은 기록)
      c.museum.PT = { city, y: 1520, sp: sp.id, items: [{ id: 'x_old', name: '옛 전시품', desc: '', value: 100 }] };
      c.gallery.PT = { city, y: 1522, sp: sp.id, items: [] };
      c.zoo.PT = 1521;   // 옛 저장: 동물원이 선 해만 — zooAt 없음
      // 소지품: 유물 2 · 명작 2
      const relics = Object.keys(G.RELIC).filter(id => !G.RELIC[id].evidence).slice(0, 2);
      relics.forEach(id => s.player.items.push({ id }));
      const mate = G.MATES.find(m => m.sk && m.sk.art) || G.MATES[0];
      s.player.items.push({ id: 'masterwork', name: '리스본 항구의 아침', desc: '시험용 그림', value: 4000, mw: true, by: mate.id, wk: 'paint', n: 0, y: 1529 });
      s.player.items.push({ id: 'masterwork', name: '항해사의 흉상', desc: '시험용 조각', value: 3000, mw: true, by: mate.id, wk: 'sculpt', n: 1, y: 1529 });
      // 동물: 찾은 신기한 동물 3종 (하나는 이미 동물원에 쓴 것)
      const cr = G.DISCOVERIES.filter(d => d.cat === 'creature' && d.how !== 'city' && !(G.Court.isPlant && G.Court.isPlant(d))).slice(0, 3);
      cr.forEach(d => { s.disc[d.id] = Object.assign(s.disc[d.id] || {}, { me: true, found: s.day + 1, y: 1525 }); });
      c.zooUsed[cr[0].id] = 1;
      s.loc = { mode: 'city', city, lon: G.CITY_DATA[city].lon, lat: G.CITY_DATA[city].lat };
      return { city, relics, cr: cr.map(d => d.id), found: cr.map(d => G.Disc.foundByMe(d.id)) };
    });
    console.log('   ' + JSON.stringify(setup));
    ok(setup.relics.length === 2 && setup.found.every(Boolean), '유물 2점·명작 2점·찾은 동물 3종(하나는 이미 동물원에)');

    await page.evaluate((id) => G.Game.go('city', { cityId: id }), setup.city);
    await page.waitForFunction((id) => G.Game.sceneName === 'city' && G.Game.state.loc.city === id, setup.city, { timeout: 30000 });
    await sleep(1500);
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));

    // ① 메뉴
    const menu = await page.evaluate((cid) => {
      const C = G.Scenes.city, c = G.CITY_DATA[cid];
      const b = G.Court.buildingsAt(cid).map(x => x.kind + ':' + x.realm);
      const m = ['museum', 'gallery', 'zoo'].map(k => C.B[k].menu(c, 'PT').map(x => x.label + '|' + (x.sub || '') + '|' + !!x.dim));
      return { b, m, d: ['museum', 'gallery', 'zoo'].map(k => G.Court.donatable(k).length) };
    }, setup.city);
    console.log('   ' + JSON.stringify(menu));
    ok(menu.b.join() === 'museum:PT,gallery:PT,zoo:PT', '리스본에 왕립 박물관·미술관·동물원');
    ok(/유물·명작을 기증한다\|기증할 수 있는 것 4점\|false/.test(menu.m[0][1]), '박물관 메뉴: 「유물·명작을 기증한다 — 기증할 수 있는 것 4점」');
    ok(/명작을 기증한다\|기증할 수 있는 것 2점/.test(menu.m[1][1]), '미술관 메뉴: 명작 2점');
    ok(/새로 찾은 동물을 기증한다\|기증할 수 있는 것 2종/.test(menu.m[2][1]), '동물원 메뉴: 새 동물 2종 (이미 쓴 1종은 빠짐)');

    // ② 박물관 기증 (실제 창: 고르는 창 캡처 후 유물 하나 → 이어서 그림 하나 → 그만둔다)
    const before = await page.evaluate(() => { const s = G.Game.state; return { so: G.Fame.get ? G.Fame.get('so') : (s.player.fame && s.player.fame.so) || 0, trust: G.Sponsor.rel('pt_king').trust || 0, items: s.player.items.length }; });
    await page.evaluate((cid) => { window.__don = G.Court.donate('museum', 'PT', G.Scenes.city.npc('curator', '관장')).then(r => { window.__donR = r; }); }, setup.city);
    await page.waitForSelector('.modal-back .choice, .modal-back [data-i], .modal-back .opt, .modal-back li', { timeout: 10000 }).catch(() => {});
    await sleep(800);
    await page.screenshot({ path: path.join(OUT, 'donate_museum_pick.png') });
    const pickFirst = async () => page.evaluate(() => {
      const back = [...document.querySelectorAll('.modal-back')].pop();
      const el = back && [...back.querySelectorAll('[data-i], .choice, .opt, li, button')].find(e => /발견 유물|명작 ·/.test(e.innerText || ''));
      if (el) { el.click(); return el.innerText.split('\n')[0]; } return null;
    });
    const skipSay = async () => { for (let i = 0; i < 6; i++) { const isSay = await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); return !!(b && b.querySelector('.dlg .body') && !b.querySelector('[data-i], .choice, .opt')); }); if (!isSay) return; await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); b.click(); }); await sleep(250); } };
    const p1 = await pickFirst(); await sleep(500);
    await page.screenshot({ path: path.join(OUT, 'donate_museum_thanks.png') });
    await skipSay(); await sleep(400);
    const p2 = await page.evaluate(() => {
      const back = [...document.querySelectorAll('.modal-back')].pop();
      const el = back && [...back.querySelectorAll('[data-i], .choice, .opt, li, button')].find(e => /명작 ·/.test(e.innerText || ''));
      if (el) { el.click(); return el.innerText.split('\n')[0]; } return null;
    });
    await sleep(500); await skipSay(); await sleep(400);
    // 그만둔다 (창 닫기)
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); const x = b && (b.querySelector('.close, .x, [data-close]') || [...b.querySelectorAll('button')].find(e => /그만|닫|취소|돌아/.test(e.innerText))); if (x) x.click(); else if (b) b.click(); });
    await page.waitForFunction(() => !!window.__donR, null, { timeout: 10000 });
    const after = await page.evaluate(() => { const s = G.Game.state, r = s.court.museum.PT; return { r: window.__donR, so: G.Fame.get ? G.Fame.get('so') : (s.player.fame && s.player.fame.so) || 0, trust: G.Sponsor.rel('pt_king').trust || 0, items: s.player.items.length, ex: r.items.map(x => x.name), open: r.open, don: r.don }; });
    console.log('   picked: ' + p1 + ' / ' + p2 + ' → ' + JSON.stringify(after));
    ok(after.r.n === 2 && after.items === before.items - 2, '박물관에 2점 기증 → 소지품에서 2점 빠짐');
    ok(after.ex.length === 3 && after.open === 1 && after.don === 2, '전시 3점 (문 열 때 1점 + 기증 2점)');
    ok(after.so > before.so && after.r.so > 0, '사교 명성 +' + after.r.so);
    ok(after.trust === Math.min(100, before.trust + 2), '포르투갈 왕의 신뢰 ' + before.trust + ' → ' + after.trust);

    // ⑥ 전시실 머리말
    await page.evaluate((cid) => { G.Scenes.city.B.museum.show(G.CITY_DATA[cid], 'PT'); }, setup.city);
    await sleep(900);
    const sub = await page.evaluate(() => (document.querySelector('.mu-sub') || {}).innerText || '');
    await page.screenshot({ path: path.join(OUT, 'donate_museum_hall.png') });
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));
    ok(/1점으로 문을 열었다 · 그 뒤 기증 2점/.test(sub), '전시실 머리말: ' + sub);

    // ③ 미술관: 명작만 (남은 명작 1점) — 고르는 창을 함수로 대신해 빠르게
    const ga = await page.evaluate(async () => {
      const ch0 = G.UI.choose, say0 = G.UI.say; let shown = null, k = 0;
      G.UI.choose = async (t, opts) => { if (shown == null) shown = opts.map(o => o.label.replace(/<[^>]+>/g, ' ')); return k++ === 0 ? opts[0].value : null; };
      G.UI.say = async () => {};
      try { const r = await G.Court.donate('gallery', 'PT', {}); return { r, shown, items: G.Game.state.court.gallery.PT.items.map(x => x.name), left: G.Court.donatable('gallery').length }; } finally { G.UI.choose = ch0; G.UI.say = say0; }
    });
    console.log('   ' + JSON.stringify(ga));
    ok(ga.shown.length === 1 && ga.shown.every(x => /명작/.test(x)) && ga.r.n === 1 && ga.items.length === 1 && ga.left === 0, '미술관: 명작만 고를 수 있고 1점 기증');

    // ④ 동물원 (옛 저장) — 2종 기증
    const zo = await page.evaluate(async (cr) => {
      const ch0 = G.UI.choose, say0 = G.UI.say; let k = 0;
      G.UI.choose = async (t, opts) => (k++ < 2 ? opts[0].value : null);
      G.UI.say = async () => {};
      try {
        const r = await G.Court.donate('zoo', 'PT', {}); const c = G.Game.state.court;
        return { r, at: c.zooAt.PT, used: Object.keys(c.zooUsed), left: G.Court.donatable('zoo').length, list: G.Court.zooAnimalsOf(c.zooAt.PT).map(d => d.id) };
      } finally { G.UI.choose = ch0; G.UI.say = say0; }
    }, setup.cr);
    console.log('   ' + JSON.stringify(zo));
    ok(zo.r.n === 2 && zo.at && zo.at.open === 1 && zo.list.length === 3 && zo.left === 0, '동물원(옛 저장): 기록을 만들고 새 동물 2종 더함 → 3종');
    await page.evaluate((cid) => { G.Scenes.city.B.zoo.show(G.CITY_DATA[cid], 'PT'); }, setup.city);
    await sleep(900);
    const zsub = await page.evaluate(() => (document.querySelector('.mu-sub') || {}).innerText || '');
    await page.screenshot({ path: path.join(OUT, 'donate_zoo_hall.png') });
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));
    ok(/1종으로 문을 열었다 · 그 뒤 기증 2종/.test(zsub), '동물원 머리말: ' + zsub);

    // ⑦ 기증할 것이 없으면
    const none = await page.evaluate(async (cid) => {
      const C = G.Scenes.city, c = G.CITY_DATA[cid]; const said = []; const say0 = G.UI.say;
      G.UI.say = async (t) => { said.push(t); };
      try { await G.Court.donate('zoo', 'PT', {}); } finally { G.UI.say = say0; }
      const m = C.B.zoo.menu(c, 'PT')[1]; return { dim: m.dim, sub: m.sub, said };
    }, setup.city);
    ok(none.dim && /기증할 것이 없다/.test(none.sub) && /찾아내시면/.test(none.said.join()), '기증할 것이 없으면 메뉴가 흐리고 사육사가 일러 준다');

    // ⑧ 저장·불러오기
    const sv = await page.evaluate(() => { const j = JSON.stringify(G.Game.state); const s2 = JSON.parse(j); return { m: s2.court.museum.PT.items.length, z: s2.court.zooAt.PT.ids.length, g: s2.court.gallery.PT.items.length }; });
    ok(sv.m === 3 && sv.z === 3 && sv.g === 1, '저장 자료에 남는다 (박물관 3 · 미술관 1 · 동물원 3)');

    // 실제 거리 화면의 건물 메뉴 캡처
    await page.evaluate((cid) => { const C = G.Scenes.city; if (C.enterBuilding) C.enterBuilding('museum', 'PT'); }, setup.city);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
