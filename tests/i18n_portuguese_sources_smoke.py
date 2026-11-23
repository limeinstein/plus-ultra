"""포르투갈어 원본의 숫자·이름 치환과 번역 열을 검사한다."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools/i18n'))
from tsv_tools import compile_row

rows = patterns = 0
for source in sorted((ROOT / 'tools/i18n/pt').glob('*.tsv')):
    for number, line in enumerate(source.read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip() or line.startswith('#\t'):
            continue
        columns = line.split('\t')
        label = f'{source.name}:{number}'
        assert len(columns) == (3 if source.name.startswith('person_') else 2), label
        translation = columns[-1]
        assert translation.strip() and not re.search('[가-힣\ufffd]', translation), label
        rows += 1
        if source.name.startswith(('person_', 'names_', '_')):
            continue
        kind, key, value = compile_row(columns[0], translation)
        if kind == 'pat':
            patterns += 1
            captures = re.compile(key).groups
            references = {int(n) for n in re.findall(r'\$(\d+)', value)}
            assert references == set(range(1, captures + 1)), (label, captures, references)
        else:
            def variables(text):
                return set(re.findall(r'\{([A-Za-z][A-Za-z0-9_]*)[^}]*\}', text))
            original, translated = variables(key), variables(value)
            # fmtDate는 월 번호 m 대신 번역한 월 이름 mon도 제공한다.
            if key == '{y}년 {m}월 {d}일':
                translated = {'m' if name == 'mon' else name for name in translated}
            # 이야기 날짜 포맷은 월 번호와 번역한 월 이름을 함께 제공한다.
            if source.name == 'story_qa_20261123.tsv' and 'monthNum' in original:
                translated = {'monthNum' if name == 'month' else name for name in translated}
            assert original == translated, (label, original, translated)

print(f'포르투갈어 원본 {rows}행 · 치환 틀 {patterns}행 · 변수 누락·번역 열 손상 0')
