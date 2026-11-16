/* 두 동물 소동: 조합별 소지 조건·하루 한 번 2%·서사와 새 비행·기존 항해 연결 */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT=(process.env.OUT || path.join(ROOT, 'artifacts/crew-pet-antics-20261116'));
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href));
    await page.waitForFunction(() => window.G && G.CrewPets, null, { polling: 100, timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '동물 소동 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, f = s.fleet, P = G.CrewPets;
      s.settings.res = .35; G.State.save = () => true; G.UI.toast = () => {}; G.Game.go('sea', { depart: 0 });
      const show = G.FamEv.showPic, start = P.startFlight; let order = [], rolls = [], succeed = true;
      G.U.chance = p => { rolls.push(p); return succeed; };
      G.U.pick = a => a[0];
      G.FamEv.showPic = ev => { order.push(ev.img); return { stop: async () => { order.push('closed'); } }; };
      G.UI.say = async () => { order.push('say'); };
      P.startFlight = async id => { order.push('flight:' + id); return true; };
      const reset = ids => { s.day++; f.crew = 50; f.fatigue = 80; f.discipline = 20; s.loc.mode = 'sea'; s.player.items = ids.map(id => ({ id: 'r_' + id + '_baby' })); order = []; };
      const cases = [
        ['dog_cat_chase', ['shiba', 'koreancat']], ['parrot_cat_chase', ['parrot', 'koreancat']],
        ['monkey_dog_spat', ['lemur', 'shiba']], ['parrot_teases_monkey', ['budgie', 'lemur']]
      ];
      const results = [];
      for (const [id, ids] of cases) {
        reset(ids); const before = JSON.stringify([f.crew, f.food, f.water, s.player.items]);
        const choices = P.interactionChoices().map(x => x.id), ok = await P.interactionDaily();
        G.U.pick = a => a[a.length - 1]; const male = P.imageKey(id); G.U.pick = a => a[0];
        results.push({ id, choices, ok, image: !!G.Img.file('crew-pet-events/' + id), male, maleFile: !!G.Img.file(male), recovered: f.fatigue === 20 && f.discipline === 80, order: order.slice(), unchanged: before === JSON.stringify([f.crew, f.food, f.water, s.player.items]) });
      }
      reset(['shiba', 'koreancat', 'parrot', 'lemur']); succeed = false; rolls = [];
      await P.interactionDaily(); await P.interactionDaily(); const once = rolls.slice();
      reset(['shiba', 'koreancat']); succeed = true; rolls = []; f.fatigue = 79.99; f.discipline = 0;
      const below = !await P.interactionDaily() && rolls.length === 0;
      f.fatigue = 80; f.discipline = 30; await P.interactionDaily(); const boundary = f.fatigue === 20 && f.discipline === 80;
      reset(['shiba', 'koreancat']); f.fatigue = 100; f.discipline = 31; await P.interactionDaily(); const above = f.fatigue === 20 && f.discipline === 31;
      reset(['shiba']); rolls = []; await P.interactionDaily();
      reset(['shiba', 'mandrill', 'gorilla', 'orangutan', 'chimp']); await P.interactionDaily();
      reset([]); s.player.storage = [{ id: 'r_shiba_baby' }, { id: 'r_koreancat_baby' }]; await P.interactionDaily();
      const noEligibleRolls = rolls.length;
      reset(['shiba', 'koreancat']); s.loc.mode = 'city'; await P.interactionDaily(); const onLandRolls = rolls.length;
      reset(['shiba', 'koreancat']); f.crew = 0; await P.interactionDaily(); const emptyRolls = rolls.length;
      const counts = {}; G.BALANCE.crewPetRecovery.pets.forEach(p => { counts[p.group] = (counts[p.group] || 0) + 1; });
      G.FamEv.showPic = show; P.startFlight = start;
      const daily = P.daily, antics = P.interactionDaily; let recoveryCalls = 0, anticCalls = 0;
      P.daily = async () => { recoveryCalls++; return false; }; P.interactionDaily = async () => { anticCalls++; return false; };
      reset([]); f.food = f.water = 1000; G.U.chance = () => false;
      G.Game.newDay = () => { s.day++; return []; };
      G.UI.alert = async () => {}; G.UI.ask = async () => null; G.UI.confirm = async () => false;
      await G.Scenes.sea.runDay(); P.daily = daily; P.interactionDaily = antics;
      return { results, once, below, boundary, above, noEligibleRolls, onLandRolls, emptyRolls, counts, recoveryCalls, anticCalls };
    });
    assert.deepStrictEqual(result.once, [.02]);
    assert(result.below && result.boundary && result.above);
    assert(result.noEligibleRolls === 0 && result.onLandRolls === 0 && result.emptyRolls === 0);
    assert.deepStrictEqual(result.counts, { dog: 6, cat: 7, bird: 2, monkey: 4 });
    for (const r of result.results) {
      assert(r.ok && r.image && r.maleFile && r.male.endsWith('_men') && r.recovered && r.unchanged); assert.deepStrictEqual(r.choices, [r.id]);
      assert.deepStrictEqual(r.order.slice(0, 4), ['crew-pet-events/' + r.id, 'say', 'say', 'closed']);
      assert(r.order.length === (r.id.startsWith('parrot') ? 5 : 4));
    }
    assert(result.recoveryCalls === 1 && result.anticCalls === 1);
    await page.addStyleTag({ content: '.famscene {transition:none!important}.famscene.on{opacity:1!important;transform:none!important}' });
    for (const r of result.results) {
      for (const gender of ['women', 'men']) {
      await page.evaluate(([id, gender]) => {
        const s = G.Game.state; s.day++; s.loc.mode = 'sea'; s.fleet.crew = 50; s.fleet.fatigue = 80; s.fleet.discipline = 20;
        s.player.items = ['shiba', 'koreancat', 'parrot', 'lemur'].map(x => ({ id: 'r_' + x + '_baby' }));
        G.U.chance = () => true; G.U.pick = a => a.find(x => x.id === id) || (typeof a[0] === 'string' && gender === 'men' ? a[a.length - 1] : a[0]);
        G.UI.say = async () => { await new Promise(resolve => { window.releaseAntic = resolve; }); };
        window.anticDone = G.CrewPets.interactionDaily();
      }, [r.id, gender]);
      await page.waitForFunction(() => window.releaseAntic && document.querySelector('.famscene img')?.complete, null, { polling: 100 });
      await page.evaluate(() => { document.querySelector('.famscene').classList.add('on'); G.Scenes.sea.update(0); G.Scenes.sea.update(0); });
      await page.screenshot({ path: path.join(OUT, r.id + '_' + gender + '.png') });
      await page.evaluate(async () => { const release = releaseAntic; window.releaseAntic = null; G.UI.say = async () => {}; release(); await anticDone; });
      }
    }
    assert.deepStrictEqual(errors, []);
    console.log('PASS: 소동 4종·하루 한 번 2%·기존과 같은 피로 80/규율 30 경계 및 회복·보급/소지품 보존·닫힌 뒤 새 비행·항해 연결·남녀 화면 8종·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
