/* 무덤 발견물의 일기토 점검 (js/systems/tombduel.js · js/data/tombguards.js)
   node tests/tomb_duel_smoke.js   (스크린샷: OUT 또는 임시 폴더/tomb_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'tomb_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      window.__fresh = function () {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.player.gold = 10000; s.date = { y: 1530, m: 6, d: 1 };
        if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
        return s;
      };
      window.__fresh();
      const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });

    // ① 자료: 무덤마다 무사 · 이집트는 람세스(왕가의 계곡)만 · 무열왕릉은 새 발견물
    const data = await page.evaluate(() => {
      const T = G.TOMB_GUARDS, ids = Object.keys(T);
      return { ids, missing: ids.filter(id => !G.DISC[id]), noSprite: ids.filter(id => !G.DUEL_ART.fighters.some(f => f.id === T[id].sprite)),
        egypt: ['pyramid', 'giza', 'kings', 'tutankh'].filter(id => T[id]), kings: T.kings.kind + ' ' + T.kings.name, muyeol: G.DISC.muyeol && [G.DISC.muyeol.name, G.DISC.muyeol.cat, G.DISC.muyeol.how, T.muyeol.kind, T.muyeol.name, T.muyeol.sprite],
        noPic: ids.filter(id => !G.Img.file('discoveries/' + id)), notMan: ids.filter(id => T[id].pic ? !G.Img.file(T[id].pic) : (G.Art.rolePortraitGender(T[id].role, T[id].style) !== 'm' || !G.Img.file('portraits/npc-roles/' + T[id].style + '/' + T[id].role))), kinds: ids.map(id => id + ':' + T[id].kind).join(' ') };
    });
    console.log(JSON.stringify(data));
    ok(data.ids.length >= 18 && !data.missing.length, '무덤 발견물 ' + data.ids.length + '곳에 무사 — ' + data.kinds);
    ok(!data.noSprite.length, '모든 무사에 일기토 그림이 있다');
    ok(data.egypt.join() === 'kings' && /^rob 예니체리/.test(data.kings), '이집트는 람세스 2세의 무덤(왕가의 계곡)만 — 도굴꾼 ' + data.kings);
    ok(data.muyeol && data.muyeol.join() === '무열왕릉,ruin,land,guard,선비 김정휘,joseon_swordsman', '새 발견물 무열왕릉 — 지키는 이: 위정척사의 선비 김정휘');
    ok(!data.notMan.length, '무사 초상은 모두 남자 그림 ' + data.notMan.join());
    ok(!data.noPic.length, '무덤 발견물 모두 발견 그림이 있다 (무열왕릉 GIF 포함)');

    // ② 결과별 흐름 — 일기토는 결과만 돌려주게 바꿔 끼운다
    async function run(id, pick, res) {
      return page.evaluate(async ([id, pick, res]) => {
        const s = window.__fresh(), d = G.DISC[id], D = G.Disc; window.__en = null; window.__opt = null;
        const ui = { say: G.UI.say, ask: G.UI.ask, duel: G.Games.duel, rev: G.Scenes.discoveryReveal, card: G.Scenes.discoveryCard, toast: G.UI.toast, offer: G.Names && G.Names.offer };
        const said = []; G.UI.say = async (t) => { said.push(String(t)); }; G.UI.ask = async () => pick; G.UI.toast = () => {};
        G.Games.duel = async (en, opt) => { window.__en = en; window.__opt = opt; G.Games.lastDuel = { how: 'ko' }; return res; };
        G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryCard = async () => {}; if (G.Names) G.Names.offer = async () => {};
        const fame0 = s.player.fame ? JSON.stringify(s.player.fame) : '', gold0 = s.player.gold, exp = Math.round(D.fameFor(d) * 0.75 * D.artBonus(d));
        const ex0 = G.Fame.get ? G.Fame.get('ex') : (s.player.fameEx || 0);
        const found = await D.find(d, d.how);
        const ex1 = G.Fame.get ? G.Fame.get('ex') : (s.player.fameEx || 0);
        const st = s.disc[id] || {}, out = { found, me: !!st.me, tomb: st.tomb || null, block: st.tombBlock ? st.tombBlock - s.day : 0, gold: s.player.gold - gold0, relics: (st.relics || []).length, relicAll: D.relicsOf(id).length,
          exp, fame: ex1 - ex0, en: window.__en && [window.__en.name, window.__en.sprite, window.__en.style], place: window.__opt && window.__opt.place, said: said.slice(0, 3) };
        if (!found) {   // 막힌 동안은 다시 찾지 않고, 날이 지나면 다시
          s.discDay = null; out.hitBlocked = D.checkLand(d.lon, d.lat).hits.some(x => x.id === id);
          s.day += 31; s.discDay = null; out.hitAfter = D.checkLand(d.lon, d.lat).hits.some(x => x.id === id); out.pendingAfter = G.TombDuel.pending(d);
        }
        Object.assign(G.UI, { say: ui.say, ask: ui.ask, toast: ui.toast }); G.Games.duel = ui.duel; G.Scenes.discoveryReveal = ui.rev; G.Scenes.discoveryCard = ui.card; if (G.Names) G.Names.offer = ui.offer;
        return out;
      }, [id, pick, res]);
    }
    const gw = await run('muyeol', 'duel', 'win');
    console.log(JSON.stringify(gw));
    ok(gw.found && gw.me && gw.tomb.res === 'win' && gw.en[1] === 'joseon_swordsman' && gw.place === 'explore', '무열왕릉: 선비와 겨뤄 이기면 발견 (' + gw.en.join(' · ') + ')');
    ok(gw.fame >= Math.round(gw.exp * 1.2), '무덤지기를 이기면 명성이 더 오른다 (' + gw.exp + ' → ' + gw.fame + ')');
    ok(gw.said.some(t => /31대손/.test(t)) && gw.said.some(t => /삿된 것을 물리치는/.test(t)), '대사: 「31대손」·「바른 것을 지키고 삿된 것을 물리치는」');
    const gl = await run('muyeol', 'duel', 'lose');
    console.log(JSON.stringify(gl));
    ok(!gl.found && !gl.me && gl.block === 30 && !gl.hitBlocked && gl.hitAfter && gl.pendingAfter, '무열왕릉: 지면 발견하지 못하고 30일 동안 다가갈 수 없다 → 날이 지나면 다시 선비가 막는다');
    const gb = await run('muyeol', 'back', 'win');
    ok(!gb.found && gb.block === 30 && !gb.en, '물러서면 싸우지 않고 30일 뒤에 다시');
    const rw = await run('kings', 'duel', 'win');
    console.log(JSON.stringify(rw));
    ok(rw.found && rw.tomb.res === 'win' && rw.gold > 0 && rw.en[1] === 'barbary_corsair' && /예니체리/.test(rw.en[0]), '왕가의 계곡: 예니체리를 물리치면 금화 ' + rw.gold + '닢을 챙기고 발견');
    ok(rw.said.some(t => /람세스 2세/.test(t)), '대사: 람세스 2세의 무덤을 파헤치는 예니체리');
    const rl = await run('kings', 'duel', 'lose');
    console.log(JSON.stringify(rl));
    ok(rl.found && rl.tomb.res === 'robbed' && rl.relics === 0 && rl.fame <= Math.round(rl.exp * 0.72), '예니체리에게 지면 무덤은 찾지만 부장품을 빼앗기고 명성이 준다 (유물 ' + rl.relicAll + ' → 0, 명성 ' + rl.exp + ' → ' + rl.fame + ')');
    const sea = await run('munmu', 'duel', 'win');
    ok(sea.found && sea.place === 'deck', '문무대왕릉(바다): 승병과 갑판 위에서 겨룬다');
    const none = await run('giza', 'duel', 'lose');
    ok(none.found && !none.tomb && !none.en, '기자의 피라미드에는 아무도 나오지 않는다');

    // 무사 19명의 초상을 한 장에
    await page.evaluate(() => {
      const box = document.createElement('div'); box.id = 'tombfaces'; box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#222;display:flex;flex-wrap:wrap;gap:6px;padding:8px;color:#fff;font-size:12px';
      Object.keys(G.TOMB_GUARDS).forEach(id => { const f = G.TombDuel.fighter(G.DISC[id]), c = document.createElement('div'); c.appendChild(G.Art.portraitCanvas(f.portrait, 120)); c.appendChild(document.createTextNode(f.name)); box.appendChild(c); });
      document.body.appendChild(box);
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, 'tomb_faces.png') });
    await page.evaluate(() => document.getElementById('tombfaces').remove());

    // ③ 화면: 실제 대화와 일기토 창 (무열왕릉)
    await page.evaluate(() => { window.__fresh(); G.TombDuel.meet(G.DISC.muyeol, 'land').then(r => { window.__res = r; }); });
    for (let i = 0; i < 3; i++) { await page.waitForTimeout(500); if (i === 1) await page.screenshot({ path: path.join(OUT, 'tomb_muyeol_talk.png') }); await page.keyboard.press('Enter'); }
    await page.waitForSelector('.askrow .btn', { timeout: 10000 });
    await page.screenshot({ path: path.join(OUT, 'tomb_muyeol_ask.png') });
    await page.click('.askrow .btn');
    await page.waitForTimeout(600); await page.keyboard.press('Enter');
    await page.waitForSelector('.rduel', { timeout: 10000 }); await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, 'tomb_muyeol_duel.png') });
    const nm = await page.evaluate(() => document.querySelector('.rd-side.en .nm').textContent);
    ok(/김정휘/.test(nm), '일기토 창 상대: ' + nm);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
