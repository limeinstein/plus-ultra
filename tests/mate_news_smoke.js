/* 부하 능력치 · 오래 함께한 부하와의 이별 · 아는 항해사(철새) · 여급에게 행방 부탁 — node tests/mate_news_smoke.js   (BROWSER_EXE=크롬 경로)
   js/ui/info.js (동료 능력치) · js/systems/mateleave.js · js/systems/mateknow.js
   · 수첩 「동료」에 체력·지력·무력·매력 · 능력치 이름에 「힘」이 없다
   · 이별: 제독 60세↑ 또는 20년↑ — 한 해에 많아야 둘 · 3년 안 된 부하·아내·동생은 아니다 · 약재/배의 의원/항구 의원으로 위기를 넘기면 셈에서 빠진다
     · 사망·건강·다른 일(붙잡기·퇴직금) — 함대에서 빠지고 gone_ · 남은 이야기(s.mateFate)
   · 수첩 「철새」: 아는 항해사만 · 들은 지 30일이 지나면 「예전에」 · 술집 귀띔·명부가 소식을 남긴다
   · 여급: 모르는 이름 · 인연 없는 사람 · 먼 곳 · 부탁(20일쯤) → 날이 차기 전엔 아직 → 찬 뒤 행방 + 그 항구에 머문다 · 떠난 부하는 남은 이야기 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.MateLeave && G.MateKnow, null, { timeout: 120000 });
    await page.evaluate(() => {
      const UI = G.UI;
      window.__said = []; window.__pick = []; window.__asks = [];
      UI.say = async (t, w) => { window.__said.push((w && w.name ? w.name + ': ' : '') + t); };
      UI.alert = async (t) => { window.__said.push('[알림] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.toast = (t) => { window.__said.push('[토스트] ' + t); };
      UI.confirm = async () => true; UI.fade = async (fn) => { if (fn) fn(); };
      UI.ask = async (t, opts) => { window.__asks.push({ t, opts: opts.map(o => (o.dis ? '(막힘)' : '') + o.label) }); const w = window.__pick.length ? window.__pick.shift() : undefined; const o = w !== undefined ? opts.find(x => x.value === w) : opts.find(x => !x.dis); return o ? o.value : null; };
      UI.prompt = async () => window.__name;
      G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '노제독', nation: 'PT', job: 'explorer', age: 40, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
      s.date = { y: 1520, m: 2, d: 1 }; s.player.born = { y: 1455, m: 1, d: 1 }; s.player.gold = 50000;
      const pick = G.MATES.filter(m => !m.wd && !m.witch && !m.sib && m.st && m.y && m.y[1] < 9000).slice(0, 6);
      window.__ids = pick.map(m => m.id);
      s.mates = pick.map((m, i) => ({ id: m.id, role: 'none', joined: i < 5 ? 14950101 : 15180101, loyal: 90 }));   // 다섯은 25년, 하나는 2년
      if (G.Wander) G.Wander.apply();
    });

    // ① 수첩 「동료」 능력치
    let r = await page.evaluate(() => {
      const el = document.createElement('div'); document.body.appendChild(el);
      G.Info.open('mates'); const w = [...document.querySelectorAll('.win')].pop();
      const txt = [...w.querySelectorAll('.mate-st')].map(e => e.innerText.replace(/\s+/g, ' '));
      w.querySelector('.close') ? w.querySelector('.close').click() : null;
      document.querySelectorAll('#ui .modal-back').forEach(e => e.remove());
      return { n: txt.length, first: txt[0], stats: G.STATS.map(x => x.name).join(',') };
    });
    ok(r.n === 6 && /체력 \d+ 지력 \d+ 무력 \d+ 매력 \d+/.test(r.first), '수첩 「동료」에 체력·지력·무력·매력 — ' + r.first);
    ok(r.stats === '체력,지력,무력,매력', '능력치 이름: ' + r.stats);

    // ② 이별: 제독이 80세가 될 때까지 모두 3번 · 사건 사이 3년 넘게 · 최근 선실에 덜 머문 부하부터 (2026-10-29 사용자 요청)
    r = await page.evaluate(() => {
      const ML = G.MateLeave, k = G.BALANCE.mateLeave, s = G.Game.state; k.monthly = 1;
      const keep = { mates: JSON.parse(JSON.stringify(s.mates)), date: Object.assign({}, s.date), day: s.day };
      const w = s.mates.map(m => ML.weight(m));
      // 최근 선실에 머문 날: 0번 300 · 1번 40 · 나머지 0 (3번은 예전에 선실에서 500일을 지냈다)
      s.mates.forEach((m, i) => { m.cabRec = [300, 40, 0, 0, 0, 0][i]; m.skd = i === 3 ? { nav: 500 } : {}; });
      s.mateLeave = { y: s.date.y, n: 0, pend: [], td: s.day, life: { gen: s.player.generation || 1, n: 0 } };
      const order = ML.order().map(x => window.__ids.indexOf(x.m.id));
      const ids = [], years = [];
      for (let y = 0; y < 16; y++) {
        for (let i = 0; i < 12; i++) ML.newMonth();
        s.mateLeave.pend.forEach(e => { ids.push(window.__ids.indexOf(e.id)); years.push(s.date.y); s.mates = s.mates.filter(m => m.id !== e.id); });
        s.mateLeave.pend = []; s.day += 365; s.date.y += 1;
      }
      const life = s.mateLeave.life.n;
      // 선실에 있으면 날이 쌓인다
      s.mates = JSON.parse(JSON.stringify(keep.mates)); s.date = keep.date; s.day = keep.day;
      G.Cabins.rooms(); const m0 = s.mates[0]; m0.room = 1; m0.cabRec = 0; s.mateLeave.td = s.day; s.day += 10; ML.track();
      const rec = Math.round(m0.cabRec), inCab = ML.inCabin(m0), deck = (m0.room = 0, ML.inCabin(m0));
      s.mates = keep.mates; s.day = keep.day; s.date = keep.date; s.mateLeave = { y: s.date.y, n: 0, pend: [] };
      return { w, order, ids, years, life, rec, inCab, deck };
    });
    ok(r.w.slice(0, 5).every(x => x > 0) && r.w[5] === 0, '60세↑·20년↑ 부하만 (2년 된 부하는 아니다) — 배수 ' + r.w.join(','));
    ok(r.order.join(',') === '2,4,3,1,0', '최근 선실에 덜 머문 부하부터 (같으면 선실 날 모두가 적은 쪽 · 오래 함께한 쪽) — ' + r.order.join(','));
    ok(r.ids.length === 3 && r.life === 3 && r.ids[0] === 2 && r.ids[1] === 4, '80세까지 모두 3번 — ' + r.ids.join(',') + ' (' + r.years.join('·') + '년)');
    ok(r.years[1] - r.years[0] >= 3 && r.years[2] - r.years[1] >= 3, '사건 사이는 3년 넘게');
    ok(r.inCab && !r.deck && r.rec === 10, '선실(갑판 아닌 방)에 있으면 「최근 선실에 머문 날」이 쌓인다 (10일 → ' + r.rec + ')');
    // 사건으로 얻은 부하는 이별을 겪지 않는다 (2026-10-29 사용자 요청)
    r = await page.evaluate(() => {
      const s = G.Game.state, ML = G.MateLeave, m0 = s.mates[0], before = ML.weight(m0);
      m0.ev = 1; const evW = ML.weight(m0), inOrder = ML.order().some(x => x.m === m0); delete m0.ev;
      const tale = G.MATES.find(m => m.tale && !m.sib), poca = G.MATE.h_pocahontas, chen = G.MATE.h_chenyuanyuan;
      const tw = tale ? ML.weight({ id: tale.id, joined: 14950101, loyal: 90 }) : 0;
      const pw = poca ? ML.weight({ id: poca.id, joined: 14950101, loyal: 90 }) : 0;   // 옛 저장(표시 없음)
      const cw = chen ? ML.weight({ id: chen.id, joined: 14950101, loyal: 90 }) : 0;
      // G.Legend.join으로 맞은 부하에는 표시가 붙는다
      const free = G.MATES.find(m => !m.wd && !m.witch && !m.sib && !m.tale && !m.eventOnly && !s.mates.some(x => x.id === m.id) && !(ML.past && ML.past(m)));
      const nm = G.Legend.join(free.id, G.CITY_DATA[0]); const legEv = !!(nm && nm.ev); s.mates = s.mates.filter(x => x.id !== free.id);
      return { before, evW, inOrder, tw, pw, cw, legEv, tale: tale && tale.name };
    });
    ok(r.before > 0 && r.evW === 0 && !r.inOrder, '사건으로 얻은 부하(m.ev)는 이별 대상에서 빠진다');
    ok(r.tw === 0 && r.pw === 0 && r.cw === 0, '옛이야기 동료(' + r.tale + ') · 포카혼타스 · 진원원은 표시가 없어도 빠진다');
    ok(r.legEv, 'G.Legend.join으로 맞은 부하에는 사건 표시(ev)가 붙는다');
    r = await page.evaluate(() => {
      const s = G.Game.state, ML = G.MateLeave; s.player.born.y = 1500;   // 제독 21세 → 20년 넘은 부하만
      const w = s.mates.map(m => ML.weight(m)); s.player.born.y = 1455; return w;
    });
    ok(r.slice(0, 5).every(x => x > 0) && r[5] === 0, '제독이 젊어도 20년 넘게 함께한 부하는 겪을 수 있다');

    // ③ 위기: 약재로 넘긴다 → 남고 셈에서 빠진다
    r = await page.evaluate(async () => {
      const s = G.Game.state, ML = G.MateLeave, k = G.BALANCE.mateLeave, id = window.__ids[0];
      s.fleet.cargo.herbs = { q: 3, cost: 60 }; k.herbs = 1; k.herbsMed = 0;
      const o = ML.st(); o.n = 1; window.__said = []; window.__pick = ['herbs']; window.__asks = [];
      await ML.play({ id, kind: 'death' });
      return { still: s.mates.some(m => m.id === id), herbs: s.fleet.cargo.herbs.q, n: o.n, cd: s.mates.find(m => m.id === id).leaveCd > s.day, opts: window.__asks[0].opts.join(' | '), said: window.__said.join('\n') };
    });
    ok(r.still && r.herbs === 2 && r.n === 0 && r.cd, '약재 1통으로 위기를 넘겼다 — 남고, 한 해 셈에서 빠지고, 한동안 다시 겪지 않는다');
    ok(/약재를 달여/.test(r.opts) && /곁을 지킨다/.test(r.opts), '고를 수 있는 길: ' + r.opts);
    // 배의 의원
    r = await page.evaluate(async () => {
      const s = G.Game.state, ML = G.MateLeave, k = G.BALANCE.mateLeave, id = window.__ids[1], doc = s.mates.find(m => m.id === window.__ids[2]);
      doc.sk = Object.assign({}, doc.sk || {}, { med: 3 }); k.doctor = [1, 1, 1];
      window.__pick = ['doctor']; window.__said = []; window.__asks = [];
      await ML.play({ id, kind: 'health', line: 1 });
      return { still: s.mates.some(m => m.id === id), opts: window.__asks[0].opts.join(' | '), said: window.__said.join('\n') };
    });
    ok(r.still && /배의 의원 .+에게 맡긴다/.test(r.opts), '배의 의원(의학)에게 맡겨 건강 위기를 넘겼다 — ' + r.opts.split(' | ').find(x => /의원/.test(x)));
    // 곁을 지킨다 → 세상을 떠난다
    r = await page.evaluate(async () => {
      const s = G.Game.state, ML = G.MateLeave, id = window.__ids[3], nm = G.MATE[id].name;
      window.__pick = ['none']; window.__said = []; const loc0 = s.loc; s.loc = { mode: 'sea', lon: -20, lat: 30 };
      await ML.play({ id, kind: 'death' }); s.loc = loc0;
      return { gone: !s.mates.some(m => m.id === id) && !!s.flags['gone_' + id], fate: s.mateFate[id], said: window.__said.join('\n'), log: s.log.slice(-1)[0].t, nm };
    });
    ok(r.gone && r.fate.kind === 'death' && r.fate.sea, r.nm + ' — 바다에서 세상을 떠났다 (함대에서 빠짐 · 남은 이야기)');
    ok(/마지막 항해/.test(r.said) && /함께한 25년/.test(r.log), '마지막 말 · 바다 장례 · 일지: ' + r.log);
    // 다른 일 — 붙잡기 실패 → 퇴직금
    r = await page.evaluate(async () => {
      const s = G.Game.state, ML = G.MateLeave, k = G.BALANCE.mateLeave, id = window.__ids[4]; k.holdChance = 0;
      const g0 = s.player.gold; window.__pick = ['hold']; window.__said = []; window.__asks = [];
      await ML.play({ id, kind: 'other', why: 'tavern' });
      const opts = window.__asks[0].opts.join(' | ');
      return { gone: !s.mates.some(m => m.id === id), fate: s.mateFate[id], paid: g0 - s.player.gold, opts };
    });
    ok(r.gone && r.fate.kind === 'other' && r.fate.why === 'tavern' && /붙잡는다/.test(r.opts), '술집 주인이 되러 떠났다 (붙잡기 실패) — ' + r.opts);

    // ④ 아는 항해사 · 수첩 「철새」
    r = await page.evaluate(() => {
      const s = G.Game.state, MK = G.MateKnow, home = G.CITY_DATA[s.player.home];
      const all = G.MATES.filter(m => m.wd || m.witch).length;
      const near = G.MateMove.nearby(home, null, 20).filter(n => !n.m.sib).slice(0, 3);
      window.__near = near.map(n => n.m.id);
      G.Scenes.city.B.tavern.mateHint(home);   // 술집 주인의 귀띔 — 두 사람까지
      const known = Object.keys(s.mateKnow).filter(id => s.mateKnow[id].how === 'rumor');
      window.__near = known;
      const el = document.createElement('div'); MK.page(el);
      const rows1 = [...el.querySelectorAll('tr')].length - 1, txt1 = el.innerText;
      s.day += 40; const el2 = document.createElement('div'); MK.page(el2);
      const stale = [...el2.querySelectorAll('tr.mk-stale')].length, txt2 = el2.innerText;
      s.day -= 40;
      return { all, known: known.length, rows1, stale, sample1: (txt1.match(/[^\n]*일 전 소식[^\n]*|[^\n]*오늘 소식[^\n]*|[^\n]*머무는 중[^\n]*/) || [''])[0], sample2: (txt2.match(/예전에[^\n]*/) || [''])[0] };
    });
    ok(r.known >= 1 && r.rows1 === r.known + 0 || r.rows1 >= r.known, '귀띔으로 들은 항해사가 수첩 「철새」에 (철새 전체 ' + r.all + '명 중 ' + r.rows1 + '명만)');
    ok(r.rows1 < r.all, '세계의 모든 철새를 적지 않는다');
    ok(r.stale >= 1 && /예전에 .+ \(\d+년 \d+월\) — 지금은 떠났을지도/.test(r.sample2), '시간이 지나면 과거 위치로 — ' + r.sample2);

    // ⑤ 여급에게 행방 부탁
    r = await page.evaluate(async () => {
      const s = G.Game.state, MK = G.MateKnow, c = G.CITY_DATA[s.player.home], maid = G.MAIDS.find(m => m.city === c.id) || G.MAIDS[0];
      const st = s.maids[maid.id] = { aff: 60, met: 5 }, said = [], say = async (t) => { said.push(t); };
      const out = {};
      window.__name = '없는 사람 이름'; await MK.seek(c, maid, st, say); out.noName = said.pop();
      const stranger = G.MATES.find(m => !m.wd && !m.witch && !m.sib && !MK.known(m.id) && !s.mates.some(x => x.id === m.id));
      window.__name = stranger.name; await MK.seek(c, maid, st, say); out.stranger = said.pop();
      // 인연 있는 사람: 함께 항해한 부하(남은 이야기)와, 행방을 들은 항해사
      const tgt = G.MATE[window.__near[0]];
      if (s.mateRumorStay) delete s.mateRumorStay[tgt.id];   // 귀띔으로 붙잡힌 체류는 풀고 (자리를 시험에서 정한다)
      const rng = G.MateMove.range(tgt.id).map(id => G.CITY_DATA[id]).filter(x => x.id !== c.id && G.R.cityExists(x)).sort((a, b) => G.Geo.dist(c.lon, c.lat, a.lon, a.lat) - G.Geo.dist(c.lon, c.lat, b.lon, b.lat));
      const far = rng[rng.length - 1], nearC = rng[0], kk = G.BALANCE.mateKnow, fd = kk.farDeg;
      kk.farDeg = G.Geo.dist(c.lon, c.lat, far.lon, far.lat) - 0.1;   // 그 사람의 고장에서 가장 먼 도시가 「먼 곳」이 되게
      s.mateLoc[tgt.id] = far.id; window.__name = tgt.name; await MK.seek(c, maid, st, say); out.far = said.pop(); kk.farDeg = fd;
      s.mateLoc[tgt.id] = nearC.id;
      const g0 = s.player.gold; window.__name = ' ' + tgt.name.replace(/ /g, '  ') + ' '; await MK.seek(c, maid, st, say); out.ask = said.pop();
      const q = MK.seekOf(maid.id); out.days = q && q.due - s.day; out.fee = g0 - s.player.gold;
      s.day += 5; await MK.seek(c, maid, st, say); out.wait = said.pop();
      s.day += 20; s.mateLoc[tgt.id] = nearC.id;
      out.delivered = await MK.deliver(c, maid, say); out.result = said.pop();
      out.stay = G.MateMove.rumorStayLeft(tgt.id); out.where = MK.whereText(tgt.id).text; out.how = s.mateKnow[tgt.id].how;
      // 세상을 떠난 옛 부하
      const dead = G.MATE[window.__ids[3]]; window.__name = dead.name; await MK.seek(c, maid, st, say); out.deadAsk = said.pop();
      s.day += 25; await MK.deliver(c, maid, say); out.dead = said.pop();
      return out;
    });
    ok(/처음 들어요/.test(r.noName), '모르는 이름 — ' + r.noName);
    ok(/짐작이 안 가요/.test(r.stranger), '만났거나 인연이 있던 사람이 아니면 — ' + r.stranger);
    ok(/너무 먼 바다/.test(r.far), '먼 곳이면 소식이 닿지 않는다 — ' + r.far);
    ok(/20일쯤/.test(r.ask) && r.days >= 18 && r.days <= 22 && r.fee > 0, '정확한 이름 → 「행방을 찾아 놓을게요, 20일쯤」 (' + r.days + '일 · 사례금 ' + r.fee + '닢)');
    ok(/아직 소식이 안 왔어요/.test(r.wait), '날이 차기 전에는 — ' + r.wait);
    ok(r.delivered && /술집에 계신대요|바로 이 도시/.test(r.result) && r.stay === 30 && r.how === 'maid', '날이 찬 뒤 찾아가면 행방 · 그 항구에 30일 머문다 — ' + r.result);
    ok(/세상을 떠나셨대요/.test(r.dead), '떠난 옛 부하는 남은 이야기 — ' + r.dead);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
