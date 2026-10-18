# 역사 인물 초상 제작 기록

## 납품 규격

- 무릎상: `images/portraits/rivals/<이름>_half.webp`, 1024×1536, 머리부터 양쪽 무릎까지 보이는 세로 구도
- 얼굴상: `images/portraits/rivals/<이름>.webp`, 512×512, 같은 무릎상에서 얼굴을 검출해 정사각형으로 파생
- 배경: 게임 대화창에서 합성할 수 있도록 투명 여백
- 양식: 기존 대항해 게임 초상과 어울리는 사실적인 16세기 유화풍 디지털 페인팅

## 공통 생성 프롬프트

> Historically grounded 16th-century naval character portrait in the established game's realistic painterly style. Preserve documented facial identity, age, hairstyle, beard, clothing, insignia, weapons and pose cues; do not modernize or redesign. Single character, transparent background, vertical knee-up composition: entire head through both knees visible, with comfortable margins; no feet, no cropped knees, no text, no frame, no extra people.

바르바로사는 사용자가 제공한 오스만 세밀화의 오른쪽 옆얼굴, 장미를 든 손, 지팡이, 큰 흰 터번, 붉은 줄무늬 카프탄을 그대로 핵심 참조로 삼았다. 나머지 인물은 동시대 초상·판화에서 확인되는 얼굴, 복식, 훈장과 지휘관의 역할을 인물별 프롬프트에 추가했다. 전신으로 생성된 결과는 원래 자세와 외형을 바꾸지 않고 무릎선으로만 다시 구도화했다.

## 제작 인물

- 바르바로사 일행: 하이레딘 바르바로사, 오루츠 레이스, 소콜루 메흐메드 파샤, 시난 파샤, 퓌알레 파샤, 미마르 시난, 카를 5세, 투르구트 레이스, 안드레아 도리아
- 레판토 신성 동맹: 돈 후안 데 아우스트리아, 마르칸토니오 콜론나, 세바스티아노 베니에르, 조반니 안드레아 도리아, 아고스티노 바르바리고, 알바로 데 바산 이 구즈만
- 레판토 오스만: 뮈에진자데 알리 파샤, 울루츠 알리 레이스, 슐루크 메흐메트 파샤, 페르테브 파샤, 카라 호자, 하산 레이스, 메흐메트 베이 (투르구트 레이스는 위 자산을 함께 사용)
- 칼레 해전: 찰스 하워드, 프랜시스 드레이크, 존 호킨스, 윌리엄 윈터, 유스티누스 반 나사우, 알론소 데 구즈만 이 소토마요르, 후안 마르티네스 데 레칼데, 미겔 데 오켄도, 디에고 페르난데스 데 메드라노, 페드로 데 발데스, 알레산드로 파르네세

## 고증 참고

- Metropolitan Museum of Art: *Khayr al-Din Barbarossa* 및 바르바로사 판화
- Museo Nacional del Prado: 티치아노의 카를 5세 초상, 돈 후안 데 아우스트리아 초상 자료
- Rijksmuseum: 레판토 해전 관련 초상·판화 묶음
- National Portrait Gallery: 프랜시스 드레이크, 존 호킨스 초상 자료

초상이 확실히 전하지 않거나 동명이인 식별이 어려운 인물(카라 호자, 메흐메트 베이, 윌리엄 윈터, 디에고 페르난데스 데 메드라노 등)은 특정 실존 얼굴을 단정하지 않고 시대·지역·직책의 복식 고증을 우선했다.
