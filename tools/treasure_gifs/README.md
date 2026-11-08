# 보물 발견 GIF 만들기

## 2026-11-08 원화·전시 보강

`profiles_20261108.json`의 95종은 큰 회절광을 줄이고 원래 재질색을 보존한다. 첫 15종과 추가 13종의 원화·기존 사진·전체 제작 지시문·교체 전 파일은 `revision_20261108/`에 있다. 사진 여섯 작품에는 없는 뒷모습을 만들지 않고 조명과 완만한 확대만 적용한다. 다른 67종은 기존 원화를 유지한다.

`build.py --only ID`는 보강 대상의 GIF·종료 JPG와 함께 원색 WebP 장면 판도 만든다. `ruin_gifs/sheets.py ID`로 다시 만들어도 보강 대상은 원색 장면을 사용한다. 전체 제작에서는 별도 완성된 이야기 장면 일곱 종과 `creation`·`birthvenus`·`laocoon`을 건너뛴다.

검사: `python tests/treasure_revision_20261108_files.py`, `node tests/treasure_revision_20261108_smoke.cjs`. [전체 변경 전후](../../artifacts/treasure-upgrade-20261108/report.html), [사진 출처·이용 조건](../../images/TREASURE-CREDITS.md).

물건형 보물 발견물 97종을 어두운 박물관 전시실에서 두 번
360° 회전하는 `images/discoveries/ID.gif`로 만듭니다. 투탕카멘 보물
(`tutankh`)은 사용자가 예로 든 앙크를 중심 전시물로 삼고 스카라베와 운석
단검을 함께 배치했습니다.

보물 분류의 나머지 한 곳인 `solomon`은 물건이 아니라 광산 전경이므로 기존
자연 경관 파노라마 GIF를 그대로 씁니다. 따라서 게임의 보물 98종은 모두
움직이되, 97종은 이 도구의 2회전 전시 연출이고 한 곳은 장소 파노라마입니다.

원화 `sources/ID.png`는 동일한 보물의 45° 간격 시점 여덟 장을 4×2로 담습니다.
빌더는 이 시점을 `0°→315°→0°` 순서로 두 번 재생하고 다음 효과를 합성합니다.

- 거의 완전한 암흑의 전시실과 위에서 움직이는 큐레이터 스포트라이트
- 금속·옥·수정 표면을 스치는 별 모양 하이라이트
- 다이아몬드에 백색광을 쏜 듯한 짧은 무지개 회절광과 빛가루
- 정면에서 가장 밝게 멈추는 피날레

최종 GIF는 576×256, 24프레임, 8.4초입니다. 마지막 정면 장면 JPG도 함께
만들며, 게임에서는 WebP 장면 판으로 바꿔 같은 8.4초 동안 부드럽게 재생합니다.

```powershell
python tools/treasure_gifs/build.py
python tools/ruin_gifs/sheets.py beowulf kingjohn agamemnon tutankh rosetta sargon urcrown goldplate ewer shiva goldelephant jadesuit bronze cloisonne seismo glassbowl goldseal crystalskull eldorado jademask grail stcrown reliquary ifehead
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/treasure_gifs/build.py --only crystalskull
python tools/ruin_gifs/sheets.py crystalskull
python tools/images.py
```

원화는 Codex의 내장 이미지 생성 도구로 만들었습니다. 공통 프롬프트와 보물별
주제 지정은 [`PROMPTS.md`](PROMPTS.md)에 기록되어 있습니다.

## 절차적 3D 원화 (2026-10-04)

그림이 없던 보물 63종(신라 금관~피리 레이스 지도, 난파선 보물)의 원화는 `tools/procedural_art`로 만들었습니다.
자세한 방법은 그 폴더의 README를 보세요. 교역품 28종의 시장 장면은 `tools/trade_gifs`에 있습니다.
