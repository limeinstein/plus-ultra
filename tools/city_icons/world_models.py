"""지역별 건물과 부두를 같은 지도 시점의 투명 아틀라스로 렌더한다."""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0,str(Path(__file__).parent))
import build as B

OUT=Path(__file__).resolve().parents[2]/'artifacts/city-icons-world-20261126'
RAW=OUT/'blender-renders'
RAW.mkdir(parents=True,exist_ok=True)
CELL=256
METER=5.4

# 벽, 석재, 지붕, 보조 지붕, 간판. 지붕 종류와 외벽 재질이 함께 바뀐다.
REGIONS={
    'iberia':('courtyard','CF9A61 E8DAB7 A45C45 98533B 407466'),
    'italy':('arcade','B78664 E5C9A1 A2583D A95E43 736E48'),
    'greek':('courtyard','B9AD90 E3D6B9 69808B B57451 3C6878'),
    'france':('gable','BFAF91 DACCAB 3C4C5B 854939 954C40'),
    'britain':('tudor','AFA48C D7CDB3 37474E 744B3A 854638'),
    'germany':('tudor','C09D72 E2CCA9 48505A 944C37 638071'),
    'easteurope':('timber','B58F68 DEC8A4 695544 925B45 6D7651'),
    'nordic':('timber','A87755 D5AB7E 465359 9D5743 5C746B'),
    'russia':('onion','B99572 E5D0B1 52766B 98644E 578389'),
    'islam':('ottoman','BA816C DAC6AA 4E626A 835440 4C6E67'),
    'arabia':('adobe','B88855 E0BB82 8D6B46 A36744 4C7366'),
    'persia':('persia','BF9366 D9BA8A 288C91 638976 267778'),
    'westafrica':('sahel','AF7849 D1A368 84643E B28851 875343'),
    'eastafrica':('swahili','BBAB8B E5D1A9 80613F 9F7649 528576'),
    'india':('india','B5805D E6C49A AA684A A85941 708278'),
    'southeast':('temple','BD9A70 E2C58D 895B43 B37B43 678352'),
    'maritime':('stilt','9C744C D2A774 705337 A77149 5F8176'),
    'philippines':('stilt','AF8856 E0C38E 735936 9B6E43 7E8054'),
    'china':('china','AA6550 DDC19F 4D6363 955B43 9E4E3E'),
    'mongolia':('yurt','BC9874 E1CB9E 72826E 9A654D 956749'),
    'korea':('hanok','9F785B DBC3A1 424D54 727760 755C4B'),
    'japan':('japan','AC9D82 E1CFB2 393F45 68706F 865644'),
    'vietnam':('vietnam','AC8257 D8BC86 47645C A05C43 778948'),
    'inca':('andes','98907A C8B495 9A7B50 AE925B 7C6454'),
    'aztec':('meso','A49B80 CEB995 786A43 A66440 687A51'),
    'mexico':('courtyard','B99768 E0C899 A05C48 996E41 4C8277'),
    'colonial':('arcade','C39C70 E4CEAA 8F6042 B47254 778967'),
    'native':('longhouse','A98954 C6A87D 846746 A2875B 6A7C51'),
}
ROLES=['tavern','inn','market','trade','library','palace','manor','home']


def layered_roof(m,x,y,z,w,d,rise,color='roof'):
    # 모서리가 들린 용마루와 두 겹 처마.
    m.hip(x,y,z,w,d,rise,color)
    for sx in (-1,1):
        for sy in (-1,1):
            a=(x+sx*w*.28,y+sy*d*.28,z+rise*.6)
            b=(x+sx*w*.485,y+sy*d*.485,z+.045)
            c=(x+sx*w*.55,y+sy*d*.54,z+.12)
            m.beam(a,b,.033,color)
            m.beam(b,c,.026,color)
    m.beam((x-w*.34,y,z+rise+.03),(x+w*.34,y,z+rise+.03),.03,color)


def house(m,style,role):
    w,d,h = {'tavern':(1.27,.86,.77),'inn':(1.18,1.02,.81),'trade':(1.52,1.04,.94),
               'library':(1.67,1.10,1.06),'home':(1.40,1.03,.96),'manor':(2.02,1.27,1.20)}[role]
    if style=='yurt':
        radius=w*.50
        m.cylinder(0,0,0,radius,h*.55,'cloth',22)
        m.rings(0,0,[(h*.55,radius,radius),(h*.82,radius*.62,radius*.62),(h*.91,.15,.15)],22,'cut')
        for z in (.16,.35):
            m.cylinder(0,0,z,radius+.004,.026,'beam',22)
        m.box(0,-radius,.022,.32,.07,.43,'sign')
        return
    raised=.19 if style=='stilt' else .055
    m.box(0,0,raised,w,d,h-raised,'cut' if style not in ('timber','tudor','stilt','longhouse') else 'wood')
    if style=='stilt':
        for x in (-w*.4,w*.4):
            for y in (-d*.39,d*.39):
                m.box(x,y,0,.085,.085,.29,'beam')
        for i in range(5):
            m.box(0,-d*.5-(4-i)*.056,i*.036,.29,.074,.04,'wood')
    else:
        m.box(0,0,0,w+.08,d+.065,.104,'stone')
    if style in ('china','hanok','japan','vietnam','temple'):
        layered_roof(m,0,0,h,w+.35,d+.31,w*.29,'tile' if style=='vietnam' else 'roof')
        for x in (-w*.44,0,w*.44):
            m.box(x,-d/2-.017,.07,.061,.07,h-.061,'sign' if style in ('vietnam','china') else 'beam')
        m.box(0,-d/2,h*.78,w+.075,.075,.083,'beam')
        if role=='manor':
            m.box(0,.1,h,1.13,.65,.4,'cut')
            layered_roof(m,0,.1,h+.39,1.5,.98,.37)
    elif style in ('tudor','gable','timber','longhouse'):
        if style in ('tudor','gable'):
            m.box(0,-.049,h*.51,w+.08,d+.12,h*.49,'cut')
        m.roof(0,-.032,h,w+.1,d+.12,w*(.35 if style=='longhouse' else .54),'tile' if role=='tavern' else 'roof')
        yy=-d*.5-.113 if style in ('tudor','gable') else -d*.5-.023
        for x in (-w*.41,w*.41):
            m.box(x,yy,h*.45,.055,.06,h*.54,'beam')
            m.beam((x,yy,h*.48),(x*.21,yy,h*.95),.021,'beam')
        m.box(0,yy,h*.46,w+.07,.061,.064,'beam')
        if style!='longhouse':
            m.box(w*.26,d*.26,h+.13,.131,.15,.33,'wall')
    elif style in ('adobe','sahel','swahili','persia','meso'):
        m.box(0,0,h-.03,w+.08,d+.08,.1,'wall')
        for j in range(6):
            m.box((j-2.5)*w*.165,-d*.46,h+.05,w*.104,.09,.103,'cut' if style=='swahili' else 'wall')
        if style=='sahel':
            for z in (.38,.65,.89):
                for x in (-w*.36,0,w*.36):
                    m.beam((x,-d*.48,z),(x,-d*.5-.14,z),.023,'beam')
        if style=='persia':
            B.dome(m,0,.06,h,.40,.36,'copper')
    elif style in ('arcade','courtyard','ottoman','andes','india','onion','stilt'):
        if style=='ottoman':
            m.box(0,-.068,h*.57,w+.084,d+.13,h*.43,'wood')
            m.hip(0,-.025,h,w+.19,d+.22,w*.245,'tile')
        elif style in ('andes','stilt'):
            m.roof(0,0,h,w+.11,d+.16,w*.39,'roof')
        else:
            m.hip(0,0,h,w+.16,d+.17,w*.24,'tile')
        if style in ('arcade','courtyard','india'):
            m.box(0,-d*.48,h*.81,w+.04,.085,.071,'wall')
    door = .34 if style not in ('andes','meso') else .42
    m.arch(0,-d*.5-.044,.08,door,.57,'dark',style=='persia',True)
    for sign in (-1,1):
        x=sign*w*.29
        m.arch(x,-d*.5-.13,h*.55,.17,.21,'glass',style=='persia',style in ('courtyard','arcade','persia'))
        m.arch(w*.5+.015,sign*d*.22,h*.42,.17,.24,'glass',side=True)
    if role in ('tavern','inn','trade'):
        m.beam((w*.34,-d*.49,h*.71),(w*.34,-d*.5-.3,h*.71),.024,'beam')
        m.box(w*.34,-d*.5-.265,h*.42,.183,.042,.17,'sign')
        if role=='trade':
            for j in (-1,1):
                m.box(j*w*.36,-d*.5-.13,.023,.205,.237,.19,'wood')
        elif role=='inn':
            m.box(-w*.28,-d*.52-.08,.031,.23,.24,.115,'wood')
    if role in ('library','manor'):
        for x in (-w*.38,w*.38):
            m.cylinder(x,-d*.5-.13,.044,.047,.58,'cut',10)
        m.box(0,-d*.5-.135,.608,w*.9,.24,.063,'wall')
        m.box(0,-d*.5-.14,.022,w*.84,.31,.053,'stone')


def palace(m,key,style):
    special={'france':'paris','britain':'london','italy':'rome','iberia':'seville','islam':'istanbul'}
    if key in special:
        B.palace(m,special[key])
        return
    if style=='hanok':
        for step in range(3):
            m.box(0,.05,.07*step,2.86-step*.11,1.93-step*.12,.078,'stone' if step==0 else 'cut')
        for i in range(6):
            x=(i-2.5)*.426
            m.box(x,-.67,.21,.075,.081,.66,'sign')
            m.box(x+.186,-.56,.30,.291,.04,.43,'glass')
            for k in range(3):
                xx=x+.11+k*.063
                m.box(xx,-.586,.31,.019,.034,.408,'wood')
        m.box(0,.067,.24,2.30,1.27,.59,'wall')
        for z,w,d,h in ((.82,3.02,1.98,.44),(1.24,2.61,1.69,.49)):
            m.box(0,0,z-.03,w*.83,d*.71,.12,'sign')
            layered_roof(m,0,0,z,w,d,h)
        for i in range(5):m.box(0,-1.08+i*.092,i*.044,.6,.11,.049,'cut')
        return
    if style in ('china','hanok','japan','vietnam','temple'):
        m.box(0,0,0,2.89,1.81,.16,'stone')
        levels=3 if style in ('japan','temple') else 2
        for j in range(levels):
            w,d,z=2.55-j*.55,1.58-j*.29,.14+j*.72
            m.box(0,0,z,w,d,.68,'cut' if style=='japan' else 'wall')
            for i in range(6-j):
                x=(i-(5-j)/2)*w/(6-j)
                m.box(x,-d*.5-.04,z+.07,.075,.081,.53,'beam' if style=='japan' else 'sign')
                m.box(x+.117,-d*.5-.027,z+.30,.11,.05,.19,'dark')
            layered_roof(m,0,0,z+.67,w+.34,d+.33,.35,'roof')
        return
    if style in ('adobe','sahel','swahili','meso'):
        m.box(0,.02,0,2.38,1.47,1.0,'wall')
        B.crenels(m,0,.02,1.,2.38,1.46,'cut')
        for x in (-.91,.91):
            m.rings(x,-.42,[(0,.39,.35),(1.48,.30,.27),(1.73,.30,.27)],4,'cut',math.pi/4)
        m.arch(0,-.73,.017,.56,.76,'dark',False,True)
        for x in (-.55,.55):
            m.arch(x,-.73,.48,.21,.32,'dark')
        return
    if style in ('persia','india','onion'):
        m.box(0,0,0,2.32,1.45,.93,'wall')
        for x in (-.78,0,.78):
            m.box(x,.13,.85,.61,.63,.24,'cut')
            m.arch(x,-.742,.12,.36,.71,'dark',True,True)
            B.dome(m,x,.13,1.09,.43 if x else .55,.42 if x else .66,'copper' if style!='india' else 'cut')
        return
    house(m,style,'manor')
    for x in (-1.03,1.03):
        m.box(x,.2,0,.55,.72,1.62,'cut')
        if style in ('gable','timber','tudor','yurt','longhouse','stilt'):
            m.hip(x,.2,1.62,.69,.84,.47)
        else:
            B.crenels(m,x,.2,1.62,.55,.72,'wall')
        m.arch(x,-.17,.96,.15,.36,'dark',True)


def look(key,style,role,m):
    if role=='market':
        B.market(m)
    elif role=='palace':
        palace(m,key,style)
    else:
        house(m,style,role)


def rock_gate(m):
    for x in (-.49,.49):
        m.rings(x,.11,[(0,.43,.48),(.29,.42,.39),(.69,.23,.25),(1.04,.084,.118)],7,'stone')
    m.box(0,.23,0,1.16,.23,.11,'cut')
    for i in range(4):
        m.box(0,-.39+i*.15,i*.044,.62,.17,.051,'cut')


def sun(scene,name,where,energy,color):
    data=bpy.data.lights.new(name,'SUN')
    data.energy,data.angle,data.color=energy,.22,color
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.rotation_euler=Vector(where).to_track_quat('Z','Y').to_euler()


def make_atlas(key,parts):
    cols=4
    rows=math.ceil(len(parts)/cols)
    scene=bpy.data.scenes.new(key)
    bpy.context.window.scene=scene
    scene.render.engine='CYCLES'
    scene.render.film_transparent=True
    scene.render.image_settings.color_mode='RGBA'
    scene.render.resolution_x=CELL*cols
    scene.render.resolution_y=CELL*rows
    scene.render.resolution_percentage=100
    scene.cycles.samples=12
    scene.cycles.use_denoising=True
    scene.cycles.device='GPU' if gpu else 'CPU'
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
    world=bpy.data.worlds.new(key+' 하늘')
    world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.65,.80,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.47
    scene.world=world
    sun(scene,'부드러운 햇빛',(-5,-5,8),2.7,(1,.88,.72))
    sun(scene,'하늘 반사광',(5,2,6),.72,(.77,.89,1))
    camera=bpy.data.objects.new('지도 시점',bpy.data.cameras.new('지도 직교'))
    scene.collection.objects.link(camera)
    camera.location=B.CAMERA_ROT@Vector((0,0,40))
    camera.rotation_euler=B.CAMERA_ROT.to_euler()
    camera.data.type='ORTHO'
    camera.data.ortho_scale=cols*METER
    scene.camera=camera
    meta={}
    for i,(name,material_key,scale,angle,make) in enumerate(parts):
        col,row=i%cols,i//cols
        anchor=(.50,.73)
        dx=(col+anchor[0]-cols/2)*METER
        dy=(rows/2-row-anchor[1])*METER
        point=B.CAMERA_ROT@Vector((dx,dy,0))
        model=B.Model(scene.collection,name,B.materials(material_key),*point,angle=angle,scale=scale)
        make(model)
        model.object(True)
        meta[name]=[col*CELL,row*CELL,CELL,CELL,anchor[0]*CELL,anchor[1]*CELL]
    scene.render.filepath=str(RAW/(key+'.png'))
    if not REUSE or key in RERENDER or not Path(scene.render.filepath).is_file():
        print('도시 모형',key,flush=True)
        bpy.ops.render.render(write_still=True)
    return meta


if __name__=='__main__':
    REUSE='--reuse-renders' in sys.argv
    RERENDER=next((arg.split('=',1)[1].split(',') for arg in sys.argv if arg.startswith('--rerender=')),[])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    gpu=False
    try:
        prefs=bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type='CUDA'
        prefs.get_devices()
        for device in prefs.devices:
            device.use=device.type=='CUDA'
            gpu|=device.use
    except (TypeError,AttributeError,RuntimeError):
        pass
    meta={}
    for key,(kind,colors) in REGIONS.items():
        B.PALETTES[key]=tuple(colors.split())
        parts=[]
        for role in ROLES:
            scale=1.30 if role in ('palace','manor') else 1.82
            parts.append((role,key,scale,0,lambda m,k=key,s=kind,r=role:look(k,s,r,m)))
        meta[key]=make_atlas(key,parts)
    special=[]
    for city in ('paris','rome','istanbul','london','seville'):
        special.append((city,city,.96,0,B.LANDMARKS[city]))
    special.append(('gate','korea',1.7,0,rock_gate))
    meta['heritage']=make_atlas('heritage',special)
    meta['quays']=make_atlas('quays',[(str(i),'britain',1.75,i*math.tau/8,lambda m:B.harbor(m,'london')) for i in range(8)])
    (OUT/'atlas-source.json').write_text(json.dumps(meta,separators=(',',':')),encoding='utf-8')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'world-city-models.blend'),compress=True)
