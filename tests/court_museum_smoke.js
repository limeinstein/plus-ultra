/* 왕명 무작위 셋 · 박물관 건립 · 왕립 박물관·동물원 (js/systems/court.js · js/city/museum.js) — node tests/court_museum_smoke.js   (BROWSER_EXE=크롬 경로)
   · 알현하면 모든 왕명 가운데 무작위로 셋이 나온다 (갈래는 겹칠 수 있다)
   · 박물관 건립: 발견 유물·명작을 셋 바친다 — 증거품은 치지 않는다. 바치면 소지품에서 빠지고 작위가 오른다
   · 리스본 거리에 왕립 박물관이 서고, 들어가면 바친 셋이 그림과 함께 걸려 있다
   · 동물원 건설을 마치면 왕립 동물원이 서고, 바친 동물을 볼 수 있다
   · 명작 표: 예술가마다 그림·조각 세 점씩. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'court_museum');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) errors.push(m.text().slice(0, 300)); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {}, UI = G.UI, CT = G.Court;
      // 명작 표
      const M = G.MASTERWORKS; out.mwBad = []; Object.keys(M).forEach(id => Object.keys(M[id]).forEach(k => { if (M[id][k].length !== 3) out.mwBad.push(id + ':' + k); }));
      out.mwN = Object.keys(M).length; out.generic = G.Studio.worksOf('h_dongqichang', 'paint').length;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Game.state = s; s.date = { y: 1510, m: 5, d: 1 }; s.player.home = 0;
      G.Fame.add('ex', 10500);
      const king = G.SPONSOR.pt_king;
      // 1) 무작위 셋
      const seen = {}; let threeOk = true, museum = null;
      for (let i = 0; i < 120; i++) {
        s.court = s.court || {}; s.court.offers = {}; s.seed = 100 + i;
        const o = CT.offers(king); if (o.length !== 3 || new Set(o.map(x => x.kind)).size !== 3) threeOk = false;
        o.forEach(x => { seen[x.kind] = 1; }); if (!museum && o.some(x => x.kind === 'museum')) museum = s.seed;
      }
      out.threeOk = threeOk; out.seenKinds = Object.keys(seen).sort();
      // 2) 박물관 건립 받기
      const said = []; let want = 'museum', picks = 0;
      UI.say = async (t) => { said.push(String(t)); }; UI.alert = async (t) => { said.push(String(t)); }; UI.toast = () => {}; UI.confirm = async () => true;
      UI.choose = async (title, opts) => { if (/박물관에 바칠 것/.test(title)) { picks++; return opts[0].value; } const o = opts.filter(x => x.value && x.value.kind === want)[0]; return o ? o.value : null; };
      UI.ask = async (text, opts) => opts[0].value;
      G.Game.refreshHud = () => {}; G.State.save = () => {};
      s.court.offers = {}; s.seed = museum;
      await CT.audience(king);
      const t = CT.task(); out.taken = t && t.kind;
      out.p0 = CT.progress(t).text;
      // 소지품: 증거품 하나(치지 않는다) + 유물 둘 + 레오나르도의 명작 하나 + 그냥 물건 하나
      const rel = Object.keys(G.RELIC).filter(id => G.RELIC[id].kind === 'treasure').slice(0, 2);
      s.player.items.push({ id: 'evidence', kind: 'evidence', evidence: true, name: '증거품', disc: 'carnac' });
      rel.forEach(id => G.R.addItem(id, { disc: G.RELIC[id].relic }));
      out.p1 = CT.progress(t).text;
      G.Studio.make('leonardo', 'paint'); await G.Studio.present();
      out.mwItem = s.player.items.filter(it => it.mw).map(it => it.name + ':' + it.n)[0];
      out.p2 = CT.progress(t);
      const items0 = s.player.items.length, rank0 = s.court.titles.PT || 0;
      await CT.audience(king);
      out.picks = picks; out.removed = items0 - s.player.items.length; out.rank = (s.court.titles.PT || 0) - rank0;
      out.museum = s.court.museum.PT && s.court.museum.PT.items.map(x => x.name);
      out.leftEvidence = s.player.items.some(it => it.evidence);
      out.bld = G.Scenes.city.buildings(G.CITY_DATA[0]).filter(b => b.kind === 'museum' || b.kind === 'zoo').map(b => b.kind + ':' + b.name);
      out.thanks = said.some(x => /박물관을 짓고/.test(x)) && said.some(x => /왕립 박물관이 섰습니다/.test(x));
      // 3) 동물원 건설 — 다음 작위
      G.Fame.add('ex', 10000); want = 'zoo';
      let zs = null; for (let i = 0; i < 300 && !zs; i++) { s.court.offers = {}; s.seed = 900 + i; if (CT.offers(king).some(x => x.kind === 'zoo')) zs = s.seed; }
      G.DISCOVERIES.filter(d => d.cat === 'creature' && d.how !== 'city' && !(G.Court.isPlant && G.Court.isPlant(d))).slice(0, 5).forEach(d => { s.disc[d.id] = { me: true, found: 15100601 }; });
      await CT.audience(king); out.zooTaken = CT.task() && CT.task().kind;
      await CT.audience(king);
      out.zooAt = s.court.zooAt.PT && s.court.zooAt.PT.ids.length;
      out.bld2 = G.Scenes.city.buildings(G.CITY_DATA[0]).filter(b => b.kind === 'museum' || b.kind === 'zoo').map(b => b.kind);
      return out;
    });
    console.log(JSON.stringify(r));
    ok(!r.mwBad.length && r.mwN >= 21 && r.generic === 3, '명작 표: 예술가 ' + r.mwN + '명 모두 그림·조각 세 점씩, 표에 없는 화가(동기창)도 세 점 ' + r.mwBad.join(','));
    ok(r.threeOk && r.seenKinds.length >= 10 && r.seenKinds.includes('museum'), '왕명은 무작위 셋 — 120번 굴려 본 종류: ' + r.seenKinds.join(','));
    ok(r.taken === 'museum' && /0\/3/.test(r.p0) && /2\/3/.test(r.p1), '박물관 건립을 받는다: ' + r.p0 + ' → 유물 둘(증거품은 빼고) ' + r.p1);
    ok(/^「바다의 성모」:0$/.test(r.mwItem || '') && r.p2.done, '레오나르도의 명작까지 셋 — ' + r.p2.text);
    ok(r.picks === 3 && r.removed === 3 && r.rank === 1 && r.museum.length === 3 && r.leftEvidence && r.thanks, '셋을 골라 바치면 소지품에서 빠지고 작위가 오른다 (' + r.museum.join(', ') + ')');
    ok(r.bld.length === 1 && /^museum:왕립 박물관$/.test(r.bld[0]), '리스본에 왕립 박물관이 선다');
    ok(r.zooTaken === 'zoo' && r.zooAt === 5 && r.bld2.join() === 'museum,zoo', '동물원 건설을 마치면 왕립 동물원도 (동물 ' + r.zooAt + '종)');

    // 화면: 리스본 거리 → 박물관 전시실 → 동물원
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const shown = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 70 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s; s.date = { y: 1510, m: 5, d: 1 };
      const rel = Object.keys(G.RELIC).filter(id => G.RELIC[id].kind === 'treasure').slice(3, 5);
      const items = rel.map(id => ({ id, name: G.RELIC[id].name, desc: G.RELIC[id].desc, value: G.RELIC[id].price, disc: G.RELIC[id].relic }))
        .concat([{ id: 'masterwork', name: '「갑판 위의 학당」', desc: '갑판에 모인 부하들을 옛 철학자들처럼 늘어세운 큰 그림.', value: 11000, mw: true, by: 'raffaello', wk: 'paint', n: 0, y: 1509 }]);
      s.court = { titles: { PT: 2 }, museum: { PT: { city: 0, y: 1510, sp: 'pt_king', items } }, zoo: { PT: 1510 }, zooAt: { PT: { city: 0, y: 1510, sp: 'pt_king', ids: G.DISCOVERIES.filter(d => d.cat === 'creature' && d.how !== 'city' && !(G.Court.isPlant && G.Court.isPlant(d))).slice(0, 5).map(d => d.id) } } };
      G.Game.go('city', { cityId: 0 });
      await new Promise(r => setTimeout(r, 2500));
      return G.Town && G.Town.active ? G.Town.active() : null;
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '1_street.png') });
    // 전시 카드 자체를 검증한다. 건물 입장 시 도시 발견 연출이 먼저 뜰 수 있으므로 전시실은 직접 연다.
    await page.evaluate(() => { void G.Scenes.city.B.museum.show(G.CITY_DATA[0], 'PT'); });
    await page.waitForSelector('.mu-card', { timeout: 15000, state: 'attached' }); await page.waitForTimeout(800);
    const mu = await page.evaluate(() => [...document.querySelectorAll('.mu-card')].map(c => (c.querySelector('img') ? 'img:' : 'icon:') + c.querySelector('.mu-name').textContent));
    await page.screenshot({ path: path.join(OUT, '2_museum.png') });
    ok(mu.length === 3 && mu.every(x => /^img:/.test(x)), '왕립 박물관 전시실: ' + mu.join(' · '));
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back .btn')].pop(); if (b) b.click(); });
    await page.waitForTimeout(600);
    await page.waitForTimeout(600);
    await page.evaluate(() => { void G.Scenes.city.B.zoo.show(G.CITY_DATA[0], 'PT'); });
    await page.waitForSelector('.mu-card', { timeout: 15000, state: 'attached' }); await page.waitForTimeout(800);
    const zo = await page.evaluate(() => [...document.querySelectorAll('.mu-card')].map(c => (c.querySelector('img') ? 'img:' : 'icon:') + c.querySelector('.mu-name').textContent));
    await page.screenshot({ path: path.join(OUT, '3_zoo.png') });
    ok(zo.length === 5, '왕립 동물원: ' + zo.join(' · '));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) {
    try { await page.screenshot({ path: path.join(OUT, 'fail.png') }); } catch (e2) { /* 없음 */ }
    console.error('✗', e.message); if (errors.length) console.error(errors.slice(0, 5).join(' | ')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
