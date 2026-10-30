/* 대항해시대의 끝 — 1700년 1월 1일 (js/systems/eraend.js) — node tests/eraend_smoke.js
   2026-10-31 사용자 요청: 1700년 1월 1일이 되면 나레이션과 함께 게임이 끝난다 (시간의 Game Over).
   · 1699년 1월 1일 · 12월 1일에 귀띔 소식 · 1699년 12월 31일에서 여관에 닷새 묵어도 1700년 1월 1일에서 세월이 멈춘다
   · 도시에서 온 화면 나레이션(세 연 아홉 줄) → 「항해의 끝」 결산(대항해시대가 막을 내리다 · FINIS) → 타이틀
   · 같은 날 80세 수명이 다해도 시대의 끝이 먼저 (눈을 감는 창 없이) · 그날을 넘긴 저장을 바다에서 불러와도 끝난다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      G.UI.fade = async fn => { fn && fn(); };
      const out = {};
      const start = () => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.flags.prologue = true; s.contract = null;
        return s;
      };
      const clear = async () => {   // 도시에 들어올 때의 창들을 닫는다 (끝 장면은 건드리지 않는다)
        for (let i = 0; i < 120 && G.UI.busy() && !document.querySelector('.era-end'); i++) {
          const w = [...document.querySelectorAll('.modal-back')].pop(); const b = w && (w.querySelector('.foot button') || w.querySelector('.dlg')); if (b) b.click(); await sleep(30);
        }
      };
      // 1) 귀띔 소식
      let s = start();
      const lis = G.CITY_DATA.find(c => c.name === '리스본');
      s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat }; s.player.born = { y: 1669, m: 3, d: 3 };   // 서른 살 (1480년생이면 수명이 다한다)
      s.date = { y: 1698, m: 12, d: 31 }; out.y1 = G.Game.newDay().map(m => m.text).join(' / ');
      s.date = { y: 1699, m: 11, d: 30 }; out.m1 = G.Game.newDay().map(m => m.text).join(' / ');
      // 2) 1699년 12월 31일 리스본 — 닷새 묵는다
      s.date = { y: 1699, m: 12, d: 31 };
      G.Game.go('city', { cityId: lis.id }); await sleep(300); await clear();
      out.busyBefore = G.UI.busy();
      G.Game.passDays(5);
      out.date = G.U.dateNum(s.date); out.flag = !!s.eraEnd;
      G.Game.newDay(); out.date2 = G.U.dateNum(s.date);   // 더 흐르지 않는다
      // 3) loop의 tick이 막을 친다 — 첫 줄이 나올 때까지 기다린다
      let ov = null;
      for (let i = 0; i < 200 && !(ov = document.querySelector('.era-end')); i++) await sleep(20);
      out.overlay = !!ov; out.busy = G.UI.busy();
      if (!ov) return Object.assign(out, { dbg: [G.Game.sceneName, G.EraEnd.over(G.Game.state), !!G.EraEnd.running, G.Scenes.city.busy && G.Scenes.city.busy(), [...document.querySelectorAll('.modal-back')].map(w => w.innerText.slice(0, 60)).join('|')] });
      for (let i = 0; i < 300 && !(ov.querySelector('.ee-line.in')); i++) await sleep(20);
      out.firstLine = ov.querySelector('.ee-text').innerText.trim();
      out.dateLabel = ov.querySelector('.ee-date').textContent;
      ov.click(); await sleep(150); out.afterPoke = ov.querySelectorAll('.ee-line').length;   // 누르면 다음 줄로
      ov.querySelector('.ee-skip').click();
      for (let i = 0; i < 200 && ov.querySelector('.ee-next').hidden; i++) await sleep(20);
      out.lastLines = ov.querySelector('.ee-text').innerText.replace(/\s+/g, ' ').trim();
      out.finis = ov.querySelector('.ee-finis').textContent; out.dawn = ov.classList.contains('dawn');
      ov.querySelector('.ee-next').click();
      let fin = '';
      for (let i = 0; i < 200 && G.Game.sceneName !== 'title'; i++) {
        const w = [...document.querySelectorAll('.modal-back')].pop();
        if (w) { const t = w.innerText.replace(/\s+/g, ' '); if (/FINIS/.test(t)) { fin = t; const b = [...w.querySelectorAll('button')].find(x => /타이틀로/.test(x.textContent)); if (b) b.click(); } }
        await sleep(30);
      }
      out.fin = fin.slice(0, 160); out.scene = G.Game.sceneName; out.gone = !document.querySelector('.era-end');
      // 4) 같은 날 80세 — 시대의 끝이 먼저
      s = start(); s.player.kids = []; s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat };
      s.date = { y: 1699, m: 12, d: 31 }; s.player.born = { y: 1620, m: 1, d: 1 };
      G.Game.go('city', { cityId: lis.id }); await sleep(300); await clear();
      G.Game.passDays(1);
      out.lifeEnd = !!(s.life && s.life.end); out.flag4 = !!s.eraEnd;
      G.EraEnd.fast = true;
      let sawDeath = false, fin4 = '';
      for (let i = 0; i < 300 && G.Game.sceneName !== 'title'; i++) {
        const w = [...document.querySelectorAll('.modal-back')].pop();
        if (w) { const t = w.innerText.replace(/\s+/g, ' '); if (/눈을 감았다/.test(t)) sawDeath = true; if (/FINIS/.test(t)) fin4 = t; const b = [...w.querySelectorAll('button')].find(x => /타이틀로/.test(x.textContent)) || w.querySelector('.foot button'); if (b) b.click(); }
        await sleep(30);
      }
      out.sawDeath = sawDeath; out.fin4 = fin4.slice(0, 80); out.scene4 = G.Game.sceneName;
      // 5) 그날을 넘긴 옛 저장 — 바다에서
      s = start(); s.date = { y: 1712, m: 3, d: 3 }; s.player.born = { y: 1680, m: 5, d: 5 }; s.loc = { mode: 'sea', lon: -12, lat: 38, heading: 0 };
      G.Game.go('sea');
      let fin5 = '';
      for (let i = 0; i < 300 && G.Game.sceneName !== 'title'; i++) {
        const w = [...document.querySelectorAll('.modal-back')].pop();
        if (w) { const t = w.innerText.replace(/\s+/g, ' '); if (/FINIS/.test(t)) fin5 = t; const b = [...w.querySelectorAll('button')].find(x => /타이틀로/.test(x.textContent)) || w.querySelector('.foot button'); if (b) b.click(); }
        await sleep(30);
      }
      out.late = !!(s.eraEnd && s.eraEnd.late); out.date5 = G.U.dateNum(s.date); out.fin5 = /대항해시대가 막을 내리다/.test(fin5); out.scene5 = G.Game.sceneName;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(/한 해뿐/.test(r.y1) && /마지막 항해/.test(r.m1), '1699년 1월 1일 · 12월 1일 귀띔 소식');
    ok(!r.busyBefore && r.date === 17000101 && r.flag && r.date2 === 17000101, '1699-12-31에서 닷새 묵어도 1700년 1월 1일에서 세월이 멈춘다');
    ok(r.overlay && r.busy, '온 화면 나레이션이 뜨고 다른 창은 기다린다 (UI.busy)');
    ok(r.firstLine === '한때 우리의 미지는 수평선 너머에 있었다.' && r.dateLabel === '1700년 1월 1일', '첫 줄 「' + r.firstLine + '」 · ' + r.dateLabel);
    ok(r.afterPoke >= 2, '누르면 다음 줄로 (' + r.afterPoke + '줄)');
    ok(/대항해시대의 마지막 항해가 끝났다\. 다음 시대의 첫 번째 여명이 밝아오고 있었다\./.test(r.lastLines) && r.dawn && /FINIS/.test(r.finis), '건너뛰면 마지막 두 줄 · 여명 · FINIS');
    ok(/대항해시대가 막을 내리다/.test(r.fin) && /1700년 1월 1일/.test(r.fin) && r.scene === 'title' && r.gone, '「항해의 끝」 결산(대항해시대가 막을 내리다 · 1700년 1월 1일) → 타이틀');
    ok(r.lifeEnd && r.flag4 && !r.sawDeath && /대항해시대가 막을 내리다/.test(r.fin4) && r.scene4 === 'title', '같은 날 80세가 되어도 시대의 끝이 먼저 (눈을 감는 창 없이)');
    ok(r.late && r.date5 === 17120303 && r.fin5 && r.scene5 === 'title', '1712년 저장을 바다에서 불러와도 끝난다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
