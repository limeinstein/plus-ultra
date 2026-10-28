#!/usr/bin/env python3
"""역사 사건의 빠진 인물화와 장면을 내장 생성 원화에서 내보낸다."""
from pathlib import Path
import history_event_art as export
ROOT=Path(__file__).resolve().parents[1]
if __name__=='__main__':
    export.OUT=ROOT/'artifacts/history-gap-art-20261029'
    export.SPECS=ROOT/'tools/history_gap_art_prompts.json'
    export.materialize()
    export.preview()
    print('역사 사건 보완 원화 내보내기 완료')
