# 피드백 #72·#73 그림 오류 수정

2026-10-27. 사용자에게 첨부받은 공개 피드백 화면을 기준으로 점검했다.

## 산치 대탑 (#73)

발견 GIF·끝 장면·재생 시트는 정상적으로 읽혔다. 지도용 4×4 원화 `images/map-discoveries/ruins-5.png`의 산치 칸에는 위 칸 제우스상의 받침대 일부가 걸쳐 있었다. 실제 지도에서도 대탑 위에 다른 건물 조각이 나타나는 것을 확인했다.

내장 ImageGen으로 산치만 분리한 투명 그림을 만들고 `images/map-discoveries/sanchi.png`에 저장했다. 지도 재생기가 이 발견물에는 1×1 그림을 사용하도록 연결했다. 원래 원화는 보존했다.

제작 도구: 내장 `image_gen.imagegen`, 투명 배경. 입력: 기존 원화의 산치 칸을 잘라 확인한 `artifacts/feedback-sanchi-icon-before.png`.

최종 프롬프트:

```text
Use case: background-extraction / precise-object-edit. Asset type: isolated transparent map landmark sprite for a historical exploration game. Edit target: the supplied damaged atlas crop of Sanchi Great Stupa. Preserve the central Sanchi Great Stupa, its rounded sandstone dome, small summit railing and finial, carved torana gateway on the right, smaller gateway on the left, circular stone balustrade, warm sandstone colors, painterly realistic miniature rendering and same three-quarter viewpoint. Remove COMPLETELY the unrelated temple/statue pedestal strip at the very top, all clipped adjacent structures, all red/yellow pixel debris and stray fragments. Output exactly ONE clean Sanchi stupa landmark isolated on true transparent background. Entire silhouette including summit, both gateways and narrow ground base must be visible, centered with at least 10% transparent margin on all four edges. No other building, no sky/background, no text, no border, no shadow extending outside the base. Keep architecture and style closely matched to original central stupa. This is a cleanup of the same game icon.
```

## 마리아 호날두 (#72)

이름은 포르투갈 여성 철새가 자동 생성할 수 있는 이름이다. 제보자의 저장 파일은 없으므로 같은 인물을 직접 복원하지는 못했다. 대신 여성 철새에 `portraits/npc-roles/is/priest` 남성 얼굴과 무릎상을 저장한 경우를 재현했다. 기존 코드는 `portraits/pools/` 경로만 교정하므로 잘못 저장된 역할 초상은 계속 남았다.

- 불러오기·표시·새 인물 생성에서 성별과 문화권에 맞는 완성 초상 후보를 확인한다.
- 얼굴 교정을 무릎상 선택보다 먼저 수행하고 같은 사람의 그림을 사용한다.
- 철새의 같은 ID를 다른 저장에서 불러올 때 이전 초상 캐시를 재사용하지 않는다.
- 이름·성별·ID·능력치는 바꾸지 않는다. 교정한 얼굴은 다시 불러와도 유지된다.

## 확인

통과:

- `node tests/wanderer_portrait_mapping_smoke.js`: 후보 190쌍, 옛 저장 교정, 같은 ID 재로딩, 얼굴·무릎상 일치.
- `node tests/catalog_portrait_mapping_smoke.js`: 지역 인물 245명의 도감 연결.
- `node tests/feedback_graphics_smoke.js`: Chromium에서 산치 전용 아이콘, 상단 투명 여백, GIF·끝 장면·18칸 재생 시트, 여성 철새 얼굴·무릎상. 페이지·콘솔 오류 0.
- `git diff --check`.

실제 브라우저 확인 화면: `artifacts/feedback-72-73-runtime.png`. 테스트 브라우저는 `finally`에서 닫는다.

기존 `portrait_fallback_smoke.js`는 조선 재상·학자의 전용 항해사 초상도 정상 후보로 인정하도록 현재 자료에 맞춰 보정했고 통과했다. `discovery_assets_smoke.py`는 이번 변경과 무관한 기존 자료 불일치가 남아 있다. 검사는 발견물 수를 923개로 고정하지만 현재 데이터는 973개이며, 자료에 연결되지 않은 기존 완성 그림 묶음 100개도 별도로 확인된다.
