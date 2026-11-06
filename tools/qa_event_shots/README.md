# 이벤트 연출 QA 캡처 (2026-11-06)

사건을 조건에 맞춰 억지로 일으키고, 대화창·물음·창이 뜰 때마다 **누르기 전에** 화면을 찍어 재 본다.
보고서: `docs/qa/event-presentation-2026-11-06.md`

1. 시작 저장: `ENDY=1600 ERAEND=0 OUT=/tmp/qa_event_shots node tools/qa_longrun/run1600.js` → `/tmp/qa_event_shots/save_1600.json`
2. 1600~1700 사건 82종: `node tools/qa_event_shots/shot.js` (ids.json) → `/tmp/qa_event_shots/shots.json` + `shots/*.jpg`
3. 그 밖의 사건 79종(1600년 이전 사건·이야기 모드·튜토리얼·민족 동료·1700 끝 연출…):
   `OUT=/tmp/qa_event_shots/shots2.json SHOTS=/tmp/qa_event_shots/shots2 node tools/qa_event_shots/shot.js $(node -p "require('./tools/qa_event_shots/ids2.json').join(' ')")`
   → `python3 tools/qa_event_shots/post2.py /tmp/qa_event_shots/shots2.json` (forcelib2 상태 확인으로 fired 보정)
4. 모아보기: `python3 tools/qa_event_shots/sheets.py /tmp/qa_event_shots/shots.json` → `sheets/<사건>.jpg` (4열, CAP=16 기본) + `sheets/index.json`

환경값: `START`(시작 저장) · `WORK`(결과 폴더) · `SHOT_WAIT`(찍기 전 기다림 ms, 기본 320 — 600 권장) · `SHOT_CANVAS=0`(캔버스 숨김, 빠르지만 얼굴 칸이 빈 것처럼 찍힌다) · `BROWSER_EXE`

- 페이지 쪽: `qalib.js`(자동 진행·Q.clear 가 window.__shotHook 을 부른다) · `evlog.js` · `forcelib.js`(FORCE, 82종) · `forcelib2.js`(FORCE2, 79종) · `shotlib.js`(재는 것: 창 제목·글·img·바탕 그림·캔버스가 그려졌나·글 이상·넘침·그림 고리 실패)
- 한계: 바다 WebGL(#world)·3D 배는 그리지 않는다 · 애니메이션 0초 · 장면 그림(FamEv.showPic)은 .modal-back 밖이라 metrics 의 imgs 에 잡히지 않는다(화면으로 본다) · 시간을 당겨 일으키므로 「1분 안」「15분 안」 같은 실제 시간 기준이 실제 놀이보다 쉽게 걸린다.
