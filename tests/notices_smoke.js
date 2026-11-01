/* 알림 정리 (2026-11-01 사용자 요청 — 갈색 쪽지가 얼굴·화면을 가린다) — node tests/notices_smoke.js
   ① 등급: 여느 소식은 작은 카드(t-line) · 느낌표·위험은 큰 카드(t-big) · 비가 오고 그침·노 젓기(state)와 먼 해전 소문(quiet)은 띄우지 않고 「지난 소식」에만
   ② 한 자리: 도시 = 윗줄 아래(top) · 창이 열리면 왼쪽 아래(corner) · 바다 = 아래 단추줄 위(sea) · 한꺼번에 둘까지
   ③ 대화 중 보류: 말하는 동안 온 소식은 띄우지 않고 나침반 단추에 수 → 대화가 끝나면 띄운다
   ⑤ 읽는 시간: 짧은 말 2.5초 · 긴 말은 더 오래(8초까지) · 누르면 닫힌다 · 같은 말은 1분 안에 다시 띄우지 않는다 · 나침반 단추 = 지난 소식 · 바람 판에 비 · 콘솔 오류 0 */
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
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.route(/^https?:\/\//, r => r.fulfill({ status: 204, body: '' }));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const UI = G.UI, out = {};
      UI.fade = async fn => { fn && fn(); };
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true;
      G.Game.go('city', { cityId: 0 }); await sleep(600);
      for (let i = 0; i < 60 && UI.busy(); i++) { const w = [...document.querySelectorAll('.modal-back')].pop(); const b = w && (w.querySelector('.foot button') || w.querySelector('.dlg')); if (b) b.click(); await sleep(40); }
      await sleep(400);
      const box = () => document.querySelector('#ui > .toasts');
      const shown = () => [...box().children].filter(x => !x.classList.contains('out')).map(x => x.className + '|' + x.innerText.trim());
      box().innerHTML = '';
      // ① 등급
      UI.toast('교역소에서 후추를 샀다.', 'coin');
      UI.toast('해적이 나타났다!', 'skull');
      UI.toast('소나기가 내리기 시작했다. — 비 대책: 작업 계속', 'drop');
      UI.toast('교황령 함대와 덴마크 함대가 외레순 해협에서 맞붙었다는 소식이 들려온다.', 'cannon');
      UI.toast('비가 그쳤다. 젖은 돛과 옷을 말린다.', 'sun');
      await sleep(50);
      // 도시 진입 안내는 장면 초기화 속도에 따라 0.6초 뒤 도착할 수 있다.
      // 알림 등급 자체를 검증하는 이 항목에서는 게임 안내를 제외한다.
      out.tiers = shown().filter(x => !/\|거리 —/.test(x)); out.zoneCity = box().getAttribute('data-zone');
      out.recent = UI.recentNotices().map(x => x.tier + ':' + x.text.slice(0, 8));
      // 한꺼번에 둘(큰 일이 끼면 셋)까지
      UI.toast('첫째 소식', 'scroll'); UI.toast('둘째 소식', 'scroll'); UI.toast('셋째 소식', 'scroll');
      await sleep(50); out.count = shown().length; out.bigKept = shown().some(x => /해적/.test(x));
      // 같은 말은 1분 안에 다시 띄우지 않는다
      box().innerHTML = '';
      UI.toast('교역소에서 후추를 샀다.', 'coin'); await sleep(30); out.repeat = shown().length;
      // ⑤ 누르면 닫힌다 · 길이에 맞춘 시간
      box().innerHTML = '';
      UI.toast('짧은 말', 'scroll');
      UI.toast('아주 긴 소식입니다. '.repeat(8), 'scroll');
      await sleep(30); [...box().children][0].click(); await sleep(600);
      out.afterClick = shown().map(x => x.split('|')[1].slice(0, 6)).filter(x => !/^거리/.test(x));   // 거리 안내(게임이 띄움)는 빼고
      await sleep(3200); out.longStill = shown().some(x => /아주 긴/.test(x));
      // ② 창이 열리면 왼쪽 아래
      box().innerHTML = '';
      const w = UI.window({ title: '시험 창', html: '창', buttons: [{ label: '닫기', value: 1 }] });
      await sleep(50); UI.toast('창 위의 소식', 'scroll'); await sleep(30); out.zoneWin = box().getAttribute('data-zone');
      w.close(); await sleep(100);
      // ③ 대화 중 보류
      box().innerHTML = '';
      const talk = UI.say('제독, 할 말이 있습니다.', G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {});
      await sleep(250);
      UI.toast('대화 중 온 소식', 'scroll'); await sleep(50);
      out.duringTalk = shown().length; out.badge = (document.querySelector('.hud .notice-btn .nb-n') || {}).textContent || '';
      const d = document.querySelector('.dlg'); if (d) d.click(); await talk; await sleep(900);
      out.afterTalk = shown().map(x => x.split('|')[1]); out.badgeAfter = (document.querySelector('.hud .notice-btn .nb-n') || {}).textContent || '';
      // 나침반 단추 = 지난 소식
      box().innerHTML = '';
      document.querySelector('.hud .notice-btn').click(); await sleep(200);
      const lw = [...document.querySelectorAll('.modal-back')].pop();
      out.list = lw ? lw.innerText.replace(/\s+/g, ' ').slice(0, 3000) : '';
      if (lw) lw.querySelector('.foot button').click(); await sleep(200);
      // ② 바다 · 바람 판의 비
      G.Game.go('sea', { depart: 0 }); await sleep(1200);
      for (let i = 0; i < 40 && UI.busy(); i++) { const w2 = [...document.querySelectorAll('.modal-back')].pop(); const b = w2 && (w2.querySelector('.foot button') || w2.querySelector('.dlg')); if (b) b.click(); await sleep(40); }
      s.rain = s.rain || {}; s.rain.lv = 1; s.rain.order = s.rain.order || 'work';
      box().innerHTML = '';
      UI.toast('적도를 넘었다.', 'compass'); await sleep(400);
      out.zoneSea = box().getAttribute('data-zone');
      const tb = box().getBoundingClientRect(), bar = (document.querySelector('.sailbar') || {}).getBoundingClientRect ? document.querySelector('.sailbar').getBoundingClientRect() : null;
      out.seaBottom = Math.round(tb.bottom); out.barTop = bar ? Math.round(bar.top) : null;
      for (let i = 0; i < 60 && !/소나기/.test((document.querySelector('.windbox .wtxt') || {}).innerText || ''); i++) await sleep(100);
      out.wind = (document.querySelector('.windbox .wtxt') || {}).innerText || '';
      // ④ 한 줄 · 상태판 접기
      box().innerHTML = '';
      UI.toast('아주 긴 여느 소식 '.repeat(10), 'scroll'); await sleep(60);
      const ln = box().querySelector('.t-line .tt'); out.lineH = ln ? Math.round(ln.getBoundingClientRect().height) : 0;
      const ss = document.querySelector('.status-strip'); out.ssClosed = Math.round(ss.getBoundingClientRect().height);
      ss.classList.add('open'); await sleep(30); out.ssOpen = Math.round(ss.getBoundingClientRect().height); ss.classList.remove('open');
      // ⑥ 설정
      const st = s.settings;
      st.noticeSize = 'small'; st.noticePos = 'top'; UI.noticeSettings(); box().innerHTML = '';
      UI.toast('설정 시험 소식', 'scroll'); await sleep(40);
      out.setZone = box().getAttribute('data-zone'); out.setSize = box().getAttribute('data-size');
      st.noticeHideLine = true; box().innerHTML = '';
      UI.toast('숨길 여느 소식', 'scroll'); UI.toast('큰 일이다!', 'skull'); await sleep(40);
      out.hideLine = [...box().children].map(x => x.innerText.trim());
      st.statusOpen = true; UI.noticeSettings(); await sleep(30); out.ssAlways = Math.round(document.querySelector('.status-strip').getBoundingClientRect().height);
      G.State.rememberSettings(st); out.pref = localStorage.getItem(Object.keys(localStorage).find(k => /pref/i.test(k)) || '') || '';
      st.noticeSize = 'normal'; st.noticePos = 'auto'; st.noticeHideLine = false; st.statusOpen = false; UI.noticeSettings(); G.State.rememberSettings(st);
      // 설정 창에 보인다
      G.Info.settings(); await sleep(300);
      const sw = [...document.querySelectorAll('.modal-back')].pop(); out.settingsUi = sw ? /알림/.test(sw.innerText) && /항해 상태판/.test(sw.innerText) && /큰 일만 띄움/.test(sw.innerText) : false;
      if (sw) { const x = sw.querySelector('.title .x'); if (x) x.click(); }
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.tiers.length === 2 && /t-line\|교역소/.test(r.tiers[0]) && /t-big\|해적/.test(r.tiers[1]), '여느 소식 = 작은 카드 · 느낌표·위험 = 큰 카드');
    ok(r.recent.filter(x => /^state:/.test(x)).length === 2 && r.recent.some(x => /^quiet:/.test(x)), '비가 오고 그침(state) · 먼 해전 소문(quiet)은 띄우지 않고 지난 소식에만');
    ok(r.zoneCity === 'top', '도시: 윗줄 바로 아래');
    ok(r.count === 3 && r.bigKept, '한꺼번에 둘까지 — 큰 일이 끼면 셋 (큰 일은 남긴다)');
    ok(r.repeat === 0, '같은 말은 1분 안에 다시 띄우지 않는다');
    ok(r.afterClick.length === 1 && /아주 긴/.test(r.afterClick[0]) && r.longStill, '누르면 닫힌다 · 긴 말은 3초가 지나도 남아 있다');
    ok(r.zoneWin === 'corner', '창이 열려 있으면 왼쪽 아래');
    ok(r.duringTalk === 0 && r.badge === '1', '대화 중 온 소식은 띄우지 않고 나침반 단추에 수(1)');
    ok(r.afterTalk.some(x => /대화 중 온 소식/.test(x)) && r.badgeAfter === '', '대화가 끝나면 띄우고 수를 지운다');
    ok(/지난 소식/.test(r.list) && /먼 소문/.test(r.list) && /상태/.test(r.list) && /해적이 나타났다/.test(r.list), '나침반 단추 = 지난 소식 (상태·먼 소문도)');
    ok(r.zoneSea === 'sea' && (r.barTop == null || r.seaBottom <= r.barTop), '바다: 아래 단추줄 바로 위 (' + r.seaBottom + ' ≤ ' + r.barTop + ')');
    ok(/소나기/.test(r.wind), '바람 판에 비 (' + r.wind.replace(/\s+/g, ' ') + ')');
    ok(r.lineH > 0 && r.lineH < 30, '④ 여느 소식은 한 줄 (높이 ' + r.lineH + 'px)');
    ok(r.ssClosed < 60 && r.ssOpen > r.ssClosed + 30, '④ 항해 상태판은 한 줄로 접히고 누르면 펼친다 (' + r.ssClosed + ' → ' + r.ssOpen + 'px)');
    ok(r.setZone === 'top' && r.setSize === 'small', '⑥ 설정: 늘 위 · 작게');
    ok(r.hideLine.length === 1 && /큰 일이다/.test(r.hideLine[0]), '⑥ 설정: 큰 일만 띄움');
    ok(r.ssAlways > 40, '⑥ 설정: 상태판 늘 펼침 (' + r.ssAlways + 'px)');
    ok(/noticeSize/.test(r.pref) && /statusOpen/.test(r.pref), '⑥ 설정은 다음 판에도 남는다');
    ok(r.settingsUi, '⑥ 수첩 설정에 「알림」·「항해 상태판」');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
