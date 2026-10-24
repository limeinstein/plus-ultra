# 어린 왕자 인물화와 사건 그림

사용자가 제공한 `38171.jpg`의 얼굴, 검은 머리, 푸른 눈, 푸른 꽃무늬 두건을 시각 참고로 삼았다. 원본 화면의 앱 UI와 설경은 그림에 넣지 않았다. **소년 왕자로 다니는 여자**라는 설정을 유지하며, 사용자의 요청에 따라 처음 만든 푸른 꽃무늬 두건·숄과 아이보리색 여행옷으로 되돌렸다. 제작 도구는 Codex 내장 ImageGen이다.

| 파일 | 제작 지시 요약 |
|---|---|
| `images/portraits/legendary/little_prince_half.png` | 참고 인물의 얼굴, 푸른 꽃무늬 두건·숄, 아이보리색 겹옷, 여행 가방과 별 지도를 살린 초기 복장. 머리부터 무릎까지, 사실적인 회화풍, 투명 배경. |
| `images/portraits/legendary/little_prince.png` | 위 무릎상과 동일한 얼굴·옷차림의 정사각형 얼굴상. 가슴 위 구도, 투명 배경. |
| `images/legend-events/little_prince_meet.png` | 푸른 꽃무늬 두건과 아이보리색 여행옷 차림의 어린 왕자가 해 질 녘 사막 언덕에서 탐험대를 만나는 장면. 16세기 항해 탐험 분위기, 가로로 긴 사건 그림. |
| `images/legend-events/little_prince_campfire.png` | 별이 뜬 사막의 모닥불 곁에서 어린 왕자와 제독이 음식을 나누는 장면. 제독의 모자는 16세기 연질 보닛으로 수정. |
| `images/legend-events/little_prince_map.png` | 사막 천막 안에서 세 언덕, 우물과 별이 있는 지도를 함께 그리는 장면. |
| `images/legend-events/little_prince_well.png` | 새벽 사막에서 우물물을 마시는 어린 왕자와 모래 속 궤짝을 찾는 정찰대. |
| `images/legend-events/little_prince_reveal.png` | 처음 복장을 그대로 입은 어린 왕자가 우물가에서 두건을 뒤로 젖혀 정체를 밝히고, 제독·정찰대가 그 이야기를 듣는 장면. |

인물화는 투명 PNG이며, 사건 그림은 `G.FamEv.showPic`이 사용하는 약 2.25:1 비율의 PNG다. 모두 `python tools/images.py`로 `images/manifest.js`에 등록했다.
