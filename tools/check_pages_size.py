"""GitHub Pages에 게시할 전체 폴더가 1GB 한도 이내인지 확인한다."""
from pathlib import Path
import sys

root = Path(sys.argv[1]).resolve()
if not root.is_dir():
    raise SystemExit('게시 폴더가 없습니다: ' + str(root))
total = sum(p.stat().st_size for p in root.rglob('*') if p.is_file())
print(f'Pages 게시 용량: {total / 1024**2:.1f} MiB ({total:,} bytes)')
if total > 1_000_000_000:
    raise SystemExit('Pages 게시 한도 1GB를 넘었습니다. 그림 주소와 중복 자산 설정을 확인하십시오.')
