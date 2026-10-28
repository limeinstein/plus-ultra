/* 마녀 인원 경계·효과·월급·충성·저장·그림·실제 이벤트 창. node tests/coven_events_smoke.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts', 'coven-qa');
const pageUrl = process.env.PAGE || pathToFileURL(path.join(root, 'index.html')).href;
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {
      if (m.type() === 'error') {
        const where = m.location && m.location().url ? ' @ ' + m.location().url : '';
        errors.push(m.text() + where);
      }
    });
    if (process.env.PAGE) await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/**', route => route.fulfill({ status: 204, contentType: 'application/json', body: '{}' }));
    // 게임 시간은 직접 진행한다. 그림·로딩 화면의 프레임은 정상 실행한다.
    await page.addInitScript(() => { window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16); });
    await page.goto(pageUrl, { waitUntil: 'load' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    const result = await page.evaluate(async () => {
      const checks = [];
      function ok(v, label) { if (!v) throw new Error(label); checks.push(label); }
      await G.Game.ensureGeo();
      G.State.newGame({ name: '마녀시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, C = G.Coven, E = G.COVEN_EVENTS, ids = G.MATES.filter(d => d.witch).map(d => d.id);
      const female = G.MATES.find(d => d.g === 'f' && !d.witch && !d.wd);
      window.covenIds = ids;
      ok(ids.slice(0, 16).every((id, i) => {
        const key = 'portraits/witches/witch_' + String(i + 1).padStart(2, '0');
        return G.MATE[id].face === key && G.Img.has(key) && G.Img.has(key + '_face') && G.Img.has(key + '_half') && G.Img.pick(G.Img.chain.mateHalf(id)) === key + '_half';
      }), '첫 16명 마녀의 전용 얼굴·표정·무릎상 연결');
      function set(n) { s.mates = ids.slice(0, n).map(id => ({ id, role: 'none', loyal: 70 })); s.mates.push({ id: 'rocco', role: 'first', loyal: 70 }); }
      function only(e) { s.coven = { seen: {} }; E.forEach(x => { if (x !== e) s.coven.seen[x.id] = s.day; }); }
      s.player.gold = 10000;
      for (const e of E) {
        set(e.count - 1); only(e); ok(!C.due(), e.count + '명 미만: ' + e.id + ' 없음');
        set(e.count); only(e); ok(C.due() === e, e.count + '명: ' + e.id + ' 발생');
      }
      set(16); delete s.coven;
      ok(C.due().id === 'curse', '옛 저장: 기록 없이 첫 사건 생성');
      s.mates.push({ id: ids[0], loyal: 70 }); ok(C.members().length === 16, '중복 마녀를 한 번만 센다');
      s.loc.mode = 'city'; s.mates[0].hidden = s.loc.city;
      ok(C.members().length === 16, '같은 사람의 유효한 줄이 있으면 한 명으로 센다');
      s.mates.pop(); ok(C.members().length === 15 && !C.freeWage(ids[1]), '숨어 있는 동료는 모임에서 제외');
      set(3); s.player.luck = 50; C.effect(E[0]); ok(s.player.luck === 55, '저주 행운 +5');
      s.player.luck = 98; C.effect(E[0]); ok(s.player.luck === 99, '행운 상한 99');
      ok(Math.abs(G.R.playerLuck() - 0.098) < 1e-9 && (s.player.luck = 50, G.R.playerLuck() === 0), '행운은 바다의 사고를 피할 가능성에 더해진다 (99 → +9.8%, 50 → 0) — 2026-10-28 QA');
      set(5); s.fleet.fatigue = 60; s.fleet.discipline = 30; C.effect(E[1]);
      ok(s.fleet.fatigue === 35 && s.fleet.discipline === 45, '포션 피로 −25·규율 +15');
      s.fleet.fatigue = 2; s.fleet.discipline = 99; C.effect(E[1]); ok(s.fleet.fatigue === 0 && s.fleet.discipline === 100, '포션 수치 범위');
      set(7); s.player.gold = 10000; C.effect(E[2]); ok(s.player.gold === 9500, '파티 소지금 5% 도난');
      s.player.gold = 1000000; C.effect(E[2]); ok(s.player.gold === 997000, '도난 상한 3000');
      s.player.gold = 1; C.effect(E[2]); ok(s.player.gold === 0, '가난할 때 돈이 음수가 되지 않음');
      only(E[2]); ok(!C.due(), '소지금 없으면 파티 보류');
      set(10); s.mates.push({ id: female.id, loyal: 40 }); C.effect(E[3]);
      ok(s.mates.find(m => m.id === 'rocco').loyal === 90 && s.mates[0].loyal === 70 && s.mates[s.mates.length - 1].loyal === 40, '매혹은 남성 동료만 충성 +20');
      C.effect(E[3]); ok(s.mates.find(m => m.id === 'rocco').loyal === 100, '매혹 충성 상한 100');
      only(E[3]); s.coven.seen.charm = s.day - 60; ok(!C.due(), '남성 동료가 모두 충성 100이면 매혹을 다시 열지 않는다 — 2026-10-28 QA');
      s.mates.find(m => m.id === 'rocco').loyal = 90; ok(C.due() === E[3], '충성이 100 아래로 내려가면 매혹이 다시 열린다');
      set(13); G.R.setLoyal(s.mates[0], 10); ok(s.mates[0].loyal === 70, '13명: 충성 하락 차단');
      G.Cabins.monthly(false); ok(s.mates[0].loyal === 70, '선실 미배치 불만도 차단');
      G.R.setLoyal(s.mates[0], 80); ok(s.mates[0].loyal === 80, '결속 중 충성 상승 허용');
      s.player.gold = 0; G.World.newMonth(); ok(s.mates[0].loyal === 80, '급료 체불 충성 하락도 차단');
      s.mates.splice(1, 1); G.R.setLoyal(s.mates[0], 10); ok(s.mates[0].loyal === 10, '12명으로 줄면 결속 해제');
      set(16); const manWage = G.R.mateWage('rocco');
      ok(ids.slice(0, 16).every(id => G.R.mateWage(id) === 0) && G.wageNote(ids[0]) === '품삯 없음', '16명: 마녀만 무급·표시 일치');
      s.fleet.crew = 0; s.player.bank = 0; s.player.gold = 10000;
      G.World.newMonth(); ok(s.player.gold === 10000 - manWage, '실제 월급에서 마녀만 제외');
      s.mates.splice(0, 1); ok(G.R.mateWage(ids[1]) === G.MATE[ids[1]].wage, '15명으로 줄면 원래 급료 복원');
      set(16); s.player.gold = 10000; s.fleet.fatigue = 50; s.fleet.discipline = 50; s.player.luck = 50; s.coven = { seen: {} };
      const savedSay = G.UI.say, savedAlert = G.UI.alert;
      G.UI.say = async () => {}; G.UI.alert = async () => {};
      const played = [];
      for (const e of E) { ok(C.due().id === e.id, '누적 단계 순서: ' + e.id); await C.play(); played.push(e.id); ok(!C.due(), '사건 사이 간격'); s.day += G.BALANCE.coven.gap; }
      const copy = JSON.parse(JSON.stringify(s.coven)); s.coven = copy;
      ok(E.every(e => copy.seen[e.id] != null) && !C.due(), '직렬화 후 완료·재발생 간격 보존');
      s.day += 100; only(E[4]); s.coven.seen[E[4].id] = s.day - 100; ok(!C.due(), '결속은 한 번만 연출');
      only(E[5]); s.coven.seen[E[5].id] = s.day - 100; ok(!C.due(), '무급 선언은 한 번만 연출');
      only(E[0]); s.coven.seen.curse = s.day - 30; ok(C.due().id === 'curse', '반복 사건 재발생');
      G.UI.say = savedSay; G.UI.alert = savedAlert;
      for (const e of E) {
        const key = 'events/witches/' + e.id;
        const im = new Image(); im.src = G.Img.src(key); await im.decode();
        ok(im.naturalWidth > 1500 && Math.abs(im.naturalWidth / im.naturalHeight - 2.25) < 0.02, '이벤트 샷 로딩·화면 비율: ' + e.id);
      }
      for (let i = 0; i < 16; i++) {
        const key = 'portraits/witches/witch_' + String(i + 1).padStart(2, '0') + '_half';
        const im = new Image(); im.src = G.Img.src(key); await im.decode();
        ok(im.naturalWidth === 1024 && im.naturalHeight === 1536, '마녀 무릎상 원본 해상도: ' + (i + 1));
      }
      return { checks, played };
    });
    console.log(result.checks.map(x => '✓ ' + x).join('\n'));
    await page.waitForFunction(() => !G.Loader.shown());
    await page.evaluate(() => {
      G.UI.toast = () => {};
      const s = G.Game.state;
      // 도시 진입 직후의 자동 tick이 아래 전투 차단 검사보다 먼저 사건을 열지 않게 한다.
      // 각 사건은 반복문 안에서 다시 due 상태로 만든다.
      s.coven = { seen: {}, last: s.day };
      G.COVEN_EVENTS.forEach(e => { s.coven.seen[e.id] = s.day; });
      s.settings.res = 0.35;
      G.Game.go('city', { cityId: 0, load: true });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && !!document.querySelector('.city-banner'));
    // 실제 도시 화면에서 자동 발생 경로를 거쳐 여섯 장면을 모두 찍는다.
    for (const id of result.played) {
      await page.evaluate(id => {
        const s = G.Game.state, e = G.COVEN_EVENTS.find(e => e.id === id);
        G.Game.sceneName = 'city'; s.loc.mode = 'city'; s.player.gold = 10000;
        s.mates = window.covenIds.slice(0, 16).map(id => ({ id, role: 'none', loyal: 70 })); s.mates.push({ id: 'rocco', loyal: 70 });
        s.coven = { seen: {} }; G.COVEN_EVENTS.forEach(x => { if (x !== e) s.coven.seen[x.id] = s.day; });
        G.Game.sceneName = 'battle'; G.Coven.tick();
        if (G.Coven.running) throw new Error('전투 중 모임이 끼어듦');
        G.Game.sceneName = 'city'; G.Coven.tick();
        if (!G.Coven.running) throw new Error('자동 발생 실패: ' + id);
      }, id);
      await page.waitForFunction(() => { const im = document.querySelector('.famscene img'); return im && im.complete && im.naturalWidth > 0; });
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(out, id + '.png') });
      for (let step = 0; step < 8 && await page.evaluate(() => !!G.Coven.running); step++) {
        await page.keyboard.press('Enter'); await page.waitForTimeout(300);
      }
      assert.strictEqual(await page.evaluate(() => !!G.Coven.running), false, id + ' 창 정상 종료');
      assert.strictEqual(await page.locator('.famscene').count(), 0, id + ' 그림 정리');
    }
    assert.deepStrictEqual(errors, [], '페이지·콘솔 오류');
    console.log('통과: ' + result.checks.length + '개 확인, 여섯 장면 화면, 콘솔 오류 0. ' + out);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
