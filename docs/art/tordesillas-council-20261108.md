# 토르데시야스 조약 — 두 왕실의 선과 여섯 군주의 물음

1494년 조약 창의 기본 화면을 교황과 세계의 군주 아홉 명이 등장하는 대형 원화로 바꿨다. 교황이 양피지 세계 지도에 붉은 경계선을 긋고, 포르투갈 국왕과 에스파냐 여왕은 수긍한다. 조선·말리·명(중국)·잉카(남미)·인도·오스만 군주는 의아한 표정과 손짓으로 반응한다. 지역별 관모·왕관·직물·피부색과 표정을 구분했다. 개별 초상 없이 한 원화로 아홉 인물을 표현한다.

각국 군주가 실제 조약 현장에 모였다는 뜻은 아니므로 그림 아래에 상징화임을 짧게 적었다. ‘군주들의 시선’과 ‘경계와 조약문’ 탭을 오가며 원화와 원래 조약 설명을 읽는다. 1529년 사라고사 창은 경계와 조약문으로 시작한다. 해도는 실제 게임 지형에 양피지 색·잉크 해안선·방위선·나침반·겹테두리를 더했다.

- 게임 원화: [tordesillas_council_20261108_v2.webp](../../images/legend-events/tordesillas_council_20261108_v2.webp), 1672×941.
- 수정 원본: [corrected-v2.png](../../artifacts/tordesillas-council-20261108/corrected-v2.png). 이전 [original.png](../../artifacts/tordesillas-council-20261108/original.png)도 보존했다.
- 도구: 내장 `image_gen`으로 생성·편집. [최초 프롬프트](tordesillas-council-20261108-prompt.txt) · [경계선 수정 최종 프롬프트](tordesillas-council-20261108-correction-prompt.txt).
- 연결: `G.FX.treaty.sceneKey` → `G.Img.src` → 이미지 목록. 폴더 실행과 내장 그림 주소를 같은 경로로 처리한다.
- 조정값: `js/data/seafx.js`의 `treaty`에서 창 너비·지도 크기·그림 열쇠를 조정한다.

## 경계선 위치 수정

첫 원화는 붉은 선이 남아메리카 동쪽 바다에만 그어져 있었다. 사용자의 지적에 따라 서쪽으로 옮겨 브라질 땅을 지나고 동부 해안이 선의 동쪽에 남도록 수정했다. 교황의 손과 깃펜도 새 선에 맞췄다. 아홉 인물의 구성과 표정·복식은 유지했다. 새 파일과 별도 그림 열쇠를 사용해 이전 그림을 보존한다.

기준은 카보베르데 제도 서쪽 370레구아의 남북 경계와 브라질 동부의 포르투갈 쪽 배치다. 게임 해도의 기준 경도는 서경 46.5°이며 원화에서는 원근법이 있는 고풍스러운 지도에 이 위치 관계를 표현했다. [유네스코 조약 설명](https://www.unesco.org/en/memory-world/treaty-tordesillas?hub=1081).

수정본을 연결한 뒤 같은 조약 검사 전체를 다시 통과했고 콘솔 오류는 0이다. 실제 창에서 새 원화의 표시도 확인했다. [수정본 검사 기록](../../artifacts/tordesillas-council-20261108/runtime-v2/test.log). 검사에 띄운 브라우저는 종료했다.

## 검증

`node --require ./artifacts/drake-newworld-art-20261108/playwright-alias.cjs tests/treaty_smoke.js`

설치된 Chrome을 `BROWSER_EXE`로 지정하며, `OUT`은 `artifacts/tordesillas-council-20261108/runtime`이다. 파일 실행에서 원화 해독·탭 전환·방향키 조작·960×540과 800×450 화면의 가로 넘침과 닫기 단추·원화 오류 시 조약문 전환을 검사한다. 기존 조약 발동일·반구·사례금·항구 제한·언어·해도·사라고사·옛 저장 검사를 함께 수행한다. 검사 브라우저는 `finally`에서 닫는다.

최종 결과: 전체 검사 통과, Enter로 초점이 있는 탭 열기 통과, 콘솔 오류 0. `git diff --check`와 변경한 JavaScript 문법 검사도 통과했다. 검사 브라우저와 실행 과정을 모두 종료했다. [전체 검사 기록](../../artifacts/tordesillas-council-20261108/runtime/test.log).

![군주들의 시선 — 경계선 수정](../../artifacts/tordesillas-council-20261108/runtime-v2/council.png)

![경계와 조약문](../../artifacts/tordesillas-council-20261108/runtime/tordesillas.png)
