# 유적 복원 GIF 만들기

`js/data/discoveries.js`의 `ruin` 발견물을 읽어 `images/discoveries/ID.gif`를 만듭니다. 모든 GIF는 다음 흐름을 갖습니다.

1. 가설·토공사(연필 조사망과 터파기)
2. 기초·골조 공사
3. 외장·방수 공사
4. 내장·설비 공사
5. 마감·준공
6. 조경
7. 수채화톤 어반스케치
8. 높이를 올린 드론 시점의 360° 회전

형태는 거석군·피라미드·고전 신전·석굴·불탑·돔 성당·모스크·성곽·해저 도시 등으로 나뉘어 각 유적의 실루엣이 다르게 그려집니다. 렌더러는 날짜나 네트워크에 의존하지 않아 다시 만들어도 같은 결과가 나옵니다.

```powershell
python tools/ruin_gifs/build.py
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/ruin_gifs/build.py --only stonehenge
```

출력은 576×256, 96색 팔레트의 반복 GIF입니다. 게임은 GIF를 `<img>`로 표시하므로 Canvas에 첫 프레임만 고정되지 않습니다.
