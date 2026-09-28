# 16방향 선박 그림 제작 기준

## 공통 규격

- 시기: 1480~1600년. 게임의 36종 ID·이름·수치는 바꾸지 않고 외형만 가장 가까운 초기형으로 표현한다.
- 시점: 수면 위 약 55도에서 내려다보는 정사영. 선수 방향은 동쪽을 0도로 하여 22.5도 간격 16방향이다.
- 돛: 따뜻한 상아색의 무문양 흰 돛. 솔기·보강천·대나무 살만 표시하고 십자가·문장·국가 표식은 넣지 않는다.
- 식별: 작은 단색 깃발은 게임이 아군·적군 색으로 그린다. 시트에는 깃발·바다·항적·그림자를 넣지 않는다.
- 기준 시안: `ship-pilot-imagegen.png`, `ship-36-imagegen-reference.png`. 재질·명암·계열별 실루엣 참고용이며 배경과 개별 선형은 그대로 복제하지 않는다.
- 출력: 선종당 224px 셀, 16방향, 선체 1층 + 돛 각도 5층 + 접은 돛 1층. 한 시트는 1792×3136 투명 WebP다.
- 구분 요소: 선종마다 선체 평면형·폭·건현·선수·선미루·포구·노 수·돛대 높이·범장 단계를 따로 지정한다.

## 고증 기준

- 유럽 카라벨·카락·갤리온: Royal Museums Greenwich의 1490년경 포르투갈 카라벨 모형과 16세기 선박 모형 자료를 우선한다.
  - https://www.rmg.co.uk/collections/objects/rmgc-object-66267
  - https://www.rmg.co.uk/collections/objects/rmgc-object-66197
- 중국 정크: 마카오 해양박물관 소장 모형 설명의 다층 판재, 높은 선수·선미루, 대나무 살 돛을 반영한다.
  - https://artsandculture.google.com/asset/model-of-a-chinese-junk-macau-maritime-museum-1998/qgEzJqIuYSOygw
- 판옥선: 국가유산청 「판옥선 학술 복원 보고서」의 평저선·상하 갑판 구조를 우선한다.
  - https://www.heritage.go.kr/heri/cul/linkSelectEbookDetail.do?bbsId=BBSMSTR_1021&nttId=81439&pageNo=1_4_0_0
- 다우·삼부크·바글라, 종·보선처럼 복원에 논쟁이 있는 선종은 게임 이름을 유지하고 해당 문화권의 동시대 선체·범장 특징을 보수적으로 조합한다.

## ImageGen 기준 프롬프트

기본 제공 이미지 생성 도구로 아래 조건의 6종 기준 시안과 36종 비교 시안을 만들었다.

```text
Use case: historical-scene
Asset type: production art-direction board for a 16-direction browser-game ship sprite system
Input images: Image 1 is the current roster reference; Image 2 is a small-scale pixel-readability reference. Do not copy pixels or emblems.
Subject: European galleon, Mediterranean galley, Indian Ocean dhow, Ming Chinese junk, Korean panokseon, Andean balsa raft
Style/medium: refined hand-painted pixel art for 256px transparent game sprites
Composition: equal orthographic scale, elevated three-quarter top-down view, entire hull and sails visible
Constraints: plain warm-white sails; no crosses, heraldry, national insignia, text, flags, water, wake, UI, or watermark
```

36종 확장 비교 시안에는 다음 조건을 추가했다.

```text
Use case: historical-scene
Asset type: production art-direction reference board for a historical browser-game ship sprite system
Primary request: a 6-by-6 comparison board of all 36 named vessel types, with a distinct historically grounded hull, rig, oar layout and superstructure for every vessel
Style/medium: refined hand-painted pixel art, crisp readable silhouettes at game scale
Composition: equal cells, identical elevated orthographic angle, isolated vessels
Constraints: plain warm-white sails, no heraldry or national symbols, no water, UI, text or watermark
Avoid: identical hulls differentiated only by mast count; fantasy or modern ships
```

최종 게임 시트는 방향과 돛 축이 흔들리지 않도록 `tools/render_ship_sprites.py`가 결정론적으로 만든다.
