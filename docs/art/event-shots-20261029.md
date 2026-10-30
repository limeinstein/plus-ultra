# 역사 누락 장면과 소꿉친구·후계 이벤트 샷 (2026-10-29)

내장 ImageGen으로 역사 장면 26장과 인물 합성용 배경 11장, 모두 37장의 원화를 제작했다. 게임용 장면은 1881×836 WebP다. 기존 역사 인물·총사 27명의 초상을 참조해 얼굴과 복장을 맞추고, 원화는 `artifacts/event-shots-20261029/sources/`에 보존했다. 전체 실제 생성 지시문과 참조 경로는 `tools/event_shots_20261029_prompts.json`, 생성 결과 원본 위치는 같은 아티팩트 폴더의 `generated.json`과 `heir-additional-generated.json`에 있다. 외부 이미지 API·CLI는 쓰지 않았다.

## 역사 사건

명예혁명 7장·종교 개혁 6장·위그노 내전 4장·로마 약탈 5장·베스트팔렌 4장이다. 기존 사건이 부르던 그림 키로 등록했으며 사건의 날짜·진영·선택·보상은 바꾸지 않았다.

## 소꿉친구와 후계

단일 인물로 고정된 그림 대신 `G.EventShot`이 새 배경에 현재 저장의 실제 무릎상을 함께 그린다. 소꿉친구 32종의 얼굴·의상·계층, 기존 남성 친구와 옛 저장의 생김새를 그대로 쓴다. 후계자는 `G.HomeLife.chain`, 선대는 `heroHalf`, 노장은 `mateHalf`로 연결한다. 친구가 이주민 출신이어도 배경은 함께 자란 제독의 모항 출신권을 따른다.

- 자택 방문: `childfriend_visit`의 집 안에서 선대·후계자·친구가 만난다.
- 즉시 항해 합류·승계 시 합류: 출신권 8갈래의 부두에서 실제 후계자·친구가 함께 나온다.
- 자택의 「후계를 위한 안배」: `heir_council` 저녁 식탁에서 선대·후계자, 지금 부탁하는 옛 부하가 나온다. 선택창 앞에는 선대와 후계자만 나온다.
- 세대 교체: 선실의 `oldguard_arrange`에서 후계자를 부탁하고, 선택한 노장만 함께 나온다. 선대가 사망했으면 선대의 모습과 부탁 대사를 빼고 남은 사람들이 뜻을 잇는다.
- 노장들의 작별: 고향 부두에서 실제 떠나는 노장들이 나온다. 그림의 인물이 대화 인물을 가리지 않게 대화창에서는 얼굴상을 쓴다.

`family-events/childfriend_join`, `family-events/oldguard_farewell` 두 파일은 부두 배경의 공용 사본이다. 실제 사건에서는 모항에 맞는 배경과 실제 사람을 합성하며, 이 이름은 사건 그림 점검과 예전 그림 호출의 연결에도 사용한다. 따라서 원화 37장에 대응하는 게임 이미지 파일은 39개다.

연결: `js/systems/oldguard.js`의 `showShot`·정리 래퍼, `js/systems/heirplan.js`의 `pic`. 제목·그림 키는 `js/data/oldguard.js`, 인물 위치·크기는 `G.FX.oldGuardShot`에 모았다. 합류 충성도·후견 두 자리·거절·약속·저장 규칙은 기존 것을 쓴다. 대화 종료·취소·오류에서도 액자를 걷는다.

## 제작·검수

```powershell
python tools/event_shots_20261029.py
python tools/event_shots_20261029.py --check
node tests/event_shots_20261029_smoke.js
```

변환 도구는 생성 API를 부르지 않는다. 원본을 게임 규격으로 내보내고 역사·승계 배경 검수판을 만든다. `images/manifest.js`도 등록했다. 브라우저 검사는 새 이미지 실제 해독, 소꿉친구 32종·남성·이주민, 실제 선택한 후견 인물과 생존·사망 분기, 그림 없는 팩과 오류 시 정리를 확인한다. 실제 합류·후견·자택 방문·자택 부탁 및 역사 5갈래의 대화 액자도 확인한다. 모든 검사용 브라우저는 `finally`로 닫는다.

규칙 회귀 검사: `old_guard_smoke`, `childhood_friends_smoke`, `heir_plan_smoke`, `glory_smoke`, `reformation_smoke`, `huguenot_smoke`, `romesack_smoke`, `westphalia_smoke`. 실행 기록과 실제 화면은 `artifacts/event-shots-20261029/`에 남긴다.

## 원화와 게임 이미지

| 장면 | 게임 파일 |
|---|---|
| 암스테르담의 준비 | `images/legend-events/glory_amsterdam.webp` |
| 개신교의 바람 | `images/legend-events/glory_wind.webp` |
| 화이트홀의 국왕 | `images/legend-events/glory_whitehall.webp` |
| 군플리트의 함대 | `images/legend-events/glory_gunfleet.webp` |
| 템스강의 국새 | `images/legend-events/glory_seal.webp` |
| 프랑스로 떠난 왕 | `images/legend-events/glory_france.webp` |
| 권리 선언 | `images/legend-events/glory_banqueting.webp` |
| 면죄받은 자들 | `images/legend-events/lu_case.webp` |
| 참사회원의 포도주 | `images/legend-events/lu_wine.webp` |
| 수도사들의 맥주 | `images/legend-events/lu_beer.webp` |
| 추기경의 연회 | `images/legend-events/lu_feast.webp` |
| 성문 앞의 고발 | `images/legend-events/lu_accuse.webp` |
| 빈 맥주 통 | `images/legend-events/lu_freedom.webp` |
| 보르도의 전령 | `images/legend-events/huguenot_call.webp` |
| 보루 위의 아침 | `images/legend-events/huguenot_bastion.webp` |
| 라로셸의 봉쇄 | `images/legend-events/huguenot_blockade.webp` |
| 성벽 아래의 화해 | `images/legend-events/huguenot_peace.webp` |
| 안개 낀 로마의 성벽 | `images/legend-events/romesack_fog.webp` |
| 파세토의 피신 | `images/legend-events/romesack_passetto.webp` |
| 약탈의 여드레 | `images/legend-events/romesack_sack.webp` |
| 마키아벨리의 원고 | `images/legend-events/romesack_machiavelli.webp` |
| 행상인 옷을 입은 교황 | `images/legend-events/romesack_peddler.webp` |
| 뮌스터로 가는 배 | `images/legend-events/westphalia_barge.webp` |
| 뮌스터의 맹세 | `images/legend-events/westphalia_oath.webp` |
| 평화의 종 | `images/legend-events/westphalia_bells.webp` |
| 1624년의 교회 | `images/legend-events/westphalia_church.webp` |
| 지중해 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_med.webp` |
| 북유럽 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_north.webp` |
| 동아시아 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_east.webp` |
| 남아시아 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_south.webp` |
| 동남아시아 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_sea.webp` |
| 중동·북아프리카 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_mena.webp` |
| 사하라 이남 아프리카 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_africa.webp` |
| 아메리카 소꿉친구의 합류 배경 | `images/legend-events/oldguard_join_america.webp` |
| 후계자를 위한 안배 배경 | `images/legend-events/oldguard_arrange.webp` |
| 소꿉친구가 찾아온 집 | `images/family-events/childfriend_visit.webp` |
| 저녁 식탁의 후계 부탁 | `images/family-events/heir_council.webp` |


실행 결과: 게임 파일 39개 해독, 364개 검사항목, 친구 32종의 실제 합성 검수판, 자택·승계 대화 4가지와 역사 액자 5갈래를 확인했다. 위의 회귀 검사 8종도 모두 통과했고 콘솔 오류는 0개였다. 검사용 브라우저와 실행 과정은 종료했다.
