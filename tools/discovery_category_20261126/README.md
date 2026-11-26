# 발견물 기존 GIF 재사용·중복 정리

불국사·콜로세움을 비롯해 기존 완성본이 있는 발견물은 새 이벤트 그림으로 다시 만들지 않는다. 발견물 928종의 GIF·마지막 장면·재생 시트 2,784파일을 원래 갈래별 완성본으로 복구했다. `reuse-native.json`에는 복구 대상과 기존 SHA-256을 남겼다.

폐기한 회화 확대·축소 재제작본, 그 복사 원화·수정본·미리보기는 삭제했다. 삭제 파일과 크기는 `deduplication.json`에 기록한다. 배포 스냅샷과 다른 작업의 산출물은 이 정리 대상에 넣지 않는다.

SHA-256이 같은 날치·복어 파일은 바다 발견물 경로 하나로 모았다. 발견물 ID와 옛 저장 키는 유지한다. `asset-overrides.json`을 `tools/images.py`도 읽기 때문에 목록·웹판·GIF 팩을 다시 만들어도 중복 파일 경로로 돌아가지 않는다. 동물 GIF·시트 출력기도 통합한 파일을 다시 만들지 않는다.

앞으로 빠진 파일만 해당 갈래의 제작기로 보완한다. 유적은 `ruin_gifs/CINEMATIC.md`, 자연은 `nature_gifs`, 식물은 `plant_gifs`, 동물은 `animal_gifs`, 민족은 `discovery83`, 향신료는 `trade_gifs`, 보물은 `treasure_gifs`, 지리 발견은 `geo_gifs`의 규격을 사용한다. 보물은 전시형이며 회화는 작품을 고정하고 감상객이 움직이는 미술관 구성을 사용한다. 한 장짜리 사건 삽화의 확대·축소를 이들 연출의 대체물로 승인하지 않는다.

검사: `python tests/discovery_reuse_20261126.py`, `python tests/discovery_assets_smoke.py`, `node tests/discovery_reuse_20261126_smoke.cjs`, `node tests/discovery_gif_all_20261126_smoke.cjs --only-playback`.
