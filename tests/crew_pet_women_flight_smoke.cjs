/* 여자 선원 19종 장면과 대화·액자 종료 뒤의 앵무새 비행 순서·복귀 검증 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT=(process.env.OUT || path.join(ROOT, 'artifacts/crew-pet-women-flight-20261116'));
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href));
    await page.waitForFunction(() => window.G && G.CrewPets, null, { polling: 100, timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '여자 선원과 새 비행 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, P = G.CrewPets, SEA = G.Scenes.sea;
      s.settings.res = .35; G.State.save = () => true; G.UI.toast = () => {};
      G.Game.go('sea', { depart: 0 });
      const pick = G.U.pick, st = SEA.runtime(), cfg = G.FX.crewPetFlight;
      const variants = G.BALANCE.crewPetRecovery.pets.map(p => {
        G.U.pick = a => a[0]; const male = P.imageKey(p.id);
        G.U.pick = a => a[a.length - 1]; const female = P.imageKey(p.id);
        return { id: p.id, male, female, file: !!G.Img.file(female), item: !!G.ITEM[p.item] };
      });
      G.U.pick = a => a[a.length - 1]; G.U.chance = () => true;
      const show = G.FamEv.showPic, start = P.startFlight, sequence = [];
      const check = (value, message) => { if (!value) throw Error(message); };
      const tick = () => new Promise(resolve => setTimeout(resolve, 0));
      for (const id of cfg.birds) {
        delete st.crewPetFlight; const events = [];
        G.FamEv.showPic = () => ({ ready: tick().then(() => { check(!st.crewPetFlight, '그림 준비 중 비행'); events.push('ready'); }), stop: async () => {
          check(!st.crewPetFlight, '액자 종료 전 비행'); events.push('close-start'); await tick(); events.push('close-end');
        } });
        G.UI.say = async () => { check(!st.crewPetFlight, '대화 중 비행'); events.push('say'); await tick(); check(!st.crewPetFlight, '대화 대기 중 비행'); };
        P.startFlight = async bird => { check(events.join(',') === 'ready,say,say,close-start,close-end', '종료 순서'); events.push('flight'); return start(bird); };
        s.day++; s.fleet.fatigue = 80; s.fleet.discipline = 20; s.player.items = [{ id: 'r_' + id + '_baby' }];
        await P.daily(); check(st.crewPetFlight && st.crewPetFlight.id === id, '비행 시작');
        const before = JSON.stringify([s.day, s.fleet.food, s.fleet.water, s.loc]);
        P.step(st, 1, true); check(st.crewPetFlight.t === 0, '다른 대화 중 정지');
        st.speed = 4; st.paused = true; P.step(st, 1, false); check(st.crewPetFlight.t === 1, '실제 초 기준·배 정지 중 비행');
        check(before === JSON.stringify([s.day, s.fleet.food, s.fleet.water, s.loc]), '비행 효과가 항해 상태를 변경');
        const first = P.flightPose(0, 60), last = P.flightPose(cfg.seconds, 60), middle = P.flightPose(cfg.seconds / 2, 60);
        check(Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - last.y) < 1e-6 && middle.y < first.y, '이륙·복귀 경로');
        const img = st.crewPetFlight.image, frames = [], canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d'), draw = ctx.drawImage.bind(ctx);
        ctx.drawImage = function () { frames.push([arguments[1], arguments[2]]); return draw.apply(null, arguments); };
        for (let i = 0; i < 8; i++) { st.crewPetFlight.t = i * cfg.frameMs / 1000; P.drawFlight(st, ctx, [128, 200], 60); }
        check(new Set(frames.map(f => f.join(','))).size === 8, '여덟 날갯짓 프레임');
        P.step(st, cfg.seconds, false); check(!st.crewPetFlight, '복귀 후 효과 정리');
        sequence.push({ id, events, dimensions: [img.width, img.height] });
      }
      G.FamEv.showPic = show; P.startFlight = start; G.U.pick = pick;
      check(!await P.startFlight('shiba') && !await P.startFlight('lemur'), '날지 않는 동물');
      return { variants, sequence };
    });
    assert(result.variants.length === 19 && result.variants.every(p => p.file && p.item && p.male.endsWith('/' + p.id) && p.female.endsWith('/' + p.id + '_women')));
    assert(result.sequence.length === 2);
    await page.addStyleTag({ content: '.famscene { transition:none!important; } .famscene.on { opacity:1!important; transform:none!important; }' });
    for (const pet of result.variants) {
      await page.evaluate(id => {
        const s = G.Game.state, st = G.Scenes.sea.runtime(); delete st.crewPetFlight;
        s.day++; s.loc.mode = 'sea'; s.fleet.crew = 100; s.fleet.fatigue = 80; s.fleet.discipline = 20; s.player.items = [{ id: 'r_' + id + '_baby' }];
        G.U.pick = a => a[a.length - 1]; G.U.chance = () => true;
        G.UI.say = async () => { await new Promise(resolve => { window.releasePet = resolve; }); };
        window.petDone = G.CrewPets.daily();
      }, pet.id);
      await page.waitForFunction(() => window.releasePet && document.querySelector('.famscene img')?.complete, null, { polling: 100 });
      await page.evaluate(() => { document.querySelector('.famscene').classList.add('on'); G.Scenes.sea.update(0); });
      await page.screenshot({ path: path.join(OUT, pet.id + '_women.png') });
      await page.evaluate(async () => { const release = releasePet; window.releasePet = null; G.UI.say = async () => {}; release(); await petDone; });
    }
    for (const id of ['parrot', 'budgie']) {
      await page.evaluate(async id => { await G.CrewPets.startFlight(id); G.Scenes.sea.runtime().paused = true; }, id);
      for (const [name, seconds] of [['takeoff', .7], ['circle', 3], ['return', 7.5]]) {
        await page.evaluate(t => { G.Scenes.sea.runtime().crewPetFlight.t = t; G.Scenes.sea.update(0); G.Scenes.sea.update(0); }, seconds);
        await page.screenshot({ path: path.join(OUT, id + '_' + name + '.png') });
      }
    }
    const cleaned = await page.evaluate(() => { G.Scenes.sea.exit('city'); return !G.Scenes.sea.runtime().crewPetFlight; });
    assert(cleaned); assert.deepStrictEqual(errors, []);
    console.log('PASS: 남녀 그림 38종 선택·여자 장면 19종 캡처·두 대화와 액자 종료 후 비행·새 2종 8프레임·이륙/회전/복귀·시간/보급 보존·장면 종료 정리·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
