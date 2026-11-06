/* 얼굴 칸 대화의 긴 글 분할과 이름 없는 역사 내레이션을 확인한다.
   BROWSER_EXE=Chrome node tests/dialog_face_paging_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: {m:1,d:1}, st:{str:60,int:60,mar:60,cha:60}, sk:{}, lg:[], diff:'normal' });
      const who = { name: '긴 글 화자', noStand: true, portrait: G.Art.npcSpec('dialog-page-test', 'captain', 'ib', 'm') };
      const text = '첫 문장은 먼 항구에서 들은 소식을 차분히 전합니다. 둘째 문장은 항로와 바람의 변화를 설명합니다. 셋째 문장은 선원들이 준비한 식량과 식수를 확인합니다. 넷째 문장은 낯선 해안의 등불을 주의하라고 말합니다. 다섯째 문장은 다음 항구에서 다시 만나자는 약속으로 이어집니다. 여섯째 문장은 기록을 남겨 후대의 항해사가 같은 실수를 피하게 합니다.';
      const promise = G.UI.say(text, who);
      const pages = [], heights = [], faceSizes = [];
      for (let guard = 0; guard < 20; guard++) {
        await new Promise(r => setTimeout(r, 280));
        const box = document.querySelector('.modal-back .dlg');
        if (!box) break;
        const body = box.querySelector('.body');
        const face = box.querySelector('.pframe canvas, .pframe img');
        pages.push(body.textContent.replace(/▼/g, '').trim());
        heights.push(box.offsetHeight);
        faceSizes.push(face ? Math.round(face.getBoundingClientRect().height) : 0);
        box.closest('.modal-back').click();
      }
      await promise;
      const missing = G.Hist.speaker('ei_null');
      const unicode = G.Hist.speaker('없는 화자');
      return { pages, heights, faceSizes, missingName: missing.name, unicodeName: unicode.name };
    });
    ok(result.pages.length >= 2, '긴 얼굴 대사는 여러 쪽으로 나뉜다 (' + result.pages.length + '쪽)');
    ok(result.pages.join(' ').includes('첫 문장은') && result.pages.join(' ').includes('여섯째 문장은'), '첫 문장부터 마지막 문장까지 보존된다');
    ok(result.heights.every(h => h <= 170), '각 쪽이 얼굴 칸 높이 안에 들어간다 (' + result.heights.join(', ') + 'px)');
    ok(result.faceSizes.every(n => n >= 130 && n <= 250), '얼굴은 대화창 높이에 맞되 최대 크기를 넘지 않는다');
    ok(result.missingName == null, 'ei_null 같은 내부 ID는 이름표로 표시하지 않는다');
    ok(result.unicodeName === '없는 화자', '실제 비ASCII 화자 이름은 그대로 보존한다');
    ok(errors.length === 0, 'pageerror·console.error 0');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
