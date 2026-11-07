"""내장 image_gen의 지역별 원화 시트를 자르고 해적섬 게임 그림으로 등록한다."""
import argparse
import json
import re
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps
from import_generated_portrait import face_square
from package_missing_event_art_20261106 import face_coordinates

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/pirate-islands-20261107'
PLAN = ROOT / 'tools/pirate_island_art_20261107_prompts.json'
ROLES = ['harbormaster', 'trader', 'tavernkeeper', 'innkeeper', 'boatswain', 'servant']
BUILDINGS = ['harbor', 'trade', 'tavern', 'inn', 'lairhq']
LABELS = ['항구', '교역소', '술집', '여관', '해적 본부']


def tile(im, index, columns=3, rows=2):
    x, y = index % columns, index // columns
    return im.crop((round(x * im.width / columns), round(y * im.height / rows),
                    round((x+1) * im.width / columns), round((y+1) * im.height / rows)))


def clean(im):
    im = im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda a: 0 if a <= 8 else a))
    return im


def split_sprites(im, columns=3, rows=2, separate_rows=False):
    """칸 경계를 넘은 손·칼·깃발도 같은 투명 실루엣으로 온전히 나눈다."""
    im = clean(im)
    if separate_rows:
        return [sprite for row in range(rows) for sprite in split_sprites(
            im.crop((0, round(row*im.height/rows), im.width, round((row+1)*im.height/rows))), columns, 1)]
    _, labels, stats, centers = cv2.connectedComponentsWithStats((np.array(im.getchannel('A')) > 24).astype('uint8'))
    result = []
    for index in range(columns * rows):
        x, y = index % columns, index // columns
        candidates = [i for i in range(1, len(stats)) if
                      x * im.width / columns <= centers[i][0] < (x+1) * im.width / columns and
                      y * im.height / rows <= centers[i][1] < (y+1) * im.height / rows]
        assert candidates, index
        chosen = max(candidates, key=lambda i: stats[i][4])
        mask = cv2.dilate((labels == chosen).astype('uint8'), np.ones((5, 5), np.uint8)) * 255
        sprite = im.copy()
        sprite.putalpha(ImageChops.multiply(im.getchannel('A'), Image.fromarray(mask)))
        box = sprite.getchannel('A').getbbox()
        result.append(sprite.crop(box))
    return result


def contain(im, size, bottom=False):
    out = Image.new('RGBA', size)
    scaled = ImageOps.contain(im, (size[0]-32, size[1]-16), Image.Resampling.LANCZOS)
    out.alpha_composite(scaled, ((size[0]-scaled.width)//2, size[1]-scaled.height if bottom else (size[1]-scaled.height)//2))
    return out


def runtime_preview():
    """실제 게임 화면을 한눈에 비교할 수 있게 모은다."""
    rows = [('med_street.png', '제르바 섬 · 지중해'), ('atl_street.png', '마모라 · 대서양'),
            ('north_street.png', '클레어 섬 · 북해'), ('amer_street.png', '토르투가 · 카리브'),
            ('ind_street.png', '생트마리 섬 · 인도양'), ('sea_street.png', '홀로 섬 · 동남아시아'),
            ('east_street.png', '쌍서 · 동아시아'), ('med_headquarters.png', '해적 본부 · 제르바 섬'),
            ('npc_dialogue.png', '장물상 · 무릎상 대화')]
    if not all((ART / 'runtime' / f).is_file() for f, _ in rows):
        return
    out = Image.new('RGB', (1440, 984), '#26323a')
    draw = ImageDraw.Draw(out)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 20)
    for i, (name, label) in enumerate(rows):
        x, y = i%3*480, i//3*328
        with Image.open(ART / 'runtime' / name) as im:
            out.paste(im.convert('RGB').resize((480, 300), Image.Resampling.LANCZOS), (x, y))
        draw.text((x+10, y+301), label, font=font, fill='#f5e6c8')
    out.save(ROOT / 'docs/art/pirate-island-runtime-20261107.jpg', quality=94)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial', action='store_true')
    args = parser.parse_args()
    cv2.setNumThreads(2)
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    (ART / 'sources').mkdir(parents=True, exist_ok=True)
    checks, coords = [], {}
    paths, environment, portraits, motion = {}, [], [], []
    def save(key, im, alpha=False):
        dest = ROOT / 'images' / (key + '.webp')
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, 'WEBP', quality=93, method=4, exact=True)
        with Image.open(dest) as saved:
            saved.load()
            assert saved.size == im.size, key
            check = {'key': key, 'size': list(saved.size), 'file': dest.relative_to(ROOT).as_posix()}
            if alpha:
                assert saved.mode == 'RGBA', key
                hist = saved.getchannel('A').histogram()
                check['clear'] = sum(hist[:9]) / (saved.width*saved.height)
                check['solid'] = sum(hist[220:]) / (saved.width*saved.height)
                assert check['clear'] > .015 and check['solid'] > .02, check
            checks.append(check)
        paths[key] = dest.relative_to(ROOT / 'images').as_posix()
    for region in plan['regions']:
        z, assets = region['zone'], region['assets']
        missing = [kind for kind, a in assets.items() if not a.get('source') or not Path(a['source']).is_file()]
        if missing and not args.partial:
            raise ValueError(z + ' 원화가 필요합니다: ' + ', '.join(missing))
        sources = {}
        for kind, asset in assets.items():
            if kind in missing:
                continue
            dest = ART / 'sources' / (z + '_' + kind + '.png')
            if Path(asset['source']).resolve() != dest.resolve():
                shutil.copy2(asset['source'], dest)
            asset['workspace_source'] = dest.relative_to(ROOT).as_posix()
            with Image.open(dest) as raw:
                sources[kind] = raw.copy()
        base = 'pirate-islands/' + z
        if 'interior' in sources:
            for i, b in enumerate(BUILDINGS):
                pic = ImageOps.fit(tile(sources['interior'], i).convert('RGB'), (1600, 900), Image.Resampling.LANCZOS)
                save(base + '/interior/' + b, pic)
                environment.append((z + ' · ' + LABELS[i] + ' 안', pic))
            street = ImageOps.fit(tile(sources['interior'], 5).convert('RGB'), (1600, 900), Image.Resampling.LANCZOS)
            save(base + '/street', street)
        if 'exterior' in sources:
            sprites = split_sprites(sources['exterior'])
            for i, b in enumerate(BUILDINGS):
                pic = sprites[i]
                box = pic.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
                assert box, (z, b)
                pic = contain(pic.crop(box), (768, 768))
                save(base + '/exterior/' + b, pic, True)
                environment.append((z + ' · ' + LABELS[i] + ' 밖', pic))
        if 'npc' in sources:
            sprites = split_sprites(sources['npc'], separate_rows=True)
            for i, role in enumerate(ROLES):
                raw = sprites[i]
                box = raw.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
                assert box, (z, role)
                half = contain(raw.crop(box), (1024, 1536), True)
                face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
                key = 'portraits/npc/pirate-islands/' + z + '/' + role
                for suffix, pic in [('', face), ('_half', half)]:
                    save(key + suffix, pic, True)
                    coords[key + suffix] = face_coordinates(pic)
                portraits.append((z + ' · ' + role, half, face))
        if 'walk' in sources:
            im = sources['walk']
            sprites = split_sprites(im, 8, 6, separate_rows=True)
            for row, role in enumerate(ROLES):
                frames, boxes = [], []
                for col in range(8):
                    pic = sprites[row*8+col]
                    box = pic.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
                    assert box, (z, role, col)
                    frames.append(pic)
                    boxes.append(box)
                scale = min(348 / max(b[2]-b[0] for b in boxes), 424 / max(b[3]-b[1] for b in boxes))
                sheet = Image.new('RGBA', (1520, 888))
                rendered = []
                for i, (frame, box) in enumerate(zip(frames, boxes)):
                    body = frame.crop(box)
                    body = body.resize((round(body.width*scale), round(body.height*scale)), Image.Resampling.LANCZOS)
                    cell = Image.new('RGBA', (380, 444))
                    cell.alpha_composite(body, ((380-body.width)//2, 440-body.height))
                    sheet.alpha_composite(cell, ((i%4)*380, (i//4)*444))
                    rendered.append(cell)
                save('street-folk/pirate-islands/' + z + '/' + role, sheet, True)
                motion.append((z + ' · ' + role, rendered))
        print(z + ': ' + ', '.join(sources))
    # 이번 파일만 더한다. 함께 작업 중인 다른 그림 연결과 교체 우선순위는 보존한다.
    manifest_path = ROOT / 'images/manifest.js'
    manifest = manifest_path.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', manifest)
    files = json.loads(match.group(1)); files.update(paths)
    manifest_path.write_text(manifest[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + manifest[match.end():], encoding='utf-8', newline='\n')
    coord_path = ROOT / 'js/data/pirate_island_faces.js'
    coord_path.write_text('/* 해적섬 주민 얼굴 자리 — tools/package_pirate_island_art_20261107.py */\n(function (G) {\n  \'use strict\';\n  var rows = ' + json.dumps(coords, ensure_ascii=False, indent=2) + ';\n  G.PORTRAIT_FACES = G.PORTRAIT_FACES || {};\n  Object.keys(rows).forEach(function (k) { G.PORTRAIT_FACES[k] = rows[k]; });\n})(window.G = window.G || {});\n', encoding='utf-8', newline='\n')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2), encoding='utf-8')
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 18)
    preview_root = ROOT / 'docs/art'
    def previews(rows, name, cols, cell_w, cell_h, paint):
        out = Image.new('RGB', (cols*cell_w, ((len(rows)+cols-1)//cols)*cell_h), '#26323a')
        draw = ImageDraw.Draw(out)
        for i, row in enumerate(rows):
            x, y = (i%cols)*cell_w, (i//cols)*cell_h
            paint(out, row, x, y)
            draw.text((x+8, y+cell_h-28), row[0], font=font, fill='#f5e6c8')
        out.save(preview_root / name, quality=91)
    if environment:
        def paint_env(out, row, x, y):
            pic = ImageOps.contain(row[1], (316, 178), Image.Resampling.LANCZOS)
            out.paste(pic, (x+(320-pic.width)//2, y+(180-pic.height)//2), pic if pic.mode == 'RGBA' else None)
        previews(environment, 'pirate-island-environments-20261107.jpg', 5, 320, 212, paint_env)
    if portraits:
        def paint_npc(out, row, x, y):
            half = ImageOps.contain(row[1], (210, 280), Image.Resampling.LANCZOS)
            out.paste(half, (x+(220-half.width)//2, y+280-half.height), half)
            face = row[2].resize((90, 90), Image.Resampling.LANCZOS)
            out.paste(face, (x+122, y+194), face)
        previews(portraits, 'pirate-island-npcs-20261107.jpg', 6, 220, 314, paint_npc)
    if motion:
        gif_frames = []
        for phase in range(8):
            frame = Image.new('RGB', (7*180, 6*208), '#26323a')
            draw = ImageDraw.Draw(frame)
            for i, row in enumerate(motion):
                x, y = (i//6)*180, (i%6)*208
                pic = ImageOps.contain(row[1][phase], (174, 176), Image.Resampling.LANCZOS)
                frame.paste(pic, (x+(180-pic.width)//2, y+176-pic.height), pic)
                draw.text((x+4, y+180), row[0], font=font, fill='#f5e6c8')
            gif_frames.append(frame)
        gif_frames[0].save(preview_root / 'pirate-island-walks-20261107.gif', save_all=True, append_images=gif_frames[1:], duration=125, loop=0, disposal=2)
    runtime_preview()
    print(str(len(checks)) + '개 게임 그림 등록·알파·규격·얼굴 좌표 검사 완료')


if __name__ == '__main__':
    main()
