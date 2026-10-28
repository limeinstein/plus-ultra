/* 발견물 앞에서 배에 함께 탄 가족의 한마디 (js/systems/famvoice.js · js/data/discfam_1~8.js)
   · 모든 발견물(세계일주 빼고)에 [아내, 어린아이, 청소년, 어른 자식] 네 줄 — 끝맺음(해요체·하십시오체)이 바르다
   · 아이 나이로 몫이 갈린다: 12·13살 어린아이 · 14~19살 청소년 · 20살 어른 · 5살 아래면 「아빠」 반말
   · 실제 발견 연출에서: 확률 100%로 두면 아내·자식이 부하들 뒤에 말한다 / 기본 5% — 여러 번 굴려 4~6% 언저리
   · 집에 있는(배에 타지 않은) 가족은 말하지 않는다 · 콘솔 오류 0
   node tests/famvoice_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.FamVoice && G.DiscVoice && G.Scenes.discoveryReveal, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 40, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const FV = G.FamVoice, s = G.Game.state, p = s.player, out = { bad: [] }, y = s.date.y;
      // 1) 자료
      const sents = t => t.split(/(?<=[.!?])\s+/).filter(Boolean);
      let n = 0;
      G.DISCOVERIES.forEach(d => {
        if (d.id === 'circum') return;
        const L = (G.DISC_FAM || {})[d.id];
        if (!L || L.length !== 4) { out.bad.push('없음 ' + d.id); return; }
        n++;
        L.forEach((t, i) => sents(t).forEach(x => {
          if (i === 3 ? !/(니다[.!]|니까\?)$/.test(x) : !(/요[.!?]$/.test(x) || (x.length <= 6 && /!$/.test(x)))) out.bad.push(d.id + '[' + i + '] …' + x.slice(-10));
        }));
      });
      out.n = n;
      // 2) 가족: 본처(배에 함께) + 아이 넷(4·12·16·25살, 모두 견습으로 탐) + 집에 있는 아이 하나
      const maid = Object.keys(G.MAID).find(id => !G.MAID[id].royal);
      p.wife = maid; p.wifeAboard = true;
      const kid = (name, sex, age, aboard) => ({ name, sex, born: { y: y - age, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, bond: 60, aboard });
      p.kids = [kid('아기', 'm', 4, true), kid('마리아', 'f', 12, true), kid('페드루', 'm', 16, true), kid('이사벨', 'f', 25, true), kid('집순이', 'f', 10, false)];
      const mem = FV.members();
      out.members = mem.map(m => m.kind + ':' + (m.k ? m.k.name + '/' + m.age + '→' + FV.slot(m) : m.id));
      const d = G.DISC.stonehenge || G.DISCOVERIES[0];
      out.lines = FV.reveal(d, { force: true }).map(x => x.speaker.name + ': ' + x.text);
      out.d = d.name; out.src = (G.DISC_FAM || {})[d.id] || ['', '', '', ''];
      // 3) 실제 발견 연출 (확률 100%)
      G.BALANCE.famVoice = { chance: 1, flavor: 0 };
      const said = [], oldSay = G.UI.say, oldTitle = G.FX.reveal.titleMs;
      G.FX.reveal.titleMs = 1; G.UI.say = async (t, who) => { said.push({ t: String(t), who: who && who.name }); };
      const pr = G.Scenes.discoveryReveal(d, 10);
      while (!document.querySelector('#ui .reveal')) await new Promise(r2 => setTimeout(r2, 10));
      document.querySelector('#ui .reveal').click();
      await pr;
      G.UI.say = oldSay; G.FX.reveal.titleMs = oldTitle;
      out.reveal = said.map(x => x.who + ': ' + x.t);
      // 4) 기본 확률 5%
      G.BALANCE.famVoice = {};
      let hits = 0, tries = 4000; for (let i = 0; i < tries; i++) hits += FV.reveal(d).length;
      out.rate = hits / (tries * mem.length);
      return out;
    });
    console.log('    가족: ' + r.members.join(' · '));
    console.log('    「' + r.d + '」 앞에서:\n      ' + r.lines.join('\n      '));
    console.log('    발견 연출 끝부분:\n      ' + r.reveal.slice(-6).join('\n      ').slice(0, 900));
    ok(!r.bad.length && r.n >= 1000, '발견물 ' + r.n + '개 모두 네 줄 · 끝맺음 바름' + (r.bad.length ? ' — ' + r.bad.length + '건: ' + r.bad.slice(0, 6).join(' / ') : ''));
    ok(r.members.length === 5 && r.members.join().indexOf('집순이') < 0, '배에 탄 가족만 (본처 + 견습 넷 — 집에 있는 아이는 빠짐)');
    ok(/아기\/4→1/.test(r.members.join()) && /마리아\/12→1/.test(r.members.join()) && /페드루\/16→2/.test(r.members.join()) && /이사벨\/25→3/.test(r.members.join()), '나이로 몫: 4·12살 어린아이 · 16살 청소년 · 25살 어른');
    ok(r.lines.length === 5 && r.lines[0].indexOf(r.src[0].slice(0, 12)) >= 0 && r.lines.some(l => l.indexOf(r.src[2].slice(0, 12)) >= 0) && r.lines.some(l => l.indexOf(r.src[3].slice(0, 12)) >= 0), '아내·청소년·어른은 그 발견물의 제 몫 대사');
    ok(r.lines.some(l => /^아기/.test(l) && /아빠/.test(l) && !/아버지/.test(l)) || !/아버지/.test(r.src[1]), '5살 아래는 「아빠」 반말로');
    ok(r.reveal.filter(x => r.src.some(t => x.indexOf(t.slice(0, 10)) >= 0) || /아빠/.test(x)).length >= 4, '실제 발견 연출에서 가족이 부하들 뒤에 말한다');
    ok(r.rate > 0.035 && r.rate < 0.065, '기본 확률 약 5% (' + (r.rate * 100).toFixed(1) + '%)');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
