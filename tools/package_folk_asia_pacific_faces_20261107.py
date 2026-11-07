"""참고 얼굴 교체 v2 원본 보관, 명세 갱신, 전후 비교판과 최종 묶음."""
import argparse
import json
import math
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square
import protagonist_portraits as portraits

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/folk-asia-pacific-faces-20261107'
MASTER = ROOT / 'tools/folk_asia_pacific_women_20261107_prompts.json'
SPEC = ROOT / 'tools/folk_asia_pacific_faces_20261107_prompts.json'
OLD_ART = ROOT / 'artifacts/folk-asia-pacific-women-20261107'
DOC = ROOT / 'docs/art/folk-asia-pacific-faces-20261107.md'


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def prepare():
    revision = json.loads((ART/'generation-results.json').read_text(encoding='utf-8'))
    master = json.loads(MASTER.read_text(encoding='utf-8'))
    results = json.loads((OLD_ART/'generation-results.json').read_text(encoding='utf-8'))
    rows = {r['id']: r for r in master['portraits']}
    assert len(revision['portraits']) == 20
    (ART/'sources').mkdir(exist_ok=True)
    for row in revision['portraits']:
        old = rows[row['id']]
        assert row.get('source') and Path(row['source']).is_file(), row['id']
        if row.get('covered_costume_source'):
            intermediate = ART/'revisions'/(row['id']+'_covered.png')
            intermediate.parent.mkdir(exist_ok=True)
            if not intermediate.exists():
                shutil.copy2(row['covered_costume_source'], intermediate)
            row['initial_target'] = row['target']
            row['target'] = intermediate.relative_to(ROOT).as_posix()
        target = ART/'sources'/(row['id']+'_v2.png')
        if not target.exists():
            shutil.copy2(row['source'], target)
        if old['face_key'] != row['face_key']:
            row['previous_version'] = {k: old.get(k) for k in ['face_key', 'face_file', 'half_file', 'workspace_source', 'prompt', 'source']}
        else:
            row['previous_version'] = old['previous_version']
        row['workspace_source'] = target.relative_to(ROOT).as_posix()
        old.update(row)
        results[row['id']].update(row)
    write_json(MASTER, master)
    write_json(SPEC, revision)
    write_json(ART/'generation-results.json', revision)
    write_json(OLD_ART/'generation-results.json', results)
    print('20개 v2 원본 보관 및 현재 명세 갱신')


def closeup(path):
    im = Image.open(path).convert('RGBA')
    face_square(im)  # Korean model path workaround.
    face = portraits.detect_face(im)
    if face:
        x, y, w, h = face
        side = max(w*1.65, h*1.55)
        left, top = x+w/2-side/2, y-h*.25
        im = im.crop((round(left), round(top), round(left+side), round(top+side)))
    else:
        im = face_square(im)
    return im.resize((224, 224), Image.Resampling.LANCZOS)


def report():
    spec = json.loads(SPEC.read_text(encoding='utf-8'))
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    small = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 19)
    stem = ROOT/'docs/art/folk-asia-pacific-faces-20261107'
    comparisons = []
    for region in [None, '중국', '동남아', '폴리네시아']:
        rows = [r for r in spec['portraits'] if region is None or r['region'] == region]
        cols = 4 if region is None else 2
        board = Image.new('RGB', (cols*720, math.ceil(len(rows)/cols)*310), '#30373c')
        draw = ImageDraw.Draw(board)
        for i, row in enumerate(rows):
            x, y = i%cols*720, i//cols*310
            draw.text((x+16,y+8), row['region']+' · '+row['name']+' / 참고 '+str(row['primary_reference_number']),font=font,fill='#f1e8d6')
            paths = [ROOT/row['reference'], ROOT/'images'/(row['previous_face_key']+'.webp'), ROOT/'images'/(row['face_key']+'.webp')]
            for j, (path,label) in enumerate(zip(paths,['참고 사진','수정 전','수정 후'])):
                img = closeup(path)
                board.paste(img,(x+16+j*232,y+46),img)
                draw.text((x+16+j*232,y+276), label,font=small,fill='#dce3e8')
        suffix = 'comparison' if region is None else {'중국':'china','동남아':'seasia','폴리네시아':'polynesia'}[region]+'-comparison'
        output = Path(str(stem)+'-'+suffix+'.jpg')
        board.save(output,quality=95)
        comparisons.append(output)
    gallery = Image.new('RGB',(1280,1200),'#30373c')
    draw = ImageDraw.Draw(gallery)
    for i,row in enumerate(spec['portraits']):
        x,y=i%5*256,i//5*300
        face=Image.open(ROOT/'images'/(row['face_key']+'.webp')).convert('RGBA').resize((256,256),Image.Resampling.LANCZOS)
        gallery.paste(face,(x,y),face)
        draw.text((x+10,y+264),row['name']+' · #'+str(row['primary_reference_number']),font=small,fill='#f1e8d6')
    faces=Path(str(stem)+'-faces.jpg')
    gallery.save(faces,quality=95)
    files=[]
    for row in spec['portraits']:
        files.extend(ROOT/'images'/(row['face_key']+suffix+'.webp') for suffix in ['', '_half'])
    checks=json.loads((OLD_ART/'asset-checks.json').read_text(encoding='utf-8'))
    assert len(checks)==40 and all('_v2' in r['key'] for r in checks)
    write_json(ART/'asset-checks.json',checks)
    with zipfile.ZipFile(ART/'folk-asia-pacific-faces-20261107.zip','w',zipfile.ZIP_DEFLATED) as z:
        for file in files+[SPEC,DOC,faces]+comparisons+[ART/'asset-checks.json']:
            z.write(file,file.relative_to(ROOT).as_posix())
    print('40장 및 참고·수정 전·수정 후 20종 비교판·ZIP 저장')


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--prepare',action='store_true')
    args=parser.parse_args()
    prepare() if args.prepare else report()
