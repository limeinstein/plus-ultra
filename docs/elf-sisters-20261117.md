# 엘프 자매 10쌍 · 성인 여성 전사 20명

기존판 10명을 언니, 미형·복식 수정판 10명을 여동생으로 등록했다. 같은 번호끼리 자매이며 얼굴상·무릎상 40장은 모두 서로 다른 전용 파일이다. 이름만 기존 판타지 작품에서 차용했다. 원작 인물의 외모·직위·혈연·서사를 가져온 것이 아니라, 이 게임에서 새롭게 구성한 성인 엘프 자매 설정이다. 프리렌·디드리트·마르실도 원작 복장을 재현하지 않는다. 마르실의 이름은 원작의 하프엘프 인물에서 가져왔다.

## 자매 명단 (언니 / 여동생)

1. 금빛 바람: 갈라드리엘 / 아르웬
2. 은빛 달: 켈레브리안 / 루시엔
3. 숲의 맹세: 이드릴 / 님로델
4. 장미의 검: 아레델 / 핀두일라스
5. 황혼의 불꽃: 알레리아 / 베리사
6. 새벽의 날개: 티란데 / 샨드리스
7. 검은 바람: 실바나스 / 마이에브
8. 햇살의 노래: 탈리스라 / 리아드린
9. 바다의 진주: 디드리트 / 마르실
10. 비취의 불꽃: 프리렌 / 넬라스

## 게임 연결

`js/data/elfsisters.js`를 게임과 도감에서 함께 읽는다. `G.ELF_SISTERS`에 20명 ID를 보관하고, 각 정의에 `sisterId`(상대 ID), `sisterRank`(언니·여동생), `sisterPair`(가족 ID)를 기록한다. 설명에도 상대 이름과 자매 관계를 넣어 모집·인물 카드·도감에서 확인할 수 있다. 자매 동시 영입이나 자동 동행은 강제하지 않는다.

북유럽(스톡홀름·비스뷔·코펜하겐·오슬로·베르겐)의 일반 항해사 후보로 만나 각각 고용한다. 기존 월별 이동·명성·급료·통역·현재 동료 제외 규칙을 따른다. 별도 발견·순환 조건은 추가하지 않았다. 그림상 나이는 언니 32세·여동생 27세로 두었다. 전투·항해 관련 특기와 유럽 언어 3종을 등록했다. 기존 저장에 새 필드는 요구하지 않는다.

그림: `images/portraits/mates/elf-sisters/<영문이름>.webp`(512×512), `<영문이름>_half.webp`(1024×1536). 기존 두 묶음은 `../output/elf-warriors-20261117`, `../output/elf-warriors-20261117-v2`에 보존한다. 재등록 도구: `python tools/package_elf_sisters_20261117.py`. 얼굴 자리: `python tools/portrait_faces.py --prefix portraits/mates/elf-sisters --merge`.

## 이름 출처

- 톨킨의 가운데땅: 『반지의 제왕』·『실마릴리온』·『끝나지 않은 이야기』의 여성 엘프 이름. [엘프 인명 자료](https://valarguild.org/tolkien/encyc/elves.html), [신다린 여성 이름 자료](https://mail.eldamo.org/content/name-indexes/names-s.html).
- 워크래프트: [윈드러너 자매 공식 만화](https://assets.worldofwarcraft.blizzard.com/expansion-8.0/comics/windrunner-6R2rvc3JU9WzSczV/WoW_003_ThreeSisters_enUS.pdf), [등장인물 자료](https://warcraft.wiki.gg/wiki/Major_characters), [탈리스라](https://warcraft.wiki.gg/wiki/Thalyssra), [리아드린](https://warcraft.wiki.gg/wiki/Lady_Liadrin).
- 디드리트: 『로도스도 전기』. [KADOKAWA 작품 안내](https://globalrights.kadokawa.co.jp/featured-collaborations).
- 마르실: 『던전밥』. [공식 사이트](https://delicious-in-dungeon.com/).
- 프리렌: 『장송의 프리렌』. [공식 인물 소개](https://frieren-anime.jp/character/chara_group1/1-1/).

## 검증

`node tests/elf_sisters_20261117_smoke.cjs`: 고유 이름·ID 20명, 상호 자매 관계 10쌍, 실제 모집·영입·현재 동료 제외, 20명 동시 저장 복원, 전용 초상 40장 해독·해상도·얼굴 좌표, 대화·도감 표시와 콘솔 오류를 확인한다. [명부·미리보기·실행 결과](../artifacts/elf-sisters-20261117/).
