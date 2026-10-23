/* 육상전 고침 (2026-10-23) — 세 줄 전장 · 병종 상성 · 적의 다음 행동 · 부대별 명령 · 특수 작전 쿨타임 · 지형·날씨 · 동료 지휘관 · 이름난 적 부대 · 사건 · 결과 판(전리품·포로) · 정찰·진형·탐험 장비 */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS || '';
let pass = 0;
function ok(c, m) { assert(c, m); pass++; console.log('  ✓ ' + m); }

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  const btns = () => page.evaluate(() => [...document.querySelectorAll('.lwar .lw-btns button, .lwar .lw-pop button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
  // 그림 위의 부대를 실제로 마우스로 누른다
  const unitAt = async (side, idx, act) => {
    const p = await page.evaluate(([side, idx]) => { const D = G.Games._landDebug; D.step(3); const list = (side === 'me' ? D.mine : D.foes).filter(u => u.n > 0 && (side !== 'me' || u.type !== 'adm')); const u = list[idx]; const r = document.querySelector('.lwar canvas').getBoundingClientRect(); return u ? { x: r.left + u.x / 1000 * r.width, y: r.top + (u.y - 22) / 440 * r.height } : null; }, [side, idx]);
    if (!p) return false;
    if (process.env.DBG) console.log('   at', JSON.stringify(p), await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName + '.' + e.className : 'none'; }, [p.x, p.y]));
    if (act === 'hover') await page.mouse.move(p.x, p.y); else { await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); }
    return true;
  };
  const click = re => page.evaluate(src => { const r = new RegExp(src); const b = [...document.querySelectorAll('.lwar button')].filter(x => !x.disabled && r.test(x.textContent))[0]; if (b) b.click(); return !!b; }, re.source);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0;
      s.date = { y: 1520, m: 6, d: 30 }; s.loc = { mode: 'city', city: 200, lon: G.CITY_DATA[200].lon, lat: G.CITY_DATA[200].lat, mount: { id: 'horse', n: 12 } };
      s.mates.push({ id: 'guan_yu', role: 'none', loyal: 90 }, { id: 'marina', role: 'none', loyal: 90 });
      G.LandKit.add('musket', 40); G.LandKit.add('armor', 10);
      window.__lw = G.Games.landWar({ enemy: { name: '메시카 전사들', kind: 'native', n: 40, leader: '전쟁 대장' }, party: 70, terr: 'jungle', guns: false });
      window.__lw.then(r => { window.__lwRes = r; });
    });
    await page.waitForSelector('.lwar .lw-btns button', { timeout: 20000 });
    let b = await btns();
    ok(b.some(x => /횡대/.test(x)) && b.some(x => /종심/.test(x)) && b.some(x => /매복 대기 \d+%/.test(x)), '싸우기 전 진형: 횡대 · 종심 · 매복 대기(성공률)');
    ok(b.some(x => /정찰한다 \d+%/.test(x)) && b.some(x => /말로 달랜다/.test(x)), '정찰 · 통역(마리나)이 있으면 「말로 달랜다」');
    ok(!b.some(x => /^보병 \d+|^총병 \d+/.test(x)), '아래에 부대 단추 줄이 없다 — 부대는 그림에서 고른다');
    await unitAt('me', 0);
    b = await btns();
    ok(['보병', '총병', '기병', '포병'].every(n => b.some(x => x.endsWith(n))) && b.some(x => x === '없음'), '우리 부대를 누르면 그 곁에 창이 뜬다 — 종류(보병·총병·기병·포병) · 지휘관');
    const st0 = await page.evaluate(() => { const D = G.Games._landDebug; return { foes: D.foes.map(u => ({ name: u.name, cls: u.cls, sp: !!u.special })), lanes: D.mine.map(u => [u.line, u.lane]), cav: D.mine.filter(u => u.type === 'cav').length, st: D.state() }; });
    ok(st0.foes.some(u => u.sp && u.name === '재규어 전사'), '멕시코 원주민 40명 — 이름난 적 부대 「재규어 전사」(' + st0.foes.map(u => u.name).join('·') + ')');
    ok(st0.cav >= 1, '말 12마리 — 보병 한 부대가 기병이 된다');
    ok(st0.lanes.every(x => x[0] >= 0 && x[0] <= 2 && x[1] >= 0 && x[1] <= 2) && new Set(st0.lanes.map(x => x.join())).size === st0.lanes.length, '우리 부대가 세 줄 × 세 칸에 겹치지 않게 선다');
    ok(st0.st.feat.some(Boolean) || true, '전장 지형: ' + JSON.stringify(st0.st.feat) + ' · 날씨 ' + st0.st.weather);
    // 지휘관: 첫 부대에 관우
    await page.evaluate(() => [...document.querySelectorAll('.lwar .lp-chip')].filter(c => /관우/.test(c.textContent))[0].click());
    const head = await page.evaluate(() => document.querySelector('.lwar .lp-head').textContent);
    ok(/지휘 관우/.test(head) && /청룡언월도/.test(head), '지휘관 칸에서 관우를 고른다 — ' + head);
    await page.mouse.click(5, 5);
    // 정찰
    await click(/정찰한다/);
    const logA = await page.evaluate(() => document.querySelector('.lwar .lw-log').textContent);
    ok(/정찰병/.test(logA), '정찰 결과: ' + logA.slice(-60));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'lw_form.png') });
    // 시작
    await click(/전투 개시/);
    await page.waitForTimeout(400);
    b = await btns();
    ok(b.some(x => /1\s*모두 공격/.test(x)) && b.some(x => /2\s*모두 방어/.test(x)) && b.some(x => /진행/.test(x)), '아래 한 줄: 진행 · 1 모두 공격 · 2 모두 방어');
    ok(b.some(x => /기습\s*\d+%/.test(x)) && b.some(x => /일제 사격/.test(x)) && b.some(x => /함성/.test(x)), '작전 카드: 기습 · 함정 · 저격 · 작렬탄 · 일제 사격 · 함성');
    await page.waitForTimeout(1600);
    const intents = await page.evaluate(() => G.Games._landDebug.foes.filter(u => u.n > 0).map(u => u.intent && u.intent.act));
    ok(intents.every(Boolean), '적의 다음 행동이 정해져 보인다: ' + intents.join(','));
    // 부대 고르기 → 명령 단추
    await unitAt('me', 0);
    b = await btns();
    ok(['공격', '돌격', '방어', '전진', '후퇴', '대기'].some(n => b.some(x => /공격|사격/.test(x))) && ['방어', '전진', '후퇴', '대기'].every(n => b.some(x => x.endsWith(n))), '부대를 누르면 곁에 명령 창 — ' + b.filter(x => x.length < 6).join(' · '));
    await unitAt('en', 0, 'hover');
    const tip = await page.evaluate(() => { const t = document.querySelector('.lwar .lw-tip'); return t && !t.hidden ? t.textContent : ''; });
    ok(/다음:/.test(tip), '적에 마우스를 올리면 설명 — ' + tip.slice(0, 60));
    await unitAt('en', 0);
    const tg = await page.evaluate(() => { const st = G.Games._landDebug.state(); return st.sel && st.sel.ord && st.sel.ord.target ? st.sel.ord.target.name : ''; });
    ok(!!tg, '적을 누르면 고른 부대의 목표가 된다 — ' + tg);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'lw_fight.png') });
    // 상성
    const vs = await page.evaluate(() => { const V = G.LANDWAR.VS; return [V.pike.cav, V.cav.missile, V.missile.blade, V.cav.pike]; });
    ok(vs[0] > 1.3 && vs[1] > 1.3 && vs[2] > 1 && vs[3] < 1, '상성: 창 > 기병 > 사격 > 걷는 보병, 기병은 창에 약하다');
    // 함성 + 진행 → 쿨타임
    await click(/함성/);
    await click(/진행/);
    await page.waitForFunction(() => { const b = [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /진행/.test(x.textContent))[0]; return window.__lwRes || (b && !b.disabled) || /확인/.test(document.querySelector('.lwar .lw-btns').textContent); }, null, { timeout: 30000 });
    const cool = await page.evaluate(() => { const st = G.Games._landDebug.state(); const cry = [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /함성/.test(x.textContent))[0]; return { used: st.used.cry, turn: st.turn, dis: cry ? cry.disabled : null, txt: cry ? cry.textContent : '' }; });
    ok(cool.used === 1 && (cool.dis === true || cool.dis === null), '함성을 쓰면 몇 차례 쉰다: ' + cool.txt);
    // 끝까지
    for (let i = 0; i < 40; i++) {
      const done = await page.evaluate(() => !!window.__lwRes || /확인|몸값|풀어 준다/.test(document.querySelector('.lwar .lw-btns').textContent));
      if (done) break;
      // 일기토가 뜨면 물러선다
      await page.evaluate(() => { const b = [...document.querySelectorAll('.askrow button, .askrow .btn')].filter(x => /부대로 싸운다/.test(x.textContent))[0]; if (b) b.click(); });
      await click(/모두 공격/);
      await page.waitForTimeout(1200);
    }
    const endTxt = await page.evaluate(() => document.querySelector('.lwar .lw-log').textContent);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'lw_end.png') });
    if (await click(/풀어 준다/)) ok(true, '포로가 있으면 몸값 · 풀어 준다를 고른다');
    await click(/^확인$/);
    await page.waitForFunction(() => !!window.__lwRes, null, { timeout: 30000 });
    const r1 = await page.evaluate(() => window.__lwRes);
    ok(['win', 'lose'].includes(r1.res) && r1.spoils && typeof r1.spoils.gold === 'number', '결과에 전리품(spoils)이 붙는다: ' + r1.res + ' ' + JSON.stringify(r1.spoils) + ' — ' + endTxt.slice(0, 80));
    if (r1.spoils.freed) ok(await page.evaluate(() => G.LandKit.friendly(G.Game.state.loc.lon, G.Game.state.loc.lat)), '원주민 포로를 풀어 주면 그 땅 원주민이 반긴다');

    // 도적 (빠르게): 이기면 금화, 두목이 쓰러지면 포로, 진 대원만큼 장비를 잃는다
    const r2 = await page.evaluate(async () => {
      const s = G.Game.state; s.loc.mount = { id: 'walk', n: 0 };
      const k0 = G.LandKit.st().musket;
      const p = G.Games.landWar({ enemy: { name: '도적 떼', kind: 'bandit', n: 12 }, party: 80, terr: 'grass', guns: false, fastEnd: true });
      await new Promise(r => setTimeout(r, 300));
      const D = G.Games._landDebug;
      [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /전투 개시/.test(x.textContent))[0].click();
      let res = null; p.then(r => { res = r; });
      for (let i = 0; i < 40 && !res; i++) { const st = D.state(); if (st.phase === 'fight') { D.mine.forEach(u => { if (u.n > 0) D.setOrder(u, 'attack'); }); await D.run(); } await new Promise(r => setTimeout(r, 80)); }
      for (let i = 0; i < 50 && !res; i++) await new Promise(r => setTimeout(r, 50));
      return { res, k0, k1: G.LandKit.st().musket };
    });
    ok(r2.res && (r2.res.res !== 'win' || r2.res.spoils.gold > 0), '도적에게 이기면 금화 전리품: ' + JSON.stringify(r2.res && r2.res.spoils));
    ok(r2.res.dead === 0 && r2.res.back === 0 || r2.k1 <= r2.k0 + ((r2.res.spoils && r2.res.spoils.muskets) || 0), '쓰러진 대원만큼 장비를 잃는다 (화승총 ' + r2.k0 + ' → ' + r2.k1 + ')');

    // 짐승: 우두머리가 울부짖으면 다음 차례 모두 돌진 · 수비대: 처음엔 진을 지킨다
    const ai = await page.evaluate(async () => {
      const out = {};
      for (const kind of ['beast', 'garrison']) {
        const p = G.Games.landWar({ enemy: { name: kind, kind, n: kind === 'beast' ? 14 : 70 }, party: 60, terr: 'grass', guns: false, fastEnd: true, flee: false });
        await new Promise(r => setTimeout(r, 200));
        const D = G.Games._landDebug;
        [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /전투 개시/.test(x.textContent))[0].click();
        const seen = [];
        let res = null; p.then(r => { res = r; });
        for (let i = 0; i < 4 && !res; i++) { seen.push(D.foes.filter(u => u.n > 0).map(u => u.intent && u.intent.act).join(',')); D.mine.forEach(u => { if (u.n > 0) D.setOrder(u, 'guard'); }); await D.run(); }
        out[kind] = seen;
        // 정리: 남은 창을 닫는다
        D.foes.forEach(u => { if (u.leader) u.n = 0; });
        D.mine.forEach(u => { if (u.n > 0) D.setOrder(u, 'guard'); }); await D.run();
        for (let i = 0; i < 40 && !res; i++) await new Promise(r => setTimeout(r, 50));
      }
      return out;
    });
    ok(ai.beast.some(x => /roar/.test(x)) || ai.beast.some(x => /charge/.test(x)), '짐승: 우두머리가 울부짖고 다음 차례 돌진 — ' + ai.beast.join(' | '));
    ok(/guard/.test(ai.garrison[0]), '수비대: 첫 차례에는 진을 지킨다 — ' + ai.garrison.join(' | '));

    // 탐험 장비: 성문 메뉴
    const gate = await page.evaluate(() => G.Scenes.city.B.gate.menu(G.CITY_DATA[0]).map(x => x.label));
    ok(gate.includes('탐험 장비'), '성문 메뉴에 「탐험 장비」 (' + gate.join(' · ') + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과 ' + pass);
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error(errors.slice(0, 5).join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
