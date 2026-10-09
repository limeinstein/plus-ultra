# -*- coding: utf-8 -*-
"""잠입·설득·청혼의 결과를 보여 주는 움직이는 그림(GIF)을 코드로 그린다.

  python tools/outcome_gifs/make_outcomes.py          → images/outcomes/*.gif
  python tools/outcome_gifs/make_outcomes.py --sheet  → 같은 그림의 장면들을 한 장에 늘어놓은 미리보기(tools/outcome_gifs/preview/)

그림은 모두 이 파일에서 새로 그린 픽셀 그림이다 (원작의 그림을 옮기지 않았다).
  · 사람은 관절 각도로 움직이는 인형으로 그린다 — 뼈대(엉덩이·무릎·어깨·팔꿈치)의 각도를 장면마다 정하고 그 사이를 이어 그린다.
  · 각도는 「곧게 아래」가 0도, 바라보는 쪽으로 돌수록 +, 머리 위가 180도.
  · 바탕은 240×150 픽셀로 그리고 두 배로 키워 480×300 GIF로 쓴다. 한 번만 돌고 마지막 장면에서 멈춘다.

만드는 그림 (G.Outcome 이 쓴다 — js/ui/outcome.js)
  sneak_ok   / sneak_ok_f    잠입 성공: 졸고 있는 경비 옆을 발끝으로 지나 성문 안으로 사라진다
  sneak_fail / sneak_fail_f  잠입 들킴: 경비가 깨어 등불을 비추고, 제독이 놀라 두 손을 든다
  win        / win_f         설득 성공: 주먹을 치켜들며 두 번 뛰어오른다
  lose       / lose_f        설득 실패: 어깨가 처지고 무릎을 꿇은 채 바닥을 짚는다
  propose    / propose_f     청혼 성공: 한쪽 무릎을 꿇고 반지를 내밀자 상대가 두 손으로 볼을 감싸고 하트가 오른다
  (_f = 여자 제독 — 뒤를 이은 딸)
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'images', 'outcomes')
W, H, SCALE, MS = 240, 150, 2, 80
GROUND = 128

def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)

def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (c[3],)

def lerp(a, b, t): return a + (b - a) * t
def ease(t): return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- 옷차림
LOOK = {
    'admiral': dict(skin='#e8b48a', hair='#3b2416', coat='#2c4a7a', trim='#e0b34a', sash='#b8323a', collar='#efe6d2',
                    pants='#d8c8a0', boot='#5a3420', hat='#2b2230', plume='#c8323a', beard=True),
    'admiral_f': dict(skin='#efc09a', hair='#8a3a1e', coat='#2c4a7a', trim='#e0b34a', sash='#b8323a', collar='#efe6d2',
                      pants='#d8c8a0', boot='#5a3420', hat='#2b2230', plume='#e6e0d0', beard=False, long=True),
    'guard': dict(skin='#d9a27a', hair='#2a1c14', coat='#a8322e', trim='#d8b040', sash='#d8b040', collar='#8c949e',
                  pants='#6a2420', boot='#3e2a1c', helm='#b9c0c8', beard=True),
    'lady': dict(skin='#f0c4a0', hair='#5a3418', dress='#c86a7a', trim='#f2e2c8', sash='#f2e2c8', collar='#f2e2c8', boot='#6a3a2a'),
}
OUTLINE = (26, 18, 16, 255)

def vec(p, ang, L, face):
    r = math.radians(ang)
    return (p[0] + math.sin(r) * L * face, p[1] + math.cos(r) * L)

def capsule(d, a, b, w, col):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; n = math.hypot(dx, dy) or 1
    px, py = -dy / n * w / 2, dx / n * w / 2
    d.polygon([(ax + px, ay + py), (bx + px, by + py), (bx - px, by - py), (ax - px, ay - py)], fill=col)
    r = w / 2
    for (x, y) in (a, b):
        d.ellipse([x - r, y - r, x + r - 1, y + r - 1], fill=col)

def poly_along(a, b, wa, wb):
    """a→b 선분을 따라 너비 wa(a쪽)·wb(b쪽)의 사다리꼴"""
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; n = math.hypot(dx, dy) or 1
    ux, uy = -dy / n, dx / n
    return [(ax + ux * wa / 2, ay + uy * wa / 2), (bx + ux * wb / 2, by + uy * wb / 2), (bx - ux * wb / 2, by - uy * wb / 2), (ax - ux * wa / 2, ay - uy * wa / 2)]

# 기본 자세 (서 있기)
STAND = dict(x=120, h=33, face=1, lean=0, head=0,
             fth=-4, fsh=0, bth=6, bsh=2, fua=8, ffa=14, bua=-8, bfa=-4,
             eyes='open', mouth='flat', alpha=1.0, hood=False, item=None, item2=None, blush=False, sweat=0)

def pose(**kw):
    p = dict(STAND); p.update(kw); return p

def mix(a, b, t):
    out = {}
    for k, v in a.items():
        w = b.get(k, v)
        if isinstance(v, (int, float)) and isinstance(w, (int, float)) and not isinstance(v, bool):
            out[k] = lerp(v, w, t)
        else:
            out[k] = w if t >= 0.5 else v
    return out

def track(keys, f):
    """keys: [(장면 번호, 자세)] — f번째 장면의 자세 (부드럽게 잇는다)"""
    if f <= keys[0][0]: return dict(keys[0][1])
    for i in range(len(keys) - 1):
        f0, p0 = keys[i]; f1, p1 = keys[i + 1]
        if f0 <= f <= f1:
            return mix(p0, p1, ease((f - f0) / max(1, f1 - f0)))
    return dict(keys[-1][1])

# ---------------------------------------------------------------- 사람 그리기
def draw_person(img, P, look):
    """P: 자세 사전, look: LOOK 키. 한 겹(RGBA)에 그리고 테두리를 둘러 img 위에 얹는다"""
    L = LOOK[look]
    # 부위마다 따로 테두리를 둘러 겹친다 (소매가 외투에 묻히지 않게)
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    acc = Image.new('RGBA', img.size, (0, 0, 0, 0))
    def flush():
        a = np.array(lay)
        al = a[:, :, 3] > 0
        if al.any():
            grow = al.copy()
            grow[1:, :] |= al[:-1, :]; grow[:-1, :] |= al[1:, :]; grow[:, 1:] |= al[:, :-1]; grow[:, :-1] |= al[:, 1:]
            a[grow & ~al] = OUTLINE
            acc.alpha_composite(Image.fromarray(a))
        lay.paste((0, 0, 0, 0), [0, 0, img.size[0], img.size[1]])
    f = 1 if P['face'] >= 0 else -1
    hip = (P['x'], GROUND - P['h'])
    TH, SH, TO, UA, FA = 15, 15, 24, 12, 11
    neck = vec(hip, 180 - P['lean'], TO, f)
    sho = vec(hip, 180 - P['lean'], TO - 3, f)
    lady = look == 'lady'
    col = lambda k: hx(L[k])
    skin = col('skin'); skinB = shade(skin, 0.82)
    # 다리
    def leg(th, sh, back):
        knee = vec(hip, th, TH, f); ank = vec(knee, sh, SH, f)
        pc = shade(col('pants'), 0.78) if back else col('pants')
        bc = shade(col('boot'), 0.75) if back else col('boot')
        capsule(d, hip, knee, 7, pc)
        capsule(d, knee, ank, 6, bc)
        # 발끝: 정강이에 직각으로 앞쪽
        toe = vec(ank, sh + 90, 6, f)
        capsule(d, ank, toe, 4, bc)
        return knee, ank
    def arm(ua, fa, back, item=None):
        el = vec(sho, ua, UA, f); hd = vec(el, fa, FA, f)
        cc = shade(col('coat') if not lady else col('dress'), 0.75) if back else (col('coat') if not lady else col('dress'))
        if P['hood'] and not lady: cc = shade(hx('#3d3b47'), 0.75 if back else 1)
        capsule(d, sho, el, 6, cc)
        capsule(d, el, hd, 5, cc)
        # 소맷부리
        cuff = vec(el, fa, FA - 2, f)
        capsule(d, cuff, cuff, 5, shade(col('trim'), 0.8 if back else 1) if not P['hood'] else cc)
        r = 2.6
        d.ellipse([hd[0] - r, hd[1] - r, hd[0] + r, hd[1] + r], fill=skinB if back else skin)
        return el, hd
    # 손에 든 것
    def hold(slot, key):
        it = P.get(key)
        if not it: return
        el, hd = hands[slot]
        if it == 'halberd':
            top = (hd[0] + 3 * f, hd[1] - 34); bot = (hd[0] - 1 * f, hd[1] + 22)
            d.line([bot, top], fill=hx('#6a4a2a'), width=2)
            d.polygon([(top[0], top[1] + 2), (top[0] + 7 * f, top[1] + 5), (top[0] + 6 * f, top[1] + 11), (top[0], top[1] + 9)], fill=hx('#c9d0d8'))
            d.polygon([(top[0], top[1] - 6), (top[0] + 1, top[1] + 2), (top[0] - 1, top[1] + 2)], fill=hx('#c9d0d8'))
        elif it == 'halberd_lv':
            # 겨누어 앞으로 내민 미늘창
            a = (hd[0] - 22 * f, hd[1] + 6); b = (hd[0] + 22 * f, hd[1] - 6)
            d.line([a, b], fill=hx('#6a4a2a'), width=2)
            d.polygon([(b[0], b[1] - 4), (b[0] + 9 * f, b[1] - 2), (b[0], b[1] + 3)], fill=hx('#c9d0d8'))
            d.polygon([(b[0] - 2 * f, b[1]), (b[0] + 1 * f, b[1] + 8), (b[0] + 5 * f, b[1] + 6)], fill=hx('#aab2bc'))
        elif it == 'lantern':
            d.line([hd, (hd[0], hd[1] + 3)], fill=hx('#3a2a1a'))
            d.rectangle([hd[0] - 3, hd[1] + 3, hd[0] + 3, hd[1] + 10], fill=hx('#ffd36a'), outline=hx('#5a4020'))
        elif it == 'ring':
            d.rectangle([hd[0] - 3 + 2 * f, hd[1] - 6, hd[0] + 3 + 2 * f, hd[1] - 1], fill=hx('#7a1e2e'))
            d.ellipse([hd[0] - 2 + 2 * f, hd[1] - 10, hd[0] + 2 + 2 * f, hd[1] - 6], outline=hx('#ffd84a'))
            d.point((hd[0] + 2 * f, hd[1] - 11), fill=hx('#ffffff'))
    hands = {}
    # 뒤쪽 팔·다리 → 앞쪽 다리 → 몸통 → 머리 → 앞쪽 팔 (부위마다 테두리)
    hands['b'] = arm(P['bua'], P['bfa'], True); flush()
    hold('b', 'item2'); flush()
    if not lady:
        leg(P['bth'], P['bsh'], True); flush()
        leg(P['fth'], P['fsh'], False); flush()
    # 몸통
    if lady:
        # 긴 치마 — 엉덩이에서 발목까지 퍼진다
        hemL = vec(hip, P['bth'] - 8, 30, f); hemR = vec(hip, P['fth'] + 14, 30, f)
        y = max(hemL[1], hemR[1])
        sk = [(hip[0] - 7, hip[1] - 2), (hip[0] + 7, hip[1] - 2), (max(hemL[0], hemR[0]) + 6, y), (min(hemL[0], hemR[0]) - 6, y)]
        d.polygon(sk, fill=col('dress'))
        d.line([(sk[3][0], y - 1), (sk[2][0], y - 1)], fill=shade(col('dress'), 0.8), width=2)
        for t in (0.35, 0.7):
            x = lerp(sk[3][0], sk[2][0], t)
            d.line([(lerp(hip[0] - 6, hip[0] + 6, t), hip[1]), (x, y - 2)], fill=shade(col('dress'), 0.85))
        # 앞치마
        ap = [(hip[0] - 3 + 2 * f, hip[1]), (hip[0] + 5 * f + 2, hip[1]), (hip[0] + 8 * f, y - 4), (hip[0] - 2 * f, y - 4)]
        d.polygon(ap, fill=col('trim'))
        d.polygon(poly_along(hip, sho, 11, 12), fill=col('dress'))
        d.polygon(poly_along(vec(hip, 180 - P['lean'], 5, f), vec(hip, 180 - P['lean'], 17, f), 9, 7), fill=shade(col('dress'), 0.8))
        # 신발 끝
        for a in (hemL, hemR):
            d.ellipse([a[0] - 3, y - 1, a[0] + 4, y + 2], fill=col('boot'))
    else:
        coatc = hx('#3d3b47') if P['hood'] else col('coat')
        # 외투 자락 (엉덩이 아래로)
        skirt = vec(hip, (P['fth'] + P['bth']) / 2, 11, f)
        d.polygon(poly_along(hip, skirt, 13, 17), fill=shade(coatc, 0.88))
        d.polygon(poly_along(hip, sho, 13, 14), fill=coatc)
        if not P['hood']:
            # 단추줄·띠·목깃
            front = vec(hip, 180 - P['lean'], 1, f)
            for t in (0.3, 0.5, 0.7, 0.9):
                q = vec(hip, 180 - P['lean'], TO * t, f)
                d.point((q[0] + 4 * f, q[1]), fill=col('trim'))
            belt = vec(hip, 180 - P['lean'], 3, f)
            d.polygon(poly_along(vec(hip, 180 - P['lean'], 1, f), vec(hip, 180 - P['lean'], 5, f), 14, 14), fill=col('sash'))
            if look == 'guard':
                # 가슴받이
                d.polygon(poly_along(vec(hip, 180 - P['lean'], 7, f), vec(hip, 180 - P['lean'], TO - 3, f), 11, 12), fill=hx('#9aa3ad'))
                d.line([vec(hip, 180 - P['lean'], 9, f), vec(hip, 180 - P['lean'], TO - 4, f)], fill=hx('#c9d0d8'))
            c1 = vec(neck, 90 - P['lean'], 1, f)
            d.ellipse([c1[0] - 4, c1[1] - 2, c1[0] + 4, c1[1] + 2], fill=col('collar'))
        else:
            # 망토 — 등 뒤로 늘어진다
            back = vec(sho, -18 - P['lean'] * 0.3, 30, f)
            d.polygon([sho, vec(sho, -90, 6, f), back, vec(back, 90, 10, f), skirt], fill=shade(coatc, 0.8))
    flush()
    # 머리
    ang = P['lean'] + P['head']
    hc = vec(neck, 180 - ang, 7, f)
    draw_head(d, hc, ang, f, L, P, look); flush()
    # 앞쪽 팔
    hands['f'] = arm(P['fua'], P['ffa'], False); flush()
    hold('f', 'item'); flush()
    flush()
    out = acc
    if P['alpha'] < 1:
        arr = np.array(out); arr[:, :, 3] = (arr[:, :, 3] * max(0, P['alpha'])).astype(np.uint8); out = Image.fromarray(arr)
    img.alpha_composite(out)
    return hands

def draw_head(d, c, ang, f, L, P, look):
    x, y = c
    skin = hx(L['skin']); hair = hx(L['hair'])
    up = (math.sin(math.radians(ang)) * f, -math.cos(math.radians(ang)))     # 머리 위쪽
    fw = (math.cos(math.radians(ang)) * f, math.sin(math.radians(ang)))      # 얼굴 쪽
    def at(u, v):  # u: 얼굴 쪽, v: 위쪽
        return (x + fw[0] * u + up[0] * v, y + fw[1] * u + up[1] * v)
    # 뒷머리 / 긴 머리
    if L.get('long') or look == 'lady':
        if look == 'lady':
            b = at(-5, 4); d.ellipse([b[0] - 4, b[1] - 4, b[0] + 4, b[1] + 4], fill=hair)       # 틀어 올린 머리
        else:
            for k in range(5):
                q = at(-5 - k * 0.6, -1 - k * 2.4); d.ellipse([q[0] - 3, q[1] - 3, q[0] + 3, q[1] + 3], fill=hair)
    if P['hood']:
        hood = hx('#3d3b47')
        d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=hood)
    d.ellipse([x - 6, y - 6.5, x + 6, y + 6.5], fill=skin)
    # 머리카락 (뒤통수·정수리)
    if not P['hood']:
        hb = at(-3, 3); d.ellipse([hb[0] - 5, hb[1] - 5, hb[0] + 4, hb[1] + 4], fill=hair)
        if L.get('beard'):
            for u, v in ((1, -5), (3, -4), (-1, -5), (2, -6), (0, -6)):
                q = at(u, v); d.point(q, fill=hair)
    # 눈·코·입
    e = at(3.6, 0.8)
    if P['eyes'] == 'closed':
        d.line([(e[0] - 1, e[1]), (e[0] + 1, e[1])], fill=OUTLINE)
    elif P['eyes'] == 'wide':
        d.rectangle([e[0] - 1, e[1] - 1, e[0] + 0, e[1] + 1], fill=(255, 255, 255, 255)); d.point(e, fill=OUTLINE)
    else:
        d.rectangle([e[0], e[1] - 1, e[0], e[1]], fill=OUTLINE)
    n = at(6.6, -1); d.point(n, fill=shade(skin, 0.8))
    m = at(4.2, -3.6)
    if P['mouth'] == 'open':
        d.ellipse([m[0] - 1.2, m[1] - 1.2, m[0] + 1.2, m[1] + 1.2], fill=hx('#7a2020'))
    elif P['mouth'] == 'smile':
        d.line([(m[0] - 1, m[1] - 0.5), (m[0] + 1, m[1] + 0.5)] if f > 0 else [(m[0] - 1, m[1] + 0.5), (m[0] + 1, m[1] - 0.5)], fill=hx('#7a2020'))
    elif P['mouth'] == 'sad':
        d.point(m, fill=hx('#5a2020'))
    else:
        d.point(m, fill=hx('#7a3a2a'))
    if P.get('blush'):
        b = at(2.5, -2); d.point(b, fill=hx('#ff7f8a')); d.point((b[0] + 1, b[1]), fill=hx('#ff7f8a'))
    # 모자·투구
    if P['hood']:
        hood = hx('#3d3b47')
        a1 = at(-7, 2); a2 = at(-2, 9); a3 = at(5, 7); a4 = at(6, 3)
        d.polygon([a1, a2, a3, a4, at(3, 5), at(-3, 2)], fill=hood)
        d.line([a4, at(4, 6)], fill=shade(hood, 1.3))
    elif look in ('admiral', 'admiral_f'):
        hat = hx(L['hat'])
        b1 = at(-10, 5); b2 = at(10, 5)
        d.polygon([b1, b2, at(10, 7), at(-10, 7)], fill=hat)                    # 챙
        d.polygon([at(-5, 6), at(5, 6), at(4, 12), at(-4, 12)], fill=hat)      # 갓
        d.line([at(-5, 7), at(5, 7)], fill=hx(L['trim']))                       # 띠
        p1 = at(-4, 10)
        for k in range(6):                                                       # 깃털
            q = at(-5 - k * 1.6, 11 + math.sin(k * 0.8) * 2.0)
            d.ellipse([q[0] - 1.6, q[1] - 1.6, q[0] + 1.6, q[1] + 1.6], fill=hx(L['plume']) if k < 5 else hx('#ffffff'))
    elif look == 'guard':
        hm = hx(L['helm'])
        d.polygon([at(-9, 4), at(9, 4), at(7, 7), at(-7, 7)], fill=hm)          # 챙(모리온)
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=None)
        dome = [at(-6, 6), at(6, 6), at(5, 10), at(0, 12), at(-5, 10)]
        d.polygon(dome, fill=hm)
        d.line([at(-3, 13), at(3, 13)], fill=shade(hm, 1.1), width=2)            # 볏
        d.point(at(1, 9), fill=(255, 255, 255, 255))
    elif look == 'lady':
        hb = at(-1, 5); d.ellipse([hb[0] - 6, hb[1] - 3, hb[0] + 5, hb[1] + 3], fill=hair)
        fr = at(4, 5); d.ellipse([fr[0] - 2, fr[1] - 2, fr[0] + 2, fr[1] + 2], fill=hair)
        r = at(-3, 6); d.point(r, fill=hx('#f2e2c8'))

# ---------------------------------------------------------------- 그림 조각
def heart(d, cx, cy, s, col):
    pts = []
    for i in range(40):
        t = i / 40 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * s / 16, cy - y * s / 16))
    d.polygon(pts, fill=col)
    d.point((cx - s * 0.45, cy - s * 0.35), fill=(255, 255, 255, 255))

def sparkle(d, x, y, r, col=(255, 246, 200, 255)):
    d.line([(x - r, y), (x + r, y)], fill=col); d.line([(x, y - r), (x, y + r)], fill=col)
    if r >= 3:
        d.point((x - 1, y - 1), fill=col); d.point((x + 1, y + 1), fill=col); d.point((x + 1, y - 1), fill=col); d.point((x - 1, y + 1), fill=col)

def glyph(d, x, y, rows, col, s=1):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '#':
                d.rectangle([x + i * s, y + j * s, x + i * s + s - 1, y + j * s + s - 1], fill=col)

Z = ['####', '..#.', '.#..', '####']
EXC = ['.##.', '.##.', '.##.', '.##.', '.##.', '....', '.##.']
QEX = ['.###.', '#...#', '...#.', '..#..', '..#..', '.....', '..#..']

def bubble(d, x, y, rows, col=(200, 30, 30, 255)):
    w = len(rows[0]) * 2 + 8; h = len(rows) * 2 + 8
    d.rounded_rectangle([x - w // 2, y - h, x + w // 2, y], radius=4, fill=(255, 255, 250, 255), outline=OUTLINE)
    d.polygon([(x - 3, y), (x + 3, y), (x, y + 5)], fill=(255, 255, 250, 255))
    d.line([(x - 3, y + 1), (x, y + 5)], fill=OUTLINE); d.line([(x + 3, y + 1), (x, y + 5)], fill=OUTLINE)
    glyph(d, x - len(rows[0]), y - h + 4, rows, col, 2)

def sweat(d, x, y):
    d.polygon([(x, y - 3), (x + 2, y + 1), (x - 2, y + 1)], fill=hx('#9ad8ff'))
    d.ellipse([x - 2, y - 1, x + 2, y + 3], fill=hx('#9ad8ff'))
    d.point((x - 1, y), fill=(255, 255, 255, 255))

# ---------------------------------------------------------------- 바탕
def bg_gate(f, lit=0.0):
    img = Image.new('RGBA', (W, H), hx('#0d1430')); d = ImageDraw.Draw(img)
    for y in range(0, 70):                                        # 밤하늘
        c = shade(hx('#1a2550'), 0.55 + y / 140); d.line([(0, y), (W, y)], fill=c)
    rng = np.random.RandomState(4)
    for i in range(36):
        sx, sy = rng.randint(0, W), rng.randint(0, 60)
        tw = (i + f // 3) % 7 == 0
        d.point((sx, sy), fill=(255, 255, 220, 255) if not tw else (140, 150, 190, 255))
    d.ellipse([196, 10, 210, 24], fill=hx('#f4ecc0')); d.ellipse([200, 8, 214, 22], fill=hx('#1a2550'))   # 초승달
    # 성벽
    wall = hx('#56566a'); wallD = hx('#43435a')
    d.rectangle([0, 46, W, GROUND], fill=wall)
    for y in range(46, GROUND, 8):
        off = 0 if (y // 8) % 2 else 6
        for x in range(-12 + off, W, 12):
            d.rectangle([x, y, x + 11, y + 7], outline=wallD)
    for x in range(0, W, 16):                                      # 성가퀴
        d.rectangle([x, 38, x + 9, 46], fill=wall, outline=wallD)
    # 성문 (아치)
    gx0, gx1 = 164, 212
    d.rectangle([gx0 - 4, 44, gx1 + 4, GROUND], fill=hx('#6a6a80'))
    d.rectangle([gx0, 70, gx1, GROUND], fill=hx('#07070c'))
    d.ellipse([gx0, 50, gx1, 90], fill=hx('#07070c'))
    for x in range(gx0 + 4, gx1 - 2, 7):                           # 내려진 쇠창살 끝
        d.line([(x, 52 if abs(x - (gx0 + gx1) / 2) < 14 else 60), (x, 64)], fill=hx('#2a2a34'))
    d.line([(gx0 + 2, 64), (gx1 - 2, 64)], fill=hx('#2a2a34'))
    # 횃불
    tx, ty = 150, 74
    d.rectangle([tx - 1, ty, tx + 1, ty + 8], fill=hx('#4a3020'))
    fl = [(0, -6), (1, -7), (0, -8), (-1, -7)][f % 4]
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    for r, a in ((26, 26), (18, 34), (11, 46)):
        gd.ellipse([tx - r, ty - 4 - r, tx + r, ty - 4 + r], fill=(255, 170, 60, a))
    img.alpha_composite(glow)
    d.polygon([(tx - 3, ty), (tx + 3, ty), (tx + fl[0], ty + fl[1])], fill=hx('#ffb030'))
    d.polygon([(tx - 1, ty), (tx + 1, ty), (tx + fl[0], ty + fl[1] + 3)], fill=hx('#fff0a0'))
    # 땅 (돌길)
    d.rectangle([0, GROUND, W, H], fill=hx('#2e2a30'))
    for y in range(GROUND + 2, H, 5):
        for x in range((y * 7) % 10 - 10, W, 10):
            d.line([(x, y), (x + 6, y)], fill=hx('#3a3540'))
    return img

def bg_stage(mood):
    """설득·청혼: 어느 곳에서나 어울리게 빛이 고인 무대. mood: 'gold' | 'blue' | 'rose'"""
    top, bot, spot = {'gold': ('#2a1a14', '#5a3a20', (255, 214, 120)), 'blue': ('#10141e', '#24304a', (150, 180, 230)),
                      'rose': ('#2a1424', '#6a3046', (255, 190, 200))}[mood]
    img = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(img)
    a, b = hx(top), hx(bot)
    for y in range(H):
        t = y / H; d.line([(0, y), (W, y)], fill=tuple(int(lerp(a[i], b[i], t)) for i in range(3)) + (255,))
    # 바닥
    d.rectangle([0, GROUND - 2, W, H], fill=shade(hx(bot), 0.7))
    for x in range(-40, W + 40, 18):
        d.line([(x, H), (W / 2 + (x - W / 2) * 0.45, GROUND - 2)], fill=shade(hx(bot), 0.6))
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    for r, al in ((70, 18), (52, 22), (36, 28)):
        gd.ellipse([W / 2 - r, GROUND - r * 0.18 - 2, W / 2 + r, GROUND + r * 0.18 + 2], fill=spot + (al,))
    for r, al in ((90, 10), (70, 12), (50, 14)):
        gd.polygon([(W / 2 - 18, 0), (W / 2 + 18, 0), (W / 2 + r, GROUND), (W / 2 - r, GROUND)], fill=spot + (al // 2,))
    img.alpha_composite(glow)
    return img

def tint(img, col, k):
    ov = Image.new('RGBA', img.size, col[:3] + (int(255 * k),)); img.alpha_composite(ov)

# ---------------------------------------------------------------- 걸음
def tiptoe(x, ph, face=1, hood=True):
    """발끝 걸음 (몸을 낮추고 살금살금) — ph: 0~1 걸음 단계"""
    s = math.sin(ph * 2 * math.pi)
    return pose(x=x, h=30 + abs(s) * 1.2, face=face, lean=22, head=-14, hood=hood,
                fth=18 + s * 22, fsh=-14 + s * 18, bth=18 - s * 22, bsh=-14 - s * 18,
                fua=50, ffa=110, bua=-25 + s * 10, bfa=20, eyes='open', mouth='flat')

def run(x, ph, face=-1, hood=True):
    s = math.sin(ph * 2 * math.pi)
    return pose(x=x, h=32 + abs(s) * 2, face=face, lean=24, head=-10, hood=hood,
                fth=s * 40, fsh=s * 30 - 30, bth=-s * 40, bsh=-s * 30 - 30,
                fua=-s * 50, ffa=-s * 50 + 60, bua=s * 50, bfa=s * 50 + 60, eyes='wide', mouth='open')

# ---------------------------------------------------------------- 장면
def guard_pose(x, mode, t=0):
    if mode == 'doze':
        bob = math.sin(t * 0.35) * 1.2
        return pose(x=x, face=1, lean=-4, head=34 + bob * 3, eyes='closed', fth=4, fsh=2, bth=-6, bsh=-4,
                    fua=6, ffa=10, bua=-16, bfa=-8, item2='halberd')
    if mode == 'alert':
        return pose(x=x, face=-1, lean=4, head=-6, eyes='wide', mouth='open', fth=8, fsh=2, bth=-10, bsh=-6,
                    fua=110, ffa=150, bua=50, bfa=96, item='lantern', item2='halberd')
    if mode == 'point':
        return pose(x=x, face=-1, lean=10, head=-4, eyes='wide', mouth='open', fth=24, fsh=6, bth=-18, bsh=-10,
                    fua=110, ffa=150, bua=78, bfa=88, item='lantern', item2='halberd_lv')

def scene_sneak(ok, look):
    frames = []
    N = 46 if ok else 48
    GX = 136
    for f in range(N):
        img = bg_gate(f); d = ImageDraw.Draw(img)
        # 제독의 자리
        if ok:
            x = lerp(-14, 196, f / 38) if f < 38 else 196
            P = tiptoe(x, f / 8)
            P['alpha'] = 1 if x < 176 else max(0, 1 - (x - 176) / 18)
            if f >= 38: P['alpha'] = 0
            gmode = 'doze'
        else:
            if f < 18:
                x = lerp(-14, 70, f / 18); P = tiptoe(x, f / 8)
                gmode = 'doze'
            elif f < 24:
                # 놀라 펄쩍
                k = (f - 18) / 6
                P = pose(x=70, h=33 + math.sin(k * math.pi) * 7, face=1, lean=-8, head=-6, hood=True, eyes='wide', mouth='open',
                         fth=-10, fsh=-4, bth=10, bsh=8, fua=128, ffa=172, bua=-150, bfa=-172, sweat=1)
                gmode = 'alert'
            else:
                P = pose(x=68, face=1, lean=-6, head=-4, hood=True, eyes='wide', mouth='open', fth=-6, fsh=-2, bth=8, bsh=6,
                         fua=128, ffa=172, bua=-150, bfa=-172, sweat=1)
                gmode = 'alert' if f < 30 else 'point'
        G = guard_pose(GX if (ok or f < 30) else GX - min(10, (f - 30) * 1.2), gmode, f)
        # 등불 빛
        if not ok and f >= 18:
            lt = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lt)
            gx = G['x'] - 16
            ld.polygon([(gx, GROUND - 52), (40, GROUND - 74), (40, GROUND + 4), (gx, GROUND - 44)], fill=(255, 220, 120, 70))
            ld.ellipse([46, GROUND - 6, 94, GROUND + 6], fill=(255, 230, 140, 60))
            img.alpha_composite(lt)
        draw_person(img, G, 'guard')
        if P['alpha'] > 0:
            draw_person(img, P, look)
        d = ImageDraw.Draw(img)
        if gmode == 'doze':
            for k in range(3):
                ph = ((f + k * 6) % 18) / 18
                zx = GX + 10 + ph * 12 + k * 3; zy = GROUND - 64 - ph * 20
                if ph < 0.85: glyph(d, int(zx), int(zy), Z, (210, 220, 255, 255), 1 if k else 2)
        if not ok and f >= 18:
            bubble(d, int(G['x']) + 2, GROUND - 74, EXC)
            if f >= 20:
                hd = (P['x'] + 8, GROUND - 70)
                sweat(d, hd[0] + (f % 2), hd[1] + (f % 6))
                sweat(d, P['x'] - 8, GROUND - 66 + ((f + 3) % 6))
        if ok and f >= 38:
            for k in range(4):
                r = 2 + ((f - 38 + k * 2) % 6) // 2
                sparkle(d, 188 + (k * 7) % 16, GROUND - 40 - (k * 11) % 26, r)
        frames.append(img)
    return frames

def scene_win(look):
    frames = []
    N = 34
    keys = [
        (0, pose(fua=6, ffa=10, bua=-6, bfa=-4)),
        (5, pose(h=29, lean=8, head=6, fth=30, fsh=-20, bth=34, bsh=-16, fua=-20, ffa=40, bua=-30, bfa=10, mouth='flat')),
        (10, pose(h=50, lean=-4, head=-14, fth=-6, fsh=-30, bth=10, bsh=-24, fua=110, ffa=172, bua=-30, bfa=0, mouth='open', eyes='closed')),
        (14, pose(h=33, lean=0, head=-12, fth=-4, fsh=0, bth=6, bsh=2, fua=108, ffa=172, bua=-14, bfa=-6, mouth='open', eyes='closed')),
        (17, pose(h=30, lean=8, head=0, fth=24, fsh=-16, bth=28, bsh=-12, fua=120, ffa=160, bua=-24, bfa=8, mouth='smile')),
        (21, pose(h=43, lean=-4, head=-14, fth=-4, fsh=-24, bth=14, bsh=-18, fua=112, ffa=174, bua=-40, bfa=-10, mouth='open', eyes='closed')),
        (25, pose(h=33, lean=-2, head=-14, fth=-4, fsh=0, bth=6, bsh=2, fua=108, ffa=172, bua=-10, bfa=40, mouth='open', eyes='closed')),
        (N - 1, pose(h=33, lean=-2, head=-12, fth=-4, fsh=0, bth=6, bsh=2, fua=108, ffa=172, bua=-10, bfa=40, mouth='smile', eyes='closed')),
    ]
    rng = np.random.RandomState(7)
    conf = [(rng.randint(0, W), rng.randint(-60, 0), rng.uniform(1.2, 2.4), rng.randint(0, 5)) for _ in range(40)]
    CC = [hx('#ffd84a'), hx('#ff6a6a'), hx('#7ad0ff'), hx('#9aff8a'), hx('#ffffff')]
    for f in range(N):
        img = bg_stage('gold'); d = ImageDraw.Draw(img)
        P = track(keys, f)
        # 그림자
        sh = max(6, 16 - (P['h'] - 33) * 0.5)
        d.ellipse([P['x'] - sh, GROUND - 2, P['x'] + sh, GROUND + 2], fill=(0, 0, 0, 90))
        draw_person(img, P, look)
        d = ImageDraw.Draw(img)
        if f in (14, 15, 16, 25, 26, 27):
            k = f - (14 if f < 20 else 25)
            for s in (-1, 1):
                d.ellipse([P['x'] + s * (10 + k * 4) - 3, GROUND - 4 - k, P['x'] + s * (10 + k * 4) + 3, GROUND + 1 - k], fill=(230, 210, 170, 160 - k * 40))
        if f >= 10:
            for i, (cx, cy, sp, ci) in enumerate(conf):
                y = cy + (f - 10) * sp * 3
                if 0 <= y < GROUND:
                    x = cx + math.sin((f + i) * 0.5) * 2
                    d.rectangle([x, y, x + 1, y + (1 if (f + i) % 2 else 0)], fill=CC[ci])
            for k in range(5):
                ang = k * 72 + f * 9
                r = 26 + (k % 2) * 6
                sparkle(d, P['x'] + math.cos(math.radians(ang)) * r, GROUND - P['h'] - 30 + math.sin(math.radians(ang)) * r * 0.6, 2 + ((f + k) % 4) // 2)
        frames.append(img)
    return frames

def scene_lose(look):
    frames = []
    N = 36
    keys = [
        (0, pose(fua=10, ffa=30, bua=-6, bfa=-4, mouth='flat')),
        (3, pose(fua=10, ffa=30, bua=-6, bfa=-4, mouth='flat')),
        (6, pose(h=34, lean=-8, head=-10, fua=30, ffa=80, bua=20, bfa=70, eyes='wide', mouth='open')),
        (12, pose(h=32, lean=10, head=24, fua=4, ffa=0, bua=-2, bfa=0, eyes='closed', mouth='sad', fth=4, fsh=4, bth=8, bsh=6)),
        (19, pose(h=20, lean=20, head=30, fth=80, fsh=-6, bth=70, bsh=-10, fua=10, ffa=6, bua=6, bfa=4, eyes='closed', mouth='sad')),
        (24, pose(h=17, lean=62, head=14, fth=4, fsh=-90, bth=-2, bsh=-92, fua=22, ffa=20, bua=16, bfa=16, eyes='closed', mouth='sad')),
        (28, pose(h=17, lean=84, head=18, fth=0, fsh=-92, bth=-6, bsh=-94, fua=4, ffa=-2, bua=0, bfa=-6, eyes='closed', mouth='sad')),
        (N - 1, pose(h=17, lean=86, head=22, fth=0, fsh=-92, bth=-6, bsh=-94, fua=2, ffa=-4, bua=-2, bfa=-8, eyes='closed', mouth='sad')),
    ]
    for f in range(N):
        img = bg_stage('blue'); d = ImageDraw.Draw(img)
        if f > 10: tint(img, (8, 10, 24), min(0.45, (f - 10) * 0.025))
        P = track(keys, f)
        d.ellipse([P['x'] - 16, GROUND - 2, P['x'] + 16, GROUND + 2], fill=(0, 0, 0, 90))
        draw_person(img, P, look)
        d = ImageDraw.Draw(img)
        if 6 <= f < 11:
            sweat(d, P['x'] + 16, GROUND - P['h'] - 44 + (f - 6))
        if f >= 14:
            # 머리 위의 어둑한 줄 (낙담)
            hxp = P['x'] + 14 if f >= 24 else P['x'] + 4
            for k in range(5):
                ln = 6 + ((f + k * 3) % 6)
                x = hxp - 10 + k * 5
                d.line([(x, GROUND - 74 + k % 2 * 3), (x, GROUND - 74 + ln + k % 2 * 3)], fill=(120, 130, 170, 200))
            if f >= 22:
                cx = hxp; cy = GROUND - 84
                for dx, r in ((-6, 5), (0, 7), (7, 5)):
                    d.ellipse([cx + dx - r, cy - r * 0.7, cx + dx + r, cy + r * 0.7], fill=(70, 76, 96, 255))
                for k in range(3):
                    ry = cy + 6 + ((f * 2 + k * 5) % 14)
                    d.line([(cx - 6 + k * 6, ry), (cx - 6 + k * 6, ry + 2)], fill=(140, 170, 230, 255))
        frames.append(img)
    return frames

def scene_propose(look):
    frames = []
    N = 50
    MX, LX = 100, 150
    keys = [
        (0, pose(x=MX - 8, fua=10, ffa=20, bua=-6, bfa=-4)),
        (6, pose(x=MX, fua=10, ffa=20, bua=-6, bfa=-4, fth=18, fsh=0, bth=-14, bsh=-6)),
        (13, pose(x=MX, h=22, lean=6, head=-8, fth=86, fsh=0, bth=6, bsh=-86, fua=24, ffa=40, bua=-4, bfa=10)),
        (19, pose(x=MX, h=22, lean=4, head=-16, fth=86, fsh=0, bth=6, bsh=-86, fua=96, ffa=120, bua=-4, bfa=10, item='ring')),
        (N - 1, pose(x=MX, h=22, lean=2, head=-16, fth=86, fsh=0, bth=6, bsh=-86, fua=100, ffa=124, bua=-4, bfa=10, item='ring', mouth='smile')),
    ]
    lkeys = [
        (0, pose(x=LX, face=-1, fua=10, ffa=30, bua=-8, bfa=20)),
        (20, pose(x=LX, face=-1, fua=10, ffa=30, bua=-8, bfa=20, head=10)),
        (25, pose(x=LX, face=-1, lean=-4, head=4, fua=40, ffa=170, bua=36, bfa=168, eyes='wide', mouth='open', blush=True)),
        (32, pose(x=LX, face=-1, lean=-4, head=4, fua=40, ffa=170, bua=36, bfa=168, eyes='closed', mouth='smile', blush=True)),
        (36, pose(x=LX, face=-1, lean=0, head=22, fua=40, ffa=170, bua=36, bfa=168, eyes='closed', mouth='smile', blush=True)),
        (40, pose(x=LX, face=-1, lean=-2, head=0, fua=40, ffa=170, bua=36, bfa=168, eyes='closed', mouth='smile', blush=True)),
        (44, pose(x=LX, face=-1, lean=0, head=20, fua=40, ffa=170, bua=36, bfa=168, eyes='closed', mouth='smile', blush=True)),
        (N - 1, pose(x=LX, face=-1, lean=-2, head=2, fua=40, ffa=170, bua=36, bfa=168, eyes='closed', mouth='smile', blush=True)),
    ]
    rng = np.random.RandomState(11)
    hearts = [(rng.uniform(100, 160), rng.uniform(0, 1), rng.uniform(3, 5), rng.randint(0, 3)) for _ in range(9)]
    HC = [hx('#ff5a7a'), hx('#ff8aa0'), hx('#ffb0c4')]
    for f in range(N):
        img = bg_stage('rose'); d = ImageDraw.Draw(img)
        P = track(keys, f); Q = track(lkeys, f)
        for x in (P['x'], Q['x']):
            d.ellipse([x - 14, GROUND - 2, x + 14, GROUND + 2], fill=(0, 0, 0, 80))
        draw_person(img, Q, 'lady')
        hands = draw_person(img, P, look)
        d = ImageDraw.Draw(img)
        if f >= 19:
            hd = hands['f'][1]
            sparkle(d, hd[0] + 2, hd[1] - 12, 2 + (f % 4) // 2, (255, 255, 255, 255))
        if f >= 28:
            for i, (hx0, ph, sz, ci) in enumerate(hearts):
                t = ((f - 28) / 22 + ph) % 1.0
                if f - 28 < ph * 22: continue
                y = GROUND - 50 - t * 70
                x = hx0 + math.sin((t * 6) + i) * 4
                heart(d, x, y, sz, HC[ci])
        if f >= 36:
            s = min(9, 4 + (f - 36) * 0.8)
            heart(d, (MX + LX) / 2 + 2, GROUND - 82, s + math.sin(f * 0.6) * 0.6, hx('#ff3a64'))
        frames.append(img)
    return frames

# ---------------------------------------------------------------- 저장
def save_gif(frames, path, hold=900):
    big = [fr.convert('RGB').resize((W * SCALE, H * SCALE), Image.NEAREST) for fr in frames]
    pal = [b.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for b in big]
    durs = [MS] * (len(pal) - 1) + [hold]
    # loop 를 주지 않으면 한 번만 돌고 마지막 장면에 멈춘다
    pal[0].save(path, save_all=True, append_images=pal[1:], duration=durs, optimize=False, disposal=1)
    return os.path.getsize(path)

def sheet(frames, path, cols=10):
    rows = (len(frames) + cols - 1) // cols
    s = Image.new('RGB', (cols * W, rows * H), (0, 0, 0))
    for i, fr in enumerate(frames):
        s.paste(fr.convert('RGB'), ((i % cols) * W, (i // cols) * H))
    s.save(path)

def build():
    os.makedirs(OUT, exist_ok=True)
    jobs = []
    for look, suf in (('admiral', ''), ('admiral_f', '_f')):
        jobs += [('sneak_ok' + suf, lambda l=look: scene_sneak(True, l)), ('sneak_fail' + suf, lambda l=look: scene_sneak(False, l)),
                 ('win' + suf, lambda l=look: scene_win(l)), ('lose' + suf, lambda l=look: scene_lose(l)), ('propose' + suf, lambda l=look: scene_propose(l))]
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    prev = os.path.join(os.path.dirname(__file__), 'preview')
    for name, fn in jobs:
        if only and name not in only: continue
        fr = fn()
        n = save_gif(fr, os.path.join(OUT, name + '.gif'))
        print('%-16s %3d장 %6.1fKB' % (name, len(fr), n / 1024))
        if '--sheet' in sys.argv:
            os.makedirs(prev, exist_ok=True); sheet(fr, os.path.join(prev, name + '.png'))

if __name__ == '__main__':
    build()
