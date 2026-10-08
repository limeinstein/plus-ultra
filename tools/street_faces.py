"""거리를 걷는 마을 사람의 얼굴·무릎상 만들기 (Codex 앞모습 시트 → images/portraits/street-folk/)

Codex가 지역마다 그린 앞모습 시트(1024×1536, 4×4 칸, 앞 13칸이 사람)를 칸마다 잘라
  · <그림 이름>_<양식>_half.webp  무릎 위 전신 (대화창 옆에 서는 그림, 512×약 770)
  · <그림 이름>_<양식>.webp       얼굴 (대화창 얼굴 칸, 512×512)
걷는 그림(images/street-folk/<그림 이름>_<양식>.webp)과 같은 사람이라 옷·얼굴·성별이 맞는다. js/systems/streetfolk.js SF.speaker 가 쓴다.
로 만든다. 배경은 rembg(isnet-general-use)로 지워 다른 초상처럼 투명하게 한다.
칸 순서는 images/npc-walk/sprite_manifest.json 의 roles 순서(강아지·고양이 pet 빼고)와 같다.
칸 사이 선은 시트마다 몇 픽셀씩 어긋나므로 밝기 변화가 가장 큰 줄을 찾아 자른다.

  python tools/street_faces.py <시트 폴더(af.png …)> [--out images/portraits/street-folk] [--only kr,ib] [--report 기록.json]
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDER = ['town_man', 'town_woman', 'boy', 'girl', 'elder', 'grandmother', 'librarian', 'innkeeper',
         'adventurer', 'merchant', 'noble_youth', 'soldier', 'navigator']
FACE = 512          # 얼굴 그림 한 변 (npc-roles 얼굴과 같은 크기)
HALF_W = 512        # 무릎상 너비 (높이는 칸 비율대로)
INSET = 5           # 칸 사이 선을 피해 안쪽으로


def grid_lines(gray, n, size, axis):
    d = np.abs(np.diff(gray, axis=axis)).mean(1 - axis)
    step = size / n
    out = [0]
    for i in range(1, n):
        e = int(round(step * i))
        lo, hi = max(1, e - 30), min(len(d) - 1, e + 30)
        out.append(int(np.argmax(d[lo:hi]) + lo + 1))
    out.append(size)
    return out


def face_box(mask, name):
    """얼굴 칸: 몸통 가운데 위로 올라가 머리 꼭대기(모자 포함)를 찾고, 그 아래로 머리·어깨가 드는 정사각형.
       창끝·손에 든 물건처럼 가는 것은 머리로 치지 않는다 (몸통 둘레 좁은 띠에서 일정 너비 이상인 줄만)"""
    h, w = mask.shape
    on = mask > 128
    mid = on[int(h * 0.5):int(h * 0.62)]
    cols = np.where(mid.sum(0) > 0)[0]
    tx = (cols[0] + cols[-1]) / 2 if len(cols) else w / 2         # 몸통 가운데
    x0, x1 = int(max(0, tx - w * 0.22)), int(min(w, tx + w * 0.22))
    rows = on[:, x0:x1].sum(1)
    top_y = next((y for y in range(h) if rows[y] > w * 0.07), 0)   # 머리(모자) 꼭대기
    band = on[top_y + int(h * 0.06):top_y + int(h * 0.16), x0:x1]
    bc = np.where(band.sum(0) > 0)[0]
    cx = x0 + (bc[0] + bc[-1]) / 2 if len(bc) else tx               # 머리 가운데
    side = w * (0.5 if name in ('boy', 'girl') else 0.58)
    top = top_y - side * 0.04
    side = min(side, w, h)
    left = min(max(0, cx - side / 2), w - side)
    top = min(max(0, top), h - side)
    return int(round(left)), int(round(top)), int(round(side)), int(top_y)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--out', default=os.path.join(ROOT, 'images', 'portraits', 'street-folk'))
    ap.add_argument('--only', default='')
    ap.add_argument('--report', default='', help='얼굴 자리 기록(json)을 쓸 곳')
    a = ap.parse_args()
    from rembg import new_session, remove
    sess = new_session('isnet-general-use')
    only = [s for s in a.only.split(',') if s]
    os.makedirs(a.out, exist_ok=True)
    report = {}
    for fn in sorted(os.listdir(a.src)):
        style, ext = os.path.splitext(fn)
        if ext.lower() != '.png' or (only and style not in only):
            continue
        sheet = Image.open(os.path.join(a.src, fn)).convert('RGB')
        W, H = sheet.size
        gray = np.asarray(sheet.convert('L'), dtype=np.float32)
        xs, ys = grid_lines(gray, 4, W, 1), grid_lines(gray, 4, H, 0)
        report[style] = {}
        for i, name in enumerate(ORDER):
            r, c = divmod(i, 4)
            cell = sheet.crop((xs[c] + INSET, ys[r] + INSET, xs[c + 1] - INSET, ys[r + 1] - INSET))
            cut = remove(cell, session=sess, post_process_mask=True)
            alpha = np.asarray(cut)[..., 3]
            cw, ch = cut.size
            hh = round(HALF_W * ch / cw)
            cut.resize((HALF_W, hh), Image.LANCZOS).save(os.path.join(a.out, '%s_%s_half.webp' % (name, style)), 'WEBP', quality=86, method=6)
            left, top, side, found = face_box(alpha, name)
            face = cut.crop((left, top, left + side, top + side)).resize((FACE, FACE), Image.LANCZOS)
            face.save(os.path.join(a.out, '%s_%s.webp' % (name, style)), 'WEBP', quality=86, method=6)
            report[style][name] = {'face': [left, top, side], 'head': found}
        print(style, 'grid', xs, ys)
        sys.stdout.flush()
    if a.report:
        with open(a.report, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
