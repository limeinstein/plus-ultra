# 절차적 3D 원화 (보물 63종 · 교역품 28종)

이미지 생성 도구 없이 three.js로 모형을 빚어 찍은 발견 그림입니다. 2026-10-04에 그림이 없던
보물 63종(난파선 보물 flordelamar 포함)과 교역품 28종을 이것으로 채웠습니다. 나중에 Codex 원화(`tools/treasure_gifs/sources/ID.png`)가
오면 같은 이름으로 덮어쓰고 빌더만 다시 돌리면 됩니다.

| 파일 | 하는 일 |
|---|---|
| `lib.js` | 공통 도구: 재질(금·청동·유약·옥·보석·진주…), 단면 회전(그릇), 돋을새김 판·원판, SDF 조각(사람 몸·얼굴), 2D 그림 붓, 액자, 박물관 조명 4×2 촬영(`T3.sheet`), 장면 촬영(`T3.shot`) |
| `objs/10_ceramics.js` | 도자기 10 (고려청자·당삼채·청화·여요·달항아리·이즈니크·러스터·아리타·라쿠·쓰쿠모나스) |
| `objs/20_jewels.js` | 보석·왕관 (코이누르·흑태자 루비·철관·바츨라프 관·티무르 루비·공작 옥좌·모곡·라트나푸라·무소·페레그리나·신라 금관) |
| `objs/30_objects.js` | 옥새·청룡언월도·성창·황금 안장·금동대향로·잉카 원반·태양의 돌·함무라비 비석·팔만대장경판·깃털관·벨렝 성체현시대 |
| `objs/40_sculpt.js` | SDF 조각: 다비드·밀로의 비너스·니케·라오콘·네페르티티·베닌 두상·살리에라 |
| `objs/50_paper.js` | 두루마리·책·지도: 이백 시집·난정서·청명상하도·훈민정음·바부르나마·샤나메·마야 코덱스·피리 레이스 지도·천마도 |
| `objs/60_paint.js` | 다시 그린 명화(퍼블릭 도메인 작품의 구도를 단순화): 모나리자·천지창조·최후의 만찬·비너스의 탄생·뒤러·우르비노·바벨탑·오르가스·대사들·쾌락의 정원·헨트 제단화·남만 병풍·아잔타·팔라 도로 |
| `trade/trade.js` | 교역품 28종: 등불 켜진 시장 좌판(자루·바구니·저울·차 상자…) + 지역별 흐린 시장 배경, 카메라가 다가가는 24장 |
| `run.js` / `run_trade.js` | 헤드리스 Chromium(Playwright)으로 굽기 |

## 만들기

```sh
cd tools/procedural_art
npm install three@0.147.0 playwright-core      # 처음 한 번
# 보물: 4×2 회전 원화 → 기존 박물관 빌더
node run.js ../treasure_gifs/sources monalisa,david      # 또는 all
python ../treasure_gifs/build.py --only monalisa,david
# 교역품: 24장 → GIF·마지막 장면
node run_trade.js ../trade_gifs/frames t_pepper,t_tea     # 또는 all
python ../trade_gifs/build.py --only t_pepper,t_tea
# 공통
python ../ruin_gifs/sheets.py monalisa david t_pepper t_tea
python ../images.py
```

- Chromium 경로는 `CHROME_PATH`, 글꼴은 Noto Serif CJK(한자·한글 글씨에 씀)를 찾습니다.
- 그림은 씨앗(발견물 ID)으로 정해지므로 다시 구워도 같은 모양이 나옵니다.
- 사람 조각과 명화는 단순화한 재현이라 사진처럼 정밀하지 않습니다. 더 좋은 원화가 생기면 그 ID만 바꿔 끼우세요.
