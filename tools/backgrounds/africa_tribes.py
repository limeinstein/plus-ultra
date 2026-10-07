"""아프리카 부족 마을(298~308) 거리 배경: compose.py로 가까운 고장 배경의 옛 도시를 지우고 그 부족 건물 그림을 먼 마을로 세운다.
   python tools/backgrounds/africa_tribes.py [도시번호 ...]   → images/backgrounds/<번호>.jpg (africa_specs.json)"""
import sys, os, json, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import compose as C
E = 'exterior-styles/'
C.SETS.update({
    'kraal': [E + 'kraal/' + k for k in ['trade', 'tavern', 'inn', 'guild', 'inn', 'trade']],
    'kraal_few': [E + 'kraal/' + k for k in ['inn', 'trade']],
    'masai': [E + 'masai/' + k for k in ['home', 'inn', 'tavern', 'trade', 'home', 'market']],
    'africa': [E + 'africa/' + k for k in ['home', 'inn', 'tavern', 'trade', 'guild', 'home', 'market']],
    'tent': [E + 'tent/' + k for k in ['trade', 'tavern', 'inn', 'trade', 'guild']],
    'arabia': [E + 'arabia/' + k for k in ['inn', 'tavern', 'trade', 'home', 'guild', 'gate']],
})
import numpy as np, cv2
from PIL import Image
def veil(im, rects):
    """옛 도시 지우기 (줄무늬 없이): [x0, y0, x1, y1, hy] — hy 위는 위쪽 하늘 빛을 넓게 흐려 채우고,
       아래는 바로 아래 땅 결을 납작하게 눌러 먼 들판처럼(지평선 쪽으로 옅게) 채운다"""
    a = np.asarray(im.convert('RGB')).astype(np.float32).copy(); H, W = a.shape[:2]
    for r in rects:
        x0, y0, x1, y1, hy = r
        sky = cv2.GaussianBlur(a[max(0, y0 - 24):y0 - 4, :].mean(0, keepdims=True), (0, 0), sigmaX=90, sigmaY=0.1)[0]
        haze = cv2.GaussianBlur(a[max(0, y0 - 6):y0 - 1, :].mean(0, keepdims=True), (0, 0), sigmaX=160, sigmaY=0.1)[0]
        fill = np.zeros((y1 - y0, W, 3), np.float32)
        hs = max(1, hy - y0)
        for i in range(hs):
            t = i / hs; fill[i] = sky * (1 - t) + (haze * 0.6 + sky * 0.4 + 8) * t
        gh = y1 - hy
        if gh > 0:
            src = a[y1 + 6:min(H, y1 + 6 + gh * 2)]
            src = cv2.resize(src, (W, gh), interpolation=cv2.INTER_AREA)
            tt = (1 - np.arange(gh) / gh)[:, None, None] ** 1.5 * 0.55
            fill[hs:] = src * (1 - tt) + (haze * 0.6 + sky * 0.4)[None] * tt
        fill += cv2.GaussianBlur(np.random.RandomState(5).randn(*fill.shape[:2]).astype(np.float32), (0, 0), 1.2)[..., None] * 3
        m = np.zeros((y1 - y0, W), np.float32); m[:, x0:x1] = 1
        m = cv2.GaussianBlur(m, (0, 0), sigmaX=18, sigmaY=3)
        yy = np.linspace(0, 1, y1 - y0)[:, None]; m = m * np.clip(np.minimum(yy, 1 - yy) * 10, 0, 1)
        a[y0:y1] = a[y0:y1] * (1 - m[..., None]) + fill * m[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
C.extrude = veil
if __name__ == '__main__':
    specs = json.load(open(os.path.join(os.path.dirname(__file__), 'africa_specs.json'), encoding='utf8'))
    only = set(sys.argv[1:])
    for k, v in specs.items():
        if k.startswith('_') or (only and k not in only): continue
        C.make(int(k), v)
        shutil.copyfile(C.OUT + '%s.jpg' % k, C.IMG + 'backgrounds/%s.jpg' % k); print('bg', k)
