# 2026-10-08 신규 발견물 83개 GIF

대상: `eastdisc.js` 자연 경관 30개·유적 17개, `folkdisc.js` 신규 민족 36개.
기존 민족 발견물은 이번 83개 묶음에 포함하지 않는다.

`export.js`가 게임의 원문과 풍속(음악·춤·악기·음식·무예)을 읽어 `prompts.json`에
발견물별 원화 제작 지시와 저장 경로를 남긴다. 원화는 내장 ImageGen으로 항목별 생성한다.
민족은 각 집단의 복식·악기·춤과 음식 준비를 그린 4×4 연속 장면이고,
자연은 파노라마, 유적은 건설 공정과 여러 방향 조망을 그린 4×4 시트다.
역사 탐험 게임용 해석 그림이며 정밀한 고증 복원도나 춤 교본은 아니다.

```powershell
node tools/discovery83/export.js
python tools/discovery83/build.py
python tools/images.py
python tests/discovery83_files.py
node tests/discovery83_runtime.js
```

`--only folk_zulu,tiantan`은 지정 항목을 다시 만들고, `--ready`는 도착한 원화 중
아직 변환하지 않은 것만 만든다. `--preview`는 모음판과 HTML 갤러리만 갱신한다.

- GIF: `images/discoveries/<id>.gif`, 576×256, 9.82초, 반복.
- 마지막 장면: `images/discovery-ends/<id>.jpg`.
- 게임용 판: `images/discovery-sheets/<id>.webp`, 가로 6칸.
- 움직이는 모음: `docs/art/discovery83-gallery.html`.
- 종류별 미리보기: `docs/art/discovery83-{nature,ruin,people}-preview.jpg`.

사람은 서로 다른 16개 동작 장면으로 만들며 전신과 악기가 잘리지 않게 칸 전체를 맞춘다.
자연은 기존 파노라마 합성기를 사용하되, 원화 속 해와 겹치지 않도록 추가 천체 효과를 끈다.
유적은 기존 복원 GIF 합성기를 그대로 사용한다. 재생 속도와 마지막 장면 처리는 기존 게임 규칙을 따른다.

투명한 원화는 종이색에 합성한 뒤 GIF로 바꾼다. 투명도를 버리면 가장자리의 숨은 RGB 값이 색 잡음으로 나타날 수 있다.
원화 검토 후 와디 럼·게르소파 폭포의 지형, 하우사 시트의 가장자리를 수정했고 지시는 `revisions.json`에 남겼다.
지형 확인 자료: [UNESCO 와디 럼](https://whc.unesco.org/en/list/1377/),
[카르나타카 관광청 게르소파 폭포](https://karnatakatourism.org/en/attractions/jog-falls/).

`python tools/discovery83/package.py`로 GIF 83개·목록·독립 미리보기 페이지를
`artifacts/discovery83-gifs.zip`에 묶는다.
