# 08 일기토 타격감 — 히트스톱·접촉 효과·피격 자세·패링·처치 연출 (2026-11-09 사용자 요청)

`AGENTS.md`의 공통 규칙을 먼저 읽는다. 이 지시서는 **세 작업(PR)** 으로 나눈다 — A 코드 연출 → B 공용 효과 그림 → C 인물별 추가 동작 시트. A만 끝나도 게임에 바로 쓸 수 있게 하고, B·C는 그림이 없으면 A의 코드 연출로 돌아가게(fallback) 만든다.

**바꾸지 않는 것**: 명중률·피해·치명·기세·상성·기술 규칙·보상·저장 형식. 이 작업은 *보이고 들리는 것*만 바꾼다(패링도 연출 분류일 뿐 규칙이 아님). 기존 전투원 시트 37장의 픽셀, 컷인 GIF, `fallGeometry`는 건드리지 않는다.

---

## 0. 지금 상태 (2026-11-09, `js/games/duel.js` 843줄 · `G.FX.duel` in `js/data/seafx.js`)

| 항목 | 지금 | 문제 |
|---|---|---|
| 히트스톱 | 없음 | 칼이 몸을 그냥 지나가는 느낌 |
| 공격 속도 | `windup` 170ms(공격 줄 1번 칸 정지) → `lunge` 0.3초 동안 2~5번 칸을 **같은 간격**으로 | 준비와 휘두름의 속도 차가 없어 무게가 안 느껴짐 |
| 베기·찌르기·치기 | **모두 같은 공격 줄(0행)** 을 씀. 칼 궤적 `slashArc`는 베기·치기에 같은 호, 찌르기는 없음 | 수를 골라도 그림이 같음 |
| 접촉 위치 | 늘 `W/2 ± 60`, `gy − 110` 고정 | 키·수·거리와 상관없이 같은 자리에서 불꽃 |
| 피격 자세 | 대기 그림 + 기울임(`hitLean` 0.045) + 8px 밀림 | 색만 바뀌는 느낌. 수에 따른 차이 없음 |
| 밀림 | 늘 뒤로 8px(처치 20px), `f.tx` 보간 | 방향·세기 차이 없음, 미끄러짐 없음 |
| 흔들림 | 매 프레임 무작위 진동(`shakeX 10 × shakeT`) — 모든 명중 | 방향 없이 떨림, 자주 보면 피로 |
| 번쩍임 | 맞은 사람 `lighter` 겹침(0.45→0), 명중마다 화면 전체 플래시 0.10 / 피격 붉은 0.16 | 실루엣이 또렷하지 않고 화면 플래시가 잦음 |
| 소리 | `sword`(휘두름) · `cut`(명중) · `parry`(막음) 각 한 겹 | 재질·세기 구분 없음 |
| 빗나감 | 모두 "막음" 한 가지 | 막기·패링 구분 없음 |
| 공격자 반동 | 없음 (`a.tx = 70 → 0`) | 단단한 상대를 쳐도 손맛 없음 |
| 연격 | 필살기(베기) 3연격, 마지막만 `big` | 마지막 타의 보상이 약함 |
| 처치 | `downMs` [100,380,500,280] 착지 (10-29 정리) | 적이 쓰러질 때와 내가 쓰러질 때가 같은 연출 |

이미 있는 좋은 것 — 유지: `G.FX.duel` 조정값 모음, `settings.shake` 끄기, 빠르게 모드 절반, 마지막 일격 착지 순서와 `fallGeometry`, 컷인·호통 GIF, 피해 숫자.

---

## 1. 제안 12개 — 고른 것과 바꾼 점

| # | 제안 | 결정 | 이 게임에 맞춘 점 | 작업 |
|---|---|---|---|---|
| 1 | 히트스톱 | **채택 (최우선)** | 수·세기별 표(§3.2). 막기는 짧게, 빗나감은 없음. 빠르게 모드 ×0.6 | A |
| 2 | 맞은 자세 무너뜨리기 | **채택** | A에서 코드 변형(상단·중단·하단·강타 4갈래), C에서 전용 피격 그림 | A·C |
| 3 | 베는 방향으로 밀기 | **채택** | 수가 베기·찌르기·치기 셋이라 방향을 수로 정함. 올려베기는 필살 3연격의 3타에만 | A |
| 4 | 다층 타격음 | **채택** | 바람·접촉(재질별)·저음 3겹. 기존 `sounds/rpg` + 합성음으로 시작 | A |
| 5 | 준비/휘두름 속도차 | **채택** | 준비는 길고 읽히게, 휘두름은 40~80ms. 적의 준비 동작 = 실제로 낼 수(읽힘 시스템과 일치) | A·C |
| 6 | 명중 때만 흔들기 | **고쳐서 채택** | 지금의 무작위 진동을 *방향 있는 감쇠 스프링* 한 번으로. 일반 명중 3px — 크게는 치명·패링·처치만 | A |
| 7 | 접촉 지점에 효과 | **채택** | 무기 끝 좌표(도구로 시트에서 잼) + 수별 맞는 높이. 재질별 파편 | A·B |
| 8 | 실루엣 강조 | **고쳐서 채택** | 이미 겹침이 있음 → 첫 2장 *순백 실루엣* + 얇은 테두리로 바꿈. 화면 전체 플래시는 줄임 | A |
| 9 | 공격자 반동 | **채택** | 갑옷·막기·패링일 때만 뚜렷하게. 천·살은 칼이 지나감 | A·C |
| 10 | 명중·막기·패링 구분 | **채택 (연출만)** | 빗나감을 막기/받아넘김으로 나눔(§3.7). 판정·확률 그대로 | A |
| 11 | 연격 마지막 강조 | **좁혀서 채택** | 연격은 필살 3연격뿐 → 1·2타 가볍게, 3타 무겁게. "3합 연속 명중" 강조는 선택(기본 끔) | A |
| 12 | 처치 마무리 | **채택** | 적 처치: 버티다 쓰러짐/날아감 두 갈래 + *강적만* 짧은 슬로모션. 내가 쓰러질 때는 보상처럼 안 보이게 별도 연출 | A·C |

---

## 2. 시점별 연출 표 — 공격자·방어자 × 플레이어·적

모든 방향(밀림·흔들림·궤적·파편)은 **공격자의 `face`** 로 정한다. 적이 공격하면 같은 계산을 좌우만 뒤집는다. 값은 §3의 조정값 이름.

| 상황 | 히트스톱 | 흔들림 | 번쩍임 | 숫자 | 소리 강조 | 그 밖 |
|---|---|---|---|---|---|---|
| **내가 침 → 적 명중** | 수·세기별 (45~110ms) | 공격 방향으로 한 번 (3~7px) | 적 실루엣 순백 2장 → 페이드. 화면 플래시는 치명·연격 끝·처치만 | 금빛, 접촉점에서 솟음 | **접촉음** 크게(재질) | 적 자세 무너짐·밀림, 내 반동(갑옷이면) |
| **적이 침 → 내가 맞음** | 같은 값 (공정하게) | 세로 성분을 섞어 4px, 짧게 | 내 실루엣 옅은 붉은 흰빛 2장. 화면은 **가장자리 붉은 테(vignette)** — 전체 붉은 칠 대신 | 붉은색 | **저음 충격** 크게(맞는 몸 느낌) | 내 자세 무너짐, 큰 피격은 채도 −20% 0.15초 |
| **내가 막음** | 30ms (둘 다) | 1.5px | 없음 (불꽃만) | "막음" 청백 | 쇳소리 짧게 | 둘 다 조금 밀림(공격자 −8, 나 −4). 막기 자세는 적의 *휘두름 시작*에 올림 |
| **적이 막음** | 30ms | 1.5px | 없음 | "막음" 청백 (적 머리 위) | 같음 | 내 칼이 튕김(반동) — 단단함이 내 동작에 보임 |
| **내가 받아넘김(패링)** | 70ms | 5px | 접점에 큰 십자 섬광 + 화면 흰빛 0.18 | "받아넘김!" 금빛 큰 글씨 | 높은 금속 울림 + 꼬리 | **적 자세 크게 무너짐**(튕겨 비틀), 내 받아치기까지 틈을 줄임 |
| **적이 받아넘김** | 70ms | 5px | 같은 섬광, 화면 흰빛은 0.12 | "받아넘김!" 청백 (적 쪽) | 같음 | **내 자세가 크게 무너짐** — 다음 적 반격이 위험해 보이게 |
| **필살 3연격 1·2타** | 35ms | 2px | 실루엣만 | 작게 | 가벼운 접촉음 | 짧게 움찔, 궤적 방향 바뀜(내려→가로) |
| **필살 3연격 3타** | 110ms | 7px | 화면 0.22 | 크게 | 접촉+저음+울림 | 올려베기, 크게 밀림(위로 조금 뜸) |
| **적 처치 (내가 이김)** | 140ms | 11px | 화면 0.3 + 처치 섬광 | 크게 | 저음 길게 + 착지 쿵 + 칼 떨어지는 소리 | 버팀/날아감 → 착지. **강적이면 슬로모션 0.35배 280ms** + 2% 다가감 |
| **내가 쓰러짐 (짐)** | 100ms | 4px | 붉은 테 짙게, 채도 −50% 0.6초 | 붉은색 | 둔탁한 저음, 칼 떨어짐 | **슬로모션·처치 섬광 없음**. 적은 칼을 거두는 대기 자세 |
| **생포·설득·항복(무릎)** | 없음 | 없음 | 없음 | — | 칼 내려놓는 소리 | 기존 kneel 그대로 |

**적의 준비 동작(텔레그래프)** — 적이 칠 때 준비 구간 마지막 장에 칼날 반짝임(`glint`)을 띄운다. `intentSeen`(상대 수가 읽힘)이면 반짝임을 크게 하고 그 수의 색(베기 금·찌르기 청백·치기 주황)을 입힌다. 읽히지 않았으면 무색 작은 반짝임. **그림의 준비 자세는 반드시 실제로 내는 수와 같아야 한다** — C 시트가 있는 인물은 수별 준비 자세가 다르므로, 연출 쪽에서 `emv`와 다른 줄을 고르면 안 된다.

**같은 합의 받아치기** — `exchange()`에서 먼저 친 쪽이 막히면 바로 상대가 받아친다. 막기 뒤 대기를 300ms → 220ms, 받아넘김 뒤는 → 160ms로 줄여 "쳐내고 바로 반격"으로 읽히게 한다 (시간만, 순서·판정 그대로).

---

## 3. 작업 A — 코드 연출 (그림 없이)

건드리는 곳: `js/games/duel.js`, `js/data/seafx.js`(`G.FX.duel.impact` 추가), `js/data/duelart.js`(재질 표), `js/systems/audio.js`·`js/data/sfxfiles.js`(소리 갈래), `tests/duel_impact_smoke.js`(새).

### 3.1 조정값 (`G.FX.duel.impact` — 기존 키는 그대로 두고 아래를 더한다)

```js
impact: {
  hitstop:  { light: 45, adv: 60, heavy: 90, comboHit: 35, comboEnd: 110, ko: 140, koMe: 100, block: 30, parry: 70 }, // ms
  fastHitstop: 0.6,                       // 빠르게 모드에서 히트스톱 배율 (다른 시간은 기존처럼 0.5)
  slowmo:   { scale: 0.35, ms: 280, zoom: 0.02 },   // 강적 처치 때만
  timing: {                               // ms — 준비(읽히게) · 휘두름(빠르게) · 이어짐 · 회수
    slash:  { wind: 200, swing: 70, follow: 90,  recover: 140 },
    thrust: { wind: 260, swing: 45, follow: 80,  recover: 160 },
    bash:   { wind: 300, swing: 80, follow: 110, recover: 180, peakHold: 60 },
    windPull: 12                          // 준비 때 뒤로 당기는 거리(px)
  },
  shake:    { light: 3, adv: 4, heavy: 7, ko: 11, koMe: 4, block: 1.5, parry: 5, taken: 4, max: 12, freq: 28, damp: 18 }, // px · Hz · 1/초
  knock: {                                // [보통, 강, 처치] px — 방향은 공격자 face
    slash:  { dx: [10, 26, 40], dy: [0, 0, -4],  rot: 0.07 },
    thrust: { dx: [14, 34, 50], dy: [0, 0, 0],   rot: -0.04, fold: 0.03 },
    bash:   { dx: [6, 14, 24],  dy: [5, 8, 0],   rot: 0.03, squash: 0.08 },
    rise:   { dx: [18, 30, 46], dy: [-10, -14, -18], rot: 0.09 },   // 올려베기 (3연격 3타)
    fastPart: 0.7, fastMs: 60, slideMs: 220, returnMs: 260   // 밀림의 70%를 60ms에, 나머지는 미끄러지며 220ms
  },
  recoil:   { armor: 6, block: 8, parried: 26, parriedMs: 320, defBlock: 4 },  // 공격자·방어자 반동 px
  flash:    { whiteMs: 40, fadeMs: 120, me: '255,214,204', foe: '255,255,255', outline: 2, screenMinGap: 330,
              screenCrit: 0.18, screenParry: 0.18, screenComboEnd: 0.22, screenKo: 0.3, vignetteTaken: 0.22, vignetteKoMe: 0.45 },
  contact:  { slash: 0.60, thrust: 0.50, bash: 0.80, rise: 0.66, jitter: 6 },   // 맞는 높이 (대기 키에 대한 비율, 발에서 위로)
  gapAfter: { block: 220, parry: 160 },  // 받아치기 전 대기(ms)
  streak:   { on: false, n: 3 },         // 선택: 같은 쪽이 n합 연속 명중하면 n번째를 heavy로
  fxCap: 300
}
```

모든 수치는 처음 값이다. 실제 화면을 보고 사용자와 맞춘다 — 하드코딩 금지, 반드시 이 표에서 읽는다.

### 3.2 히트스톱 (제안 1)

- `draw()`에 `freeze`(ms)와 `timeScale`을 둔다.
  `var sdt = freeze > 0 ? 0 : dt * timeScale;` — **포즈 진행(`f.pt`·`f.poseT`), 밀림 보간, 효과 나이는 `sdt`**, 흔들림·번쩍임·테두리 감쇠는 실제 `dt`로. 히트스톱 동안 화면은 흔들리지만 몸은 멈춰 있어야 한다.
- `async function hitstop(ms)` — `freeze = max(freeze, ms)` 후 실제 시간만큼 기다린다(빠르게 모드는 `fastHitstop` 배율, 기존 `sleep`의 0.5배와 따로).
- 같은 0.12초 안에 두 번 멈추지 않는다(해전 `st.hitstop`과 같은 규칙).
- 값 고르기: `opts.combo`면 `comboHit`/`comboEnd`, 처치면 `ko`(내가 쓰러지면 `koMe`), 치명·`opts.big`이면 `heavy`, 상성 이김(`adv > 0`)이면 `adv`, 그 밖 `light`. 막기 `block`, 받아넘김 `parry`, **빗나감은 0**.
- 섬광 첫 장은 히트스톱 동안 보이고, 파편·숫자는 히트스톱이 풀리는 순간 튄다(터지는 느낌).

### 3.3 준비/휘두름 속도 (제안 5) — `strike()` 다시 짜기

지금 `pose(a,'windup',0.18) → sleep(170) → pose(a,'lunge',0.3) → sleep(140) → 판정`을 다섯 구간으로:

```
판정을 맨 앞으로: ok·dmg·crit·결과종류(hit/block/parry)를 지금과 같은 확률식·같은 호출 순서로 먼저 계산
1 준비   wind ms    공격 줄 0→1칸, 감속(ease-out). a.x를 −windPull 당김. (적이면 마지막 장에 glint)
         · 방어자 결과가 막기·받아넘김이면 이 구간 끝에 방어 줄 0칸(가드 올림)으로 미리 들어감
         · 치기는 1칸에서 peakHold ms 정지
2 휘두름 swing ms   2칸(스미어). a.x → 70, 가속(ease-in). 바람 소리·궤적 시작
3 접촉   hitstop    3칸 고정. 방어자 첫 피격/막기 칸 고정 + 실루엣. 접촉음+저음, 흔들림 시작
4 이어짐 follow ms  4칸. 밀림·자세 무너짐·파편·숫자
5 회수   recover ms 5칸, a.x → 0 (반동이 있으면 반동 뒤)
```

- 판정을 앞당겨도 `U.chance`·`U.rf` 호출 순서와 횟수는 지금과 같게. `test_duel_sim`류 승률이 바뀌면 안 된다.
- `spriteFrame()`은 `f.pose`/`f.pt` 대신 위 구간 이름(`wind`/`swing`/`contact`/`follow`/`recover`)으로 칸을 고른다. C 시트가 있으면 `f.move`에 맞는 줄, 없으면 기존 공격 줄(0행).
- 기존 `windup`/`lunge`를 쓰는 다른 곳(거짓퇴각 헛침 등)은 그대로 둬도 되게 이름을 남긴다.

### 3.4 흔들림 (제안 6)

- 명중·패링·처치의 흔들림은 **감쇠 스프링 한 번**: `off = A · dir · e^(−damp·t) · cos(2π·freq·t)`.
  `dir` = 공격자 → 피격자 방향(x), 치기는 아래(+y) 성분 0.5, 내가 맞으면 y 성분 0.4. 여러 개가 겹치면 더하고 `max`로 자른다.
- 기존 무작위 `shakeT` 진동은 **호통·필살 컷인용으로만** 남긴다(`strike()`에서는 쓰지 않음).
- `settings.shake === false`면 0. 설정이 아직 없고 `prefers-reduced-motion`이면 기본 끔 — `js/art/quakefx.js` 84~86줄과 같은 규칙으로.

### 3.5 실루엣 강조 (제안 8)

- 피격 순간 `whiteMs` 동안 그 칸을 **한 가지 색으로 채운 실루엣**(오프스크린 캔버스 하나를 재사용: 칸을 그리고 `source-atop`으로 색 채움)으로 그리고, 이어 `fadeMs` 동안 원래 그림 위에 `lighter`로 옅어지게.
- 같은 실루엣을 `outline` px씩 8방향으로 어긋나게 먼저 그려 얇은 밝은 테두리(작은 화면·복잡한 갑판 배경에서도 보이게). 피격 중에만 그린다.
- 화면 전체 플래시는 치명·받아넘김·연격 끝·처치에만. 서로 `screenMinGap` ms 안에 다시 터지지 않게(광과민 보호 — 초당 3번 넘지 않음).
- 내가 맞을 때는 전체 붉은 칠 대신 가장자리 붉은 테(방사형 그라디언트).

### 3.6 접촉 지점 (제안 7)

`contactPoint(a, b, mv, kind)`:
1. C의 `G.DUEL_ART.contact[a.spriteId][row][3]`(무기 끝 칸 좌표)가 있으면 화면 좌표로 바꾼 뒤, x를 방어자 몸 앞쪽 띠(앞 가장자리 −10 ~ +30px)로 자른다.
2. 없으면 추정: 방어자 앞 가장자리 = `posX(b) + b.x·faceB − faceB·0.16·그림폭`, y = `gy − contact[mv] × 대기 키`(대기 키는 `fallGeometry`의 대기 높이, 없으면 `spriteSize`×0.9), ±`jitter`.
3. 막기·받아넘김은 두 칼이 만나는 곳: 방어자 앞 가장자리 −12px, 높이 0.65.
- 불꽃·파편·궤적 끝·피해 숫자(그 점에서 위로 솟음)를 모두 이 점에서 낸다. 지금의 고정 `hx`, `gy−110`은 없앤다.

재질(`G.DUEL_ART.material`, duelart.js에 새 표) — 접촉 효과·소리를 고른다:

| 재질 | 효과 | 초안 (Codex가 그림을 보고 확정) |
|---|---|---|
| `cloth` 천·맨몸 | 가는 흰 베임 선 + 짙은 붉은 *먹 방울* 소량(사실적 피·상처 그리지 않음) | 기본값 |
| `leather` 가죽 | 베임 선 + 갈색 가루 | first_mate, caribbean_pirate, african_warrior, native_chief … |
| `armor` 금속 | 주황·흰 불티 + 금속 조각 빛 | cortes, spanish_soldier, samurai, guan_yu, zhang_fei, armored_navigator, battle_vanguard |
| `shield: true` | 막기·받아넘김 때 나뭇조각·가죽 조각 | cortes(버클러), african_warrior, mesoamerican_warrior |

플레이어·동료는 장착한 방어구(`items.js` kind `armor`)로 덮어쓴다 — 가죽 갑옷이면 `leather`, 판금류면 `armor`.

### 3.7 명중·막기·받아넘김 구분 (제안 10) — 연출 분류만

`strike()`에서 `ok === false`일 때:
- **받아넘김(parry)** = 방어자의 이번 수가 공격자의 수를 이김(`advOf(b.move, mv) > 0`) **또는** `b.sword − a.sword ≥ 2`.
- 그 밖은 **막기(block)**.
- 기세 +6 등 기존 규칙은 둘 다 같다. 받아넘김에 규칙상 보너스를 주고 싶어지면 `G.BALANCE.duelParry = { spirit: 0 }`처럼 **기본 0**인 자리만 만들어 두고 켜지 않는다(사용자 결정).

| | 명중 | 막기 | 받아넘김 |
|---|---|---|---|
| 그림 | 방어자 피격 자세 | 방어 줄 2칸(충격 받음) 고정 | 방어자: C의 패링 줄, 없으면 방어 줄 2→3을 빠르게 + 앞으로 10px. 공격자: C의 튕김 줄, 없으면 피격 기울기를 반대로 + 뒤로 `recoil.parried` |
| 효과 | 재질별 접촉 효과 | 작은 금속 불꽃 | 큰 십자 섬광 + 불꽃 비 |
| 소리 | 접촉+저음 | 짧은 쇳소리 | 높은 울림 + 긴 꼬리 |
| 글자 | 피해 숫자 | "막음" | "받아넘김!" |

### 3.8 밀어내기·자세 무너뜨리기 (제안 2·3)

- 공격자의 돌진(`f.tx`)과 섞이지 않게 **밀림 전용 상태** `f.kx, f.ky, f.rot, f.sq`를 둔다. 그림은 발밑 피벗을 기준으로 `translate(kx,ky) → rotate(rot) → scale(1+sq·0.4, 1−sq)` 순서로.
- 세기: 보통 / 강(치명·`big`·상성 이김) / 처치 — `knock[수].dx[0|1|2]`. 강하면 `fastPart`를 `fastMs`에 밀고 나머지는 `slideMs` 동안 마찰로 미끄러짐 + 발밑 먼지 2~3덩이.
- 수별 피격 갈래(코드 변형, C 그림이 오면 그 줄로 바꾸고 변형은 절반으로):

| 수 | 피격 갈래 | 몸 | 밀림 |
|---|---|---|---|
| 베기 | 상단 `high` | 상체가 뒤로 젖혀짐(`rot`) + 기울임 | 옆으로 |
| 찌르기 | 중단 `mid` | 허리가 꺾여 앞으로 숙음(`fold` — 반대 방향 기울임 + 세로 0.97) | 곧장 뒤로, 길게 미끄러짐 |
| 치기 | 하단 `low` | 무릎이 내려감(`squash` 세로 줄임 + 아래로) | 짧게 뒤로 + 아래로 |
| 올려베기 | `rise` | 젖혀지며 살짝 뜸 → 떨어짐 | 뒤·위로 |

- 지금처럼 일반 피격에 누운 그림·무릎 그림이 나오면 안 된다(10-29 결정 유지).

### 3.9 공격자 반동 (제안 9)

- 피격자 재질이 `armor`이거나 결과가 막기면: 접촉 칸에서 히트스톱 뒤 공격자 `kx = −recoil.armor|block`, `rot`을 뒤로 0.03, 그다음 이어짐 칸.
- 받아넘김당함: `recoil.parried` px 뒤로 + `parriedMs` 동안 비틀(C 튕김 줄 또는 코드 변형). 이때 머리 위 "!" 정도만, 글자 남발 금지.
- 천·가죽 명중은 반동 없이 이어짐 칸을 그대로 지나감 — 차이가 곧 손맛이다.

### 3.10 연격 마지막 (제안 11)

- 필살기 베기 3연격(`id === 'special'`, `f.style === 'slash'`) 호출에 `opts.combo = { i: h3, n: 3 }`를 넘긴다.
- 1타 내려베기 → 2타 가로베기 → 3타 올려베기(`rise`). 궤적 방향도 그에 맞게.
- 1·2타: `comboHit` 히트스톱, 흔들림 2px, 작은 밀림, 가벼운 접촉음. 3타: `comboEnd`, 화면 `screenComboEnd`, 강 밀림, 접촉+저음+울림, 큰 숫자.
- 선택: `streak.on`이면 같은 쪽이 `n`합 연속 명중한 `n`번째 타를 heavy로(기본 끔).

### 3.11 처치 (제안 12)

- **강적** = `legendId(en)` 이거나 `en.look === 'rival'` 이거나 `power(en) >= power(me) × 1.1` 또는 해전에서 `st.npc.boss`가 있는 이름난 적장(`enemy.duelBoss`). 일반 해적 두목·함장은 같은 무력 기준을 따른다.
- **적 처치 — 두 갈래**
  - *버티다 쓰러짐*: 베기·찌르기의 보통 처치. 피격 자세로 160ms 버팀(1px 떨림, 칼끝이 처짐) → 기존 `down` 순서.
  - *날아감*: 치기·`big`·일격필살·필살기 처치. `knock.dx[2]`만큼 밀리며 포물선으로 6~10px 떴다(260ms, 코드로 — 공중 그림을 새로 만들지 않음) → 착지 순간 먼지·쿵·흔들림 4px → 기존 누운 그림.
  - 강적이면 히트스톱 뒤 `slowmo.scale`로 `slowmo.ms` 동안 느리게 + 화면 `zoom`만큼 다가감 + 배경 채도 −30%. 빠르게 모드에서는 슬로모션 시간도 절반.
- **내가 쓰러짐(교체 동료 포함)**: 슬로모션·처치 섬광 없음. `koMe` 히트스톱, 붉은 테 `vignetteKoMe`, 채도 −50% 0.6초, 둔탁한 저음과 칼 떨어지는 소리. 적은 기존 대기 자세로 칼을 거둠.
- `hitDuration()`·결과창 닫히는 시점에 버팀·날아감·슬로모션 시간을 더해, 착지가 끝나기 전에 닫히지 않게(10-29 규칙 유지).

### 3.12 소리 (제안 4)

새 소리 갈래를 `audio.js`의 `AU.SFX`/`SAMPLE_FALLBACK` 방식 그대로 더한다(파일이 없으면 기존 `sword`로 떨어지게).

| 층 | 언제 | 베기 | 찌르기 | 치기 |
|---|---|---|---|---|
| 바람 `swing*` | 휘두름 시작(준비 때가 아님) | `knifeSlice` + 합성 넓은 쉭(띠 잡음 1.8kHz 120ms) | 짧은 쉭(고역 잡음 4kHz 60ms) | 낮은 붕(저역 잡음 800Hz 180ms) |
| 접촉 `hit*` | 히트스톱 첫 순간 | 재질별 — `cloth` `chop`+`knifeSlice2`(저역) · `leather` `chop`+`dropLeather` · `armor` `metalPot` 1.1~1.3배 + `metalClick` · 방패 `creak`/`dropLeather`+`chop` | | |
| 저음 `thud` | 접촉과 함께 | 합성 사인 110→45Hz 0.14초 (보통 0.25 · 강 0.45 · 처치 0.6, 처치는 저역 잡음 300Hz 0.25초 더) | | |
| 막기 `block` | | `metalPot` 1.3~1.5배 (지금 `parry`) | | |
| 받아넘김 `parry` | | `metalPot` 1.6배 + 사인 2780/3720Hz 0.5초 감쇠 + `metalLatch` | | |
| 마무리 | 처치 착지 | `footstep` + 저음 / 칼 떨어짐 `metalClick` | | |

- 높낮이 ±6% 무작위, 같은 층은 80ms 안에 겹쳐 내지 않는다.
- 내가 맞을 때는 저음을, 적이 맞을 때는 접촉음을 조금 더 크게(+2dB 정도).
- 소리를 더 넣고 싶으면 CC0 묶음(예: Kenney Impact Sounds)을 `sounds/impact/`에 라이선스와 함께. 넣지 않아도 위 합성으로 끝까지 되게.

### 3.13 그 밖

- 효과가 `fxCap`을 넘으면 파편부터 줄인다. `num`/`bubble` 그리기마다 부르는 `getComputedStyle(document.body).fontFamily`는 한 번만 읽어 둔다.
- 그림 없는 사람(`drawFighter` 코드 그림)도 밀림·실루엣·히트스톱은 똑같이 받게.
- 시험용으로 `G.Games.duelDebug = { events: [] }`가 있으면 연출 사건(hitstop·shake·kind·contact 좌표)을 쌓는다.

---

## 4. 작업 B — 공용 효과 그림 (인물과 상관없음)

자리: `images/duel/fx/`. 규격 표는 `js/data/duelart.js`에 `fx: { 이름: { file, frames, cell:[w,h], pivot:[x,y], ms:[…], blend } }`로.
그림이 없으면 A의 코드 효과(호·선·원)로 그린다.

**만드는 법** — 빛나는 것(궤적·섬광·불티)은 **절차적으로 굽는 것을 우선**한다: `tools/procedural_art/`의 기존 방식(헤드리스 Chromium으로 캔버스를 굽는 `run_*.js`)으로 `fx/duel_fx.js`를 만들어 PNG로. 색·두께를 나중에 바꾸기 쉽고 장면마다 모양이 정확하다. 붓맛이 필요한 것(먹 방울·먹 섬광·먼지)만 ImageGen.
빛나는 그림을 검은 배경에서 만들었다면 `tools/duel_fx_prep.py`(새)로 알파를 만든다: `alpha = max(r,g,b)`, `rgb = rgb/alpha` — 그리고 `lighter`로 그린다.

| 파일 | 칸 | 장 | 시간(ms) | 섞기 | 내용 |
|---|---|---:|---|---|---|
| `trail_slash_down.png` | 512×512 | 5 | 30,30,40,50,60 | lighter | 내려베기 초승달 궤적. 뒤 위 → 앞 아래. 흰 심 + 옅은 금빛 가장자리, 끝이 가늘어지며 사라짐 |
| `trail_slash_flat.png` | 512×512 | 5 | 같음 | lighter | 가로베기 (3연격 2타) |
| `trail_slash_up.png` | 512×512 | 5 | 같음 | lighter | 올려베기 (3연격 3타) — 가장 굵게 |
| `trail_thrust.png` | 512×256 | 4 | 25,30,45,60 | lighter | 일직선 찌르기 줄기 + 끝의 작은 별빛 |
| `trail_bash.png` | 512×512 | 5 | 35,35,45,55,70 | lighter | 무거운 내려치기 넓은 호 + 공기 일그러짐 띠 |
| `trail_heavy.png` | 640×512 | 5 | 40,40,50,60,80 | lighter | 장병기(언월도·장팔사모·클레이모어·양손 팔시온)용 넓고 긴 호 |
| `impact_cut.png` | 256×256 | 6 | 20,30,40,50,60,70 | lighter | 베임: 가는 흰 섬광 선 + 접점 빛 |
| `impact_pierce.png` | 256×256 | 6 | 같음 | lighter | 찌름: 별 모양 방사 + 뒤로 튀는 짧은 줄 |
| `impact_blunt.png` | 256×256 | 6 | 같음 | normal | 둔격: 둥근 충격파 고리 + 먼지 |
| `clash_block.png` | 256×256 | 5 | 20,30,40,50,60 | lighter | 막기: 작은 금속 불꽃 |
| `clash_parry.png` | 384×384 | 8 | 20,25,30,40,50,60,70,80 | lighter | 받아넘김: 큰 십자 섬광 + 사방 불꽃 비 |
| `ink_drops.png` | 256×256 | 5 | 30,40,50,60,80 | normal | `cloth` 명중: 짙은 붉은 *먹 방울* 몇 점(피·상처 묘사 없음, 설정으로 끌 수 있게) |
| `debris_atlas.png` | 64×64 | 12 | — | normal | 낱개 조각 아틀라스: 금속 조각 4 · 나뭇조각 4 · 가죽 조각 4 (코드가 던짐) |
| `dust_feet.png` | 256×128 | 6 | 40,50,60,70,80,90 | normal | 발밑 먼지(미끄러짐·착지). 갑판용은 물보라 섞인 변형 `dust_deck.png` |
| `ko_burst.png` | 512×512 | 6 | 30,40,50,70,90,120 | lighter | 처치 섬광: 금빛 방사 + 먹빛 테 |
| `glint.png` | 128×128 | 4 | 40,40,60,80 | lighter | 칼날 반짝임(적의 준비 동작). 코드가 수의 색으로 물들임 |

**동아시아 먹 변형(선택, B 끝에)** — `trail_*_ink.png`, `ko_burst_ink.png`: 붓 획 궤적. `guan_yu`·`zhang_fei`·`joseon_swordsman`·`samurai`·`east_asian_attendant`에 쓴다(컷인의 지역 화풍과 맞춤). 표에 `inkFor: [...]`.

ImageGen 공통 프롬프트(붓맛 그림만):
```text
Use case: game VFX sprite strip
Asset type: transparent 2D combat hit-effect animation strip PNG, <N> equal cells in one row, cell <W>×<H>
Primary request: <내용 — 예: a few small dark-crimson ink droplets bursting outward from one contact point, painterly brush texture>
Style: matches a hand-painted semi-realistic historical adventure RPG; restrained, readable at small size; no gore, no wounds, no body parts.
Composition: effect origin at the exact same pivot in every cell (<px>,<py>); frames progress burst → spread → fade; generous transparent padding; nothing touches cell edges.
Constraints: genuine alpha transparency; effect only — no character, weapon, ground, text, numbers, grid, border, watermark.
```

---

## 5. 작업 C — 인물별 추가 동작 시트

기존 시트(공격·방어·피격·행동 4줄)는 그대로 두고, **인물마다 두 장을 더한다**. 없으면 A의 코드 변형으로 그린다(인물마다 있는 것만 쓰는 부분 적용).

- 자리: `images/duel/fighters_ext/<id>_atk.png`, `<id>_react.png`
- 만드는 규격(원본) = 기존과 같음: 1536×1024, 6×4, 칸 256, 피벗 (128, 246). **오른쪽을 봄.**
- 게임 규격: `python tools/duel_repack.py`로 2592×1216, 칸 432×304, 피벗 (165, 278). `--check` 문제 0.
- 무기 끝 좌표: `tools/duel_contact_points.py`(새) — 각 공격 줄의 1칸(준비 끝, `glint` 자리)과 3칸(접촉)에서 얼굴 쪽 반대편이 아닌 *진행 방향* 끝의 불투명 덩어리(무기 띠, 몸통 덩어리와 분리)를 찾아 칸 좌표를 `G.DUEL_ART.contact`에 기록. `fallGeometry`처럼 `--check` 제공. 기존 시트의 공격 줄(0행)도 같이 잰다 → A의 3.6이 C 없이도 정확해진다.

### 5.1 `<id>_atk.png` — 공격 갈래

| 행 | 동작 | 6칸 (왼→오) | 권장 시간(ms) |
|---|---|---|---|
| 0 | **베기** (내려베기) | 칼을 어깨 뒤로 → 최대로 당겨 몸을 비틂 → 휘두름(칼날 스미어 허용) → **접촉**: 팔이 뻗고 칼날이 몸 앞 가슴 높이 → 칼이 반대편 아래로 지나감 → 회수 | 110, 90, 70, 히트스톱, 90, 140 |
| 1 | **찌르기** | 칼을 허리 뒤로 당김 → 앞발을 듦(웅크림) → 뒷발로 밀며 돌진 → **접촉**: 팔·칼이 수평으로 완전히 뻗음, 칼끝 가슴 높이 → 뻗은 채 버팀 → 회수 | 140, 120, 45, 히트스톱, 80, 160 |
| 2 | **치기** | 무기를 머리 위로 → 정점(몸이 살짝 뒤로 젖혀짐, 잠깐 멈출 자리) → 내려치기 시작 → **접촉**: 어깨 높이로 내려침, 무릎 굽힘 → 무기가 아래로, 낮은 자세 → 회수 | 150, 150(+60 정지), 80, 히트스톱, 110, 180 |
| 3 | 연격·반동 | 0~2 **올려베기**: 낮은 자세 → **접촉**(칼이 아래에서 위로, 가슴 높이) → 칼이 머리 위로 / 3~5 **튕겨남**: 갑옷·패링에 칼이 튕겨 팔이 뒤로 젖혀짐 → 한 발 물러나 비틂 → 다시 자세 | 60, 히트스톱, 120 / 80, 140, 100 |

무기 갈래별 해석(인물 명세에 덧붙임):
- **한손 칼**(세이버·커틀러스·아밍 소드·팔시온 등 대부분): 위 그대로.
- **레이피어**(cortes·d_artagnan·athos·aramis): 찌르기가 가장 길고 곧게. *치기*는 손잡이·코등이로 내려치는 근접 타격.
- **장병기**(guan_yu 언월도·zhang_fei 장팔사모): 찌르기 = 창끝 뻗기, 베기 = 크게 휘두르는 호, 치기 = 자루째 내려침. 무기 길이 때문에 칸을 넘기 쉬우니 원본에서 몸을 칸 왼쪽에 두고 앞쪽 여백을 크게. (zhang_fei 기존 흠 — 창끝이 다음 장면에 겹침 — 을 되풀이하지 않게 장면 사이 여백 필수)
- **양손 무기**(western_brawler 팔시온·muscle_swordsman 등): 치기가 가장 무겁게, 준비 동작을 크게.
- **여성 전투원**(redhair·blonde·east_asian_attendant·vietnamese_woman): 같은 동작, 날렵하게. 노출·자세를 과장하지 않는다.

### 5.2 `<id>_react.png` — 피격·방어 갈래

| 행 | 동작 (3칸 + 3칸) | 권장 시간(ms) |
|---|---|---|
| 0 | **피격 상단**(머리·상체가 뒤로 젖혀짐 → 버팀 → 복귀) · **피격 중단**(허리가 꺾여 앞으로 숙음 → 버팀 → 복귀) | 히트스톱, 110, 120 |
| 1 | **강타 무릎 꺾임**(한쪽 무릎이 내려감 → 가장 낮음 → 일어섬) · **밀려 미끄러짐**(몸이 뒤로 기울고 두 발이 바닥에 끌림 → 버팀 → 복귀) | 히트스톱, 140, 160 |
| 2 | **받아넘김**(칼로 상대 칼을 바깥으로 쳐냄 → 칼이 바깥으로 → 반격 자세) · **가드 깨짐**(막았지만 팔이 벌어지고 몸이 열림 → 비틂 → 복귀) | 히트스톱, 90, 120 / 히트스톱, 160, 140 |
| 3 | **처치 버팀**(맞은 뒤 휘청하며 칼끝이 처짐 → 무릎이 풀림 → 쓰러지기 직전) · **비켜섬**(몸을 옆으로 빼며 피함 — 지금은 안 씀, 다음 「회피」 연출 자리) | 160, 120, 100 / 80, 100, 120 |

- 처치 버팀 3칸째 뒤에는 기존 시트의 피격 마지막(누운 그림)으로 이어진다 — `fallGeometry` 순서 그대로.
- **공중 자세·두 발이 뜬 자세는 그리지 않는다**(10-28 교훈 — 생성기가 공중 자세를 망가뜨림). 날아감·뜸은 코드가 한다.

### 5.3 프롬프트 (기존 `images/duel/PROMPTS.md` 전투원 공통 프롬프트를 바탕으로)

```text
Use case: stylized-concept
Asset type: production-ready transparent 2D game combat sprite sheet PNG (extension sheet)
Input images: Image 1 is the style and atlas-layout reference (main_admiral sheet). Image 2 is THIS character's existing duel sheet — preserve the exact face, hair, costume colors, silhouette, proportions, scale and weapon from Image 2.
Primary request: Create the <ATTACK | REACTION> extension sheet for the same character. The character faces screen-right in every frame.
Style/medium: identical to Image 2 — hand-painted semi-realistic 2D game sprite, crisp cutout edges, restrained painterly shading, same lighting and camera.
Composition/framing: exactly 6 equal columns by 4 equal rows, equal scale in every frame and identical to Image 2's scale. Every foot contact point on the same baseline near the cell bottom; pivot centered between the feet. No airborne poses — at least one foot always on the baseline. Keep the body in the left-center of each cell and leave wide empty space on the right for the weapon; the weapon never crosses into the next cell.
Rows: <§5.1 또는 §5.2의 행 설명을 영어로 그대로>
Weapon handling: <§5.1 무기 갈래 한 줄>
Constraints: genuine alpha transparency; no backdrop, floor, shadow, grid, borders, labels, text, numbers, watermark, extra people or extra limbs. Do not merge poses. Contact frames must show the weapon fully extended and clearly readable.
Subject: <PROMPTS.md 표의 인물 명세 그대로>
```

### 5.4 만드는 순서 (37명 × 2장 = 74장 — 한 번에 하지 않는다)

1. **시범 2명**: `main_admiral` + `caribbean_pirate`(가장 자주 만나는 적). 게임 안 화면·GIF로 사용자 확인을 받는다. 여기서 시간·칸 구성이 확정되면 나머지 진행.
2. **자주 보이는 쪽**: `first_mate`, `barbary_corsair`, `spanish_soldier`, `samurai`, `western_brawler`, `explorer`.
3. **제독 생김새 13종**: `ganghui`, `navigator_white`, `armored_navigator`, `sea_dog`, `muscle_swordsman`, `hat_spinner`, `charismatic_admiral`, `battle_vanguard`, `noble_scholar`, `casanova`, `army_officer`, `sky_adventurer`, `blackcoat_captain`.
4. **나머지**: 전설 5명(`guan_yu`·`zhang_fei`·`d_artagnan`·`athos`·`aramis`), 문화권 전사·여성 전투원, `columbus`·`cortes`.

- 원본은 `images/_extra/duel_fighters_ext_src/`(gitignore), 원화·프롬프트·검증은 `docs/art/duel-impact-<날짜>.md`에.
- 받는 즉시 `tools/images.py`로 `images/manifest.js` 갱신. 시트는 필요할 때 읽게(`I.load`) — 일기토를 열 때 두 인물 것만.
- 아티팩트 묶음: `tools/bundle.py`·`slim.py`의 크기 규칙을 확인하고, 넘치면 `duel/fighters` 처럼 `FLOOR`를 주거나 따로 파일로 빼서 필요할 때 읽게.

---

## 6. 시험·완료 기준

새 `tests/duel_impact_smoke.js` (실제 `file://` 게임, 시간을 손으로 넘겨 프레임을 찍음):
- 적 명중 → `light` 히트스톱 동안 두 사람 `pt`가 멈추고 흔들림은 움직임. 흔들림 첫 방향 부호 = 공격 방향.
- 찌르기·베기·치기 각각 접촉 좌표가 방어자 몸 앞 띠 안, 높이 순서 치기 > 베기 > 찌르기.
- 수별 밀림 방향·크기, 강 공격은 미끄러짐(밀림이 두 단계).
- 막기 / 받아넘김 분류가 규칙대로, 받아넘김에서 공격자 반동 ≥ `recoil.parried`의 80%.
- 3연격 3타 히트스톱 > 1·2타, 3타에만 화면 플래시.
- 강적 처치 → 슬로모션 사건 1번, 보통 적 처치 → 없음, 내가 쓰러짐 → 슬로모션·처치 섬광 없음, 붉은 테 있음.
- `settings.shake = false` → 흔들림 0·화면 플래시 0 (히트스톱·실루엣은 남음). 빠르게 모드 → 전체 합 시간이 보통의 55~65%.
- 화면 플래시 사이 간격 ≥ `screenMinGap`.
- 콘솔 오류 0, 브라우저는 `finally`에서 닫음.

함께 통과해야 할 기존 시험: `tests/duel_assets_smoke.js`, `duel_motion_smoke.js`, `duel_finishers_smoke.js`, `tomb_duel_smoke.js`, 일기토 승률 시뮬레이션(있는 것 모두 — **승률·평균 합 수가 바뀌면 실패**), `python tools/duel_repack.py --check images/duel/fighters`(C면 `fighters_ext`도), `python tools/duel_fall_geometry.py --check`.

검토용 자료(사용자가 볼 것): `docs/art/duel-impact-<날짜>/`에 베기·찌르기·치기 명중의 접촉 프레임, 막기, 받아넘김, 3연격, 보통 처치, 강적 처치, 내 패배 — 각 짧은 GIF와 접촉 순간 PNG. 갑판·술집 배경 둘 다.

---

## 7. 연결 지점 요약 (`js/games/duel.js`)

| 지금 | 할 일 |
|---|---|
| `duelFx()` 기본값 (16~20줄) | `impact` 기본값도 같이 (seafx.js가 없을 때) |
| `spriteFrame()` (293줄~) | 구간 이름·수별 줄·C 시트 선택 |
| `drawSpriteFighter()` (354줄~) | 밀림·회전·눌림 변형, 실루엣·테두리, C 시트 그리기 |
| `draw()` (450줄~) | `freeze`/`timeScale`/`sdt`, 스프링 흔들림, 붉은 테·채도, 새 효과 종류 |
| `hurt()` (488줄~) | 피격 갈래·세기, 밀림 상태, 숫자 위치 = 접촉점, 화면 플래시 조건 |
| `strike()` (517줄~) | 판정 앞당김(순서 유지) → 다섯 구간, 결과 종류 hit/block/parry, 반동, 히트스톱 |
| `exchange()` (563줄~) | 받아치기 전 대기 `gapAfter` |
| `special` 3연격 (694줄) | `opts.combo` |
| 처치·결과 처리 | 강적 판정, 버팀/날아감, 슬로모션, 내 패배 연출, 닫는 시점 |

완료되면 `docs/codex/README.md` 표의 08 줄을 「완료」로 바꾸고, `images/duel/README.md`의 「타격 효과 연결」 절에 새 조정값·효과 파일을 적는다.
