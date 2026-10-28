/* 콜럼버스의 신대륙 발견과 그 뒤 (2026-10-29) — 산타페 · 바다 한가운데 · 과나하니 · 콜론의 달걀 · 엔코미엔다 · 설교 · 천연두와 의원 · 소식
   node tests/newworld_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
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
      const out = {}, said = [], toasts = [], asks = [];
      let pick = 'invest';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push(opts.map(o => o.value + (o.dis ? '!' : ''))); const o = opts.find(x => x.value === pick && !x.dis) || opts.filter(x => !x.dis).slice(-1)[0]; return o.value; };
      G.UI.toast = (t) => { toasts.push(t); };
      const NW = G.NewWorld, SF = G.SeaFolk;
      function fresh(y, m, d, city, o) {
        o = o || {};
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        if (o.med) sk.med = o.med;
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'ES', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 0 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.gold = 5000; s.player.notoriety = 0; s.mates = [];
        if (city != null) { const c = G.CITY_DATA[city]; s.loc = { mode: 'city', city, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: -60, lat: 25 };
        s.fleet.cargo = o.cargo || {}; s.fleet.food = 100; s.fleet.water = 100;
        said.length = 0; toasts.length = 0; asks.length = 0; delete s.newworld;
        return s;
      }
      const item = id => G.Game.state.player.items.some(x => x.id === id);
      out.data = ['nw_mendoza', 'nw_ovando', 'nw_montesinos', 'nw_lascasas', 'nw_enriquillo', 'nw_cacique'].every(id => G.HIST_FIG[id]) && !!G.ITEM.colon_egg && !!G.ITEM.cemi;
      // ① 세비야 — 금화를 보탠다
      let s = fresh(1491, 12, 1, 7); pick = 'invest';
      out.sfPend = NW.pending(); await NW.check();
      out.sf = { gold: s.player.gold, inv: s.newworld.invest, colon: said.some(t => t.startsWith('크리스토발 콜론|')), html: NW.html().replace(/<[^>]+>/g, ' ') };
      s = fresh(1492, 2, 10, 10); pick = 'cheer'; await NW.check();
      out.gr = { messenger: said.some(t => /산탄헬/.test(t)), done: s.newworld.santafe };
      out.grEarly = (fresh(1491, 12, 1, 10), NW.pending());
      // ②③ 바다에서 콜론의 함대에 신호
      const exp = G.EXPEDITIONS.find(e => e.id === 'colon1'), n = { exp };
      s = fresh(1492, 10, 1, null); s.newworld = undefined; NW.state().santafe = 1; pick = 'give';
      await SF.talk(n, { name: '크리스토발 콜론' });
      out.cross = { done: s.newworld.cross, food: s.fleet.food, water: s.fleet.water, three: said.some(t => /사흘/.test(t)) };
      s.date = { y: 1492, m: 10, d: 20 }; said.length = 0;
      await SF.talk(n, { name: '크리스토발 콜론' });
      out.land = { done: s.newworld.land, tierra: said.some(t => /티에라/.test(t)), journal: said.some(t => /쉰 명이면/.test(t)) };
      said.length = 0; await SF.talk(n, { name: '크리스토발 콜론' }); out.after = said.some(t => /산타 마리아호의 콜론/.test(t));
      s = fresh(1493, 10, 1, null); s.flags.delay_westroute = 1; pick = 'pass'; await SF.talk(n, { name: '크리스토발 콜론' }); out.delayed = !!s.newworld.cross;
      // ④ 콜론의 달걀 — 바르셀로나, 밑동을 깨뜨린다 · 돈을 댔으면 돌려받는다
      s = fresh(1493, 5, 1, 12); NW.state().invest = 2000; NW.state().met = 1; pick = 'crack'; const g0 = s.player.gold;
      out.eggPend = NW.pending(); await NW.check();
      out.egg = { how: s.newworld.eggHow, item: item('colon_egg'), gold: s.player.gold - g0, mendoza: said.some(t => t.startsWith('멘도사 추기경|')), stole: said.some(t => /훔쳤소/.test(t)), again: NW.pending() };
      s = fresh(1497, 3, 1, 7); pick = 'try'; await NW.check();
      out.eggSev = { how: s.newworld.eggHow, crackByColon: said.some(t => /콜론이 달걀 밑동을/.test(t)), item: item('colon_egg') };
      out.eggOff = (fresh(1499, 3, 1, 7), NW.pending());
      // ⑤ 엔코미엔다 · ⑥ 설교
      s = fresh(1505, 3, 1, 194); pick = 'take'; await NW.check();
      out.enc = { enc: s.newworld.enc, gold: s.player.gold, inf: s.player.notoriety };
      s.date = { y: 1512, m: 1, d: 6 }; pick = 'free'; said.length = 0; await NW.check();
      out.sermon = { enc: s.newworld.enc, inf: s.player.notoriety, mont: said.some(t => t.startsWith('몬테시노스 수사|') && /사람이 아닙니까/.test(t)), lc: said.some(t => t.startsWith('라스 카사스|')) };
      s = fresh(1505, 3, 1, 194); pick = 'no'; await NW.check(); out.encNo = { enc: s.newworld.enc, gold: s.player.gold, inf: s.player.notoriety };
      // ⑦ 천연두 — 의원이 없으면 식량만, 한 달 뒤 의원을 데려와 약재까지
      s = fresh(1519, 3, 1, 194, { cargo: { herbs: { q: 12, cost: 60 } } }); pick = 'food';
      out.poxPend = NW.pending(); await NW.check();
      out.nodoc = { p: s.newworld.pox[194], opts: asks[0], food: s.fleet.food, saved: s.newworld.saved, again: NW.pending() };
      s.player.sk.med = 2; s.date = G.U.addDays(s.date, 31); said.length = 0; asks.length = 0; pick = 'docHerb';
      out.retry = NW.pending(); await NW.check();
      out.doc = { p: s.newworld.pox[194], saved: s.newworld.saved, herbs: s.fleet.cargo.herbs ? s.fleet.cargo.herbs.q : 0, cemi: item('cemi'), enr: said.some(t => t.startsWith('엔리키요|') && /세미/.test(t)), opts: asks[0], again: NW.pending() };
      // 산티아고 — 부하 의원(의학 3), 약재 없이
      const medMate = G.MATES.find(d => d.sk && d.sk.med >= 3 && !d.tale && !d.witch);
      s.loc = { mode: 'city', city: 195, lon: G.CITY_DATA[195].lon, lat: G.CITY_DATA[195].lat }; s.player.sk.med = 0; s.mates = [{ id: medMate.id, role: 'none', loyal: 80 }];
      pick = 'doc'; said.length = 0; const sv0 = s.newworld.saved; await NW.check();
      out.cuba = { p: s.newworld.pox[195], add: s.newworld.saved - sv0, tob: s.fleet.cargo.tobacco ? s.fleet.cargo.tobacco.q : 0, who: said.some(t => t.indexOf(medMate.name) >= 0), lv: G.R.skillBest('med').lv };
      out.html = NW.html().replace(/<[^>]+>/g, ' ');
      out.poxLate = (s.date = { y: 1520, m: 9, d: 1 }, s.loc.city = 197, NW.pending());
      // 소식 — 1518.12 천연두 · 1519.9 엔리키요(세미의 은혜) · 1520.9 살아남은 사람들
      s.date = { y: 1518, m: 11, d: 25 }; s.newworld.told = {}; ['capit', 'back', 'second', 'navidad', 'isabela', 'tribute', 'chains', 'ovando', 'xaragua', 'colonDies', 'hatuey', 'lascasas', 'africa'].forEach(k => { s.newworld.told[k] = 1; });
      const news = []; for (let i = 0; i < 700; i++) { s.date = G.U.addDays(s.date, 1); NW.daily().forEach(x => news.push(x.text)); }
      out.news = { list: news.map(t => (t.match(/【([^】]+)】/) || [])[1]), enr: news.some(t => /착한 손/.test(t)), rem: (news.find(t => /살아남은 사람들/.test(t)) || '').match(/(\d+)명의 타이노/) };
      // 옛 저장(1550): 지난 소식은 몰아서 알리지 않는다 · 만나지 않으면 소식 없음
      s = fresh(1550, 1, 1, 7); NW.daily(); s.newworld.met = 1; out.old = NW.daily().length;
      s = fresh(1493, 1, 1, null); const nn = []; for (let i = 0; i < 120; i++) { s.date = G.U.addDays(s.date, 1); NW.daily().forEach(x => nn.push(x)); } out.unmet = nn.length;
      out.lisbon = (fresh(1493, 5, 1, 0), NW.pending());
      return out;
    });
    console.log('   ' + JSON.stringify({ sf: r.sf, egg: r.egg, nodoc: r.nodoc, doc: r.doc, cuba: r.cuba, news: r.news }));
    ok(r.data, '인물 여섯(멘도사·오반도·몬테시노스·라스 카사스·엔리키요·추장) · 기념품 「콜론의 달걀」「타이노의 세미」');
    ok(r.sfPend && r.sf.gold === 3000 && r.sf.inv === 2000 && r.sf.colon && /대서양 서쪽에서 콜론의 함대/.test(r.sf.html), '① 세비야: 떠나려는 콜론에게 금화 2,000을 보탠다 · 수첩에 「바다에서 함대를 만나라」');
    ok(r.gr.messenger && r.gr.done && r.grEarly === false, '① 그라나다(1492.1.2부터): 여왕의 전령이 콜론을 불러 세운다 (함락 전에는 없다)');
    ok(r.cross.done && r.cross.food === 90 && r.cross.water === 90 && r.cross.three, '② 바다 한가운데: 들고일어난 선원들 — 식량·물 10씩을 건넨다');
    ok(r.land.done && r.land.tierra && r.land.journal && r.after, '③ 과나하니의 아침: 「티에라!」 · 콜론 일지의 불길한 줄 — 다 본 뒤에는 보통 신호 대화');
    ok(r.delayed, '함대가 부서져 한 해 늦으면 바다의 장면도 한 해 늦게');
    ok(r.eggPend && r.egg.how === 'crack' && r.egg.item && r.egg.gold === 6000 && r.egg.mendoza && r.egg.stole && !r.egg.again, '④ 콜론의 달걀(바르셀로나): 밑동을 깨뜨려 콜론보다 먼저 — 「내 달걀을 훔쳤소」 · 기념품 · 투자 3배(6,000)');
    ok(r.eggSev.how === 'try' && r.eggSev.crackByColon && r.eggSev.item && r.eggOff === false, '④ 세비야(항해 사이): 그냥 세우면 쓰러지고 콜론이 깨뜨려 세운다 · 항해 중(1499)에는 없다');
    ok(r.enc.enc === 1 && r.enc.gold === 8000 && r.enc.inf === 6, '⑤ 엔코미엔다를 받으면 금화 +3,000 · 악명 +6');
    ok(r.sermon.enc === 2 && r.sermon.inf === 2 && r.sermon.mont && r.sermon.lc, '⑥ 몬테시노스 「이들은 사람이 아닙니까?」 — 마을을 놓아주면 악명 −4 · 젊은 라스 카사스');
    ok(r.encNo.enc === 3 && r.encNo.gold === 5000 && r.encNo.inf === 0, '⑤ 엔코미엔다 거절');
    ok(r.poxPend && r.nodoc.p === 'food' && r.nodoc.opts.join(',') === 'food,away' && r.nodoc.food === 80 && r.nodoc.saved === 15 && !r.nodoc.again, '⑦ 천연두 — 의원이 없으면 식량만(15명) · 한 달 안에는 다시 없다');
    ok(r.retry && r.doc.p === 'doc' && r.doc.saved === 15 + 220 && r.doc.herbs === 2 && r.doc.cemi && r.doc.enr && r.doc.opts.join(',') === 'doc,docHerb,away' && !r.doc.again, '⑦ 한 달 뒤 의원(의학 2)과 약재로 220명을 살린다 · 엔리키요의 세미');
    ok(r.cuba.p === 'doc' && r.cuba.add === 40 + 55 * r.cuba.lv && r.cuba.tob === 10 && r.cuba.who, '⑦ 산티아고: 부하 의원(의학 ' + r.cuba.lv + ')이 돌본다 · 담배');
    ok(/자메이카/.test(r.html) && !/산토도밍고/.test(r.html) && r.poxLate === false, '수첩: 아직 돌보지 못한 섬만 · 1520년 8월이 지나면 닫힌다');
    ok(r.news.list.includes('천연두') && r.news.list.includes('엔리키요의 산') && r.news.list.includes('살아남은 사람들') && r.news.enr && r.news.rem && +r.news.rem[1] === r.doc.saved + r.cuba.add, '소식: 천연두 · 엔리키요(착한 손) · 살아남은 사람들 ' + (r.news.rem && r.news.rem[1]) + '명');
    ok(r.old === 0 && r.unmet === 0, '옛 저장은 지난 소식을 몰아서 알리지 않고, 만나지 않았으면 소식도 없다');
    ok(r.lisbon === false, '다른 도시에서는 일어나지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
