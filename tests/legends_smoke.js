/* 전설 속 인물 (js/systems/legends.js) — 만나는 길과 부하가 되는 길을 차례로 밟는다.
   · 11명이 항해사 명부(G.MATE)에 있고 얼굴·무릎상(portraits/legendary)이 이어지며, 술집 손님·떠도는 명부에는 나오지 않는다
   · 세 형제: 중국 술집 술 3번(같은 도시는 한 번) + 탁군 땅 + 다른 중국 술집 → 셋이 함께 부하
   · 제갈량: 유비 부관 + 여관 3번 · 달타냥: 프랑스 시장 물건 3개 + 금화 2000 빌려줌 · 삼총사: 새 도시 술집마다 결투(지면 다음 도시에서 다시)
   · 셰헤라자드: 이슬람 도서관 책 5권 · 알라딘·알리바바: 셰헤라자드 통역 + 오스만 교역소 출자 5등급 (서로 다른 도시)
   · 대화는 그대로 두고(무릎상 둘이 마주 서는지 한 장면 찍는다) 고르는 창만 저절로 고른다. 콘솔 오류 0
   node tests/legends_smoke.js */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'legends_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('crash', () => console.log('!! 페이지가 죽었다'));
  page.on('console', m => { if (/^ASK/.test(m.text())) console.log('    ' + m.text()); });
  page.on('close', () => console.log('!! 페이지가 닫혔다'));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const base = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.UI.fade = async (fn) => { fn && fn(); };
      G.Game.state = G.State.newGame({ name: '이강희', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.player.gold = 500000; s.flags.prologue = true; s.settings.res = 0.35;
      const ids = G.LEGENDS, out = { n: ids.length, faces: {}, halves: {} };
      ids.forEach(id => { out.faces[id] = G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(id)) || []); out.halves[id] = G.Img.pick(G.Img.chain.mateHalf(id)); });
      const locs = G.MateMove.locs(); out.located = ids.filter(id => locs[id] != null);
      out.cand = G.CITY_DATA.some(c => G.Scenes.city.B.tavern.candidates(c).some(m => m.tale));
      return out;
    });
    ok(base.n === 11, '전설 속 인물 11명이 항해사 명부에 있다');
    ok(Object.keys(base.faces).every(id => base.faces[id] === 'portraits/legendary/' + id), '얼굴은 portraits/legendary/<id> ' + JSON.stringify(base.faces).slice(0, 80));
    ok(Object.keys(base.halves).every(id => base.halves[id] === 'portraits/legendary/' + id + '_half'), '무릎상은 portraits/legendary/<id>_half');
    ok(!base.located.length && !base.cand, '술집 손님·떠도는 명부에는 나오지 않는다 ' + base.located.join(','));

    // 고르는 창만 저절로 (대화는 Enter로 넘긴다)
    await page.evaluate(() => {
      window._asks = []; window._say = [];
      const UI = G.UI, say0 = UI.say;
      UI.say = function (t, who) { _say.push([(who && who.name) || '', String(t).slice(0, 40)]); if (window._logSay) console.log('ASK say ' + ((who && who.name) || '') + ': ' + String(t).slice(0, 50)); if (window._shot) return say0.apply(this, arguments); return Promise.resolve(); };
      UI.confirm = async (t) => { _asks.push(['confirm', String(t).slice(0, 50)]); console.log('ASK confirm ' + String(t).slice(0, 60)); return window._no ? false : true; };
      UI.ask = async (t, ch) => { _asks.push(['ask', String(t).slice(0, 50)]); console.log('ASK ' + String(t).slice(0, 60) + ' :: ' + ch.map(x => x.label || x).join('|')); const o = ch.map((x, i) => typeof x === 'string' ? { value: i } : x).filter(x => !x.dis); const w = window._pick != null && /누가 나설까/.test(t) ? o.find(x => x.value === window._pick) : null; if (w) return w.value; return (/빌려줄까|누가 나설까/.test(t) ? o[0] : o[o.length - 1]).value; };   // 다른 손님의 물음은 마지막(떠난다·무시한다)
      UI.toast = (t) => { _say.push(['toast', String(t).slice(0, 60)]); };
      window._enter = async (cid, kind) => {
        const C = G.Scenes.city, s = G.Game.state;
        if (G.Game.sceneName !== 'city') { G.Game.go('city', { cityId: cid }); await new Promise(r => setTimeout(r, 600)); }
        if (s.loc.city !== cid) { s.loc.city = cid; C.main && C.main(); await new Promise(r => setTimeout(r, 200)); }
        for (let k = 0; k < 20 && !(C.current() && C.current().kind === kind); k++) { await C.visit(kind); if (!(C.current() && C.current().kind === kind)) await new Promise(r => setTimeout(r, 300)); }
        if (!(C.current() && C.current().kind === kind)) throw new Error('건물에 못 들어감 ' + kind + ' ' + cid);
      };
      G.Disc.checkCity = () => []; G.Disc.checkPerson = () => [];   // 건물에 들어갈 때의 발견 연출은 이 시험과 관계없다 (headless에서 무겁다)
      window._duel = 'win'; G.Games.duel = async (en, opt) => { _asks.push(['duel', en.name, opt && opt.mate ? opt.mate.id : 'me']); G.Games.lastDuel = { mate: opt && opt.mate }; return window._duel; };
    });
    const visit = (cid, kind, fn) => page.evaluate(async ([cid, kind, fn]) => {
      const C = G.Scenes.city, s = G.Game.state;
      // 도시를 옮길 때 장면을 새로 그리지 않는다 (headless 브라우저의 메모리) — 건물 일은 S().loc.city 만 본다
      if (G.Game.sceneName !== 'city') { G.Game.go('city', { cityId: cid }); await new Promise(r => setTimeout(r, 600)); }
      if (s.loc.city !== cid) { s.loc.city = cid; G.Scenes.city.main && G.Scenes.city.main(); await new Promise(r => setTimeout(r, 200)); }
      for (let k = 0; k < 20 && !(C.current() && C.current().kind === kind); k++) { await C.visit(kind); if (!(C.current() && C.current().kind === kind)) await new Promise(r => setTimeout(r, 300)); }
      if (!(C.current() && C.current().kind === kind)) throw new Error('건물에 못 들어감 ' + kind + ' ' + cid + ' busy=' + C.isBusy() + ' ui=' + G.UI.busy());
      const c = G.CITY_DATA[cid], B = C.B[kind];
      if (fn === 'drink3') { for (let i = 0; i < 3; i++) await B.drink(c); }
      if (fn === 'treat3') { for (let i = 0; i < 3; i++) await B.treat(c); }
      if (fn === 'buy3') {
        let n = 0; G.UI.choose = async (t, list) => { n++; const it = list.filter(x => !x.disabled)[0]; return n <= 3 && it ? it.value : null; };
        await B.buy(c);
      }
      if (C.current()) await C.leave();
      return { mates: s.mates.map(m => m.id + ':' + m.role), L: JSON.parse(JSON.stringify(s.legend || {})), gold: s.player.gold };
    }, [cid, kind, fn || '']);

    // ---------------------------------------------------------------- 세 형제
    console.log('세 형제');
    const china = await page.evaluate(() => G.CITY_DATA.filter(c => G.Legend.isChina(c) && G.R.cityExists(c) && G.R.facilities(c).tavern).map(c => c.id));
    let r = await visit(china[0], 'tavern', 'drink3');
    ok(r.L.tao.met.length === 1, '중국 술집에서 술을 세 번 사니 세 형제를 만났다 (' + r.L.tao.met.join(',') + ')');
    r = await visit(china[0], 'tavern', 'drink3');
    ok(r.L.tao.met.length === 1, '같은 도시 술집에서는 다시 만나지 않는다');
    await page.evaluate(async () => { await G.Legend.onLand(116.3, 39.9); });   // 북경 — 탁군에서 0.45° 밖
    r = await page.evaluate(() => G.Game.state.legend.tao.met.length);
    ok(r === 1, '탁군 밖(북경)에서는 일어나지 않는다');
    await page.evaluate(async () => { await G.Legend.onLand(115.97, 39.49); });
    r = await page.evaluate(() => G.Game.state.legend.tao.met.slice());
    ok(r.length === 2 && r[1] === 'zhuo', '탁군 땅을 밟으니 복숭아밭에서 두 번째 만남');
    r = await visit(china[1], 'tavern', 'treat3');
    ok(['liu_bei', 'guan_yu', 'zhang_fei'].every(id => r.mates.some(m => m.indexOf(id + ':') === 0)), '다른 중국 술집에서 세 번째 — 세 형제가 함께 부하가 되었다 ' + r.mates.join(' '));

    // ---------------------------------------------------------------- 제갈량
    console.log('제갈량');
    await page.evaluate(() => { const s = G.Game.state, f = s.mates.find(m => m.role === 'first'); if (f) f.role = 'none'; s.mates.find(m => m.id === 'liu_bei').role = 'first'; });
    for (let i = 0; i < 2; i++) r = await visit(china[1], 'inn');
    ok(!r.mates.some(m => m.indexOf('zhuge_liang') === 0) && r.L.zhuge.inn === 2, '여관 두 번까지는 소식만');
    r = await visit(china[2] != null ? china[2] : china[0], 'inn');
    ok(r.mates.some(m => m.indexOf('zhuge_liang') === 0), '유비를 부관으로 두고 여관 세 번째 — 제갈량이 부하가 되기를 청했다');

    // ---------------------------------------------------------------- 달타냥·삼총사
    console.log('달타냥 · 삼총사');
    const paris = 14, g0 = await page.evaluate(() => G.Game.state.player.gold);
    r = await visit(paris, 'market', 'buy3');
    ok(r.mates.some(m => m.indexOf('d_artagnan') === 0), '파리 시장에서 물건 셋을 사고 돈을 빌려주니 달타냥이 부하가 되었다');
    ok(r.L.dart.lent === 2000, '금화 2000닢을 빌려주었다');
    await page.evaluate(() => { window._duel = 'lose'; window._pick = 2; window._asks.length = 0; });
    r = await visit(paris, 'tavern');
    ok(!(await page.evaluate(() => _asks.some(a => a[0] === 'duel' && /아토스|포르토스|아라미스/.test(a[1])))), '달타냥을 만난 도시 술집에서는 결투가 없다');
    r = await visit(15, 'tavern');
    let duels = await page.evaluate(() => _asks.filter(a => a[0] === 'duel' && /아토스|포르토스|아라미스/.test(a[1])));
    ok(duels.length === 1 && duels[0][1] === '아토스' && duels[0][2] === 'd_artagnan', '새 도시(루앙) 술집: 아토스가 결투를 건다 — 달타냥이 나섰다');
    ok(!r.mates.some(m => m.indexOf('athos') === 0), '지면 부하가 되지 않는다');
    await page.evaluate(() => { window._duel = 'win'; window._pick = 1; });
    for (const cid of [18, 20, 21]) r = await visit(cid, 'tavern');
    duels = await page.evaluate(() => _asks.filter(a => a[0] === 'duel' && /아토스|포르토스|아라미스/.test(a[1])).map(a => a[1] + '/' + a[2]));
    ok(['athos', 'porthos', 'aramis'].every(id => r.mates.some(m => m.indexOf(id + ':') === 0)), '새 도시 술집마다 한 사람씩 이겨 삼총사 모두 부하 ' + duels.join(' '));
    console.log('    ' + JSON.stringify(await page.evaluate(() => ({ m: G.Game.state.mates.map(x => x.id), musk: G.Game.state.legend.musk, gone: Object.keys(G.Game.state.flags).filter(k => /gone_/.test(k)) }))));
    await page.evaluate(() => { window._logSay = 1; });
    r = await visit(22, 'tavern');
    ok((await page.evaluate(() => _asks.filter(a => a[0] === 'duel' && /아토스|포르토스|아라미스/.test(a[1])).length)) === 4, '삼총사를 다 맞은 뒤에는 결투가 없다');

    // ---------------------------------------------------------------- 셰헤라자드
    console.log('셰헤라자드');
    const lib = await page.evaluate(() => {
      const s = G.Game.state; s.player.lang = G.LANGS.map(() => 3); s.player.skills = Object.assign(s.player.skills || {}, { hist: 3, sci: 3, theo: 3, survey: 3, nav: 3, med: 3, acct: 3 });
      const LB = G.Scenes.city.B.library;
      return G.CITY_DATA.filter(c => G.Legend.isIslam(c) && G.R.cityExists(c) && G.R.facilities(c).library).map(c => ({ id: c.id, name: c.name, open: LB.shelfBooks(c).filter(b => LB.shelfState(b).kind !== 'lock').length }));
    });
    const lc = lib.filter(x => x.open >= 5)[0];
    console.log('    이슬람 도시 도서관: ' + lib.map(x => x.name + ' ' + x.open).join(', '));
    if (lc) {
      r = await page.evaluate(async (cid) => {
        const C = G.Scenes.city, s = G.Game.state; await window._enter(cid, 'library');
        const c = G.CITY_DATA[cid], LB = C.B.library, books = LB.shelfBooks(c).filter(b => LB.shelfState(b).kind !== 'lock').slice(0, 5);
        G.UI.talk = async () => {};
        for (const b of books) await LB.pick(c, b);
        await C.leave();
        return { mates: s.mates.map(m => m.id + ':' + m.role) };
      }, lc.id);
    } else {
      r = await page.evaluate(async (cid) => { const C = G.Scenes.city, s = G.Game.state; await window._enter(cid, 'library'); for (let i = 0; i < 5; i++) await G.Legend._t.bookRead(G.CITY_DATA[cid]); await C.leave(); return { mates: s.mates.map(m => m.id + ':' + m.role) }; }, lib[0].id);
    }
    ok(r.mates.some(m => m.indexOf('scheherazade') === 0), '이슬람 도서관에서 책 다섯 권을 읽으니 셰헤라자드가 부하가 되었다' + (lc ? ' (' + lc.name + ' — 서가에서 실제로 읽음)' : ' (읽을 책이 모자라 셈만)'));
    const lgs = await page.evaluate(() => G.MATE.scheherazade.lg);
    ok([0, 1, 2, 3, 4, 5, 6, 10].every(k => lgs[k] === 3), '셰헤라자드는 유럽 말·아랍어·페르시아어·아프리카 말에 능숙');

    // ---------------------------------------------------------------- 알라딘·알리바바
    console.log('알라딘 · 알리바바');
    const ott = await page.evaluate(() => G.CITY_DATA.filter(c => G.Legend.isOttoman(c) && G.R.cityExists(c)).map(c => c.id));
    await page.evaluate((o) => { const s = G.Game.state; G.R.invest(o[0]).amt = 150000; G.R.invest(o[1]).amt = 150000; }, ott);
    r = await visit(ott[0], 'trade');
    ok(!r.mates.some(m => /aladdin|ali_baba/.test(m)), '셰헤라자드가 통역이 아니면 만나지 않는다');
    await page.evaluate(() => { const s = G.Game.state, f = s.mates.find(m => m.role === 'interp'); if (f) f.role = 'none'; s.mates.find(m => m.id === 'scheherazade').role = 'interp'; });
    r = await visit(ott[0], 'trade');
    ok(r.mates.some(m => m.indexOf('aladdin') === 0) && !r.mates.some(m => m.indexOf('ali_baba') === 0), '오스만 교역소 출자 5등급 + 셰헤라자드 통역 → 알라딘');
    r = await visit(ott[0], 'trade');
    ok(!r.mates.some(m => m.indexOf('ali_baba') === 0), '같은 도시에서는 알리바바를 만나지 않는다');
    r = await visit(ott[1], 'trade');
    ok(r.mates.some(m => m.indexOf('ali_baba') === 0), '다른 오스만 도시 교역소에서 알리바바');

    // ---------------------------------------------------------------- 장면 한 장: 무릎상 둘이 마주 선다
    await page.evaluate(() => { window._shot = 1; });
    const shot = await page.evaluate(async () => {
      G.Game.go('city', { cityId: 14 }); await new Promise(r => setTimeout(r, 600));
      const p = G.UI.say('장면 시험 — 모두는 하나를 위하여!', G.Legend.speaker('d_artagnan'));
      await new Promise(r => setTimeout(r, 1500));
      return { tall: document.querySelectorAll('.dlg-actor.tall').length };
    });
    await page.screenshot({ path: path.join(OUT, 'dartagnan.png') });
    ok(shot.tall === 2, '달타냥이 제독과 마주 선 무릎상 둘로 말한다');
    await page.keyboard.press('Enter'); await page.waitForTimeout(800);
    const shot2 = await page.evaluate(async () => {
      const S = G.Game.state; S.loc = Object.assign({}, S.loc, { mode: 'land', lon: 115.97, lat: 39.49 });
      G.UI.say('탁군 들판에서 — 한날한시에 죽기를 바라노라!', G.Legend.speaker('liu_bei'));
      await new Promise(r => setTimeout(r, 1500));
      return { tall: document.querySelectorAll('.dlg-actor.tall').length, bust: document.querySelectorAll('.dlg-actor.bust').length };
    });
    await page.screenshot({ path: path.join(OUT, 'liubei_land.png') });
    ok(shot2.tall === 2 && !shot2.bust, '뭍(탁군)에서도 사건이라 얼굴 대신 무릎상 둘 (' + JSON.stringify(shot2) + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 그림: ' + OUT);
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
    await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {});
    console.log(JSON.stringify(await page.evaluate(() => ({ asks: (window._asks || []).slice(-8), say: (window._say || []).slice(-10) })).catch(() => ({}))));
  } finally { await browser.close(); }
})();
