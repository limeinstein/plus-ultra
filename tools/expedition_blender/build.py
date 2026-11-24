"""Blender 4.5: 회화 원화를 보존하는 2.5D 그림판 애니메이션·투명 시트 출력.

실행 전 prepare_painted.py. 구체 관절 인형이나 새 3D 인물로 그림을 대체하지 않는다.
원화의 얼굴·복식·팔다리 자세는 유지하고 UV 위치만 장면마다 넘긴다.
"""
import bpy, json, os
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/expedition-blender-painted-20261124'
data=json.loads((OUT/'sources.json').read_text(encoding='utf8'))
scene=bpy.data.scenes.new('회화 탐험대 · 2.5D 애니메이션')
bpy.context.window.scene=scene
scene.render.engine='CYCLES'
scene.cycles.samples=1
scene.cycles.use_denoising=False
scene.render.resolution_x=896;scene.render.resolution_y=256;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='Standard'
scene.render.fps=8
camera_data=bpy.data.cameras.new('정사영 · 원화 보존')
camera=bpy.data.objects.new('카메라',camera_data);scene.collection.objects.link(camera)
camera.location=(1.5,0,10);camera_data.type='ORTHO';camera_data.ortho_scale=4
scene.camera=camera
characters=['captain_m','captain_f','crew_m','scout_f']
names=['남성 제독','여성 제독 · 붉은 머리 · 모자 없음','남성 탐험대원','여성 탐험대원']
objects={};materials={}
for i,(character,name) in enumerate(zip(characters,names)):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(-.5,-4/7,0),(.5,-4/7,0),(.5,4/7,0),(-.5,4/7,0)],[],[(0,1,2,3)])
    uv=mesh.uv_layers.new()
    for loop,co in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=co
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.location.x=i
    obj['제작 방식']='회화 원화를 입힌 2.5D 그림판 · 정사영 카메라'
    obj['성별']='여성' if character in ('captain_f','scout_f') else '남성'
    for action in ['walk','run','idle']:
        card=obj if action=='walk' else obj.copy()
        if action!='walk':
            card.data=mesh.copy();scene.collection.objects.link(card)
            card.animation_data_clear()
        card.name=name+' · '+action
        objects[(character,action)]=card
        spec=data[character+'_'+action];count=spec['count']
        mat=bpy.data.materials.new(character+' · '+action);mat.use_nodes=True
        nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links
        uvnode=nodes.new('ShaderNodeTexCoord')
        mapping=nodes.new('ShaderNodeMapping');mapping.inputs['Scale'].default_value=(1/count,1/8,1)
        image=nodes.new('ShaderNodeTexImage');image.image=bpy.data.images.load(str(OUT/spec['file']),check_existing=True)
        image.image.pack();image.extension='CLIP';image.interpolation='Closest'
        emission=nodes.new('ShaderNodeEmission');transparent=nodes.new('ShaderNodeBsdfTransparent')
        mix=nodes.new('ShaderNodeMixShader');output=nodes.new('ShaderNodeOutputMaterial')
        links.new(uvnode.outputs['UV'],mapping.inputs['Vector']);links.new(mapping.outputs['Vector'],image.inputs['Vector'])
        links.new(image.outputs['Color'],emission.inputs['Color']);links.new(image.outputs['Alpha'],mix.inputs[0])
        links.new(transparent.outputs[0],mix.inputs[1]);links.new(emission.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],output.inputs['Surface'])
        # 모든 방향·동작을 .blend의 시간 막대에서 직접 재생할 수 있다.
        for d in range(8):
            start=d*9+({'walk':0,'run':4,'idle':8}[action])+1
            for f in range(count):
                mapping.inputs['Location'].default_value=(f/count,(7-d)/8,0)
                mapping.inputs['Location'].keyframe_insert(data_path='default_value',frame=start+f)
        materials[(character,action)]=(mat,mapping)
        card.data.materials.clear();card.data.materials.append(mat)
        for frame in range(1,73):
            phase=(frame-1)%9
            active='walk' if phase<4 else 'run' if phase<8 else 'idle'
            card.hide_render=card.hide_viewport=active!=action
            card.keyframe_insert(data_path='hide_render',frame=frame)
            card.keyframe_insert(data_path='hide_viewport',frame=frame)

scene.frame_start=1;scene.frame_end=72
for d,direction in enumerate(['북','북동','동','남동','남','남서','서','북서']):
    for action,offset,label in [('walk',0,'걷기'),('run',4,'달리기'),('idle',8,'서 있기')]:
        start=d*9+offset+1
        scene.timeline_markers.new(direction+' · '+label,frame=start)
        for f in range(1 if action=='idle' else 4):
            frame=start+f;scene.frame_set(frame)
            for character in characters:
                mat,mapping=materials[(character,action)]
                mapping.inputs['Location'].default_value=(f/data[character+'_'+action]['count'],(7-d)/8,0)
            scene.render.filepath=str(OUT/f'{action}-{d}-{f}.png')
            bpy.ops.render.render(write_still=True)
        print(direction,label,'완료',flush=True)
scene.frame_set(28)
scene['설명']='원화의 회화 질감을 보존한 2.5D 그림판. 구체 관절 3D 인물은 사용하지 않는다.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'expedition_painted.blend'))
print('회화 탐험대 Blender 출력 완료',flush=True)
