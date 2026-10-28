# 아메리카 발견물 70종의 GIF (2026-10-29)

Claude가 `js/data/amer1630.js`에 추가한 자연 15·식물 10·동물 17·유적과 건물 18·대학 10곳에 개별 발견 연출을 연결한다. 각 발견물의 한국어 설명을 바탕으로 내장 ImageGen으로 원화를 만들고 기존 갈래별 제작 도구로 변환했다. 대학은 유적과 같은 4×4 장면 양식을 쓴다.

| 갈래 | 원화 양식 | GIF | 흐름 |
|---|---|---|---|
| 자연 15 | 이어진 가로 파노라마 | 576×256, 약 25장, 9.82초 | 새벽 → 낮의 이동 → 해질녘 → 밤 |
| 식물 10 | 식물과 서식 환경 한 장 | 576×256, 24장, 8.4초 | 밑그림 → 채색 → 살아 있는 풍경 |
| 동물 17 | 2×2, 네 장면 | 576×256, 18장, 7.2초 | 새끼가 빼꼼 → 고개를 기울임 → 다가옴 → 성체와 함께 |
| 유적·건물·대학 28 | 4×4, 열여섯 장면 | 576×256, 16장, 9.82초 | 설계도·모형 → 현장·가까이 보기 → 낮밤·새벽 |

세 가지 게임 자산은 같은 발견물 ID로 연결된다.

- `images/discoveries/ID.gif`: 원본 GIF, 설치형 GIF 팩에서도 사용.
- `images/discovery-ends/ID.jpg`: 같은 마지막 장면, 576×256.
- `images/discovery-sheets/ID.webp`: 한 칸 576×256인 6열 재생 시트. 웹·파일 실행에서는 기존 `G.Reel`이 장면 사이를 겹쳐 재생한다.

GIF 길이는 파일 규격이다. 게임 화면의 재생 시간은 기존 `G.FX.reveal`의 `playMs`·`plantPlayMs`가 정하며, 끝난 뒤 마지막 장면에서 멈춘다. 1630·1650년 개방 시기, 신기루 조건, 단서와 부하 대사에는 기존 발견물 데이터를 그대로 쓴다.

## 다시 만드는 법

원화 경로와 실제 제작 프롬프트는 `docs/art/amer1630-gif-prompts.json`에 있다. 생성 도구의 원본도 보존했다. 빌더는 기존 `nature_gifs`, `plant_gifs`, `animal_gifs`, `ruin_gifs/build_cinematic.py`와 `ruin_gifs/sheets.py`를 재사용한다. 생성 원화의 칸 높이가 조금씩 다른 경우 `tools/amer1630_gifs/layout.py`가 실제 구분선을 따라 4×4 장면을 잘라 이웃 장면이 섞이지 않게 한다.

```powershell
python tools/amer1630_gifs/build.py
python tools/amer1630_gifs/build.py --only yosemite,condor
python -c "import sys;sys.path.insert(0,'tools');import images; found,dups=images.scan();images.write_manifest(found);print(len(found),len(dups))"
python tools/amer1630_gifs/contact_sheet.py
python tests/amer1630_gif_files.py
node tests/amer1630_gifs_smoke.js
```

## 검수

파일 검사는 데이터의 70개 ID, 원화 보존, GIF 크기·장면 수·길이·반복 설정, 마지막 장면과 재생 시트의 일치, manifest 연결을 확인한다. 브라우저 검사는 file://에서 70종의 실제 이미지 해독과 연결, 대표 5종(자연·식물·동물·유적·대학)의 재생·발견 대화·다시 보기·화면 정리, 원본 GIF 팩 경로, 콘솔 오류를 확인하고 브라우저를 닫는다.

검수판과 게임 캡처·실행 결과는 `artifacts/discovery-gif-import-20261029/`에 남긴다.

실행 결과: `amer1630_gif_files.py` 70종 PASS. `amer1630_gifs_smoke.js`는 이미지 연결·해독과 재생 222항목, 5종 실제 발견·다시 보기, GIF 팩 경로를 통과했고 콘솔 오류는 0개였다. 피삭의 지형과 존스 홉킨스·티에라덴트로의 4×4 구성을 원화 단계에서 보정했다. 최종 유적 28종은 실제 구분선에 맞춰 잘라 장면 섞임도 바로잡았다.

## 발견물별 원화

| ID | 발견물 | 갈래 | 원화 |
|---|---|---|---|
| yosemite | 요세미티 계곡 | nature | `tools/nature_gifs/sources/yosemite.png` |
| prismatic | 그랜드 프리즈매틱 온천 | nature | `tools/nature_gifs/sources/prismatic.png` |
| delicatearch | 델리케이트 아치 | nature | `tools/nature_gifs/sources/delicatearch.png` |
| bryce | 브라이스 캐니언 | nature | `tools/nature_gifs/sources/bryce.png` |
| deathvalley | 데스 밸리 | nature | `tools/nature_gifs/sources/deathvalley.png` |
| mammothcave | 매머드 동굴 | nature | `tools/nature_gifs/sources/mammothcave.png` |
| everglades | 에버글레이즈 | nature | `tools/nature_gifs/sources/everglades.png` |
| fundy | 펀디 만의 큰 조수 | nature | `tools/nature_gifs/sources/fundy.png` |
| atacama | 아타카마 사막 | nature | `tools/nature_gifs/sources/atacama.png` |
| titicaca | 티티카카 호 | nature | `tools/nature_gifs/sources/titicaca.png` |
| pantanal | 판타날 | nature | `tools/nature_gifs/sources/pantanal.png` |
| galapagos | 갈라파고스 제도 | nature | `tools/nature_gifs/sources/galapagos.png` |
| peritomoreno | 페리토 모레노 빙하 | nature | `tools/nature_gifs/sources/peritomoreno.png` |
| aconcagua | 아콩카과산 | nature | `tools/nature_gifs/sources/aconcagua.png` |
| lencois | 렌소이스 마라냥세스 | nature | `tools/nature_gifs/sources/lencois.png` |
| cinchona | 키나나무 | plant | `tools/plant_gifs/sources/cinchona.png` |
| sugarmaple | 사탕단풍 | plant | `tools/plant_gifs/sources/sugarmaple.png` |
| cranberry | 크랜베리 | plant | `tools/plant_gifs/sources/cranberry.png` |
| quinoa | 키누아 | plant | `tools/plant_gifs/sources/quinoa.png` |
| yerbamate | 마테나무 | plant | `tools/plant_gifs/sources/yerbamate.png` |
| sunflower | 해바라기 | plant | `tools/plant_gifs/sources/sunflower.png` |
| araucaria | 칠레소나무 (아라우카리아) | plant | `tools/plant_gifs/sources/araucaria.png` |
| ceiba | 세이바 (판야나무) | plant | `tools/plant_gifs/sources/ceiba.png` |
| brazilnut | 브라질너트 | plant | `tools/plant_gifs/sources/brazilnut.png` |
| passionflower | 시계꽃 | plant | `tools/plant_gifs/sources/passionflower.png` |
| condor | 안데스콘도르 | animal | `tools/animal_gifs/sources/condor.png` |
| hummingbird | 벌새 | animal | `tools/animal_gifs/sources/hummingbird.png` |
| anaconda | 아나콘다 | animal | `tools/animal_gifs/sources/anaconda.png` |
| piranha | 피라냐 | animal | `tools/animal_gifs/sources/piranha.png` |
| boto | 아마존강돌고래 | animal | `tools/animal_gifs/sources/boto.png` |
| vicuna | 비쿠냐 | animal | `tools/animal_gifs/sources/vicuna.png` |
| grizzly | 회색곰 | animal | `tools/animal_gifs/sources/grizzly.png` |
| raccoon | 미국너구리 | animal | `tools/animal_gifs/sources/raccoon.png` |
| opossum | 주머니쥐 | animal | `tools/animal_gifs/sources/opossum.png` |
| puma | 퓨마 | animal | `tools/animal_gifs/sources/puma.png` |
| marineiguana | 바다이구아나 | animal | `tools/animal_gifs/sources/marineiguana.png` |
| magellanpenguin | 마젤란펭귄 | animal | `tools/animal_gifs/sources/magellanpenguin.png` |
| muskox | 사향소 | animal | `tools/animal_gifs/sources/muskox.png` |
| bighorn | 큰뿔양 | animal | `tools/animal_gifs/sources/bighorn.png` |
| dartfrog | 독화살개구리 | animal | `tools/animal_gifs/sources/dartfrog.png` |
| electriceel | 전기뱀장어 | animal | `tools/animal_gifs/sources/electriceel.png` |
| seaotter | 해달 | animal | `tools/animal_gifs/sources/seaotter.png` |
| copan | 코판 | ruin | `tools/ruin_gifs/v3/master/copan.png` |
| quirigua | 키리구아 | ruin | `tools/ruin_gifs/v3/master/quirigua.png` |
| joyaceren | 호야 데 세렌 | ruin | `tools/ruin_gifs/v3/master/joyaceren.png` |
| elmirador | 엘 미라도르 | ruin | `tools/ruin_gifs/v3/master/elmirador.png` |
| pisac | 피삭 | ruin | `tools/ruin_gifs/v3/master/pisac-v3.png` |
| ollantaytambo | 올란타이탐보 | ruin | `tools/ruin_gifs/v3/master/ollantaytambo.png` |
| moray | 모라이 | ruin | `tools/ruin_gifs/v3/master/moray.png` |
| choquequirao | 초케키라오 | ruin | `tools/ruin_gifs/v3/master/choquequirao.png` |
| sipan | 시판 왕릉 | ruin | `tools/ruin_gifs/v3/master/sipan.png` |
| tierradentro | 티에라덴트로 무덤 | ruin | `tools/ruin_gifs/v3/master/tierradentro-v2.png` |
| pachacamac | 파차카막 | ruin | `tools/ruin_gifs/v3/master/pachacamac.png` |
| etowah | 에토와 흙언덕 | ruin | `tools/ruin_gifs/v3/master/etowah.png` |
| moundville | 문드빌 | ruin | `tools/ruin_gifs/v3/master/moundville.png` |
| casagrande | 카사 그란데 | ruin | `tools/ruin_gifs/v3/master/casagrande.png` |
| sanfelipe | 산펠리페 데 바라하스 요새 | ruin | `tools/ruin_gifs/v3/master/sanfelipe.png` |
| sanmarcos | 카스티요 데 산마르코스 | ruin | `tools/ruin_gifs/v3/master/sanmarcos.png` |
| potosimint | 포토시 조폐국 | ruin | `tools/ruin_gifs/v3/master/potosimint.png` |
| sfsalvador | 상프란시스쿠 성당 | ruin | `tools/ruin_gifs/v3/master/sfsalvador.png` |
| harvard | 하버드 대학교 | ruin | `tools/ruin_gifs/v3/master/harvard.png` |
| yale | 예일 대학교 | ruin | `tools/ruin_gifs/v3/master/yale.png` |
| princeton | 프린스턴 대학교 | ruin | `tools/ruin_gifs/v3/master/princeton.png` |
| columbia | 컬럼비아 대학교 | ruin | `tools/ruin_gifs/v3/master/columbia.png` |
| upenn | 펜실베이니아 대학교 | ruin | `tools/ruin_gifs/v3/master/upenn.png` |
| brown | 브라운 대학교 | ruin | `tools/ruin_gifs/v3/master/brown.png` |
| dartmouth | 다트머스 대학 | ruin | `tools/ruin_gifs/v3/master/dartmouth.png` |
| cornell | 코넬 대학교 | ruin | `tools/ruin_gifs/v3/master/cornell.png` |
| stanford | 스탠퍼드 대학교 | ruin | `tools/ruin_gifs/v3/master/stanford.png` |
| jhu | 존스 홉킨스 대학교 | ruin | `tools/ruin_gifs/v3/master/jhu-v2.png` |
