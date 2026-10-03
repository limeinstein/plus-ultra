# 유럽 여급 46명 초상 주문서 (Codex용)

2026-10-03, 유럽 크기 2~3 도시에 이름 있는 여급 46명을 더했다(`js/data/people.js` G.MAIDS). 지금은 지역 그림 묶음(`images/maid-styles/<묶음>/1.webp`, `js/core/images.js` MAID_FACE)을 빌려 써서 **같은 지역 여급끼리 얼굴이 겹친다.** 아래 파일을 만들어 넣으면 자기 얼굴로 바로 바뀐다(코드 수정 필요 없음 — 그림 사슬이 `portraits/maids/<id>`를 먼저 찾는다).

## 파일과 규격 (기존 여급 29명과 같음)

| 용도 | 경로 | 크기 |
|---|---|---|
| 대화창 얼굴 | `images/portraits/maids/<id>.webp` | 1024×1024, 투명 배경, 가슴 위 흉상 |
| 술집에 서 있는 모습(2.5D 리그) | `images/portraits/maids/<id>_half.webp` | 1024×1536, 투명 배경, 머리부터 무릎까지, 정면에 가까운 3/4 자세 |

- 두 장은 **같은 사람**이어야 한다(얼굴·머리·옷 같게).
- 화풍 참고: 기존 `images/portraits/maids/m_lis.webp`, `m_ham.webp`, `m_ven.webp`(+ `_half`). 지역 옷 참고: 표의 「지금 빌려 쓰는 묶음」 `images/maid-styles/<묶음>/1.webp`. 참고 그림의 얼굴을 베끼지 말 것.
- 46명끼리, 그리고 기존 29명과도 얼굴이 뚜렷이 달라야 한다.

## 넣은 뒤 할 일 (WebGame 폴더에서)

```
python tools/images.py                 # images/manifest.js 다시 만들기
python tools/portrait_faces.py         # 눈·입 자리(js/data/portraitfaces.js) — 리그의 깜박임·입 모양
node tests/maids_europe_smoke.js       # 46명 그림 연결·술집 대화·도감 (콘솔 오류 0)
```
도감(catalog.html) 인물 › 여급에서 「교체됨」으로 바뀌었는지 본다.

## 공통 프롬프트

```text
Use case: stylized-concept
Asset type: <A) square bust portrait 1024x1024 | B) standing half-body 1024x1536, head to knees>
Input images: Image 1 is a cultural clothing reference (maid-styles/<STYLE>/1); Image 2 and 3 are rendering/framing references (existing barmaid portraits). Do not copy any reference identity.
Primary request: create a distinct, beautiful adult tavern barmaid in <CITY>, around 1480-1550, for a maritime exploration game. Personality: <PERSONALITY>.
Individual appearance: <APPEARANCE>; apparent age <AGE>. Make this identity clearly different from every other portrait in the set.
Clothing: <CLOTHING>; historically plausible working clothes of a tavern serving woman, modest neckline.
Style/medium: highly polished semi-realistic digital character painting matching the references, realistic anatomy, detailed fabric texture, premium game portrait rendering.
Composition/framing: A) three-quarter bust from mid-chest up, face upper-center, complete head and hair visible. B) single standing figure from head to knees, body slightly turned, arms relaxed (hands may hold an apron edge), whole head visible with margin above.
Lighting/mood: warm tavern candle key light with soft golden rim light; expression matching the personality.
Background: genuinely transparent background with clean hair and clothing edges.
Constraints: adult; one person only; no text; no border; no frame; no watermark; no modern items; no cropped head; no props other than clothing; no ethnic caricature.
```

## 46명

| id | 도시 | 이름 | 성격(좋아하는 사람) | 지금 빌려 쓰는 묶음 | 한 줄 |
|---|---|---|---|---|---|
| `m_opo` | 오포르토 | 베아트리스 | 견실한 | iberia | 포르투 포도주 창고 거리의 차분한 여급 |
| `m_bil` | 빌바오 | 미렌 | 강인한 | westeurope | 바스크 철공소 마을에서 온 씩씩한 여급 |
| `m_tol` | 톨레도 | 레오노르 | 섬세한 | iberia | 톨레도 골목의 조용하고 섬세한 여급 |
| `m_zar` | 사라고사 | 블랑카 | 의지가 강한 | iberia | 아라곤 사라고사의 고집 센 여급 |
| `m_cor` | 코르도바 | 소라이다 | 용감한 | arabia | 코르도바의 모리스카(개종 무슬림) 여급, 당당하고 용감함 |
| `m_val` | 발렌시아 | 비센타 | 통이 큰 | italy | 발렌시아 비단 시장 근처의 손 큰 여급 |
| `m_tls` | 툴루즈 | 에스클라르몽드 | 당당한 | france | 툴루즈의 오크어를 쓰는 당당한 여급 |
| `m_rou` | 루앙 | 잔 | 용감한 | france | 노르망디 루앙의 용감한 여급 |
| `m_trs` | 투르 | 아녜스 | 섬세한 | france | 루아르 강가 투르의 섬세한 여급 |
| `m_nan` | 낭트 | 이본 | 강인한 | westeurope | 브르타뉴 낭트 항구의 강인한 여급 |
| `m_bdx` | 보르도 | 이자보 | 통이 큰 | france | 보르도 포도주 항구의 통 큰 여급 |
| `m_lyo` | 리옹 | 루이즈 | 의지가 강한 | france | 리옹 인쇄 골목의 시를 쓰는 고집 센 여급 |
| `m_brg` | 브뤼허 | 리스베트 | 견실한 | lowlands | 브뤼허 운하 거리의 견실한 여급 |
| `m_bxl` | 브뤼셀 | 마흐텔트 | 친절한 | lowlands | 브뤼셀 레이스 공방 옆의 친절한 여급 |
| `m_sou` | 사우샘프턴 | 조운 | 당당한 | britain | 잉글랜드 사우샘프턴 부두의 당당한 여급 |
| `m_edi` | 에든버러 | 이소벨 | 강인한 | britain | 스코틀랜드 에든버러의 강인한 여급 |
| `m_dub` | 더블린 | 쇼반 | 용감한 | britain | 아일랜드 더블린의 용감한 여급 |
| `m_lub` | 뤼베크 | 메히틸트 | 견실한 | germany | 한자 동맹의 맹주 뤼베크의 견실한 여급 |
| `m_brm` | 브레멘 | 아델하이트 | 통이 큰 | germany | 브레멘 상인 거리의 통 큰 여급 |
| `m_kol` | 쾰른 | 우르줄라 | 친절한 | germany | 쾰른 대성당 아래 맥주집의 친절한 여급 |
| `m_ffm` | 프랑크푸르트 | 엘스베트 | 의지가 강한 | germany | 프랑크푸르트 박람회 거리의 의지 강한 여급 |
| `m_sxb` | 스트라스부르 | 오딜리아 | 섬세한 | westeurope | 알자스 스트라스부르의 섬세한 여급 |
| `m_nur` | 뉘른베르크 | 바르바라 | 견실한 | germany | 뉘른베르크 장인 거리의 견실한 여급 |
| `m_aug` | 아우크스부르크 | 레기나 | 통이 큰 | westeurope | 푸거 가문의 도시 아우크스부르크의 통 큰 여급 |
| `m_pra` | 프라하 | 루드밀라 | 친절한 | slav | 프라하 구시가의 친절한 여급 |
| `m_vie` | 빈 | 마그달레나 | 당당한 | westeurope | 합스부르크의 빈, 당당한 여급 |
| `m_dan` | 단치히 | 크리스티나 | 강인한 | slav | 발트 해의 곡물 항구 단치히의 강인한 여급 |
| `m_kgb` | 쾨니히스베르크 | 도로테아 | 의지가 강한 | slav | 프로이센 쾨니히스베르크의 의지 강한 여급 |
| `m_war` | 바르샤바 | 야드비가 | 용감한 | slav | 폴란드 바르샤바의 용감한 여급 |
| `m_bud` | 부다 | 일로나 | 당당한 | germany | 헝가리 부다의 당당한 여급 |
| `m_sto` | 스톡홀름 | 브리타 | 견실한 | russia | 스웨덴 스톡홀름의 견실한 여급 |
| `m_bgo` | 베르겐 | 시그리드 | 강인한 | lowlands | 노르웨이 베르겐 한자 부두의 강인한 여급 |
| `m_mil` | 밀라노 | 루크레치아 | 당당한 | italy | 밀라노 스포르차 궁 아래의 당당한 여급 |
| `m_flo` | 피렌체 | 시모네타 | 섬세한 | italy | 르네상스 피렌체의 섬세한 여급 |
| `m_rom` | 로마 | 피아메타 | 통이 큰 | italy | 로마 순례자 여관 거리의 통 큰 여급 |
| `m_pal` | 팔레르모 | 로살리아 | 용감한 | greece | 시칠리아 팔레르모의 용감한 여급 |
| `m_rag` | 라구사 | 니콜레타 | 견실한 | italy | 라구사(두브로브니크) 공화국의 견실한 여급 |
| `m_nov` | 노브고로드 | 마르파 | 의지가 강한 | russia | 노브고로드 공화국 최후의 시절, 의지 강한 여급 |
| `m_mos` | 모스크바 | 아브도티야 | 친절한 | russia | 모스크바 대공국의 친절한 여급 |
| `m_kie` | 키예프 | 옥사나 | 용감한 | slav | 드니프로 강가 키예프의 용감한 여급 |
| `m_bel` | 베오그라드 | 밀리차 | 강인한 | slav | 베오그라드의 강인한 세르비아 여급 |
| `m_ath` | 아테네 | 엘레니 | 섬세한 | greece | 오스만 시대 아테네의 섬세한 그리스 여급 |
| `m_sal` | 살로니카 | 레이나 | 견실한 | iberia | 살로니카의 세파르디 유대인 여급(에스파냐에서 온 집안), 견실함 |
| `m_can` | 칸디아 | 아레투사 | 친절한 | greece | 베네치아령 크레타 칸디아의 친절한 여급 |
| `m_fam` | 파마구스타 | 데스피나 | 통이 큰 | greece | 키프로스 파마구스타의 통 큰 여급 |
| `m_kaf` | 카파 | 아누시 | 당당한 | ottoman | 크림 반도 카파 항구의 아르메니아 여급, 당당함 |

## 사람별 프롬프트 값

### `m_opo` — 베아트리스 (오포르토)
- CITY: Porto, Portugal
- STYLE: iberia
- PERSONALITY: calm, reliable expression with a modest smile
- AGE: 24
- APPEARANCE: warm olive skin, dark brown hair in a low braided bun, calm hazel eyes, soft oval face
- CLOTHING: Portuguese working dress: russet wool bodice laced at front, white linen chemise, small dark kerchief over shoulders, plain coral earrings

### `m_bil` — 미렌 (빌바오)
- CITY: Bilbao, Basque Country
- STYLE: westeurope
- PERSONALITY: steady, strong-willed look with a calm resilient smile
- AGE: 23
- APPEARANCE: fair skin with rosy cheeks, thick chestnut hair in a long single braid, strong jaw, bright green-grey eyes
- CLOTHING: Basque dress: dark red skirt, black laced bodice, white chemise, simple white linen head-cloth tied at the back

### `m_tol` — 레오노르 (톨레도)
- CITY: Toledo, Castile
- STYLE: iberia
- PERSONALITY: soft, shy gaze and a delicate gentle smile
- AGE: 26
- APPEARANCE: pale olive skin, black wavy hair under a sheer veil, large dark almond eyes, delicate features
- CLOTHING: Castilian dress: deep green wool saya with square neckline, white partlet, small silver cross pendant

### `m_zar` — 블랑카 (사라고사)
- CITY: Zaragoza, Aragon
- STYLE: iberia
- PERSONALITY: sharp, thoughtful eyes and a determined slight smile
- AGE: 25
- APPEARANCE: light olive skin, auburn hair in two coiled braids, determined brown eyes, straight nose
- CLOTHING: Aragonese dress: mustard-yellow bodice, dark blue skirt, white chemise with embroidered collar, small red ribbon in hair

### `m_cor` — 소라이다 (코르도바)
- CITY: Córdoba, Andalusia
- STYLE: arabia
- PERSONALITY: fearless bright eyes and a lively open smile
- AGE: 22
- APPEARANCE: golden-tan skin, long black curly hair partly covered, kohl-lined dark eyes, confident smile
- CLOTHING: Morisca Andalusian dress: indigo and saffron striped tunic, embroidered sash, light patterned headscarf worn loosely, small gold hoop earrings

### `m_val` — 비센타 (발렌시아)
- CITY: Valencia
- STYLE: italy
- PERSONALITY: cheerful, generous laughing expression
- AGE: 27
- APPEARANCE: sun-kissed skin, dark hair with loose curls pinned up, warm brown eyes, generous smile
- CLOTHING: Valencian dress: peach silk bodice (secondhand silk), cream skirt, white chemise, a small fan tucked at the waist

### `m_tls` — 에스클라르몽드 (툴루즈)
- CITY: Toulouse, Languedoc
- STYLE: france
- PERSONALITY: proud, self-assured gaze and a confident half-smile
- AGE: 24
- APPEARANCE: fair skin, copper-red wavy hair falling past shoulders, blue eyes, proud chin
- CLOTHING: Languedoc dress: woad-blue gown (pastel dye of Toulouse), white linen coif pushed back, brass belt

### `m_rou` — 잔 (루앙)
- CITY: Rouen, Normandy
- STYLE: france
- PERSONALITY: fearless bright eyes and a lively open smile
- AGE: 23
- APPEARANCE: fair skin, honey-blonde hair under a white coif, steady grey eyes, freckles
- CLOTHING: Norman dress: dark brown wool kirtle, white apron, white starched coif, rolled sleeves

### `m_trs` — 아녜스 (투르)
- CITY: Tours, Loire valley
- STYLE: france
- PERSONALITY: soft, shy gaze and a delicate gentle smile
- AGE: 21
- APPEARANCE: porcelain skin, light brown hair in a neat center part, soft blue eyes, gentle expression
- CLOTHING: Loire valley dress: rose-pink gown with square neckline, white partlet, small black French hood edged with pearls-like beads

### `m_nan` — 이본 (낭트)
- CITY: Nantes, Brittany
- STYLE: westeurope
- PERSONALITY: steady, strong-willed look with a calm resilient smile
- AGE: 26
- APPEARANCE: weathered fair skin, dark blonde hair, broad cheekbones, clear blue eyes
- CLOTHING: Breton dress: black wool bodice, layered blue skirt, white lace-edged Breton coiffe, embroidered apron band

### `m_bdx` — 이자보 (보르도)
- CITY: Bordeaux, Gascony
- STYLE: france
- PERSONALITY: cheerful, generous laughing expression
- AGE: 28
- APPEARANCE: rosy fair skin, chestnut hair in loose waves, amused brown eyes, full lips
- CLOTHING: Gascon dress: claret-red bodice, ochre skirt, white chemise, wine-stained apron, small gold chain

### `m_lyo` — 루이즈 (리옹)
- CITY: Lyon
- STYLE: france
- PERSONALITY: sharp, thoughtful eyes and a determined slight smile
- AGE: 25
- APPEARANCE: fair skin, dark brown hair braided around the head, intelligent dark eyes, faint smile
- CLOTHING: Lyonnaise dress: deep violet silk-trimmed gown (silk town), white partlet, small book-shaped pendant

### `m_brg` — 리스베트 (브뤼허)
- CITY: Bruges, Flanders
- STYLE: lowlands
- PERSONALITY: calm, reliable expression with a modest smile
- AGE: 24
- APPEARANCE: very fair skin, pale blonde hair under a white kerchief, calm blue eyes, high forehead
- CLOTHING: Flemish dress: dark green woolen gown, white linen headdress in the Flemish style, white apron, keys at belt

### `m_bxl` — 마흐텔트 (브뤼셀)
- CITY: Brussels, Brabant
- STYLE: lowlands
- PERSONALITY: warm, gentle eyes and a kind welcoming smile
- AGE: 22
- APPEARANCE: fair skin, strawberry-blonde hair, round face, kind light-brown eyes
- CLOTHING: Brabant dress: red kirtle, black bodice, white lace collar, white cap

### `m_sou` — 조운 (사우샘프턴)
- CITY: Southampton, England
- STYLE: britain
- PERSONALITY: proud, self-assured gaze and a confident half-smile
- AGE: 24
- APPEARANCE: fair skin, dark auburn hair, lively green eyes, a few freckles
- CLOTHING: Tudor working dress: tawny wool kirtle, white smock, linen coif, laced stomacher

### `m_edi` — 이소벨 (에든버러)
- CITY: Edinburgh, Scotland
- STYLE: britain
- PERSONALITY: steady, strong-willed look with a calm resilient smile
- AGE: 25
- APPEARANCE: pale skin, raven-black hair, sharp blue eyes, strong brows
- CLOTHING: Scottish Lowland dress: dark wool kirtle, checked plaid shawl pinned with a silver brooch, white chemise

### `m_dub` — 쇼반 (더블린)
- CITY: Dublin, Ireland
- STYLE: britain
- PERSONALITY: fearless bright eyes and a lively open smile
- AGE: 22
- APPEARANCE: fair freckled skin, flaming red curly hair, bright green eyes, wide smile
- CLOTHING: Irish dress: saffron-yellow léine-style linen undergown, short green wool jacket, simple torc-like brass necklace

### `m_lub` — 메히틸트 (뤼베크)
- CITY: Lübeck
- STYLE: germany
- PERSONALITY: calm, reliable expression with a modest smile
- AGE: 27
- APPEARANCE: fair skin, ash-blonde hair under a white linen hood, serious grey eyes
- CLOTHING: North German Hanseatic dress: dark blue wool gown, white Haube head-cloth, white apron, brass purse

### `m_brm` — 아델하이트 (브레멘)
- CITY: Bremen
- STYLE: germany
- PERSONALITY: cheerful, generous laughing expression
- AGE: 26
- APPEARANCE: rosy fair skin, golden blonde hair in thick braids, merry blue eyes
- CLOTHING: Bremen burgher dress: crimson bodice, black skirt, white chemise, silver buttons

### `m_kol` — 우르줄라 (쾰른)
- CITY: Cologne
- STYLE: germany
- PERSONALITY: warm, gentle eyes and a kind welcoming smile
- AGE: 21
- APPEARANCE: fair skin, light brown hair in braids crowned around the head, gentle hazel eyes
- CLOTHING: Rhineland dress: blue dirndl-like laced bodice, cream skirt, white puffed sleeves, small red ribbon

### `m_ffm` — 엘스베트 (프랑크푸르트)
- CITY: Frankfurt
- STYLE: germany
- PERSONALITY: sharp, thoughtful eyes and a determined slight smile
- AGE: 24
- APPEARANCE: fair skin, dark blonde hair pinned up, keen grey-blue eyes, firm mouth
- CLOTHING: Frankfurt burgher dress: forest-green gown with slashed sleeves, white partlet, black velvet cap

### `m_sxb` — 오딜리아 (스트라스부르)
- CITY: Strasbourg, Alsace
- STYLE: westeurope
- PERSONALITY: soft, shy gaze and a delicate gentle smile
- AGE: 23
- APPEARANCE: fair skin, chestnut hair, soft brown eyes, delicate chin
- CLOTHING: Alsatian dress: black bodice with embroidered stomacher, red skirt, large black bow headdress

### `m_nur` — 바르바라 (뉘른베르크)
- CITY: Nuremberg
- STYLE: germany
- PERSONALITY: calm, reliable expression with a modest smile
- AGE: 26
- APPEARANCE: fair skin, light auburn hair under a white cap, practical grey eyes
- CLOTHING: Nuremberg dress: brown wool gown, white goller collar, white apron, small brass thimble chain

### `m_aug` — 레기나 (아우크스부르크)
- CITY: Augsburg
- STYLE: westeurope
- PERSONALITY: cheerful, generous laughing expression
- AGE: 27
- APPEARANCE: fair skin, rich golden-brown hair in a netted caul, confident blue eyes
- CLOTHING: Augsburg dress: wine-red gown with gold-thread trim, white partlet, beaded hairnet

### `m_pra` — 루드밀라 (프라하)
- CITY: Prague, Bohemia
- STYLE: slav
- PERSONALITY: warm, gentle eyes and a kind welcoming smile
- AGE: 22
- APPEARANCE: fair skin, long light-brown hair, soft green eyes, gentle smile
- CLOTHING: Bohemian dress: embroidered white blouse, red vest, blue skirt, floral headband

### `m_vie` — 마그달레나 (빈)
- CITY: Vienna
- STYLE: westeurope
- PERSONALITY: proud, self-assured gaze and a confident half-smile
- AGE: 25
- APPEARANCE: fair skin, dark blonde hair in an elegant braided crown, bold blue eyes
- CLOTHING: Viennese dress: blue velvet bodice, white chemise, golden lacing

### `m_dan` — 크리스티나 (단치히)
- CITY: Danzig (Gdańsk)
- STYLE: slav
- PERSONALITY: steady, strong-willed look with a calm resilient smile
- AGE: 26
- APPEARANCE: pale skin, flaxen hair, wide grey eyes, strong shoulders
- CLOTHING: Danzig dress: grey-blue wool gown, white collar, amber bead necklace

### `m_kgb` — 도로테아 (쾨니히스베르크)
- CITY: Königsberg, Prussia
- STYLE: slav
- PERSONALITY: sharp, thoughtful eyes and a determined slight smile
- AGE: 24
- APPEARANCE: fair skin, light brown hair, serious blue eyes, straight brows
- CLOTHING: Prussian dress: dark green gown, white apron, amber pendant, white linen cap

### `m_war` — 야드비가 (바르샤바)
- CITY: Warsaw, Poland
- STYLE: slav
- PERSONALITY: fearless bright eyes and a lively open smile
- AGE: 23
- APPEARANCE: fair skin, long dark-blonde braid, lively blue eyes, high cheekbones
- CLOTHING: Polish dress: red kontusz-style short jacket over white blouse, coral necklace, flower wreath

### `m_bud` — 일로나 (부다)
- CITY: Buda, Hungary
- STYLE: germany
- PERSONALITY: proud, self-assured gaze and a confident half-smile
- AGE: 24
- APPEARANCE: olive-fair skin, glossy black hair in a thick braid, dark flashing eyes
- CLOTHING: Hungarian dress: embroidered white blouse with puffed sleeves, red velvet vest, pleated skirt, beaded headdress

### `m_sto` — 브리타 (스톡홀름)
- CITY: Stockholm, Sweden
- STYLE: russia
- PERSONALITY: calm, reliable expression with a modest smile
- AGE: 25
- APPEARANCE: very fair skin, platinum-blonde hair, ice-blue eyes, calm expression
- CLOTHING: Swedish dress: dark blue wool bodice, yellow skirt, white linen cap, wool shawl

### `m_bgo` — 시그리드 (베르겐)
- CITY: Bergen, Norway
- STYLE: lowlands
- PERSONALITY: steady, strong-willed look with a calm resilient smile
- AGE: 26
- APPEARANCE: fair wind-flushed skin, strawberry-blonde hair, clear grey eyes
- CLOTHING: Norwegian dress: red wool bodice with silver clasps, black skirt, white linen sleeves

### `m_mil` — 루크레치아 (밀라노)
- CITY: Milan
- STYLE: italy
- PERSONALITY: proud, self-assured gaze and a confident half-smile
- AGE: 24
- APPEARANCE: olive-fair skin, dark brown hair with a jeweled ribbon (lenza) across the forehead, bold dark eyes
- CLOTHING: Milanese dress: brocade-trimmed green gamurra, white chemise puffing through slashed sleeves

### `m_flo` — 시모네타 (피렌체)
- CITY: Florence
- STYLE: italy
- PERSONALITY: soft, shy gaze and a delicate gentle smile
- AGE: 21
- APPEARANCE: fair skin, wavy strawberry-blonde hair partly braided with pearls, pale blue eyes, softly idealized
- CLOTHING: Florentine dress: pale blue gamurra, white chemise, thin gold ribbon in hair

### `m_rom` — 피아메타 (로마)
- CITY: Rome
- STYLE: italy
- PERSONALITY: cheerful, generous laughing expression
- AGE: 27
- APPEARANCE: warm olive skin, black curly hair, laughing brown eyes
- CLOTHING: Roman dress: orange-red bodice, ivory skirt, white chemise, wide sash

### `m_pal` — 로살리아 (팔레르모)
- CITY: Palermo, Sicily
- STYLE: greece
- PERSONALITY: fearless bright eyes and a lively open smile
- AGE: 23
- APPEARANCE: sun-tanned skin, thick black hair, intense dark eyes, strong brows
- CLOTHING: Sicilian dress: black bodice, bright red skirt, white chemise, gold cross

### `m_rag` — 니콜레타 (라구사)
- CITY: Ragusa (Dubrovnik)
- STYLE: italy
- PERSONALITY: calm, reliable expression with a modest smile
- AGE: 25
- APPEARANCE: olive-fair skin, dark chestnut hair in a coiled braid, steady green eyes
- CLOTHING: Dalmatian dress: white embroidered blouse, dark blue vest with silver buttons, red cap

### `m_nov` — 마르파 (노브고로드)
- CITY: Novgorod
- STYLE: russia
- PERSONALITY: sharp, thoughtful eyes and a determined slight smile
- AGE: 26
- APPEARANCE: fair skin, long honey-blonde braid, grey-blue determined eyes
- CLOTHING: Russian dress: red sarafan over white embroidered rubakha, kokoshnik-like headband, amber beads

### `m_mos` — 아브도티야 (모스크바)
- CITY: Moscow
- STYLE: russia
- PERSONALITY: warm, gentle eyes and a kind welcoming smile
- AGE: 22
- APPEARANCE: fair rosy skin, light brown braid, kind blue eyes, round face
- CLOTHING: Muscovite dress: blue sarafan, white blouse with red embroidery, simple povoinik headscarf

### `m_kie` — 옥사나 (키예프)
- CITY: Kyiv
- STYLE: slav
- PERSONALITY: fearless bright eyes and a lively open smile
- AGE: 22
- APPEARANCE: fair skin, dark blonde hair with a ribbon wreath, lively brown eyes
- CLOTHING: Ruthenian dress: embroidered vyshyvanka blouse, red woven belt, dark wrap skirt, flower wreath

### `m_bel` — 밀리차 (베오그라드)
- CITY: Belgrade, Serbia
- STYLE: slav
- PERSONALITY: steady, strong-willed look with a calm resilient smile
- AGE: 25
- APPEARANCE: olive-fair skin, black braided hair, dark determined eyes
- CLOTHING: Serbian dress: white linen dress, embroidered vest, coin-decorated headdress

### `m_ath` — 엘레니 (아테네)
- CITY: Athens, Greece
- STYLE: greece
- PERSONALITY: soft, shy gaze and a delicate gentle smile
- AGE: 22
- APPEARANCE: olive skin, dark curly hair, large brown eyes, gentle smile
- CLOTHING: Greek dress: white chemise, embroidered sleeveless coat, red fez-like cap with tassel

### `m_sal` — 레이나 (살로니카)
- CITY: Salonica (Thessaloniki)
- STYLE: iberia
- PERSONALITY: calm, reliable expression with a modest smile
- AGE: 24
- APPEARANCE: olive skin, dark hair under a patterned headscarf, warm hazel eyes
- CLOTHING: Sephardic dress: dark red long coat (entari), white blouse, coin necklace, headscarf

### `m_can` — 아레투사 (칸디아)
- CITY: Candia, Crete
- STYLE: greece
- PERSONALITY: warm, gentle eyes and a kind welcoming smile
- AGE: 23
- APPEARANCE: sun-kissed olive skin, black hair in a long braid, kind dark eyes
- CLOTHING: Cretan dress: white chemise, red bodice, dark skirt, black headscarf with fringe

### `m_fam` — 데스피나 (파마구스타)
- CITY: Famagusta, Cyprus
- STYLE: greece
- PERSONALITY: cheerful, generous laughing expression
- AGE: 26
- APPEARANCE: golden olive skin, dark wavy hair, warm amber eyes
- CLOTHING: Cypriot dress: patterned silk vest, white blouse, gold coin earrings

### `m_kaf` — 아누시 (카파)
- CITY: Caffa, Crimea
- STYLE: ottoman
- PERSONALITY: proud, self-assured gaze and a confident half-smile
- AGE: 24
- APPEARANCE: olive-fair skin, dark hair with a jeweled forehead band, bold brown eyes
- CLOTHING: Armenian dress: long burgundy robe with embroidered collar, silver belt, light veil
