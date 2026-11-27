"""해적섬과 개척지의 지도 표식을 Blender로 렌더한다."""
import json
import math
import random
import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'map_ruins'))
from build_models import W, configure, cliff
from build_missing import detailed_materials


def face(m, x, y, z, radii, depth, color, phase=0):
    width, height = radii
    points = [(x+width*math.cos(a),y,z+height*math.sin(a))
              for a in (phase+math.tau*i/15 for i in range(15))]
    m.prism(points,(0,depth,0),color)


def skull_cave(m):
    rng = random.Random(53)
    # 층진 암벽의 밝은 해골 부분과 그 뒤의 짙은 석굴.
    for i,(x,y,w,d,h) in enumerate(((-1.03,.24,.98,1.35,1.10),(.92,.36,1.10,1.29,1.23),
                                    (.12,.57,2.35,1.49,1.65),(-.47,.72,1.13,1.18,1.79))):
        cliff(m,x,y,w,d,h,33+i,'stone')
    cliff(m,0,-.05,1.85,1.01,1.42,63,'wall')
    for x,y,phase in ((-.60,-.58,.11),(.62,-.58,-.06)):
        m.rings(x,y,[(.06,.24,.25),(.35,.27,.25),(.62,.21,.19),(.79,.14,.11)],7,'cut',phase)
    m.arch(0,-.83,.02,.99,.65,'dark')
    m.arch(0,-.854,.03,.80,.53,'cave')
    for i in range(9):
        a=(i+.4)*math.pi/9
        x,z=.54*math.cos(a),.28+.39*math.sin(a)
        m.rings(x,-.78,[(z-.08,.084,.115),(z+.03,.100,.124),(z+.09,.077,.101)],7,
                'wall' if i%3==0 else 'cut',i*.8)
    for x in (-.41,.41):
        face(m,x,-.746,1.071,(.286,.245),.052,'dark',.15)
        face(m,x,-.771,1.061,(.241,.194),.038,'cave',.11)
        m.beam((x-.22,-.75,1.275),(x+.23,-.75,1.278 if x<0 else 1.250),.049,'cut')
    m.prism([(-.103,-.821,.784),(.116,-.821,.789),(.01,-.821,1.023)],(0,.048,0),'cave')
    for x in (-.33,-.17,0,.17,.33):
        m.box(x,-.858,.48+abs(x)*.11,.100,.12,.13+rng.random()*.035,'cut')
    for i in range(20):
        x,y=rng.uniform(-1.56,1.57),rng.uniform(-.98,.64)
        if abs(x)<.48 and y<-.34:continue
        r=rng.uniform(.048,.16)
        m.rings(x,y,[(0,r,r),(.06,r*.91,r*.79),(.075+r*.51,r*.53,r*.44)],
                6,'leaf' if i%5==0 else 'stone',i*.57)


def wheel(m,x,y,z,r):
    for i in range(16):
        a=i*math.tau/16
        b=(i+1)*math.tau/16
        def at(radius,angle):return (x+radius*math.cos(angle),y,z+radius*math.sin(angle))
        m.prism([at(r*.76,a),at(r*.94,a),at(r*.94,b),at(r*.76,b)],(0,.070,0),'wood')
        m.prism([at(r*.93,a),at(r,a),at(r,b),at(r*.93,b)],(0,.086,0),'iron')
        if i%2==0:m.beam(at(r*.06,a),at(r*.81,a),.019,'wood')
    face(m,x,y-.012,z,(r*.22,r*.22),.106,'beam')
    face(m,x,y-.021,z,(r*.103,r*.103),.032,'metal')


def supply_wagon(m):
    for x,r in ((-.78,.40),(.70,.32)):
        m.beam((x,-.62,r),(x,.62,r),.062,'beam')
        wheel(m,x,-.59,r,r)
        wheel(m,x,.50,r,r)
    m.box(0,0,.40,1.97,1.01,.21,'beam')
    m.box(0,0,.59,1.92,.96,.13,'wood')
    for y in (-.47,.47):
        for z in (.73,.85):m.box(0,y,z,1.96,.075,.096,'wood')
        for x in (-.86,-.38,.42,.89):m.box(x,y*1.064,.68,.082,.079,.32,'beam')
    for x in (-.98,.98):m.box(x,0,.67,.075,.98,.29,'wood')
    for y in (-.31,.33):
        m.beam((.83,y,.50),(1.69,y*.45,.36),.050,'beam')
    for x,y,r,h in ((-.68,-.22,.23,.49),(-.56,.25,.20,.46)):
        m.rings(x,y,[(.71,r*.84,r*.84),(.78,r,r),(.71+h*.8,r,r),(.71+h,r*.84,r*.84)],12,'wood')
        for z in (.77,.71+h*.78):m.cylinder(x,y,z,r*1.017,.041,'iron',12)
    for x,y,r in ((.02,.17,.28),(.38,-.21,.27),(.66,.11,.25)):
        m.rings(x,y,[(.72,r*.88,r*.64),(.84,r,r*.78),(.99,r*.91,r*.73),
                      (1.10,r*.62,r*.51),(1.14,r*.22,r*.20)],9,'cloth',x*2.4)
        m.cylinder(x,y,1.115,r*.23,.044,'beam',8,r*.16)
    m.box(.74,-.38,.65,.28,.22,.35,'cut')
    m.beam((.59,-.52,.98),(.89,-.52,.74),.019,'beam')


def pennant(m,x,y,z,color):
    m.beam((x,y,z),(x,y,z+.58),.027,'wood')
    m.prism([(x,y,z+.57),(x+.46,y+.04,z+.50),(x+.25,y+.03,z+.40),
             (x+.47,y+.05,z+.32),(x,y,z+.37)],(0,.016,0),color)


def pirate_watch(m):
    m.box(-.34,.18,0,1.51,1.33,.25,'cut')
    m.box(-.34,.18,.25,1.28,1.10,1.59,'stone')
    m.box(-.34,.18,.63,1.34,1.16,.085,'wall')
    m.box(-.34,.18,1.38,1.36,1.18,.085,'wall')
    m.box(-.34,.18,1.84,1.50,1.31,.16,'cut')
    m.box(-.34,.18,2.00,1.33,1.13,.18,'wall')
    for x in (-.90,-.34,.22):
        for y in (-.315,.675):m.box(x,y,2.15,.22,.16,.26,'cut')
    for x in (-.90,.22):m.box(x,.18,2.15,.17,.23,.26,'cut')
    m.arch(-.34,-.387,.19,.43,.57,'dark')
    m.arch(-.34,-.381,1.10,.14,.29,'dark')
    for x in (-.93,.23):
        for i in range(5):
            m.box(x,-.392,.29+i*.285,.15+.08*(i%2),.035,.095,'wall')
    for i in range(4):
        m.box(-.34,-.66+i*.088,0,.54,.20,.052*(i+1),'stone')

    for i in range(8):
        x=.34+i*.166
        y=.28-i*.094
        m.cylinder(x,y,0,.100,.49+i%3*.045,'wood',8,.078)
        m.rings(x,y,[(.49+i%3*.045,.078,.078),(.63+i%3*.045,.018,.018)],8,'beam')
    m.beam((.35,.27,.27),(1.51,-.38,.31),.055,'beam')
    m.beam((-.39,.04,2.09),(-.39,.04,3.13),.038,'wood')
    m.prism([(-.39,.027,3.08),(.69,.033,2.98),(.47,-.005,2.75),
             (.77,-.026,2.57),(-.39,.024,2.61)],(0,.026,0),'watch-flag')


def pirate_hq(m):
    m.box(0,.34,0,2.08,1.55,.34,'stone')
    m.box(0,.39,.30,1.75,1.16,.79,'wood')
    m.roof(0,.39,1.08,1.91,1.33,.58,'roof','wall')
    for x in (-.81,-.39,.04,.43,.82):
        m.box(x,-.215,.33,.083,.075,.75,'beam')
    m.arch(.04,-.278,.31,.36,.50,'cave')
    for x in (-.58,.55):m.box(x,-.23,.78,.17,.053,.15,'dark')
    for x,y in ((-1.05,.48),(1.07,.67)):
        m.box(x,y,.03,.51,.53,1.42,'wall')
        m.box(x,y,1.43,.58,.59,.14,'wood')
        m.hip(x,y,1.57,.66,.63,.32,'roof')
        m.arch(x,y-.284,1.09,.17,.25,'cave')
    for i in range(8):
        x=-1.27+i*.178
        m.cylinder(x,-.61,0,.063,.39+i%3*.030,'wood',7,.036)
    for i in range(5):
        m.box(.04,-.86+i*.12,0,.57,.22,.07*(i+1),'stone')
    pennant(m,.93,.54,1.76,'iron')


def governors_hall(m):
    m.box(0,.40,0,2.77,1.22,.17,'stone')
    m.box(0,.48,.16,2.55,1.02,.92,'wall')
    m.hip(0,.48,1.08,2.69,1.20,.49,'roof')
    m.box(0,-.10,.19,2.37,.23,.57,'cut')
    for i in range(5):
        x=(i-2)*.463
        m.arch(x,-.231,.19,.318,.46,'dark',line=True)
        if i<4:m.box(x+.222,-.246,.18,.069,.10,.57,'cut')
    m.box(0,-.09,.78,2.49,.40,.08,'wood')
    for x in (-.83,-.42,.43,.86):m.arch(x,-.047,.87,.19,.18,'glass')
    m.box(0,.13,1.05,.61,.59,.74,'cut')
    m.hip(0,.13,1.80,.72,.69,.25,'roof')
    m.arch(0,-.175,1.41,.21,.28,'dark')
    for i in range(4):m.box(0,-.59+i*.11,0,.64,.23,.055*(i+1),'cut')
    pennant(m,0,.15,1.91,'sign')


def materials(key):
    out = detailed_materials(key)
    out['cave'] = W.B.material('해골 석굴 깊은 안쪽','211D19',19,.18,.95)
    out['iron'] = W.B.material('수레 바퀴 쇠테','454842',29,.16,.61)
    if key=='pirate-watch':
        out['watch-flag'] = W.B.material('망루의 붉은 깃발','A02B20',27,.13,.83)
    return out


def main():
    out = Path(sys.argv[sys.argv.index('--')+1]).resolve()
    configure(out,cell=368)
    W.B.PALETTES['skull-cave']=('B2A082','D3C3A6','5C6054','745C49','7D8058')
    W.B.PALETTES['supply-wagon']=('887151','CAB38C','5A5748','906C45','65764F')
    W.B.PALETTES['pirate-hq']=('817867','C4AE83','414A4B','805940','685349')
    W.B.PALETTES['pirate-watch']=('99846B','D2B895','53554D','8B6443','78653F')
    W.B.PALETTES['governors-hall']=('CFB38A','E5D0A8','A46044','985740','936941')
    W.B.materials=materials
    W.METER=4.9
    parts=[('skull-cave','skull-cave',1.13,.42,skull_cave),
           ('supply-wagon','supply-wagon',1.13,-.055,supply_wagon),
           ('pirate-hq','pirate-hq',1.04,.12,pirate_hq),
           ('governors-hall','governors-hall',1.01,.03,governors_hall),
           ('pirate-watch','pirate-watch',1.04,.10,pirate_watch)]
    frames=W.make_atlas('settlement-props',parts)
    (out/'layout.json').write_text(json.dumps(frames),encoding='utf8')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'settlement-props.blend'),compress=True)


if __name__=='__main__':main()
