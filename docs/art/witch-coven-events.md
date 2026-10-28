# 마녀 모임 이벤트 샷

기존 저주(`curse.webp`)·신상 파티(`new_fashion_party.webp`) 원화를 유지하고, 내장 ImageGen으로 아래 네 장을 새로 만들었다. 참조는 `docs/art/witches-preview.jpg`의 마녀 의상·얼굴·화풍이다. 생성 원본을 편집 없이 `images/events/witches/`에 복사했다.

공통 지시: 성인 마녀, 검은 레이스·벨벳·새틴 드레스, 섬세한 반실사 판타지 회화, 대항해 시대 목선, 가로 9:4의 한 장면. 글자·테두리·워터마크 없음.

- `potion.png`: 배의 조리실에서 다섯 마녀가 초록빛 회복 포션을 만들고 지친 선원에게 나누어 준다.
- `charm.png`: 황혼의 갑판에서 마녀들의 금빛·보랏빛 주문에 홀린 남성 동료들이 제독에게 충성을 맹세한다.
- `coven_oath.png`: 달빛 아래 갑판에서 열세 마녀가 은빛 마법으로 손을 잇고 변치 않는 충성을 맹세한다.
- `wage_waiver.png`: 선장실에서 마녀들이 금화와 돈주머니를 제독에게 되밀며 급료를 거절한다.

전체 생성 지시문은 `witch-coven-prompts.json`에 보존한다. 게임은 `js/data/coven.js`의 여섯 사건과 `js/systems/coven.js`를 통해 이 그림들을 표시한다.
