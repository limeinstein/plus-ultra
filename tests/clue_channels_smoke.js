/* 단서의 갈래 점검 (js/data/clues.js)
   · 이야기(talk: 주점·교역소·후원자)와 사료(book: 도서관) 갈래가 반반쯤으로 나뉘는지, 모든 사료 발견이 책에 실렸는지,
     모든 책에 사료 갈래 대목이 하나 이상 있는지
   · D.addHint: 주점·교역소·후원자 출처는 사료 발견을, 책 출처는 이야기 발견을 받지 않는다 (계약·큰 항로·유물은 상관없음)
   · 주점 소문은 자연·생물·민족·근세 건물만, 교역소 주인은 교역품·보물만, 후원자는 이야기 갈래만, 도서관은 사료 갈래만
   · 후원자가 도서관의 책을 일러 주는지, 도감에 「단서를 얻는 곳」이 나오는지
   · 단서가 없어 못 찾는 발견이 없는지: 모든 발견에 단서가 나올 곳이 있고(책은 그 해 뒤에도 남는 도서관에),
     책에서만 나오는 전설·공룡은 책 둘 이상이거나 도서관 여럿에 있는 쉬운 책이 있다
   · 단서 겹치기: 다른 곳에서 또 들으면 겹치고(같은 곳은 안 겹침, 최대 4겹), 겹칠수록 망루·찾는 반경이 넓어지고,
     술집·도서관에서 겹친 단서가 나온다
   node tests/clue_channels_smoke.js  (playwright) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const { chromium } = pw;

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, 'index.html')).href;
const CAT = pathToFileURL(path.join(ROOT, 'catalog.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.CLUE && G.Disc && G.Disc.clueOk, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date.y = 1600; s.player.fame = 6000; s.player.gold = 1e7;
      // 개척 단계를 모두 연 셈 치고 갈래만 본다 (온 세상이 떠드는 이야기도 없는 셈)
      G.Frontier.available = d => !d.built || s.date.y >= d.built; G.Frontier.hot = () => false;
      const D = G.DISCOVERIES, CL = G.CLUE, out = {};
      // 꼬리에 꼬리를 무는 사슬 발견(chaindisc.js)은 앞 고리를 찾을 때 단서가 풀리므로 갈래 비율에서 뺀다
      out.talk = D.filter(d => CL[d.id] === 'talk' && !d.chain).length; out.book = D.filter(d => CL[d.id] === 'book' && !d.chain).length;
      const inBook = {}; G.BOOKS.forEach(b => b.discs.forEach(id => inBook[id] = 1));
      out.bookNoBook = D.filter(d => CL[d.id] === 'book' && !inBook[d.id]).map(d => d.id);
      out.emptyBooks = G.BOOKS.filter(b => !b.discs.some(id => CL[id] === 'book')).map(b => b.id);
      out.bookOnlyTalk = D.filter(d => d.bookOnly && CL[d.id] !== 'book').map(d => d.id);
      // addHint 갈래 지키기
      const ruin = D.find(d => CL[d.id] === 'book' && d.cat === 'ruin' && !d.bookOnly && G.Disc.available(d) && !G.Frontier.hot(d));
      const nat = D.find(d => CL[d.id] === 'talk' && d.cat === 'nature' && inBook[d.id] && G.Disc.available(d) && !G.Frontier.hot(d));
      out.g = [G.Disc.addHint(ruin.id, 'tavern:0'), G.Disc.addHint(ruin.id, 'trade:0'), G.Disc.addHint(ruin.id, 'sponsor:x'),
        G.Disc.addHint(nat.id, 'book:b_x'), G.Disc.addHint(nat.id, 'tavern:0'), G.Disc.addHint(ruin.id, 'book:b_x')];
      const ruin2 = D.find(d => d !== ruin && CL[d.id] === 'book' && d.cat === 'ruin' && !d.bookOnly && G.Disc.available(d) && !s.hints[d.id]);
      out.g.push(G.Disc.addHint(ruin2.id, 'contract:x'));
      // 주점 소문
      const T = G.Scenes.city.B.tavern, lis = G.CITY_DATA[0], cats = {}, bad = [];
      for (let i = 0; i < 400; i++) { const d = T.rumour(lis); if (!d) break; cats[d.cat] = (cats[d.cat] || 0) + 1; if (CL[d.id] !== 'talk' || d.cat === 'treasure' || d.cat === 'trade') bad.push(d.id); }
      out.tavern = { cats, bad };
      // 교역소 주인의 이야기
      const UI = G.UI, C = G.Scenes.city, said = [];
      const sayC = C.say, sayU = UI.say, toast = UI.toast, curC = C.current; C.current = () => ({});
      C.say = async (w, t) => { said.push(t); }; UI.say = async (t) => { said.push(t); }; UI.toast = () => {};
      const before = Object.keys(s.hints);
      for (let i = 0; i < 60; i++) await C.B.trade.talk(lis);
      const got = Object.keys(s.hints).filter(id => before.indexOf(id) < 0);
      out.trade = { n: got.length, cats: got.reduce((a, id) => (a[G.DISC[id].cat] = (a[G.DISC[id].cat] || 0) + 1, a), {}), bad: got.filter(id => CL[id] !== 'talk' || (G.DISC[id].cat !== 'trade' && G.DISC[id].cat !== 'treasure')) };
      // 후원자 이야기 (리스본의 후원자들, 믿음을 올려서)
      const sps = G.SPONSORS.filter(sp => G.Sponsor.present(sp)).slice(0, 40), b2 = Object.keys(s.hints);
      said.length = 0;
      for (const sp of sps) { G.Sponsor.rel(sp.id).trust = 80; const B = sp.bld === 'palace' ? C.B.palace : C.B.mansion; const it = B.menu(G.CITY_DATA[sp.city], sp.id).find(x => x.label === '이야기'); for (let i = 0; i < 4; i++) await it.onClick(); }
      const got2 = Object.keys(s.hints).filter(id => b2.indexOf(id) < 0);
      out.sponsor = { n: got2.length, bad: got2.filter(id => CL[id] !== 'talk' && !G.Frontier.hot(G.DISC[id]) && !/^lead/.test(s.hints[id].src)),
        tips: said.filter(t => /도서관에/.test(t)).length, tipSample: (said.find(t => /도서관에/.test(t)) || '').split('\f').pop() };
      C.say = sayC; UI.say = sayU; UI.toast = toast; C.current = curC;
      // 도서관: 읽어 낼 수 있는 대목은 사료 갈래뿐, 이야기 갈래는 talk로 따로
      const LB = C.B.library, rb = [];
      G.BOOKS.forEach(b => { const x = LB.readable(b); x.all.forEach(id => { if (CL[id] !== 'book' && !G.Frontier.hot(G.DISC[id])) rb.push(b.id + ':' + id); }); });
      out.library = { bad: rb, talkSample: LB.readable(G.BOOK.b_kumano).talk };

      // ---- 단서가 없어 못 찾는 발견이 없는가
      const C2 = G.CITY_DATA, alive = (c, y0) => { for (let y = y0; y < y0 + 300; y += 5) if (G.R.cityExists(c, { y: y, m: 6, d: 1 })) return true; return false; };
      const okBook = (b, d) => b.libs.some(l => C2[l] && alive(C2[l], Math.max(b.y || 1480, d.built || 0, 1480)));
      const easy = b => !b.sk || (b.lv || 1) <= 1;
      const allSp = Object.values(G.SPONSOR), noSrc = [], thinBO = [];
      D.forEach(d => {
        const bs = G.BOOKS.filter(b => b.discs.includes(d.id) && okBook(b, d));
        let src = bs.length;
        if (CL[d.id] === 'talk') {
          if (!d.bookOnly && d.id !== 'circum' && d.cat !== 'trade' && d.cat !== 'treasure') src++;   // 주점
          if (d.cat === 'trade' || d.cat === 'treasure') src++;                                       // 교역소
          if (!d.bookOnly && d.how !== 'special' && allSp.some(sp => sp.taste.includes(d.cat) && d.pw <= sp.pw)) src++;
        } else if (!bs.length) src = 0;
        if (!src) noSrc.push(d.id);
        if (d.bookOnly && !(bs.length >= 2 || bs.some(b => easy(b) && b.libs.length >= 2))) thinBO.push(d.id);
      });
      out.reach = { noSrc, thinBO, needHint: D.filter(d => d.needHint && CL[d.id] !== 'talk').map(d => d.id),
        noEasy: D.filter(d => CL[d.id] === 'book' && !G.BOOKS.some(b => b.discs.includes(d.id) && easy(b))).map(d => d.id) };

      // ---- 단서 겹치기
      const sea = D.find(d => d.how === 'sea' && !d.bookOnly && !s.hints[d.id] && !G.Disc.foundByMe(d.id) && CL[d.id] === 'talk' && d.r > 0.5 && G.Disc.built(d));
      const lv = [];
      const st0 = { sense: G.Disc.clueK(sea.id, 'sense'), find: G.Disc.clueK(sea.id, 'find') };
      const at = G.Geo ? null : null;
      const far = { lon: sea.lon + sea.r * 1.25, lat: sea.lat };   // 반경 바로 밖 (경도 방향)
      const hitBefore = G.Disc.checkSea(far.lon, far.lat).indexOf(sea) >= 0;
      lv.push(G.Disc.addHint(sea.id, 'tavern:1'), G.Disc.hintLv(sea.id));
      lv.push(G.Disc.addHint(sea.id, 'tavern:1'), G.Disc.hintLv(sea.id));            // 같은 술집 — 안 겹침
      lv.push(G.Disc.addHint(sea.id, 'tavern:2'), G.Disc.lastMore === sea.id, G.Disc.hintLv(sea.id));   // 다른 술집 — 겹침
      lv.push(G.Disc.addHint(sea.id, 'contract:x'), G.Disc.hintLv(sea.id));
      lv.push(G.Disc.addHint(sea.id, 'lookout'), G.Disc.hintLv(sea.id));
      lv.push(G.Disc.addHint(sea.id, 'native'), G.Disc.hintLv(sea.id));               // 4겹이 끝
      lv.push(G.Disc.addHint(sea.id, 'book:b_x'), G.Disc.hintLv(sea.id));             // 사료 갈래가 아니면 책으로는 안 겹침
      const hitAfter = G.Disc.checkSea(far.lon, far.lat).indexOf(sea) >= 0;
      out.stack = { id: sea.id, lv, st0, st4: { sense: G.Disc.clueK(sea.id, 'sense'), find: G.Disc.clueK(sea.id, 'find'), zone: G.Disc.clueK(sea.id, 'zone') }, hitBefore, hitAfter,
        srcs: G.Disc.hintSrcs(sea.id) };
      // 술집 소문에서 겹치기: 이 근처 이야기를 모두 한 번씩 들은 뒤 다른 도시 술집에서
      const sev = G.CITY_DATA[14];   // 파리
      let more = 0, nw = 0;
      for (let i = 0; i < 80; i++) { const d = T.rumour(sev, { stack: true }); if (!d) break; const k = G.Disc.hasHint(d.id); const t = G.Disc.noteHint(d, 'tavern:' + sev.id); if (t === 'more') more++; if (t === 'new') nw++; }
      out.tavernStack = { more, nw };
      // 도서관에서 겹치기: 계약으로 단서를 받은 사료 갈래 발견이 실린 책은 「맞춰 볼 수 있다」
      const bk = G.BOOKS.find(b => !b.sk && b.discs.some(id => CL[id] === 'book' && !s.hints[id] && G.Disc.available(G.DISC[id])));
      const bid = bk.discs.find(id => CL[id] === 'book' && !s.hints[id] && G.Disc.available(G.DISC[id]));
      G.Disc.addHint(bid, 'contract:y');
      G.R.langRead = () => 3;
      const stb = LB.shelfState(bk);
      const r2 = G.Disc.addHint(bid, 'book:' + bk.id);
      out.libStack = { book: bk.id, disc: bid, text: stb.text, confirm: stb.t && stb.t.confirm, more: !r2 && G.Disc.lastMore === bid, lv: G.Disc.hintLv(bid) };
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 3000));
    const tot = r.talk + r.book;
    ok(Math.abs(r.talk - r.book) / tot < 0.08, '이야기 ' + r.talk + ' : 사료 ' + r.book + ' — 반반쯤');
    ok(!r.bookNoBook.length, '사료 갈래 발견은 모두 책에 실렸다');
    ok(!r.emptyBooks.length, '모든 책에 사료 갈래 대목이 있다 ' + r.emptyBooks.join(','));
    ok(!r.bookOnlyTalk.length, '책에서만(bookOnly) 발견은 사료 갈래');
    ok(r.g.join() === 'false,false,false,false,true,true,true', 'addHint: 사료←주점/교역소/후원자 ✗, 이야기←책 ✗, 이야기←주점 ✓, 사료←책 ✓, 계약은 갈래 무관 ✓');
    ok(!r.tavern.bad.length && Object.keys(r.tavern.cats).length >= 3, '주점 소문: 이야기 갈래의 자연·생물·민족·건물만 ' + JSON.stringify(r.tavern.cats));
    ok(r.trade.n > 5 && !r.trade.bad.length && r.trade.cats.treasure && r.trade.cats.trade, '교역소: 교역품·보물만 ' + JSON.stringify(r.trade.cats));
    ok(r.sponsor.n > 0 && !r.sponsor.bad.length, '후원자: 이야기 갈래만 (' + r.sponsor.n + '개)');
    ok(r.sponsor.tips > 0, '후원자가 도서관의 책을 일러 준다 — ' + r.sponsor.tipSample);
    ok(!r.library.bad.length, '도서관: 사료 갈래만 단서가 된다');
    ok(r.library.talkSample.length > 0, '구마노 참배기의 이야기 갈래 대목(나치 폭포·후지산)은 따로 알려 준다');
    ok(!r.reach.noSrc.length, '단서가 나올 곳이 없는 발견이 없다 ' + r.reach.noSrc.join(','));
    ok(!r.reach.needHint.length, '단서를 들어야 눈에 띄는 동물(needHint)은 모두 이야기 갈래');
    ok(!r.reach.thinBO.length, '책에서만 나오는 전설·공룡: 책 둘 이상, 또는 도서관 여럿에 있는 쉬운 책 ' + r.reach.thinBO.join(','));
    ok(!r.reach.noEasy.length, '사료 갈래 발견마다 학문 없이(또는 1단계로) 읽히는 책이 있다 ' + r.reach.noEasy.join(','));
    ok(r.stack.lv.join() === 'true,1,false,1,false,true,2,false,3,false,4,false,4,false,4', '단서 겹치기: 같은 술집 ✗, 다른 술집·계약·망루 ✓, 4겹이 끝, 갈래가 다른 책 ✗ — ' + r.stack.lv.join());
    ok(!r.stack.hitBefore && r.stack.hitAfter, '4겹이면 찾는 반경이 넓어져 반경 바로 밖에서도 찾는다 (' + r.stack.st0.find + '→' + r.stack.st4.find + ', 망루 ' + r.stack.st0.sense + '→' + r.stack.st4.sense + ', 계약 원 ×' + r.stack.st4.zone + ')');
    ok(r.tavernStack.more > 0, '다른 도시 술집에서 아는 이야기를 들으면 단서가 겹친다 (새 ' + r.tavernStack.nw + ' · 겹침 ' + r.tavernStack.more + ')');
    ok(r.libStack.confirm > 0 && /맞춰 볼/.test(r.libStack.text) && r.libStack.more && r.libStack.lv === 2, '도서관: 들은 이야기를 책으로 맞춰 보면 겹친다 — ' + r.libStack.book + ' · ' + r.libStack.text);

    await page.goto(CAT);
    await page.waitForFunction(() => document.body && document.body.innerText.length > 100, null, { timeout: 60000 });
    const cat = await page.evaluate(() => (G.clueWhere && G.clueWhere(G.DISC.haeinsa)) + ' / ' + G.clueWhere(G.DISC.halong) + ' / ' + G.clueWhere(G.DISC.monalisa));
    ok(/도서관/.test(cat) && /주점/.test(cat) && /교역소/.test(cat), '도감: 단서를 얻는 곳 — ' + cat);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
