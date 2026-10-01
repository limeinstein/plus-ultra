# 동물 발견 원화 프롬프트

이미지 생성은 `photorealistic-natural` 용도로 진행했습니다. 각 원화는 정확히
같은 새끼와 장소가 이어지는 2×2 스토리보드이며, 글자·번호·테두리·사람·우리·
공격·피·먹잇감은 넣지 않습니다.

## 공통 프롬프트

```text
Use case: photorealistic-natural
Asset type: game discovery animation source storyboard
Primary request: Create a strict four-shot cinematic reveal sequence of <BABY> and its protective adult, arranged as an exact 2 by 2 storyboard grid with four equal panels.
Panel 1: in <HABITAT>, only the baby's nose, snout, or beak tip and a hint of its face peek through the foreground habitat toward the camera.
Panel 2: the exact same baby gently emerges farther, tilts its head, and makes a species-appropriate endearing gesture.
Panel 3: the exact same baby comes closer in an irresistibly cute, calm, curious pose as the camera appears to zoom in.
Panel 4: the same baby remains in the foreground while <ADULT> appears immediately behind it in a calm, impressive protective stance, looking alert past the camera.
Scene/backdrop: the exact same authentic habitat, location, and camera axis in all four panels.
Style/medium: premium photorealistic wildlife documentary cinematography, real natural texture, cinematic but believable.
Composition/framing: exact 2x2 grid, four equal panels, same low eye-level camera continuity; keep both subjects inside the middle 70 percent so every panel can be cropped to a wide 9:4 game frame.
Lighting/mood: very dark natural habitat with cool ambient light and subtle rim light; mysterious first three shots, majestic and reassuring final shot.
Constraints: exactly four panels; same baby and habitat in every panel; adult appears only in panel 4; accurate species anatomy and scale; no humans, collars, props, prey, aggression, attack, blood, text, labels, captions, logos, or watermark.
Avoid: illustration, painting, cartoon, plush toy, fantasy anatomy, duplicate babies, extra animals, zoo or enclosure, panel numbers, speech bubbles.
```

## 동물별 치환값

| ID | 새끼 / 성체 | 실제 생태 환경 |
|---|---|---|
| `tarantula` | 골리앗새잡이거미 유체 / 성체 | 기아나의 젖은 열대우림 낙엽·굴 |
| `llama` | 라마 새끼 / 어미 | 안데스 고원 이추풀·화산암·설산 |
| `prairiedog` | 검은꼬리프레리도그 새끼 / 보초 선 성체 | 북미 짧은풀 초원 굴 |
| `moose` | 말코손바닥사슴 새끼 / 큰 뿔 성체 | 캐나다 침엽수 습지·버드나무 |
| `frigatebird` | 군함조 새끼 / 붉은 목주머니 수컷 | 갈라파고스 화산섬 둥지 |
| `tortoise` | 갈라파고스땅거북 새끼 / 거대한 성체 | 스칼레시아 숲·이끼·검은 용암 |
| `albatross` | 떠돌이알바트로스 새끼 / 날개를 편 성체 | 아남극 바위섬·터석풀·거친 바다 |
| `kangaroo` | 동부회색캥거루 새끼 / 어미 | 오스트레일리아 유칼립투스 초원 |
| `paradise` | 큰극락조 새끼 / 황금 장식깃 수컷 | 뉴기니 운무림의 젖은 이끼 가지 |
| `sable` | 검은담비 새끼 / 성체 | 시베리아 타이가 삼나무 뿌리·잔설 |
| `tiger` | 벵골호랑이 새끼 / 어미 | 순다르반 맹그로브 숲·얽힌 뿌리 |
| `panda` | 자이언트판다 새끼 / 어미 | 쓰촨 산지의 젖은 대나무숲 |
| `porcupine` | 아프리카갈기산미치광이 새끼 / 가시를 편 성체 | 동아프리카 아카시아 초원 바위굴 |
| `coelacanth` | 실러캔스 어린 개체 / 성체 | 코모로 화산암 심해 동굴 |
| `warthog` | 흑멧돼지 새끼 / 큰 엄니 성체 | 동아프리카 붉은 흙 굴·건조 초원 |
| `komodo` | 코모도왕도마뱀 새끼 / 성체 | 코모도섬 건기 계절림 낙엽 |
| `penguin` | 아프리카펭귄 새끼 / 성체 | 케이프 바위 해안·미역·바다 안개 |
| `mandrill` | 맨드릴 새끼 / 화려한 수컷 | 중앙아프리카 우림 판근·큰 잎 |
| `ostrich` | 타조 새끼 / 검고 흰 성체 수컷 | 칼라하리 붉은 모래·가시덤불 |
| `flamingo` | 큰홍학 새끼 / 날개를 편 성체 | 동아프리카 알칼리 호수·얕은 물·갈대·화산 능선 |
| `hippo` | 하마 새끼 / 어미 | 잠베지 강 파피루스 얕은 물 |
| `crocodile` | 나일악어 새끼 / 어미 | 동아프리카 담수 습지 갈대·진흙 |
| `polarbear` | 북극곰 새끼 / 어미 | 북극 해빙·눈구덩이·푸른 얼음 |

## 추가 동물 94종 프롬프트

추가 동물은 `js/data/animals.js`의 `a('ID', '이름', ..., 설명, 단서)` 선언에서
ID·이름·설명·단서를 읽고 아래 템플릿에 그대로 넣었습니다. 이렇게 품종의 외형,
실제 서식지, 역사적 배경을 한꺼번에 지정하면서 위의 네 장면 구성을 유지했습니다.

```text
Use case: photorealistic-natural
Create one strict 2x2 cinematic wildlife storyboard with four equal panels for <NAME> (<ID>).
Species and historical/ecological description: <DESCRIPTION>
Habitat clue: <HINT>

Panel 1: in a dark, authentic habitat for this species, only the baby's nose, snout,
beak, or face edge peeks from behind natural cover toward the camera.
Panel 2: the exact same baby emerges farther and gives a gentle, species-appropriate
head tilt or endearing gesture.
Panel 3: the exact same baby comes closer as the camera visibly zooms in, irresistibly
cute, calm, and curious.
Panel 4: the same baby stays in the foreground while one magnificent adult of the same
species appears immediately behind it in a calm protective stance.

Keep the same individual, habitat, camera axis, weather, and lighting in all panels.
Premium photorealistic wildlife-documentary cinematography, realistic anatomy and scale,
dark cool ambient light with subtle rim light. The adult appears only in panel 4.
No unrelated animals, people, cages, collars, props, prey, aggression, blood, text,
captions, logos, watermarks, panel numbers, cartoons, paintings, or plush-toy styling.
```

멸종동물과 공룡에는 `living, scientifically grounded reconstruction; no bones,
fossils, museum, or exhibit`를 덧붙였습니다. 전설동물에는 `coherent photorealistic
natural creature in its traditional habitat`를 덧붙였고, 엘프와 인어는
`family-friendly, fully covered, nonsexual`로 제한했습니다.
