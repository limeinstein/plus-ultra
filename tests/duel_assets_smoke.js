/* 일기토 그림 묶음: PNG 규격·투명 셀·칸 넘침·매니페스트·메타데이터·그림 고르기를 브라우저 없이 점검한다.
   전투원 시트는 tools/duel_repack.py로 다시 짠 규격(js/data/duelart.js sheet)이어야 한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); }
function u32(b, at) { return b.readUInt32BE(at); }

function png(file, decode) {
  const b = fs.readFileSync(file);
  ok(b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), file + ': PNG 서명');
  let at = 8, width = 0, height = 0, depth = 0, color = 0, idat = [];
  while (at < b.length) {
    const n = u32(b, at), type = b.toString('ascii', at + 4, at + 8), data = b.subarray(at + 8, at + 8 + n);
    if (type === 'IHDR') { width = u32(data, 0); height = u32(data, 4); depth = data[8]; color = data[9]; }
    if (type === 'IDAT') idat.push(data);
    at += n + 12;
  }
  const out = { width, height, depth, color };
  if (!decode) return out;
  ok(depth === 8 && color === 6, file + ': RGBA 8비트여야 함');
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * 4, rows = Buffer.alloc(stride * height);
  let rp = 0;
  function paeth(a, c, d) { const p = a + c - d, pa = Math.abs(p - a), pc = Math.abs(p - c), pd = Math.abs(p - d); return pa <= pc && pa <= pd ? a : pc <= pd ? c : d; }
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++], row = rows.subarray(y * stride, (y + 1) * stride), prev = y ? rows.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const v = raw[rp++], left = x >= 4 ? row[x - 4] : 0, up = prev ? prev[x] : 0, ul = prev && x >= 4 ? prev[x - 4] : 0;
      row[x] = filter === 0 ? v : filter === 1 ? v + left : filter === 2 ? v + up : filter === 3 ? v + Math.floor((left + up) / 2) : v + paeth(left, up, ul);
    }
  }
  out.alpha = (x, y) => rows[y * stride + x * 4 + 3];
  out.maxAlpha = (x0, y0, w, h) => {
    let max = 0;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) max = Math.max(max, rows[y * stride + x * 4 + 3]);
    return max;
  };
  return out;
}

function gif(file) {
  const b = fs.readFileSync(file);
  ok(['GIF87a', 'GIF89a'].includes(b.toString('ascii', 0, 6)), file + ': GIF 서명');
  const width = b.readUInt16LE(6), height = b.readUInt16LE(8), packed = b[10];
  let at = 13 + ((packed & 0x80) ? 3 * (1 << ((packed & 7) + 1)) : 0), frames = 0;
  function blocks() { while (at < b.length) { const n = b[at++]; if (!n) break; at += n; } }
  while (at < b.length && b[at] !== 0x3b) {
    const tag = b[at++];
    if (tag === 0x21) { at++; blocks(); continue; }
    if (tag !== 0x2c) throw new Error(file + ': 알 수 없는 GIF 블록 ' + tag);
    frames++; at += 8; const ip = b[at++];
    if (ip & 0x80) at += 3 * (1 << ((ip & 7) + 1));
    at++; blocks();
  }
  return { width, height, frames };
}

const sandbox = { window: { G: {} } };
sandbox.G = sandbox.window.G;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data/seafx.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data/duelart.js'), 'utf8'), sandbox);
const art = sandbox.G.DUEL_ART;
ok(art && art.fighters.length === 24, '기본·전설 전투원 메타데이터는 24종이어야 함');
const S = art.sheet, CW = S.cell[0], CH = S.cell[1], DUST = 4;
ok(S.columns === 6 && S.rows === 4 && S.width === CW * 6 && S.height === CH * 4, '시트 크기 = 칸 × 6열·4행');
ok(S.pivot[0] > S.safeMargin && S.pivot[0] < CW && S.pivot[1] > S.safeMargin && S.pivot[1] < CH, '발밑 피벗은 칸 안');
ok(S.source && S.source.width === 1536 && S.source.height === 1024 && S.source.cell[0] === 256 && S.source.pivot[1] === 246, 'Codex 원본 규격 기록');
ok(art.sheet.animations.attack.frames === 6 && art.sheet.animations.defense.frames === 4 && art.sheet.animations.hit.frames === 3 && art.sheet.animations.action.frames === 6, '동작별 프레임 수');
const duelFx = sandbox.G.FX.duel, duelCode = fs.readFileSync(path.join(ROOT, 'js/games/duel.js'), 'utf8');
ok(duelFx.idleFrame === 0 && duelFx.breathRate <= 1.5 && duelFx.breathScale <= 0.002, '대기 자세는 고정하고 호흡만 느리고 작게');
ok(/return \[3, D\.idleFrame == null \? 0 : D\.idleFrame\]/.test(duelCode) && !/Math\.floor\(t \* 5\.5\) % 4/.test(duelCode), '대기 중 행동 프레임을 빠르게 순환하지 않음');

const fighterDir = path.join(ROOT, 'images/duel/fighters');
// 제독 생김새 시트(이강희 = ganghui 등): 21종 밖의 파일이 있으면 같은 규격으로 점검 — 없으면 main_admiral로 대신 나온다
const heroes = fs.readdirSync(fighterDir).filter(n => /\.png$/.test(n)).map(n => n.slice(0, -4)).filter(id => !art.fighters.some(f => f.id === id));
const allFighters = art.fighters.concat(heroes.map(id => ({ id })));
for (const f of allFighters) {
  const file = path.join(fighterDir, f.id + '.png'), im = png(file, true);
  ok(im.width === S.width && im.height === S.height, f.id + ': ' + S.width + '×' + S.height + ' (tools/duel_repack.py로 다시 짠 시트)');
  ok(im.alpha(0, 0) === 0, f.id + ': 바깥 여백 투명');
  ok(im.maxAlpha(0, 3 * CH, CW, CH) > DUST, f.id + ': 고정 대기 자세 프레임이 있음');
  for (const cell of [[4, 1], [5, 1], [3, 2], [4, 2], [5, 2]])
    ok(im.maxAlpha(cell[0] * CW, cell[1] * CH, CW, CH) <= DUST, f.id + ': 비사용 셀 전체 투명 ' + cell.join(','));
  // 쓰는 칸의 테두리 1px이 비어 있으면 그림이 옆 칸으로 넘어가지 않은 것
  for (const [row, anim] of Object.entries({ 0: 'attack', 1: 'defense', 2: 'hit', 3: 'action' }))
    for (let c = 0; c < S.animations[anim].frames; c++) {
      const x0 = c * CW, y0 = row * CH;
      const edge = Math.max(im.maxAlpha(x0, y0, CW, 1), im.maxAlpha(x0, y0 + CH - 1, CW, 1), im.maxAlpha(x0, y0, 1, CH), im.maxAlpha(x0 + CW - 1, y0, 1, CH));
      ok(edge <= DUST, f.id + ': 칸 가장자리에 그림이 닿음 ' + row + ',' + c);
    }
}

ok(gif(path.join(ROOT, 'images/duel/finishers/zhang_fei/roar.gif')).frames >= 5, '장비 전용 호통 GIF');
for (const id of ['secret_dagger', 'secret_gun', 'roar']) ok(gif(path.join(ROOT, 'images/duel/finishers/common', id + '.gif')).frames >= 5, id + ': 공통 기술 GIF');

for (const id of Object.values(art.backgrounds).filter((v, i, a) => a.indexOf(v) === i)) {
  const im = png(path.join(ROOT, 'images/duel/backgrounds', id + '.png'), false);
  ok(im.width >= 2094 && im.height === 751, id + ': 초광폭 배경 크기');
}

const manifest = fs.readFileSync(path.join(ROOT, 'images/manifest.js'), 'utf8');
for (const f of allFighters) {
  ok(manifest.includes('"duel/fighters/' + f.id + '"'), f.id + ': 매니페스트 등록 (python tools/images.py)');
  ok(manifest.includes('"duel/cutins/' + f.id + '"'), f.id + ': 전면 필살기 컷인 매니페스트 등록');
}
ok(/class="rd-motion"/.test(duelCode) && /cutins \+ f\.spriteId/.test(duelCode) && /startMotion\(finisherKey\(f, 'deathblow'\)/.test(duelCode), '일격필살을 인물별 전면 컷인으로 재생');
ok(/zhang_fei\/roar/.test(duelCode) && /secret_/.test(duelCode), '장비 호통·공통 비밀무기 연결');
for (const id of ['deck', 'land_battle', 'exploration', 'city', 'tavern']) ok(manifest.includes('"duel/backgrounds/' + id + '"'), id + ': 배경 매니페스트 등록');

// 전면 필살기 컷인: 전투원마다 준비·당기기·돌진·타격·회수의 1060×380 GIF 다섯 장면
for (const f of allFighters) {
  const file = path.join(ROOT, 'images/duel/cutins', f.id + '.gif'), im = gif(file);
  ok(im.width === 1060 && im.height === 380 && im.frames === 5, f.id + ': 컷인 1060×380, 정확히 5단계 GIF');
  ok(fs.statSync(file).size < 2500000, f.id + ': 컷인 GIF 2.5MB 미만');
  ok(!fs.existsSync(path.join(ROOT, 'images/duel/cutins', f.id + '.webp')), f.id + ': 교체 전 정지 WebP를 남기지 않음');
  ok(manifest.includes('"duel/cutins/' + f.id + '": "duel/cutins/' + f.id + '.gif"'), f.id + ': GIF 컷인 매니페스트 등록');
}
const faceL = art.finishers.cutinFaceLeft || [];
ok(faceL.length && faceL.every(id => allFighters.some(f => f.id === id)), '컷인 방향 목록(cutinFaceLeft)은 있는 전투원만');
ok(/finisherKey\(f, 'cutin'\)/.test(duelCode) && /rd-cut-flash/.test(duelCode), '호통도 인물 컷인 뒤에 호통 기운이 퍼지고, 컷인마다 섬광이 지나간다');

const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(index.indexOf('js/data/duelart.js') > index.indexOf('js/data/seafx.js'), 'duelart는 seafx 뒤에서 읽어야 함');
ok(index.indexOf('js/games/duel.js') > index.indexOf('js/data/duelart.js'), 'duel은 duelart 뒤에서 읽어야 함');

// 그림 고르기: 모든 결과가 있는 전투원이고, 21종이 모두 어딘가에 쓰인다
const ids = new Set(art.fighters.map(f => f.id)), seen = new Set();
const styles = ['ib', 'ne', 'it', 'is', 'pe', 'sw', 'af', 'tr', 'in', 'se', 'cn', 'kr', 'jp', 'az', 'an', 'na', 'co'];
for (const look of ['pirate', 'captain', 'brawler', 'rival'])
  for (const style of styles) for (const g of ['m', 'f']) for (let i = 0; i < 4; i++) {
    const id = art.pick({ name: look + i, look, portrait: { style, g, seed: 's' + i } });
    ok(ids.has(id), look + '/' + style + ' → 없는 그림 ' + id); seen.add(id);
  }
for (const style of styles) { seen.add(art.pick({ name: '부관', look: 'mate', m: { id: 1 }, portrait: { style, g: 'm' } })); }
seen.add(art.pick({ name: '나', admiral: true, portrait: { g: 'm' } }));
for (const n of Object.keys(art.byName)) seen.add(art.pick({ name: n, look: 'rival' }));
ok(art.pick({ name: '나', admiral: true, portrait: { g: 'm' } }) === 'main_admiral', '제독 = main_admiral');
ok(art.pick({ name: '이강희', admiral: true, hero: 'ganghui', portrait: { g: 'm' } }) === 'ganghui', '생김새 시트가 있는 제독 = 그 시트');
const unused = [...ids].filter(id => !seen.has(id));
ok(!unused.length, '쓰이지 않는 전투원: ' + unused.join(', '));
const L1 = art.layout({ naturalWidth: 1536, naturalHeight: 1024 }), L2 = art.layout({ naturalWidth: S.width, naturalHeight: S.height }), L3 = art.layout({ naturalWidth: S.width / 2, naturalHeight: S.height / 2 });
ok(L1.cw === 256 && L1.py === 246 && L2.cw === CW && L2.py === S.pivot[1] && L3.cw === CW / 2 && L3.f === 0.5, '그림 크기로 칸·배율 고르기');

console.log('일기토 전투원 ' + allFighters.length + '종(' + S.width + '×' + S.height + ', 칸 ' + CW + '×' + CH + ')·인물별 전면 필살기 컷인 37종·비밀무기·장비 호통·배경 5종·메타데이터·투명 셀·칸 넘침·그림 고르기 검사 통과');
