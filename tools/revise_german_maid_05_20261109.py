"""5번 여급의 자세·의상 수정 원화를 보존하고 두 초상을 갱신한다."""
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image
from import_generated_portrait import face_square
import package_german_maids_20261109 as package


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    root = Path(__file__).resolve().parents[1]
    art = root / 'artifacts/german-maids-20261109'
    spec = json.loads((root / 'tools/german_maids_20261109_prompts.json').read_text(encoding='utf-8'))
    row = next(r for r in spec['portraits'] if r['id'] == 'german_maid_05')
    assert row['key'] == 'maid-styles/germany/6' and row['revision'] == 2
    backup = art / 'revisions/german_maid_05_v1'
    backup.mkdir(parents=True, exist_ok=True)
    existing = list((root / 'images/maid-styles/germany').glob('*.webp'))
    untouched = {p: digest(p) for p in existing if p.name not in ('6.webp', '6_half.webp')}
    half = Image.open(row['source']).copy()
    assert half.mode == 'RGBA' and half.size == (1024, 1536)
    source = root / row['workspace_source']
    for path in [source, root / row['face_file'], root / row['half_file']]:
        if not (backup / path.name).exists():
            shutil.copy2(path, backup / path.name)
    package.save_json(backup / 'untouched-sha256.json', {p.relative_to(root).as_posix(): h for p, h in untouched.items()})
    edit_input = root / row['edit_input']
    if not edit_input.exists():
        shutil.copy2('C:/Users/User/AppData/Local/Temp/codex-clipboard-007ae596-6602-43ce-9cfb-28112135a9a6.png', edit_input)
    shutil.copy2(row['source'], source)
    face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
    for file, image in [(row['face_file'], face), (row['half_file'], half)]:
        image.save(root / file, 'WEBP', quality=95, method=4, exact=True)
    package.main()
    assert all(digest(path) == before for path, before in untouched.items()), '다른 여급 원화가 바뀌었습니다'
    print('5번 여급 두 초상 갱신. 이전 버전 보관. 다른 여급 파일 보존.')


if __name__ == '__main__':
    main()
