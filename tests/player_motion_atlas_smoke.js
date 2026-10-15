/* 20대 제독 14종의 걷기·달리기·후면 전환 7×7 아틀라스 연결 점검. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const LOOKS = ['admiral', 'armored_navigator', 'army_officer', 'battle_vanguard',
  'blackcoat_captain', 'casanova', 'charismatic_admiral', 'ganghui', 'hat_spinner',
  'muscle_swordsman', 'navigator_white', 'noble_scholar', 'sea_dog', 'sky_adventurer'];
const MOTIONS = ['walk', 'run', 'back'];
function ok(value, message) { if (!value) throw new Error(message); }

const sandbox = { window: { G: {} }, console, setTimeout, clearTimeout, URL: { revokeObjectURL() {} } };
sandbox.G = sandbox.window.G;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'images/manifest.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/core/images.js'), 'utf8'), sandbox);
const G = sandbox.G;

for (const look of LOOKS) {
  G.Game = { state: { player: { look } } };
  for (const motion of MOTIONS) {
    const rel = `images/characters/${look}/motion/${motion}.webp`;
    const key = `characters/${look}/motion/${motion}`;
    ok(fs.existsSync(path.join(ROOT, rel)), `${rel} 파일`);
    ok(G.Img.chain.heroMotion(motion)[0] === key, `${look} ${motion} 키 연결`);
    ok(G.Img.has(key), `${look} ${motion} 매니페스트 등록`);
  }
}

const town = fs.readFileSync(path.join(ROOT, 'js/scenes/town.js'), 'utf8');
const sfx = fs.readFileSync(path.join(ROOT, 'js/data/seafx.js'), 'utf8');
ok(/st\.hero\.enterT \* count/.test(town), '건물 진입 시 후면 49프레임을 진행도에 맞춰 재생');
ok(/rise \* enterEase/.test(town) && /enterFx\.scale/.test(town) && /doorRise\(it\)/.test(town) && /doorX\(it\)/.test(town), '문 앞에 서서 문턱까지만 이동(건물마다 문 자리)·원근 축소 연결');
ok(/hero\.fade = 1 - smooth01/.test(town), '문 안쪽 마지막 구간에서 사라짐');
ok(/st\.runFrames\.length > 0 \|\| !!st\.heroMotion\.run/.test(town), '49프레임 달리기 아틀라스로 자동·키보드 달리기 허용');
ok(/G\.FX\.townHeroEnter = \{ sec:/.test(sfx), '건물 진입 연출 조정값 중앙 등록');

console.log('제독 14종 × 3동작 아틀라스와 걷기·달리기·문 진입 소멸 연결 검사 통과');
