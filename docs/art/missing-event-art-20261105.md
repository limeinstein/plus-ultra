# 누락 이벤트 인물화와 이벤트 샷 (2026-11-05~06)

전용 이미지가 없던 화자 ID 65개와 리치·알탄 칸의 후기 모습 2개를 채웠다. 얼굴상 67장, 무릎상 67장, 이벤트 샷 71장으로 게임용 새 파일은 총 205장이다. 위충현·객씨처럼 여러 사건에 나오는 동일 인물의 시기별 화자는 따로 센다. 이사회 화자 `cw_heeren`은 이사 다섯 명의 단체 초상이며 얼굴상은 가운데 대표를 잘랐다.

게임에 맞춘 미형의 반실사 수작업풍으로 제작했다. 무릎상은 발·신발 없이 무릎 부근에서 끝나며 1024×1536 투명 WebP, 얼굴상은 같은 원화에서 자른 448×448 투명 WebP다. 이벤트 샷은 대사에 맞는 1881×836 가로 그림이다. 연령·문화·역할이 드러나는 복식과 표정을 구분했다.

## 범위

| 사건 | 새 인물화 모습 | 이벤트 샷 |
|---|---:|---:|
| 동인도 회사 | 10 | 10 |
| 식민지 회사 | 10 | 8 |
| 왜구 토벌 | 6 | 6 |
| 가정제 | 10 (후기 알탄 포함) | 8 |
| 융경개관 | 4 | 3 |
| 마테오 리치 | 5 (후기 리치 포함) | 4 |
| 신작 항해사 | 기존 인물화 사용 | 16 |
| 견우와 직녀 | 기존 인물화 사용 | 1 |
| 동림당 | 13 | 9 |
| 영원성·숭정제 | 9 | 6 |
| 합계 | 67 | 71 |

## 연결

- `images/manifest.js`에 205개 경로를 등록하고 `js/data/portraitfaces.js`에 얼굴 자리 134개를 반영했다.
- `js/data/ricci.js`: 1595년부터 수염·선비 복식의 후기 리치를 고른다. 초기 조경 사건은 삭발·회색 승복이다.
- `js/data/jiajing.js`: 1572년부터 회색 수염의 후기 알탄 칸을 고른다.
- `js/systems/gyeonwoo.js`: 한산도 칠석 혼례 전용 그림을 표시하고 두 선택지와 종료 때 정리한다.
- 나머지 사건은 이미 지정된 전용 경로를 채워 원래 대화와 연결했다. 등장 조건·보상·동료 ID는 유지했다.

## 전체 미리보기

### 인물화

![인물화 1](missing-event-portraits-20261105-preview-1.jpg)

![인물화 2](missing-event-portraits-20261105-preview-2.jpg)

![인물화 3](missing-event-portraits-20261105-preview-3.jpg)

![인물화 4](missing-event-portraits-20261105-preview-4.jpg)

![인물화 5](missing-event-portraits-20261105-preview-5.jpg)

![인물화 6](missing-event-portraits-20261105-preview-6.jpg)

### 이벤트 샷

![이벤트 샷 1](missing-event-scenes-20261105-preview-1.jpg)

![이벤트 샷 2](missing-event-scenes-20261105-preview-2.jpg)

![이벤트 샷 3](missing-event-scenes-20261105-preview-3.jpg)

![이벤트 샷 4](missing-event-scenes-20261105-preview-4.jpg)

![이벤트 샷 5](missing-event-scenes-20261105-preview-5.jpg)

![이벤트 샷 6](missing-event-scenes-20261105-preview-6.jpg)

![이벤트 샷 7](missing-event-scenes-20261105-preview-7.jpg)

![이벤트 샷 8](missing-event-scenes-20261105-preview-8.jpg)

![이벤트 샷 9](missing-event-scenes-20261105-preview-9.jpg)

## 인물화 목록

| 이름 | 원화·얼굴상·무릎상 이름 |
|---|---|
| 토머스 스마이스 | `portraits/history/ei_smythe` · `_half` |
| 제임스 랭커스터 | `portraits/history/ei_lancaster` · `_half` |
| 이삭 르메르 | `portraits/history/ei_lemaire` · `_half` |
| 토머스 베스트 | `portraits/history/ei_best` · `_half` |
| 얀 피터르스존 쿤 | `portraits/history/ei_coen` · `_half` |
| 헤르만 판스페울트 | `portraits/history/ei_speult` · `_half` |
| 빌럼 우셀링크스 | `portraits/history/cw_usselincx` · `_half` |
| 열아홉 이사 | `portraits/history/cw_heeren` · `_half` |
| 장바티스트 콜베르 | `portraits/history/cw_colbert` · `_half` |
| 프랑수아 마르탱 | `portraits/history/cw_martin` · `_half` |
| 롤란 크라페 | `portraits/history/cw_crappe` · `_half` |
| 오베 기에데 | `portraits/history/cw_gjedde` · `_half` |
| 페터 미누이트 | `portraits/history/cw_minuit` · `_half` |
| 마타호른 | `portraits/history/cw_mattahorn` · `_half` |
| 빌럼 몰런스 | `portraits/history/cw_mollens` · `_half` |
| 윌리엄 패터슨 | `portraits/history/cw_paterson` · `_half` |
| 호종헌 | `portraits/history/wk_hu` · `_half` |
| 서해 | `portraits/history/wk_xuhai` · `_half` |
| 모해봉 | `portraits/history/wk_mao` · `_half` |
| 의오의 광부 | `portraits/history/wk_miner` · `_half` |
| 관군 천호 | `portraits/history/wk_officer` · `_half` |
| 피란민 | `portraits/history/wk_refugee` · `_half` |
| 가정제 | `portraits/history/jj_emperor` · `_half` |
| 방 황후 | `portraits/history/jj_fang` · `_half` |
| 도중문 | `portraits/history/jj_tao` · `_half` |
| 엄숭 | `portraits/history/jj_yan` · `_half` |
| 구란 | `portraits/history/jj_qiu` · `_half` |
| 알탄 칸 | `portraits/history/jj_altan` · `_half` |
| 종금 하툰 | `portraits/history/jj_sanniang` · `_half` |
| 고 태감 | `portraits/history/jj_eunuch` · `_half` |
| 소란 | `portraits/history/jj_maid` · `_half` |
| 도택민 | `portraits/history/yg_tu` · `_half` |
| 진대랑 | `portraits/history/yg_chen` · `_half` |
| 해방관의 관원 | `portraits/history/yg_clerk` · `_half` |
| 밀무역선 선주 | `portraits/history/yg_smuggler` · `_half` |
| 마테오 리치 | `portraits/history/rc_ricci` · `_half` |
| 미켈레 루지에리 | `portraits/history/rc_ruggieri` · `_half` |
| 왕반 | `portraits/history/rc_wangpan` · `_half` |
| 조경의 선비 | `portraits/history/rc_scholar` · `_half` |
| 마리암 하코비안 | `portraits/legendary/mariam` · `_half` |
| 라덴 아유 칸차나 | `portraits/legendary/kancana` · `_half` |
| 이드리스 | `portraits/legendary/idris` · `_half` |
| 에드먼드 헤일 | `portraits/legendary/edmund` · `_half` |
| 마테오 리치 (선비 복식) | `portraits/history/rc_ricci_late` · `_half` |
| 알탄 칸 (귀화성) | `portraits/history/jj_altan_late` · `_half` |
| 기용 | `portraits/history/nc_jiyong` · `_half` |
| 동창의 당두 | `portraits/history/nc_dangtou` · `_half` |
| 장 황후 | `portraits/history/nc_empress` · `_half` |
| 숭정제 | `portraits/history/nc_chongzhen` · `_half` |
| 위충현 | `portraits/history/nc_wei` · `_half` |
| 객씨 | `portraits/history/nc_ke` · `_half` |
| 요동의 양향관 | `portraits/history/nc_grain` · `_half` |
| 천계제 | `portraits/history/dl_tianqi` · `_half` |
| 위충현 | `portraits/history/dl_wei` · `_half` |
| 객씨 | `portraits/history/dl_ke` · `_half` |
| 유 태감 | `portraits/history/dl_yu` · `_half` |
| 이성비 | `portraits/history/dl_chengfei` · `_half` |
| 설소소 | `portraits/history/dl_susu` · `_half` |
| 동창의 교위 | `portraits/history/dl_tiqi` · `_half` |
| 육 부인 | `portraits/history/dl_lu` · `_half` |
| 주순창 | `portraits/history/dl_zhou` · `_half` |
| 안패위 | `portraits/history/dl_yan` · `_half` |
| 이네스 | `portraits/mates/nc_ines` · `_half` |
| 옥란 | `portraits/mates/nc_okran` · `_half` |
| 취연 | `portraits/mates/dl_cuiyan` · `_half` |
| 소만 | `portraits/mates/dl_xiaoman` · `_half` |
| 왕미 | `portraits/mates/dl_wangwei` · `_half` |

## 이벤트 샷 목록

| 장면 | 이미지 |
|---|---|
| 교토의 시동 (1582) | `legend-events/bx_kyoto` |
| 혼노지의 새벽 (1582.6.21) | `legend-events/bx_honnoji` |
| 가모가와의 새벽 | `legend-events/bx_ran_sea` |
| 모란정 「경몽」 (소주) | `legend-events/bx_peony` |
| 에도의 마상재 | `legend-events/bx_bajeong` |
| 대성당 작업장의 거인 (1501~1504) | `legend-events/bx_yard` |
| 광장으로 가는 거인 (1504.5) | `legend-events/bx_move` |
| 광장의 새벽 | `legend-events/bx_tommaso` |
| 베네치아 카니발의 밤 | `legend-events/bx_carnival` |
| 리알토의 새벽 | `legend-events/bx_lorenzo` |
| 무스카트의 길잡이 | `legend-events/bx_said` |
| 붙잡힌 길잡이 | `legend-events/bx_pt` |
| 갑판의 길잡이 | `legend-events/bx_said_deck` |
| 파나마의 부두 | `legend-events/bx_panama` |
| 툼베스의 해변 | `legend-events/bx_tumbes` |
| 수평선 너머 | `legend-events/bx_horizon` |
| 서인도 회사 (1621) | `legend-events/cw_wic` |
| 프랑스 동인도 회사 (1664) | `legend-events/cw_fr_eic` |
| 퐁디셰리 (1674) | `legend-events/cw_pondy` |
| 트랑케바르 (1620) | `legend-events/cw_tranq` |
| 신스웨덴 (1638) | `legend-events/cw_nswe` |
| 새 쿠를란트 (1654) | `legend-events/cw_tobago` |
| 스코틀랜드 회사 (1696) | `legend-events/cw_darien_sub` |
| 칼레도니아 만 (1698~1699) | `legend-events/cw_darien` |
| 런던 상인들의 출자 (1600) | `legend-events/ei_eic_founders` |
| 연합 동인도 회사 (1602) | `legend-events/ei_voc_house` |
| 수왈리 앞바다 (1612) | `legend-events/ei_swally` |
| 수왈리의 밤 | `legend-events/ei_swally_mariam` |
| 자야카르타의 불 (1619) | `legend-events/ei_jakatra_fire` |
| 반텐 가는 길 | `legend-events/ei_jakatra_kancana` |
| 반다의 비극 (1621) | `legend-events/ei_banda` |
| 육두구 묘목 | `legend-events/ei_banda_idris` |
| 암보이나 (1623) | `legend-events/ei_amboyna` |
| 살아남은 서기 | `legend-events/ei_amboyna_edmund` |
| 한산도의 칠석 혼례 | `legend-events/gyeonwoo_wedding` |
| 사례감의 내관 | `legend-events/jj_eunuch` |
| 서원의 단 (1542) | `legend-events/jj_xiyuan` |
| 서원의 새벽 이슬 | `legend-events/jj_dew` |
| 임인년의 밤 (1542) | `legend-events/jj_night` |
| 장가구 (1550) | `legend-events/jj_border` |
| 알탄 칸의 천막 (1550) | `legend-events/jj_altan` |
| 경술년의 가을 (1550) | `legend-events/jj_raid` |
| 귀화성의 칸 (1572) | `legend-events/jj_guihua` |
| 두 신부 (1583) | `legend-events/rc_macao` |
| 조경 (1583.9.10) | `legend-events/rc_zhaoqing` |
| 산해여지도 (1584) | `legend-events/rc_map` |
| 북경의 두 사람 | `legend-events/rc_peking` |
| 불타는 절강의 포구 | `legend-events/wk_raid` |
| 정해왕의 잔치 (히라도) | `legend-events/wk_hirado` |
| 잠항의 깃발 (1557) | `legend-events/wk_cengang` |
| 의오의 광부들 (1559) | `legend-events/wk_yiwu` |
| 태주의 싸움 (1561) | `legend-events/wk_taizhou` |
| 평해위 (1563) | `legend-events/wk_pinghai` |
| 월항의 밤배 | `legend-events/yg_night` |
| 월항이 열리다 (1567) | `legend-events/yg_open` |
| 은의 바다 | `legend-events/yg_silver` |
| 어용감의 태감 | `legend-events/dl_timber` |
| 건청궁 뒤뜰의 공방 | `legend-events/dl_workshop` |
| 성비의 궁 | `legend-events/dl_wall` |
| 새벽의 운하 | `legend-events/dl_cart` |
| 서호의 탄궁 | `legend-events/dl_westlake` |
| 배 위의 난초 | `legend-events/dl_orchid` |
| 책을 실은 거룻배 | `legend-events/dl_skiff` |
| 서찰원 앞 (1626) | `legend-events/dl_riot` |
| 불계원의 배 | `legend-events/dl_buxi` |
| 영원성의 성벽 (1626) | `legend-events/nc_wall` |
| 영원성의 여포수 (1626) | `legend-events/nc_ines` |
| 수방의 장부 (1627) | `legend-events/nc_okran` |
| 자경궁의 밤 (1627) | `legend-events/nc_palace` |
| 옥문이 열리다 (1627) | `legend-events/nc_freed` |
| 빈 곳간 (1628) | `legend-events/nc_granary` |

## 원화·생성 지시문·파일 묶음

생성 방식은 내장 `image_gen`이다. 개별 인물·장면마다 생성했으며 실제 사용한 지시문과 참조 이미지 경로는 아래 JSON에 남겼다. 원본 생성 파일은 보존하고 프로젝트에 PNG 사본을 보관했다. 얼굴 추출·규격 변환·미리보기에는 Pillow와 OpenCV를 사용했다.

- [인물화 지시문·원화 경로](../../tools/missing_event_portraits_20261105_prompts.json)
- [이벤트 샷 지시문·참조·원화 경로](../../tools/missing_event_scenes_20261105_prompts.json)
- 인물 PNG 사본: `artifacts/missing-event-portraits-20261105/sources/`
- 장면 PNG 사본: `artifacts/missing-event-scenes-20261105/sources/`
- [205장 전체 묶음](../../artifacts/missing-event-art-20261105/missing-event-art-20261105.zip)
- [인물화 134장 묶음](../../artifacts/missing-event-portraits-20261105/missing-event-portraits-20261105.zip)
- [이벤트 샷 71장 묶음](../../artifacts/missing-event-scenes-20261105/missing-event-scenes-20261105.zip)

검토 중 리치의 초기 복식, 쿠를란트 깃발, 낭선 소품, 덴마크 시대 복식, 마상재의 깃발, 가모가와 그림의 글자 흔적을 수정했다. 생성 당시와 수정 지시문은 제작 자료에 남아 있다.

## 검증

- `node tests/missing_event_art_20261105_smoke.cjs`: 134개 인물 이미지·71개 장면의 해독·규격·실제 대화 표시·종료 확인. 리치/알탄 시기별 선택, 한산도 혼례 두 선택지 확인. `pageerror`·`console.error` 0.
- `node tools/audit_missing_event_art_20261105.cjs --after`: 역사 화자 372개·사건 동료 86개·정적 장면 340개에서 전용 얼굴·무릎상·장면 누락 0.
- `tools/audit_event_images.py`: 장면 변형 532개에서 파일 누락 0·등록 누락 0.
- 이미지 전체 규격·투명도와 미리보기 육안 검토. 검사 브라우저는 `finally`에서 닫았다.
- [대화 화면 검사 결과](../../artifacts/missing-event-art-20261105/screenshots/checks.json)
- [최종 누락 감사](../../artifacts/missing-event-art-20261105/audit-after.json)
- [전체 장면 감사](../../artifacts/missing-event-art-20261105/scene-audit-after.json)

감사는 이 시점에 저장소에 있는 사건 자료를 기준으로 했다. 그림 표시는 전수 검사했고, 모든 이벤트의 자연 발생 조건을 장시간 플레이로 재현한 것은 아니다.
