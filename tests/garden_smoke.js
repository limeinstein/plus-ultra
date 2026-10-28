/* 왕실 정원 (2026-10-21) — js/city/garden.js · js/systems/court.js (isPlant·plantItem·gardenPlants·왕명 garden)
   · 식물: 나무·꽃·풀 발견물 11종(불로초 포함)은 식물, 짐승은 아니다 · 씨앗·묘목·분재 유물은 식물 유물, 거미 표본·모자반은 아니다
   · 식물은 동물원(왕명·기증)에도 박물관(왕명·기증)에도 들어가지 않는다
   · 옛 저장: 동물원에 들어가 있던 식물·박물관에 걸린 씨앗은 그 나라의 왕실 정원으로 옮겨진다
   · 왕궁 메뉴에 「왕실 정원」 · 왕명 「왕실 정원 가꾸기」(탐험 명성) — 왕좌에서 아뢰면 「정원사에게 넘기시오」
   · 정원에서 식물 3종(찾아낸 식물 + 씨앗)을 넘기면 군주가 정원으로 나와 서임 — 작위 +1, 씨앗은 소지품에서 빠진다
   · 왕명이 없을 때 바치면 한 종마다 사교 명성·신뢰 · 정원을 거닐면 그림 카드 · 콘솔 오류 0
   node tests/garden_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|net::/.test(m.text())) errors.push(m.text()); });
  await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/**', route => route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' }));
  try {
    const target = process.env.PAGE && /^https?:\/\//.test(process.env.PAGE) ? process.env.PAGE : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, CT = G.Court, F = G.Fame;
      const ui0 = { say: UI.say, alert: UI.alert, toast: UI.toast, confirm: UI.confirm, choose: UI.choose, ask: UI.ask };
      function fresh() {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
        G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        const s = G.Game.state; s.flags.prologue = true; s.date = { y: 1550, m: 5, d: 1 };
        return s;
      }
      const relicOf = disc => Object.keys(G.RELIC).filter(id => G.RELIC[id].relic === disc)[0];
      // ---- 식물 가리기
      out.plants = G.DISCOVERIES.filter(CT.isPlant).map(d => d.id).filter(id => (G.PLANTS || []).indexOf(id) < 0 && (G.AMER1630 || []).indexOf(id) < 0); out.amerPlants = (G.AMER1630 || []).filter(id => CT.isPlant(G.DISC[id])).length;   // 2026-10-28 아메리카 1630 식물 10
      out.newPlants = (G.PLANTS || []).filter(id => CT.isPlant(G.DISC[id])).length;   // 2026-10-22 식물 발견물 79종(js/data/plantdisc.js)은 따로 센다
      out.animalNot = ['tiger', 'giraffe', 'tarantula'].every(id => !CT.isPlant(G.DISC[id]));
      out.seedOk = ['sequoia', 'breadfruit', 'lotus', 'flowers', 'huangshan'].map(d => relicOf(d)).every(id => id && CT.plantItem({ id }));
      out.seedNot = ['tarantula', 'sargasso', 'rubber', 'papyrus'].map(d => relicOf(d)).filter(Boolean).every(id => !CT.plantItem({ id }));

      // ---- 동물원·박물관에서 빠진다
      let s = fresh();
      ['rubber', 'lotus', 'tiger', 'giraffe'].forEach(id => { s.disc[id] = { me: true, found: 15400101 }; });
      s.player.items.push({ id: relicOf('lotus') }, { id: relicOf('tarantula') });
      out.zoo = CT.zooAnimals().map(d => d.id).sort().join(',');
      out.museum = CT.museumItems().map(it => it.id).join(',');
      out.gardenHave = CT.gardenPlants().map(x => x.d ? x.d.id : x.it.id).join(',');

      // ---- 옛 저장 옮기기
      s = fresh();
      s.court = { titles: { PT: 1 }, zoo: { PT: 1540 }, zooUsed: { rubber: 1, tiger: 1 }, zooAt: { PT: { city: 0, y: 1540, sp: 'pt_king', ids: ['rubber', 'tiger'] } },
        museum: { PT: { city: 0, y: 1541, sp: 'pt_king', items: [{ id: relicOf('lotus'), name: '큰 연꽃 씨앗', desc: '', value: 10 }, { id: 'x_old', name: '옛 전시품', desc: '', value: 1 }] } } };
      const c0 = CT.state();
      out.mig = { zoo: c0.zooAt.PT.ids.join(','), zooUsed: Object.keys(c0.zooUsed).join(','), museum: c0.museum.PT.items.map(x => x.name).join(','), garden: c0.garden.PT ? c0.garden.PT.ids.join(',') + '|' + c0.garden.PT.items.map(x => x.name).join(',') : '' };
      out.zooShow = CT.zooAnimalsOf(c0.zooAt.PT).map(d => d.id).join(',');

      // ---- 대화창 대신 답하기
      const said = []; let want = null, pickPlant = 0;
      UI.say = async (t) => { said.push(String(t)); };
      UI.alert = async (t) => { said.push(String(t)); };
      UI.toast = () => {};
      UI.confirm = async () => true;
      UI.ask = async (text, opts) => { said.push(String(text)); return opts[0].value; };
      UI.choose = async (title, opts) => {
        if (want) { const o = opts.filter(x => x.value && x.value.kind === want)[0]; return o ? o.value : null; }
        if (title === '왕실 정원') { if (pickPlant > 0) return 'give'; return null; }
        if (/왕실 정원에 바친다/.test(title)) { if (pickPlant > 0) { pickPlant--; return opts[0].value; } return null; }
        return null;
      };
      G.Game.refreshHud = () => {};
      G.State.save = () => {};

      // ---- 왕명 「왕실 정원 가꾸기」
      s = fresh(); F.add('ex', 10500 + 10000 * 3); s.court = { titles: { PT: 3 } };
      const king = G.SPONSOR.pt_king, realm = CT.realmOf(king);
      ['rubber', 'lotus'].forEach(id => { s.disc[id] = { me: true, found: 15400101 }; });
      s.player.items.push({ id: relicOf('breadfruit') });
      out.menu = CT.palaceItems(king).map(x => x.label).join(',');
      let o = null;
      for (let i = 0; i < 300 && !o; i++) { s.court.offers = {}; s.seed = 500 + i; o = CT.offers(king).filter(x => x.kind === 'garden')[0]; }
      out.offer = o ? o.title + ' · ' + o.cat + ' · n=' + o.n : null;
      want = 'garden'; await CT.audience(king); want = null;
      const t = CT.task();
      out.accepted = !!t && t.kind === 'garden';
      out.prog0 = t && CT.progress(t).text;
      said.length = 0; await CT.report(king);
      out.reportHint = said.some(x => /왕실 정원」에서 정원사에게/.test(x));
      out.menuSub = G.Garden.menuItem(king, realm).sub;
      const fame0 = s.player.fame, ex0 = s.player.fameBy.ex, items0 = s.player.items.length;
      said.length = 0; pickPlant = 3;
      await G.Garden.visit(king);
      const c = CT.state(), g = c.garden.PT;
      out.done = { title: c.titles.PT, task: !!CT.task(), gdone: !!c.gardenDone.PT, n: g ? g.ids.length + '+' + g.items.length : '-', seedGone: s.player.items.length === items0 - 1, used: Object.keys(c.gardenUsed).sort().join(','),
        ex: s.player.fameBy.ex - ex0, king: said.some(x => /몸소 정원으로 나왔다/.test(x)), knight: said.some(x => /무릎을 꿇으시오/.test(x)), alert: said.some(x => /정원에 심어져/.test(x)) };
      out.again = CT.offers(king).some(x => x.kind === 'garden');
      // ---- 왕명 없이 바친다
      s.disc.sequoia = { me: true, found: 15400101 };
      const so0 = s.player.fameBy.so, tr0 = G.Sponsor.rel(king.id).trust;
      pickPlant = 1; said.length = 0;
      await G.Garden.visit(king);
      out.free = { so: s.player.fameBy.so - so0, trust: G.Sponsor.rel(king.id).trust - tr0, n: g.ids.length + g.items.length, line: said.some(x => /사교 명성 \+/.test(x)) };
      Object.assign(UI, ui0);
      return out;
    });
    console.log('   식물 ' + r.plants.length + '종: ' + r.plants.join(', '));
    ok(r.plants.length === 11 && r.plants.indexOf('bullocho') >= 0 && r.animalNot && r.newPlants === 79 && r.amerPlants === 10, '나무·꽃·풀 11종(불로초 포함)·새 식물 79종·아메리카 1630 식물 10종은 식물, 호랑이·기린·거미는 아니다');
    ok(r.seedOk && r.seedNot, '씨앗·묘목·분재(세쿼이아·빵나무·연꽃·푸른 양귀비·황산 소나무)는 식물 유물 — 거미 표본·모자반·고무공·파피루스는 아니다');
    ok(r.zoo === 'giraffe,tiger' && r.museum.indexOf('lotus') < 0 && r.museum !== '' && /rubber/.test(r.gardenHave) && /lotus/.test(r.gardenHave), '동물원에는 짐승만, 박물관에는 씨앗이 빠지고, 정원에 바칠 것: ' + r.gardenHave);
    console.log('   옛 저장: ' + JSON.stringify(r.mig) + ' · 동물원 전시 ' + r.zooShow);
    ok(r.mig.zoo === 'tiger' && r.mig.zooUsed === 'tiger' && r.mig.museum === '옛 전시품' && r.mig.garden === 'rubber|큰 연꽃 씨앗' && r.zooShow === 'tiger', '옛 저장: 동물원의 흰 수액나무·박물관의 연꽃 씨앗이 포르투갈 왕실 정원으로 옮겨졌다');
    ok(/왕실 정원/.test(r.menu), '왕궁 메뉴: ' + r.menu);
    ok(r.offer && /· ex · n=3/.test(r.offer) && r.accepted, '왕명 「' + r.offer + '」을 받았다');
    ok(r.reportHint, '왕좌에서 아뢰면 「식물은 왕궁 안 「왕실 정원」에서 정원사에게 넘기시오」 — ' + r.prog0 + ' · 메뉴 「' + r.menuSub + '」');
    console.log('   ' + JSON.stringify(r.done));
    ok(r.done.title === 4 && !r.done.task && r.done.gdone && r.done.n === '2+1' && r.done.seedGone && r.done.king && r.done.knight && r.done.alert && r.done.ex > 0, '정원에서 3종(찾아낸 식물 2 + 빵나무 묘목)을 넘기자 군주가 정원으로 나와 백작 서임, 탐험 명성 +' + r.done.ex);
    ok(!r.again, '정원 왕명은 한 나라에 한 번');
    ok(r.free.so > 0 && r.free.trust > 0 && r.free.n === 4 && r.free.line, '왕명 없이 바친 세쿼이아: 사교 명성 +' + r.free.so + ' · 신뢰 +' + r.free.trust);

    // ---------------- 정원을 거닌다 (실제 창)
    await page.evaluate(() => {
      const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));
    await page.evaluate(() => { window.__gs = G.Garden.show(G.SPONSOR.pt_king, G.Court.realmOf(G.SPONSOR.pt_king)); });
    await page.waitForSelector('.mu-card', { timeout: 10000 });
    await page.waitForTimeout(1200);
    const cards = await page.evaluate(() => Array.from(document.querySelectorAll('.mu-card')).map(x => x.querySelector('.mu-name').textContent + (x.querySelector('img') ? '🖼' : '')));
    await page.screenshot({ path: path.join(OUT, 'garden.png') });
    ok(cards.length === 4, '정원을 거닌다 — 카드 ' + cards.join(' · ') + ' (그림: ' + path.join(OUT, 'garden.png') + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
