/* 갈래 거르기·정렬 · 소지품 고정 · 스크롤 자리 (2026-10-29 피드백) — js/ui/sortfilter.js · UI.checkTools · UI.choose
   ① 항구 발표 창: 갈래 단추(전체·지리 n·보물 n …) — 누르면 그 갈래만 보이고 「보이는 것 모두 선택」은 그 줄만 · 정렬(이름·갈래) · 다시 열어도 갈래가 이어진다
   ② 후원자 「제안 선택」(UI.choose): 갈래 단추로 거르고, 갈래 없는 줄(일괄 보고)은 늘 보인다
   ③ 후원자 일괄 보고 창에도 갈래 단추·정렬(사례금 높은 순)
   ④ 시장 매각: 고정(📌)한 물건은 「전체 선택」에서 빠진다 · 종류 단추(항해도구) · 판 뒤 다시 열면 스크롤 자리 그대로
   ⑤ 자택 보관함: 「모두 맡긴다」는 장비 중·고정·항해도구를 빼고 · 「항해도구」 단추를 누르면 그 종류만(고정은 빼고) · 맡겨도 스크롤 자리 그대로
   ⑥ 수첩 소지품: 종류 단추·정렬·고정 단추 · 고정을 눌러도 스크롤 자리 그대로 · 고정은 저장에 남는다
   node tests/sort_filter_pin_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
  const E = (f, a) => page.evaluate(f, a);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Sponsor && G.Scenes.city && G.Scenes.city.B.harbor && G.ItemPin, null, { timeout: 120000 });
    await E(async () => {
      await G.Game.ensureGeo();
      G.UI.say = async () => {}; G.Game.refreshHud = () => {};
      window.__toasts = []; G.UI.toast = (t) => { __toasts.push(String(t)); };
      const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.player.fame = 99999; s.sponsors.pt_king = { trust: 60, met: 3, done: 1, fail: 0, anger: 0 };
      // 갈래마다 두 건씩 찾아 둔다 (지리·자연·유적·보물 …)
      const cats = Object.keys(G.DISC_CATS).slice(0, 4), ids = [];
      cats.forEach(cat => G.DISCOVERIES.filter(d => d.cat === cat && d.how !== 'trade' && d.pw <= 3 && !d.rival && d.lat !== 0 && !d.tale).slice(0, 2).forEach(d => ids.push(d.id)));
      ids.forEach((id, k) => { s.disc[id] = { found: 15000101 + k, me: true, day: 1, grade: 'chart' }; });
      window.__ids = ids; window.__cats = cats;
      if (G.Names) G.Names.onReport = async () => {};
    });

    console.log('— ① 항구 발표 창');
    const a = await E(async () => {
      const sleep = ms => new Promise(x => setTimeout(x, ms));
      const until = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < (ms || 5000)) { const v = fn(); if (v) return v; await sleep(40); } return null; };
      const list = G.Disc.unreported(), out = {};
      const p = G.Scenes.city.B.harbor.pickAnnouncements(list);
      const w = await until(() => [...document.querySelectorAll('.win')].find(x => /발표할 발견물/.test(x.textContent)));
      const rows = () => [...w.querySelectorAll('[data-ck]')], vis = () => rows().filter(r => r.style.display !== 'none');
      out.chips = [...w.querySelectorAll('.ck-cats .ck-cat')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
      const target = __cats[2], chip = [...w.querySelectorAll('.ck-cat')].find(b => b.getAttribute('data-cat') === target);
      chip.click();
      out.vis = vis().map(r => r.getAttribute('data-cat'));
      w.querySelector('.ck-all').click();
      out.allLabel = w.querySelector('.ck-all').textContent;
      out.checked = rows().filter(r => r.querySelector('input').checked).map(r => r.getAttribute('data-cat'));
      // 정렬: 전체로 돌아가 이름 순 · 갈래 순
      w.querySelector('.ck-cat[data-cat=""]').click();
      const sel = w.querySelector('.ck-sort'); out.sorts = [...sel.options].map(o => o.textContent);
      sel.value = 'name'; sel.dispatchEvent(new Event('change'));
      out.names = rows().map(r => r.getAttribute('data-name'));
      sel.value = 'cat'; sel.dispatchEvent(new Event('change'));
      out.byCat = rows().map(r => r.getAttribute('data-cat'));
      // 갈래를 하나 고른 채 닫고 다시 연다 → 갈래가 이어진다
      w.querySelector('.ck-cat[data-cat="' + __cats[1] + '"]').click();
      [...w.querySelectorAll('.foot .btn')].find(b => /취소/.test(b.textContent)).click();
      await p;
      const p2 = G.Scenes.city.B.harbor.pickAnnouncements(list);
      const w2 = await until(() => [...document.querySelectorAll('.win')].find(x => /발표할 발견물/.test(x.textContent) && x !== w));
      out.kept = (w2.querySelector('.ck-cat.on') || {}).getAttribute && w2.querySelector('.ck-cat.on').getAttribute('data-cat');
      out.keptVis = [...w2.querySelectorAll('[data-ck]')].filter(r => r.style.display !== 'none').length;
      out.keptSort = w2.querySelector('.ck-sort').value;
      [...w2.querySelectorAll('.foot .btn')].find(b => /취소/.test(b.textContent)).click();
      await p2;
      G.DiscPick.state.cat = ''; G.DiscPick.state.sort = 'base';
      return out;
    });
    console.log('   ' + JSON.stringify(a.chips));
    ok(a.chips.length === 5 && /^전체 8$/.test(a.chips[0]) && a.chips.slice(1).every(c => / 2$/.test(c)), '갈래 단추: ' + a.chips.join(' · '));
    ok(a.vis.length === 2 && a.vis.every(c => c === a.vis[0]) && /보이는 것 모두 선택/.test(a.allLabel) && a.checked.length === 2 && a.checked.every(c => c === a.vis[0]), '갈래를 누르면 그 갈래 2건만 보이고 「보이는 것 모두 선택」은 그 2건만');
    const sortedNames = a.names.slice().sort((x, y) => x.localeCompare(y, 'ko'));
    ok(JSON.stringify(a.names) === JSON.stringify(sortedNames), '정렬 「이름」: ' + a.names.slice(0, 4).join(' · ') + ' …');
    ok(a.byCat.every((c, i) => i === 0 || a.byCat.indexOf(c) >= a.byCat.indexOf(a.byCat[i - 1])) && a.sorts.length >= 4, '정렬 「갈래」: 같은 갈래끼리 모인다 (' + a.sorts.join(' · ') + ')');
    ok(a.kept && a.keptVis === 2 && a.keptSort === 'cat', '다시 열어도 고른 갈래(' + a.kept + ')·정렬이 이어진다');

    console.log('— ② 후원자 「제안 선택」 · ③ 일괄 보고');
    const b = await E(async () => {
      const sleep = ms => new Promise(x => setTimeout(x, ms));
      const until = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < (ms || 5000)) { const v = fn(); if (v) return v; await sleep(40); } return null; };
      const out = {}, UI = G.UI;
      const opts = [{ label: '한꺼번에 보고', value: 'batch' }].concat(G.Disc.unreported().map(d => ({ label: d.name, value: d.id, cat: d.cat })));
      const p = UI.choose('제안 선택', opts, { catName: k => G.DISC_CATS[k], catOrder: Object.keys(G.DISC_CATS) });
      const w = await until(() => document.querySelector('.choice-cats') && document.querySelector('.choice-cats').closest('.win'));
      out.chips = w.querySelectorAll('.choice-cats .ck-cat').length;
      w.querySelector('.choice-cats .ck-cat[data-cat="' + __cats[0] + '"]').click();
      out.vis = [...w.querySelectorAll('.choice')].filter(c => c.style.display !== 'none').map(c => c.textContent.trim());
      [...w.querySelectorAll('.choice')].filter(c => c.style.display !== 'none')[1].click();
      out.pick = await p;
      // ③ 일괄 보고 창
      G.Sponsor.interest = () => 3.5;
      const p3 = G.Sponsor.batchReport(G.SPONSOR.pt_king);
      const w3 = await until(() => document.querySelector('.cktools') && document.querySelector('.cktools').closest('.win'));
      out.rep = { chips: w3.querySelectorAll('.ck-cat').length, sorts: [...w3.querySelectorAll('.ck-sort option')].map(o => o.textContent) };
      const sel = w3.querySelector('.ck-sort'); sel.value = 'val'; sel.dispatchEvent(new Event('change'));
      out.rep.vals = [...w3.querySelectorAll('tr[data-ck]')].map(r => +r.getAttribute('data-val'));
      [...w3.querySelectorAll('.foot .btn')].find(x => /그만둔다/.test(x.textContent)).click();
      await Promise.race([p3, sleep(1500)]);
      G.DiscPick.state.cat = ''; G.DiscPick.state.sort = 'base';
      return out;
    });
    ok(b.chips === 5 && b.vis.length === 3 && /한꺼번에/.test(b.vis[0]) && b.pick && G_DISC_OK(b.pick), '「제안 선택」 갈래 단추: 한 갈래를 누르면 그 2건 + 일괄 보고 줄만 (고른 것 ' + b.pick + ')');
    function G_DISC_OK(v) { return typeof v === 'string' && v !== 'batch'; }
    ok(b.rep.chips === 5 && b.rep.sorts.indexOf('사례금 높은 순') >= 0 && b.rep.vals.every((v, i) => i === 0 || v <= b.rep.vals[i - 1]), '일괄 보고 창: 갈래 단추 · 정렬 「' + b.rep.sorts.join(' · ') + '」 · 사례금 높은 순 ' + b.rep.vals.slice(0, 4).join('>'));

    console.log('— ④ 시장 매각 · ⑤ 자택 보관함');
    const c = await E(async () => {
      const sleep = ms => new Promise(x => setTimeout(x, ms));
      const until = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < (ms || 5000)) { const v = fn(); if (v) return v; await sleep(40); } return null; };
      const s = G.Game.state, p = s.player, R = G.R, out = {}, MK = G.Scenes.city.B.market, HM = G.Scenes.city.B.home, city = G.CITY_DATA[s.player.home];
      s.loc.mode = 'city'; s.loc.city = city.id;
      R.ITEM_MAX = 60;
      p.items = []; p.storage = [];
      ['sextant', 'lime', 'cat', 'compass', 'rapier', 'longsword', 'leather', 'ribbon', 'perfume', 'hairpin', 'shawl', 'cards', 'dice', 'brandy', 'sake', 'tarocchi', 'arak', 'huangjiu', 'saber', 'estoc', 'chain', 'scale', 'rose', 'ring', 'tears', 'pearlnk'].forEach(id => { if (G.ITEM[id]) p.items.push({ id: id }); });
      p.equip.weapon = 'rapier';
      G.ItemPin.set({ id: 'lime' }, true); G.ItemPin.set({ id: 'ribbon' }, true);
      // ④ 시장 매각
      const list = p.items.map((it, i) => ({ it: it, i: i }));
      const pm = MK.sellPick(city, list);
      const w = await until(() => [...document.querySelectorAll('.win')].find(x => /매각 —/.test(x.textContent) && x.querySelector('.mksell')));
      const boxes = () => [...w.querySelectorAll('input.mpick')];
      w.querySelector('.ck-all').click();
      const row = id => [...w.querySelectorAll('tr[data-ck]')].find(r => r.querySelector('[data-pinid="' + id + '"]'));
      out.mk = { n: boxes().length, on: boxes().filter(b => b.checked).length, lime: row('lime').querySelector('input.mpick').checked, ribbon: row('ribbon').querySelector('input.mpick').checked, cnt: w.querySelector('.ck-count').textContent };
      // 고정 단추로 고양이를 고정 → 그 줄이 「전체 선택」에서 빠진다
      w.querySelector('.ck-none').click();
      row('cat').querySelector('[data-pinid]').click();
      w.querySelector('.ck-all').click();
      out.mk.catPinned = G.ItemPin.is({ id: 'cat' }); out.mk.cat = row('cat').querySelector('input.mpick').checked;
      w.querySelector('.ck-cat[data-cat="tool"]').click();
      out.mk.tools = [...w.querySelectorAll('tr[data-ck]')].filter(r => r.style.display !== 'none').length;
      w.querySelector('.ck-cat[data-cat=""]').click();
      // 스크롤: 끝까지 내린 뒤 닫고 다시 열면 그 자리
      const sc = w.querySelector('.ck-scroll'); sc.scrollTop = 180; sc.dispatchEvent(new Event('scroll'));
      out.mk.sc0 = sc.scrollTop;
      [...w.querySelectorAll('.foot .btn')].find(x => /돌아간다|그만|닫/.test(x.textContent)) ? [...w.querySelectorAll('.foot .btn')].find(x => /돌아간다|그만|닫/.test(x.textContent)).click() : w.closest('.modal-back').remove();
      await Promise.race([pm, sleep(800)]);
      const pm2 = MK.sellPick(city, list);
      const w2 = await until(() => [...document.querySelectorAll('.win')].find(x => /매각 —/.test(x.textContent) && x.querySelector('.mksell') && x !== w));
      await sleep(80);
      out.mk.sc1 = w2.querySelector('.ck-scroll').scrollTop;
      [...w2.querySelectorAll('.foot .btn')].find(x => /돌아간다|그만|닫/.test(x.textContent)).click();
      await Promise.race([pm2, sleep(800)]);
      G.ItemPin.set({ id: 'cat' }, false); G.ItemCat.state.market = {};
      // ⑤ 자택 보관함
      HM._st = { cat: '', sort: 'base' };
      const ph = HM.storage(city);
      const hw = await until(() => [...document.querySelectorAll('.win')].find(x => /— 보관함/.test(x.textContent)));
      out.st = { chips: [...hw.querySelectorAll('.st-cats .ck-cat')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), btn: hw.querySelector('[data-all]').textContent.trim() };
      // 스크롤: 소지품 칸을 내린 뒤 아래쪽 「맡긴다」 하나
      const sp = () => hw.querySelector('.st-p'); sp().scrollTop = 120; const y0 = sp().scrollTop;
      const btns = [...hw.querySelectorAll('[data-st]')], last = btns[btns.length - 3]; const lastId = p.items[+last.dataset.st].id;
      last.click(); await sleep(50);
      out.st.y = [y0, sp().scrollTop]; out.st.stored1 = R.storage().some(x => x.id === lastId);
      hw.querySelector('[data-all]').click(); await sleep(50);
      out.st.left = p.items.map(it => it.id).sort().join(',');
      // 항해도구 단추 → 그 종류만 (고정한 라임은 빼고)
      hw.querySelector('.st-cats .ck-cat[data-scat="tool"]').click(); await sleep(30);
      out.st.btn2 = hw.querySelector('[data-all]').textContent.trim();
      hw.querySelector('[data-all]').click(); await sleep(30);
      out.st.left2 = p.items.map(it => it.id).sort().join(',');
      [...hw.querySelectorAll('.foot .btn')].find(x => /닫기/.test(x.textContent)).click();
      await Promise.race([ph, sleep(800)]);
      return out;
    });
    console.log('   ' + JSON.stringify(c.mk) + '\n   ' + JSON.stringify(c.st));
    ok(c.mk.on === c.mk.n - 2 && !c.mk.lime && !c.mk.ribbon && /2$/.test(c.mk.cnt), '시장 매각 「전체 선택」: 고정한 라임·리본은 빠진다 (' + c.mk.on + '/' + c.mk.n + ' · ' + c.mk.cnt + ')');
    ok(c.mk.catPinned && !c.mk.cat && c.mk.tools === 4, '창 안의 고정 단추로 고양이를 고정 → 「전체 선택」에서 빠짐 · 「항해도구」 단추 4가지');
    ok(c.mk.sc0 > 100 && Math.abs(c.mk.sc1 - c.mk.sc0) <= 2, '판 뒤 다시 연 매각 창은 보던 자리 그대로 (스크롤 ' + c.mk.sc0 + ' → ' + c.mk.sc1 + ')');
    ok(c.st.chips.length >= 6 && /고정 2$/.test(c.st.chips[c.st.chips.length - 1]) && /항해도구/.test(c.st.btn), '보관함 단추: ' + c.st.chips.join(' · ') + ' / 「' + c.st.btn + '」');
    ok(c.st.stored1 && Math.abs(c.st.y[1] - c.st.y[0]) <= 2, '하나 맡겨도 소지품 칸 스크롤은 그대로 (' + c.st.y.join(' → ') + ')');
    ok(c.st.left === ['cat', 'compass', 'lime', 'rapier', 'ribbon', 'sextant'].sort().join(','), '「모두 맡긴다」: 장비 중(레이피어)·고정(라임·리본)·항해도구(나침반·육분의·고양이)는 남는다 — ' + c.st.left);
    ok(/보이는 항해도구 모두 맡긴다/.test(c.st.btn2) && c.st.left2 === ['lime', 'rapier', 'ribbon'].sort().join(','), '「항해도구」 단추 → 「' + c.st.btn2 + '」 → 고정한 라임만 남는다 — ' + c.st.left2);

    console.log('— ⑥ 수첩 소지품');
    const d = await E(async () => {
      const sleep = ms => new Promise(x => setTimeout(x, ms));
      const s = G.Game.state, p = s.player, R = G.R;
      ['compass', 'sextant', 'longsword', 'leather', 'perfume', 'hairpin', 'shawl', 'cards', 'dice', 'brandy', 'sake', 'tarocchi', 'arak', 'saber', 'estoc', 'chain'].forEach(id => { if (!p.items.some(x => x.id === id)) p.items.push({ id: id }); });
      G.Info.open('items'); await sleep(700);
      const page = document.querySelector('.items-tbl').closest('.win'), out = {};
      out.chips = [...page.querySelectorAll('.icf-bar .ck-cat')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
      out.pins = page.querySelectorAll('.items-tbl .pin-b').length;
      const scr = G.scrollParent(page.querySelector('.items-tbl'));
      out.scrollable = !!scr;
      if (scr) { scr.scrollTop = 400; await sleep(30); }
      const y0 = scr ? scr.scrollTop : 0;
      const pb = [...page.querySelectorAll('.items-tbl .pin-b')][8]; const pid = pb.getAttribute('data-pinid');
      pb.click(); await sleep(60);
      out.y = [y0, scr ? scr.scrollTop : 0]; out.pinned = G.ItemPin.is({ id: pid });
      page.querySelector('.icf-bar .ck-cat[data-icf="pin"]').click(); await sleep(60);
      out.pinRows = page.querySelectorAll('.items-tbl tr').length - 1;
      out.saved = JSON.parse(JSON.stringify(s)).player.pin[pid] === 1;
      await new Promise(r => setTimeout(r, 200));
      document.querySelector('.items-tbl') && (await (async () => { const w = document.querySelector('.items-tbl').closest('.win'); return w; })());
      return out;
    });
    await page.screenshot({ path: path.join(OUT, 'sort_filter_items.png') });
    console.log('   ' + JSON.stringify(d));
    ok(d.chips.length >= 5 && d.pins >= 15, '수첩 소지품: 종류 단추 ' + d.chips.join(' · ') + ' · 고정 단추 ' + d.pins + '개');
    ok(d.pinned && (!d.scrollable || Math.abs(d.y[1] - d.y[0]) <= 24), '고정을 눌러도 스크롤 자리 그대로 (' + d.y.join(' → ') + ')');
    ok(d.pinRows === 3 && d.saved, '「고정」 단추: 고정한 3가지만 · 고정은 저장에 남는다 (player.pin)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
