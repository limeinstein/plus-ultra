# 해전 물보라 7종과 공격 반동

2026-10-27. 내장 `image_gen.imagegen`으로 투명 원화를 생성했다. 모드는 built-in이며 CLI·외부 원작 그림은 사용하지 않았다. [실제 프롬프트 7개와 원화 경로](water-splash-prompts.json), [56프레임 한눈에 보기](water-splashes-contact.jpg), [동작 검수 화면](../../test_water_splashes.html).

## 반투명 수정 · 2판

흰 원형 물결이 어색하다는 요청에 따라 7종 모두 내장 ImageGen 편집으로 물의 알파와 수면 거품을 수정했다. 수정 원화는 `art_sources/water-splashes/translucent-sources/<id>.png`, 교체한 게임 시트는 기존 `images/effects/water/<id>.webp`다. 최초 원화는 `art_sources/water-splashes/sources/`에, 교체 전 시트·프롬프트·미리보기는 `art_sources/water-splashes/v1/`에 보존했다. 프롬프트 기록의 `referencedImage`가 실제 편집 대상이다.

재생 시에는 수직 물기둥을 살리고 수면 거품·바깥 가장자리로 갈수록 알파가 낮아지는 마스크를 한 번 합성해 보관한다. `G.FX.waterSplash.opacity=0.72`, `alpha.spray=0.9`, `alpha.base=0.28`, `alpha.edge=0.05`로 바다가 비치게 한다. 실제 알파 검사는 7종 56칸 모두에서 전체 불투명도가 170/255 이하이고 수면 기준점 아래는 55/255 이하임을 확인한다. 물기둥이 없는 마지막 거품 칸도 같은 기준점을 유지한다.

괴물 포격과 포탄 착수 위에 중복되던 흰 원형 고리를 제거했다. 일반 포격 반동과 로딩 중 임시 물결은 완전한 원 대신 불투명도 0.12 이하의 짧게 끊어진 잔물결만 쓴다. 침몰할 때의 흰 타원 덩어리와 닫힌 테두리도 제거했다. 실제 합성 결과는 [수정 미리보기](water-splash-battle/seven-types.png)와 [게임 화면](water-splash-battle/charge-impact.png)에서 확인할 수 있다. 수정 후 `node tests/water_splashes_smoke.cjs` 통과, 콘솔 오류 0건, 검사 브라우저 종료를 확인했다.

## 게임에 연결한 동작

| 시트 | 모양 | 실제 발생 조건 | 재생 시간 |
| --- | --- | --- | --- |
| cannon | 좁고 높은 착수 물기둥 | 빗나간 포탄·공격할 수 없는 대상에 떨어진 포탄 | 1.05초 |
| hull | 선체에 부딪혀 퍼지는 부채꼴 물 | 일반·괴물 포탄의 실제 명중 위치 | 0.75초 |
| volley | 사방으로 솟는 왕관 모양 분출 | 괴물이 16방향 포탄을 쏘는 순간 한 번 | 1.25초 |
| wake | 뱃머리에서 갈라지는 돌진 물살 | 스피드 괴물의 돌진 시작과 이동 경로 | 0.85초 |
| ram | 넓고 거센 충돌 폭발 | 괴물의 돌진 명중·함선의 충파 명중 | 1.1초 |
| dive | 안으로 말려드는 거품 소용돌이 | 괴물이 수면에서 잠수를 시작할 때 | 1.6초 |
| emerge | 무거운 물 커튼과 양쪽 물기둥 | 괴물이 수중 은신을 마치고 떠오를 때·함선 침몰 | 1.6초 |

일반 함선 포격에도 발사하는 선체가 짧게 떨리며 화면이 함께 흔들린다. 괴물의 포격·돌진 시작·잠수·재등장도 크기가 다른 충격을 준다. 명중·충돌 시 맞은 배는 따로 떤다. 기존 `G.Shake`의 이어지는 잡음과 감쇠 진동을 사용하며 실제 선체 좌표·충돌·피해·공격 간격은 바꾸지 않는다. 화면 흔들림·번쩍임 설정과 운영체제의 움직임 줄이기 기본값을 따른다. 화면의 단추와 글 상자는 흔들지 않는다.

## 파일과 규격

- 게임용: `images/effects/water/{cannon,hull,volley,wake,ram,dive,emerge}.webp`. 각각 **1024×512**, 4열×2행, 왼쪽부터 시간 순서, 256×256칸 8개, RGBA 무손실 WebP다.
- 원화 보관: 최초 원화 `art_sources/water-splashes/sources/<id>.png`, 반투명 수정 원화 `art_sources/water-splashes/translucent-sources/<id>.png`. 정리한 PNG: `art_sources/water-splashes/sheets/<id>.png`. 작업용 원화 폴더는 저장소의 기존 보관 정책에 따라 Git 추적 대상에서 제외된다.
- 좌표: `images/effects/water/atlas.json`. 수면 기준점 `[128,176]`. 모든 칸의 같은 배율·같은 기준점을 보존하므로 마지막 거품을 큰 그림으로 확대하지 않는다.
- 재생기: `js/art/watersplash.js`의 `G.WaterSplash.preload/emit/draw/status/ripple`. 그림 로딩 중에는 옅게 끊어진 잔물결로 위치를 표시한다. `file://` 직접 실행을 지원한다.
- 연결: `js/scenes/battle.js`와 `js/systems/seamonsters.js`. 돌진 항적·잠수는 대상 아래, 튀어 오르는 물은 대상 앞에 그린다. 방향성 물살만 수면을 따라 회전한다.

## 조정값

`js/data/seafx.js`의 `G.FX.waterSplash`에 크기·수명·앞뒤 배치·사라짐·흔들림을 모았다. `types`는 각 시트의 재생 설정, `shake`는 화면 충격, `tremor`는 개별 선체 떨림이다. 크기는 배 길이에 따라 0.75~1.8배로 조절한다. 돌진 항적은 0.24초 간격이고, 동시에 48개까지 재생한다. 공격 카메라 반동은 최소 0.08초 간격으로 묶어 다수 함선의 동시 포격이 과하게 쌓이지 않게 한다. 시각 효과는 저장하지 않고 같은 전장·내구·돌진·잠수 진행을 복원한다.

## 정리와 검증

`sharp`와 `playwright`가 설치된 경로를 `NODE_PATH`에 지정하고 실행한다.

```powershell
node tools/prepare_water_splashes.cjs
python tools/images.py
node tests/water_splashes_smoke.cjs
node tests/sea_monster_battle_smoke.js
node tests/battle_save_smoke.js
```

물보라 검사는 7종 56칸의 실제 알파·여백, file:// 로딩, 실제 포탄 발사/착수/명중, 괴물 사방 포격·고속 돌진·충돌·잠수·재등장, 공격자와 피해자의 떨림, 실제 카메라 어긋남, 흔들림 끄기, 효과 상한, 저장·불러오기를 확인한다. 실제 해전 화면은 [충돌](water-splash-battle/charge-impact.png)과 [재등장](water-splash-battle/emerge.png), 전체 동작 그림은 [7종 미리보기](water-splash-battle/seven-types.png)다. 모든 Chromium은 `finally`에서 닫는다.

검증 결과: 위의 물보라·괴물 전투·해전 저장 검사 3개 모두 통과했다. 각 브라우저의 `pageerror`와 `console.error`는 0건이며 검사에 사용한 게임과 브라우저를 모두 종료했다. 변경한 파일의 `git diff --check`도 통과했다.
