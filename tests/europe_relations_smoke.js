/* 유럽 정세 · 레오나르도 · 튜더 왕실 점검 (js/systems/relations.js · leonardo.js · tudor.js) — node tests/europe_relations_smoke.js   (BROWSER_EXE=크롬 경로)
   · 나라 사이의 관계: 1500년 프랑스·에스파냐 전쟁, 포르투갈·에스파냐 우호 — 에스파냐 제독은 파리 교역소에서 거래할 수 없고, 프랑스 군함이 덤빈다(악명 없음)
   · 역사 사건: 왕녀가 직접 혼례 소식을 전하고 예물을 청한다 · 교황의 사절이 십자군 기부를 청한다 · 레판토 해전에 우리 편 함대와 함께
   · 레오나르도: 밀라노 공작을 만나기 전에는 만날 수 없다 · 밤샘 이야기 뒤 배에 태우면 생일마다 발명품 · 태우지 않으면 신뢰 100에 하나, 두 해마다 하나
   · 헨리 8세의 이혼: 특사를 로마로 → 교황의 거절 → 이혼 선언, 잉글랜드·교황청/에스파냐 파국
   · 런던 탑의 엘리자베스 → 요크로 피신 → 여왕이 되자 잉글랜드 기사 → 두 해 뒤 드레이크와 무적함대. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'europe_relations');
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
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {}, UI = G.UI, RL = G.Rel, SP = G.Sponsor;
      const fresh = (nation, y, m, d) => { const s = G.State.newGame({ name: '시험', nation, job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' }); G.Game.state = s; s.date = { y, m, d }; s.player.gold = 100000; return s; };
      const said = []; let answer = null;
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); }; UI.alert = async (t) => { said.push(String(t)); return true; }; UI.toast = () => {}; UI.confirm = async () => true;
      UI.ask = async (t, opts) => { const v = answer ? answer(t, opts) : opts[0].value; return v; };
      UI.fade = async (fn) => { fn && fn(); };
      G.Game.refreshHud = () => {}; G.State.save = () => {};
      const city = n => G.CITY_DATA.filter(c => c.name === n)[0];

      // 1) 관계와 교역·바다
      let s = fresh('ES', 1500, 6, 1); RL.daily();
      out.feES = RL.get('FR', 'ES').tier; out.ptES = RL.get('PT', 'ES').tier; out.enES = RL.get('EN', 'ES').tier;
      out.embParis = RL.embargo(city('파리')); out.embLis = RL.embargo(city('리스본'));
      out.kLis = [RL.priceK(city('리스본'), 'buy'), RL.priceK(city('리스본'), 'sell')];
      said.length = 0; await G.Scenes.city.B.trade.buy(city('파리')); out.refuse = said.join(' ').slice(0, 80);
      const nav = { kind: 'navy', nation: '프랑스', n: 2, lon: 0, lat: 46, zone: 'atl' }; G.SeaFolk.decorate(nav, []);
      out.navy = [nav.hostile, nav.war, G.Court.lawful(nav)];
      // 2) 왕녀의 혼례 소식 (1497) · 교황의 사절 (1480)
      s = fresh('PT', 1497, 9, 29); RL.daily(); s.date = { y: 1497, m: 9, d: 30 }; const g0 = s.player.gold, so0 = G.Fame.sync().so;
      RL.daily(); out.pend97 = s.rel.pend.slice(); said.length = 0; await RL.present();
      out.wed = { said: said.slice(0, 2).join(' | ').slice(0, 160), gold: g0 - s.player.gold, so: G.Fame.sync().so - so0, ptes: RL.get('PT', 'ES').v };
      s = fresh('PT', 1480, 8, 10); RL.daily(); s.date = { y: 1480, m: 8, d: 11 }; RL.daily(); said.length = 0; await RL.present();
      out.legate = said[0] && said[0].slice(0, 40); out.popeTrust = s.sponsors.it_pope && s.sponsors.it_pope.trust;
      // 3) 레판토: 신성 동맹 → 그 바다로 가면 우리 편 함대와 함께
      s = fresh('ES', 1571, 5, 24); RL.daily(); s.date = { y: 1571, m: 5, d: 25 }; RL.daily(); await RL.present();
      s.date = { y: 1571, m: 9, d: 30 }; s.loc = { mode: 'sea', lon: 21.0, lat: 38.3, heading: 0 };
      out.lepPending = RL.pending();
      let started = null; const go = G.Game.go; G.Game.go = (sc, arg) => { started = { sc, allies: arg.npc.allies.length, n: arg.npc.n, great: arg.npc.great }; };
      answer = (t, o) => o[0].value; await RL.present(); G.Game.go = go;
      out.lepanto = started;
      const lines = []; const f0 = s.player.fameBy.bt; RL.afterBattle({ great: 'lepanto' }, 'win', lines); out.lepWin = [s.rel.battle.lepanto, s.player.fameBy.bt - f0, lines[0] && lines[0].slice(0, 30)];
      // 4) 레오나르도
      s = fresh('PT', 1495, 3, 1); const leo = G.SPONSOR.it_leonardo;
      out.leoBlocked = await SP.audience(leo);
      out.leoTavern = G.MateMove.here(G.MATES.filter(m => m.id === 'leonardo')[0] ? 26 : 26).some(m => m.id === 'leonardo');
      s.sponsors.it_moro = { trust: 20, met: 1 };
      answer = (t, o) => o[0].value; await G.Leo.nightTalk();
      out.leoJoined = s.mates.some(m => m.id === 'leonardo') && !SP.present(leo);
      s.date = { y: 1495, m: 3, d: 2 }; G.Leo.daily(); await G.Leo.present();
      out.leoBday = s.player.items.filter(it => /^leo_/.test(it.id)).map(it => G.R.itemName(it));
      s = fresh('PT', 1495, 3, 1); s.sponsors.it_moro = { trust: 20, met: 1 };
      answer = (t, o) => o[o.length - 1].value; await G.Leo.nightTalk(); answer = null;
      s.sponsors.it_leonardo = { trust: 100, met: 2 }; G.Leo.daily(); await G.Leo.present();
      const n1 = s.player.items.filter(it => /^leo_/.test(it.id)).length; s.day += 731; G.Leo.daily(); await G.Leo.present();
      out.leoTrust = [s.mates.some(m => m.id === 'leonardo'), n1, s.player.items.filter(it => /^leo_/.test(it.id)).length, G.Court.palaceItems(leo).some(x => /함께 항해/.test(x.label))];
      // 5) 헨리 8세의 이혼
      s = fresh('PT', 1528, 4, 1); RL.daily(); s.sponsors.en_king = { trust: 50, met: 2 };
      const king = G.SPONSOR.en_king, pope = G.SPONSOR.it_pope;
      answer = (t, o) => o[0].value; await G.Court.onEnter(king); out.div1 = s.tudor.div.stage;
      const it = G.Court.palaceItems(pope).filter(x => /특사/.test(x.label))[0]; out.popeItem = !!it; if (it) await it.onClick(); out.div2 = s.tudor.div.stage;
      await G.Court.onEnter(king); out.div3 = s.tudor.div.stage; out.enpa = RL.get('EN', 'PA'); out.enes = RL.get('EN', 'ES').v;
      RL.daily(); out.taskHtml = G.Court.taskHtml().length;
      // 6) 런던 탑 → 피신 → 기사 → 무적함대
      s = fresh('PT', 1554, 3, 10); s.sponsors.en_king = { trust: 50, met: 1 };
      out.towerBld = G.Scenes.city.buildings(city('런던')).some(b => b.kind === 'tower');
      const york = city('요크').id; answer = (t, o) => (o.filter(x => x.value === york)[0] || o[0]).value; await G.Tudor.meetEliz(); answer = null;
      out.eliz1 = s.tudor.eliz.stage; s.loc = { mode: 'city', city: york, lon: 0, lat: 0 }; out.elizPend = G.Tudor.pending(); await G.Tudor.check(); out.eliz2 = s.tudor.eliz.stage;
      s.date = { y: 1559, m: 2, d: 1 }; await G.Court.onEnter(king); out.knight = [!!s.tudor.knight, G.Court.title(G.COURT.realms.EN).ko];
      // 드레이크의 습격 세 번 (두 해마다) — ① 이기고 ② 지고 ③ 물러난다
      let ar = null; G.Game.go = (sc, arg) => { ar = arg.npc; };
      out.raids = [];
      for (let k = 0; k < 3; k++) {
        s.loc = { mode: 'sea', lon: -40, lat: 30, heading: 0 };
        s.day += 731; const nw = G.Tudor.daily(); const rd = G.Tudor.RAIDS[k]; const call = s.tudor.drake.call; const pendFar = G.Tudor.pending();
        s.loc = { mode: 'sea', lon: (rd.box[0] + rd.box[1]) / 2, lat: (rd.box[2] + rd.box[3]) / 2, heading: 0 }; const pend = G.Tudor.pending();
        ar = null; answer = (t, o) => (k === 2 ? o[o.length - 1] : o[0]).value; await G.Tudor.check(); answer = null;
        if (ar) RL.afterBattle(ar, k === 0 ? 'win' : 'lose', []);
        out.raids.push({ call, news: nw.length, pendFar, pend, n: ar && ar.n, allies: ar && ar.allies.length, gun: ar && ar.gun, myGun: ar && ar.myGun, res: s.tudor.drake.res[k], done: s.tudor.drake.done, armada: s.tudor.armada || null });
      }
      s.loc = { mode: 'sea', lon: -40, lat: 30, heading: 0 };
      s.day += 731; const news = G.Tudor.daily(); out.armadaCall = s.tudor.armada; out.armadaNews = news.length;
      s.loc = { mode: 'sea', lon: -1.5, lat: 50.3, heading: 0 }; out.armadaPend = G.Tudor.pending();
      ar = null; answer = (t, o) => o[0].value; await G.Tudor.check(); G.Game.go = go; answer = null;
      out.armada = ar && { n: ar.n, allies: ar.allies.map(a => a.name), allyGun: ar.allies.map(a => a.gun), great: ar.great, gun: ar.gun, myGun: ar.myGun };
      RL.afterBattle({ great: 'armada' }, 'win', []); out.armadaWin = [s.tudor.armada, G.Court.title(G.COURT.realms.EN).ko];
      return out;
    });
    console.log(JSON.stringify(r).slice(0, 2500));
    ok(r.feES === 'war' && /ally|friend/.test(r.ptES) && /ally|friend/.test(r.enES), '1500년: 프랑스·에스파냐 ' + r.feES + ' · 포르투갈·에스파냐 ' + r.ptES + ' · 잉글랜드·에스파냐 ' + r.enES);
    ok(r.embParis && !r.embLis && r.kLis[0] < 1 && r.kLis[1] > 1 && /전쟁/.test(r.refuse), '에스파냐 제독: 파리 교역소는 문을 닫고(' + r.refuse.slice(0, 30) + '…), 리스본은 ' + Math.round((1 - r.kLis[0]) * 100) + '% 이득');
    ok(r.navy[0] && r.navy[1] && r.navy[2], '전쟁 중인 프랑스 군함은 덤비고, 쳐도 악명이 오르지 않는다');
    ok(r.pend97.includes('ib_wed1497') && /이사벨/.test(r.wed.said) && r.wed.gold === 1500 && r.wed.so > 0 && r.wed.ptes === 55, '이사벨 공주가 혼례 소식을 직접 전하고, 예물을 보내면 사교 명성 +' + r.wed.so + ' (포르투갈·에스파냐 ' + r.wed.ptes + ')');
    ok(/교황의 사절/.test(r.legate || '') && r.popeTrust > 20, '오트란토 함락 — 교황의 사절이 십자군 기부를 청한다 (교황 신뢰 ' + r.popeTrust + ')');
    ok(r.lepPending && r.lepanto && r.lepanto.allies === 6 && r.lepanto.n === 9 && r.lepWin[0] === 'won' && r.lepWin[1] > 0, '레판토: 그 바다에 가면 신성 동맹 함대 6척(돈 후안·콜론나·베니에르·바르바리고·도리아·산타 크루스)과 함께 오스만 9척(알리 파샤의 술타나호 …)에 맞선다 → 이기면 전투 명성 +' + r.lepWin[1]);
    ok(r.leoBlocked === false && !r.leoTavern, '레오나르도: 밀라노 공작을 만나기 전에는 저택에 들 수 없고, 술집에도 없다');
    ok(r.leoJoined && r.leoBday.length === 1, '밤샘 이야기 뒤 배에 태우면 저택이 비고, 생일에 발명품 「' + r.leoBday[0] + '」');
    ok(!r.leoTrust[0] && r.leoTrust[1] === 1 && r.leoTrust[2] === 2 && r.leoTrust[3], '태우지 않으면 신뢰 100에 하나, 두 해 뒤에 또 하나 — 저택에서 다시 청할 수 있다');
    ok(r.div1 === 1 && r.popeItem && r.div2 === 2 && r.div3 === 3 && r.enpa.tier === 'war' && r.enpa.event && r.enes === -100, '헨리 8세의 이혼: 특사 → 교황의 거절 → 이혼 선언 — 잉글랜드·교황청 ' + r.enpa.v + ' · 잉글랜드·에스파냐 ' + r.enes);
    ok(r.towerBld && r.eliz1 === 1 && r.elizPend && r.eliz2 === 2, '메리 1세 시절 런던 탑 → 엘리자베스 공주를 요크로 피신');
    ok(r.knight[0] && r.knight[1] === '기사', '여왕이 된 엘리자베스가 기사로 임명');
    ok(r.raids.length === 3 && r.raids.every((x, i) => x.call === i + 1 && x.news === 1 && !x.pendFar && x.pend && x.done === i + 1 && !x.armada) &&
      r.raids[0].n === 5 && r.raids[0].allies === 3 && r.raids[0].gun === 'cannon' && r.raids[0].myGun === 'culverin' && r.raids[0].res === 'won' && r.raids[1].res === 'lost' && r.raids[2].res === 'declined' && !r.raids[2].n,
      '두 해마다 드레이크의 습격 세 번 (카디스 ' + r.raids[0].n + '척 이김 · 아조레스 ' + r.raids[1].n + '척 짐 · 카리브 물러남) — 무적함대는 아직');
    ok(r.armadaCall === 'call' && r.armadaPend && r.armada && r.armada.n === 12 && r.armada.allies.length === 3 && r.armada.allyGun.every(g => g === 'culverin') && r.armada.gun === 'cannon' && r.armada.myGun === 'culverin' && r.armadaWin[0] === 'won' && r.armadaWin[1] !== '기사',
      '그다음 두 해 뒤 해협: 우리 함대 + 드레이크 3척(' + r.armada.allies.join(', ') + ' · 캘버린포) 대 무적함대 12척(카논포) → 이겨 ' + r.armadaWin[1]);

    // 화면: 수첩의 유럽 정세 · 무적함대 해전 (우리 편 함대)
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s; s.date = { y: 1530, m: 6, d: 1 }; G.Rel.daily();
      G.Game.go('city', { cityId: 7 }); await new Promise(r => setTimeout(r, 2000));
      G.Info.open('politics');
    });
    await page.waitForSelector('.rel-tbl', { timeout: 15000 }); await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '1_politics.png') });
    const cells = await page.evaluate(() => document.querySelectorAll('.rel-tbl td').length);
    ok(cells > 100, '수첩 「유럽 정세」 표 (' + cells + '칸)');
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back .win-x, .modal-back .x, .modal-back .close')][0]; if (b) b.click(); document.querySelectorAll('.modal-back').forEach(m => m.remove()); });
    await page.evaluate(async () => {
      const s = G.Game.state; s.loc = { mode: 'sea', lon: -1.5, lat: 50.3, heading: 0 }; s.settings.res = 0.35;
      s.fleet.ships[0].guns = { type: 'saker', n: Math.max(1, s.fleet.ships[0].guns.n || 0) };
      const sp = G.Tudor.armadaSpec();
      G.Game.go('battle', { npc: { kind: 'navy', nation: '에스파냐', n: sp.ships.length, ships: sp.ships.slice(), K: 1, zone: 'atl', hostile: true, great: 'armada', label: sp.foeLabel,
        allies: sp.allies.map(a => ({ type: a.type, name: a.name, gun: a.gun })), gun: sp.gun, myGun: sp.myGun, gunK: sp.gunK, crewK: sp.crewK, gunNote: sp.gunNote } });
    });
    await page.waitForTimeout(3000);
    const bt = await page.evaluate(() => { const d = G.Scenes.battle.debug(); return d ? { list: d.ships.map(b => b.side + (b.ally ? ':ally' : '') + ':' + b.name).join(', '), me: d.ships.filter(b => b.side === 'me').map(b => b.guns.type), en: d.ships.filter(b => b.side === 'en').map(b => b.guns.type), mine: G.Game.state.fleet.ships[0].guns.type } : null; });
    await page.screenshot({ path: path.join(OUT, '2_armada.png') });
    ok(bt && /me:ally:리벤지호/.test(bt.list) && bt.en.length === 12 && bt.en.every(g => g === 'cannon') && bt.me.every(g => g === 'culverin') && bt.mine === 'saker',
      '무적함대 해전: 우리 ' + (bt && bt.me.length) + '척 모두 캘버린포 · 적 ' + (bt && bt.en.length) + '척 모두 카논포 · 내 배의 원래 대포(세이커포)는 그대로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) {
    try { await page.screenshot({ path: path.join(OUT, 'fail.png') }); } catch (e2) { /* 없음 */ }
    console.error('✗', e.message); if (errors.length) console.error(errors.slice(0, 5).join(' | ')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
