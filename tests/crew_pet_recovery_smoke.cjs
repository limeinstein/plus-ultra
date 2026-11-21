/* 발견 보상 반려동물: 80 경계·하루 10% 한 번·피로/규율 회복·동물별 장면 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/crew-pet-recovery-20261116');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.CrewPets && G.Scenes.sea, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '동물 휴식 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, f = s.fleet, cfg = G.BALANCE.crewPetRecovery, P = G.CrewPets;
      s.settings.res = .35; G.State.save = () => true; G.UI.toast = () => {};
      G.Game.go('sea', { depart: 0 });
      let rolls = [], success = true, pics = [];
      G.U.chance = p => { rolls.push(p); return success; };
      const show = G.FamEv.showPic;
      G.FamEv.showPic = ev => { pics.push(ev.img); return { stop: async () => {} }; };
      G.UI.say = async () => {};
      const reset = () => { s.day++; f.fatigue = 80; f.discipline = 20; f.crew = 100; s.loc.mode = 'sea'; s.player.items = []; };
      const noRoll = [];
      reset(); noRoll.push(!await P.daily());
      s.disc.shiba = { found: true, me: true }; noRoll.push(!await P.daily());
      s.player.storage = [{ id: 'r_shiba_baby' }]; noRoll.push(!await P.daily());
      s.player.items = [{ id: 'cat' }]; noRoll.push(!await P.daily());
      for (const id of ['orangutan', 'gorilla', 'mandrill', 'chimp', 'baboon', 'proboscis', 'tiger']) {
        s.player.items = [{ id: 'r_' + id + '_baby' }]; noRoll.push(!await P.daily());
      }
      s.player.items = [{ id: 'r_shiba_baby' }]; f.fatigue = 79.99; noRoll.push(!await P.daily());
      f.fatigue = 80; s.loc.mode = 'city'; noRoll.push(!await P.daily());
      s.loc.mode = 'sea'; f.crew = 0; noRoll.push(!await P.daily());
      const ignoredRolls = rolls.length;
      reset(); s.player.items = cfg.pets.map(p => ({ id: p.item })); success = false;
      const failed = !await P.daily(); success = true;
      const repeated = !await P.daily(), failRolls = rolls.slice();
      rolls = []; const pets = [];
      for (const p of cfg.pets) {
        reset(); s.player.items = [{ id: p.item }];
        const ok = await P.daily();
        pets.push({ id: p.id, ok, fatigue: f.fatigue, discipline: f.discipline, kept: G.R.hasItem(p.item), image: G.Img.file('crew-pet-events/' + p.id) });
      }
      reset(); s.player.items = [{ id: cfg.pets[0].item }]; f.fatigue = 100; f.discipline = 95;
      await P.daily(); const healthyDiscipline = f.discipline === 95 && f.fatigue === 20;
      reset(); s.player.items = [{ id: cfg.pets[0].item }]; f.discipline = 30; await P.daily(); const boundary = f.discipline === 80;
      reset(); s.player.items = [{ id: cfg.pets[0].item }]; f.discipline = 31; await P.daily(); const aboveBoundary = f.discipline === 31;
      G.FamEv.showPic = show;
      // 실제 일일 항해 처리에서 사건을 호출하는지도 확인한다.
      reset(); s.player.items = [{ id: cfg.pets[0].item }]; f.food = f.water = 1000;
      let integrated = 0; const daily = P.daily;
      P.daily = async () => { integrated++; return false; };
      G.U.chance = () => false; G.UI.alert = async () => {}; G.UI.ask = async () => null; G.UI.confirm = async () => false;
      await G.Scenes.sea.runDay(); P.daily = daily;
      return { noRoll, ignoredRolls, failed, repeated, failRolls, pets, rolls, healthyDiscipline, boundary, aboveBoundary, integrated, pics };
    });
    assert(result.noRoll.every(Boolean) && result.ignoredRolls === 0);
    assert(result.failed && result.repeated); assert.deepStrictEqual(result.failRolls, [.1]);
    assert(result.pets.length === 19 && result.pets.every(p => p.ok && p.fatigue === 20 && p.discipline === 80 && p.kept && p.image), JSON.stringify(result.pets));
    assert(result.rolls.every(p => p === .1));
    assert(result.healthyDiscipline && result.boundary && result.aboveBoundary && result.integrated === 1);
    await page.addStyleTag({ content: '.famscene { transition: none !important; } .famscene.on { opacity: 1 !important; transform: none !important; }' });
    // 각 동물의 실제 액자·대화 연출을 캡처한다. 날짜는 고정하고 성공만 강제한다.
    for (const pet of result.pets) {
      await page.evaluate(id => {
        const s = G.Game.state; s.day++; s.loc.mode = 'sea'; s.fleet.crew = 100; s.fleet.fatigue = 80; s.fleet.discipline = 20;
        s.player.items = [{ id: 'r_' + id + '_baby' }];
        G.U.chance = () => true;
        G.UI.say = async () => { await new Promise(resolve => { window.finishPetShot = resolve; }); };
        window.petShotDone = G.CrewPets.daily();
      }, pet.id);
      await page.waitForFunction(() => window.finishPetShot && document.querySelector('.famscene img')?.complete, null, { timeout: 10000, polling: 100 }).catch(async e => {
        console.log(await page.evaluate(() => ({ mode: G.Game.state.loc.mode, day: G.Game.state.day, roll: G.Game.state.flags.crewPetRollDay, pets: G.CrewPets.available(), finish: !!window.finishPetShot, picture: document.querySelector('.famscene')?.outerHTML, ui: !!document.getElementById('ui') })));
        throw e;
      });
      await page.evaluate(() => { document.querySelector('.famscene').classList.add('on'); G.Scenes.sea.update(0); });
      await page.screenshot({ path: path.join(OUT, pet.id + '.png') });
      await page.evaluate(async () => { const release = finishPetShot; G.UI.say = async () => {}; window.finishPetShot = null; release(); await petShotDone; });
    }
    assert.deepStrictEqual(errors, []);
    console.log('PASS: 동물 19종·대형 동물 제외·피로 80 경계·하루 한 번 10%·피로 20/낮은 규율 80·소지품 유지·일일 항해 연결·장면 19종 캡처·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
