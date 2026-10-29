/* 선수상 — 효과를 분명히 · 조선 기술 등급으로 해금 · 위대한 발견과 전설의 바다 괴물에서만 얻는 선수상 (2026-10-29)
   node tests/figurehead_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, FX = G.FigFx, R = G.R, out = {};
      const shop = G.FIGUREHEADS.filter(f => !f.rare && !f.relic);
      out.tiers = [1, 2, 3, 4, 5].map(lv => shop.filter(f => (f.lv || 1) === lv).length);
      out.gunTiers = [1, 2, 3, 4, 5].map(lv => G.CANNONS.filter(g => (g.lv || 1) === lv).length);
      out.gear = [2, 3, 4, 5].map(lv => G.Scenes.city.B.shipyard.gearAt(lv));
      // 위대한 발견
      const great = G.FIGUREHEADS.filter(f => f.great);
      out.great = great.map(f => ({ id: f.id, disc: f.great, ok: !!(G.DISC[f.great] && (G.RELICS[f.great] || []).some(r => r.id === f.id) && G.RELIC[f.id] && G.ITEM[f.id] && G.ITEM[f.id].kind === 'fig'), notShop: !shop.includes(f) }));
      // 전설
      out.legends = G.FIG_LEGENDS.map(id => { const f = G.FIGUREHEAD[id]; return { id, src: f.src, monster: !!G.SEA_MONSTERS[f.src], sp: f.sp, item: !!G.ITEM[id], lines: FX.lines(f).length }; });
      // 효과 글
      out.text = { falcon: FX.lines(G.FIGUREHEAD.falcon).map(x => x.text), swan: FX.lines(G.FIGUREHEAD.swan).map(x => x.text).join(), unicorn: FX.short(G.FIGUREHEAD.unicorn), admiral: FX.short(G.FIGUREHEAD.admiral), demon: FX.plain(G.FIGUREHEAD.demon), seagod: FX.plain(G.FIGUREHEAD.seagod) };
      out.noText = G.FIGUREHEADS.filter(f => !FX.lines(f).length).map(f => f.id);
      // 함대 효과: 가장 큰 것 + 나머지 ¼
      const ships = s.fleet.ships;
      ships[0].fig = 'swan';
      out.fleet1 = R.fleetBonus('storm');
      out.fleetHtml = FX.fleetHtml();
      // 전설의 바다 괴물을 무찌르면
      const it0 = s.player.items.length;
      const got = FX.afterMonster('leviathan');
      out.drop = got && got.id; out.inItems = s.player.items.some(it => it.id === 'seagod');
      out.again = FX.afterMonster('leviathan');
      out.noLegend = FX.afterMonster('kraken');
      out.news = G.SeaMonsters.newsText(G.CITY_DATA[1] || G.CITIES[0], { id: 'zaratan', lon: 0, lat: 0 });
      out.newsGot = G.SeaMonsters.newsText(G.CITY_DATA[1] || G.CITIES[0], { id: 'leviathan', lon: 0, lat: 0 });
      // 전설의 힘
      const base = { floor: FX.stormFloor(), enemy: FX.enemyAccK(), wake: FX.wakeSpd() };
      ships[0].fig = 'seagod'; out.calm = FX.stormFloor();
      ships[0].fig = 'cipactooth'; out.terror = FX.enemyAccK();
      ships[0].fig = 'goddess'; out.guard = [FX.crewLoss(10), FX.crewLoss(4)];
      ships[0].fig = 'demon'; out.cursed = FX.cursed(); out.stormMul = FX.stormMul();
      ships[0].fig = 'zarashell'; ships[0].hp = ships[0].maxHp * 0.5; const h0 = ships[0].hp; const msgs = []; FX.daily(msgs); out.regen = Math.round((ships[0].hp - h0) / ships[0].maxHp * 1000) / 10;
      out.base = base;
      // 저주와 성스러운 상
      const sh2 = JSON.parse(JSON.stringify(ships[0])); sh2.name = '둘째'; sh2.fig = 'angel'; ships.push(sh2); ships[0].fig = 'demon';
      out.holyBlocks = !FX.cursed() && FX.has('curse');
      // 속력: 단 배만 / 끌어 주는 꼬리는 모든 배
      ships[0].fig = 'falcon'; ships[1].fig = null;
      const wind = { dir: 0, spd: 0.6 };
      const v0 = R.shipSpeed(ships[1], 0, wind, null);
      ships[0].fig = 'isonadetail'; const v1 = R.shipSpeed(ships[1], 0, wind, null);
      out.wakeK = Math.round(v1 / v0 * 1000) / 1000;
      // 배를 팔 때 돌려받는다
      ships[1].fig = 'unicorn'; const n0 = s.player.items.filter(it => it.id === 'unicorn').length;
      FX.salvage(ships[1]); out.salvage = s.player.items.filter(it => it.id === 'unicorn').length - n0;
      // 정보 창
      ships.pop(); ships[0].fig = 'seagod';
      return out;
    });
    console.log('   ' + JSON.stringify({ tiers: r.tiers, gunTiers: r.gunTiers }));
    console.log('   ' + JSON.stringify(r.text, null, 0));
    ok(r.tiers.every(n => n >= 2) && r.gunTiers.every(n => n >= 1), '조선소 선수상은 1~5등급마다 둘 이상 · 대포도 등급마다 ' + JSON.stringify(r.tiers));
    ok(r.gear.every(t => t.length > 0), '기술 투자 안내: 2~5등급에 새로 다는 대포·선수상 이름 ' + r.gear.join(' | '));
    ok(r.great.length === 10 && r.great.every(g => g.ok && g.notShop), '위대한 발견 10곳에서만 나오는 신화 선수상 ' + r.great.filter(g => !g.ok).map(g => g.id).join(','));
    ok(r.legends.length === 7 && r.legends.every(l => l.monster && l.item && l.sp.length && l.lines >= 2), '전설의 선수상 7개 — 저마다 전설의 바다 괴물·전설의 힘 ' + r.legends.map(l => l.id + '<' + l.src).join(' '));
    ok(!r.noText.length && /속력 \+3% \(단 배만\)/.test(r.text.falcon.join()) && /폭풍 만날 확률 −18%/.test(FXsafe(r)) && /괴물 퇴치\+30%/.test(r.text.unicorn), '모든 선수상에 숫자로 된 효과 글 ' + r.noText.join(','));
    ok(Math.abs(r.fleet1 - 0.06) < 1e-9 && /선수상 효과/.test(r.fleetHtml), '함대 정보 창에 함대 합계 효과');
    ok(r.drop === 'seagod' && r.inItems && r.again === null && r.noLegend === null, '레비아탄을 무찌르면 해신상 — 한 번만, 전설 아닌 괴물은 없음');
    ok(/전설의 「자라탄 등딱지 선수상」/.test(r.news) && !/전설/.test(r.newsGot), '항구의 괴물 목격 소식에 전설의 선수상 귀띔 (얻은 뒤에는 없음)');
    ok(r.base.floor === 0.35 && r.calm === 0.12 && r.terror === 0.88 && r.guard[0] === 5 && r.guard[1] === 2 && r.cursed && r.stormMul === 1.3 && r.regen === 1, '전설의 힘: 고요한 바다·떨리는 포수·어머니의 품·저주·아무는 등딱지 ' + JSON.stringify({ calm: r.calm, terror: r.terror, guard: r.guard, regen: r.regen }));
    ok(r.holyBlocks, '천사상이 함대에 있으면 마왕상의 저주가 막힌다');
    ok(r.wakeK > 1.07 && r.wakeK < 1.09, '이소나데 꼬리: 다른 배 속력도 +8% (' + r.wakeK + ')');
    ok(r.salvage === 1, '배를 팔거나 파기하면 유물 선수상을 돌려받는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 2).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
  function FXsafe(r) { return r.text.swan + ' ' + r.text.falcon.join(); }
})();
