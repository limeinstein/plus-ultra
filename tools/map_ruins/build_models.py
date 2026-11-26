"""Render the discoveries with the same camera, lighting and materials as the city icons."""
import json
import math
import random
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools' / 'city_icons'))
import world_models as W


def frustum(m, x, y, z, w, d, height, top, material='wall'):
    vertices = [(x+sign_x*w*width/2, y+sign_y*d*width/2, level)
                for width, level in ((1, z), (top, z+height))
                for sign_x, sign_y in ((-1,-1), (1,-1), (1,1), (-1,1))]
    m.geometry(vertices, [(3,2,1,0), (0,1,5,4), (1,2,6,5), (2,3,7,6),
                          (3,0,4,7), (4,5,6,7)], material)


def rubble(m, x, y, count, spread, seed=8):
    rng = random.Random(seed)
    for _ in range(count):
        px, py = x+rng.uniform(-spread, spread), y+rng.uniform(-spread, spread)
        radius = rng.uniform(.035, .14)
        m.rings(px, py, [(0, radius*.95, radius*.75), (.06, radius, radius*.85),
                         (radius*.62+.05, radius*.53, radius*.46)], rng.choice((5, 6, 7)),
                rng.choice(('wall', 'stone', 'cut')), rng.random())


def monolith(m, x, y, z, w, h, phase=0):
    m.rings(x,y,[(z,w*.9,w*.6),(z+h*.35,w,w*.71),(z+h*.84,w*.86,w*.60),
                  (z+h,w*.72,w*.54)],5,'stone',phase)


def stonehenge(m):
    for i in range(21):
        if i in (3, 4, 11, 13, 19):
            continue
        a = i*math.tau/21
        x,y = 1.62*math.cos(a),1.50*math.sin(a)
        monolith(m,x,y,0,.14,.63+math.cos(i)*.08,a)
        if i in (0, 1, 5, 7, 12, 15, 16):
            b = a + math.tau/21
            m.beam((x,y,.69),(1.62*math.cos(b),1.50*math.sin(b),.69),.09,'wall')
    for x,y,h in [(-.76,.02,.98),(-.64,.68,1.22),(.16,.90,1.48),(.76,.54,1.19),(.78,-.13,.98)]:
        monolith(m,x-.19,y,0,.19,h,.2)
        monolith(m,x+.23,y+.04,0,.18,h+.015,.66)
        m.beam((x-.32,y,h),(x+.35,y+.04,h),.13,'cut')
    rubble(m,.04,-.74,13,.7)


def giza(m):
    for x,y,w,h in ((-.93,.62,1.94,1.38),(.75,.13,1.59,1.14),(1.16,-1.03,1.02,.68)):
        frustum(m,x,y,0,w,w,.11,.98,'stone')
        for i in range(12):
            base = w*max(.04, .96-i*.073)
            frustum(m,x,y,.105+i*h/12,base,base,h/12,.93 if i<11 else .14,
                    'cut' if i>8 and x>0 else 'wall')
    for x in (-1.47,-1.04,-.58):
        frustum(m,x,-.79,0,.33,.33,.22,.04,'cut')
    rubble(m,-1.28,-.94,9,.28)
    # 전경의 스핑크스는 낮은 사자 몸체, 앞발, 높은 머리로 실루엣을 읽는다.
    m.rings(-.66,-1.47,[(0,.43,.23),(.15,.44,.23),(.23,.30,.17)],10,'stone')
    for y in (-1.60,-1.36):
        frustum(m,-.33,y,0,.55,.104,.115,.87,'cut')
    frustum(m,-.45,-1.47,.16,.27,.32,.30,.72,'wall')
    m.rings(-.42,-1.47,[(.34,.14,.14),(.53,.12,.115),(.57,.091,.091)],9,'cut')
    m.box(-.325,-1.47,.435,.066,.048,.057,'stone')


def steps(m, x, y, z, width, depth, rise, count, material='cut'):
    for i in range(count):
        front = y-depth+i*depth/count
        m.box(x,(y+front)/2,z,width,y-front,rise*(i+1)/count,material)


def pyramid(m):
    for i in range(6):
        frustum(m,-.28,.33,i*.255,2.64-i*.34,2.27-i*.30,.255,.94,'wall')
        m.box(-.28,.33,i*.255,2.65-i*.34,2.28-i*.30,.042,'cut')
    m.box(.10,-.95,0,2.95,.17,.19,'cut')
    m.box(1.54,-.20,0,.17,1.42,.19,'stone')
    for i in range(5):
        m.box(-1.3+i*.27,-.91,.18,.16,.21,.04,'wall')
    rubble(m,.86,-.54,12,.63)


def column(m,x,y,z,h,r,material='cut',broken=False):
    m.box(x,y,z,r*2.65,r*2.65,.07,'stone')
    m.cylinder(x,y,z+.07,r,h-.09,material,10,r*.81)
    if not broken:
        m.cylinder(x,y,z+h-.065,r*1.20,.065,'cut',10)
        m.box(x,y,z+h,r*2.65,r*2.65,.075,'cut')


def greek(m, broken=False):
    for i in range(3):
        m.box(0,0,i*.09,3.70-i*.18,2.26-i*.14,.09,'stone' if i==0 else 'cut')
    for y in (-.80,.80):
        for i in range(8):
            partial = broken and (i in (3, 4) or y>0 and i==6)
            column(m,-1.44+i*.41,y,.27,.48 if partial else 1.15,.084,broken=partial)
    for x in (-1.44,1.43):
        for y in (-.40,0,.40):
            column(m,x,y,.27,1.15,.084)
    if broken:
        for x in (-1.05,1.04):
            for y in (-.80,.80):
                m.box(x,y,1.49,1.01,.21,.20,'wall')
        m.box(-1.46,0,1.49,.23,1.78,.18,'cut')
        rubble(m,.32,0,16,.64)
    else:
        m.box(0,0,.27,2.08,1.03,1.2,'wall')
        m.box(0,0,1.48,3.17,1.88,.18,'cut')
        m.roof(0,0,1.66,1.86,3.17,.48,'wall','cut','x')


def karnak(m):
    for i,y in enumerate((-.64,.57,1.23)):
        for x in (-.75,.75):
            frustum(m,x,y,0,1.14,.47,1.34-i*.22,.79,'wall')
            m.box(x,y,1.31-i*.22,1.01,.45,.085,'cut')
            m.box(x,y,.16,1.14,.51,.055,'stone')
            if i==0:
                for j in range(4):
                    m.box(x,y-.48*.50,.29+j*.17,.31 if j%2 else .41,.026,.019,'stone')
                    for dx in (-.14,-.06,.055,.135):
                        m.box(x+dx,y-.48*.50,.305+j*.17,.018,.024,.044,'stone')
    for x in (-.36,.36):
        for y in (-.27,-.01,.25,.83,1.05):
            column(m,x,y,0,.63,.09)
    for dx in (-.56,.56):
        m.box(dx,-1.10,0,.18,.20,.12,'stone')
        m.rings(dx,-1.10,[(.11,.075,.067),(.31,.075,.063),(.43,.061,.05)],8,'wall')
        m.cylinder(dx,-1.10,.42,.051,.10,'cut',8,.041)
    for x,y in ((-.48,-1.15),(.48,-1.15),(.47,.28)):
        frustum(m,x,y,0,.15,.15,1.15,.64,'cut')
        frustum(m,x,y,1.15,.10,.10,.14,.04,'cut')
    steps(m,0,-.62,0,.43,.43,.12,4)


def persepolis(m):
    m.box(0,.23,0,3.1,2.10,.23,'stone')
    steps(m,0,-.72,0,1.35,.66,.25,7)
    for i in range(6):
        for j in range(3):
            h = 1.04 if (i*3+j)%5 in (0, 1) else .39+((i+j)%3)*.16
            column(m,-1.15+i*.46,-.16+j*.49,.23,h,.068,broken=h<1)
    for x in (-.47,.47):
        frustum(m,x,-.63,.23,.30,.38,.58,.93,'wall')
        m.box(x,-.71,.79,.34,.31,.14,'cut')
    rubble(m,.97,.48,12,.33)


def cliff(m,x,y,width,depth,height,seed,material='wall'):
    rng = random.Random(seed)
    angles = [i*math.tau/10 for i in range(10)]
    p = []
    for z,scale in ((0,1), (height*.32,1.03), (height*.80,.94), (height,.71)):
        p.extend((x+width*scale*math.cos(a)*rng.uniform(.87,1.12)/2,
                  y+depth*scale*math.sin(a)*rng.uniform(.89,1.1)/2,
                  z+rng.uniform(-.11,.12)*min(z,1)) for a in angles)
    faces = [(j*10+i,j*10+(i+1)%10,(j+1)*10+(i+1)%10,(j+1)*10+i)
             for j in range(3) for i in range(10)]
    m.geometry(p, faces+[tuple(range(30,40))], material)


def petra(m):
    for i,x in enumerate((-1.37,-.81,0,.88,1.43)):
        cliff(m,x,.43,1.27,1.7,2.18+math.sin(i*1.8)*.29,i+2)
    m.box(0,-.44,.10,1.86,.46,1.67,'wall')
    steps(m,0,-.65,0,1.68,.43,.13,4)
    for x in (-.74,-.42,.42,.74):
        column(m,x,-.79,.14,.82,.064)
    m.arch(0,-.687,.14,.49,.72,'dark',line=True)
    m.box(0,-.69,.99,1.90,.27,.13,'cut')
    for x in (-.65,.65):
        for dx in (-.15,.15):
            column(m,x+dx,-.73,1.11,.44,.049)
        m.roof(x,-.72,1.61,.50,.26,.17,'cut','wall')
    m.cylinder(0,-.70,1.10,.21,.48,'wall',12)
    m.cylinder(0,-.70,1.58,.24,.23,'cut',12,.04)
    rubble(m,.97,-.74,10,.54)


def khmer_tower(m,x,y,z,width,h):
    m.box(x,y,z,width,width,h*.22,'stone')
    m.arch(x,y-width*.505,z+.035,width*.29,h*.15,'dark',point=True)
    for i in range(7):
        w = width*(1-i*.123)
        level = z+h*(.22+i*.11)
        frustum(m,x,y,level,w,w,h*.126,.75,'cut' if i%3 else 'wall')
        for sx in (-1,1):
            for sy in (-1,1):
                frustum(m,x+w*.34*sx,y+w*.34*sy,level,w*.18,w*.18,h*.12,.43,'wall')
    m.cylinder(x,y,z+h*.96,width*.12,h*.12,'cut',8,.025)


def angkor(m):
    for i in range(3):
        m.box(0,.34,i*.13,3.53-i*.41,2.47-i*.32,.13,'stone')
    for x in (-.98,.98):
        for y in (-.12,1.01):
            khmer_tower(m,x,y,.39,.64,1.12)
    khmer_tower(m,0,.47,.39,.82,1.78)
    for x in (-1.48,1.48):
        m.box(x,.45,.14,.20,2.15,.49,'wall')
        m.roof(x,.45,.63,.29,2.15,.23,'stone','wall')
        for y in (-.53,-.19,.15,.49,.83,1.17,1.43):
            m.box(x*1.07,y,.18,.09,.068,.44,'cut')
    steps(m,0,-.60,0,.89,.83,.39,9)
    for x in (-.49,.49):
        m.box(x,-.97,0,.12,.83,.24,'cut')


def stupa(m,x,y,z,r,h):
    m.cylinder(x,y,z,r,.08,'stone',10)
    m.rings(x,y,[(z+.08,r*.94,r*.94),(z+h*.45,r*.84,r*.84),
                 (z+h*.69,r*.59,r*.59),(z+h*.78,r*.33,r*.33),(z+h,r*.10,r*.10)],12,'cut')


def borobudur(m):
    for i in range(5):
        width = 3.45-i*.42
        m.box(0,0,i*.15,width,width,.15,'wall')
        for j in range(-3,4):
            d = j*width/8
            m.box(d,-width/2-.015,i*.15+.13,width/12,.13,.08,'cut')
            m.box(width/2+.015,d,i*.15+.13,.13,width/12,.08,'cut')
    for level,radius,count in ((0,.86,12),(1,.60,9),(2,.37,7)):
        z = .75+level*.115
        m.cylinder(0,0,z,radius+.19,.115,'stone',24)
        for i in range(count):
            angle = i*math.tau/count
            stupa(m,radius*math.cos(angle),radius*math.sin(angle),z+.115,.103,.21)
    stupa(m,0,0,1.10,.26,.49)
    steps(m,0,-.65,0,.43,1.17,.75,12)


def wall(m, x, y, z, w, d, h, crenel=False):
    m.box(x,y,z,w,d,h,'wall')
    m.box(x,y,z+h-.055,w+.03,d+.04,.055,'cut')
    if crenel:
        count = max(2, int(w*5))
        for i in range(count):
            m.box(x+w*((i+.5)/count-.5), y-d*.32, z+h, w/count*.47,d*.4,.12,'cut')


def long_wall(m, compact=False):
    for x,y,z,d in ((-1.31,.49,.08,.38),(-.52,.15,.24,.53),(.31,-.13,.39,.38),(1.12,.04,.54,.41)):
        if compact:
            z *= .46
        cliff(m,x,y+.11,1.16,1.29,z*.9+.12,int(x*15),'stone')
        wall(m,x,y,z,.96,d,.34 if compact else .48,True)
    for x,y,z in ((-.96,.25,.15), (1.36,.07,.54)):
        if compact:
            z *= .46
        wall(m,x,y,z,.53,.62,.54,True)
        m.arch(x,y-.32,z+.28,.15,.15,'dark')
        if not compact:
            m.roof(x,y,z+.57,.56,.62,.23,'roof','wall')


def machupicchu(m):
    for i in range(5):
        y = -.92+i*.32
        w = 3.27-i*.23
        x = -.32+i*.10
        m.box(x,y+.24,i*.15,w,.83,.15,'stone')
        m.box(x,y+.28,i*.15+.15,w-.08,.70,.042,'leaf')
    for x,y,z,w in ((-.99,.35,.60,.74),(-.15,.51,.61,.65),(.77,.68,.60,.84),(.66,-.02,.45,.56),
                      (-1.22,.97,.62,.56),(-.55,1.15,.62,.58)):
        for side in (-1,1):
            wall(m,x+side*w*.43,y,z,.10,.46,.31)
        wall(m,x,y+.22,z,w,.09,.31)
        m.prism([(x-w*.49,y+.18,z+.30),(x+w*.49,y+.18,z+.30),(x,y+.18,z+.53)],(0,.10,0),'stone')
        for dx in (-.26,.25):
            wall(m,x+dx*w,y-.23,z,w*.36,.095,.25)
    steps(m,.21,.21,0,.27,1.43,.71,14,'stone')
    rubble(m,-1.29,-.99,11,.36)


def maya(m,tall=False):
    n = 8 if tall else 9
    z = 0
    for i in range(n):
        w = (2.65 if tall else 3.10) * (1-i/(n+2))
        h = .26 if tall else .142
        frustum(m,0,.13,z,w,w*.89,h,.93,'wall')
        m.box(0,.13,z,w+.025,w*.90,.038,'cut')
        z += h
    steps(m,0,-.30,0,.48,1.08,z,18)
    for x in (-.30,.30):
        m.beam((x,-1.41,.04),(x,-.34,z+.09),.069,'cut')
    m.box(0,.20,z,.84,.63,.48,'wall')
    m.arch(0,-.124,z+.03,.24,.36,'dark')
    m.box(0,.20,z+.45,.94,.70,.10,'cut')
    if tall:
        frustum(m,0,.34,z+.55,.83,.39,.64,.70,'wall')
        m.box(0,.13,z+.82,.60,.16,.08,'cut')
    else:
        for i in range(15):
            end = 1.53-i*.067
            m.box((.47+end)/2,.18,0,end-.47,.34,z*(i+1)/15,'cut')
        for y in (-.035,.395):
            m.beam((1.53,y,.03),(.45,y,z),.055,'stone')
        for dx in (-.30,.30):
            m.rings(dx,-1.46,[(0,.085,.115),(.085,.088,.11),(.13,.048,.064)],9,'cut')


def seokguram(m):
    cliff(m,0,.75,2.8,1.84,.93,36,'stone')
    cliff(m,.70,.62,.88,1.21,.44,42,'leaf')
    for i in range(6):
        x=-.96+i*.39
        m.box(x,-.02,0,.32,.22,.40,'stone')
    m.box(0,-.18,.09,1.34,.87,.62,'wall')
    m.arch(0,-.63,.14,.36,.43,'dark',line=True)
    for x in (-.57,-.26,.26,.57):
        m.box(x,-.65,.18,.087,.11,.55,'beam')
    W.layered_roof(m,0,-.19,.75,1.48,.98,.45)
    steps(m,0,-.62,0,.53,.63,.14,5)


def arcade(m, two=False, masonry='wall'):
    count, start, span = 6, -1.78, .60
    for layer in range(2 if two else 1):
        z = layer*.77
        for i in range(count+1):
            x = start+i*span
            m.box(x,0,z,.135,.38,.79,masonry)
            m.box(x,0,z+.39,.165,.40,.055,'cut')
        for i in range(count):
            center = start+(i+.5)*span
            for j in range(9):
                a,b = j*math.pi/9,(j+1)*math.pi/9
                def at(r,theta): return (center+r*math.cos(theta),-.19,z+.37+r*math.sin(theta))
                m.prism([at(.235,a),at(.335,a),at(.335,b),at(.235,b)],(0,.38,0),'cut' if j%3==0 else masonry)
        m.box(.02,0,z+.71,3.77,.42,.12,'stone')


def fort(m, keep=False):
    for x in (-1.38,1.38):
        for y in (-.85,.73):
            m.cylinder(x,y,0,.28,1.02,'wall',12)
            m.cylinder(x,y,1.02,.33,.095,'cut',12)
            m.cylinder(x,y,1.11,.32,.42 if keep else .30,'roof',12,.032)
        m.box(x,-.06,0,.19,1.58,.68,'wall')
    for y in (-.85,.73):
        wall(m,0,y,0,2.79,.21,.68,True)
    m.box(0,.26,0,1.53,1.01,.99,'wall')
    m.roof(0,.26,.99,1.56,1.04,.52,'roof','wall')
    m.box(0,-.88,0,.57,.30,.82,'cut')
    m.arch(0,-1.04,.02,.32,.57,'dark',line=True)


def lalibela(m):
    for x,y,w,d in ((-1.30,.21,.64,2.57),(1.29,.18,.58,2.60),(0,1.16,2.10,.58),(-.93,-.86,.56,.61)):
        cliff(m,x,y,w,d,.71,int((x+y)*23))
    p = [(-.30,-.71),(.30,-.71),(.30,-.30),(.71,-.30),(.71,.30),(.30,.30),
         (.30,.71),(-.30,.71),(-.30,.30),(-.71,.30),(-.71,-.30),(-.30,-.30)]
    m.prism([(x,y,0) for x,y in p],(0,0,.68),'wall')
    m.prism([(x*1.025,y*1.025,.66) for x,y in p],(0,0,.065),'cut')
    m.box(0,0,.728,.50,.10,.025,'wall')
    m.box(0,0,.732,.10,.50,.032,'wall')
    for x in (-.54,-.16,.16,.54):
        m.arch(x,-.313,.14,.14,.28,'dark',point=True)
    for x in (-.23,.23):
        m.arch(x,-.725,.12,.135,.29,'dark',point=True)
    rubble(m,1.14,-.85,8,.36)


def gate(m, shrine=True):
    for x in (-.64,.64):
        m.cylinder(x,-.57,0,.074,.93,'tile',10,.053)
        m.cylinder(x,-.57,0,.112,.15,'dark',10)
    m.beam((-.83,-.57,.69),(.83,-.57,.69),.061,'tile')
    m.beam((-.93,-.57,.95),(.93,-.57,.95),.070,'tile')
    m.beam((-.96,-.57,1.025),(.96,-.57,1.025),.047,'roof')
    if shrine:
        for x in (-1.09,-.61,.61,1.09):
            m.box(x,.56,0,.115,.11,.28,'tile')
        m.box(0,.57,.22,2.75,.88,.12,'wood')
        m.box(0,.57,.34,1.86,.68,.47,'wall')
        for x in (-.79,-.42,0,.42,.79):
            m.box(x,.21,.34,.08,.09,.47,'tile')
        W.layered_roof(m,0,.57,.84,2.55,1.15,.57)


def bagan(m):
    for x,y,r,h in ((-1.07,.62,.48,1.15),(.98,.79,.39,1.05),(.85,-.51,.33,.83),(-.93,-.58,.35,.91),(0,.16,.75,1.93)):
        for i in range(4):
            w = r*2*(1-i*.16)
            frustum(m,x,y,h*.13*i,w,w,h*.13,.86,'wall')
        m.arch(x,y-r-.015,.052,r*.56,h*.28,'dark',point=True)
        stupa(m,x,y,h*.51,r*.52,h*.49)
    rubble(m,.24,-.81,9,.40)


def theater(m):
    for i in range(11):
        inner = .56+i*.135
        outer = inner+.134
        for j in range(19):
            if j in (4,9,14) and i%3:
                continue
            t = math.pi*.10+j*math.pi/16.8
            u = t+math.pi/17.7
            z = i*.061
            m.prism([(inner*math.cos(t),inner*math.sin(t),z), (outer*math.cos(t),outer*math.sin(t),z),
                     (outer*math.cos(u),outer*math.sin(u),z), (inner*math.cos(u),inner*math.sin(u),z)],
                    (0,0,.11),'cut' if j%5==0 else 'wall')
    m.cylinder(0,0,0,.55,.05,'stone',28)
    wall(m,0,-.60,0,1.44,.22,.21)


def grotto(m, idol=False):
    for i in range(5):
        x = (i-2)*.66
        cliff(m,x,.47,1.14,1.61,1.21+.31*math.sin(i),i+61)
        if i%2==0:
            m.arch(x,-.29,.08,.27,.41,'dark',point=True)
    if idol:
        m.box(0,-.38,.10,.54,.37,.89,'stone')
        m.rings(0,-.53,[(.12,.34,.24),(.28,.36,.25),(.68,.22,.14),(.85,.128,.11)],9,'cut')
        m.rings(0,-.52,[(.83,.115,.099),(.95,.136,.122),(1.12,.105,.092),(1.18,.07,.07)],10,'wall')
    else:
        for x in (-.54,-.28,.28,.54):
            column(m,x,-.34,0,.58,.066)
        m.box(0,-.34,.63,1.23,.24,.12,'cut')
    rubble(m,.68,-.36,11,.53)


def abbey(m, dome=False):
    m.box(0,.25,0,1.48,2.18,.84,'wall')
    m.roof(0,.25,.84,1.49,2.18,.41,'roof','cut')
    for i in range(5):
        y = -.61+i*.41
        m.arch(.753,y,.33,.19,.39,'dark',point=True,side=True)
        m.box(.79,y+.10,0,.14,.12,.63,'cut')
    for x in (-.53,.53):
        m.box(x,-.79,0,.47,.54,1.33,'wall')
        m.arch(x,-1.072,.84,.19,.35,'dark',point=True)
        m.hip(x,-.79,1.33,.53,.59,.44,'roof')
    m.arch(0,-.87,0,.36,.62,'dark',point=True,line=True)
    if dome:
        m.cylinder(0,.45,.89,.58,.38,'wall',8)
        W.B.dome(m,0,.45,1.24,.59,.49,'lead')
    steps(m,0,-.85,0,1.31,.40,.12,5)


def village(m, needles=False):
    for i,(x,y,h) in enumerate(((-1.06,.64,.91),(.09,.70,1.34),(.89,.39,.82),(-.47,-.09,.72),(.57,-.46,.94),(-1.15,-.65,.53))):
        w = .49+i%3*.13
        if needles:
            m.box(x,y,0,w*.66,w*.74,h+.26,'wall')
            m.arch(x,y-w*.38,h*.74,.12,.18,'dark')
            wall(m,x,y,h+.25,w*.7,w*.79,.11,True)
        else:
            m.cylinder(x,y,0,w*.50,h*.59,'wall',10)
            m.cylinder(x,y,h*.58,w*.57,h*.52,'roof',12,.026)
            m.arch(x,y-w*.48,0,.14,.27,'dark')


def minaret(m):
    m.box(-.15,.44,0,2.40,1.32,.64,'wall')
    for i in range(6):
        m.arch(-1.00+i*.34,-.242,.09,.20,.41,'dark',point=True)
    wall(m,-.13,-.21,.56,2.46,.21,.17,True)
    for i in range(3):
        z = i*.60
        m.box(1.02,.58,z,.46-i*.065,.45-i*.065,.61,'cut')
        m.arch(1.02,.345+i*.03,z+.27,.145,.23,'dark',point=True)
    m.hip(1.02,.58,1.80,.32,.32,.23,'roof')
    m.cylinder(1.02,.58,2.03,.04,.13,'metal',8,.014)


def andes(m):
    for x,y,w,d,h in ((-1.15,.30,.93,1.34,.42),(.35,.45,1.87,1.69,.54),(1.31,-.28,.56,1.04,.33)):
        for i in range(3):
            frustum(m,x,y,i*h/3,w*(1-i*.15),d*(1-i*.12),h/3,.92,'stone')
        steps(m,x,y-.13,0,w*.42,d/2+.16,h,6)
    rubble(m,-.80,-.68,13,.69)


def weathered_materials(key):
    materials = city_materials(key)
    for part in ('wall','cut','stone'):
        material = materials[part]
        if material.get('ruin-weathering'):
            continue
        material['ruin-weathering'] = True
        tree = material.node_tree
        nodes, links = tree.nodes, tree.links
        shader = nodes.get('Principled BSDF')
        coord = next(node for node in nodes if node.type=='TEX_COORD').outputs['Object']
        base = shader.inputs['Base Color'].links[0].from_socket
        profile = nodes.new('ShaderNodeTexNoise')
        profile.inputs['Scale'].default_value = 6.7
        profile.inputs['Roughness'].default_value = .72
        profile.inputs['Detail'].default_value = 3.3
        links.new(coord,profile.inputs['Vector'])
        tones = nodes.new('ShaderNodeValToRGB')
        tones.color_ramp.elements[0].position = .19
        tones.color_ramp.elements[0].color = (.31,.28,.22,1)
        tones.color_ramp.elements[1].position = .80
        tones.color_ramp.elements[1].color = (1,1,1,1)
        links.new(profile.outputs['Fac'],tones.inputs['Fac'])
        mix = nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = .65 if part!='cut' else .46
        links.new(base,mix.inputs[1])
        links.new(tones.outputs['Color'],mix.inputs[2])
        links.new(mix.outputs[0],shader.inputs['Base Color'])
        original_bump = shader.inputs['Normal'].links[0].from_node
        original_bump.inputs['Strength'].default_value = .43
        original_bump.inputs['Distance'].default_value = .071
        stone = nodes.new('ShaderNodeTexNoise')
        stone.inputs['Scale'].default_value = 44
        stone.inputs['Roughness'].default_value = .72
        links.new(coord,stone.inputs['Vector'])
        fine = nodes.new('ShaderNodeBump')
        fine.inputs['Strength'].default_value = .40
        fine.inputs['Distance'].default_value = .036
        links.new(original_bump.outputs['Normal'],fine.inputs['Normal'])
        links.new(stone.outputs['Fac'],fine.inputs['Height'])
        links.new(fine.outputs['Normal'],shader.inputs['Normal'])
    return materials


RECIPES = [
    ('stonehenge','britain',.92,0,stonehenge), ('giza','egypt',1.0,0,giza),
    ('pyramid','egypt',.99,0,pyramid), ('thebes','egypt',1.0,0,karnak),
    ('persepolis','greek',.98,0,persepolis), ('petra','petra',.92,-.14,petra),
    ('angkor','khmer',.96,0,angkor), ('borobudur','khmer',.89,0,borobudur),
    ('greatwall','greatwall',.99,-.20,long_wall), ('machupicchu','andean',1.0,0,machupicchu),
    ('chichen','andean',1.03,0,maya), ('tikal','andean',.97,0,lambda m:maya(m,True)),
    ('seokguram','korea',1.04,0,seokguram), ('parthenon','greek',.93,.10,lambda m:greek(m,True)),
    ('ds_083','petra',1.02,0,lalibela), ('ds_097','petra',1.0,0,lambda m:grotto(m,True)),
    ('ds_098','china',1.02,-.09,grotto), ('ds_308','greek',.92,.12,persepolis),
    ('ds_314','germany',.99,0,lambda m:abbey(m,True)), ('ds_319','france',.99,0,fort),
    ('ds_329','japan',1.03,0,gate), ('ds_336','petra',.98,.22,lambda m:grotto(m,True)),
    ('ds_342','khmer',.91,0,bagan), ('ds_351','andean',1.07,-.13,andes),
    ('ds_355','andean',1.02,.06,andes), ('ds_369','greek',.92,-.30,theater),
    ('ds_371','arabia',.95,.12,minaret), ('ds_372','arabia',.95,-.12,minaret),
    ('ds_373','ethiopia',.99,.14,lambda m:fort(m,True)), ('ds_676','greek',.94,-.08,theater),
    ('ds_678','greek',.97,.17,lambda m:arcade(m,True)), ('ds_679','iberia',.97,-.32,lambda m:arcade(m,True,'stone')),
    ('ds_680','britain',1.08,0,lambda m:long_wall(m,True)), ('ds_686','france',.96,-.11,lambda m:fort(m,True)),
    ('ds_689','greek',.97,0,seokguram), ('ds_690','greek',.91,.17,lambda m:grotto(m)),
    ('ds_693','italy',.98,.12,lambda m:village(m,True)), ('ds_694','italy',1.01,0,village),
    ('ds_699','iberia',.98,-.13,abbey), ('ds_704','india',.98,.12,minaret),
    ('ds_707','india',1.04,.08,grotto), ('ds_708','khmer',1.03,0,bagan),
    ('ds_711','khmer',.98,.10,angkor), ('ds_715','japan',1.03,-.08,gate),
    ('ds_719','china',.99,.13,gate), ('ds_721','eastafrica',1.06,.15,village),
    ('ds_724','andean',1.01,.18,lambda m:maya(m,True)),
]


def configure(out, cell=288):
    W.RAW = out / 'blender-renders'
    W.RAW.mkdir(parents=True, exist_ok=True)
    W.REUSE, W.RERENDER = '--reuse-renders' in sys.argv, []
    bpy.ops.wm.read_factory_settings(use_empty=True)
    W.gpu = False
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'CUDA'
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == 'CUDA'
            W.gpu |= device.use
    except (TypeError, AttributeError, RuntimeError):
        pass
    for key, (_, colors) in W.REGIONS.items():
        W.B.PALETTES[key] = tuple(colors.split())
    for key, colors in {'egypt':'B1966C D5BF96 6F6951 825147 816E4B',
                        'petra':'9D6750 D39B75 715C54 A85947 925344',
                        'khmer':'9C9275 C6B997 687464 816745 70502C',
                        'andean':'A69C80 D4BD95 675F52 906D4F 776844',
                        'ethiopia':'9B8774 C8B89F 56524D 8B6C55 7B5441'}.items():
        W.B.PALETTES[key] = tuple(colors.split())
    W.B.PALETTES['japan'] = ('D4C6A2', 'E8D6AC', '444942', 'A3412E', 'AA8961')
    W.B.PALETTES['greatwall'] = ('8E8A77', 'C0B5A0', '455552', '6F6053', '756C4C')
    W.METER = 5.85
    W.CELL = cell
    W.B.materials = weathered_materials


def main():
    out = Path(sys.argv[sys.argv.index('--')+1]).resolve()
    configure(out)
    meta = {}
    for i in range(0,len(RECIPES),12):
        key = f'heritage-{i//12+1}'
        for site, bounds in W.make_atlas(key,RECIPES[i:i+12]).items():
            meta[site] = [key,*bounds]
    (out/'blender-layout.json').write_text(json.dumps(meta),encoding='utf-8')
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'ruin-models.blend'),compress=True)


city_materials = W.B.materials

if __name__ == '__main__':
    main()
