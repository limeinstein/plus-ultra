/* 갑판 위의 오호장군 (2026-10-24) — node tests/fivetigers_smoke.js   (BROWSER_EXE=크롬 경로)
   · 관우·장비·아토스·포르토스·아라미스가 함께 탄 지 30일이 지나면 바다의 하루에 벌어진다 (넷뿐이면 안 벌어진다)
   · 장비: 아라미스는 조자룡(걔가 좀 생겼지) · 포르토스는 마초 · 아토스는 황충 → 관우가 「이 배의 오호장군」 표
   · 돈키호테가 있으면 끼어들어 황충 자리를, 아토스는 유비(맏형) · 달타냥은 강유 · 끝나면 능력치 조금 ↑ · 한 번만
   · 저장·불러오기 뒤에도 오른 능력치 · 새 게임이면 본래 값 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Tigers && G.Tigers.hooked, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], out = {};
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + (o.partner ? '→' + o.partner.name : '') + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.ask = async () => null;
      const fresh = (ids) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; ids.forEach(id => s.mates.push({ id, loyal: 70 })); s.loc = { mode: 'sea', lon: -12, lat: 38 }; return s;
      };
      const ch0 = G.U.chance; G.U.chance = () => true;
      const base = id => G.MATE[id].st.slice();
      const before = { athos: base('athos'), aramis: base('aramis'), dq: base('don_quixote'), guan: base('guan_yu') };
      // 넷뿐이면 안 벌어진다
      let s = fresh(['guan_yu', 'zhang_fei', 'athos', 'porthos']);
      s.day = 100; G.Tigers.track(); s.day = 200;
      out.four = await G.Tigers.seaDay();
      // 다섯이 탄다 — 30일 전에는 안 벌어지고, 지나면 바다의 하루에 벌어진다
      s = fresh(['guan_yu', 'zhang_fei', 'athos', 'porthos', 'aramis']);
      s.day = 10; out.early = await G.Romance.seaDay();
      s.day = 45; said.length = 0;
      out.played = await G.Romance.seaDay();
      out.lines = said.slice();
      out.statAthos = G.MATE.athos.st.slice(); out.statAramis = G.MATE.aramis.st.slice();
      out.again = await G.Tigers.seaDay();
      out.log = s.log.map(x => x.t).find(t => /오호장군/.test(t)) || '';
      out.loyal = s.mates.find(m => m.id === 'aramis').loyal;
      // 저장 → 새 게임 → 불러오기
      const json = G.State.serialize();
      s = fresh([]); out.reset = G.MATE.athos.st.join() === before.athos.join();
      G.Game.state = G.State.deserialize(json); G.Siblings.apply();
      out.reload = G.MATE.athos.st.join();
      // 돈키호테·달타냥도 탄 판
      s = fresh(['guan_yu', 'zhang_fei', 'athos', 'porthos', 'aramis', 'don_quixote', 'd_artagnan']);
      s.day = 10; G.Tigers.track(); s.day = 60; said.length = 0;
      await G.Tigers.seaDay();
      out.linesQ = said.slice(); out.statDq = G.MATE.don_quixote.st.slice();
      G.U.chance = ch0;
      return Object.assign(out, { before });
    });
    const all = r.lines.join('\n'), allQ = r.linesQ.join('\n');
    console.log(r.lines.slice(5, 9).join('\n').slice(0, 600));
    ok(r.four === false, '넷(아라미스 없음)뿐이면 벌어지지 않는다');
    ok(!r.early && r.played, '다섯이 함께 탄 지 30일 전에는 없고, 지나면 바다의 하루에 벌어진다');
    ok(/장비→아라미스: .*조자룡.*걔가 좀 생겼지/.test(all), '장비가 아라미스에게 「넌 조자룡 감이다… 걔가 좀 생겼지」');
    ok(/마초/.test(all) && /황충/.test(all) && /도원결의/.test(all) && /모두는 하나를 위하여/.test(all), '포르토스는 마초, 아토스는 황충 · 도원결의와 총사의 맹세');
    ok(/이 배의 오호장군.*조운 \(자룡\)\s*아라미스.*마초\s*포르토스.*황충\s*아토스/.test(all.replace(/\n/g, ' ')), '관우가 정리한 표: 관우·장비 + 조운=아라미스 · 마초=포르토스 · 황충=아토스');
    ok(!/돈키호테/.test(all), '돈키호테가 없으면 끼어들지 않는다');
    ok(r.statAthos[2] === r.before.athos[2] + 1 && r.statAthos[3] === Math.min(100, r.before.athos[3] + 1) && r.statAramis[1] === r.before.aramis[1] + 1 && /능력치가 올랐다|지력 \+1/.test(all), '능력치가 조금 오른다 (아토스 무력·매력 +1, 아라미스 지력·무력 +1)');
    ok(r.again === false && /오호장군/.test(r.log) && r.loyal === 75, '한 번만 · 일지에 남는다 · 충성 +5');
    ok(r.reset && r.reload === [r.before.athos[0], r.before.athos[1], r.before.athos[2] + 1, Math.min(100, r.before.athos[3] + 1)].join(), '새 게임이면 본래 값, 불러오면 오른 능력치 그대로');
    ok(/돈키호테→장비: .*라 만차의 돈키호테가 빠질 수는 없소/.test(allQ) && /황충\s*돈키호테/.test(allQ.replace(/\n/g, ' ')) && /유비 \(맏형\)\s*아토스/.test(allQ.replace(/\n/g, ' ')), '돈키호테가 끼어들어 황충 자리를, 아토스는 맏형 유비 자리로');
    ok(/강유/.test(allQ) && /달타냥/.test(allQ) && r.statDq[3] === Math.min(100, r.before.dq[3] + 1), '달타냥은 강유 · 돈키호테도 능력치가 오른다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
