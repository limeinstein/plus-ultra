# 에셋 QA 도구

- `scan.py <repo> <out.json>` — images/ 모든 그림의 해독·크기·투명도·가장자리·흐림·해시.
- `analyze.py` — scan.json → analysis.json (크기 이탈·투명 없음·단색·흐림·3MB 넘음·바이트 중복·거의 같은 그림). 경로는 파일 안에서 바꿔 쓴다.
- `coverage.js <repo> <out.json>` — 게임을 띄워 자료마다 전용 그림이 있는지 (`BROWSER_EXE`에 크로미움 경로).
- `sheets.py <repo> <outdir> [갈래...]` — 갈래별 모아보기 그림(10×6칸).
- `edges.py` — 초상 위쪽 가장자리에 머리·모자가 닿는 것.

결과 정리: `../asset-qa-2026-10-31.md`, `../asset-qa-2026-10-31.json`.
