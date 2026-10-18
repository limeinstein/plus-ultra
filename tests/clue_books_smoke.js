/* 새 발견물의 사료 책 (2026-10-18) — js/data/cluebooks.js · js/city/bookshelf.js G.BookSeq
   · 새 책: 모두 1800년까지 나온 책, 단서는 1~2곳(3곳 이상 없음), 발견물·도서관이 모두 있다, 책 id가 겹치지 않는다
   · 새 책에 실린 발견물은 사료 갈래(book) — 도서관에서 단서를 얻는다
   · 책 안의 차례: 앞 대목의 곳을 찾아야(또는 경쟁자가 먼저 찾아야) 다음 대목이 읽힌다
   · 연작의 차례: 앞 책에 적힌 곳을 다 찾아야 다음 책이 서가에서 열린다(빨강 → 노랑)
   · 서가에서 읽으면 보이는 대목만 단서가 된다 · 콘솔 오류 0
   node tests/clue_books_smoke.js */
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
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); if (m.type() === 'warning' && /단서가 .*넘어/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const a = await page.evaluate(() => {
      const nb = G.BOOKS.filter(b => b.seq), ids = {}, out = { n: nb.length, bad: [], dupIds: [], discs: 0, notBook: [], noLib: [], late: [], series: Object.keys(G.CLUE_SERIES).length, newIds: G.DiscAdd.ids.length };
      G.BOOKS.forEach(b => { if (ids[b.id]) out.dupIds.push(b.id); ids[b.id] = 1; });
      const cov = {};
      nb.forEach(b => {
        if (!(b.discs.length >= 1 && b.discs.length <= 2)) out.bad.push(b.id + ':' + b.discs.length);
        if ((b.y || 0) > 1800) out.late.push(b.id);
        b.discs.forEach(id => { if (!G.DISC[id]) out.bad.push(b.id + '→' + id); else { cov[id] = 1; if (G.CLUE[id] !== 'book') out.notBook.push(id); } });
        b.libs.forEach(c => { const cd = G.CITY_DATA[c]; if (!cd || !G.R.facilities(cd).library) out.noLib.push(b.id + '@' + c); });
        if (b.after && !G.BOOK[b.after]) out.bad.push(b.id + ' after ' + b.after);
      });
      out.discs = Object.keys(cov).length;
      out.newCovered = G.DiscAdd.ids.filter(id => cov[id]).length;
      out.uncovered = G.DiscAdd.ids.filter(id => !cov[id]);
      return out;
    });
    console.log('   새 책 ' + a.n + '권 · 연작 ' + a.series + ' · 단서 ' + a.discs + '곳 (새 발견물 ' + a.newCovered + '/' + a.newIds + ')');
    console.log('   사료가 없어 넣지 않은 것: ' + a.uncovered.join(', '));
    ok(a.n >= 50 && !a.bad.length && !a.dupIds.length, '새 책 ' + a.n + '권 — 한 책에 단서 1~2곳, 발견물·앞 책이 모두 있다, 책 id 겹침 없음 ' + a.bad.concat(a.dupIds).join(' '));
    ok(!a.late.length, '모두 1800년까지 나온 책 ' + a.late.join(' '));
    ok(!a.noLib.length, '모든 책이 도서관 있는 도시에 꽂혀 있다 ' + a.noLib.join(' '));
    ok(!a.notBook.length, '새 책의 발견물은 사료 갈래(도서관) ' + a.notBook.join(' '));
    ok(a.newCovered >= 90, '새 발견물 ' + a.newCovered + '곳에 도서관 단서가 생겼다');

    // ---------------- 차례: 노르덴(룩소르 → 필레) · 나일 연작(호라폴론 → 압드 알라티프 → 키르허 → 노르덴)
    const b = await page.evaluate(() => {
      const s = G.Game.state, SQ = G.BookSeq, LB = G.Scenes.city.B.library, out = {};
      s.date = { y: 1760, m: 3, d: 1 };
      s.player.lg = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(() => 3);
      s.player.sk = { hist: 5, survey: 5, sci: 5, theo: 5, med: 5, art: 5, acct: 5, nav: 5 };
      ['sacredibis', 'sphinx', 'ankh', 'luxor', 'philae'].forEach(id => { delete s.hints[id]; delete s.disc[id]; });
      const B = id => G.BOOK[id];
      const st = id => LB.shelfState(B(id));
      out.chain = G.CLUE_SERIES.nile.slice();
      out.s0 = ['b_horapollo', 'b_abdallatif', 'b_kircher', 'b_norden'].map(id => st(id).kind + ':' + (st(id).why || ''));
      out.lockText = st('b_abdallatif').text;
      // 첫 책을 풀면 다음 책이 열린다
      s.disc.sacredibis = { found: true, me: true };
      out.s1 = ['b_abdallatif', 'b_kircher'].map(id => st(id).kind + ':' + (st(id).why || ''));
      s.disc.sphinx = { found: true, me: true };
      s.disc.ankh = { found: true, rival: 'x', me: false };   // 경쟁자가 먼저 찾아도 다음으로 넘어간다
      out.s2 = st('b_norden').kind;
      // 책 안의 차례
      const r0 = LB.readable(B('b_norden'));
      out.vis0 = r0.part.slice(); out.hid0 = r0.hidden;
      s.disc.luxor = { found: true, me: true };
      const r1 = LB.readable(B('b_norden'));
      out.vis1 = r1.part.slice(); out.hid1 = r1.hidden;
      out.sq = [SQ.visible(B('b_norden')).length, SQ.hidden(B('b_norden'))];
      return out;
    });
    console.log('   ' + JSON.stringify(b));
    ok(b.s0[0].startsWith('open') && b.s0.slice(1).every(x => x === 'lock:seq'), '연작 「나일강의 옛 글」: 첫 책만 열리고 나머지는 빨강 (' + b.s0.join(', ') + ')');
    ok(/앞선 책/.test(b.lockText), '잠긴 까닭: ' + b.lockText);
    ok(b.s1[0].startsWith('open') && b.s1[1] === 'lock:seq', '따오기를 찾으면 다음 책(압드 알라티프)이 열리고 그다음은 아직 잠김');
    ok(b.s2 === 'open', '경쟁자가 먼저 찾은 곳은 지나간 것으로 친다 → 노르덴이 열린다');
    ok(b.vis0.join() === 'luxor' && b.hid0 === 1, '노르덴: 처음에는 룩소르 대목만 읽힌다 (가려진 대목 ' + b.hid0 + ')');
    ok(b.vis1.join() === 'luxor,philae' && b.hid1 === 0, '룩소르를 찾으면 필레 대목도 읽힌다');

    // ---------------- 서가에서 실제로 읽기: 이스탄불 도서관 · 사이 「건축의 기록」(쉴레이마니예 → 셀리미예) — 연작 앞 책(키라코스)을 풀어 둔 뒤
    const c = await page.evaluate(async () => {
      const s = G.Game.state, LB = G.Scenes.city.B.library, out = {};
      s.date = { y: 1690, m: 5, d: 1 };
      ['suleymaniye', 'selimiye', 'ani'].forEach(id => { delete s.hints[id]; delete s.disc[id]; });
      s.disc.ani = { found: true, me: true };
      delete s.flags.read_b_tezkire;
      const b = G.BOOK.b_tezkire;
      out.state = LB.shelfState(b).kind;
      const p = LB.pick(G.CITY_DATA[112], b);
      // 펼친 책 창 → 이야기 → 닫기
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 250));
        const btn = Array.from(document.querySelectorAll('.win button, .modal button, button')).filter(x => x.offsetParent && /책을 덮는다/.test(x.textContent))[0];
        if (btn) { out.saw = document.body.innerText.indexOf('앞 대목의 곳을 찾아야 읽히는 대목 1곳') >= 0; btn.click(); break; }
      }
      for (let i = 0; i < 60 && G.UI.busy(); i++) { await new Promise(r => setTimeout(r, 200)); const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }); document.dispatchEvent(ev); (document.querySelector('.dlg, .talk, .say') || document.body).click(); }
      await Promise.race([p, new Promise(r => setTimeout(r, 4000))]);
      out.h1 = !!s.hints.suleymaniye; out.h2 = !!s.hints.selimiye;
      out.after = LB.shelfState(b).kind;
      return out;
    });
    console.log('   ' + JSON.stringify(c));
    ok(c.state === 'open' && c.h1 && !c.h2, '이스탄불 서가에서 「건축의 기록」을 읽으면 쉴레이마니예 단서만 얻는다');
    ok(c.saw, '펼친 책에 「앞 대목의 곳을 찾아야 읽히는 대목 1곳」이라고 알려 준다');
    ok(c.after === 'read', '다 읽은 뒤에는 검정(읽은 책) — 쉴레이마니예를 찾으면 다시 노랑이 된다');
    const d = await page.evaluate(() => { const s = G.Game.state; s.disc.suleymaniye = { found: true, me: true }; return G.Scenes.city.B.library.shelfState(G.BOOK.b_tezkire).kind; });
    ok(d === 'again', '쉴레이마니예를 찾으니 「건축의 기록」이 다시 노랑 — 셀리미예 대목이 읽힌다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
