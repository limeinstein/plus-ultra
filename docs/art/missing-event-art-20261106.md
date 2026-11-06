# 누락 사건 인물화·소굴 장면·업적샷 보완

사용자 요청: 클로드가 만든 이벤트의 누락 얼굴상·무릎상·이벤트샷과 업적샷을 확인해 제작한다.

## 확인한 누락

- 기존 역사 인물 372명과 사건·전설·동화 동료 86명은 얼굴상·무릎상 파일이 모두 있었다. 기존 사건 장면 340종에도 누락이 없었다.
- 새 해적 소굴의 두목 14명·간부 21명은 전용 초상이 없어 일반 선원 그림을 사용했다. 35명 모두 별도 원화로 제작했다.
- 일곱 소굴의 발견·점령 대화에는 장면 그림 연결이 없었다. 제르바·마모라·클레어·토르투가·생트마리·홀로·쌍서를 각각 그렸다.
- 업적 「Dream Come True」와 「해적왕」은 전용 파일과 등록이 빠져 있었다. 업적 정의와 장면 자료를 대조해 확인했다.

## 파일과 연결

- 인물화: `images/portraits/rivals/<인물 이름>.webp`(448×448 얼굴상), 같은 이름의 `_half.webp`(1024×1536 무릎상). 얼굴상은 같은 무릎상 원화에서 추출하므로 얼굴·옷이 같다. 투명 알파를 보존하고 얼굴·눈·입 좌표를 함께 등록한다.
- 사건샷: `images/legend-events/lair_<바다>.webp` 7장, 각 1881×836. 각 지역의 건축·식생·선박을 구별한다.
- 업적샷: `images/achievement-events/dreamcome.webp`, `pirateking.webp`, 각 1881×836. 네 공주는 기존 얼굴상 4장을 참고해 얼굴·머리·복식을 맞춘다.
- `G.Captains.speaker`의 기존 경쟁자 초상 경로로 바다 조우·포로 대화·소굴 두목에 같은 전용 초상을 표시한다. 소굴 두목을 동료 자료에 추가하지 않는다.
- `G.Lair.tell`은 발견·첫 두목 격파·점령 대화 동안 해당 섬 그림을 표시한다. `G.Hist.withScene`의 `finally`에서 그림을 정리한 뒤 업적을 연다.
- 공주들을 본가에 모신 뒤에는 `dreamcome` 원화를 입주 대화에도 표시한다. 취소하면 그림을 띄우지 않고, 대사 오류가 나도 `finally`에서 정리한다.
- 업적은 기존 `achievementPic`의 업적 ID 경로로 전용 그림을 선택한다.

기존 이미지 파일은 덮어쓰지 않는다. 원본은 `artifacts/missing-event-art-20261106/sources/`, 제작 지시문·원본 경로는 `tools/missing_event_art_20261106_prompts.json`과 `artifacts/missing-event-art-20261106/delivery.json`, 전체 묶음은 `artifacts/missing-event-art-20261106/missing-event-art-20261106.zip`이다. 내장 `image_gen`을 사용했다.

[79장 파일 묶음](../../artifacts/missing-event-art-20261106/missing-event-art-20261106.zip) · [전체 생성 지시문 44개·원본 위치](../../artifacts/missing-event-art-20261106/delivery.json) · [이미지 규격·투명도·얼굴 좌표 검사](../../artifacts/missing-event-art-20261106/asset-checks.json).

## 미리보기

인물 35명: [제르바](missing-event-art-20261106-portraits-1.jpg), [마모라](missing-event-art-20261106-portraits-2.jpg), [클레어](missing-event-art-20261106-portraits-3.jpg), [토르투가](missing-event-art-20261106-portraits-4.jpg), [생트마리](missing-event-art-20261106-portraits-5.jpg), [홀로](missing-event-art-20261106-portraits-6.jpg), [쌍서](missing-event-art-20261106-portraits-7.jpg).

사건·업적: [소굴 그림 1](missing-event-art-20261106-scenes-1.jpg), [소굴·업적 그림 2](missing-event-art-20261106-scenes-2.jpg).

## 검증

2026-11-07 검증 완료. 얼굴상 35장·무릎상 35장·사건샷 7장·업적샷 2장, 총 79장을 추가했다.

- 사건 이미지 541종: 파일 누락 0, 미등록 0. 바다 코드를 이어 붙이는 일곱 소굴 열쇠도 현재 자료에서 펼쳐 검사하도록 기존 점검 도구를 보완했다.
- 역사 인물 372명·사건 동료 86명·업적 101종: 실제 이미지 선택 경로와 파일을 대조해 누락 0.
- 새 인물 35명: 현재 두목·간부 명부와 제작 목록 일치, 바다 선장의 얼굴·무릎상 선택, 70개 WebP 해독·규격·알파·얼굴 좌표 확인.
- 실제 대화 화면 70장과 장면 화면 9장, 총 79장 캡처. 인물 원화·얼굴 추출·미리보기와 화면 표본을 눈으로 확인했다.
- 소굴 7곳 × 발견·첫 두목 격파·점령 장면, 새 업적 2종, 공주 입주 취소와 대사 오류 뒤 그림 정리 검사 통과.
- 기존 `pirate_lair_smoke.js`: 실제 해전·소굴 발견/점령·저장/불러오기·공주 입주·업적·가족 처리 통과.
- 브라우저 `pageerror`·`console.error` 0. 각 검사의 브라우저는 `finally`에서 닫았다.

[브라우저 검사 결과](../../artifacts/missing-event-art-20261106/runtime/checks.json) · [전체 명부 점검](../../artifacts/missing-event-art-20261106/runtime/inventory.json) · [실제 무릎상 대화](../../artifacts/missing-event-art-20261106/runtime/lairchief_med_1_half.png) · [해적왕 장면 표시](../../artifacts/missing-event-art-20261106/runtime/pirateking_scene.png).

검사 명령:

```text
python tools/package_missing_event_art_20261106.py
python tools/audit_event_images.py
node tests/missing_event_art_20261106_smoke.cjs
node tests/pirate_lair_smoke.js
```

목·어깨 접합 검수로 표시를 막아 둔 옛 무릎상은 파일 누락과 별도로 구별했다.
