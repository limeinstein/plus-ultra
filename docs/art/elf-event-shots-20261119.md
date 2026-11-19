# 엘프 일기토와 동료 지원 사건샷

내장 `image_gen`으로 공용 사건 원화 4장을 제작했다. 게임용 파일은 `images/elf-events/{duel,support,sisters,join}_20261119.webp`이며 모두 1881×836이다. 엘프 20명의 개별 초상 대신 사건 흐름을 그린 공용 삽화이며, 실제 이름·자매 관계·말하는 인물의 얼굴은 기존 게임 자료를 따른다.

- `duel`: 북방 숲의 첫 조우와 세계수·엘프 바위 앞 일기토 제안.
- `support`: 부관에게 대리 출전을 맡겼을 때 지원 대사와 겨루기 직전.
- `sisters`: 먼저 동료가 된 자매의 설득, 합류 뒤 자매 재회 대화.
- `join`: 30일 뒤 돌아온 엘프의 동행 요청과 재대결 승리 뒤 합류. 항구의 새 항해를 상징하는 그림이다.

대화 중 기존 사건 액자로 띄우고 실제 결투를 시작하기 전에 닫는다. 승리·패배·물러서기·합류 거절·대화 예외에서도 액자를 정리한다. 발견처럼 바깥 사건의 그림이 있으면 잠깐 숨겼다가 돌려놓는다. 전투·영입 조건과 확률·보상·저장 형식은 그대로다.

## 제작 자료

- [프롬프트 4종](../../tools/elf_event_shots_20261119_prompts.json)
- [생성 원본](../../artifacts/elf-event-shots-20261119/originals/)
- [게임 화면: 일기토](../../artifacts/elf-event-shots-20261119/duel.png), [부관 지원](../../artifacts/elf-event-shots-20261119/support.png), [자매 설득](../../artifacts/elf-event-shots-20261119/sisters.png), [재회·합류](../../artifacts/elf-event-shots-20261119/join.png)
- 재포장: `python tools/package_elf_event_shots_20261119.py`. 보존 원본을 우선 사용하고 게임 목록에는 네 파일만 추가한다.

## 검증

`node tests/elf_event_shots_20261119_smoke.cjs`: 38개 검사 통과, 원화 네 장의 실제 이미지 해독·해상도, 직접 결투·대리 출전·자매 설득·설득 대신 결투·물러서기·패배·재회·합류·재대결 실패·합류 거절·자매 재회·바깥 그림 복구·예외 정리, 콘솔 오류 0건. [결과](../../artifacts/elf-event-shots-20261119/report.json).

기존 `tests/creatures_smoke.js`도 저장소의 `playwright-core`와 로컬 Chrome으로 실행해 13개 검사 통과·콘솔 오류 0건을 확인했다. 괴물 보상·발견, 세계수, 엘프 재회·자매 설득, 거대 동물 추격을 함께 검사한다. 시험 브라우저는 모두 종료했다.
