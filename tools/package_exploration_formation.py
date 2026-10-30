#!/usr/bin/env python3
"""동료 시트 원본 12장·칸 좌표·생성 지시문·제작 기록을 ZIP으로 묶는다."""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/exploration-formation-20261029'
data = json.loads((OUT / 'manifest.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(OUT / 'sprite-sheets.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for sheet in data['sheets'].values():
        file = ROOT / 'images' / sheet['file']
        archive.write(file, file.relative_to(ROOT).as_posix())
    for rel in ['artifacts/exploration-formation-20261029/manifest.json',
                'tools/exploration_formation_prompts.json', 'js/data/expedition_followers.js',
                'docs/art/exploration-formation-20261029.md']:
        archive.write(ROOT / rel, Path(rel).name)
print(f"{len(data['sheets'])}장 · {(OUT / 'sprite-sheets.zip').stat().st_size:,}바이트")
