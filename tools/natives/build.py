import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paint import *
_cache = {}
def bark_tex(cv, seed, tint=None, horizontal=True, mix=0.22):
    k = (cv.w, cv.h, seed, horizontal, tint)
    if k in _cache: return _cache[k]
    b = bark_img(cv.w, cv.h, seed, horizontal)
    t = recolor(tile(THATCH, cv.w, cv.h, 0.8 * S), (150, 128, 100), 0.7, 1.0, 0.3)
    im = Image.blend(b, t, mix)
    if tint: im = recolor(im, tint, 0.35, 1.0, 1.0)
    _cache[k] = im; return im
LOGC = ((46, 32, 22), (86, 62, 42), (122, 92, 64), (150, 118, 84))
def log_tex(w, h, seed):
    return bark_img(max(4, int(w)), max(4, int(h)), seed, False, LOGC)
_yx = {}
def yx(cv):
    k = (cv.w, cv.h)
    if k not in _yx: _yx[k] = np.mgrid[0:cv.h, 0:cv.w].astype(np.float32)
    return _yx[k]
def cyl_x(cv, x0, x1, lo=0.55, hi=1.15):
    yy, xx = yx(cv); t = np.clip((xx / S - x0) / max(1, x1 - x0), 0, 1)
    return lo + (hi - lo) * np.clip(np.cos((t - 0.32) * math.pi * 0.95), 0, 1)
def lines(cv, segs, col, w):
    d = ImageDraw.Draw(cv.im)
    for a in segs: d.line(P(a), fill=col, width=max(1, int(w * S)), joint='curve')
def log(cv, x, top, base, w, seed, pointed=False, lean=0):
    m = cv.mask(); d = ImageDraw.Draw(m)
    if pointed: d.polygon(P([(x - w / 2, base), (x - w / 2, top + w), (x, top), (x + w / 2, top + w), (x + w / 2, base)]), fill=255)
    else: d.rounded_rectangle(P([(x - w / 2, top), (x + w / 2, base)]), radius=int(w * 0.3 * S), fill=255)
    tex = Image.new('RGB', (cv.w, cv.h)); tex.paste(log_tex(w * S + 4, (base - top) * S + 4, seed), (int((x - w / 2) * S), int(top * S)))
    cv.fill(m, tex, cyl_x(cv, x - w / 2, x + w / 2, 0.5, 1.2), edge=0.3)
def smoke(cv, x, y, h=90, seed=3):
    rng = random.Random(seed); lay = Image.new('RGBA', (cv.w, cv.h), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for i in range(16):
        t = i / 16; r = (4 + t * 18) * S
        cx = (x + math.sin(t * 5 + seed) * 8 * t + t * 22) * S; cy = (y - t * h) * S
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(218, 214, 206, int(95 * (1 - t))))
    cv.im.alpha_composite(lay.filter(ImageFilter.GaussianBlur(5 * S)))
def glow(cv, x, y, r, col=(255, 170, 80), a=150):
    lay = Image.new('RGBA', (cv.w, cv.h), (0, 0, 0, 0)); ImageDraw.Draw(lay).ellipse(P([(x - r, y - r), (x + r, y + r)]), fill=col + (a,))
    cv.im.alpha_composite(lay.filter(ImageFilter.GaussianBlur(r * 0.5 * S)))
def doorway(cv, x, base, w, h, fire=False, flap=True):
    m = cv.mask(); ImageDraw.Draw(m).rounded_rectangle(P([(x - w / 2, base - h), (x + w / 2, base + 1)]), radius=int(w * 0.5 * S), fill=255)
    cv.fill(m, Image.new('RGB', (cv.w, cv.h), (30, 20, 14)), edge=0.2)
    if fire: glow(cv, x, base - h * 0.25, w * 0.35, (255, 150, 60), 170)
    if flap:
        m2 = cv.mask(); ImageDraw.Draw(m2).polygon(P([(x - w / 2 - 2, base - h + w * 0.3), (x + w * 0.05, base - h + w * 0.1), (x - w * 0.18, base - h * 0.42), (x - w / 2 - 2, base - h * 0.5)]), fill=255)
        n = noise(cv.w, cv.h, 20 * S, 9)
        cv.fill(m2, Image.fromarray(np.clip(np.array([150, 108, 70], np.float32) * (0.8 + 0.3 * n[..., None]), 0, 255).astype(np.uint8)), edge=0.5)
# ---------------------------------------------------------------- 긴 집 (3/4: 왼쪽 끝벽 + 옆면)
def longhouse(cv, x0, base, L, H, seed=1, fire=False, holes=2, racks=False):
    E = H * 0.95                     # 끝벽 폭
    wall = H * 0.45                  # 옆벽 높이 (그 위가 둥근 지붕)
    # 옆면: 뒤로 갈수록 살짝 낮아지는 원근
    sx0, sx1 = x0 + E * 0.5, x0 + L
    top0, top1 = base - H, base - H * 0.93
    m = cv.mask(); d = ImageDraw.Draw(m)
    d.polygon(P([(sx0, base), (sx0, top0), (sx1 - H * 0.2, top1), (sx1, top1 + H * 0.18), (sx1, base)]), fill=255)
    yy, xx = yx(cv)
    ytop = top0 + (xx / S - sx0) / (sx1 - sx0) * (top1 - top0)
    t = np.clip((yy / S - ytop) / (base - ytop + 1e-3), 0, 1)
    rf = (H - wall) / H
    sh = np.where(t < rf, 0.62 + 0.62 * np.sin(np.clip(t / rf, 0, 1) * math.pi * 0.5 + 0.35), 0.66 - 0.2 * (t - rf))
    sh = sh * (1 - 0.18 * np.clip((xx / S - sx0) / (sx1 - sx0), 0, 1))
    cv.fill(m, bark_tex(cv, seed), sh, edge=0.45)
    rng = random.Random(seed)
    for i in range(1, 6):     # 가로 이음새
        f = i / 6
        segs = []; x = sx0 + 4
        while x < sx1 - 6:
            w = 50 + rng.random() * 60; a, b = x, min(x + w, sx1 - 6)
            ya = top0 + (a - sx0) / (sx1 - sx0) * (top1 - top0); yb = top0 + (b - sx0) / (sx1 - sx0) * (top1 - top0)
            segs.append([(a, ya + (base - ya) * f + rng.random() * 3), (b, yb + (base - yb) * f + rng.random() * 3)]); x += w
        lines(cv, segs, (40, 28, 20, 170), 1.8)
        lines(cv, [[(p[0], p[1] + 2.5) for p in s] for s in segs], (220, 200, 165, 70), 1)
    n = int((sx1 - sx0) / 62)
    for k in range(1, n + 1):  # 누름 장대
        x = sx0 + k * (sx1 - sx0) / (n + 1); yt = top0 + (x - sx0) / (sx1 - sx0) * (top1 - top0)
        lines(cv, [[(x, yt + 2), (x + 1, base - 2)]], (52, 36, 24, 230), 3.4)
        for f in (0.2, 0.4, 0.6, 0.8): y = yt + (base - yt) * f; lines(cv, [[(x - 4, y - 2), (x + 4, y + 2)]], (196, 168, 118, 220), 1.5)
    # 지붕 등마루 장대
    lines(cv, [[(sx0, top0 + 3), (sx1 - H * 0.2, top1 + 3)]], (60, 42, 28, 230), 4)
    # 끝벽: 아치
    m = cv.mask(); d = ImageDraw.Draw(m)
    d.rectangle(P([(x0, base - wall), (x0 + E, base)]), fill=255)
    d.pieslice(P([(x0, base - H), (x0 + E, base - 2 * wall + H)]), 180, 360, fill=255)
    m = Image.fromarray(np.where(yy > base * S, 0, np.asarray(m)).astype(np.uint8))
    sh2 = cyl_x(cv, x0, x0 + E, 0.75, 1.22)
    cv.fill(m, bark_tex(cv, seed + 1, None, False), sh2, edge=0.5)
    for k in range(1, 5): lines(cv, [[(x0 + E * k / 5, base - wall - (H - wall) * math.sin(math.acos(abs(k / 5 * 2 - 1))) + 5), (x0 + E * k / 5, base - 2)]], (45, 32, 22, 150), 1.6)
    # 처마 그늘 (옆벽 위)
    ya = top0 + wall * 0; 
    lines(cv, [[(x0 + E, base - wall - 2), (sx1, top1 + (H - wall) * 0.93 - 2)]], (35, 24, 16, 120), 5)
    # 문 · 문틀 기둥 · 차양
    doorway(cv, x0 + E / 2, base, E * 0.3, H * 0.52, fire)
    log(cv, x0 + E / 2 - E * 0.2, base - H * 0.6, base, 8, seed + 3); log(cv, x0 + E / 2 + E * 0.2, base - H * 0.6, base, 8, seed + 4)
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(x0 + E * 0.22, base - H * 0.6), (x0 + E * 0.78, base - H * 0.6), (x0 + E * 0.84, base - H * 0.55), (x0 + E * 0.16, base - H * 0.55)]), fill=255)
    cv.fill(m, bark_tex(cv, seed + 2), 0.9, edge=0.4)
    for k in range(holes):
        hx = sx0 + (sx1 - sx0) * (k + 1) / (holes + 1); hy = top0 + (hx - sx0) / (sx1 - sx0) * (top1 - top0)
        m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(hx - 12, hy - 3), (hx + 12, hy + 6)]), fill=255)
        cv.fill(m, Image.new('RGB', (cv.w, cv.h), (40, 28, 20)), edge=0.2)
        smoke(cv, hx, hy, 110, seed + k)
def wigwam(cv, cx, base, R, H, seed=2, fire=False):
    m = cv.mask(); ImageDraw.Draw(m).pieslice(P([(cx - R, base - H), (cx + R, base + H)]), 180, 360, fill=255)
    yy, xx = yx(cv)
    nx = (xx / S - cx) / R; ny = (base - yy / S) / H; nz = np.sqrt(np.clip(1 - nx ** 2 - ny ** 2, 0, 1))
    sh = 0.48 + 0.78 * np.clip(-0.5 * nx + 0.55 * ny + 0.67 * nz, 0, 1)
    cv.fill(m, bark_tex(cv, seed), sh, edge=0.5)
    rng = random.Random(seed)
    for i in range(1, 5):
        y = base - H * i / 5; hw = R * math.sqrt(max(0, 1 - (i / 5) ** 2)); segs = []; x = cx - hw + 3
        while x < cx + hw - 3:
            w = 30 + rng.random() * 40; b = min(x + w, cx + hw - 3)
            yy0 = lambda X: y + (1 - ((X - cx) / hw) ** 2) * 0 
            segs.append([(x, y + rng.random() * 2), (b, y + rng.random() * 2)]); x += w
        lines(cv, segs, (40, 28, 20, 160), 1.7)
    for k in (-3, -2, -1, 0, 1, 2, 3):
        pts = [(cx + R * k / 3.6 * math.cos(j / 20 * math.pi / 2), base - H * math.sin(j / 20 * math.pi / 2)) for j in range(21)]
        lines(cv, [pts], (52, 36, 24, 200), 2.6)
    doorway(cv, cx + R * 0.2, base, R * 0.34, H * 0.55, fire)
    smoke(cv, cx - R * 0.1, base - H + 2, 80, seed)
def tipi(cv, cx, base, W, H, seed=3, band=(150, 50, 36), band2=(40, 70, 110), marks=True):
    top = base - H
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(cx - W / 2, base), (cx - W * 0.035, top + H * 0.08), (cx + W * 0.035, top + H * 0.08), (cx + W / 2, base)]), fill=255)
    yy, xx = yx(cv)
    frac = np.clip((yy / S - top) / H, 0.05, 1); u = np.clip((xx / S - cx) / (W / 2 * frac), -1, 1)
    sh = 0.6 + 0.58 * np.clip(np.cos((u + 0.45) * math.pi / 2.2), 0, 1)
    n = noise(cv.w, cv.h, 26 * S, seed); n2 = aniso(cv.w, cv.h, 8, 90, seed + 1, 3)
    hide = np.array([226, 206, 172], np.float32) * (0.8 + 0.25 * n[..., None] + 0.12 * (n2[..., None] - 0.5))
    hide = hide * (1 - 0.25 * np.clip((yy / S - (base - H * 0.2)) / (H * 0.2), 0, 1))[..., None]   # 아래쪽 그을음·흙
    cv.fill(m, Image.fromarray(np.clip(hide, 0, 255).astype(np.uint8)), sh, edge=0.45)
    for k in range(-5, 6): lines(cv, [[(cx + k * W * 0.008, top + H * 0.1), (cx + k * W / 11, base)]], (120, 95, 70, 80), 1.2)
    if marks:
        for f0, col in [(0.74, band), (0.81, band2)]:
            y = top + H * f0; hw = W / 2 * f0 * 0.985; y2 = y + H * 0.045; hw2 = W / 2 * (f0 + 0.045) * 0.985
            m2 = cv.mask(); ImageDraw.Draw(m2).polygon(P([(cx - hw, y), (cx + hw, y), (cx + hw2, y2), (cx - hw2, y2)]), fill=255)
            cv.fill(m2, Image.new('RGB', (cv.w, cv.h), col), sh * 0.95, edge=0.1)
            for j in range(-6, 7):   # 톱니 무늬
                x = cx + j * hw / 7; m3 = cv.mask(); ImageDraw.Draw(m3).polygon(P([(x - 4, y), (x + 4, y), (x, y - 7)]), fill=255)
                cv.fill(m3, Image.new('RGB', (cv.w, cv.h), col), sh, edge=0)
        rng = random.Random(seed)
        for i in range(3):
            y = top + H * (0.42 + i * 0.1); x = cx + (rng.random() - 0.5) * W * 0.18 * (0.42 + i * 0.1); r = W * 0.03
            m3 = cv.mask(); d3 = ImageDraw.Draw(m3)
            if i == 0: d3.ellipse(P([(x - r, y - r), (x + r, y + r)]), fill=255)
            else: d3.polygon(P([(x - r, y + r * 0.8), (x, y - r), (x + r, y + r * 0.8)]), fill=255)
            cv.fill(m3, Image.new('RGB', (cv.w, cv.h), band if i != 1 else band2), sh, edge=0.1)
    lines(cv, [[(cx - W * 0.035, top + H * 0.1), (cx - W * 0.14, top + H * 0.3)], [(cx + W * 0.035, top + H * 0.1), (cx + W * 0.14, top + H * 0.3)]], (160, 132, 100, 255), 3)
    for k in (-3, -2, -1, 1, 2, 3): lines(cv, [[(cx + k * W * 0.01, top + H * 0.12), (cx + k * W * 0.045, top - H * 0.13)]], (84, 58, 38, 255), 2.4)
    m4 = cv.mask(); ImageDraw.Draw(m4).ellipse(P([(cx - W * 0.085, base - H * 0.24), (cx + W * 0.085, base - H * 0.015)]), fill=255)
    cv.fill(m4, Image.new('RGB', (cv.w, cv.h), (40, 28, 20)), edge=0.3)
    for k in range(-5, 6): x = cx + k * W / 11.5; lines(cv, [[(x, base - 4), (x, base + 3)]], (80, 58, 38, 255), 2.2)
    smoke(cv, cx, top + H * 0.02, 70, seed)
def palisade(cv, x0, x1, base, H, seed=4, gap=None):
    rng = random.Random(seed); x = x0; i = 0
    while x < x1:
        w = 17 + rng.random() * 6; h = H * (0.9 + rng.random() * 0.12); cx = x + w / 2
        if not (gap and gap[0] < cx < gap[1]): log(cv, cx, base - h, base, w, seed + i, True)
        x += w - 1.5; i += 1
    for f in (0.3, 0.68):
        segs = [[(x0, base - H * f), (gap[0], base - H * f + 2)], [(gap[1], base - H * f), (x1, base - H * f + 2)]] if gap else [[(x0, base - H * f), (x1, base - H * f + 2)]]
        lines(cv, segs, (58, 40, 26, 230), 3.5)
def rack(cv, x, base, w, h, seed=5):
    """모피·가죽을 널어 말리는 틀"""
    log(cv, x - w / 2, base - h, base, 6, seed); log(cv, x + w / 2, base - h, base, 6, seed + 1)
    lines(cv, [[(x - w / 2 - 4, base - h + 6), (x + w / 2 + 4, base - h + 6)]], (70, 50, 32, 255), 4)
    rng = random.Random(seed)
    for k in range(3):
        px = x - w / 2 + w * (k + 0.5) / 3; pw = w / 3 * 0.8; ph = h * (0.45 + rng.random() * 0.2)
        col = [(120, 80, 50), (150, 110, 70), (95, 70, 50)][k]
        m = cv.mask(); ImageDraw.Draw(m).polygon(P([(px - pw / 2, base - h + 8), (px + pw / 2, base - h + 8), (px + pw * 0.4, base - h + 8 + ph * 0.7), (px + pw * 0.2, base - h + 8 + ph), (px - pw * 0.25, base - h + 8 + ph * 0.9), (px - pw * 0.45, base - h + 8 + ph * 0.6)]), fill=255)
        n = noise(cv.w, cv.h, 10 * S, seed + k)
        cv.fill(m, Image.fromarray(np.clip(np.array(col, np.float32) * (0.75 + 0.4 * n[..., None]), 0, 255).astype(np.uint8)), cyl_x(cv, px - pw / 2, px + pw / 2, 0.7, 1.1), edge=0.4)
def canoe(cv, cx, base, L, h, seed=6, birch=True):
    m = cv.mask(); d = ImageDraw.Draw(m)
    pts = [(cx - L / 2, base - h * 1.3)] + [(cx - L / 2 + L * t, base - h * 0.05 - h * 0.95 * (1 - math.sin(t * math.pi) ** 0.6)) for t in [i / 30 for i in range(31)]] + [(cx + L / 2, base - h * 1.3), (cx + L * 0.42, base - h * 0.75), (cx - L * 0.42, base - h * 0.75)]
    d.polygon(P(pts), fill=255)
    n = aniso(cv.w, cv.h, 60, 6, seed)
    col = np.array([225, 215, 195] if birch else [120, 86, 58], np.float32)
    tex = col * (0.85 + 0.2 * n[..., None]); tex = tex * (1 - 0.6 * (aniso(cv.w, cv.h, 14, 3, seed + 2)[..., None] < 0.22))
    cv.fill(m, Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)), cyl_x(cv, 0, 1, 1, 1) * 1.0, edge=0.45)
    lines(cv, [[(cx - L * 0.44, base - h * 0.8), (cx + L * 0.44, base - h * 0.8)]], (70, 48, 30, 255), 3)
    for k in range(-4, 5): lines(cv, [[(cx + k * L / 10, base - h * 0.78), (cx + k * L / 10, base - h * 0.15)]], (90, 70, 50, 160), 1.3)
def prop(cv, name, x, base, h, flip=False):
    cv.paste(PROPS[name], x, base, h, flip)
def finish(cv, seed=0):
    """그림 결: 밝기 결을 살짝 얹고 또렷하게"""
    im = cv.im; a = im.getchannel('A')
    rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(3 * S, 60, 2))
    n = noise(cv.w, cv.h, 7 * S, seed + 99)
    arr = np.asarray(rgb).astype(np.float32) * (0.94 + 0.12 * n[..., None])
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA'); im.putalpha(a); cv.im = im

def pot(cv, x, base, h, seed=1, col=(150, 82, 52)):
    w = h * 0.8; m = cv.mask(); d = ImageDraw.Draw(m)
    d.ellipse(P([(x - w / 2, base - h * 0.85), (x + w / 2, base)]), fill=255); d.rectangle(P([(x - w * 0.22, base - h), (x + w * 0.22, base - h * 0.7)]), fill=255)
    n = noise(cv.w, cv.h, 8 * S, seed)
    yy, xx = yx(cv); nx = (xx / S - x) / (w / 2); ny = (yy / S - (base - h * 0.45)) / (h * 0.45)
    sh = 0.55 + 0.7 * np.clip(np.sqrt(np.clip(1 - nx ** 2 - ny ** 2, 0, 1)) * 0.7 - nx * 0.4 - ny * 0.2, 0, 1)
    cv.fill(m, Image.fromarray(np.clip(np.array(col, np.float32) * (0.85 + 0.25 * n[..., None]), 0, 255).astype(np.uint8)), sh, edge=0.35)
    lines(cv, [[(x - w * 0.42, base - h * 0.55), (x + w * 0.42, base - h * 0.55)]], (60, 34, 20, 160), 1.5)
def basket(cv, x, base, h, seed=2):
    w = h * 1.2; m = cv.mask(); d = ImageDraw.Draw(m)
    d.polygon(P([(x - w / 2, base - h), (x + w / 2, base - h), (x + w * 0.38, base), (x - w * 0.38, base)]), fill=255)
    n = aniso(cv.w, cv.h, 3, 30, seed, 2)
    tex = np.array([190, 150, 90], np.float32) * (0.7 + 0.45 * n[..., None])
    cv.fill(m, Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)), cyl_x(cv, x - w / 2, x + w / 2, 0.6, 1.15), edge=0.4)
    for f in (0.3, 0.6): lines(cv, [[(x - w * 0.46 + w * 0.05 * f, base - h + h * f), (x + w * 0.46 - w * 0.05 * f, base - h + h * f)]], (110, 70, 36, 200), 2)
    m2 = cv.mask(); ImageDraw.Draw(m2).ellipse(P([(x - w / 2, base - h - h * 0.12), (x + w / 2, base - h + h * 0.12)]), fill=255)
    cv.fill(m2, Image.new('RGB', (cv.w, cv.h), (205, 175, 60) if seed % 2 else (150, 70, 40)), 1.0, edge=0.5)   # 옥수수·콩
def roof_mat(cv, pts, seed=7, tint=(150, 128, 100), shade=0.95):
    m = cv.mask(); ImageDraw.Draw(m).polygon(P(pts), fill=255)
    t = recolor(tile(THATCH, cv.w, cv.h, 0.55 * S), tint, 0.6, 1.0, 0.4)
    cv.fill(m, t, shade, edge=0.45)
def tripod_fire(cv, x, base, h=70, seed=3):
    for dx in (-h * 0.35, h * 0.35, 0.05 * h): lines(cv, [[(x + dx, base), (x, base - h)]], (70, 50, 32, 255), 3)
    pot(cv, x, base - h * 0.28, h * 0.32, seed, (60, 50, 44))
    for k in range(5): lines(cv, [[(x - 16 + k * 8, base), (x - 10 + k * 5, base - 6)]], (80, 56, 36, 255), 3)
    glow(cv, x, base - 8, 26, (255, 140, 50), 190)
    smoke(cv, x, base - h * 0.4, 110, seed)
def pumpkin(cv, x, base, r, seed=1):
    m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(x - r * 1.2, base - r * 1.6), (x + r * 1.2, base)]), fill=255)
    yy, xx = yx(cv); nx = (xx / S - x) / (r * 1.2)
    cv.fill(m, Image.new('RGB', (cv.w, cv.h), (205, 120, 40)), 0.6 + 0.6 * np.clip(np.cos((nx + 0.4) * 1.2), 0, 1), edge=0.4)
    for k in (-0.5, 0, 0.5): lines(cv, [[(x + k * r, base - r * 1.5), (x + k * r * 1.2, base - 2)]], (140, 70, 20, 160), 1.3)
def corn(cv, x, top, n=5):
    lines(cv, [[(x - 20, top), (x + 20 + n * 6, top)]], (70, 50, 32, 255), 3)
    for k in range(n):
        cx = x - 10 + k * 9; m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(cx - 4, top + 4), (cx + 4, top + 34)]), fill=255)
        cv.fill(m, Image.new('RGB', (cv.w, cv.h), [(220, 180, 60), (180, 60, 40), (230, 200, 90), (120, 60, 90), (210, 150, 50)][k % 5]), cyl_x(cv, cx - 4, cx + 4, 0.7, 1.15), edge=0.3)
def platform(cv, x, base, w, h, seed=8, fire=False, roof=True):
    for dx in (-w / 2, w / 2): log(cv, x + dx, base - h - (40 if roof else 0), base, 9, seed + int(dx))
    m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(x - w / 2 - 10, base - h), (x + w / 2 + 10, base - h + 12)]), fill=255)
    cv.fill(m, log_tex(cv.w, cv.h, seed).rotate(90, expand=True).resize((cv.w, cv.h)), 0.95, edge=0.4)
    for f in (0.35, 0.7): lines(cv, [[(x - w / 2, base - h * f), (x + w / 2, base - h * f - 6)], [(x - w / 2, base - h * f - 6), (x + w / 2, base - h * f)]], (70, 50, 32, 230), 3)
    for k in range(int(h / 22)): lines(cv, [[(x + w / 2 + 14, base - k * 22), (x + w / 2 + 30, base - k * 22)]], (90, 64, 40, 255), 3)   # 사다리 칸
    lines(cv, [[(x + w / 2 + 14, base), (x + w / 2 + 14, base - h)], [(x + w / 2 + 30, base), (x + w / 2 + 30, base - h)]], (90, 64, 40, 255), 3.5)
    if roof: roof_mat(cv, [(x - w / 2 - 22, base - h - 34), (x, base - h - 60), (x + w / 2 + 22, base - h - 34), (x + w / 2 + 22, base - h - 28), (x - w / 2 - 22, base - h - 28)], seed)
    if fire: glow(cv, x, base - h - 8, 22, (255, 150, 60), 200); smoke(cv, x, base - h - 10, 120, seed)
def adobe(cv, x, base, w, h, d=40, seed=1, doors=1, wins=1, vigas=True):
    """흙벽돌 네모 집 한 칸 (앞면·윗면·옆면)"""
    n = noise(cv.w, cv.h, 18 * S, seed); n2 = noise(cv.w, cv.h, 4 * S, seed + 3)
    col = np.array([198, 158, 112], np.float32) * (0.86 + 0.18 * n[..., None] + 0.08 * n2[..., None])
    tex = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8))
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(x + w, base), (x + w, base - h), (x + w + d * 0.7, base - h - d * 0.45), (x + w + d * 0.7, base - d * 0.45)]), fill=255); cv.fill(m, tex, 0.62, edge=0.3)
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(x, base - h), (x + d * 0.7, base - h - d * 0.45), (x + w + d * 0.7, base - h - d * 0.45), (x + w, base - h)]), fill=255); cv.fill(m, tex, 1.12, edge=0.2)
    m = cv.mask(); ImageDraw.Draw(m).rounded_rectangle(P([(x, base - h), (x + w, base)]), radius=int(4 * S), fill=255)
    yy, xx = yx(cv); sh = 0.95 + 0.12 * (1 - np.clip((yy / S - (base - h)) / h, 0, 1))
    cv.fill(m, tex, sh, edge=0.35)
    rng = random.Random(seed)
    if vigas:
        for k in range(int(w / 26)):
            vx = x + 12 + k * 26; m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(vx - 4, base - h + 7), (vx + 4, base - h + 15)]), fill=255)
            cv.fill(m, Image.new('RGB', (cv.w, cv.h), (90, 64, 42)), 1.0, edge=0.3)
    for k in range(doors):
        dx = x + w * (k + 1) / (doors + 1) + (rng.random() - 0.5) * 10
        m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(dx - 11, base - h * 0.5 if h > 70 else base - h * 0.7), (dx + 11, base)]), fill=255)
        cv.fill(m, Image.new('RGB', (cv.w, cv.h), (46, 32, 22)), 1.0, edge=0.2)
    for k in range(wins):
        wx = x + w * (k + 0.5) / wins + (rng.random() - 0.5) * 14; wy = base - h * 0.72
        m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(wx - 7, wy - 8), (wx + 7, wy + 8)]), fill=255)
        cv.fill(m, Image.new('RGB', (cv.w, cv.h), (52, 38, 26)), 1.0, edge=0.2)
def ladder(cv, x, base, h):
    lines(cv, [[(x - 9, base), (x - 12, base - h)], [(x + 9, base), (x + 12, base - h)]], (96, 70, 44, 255), 3.5)
    for k in range(1, int(h / 20)): lines(cv, [[(x - 9 - k * 0.1, base - k * 20), (x + 9 + k * 0.1, base - k * 20)]], (110, 82, 52, 255), 3)
