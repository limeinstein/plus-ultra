/* 내장 ImageGen 원화를 보존하고 게임용 WebP·비교판을 만든다.
   NODE_PATH에 sharp가 있는 환경에서 node tools/package_imjin_portraits.js
   일부 인물만 다시 내보내려면 뒤에 ID를 붙인다: node tools/package_imjin_portraits.js yisunsin */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const specPath = path.join(__dirname, 'imjin_portrait_prompts.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const ART = path.join(ROOT, 'artifacts', 'imjin-portraits-20261030');
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');
const resolve = p => path.isAbsolute(p) ? p : path.resolve(ROOT, p);
const grid = [];
const selected = new Set(process.argv.slice(2));
(async function () {
  fs.mkdirSync(ART, { recursive: true });
  for (let i = 0; i < spec.assets.length; i++) {
    const a = spec.assets[i];
    if (!selected.size || selected.has(a.id)) {
    if (a.reference_path) {
      const ref = path.join(ART, 'references', String(a.reference_number).padStart(2, '0') + '.png');
      fs.mkdirSync(path.dirname(ref), { recursive: true });
      if (!fs.existsSync(ref)) fs.copyFileSync(resolve(a.reference_path), ref);
      a.reference_path = rel(ref);
    }
    for (const kind of ['half', 'face']) {
      const source = resolve(a[kind + '_source']);
      const preserved = path.join(ART, 'sources', a.id + '_' + kind + '.png');
      fs.mkdirSync(path.dirname(preserved), { recursive: true });
      if (source !== preserved) fs.copyFileSync(source, preserved);
      a[kind + '_source'] = rel(preserved);
      const dest = path.join(ROOT, 'images', 'portraits', a.key + (kind === 'half' ? '_half' : '') + '.webp');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const backup = path.join(ART, 'before', path.relative(path.join(ROOT, 'images'), dest));
      if (fs.existsSync(dest) && !fs.existsSync(backup)) {
        fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(dest, backup);
      }
      await sharp(preserved).resize(kind === 'half' ? 1024 : 1024, kind === 'half' ? 1536 : 1024,
        { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 95, alphaQuality: 100, effort: 6 }).toFile(dest);
      a[kind + '_file'] = rel(dest);
      const meta = await sharp(dest).metadata();
      if (!meta.hasAlpha) throw new Error(a.name + ' 투명도 누락');
    }
    }
    const x = (i % 5) * 320, y = Math.floor(i / 5) * 520;
    grid.push({ input: await sharp(resolve(a.half_file)).resize(280, 420, { fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: x + 20, top: y + 8 });
    grid.push({ input: await sharp(resolve(a.face_file)).resize(116, 116).png().toBuffer(), left: x + 196, top: y + 380 });
    const label = Buffer.from('<svg width="320" height="36"><text x="20" y="26" fill="#e9debd" font-family="Malgun Gothic" font-size="22">' + a.name + '</text></svg>');
    grid.push({ input: label, left: x, top: y + 470 });
  }
  // 기존 등록 내용은 유지하며 새 역사 인물 그림만 덧붙인다.
  const manifest = path.join(ROOT, 'images', 'manifest.js');
  let manifestText = fs.readFileSync(manifest, 'utf8').replace(/\r\n/g, '\n');
  const match = /G\.IMAGE_FILES = (\{[\s\S]*?\});/.exec(manifestText);
  if (!match) throw new Error('그림 목록 형식 확인 필요');
  const files = JSON.parse(match[1]);
  for (const a of spec.assets) for (const kind of ['face', 'half']) {
    const file = a[kind + '_file'].replace(/^images\//, '');
    files[file.replace(/\.webp$/, '')] = file;
  }
  const sorted = Object.fromEntries(Object.keys(files).sort().map(k => [k, files[k]]));
  manifestText = manifestText.replace(match[0], 'G.IMAGE_FILES = ' + JSON.stringify(sorted, null, 2) + ';');
  fs.writeFileSync(manifest, manifestText);
  fs.mkdirSync(path.join(ROOT, 'docs', 'art'), { recursive: true });
  await sharp({ create: { width: 1600, height: 1560, channels: 3, background: '#25292b' } })
    .composite(grid).jpeg({ quality: 92 }).toFile(path.join(ROOT, 'docs', 'art', 'imjin-portraits-preview.jpg'));
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n');
  console.log('15명 얼굴상·무릎상 30장, 원화·참고·기존 그림 보관, 비교판 생성');
})().catch(e => { console.error(e); process.exitCode = 1; });
