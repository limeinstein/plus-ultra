# 포토시 — 은산과 샛별 그림 (2026-10-29)

내장 `image_gen`으로 인물 여섯 명의 얼굴상·무릎상과 사건 그림 다섯 장을 제작했다.
여성 얼굴 참고는 사용자가 첨부한 사진이다. 코드상 로드리고 데 아얄라는 남성
엔코멘데로이고 구출 대상 여성은 차스카이므로, 첨부 얼굴은 차스카에 적용했다.
사진의 눈썹·눈·옆으로 흐르는 머리와 웃는 입 모양을 게임 채색화풍으로 옮겼다.

| 인물 | 얼굴상과 무릎상 경로 (`images/` 아래) |
| --- | --- |
| 차스카 | `portraits/legendary/chaska.webp`, `chaska_half.webp` |
| 디에고 우알파 | `portraits/history/huallpa.webp`, `huallpa_half.webp` |
| 후안 데 비야로엘 | `portraits/history/villarroel.webp`, `villarroel_half.webp` |
| 쿠시 마이타 | `portraits/history/kusimayta.webp`, `kusimayta_half.webp` |
| 로드리고 데 아얄라 | `portraits/history/ayala.webp`, `ayala_half.webp` |
| 감독관 멘도 | `portraits/history/mendo.webp`, `mendo_half.webp` |

얼굴상은 1024×1024, 무릎상은 1024×1536이며 한 사람의 두 초상은 같은 원화에서
만든다. 차스카는 적갈색·청록색 직물, 드러난 어깨와 은 핀으로 표현했다.
안데스풍 게임 의상이며 엄밀한 고증 복식의 재현을 주장하지 않는다.

장면은 `images/legend-events/`에 1800×800으로 저장한다.

| 그림 | 사건에서 쓰는 장면 |
| --- | --- |
| `potosi_wayra.webp` | 은산의 바람 화로 — 광구 주인과 원주민의 대립 |
| `potosi_hostage.webp` | 쿠라카의 부탁 — 아버지와 저택 발코니의 아얄라 |
| `potosi_caravan.webp` | 은을 나르는 라마 행렬에 숨는 구출대 |
| `potosi_tunnel.webp` | 우알파의 안내로 옛 잉카 갱도에 들어가는 구출대 |
| `potosi_star.webp` | 구출 뒤 아버지·마을 사람들과 다시 만나는 차스카 |

기존 사건이 호출하는 이미지 키에 연결하므로 사건 규칙이나 등장 연도는 바꾸지
않는다. 남성 다섯 명은 `G.Hist.speaker`, 차스카는 `G.Legend.speaker`의 전용 초상
경로를 그대로 사용한다. 매니페스트 17개와 얼굴 좌표 12개를 추가했다.

선택 원화·프롬프트는 `artifacts/potosi-art/selected.json`, 얼굴 참고는 같은 폴더의
`references/chaska-face.png`에 보존한다. 최초 차스카 초안은 다른 여성의 스타일
참고에 얼굴이 지나치게 가까워 채택하지 않았다. 얼굴 교정 시도 한 번은 도구의
안전 필터가 거절했고, 신체 강조를 제외해 다시 만든 초안을 최종 채택했다.

`tools/potosi_assets.py`가 알파 1~4의 숨은 형광 RGB를 지우고 원본 비율을 유지해
내보낸다. 검사용 모음은 `artifacts/potosi-art/portraits-preview.jpg`와
`events-preview.jpg`다.

검사 명령:

```powershell
python tools/potosi_assets.py --preview
node tests/potosi_art_smoke.js
node tests/potosi_smoke.js
```

투명 배경·형광색·해상도, 인물별 전용 무릎상 연결, 17장 실제 이미지 로드,
인물 여섯 명 대화창·장면 다섯 개 표시와 콘솔 오류를 확인한다. 브라우저는
검사가 끝나면 `finally`에서 닫는다.
