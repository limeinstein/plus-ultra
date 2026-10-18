/* 발견 일괄 보고 점검 (js/systems/sponsor.js SP.batchReport · SP.lateCalc) — node tests/sponsor_batch_report_smoke.js   (BROWSER_EXE=크롬 경로)
   · 찾아 두고 보고하지 않은 발견이 둘 이상이면 제안 목록 맨 위에 「한꺼번에 보고」가 나온다
   · 셈은 한 건씩 보고할 때와 같다: 값진 것부터 차례로, 올해 이 후원자에게 두 번째부터는 사례금 ÷(1 + lateRepCut × n) — 같은 발견을 한 건씩 보고한 합과 같다
   · 경쟁자가 먼저 발표한 발견은 덜 쳐준다 · 보고한 발견은 「보고함」이 되고 다시 목록에 나오지 않는다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const SP = G.Sponsor, UI = G.UI, out = {};
      UI.say = async () => {}; UI.toast = () => {}; UI.alert = async () => {}; G.Game.refreshHud = () => {};
      const sp = G.SPONSOR.pt_king;
      // 같은 상태를 두 번 만든다: ① 한 건씩 ② 일괄
      const ids = G.DISCOVERIES.filter(d => d.how !== 'trade' && d.pw <= 3 && !d.rival && d.lat !== 0).slice(0, 4).map(d => d.id);
      const lateId = G.DISCOVERIES.find(d => d.rival && d.how !== 'trade' && d.pw <= 3).id;
      function fresh() {
        const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        s.player.fame = 99999; s.sponsors.pt_king = { trust: 60, met: 3, done: 1, fail: 0, anger: 0 };
        ids.concat([lateId]).forEach(id => { s.disc[id] = { found: true, me: true, day: 1, grade: 'chart' }; });
        s.disc[lateId].rival = G.DISC[lateId].rival[2]; s.disc[lateId].late = true;
        return s;
      }
      // ① 한 건씩 — 일괄 보고가 고른 순서·반응(k) 그대로
      let s = fresh();
      const seed = () => {};
      SP.interest = (sp0, d) => (d.val % 3 === 0 ? 0.6 : 2.0);   // 후원자의 관심(원래는 들쭉날쭉)을 고정 — 마음이 내킴(k 1)과 좋은 반응(k 0.8)이 섞이게
      seed();
      const cand = SP.batchCandidates(sp), okList = cand.filter(x => x.ok);
      out.cand = cand.map(x => [G.DISC[x.d.id].name, x.ok, x.est ? x.est.pay : null, x.k]);
      const order = okList.slice().sort((a, b) => b.base.pay - a.base.pay).map(x => [x.d.id, x.k]);
      if (G.Fakes) G.Fakes.choose = async () => 'real'; SP.doubt = async () => ({ k: 1 }); if (G.Pitch) G.Pitch.on = () => false; if (G.Fest) G.Fest.begin = async () => {}; if (G.Names) G.Names.onReport = async () => {};
      const g0 = s.player.gold; let one = [];
      const lg = G.State.log; let pays = []; G.State.log = function (t) { const m = /금화 (\d+)/.exec(t); if (/발견을 보고했다/.test(t) && m) pays.push(+m[1]); return lg.apply(this, arguments); };
      for (const [id, k] of order) { await SP.lateReport(sp, G.DISC[id], k); }
      one = pays.slice(); G.State.log = lg;
      out.one = { gold: one.reduce((a, b) => a + b, 0), each: one };
      // ② 일괄
      s = fresh(); seed(); out.cand2 = SP.batchCandidates(sp).map(x => [x.d.id, x.k, x.est && x.est.pay]);   // 같은 난수로 같은 반응
      seed();
      out.hasOption = G.Disc.unreported().length >= 2;
      const g1 = s.player.gold, f1 = s.player.fame;
      UI.window = (o) => { window.__lastWin = o.html; return { result: Promise.resolve(o.buttons && o.buttons[0] ? o.buttons[0].value : 1), el: document.createElement('div') }; };
      const done = await SP.batchReport(sp, { all: true });
      out.batch = { done: !!done, gold: done ? done.gold : 0, each: done ? done.res.map(x => x.pay) : [], reported: ids.concat([lateId]).filter(id => s.disc[id].reported === 'pt_king').length, left: G.Disc.unreported().length, fame: s.player.fame - f1 };
      // 순서대로 깎임: 두 번째부터 (1 + 0.3n)
      const est = SP.batchCandidates(sp);
      out.after = est.length; out.win = (window.__lastWin || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400);
      // 계산식 점검: 같은 발견을 0번째·2번째로 보고할 때
      const d0 = G.DISC[ids[0]], a = SP.lateCalc(sp, d0, 1, 1, 0), b2 = SP.lateCalc(sp, d0, 1, 1, 2);
      out.cut = [a.pay, b2.pay];
      const L0 = SP.lateCalc(sp, G.DISC[lateId], 1, 1, 0); s.disc[lateId].late = false; const L1 = SP.lateCalc(sp, G.DISC[lateId], 1, 1, 0);
      out.late = [L0.fame, L1.fame, G.Disc.isLate(lateId)];
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.hasOption && r.cand.length === 5, '찾아 두고 보고하지 않은 발견 ' + r.cand.length + '건 — 「한꺼번에 보고」 후보');
    ok(r.batch.done && r.batch.reported === r.cand.filter(x => x[1]).length && r.batch.left === r.cand.length - r.batch.reported && r.after === r.batch.left, '일괄 보고로 ' + r.batch.reported + '건이 「보고함」이 되었다 (남은 것 ' + r.batch.left + ')');
    ok(r.batch.gold === r.one.gold && r.batch.each.join() === r.one.each.join(), '사례금은 한 건씩 같은 순서로 보고한 것과 똑같다 (' + r.batch.each.join(' / ') + ' = ' + r.batch.gold + '닢 — 두 번째부터 깎임)');
    ok(r.cut[1] < r.cut[0] && Math.abs(r.cut[1] - r.cut[0] / 1.6) <= 100, '올해 세 번째 보고는 사례금이 ÷1.6 (' + r.cut[0] + ' → ' + r.cut[1] + ')');
    ok(r.batch.fame > 0, '명성 +' + r.batch.fame);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  await browser.close();
})();
