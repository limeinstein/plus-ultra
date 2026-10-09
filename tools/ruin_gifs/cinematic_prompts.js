#!/usr/bin/env node
/* 역사·종교 건축 발견물의 4×4 시네마틱 원화 프롬프트를 만든다. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_FILES = [
  'js/data/wonders.js',
  'js/data/eastdisc.js',
  'js/data/moredisc.js',
  'js/data/chaindisc.js',
  'js/data/discoveries.js'
];

function loadRuins() {
  const context = { window: { G: {} } };
  vm.createContext(context);
  DATA_FILES.forEach(function (relative) {
    const file = path.join(ROOT, relative);
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  });
  return context.window.G.DISCOVERIES.filter(function (discovery) {
    return discovery.cat === 'ruin';
  });
}

function promptFor(discovery) {
  const place = discovery.name;
  const historicalContext = [discovery.desc, discovery.hint].filter(Boolean).join(' ');
  const uncertain = discovery.legend
    ? '전설·위치 불확실 요소는 확정 사실처럼 보이지 말고, 알려진 시대 자료에 근거한 절제된 추정 복원으로 표현한다.'
    : '건축 양식, 재료, 복식, 도구와 주변 지형은 해당 장소와 건립 시대에 맞게 고증한다.';
  return [
    'Use case: historical-scene',
    'Asset type: 브라우저 탐험 게임의 역사·종교 건축 발견 GIF용 4×4 시네마틱 스토리보드 원화',
    `Primary request: ${place}의 건설, 완공, 내부 답사, 외부 360도 회전을 하나의 연속된 발견 장면으로 만든다.`,
    '',
    `사실적인 나무 제도 테이블 위에 펼쳐진 큰 건축 도면 위에 직접 전시된, 건설 중인 ${place}의 고대 문명 매우 정교한 미니어처 디오라마. 장면에는 ${place}의 상징적인 역사 건축물이 등장하며, 다양한 건설 단계의 부분적으로 완성된 기념물, 사원, 탑, 성벽, 궁전, 거리 또는 의례 구조물이 포함된다. 작은 장인, 건축가, 기술자, 노동자들이 역사적으로 정확한 도구, 비계, 경사로, 크레인, 수레, 석재 블록, 목재 골조, 건설 플랫폼을 사용하여 장면 전체에서 자연스럽게 상호작용한다.`,
    '미니어처 지형은 아래에 인쇄된 공학 도면과 매끄럽게 어우러지며, 모래, 돌, 흙, 대리석, 초목 또는 사막의 사실적인 질감을 눈에 보이는 건축 평면도, 입면 스케치, 치수, 주석, 단면도와 결합한다. 작업 공간 주변에는 제도 기구, 컴퍼스, 말린 양피지 도면, 책, 자, 황동 추, 양초, 지도, 조각 도구, 역사적 참고 자료가 있어 작업장 분위기를 강화한다.',
    '가까운 창문에서 들어오는 따뜻한 자연광의 부드러운 영화적 조명, 얕은 피사계 심도, 초사실적 질감, 수공예 박물관 품질의 스케일 모델 미학, 정교한 미니어처 디테일, 사진처럼 사실적인 재질, 분위기 있는 리얼리즘, 에디토리얼 건축 사진 스타일, 깔끔한 구성, 몰입감 있는 세계관 구축. 각 칸 안에서는 건물의 높이와 전체 실루엣을 살리는 세로 중심 구도, 극도로 높은 디테일, 사실적인 그림자, 진정성 있는 역사적 분위기.',
    '',
    `Historical subject: ${historicalContext}`,
    `Historical accuracy: ${uncertain}`,
    '',
    'Storyboard: 정확히 같은 건물과 장소가 이어지는 4열×4행, 총 16칸. 읽는 순서는 왼쪽에서 오른쪽, 위에서 아래.',
    '1칸: 따뜻한 낮빛의 나무 제도 테이블, 큰 청사진 전체, 공사 터를 표시한 작은 지형과 첫 기초 작업.',
    '2칸: 같은 청사진 위에서 기초와 하부 구조를 쌓는 미니어처 공사. 작은 인부와 시대에 맞는 장비가 실제 작업 중이다.',
    '3칸: 같은 위치와 축척에서 골조·기둥·벽체가 절반가량 올라온 미니어처 공사.',
    '4칸: 지붕·탑·외장과 장식을 마무리하는 거의 완성된 미니어처. 비계 일부가 남아 있다.',
    '5칸: 비계가 걷힌 완성 미니어처를 도면 위에서 영웅적으로 보여 준다. 다음 칸의 실물과 실루엣·시점이 정확히 이어지는 매치 컷.',
    '6칸: 장난감이 아닌 실제 역사 공간으로 전환. 원래 지형과 도시 또는 풍경 속에 완공 당시의 실물 크기 건물이 같은 시점으로 서 있다.',
    '7칸: 카메라가 실물 건물의 주 출입구로 다가가 문턱을 넘는다. 사람 눈높이, 실제 크기감.',
    '8칸: 내부의 대표 공간을 넓게 둘러보는 장면. 구조, 천장, 기둥, 벽화, 제단 또는 생활 공간을 시대에 맞게 보여 준다.',
    '9칸: 내부에서 다른 방향을 돌아보며 핵심 세부와 공간의 깊이를 보여 준다. 8칸과 동일한 내부이고 카메라만 이동한다.',
    '10칸: 카메라가 출입구 쪽으로 돌아 밖으로 나간다. 실내의 어둠에서 바깥 낮빛으로 자연스럽게 노출이 변한다.',
    '11칸: 건물 전체가 보이는 거리의 정면 0도. 맑은 낮, 360도 회전의 시작.',
    '12칸: 같은 거리·높이·초점거리의 약 60도 외관. 늦은 오후.',
    '13칸: 약 120도 외관. 해 질 녘의 금빛과 긴 그림자.',
    '14칸: 약 180도 뒤쪽 외관. 달빛과 별이 있는 깊은 밤, 건물 형태는 분명히 읽힌다.',
    '15칸: 약 240도 외관. 밤이 걷히는 푸른 새벽, 지평선이 밝아진다.',
    '16칸: 약 300도 외관. 해가 떠오르고 다시 밝은 낮으로 이어진다. 반복 재생 시 11칸 정면으로 이어져 공간적으로 완전한 360도를 이룬다.',
    '',
    'Interior exception: 실제로 들어갈 수 있는 실내가 없는 거석, 지상화, 다리, 성벽, 야외 제단, 무덤 봉분 또는 개방 유적은 허구의 방을 만들지 않는다. 7~10칸에서 입구·통로·중앙 의례 공간·관찰 가능한 내부 또는 구조 사이를 사람 눈높이로 답사하고 다시 밖으로 나온다.',
    'Continuity: 16칸 모두 건물의 비례, 재료, 장식, 주변 지형과 출입구 위치가 동일해야 한다. 미니어처 공정은 누적되어야 하며 이전 단계가 사라지거나 건물 디자인이 바뀌면 안 된다. 6칸부터는 미니어처나 제도 테이블이 보이지 않는 실제 실물 공간이다.',
    'Composition/framing: 원화 전체 2048×1536, 정확한 4열×4행의 같은 크기 칸. 칸마다 주요 건물과 지붕·첨탑이 잘리지 않으며 576×256 게임 화면으로 옮겨도 중심 대상이 남는다.',
    'Lighting/mood: 제도실의 따뜻한 낮 → 실제 장소의 낮 → 내부의 자연스러운 어둠과 채광 → 외부 낮 → 늦은 오후 → 노을 → 밤 → 동틀 무렵 → 낮.',
    'Style/medium: 초사실적 사진, 영화적 건축 다큐멘터리, 박물관 품질의 미니어처와 실물 공간을 명확히 구분.',
    'Constraints: 정확히 16칸, 같은 대상의 연속 장면, 역사적으로 타당한 완공 당시 모습, 자연스러운 카메라 이동, 해부학적으로 자연스러운 인물, 글자·숫자·설명표·테두리·칸 사이 여백·로고·워터마크 없음.',
    'Avoid: 서로 다른 건물로 변형, 외부 회전 중 건물 형태 변화, 거울상, 잘린 지붕이나 탑, 현대 장비와 현대 관광객, 판타지 장식, 허구의 실내, 미니어처와 실물의 혼동, 한 칸 안에 여러 시점을 합성, 틸트시프트 효과가 남은 실물 장면.'
  ].join('\n');
}

function parseArgs(argv) {
  const result = { only: null, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--only') result.only = (argv[++i] || '').split(',').filter(Boolean);
    else if (argv[i] === '--out') result.out = argv[++i];
    else throw new Error('알 수 없는 인수: ' + argv[i]);
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let rows = loadRuins();
  if (args.only) {
    const wanted = new Set(args.only);
    rows = rows.filter(function (row) { return wanted.has(row.id); });
    const missing = args.only.filter(function (id) { return !rows.some(function (row) { return row.id === id; }); });
    if (missing.length) throw new Error('없는 유적 발견물 ID: ' + missing.join(', '));
  }
  const payload = rows.map(function (discovery) {
    return {
      id: discovery.id,
      name: discovery.name,
      source: `tools/ruin_gifs/v3/master/${discovery.id}.png`,
      prompt: promptFor(discovery)
    };
  });
  const json = JSON.stringify(payload, null, 2) + '\n';
  if (args.out) fs.writeFileSync(path.resolve(args.out), json, 'utf8');
  else process.stdout.write(json);
}

if (require.main === module) main();

module.exports = { loadRuins, promptFor };
