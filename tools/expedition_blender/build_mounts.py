"""탈것별 회화 원화를 Blender 2.5D 그림판으로 재생하고 게임 시트용 PNG를 출력한다."""
import bpy,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/expedition-mounts-20261124'
specs=json.loads((OUT/'sources.json').read_text(encoding='utf8'))
scene=bpy.data.scenes.new('탐험대 · 탈것별 회화 애니메이션');bpy.context.window.scene=scene
scene.render.engine='CYCLES';scene.cycles.samples=4;scene.cycles.use_denoising=False
scene.view_settings.view_transform='Standard';scene.render.film_transparent=True
scene.render.resolution_x=384;scene.render.resolution_y=256;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.fps=8;scene.frame_start=1;scene.frame_end=32
camera_data=bpy.data.cameras.new('정사영 카메라');camera_data.type='ORTHO';camera_data.ortho_scale=1.5
camera=bpy.data.objects.new('카메라',camera_data);scene.collection.objects.link(camera);camera.location=(0,0,10);scene.camera=camera
cards={};maps={}
for index,(name,spec) in enumerate(specs.items()):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata([(-.75,-.5,0),(.75,-.5,0),(.75,.5,0),(-.75,.5,0)],[],[(0,1,2,3)])
    uv=mesh.uv_layers.new()
    for loop,co in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=co
    ob=bpy.data.objects.new(name,mesh);scene.collection.objects.link(ob);ob.location.x=index*1.8;cards[name]=ob
    ob['이동 수단']=spec['kind'];ob['인물']=spec['character'];ob['제작 방식']='회화 원화의 2.5D 그림판 · 네 걸음 자세'
    mat=bpy.data.materials.new(name);mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links
    coords=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeMapping');mapping.inputs['Scale'].default_value=(.25,.125,1)
    texture=nodes.new('ShaderNodeTexImage');texture.image=bpy.data.images.load(str(OUT/spec['file']),check_existing=True);texture.image.pack();texture.interpolation='Closest';texture.extension='CLIP'
    emission=nodes.new('ShaderNodeEmission');transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');output=nodes.new('ShaderNodeOutputMaterial')
    links.new(coords.outputs['UV'],mapping.inputs['Vector']);links.new(mapping.outputs['Vector'],texture.inputs['Vector'])
    links.new(texture.outputs['Color'],emission.inputs['Color']);links.new(texture.outputs['Alpha'],mix.inputs[0]);links.new(transparent.outputs[0],mix.inputs[1]);links.new(emission.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],output.inputs['Surface'])
    mesh.materials.append(mat);maps[name]=mapping
    for d in range(8):
        for f in range(4):
            mapping.inputs['Location'].default_value=(f/4,(7-d)/8,0)
            mapping.inputs['Location'].keyframe_insert(data_path='default_value',frame=d*4+f+1)
    if mat.node_tree.animation_data and mat.node_tree.animation_data.action:
        for curve in mat.node_tree.animation_data.action.fcurves:
            for point in curve.keyframe_points:point.interpolation='CONSTANT'
filters=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for name in specs:
    if filters and not any(name==token or name.endswith('_'+token) for token in filters):continue
    camera.location.x=cards[name].location.x
    for other,ob in cards.items():ob.hide_render=other!=name
    for d in range(8):
        for f in range(4):
            scene.frame_set(d*4+f+1)
            scene.render.filepath=str(OUT/f'{name}-{d}-{f}.png')
            bpy.ops.render.render(write_still=True)
    print(name,'출력 완료',flush=True)
for ob in cards.values():ob.hide_render=False
camera.location.x=cards[next(iter(cards))].location.x;scene.frame_set(13)
for d,label in enumerate(['북','북동','동','남동','남','남서','서','북서']):scene.timeline_markers.new(label,frame=d*4+1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'expedition_mounts.blend'))
print('탈것 Blender 원본 저장 완료',flush=True)
