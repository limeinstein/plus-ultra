/* 거리를 걷는 마을 사람 점검 (js/systems/streetfolk.js · js/art/streetfolk.js · js/scenes/town.js)
   · 거리가 열리면 3~4명, 건물에 들어갔다 나올 때마다 새 사람들, 걷고 멈추고 오간다
   · 도시 조건: 도서관 없는 도시에 사서 없음, 내륙 도시에 항해사 없음, 짐승은 한 마리까지
   · 누르면 제독이 다가가 말을 건다 — 대화창(이름·얼굴), 종류마다 쓸모 있는 이야기(시장 소식·단서·책·여관값·바람·가까운 항구…)
   · 말이 통하지 않으면 「알아듣지 못했다」, 문화권마다 다른 모습 (스크린샷 리스본·이스탄불·캘리컷·한양·쿠스코), 콘솔 오류 0
   node tests/streetfolk_smoke.js   (스크린샷: OUT 또는 임시 폴더/streetfolk_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'streetfolk_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  const byName = n => page.evaluate(n => G.CITY_DATA.find(c => c.name === n).id, n);
  async function goCity(id) {
    await page.evaluate(id => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: id }); }, id);
    await page.waitForFunction(id => G.Game.sceneName === 'city' && G.Town.active() && G.Town.city() && G.Town.city().id === id && !G.Town.hidden(), id, { timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
  }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.StreetFolk && G.Art.drawFolk && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    });
    // ① 리스본 거리
    await goCity(0);
    const a = await page.evaluate(async () => {
      const f0 = G.Town.folks().map(f => ({ type: f.type, x: Math.round(f.x), y: Math.round(f.y), name: f.name }));
      const x0 = G.Town.folks().map(f => f.x);
      for (let i = 0; i < 240; i++) G.Town.update(1 / 30);   // 8초
      const x1 = G.Town.folks().map(f => f.x);
      return { f0, moved: x0.filter((x, i) => Math.abs(x - x1[i]) > 20).length, states: G.Town.folks().map(f => f.state), animals: G.Town.folks().filter(f => f.animal).length };
    });
    console.log(JSON.stringify(a));
    ok(a.f0.length >= 3 && a.f0.length <= 4, '리스본 거리에 ' + a.f0.length + '명: ' + a.f0.map(f => f.name).join(' · '));
    ok(a.moved >= 1 && a.animals <= 1, '8초 동안 ' + a.moved + '명이 걸어서 자리를 옮김, 짐승은 ' + a.animals + '마리');
    await page.screenshot({ path: path.join(OUT, 'lisbon.png') });

    // ② 누르면 다가가 말을 건다 (화면에서 클릭)
    const target = await page.evaluate(() => {
      const st = G.Town.runtime(), f = G.Town.folks().filter(f => !f.animal).sort((a, b) => Math.abs(a.x - st.hero.x) - Math.abs(b.x - st.hero.x))[0];
      G.Town.folks().forEach(o => { o.state = 'idle'; o.timer = 99; });          // 누르는 동안 멈춰 있게
      st.camTo = st.cam = Math.max(0, Math.min(st.streetW - 1600, f.x - 800)); G.Town.update(1 / 30);
      const r = G.Game.canvases().scene.getBoundingClientRect();
      return { px: r.left + (f.x - st.cam) / 1600 * r.width, py: r.top + (f.y - f.spec.h * f.sc * 0.5) / 900 * r.height, name: f.name, type: f.type, hero0: st.hero.x, fx: f.x };
    });
    await page.mouse.move(target.px, target.py); await page.waitForTimeout(200);
    const hov = await page.evaluate(() => { const h = G.Town.runtime().hover; return h && h.name; });
    await page.mouse.down(); await page.mouse.up();
    await page.waitForSelector('.dlg', { timeout: 10000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'talk.png') });
    const dl = await page.evaluate(() => ({ text: document.querySelector('.dlg').innerText, hero: G.Town.runtime().hero.x }));
    console.log(JSON.stringify({ target, hov, dl }));
    ok(hov === target.name, '마우스를 올리면 「' + hov + ' — 말 걸기」');
    ok(dl.text.indexOf(target.name) >= 0 && Math.abs(dl.hero - target.fx) < 160, '눌렀더니 제독이 다가가(' + Math.round(target.hero0) + ' → ' + Math.round(dl.hero) + ') ' + target.name + U_short(dl.text));
    for (let i = 0; i < 4; i++) { const has = await page.evaluate(() => !!document.querySelector('.dlg')); if (!has) break; await page.mouse.click(800, 820); await page.waitForTimeout(400); }

    // ③ 건물에 들어갔다 나오면 새 사람들
    const before = await page.evaluate(() => G.Town.folks().map(f => f.seed).join('|'));
    async function clickThrough(done) {
      for (let i = 0; i < 30; i++) {
        if (await page.evaluate(done)) return true;
        const has = await page.evaluate(() => !!document.querySelector('.dlg'));
        if (has) await page.mouse.click(800, 820);
        await page.waitForTimeout(350);
      }
      return page.evaluate(done);
    }
    await page.evaluate(() => { window.__v = G.Scenes.city.visit('inn'); });
    await clickThrough(() => G.Town.hidden() && !document.querySelector('.dlg'));
    await page.waitForTimeout(500);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); window.__l = G.Scenes.city.run(() => G.Scenes.city.leave()); });
    await clickThrough(() => !G.Town.hidden());
    const after = await page.evaluate(() => ({ seeds: G.Town.folks().map(f => f.seed).join('|'), n: G.Town.folks().length, names: G.Town.folks().map(f => f.name) }));
    ok(after.seeds !== before && after.n >= 3 && after.n <= 4, '여관에 들어갔다 나오니 새 사람들: ' + after.names.join(' · '));

    // ④ 도시 조건 · 여러 번 뽑기
    const cond = await page.evaluate(() => {
      const SF = G.StreetFolk, R = G.R, o = {};
      const noLib = G.CITY_DATA.find(c => R.cityExists(c) && c.port && !R.facilities(c).library && c.size === 1);
      const inland = G.CITY_DATA.find(c => R.cityExists(c) && !c.port && c.size >= 2);
      o.noLib = [noLib.name, SF.types(noLib).indexOf('librarian') < 0, SF.types(noLib).indexOf('soldier') < 0 || noLib.size >= 2];
      o.inland = [inland.name, SF.types(inland).indexOf('navigator') < 0];
      let maxA = 0, counts = {}, ns = new Set();
      for (let i = 0; i < 200; i++) { const L = SF.spawn(G.CITY_DATA[0], 6000, 1000, 768, 't' + i); ns.add(L.length); maxA = Math.max(maxA, L.filter(f => f.animal).length); L.forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1; }); if (new Set(L.map(f => f.type)).size !== L.length) o.dup = true; }
      o.maxA = maxA; o.types = Object.keys(counts).length; o.ns = [...ns].sort(); o.counts = counts;
      return o;
    });
    console.log(JSON.stringify(cond));
    ok(cond.noLib[1] && cond.inland[1], cond.noLib[0] + '(도서관 없음)엔 사서가 없고, 내륙 ' + cond.inland[0] + '엔 항해사가 없다');
    ok(cond.maxA <= 1 && !cond.dup && cond.ns.join(',') === '3,4' && cond.types >= 14, '200번 뽑기: 늘 3~4명, 짐승 한 마리까지, 같은 종류 겹침 없음, ' + cond.types + '종 모두 나옴');

    // ⑤ 대화 내용: 종류마다
    const talk = await page.evaluate(async () => {
      const c = G.CITY_DATA[0], SF = G.StreetFolk, said = {}, s = G.Game.state;
      const say0 = G.UI.say; G.UI.say = async (t, who) => { said.cur.push({ t, who: who && who.name, face: !!(who && who.portrait) }); };
      const mate0 = G.Scenes.city.mate; G.Scenes.city.mate = async (t) => { said.cur.push({ t, who: '부관' }); };
      s.fleet.fatigue = 70; s.date = { y: 1494, m: 7, d: 1 };
      for (const t of Object.keys(G.STREET_FOLK.types)) {
        said.cur = []; const f = SF.make(t, c, 6000, 1000, 768, 'talk' + t); await SF.talk(f, c); said[t] = said.cur;
      }
      // 말이 통하지 않는 도시
      const far = G.CITY_DATA.find(x => x.name === '캘리컷'); s.player.lg = G.LANGS.map(() => 0); s.mates.forEach(m => { m.role = 'none'; });
      said.cur = []; const fz = SF.make('merchant', far, 6000, 1000, 768, 'deaf'); await SF.talk(fz, far); said.deaf = said.cur; said.deafUsed = fz.used;
      s.player.lg = G.LANGS.map(() => 3);
      G.UI.say = say0; G.Scenes.city.mate = mate0;
      return said;
    });
    const show = Object.keys(talk).filter(k => k !== 'cur' && k !== 'deafUsed').map(k => k + ': ' + (talk[k][0] ? talk[k][0].t : '')).join('\n    ');
    console.log('    ' + show);
    ok(Object.keys(talk).filter(k => Array.isArray(talk[k]) && k !== 'cur' && k !== 'deaf').every(k => talk[k].length >= 1 && talk[k][0].t.length > 8), '14종 모두 대화가 나온다');
    ok(/금화 [0-9]+닢/.test(talk.innkeeper[0].t) && /피로|쉬/.test(talk.grandma[0].t) && talk.innkeeper[0].face && talk.librarian[0].face && !talk.dog[0].face, '여관 주인은 방값, 할머니는 지친 선원 걱정 · 사람은 얼굴, 짐승은 얼굴 없이');
    ok(talk.deaf.length === 2 && /알아듣지 못했/.test(talk.deaf[1].t) && talk.deafUsed === false, '말이 통하지 않으면 「알아듣지 못했다」 — 쓸모 있는 이야기는 아껴 둔다');

    // ⑥ 문화권마다 다른 모습
    for (const n of ['이스탄불', '캘리컷', '한양', '쿠스코']) {
      const id = await page.evaluate(n => { const c = G.CITY_DATA.find(c => c.name === n) || G.CITY_DATA.find(c => c.style === (n === '한양' ? 'kr' : 'an')); return c.id; }, n);
      await goCity(id);
      await page.evaluate(() => { const st = G.Town.runtime(); G.Town.folks().forEach((f, i) => { f.x = st.cam + 300 + i * 330; f.target = f.x; }); for (let i = 0; i < 20; i++) G.Town.update(1 / 30); });
      await page.screenshot({ path: path.join(OUT, 'street_' + n + '.png') });
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
  function U_short(t) { return ' — 「' + t.replace(/\s+/g, ' ').slice(0, 90) + '…」'; }
})();
