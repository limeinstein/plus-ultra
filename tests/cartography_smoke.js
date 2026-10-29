/* 지도 제작과 해도 보고 (js/systems/cartography.js) — node tests/cartography_smoke.js
   · 다시 지나갈수록 해도가 상세해진다(① 윤곽 ② 강 ③ 산 ④ 지형) · 지도 제작실·파수꾼이 있으면 빨리
   · 왕·학자 후원자에게 「해도 보고」 — 새로 그린 몫만큼, 상세할수록 더 · 저장/불러오기 · 옛 저장 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, C = G.Carto, ST = G.State, out = {};
      out.start = { rep: s.carto && s.carto.rep, pend: C.pending().units, value: C.value() };
      s.loc = { mode: 'sea', lon: -30, lat: 20, heading: 0 };
      // 한 줄로 지나간다: 서경 30° → 20° (북위 20°)
      function sail(lat, from, to, r) { s.chartLast = null; for (let x = from; from < to ? x <= to : x >= to; x += (from < to ? 0.25 : -0.25)) ST.surveyChart(x, lat, r || 1.2); s.chartLast = null; }
      sail(20, -30, -20);
      out.pass1 = { lv: ST.chartLevel(-25, 20), counts: C.counts().slice() };
      sail(20, -20, -30); out.pass2 = ST.chartLevel(-25, 20);
      sail(20, -30, -20); out.pass3 = ST.chartLevel(-25, 20);
      sail(20, -20, -30); sail(20, -30, -20); out.pass5 = ST.chartLevel(-25, 20);
      out.pend = C.pending().units;
      // 상세할수록 더: 같은 칸 수라도 ④ 지형까지면 ① 윤곽보다 훨씬 크다
      const king = G.SPONSOR.pt_king, sch = G.SPONSOR.pt_behaim;
      out.lvValue = { one: C.offer(king, { units: 1000 }).gold, detail: C.value(null, [0, 0, 0, 0, 1000]) / C.value(null, [0, 1000, 0, 0, 0]) };
      // 지도 제작 속도: 지도 제작실(힘 4) + 다른 배 파수꾼(측량 3)
      out.speed0 = C.speed();
      const CB = G.Cabins, pw = CB.power; CB.power = t => t === 'chart' ? 4 : t === 'lookout' ? 2 : 0;
      const sh2 = JSON.parse(JSON.stringify(s.fleet.ships[0])); sh2.uid = 'u_carto2'; sh2.name = '둘째'; s.fleet.ships.push(sh2);
      const surveyor = G.MATES.find(m => m.sk && m.sk.survey >= 3 && !m.eventOnly);
      s.mates.push({ id: surveyor.id, role: 'crew', ship: 'u_carto2', post: 'lookout', loyal: 80 });
      C.resetSpeed(); const sp = C.speedParts(); out.speed = { v: C.speed(), parts: sp };
      s.chartLast = null; sail(-10, -30, -20);
      out.fastLv = ST.chartLevel(-25, -10);
      CB.power = pw; C.resetSpeed();
      // 땅 위에서는 덧 기록이 없다
      // 보고: 왕
      const pend0 = C.pending(); const g0 = s.player.gold, f0 = s.player.fame;
      const say = G.UI.say, conf = G.UI.confirm, said = []; G.UI.say = async (t) => { said.push(t); }; G.UI.confirm = async (h) => { out.confirmHtml = h; return true; };
      out.menuKing = C.menuItem(king); out.menuMerchant = C.canHear(G.SPONSOR.pt_marchionni);
      const offerK = C.offer(king, pend0), offerS = C.offer(sch, pend0);
      await C.report(king);
      out.king = { gold: s.player.gold - g0, fame: s.player.fame - f0, offer: offerK, pendAfter: C.pending().units, n: s.carto.n };
      out.offerS = offerS;
      // 곧바로 다시: 새로 그린 몫이 없다
      const g1 = s.player.gold; await C.report(sch); out.again = s.player.gold - g1;
      // 학자에게: 새로 그린 몫 + 단서
      s.chartLast = null; sail(30, -40, -20); sail(30, -20, -40); sail(30, -40, -20);
      const h0 = Object.keys(s.hints).length, g2 = s.player.gold; await C.report(sch);
      out.scholar = { gold: s.player.gold - g2, clue: Object.keys(s.hints).length - h0 };
      G.UI.say = say; G.UI.confirm = conf;
      // 저장·불러오기
      const json = ST.serialize(); const back = ST.deserialize(json);
      out.save = { lv: (() => { const x = Math.floor((-25 + 180) * 2), y = Math.floor((90 - 20) * 2); return back.chartPasses[y * 720 + x]; })(), carto: back.carto && back.carto.rep === s.carto.rep, size: json.length };
      // 옛 저장: carto가 없으면 지금까지를 보고한 셈
      delete back.carto; out.old = { pend: C.pending(back).units, has: !!back.carto };
      out.status = C.statusHtml();
      return out;
    });
    console.log('   ' + JSON.stringify({ start: r.start, pass1: r.pass1.lv, pass2: r.pass2, pass3: r.pass3, pass5: r.pass5, speed: r.speed.v, fastLv: r.fastLv }));
    console.log('   왕: ' + JSON.stringify(r.king) + ' · 학자 제안: ' + JSON.stringify(r.offerS) + ' · 학자: ' + JSON.stringify(r.scholar));
    ok(r.start.rep === r.start.value && r.start.pend === 0, '새 게임: 처음부터 아는 바다는 보고할 거리가 아니다');
    ok(r.pass1.lv === 1 && r.pass2 === 2 && r.pass3 === 3 && r.pass5 === 4, '다시 지나갈수록 ① 윤곽 → ② 강 → ③ 산 → ④ 지형 (넘으면 4에서 멈춤)');
    ok(r.lvValue.detail === 7.5, '④ 지형까지 그린 칸은 ① 윤곽만 그린 칸의 7.5배 값어치');
    ok(r.speed0 === 0 && r.speed.v > 0.6 && Math.abs(r.speed.parts.ships - 0.15) < 1e-9 && r.fastLv >= 2, '지도 제작실·파수대·다른 배 파수꾼이 있으면 한 번 지나가도 더 상세 (속도 +' + Math.round(r.speed.v * 100) + '%, 한 번에 단계 ' + r.fastLv + ')');
    ok(r.menuKing && !r.menuKing.dim && /해도 보고/.test(r.menuKing.label) && !r.menuMerchant, '왕·학자 후원자에게만 「해도 보고」 (상인은 없음)');
    ok(r.king.gold === r.king.offer.gold && r.king.gold > 0 && r.king.fame > 0 && r.king.pendAfter === 0 && r.king.n === 1, '왕에게 보고: 금화 ' + r.king.gold + ' · 명성 +' + r.king.fame + ', 보고한 몫은 다시 받지 않는다');
    ok(r.offerS.gold < r.king.offer.gold && r.offerS.fame > r.king.offer.fame, '학자는 금화가 적고 명성이 크다');
    ok(r.again === 0, '새로 그린 것이 없으면 다시 보고해도 아무것도 없다');
    ok(r.scholar.gold > 0, '학자에게 보고 (단서 ' + r.scholar.clue + ')');
    ok(/①/.test(r.confirmHtml) && /지도 제작 속도/.test(r.confirmHtml), '보고 창: 단계별 칸 수 · 값어치 · 지도 제작 속도를 보여 준다');
    ok(r.save.lv === 4 && r.save.carto, '저장·불러오기: 상세함과 보고 기록이 남는다 (저장 ' + Math.round(r.save.size / 1024) + 'KB)');
    ok(r.old.pend === 0 && r.old.has, '옛 저장: 지금까지 그린 것은 보고한 셈 — 덧 지나간 몫부터 받는다');
    ok(/보고하지 않은 몫/.test(r.status), '항해 수첩에 상세함·보고하지 않은 몫');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 2).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
