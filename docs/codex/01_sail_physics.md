# 01 돛·선체 물리 모듈 (`G.SailPhys`)

## 목표
손으로 몰 때와 해전에서 배의 "손맛"을 실제 범선처럼: 겉바람·돛의 양력/항력·용골의 옆 저항(리웨이)·기울기에 따른 속력 손실·키 효율(속력²).
**규칙(도착 예정·원정 계획·밸런스)은 바꾸지 않습니다.** 물리의 정상 상태 속력을 `R.shipSpeed`에 맞추고, 물리는 순간 반응만 바꿉니다.

## 만들 것
`js/core/sailphys.js` — 순수 함수, DOM·캔버스 없음(노드에서도 돌아가게).

```js
G.SailPhys.create(ship)        // → 상태 {u(앞 속력), v(옆 속력), r(선회율), heel}
G.SailPhys.step(S, input, dt)  // input: {wind:{dir,spd}, heading, rudder(-1..1), sail(0..1), target(R.shipSpeed 값)}
                               // → S 갱신, {fx, fy, heel, leeway, luff} 돌려줌
G.SailPhys.calibrate(shipType) // 바람 각 0~180°에서 정상 속력 / R.shipSpeed 비가 1±3%가 되게 보정표를 만든다
```
- 겉바람 = 참바람 − 배 속도(`G.Waves.apparent`와 같은 정의, 바람 dir = 불어 가는 쪽).
- 돛 종류(`sq`·`lat`·`bat`)별 양력·항력 곡선 — 모양은 `R.sailEff`(rules.js)와 맞출 것.
- 옆 저항: 옆 속도 v에 강한 감쇠, 겉바람 옆 성분이 만드는 리웨이 각 2~8°.
- 기울기(heel): 돛의 옆 힘에 비례, 최대 0.2 rad, 기울수록 앞 힘 × cos(heel)².
- 키: 선회 모멘트 ∝ u², 서 있으면 거의 돌지 않음. 노 배(`t.oar`)는 예외(느려도 돎).
- 조정값은 `G.FX.phys`(seafx.js)에 추가.

## 시험 (`tests/sailphys.test.js`, 노드만)
- 배 5종 × 바람 8방향 × 세기 3: 30초(게임 속) 뒤 속력이 `R.shipSpeed`의 ±3%.
- 맞바람 정면: 앞으로 가지 못하고 서서히 멈춤. 45°(가로돛은 60°) 안에서는 추진이 거의 0.
- 서 있는 배에 키를 끝까지: 10초에 5° 미만 회전(노 배 제외).
- dt 1/15·1/30·1/120에서 결과 차이 2% 미만(고정 부분 걸음으로 적분).

## 연결 지점(Claude가 함)
`js/scenes/sea.js`의 `move()`(손 조타 모드일 때만), `js/scenes/battle.js`의 `moveShip()`. 기울기는 `pose.roll`에 더함.
