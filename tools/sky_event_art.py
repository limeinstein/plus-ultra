#!/usr/bin/env python3
"""하늘을 재는 사람들: 내장 ImageGen 원화를 게임 규격으로 내보낸다."""
from pathlib import Path
import history_event_art as export

ROOT = Path(__file__).resolve().parents[1]
if __name__ == '__main__':
    export.OUT = ROOT / 'artifacts/sky-event-art-20261029'
    export.SPECS = ROOT / 'tools/sky_event_art_prompts.json'
    export.OUT.mkdir(parents=True, exist_ok=True)
    rows = export.materialize()
    export.preview()
    print('인물 %d명 · 장면 %d장 내보내기 완료' % (
        sum(r['type'] == 'portrait' for r in rows),
        sum(r['type'] == 'scene' for r in rows)))
