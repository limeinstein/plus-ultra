/* 옛이야기의 아가씨들 (js/systems/fairytales.js) 점검 — node tests/fairytales_smoke.js   (BROWSER_EXE=크롬 경로)
   · 네 사람: 품삯 0, Codex 그림(portraits/legendary/…)이 흉상·무릎상으로 이어진다
   · 신데렐라: 유리 + 세공 + 프랑스 도시 근처 숲 → 유리 한 통으로 구두 → 합류 (유리·세공 없으면 안 나온다)
   · 백설공주: 남자 부하 꼭 여섯 + 프랑스 숲 → 사냥꾼 일기토에서 이기면 합류 (일곱이면 안 나온다)
   · 잠자는 숲속의 공주: 의학 + 용 발견 + 독일 숲에서 야영 → 치료하면 합류 (용을 못 찾았으면 안 나온다)
   · 인어공주: 덴마크 섬에서 사냥 → 돌보면 합류 (유틀란트 반도에서는 안 나온다) · 수다에 끼지 않는다
   · 넷 → 업적 「Once Upon a Time」, 넷과 혼인 → 「Happily Ever After」. 콘솔 오류 0 */
'use strict';
const G_WAGE = { cinderella: 185, snow_white: 185, sleeping_beauty: 0, little_mermaid: 165 };   // QA 2026-10-23 이야기 부하 품삯 (G.taleWage)
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'fairytales');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, T = G.Tale, UI = G.UI, U = G.U, out = {};
      const IDS = ['cinderella', 'snow_white', 'sleeping_beauty', 'little_mermaid'];
      out.data = IDS.map(id => { const m = G.MATE[id]; const face = G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(id))), half = G.Img.pick(G.Img.chain.mateHalf(id)); return [id, m && m.wage, face, half]; });
      // 자리 찾기: 프랑스 숲 · 독일 숲 · 덴마크 섬 · 유틀란트
      const find = (f, box) => { for (let x = box[0]; x <= box[1]; x += 0.1) for (let y = box[2]; y <= box[3]; y += 0.1) if (!G.Geo.isSea(x, y, 1) && f(x, y)) return [x, y]; return null; };
      const FR = find((x, y) => T.frenchForest(x, y), [-1, 6, 43, 50]), DE = find((x, y) => T.germanForest(x, y), [6, 15, 47, 55]);
      const DK = find((x, y) => T.danishIsland(x, y), [11.3, 12.5, 55.2, 55.9]), JUT = [9.3, 56.2];
      out.spots = { FR, DE, DK, jutIsle: T.danishIsland(JUT[0], JUT[1]) };
      // 대화는 흘려보낸다
      let answers = [];
      UI.say = async () => {}; UI.alert = async () => true; UI.window = () => ({ result: Promise.resolve(1), close() {} }); UI.confirm = async () => true; UI.toast = () => {};
      UI.ask = async (t, opts) => { const a = answers.shift(); return a === undefined ? (opts && opts[0] ? opts[0].value : 1) : a; };
      const uc = U.chance; U.chance = () => true;
      s.loc.mode = 'land';
      const male = G.MATES.filter(m => m.g === 'm' && !m.tale && !m.witch && m.id !== 'rocco').slice(0, 7).map(m => m.id);
      const setMates = (ids) => { s.mates = ids.map((id, i) => ({ id, role: i ? 'none' : 'first', loyal: 80 })); };
      // 1) 신데렐라 — 조건이 모자라면 안 나온다
      setMates(['rocco']); s.player.sk.craft = 0; s.fleet.cargo = {};
      out.cinNo = await T.onLand(FR[0], FR[1]);
      s.player.sk.craft = 1; s.fleet.cargo.glass = { q: 3, cost: 50 };
      out.cin = await T.onLand(FR[0], FR[1]);
      out.cinHired = T.hired('cinderella'); out.glassLeft = (s.fleet.cargo.glass || {}).q;
      // 2) 백설공주 — 일곱이면 안 나오고, 남자 꼭 여섯이면 일기토
      setMates(male.slice(0, 7)); out.snow7 = T.snowOk();
      setMates(male.slice(0, 5).concat(['cinderella'])); out.snowF = T.snowOk();
      setMates(male.slice(0, 6)); out.snow6 = T.snowOk();
      s.fleet.cargo = {};          // 신데렐라는 부하 명단을 바꿔도 다시 나오지 않게 (유리 없음)
      G.Games.duel = async () => 'win';
      out.snow = await T.onLand(FR[0], FR[1]);
      out.snowHired = T.hired('snow_white');
      // 3) 잠자는 숲속의 공주 — 용을 못 찾았으면 안 나온다
      s.player.sk.med = 1;
      out.beautyNo = await T.onCamp('rest', DE[0], DE[1]);
      s.disc.reddragon = { found: 14810101, me: true };
      out.beauty = await T.onCamp('rest', DE[0], DE[1]);
      out.beautyHired = T.hired('sleeping_beauty');
      // 4) 인어공주 — 유틀란트에서 사냥하면 안 나오고, 셸란에서 사냥하면
      out.merNo = await T.onCamp('hunt', JUT[0], JUT[1]);
      out.merRest = await T.onCamp('rest', DK[0], DK[1]);
      out.mer = await T.onCamp('hunt', DK[0], DK[1]);
      out.merHired = T.hired('little_mermaid');
      out.wages = IDS.map(id => G.MATE[id].wage);
      // 5) 업적
      await new Promise(r => setTimeout(r, 50));
      out.once = G.Achieve.done('onceupon');
      s.player.wife = 'cinderella'; s.player.wives2 = [{ id: 'snow_white', kind: 'mate' }, { id: 'sleeping_beauty', kind: 'mate' }];
      G.Achieve.check(); out.happy3 = G.Achieve.done('happily');
      s.player.wives2.push({ id: 'little_mermaid', kind: 'mate' });
      G.Achieve.check(); out.happy = G.Achieve.done('happily');
      // 6) 인어공주는 수다에 끼지 않는다
      setMates(['little_mermaid', 'rocco']);
      out.banter = (G.Banter.compose(G.DISC.tiger || G.DISCOVERIES.filter(d => d.cat === 'creature')[0]) || []).map(x => x.p.id);
      U.chance = uc;
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.data.every(d => d[1] === G_WAGE[d[0]] && /^portraits\/legendary\//.test(d[2] || '') && /^portraits\/legendary\/.*_half$/.test(d[3] || '')), '네 사람 품삯(특기 합 11 이상만 — 신데렐라·백설공주 185, 인어공주 165, 잠자는 숲속의 공주 0) · Codex 그림이 흉상·무릎상으로: ' + r.data.map(d => d[2]).join(', '));
    const snowPic = r.data.filter(d => d[0] === 'snow_white')[0];
    ok(snowPic && snowPic[2] === 'portraits/legendary/snow_white_player' && snowPic[3] === 'portraits/legendary/snow_white_player_half', '백설공주 이벤트에 새 플레이어 화풍 얼굴상·무릎상 연결');
    ok(r.spots.FR && r.spots.DE && r.spots.DK && !r.spots.jutIsle, '자리: 프랑스 숲 ' + r.spots.FR + ' · 독일 숲 ' + r.spots.DE + ' · 덴마크 섬 ' + r.spots.DK + ' (유틀란트는 섬이 아니다)');
    ok(!r.cinNo && r.cin && r.cinHired && r.glassLeft === 2, '신데렐라: 유리·세공이 없으면 안 나오고, 있으면 유리 한 통(3→' + r.glassLeft + ')으로 구두를 지어 합류');
    ok(!r.snow7 && !r.snowF && r.snow6 && r.snow && r.snowHired, '백설공주: 남자 일곱·여자 섞임이면 안 되고, 남자 꼭 여섯이면 사냥꾼을 물리치고 합류');
    ok(!r.beautyNo && r.beauty && r.beautyHired, '잠자는 숲속의 공주: 용을 찾기 전에는 안 나오고, 찾은 뒤 독일 숲 야영에서 치료하면 합류');
    ok(!r.merNo && !r.merRest && r.mer && r.merHired, '인어공주: 유틀란트·쉬기만 해서는 안 나오고, 덴마크 섬에서 사냥하면 합류');
    ok(r.once, '넷 모두 → 업적 「Once Upon a Time」');
    ok(!r.happy3 && r.happy, '셋과 혼인으로는 아직, 넷 모두와 혼인 → 「Happily Ever After」');
    ok(!r.banter.includes('little_mermaid'), '말을 못 하는 인어공주는 수다에 끼지 않는다 (' + r.banter.join(',') + ')');

    // 화면: 실제 대화창으로 신데렐라를 만나는 장면
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: { craft: 2 }, lg: [], diff: 'normal' });
      G.Game.go('city', { cityId: G.CITY_DATA.filter(c => c.name === '파리')[0].id });
      await new Promise(r => setTimeout(r, 1500));
      G.Tale.cinderella();
    });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 2; i++) { await page.mouse.click(800, 800); await page.waitForTimeout(700); }
    await page.screenshot({ path: path.join(OUT, 'cinderella.png') });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
