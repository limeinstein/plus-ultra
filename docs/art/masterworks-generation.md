# 가상 명화·조각 생성 기준

`js/data/masterworks.js`의 제목과 풀이를 장면의 원전으로 삼고, 실존 예술가의 시대·지역·매체·화면 구성 원리를 더해 만든 가상 작품 72점이다. 실제 작품을 복제하지 않으며, 게임이 찾는 `images/masterworks/<부하ID>_<paint|sculpt><0..2>.webp` 이름으로 저장한다.

## 공통 규격

- 최종 규격: 1400×1000 WebP, 7:5 가로 화면, 품질 92.
- 회화는 화면 전체가 작품이며 액자·벽·박물관 전시 연출을 넣지 않는다.
- 조각은 재료와 제작 흔적이 보이는 완성품 전체를 단순한 공방 배경과 함께 보여 준다.
- 현대 물건, 읽을 수 있는 글자, 서명, 워터마크는 넣지 않는다.
- 인물은 모두 완전히 옷을 입은 성인 또는 종교·신화 장면에 필요한 안전한 묘사로 한정한다.

## 공통 프롬프트 골격

> Landscape 7:5 composition, artwork fills the image edge to edge, no external frame. Original fictional artwork titled “{title}”. {description}. Historically plausible {period, region, medium, pigments, clothing, vessel and architecture}. {artist-specific composition and brushwork}. No modern objects, no readable text, no signature, no watermark.

조각은 다음 골격을 썼다.

> Landscape 7:5 museum-quality documentary view of an original fictional sculpture titled “{title}”, shown complete from base to top in a restrained period workshop setting. {description}. Historically plausible material, tools, patina and construction. No label, no readable text, no signature, no watermark.

## 예술가별 고증 키워드

| 예술가 | 생성에 반영한 시대·매체·형식 |
|---|---|
| 레오나르도 다 빈치 | 15–16세기 이탈리아, 스푸마토·대기원근법·은첨/갈색 잉크 공학 소묘, 청동·테라코타·목제 모형 |
| 미켈란젤로 | 16세기 이탈리아, 영웅적 인체와 비틀린 자세, 적색 초크, 대리석의 노나 피니토 |
| 라파엘로 | 전성기 르네상스, 안정된 삼각·반원 구성, 명료한 원근과 조화로운 색 |
| 보티첼리 | 15세기 피렌체, 템페라의 유려한 윤곽선·장식적 리듬·금빛 성화 형식 |
| 베로키오 | 피렌체 공방의 금세공 같은 세부, 템페라·청동·밀랍 원형 |
| 도나텔로 | 초기 르네상스 청동과 대리석, 콘트라포스토, 스키아차토 얕은 부조 |
| 셋슈 | 무로마치 수묵, 파묵과 농담, 과감한 여백 |
| 가노 에이토쿠 | 모모야마 금벽화, 금박·굵은 먹선·대형 병풍 구도 |
| 가쓰시카 호쿠사이 | 에도 우키요에 목판, 선명한 윤곽·프러시안 블루·만화식 동작 연구 |
| 혼아미 고에쓰 | 마키에 옻칠·나전·납 상감, 손빚음 라쿠 다완 |
| 신사임당 | 조선 초충도·화조도, 섬세한 채색과 생태 관찰 |
| 정선 | 진경산수, 수직 준법과 굵고 마른 먹선 |
| 김홍도 | 조선 풍속화, 간결한 선과 해학적인 군상 구성 |
| 신윤복 | 조선 채색 풍속화, 날렵한 선·고운 색·도시적 정취 |
| 당인 | 명대 오문 화파, 시적인 인물·산수와 유려한 선묘 |
| 구영 | 명대 공필 청록산수, 석청·석록·금, 정밀 건축과 군상 |
| 서위 | 명대 사의 수묵, 발묵·비백·비대칭과 폭발적 필세 |
| 문징명 | 오문 문인화, 가는 건필·겹친 준법·절제된 담채 |
| 베흐자드 | 15세기 헤라트 세밀화, 불투명 수채·금·청금석, 중첩 원근과 다인물 군상 |
| 레자 아바시 | 17세기 이스파한 단폭화, 유려한 윤곽·옅은 담채·금빛 여백 |
| 마트라크츠 나수흐 | 16세기 오스만 지형 세밀화, 조감도·도식적 도시·평면 채색·무인 풍경 |

각 작품의 고유 장면 문장은 `js/data/masterworks.js`의 제목·풀이를 그대로 풀어 썼다. 생성 원본은 1536×1024였고 `python tools/prepare_masterworks.py`가 중앙을 7:5로 자른 뒤 1400×1000으로 리샘플한다.

## 고증 참고

- 메트로폴리탄 미술관, [Leonardo da Vinci (1452–1519)](https://www.metmuseum.org/essays/leonardo-da-vinci-1452-1519) — 스푸마토와 자연 연구.
- 메트로폴리탄 미술관, [Donatello (ca. 1386–1466)](https://www.metmuseum.org/essays/donatello-ca-1386-1466) — 콘트라포스토와 스키아차토 부조.
- 메트로폴리탄 미술관, [The Kano School of Painting](https://www.metmuseum.org/essays/the-kano-school-of-painting) — 가노 에이토쿠의 대형 금벽화와 역동적 구성.
- 메트로폴리탄 미술관, [Tang Yin, Landscapes](https://www.metmuseum.org/art/collection/search/45773) 및 [Wen Zhengming, Garden of the Inept Administrator](https://www.metmuseum.org/art/collection/search/39654) — 명대 오문 화파의 묘사적 수묵과 절제된 문인화.
- 국립중앙박물관, [Genre Painting room](https://www.museum.go.kr/ENG/contents/E0606010000.do?arcId=9208&catCustomType=united&catId=128&schM=view) — 김홍도·신윤복 풍속화의 현장감, 해학, 인물과 채색.
- 메트로폴리탄 미술관, [Islamic Painting](https://resources.metmuseum.org/resources/metpublications/pdf/Islamic_Art_The_Metropolitan_Museum_of_Art_Bulletin_v_36_no_2_Fall_1978.pdf) — 레자 아바시의 앨범화, 유려한 선, 금빛 장식과 절제된 배경.
