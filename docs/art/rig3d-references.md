# 돛·범장·망루와 거북선 보강 (2026-10-31)

36종 항해 기함의 돛과 선종별 목공·갑판 설비를 보강했다. [선박 작업실](../../test_ship_details.html)에서 자유 회전·확대와 망루·갑판·선수·선미의 근접 보기를 제공한다. [항해 시점 비교](../../test_ships_3d.html), [촬영 결과와 전체 목록](rig3d-review.html)도 함께 확인한다. 모델은 게임용 해석이며 특정 실선의 실측 복원은 아니다. 원래 게임의 선종명에는 여러 시대·지역의 배가 함께 들어 있으므로, 같은 선종 안에서도 선택한 범장 형식을 아래에 기록한다.

## 확인한 자료와 반영한 점

2026-10-31 웹 자료와 사용자 첨부 사진을 대조했다. 게임의 메시·텍스처를 가져오지 않고 기존 코드로 구조를 다시 만들었다.

| 자료 | 확인한 내용과 적용 |
|---|---|
| [대항해시대 Online 공식 스크린샷 공모전](https://www.gamecity.ne.jp/dol/sscontest/result03.htm) | 「湾内警備中」의 상업용 대형 갤리온, 다른 범선의 층별 돛 크기와 망루·줄사다리 실루엣을 확인했다. [해당 공식 이미지](https://www.gamecity.ne.jp/dol/sscontest/no3/image/Result/no9big.jpg). 사용자 첨부 온라인 화면도 함께 참고했다. |
| [대항해의길 공식 갤러리](https://dg.linekongkorea.co.kr/) | 공식 공개 일러스트·CG의 곡면 돛, 활대 들줄, 돛 가장자리 묶음과 큰 배의 선미 회랑을 살폈다. [범장 확대 이미지](https://dg.linekongkorea.co.kr/resources/img/imgthumb69.jpg), [범선 이미지](https://dg.linekongkorea.co.kr/resources/img/imgthumb2.jpg). 홍보 미술은 형태·표현 참고이며 역사 고증의 증거로 쓰지 않았다. |
| [The Mariners’ Museum: Galleon](https://exploration.marinersmuseum.org/watercraft/galleon/) | 지역에 따라 구성 차이가 있고, 일반적인 3개 돛대의 앞·중앙은 사각돛, 뒤는 라틴돛이라는 설명을 일반 갤리온에 적용했다. |
| [Royal Museums Greenwich: Great Harry 모형](https://www.rmg.co.uk/collections/objects/rmgc-object-66197) | 4개 돛대, 앞·중앙의 작은 상단 돛과 뒤쪽 라틴 범장 사례를 대형 갤리온 구분에 참고했다. 이 자료 자체가 19세기에 제작된 과거 선박의 재구성 모형이라는 점을 전제로 했다. 실선 치수를 그대로 복제하지 않았다. |
| [Vasa Museum: The sailing ship](https://www.vasamuseet.se/en/visit/exhibitions/sailing-ship) | 돛 층과 작업용 플랫폼의 실제 존재를 확인했다. 망루는 판재 바닥·열린 난간·승강구·밑받침으로 만들었다. 바사의 전체 범장을 그대로 모든 배에 적용하지 않았다. |
| [The Mariners’ Museum: Caravel](https://exploration.marinersmuseum.org/watercraft/caravel/) | 라틴 범장과 사각돛을 섞은 형식이 모두 있었음을 확인했다. 카라벨은 라틴형, 대형 카라벨은 혼합형으로 구분했다. |
| [The Mariners’ Museum: Dhow](https://exploration.marinersmuseum.org/watercraft/dhow/) | 인도양 라틴 범장을 유지하고 긴 대각선 활대와 작은 뒷돛을 구분했다. 바글라는 2개 돛대의 대형 교역선 형식으로 선택했다. |
| [The Mariners’ Museum: Junk](https://exploration.marinersmuseum.org/watercraft/junk-ship/) | 대나무 돛살과 곡선형 돛, 서양 범선과 다른 줄 구성을 참고했다. |
| [Science Museum: 5-masted Shantung junk](https://collection.sciencemuseumgroup.org.uk/objects/co41902/model-of-a-5-masted-shantung-trading-junk) | 5개 돛대의 간격·크기 차이와 자립 돛대 사례를 확인했다. 보선은 기존 게임의 5개 돛대 표현을 유지했다. 이 후대 모형을 명대 보선의 정확한 복원 자료로 해석하지 않았다. |
| 사용자 제공 거북선 복원선 사진 3장 | 선수 벽에 붙은 굵고 마디진 목, 열린 위·아래 턱, 이빨·눈썹·뿔·수염, 낮은 등판과 그 위로 올라간 두 돛을 반영했다. 현대 복원선 사진을 따른 외형이며 임진왜란 당시의 확정 복원으로 주장하지 않는다. |
| 사용자 제공 갤리온 모형·도안 | 모형 사진의 망루, 난간·활대·돛 층을 참고했다. 문신 도안의 과장된 층수와 지브 배열은 역사 근거로 채택하지 않았다. |

### 다른 선박의 추가 조사와 반영

| 자료 | 직접 확인한 범위와 적용 |
|---|---|
| [Barcelona Maritime Museum: Galera Reial](https://www.mmb.cat/colleccions/embarcacions/replica-galera-reial/) | 1568년 갤리의 현대 복제선 설명과 사진을 확인했다. 앞·중앙 두 돛대에 라틴돛을 둔 구성에 맞춰 `greatgalley`를 3개에서 **2개 돛대**로 수정했다. 갤리어스·지벡은 다른 선종이므로 각각의 3개 돛대를 유지했다. |
| [Museum Kaap Skil: Fluyt cross-section](https://kaapskil.nl/en/discover/collection-highlights/fluyt-ship-cross-section/) | 3개 돛대, 좁은 상갑판과 둥근 높은 선미의 설명 및 절개 모형 사진을 확인했다. 플류트의 화물선 비율을 유지하면서 외부 받침·목공 골조·작업 설비를 보강했다. |
| [German Maritime Museum: Bremen cog](https://www.dsm.museum/en/museum/exhibits/bremen-cog) | 1380년경 코그의 실제 발굴선 소개를 확인했다. 코그의 단일 사각돛과 높은 성루 형식을 유지하고 성루 지지재와 돛대 받침을 보강했다. 부품 치수를 이 발굴선의 실측치로 주장하지 않는다. |
| [Royal Museums Greenwich: Baghlah model](https://www.rmg.co.uk/collections/objects/rmgc-object-7051) · [Sharjah Museums 소장 바글라 소개](https://sharinghistory.museumwnf.org/database_item.php?id=object%3BAWE%3Bua%3B88%3Ben) | 모형의 선체·선미 사진과 소장품 설명을 확인했다. 높은 선미, 양옆 회랑과 목조 받침, 굽은 선수 장식을 바글라·다우 계열에 반영했다. 샤르자 사례는 19세기 말~20세기 초 형식의 복원선이므로 16세기 실선의 확정 고증으로 사용하지 않는다. |
| [국립해양문화재연구소 판옥선 복원설계 보도자료](https://www.korea.kr/briefing/pressReleaseView.do?newsId=156477497) · [첨부 도면 PDF](https://www.korea.kr/common/download.do?fileId=196195872&tblKey=GMN) | 2021년 보도자료와 **첨부 도면 3쪽을 실제로 열어 확인**했다. 두 돛과 방패벽, 열린 장대 위 가벼운 차양을 참고해 판옥선의 닫힌 기와집을 기둥·난간·사다리가 드러나는 지휘대로 교체했다. 전체 학술 보고서를 읽거나 모든 치수를 복제한 것은 아니다. |
| [Science Museum: Shantung junk](https://collection.sciencemuseumgroup.org.uk/objects/co41902/model-of-a-5-masted-shantung-trading-junk) | 자립 돛대와 Y자 받침, 여러 갈래 돛 조임줄, 선미 작업대 설명을 추가 확인했다. 사선에 돛대 받침을, 정크 계열에 선미 작업대·키 인양 기둥·돛살별 조임줄을 보강했다. 후대 모형이므로 명대 보선과 동일하다는 뜻은 아니다. |
| [Museum of Maritime Science: 천하일 안택환 그림](https://jmapps.ne.jp/maritime_science/det.html?data_id=12196) | 박물관의 1635년 안택환 설명을 확인했다. 기존 일본선의 방패벽·상부 선루를 유지하고 안택선에 회랑·처마 받침을 추가했다. 이미지 원본은 접근 오류로 열지 못했으므로 해당 그림을 세밀하게 재현했다는 주장은 하지 않는다. |
| [Science Museum: Mediterranean xebec](https://collection.sciencemuseumgroup.org.uk/objects/co41938/contemporary-rigged-model-of-a-mediterranean-xebec) | 1800년경 모형의 세 라틴돛 설명을 확인했다. 기존 지벡의 3개 돛대 형식을 유지했다. 선종 특징의 후대 사례이며 게임 배의 정확한 연대를 입증하지 않는다. |
| [Kon-Tiki Museum: experimental seafaring](https://www.kon-tiki.no/en/news/how-kon-tiki-launched-a-worldwide-age-of-experimental-seafaring) · [Kon-Tiki 2 탐험](https://kontiki2.com/) | 통나무 뗏목과 구아라 조향판의 현대 실험 항해 사례를 참고했다. 발사의 통나무 결박을 실제 통나무 표면에 붙이고 목제 조향판·손잡이를 추가했다. 고대 선박의 정확한 배치를 복원한 것은 아니다. |
| 추가 사용자 제공 거북선 자료 4장 | 복원선 측면 사진, 그림 2장, 회색 용머리 조각상 사진을 확인했다. 특히 조각상에서 이어진 주둥이·둥근 입가·불꽃 눈썹·겹친 볼 비늘·세 갈래 뿔·턱수염을 읽어 용두를 다시 만들었다. 모두 현대 표현 자료라는 한계를 유지한다. |

확인한 복제선·절개 모형 사진과 판옥선 첨부 도면은 `artifacts/rig3d-20261031/references/`에 검토용으로 두었다. 게임 실행 자산에는 포함하지 않는다. 종·코라코라·파라우·푸스타·맹선 등은 기존 지역별 형식을 유지하며 결박·받침과 돛 연결을 개선한 것으로, 모든 36종의 특정 연대별 원형을 독립 검증했다는 뜻은 아니다.

## 36종 적용 목록

`js/data/seafx.js`의 `G.FX.shipRig.profiles`에 돛대 위치·높이·종류·층수·폭을 각각 둔다. 표의 ‘층’은 사각돛 한 돛대의 층수이며, 이물 아래 보조 돛은 따로 붙는다. 아래 표는 **이번 모델에서 선택한 구성**이다.

| 선종 ID | 구성 |
|---|---|
| barca, cog | 단일 사각돛. 코그의 망루를 돛 위쪽으로 옮겨 간섭 방지 |
| hulk | 2개 돛대, 앞 2층·뒤 1층 사각돛 |
| caravel | 2개 돛대 라틴 범장 |
| lcaravel | 3개 돛대, 앞 2층 사각돛·뒤 2개 라틴돛 |
| pinnace | 앞 2층 사각돛·뒤 라틴돛 |
| carrack | 앞·중앙 2층 사각돛·뒤 라틴돛 |
| lcarrack | 앞·중앙 2층 사각돛·뒤 2개 라틴돛 |
| hcarrack | 앞·중앙 3층 사각돛·뒤 2개 라틴돛 |
| galleon | 3개 돛대, 앞·중앙 2층 사각돛·뒤 라틴돛·망루 2개 |
| lgalleon | 4개 돛대, 앞·중앙 3층 사각돛·뒤 2개 라틴돛·망루 4개 |
| fluyt | 앞·중앙 2층 사각돛·뒤 라틴돛 |
| frigate | 3개 돛대, 앞·중앙 3층 사각돛·뒤 라틴돛을 쓰는 초기 범장 해석 |
| tartane | 단일 라틴돛과 이물 삼각돛 |
| galley, fusta, parau | 단일 긴 라틴돛, 기존 노 유지 |
| greatgalley | Galera Reial 자료에 맞춘 앞·중앙 2개 돛대 라틴형 |
| galleass, xebec | 3개 돛대 라틴형, 중앙 돛을 크게 조정. 지벡에 이물 삼각돛 |
| dhow, sambuk, baghlah | 큰 앞 라틴돛·작은 뒤 라틴돛 |
| jong | 기존 4개 돛대를 유지한 기울어진 탄자돛, 위·아래 활대 |
| korakora | 삼각 받침 돛대와 단일 탄자돛 |
| junk | 2개 돛대, 7칸 돛살을 가진 비대칭 정크돛 |
| shachuan, ljunk | 3개 돛대, 중앙의 큰 정크돛 |
| baochuan | 5개 돛대, 중앙이 높고 양 끝은 작은 정크돛 |
| maengseon, panokseon | 2개 돛대, 횡방향의 8칸 조선 돛. 지붕과 상갑판 위로 높이 보정 |
| geobukseon | 사진에 맞춘 2개 돛대와 8칸 황토색 돛. 등판 위 최소 간격 4.5 모델 단위 |
| kobaya, sekibune, atakebune | 단일 사각돛, 위·아래 활대. 안택선의 지붕 간섭 제거 |
| balsa | 단일 직조 사각돛, 위·아래 활대와 두 갈래 돛대 |

### 선종별 추가 구조

| 선종 ID | 정밀 보강한 부분 |
|---|---|
| barca, caravel, lcaravel, pinnace, tartane, frigate | 돛대 받침·볼받침·쐐기, 갑판 펌프·빌레이 핀·밧줄 고리. 범장에 맞는 도르래와 데드아이 연결 |
| cog, hulk, carrack, lcarrack, hcarrack, fluyt | 위 설비와 성루 외부 지지재·무릎재, 포문 덮개·들줄 |
| galleon, lgalleon | 정밀 선미 회랑·갑판 설비에 더해 실제 구멍이 있는 망루, 돛대 접합부와 도르래·데드아이 |
| galley, fusta, greatgalley, galleass, xebec, parau | 긴 라틴 활대의 결박과 도르래, 실제 노 회전축에 맞춘 받침·노 고정핀·바깥 보 받침 |
| dhow, sambuk, baghlah | 라틴 활대·돛대 받침, 굽은 선수 목공과 결박. 바글라에는 선미 양옆 회랑·지지재·원형 조각 |
| junk, shachuan, ljunk, baochuan | 돛살마다 조임줄, 돛대 위 들줄, 선미 작업대·키 인양 기둥. 사선에 Y자 돛대 받침 |
| maengseon, panokseon | 돛대 가로대·들줄, 방패벽 사격구와 덮개, 노 받침. 판옥선에 열린 지휘대·난간·사다리·차양 |
| geobukseon | 낮은 등판 위 두 돛과 정밀 용두. 목재 조각선·눈꺼풀·눈썹·볼 비늘·뿔·수염·곡선 송곳니 |
| kobaya, sekibune, atakebune | 돛대 가로대·들줄, 노 받침, 사격구·덮개. 소조에 대나무 방패, 안택선에 상부 회랑·처마 받침 |
| jong | 탄자돛, 야자 지붕의 골조·결박, 갑판 무릎재 |
| korakora | 부판 연결 보의 결박·대각 지지대, 삼각 돛대 묶음과 노 받침 |
| balsa | 통나무마다 맞춘 결박, 두 갈래 돛대 묶음, 목제 조향판과 손잡이 |

## 구현과 동작

- `tools/ship3d/rig_detail.js`: 선루·갑판집의 실제 높이를 받아 돛 아래 끝을 잡는다. 사각돛의 윗층은 머리가 좁고 발이 넓게, 코스는 더 깊게 부풀도록 분리했다. 사각돛 아래의 활대는 일본선·뗏목에만 둔다.
- 망루: 판재 바닥에 **실제 승강구를 뚫고** 16개 난간 기둥, 위·아래 둘레 난간, 방사형 밑받침, 승강 사다리와 돛대 볼받침·접합 모자를 만들었다. 앞·중앙 돛대의 줄사다리와 상부 버팀줄을 연결했다. 활대의 도르래는 양쪽 볼판·바퀴·축·줄 고리를, 버팀줄 아래 데드아이는 구멍 3개와 연결줄을 갖는다.
- `tools/ship3d/galleon_detail.js`의 정밀 미술을 대형 갤리온에도 적용해 회랑·창틀·계단·갑판 설비를 보강했다.
- `tools/ship3d/turtle_detail.js`: 거북선의 방패벽·낮은 등판, 복원선형 용두와 별도 돛 배치. 용두는 이마와 주둥이를 연속 곡면으로 만들고 열린 입과 굽은 이빨, 겹친 비늘과 눈썹을 별도 입체 조각으로 붙였다. 목 윗부분이 입 안을 가리지 않도록 뒤로 굽혔다. 목재 잔결을 별도 생성해 선체 판재 이음이 얼굴에 생기지 않게 했다.
- `tools/ship3d/fleet_craft.js`: 위 표의 지역별 갑판 구조와 목공 부품을 추가한다. 기존 선루의 실제 높이와 노의 회전축 좌표에 맞춰 배치한다.
- `tools/ship3d/runtime_rig.js`: 활대·돛살·테두리 줄·아랫귀 조임줄을 실제 천의 변형에 연결한다. 윗돛 아랫귀는 아래 활대에 연결하고, 이물 삼각돛의 고정 꼭짓점은 유지한다. 움직이는 활대 장식도 재질별로 묶는다.
- 생성: `python tools/ship3d/build_runtime.py`. 출력 `js/art/ship-models.js`. 실행 중 외부 파일 요청이나 서버는 필요 없다.
- `test_ship_details.html`: 게임과 같은 모형·배치 처리를 사용하며 그래픽 장치 하나로 36종을 바꾼다. 드래그 회전, 휠 확대, 여섯 부분 보기, 돛 접기와 방향 조절을 제공한다. `G.Ship3D.buildInspection`은 병합 전 부품 경계를 보관해 실제 망루와 고유 구조로 카메라를 이동한다.
- 게임 성능·배 ID·저장 상태·바다 파도는 변경하지 않는다. 적용 범위는 기존과 같은 항해 기함이다.

## 검증

`tests/rig3d_details.cjs`: 36종 × 전개/반 접기/접기 × 양쪽 바람·정면에서 천의 유한 좌표와 선루 간섭, 망루 구조와 게임 선박 자료 불변을 검사한다. 실제 모델을 근접 카메라로 촬영한다.

`tests/turtle3d_smoke.cjs`: 용두 필수 구조, 입 안이 막히지 않았는지 확인하는 6개 광선 검사, 두 돛의 횡방향 배치, 36개 조합의 지붕 간격, 재생성 결과, 확대·정면·측면을 검사한다.

`tests/ships3d_smoke.cjs`: 36종의 방향·접기·노·화면 경계·동적 끈 부착·자원 안정·그래픽 장치 복구·항해 통합을 검사한다. 최신 정밀 보강 결과는 [GPU 기록](../../artifacts/craft3d-20261031/gpu/report.json), [소프트웨어 기록](../../artifacts/craft3d-20261031/software/report.json)에 분리한다. 측정값은 읽기 동기화를 포함한 테스트 환경의 프레임 처리 시간이며 게임 전체 FPS가 아니다.

`tests/ship_inspection.cjs`: 36종의 고유 부품과 좌표, 망루 바닥의 실제 승강구, 반복 선종 전환·돛 동작 때 자원 안정, 회전·확대와 그래픽 장치 복구를 검사한다. [GPU 상세 검사](../../artifacts/craft3d-20261031/gpu/inspection.json), [소프트웨어 상세 검사](../../artifacts/craft3d-20261031/software/inspection.json). 36종 각각의 근접 사진도 저장한다.

최종 전체 검사: RTX 3050/D3D11과 SwiftShader 모두 36종·실제 항해 대표 11종 통과, 콘솔 오류 0, 선종 전환 시 그래픽 장치 1개 유지, 저장 상태 불변. 36종의 구조 검사에서는 천과 선루 사이 82,361개 표본을 확인했다. 사각돛 모서리와 활대 중심선의 최대 간격은 0.551 모델 단위 이하로, 활대 반지름·묶음 여유 안에 있다.

| 항목 | GPU | SwiftShader |
|---|---:|---:|
| 갤리온 프레임 처리 중앙값 | 6.7ms | 46.4ms |
| 갤리온 95백분위 | 14.5ms | 53.7ms |
| 거북선 프레임 처리 중앙값 | 4.3ms | 76.3ms |

동일 시험의 36종 범위는 그리기 21–66회, 삼각형 10,792–71,572개다. 거북선은 29회·55,596개다. GPU와 소프트웨어 수치는 서로 구분하며, 측정 당시 시스템 부하와 기본 확대 화면·지도 기함 크기에 따라 결과가 달라진다. 소프트웨어 렌더링에서는 정밀 용두의 비용이 커졌다. 시험 브라우저는 각 시험의 `finally`에서 닫는다.
