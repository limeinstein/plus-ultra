"""발견물의 폐기한 재제작본과 바이트까지 같은 런타임 파일을 정리한다."""
from collections import defaultdict
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
sys.stdout.reconfigure(encoding='utf-8')


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    apply = '--apply' in sys.argv
    previous = HERE / 'deduplication.json'
    if previous.exists() and json.loads(previous.read_text(encoding='utf-8')).get('status') == 'complete':
        print('이미 중복 정리가 끝났습니다. deduplication.json에 삭제 기록이 있습니다.')
        return
    restored = json.loads((HERE / 'reuse-native.json').read_text(encoding='utf-8'))
    assert len(restored) == 2784 and all(r['status'] == 'restored' for r in restored)
    assert all((ROOT / r['target']).is_file() for r in restored)
    assert not any((ROOT / 'tools/discovery_painted_20261126/before').rglob('*.*'))
    # 배포 스냅샷이나 다른 작업 영역은 검사·삭제 대상이 아니다.
    obsolete = [ROOT / 'tools/discovery_painted_20261126' / name
                for name in ('sources', 'revisions', 'before', 'receipts')]
    obsolete += [ROOT / 'artifacts/discovery-painted-20261126']
    actions = []
    for folder in obsolete:
        folder = folder.resolve()
        assert folder.is_relative_to(ROOT) and folder != ROOT
        if folder.exists():
            for path in sorted(folder.rglob('*')):
                if path.is_file():
                    assert not path.is_symlink() and path.resolve().is_relative_to(folder)
                    actions.append({'file': path.relative_to(ROOT).as_posix(),
                                    'bytes': path.stat().st_size, 'reason': '폐기한 중복 재제작본'})
    overrides = {}
    # 같은 크기는 후보일 뿐이다. SHA-256까지 같을 때만 한 파일로 연결한다.
    for name in ('discoveries', 'discovery-ends', 'discovery-sheets'):
        by_size = defaultdict(list)
        for path in (ROOT / 'images' / name).iterdir():
            if path.suffix in ('.gif', '.jpg', '.webp'):
                by_size[path.stat().st_size].append(path)
        for candidates in by_size.values():
            if len(candidates) < 2:
                continue
            by_hash = defaultdict(list)
            for path in candidates:
                by_hash[digest(path)].append(path)
            for sha, group in by_hash.items():
                if len(group) < 2:
                    continue
                # 옛 날치 이름, 복어의 같은 그림은 바다 발견물 정식 경로로 모은다.
                owner = min(group, key=lambda p: (not p.stem.startswith('f_'), p.name))
                for path in group:
                    if path == owner:
                        continue
                    overrides[name + '/' + path.stem] = owner.relative_to(ROOT / 'images').as_posix()
                    actions.append({'file': path.relative_to(ROOT).as_posix(), 'bytes': path.stat().st_size,
                                    'reason': '동일 SHA-256', 'sha256': sha,
                                    'owner': owner.relative_to(ROOT).as_posix()})
    report = {'status': 'planned', 'files': len(actions), 'bytes': sum(r['bytes'] for r in actions),
              'runtimeAliases': overrides, 'actions': actions}
    write(HERE / 'deduplication.json', report)
    write(HERE / 'asset-overrides.json', overrides)
    print('정리 대상', len(actions), '파일 /', round(report['bytes'] / 1024**3, 3), 'GiB', flush=True)
    print('런타임 중복', overrides, flush=True)
    if not apply:
        return
    manifest_path = ROOT / 'images/manifest.js'
    manifest = manifest_path.read_text(encoding='utf-8')
    for key, rel in overrides.items():
        pattern = r'("' + re.escape(key) + r'"\s*:\s*)"[^"]+"'
        manifest, count = re.subn(pattern, lambda m: m[1] + json.dumps(rel), manifest)
        assert count == 1, (key, count)
        assert (ROOT / 'images' / rel).is_file()
    # 먼저 연결을 바꾼다. 중간에 멈춰도 게임이 삭제한 파일을 가리키지 않는다.
    manifest_path.write_text(manifest, encoding='utf-8', newline='\n')
    for i, row in enumerate(actions):
        path = (ROOT / row['file']).resolve()
        assert path.is_relative_to(ROOT) and not path.is_symlink()
        if 'owner' in row:
            assert digest(ROOT / row['owner']) == row['sha256']
        path.unlink()
        row['deleted'] = True
        if (i + 1) % 256 == 0:
            print('중복 삭제', i + 1, '/', len(actions), flush=True)
            write(HERE / 'deduplication.json', report)
    for folder in obsolete:
        if folder.exists():
            for path in sorted(folder.rglob('*'), key=lambda p: len(p.parts), reverse=True):
                if path.is_dir():
                    path.rmdir()
            folder.rmdir()
    report['status'] = 'complete'
    write(HERE / 'deduplication.json', report)
    print('완료', report['files'], '파일 삭제', flush=True)


if __name__ == '__main__':
    main()
