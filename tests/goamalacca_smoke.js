/* 포르투갈의 고아·말라카 점령 (2026-10-28 사용자 요청) — node tests/goamalacca_smoke.js   (BROWSER_EXE=크롬 경로)
   · 인물 8명 · 시장 사건 malaccaspice · 날짜·도시마다 장면이 열린다 (코친·고아·카나놀·말라카)
   · 포르투갈 편 한 판: 코친에서 함대에 든다 → 고아의 열쇠(사례) → 만도비 강에 식량을 건넨다(식량 −30) → 카나놀에서 함대에 들어 고아 재점령(몫) → 학살 속에 가족을 숨긴다 →
     말라카의 편지를 받아 코친에서 전한다(수비 30% 약해짐) → 말라카의 다리(몫 ×1.15) → 클링 거리를 지킨다 → 보물 상자를 나눠 싣는다 → 침몰 소식 뒤 사례 → 향료 시장 사건 → 총독의 죽음
   · 다른 편 한 판: 고아에서 비자푸르 편(고아 성문의 열쇠) · 말라카에서 술탄 편(술탄의 크리스) · 편지를 술탄에게 판다(악명)
   · G.HISTORY 고아·말라카 한 줄은 창을 띄우지 않는다(quiet) — 소식 창은 하나 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.GoaMal && G.Hist && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, GM = G.GoaMal, said = [], asked = [], out = {};
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const fights = [];
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { fights.push({ name, n, kind: o && o.kind }); return 'win'; };
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1509, m: 6, d: 1 }; delete s.goaMal; s.fleet.food = 200; s.fleet.crew = 120; s.player.gold = 1000; return s;
      };
      const at = (s, y, m, d, city) => { s.date = { y, m, d }; s.loc = { mode: 'city', city }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = GM.pending(); if (p) await GM.check(); return p; };
      out.figs = G.GOAMAL_FIGS.length; out.figNames = G.GOAMAL_FIGS.every(id => G.HIST_FIG[id] && G.Hist.speaker(id).name === G.HIST_FIG[id].name);
      out.spiceDef = !!(G.Econ && G.Econ.DEF && G.Econ.DEF.malaccaspice);
      // 날짜·도시마다 열리는가
      let s = fresh();
      const gate = (y, m, d, c, st) => { at(s, y, m, d, c); s.goaMal = Object.assign({ told: {} }, st || {}); return GM.pending(); };
      out.gates = {
        cochin: gate(1509, 12, 1, 154), cochinEarly: gate(1509, 10, 1, 154), cannanore: gate(1510, 2, 1, 151), calicutNo: gate(1509, 12, 1, 152),
        first: gate(1510, 3, 10, 150), winter: gate(1510, 6, 10, 150), muster: gate(1510, 10, 15, 151), assault: gate(1510, 11, 22, 150), assaultLate: gate(1510, 11, 26, 150, { winter: 'leave', first: 1 }),
        hostage: gate(1510, 6, 1, 160), siege: gate(1511, 7, 20, 160, { letter: 'no' }), flor: gate(1511, 9, 1, 160, { mal: 'pt', letter: 'no' }), florNo: gate(1511, 9, 1, 160, { mal: 'junk', letter: 'no' }),
        deliver: gate(1511, 1, 10, 154, { letter: 'carry', side: 'no' }), deliverGoaBij: gate(1510, 7, 1, 150, { letter: 'carry', side: 'no', winter: 'leave', first: 1 }), deliverGoaNov: gate(1510, 11, 22, 150, { letter: 'carry', side: 'no', retake: 'leave' }), deliverGoaPT: gate(1511, 1, 5, 150, { letter: 'carry', side: 'no' })
      };
      // ── 포르투갈 편 한 판
      s = fresh('PT');
      at(s, 1510, 1, 20, 154); await go(['pt']);
      out.cochin = { side: s.goaMal.side, timoja: said.some(x => /^티모자: .*고아/.test(x)), calicut: said.some(x => /캘리컷은 졌소/.test(x)) };
      at(s, 1510, 3, 10, 150); let g0 = s.player.gold; await go([]);
      out.first = { gold: s.player.gold - g0, keys: said.some(x => /3월 4일에 성문이 열렸소/.test(x)), owner: G.R.cityOwner(G.CITY_DATA[150]) };
      at(s, 1510, 6, 20, 150); const food0 = s.fleet.food; await go(['feed']);
      out.winter = { opts: asked[0] && asked[0].opts, food: food0 - s.fleet.food, owner: G.R.cityOwner(G.CITY_DATA[150]), envoy: said.some(x => /^아딜 샤의 사절: /.test(x)), val: s.goaMal.winter };
      at(s, 1510, 10, 20, 151); g0 = s.player.gold; fights.length = 0; await go(['pt', 'shelter']);
      out.retake = { r: s.goaMal.retake, res: s.goaMal.retakeRes, gold: s.player.gold - g0, fight: fights[0], sack: s.goaMal.sack, three: said.some(x => /사흘/.test(x)), noto: s.player.notoriety || 0 };
      at(s, 1510, 12, 1, 160); await go(['carry']);
      out.hostage = { letter: s.goaMal.letter, item: G.R.hasItem('araujo_letter'), araujo: said.some(x => /루이 드 아라우주: .*다리가 이 도시의 목/.test(x)) };
      at(s, 1511, 2, 1, 154); await go([]);
      out.deliver = { letter: s.goaMal.letter, item: G.R.hasItem('araujo_letter') };
      at(s, 1511, 7, 20, 160); g0 = s.player.gold; fights.length = 0; await go(['pt', 'protect']);
      out.siege = { mal: s.goaMal.mal, res: s.goaMal.malRes, n: fights[0] && fights[0].n, gold: s.player.gold - g0, sack: s.goaMal.malSack, magellan: said.some(x => /^페르난도 데 마가야네스: .*세랑/.test(x)), elephant: said.some(x => /코끼리/.test(x)) };
      at(s, 1511, 9, 10, 160); await go(['carry']);
      out.flor = { v: s.goaMal.flor };
      // 소식: 침몰 → 사례 · 단서
      s.loc = { mode: 'sea', lon: 90, lat: 5 }; s.date = { y: 1511, m: 11, d: 20 }; g0 = s.player.gold;
      const n1 = GM.daily().map(x => x.text);
      out.sink = { news: n1.join(' | '), gold: s.player.gold - g0, hint0: !!(s.hints && s.hints.flordelamar) };
      s.date = { y: 1512, m: 6, d: 1 }; const n2 = GM.daily().map(x => x.text); out.sink.hint = !!(s.hints && s.hints.flordelamar);
      out.spice = { news: n2.join(' | '), ev: !!((s.econ && (s.econ.events || s.econ.list || []).some && (s.econ.events || s.econ.list || []).some(e => e.type === 'malaccaspice')) || JSON.stringify(s.econ || {}).indexOf('malaccaspice') >= 0) };
      s.date = { y: 1515, m: 12, d: 16 }; out.death = GM.daily().map(x => x.text).join(' | ');
      out.logs = s.log.map(x => x.t).filter(t => /알부케르크|고아|말라카/.test(t)).length;
      out.court = GM.html();
      // ── 다른 편 한 판
      s = fresh('EN');
      at(s, 1510, 11, 22, 150); s.goaMal = { told: {}, first: 1, winter: 'leave' }; fights.length = 0; await go(['bij']);
      out.bij = { r: s.goaMal.retake, key: G.R.hasItem('goa_gate_key'), fight: fights[0] && fights[0].name, rasul: said.some(x => /^라술 칸: /.test(x)) };
      at(s, 1510, 12, 1, 160); const nt0 = s.player.notoriety || 0; g0 = s.player.gold; await go(['sultan']);
      out.sell = { letter: s.goaMal.letter, noto: (s.player.notoriety || 0) - nt0, gold: s.player.gold - g0 };
      at(s, 1511, 8, 5, 160); await go(['sultan']);
      out.sultan = { mal: s.goaMal.mal, kris: G.R.hasItem('malacca_kris'), mahmud: said.some(x => /^술탄 마흐무드 샤: /.test(x)) };
      at(s, 1511, 9, 10, 160); out.florNotForSultan = !GM.pending();
      s.date = { y: 1511, m: 8, d: 24 }; out.malNews = GM.daily().map(x => x.text).join(' | ');
      // ── 먹을 것이 모자라면 식량을 건넬 수 없다
      s = fresh('PT'); s.fleet.food = 10; at(s, 1510, 6, 20, 150); s.goaMal = { told: {}, first: 1 }; await go(['envoy']);
      out.lowFood = { opts: asked[0] && asked[0].opts, val: s.goaMal.winter, bij: s.goaMal.bij };
      // ── G.HISTORY: 고아 한 줄은 창을 띄우지 않는다 · 소식은 하나
      s = fresh('PT'); s.date = { y: 1510, m: 11, d: 24 };
      s.history = G.HISTORY.findIndex(h => h.y === 1510 && h.m === 11 && h.city && h.city[0] === 150);
      s.goaMal = { told: { calicut: 1, goa1: 1, lost: 1, escape: 1 } };
      const w24 = G.World.daily().filter(x => /고아/.test(x.text || '')).length;
      s.date = { y: 1510, m: 11, d: 25 };
      const w25 = G.World.daily().filter(x => /고아/.test(x.text || '')).map(x => x.text);
      out.hist = { before: w24, at: w25.length, text: w25.join(' | '), quiet: G.HISTORY.filter(h => h.quiet && h.city && (h.city[0] === 150 || h.city[0] === 160)).length };
      // ── 옛 저장: 1513년에 처음 불러오면 지난 소식은 뜨지 않는다
      s = fresh('PT'); s.date = { y: 1513, m: 3, d: 1 }; delete s.goaMal;
      out.oldSave = GM.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'goamal');
      out.journal = !!(G.GoaMal.daily && G.GoaMal.daily._journal);
      return out;
    });
    console.log(JSON.stringify(r.siege), JSON.stringify(r.retake), r.death.slice(0, 120));
    ok(r.figs === 8 && r.figNames && r.spiceDef, '인물 8명(대화창 이름) · 시장 사건 「말라카의 향료」');
    const g = r.gates;
    ok(g.cochin && !g.cochinEarly && g.cannanore && !g.calicutNo && g.first && g.winter && g.muster && g.assault && !g.assaultLate && g.hostage && g.siege && g.flor && !g.florNo && g.deliver && !g.deliverGoaBij && !g.deliverGoaNov && g.deliverGoaPT,
      '장면이 날짜·도시에 맞게 열린다 (코친 1509.11.4~ · 캘리컷 아님 · 고아 11.25 뒤 닫힘 · 비자푸르령 고아에서는 편지를 못 전함 — 11.25 전 고아도) ' + JSON.stringify(g));
    ok(r.cochin.side === 'pt' && r.cochin.timoja && r.cochin.calicut, '① 코친: 캘리컷에서 진 총독과 티모자의 「고아」 → 함대에 든다');
    ok(r.first.gold === 1500 && r.first.keys && r.first.owner === '포르투갈', '② 고아의 열쇠: 3월 4일 성문이 열렸다 · 총독의 사례 1,500 · 그때 고아는 포르투갈령');
    ok(r.winter.opts.join() === 'feed,envoy,leave' && r.winter.food === 30 && r.winter.owner !== '포르투갈' && r.winter.envoy && r.winter.val === 'feed', '③ 만도비 강: 비자푸르가 되찾은 고아 · 사절 · 봉쇄를 뚫고 식량 30통');
    ok(r.retake.r === 'pt' && r.retake.res === 'win' && r.retake.gold === 6000 && r.retake.fight && r.retake.fight.n === 95 && r.retake.sack === 'shelter' && r.retake.three && r.retake.noto === 0, '④ 카나놀에서 함대에 들어 고아 재점령 (수비대 95 · 몫 6,000) → 사흘의 학살 속에 가족을 숨긴다 (악명 없음)');
    ok(r.hostage.letter === 'carry' && r.hostage.item && r.hostage.araujo && r.deliver.letter === 'given' && !r.deliver.item, '⑤ 말라카의 인질: 아라우주의 편지를 받아 코친에서 전했다');
    ok(r.siege.mal === 'pt' && r.siege.n === 77 && r.siege.gold === Math.round(9000 * 1.15) && r.siege.sack === 'protect' && r.siege.magellan && r.siege.elephant, '⑥ 말라카의 다리: 편지 덕에 수비 110 → 77 · 몫 ×1.15 · 클링 거리를 지킨다 · 마가야네스와 세랑');
    ok(r.flor.v === 'carry' && /바다의 꽃/.test(r.sink.news) && r.sink.gold === 4500 && !r.sink.hint0 && r.sink.hint, '⑦ 보물 상자를 나눠 싣고 — 침몰 소식 뒤 사례 4,500 · 난파선 단서는 찾을 수 있게 되는 1512년부터');
    ok(/말라카의 향료/.test(r.spice.news) && r.spice.ev, '말라카의 향료가 리스본에 — 시장 사건이 시작된다');
    ok(/알부케르크의 죽음/.test(r.death) && /함께 고아의 성벽에/.test(r.death) && r.logs >= 8 && /인도양의 열쇠|^$/.test(r.court), '총독의 죽음(함께한 제독의 줄) · 일지 ' + r.logs + '줄');
    ok(r.bij.r === 'bij' && r.bij.key && r.bij.fight === '알부케르크의 상륙대' && r.bij.rasul, '다른 편: 고아에서 비자푸르 편 — 라술 칸 · 고아 성문의 열쇠');
    ok(r.sell.letter === 'sultan' && r.sell.noto === 3 && r.sell.gold === 1500, '편지를 술탄의 벤다하라에게 팔면 금화 1,500 · 악명 +3');
    ok(r.sultan.mal === 'sultan' && r.sultan.kris && r.sultan.mahmud && r.florNotForSultan && /왕실 사람들은 무사히/.test(r.malNews), '말라카에서 술탄 편 — 왕실을 빈탄으로 · 술탄의 크리스 · 보물선 장면은 없다 · 함락 소식이 달라진다');
    ok(r.lowFood.opts.join() === 'envoy,leave' && r.lowFood.val === 'envoy' && r.lowFood.bij === 1, '식량이 30통보다 적으면 건넬 수 없다 · 사절을 태운다');
    ok(r.hist.before === 0 && r.hist.at === 1 && /성 카타리나의 날/.test(r.hist.text) && r.hist.quiet === 2, 'G.HISTORY 고아·말라카 한 줄은 창을 띄우지 않고, 11월 25일 소식 창은 하나 (' + r.hist.text.slice(0, 40) + ')');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장(1513)에 지난 소식이 몰려 뜨지 않는다 · 소문 · 일지에 남는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
