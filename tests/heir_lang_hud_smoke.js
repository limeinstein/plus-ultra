/* 후계자의 언어 표시 (2026-11-11 피드백) — js/main.js H.lang · H.langTip · Game.refreshHud
   1세가 아랍어 3단계로 바스라에서 물러나면, 2세(아랍어 1단계)의 도시 윗줄 「언어」가 ●●●로 남아 있었다:
   Game.refreshHud가 언어 칸만 다시 그리지 않아, 도시에 다시 들어올 때까지 선대의 단계가 보였다.
   · 세대 교체 뒤 바로 ●○○ · 말 공부로 단계가 오르면 바로 ●●○
   · 부관·통역 덕에 오른 단계는 파란 점(b.team)으로 나누고, 마우스를 올리면 「제독 본인 ○ · 일행 ○ (누가 통역)」
   node tests/heir_lang_hud_smoke.js */
'use strict';
const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    const r = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.date = { y: 1520, m: 3, d: 1 }; s.settings.res = 0.35;
      const R = G.R, F = G.Family, out = {};
      const hud = () => { const c = document.querySelector('.hud [data-k="lang"]'); return c ? { text: c.querySelector('span').innerText, team: (c.querySelector('b.team') || {}).innerText || '', tip: c.title } : null; };
      const bas = G.CITY_DATA.find(c => c && c.name === '바스라');
      s.player.lg[5] = 3;
      G.Game.go('city', { cityId: bas.id }); await wait(2500);
      document.querySelectorAll('.modal-back button').forEach(b => b.click());
      out.gen1 = hud();
      const k = { name: '아들', given: '아들', sex: 'm', born: { y: 1500, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, edu: {}, bond: 50, met: true };
      s.player.kids = [k];
      const UI = G.UI; UI.alert = async () => 1; UI.confirm = async () => true; UI.say = async () => 1; UI.prompt = async (t, d) => d || 'x';
      F.askSurname = async () => '';
      let done = false; const pr = F.succeed(k, false).then(() => { done = true; });
      for (let i = 0; i < 300 && !done; i++) { await wait(100); const mb = [...document.querySelectorAll('.modal-back')].pop(); if (mb) { const bs = mb.querySelectorAll('button'); if (bs.length) bs[bs.length - 1].click(); } }
      await pr;
      out.gen2 = { gen: s.player.generation, own: s.player.lg[5], eff: R.lang(5), hud: hud() };
      // 말 공부로 2단계
      s.player.lg[5] = 2; G.Game.refreshHud(); out.study = hud();
      // 부관이 아랍어를 능숙하게 한다
      const first = s.mates.find(m => m.role === 'first');
      if (first) { first.lgx = Object.assign({}, first.lgx, { 5: 3 }); G.Game.refreshHud(); out.mate = { name: G.MATE[first.id].name, hud: hud() }; }
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.gen1 && /아랍어\s*●●●/.test(r.gen1.text) && !r.gen1.team, '1세 아랍어 3단계: ●●● (모두 제독 본인)');
    ok(r.gen2.gen === 2 && r.gen2.own === 1 && r.gen2.eff === 1, '2세는 아랍어 1단계 (선대의 절반)');
    ok(/아랍어\s*●○○/.test(r.gen2.hud.text) && /제독 본인 기초/.test(r.gen2.hud.tip), '세대 교체 뒤 바로 ●○○ — 선대의 ●●●가 남지 않는다: ' + r.gen2.hud.text);
    ok(/아랍어\s*●●○/.test(r.study.text), '말 공부로 오르면 바로 ●●○');
    ok(r.mate && r.mate.hud.team === '●' && /일행 /.test(r.mate.hud.tip) && r.mate.hud.tip.indexOf(r.mate.name) >= 0, '부관 덕에 오른 단계는 파란 점, 설명에 「' + (r.mate && r.mate.hud.tip) + '」');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
