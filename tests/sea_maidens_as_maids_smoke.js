/* 떰·마리아 새 원화를 별도 동남아 여급으로 쓰되 사건 동료 자산은 보존한다.
   node tests/sea_maidens_as_maids_smoke.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
function load(file) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), { filename: file }); }
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

global.window = global;
global.performance = { now: () => Date.now() };
global.G = { Art: {} };
load('js/core/util.js');
load('js/data/cities.js');
load('js/data/people.js');
load('images/manifest.js');
load('js/data/portraitfaces.js');
load('js/core/images.js');
load('js/systems/maidswap.js');

const cases = [
  { id: 'm_hue', name: '응우옛', city: 164, source: 'tam' },
  { id: 'm_bru', name: '아미한', city: 170, source: 'maria' }
];

for (const x of cases) {
  const maid = G.MAID[x.id];
  const key = 'portraits/maids/' + x.id;
  ok(maid && maid.name === x.name && maid.city === x.city && maid.from === 1600,
    `${x.name}: 동남아 술집과 1600년 등장 조건`);
  ok(!G.maidAvailable(maid, 1599) && G.maidAvailable(maid, 1600), `${x.name}: 1599년에는 없고 1600년부터 등장`);
  ok(G.baseMaidAt(x.city, 1599) === null && G.baseMaidAt(x.city, 1600) === maid, `${x.name}: 실제 도시 여급 선택도 연도를 따른다`);
  G.Game = { state: { date: { y: 1599 } } };
  const before = G.MaidSwap.at(x.city);
  G.Game.state.date.y = 1600;
  const after = G.MaidSwap.at(x.city);
  ok(before === null && after === maid, `${x.name}: 술집 교대 로직도 1600년 경계를 따른다`);
  ok(G.Img.has(key) && G.Img.has(key + '_half'), `${x.name}: 얼굴상·무릎상 등록`);
  ok(G.PORTRAIT_FACES[key] && G.PORTRAIT_FACES[key + '_half'], `${x.name}: 얼굴 리그 좌표 등록`);
  for (const suffix of ['', '_half']) {
    const a = fs.readFileSync(path.join(ROOT, 'images/portraits/maids', x.id + suffix + '.webp'));
    const b = fs.readFileSync(path.join(ROOT, 'images/portraits/legendary', x.source + suffix + '.webp'));
    if (suffix) {
      ok(a.equals(b), `${x.name}: 무릎상은 새 원화를 정확히 사용`);
    } else {
      // 원화 448px 얼굴상을 1024px로 보간 확대한 뒤에도 같은 얼굴·알파여야 한다.
      // 압축·약한 선명화 오차만 허용하며 다른 얼굴로 바뀌면 큰 차이로 실패한다.
      execFileSync(process.env.PYTHON || 'python', ['-c',
        'from PIL import Image; import numpy as np,sys; a=Image.open(sys.argv[1]).convert("RGBA"); b=Image.open(sys.argv[2]).convert("RGBA").resize(a.size,Image.Resampling.LANCZOS); x=np.array(a).astype(float); y=np.array(b).astype(float); mask=(x[:,:,3]>200)&(y[:,:,3]>200); assert mask.any(); assert np.abs(x[:,:,3]-y[:,:,3]).max()<=1; assert np.abs(x[:,:,:3]-y[:,:,:3])[mask].mean()<3',
        path.join(ROOT, 'images/portraits/maids', x.id + '.webp'),
        path.join(ROOT, 'images/portraits/legendary', x.source + '.webp')]);
      ok(true, `${x.name}: 확대 얼굴상도 원화의 얼굴·투명도를 유지`);
    }
  }
}

ok(G.Img.has('portraits/legendary/tam') && G.Img.has('portraits/legendary/maria'), '사건 동료 떰·마리아 자산은 그대로 보존');
console.log('\n통과 — 응우옛·아미한은 1600년부터 동남아 술집에 등장한다');
