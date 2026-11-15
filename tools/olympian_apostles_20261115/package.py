"""앞서 승인된 사도 초상과 새 업적 이벤트샷을 게임 이름으로 복사·포장한다."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
SOURCE = ROOT.parent / 'output/imagegen/greek-apostles-20261115-v2'
OUT = ROOT / 'artifacts/olympian-apostles-20261115'
ROSTER = ['hera','demeter','hestia','aphrodite','artemis','athena','zeus','poseidon','apollo','ares','hephaestus','hermes']
NAMES = ['칼리스테','멜리사','아가테','이안테','다프네','리산드라','레온티오스','니칸드로스','에우안드로스','드라콘','테오도로스','알렉시스']

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    entries = {}
    for i, slug in enumerate(ROSTER, 1):
        for suffix, art in [('', ''), ('_half', '_half')]:
            src = SOURCE / 'webp' / f'{i:02}{art}.webp'
            key = f'portraits/mates/apostle_{slug}{suffix}'
            dst = ROOT / 'images' / (key + '.webp')
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(src.read_bytes())
            entries[key] = key + '.webp'
    events = json.loads((HERE / 'prompts.json').read_text(encoding='utf-8')) + json.loads((HERE / 'encounters.json').read_text(encoding='utf-8'))
    for asset in events:
        src = Path(asset['source'])
        if not src.is_file():
            src = OUT / (asset['id'] + '.png')
        key = asset.get('folder', 'achievement-events') + '/' + asset['id']
        dst = ROOT / 'images' / (key + '.webp')
        dst.parent.mkdir(parents=True, exist_ok=True)
        im = Image.open(src).convert('RGB')
        im.save(dst, 'WEBP', quality=93, method=6)
        (OUT / (asset['id'] + '.png')).write_bytes(src.read_bytes())
        entries[key] = key + '.webp'
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    start = text.index('{', text.index('G.IMAGE_FILES ='))
    end = text.index('\n};', start) + 2
    data = json.loads(text[start:end])
    data.update(entries)
    manifest.write_text(text[:start] + json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=2) + text[end:], encoding='utf-8', newline='\n')
    receipts = []
    for key, rel in entries.items():
        p = ROOT / 'images' / rel
        with Image.open(p) as im:
            receipts.append(dict(key=key, file=str(p.relative_to(ROOT)), size=list(im.size), mode=im.mode, sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
    (OUT / 'assets.json').write_text(json.dumps(receipts, ensure_ascii=False, indent=2), encoding='utf-8')
    labels = {'meet_' + slug: name + '와의 만남' for slug, name in zip(ROSTER, NAMES)}
    labels.update(olympian_pilgrim='열두 신의 순례자', olympian_companions='올림포스의 동행자', men_fellowship='여섯 항로가 만나는 해도', women_fellowship='먼바다에 남길 불빛')
    cards = ''.join(f'<figure><a href="{a["id"]}.png"><img src="{a["id"]}.png" loading="lazy"></a><figcaption>{labels[a["id"]]}</figcaption></figure>' for a in events)
    (OUT / 'gallery.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>12신의 사도 이벤트샷</title><style>body{background:#17212b;color:#ead4a7;font:18px sans-serif;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px}figure{margin:0}img{width:100%;display:block}figcaption{padding:10px}</style><h1>12신의 사도 · 만남 12장 / 업적 2장 / 남녀 동행 2장</h1><p>데메테르의 만남은 여분 손을 제거한 수정본입니다. 게임에는 WebP, 이 갤러리에는 생성 원본을 보관합니다.</p><main>'+cards+'</main></html>', encoding='utf-8')
    print(f'사도 초상 24개 · 이벤트샷 {len(events)}개: {OUT}')

if __name__ == '__main__':
    main()
