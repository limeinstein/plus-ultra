# 03 인물 2.5D 리그 실행기 (`G.Rig`)

## 목표
일기토·탐험대·갑판 선원·마을 사람을 뼈대 + 파츠 그림으로 움직입니다. Spine 같은 외부 실행기 없이, file://에서 도는 작은 자체 실행기.

## 자료 형식 (`js/data/rigs.js`, JSON과 같은 모양의 JS 객체)
```js
G.RIGS.human = {
  bones: [ {id:'hip', parent:null, x:0, y:0}, {id:'spine', parent:'hip', x:0, y:-18}, {id:'head', parent:'spine', x:0, y:-22},
           {id:'armU_R', parent:'spine', x:6, y:-18}, {id:'armL_R', parent:'armU_R', x:0, y:12}, ... ],
  parts: [ {bone:'spine', img:'torso', px:0.5, py:0.9, z:{E:2, W:2, N:3, S:1}}, ... ],   // z = 방향마다 그리는 순서
  anims: { idle:{len:2.0, loop:true, keys:{spine:[[0,0],[1,0.03],[2,0]]}}, walk:{...}, slash:{...}, block:{...}, hit:{...}, fall:{...} }
};
```

## 만들 것
1. `js/art/rig.js`
   - `G.Rig.create(def, skin)` → 인스턴스, `play(name, {blend})`, `update(dt)`, `draw(ctx, x, y, {dir, scale, tint})`.
   - 8방향: E·NE·N·NW·W(좌우 반전으로 SE·S·SW 채움) 중 5방향 파츠 순서표. 몸을 돌릴 때 가로 폭을 cos로 줄여 가짜 회전.
   - 절차 층(키프레임 위에 더함): 숨쉬기, 시선(`lookAt`), 발 IK(두 뼈 해석해, 지면 높이 함수 받음), 2차 모션(망토·머리카락·깃발 = 용수철 뼈).
   - 파츠 그림이 없으면 코드로 그린 대용 도형(캡슐·원)으로 — 게임은 항상 돌아가야 함.
   - 스킨: 체형 3 × 문화권 옷 × 색 바꾸기(팔레트 교체)로 조합.
2. `test_rig.html` — 동작 목록·방향·속도 슬라이더, 뼈 보이기.

## 시험
- 동작 6개 × 8방향 스크린샷 격자를 PR에 첨부, 콘솔 오류 0.
- 인물 40명을 동시에 그려 한 장면 2ms 이하(swiftshader가 아닌 보통 Chromium에서 잼).

## 연결 지점(Claude가 함)
`js/games/duel.js`의 자세 9종(준비·찌름·막음·맞음·쓰러짐·무릎·달아남·호통·사격) → 리그 동작, 그다음 `js/art/party.js`의 사람.
