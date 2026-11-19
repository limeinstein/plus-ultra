/* 해적 토벌 보상 (2026-11-19 사용자 요청) — js/data/pirate_loot.js · js/systems/pirate_wanted.js (W.bounty · W.swordOf · W.arm · W.loot)
   「해적 토벌에 따른 보상을 5만에서 10만 골드로 늘리고 보물을 받기도 해. 강한 해적은 40 이상의 공격력을 가진 검을 가지고 있기도 한다.」
   · 이름난 해적의 현상금은 모두 5만~10만 · 강한 해적일수록 많다
   · 강한 해적 가운데 일부가 명검(공격 40 이상, 그 바다의 칼)을 찬다 — 바다의 함대 두목(npc.boss)이 그 검의 공격으로 일기토에 나선다
   · 무찌르면 명검을 손에 넣고(한 번), 궤짝의 보물이 나오기도 한다(한 해적에 한 번) · 소지품이 가득하면 자택 보관함
   · 옛 저장(s.wanted.loot·swords 없음)도 그대로
   node tests/pirate_loot_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const s = G.Game.state, W = G.Wanted, out = {};
      delete s.wanted;   // 옛 저장처럼 장부 없이 시작
      const all = G.SEA_PIRATES.filter(p => W.pirate(p.id));
      const bs = all.map(p => W.bounty(p));
      out.bounty = { n: bs.length, min: Math.min.apply(null, bs), max: Math.max.apply(null, bs) };
      const hist = all.filter(p => p.hist), plain = all.filter(p => !p.hist && p.zones.length === 1);
      out.histMore = hist.length && plain.length && Math.min.apply(null, hist.map(p => W.bounty(p))) > Math.max.apply(null, plain.map(p => W.bounty(p)));
      // 명검
      const armed = all.filter(p => W.swordOf(p));
      out.swords = armed.map(p => { const d = W.swordOf(p); return { p: p.name, zones: p.zones, sw: d.name, atk: d.atk, zs: d.zones, str: W.strength(p) }; });
      out.allStrong = out.swords.every(x => x.str >= G.BALANCE.wanted.sword.strong);
      out.weakNone = all.filter(p => W.strength(p) < G.BALANCE.wanted.sword.strong).every(p => !W.swordOf(p));
      out.zoneFit = out.swords.every(x => x.zs.some(z => x.zones.indexOf(z) >= 0));
      out.same = armed.every(p => W.swordOf(p).id === W.swordOf(p).id);
      out.strong = all.filter(p => W.strength(p) >= G.BALANCE.wanted.sword.strong).length;
      // 바다의 함대: 명검을 찬 두목이 일기토에 나선다
      const p = armed[0], z = p.zones[0];
      const n = { kind: 'pirate', zone: z, ships: ['galleon', 'galleon', 'galleon'], n: 3, K: 0.5 };
      G.Captains.forceNamed(n, p.id); if (G.Corsair) G.Corsair.named(n); W.empower(n);
      out.boss = n.boss ? { name: n.boss.name, atk: n.boss.atk, line: n.boss.line, note: n.tacticNote } : null;
      out.capName = n.cap && n.cap.name;
      // 벽보 크게 보기에 「명검」 줄
      const c0 = G.CITY_DATA[s.loc.city];
      const dp = W.detail(c0, p); await new Promise(r => setTimeout(r, 600));
      out.detail = (document.body.innerText.match(/명검 — [^\n]*/) || [''])[0];
      const btn = [...document.querySelectorAll('button')].find(b => /벽보 앞을 떠난다/.test(b.textContent)); if (btn) btn.click(); await Promise.race([dp, new Promise(r => setTimeout(r, 1500))]); out.closed = !!btn;
      // 무찌른다 → 명검 · 보물 (확률을 1로)
      const T = G.BALANCE.wanted.treasure, keep = Object.assign({}, T); T.chance = 1; T.max = 1; T.two = 1;
      const inv0 = s.player.items.length;
      const L = []; G.Captains.afterBattle(n, 'win', [{ side: 'en', flag: true, sunk: true }], L);
      Object.assign(T, keep);
      const got = s.player.items.slice(inv0).map(x => x.id);
      out.win = { lines: L.map(t => t.replace(/<[^>]+>/g, '')).filter(t => /손에 넣었다|현상금/.test(t)), got, due: s.wanted.due[p.id] };
      out.gotSword = got.indexOf(W.swordOf(p) ? 'x' : '') < 0 && got.some(id => (G.PIRATE_SWORDS || []).indexOf(id) >= 0);
      out.gotTreasure = got.filter(id => (G.PIRATE_TREASURE || []).indexOf(id) >= 0);
      out.swordGone = !W.swordOf(p) && s.wanted.swords[p.id] != null;
      // 같은 해적을 다시 이겨도 보물·명검은 한 번
      const n2 = { kind: 'pirate', zone: z, ships: ['galleon'], n: 1, K: 0.5 }; G.Captains.forceNamed(n2, p.id); if (G.Corsair) G.Corsair.named(n2); W.empower(n2);
      out.boss2 = !!(n2.boss && (n2.boss.sword || n2.boss.atk >= 40));
      const inv1 = s.player.items.length; T.chance = 1; G.Captains.afterBattle(n2, 'win', [{ side: 'en', flag: true, sunk: true }], []); Object.assign(T, keep);
      out.again = s.player.items.length - inv1;
      // 소지품이 가득하면 보관함으로 — 아직 무찌르지 않은 명검 해적
      const q = armed.find(x => { if (x.id === p.id || s.wanted.gone[x.id] || !W.swordOf(x)) return false; s.date = { y: Math.round((x.y[0] + x.y[1]) / 2), m: 5, d: 1 }; const t = { kind: 'pirate', zone: x.zones[0], ships: ['galleon'], n: 1 }; G.Captains.forceNamed(t, x.id); return t.cap && t.cap.id === x.id; });
      out.q = q && q.name;
      if (q) {
        for (const d of G.ITEMS) { if ((G.PIRATE_SWORDS || []).indexOf(d.id) >= 0 || (G.PIRATE_TREASURE || []).indexOf(d.id) >= 0 || d.consumable) continue; if (!G.R.addItem(d.id)) break; }   // 서로 다른 장신구로 칸을 채운다
        const st0 = G.R.storage().length;
        const nq = { kind: 'pirate', zone: q.zones[0], ships: ['galleon'], n: 1, K: 0.5 }; G.Captains.forceNamed(nq, q.id);
        const L2 = []; G.Captains.afterBattle(nq, 'win', [{ side: 'en', flag: true, sunk: true }], L2);
        out.full = { slots: G.R.slotsUsed() + '/' + G.R.ITEM_MAX, stored: G.R.storage().slice(st0).map(x => x.id), line: L2.map(t => t.replace(/<[^>]+>/g, '')).filter(t => /보관함/.test(t))[0] || '' };
      }
      return out;
    });
    console.log('   현상금 ' + JSON.stringify(r.bounty) + ' · 강한 해적 ' + r.strong + '명 중 명검 ' + r.swords.length + '명');
    console.log('   예: ' + r.swords.slice(0, 6).map(x => x.p + '(' + x.zones.join('/') + ') ' + x.sw + ' ' + x.atk).join(' · '));
    ok(r.bounty.n > 100 && r.bounty.min >= 50000 && r.bounty.max <= 100000, '이름난 해적 ' + r.bounty.n + '명의 현상금이 모두 5만~10만 (' + r.bounty.min + '~' + r.bounty.max + ')');
    ok(r.histMore, '역사 속 해적은 한 바다의 소문 속 해적보다 현상금이 크다');
    ok(r.swords.length > 5 && r.swords.every(x => x.atk >= 40), '명검은 모두 공격 40 이상');
    ok(r.allStrong && r.weakNone && r.swords.length < r.strong, '명검은 강한 해적만, 그 가운데 일부만 찬다');
    ok(r.zoneFit && r.same, '명검은 그 해적의 바다 칼이고, 늘 같은 검이다');
    ok(r.boss && r.boss.name === r.capName && r.boss.atk >= 40 && /덤벼라/.test(r.boss.line), '명검을 찬 해적의 함대 — 두목 ' + (r.boss && r.boss.name) + '이 공격 ' + (r.boss && r.boss.atk) + '로 일기토에 나선다 · ' + (r.boss && r.boss.note));
    ok(/공격 4\d/.test(r.detail), '벽보에 「' + r.detail + '」');
    ok(r.gotSword && r.swordGone && r.gotTreasure.length >= 1, '무찌르면 명검과 궤짝의 보물을 얻는다 — ' + r.win.lines.join(' | '));
    ok(r.win.due >= 50000, '현상금도 적힌다 ' + r.win.due);
    ok(!r.boss2 && r.again === 0, '같은 해적을 또 이겨도 명검·보물은 한 번 (명검을 잃은 두목은 맨칼로)');
    ok(r.full && (r.full.stored.length >= 1 && /보관함/.test(r.full.line)), '소지품이 가득하면 자택 보관함으로 — ' + r.q + ' ' + JSON.stringify(r.full || {}));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('실패: ' + e.message); console.error(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
