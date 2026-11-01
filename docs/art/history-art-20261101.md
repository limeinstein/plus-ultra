# 역사 사건 인물화·장면 보완 (2026-11-01)

앞서 추가된 사건의 실제 인물 자료·대사·그림 키를 대조해 전용 인물 자료
50개와 장면 43개를 제작했다. 처음의 정적 검사에서 빠진 프레베자 해전과
네르친스크의 북경·이르쿠츠크 분기를 포함한다. 주석에만 남은 견우·직녀 그림은
역사 사건 범위에서 제외한다.

| 사건 묶음 | 새 인물 초상 쌍 | 장면 |
| --- | ---: | ---: |
| 오스만과 유럽 세계의 다툼 | 18 | 8 |
| 정묘호란·병자호란 | 8 | 9 |
| 후금과 명·청 | 6 | 5 |
| 네르친스크 조약 | 5 | 4 |
| 정씨 대만과 청 수군 | 5 | 6 |
| 세키가하라 | 4 | 5 |
| 오다와라 | 1 | 4 |
| 마카오 | 3 | 2 |
| 합계 | 50 | 43 |

얼굴상 50장과 무릎상 50장, 장면 43장으로 총 143개의 게임 파일이다. 같은 원화에서 두 초상을
만들며, 홍타이지처럼 같은 인물의 시기·복식에 따른 자료 ID 두 종도 포함한다.
최명길·임경업·원숭환·히데요시·이에야스·정성공·시랑 등 기존 전용 초상은
장면 제작의 인물 참고로 재사용한다. 역사 화자·동료의 등록과 사건 규칙은 바꾸지 않는다.

화풍은 사진 같은 피부 질감을 줄인 게임 채색화풍이다. 나이·인종·지역 복식과
표정은 각 인물 자료의 `look`과 사건 대사를 기준으로 삼는다. 원화는 머리부터
무릎 아래까지 담고, 내보낼 때 무릎을 자르거나 세로로 압축하지 않는다.

## 결과 파일

- 얼굴상: `images/portraits/history/<인물 ID>.webp`, 1024×1024 투명 WebP.
- 무릎상: 같은 경로의 `<인물 ID>_half.webp`, 1024×1536 투명 WebP.
- 장면: `images/legend-events/<장면 ID>.webp`, 1881×836 불투명 WebP.
- 원화: `artifacts/history-art-20261101/raw/`.
- 생성 도구·선택 원화·실제 프롬프트·참고 역할: 같은 폴더의 `selected/*.json`.
- 조사 원본: `artifacts/event-art-20261101/audit.json`.
- 제작 인물 목록: `artifacts/history-art-20261101/portrait-plan.json`.
- 제작 장면 목록과 대사 근거: `artifacts/history-art-20261101/scene-plan.json`.

생성은 내장 `image_gen`을 사용한다. 생성 원화에 숨은 알파 1~4의 형광 RGB를
지우고 원본 비율과 실제 알파를 유지해 내보낸다. 각 인물의 얼굴 좌표도 등록한다.

강희제의 초안에서 관모·머리 모양과 얼굴 흔적이 자료 설명과 어긋난 부분을
확인해 청나라 관모·변발과 가벼운 두창 흔적으로 교정했다. 관모 검토에는
[고궁박물원의 강희제 자료](https://www.dpm.org.cn/court/lineage/226256.html)와
[국립고궁박물원의 강희 연간 관정 자료](https://digitalarchive.npm.gov.tw/Collection/Detail/63624?dep=U)를 참고했다.

## 검사용 모음

모음 파일은 `artifacts/history-art-20261101/`에 둔다.

| 묶음 | 인물 | 사건 장면 |
| --- | --- | --- |
| 오스만·유럽 | [인물](../../artifacts/history-art-20261101/portrait-ottomaneurope-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-ottomaneurope-preview.jpg) |
| 정묘·병자호란 | [인물](../../artifacts/history-art-20261101/portrait-horan-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-horan-preview.jpg) |
| 후금 | [인물](../../artifacts/history-art-20261101/portrait-houjin-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-houjin-preview.jpg) |
| 네르친스크 | [인물](../../artifacts/history-art-20261101/portrait-nerchinsk-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-nerchinsk-preview.jpg) |
| 대만 | [인물](../../artifacts/history-art-20261101/portrait-taiwan-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-taiwan-preview.jpg) |
| 세키가하라 | [인물](../../artifacts/history-art-20261101/portrait-sekigahara-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-sekigahara-preview.jpg) |
| 오다와라 | [인물](../../artifacts/history-art-20261101/portrait-odawara-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-odawara-preview.jpg) |
| 마카오 | [인물](../../artifacts/history-art-20261101/portrait-macao-preview.jpg) | [장면](../../artifacts/history-art-20261101/scene-macao-preview.jpg) |

## 내보내기와 검사

```powershell
python tools/history_art_20261101.py --import-ready --register --preview
node tests/history_missing_art_20261101_smoke.js
```

해상도·투명 배경·형광 픽셀, 역사 화자의 전용 얼굴상·무릎상과 얼굴 좌표,
143장 실제 로드, 50명 대화창과 43개 장면 액자 표시·콘솔 오류를 확인한다.
브라우저는 성공·실패 모두 `finally`에서 닫는다.
