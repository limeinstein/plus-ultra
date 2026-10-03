/* 신규 제독 12종과 기본·이강희의 40세 얼굴 전환을 브라우저 없이 점검한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const LOOKS = ['navigator_white', 'armored_navigator', 'sea_dog', 'muscle_swordsman', 'hat_spinner',
  'charismatic_admiral', 'battle_vanguard', 'noble_scholar', 'casanova', 'army_officer',
  'sky_adventurer', 'blackcoat_captain'];
function ok(v, msg) { if (!v) throw new Error(msg); }
function exists(rel) { ok(fs.existsSync(path.join(ROOT, rel)), rel + ' 파일'); }

for (const id of LOOKS) {
  exists('images/portraits/player/' + id + '.png');
  exists('images/portraits/player-aged/' + id + '.png');
  exists('images/characters/player_half_' + id + '.png');
  exists('images/characters/player_half_' + id + '_old.png');
  for (let i = 1; i <= 8; i++) exists('images/characters/' + id + '/walk_' + i + '.webp');
  exists('images/duel/fighters/' + id + '.png');
}
for (const id of ['admiral', 'ganghui']) exists('images/portraits/player-aged/' + id + '.png');
exists('images/characters/player_half_old.png');
exists('images/characters/player_half_ganghui_old.png');

const sandbox = { window: { G: {} }, console, setTimeout, clearTimeout, URL: { revokeObjectURL() {} } };
sandbox.G = sandbox.window.G;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'images/manifest.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/core/images.js'), 'utf8'), sandbox);
const G = sandbox.G, p = { look: 'navigator_white', portrait: { img: ['portraits/player/navigator_white'] } };
G.Game = { state: { player: p } };
let age = 39;
G.R = { age: () => age };
ok(String(G.Img.chain.heroPortrait(p)) === 'portraits/player/navigator_white', '39세 얼굴은 젊은 그림');
ok(String(G.Img.chain.heroHalf()) === 'characters/player_half_navigator_white', '39세 무릎상은 젊은 그림');
age = 40;
ok(G.Img.chain.heroPortrait(p)[0] === 'portraits/player-aged/navigator_white', '40세 얼굴은 수염 난 그림');
ok(G.Img.chain.heroHalf()[0] === 'characters/player_half_navigator_white_old', '40세 무릎상은 수염 난 그림');
ok(G.Img.chain.heroWalk().length === 8, '40세에도 전용 보행 8장');
ok(G.Img.chain.heroDuel()[0] === 'duel/fighters/navigator_white', '40세에도 전용 일기토 시트');

console.log('제독 생김새 12종·기본 제독·이강희의 젊은/40대 얼굴과 무릎상, 보행 96장, 일기토 12장, 40세 자동 전환 검사 통과');
