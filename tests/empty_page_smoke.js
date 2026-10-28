/* 빈 대사창이 뜨지 않는다 (2026-10-26 — 여관 허드렛일을 마치면 여관 주인의 빈 대사창·빈 통역 창이 떴다)
   말 속 괄호 안내(명성·남은 날 같은 셈)는 알림으로 돌리는데, 한 쪽이 괄호 안내뿐이면 그 쪽이 빈 대사로 남았다.
   · UI.say: 괄호 안내뿐인 쪽·빈 쪽은 건너뛰고, 안내는 알림으로
   · 실제 여관 허드렛일(말이 서툰 도시, 부관이 통역): 뜬 대사창마다 글이 있다
   node tests/empty_page_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.UI && G.Scenes && G.Scenes.city, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const sleep = ms => new Promise(x => setTimeout(x, ms));
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, out = {};
      // 대사창이 뜰 때마다 본문 글을 모은다 (뜬 쪽마다 한 번), 그리고 넘긴다
      const shown = [];
      let stop = false;
      (async function pump() {
        while (!stop) {
          const b = document.querySelector('.dlg .body');
          if (b && !b.querySelector('.askrow')) {
            const txt = (b.textContent || '').replace('▼', '').trim(), it = document.querySelector('.dlg .interp .itext');
            const key = txt + '|' + (it ? it.textContent : '');
            if (shown[shown.length - 1] !== key) shown.push(key);
            await sleep(260); document.querySelector('.modal-back.catch') && document.querySelector('.modal-back.catch').click();
          }
          await sleep(40);
        }
      })();
      // 1) 쪽 단위
      await G.UI.say('첫 쪽입니다.\f(석 달 가운데 남은 날: 12일)\f\f마지막 쪽입니다.', { name: '시험' });
      out.unit = shown.slice(); shown.length = 0;
      await G.UI.say('(명성 +5)', { name: '시험' });   // 모두 안내뿐이면 원래 글을 그대로
      out.only = shown.slice(); shown.length = 0;
      // 2) 실제 여관 허드렛일 — 말이 서툰 도시(바르나 같은)에서 부관이 통역
      const c = G.CITY_DATA.find(x => x && x.port && x.lang != null && x.lang !== G.CITY_DATA[s.player.home].lang && !(x.founded > s.date.y));
      s.loc.mode = 'city'; s.loc.city = c.id;
      s.player.lg = s.player.lg || []; s.player.lg[c.lang] = 0;
      const first = s.mates.find(m => m.role === 'first');
      if (first) { const d = G.MATE[first.id]; d.lg = d.lg || []; d.lg[c.lang] = 3; }
      const ask = G.UI.ask; G.UI.ask = async () => 10;
      shown.length = 0;
      await G.Scenes.city.B.inn.work(c);
      G.UI.ask = ask; stop = true;
      out.work = shown.slice(); out.city = c.name; out.interp = !!first;
      out.relay = shown.filter(x => x.split('|')[1]).length;
      return out;
    });
    console.log('    쪽 단위: ' + JSON.stringify(r.unit));
    console.log('    안내뿐: ' + JSON.stringify(r.only));
    console.log('    통역 창 ' + r.relay + '쪽'); console.log('    ' + r.city + ' 여관 허드렛일: ' + r.work.map(x => x.slice(0, 50)).join(' / '));
    ok(r.unit.length === 2 && r.unit.every(x => x.split('|')[0]), '괄호 안내뿐인 쪽·빈 쪽은 건너뛴다 (' + r.unit.length + '쪽)');
    ok(r.only.length === 1 && /명성/.test(r.only[0]), '모든 쪽이 안내뿐이면 원래 글을 그대로 보인다');
    ok(r.work.length >= 2 && r.work.every(x => x.split('|')[0].length > 0), '여관 허드렛일을 마칠 때 빈 대사창이 없다 (' + r.work.length + '쪽)');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
