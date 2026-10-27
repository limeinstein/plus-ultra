# 해상 괴물 스프라이트

크라켄, 대왕문어, 바다뱀, 해룡, 식인상어, 유령선에 이소나데, 바쿠나와, 자라탄, 레비아탄, 요르문간드, 시팍틀리를 더한 12종의 해전용 그림이다. 내장 `image_gen`으로 각 종의 투명 원화를 따로 만들고, 투명도를 보존한 채 칸을 나눠 같은 크기로 배치했다. 추가 6종은 기존 발견물의 생김새와 게임 설명을 참고해 디자인을 맞췄다. 실제 사용한 전체 프롬프트는 [sea-monster-prompts.json](sea-monster-prompts.json)에 있다.

## 파일과 규격

- 게임용 WebP: `images/sea-monsters/<id>.webp`
- 투명 PNG: `art_sources/sea-monsters/sheets/<id>.png`
- 생성 원화 보관: `art_sources/sea-monsters/sources/<id>.png`
- 좌표 자료: `images/sea-monsters/atlas.json`
- 확인 화면: 저장소 루트의 `test_sea_monster_sprites.html`을 직접 연다.
- 상태 비교 그림: [sea-monsters-states.jpg](sea-monsters-states.jpg). 가로는 아래 표의 여섯 상태, 세로는 아래 ID 순서의 12종이다. 전체 576칸이며 추가 6종은 288칸이다.
- 추가 6종만 보기: [sea-monsters-additional-states.jpg](sea-monsters-additional-states.jpg). 위에서부터 이소나데·바쿠나와·자라탄·레비아탄·요르문간드·시팍틀리다.

| ID | 이름 | 형태 |
| --- | --- | --- |
| `kraken` | 크라켄 | 남보라색 오징어형, 길쭉한 외투막과 긴 포획 촉수 |
| `giant-octopus` | 대왕문어 | 적갈색 둥근 머리, 넓게 펼치는 여덟 팔 |
| `sea-serpent` | 바다뱀 | 올리브색 긴 몸통, 수면 위로 드러나는 몸의 굴곡 |
| `sea-dragon` | 해룡 | 청록 비늘, 금빛 뿔·등가시와 수염 |
| `man-eating-shark` | 식인상어 | 상처가 있는 거대한 백상아리, 등지느러미와 이빨 |
| `ghost-ship` | 유령선 | 찢어진 회색 돛, 부식된 선체, 초록 등불과 안개 |
| `isonade` | 이소나데 | 남색 물고기 몸통, 갈고리 가시가 줄지어 난 긴 꼬리 |
| `bakunawa` | 바쿠나와 | 청록색 바다뱀 용, 넓은 주둥이와 길게 이어진 등지느러미 |
| `zaratan` | 자라탄 | 흙·이끼·나무가 자란 섬 같은 등껍질의 바다거북 |
| `leviathan` | 레비아탄 | 방패처럼 겹친 검은 청동색 비늘, 불꽃과 연기를 내뿜는 입 |
| `jormungandr` | 요르문간드 | 고리처럼 감긴 회청색 몸, 옅은 무늬와 쐐기 모양 머리 |
| `cipactli` | 시팍틀리 | 청록색 악어 물고기, 관절에 난 여러 작은 입 |

시트 한 장은 **1792×1344**, **8열×6행**, **48칸**이다. 한 칸은 보선과 같은 **224×224**, 수면 기준점은 **[112,139]**, 기준 길이는 **158**이다. 게임에서 보선을 그리는 것과 같은 `len`을 넘기면 같은 기준의 크기가 된다. 원화의 실제 연결 영역을 찾아 물보라까지 분리하고, 한 종 안에서는 같은 배율을 적용해 크기를 유지한다. 본체의 최대 너비 174px·높이 140px에 맞추고 아래쪽 물살을 같은 높이로 정렬했다. WebP도 무손실로 저장한다.

열은 동·북동·북·북서·서·남서·남·남동 순서다. 각도는 기존 선박과 같이 `0=동`, `π/2=북`이다. 행은 다음과 같다.

| 행(0부터) | 상태 | 그림 |
| --- | --- | --- |
| 0 | `idle` | 수면 대기 |
| 1 | `swim` | 이동 |
| 2 | `attack` | 촉수·물기·들이받기 / 유령선의 유령 포격 |
| 3 | `dive` | 몸이 물속으로 내려감 / 유령선이 안개로 사라짐 |
| 4 | `submerged` | 몸이 보이지 않고 물결·기포·희미한 그림자만 남음 / 안개 |
| 5 | `emerge` | 물보라와 함께 올라옴 / 유령선이 다시 나타남 |

생성된 그림에는 생물과 함께 움직이는 작은 물살이 들어 있다. 유령선의 은신 장면은 선체 대신 초록빛 안개만 남는다.

## 발견물 연결

크라켄·대왕문어·바다뱀·해룡·식인상어·유령선은 해전 스프라이트와 별도로
2×2 원화에서 만든 발견 GIF·마지막 장면·WebP 장면 판을 갖는다. 크라켄은
기존 `kraken` 발견물을 사용하며, 나머지 다섯 종은 `js/data/moredisc.js`의
해상 발견물이다. 세부 원화 프롬프트와 해역은
[sea-monster-discoveries-2026-10-27.md](sea-monster-discoveries-2026-10-27.md)에 있다.

## 그리는 법

자료는 `G.SEA_MONSTER_ART`와 `G.SEA_MONSTER_LAYOUT`, 그리기는 `G.SeaMonsterSprite`가 맡는다. 두 스크립트는 `index.html`과 `catalog.html`에 등록했다. 그림은 `G.Img`의 정식 그림 목록에 들어 있으므로 `file://`에서도 읽힌다.

```js
G.SeaMonsterSprite.preload(['kraken']).then(function () {
  G.SeaMonsterSprite.draw(ctx, x, y, angle, len, {
    type: 'kraken',
    state: 'dive',
    elapsed: secondsSinceDiveStarted
  }, time);
});
```

`elapsed`는 **해당 동작을 시작한 뒤 지난 초**다. 잠수·등장·공격을 다시 시작할 때 0부터 전달한다. 준비 중이거나 없는 ID이면 `draw`가 `false`를 반환한다. `alpha`를 주면 기존 Canvas 투명도에 곱한다.

`dive`는 0→3→4행을 1.6초에 걸쳐 이어 그린 뒤 4행에서 멈춘다. `emerge`는 4→5→0행을 1.6초에 이어 그린 뒤 0행에서 멈춘다. `submerged`는 4행만 그린다. `idle`·`swim`은 0↔1행을 반복하고 `attack`은 0→2→0행을 한 번 재생한다. 이는 **서로 다른 자세 사이의 교차 전환**이며, 각 상태마다 여러 장을 그린 연속 동작 시트는 아니다. 시간과 행 순서는 `js/data/seafx.js`의 `G.FX.seaMonster.actions`에서 조절한다.

그림과 재생기는 실제 해상 괴물 시스템에 연결했다. 출몰·시대별 능력치·잠수 중 공격 차단·공격 방식·재등장·첫 발견·항구 경고는 [해상 괴물 해전](../sea-monster-battle.md)에 설명한다.

## 다시 정리하고 검사하기

`sharp`와 `playwright`가 있는 `node_modules`를 `NODE_PATH`로 지정한 뒤 실행한다.

```powershell
node tools/prepare_sea_monsters.cjs
python tools/images.py
node tests/sea_monster_sprites_smoke.cjs
```

정리 도구는 기존 완성 PNG·WebP와 좌표 자료가 있으면 그대로 유지하고 새 종만 정리한다. 원화는 우선 저장소의 보관 파일을 사용하며, 없을 때만 프롬프트 기록에 있는 최초 생성 경로에서 복사한다. 검사에서는 12종 576칸의 크기·알파·투명 여백, 실제 그림 로딩, 방위 좌표, 잠수/재등장 마지막 상태와 콘솔 오류를 확인한다. Chromium은 `finally`에서 닫는다.

검수 중 특정 종만 다시 배치하려면 `node tools/prepare_sea_monsters.cjs --rebuild=cipactli`처럼 지정한다. 원화의 방위 열을 옮겨야 할 때는 프롬프트 기록의 `sourceColumns`에 게임의 동→남동 순서에 대응하는 원화 열 번호를 적는다.

12종 확장 검증: `node tests/sea_monster_sprites_smoke.cjs` 통과. 576칸의 그림 로딩·투명 여백·잠수 및 재등장 끝 상태를 확인했고 콘솔 오류는 0건이다. 기존 6종 WebP도 추가 작업 전후의 SHA-256이 같음을 확인했다.
