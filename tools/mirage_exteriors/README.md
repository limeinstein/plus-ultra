# 신기루 발견 위치별 외관 50개

`miragedisc.js`의 발견 위치에 맞춰 내장 ImageGen으로 장소별 외관을 제작한다.
기존 GIF의 마지막 장면을 건축 형태·색·재료 참고로 사용한다.

- 도시 18곳: 정면에서 본 완전한 건물·정원 외관, `images/landmarks/<id>.webp`.
  높이 520px의 실제 투명 배경이다. 기존 거리 배치 규칙을 그대로 사용한다.
- 육상 20곳·항해 12곳: 비스듬히 내려다본 입체 외관, `images/map-discoveries/mirage/<id>.webp`.
  512×512 투명 WebP와 지도용 4×4 판 두 장(`mirage-ruins-1.png`, `mirage-ruins-2.png`)을 만든다.
- 원화는 `sources/<id>.png`에 보존하며 Git에서는 제외한다. 생성 지시는 `prompts.json`.
- 전체 미리보기: `docs/art/mirage50-exteriors.html`, `mirage50-exteriors-preview.jpg`.
- 묶음: `artifacts/mirage50-exteriors.zip`.

```powershell
python tools/mirage_exteriors/build.py --ready
python tools/mirage_exteriors/build.py --preview --package
python tests/mirage50_exteriors.py
node tests/mirage50_exteriors_runtime.js
```

새 외관은 신기루의 출현·소멸 그림에도 사용한다. 야외 지도 모형은 그 연출이
지속되는 동안만 일렁이며 보이고, 신기루를 찾은 뒤 영구 표시로 남지 않는다.
미발견 위치를 새로 공개하거나, 발견 조건·보상·저장 형식을 바꾸지 않는다.
도시에서는 기존 `Town.vanish`가 사라지는 외관을 처리한다.
변환할 때 이번 외관의 이미지 목록과 도시 발치 표만 갱신하며 기존 항목은 보존한다.

`build.py --only <id>`로 한 곳만 변환하며, `--ready`는 도착한 새 원화만 처리한다.
`--preview`는 이미지 변환 없이 모음판을 갱신한다. 변환에는 Pillow를 사용한다.
