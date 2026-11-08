# Loop of Good Hope — 출처와 라이선스

게임 안에서는 타이틀 화면 아래 「만든 사람들 · 출처」, 또는 설정 창의 같은 단추로 볼 수 있습니다 (`js/ui/credits.js`).
새 외부 자료를 들이면 이 문서와 `js/ui/credits.js`에 함께 적습니다.

## 게임
- **Loop of Good Hope** © limeinstein. 코드·글은 제작자가 보조 도구와 함께 개발·작성했습니다.
- **그림**: 이미지 생성 도구(OpenAI ImageGen)와 three.js 절차적 3D(`tools/procedural_art`)로 제작한 원화 및 아래에 출처를 표시한 고전 작품 사진을 사용합니다. 생성 지시문은 `docs/art/`, `tools/*prompts*.json`.
- **배경 음악**: 제작자가 Suno(https://suno.com)로 만든 기악곡 44곡. 곡마다 Suno 주소·만든 날은 `music/CREDITS.md`.

## 효과음
| 자료 | 쓴 곳 | 조건 |
|---|---|---|
| Kenney 「RPG Audio」 (https://kenney.nl) | `sounds/rpg/` 발걸음·동전·칼·책·문·천 | CC0 1.0 — `sounds/rpg/License.txt` |
| Mixkit (https://mixkit.co) | 파도·항구·비·폭풍·새·짐승·북·폭발 | Mixkit Sound Effects Free License — `sounds/nature/License.txt` |
| Pixabay — universfield 「spinning coin on table」, freesound_community 「coin sound」 | 동전 | Pixabay Content License |

Mixkit·Pixabay 라이선스는 소리 파일을 따로 떼어 배포·판매하는 것을 허락하지 않으므로, 저장소·웹판·설치판에는 낱개 파일이 아니라 게임 전용 묶음 `sounds/nature.pack.js`(`tools/sfx_pack.py`)로만 싣습니다. 묶음에서 소리를 꺼내 따로 쓰거나 배포할 수 없습니다.

## 글꼴 (SIL Open Font License 1.1)
| 글꼴 | 저작권 | 라이선스 원문 |
|---|---|---|
| Cinzel | Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel) | `licenses/OFL-Cinzel.txt` |
| Cinzel Decorative | Copyright (c) 2012 Natanael Gama, with Reserved Font Name 'Cinzel' | `licenses/OFL-CinzelDecorative.txt` |
| 나눔명조 Nanum Myeongjo | Copyright (c) 2010, NHN Corporation, with Reserved Font Name Nanum, NanumMyeongjo 등 | `licenses/OFL-NanumMyeongjo.txt` |
| 송명 Song Myung | Copyright 2018 The SongMyung Project Authors | `licenses/OFL-SongMyung.txt` |

웹판은 Google Fonts에서 읽고, 설치판은 글꼴 파일을 함께 넣습니다(이 문서와 `licenses/`를 함께 싣습니다).

## 프로그램
- **three.js r147** — MIT License, Copyright © 2010-2022 three.js authors — `licenses/MIT-three.js.txt`
- **Electron**(설치판) — MIT License. Chromium 등 구성 요소의 라이선스는 설치 폴더의 `LICENSE.electron.txt` · `LICENSES.chromium.html`.

## 지도·자료
- **Natural Earth** 50m — 공개 저작물 (https://www.naturalearthdata.com)
- **UNESCO 세계유산센터** — CC BY-SA 3.0 IGO. **위키백과** — CC BY-SA 4.0. 이 자료를 바탕으로 한국어로 새로 쓴 글(`js/data/heritage.js`)도 같은 조건(CC BY-SA)으로 공개합니다.
- **위키미디어 공용 사진** — 발견 그림이 참고한 원본 사진입니다(게임 그림은 사진을 참고해 새로 그린 것). 사진마다 작가·라이선스·원본 주소를 발견 카드와 도감의 「실제 자료」에 적었고, CC BY-SA 사진을 참고한 그림은 같은 조건으로 공개합니다.
- **The Met · Smithsonian Open Access** — CC0. **GBIF.org · OBIS** — CC BY 4.0.

## 명화 (`images/CLASSICAL-CREDITS.md`)
- 미켈란젤로 「아담의 창조」(Web Gallery of Art), 보티첼리 「비너스의 탄생」(Google Art Project) — 공개 저작물.
- 미켈란젤로 「다비드」 사진: **Σπάρτακος**, 2018, CC BY-SA 4.0 (https://commons.wikimedia.org/wiki/File:David_-_(Michelangelo).jpg) — 이 사진으로 만든 `discoveries/david.gif`, `discovery-ends/david.jpg`, `discovery-sheets/david.webp`도 CC BY-SA 4.0.

## 보물 전시 사진 출처 (`images/TREASURE-CREDITS.md`)

배경 제거·축소·전시 조명·완만한 확대·색상 양자화·GIF와 WebP 재생 시트 변환을 적용했습니다. 아래 출처와 이용 조건은 해당 사진 및 이를 사용한 원화·GIF·종료 JPG·WebP 시트에 적용됩니다.

- **밀로의 아프로디테 (venusmilo)** — Mattgirling. [원본 자료](https://commons.wikimedia.org/wiki/File:MG-Paris-Aphrodite_of_Milos_edited.jpg), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0).
- **첼리니의 소금 그릇 (saliera)** — Guerinf. [원본 자료](https://commons.wikimedia.org/wiki/File:Sali%C3%A8re_de_Cellini_(8).jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0).
- **어린 양에 대한 경배 (ghentaltar)** — Jan van Eyck / Presumably Hubert van Eyck. [원본 자료](https://commons.wikimedia.org/wiki/File:Ghent_Altarpiece_Google_Art_Project.jpg), Public domain.
- **쾌락의 정원 (earthlydelights)** — Hieronymus Bosch. [원본 자료](https://commons.wikimedia.org/wiki/File:The_Garden_of_Earthly_Delights_by_Bosch_High_Resolution.jpg), Public domain.
- **우르비노의 비너스 (urbinovenus)** — Titian. [원본 자료](https://commons.wikimedia.org/wiki/File:Tiziano_-_Venere_di_Urbino_-_Google_Art_Project.jpg), Public domain.
- **다비드상 (david)** — Σπάρτακος. [원본 자료](https://commons.wikimedia.org/wiki/File:David_-_(Michelangelo).jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0).

CC BY-SA 4.0 사진의 위 변환 결과도 같은 CC BY-SA 4.0으로 제공합니다. 밀로의 아프로디테 사진 변환 결과는 CC BY 3.0으로 제공합니다.


## 이야기
역사 속 인물·사건과 옛이야기(피노키오·피터 팬·안데르센 동화·돈키호테·로미오와 줄리엣·정글북·천일야화 등)는 공개 저작물인 원작을 바탕으로 이 게임에 맞게 새로 썼습니다. 실제 회사·건물 이름은 그 장소를 가리키는 데만 씁니다.
