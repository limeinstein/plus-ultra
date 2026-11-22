"""스페인어 후속 원고의 변수·치환 자리, 가이드북 구조와 적용본 재현을 확인한다."""
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

source = ROOT / 'tools/i18n/es'
files = ['song_main_20261122.tsv', 'gold_main_20261122.tsv',
         'names_song_followup_20261122.tsv', 'names_gold_followup_20261122.tsv',
         'runtime_stories_followup_20261122.tsv', 'runtime_story_details_20261122.tsv',
         'events_africa17_20261122.tsv', 'names_africa17_20261122.tsv']
counts, patterns = {}, 0
variables = lambda s: set(re.findall(r'\{([A-Za-z][A-Za-z0-9_]*)(?:[|:][^}]+)?\}', s))
for name in files:
    counts[name] = 0
    for number, line in enumerate((source / name).read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip() or line.startswith('#\t'):
            continue
        parts = line.split('\t')
        label = f'{name}:{number}'
        assert len(parts) == 2, label
        ko, es = parts
        assert es and not re.search('[가-힣\ufffd]', es), label
        counts[name] += 1
        if name.startswith('names_'):
            continue
        kind, key, value = compile_row(ko, es.replace('\\n', '\n'))
        if kind == 'pat':
            count = re.compile(key).groups
            refs = {int(n) for n in re.findall(r'\$(\d+)', value)}
            assert refs == set(range(1, count + 1)), (label, count, refs)
            patterns += 1
        else:
            assert variables(key) == variables(value), (label, variables(key), variables(value))

ko, es = [(ROOT / ('docs/guidebook' + suffix + '.md')).read_text(encoding='utf-8') for suffix in ['', '.es']]
strip_comments = lambda s: re.sub(r'<!--.*?-->', '', s, flags=re.S)
ko, es = strip_comments(ko), strip_comments(es)
count = lambda s, pattern: len(re.findall(pattern, s, re.M))
assert count(ko, '^## ') == count(es, '^## ') == 11
assert count(ko, '^### ') == count(es, '^### ') == 70
images = lambda s: re.findall(r'!\[[^\]]*\]\(([^)]+)\)', s)
assert images(ko) == images(es)
tables = lambda s: [len(re.split(r'(?<!\\)\|', line)) for line in s.splitlines() if line.startswith('|')]
assert tables(ko) == tables(es)
assert not re.search('[가-힣]', es.replace('{{명성_칭호}}', ''))

spec = importlib.util.spec_from_file_location('guidebook_build', ROOT / 'tools/guidebook/build.py')
guide = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guide)
chapters, keys = guide.build(ROOT / 'docs/guidebook.es.md')
base, base_keys = guide.build(ROOT / 'docs/guidebook.md')
assert keys == base_keys
for original, translated in zip(base, chapters):
    for tag in ['table', 'tr', 'td', 'th', 'figure', 'img', 'h3']:
        assert count(original['html'], '<' + tag + r'\b') == count(translated['html'], '<' + tag + r'\b'), (original['id'], tag)

with tempfile.TemporaryDirectory(prefix='i18n-es-') as work:
    built = Path(work) / 'es.js'
    subprocess.run([sys.executable, str(ROOT / 'tools/i18n/build_lang.py'), 'es', str(built)], cwd=ROOT, check=True, capture_output=True)
    assert built.read_bytes() == (ROOT / 'js/lang/es.js').read_bytes(), '스페인어 적용본 재현'

print(json.dumps({'sourceFiles': counts, 'sourceRows': sum(counts.values()), 'checkedPatterns': patterns,
                  'guidebook': {'chapters': 11, 'pages': 70, 'imageReferences': len(images(es)), 'imageKeys': len(keys),
                                'tableRows': len(tables(es))}, 'buildMatches': True}, ensure_ascii=False))
