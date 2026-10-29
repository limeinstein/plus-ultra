# 일기토 크기와 피격 착지

> 2026-10-29 보정: 아래의 일반 피격 3장 연속 재생은 폐기했다. 일반 피격은 서서 짧게 움찔하며,
> 패배할 때만 기존 원화 사이를 부드럽게 이어 바닥으로 내려앉는다. 현재 동작·조정값·시험은
> [일반 피격과 패배 착지 분리](duel-recoil-2026-10-29.md)를 따른다.

아토스·아라미스는 대기 그림의 높이가 각각 302px·292px로, 달타냥 204px와 일반 전투원 약 230px보다 컸다.
공격 중 칼끝과 장화도 옆·아래 칸에 걸쳐 있었다. 시트 전체에서 몸통을 씨앗으로 픽셀을 분리한 뒤,
sprite-gen 3.5.0의 `curate.curation.apply_transform`으로 모든 동작에 같은 배율을 적용했다.
아토스 배율은 0.644195, 아라미스는 0.661538이다. 가장 긴 칼끝까지 칸 안에 보존하는 제약을 함께 적용했다.
칸은 기존 432×304, 시트는 2592×1216, 발밑 기준은 (165, 278) 그대로다.

피격의 세 번째 그림은 37명 모두 새로 그렸다. 선 자세를 통째로 돌리면 외투·다리가 공중에 남아,
ImageGen으로 머리·몸·다리·외투가 바닥에 누운 별도 원화를 만들었다. 각 인물의 기존 얼굴·복식·무기를 참조했다.
sprite-gen `slice-sheet`가 투명 알파를 보존하며 추출하고, `apply_transform`이 등신과 바닥 위치를 맞춘다.
누운 그림의 머리~발끝 길이는 각 대기 자세 높이의 1.2배다. 아토스·아라미스 외 35명은 마지막 피격 칸 이외의
모든 RGBA 픽셀이 작업 전과 같음을 확인했다.

피격은 70ms 충격 → 110ms 몸 숙임 → 300ms 착지다. `duel.js`는 메타데이터의 시간을 실제로 사용한다.
일반 피격은 대기로 복귀하고, 체력이 0이면 곧바로 `down`을 재생해 마지막 자세를 유지한다.
승패 판정에서 이미 쓰러진 사람의 재생을 처음부터 다시 시작하지 않는다. 빠르게 모드는 시간도 절반이다.
시트에 구운 착지 그림은 화면에서 추가로 회전하지 않는다. 무릎 꿇는 생포·설득은 기존 두 번째 칸을 쓴다.

## 원화와 프롬프트

`artifacts/duel-motion-20261028/source/`에 투명 PNG 원화 5장과 인물 순서 `groups.json`을 보관한다.
`fall-fix`는 달타냥·탐험가·부관·이강희의 복식과 인물을 다시 맞춘 2×2 원화이며 앞선 같은 인물 칸을 대체한다.
참조는 작업 전 각 인물의 대기·첫 피격 그림이다. 주요 생성 지시는 다음과 같다.

> Create a transparent 2 columns × 5 rows game sprite sheet, one character per cell in the reference order.
> Preserve each character's face, hair, hat, clothes, colors, weapons and detailed historical painted sprite style.
> Redraw the final knocked-down pose fully lying flat on back or side, head left and feet right, torso and thighs horizontal,
> head/back/cloak/legs resting on one invisible floor. Relaxed arms, nearly straight legs, weapon beside hand.
> No airborne pose, raised feet, somersault or rotated standing reference. Full body and weapon uncut, generous gutters,
> no text, labels, grid, ground, shadows or background. Native transparent alpha.

추출은 `--chroma-key none --alpha-floor 64 --fit contain`을 사용한다.
생성 원화의 투명 영역에 숨은 갈색 RGB가 있지만 알파가 0이므로 배경으로 쓰이지 않는다.
slice-sheet의 알파 정리로 옅은 안개만 제거하며, 몸의 불투명 픽셀과 가장자리는 보존한다.

## 다시 만들기

sprite-gen은 `../output/sprite-gen-review-20261027/tool`에 있는 3.5.0 사본을 사용했다.
원래 시트 백업과 측정 결과는 `../output/duel-motion-20261028/`에 있다.
재실행할 때 같은 `--out`의 `source` 백업을 유지한다. `--apply`를 생략하면 후보만 만든다.

```powershell
python tools/extract_duel_fallen.py --sprite-gen ../output/sprite-gen-review-20261027/tool --out ../output/duel-motion-20261028/reextract
python tools/repair_duel_motion.py --sprite-gen ../output/sprite-gen-review-20261027/tool --out ../output/duel-motion-20261028 --fallen-dir ../output/duel-motion-20261028/reextract --apply
```

`report.json`은 원본·착지 입력 SHA-256, 배율, 착지 범위와 가장자리 접촉을 기록한다.
인물별 `hit.motion.json`은 sprite-gen `qa.motion.analyze_motion`의 결과다.
걷기의 동일한 발 접촉을 선언하지 않았으므로 보고서의 보행 속도 미검증 경고는 정상이다.

## 확인한 것

- `node tests/duel_assets_smoke.js`: 전투원 37명과 컷인·배경 전체, 마지막 그림의 가로 누움·바닥 위치·칸 테두리 통과.
- `python tools/duel_repack.py --check images/duel/fighters`: 문제 0.
- `node tests/duel_motion_smoke.js`: 실제 `file://` 게임에서 아토스·아라미스 양쪽의 0→1→2 프레임,
  좌우 반전, 보통·빠른 피격 뒤 복귀, 체력 0 뒤 마지막 자세 유지, 재회전 없음, 콘솔 오류 0.
- `node tests/duel_finishers_smoke.js`: 비밀무기·장비 호통·전설 필살기·적의 컷인·일격필살 통과, 콘솔 오류 0.
- `tools/extract_duel_fallen.py`로 보관 원화를 다시 추출해 기존 추출물과 일치함을 확인.
- 띄운 헤드리스 브라우저는 각 시험의 `finally`에서 닫았다.

이 환경에서 브라우저 시험의 `NODE_PATH`는
`C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`다.
시트 이름과 규격을 유지해 이미지 매니페스트·게임 스크립트 목록은 바꿀 필요가 없다.

공격력·피해량·명중률·보상·동료·저장 규칙은 바꾸지 않았다. 기존 컷인 GIF도 바꾸지 않았다.
