/* 대화창(UI.say·UI.ask)의 꾸밈 태그 점검 — node tests/speech_html_smoke.js   (BROWSER_EXE=크롬 경로)
   · 흥정 물음처럼 글에 섞인 <b>·<br>·<span class="muted">는 꾸밈으로 보이고, 태그 글자가 화면에 나오지 않는다
   · 다른 태그(<img onerror> 등)와 이름 속 < > 는 글자 그대로 (실행되지 않는다)
   · 낯선 말(통역)로 들리는 글은 태그를 걷어 낸다. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const out = {}, grab = () => { const b = [...document.querySelectorAll('.dlg .body, .body')].pop(); return { text: b.textContent, html: b.innerHTML }; };
      window.__pwned = 0;
      // 1) 흥정 물음 (js/city/misc.js MK.checkoutDeal 과 같은 글)
      let p = G.UI.ask('이미 깎은 값은 <b>1,944</b>닢입니다. 회계 3의 셈으로 결제 전에 한 번 더 값을 깎아 보겠습니까?<br><span class="muted">추가 협상 3번 남음 · 거절당해도 먼저 정한 가격은 그대로입니다.</span>', [{ label: '한 번 더 흥정한다', value: 'deal' }, { label: '그만둔다', value: 'cancel' }], {});
      await new Promise(r => setTimeout(r, 300));
      out.ask = grab(); out.bold = !!document.querySelector('.askrow') && !![...document.querySelectorAll('b')].some(b => b.textContent === '1,944');
      out.muted = [...document.querySelectorAll('span.muted')].some(s => /추가 협상/.test(s.textContent));
      document.querySelector('.askrow button').click(); out.v = await p;
      // 2) 위험한 태그·이름 속 꺾쇠는 글자 그대로
      p = G.UI.say('선장 <img src=x onerror="window.__pwned=1"> 와 <해적> 이 왔다', {});
      await new Promise(r => setTimeout(r, 300));
      out.say = grab(); document.querySelector('.modal-back').click(); await p;
      // 3) 낯선 말: 태그를 걷어 낸다
      p = G.UI.say('<b>값</b>을 치르시오.<br>다음!', { li: 7, name: '상인' });
      await new Promise(r => setTimeout(r, 300));
      out.foreign = grab(); document.querySelector('.modal-back').click(); await p;
      out.pwned = window.__pwned;
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 1500));
    ok(!/<\/?b>|<br>|<span/.test(r.ask.text), '흥정 물음에 태그 글자가 보이지 않는다');
    ok(r.bold && r.muted, '<b> 값은 굵게, 안내는 흐린 글씨로');
    ok(r.v === 'deal', '단추는 그대로 동작');
    ok(/<img src=x/.test(r.say.text) && /<해적>/.test(r.say.text) && !r.pwned, '다른 태그·이름 속 꺾쇠는 글자 그대로, 실행되지 않음');
    ok(!/<\/?b>|<br>/.test(r.foreign.text), '낯선 말 글에도 태그 글자 없음');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과');
  } catch (e) { console.error('실패:', e.message, errors); process.exitCode = 1; } finally { await browser.close(); }
})();
