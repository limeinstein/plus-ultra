# 피드백 #185 · 경주 단이와 여급·후원자 무릎상

단이와 혼인한 뒤 자택에서 얼굴상만 나온다는 제보를 재현했다. 단이의 얼굴은 지역 초상 `maid-styles/korea/6`이었다. 이전 무릎상은 얼굴상의 의상과 몸통이 달라 게임에서 표시를 막아 둔 상태였다. 기존 얼굴을 참고해 붉은 옷과 꽃 장식을 이어 그리고, 같은 키에 새 무릎상을 등록했다. [자택에서 단이가 맞이하는 화면](../../artifacts/feedback-185/dani-home.png)

## 이름 있는 여급

여급 185명의 얼굴상을 확인했다. 아래 11명은 무릎상을 다시 제작했다. 단이가 술집에서 처음 인사하는 장면, 혼인한 상태로 저장한 게임을 다시 불러온 뒤의 자택 인사, 도감 상세 화면의 두 그림을 확인했다. [기존 얼굴과 새 무릎상 비교](../../artifacts/feedback-185/named-preview.jpg) · [경주 술집 화면](../../artifacts/feedback-185/dani-tavern.png)

| 도시 | 이름 | 기존 얼굴상 | 새 무릎상 |
|---|---|---|---|
| 경주 | 단이 | [얼굴](../../images/maid-styles/korea/6.webp) | [무릎](../../images/maid-styles/korea/6_half.webp) |
| 르완다 | 니라베라 | [얼굴](../../images/maid-styles/africa/3.webp) | [무릎](../../images/maid-styles/africa/3_half.webp) |
| 말린디 | 아샤 | [얼굴](../../images/maid-styles/africa/7.webp) | [무릎](../../images/maid-styles/africa/7_half.webp) |
| 델리 | 누르 | [얼굴](../../images/maid-styles/india/12.webp) | [무릎](../../images/maid-styles/india/12_half.webp) |
| 라호르 | 히라 | [얼굴](../../images/maid-styles/india/4.webp) | [무릎](../../images/maid-styles/india/4_half.webp) |
| 비자야나가르 | 데바키 | [얼굴](../../images/maid-styles/india/6.webp) | [무릎](../../images/maid-styles/india/6_half.webp) |
| 항주 | 연화 | [얼굴](../../images/maid-styles/china/16.webp) | [무릎](../../images/maid-styles/china/16_half.webp) |
| 사카이 | 오츠루 | [얼굴](../../images/maid-styles/japan/8.webp) | [무릎](../../images/maid-styles/japan/8_half.webp) |
| 동래 | 분이 | [얼굴](../../images/maid-styles/korea/4.webp) | [무릎](../../images/maid-styles/korea/4_half.webp) |
| 오논다가 | 지궁사세 | [얼굴](../../images/maid-styles/native/3.webp) | [무릎](../../images/maid-styles/native/3_half.webp) |
| 호셸라가 | 오논타 | [얼굴](../../images/maid-styles/native/1.webp) | [무릎](../../images/maid-styles/native/1_half.webp) |

## 지역 여급과 후원자

이름 없는 술집 여급과 혼인 뒤 새로 일하는 여급은 지역 초상을 함께 쓴다. 이 묶음에서 제외됐던 무릎상 62장을 같은 얼굴의 독립 원화로 교체했다. 위 11명의 그림도 이 수에 포함된다.

| 지역 | 그림 번호 | 수량 |
|---|---|---:|
| 아프리카 | 1–12 | 12장 |
| 아라비아 | 7 | 1장 |
| 중국 | 1–9, 11–14, 16–18 | 16장 |
| 인도 | 1–12 | 12장 |
| 일본 | 1–10 | 10장 |
| 조선 | 1–6 | 6장 |
| 아메리카 | 1, 3–6 | 5장 |

식민지 후원자가 시대와 직책에 따라 빌려 쓰는 이베리아·북유럽 남성 초상 40장도 기존 얼굴의 모자, 옷, 소품에 맞춰 다시 그렸다. 게임과 도감은 선택한 얼굴의 정확한 무릎상을 조회한다. 후원자의 자리가 비었을 때에는 대신 맞이하는 집사의 그림을 쓴다. [후원자 대화 화면](../../artifacts/feedback-185/colony-sponsor.png)

| 그림 묶음 | 얼굴별 번호 | 수량 |
|---|---|---:|
| `portraits/pools/mates/en/m` | 1–10 | 10장 |
| `portraits/pools/mates/es/m` | 1–10 | 10장 |
| `portraits/pools/sponsors/en/m` | 1–10 | 10장 |
| `portraits/pools/sponsors/es/m` | 1–10 | 10장 |

## 제작 및 확인

내장 ImageGen에 게임의 기존 얼굴상을 인물별로 입력해 머리부터 무릎까지 한 장으로 그렸다. 102장의 투명 WebP는 모두 1024×1536이다. 기존 얼굴상 102장의 SHA-256을 대조했다. [제작 지시문](../../artifacts/feedback-185/prompts.json) · [파일별 해시](../../artifacts/feedback-185/verified-hashes.json)

기존 얼굴과 새 무릎상을 나란히 놓은 전체 비교표는 7장이다. [1–15](../../artifacts/feedback-185/review-0.jpg) · [16–30](../../artifacts/feedback-185/review-1.jpg) · [31–45](../../artifacts/feedback-185/review-2.jpg) · [46–60](../../artifacts/feedback-185/review-3.jpg) · [61–75](../../artifacts/feedback-185/review-4.jpg) · [76–90](../../artifacts/feedback-185/review-5.jpg) · [91–102](../../artifacts/feedback-185/review-6.jpg)

- 이름 있는 여급 185명, 지역 얼굴상 270종, 지역 여급이 배정되는 도시 316곳에서 얼굴과 무릎상의 등록 키를 대조했다.
- 식민지에서 자동 생성되는 직책을 제외한 후원자 121자리의 역대 인물 항목 754건과, 식민 세력 9곳의 생성 사례 1,366건을 확인했다.
- 검사에서 선택된 파일 1,200개를 열어 해독했다. 짝 누락과 브라우저 콘솔·실행 오류는 각각 0건이었다. [검사 기록](../../artifacts/feedback-185/runtime.json)

재현 명령은 `node tests/feedback185_portraits_smoke.cjs`이다.
