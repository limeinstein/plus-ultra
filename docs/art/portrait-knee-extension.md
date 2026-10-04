# 라이벌·NPC 무릎상 확장

그림을 추가하는 순서는 `rivals → npc → npc-roles → mates`다. 이미 있는 `_half` 파일은 다시 만들지 않는다.

| 범주 | 흉상 원본 | 작업 전 무릎상 | 새 생성 | 작업 후 |
|---|---:|---:|---:|---:|
| 라이벌 (`portraits/rivals`) | 6 | 0 | 6 | 6 |
| 일반 NPC (`portraits/npc`) | 32 | 0 | 32 | 32 |
| 지역·역할 NPC (`portraits/npc-roles`) | 240 | 26 | 214 | 240 |
| 동료 항해사 (`portraits/mates`) | 57 | 57 | 0 | 57 |

총 335명/종류 가운데 작업 전 누락은 252장이었고, 현재 누락은 0장이다. 생성 대상의 정확한 목록과 현황은 `portrait-knee-extension.json`에 기록한다.

## 생성 프롬프트

```text
Use case: identity-preserve. Expand this existing bust portrait into a KNEE-LENGTH standing game portrait of the SAME person. Preserve the exact face, apparent age, hairstyle, facial hair, headwear, expression, upper costume, colors, materials, objects and gesture from the reference. Extend the same historically plausible late-15th to 16th-century outfit naturally down to the knees in the same rich polished semi-realistic painterly game illustration style. Composition: CLOSE head-to-kneecaps view only, single centered person. The CANVAS BOTTOM EDGE must intersect the KNEECAPS. SHINS, CALVES, BOOTS, ANKLES and FEET must all be completely OUTSIDE the canvas. This is not a full-body or full-length figure. Complete head with about 4 percent top margin; complete hands and any existing prop within the side edges; natural human proportions. 1024x1536 vertical portrait on a genuine transparent alpha background. No scene, colored backdrop, ground, shadow platform, halo, vignette, text, border or watermark. Do not add new props or change the person's identity.
```

검수는 `node tests/portrait_knee_extension_smoke.js`로 전체 335장의 등록·디코딩, 도시별 NPC가 흉상과 같은 인물의 무릎상을 고르는지, 라이벌·NPC 대화가 실제 큰 2인 구도로 열리는지, 브라우저 오류가 없는지를 확인한다. 최종 전수 검사에서는 335장 모두 1024×1536 RGBA 투명 이미지였고, 중간 PNG·임시 파일은 0개였으며, 자동 검증은 연속 두 번 통과했다.
