#!/usr/bin/env python3
"""생성 PNG를 그대로 복사하고, 실제 투명한 틈을 읽어 장면 좌표와 발밑 기준점을 기록한다.

그림을 다시 그리거나 변형하지 않는다. Pillow와 numpy는 픽셀 검사에만 쓴다.
실행: python tools/expedition_motion_meta.py
"""
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RECORDS = ROOT / 'tools/expedition_generation.json'
OUT = ROOT / 'images/sprites'
MOUNTS = [
    ('walk', 'on_foot', '도보'), ('porter', 'porter', '짐꾼'),
    ('horse', 'mounted', '말'), ('camel', 'camel', '낙타'),
    ('donkey', 'pack_donkey', '당나귀'), ('llama', 'pack_llama', '라마'),
    ('wagon', 'wagon', '마차'), ('elephant', 'elephant', '코끼리'),
    ('reindeer', 'reindeer_sled', '순록 썰매'), ('yak', 'pack_yak', '야크')
]


def boundaries(projection, count):
    """균등 격자 근처에서 몸체를 가장 적게 지나는 선을 고른다."""
    length = len(projection)
    step = length / count
    answer = [0]
    for i in range(1, count):
        expected = step * i
        lo = max(answer[-1] + 1, round(expected - step * 0.45))
        hi = min(length - 1, round(expected + step * 0.45))
        samples = np.arange(lo, hi + 1)
        score = projection[samples].astype(float) + np.abs(samples - expected) * 0.04
        answer.append(int(samples[np.argmin(score)]))
    return answer + [length]


def content_bounds(mask):
    """연결된 픽셀 덩어리를 재어 이웃 장면에서 넘어온 작은 조각을 자르는 범위에서 뺀다."""
    parent, runs, previous = [], [], []
    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for y, line in enumerate(mask):
        edges = np.diff(np.pad(line.astype(np.int8), (1, 1)))
        current = []
        for x0, x1 in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)):
            n = len(parent)
            parent.append(n)
            runs.append((int(x0), int(x1), y))
            for p in previous:
                a, b, _ = runs[p]
                if a <= x1 and b >= x0:
                    parent[root(p)] = root(n)
            current.append(n)
        previous = current
    parts = {}
    for n, (x0, x1, y) in enumerate(runs):
        k = root(n)
        if k not in parts:
            parts[k] = [0, x0, y, x1, y+1]
        b = parts[k]
        b[0] += x1-x0
        b[1], b[2], b[3], b[4] = min(b[1], x0), min(b[2], y), max(b[3], x1), max(b[4], y+1)
    main = max(parts.values(), key=lambda b: b[0])
    keep = []
    for b in parts.values():
        distance = max(main[1]-b[3], b[1]-main[3], main[2]-b[4], b[2]-main[4], 0)
        if b[0] >= main[0]*0.03 or distance <= 3:
            keep.append(b)
    return (max(0, min(b[1] for b in keep)-1), max(0, min(b[2] for b in keep)-1),
            min(mask.shape[1], max(b[3] for b in keep)+1), min(mask.shape[0], max(b[4] for b in keep)+1))


def inspect(file, cols, rows, walking=False):
    with Image.open(file) as im:
        assert im.mode == 'RGBA', f'{file.name}: 투명 RGBA가 아님'
        pixels = np.asarray(im)
        width, height = im.size
    alpha = pixels[:, :, 3]
    assert np.mean(alpha == 0) > 0.25, f'{file.name}: 투명 여백 부족'
    solid = alpha > 96  # 거의 투명한 색 잔여는 경계·몸 크기 측정에서 제외한다.
    xs = boundaries(solid.sum(axis=0), cols)
    cells, body_heights, border_hits = [None] * (cols * rows), [], []
    anchors = [None] * (cols * rows)
    # 같은 행의 발 높이가 서로 달라도 이웃 장면의 모자가 들어오지 않도록 열마다 나눈다.
    for c, (left, right) in enumerate(zip(xs, xs[1:])):
        ys = boundaries(solid[:, left:right].sum(axis=1), rows)
        for r, (top, bottom) in enumerate(zip(ys, ys[1:])):
            mask = solid[top:bottom, left:right]
            bx, by, br, bb = content_bounds(mask)
            mask = mask[by:bb, bx:br]
            y, x = np.nonzero(mask)
            assert x.size > 100, f'{file.name}: 빈 장면 {r},{c}'
            # 그림 생성기가 칸마다 달리 놓은 발밑을 그리는 쪽에서 정렬한다.
            pivot_x = round((int(x.min()) + int(x.max()) + 1) / 2, 2)
            pivot_y = int(y.max()) + 1
            cells[r * cols + c] = [left+bx, top+by, br-bx, bb-by, pivot_x, pivot_y]
            # 다리·꼬리가 벌어져 외곽이 바뀌어도 머리·상체 기준점은 흔들리지 않게 한다.
            crown = mask.copy()
            crown[int(y.min() + (y.max() - y.min()) * 0.20) + 1:] = False
            cy, cx = np.nonzero(crown)
            anchors[r * cols + c] = [float(np.mean(cx)), int(y.min())]
            body_heights.append(int(y.max()) - int(y.min()) + 1)
            edge = int(mask[0].sum()+mask[-1].sum()+mask[:,0].sum()+mask[:,-1].sum())
            if edge > 4:
                border_hits.append({'row': r, 'column': c, 'edgePixels': edge})
    if walking:
        for r in range(rows):
            indexes = range(r * cols, (r + 1) * cols)
            dx = float(np.median([cells[i][4] - anchors[i][0] for i in indexes]))
            dy = float(np.median([cells[i][5] - anchors[i][1] for i in indexes]))
            for i in indexes:
                cells[i][4] = round(anchors[i][0] + dx, 2)
                cells[i][5] = round(anchors[i][1] + dy, 2)
    return dict(width=width, height=height, columns=cols, rows=rows,
                bodyHeight=float(np.median(body_heights)), cells=cells,
                transparentFraction=round(float(np.mean(alpha == 0)), 4), edgeContacts=border_hits)


def main():
    data = json.loads(RECORDS.read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    result = {'version': 3, 'directions': ['N','NE','E','SE','S','SW','W','NW'],
              'frameRect': ['x','y','width','height','pivotX','pivotY'],
              'sheets': {}, 'mounts': {}}
    for record in data['records']:
        sid = record['id'] + '_' + record['action']
        name = 'expedition_v' + str(record.get('version', 2)) + '_' + sid + '.png'
        dest = OUT / name
        source = Path(record['source'])
        if source.exists() and source.resolve() != dest.resolve():
            shutil.copy2(source, dest)
        assert dest.exists(), f'{dest}: 원본을 먼저 생성해야 함'
        layout = record.get('layout', {'walk': (8,8), 'turn': (4,4), 'camp': (4,2)}[record['action']])
        sheet = inspect(dest, *layout, walking=record['action'] == 'walk')
        sheet.update(file='sprites/' + name, key='sprites/' + name[:-4], action=record['action'])
        sheet['admiralReferenceHeight'] = record['admiralReferenceHeight']
        if record['action'] == 'walk':
            sheet['framesPerDirection'] = layout[0]
            sheet['directionRows'] = record.get('directionRows', [[i, False] for i in range(8)])
        result['sheets'][sid] = sheet
    for mount, prefix, label in MOUNTS:
        result['mounts'][mount] = {'label': label, 'walk': prefix+'_walk', 'turn': prefix+'_turn', 'camp': 'common_camp'}
    manifest = ROOT / 'docs/art/expedition-motion-manifest.json'
    manifest.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    text = ('/* 자동 생성: python tools/expedition_motion_meta.py · 원본 PNG는 변형하지 않는다. */\n'
            '(function (G) {\n  \'use strict\';\n  G.EXPEDITION_MOTION = ' +
            json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ';\n'
            '  G.IMAGE_FILES = G.IMAGE_FILES || {};\n'
            '  Object.keys(G.EXPEDITION_MOTION.sheets).forEach(function (id) {\n'
            '    var s = G.EXPEDITION_MOTION.sheets[id]; if (!G.IMAGE_FILES[s.key]) G.IMAGE_FILES[s.key] = s.file;\n'
            '  });\n})(window.G = window.G || {});\n')
    (ROOT/'js/data/expedition_motion.js').write_text(text, encoding='utf-8')
    print(json.dumps({k:{'size':[s['width'],s['height']], 'frames':len(s['cells']),
                         'edgeContacts':len(s['edgeContacts'])} for k,s in result['sheets'].items()}, ensure_ascii=False))


if __name__ == '__main__':
    main()
