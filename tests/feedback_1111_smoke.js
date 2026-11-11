/* 2026-11-11 피드백 세 건
   ① 날치(flyingfish)와 나는 물고기(f_flying)를 하나로 — js/data/animals.js · seadisc.js · discrelics.js · js/core/state.js ST.migrateAlias
   ② 의뢰한 항구에서 사 오거나 찾을 수 있는 의뢰는 내지 않는다 — js/systems/quest.js(조합 상품 구입) · errand.js(소문 확인) · court.js(납품)
   ③ 배로 입항할 때는 날이 흐르지 않고, 성문으로 들어올 때·출항할 때 난이도의 1·3·10일 — R.portDays · city.js C.arrival · harbor.js H.depart
   node tests/feedback_1111_smoke.js */
'use strict';
const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    // ---------------- ① 날치
    const a = await page.evaluate(async () => {
      const mk = () => G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      let s = mk(); s.date = { y: 1482, m: 3, d: 1 };
      const d = G.DISC.f_flying, out = {};
      out.old = !!G.DISC.flyingfish; out.how = d.how; out.r = d.r; out.fish = G.FISH_DISCS.indexOf('f_flying') >= 0;
      out.colon = (G.BOOKS.find(b => b.id === 'b_colon') || {}).discs.indexOf('f_flying') >= 0 && (G.BOOKS.find(b => b.id === 'b_colon') || {}).discs.indexOf('flyingfish') < 0;
      s.hints.f_flying = { src: 'test', d: 0 };   // 단서가 있으면 지나치지 않는다
      const hitAt = (lon, lat) => G.Disc.checkSea(lon, lat).map(x => x.id);
      out.near = hitAt(-25.5, 15.5).indexOf('f_flying') >= 0;
      out.far = hitAt(-28.5, 15.0).indexOf('f_flying') >= 0;   // 3.5° — 예전 날치(반지름 4°)라면 찾혔을 자리
      out.fishAtl = G.Fishing.rareHere(-30, 10).some(x => x.d.id === 'f_flying');
      out.fishPac = G.Fishing.rareHere(150, 10).some(x => x.d.id === 'f_flying');
      out.rival = (G.DISC.f_flying.rival || [])[2];
      // 옛 저장: 날치를 찾아 보고까지 했고 치어를 가지고 있다
      s = mk();
      s.disc.flyingfish = { me: true, found: 14820301, reported: true, relics: ['r_flyingfish_baby'] };
      s.hints.flyingfish = { src: 'old', d: 1 };
      s.player.items.push({ id: 'r_flyingfish_baby', disc: 'flyingfish' });
      s.contract = { sponsor: 'x', disc: 'flyingfish' };
      const json = JSON.stringify(Object.assign({}, s, { chartBits: undefined, chartPasses: undefined }));
      const S2 = G.State.deserialize(json);
      out.mig = { oldGone: !S2.disc.flyingfish && !S2.hints.flyingfish, me: S2.disc.f_flying && S2.disc.f_flying.me, rep: S2.disc.f_flying && S2.disc.f_flying.reported,
        relic: S2.disc.f_flying && S2.disc.f_flying.relics, hint: !!S2.hints.f_flying, item: S2.player.items.find(it => it.id === 'r_f_flying_baby'), itemDef: !!G.ITEM.r_f_flying_baby, contract: S2.contract.disc,
        left: JSON.stringify(S2).indexOf('"flyingfish"') };
      return out;
    });
    console.log(JSON.stringify(a));
    ok(!a.old && a.how === 'sea' && a.r === 2 && a.fish, '날치는 나는 물고기(f_flying) 하나 — 배로(반지름 2°) · 낚시로 모두 찾는다');
    ok(a.colon, '『콜론의 항해 일지』 단서도 나는 물고기로');
    ok(a.near && !a.far, '카보베르데 앞바다 2° 안에서 찾고, 3.5° 밖에서는 찾지 않는다 (예전 날치 4°)');
    ok(a.fishAtl && !a.fishPac, '낚시: 대서양 열대 바다에서만 (태평양에서는 안 걸린다)');
    ok(a.mig.oldGone && a.mig.me && a.mig.rep && a.mig.hint, '옛 저장: 날치 발견·보고·단서가 나는 물고기로 옮겨진다 (두 번 보상받지 않는다)');
    ok(a.mig.item && a.mig.item.disc === 'f_flying' && a.mig.itemDef && a.mig.contract === 'f_flying' && a.mig.left < 0, '옛 저장: 「날치 치어」는 「대서양날치 치어」로, 계약도 나는 물고기로');
    // ---------------- ② 의뢰
    const b = await page.evaluate(async () => {
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const R = G.R, bad = { guild: [], errand: [], court: [] }; let n = { guild: 0, buy: 0, errand: 0, confirm: 0, court: 0, supply: 0 };
      for (const yr of [s.date.y, 1500, 1530, 1560]) {
        s.date = { y: yr, m: 1, d: 1 };
        for (let blk = 0; blk < 36; blk++) {
          s.day = blk * 10; s.player.fame = blk * 300;
          G.CITY_DATA.forEach(c => {
            if (!c || !R.cityExists(c) || !G.Quest.hasGuild(c)) return;
            G.Quest.offers(c).forEach(q => { n.guild++; if (q.kind === 'buy') { n.buy++; if (R.cityGoods(c).indexOf(q.good) >= 0) bad.guild.push(c.name + ':' + q.title); } });
          });
        }
        for (let m = 1; m <= 12; m++) {
          s.date = { y: yr, m, d: 1 };
          Object.values(G.SPONSOR).forEach(sp => {
            if (sp.city == null) return;
            const c = G.CITY_DATA[sp.city];
            G.Errand.offers(sp).forEach(t => { n.errand++; if (t.kind === 'confirm') n.confirm++;
              if (t.kind === 'procure' && R.cityGoods(c).indexOf(t.good) >= 0) bad.errand.push(sp.id + ':' + t.title);
              if (t.kind === 'confirm' && G.DISC[t.disc].city === sp.city) bad.errand.push(sp.id + ':' + t.title); });
            if (G.Court.realmOf(sp)) {
              s.court = {}; s.player.fame = (m - 1) * 10000;
              (G.Court.offers(sp) || []).forEach(t => { n.court++; if (t.kind === 'supply') { n.supply++; if (R.cityGoods(c).indexOf(t.good) >= 0) bad.court.push(sp.id + ':' + t.title); } });
            }
          });
        }
      }
      // 리스본 조합 · 시작 무렵
      s.date = { y: 1480, m: 3, d: 1 }; s.day = 0; s.player.fame = 0;
      const lis = G.CITY_DATA[0], lisBuy = [];
      for (let blk = 0; blk < 60; blk++) { s.day = blk * 10; G.Quest.offers(lis).forEach(q => { if (q.kind === 'buy') lisBuy.push(q.good); }); }
      return { n, bad, lisFish: lisBuy.filter(g => R.cityGoods(lis).indexOf(g) >= 0) };
    });
    console.log(JSON.stringify(b.n));
    ok(b.n.buy > 500 && b.bad.guild.length === 0, '조합 「상품 구입」 ' + b.n.buy + '건 — 의뢰한 도시 교역소에서 파는 물건은 0건');
    ok(b.lisFish.length === 0, '리스본 조합이 리스본에서 파는 물건(어육 등)을 구해 오라고 하지 않는다');
    ok(b.n.confirm > 300 && b.bad.errand.length === 0, '후원자 일거리 — 후원자 도시 안의 발견 「소문 확인」·그 도시에서 파는 물건 「조달」 0건 (소문 확인 ' + b.n.confirm + '건)');
    ok(b.n.supply > 100 && b.bad.court.length === 0, '궁정 납품 ' + b.n.supply + '건 — 군주의 도시에서 파는 물건 0건');
    // ---------------- ③ 입항·성문·출항의 날
    const c = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const out = {};
      for (const diff of ['easy', 'normal', 'original']) {
        const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff });
        s.settings.res = 0.35; s.date = { y: 1480, m: 3, d: 1 }; s.fleet.food = 200; s.fleet.water = 200;
        const C = G.Scenes.city, UI = G.UI;
        UI.say = async () => 1; C.mate = async () => 1; C.news = async () => 1;
        const day = () => s.day;
        // 배로 입항
        let d0 = day(); s.loc.via = 'sea'; G.Game.go('city', { cityId: 0, arrive: true }); await wait(2500);
        document.querySelectorAll('.modal-back button').forEach(b => b.click()); await wait(300);
        const sea = day() - d0;
        // 성문으로 걸어 들어옴 (탐험대가 다른 도시에)
        d0 = day(); G.Game.go('city', { cityId: 9, arrive: true, gate: true, via: 'land' }); await wait(2500);
        document.querySelectorAll('.modal-back button').forEach(b => b.click()); await wait(300);
        const gate = day() - d0;
        // 출항
        G.Game.go('city', { cityId: 0 }); await wait(2000); document.querySelectorAll('.modal-back button').forEach(b => b.click());
        s.loc.via = 'sea'; C.mateAsk = async (t, o) => o[0].value;
        d0 = day(); let wentSea = false; const go0 = G.Game.go; G.Game.go = function (n, a) { if (n === 'sea') { wentSea = true; return; } return go0.apply(this, arguments); };
        await C.B.harbor.depart(G.CITY_DATA[0]); G.Game.go = go0;
        out[diff] = { sea, gate, depart: day() - d0, wentSea, portDays: G.R.portDays() };
        document.querySelectorAll('.modal-back').forEach(m => m.remove());
      }
      return out;
    });
    console.log(JSON.stringify(c));
    ok(c.easy.sea === 0 && c.normal.sea === 0 && c.original.sea === 0, '배로 입항: 날이 흐르지 않는다 (쉬움·보통·엄격 모두 0일)');
    ok(c.easy.gate === 1 && c.normal.gate === 3 && c.original.gate === 10, '성문으로 들어올 때: 1·3·10일');
    ok(c.easy.depart === 1 && c.normal.depart === 3 && c.original.depart === 10 && c.normal.wentSea, '출항할 때: 1·3·10일 뒤 바다로');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
