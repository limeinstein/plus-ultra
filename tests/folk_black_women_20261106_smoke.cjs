/* 흑인계 민족 발견물 여성 동료 15종 — node tests/folk_black_women_20261106_smoke.cjs */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

const ROOT = path.resolve(__dirname, '..');
const SPEC = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/folk_black_women_20261106_prompts.json'), 'utf8'));

function assetPath(key) { return path.join(ROOT, 'images', ...key.split('/')) + '.webp'; }

(async () => {
  assert.equal(SPEC.portraits.length, 15, '여성 후보 15종');
  const ids = new Set(), keys = [];
  for (const row of SPEC.portraits) {
    assert(!ids.has(row.folk), '민족 중복 없음: ' + row.folk);
    ids.add(row.folk);
    const base = 'portraits/mates/' + row.id;
    for (const key of [base, base + '_half']) {
      assert(fs.existsSync(assetPath(key)), '자산 존재: ' + key);
      assert(fs.statSync(assetPath(key)).size > 40000, '빈 파일 아님: ' + key);
      keys.push(key);
    }
  }

  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !/fonts|ERR_|Failed to load/.test(message.text())) errors.push(message.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.FolkJoin && G.Game.sceneName === 'title' && !G.Loader.shown(), null, { timeout: 120000 });

    const result = await page.evaluate(async rows => {
      G.State.newGame({ name: '초상 검수', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.date = { y: 1620, m: 6, d: 1 };
      const out = [];
      for (const row of rows) {
        const expected = 'portraits/mates/' + row.id;
        const faces = G.FolkJoin.faces(G.FOLK_JOIN[row.folk].style, 'f', row.folk);
        const woman = G.FolkJoin.make(G.DISC[row.folk], 'f');
        const man = G.FolkJoin.make(G.DISC[row.folk], 'm');
        const legacy = { id: 'old_' + row.folk, folk: row.folk, g: 'f', face: 'portraits/npc-roles/af/maid', halfKey: 'portraits/npc-roles/af/maid_half' };
        G.FolkJoin.fixPortrait(legacy);
        const loaded = await Promise.all([expected, expected + '_half'].map(key => new Promise(resolve => {
          const image = new Image();
          image.onload = () => resolve({ key, width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => resolve({ key, width: 0, height: 0 });
          image.src = G.Img.src(key);
        })));
        out.push({ folk: row.folk, expected, faces, woman: { face: woman.face, half: woman.halfKey }, man: man.face,
          legacy: { face: legacy.face, half: legacy.halfKey }, hasFace: G.Img.has(expected), hasHalf: G.Img.has(expected + '_half'), loaded,
          faceRig: !!G.PORTRAIT_FACES[expected], halfRig: !!G.PORTRAIT_FACES[expected + '_half'] });
      }
      return out;
    }, SPEC.portraits.map(({ folk, id }) => ({ folk, id })));

    for (const row of result) {
      assert(row.faces.includes(row.expected), row.folk + ' 전용 여성 얼굴 등록');
      assert(row.faces.includes(row.woman.face), row.folk + ' 새 여성 얼굴');
      assert.equal(row.woman.half, row.woman.face + '_half', row.folk + ' 같은 짝 무릎상');
      assert(!/^portraits\/mates\/fj_.*_f_v1$/.test(row.man), row.folk + ' 남성 초상은 여성 원화를 쓰지 않음');
      assert(row.faces.includes(row.legacy.face), row.folk + ' 옛 저장 얼굴 보정');
      assert.equal(row.legacy.half, row.legacy.face + '_half', row.folk + ' 옛 저장 무릎상 보정');
      assert(row.hasFace && row.hasHalf && row.faceRig && row.halfRig, row.folk + ' 매니페스트·얼굴 좌표 등록');
      assert.deepEqual(row.loaded.map(x => [x.width, x.height]), [[512, 512], [1024, 1536]], row.folk + ' 브라우저 디코드·해상도');
    }
    assert.deepEqual(errors, [], '콘솔 오류 0');
    console.log(`흑인계 민족 여성 후보 ${result.length}종: 전용 얼굴상 512x512 · 무릎상 1024x1536 · 옛 저장 보정 · 브라우저 디코드 통과`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
