/* 항해 일지가 오래 남는가 (2026-10-23 QA 1) — node tests/journal_retention_smoke.js [해 수=40]   (BROWSER_EXE=크롬 경로)
   · 리스본 항구에서 40년(1480~1520) 날을 보내며 달마다 일상 한 줄, 2년째에 은퇴하고 뒤를 이음·결혼, 3년째에 출생 줄을 적는다
     → 일지 800줄이 찬 뒤에도 일상(D) 줄이 15년 넘게 남는가 · 가문 줄이 40년 내내 남는가 · 해전 분위기 소식이 일지의 15% 이하인가 ·
       어느 등급도 굶지 않는가(A·B·C·D 모두 있다) · 저장 크기
     (고치기 전: 일상 줄은 약 1년, 가문 줄은 17년 뒤 사라짐, 해전 분위기 소식 49%)
   · 고치기 전 판의 저장(800줄 절반이 해전 소식 B, 가문 줄이 D) 불러오기 → 1년 뒤에도 가문 줄이 남고 해전 소식이 줄어든다
   · 술집에 항해사가 나타났다는 개척 소문은 일지에 D · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const YEARS = +process.argv[2] || 40;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.State && G.Journal && G.Journal.hooked, null, { timeout: 120000 });
    const r = await page.evaluate(async (YEARS) => {
      await G.Game.ensureGeo();
      G.UI.toast = () => {};
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, J = G.Journal; s.loc = { mode: 'city', city: 0, lon: -9.1, lat: 38.7 };
      const SEA = /맞붙었다는 소식|싸움이 바다로 번졌다|포를 쏘았다고 한다/, MINE = /^자택 — 아들과 갑판을 닦았다/;
      const fam = [], marks = [];
      for (let y = 0; y < YEARS; y++) {
        for (let d = 0; d < 365; d++) {
          G.Game.newDay();
          if (s.date.d === 15) G.State.log('자택 — 아들과 갑판을 닦았다 ' + s.date.y + '.' + s.date.m);
          if (y === 1 && d === 100) { G.State.log('페드루가 은퇴하고 미겔이 뒤를 이었다.'); fam.push(s.log[s.log.length - 1]); }
          if (y === 1 && d === 130) { G.State.log('마리아와 결혼했다.'); fam.push(s.log[s.log.length - 1]); }
          if (y === 2 && d === 50) { G.State.log('아들이 태어났다.'); fam.push(s.log[s.log.length - 1]); }
        }
        const comp = {}; s.log.forEach(e => { const g = J.of(e); comp[g] = (comp[g] || 0) + 1; });
        const D = s.log.filter(e => MINE.test(e.t));
        marks.push({ y: s.date.y, len: s.log.length, comp, mine: D.length, span: D.length ? (G.U.dateNum(s.date) - D[0].d) / 10000 : 0,
          fam: fam.filter(e => s.log.indexOf(e) >= 0).length, sea: s.log.filter(e => SEA.test(e.t)).length });
      }
      const json = G.State.serialize();
      try { localStorage.clear(); } catch (e) { /* */ }
      const sv = await G.State.saveAsync('journal1');
      let ls = 0; try { for (let i = 0; i < localStorage.length; i++) ls += localStorage.getItem(localStorage.key(i)).length; } catch (e) { /* */ }
      const full = marks.filter(m => m.len >= (G.BALANCE.journal.cap || 800));
      const out = { marks, full: full.length, minSpan: full.length ? Math.min(...full.map(m => m.span)) : null, maxSea: Math.max(...marks.map(m => m.sea / m.len)),
        famEnd: marks[marks.length - 1].fam, last: marks[marks.length - 1], saveChars: json.length, logChars: JSON.stringify(s.log).length, ls, saveOk: !!(sv && sv.ok) };

      // 고치기 전 판의 저장: 800줄 — 해전 소식 B 400 · 전쟁 B 100 · C 150 · A 80 · 일상 D 69 · 가문 줄(D로 적힘) 1
      const o = JSON.parse(json); delete o.flags.journalV;
      const L = []; let dn = 15000101;
      const push = (t, g) => { L.push({ d: dn, t, g }); dn += 7; if (dn % 100 > 28) dn = dn - dn % 100 + 101; if (Math.floor(dn / 100) % 100 > 12) dn = (Math.floor(dn / 10000) + 1) * 10000 + 101; };
      push('페드루가 은퇴하고 미겔이 뒤를 이었다.', 'D');
      for (let i = 0; i < 799; i++) {
        const k = i % 8;
        if (k < 4) push('잉글랜드 함대와 프랑스 함대가 북해에서 맞붙었다는 소식이 들려온다.', 'B');
        else if (k === 4) push('프랑스와 잉글랜드 사이에 전쟁이 벌어졌다. ' + i, 'B');
        else if (k === 5) push('시장 소식: 향료 선단 입항 — 리스본 일대 ' + i, 'C');
        else if (k === 6) push(i % 16 === 6 ? '자택 — 옛 일상 ' + i : '시장 소식: 함대 건조 — 세빌리아 ' + i, i % 16 === 6 ? 'D' : 'C');
        else push(i % 3 ? '자택 — 옛 일상 ' + i : '디아스가 캐러벨 두 척으로 떠났다고 한다. ' + i, i % 3 ? 'D' : 'A');
      }
      o.log = L; o.date = { y: 1520, m: 1, d: 1 };
      const S2 = G.Game.state = G.State.deserialize(JSON.stringify(o));
      S2.loc = { mode: 'city', city: 0, lon: -9.1, lat: 38.7 };
      const succ = S2.log[0], sea0 = S2.log.filter(e => SEA.test(e.t)).length;
      for (let d = 0; d < 365; d++) { G.Game.newDay(); if (S2.date.d === 15) G.State.log('자택 — 새 일상 ' + d); }
      out.old = { succG: succ.g, kept: S2.log.indexOf(succ) >= 0, sea0, sea1: S2.log.filter(e => SEA.test(e.t)).length, len: S2.log.length,
        oldD: S2.log.filter(e => /^자택 — 옛 일상/.test(e.t)).length, warKept: S2.log.filter(e => /사이에 전쟁이 벌어졌다\. \d/.test(e.t)).length };

      // 술집에 항해사가 나타났다는 개척 소문 → 일지에 D
      const had = new Set(S2.log);
      S2.front = S2.front || {}; S2.front.mates = {};
      const msgs = G.Frontier.tick();
      const rum = S2.log.filter(e => !had.has(e) && /^소문: 「/.test(e.t));   // 일지가 꽉 차 있어 길이는 그대로 — 새로 든 줄만
      out.rumor = { msgs: msgs.filter(m => /^소문: 「/.test(m.text || '')).length, lines: rum.length, grades: [...new Set(rum.map(e => e.g))].join('') };
      return out;
    }, YEARS);
    r.marks.forEach(m => console.log('   ', m.y, m.len + '줄', JSON.stringify(m.comp), '일상', m.mine + '줄 · ' + m.span.toFixed(1) + '년', '가문', m.fam + '/3', '해전 소식', m.sea + ' (' + (100 * m.sea / m.len).toFixed(1) + '%)'));
    console.log('    저장 ' + r.saveChars + '자 · 일지 ' + r.logChars + '자 · localStorage ' + r.ls + '자');
    console.log('    옛 저장 ' + JSON.stringify(r.old) + ' · 소문 ' + JSON.stringify(r.rumor));
    ok(r.full > 0 && r.minSpan >= 15, '일지가 꽉 찬 뒤에도 일상 줄이 15년 넘게 남는다 (가장 짧을 때 ' + (r.minSpan != null ? r.minSpan.toFixed(1) : '-') + '년, 꽉 찬 해 ' + r.full + ')');
    ok(r.famEnd === 3, YEARS + '년 뒤에도 은퇴·결혼·출생 줄이 모두 남는다');
    ok(r.maxSea <= 0.15, '해전 분위기 소식은 일지의 15% 이하 (가장 많을 때 ' + (100 * r.maxSea).toFixed(1) + '%)');
    ok(['A', 'B', 'C', 'D', 'F'].every(g => (r.last.comp[g] || 0) > 0), '어느 등급도 굶지 않는다 — ' + JSON.stringify(r.last.comp));
    ok(r.saveOk && r.ls < 120000, '저장 성공 · localStorage ' + r.ls + '자');
    ok(r.old.succG === 'F' && r.old.kept && r.old.sea1 < r.old.sea0 && r.old.len <= 800 && r.old.oldD > 0 && r.old.warKept >= 90, '고치기 전 저장: 가문 줄 F로 남고 해전 소식이 줄어든다 (' + r.old.sea0 + '→' + r.old.sea1 + ') · 옛 일상 ' + r.old.oldD + '줄 · 전쟁 소식 ' + r.old.warKept + '줄 남음');
    ok(r.rumor.msgs > 0 && r.rumor.lines > 0 && r.rumor.grades === 'D', '술집 항해사 소문은 일지에 D — 알림 ' + r.rumor.msgs + ' · 줄 ' + r.rumor.lines);
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { console.error('✗ ' + e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
