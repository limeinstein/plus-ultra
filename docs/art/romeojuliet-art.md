# 베로나의 두 연인 — 초상과 사건 그림 (2026-11-01)

내장 `image_gen`으로 로미오와 줄리엣 및 다른 등장인물 다섯 명의 전용 초상과
사건 그림 다섯 장을 제작했다. 기존 ID·이름·부부 관계·등장 시기·사건 규칙은 유지한다.

로미오는 첨부된 타원형 얼굴과 턱선, 옆을 보는 눈빛과 옅은 미소를 살렸다.
줄리엣은 부드러운 얼굴 윤곽, 크게 뜬 갈색 눈과 살짝 벌린 입술의 놀란 표정,
길고 검은 가운데 가르마 머리를 기준으로 삼았다. 신체의 성적 강조는 제외하고
무덤 장면의 상아빛 흰 연회 드레스와 가벼운 흰 베일로 표현했다. 사각 목선,
퍼프 어깨에서 이어지는 긴 소매와 금빛 꽃 자수는 그 장면을 따른다.
몸과 고개를 비스듬히 돌려 첨부 사진의 얼굴 구도에 더 가깝게 맞췄다.
로미오는 푸른 벨벳과 은빛 자수의 연회복이며, 실사 피부 질감을 줄인 게임
채색화풍과 첫사랑에 들떠 조금은 철없는 청년의 표정으로 다시 다듬었다.

## 저장 파일

각 행의 두 그림은 같은 투명 원화에서 만든다. 얼굴상은 1024×1024,
무릎상은 1024×1536이다. 원화는 무릎 아래까지 담으며, 내보내기 때 원화의
아래를 잘라 내지 않고 전체 비율을 유지해 여백 안에 맞춘다.

| 인물 | 얼굴상 (`images/` 아래) | 무릎상 |
| --- | --- | --- |
| 로미오 | `portraits/legendary/romeo.webp` | `portraits/legendary/romeo_half.webp` |
| 줄리엣 | `portraits/legendary/juliet.webp` | `portraits/legendary/juliet_half.webp` |
| 머큐시오 | `portraits/history/rj_mercutio.webp` | `portraits/history/rj_mercutio_half.webp` |
| 티볼트 | `portraits/history/rj_tybalt.webp` | `portraits/history/rj_tybalt_half.webp` |
| 로렌스 수사 | `portraits/history/rj_laurence.webp` | `portraits/history/rj_laurence_half.webp` |
| 영주 에스칼루스 | `portraits/history/rj_escalus.webp` | `portraits/history/rj_escalus_half.webp` |
| 발타자르 | `portraits/history/rj_balthasar.webp` | `portraits/history/rj_balthasar_half.webp` |

장면은 `images/legend-events/`에 1881×836 WebP로 둔다.

| 그림 | 장면 |
| --- | --- |
| `rj_brawl.webp` | 베로나 광장의 두 가문 싸움과 멀리 서로를 바라보는 두 주인공 |
| `rj_mercutio.webp` | 쓰러진 머큐시오를 받치는 로미오와 물러서는 티볼트 |
| `rj_potion.webp` | 잠의 약·잃어버린 해독제 소식을 제독에게 전하는 발타자르 |
| `rj_grail.webp` | 금·은·납·나무 잔 네 개를 살펴보는 로미오와 로렌스 수사 |
| `rj_tomb.webp` | 캐풀렛가 무덤에서 깨어난 줄리엣과 안도하는 로미오 |

장면 속 인물도 선택된 전용 초상을 참고한다. 줄리엣의 흰 복장과 로미오의
수정한 그림체는 두 인물이 등장하는 장면에도 반영한다. 잠의 약 그림은 실제 대사가 시작되는
부두를 무대로 삼았다. 에스칼루스는 대화 초상에서 서고, 거리 싸움 장면에서 말을 탄다.

선택 원화·입력 역할·프롬프트·출력 경로는 `artifacts/romeojuliet-art/generation.json`,
얼굴 참고 두 장은 같은 폴더의 `references/`, 원화는 `raw/`에 보존한다.
모음 그림은 `portraits-preview.jpg`와 `events-preview.jpg`다.

## 연결과 검사

`images/manifest.js`에 초상 14장과 사건 그림 5장을 등록하고 얼굴 좌표 14개를
추가한다. 두 주인공은 `G.Legend.speaker`, 다른 다섯 명은 `G.Hist.speaker`의
기존 전용 경로를 사용한다. 숨은 알파 1~4의 형광 RGB는 내보낼 때 제거한다.

```powershell
python tools/romeojuliet_assets.py --preview
node tests/romeojuliet_art_smoke.js
node tests/romeojuliet_smoke.js
```

검사는 19장 실제 로드·규격·투명 배경·형광색, 전용 무릎상 연결과 얼굴 좌표,
일곱 명의 실제 대화창과 사건 그림 다섯 장 표시, 기존 사건 분기를 확인한다.
브라우저는 성공·실패 모두 `finally`에서 닫는다.
