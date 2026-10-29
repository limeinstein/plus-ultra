/* 장기 캠페인 체크포인트 회귀 검사
   공작 → 12명 배우자·다자녀 → 신대륙·인도 항로 → 개척 도시 → 세계일주 → 교역 명성 10,000 → 후계자.
   실제 수십 년을 기다리는 대신 각 기능의 공개 상태/API를 거쳐 매 단계 저장·불러오기를 반복한다.
   node tests/campaign_checkpoint_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const EXE = process.env.BROWSER_EXE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.addInitScript(() => {
      let seed = 0x51a7c0de;
      Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.evaluate(() => { if (window.G && G.BALANCE && G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0; });   // 세대 교체 때 친족·소꿉친구 고르기 창을 띄우지 않는다 (tests/old_guard_smoke.js 가 따로 본다)
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Colony && G.Family, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const UI = G.UI;
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {};
      UI.confirm = async () => true; UI.choose = async (t, rows) => rows[0].value; UI.ask = async (t, rows) => rows[0].value;
      UI.fade = async fn => { if (fn) await fn(); };
      G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: async () => {} });
      if (G.Siblings) G.Siblings.fromRetire = async () => [];

      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      let s = G.Game.state = G.State.newGame({ name: '장기항해 제독', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 2), diff: 'normal' });
      const checkpoints = [];
      function roundTrip(label) {
        const raw = G.State.serialize();
        s = G.Game.state = G.State.deserialize(raw);
        G.Colony.apply();
        checkpoints.push({ label, bytes: raw.length, gen: s.player.generation, fame: s.player.fame });
      }

      // 1) 포르투갈 공작: 작위와 명성을 함께 저장한다.
      G.Fame.add('ex', 70000);
      s.court = { titles: { PT: 7 } };
      roundTrip('duke');
      const duke = G.Court.best() && G.Court.best().ko;

      // 2) 본처 포함 배우자 12명, 여러 집의 자녀. 더 혼인할 수 없어야 한다.
      const spouseIds = G.MAIDS.map(x => x.id).filter((x, i, a) => a.indexOf(x) === i).slice(0, 12);
      s.player.wife = spouseIds[0];
      s.player.wives2 = spouseIds.slice(1).map((id, i) => ({ id, kind: 'maid', city: (G.MAIDS.find(x => x.id === id) || {}).city || 0, house: true, aboard: false, wed: s.day + i, no: i + 2 }));
      s.date = { y: 1525, m: 6, d: 1 };
      s.player.kids = Array.from({ length: 24 }, (_, i) => ({ name: '자녀' + (i + 1), sex: i % 3 ? 'm' : 'f', mother: spouseIds[i % spouseIds.length], born: { y: 1498 + (i % 12), m: i % 12 + 1, d: 1 }, sk: {}, lg: [], st: { str: 55, int: 55, mar: 55, cha: 55 }, bond: 75 }));
      roundTrip('family');
      const family = { spouses: G.Wives.count(), max: G.Wives.maxSpouses(), canMore: G.Wives.canMarry(), kids: s.player.kids.length };

      // 3) 양쪽 대양의 항로 발견 기록(신대륙·인도)이 저장 뒤에도 열림 상태인지 본다.
      s.disc.westroute = { me: true, found: 14921012, evidence: true };
      s.disc.indiaroute = { me: true, found: 14980520, evidence: true };
      s.stats.found += 2;
      roundTrip('routes');
      const routes = [G.Disc.foundByMe('westroute'), G.Disc.foundByMe('indiaroute')];

      // 4) 왕명으로 받은 개척지를 도시 4단계·총독 취임까지 발전시킨 상태.
      const site = G.Colony.sites().find(x => x.nat === 'PT');
      const colony = G.Colony.plant(site.key);
      colony.name = '노바 에스페란사'; colony.stage = 4; colony.gov = true; colony.founded = 15250601;
      G.Colony.sync(colony); s.player.seat = colony.id;
      roundTrip('colony');
      const colonyState = G.Colony.get(colony.id);
      const colonyCity = G.CITY_DATA[colony.id];

      // 5) 경도 누적을 실제 추적 함수에 넣어 세계일주를 끝낸다.
      s.circ = { cum: 359, done: false, start: s.day };
      const circSignal = G.Disc.trackCirc(2);
      s.disc.circum = { me: true, found: 15260601, evidence: true };
      roundTrip('circumnavigation');
      const circ = { signal: circSignal, done: s.circ.done, found: G.Disc.foundByMe('circum') };

      // 6) 교역 갈래의 실제 표시값을 10,000 이상으로 만들고 저장한다(교역 명성은 획득량 3배).
      const beforeTrade = G.Fame.get('tr');
      G.Fame.add('tr', Math.ceil((10000 - beforeTrade) / G.Fame.MUL.tr));
      roundTrip('trade-fame');
      const tradeFame = G.Fame.get('tr');

      // 7) 성년 아들이 뒤를 잇는다. 공작위·발견·도시·세계일주 기록은 가문/세계 상태로 남아야 한다.
      const heir = s.player.kids.find(k => k.sex === 'm' && G.Family.kidAge(k) >= 16);
      heir.name = '후계 제독'; heir.sk = sk; heir.lg = G.LANGS.map(() => 2); heir.sea = 24;
      const inheritedStorage = (s.player.storage || []).slice();
      G.Family.pickStorage = async () => inheritedStorage;
      await G.Family.succeed(heir, false);
      roundTrip('successor');
      const realm = G.Court.realmOf(G.SPONSOR.pt_king);
      return {
        checkpoints, duke, family, routes,
        colony: { stage: colonyState.stage, gov: colonyState.gov, name: colonyCity && colonyCity.name, seat: s.player.seat, buildings: G.Colony.buildings(colonyCity).map(x => x.name) },
        circ, tradeFame,
        heir: { name: s.player.name, gen: s.player.generation, title: G.Court.title(realm) && G.Court.title(realm).ko, west: G.Disc.foundByMe('westroute'), colony: !!G.Colony.get(colony.id), circ: G.Disc.foundByMe('circum') }
      };
    });
    console.log(JSON.stringify(result, null, 2));
    ok(result.duke === '공작', '명성 70,000 단계의 공작위가 저장·복원된다');
    ok(result.family.spouses === 12 && result.family.max === 12 && !result.family.canMore && result.family.kids === 24, '배우자 12명 상한과 24명 자녀가 저장·복원된다');
    ok(result.routes.every(Boolean), '서회항로·인도항로 발견 기록이 저장·복원된다');
    ok(result.colony.stage === 4 && result.colony.gov && result.colony.name === '노바 에스페란사' && result.colony.buildings.includes('총독부'), '개척 도시 4단계와 총독 상태가 저장·복원된다');
    ok(result.circ.signal === 'done' && result.circ.done && result.circ.found, '경도 360° 통과로 세계일주 완료가 기록된다');
    ok(result.tradeFame >= 10000, '교역 명성 10,000 이상이 저장·복원된다 (' + result.tradeFame + ')');
    ok(result.heir.name === '후계 제독' && result.heir.gen === 2 && result.heir.title === '공작' && result.heir.west && result.heir.colony && result.heir.circ, '후계자에게 넘긴 뒤 작위·발견·개척 도시·세계일주 기록이 유지된다');
    ok(result.checkpoints.length === 7 && result.checkpoints.every(x => x.bytes > 1000), '7개 장기 캠페인 체크포인트를 모두 직렬화·역직렬화했다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) {
    console.error('✗', e.stack || e.message); console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
