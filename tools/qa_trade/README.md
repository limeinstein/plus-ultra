# 교역 1억 QA 도구 (2026-11-07)

새 게임(1480년, 소지금 3,000)에서 **교역만으로 재산(소지금+금고) 1억**을 노리는 봇을 여러 판 돌려, 어느 교역로가 돈을 버는지·어디서 막히는지 본다.
결과 보고서: `docs/qa/trade-1e8-2026-11-07.md`

| 파일 | 하는 일 |
|---|---|
| `tradebot.js` | 페이지 안 봇 `window.TB` — 팔기·수리·배 사기·선원·구간 계획·보급·사기·날 넘기기. `tools/qa_longrun/qalib.js` 뒤에 넣는다 |
| `run.js` | 판마다 새 페이지로 새 게임을 열고 `TB.run(opt)` — `OUT/runs.jsonl`(판 요약)·`OUT/legs_<번호>.json`(구간 기록) |
| `sail.js` | 봇이 많이 쓴 길을 실제 바다 장면(`QA.voyage`: 바람·폭풍·해적·사건)으로 몰아 걸린 날을 비교 |

## 돌리는 법

```bash
# 판 설정 배열(JSON)을 PLAN으로 주면 판 번호(i)로 고른다. 없으면 run.js optFor()
PLAN=tools/qa_trade/plan100.json OUT=/tmp/qa_trade RUNS=12 FROM=0 node tools/qa_trade/run.js   # 2026-11-07 100판 설정
REP=3 OUT=/tmp/sail.json node tools/qa_trade/sail.js
```

판 설정(opt): `nation` PT/ES · `brain` oracle(모든 항구 시세를 안다)/ledger(들른 항구의 장부만 안다) · `maxLeg` 한 구간 최대 날 · `look` 두 구간 앞 보기 · `shipK` 배값의 몇 배가 있어야 배를 사나 · `endY` · `realMin` 실제 분 상한 · `enterEvery` 몇 구간마다 실제 입항 장면 · `achEvery` 업적 검사 간격(날).

## 빠르게 하려고 줄인 것 (결과를 읽을 때 주의)

- 바다는 건너뛰고 `G.Routes.estDays`(바람 없음)만큼 `G.Game.passDays`로 날을 넘긴다 — 폭풍·해적·사건 없음. `sail.js`로 주요 길을 따로 확인한다.
- 실제 입항 장면(입항 사건·의뢰·소문)은 25구간에 한 번, 업적 검사는 15일에 한 번, 알림은 화면에 그리지 않고 센다.
- 봇은 금고·투자·의뢰·해전을 쓰지 않는다 (교역로만 본다).
