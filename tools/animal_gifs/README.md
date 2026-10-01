# 동물 발견 GIF 만들기

`js/data/discoveries.js`의 기존 동물 23종과 `js/data/animals.js`의 추가 동물
94종, 모두 117종을 새끼와 성체가 이어지는 `images/discoveries/ID.gif`로
만듭니다. 추가 목록에는 집짐승·야생동물·새·해양동물뿐 아니라 전설동물과
살아 있는 모습으로 복원한 멸종동물·공룡도 포함됩니다.

원화 `sources/ID.png`는 같은 개체와 장소를 유지한 2×2 장면입니다.

1. 어두운 숲·정글·습지·바다 등 실제 서식지에서 코나 부리 끝만 보입니다.
2. 새끼가 얼굴을 내밀고 고개를 갸웃합니다.
3. 카메라가 가까워지며 새끼가 애교를 부립니다.
4. 성체가 바로 뒤에 나타나 차분하고 위엄 있게 새끼를 지킵니다.

빌더는 네 장면에 확대·작은 상하 움직임·겹침을 더해 576×256, 18프레임,
7.2초 GIF와 마지막 장면 JPG를 만듭니다. 게임에서는 같은 그림을 WebP 장면
판으로 바꿔 5초 동안 부드럽게 재생합니다.

```powershell
python tools/animal_gifs/build.py
python tools/ruin_gifs/sheets.py
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/animal_gifs/build.py --only tiger
python tools/ruin_gifs/sheets.py tiger
python tools/images.py
```

실사 원화의 공통 프롬프트와 동물별 서식지·개체 지정은 `PROMPTS.md`에 있습니다.
추가 동물 ID는 `js/data/animals.js`의 `a('ID', ...)` 선언에서 자동으로 읽습니다.
