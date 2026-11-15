# 한국어 글꼴 선택 수정 — 2026-11-15

한국어 「화면 · 글꼴」에서 글꼴을 눌러도 DEFAULT가 유지되는 증상을 저장공간 부족 상태에서 재현했다.

- 정상 저장소: 변경 전에도 글꼴 5종 선택 가능.
- 실제 localStorage를 한도까지 채운 상태: `setItem('pu.font', 'nanum')`이 `QuotaExceededError`를 내고, 모든 글꼴을 눌러도 `fontPref()`는 `auto`, 실제 글꼴은 `notoserif`로 남았다.
- 원인: `display.js`는 쓰기 실패 때 임시 설정 `_mem`을 만들지만, 읽기에 성공하면 예전 localStorage 값을 반환해 임시 설정을 무시했다.
- 수정: 임시 설정을 먼저 읽는다. 다시 저장에 성공하면 임시 값을 지워 이후 변경도 올바르게 반영한다. 저장소가 막히거나 가득 찬 동안의 선택은 이번 실행에 적용되며, 정상 저장된 선택은 재실행해도 유지된다.

검증 명령: `BROWSER_EXE="C:/Program Files/Google/Chrome/Application/chrome.exe" node tests/display_font_smoke.cjs`

확인 결과:

1. 한국어 글꼴 5종·DEFAULT의 실제 누르기, 선택 표시, 본문 `font-family` 변경 통과.
2. 재실행과 English → 한국어 전환 후 선택 유지·재선택 통과.
3. 실제 localStorage 한도에 도달한 상태에서도 글꼴 5종 즉시 적용 통과.
4. 저장공간 확보 후 새 선택 저장·재실행 유지 통과.
5. 저장소 읽기·쓰기가 모두 차단된 상태의 선택 적용 통과.
6. `pageerror`·`console.error` 0건. 시험용 Chromium 종료 확인.

근거: [검증 자료](../../artifacts/font-selection-20261115/verification.json), [수정 화면](../../artifacts/font-selection-20261115/korean-font-fixed.png).
