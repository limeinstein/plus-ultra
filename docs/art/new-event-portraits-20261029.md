# 새 역사 이벤트 인물화 33명

2026-10-29. Claude가 추가한 명예혁명·종교 개혁·로마 약탈·베스트팔렌 조약·위그노 내전에서 새로 필요한 인물 33명의 얼굴상과 무릎상을 제작·연결했다. 내장 ImageGen 원화 33장, 게임용 초상 66개다.

## 결과

- 얼굴상: `images/portraits/history/<id>.webp`, 1024×1024.
- 무릎상: `images/portraits/history/<id>_half.webp`, 1024×1536 투명 배경. 머리부터 무릎단까지 포함하고 종아리·발은 제외한다.
- 원화: `artifacts/new-event-portraits-20261029/sources/portrait/`.
- 전체 모음: 같은 아티팩트 폴더의 `face-preview.jpg`, `portrait-preview.jpg`.
- 여성 모음: `women-preview.jpg`, `women-faces-preview.jpg`.
- 실제 대화 캡처: `<id>-half-in-game.png`, `<id>-face-in-game.png`.

얼굴상은 같은 무릎상 원화에서 잘라 만들어 얼굴과 머릿결이 일치한다. 실존 인물의 외모·복식은 게임 자료를 바탕으로 한 창작 해석이다. 이름 없는 전령·장교·목사 등은 `fiction: true`인 역할 인물로 등록했다.

| 사건 | 인물 | 파일 이름 |
|---|---|---|
| 명예혁명 | 메리 2세 | `glory_mary2` |
| 종교 개혁 | 카타리나 폰 보라 | `lu_katharina` |
| 베스트팔렌 조약 | 페르덴의 수녀원장 | `wp_abbess` |
| 명예혁명 | 제임스 2세 | `glory_james2` |
| 명예혁명 | 오라녜 공 빌럼 | `glory_william3` |
| 명예혁명 | 한스 빌럼 벤팅크 | `glory_bentinck` |
| 명예혁명 | 아서 허버트 제독 | `glory_herbert` |
| 명예혁명 | 다트머스 경 | `glory_dartmouth` |
| 명예혁명 | 핼리팩스 후작 | `glory_halifax` |
| 명예혁명 | 존 로크 | `glory_locke` |
| 종교 개혁 | 그라우엔펠스 추기경 | `lu_cardinal` |
| 종교 개혁 | 비서 루프레히트 | `lu_ruprecht` |
| 종교 개혁 | 참사회원 볼프강 | `lu_canon` |
| 종교 개혁 | 요한 테첼 | `lu_tetzel` |
| 종교 개혁 | 비단 상인 콘라트 | `lu_konrad` |
| 종교 개혁 | 기사 쿠르트 | `lu_kurt` |
| 로마 약탈 | 프란체스코 귀차르디니 | `guicciardini` |
| 로마 약탈 | 부르봉 공작 샤를 | `bourbon` |
| 로마 약탈 | 카스파르 뢰이스트 | `roist` |
| 로마 약탈 | 벤베누토 첼리니 | `cellini` |
| 베스트팔렌 조약 | 아드리안 파우 | `wp_pauw` |
| 베스트팔렌 조약 | 페냐란다 백작 | `wp_penaranda` |
| 베스트팔렌 조약 | 헤라르트 테르보르흐 | `wp_terborch` |
| 베스트팔렌 조약 | 요한 아들레르 살비우스 | `wp_salvius` |
| 로마 약탈 | 란츠크네히트 | `rs_landsknecht` |
| 로마 약탈 | 로마 시민 | `rs_roman` |
| 로마 약탈 | 에스파냐 장교 | `rs_spanish_officer` |
| 베스트팔렌 조약 | 페르덴의 루터파 목사 | `wp_pastor` |
| 베스트팔렌 조약 | 브레멘 시참사 | `wp_councillor` |
| 베스트팔렌 조약 | 암스테르담의 포고관 | `wp_crier` |
| 위그노 내전 | 국왕의 전령 | `hg_messenger` |
| 위그노 내전 | 라로셸의 목사 | `hg_pastor` |
| 위그노 내전 | 국왕의 원수 | `hg_marshal` |

## 여성 인물과 참고 이미지

메리 2세(26세), 카타리나(게임 설정 24세), 수녀원장(창작 성인 48세)을 서로 다른 얼굴·표정·머리·손동작으로 만들었다. 사용자가 첨부한 이미지에서 미소·단정한 자세·흩날리는 머릿결을 참고하고, 사진 질감을 줄인 반실사 회화풍으로 바꾸었다. 풍만한 실루엣, 몸에 맞는 시대풍 보디스와 넓은 목선을 적용했다. 메리는 어깨를 드러낸 비단 드레스, 카타리나는 불투명한 흰 슈미즈와 검은 드레스, 수녀원장은 문서와 열쇠를 든 검정·아이보리 복식이다.

카타리나의 첫 생성은 도구에서 차단되어, 가슴 노출을 줄이고 불투명한 의상으로 수정한 원화를 선택했다. 실제 선택본의 최종 지시문을 기록했다. 참고 이미지는 특정 인물의 신원 복제가 아닌 표정·머리·자세의 참고이며, 사용한 첨부 이미지 사본 3개는 `references/`에 보관했다.

## 생성과 내보내기

- 생성 방식: 내장 `image_gen`. CLI/API 생성은 사용하지 않았다.
- 최종 인물별 프롬프트: `tools/new_event_portraits_20261029_prompts.json`.
- 실제 호출·참조 이미지·선택 원본 경로: `artifacts/new-event-portraits-20261029/generated.json`.
- 내보내기: `python tools/new_event_portraits_20261029.py`. 기존 역사 인물화 내보내기를 재사용하며, 원화 보관·비율 유지·얼굴 자르기·WebP 저장·검수 모음만 수행한다.
- 파일 등록: `python tools/images.py`.
- 눈·입 기준점: 이번 초상 66개만 `tools/portrait_faces.py --key … --merge`로 추가했다.

## 게임 연결과 검사

이름 있는 23명은 기존 `G.Hist.speaker` 경로로 전용 초상을 고른다. 이름만 나오던 조연 10명은 `js/data/histfigures.js`에 추가하고 로마 약탈·베스트팔렌·위그노 사건의 실제 대사에 연결했다. 위그노 사건의 시대별 지휘관 중 앙주 공작·리슐리외는 기존 국왕·재상 초상 선택을 재사용하고, 이름 없는 원수는 새 그림을 사용한다. 사건 선택·보상·저장 구조는 그대로다.

- `node tests/new_event_portraits_20261029_smoke.js`: 33명 모두 전용 초상 선택, 66개 파일 읽기·해상도·투명 모서리·눈과 입 기준점 검사. 여성 3명을 포함한 8명의 얼굴·무릎상 16사례를 실제 대화에서 캡처했다. 콘솔 오류 0.
- `node tests/glory_smoke.js`, `reformation_smoke.js`, `romesack_smoke.js`, `westphalia_smoke.js`, `huguenot_smoke.js`: 다섯 이벤트 진행 검사 모두 통과.
- 원화 33장 모두 얼굴 검출 성공. 얼굴 크기와 비율을 바꾸는 재묘사는 하지 않았다.

환경에서는 번들 Playwright의 `NODE_PATH`와 로컬 Chrome의 `BROWSER_EXE`를 지정했다. 결과는 아티팩트 폴더의 `browser-results.json`, `asset-report.json`, `*-smoke.log`에 있다. 검사가 띄운 브라우저·게임 과정은 모두 종료했다.
