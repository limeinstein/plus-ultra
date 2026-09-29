# 유적 복원 GIF 만들기

`js/data/discoveries.js`의 기존 `ruin` 66개와 `js/data/wonders.js`의 건물 불가사의 96개를 읽어 `images/discoveries/ID.gif`를 만듭니다. 모든 GIF는 다음 흐름을 갖습니다.

1. 가설·토공사(연필 조사망과 터파기)
2. 기초·골조 공사
3. 외장·방수 공사
4. 내장·설비 공사
5. 마감·준공
6. 조경
7. 수채화톤 어반스케치
8. 드론 시점의 360° 회전(아침 → 정오 → 노을 → 달빛 밤 → 새벽)

V2 원화는 `tools/heritage/references/discoveries`의 UNESCO·위키미디어 기준 사진과 기존 복원화를 함께 입력으로 삼아 만든 4×4 마스터 시트입니다. `tools/ruin_gifs/v2/master/ID.png`의 1~7칸은 마스크 공개가 아닌 서로 다른 누적 공정 장면이고, 9~16칸은 실제로 따로 생성한 45° 간격의 8방향 드론 뷰입니다. 전설·위치 불확실 항목은 사실로 단정하지 않고 문헌·시대 배경을 바탕으로 절제한 추정 복원입니다.

건물 불가사의 96개의 마스터 시트는 `wonders.js`의 이름·설명·소문을 제작 프롬프트에 직접 넣습니다. 기존 사진을 돌려 쓰지 않으며, 같은 4×4 규격의 독립 원화로 만듭니다. `tools/ruin_gifs/wonder_prompt_data.py`는 이 96개 제작 자료를 JSON으로 출력합니다.

GIF 합성기는 화면에 글자·숫자·로고·워터마크를 전혀 그리지 않습니다. 단계는 백지의 양, 연필선의 농도, 지면색, 수채화 번짐만으로 구분합니다. 360° 구간은 건물을 겹쳐 보이게 하는 프레임 보간 없이 8개의 실제 방위 장면을 순서대로 사용합니다.

```powershell
python tools/ruin_gifs/build.py
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/ruin_gifs/build.py --only stonehenge
```

게임 파일을 덮어쓰지 않는 시험 출력은 다음과 같습니다.

```powershell
python tools/ruin_gifs/build_v2.py --preview --only stonehenge
```

출력은 576×256, 공유 64색 팔레트의 반복 GIF입니다. 게임은 GIF를 `<img>`로 표시하므로 Canvas에 첫 프레임만 고정되지 않습니다.

정지 접촉면으로 단계와 조명을 검사할 때:

```powershell
python tools/ruin_gifs/preview.py images/discoveries/stonehenge.gif tools/ruin_gifs/stonehenge-preview.jpg
```

## 발견 연출용 마지막 장면

게임은 유적을 발견하면 GIF를 한 바퀴 돌린 뒤 마지막 장면에서 멈춥니다(`js/scenes/common.js`의 `SC.discoveryReveal`).
브라우저는 GIF를 멈출 수 없어서 마지막 프레임을 따로 뽑아 둡니다. GIF를 다시 만들었으면 이것도 다시 실행하세요.

```powershell
python tools/ruin_gifs/end_frames.py      # images/discovery-ends/ID.jpg
python tools/images.py
```

GIF 길이(지금 최적화 전 19프레임·9820ms)를 바꾸면 `js/data/seafx.js`의 `G.FX.reveal.gifMs`도 맞춥니다.
