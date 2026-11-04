"""이 채팅에서 요청한 사건의 실제 그림 호출·등록·파일 해독을 대조한다."""
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MODULES = ['africa17', 'safavid', 'mohacs', 'wangmerchant', 'wangmoon']


def main():
    text = (ROOT/'images/manifest.js').read_text(encoding='utf-8')
    files = json.loads(re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text).group(1))
    checks, missing = [], []
    for module in MODULES:
        source = (ROOT/'js/systems'/f'{module}.js').read_text(encoding='utf-8')
        keys = sorted(set(re.findall(r'''(?:withPic|pic|playScene)\(\s*['"]([a-z0-9_]+)['"]''', source)))
        for short in keys:
            key = 'legend-events/'+short
            file = ROOT/'images'/files.get(key, key+'.webp')
            row = {'system': module, 'key': key, 'registered': key in files, 'exists': file.is_file()}
            try:
                with Image.open(file) as picture:
                    picture.load()
                    row['size'] = list(picture.size)
                    row['decoded'] = True
            except (OSError, ValueError) as error:
                row['decoded'] = False
                row['error'] = str(error)
            row['ok'] = row['registered'] and row['exists'] and row['decoded'] and row.get('size') == [1881, 836]
            if not row['ok']:
                missing.append(key)
            checks.append(row)
    output = ROOT/'artifacts/merchant-event-shots-20261104/after-audit.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'date': '2026-11-04', 'scope': MODULES, 'total': len(checks), 'missing': missing, 'checks': checks}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'total': len(checks), 'missing': missing}))
    return 1 if missing else 0


if __name__ == '__main__':
    raise SystemExit(main())
