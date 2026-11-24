"""노드 연결·실제 평가 속성을 확인한다. blender -b emerald_ocean.blend --python inspect.py"""
import bpy, json
from pathlib import Path
o = next(o for o in bpy.data.objects if any(m.type == 'OCEAN' for m in o.modifiers))
result = {'modifiers': [m.type for m in o.modifiers], 'materials': []}
for mat in bpy.data.materials:
    if mat.use_nodes:
        result['materials'].append({'name':mat.name,'nodes':[n.bl_idname for n in mat.node_tree.nodes],'links':len(mat.node_tree.links)})
for chop in [0, .45, .9]:
    oc=next(m for m in o.modifiers if m.type=='OCEAN'); oc.choppiness=chop
    ob=o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me=ob.to_mesh()
    attrs={}
    for name in ['ocean_foam','foam','coast_contact']:
        a=me.attributes.get(name)
        if a:
            v=[d.value if a.data_type=='FLOAT' else d.color[0] for d in a.data]
            attrs[name]={'domain':a.domain,'type':a.data_type,'min':min(v),'max':max(v),'mean':sum(v)/len(v)}
    result[str(chop)]={'vertices':len(me.vertices),'attributes':attrs}
    ob.to_mesh_clear()
assert result['modifiers']==['OCEAN','DISPLACE','NODES']
assert result['0.45']['attributes']['foam']['max']>result['0.45']['attributes']['foam']['min']
assert result['0.45']['attributes']['ocean_foam']['max']>result['0.45']['attributes']['ocean_foam']['min']
assert oc.resolution==16 and oc.viewport_resolution==12
assert any(n.bl_idname=='GeometryNodeSetPosition' for n in o.modifiers[-1].node_group.nodes)
assert any(n.bl_idname=='GeometryNodeInstanceOnPoints' for n in o.modifiers[-1].node_group.nodes)
water=o.data.materials[0]
assert all(abs(water.node_tree.nodes[name].inputs['IOR'].default_value-1.333)<.0001 for name in ['물 IOR 1.333 · 투과와 윤슬','연안 굴절 유리 · IOR 1.333'])
(Path(bpy.data.filepath).parent/'blender-inspection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('OCEAN_INSPECT',json.dumps(result,ensure_ascii=False),flush=True)
