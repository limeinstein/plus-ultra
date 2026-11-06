"""브리지드의 첨부 얼굴·해적 복장 수정본을 얼굴상과 무릎상으로 저장한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square
from package_missing_event_art_20261106 import face_coordinates

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/brigid-corsair-20261107'
PLAN = ROOT / 'tools/brigid_corsair_revision_20261107.json'


def main():
    cv2.setNumThreads(2)
    row = json.loads(PLAN.read_text(encoding='utf-8'))
    ART.mkdir(parents=True, exist_ok=True)
    source = ART / 'brigid.png'
    if not source.exists():
        shutil.copy2(row['source'], source)
    refs = []
    for i, original in enumerate(row['inputs'], 1):
        dest = ART / ('reference-' + str(i) + '.png')
        if not dest.exists():
            shutil.copy2(original, dest)
        refs.append(dest)
    with Image.open(source) as opened:
        half = opened.convert('RGBA')
    assert half.size == (1024, 1536)
    face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
    manifest_path = ROOT / 'images/manifest.js'
    manifest = manifest_path.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', manifest)
    files = json.loads(match.group(1))
    previous = {}
    coords_path = ROOT / 'js/data/portraitfaces.js'
    coords = coords_path.read_text(encoding='utf-8')
    checks, exports = [], []
    for suffix, pic in [('', face), ('_half', half)]:
        key = row['key'] + suffix
        relative = row['key'] + '_corsair20261107' + suffix + '.webp'
        dest = ROOT / 'images' / relative
        if not dest.exists():
            pic.save(dest, 'WEBP', quality=95, method=4, exact=True)
        with Image.open(dest) as saved:
            saved.load()
            assert saved.mode == 'RGBA' and saved.size == pic.size
            hist = saved.getchannel('A').histogram()
            clear, solid = sum(hist[:8])/(pic.width*pic.height), sum(hist[240:])/(pic.width*pic.height)
            assert clear > .015 and solid > .1
            if suffix:
                assert saved.getchannel('A').crop((0, pic.height-8, pic.width, pic.height)).getextrema()[1] > 240
            coord = face_coordinates(saved.convert('RGBA'))
        previous[key] = files.get(key)
        files[key] = relative
        pattern = r'"' + re.escape(key) + r'": \{[^\n]+\}'
        assert re.search(pattern, coords), key
        coords = re.sub(pattern, '"' + key + '": ' + json.dumps(coord, separators=(',', ':')), coords)
        checks.append({'key': key, 'file': 'images/' + relative, 'size': list(pic.size), 'clear': clear, 'solid': solid, 'face': coord})
        exports.append(dest)
    manifest_path.write_text(manifest[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + manifest[match.end():], encoding='utf-8', newline='\n')
    coords_path.write_text(coords, encoding='utf-8', newline='\n')
    previous_path = ART / 'previous-mapping.json'
    if not previous_path.exists():
        previous_path.write_text(json.dumps(previous, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ART/'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    row.update(workspace_source=source.relative_to(ROOT).as_posix(), workspace_references=[p.relative_to(ROOT).as_posix() for p in refs], face_file=exports[0].relative_to(ROOT).as_posix(), half_file=exports[1].relative_to(ROOT).as_posix())
    PLAN.write_text(json.dumps(row, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    preview = Image.new('RGB', (980, 850), '#30373c')
    draw = ImageDraw.Draw(preview)
    thumb = half.resize((520, 780), Image.Resampling.LANCZOS)
    preview.paste(thumb, (10, 8), thumb)
    thumb = face.resize((420, 420), Image.Resampling.LANCZOS)
    preview.paste(thumb, (550, 120), thumb)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 26)
    draw.text((24, 804), '브리지드 버크 — 얼굴·해적 복장 수정', font=font, fill='#f5e6ce')
    preview_path = ROOT/'docs/art/brigid-corsair-20261107-preview.jpg'
    preview.save(preview_path, quality=95)
    extras = [ROOT/'docs/art/brigid-corsair-20261107.md', ROOT/'tools/package_brigid_corsair_20261107.py'] + list((ART/'runtime').glob('*'))
    with zipfile.ZipFile(ART/'brigid-corsair-20261107.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for file in exports + refs + [source, PLAN, preview_path, ART/'asset-checks.json', previous_path] + [p for p in extras if p.is_file()]:
            z.write(file, file.relative_to(ROOT).as_posix())
    print('브리지드 얼굴상·무릎상 2장 저장·연결·얼굴 좌표 갱신 완료.')


if __name__ == '__main__':
    main()
