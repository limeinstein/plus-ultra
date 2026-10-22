/* 동아시아 = 중국 · 조선 · 일본 (2026-10-22) — js/data/base.js G.subRegion · G.regionLabel · js/city/harbor.js 마을정보
   · 지역 이름: 「동아시아 · 중국」「동아시아 · 조선」「동아시아 · 일본」 · 나머지 지역은 그대로 · 지역 번호(규칙)는 그대로
   · 항구 「마을정보」: 동아시아 한 묶음 → 중국·조선·일본 → 그 나라 마을만
   · 도시 이름판·도시 정보에 「동아시아 · 조선」 · 콘솔 오류 0
   node tests/east_asia_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, f = n => G.CITY_DATA.find(c => c.name === n), out = {};
      out.labels = ['한양', '동래', '광주', '북경', '나가사키', '에도', '리스본', '말라카'].map(n => n + '=' + G.regionLabel(f(n)));
      out.reg6 = G.REGIONS[6]; out.reg9 = G.REGIONS[9];
      out.kr = G.CITY_DATA.filter(c => G.subRegion(c) === '조선').map(c => c.name);
      // 항구 마을정보 (광주에서)
      s.player.gold = 99999; s.known = [f('광주').id];
      const C = G.Scenes.city, H = C.B.harbor, asks = [];
      const say0 = C.say, mate0 = C.mate; C.say = async () => {}; C.mate = async () => {};
      const ch0 = G.UI.choose; let step = 0;
      G.UI.choose = async (t, opts) => {
        asks.push({ t, opts: opts.map(o => o.label + (o.desc ? '(' + o.desc + ')' : '') + (o.right ? ' ' + o.right : '')) });
        step++;
        if (step === 1) return 'ea';
        if (step === 2) return '조선';
        return null;
      };
      await H.townInfo(f('광주'));
      G.UI.choose = ch0; C.say = say0; C.mate = mate0;
      out.asks = asks;
      // 도시 이름판·도시 정보
      G.Game.go('city', { cityId: f('한양').id }); await new Promise(r => setTimeout(r, 2000)); document.querySelectorAll('.modal-back').forEach(m => m.remove()); G.Scenes.city.main(); await new Promise(r => setTimeout(r, 300));
      out.banner = [...document.querySelectorAll('.city-banner .meta')].map(x => x.textContent).join(' | ');
      out.info = G.CityInfo && G.CityInfo.html ? (G.CityInfo.html(f('나가사키')).match(/ci-sub">([^<]*)/) || [])[1] : null;
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 2500));
    ok(r.labels.join() === '한양=동아시아 · 조선,동래=동아시아 · 조선,광주=동아시아 · 중국,북경=동아시아 · 중국,나가사키=동아시아 · 일본,에도=동아시아 · 일본,리스본=이베리아,말라카=동남아시아', '지역 이름: 동아시아 · 중국/조선/일본 — 나머지는 그대로');
    ok(r.reg6 === '중국·조선' && r.reg9 === '일본' && r.kr.length === 6, '지역 번호 6은 「중국·조선」 (조선 도시 ' + r.kr.length + '곳: ' + r.kr.join('·') + ')');
    const a1 = r.asks[0], a2 = r.asks[1], a3 = r.asks[2];
    ok(a1 && a1.opts.some(x => /^동아시아\(중국 · 조선 · 일본\)/.test(x)) && !a1.opts.some(x => /^일본|^중국·조선/.test(x)), '마을정보: 동아시아 한 묶음 (중국 · 조선 · 일본) — 「일본」이 따로 나오지 않는다');
    ok(a2 && /동아시아 — 어느 나라/.test(a2.t) && a2.opts.map(x => x.split(' ')[0]).join() === '중국,조선,일본', '동아시아를 고르면 중국 · 조선 · 일본');
    ok(a3 && a3.opts.length >= 4 && a3.opts.every(x => /한양|동래|경주|평양|한산도|독도/.test(x)), '조선을 고르면 조선 마을만: ' + (a3 ? a3.opts.map(x => x.split(' ')[0]).join('·') : ''));
    ok(/동아시아 · 조선/.test(r.banner) && r.info === '동아시아 · 일본', '한양 이름판 「동아시아 · 조선」 · 나가사키 도시 정보 「동아시아 · 일본」');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
