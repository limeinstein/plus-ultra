/* 발견물 완성 업적: 분류·마지막 한 발견·실제 발견 경로·중복 보상·옛 저장·그림과 수첩. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'discovery-completion-20261027');
(async () => {
  const browser = await playwright.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Achieve && G.Achieve.collectionPool && G.Game.sceneName === 'title');
    const report = await page.evaluate(async () => {
      const checks = [];
      function ok(v, m) { if (!v) throw new Error(m); checks.push(m); }
      function fresh(only) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.State.newGame({ name: '대백과 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
          st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        const s = G.Game.state; s.settings.res = .35;
        if (only) { s.achv = { _init: 1 }; G.ACHIEVEMENTS.forEach(a => { if (a.id !== only) s.achv[a.id] = { d: 14800101 }; }); }
        return s;
      }
      function fill(s, ids) { ids.forEach(id => { s.disc[id] = { found: 14800101, me: true }; }); }
      const coll = G.ACHIEVEMENTS.filter(a => a.collectionRule);
      let s = fresh();
      ok(coll.length === 13 && new Set(G.ACHIEVEMENTS.map(a => a.id)).size === G.ACHIEVEMENTS.length, '완성 업적 13개·전체 업적 ID 중복 없음');
      ok(coll.every(a => G.ACHV_EVENTS[a.id] && G.SKILL_BY_ID[G.ACHV_EVENTS[a.id].sk]), '13개 업적마다 전용 대사·실제 존재하는 동료 특기 연결');
      const all = G.Achieve.collectionPool('all'), cats = Object.keys(G.DISC_CATS);
      ok(all.length > 1000 && all.length === new Set(all).size, '전체 목록은 현재 등록된 발견물 전체이며 중복 ID 없음');
      ok(cats.every(cat => coll.some(a => a.collectionRule === cat)) && all.every(id => cats.some(cat => G.Achieve.collectionPool(cat).includes(id))), '기본 7갈래가 모든 발견물을 빠짐없이 덮음');
      ok(G.Achieve.collectionPool('plant').includes('bullocho') && G.Achieve.collectionPool('plant').includes(G.PLANTS[0]), '왕실 정원과 같은 식물 판정: 불로초·새 식물 포함');
      ok(!G.Achieve.collectionPool('animal').includes('dragon') && !G.Achieve.collectionPool('animal').includes(G.PLANTS[0]) && G.Achieve.collectionPool('animal').includes('lion'), '동물은 식물·전설 생물과 구별');
      ok(G.Achieve.collectionPool('art').includes('monalisa') && G.Achieve.collectionPool('faith').includes('kaaba') && G.Achieve.collectionPool('myth').includes('atlantis'), '미술품·종교·미신은 기존 관심사 분류 재사용');
      const tales = Object.keys(G.DISC).filter(id => G.DISC[id].tale);
      ok(tales.length > 0 && tales.every(id => !all.includes(id)), '자유 항해에서 찾을 수 없는 이야기 전용 발견물은 요구하지 않음');
      s.story = { found: [] };
      ok(tales.every(id => G.Achieve.collectionPool('all').includes(id)), '이야기 모드에서는 이야기 전용 발견물도 모두 요구');
      delete s.story;
      const late = all.filter(id => G.DISC[id].built > 1600 || G.DISC[id].openY > s.date.y);
      ok(late.length > 0 && late.every(id => all.includes(id)) && all.some(id => (G.DISC[id].need || []).length), '미래 시대·개척 단계·사슬 발견물을 분모에서 누락하지 않음');
      const pools = coll.map(a => ({ id: a.id, name: a.name, type: a.collectionRule, total: G.Achieve.collectionPool(a.collectionRule).length }));
      for (const a of coll) {
        s = fresh(a.id); const ids = G.Achieve.collectionPool(a.collectionRule), last = ids[ids.length - 1];
        fill(s, ids.slice(0, -1));
        s.disc[last] = { found: 14800101, rival: '경쟁자', me: false }; s.hints[last] = { lv: 3 };
        s.disc.retired_fake_id = { found: 14800101, me: true };
        const before = G.Achieve.progress(a);
        ok(ids.length > 0 && before.need === ids.length && before.have === ids.length - 1 && !before.done, a.name + ': 마지막 1개·경쟁자·단서·삭제된 ID는 완성으로 세지 않음');
        s.disc[last] = { me: true }; ok(!G.Achieve.progress(a).done, a.name + ': 발견 날짜 없는 기록은 제외');
        s.disc[last] = { found: 14800101, me: true };
        const gold = s.player.gold, fame = s.player.fame;
        ok(G.Achieve.check().some(x => x.id === a.id) && s.player.gold === gold + a.gold && s.player.fame === fame + a.fame, a.name + ': 마지막 발견으로 완성·정확한 일회성 보상');
        G.Achieve.check();
        G.Game.state = G.State.deserialize(G.State.serialize()); s = G.Game.state; G.Achieve.check();
        ok(G.Achieve.done(a.id) && s.player.gold === gold + a.gold && s.player.fame === fame + a.fame, a.name + ': 재검사·저장 불러오기 중복 보상 없음');
      }
      s = fresh('complete_all'); fill(s, all);
      const extra = { id: 'completion_test_future', cat: 'geo', name: '미래 시험 발견', built: 9999 };
      G.DISC[extra.id] = extra;
      ok(!G.Achieve.progress(G.Achieve.get('complete_all')).done && G.Achieve.progress(G.Achieve.get('complete_all')).need === all.length + 1, '새로 등록한 발견물은 재시작 없이 분모에 반영');
      delete G.DISC[extra.id];
      const originalDisc = G.DISC; G.DISC = {};
      try { ok(!G.Achieve.progress(G.Achieve.get('complete_all')).done && !G.Achieve.progress({ collectionRule: 'invalid' }).done, '빈 목록·잘못된 종류로 자동 달성하지 않음'); }
      finally { G.DISC = originalDisc; }
      const original = [], shown = [], lines = [], pops = [];
      function replace(o, k, f) { original.push([o, k, o[k]]); o[k] = f; }
      replace(G.UI, 'say', async t => { lines.push(t); });
      replace(G.UI, 'window', o => { pops.push(o.html); return { result: Promise.resolve(1), close() {} }; });
      replace(G.FamEv, 'showPic', ev => { shown.push(ev); return { stop: async () => {} }; });
      let stopped = 0; replace(G.FamEv, 'stopPic', async () => { stopped++; });
      replace(G.Scenes, 'discoveryReveal', async () => {}); replace(G.Scenes, 'discoveryCard', async () => {});
      if (G.Names) replace(G.Names, 'offer', async () => {});
      try {
        s = fresh('complete_geo'); const ids = G.Achieve.collectionPool('geo');
        const last = ids.find(id => G.DISC[id].how === 'sea' && !G.DISC[id].need);
        fill(s, ids.filter(id => id !== last)); s.stats.found = ids.length - 1;
        ok(await G.Disc.find(G.DISC[last], 'special') && G.Achieve.done('complete_geo'), '실제 G.Disc.find → afterFind 경로에서 종류 완성 업적 획득');
        ok(shown.some(ev => ev.img === 'achievement-events/complete_geo'), '마지막 발견 직후 전용 업적샷 재생');
        const gold = s.player.gold;
        ok(await G.Disc.find(G.DISC[last], 'special') === false && s.player.gold === gold, '같은 발견을 다시 호출해도 보상 없음');
        shown.length = 0; stopped = 0; pops.length = 0;
        for (const a of coll) await G.Achieve.scene(a);
        ok(shown.length === 13 && stopped === 13 && pops.length === 13 && coll.every((a, i) => shown[i].img === 'achievement-events/' + a.id && pops[i].includes(a.name)), '13개 전용 그림·제목·대사·보상 창·닫힘 정상');
      } finally { original.reverse().forEach(([o, k, v]) => { o[k] = v; }); }
      s = fresh('complete_plant'); fill(s, G.Achieve.collectionPool('plant'));
      delete s.achv._init;
      ok(G.Achieve.daily().some(x => x.text.includes('사계절을 품은 정원')) && G.Achieve.done('complete_plant'), '옛 저장의 기존 발견 기록으로 업적 소급 달성');
      const gold = s.player.gold; G.Achieve.daily(); ok(s.player.gold === gold, '소급 처리도 반복 지급하지 않음');
      // 실제 수첩: 일부 발견·단서·완성한 갈래를 함께 보여 준다.
      s = fresh(); fill(s, all.filter((_, i) => i % 3 === 0)); fill(s, G.Achieve.collectionPool('plant'));
      s.achv = { complete_plant: { d: 14800101 } };
      const missingGeo = G.Achieve.collectionPool('geo').find(id => !G.Disc.foundByMe(id)); s.hints[missingGeo] = { lv: 1 };
      window.completionTestFresh = fresh;
      G.Loader.hide(); G.Info.open('achv');
      return { checks, pools, total: all.length, missingGeo, hiddenGeo: G.Achieve.collectionPool('geo').find(id => !G.Disc.foundByMe(id) && !s.hints[id]) };
    });
    report.checks.forEach(m => console.log('  ✓ ' + m));
    console.log(JSON.stringify({ total: report.total, pools: report.pools }, null, 2));
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify(report, null, 2));
    assert.strictEqual(await page.locator('.ac-card').count(), 13);
    await page.locator('.ac-card img').evaluateAll(ims => ims.forEach(im => { im.loading = 'eager'; }));
    await page.waitForFunction(() => {
      const win = document.querySelector('.achv-page').closest('.win');
      return getComputedStyle(win).opacity === '1' && !document.querySelector('.toast') && Array.from(document.querySelectorAll('.ac-card img')).every(im => im.complete && im.naturalWidth > 0);
    });
    await page.screenshot({ path: path.join(OUT, 'collection-notebook.png') });
    await page.locator('#collection-geo summary').click();
    assert(await page.locator('#collection-geo').evaluate(el => el.open), '카드 펼치기');
    const detail = await page.locator('#collection-geo .ac-detail').textContent();
    const hiddenName = await page.evaluate(id => G.DISC[id].realName || G.DISC[id].name, report.hiddenGeo);
    assert(detail.includes('남은 발견물') && !detail.includes(hiddenName), '단서 없는 발견 이름을 숨긴다');
    await page.screenshot({ path: path.join(OUT, 'collection-remaining.png') });
    await page.evaluate(() => {
      document.querySelectorAll('.win>.title .x').forEach(x => x.click());
      void G.Achieve.scene(G.Achieve.get('complete_all'));
    });
    await page.waitForFunction(() => {
      const box = document.querySelector('.famscene.on'), im = box && box.querySelector('img');
      return im && im.complete && im.src.includes('complete_all') && getComputedStyle(box).opacity === '1';
    });
    await page.waitForFunction(() => document.getElementById('ui').textContent.includes('마지막 발견의 기록을 덮자, 선실 안이 잠시 고요해졌다.'));
    await page.screenshot({ path: path.join(OUT, 'complete-all-in-game.png') });
    const gallery = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await gallery.goto(pathToFileURL(path.join(ROOT, 'docs/art/discovery-completion-shots.html')).href);
    assert(await gallery.locator('img').evaluateAll(ims => ims.length === 13 && ims.every(im => im.complete && im.naturalWidth > 0)), '13장 미리보기 이미지 로딩');
    await gallery.screenshot({ path: path.join(OUT, 'discovery-completion-contact-sheet.png'), fullPage: true });
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('통과 — 발견물 완성 업적 13개·실제 발견·보상·저장·그림·수첩');
  } catch (e) { console.error(e.stack); console.error(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
