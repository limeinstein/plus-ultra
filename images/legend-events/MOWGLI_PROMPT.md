# 모글리 — 얼굴상·무릎상 제작 기록 (2026-10-26)

## 파일

- 투명 원화: `artifacts/legendary-portraits/mowgli.png` (1024×1536)
- 얼굴상: `images/portraits/legendary/mowgli.png` (512×512)
- 무릎상: `images/portraits/legendary/mowgli_half.png` (1024×1536)

Codex 내장 ImageGen의 참조 이미지 생성 모드로 만들었다. 사용자가 첨부한 성인 남성의 헝클어진 검은 머리, 큰 갈색 눈, 굵은 눈썹, 깨끗하게 면도한 얼굴과 조심스러운 표정을 얼굴 참고로 삼았다. 현대 검은 셔츠와 실내 배경은 가져오지 않았다. 얼굴상은 무릎상 원화에서 잘라 두 그림의 인물이 달라지지 않게 했다.

## 모습

- 스무 살을 넘긴 중앙인도 정글의 성인 모글리. 타잔이나 어린아이처럼 보이지 않는다.
- 나무 타기와 달리기로 단련된 마른 근육, 정글의 흙과 작은 흉터.
- 어깨에 느슨하게 걸친 짙은 갈색·황토색 손베 천과 무릎까지 오는 여러 겹의 해진 두름옷. 꼰 섬유 끈으로 단단히 묶어 몸을 가린다.
- 몸을 조금 틀고 한쪽 어깨를 앞으로 둔 채, 흰 이를 드러내며 활짝 웃는다. 수염과 수염 자국은 전혀 없다.
- 무기·늑대·배경·글자 없이 인물만 투명 배경에 둔다.

## 표정·화풍 수정

사용자가 새로 준 웃는 얼굴을 표정 참고로 삼아, 흰 이를 자연스럽게 드러내는 큰 미소와 웃으며 가늘어진 눈으로 바꿨다. 콧수염·턱수염·구레나룻과 옅은 수염 자국까지 모두 없앴다. 이어서 게임의 기존 인물화와 어울리도록 사진 같은 모공·체모·광택을 줄이고, 부드럽게 정리한 얼굴 면과 붓질이 보이는 반사실적 디지털 유화로 다시 그렸다. 얼굴·체형·자세·옷은 같은 모글리로 유지했다.

수정 모드: Codex 내장 ImageGen `edit` 두 차례 — 첫 번째는 표정과 수염만 수정, 두 번째는 같은 인물을 유지한 채 게임용 반사실적 화풍으로 정리.

## 사건 장면 (2026-10-26)

현재 작업본에 모글리 사건 코드와 장면 키가 아직 없으므로, 늑대 무리와의 첫 조우부터 합류까지 어느 사건 흐름에도 연결하기 쉬운 다섯 장으로 만들었다. 모두 Codex 내장 ImageGen `generate` 모드이며, 확정된 `mowgli_half.png`를 얼굴·체형·복식 참조로 사용했다. 결과는 다른 전설 사건과 같은 1881×836 크기의 WebP로 저장했다.

공통 화풍: 16세기 중앙인도 밀림, 반사실적 수작업 디지털 유화, 사진 같은 모공과 광택을 줄인 게임용 인물화, 글자·UI·테두리·로고·워터마크 없음. 모글리는 검은 곱슬머리와 매끈한 무수염 얼굴, 황토색·짙은 갈색의 해진 천옷을 모든 장면에서 유지한다. 늑대는 회갈색 인도늑대로 그리며 특정 영화·애니메이션의 디자인을 따르지 않는다.

- `mowgli_wolf_ambush.webp` — 푸른 달빛의 야영지를 늑대 무리가 포위하고, 모글리가 반얀나무 가지 위에서 탐험대를 지켜보는 첫 만남.
- `mowgli_pack_leader.webp` — 아침 햇살 아래 모글리가 늑대와 탐험대 사이에 서서 손바닥을 펴고 무기를 내리게 하는 장면.
- `mowgli_tiger.webp` — 비 내리는 골짜기에서 모글리와 늑대 무리가 벵골호랑이와 맞서고 탐험대를 뒤로 물리는 장면. 피와 상처는 없다.
- `mowgli_red_flower.webp` — 밤비 속에서 모글리가 횃불 하나로 늑대 가족을 지키며 호랑이를 밀림으로 물러나게 하는 장면. 산불이나 상처는 없다.
- `mowgli_farewell.webp` — 황금빛 새벽, 모글리가 자신을 키운 어미 늑대와 이마를 맞대고 환하게 웃으며 작별한 뒤 제독의 손을 잡으려는 장면.

## 최종 생성 지시문

`Create one original transparent-background character master portrait for a historical adventure RPG, using the attached adult man's facial proportions, expression, tousled black hair, brown eyes and slightly forward three-quarter posture as the identity reference. Mowgli is an adult South Asian man in his early-to-mid twenties, raised alongside wolves in the jungles of central India. Preserve the large alert brown eyes, thick brows, softly serious vulnerable expression, clean-shaven youthful face and messy wavy black hair. Give him a lean, wiry, realistically muscular body shaped by climbing and running. Dress him in loose, weathered, practical, securely opaque handwoven cloth: an asymmetric dark-umber and muted-ochre shoulder drape and a rugged knee-length wrap tied with braided fiber cord. No modern shirt, armor, shoes, jewelry, Disney costume or bright red loincloth. Nonsexual heroic presentation. Head-to-knees composition with the entire head, hands and knees safely in frame; torso turned slightly, one shoulder closer, arms relaxed but ready, direct wary gaze. Subtle scars and jungle dust, warm brown skin, semi-realistic high-detail historical adventure game portrait, soft warm key light and faint jungle-green rim light. Isolated single character only, transparent background, no scenery, wolf, extra person, text, border or weapon. Vertical 2:3, 1024×1536.`

