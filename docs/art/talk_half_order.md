# 항해사·후원자 무릎상 주문서 (Codex용)

2026-10-04. 대화창이 **여급과 이야기할 때처럼 두 사람이 마주 서는 구도**로 바뀌었다(왼쪽 제독 · 오른쪽 상대). 두 사람 다 **무릎상**(머리부터 무릎까지 서 있는 그림)이 있으면 서 있는 모습으로 크게 나오고, 한쪽이라도 없으면 지금처럼 흉상으로 마주 본다.

- 제독(생김새 14가지 `images/characters/player_half_<생김새>`, 40세부터 `_old`)과 여급 75명(`portraits/maids/<id>_half`, 지역 묶음 `maid-styles/<묶음>/<번호>_half`)은 **이미 무릎상이 있어** 바로 크게 나온다.
- 항해사·후원자는 무릎상이 없다 → 아래 **187장**(항해사 57 · 후원자 130)을 만들어 넣으면 코드 수정 없이 자동으로 바뀐다.

## 파일과 규격

| 용도 | 경로 | 크기 |
|---|---|---|
| 항해사 무릎상 | `images/portraits/mates/<id>_half.webp` | 1024×1536, 투명 배경 |
| 후원자 무릎상 | `images/portraits/sponsors/<그림 이름>_half.webp` | 1024×1536, 투명 배경 |

- **이미 있는 흉상(`<id>.webp`)과 같은 사람**이어야 한다 — 얼굴·머리·수염·옷·장신구를 그대로 이어서 무릎까지 그린다. 흉상을 Image 1(얼굴·옷 기준)로 넣는다.
- 구도: 한 사람이 머리부터 무릎까지 서 있다. 머리 위로 여백 4~6%, 무릎(또는 무릎 바로 아래)에서 끊는다. 몸은 살짝 **보는 사람의 왼쪽(대화 상대인 제독 쪽)**으로 돌린 3/4 자세. 손은 자연스럽게(지팡이·해도·홀·책 같은 그 사람다운 소품 하나는 괜찮음).
- 화풍·크기 기준: `images/portraits/maids/m_lis_half.webp`(1024×1536), 제독 `images/characters/player_half_casanova.png`. 인물 키가 그림 높이의 90% 안팎이 되게.
- 리그(숨쉬기·고개 끄덕임)가 그림을 머리·몸통·하체로 잘라 움직이므로, 머리와 어깨가 다른 것에 가리지 않게 한다.

## 넣은 뒤 할 일 (WebGame 폴더에서)

```
python tools/images.py                 # images/manifest.js 다시 만들기
python tools/portrait_faces.py         # 눈·입 자리 — 리그의 깜박임·입 모양
node tests/talk_half_smoke.js          # 무릎상 연결·대화창 구도 (콘솔 오류 0)
```

## 공통 프롬프트

```text
Use case: stylized-concept
Asset type: standing knee-length character portrait, 1024x1536, transparent background
Input images: Image 1 is the existing bust portrait of THIS SAME PERSON (identity, face, hair, beard, clothing and jewelry reference — keep them). Image 2 is a framing/rendering reference (images/portraits/maids/m_lis_half.webp). Do not copy Image 2's identity.
Primary request: extend Image 1 into a single standing figure from the top of the head down to the knees: <NAME>, <ROLE>, <PLACE/ERA>, for a maritime exploration game set around 1480-1600.
Clothing: continue exactly the clothing visible in Image 1 down to the knees in a historically plausible way for <ROLE> of <PLACE/ERA> (belt, doublet/robe skirt, hose or trousers, sword or chain of office where it fits).
Style/medium: highly polished semi-realistic digital character painting matching the references, realistic anatomy and proportions, detailed fabric texture, premium game portrait rendering.
Composition/framing: one person standing, whole head visible with margin above, cut at the knees; body turned three-quarters toward the viewer's left, face toward the viewer; relaxed natural hands; figure fills about 90% of the image height.
Lighting/mood: warm interior key light with soft golden rim light; expression matching the bust portrait.
Background: genuinely transparent background with clean hair and clothing edges.
Constraints: one person only; no text; no border; no frame; no watermark; no modern items; no cropped head; no ethnic caricature.
```

## 항해사 57명

| 파일 | 이름 | 한 줄 |
|---|---|---|
| `portraits/mates/rocco_half` | 로코 알베르티 | 제노바 출신의 거친 뱃사람. 의리는 누구보다 두텁다. |
| `portraits/mates/duarte_half` | 두아르테 파셰쿠 페레이라 | 포르투갈의 뛰어난 항해가이자 지리학자. |
| `portraits/mates/lacosa_half` | 후안 데 라 코사 | 바스크 출신의 지도 제작자. 누구보다 정확한 해도를 그린다. |
| `portraits/mates/pinzon_m_half` | 마르틴 알론소 핀손 | 팔로스의 노련한 선장. 선원들의 신망이 두텁다. |
| `portraits/mates/pinzon_v_half` | 비센테 야녜스 핀손 | 핀손 형제의 막내. 대담하고 끈기가 있다. |
| `portraits/mates/triana_half` | 로드리고 데 트리아나 | 핀타호의 망꾼. 1492년 10월 12일 새벽, 가장 먼저 육지를 외친 사내. |
| `portraits/mates/torres_half` | 루이스 데 토레스 | 히브리어와 아랍어를 아는 통역. 대칸에게 보낼 말을 준비해 두었다. |
| `portraits/mates/arana_half` | 디에고 데 아라나 | 선단의 치안을 맡은 집행관. 라 나비다드 요새에 남았다. |
| `portraits/mates/vespucci_half` | 아메리고 베스푸치 | 피렌체의 상인이자 항해가. 신대륙이 새로운 대륙임을 간파했다. |
| `portraits/mates/dias_half` | 바르톨로메우 디아스 | 아프리카 남단을 처음 돌아 나온 포르투갈의 항해가. |
| `portraits/mates/zacuto_half` | 라비 아브라함 자쿠토 | 천문표를 만든 유대인 천문학자. 별로 바다 위의 위치를 잰다. |
| `portraits/mates/ibnmajid_half` | 이븐 마지드 | 인도양 바닷길을 손바닥처럼 아는 아랍의 항해 명인. |
| `portraits/mates/hasan_half` | 하산 분 무함마드 | 여러 나라를 떠돈 무어인 학자. 아랍어와 페르시아어에 능하다. |
| `portraits/mates/pigafetta_half` | 안토니오 피가페타 | 베네치아 출신의 기록가. 보고 들은 모든 것을 적는다. |
| `portraits/mates/elcano_half` | 후안 세바스티안 엘카노 | 바스크의 선장. 어떤 폭풍 속에서도 배를 지켜 낸다. |
| `portraits/mates/serrao_half` | 프란시스코 세랑 | 향료제도에 처음 닿은 포르투갈인. 동방의 섬 말을 한다. |
| `portraits/mates/correia_half` | 가스파르 코헤아 | 인도의 역사를 기록한 포르투갈 서기관. |
| `portraits/mates/aguilar_half` | 헤로니모 데 아길라르 | 유카탄에서 조난당해 마야어를 익힌 수도사. |
| `portraits/mates/xavier_half` | 프란시스코 사비에르 | 동방에 복음을 전하러 온 예수회 신부. 동아시아의 말을 익혔다. |
| `portraits/mates/nakoda_half` | 나코다 이스마일 | 말라카의 선주. 동남아 바다의 뱃길에 밝다. |
| `portraits/mates/leonardo_half` | 레오나르도 다 빈치 | 만능의 천재. 물과 바람과 사람의 몸까지, 보이는 모든 것을 그려 두었다. |
| `portraits/mates/michelangelo_half` | 미켈란젤로 부오나로티 | 돌에서 사람을 꺼내는 조각가. 피렌체의 성벽을 쌓아 올린 축성 감독이기도 하다. |
| `portraits/mates/raffaello_half` | 라파엘로 산치오 | 로마의 옛 유적을 관리한 화가. 부서진 돌만 보고도 그 시절을 그려 낸다. |
| `portraits/mates/donatello_half` | 도나텔로 | 청동을 다루는 노대가. 고대의 솜씨를 되살렸다는 말을 듣는다. 나이를 가늠할 수 없이 정정하다. |
| `portraits/mates/botticelli_half` | 산드로 보티첼리 | 봄과 바다의 여신을 그린 피렌체의 화가. 아름다운 것을 알아보는 눈이 있다. |
| `portraits/mates/gutenberg_half` | 요하네스 구텐베르크 | 납활자로 글을 찍어 내는 장인. 손재주 하나로 세상을 바꾸었다. 백발이 성성한데도 손끝이 흔들리지 않는다. |
| `portraits/mates/verrocchio_half` | 안드레아 델 베로키오 | 금세공에서 시작해 청동상까지 다루는 피렌체의 공방장. 레오나르도를 가르친 스승이다. |
| `portraits/mates/manutius_half` | 알두스 마누티우스 | 베네치아의 인쇄업자. 그리스 고전을 손바닥만 한 책으로 찍어 내 세상에 퍼뜨렸다. |
| `portraits/mates/regiomontanus_half` | 레기오몬타누스 | 천문표를 다시 쓴 독일의 수학자. 별의 자리를 미리 적어 두면 바다에서 길을 잃지 않는다고 말한다. |
| `portraits/mates/tycho_half` | 튀코 브라헤 | 섬 하나를 통째로 천문대로 만든 덴마크 귀족. 코가 금속이라는 소문이 따라다닌다. |
| `portraits/mates/kepler_half` | 요하네스 케플러 | 행성이 그리는 길이 원이 아니라고 말하는 수학자. 계산으로 하늘을 따라잡는다. |
| `portraits/mates/galileo_half` | 갈릴레오 갈릴레이 | 통을 이어 붙여 먼 곳을 끌어당기는 기구를 만든 파도바의 학자. 목성에도 달이 있다고 한다. |
| `portraits/mates/ariosto_half` | 루도비코 아리오스토 | 기사와 마법의 서사시를 쓴 페라라의 시인. 뱃사람의 무용담을 노래로 만들어 준다. |
| `portraits/mates/camoes_half` | 루이스 드 카몽이스 | 한쪽 눈을 잃고도 인도까지 다녀온 시인. 포르투갈의 항해를 서사시로 남겼다. |
| `portraits/mates/cervantes_half` | 미겔 데 세르반테스 | 레판토에서 왼손을 잃고 알제에서 다섯 해를 갇혔던 사내. 그 이야기를 글로 되갚는다. |
| `portraits/mates/shakespeare_half` | 윌리엄 셰익스피어 | 런던 강변 극장의 극작가. 사람의 속을 꿰뚫어 보고 말로 흔든다. |
| `portraits/mates/drake_half` | 프랜시스 드레이크 | 지구를 한 바퀴 돌고 온 잉글랜드의 사략선장. 에스파냐에서는 용이라 부른다. |
| `portraits/mates/shylock_half` | 샤일록 | 베네치아의 금융업자. 돈 계산만큼은 누구에게도 지지 않는다. |
| `portraits/mates/piri_half` | 피리 레이스 | 오스만의 제독이자 지도 제작자. 수많은 옛 지도를 모았다. |
| `portraits/mates/barbarossa_half` | 하이레딘 바르바로사 | 지중해를 떨게 한 붉은 수염의 해적 제독. |
| `portraits/mates/cabot_half` | 세바스티안 캐벗 | 베네치아 태생의 잉글랜드 항해가. 북쪽 항로를 꿈꾼다. |
| `portraits/mates/verrazzano_half` | 조반니 다 베라차노 | 프랑스 왕을 위해 신대륙 북쪽 해안을 탐사한 피렌체인. |
| `portraits/mates/urdaneta_half` | 안드레스 데 우르다네타 | 태평양을 되돌아오는 바닷길을 찾아낸 수도사 항해가. |
| `portraits/mates/orellana_half` | 프란시스코 데 오레야나 | 아마존 강을 처음 내려간 탐험가. |
| `portraits/mates/coronado_half` | 프란시스코 바스케스 데 코로나도 | 황금 도시를 찾아 북쪽 황야를 누빈 정복자. |
| `portraits/mates/cadamosto_half` | 알비세 카다모스토 | 아프리카 서해안을 누빈 베네치아 상인 항해가. |
| `portraits/mates/covilha_half` | 페루 드 코빌랴 | 아랍 상인으로 변장해 인도와 에티오피아까지 다녀온 밀사. |
| `portraits/mates/leoafricanus_half` | 레오 아프리카누스 | 아프리카 곳곳을 여행한 그라나다 출신의 학자. |
| `portraits/mates/garcia_half` | 가르시아 드 오르타 | 인도의 약초를 연구하는 포르투갈의 의사. |
| `portraits/mates/paracelsus_half` | 파라켈수스 | 괴팍하지만 천재적인 스위스의 의사이자 연금술사. |
| `portraits/mates/mercator_half` | 헤라르뒤스 메르카토르 | 둥근 지구를 평면에 옮기는 새로운 도법을 고안한 지리학자. |
| `portraits/mates/amina_half` | 아미나 (여) | 그라나다에서 온 총명한 여인. 여러 나라 말에 능하다. |
| `portraits/mates/isaac_half` | 이사크 아브라바넬 | 박식한 유대인 학자이자 재정가. |
| `portraits/mates/manuel_half` | 마누엘 코스타 | 포르투갈 해군 출신의 포수. 포연 속에서도 침착하다. |
| `portraits/mates/zara_half` | 자라 (여) | 지도를 그리는 솜씨가 뛰어난 모로코 출신의 여인. |
| `portraits/mates/giorgio_half` | 조르조 칸티노 | 포르투갈의 비밀 해도를 빼돌렸다는 이탈리아 첩자. |
| `portraits/mates/ahmad_half` | 아흐마드 이븐 샤밥 | 호르무즈의 선장. 페르시아만 바닷길을 꿰뚫고 있다. |

## 후원자 130장

그림 하나를 여러 대(代)가 같이 쓰는 경우가 있다(이름 칸에 모두 적음). 이름이 없는 줄은 그 자리의 공통 그림(그 대의 전용 그림이 없을 때 쓰임) — 흉상 그대로 이어 그리면 된다.

| 파일 | 자리 (도시 · 종류) | 이 그림을 쓰는 사람 |
|---|---|---|
| `portraits/sponsors/ch_zwingli_half` | 개혁파 설교자 (베른 · 성직자) | — (자리 공통 그림) |
| `portraits/sponsors/ch_zwingli_1_half` | 개혁파 설교자 (베른 · 성직자) | 울리히 츠빙글리 1519~1531 |
| `portraits/sponsors/de_emperor_half` | 신성로마제국 황제 (비엔나 · 군주) | 공위 1657~1658, 공위 1740~1742, 신성로마제국 황제 1916~ |
| `portraits/sponsors/de_emperor_1_half` | 신성로마제국 황제 (비엔나 · 군주) | 프리드리히 3세 1480~1493 |
| `portraits/sponsors/de_emperor_2_half` | 신성로마제국 황제 (비엔나 · 군주) | 막시밀리안 1세 1493~1519 |
| `portraits/sponsors/de_emperor_3_half` | 신성로마제국 황제 (비엔나 · 군주) | 카를 5세 1519~1556 |
| `portraits/sponsors/de_emperor_4_half` | 신성로마제국 황제 (비엔나 · 군주) | 페르디난트 1세 (제국의회 승인 1558) 1556~1564 |
| `portraits/sponsors/de_luther_half` | 종교 개혁가 (마그데부르크 · 성직자) | — (자리 공통 그림) |
| `portraits/sponsors/de_luther_1_half` | 종교 개혁가 (마그데부르크 · 성직자) | 마르틴 루터 1517~1546 |
| `portraits/sponsors/de_melanchthon_half` | 인문주의 교육자 (뉘른베르크 · 학자) | — (자리 공통 그림) |
| `portraits/sponsors/de_melanchthon_1_half` | 인문주의 교육자 (뉘른베르크 · 학자) | 필리프 멜란히톤 1526~1560 |
| `portraits/sponsors/dk_king_half` | 덴마크 국왕 (코펜하겐 · 군주) | 공위 (백작 전쟁) 1533~1534, 덴마크 국왕 1906~ |
| `portraits/sponsors/dk_king_1_half` | 덴마크 국왕 (코펜하겐 · 군주) | 한스 왕 1481~1513 |
| `portraits/sponsors/dk_king_2_half` | 덴마크 국왕 (코펜하겐 · 군주) | 크리스티안 2세 1513~1523 |
| `portraits/sponsors/dk_king_3_half` | 덴마크 국왕 (코펜하겐 · 군주) | 프레데리크 1세 1523~1533 |
| `portraits/sponsors/dk_king_4_half` | 덴마크 국왕 (코펜하겐 · 군주) | 크리스티안 3세 1534~1559 |
| `portraits/sponsors/en_king_half` | 잉글랜드 국왕 (런던 · 군주) | 공화국 국무회의 1649~1653, 공화국 국무회의 1659~1660, 공위 (명예혁명) 1688~1689, 잉글랜드 국왕 1901~ |
| `portraits/sponsors/en_king_3_half` | 잉글랜드 국왕 (런던 · 군주) | 헨리 7세 1485~1509 |
| `portraits/sponsors/en_king_4_half` | 잉글랜드 국왕 (런던 · 군주) | 헨리 8세 1509~1547 |
| `portraits/sponsors/en_king_5_half` | 잉글랜드 국왕 (런던 · 군주) | 에드워드 6세 1547~1553 |
| `portraits/sponsors/en_king_6_half` | 잉글랜드 국왕 (런던 · 군주) | 엘리자베스 1세 1558~1603 |
| `portraits/sponsors/es_aragon_half` | 아라곤 국왕 (사라고사 · 군주) | — (자리 공통 그림) |
| `portraits/sponsors/es_aragon_1_half` | 아라곤 국왕 (사라고사 · 군주) | 페르난도 2세 1480~1516 |
| `portraits/sponsors/es_arch_half` | 세비야 대주교 (세빌리아 · 성직자) | 세비야 대주교 1600~ |
| `portraits/sponsors/es_arch_1_half` | 세비야 대주교 (세빌리아 · 성직자) | 페드로 곤살레스 데 멘도사 1480~1485 |
| `portraits/sponsors/es_arch_2_half` | 세비야 대주교 (세빌리아 · 성직자) | 디에고 우르타도 데 멘도사 1485~1502 |
| `portraits/sponsors/es_arch_3_half` | 세비야 대주교 (세빌리아 · 성직자) | 디에고 데 데사 1502~1523 |
| `portraits/sponsors/es_arch_4_half` | 세비야 대주교 (세빌리아 · 성직자) | 알론소 만리케 데 라라 1523~1538 |
| `portraits/sponsors/es_arch_5_half` | 세비야 대주교 (세빌리아 · 성직자) | 가르시아 데 로아이사 1538~1546 |
| `portraits/sponsors/es_arch_6_half` | 세비야 대주교 (세빌리아 · 성직자) | 페르난도 데 발데스 1546~1571 |
| `portraits/sponsors/es_arch_7_half` | 세비야 대주교 (세빌리아 · 성직자) | 크리스토발 데 로하스 1571~1581 |
| `portraits/sponsors/es_arch_8_half` | 세비야 대주교 (세빌리아 · 성직자) | 로드리고 데 카스트로 1581~1600 |
| `portraits/sponsors/es_casa_half` | 통상원 관리관 (세빌리아 · 관리) | 통상원 관리관 1600~ |
| `portraits/sponsors/es_casa_1_half` | 통상원 관리관 (세빌리아 · 관리) | 프란시스코 피넬로 1480~1509 |
| `portraits/sponsors/es_casa_2_half` | 통상원 관리관 (세빌리아 · 관리) | 아메리고 베스푸치 1509~1512 |
| `portraits/sponsors/es_casa_3_half` | 통상원 관리관 (세빌리아 · 관리) | 후안 디아스 데 솔리스 1512~1518 |
| `portraits/sponsors/es_casa_4_half` | 통상원 관리관 (세빌리아 · 관리) | 세바스티안 카보토 1518~1548 |
| `portraits/sponsors/es_casa_5_half` | 통상원 관리관 (세빌리아 · 관리) | 알론소 데 차베스 1548~1586 |
| `portraits/sponsors/es_casa_6_half` | 통상원 관리관 (세빌리아 · 관리) | 로드리고 사모라노 1586~1600 |
| `portraits/sponsors/es_crown_half` | 카스티야 국왕 (세빌리아 · 군주) | 임시정부 (수반 세라노) 1868~1869, 섭정 마리아 크리스티나 (왕위 공석) 1885~1886, 카스티야 국왕 1931~ |
| `portraits/sponsors/es_crown_1_half` | 카스티야 국왕 (세빌리아 · 군주) | 이사벨 1세 1480~1504 |
| `portraits/sponsors/es_crown_2_half` | 카스티야 국왕 (세빌리아 · 군주) | 후아나 1세 (통치자 페르난도 2세) 1504~1506, 후아나 1세 (섭정 페르난도 2세) 1507~1516 |
| `portraits/sponsors/es_crown_3_half` | 카스티야 국왕 (세빌리아 · 군주) | 카를로스 1세 (후아나 1세와 공동 국왕, 1555년까지) 1516~1556 |
| `portraits/sponsors/es_crown_4_half` | 포르투갈 국왕 (리스본 · 군주) | 펠리페 1세 (에스파냐 국왕 겸) 1580~1598, 펠리페 2세 1556~1598 |
| `portraits/sponsors/es_medina_half` | 메디나시도니아 공작 (카디스 · 귀족) | — (자리 공통 그림) |
| `portraits/sponsors/es_medina_1_half` | 메디나시도니아 공작 (카디스 · 귀족) | 엔리케 데 구스만 1480~1492 |
| `portraits/sponsors/es_medina_2_half` | 메디나시도니아 공작 (카디스 · 귀족) | 후안 알폰소 데 구스만 1492~1507 |
| `portraits/sponsors/es_medina_3_half` | 메디나시도니아 공작 (카디스 · 귀족) | 메디나시도니아 공작 1507~ |
| `portraits/sponsors/es_medinaceli_half` | 메디나셀리 공작 (세빌리아 · 귀족) | 메디나셀리 공작 1600~ |
| `portraits/sponsors/es_medinaceli_1_half` | 메디나셀리 공작 (세빌리아 · 귀족) | 루이스 데 라 세르다 1480~1501 |
| `portraits/sponsors/es_medinaceli_2_half` | 메디나셀리 공작 (세빌리아 · 귀족) | 후안 데 라 세르다 1501~1544 |
| `portraits/sponsors/es_medinaceli_3_half` | 메디나셀리 공작 (세빌리아 · 귀족) | 후안 데 라 세르다 4세 1544~1575 |
| `portraits/sponsors/es_medinaceli_4_half` | 메디나셀리 공작 (세빌리아 · 귀족) | 후안 루이스 데 라 세르다 1575~1600 |
| `portraits/sponsors/es_santangel_half` | 왕실 재무관 (발렌시아 · 관리) | — (자리 공통 그림) |
| `portraits/sponsors/es_santangel_1_half` | 왕실 재무관 (발렌시아 · 관리) | 루이스 데 산탄헬 1480~1498 |
| `portraits/sponsors/fr_ango_half` | 디에프의 선주 (루앙 · 상인) | — (자리 공통 그림) |
| `portraits/sponsors/fr_ango_1_half` | 디에프의 선주 (루앙 · 상인) | 장 앙고 1500~1551 |
| `portraits/sponsors/fr_calvin_half` | 개혁파 신학자 (스트라스부르크 · 성직자) | — (자리 공통 그림) |
| `portraits/sponsors/fr_calvin_1_half` | 개혁파 신학자 (스트라스부르크 · 성직자) | 장 칼뱅 1536~1564 |
| `portraits/sponsors/fr_king_half` | 프랑스 국왕 (파리 · 군주) | 총재정부 1795~1799, 임시정부 (뒤퐁 드 뢰르·집행위원회·카베냐크) 1848~1848, 국방정부 (트로쉬) 1870~1871, 프랑스 국왕 1906~ |
| `portraits/sponsors/fr_king_1_half` | 프랑스 국왕 (파리 · 군주) | 루이 11세 1480~1483 |
| `portraits/sponsors/fr_king_2_half` | 프랑스 국왕 (파리 · 군주) | 샤를 8세 (섭정 안 드 보죄) 1483~1491, 샤를 8세 1491~1498 |
| `portraits/sponsors/fr_king_3_half` | 프랑스 국왕 (파리 · 군주) | 루이 12세 1498~1515 |
| `portraits/sponsors/fr_king_4_half` | 프랑스 국왕 (파리 · 군주) | 프랑수아 1세 1515~1547 |
| `portraits/sponsors/fr_king_5_half` | 프랑스 국왕 (파리 · 군주) | 앙리 2세 1547~1559 |
| `portraits/sponsors/fr_king_6_half` | 프랑스 국왕 (파리 · 군주) | 프랑수아 2세 1559~1560 |
| `portraits/sponsors/it_doge_half` | 베네치아 도제 (베니스 · 군주) | 레오나르도 도나 1606~1612, 마르칸토니오 멤모 1612~1615, 조반니 벰보 1615~1618, 니콜로 도나 1618~1618 외 28명 |
| `portraits/sponsors/it_doge_1_half` | 베네치아 도제 (베니스 · 군주) | 조반니 모체니고 1480~1485 |
| `portraits/sponsors/it_doge_2_half` | 베네치아 도제 (베니스 · 군주) | 아고스티노 바르바리고 1486~1501 |
| `portraits/sponsors/it_doge_3_half` | 베네치아 도제 (베니스 · 군주) | 레오나르도 로레단 1501~1521 |
| `portraits/sponsors/it_doge_4_half` | 베네치아 도제 (베니스 · 군주) | 안드레아 그리티 1523~1538 |
| `portraits/sponsors/it_doge_5_half` | 베네치아 도제 (베니스 · 군주) | 피에트로 란도 1539~1545, 프란체스코 도나 1545~1553, 마르칸토니오 트레비산 1553~1554, 프란체스코 베니에르 1554~1556 외 8명 |
| `portraits/sponsors/it_medici_half` | 메디치 가 당주 (피렌체 · 귀족) | 메디치 가 당주 1600~ |
| `portraits/sponsors/it_medici_1_half` | 메디치 가 당주 (피렌체 · 귀족) | 로렌초 데 메디치 1480~1492 |
| `portraits/sponsors/it_medici_2_half` | 메디치 가 당주 (피렌체 · 귀족) | 피에로 데 메디치 1492~1494 |
| `portraits/sponsors/it_medici_4_half` | 메디치 가 당주 (피렌체 · 귀족) | 알레산드로 데 메디치 1531~1537 |
| `portraits/sponsors/it_medici_5_half` | 메디치 가 당주 (피렌체 · 귀족) | 코시모 1세 데 메디치 1537~1600 |
| `portraits/sponsors/it_moro_half` | 밀라노 공작 (밀라노 · 귀족) | — (자리 공통 그림) |
| `portraits/sponsors/it_moro_1_half` | 밀라노 공작 (밀라노 · 귀족) | 루도비코 일 모로 1480~1499 |
| `portraits/sponsors/it_moro_2_half` | 밀라노 공작 (밀라노 · 귀족) | 프란체스코 2세 스포르차 1521~1535 |
| `portraits/sponsors/it_pope_half` | 로마 교황 (로마 · 교황) | 로마 교황 1903~ |
| `portraits/sponsors/it_pope_1_half` | 로마 교황 (로마 · 교황) | 식스토 4세 1480~1484 |
| `portraits/sponsors/it_pope_2_half` | 로마 교황 (로마 · 교황) | 인노첸시오 8세 1484~1492 |
| `portraits/sponsors/it_pope_3_half` | 로마 교황 (로마 · 교황) | 알렉산데르 6세 1492~1503 |
| `portraits/sponsors/it_pope_4_half` | 로마 교황 (로마 · 교황) | 율리오 2세 1503~1513 |
| `portraits/sponsors/it_pope_5_half` | 로마 교황 (로마 · 교황) | 레오 10세 1513~1521 |
| `portraits/sponsors/it_pope_6_half` | 로마 교황 (로마 · 교황) | 클레멘스 7세 1523~1534 |
| `portraits/sponsors/ot_sultan_half` | 오스만 술탄 (이스탄불 · 군주) | 오스만 술탄 1909~ |
| `portraits/sponsors/ot_sultan_1_half` | 오스만 술탄 (이스탄불 · 군주) | 메흐메트 2세 1480~1481 |
| `portraits/sponsors/ot_sultan_2_half` | 오스만 술탄 (이스탄불 · 군주) | 바예지드 2세 1481~1512 |
| `portraits/sponsors/ot_sultan_3_half` | 오스만 술탄 (이스탄불 · 군주) | 셀림 1세 1512~1520 |
| `portraits/sponsors/ot_sultan_4_half` | 오스만 술탄 (이스탄불 · 군주) | 쉴레이만 1세 1520~1566 |
| `portraits/sponsors/ot_sultan_5_half` | 오스만 술탄 (이스탄불 · 군주) | 셀림 2세 1566~1574 |
| `portraits/sponsors/pl_copernicus_half` | 천문학자 (단치히 · 학자) | — (자리 공통 그림) |
| `portraits/sponsors/pl_copernicus_1_half` | 천문학자 (단치히 · 학자) | 니콜라우스 코페르니쿠스 1510~1543 |
| `portraits/sponsors/pl_king_half` | 폴란드 국왕 (바르샤바 · 군주) | 공위 1572~1573, 공위 1574~1575, 공위 1586~1587, 공위 1632~1632 외 6명 |
| `portraits/sponsors/pl_king_1_half` | 폴란드 국왕 (바르샤바 · 군주) | 카지미에시 4세 1480~1492 |
| `portraits/sponsors/pl_king_2_half` | 폴란드 국왕 (바르샤바 · 군주) | 얀 1세 올브라흐트 1492~1501 |
| `portraits/sponsors/pl_king_3_half` | 폴란드 국왕 (바르샤바 · 군주) | 알렉산데르 1501~1506 |
| `portraits/sponsors/pl_king_4_half` | 폴란드 국왕 (바르샤바 · 군주) | 지그문트 1세 1506~1548 |
| `portraits/sponsors/pl_king_5_half` | 폴란드 국왕 (바르샤바 · 군주) | 지그문트 2세 아우구스트 1548~1572 |
| `portraits/sponsors/pt_behaim_half` | 우주지 학자 (리스본 · 학자) | 우주지 학자 1600~ |
| `portraits/sponsors/pt_braganza_half` | 브라간사 공작 (오포르토 · 귀족) | 브라간사 공작 1600~ |
| `portraits/sponsors/pt_braganza_1_half` | 브라간사 공작 (오포르토 · 귀족) | 페르난두 2세 공작 1480~1483 |
| `portraits/sponsors/pt_braganza_2_half` | 브라간사 공작 (오포르토 · 귀족) | 자이미 1세 공작 1497~1532 |
| `portraits/sponsors/pt_braganza_3_half` | 브라간사 공작 (오포르토 · 귀족) | 테오도지우 1세 공작 1532~1563 |
| `portraits/sponsors/pt_braganza_4_half` | 브라간사 공작 (오포르토 · 귀족) | 주앙 1세 공작 1563~1600 |
| `portraits/sponsors/pt_casaindia_half` | 인도 상관장 (리스본 · 관리) | — (자리 공통 그림) |
| `portraits/sponsors/pt_casaindia_1_half` | 인도 상관장 (리스본 · 관리) | 기니·미나 상관장 1480~1503 |
| `portraits/sponsors/pt_casaindia_2_half` | 인도 상관장 (리스본 · 관리) | 인도 상관장 1503~1560 |
| `portraits/sponsors/pt_casaindia_3_half` | 인도 상관장 (리스본 · 관리) | 인도 상관 총관 1560~ |
| `portraits/sponsors/pt_india_half` | 포르투갈령 인도 총독 (고아 · 총독) | — (자리 공통 그림) |
| `portraits/sponsors/pt_india_1_half` | 포르투갈령 인도 총독 (고아 · 총독) | 아폰수 드 알부케르크 1510~1515 |
| `portraits/sponsors/pt_king_half` | 포르투갈 국왕 (리스본 · 군주) | 총독 평의회 (5인 섭정) 1580~1580, 포르투갈 국왕 1908~ |
| `portraits/sponsors/pt_king_1_half` | 포르투갈 국왕 (리스본 · 군주) | 주앙 2세 1481~1495 |
| `portraits/sponsors/pt_king_2_half` | 포르투갈 국왕 (리스본 · 군주) | 마누엘 1세 1495~1521 |
| `portraits/sponsors/pt_king_3_half` | 포르투갈 국왕 (리스본 · 군주) | 주앙 3세 1521~1557 |
| `portraits/sponsors/pt_king_4_half` | 포르투갈 국왕 (리스본 · 군주) | 세바스티앙 1세 1557~1578 |
| `portraits/sponsors/pt_marchionni_half` | 피렌체 출신 대상인 (리스본 · 상인) | — (자리 공통 그림) |
| `portraits/sponsors/pt_marchionni_1_half` | 피렌체 출신 대상인 (리스본 · 상인) | 바르톨로메우 마르키오니 1480~1530 |
| `portraits/sponsors/pt_queen_half` | 포르투갈 왕비 (리스본 · 귀족) | 포르투갈 왕비 1600~ |
| `portraits/sponsors/pt_queen_1_half` | 포르투갈 왕비 (리스본 · 귀족) | 레오노르 왕비 1480~1525 |
| `portraits/sponsors/pt_queen_2_half` | 포르투갈 왕비 (리스본 · 귀족) | 카타리나 왕비 1525~1578 |
| `portraits/sponsors/pt_queen_3_half` | 포르투갈 왕비 (리스본 · 귀족) | 카타리나 공작부인 1578~1600 |
| `portraits/sponsors/ru_prince_half` | 모스크바 대공 (모스크바 · 군주) | 공위 (국민군 임시 정부) 1612~1613, 모스크바 대공 1917~ |
| `portraits/sponsors/ru_prince_1_half` | 모스크바 대공 (모스크바 · 군주) | 이반 3세 1480~1505 |
| `portraits/sponsors/ru_prince_2_half` | 모스크바 대공 (모스크바 · 군주) | 바실리 3세 1505~1533 |
| `portraits/sponsors/ru_prince_3_half` | 모스크바 대공 (모스크바 · 군주) | 이반 4세 (섭정 옐레나 글린스카야) 1533~1538, 이반 4세 1538~1584 |
| `portraits/sponsors/sc_knox_half` | 스코틀랜드의 설교자 (에든버러 · 성직자) | — (자리 공통 그림) |
| `portraits/sponsors/sc_knox_1_half` | 스코틀랜드의 설교자 (에든버러 · 성직자) | 존 녹스 1559~1572 |

## 흉상이 없는 항해사 30명

아래 항해사는 흉상 파일도 없어서(그려 만든 얼굴이나 다른 그림을 빌려 씀) 무릎상만 넣어도 대화는 흉상 구도로 남는다 — 흉상과 무릎상을 함께 만들 때 쓴다: 말린체(`marina`), 츠카하라 보쿠덴(`bokuden`), 진조의(`chen`), 김서진(`kim`), 투팍(`tupac`), 누징가 은쿠우(`kisk`), 셀레스티나(`w_celestina`), 모르간 르 페이(`w_morgan`), 키르케(`w_circe`), 메데이아(`w_medea`), 바바 야가(`w_babayaga`), 베파나(`w_befana`), 마더 쉽턴(`w_shipton`), 벨레차 오르시니(`w_bellezza`), 아그네스 워터하우스(`w_waterhouse`), 우르술라 켐프(`w_kemp`), 발푸르가 하우스만닌(`w_hausmann`), 아그네스 샘프슨(`w_sampson`), 게일리스 덩컨(`w_duncan`), 안나 콜딩스(`w_koldings`), 고스탄차 다 리비아노(`w_gostanza`), 메르가 비엔(`w_bien`), 카타리나 케플러(`w_kepler`), 엘리자베스 서던스(`w_demdike`), 앨리스 너터(`w_nutter`), 마리아 데 소소야(`w_zozaya`), 그라시아나 데 바레네체아(`w_barrenechea`), 이소벨 가우디(`w_gowdie`), 카트린 몽부아쟁(`w_voisin`), 티투바(`w_tituba`).
