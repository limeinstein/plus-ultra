# 연산군·장녹수 초상과 사건 그림

2026-11-03 시작, 2026-11-04 마감. 사용자 첨부 얼굴·자세·표정을 바탕으로 내장 `image_gen`을 사용했다.

장녹수는 `38959.jpg`의 나른한 눈매·고개 기울임·올린 손을 살리고 조선 저고리·치마와 접부채를 입혔다. 연산군은 `38960.jpg`의 수염 없는 젊은 얼굴과 어깨 너머로 돌아보는 자세를 살려 붉은 곤룡포를 입혔다. 시대 배경은 게임 대본을 따른 극화이며, 원본 사진의 현대 의상·담배·상표는 옮기지 않았다.

## 마지막 잔치 자세 수정 (2026-11-04)

사용자가 몸을 비틀고 술병을 안은 채 붓을 쓰는 동작이 어색하다고 지적해, 내장 이미지 생성 편집으로 이 장면만 수정했다. 책상을 향해 편히 앉아 시선과 몸의 방향을 맞추고, 오른손은 붓을 잡고 왼손은 종이를 누른다. 술병은 방석 옆 바닥에 내려놓았다. 얼굴·곤룡포·편전·다가오는 횃불과 새벽빛은 유지했다. 게임 파일·생성 원본·미리보기·묶음을 함께 갱신했다.

[수정 지시문](../../artifacts/yeonsan-art-20261103/revision-ys-last-20261104.json). 이전 그림은 `artifacts/yeonsan-art-20261103/before-pose-revision-20261104/`에 보관했다.

## 흥청의 잔치 표정 수정 (2026-11-04)

사용자 요청에 따라 두 사람이 관객 대신 서로를 바라보며 은근한 호감을 주고받게 수정했다. 연산군은 장녹수 쪽으로 고개를 돌려 미소를 짓고, 장녹수는 눈을 맞추며 입가에 작은 미소를 띤다. 내장 이미지 생성으로 인물의 얼굴 정체성·복장·술 따르는 동작과 잔치 배경을 유지해 편집했다. 게임 이미지·원본·지시문·미리보기·전체 묶음을 함께 갱신했다.

[수정 지시문](../../artifacts/yeonsan-art-20261103/revision-ys-feast-20261104.json). 이전 그림은 `artifacts/yeonsan-art-20261103/before-expression-revision-20261104/`에 보관했다.

## 결과

- 주인공: 장녹수, 연산군.
- 조연: 제안대군, 김처선, 임숭재, 박원종, 흥청, 분이.
- 각 사람마다 투명 무릎상 1024×1536, 같은 원화에서 추출한 얼굴상 1024×1024.
- 사건 그림: 노비의 노래(`ys_song`), 흥청의 잔치(`ys_feast`), 채홍사(`ys_chae`), 반정의 밤(`ys_coup`), 불타는 장례원(`ys_ash`), 마지막 잔치(`ys_last`). 각 1881×836.

게임 파일은 `images/portraits/legendary/{jang_noksu,yeonsangun}[_half].webp`, `images/portraits/history/ys_*[_half].webp`, `images/legend-events/ys_*.webp`에 있다. 기존 주인공 초상은 `artifacts/yeonsan-art-20261103/before/`에 보관한다. `images/manifest.js`에 등록하고 여섯 조연의 `face`를 연결하며, `js/data/portraitfaces.js`의 눈·입·얼굴 좌표를 새 원화에 맞춰 갱신했다. 사건의 ID·선택·보상·저장 상태는 기존 대본을 사용한다.

## 원본·미리보기·지시문

- [인물 미리보기](../../artifacts/yeonsan-art-20261103/portraits-preview.jpg)
- [이벤트 미리보기](../../artifacts/yeonsan-art-20261103/events-preview.jpg)
- [전체 이미지 묶음](../../artifacts/yeonsan-art-20261103/yeonsan-art-20261103.zip)
- [제작 지시문·원본 경로·결과 목록](../../tools/yeonsan_art_20261103_prompts.json)
- 내장 생성 원본: `artifacts/yeonsan-art-20261103/sources/`.
- 내보내기: `python tools/package_yeonsan_art_20261103.py`. 얼굴·무릎상은 저장소의 기존 초상 규격 도구로 출력하며 생성 원본의 알파를 보존한다.

## 검증

결과: 원화 14장·게임 이미지 22장 저장, 해상도·투명 배경·얼굴 좌표 검사 통과. 실제 화면 22장 확인, 콘솔 오류 0. 기존 사건 진행 시험 15항목도 통과했다.

`node tests/yeonsan_art_20261103_smoke.cjs`는 실제 `file://` 실행에서 8명의 전용 얼굴·무릎상 선택, 22개 파일 해독·크기, 얼굴 좌표, 대화창 16화면, 이벤트 창 6화면, 장면 종료 뒤 정리를 확인한다. 화면과 결과는 `artifacts/yeonsan-art-20261103/screenshots/`에 저장한다.

기존 `tests/yeonsan_smoke.js`는 노래·주문·채홍사·반정 세 갈래·구출 성공과 실패·옛 저장 등 15개 항목을 확인한다. 이 환경에서는 저장소에 있는 `playwright-core`를 `playwright` 대신 연결하고 시스템 Chrome을 지정해 실행한다.
