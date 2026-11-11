/* 이슬람 세력과의 싸움 · 중계무역 값과 수량 (2026-11-11 사용자 요청 — 베타 피드백)
   · 기독교 나라의 제독이 이슬람 세력(그라나다·오스만·맘루크·하프스·구자라트 …)의 배를 치면 악명이 적게 붙는다 (G.BALANCE.faithFoe)
   · 그라나다 군함을 꺾으면 악명 0 · 전투 명성이 더 붙는다 / 잉글랜드 군함은 예전대로 악명 +5
   · 레판토(큰 해전)는 악명 없이 그 해전의 명성만
   · 유럽 가까운 중계항(알렉산드리아·베니스·이스탄불)의 값이 유럽 시장에 가깝고, 재고가 줄었다 (G.BALANCE.relay)
   node tests/faith_relay_smoke.js  (playwright) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const GAME = process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  async function open(y) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.R && G.Rel && G.Rel.faithFoe, null, { timeout: 90000 });
    await page.evaluate(async (y) => {
      G.State.newGame({ name: '후안', nation: 'ES', job: 'merchant', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.date.y = y; G.Game.state.settings.res = 0.35;
      await G.Game.ensureGeo();
    }, y);
    return page;
  }
  /** 해전에 들어가 적을 모두 가라앉혀 이기게 하고, 그동안 오른 악명·명성 */
  async function fight(npc, y) {
    const page = await open(y);
    await page.evaluate((npc) => {
      const s = G.Game.state; s.player.notoriety = 0; window.__f0 = s.player.fame || 0;
      if (npc.great) { s.rel = s.rel || {}; s.rel.battle = s.rel.battle || {}; s.rel.battle[npc.great] = 'fighting'; }
      G.Game.go('battle', { npc: npc });
    }, npc);
    await page.waitForFunction(() => G.Scenes.battle.runtime() && G.Scenes.battle.runtime().ships, null, { timeout: 60000 });
    await page.evaluate(() => { G.Scenes.battle.runtime().ships.forEach(b => { if (b.side === 'en') { b.alive = false; b.sunk = true; } }); });
    await page.waitForFunction(() => G.Game.state.stats.wins > 0, null, { timeout: 60000 });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({ noto: G.Game.state.player.notoriety, fame: (G.Game.state.player.fame || 0) - window.__f0, text: document.body.innerText }));
    await page.close();
    return r;
  }
  try {
    const page = await open(1490);
    const r = await page.evaluate(() => {
      const RL = G.Rel;
      return {
        foe: ['그라나다 왕국', '오스만 제국', '맘루크 왕조', '하프스 왕조', '구자라트 술탄국'].every(n => RL.faithFoe(n)),
        notFoe: ['카스티야', '프랑스', '잉글랜드', '베네치아', '명'].every(n => !RL.faithFoe(n)),
        attNavy: RL.fightNotoriety({ kind: 'navy', nation: '그라나다 왕국' }, 'attack', 12),
        attMer: RL.fightNotoriety({ kind: 'merchant', nation: '오스만 제국' }, 'attack', 8),
        attEn: RL.fightNotoriety({ kind: 'navy', nation: '잉글랜드' }, 'attack', 12)
      };
    });
    ok(r.foe && r.notFoe, '이슬람 세력: 그라나다·오스만·맘루크·하프스·구자라트 / 아님: 카스티야·프랑스·잉글랜드·베네치아·명');
    ok(r.attNavy === 3 && r.attMer === 4 && r.attEn === 12, '먼저 공격할 때 악명: 그라나다 군함 ' + r.attNavy + ' · 오스만 상선 ' + r.attMer + ' · 잉글랜드 군함 ' + r.attEn + '(그대로)');

    // 중계무역
    const t = await page.evaluate(() => {
      const R = G.R, by = n => G.CITY_DATA.find(c => c && c.name === n), sv = by('세빌리아');
      const row = (cn, id) => { const c = by(cn), b = R.buyPrice(c, id); return { b: Math.round(b), stock: R.stockCapacity(c, id), x: R.sellPrice(sv, id) / b }; };
      return { alex: row('알렉산드리아', 'pepper'), ven: row('베니스', 'clove'), ist: row('이스탄불', 'porcelain'), mal: row('말라카', 'clove') };
    });
    ok(t.alex.x < 3 && t.alex.stock < 200, '알렉산드리아 후추 ' + t.alex.b + '닢 · 재고 ' + t.alex.stock + '통 → 세빌리아 ' + t.alex.x.toFixed(2) + '배');
    ok(t.ven.x < 1.7 && t.ist.x < 1.7, '베니스 정향 → 세빌리아 ' + t.ven.x.toFixed(2) + '배 · 이스탄불 중국 도자기 ' + t.ist.x.toFixed(2) + '배');
    ok(t.mal.x > 5 && t.mal.stock > 400, '먼 바다의 중계항은 그대로: 말라카 정향 → 세빌리아 ' + t.mal.x.toFixed(1) + '배 · 재고 ' + t.mal.stock + '통');
    await page.close();

    const gr = await fight({ kind: 'navy', nation: '그라나다 왕국', n: 2, hostile: true, ships: ['caravel', 'caravel'], K: 0.3 }, 1490);
    const en = await fight({ kind: 'navy', nation: '잉글랜드', n: 2, hostile: true, ships: ['caravel', 'caravel'], K: 0.3 }, 1490);
    ok(gr.noto === 0 && en.noto === 5, '해전에 이기면 악명: 그라나다 군함 ' + gr.noto + ' · 잉글랜드 군함 ' + en.noto);
    ok(gr.fame > en.fame && /무훈/.test(gr.text), '그라나다 군함을 꺾으면 명성이 더 붙고(' + gr.fame + ' > ' + en.fame + ') 「무훈」 알림');
    const lp = await fight({ kind: 'navy', nation: '오스만 제국', great: 'lepanto', n: 2, hostile: true, ships: ['galley', 'galley'], K: 1 }, 1571);
    ok(lp.noto === 0 && lp.fame > 1000, '레판토: 악명 ' + lp.noto + ' · 전투 명성 +' + lp.fame);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' / '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗ ' + e.message); process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
