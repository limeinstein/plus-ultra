/* 사파비 왕조의 성립(1501)·찰디란 전투(1514) (2026-11-02 사용자 요청) — node tests/safavid_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 타브리즈의 금요일 — 노학자 구출(말솜씨) · 샤의 편지 → 베니스의 도제 · 선물 갈래(하타이의 시집) · 날짜 문
   · ② 오스만 편 — 이스탄불 화약 → 트레비존드(늦으면 절반·싸움 없음) → 찰디란 → 오스만 명예 작위 · 베흐루제를 돌려보내자고 청한다
   · ② 사파비 편 — 샤의 진영(두르미시·우스타질루) → 찰디란 → 베흐루제 구출(늪 / 매수) → 페르시아 명예 작위 · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Safavid && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], asked = [], fights = [], out = {};
      let plan = [], landRes = [], luck = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => luck;
      G.Scenes.land.landBattle = async (nm, n, b, o) => { fights.push(nm + ' ' + n); said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const SF = G.Safavid;
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; fights.length = 0; const p = SF.pending(); if (p) await SF.check(); return p; };
      const rank = (rid) => G.Court.rank(G.COURT.realms[rid]);
      // ── 날짜·장소의 문
      let s = fresh(1501, 3, 1);
      out.gate = { early: (at(s, 1501, 6, 30, 131), SF.pending()), late: (at(s, 1502, 1, 1, 131), SF.pending()), elsewhere: (at(s, 1501, 8, 1, 130), SF.pending()), open: (at(s, 1501, 8, 1, 131), SF.pending()) };
      // ── ① 노학자를 말로 빼낸다 · 편지를 받는다 → 베니스
      at(s, 1501, 8, 1, 131); await go(['mulla', 'talk', 'take']);
      out.friday = { v: s.safavid.friday, mulla: s.safavid.mulla, twelve: said.some(x => /열두 이맘/.test(x)), qizil: said.some(x => /키질바시/.test(x)), letter: G.R.hasItem('sf_letter'), noSell: !!G.ITEM.sf_letter.noSell, again: SF.pending() };
      let g0 = s.player.gold; at(s, 1502, 3, 1, 29); await go([]);
      out.doge = { v: s.safavid.letter, gold: s.player.gold - g0, gone: !G.R.hasItem('sf_letter'), loredan: said.some(x => /레오나르도 로레단/.test(x)) };
      // ── 선물 갈래
      s = fresh(1501, 9, 1); at(s, 1501, 9, 1, 131); g0 = s.player.gold; await go(['gift', 'no']);
      out.gift = { divan: G.R.hasItem('sf_divan'), gold: g0 - s.player.gold, poem: said.some(x => /하타이/.test(x)), letter: s.safavid.letter };
      // ── ② 오스만 편: 화약 → 트레비존드(8.1) → 찰디란
      s = fresh(1514, 4, 1); at(s, 1514, 4, 1, 112); await go(['yes']);
      out.otAsk = { side: s.safavid.side, powder: G.R.hasItem('sf_powder') };
      const ot0 = rank('OT'); g0 = s.player.gold; at(s, 1514, 8, 1, 116); await go(['go', 'ask']);
      out.ot = { powder: s.safavid.powder, date: s.date.m + '.' + s.date.d, fight: fights.join('|'), battle: s.safavid.battle, rank: rank('OT') - ot0, gold: s.player.gold - g0, wife: s.safavid.wife, wagons: said.some(x => /쇠사슬로 묶어/.test(x)), selim: said.some(x => /그대의 화약이 오늘/.test(x)) };
      // ── 늦게 닿으면 절반 · 싸움 없음
      s = fresh(1514, 4, 1); at(s, 1514, 4, 1, 112); await go(['yes']); g0 = s.player.gold; at(s, 1514, 8, 25, 116); await go([]);
      out.late = { powder: s.safavid.powder, gold: s.player.gold - g0, fights: fights.length, battle: s.safavid.battle };
      // ── ② 사파비 편: 진영 → 찰디란 → 늪의 지름길로 베흐루제를 구한다
      s = fresh(1514, 6, 10); s.safavid = { told: {}, friday: 1 }; const pe0 = rank('PE'); at(s, 1514, 6, 10, 131); await go(['warn', 'go', 'marsh']);
      out.sf = { side: s.safavid.side, date: s.date.m + '.' + s.date.d, fights: fights.length, wife: s.safavid.wife, rank: rank('PE') - pe0, durmish: said.some(x => /도적이나 하는 짓/.test(x)), ustajlu: said.some(x => /수레를 쇠사슬로 묶고/.test(x)), remember: said.some(x => /타브리즈의 금요일에 보았던/.test(x)), chivalry: said.some(x => /자고 있는 사람의 목을 베지 않는다/.test(x)) };
      // ── 매수 갈래 · 포기 갈래
      s = fresh(1514, 7, 1); at(s, 1514, 7, 1, 131); g0 = s.player.gold; await go(['quiet', 'go', 'bribe']);
      out.bribe = { wife: s.safavid.wife, paid: g0 - s.player.gold >= 2000 };
      s = fresh(1514, 7, 1); at(s, 1514, 7, 1, 131); await go(['quiet', 'go', 'no']);
      out.left = { wife: s.safavid.wife };
      // ── 소식
      s = fresh(1514, 1, 1); s.safavid = { told: {}, side: 'sf', battle: 'win', wife: 'saved', friday: 1, mulla: 'saved' }; s.loc = { mode: 'sea', lon: 30, lat: 40 };
      const day = (y, m, d) => { s.date = { y, m, d }; return SF.daily().map(x => x.text).join(' | '); };
      out.news = { chal: day(1514, 8, 23), tab: day(1514, 9, 5), black: day(1514, 10, 15) };
      s.safavid.told = {}; out.shia = day(1501, 8, 15);
      s = fresh(1600, 1, 1); delete s.safavid; out.oldSave = SF.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'safavid');
      out.journal = !!(SF.daily && SF.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ friday: r.friday, ot: r.ot, sf: r.sf, late: r.late }));
    const g = r.gate;
    ok(!g.early && !g.late && !g.elsewhere && g.open, '① 타브리즈의 금요일은 1501.7~12, 타브리즈에서만');
    ok(r.friday.v === 1 && r.friday.mulla === 'saved' && r.friday.twelve && r.friday.qizil && r.friday.letter && r.friday.noSell && !r.friday.again, '① 열두 이맘의 설교 · 키질바시 · 노학자를 말로 빼낸다 · 샤의 편지(팔 수 없다)');
    ok(r.doge.v === 'done' && r.doge.gold === 2500 && r.doge.gone && r.doge.loredan, '샤의 편지를 베니스의 도제 로레단에게 — 사례 금화 2,500');
    ok(r.gift.divan && r.gift.gold === 1000 && r.gift.poem && r.gift.letter === 'no', '선물 갈래 — 하타이의 시집 · 편지를 사양할 수도');
    ok(r.otAsk.side === 'ot' && r.otAsk.powder, '② 오스만 편 — 이스탄불 병기창의 화약 궤짝');
    const o = r.ot;
    ok(o.powder === 'done' && o.date === '8.23' && /키질바시 기병/.test(o.fight) && o.battle === 'win' && o.rank === 1 && o.gold >= 5700 && o.wagons && o.selim, '② 트레비존드에 화약(3,000) → 찰디란 8.23 → 셀림의 포상(3,000) · 오스만 명예 작위');
    ok(o.wife === 'saved', '셀림에게 청해 베흐루제 하눔을 돌려보낸다');
    ok(r.late.powder === 'late' && r.late.gold === 1500 && r.late.fights === 0 && !r.late.battle, '8.20 뒤에 닿으면 값은 절반 · 찰디란에는 가지 못한다');
    const f = r.sf;
    ok(f.side === 'sf' && f.date === '8.23' && f.fights === 2 && f.wife === 'saved' && f.rank === 1 && f.durmish && f.ustajlu && f.remember && f.chivalry, '② 사파비 편 — 「잠든 적을 치는 것은 도적질」 · 찰디란 · 늪의 지름길로 베흐루제 구출 → 페르시아 명예 작위');
    ok(r.bribe.wife === 'saved' && r.bribe.paid && r.left.wife === 'lost', '예니체리 매수로도 구한다 · 물러나면 끌려간다');
    ok(/찰디란 전투/.test(r.news.chal) && /샤의 편에/.test(r.news.chal) && /여드레/.test(r.news.tab) && !/이스탄불로 끌려갔다/.test(r.news.tab) && /아내가 있었다/.test(r.news.black) && /열두 이맘/.test(r.shia) && /트레비존드로 빠져나갔다/.test(r.shia), '소식 — 시아파의 나라 · 찰디란 · 타브리즈 입성 · 검은 옷의 샤 (구한 사람에 맞게)');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
