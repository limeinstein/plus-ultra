# 일기토 모션 시범 · 2026-11-09

제독과 카리브 해적에게 전용 공격·피격 시트를 적용했다. 뒤이어 기존 전투원 35명과 공주 6명에게도 전용 시트를 적용했다. [전체 모션 검토](duel-roster-20261109.md).

## 게임 화면

`index.html`을 파일로 열고 일기토 캔버스에서 캡처했다. GIF에는 준비에서 회수까지, 처치에서는 바닥에 닿은 뒤까지 담았다. 필살기 표의 PNG는 마지막 올려베기의 접촉 순간이다.

| 동작 | 갑판 | 술집 |
|---|---|---|
| 베기 | [GIF](duel-impact-20261109/deck-slash.gif) · [접촉 PNG](duel-impact-20261109/deck-slash.png) | [GIF](duel-impact-20261109/tavern-slash.gif) · [접촉 PNG](duel-impact-20261109/tavern-slash.png) |
| 찌르기 | [GIF](duel-impact-20261109/deck-thrust.gif) · [접촉 PNG](duel-impact-20261109/deck-thrust.png) | [GIF](duel-impact-20261109/tavern-thrust.gif) · [접촉 PNG](duel-impact-20261109/tavern-thrust.png) |
| 치기 | [GIF](duel-impact-20261109/deck-bash.gif) · [접촉 PNG](duel-impact-20261109/deck-bash.png) | [GIF](duel-impact-20261109/tavern-bash.gif) · [접촉 PNG](duel-impact-20261109/tavern-bash.png) |
| 막기 | [GIF](duel-impact-20261109/deck-block.gif) · [접촉 PNG](duel-impact-20261109/deck-block.png) | [GIF](duel-impact-20261109/tavern-block.gif) · [접촉 PNG](duel-impact-20261109/tavern-block.png) |
| 받아넘김 | [GIF](duel-impact-20261109/deck-parry.gif) · [접촉 PNG](duel-impact-20261109/deck-parry.png) | [GIF](duel-impact-20261109/tavern-parry.gif) · [접촉 PNG](duel-impact-20261109/tavern-parry.png) |
| 필살 3연격 | [GIF](duel-impact-20261109/deck-combo.gif) · [접촉 PNG](duel-impact-20261109/deck-combo.png) | [GIF](duel-impact-20261109/tavern-combo.gif) · [접촉 PNG](duel-impact-20261109/tavern-combo.png) |
| 보통 적 처치 | [GIF](duel-impact-20261109/deck-ko.gif) · [접촉 PNG](duel-impact-20261109/deck-ko.png) | [GIF](duel-impact-20261109/tavern-ko.gif) · [접촉 PNG](duel-impact-20261109/tavern-ko.png) |
| 강적 처치 | [GIF](duel-impact-20261109/deck-boss.gif) · [접촉 PNG](duel-impact-20261109/deck-boss.png) | [GIF](duel-impact-20261109/tavern-boss.gif) · [접촉 PNG](duel-impact-20261109/tavern-boss.png) |
| 제독 패배 | [GIF](duel-impact-20261109/deck-loss.gif) · [접촉 PNG](duel-impact-20261109/deck-loss.png) | [GIF](duel-impact-20261109/tavern-loss.gif) · [접촉 PNG](duel-impact-20261109/tavern-loss.png) |

## 원화와 조정값

- ImageGen 입력은 두 인물의 기존 전투원 시트였다. 제독은 남색 가죽 외투·붉은 망토·세이버, 해적은 녹색 외투·황토 띠·커틀러스와 단검을 기준으로 삼았다. 각 인물에게 6×4 공격·반응 시트를 한 장씩 제작했다. 치기와 올려베기의 접촉 칸은 칼날 전체와 손잡이가 보이는 자세로 한 차례 더 그렸다.
- 공통 생성 지시문은 [일기토 지시서 §5.3](../codex/08_duel_impact.md)에 있다. 공격 시트에는 내려베기·찌르기·위에서 내려치기·올려베기 및 튕겨남을, 반응 시트에는 상단·중단 피격, 무릎 굽힘·미끄러짐, 받아넘김·가드 깨짐, 처치 직전 버팀·비켜섬을 행별로 지정했다. 발을 바닥에 둔 오른쪽 옆모습과 각 칸의 무기 여백을 공통 조건으로 삼았다.
- 원화와 보정 원본은 로컬 `images/_extra/duel_fighters_ext_src/`에 있다. `tools/duel_repack.py --extension`으로 24칸을 분리하고 키·발밑을 기존 대기 자세에 맞춘다. 게임 시트는 칸 432×304, 피벗 (165, 278)이다.
- 칼빛·불꽃·충격파·조각은 `tools/procedural_art/run_duel_fx.js`로 투명 캔버스에서 제작했다. 먹방울과 육지·갑판 먼지는 ImageGen 원화를 `tools/duel_fx_prep.py`로 정리했다. 공용 효과 시트는 총 17장이다.
- 준비와 휘두름은 베기 200/70ms, 찌르기 260/45ms, 치기 300/80ms이며 치기 정점에 60ms를 더 머문다. 필살 1·2타의 정지는 각 35ms, 3타는 110ms다. 빠르게 모드에서는 공격 구간을 0.58배, 히트스톱을 0.6배로 재생한다. 기존 쓰러지는 자세와 강적 슬로모션의 시간 배율은 0.5다.
- 강적 판정은 전설 인물, 라이벌, 이름난 해전 적장 또는 플레이어의 1.1배 이상인 전투력에 적용한다. 플레이어가 쓰러지면 붉은 테와 채도 변화로 마무리한다.

## 검증

- `node tests/duel_impact_smoke.js`에서 갑판·술집과 그림이 없는 경우에 접촉 높이, 정지 중 두 사람의 자세, 흔들림 방향, 두 단계 밀림, 패링 반동, 연격의 섬광, 승패 연출, 접근성 설정과 빠르게 모드를 확인했다. `OUT` 환경변수를 주면 위 GIF와 PNG를 다시 만든다.
- 기존 `duel_assets_smoke.js`, `duel_motion_smoke.js`, `duel_finishers_smoke.js`, `tomb_duel_smoke.js`를 실행했다. 원본 37장·추가 4장의 칸 경계와 빈 칸, 37명의 무기 접점과 쓰러짐 외곽을 각 도구의 `--check`로 검사했다.
- 같은 난수로 실제 한 합(찌르기 명중 뒤 베기 받아넘김)을 비교했다. 보통 1,149ms, 빠르게 701ms로 61.0%였고 두 사람의 체력이 일치했다.
- 녹음 사용과 합성음 대체의 두 조건에서 타격 효과음 14종의 재생 경로를 확인했다.
- 변경 전후 실제 일기토의 합 진행을 동일한 난수 256개로 비교했다. 연출 대기와 그리기를 생략하고 방침 4종·무기 스타일 3종·적 능력치를 바꾸어 실행했다. 양쪽 모두 94승, 평균 6.35546875합이었고, 각 판의 승패·합 수·남은 체력·기세가 일치했다.
