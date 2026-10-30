#!/usr/bin/env python3
"""성인 소꿉친구 원화를 게임 초상과 검수 모음으로 내보낸다."""
import json
import hashlib
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import history_event_art as export
from portrait_asset_layout import detect_face

ROOT = Path(__file__).resolve().parents[1]


def reframe_faces(out, specs):
    """표시된 여덟 명만 개별 자르기를 쓰고 나머지는 원래 얼굴상을 보존한다."""
    config = json.loads((ROOT / 'tools/childhood_friends_20261029_face_layout.json').read_text(encoding='utf-8'))
    crops = config['crops']
    report_path = out / 'face-layout' / 'report.json'
    previous = json.loads(report_path.read_text(encoding='utf-8')) if report_path.exists() else []
    cache = {row['id']: row for row in previous}
    rows = []
    for asset in specs['assets']:
        ident = asset['id']
        base = ROOT / 'images' / asset['portrait_dir']
        half_path, face_path = base / (ident + '_half.webp'), base / (ident + '.webp')
        half_hash = hashlib.sha256(half_path.read_bytes()).hexdigest()
        backup = out / 'face-layout' / 'before' / (ident + '.webp')
        old = cache.get(ident, {})
        if ident not in crops:
            # 한꺼번에 중앙 정렬했던 결과를 되돌린다. 원래 파일을 재압축하지 않는다.
            if backup.exists():
                if old.get('half_sha256') and old['half_sha256'] != half_hash:
                    shutil.copy2(face_path, backup)
                elif face_path.read_bytes() != backup.read_bytes():
                    shutil.copy2(backup, face_path)
            rows.append({'id': ident, 'layout': 'original', 'half_sha256': half_hash,
                         'face_sha256': hashlib.sha256(face_path.read_bytes()).hexdigest()})
            continue
        crop = crops[ident]
        face_hash = hashlib.sha256(face_path.read_bytes()).hexdigest()
        if (old.get('layout') == config['version'] and old.get('crop_pixels') == crop
                and old['half_sha256'] == half_hash and old['face_sha256'] == face_hash):
            rows.append(old)
            continue
        if not backup.exists():
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(face_path, backup)
        with Image.open(half_path) as image:
            half = image.convert('RGBA')
        # 피부 검출 상자의 중심을 강제하지 않고 머리 전체·머리 장식·시선 여백을 검수한 좌표다.
        face = half.crop(crop).resize((1024, 1024), Image.Resampling.LANCZOS)
        export.save_asset(face, face_path, quality=94, method=6, exact=True)
        with Image.open(face_path) as image:
            measured = detect_face(image.convert('RGBA'))
        if measured is None:
            raise ValueError('수정 얼굴상을 검수해야 합니다: ' + ident)
        with Image.open(backup) as image:
            before = detect_face(image.convert('RGBA'))
        rows.append({'id': ident, 'layout': config['version'], 'crop_pixels': crop,
                     'half_sha256': half_hash, 'face_sha256': hashlib.sha256(face_path.read_bytes()).hexdigest(),
                     'before_face_box': [round(v / 1024, 4) for v in before],
                     'face_box': [round(v / 1024, 4) for v in measured]})
        print('표시된 얼굴상 개별 수정: ' + ident, flush=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')

def expression_preview(out, specs):
    """얼굴 구도와 표정을 실제 게임 얼굴상으로 나란히 검수한다."""
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 17)
    selections = [specs['assets'], [specs['assets'][i] for i in [0, 1, 2, 3, 17, 23, 25, 27]]]
    for assets, name, cols in [(selections[0], 'all-faces-preview.jpg', 8), (selections[1], 'expression-preview.jpg', 4)]:
        cw, ch = 280, 316
        sheet = Image.new('RGB', (cw * cols, ch * ((len(assets) + cols - 1) // cols)), '#302b28')
        draw = ImageDraw.Draw(sheet)
        for i, asset in enumerate(assets):
            source = ROOT / 'images/portraits/childhood-friends' / (asset['id'] + '.webp')
            if not source.exists():
                continue
            with Image.open(source) as im:
                face = ImageOps.contain(im.convert('RGBA'), (cw - 12, ch - 46), Image.Resampling.LANCZOS)
            x, y = i % cols * cw, i // cols * ch
            sheet.paste(face, (x + (cw - face.width) // 2, y + 2), face)
            draw.text((x + 8, y + ch - 38), asset['name'], font=font, fill='#f5dfae')
        sheet.save(out / name, quality=94)

if __name__ == '__main__':
    export.OUT = ROOT / 'artifacts/childhood-friends-20261029'
    export.SPECS = ROOT / 'tools/childhood_friends_20261029_prompts.json'
    export.OUT.mkdir(parents=True, exist_ok=True)
    rows = export.materialize()
    specs = json.loads(export.SPECS.read_text(encoding='utf-8'))
    reframe_faces(export.OUT, specs)
    export.preview()
    expression_preview(export.OUT, specs)
    # 실제 입력으로 쓴 성인·게임 양식 참고만 보관한다.
    for i, source in enumerate(sorted({r for a in specs['assets'] for r in a['refs']}), 1):
        target = export.OUT / 'references' / ('reference-%02d.png' % i)
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copy2(source, target)
    # 수정에 실제로 입력한 성인 초기 원화도 보관한다.
    drafts = export.OUT / 'draft-generated.json'
    if drafts.exists():
        for key, result in json.loads(drafts.read_text(encoding='utf-8')).items():
            target = export.OUT / 'drafts' / (key.split(':', 1)[-1] + '.png')
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                shutil.copy2(result['source'], target)
    print('성인 소꿉친구 %d명 얼굴상·무릎상 내보내기 완료' % len(rows))
