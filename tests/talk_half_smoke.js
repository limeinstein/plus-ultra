/* 무릎상 대화 점검: 여급·항해사·후원자와 이야기할 때 두 사람이 마주 서는 구도(dlg-stage duo)인지,
   두 사람 다 무릎상(<그림>_half)이 있을 때만 서 있는 모습(.dlg-actor.tall)으로 크게 나오는지.
   항해사·후원자 무릎상이 아직 없으면 시험에서는 여급 무릎상을 빌린 가짜를 넣어 큰 구도까지 본다.
   주문서: docs/art/talk_half_order.md
   node tests/talk_half_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'talk_half_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  const clear = async () => { for (let i = 0; i < 12 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); } };
  const actors = () => page.evaluate(() => [...document.querySelectorAll('.dlg-stage.duo .dlg-actor')].map(a => ({ side: a.classList.contains('left') ? 'L' : 'R', tall: a.classList.contains('tall') })));
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Sponsor && G.Img, null, { timeout: 90000 });
    const have = await page.evaluate(() => {
      const mates = G.MATES.filter(m => G.Img.has('portraits/mates/' + m.id));
      const sp = Object.keys(G.IMAGE_FILES).filter(k => /^portraits\/sponsors\/[^/]+$/.test(k) && !/_half$/.test(k));
      return { mates: mates.length, mateHalf: mates.filter(m => G.Img.has('portraits/mates/' + m.id + '_half')).length,
        sp: sp.length, spHalf: sp.filter(k => G.Img.has(k + '_half')).length };
    });
    console.log('무릎상: 항해사 ' + have.mateHalf + '/' + have.mates + ' · 후원자 ' + have.spHalf + '/' + have.sp);
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.player.fame = 3000;
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForTimeout(2500); await clear();
    ok(await page.evaluate(() => !!G.Img.pick(G.Img.chain.heroHalf())), '제독 무릎상 있음');

    // 1) 여급 — 둘 다 무릎상이 있으니 크게
    await page.evaluate(() => { const m = G.MAIDS.find(x => x.city === 0); G.Scenes.city.B.tavern.maid(G.CITY_DATA[0], m); });
    await page.waitForTimeout(1500);
    let a = await actors();
    ok(a.length === 2 && a.every(x => x.tall), '여급 대화: 두 사람 다 서 있는 모습 ' + JSON.stringify(a));
    await page.screenshot({ path: path.join(OUT, '1_maid.png') }); await clear();

    // 2) 후원자 — 마주 보는 구도. 무릎상 유무에 따라 크기
    const spInfo = await page.evaluate(() => { const sp = G.SPONSORS.find(s => s.city === 0 && G.Sponsor.present(s)); window._sp = sp; const w = G.Sponsor.speaker(sp); return { id: sp.id, half: G.Img.pick(w.half) }; });
    await page.evaluate(() => { G.UI.say('후원자 시험', G.Sponsor.speaker(window._sp)); });
    await page.waitForTimeout(1200); a = await actors();
    ok(a.length === 2 && a.every(x => x.tall === !!spInfo.half), '후원자 대화: 마주 보는 구도, ' + (spInfo.half ? '무릎상' : '흉상') + ' ' + JSON.stringify(a));
    await clear();
    await page.evaluate(() => { G.UI.ask('제독 쪽 물음', [{ label: '예', value: 1 }, { label: '아니오', value: 0 }], G.Sponsor.me(window._sp)); });
    await page.waitForTimeout(800);
    ok(await page.evaluate(() => !!document.querySelector('.dlg-stage.duo .dlg-actor.left.active')), '제독이 묻는 동안 왼쪽(제독)이 앞에');
    await clear();

    // 3) 항해사 — 술집에서 마주 앉기
    await page.evaluate(() => { const d = G.MATE.elcano || G.MATES[1]; window._mt = d; G.Scenes.city.B.tavern.talkMate(G.CITY_DATA[0], d, true); });
    await page.waitForTimeout(1200); a = await actors();
    ok(a.length === 2, '항해사 대화: 마주 보는 구도 ' + JSON.stringify(a));
    await clear();

    // 4) 가짜 무릎상을 넣으면 항해사·후원자도 크게 선다
    await page.evaluate(() => {
      const fake = G.IMAGE_FILES['portraits/maids/m_lis_half'];
      G.IMAGE_FILES['portraits/mates/' + window._mt.id + '_half'] = fake;
      G.Img.chain.halfOf(G.Sponsor.face(window._sp).portrait.img).forEach(k => { G.IMAGE_FILES[k] = fake; });
      G.Img.reset();
    });
    await page.evaluate(() => { G.Scenes.city.B.tavern.talkMate(G.CITY_DATA[0], window._mt, true); });
    await page.waitForTimeout(1500); a = await actors();
    ok(a.length === 2 && a.every(x => x.tall), '항해사 무릎상이 생기면 서 있는 모습 ' + JSON.stringify(a));
    await page.screenshot({ path: path.join(OUT, '2_mate_fake.png') }); await clear();
    await page.evaluate(() => { G.UI.say('후원자 시험', G.Sponsor.speaker(window._sp)); });
    await page.waitForTimeout(1500); a = await actors();
    ok(a.length === 2 && a.every(x => x.tall), '후원자 무릎상이 생기면 서 있는 모습 ' + JSON.stringify(a));
    await page.screenshot({ path: path.join(OUT, '3_sponsor_fake.png') }); await clear();

    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ': ' + errors.join(' / ') : ''));
    console.log('스크린샷: ' + OUT);
  } catch (e) {
    console.error('✗ ' + e.message); if (errors.length) console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
