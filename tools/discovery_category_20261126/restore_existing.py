"""잘못 통일한 발견 GIF를 보관된 기존 갈래별 완성본으로 되돌린다."""
import hashlib
import json
from pathlib import Path
import sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
PRIOR = ROOT / 'tools/discovery_painted_20261126'
BACKUP = PRIOR / 'before'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    journal = HERE / 'reuse-native.json'
    if journal.exists():
        previous = json.loads(journal.read_text(encoding='utf-8'))
        if len(previous) == 2784 and all(r['status'] == 'restored' for r in previous):
            assert all((ROOT / r['target']).is_file() for r in previous)
            print('기존 GIF 복구가 끝났습니다. 중복 보관본은 정리했습니다.', flush=True)
            return
    records = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((PRIOR / 'receipts').glob('*.json'))]
    assert len(records) == 928
    actions = []
    # 삭제·이동 대상과 복구 경로를 먼저 전부 확인한다.
    for rec in records:
        for entry in rec['before']:
            src = (ROOT / entry['file']).resolve()
            assert src.is_relative_to(BACKUP.resolve()), src
            dst = (ROOT / src.relative_to(BACKUP.resolve())).resolve()
            assert dst.is_relative_to((ROOT / 'images').resolve()) and src != dst, dst
            assert src.is_file() or dst.is_file(), src
            actions.append({'id': rec['id'], 'name': rec['name'], 'source': src.relative_to(ROOT).as_posix(),
                'target': dst.relative_to(ROOT).as_posix(), 'sha256': entry['sha256'], 'status': 'pending'})
    journal.write_text(json.dumps(actions, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    for i, action in enumerate(actions):
        src, dst = ROOT / action['source'], ROOT / action['target']
        if src.exists():
            # 직전 전수 검사에서 해시를 확인한 기존 완성본이다. 복사본을 더 남기지 않는다.
            src.replace(dst)
        else:
            assert digest(dst) == action['sha256'], '복구 중단 파일 확인: '+str(dst)
        action['status'] = 'restored'
        if (i + 1) % 192 == 0:
            journal.write_text(json.dumps(actions, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
            print('기존 완성본 복구', (i+1)//3, '/ 928', flush=True)
    journal.write_text(json.dumps(actions, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print('완료: 기존 발견물 928종 · 2784파일 복구, 보관 중복 파일 이동 정리', flush=True)


if __name__ == '__main__':
    main()
