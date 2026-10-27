/* 튜토리얼 QA 7건 재현: 팝업 닫기, 건너뛰기(프롤로그·해전·실제 육상전), 보급 취소·확정,
   실제 육상전의 전리품 지급, 해전 일시정지 표시. node tests/tutorial_controls_smoke.js */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.SHOTS || path.join(ROOT, 'tmp', 'tutorial-controls');
fs.mkdirSync(OUT, { recursive: true });
let passed = 0;
function ok(value, message) { assert(value, message); passed++; console.log('  ✓ ' + message); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_|fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => {
    window.createImageBitmap = undefined;
    // 도시의 걷기·대화 연출은 돌리고, 바다·뭍은 시험이 직접 갱신한다.
    let queue = [], n = 0;
    window.requestAnimationFrame = cb => { queue.push(cb); return ++n; };
    setInterval(() => { const q = queue; queue = []; q.forEach(cb => cb(performance.now())); }, 80);
    const Q = window.Q = {};
    Q.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    Q.top = () => [...document.querySelectorAll('#ui .modal-back')].pop();
    Q.text = () => Q.top()?.textContent || '';
    Q.pick = text => { const b = [...(Q.top() || document).querySelectorAll('.btn, .choice')].find(el => el.textContent.trim() === text); if (b) b.click(); return !!b; };
    Q.until = async (condition, picks = [], ms = 45000) => {
      const end = Date.now() + ms;
      while (!condition()) {
        if (Date.now() > end) throw new Error('시간 초과: ' + G.Tutorial.step() + ' / ' + Q.text().slice(0, 180));
        const modal = Q.top();
        if (modal?.querySelector('.dlg') && !modal.querySelector('.askrow')) modal.querySelector('.dlg').click();
        else for (const text of picks) if (Q.pick(text)) break;
        await Q.sleep(25);
      }
    };
    Q.idle = () => !G.UI.busy() && !G.Tutorial.busy() && (G.Game.sceneName !== 'city' || !G.Scenes.city.isBusy());
    Q.start = async (id, city = 7) => {
      await Q.until(Q.idle);
      const s = G.Tutorial.start('조작 시험'); s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0;
      s.flags.prologue = true;
      s.tut.step = G.TUTORIAL.steps.findIndex(st => st.id === id);
      if (id !== 'prologue') { s.tut.f['in_' + id] = 1; s.tut.f['t_' + id] = 1; }
      s.mates.push({id:'lacosa',role:'surveyor',loyal:70},{id:'arana',role:'none',loyal:70});
      s.loc.city = city; s.loc.lon = G.CITY_DATA[city].lon; s.loc.lat = G.CITY_DATA[city].lat;
      G.Game.go('city', {cityId:city});
      await Q.until(() => Q.idle() && (id !== 'prologue' || s.tut.f.t_prologue));
    };
    Q.land = async () => {
      await Q.start('gate', 84);
      G.Game.go('land', {from:84, mount:{id:'horse',n:18}});
      const s = G.Game.state;
      s.tut.step = G.TUTORIAL.steps.findIndex(st => st.id === 'landwar');
      await Q.until(() => !!document.querySelector('.lwar'));
    };
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G?.Tutorial && G.Game.sceneName === 'title', null, {timeout:90000});
    await page.evaluate(async () => { await G.Game.ensureGeo(); G.UI.fade = async fn => fn(); await Q.start('prologue'); });
    // 프롤로그: 취소는 현재 단계 유지, 승인하면 도서관 단계로.
    await page.locator('.tutbox [data-act="skip"]').click();
    await page.getByRole('button', {name:'그만둔다',exact:true}).click();
    ok(await page.evaluate(() => G.Tutorial.step() === 'prologue' && !G.Game.state.tut.f.skip_prologue), '프롤로그 건너뛰기를 취소하면 그대로 유지');
    await page.locator('.tutbox [data-act="skip"]').click();
    await page.getByRole('button', {name:'건너뛴다',exact:true}).click();
    await page.waitForFunction(() => G.Tutorial.step() === 'library');
    await page.waitForFunction(() => [...document.querySelectorAll('.tut-glow')].some(el => el.textContent.includes('도서관')));
    ok(await page.evaluate(() => /거리에서.*도서관/.test(document.querySelector('.tutbox').textContent)), '프롤로그 건너뛰기 → 도서관 단계·거리 안내·도서관 강조');

    await page.evaluate(async () => { await Q.start('depart'); G.Scenes.city.visit('harbor'); await Q.until(Q.idle); });
    await page.locator('.cmd').filter({hasText:'출항 준비'}).click();
    await page.locator('.modal-back .win .x').waitFor();
    const closeHit = await page.locator('.modal-back .win .x').evaluate(el => {
      const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el === hit || el.contains(hit);
    });
    ok(closeHit, '출항 준비 창 ×가 안내판에 가리지 않음');
    await page.screenshot({path:path.join(OUT,'prep-window.png')});
    await page.locator('.modal-back .win .x').click();
    await page.evaluate(async () => { await Q.until(Q.idle); await Q.sleep(750); });
    ok(await page.evaluate(() => !G.Game.state.tut.f.prep_depart && [...document.querySelectorAll('.cmd.tut-glow')].some(el => el.textContent.includes('출항 준비'))), '출항 준비 취소 후에는 준비 완료로 세지 않고 준비 버튼 강조');
    // 보급 확정 후 「아직」은 출항만 미루며 준비는 완료다.
    await page.locator('.cmd').filter({hasText:'출항 준비'}).click();
    await page.getByRole('button', {name:'결정',exact:true}).click();
    await page.evaluate(async () => { await Q.until(() => Q.idle() && G.Game.state.tut.f.prep_depart, ['아직']); });
    ok(await page.evaluate(() => !!G.Game.state.tut.f.prep_depart), '보급을 확정하면 출항을 미뤄도 준비 완료');

    await page.evaluate(async () => {
      await Q.start('battle'); const s = G.Game.state;
      s.loc.mode = 'sea'; s.loc.lon = -6.2; s.loc.lat = 36.1;
      Q.seaBefore = {gold:s.player.gold,crew:s.fleet.crew,wins:s.stats.wins,hp:s.fleet.ships[0].hp};
      G.Game.go('battle', {npc:{kind:'pirate',tut:true,n:1,K:0,ships:['fusta']}});
      await Q.until(() => s.tut.f.battleIn && Q.idle());
    });
    ok(await page.evaluate(() => G.Scenes.battle.runtime().paused) && await page.getByRole('button', {name:'재개',exact:true}).isVisible(), '일시정지 상태로 시작한 해전의 버튼은 「재개」');
    await page.getByRole('button', {name:'재개',exact:true}).click();
    ok(await page.evaluate(() => !G.Scenes.battle.runtime().paused), '재개 버튼이 실제 전투를 재개');
    await page.getByRole('button', {name:'일시정지',exact:true}).click();
    await page.locator('.tutbox [data-act="skip"]').click();
    await page.getByRole('button', {name:'건너뛴다',exact:true}).click();
    await page.evaluate(async () => { await Q.until(() => G.Game.sceneName === 'sea' && G.Tutorial.step() === 'port' && Q.idle()); });
    ok(await page.evaluate(() => {const s=G.Game.state,b=Q.seaBefore;return s.tut.f.skip_battle && s.player.gold===b.gold && s.fleet.crew===b.crew && s.stats.wins===b.wins && s.fleet.ships[0].hp===b.hp;}), '해전 건너뛰기 → 바다·입항 단계, 보상·손실 없음');

    await page.evaluate(() => Q.land());
    await page.locator('.lwar').getByRole('button',{name:'이 단계 건너뛰기',exact:true}).click();
    await page.getByRole('button',{name:'그만둔다',exact:true}).click();
    ok(await page.locator('.lwar').isVisible() && !await page.evaluate(() => !!G.Game.state.tut.f.skip_landwar), '육상전 건너뛰기 취소 시 전투 준비 유지');
    await page.locator('.lwar').getByRole('button',{name:'전투 개시',exact:true}).click();
    await page.locator('.lwar').getByRole('button',{name:'이 단계 건너뛰기',exact:true}).click();
    await page.getByRole('button',{name:'건너뛴다',exact:true}).click();
    await page.evaluate(async () => { await Q.until(() => G.Tutorial.step() === 'find' && Q.idle()); });
    ok(await page.evaluate(() => G.Game.state.tut.f.skip_landwar && G.Game.state.tut.f.lw && !document.querySelector('.lwar') && G.Scenes.land.runtime().busy === 0), '실제 육상전 중 건너뛰기 → 창 정리·발견 단계·바쁨 해제');

    // 승패를 대체하지 않고 실제 전투를 치러, 화면 계산 결과와 지급액을 대조한다.
    await page.evaluate(async () => {
      const real = G.Games.landWar;
      G.Games.landWar = async opt => { const r = await real(opt); Q.fightResult = r; return r; };
      await Q.land(); Q.goldBefore = G.Game.state.player.gold;
    });
    await page.locator('.lwar').getByRole('button',{name:'전투 개시',exact:true}).click();
    await page.evaluate(async () => {
      const end = Date.now()+60000;
      while (G.Tutorial.step() === 'landwar') {
        if(Date.now()>end) throw new Error('실제 육상전 시간 초과');
        const root=Q.top();
        if(root?.querySelector('.lwar')) {
          const b=[...root.querySelectorAll('button')].find(el=>!el.disabled && /몸값을 받는다|^확인$|모두 공격/.test(el.textContent));
          if(b)b.click();
        } else if(root?.querySelector('.dlg')) root.querySelector('.dlg').click();
        await Q.sleep(150);
      }
      await Q.until(Q.idle);
    });
    const loot = await page.evaluate(() => ({r:Q.fightResult,delta:G.Game.state.player.gold-Q.goldBefore}));
    ok(loot.r.res==='win', '실제 튜토리얼 육상전에서 승리');
    ok(loot.delta===loot.r.spoils.gold+(loot.r.spoils.ransom||0), '전리품 '+loot.r.spoils.gold+'닢 + 몸값 '+(loot.r.spoils.ransom||0)+'닢 = 실제 지급 '+loot.delta+'닢');
    ok(!errors.length, '실행 오류·콘솔 오류 0: '+errors.join(' | '));
    console.log('\n통과 '+passed+'건');
  } catch(e) { console.error('✗',e.stack); process.exitCode=1; await page.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{}); }
  finally { await browser.close(); }
})();
