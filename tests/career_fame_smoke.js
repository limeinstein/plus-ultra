/* 일곱 직업의 조건·작은 보너스·실제 지급 경로와 명성 업적의 일회성 보상을 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'career-fame-20261027');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 1; window.createImageBitmap = undefined; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Career && G.Achieve && G.Scenes.create, null, { polling: 100 });
    const checks = await page.evaluate(async () => {
      const results = [];
      function ok(v, m) { if (!v) throw new Error(m); results.push(m); }
      function fresh(job) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        return G.State.newGame({ name: '직업 시험', nation: 'PT', job, age: 22, birth: { m: 4, d: 12 },
          st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'original' });
      }
      let s = fresh('explorer');
      ok(!s.career && /아직 드러나지/.test(G.Career.html()) && !s.career, '옛 저장·새 저장 모두 읽기만 해서는 특성을 발현하거나 보상하지 않음');
      const voices = G.JOBS.map(j => { s.player.job = j.id; return G.Career.hail('tavern'); });
      ok(voices.every(Boolean) && new Set(voices).size === 7, '일곱 직업의 주점 대사가 서로 다름');
      s.player.job = 'explorer';
      ok(G.Scenes.city.hail(G.CITY_DATA[0], 'tavern', ['어서 오게']).includes(voices[0]), '실제 건물 인사에 직업 대사 연결');
      s.fleet.fatigue = 50;
      ok(G.Career.afterDiscovery({ cat: 'ruin' }) === 0, '탐험가는 유적 발견에 회복 특성을 받지 않음');
      ok(G.Career.afterDiscovery({ cat: 'geo' }) === 2 && G.Career.afterDiscovery({ cat: 'nature' }) === 2 && G.Career.afterDiscovery({ cat: 'geo' }) === 0 && s.fleet.fatigue === 46, '탐험가 새 지리·자연 발견 피로 회복은 하루 4 한도');
      G.Game.state = G.State.deserialize(G.State.serialize()); s = G.Game.state;
      ok(G.Career.afterDiscovery({ cat: 'geo' }) === 0 && /지평선의 위안/.test(G.Career.html()), '불러온 저장에서도 발현 기록·하루 한도가 유지');
      s.day++; s.fleet.fatigue = 1;
      ok(G.Career.afterDiscovery({ cat: 'geo' }) === 1 && s.fleet.fatigue === 0, '다음 날 회복 한도 갱신·피로 음수 방지');

      s = fresh('digger');
      ok(G.Career.discoveryFame({ cat: 'creature' }, 10000) === 0 && G.Career.discoveryFame({ cat: 'ruin' }, 100) === 5, '발굴자는 유적·보물 첫 발견 명성의 5%만 추가');
      ok(G.Career.discoveryFame({ cat: 'treasure' }, 100000) === 20 && G.Career.discoveryFame({ cat: 'ruin' }, 100000) === 15 && G.Career.discoveryFame({ cat: 'ruin' }, 100000) === 0, '발굴 명성은 발견당 20·하루 40 상한');

      s = fresh('hunter'); s.fleet.food = 0; s.fleet.water = 0; s.fleet.mat = 0;
      let got = G.Hunt.give([{ id: 'tigerskin', q: 10 }]);
      ok(got.got[0].q === 11 && !got.left.length, '실제 사냥 전리품 지급에 10%·하루 최대 1통 적용');
      got = G.Hunt.give([{ id: 'tigerskin', q: 10 }]);
      ok(got.got[0].q === 10, '같은 날 반복 사냥에 추가 전리품 없음');
      s.day++; const room = Math.floor(G.R.free());
      got = G.Hunt.give([{ id: 'tigerskin', q: room + 10 }]);
      ok(G.R.free() >= 0 && got.got[0].q === room && got.left[0].q === 10, '짐칸이 부족하면 특성으로 넘치거나 미수령 원래 전리품이 사라지지 않음');
      ok(!s.career.days.hunter || s.career.days.hunter.used === 0, '짐칸 부족으로 못 받은 추가분은 한도를 소모하지 않음');

      s = fresh('conq');
      ok(G.Career.boardingK(true, 20, 21) === 1.04 && G.Career.boardingK(true, 20, 20) === 1 && G.Career.boardingK(false, 20, 30) === 1, '정복자는 기함·선원 열세일 때만 백병전 공격력 4%');
      s = fresh('soldier'); s.fleet.discipline = 79;
      ok(G.Career.accuracy(true) === 0 && !s.career, '군인은 규율 80 미만에서 효과·발현 없음');
      s.fleet.discipline = 80;
      ok(G.Career.accuracy(true) === .02 && G.Career.accuracy(false) === 0, '군인 기함 명중률은 2%p만 추가·다른 배 제외');
      s.player.job = 'merchant';
      ok(G.Career.accuracy(true) === 0 && G.Career.boardingK(true, 10, 20) === 1, '직업을 바꾸어도 다른 직업 효과가 중첩되지 않음');
      if (G.SkillCombos) {
        G.SKILLS.forEach(x => { s.player.sk[x.id] = 3; }); s.player.job = 'conq';
        ok(G.Career.boardingK(true, 10, 20) === 1, 'LV3 백병전 조합이 더 강하면 정복자 효과 중첩 없음');
        s.player.job = 'soldier';
        ok(G.Career.accuracy(true, .8) === 0 && Math.abs(G.Career.accuracy(true, .2) - .01) < 1e-8, '군인 효과와 LV3 명중 조합은 큰 쪽만 적용');
      }

      s = fresh('miss'); s.player.sk.theo = 1; s.fleet.discipline = 90; s.fleet.fatigue = 10;
      const say = G.UI.say; G.UI.say = async () => {};
      const cur = G.Scenes.city.current; G.Scenes.city.current = () => ({});
      try { await G.Scenes.city.B.church.pray(G.CITY_DATA[0]); }
      finally { G.UI.say = say; G.Scenes.city.current = cur; }
      ok(s.fleet.discipline === 97 && s.fleet.fatigue === 8, '실제 기도: 원래 규율 5에 전도사 추가 규율 2·피로 2 회복');
      ok(!G.Career.pray() && s.fleet.discipline === 97 && s.fleet.fatigue === 8, '전도사 추가 기도 보상은 하루 한 번');

      s = fresh('merchant'); const c = G.CITY_DATA[7], T = G.Scenes.city.B.trade;
      s.fleet.cargo.wine = { q: 100, cost: 1, from: 0, d: s.day };
      T.estimate(c, 'wine', 100, false); // 옛 적재 기록·시장 자료의 기존 지연 초기화를 먼저 마친다.
      const before = G.State.serialize(); T.estimate(c, 'wine', 100, false);
      ok(!s.career && s.player.gold === 3000 && G.State.serialize() === before, '매각 견적으로 사례금·한도·시장 상태가 바뀌지 않음');
      const sold = T.sellQty(c, 'wine', 100);
      ok(sold.careerBonus === Math.min(30, Math.floor(sold.profit * .01)) && sold.careerBonus > 0 && s.player.gold === 3000 + sold.total + sold.careerBonus, '실제 타지 매각의 순이익 1% 사례금과 회계 합계 일치');
      ok(G.Career.tradeBonus(100000, true) === 30 - sold.careerBonus && G.Career.tradeBonus(100000, true) === 0, '큰 이익·분할 매각도 하루 사례금 30닢 상한');
      s.day++; s.fleet.cargo.wine = { q: 20, cost: 1, from: 7, d: s.day };
      ok(T.sellQty(c, 'wine', 20).careerBonus === 0, '같은 항구 되팔기 사례금 제외');
      s.fleet.cargo.wine = { q: 20, cost: 0, from: null, hunt: true };
      ok(T.sellQty(c, 'wine', 20).careerBonus === 0, '산 곳 없는 전리품 매각 사례금 제외');

      // 실제 D.find 경로: 대화·그림만 생략하고 명성 계산·중복 검사·기록은 그대로 실행한다.
      const saved = [];
      function replace(o, k, f) { saved.push([o, k, o[k]]); o[k] = f; }
      replace(G.UI, 'say', async () => {});
      replace(G.Scenes, 'discoveryReveal', async () => {}); replace(G.Scenes, 'discoveryCard', async () => {});
      if (G.Names) replace(G.Names, 'offer', async () => {});
      if (G.TombDuel) replace(G.TombDuel, 'pending', () => false);
      replace(G.Achieve, 'afterFind', async () => []);
      try {
        const d = Object.values(G.DISC).find(x => x.cat === 'ruin' && !x.need && !x.evidence && !G.Disc.relicsOf(x.id).length);
        s = fresh('digger');
        const base = Math.round(G.Disc.fameFor(d) * .75 * G.Disc.artBonus(d));
        await G.Disc.find(d, 'special');
        ok(s.player.fame === base + Math.min(20, Math.floor(base * .05)), '실제 첫 유적 발견의 명성에만 발굴 특성 적용');
        const fame = s.player.fame, gold = s.player.gold, used = s.career && s.career.days.digger.used;
        ok(await G.Disc.find(d, 'special') === false && s.player.fame === fame && s.player.gold === gold && s.career.days.digger.used === used, '같은 발견을 재호출해도 명성·금화·한도 재지급 없음');
        s = fresh('explorer'); s.fleet.fatigue = 50;
        const nature = Object.values(G.DISC).find(x => x.cat === 'nature' && !x.need && !x.evidence && !G.Disc.relicsOf(x.id).length);
        await G.Disc.find(nature, 'special');
        ok(!!s.career.revealed.explorer && s.career.days.explorer.used === 2, '실제 자연 발견 경로에서 탐험가 회복 발현');
      } finally { saved.reverse().forEach(([o, k, v]) => { o[k] = v; }); }

      s = fresh('explorer');
      const fas = G.ACHIEVEMENTS.filter(a => a.fameRule);
      ok(fas.length === 22 && fas.every(a => !a.fame) && new Set(G.ACHIEVEMENTS.map(a => a.id)).size === G.ACHIEVEMENTS.length, '새 명성 업적 22개·ID 중복 없음·명성 보상 없음');
      ok(fas.every(a => {
        const fr = a.fameRule;
        s.player.fame = fr.min - 1;
        s.player.fameBy = { ex: 0, tr: 0, bt: 0, so: 0 };
        if (fr.all) { s.player.fameBy = { ex: fr.min, tr: fr.min, bt: fr.min, so: fr.min - 1 }; s.player.fame = fr.min * 4 - 1; }
        else if (fr.cat) s.player.fameBy[fr.cat] = fr.min - 1;
        const below = G.Achieve.progress(a).done;
        s.player.fame = fr.all ? fr.min * 4 : fr.min;
        s.player.fameBy = fr.all ? { ex: fr.min, tr: fr.min, bt: fr.min, so: fr.min } : { ex: 0, tr: 0, bt: 0, so: 0 };
        if (fr.cat) s.player.fameBy[fr.cat] = fr.min;
        return !below && G.Achieve.progress(a).done;
      }), '22개 명성 업적 모두 문턱 1 아래·정확한 도달 값 검사');
      s = fresh('explorer');
      G.Fame.add('ex', 4999);
      ok(!G.Achieve.done('fame_total_5000') && s.player.gold === 3000, '첫 명성 업적은 문턱 1 아래에서 미달성');
      G.Fame.add('ex', 1);
      ok(G.Achieve.done('fame_total_5000') && s.player.gold === 3300 && s.player.fame === 5000 && s.achvPend.length === 1, '문턱 도달 즉시 300닢·칭호만 지급하고 장면 대기열 등록');
      const sceneSay = G.UI.say, sceneWin = G.UI.window, spoken = [];
      G.UI.say = async t => { spoken.push(t); }; G.UI.window = () => ({ result: Promise.resolve(1) });
      try { await G.Achieve.scene(G.Achieve.get('fame_total_5000')); }
      finally { G.UI.say = sceneSay; G.UI.window = sceneWin; }
      ok(spoken.includes(G.Career.line('honor')) && s.player.gold === 3300, '명성 업적 장면에 직업별 수상 대사·장면 재생으로 보상 중복 없음');
      G.Fame.add('ex', -100); G.Fame.add('ex', 100); G.Achieve.check();
      ok(s.player.gold === 3300 && s.achvPend.length === 1, '명성 하락 후 재도달·업적 재검사에서도 보상과 대기열 중복 없음');
      G.Game.state = G.State.deserialize(G.State.serialize()); s = G.Game.state;
      G.Fame.add('tr', 1);
      ok(s.player.gold === 3300 && s.player.fameBy.tr === 3, '저장 불러와도 일회성 보상 유지·기존 교역 명성 3배 규칙 유지');
      s = fresh('merchant'); s.player.fame = 2600000; s.player.fameBy = { ex: 650000, tr: 650000, bt: 650000, so: 650000 };
      const gotAll = G.Achieve.check().filter(a => a.fameRule);
      const reward = fas.reduce((n, a) => n + a.gold, 0);
      ok(gotAll.length === 22 && s.player.gold === 3000 + reward && reward === 51800 && s.player.fame === 2600000, '옛 고명성 저장은 22개 소급 달성·총 51,800닢·명성 추가 없음');
      const prev = s.player.gold; G.Achieve.check();
      ok(s.player.gold === prev && G.Achieve.titles().includes('균형 잡힌 제독'), '전체 달성 반복 검사도 중복 보상 없음·균형 칭호 기록');
      s = fresh('hunter'); G.Fame.add('bt', 6667);
      ok(G.Achieve.done('fame_bt_20000') && !G.Achieve.done('fame_ex_20000'), '어떤 직업도 해당 갈래 실적만으로 명성 업적 달성 가능');
      s = fresh('explorer');
      window.careerTestFresh = fresh;
      return results;
    });
    checks.forEach(m => console.log('  ✓ ' + m));
    fs.mkdirSync(OUT, { recursive: true });
    await page.evaluate(() => { G.Loader.hide(); G.Info.open('admiral'); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'hidden-trait.png') });
    assert(await page.locator('.career-trait').isVisible(), '직업 특성 화면 표시');
    await page.evaluate(() => { document.querySelectorAll('.win>.title .x').forEach(x => x.click()); G.Game.state.fleet.fatigue = 20; G.Career.afterDiscovery({ cat: 'geo' }); G.Info.open('admiral'); });
    assert((await page.locator('.career-trait').textContent()).includes('하루 최대 4'), '발현 후 수치 공개');
    await page.screenshot({ path: path.join(OUT, 'revealed-trait.png') });
    await page.evaluate(() => { document.querySelectorAll('.win>.title .x').forEach(x => x.click()); G.Info.open('achv'); });
    assert((await page.locator('.achv-page').textContent()).includes('네 바다의 조화'), '명성 업적 화면 표시');
    await page.locator('.achv-row').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'fame-achievements.png') });
    // 실제 해전의 포격 코드가 기함에만 특성을 적용하는지 관찰한다.
    const battle = await page.evaluate(async () => {
      document.querySelectorAll('.win>.title .x').forEach(x => x.click());
      const s = window.careerTestFresh('soldier'); s.settings.res = .35; s.fleet.discipline = 80;
      s.fleet.ships[0].guns.n = 8; s.loc = { mode: 'sea', lon: -25, lat: 32, heading: 0 };
      await G.Game.ensureGeo(); G.Game.go('battle', { npc: { kind: 'pirate', n: 1, K: 0 } });
      const B = G.Scenes.battle, st = B.runtime(), me = st.myFlag, en = st.enFlag;
      me.x = 0; me.y = 0; me.heading = 0; me.halt = true; me.reload = [0, 0, 0];
      en.x = 0; en.y = 150; en.halt = true; en.guns.n = 0;
      const calls = [], orig = G.Career.accuracy;
      G.Career.accuracy = function (flag, base) { const v = orig(flag, base); calls.push({ flag, base, v }); return v; };
      try { for (let i = 0; i < 8 && !calls.length; i++) B.update(.05); }
      finally { G.Career.accuracy = orig; }
      const result = { calls, revealed: !!(s.career && s.career.revealed.soldier), balls: st.balls.length };
      G.Game.go('title'); return result;
    });
    assert(battle.calls.some(c => c.flag && c.v === .02) && battle.revealed && battle.balls > 0, '실제 기함 포격에 군인 특성 연결');
    checks.push('실제 해전 기함 포격에서 명중률 2%p 발동·포탄 생성 확인');
    assert.deepStrictEqual(errors, [], '브라우저 콘솔 오류');
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ checks, uiChecks: 3, errors }, null, 2));
    console.log('PASS: ' + checks.length + '개 규칙·통합 검사 + 화면 3개, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
