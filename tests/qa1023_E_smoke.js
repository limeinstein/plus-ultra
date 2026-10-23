/* QA 2026-10-23 E 그룹(UI·소리·자료) 고침 점검 — node tests/qa1023_E_smoke.js
   [18] 숫자판 Enter · [32] 설정 창 방향키·글자 크기 기억·수첩 지난 탭·일지 합치기 · [20] 사료 갈래 보존
   [35] 조선/일본 판정·대월사기전서 차례·유물 이름 중복·러시안 블루 자리 · [17] 말발굽 멈춤 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.CLUE, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    const r = await page.evaluate(async () => {
      const out = {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'adventurer', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      // [18] 숫자판 Enter
      const K = G.Keys, ev = code => ({ code, key: code === 'NumpadEnter' ? 'Enter' : code });
      out.np = [K.code(ev('NumpadEnter')), K.is(ev('NumpadEnter'), 'confirm'), K.is(ev('Enter'), 'confirm')];
      s.settings.keys.confirm = 'KeyZ';
      out.npRebound = [K.is(ev('NumpadEnter'), 'confirm'), K.is(ev('KeyZ'), 'confirm')];
      s.settings.keys.confirm = 'Enter';
      // [20] 사료 갈래: 데이터의 clue:'book'이 단서 이름에 덮이지 않는다
      const ids = 'huashan wuyishan lushan sanxia huangguoshu yulong tianchi yandang damavand'.split(' ');
      out.book = ids.filter(id => G.CLUE[id] !== 'book' || !G.BOOKS.some(b => b.discs.indexOf(id) >= 0));
      // [35a] 조선·일본
      const RG = G.LANDWAR_ART.regionOf;
      out.reg = [RG(129.083, 35.205), RG(129.219, 35.835), RG(131.866, 37.241), RG(129.3, 34.4), RG(130.4, 33.6), RG(126.98, 37.57), RG(139.7, 35.7)];
      // [35b] 연작 차례
      out.nanhai = G.CLUE_SERIES.nanhai.slice();
      out.mingAfter = G.BOOK.b_mingshi.after;
      // [35c] 유물 이름 중복
      const names = {}; Object.keys(G.RELIC).forEach(id => { const n = G.RELIC[id].name; (names[n] = names[n] || []).push(id); });
      out.dupRelic = ['춤추는 시바 청동상', '빙하 수정', '철갑상어 알 항아리', '화산탄'].filter(n => (names[n] || []).length > 1);
      // [35e] 러시안 블루: 노브고로드 1° 안 뭍
      const rb = G.DISC.russianblue, nv = G.CITY_DATA[rb.homeCity];
      out.rb = { home: nv && nv.name, d: G.Geo.dist(rb.lon, rb.lat, nv.lon, nv.lat), land: G.Game.geoReady ? G.Geo.isLand(rb.lon, rb.lat) : null };
      // [32c] 저장소를 못 쓰는 브라우저: 이번 판에 고른 크기
      G.Game._uiSizeMem = 'large'; out.uiSize = G.Game.uiSizePref(); delete G.Game._uiSizeMem;
      // [32e] 일지: 이름만 같은 다른 소식은 따로, 같은 일은 한 줄
      s.log = []; G.Journal.add('「리스본」에 입항했다', 'D'); G.Journal.add('「리스본」의 후추 값이 폭락했다', 'C');
      G.Journal.add('바르톨로메우 디아스: 「희망봉」 발견 발표', 'A'); G.Journal.add('바르톨로메우 디아스가 리스본에서 「아프리카 남단」의 발견을 발표했다. 그곳은 「희망봉」이라는 이름으로 불리게 되었다.', 'A');
      out.log = s.log.length;
      // [32d] 수첩 지난 탭: 다른 저장이면 제독 탭
      const tabOn = () => { const t = document.querySelector('.tabs .tab.on'); return t && t.textContent; };
      G.Info.open('hints'); await new Promise(r => setTimeout(r, 200)); document.querySelectorAll('.modal-back').forEach(e => e.remove());
      G.Info.open(); await new Promise(r => setTimeout(r, 200)); out.tabSame = tabOn(); document.querySelectorAll('.modal-back').forEach(e => e.remove());
      G.Game.state = G.State.newGame({ name: '시험2', nation: 'PT', job: 'adventurer', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Info.open(); await new Promise(r => setTimeout(r, 200)); out.tabOther = tabOn(); document.querySelectorAll('.modal-back').forEach(e => e.remove());
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.np[0] === 'Enter' && r.np[1] && r.np[2], '[18] 숫자판 Enter = Enter (확정)');
    ok(r.npRebound[0] && r.npRebound[1], '[18] 확정 키를 Z로 바꿔도 숫자판 Enter는 확정');
    ok(!r.book.length, '[20] 사료 전용 9곳이 사료 갈래로 남고 실린 책이 있다 ' + r.book.join(','));
    ok(r.reg.join() === 'korea,korea,korea,japan,japan,korea,japan', '[35a] 동래·경주·독도 조선 · 쓰시마·규슈 일본 — ' + r.reg.join());
    ok(r.nanhai.indexOf('b_daiviet') < r.nanhai.indexOf('b_mingshi') && r.mingAfter === 'b_daiviet', '[35b] 『대월사기전서』가 『명사』 앞 — ' + r.nanhai.join('→'));
    ok(!r.dupRelic.length, '[35c] 서로 다른 유물이 같은 이름을 쓰지 않는다 ' + r.dupRelic.join(','));
    ok(r.rb.home === '노브고르트' && r.rb.d < 1 && r.rb.land !== false, '[35e] 러시안 블루: 노브고로드에서 ' + r.rb.d.toFixed(2) + '° 뭍');
    ok(r.uiSize === 'large', '[32c] 저장소를 못 써도 이번 판에 고른 글자 크기');
    ok(r.log === 3, '[32e] 같은 날 이름만 같은 다른 소식은 따로, 머리글과 본문은 한 줄 (' + r.log + '줄)');
    ok(r.tabSame === '단서' && r.tabOther === '제독', '[32d] 수첩 지난 탭은 같은 항해에서만 (' + r.tabSame + ' → 다른 저장 ' + r.tabOther + ')');

    // [32b] 설정 창: 글자 크기(data-dsz)도 방향키로 고른다
    const sel = await page.evaluate(async () => {
      G.Info.settings(); await new Promise(r => setTimeout(r, 300));
      const seen = new Set();
      for (let i = 0; i < 80; i++) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
        const f = document.querySelector('.kbd-focus'); if (f) seen.add(Object.keys(f.dataset)[0] || f.className);
      }
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      return [...seen];
    });
    ok(sel.indexOf('dsz') >= 0 && sel.indexOf('dfont') >= 0, '[32b] 설정 창의 글자 크기·글꼴도 방향키로 (' + sel.join(',') + ')');

    // [17] 말을 멈추면(0) 말발굽 녹음이 곧장 줄어든다
    const hoof = await page.evaluate(async () => {
      const A = G.Audio; if (!A || !A.hasAmb || !A.hasAmb('gallop')) return { skip: true };
      if (A.unlock) A.unlock(); await new Promise(r => setTimeout(r, 300));
      if (!A.travel('horse', 1)) return { skip: 'ctx' };
      await new Promise(r => setTimeout(r, 1200));
      const on = (A.ambState().gallop || {}).cur;
      A.travel('horse', 0);
      await new Promise(r => setTimeout(r, 1200));
      return { on, off: (A.ambState().gallop || {}).cur };
    });
    if (hoof.skip) console.log('  · [17] 소리 상자가 없어 말발굽 점검은 건너뜀 (' + hoof.skip + ')');
    else ok(hoof.on > 0.2 && hoof.off < hoof.on * 0.5, '[17] 말을 멈추면 말발굽이 2.5초 기다리지 않고 줄어든다 (' + hoof.on + ' → ' + hoof.off + ')');

    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | '));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
