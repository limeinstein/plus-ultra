/* 대가 바뀌면 아버지의 아내들은 아버지를 따라간다 (2026-10-22) — js/systems/maidswap.js · family.js F.succeed
   사용자 보고: 블랑카 왕녀(본처) · 모르간 르 페이(둘째 부인, 배에 탐) → 은퇴하고 첫째 아들에게 물려줌 → 모르간이 함대에 부하로 남아 있고 다시 결혼할 수 있었다.
   · 세대 교체 뒤: 모르간은 함대에 없고 다시 고용·청혼할 수 없다 · 세대 교체 창에 「따라 함께 떠났다」
   · 여급 출신 아내(리스본 이네스)의 술집에는 다른 이름·다른 얼굴의 새 여급 — 처음 보는 사람처럼 맞는다
   · 저장·불러오기 뒤에도 새 여급 그대로 · 옛 저장(이미 대가 바뀐 게임)도 고친다 · 콘솔 오류 0
   node tests/past_wives_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 300 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, T = G.Scenes.city.B.tavern;
      const ui0 = { alert: UI.alert, toast: UI.toast, choose: UI.choose, say: UI.say, ask: UI.ask, confirm: UI.confirm };
      function fresh() {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
        G.Game.state = G.State.newGame({ name: '페르난두', nation: 'PT', job: 'explorer', age: 40, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        const s = G.Game.state; s.flags.prologue = true; s.date = { y: 1560, m: 5, d: 1 }; s.settings.res = 0.5;
        return s;
      }
      const alerts = [];
      UI.alert = async (t) => { alerts.push(String(t)); }; UI.toast = () => {};
      UI.choose = async () => null;
      // ---- 블랑카 왕녀 본처 · 모르간 둘째 부인(배에 탐) · 이네스(리스본 여급) 둘째 부인
      let s = fresh();
      s.player.wife = 'm_princess';
      s.player.wives2 = [{ id: 'w_morgan', kind: 'mate', city: 38, house: false, aboard: true, wed: s.day }, { id: 'm_lis', kind: 'maid', city: 0, house: true, aboard: false, wed: s.day }];
      s.mates.push({ id: 'w_morgan', role: 'none', joined: 15550101, loyal: 90, from: 38 });
      s.flags.gone_w_morgan = 1; s.flags.wed_w_morgan = 1;
      s.maids = s.maids || {}; s.maids.m_lis = { aff: 100, met: 20 };
      const lisbon = G.CITY_DATA[0], oldMaid = T.maidOf(lisbon), oldPic = G.Img.pick(G.Img.chain.maid(oldMaid.id, lisbon));
      out.before = { morgan: s.mates.some(m => m.id === 'w_morgan'), maid: oldMaid.name };
      const son = { name: '주앙', sex: 'm', born: { y: 1540, m: 2, d: 2 }, sk: {}, lg: {}, st: { str: 60, int: 60, mar: 60, cha: 60 }, edu: {}, aboard: true, bond: 70 };
      s.player.kids = [son];
      G.Family.pickStorage = async () => [];
      await G.Family.succeed(son);
      s = G.Game.state;
      const nm = T.maidOf(lisbon), newPic = G.Img.pick(G.Img.chain.maid(nm.id, lisbon));
      out.after = { player: s.player.name, gen: s.player.generation, morgan: s.mates.some(m => m.id === 'w_morgan'), gone: !!s.flags.gone_w_morgan,
        hire: (T.hireList ? T.hireList(G.CITY_DATA[38]) : []).some(m => (m.id || (m.d && m.d.id)) === 'w_morgan'),
        maidId: nm.id, maid: nm.name, oldPic, newPic, alert: alerts.join('\n').match(/[^>]*따라 함께 떠났다[^<]*/) ? alerts.join('\n').match(/[^>]*따라 함께 떠났다[^<]*/)[0] : '' };
      // 새 여급과 이야기
      const said = []; UI.say = async (t) => { said.push(String(t)); }; UI.ask = async () => null;
      G.Game.state.loc = { mode: 'city', city: 0, lon: lisbon.lon, lat: lisbon.lat };
      await T.maid(lisbon, nm);
      out.greet = said[0];
      // ---- 저장 · 불러오기
      const json = G.State.serialize();
      delete G.MAID[nm.id];
      G.Game.state = G.State.deserialize(json);
      out.reload = T.maidOf(lisbon).id === nm.id && T.maidOf(lisbon).name === nm.name && !!G.MAID[nm.id];
      // 또 한 대: 새 여급과 혼인한 아들이 은퇴하면 또 다른 여급
      s = G.Game.state; s.player.wife = nm.id; const grand = { name: '마누엘', sex: 'm', born: { y: 1560, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 60, int: 60, mar: 60, cha: 60 }, edu: {}, bond: 60 };
      s.date = { y: 1585, m: 1, d: 1 }; s.player.kids = [grand];
      await G.Family.succeed(grand);
      const third = T.maidOf(lisbon);
      out.third = { id: third.id, name: third.name, pic: G.Img.pick(G.Img.chain.maid(third.id, lisbon)) };
      window.__mainJson = G.State.serialize(); out.thirdName = third.name;
      // ---- 옛 저장: 이미 대가 바뀐 게임
      s = fresh(); s.player.generation = 2; s.pwMig = 0; delete s.pwMig;
      s.mates.push({ id: 'w_morgan', role: 'none', joined: 15550101, loyal: 90, from: 38 }); s.flags.wed_w_morgan = 1; s.flags.gone_w_morgan = 1;
      s.maids = { m_sev: { aff: 100, met: 9 } };
      s.log = [{ d: 15400101, t: '카르멘과 결혼했다.' }, { d: 15500101, t: '모르간 르 페이를 둘째 부인으로 맞았다.' }, { d: 15600101, t: '페르난두가 은퇴하고 주앙이 뒤를 이었다.' }];
      delete s.maidGen; delete s.tavernMaid;
      G.Family.daily();
      const sev = G.CITY_DATA[7];
      out.old = { morgan: s.mates.some(m => m.id === 'w_morgan'), sev: T.maidOf(sev).name, sevId: T.maidOf(sev).id };
      Object.assign(UI, ui0);
      return out;
    });
    console.log('   ' + JSON.stringify(r.after));
    ok(r.before.morgan && !r.after.morgan && r.after.gone && !r.after.hire, '모르간 르 페이: 세대 교체 뒤 함대에 없고, 술집에서 다시 고용할 수 없다');
    ok(/블랑카 왕녀·모르간 르 페이·이네스/.test(r.after.alert), '세대 교체 창: 「' + r.after.alert.trim() + '」');
    ok(r.after.maidId !== 'm_lis' && r.after.maid !== '이네스' && r.after.newPic && r.after.newPic !== r.after.oldPic, '리스본 술집: 이네스 대신 새 여급 「' + r.after.maid + '」 — 얼굴 ' + r.after.oldPic + ' → ' + r.after.newPic);
    ok(/처음 뵙는 분/.test(r.greet || ''), '새 여급은 처음 보는 사람처럼 맞는다: 「' + r.greet + '」');
    ok(r.reload, '저장·불러오기 뒤에도 그 여급 그대로');
    ok(r.third.id !== r.after.maidId && r.third.name !== r.after.maid && r.third.pic !== r.after.newPic, '다음 대에도 또 다른 여급: ' + r.third.name + ' (' + r.third.pic + ')');
    ok(!r.old.morgan && r.old.sevId !== 'm_sev' && r.old.sev !== '카르멘', '옛 저장도 고친다: 모르간은 함대에서 내리고, 세비야 술집에는 카르멘 대신 ' + r.old.sev);

    // ---------------- 리스본 술집 화면
    await page.evaluate(() => { G.Game.state = G.State.deserialize(window.__mainJson); const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat }; G.Disc.checkCity(0).forEach(d => { s.disc[d.id] = { me: true, found: 15600101 }; }); G.DISCOVERIES.filter(d => d.city === 0).forEach(d => { s.disc[d.id] = { me: true, found: 15600101 }; }); G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 20 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).filter(x => x.offsetParent && x.textContent.trim() === '술집')[0]; if (b) b.click(); else G.Scenes.city.visit('tavern'); });
    for (let i = 0; i < 60; i++) { await page.waitForTimeout(500); if (await page.evaluate(() => !!document.querySelector('.tavern-maid'))) break; if (i % 6 === 5) await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).filter(x => x.offsetParent && x.textContent.trim() === '술집')[0]; if (b && !G.UI.busy()) b.click(); }); if (await page.evaluate(() => G.UI.busy())) await page.keyboard.press('Enter'); }
    const tag = await page.evaluate(() => { const t = document.querySelector('.tavern-maid .tag'); return t ? t.textContent : ''; });
    await page.screenshot({ path: path.join(OUT, 'past_wives_tavern.png') });
    ok(tag && tag.indexOf('이네스') < 0 && tag.indexOf(r.thirdName) >= 0, '리스본 술집에 서 있는 여급: 「' + tag + '」 (그림: ' + path.join(OUT, 'past_wives_tavern.png') + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
