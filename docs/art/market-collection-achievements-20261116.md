# 보석·장신구·약재 수집 업적과 업적샷 (2026-11-16)

시장에 추가한 장신구·보석 50종과 약·약재 20종을 모으는 업적 9개를 추가했다. 성공적으로 얻은 아이템 종류를 `state.marketItemsEver`에 기록한다. 같은 물건을 여러 개 얻어도 한 종류이며, 사용·매각·증여·보관 뒤에도 수집 기록과 달성 업적은 유지된다.

![업적샷 9종](../../artifacts/market-collection-achievements-20261116/preview.jpg)

## 조건과 보상

- **보석함의 첫빛** — 장신구 10종. 금화 5,000닢·교역 명성 150·칭호 「보석함의 주인」.
- **항구의 감정가** — 장신구 25종. 금화 15,000닢·교역 명성 350·칭호 「항구의 감정가」.
- **세상의 장신구** — 장신구 50종. 금화 80,000닢·교역 명성 1,000·칭호 「세계의 보석 감정가」.
- **열한 바다의 보석함** — 11개 지역마다 특산 장신구 1종 이상. 금화 30,000닢·교역 명성 600·칭호 「보석 항로의 개척자」.
- **전설을 꿰는 자** — 전설 장신구 6종. 금화 100,000닢·탐험 명성 1,200·칭호 「전설의 보석 수집가」.
- **여행 약상자** — 약·약재 5종. 금화 3,000닢·사교 명성 150·칭호 「약상자를 챙긴 제독」.
- **바다의 약재상** — 약·약재 10종. 금화 10,000닢·사교 명성 350·칭호 「바다의 약재상」.
- **동서 약재대전** — 약·약재 20종. 금화 40,000닢·사교 명성 800·칭호 「동서 약재의 감정가」.
- **작은 보물의 대항해** — 장신구 50종과 약·약재 20종 전체 수집. 금화 150,000닢·탐험 명성 1,800·칭호 「세상의 작은 보물을 모은 자」.

보상은 업적마다 한 번만 지급하며, 명성은 기존 갈래 배수와 성장 규칙을 적용한다. 조건·기준 보상은 `G.BALANCE.marketCollections`에 모았다. 전설 6종도 장신구 50종에 포함된다. 수집 대상은 `marketCollection`이 `jewels_20261116` 또는 `medicine_20261116`인 새 지역 특산품 70종이다.

## 수집과 표시

`R.addItem`·`R.addMarketItems`의 성공 경로에서 기록한다. 소지품 칸이 가득 차 받지 못하면 기록하지 않는다. 구입 직후 업적을 판정해 보상을 지급하고, 상인 대화가 끝나면 기존 업적 대기열로 장면을 재생한다. 다른 사건에서 얻은 물건도 기록하며, 업적 장면은 기존 사건 종료·항구 도착 경로에서 이어진다.

수첩 「업적」 앞쪽에 수집 카드 9개를 배치했다. 업적샷·종류 수·진행률·보상을 표시하며, 카드를 펼치면 수집한 품목과 남은 품목 또는 지역을 볼 수 있다. 도감에서도 장면·조건·칭호·실제 명성 갈래를 표시한다.

옛 저장은 새 필드가 없어도 소지품·자택 보관함에 남은 품목을 찾아 기록을 보충한다. 기능 추가 전에 이미 쓰거나 팔아 사라진 물건은 과거 획득 기록이 없어 복원할 수 없다. 새 항해에는 이전 항해의 기록이 넘어오지 않는다.

## 업적샷

내장 `image_gen`으로 업적마다 개별 장면을 제작했다. 첫 보석함·시장 감정·전체 전시·11지역 교류·전설 6종·선실 약상자·인도양 약재상·동서 약재 연구·70종 완성 축하를 각각 다른 구도로 담았다.

- 게임 그림: `images/achievement-events/collect_*.webp` 9장, 1881×836 RGB.
- [원본·개별 프롬프트·출력 경로](../../tools/market_collection_achievement_shots_20261116_prompts.json).
- [생성 PNG 원본](../../artifacts/market-collection-achievements-20261116/sources/) · [규격·해시 검사](../../artifacts/market-collection-achievements-20261116/asset-checks.json).
- `tools/package_market_collection_achievement_shots_20261116.py`는 생성 원본을 프로젝트에 보존하고 크기 맞춤·WebP 포장·그림 목록 등록·검수표 제작을 수행한다. 기존 업적샷 104장은 해시를 확인해 보존했다.

## 검증

`node tests/market_collection_achievements_20261116_smoke.cjs` — 수집 대상 70종·업적 9종·종류 중복 제외·획득 실패 제외·약 사용과 매각 후 유지·옛 저장 보충·저장 복원·일회 보상·실제 시장 구입 뒤 업적 대기열·수첩 카드·전용 업적샷 9장과 달성 대화·보상 창·종료 정리·도감·콘솔 오류를 실제 file:// Chromium에서 검사한다. 브라우저는 finally에서 종료한다.

- [수집 규칙 검사](../../artifacts/market-collection-achievements-20261116/rules-check.json)
- [전체 브라우저 검사](../../artifacts/market-collection-achievements-20261116/browser-check.json)
- [수첩 수집 카드](../../artifacts/market-collection-achievements-20261116/achievement-page.png)
- [전설 수집 달성 화면](../../artifacts/market-collection-achievements-20261116/collect_legend_jewels-runtime.png)
- [약재 업적 도감](../../artifacts/market-collection-achievements-20261116/medicine-collection-catalog.png)

최종 확인: 새 수집 규칙·구입 직후 재생·업적샷 9장·수첩 카드·도감 시험을 통과했고 콘솔 오류는 0건이다. `node tests/regional_market_medicine_smoke.cjs`로 기존 70종 시장 재고·구매·회복·저장 복원을 재검사했고, `node tests/trade_achievement_shots_20261110_smoke.cjs`로 기존 교역 업적샷 6종의 달성 연출도 통과했다. 전체 업적 118종의 그림 연결 누락은 0개다.

## 장신구 실물 크기 보정 (2026-11-16)

사용자가 지적한 「항구의 감정가」·「세상의 장신구」와 같은 문제가 있던 「열한 바다의 보석함」·「전설을 꿰는 자」·「작은 보물의 대항해」, 총 5장에 내장 ImageGen 편집을 적용했다. 인물·손·배경·조명·시점은 유지하고 손가락 반지·목걸이·손에 든 펜던트·큰 보석을 실제 착용 크기로 줄였다. 반지는 약 2.2cm 지름, 반지 보석은 6~12mm, 목걸이 폭은 15~18cm, 펜던트는 대체로 2~4cm를 기준으로 사람과 원근에 맞췄다. 비어 난 진열대는 벨벳과 나무결로 이어 그렸다.

- [사용자 첨부와 같은 두 장의 전후 비교](../../artifacts/market-collection-achievements-20261116/scale-fix-20261116/comparison.jpg)
- [수정 전 원본·실제 편집 입력](../../artifacts/market-collection-achievements-20261116/scale-fix-20261116/before/)
- [수정 전 프롬프트·경로](../../artifacts/market-collection-achievements-20261116/scale-fix-20261116/plan-before.json)
- [변경한 5장·나머지 108장 보존 검사](../../artifacts/market-collection-achievements-20261116/scale-fix-20261116/checks.json)

최종 프롬프트 파일의 `original_prompt`·`scale_revision`·`prompt`에 최초 생성과 실제 크기 수정 요청을 함께 보존했다. 게임 그림 키와 규격은 같은 1881×836이며, 수정 전 PNG도 `revisions`에 따로 보존한다.
