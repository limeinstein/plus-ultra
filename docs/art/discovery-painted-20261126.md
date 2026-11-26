# 발견 그림의 폴리곤·모형 양식 제거

2026-11-26 사용자 요청: 발견 그림에서 폴리곤 스타일을 사용하지 않는다. 연결·재생 검사와 별개로 그림 자체와 GIF의 앞·중간·끝 장면을 검수한다.

## 적용 기준

기존 유적·보물·교역품 657종은 내장 ImageGen으로 2D 유화·과슈 원화를 다시 제작한다. 붓질과 자연스러운 재질이 보이는 실물 크기의 장면이며, 미니어처·디오라마·검은 배경의 3D 회전 전시·낮은 다각형 표현을 사용하지 않는다. 피라미드·무열왕릉·달항아리 세 장을 먼저 제작해 양식을 확인했다.

기존 ImageGen 회화 원화가 있는 자연·식물 271종은 원화를 보존하고 GIF에서 도형 조각의 조립, 합성 별과 달, 과도한 밤색 덮개를 제거한다. 앞선 누락 보완에서 만든 438종과 기존 동물·민족·항로 그림은 이 제작 목록에 포함하지 않는다.

새로운 원화 657종과 연출 재구성 271종, 합계 928종이 대상이다. 모든 장면은 하나의 회화에서 약 5%의 부드러운 카메라 확대 해제로 만들며, 마지막에는 전체 그림을 남긴다. 그림이 입체 모형으로 바뀌거나 조각들이 모여 완성되는 장면은 없다. 독립적인 관절·인물 동작 애니메이션을 새로 제작했다는 뜻은 아니다.

## 구도와 단서 검수

고전 작품 8종은 전신·전체 원작의 복제가 아닌 세부 또는 닫힌 패널을 보여준다. `creation`은 손과 얼굴, `david`·`venusmilo`·`laocoon`은 머리와 목, `saliera`는 금세공 받침과 조개 그릇, `urbinovenus`는 얼굴·베개 세부다. `earthlydelights`와 `ghentaltar`는 닫힌 외부 패널을 그렸다. 우르비노 세부를 가린 큰 천은 검수 후 제거했으며 이전 시안도 보존했다. 겐트 제단화 외부 패널 참고: [MSK 복원 자료](https://www.mskgent.be/en/exhibitions/restoration-ghent-altarpiece/).

이야기 발견물 7종은 `js/data/story.js`의 실제 단서를 반영했다. 그라나다의 작은 글자와 얼굴, 카이로의 쇠붓, 델리 쇠기둥의 새 글자, 쿠스코의 하늘빛 옷을 입은 이방인과 돌 다섯 개, 항저우 찻집의 윷판, 사카이의 제비와 박 이야기, 한양의 기름종이 편지를 각각 구별한다. 윷판은 둘레 20점과 내부 9점, 윷가락 네 개를 육안으로 세어 수정했다. `revisions/`와 `sources/*-v1.*` 등에 수정 전 시안을 보존한다.

## 파일과 재출력

- `tools/discovery_painted_20261126/plan.json`: 새 제작·기존 회화 재구성 대상.
- 같은 폴더의 `sources/<ID>.png`와 JSON: 원화·실제 생성 지시문 또는 기존 회화의 출처.
- `before/images/`: 교체 전 GIF·마지막 장면·재생 시트. 원본을 지우거나 덮어쓰지 않는다.
- `receipts/<ID>.json`: 원화·변경 전·변경 후 파일의 SHA-256과 새 원화 여부.
- `assets.json`·`prompts.json`: 전체 작업이 끝난 뒤의 파일·지시문 모음.
- `images/discoveries/<ID>.gif`, `images/discovery-ends/<ID>.jpg`, `images/discovery-sheets/<ID>.webp`: 게임의 기존 경로에 교체한다. ID·발견 조건·저장 형식을 바꾸지 않는다.

`python tools/discovery_painted_20261126/build.py`로 준비된 원화만 출력한다. `--watch`는 원화가 추가될 때 차례로 반영하고 전체 928종이 끝나면 종료한다. 파일은 임시 파일을 완성한 뒤 바꿔 넣으며, 원화가 바뀐 ID만 다시 만든다. GIF 길이는 기존 `G.FX.reveal`에서 읽는다.

옛 유적·자연·식물·보물·교역품 출력기와 시트 출력기는 회화 적용 영수증이 있는 발견물을 덮어쓰지 않는다. 회화가 연결된 대상은 이 새 출력기로 다시 만든다.

## 검증

- `python tests/discovery_painted_20261126_files.py`: 전체 928종의 원화·기존 회화 보존·변경 전/후 해시, 끝 장면과 원화의 일치, GIF와 시트의 마지막 장면, 옛 출력기 8개 경로의 덮어쓰기 방지.
- `python tools/discovery_gif_qa_20261126.py`: 현재 전체 발견물의 경로·GIF 전체 프레임·움직임·끝 장면·시트 검사.
- `python tests/discovery_assets_smoke.py`: 실제 목록 전체와 GIF·끝 장면·시트·목록 연결.
- `node tests/discovery_gif_all_20261126_smoke.cjs`: 실제 파일 실행에서 전체 그림 읽기와 발견 팝업·건너뛰기·끝 장면·콘솔 오류 검사.
- `node tests/discovery_painted_20261126_gallery.cjs`: 928종 미리보기의 검색·갈래·GIF/끝 장면 전환과 원화·이전 GIF 연결 검사.

기존 유적·보물·교역품·자연·아메리카 그림 검사는 회화 적용 영수증이 있으면 새 원화와 결과 파일을 비교한다. 옛 모형의 프레임 수나 합성 밤 장면을 새 회화의 요건으로 사용하지 않는다. 영수증이 없는 옛 그림의 검사는 유지한다.

작업 중 결과와 최종 결과는 `artifacts/discovery-painted-20261126/`에 보존한다. [회화 적용 미리보기](../../artifacts/discovery-painted-20261126/index.html)에서는 현재 GIF와 교체 전 GIF를 모두 열 수 있다.

## 최종 실행 결과

새 원화 657종과 기존 회화 재구성 271종, 합계 928종을 모두 반영했다. 928종의 원화·변경 전후 해시·GIF 끝 장면·시트 검사가 통과했으며 옛 출력기 8개 경로가 새 회화를 덮어쓰지 않는 것도 확인했다. 최종 그림 모음 18장의 마지막 장면 928종을 육안으로 검수하고, 대표 6종은 이전 GIF와 새 GIF의 앞·중간·끝을 비교했다.

전체 발견물 1,744종의 파일·GIF 전체 프레임·목록 연결 검사와 실제 브라우저 그림 읽기가 통과했다. 발견 연출 15종의 재생·건너뛰기·끝 장면 유지·화면 정리도 통과했고 콘솔 오류는 0건이다. 928종 미리보기의 검색·갈래·실제 GIF/끝 장면 전환·원화·이전 GIF 연결도 통과했다. 수정한 파이썬 도구·검사의 문법 검사와 변경 파일의 공백 검사도 통과했다.

[통합 검사 결과](../../artifacts/discovery-painted-20261126/qa-summary.json) · [원화·보존본·출력 일치](../../artifacts/discovery-painted-20261126/style.json) · [육안 검수 기록](../../artifacts/discovery-painted-20261126/visual-review.json) · [실제 게임 검사](../../artifacts/discovery-gif-qa-20261126/runtime.json).

[게임 화면: 피라미드](../../artifacts/discovery-gif-qa-20261126/runtime-giza.png) · [게임 화면: 달항아리](../../artifacts/discovery-gif-qa-20261126/runtime-moonjar.png) · [전후 비교](../../artifacts/discovery-painted-20261126/painted-before-after.jpg).
