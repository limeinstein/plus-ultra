/* 복원 여급 130명과 두 번째 새 이름 50명 정적 점검 — node tests/maid_restoration_named_smoke.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
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
load('js/core/images.js');

const PREVIOUS = ['m_cai','m_asw','m_tri','m_alg','m_cas','m_dam','m_sin','m_ank','m_atk','m_bei','m_bag','m_bas','m_shi','m_isf','m_sam','m_tab','m_her','m_kab','m_ava','m_peg','m_ayu','m_phn','m_ten','m_ach','m_plb','m_ban','m_sur','m_bru','m_ter','m_amb','m_del','m_lah','m_ahm','m_vij','m_col','m_tmb','m_gao','m_kil','m_zan','m_zim','m_gua','m_hgz','m_bjg','m_don','m_gye','m_pyo','m_sak','m_kyo','m_ver','m_ctg'];
const ADDITIONAL = ['m_ark','m_tgh','m_jen','m_kan','m_axu','m_kha','m_oyo','m_kat','m_fut','m_aga','m_sof','m_moz','m_mom','m_mli','m_mog','m_sle','m_ife','m_rwa','m_diu','m_bij','m_knr','m_coh','m_gol','m_clc','m_hue','m_lig','m_tlx','m_trp','m_mit','m_mrd','m_gtm','m_bog','m_qui','m_tum','m_cha','m_cuz','m_naz','m_pot','m_mdw','m_kit','m_ono','m_oso','m_hoc','m_std','m_snt','m_jam','m_sju','m_mex','m_pan','m_per'];
const previous = PREVIOUS.map(id => G.MAID[id]).filter(Boolean);
const added = ADDITIONAL.map(id => G.MAID[id]).filter(Boolean);
ok(G.MAIDS.length === 175 && previous.length === 50 && added.length === 50, '기존 125명에 이름 있는 여급 50명을 추가했다');
ok(new Set(G.MAIDS.map(m => m.id)).size === 175, '여급 ID 175개가 모두 고유하다');
ok(new Set(G.MAIDS.map(m => m.city)).size === 175, '한 도시에 이름 있는 여급은 한 명뿐이다');
ok(added.every(m => m.name && G.LIKES[m.like] && G.CITY_DATA[m.city]), '추가 50명 모두 이름·취향·도시가 있다');

const restored = previous.filter(m => m.pic);
const broken = restored.filter(m => G.Img.maidPic(m.id, G.CITY_DATA[m.city]) !== m.pic || !G.Img.has(m.pic) || !G.Img.has(m.pic + '_half'));
ok(restored.length === 30 && !broken.length, '복원한 초창기 30명은 얼굴상·무릎상을 정확히 고정해서 쓴다');

const dated = added.filter(m => m.from);
const founded = dated.filter(m => m.id !== 'm_hue');
ok(founded.length === 7 && founded.every(m => G.CITY_DATA[m.city].founded === m.from), '신항구 여급 7명은 도시 설립 연도에 맞춰 등장한다');
ok(G.MAID.m_hue.from === 1600 && G.MAID.m_bru.from === 1600, '응우옛과 아미한은 1600년부터 등장한다');
const style = id => G.CITY_DATA[G.MAID[id].city].style;
const regional = { africa: 0, india: 0, south: 0, america: 0 };
ADDITIONAL.forEach(id => {
  const s = style(id);
  if (['af','sw','tr'].includes(s)) regional.africa++;
  else if (s === 'in') regional.india++;
  else if (id === 'm_hue' || id === 'm_lig') regional.south++;
  else if (['az','an','na','co'].includes(s)) regional.america++;
});
ok(JSON.stringify(regional) === JSON.stringify({ africa: 18, india: 6, south: 2, america: 24 }), '추가 50명은 아프리카 18·인도 6·남방 2·아메리카 24명이다');

const range = (style, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `maid-styles/${style}/${a + i}`);
const archive = [].concat(range('arabia',14,19), range('india',19,30), range('china',19,36), range('ottoman',8,13), range('japan',11,20), range('native',13,18), range('africa',19,24), range('tropic',7,12), range('westeurope',8,35));
ok(archive.length === 98 && archive.every(k => G.Img.has(k) && G.Img.has(k + '_half')), 'ZIP의 초창기 여급 98명 모두 얼굴상·무릎상이 있다');
const namedCities = new Set(G.MAIDS.map(m => m.city));
const unnamed = G.CITY_DATA.filter(c => !namedCities.has(c.id));
ok(unnamed.length === 134 && unnamed.some(c => G.Img.maidPool(c)), '이름 없는 여급 도시도 ' + unnamed.length + '곳 남아 있다');

console.log('\n통과 — 이름 있는 여급 175명, 추가 50명·초창기 원본 복원 98명, 이름 없는 도시 ' + unnamed.length + '곳');
