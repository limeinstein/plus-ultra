/* 발견 연출 뒤의 대화 (js/scenes/common.js SC.discoveryReveal):
   발견물 그림이 떠 있는 동안 사람들은 무릎상으로 서지 않고, 대화창 안의 얼굴(흉상)로 말한다 — 그림이 사람을 가리지 않게.
   도시·바다·뭍 세 곳에서 확인하고, 대화창과 그림이 겹치지 않는지 잰다. 스크린샷은 OUT 폴더에.
   node tests/disc_talk_face_smoke.js  (BROWSER_EXE=크로미움 경로 · OUT=스크린샷 폴더) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = process.env.OUT || path.join(ROOT, 'tmp', 'disc_talk_face');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '디오구 페헤이라', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: { art: 3, craft: 2 }, lg: [], diff: 'normal' });
      const s = G.Game.state; s.prologueDone = true; s.settings.res = 0.5;
      if (G.SEA_RISK) { G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; }
      if (G.TombDuel) G.TombDuel.pending = () => false;
      s.player.portrait = G.Art.withImg(G.Art.portraitSpec({ seed: 'player0PT', culture: 'med', g: 'm', age: 'young', cloth: '#1e3552', beard: 0 }), G.Img.chain.heroPortrait(s.player));   // 만들기 화면에서 고른 얼굴처럼
    });
    // 세 곳: 도시(리스본) · 바다 · 뭍 — 그림(장면 판·GIF)이 있는 발견물을 갈래별로 하나씩
    const cases = [
      { where: 'city', cat: ['ruin', 'geo'] },
      { where: 'sea', cat: ['geo', 'nature'] },
      { where: 'land', cat: ['ruin', 'creature'] }
    ];
    // 앞 장면의 말·창(바다의 혼잣말·안내 등)이 남아 있으면 모두 닫는다 — 재는 대화와 섞이지 않게
    async function clearDialogs() {
      for (let quiet = 0, i = 0; quiet < 5 && i < 80; i++) {
        const n = await page.evaluate(() => { const bs = [...document.querySelectorAll('.modal-back')]; const b = bs.pop(); if (b) { const bt = b.querySelectorAll('.foot button, .askrow button'); if (bt.length) bt[bt.length - 1].click(); else b.click(); } return bs.length + (b ? 1 : 0); });
        if (n) { quiet = 0; await page.keyboard.press('Enter'); } else quiet++;
        await page.waitForTimeout(200);
      }
    }
    for (const cs of cases) {
      await clearDialogs();
      const id = await page.evaluate(async cs => {
        const s = G.Game.state;
        const d = Object.values(G.DISC).find(d => cs.cat.indexOf(d.cat) >= 0 && G.Scenes.hasReveal(d) && !(s.disc[d.id] && s.disc[d.id].me) && d.id !== 'circum');
        if (cs.where === 'city') { G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 1500)); }
        else if (cs.where === 'sea') { G.Game.go('sea', { depart: 0 }); await new Promise(r => setTimeout(r, 1500)); }
        else { G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 1500)); s.loc.mode = 'land'; }   // 뭍: 조용한 거리 화면 위에서 위치만 뭍으로 (바다의 사건이 끼어들지 않게)
        await new Promise(r => setTimeout(r, 10));
        G.__found = G.Disc.find(d, cs.where === 'land' ? 'land' : 'sea').then(() => 'done', e => 'err ' + e.message);
        return d.id;
      }, cs);
      // 연출이 끝나고 대화가 열리기를 기다렸다가 첫 말과 둘째 말을 잰다
      let measured = [];
      for (let i = 0; i < 200 && measured.length < 2; i++) {
        await page.waitForTimeout(200);
        const probe = () => page.evaluate(() => {
          const rv = document.querySelector('.reveal.talk'); const dlg = [...document.querySelectorAll('.dlg, .dlg-stage')].pop();
          if (!rv || !dlg) { if (document.querySelector('.reveal') && !document.querySelector('.reveal.talk')) document.querySelector('.reveal').click(); return null; }
          const r = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
          const fr = r(rv.querySelector('.rv-frame')), tt = r(rv.querySelector('.rv-title')), box = r(dlg);
          const tall = document.querySelectorAll('.dlg-actor.tall').length, busts = document.querySelectorAll('.dlg-actor').length;
          const face = !!dlg.querySelector('.pframe canvas, .pframe img, .pframe div');
          const name = (dlg.querySelector('.name') || {}).textContent || '';
          return { fr, tt, box, tall, actors: busts, face, name, cls: dlg.className };
        });
        let m = await probe();
        if (m && (!measured.length || measured[measured.length - 1].name !== m.name)) {
          await page.waitForTimeout(1000);   // 그림이 대화 자리로 줄어드는 움직임이 끝난 뒤에 잰다
          m = (await probe()) || m;
          measured.push(m);
          await page.screenshot({ path: path.join(OUT, cs.where + '_' + measured.length + '.png') });
          await page.keyboard.press('Enter');
        } else if (m) { await page.keyboard.press('Enter'); }
      }
      ok(measured.length >= 2, cs.where + ' 「' + id + '」 발견 뒤 대화 ' + measured.length + '마디');
      measured.forEach((m, i) => {
        const overlap = !(m.fr.b <= m.box.t || m.fr.t >= m.box.b || m.fr.r <= m.box.l || m.fr.l >= m.box.r);
        ok(m.tall === 0 && m.actors === 0 && m.face && /\bdlg\b/.test(m.cls) && !overlap,
          cs.where + ' ' + (i + 1) + '번째 말(' + m.name + ')' + (process.env.DBG ? JSON.stringify(m) : '') + ': 무릎상 0 · 대화창 안 얼굴 · 그림(아래 끝 ' + Math.round(m.fr.b) + ')과 대화창(위 끝 ' + Math.round(m.box.t) + ') 안 겹침');
      });
      // 남은 말·창은 넘긴다
      for (let i = 0; i < 120; i++) {
        const st = await page.evaluate(() => G.__found && G.__found.then ? null : null);
        const done = await page.evaluate(() => Promise.race([G.__found, new Promise(r => setTimeout(() => r(null), 100))]));
        if (done) { ok(done === 'done', cs.where + ' 발견 처리 끝 (' + done + ')'); break; }
        await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); if (b) { const bt = b.querySelectorAll('.foot button, .askrow button'); if (bt.length) bt[bt.length - 1].click(); else b.click(); } });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(150);
      }
      // 다음 장면을 위해 대화 상태 정리
      await page.waitForTimeout(400);
      ok(!(await page.evaluate(() => document.getElementById('ui').classList.contains('scenepic-on'))), cs.where + ' 대화가 끝나면 다시 무릎상 구도로 (scenepic-on 걷힘)');
    }
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
    console.log('    스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
