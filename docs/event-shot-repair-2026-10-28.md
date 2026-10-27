# 이벤트 그림 유지·복귀 수정

2026-10-28. 사용자에게 업적 달성 및 전설 동료·이야기 이벤트 그림이 사라진다는 제보를 받았고, 가족·연애·혼례 그림도 함께 확인했다.

## 확인한 원인

신데렐라를 마지막 옛이야기 동료로 맞으면 영입 대화 도중 `Once Upon a Time` 업적 장면이 열린다. 기존 `FamEv.showPic`는 현재 그림을 닫고 새 그림으로 교체했으므로, 업적 장면이 끝난 뒤 원래 사건의 마지막 대사에서 그림이 없었다.

실제 `Tale.cinderella`와 `Achieve.afterHire`·대화 UI로 재현했으며, 수정 전 회귀 검사가 마지막 감사 대사의 그림 없음으로 실패했다.

또한 전설·업적 그림은 표시 요청 직후 대화를 열어, 처음 보는 큰 그림을 받기 전에 대사를 넘길 수 있었다. 업적은 `noStand: false`로 무릎상 인물이 그림을 가리는 문제도 있었다.

## 변경

- `js/systems/familyevent.js`: 현재 그림을 잠시 보관하고 복귀시키는 장면 핸들, 공용 그림 로더를 통한 준비 완료 대기, 중복 닫기 방지를 추가했다.
- `js/systems/achieve.js`: 업적 장면 시작 시 원래 그림을 보관하고 종료 뒤 복귀한다. 업적 전용 그림이 떠 있는 동안에는 무릎상 인물을 세우지 않는다.
- `js/ui/ui.js`: 현재 이벤트 그림이 준비된 뒤 대화·선택지를 시작한다. 기다림 상한과 재시도는 기존 `G.FX.img` 설정을 사용한다.

기존 사건 그림과 보상·등장 조건·저장 형식은 유지한다. 새 그림 제작은 필요하지 않았다.

## 가족·연애·혼례와 전체 연결 점검

- `tools/audit_event_images.py`: 현재 소스가 참조하는 이벤트 그림 233개, 파일 누락 0·등록 누락 0.
- 공개 웹판의 기존 이벤트 그림 214개도 HTTP 200으로 확인했다. 로컬에서 추가 제작 중인 그림과 공개 배포판의 수는 다르다.
- 가족·연애·혼례와 연애 사건 그림 41장을 브라우저에서 모두 읽고, 실제 `FamEv.play('tav_toast', …)` 사건의 그림과 대화·정리를 확인했다.

## 검증

- `node tests/event_shot_lifecycle_smoke.js`: 실제 전설 영입→업적→원래 그림 복귀, 700ms 지연 로딩 때 대화가 먼저 넘어가지 않음, 가족 그림 41장 및 실제 사건, 장면 종료 후 정리. 페이지·콘솔 오류 0.
- `node tests/event_images_completion_smoke.js`: 기존 추가 이벤트 49장, 자택 22장·왕녀 8장·개척 도시 5장, 실제 액자 표시·종료.
- `node tests/achievement_shots_smoke.js`: 업적 그림 95개, 일반 업적·명성 업적 22개의 그림·팝업 연결과 실제 화면.
- `node tests/family_events_smoke.js`: 가족 사건 35가지의 조건·그림, 연애·혼례·임신·출산·귀환·가족 일상과 실제 화면.
- `node tests/fairytales_smoke.js`: 옛이야기 동료 네 사람의 실제 영입 조건과 업적 달성·혼인.

화면: `artifacts/event-shot-repair/legend-after-achievement.png`, `artifacts/event-shot-repair/family-in-game.png`.

시험 브라우저는 모두 `finally`에서 닫는다. 웹판·설치판 배포는 수행하지 않았다.
