"""원본 PNG를 바꾸지 않고 각 셀의 주 피사체 좌표만 추출한다."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

ROOT = Path(__file__).resolve().parents[1]
result = {}
for sheet in range(1, 18):
    image = Image.open(ROOT / f'images/animal-tracking/animals-{sheet}.png').convert('RGBA')
    alpha = np.asarray(image)[:, :, 3]
    width, height = image.size
    cells = []
    for slot in range(16):
        left, top = round(slot % 4 * width / 4), round(slot // 4 * height / 4)
        right, bottom = round((slot % 4 + 1) * width / 4), round((slot // 4 + 1) * height / 4)
        labels, count = label(alpha[top:bottom, left:right] > 128)
        if not count:
            cells.append(None)
            continue
        sizes = np.bincount(labels.ravel()); sizes[0] = 0
        main = sizes.argmax()
        yy, xx = find_objects(labels)[main - 1]
        pad = 2
        x0, y0 = max(0, xx.start-pad)+left, max(0, yy.start-pad)+top
        x1, y1 = min(right-left, xx.stop+pad)+left, min(bottom-top, yy.stop+pad)+top
        cells.append([x0, y0, x1-x0, y1-y0])
    result[str(sheet)] = cells
path = ROOT / 'js/data/animaltracking_bounds.js'
path.write_text('/* 원본을 자르지 않고 주 피사체만 읽는 스프라이트 좌표. */\n(function(G){ G.ANIMAL_TRACKING_BOUNDS = '+json.dumps(result)+'; })(window.G=window.G||{});\n', encoding='utf-8', newline='\n')
print('17개 원본 시트의 주 피사체 좌표 추출 완료')
