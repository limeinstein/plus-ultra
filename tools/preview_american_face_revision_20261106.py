"""수정한 두 인물의 얼굴상·무릎상 점검판과 파일 묶음을 만든다."""
import json
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/american-face-revision-20261106'
PREVIEW = ROOT / 'docs/art/american-face-revision-20261106-preview.jpg'
rows = json.loads((ART / 'generation-results.json').read_text(encoding='utf-8'))
sheet = Image.new('RGB', (1000, 950), '#30373c')
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 28)
exports = []
for i, row in enumerate(rows):
    x = i * 500
    half_file = ROOT / 'images' / (row['face_key'] + '_half.webp')
    face_file = ROOT / 'images' / (row['face_key'] + '.webp')
    with Image.open(half_file) as opened:
        half = opened.convert('RGBA')
    half.thumbnail((470, 705), Image.Resampling.LANCZOS)
    sheet.paste(half, (x + (500 - half.width) // 2, 4), half)
    with Image.open(face_file) as opened:
        face = opened.convert('RGBA').resize((170, 170), Image.Resampling.LANCZOS)
    sheet.paste(face, (x + 165, 725), face)
    box = draw.textbbox((0, 0), row['name'], font=font)
    draw.text((x + (500 - box[2]) // 2, 905), row['name'], font=font, fill='#f1e8d6')
    exports += [half_file, face_file]
PREVIEW.parent.mkdir(exist_ok=True, parents=True)
sheet.save(PREVIEW, quality=95)
with zipfile.ZipFile(ART / 'american-face-revision-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for file in exports + [PREVIEW, ROOT / 'tools/american_face_revision_20261106_prompts.json']:
        z.write(file, file.relative_to(ROOT).as_posix())
print('수정 4장·미리보기·지시문 ZIP 저장 완료')
