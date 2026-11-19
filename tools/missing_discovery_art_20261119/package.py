"""누락된 발견물 4종과 해적 전리품 15종을 변환하고 등록한다."""
import importlib.util
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'artifacts/missing-catalog-art-20261119'
module = importlib.util.spec_from_file_location('discovery_pack', ROOT / 'tools/discovery_art_20261111/package.py')
pack = importlib.util.module_from_spec(module)
module.loader.exec_module(pack)
pack.OUT = OUT


def main():
    spec = pack.read(HERE / 'prompts.json')
    records = []
    for asset in spec['assets']:
        # 원본을 작업 폴더에 보존해 생성 도구의 저장 위치가 없어져도 재현한다.
        saved = OUT / 'raw' / (asset['id'] + '.png')
        record = pack.build(asset, {'source': str(saved if saved.exists() else Path(asset['source']))})
        for file in record['files']:
            path = ROOT / file['file']
            assert pack.digest(path) == file['sha256'], path
            with Image.open(path) as image:
                image.load()
                if asset['kind'] != 'scene':
                    assert image.size == (256, 256) and image.mode == 'RGBA'
                    alpha = image.getchannel('A')
                    assert alpha.getextrema() == (0, 255)
                    box = alpha.getbbox()
                    assert min(box[0], box[1], 256 - box[2], 256 - box[3]) >= 13
                elif path.suffix == '.gif':
                    assert image.size == (576, 256) and image.n_frames == 24
                    frames, duration = set(), 0
                    for i in range(image.n_frames):
                        image.seek(i)
                        frames.add(image.convert('RGB').tobytes())
                        duration += image.info['duration']
                    # 루프의 첫 장면과 끝 장면이 같아도 중간 확대·이동은 유지된다.
                    assert len(frames) >= 20 and duration == 9600
                else:
                    assert image.size == ((3456, 1024) if path.suffix == '.webp' else (576, 256))
        records.append(record)
    # 기존 연결과 다른 작업에서 등록한 그림을 유지하며 새 열쇠만 추가한다.
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    entries = {}
    for asset in spec['assets']:
        for name in (('output', 'end', 'sheet') if asset['kind'] == 'scene' else ('output',)):
            file = asset[name][len('images/'):]
            key = file.rsplit('.', 1)[0]
            if json.dumps(key) + ':' not in text:
                entries[key] = file
    marker = 'G.IMAGE_FILES = {\n'
    assert marker in text
    block = ''.join('  ' + json.dumps(k) + ': ' + json.dumps(v) + ',\n' for k, v in sorted(entries.items()))
    if block:
        manifest.write_text(text.replace(marker, marker + block, 1), encoding='utf-8', newline='\n')
    pack.write(HERE / 'assets.json', records)
    pack.previews(spec, records)
    print('발견물 4종·전리품 15종: 게임 파일 27개, 재생·투명도·여백·해시·크기 확인')


if __name__ == '__main__':
    main()
