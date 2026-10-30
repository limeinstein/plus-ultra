# 임진왜란 인물 얼굴상·무릎상 교체 (2026-10-30)

사용자가 첨부한 복식과 역동적인 자세를 참고해 내장 ImageGen으로 15명의 얼굴상·무릎상, 총 30장을 제작했다. 인물마다 얼굴형·나이·수염·시선·표정을 달리하고 같은 인물의 얼굴상과 무릎상은 같은 원화를 참조했다.

- 얼굴상: 1024×1024 WebP, 투명 배경.
- 무릎상: 1024×1536 WebP, 투명 배경.
- 지정 참고: 1번 이순신, 4번 허준, 5번 곽재우, 6번 사명대사 유정.
- 권율·김시민·신립·원균은 무관 복식, 송상현은 문관 복식. 선조·광해군은 왕·세자 복식으로 구분했다.
- 고니시는 일본식 갑옷, 진린은 명나라 장수 차림, 김덕령은 본문 설정에 맞춘 상복 차림이다.
- 역사적 외모의 복원이 아니라 사용자의 복식 참고와 게임 설정을 따른 인물화다.

전체 비교: [imjin-portraits-preview.jpg](imjin-portraits-preview.jpg)

아래 경로는 `images/portraits/` 기준이며 얼굴은 `.webp`, 무릎상은 `_half.webp`다. 기존 사건·동료의 그림 선택 순서에서 새 파일이 실제로 선택되는지 확인했다.

| 인물 | 그림 경로 | 자세·표정 |
| --- | --- | --- |
| 이순신 | `mates/h_yisunsin` | 참고 검을 하늘 높이 치켜드는 모습, 20년 젊은 얼굴과 힘찬 외침 |
| 허준 | `mates/h_heojun` | 의서를 안은 모습, 온화한 걱정 |
| 곽재우 | `legendary/gwak_jaeu` | 활을 당기는 모습, 집중한 시선 |
| 사명대사 유정 | `legendary/samyeong_daesa` | 석장·염주, 온화한 미소 |
| 권율 | `legendary/gwon_yul` | 검을 내미는 모습, 침착한 노장 |
| 김시민 | `legendary/kim_simin` | 창을 내지르는 모습, 지휘하는 외침 |
| 신립 | `legendary/sin_rip` | 명령하는 손짓, 자신감 있는 인상 |
| 원균 | `history/wongyun` | 술잔을 든 모습, 둥글고 붉은 얼굴 |
| 송상현 | `history/songsanghyeon` | 길을 막는 손짓, 단호한 눈빛 |
| 선조 | `legendary/seonjo` | 뒤돌아보는 모습, 불안한 표정 |
| 광해군 | `history/gwanghae` | 생각에 잠긴 모습, 젊고 진지한 인상 |
| 고니시 유키나가 | `legendary/konishi_yukinaga` | 검과 펼친 손, 경계하는 시선 |
| 진린 | `history/chenlin` | 지휘하는 손짓, 자신감 있는 외침 |
| 논개 | `legendary/nongae` | 삿갓을 든 모습, 미소와 또렷한 눈빛 |
| 김덕령 | `legendary/kim_deokryeong` | 철퇴를 든 모습, 젊은 장수의 외침 |

## 원화와 다시 만드는 법

최종 제작 지시문·참고 번호·파일 대응은 `tools/imjin_portrait_prompts.json`에 있다. `artifacts/imjin-portraits-20261030/sources/`에 최종 원화 30장, `references/`에 사용한 참고 이미지, `before/`에 교체 전 그림을 보관했다.

`node tools/package_imjin_portraits.js`는 원화를 보존하고 WebP를 내보내며 그림 목록과 비교판을 만든다. 제작 도구에만 `sharp`를 쓰며 게임에는 새 의존성을 더하지 않았다.

이순신 추가 수정: 사용자의 검 사진을 참고해 지휘봉을 검으로 바꾸고 약 20년 젊은 얼굴로 수정했다. 투구 꼭대기의 삼지창 모양 장식도 둥근 장식으로 바꿨다. `tools/imjin_yisunsin_sword_revision.json`에 수정 지시문을, `artifacts/imjin-portraits-20261030/revisions/yisunsin-sword/`에 검 참고와 수정 전 원화를 보관했다. 이순신만 다시 내보낼 때는 `node tools/package_imjin_portraits.js yisunsin`을 쓴다.

그림 교체 뒤 `tools/portrait_faces.py --key <그림 키> --merge`로 대상 30장의 눈·입·얼굴 상자를 다시 계산했다. 다른 인물의 기존 좌표는 유지했다.

## 검증

`node tests/imjin_portraits_smoke.js` 통과: 15명의 실제 얼굴·무릎상 선택, 30장 해독·해상도·투명도·얼굴 좌표, 실제 대화 화면 15장을 확인했다. `pageerror`·`console.error`는 없었다. 대화 화면과 검사 결과는 `artifacts/imjin-portraits-20261030/screenshots/`에 보관했고 확인용 브라우저는 종료했다.
