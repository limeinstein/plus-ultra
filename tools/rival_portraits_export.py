"""생성 원본을 보존하고 주문서의 크기·형식으로 내보낸다."""
from pathlib import Path
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artifacts/rivals-portraits'
TARGET = ROOT / 'images/portraits/rivals'

def main():
    rows = json.loads((SOURCE / 'generation.json').read_text(encoding='utf-8'))
    count = 0
    for row in rows:
        for kind, suffix, size, mode in [('face', '', (384, 384), 'RGB'), ('half', '_half', (1024, 1536), 'RGBA')]:
            if kind not in row:
                continue
            raw = SOURCE / (row['name'] + suffix + '.png')
            target = TARGET / (row['name'] + suffix + '.webp')
            if not raw.exists():
                shutil.copy2(row[kind], raw)
            if target.exists():
                continue
            with Image.open(raw) as source:
                im = source.convert(mode)
                if im.size != size:
                    im = im.resize(size, Image.Resampling.LANCZOS)
                im.save(target, 'WEBP', quality=94, method=6, exact=True)
            count += 1
    print('Exported:', count)

if __name__ == '__main__':
    main()
