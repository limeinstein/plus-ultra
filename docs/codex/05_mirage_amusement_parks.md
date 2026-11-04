# 05 신기루 발견물 7곳 → 느낌이 비슷한 가상의 놀이공원 (2026-11-04 사용자 요청 · 저작권 QA 4·5번)

## 왜
19~20세기 신기루 발견물(`js/data/miragedisc.js`, `G.MIRAGE50`) 가운데 아래 7곳은 회사의 상표·디자인 권리가 걸려 있다.
특히 디즈니 월드 그림에는 신데렐라 성·스페이스십 어스가 그대로 나오고(디즈니는 성 모양을 상표로 관리), 아토미움은 관리 단체가 그림 사용료를 받아 왔다.
사용자 결정: **각 곳을 「느낌이 비슷한 놀이공원」으로 바꾼다.** 실제 회사·건물을 가리키지 않는, 이 게임만의 가상 놀이공원이다.

| id (그대로 둔다) | 지금 | 바꿀 느낌 (예시 — 이름·모습은 자유롭게, 실제 것을 닮지 않게) |
|---|---|---|
| `disneyworld` | 월트 디즈니 월드 (플로리다) | 늪지 호숫가의 **동화 나라 놀이공원** — 성 모양 놀이 궁전·증기선·불꽃. 신데렐라 성·잠자는 숲속의 성의 실루엣, 쥐 귀, 디즈니 캐릭터·글자·로고는 쓰지 않는다 |
| `atomium` | 아토미움 (브뤼셀) | 들판의 **은빛 쇠공 놀이공원** — 공 모양 객차가 도는 관람차·회전 기구. 공 아홉 개가 관으로 이어진 아토미움 배치는 따라 하지 않는다 |
| `empirestate` | 엠파이어 스테이트 빌딩 (맨해튼) | 섬 한가운데 **하늘 전망탑 놀이공원** — 꼭대기까지 오르는 승강 놀이기구·전망대. 엠파이어 스테이트의 계단형 첨탑 실루엣은 쓰지 않는다 |
| `namsantower` | N서울타워 (남산) | 산꼭대기 **케이블카 유원지** — 케이블카·전망 놀이기구·자물쇠 난간 같은 산마루 놀이터. 「N서울타워」 이름·모양은 쓰지 않는다 |
| `tokyotower` | 도쿄 타워 (시바) | 붉고 흰 쇠 기둥의 **쇠탑 유원지** — 쇠 골조 회전그네·전망 기구. 도쿄 타워(에펠탑형) 실루엣은 쓰지 않는다 |
| `bernabeu` | 산티아고 베르나베우 경기장 (마드리드) | 큰길가 **공놀이 축제 놀이공원** — 둥근 놀이 마당·회전목마·함성. 레알 마드리드 이름·흰 옷 선수·문장은 쓰지 않는다 |
| `nasajsc` | 나사 존슨 우주 센터 (휴스턴) | 바닷가 늪지 곁 **별나라 여행 놀이공원** — 로켓 모양 놀이기구·별 지도 천장. NASA 이름·로고(미트볼·웜)·실제 로켓 표식은 쓰지 않는다 |

자리(위도·경도)·세운 해(built)·가치·지역·언어·`mirageFrom` 1610은 그대로 둔다(놀이공원이 생기는 해로 본다).

## 고칠 곳
1. **글** `js/data/miragedisc.js`의 `r(...)` 7줄: 이름·설명(desc)·단서(hint). 그 시대 사람이 보는 말투로, 쉬운 우리말로 새로 쓴다(다른 줄과 같은 길이).
   - 같은 파일 아래쪽의 단서 이름(G.DISC_NAMES)·특기별 관찰(G.DISC_FACTS)에 이 id가 있으면 함께 고친다.
   - `js/data/discfam_8.js`의 `F.bernabeu · F.atomium · F.namsantower · F.tokyotower · F.disneyworld · F.empirestate · F.nasajsc` (가족 대사)도 새 놀이공원에 맞게.
   - `grep -rn "디즈니\|아토미움\|엠파이어\|N서울타워\|도쿄 타워\|베르나베우\|나사 \|NASA" js` 로 남은 곳이 없는지 본다 (`junglebook.js`·`beautybeast.js`의 「디즈니 영화에만 나오는…」 주석은 그대로 둔다).
2. **그림** (기존 신기루 그림과 같은 크기·형식·화풍, 실제 건물·로고·캐릭터를 닮지 않게)
   - `images/discoveries/<id>.gif` · `images/discovery-ends/<id>.jpg` · `images/discovery-sheets/<id>.webp` — 만드는 법 `tools/mirage_gifs/README.md` (원화 `tools/mirage_gifs/masters/`, 프롬프트 `tools/mirage_gifs/prompts.json`·`items.json`·`layouts.json`).
   - 지도 위 외관 `images/map-discoveries/mirage/<id>.webp` 와 지도 시트(`js/art/discovery_icon.js`의 `map-discoveries/mirage-…` 목록) — 만드는 법 `tools/mirage_exteriors/` (`prompts.json`, `map-sheets.json`).
   - 프롬프트 JSON의 이 7곳 항목도 새 내용으로 고치고(지난 것은 `previous_versions`에), 실제 회사·건물 이름을 프롬프트에 쓰지 않는다.
3. **랜드마크 바닥 보정** `js/data/landmarkbase.js`의 `atomium`·`empirestate`·`namsantower`·`tokyotower` 줄은 새 외관 그림에 맞게 다시 만든다(만드는 도구: `tools/landmark_base.py`).
4. 문서: `README.md`에 한 단락, 그림 기록은 `docs/art/`에 미리보기·생성 지시문·검증과 함께.

## 지킬 것
- id는 바꾸지 않는다(옛 저장의 발견 기록이 id로 남는다). `AGENTS.md` 규칙(빌드 없음·file:// · 콘솔 오류 0 · 시험 뒤 브라우저 끄기)을 따른다.
- 실제 놀이공원(디즈니·유니버설·식스 플래그스·에버랜드 등)·실제 탑·회사의 이름·로고·캐릭터·대표 실루엣을 쓰지 않는다. 「느낌」만 비슷하게.

## 시험
- `node tests/mirage50_smoke.js` · `node tests/mirage50_assets_runtime.js` · `node tests/mirage50_exteriors_runtime.js` · `node tests/region_label_smoke.js` 통과(시험 안의 이름 기대값이 있으면 새 이름으로).
- 7곳 각각 발견 장면(GIF→마지막 그림)·발견 시트·지도 외관을 한 장에 모은 접촉 시트를 `docs/art/`에 남긴다.
