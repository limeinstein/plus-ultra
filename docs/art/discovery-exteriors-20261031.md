# 발견물 도시·야외 외관 전체 보완 (2026-10-31)

실제 `index.html`이 읽는 자료를 실행해 본편 발견물 1,226종과 이야기 전용 7종, 모두 1,233종을 조사했다. 발견 GIF·끝 장면·재생 시트는 모두 갖추어져 있었다. 도시 건축 발견물의 거리 외관 10종과 도시 밖 유적·자연 발견물의 지도 외관 80종이 빠져 있어, 이 90종을 내장 ImageGen으로 각각 제작했다. 기존 발견물 ID·가치·위치·해금 연도는 유지한다.

도시 외관은 정면에서 본 전체 건물이며 `images/landmarks/<id>.webp`에 높이 520px로 저장한다. 거리 배치가 그림을 자동으로 찾아 광장에 세우며, `js/data/landmarkbase.js`에 실제 발치 윤곽도 더한다. 탐험·항해·해도용 그림은 위에서 비스듬히 본 투명 미니어처이며 `images/map-discoveries/completion/<id>.webp`에 512×512로 저장한다. 각 그림은 다른 발견물의 칸과 섞이지 않는 독립 파일이다.

- [전체 제작 대상·원화 경로·생성 프롬프트](discovery-exteriors-20261031-prompts.json)
- [도시 외관 미리보기](discovery-exteriors-20261031-city.jpg)
- [야외 외관 미리보기](discovery-exteriors-20261031-field.jpg)
- [전체 그림 모아 보기·개별 저장](discovery-exteriors-20261031.html)

원화는 `tools/discovery_exteriors_20261031/sources/`에 보존한다. `tools/complete_discovery_art.py record`가 생성 원본 위치를 기록하고, `build`는 알파를 유지해 크기·형식을 변환한다. 기존 게임 그림과 등록 항목을 유지하며, 이번 그림을 수정할 때도 이전 원화와 이미 만든 게임 파일을 보관한다. 포토시 조폐국은 낮고 긴 석조 조폐국으로 다시 그렸고, 셉티조디움은 정확히 세 층의 기둥 벽으로, 만월대는 바다 없는 송악산 기슭의 궁터로 보정했다. 생성·편집 지시문과 참조 원화도 제작 목록에 남겼다.

도시/탐험용 새 그림을 쓰는 신기루는 외관 자체가 일렁이며, 늘 신기루인 야외 대학 여섯 곳은 소멸한 뒤 지도에 남지 않는다. 대학의 출현·발견 보상 규칙은 그대로다. 별도로 조류 33종과 나비·나방 17종의 현장 연출 시트 53장도 조사했고, 그림 목록과 실제 파일에 누락이 없었다. 결과는 `artifacts/discovery-completion-20261031/field-creature-audit.json`에 있다.

## 검사

```powershell
python -X utf8 tools/complete_discovery_art.py build
python -X utf8 tests/discovery_exteriors_complete.py
node tests/discovery_exteriors_runtime.js
node tests/mirage50_exteriors_runtime.js
```

파일 검사는 현재 발견물 전체의 발견 장면과 도시·지도 외관 누락, 신규 90종의 알파·투명 여백·크기·잘림·중복·등록을 확인한다. 브라우저 검사는 `file://`에서 전체 발견 장면 연결, 외관 실제 해독, 도시 거리 배치, 지도 그리기, 대학 신기루 소멸을 확인한다. 실제 거리·탐험 캡처와 결과는 `artifacts/discovery-completion-20261031/`에 저장하며 검사 브라우저는 종료한다.

최종 결과: 전체 1,233종의 발견 장면·도시/야외 외관 연결에 누락이 없었다. 신규 외관 90종의 파일 검사와 실제 브라우저 검사(도시 10·지도 80·야외 대학 신기루 6)가 모두 통과했고 콘솔 오류는 0개였다. 기존 신기루 50종도 도시 18·야외 32의 배치·연도 제한·소멸 검사가 통과했다. 이 배치 검사는 출현 확률 때문에 결과가 달라지지 않도록 검사 안에서만 출현을 확정하며, 실제 게임의 확률은 유지한다.

실제 화면은 `septizodium-street.png`, `constbaths-street.png`, `harvard-street.png`, `manwoldae-exploration.png`, 전체 그림은 `all-exteriors-runtime.png`, 검사 결과는 `runtime-report.json`에 남겼다. 모두 위 캡처 폴더에 있으며 검사 브라우저와 변환 과정은 종료했다.
