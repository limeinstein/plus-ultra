# 해상 괴물 발견물 6종

- 제작일: 2026-10-27
- 생성 도구: Codex 내장 `image_gen`
- 원화: 1536×1024 PNG, 흰색의 얇은 칸막이를 둔 정확한 2×2 스토리보드
- 게임 결과: 576×256, 18프레임, 7.2초 GIF와 마지막 장면 JPG·WebP 장면 판

## 공통 프롬프트

```text
Use case: historical-scene.
Asset type: 2x2 cinematic discovery storyboard source for the PLUS ULTRA historical
exploration game. Create one 3:2 landscape sheet containing EXACTLY FOUR equal
panels in a clean 2x2 grid with thin straight white gutters. No text, captions,
numbers, logo, watermark, border, or UI. Show the same individual, anatomy, location,
weather, and period vessel in every panel. Cinematic painterly photorealism, coherent
colossal scale, safe margins for a 9:4 crop. No blood, modern objects, duplicates,
baby animal, or cartoon style.
```

## 종별 프롬프트

| ID | 고정 외형 | 네 장면 |
|---|---|---|
| `kraken` | 남보라색 거대 오징어, 긴 뾰족 외투막, 짧은 팔 8개와 긴 포획 촉수 2개 | 물고기 떼 속 그림자 → 돛대를 감는 촉수 → 눈·부리·팔 출현 → 로포텐의 배를 에워싼 전체 형태 |
| `giant-octopus` | 적갈색 둥근 머리, 비슷한 길이의 굵은 팔 정확히 8개 | 해초 바위로 위장 → 바위를 타는 두 팔 → 머리와 여덟 팔 출현 → 일본 배를 에워싼 수중 전체 형태 |
| `sea-serpent` | 올리브색의 매우 긴 무족 몸, 모래색 배, 붉은 갈기 | 수면의 세 굴곡 → 머리 출현 → 붉은 갈기 근접 → 노르웨이해를 S자로 가르는 전체 몸 |
| `sea-dragon` | 청록 비늘, 금빛 뿔·등가시, 흰 수염, 물갈퀴 앞발, 넓은 꼬리지느러미 | 수중 등가시 → 용오름 속 머리와 발 → 얼굴 근접 → 동중국해 정크선을 감싼 전체 형태 |
| `man-eating-shark` | 현실적인 거대 백상아리, 주둥이와 왼쪽 옆구리의 같은 흰 상처 | 한 몸에 연결된 등지느러미와 그림자 → 수중 머리 → 단독 도약 → 희망봉 카라벨 옆의 한 개체 전체 형태 |
| `ghost-ship` | 썩은 세 돛대 갈레온, 찢어진 회색 돛, 초록 등불과 안개 | 안개 속 등불 → 선수 현현 → 유령 포격 → 희망봉 바다 위에 나타난 전체 선체 |

크라켄은 기존 발견물 `kraken`을 새 원화로 교체했고, 나머지 다섯 종은
`js/data/moredisc.js`에 새 해상 발견물로 등록했다. 해전용 8방향 스프라이트와
발견물 GIF는 같은 외형·색을 공유하지만 서로 다른 파일이다.
