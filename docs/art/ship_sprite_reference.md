# 8방향 동작 선박 그림 제작 기준

## 공통 규격

- 시기: 1480~1600년. 게임의 36종 ID·이름·수치는 바꾸지 않고 외형만 가장 가까운 초기형으로 표현한다.
- 시점: 수면 위 약 55도에서 내려다보는 정사영. 선수 방향은 동쪽을 0도로 하여 45도 간격 8방향이다.
- 돛: 따뜻한 상아색의 무문양 흰 돛. 솔기·보강천·대나무 살만 표시하고 십자가·문장·국가 표식은 넣지 않는다.
- 식별: 작은 단색 깃발은 게임이 아군·적군 색으로 그린다. 시트에는 바다 면이나 그림자를 넣지 않고, 동작 판독에 필요한 잔물결과 선수 포말만 반투명하게 넣는다.
- 기준 시안: `ship-galleon-upgrade-reference.png`. 짙은 월넛 외판, 황동 프레임, 아이보리 돛, 따뜻한 윗빛을 36종의 공통 재질 규칙으로 삼는다.
- 출력: 선종당 224px 셀, 정박 3장·표류 5장·질주 8장 × 8방향. 정박과 표류는 한 방향 행의 앞 3칸·뒤 5칸을 나눠 쓰고, 질주는 별도 방향 행을 써서 한 시트가 8열×16행(1792×3584)인 투명 WebP다.
- 피벗: 모든 셀의 수면 중심 `(112,139)`. 회전·흔들림·방향 전환은 이 점을 기준으로 하며, 셀 사방에 적어도 2px의 투명 여백을 둔다.
- 배치: 동작마다 8개 방향을 한 묶음으로 세로 배치하고 프레임은 가로로 놓는다. 쓰지 않는 칸은 완전 투명으로 남겨 돛·선수·노가 이웃 조각과 겹치지 않는다.
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

기본 제공 이미지 생성 도구로 갤리온 기준 시안을 만들고, 게임 시트는 그 재질과 조명 규칙을 결정론적 렌더러로 36종에 적용했다.

```text
Use case: stylized-concept
Asset type: production art-direction reference for a browser-game galleon sprite system
Primary request: redesign a historically plausible late-16th-century galleon at premium game-asset quality
Input images: Image 1 supplies the readable full silhouette; Image 2 supplies only polished warm wood, ivory canvas, sculpted material detail and clean rendering finish; ignore its watermark
Style/medium: polished hand-painted 3D game render with realistic materials and a crisp small-sprite silhouette
Composition: elevated three-quarter orthographic view, whole vessel visible, generous transparent padding, waterline pivot centered below the hull
Materials: dark walnut planks, warm bronze fittings, ivory cloth sails with seams, rope fiber and restrained weathering
Constraints: genuine transparent alpha; no sea, wake, flag, text, logo or watermark; no cropped mast, sail or bowsprit
Avoid: fantasy ornament, modern fittings, duplicate masts, broken rigging and watermark residue
```

최종 게임 시트는 방향, 피벗, 프레임 수와 돛 축이 흔들리지 않도록 `tools/render_ship_sprites.py`가 결정론적으로 만든다. `tests/shipsprites_test.py`가 36종의 크기·알파·프레임 수·셀 여백을 검사한다.
