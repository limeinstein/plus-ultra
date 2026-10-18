/* 조합 의뢰가 말없이 사라지지 않는다 (2026-10-19) — js/systems/quest.js · js/systems/treasurehunt.js · js/core/state.js
   · 기한이 지나도 곧바로 지우지 않고 「기한 지남」으로 남긴다 (유예 = 기한 × 0.5, 20~60일), 그동안 마치면 사례·명성 절반
   · 유예마저 넘기면 조합이 거둬들이고 명성이 깎인다
   · 두 소식은 s.questNotes에 남아 — 날을 한꺼번에 보내며 알림을 버리는 곳(여관·수행·독서)을 지나도 — 다음에 창으로 꼭 알린다
   · 보물 찾기도 같다: 유예 중에 파내면 금화 절반
   · 저장: 고리가 섞여 있어도 같은 물건을 두 곳에서 가리키는 의뢰가 저장에서 빠지지 않는다
   node tests/quest_late_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const a = await page.evaluate(() => {
      const s = G.Game.state, Q = G.Quest, U = G.U, out = {};
      s.player.fame = 2000; s.player.gold = 1e6;
      const ven = G.CITY_DATA[29];
      // 베네치아 조합: 상품 구입 의뢰 하나와 보물 지도 하나
      let buy = null, tr = null;
      for (let k = 0; k < 40 && (!buy || !tr); k++) {
        s.day += 10;
        Q.offers(ven).forEach(q => { if (!buy && q.kind === 'buy' && !Q.canAccept(q)) buy = Q.accept(q); if (!tr && q.kind === 'treasure' && !Q.canAccept(q)) tr = Q.accept(q); });
      }
      out.got = [buy && buy.title, tr && tr.title];
      // 기한을 오늘로 당긴다
      buy.due = U.dateNum(s.date); tr.due = U.dateNum(s.date);
      s.questNotes = [];
      const fame0 = s.player.fame;
      const m1 = G.Game.passDays(1);                       // 여관·수행처럼 알림을 버리는 곳을 흉내 낸다
      out.d1 = { inList: Q.list().indexOf(buy) >= 0 && Q.list().indexOf(tr) >= 0, late: [buy.late, tr.late], notes: s.questNotes.length, msgs: m1.filter(m => /조합/.test(m.text)).length,
        grace: [Q.grace(buy), Q.graceLeft(buy)], fame: s.player.fame - fame0, text: s.questNotes[0] && s.questNotes[0].text };
      // 저장: 고리 + 같은 의뢰를 두 곳에서 가리킨다
      s.zzCycle = { a: 1 }; s.zzCycle.self = s.zzCycle; s.zzShared = buy;
      const S2 = G.State.deserialize(G.State.serialize());
      out.save = { quests: (S2.quests || []).length, shared: !!(S2.zzShared && S2.zzShared.key === buy.key), cycleCut: S2.zzCycle && S2.zzCycle.self === undefined, late: (S2.quests || []).filter(q => q.late).length };
      delete s.zzCycle; delete s.zzShared;
      return out;
    });
    console.log('   ' + JSON.stringify(a));
    ok(a.got[0] && a.got[1], '베네치아 조합에서 상품 구입·보물 지도 의뢰를 맡았다 (' + a.got.join(' · ') + ')');
    ok(a.d1.inList && a.d1.late.every(Boolean), '기한이 지나도 의뢰가 남아 있다 — 「기한 지남」');
    ok(a.d1.notes === 2 && a.d1.msgs === 0 && a.d1.fame === 0, '알림을 버리는 곳을 지나도 소식 2건이 남아 있다 (명성은 아직 그대로)');
    ok(a.d1.grace[0] >= 20 && a.d1.grace[1] === a.d1.grace[0] - 1, '유예 ' + a.d1.grace[0] + '일 (남은 ' + a.d1.grace[1] + '일)');
    ok(/절반/.test(a.d1.text), '알림: ' + a.d1.text);
    ok(a.save.quests >= 2 && a.save.shared && a.save.cycleCut && a.save.late >= 2, '저장: 고리만 끊고, 두 곳에서 가리킨 의뢰도 그대로 저장된다');

    // 소식 창
    const shown = page.evaluate(() => G.Quest.showNotes());
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => b.offsetParent && /확인/.test(b.textContent)) && /조합 의뢰의 기한이 지났다/.test(document.body.innerText), null, { timeout: 8000 });
    await page.evaluate(() => Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent && /확인/.test(b.textContent)).pop().click());
    const sh = await shown;
    ok(sh === true && await page.evaluate(() => G.Game.state.questNotes.length === 0), '도시·바다·뭍에서 쌓인 소식을 창으로 알리고 비운다');

    // 「맡은 의뢰」에 기한 지남·유예가 보인다
    const mineP = page.evaluate(() => G.Scenes.city.B.guild.mine(G.CITY_DATA[29]));
    await page.waitForFunction(() => /유예 \d+일/.test(document.body.innerText), null, { timeout: 8000 });
    ok(true, '「맡은 의뢰」 목록: 기한 지남 · 유예 N일');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape');
    await Promise.race([mineP, page.waitForTimeout(2000)]);

    // 보물: 유예 중에 파내면 절반
    const t = await page.evaluate(async () => {
      const s = G.Game.state, TH = G.TreasureHunt, q = TH.list()[0], g0 = s.player.gold;
      const say = G.UI.say, al = G.UI.alert; G.UI.say = async () => {}; G.UI.alert = async () => {};
      try { await TH._dig(q, { name: '측량사' }); } finally { G.UI.say = say; G.UI.alert = al; }
      return { pay: q.pay, got: s.player.gold - g0, gone: TH.list().indexOf(q) < 0 };
    });
    ok(t.got === Math.round(t.pay * 0.5) && t.gone, '보물 지도: 유예 중에 파내면 금화 절반 (' + t.got + '/' + t.pay + ')');

    // 유예도 넘기면 거둬들인다
    const z = await page.evaluate(() => {
      const s = G.Game.state, Q = G.Quest, q = Q.list().filter(x => x.kind === 'buy')[0], fame0 = s.player.fame;
      s.questNotes = [];
      const n = Q.graceLeft(q) + 1;
      G.Game.passDays(n);
      return { gone: Q.list().indexOf(q) < 0, done: s.questDone[q.key], dFame: s.player.fame - fame0, note: s.questNotes.map(m => m.text).join(' | ') };
    });
    console.log('   ' + JSON.stringify(z));
    ok(z.gone && z.done === 'late' && z.dFame < 0 && /거둬들였다/.test(z.note), '유예마저 넘기면 조합이 거둬들이고 명성이 깎이며, 그 소식도 남는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
