"""아프리카 부족 마을 건물 그림(images/exterior-styles/kraal·tent)을 만든다. 재료와 도구는 tools/natives/make.py와 같다.
   kraal: 풀로 엮은 벌집 오두막과 가시 울타리 (줄루·코사·산)
   tent : 가죽 천막·거적 둥근 집과 가시 울타리 (투아레그·풀라니)
   이 절차가 다시 만드는 기본 건물은 부족 마을의 여섯 곳:
   술집·여관·성문·교역소·시장·조합. 나머지 7종은 ImageGen 자산이며
   tools/natives/africa-imagegen-prompts.json에 제작 지시문이 있다.
   python tools/natives/africa.py            # 모두
   python tools/natives/africa.py K_trade    # 하나만"""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *
OUT = SRC
B = 505
def base(cv, w, seed=1, shadow=True):
    cx = cv.w / S / 2
    if shadow: cv.shadow(cx, B, w / 2 - 10, 20)
    ground(cv, cx, B, w, seed)
def save(cv, bundle, kind, seed=0):
    finish(cv, seed); im = cv.out(H=660, pad=5) if kind == 'market' else cv.out()
    os.makedirs(OUT + bundle, exist_ok=True); im.save(OUT + bundle + '/' + kind + '.webp', quality=80, method=6)
    return im
def solid(cv, col, n=None, amp=0.25):
    if n is None: return Image.new('RGB', (cv.w, cv.h), col)
    return Image.fromarray(np.clip(np.array(col, np.float32) * (1 - amp / 2 + amp * n[..., None]), 0, 255).astype(np.uint8))
# ---------------------------------------------------------------- 결
_gc = {}
def grass_tex(cv, seed, tint=(206, 172, 104), mat=False):
    """마른 풀 이엉 결 (mat=True: 가로로 엮은 거적 띠)"""
    k = (cv.w, cv.h, seed, tint, mat)
    if k in _gc: return _gc[k]
    a = aniso(cv.w, cv.h, 4 if not mat else 120, 70 if not mat else 5, seed, 4)
    b = aniso(cv.w, cv.h, 30, 30, seed + 5, 3)
    n = np.clip((a - 0.5) * 2.4 + 0.5 + (b - 0.5) * 0.5, 0, 1)
    c = ramp(n, [(96, 74, 40), (160, 128, 72), (206, 172, 104), (232, 206, 146)]) * (np.array(tint, np.float32) / np.array((206, 172, 104), np.float32))
    if mat:
        yy, xx = yx(cv); band = (np.sin(yy / S / 7.0 * math.pi) * 0.5 + 0.5)
        c = c * (0.82 + 0.22 * band[..., None])
    t = recolor(tile(THATCH, cv.w, cv.h, 0.5 * S), tint, 0.5, 1.0, 0.5)
    im = Image.blend(Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)), t, 0.3)
    _gc[k] = im; return im
def leather_tex(cv, seed, col=(150, 72, 42)):
    n = noise(cv.w, cv.h, 30 * S, seed); n2 = noise(cv.w, cv.h, 5 * S, seed + 2)
    c = np.array(col, np.float32) * (0.78 + 0.3 * n[..., None] + 0.1 * n2[..., None])
    return Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
# ---------------------------------------------------------------- 벌집 오두막 (줄루 iQhugwane · 풀라니 거적 집)
def beehive(cv, cx, base, R, H, seed=2, fire=False, mat=False, tint=(206, 172, 104), door=True, smoke_=True):
    m = cv.mask(); ImageDraw.Draw(m).pieslice(P([(cx - R, base - H), (cx + R, base + H)]), 180, 360, fill=255)
    yy, xx = yx(cv)
    nx = (xx / S - cx) / R; ny = (base - yy / S) / H; nz = np.sqrt(np.clip(1 - nx ** 2 - ny ** 2, 0, 1))
    sh = 0.3 + 0.95 * np.clip(-0.55 * nx + 0.45 * ny + 0.7 * nz, 0, 1) ** 1.2
    cv.fill(m, grass_tex(cv, seed, tint, mat), sh, edge=0.6)
    rng = random.Random(seed)
    col = (88, 64, 34, 150) if not mat else (110, 80, 46, 120)
    # 이엉을 붙들어 매는 새끼줄 그물: 위도 · 경도
    rows = 6 if not mat else 9
    for i in range(1, rows):
        f = i / rows; y = base - H * f; hw = R * math.sqrt(max(0, 1 - f * f))
        pts = [(cx + hw * math.sin(t), y + H * 0.05 * (1 - f) * math.cos(t)) for t in [(-1 + 2 * j / 24) * math.pi / 2 * 0.97 for j in range(25)]]
        lines(cv, [pts], col, 1.6 if not mat else 1.2)
        if not mat: lines(cv, [[(p[0], p[1] - 3) for p in pts[2:-2]]], (240, 214, 150, 60), 2.2)   # 이엉 겹 위 밝은 결
    if not mat:
        for k in (-3, -2, -1, 0, 1, 2, 3):
            pts = [(cx + R * k / 3.6 * math.cos(j / 20 * math.pi / 2), base - H * math.sin(j / 20 * math.pi / 2)) for j in range(21)]
            lines(cv, [pts], (80, 58, 30, 120), 1.4)
    # 꼭대기 매듭
    m2 = cv.mask(); ImageDraw.Draw(m2).ellipse(P([(cx - R * 0.07, base - H - R * 0.06), (cx + R * 0.07, base - H + R * 0.06)]), fill=255)
    cv.fill(m2, grass_tex(cv, seed + 1, (170, 136, 80)), 0.85, edge=0.4)
    if door:
        dw = R * 0.3; dh = H * 0.36; dx = cx + R * 0.18
        m3 = cv.mask(); ImageDraw.Draw(m3).pieslice(P([(dx - dw / 2, base - dh), (dx + dw / 2, base + dh)]), 180, 360, fill=255)
        cv.fill(m3, solid(cv, (30, 20, 14)), edge=0.2)
        lines(cv, [[(dx - dw / 2 - 3 + dw * (1 - math.cos(t)) / 2, base - dh * math.sin(t)) for t in [j / 16 * math.pi for j in range(17)]]], (130, 100, 58, 255), 3)
        if fire: glow(cv, dx, base - dh * 0.3, dw * 0.4, (255, 150, 60), 180)
    if smoke_ and fire: smoke(cv, cx - R * 0.05, base - H * 0.95, 80, seed)
# ---------------------------------------------------------------- 가시 울타리 (소 우리 · 마을 둘레)
def thorn_fence(cv, x0, x1, base, H, seed=4, gap=None, posts=True):
    rng = random.Random(seed)
    if posts:
        x = x0; i = 0
        while x < x1:
            w = 9 + rng.random() * 6; h = H * (0.7 + rng.random() * 0.4); cxp = x + w / 2
            if not (gap and gap[0] - 6 < cxp < gap[1] + 6): log(cv, cxp, base - h, base, w, seed + i, rng.random() < 0.3, 0)
            x += w + 5 + rng.random() * 16; i += 1
    # 가시덤불: 짧은 가지를 이리저리
    lay = Image.new('RGBA', (cv.w, cv.h), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for k in range(int((x1 - x0) * 3.2)):
        x = x0 + rng.random() * (x1 - x0)
        if gap and gap[0] < x < gap[1]: continue
        y = base - rng.random() * H * 0.95
        ln = 8 + rng.random() * 26; a = rng.random() * math.pi * 2
        c = rng.choice([(62, 46, 30), (84, 64, 42), (104, 82, 54), (52, 40, 28), (120, 98, 66)])
        d.line(P([(x, y), (x + math.cos(a) * ln, y + math.sin(a) * ln * 0.6)]), fill=c + (235,), width=max(1, int((1 + rng.random() * 1.6) * S)))
        if rng.random() < 0.25: d.line(P([(x, y), (x + math.cos(a + 1) * ln * 0.4, y + math.sin(a + 1) * ln * 0.3)]), fill=c + (220,), width=S)
    cv.im.alpha_composite(lay)
    for f in (0.35, 0.7):
        segs = [[(x0, base - H * f), (gap[0], base - H * f + 2)], [(gap[1], base - H * f), (x1, base - H * f + 2)]] if gap else [[(x0, base - H * f), (x1, base - H * f + 2)]]
        lines(cv, segs, (70, 52, 32, 220), 2.4)
# ---------------------------------------------------------------- 소가죽 방패 · 창 · 소뿔
def shield(cv, x, top, h, seed=1, dark=(44, 30, 24), light=(232, 222, 200)):
    w = h * 0.52
    lines(cv, [[(x, top - h * 0.12), (x, top + h * 1.12)]], (96, 70, 44, 255), 3.4)
    m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(x - w / 2, top), (x + w / 2, top + h)]), fill=255)
    n = noise(cv.w, cv.h, 14 * S, seed)
    patch = (n > 0.52)[..., None]
    tex = np.where(patch, np.array(dark, np.float32), np.array(light, np.float32)) * (0.9 + 0.15 * noise(cv.w, cv.h, 3 * S, seed + 1)[..., None])
    cv.fill(m, Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)), cyl_x(cv, x - w / 2, x + w / 2, 0.65, 1.12), edge=0.35)
    for k in range(1, 8):   # 가운데 가죽끈 두 줄
        y = top + h * k / 8
        lines(cv, [[(x - w * 0.12, y), (x + w * 0.12, y)]], (150, 40, 30, 255) if k % 2 else (230, 220, 200, 255), 3)
def spear(cv, x, base, h, lean=0.0):
    tx = x + lean * h
    lines(cv, [[(x, base), (tx, base - h)]], (96, 70, 44, 255), 3)
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(tx - 5, base - h + 2), (tx + lean * 46, base - h - 46), (tx + 5, base - h + 2)]), fill=255)
    cv.fill(m, solid(cv, (190, 190, 186)), 1.0, edge=0.3)
def horns(cv, x, y, w=60):
    for s in (-1, 1):
        pts = [(x + s * w * 0.5 * t, y - w * 0.32 * math.sin(t * math.pi * 0.8)) for t in [j / 12 for j in range(13)]]
        lines(cv, [pts], (226, 214, 186, 255), 6 - 0)
    m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(x - 10, y - 8), (x + 10, y + 14)]), fill=255)
    cv.fill(m, solid(cv, (236, 228, 210)), 1.0, edge=0.4)
    for dx in (-4, 4):
        m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(x + dx - 2.5, y - 2), (x + dx + 2.5, y + 3)]), fill=255); cv.fill(m, solid(cv, (40, 30, 24)), edge=0)
def gourd(cv, x, base, h, seed=1, col=(196, 156, 84)):
    w = h * 0.7; m = cv.mask(); d = ImageDraw.Draw(m)
    d.ellipse(P([(x - w / 2, base - h * 0.62), (x + w / 2, base)]), fill=255); d.ellipse(P([(x - w * 0.22, base - h), (x + w * 0.22, base - h * 0.52)]), fill=255)
    yy, xx = yx(cv); nx = (xx / S - x) / (w / 2)
    cv.fill(m, solid(cv, col, noise(cv.w, cv.h, 6 * S, seed), 0.2), 0.6 + 0.6 * np.clip(np.cos((nx + 0.35) * 1.3), 0, 1), edge=0.4)
    lines(cv, [[(x - w * 0.4, base - h * 0.35), (x + w * 0.4, base - h * 0.35)]], (110, 60, 30, 200), 2)
def mat_floor(cv, x0, x1, base, col=(196, 160, 100), seed=1, h=14):
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(x0 + 10, base - h), (x1 - 10, base - h), (x1, base), (x0, base)]), fill=255)
    tex = grass_tex(cv, seed, col, True)
    cv.fill(m, tex, 0.95, edge=0.3)
def rug(cv, x0, x1, base, h=16, seed=1, cols=((150, 40, 32), (40, 50, 110), (220, 180, 90))):
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(x0 + 8, base - h), (x1 - 8, base - h), (x1, base), (x0, base)]), fill=255)
    yy, xx = yx(cv); k = (np.floor((xx / S - x0) / 18).astype(int)) % len(cols)
    c = np.array(cols, np.float32)[k] * (0.85 + 0.2 * noise(cv.w, cv.h, 4 * S, seed)[..., None])
    cv.fill(m, Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)), 1.0, edge=0.25)
def bag(cv, x, base, h, seed=1, col=(140, 66, 38)):
    w = h * 0.9; m = cv.mask(); d = ImageDraw.Draw(m)
    d.rounded_rectangle(P([(x - w / 2, base - h), (x + w / 2, base)]), radius=int(w * 0.35 * S), fill=255)
    cv.fill(m, leather_tex(cv, seed, col), cyl_x(cv, x - w / 2, x + w / 2, 0.6, 1.15), edge=0.4)
    for k in range(-3, 4): lines(cv, [[(x + k * w / 8, base - h * 0.35), (x + k * w / 8 + 1, base - h * 0.12)]], (230, 200, 120, 200), 1.6)   # 술 장식
    lines(cv, [[(x - w * 0.4, base - h * 0.55), (x + w * 0.4, base - h * 0.55)]], (60, 30, 18, 230), 2.4)
def salt_slab(cv, x, base, w, h, seed=1):
    m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(x - w / 2, base - h), (x + w / 2, base)]), fill=255)
    cv.fill(m, solid(cv, (232, 226, 214), noise(cv.w, cv.h, 6 * S, seed), 0.25), 1.0, edge=0.3)
    lines(cv, [[(x - w / 2, base - h * 0.5), (x + w / 2, base - h * 0.5)]], (120, 90, 60, 200), 2)
def banner(cv, x, base, h, col=(40, 52, 120), seed=1):
    log(cv, x, base - h, base, 8, seed)
    m = cv.mask(); ImageDraw.Draw(m).polygon(P([(x + 4, base - h + 6), (x + 70, base - h + 14), (x + 60, base - h + 48), (x + 70, base - h + 84), (x + 4, base - h + 90)]), fill=255)
    cv.fill(m, solid(cv, col, noise(cv.w, cv.h, 14 * S, seed), 0.3), cyl_x(cv, x, x + 70, 0.75, 1.1), edge=0.35)
    for k in range(3): lines(cv, [[(x + 14 + k * 16, base - h + 30), (x + 22 + k * 16, base - h + 40), (x + 14 + k * 16, base - h + 50)]], (220, 200, 140, 230), 2)
def carved_post(cv, x, base, h, seed=1):
    """투아레그 천막의 깎아 만든 기둥 (윗부분이 넓게 갈라진다)"""
    log(cv, x, base - h, base, 9, seed)
    for s in (-1, 1): lines(cv, [[(x, base - h + 26), (x + s * 18, base - h - 4)]], (110, 80, 50, 255), 5)
    for f in (0.3, 0.5): lines(cv, [[(x - 5, base - h * (1 - f)), (x + 5, base - h * (1 - f))]], (200, 170, 110, 255), 2.5)
# ---------------------------------------------------------------- 투아레그 가죽 천막
def tuareg_tent(cv, cx, base, W, H, seed=3, col=(150, 72, 42), fire=False, front=True):
    eave = base - H * 0.5; top = base - H
    # 뒤 거적 벽
    m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(cx - W * 0.46, eave), (cx + W * 0.46, base)]), fill=255)
    cv.fill(m, grass_tex(cv, seed + 3, (200, 168, 112), True), 0.8, edge=0.3)
    if front:   # 열린 앞: 안쪽 그늘과 깔개
        m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(cx - W * 0.2, eave + 4), (cx + W * 0.24, base)]), fill=255)
        cv.fill(m, solid(cv, (46, 32, 22)), 1.0, edge=0.3)
        if fire: glow(cv, cx, base - H * 0.15, W * 0.1, (255, 150, 60), 170)
        rug(cv, cx - W * 0.2, cx + W * 0.24, base, 12, seed)
    # 지붕 가죽 (가운데가 솟은 낮은 활꼴)
    pts = [(cx - W / 2, eave + H * 0.06)]
    for j in range(25):
        t = j / 24; x = cx - W / 2 + W * t
        pts.append((x, eave - (eave - top) * (math.sin(t * math.pi) ** 0.7)))
    pts += [(cx + W / 2, eave + H * 0.06), (cx + W / 2 - 6, eave + H * 0.12)]
    pts += [(cx - W / 2 + W * t, eave + H * 0.1 + H * 0.03 * math.sin(t * math.pi * 6)) for t in [1 - j / 24 for j in range(25)]]
    m = cv.mask(); ImageDraw.Draw(m).polygon(P(pts), fill=255)
    yy, xx = yx(cv); u = (xx / S - cx) / (W / 2)
    sh = 0.62 + 0.55 * np.clip(np.cos((u + 0.4) * math.pi / 2.4), 0, 1)
    cv.fill(m, leather_tex(cv, seed, col), sh, edge=0.45)
    rng = random.Random(seed)
    for k in range(1, 7):   # 가죽 조각 이음새
        x = cx - W / 2 + W * k / 7 + (rng.random() - 0.5) * 10; t = (x - (cx - W / 2)) / W
        lines(cv, [[(x, eave - (eave - top) * (math.sin(t * math.pi) ** 0.7) + 3), (x + 2, eave + H * 0.09)]], (80, 36, 20, 170), 1.6)
    lines(cv, [[(cx - W / 2 + 4, eave + H * 0.02), (cx + W / 2 - 4, eave + H * 0.02)]], (80, 36, 20, 130), 1.6)
    # 처마 술
    for k in range(int(W / 10)):
        x = cx - W / 2 + 6 + k * 10; lines(cv, [[(x, eave + H * 0.1), (x + 1, eave + H * 0.16)]], (90, 40, 24, 220), 1.6)
    # 기둥
    for fx in (-0.44, 0.44): carved_post(cv, cx + W * fx, base, H * 0.62, seed + int(fx * 10))
    # 버팀줄
    for s in (-1, 1): lines(cv, [[(cx + s * W * 0.5, eave + H * 0.06), (cx + s * (W * 0.5 + 40), base + 2)]], (180, 160, 120, 200), 1.4)
def mat_shade(cv, x0, x1, roof_y, base, seed=9, posts=4, tint=(176, 146, 96)):
    roof_mat(cv, [(x0 - 40, roof_y + 50), ((x0 + x1) / 2, roof_y), (x1 + 40, roof_y + 50), (x1 + 44, roof_y + 86), ((x0 + x1) / 2, roof_y + 40), (x0 - 44, roof_y + 86)], seed, tint, 0.95)
    for k in range(int((x1 - x0) / 14)): x = x0 - 36 + k * 14 + 7; lines(cv, [[(x, roof_y + 80), (x + 1, roof_y + 96)]], (120, 96, 60, 220), 2)   # 처마 풀 끝
    for i in range(posts): log(cv, x0 + (x1 - x0) * i / (posts - 1), roof_y + 40, base, 13, 20 + i + seed)
# ================================================================= kraal: 벌집 오두막 마을 (줄루·코사·산)
def K_trade():
    cv = Canvas(760, 520); base(cv, 740, 31)
    beehive(cv, 300, 502, 200, 250, 31)
    rack(cv, 590, 506, 110, 170, 33)
    for x, h, s in [(110, 40, 1), (160, 34, 2)]: basket(cv, x, 508, h, s)
    pot(cv, 470, 508, 46, 3, (40, 32, 28)); gourd(cv, 515, 508, 40, 4)
    save(cv, 'kraal', 'trade', 31)
def K_tavern():
    cv = Canvas(760, 520); base(cv, 740, 32)
    beehive(cv, 300, 502, 210, 260, 32, fire=True)
    tripod_fire(cv, 600, 506, 80, 5)
    for x, h in [(470, 60), (520, 46), (560, 52), (690, 40)]: pot(cv, x, 508, h, x, (44, 34, 30))   # 수수 술 항아리(우캄바)
    gourd(cv, 120, 508, 44, 2)
    save(cv, 'kraal', 'tavern', 32)
def K_inn():
    cv = Canvas(780, 520); base(cv, 760, 33)
    beehive(cv, 560, 498, 135, 170, 34)
    beehive(cv, 300, 504, 190, 240, 35, fire=True)
    mat_floor(cv, 420, 520, 510, (196, 160, 100), 3)
    save(cv, 'kraal', 'inn', 33)
def K_gate():
    cv = Canvas(780, 520); base(cv, 760, 34)
    thorn_fence(cv, 20, 760, 505, 190, 7, (320, 460))
    log(cv, 318, 230, 506, 22, 44); log(cv, 462, 230, 506, 22, 45)
    lines(cv, [[(300, 262), (480, 262)]], (70, 50, 32, 255), 9)
    horns(cv, 318, 222, 70); horns(cv, 462, 222, 70)
    shield(cv, 210, 300, 150, 5); spear(cv, 238, 506, 200, -0.08)
    save(cv, 'kraal', 'gate', 34)
def K_market():
    cv = Canvas(1000, 660); cx = 500; B2 = 645
    cv.shadow(cx, B2, 470, 22); ground(cv, cx, B2, 980, 35)
    mat_shade(cv, 120, 880, 380, B2, 35, 4)
    mat_floor(cv, 140, 860, B2 - 4, (196, 160, 100), 5, 20)
    for x, h, s in [(200, 64, 1), (290, 54, 2), (660, 62, 6), (750, 52, 3)]: basket(cv, x, B2 - 10, h, s)
    for x, h, c in [(370, 80, (44, 34, 30)), (440, 62, (150, 82, 52)), (590, 72, (44, 34, 30))]: pot(cv, x, B2 - 8, h, x, c)
    for x, h in [(500, 56), (540, 44), (820, 60)]: gourd(cv, x, B2 - 8, h, x)
    rack(cv, 905, B2, 100, 230, 36)
    save(cv, 'kraal', 'market', 35)
def K_guild():   # 젊은이 무리(연대)가 모이는 큰 오두막
    cv = Canvas(800, 520); base(cv, 780, 36)
    beehive(cv, 400, 500, 235, 290, 37)
    for x, s in [(140, 1), (190, 2), (610, 3), (660, 4)]: shield(cv, x, 330, 160, s)
    spear(cv, 110, 506, 230, 0.06); spear(cv, 690, 506, 230, -0.06)
    save(cv, 'kraal', 'guild', 36)
# ================================================================= tent: 가죽 천막 진영 (투아레그·풀라니)
def T_trade():
    cv = Canvas(800, 520); base(cv, 780, 41)
    tuareg_tent(cv, 340, 504, 480, 260, 41)
    for x, h, s, c in [(640, 54, 1, (140, 66, 38)), (690, 44, 2, (110, 50, 30)), (110, 48, 3, (160, 90, 46))]: bag(cv, x, 508, h, s, c)
    salt_slab(cv, 740, 508, 60, 24, 1); salt_slab(cv, 744, 484, 54, 22, 2)
    save(cv, 'tent', 'trade', 41)
def T_tavern():
    cv = Canvas(800, 520); base(cv, 780, 42)
    tuareg_tent(cv, 330, 504, 460, 250, 42, (128, 58, 36), fire=True)
    tripod_fire(cv, 640, 506, 76, 6)
    rug(cv, 560, 740, 512, 14, 4)
    for x, h in [(120, 44), (160, 36)]: pot(cv, x, 508, h, x, (150, 82, 52))
    save(cv, 'tent', 'tavern', 42)
def T_inn():
    cv = Canvas(820, 520); base(cv, 800, 43)
    beehive(cv, 610, 502, 150, 150, 43, mat=True, tint=(214, 186, 132))      # 풀라니 거적 집
    tuareg_tent(cv, 290, 504, 420, 230, 44, (160, 84, 50))
    save(cv, 'tent', 'inn', 43)
def T_gate():
    cv = Canvas(780, 520); base(cv, 760, 44)
    thorn_fence(cv, 20, 760, 505, 150, 8, (320, 460), posts=False)
    carved_post(cv, 320, 506, 250, 46); carved_post(cv, 460, 506, 250, 47)
    lines(cv, [[(318, 290), (462, 290)]], (110, 80, 50, 255), 6)
    banner(cv, 200, 506, 260, (40, 52, 120), 3); banner(cv, 560, 506, 260, (40, 52, 120), 4)
    save(cv, 'tent', 'gate', 44)
def T_market():
    cv = Canvas(1000, 660); cx = 500; B2 = 645
    cv.shadow(cx, B2, 470, 22); ground(cv, cx, B2, 980, 45)
    mat_shade(cv, 120, 880, 380, B2, 45, 4, (190, 160, 110))
    rug(cv, 150, 470, B2 - 2, 18, 5); mat_floor(cv, 500, 860, B2 - 2, (200, 168, 112), 6, 18)
    for i, x in enumerate(range(560, 840, 78)): salt_slab(cv, x, B2 - 12, 70, 28, i); salt_slab(cv, x + 4, B2 - 40, 62, 26, i + 9)
    for x, h, s, c in [(200, 70, 1, (140, 66, 38)), (275, 60, 2, (110, 50, 30)), (350, 66, 3, (160, 90, 46))]: bag(cv, x, B2 - 12, h, s, c)
    for x, h in [(420, 72), (480, 56)]: pot(cv, x, B2 - 12, h, x, (150, 82, 52))
    save(cv, 'tent', 'market', 45)
def T_guild():   # 대상(隊商) 우두머리들이 모이는 큰 천막
    cv = Canvas(860, 520); base(cv, 840, 46)
    tuareg_tent(cv, 430, 502, 600, 290, 46, (120, 52, 34), fire=True)
    banner(cv, 60, 506, 300, (40, 52, 120), 5); banner(cv, 780, 506, 300, (150, 40, 32), 6)
    for x, h, s in [(150, 46, 7), (720, 50, 8)]: bag(cv, x, 508, h, s)
    save(cv, 'tent', 'guild', 46)
ALL = [K_trade, K_tavern, K_inn, K_gate, K_market, K_guild, T_trade, T_tavern, T_inn, T_gate, T_market, T_guild]
if __name__ == '__main__':
    names = sys.argv[1:]
    for f in ALL:
        if not names or f.__name__ in names: f(); print('done', f.__name__)
