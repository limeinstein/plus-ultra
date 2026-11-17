"""원화의 유효 픽셀이 손실·복제 없이 여백 있는 전투 칸에 들어갔는지 검사한다."""
import json
from pathlib import Path
import zipfile
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'artifacts/pirate-duel-42-20261117'
entries = [e for e in json.loads((BASE / 'manifest.json').read_text(encoding='utf-8')) if e['id'] != 'concept_zahra']  # 원화 묶음의 비공개 시안은 배포 검사에서 제외
report = {'characters': len(entries), 'frames': 0, 'clippedPixels': 0, 'files': []}
assert len(entries) == 41
with zipfile.ZipFile(BASE / 'creature-combat-42.zip') as archive:
    for e in entries:
        source = np.asarray(Image.open(BASE / 'sources' / (e['id'] + '.png')).convert('RGBA'))
        target_path = ROOT / e['file']
        target = np.asarray(Image.open(target_path).convert('RGBA'))
        assert target.shape == (1216, 2592, 4)
        # 같은 픽셀 개수만 확인하면 손실과 복제가 상쇄될 수 있어 RGBA 값도 모두 비교한다.
        src = source.view(np.uint32).reshape(source.shape[:2])[source[:, :, 3] > 4]
        dst = target.view(np.uint32).reshape(target.shape[:2])[target[:, :, 3] > 4]
        assert np.array_equal(np.sort(src), np.sort(dst)), e['id']
        assert archive.read(e['id'] + '.png') == target_path.read_bytes(), e['id']
        margin = 1000
        for r in range(4):
            for c in range(6):
                a = target[r*304:(r+1)*304, c*432:(c+1)*432, 3]
                ys, xs = np.where(a > 4)
                assert len(ys), (e['id'], r, c, '빈 프레임')
                gap = min(xs.min(), ys.min(), 431-xs.max(), 303-ys.max())
                assert gap > 0, (e['id'], r, c, '프레임 가장자리 잘림')
                margin = min(margin, int(gap))
                report['frames'] += 1
        report['files'].append({'id': e['id'], 'pixels': len(src), 'minMargin': margin})
assert report['frames'] == 984
(BASE / 'frame-integrity-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('41명·984칸: RGBA 유효 픽셀 손실·복제 0, 가장자리 잘림 0, ZIP 일치')
