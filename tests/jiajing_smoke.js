/* 가정제의 궁궐 — 임인궁변(1542)·경술의 변(1550) (2026-11-05 사용자 요청) — node tests/jiajing_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 명의 항구에서 고 태감 — 통행패(북경 성문 허가) · ② 용연향을 서원에(시세 3배) · ③ 임인년의 밤(12.7) — 궁녀 소란을 빼낸다(매수 / 금의위) · 「끼지 않겠소」
   · ④ 장가구 — 북경에 알린다 / 알탄 칸의 천막(교섭 성공 → 편지 · 실패 → 몸값) · 북경(10.7) — 성 밖 마을을 지킨다 · 편지를 엄숭에게 · ⑤ 귀화성의 칸(활)
   · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Jiajing && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, JJ = G.Jiajing, said = [], asked = [], out = {};
      let plan = [], landRes = [], luck = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => luck;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = JJ.pending(); if (p) await JJ.check(); return p; };
      const b = () => G.Game.state.jiajing;
      // ── 문
      let s = fresh(1541, 1, 1);
      out.gate = { early: (at(s, 1539, 12, 31, 174), JJ.pending()), port: (at(s, 1541, 3, 1, 175), JJ.pending()), inland: (at(s, 1541, 3, 1, 178), JJ.pending()), late: (at(s, 1542, 11, 1, 174), JJ.pending()), noCallNight: (at(s, 1542, 11, 10, 188), JJ.pending()) };
      // ── ① 약조 → 통행패
      at(s, 1541, 3, 1, 175); await go(['yes']);
      out.call = { v: b().call, pass: G.R.hasItem('jj_pass'), noSell: !!G.ITEM.jj_pass.noSell, gate: !!(G.Sneak && G.Sneak.hasPass(G.CITY_DATA[188])), entry: G.Scenes.city.entryCheck(G.CITY_DATA[188]) === null, tao: said.some(x => /도중문/.test(x)) };
      // ── ② 용연향 → ③ 그날 밤 (매수)
      s.fleet.cargo.ambergris = { q: 12 }; const g0 = s.player.gold; at(s, 1542, 11, 15, 188); await go([]);
      out.amber = { v: b().amber, gold: s.player.gold - g0, expect: JJ.amberGold(), left: s.fleet.cargo.ambergris && s.fleet.cargo.ambergris.q };
      out.nightNext = JJ.pending();
      const g1 = s.player.gold; await go(['bribe']);
      out.night = { v: b().night, maid: b().maid, date: s.date.m + '.' + s.date.d, paid: g1 - s.player.gold, bowl: G.R.hasItem('jj_bowl'), dew: said.some(x => /이슬을 한 방울이라도 흘리면/.test(x)), knot: said.some(x => /매듭이 엉켜/.test(x)), xiyuan: said.some(x => /서원으로 거처를 옮기신다/.test(x)) };
      // ── ③ 금의위를 뚫다 지면 / 끼지 않으면
      s = fresh(1541, 1, 1); at(s, 1541, 5, 1, 174); await go(['yes']); at(s, 1542, 12, 1, 188); await go(['fight'], ['lose']);
      out.lost = { maid: b().maid, amber: !!b().amber, guard: said.some(x => /\[육상전\] 서직문의 금의위 순찰/.test(x)) };
      s = fresh(1541, 1, 1); at(s, 1541, 5, 1, 177); await go(['yes']); at(s, 1542, 12, 7, 188); await go(['no']); out.left = b().maid;
      s = fresh(1541, 1, 1); at(s, 1541, 5, 1, 288); await go(['no']); out.refuse = { call: b().call, pass: G.R.hasItem('jj_pass'), cold: said.some(x => /못 들은 것으로 하겠소/.test(x)) };
      // ── ④ 장가구 → 알탄 칸의 천막(성공) → 북경 → 성 밖 마을 · 편지 → ⑤ 귀화성
      s = fresh(1550, 9, 1); at(s, 1550, 9, 5, 309); await go(['talk']);
      out.border = { altan: b().altan, letter: G.R.hasItem('jj_letter'), market: said.some(x => /시장을 열어 주면 칼을 거둔다/.test(x)) };
      const g2 = s.player.gold; at(s, 1550, 9, 25, 188); await go(['defend'], ['win']);
      out.raid = { raid: b().raid, date: s.date.m + '.' + s.date.d, letter: b().letter, gone: !G.R.hasItem('jj_letter'), gold: s.player.gold - g2 >= 2400, yan: said.some(x => /성 밖은 털어 가게 두시오/.test(x)), qiu: said.some(x => /성을 지키는 것이 먼저요/.test(x)), credit: said.some(x => /이 일은 그대가 한 것이 아니오/.test(x)), fight: said.some(x => /\[육상전\] 성 밖을 터는 투메드 기병 40/.test(x)) };
      out.khanEarly = (at(s, 1571, 12, 1, 296), JJ.pending());
      at(s, 1573, 5, 1, 296); await go([]);
      out.khan = { v: b().khan, bow: G.R.hasItem('jj_bow'), sann: said.some(x => /순의왕/.test(x)) };
      // ── 장가구 — 알린다 · 교섭 실패
      s = fresh(1550, 9, 1); at(s, 1550, 9, 10, 309); await go(['warn']); out.warn = { warn: b().warn, again: JJ.pending() };
      at(s, 1550, 10, 1, 188); await go(['stay']); out.warnRaid = { raid: b().raid, closed: said.some(x => /성문은 하루 일찍 닫혔고/.test(x)) };
      luck = false; s = fresh(1550, 9, 1); const g3 = s.player.gold; at(s, 1550, 9, 10, 309); await go(['talk']);
      out.fail = { altan: b().altan, paid: g3 - s.player.gold, letter: G.R.hasItem('jj_letter'), noKhan: (at(s, 1575, 1, 1, 296), JJ.pending()) };
      // ── 소식
      s = fresh(1542, 1, 1); s.jiajing = { told: {}, call: 'yes', maid: 'saved', raid: 'defend', altan: 'talk', letter: 'given' }; s.loc = { mode: 'sea', lon: 120, lat: 30 };
      const day = (y, m, d) => { s.date = { y, m, d }; return JJ.daily().map(x => x.text).join(' | '); };
      out.news = { renyin: day(1542, 12, 7), purge: day(1542, 12, 12), xiyuan: day(1543, 1, 15), gengxu: day(1550, 10, 7), withdraw: day(1550, 10, 14), mashi: day(1551, 5, 20), death: day(1567, 1, 23), peace: day(1571, 4, 21), guihua: day(1572, 6, 1) };
      s = fresh(1600, 1, 1); delete s.jiajing; out.oldSave = JJ.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'jiajing');
      out.journal = !!(JJ.daily && JJ.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ call: r.call, amber: r.amber, night: r.night, raid: r.raid, fail: r.fail }));
    const g = r.gate;
    ok(!g.early && g.port && !g.inland && !g.late && !g.noCallNight, '① 고 태감은 1540~1542.10 명의 항구에서만 · 약조하지 않으면 임인년의 밤은 없다');
    ok(r.call.v === 'yes' && r.call.pass && r.call.noSell && r.call.gate && r.call.entry && r.call.tao, '① 통행패 — 북경 성문이 열린다(팔 수 없다) · 서원의 도중문');
    ok(r.amber.v === 1 && r.amber.gold === r.amber.expect && r.amber.gold === 5700 && r.amber.left === 2 && r.nightNext, '② 용연향 10통을 서원에 — 시세 3배(5,700) · 이어서 그날 밤');
    const n = r.night;
    ok(n.v === 1 && n.maid === 'saved' && n.date === '12.7' && n.paid >= 1500 && n.paid < 2200 && n.bowl && n.dew && n.knot && n.xiyuan, '③ 임인년의 밤(12.7) — 이슬 받는 궁녀 · 엉킨 매듭 · 사례감의 빈 궤짝으로 소란을 빼낸다 · 은사발 · 서원으로');
    ok(r.lost.maid === 'lost' && !r.lost.amber && r.lost.guard && r.left === 'left' && r.refuse.call === 'no' && !r.refuse.pass && r.refuse.cold, '금의위에 지면 붙잡힌다 · 「끼지 않겠소」 · 약조를 사양하면 통행패도 없다');
    ok(r.border.altan === 'talk' && r.border.letter && r.border.market, '④ 장가구 → 알탄 칸의 천막 — 「시장을 열어 주면 칼을 거둔다」 · 칸의 편지');
    const rd = r.raid;
    ok(rd.raid === 'defend' && rd.date === '10.7' && rd.fight && rd.yan && rd.qiu && rd.letter === 'given' && rd.gone && rd.gold && rd.credit, '④ 북경(10.7) — 엄숭 「성 밖은 털어 가게 두라」 · 구란 · 덕승문 밖 마을을 지킨다 · 편지를 엄숭에게(공은 엄숭이 가로챈다 · 금화 3,000)');
    ok(r.khanEarly === false && r.khan.v === 1 && r.khan.bow && r.khan.sann, '⑤ 귀화성(1572~) — 늙은 알탄과 종금 하툰 · 알탄 칸의 활');
    ok(r.warn.warn === 1 && r.warn.again === false && r.warnRaid.raid === 'stay' && r.warnRaid.closed, '장가구에서 북경으로 알리면 성문이 하루 일찍 닫힌다');
    ok(r.fail.altan === 'fail' && r.fail.paid === 2000 && !r.fail.letter && r.fail.noKhan === false, '교섭에 실패하면 몸값 2,000 · 귀화성 장면도 없다');
    const nw = r.news;
    ok(/매듭이 엉켜/.test(nw.renyin) && /찾지 못했다/.test(nw.purge) && /도중문/.test(nw.xiyuan) && /지켜 냈다/.test(nw.gengxu) && /바다의 상인이었다/.test(nw.withdraw) && /엄숭에게 전한 사람/.test(nw.mashi) && /해서/.test(nw.death) && /순의왕/.test(nw.peace) && /후허호토/.test(nw.guihua), '소식 — 임인궁변 · 처형 · 서원 · 경술의 변 · 물러간 몽골 · 대동 마시 · 가정제의 죽음(해서) · 융경화의 · 귀화성');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
