/* 해적이 활동하는 바다 · 처음 5년의 이름난 해적 (2026-11-07) — node tests/pirate_activity_smoke.js   (BROWSER_EXE=크롬 경로)
   ① 1480년 새 게임: 지중해·대서양·동아시아(왜구)만 해적이 있다 — 북해·아메리카·인도양·동남아시아는 0 (확률·실제로 솟아나기·여급의 귀띔)
   ② 아메리카: 관문(서쪽 항로)이 알려지고 그 바다의 발견물 다섯이 보고되어야 시작 — 넷이면 아직, 관문 없이 다섯이어도 아직, 찾기만 하고 알리지 않은 것은 빼고, 경쟁자의 발표는 센다
   ③ 점점 늘어난다: 시작한 날 20% → 5년 60% → 10년 100% · 「해적이 나타나기 시작했다」 소문 한 번 · 옛 저장(오래전에 열린 바다)은 처음부터 100%, 소문 없이
   ④ 처음 5년: 이름난 해적은 먼저 덤비지 않는다(다가가면 「싸운다 / 그냥 둔다」) — 5년 뒤에는 덤빈다 · 소굴 두목은 예외
   콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.PirateAct, null, { timeout: 90000 });

    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {}, PA = G.PirateAct, U = G.U, UI = G.UI;
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.fade = async fn => { fn(); };
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const fresh = (y) => {
        const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        G.Game.state = s; s.date = { y: y || 1480, m: 1, d: 1 }; s.settings.res = 0.35; return s;
      };
      // ---------------------------------------------------------------- ①
      let s = fresh(1480);
      out.k0 = PA.report().map(x => x.zone + '=' + x.k).join(' ');
      const at = { havana: [-80, 22], mumbai: [70, 15], java: [110, 0], med: [15, 36], wako: [125, 30], north: [5, 56] };
      out.chance0 = Object.keys(at).map(k => k + '=' + (G.Scenes.sea.pirateChance(at[k][0], at[k][1]) > 0 ? '+' : '0')).join(' ');
      // 실제로 솟아나기: 바다 장면에서 해적이 나올 확률을 1로 두고 하루치 솟아나기를 돌린다
      const SEA = G.Scenes.sea;
      G.Game.go('sea', { depart: s.player.home });
      for (let i = 0; i < 100 && !(SEA.runtime && SEA.runtime() && SEA.runtime().npcs); i++) await new Promise(r2 => setTimeout(r2, 50));
      const realChance = U.chance;
      const spawnAt = (lon, lat, n) => {
        const rt = SEA.runtime(); let pir = 0;
        U.chance = () => true;
        if (G.Pace) G.Pace.ok = () => true;
        for (let i = 0; i < n; i++) { rt.npcs.length = 0; s.loc.lon = lon; s.loc.lat = lat; SEA.spawnNpcsForTest(); pir += rt.npcs.filter(x => x.kind === 'pirate' && !x.court && !x.princess && !x.lairChief && !x.co).length; }
        U.chance = realChance; rt.npcs.length = 0; return pir;
      };
      s.loc = { mode: 'sea', lon: -80, lat: 22, heading: 0 };
      out.spawnCarib = spawnAt(-80, 22, 6);
      out.spawnMed = spawnAt(15, 36, 6);
      // 여급의 귀띔: 카리브의 항구만 있으면 해적 귀띔은 없다
      const hav = G.CITY_DATA.find(c => c && c.name === '아바나');
      out.tipCarib = hav ? G.MaidTip.make('pirate', hav, Object.keys(G.MAID).map(k => G.MAID[k])[0], { aff: 100 }) : 'nocity';
      // ---------------------------------------------------------------- ②
      const amer = G.DISCOVERIES.filter(d => d.lon != null && G.Ships.zone(d.lon, d.lat) === 'amer' && d.id !== 'westroute').slice(0, 8).map(d => d.id);
      out.amerN = amer.length;
      const dn = U.dateNum(s.date);
      const rep = (id, how) => { s.disc[id] = Object.assign({ found: dn }, how === 'rival' ? { rival: '누군가' } : how === 'quiet' ? { me: true } : { me: true, announced: true }); G.Frontier && G.Frontier.invalidate && G.Frontier.invalidate(); };
      amer.slice(0, 5).forEach(id => rep(id));
      out.noGate = PA.k('amer') === 0 && PA.counts().amer === 5;
      rep('westroute');
      out.gateOnly = PA.k('amer');
      delete s.disc[amer[4]]; G.Frontier.invalidate();
      rep(amer[4], 'quiet');
      out.four = PA.k('amer') === 0 && PA.counts().amer === 4;
      rep(amer[5], 'rival');
      out.rival5 = PA.counts().amer === 5 && PA.k('amer') > 0;
      // ---------------------------------------------------------------- ③
      out.kStart = PA.k('amer');
      const amerName = G.Ships.ZONE_NAME.amer, isNews = x => x.text.indexOf(amerName + '에 해적이 나타나기 시작') >= 0;
      const news1 = G.World.daily().filter(isNews).length;
      const news2 = G.World.daily().filter(isNews).length;
      out.news = news1 + ':' + news2; out.amerName = amerName;
      // 세월을 보낸다 (날 수와 달력을 함께)
      const d0 = s.day, date0 = Object.assign({}, s.date);
      const go = yrs => { s.date = { y: date0.y + yrs, m: date0.m, d: date0.d }; s.day = d0 + (U.dayIndex(s.date) - U.dayIndex(date0)); };
      go(5); out.k5 = Math.round(PA.k('amer') * 100) / 100;
      go(10); out.k10 = PA.k('amer');
      go(0);
      out.chanceCaribNow = G.Scenes.sea.pirateChance(-80, 22) > 0;
      out.spawnCaribNow = spawnAt(-80, 22, 6);
      // 옛 저장: 1600년에 연 일지 — 1500년대에 보고가 끝난 아메리카
      s = fresh(1600); s.day = 365 * 120;
      const old = 15020101;
      s.disc.westroute = { me: true, announced: true, found: 14921012 };
      amer.slice(0, 5).forEach(id => { s.disc[id] = { rival: '누군가', found: old }; });
      G.Frontier.invalidate();
      out.oldK = PA.k('amer');
      out.oldNews = G.World.daily().filter(x => x.text.indexOf(G.Ships.ZONE_NAME.amer + '에 해적이 나타나기 시작') >= 0).length;   // (이 시험은 새 게임을 1600년으로 옮겨 다른 바다는 그날 열린다)
      // ---------------------------------------------------------------- ④ 처음 5년의 이름난 해적
      s = fresh(1520); s.day = 100;
      const CP = G.Captains;
      const mkPirate = () => ({ id: 'p' + Math.random(), kind: 'pirate', zone: 'med', lon: 15, lat: 36, heading: 0, n: 2, K: 0.4, spd: 1, life: 10, hostile: true,
        ships: G.Ships.enemyTypes('pirate', 'med', null, 2, 0.4, s.date.y) });
      U.chance = () => true;
      const n1 = CP.assign(mkPirate(), []);
      out.calm = !!(n1.cap && n1.calm && n1.hostile === false);
      out.calmText = CP.encounterText(n1, '', true);
      s.day = 365 * 5 + 1;
      const n2 = CP.assign(mkPirate(), []);
      out.after = !!(n2.cap && !n2.calm && n2.hostile === true);
      U.chance = realChance;
      // 다가가면: 싸운다 / 그냥 둔다
      s.day = 100;
      G.Game.go('sea', { depart: s.player.home });
      for (let i = 0; i < 100 && !(SEA.runtime() && SEA.runtime().npcs); i++) await new Promise(r2 => setTimeout(r2, 50));
      let asked = null;
      UI.ask = async (t, o) => { asked = { t, o: o.map(x => x.label) }; return null; };
      await SEA.encounterForTest(n1, true);
      out.ask = asked;
      // 소굴 두목은 처음 5년에도 덤빈다
      G.Lair._reveal('med');
      const d = G.PIRATE_LAIR.med;
      s.loc = { mode: 'sea', lon: d.dock[1] + 0.8, lat: d.dock[0] + 0.3, heading: 0 };
      const ch = G.Lair.spawn([]);
      out.chief = ch ? ch.hostile === true && !ch.calm : 'none';
      return out;
    });
    ok(r.k0 === 'med=1 atl=1 north=0 amer=0 ind=0 sea=0 east=1', '1480년: 지중해·대서양·동아시아(왜구)만 해적이 있다 — ' + r.k0);
    ok(r.chance0 === 'havana=0 mumbai=0 java=0 med=+ wako=+ north=0', '해적이 나타날 확률: 카리브·인도·자와·북해 0, 지중해·왜구 바다는 그대로 — ' + r.chance0);
    ok(r.spawnCarib === 0 && r.spawnMed > 0, '실제 솟아나기: 카리브 0척, 지중해 ' + r.spawnMed + '번');
    ok(r.tipCarib === null, '여급의 귀띔: 해적이 없는 바다(카리브)의 해적 귀띔은 없다');
    ok(r.amerN === 8 && r.noGate, '관문(서쪽 항로) 없이 보고 다섯이어도 아직');
    ok(r.gateOnly > 0, '관문 + 보고 다섯이면 시작');
    ok(r.four, '찾기만 하고 알리지 않은 발견물은 세지 않는다 (넷이면 아직)');
    ok(r.rival5, '경쟁자의 발표도 보고로 센다 (다섯째)');
    ok(Math.abs(r.kStart - 0.2) < 0.01 && Math.abs(r.k5 - 0.6) < 0.01 && r.k10 === 1, '점점 늘어난다: 시작 20% → 5년 ' + Math.round(r.k5 * 100) + '% → 10년 100%');
    ok(r.news === '1:0', '「' + r.amerName + '에 해적이 나타나기 시작했다」 소문은 한 번');
    ok(r.chanceCaribNow && r.spawnCaribNow > 0, '시작한 뒤에는 카리브에서도 해적이 솟아난다 (' + r.spawnCaribNow + '번)');
    ok(r.oldK === 1 && r.oldNews === 0, '옛 저장(1500년대에 열린 아메리카, 1600년): 처음부터 100% · 소문 없음');
    ok(r.calm && /건드리지 않고 지켜보기만/.test(r.calmText), '처음 5년: 이름난 해적은 보여도 먼저 덤비지 않는다 — ' + r.calmText);
    ok(r.after, '5년이 지나면 이름난 해적도 덤빈다');
    ok(r.ask && r.ask.o.join(',') === '싸운다,그냥 둔다', '먼저 덤비지 않는 이름난 해적에게 다가가면: 싸운다 / 그냥 둔다');
    ok(r.chief === true, '해적 소굴의 두목은 처음 5년에도 덤빈다');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('통과: 해적이 활동하는 바다');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
