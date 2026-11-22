"""일본어 원본의 치환 값·범위, 가이드북 구조와 재생성 일치를 검사한다."""
from pathlib import Path
import importlib.util
import json
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools/i18n'))
from tsv_tools import compile_row

source = ROOT / 'tools/i18n/ja'
keys, names, rows = set(), set(), 0
for file in sorted(source.glob('*.tsv')):
    for number, line in enumerate(file.read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip() or line.startswith('#\t'):
            continue
        parts = line.split('\t')
        label = f'{file.name}:{number}'
        assert len(parts) == (3 if file.name.startswith('person_') else 2), label
        value = parts[-1]
        assert value and not re.search('[가-힣\ufffd]', value), label
        rows += 1
        if file.name.startswith('names_'):
            names.add(parts[0])
            continue
        if file.name.startswith(('person_', '_')):
            continue
        kind, key, replacement = compile_row(parts[0], value.replace('\\n', '\n'))
        keys.add((kind, key))
        if kind == 'pat':
            count = re.compile(key).groups
            refs = {int(n) for n in re.findall(r'\$(\d+)', replacement)}
            assert refs <= set(range(1, count + 1)), (label, count, refs)
            if not (parts[0].startswith('/') and parts[0].endswith('/')):
                assert refs == set(range(1, count + 1)), (label, count, refs)
        else:
            variables = lambda s: set(re.findall(r'\{([A-Za-z][A-Za-z0-9_]*)[^}]*\}', s))
            original, translated = variables(key), variables(replacement)
            if key == '{y}년 {m}월 {d}일':
                translated = {'m' if v == 'mon' else v for v in translated}
            assert original == translated, (label, original, translated)

coverage = {}
for name in ['tutorial', 'names_disc1', 'names_disc2', 'names_disc3', 'names_story_20261122', 'names_song_20261122', 'runtime_20261122', 'story_jhook_ui_20261122', 'story_song_ui_20261122', 'story_jhook_opening_20261122', 'story_jhook_rest_20261122', 'story_song_20261122']:
    pending = []
    for line in (ROOT / f'tools/i18n/en/{name}.tsv').read_text(encoding='utf-8').splitlines():
        if '\t' not in line or line.startswith('#\t'):
            continue
        ko, reference = line.split('\t', 1)
        kind, key, _ = compile_row(ko, reference)
        covered = ko in names if name.startswith('names_') else (kind, key) in keys
        if not covered:
            pending.append(ko)
    coverage[name] = len(pending)
    assert not pending, (name, pending[:3])

for name in ['photo_story_20261122', 'photo_heir_20261122', 'photo_runtime_20261122', 'names_photo_20261122', 'names_photo_runtime_20261122']:
    pending = []
    for line in (ROOT / f'tools/i18n/pt/{name}.tsv').read_text(encoding='utf-8').splitlines():
        if '\t' not in line or line.startswith('#\t'):
            continue
        ko, reference = line.split('\t', 1)
        kind, key, _ = compile_row(ko, reference)
        if not (ko in names if name.startswith('names_') else (kind, key) in keys):
            pending.append(ko)
    coverage[name] = len(pending)
    assert not pending, (name, pending[:3])

spec = importlib.util.spec_from_file_location('guidebook_build', ROOT / 'tools/guidebook/build.py')
guide = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guide)
ko, images_ko = guide.build(ROOT / 'docs/guidebook.md')
ja, images_ja = guide.build(ROOT / 'docs/guidebook.ja.md')
assert len(ja) == 11 and sum(len(c['secs']) for c in ja) == 70
assert [len(c['secs']) for c in ja] == [len(c['secs']) for c in ko]
assert [c['id'] for c in ja] == [c['id'] for c in ko]
assert images_ja == images_ko and len(images_ja) == 38
for original, translated in zip(ko, ja):
    assert re.findall(r'data-gk="([^"]+)"', original['html']) == re.findall(r'data-gk="([^"]+)"', translated['html'])
    visible = json.dumps(translated, ensure_ascii=False).replace('{{명성_칭호}}', '')
    assert not re.search('[가-힣\ufffd]', visible), translated['id']

with tempfile.TemporaryDirectory(prefix='good-hope-japanese-') as scratch:
    built = Path(scratch) / 'ja.js'
    result = subprocess.run([sys.executable, 'tools/i18n/build_lang.py', 'ja', str(built)], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
    assert result.returncode == 0, result.stderr
    assert built.read_bytes() == (ROOT / 'js/lang/ja.js').read_bytes(), '원본 재생성 불일치'

print(json.dumps({'sourceRows': rows, 'missing': coverage, 'guidebookChapters': 11, 'guidebookPages': 70, 'guidebookImages': 38, 'regeneration': True}, ensure_ascii=False))
