# 탐험·항해 이벤트 스프라이트 10종

내장 ImageGen으로 생성했습니다. 기존 `images/effects/departure_gull.png`의 회화풍과 4열×2행, 8프레임 구성을 참고했습니다.
각 PNG는 1774×887 RGBA이며 실제 투명 알파가 있습니다. 생성 원본을 바이트 변경 없이 보관했습니다.

| 이벤트 | 파일 | 프레임 시간 | 재생 |
|---|---|---:|---|
| 오아시스 | `oasis.png` | 160 ms | 반복 |
| 별똥별 | `shooting_star.png` | 100 ms | 1회 |
| 은하수 | `milky_way.png` | 200 ms | 반복 |
| 일식 | `solar_eclipse.png` | 230 ms | 1회 |
| 월식 | `lunar_eclipse.png` | 230 ms | 1회 |
| 혹서기 | `extreme_heat.png` | 140 ms | 반복 |
| 혹한기 | `extreme_cold.png` | 120 ms | 반복 |
| 용오름 | `waterspout.png` | 110 ms | 반복 |
| 쓰나미 | `tsunami.png` | 120 ms | 1회 |
| 메뚜기떼 | `locust_swarm.png` | 90 ms | 반복 |

## 프레임 자르기

왼쪽 위부터 가로 방향으로 읽고 다음 행으로 넘어갑니다.
정확한 자르기 영역은 `event_sprites.json`의 `frames[].sourceRect` 또는 `xBounds`, `yBounds`를 사용하세요.
생성 원본의 크기가 홀수이고 쓰나미의 행 사이 여백이 중앙보다 아래에 있으므로 256픽셀 또는 균등 셀로 가정하지 않습니다.
쓰나미 행 구분은 y=465, 나머지는 y=444입니다. 모든 세로 구분은 x=444, 887, 1330입니다.
각 프레임의 `alphaBounds`는 알파 8 초과 영역의 셀 내부 좌표이며 오른쪽·아래 좌표는 포함하지 않습니다.
알파 여백을 자른 후 `pivotNormalized`를 사용합니다. 천문 효과는 중심, 지면·수면 효과는 하단 중앙을 기준으로 배치합니다.

## 생성·검사

`prompts.json`: 공통 스타일과 이벤트별 최종 생성 지시문.
`layout-correction.txt`: 혹서기·쓰나미에 적용한 배치 정리 지시문.
`validation.json`: 실제 크기·RGBA·완전 투명 픽셀·8개 서로 다른 프레임·구분선 검사 결과.
알파 8 초과 픽셀을 기준으로 모든 프레임 구분선의 4픽셀 폭에 내용이 없음을 확인했습니다.
이번 산출물은 이미지와 메타데이터입니다. 게임 이벤트 호출부 연결은 포함하지 않습니다.
