"""프랑스어 원고·치환 자리·이야기 틀·가이드북 구조와 적용본 재현을 검사한다."""
from pathlib import Path
import json
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools/i18n'))
from tsv_tools import compile_row
from build_story_runtime import expand

source = ROOT / 'tools/i18n/fr'
rows = 0
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
        if file.name.startswith(('names_', 'person_', '_')):
            continue
        kind, key, replacement = compile_row(parts[0], value.replace('\\n', '\n'))
        if kind == 'pat':
            count = re.compile(key).groups
            refs = {int(n) for n in re.findall(r'\$(\d+)', replacement)}
            assert refs <= set(range(1, count + 1)), (label, count, refs)
            if not (parts[0].startswith('/') and parts[0].endswith('/')):
                assert refs == set(range(1, count + 1)), (label, count, refs)
        else:
            variables = lambda s: set(re.findall(r'\{([A-Za-z][A-Za-z0-9_]*)(?:[|:][^}]+)?\}', s))
            original, translated = variables(key), variables(replacement)
            if key == '{y}년 {m}월 {d}일':
                translated = {'m' if v == 'mon' else v for v in translated}
            assert original == translated, (label, original, translated)

templates = {}
for name in ['photo', 'song', 'gold']:
    stem = 'story_' + name + '_20261122'
    expected, seen = [], set()
    for line in (source / (stem + '.tsv')).read_text(encoding='utf-8').splitlines():
        pair = expand(*line.split('\t', 1))
        if pair and pair[0] not in seen:
            seen.add(pair[0])
            expected.append('\t'.join(pair))
    assert (source / (stem + '_runtime.tsv')).read_text(encoding='utf-8') == '\n'.join(expected) + '\n', stem
    templates[name] = len(expected)

ko = (ROOT / 'docs/guidebook.md').read_text(encoding='utf-8')
fr = (ROOT / 'docs/guidebook.fr.md').read_text(encoding='utf-8')
ko = re.sub(r'<!--.*?-->', '', ko, flags=re.S)
fr = re.sub(r'<!--.*?-->', '', fr, flags=re.S)
count = lambda s, pattern: len(re.findall(pattern, s, re.M))
assert count(ko, '^## ') == count(fr, '^## ') == 11
assert count(ko, '^### ') == count(fr, '^### ') == 70
images = lambda s: re.findall(r'!\[[^\]]*\]\(([^)]+)\)', s)
assert images(ko) == images(fr)
tables = lambda s: [len(re.split(r'(?<!\\)\|', line)) for line in s.splitlines() if line.startswith('|')]
assert tables(ko) == tables(fr)
assert not re.search('[가-힣]', re.sub(r'<!--.*?-->', '', fr, flags=re.S).replace('{{명성_칭호}}', ''))

with tempfile.TemporaryDirectory(prefix='i18n-fr-') as work:
    built = Path(work) / 'fr.js'
    subprocess.run([sys.executable, str(ROOT / 'tools/i18n/build_lang.py'), 'fr', str(built)], cwd=ROOT, check=True, capture_output=True)
    assert built.read_bytes() == (ROOT / 'js/lang/fr.js').read_bytes(), '프랑스어 적용본 재현'

print(json.dumps({'sourceRows': rows, 'runtimeTemplates': templates, 'guidebook': {'chapters': 11, 'pages': 70, 'images': len(images(fr)), 'tableRows': len(tables(fr))}, 'buildMatches': True}, ensure_ascii=False))
