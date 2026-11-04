/* 만든 사람들·출처 화면 — 타이틀과 설정에서 열리고 배포 고지가 빠지지 않는지 확인한다. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

function ok(value, message) {
  if (!value) throw new Error(message);
  console.log('  ✓ ' + message);
}

(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(message.text())) errors.push(message.text()); });
  try {
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', process.env.PAGE || 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Credits && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const titleButton = page.getByRole('button', { name: '만든 사람들 · 출처' }).first();
    ok(await titleButton.isVisible(), '타이틀 아래에 「만든 사람들 · 출처」 단추가 보인다');
    await titleButton.click();
    await page.waitForSelector('.credits');
    const view = await page.evaluate(() => ({
      headings: [...document.querySelectorAll('.credits h4')].map(e => e.textContent.trim()),
      rows: document.querySelectorAll('.credits-t tr').length,
      links: document.querySelectorAll('.credits a[target="_blank"][rel="noopener"]').length,
      text: document.querySelector('.credits').textContent
    }));
    ok(['게임', '효과음', '글꼴', '프로그램', '지도·자료', '명화'].every(x => view.headings.includes(x)), '여섯 갈래의 제작·출처 정보를 표시한다');
    ok(view.rows >= 20 && view.links >= 12, '세부 출처와 외부 원문 연결을 표시한다 (' + view.rows + '행 · 링크 ' + view.links + '개)');
    ok(/Loop of Good Hope/.test(view.text) && /THIRD_PARTY_NOTICES\.md/.test(view.text), '게임 이름과 전체 라이선스 문서 위치를 안내한다');
    await page.getByRole('button', { name: '닫기' }).last().click();
    await page.waitForFunction(() => !document.querySelector('.credits'));
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('\n통과');
  } catch (error) {
    console.error('✗ ' + error.message);
    if (errors.length) console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
