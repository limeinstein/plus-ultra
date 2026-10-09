/* 경쟁 탐험가의 발견 경쟁 점검 (js/data/rivals.js):
   ① 자료 — 새로 경쟁하는 34곳에 d.rival, 경쟁자마다 머무는 도시·카드·대사(계획·발표·졌을 때), 탐험 함대 항로는 바다 위
   ② 차례 — 발표 12달 전 「떠날 채비」 소문 + 단서 → 발표 달: 경쟁자의 발견(st.rival), 단서는 지워지고 제독은 찾을 수 없다
   ③ 늦은 보고 — 먼저 찾고 늦게 알리면 명성과 사례금이 절반
   ④ 동료와 같은 사람(베스푸치 등)은 다툴 발견이 남은 동안 고용할 수 없고, 끝나면 항해사로 돌아온다
   ⑤ 술집 — 베르겐의 피닝(명부·카드·계획·단서), 바다 — 탐험 함대에 신호를 보내면 그 사람의 말
   node tests/rival_race_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'rival_race_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  async function advance(n) { for (let i = 0; i < (n || 1); i++) { await page.waitForTimeout(300); await page.keyboard.press('Enter'); } }
  async function choose(label) { await page.locator('.askrow button', { hasText: label }).first().click(); await page.waitForTimeout(350); }
  const bodyText = () => page.evaluate(() => [...document.querySelectorAll('.dlg .body')].map(e => e.innerText).join(' | '));
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm', { timeout: 30000 });
    await page.fill('#nm', '이강희');   // 시험 캐릭터 — 엔터로 바로 시작
    await page.evaluate(() => { G.Scenes.city.prologue = async function () { G.Game.state.flags.prologue = true; }; });
    await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.player, null, { timeout: 90000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => G.Game.ensureGeo && G.Game.ensureGeo());

    // ① 자료
    const d1 = await page.evaluate(() => {
      const out = { plan: 0, noDisc: [], had: [], people: [], missStay: [], missLine: [], badStay: [], landPts: [], whoBad: [], voy: 0 };
      Object.keys(G.RIVAL_PLAN).forEach(id => { const d = G.DISC[id]; if (!d) out.noDisc.push(id); else if (d.rival[2] !== G.RIVAL_PLAN[id][2]) out.had.push(id); else out.plan++; });
      const names = {}; G.DISCOVERIES.forEach(d => { if (d.rival) (names[d.rival[2]] = names[d.rival[2]] || []).push(d.id); });
      Object.keys(names).forEach(nm => {
        if (nm === '포르투갈 상인') return;
        const r = G.RIVAL_STAYS[nm]; out.people.push(nm);
        if (!r) { out.missStay.push(nm); return; }
        names[nm].forEach(id => { if (!(r.plan || {})[id] || !(r.done || {})[id]) out.missLine.push(nm + ':' + id); });
        ['keeper', 'away', 'intro', 'hire', 'dream'].forEach(k => { if (!r[k]) out.missLine.push(nm + ':' + k); });
        if (!r.beaten) out.missLine.push(nm + ':beaten');
        const card = G.Scenes.city.B.tavern.rivalCard(nm);
        if (!card.st.length || !Object.keys(card.sk).length || !Object.keys(card.lg).length) out.missLine.push(nm + ':card');
        // 머무는 해마다 그 도시가 있다 (발표 달에 머무는 곳이 있으면 그 도시에서 발표)
        r.stays.forEach(a => { const c = G.CITY_DATA[a[2]]; for (let y = a[0]; y < a[1]; y++) if (!c || !G.R.cityExists(c, { y: y, m: 6, d: 1 })) { out.badStay.push(nm + ' ' + y + ' ' + (c && c.name)); break; } });
      });
      G.EXPEDITIONS.forEach(ex => {
        out.voy++;
        if (!G.RIVAL_STAYS[ex.who]) out.whoBad.push(ex.id + ':' + ex.who);
        const d = G.DISC[ex.discs[0]]; if (!d || !d.rival || d.rival[2] !== ex.who) out.whoBad.push(ex.id + '→' + ex.discs[0]);
        // 배가 다닐 수 있는 칸인가 (뱃길 찾기의 가장 가까운 바다가 제자리)
        ex.pts.forEach((p, i) => { const ns = G.Nav.nearestSea(p[1], p[0], 3); if (!ns || Math.hypot(ns[0] - p[1], ns[1] - p[0]) > 0.15) out.landPts.push(ex.id + '#' + i + ' (' + p[0] + ',' + p[1] + ')'); });
      });
      return out;
    });
    ok(d1.plan === 34 && !d1.noDisc.length && !d1.had.length, '새로 경쟁하는 발견물 34곳 모두 d.rival (' + d1.noDisc.concat(d1.had).join(',') + ')');
    ok(d1.people.length >= 40 && !d1.missStay.length, '경쟁자 ' + d1.people.length + '명 모두 머무는 도시·대사 자료 (' + d1.missStay.join(',') + ')');
    ok(!d1.missLine.length, '사람마다 주인 귀띔·소개·거절·꿈·졌을 때, 발견물마다 계획·발표 대사와 카드 (' + d1.missLine.join(', ') + ')');
    ok(!d1.badStay.length, '머무는 해에 그 도시가 있다 (' + d1.badStay.join(', ') + ')');
    ok(!d1.whoBad.length, '탐험 함대 ' + d1.voy + '개 — 이끄는 사람과 대표 발견물의 경쟁자가 같다 (' + d1.whoBad.join(', ') + ')');
    console.log('    뭍에 걸린 항로 점: ' + (d1.landPts.length ? d1.landPts.join(' · ') : '없음'));
    ok(!d1.landPts.length, '항로 점은 모두 배가 다닐 수 있는 바다');

    // ② 차례: 발표 12달 전 소문 + 단서 → 발표 달에 경쟁자의 발견, 단서 지움, 찾을 수 없음
    const d2 = await page.evaluate(() => {
      const s = G.Game.state, out = { prep: [], noPrep: [], took: [], notTook: [], findBlocked: true, seaHit: false, landHit: false };
      const ids = Object.keys(G.RIVAL_PLAN);
      ids.forEach(id => {
        const d = G.DISC[id], ry = d.rival[0], rm = d.rival[1];
        delete s.disc[id]; delete s.hints[id]; delete s.flags['prep_' + id]; delete s.flags['warn_' + id];
        let m = rm - 11, y = ry; while (m < 1) { m += 12; y--; }
        s.date = { y: y, m: m, d: 2 };
        const msgs = G.Disc.rivals();
        const pm = msgs.filter(x => x.text.indexOf('「' + d.name + '」') >= 0 && /떠날 채비/.test(x.text));
        (pm.length && s.hints[id] ? out.prep : out.noPrep).push(id);
        s.date = { y: ry, m: rm, d: 1 };
        G.Disc.rivals();
        const st = s.disc[id];
        (st && st.rival === d.rival[2] && !s.hints[id] && G.Disc.taken(id) && !G.Disc.available(d) ? out.took : out.notTook).push(id);
      });
      // 찾을 수 없다: 바다·뭍 검사에 걸리지 않고, D.find도 거절
      const sea = G.DISC.maelstrom, land = G.DISC.mandrill;
      out.seaHit = G.Disc.checkSea(sea.lon, sea.lat).some(x => x.id === 'maelstrom');
      out.landHit = G.Disc.checkLand(land.lon, land.lat).hits.some(x => x.id === 'mandrill');
      return out;
    });
    ok(!d2.noPrep.length, '발표 12달 전: 「떠날 채비」 소문과 함께 단서 — ' + d2.prep.length + '곳 (' + d2.noPrep.join(',') + ')');
    ok(!d2.notTook.length, '발표 달: 경쟁자의 발견이 되고, 단서는 지워지고, 이제 찾을 수 없다 — ' + d2.took.length + '곳 (' + d2.notTook.join(',') + ')');
    ok(!d2.seaHit && !d2.landHit, '경쟁자가 발표한 뒤에는 바다(모스켄 소용돌이)·뭍(인면수)에서 가까이 가도 발견되지 않는다');
    const blocked = await page.evaluate(async () => { const r = await G.Disc.find(G.DISC.maelstrom, 'sea'); return { r, me: !!G.Game.state.disc.maelstrom.me }; });
    ok(blocked.r === false && !blocked.me, 'D.find도 거절 — 「이미 디드리크 피닝이 발표했다」');

    // ③ 늦은 보고: 먼저 찾아 두고 알리지 않았는데 경쟁자가 발표 → 명성·사례금 절반
    const d3 = await page.evaluate(async () => {
      const s = G.Game.state, d = G.DISC.benin, sp = G.SPONSORS.filter(x => x.city === 0)[0] || G.SPONSORS[0];
      const UI = G.UI, keep = { say: UI.say, alert: UI.alert, ask: UI.ask, choose: UI.choose };
      UI.say = async () => {}; UI.alert = async () => {}; UI.ask = async () => null; UI.choose = async () => null;
      const fakes = G.Fakes && G.Fakes.choose; if (G.Fakes) G.Fakes.choose = async () => 'real';
      const names = G.Names && G.Names.onReport; if (G.Names) G.Names.onReport = async () => {};
      function report(late) {
        delete s.disc.benin; s.date = { y: 1485, m: 6, d: 1 };
        s.disc.benin = late ? { me: true, found: 14850601, rival: d.rival[2], late: true } : { me: true, found: 14850601 };
        const g0 = s.player.gold, f0 = s.player.fame;
        return G.Sponsor.lateReport(sp, d, 1).then(() => ({ gold: s.player.gold - g0, fame: s.player.fame - f0 }));
      }
      const onTime = await report(false), late = await report(true);
      Object.assign(UI, keep); if (G.Fakes) G.Fakes.choose = fakes; if (G.Names) G.Names.onReport = names;
      return { onTime, late, isLate: G.Disc.isLate('benin') };
    });
    console.log('    제때 보고: 금화 +' + d3.onTime.gold + ' 명성 +' + d3.onTime.fame + ' / 늦은 보고: 금화 +' + d3.late.gold + ' 명성 +' + d3.late.fame);
    ok(d3.isLate && d3.late.gold > 0 && d3.late.gold <= Math.round(d3.onTime.gold * 0.5) + 100, '늦은 보고 사례금은 절반 (' + d3.late.gold + ' ≤ ' + d3.onTime.gold + '÷2)');
    ok(d3.late.fame > 0 && d3.late.fame < d3.onTime.fame * 0.7, '늦은 보고 명성도 절반쯤 (' + d3.late.fame + ' / ' + d3.onTime.fame + ')');

    // ④ 동료와 같은 사람: 다툴 발견이 남았으면 고용 불가 → 끝나면 항해사로
    const d4 = await page.evaluate(() => {
      const s = G.Game.state, v = G.MATES.filter(m => m.id === 'vespucci')[0], T = G.Scenes.city.B.tavern;
      delete s.disc.joatinga; s.date = { y: 1495, m: 6, d: 1 };
      const busy = !G.Frontier.mateReady(v, 1495), inSevilla = T.hireList(G.CITY_DATA[7]).some(m => m.rival === v.name);
      s.disc.joatinga = { rival: v.name, found: 15020901 };
      s.date = { y: 1503, m: 6, d: 1 };
      const free = G.Frontier.mateReady(v, 1503), rivalInLisbon = T.hireList(G.CITY_DATA[0]).some(m => m.rival === v.name);
      return { busy, inSevilla, free, rivalInLisbon };
    });
    ok(d4.busy && d4.inSevilla, '1495년: 베스푸치는 주아팅가 해안을 다투는 중 — 고용할 수 없고 세비야 명부에 「경쟁자」로');
    ok(d4.free && !d4.rivalInLisbon, '1503년: 다툼이 끝나 다시 고용할 수 있는 항해사 (경쟁자 카드는 없다)');

    // ⑤ 술집: 1481년 베르겐 — 피닝이 명부에, 계획을 듣고 단서를 얻는다
    const d5 = await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA[68];
      delete s.disc.maelstrom; delete s.hints.maelstrom; s.date = { y: 1481, m: 3, d: 1 };
      s.loc = { mode: 'city', city: 68, lon: c.lon, lat: c.lat };
      return G.Scenes.city.B.tavern.hireList(c).map(m => m.name + (m.rival ? '(경쟁자)' : ''));
    });
    ok(d5.includes('디드리크 피닝(경쟁자)'), '1481년 베르겐 술집 명부: ' + d5.join(', '));
    await page.evaluate(() => { G.Scenes.city.B.tavern.rivalTalk(G.CITY_DATA[68], '디드리크 피닝').catch(e => console.error(e)); });
    await page.waitForTimeout(1200);
    let t = await bodyText();
    ok(/힐데스하임/.test(t), '첫 만남: 「힐데스하임에서 태어나 덴마크 왕의 칼이 된 사람」');
    await page.screenshot({ path: path.join(OUT, '1_pining_intro.png') });
    await advance(); await page.waitForTimeout(500);
    await choose('부하로 고용한다');
    t = await bodyText();
    ok(/깃발을 꽂는 사람/.test(t), '고용 → 거절: 「깃발을 꽂는 사람이다」');
    await advance(); await page.waitForTimeout(500);
    await choose('정보를 듣는다');
    t = await bodyText();
    ok(/모스켄/.test(t) && /베르겐/.test(t), '계획: 로포텐 모스켄의 소용돌이 — 여름이 끝나기 전에 베르겐에서');
    await page.screenshot({ path: path.join(OUT, '2_pining_plan.png') });
    await advance(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => !!G.Game.state.hints.maelstrom), '모스켄 소용돌이 단서를 얻었다 (발표 17달 전 — 36달 안)');
    await advance(); await page.waitForTimeout(400);
    await choose('떠난다');

    // 바다: 1482년 7월 피닝의 함대 — 신호를 보내면 그 사람의 말
    const d6 = await page.evaluate(async () => {
      const s = G.Game.state; s.date = { y: 1482, m: 7, d: 5 };
      const ex = G.SeaFolk.voyages().filter(e => e.id === 'pining')[0];
      const p = ex && G.SeaFolk.posAt(ex, G.U.dayIndex(s.date));
      const said = []; const keep = G.UI.say; G.UI.say = async (x) => { said.push(x); };
      if (ex) await G.SeaFolk.talk({ exp: ex }, { name: ex.who });
      G.UI.say = keep;
      const busy = G.SeaFolk.atSeaName('디드리크 피닝');
      return { ok: !!ex, p, said, busy };
    });
    ok(d6.ok && d6.p && Math.abs(d6.p.lat - 67.7) < 1.5, '1482년 7월 5일: 피닝의 탐험 함대가 로포텐 앞바다에 (북위 ' + (d6.p ? d6.p.lat.toFixed(1) : '?') + ')');
    ok(d6.said.some(x => /소용돌이에 처넣어/.test(x)), '신호를 보내면 피닝의 말: 「길을 막으면 네놈부터 소용돌이에 처넣어 주마」');
    ok(d6.busy, '바다에 나가 있는 동안은 베르겐 술집에 없다');

    // 경쟁자마다 탐험 함대가 바다에 뜨는 때 (사람 수만 센다)
    const d7 = await page.evaluate(() => {
      const s = G.Game.state, seen = {};
      G.EXPEDITIONS.forEach(ex => { const sp = G.SeaFolk.span(ex), mid = Math.floor((sp[0] + sp[1]) / 2); if (G.SeaFolk.posAt(ex, mid)) seen[ex.who] = 1; });
      return Object.keys(seen).length;
    });
    ok(d7 >= 34, '탐험 함대가 바다에서 보이는 경쟁자 ' + d7 + '명');
    // 초상: 경쟁자마다 전용 얼굴·무릎상(portraits/rivals) 또는 같은 사람의 동료 그림
    const d8 = await page.evaluate(() => {
      const K = G.Img.chain, out = { face: [], half: [], none: [] };
      Object.keys(G.RIVAL_STAYS).forEach(nm => {
        const f = G.Img.pick(K.rival(nm)), h = G.Img.pick(K.rivalHalf(nm));
        if (f) out.face.push(nm); if (h) out.half.push(nm); if (!f || !h) out.none.push(nm);
      });
      return out;
    });
    console.log('    그림이 아직 없는 경쟁자: ' + (d8.none.join(', ') || '없음'));
    ok(d8.none.length === 0 && d8.face.length === 42 && d8.half.length === 42, '경쟁자 42명이 모두 얼굴·무릎상을 가진다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join('\n'));
    console.log('OK');
  } catch (e) {
    console.error('FAIL:', e.message);
    await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {});
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
