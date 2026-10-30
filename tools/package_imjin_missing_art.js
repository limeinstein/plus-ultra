/* 내장 ImageGen 원화로 임진왜란 조연 초상·사건 그림을 내보낸다.
   sharp가 있는 환경에서 node tools/package_imjin_missing_art.js */
'use strict';
const fs = require('fs'), path = require('path'), sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const SPEC = path.join(__dirname, 'imjin_missing_art_20261031.json');
const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
const ART = path.join(ROOT, 'artifacts', 'imjin-missing-art-20261031');
const absolute = p => path.isAbsolute(p) ? p : path.join(ROOT, p);
const relative = p => path.relative(ROOT, p).replace(/\\/g, '/');
function preserve(source, name) {
  const src = absolute(source), dest = path.join(ART, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (src !== dest) fs.copyFileSync(src, dest);
  return relative(dest);
}
async function exportImage(source, file, width, height, transparent) {
  const src = absolute(source), dest = absolute(file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(src).resize(width, height, { fit: transparent ? 'contain' : 'cover',
    position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 95, alphaQuality: 100, effort: 4 }).toFile(dest);
  const m = await sharp(dest).metadata();
  if (m.width !== width || m.height !== height || (transparent && !m.hasAlpha)) throw Error('규격·투명도: ' + file);
}
function label(text, width) {
  return Buffer.from('<svg width="' + width + '" height="38"><text x="12" y="27" fill="#eee1bd" font-family="Malgun Gothic" font-size="22">' + text + '</text></svg>');
}
(async function () {
  const keys = {}, portraits = [], scenes = [];
  for (let i = 0; i < spec.portraits.length; i++) {
    const a = spec.portraits[i];
    for (const kind of ['half', 'face']) {
      a[kind + '_source'] = preserve(a[kind + '_source'], 'sources/' + a.id + '_' + kind + '.png');
      const key = a.key + (kind === 'half' ? '_half' : '');
      const file = 'images/' + key + '.webp';
      await exportImage(a[kind + '_source'], file, 1024, kind === 'half' ? 1536 : 1024, true);
      a[kind + '_file'] = file; keys[key] = file.replace(/^images\//, '');
    }
    const x = i % 4 * 320, y = Math.floor(i / 4) * 520;
    portraits.push({ input: await sharp(absolute(a.half_file)).resize(280, 420, { fit: 'contain', background: '#25292b' }).png().toBuffer(), left: x + 20, top: y });
    portraits.push({ input: await sharp(absolute(a.face_file)).resize(112, 112).png().toBuffer(), left: x + 200, top: y + 378 });
    portraits.push({ input: label(a.name, 320), left: x, top: y + 475 });
  }
  for (let i = 0; i < spec.scenes.length; i++) {
    const a = spec.scenes[i];
    a.source = preserve(a.source, 'sources/' + a.id + '.png');
    for (const ref of a.references) ref.source = preserve(ref.source, 'references/' + ref.id + '.png');
    const key = 'legend-events/' + a.id; a.file = 'images/' + key + '.webp';
    await exportImage(a.source, a.file, 1881, 836, false); keys[key] = a.file.replace(/^images\//, '');
    const x = i % 2 * 800, y = Math.floor(i / 2) * 395;
    scenes.push({ input: await sharp(absolute(a.file)).resize(788, 350).png().toBuffer(), left: x + 6, top: y });
    scenes.push({ input: label(a.name, 800), left: x, top: y + 353 });
  }
  const manifest = path.join(ROOT, 'images', 'manifest.js');
  let text = fs.readFileSync(manifest, 'utf8').replace(/\r\n/g, '\n');
  const match = /G\.IMAGE_FILES = (\{[\s\S]*?\});/.exec(text);
  if (!match) throw Error('그림 목록 형식');
  const files = Object.assign(JSON.parse(match[1]), keys);
  const sorted = Object.fromEntries(Object.keys(files).sort().map(k => [k, files[k]]));
  fs.writeFileSync(manifest, text.replace(match[0], 'G.IMAGE_FILES = ' + JSON.stringify(sorted, null, 2) + ';'));
  const docs = path.join(ROOT, 'docs', 'art'); fs.mkdirSync(docs, { recursive: true });
  await sharp({ create: { width: 1280, height: 1040, channels: 3, background: '#25292b' } }).composite(portraits).jpeg({ quality: 92 }).toFile(path.join(docs, 'imjin-missing-portraits-preview.jpg'));
  await sharp({ create: { width: 1600, height: Math.ceil(spec.scenes.length / 2) * 395, channels: 3, background: '#25292b' } }).composite(scenes).jpeg({ quality: 92 }).toFile(path.join(docs, 'imjin-event-shots-preview.jpg'));
  fs.writeFileSync(SPEC, JSON.stringify(spec, null, 2) + '\n');
  console.log('조연 ' + spec.portraits.length + '명 초상 ' + spec.portraits.length * 2 + '장, 이벤트샷 ' + spec.scenes.length + '장 저장·등록·비교판 완료');
})().catch(e => { console.error(e); process.exitCode = 1; });
