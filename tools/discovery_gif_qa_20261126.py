#!/usr/bin/env python3
"""실제 자료 순서로 전체 발견물의 연결·GIF 모든 프레임·끝 장면·재생 시트를 검사한다."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
import sys

from PIL import Image, ImageChops

from complete_discovery_art import complete_runtime

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/discovery-gif-qa-20261126'
REVEAL_FX = {k: int(v) for k, v in re.findall(r'\b(plantGifMs|treasureGifMs|gifMs)\s*:\s*(\d+)',
    (ROOT / 'js/data/seafx.js').read_text(encoding='utf-8'))}


def audit(row, files):
    result = {'id': row['id'], 'name': row['name'], 'cat': row['cat'], 'issues': []}
    for folder, ext in [('discoveries', '.gif'), ('discovery-ends', '.jpg'), ('discovery-sheets', '.webp')]:
        key = folder + '/' + row['id']
        canonical = ROOT / 'images' / (key + ext)
        rel = files.get(key)
        if not rel:
            result['issues'].append('미연결:' + key)
        elif not rel.startswith(folder + '/') or not rel.endswith(ext) or '..' in Path(rel).parts:
            result['issues'].append('잘못된 대상 경로:' + key + ' → ' + rel)
        path = ROOT / 'images' / rel if rel else canonical
        if not path.is_file():
            result['issues'].append('파일 없음:' + str(path.relative_to(ROOT)))
            continue
        try:
            with Image.open(path) as im:
                if folder == 'discoveries':
                    assert im.format == 'GIF', 'GIF 형식 아님'
                    assert im.size == (576, 256), '장면 크기:' + str(im.size)
                    count = im.n_frames
                    assert count >= 2, '정지 GIF'
                    ms, changed, first = 0, False, None
                    for frame in range(count):
                        im.seek(frame)
                        rgb = im.convert('RGB')
                        if first is None:
                            first = rgb.copy()
                        elif not changed:
                            changed = ImageChops.difference(first, rgb).getbbox() is not None
                        ms += im.info.get('duration', 0)
                    assert changed, '움직임 없는 프레임'
                    assert ms > 0, '재생 시간 없음'
                    if row.get('discStoryNew'):
                        kind = 'plantGifMs' if row.get('plant') else 'treasureGifMs' if row['cat'] in ('treasure', 'trade') and not row.get('natural') else 'gifMs'
                        assert ms == REVEAL_FX[kind], '설치형 재생 시간 불일치:' + str(ms)
                    result.update(frames=count, durationMs=ms, gif=rel or key + ext)
                elif folder == 'discovery-ends':
                    im.load()
                    assert im.width >= 576 and im.height >= 256 and im.width * 256 == im.height * 576, '끝 장면 크기·비율:' + str(im.size)
                else:
                    im.load()
                    assert im.width % 6 == 0, '재생 시트 열 수'
                    cell_w = im.width // 6
                    cell_h = round(cell_w * 256 / 576)
                    assert cell_h > 0 and im.height % cell_h == 0, '재생 시트 비율:' + str(im.size)
                    assert im.height // cell_h >= 2, '재생 시트 장면 부족'
                    result['sheetFrames'] = 6 * (im.height // cell_h)
        except Exception as error:
            result['issues'].append(folder + ':' + str(error))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', default='files.json')
    args = parser.parse_args()
    rows = complete_runtime()
    manifest = (ROOT / 'images/manifest.js').read_text(encoding='utf-8')
    files = dict(re.findall(r'^\s*"([^"]+)"\s*:\s*"([^"]+)"', manifest, re.M))
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda row: audit(row, files), rows))
    bad = [r for r in results if r['issues']]
    report = {'total': len(rows), 'passed': len(rows) - len(bad), 'failed': len(bad), 'results': results}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: report[k] for k in ('total', 'passed', 'failed')}, ensure_ascii=False))
    for r in bad[:12]:
        print(r['id'], r['name'], '; '.join(r['issues']))
    return bool(bad)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
