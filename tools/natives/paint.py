# 북미 원주민 마을 건물 그림: 게임에 있는 그림(마사이 초가 지붕·기둥·바구니·항아리·천)에서 재료를 떼어 와 새 모양으로 짜 맞춘다
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import math, random
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'images', 'exterior-styles') + os.sep
S = 2                                   # 두 배로 그려서 줄인다
def load(p): return Image.open(SRC + p).convert('RGBA')
MM = load('masai/market.webp')
def crop(im, box): return im.crop(box)
# ---------------------------------------------------------------- 재료
THATCH = crop(MM, (380, 150, 960, 265)).convert('RGB')       # 초가 지붕 결
POST = crop(MM, (486, 300, 514, 640))                       # 나무 기둥
PROPS = {
    'basket1': crop(MM, (128, 572, 188, 636)), 'basket2': crop(MM, (288, 578, 352, 646)), 'basket3': crop(MM, (397, 566, 470, 652)),
    'pot1': crop(MM, (344, 586, 402, 648)), 'pot2': crop(MM, (1168, 546, 1228, 640)), 'pot3': crop(MM, (1145, 596, 1190, 640)),
    'cloth': crop(MM, (184, 534, 252, 630)), 'cloth2': crop(MM, (938, 536, 1042, 632)), 'basket4': crop(MM, (1078, 562, 1154, 644)),
    'hang': crop(MM, (440, 390, 480, 445)),
}
def tile(tex, w, h, scale=1.0):
    tw, th = max(8, int(tex.width * scale)), max(8, int(tex.height * scale))
    t = tex.resize((tw, th), Image.LANCZOS)
    out = Image.new(t.mode, (w, h))
    for y in range(0, h, th):
        for x in range(0, w, tw):
            tt = t if ((x // tw + y // th) % 2 == 0) else t.transpose(Image.FLIP_LEFT_RIGHT)
            out.paste(tt, (x, y))
    return out
def recolor(im, tint, amt=0.55, bright=1.0, sat=0.5):
    im = ImageEnhance.Color(im).enhance(sat)
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    t = np.array(tint, np.float32) / 255
    lum = a.mean(axis=2, keepdims=True)
    out = a * (1 - amt) + lum * t * 2.0 * amt
    return Image.fromarray(np.clip(out * bright * 255, 0, 255).astype(np.uint8))
def noise(w, h, sc, seed):
    rng = np.random.RandomState(abs(int(seed)) % (2**31)); acc = np.zeros((h, w), np.float32); amp = 1
    for o in range(4):
        gw, gh = max(2, int(w / sc * 2 ** o)), max(2, int(h / sc * 2 ** o))
        g = rng.rand(gh, gw).astype(np.float32)
        acc += np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255 * amp
        amp *= 0.5
    return acc / 1.875
class Canvas:
    def __init__(s, w, h):
        s.w, s.h = w * S, h * S
        s.im = Image.new('RGBA', (s.w, s.h), (0, 0, 0, 0))
    def fill(s, mask, tex, shade=None, edge=0.45, rim=0.0):
        """mask: L 이미지, tex: RGB(캔버스 크기), shade: 수 또는 캔버스 크기 배열 — 가려진 곳만 계산"""
        bb = mask.getbbox()
        if not bb: return
        pad = 12; x0, y0, x1, y1 = max(0, bb[0] - pad), max(0, bb[1] - pad), min(s.w, bb[2] + pad), min(s.h, bb[3] + pad)
        mk = mask.crop((x0, y0, x1, y1))
        m = np.asarray(mk).astype(np.float32) / 255
        if tex.size != (s.w, s.h): tex = tex.resize((s.w, s.h))
        t = np.asarray(tex.convert('RGB').crop((x0, y0, x1, y1))).astype(np.float32)
        if shade is not None:
            if np.ndim(shade): t = t * np.asarray(shade, np.float32)[y0:y1, x0:x1][..., None]
            else: t = t * shade
        if edge:
            er = np.asarray(mk.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
            t = t * (1 - edge * (1 - er)[..., None])
        reg = np.asarray(s.im.crop((x0, y0, x1, y1))).astype(np.float32)
        a = m[..., None]
        rgb = reg[..., :3] * (1 - a) + t * a
        al = reg[..., 3:] * (1 - a) + 255 * a
        s.im.paste(Image.fromarray(np.clip(np.concatenate([rgb, al], 2), 0, 255).astype(np.uint8)), (x0, y0))
    def mask(s):
        return Image.new('L', (s.w, s.h), 0)
    def paste(s, sp, x, y, h=None, flip=False, dark=1.0):
        if h: sp = sp.resize((max(1, int(sp.width * h * S / sp.height)), int(h * S)), Image.LANCZOS)
        else: sp = sp.resize((sp.width * S, sp.height * S), Image.LANCZOS)
        if flip: sp = sp.transpose(Image.FLIP_LEFT_RIGHT)
        if dark != 1.0: sp = Image.merge('RGBA', [*ImageEnhance.Brightness(sp.convert('RGB')).enhance(dark).split(), sp.getchannel('A')])
        s.im.alpha_composite(sp, (int(x * S - sp.width / 2), int(y * S - sp.height)))
    def shadow(s, cx, cy, rx, ry, a=0.45):
        m = Image.new('L', (s.w, s.h), 0); ImageDraw.Draw(m).ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S], fill=int(255 * a))
        m = m.filter(ImageFilter.GaussianBlur(14 * S))
        sh = Image.new('RGBA', (s.w, s.h), (30, 20, 10, 0)); sh.putalpha(m)
        s.im = Image.alpha_composite(sh, s.im)
    def out(s, w=None, H=520, pad=0):
        """그림이 있는 곳만 잘라 높이 H로 (다른 건물 그림과 같은 약속: 바닥이 그림 아래 끝)"""
        bb = s.im.getchannel('A').getbbox()
        im = s.im.crop((bb[0], max(0, bb[1] - 6 * S), bb[2], bb[3])) if bb else s.im
        h = H - 2 * pad
        im = im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)
        if pad:
            c = Image.new('RGBA', (im.width + 2 * pad, H), (0, 0, 0, 0)); c.alpha_composite(im, (pad, pad)); im = c
        return im
def P(pts): return [(x * S, y * S) for x, y in pts]
def ground(cv, cx, y, w, seed=1):
    """흙바닥과 풀: 기존 그림 바닥처럼 옅은 흙 판"""
    m = cv.mask(); d = ImageDraw.Draw(m)
    d.ellipse([(cx - w / 2) * S, (y - 16) * S, (cx + w / 2) * S, (y + 14) * S], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(3 * S))
    n = noise(cv.w, cv.h, 60 * S, seed)
    tex = Image.new('RGB', (cv.w, cv.h), (178, 150, 108))
    cv.fill(m, tex, shade=0.75 + 0.45 * n, edge=0.2)
    rng = random.Random(seed); d2 = ImageDraw.Draw(cv.im)
    for i in range(int(w / 3)):
        gx = cx - w / 2 + rng.random() * w; gy = y + (rng.random() - 0.5) * 18
        if ((gx - cx) / (w / 2)) ** 2 + ((gy - y) / 15) ** 2 > 1: continue
        col = (70 + rng.randint(0, 40), 95 + rng.randint(0, 40), 45, 255)
        for k in range(3):
            d2.line(P([(gx, gy), (gx + (k - 1) * 2 + rng.random() * 2, gy - 5 - rng.random() * 6)]), fill=col, width=S)
def aniso(w, h, sx, sy, seed, octs=4):
    rng = np.random.RandomState(abs(int(seed)) % (2**31)); acc = np.zeros((h, w), np.float32); amp = 1; tot = 0
    for o in range(octs):
        gw, gh = max(2, int(w / sx * 2 ** o)), max(2, int(h / sy * 2 ** o))
        g = rng.rand(gh, gw).astype(np.float32)
        acc += np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255 * amp
        tot += amp; amp *= 0.55
    return acc / tot
def ramp(n, cols):
    """n: 0..1 배열 → 색 사다리"""
    cols = np.array(cols, np.float32); k = len(cols) - 1
    t = np.clip(n, 0, 1) * k; i = np.clip(t.astype(int), 0, k - 1); f = (t - i)[..., None]
    return cols[i] * (1 - f) + cols[i + 1] * f
def bark_img(w, h, seed, horizontal=True, cols=((58, 44, 34), (104, 84, 64), (146, 124, 96), (178, 160, 130), (120, 104, 84))):
    a = aniso(w, h, 260 if horizontal else 10, 10 if horizontal else 260, seed, 5)
    b = aniso(w, h, 40, 40, seed + 7, 3)
    n = np.clip((a - 0.5) * 2.2 + 0.5 + (b - 0.5) * 0.6, 0, 1)
    c = ramp(n, cols)
    # 잘게 갈라진 틈
    f = aniso(w, h, 60 if horizontal else 3, 3 if horizontal else 60, seed + 3, 2)
    c = c * (1 - 0.45 * np.clip((0.3 - f) * 5, 0, 1))[..., None]
    return Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
