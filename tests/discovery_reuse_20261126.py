"""기존 발견 GIF 복구·중복 삭제·저장 호환용 이미지 연결을 검사한다."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HERE = ROOT / 'tools/discovery_category_20261126'
sys.path.insert(0, str(ROOT / 'tools'))
from complete_discovery_art import complete_runtime
import images


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    rows = complete_runtime()
    assert len(rows) == len({r['id'] for r in rows})
    restored = json.loads((HERE / 'reuse-native.json').read_text(encoding='utf-8'))
    report = json.loads((HERE / 'deduplication.json').read_text(encoding='utf-8'))
    assert report['status'] == 'complete' and all(a['deleted'] for a in report['actions'])
    assert len(restored) == 2784 and all(a['status'] == 'restored' for a in restored)
    for action in report['actions']:
        assert not (ROOT / action['file']).exists(), action['file']
    files = dict(re.findall(r'^\s*"([^"]+)"\s*:\s*"([^"]+)"',
                           (ROOT / 'images/manifest.js').read_text(encoding='utf-8'), re.M))
    aliases = json.loads((HERE / 'asset-overrides.json').read_text(encoding='utf-8'))
    assert aliases == report['runtimeAliases']
    keys = []
    for row in rows:
        for folder, suffix in [('discoveries', '.gif'), ('discovery-ends', '.jpg'), ('discovery-sheets', '.webp')]:
            key = folder + '/' + row['id']
            assert key in files, key
            rel = files[key]
            target = (ROOT / 'images' / rel).resolve()
            assert target.is_relative_to((ROOT / 'images' / folder).resolve()) and target.suffix == suffix
            assert target.is_file(), target
            keys.append(key)
    for key, rel in aliases.items():
        assert files[key] == images.PREFERRED_FILES[key] == rel
    # 전체 파일 복사 없이 복구했던 주요 갈래·기존 완성본의 해시를 다시 대조한다.
    samples = {'bulguksa', 'colosseum', 'giza', 'moonjar', 'monalisa',
               'canyon', 'solomon', 'sequoia', 't_pepper', 'ft_hangzhou'}
    checked = []
    for action in restored:
        assert (ROOT / action['target']).is_file(), action['target']
        if action['id'] in samples:
            assert digest(ROOT / action['target']) == action['sha256'], action['target']
            checked.append(action['target'])
    assert len(checked) == len(samples) * 3
    assert not (ROOT / 'tools/discovery_painted_20261126/sources').exists()
    assert not (ROOT / 'artifacts/discovery-painted-20261126').exists()
    for did in ('flyingfish', 'pufferfish'):
        for folder, suffix in [('discoveries', '.gif'), ('discovery-ends', '.jpg'), ('discovery-sheets', '.webp')]:
            assert not (ROOT / 'images' / folder / (did + suffix)).exists()
    spec = importlib.util.spec_from_file_location('animal_reuse_test', ROOT / 'tools/animal_gifs/build.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.build_one('pufferfish') == ROOT / 'images/discoveries/f_puffer.gif'
    with Image.open(ROOT / 'images/discoveries/f_puffer.gif') as im:
        assert im.size == (576, 256) and im.n_frames == 18
    result = {'pass': True, 'discoveries': len(rows), 'imageKeys': len(keys),
              'restoredDiscoveries': len(restored) // 3, 'restoredHashSamples': checked,
              'aliases': aliases, 'deletedFiles': report['files'], 'deletedBytes': report['bytes']}
    out = ROOT / 'artifacts/discovery-category-20261126'
    out.mkdir(exist_ok=True)
    (out / 'reuse-qa.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f"PASS: 발견물 {len(rows)}종, 이미지 연결 {len(keys)}개, 기존 완성본 해시 {len(checked)}개, 중복 삭제 {report['files']}파일")


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
