/* 명의 베이징 정권 붕괴 · 청의 입관 — 황제의 마지막 편지 (2026-10-29 사용자 요청) — node tests/mingfall_smoke.js   (BROWSER_EXE=크롬 경로)
   · 인물 4명 + 진원원(지역 사람 동료) · 1646년까지 술집에 나오지 않는다(eventOnly) → 끝나면 다시
   · 한 판: 매산의 밤에 황제의 편지를 받는다 → 4.24에는 전할 수 없다 → 대순의 북경에서 뇌물로 들어가 전한다 → 배에 태운다(동료) · 산해관 소식이 달라진다
   · 다른 판: 매산의 밤을 놓침 → 청의 북경에서 늙은 궁녀에게 받고 그 길로 매산에서 전한다 → 「아직은」 → 다시 북경에 들면 절에서 다시 청한다 → 태운다
   · 담 넘기에 지면 20일 뒤 · 이미 배에 있으면 배 위에서 읽는다 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.MingFall && G.Hist && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, MF = G.MingFall, said = [], asked = [], out = {}, ID = 'h_chenyuanyuan';
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const fights = []; let fightRes = 'win';
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { fights.push({ name, n, kind: o && o.kind }); return fightRes; };
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1644, m: 1, d: 1 }; delete s.mingFall; MF.state(); s.fleet.crew = 120; s.player.gold = 5000; s.mates = s.mates.filter(m => m.id !== ID); return s;
      };
      const at = (s, y, m, d, city) => { s.date = { y, m, d }; s.loc = { mode: 'city', city }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = MF.pending(); if (p) await MF.check(); return p; };
      const daily = (s, y, m, d) => { s.date = { y, m, d }; s.loc = { mode: 'sea' }; return MF.daily(); };
      const has = (s, id) => s.player.items.some(x => x.id === id);
      const aboard = (s) => s.mates.some(x => x.id === ID);
      out.figs = G.MINGFALL_FIGS.length; out.figNames = G.MINGFALL_FIGS.every(id => G.HIST_FIG[id] && G.Hist.speaker(id).name === G.HIST_FIG[id].name);
      const M = G.MATE[ID];
      out.mate = { name: M && M.name, sk: M && M.sk, beauty: M && /미인/.test(M.desc), face: G.Img && G.Img.has ? G.Img.has('portraits/mates/' + ID) : null };
      out.beijing = { name: G.CITY_DATA[188].name, port: G.CITY_DATA[188].port };
      let s = fresh();
      out.eventOnly = { y1644: M.eventOnly, tavern1644: G.Frontier.mateReady(M, 1644) };
      s.date = { y: 1650, m: 1, d: 1 }; out.eventOnly.y1650 = M.eventOnly; out.eventOnly.tavern1650 = G.Frontier.mateReady(M, 1650);
      // 날짜·도시
      s = fresh();
      const gate = (y, m, d, c, stt, letter) => { at(s, y, m, d, c); s.mingFall = Object.assign({ told: {} }, stt || {}); s.player.items = s.player.items.filter(x => x.id !== 'chongzhen_letter'); if (letter) s.player.items.push({ id: 'chongzhen_letter', kind: 'keepsake', name: 'x' }); return MF.pending(); };
      out.gates = {
        nightEarly: gate(1644, 3, 1, 188), night: gate(1644, 4, 10, 188), nightNanjing: gate(1644, 4, 10, 178), nightAfter: gate(1644, 4, 26, 188, { night: 'no', maid: 'no', maidCool: 999999 }),
        letterBefore: gate(1644, 4, 24, 188, { night: 'take' }, true), letterAfter: gate(1644, 4, 25, 188, { night: 'take' }, true), letterNanjing: gate(1644, 5, 1, 178, {}, true),
        maid: gate(1644, 7, 1, 188), maidLate: gate(1647, 1, 2, 188), maidCool: gate(1644, 7, 1, 188, { maid: 'no', maidCool: 999999 })
      };
      // ── 한 판: 매산의 밤 → 대순의 북경에서 뇌물
      s = fresh('PT');
      out.shunNews = daily(s, 1644, 2, 9).some(m => /대순/.test(m.text));
      at(s, 1644, 4, 20, 188); await go(['take']);
      out.night = { night: s.mingFall.night, letter: has(s, 'chongzhen_letter'), schall: said.some(x => /^아담 샬 폰 벨: /.test(x)), wang: said.some(x => /^왕승은: /.test(x)), emperor: said.some(x => /^숭정제: .*원원이라 했지/.test(x)), html: /황제가 떠난 뒤/.test(MF.html()) };
      out.nightAgain = await go([]);
      out.fallNews = daily(s, 1644, 4, 25).some(m => /노란 비단 꾸러미가 아직 제독의 품에/.test(m.text));
      at(s, 1644, 5, 2, 188); let g0 = s.player.gold; await go(['bribe', 1]);
      out.deliver = { opts: asked.map(a => a.opts), paid: g0 - s.player.gold, way: s.mingFall.way, letter: s.mingFall.letter, item: has(s, 'chongzhen_letter'), aboard: aboard(s),
        beauty: said.some(x => /숨을 멈춘다/.test(x)), read: said.some(x => /^진원원: 「이제 그 집이 무너진다/.test(x)), leave: said.some(x => /떠나신 이 성에서, 저는 더 이상 지낼 까닭이 없습니다/.test(x)), joined: s.mingFall.joined, loyal: (s.mates.filter(x => x.id === ID)[0] || {}).loyal };
      out.passNews = daily(s, 1644, 5, 28).some(m => /그 여인은 그날 이미 제독의 배에/.test(m.text));
      const later = daily(s, 1644, 6, 7);
      out.qingNews = later.some(m => /청의 입관/.test(m.text)) && later.some(m => /자금성의 불/.test(m.text));
      out.shunzhi = daily(s, 1644, 10, 31).some(m => /순치제/.test(m.text));
      out.nanjing = daily(s, 1645, 6, 9).some(m => /남경 함락/.test(m.text));
      at(s, 1644, 7, 1, 188); out.afterJoin = await go([]);
      out.eventOnlyAfter = M.eventOnly === false;
      // ── 다른 판: 궁녀 → 매산 → 「아직은」 → 다시
      s = fresh('ES');
      out.passPlain = daily(s, 1644, 5, 28).some(m => /진원원 때문에 관문을/.test(m.text));
      at(s, 1644, 7, 10, 188); await go(['take', 0]);
      out.maid = { maid: s.mingFall.maid, robe: said.some(x => /백성은 한 사람도 다치게 하지 말라/.test(x)), tree: said.some(x => /홰나무 아래/.test(x)), banner: said.some(x => /^청나라 기병: /.test(x)), letter: s.mingFall.letter, aboard: aboard(s), asked: s.mingFall.asked, html: /작은 절/.test(MF.html()) };
      s.day += 1; at(s, 1644, 8, 1, 188); await go([1]);
      out.again = { temple: said.some(x => /매산 아래 작은 절/.test(x)), aboard: aboard(s), joined: !!s.mingFall.joined };
      // ── 담 넘기에 지면
      s = fresh('PT'); s.player.gold = 100; s.player.items.push({ id: 'chongzhen_letter', kind: 'keepsake', name: 'x' }); s.mingFall = { told: {}, night: 'take' };
      at(s, 1644, 5, 3, 188); fightRes = 'lose'; fights.length = 0; await go(['wall']);
      out.wallLose = { opts: asked[0] && asked[0].opts, fight: fights[0], cool: !!s.mingFall.wallCool, letter: has(s, 'chongzhen_letter'), again: MF.pending() };
      fightRes = 'win';
      // ── 이미 배에 있으면 배 위에서
      s = fresh('PT'); s.mates.push({ id: ID, role: 'none', joined: 16420101, loyal: 60 }); s.player.items.push({ id: 'chongzhen_letter', kind: 'keepsake', name: 'x' }); s.mingFall = { told: {}, night: 'take' };
      at(s, 1644, 6, 1, 177); await go([]);
      out.aboardRead = { letter: s.mingFall.letter, item: has(s, 'chongzhen_letter'), loyal: s.mates.filter(x => x.id === ID)[0].loyal, deck: said.some(x => /밤의 갑판/.test(x)), noAsk: !asked.length };
      // ── 옛 저장
      s = fresh('PT'); s.date = { y: 1660, m: 1, d: 1 }; delete s.mingFall;
      out.oldSave = { n: MF.daily().length, told: Object.keys(s.mingFall.told).length };
      out.rumor = !!(G.EVENT_RUMORS && G.EVENT_RUMORS.some(x => x.id === 'mingfall'));
      out.journal = !!(MF.daily && MF.daily._journal);
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.figs === 4 && r.figNames, '인물 4명');
    ok(r.mate.name === '진원원' && r.mate.sk.music === 3 && r.mate.sk.speech === 3 && r.mate.beauty, '진원원 — 음악·웅변 3 · 「강남 제일의 미인」');
    ok(r.beijing.port === 0, '북경은 내륙 도시');
    ok(r.eventOnly.y1644 === true && !r.eventOnly.tavern1644 && r.eventOnly.y1650 === false, '1646년까지는 술집에 나오지 않는다 → 1647년부터 다시');
    const g = r.gates;
    ok(!g.nightEarly && g.night && !g.nightNanjing && !g.nightAfter, '매산의 밤 1644.3.20~4.24 북경만');
    ok(!g.letterBefore && g.letterAfter && !g.letterNanjing, '편지는 황제가 떠난 뒤(4.25~) 북경에서');
    ok(g.maid && !g.maidLate && !g.maidCool, '늙은 궁녀 1644.4.25~1646 · 거절하면 30일 뒤');
    ok(r.shunNews, '대순 건국 소식');
    ok(r.night.night === 'take' && r.night.letter && r.night.schall && r.night.wang && r.night.emperor && r.night.html && !r.nightAgain, '매산의 밤 — 아담 샬 · 왕승은 · 숭정제의 편지');
    ok(r.fallNews, '북경 함락 소식 (편지를 받은 제독의 줄)');
    const d = r.deliver;
    ok(d.paid === 1200 && d.way === 'bribe' && d.letter === 'done' && !d.item && d.beauty && d.read && d.leave, '대순의 북경 — 뇌물 1,200 · 절세미녀 · 편지를 읽는다 · 「떠나신 이 성에서」');
    ok(d.aboard && d.joined && d.loyal >= 90, '진원원이 배에 오른다 (충성 ' + d.loyal + ')');
    ok(r.passNews && r.passPlain, '산해관 소식 — 이미 배에 있으면 달라진다');
    ok(r.qingNews && r.shunzhi && r.nanjing, '자금성의 불 · 청의 입관 · 순치제 · 남경 함락');
    ok(!r.afterJoin && r.eventOnlyAfter, '끝난 뒤에는 장면이 없다');
    ok(r.maid.maid === 'take' && r.maid.robe && r.maid.tree && r.maid.banner && r.maid.letter === 'done' && !r.maid.aboard && r.maid.asked === 1 && r.maid.html, '청의 북경 — 궁녀에게 받아 그 길로 매산에서 전한다 · 「아직은」');
    ok(r.again.temple && r.again.aboard && r.again.joined, '다시 북경 — 매산 아래 절에서 태운다');
    ok(r.wallLose.fight && r.wallLose.fight.kind === 'garrison' && r.wallLose.cool && r.wallLose.letter && !r.wallLose.again && r.wallLose.opts.indexOf('bribe') < 0, '담 넘기에 지면 편지는 남고 20일 뒤 (돈이 없으면 뇌물 칸 없음)');
    ok(r.aboardRead.letter === 'done' && !r.aboardRead.item && r.aboardRead.loyal === 75 && r.aboardRead.deck && r.aboardRead.noAsk, '이미 배에 있으면 갑판에서 읽는다 (충성 +15)');
    ok(r.oldSave.n === 0 && r.oldSave.told === 7, '옛 저장(1660) — 지난 소식은 띄우지 않는다');
    ok(r.rumor, '소문');
    ok(r.journal, '일지 등급');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
