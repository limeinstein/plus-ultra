# 02 조각 쌓기(스프라이트 스태킹) 배 그림

## 목표
위에서 내려다보는 지금 시점에서 배를 입체로: 선체를 높이별 가로 조각으로 그려 두고 한 칸씩 위로 비켜 쌓으면, 어느 방향을 향하든·옆으로 기울어도 부피가 보입니다.
지금의 `A.shipTop`(코드 그림)은 그대로 두고, 조각 그림이 있으면 그것을 쓰는 방식(없으면 코드 그림으로 돌아감).

## 만들 것
1. `tools/stack_ships.py` — `js/data/ships.js`의 36종 사양(hull, len, sails, cult)을 읽어 배마다 조각 시트를 만든다.
   - 출력 `images/ships-stack/<id>.webp`: 가로로 N장(선체 10~14 + 갑판 1 + 돛대·돛 4~6), 한 장 128×48(길이 방향이 가로).
   - 선체 단면은 흘수선에서 갑판까지 폭이 넓어지는 모양, 선미루·선수루 높이, 색은 `A.shipLook`과 같은 팔레트.
   - Pillow만 사용. 이름 규칙은 `images/README.md`에 한 줄 추가.
2. `js/art/shipstack.js` — `A.shipStack(ctx, x, y, ang, len, spec, t)`:
   - 조각 k를 `(0, −k·h)`만큼 위로(화면 위쪽 = 카메라 쪽) 비켜, 각 조각을 `ang`으로 돌려 그림. `pose.roll`·`pitch`는 조각마다 비켜 가는 방향에 더함(기울기가 보임).
   - 돛 조각은 `spec.rig`(brace·lee·luff·fill — `G.Waves.rigStep`)를 따라 돌리고 부풀림.
   - 그림이 없으면 `A.shipTop`을 부름. 한 배 그리기 0.3ms 이하(캔버스 2D, 조각은 미리 잘라 둔 비트맵).

## 시험
- `test_art.html` 같은 확인 페이지 `test_stack.html`: 36종 × 8방향 격자, 기울기 슬라이더.
- 스크린샷을 PR에 첨부. 콘솔 오류 0.

## 연결 지점(Claude가 함)
`sea.js`·`battle.js`의 `A.shipTop` 호출 — 설정에 「배 그림: 입체(조각)/평면」을 둘 예정.
