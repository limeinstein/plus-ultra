/* 여성 제독의 선상 육아 (tests/seanest_smoke.js) — node tests/seanest_smoke.js
   ① 해산 뒤 「내 배에서 직접 키운다」 · 남성 제독은 예전 그대로 · 배가 좁으면 못 태움
   ② 바다: 아기의 밤울음(함대 피로) · 달마다 사이(서먹해지지 않음)·바다의 달 · 열두 살에 견습 선원
   ③ 바다의 육아 사건 · 수첩 「배 위의 아이들」 함께하는 일 · 온 식구의 저녁
   ④ 자택에서 태우기/맡기기 · 다른 항구에서 상선 편 · 집 사건은 배의 아이를 집 아이로 보지 않음 · 세대 교체·남성 제독이면 집으로 · 옛 저장 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (error) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, R = G.R, UI = G.UI, M = G.Mother, F = G.Family, SN = G.SeaNest, KB = G.BALANCE.seaNest;
      let said = [], alerts = [], chosen = [], pick = 'sea', askPick = 0, toasts = [], budget = 99;
      const real = { say: UI.say, alert: UI.alert, choose: UI.choose, ask: UI.ask, toast: UI.toast };
      UI.say = async (t) => { said.push(String(t)); }; UI.alert = async (t) => { alerts.push(String(t)); }; UI.toast = (t) => { toasts.push(String(t)); }; UI.confirm = async () => true;
      UI.choose = async (t, o, opt) => { chosen.push({ t: String(t), o, opt }); if (/어떻게 키울까/.test(t)) return pick; if (budget-- <= 0) return null; const f = o.filter(x => !x.disabled)[0]; return f ? f.value : null; };
      UI.ask = async (t, o) => o[Math.min(askPick, o.length - 1)].value; UI.prompt = async (t, v) => v;
      G.State.save = () => {}; G.Game.refreshHud = () => {};
      const chance0 = G.U.chance;
      const men = G.MATES.filter(d => d.g !== 'f' && !d.minor && !d.sib && !d.wed && !d.eventOnly && d.id !== 'rocco' && d.name.indexOf(' ') > 0).slice(0, 2);
      const doc = G.MATES.filter(d => d.g !== 'f' && d.sk && d.sk.med >= 2 && !d.eventOnly && men.indexOf(d) < 0)[0];
      function fresh(g) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; }); sk.med = 0; sk.music = 0;
        const s = G.Game.state = G.State.newGame({ name: '마리아 코스타', given: '마리아', surname: '코스타', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 80, int: 80, mar: 80, cha: 80 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal', g });
        s.date = { y: 1480, m: 6, d: 1 }; s.day = 31; s.loc.city = 0; s.loc.mode = 'sea';
        return s;
      }
      function add(s, d) { const m = { id: d.id, role: 'none', loyal: 80, aff: 100, joined: 14800101 }; s.mates.push(m); return m; }
      function wed(s, d) { add(s, d); (s.player.husbands || (s.player.husbands = [])).push({ id: d.id, wed: s.day, no: s.player.husbands.length + 1 }); }
      function kid(s, sex, yrs, extra) {
        const k = { name: (sex === 'f' ? '이네스' : '주앙') + ' 페레이라', given: sex === 'f' ? '이네스' : '주앙', surname: '페레이라', sex, born: { y: s.date.y - yrs, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 50, met: true, father: men[0].id };
        Object.assign(k, extra || {}); s.player.kids.push(k); return k;
      }
      async function born(s, roll) {
        s.player.pregSelf = { since: s.day, due: s.day + 1, told: true, sex: 'f', dad: men[0].id, gen: M.genSnap(men[0].id), lie: { kind: 'sick', room: 1, deputy: men[0].id, nurse: null } };
        G.U.chance = () => !!roll; try { s.day += 1; M.daily(); } finally { G.U.chance = chance0; }
        const todo = s.motherTodo; delete s.motherTodo;
        alerts = []; said = []; chosen = [];
        await M.birth(todo);
        return s.player.kids[s.player.kids.length - 1];
      }

      // ① 해산 뒤
      let s = fresh('f'); wed(s, men[0]);
      let k = await born(s, false);
      const ask = chosen.filter(c => /어떻게 키울까/.test(c.t))[0];
      out.birth = [!!ask, ask && ask.o.length, ask && ask.o[0].value, !!k.nest, SN.count(), alerts.some(a => /요람/.test(a)), !alerts.some(a => /유모의 손에/.test(a)), said.length > 0].join('|');
      out.birthLog = (s.log || []).map(l => l.t || l.text || l).filter(t => /선상 육아/.test(String(t))).length;
      pick = 'home'; k = await born(fresh('f'), false); out.home = [!!k.nest, alerts.some(a => /유모의 손에/.test(a))].join('|'); pick = 'sea';
      // 배가 좁으면
      s = fresh('f'); wed(s, men[0]); for (let i = 0; i < KB.max; i++) SN.take(kid(s, 'm', 2 + i));
      k = await born(s, false);
      const ask2 = chosen.filter(c => /어떻게 키울까/.test(c.t))[0];
      out.full = [ask2.o[0].disabled, !!k.nest, SN.count()].join('|');
      // 남성 제독
      s = fresh('m'); const mk = kid(s, 'f', 0); out.male = [await SN.afterBirth([mk]), SN.canTake(mk), !!SN.homeItem()].join('|');

      // ② 바다의 하루 · 달마다
      s = fresh('f'); const baby = kid(s, 'f', 0); SN.take(baby);
      s.fleet.fatigue = 0; for (let i = 0; i < 10; i++) SN.daily(); const alone = s.fleet.fatigue;
      wed(s, men[0]); s.fleet.fatigue = 0; for (let i = 0; i < 10; i++) SN.daily(); const helped = s.fleet.fatigue;
      s.loc.mode = 'city'; s.fleet.fatigue = 0; for (let i = 0; i < 10; i++) SN.daily(); const port = s.fleet.fatigue; s.loc.mode = 'sea';
      out.cry = [alone.toFixed(2), helped.toFixed(2), port].join('|');
      const home7 = kid(s, 'm', 7, { bond: 50 }), sea7 = kid(s, 'f', 7, { bond: 50 }); SN.take(sea7);
      const d0 = s.fleet.discipline;
      G.U.chance = () => true; let notes = []; try { for (let i = 0; i < 6; i++) notes = notes.concat(F.newMonth()); } finally { G.U.chance = chance0; }
      out.month = [home7.bond, sea7.bond, sea7.sea, Object.keys(sea7.sk).filter(x => sea7.sk[x] > 0).length > 0, s.fleet.discipline > d0].join('|');
      out.monthNote = notes.map(n => n.text).join(' / ').slice(0, 160);
      // 열두 살
      const c11 = kid(s, 'm', 12); SN.take(c11); notes = F.newMonth();
      out.grow = [!!c11.nest, !!c11.aboard, !!c11.seaBorn, notes.some(n => /견습 선원/.test(n.text)), F.aboard().indexOf(c11) >= 0].join('|');
      // 열 (의학 없음 / 있음)
      s = fresh('f'); const sick = kid(s, 'm', 2); SN.take(sick); s.player.hp = 100;
      G.U.chance = () => true; try { notes = F.newMonth(); } finally { G.U.chance = chance0; }
      out.sickBad = [s.player.hp, notes.some(n => /밤을 새웠다/.test(n.text))].join('|');
      add(s, doc); s.player.hp = 100;
      G.U.chance = () => true; try { notes = F.newMonth(); } finally { G.U.chance = chance0; }
      out.sickOk = [s.player.hp, notes.some(n => /약으로/.test(n.text))].join('|');

      // ③ 사건
      s = fresh('f'); wed(s, men[0]); const b1 = kid(s, 'f', 1), c5 = kid(s, 'm', 5), c9 = kid(s, 'f', 9); [b1, c5, c9].forEach(SN.take);
      out.pools = [SN.pool(b1).length, SN.pool(c5).length, SN.pool(c9).length].join('|');
      G.U.chance = () => true; said = [];
      try { var fired = await SN.atSea(); } finally { G.U.chance = chance0; }
      const who = [b1, c5, c9].filter(x => x.nest.last === s.day)[0];
      out.event = [fired, !!who, who && Object.keys(who.nest.seen).length, said.length > 0, said.every(t => !/\{/.test(t))].join('|');
      G.U.chance = () => true; try { out.again = await SN.atSea(); } finally { G.U.chance = chance0; }   // 같은 날 다른 아이 · 같은 아이는 gap
      // 모든 사건을 한 번씩 (글자리가 남지 않는지)
      let bad = [], n = 0;
      for (const ev of G.SEA_NEST_EVENTS) {
        const kk = ev.band === 'baby' ? b1 : ev.band === 'small' ? c5 : c9;
        for (let pi = 0; pi < (ev.pick ? ev.pick.opts.length : 1); pi++) { askPick = pi; said = []; await SN.play(kk, ev); n++; if (said.some(t => /\{|\}/.test(t))) bad.push(ev.id); }
      }
      askPick = 0;
      out.allEvents = [n, bad.join(',') || 'none', SN.pool(b1).length + SN.pool(c5).length + SN.pool(c9).length].join('|');
      // 함께하는 일
      const acts = SN.acts(b1).map(a => a.id).join(',') + ' / ' + SN.acts(c5).map(a => a.id).join(',') + ' / ' + SN.acts(c9).map(a => a.id).join(',');
      out.acts = acts;
      let bd = c9.bond; said = []; await SN.doAct(c9, SN.acts(c9)[0]); out.act = [c9.bond > bd || c9.bond === 100, said.length, said.every(t => !/\{/.test(t))].join('|');
      chosen = []; budget = 0; await SN.kidMenu(c9); budget = 99; const km = chosen[0]; out.gapOff = km.o.filter(o => o.disabled).length >= 1;
      bad = []; for (const kk of [b1, c5, c9]) for (const a of SN.acts(kk)) { said = []; kk.nest.acts = {}; await SN.doAct(kk, a); if (said.some(t => /\{|\}/.test(t))) bad.push(a.id); }
      out.allActs = bad.join(',') || 'none';
      s.fleet.fatigue = 30; const bb = b1.bond; await SN.dinner(); out.dinner = [s.fleet.fatigue, b1.bond - bb === 2 || b1.bond === 100].join('|');
      chosen = []; budget = 0; await SN.menu(); budget = 99; out.menu = chosen[0] && chosen[0].o.length;   // 아이 셋 + 저녁

      // ④ 집 · 항구 · 세대 교체
      s = fresh('f'); wed(s, men[0]); const h4 = kid(s, 'f', 4), h13 = kid(s, 'm', 13);
      s.loc.mode = 'city'; s.loc.city = s.player.home;
      const item = SN.homeItem(); out.homeItem = [!!item, item && item.sub, SN.canTake(h4), SN.canTake(h13)].join('|');
      chosen = []; let first = true;
      UI.choose = async (t, o) => { chosen.push({ t, o }); if (!first) return null; first = false; return o[0].value; };
      await SN.homeMenu(); out.take = [!!h4.nest, G.HomeLife.kidsHome().indexOf(h4) < 0, G.HomeLife.kidsHome().indexOf(h13) >= 0].join('|');
      h4.bond = 50; s.player.lastHomeBond = null; M.homeVisit(); out.homeVisit = [h4.bond, h13.bond].join('|');
      first = true; await SN.homeMenu(); out.leave = !h4.nest;
      // 다른 항구 — 상선 편
      SN.take(h4); s.loc.city = (s.player.home + 1) % G.CITY_DATA.length; s.player.gold = 1000;
      const ok1 = await SN.send(h4); out.send = [ok1, !h4.nest, s.player.gold].join('|');
      SN.take(h4); s.player.gold = 10; const ok2 = await SN.send(h4); out.sendPoor = [ok2, !!h4.nest].join('|');
      // 정보 창 꼬리표 · 가계도
      out.tag = SN.tag(h4) + '|' + SN.tag(h13);
      // 남성 제독이 되면 / 함대를 잃으면 / 섭정
      s.player.g = 'm'; s.player.sex = 'm'; SN.daily(); out.maleHome = !h4.nest;
      s = fresh('f'); const lostK = kid(s, 'm', 3); SN.take(lostK); s.fleet.ships = []; const nl = SN.daily(); out.ashore = [!lostK.nest, nl.length].join('|');
      // 생일 선물
      s = fresh('f'); const g6 = kid(s, 'f', 6); SN.take(g6); const gv = G.Life && G.Life.givers ? G.Life.givers() : null;
      out.gift = gv ? gv.some(x => x.kind === 'kid' && x.k === g6) : 'n/a';
      // 옛 저장: k.nest 없음
      s = fresh('f'); const old = kid(s, 'm', 5); F.newMonth(); SN.daily(); out.old = [SN.count(), old.bond <= 50].join('|');

      // 수첩 화면: 단추 (진짜 UI)
      Object.assign(UI, real);
      s = fresh('f'); wed(s, men[0]); const v1 = kid(s, 'f', 1), v6 = kid(s, 'm', 6); SN.take(v1); SN.take(v6);
      s.loc.mode = 'city';
      out.global = Object.keys(G).filter(x => /Lifespan|LifeSpan/.test(x)).join(',');
      return out;
    });
    console.log('① 해산 뒤');
    ok(r.birth === 'true|2|sea|true|1|true|true|true', '해산 뒤 어디서 키울지 고른다 → 배: 요람 · 「유모의 손에」 안내 없음 · 남편 한마디 — ' + r.birth);
    ok(r.birthLog >= 1, '일지에 선상 육아');
    ok(r.home === 'false|true', '고향 집을 고르면 예전 그대로 — ' + r.home);
    ok(r.full === 'true|false|4', '배가 좁으면(4명) 배를 고를 수 없다 — ' + r.full);
    ok(r.male === 'false|false|false', '남성 제독은 선상 육아가 없다 — ' + r.male);
    console.log('② 바다의 하루 · 달마다');
    const cry = r.cry.split('|').map(Number);
    ok(cry[0] > 1 && Math.abs(cry[1] - cry[0] / 2) < 0.01 && cry[2] === 0, '아기의 밤울음: 바다에서 함대 피로 · 남편이 돌보면 절반 · 항구에선 없음 — ' + r.cry);
    const mo = r.month.split('|');
    ok(+mo[0] < 50 && +mo[1] > 60 && mo[2] === '6' && mo[3] === 'true' && mo[4] === 'true', '달마다: 집 아이는 서먹해지고 배의 아이는 가까워짐 · 바다의 달 · 뱃일 특기 · 규율 — ' + r.month);
    console.log('    ' + r.monthNote);
    ok(r.grow === 'false|true|true|true|true', '열두 살: 선상 육아를 마치고 견습 선원 — ' + r.grow);
    ok(r.sickBad === '88|true' && r.sickOk === '100|true', '열: 의학이 없으면 제독이 밤을 새움(체력 −12) · 의사가 있으면 약 — ' + r.sickBad + ' / ' + r.sickOk);
    console.log('③ 사건 · 함께하는 일');
    ok(r.pools.split('|').every(x => +x >= 5), '나이 갈래마다 사건 — 아기·꼬마·어린이 ' + r.pools);
    ok(/^true\|true\|1\|true\|true$/.test(r.event), '바다 위 하루에 육아 사건 — ' + r.event);
    ok(r.allEvents.split('|')[1] === 'none' && r.allEvents.split('|')[2] === '0', '모든 사건·고르기에 글자리가 남지 않고, 아이마다 한 번씩 — ' + r.allEvents);
    ok(r.acts.split(' / ').every(x => x.split(',').length >= 3), '함께하는 일 — ' + r.acts);
    ok(r.act === 'true|2|true' && r.gapOff, '함께하는 일: 사이가 오르고 같은 일은 한동안 흐림 — ' + r.act);
    ok(r.allActs === 'none', '모든 일의 글자리');
    ok(r.dinner === '25|true', '온 식구의 저녁: 피로 −5 · 사이 +2 — ' + r.dinner);
    ok(r.menu === 4, '수첩 메뉴: 아이 셋 + 저녁');
    console.log('④ 집 · 항구 · 세대 교체');
    ok(/^true\|선상 육아 0명 · 집 1명\|true\|false$/.test(r.homeItem), '자택 「배에서 키울 아이」: 열두 살 밑만 — ' + r.homeItem);
    ok(r.take === 'true|true|true', '태우면 집 아이(아이와 함께)에서 빠진다 — ' + r.take);
    ok(r.homeVisit.split('|')[0] === '50', '집에 들러도 배의 아이는 집 아이로 치지 않는다 — ' + r.homeVisit);
    ok(r.leave === true, '자택에서 집에 맡긴다');
    ok(r.send === 'true|true|600' && r.sendPoor === 'false|true', '다른 항구: 상선 편에 고향으로 (금화 400) · 돈이 모자라면 안 됨 — ' + r.send + ' / ' + r.sendPoor);
    ok(r.tag === ' · 배에서 자람|', '수첩 자녀 칸 꼬리표');
    ok(r.maleHome && r.ashore === 'true|1', '남성 제독이 되면 · 함대를 잃으면 아이들은 집으로 — ' + r.ashore);
    ok(r.gift === true, '배에서 자라는 아이도 생일 선물을 준다');
    ok(r.old === '0|true', '옛 저장(k.nest 없음)은 그대로 — ' + r.old);

    // 화면: 수첩의 단추 → 선상 육아 창
    await page.evaluate(() => { G.Info.open(); });
    await page.waitForTimeout(800);
    const btn = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => /배 위의 아이들/.test(x.textContent))[0]; return b ? b.textContent : ''; });
    ok(/배 위의 아이들 \(2\)/.test(btn), '수첩 제독 쪽에 「배 위의 아이들 — 돌보기」 — ' + btn.trim());
    await page.evaluate(() => { [...document.querySelectorAll('button')].filter(x => /배 위의 아이들/.test(x.textContent))[0].click(); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ROOT, 'tests', '_seanest_menu.png') });
    const win = await page.evaluate(() => [...document.querySelectorAll('.choice')].map(x => x.textContent).join(' / '));
    ok(/저녁/.test(win), '선상 육아 창 — ' + win.slice(0, 120));
    await page.evaluate(() => { [...document.querySelectorAll('.choice')][1].click(); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ROOT, 'tests', '_seanest_kid.png') });
    const win2 = await page.evaluate(() => [...document.querySelectorAll('.choice')].map(x => x.textContent).join(' / '));
    ok(/매듭|공놀이|키 잡는|별/.test(win2), '아이의 함께하는 일 창 — ' + win2.slice(0, 140));
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('모두 통과');
  } catch (e) {
    console.error('실패: ' + e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
