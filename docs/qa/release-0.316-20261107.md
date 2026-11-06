# 0.316 통합 검증 — 2026-11-07

공개 0.315 이후의 해적 소굴·네 공주 기능, 플레이어 보행과 달리기, 육상전 지형, 누락 사건 원화를 함께 반영했다. 포털에는 빠져 있던 기능을 포함해 0.316 배포 이력을 추가했다. 기존 전체 이력과 빌드 결과 모두 제작 도구 이름의 노출은 0건이다.

## 실행 결과

| 검사 | 결과 |
| --- | --- |
| `node --check` — 게임 JS 500개 | 통과 |
| `node tests/pirate_lair_smoke.js` | 실제 해전·발견·점령·보상·시설·가족·저장·업적 통과 |
| `node tests/missing_event_art_20261106_smoke.cjs` | 35명·인물화 70장·장면 9장·정상 및 오류 종료 통과 |
| `node tests/landwar_terrain_smoke.cjs` | 9개 지역·연속 물길·개울 유무·나무 움직임 통과 |
| `node tests/player_loop_20261106_browser.cjs` | 14종 걷기·배율·반복·전환·정지·대기 우선권 통과 |
| `node tests/player_run_loops_browser.js` | 14종 달리기·같은 배율·반복·전환·정지 통과 |
| `node tests/navigator_walk49_browser.js` | 현재 순환 시트·실제 키 조작 검사 통과 |
| `node tests/landwar_motion_hd_smoke.cjs` | 21개 시트·19개 지역·발사→비행→착탄·돌격 통과 |
| `PAGE=http://127.0.0.1:4179/center/ node tests/beta_feedback_smoke.js` | 등록 요청·답변·완료 보관·지도·순위·접속 신호 통과 |
| `python -X utf8 tests/player_gait_20261107.py` | 14종·28시트·426칸의 배율·접지·공중·얼굴·원본 보존 통과 |
| `python -X utf8 tests/player_motion_faces.py` | 원본 얼굴 686칸·993,720픽셀 일치 |
| `python tools/audit_event_images.py` | 541종·파일 누락 0·미등록 0 |
| `node tools/audit_asset_completeness_20261106.cjs` | 발견물 1,233·소지품 1,053·교역품 158종 누락 0 |
| 이미지 등록과 Git 반영 대상 대조 | 14,161개 모두 포함 |
| `git diff --cached --check` | 통과 |

브라우저 검사 8개는 모두 최종 통과했고 각 검사에서 콘솔 오류가 없었다. 브라우저는 `finally`에서 닫았다. 피드백 검사는 외부 쓰기를 모의 응답으로 대체해 실제 게시물을 만들지 않는다.

포털을 `file://`로 직접 연 첫 검사는 피드백 기능이 의도적으로 비활성화되어 글 목록 대기에서 멈췄다. 배포와 같은 HTTP 조건으로 바꾼 최종 검사는 통과했다. 제품 코드는 바꾸지 않았다.

## 웹 빌드

`python tools/web_release.py --bump --channel both`로 버전을 0.315에서 0.316으로 올렸다. 웹 게시에 쓰지 않는 ZIP 생성은 중단하고 아래 명령으로 배포 폴더를 완성했다. 기존 설치된 esbuild를 경로에 추가해 JS·CSS를 압축했다.

```text
python tools/build_web.py --no-zip
python tools/build_web.py --channel beta --out dist/web-beta --no-zip
python tools/web_release.py --check
```

정식·베타에서 같은 `game.8ee4df7e.js`, `catalog.d595158a.js`를 사용한다. 두 빌드의 타이틀 버전 0.316, 채널 구분, 일곱 소굴, 플레이어 14종의 새 순환 시트, 업적 원화 등록과 콘솔 오류 0을 확인했다. 포털은 0.316 이력과 모바일 390px에서 가로 넘침 없음을 확인했다.

로컬 상세 로그·화면·재현 스크립트는 `artifacts/release-0.316-20261107/`에 보관했다. 원화와 구현의 상세 설명은 `docs/art/player-gait-20261107.md`, `docs/art/missing-event-art-20261106.md`, `docs/art/landwar-terrain-20261106.md`를 따른다.
