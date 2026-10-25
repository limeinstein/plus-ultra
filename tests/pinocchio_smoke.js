/* 피노키오 (2026-10-25 사용자 요청) — node tests/pinocchio_smoke.js   (BROWSER_EXE=크롬 경로)
   · 고래를 5번 만나기 전에는 대양에서 고래를 만나도 벌어지지 않는다 · 5번 넘게 만난 뒤에도 지중해(안쪽 바다)면 안 벌어진다
   · 5번 넘게 만난 뒤 대서양에서 고래 떼(바다의 사건)를 만나면: 피노키오 — 거짓말 · 늘 허탕 · 제페토가 고래에게 삼켜졌다
   · 포를 쏘려 하면 피노키오가 막는다 → 횃불 보트 · 제페토를 구한다 (stage carry · 명성 +)
   · 가까운 도시에 들어서면 제페토가 「사내라면 자기가 본받을 만한 사람을 따라가는 거다」 → 피노키오 합류 (항해술·측량·과학·조선기술 3)
   · 제페토가 떠나며 피노키오 인형을 준다 → 뱃노래 때 인형이 춤추면(50%) 피로 풀림·규율 오름 ×1.5, 안 추면 그대로 · 인형이 없으면 춤도 없다
   · 지나치면 coolDays 뒤에 다시 · 고래 발견물도 센다 (멀리 보이는 고래는 없다) · 저장·불러오기 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Pino && G.Pino.hooked && G.Explore, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], out = {};
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { said.push('[물음] ' + t + ' / ' + opts.map(o => o.label).join(' | ')); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => null;
      const fresh = () => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.loc = { mode: 'sea', lon: -30, lat: 30 }; s.fleet.food = 200; s.fleet.water = 200; s.fleet.fatigue = 0; return s;
      };
      // 바다의 사건 「고래 떼」만 나오게
      const w0 = G.U.weighted;
      const whaleEvt = async () => { G.U.weighted = (tb) => tb.find(e => e[0] === 'whales') || tb[0]; const st = {}; try { return await G.Explore.seaEvent({ st, refresh: () => {} }); } finally { G.U.weighted = w0; } };
      if (G.Pace) { G.Pace.ok = () => true; G.Pace.mark = () => {}; }
      // ① 5번 전: 대서양이어도 안 벌어진다
      let s = fresh();
      out.oceanAtl = G.Pino.inOcean(-30, 30); out.oceanMed = G.Pino.inOcean(15, 38); out.oceanPac = G.Pino.inOcean(-140, 10); out.oceanInd = G.Pino.inOcean(75, -10);
      for (let i = 0; i < 5; i++) { s.evtRecent = []; await whaleEvt(); }
      out.count5 = s.pino.whales; out.before = !s.pino.stage && !said.some(x => /피노키오/.test(x));
      // ② 지중해: 안 벌어진다 (세기는 한다)
      s.loc = { mode: 'sea', lon: 15, lat: 38 }; s.evtRecent = []; await whaleEvt();
      out.med = !s.pino.stage && s.pino.whales === 6;
      // ③ 대서양: 벌어진다 — 포(막힘) → 횃불 보트
      s.loc = { mode: 'sea', lon: -30, lat: 30 }; s.evtRecent = []; said.length = 0;
      const fame0 = s.player.fame || 0;
      plan = [1, 'cannon', 'torch'];
      await whaleEvt();
      out.meet = said.slice();
      out.stage = s.pino.stage; out.fatigue = s.fleet.fatigue; out.fame = (s.player.fame || 0) - fame0;
      out.noMate = !s.mates.some(m => m.id === 'pinocchio');
      // 저장·불러오기 사이에도 손님으로 남는다
      const json = G.State.serialize(); G.Game.state = G.State.deserialize(json); s = G.Game.state;
      out.reloadStage = s.pino.stage;
      // ④ 도시에 들어선다
      const c = G.CITY_DATA.find(x => x && /나폴리|리스본/.test(x.name)) || G.CITY_DATA[0];
      said.length = 0;
      await G.Pino.farewell(c);
      out.farewell = said.slice();
      const row = s.mates.find(m => m.id === 'pinocchio');
      out.joined = !!row; out.loyal = row && row.loyal; out.stageDone = s.pino.stage;
      out.def = { sk: G.MATE.pinocchio.sk, minor: G.MATE.pinocchio.minor, wage: G.MATE.pinocchio.wage, lg: G.MATE.pinocchio.lg };
      out.log = s.log.map(x => x.t).filter(t => /제페토/.test(t));
      out.doll = { has: G.R.hasItem('pinocchio_doll'), name: G.ITEM.pinocchio_doll && G.ITEM.pinocchio_doll.name, line: out.farewell.some(x => /분신/.test(x)) };
      // 뱃노래: 인형이 춤춘다 / 안 춘다
      const songs = async (dance) => {
        s.fleet.fatigue = 60; s.fleet.discipline = 50; s.evtRecent = []; said.length = 0;
        const ch = G.U.chance; G.U.chance = () => dance;
        G.U.weighted = (tb) => tb.find(e => e[0] === 'songs') || tb[0];
        try { await G.Explore.seaEvent({ st: {}, refresh: () => {} }); } finally { G.U.weighted = w0; G.U.chance = ch; }
        return { fat: 60 - s.fleet.fatigue, dis: s.fleet.discipline - 50, danced: said.some(x => /인형/.test(x)) };
      };
      out.songYes = await songs(true); out.songNo = await songs(false);
      s.player.items = s.player.items.filter(x => x.id !== 'pinocchio_doll');
      out.songNone = await songs(true);
      // 다시는 안 벌어진다
      s.loc = { mode: 'sea', lon: -30, lat: 30 }; s.evtRecent = []; said.length = 0; await whaleEvt();
      out.again = !said.some(x => /피노키오:/.test(x));
      // ⑤ 지나친다 → coolDays 동안은 없고, 지나면 다시
      s = fresh(); s.pino = { whales: 7 }; plan = [0]; said.length = 0;
      s.evtRecent = []; await whaleEvt();
      out.passCool = s.pino.cool - s.day; out.passStage = s.pino.stage || null;
      s.evtRecent = []; said.length = 0; await whaleEvt();
      out.inCool = !said.some(x => /피노키오:/.test(x));
      s.day += 41; s.evtRecent = []; said.length = 0; plan = [1, 'chase'];
      const food0 = s.fleet.food;
      await whaleEvt();
      out.afterCool = s.pino.stage; out.chaseFood = food0 - s.fleet.food;
      // ⑥ 고래 발견물도 센다 — 대양의 「멀리 보이는 고래」는 없다
      s = fresh(); s.pino = {};
      const d = G.DISCOVERIES.find(x => x.id === 'whale');
      out.findHooked = !!G.Pino.findHooked;
      G.Pino.countFind(d); G.Pino.countFind('dolphin');
      out.discCount = s.pino.whales;
      out.noSight = typeof G.Pino.seaDay === 'undefined';
      // ⑦ 귀띔: 지중해 술집
      s = fresh(); s.pino = { whales: 4 }; said.length = 0;
      const gen = G.CITY_DATA.find(x => x && x.region === 2);
      await G.Pino.tavernHint(gen); await G.Pino.tavernHint(gen);
      out.hint = said.filter(x => /목수네 아들/.test(x)).length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'pinocchio'); out.voice = !!(G.VOICES && G.VOICES.pinocchio);
      return out;
    });
    const meet = r.meet.join('\n'), fw = r.farewell.join('\n');
    console.log(r.meet.slice(0, 6).join('\n').slice(0, 700));
    ok(r.oceanAtl && !r.oceanMed && r.oceanPac && r.oceanInd, '대양: 대서양·태평양·인도양 (지중해는 아니다)');
    ok(r.count5 === 5 && r.before, '고래를 5번 만날 때까지는 벌어지지 않는다');
    ok(r.med, '5번 넘게 만났어도 지중해에서는 벌어지지 않는다 (세기는 한다)');
    ok(/피노키오: .*아버지가 저 고래 배 속에/.test(meet) && /제페토/.test(meet) && /비가 억수같이/.test(meet) && /허탕/.test(meet) && /빨려 들어갔어요/.test(meet), '대서양의 고래: 아버지 말을 듣지 않고 · 비 오는 날의 거짓말 · 늘 허탕 · 제페토가 삼켜졌다');
    ok(/피노키오: 안 돼요!! 아버지가 저 안에/.test(meet) && /재채기/.test(meet), '포를 쏘려 하면 피노키오가 막는다 → 횃불 보트로 고래가 재채기');
    ok(r.stage === 'carry' && r.noMate && r.fatigue >= 12 && r.fame >= 40 && r.reloadStage === 'carry', '제페토를 구해 둘을 손님으로 태운다 (피로 +' + r.fatigue + ' · 명성 +' + r.fame + ' · 불러와도 그대로)');
    ok(/제페토: .*사내라면 자기가 본받을 만한 사람을 따라가는 거다/.test(fw) && r.joined && r.stageDone === 'done' && r.loyal === 85, '도시에 들어서면 제페토가 「사내라면 본받을 만한 사람을 따라가는 거다」 — 피노키오 합류 (충성 85)');
    ok(r.def.sk.nav === 3 && r.def.sk.survey === 3 && r.def.sk.sci === 3 && r.def.sk.ship === 3 && !r.def.minor && r.def.lg[2] === 3, '피노키오: 항해술·측량·과학·조선기술 3 · 로망스어 · 철없는 어른(아이 아님) · 월급 ' + r.def.wage);
    ok(r.doll.has && r.doll.name === '피노키오 인형' && r.doll.line, '제페토가 떠나며 「분신」 피노키오 인형을 준다 (소지품)');
    ok(r.songYes.danced && r.songYes.fat === Math.round(r.songNo.fat * 1.5) && r.songYes.dis === Math.round(r.songNo.dis * 1.5) && !r.songNo.danced, '뱃노래: 인형이 춤추면 피로 −' + r.songYes.fat + ' · 규율 +' + r.songYes.dis + ' (안 추면 −' + r.songNo.fat + ' · +' + r.songNo.dis + ')');
    ok(!r.songNone.danced && r.songNone.fat === r.songNo.fat, '인형이 없으면 춤도 없다');
    ok(r.log.length >= 2 && r.again, '일지에 두 줄 · 다시는 벌어지지 않는다');
    ok(r.passCool === 40 && !r.passStage && r.inCool && r.afterCool === 'carry' && r.chaseFood > 0, '지나치면 40일 동안 없고, 지나면 다시 — 「따라간다」는 식량을 쓴다 (' + r.chaseFood + '통)');
    ok(r.findHooked && r.discCount === 1 && r.noSight, '고래 발견물도 센다(돌고래는 아님) · 대양의 「멀리 보이는 고래」는 없다');
    ok(r.hint === 1 && r.rumor && r.voice, '지중해 술집 귀띔은 한 번 · 소문 · 고유 말투');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
