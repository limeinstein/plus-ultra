#!/usr/bin/env python3
"""동료 원본 PNG는 보존하고, 칸 좌표·상체 기준점과 편대용 시트 정보를 만든다."""
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw
from expedition_motion_meta import inspect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/exploration-formation-20261029'

def main():
    specs = json.loads((ROOT / 'tools/exploration_formation_prompts.json').read_text(encoding='utf-8'))['assets']
    records = json.loads((OUT / 'generated.json').read_text(encoding='utf-8'))['records']
    paths = {r['id']: Path(r['source']) for r in records}
    result = {'directions': ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], 'sheets': {}}
    (OUT / 'sources').mkdir(parents=True, exist_ok=True)
    for a in specs:
        if a['id'] not in paths:
            continue
        sid = a['id']
        source = OUT / 'sources' / (sid + '.png')
        if paths[sid].exists() and paths[sid].resolve() != source.resolve():
            shutil.copy2(paths[sid], source)
        assert source.exists(), f'{sid}: 보관한 생성 원본이 필요함'
        dest = ROOT / 'images/sprites' / ('expedition_follower_' + sid + '.png')
        shutil.copy2(source, dest)
        meta = inspect(dest, 4, 8, walking=True)
        meta.update(key='sprites/' + dest.stem, file='sprites/' + dest.name, label=a['label'], targetHeight=a['height'])
        meta['directionRows'] = a.get('directionRows', [[r, False] for r in range(8)])
        result['sheets'][sid] = meta
    (OUT / 'manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    js = ('/* 자동 생성: python tools/exploration_formation_meta.py · 투명 PNG를 변형하지 않는다. */\n'
          '(function (G) {\n  \'use strict\';\n  G.EXPEDITION_FOLLOWERS = ' + json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ';\n'
          '  G.IMAGE_FILES = G.IMAGE_FILES || {};\n'
          '  Object.keys(G.EXPEDITION_FOLLOWERS.sheets).forEach(function (id) {\n'
          '    var s = G.EXPEDITION_FOLLOWERS.sheets[id]; if (!G.IMAGE_FILES[s.key]) G.IMAGE_FILES[s.key] = s.file;\n'
          '  });\n})(window.G = window.G || {});\n')
    (ROOT / 'js/data/expedition_followers.js').write_text(js, encoding='utf-8')
    # 확인용 축소 그림만 따로 만들며 게임 원본은 줄이지 않는다.
    canvas = Image.new('RGB', (1200, ((len(result['sheets']) + 3) // 4) * 270), '#273d37')
    draw = ImageDraw.Draw(canvas)
    for i, (sid, m) in enumerate(result['sheets'].items()):
        x, y = (i % 4) * 300, (i // 4) * 270
        draw.text((x + 12, y + 10), sid, fill='#f6e6be')
        with Image.open(ROOT / 'images' / m['file']) as im:
            c = m['cells'][8]
            tile = im.crop((c[0], c[1], c[0] + c[2], c[1] + c[3]))
            tile.thumbnail((276, 222), Image.Resampling.LANCZOS)
            canvas.paste(tile, (x + (300 - tile.width) // 2, y + 260 - tile.height), tile)
    canvas.save(OUT / 'sprite-preview.jpg', quality=94)
    print(json.dumps({k: {'size': [m['width'], m['height']], 'frames': len(m['cells']), 'alpha': m['transparentFraction']} for k, m in result['sheets'].items()}, ensure_ascii=False))

if __name__ == '__main__':
    main()
