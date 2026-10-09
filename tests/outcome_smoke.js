/* 결과 연출(js/ui/outcome.js): 잠입 성공·들킴, 설득(통행 교섭·후원자 교섭·계약) 성공·실패, 청혼 — 움직이는 그림이 뜨는가.
   node tests/outcome_smoke.js  (BROWSER_EXE=크로미움 경로, SHOT_DIR=찍은 그림을 둘 곳) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SHOT = process.env.SHOT_DIR || '/tmp';
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    });
    // ---- 그림 고르기
    const keys = await page.evaluate(() => {
      const O = G.Outcome, p = G.Game.state.player, out = {};
      ['sneak_ok', 'sneak_fail', 'win', 'lose', 'propose'].forEach(k => { out[k] = O.key(k); });
      p.generation = 2; p.heir = { sex: 'f', folder: '' };
      out.f = O.key('win'); out.fp = O.key('propose');
      delete p.heir; p.generation = 1;
      return out;
    });
    ok(['sneak_ok', 'sneak_fail', 'win', 'lose', 'propose'].every(k => keys[k] === 'outcomes/' + k), '다섯 가지 그림이 모두 있다 ' + JSON.stringify(keys));
    ok(keys.f === 'outcomes/win_f' && keys.fp === 'outcomes/propose_f', '뒤를 이은 딸(여자 제독)은 _f 그림');

    // ---- 창이 뜨고, 그림이 처음부터 돌고, 저절로 닫힌다
    const shot = async (kind, opts, name, at) => {
      await page.evaluate(([k, o]) => { window.DONE = false; G.Outcome.show(k, o).then(() => { window.DONE = true; }); }, [kind, opts]);
      await page.waitForFunction(() => { const im = document.querySelector('.oc-pic img'); return im && im.complete && im.naturalWidth > 0; }, null, { timeout: 8000 });
      const info = await page.evaluate(() => { const im = document.querySelector('.oc-pic img'); return { w: im.naturalWidth, h: im.naturalHeight, src: im.src, title: document.querySelector('.oc-title').textContent, sub: (document.querySelector('.oc-sub') || {}).textContent || '' }; });
      await page.waitForTimeout(at);
      await page.screenshot({ path: path.join(SHOT, 'outcome_' + name + '.png') });
      return info;
    };
    const a = await shot('win', { sub: '후원자의 마음을 얻었다' }, 'win', 2900);
    ok(a.w === 480 && a.h === 300 && a.title === '설득 성공!' && a.sub === '후원자의 마음을 얻었다', '설득 성공 창: 480×300 그림 · 「설득 성공!」');
    await page.waitForFunction(() => window.DONE === true, null, { timeout: 6000 });
    ok(!(await page.$('.oc-pic')), '그림이 다 돌면 저절로 닫힌다');
    const b = await shot('win', {}, 'win2', 200);
    ok(b.src !== a.src, '두 번째에는 새 주소로 읽어 처음부터 돈다 (' + a.src.slice(-14) + ' → ' + b.src.slice(-14) + ')');
    await page.waitForTimeout(600);
    await page.mouse.click(40, 40);
    await page.waitForFunction(() => window.DONE === true, null, { timeout: 3000 });
    ok(true, '누르면 바로 닫힌다');
    await shot('lose', { sub: '시시하다며 고개를 돌렸다' }, 'lose', 3300);
    await page.waitForFunction(() => window.DONE === true, null, { timeout: 6000 });
    await shot('sneak_ok', { sub: '알렉산드리아에 몰래 들어갔다' }, 'sneak_ok', 2600);
    await page.waitForFunction(() => window.DONE === true, null, { timeout: 6000 });
    await shot('sneak_fail', { sub: '알렉산드리아의 경비에게 들키고 말았다' }, 'sneak_fail', 3800);
    await page.waitForFunction(() => window.DONE === true, null, { timeout: 6000 });
    await shot('propose', { sub: '이사벨이 반지를 받아 주었다' }, 'propose', 4200);
    await page.waitForFunction(() => window.DONE === true, null, { timeout: 7000 });

    // ---- 게임 흐름에 이어져 있는가 (연출은 짧게)
    const flow = await page.evaluate(async () => {
      const UI = G.UI, s = G.Game.state, O = G.Outcome, U = G.U, out = {};
      Object.keys(O.KINDS).forEach(k => { O.KINDS[k].ms = 60; });
      const seen = []; const keepShow = O.show; O.show = (k, o) => { seen.push(k + (o && o.title ? ':' + o.title : '')); return keepShow(k, Object.assign({}, o, { ms: 60 })); };
      const keep = { say: UI.say, ask: UI.ask, confirm: UI.confirm, alert: UI.alert, choose: UI.choose, toast: UI.toast, rng: U.rng };
      const said = [];
      UI.say = async t => { said.push(t); }; UI.alert = async () => {}; UI.toast = () => {}; UI.confirm = async () => true;
      let askQ = [], chooseQ = [];
      UI.ask = async (t, ch) => (askQ.length ? askQ.shift() : ch[0].value);
      UI.choose = async (t, ch) => (chooseQ.length ? chooseQ.shift() : ch[0] && ch[0].value);
      try {
        const by = n => G.CITY_DATA.find(c => c && c.name === n), alex = by('알렉산드리아'), C = G.Scenes.city;
        s.date.y = 1480; s.player.gold = 50000;
        // 잠입 성공 · 들킴
        askQ = ['sneak']; U.rng = () => 0.01; out.sneakOK = await C.handleEntry(alex); out.k1 = seen.splice(0);
        askQ = ['sneak']; U.rng = () => 0.99; out.sneakNG = await C.handleEntry(alex); out.k2 = seen.splice(0);
        // 통행 교섭 (금화를 건넨다)
        s.player.lg = G.LANGS.map(() => 2);
        const chk = C.entryCheck(alex);
        if (chk && chk.bribe) {
          askQ = ['talk']; U.rng = () => 0.01; out.talkOK = await C.handleEntry(alex); out.k3 = seen.splice(0);
          s.flags['passD' + alex.id] = null; delete s.flags['pass' + alex.id];
        } else out.k3 = ['nobribe'];
        // 후원자 교섭: 자금 증가 성공 → 승낙(계약 성립)
        const sp = G.SPONSORS.find(x => G.Sponsor.present ? G.Sponsor.present(x) : true) || G.SPONSORS[0];
        const d = G.DISC[Object.keys(G.DISC).find(k => G.DISC[k].pw <= 1)];
        s.contract = null; s.player.items = s.player.items.filter(it => it.id !== 'ring');
        askQ = ['nego', 'ok']; chooseQ = ['money']; U.rng = () => 0.01;
        await G.Sponsor.negotiate(sp, d, 1, false); out.k4 = seen.splice(0); out.contract = !!s.contract;
        // 교섭 결렬
        s.contract = null; const rel = G.Sponsor.rel(sp.id); rel.anger = 0;
        askQ = ['nego']; chooseQ = ['time']; U.rng = () => 0.999;
        await G.Sponsor.negotiate(sp, d, 1, false); out.k5 = seen.splice(0); out.contract2 = !!s.contract;
        rel.anger = 0; s.contract = null;
        // 청혼 (본처가 있을 때 여급에게)
        s.player.wife = 'm_lis';
        const maid = G.MAIDS.find(m => m.city !== s.player.home && m.id !== 'm_lis' && G.CITY_DATA[m.city]);
        s.player.items.push({ id: 'ring' });
        out.wed = await G.Wives.proposeMaid(G.CITY_DATA[maid.city], maid, async () => {}); out.k6 = seen.splice(0);
      } finally { Object.assign(UI, { say: keep.say, ask: keep.ask, confirm: keep.confirm, alert: keep.alert, choose: keep.choose, toast: keep.toast }); U.rng = keep.rng; O.show = keepShow; }
      return out;
    });
    ok(flow.sneakOK === true && flow.k1.join() === 'sneak_ok', '잠입 성공 → 「잠입 성공」 그림 ' + JSON.stringify(flow.k1));
    ok(flow.sneakNG === false && flow.k2.join() === 'sneak_fail', '잠입 실패 → 「들켰다」 그림 ' + JSON.stringify(flow.k2));
    ok(flow.k3.join() === 'win:교섭 성공!' || flow.k3.join() === 'nobribe', '통행 교섭 성공 → 승리 그림 ' + JSON.stringify(flow.k3));
    ok(flow.contract && flow.k4.join() === 'win:교섭 성공!,win:계약 성립!', '후원자 교섭 성공 → 승리, 계약 성립 → 승리 ' + JSON.stringify(flow.k4));
    ok(!flow.contract2 && flow.k5.join() === 'lose:교섭 결렬…', '교섭 결렬 → 좌절 그림 ' + JSON.stringify(flow.k5));
    ok(flow.wed === true && flow.k6.join() === 'propose', '청혼 → 청혼 그림 ' + JSON.stringify(flow.k6));
    await page.waitForTimeout(400);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
