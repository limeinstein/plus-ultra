#!/usr/bin/env python3
"""무릎상(…_half) 그림 가운데 몸이 그림 왼쪽·오른쪽 끝에 닿아 잘린 것을 재어 js/data/halfedge.js 를 만든다.

팔꿈치·소매·망토가 그림 테두리에서 칼로 자른 듯 끝나면 대화 장면에서 팔이 잘려 보인다.
대화 리그(js/art/portrait_rig.js)는 이 표에 오른 쪽만 끝을 부드럽게 흐려(css .portrait-rig.cut-l / cut-r) 잘린 선이 보이지 않게 한다.
픽셀을 못 읽는 file://에서도 같게 보이도록 미리 잰 표를 쓴다. 새 무릎상을 넣으면 다시 실행:

    python tools/half_edge.py
"""
import os, re, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'images')
OUT = os.path.join(ROOT, 'js', 'data', 'halfedge.js')
ALPHA = 128       # 이보다 진하면 몸
EDGE = 3          # 바깥 몇 px 줄을 보는가
MIN_ROWS = 0.03   # 그림 높이의 3% 넘게 닿으면 잘린 것으로 (창끝·깃털 한 점은 빼고)


def keys():
    txt = open(os.path.join(IMG, 'manifest.js'), encoding='utf-8').read()
    for k, f in re.findall(r'"([^"]+)":\s*"([^"]+)"', txt):
        if re.search(r'(_half(_|$)|player_half)', k):
            yield k, f


def touch(path):
    im = Image.open(path)
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    w, h = im.size
    a = im.getchannel('A')
    def rows(x0, x1):
        col = a.crop((x0, 0, x1, h)).resize((1, h), Image.BOX).load()
        return sum(1 for y in range(h) if col[0, y] > ALPHA) / h
    s = ''
    if rows(0, EDGE) > MIN_ROWS: s += 'l'
    if rows(w - EDGE, w) > MIN_ROWS: s += 'r'
    return s


def main():
    out = {}
    n = 0
    for k, f in keys():
        p = os.path.join(IMG, f)
        if not os.path.exists(p):
            continue
        n += 1
        try:
            s = touch(p)
        except Exception as e:
            print('건너뜀', f, e); continue
        if s:
            out[k] = s
    body = json.dumps(dict(sorted(out.items())), ensure_ascii=False, indent=0)
    with open(OUT, 'w', encoding='utf-8') as fp:
        fp.write('/* 무릎상 그림에서 몸이 왼쪽(l)·오른쪽(r) 끝에 닿아 잘린 것 — tools/half_edge.py 가 만든다. 손으로 고치지 말 것 */\n')
        fp.write('window.G = window.G || {};\nG.HALF_EDGE = ' + body + ';\n')
    print('무릎상', n, '장 중 끝에 닿은 그림', len(out), '장 →', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
