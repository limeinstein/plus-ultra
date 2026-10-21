/* 배에 함께 탄 아이의 하루 (2026-10-21) — js/systems/kidvoyage.js · js/data/kidvoyage.js
   · 자료: 나이(견습·어른) × 성별 × 성격 4 = 16 조합마다 꼭 3가지 (48), id 겹침 없음, 줄 형식·자리표·특기 이름·효과 이름이 맞다, 고르기 둘
   · 성격: 네 가지가 모두 나온다 · 같은 아이는 늘 같은 성격 · 새로 태어난 아이는 성격을 갖고 태어난다 · 정보 창 꼬리표
   · 누가: 배에 탄 12살 이상만 (집에 있는 아이·사라진 아이·11살은 아니다) · 같은 아이는 60일에 한 번 · 한 사건은 한 번만, 셋을 다 겪으면 끝
   · 48가지를 모두 펼쳐 본다 (말 막음) — 글에 자리표가 남지 않고, 효과가 매겨진다
   · 빈도: 3000일 흉내 — 아이 하나가 100일에 한 번 안팎
   · 실제 바다: 하루를 보내면 사건이 일어나고 고르기 창이 뜬다 · 콘솔 오류 0
   node tests/kidvoyage_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const d = await page.evaluate(() => {
      const L = G.KID_VOYAGE, out = { n: L.length, combos: {}, bad: [] }, ids = {};
      const SK = {}; G.SKILLS.forEach(s => { SK[s.id] = 1; });
      const FX = { bond: 1, str: 1, int: 1, mar: 1, cha: 1, sk: 1, fatigue: 1, disc: 1, gold: 1, food: 1 };
      const lineOk = t => /^(k|p|m|n|s)(\[[^\]]+\])?:\S/.test(t) && !/\{(?!(k|me|mate|ship)(:[^}]*)?\})/.test(t);
      L.forEach(e => {
        const c = e.age + '/' + e.sex + '/' + e.temper; out.combos[c] = (out.combos[c] || 0) + 1;
        if (ids[e.id]) out.bad.push('dup ' + e.id); ids[e.id] = 1;
        if (!G.KID_TEMPER[e.temper] || ['young', 'adult'].indexOf(e.age) < 0 || ['m', 'f'].indexOf(e.sex) < 0) out.bad.push('key ' + e.id);
        e.lines.forEach(t => { if (!lineOk(t)) out.bad.push('line ' + e.id + ' ' + t.slice(0, 30)); });
        if (!e.pick || e.pick.opts.length !== 2) out.bad.push('pick ' + e.id);
        (e.pick ? e.pick.opts : []).forEach(o => {
          (o.say || []).forEach(t => { if (!lineOk(t)) out.bad.push('say ' + e.id + ' ' + t.slice(0, 30)); });
          Object.keys(o.fx || {}).forEach(k => { if (!FX[k]) out.bad.push('fx ' + e.id + ' ' + k); });
          Object.keys((o.fx || {}).sk || {}).forEach(k => { if (!SK[k]) out.bad.push('sk ' + e.id + ' ' + k); });
        });
      });
      return out;
    });
    const combos = Object.keys(d.combos);
    ok(d.n === 48 && combos.length === 16 && combos.every(c => d.combos[c] === 3), '사건 48가지 — 나이 2 × 성별 2 × 성격 4 = 16 조합마다 3가지');
    ok(!d.bad.length, '줄 형식·자리표·특기·효과 이름이 모두 맞다 ' + d.bad.slice(0, 5).join(' | '));

    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    await page.waitForTimeout(2000);
    for (let i = 0; i < 30 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }

    const t = await page.evaluate(() => {
      const KV = G.KidVoy, s = G.Game.state, p = s.player, out = {};
      s.date = { y: 1550, m: 6, d: 1 }; s.flags.prologue = true;
      const cnt = { lively: 0, calm: 0, warm: 0, stubborn: 0 };
      for (let i = 0; i < 400; i++) cnt[KV.rollTemper({ st: { str: 40 + (i % 40), int: 40 + ((i * 7) % 40), mar: 40 + ((i * 13) % 40), cha: 40 + ((i * 3) % 40) } }, (i * 0.618) % 1)] += 1;
      out.cnt = cnt;
      const kid = (name, sex, age, aboard, st) => ({ name, sex, born: { y: 1550 - age, m: 1, d: 1 }, sk: {}, lg: {}, st: st || { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, aboard, bond: 50 });
      const a = kid('마테오', 'm', 13, true), b = kid('마테오', 'm', 13, true);
      out.same = KV.temper(a) === KV.temper(b) && KV.temper(a) === KV.temper(a);
      p.kids = [kid('루이스', 'm', 11, true), kid('후아나', 'f', 13, false), kid('이네스', 'f', 14, true), kid('디에고', 'm', 17, true), kid('카탈리나', 'f', 15, true)];
      p.kids[4].lost = 'peter';
      out.ready = KV.ready().map(k => k.name);
      out.tag = G.KidVoy.tag(p.kids[2]);
      out.band = p.kids.map(k => KV.band(k));
      // 새로 태어난 아이 — Family.daily 해산
      p.wife = Object.keys(G.MAID)[0]; p.preg = { since: s.day - 300, due: s.day, told: true, near: true };
      const before = p.kids.length; G.Family.daily();
      out.born = p.kids.length > before ? p.kids[p.kids.length - 1].temper : null;
      return out;
    });
    console.log('   성격 고르기 400번: ' + JSON.stringify(t.cnt) + ' · ' + JSON.stringify(t.band));
    ok(Object.keys(t.cnt).every(k => t.cnt[k] > 40), '네 가지 성격이 고루 나온다');
    ok(t.same, '같은 아이(이름·생일)는 늘 같은 성격 (옛 저장도 불러올 때마다 같다)');
    ok(t.born && G_TEMPER(t.born), '새로 태어난 아이는 성격을 갖고 태어난다 (' + t.born + ')');
    function G_TEMPER(x) { return ['lively', 'calm', 'warm', 'stubborn'].indexOf(x) >= 0; }
    ok(t.ready.join() === '이네스,디에고', '배에 탄 12살 이상만 — 11살·집에 있는 아이·섬에서 사라진 아이는 빠진다 (' + t.ready.join(',') + ')');
    ok(/^ · (활발|차분|다정|고집)$/.test(t.tag), '정보 창 꼬리표 「' + t.tag.trim() + '」');

    // ---------------- 48가지를 모두 펼친다 (말 막음)
    const all = await page.evaluate(async () => {
      const KV = G.KidVoy, UI = G.UI, s = G.Game.state, out = { left: [], fx: 0, n: 0, toast: [] };
      const say0 = UI.say, ask0 = UI.ask, toast0 = UI.toast; let said = [];
      UI.say = async (t, w) => { said.push(t); if (w && w.name) said.push(w.name); };
      let pickN = 0; UI.ask = async (t, ch) => { said.push(t); ch.forEach(c => said.push(c.label)); return (pickN++) % 2; };
      UI.toast = (t) => { out.toast.push(t); };
      s.player.gold = 5000;
      for (const e of G.KID_VOYAGE) {
        const k = { name: e.sex === 'f' ? '이네스' : '디에고', sex: e.sex, born: { y: e.age === 'adult' ? 1532 : 1537, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, aboard: true, bond: 50, temper: e.temper };
        said = []; const b0 = k.bond, st0 = JSON.stringify(k.st) + JSON.stringify(k.sk);
        await KV.play(k, e); out.n++;
        const txt = said.join('\n');
        if (/[{}]|undefined|NaN/.test(txt)) out.left.push(e.id + ': ' + (txt.match(/.{0,20}(\{|\}|undefined|NaN).{0,20}/) || [''])[0]);
        if (k.bond !== b0 || JSON.stringify(k.st) + JSON.stringify(k.sk) !== st0) out.fx++;
        if (!k.voy || !(e.id in k.voy.seen)) out.left.push('seen ' + e.id);
      }
      out.sample = out.toast.filter(x => / — 사이/.test(x)).slice(0, 3);
      UI.say = say0; UI.ask = ask0; UI.toast = toast0;
      return out;
    });
    console.log('   ' + all.sample.join('\n   '));
    ok(all.n === 48 && !all.left.length, '48가지 모두 펼쳐짐 — 글에 자리표·undefined가 남지 않는다 ' + all.left.slice(0, 3).join(' | '));
    ok(all.fx >= 46, '고른 쪽의 효과가 매겨진다 (' + all.fx + '/48)');

    // ---------------- 한 번만 · 60일 · 셋을 다 겪으면 끝
    const g = await page.evaluate(async () => {
      const KV = G.KidVoy, s = G.Game.state, k = s.player.kids[2], out = {};
      const say0 = G.UI.say, ask0 = G.UI.ask; G.UI.say = async () => {}; G.UI.ask = async () => 0;
      out.pool0 = KV.pool(k).length;
      await KV.play(k, KV.pool(k)[0]);
      out.pool1 = KV.pool(k).length; out.gapBlock = KV.ready().indexOf(k) < 0;
      s.day += 60; out.after60 = KV.ready().indexOf(k) >= 0;
      await KV.play(k, KV.pool(k)[0]); s.day += 60; await KV.play(k, KV.pool(k)[0]); s.day += 60;
      out.pool3 = KV.pool(k).length; out.done = KV.ready().indexOf(k) < 0;
      // 어른이 되면 어른의 셋이 열린다
      k.born.y -= 3; out.adult = KV.band(k) + ':' + KV.pool(k).length;
      G.UI.say = say0; G.UI.ask = ask0;
      // 빈도 흉내: 아이 하나, 3000일
      const kk = { name: '시몬', sex: 'm', born: { y: 1520, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, aboard: true, bond: 50 };
      s.player.kids = [kk]; s.loc = { mode: 'sea', lon: -12, lat: 38, heading: 0 }; s.date = { y: 1550, m: 6, d: 1 };
      const play0 = KV.play; let n = 0, days = [];
      KV.play = async (k2, ev) => { n++; days.push(s.day); k2.voy.last = s.day; return true; };   // 겪은 사건을 적지 않아 끝나지 않게
      const r0 = G.U.rng; let seed = 7; G.U.rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const d0 = s.day; for (let i = 0; i < 3000; i++) { s.day = d0 + i; await KV.atSea(); }
      G.U.rng = r0; KV.play = play0;
      out.n = n; out.minGap = days.slice(1).reduce((m, d, i) => Math.min(m, d - days[i]), 9999);
      return out;
    });
    console.log('   ' + JSON.stringify(g));
    ok(g.pool0 === 3 && g.pool1 === 2 && g.gapBlock && g.after60, '한 사건은 한 번만 · 같은 아이는 60일 동안 쉬고 그 뒤 다시');
    ok(g.pool3 === 0 && g.done && g.adult === 'adult:3', '셋을 다 겪으면 끝 — 어른이 되면 어른의 셋이 열린다');
    ok(g.n >= 18 && g.n <= 42 && g.minGap >= 60, '3000일 동안 ' + g.n + '번 (약 ' + Math.round(3000 / g.n) + '일에 한 번) · 가장 짧은 간격 ' + g.minGap + '일');

    // ---------------- 실제 바다에서
    await page.evaluate(() => {
      const s = G.Game.state;
      s.player.kids = [{ name: '이네스', sex: 'f', born: { y: 1536, m: 3, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 70, mar: 50, cha: 50 }, edu: {}, aboard: true, bond: 50, temper: 'calm' }];
      s.settings.res = 0.5; G.Game.go('sea', { depart: 0, fresh: true });
    });
    await page.waitForFunction(() => G.Game.scene === G.Scenes.sea && G.Scenes.sea.runtime(), null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { G.BALANCE.kidVoy.chance = 1; if (G.Pace) G.Pace.reset(); const r = G.U.rng; window.__r = r; window.__done = false;
      G.U.rng = () => 0.5; G.Scenes.sea.runDay().then(() => { window.__done = true; G.U.rng = window.__r; }); });
    let shot = false;
    for (let i = 0; i < 60 && !(await page.evaluate(() => window.__done)); i++) {
      const st = await page.evaluate(() => ({ ask: !!document.querySelector('.askrow button'), txt: (document.querySelector('.dlg') || {}).innerText || '' }));
      if (st.ask) {
        if (!shot && /이네스/.test(await page.evaluate(() => document.body.innerText))) { await page.screenshot({ path: path.join(OUT, 'kidvoyage_sea.png') }); shot = true; }
        await page.evaluate(() => document.querySelector('.askrow button').click());
      } else await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    const r = await page.evaluate(() => { const k = G.Game.state.player.kids[0]; return { seen: Object.keys((k.voy || {}).seen || {}), done: window.__done }; });
    ok(r.done && r.seen.length === 1 && /^yf_c/.test(r.seen[0]) && shot, '바다의 하루 — 차분한 견습 딸 이네스의 사건 「' + r.seen[0] + '」, 고르기 창 (그림: ' + path.join(OUT, 'kidvoyage_sea.png') + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
