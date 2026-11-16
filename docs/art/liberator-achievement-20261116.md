# 해방자 업적과 전용 사건샷 — 2026-11-16

현재 동료 항해사가 한 명 이상이고 전원이 아프리카 흑인 항해사이면 「해방자」 업적을 달성한다. 제독과 배의 일반 선원 수, 과거에 고용했던 동료는 조건에 포함하지 않는다. 성별 제한은 없다.

보상은 명성 +2,000, 악명 −20이다. 악명은 0 아래로 내려가지 않으며 추가 금화는 없다. 기본 탐험 명성 경로를 사용하여 직업별 배수 없이 정확히 2,000을 지급한다. 기존 업적 저장 자료에 달성 여부를 남기므로 검사 반복·저장 복원·편성 변경 뒤에도 보상을 다시 지급하지 않는다.

## 현재 편성 판정

인물 정의의 `blackAfrican` 표식을 사용한다. 기존 서아프리카 철새, 스와힐리 고장 동료, 아프리카 흑인 민족 합류 동료의 생성 자료에 표식을 연결했다. 아프리카 고장의 기존 고정 동료도 출신 자료에 따라 판정한다. 북아프리카를 포함한 모든 아프리카 출신을 일괄 분류하지 않는다.

새 표식이 없는 옛 저장은 기존 국적·민족·출신 범위 자료로 판정한다. 얼굴 그림·복식·언어·현재 활동 항구만으로는 출신을 추정하지 않는다. 정의가 없는 동료가 섞였으면 전원 조건을 만족하지 않는다.

고용 직후 기존 업적 검사, 해고 직후 새 편성 검사, 도시 메뉴 갱신, 하루 경과 검사에 연결했다. 마지막 다른 출신 동료를 해고해 조건을 만족하는 경우에도 바로 달성한다. 옛 저장에서 첫 하루 검사로 달성한 경우도 전용 사건샷을 대기열에 넣는다.

조정값은 `js/data/base.js`의 `G.BALANCE.liberatorAchievement`이다. 인원 하한 1명, 명성 2,000, 악명 −20을 모아 두었다.

## 사건샷

![해방자 — 우리가 함께 정한 항로](../../images/achievement-events/liberator.webp)

아프리카 여러 땅에서 온 항해사들이 같은 갑판에서 함께 항로를 정하는 장면이다. 흰 셔츠·상의 탈의·화려한 전통 직물을 섞고, 젖은 피부와 옷감·돛·밧줄을 기존 게임의 회화풍으로 표현했다. 두 인물이 악수하고 동료들이 함께 환호하는 구도다. 업적 달성 대화와 도감에서 같은 전용 원화를 사용한다.

- 제작 방식: 내장 ImageGen, 기존 아프리카 항해사 `af21_half`·`af02_half` 참고.
- 게임 원화: `images/achievement-events/liberator.webp`, 1881×836.
- 생성 원본: `artifacts/liberator-achievement-20261116/sources/liberator.png`.
- 제작 프롬프트·대응·해시: [tools/liberator_achievement_20261116_prompts.json](../../tools/liberator_achievement_20261116_prompts.json).
- 패키징: `python tools/package_liberator_achievement_20261116.py`.

## 검증

`node tests/liberator_achievement_20261116_smoke.cjs` 통과. 실제 Chromium에서 빈 명단·혼성 편성·과거 고용 이력 제외, 기존 출신 자료와 옛 저장 복원, 고용·해고 직후 달성, 정확한 일회 보상과 악명 하한, 전용 사건샷·수첩·도감 표시를 확인했다. 페이지·콘솔 오류와 원화 요청 실패는 0건이다.

검증 결과는 [report.json](../../artifacts/liberator-achievement-20261116/report.json), 실제 화면은 [사건샷](../../artifacts/liberator-achievement-20261116/event-runtime.png)·[보상](../../artifacts/liberator-achievement-20261116/reward-runtime.png)·[도감](../../artifacts/liberator-achievement-20261116/catalog-runtime.png)에 보존한다. 공통 업적 처리 회귀 검사 `node tests/market_collection_achievements_20261116_smoke.cjs --rules-only`도 90개 항목을 통과했고, `node tests/folkjoin_smoke.js`에서 실제 민족 동료 합류·거절·저장 복원을 확인했다. 변경 코드 구문 검사와 `git diff --check`도 통과했다.
