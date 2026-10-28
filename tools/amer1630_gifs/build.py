#!/usr/bin/env python3
"""아메리카 신규 발견물 70종의 원화를 기존 갈래별 빌더로 GIF·끝 장면·장면 판으로 만든다.

python tools/amer1630_gifs/build.py --ready  # 원화가 준비된 것만, 바뀐 것만
python tools/amer1630_gifs/build.py --only yosemite,condor
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROMPTS = ROOT / 'docs/art/amer1630-gif-prompts.json'


def module(name: str, relative: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--only', help='쉼표로 나눈 발견물 ID')
    parser.add_argument('--ready', action='store_true', help='원화가 없는 항목은 다음 제작 때까지 건너뛴다')
    parser.add_argument('--force', action='store_true', help='이미 만든 항목도 다시 만든다')
    args = parser.parse_args()
    rows = json.loads(PROMPTS.read_text(encoding='utf-8'))['items']
    if args.only:
        wanted = set(args.only.split(','))
        unknown = wanted - {r['id'] for r in rows}
        if unknown:
            parser.error('등록되지 않은 ID: ' + ', '.join(sorted(unknown)))
        rows = [r for r in rows if r['id'] in wanted]
    sys.path.insert(0, str(ROOT / 'tools/ruin_gifs'))
    builders = {}
    sheets = module('amer1630_sheets', 'tools/ruin_gifs/sheets.py')
    completed, pending = [], []
    for row in rows:
        did, kind = row['id'], row['kind']
        source = ROOT / row['target']
        if not source.is_file():
            pending.append(did)
            continue
        gif = ROOT / 'images/discoveries' / (did + '.gif')
        end = ROOT / 'images/discovery-ends' / (did + '.jpg')
        sheet = ROOT / 'images/discovery-sheets' / (did + '.webp')
        if not args.force and all(p.exists() and p.stat().st_mtime >= source.stat().st_mtime for p in (gif, end, sheet)):
            continue
        if kind not in builders:
            relative = 'tools/ruin_gifs/build_cinematic.py' if kind == 'ruin' else f'tools/{kind}_gifs/build.py'
            builders[kind] = module('amer1630_' + kind, relative)
            if kind == 'ruin':
                layout = module('amer1630_layout', 'tools/amer1630_gifs/layout.py')
                fit = builders[kind].fit_whole
                builders[kind].storyboard_cells = lambda source: layout.cells(source, fit)
        if kind == 'ruin':
            builders[kind].build_one(did, ROOT / 'images/discoveries', ROOT / 'images/discovery-ends')
        else:
            builders[kind].build_one(did)
        sheets.build(did, force=True)
        completed.append(did)
        print(f'{kind:6} {did:20} GIF {gif.stat().st_size // 1024:4} KB · 장면 판 {sheet.stat().st_size // 1024:4} KB', flush=True)
    print(json.dumps({'built': len(completed), 'pending': len(pending)}, ensure_ascii=False))
    if pending and not args.ready:
        raise SystemExit('원화가 아직 없는 발견물: ' + ', '.join(pending))


if __name__ == '__main__':
    main()
