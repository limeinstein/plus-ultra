#!/usr/bin/env python3
"""36종 선박의 항해·해전용 8방향 동작 시트를 만든다.

Pillow만 사용하며 게임 실행에는 Python이 필요하지 않다. 각 시트는 45도 간격
8방향과 정박 3장·표류 5장·질주 8장을 담는다. 모든 조각은 같은 수면 피벗을
쓰며 셀 가장자리에 투명 여백을 남겨 돛·선수·물보라가 이웃 조각을 침범하지
않는다. 선종별 실루엣과 범장 차이는 유지하되, 짙은 월넛·황동·아이보리 돛의
한 가지 재질과 조명 규칙으로 묶는다.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CELL = 224
SS = 3
COLS = 8
DIRS = 8
ANCHOR = (112, 139)
BASE_LEN = 158
ACTIONS = {
    "idle": {"row": 0, "col": 0, "frames": 3, "fps": 2.2},
    "drift": {"row": 0, "col": 3, "frames": 5, "fps": 4.0},
    "dash": {"row": DIRS, "col": 0, "frames": 8, "fps": 11.5},
}
OUT = ROOT / "images" / "ships-nav"
META = ROOT / "js" / "data" / "shipart.js"
CONTACT = ROOT / "docs" / "art" / "ships-nav-contact.png"


# 장식이 아니라 실제 판독성에 영향을 주는 선종별 구조 차이. 값이 없는 항목은
# 아래 공통 규칙을 따른다. form: 선체 평면형, stern/bow: 상부구조, rig: 범장 세부.
P = {
    "barca":       dict(scale=.76, beam=.76, free=.62, form="open", stern="open", rig="single", rail=0),
    "cog":         dict(scale=.84, beam=1.22, free=1.18, form="bluff", stern="castle", rig="cog", clinker=1),
    "hulk":        dict(scale=.96, beam=1.22, free=1.28, form="round", stern="castle", bow="castle", rig="hulk", clinker=1),
    "caravel":     dict(scale=.88, beam=.78, free=.75, form="fine", stern="quarter", rig="lateen"),
    "lcaravel":    dict(scale=.96, beam=.84, free=.86, form="fine", stern="quarter", bow="beak", rig="mixed"),
    "pinnace":     dict(scale=.78, beam=.72, free=.62, form="fine", stern="open", bow="beak", rig="pinnace", oars=5),
    "carrack":     dict(scale=1.00, beam=1.08, free=1.25, form="round", stern="high", bow="castle", rig="carrack", guns=4),
    "lcarrack":    dict(scale=1.04, beam=1.12, free=1.34, form="round", stern="high", bow="castle", rig="carrack", guns=5),
    "hcarrack":    dict(scale=1.07, beam=1.15, free=1.42, form="round", stern="tower", bow="castle", rig="carrack", guns=6),
    "galleon":     dict(scale=1.04, beam=.91, free=1.04, form="fine", stern="gallery", bow="beak", rig="galleon", guns=6),
    "lgalleon":    dict(scale=1.08, beam=.96, free=1.14, form="fine", stern="gallery", bow="beak", rig="galleon", guns=8),
    "fluyt":       dict(scale=1.00, beam=1.08, free=1.12, form="pear", stern="round", bow="round", rig="fluyt", guns=2),
    "frigate":     dict(scale=1.08, beam=.75, free=.78, form="fine", stern="gallery", bow="beak", rig="frigate", guns=7),
    "tartane":     dict(scale=.76, beam=.82, free=.63, form="fine", stern="open", rig="lateen"),
    "galley":      dict(scale=1.00, beam=.90, free=.58, form="needle", stern="quarter", bow="ram", rig="galley", oars=11),
    "greatgalley": dict(scale=1.06, beam=1.03, free=.72, form="needle", stern="castle", bow="ram", rig="galley", oars=13),
    "galleass":    dict(scale=1.08, beam=1.16, free=.91, form="needle", stern="castle", bow="ram", rig="galleass", oars=14, guns=6),
    "fusta":       dict(scale=.91, beam=.72, free=.48, form="needle", stern="open", bow="ram", rig="galley", oars=9),
    "xebec":       dict(scale=1.02, beam=.82, free=.62, form="needle", stern="quarter", bow="beak", rig="xebec", oars=10, guns=3),
    "dhow":        dict(scale=.91, beam=.91, free=.82, form="dhow", stern="transom", bow="raked", rig="dhow"),
    "sambuk":      dict(scale=.78, beam=.78, free=.67, form="dhow", stern="open", bow="raked", rig="dhow"),
    "baghlah":     dict(scale=1.02, beam=1.09, free=1.05, form="dhow", stern="high", bow="raked", rig="baghlah", guns=3),
    "parau":       dict(scale=.84, beam=.70, free=.45, form="needle", stern="open", bow="raked", rig="lateen", oars=8),
    "jong":        dict(scale=1.05, beam=1.02, free=1.16, form="jong", stern="high", bow="raked", rig="jong", guns=3),
    "korakora":    dict(scale=.91, beam=.70, free=.38, form="canoe", stern="raised", bow="raised", rig="korakora", oars=12, outrigger=1),
    "junk":        dict(scale=.88, beam=.92, free=.84, form="junk", stern="junk", bow="square", rig="junk"),
    "shachuan":    dict(scale=.95, beam=.84, free=.72, form="sand", stern="junk", bow="flat", rig="junk"),
    "ljunk":       dict(scale=1.03, beam=1.04, free=1.03, form="junk", stern="high", bow="square", rig="junk", guns=4),
    "baochuan":    dict(scale=1.10, beam=1.18, free=1.25, form="junk", stern="tower", bow="square", rig="treasure", guns=4),
    "maengseon":   dict(scale=.91, beam=.94, free=.64, form="box", stern="open", bow="flat", rig="korean", oars=8),
    "panokseon":   dict(scale=.98, beam=1.02, free=1.05, form="box", stern="panok", bow="flat", rig="korean", oars=9, guns=5),
    "geobukseon":  dict(scale=.93, beam=.98, free=.88, form="box", stern="turtle", bow="dragon", rig="korean", oars=9, guns=5),
    "kobaya":      dict(scale=.80, beam=.73, free=.42, form="needle", stern="open", bow="raked", rig="japanese", oars=8),
    "sekibune":    dict(scale=.93, beam=.88, free=.68, form="box", stern="quarter", bow="raked", rig="japanese", oars=10),
    "atakebune":   dict(scale=1.03, beam=1.04, free=1.20, form="box", stern="atake", bow="flat", rig="japanese", oars=12, guns=5),
    "balsa":       dict(scale=.78, beam=1.12, free=.20, form="raft", stern="open", rig="raft"),
}


def ships():
    src = (ROOT / "js" / "data" / "ships.js").read_text(encoding="utf-8")
    src = src[src.index("G.SHIP_TYPES = ["):src.index("\n  ];", src.index("G.SHIP_TYPES = ["))]
    out = []
    for m in re.finditer(r"\{ id: '(\w+)', name: '([^']+)'(.*?)\}(?:,|\s*$)", src, re.S):
        body = m.group(3)
        def one(key, default=None):
            q = re.search(r"\b" + key + r":\s*'([^']+)'", body)
            return q.group(1) if q else default
        def num(key, default=0.0):
            q = re.search(r"\b" + key + r":\s*([0-9.]+)", body)
            return float(q.group(1)) if q else default
        sm = re.search(r"\bsails:\s*\[([^]]*)\]", body)
        tr = re.search(r"\btraits:\s*\[([^]]*)\]", body)
        out.append({
            "id": m.group(1), "name": m.group(2), "cult": one("cult", "eu"),
            "hull": one("hull", "west"), "cap": num("cap", 100),
            "len": num("len", 1),
            "sails": re.findall(r"'(sq|lat|bat)'", sm.group(1) if sm else ""),
            "traits": re.findall(r"'(\w+)'", tr.group(1) if tr else ""),
        })
    if len(out) != 36:
        raise RuntimeError(f"선박 36종을 기대했지만 {len(out)}종을 읽었습니다")
    return out


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def shade(c, k, a=255):
    if isinstance(c, str):
        c = rgb(c)
    return tuple(max(0, min(255, round(v * k))) for v in c[:3]) + (a,)


PALETTES = {
    # 첫 갤리온 기준 그림의 월넛·꿀빛 목재를 공통축으로 두고 문화권마다
    # 채도와 밝기만 조금 달리한다. 세 값은 그늘·외판·갑판 순서다.
    "west": ("#2d180d", "#74401f", "#bd8246"),
    "galley": ("#32160d", "#7c3d20", "#c27b3d"),
    "dhow": ("#351d0e", "#875129", "#c9924f"),
    "jong": ("#2f180e", "#71391f", "#b8753c"),
    "outrigger": ("#3a2111", "#84532c", "#c79454"),
    "junk": ("#2c160d", "#68351f", "#ad6939"),
    "kr": ("#352313", "#77512f", "#b78651"),
    "panok": ("#302015", "#6f4a2d", "#b17d49"),
    "turtle": ("#29251d", "#5e573e", "#9d8655"),
    "jp": ("#251b14", "#59412b", "#947047"),
    "atake": ("#211710", "#503724", "#87603e"),
    "raft": ("#463019", "#8c6334", "#c99a59"),
}
BRASS = rgb("#c78b35")
BRASS_HI = rgb("#f0c069")
IVORY = rgb("#f4e7c5")


class Painter:
    def __init__(self, ship, ang):
        self.s = ship
        self.ang = ang
        self.im = Image.new("RGBA", (CELL * SS, CELL * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im, "RGBA")
        self.ca, self.sa = math.cos(ang), math.sin(ang)

    def p(self, x, y, z=0):
        wx = x * self.ca - y * self.sa
        wy = x * self.sa + y * self.ca
        return ((ANCHOR[0] + wx) * SS, (ANCHOR[1] - wy * 0.52 - z * 0.92) * SS)

    def poly(self, pts, fill, outline=None, width=1):
        q = [self.p(*v) for v in pts]
        self.d.polygon(q, fill=fill)
        if outline:
            self.d.line(q + [q[0]], fill=outline, width=max(1, round(width * SS)), joint="curve")

    @staticmethod
    def _mix(a, b, t):
        return tuple(a[i] * (1 - t) + b[i] * t for i in range(len(a)))

    @classmethod
    def _quad(cls, a, b, bend=(0, 0, 0), steps=7):
        """두 점 사이를 완만한 이차 곡선으로 잇는다."""
        c = tuple((a[i] + b[i]) * .5 + bend[i] for i in range(3))
        out = []
        for n in range(steps):
            t = n / max(1, steps - 1)
            u = 1 - t
            out.append(tuple(u * u * a[i] + 2 * u * t * c[i] + t * t * b[i] for i in range(3)))
        return out

    @classmethod
    def _soft_ring(cls, pts, passes=2):
        """닫힌 외곽선을 차이킨 곡선으로 다듬는다. 원래 피벗은 바꾸지 않는다."""
        out = list(pts)
        for _ in range(passes):
            curved = []
            for i, a in enumerate(out):
                b = out[(i + 1) % len(out)]
                curved.append(cls._mix(a, b, .24))
                curved.append(cls._mix(a, b, .76))
            out = curved
        return out

    def smooth_poly(self, pts, fill, outline=None, width=1, passes=2):
        q = self._soft_ring(pts, passes)
        self.poly(q, fill, outline, width)
        return q

    def curve_line(self, a, b, bend=(0, 0, 0), fill=(255, 255, 255, 255), width=1, steps=8):
        self.line(self._quad(a, b, bend, steps), fill, width)

    def sail_quad(self, pts, fill, outline, width=1, billow=3.0):
        """팽팽한 사각형 대신 바람을 머금은 네 변의 돛을 그린다."""
        a, b, c, d = pts
        ring = []
        ring += self._quad(a, b, (billow * .08, 0, -billow * .06))[:-1]
        ring += self._quad(b, c, (billow * .34, 0, 0))[:-1]
        ring += self._quad(c, d, (billow, 0, -billow * .24))[:-1]
        ring += self._quad(d, a, (billow * .34, 0, 0))[:-1]
        self.poly(ring, fill, outline, width)
        return ring

    def sail_tri(self, pts, fill, outline, width=1, billow=3.0):
        """삼각돛의 아랫배와 뒤 가장자리를 둥글게 만든다."""
        a, b, c = pts
        ring = []
        ring += self._quad(a, b, (billow * .20, 0, -billow * .04))[:-1]
        ring += self._quad(b, c, (billow, 0, -billow * .18))[:-1]
        ring += self._quad(c, a, (billow * .28, 0, 0))[:-1]
        self.poly(ring, fill, outline, width)
        return ring

    def line(self, pts, fill, width=1):
        self.d.line([self.p(*v) for v in pts], fill=fill, width=max(1, round(width * SS)), joint="curve")

    def ellipse3(self, x, y, z, rx, ry, fill, outline=None):
        px, py = self.p(x, y, z)
        box = (px - rx * SS, py - ry * SS, px + rx * SS, py + ry * SS)
        self.d.ellipse(box, fill=fill, outline=outline, width=max(1, SS))

    def box(self, x0, x1, y0, y1, z0, z1, col):
        """선실과 성루를 모서리가 둥근 목조 구조물로 그린다."""
        rx = min(abs(x1 - x0) * .14, 4.8)
        ry = min(abs(y1 - y0) * .16, 3.8)
        base = [(x0+rx,y0,z0),(x1-rx,y0,z0),(x1,y0+ry,z0),(x1,y1-ry,z0),
                (x1-rx,y1,z0),(x0+rx,y1,z0),(x0,y1-ry,z0),(x0,y0+ry,z0)]
        base = self._soft_ring(base, 1)
        faces = []
        for i, a in enumerate(base):
            b = base[(i + 1) % len(base)]
            pts = [a, b, (b[0], b[1], z1), (a[0], a[1], z1)]
            dx, dy = b[0] - a[0], b[1] - a[1]
            k = .64 + .16 * (.5 + .5 * math.sin(math.atan2(dy, dx) - .65))
            faces.append((sum(self.p(*v)[1] for v in pts) / 4, pts, k))
        for _, pts, k in sorted(faces):
            self.poly(pts, shade(col, k))
        top = [(x, y, z1) for x, y, _ in base]
        self.poly(top, shade(col, 1.14), shade(col, .53), .62)
        self.line(top + [top[0]], shade(col, 1.34, 150), .38)

    def finish(self):
        im = self.im.resize((CELL, CELL), Image.Resampling.LANCZOS)
        # 축소한 뒤 색과 알파를 다시 계단화하지 않는다. 반투명 가장자리의 모든
        # 단계를 보존해야 38~70px 게임 화면에서도 돛과 선체 곡선이 매끈하다.
        return im


def dims(s):
    h = s["hull"]
    q = P[s["id"]]
    L = 150 * min(1.10, max(.90, s.get("len", 1))) * q.get("scale", 1)
    ratios = {"galley": .22, "outrigger": .17, "dhow": .34, "jong": .39,
              "junk": .41, "kr": .40, "panok": .43, "turtle": .42,
              "jp": .35, "atake": .42, "raft": .45}
    W = L * ratios.get(h, .34)
    W *= q.get("beam", 1)
    H = (10 + min(8, math.sqrt(s["cap"]) * .28)) * q.get("free", 1)
    return L, W, H


def outline(L, W, h, form):
    if form in ("needle", "canoe"):
        return [(L*.57,0),(L*.34,-W*.52),(-L*.38,-W*.40),(-L*.53,-W*.24),(-L*.53,W*.24),(-L*.38,W*.40),(L*.34,W*.52)]
    if form == "fine":
        return [(L*.61,0),(L*.29,-W*.48),(-L*.35,-W*.49),(-L*.50,-W*.28),(-L*.50,W*.28),(-L*.35,W*.49),(L*.29,W*.48)]
    if form == "bluff":
        return [(L*.49,0),(L*.31,-W*.54),(-L*.34,-W*.57),(-L*.49,-W*.41),(-L*.49,W*.41),(-L*.34,W*.57),(L*.31,W*.54)]
    if form == "round":
        return [(L*.51,0),(L*.34,-W*.48),(-L*.26,-W*.57),(-L*.50,-W*.35),(-L*.50,W*.35),(-L*.26,W*.57),(L*.34,W*.48)]
    if form == "pear":
        return [(L*.54,0),(L*.32,-W*.42),(-L*.20,-W*.58),(-L*.48,-W*.42),(-L*.48,W*.42),(-L*.20,W*.58),(L*.32,W*.42)]
    if form == "dhow":
        return [(L*.65,0),(L*.29,-W*.43),(-L*.31,-W*.51),(-L*.50,-W*.31),(-L*.50,W*.31),(-L*.31,W*.51),(L*.29,W*.43)]
    if form in ("junk", "sand", "jong", "box"):
        return [(L*.51,-W*.24),(L*.56,0),(L*.51,W*.24),(L*.25,W*.5),(-L*.48,W*.46),(-L*.48,-W*.46),(L*.25,-W*.5)]
    if form == "raft":
        return [(L*.5,-W*.5),(L*.5,W*.5),(-L*.48,W*.5),(-L*.48,-W*.5)]
    if form == "open":
        return [(L*.58,0),(L*.25,-W*.45),(-L*.37,-W*.49),(-L*.48,-W*.28),(-L*.48,W*.28),(-L*.37,W*.49),(L*.25,W*.45)]
    return [(L*.58,0),(L*.30,-W*.50),(-L*.30,-W*.54),(-L*.49,-W*.34),(-L*.49,W*.34),(-L*.30,W*.54),(L*.30,W*.50)]


def draw_hull(s, ang, oar_phase=0.0):
    p = Painter(s, ang)
    L, W, H = dims(s); h = s["hull"]; q = P[s["id"]]
    dark, mid, deck = map(rgb, PALETTES.get(h, PALETTES["west"]))
    form = q.get("form", "round")
    ol = outline(L, W, h, form)
    if h == "raft":
        for k in range(9):
            yy = -W*.45 + k*W*.112
            p.line([(-L*.48,yy,4),(L*.51,yy,4)], shade(mid, .91 + .05*(k%2)), 6)
            p.line([(-L*.48,yy-2,7),(L*.51,yy-2,7)], shade(deck, 1.04), 1)
        for x in (-L*.27, 0, L*.27):
            p.line([(x,-W*.48,8),(x,W*.48,8)], shade(dark,.62), 2)
        p.box(-L*.16,L*.15,-W*.25,W*.25,6,14,deck)
        p.line([(-L*.16,-W*.26,14),(L*.15,-W*.26,14)], shade(dark,.7), 2)
        return p.finish()

    # 바깥 선체 옆면: 원래 선종의 비례는 지키되 꺾인 꼭짓점을 연속 곡면으로
    # 바꾼다. 평저선은 한 번만, 범선과 갤리는 두 번 다듬어 특징을 잃지 않는다.
    ol = p._soft_ring(ol, 1 if form in ("box", "junk", "sand", "jong") else 2)
    faces = []
    for i, a in enumerate(ol):
        b = ol[(i+1)%len(ol)]
        pts = [(a[0],a[1],1),(b[0],b[1],1),(b[0]*.96,b[1]*.96,H),(a[0]*.96,a[1]*.96,H)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        k = .61 + .22 * (.5 + .5 * math.sin(math.atan2(dy, dx) - .68))
        faces.append((sum(p.p(*v)[1] for v in pts)/4, pts, k))
    for _, pts, k in sorted(faces):
        p.poly(pts, shade(mid,k))
    top = [(x*.96,y*.96,H) for x,y in ol]
    p.poly(top, shade(deck,1.03), shade(dark,.52), .75)
    inner = [(x*.82,y*.78,H+.5) for x,y in ol]
    p.poly(inner, shade(deck,1.13), shade(mid,.72), .6)
    water_edge = [(x,y,1) for x,y in ol]
    p.line(water_edge + [water_edge[0]], shade(dark,.48,235), .9)
    p.line(top + [top[0]], shade(deck,1.24,155), .48)

    # 갑판 판재
    for k in range(-4,5):
        yy = k*W*.078
        p.line([(-L*.38,yy,H+1),(L*.35,yy,H+1)], shade(deck,.73,125), .5)
    for x in (-L*.25, 0, L*.25):
        p.line([(x,-W*.31,H+1.2),(x,W*.31,H+1.2)], shade(dark,.72,100), .45)

    # 외판 결구와 현측 띠. 황동 가장자리와 짙은 틈을 함께 그려 작은 화면에서도
    # 판재의 깊이와 갤리온 기준 그림의 따뜻한 재질이 읽히게 한다.
    for side in (-1, 1):
        for zi, zf in enumerate((.18, .34, .51, .68, .84)):
            p.line([(-L*.44,side*W*.43,H*zf),(L*.37,side*W*.46,H*zf)], shade(dark,.58,210), .82)
            if zi in (1, 3):
                p.line([(-L*.43,side*W*.435,H*zf+.9),(L*.35,side*W*.455,H*zf+.9)], shade(deck,.88,120), .38)
        if q.get("clinker"):
            for zf in (.18,.36,.54,.72,.90):
                p.line([(-L*.44,side*W*.44,H*zf),(L*.31,side*W*.47,H*zf)], shade(deck,.77,155), .65)
    if q.get("rail", 1):
        for side in (-1,1):
            p.line([(-L*.39,side*W*.40,H+4),(L*.34,side*W*.43,H+4)], shade(dark,.52), 2.0)
            p.line([(-L*.39,side*W*.40,H+4.5),(L*.34,side*W*.43,H+4.5)], shade(BRASS,.92), .62)
            for x in (-L*.34,-L*.18,0,L*.18,L*.31):
                p.line([(x,side*W*.41,H),(x,side*W*.42,H+4)], shade(dark,.55), .7)

    big = s["cap"] >= 250
    if h == "west":
        stern_h = H + (23 if big else 14)
        if s["id"] == "barca": stern_h = H + 8
        if s["id"] in ("cog","hulk"): stern_h = H + 18
        if s["id"] in ("galleon","lgalleon","frigate"): stern_h -= 5
        if q.get("stern") != "open":
            p.box(-L*.48,-L*.27,-W*.36,W*.36,H,stern_h,mid)
        if q.get("bow") == "castle":
            p.box(L*.25,L*.43,-W*.29,W*.29,H,H+(14 if big else 10),mid)
        elif q.get("bow") == "beak":
            p.line([(L*.37,0,H*.80),(L*.66,0,H*.55)], shade(dark,.54), 3)
            p.line([(L*.38,-W*.22,H+2),(L*.58,0,H*.65),(L*.38,W*.22,H+2)], shade(deck,.72), 1)
        if q.get("stern") == "gallery":
            p.box(-L*.49,-L*.31,-W*.40,W*.40,H,H+13,mid)
            for side in (-1,1): p.line([(-L*.48,side*W*.48,H+4),(-L*.28,side*W*.48,H+4)],shade(deck,.82),2)
        if s["id"] == "fluyt":
            p.box(-L*.47,-L*.30,-W*.31,W*.31,H,H+17,mid)
            p.line([(-L*.37,-W*.51,H*.52),(-L*.10,-W*.56,H*.50),(L*.26,-W*.40,H*.48)],shade(dark,.43),2)
            p.line([(-L*.37,W*.51,H*.52),(-L*.10,W*.56,H*.50),(L*.26,W*.40,H*.48)],shade(dark,.43),2)
        # 포구·선미 창: 검은 구멍 둘레에 황동 프레임을 둘러 축소해도 사각형으로 읽힌다.
        guns = q.get("guns", 0)
        for side in (-1,1):
            for k in range(guns):
                x = -L*.24 + k*(L*.52/max(1,guns-1))
                gp=[(x-2.8,side*W*.50,H*.46),(x+2.8,side*W*.50,H*.46),
                    (x+2.8,side*W*.50,H*.64),(x-2.8,side*W*.50,H*.64)]
                p.poly(gp,shade(BRASS,.76),shade(dark,.34),.7)
                p.ellipse3(x,side*W*.505,H*.55,1.45,1.05,shade(dark,.22))
        if q.get("stern") in ("high","tower","castle","gallery"):
            for k in (-1,0,1):
                p.ellipse3(-L*.485,k*W*.17,stern_h*.72,2.0,1.6,shade(BRASS,.72),shade(BRASS_HI,.92))
        if s["id"] in ("barca","pinnace"):
            p.line([(-L*.43,W*.38,H*.60),(-L*.62,W*.72,2)],shade(dark,.62),2)
    elif h == "galley":
        if q.get("stern") != "open": p.box(-L*.42,-L*.28,-W*.31,W*.31,H,H+(14 if s["id"] in ("greatgalley","galleass") else 9),mid)
        for k in range(5):
            x=-L*.26+k*L*.13
            p.line([(x,-W*.39,H+1),(x,W*.39,H+1)],shade(dark,.52),1)
        p.line([(L*.5,0,H*.3),(L*.58,0,H*.1)], shade(dark,.55), 3)
        if s["id"] == "galleass":
            p.box(L*.20,L*.39,-W*.27,W*.27,H,H+11,mid)
            for side in (-1,1):
                for k in range(6): p.ellipse3(-L*.22+k*L*.09,side*W*.51,H*.58,1.8,1.2,shade(dark,.25))
    elif h == "dhow":
        if q.get("stern") != "open": p.box(-L*.47,-L*.27,-W*.35,W*.35,H,H+(21 if s["id"]=="baghlah" else 14),mid)
        p.line([(L*.42,0,H*.7),(L*.67,0,H+7)],shade(dark,.66),2)
        if s["id"] == "sambuk":
            p.line([(-L*.35,-W*.35,H+3),(-L*.10,-W*.42,H+3)],shade(deck,.72),2)
        if s["id"] == "baghlah":
            for side in (-1,1):
                for k in range(3): p.ellipse3(-L*.06+k*L*.14,side*W*.50,H*.55,1.8,1.2,shade(dark,.28))
    elif h == "jong":
        p.box(-L*.46,-L*.22,-W*.40,W*.40,H,H+20,mid)
        p.line([(-L*.35,-W*.42,H+8),(L*.35,-W*.45,H+5)], (126,38,28,220), 3)
        p.line([(-L*.35,W*.42,H+8),(L*.35,W*.45,H+5)], (126,38,28,220), 3)
        p.box(L*.16,L*.34,-W*.25,W*.25,H,H+8,deck)
    elif h == "junk":
        p.box(-L*.48,-L*.25,-W*.40,W*.40,H,H+(18 if big else 12),mid)
        if big: p.box(-L*.10,L*.14,-W*.30,W*.30,H,H+(13 if s["id"]=="baochuan" else 8),deck)
        if s["id"] == "shachuan":
            p.box(L*.18,L*.36,-W*.28,W*.28,H,H+6,deck)
        if s["id"] == "baochuan":
            p.box(-L*.45,-L*.27,-W*.31,W*.31,H+18,H+29,dark)
            for side in (-1,1): p.line([(-L*.42,side*W*.47,H+8),(L*.35,side*W*.48,H+5)],(125,45,31,220),2)
        for side in (-1,1):
            for k in range(q.get("guns",0)): p.ellipse3(-L*.16+k*L*.13,side*W*.50,H*.52,1.8,1.2,shade(dark,.26))
    elif h == "kr":
        p.box(-L*.41,-L*.23,-W*.34,W*.34,H,H+8,mid)
        for x in (-L*.24,-L*.08,L*.08,L*.24): p.line([(x,-W*.42,H+1),(x,W*.42,H+1)],shade(dark,.55),1)
    elif h == "panok":
        p.box(-L*.43,L*.34,-W*.40,W*.40,H,H+15,mid)
        for x in (-L*.28,-L*.08,L*.12): p.line([(x,-W*.41,H+4),(x,-W*.41,H+13)], shade(dark,.45), 2)
        p.box(-L*.16,L*.06,-W*.25,W*.25,H+15,H+22,deck)
        for side in (-1,1):
            for k in range(5): p.ellipse3(-L*.25+k*L*.12,side*W*.43,H+7,1.8,1.1,shade(dark,.24))
    elif h == "turtle":
        roof = [(L*.38,0,H+11),(L*.24,-W*.38,H+12),(-L*.38,-W*.34,H+12),(-L*.43,0,H+18),(-L*.38,W*.34,H+12),(L*.24,W*.38,H+12)]
        p.poly(roof, shade(rgb("#615b4a"),1), shade(dark,.5), 1)
        for x in range(-5,6):
            p.ellipse3(x*L*.065,0,H+15,1.1,1.1,shade(rgb("#d3c49b"),.8))
        p.poly([(L*.36,-W*.12,H+8),(L*.61,0,H+9),(L*.36,W*.12,H+8)], rgb("#98723b"), shade(dark,.5))
        p.ellipse3(L*.58,0,H+10,2.1,2.1,(36,28,22,255))
    elif h == "jp":
        if s["id"] == "sekibune": p.box(-L*.38,L*.23,-W*.36,W*.36,H,H+9,mid)
        else: p.box(-L*.34,-L*.12,-W*.29,W*.29,H,H+6,mid)
    elif h == "atake":
        p.box(-L*.40,L*.25,-W*.38,W*.38,H,H+23,mid)
        p.box(-L*.12,L*.09,-W*.27,W*.27,H+23,H+37,dark)
        for side in (-1,1):
            for k in range(5): p.ellipse3(-L*.24+k*L*.12,side*W*.40,H+12,1.7,1.1,shade(dark,.24))

    if q.get("oars") or h in ("galley","kr","panok","turtle","jp","atake","outrigger"):
        n = q.get("oars", 7)
        oar_reach = 1.16 if h == "atake" else 1.35
        for k in range(n):
            x = -L*.34 + k*(L*.66/max(1,n-1))
            for side in (-1,1):
                stroke=math.sin(oar_phase + k*.42 + (0 if side > 0 else .28))
                tipx=x-L*(.025+.022*stroke); tipz=2.5+3.2*(.5+.5*math.cos(oar_phase+k*.42))
                p.line([(x,side*W*.43,H*.62),(tipx,side*W*oar_reach,tipz)], shade(dark,.72), 1.35)
                p.ellipse3(tipx,side*W*(oar_reach+.02),tipz,2.6,1.2,shade(deck,.78))
    if h == "outrigger":
        for side in (-1,1):
            p.line([(-L*.34,side*W,L*.6),(-L*.28,side*W*2.6,2)],shade(dark,.7),1.4)
            p.line([(L*.28,side*W,L*.6),(L*.22,side*W*2.6,2)],shade(dark,.7),1.4)
            p.line([(-L*.35,side*W*2.6,2),(L*.30,side*W*2.6,2)],shade(mid,.85),4)
    return p.finish()


def mast_positions(s, L):
    n = len(s["sails"])
    rig = P[s["id"]].get("rig")
    if n <= 1: return [L*(.10 if rig in ("galley","lateen","raft") else .04)]
    front, back = (.32, -.35)
    if rig in ("dhow","baghlah"): front, back = (.18, -.25)
    elif rig in ("galley","galleass","xebec"): front, back = (.31, -.31)
    elif rig in ("junk","treasure","jong","korean"): front, back = (.30, -.34)
    return [L*(front - i*((front-back)/(n-1))) for i in range(n)]


def mast_heights(s, n):
    arches = {
        1: [1.0], 2: [1.05,.86], 3: [.88,1.13,.80],
        4: [.76,1.12,.98,.71], 5: [.66,.96,1.13,.91,.62],
    }
    base = 67 + (8 if s["cap"] >= 500 else 0) + (5 if s["cap"] >= 1000 else 0)
    if P[s["id"]].get("rig") in ("galley","galleass","xebec"): base *= .88
    return [base*k for k in arches.get(n, [1]*n)]


def draw_rig(s, ang, state, furled=False, pulse=0.0):
    p = Painter(s, ang)
    L,W,H = dims(s); q=P[s["id"]]; rig=q.get("rig","")
    wood = rgb("#2b180d"); rope=(69,47,26,190); sail=IVORY; sail_shadow=rgb("#d2bb8c"); seam=(113,82,43,145)
    masts = mast_positions(s,L)
    heights=mast_heights(s,len(masts))
    # 먼 밧줄
    for i,mx in enumerate(masts):
        top=H+heights[i]
        p.line([(mx,0,H),(mx,0,top)],shade(wood,.62),3.35)
        p.line([(mx,0,H+.5),(mx,0,top)],shade(wood,1.55),1.65)
        p.line([(mx,0,top),(-L*.47,0,H+3)],rope,.65)
        p.line([(mx,0,top*.98),(L*.54,0,H+2)],rope,.65)
        for side in (-1,1):
            p.line([(mx,0,H+heights[i]*.88),(mx-heights[i]*.10,side*W*.55,H+2)],rope,.55)
    for i,(mx,kind) in enumerate(zip(masts,s["sails"])):
        mh=heights[i]; top=H+mh; bottom=H+mh*.22
        if furled:
            if kind == "sq":
                yaw=state*.42; ux,uy=math.sin(yaw),math.cos(yaw); span=W*(1.0 if len(masts)>2 and i==0 else 1.18)
                p.line([(mx-ux*span, -uy*span, top*.78),(mx+ux*span,uy*span,top*.78)],wood,2.1)
                p.line([(mx-ux*span*.8,-uy*span*.8,top*.76),(mx+ux*span*.8,uy*span*.8,top*.76)],shade(sail,.88),4)
            else:
                p.line([(mx+mh*.28,0,top),(mx-mh*.47,state*W*.28,bottom)],wood,2.1)
                p.line([(mx+mh*.18,0,top*.92),(mx-mh*.36,state*W*.24,bottom+5)],shade(sail,.88),4)
            continue
        if kind == "sq":
            yaw=state*.64; ux,uy=math.sin(yaw),math.cos(yaw)
            tiers = 2 if rig in ("carrack","galleon","fluyt","frigate") and s["cap"] >= 300 else 1
            if rig == "japanese": tiers = 1
            bands = ((.97,.69,.72),(.64,.29,1.0)) if tiers==2 else ((.94,.31,1.0),)
            for ti,(ztf,zbf,sw) in enumerate(bands):
                span=W*(1.04 if len(masts)>2 and i==0 else 1.24)*sw
                if rig == "japanese": span*=.88
                zt=H+mh*ztf; zb=H+mh*zbf; bill=state*W*(.07+.025*ti)+pulse*W*.035
                pts=[(mx-ux*span,-uy*span,zt),(mx+ux*span,uy*span,zt),
                     (mx+ux*span*.88+bill,uy*span*.88,zb),(mx-ux*span*.88+bill,-uy*span*.88,zb)]
                bulge=max(2.4,W*(.12+.025*abs(pulse)))
                p.sail_quad(pts,shade(sail,1.0 if ti==0 else .97),shade(wood,.74),.9,bulge)
                # 면을 잘게 나눠 다시 각지게 만들지 않고, 굽은 세로 재봉선과
                # 반투명 명암만 얹어 천의 부피를 표현한다.
                for gi in range(1,5):
                    frac=gi/5
                    ta=tuple(pts[0][j]*(1-frac)+pts[1][j]*frac for j in range(3))
                    ba=tuple(pts[3][j]*(1-frac)+pts[2][j]*frac for j in range(3))
                    tint=shade(sail_shadow,1.02 if gi%2 else .88,70 if gi%2 else 95)
                    p.curve_line(ta,ba,(bulge*(.70+.12*math.sin(frac*math.pi)),0,0),tint,.62)
                p.line([pts[0],pts[1]],wood,1.65)
                seams=(.25,.50,.75) if rig == "japanese" else (.32,.66)
                for frac in seams:
                    a=(pts[0][0]*(1-frac)+pts[3][0]*frac,pts[0][1]*(1-frac)+pts[3][1]*frac,pts[0][2]*(1-frac)+pts[3][2]*frac)
                    b=(pts[1][0]*(1-frac)+pts[2][0]*frac,pts[1][1]*(1-frac)+pts[2][1]*frac,pts[1][2]*(1-frac)+pts[2][2]*frac)
                    p.curve_line(a,b,(bulge*.46,0,-bulge*.07),seam,.55)
                p.curve_line((mx,bill*.5,zb),(mx,0,zt),(bulge*.72,0,0),shade(sail_shadow,.82,125),.5)
        elif kind == "lat":
            off=state*W*.33+pulse*W*.025
            foot=.58 if rig in ("dhow","baghlah") else .52
            peak=.34 if rig in ("dhow","baghlah") else .30
            pts=[(mx+mh*peak,off*.15,top),(mx-mh*foot,off,H+mh*.18),
                 (mx-mh*.37,off+state*W*.10,H+mh*.58)]
            # 갤리 계열은 길고 낮아 돛의 앞뒤 여백이 좁다. 같은 곡률을 쓰면
            # 셀을 넘으므로 부피감은 유지하면서 종축 돌출만 조금 줄인다.
            curve=.095 if rig in ("galley","galleass","xebec") else .15
            bulge=max(2.4,W*(curve+.025*abs(pulse)))
            p.sail_tri(pts,shade(sail,.98),shade(wood,.8),.8,bulge)
            p.line([(mx+mh*.32,off*.1,top),(mx-mh*.54,off,H+mh*.16)],wood,1.8)
            p.curve_line((mx+mh*.10,off*.12,H+mh*.77),(mx-mh*.33,off,H+mh*.34),(bulge*.55,0,0),seam,.6)
            for frac in (.24,.48,.72):
                a=tuple(pts[0][j]*(1-frac)+pts[1][j]*frac for j in range(3))
                b=tuple(pts[0][j]*(1-frac)+pts[2][j]*frac for j in range(3))
                p.curve_line(a,b,(bulge*(.35+.25*frac),0,0),seam,.42)
        else: # 대나무 살 돛: 부푼 사다리꼴 종범. 둘레 순서를 지켜 면이 뒤집히지 않게 한다.
            off=state*W*.22; bill=(.16+.10*abs(state))*W
            pts=[(mx+mh*.24,off,H+mh*.98),(mx-mh*.34,off,H+mh*.80),
                 (mx-mh*.52,off+bill,H+mh*.20),(mx+mh*.10,off+bill,H+mh*.30)]
            bulge=max(2.1,W*(.09+.02*abs(pulse)))
            p.sail_quad(pts,shade(sail,.96),shade(wood,.85),.8,bulge)
            for frac in (.16,.31,.46,.61,.76):
                a=(pts[0][0]*(1-frac)+pts[3][0]*frac,pts[0][1]*(1-frac)+pts[3][1]*frac,pts[0][2]*(1-frac)+pts[3][2]*frac)
                b=(pts[1][0]*(1-frac)+pts[2][0]*frac,pts[1][1]*(1-frac)+pts[2][1]*frac,pts[1][2]*(1-frac)+pts[2][2]*frac)
                p.curve_line(a,b,(bulge*.38,0,-bulge*.04),wood,.9)
    # 16세기 서양선의 선수 삼각돛. 문양 없이 작게 두어 시대와 속도감을 구분한다.
    if not furled and s["id"] in ("lcaravel","pinnace","galleon","lgalleon","fluyt","frigate","xebec"):
        mx=masts[0]; mh=heights[0]; off=state*W*.16
        jib=[(mx+mh*.03,off,H+mh*.72),(L*.56,off*.35,H+5),(mx+mh*.03,off+state*W*.07,H+mh*.28)]
        p.sail_tri(jib,shade(sail,.96),shade(wood,.78),.65,max(1.7,W*.08))
        p.line([jib[0],jib[1]],rope,.55)
    # 돛대 마디와 선수 지브를 마지막에 또렷하게
    for i,mx in enumerate(masts):
        p.ellipse3(mx,0,H+heights[i],2.2,1.7,shade(wood,1.18))
    return p.finish()


def draw_water(s, ang, phase, power):
    """수면에 붙는 잔물결·선수 포말. 셀 안에서 끝나며 바다는 칠하지 않는다."""
    p=Painter(s,ang); L,W,_=dims(s)
    foam=(230,244,238,round(40+95*power)); edge=(178,219,214,round(35+75*power))
    tail=-L*(.49+.025*math.sin(phase))
    spread=W*(.34+.18*power)
    for side in (-1,1):
        p.line([(tail,side*W*.18,1),(-L*(.55+.015*power),side*spread,0)],edge,1.0+power*1.1)
        p.line([(-L*.43,side*W*.30,1),(-L*(.54+.01*power),side*spread*.82,0)],foam,.65+power*.85)
    bow=L*.53
    for side in (-1,1):
        kick=(.5+.5*math.sin(phase+side*.8))*power
        p.line([(bow,side*W*.18,2),(L*(.58+.015*kick),side*W*(.35+.08*kick),1)],foam,.75+power*1.3)
        if power>.65:
            p.ellipse3(L*(.56+.015*kick),side*W*(.29+.05*kick),2+kick*2,1.3+kick,0.8+kick*.5,foam)
    return p.finish()


def motion_frame(s, ang, action, fi):
    frames=ACTIONS[action]["frames"]
    phase=math.tau*fi/frames
    power={"idle":.06,"drift":.34,"dash":1.0}[action]
    water=draw_water(s,ang,phase,power)
    hull=draw_hull(s,ang,phase*(.35 if action=="drift" else 1.0))
    if action=="idle":
        rig=draw_rig(s,ang,0,True,math.sin(phase)*.08)
    else:
        brace=.16+(.035 if action=="dash" else .08)*math.sin(phase)
        rig=draw_rig(s,ang,brace,False,math.sin(phase)*(.7 if action=="dash" else .3))
    out=Image.new("RGBA",(CELL,CELL),(0,0,0,0))
    out.alpha_composite(water); out.alpha_composite(hull); out.alpha_composite(rig)
    # 질주 때만 피벗을 중심으로 아주 작게 고동쳐 정지 그림과 분명히 구별한다.
    if action=="dash":
        out=out.rotate(math.sin(phase)*.65,Image.Resampling.BICUBIC,center=ANCHOR)
    return out


def atlas_for(s):
    atlas=Image.new("RGBA",(CELL*COLS,CELL*DIRS*2),(0,0,0,0))
    for action,spec in ACTIONS.items():
        for di in range(DIRS):
            ang=di*math.tau/DIRS
            for fi in range(spec["frames"]):
                atlas.alpha_composite(motion_frame(s,ang,action,fi),((spec["col"]+fi)*CELL,(spec["row"]+di)*CELL))
    return atlas


def write_meta(ss):
    rows=[]
    for s in ss:
        rows.append("    %s: %s" % (json.dumps(s["id"]), json.dumps({
            "key":"ships-nav/"+s["id"],"layout":"motion-v2","cell":CELL,"cols":COLS,"dirs":DIRS,
            "anchor":list(ANCHOR),"baseLen":BASE_LEN,
            "actions":ACTIONS,
            "sails":s["sails"],"hullType":s["hull"]
        },ensure_ascii=False,separators=(",",":"))))
    text="""/* tools/render_ship_sprites.py가 만든 8방향 동작 선박 시트 메타데이터. */
(function (G) {
  'use strict';
  G.SHIP_ART = {
%s
  };
})(window.G = window.G || {});
""" % ",\n".join(rows)
    META.parent.mkdir(parents=True,exist_ok=True)
    META.write_text(text,encoding="utf-8",newline="\n")


def contact_sheet(ss, atlases):
    thumb=180; pad=12; cols=6; rows=math.ceil(len(ss)/cols)
    out=Image.new("RGBA",(cols*(thumb+pad)+pad,rows*(thumb+34+pad)+pad),rgb("#20262d"))
    try: font=ImageFont.truetype("C:/Windows/Fonts/malgun.ttf",13)
    except OSError: font=None
    di=1; action="dash"; fi=2
    labels=[]
    for i,s in enumerate(ss):
        x=pad+(i%cols)*(thumb+pad); y=pad+(i//cols)*(thumb+34+pad)
        spec=ACTIONS[action]; sy=(spec["row"]+di)*CELL; sx=(spec["col"]+fi)*CELL
        base=atlases[s["id"]].crop((sx,sy,sx+CELL,sy+CELL))
        base.thumbnail((thumb,thumb),Image.Resampling.LANCZOS)
        out.alpha_composite(base,(x+(thumb-base.width)//2,y))
        labels.append((x+4,y+thumb+5,f"{s['name']}  {s['id']}"))
    # 합성 중 ImageDraw의 내부 버퍼가 낡지 않도록 그림을 모두 놓은 뒤 이름을 쓴다.
    d=ImageDraw.Draw(out)
    for x,y,label in labels:
        d.text((x,y),label,fill=(235,225,202,255),font=font)
    CONTACT.parent.mkdir(parents=True,exist_ok=True)
    out.convert("RGB").save(CONTACT,quality=90,optimize=True)


def main():
    ss=ships(); OUT.mkdir(parents=True,exist_ok=True); atlases={}
    for i,s in enumerate(ss,1):
        im=atlas_for(s); atlases[s["id"]]=im
        path=OUT/(s["id"]+".webp")
        # 알파는 그대로 보존하고 색만 고품질 WebP로 압축한다. 실제 표시가 38~70px라
        # 90 품질에서 무손실과 차이가 보이지 않으면서 36종의 읽기·풀기 부담이 크게 준다.
        im.save(path,"WEBP",quality=90,method=6)
        print(f"[{i:02d}/{len(ss)}] {path.relative_to(ROOT)} {path.stat().st_size/1024:.0f} KiB")
    write_meta(ss); contact_sheet(ss,atlases)
    total=sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"합계 {total/1024/1024:.2f} MiB · {CONTACT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
