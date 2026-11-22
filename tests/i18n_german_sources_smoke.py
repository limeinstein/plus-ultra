"""독일어 번역의 원문 범위, 치환 값, 재생성과 기존 번역 보존을 검사한다."""
from pathlib import Path
import hashlib, json, os, re, subprocess, sys, tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools/i18n'))
from tsv_tools import compile_row

source = ROOT / 'tools/i18n/de'
keys = set()
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
        keys.add((kind, key))
        if kind == 'pat':
            count = re.compile(key).groups
            refs = {int(n) for n in re.findall(r'\$(\d+)', replacement)}
            assert refs <= set(range(1, count + 1)), (label, count, refs)
            # 정규식 원문의 끝 (.*)는 이미 번역한 고정 설명의 나머지를 받는다.
            # 일반 #/@ 틀은 숫자·이름 자리 모두가 번역문에 남아야 한다.
            if not (parts[0].startswith('/') and parts[0].endswith('/')):
                assert refs == set(range(1, count + 1)), (label, count, refs)
        else:
            variables = lambda text: set(re.findall(r'\{([A-Za-z][A-Za-z0-9_]*)[^}]*\}', text))
            original, translated = variables(key), variables(replacement)
            if key == '{y}년 {m}월 {d}일':
                translated = {'m' if v == 'mon' else v for v in translated}
            assert original == translated, (label, original, translated)

coverage = {}
complete = ['create', 'battle', 'field', 'city_a1', 'city_a2', 'city_d1', 'city_l1', 'city_l2', 'econ', 'notebook', 'ships', 'misc1', 'lisbon', 'tutorial', 'other_g1h', 'runtime_20261114', 'runtime_20261115', 'runtime_20261122']
for name in complete:
    pending = []
    for line in (ROOT / f'tools/i18n/en/{name}.tsv').read_text(encoding='utf-8').splitlines():
        if '\t' not in line:
            continue
        ko, reference = line.split('\t', 1)
        kind, key, _ = compile_row(ko, reference)
        if (kind, key) not in keys:
            pending.append(ko)
    coverage[name] = len(pending)
    assert not pending, (name, pending[:3])

with tempfile.TemporaryDirectory(prefix='good-hope-german-') as scratch:
    built = Path(scratch) / 'de.js'
    result = subprocess.run([sys.executable, 'tools/i18n/build_lang.py', 'de', str(built)], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
    assert result.returncode == 0, result.stderr
    assert built.read_text(encoding='utf-8') == (ROOT / 'js/lang/de.js').read_text(encoding='utf-8'), '원본 재생성 불일치'

baseline = os.environ.get('PREVIOUS_DE_PACK')
preserved = None
if baseline:
    old = json.loads(Path(baseline).read_text(encoding='utf-8'))
    script = "let p;global.window={G:{I18N:{add:(id,x)=>p=x}}};require('./js/lang/de.js');process.stdout.write(JSON.stringify(p));"
    new = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT).decode('utf-8'))
    preserved = 0
    for section in ['text', 'city', 'good', 'name']:
        for key, value in old.get(section, {}).items():
            assert new[section].get(key) == value, (section, key, '기존 번역 변경')
            preserved += 1
    patterns = dict(new['pat'])
    for key, value in old['pat']:
        assert patterns.get(key) == value, ('pat', key, '기존 번역 변경')
        preserved += 1
    for group, values in old['person'].items():
        for key, value in values.items():
            assert new['person'][group].get(key) == value, ('person', group, key)
            preserved += 1

print(json.dumps({'sourceRows': rows, 'completeSourceBundles': coverage, 'buildMatches': True, 'preservedEntries': preserved, 'errors': []}, ensure_ascii=False))
