"""선수상 생성 원화의 투명도를 보존해 교역품 규격 192×192로 내보낸다."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artifacts/figureheads-20261029/sources'
SPEC = ROOT / 'docs/art/figureheads-prompts-20261029.json'


def main():
    spec = json.loads(SPEC.read_text(encoding='utf-8'))
    inventory = json.loads((SOURCE.parent / 'inventory.json').read_text(encoding='utf-8'))
    names = {f['id']: f['name'] for f in inventory}
    rows = []
    cells = []
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 15)
    small = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 12)
    for asset in spec['assets']:
        source = SOURCE / (asset['id'] + '.png')
        if not source.exists():
            continue
        raw = Image.open(source).convert('RGBA')
        assert raw.getchannel('A').getextrema() == (0, 255), str(source)
        box = raw.getchannel('A').getbbox()
        icon = raw.crop(box)
        icon.thumbnail((164, 164), Image.Resampling.LANCZOS)
        out = Image.new('RGBA', (192, 192))
        out.paste(icon, ((192 - icon.width) // 2, (192 - icon.height) // 2))
        target = ROOT / asset['file']
        target.parent.mkdir(parents=True, exist_ok=True)
        out.save(target, quality=95, method=6, exact=True)
        # 미리보기만 바탕에 합성하며 실제 상품 파일의 알파는 그대로 둔다.
        cell = Image.new('RGB', (216, 240), '#e8d9b9')
        cell.paste(out, (12, 0), out)
        draw = ImageDraw.Draw(cell)
        draw.text((10, 194), names.get(asset['id'], asset.get('name', asset['id'])), fill='#302519', font=font)
        draw.text((10, 218), asset['id'], fill='#6a5538', font=small)
        cells.append(cell)
        rows.append({'id': asset['id'], 'file': asset['file'], 'size': list(out.size),
                     'sourceSize': list(raw.size), 'alpha': list(out.getchannel('A').getextrema())})
    cols = 6
    preview = Image.new('RGB', (cols * 216, ((len(cells) + cols - 1) // cols) * 240), '#f4ecd9')
    for i, cell in enumerate(cells):
        preview.paste(cell, ((i % cols) * 216, (i // cols) * 240))
    preview.save(ROOT / 'docs/art/figureheads-preview-20261029.jpg', quality=95)
    (SOURCE.parent / 'files-report.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'선수상 {len(rows)}/{len(spec["assets"])}종: 192×192, 투명 배경')


if __name__ == '__main__':
    main()
