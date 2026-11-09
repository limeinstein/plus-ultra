/* 성문 마구간 — 데려갈 수 고르기 (2026-11-09 피드백 「탐험 떠날 때 말이 전부 합쳐져 버린다」 · js/city/misc.js GT.outfit)
   node tests/stable_count_smoke.js   (SHOT=파일.png 이면 마구간 창을 찍는다)
   · 제노바 마구간 말 500필, 대원 50명 → 탐험을 떠나면 필요한 50필만 데려가고 450필은 제노바 마구간에 남는다
   · 뭍길로 베니스(마구간 500필)에 들렀다 「탐험대로 돌아간다」 → 데려온 50필 그대로, 베니스 500필은 그대로 (1,000필로 합쳐지지 않는다)
   · 「데려갈 수」를 120으로: 데려온 50 + 베니스 70 → 베니스 430 · 30으로: 남는 20필도 베니스 마구간에 맡긴다
   · 마구간 둘러보기 「마구간에 둘 수」 450→100: 350필을 되판다 · 떠날 때 가진 것보다 많이 고를 수 없다(살 수 있는 만큼까지) · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const ids = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, y = s.date.y, by = n => G.CITY_DATA.find(c => c.name === n);
      const ge = by('제노바'), ve = by('베니스');
      s.fleet.crew = 50; s.player.gold = 500000;
      G.Game.go('city', { cityId: ge.id });
      return { ge: ge.id, ve: ve.id, offGe: G.Mounts.offers(ge, y), offVe: G.Mounts.offers(ve, y), need: G.Mounts.need('horse', 50), price: G.Mounts.get('horse').price, sell: G.Mounts.get('horse').sell };
    });
    console.log('   ' + JSON.stringify(ids));
    await page.waitForTimeout(2000);
    async function outfit(cid, mode, id, count, shot) {
      const r = await page.evaluate(async ([cid, mode, id, count]) => {
        const GT = G.Scenes.city.B.gate, c = G.CITY_DATA[cid], g0 = G.Game.state.player.gold;
        const p = GT.outfit(c, mode);
        await new Promise(r => setTimeout(r, 300));
        const card = document.querySelector('.outfitwin .of-card[data-id="' + id + '"]');
        card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const inp = document.querySelector('.outfitwin .of-count-n'), def = +inp.value;
        const bar = document.querySelector('.outfitwin .of-count-r');
        if (typeof count === 'string' && count[0] === 'r') { bar.value = count.slice(1); bar.dispatchEvent(new Event('input', { bubbles: true })); }   // 막대를 끈다
        else if (count != null) { inp.value = String(count); inp.dispatchEvent(new Event('input', { bubbles: true })); }
        window.__bar = { min: +bar.min, max: +bar.max, value: +bar.value, inp: +inp.value };
        await new Promise(r => setTimeout(r, 50));
        window.__done = [p, card.querySelector('.of-price').textContent, document.querySelector('.outfitwin .of-count-note').textContent, def, g0];
        return 1;
      }, [cid, mode, id, count]);
      if (shot) await page.screenshot({ path: shot });
      return page.evaluate(async (cid) => {
        const [p, txt, note, def, g0] = window.__done;
        const btn = [...document.querySelectorAll('.outfitwin button')].find(b => /떠난다|맡긴다|되판다 \(\+/.test(b.textContent) && !/모두 되판다/.test(b.textContent));
        const label = btn ? btn.textContent : ''; if (btn) btn.click(); else document.querySelector('.outfitwin button:last-child').click();
        const mt = await p;
        await new Promise(r => setTimeout(r, 200));
        const v = (G.Game.state.stable || {})[cid] || null;
        return { def, txt, note, label, mt, stable: v ? v.id + ':' + v.n : null, spent: g0 - G.Game.state.player.gold };
      }, cid);
    }
    // 1) 제노바: 마구간 말 500필, 대원 50명 → 떠날 때 50필만
    await page.evaluate((ge) => { G.Game.state.stable = { [ge]: { id: 'horse', n: 500 } }; }, ids.ge);
    const a = await outfit(ids.ge, 'depart', 'horse', null, process.env.SHOT);
    console.log('   ' + JSON.stringify(a));
    ok(a.def === ids.need && a.mt.n === ids.need && a.stable === 'horse:' + (500 - ids.need) && a.spent === 0, '제노바(500필)에서 떠나면 필요한 ' + a.mt.n + '필만 데려가고 ' + a.stable + '필은 마구간에 남는다 — ' + a.note);
    // 2) 뭍길로 베니스에 들렀다 탐험대로 돌아간다 (베니스 마구간 500필)
    const setVe = (n) => page.evaluate(([ve, mt, n]) => { const s = G.Game.state, c = G.CITY_DATA[ve]; s.loc.via = 'land'; s.landReturn = { lon: c.lon, lat: c.lat, base: 0, party: 50, days: 5, mount: mt }; s.stable[ve] = { id: 'horse', n: n }; }, [ids.ve, a.mt, n]);
    await setVe(500);
    const b = await outfit(ids.ve, 'resume', 'horse');
    ok(b.mt.n === ids.need && b.stable === 'horse:500' && b.spent === 0, '베니스(500필)에서 탐험대로 돌아가도 ' + b.mt.n + '필 그대로 — 1,000필로 합쳐지지 않고 베니스 마구간 ' + b.stable);
    await setVe(500);
    const c = await outfit(ids.ve, 'resume', 'horse', 120);
    ok(c.mt.n === 120 && c.stable === 'horse:430' && c.spent === 0, '「데려갈 수」 120: 데려온 50 + 베니스 70 → 베니스 ' + c.stable + ' (' + c.label + ')');
    await setVe(500);
    const r = await outfit(ids.ve, 'resume', 'horse', 'r80');
    const rb = await page.evaluate(() => window.__bar);
    ok(r.mt.n === 80 && r.stable === 'horse:470' && rb.min === 1 && rb.max === 550 && rb.inp === 80, '막대를 80으로 끌면 입력 칸도 80 — 막대 ' + rb.min + '~' + rb.max + ' · 베니스 ' + r.stable);
    await setVe(500);
    const d = await outfit(ids.ve, 'resume', 'horse', 30);
    ok(d.mt.n === 30 && d.stable === 'horse:520', '「데려갈 수」 30: 남는 20필도 베니스 마구간에 맡긴다 → ' + d.stable);
    // 3) 마구간 둘러보기: 제노바 450 → 100 (350필 되판다)
    await page.evaluate(() => { const s = G.Game.state; s.loc.via = 'sea'; delete s.landReturn; });
    const e = await outfit(ids.ge, 'stable', 'horse', 100);
    const exp = Math.round(350 * ids.price * ids.sell);
    ok(e.stable === 'horse:100' && -e.spent === exp, '마구간에 둘 수 450→100: 350필을 되판다 (+' + (-e.spent) + '닢) — ' + e.label);
    // 4) 가진 것(100)보다 많이 데려갈 수 없다 (필요한 수 50보다 많이 가졌으니 더 사지도 않는다)
    const f = await outfit(ids.ge, 'depart', 'horse', 999);
    ok(f.mt.n === 100 && f.stable === null && f.spent === 0, '999를 넣어도 가진 100필까지만 — ' + f.mt.n + '필');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''));
    console.log('통과 ' + passed);
  } catch (e) { console.log('실패: ' + e.message); if (errors.length) console.log(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
