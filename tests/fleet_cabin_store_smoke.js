/* 종선의 선실 → 창고 · 배 살 때 선실 칸 수 · 데미캘버린포 (2026-11-05 피드백) — node tests/fleet_cabin_store_smoke.js
   · 조선소 배 고르기 카드에 「선실 N칸」 (기함보다 적으면 경고)
   · 기함이 아닌 배: 선실을 창고로 고친 만큼 한 칸마다 적재량 × 3% (모든 칸), 값 1,200닢/칸, 그 칸만큼 부하 자리가 준다
   · 개조 메뉴 「선실 → 창고 개조」, 일괄 개조 「선실 → 창고」, 기함 변경 확인에 선실 칸 수, 짐이 넘치면 기함 변경을 막는다
   · 데미캘버린포: 사정 4 · 위력 8 · 명중 0.7 · 4등급 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'trader', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, CB = G.Cabins, UI = G.UI, out = {};
      const said = []; G.Scenes.city.say = async (w, t) => { said.push(String(t)); }; G.Scenes.city.mate = async (t) => { said.push(String(t)); };
      UI.fade = async (fn) => { fn && fn(); }; UI.toast = (t) => said.push('T:' + t);
      let confirmTxt = []; UI.confirm = async (t) => { confirmTxt.push(String(t)); return true; };
      s.player.gold = 200000; s.fleet.cargo = {}; s.fleet.food = 0; s.fleet.water = 0; s.fleet.mat = 0;
      const fl = s.fleet.ships[0]; Object.assign(fl, R.newShip('hcarrack', '기함')); fl.cabins = null; s.fleet.cabinUid = null; CB.rooms();
      const gal = R.newShip('galleon', '갤리'); s.fleet.ships.push(gal);
      const c = G.CITY_DATA[0]; s.date.y = 1531; s.player.age = 30;
      // 1) 배 고르기 카드
      const el = document.createElement('div');
      let html = ''; const oldWin = UI.window; UI.window = (o) => { html = o.html; return { result: Promise.resolve(null), el: el, content: el, close() {} }; };
      await G.Scenes.city.B.shipyard.buy(c); UI.window = oldWin;
      el.innerHTML = html;
      const card = id => { const d = el.querySelector('.shipcard[data-id="' + id + '"]'); return d ? d.textContent : ''; };
      out.cardGal = card('galleon'); out.cardIds = Array.from(el.querySelectorAll('.shipcard')).map(d => d.dataset.id);
      out.slotsGal = CB.slotsOf('galleon'); out.slotsHc = CB.slotsOf('hcarrack');
      // 2) 종선 선실 → 창고
      const cap0 = R.fleetCap(), g0 = s.player.gold, day0 = s.day;
      UI.number = async (o) => { out.numInfo = o.info(o.max); return o.max; };
      const menu = []; UI.choose = async (t, opts) => { if (/개조할 배/.test(t)) return 1; if (/호 개조/.test(t)) { if (!menu.length) { menu.push(opts.map(o => o.label + '|' + (o.right || '')).join(' / ')); return 'store'; } return null; } return null; };
      await G.Scenes.city.B.shipyard.refit(c);
      out.menu = menu[0]; out.dCap = R.fleetCap() - cap0; out.cost = g0 - s.player.gold; out.days = s.day - day0;
      out.store = CB.storeCount(gal); out.berths = CB.berths(gal); out.expect = Math.floor(G.SHIP.galleon.cap * 0.03 * out.slotsGal);
      // 3) 반으로 되돌리기: 값 없음
      UI.number = async () => 7; menu.length = 0; const g1 = s.player.gold;
      await G.Scenes.city.B.shipyard.refit(c);
      out.half = { store: CB.storeCount(gal), gold: g1 - s.player.gold, berths: CB.berths(gal) };
      // 4) 일괄: 기함은 건너뛰고 종선은 모두 창고
      const two = R.newShip('carrack', '둘째'); s.fleet.ships.push(two);
      confirmTxt = [];
      await (async () => { let k = 0; UI.window = (o) => ({ result: Promise.resolve(k++ ? null : 'store'), el: document.createElement('div'), content: document.createElement('div') }); await G.Scenes.city.B.shipyard.batch(c); UI.window = oldWin; })();
      out.batch = { gal: CB.storeCount(gal), two: CB.storeCount(two), slotsTwo: CB.slots(two), flag: CB.storeCount(fl), txt: confirmTxt[0] || '' };
      // 5) 기함 변경 확인: 선실 칸 수
      UI.choose = async () => 0; confirmTxt = [];
      s.fleet.cargo = {};
      await G.Scenes.city.B.harbor.changeFlag();
      out.flagTxt = confirmTxt[0] || ''; out.flagNow = s.fleet.ships[0].name;
      // 6) 짐이 꽉 찼으면 기함 변경을 막는다 (종선 창고 16칸 → 기함이 되면 4칸×5%만 센다)
      s.fleet.ships[0].cabins = s.fleet.ships[0].cabins.map((x, i) => i ? 'hold' : 'deck'); const capF = R.fleetCap(); s.fleet.cargo.pepper = { q: capF - 2, cost: 10, from: null, d: s.day };
      const idx = s.fleet.ships.indexOf(two); UI.choose = async () => idx - 1;
      const before = s.fleet.ships[0].name; const okFlag = await G.Scenes.city.B.harbor.changeFlag();
      out.blocked = { capF, capNow: R.fleetCap(), used: R.used(), ships: s.fleet.ships.map(x => x.name + ':' + CB.storeCount(x)), ok: okFlag, still: s.fleet.ships[0].name === before, toast: said.filter(x => /창고 셈/.test(x)).length };
      s.fleet.cargo = {};
      // 7) 대포
      out.demi = G.CANNON.demiculverin;
      out.perrier = G.CANNON.perrier;
      out.gearAt4 = G.Scenes.city.B.shipyard.gearAt ? G.Scenes.city.B.shipyard.gearAt(4) : '';
      return out;
    });
    ok(/선실14칸/.test(r.cardGal.replace(/\s/g, '')) && /2칸 적음/.test(r.cardGal), '배 고르기: 갤리온 「선실 ' + r.slotsGal + '칸 (기함보다 2칸 적음)」 — 중카락 ' + r.slotsHc + '칸 · 카드: ' + r.cardIds.join(','));
    ok(/선실 → 창고 개조/.test(r.menu), '종선 개조 메뉴에 「선실 → 창고 개조」');
    ok(r.store === r.slotsGal && r.dCap === r.expect && r.cost === 1200 * r.slotsGal && r.days === Math.ceil(r.slotsGal * 1), '갤리온 선실 ' + r.store + '칸 → 창고: 짐칸 +' + r.dCap + '통 · 금화 ' + r.cost + ' · ' + r.days + '일 (' + r.numInfo + ')');
    ok(r.berths === 0, '창고로 고친 칸에는 부하가 머물지 않는다 (남은 자리 ' + r.berths + ')');
    ok(r.half.store === 7 && r.half.gold === 0 && r.half.berths === r.slotsGal - 7, '창고 7칸으로 되돌림 — 값 없음, 부하 자리 ' + r.half.berths);
    ok(r.batch.gal === r.slotsGal && r.batch.two === r.batch.slotsTwo && r.batch.flag === 0 && /기함은/.test(r.batch.txt), '일괄 「선실 → 창고」: 종선 모두 창고, 기함은 건너뜀');
    ok(/선실 16칸 → <b>14칸<\/b>/.test(r.flagTxt) && /2칸 줄어/.test(r.flagTxt), '기함 변경 확인에 선실 칸 수: ' + r.flagTxt.replace(/<[^>]+>/g, ''));
    ok(r.blocked.ok === false && r.blocked.still && r.blocked.toast === 1, '짐칸이 모자라게 되는 기함 변경은 막는다');
    ok(r.demi && r.demi.range === 4 && r.demi.dmg > r.perrier.dmg && r.demi.acc > r.perrier.acc && r.demi.lv === 4, '데미캘버린포: 사정 ' + r.demi.range + ' · 위력 ' + r.demi.dmg + ' · 명중 ' + r.demi.acc + ' (페리에포 ' + r.perrier.dmg + '/' + r.perrier.acc + ')');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
    console.log('통과 ' + passed);
  } catch (e) { console.log('실패: ' + e.message); if (errors.length) console.log(errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})();
