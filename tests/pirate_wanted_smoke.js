/* 이름난 해적 명부 2.5배 · 해적단 · 해적 깃발 · 식당 현상수배 벽보 · 여급/식당의 해적 소문 (2026-11-10)
   node tests/pirate_wanted_smoke.js   (BROWSER_EXE로 크롬 경로 · SHOTS=폴더 를 주면 벽보·깃발 그림을 찍는다) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS || '';
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {};
      // ── 명부: 바다마다 예전(2026-11-09)의 2.5배 이상 · 지어낸 해적 6명 이상
      const BASE = { med: 17, atl: 12, north: 4, amer: 9, ind: 8, sea: 7, east: 10 };
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true; s.date = { y: 1600, m: 5, d: 1 }; s.player.gold = 100000; s.settings.sound = 0; s.settings.music = 0;
      const P = G.Captains.pirates();
      out.zones = {};
      Object.keys(BASE).forEach(z => { const a = P.filter(p => p.zones.indexOf(z) >= 0); out.zones[z] = { n: a.length, need: Math.ceil(BASE[z] * 2.5), fict: a.filter(p => !p.hist).length }; });
      out.filtered = (G.SEA_PIRATES.length - P.length);
      out.noBand = P.filter(p => !p.band || !G.PIRATE_BANDS[p.band]).map(p => p.id);
      out.noG = P.filter(p => p.g !== 'm' && p.g !== 'f').map(p => p.id);
      out.noLook = P.filter(p => !p.look).map(p => p.id);
      out.bands = Object.keys(G.PIRATE_BANDS).length;
      out.noFlag = Object.keys(G.PIRATE_BANDS).filter(b => !G.ITEM['flag_' + b] || G.ITEM['flag_' + b].kind !== 'flag');
      out.realBands = Object.keys(G.PIRATE_BANDS).filter(b => G.PIRATE_BANDS[b].real).length;
      // ── 깃발 그림 (그림 파일이 없을 때 코드 그림) — 모두 그려진다
      const flagErr = [];
      Object.keys(G.PIRATE_BANDS).forEach(b => { try { const c = G.Art.relicArt(G.ITEM['flag_' + b], 96, 96); if (!c || !c.width) flagErr.push(b); } catch (e) { flagErr.push(b + ':' + e.message); } });
      out.flagErr = flagErr;
      // ── 리스본 식당: 벽보 · 현상금 · 소문
      const lis = Object.values(G.CITY_DATA).find(x => x && x.name === '리스본');
      s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat, via: 'sea' };
      const said = []; G.UI.toast = () => {};
      const oSay = G.UI.say; G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      const rows = G.Scenes.city.B.restaurant.menu(lis).map(x => x.label);
      out.rows = rows;
      out.posters = G.Wanted.posters('atl').map(p => p.name + ':' + G.Wanted.bounty(p));
      // 소문: 운을 1로
      const rc = G.U.chance; G.U.chance = () => true;
      await G.Wanted.gossip(lis);
      const tip = (s.maidTips || []).filter(t => t.kind === 'named')[0];
      out.tip = tip ? { cap: tip.cap, who: tip.who, text: G.MaidTip.text(tip), left: tip.to - s.day } : null;
      await G.Wanted.gossip(lis);   // 같은 입항에 또 — 이미 들었다
      out.again = said[said.length - 1];
      G.U.chance = rc;
      // 그 앞바다에 가면 그 해적이 정말 나타난다
      if (tip) {
        s.loc = { mode: 'sea', lon: tip.lon, lat: tip.lat };
        const npc = G.MaidTip.spawn([]);
        out.spawn = npc ? { cap: npc.cap && npc.cap.id, band: npc.cap && npc.cap.band, label: npc.label, n: npc.n, hostile: npc.hostile } : null;
        // 이겼다 → 현상금이 적히고 깃발을 얻는다
        if (npc) {
          const lines = [];
          G.Captains.afterBattle(npc, 'win', [{ side: 'en', flag: true, sunk: true }], lines);
          out.lines = lines;
          out.due = G.Wanted.due();
          out.hasFlag = G.R.hasItem('flag_' + npc.cap.band);
          // 같은 해적을 또 이겨도 현상금은 한 번
          const l2 = []; G.Captains.afterBattle(npc, 'win', [{ side: 'en', flag: true, sunk: true }], l2); out.again2 = l2.filter(t => /현상|깃발/.test(t)).length;
        }
        s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat, via: 'sea' };
      }
      const g0 = s.player.gold; await G.Wanted.claim(lis); out.paid = s.player.gold - g0; out.dueAfter = G.Wanted.due();
      // 여급: 「이름난 해적의 소문」
      out.maidKind = !!G.MaidTip.KIND.named;
      const mt = G.MaidTip.make('named', lis, { id: Object.keys(G.MAID || { m: 1 })[0] }, { aff: 60 });
      out.maidTip = mt ? G.MaidTip.text(mt) : null;
      out.maidPrice = G.MaidTip.price('named', lis, { aff: 60, met: 3 });
      // 소굴을 손에 넣으면 소굴 해적단의 깃발
      const LR = G.Lair, x = LR.st();
      const lair = G.PIRATE_LAIRS.find(d => !G.R.hasItem('flag_' + d.band));
      x.rev[lair.zone] = s.day; x.beat[lair.zone] = 1;
      const l3 = []; LR.afterBattle({ kind: 'pirate', lairChief: lair.zone, chiefNo: 1, zone: lair.zone }, 'win', [], l3);
      out.lairFlag = G.R.hasItem('flag_' + lair.band) && l3.some(t => t.includes(G.PIRATE_BANDS[lair.band].name + '의 깃발'));
      out.flagCount = G.Wanted.flagCount() + '/' + G.Wanted.flagTotal();
      // ── 흡수: 무찌른 해적의 남은 무리는 같은 바다의 다른 해적에게 (한 해적이 둘까지) · 흡수한 해적은 강해진다
      {
        const W = G.Wanted, z = 'med', A2 = G.BALANCE.wanted.absorb;
        const fight = id => { const p = W.pirate(id); const n = { kind: 'pirate', zone: z, cap: { id: p.id, name: p.name, band: p.band, g: p.g } }; const L = []; G.Captains.afterBattle(n, 'win', [{ side: 'en', flag: true, sunk: true }], L); return L; };
        const free0 = G.Captains.namedFree(z).length;
        const x1 = G.Captains.namedFree(z)[0], L1 = fight(x1.id), y1 = s.wanted.gone[x1.id];
        out.abs1 = { x: x1.name, y: y1 && W.pirate(y1).name, line: (L1.filter(t => /흘러들었다/.test(t))[0] || '').replace(/<[^>]+>/g, ''), stillFree: G.Captains.namedFree(z).some(p => p.id === x1.id) };
        out.sameBand = !!y1 && (W.pirate(y1).band === x1.band || !G.Captains.namedFree(z).some(p => p.id !== y1 && p.band === x1.band && W.absorbed(p.id).length < A2.max));
        // 흡수한 해적의 함대: 흡수 전과 견주어 배·선원·포술
        const mk = () => ({ kind: 'pirate', zone: z, ships: ['galley', 'galley', 'galley'], n: 3, K: 0.5 });
        const base = mk(); G.Captains.forceNamed(base, y1); if (G.Corsair) G.Corsair.named(base);
        const strong = mk(); G.Captains.forceNamed(strong, y1); if (G.Corsair) G.Corsair.named(strong); W.empower(strong);
        out.power = { before: base.ships.length, after: strong.ships.length, crew: [base.crewK, strong.crewK], label: strong.label, note: strong.tacticNote };
        out.bountyUp = W.bounty(W.pirate(y1)) > (W.pirate(y1).hist ? 2 : 1) * G.BALANCE.wanted.base;
        // 흡수한 해적을 무찌르면 그도 흡수되고, 거느린 잔당은 흩어진다
        fight(y1); out.bigGone = !!s.wanted.gone[y1] && !s.wanted.abs[y1];
        // 여러 번 토벌해도 한 해적은 둘까지만 흡수
        for (let i = 0; i < 12; i++) { const f = G.Captains.namedFree(z); if (f.length < 2) break; fight(f[(i * 7) % f.length].id); }
        out.maxOk = Object.keys(s.wanted.abs).every(id => s.wanted.abs[id].length <= A2.max);
        out.goneOut = Object.keys(s.wanted.gone).every(id => !G.Captains.namedFree(null).some(p => p.id === id));
        out.freeAfter = free0 + '→' + G.Captains.namedFree(z).length;
        // 받을 해적이 없는 바다: 무찌른 해적이 다시 배를 모은다
        const only = G.Captains.namedFree('north'); const keep = only.slice(1).map(p => p.id); keep.forEach(id => { s.wanted.gone[id] = 'test'; });
        const Ln = (() => { const p = only[0]; const n = { kind: 'pirate', zone: 'north', cap: { id: p.id, name: p.name, band: p.band } }; const L = []; G.Captains.afterBattle(n, 'win', [{ side: 'en', flag: true, sunk: true }], L); return L; })();
        out.noTaker = Ln.some(t => /받아 줄 해적이 이 바다에 없다/.test(t)) && !s.wanted.gone[only[0].id];
        keep.forEach(id => { delete s.wanted.gone[id]; });
      }
      G.UI.say = oSay;
      // 벽보 창을 연다 (그림 확인)
      G.Game.go('city', { cityId: lis.id });
      return out;
    });
    await page.waitForTimeout(2500);
    for (let i = 0; i < 6 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
    page.evaluate(() => { const c = G.CITY_DATA[G.Game.state.loc.city]; return G.Wanted.board(c); }).catch(() => {});
    await page.waitForTimeout(1800);
    const cards = await page.evaluate(() => document.querySelectorAll('.wp-card').length);
    const faces = await page.evaluate(() => document.querySelectorAll('.wp-face canvas, .wp-face img').length);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'wanted_board.png') });
    await page.locator('.wp-card').first().click();
    await page.waitForTimeout(1200);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'wanted_detail.png') });
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    if (SHOTS) {
      // 깃발 68장 한눈에
      await page.evaluate(() => {
        const ks = Object.keys(G.PIRATE_BANDS), cols = 12, sz = 104, cv = document.createElement('canvas');
        cv.width = cols * sz; cv.height = Math.ceil(ks.length / cols) * (sz + 18); const x = cv.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, cv.width, cv.height);
        ks.forEach((k, i) => { const c = G.Art.relicArt(G.ITEM['flag_' + k], sz, sz); x.drawImage(c, (i % cols) * sz, Math.floor(i / cols) * (sz + 18)); x.fillStyle = '#eee'; x.font = '11px sans-serif'; x.fillText(G.PIRATE_BANDS[k].name.slice(0, 9), (i % cols) * sz + 2, Math.floor(i / cols) * (sz + 18) + sz + 13); });
        cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(cv);
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SHOTS, 'flags_sheet.png') });
    }
    console.log('pirate roster / wanted');
    Object.keys(r.zones).forEach(z => { const v = r.zones[z]; ok(v.n >= v.need && v.fict >= 6, z + ' 이름난 해적 ' + v.n + '명 (2.5배=' + v.need + ') · 지어낸 해적 ' + v.fict + '명'); });
    ok(r.filtered === 0, '명부에서 걸러진 해적 없음 (후원자·탐험가와 이름 겹침) — ' + r.filtered);
    ok(!r.noBand.length && !r.noG.length && !r.noLook.length, '모든 해적에 해적단·성별·생김새 ' + JSON.stringify([r.noBand, r.noG, r.noLook]));
    ok(r.bands >= 60 && !r.noFlag.length, '해적단 ' + r.bands + '개 (실존 이름 ' + r.realBands + ') · 모두 깃발 아이템');
    ok(!r.flagErr.length, '깃발 그림 모두 그려짐 ' + r.flagErr.join(','));
    ok(r.rows.indexOf('현상수배 벽보를 본다') >= 0 && r.rows.indexOf('손님들의 해적 이야기를 듣는다') >= 0, '식당 메뉴: ' + r.rows.join(' / '));
    ok(r.posters.length >= 4, '리스본 벽보 ' + r.posters.join(', '));
    ok(r.tip && r.tip.cap && r.tip.who === '식당 손님', '식당 소문 → ' + (r.tip ? r.tip.text + ' (' + r.tip.left + '일)' : '없음'));
    ok(/다 들으셨/.test(r.again || ''), '같은 입항에 두 번은 못 듣는다');
    ok(r.spawn && r.tip && r.spawn.cap === r.tip.cap && r.spawn.hostile, '소문의 앞바다에 그 해적이 나타난다 — ' + (r.spawn ? r.spawn.label + ' ' + r.spawn.n + '척' : '없음'));
    ok(r.due > 0 && r.hasFlag && r.again2 === 0, '이기면 현상금 ' + r.due + '닢이 적히고 깃발을 얻는다 · 다시 이겨도 한 번 — ' + (r.lines || []).join(' | ').replace(/<[^>]+>/g, ''));
    ok(r.paid === r.due && r.dueAfter === 0, '식당에서 현상금을 받는다 ' + r.paid);
    ok(r.abs1.y && !r.abs1.stillFree && r.sameBand, '흡수: ' + r.abs1.line);
    ok(r.power.after === r.power.before + 1 && r.power.crew[1] > r.power.crew[0] && r.bountyUp, '흡수한 해적이 강해진다 — 배 ' + r.power.before + '→' + r.power.after + ' · 선원 ' + r.power.crew.map(v => (+v).toFixed(2)).join('→') + ' · ' + r.power.label);
    ok(r.maxOk && r.goneOut, '한 해적은 둘까지만 흡수 · 흡수된 해적은 바다에 안 나옴 (지중해 이름난 해적 ' + r.freeAfter + ')');
    ok(r.bigGone, '흡수한 해적도 무찌르면 흡수되고 잔당은 흩어진다');
    ok(r.noTaker, '받아 줄 해적이 없으면 다시 배를 모은다');
    ok(r.maidKind && r.maidTip, '여급의 「이름난 해적의 소문」 ' + r.maidTip + ' · 사례금 ' + r.maidPrice);
    ok(r.lairFlag, '소굴을 손에 넣으면 소굴 해적단 깃발 · 모은 깃발 ' + r.flagCount);
    ok(cards >= 4 && faces >= 4, '벽보 창: 벽보 ' + cards + '장 · 초상 ' + faces);
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '실패 ' + fail : '모두 통과');
  process.exit(fail ? 1 : 0);
})();
