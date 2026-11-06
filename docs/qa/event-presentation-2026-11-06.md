# 이벤트 연출 QA — 2026-11-06

사용자 요청: 「모든 이벤트에 대해서 잘 연출이 되는지 qa 진행해」. 웹판(index.html, 1280×720 머리 없는 Chromium)에서 사건을 조건에 맞춰 억지로 일으키고, 대화창·물음·창이 뜰 때마다 **누르기 전에** 화면을 찍어 자동으로 재고 눈으로 검수했다. 도구: `tools/qa_event_shots/` (README).

## 범위와 자동 점검

| 묶음 | 사건 | 일어남 | 캡처 |
|---|---|---|---|
| 1600~1700 사건 (forcelib) | 82 | 79 (뉴턴 1720 사건 2개는 1700 끝 이후라 불가 · 어린 왕자 만남은 사막 이동에서 멈춤) | 800 |
| 1600년 이전 사건 · 이야기 모드 · 튜토리얼 · 민족 동료 · 1700 끝 연출 · 그 밖 체계 (forcelib2) | 79 | 79 | 2,548 |

덜 본 것: 무도회(ball) · 형제 승계(siblings) · 왕서방 바다 만남(wangmerchant) · 두 아내 다툼(wifefeud) — 조건 만들기가 커서 이번에 못 일으킴.

자동 점검(3,348장): 깨진 그림 0 · 빈 얼굴 캔버스 0 · 글 이상(undefined/NaN/{자리표}/[object) 0 · 글 넘침 0 · 콘솔 오류 0. 그림 고리 실패는 `portraits/mates/h_kimdeokryeong`·`giacomo` 등 첫 키만 없고 다음 키(legendary/kim_deokryeong, player/casanova)로 정상 대체.

그래서 문제는 모두 **눈으로 본 연출** 쪽이다. 세 사람씩 두 번(161 사건, 의심 칸은 원본을 잘라 확대) 검수했고, 아래 원인 위치는 코드를 열어 확인했다.

## 고칠 목록 (순번 = 고칠 순서)

> 고침 (2026-11-06 밤): 4번 가운데 「알림이 장면 그림을 가림」(#A) · 참고 2 「같은 명성 알림 두 번」(#B) · 20번 뉴턴 두 사건(1690년으로 당김). 4번의 나머지(대화 중 제독 얼굴 · 창 글을 가리는 왼쪽 아래 알림)는 대화가 시작될 때 접는 것으로 함께 줄었다.

### 1. [상] 지문 줄 이름표에 내부 id(「af_null」「cw_null」「ei_null」「rv_null」)가 찍힌다

- **보이는 것**: africa17_2384 · colonyco_2012 · eastindia_2038 · rovers_2256 — 사람이 없는 서술 줄마다 대화창 이름표가 af_null 등
- **어디서**: js/systems/africa17.js:51 · colonyco.js:40 · eastindia.js:48 · rovers.js:46 — who(k)가 k=null(지문)도 G.Hist.speaker(접두+k)로 넘김 · js/data/histfigures.js:89 가 모르는 id를 이름으로 돌려줌
- **고치는 길**: who(null) → {} (play에서 l[0]==null이면 빈 화자). histfigures 의 모르는 id 는 이름을 비우고 console.warn. 네 파일 지문 줄 약 78줄.
- **이벤트**: africa17, colonyco, eastindia, rovers

### 2. [상] 선택지에서 제독 맞은편에 엉뚱한 사람이 선다 (#R1)

- **보이는 것**: 은징가 회견 선택지에 동료 아라미스 · 키푼지 물음에 은징가 · 숭정제 편지 선택지에 은징가 이야기의 캄부 · 브레멘 청원서에 진원원 · 1526년 부다에 누르하치 · 물에 빠져 죽은 러요시 2세가 다음 물음에 · 떰 물음에 타잔 · 사과 물음에 갑판장 … (약 40곳)
- **어디서**: js/ui/ui.js:749 partner = partnerFor(menuEl) || recentPartner() · ui.js:841/845 lastPartner 는 무릎상 대화에서만 바뀜 · ui.js:729 장면 그림(scenepic-on) 동안은 얼굴만(noStand) 쓰므로 그 사건의 상대가 기록되지 않음 · partnerFor 는 같은 건물 메뉴 15분, recentPartner 는 1분
- **고치는 길**: ① FE.showPic 시작·끝에 lastPartner 를 비운다(UI.resetPartner) — 사건 경계를 넘어 상대를 끌고 오지 않게. ② scenepic 때문에 noStand 로 바뀐 대사도 lastPartner 를 기록. ③ 사건이 제독 혼자 묻는 UI.ask(…, me())는 그 사건의 상대를 partner 로 넘기거나 noStand. (실제 놀이: 거리 사람과 말한 뒤 15분 안에 같은 도시에서 사건이 뜨면 그 사람이 선다)
- **덧붙임**: 시험은 시간을 당겨 1분 기준에 쉽게 걸렸다. 15분 기준(같은 건물 메뉴)은 실제 놀이에서도 걸린다.
- **이벤트**: nzinga_emb, nzinga_guns, nzinga_kombi, nzinga_ransom, nzinga_court, mingfall_night, mingfall_maid, mingfall_deliver, westphalia_table, westphalia_oath, newton_principia, newton_apple, tam, sky_ms, elmina_door, dutchwar, newworld, romeojuliet, jiajing, imjin, yeonsan, sekigahara, pocahontas, aztec, galpisa, beauxeu, mohacs, mughal, reformation, houjin, nerchinsk, beautybeast

### 3. [상] 마녀 모임 사건이 도시 들어설 때의 다른 사건과 동시에 진행된다

- **보이는 것**: 마녀 그림 위로 「세상의 소식」 창 · 왕실 전령의 왕궁 호출 · 다니엘라 회상(화면 전체 갈색 막) · 업적 장면이 겹쳐 마녀 글·결과 창을 읽을 수 없다 (coven_curse_464~475 · coven_potion_476~482)
- **어디서**: js/systems/coven.js:51~72 C.tick 은 시작할 때만 UI.busy() · C.play 는 C.running 만 세움 · js/systems/court.js:853 전령 호출·회상은 C.running 을 보지 않음
- **고치는 길**: 사건 잠금 하나(G.EventLock 또는 UI.busy + 진행 중 표식)를 두고 도시 진입 사건들이 그것을 본다. 마녀 사건은 다른 진입 사건이 끝난 뒤로 미룬다.
- **덧붙임**: 확인 필요: 강제 실행으로 진입 사건과 겹쳤을 수 있으나, 짜임상 실제로도 날 수 있다.
- **이벤트**: coven_curse, coven_potion, coven_new_fashion_party

### 4. [중] 왼쪽 위 알림이 장면 그림·제독 얼굴·창 글을 가린다 (#A · #R2)

- **보이는 것**: 장면 그림 액자 왼쪽 윗부분을 덮는다(#A) · 대화 중 알림 2~3개가 왼쪽에 선 제독 무릎상의 머리를 통째로 가린다(gyeonwoo_offer 365~371 등) · 창이 열리면 왼쪽 아래(corner) 알림이 창 본문 줄 머리를 가린다(littleprince_meet_897 · scheherazade 122/124) · 해전 안내 알림이 전투 뒤 도시 대화까지 남는다(macao·odawara·taiwan)
- **어디서**: css/style.css:316 .toasts 기본 왼쪽 위(--notice-left/top) · :2069 #ui.talking > .toasts top 116px · :2038 data-zone="corner" · FE.showPic 의 그림은 top 74, 가운데 1008px
- **고치는 길**: 대화·장면 그림이 시작되면 떠 있는 알림을 접어 배지로(이미 대화 중 새 알림은 hold) — 또는 #ui.talking/#ui.homeart-on 동안 알림을 오른쪽 위 열로. corner 구역은 창이 열려 있으면 창 바깥(오른쪽 아래)으로. 장면이 바뀌면(해전→도시) 해전 안내 알림을 닫는다.
- **덧붙임**: #B(같은 「명성이 드높아졌다」 두 번)는 시험용 저장의 titleSeen 이 명성보다 뒤처져 생긴 것으로 보인다 — 게임 문제 아님(참고 2).
- **이벤트**: (거의 모든 장면 그림 이벤트), gyeonwoo_offer, legend_scheherazade, castaway_wilson, huguenot_rochelle, family_kidwed, snowqueen_stow, legend_lamp, coven_new_fashion_party, mowgli, maria, fivetigers, princess_quest, nzinga_court, elmina_1to5, tudor, macao, incafall, medici, odawara, taiwan, littleprince_meet, eraend_warnings, tutorial, romance_wedding

### 5. [중] 바다에서 장면 그림 위로 확대 단추·해도 미니맵·오른쪽 패널·함대 띠가 겹친다 (#R4)

- **보이는 것**: 오른쪽 위 확대 단추(−, 1.0×, +, 선박 확대)가 그림 오른쪽 위를, 왼쪽 아래 「해도」 미니맵이 그림 왼쪽 아래와 대화창 얼굴 칸을 덮는다 (glory_j_wind_374 · napoleon_family_430 · globe_songs_054 · barbarossa 칸 8~18)
- **어디서**: js/systems/familyevent.js:188~235 FE.showPic 은 #ui.homeart-on 만 세움 · css/style.css:1379 homeart-on 이 감추는 것은 도시 쪽(.cmdmenu .todo .city-banner .fleetpanel)뿐
- **고치는 길**: #ui.homeart-on 에서 바다 HUD(확대 단추·해도·오른쪽 패널·함대 띠)도 visibility:hidden.
- **이벤트**: glory_j_wind, napoleon_family, napoleon_rescue, family_firstlove, globe_songs, pinocchio_rescue, barbarossa, kongo, treaty, imjin, macao, newworld, aztec, tudor_calais

### 6. [중] 장면 그림의 때가 어긋난다 — 절정 앞에서 걷힘 · 한 줄 늦게 뜸 · 결말까지 남음 (#R3)

- **보이는 것**: 걷힘: 매산의 편지·옥비녀 절정이 빈 북경 거리(mingfall_maid 254~257) · 글로브 화재 대피가 평화로운 부두(globe_anne_fire 031~034) · 「모두는 하나를…」이 검은 바다(huguenot_rochelle 152~159) · 콤비 전투·도끼(nzinga_kombi 200/201) · 혼노지(beauxea 7~11). 늦음: 상처 싸매는 그림이 다음 줄(tarzan_839) · 가시덤불 탑·깨어남이 그림 없이(sleeping_beauty 609~616) · 유리 구두 그림이 고친 뒤에야(cinderella 566~570). 남음: 기쁜 결말까지 「인당수 제물」 폭풍 그림(simcheong 344~352) · 말리는 갈래에도 물에 빠진 돈키호테(quixote_tours) · 낙마 뒤에도 돌격 그림(quixote_meet). 깜빡임: 모글리 그림이 사라졌다 다시(mowgli 814~821)
- **어디서**: 공통: withPic/pic 범위가 선택지(UI.ask)·전투 앞에서 끝남. 예) mingfall.js:240(250~256·201~208 밖) · globe.js:146(152~158 밖) · huguenot.js:135 pc.stop() 이 전투 앞 · nzinga.js:257~262(274~277 밖) · romeojuliet.js:129~145 · tarzan.js:59→60, 127→128 · fairytales.js:130/140, 157/177, 208 · simcheong.js:50 · quixote.js:133/154 · junglebook.js:95/100/104 · goamalacca.js:192~206
- **고치는 길**: 사건마다 장면 단위로 그림 범위를 다시 잡는다: (1) 선택지·결과까지 같은 장면이면 withPic 안에 둔다. (2) 그림이 그리는 순간의 줄 앞에서 띄운다. (3) 분위기가 바뀌면 그림을 바꾸거나 걷는다. 그림이 없는 장면은 16번 목록.
- **덧붙임**: 이 묶음이 가장 크다 — 이벤트 파일마다 몇 줄씩. 칸 번호는 docs/qa/event-presentation-2026-11-06.json 의 events 별 메모.
- **이벤트**: nzinga_emb, nzinga_kombi, nzinga_court, mingfall_night, mingfall_maid, mingfall_again, globe_anne_fire, huguenot_rochelle, sky_ms, mowgli, tarzan, tale_sleeping_beauty, tale_cinderella, tale_snow_white, simcheong, quixote_tours, quixote_meet, galpisa, imjin, newworld, beauxea, romeojuliet, sky_cop, sky_gal, barbarossa, goamalacca, ningchong, potosi, romesack, mughal, westphalia_oath, nerchinsk, ottomaneurope, safavid, wokou, donglin, houjin, africa17, beautybeast, yuegang, taiwan, horan, aztec, tudor

### 7. [중] 같은 사람의 얼굴·무릎상·장면 그림이 서로 다르거나 시대·나이와 맞지 않는다

- **보이는 것**: 핼리·뉴턴·후크 얼굴과 무릎상이 다른 사람(1686년에 1666년 학생 뉴턴) · 잔 다르크 금발 처녀복 ↔ 짧은 검은 머리 남장 · 잠자는 공주 무릎상이 분홍 프릴의 어린 소녀 · 블랑카 머리색·얼굴이 그림마다 다름 · 신데렐라 무도회 장면에 하녀 차림 무릎상 · 예순 넘은 은징가가 젊은 무릎상 · 1583년 「앳된 학생」 갈릴레오가 흰 수염 노인 · 1588년 엘리자베스 1세가 20대 · 「백발 노인」 코페르니쿠스가 검은 머리 장년 · 흰 수의의 마사무네가 갑옷 · 조선 상인 명월이 어깨 드러난 드레스 · 그 밖 옷·색 어긋남(줄리엣 붉은 드레스, 심청 소복, 게르다 털모자, 「달 없는 밤」에 보름달, 세비야 여인숙에 눈길 그림, 이수광·포카혼타스 혼례에 서양 남녀) · 어린 왕자: 반전 전부터 그림이 여성
- **어디서**: 그림 파일: portraits/history/nt_halley(_half)·newton·hooke · legendary/joan_of_arc · legendary/sleeping_beauty_half · cinderella_half · mates/galileo · history/elizabeth_player(tudor.js:47~49) · sponsors/pl_copernicus · history/wm_myeongwol_half · legend-events/yuegang_* · romance-events/05_harbor_wedding(data/romance.js:36) …
- **고치는 길**: 원화 작업 목록(Codex): 나이·시대별 얼굴(젊은/늙은 갈릴레오·엘리자베스·뉴턴·코페르니쿠스), 같은 사람 얼굴↔무릎상 맞추기, 글과 다른 옷·소품 그림 다시. 당장은 글을 그림에 맞추는 것도 방법.
- **이벤트**: newton_principia, joan, tale_sleeping_beauty, princess_quest, tale_cinderella, nzinga_kombi, galpisa, tudor_calais, sky_cop, odawara, imjin, brothers, romeojuliet, simcheong, snowqueen_gerda, yuegang, newworld, romance_wedding, littleprince_meet, littleprince_well

### 8. [중] 아래 22%가 투명한 무릎상 20장 — 사람이 대화창 위 허공에 뜬다

- **보이는 것**: 서인도 회사 상관장·임방갈라 전사가 무릎 높이에서 잘려 오두막 지붕 위에 떠 있다 (elmina_door_145 · nzinga_court_055)
- **어디서**: images/portraits/history/ alvarado · azambuja · bernal · caramansa · fsousa · gaeta · jcsousa · kongo_afonso · kongo_nkuwu · kongo_nsaku_envoy · kongo_nsaku · kongo_priest · kongo_soyo · mina_elder · mina_factor · mowgli_ape(1218) · narvaez · nzinga_imb · nzinga_wic · salvador_sa — 모두 _half.webp 1024×1536 의 불투명 끝이 y=1202
- **고치는 길**: 그림을 아래로 늘려 다시 만들거나(원화), 이 20장만 G.PORTRAIT_FACES 처럼 「바닥 비율」 표를 두어 dialogShell 이 sink 를 더 준다. yeonsan 장녹수 앉은 무릎상도 허공에 앉음.
- **이벤트**: elmina_door, nzinga_court, newworld, aztec, kongo, mowgli

### 9. [중] 떠돌이로 만든 소꿉친구·부하가 이름 있는 동료의 얼굴을 빌리거나 직업·나이와 안 맞는 얼굴을 쓴다

- **보이는 것**: 소꿉친구 안드레이아 = 카트린 드 케르모르 그림 · 카롤리나 = 아미나 그림 · 카롤리나 드 알메이다 = 비토리아 콘타리니 그림 (함께 있으면 같은 얼굴 둘) · 돛 수선공이 금실 드레스 귀부인(official_half) · 「소꿉친구」가 수염 난 30대
- **어디서**: js/systems/wanderers.js:97 FEMALE_ROLES 에 noble·official · :111~116, 160 facePool 이 같은 문화권 동료 초상을 빌려줌 · osa.js:81~82 · oldguard.js:183
- **고치는 길**: 소꿉친구·떠돌이 얼굴 풀에서 이름 있는 동료(mates/*) 그림을 빼고 npc-roles/pools 만. 직업에 맞는 역할(돛 수선공 → keeper/maid/merchant), 나이(소꿉친구는 아이와 같은 또래)로 거른다.
- **이벤트**: family_osa, elmina_1to5, romance_wedding, kongo, family_heirplan_friend

### 10. [중] 말하는 사람 배치가 어색하다

- **보이는 것**: 오호대장군: 말하는 사람이 늘 왼쪽이라 대사마다 좌우가 바뀜 · 삼총사: 칼 뽑은 상대가 사라지고 제독 혼자 가운데 · 소꿉친구가 「돌아보니…」 등장 전부터 맞은편에 서 있고 지문 줄마다 둘 다 사라졌다 나타남 · 혼례 그림(family-events) 위에 무릎상 둘이 그림 속 신랑·신부를 가림 · 부하끼리 혼례에서 무릎상이 그림을 가림 · 설화가 그림 속과 그림 앞에 두 번 · 제독이 부하 말투로 자기에게 존댓말 보고(「…화첩에 옮겨 두겠습니다」) · 제독 속말인 물음에 상대가 화자(「로렌초의 부탁을 들어줄까?」 · 「화선에 실을 화약…?」 · 「브루누를 어떻게 할까?」) · 「모리 란마루라 합니다」 첫 줄부터 이름표 「란」 · 「엘리자베타다」라고 밝힌 뒤에도 이름표 「눈의 여왕」
- **어디서**: fivetigers.js:61 me.side = left 고정 · ui.js:754/761(술집 keepScene → solo) · osa.js:122~124, 162 heirSp() · kidwed.js:70, 136~138 (family-events 는 cover=false, familyevent.js:205) · romance.js:150~156 duo special · brothers.js:60~61 standInScene · js/scenes/common.js:176~184 bestHand(me:true) + :372~373 lineFor · heirplan.js:104 · medici.js:204/225 · tudor.js:409 · beauxea.js:39 · snowqueen(이름표)
- **고치는 길**: 각 줄에 맞게: 화자 쪽 고정(상대 = 오른쪽) · 술집 물음도 duo · 등장 전 줄은 partner 없이 · kidwed/romance 그림에 noStand · bestHand 가 제독이면 제독 말투 줄 · 제독 결정 물음은 me() · 이름 밝히기 전 이름표 · 정체 밝힌 뒤 이름표 바꾸기.
- **이벤트**: fivetigers, legend_musketeers, family_osa, elmina_1to5, family_kidwed, romance_wedding, brothers, newton_apple, legend_dartagnan, family_heirplan_friend, medici, tudor_calais, beauxea, snowqueen_moscow

### 11. [중] 얼굴 없이 이름표만 나오는 화자

- **보이는 것**: 바르바리 해적 두목(얼굴 칸 비고 도시 메뉴가 열린 채) · 닝충의 이네스(주인공인데 얼굴 없음) · 광장의 구경꾼 · 헝가리 귀족 · 여관 안주인이 지문으로 · 왕실 전령이 후원자용 귀족 그림(pools/sponsors/*/m/04_half)을 빌려 비웃는 귀족처럼
- **어디서**: princess.js:191 { name: '바르바리 해적 두목' } · ningchong.js:65~66 STRANGER·FANYI · sponsor.js:110 SP.butler(half 없음)
- **고치는 길**: 역할 portrait({role, st}) 를 붙인다 — 해적: npc pirate · 전령: herald 계열.
- **이벤트**: princess_quest, ningchong, beauxeu, mohacs, legend_zhuge, elmina_1to5, coven_new_fashion_party, barbarossa

### 12. [중] 정글북 수수께끼가 46자에서 잘려 풀 수 없다

- **보이는 것**: 선택지 글이 「…호랑이, 염소, 바…」로 끝나 「호랑이는 염소를, 염소는 바나나를 먹는다」 조건이 안 보인다 (mowgli_822/825)
- **어디서**: js/systems/junglebook.js:107 rd.q.slice(0, 46)
- **고치는 길**: 자르지 말고 수수께끼 전문을 물음 위 줄(UI.say)로 먼저 보이거나 slice 를 없앤다.
- **이벤트**: mowgli

### 13. [중] 레오나르도가 합류한 날 생일 선물을 두 번 준다

- **보이는 것**: 일반 생일 창이 「오랫동안 곁을 지켜 온 항해사」로 레오나르도를 내세워 망원경 → 이어서 레오나르도 전용 선물(비행 기계 모형) (leonardo_1025/1026)
- **어디서**: js/systems/lifespan.js:42~51 LF.givers 가 충성 90+ 중 1위를 고르며 함께한 기간을 보지 않음 · leonardo.js:115(충성 95로 합류) · leonardo.js:134 전용 선물과 서로 막지 않음
- **고치는 길**: givers 에 「함께한 지 1년 이상」 조건 · 전용 선물이 있는 해는 일반 선물 건너뜀.
- **덧붙임**: 날짜 6/14·6/21 차이는 시험 장치 탓일 수 있다.
- **이벤트**: leonardo

### 14. [중] 이야기 모드: 프롤로그 컷이 이야기 맨 앞에 먼저 뜨고, 같은 장면이 부두 거리에서 다시 진행된다

- **보이는 것**: 「어머니는 사진을… 넣어 주었다」 컷 → 「알파마 언덕의 작은 집」 장면이 리스본 부두 바탕에서 (story_1799~1822) · 남작 저택 장면도 부두 바탕
- **어디서**: js/systems/story.js:280 ST.cut('prologue') 를 P.intro 보다 먼저 부름
- **고치는 길**: 컷을 intro 의 「기름종이」 줄 앞으로 옮기고, 집·저택 장면에 장면 그림(또는 실내 바탕).
- **이벤트**: story

### 15. [중] 잉카의 몰락: 에스파냐에 가 있는 피사로가 툼베스에 서서 말한다 (확인 필요)

- **보이는 것**: 알마그로 「프란시스코는 에스파냐에 갔소」 직후 피사로 무릎상이 「좋다. 우리는 툼베스로 간다」 (incafall_820~826, 832)
- **어디서**: js/systems/incafall.js:147 t < 15301227 ? pizarro : almagro — 피사로가 없는 기간(:116 갈래, 15281001~15300201)이 빠짐
- **고치는 길**: 부재 기간에는 almagro 줄.
- **이벤트**: incafall

### 16. [하] 큰 장면인데 장면 그림이 없다

- **보이는 것**: 포르투갈 함대 열다섯 척(nzinga_sa) · 제갈량 등장 · 뱅크사이드 술집 · 펠리페 3세 알현 · 「해 질 녘 갑판」인데 한낮 오포르투 거리(입항 때 터짐) · 민족 동료 첫 줄에 도시 메뉴·할 일 패널이 그대로 · 베로나 암자 수수께끼가 베니스 부두(조선소 이름표)
- **어디서**: nzinga.js:295 saScene · legends.js:139~151 · globe.js:91 tale() · fivetigers.js:107 TG.arrival · folkjoin.js:92
- **고치는 길**: 그림 추가(원화) 또는 그림이 없을 때 건물 메뉴·할 일 패널을 감추는 「무대 비우기」(homeart-on 만 세우는 빈 장면).
- **이벤트**: nzinga_sa, legend_zhuge, globe_tale, princess_quest, fivetigers, folkjoin, sky_ms

### 17. [하] 무릎상이 없는 사람과 마주 서면 제독도 흉상으로 작아진다 (#R5)

- **보이는 것**: 새어머니·깜·오랑우탄 줄에서만 제독이 흉상 크기 → 다음 줄 다시 무릎상 · 바다에서 콜론이 거대한 흉상으로 대화창에 잘림
- **어디서**: js/ui/ui.js:836 「무릎상과 얼굴을 섞지 않는다」 규칙(한 사람이라도 없으면 둘 다 얼굴)
- **고치는 길**: 한 사건 안에서는 구도를 유지(앞줄이 무릎상이면 없는 쪽만 흉상 액자로) 또는 그 인물 무릎상 추가.
- **이벤트**: tam, mowgli, newworld

### 18. [하] 튜토리얼 대사 어긋남

- **보이는 것**: 도서관 사서 인사가 세 번(합쇼체→하오체) · 사서가 손님에게 물었는데 「아직 갈 곳이 없어서…」를 루카가 답함 · 루카 「라틴어를」인데 책 창은 「로망스어」 · 「오른쪽 목록에서 골라도 되지요」인데 대화 중엔 목록이 숨겨짐 · 첫 알림이 「첫 항해 0/18」 배지 끝을 덮음. 안내판 화살표 위치는 모두 맞음
- **어디서**: city/misc.js:438 LB.enter 인사 + systems/career.js:9 직업 인사 + data/tutorial.js intro · data/tutorial.js:61 화자 'R' → 'P'
- **고치는 길**: 튜토리얼 중에는 일반·직업 인사를 건너뛰고, :61 화자를 P 로, 언어 이름 맞추기, 「오른쪽 목록」 문구는 대화가 끝난 뒤로.
- **이벤트**: tutorial

### 19. [하] 그 밖의 작은 연출

- **보이는 것**: 1700 끝 연출: 「FINIS · 1700」 글씨가 가늘고 흐려 밝은 그림 위 대비 약함(나머지 3연·여명·항해의 끝 창은 정상) · 선택지 넷·6줄 대사로 대화창이 높아지면 장면 그림 아래 절반을 덮음 · 해독제 잔 아이콘(금잔=동전, 납잔=방패) · 민족 동료: 마사이가 서아프리카풍 tr 얼굴, 갈래 「검객」인데 「내 창이 앞장서겠어요」 · 장녹수 앉은 무릎상이 허공에
- **어디서**: eraend 의 .era-end FINIS 스타일 · data/folkjoin.js:15 P('tr') · :72 war 줄
- **고치는 길**: 각각 작게: FINIS 글씨 굵게·그림자 · 대화창 최대 높이 · 아이콘 · folkjoin 마사이 양식 ea, 검객 줄 · 앉은 그림은 standScale/sink.
- **이벤트**: eraend_warnings, teppo, sky_gal, folkjoin, yeonsan, legend_zhuge

### 20. [하] 나올 수 없는 사건과 그림 없는 물건

- **보이는 것**: 뉴턴 재제안·남해 거품(1720)은 1700-01-01 대항해시대의 끝 이후라 영영 나오지 않는다 · 악기 아이템 약 160종(레벡·피콜로·바순·가야금…)은 items/ 그림도 item-kinds/instrument 대체 그림도 없다
- **어디서**: js/data/newton.js:14 · newton.js:68 · js/core/images.js:457 K.item
- **고치는 길**: 뉴턴 두 사건을 1700 이전으로 당기거나 지운다 · item-kinds/instrument 대체 그림 하나라도.
- **이벤트**: newton_reoffer, newton_bubble

## 참고

- **참고 1 — 시험 장치 한계로 판단하지 않은 것**: 바다 WebGL·3D 배는 그리지 않음(검은 바다는 정상) · 애니메이션 0초(신기루 .mirage 는 마지막 키프레임이 투명이라 캡처로 판단 불가) · 무릎상이 잠깐 비어 이름표만 보인 칸(legend_lamp 150/160/162 · snowqueen_stow 707 · galpisa 575 · aztec 344/346 · barbarossa 450 · leonardo 1010)은 그림 읽기와 배치 사이 타이밍일 수 있어 확인 필요 · 업적 반응 대사를 방금 합류한 부하가 맡는 것은 시험용 함대 구성 탓
- **참고 2 — #B 같은 큰 알림 두 번**: 시험용 1600 저장의 titleSeen(무명의 항해자)이 명성 4,200 보다 뒤처져 있고 강제 실행이 명성을 올려 checkTitle 이 겹쳐 불렸다. 큰 알림은 60초 중복 막기를 일부러 건너뛴다(ui.js:469). 실제 놀이에서는 드물다 — 원하면 같은 글의 큰 알림만 5초 안 중복 막기.
- **참고 3 — 시험 하네스 쪽 발견**: forcelib F.base 가 1600 저장의 로미오와 줄리엣 2부(s.romeo)를 지우지 않아 베네치아·밀라노 입항마다 끼어든다 · F.enter 는 입항 검사(토르데시야스)를 건너뛴다 · 왕궁 왕명 창에서 「다른 왕명을 본다」를 계속 눌러 멈춤 — tools/qa_event_shots/forcelib2.js 에서 우회.

## 문제 없음으로 본 이벤트

sky_trial · westphalia_feast · glory_o_wind · glory_j_flight · coven_coven_oath(그림 속 마녀 13명 확인) · peter_lost · gyeonwoo_chain · napoleon_salon · castaway_journal · coven_wage_waiver · glory_j_france · tale_little_mermaid · pinocchio_join · coven_charm · huguenot_call · achieve_sample · ricci · quixote_santiago · beauxis · naming(이름 짓기 창 글·단추 정상) — 이 밖의 이벤트도 위 공통 문제(1·2·4·5·6번)만 보이면 따로 적지 않았다.
