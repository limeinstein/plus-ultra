"""이야기 원고의 이름 변수·조사에서 실제 대사용 번역 틀을 만든다.

python tools/i18n/build_story_runtime.py fr story_photo_20261122.tsv
원고의 {name} 같은 변수는 이름 자리로, {wife이/가} 같은 조사는 선택형으로 만든다.
원고 자체는 보존한다. 결과는 같은 폴더의 <원고명>_runtime.tsv다.
"""
from pathlib import Path
import re
import sys
from collections import defaultdict

HERE = Path(__file__).resolve().parent
VARIABLE = re.compile(r'\{([A-Za-z][A-Za-z0-9]*)\}')
PARTICLE = re.compile(r'\{[A-Za-z]+([가-힣]+/[가-힣]+)\}')


def expand(ko, translation):
    positions = defaultdict(list)
    number = 0
    ko = PARTICLE.sub(lambda m: '(' + m[1].replace('/', '|') + ')', ko)
    if not VARIABLE.search(ko):
        return None
    if '#' in ko or '@' in ko:
        raise ValueError('이름 변수와 기존 #/@가 섞인 원고는 별도 틀로 적는다: ' + ko)

    def capture(match):
        nonlocal number
        number += 1
        positions[match[1]].append(number)
        return '@'

    runtime_key = VARIABLE.sub(capture, ko)
    used = defaultdict(int)

    def reference(match):
        name = match[1]
        if name not in positions:
            raise ValueError('원문에 없는 변수: ' + name)
        indexes = positions[name]
        index = indexes[min(used[name], len(indexes) - 1)]
        used[name] += 1
        return '{' + str(index) + '}'

    return runtime_key, VARIABLE.sub(reference, translation)


def main():
    if len(sys.argv) != 3:
        raise SystemExit('사용법: python tools/i18n/build_story_runtime.py fr 원고.tsv')
    lang, name = sys.argv[1:]
    directory = (HERE / lang).resolve()
    source = (directory / name).resolve()
    if directory.parent != HERE or source.parent != directory or source.suffix != '.tsv':
        raise SystemExit('언어 폴더 안의 TSV 원고를 지정한다.')
    output = source.with_name(source.stem + '_runtime.tsv')
    rows = []
    seen = set()
    for line in source.read_text(encoding='utf-8').splitlines():
        if not line.strip() or '\t' not in line or line.startswith('#\t'):
            continue
        pair = expand(*line.split('\t', 1))
        if pair and pair[0] not in seen:
            seen.add(pair[0])
            rows.append('\t'.join(pair))
    output.write_text('\n'.join(rows) + '\n', encoding='utf-8', newline='\n')
    print(lang, source.name, '->', output.name, len(rows))


if __name__ == '__main__':
    main()
