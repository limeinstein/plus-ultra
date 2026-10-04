# 보물 회전 원화 프롬프트

## 공통 최종 프롬프트

Codex 내장 이미지 생성 도구에 아래 공통 지시와 보물별 주제를 합쳐 사용했습니다.

> Create one museum-quality photorealistic 4x2 turntable contact sheet of exactly the
> same treasure, showing eight consecutive 45-degree viewpoints for a complete 360-degree
> rotation. View order is left-to-right across the top row, then left-to-right across the
> bottom row: front, front-right, right profile, back-right, back, back-left, left profile,
> front-left. Keep identity, proportions, materials, damage, ornament, camera height, scale,
> and pedestal position rigorously consistent. Place it in a pitch-black luxury museum
> gallery under a narrow warm curator spotlight, with brilliant specular highlights and
> subtle diamond-like spectral caustics. Center one complete object in every equal cell;
> nothing cropped. Seamless dark cell boundaries, no captions, no labels, no letters outside
> historically integral inscriptions, no UI, no watermark. Cinematic product photography,
> physically plausible materials, deep blacks, extremely desirable priceless treasure.

## 보물별 주제

| ID | 원화 주제 |
|---|---|
| `beowulf` | 금·가넷 세공과 멧돼지 장식이 있는 베오울프의 앵글로색슨 투구 |
| `kingjohn` | 보석과 백합 문장이 박힌 존 왕의 왕관 |
| `agamemnon` | 미케네 황금 데스마스크 |
| `tutankh` | 대형 황금 앙크를 중심으로 스카라베와 운석 단검을 묶은 투탕카멘 보물 |
| `rosetta` | 세 문자 비문이 새겨진 검은 로제타석 |
| `sargon` | 아카드 왕 사르곤의 청동 두상 |
| `urcrown` | 금박 잎과 청금석 꽃으로 만든 우르 왕실 머리장식 |
| `goldplate` | 쐐기문자가 새겨진 금·은 한 쌍의 판 |
| `ewer` | 사산 왕조식 금제 주전자 |
| `shiva` | 불꽃 고리 안에서 춤추는 청동 시바 나타라자 |
| `goldelephant` | 보석 안장과 세공 장식의 황금 코끼리 |
| `jadesuit` | 금실로 엮은 한나라 옥의 |
| `bronze` | 중국 고대의 대형 의례용 청동 정 |
| `cloisonne` | 청색 법랑과 금선 세공의 경태람 향로 |
| `seismo` | 여덟 용과 두꺼비가 달린 장형의 지동의 |
| `glassbowl` | 사산 왕조식 컷글라스 보울 |
| `goldseal` | 금으로 만든 왜왕의 인장 |
| `crystalskull` | 내부 균열과 굴절이 선명한 실물 크기 수정 해골 |
| `eldorado` | 엘도라도 전설의 황금 뗏목 군상 |
| `jademask` | 모자이크 옥 조각과 조개 눈의 마야 장례 가면 |
| `grail` | 루비·사파이어·진주가 박힌 전설의 성배 |
| `stcrown` | 보석과 성유물 장식의 성 이슈트반 왕관 |
| `reliquary` | 보석과 금세공으로 만든 중세 성유물함 |
| `ifehead` | 줄무늬 세공과 관 장식의 이페 청동 두상 |

각 생성 결과의 원본은 수정하지 않고 `sources/ID.png`에 보존했으며, 빌더가
게임 비율과 광원·회절 효과를 일괄 적용합니다.

## 2026-10-02에 더한 보물 (원화 아직 없음 — Codex가 만들 차례)

같은 공통 프롬프트로 `sources/ID.png`를 만든 뒤 `python tools/treasure_gifs/build.py --only ID`,
`python tools/ruin_gifs/sheets.py ID`, `python tools/images.py` 순서로 돌린다. 원화가 생기기 전에는 게임이 코드 그림을 쓴다.

| ID | 원화 주제 |
|---|---|
| `sillacrown` | 出자형 나뭇가지·사슴뿔 세움 장식에 비취 곱은옥과 둥근 금 달개 수백 개를 단 신라 금관 (5~6세기, 경주 출토) |
| `cheonmado` | 자작나무 껍질 말다래에 그린 천마도 — 흰 천마가 갈기와 꼬리를 불꽃처럼 날리며 구름 위를 달림, 붉은 테두리 덩굴무늬 (진열대 위 납작한 판, 회전보다는 약간 기울여 도는 전시) |
| `baekjecenser` | 백제 금동대향로 — 용이 받친 연꽃 몸체, 겹겹 산봉우리 뚜껑, 꼭대기에 날개 편 봉황, 다섯 악사 |
| `hanseal` | 전국옥새 — 흰 화씨벽 옥으로 깎은 네모 인장, 서로 얽힌 다섯 용 손잡이, 한 모서리를 금으로 메움, 바닥에 전서 여덟 글자 |
| `guanyublade` | 관우의 청룡언월도 — 긴 자루 끝 반달 모양 넓은 칼날, 날 밑에 푸른 용이 입을 벌린 장식, 붉은 술 (진열대에 세운 모습) |
| `libai` | 이백의 시집 — 펼친 당나라 두루마리·제본 시고, 힘찬 초서 먹글씨, 옆에 작은 술잔과 달 무늬 연적 |
| `kohinoor` | 코이누르 — 달걀만 한 무굴식 컷 다이아몬드, 금·에나멜 팔찌형 받침 |
| `genghis` | 칭기즈 칸의 보물 — 사슴 돋을새김 황금 안장과 금 허리띠 장식, 몽골 활과 칼 |
| `holylance` | 성창 — 철 창날 가운데 못을 금실로 감고 금 덮개를 씌운 신성 로마 제국 보물 |
| `tutankh` (유물) | 투탕카멘 황금 가면 — 지금 원화는 앙크 중심. 가면은 유물 「소년왕의 황금 가면」으로 넣었다 |

## 2026-10-02 두 번째로 더한 보물 53종 (원화 아직 없음)

이름·설명은 `js/data/discoveries.js`(「도자기·보석·세계 국보·르네상스와 대항해시대 예술품」 묶음)에 있다.
물건(도자기·보석·조각)은 위 공통 프롬프트 그대로 회전 전시, **그림·벽화·책·병풍**은 회전 대신 어두운 전시실 벽에
걸린 작품을 스포트라이트가 천천히 훑는 4×2 시점(정면·좌우 비스듬히·가까이)으로 만들면 된다 — 옛 명화는 퍼블릭 도메인이라 실제 작품을 보여 줘도 되지만
게임 화풍에 맞게 다시 그린 것이 어울린다.

- 도자기: goryeoceladon, tangsancai, qinghua, ruware, moonjar, iznikware, lustreware, aritaware, rakubowl, tsukumonasu
- 보석·왕관: blackprince, ironcrown, wenceslas, paladoro, timurruby, peacockthrone, mogokruby, lankasapphire, muzoemerald, peregrina
- 세계 국보: nefertiti, hammurabi, venusmilo, nike, laocoon, ajanta(벽화), qingming(두루마리), lanting(글씨), tripitaka(경판), hunmin(책), benin, moctezuma, sunstone, incadisc, mayacodex(책)
- 르네상스·대항해시대(그림): monalisa, creation, lastsupper, birthvenus, ghentaltar, durer, earthlydelights, urbinovenus, babeltower, orgaz, ambassadors, nanbanscreen, baburnama, shahnameh, pirireis / (조각·공예) david, saliera, belemmonstrance

## 2026-10-04 — 그림이 없던 62종을 절차적 3D로 채움

이미지 생성 도구 없이 `tools/procedural_art`(three.js)로 모형을 빚어 같은 4×2 회전 원화(`sources/ID.png`)를 만들었다.
위 표의 9종 + 53종 + `flordelamar`(바다의 꽃 호 난파선). 그림·책·병풍처럼 납작한 것은 360° 대신 ±30° 흔들어 찍었다.
명화와 사람 조각은 단순화한 재현이므로, Codex 원화가 생기면 같은 파일 이름으로 덮어쓰고 `build.py --only ID` → `ruin_gifs/sheets.py ID` → `images.py`.
