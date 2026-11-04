# 미생성 사건 샷 보완 — 금봉호와 왕서방·명월

2026-11-04 사용자 요청. 이 채팅에서 요청한 사건의 그림 열쇠를 파일·등록 목록과 비교했다. 아프리카 10장, 사파비 성립·찰디란·모하치 12장은 모두 있었다. 금봉호의 기존 장면 3장이 미생성이었고, 분리된 왕서방·명월 사건에는 아직 장면 호출이 없어 만남·거래 장면 2장을 더한다. 이 채팅 범위의 사건 샷은 모두 27장이 된다.

## 추가 그림 다섯 장

| 열쇠 | 장면·등장인물 | 표시 시점 |
|---|---|---|
| `wm_junk` | 중국 근해 금봉호의 마대인·딸 지나 | 금봉호를 만날 때 |
| `wm_deal` | 비단·백자·차를 두고 셈하는 마대인·지나 | 물건과 값을 설명할 때 |
| `wm_jina_leave` | 장부를 안고 새 배로 떠나는 지나와 아버지 | 세 번 거래한 뒤 지나 합류 대화 |
| `wangmoon_port` | 조선 포구에서 만난 왕서방·명월 | 한양·동래에서 첫 만남 |
| `wangmoon_deal` | 명월의 품질 확인과 왕서방의 대금 준비 | 조선산 짐의 견적 대화 |

금봉호와 조선 포구의 두 사건은 사람과 배경을 구별한다. 지나는 등록된 푸른 꽃무늬 반팔 옷·꽃 장식·밝은 표정, 명월은 등록된 흰 치마·비녀·노리개·미소를 이어 쓴다. 이번에는 초상이나 체형을 바꾸지 않는다. 방문 제독은 특정 얼굴로 고정하지 않는다.

![새 사건 샷 다섯 장](merchant-event-shots-20261104-preview.jpg)

## 파일과 생성 지시문

내장 **ImageGen**으로 각 장면을 따로 제작하고 현재 등록된 인물 그림을 인물·복식 참조로 사용한다. 전체 풍경을 새로 그리며 투명 초상을 빈 배경에 붙이는 방식은 쓰지 않는다.

- 게임용: `images/legend-events/<열쇠>.webp`, 1881×836.
- 원본 PNG: `artifacts/merchant-event-shots-20261104/sources/`.
- [게임용 다섯 장·미리보기·지시문 ZIP](../../artifacts/merchant-event-shots-20261104/merchant-event-shots-20261104.zip).
- [정확한 생성 지시문·참조 역할·원본 경로](../../tools/merchant_event_shots_20261104_prompts.json).
- [내보내기 도구](../../tools/package_merchant_event_shots_20261104.py).
- [생성 전 누락 검사](../../artifacts/merchant-event-shots-20261104/before-audit.json).
- [최종 파일·등록 검사](../../artifacts/merchant-event-shots-20261104/after-audit.json).

`images/manifest.js`에는 새 다섯 열쇠만 합친다. 금봉호는 기존 세 호출을 그대로 사용한다. `js/systems/wangmoon.js`에는 첫 만남·품질 확인 대화의 그림 표시와 `finally` 정리를 더한다. 거래 값·합류 조건·저장 상태·등장 간격은 바꾸지 않는다.

## 검사

```powershell
python tools/package_merchant_event_shots_20261104.py
python tools/audit_requested_event_shots_20261104.py
node tests/merchant_event_shots_20261104_smoke.cjs
node tests/wangmoon_smoke.cjs
```

전용 검사는 새 그림 다섯 장의 해독·규격·대화 얼굴·표시·종료와 실제 사건의 그림 호출, 두 사건의 인물·거래 기록 분리, 대화 오류 뒤 그림과 진행 잠금 정리를 확인한다. [화면과 결과](../../artifacts/merchant-event-shots-20261104/screenshots/checks.json). 기존 금봉호 흥정·세 번 거래 뒤 지나 합류와 왕서방·명월 독립 거래도 별도 검사한다. 브라우저는 성공·실패 모두 `finally`에서 닫는다.

결과: 세 브라우저 검사 모두 통과했으며 `pageerror`·`console.error` 0건이었다. 금봉호의 할인·흥정·거래 세 번 뒤 합류와 왕서방·명월의 독립 거래·저장 복원·사양 분기도 유지됐다. 최종 호출·등록·파일·해독·규격 검사에서 이 채팅 범위의 27장 모두 정상, 누락 0장이다. 새 다섯 장 ZIP의 CRC 검사도 통과했다.
