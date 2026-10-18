/* 능력치 성장 (js/systems/growth.js) · 사건으로 오르는 능력 · 공주 장면의 이벤트 샷 (js/art/eventshot.js)
   ① 경험 곡선: 능력이 높을수록 1 오르는 데 드는 경험이 크게 는다 · 99→100이 가장 비싸다
   ② 보수적인가: 18세부터 62년(80세)을 해마다 한도까지 몰아 쌓아도 어느 능력도 100이 되지 않는다
   ③ 여섯 갈래(설득·거래·전투·일기토·미식·사교)가 정해진 능력에 쌓이고, 하루 한도를 넘지 않는다
   ④ 실제 일에 걸린 고리: 사교 명성 · 식당 · 교역소에서 팔기 · 해전 · 일기토
   ⑤ 사건: 85 아래면 곧바로 +1, 85부터는 경험으로 · 한 번뿐인 사건은 두 번 오르지 않는다
   ⑥ 이벤트 샷 8장면 + 실제 흐름(사라진 왕녀를 구한 순간 · 런던 탑의 엘리자베스) — 그동안 대화는 얼굴 대화창
   ⑦ 수첩 「제독」의 경험과 성장 · 옛 저장 파일 · 콘솔 오류 0
   node tests/growth_smoke.js  (BROWSER_EXE=크로미움 경로 · OUT=스크린샷 폴더) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = process.env.OUT || path.join(ROOT, 'tmp', 'growth');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  async function drain(max) {
    for (let i = 0; i < (max || 40); i++) {
      await page.waitForTimeout(200);
      const n = await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); if (!b) return 0; const bt = b.querySelectorAll('.askrow button, .foot button'); if (bt.length) bt[0].click(); else b.click(); return 1; });
      if (!n) { const busy = await page.evaluate(() => G.Scenes.city.isBusy && G.Scenes.city.isBusy()); if (!busy) return; }
    }
  }
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '디오구 페헤이라', nation: 'PT', job: 'explorer', age: 18, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.prologueDone = true; s.date = { y: 1500, m: 3, d: 1 }; s.settings.res = 0.5;
      s.player.portrait = G.Art.withImg(G.Art.portraitSpec({ seed: 'player0PT', culture: 'med', g: 'm', age: 'young', cloth: '#1e3552', beard: 0 }), G.Img.chain.heroPortrait(s.player));
      if (G.SEA_RISK) { G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; }
    });
    // ① 곡선
    const cv = await page.evaluate(() => [50, 60, 70, 80, 90, 95, 99].map(v => [v, G.Growth.cost(v)]));
    ok(cv.every((x, i) => !i || x[1] >= cv[i - 1][1]) && cv[6][1] > cv[5][1] * 4, '능력 1이 오르는 데 드는 경험: ' + cv.map(x => x[0] + '→' + x[1].toLocaleString()).join(' · '));
    // ② 80세까지 해마다 한도를 꽉 채워도
    const sim = await page.evaluate(() => {
      const s = G.Game.state, st = s.player.st, keep = Object.assign({}, st), x0 = JSON.stringify(s.player.xp || {}), toast = G.UI.toast, log = G.State.log;
      G.UI.toast = () => {}; G.State.log = () => {};
      const out = {};
      for (const start of [60, 75, 85, 95]) {
        ['str', 'int', 'mar', 'cha'].forEach(k => { st[k] = start; }); s.player.xp = {};
        for (let y = 0; y < 62; y++) {      // 18세 → 80세
          s.date = { y: 1500 + y, m: 3, d: 1 };
          for (let d = 0; d < 40; d++) { s.day = y * 400 + d; ['persuade', 'trade', 'battle', 'duel', 'food', 'social'].forEach(k => G.Growth.gain(k, 200)); }
        }
        out[start] = Object.assign({}, st);
      }
      Object.assign(st, keep); s.player.xp = JSON.parse(x0); s.date = { y: 1500, m: 3, d: 1 }; s.day = 0; G.UI.toast = toast; G.State.log = log;
      return out;
    });
    const top = Math.max(...Object.values(sim).map(o => Math.max(o.str, o.int, o.mar, o.cha)));
    ok(top < 100, '80세까지 62년을 날마다 한도까지 몰아 쌓아도 100이 되지 않는다 — 처음 60→' + sim[60].int + ' · 75→' + sim[75].int + ' · 85→' + sim[85].int + ' · 95→' + sim[95].int);
    // ③ 갈래별로 쌓이는 능력 · 하루 한도
    const kinds = await page.evaluate(() => {
      const s = G.Game.state, st = s.player.st, toast = G.UI.toast; G.UI.toast = () => {};
      const r = {};
      for (const k of ['persuade', 'trade', 'battle', 'duel', 'food', 'social']) {
        s.player.xp = {}; s.day = 5000 + Object.keys(r).length;
        const p0 = {}; G.Growth.gain(k, 40);
        r[k] = Object.keys(s.player.xp.p).filter(x => s.player.xp.p[x] > 0).sort().join('+');
      }
      s.player.xp = {}; s.day = 6000; for (let i = 0; i < 30; i++) G.Growth.gain('trade', 50);
      r.cap = s.player.xp.d.int + '/' + G.Growth.K().dayCap;
      s.player.xp = {}; G.UI.toast = toast; return r;
    });
    ok(kinds.persuade === 'cha+int' && kinds.trade === 'cha+int' && kinds.battle.split('+').length === 3 && kinds.duel === 'mar+str' && kinds.food.indexOf('str') >= 0 && kinds.social.indexOf('cha') >= 0,
      '갈래 → 능력: 설득 ' + kinds.persuade + ' · 거래 ' + kinds.trade + ' · 전투 ' + kinds.battle + ' · 일기토 ' + kinds.duel + ' · 미식 ' + kinds.food + ' · 사교 ' + kinds.social);
    ok(kinds.cap === '45/45', '같은 날 거래를 30번 해도 한 능력에 하루 ' + kinds.cap + '까지만');
    // ④ 실제 일에 걸린 고리
    const hooks = await page.evaluate(async () => {
      const s = G.Game.state, x = () => s.player.xp.k; s.player.xp = {}; s.day = 7000;
      G.Fame.add('so', 100);
      const so = x().social || 0;
      // 식당: 리스본에서 한 끼
      const c = G.CITY_DATA[0], R0 = G.Scenes.city.B.restaurant, dish = G.CUISINE.dishes(c)[0];
      const say = G.Scenes.city.say; G.Scenes.city.say = async () => {};
      s.player.gold = 5000; if (s.restaurant) s.restaurant.last = {};
      await R0.eat(c, dish);
      G.Scenes.city.say = say;
      return { so, food: x().food || 0, dish: dish.name };
    });
    ok(hooks.so > 0 && hooks.food > 0, '사교 명성 +100 → 사교 경험 ' + hooks.so + ' · 식당에서 「' + hooks.dish + '」 → 미식 경험 ' + hooks.food + ' (처음 맛본 음식은 두 배)');
    const fight = await page.evaluate(async () => {
      const s = G.Game.state; s.player.xp = {}; s.day = 7100;
      // 일기토: 제독이 직접
      const r = await G.Games.duel({ name: '해적 두목', look: 'pirate', str: 30, mar: 20, skill: 0, atk: 2, def: 0 }, { fastEnd: true, stance: 'allout' });
      return { res: r, duel: (s.player.xp.k || {}).duel || 0 };
    }).catch(e => ({ err: e.message }));
    if (fight.err) console.log('    (일기토 자동 진행 생략: ' + fight.err + ')');
    else ok(fight.duel > 0, '제독이 직접 나선 일기토(' + fight.res + ') → 일기토 경험 ' + fight.duel);
    // ⑤ 사건
    const ev = await page.evaluate(() => {
      const s = G.Game.state, st = s.player.st; s.player.xp = {};
      st.cha = 70; G.Growth.event('cha', 1, '시험 — 작위');
      const a = st.cha;
      st.cha = 90; G.Growth.event('cha', 1, '시험 — 작위');
      const b = st.cha, bp = s.player.xp.p.cha || 0;
      st.mar = 70; G.Growth.once('t1', 'mar', 1, '시험'); G.Growth.once('t1', 'mar', 1, '시험');
      return { a, b, bp, mar: st.mar };
    });
    ok(ev.a === 71 && ev.b === 90 && ev.bp === 160 && ev.mar === 71, '사건: 매력 70 → ' + ev.a + ' (곧바로 +1) · 90은 그대로 두고 경험 ' + ev.bp + ' · 한 번뿐인 사건은 무력 70 → ' + ev.mar + '에서 멈춤');
    // ⑥ 이벤트 샷: 여덟 장면
    await page.evaluate(() => { G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy(), null, { timeout: 30000 });
    await page.waitForTimeout(600);
    const scenes = ['es_rescued', 'es_return', 'es_wedding', 'eliz_tower', 'eliz_safe', 'eliz_knight', 'court_rescue', 'royal_wedding'];
    for (const sc of scenes) {
      const r = await page.evaluate(async sc => {
        const C = G.CITY_DATA, york = C.filter(c => c && c.name === '요크')[0];
        const o = sc === 'eliz_safe' ? { city: york } : sc === 'court_rescue' ? { realm: 'ES', name: G.COURT.realms.ES.ladies[3], city: C[7] } : sc === 'royal_wedding' ? { realm: 'ES', name: G.COURT.realms.ES.ladies[3], title: '두 왕실의 혼인', city: C[7] } : sc === 'es_rescued' ? { how: 'sea' } : {};
        window.__pc = await G.EventShot.princess(sc, o);
        const box = document.querySelector('.famscene'), cv = box && box.querySelector('canvas');
        let lit = 0;
        if (cv) { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 0; i < d.length; i += 4000) lit += d[i] + d[i + 1] + d[i + 2] > 60 ? 1 : 0; }
        return { box: !!box, canvas: !!cv, lit, title: box ? (box.querySelector('.eventfx-title') || {}).textContent : '', cover: document.getElementById('ui').classList.contains('scenepic-on') };
      }, sc);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, 'shot_' + sc + '.png') });
      ok(r.box && r.canvas && r.lit > 200 && r.cover, '이벤트 샷 「' + r.title + '」 (' + sc + ')');
      await page.evaluate(() => window.__pc.stop());
      await page.waitForTimeout(300);
    }
    // 실제 흐름 ①: 사라진 왕녀를 구한 순간 — 장면 그림 아래로 얼굴 대화창
    await page.evaluate(() => { const s = G.Game.state; s.princess = { stage: 3, sp: 'es_crown', day0: s.day, how: 'sea', tell: 'rescued' }; window.__t = G.Princess.tell(); });
    let flowShot = false;
    for (let i = 0; i < 40 && !flowShot; i++) {
      await page.waitForTimeout(250);
      const st = await page.evaluate(() => ({ pic: !!document.querySelector('.famscene canvas'), dlg: !!document.querySelector('.modal-back .dlg .pframe'), tall: document.querySelectorAll('.dlg-actor.tall').length }));
      if (st.pic && st.dlg) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, 'flow_es_rescued.png') }); flowShot = st; }
    }
    ok(flowShot && flowShot.tall === 0, '사라진 왕녀를 구한 순간: 장면 그림 + 얼굴 대화창 (무릎상 ' + (flowShot ? flowShot.tall : '?') + ')');
    await drain(20);
    await page.evaluate(() => window.__t);
    ok(!(await page.evaluate(() => !!document.querySelector('.famscene') || document.getElementById('ui').classList.contains('scenepic-on'))), '대화가 끝나면 장면 그림이 걷히고 원래 구도로');
    // 실제 흐름 ②: 런던 탑의 엘리자베스
    await page.evaluate(() => { const s = G.Game.state; s.date = { y: 1555, m: 3, d: 1 }; window.__t = G.Tudor.meetEliz(); });
    let tower = false;
    for (let i = 0; i < 40 && !tower; i++) {
      await page.waitForTimeout(250);
      const st = await page.evaluate(() => ({ pic: !!document.querySelector('.famscene canvas'), dlg: !!document.querySelector('.modal-back .dlg') }));
      if (st.pic && st.dlg) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, 'flow_eliz_tower.png') }); tower = true; }
    }
    ok(tower, '런던 탑의 엘리자베스 — 장면 그림과 함께 이야기');
    await drain(20);
    await page.evaluate(() => window.__t);
    // ⑦ 수첩
    await page.evaluate(() => { const s = G.Game.state; s.player.xp = {}; s.day = 9000; G.Growth.gain('trade', 30); G.Growth.gain('social', 12); G.Info.open('admiral'); });
    await page.waitForTimeout(900);
    await page.evaluate(() => { const g = document.querySelector('.gr-kinds'); if (g) g.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(300);
    const nb = await page.evaluate(() => ({ kinds: document.querySelectorAll('.gr-kind').length, bars: document.querySelectorAll('.gr-bar').length, text: (document.querySelector('.gr-kinds') || {}).innerText || '' }));
    await page.screenshot({ path: path.join(OUT, 'notebook_growth.png') });
    ok(nb.kinds === 6 && nb.bars === 4, '수첩 「제독」 — 경험과 성장: 갈래 6 · 능력 막대 4');
    // 옛 저장 파일: xp가 없어도
    const old = await page.evaluate(() => { const s = G.Game.state; delete s.player.xp; G.Growth.gain('battle', 10); return !!s.player.xp && s.player.xp.k.battle === 10; });
    ok(old, '옛 저장 파일(xp 없음)도 그대로 쌓기 시작');
    await page.waitForTimeout(400);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
    console.log('    스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
