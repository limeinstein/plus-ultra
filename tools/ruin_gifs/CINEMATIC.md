# 역사·종교 발견물 시네마틱 GIF

기존 V2 원화와 GIF는 그대로 둡니다. 새 V3는 다음 순서가 한 번에 이어지는 4×4 원화를 씁니다.

1. 나무 제도 테이블과 청사진 위의 미니어처 공사
2. 기초 → 골조 → 외장 → 완공
3. 같은 시점의 실제 역사 공간으로 전환
4. 입구로 다가가 내부를 두 방향으로 둘러본 뒤 밖으로 나옴
5. 건물 전체를 360도 돌며 낮 → 늦은 오후 → 노을 → 밤 → 새벽 → 낮으로 변화

거석·지상화·다리처럼 실제 실내가 없는 발견물은 방을 지어내지 않고, 입구·통로·중앙 공간과 구조 사이를 사람 눈높이로 답사합니다.

## 프롬프트 목록

게임에 등록된 유적 216개의 프롬프트를 JSON으로 확인합니다.

```powershell
node tools/ruin_gifs/cinematic_prompts.js --out tools/ruin_gifs/cinematic-prompts.json
node tools/ruin_gifs/cinematic_prompts.js --only bulguksa --out tools/ruin_gifs/bulguksa-cinematic-prompt.json
```

각 프롬프트로 만든 2048×1536, 정확한 4열×4행 원화를 다음 위치에 둡니다.

```text
tools/ruin_gifs/v3/master/발견물ID.png
```

원화 한 장은 서로 무관한 그림 16개가 아니라 같은 건물·같은 장소·같은 출입구가 이어지는 스토리보드여야 합니다. 1~5칸만 도면 위 미니어처이며, 6칸부터는 실물 크기의 실제 공간입니다.

## GIF 만들기

먼저 게임 파일을 덮지 않는 미리보기로 확인합니다.

```powershell
python tools/ruin_gifs/build_cinematic.py --preview --only bulguksa
```

확인 뒤 게임용 GIF·마지막 장면을 만듭니다.

```powershell
python tools/ruin_gifs/build_cinematic.py --only bulguksa
python tools/ruin_gifs/sheets.py bulguksa
python tools/images.py
```

V3 GIF도 576×256, 16프레임, 9.82초 반복이며 기존 발견 연출 시간과 맞습니다. 마지막 칸의 해 뜨는 장면에서 첫 외부 낮 장면으로 이어져 시간과 360도 회전이 모두 닫힙니다.
