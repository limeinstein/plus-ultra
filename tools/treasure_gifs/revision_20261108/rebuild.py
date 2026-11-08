"""95종의 독립된 보물 파일을 동시에 세 개씩 제작한다."""
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import build


def one(did):
    dst = build.build_one(did)
    return did, dst.stat().st_size // 1024


if __name__ == '__main__':
    ids = list(build.PROFILES)
    with ProcessPoolExecutor(max_workers=3) as pool:
        jobs = [pool.submit(one, did) for did in ids]
        for i, future in enumerate(as_completed(jobs), 1):
            did, kb = future.result()
            print(f'[{i:02d}/{len(ids)}] {did} {kb} KB', flush=True)
