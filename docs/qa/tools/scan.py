"""PLUS ULTRA 에셋 전수 검사 — 해독·크기·투명도·흐림·단색·중복(바이트·지각 해시)·매니페스트
python3 scan.py <repo> <out.json>"""
import sys, os, json, hashlib, re
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageSequence
import cv2

ROOT = sys.argv[1]; OUT = sys.argv[2]
IMG = os.path.join(ROOT, 'images')
EXT = ('.webp', '.jpg', '.jpeg', '.png', '.gif')

def dhash(gray):
    g = cv2.resize(gray, (9, 8), interpolation=cv2.INTER_AREA)
    d = g[:, 1:] > g[:, :-1]
    return ''.join('1' if v else '0' for v in d.flatten())

def one(rel):
    p = os.path.join(IMG, rel)
    r = {'f': rel, 'bytes': os.path.getsize(p)}
    try:
        raw = open(p, 'rb').read()
        r['sha1'] = hashlib.sha1(raw).hexdigest()
        im = Image.open(p)
        r['fmt'] = im.format; r['w'], r['h'] = im.size; r['mode'] = im.mode
        frames = 1
        if getattr(im, 'is_animated', False):
            frames = getattr(im, 'n_frames', 1)
        r['frames'] = frames
        im.seek(0)
        im = im.convert('RGBA')
        a = np.asarray(im)
        alpha = a[:, :, 3]
        r['alpha'] = bool((alpha < 255).any())
        r['transp'] = round(float((alpha == 0).mean()), 4)
        # 가장자리에 불투명 픽셀이 닿는가 (투명 그림이 잘렸는지)
        if r['transp'] > 0.05:
            edge = np.concatenate([alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]])
            r['edgeOpaque'] = round(float((edge > 200).mean()), 4)
        rgb = a[:, :, :3].astype(np.float32)
        vis = alpha > 16
        if vis.sum() > 50:
            px = rgb[vis]
            r['std'] = round(float(px.std()), 2)
            r['mean'] = round(float(px.mean()), 1)
        else:
            r['std'] = 0; r['mean'] = 0
        gray = cv2.cvtColor(a[:, :, :3], cv2.COLOR_RGB2GRAY)
        sc = 512 / max(r['w'], r['h']) if max(r['w'], r['h']) > 512 else 1
        g2 = cv2.resize(gray, (max(1, int(r['w'] * sc)), max(1, int(r['h'] * sc))), interpolation=cv2.INTER_AREA) if sc != 1 else gray
        m2 = cv2.resize(vis.astype(np.uint8), (g2.shape[1], g2.shape[0]), interpolation=cv2.INTER_NEAREST).astype(bool)
        lap = cv2.Laplacian(g2, cv2.CV_64F)
        r['sharp'] = round(float(lap[m2].var()) if m2.sum() > 50 else 0, 1)
        # 지각 해시: 투명 부분은 회색으로
        comp = a[:, :, :3].copy(); comp[~vis] = 128
        r['dh'] = dhash(cv2.cvtColor(comp, cv2.COLOR_RGB2GRAY))
        # 아래쪽 띠에 흰/검정 글자 같은 큰 대비 줄(워터마크 의심): 맨 아래 6%의 가장자리 밀도
        h = g2.shape[0]; band = g2[int(h * 0.94):, :]
        if band.size:
            ed = cv2.Canny(band, 80, 200)
            r['botEdge'] = round(float((ed > 0).mean()), 4)
    except Exception as e:
        r['err'] = str(e)[:200]
    return r

if __name__ == '__main__':
    files = []
    for dp, dn, fn in os.walk(IMG):
        for f in fn:
            if f.lower().endswith(EXT):
                files.append(os.path.relpath(os.path.join(dp, f), IMG).replace(os.sep, '/'))
    files.sort()
    with Pool(2) as pool:
        res = pool.map(one, files, chunksize=40)
    # manifest
    man = open(os.path.join(IMG, 'manifest.js'), encoding='utf-8').read()
    pairs = re.findall(r'"([^"]+)":\s*"([^"]+)"', man)
    json.dump({'files': res, 'manifest': pairs}, open(OUT, 'w'), ensure_ascii=False)
    print(len(res), 'files', len(pairs), 'manifest')
