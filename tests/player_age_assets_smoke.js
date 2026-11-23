/* 남성 제독 14종의 40세 중년·70세 노년 전환과 그림 누락 시 대체를 점검한다. */
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
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data/seafx.js'), 'utf8'), sandbox);
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

const allLooks = ['admiral', 'ganghui'].concat(LOOKS);
for (const id of allLooks) {
  p.look = id;
  const youngFace = 'portraits/player/' + id;
  const youngHalf = 'characters/player_half' + (id === 'admiral' ? '' : '_' + id);
  for (const n of [18, 39, 40, 55, 69, 70, 79]) {
    age = n;
    const stage = n >= 70 ? 'elderly' : n >= 40 ? 'middle' : 'young';
    const face = n >= 70 ? 'portraits/player-elderly/' + id : n >= 40 ? 'portraits/player-aged/' + id : youngFace;
    const half = youngHalf + (n >= 70 ? '_elderly' : n >= 40 ? '_old' : '');
    ok(G.Img.heroAgeStage(p) === stage, id + ' ' + n + '세 단계');
    ok(G.Img.pick(G.Img.chain.heroPortrait(p)) === face, id + ' ' + n + '세 얼굴');
    ok(G.Img.pick(G.Img.chain.heroHalf()) === half, id + ' ' + n + '세 무릎상');
    for (const key of [face, half]) exists('images/' + G.Img.file(key));
  }
  // 만들기 화면이나 별도 미리보기의 나이는 현재 게임의 나이에 영향받지 않는다.
  age = 70;
  ok(G.Img.chain.heroPortrait({ look: id }, 39)[0] === youngFace, id + ' 명시한 39세 얼굴');
  ok(G.Img.chain.heroHalf({ look: id }, 40)[0] === youngHalf + '_old', id + ' 명시한 40세 무릎상');
  ok(G.Img.chain.heroPortrait({ look: id }, 70)[0] === 'portraits/player-elderly/' + id, id + ' 명시한 70세 얼굴');
}
// 나이를 저장하지 않아도 날짜에서 다시 계산하므로 옛 저장도 바로 전환된다.
p.look = 'navigator_white';
delete p.look;
age = 70;
ok(G.Img.pick(G.Img.chain.heroPortrait(p)) === 'portraits/player-elderly/navigator_white', 'look 없는 옛 저장도 노년 외형 복원');
// 그림이 없는 성별·단계에는 같은 인물의 앞 단계가 나온다.
const elderlyFace = 'portraits/player-elderly/navigator_white';
const elderlyHalf = 'characters/player_half_navigator_white_elderly';
const saved = [G.IMAGE_FILES[elderlyFace], G.IMAGE_FILES[elderlyHalf]];
delete G.IMAGE_FILES[elderlyFace]; delete G.IMAGE_FILES[elderlyHalf]; G.Img.reset();
ok(G.Img.pick(G.Img.chain.heroPortrait(p)) === 'portraits/player-aged/navigator_white', '노년 얼굴 누락 시 같은 인물 중년');
ok(G.Img.pick(G.Img.chain.heroHalf()) === 'characters/player_half_navigator_white_old', '노년 무릎상 누락 시 같은 인물 중년');
G.IMAGE_FILES[elderlyFace] = saved[0]; G.IMAGE_FILES[elderlyHalf] = saved[1]; G.Img.reset();
for (const id of ['jessica', 'soyoung']) {
  p.look = id;
  ok(G.Img.pick(G.Img.chain.heroPortrait(p)) === 'portraits/player/' + id, id + ' 없는 노년 얼굴은 본인 젊은 그림');
  ok(G.Img.pick(G.Img.chain.heroHalf()) === 'characters/player_half_' + id, id + ' 없는 노년 무릎상은 본인 젊은 그림');
}
// 뒤를 이은 자녀에게 1대 제독의 노년 얼굴을 덮어씌우지 않는다.
p.generation = 2; p.heir = { sex: 'm', variant: 1 }; p.look = 'admiral';
ok(G.Img.chain.heroPortrait(p)[0] === 'portraits/family/son_age40_v1', '70세 후계자도 자기 가족 초상을 유지');
ok(G.Img.chain.heroHalf()[0] === 'portraits/family/son_age40_v1_half', '70세 후계자도 자기 가족 무릎상 유지');
delete p.generation; delete p.heir;
// 단계 수치를 한 곳에서 바꾸면 얼굴과 무릎상이 함께 따른다.
G.FX.heroPortraitAge = { middle: 41, elderly: 71 }; age = 40;
ok(G.Img.chain.heroPortrait(p)[0] === 'portraits/player/admiral', '중년 조정값의 얼굴 반영');
ok(G.Img.chain.heroHalf()[0] === 'characters/player_half', '중년 조정값의 무릎상 반영');
age = 70;
ok(G.Img.chain.heroPortrait(p)[0] === 'portraits/player-aged/admiral', '노년 조정값의 얼굴 반영');
ok(G.Img.chain.heroHalf()[0] === 'characters/player_half_old', '노년 조정값의 무릎상 반영');
console.log('제독 14종의 39→40세·69→70세 얼굴/무릎상, 옛 저장·그림 누락·여성·후계자·단계 조정 검사 통과');
