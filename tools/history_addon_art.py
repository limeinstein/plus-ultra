#!/usr/bin/env python3
"""신대륙·명말·포토시 사건의 내장 생성 원화를 게임 규격으로 내보낸다."""
from pathlib import Path
import history_event_art as export
ROOT=Path(__file__).resolve().parents[1]
if __name__=='__main__':
    export.OUT=ROOT/'artifacts/history-addon-art-20261029'
    export.SPECS=ROOT/'tools/history_addon_art_prompts.json'
    export.OUT.mkdir(parents=True,exist_ok=True)
    export.materialize();export.preview()
    print('역사 신규 사건 원화 내보내기 완료')
