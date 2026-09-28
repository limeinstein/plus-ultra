#!/usr/bin/env python3
"""모든 유적 발견물의 7단계 복원 + 360° 드론 회전 GIF를 만든다.

실행 (WebGame 폴더):
    python tools/ruin_gifs/build.py
    python tools/images.py

외부 생성형 서비스 없이 Pillow로 그리는 결정적 렌더러다. 발견물 ID는
js/data/discoveries.js에서 읽기 때문에 유적이 늘어나면 누락을 곧바로 알린다.
"""
from __future__ import annotations

import argparse
import math
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
DISCOVERIES = ROOT / "js" / "data" / "discoveries.js"
OUT = ROOT / "images" / "discoveries"
W, H = 576, 256                 # 발견 카드와 같은 9:4
SCALE = 3.05

STAGES = (
    "1/7  가설·토공사",
    "2/7  기초·골조 공사",
    "3/7  외장·방수 공사",
    "4/7  내장·설비 공사",
    "5/7  마감·준공",
    "6/7  조경",
    "7/7  수채화 어반스케치",
)
PROGRESS = (0.08, 0.30, 0.58, 0.78, 1.0, 1.0, 1.0)
DURATIONS = (760, 760, 760, 760, 820, 900, 1120)


# 각 유적의 가장 눈에 띄는 건축 문법. 이 분류가 실제 애니메이션의 구조를 바꾼다.
KINDS = {
    "carnac": "alignments", "stonehenge": "stone_circle", "mycenae": "fort",
    "parthenon": "classical", "delphi": "classical", "knossos": "palace",
    "pyramid": "step_pyramid", "giza": "pyramids", "kings": "rock_tombs",
    "thebes": "column_temple", "abusimbel": "rock_temple", "troy": "fort",
    "ishtar": "gate", "babel": "ziggurat", "persepolis": "column_palace",
    "mohenjo": "grid_city", "angkor": "khmer", "yungang": "caves",
    "qinshi": "mound", "greatwall": "great_wall", "qianling": "mound",
    "muryeong": "brick_tomb", "bulguksa": "korean_temple", "seokguram": "grotto",
    "munmu": "sea_tomb", "hwangnyong": "pagoda", "emille": "bell_pavilion",
    "jongmyo": "long_shrine", "fertile": "village", "borobudur": "stupa_steps",
    "tula": "warriors", "nazca": "geoglyph", "tiwanaku": "sun_gate",
    "poitiers": "church", "montstmichel": "island_abbey", "stave": "stave_church",
    "rusch": "onion_church", "hagiasophia": "great_dome", "prester": "rock_churches",
    "cappadocia": "cave_village", "sepulchre": "rotunda", "edom": "rock_city",
    "ur": "ziggurat", "petra": "rock_city", "brendan": "mist_island",
    "cibola": "adobe_city", "ark": "ark", "djenne": "mud_mosque",
    "zimbabwe": "round_fort", "delhimosque": "mosque", "tajmahal": "mausoleum",
    "qutb": "minaret", "madurai": "gopuram", "shwedagon": "gold_stupa",
    "ayubuddha": "buddha_tree", "potala": "hill_palace", "konjiki": "gold_temple",
    "pueblo": "cliff_dwelling", "machupicchu": "mountain_city", "sacsay": "zigzag_fort",
    "moai": "moai", "mu": "sunken_city", "isfahanmosque": "blue_mosque",
    "alhambra": "garden_palace", "rockdome": "gold_dome", "ananda": "burmese_temple",
}


COLORS = {
    "paper": (242, 231, 205), "ink": (63, 52, 42), "pencil": (111, 102, 89),
    "sand": (196, 158, 104), "sand2": (225, 198, 149), "stone": (194, 182, 158),
    "marble": (225, 219, 197), "brick": (161, 91, 60), "wood": (116, 75, 43),
    "roof": (138, 63, 43), "blue": (44, 105, 129), "gold": (199, 151, 47),
    "green": (75, 111, 66), "green2": (116, 137, 73), "water": (73, 139, 154),
    "shadow": (78, 64, 48), "plaster": (213, 194, 159), "black": (37, 38, 37),
}

ACCENT = {
    "ishtar": "blue", "isfahanmosque": "blue", "rockdome": "gold",
    "shwedagon": "gold", "konjiki": "gold", "tajmahal": "marble",
    "alhambra": "brick", "djenne": "sand", "potala": "brick",
    "bulguksa": "roof", "jongmyo": "roof", "hwangnyong": "wood",
}


def ruin_rows() -> list[tuple[str, str]]:
    src = DISCOVERIES.read_text(encoding="utf-8")
    return re.findall(r"^\s*add\('([^']+)', '([^']+)', 'ruin'", src, re.M)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = ["malgunbd.ttf" if bold else "malgun.ttf", "arialbd.ttf" if bold else "arial.ttf"]
    roots = [Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/dejavu")]
    for root in roots:
        for name in names:
            p = root / name
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


FONT_NAME = font(20, True)
FONT_STAGE = font(14, True)
FONT_TINY = font(10, False)


def mix(a, b, t):
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))


def shade(c, amount):
    return mix(c, (255, 255, 255) if amount > 0 else (0, 0, 0), abs(amount))


class Scene:
    """작은 아이소메트릭 수채화 디오라마."""

    def __init__(self, image: Image.Image, yaw: float, aerial: float, colored: bool, seed: int):
        self.im = image
        self.d = ImageDraw.Draw(image, "RGBA")
        self.yaw = yaw
        self.aerial = aerial
        self.colored = colored
        self.seed = seed
        self.cx = W / 2
        self.cy = 178 + aerial * 8
        self.scale = SCALE * (0.92 if aerial else 1.0)

    def project(self, x, y, z=0):
        c, s = math.cos(self.yaw), math.sin(self.yaw)
        xr, yr = x * c - y * s, x * s + y * c
        flatten = 0.43 - self.aerial * 0.10
        return (self.cx + xr * self.scale, self.cy + yr * self.scale * flatten - z * self.scale * (0.88 - self.aerial * 0.08))

    def line3(self, pts, fill, width=1):
        self.d.line([self.project(*p) for p in pts], fill=fill, width=width, joint="curve")

    def poly3(self, pts, fill, outline=None, width=1):
        q = [self.project(*p) for p in pts]
        self.d.polygon(q, fill=fill)
        if outline:
            self.d.line(q + [q[0]], fill=outline, width=width, joint="curve")

    def box(self, x, y, z, sx, sy, sz, color, progress=1.0, frame=False):
        h = max(0.7, sz * progress)
        p000 = self.project(x - sx/2, y - sy/2, z)
        p100 = self.project(x + sx/2, y - sy/2, z)
        p110 = self.project(x + sx/2, y + sy/2, z)
        p010 = self.project(x - sx/2, y + sy/2, z)
        p001 = self.project(x - sx/2, y - sy/2, z+h)
        p101 = self.project(x + sx/2, y - sy/2, z+h)
        p111 = self.project(x + sx/2, y + sy/2, z+h)
        p011 = self.project(x - sx/2, y + sy/2, z+h)
        ink = (*COLORS["ink"], 205)
        if frame:
            for a, b in ((p000,p001),(p100,p101),(p110,p111),(p010,p011),(p001,p101),(p101,p111),(p111,p011),(p011,p001)):
                self.d.line((a,b), fill=ink, width=2)
            return
        left, right, top = shade(color, -0.16), shade(color, -0.28), shade(color, 0.14)
        self.d.polygon((p000,p100,p101,p001), fill=(*left,255), outline=ink)
        self.d.polygon((p100,p110,p111,p101), fill=(*right,255), outline=ink)
        self.d.polygon((p001,p101,p111,p011), fill=(*top,255), outline=ink)

    def roof(self, x, y, z, sx, sy, h, color, progress=1.0):
        if progress < 0.72:
            # 방수·지붕 단계 전에는 목조 트러스만 보인다.
            for yy in (-sy/2, 0, sy/2):
                self.line3([(x-sx/2, y+yy, z), (x, y+yy, z+h), (x+sx/2, y+yy, z)], (*COLORS["wood"],220), 2)
            return
        ridge1 = self.project(x, y-sy/2, z+h)
        ridge2 = self.project(x, y+sy/2, z+h)
        a = self.project(x-sx/2, y-sy/2, z)
        b = self.project(x-sx/2, y+sy/2, z)
        c = self.project(x+sx/2, y-sy/2, z)
        d = self.project(x+sx/2, y+sy/2, z)
        ink = (*COLORS["ink"],215)
        self.d.polygon((a,b,ridge2,ridge1), fill=(*shade(color,.10),255), outline=ink)
        self.d.polygon((ridge1,ridge2,d,c), fill=(*shade(color,-.13),255), outline=ink)

    def dome(self, x, y, z, rx, color, progress=1.0):
        r = rx * self.scale
        c = self.project(x, y, z)
        h = r * (0.68 if progress >= .72 else .28)
        box = (c[0]-r, c[1]-h, c[0]+r, c[1]+h*.22)
        self.d.pieslice(box, 180, 360, fill=(*color,255), outline=(*COLORS["ink"],220), width=1)
        if progress < .72:
            self.d.arc(box, 180, 360, fill=(*COLORS["wood"],230), width=2)

    def pyramid(self, x, y, z, sx, sy, h, color, progress=1.0, steps=0):
        h *= progress
        if steps:
            for i in range(steps):
                f = 1 - i / (steps + 1)
                self.box(x, y, z + h*i/steps*.68, sx*f, sy*f, h/steps*.72, color)
            return
        base = [(x-sx/2,y-sy/2,z),(x+sx/2,y-sy/2,z),(x+sx/2,y+sy/2,z),(x-sx/2,y+sy/2,z)]
        apex = (x,y,z+h)
        faces = [(base[0],base[1],apex),(base[1],base[2],apex),(base[2],base[3],apex),(base[3],base[0],apex)]
        for i, face in enumerate(faces):
            self.poly3(face, (*shade(color, (-.18,.06,-.28,-.06)[i]),255), (*COLORS["ink"],210))

    def column(self, x, y, z, h, color, progress=1.0, thick=1.4):
        self.box(x, y, z, thick, thick, h, color, progress, frame=progress < .5)

    def tree(self, x, y, size, green=None):
        green = green or COLORS["green"]
        p = self.project(x,y,0)
        self.d.line((p[0],p[1],p[0],p[1]-size*1.2), fill=(*COLORS["wood"],220), width=2)
        self.d.ellipse((p[0]-size*.65,p[1]-size*2.1,p[0]+size*.65,p[1]-size*.8), fill=(*green,205), outline=(*COLORS["ink"],120))


def paper(seed: int) -> Image.Image:
    rng = random.Random(seed)
    im = Image.new("RGB", (W, H), COLORS["paper"])
    d = ImageDraw.Draw(im, "RGBA")
    # 수채 종이 얼룩과 연필 결. 같은 유적은 모든 프레임에서 고정된다.
    for _ in range(135):
        x, y = rng.randrange(W), rng.randrange(H)
        r = rng.randrange(2, 18)
        c = (154, 119, 72, rng.randrange(2, 10)) if rng.random() < .72 else (255,255,255,rng.randrange(2,8))
        d.ellipse((x-r,y-r*.35,x+r,y+r*.35), fill=c)
    for _ in range(30):
        y = rng.randrange(H)
        d.line((0,y,W,y+rng.choice((-1,0,1))), fill=(95,76,54,8), width=1)
    return im


def terrain(sc: Scene, stage: int, kind: str, rng: random.Random):
    water_kind = kind in {"sea_tomb", "mist_island", "island_abbey", "sunken_city"}
    if water_kind:
        sc.poly3([(-82,-48,0),(82,-48,0),(82,48,0),(-82,48,0)], (*mix(COLORS["water"], COLORS["paper"], .38),230), (*COLORS["ink"],90))
        for y in range(-42, 48, 9):
            sc.line3([(-78,y,0.15),(78,y,0.15)], (45,105,126,70), 1)
        if kind != "sunken_city":
            sc.poly3([(-48,-22,.2),(8,-38,.2),(52,-2,.2),(28,28,.2),(-35,34,.2),(-58,4,.2)], (*COLORS["sand2"],255), (*COLORS["ink"],130))
    else:
        sc.poly3([(-78,-46,0),(76,-46,0),(82,43,0),(-72,49,0)], (*COLORS["sand2"],235), (*COLORS["ink"],100))
    # 가장자리 잉크 해칭
    for _ in range(22):
        x = rng.uniform(-72,72); y = rng.choice((-43,43)) + rng.uniform(-4,4)
        sc.line3([(x,y,0),(x+rng.uniform(-5,5),y+rng.uniform(2,6),rng.uniform(0,1))], (73,61,48,60), 1)
    if stage == 0:
        # 완전한 백지에서 시작하는 조사망·터파기·기초선.
        for x in range(-54,55,12): sc.line3([(x,-31,.2),(x,31,.2)], (71,69,64,80), 1)
        for y in range(-30,31,10): sc.line3([(-55,y,.2),(55,y,.2)], (71,69,64,80), 1)
        sc.poly3([(-40,-24,.4),(42,-24,.4),(42,25,.4),(-40,25,.4)], (171,137,94,55), (69,60,50,150), 1)
        for x,y in ((-40,-24),(42,-24),(42,25),(-40,25)):
            sc.line3([(x,y,0),(x,y,6)], (65,57,49,190), 2)


def landscaping(sc: Scene, stage: int, rng: random.Random, kind: str):
    if stage < 5:
        return
    if kind not in {"sea_tomb", "sunken_city", "geoglyph", "ark"}:
        for x,y,s in ((-62,-28,7),(-58,26,6),(60,-30,6),(58,29,8),(-28,40,5),(30,40,5)):
            sc.tree(x,y,s, COLORS["green"] if stage >= 6 else mix(COLORS["green"], COLORS["paper"], .48))
        # 산책로와 작은 수로
        sc.poly3([(-7,48,.2),(7,48,.2),(6,20,.2),(-6,20,.2)], (221,202,164,220), (96,77,55,90))
        if kind in {"garden_palace", "mausoleum", "palace", "hill_palace"}:
            sc.poly3([(-25,29,.3),(25,29,.3),(25,37,.3),(-25,37,.3)], (*COLORS["water"],175), (*COLORS["ink"],100))


def scaffolds(sc: Scene, stage: int):
    if stage not in (1,2,3):
        return
    alpha = 175 if stage == 1 else 115
    for x in (-47,47):
        for y in (-25,25):
            sc.line3([(x,y,0),(x,y,35)], (*COLORS["wood"],alpha), 1)
    sc.line3([(-47,-25,14),(47,-25,14)], (*COLORS["wood"],alpha), 1)
    sc.line3([(-47,25,25),(47,25,25)], (*COLORS["wood"],alpha), 1)
    sc.line3([(-47,-25,0),(-47,-25,35),(47,-25,0)], (*COLORS["wood"],alpha), 1)


def draw_model(sc: Scene, kind: str, stage: int, rid: str):
    p = PROGRESS[stage]
    frame = stage == 1
    muted = stage < 6
    stone = mix(COLORS["stone"], COLORS["paper"], .34 if muted else .04)
    sand = mix(COLORS["sand"], COLORS["paper"], .32 if muted else .03)
    marble = mix(COLORS["marble"], COLORS["paper"], .22 if muted else 0)
    brick = mix(COLORS["brick"], COLORS["paper"], .38 if muted else 0)
    wood = mix(COLORS["wood"], COLORS["paper"], .32 if muted else 0)
    roof = mix(COLORS["roof"], COLORS["paper"], .46 if muted else 0)
    accent = COLORS.get(ACCENT.get(rid, "stone"), stone)

    def block(x,y,z,sx,sy,sz,c=stone,start=0):
        q = max(0.02, min(1, (p-start)/(1-start)))
        sc.box(x,y,z,sx,sy,sz,c,q,frame=frame and sz>5)

    def col(x,y,z,h,c=marble,start=.10,thick=1.6):
        q = max(0.02, min(1, (p-start)/(1-start)))
        sc.column(x,y,z,h,c,q,thick)

    if kind == "alignments":
        for row in (-18,0,18):
            for x in range(-55,56,11):
                block(x,row,0,2.8,4,8+(x%5),stone)
    elif kind == "stone_circle":
        for i in range(14):
            a=i*math.tau/14; x,y=math.cos(a)*34,math.sin(a)*24
            block(x,y,0,4,5,17,stone)
            if stage>=2 and i%2==0: block((x+math.cos((i+1)*math.tau/14)*34)/2,(y+math.sin((i+1)*math.tau/14)*24)/2,16*p,13,4,3,stone)
    elif kind in {"fort","round_fort","zigzag_fort"}:
        if kind == "round_fort":
            for i in range(18):
                a=i*math.tau/18; block(math.cos(a)*42,math.sin(a)*27,0,8,5,13,stone)
        elif kind == "zigzag_fort":
            for x,y in [(-52,-15),(-30,-24),(-6,-12),(18,-23),(42,-10),(28,4),(5,-5),(-20,6),(-45,0)]: block(x,y,0,24,7,12,stone)
        else:
            for x in range(-48,49,12): block(x,-28,0,11,5,15,stone)
            for x in range(-48,49,12): block(x,28,0,11,5,11,stone)
            for y in range(-22,23,11): block(-51,y,0,5,10,14,stone); block(51,y,0,5,10,14,stone)
            block(0,-28,0,18,8,24,stone)
    elif kind in {"classical","column_temple","column_palace"}:
        block(0,0,0,86,48,5,marble)
        xs = range(-35,36,10)
        for x in xs:
            col(x,-19,5,28); col(x,19,5,28)
        for y in (-9,0,9): col(-37,y,5,28); col(37,y,5,28)
        block(0,0,5,58,27,19,stone,.26)
        block(0,0,32*p,84,46,4,marble,.45)
        sc.roof(0,0,38*p,88,50,12,roof,p)
    elif kind in {"palace","garden_palace"}:
        block(0,0,0,88,58,4,stone)
        for x,y,sx,sy in ((0,-24,78,12),(0,24,78,12),(-38,0,12,38),(38,0,12,38)):
            block(x,y,4,sx,sy,18,brick,.1); sc.roof(x,y,22*p,sx+4,sy+4,7,roof,p)
        if kind == "garden_palace":
            for x in (-20,0,20): col(x,0,4,11,marble,.25,1.2)
    elif kind in {"step_pyramid","pyramids","stupa_steps","ziggurat"}:
        specs = [(-22,0,48,43,42),(23,8,34,31,30),(-2,-24,25,22,21)] if kind=="pyramids" else [(0,0,78,58,42)]
        for x,y,sx,sy,h in specs:
            steps = 6 if kind in {"step_pyramid","stupa_steps","ziggurat"} else 0
            sc.pyramid(x,y,0,sx,sy,h,accent if rid in ACCENT else sand,p,steps)
        if kind == "stupa_steps" and stage>=3:
            sc.dome(0,0,38*p,9,stone,p)
    elif kind in {"rock_tombs","rock_temple","caves","grotto","rock_churches","cave_village","rock_city"}:
        # 뒤의 절벽과 앞의 깎아 만든 건물/굴
        for x in range(-56,57,14):
            h = 30 + (abs(x*7+sc.seed_hash(rid))%18)
            block(x,17,0,15,22,h,sand)
        if kind in {"rock_temple","rock_city"}:
            for x in (-26,-9,9,26): col(x,-7,3,25,sand,.18,2.2)
            block(0,-4,27*p,64,10,6,sand,.45)
        else:
            for x in range(-38,39,13):
                c=sc.project(x,-5,12*p); r=5*SCALE
                sc.d.ellipse((c[0]-r,c[1]-r*.7,c[0]+r,c[1]+r*.7),fill=(*COLORS["black"],210),outline=(*COLORS["ink"],230))
        if kind == "grotto": sc.dome(0,-4,25*p,19,stone,p)
    elif kind in {"gate","sun_gate"}:
        block(-24,0,0,20,22,40,accent); block(24,0,0,20,22,40,accent)
        block(0,0,30*p,30,22,10,accent,.3)
        block(-39,0,0,10,18,22,accent); block(39,0,0,10,18,22,accent)
    elif kind in {"grid_city","village","adobe_city","cliff_dwelling","mountain_city"}:
        levels = 3 if kind in {"cliff_dwelling","mountain_city"} else 2
        for row in range(levels):
            for i in range(-4,5):
                x=i*11 + (row%2)*4; y=(row-1)*16
                z=row*5 if kind in {"cliff_dwelling","mountain_city"} else 0
                block(x,y,z,9,11,8+row*2,brick if kind in {"village","adobe_city"} else stone,.08)
        if kind=="mountain_city":
            for y in (-30,30): sc.poly3([(-58,y,0),(58,y,0),(48,y+7,3),(-49,y+7,3)],(*COLORS["green2"],170),(*COLORS["ink"],90))
    elif kind in {"khmer","korean_temple","gold_temple","burmese_temple"}:
        block(0,0,0,86,54,4,stone)
        centers = [(-30,8),(0,-8),(30,8)] if kind=="khmer" else [(0,0),(-30,10),(30,10)]
        for x,y in centers:
            if kind=="khmer":
                block(x,y,4,18,18,21,stone,.12); sc.pyramid(x,y,25*p,20,20,20,stone,p,4)
            else:
                block(x,y,4,23,19,16,wood,.12); sc.roof(x,y,20*p,31,27,10,accent if rid in ACCENT else roof,p)
    elif kind in {"mound","brick_tomb"}:
        sc.pyramid(0,0,0,78,58,32,mix(COLORS["green2"],COLORS["sand"],.42),p,5)
        block(0,-22,0,18,14,9,brick if kind=="brick_tomb" else stone)
        for x in (-42,-30,30,42): block(x,0,0,3,4,10,stone)
    elif kind == "great_wall":
        pts=[(-72,-26),(-45,-14),(-18,-27),(8,-9),(35,-18),(70,5)]
        for (x,y),(nx,ny) in zip(pts,pts[1:]):
            steps=5
            for j in range(steps):
                t=j/steps; block(x+(nx-x)*t,y+(ny-y)*t,0,18,6,10,stone)
        for x,y in pts[1:-1]: block(x,y,0,12,12,21,stone)
    elif kind in {"pagoda","gopuram"}:
        tiers = 9 if kind=="pagoda" else 7
        z=0
        for i in range(tiers):
            s=30-i*2.4
            block(0,0,z,s,s*.72,7,wood if kind=="pagoda" else brick,i*.035)
            if kind=="pagoda": sc.roof(0,0,(z+7)*p,s+9,s*.72+8,4,roof,p)
            z+=7.2
    elif kind in {"bell_pavilion","long_shrine","stave_church"}:
        sx,sy=(92,22) if kind=="long_shrine" else (42,31)
        block(0,0,0,sx,sy,5,stone)
        for x in range(-int(sx/2)+7,int(sx/2),10): col(x,-sy/2+4,5,19,wood,.1,1.3)
        block(0,0,5,sx-9,sy-9,16,wood,.24)
        sc.roof(0,0,23*p,sx+7,sy+8,12,roof,p)
        if kind=="bell_pavilion" and stage>=3:
            c=sc.project(0,0,12*p); sc.d.ellipse((c[0]-16,c[1]-22,c[0]+16,c[1]+20),fill=(*COLORS["gold"],230),outline=(*COLORS["ink"],255),width=2)
    elif kind in {"church","onion_church","great_dome","rotunda","island_abbey"}:
        block(0,0,0,60,38,27,marble,.08)
        block(0,-23,0,28,18,38,stone,.15)
        if kind=="church": sc.roof(0,0,29*p,65,42,16,roof,p)
        elif kind=="onion_church":
            for x,y in ((0,0),(-22,4),(22,4)):
                block(x,y,22,12,12,18,marble,.2); sc.dome(x,y,42*p,8,COLORS["gold"],p)
        else:
            sc.dome(0,0,31*p,23,accent if rid in ACCENT else roof,p)
            for x,y in ((-30,0),(30,0),(0,20)): sc.dome(x,y,18*p,8,stone,p)
    elif kind in {"mud_mosque","mosque","blue_mosque","gold_dome"}:
        body = sand if kind=="mud_mosque" else (COLORS["blue"] if kind=="blue_mosque" and stage>=6 else marble)
        block(0,0,0,66,43,27,body,.08)
        sc.dome(0,0,30*p,22,COLORS["gold"] if kind=="gold_dome" else body,p)
        for x,y in ((-39,-20),(39,-20),(-39,20),(39,20)):
            block(x,y,0,6,6,45,body,.12); sc.dome(x,y,46*p,4,body,p)
        if kind=="mud_mosque":
            for x in range(-34,35,8): sc.line3([(x,-23,5),(x,-31,15)],(*COLORS["wood"],230),2)
    elif kind == "mausoleum":
        block(0,0,0,72,48,5,marble)
        block(0,0,5,52,35,27,marble,.08); sc.dome(0,0,34*p,19,marble,p)
        for x,y in ((-36,-24),(36,-24),(-36,24),(36,24)):
            block(x,y,0,7,7,48,marble,.12); sc.dome(x,y,50*p,4,marble,p)
    elif kind == "minaret":
        for z,sx in ((0,12),(20,9),(40,7)):
            block(0,0,z,sx,sx,22,brick,z/120); block(0,0,z+20,18,18,2,stone,z/120)
        sc.dome(0,0,65*p,6,brick,p)
    elif kind in {"gold_stupa","buddha_tree"}:
        if kind=="buddha_tree":
            block(0,0,0,32,25,8,stone)
            c=sc.project(0,0,14*p); sc.d.ellipse((c[0]-16,c[1]-28,c[0]+16,c[1]+22),fill=(*COLORS["gold"],220),outline=(*COLORS["ink"],230))
            if stage>=5: sc.tree(18,5,18,COLORS["green"])
        else:
            sc.pyramid(0,0,0,60,48,18,stone,p,5); sc.dome(0,0,20*p,22,COLORS["gold"] if stage>=6 else sand,p)
            block(0,0,35*p,5,5,31,COLORS["gold"],.4)
    elif kind == "hill_palace":
        for level in range(4):
            z=level*9; sx=92-level*13; sy=48-level*7
            block(0,level*2,z,sx,sy,10,marble,level*.05)
        block(0,0,36,50,28,20,brick,.25)
    elif kind == "geoglyph":
        # 하늘에서 보이는 새 형상의 토공선. 단계가 갈수록 연필에서 붉은 자갈 선으로 변한다.
        c = (*COLORS["brick"],225) if stage>=4 else (*COLORS["pencil"],150)
        pts=[(-52,0,1),(-24,-8,1),(-7,-28,1),(0,-7,1),(9,-28,1),(17,-5,1),(52,0,1),(20,7,1),(9,29,1),(0,10,1),(-12,30,1),(-19,7,1),(-52,0,1)]
        sc.line3(pts,c,3 if stage>=4 else 1)
    elif kind == "warriors":
        block(0,8,0,80,36,5,stone)
        for x in (-30,-10,10,30):
            block(x,3,5,9,8,29,stone,.1); block(x,3,34*p,11,10,10,stone,.3)
    elif kind == "moai":
        for i,x in enumerate((-45,-27,-9,9,27,45)):
            block(x,4+(i%2)*4,0,8,8,27+(i%3)*4,stone,.08); block(x,3+(i%2)*4,27*p,10,9,11,stone,.25)
    elif kind in {"sea_tomb","mist_island","sunken_city"}:
        if kind=="sea_tomb":
            block(0,0,0,42,30,8,stone); block(0,0,8,18,18,14,stone,.18)
        elif kind=="mist_island":
            block(0,0,0,55,36,9,stone); block(0,0,9,38,25,18,marble,.12); sc.roof(0,0,28*p,44,31,10,roof,p)
        else:
            # 물 밑의 태양 도시: 완공 후에도 청록 물막을 얹는다.
            for x,y in ((0,0),(-31,-12),(31,-12),(-31,17),(31,17)):
                sc.pyramid(x,y,-5,24,21,32,stone,p,4)
    elif kind == "ark":
        # 산마루 위 나무 방주
        sc.pyramid(0,10,0,92,55,30,stone,p,5)
        block(0,-4,23,65,23,18,wood,.08); sc.roof(0,-4,42*p,70,27,12,roof,p)
    else:
        block(0,0,0,70,45,28,stone); sc.roof(0,0,30*p,76,51,12,roof,p)

    scaffolds(sc, stage)


# 메서드 안에서 문자열 해시를 안정적으로 쓰기 위한 작은 보조 함수
Scene.seed_hash = staticmethod(lambda text: sum((i + 1) * ord(c) for i, c in enumerate(text)))


def watercolor_overlay(im: Image.Image, seed: int, strong: bool):
    d=ImageDraw.Draw(im,"RGBA"); rng=random.Random(seed+991)
    n=42 if strong else 18
    for _ in range(n):
        x=rng.randrange(W); y=rng.randrange(34,H); r=rng.randrange(5,28)
        col=rng.choice((COLORS["gold"],COLORS["green"],COLORS["blue"],COLORS["brick"]))
        d.ellipse((x-r,y-r*.35,x+r,y+r*.35),fill=(*col,5 if strong else 2))
    # 어반스케치 바깥 잉크 테두리
    if strong:
        d.rectangle((1,1,W-2,H-2),outline=(73,54,34,120),width=2)


def label(im: Image.Image, name: str, text: str, orbit=None):
    d=ImageDraw.Draw(im,"RGBA")
    # 이름은 화면 중앙, 단계는 작은 청사진 표찰. 건축을 가리지 않는다.
    bbox=d.textbbox((0,0),name,font=FONT_NAME); tw=bbox[2]-bbox[0]
    d.rounded_rectangle((W/2-tw/2-12,7,W/2+tw/2+12,35),6,fill=(249,241,221,228),outline=(86,66,43,155),width=1)
    d.text((W/2-tw/2,9),name,font=FONT_NAME,fill=(*COLORS["ink"],255))
    sb=d.textbbox((0,0),text,font=FONT_STAGE); sw=sb[2]-sb[0]
    d.rounded_rectangle((10,H-31,18+sw,H-8),5,fill=(39,58,66,220),outline=(231,207,151,210),width=1)
    d.text((14,H-28),text,font=FONT_STAGE,fill=(244,232,202,255))
    if orbit is not None:
        t=f"상공 회전  {orbit:03d}°"
        b=d.textbbox((0,0),t,font=FONT_TINY); w=b[2]-b[0]
        d.text((W-w-13,H-25),t,font=FONT_TINY,fill=(*COLORS["ink"],230))


def frame(rid: str, name: str, kind: str, stage: int, yaw: float, aerial=0.0, orbit=None):
    seed=Scene.seed_hash(rid)
    im=paper(seed)
    sc=Scene(im,yaw,aerial,stage>=6,seed)
    rng=random.Random(seed)
    terrain(sc,stage,kind,rng)
    landscaping(sc,stage,rng,kind)
    draw_model(sc,kind,stage,rid)
    watercolor_overlay(im,seed+stage*31,stage>=6)
    label(im,name,STAGES[stage] if orbit is None else "준공  수채화 드론 전경",orbit)
    return im


def save_gif(rid: str, name: str, kind: str, out: Path):
    base_yaw=-math.pi/4
    frames=[frame(rid,name,kind,i,base_yaw) for i in range(7)]
    durations=list(DURATIONS)
    # 마지막은 더 높은 카메라가 한 바퀴를 완주한다. 0°와 360°를 모두 넣어 닫힌 회전을 분명히 한다.
    for i in range(17):
        deg=round(i*360/16)
        frames.append(frame(rid,name,kind,6,base_yaw+math.radians(deg),.72,deg))
        durations.append(125 if i<16 else 720)
    # GIF 전역에 가까운 제한 팔레트: 손그림 색을 유지하면서 용량을 줄인다.
    q=[f.quantize(colors=96,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE) for f in frames]
    out.parent.mkdir(parents=True,exist_ok=True)
    q[0].save(out,save_all=True,append_images=q[1:],duration=durations,loop=0,optimize=True,disposal=2)


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only",help="쉼표로 구분한 발견물 ID만 만든다")
    args=ap.parse_args()
    rows=ruin_rows()
    ids={rid for rid,_ in rows}
    missing=ids-KINDS.keys(); stale=KINDS.keys()-ids
    if missing or stale:
        raise SystemExit(f"유적 형태 분류를 갱신하세요. 누락={sorted(missing)}, 삭제된 ID={sorted(stale)}")
    wanted=set(args.only.split(",")) if args.only else ids
    made=0
    for rid,name in rows:
        if rid not in wanted: continue
        out=OUT/f"{rid}.gif"
        save_gif(rid,name,KINDS[rid],out)
        made+=1
        print(f"{made:02d}/{len(wanted):02d}  {rid:18s} {name}")
    unknown=wanted-ids
    if unknown: raise SystemExit(f"없는 유적 ID: {sorted(unknown)}")
    print(f"\n완료: {made}개 GIF → {OUT}")


if __name__ == "__main__":
    main()
