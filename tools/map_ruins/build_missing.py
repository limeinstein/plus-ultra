"""지도와 거리에서 전용 외관이 없던 유적만 렌더한다."""
import json
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0,str(Path(__file__).resolve().parent))
from build_models import W, configure, cliff, column, frustum, rubble, steps, weathered_materials


def detailed_materials(key):
    materials=weathered_materials(key)
    for part in ('wall','cut','stone','roof','tile','wood','beam','soil','leaf'):
        mat=materials[part]
        if mat.get('map-ruin-detail'):
            continue
        mat['map-ruin-detail']=True
        nodes,links=mat.node_tree.nodes,mat.node_tree.links
        shader=nodes.get('Principled BSDF')
        coord=next(node for node in nodes if node.type=='TEX_COORD').outputs['Object']

        def noise(name,vector,scale,detail):
            n=nodes.new('ShaderNodeTexNoise')
            n.label=name
            n.inputs['Scale'].default_value=scale
            n.inputs['Detail'].default_value=detail
            n.inputs['Roughness'].default_value=.73
            links.new(vector,n.inputs['Vector'])
            return n

        def stain(label,source,color_low,color_high,weight):
            ramp=nodes.new('ShaderNodeValToRGB')
            ramp.label=label
            a,b=ramp.color_ramp.elements
            a.position,a.color=.28,(*color_low,1)
            b.position,b.color=.72,(*color_high,1)
            links.new(source,ramp.inputs['Fac'])
            mix=nodes.new('ShaderNodeMixRGB')
            mix.blend_type='MULTIPLY'
            mix.inputs[0].default_value=weight
            links.new(shader.inputs['Base Color'].links[0].from_socket,mix.inputs[1])
            links.new(ramp.outputs['Color'],mix.inputs[2])
            links.new(mix.outputs[0],shader.inputs['Base Color'])

        mineral=part in ('wall','cut','stone','roof','tile')
        stretch=nodes.new('ShaderNodeVectorMath')
        stretch.operation='MULTIPLY'
        stretch.inputs[1].default_value=(1.7,1.7,.38) if part not in ('wood','beam') else (2.6,2.6,.24)
        links.new(coord,stretch.inputs[0])
        runoff=noise('빗물 자국과 나뭇결',stretch.outputs[0],10,2.5)
        stain('오래된 표면의 색 변화',runoff.outputs['Fac'],(.20,.23,.18),(1.19,1.13,1.03),.52 if mineral else .44)

        grain=noise('석재 알갱이',coord,71 if mineral else 48,2)
        if mineral:
            warp=noise('갈라진 모서리',coord,24,2)
            amount=nodes.new('ShaderNodeVectorMath')
            amount.operation='SCALE'
            amount.inputs['Scale'].default_value=.088
            links.new(warp.outputs['Color'],amount.inputs[0])
            bent=nodes.new('ShaderNodeVectorMath')
            bent.operation='ADD'
            links.new(coord,bent.inputs[0])
            links.new(amount.outputs[0],bent.inputs[1])
            seams=nodes.new('ShaderNodeTexVoronoi')
            seams.feature='DISTANCE_TO_EDGE'
            seams.label='깨어진 석재와 유약의 가장자리'
            seams.inputs['Scale'].default_value=11 if part in ('wall','stone') else 15
            links.new(bent.outputs[0],seams.inputs['Vector'])
            joints=nodes.new('ShaderNodeMath')
            joints.operation='MULTIPLY'
            joints.use_clamp=True
            joints.inputs[1].default_value=12
            links.new(seams.outputs['Distance'],joints.inputs[0])
            stain('깨진 틈의 광물색',joints.outputs[0],(.31,.29,.24),(1.08,1.11,1.05),.46 if part!='tile' else .30)
            relief=nodes.new('ShaderNodeMath')
            relief.operation='MULTIPLY_ADD'
            links.new(grain.outputs['Fac'],relief.inputs[0])
            relief.inputs[1].default_value=.63
            links.new(joints.outputs[0],relief.inputs[2])
            grain_height=relief.outputs[0]
        else:
            grain_height=grain.outputs['Fac']
        bump=nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value=.49 if mineral else .33
        bump.inputs['Distance'].default_value=.043 if mineral else .028
        links.new(shader.inputs['Normal'].links[0].from_socket,bump.inputs['Normal'])
        links.new(grain_height,bump.inputs['Height'])
        links.new(bump.outputs['Normal'],shader.inputs['Normal'])
        if part in ('wall','cut','stone','wood','beam'):
            shade=nodes.new('ShaderNodeAmbientOcclusion')
            shade.inputs['Distance'].default_value=.24
            shade.samples=8
            shade.only_local=True
            shade.label='기둥과 벽돌 사이의 그늘'
            links.new(shader.inputs['Base Color'].links[0].from_socket,shade.inputs['Color'])
            links.new(shade.outputs['Color'],shader.inputs['Base Color'])
    return materials


def wall(m,x,y,z,w,d,h,crenel=False):
    m.box(x,y,z,w,d,h-.057,'wall')
    m.box(x,y,z+h-.060,w+.025,d+.025,.061,'cut')
    if crenel:
        count=max(2,int(w*5))
        for i in range(count):
            m.box(x+w*((i+.5)/count-.5),y-d*.32,z+h,w/count*.47,d*.41,.12,'cut')


def timbuktu(m):
    m.box(-.19,.49,0,2.74,1.55,.56,'wall')
    for x in (-1.43,-1.03,-.62,-.22,.19,.60,.99):
        frustum(m,x,-.31,0,.22,.31,.77,.61,'cut')
        m.cylinder(x,-.31,.76,.075,.13,'wall',7,.025)
        for z in (.35,.61):
            m.beam((x,-.51,z),(x,-.15,z),.025,'beam')
    for x,y,h in ((1.11,.40,1.12),(-.67,.60,1.85)):
        frustum(m,x,y,0,.60,.64,h,.41,'wall')
        for i in range(5):
            w=.57-.07*i
            m.beam((x-w*.7,y-w*.54,.51+i*.22),(x+w*.7,y-w*.54,.51+i*.22),.025,'beam')
    for x,y in ((-.74,-.89),(.22,-1.05),(.86,-.65)):
        m.box(x,y,0,.48,.42,.32,'wall')
        m.arch(x,y-.214,.015,.14,.20,'dark')


def pompeii(m):
    for x,y,w,d in ((-.86,.34,1.24,1.35),(.83,.47,1.20,1.23),(.79,-.60,1.07,.68)):
        m.box(x,y,0,w,d,.07,'stone')
        for sign in (-1,1):
            wall(m,x+sign*w*.45,y,.07,.11,d,.47)
        wall(m,x,y+d*.45,.07,w,.11,.50)
        for i in range(4):
            m.box(x+(i-1.5)*w*.18,y-d*.48,.07,w*.10,.10,.25+i%2*.08,'wall')
        m.cylinder(x,y,.07,.28,.048,'cut',12)
    for x in (-1.28,-.87,-.46,.26,.67,1.08):
        column(m,x,.95,.07,.41 if x<0 else .62,.047,broken=x<0)
    m.cylinder(.91,-.58,.09,.17,.20,'tile',12)
    rubble(m,-.56,-.67,22,.66)


def tiled_portal(m,x,y,w,h):
    for dx in (-w*.43,w*.43):
        m.box(x+dx,y,0,w*.175,.29,h-.024,'tile')
        m.box(x+dx,y-.157,.08,w*.115,.025,h*.82,'sign')
    m.box(x,y,h*.72,w,.30,h*.28,'tile')
    m.box(x,y,h-.009,w+.027,.324,.047,'cut')
    m.arch(x,y-.158,.05,w*.65,h*.82,'dark',point=True,line=True)
    for i in range(6):
        m.box(x-w*.41+i*w*.164,y-.176,h*.84,w*.065,.022,.048,'cut')
    for i in range(7):
        for dx in (-w*.44,w*.44):
            m.box(x+dx,y-.183,.18+i*h*.095,w*(.04 if i%2 else .065),.013,.042,'cut')


def madrasa(m,x,y,w,d,h):
    m.box(x,y,0,w,d,.52,'wall')
    tiled_portal(m,x,y-d/2-.06,w*.64,h)
    for dx in (-w*.45,w*.45):
        column(m,x+dx,y-d*.48,0,h*.89,.096,'tile')
        W.B.dome(m,x+dx,y-d*.46,h*.91,.107,.13,'tile')
    for i in range(5):
        m.arch(x+(i-2)*w*.16,y-d*.505,.09,w*.126,.34,'dark',point=True)


def registan(m):
    madrasa(m,0,.82,2.65,.81,1.49)
    m.box(-1.17,.08,0,.37,1.18,.46,'wall')
    for y in (.18,.64):
        W.B.dome(m,-1.17,y,.48,.22,.22,'tile')
    for i in range(8):
        m.box(.17+i*.105,-.59,.004,.075,.32,.026,'stone')


def imam(m):
    madrasa(m,0,.78,2.62,.77,1.53)
    W.B.dome(m,0,.88,.55,.53,.73,'tile')
    for x in (-1.24,1.24):
        m.box(x,-.23,0,.43,1.12,.40,'wall')
        for y in (-.62,-.26,.10):
            m.arch(x+.221,y,.08,.22,.28,'dark',point=True,side=True)
        m.box(x,-.73,.40,.46,.30,.14,'stone')
    m.box(-1.06,-.77,0,.67,.41,.55,'wall')
    m.hip(-1.06,-.77,.56,.74,.51,.12,'roof')


def western_wall(m):
    for row in range(8):
        for i in range(8):
            x=-1.62+i*.43+(row%2)*.12
            h=.16 if row<6 else .13
            m.box(x,.33,row*.146,.408,.51+i%3*.014,h,'stone' if (row*5+i)%4==1 else 'wall')
    for x in (-1.8,1.73):
        wall(m,x,.52,0,.20,.76,1.24)
    for i in range(7):
        m.box(-1.45+i*.46,-.32,0,.34,.32,.028,'cut')


def arch_ring(m,x,y,z,w,d,raised=.46):
    for i in range(11):
        a,b=i*math.pi/11,(i+1)*math.pi/11
        def at(r,t):return x+w*r*math.cos(t),y,z+raised*r*math.sin(t)
        m.prism([at(.77,a),at(1,a),at(1,b),at(.77,b)],(0,d,0),'tile' if i%2 else 'cut')


def cordoba(m):
    m.box(.13,.22,0,2.38,1.43,.54,'wall')
    for i in range(6):
        m.roof(-.89+i*.403,.23,.54,.35,1.44,.12,'roof','wall')
    for x in (-1.03,-.52,-.01,.50,1.01):
        column(m,x,-.67,0,.43,.055)
    for x in (-.775,-.265,.245,.755):
        arch_ring(m,x,-.72,.42,.264,.24,.28)
    frustum(m,-1.28,.21,0,.41,.40,1.20,.85,'wall')
    m.box(-1.28,.21,1.19,.44,.43,.09,'cut')
    m.arch(-1.28,.027,.84,.14,.28,'dark')


def cologne(m):
    m.box(0,.25,0,1.17,2.3,1.12,'wall')
    m.roof(0,.25,1.12,1.2,2.35,.44,'roof','wall')
    for x in (-.45,.45):
        h=1.39 if x<0 else 1.88
        m.box(x,-.87,0,.56,.63,h,'stone')
        for z in (.42,.92,h-.38):
            m.arch(x,-1.21,z,.194,.29,'dark',point=True,line=True)
        m.box(x,-.87,h,.60,.67,.08,'cut')
    m.beam((.45,-.88,1.94),(.45,-.88,2.38),.033,'wood')
    m.beam((.45,-.88,2.31),(1.23,-.87,2.31),.029,'wood')
    m.beam((.45,-.88,2.05),(1.21,-.87,2.31),.014,'beam')
    for y in (-.44,.08,.60,1.14):
        column(m,.69,y,0,1.22,.073,'stone')
        m.beam((.72,y,.88),(.57,y,1.22),.062,'cut')


def rialto(m):
    for i in range(18):
        a,b=i*math.pi/18,(i+1)*math.pi/18
        def at(r,t):return (1.63*r*math.cos(t),-.36,.99*r*math.sin(t))
        m.prism([at(.85,a),at(1.0,a),at(1.0,b),at(.85,b)],(0,.72,0),'cut' if i%4 else 'wall')
    for i in range(-6,7):
        x=i*.246
        z=.99*math.sqrt(max(0,1-(x/1.63)**2))
        m.box(x,0,z,.254,.80,.115,'stone')
        if i:
            for y in (-.31,.31):
                m.box(x,y,z+.11,.238,.22,.25,'wall')
                m.roof(x,y,z+.35,.23,.24,.087,'roof','wall')
    for x in (-1.58,1.58):
        m.box(x,0,0,.28,.87,.26,'wall')


def cheomseongdae(m):
    m.box(0,0,0,1.29,1.30,.19,'stone')
    for i in range(13):
        z=.19+i*.126
        r=.53-i*.013+.049*math.exp(-i/3)
        for j in range(12):
            if i in (6,7,8) and j in (8,9):
                continue
            a=(j+i%2*.42)*math.tau/12+.012*math.sin(i*1.7+j)
            b=a+math.tau/12-.020-.011*math.cos(j*4+i*2)
            outer=r+.019*math.sin(j*6.6+i*2.3)
            m.prism([(rr*math.cos(t),rr*math.sin(t),z) for rr,t in ((r-.11,a),(outer,a),(outer,b),(r-.11,b))],
                    (0,0,.123),'wall' if (i+j)%5 else 'stone')
    for z in (1.83,1.93):
        for x in (-.37,.37):m.box(x,0,z,.16,.88,.105,'cut')
        for y in (-.36,.36):m.box(0,y,z,.63,.16,.105,'stone')


def stele(m):
    m.box(0,0,0,.93,.75,.14,'stone')
    m.rings(0,0,[(.12,.46,.33),(.28,.44,.32),(1.61,.37,.30),(1.96,.29,.25)],4,'stone',math.pi/4)
    for i in range(7):
        for j in range(16):
            if (i*8+j*13)%11<2:continue
            z=.32+j*.084
            m.box(-.24+i*.078,-.228+z*.019,z,.027,.011,.039,'wall')
    rubble(m,0,-.20,15,.69)


def koguryo(m):
    for x,y,r in ((-.68,.48,1.04),(.88,.46,.66)):
        m.rings(x,y,[(0,r,r*.91),(.09,r,r*.90),(.36,r*.80,r*.71),(.62,r*.48,r*.46),(.72,r*.18,r*.18)],16,'leaf')
    for x in (-.93,-.42):
        m.box(x,-.41,0,.17,.36,.39,'stone')
    m.box(-.68,-.43,.38,.78,.39,.15,'cut')
    m.arch(-.68,-.625,.018,.32,.39,'dark')
    steps(m,-.68,-.54,0,.39,.42,.11,4,'stone')
    rubble(m,-.39,-.62,12,.51)


def cholula(m):
    for i in range(5):
        w=3.53-i*.49
        frustum(m,0,.18,i*.18,w,w*.83,.18,.82,'leaf' if i>0 else 'soil')
    for j in range(6):
        x=-1.47+j*.50
        m.box(x,-1.20,0,.28,.18,.17,'cut')
    steps(m,0,-.62,.03,.56,.76,.54,11,'wall')
    m.box(.11,.19,.87,.89,.68,.26,'soil')
    for x in (-.24,.11,.46):
        m.box(x,-.08,.89,.07,.10,.22,'cut')


def chanchan(m):
    for x,y,w,d in ((.02,.43,3.1,1.61),(-.49,-.13,1.04,.92),(.80,-.55,1.14,1.30)):
        for sign in (-1,1):
            frustum(m,x+sign*w/2,y,0,.19,d,.49,.84,'wall')
        wall(m,x,y+d/2,0,w,.17,.49)
        for i in range(10):
            px=x-w*.46+w*.10*i
            m.box(px,y-d/2,0,w*.103,.18,.39,'wall')
            m.beam((px-.065,y-d/2-.10,.18),(px+.064,y-d/2-.10,.23),.019,'cut')
    steps(m,-.51,-.61,0,.37,.53,.12,4)


def kilwa_palace(m):
    for x,y,w,d,h in ((-.82,.48,1.13,1.36,.65),(.77,.48,1.20,1.24,.48),(-.86,-.66,.86,.61,.41)):
        for sign in (-1,1):wall(m,x+sign*w*.46,y,0,.16,d,h)
        wall(m,x,y+d*.49,0,w,.16,h)
        for dx in (-.23,.23):
            m.box(x+dx,y-d*.46,0,.16,.20,.42,'cut')
        arch_ring(m,x,y-d*.49,.32,.28,.22,.21)
    m.cylinder(.49,-.62,.015,.42,.065,'lead',8)
    m.rings(.49,-.62,[(0,.46,.46),(.12,.46,.46),(.12,.37,.37),(.04,.37,.37)],8,'wall',math.pi/8)
    rubble(m,-.25,-.43,17,.66)


def pantheon(m):
    m.cylinder(0,.47,0,1.03,.91,'wall',36)
    for z,r in ((.14,1.04),(.71,1.044),(.90,1.07)):
        m.cylinder(0,.47,z,r,.055,'stone',36)
    rings=[(.96,1.052,1.052),(1.03,.98,.98),(1.20,.86,.86),(1.34,.69,.69),
           (1.43,.51,.51),(1.49,.19,.19),(1.49,.127,.127),(1.39,.127,.127)]
    m.rings(0,.47,rings,36,'lead')
    m.cylinder(0,.47,1.38,.121,.007,'dark',24)
    for i in range(6):
        column(m,-.85+i*.34,-.93,.08,.76,.078)
    m.box(0,-.68,.85,2.09,.84,.11,'cut')
    m.roof(0,-.66,.96,2.05,.85,.38,'wall','cut')
    steps(m,0,-1.01,0,1.94,.43,.12,5)


def bath(m):
    m.box(0,.10,0,2.28,1.35,.055,'copper')
    for x in (-1.18,1.18):wall(m,x,.10,0,.16,1.43,.22)
    for y in (-.62,.82):wall(m,0,y,0,2.47,.14,.20)
    for x in (-1.1,-.67,-.24,.19,.62,1.05):
        column(m,x,.99,0,.73,.070)
        column(m,x,-.76,0,.35,.05,broken=True)
    m.box(-.36,1.0,.76,1.55,.23,.14,'cut')
    steps(m,0,-.21,0,.89,.45,.14,4,'stone')


def salt_mine(m):
    for x in (-.91,.96):
        cliff(m,x,.36,1.33,1.48,1.01,22+int(x*12),'stone')
    for y in (-.39,-.04,.33,.64):
        for x in (-.48,.48):m.box(x,y,0,.125,.12,.78,'wood')
        m.box(0,y,.73,1.14,.15,.145,'beam')
    m.box(0,.88,0,1.13,.18,.73,'dark')
    for x,y,z,r in ((.57,-.62,.02,.16),(-.72,-.41,.04,.21),(.60,-.52,0,.11),(-.61,-.69,0,.14)):
        m.rings(x,y,[(z,r,r),(z+r*.98,r*.85,r*.70),(z+r*1.50,r*.26,r*.21)],7,'cream')
    steps(m,0,-.20,0,.56,.88,.22,7,'stone')


def kyiv(m):
    cliff(m,.59,.31,2.31,1.53,.32,61,'stone')
    for x,y,w,d in ((-.42,.24,1.46,1.16),(-.92,-.42,.64,.70),(.32,.40,.83,.66)):
        m.box(x,y,.11,w,d,.52,'wall')
        m.hip(x,y,.63,w+.06,d+.08,.21,'roof')
    for x,y,r in ((-.47,.29,.33),(-.95,-.39,.17),(.26,.39,.19)):
        m.cylinder(x,y,.70,r*.71,.20,'wall',10)
        W.B.dome(m,x,y,.90,r,r*.78,'lead')
        m.beam((x,y,.90+r*.74),(x,y,1.12+r*.70),.021,'metal')
    m.arch(.81,-.45,.05,.28,.29,'dark')


def ravenna(m):
    m.cylinder(0,.37,0,1.05,.84,'wall',8)
    m.cylinder(0,.37,.84,1.08,.08,'cut',8)
    m.cylinder(0,.37,.91,.87,.33,'wall',8)
    m.cylinder(0,.37,1.23,.94,.33,'roof',8,.18)
    m.box(-.46,-.71,0,1.10,.65,.58,'wall')
    m.roof(-.46,-.71,.58,1.14,.69,.29,'roof','wall')
    m.cylinder(.88,.53,0,.187,.89,'wall',12)
    m.cylinder(.88,.53,.88,.211,.16,'roof',12,.024)
    for x in (-.49,-.21,.18,.53):
        m.arch(x,-.405,.34,.11,.37,'dark')
    m.arch(-.49,-1.052,.018,.26,.44,'dark',line=True)


def montserrat(m):
    for i in range(6):
        x=-1.47+i*.55
        cliff(m,x,.69,.78,.91,1.54+.59*math.sin(i*1.73)**2,32+i,'stone')
    for x,y,w,d,h in ((-.64,-.32,1.23,.59,.56),(.48,-.23,.91,.68,.75),(.93,.25,.54,.70,.68)):
        m.box(x,y,0,w,d,h,'wall')
        m.roof(x,y,h,w,d,.21,'roof','wall')
        for i in (-1,0,1):m.arch(x+i*w*.26,y-d*.52,.16,w*.12,.22,'dark')
    steps(m,-.26,-.64,0,.45,.51,.15,5)


def toledo(m):
    for x,y,h in ((-.90,.40,.37),(.11,.59,.57),(.93,.17,.28)):
        cliff(m,x,y,1.44,1.93,h,26+int(x*19),'stone')
    for i,(x,y) in enumerate(((-1.30,.13),(-.78,.42),(-.32,.65),(.18,.76),(.66,.52),(1.06,.20),(-.73,-.36),(.65,-.34))):
        z=.32+(.14 if abs(x)<.57 else 0)
        m.box(x,y,z,.45,.38,.33,'cut' if i%4 else 'wall')
        m.roof(x,y,z+.33,.45,.38,.17,'roof','wall')
    m.box(.06,.40,.55,.77,.69,.60,'wall')
    for x in (-.30,.42):
        for y in (.08,.76):
            m.box(x,y,.57,.23,.23,.79,'cut')
            m.hip(x,y,1.36,.28,.28,.14,'roof')
    m.hip(.06,.40,1.15,.80,.72,.20,'roof')
    wall(m,0,-.42,0,2.06,.17,.25,True)


def holsten(m):
    m.box(0,.16,0,1.81,.71,1.10,'wall')
    m.roof(0,.15,1.10,.75,1.82,.49,'roof','wall','x')
    m.arch(0,-.21,.02,.45,.66,'dark',point=True,line=True)
    for x in (-.96,.96):
        m.cylinder(x,0,0,.46,1.30,'wall',18)
        for z in (.48,.85,1.14):m.cylinder(x,0,z,.472,.040,'tile',18)
        m.cylinder(x,0,1.30,.51,.67,'roof',18,.033)
        m.cylinder(x,0,1.96,.035,.12,'metal',8,.010)
        for dx in (-.13,.10):m.arch(x+dx,-.438,.74,.085,.26,'dark',point=True)


def timber_hall(m,x,y,z,w,d,h):
    m.box(x,y,z,w,d,h*.85,'wall')
    for i in range(5):
        px=x+(i-2)*w*.22
        m.box(px,y-d*.52,z,.072,.077,h,'tile')
        if i<4:m.box(px+w*.10,y-d*.523,z+.16,.13,.021,h*.39,'dark')
    W.layered_roof(m,x,y,z+h,w*1.15,d*1.18,h*.76)


def horyuji(m):
    timber_hall(m,-.76,.41,.10,1.32,1.01,.56)
    W.layered_roof(m,-.76,.43,1.00,1.06,.80,.26)
    for i in range(5):
        w=.82-i*.12
        z=.10+i*.34
        m.box(.75,.31,z,w*.75,w*.72,.22,'wall')
        W.layered_roof(m,.75,.31,z+.19,w+.13,w+.11,.17)
    W.B.dome(m,.75,.31,1.75,.098,.34,'metal')
    steps(m,-.76,-.16,0,.89,.69,.14,6)


def kiyomizu(m):
    cliff(m,0,.79,2.97,1.63,.52,78,'stone')
    timber_hall(m,0,.47,.51,1.91,1.14,.59)
    for y in (-.88,-.57,-.26,.08):
        for x in (-.86,-.44,0,.44,.86):
            m.box(x,y,0,.075,.087,.54,'beam')
            if y>-.80:m.beam((x,y,0),(x,y-.30,.52),.026,'wood')
        m.box(0,y,.18,1.87,.049,.063,'wood')
    m.box(0,-.40,.51,2.05,1.18,.11,'wood')
    for i in range(12):m.box(-.95+i*.17,-.99,.62,.042,.049,.16,'wood')
    m.box(0,-.99,.76,2.01,.062,.059,'beam')


def changdeok(m):
    m.box(-.30,.35,0,2.26,1.58,.19,'stone')
    timber_hall(m,-.38,.42,.18,1.79,1.12,.54)
    W.layered_roof(m,-.38,.44,1.05,1.44,.90,.40)
    steps(m,-.36,-.39,0,.76,.54,.19,6)
    m.rings(1.25,.36,[(0,.47,.40),(.045,.47,.40),(.045,.41,.34),(.052,.40,.34)],12,'copper')
    timber_hall(m,1.15,.65,.08,.54,.51,.28)
    rubble(m,1.23,-.35,11,.50)


def suzhou(m):
    m.rings(.05,.12,[(.004,1.35,.85),(.035,1.29,.83)],16,'copper')
    timber_hall(m,.04,.81,.06,1.08,.54,.43)
    timber_hall(m,-.94,.48,.02,.61,.59,.37)
    for i in range(11):
        x=-1.03+i*.18
        y=-.30+.18*math.cos(i*.54)
        m.box(x,y,.05,.195,.23,.092,'stone')
        m.box(x,y-.108,.13,.198,.039,.067,'cut')
    for i in range(4):
        cliff(m,.94+i*.14,.62-i*.23,.43,.49,.36+i%2*.20,i+230,'stone')
    for x,y,size in ((-.97,.70,.23),(.68,.86,.27)):
        m.cylinder(x,y,0,.035,.49,'beam',7,.019)
        m.rings(x,y,[(.37,size*.51,size*.63),(.51,size,size*.87),(.67,size*.84,size*.72),
                       (.77,size*.41,size*.42)],9,'leaf',x)


def fort_jesus(m):
    m.box(0,.11,0,2.17,1.43,.52,'wall')
    for x,y in ((-1.14,-.61),(1.14,-.57),(-1.12,.78),(1.10,.79)):
        m.rings(x,y,[(0,.56,.50),(.06,.55,.49),(.56,.46,.41)],5,'wall',.20)
        m.rings(x,y,[(.56,.47,.43),(.66,.47,.42)],5,'cut',.20)
    wall(m,0,-.62,.48,2.06,.18,.17,True)
    wall(m,0,.82,.50,2.04,.16,.13,True)
    m.box(-.12,.38,.53,.96,.63,.39,'wall')
    m.roof(-.12,.38,.92,1.02,.68,.23,'roof','wall')
    m.arch(0,-.72,.02,.37,.39,'dark',line=True)


def kukulcan(m):
    steps(m,0,.54,0,.98,1.27,.76,12,'cut')
    for x in (-.66,.66):
        m.beam((x,-.56,.11),(x,.51,.82),.088,'wall')
        m.rings(x,-.79,[(0,.24,.26),(.13,.27,.29),(.31,.22,.19),(.40,.15,.125)],8,'wall')
        m.box(x,-.99,.07,.40,.21,.12,'stone')
        m.box(x,-1.064,.143,.34,.035,.043,'dark')
        for dx in (-.105,.105):m.box(x+dx,-.965,.26,.063,.039,.054,'stone')
        for i in range(3):
            m.beam((x-.16+i*.16,-.74,.23),(x-.20+i*.20,-.51,.37-i*.018),.035,'cut')


RECIPES = [
 ('ds_085','sudan',1.03,.08,timbuktu),
 ('ds_096','roman',1.07,0,pompeii), ('ds_301','tilework',1.02,0,registan),
 ('ds_303','tilework',1.02,0,imam), ('ds_309','greek',1.04,.13,western_wall),
 ('ds_313','moorish',1.03,0,cordoba), ('ds_315','cathedral',.99,.04,cologne),
 ('ds_325','roman',1.06,.11,rialto), ('ds_331','korea',1.18,.05,cheomseongdae),
 ('ds_333','korea',1.08,-.11,stele), ('ds_334','korea',1.09,0,koguryo),
 ('ds_356','inca',1.03,0,cholula), ('ds_358','adobe_ruin',1.07,.04,chanchan),
 ('ds_367','eastafrica',1.07,0,kilwa_palace), ('ds_677','roman',1.03,0,pantheon),
 ('ds_681','roman',1.05,.02,bath), ('ds_687','easteurope',1.00,0,salt_mine),
 ('ds_688','russia',1.06,.06,kyiv), ('ds_692','ravenna',1.01,0,ravenna),
 ('ds_695','iberia',.98,-.09,montserrat), ('ds_696','iberia',1.05,0,toledo),
 ('ds_700','lubeck',1.02,.01,holsten), ('ds_713','japan',1.03,0,horyuji),
 ('ds_714','japan',.97,0,kiyomizu), ('ds_716','korea',1.01,.07,changdeok),
 ('ds_720','china',1.08,.02,suzhou), ('ds_722','eastafrica',1.09,-.13,fort_jesus),
 ('ds_850','inca',1.35,.08,kukulcan),
]


def main():
    out = Path(sys.argv[sys.argv.index('--')+1]).resolve()
    configure(out,cell=416)
    W.B.materials=detailed_materials
    W.METER = 5.65
    for key, palette in {
        'roman':'B8A48C E1CCA8 78584B AD5F46 8D7659', 'sudan':'A37144 D4AC75 785042 8B5334 A48354',
        'adobe_ruin':'AE8150 D4AD79 7D725B 9C6E47 866742', 'tilework':'B48B64 E4CCA1 405F53 206878 328EA0',
        'moorish':'BA916A E0CDA9 985236 AE523C 6E7952', 'cathedral':'8B8176 C6B99E 494A42 7C614B 7B6E53',
        'ravenna':'B17B58 D5A97C 8F4839 994939 80705D', 'lubeck':'A25843 C69267 424746 75463A 895B49',
    }.items():
        W.B.PALETTES[key] = tuple(palette.split())
    layout = {}
    for i in range(0,len(RECIPES),12):
        group = f'completion-{i//12+1}'
        layout.update({site: [group,*rect] for site,rect in W.make_atlas(group,RECIPES[i:i+12]).items()})
    (out/'blender-layout.json').write_text(json.dumps(layout),encoding='utf-8')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'missing-ruins.blend'),compress=True)


if __name__=='__main__':
    main()
