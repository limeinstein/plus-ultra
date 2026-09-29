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

const sandbox = { window: { G: {} } };
sandbox.G = sandbox.window.G;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data/duelart.js'), 'utf8'), sandbox);
const art = sandbox.G.DUEL_ART;
ok(art && art.fighters.length === 21, '전투원 메타데이터는 21종이어야 함');
const S = art.sheet, CW = S.cell[0], CH = S.cell[1], DUST = 4;
ok(S.columns === 6 && S.rows === 4 && S.width === CW * 6 && S.height === CH * 4, '시트 크기 = 칸 × 6열·4행');
ok(S.pivot[0] > S.safeMargin && S.pivot[0] < CW && S.pivot[1] > S.safeMargin && S.pivot[1] < CH, '발밑 피벗은 칸 안');
ok(S.source && S.source.width === 1536 && S.source.height === 1024 && S.source.cell[0] === 256 && S.source.pivot[1] === 246, 'Codex 원본 규격 기록');
ok(art.sheet.animations.attack.frames === 6 && art.sheet.animations.defense.frames === 4 && art.sheet.animations.hit.frames === 3 && art.sheet.animations.action.frames === 6, '동작별 프레임 수');

const fighterDir = path.join(ROOT, 'images/duel/fighters');
for (const f of art.fighters) {
  const file = path.join(fighterDir, f.id + '.png'), im = png(file, true);
  ok(im.width === S.width && im.height === S.height, f.id + ': ' + S.width + '×' + S.height + ' (tools/duel_repack.py로 다시 짠 시트)');
  ok(im.alpha(0, 0) === 0, f.id + ': 바깥 여백 투명');
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

for (const id of Object.values(art.backgrounds).filter((v, i, a) => a.indexOf(v) === i)) {
  const im = png(path.join(ROOT, 'images/duel/backgrounds', id + '.png'), false);
  ok(im.width >= 2094 && im.height === 751, id + ': 초광폭 배경 크기');
}

const manifest = fs.readFileSync(path.join(ROOT, 'images/manifest.js'), 'utf8');
for (const f of art.fighters) ok(manifest.includes('"duel/fighters/' + f.id + '"'), f.id + ': 매니페스트 등록');
for (const id of ['deck', 'land_battle', 'exploration', 'city', 'tavern']) ok(manifest.includes('"duel/backgrounds/' + id + '"'), id + ': 배경 매니페스트 등록');

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
const unused = [...ids].filter(id => !seen.has(id));
ok(!unused.length, '쓰이지 않는 전투원: ' + unused.join(', '));
const L1 = art.layout({ naturalWidth: 1536, naturalHeight: 1024 }), L2 = art.layout({ naturalWidth: S.width, naturalHeight: S.height }), L3 = art.layout({ naturalWidth: S.width / 2, naturalHeight: S.height / 2 });
ok(L1.cw === 256 && L1.py === 246 && L2.cw === CW && L2.py === S.pivot[1] && L3.cw === CW / 2 && L3.f === 0.5, '그림 크기로 칸·배율 고르기');

console.log('일기토 전투원 21종(' + S.width + '×' + S.height + ', 칸 ' + CW + '×' + CH + ')·배경 5종·메타데이터·투명 셀·칸 넘침·그림 고르기 검사 통과');
