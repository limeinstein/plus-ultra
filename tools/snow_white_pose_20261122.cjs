/* 백설공주 돌아보는 초상: 내장 이미지 도구의 투명 원화를 게임 규격으로 내보낸다. */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('./procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const record = path.join(root, 'artifacts/snow-white-pose-20261122');
const variants = [
  ['portraits/legendary/snow_white_player', 512],
  ['portraits/legendary/snow_white', 448],
  ['portraits/fairy-tales/snow_white', 448]
];
async function main() {
  const source = path.join(record, 'generated.png');
  if (!fs.existsSync(source)) throw new Error('생성 원화가 없습니다: ' + source);
  const sourceURL = 'data:image/png;base64,' + fs.readFileSync(source).toString('base64');
  const executablePath = process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const outputs = await page.evaluate(async ({ sourceURL, variants }) => {
      const image = new Image(); image.src = sourceURL; await image.decode();
      if (image.width !== 1024 || image.height !== 1536) throw new Error('원화 규격이 다릅니다.');
      const half = document.createElement('canvas'); half.width = 1024; half.height = 1536;
      half.getContext('2d').drawImage(image, 0, 0);
      // 돌아보는 원화의 YuNet 얼굴 상자 [387.54, 131.61, 156.16, 228.12].
      // 앞서 줄인 얼굴 크기를 유지하면서 얼굴 중심을 가로 46%에 맞춘다.
      const side = 936, left = 35, top = -9;
      const face = document.createElement('canvas'); face.width = face.height = 512;
      face.getContext('2d').drawImage(image, -left * 512 / side, -top * 512 / side,
        image.width * 512 / side, image.height * 512 / side);
      const out = {};
      for (const [key, size] of variants) {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
        canvas.getContext('2d').drawImage(face, 0, 0, size, size);
        out['images/' + key + '.webp'] = canvas.toDataURL('image/webp', 0.94);
        out['images/' + key + '_half.webp'] = half.toDataURL('image/webp', 0.94);
      }
      return out;
    }, { sourceURL, variants });
    for (const [relative, dataURL] of Object.entries(outputs)) {
      const target = path.join(root, relative);
      const backup = path.join(record, 'before', relative);
      if (fs.existsSync(target) && !fs.existsSync(backup)) {
        fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(target, backup);
      }
      fs.writeFileSync(target, Buffer.from(dataURL.split(',')[1], 'base64'));
    }
    const master = path.join(root, 'artifacts/legendary-portraits/snow_white_player.png');
    const backupMaster = path.join(record, 'before/snow_white_player.png');
    if (!fs.existsSync(backupMaster)) fs.copyFileSync(master, backupMaster);
    fs.copyFileSync(source, master);
    console.log('백설공주 얼굴상·무릎상 6파일 적용, 기존 원화와 초상 백업 완료.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
