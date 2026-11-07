# 누락 선수상 원화 37종 (2026-11-07)

선수상 112종을 실제 등록 자료와 그림 선택 순서로 조사했다. 기존 조각 그림이 있는 75종은 그대로 두고,
동물·괴물·발견 장면을 대신 표시하던 37종에 새 원화를 추가했다. 발견 보상 33종과 전설 선수상 4종이다.

내장 `image_gen`으로 항목마다 따로 생성했다. 인어·고래·새·용은 살아 있는 생물 대신 채색 목각이나
청동 조각으로 표현했고, 지역별 뱃머리 장식과 엄니·비늘·등딱지·이빨 장식도 원래 이름과 설명을 따랐다.
짧은 고정 받침을 함께 그려 실제 뱃머리에 다는 물건임이 드러나게 했다.

- 게임 그림: `images/figureheads/<ID>.webp` — 192×192, 투명 배경, 최소 13픽셀 투명 여백.
- 원본 PNG·개별 생성 기록·파일 해시: `artifacts/figureheads-20261107/sources/`와 `records/`, `files-report.json`.
- [전체 미리보기](figureheads-preview-20261107.jpg) · [어두운 배경 검수판](../../artifacts/figureheads-20261107/preview-dark.jpg).
- [품목별 생성 프롬프트와 출력 경로](figureheads-prompts-20261107.json).

`G.Img.chain.relic`에서 선수상 전용 그림을 찾도록 연결했다. 새 그림은 조선소·소지품·발견 카드·도감에서
같은 물건으로 표시된다. 기존 유물 원화가 있으면 그 그림을 우선하며, 품목 ID·이름·가격·효과는 유지했다.
기존 그림 75종의 SHA-256을 비교해 바뀐 파일이 없음을 확인했다.

재현 명령:

```text
python tools/package_figureheads_20261107.py
python tools/images.py
node tools/audit_figurehead_art.cjs --summary --strict
node tests/figurehead_art_smoke.js
ART=1 node tests/disc_relics_smoke.js
```

원화 검수와 파일 검사: 신규 37/37종 완료. 전체 선수상은 전용 조각 그림 73종과 같은 물건의 기존 원화
39종을 사용하며, 발견 장면으로 대신 표시하는 항목은 0종이다.

게임 검사도 통과했다. 선수상 전용 파일 73종을 실제로 읽어 크기와 투명도를 확인했고, 신규 37종이
선수상·유물·소지품에서 모두 같은 전용 원화를 선택했다. 인어 선수상을 조선소에서 150닢에 장착하고
도감 상세 화면에서 새 그림 경로를 확인했다. 발견 유물 411종 검사도 14개 모두 통과했다. 콘솔 오류 0건,
검사용 브라우저는 종료했다.

[조선소 장착 화면](../../artifacts/figureheads-20261107/shipyard-new-figurehead.png) ·
[도감 상세 화면](../../artifacts/figureheads-20261107/catalog-new-figurehead.png) ·
[브라우저 검사 기록](../../artifacts/figureheads-20261107/browser-report.json).
