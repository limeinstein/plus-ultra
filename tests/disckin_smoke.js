/* 발견물·책과 인연 있는 부하의 말 · 입을 여는 부하 1~3명 무작위 (2026-11-16)
   node tests/disckin_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(m.text())) errors.push(m.text()); });   // 그림 파일이 없는 사본에서는 그림 받기 실패를 빼고 본다
    await page.goto(((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = { bad: [] }, DV = G.DiscVoice;
      // 자료: 부하·발견물·책 id가 모두 있다, 대사는 짧다
      for (const id in G.DISC_KIN) {
        if (!G.DISC[id]) out.bad.push('발견물 없음 ' + id);
        G.DISC_KIN[id].forEach(([m, t]) => { if (!G.MATE[m]) out.bad.push('부하 없음 ' + id + ':' + m); if (t.length > 110) out.bad.push('길다 ' + id + ':' + m + ' ' + t.length); });
      }
      for (const b in G.BOOK_REL) {
        if (!G.BOOKS.some(x => x.id === b)) out.bad.push('책 없음 ' + b);
        for (const m in G.BOOK_REL[b]) { if (!G.MATE[m]) out.bad.push('부하 없음 ' + b + ':' + m); if (G.BOOK_REL[b][m].length !== 2) out.bad.push('짝 아님 ' + b + ':' + m); }
      }
      out.noFacts = G.DISCOVERIES.filter(d => !G.DISC_FACTS[d.id]).map(d => d.id);
      // 1~3명
      const cnt = { 1: 0, 2: 0, 3: 0 }; for (let i = 0; i < 3000; i++) cnt[DV.count()]++;
      out.cnt = cnt;
      const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1600, m: 3, d: 1 };
      const add = id => s.mates.push({ id, role: 'none', joined: { y: 1600, m: 1, d: 1 }, loyal: 80 });
      s.mates = []; ['apostle_hermes', 'apostle_apollo', 'leonardo', 'pigafetta', 'elcano', 'michelangelo', 'shakespeare', 'h_xuxiake'].forEach(add);
      const cave = G.DISC.hermescave, lens = new Set(); let kinFirst = 0, over = 0, kinIds = new Set();
      for (let i = 0; i < 200; i++) {
        const L = DV.reveal(cave); lens.add(L.length);
        if (L[0] && L[0].kin) { kinFirst++; kinIds.add(L[0].m.id); }
        if (L.length > 3) over++;
        if (L.filter(x => x.kin).length > 1) out.bad.push('인연 말이 둘');
      }
      out.kinFirst = kinFirst; out.kinIds = [...kinIds]; out.lens = [...lens].sort(); out.over = over;
      out.circum = DV.reveal(G.DISC.circum, 3).map(x => x.d.name + ':' + x.text);
      out.noKin = DV.reveal(G.DISC.giza, 3).some(x => x.kin);
      // 그림 없는 발견물의 목소리 (말 수가 1~3 + 바람·가족)
      const said = []; G.UI.say = async (t, w) => { said.push(t); };
      await G.Scenes.discoveryVoices(G.DISC.monalisa); out.mona = said.slice();
      // 예전 갈래 말은 두 문장 + 인용 한 문장까지
      const nat = G.DISCOVERIES.filter(d => d.cat === 'nature').slice(0, 30); let longest = 0;
      nat.forEach(d => [1, 2, 3].forEach(lv => { const t = G.Scenes._lineFor('art', lv, d); t.split('\f').forEach(p => { longest = Math.max(longest, p.length); }); if (t.split('\f').length > 2) out.bad.push('조각 셋 ' + d.id); }));
      out.longest = longest;
      // 도서관: 1~3명, 책과 인연 있는 부하는 늘 낀다
      const LB = G.Scenes.city.B.library, bk = G.BOOKS.find(b => b.id === 'b_pausanias'), sz = new Set(); let relIn = 0;
      for (let i = 0; i < 100; i++) { const sp = LB.speakers(bk); sz.add(sp.length); if (sp.some(x => x.id === 'apostle_hermes' && x.r.k === 'rel')) relIn++; }
      out.libSizes = [...sz].sort(); out.relIn = relIn;
      return out;
    });
    console.log(JSON.stringify({ cnt: r.cnt, lens: r.lens, kinIds: r.kinIds, libSizes: r.libSizes, longest: r.longest }));
    console.log(r.circum.join('\n')); console.log('모나리자:', r.mona.join(' / '));
    if (r.bad.length) console.log(r.bad.join('\n'));
    ok(r.bad.length === 0, '인연 대사 자료가 맞다 (' + r.bad.length + '건)');
    ok(r.noFacts.length === 0, '관찰이 빈 발견물 없음 ' + r.noFacts.join(','));
    ok(r.cnt[1] > 500 && r.cnt[2] > 700 && r.cnt[3] > 500, '입을 여는 부하 수 1~3명 고루');
    ok(r.over === 0 && r.lens.indexOf(1) >= 0 && r.lens.indexOf(3) >= 0, '발견 때 말하는 부하 1~3명 (' + r.lens + ')');
    ok(r.kinFirst === 200 && r.kinIds.length === 2, '인연 있는 사도가 늘 먼저, 둘이 번갈아 (' + r.kinIds + ')');
    ok(r.circum[0] && /빅토리아호|하루가 모자/.test(r.circum[0]), '세계일주 항로: 엘카노·피가페타가 먼저');
    ok(!r.noKin, '인연 없는 발견물에는 인연 말이 없다');
    ok(r.mona.some(t => /입가의 그림자/.test(t)), '모나리자: 레오나르도의 한마디');
    ok(r.longest <= 140, '예전 갈래 말 한 쪽이 짧다 (가장 긴 쪽 ' + r.longest + '자)');
    ok(r.libSizes[0] >= 1 && r.libSizes[r.libSizes.length - 1] <= 3 && r.relIn === 100, '도서관 1~3명 · 책과 인연 있는 부하는 늘 (' + r.libSizes + ')');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    if (fail) { console.log('실패 ' + fail); process.exitCode = 1; } else console.log('통과');
  } catch (e) { console.error('실패:', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
