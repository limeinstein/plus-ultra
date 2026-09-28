# NPC 초상 240장 생성 규칙

OpenAI 내장 이미지 생성 도구로 각 파일을 **한 장씩 별도 생성**한다. 기존 `maid-styles/<문화권>/1.webp`를 문화·복식 참고로, 여급·후원자·마을 사람 초상을 화풍과 구도 참고로 사용한다. 생성 원본은 `tools/portrait_assets.py`로 512×512 투명 WebP로 줄인다.

## 파일 표

- 양식: `ib ne it gr ru is pe af sw in se cn kr jp az an co tr st na`
- 역할: `king priest noble official merchant scholar keeper sailor soldier maid native captain`
- 경로: `images/portraits/npc-roles/<양식>/<역할>.webp`
- 여성 역할(기본): `noble official merchant scholar keeper maid`
- 명: 기본에서 `merchant`를 남성으로 바꾸고 `native`를 여성으로 둔다.
- 조선: `king noble official merchant scholar keeper maid native`가 여성이다.

## 공통 프롬프트

```text
Use case: stylized-concept
Asset type: square game NPC bust portrait, one individual character
Input images: Image 1 is a cultural clothing and finish reference; Image 2 is a supporting reference for polished character rendering; Image 3 is a supporting reference for clean historical bust framing. Do not copy any reference identity.
Primary request: create a distinct adult <CULTURE> <GENDER> <ROLE> for a late-15th to 16th-century maritime exploration game. <ROLE_DESCRIPTION> <BEAUTY_DIRECTION> <CULTURE_SPECIAL_DIRECTION>
Individual appearance: <FACE_VARIANT>; apparent age <AGE>. Make this identity clearly different from every other portrait in the set.
Clothing: <PERIOD_AND_CULTURE_SPECIFIC_CLOTHING>.
Style/medium: highly polished semi-realistic digital character painting matching the references, realistic anatomy, detailed fabric and material texture, clean premium game portrait rendering.
Composition/framing: single character, three-quarter bust from mid-chest upward, face in the upper-center, complete head and shoulders visible, square composition.
Lighting/mood: warm soft key light with subtle golden rim light; role-appropriate expression.
Color palette: <ROLE_PALETTE>.
Background: genuinely transparent background with clean hair, headwear, and clothing edges.
Constraints: adult; one person only; culturally and historically plausible silhouette; no text; no border; no frame; no watermark; no modern items; no cropped headwear; no hands; no props; no extra objects; no copied identity; no ethnic caricature.
```

## 특별 지시

- 조선: 현대 한국 아이돌처럼 카메라에 잘 받는 맑고 세련된 얼굴 표현을 쓰되, 옷·머리·장신구는 조선 후기 이전의 역사적 실루엣을 지킨다. 남성의 단정한 콧수염·턱수염은 허용한다.
- 명 상인: 둥글고 친근한 인상, 단정한 콧수염과 작은 턱수염, 상인모와 잘 만든 푸른 장삼, 따뜻하면서도 영리한 미소를 쓴다. 민족적 과장은 피한다.
- 일본 남성: 극중의 긴장감 있는 계산적인 적대자 분위기, 경계하는 눈빛과 비대칭적인 옅은 미소를 쓴다. 외모를 흉측하게 만들거나 민족적 특징을 과장하지 않는다.
- 여성: 모든 문화권에서 아름답고 품위 있게 표현하되 현대 의상·현대 장신구는 넣지 않는다.
