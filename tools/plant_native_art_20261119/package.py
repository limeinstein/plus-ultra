"""생성 원본을 보존하며 게임 표시본과 제작 목록을 만든다."""
from pathlib import Path
import json, hashlib, html, zipfile, sys
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/plant-native-art-20261119'
DEST = ROOT / 'images/plant-native-20261119'

def main():
    plan = json.loads((OUT / 'prompts.json').read_text(encoding='utf-8'))
    DEST.mkdir(parents=True, exist_ok=True)
    records, mapping, cards = [], {}, []
    for job in plan['jobs']:
        source = OUT / 'originals' / (job['id'] + '.png')
        if not source.exists():
            continue
        target = DEST / (job['id']+'.webp')
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            with Image.open(source) as original:
                original_size = list(original.size)
            with Image.open(target) as display:
                display_size = list(display.size)
        else:
            display_size = None
        with Image.open(source) as im:
            original_size = list(im.size)
            if display_size:
                pass
            elif job['type'] == 'plant':
                assert im.mode == 'RGBA', (job['id'], im.mode)
                assert im.getchannel('A').getextrema() == (0, 255), job['id']
                # 여백을 포함한 원화 전체를 줄여 외곽이 잘리지 않게 한다.
                display = ImageOps.contain(im, (232, 232), Image.Resampling.LANCZOS)
                result = Image.new('RGBA', (256, 256))
                result.alpha_composite(display, ((256-display.width)//2, (256-display.height)//2))
                result.save(target, lossless=True, method=6)
                display_size = list(result.size)
            else:
                result = ImageOps.fit(im.convert('RGB'), (1536, 864), Image.Resampling.LANCZOS)
                result.save(target, quality=93, method=6)
                display_size = list(result.size)
        relative = 'plant-native-20261119/' + job['id'] + '.webp'
        for key in job['keys']:
            mapping[key] = relative
        records.append({**job, 'originalSize': original_size, 'displaySize': display_size,
                        'file': 'images/'+relative, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
        cards.append('<figure data-type="'+job['type']+'"><a href="originals/'+job['id']+'.png"><img loading="lazy" src="../../images/'+relative+'" alt="'+html.escape(job['name'])+'"></a><figcaption>'+html.escape(job['name'])+'</figcaption></figure>')
    (Path(__file__).parent / 'asset-overrides.json').write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT / 'checks.json').write_text(json.dumps({'expected':len(plan['jobs']), 'completed':len(records), 'records':records}, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT / 'index.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>식물 증거와 원주민 마을 원화</title><style>body{margin:32px auto;padding:0 24px;max-width:1500px;background:#191e1a;color:#e4ddc9;font:16px/1.6 "Malgun Gothic",sans-serif}h1{color:#efd6a7}nav{position:sticky;top:0;padding:12px;background:#191e1a;z-index:1}button{padding:9px 18px;margin:4px;background:#d9c69b;border:0;border-radius:4px;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}figure{margin:0;border:1px solid #475044;background:#2a322c;border-radius:8px;overflow:hidden}img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}figure[data-type=plant] img{aspect-ratio:1;object-fit:contain;background:#c7c2aa}figcaption{padding:12px}a{color:#efd6a7}</style><h1>식물 증거 아이템 · 원주민 마을</h1><p>내장 ImageGen 제작 · 생성 원본 보존 · 그림을 누르면 원본이 열립니다.</p><nav><button onclick="show('')">전체</button><button onclick="show('plant')">식물 증거</button><button onclick="show('village')">마을</button><button onclick="show('exterior')">건물 외부</button><button onclick="show('interior')">건물 내부</button></nav><div class="grid">'''+''.join(cards)+'''</div><script>function show(t){document.querySelectorAll('figure').forEach(e=>e.hidden=!!t&&e.dataset.type!==t)}</script></html>''', encoding='utf-8')
    if '--final' in sys.argv:
        assert len(records) == len(plan['jobs']), (len(records),len(plan['jobs']))
        with zipfile.ZipFile(OUT / 'plant-native-art-20261119.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
            archive.write(OUT/'prompts.json', 'prompts.json')
            for record in records:
                archive.write(ROOT/record['file'], record['file'])
    print(json.dumps({'completed': len(records), 'expected':len(plan['jobs']), 'keys':len(mapping)}))

if __name__ == '__main__':
    main()
