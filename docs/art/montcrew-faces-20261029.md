# 밀짚모자 일당 추억 장면의 얼굴 수정 (2026-10-29)

업적 「일당 수집 완료」의 「열 사람이 한 배에」 그림에서 세 동료의 얼굴을 기존 초상 원화에 맞췄다.

- 로드리고 데 레온: 짧은 짙은 녹색 머리, 왼쪽 눈의 세로 흉터, 각진 얼굴과 금 귀걸이.
- 브루노 폰 로젠탈: 풍성한 검은 곱슬머리, 작은 기울어진 모자와 보라 깃털, 수염 없는 길고 마른 얼굴.
- 우소포스 사미오스: 길게 도드라진 코, 눈썹과 가는 수염, 머릿수건 아래 곱슬머리.

## 적용

- 게임 그림: `images/legend-events/montcrew_oath.webp` (1881×836).
- 참조 초상: `images/portraits/mates/deleon.webp`, `rosenthal.webp`, `samios.webp`.
- 편집 방법: 내장 ImageGen으로 기존 단체 그림과 초상 세 장을 함께 참조했다. 열 사람의 배치, 팔을 든 자세, 나머지 동료와 배경을 유지하도록 요청했다.
- 전체 주문서: `docs/art/montcrew-faces-20261029-prompt.txt`.
- 편집 원본은 1882×836이어서 기존 화면 규격인 1881×836으로 맞추고 WebP 품질 96으로 저장했다.
- 기존 그림 이름을 유지하므로 manifest와 업적 자료의 연결을 바꿀 필요가 없다.

## 확인

`artifacts/montcrew-faces-20261029/verify.cjs`로 실제 게임을 file://에서 열어 `G.Achieve.scene(G.Achieve.get('montcrew'))`를 실행했다. 수정 그림이 1881×836으로 로딩되고 제목이 표시되며, 대사와 보상 창을 마치면 그림이 닫히는 것을 확인했다. pageerror·console.error 0건. 브라우저는 finally에서 닫았다.

로컬 보관 자료:

- 이전 그림: `artifacts/montcrew-faces-20261029/montcrew_oath-before.webp`.
- 편집 PNG 원본: `artifacts/montcrew-faces-20261029/montcrew_oath-edited.png`.
- 실제 화면: `artifacts/montcrew-faces-20261029/montcrew-in-game.png`.
- 검사 결과: `artifacts/montcrew-faces-20261029/verification.json`.
