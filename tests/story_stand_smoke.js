/* 이야기 모드 「아버지의 사진」의 대화창: 사람이 말하면 언제나 무릎상으로 선다 —
   다른 사람이 말해도, 제독이 말해도 그 장면에 마주한 두 사람이 무릎상으로 마주 선다(.dlg-stage.duo, 무릎상 2) — 하나 → 둘 → 얼굴로 바뀌지 않는다.
   예전 흉상 대화창(.dlg > .pframe)은 나오지 않는다 (사람 없는 내레이션만 그림 없는 대화창).
   처음 장면(리스본, 도시 메뉴가 아직 없을 때)부터 대화를 넘기며 확인한다.
   node tests/story_stand_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'story_stand_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => { G.UI.fade = async (fn) => { fn && fn(); }; });
    await page.evaluate(async () => { await G.Game.ensureGeo(); G.Story.start(); G.Game.go('city', { cityId: 0, story: true }); });
    const seen = [], bad = [];
    for (let i = 0; i < 40; i++) {
      // 다음 대화창이나 고를 것이 뜰 때까지
      const ready = await page.waitForFunction(() => document.querySelector('.modal-back .dlg') || null, null, { timeout: 20000 }).then(() => true, () => false);
      if (!ready) break;
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => {
        const box = document.querySelector('.modal-back .dlg'), stage = document.querySelector('.dlg-stage');
        const name = (box.querySelector('.name') || {}).textContent || '';
        const tall = document.querySelectorAll('.dlg-actor.tall').length, bust = document.querySelectorAll('.dlg-actor.bust').length;
        return { name: name.trim(), stage: stage ? (stage.classList.contains('duo') ? 'duo' : 'solo') : null, tall, bust, pframe: !!box.querySelector('.pframe'),
          ask: !!box.querySelector('.askrow button'), text: ((box.querySelector('.body') || {}).innerText || '').slice(0, 30) };
      });
      seen.push(r);
      const person = r.name || r.pframe;
      if (person && (r.pframe || !r.stage || (r.stage === 'duo' && r.tall < 2) || (r.stage === 'solo' && r.tall < 1))) bad.push(r);
      if (i < 30) await page.screenshot({ path: path.join(OUT, String(i).padStart(2, '0') + '_' + (r.stage || 'box') + '.png') });
      if (r.ask) await page.locator('.askrow button').first().click(); else await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
    }
    // 바다·뭍·술집에서도 이야기 대화는 얼굴(흉상)로 바뀌지 않고 무릎상 둘 (바다·뭍의 보통 대화는 얼굴 — main의 한 가지 구도)
    const where = [];
    for (const mode of ['sea', 'land']) {
      await page.evaluate((mode) => { const S = G.Game.state; S.loc = Object.assign({}, S.loc, { mode }); }, mode);
      for (const who of ['mother', 'player']) {
        await page.evaluate((who) => { const sp = who === 'mother' ? G.Story.mother() : { name: G.Game.state.player.name, portrait: G.Game.state.player.portrait, rigId: 'player' }; G.UI.say('시험 한마디', sp); }, who);
        await page.waitForSelector('.modal-back .dlg', { timeout: 10000 }); await page.waitForTimeout(500);
        const r = await page.evaluate(() => ({ tall: document.querySelectorAll('.dlg-actor.tall').length, bust: document.querySelectorAll('.dlg-actor.bust').length, pframe: !!document.querySelector('.modal-back .dlg .pframe') }));
        where.push([mode, who, r.tall, r.bust, r.pframe]);
        await page.screenshot({ path: path.join(OUT, 'z_' + mode + '_' + who + '.png') });
        await page.keyboard.press('Enter'); await page.waitForTimeout(400);
      }
    }
    console.log('    ' + JSON.stringify(where));
    ok(where.every(w => w[2] === 2 && !w[3] && !w[4]), '바다·뭍에서도 이야기 대화는 무릎상 둘 (제독 혼잣말도 방금 마주한 사람과)');
    seen.forEach(r => console.log('    ' + (r.stage || '내레이션') + ' 무릎상' + r.tall + (r.bust ? ' 흉상' + r.bust : '') + ' · ' + (r.name || '—') + ' · ' + r.text.replace(/\s+/g, ' ')));
    ok(seen.length >= 8, '첫 장면부터 대화 ' + seen.length + '개를 넘겼다');
    const people = seen.filter(r => r.name || r.pframe), solo = people.filter(r => r.stage === 'solo');
    ok(people.length && people.every(r => r.stage === 'duo' && r.tall === 2), '사람이 말하는 동안 늘 두 사람이 마주 선다 (무릎상 둘) — 혼자 서는 장면 ' + solo.length + '개');
    ok(!bad.length, '사람이 말하는 대화는 모두 무릎상 (흉상 대화창 없음) ' + JSON.stringify(bad.slice(0, 3)));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join('\n'));
    console.log('OK');
  } catch (e) {
    console.error('FAIL:', e.message); process.exitCode = 1;
    await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {});
  } finally { await browser.close(); }
})();
