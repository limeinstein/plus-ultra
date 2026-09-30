"""python tools/backgrounds/compose.py tools/backgrounds/specs.json [도시번호 ...]
   있는 배경 그림을 고쳐 새 도시 배경 초안을 만든다 (예비용). 결과는 images/_extra/backgrounds-composed/ — 게임은 읽지 않는다.
   마음에 들면 images/backgrounds/도시번호.jpg 로 옮겨 쓴다.
"""
# 새 도시(226~285)의 거리 배경: 게임에 있는 도시 배경 그림에서 옛 마을을 지우고(인페인팅), 그 고장 건물 그림을 작게 줄여 먼 마을로 세운다
import sys, os, random, json
import numpy as np, cv2
from PIL import Image, ImageFilter, ImageEnhance
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IMG = os.path.join(ROOT, 'images') + os.sep
NA = IMG + 'exterior-styles/'
OUT = IMG + '_extra/backgrounds-composed/'   # 거리 배경(images/backgrounds)은 따로 그린 그림이 있으므로 덮어쓰지 않고 여분 폴더에 만든다
def sp(path):
    p = path if os.path.isabs(path) else IMG + path
    return Image.open(p).convert('RGBA')
SETS = {
    'kr': ['exterior-styles/korea/' + k for k in ['trade', 'tavern', 'inn', 'guild', 'library', 'mansion', 'palace', 'gate', 'market']],
    'wood': [NA + 'woodland/' + k for k in ['trade', 'tavern', 'inn', 'church', 'trade', 'inn']],
    'plains': [NA + 'plains/' + k for k in ['trade', 'inn', 'tavern', 'market', 'church', 'gate']],
    'pueblo': [NA + 'pueblo/' + k for k in ['trade', 'tavern', 'inn', 'gate', 'church']],
    'fr': ['exterior-styles/france/' + k for k in ['trade', 'tavern', 'inn', 'guild']] + ['exteriors/church', 'exteriors/home'],
    'es': ['exterior-styles/espana/' + k for k in ['trade', 'tavern', 'inn', 'guild', 'mansion']] + ['exteriors/church'],
    'en': ['exterior-styles/france/' + k for k in ['tavern', 'inn']] + ['exterior-styles/easteurope/' + k for k in ['trade', 'inn']] + ['exteriors/church', 'exteriors/home'],
    'fort': [NA + 'woodland/gate'],
    'dome': [NA + 'woodland/inn', NA + 'woodland/inn', NA + 'plains/tavern'],
}
_c = {}
def sprite(k):
    if k not in _c:
        f = k + '.webp' if not k.endswith('.webp') else k
        im = sp(f); a = np.asarray(im).astype(np.float32)
        H = im.height; cut = int(H * 0.035)
        a = a[:H - cut].copy()
        a[-18:, :, 3] *= np.linspace(1, 0.15, 18)[:, None]      # 바닥 흙판 자리를 흐리게
        _c[k] = Image.fromarray(a.astype(np.uint8))
    return _c[k]
def inpaint(im, rects, poly=None):
    a = np.asarray(im.convert('RGB'))[:, :, ::-1].copy()
    m = np.zeros(a.shape[:2], np.uint8)
    for (x0, y0, x1, y1) in rects: m[y0:y1, x0:x1] = 255
    sm = cv2.resize(a, (a.shape[1] // 2, a.shape[0] // 2), interpolation=cv2.INTER_AREA)
    mm = cv2.resize(m, (m.shape[1] // 2, m.shape[0] // 2), interpolation=cv2.INTER_NEAREST)
    r = cv2.inpaint(sm, mm, 9, cv2.INPAINT_TELEA)
    r = cv2.resize(r, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_CUBIC)
    # 가장자리를 부드럽게 섞고, 매끈해진 곳에 결을 조금
    mb = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 6)[..., None]
    noise = cv2.GaussianBlur(np.random.RandomState(1).randn(*a.shape[:2]).astype(np.float32), (0, 0), 1.2)[..., None] * 5
    out = a * (1 - mb) + (r + noise) * mb
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)[:, :, ::-1])
def extrude(im, rects):
    """옛 마을 지우기: [x0, y0, x1, y1, hy] — hy 위는 바로 위 하늘 줄을, 아래는 바로 아래 땅·물 줄을 늘여 채운다"""
    a = np.asarray(im.convert('RGB')).astype(np.float32).copy(); H, W = a.shape[:2]
    rs = np.random.RandomState(3)
    for r in rects:
        x0, y0, x1, y1 = r[:4]; hy = r[4] if len(r) > 4 else (y0 + y1) // 2
        pad = 30; X0, X1 = max(0, x0 - pad), min(W, x1 + pad)
        up = a[max(0, y0 - 14):y0 - 2, X0:X1].copy()      # 하늘 몇 줄
        dn = a[y1 + 2:min(H, y1 + 14), X0:X1].copy()      # 땅·물 몇 줄
        up_m = cv2.GaussianBlur(up.mean(0, keepdims=True), (0, 0), sigmaX=18, sigmaY=0.1)[0]
        dn_m = cv2.GaussianBlur(dn.mean(0, keepdims=True), (0, 0), sigmaX=6, sigmaY=0.1)[0]
        up_far = cv2.GaussianBlur(a[max(0, y0 - 80):max(1, y0 - 40), X0:X1].mean(0, keepdims=True), (0, 0), sigmaX=30, sigmaY=0.1)[0]
        fill = np.zeros((y1 - y0, X1 - X0, 3), np.float32)
        for i, y in enumerate(range(y0, y1)):
            if y < hy:
                t = (y - y0) / max(1, hy - y0)
                row = up_m * (1 - 0.3 * t) + (up_m * 0.5 + dn_m * 0.5) * 0.3 * t   # 지평선 쪽으로 옅게
            else:
                t = (y - hy) / max(1, y1 - hy)
                row = dn_m * (0.85 + 0.15 * t) + (up_m * 0.5 + dn_m * 0.5) * 0.15 * (1 - t)
            fill[i] = row
        fill += cv2.GaussianBlur(rs.randn(*fill.shape[:2]).astype(np.float32), (0, 0), 1.5)[..., None] * 4
        # 가장자리 섞기
        m = np.zeros((y1 - y0, X1 - X0), np.float32); m[:, pad if X0 > 0 else 0: (X1 - X0) - (pad if X1 < W else 0)] = 1
        m = cv2.GaussianBlur(m, (0, 0), sigmaX=12, sigmaY=4)
        yy = np.linspace(0, 1, y1 - y0)[:, None]; m = m * np.clip(np.minimum(yy, 1 - yy) * 12, 0, 1)
        reg = a[y0:y1, X0:X1]
        a[y0:y1, X0:X1] = reg * (1 - m[..., None]) + fill * m[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
def clone(im, ops):
    """도장 찍기: {r:[x0,y0,x1,y1], sx, sy, p} — (sx + (x-x0) mod p, sy + (y-y0)) 픽셀을 가져온다. p마다 좌우를 뒤집어 이음새를 숨긴다"""
    a = np.asarray(im.convert('RGB')).astype(np.float32).copy(); H, W = a.shape[:2]
    for op in ops:
        x0, y0, x1, y1 = op['r']; sx, sy = op['sx'], op['sy']; p = op.get('p')
        xs = np.arange(x0, x1) - x0
        if p:
            k = xs // p; r = xs % p; xs = np.where(k % 2 == 0, r, p - 1 - r)
        src_x = np.clip(sx + xs, 0, W - 1); src_y = np.clip(sy + np.arange(y1 - y0), 0, H - 1)
        patch = a[src_y][:, src_x]
        f = op.get('f', 14)
        m = np.ones((y1 - y0, x1 - x0), np.float32)
        yy = np.arange(y1 - y0)[:, None]; xx = np.arange(x1 - x0)[None, :]
        m *= np.clip(np.minimum(yy + 1, y1 - y0 - yy) / f, 0, 1) * np.clip(np.minimum(xx + 1, x1 - x0 - xx) / f, 0, 1)
        if op.get('hz'):   # 가져온 조각이 더 가까운 곳이면, 위쪽을 먼 빛(바로 위 줄 색)으로 흐리게
            top = cv2.GaussianBlur(a[max(0, y0 - 6):y0 - 1, x0:x1].mean(0, keepdims=True), (0, 0), sigmaX=25, sigmaY=0.1)[0]
            t = (1 - np.arange(y1 - y0) / (y1 - y0))[:, None, None] ** 1.3 * op['hz']
            patch = patch * (1 - t) + top[None] * t
            patch = cv2.GaussianBlur(patch, (0, 0), op.get('blur', 0.8))
        a[y0:y1, x0:x1] = a[y0:y1, x0:x1] * (1 - m[..., None]) + patch * m[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
def haze_col(im, y):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    return a[max(0, y - 120):max(1, y - 60), :, :].reshape(-1, 3).mean(0)
def settle(im, place, seed):
    """place: {set, y, x0, x1, h, rows, haze, gap, extra}"""
    rng = random.Random(seed)
    names = SETS[place['set']]
    hz = haze_col(im, place['y']); base = im.convert('RGBA')
    rows = place.get('rows', 2)
    for r in range(rows - 1, -1, -1):
        y = place['y'] - r * place['h'] * 0.28; h0 = place['h'] * (1 - 0.22 * r)
        x = place['x0'] + rng.random() * h0 * 0.5 + r * h0 * 0.4
        haze = place.get('haze', 0.35) + 0.12 * r
        while x < place['x1']:
            k = names[rng.randrange(len(names))] if not place.get('extra') or rng.random() > 0.18 else place['extra']
            s = sprite(k); h = h0 * (0.8 + rng.random() * 0.35)
            if 'gate' in k or 'church' in k: h *= 1.1
            w = int(s.width * h / s.height)
            if x + w * 0.5 > place['x1']: break
            t = s.resize((max(1, w), int(h)), Image.LANCZOS)
            if rng.random() < 0.5: t = t.transpose(Image.FLIP_LEFT_RIGHT)
            arr = np.asarray(t).astype(np.float32)
            arr[..., :3] = arr[..., :3] * (1 - haze) + hz * haze
            t = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5 + 0.4 * r))
            base.alpha_composite(t, (int(x), int(y - h * 0.97)))
            x += w * place.get('step', 0.72) + rng.random() * h * place.get('gap', 0.25)
    # 마을 앞에 나무 몇 그루 느낌: 아래쪽 풀빛을 살짝 올려 이음새를 가림
    return base.convert('RGB')
def frame(im, flip=False, zoom=1.0, cx=0.5, cy=0.5):
    W, H = im.size
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if zoom > 1:
        w, h = W / zoom, H / zoom
        x0 = min(max(0, cx * W - w / 2), W - w); y0 = min(max(0, cy * H - h / 2), H - h)
        im = im.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.LANCZOS)
    return im
def make(cid, spec):
    im = Image.open(IMG + 'backgrounds/%d.jpg' % spec['src']).convert('RGB')
    if spec.get('clone'): im = clone(im, spec['clone'])
    if spec.get('clear'): im = extrude(im, spec['clear'])
    if spec.get('paint'): im = inpaint(im, spec['paint'])
    for i, pl in enumerate(spec.get('place', [])): im = settle(im, pl, cid * 7 + i)
    im = frame(im, spec.get('flip', False), spec.get('zoom', 1.0), spec.get('cx', 0.5), spec.get('cy', 0.5))
    if spec.get('warm'): im = ImageEnhance.Color(im).enhance(spec['warm'])
    os.makedirs(OUT, exist_ok=True)
    im.save(OUT + '%d.jpg' % cid, quality=86, optimize=True, progressive=True)
    return im
if __name__ == '__main__':
    specs = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'specs.json'), encoding='utf8'))
    only = set(sys.argv[2:])
    for k, v in specs.items():
        if only and k not in only: continue
        make(int(k), v); print('bg', k)
