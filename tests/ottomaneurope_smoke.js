/* 오스만과 유럽 세계의 다툼 (2026-11-01) — 빈 포위(1529) · 프레베자(1538) · 호르무즈(1622) · 무스카트(1649) · 빈 포위와 칼렌베르크(1683) · 카를로비츠(1699) · 소식
   node tests/ottomaneurope_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const OE = G.OttoEu, out = {}, said = [], asks = [], battles = [], seas = [], toasts = [];
      let picks = [], fightRes = 'win', seaGo = true;
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value) }); const want = picks.shift(); const o = opts.find(x => x.value === want && !x.dis) || opts.filter(x => !x.dis).slice(-1)[0]; return o.value; };
      G.UI.toast = (t) => { toasts.push(t); };
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, o }); return fightRes; };
      G.Rel.greatBattle = async (spec) => { seas.push(spec); return seaGo; };
      function fresh(y, m, d, city, sk, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, sk || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: (o && o.nation) || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = 1000; s.fleet.cargo = {};
        if (city != null) { const c = G.CITY_DATA[city]; s.loc = { mode: 'city', city, lon: c.lon, lat: c.lat }; }
        said.length = 0; asks.length = 0; battles.length = 0; seas.length = 0; toasts.length = 0; delete s.ottoEu;
        return s;
      }
      const has = id => G.Game.state.player.items.some(x => x.id === id);
      const trust = id => G.Sponsor.rel(id).trust;
      out.data = { figs: G.OTTOEU_FIGS.length, allFig: G.OTTOEU_FIGS.every(id => G.HIST_FIG[id] && G.HIST_FIG[id].look), items: ['vienna_bowl', 'hz_firman', 'hz_ledger', 'narottam_ring', 'kolschitzky_cup', 'karlowitz_knob'].every(id => G.ITEM[id]) };

      // ① 1529 빈 — 과학으로 실마리 → 한 번 틀리고 물 대야 → 굴 속 싸움
      let s = fresh(1529, 10, 1, 54, { sci: 2 }); const e0 = trust('de_emperor');
      out.v1Pend = OE.pending(); picks = ['tunnel', 'dog', 'bowl']; await OE.check();
      out.v1 = { st: s.ottoEu.v1, tries: s.ottoEu.v1Try, bowl: has('vienna_bowl'), trust: trust('de_emperor') - e0, salm: said.some(t => t.startsWith('니클라스 잘름 백작|')), hint: said.some(t => /물이 먼저 압니다/.test(t)), b: battles[0] && battles[0].name, n: battles[0] && battles[0].n, end: said.some(t => /10월 14일 밤/.test(t)), again: OE.pending() };
      // 1529 빈 — 돌격 · 너무 이르면/늦으면 없다
      s = fresh(1529, 9, 28, 54); picks = ['sortie']; await OE.check(); out.v1b = { st: s.ottoEu.v1, b: battles[0] && battles[0].name, guns: battles[0] && battles[0].o.guns };
      out.v1Early = (fresh(1529, 8, 20, 54), OE.pending()); out.v1Late = (fresh(1529, 10, 20, 54), OE.pending());

      // ② 1538 프레베자 앞바다 (바다의 하루 끝)
      s = fresh(1538, 9, 20, null); s.loc = { mode: 'sea', lon: 20.6, lat: 39.0 };
      out.pvSea = OE.seaPending(); out.pvCity = OE.pending(); await OE.atSea();
      const sp = seas[0] || {};
      out.pv = { st: s.ottoEu.pv, id: sp.id, ships: (sp.ships || []).length, allies: (sp.allies || []).length, boss: sp.boss && sp.boss.hist, council: (sp.council || []).map(x => x[0]).join(','), foe: (sp.foeScene || []).map(x => x[0]).join(',') };
      const d0 = trust('it_doria'), g0 = s.player.gold; G.Rel.afterBattle({ great: 'ot_preveza' }, 'win', []);
      out.pvWin = { st: s.ottoEu.pv, gold: s.player.gold - g0, doria: trust('it_doria') - d0 };
      out.pvOut = (fresh(1538, 9, 20, null), G.Game.state.loc = { mode: 'sea', lon: 5, lat: 39 }, OE.seaPending());
      s = fresh(1538, 9, 22, null); s.loc = { mode: 'sea', lon: 20.6, lat: 39.0 }; seaGo = false; await OE.atSea(); seaGo = true;
      out.pvDecl = { st: s.ottoEu.pv, said: said.some(t => /코르푸로 돌렸다/.test(t)) };

      // ③ 1622 호르무즈 — 요새 편 / 이맘 쿨리 칸 편
      s = fresh(1622, 3, 10, 128); picks = ['defend']; await OE.check();
      const p0 = trust('pt_king'); out.hz1 = { st: s.ottoEu.hz, spec: seas[0] && seas[0].id, back: seas[0] && seas[0].backCity, baffin: said.some(t => /배핀/.test(t)), imam: said.some(t => t.startsWith('이맘 쿨리 칸|')) };
      G.Rel.afterBattle({ great: 'ot_hormuz_pt' }, 'win', []);
      out.hz1.after = s.ottoEu.hz; out.hz1.ledger = has('hz_ledger'); out.hz1.trust = trust('pt_king') - p0;
      s = fresh(1622, 3, 10, 128); const p1 = trust('pt_king'); picks = ['persia']; await OE.check();
      out.hz2 = { st: s.ottoEu.hz, spec: seas[0] && seas[0].id, trust: trust('pt_king') - p1, label: asks[0].o.join() };
      G.Rel.afterBattle({ great: 'ot_hormuz_pe' }, 'win', []); out.hz2.after = s.ottoEu.hz; out.hz2.firman = has('hz_firman');
      out.hzLate = (fresh(1622, 4, 25, 128), OE.pending());

      // ④ 1649 무스카트 — 나로탐을 돕는다 / 수비대장에게 알린다
      s = fresh(1649, 12, 1, 125); const pg = s.player.gold; picks = ['imam']; await OE.check();
      out.ms1 = { st: s.ottoEu.ms, ring: has('narottam_ring'), gold: s.player.gold - pg, b: battles[0] && battles[0].name, narottam: said.some(t => t.startsWith('나로탐|') && /화약/.test(t)), saif: said.some(t => t.startsWith('술탄 빈 사이프|')) };
      s = fresh(1649, 12, 1, 125); fightRes = 'win'; picks = ['warn']; const p2 = trust('pt_king'); await OE.check();
      out.ms2 = { st: s.ottoEu.ms, b: battles[0] && battles[0].name, hold: battles[0] && battles[0].o.hold, pereira: said.some(t => t.startsWith('페레이라|')), trust: trust('pt_king') - p2 };
      out.msLate = (fresh(1650, 1, 5, 125), OE.pending());

      // ⑤ 1683 빈 — 콜시츠키(노래) → 칼렌베르크 → 커피 집
      s = fresh(1683, 7, 20, 54, { speech: 1 }); picks = ['song']; await OE.check();
      out.v2a = { st: s.ottoEu.v2spy, kol: said.some(t => t.startsWith('콜시츠키|')), task: OE.html().replace(/<[^>]+>/g, ' '), batNow: OE.pending() };
      s.date = { y: 1683, m: 9, d: 10 }; picks = ['fight']; battles.length = 0; const vg = s.player.gold; await OE.check();
      out.v2b = { st: s.ottoEu.v2bat, gold: s.player.gold - vg, b: battles[0] && battles[0].name, n: battles[0] && battles[0].n, charge: said.some(t => /날개를 단 폴란드 기병/.test(t)), sob: said.some(t => t.startsWith('얀 3세 소비에스키|')) };
      s.date = { y: 1683, m: 10, d: 5 }; await OE.check();
      out.v2c = { cof: s.ottoEu.v2cof, coffee: s.fleet.cargo.coffee ? s.fleet.cargo.coffee.q : 0, cup: has('kolschitzky_cup'), kipfel: said.some(t => /킵펠/.test(t)), again: OE.pending() };
      // 함께하지 않은 사람에게는 커피 집이 없다
      s = fresh(1683, 10, 5, 54); out.v2noCoffee = OE.pending();

      // ⑥ 1698 카를로비츠 — 베니스에서, 제비뽑기 다음 둥근 정자
      s = fresh(1698, 12, 1, 29); picks = ['lots', 'round']; await OE.check();
      out.kw = { st: s.ottoEu.kw, tries: s.ottoEu.kwTry, knob: has('karlowitz_knob'), paget: said.some(t => t.startsWith('윌리엄 패짓 경|')), mavro: said.some(t => t.startsWith('알렉산드로스 마브로코르다토스|')) };
      s = fresh(1698, 12, 1, 112); picks = ['lots', 'old', 'lots']; await OE.check(); out.kw2 = { st: s.ottoEu.kw, tries: s.ottoEu.kwTry };
      out.kwLisbon = (fresh(1698, 12, 1, 0), OE.pending());

      // 소식 — 1622~1699: 호르무즈 · 무스카트 · 몸바사 · 카를로비츠 (+관계)
      s = fresh(1622, 4, 1, null); s.loc = { mode: 'sea', lon: 0, lat: 40 }; OE.daily(); s.ottoEu.v2met = 1; const news = [];
      for (let i = 0; i < 80000 && U(s) < 16990201; i++) { s.date = G.U.addDays(s.date, 1); OE.daily().forEach(x => news.push(x.text)); }
      function U(s) { return G.U.dateNum(s.date); }
      out.news = news.map(t => (t.match(/【([^】]+)】/) || [])[1]);
      out.rel = G.Rel.get('HRE', 'OT').why;
      // 옛 저장(1699년 2월): 지난 소식은 몰아서 없음
      s = fresh(1699, 2, 1, null); s.loc = { mode: 'sea', lon: 0, lat: 40 }; out.old = OE.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.figs === 18 && r.data.allFig && r.data.items, '인물 18명(생김새 포함) · 기념품 6가지');
    ok(r.v1Pend && r.v1.st === 'tunnel' && r.v1.tries === 2 && r.v1.bowl && r.v1.trust === 10 && r.v1.salm && r.v1.hint && /땅굴/.test(r.v1.b) && r.v1.n === 28 && r.v1.end && !r.v1.again, '1529 빈: 잘름 백작 · 과학의 실마리 · 물 대야와 완두콩 · 굴 속 싸움 · 10월 14일 철수 · 황제의 신뢰');
    ok(r.v1b.st === 'sortie' && /예니체리/.test(r.v1b.b) && r.v1b.guns === true && !r.v1Early && !r.v1Late, '1529 빈: 성문 밖 돌격 — 9월 전·10월 14일 뒤에는 없다');
    ok(r.pvSea && !r.pvCity && r.pv.st === 'fight' && r.pv.id === 'ot_preveza' && r.pv.ships === 8 && r.pv.allies === 4 && r.pv.boss === 'hayreddin' && /adoria/.test(r.pv.council) && /ot_capello/.test(r.pv.council) && /turgut/.test(r.pv.foe), '1538 프레베자 앞바다: 도리아·카펠로·그리마니의 회의 → 바르바로사와 큰 해전');
    ok(r.pvWin.st === 'won' && r.pvWin.gold === 8000 && r.pvWin.doria === 10 && r.pvOut === false && r.pvDecl.st === 'declined' && r.pvDecl.said, '프레베자: 이기면 포상·도리아의 신뢰 / 다른 바다엔 없다 / 물러나면 도리아가 코르푸로');
    ok(r.hz1.st === 'defend' && r.hz1.spec === 'ot_hormuz_pt' && r.hz1.back === 128 && r.hz1.baffin && r.hz1.imam && r.hz1.after === 'defendWon' && r.hz1.ledger && r.hz1.trust === 10, '1622 호르무즈: 요새 편 — 잉글랜드 함대와 큰 해전 · 장부 상자 · 포르투갈 궁정의 신뢰');
    ok(r.hz2.spec === 'ot_hormuz_pe' && r.hz2.trust === -20 && /persia/.test(r.hz2.label) && r.hz2.after === 'persiaWon' && r.hz2.firman && !r.hzLate, '1622 호르무즈: 이맘 쿨리 칸 편 — 조국 궁정 신뢰 -20 · 통행장 / 4월 23일 뒤엔 없다');
    ok(r.ms1.st === 'imamWon' && r.ms1.ring && r.ms1.gold === 5000 && /잘랄리/.test(r.ms1.b) && r.ms1.narottam && r.ms1.saif, '1649 무스카트: 나로탐의 꾀 → 술탄 빈 사이프의 성탄 밤 기습 · 은 반지');
    ok(r.ms2.st === 'warnWon' && /오만 전사/.test(r.ms2.b) && r.ms2.hold === 3 && r.ms2.pereira && r.ms2.trust === 12 && !r.msLate, '1649 무스카트: 수비대장에게 알린다 → 웃어넘기고, 부두를 지켜 가족들을 배에 태운다');
    ok(r.v2a.st === 'song' && r.v2a.kol && /칼렌베르크/.test(r.v2a.task) && !r.v2a.batNow, '1683 빈: 콜시츠키를 튀르크 노래로 성 안에 — 수첩에 칼렌베르크 안내');
    ok(r.v2b.st === 'won' && r.v2b.gold === 10000 && /카라 무스타파/.test(r.v2b.b) && r.v2b.n === 130 && r.v2b.charge && r.v2b.sob, '1683 칼렌베르크: 소비에스키와 날개 기병 — 오스만 대군을 무너뜨린다');
    ok(r.v2c.cof && r.v2c.coffee === 20 && r.v2c.cup && r.v2c.kipfel && !r.v2c.again && !r.v2noCoffee, '빈의 커피 집: 커피 20통 · 잔 · 킵펠 (함께한 사람만)');
    ok(r.kw.st === 'solved' && r.kw.tries === 2 && r.kw.knob && r.kw.paget && r.kw.mavro && r.kw2.st === 'carpenter' && r.kw2.tries === 3 && !r.kwLisbon, '1698 카를로비츠: 문이 여럿인 둥근 정자 (세 번 틀리면 목수가) · 리스본엔 없다');
    ok(JSON.stringify(r.news) === JSON.stringify(['호르무즈 함락', '무스카트 함락', '카라 무스타파의 최후', '몸바사 함락', '카를로비츠 조약']) && r.rel === '카를로비츠 조약', '소식: 호르무즈 · 무스카트 · 카라 무스타파 · 몸바사 · 카를로비츠 (관계도 바뀐다)');
    ok(r.old === 0, '옛 저장은 지난 소식을 몰아서 알리지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
