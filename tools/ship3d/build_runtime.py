"""36종 실시간 선박 모형과 three r147을 로컬 스크립트로 묶는다.

실행: python tools/ship3d/build_runtime.py
제작 도구만 Python을 쓰며 게임은 file://에서도 서버·npm·fetch 없이 실행된다.
"""
import json
from pathlib import Path
from bake import specs

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
THREE = ROOT / 'tools/procedural_art/node_modules/three'


def main():
    vendor = ROOT / 'js/vendor'
    vendor.mkdir(exist_ok=True)
    if json.loads((THREE / 'package.json').read_text(encoding='utf-8'))['version'] != '0.147.0':
        raise RuntimeError('이 모형은 three 0.147.0으로 고정합니다')
    source = (THREE / 'build/three.min.js').read_text(encoding='utf-8')
    # 라이브러리의 버전 표식도 G 안에 둔다. 렌더러가 쓰는 실제 window/DOM은 그대로다.
    source = source.replace('window.__THREE__', '__galleonThreeNamespace.threeRevision')
    wrapped = "/* 로컬 three.js r147, MIT. 전역은 G.Three 하나로 묶는다. */\n"
    wrapped += "(function(G){var __galleonThreeNamespace=G,exports={},module={exports:exports};\n" + source
    wrapped += "\nG.Three=exports;})(window.G=window.G||{});\n"
    (vendor / 'three-r147.js').write_text(wrapped, encoding='utf-8')
    (vendor / 'THREE-LICENSE.txt').write_text((THREE / 'LICENSE').read_text(encoding='utf-8'), encoding='utf-8')
    source = "/* build_runtime.py 생성물. 수정 원본: tools/ship3d/의 모델·재질·미술·모션 파일. */\n"
    source += "(function(G){'use strict';var window={};\n"
    for name in ['ship3d_tex.js', 'ship3d_models.js', 'ship_detail_materials.js', 'galleon_detail.js', 'fleet_detail.js', 'ship_finish.js', 'turtle_detail.js', 'fleet_craft.js', 'rig_detail.js', 'runtime_rig.js']:
        source += (HERE / name).read_text(encoding='utf-8') + '\n'
    items = specs()
    if len(items) != len({s['id'] for s in items}):
        raise ValueError('중복 선종 ID')
    source += 'var specs=' + json.dumps({s['id']: s for s in items}, ensure_ascii=False, separators=(',', ':')) + ';\n'
    source += '''G.ShipModels={ids:Object.keys(specs),has:function(id){return Object.prototype.hasOwnProperty.call(specs,id);},
      create:function(T,id){
        if(!this.has(id))throw new Error('지원하지 않는 선종: '+id);
        window.Ship3D.init(T);var ship=new window.Ship3D.Ship(specs[id]);
        Object.keys(ship.C).forEach(function(k){ship.C[k]=ship.C[k].clone();});
        var data=G.FX.shipArt,p=data.profiles[id];if(!p)throw new Error('미술 프로필 누락: '+id);
        var look=Object.assign({},data.families.west,data.families[p.family],p);
        window.RigDetail.prepare(ship,G.FX.shipRig);
        if(id==='geobukseon')window.TurtleDetail.prepare(ship,G.FX.turtle3d);
        if(id==='galleon'||id==='lgalleon')ship=window.GalleonDetail.enrich(ship,T,Object.assign({},G.FX.ship3d,{art:look}));
        else ship=window.FleetDetail.enrich(ship,T,look,p);
        if(id==='geobukseon')window.TurtleDetail.enrich(ship,T,G.FX.turtle3d);
        ship=window.ShipFinish.enrich(ship,T,p);window.FleetCraft.enrich(ship,T,p);window.RigDetail.enrich(ship,T);ship.artProfile=p;return ship;
      },makeRig:function(ship,T,batch,cfg){return window.RuntimeRig.make(ship,T,batch,cfg);}
    };})(window.G=window.G||{});\n'''
    (ROOT / 'js/art/ship-models.js').write_text(source, encoding='utf-8')
    (ROOT / 'js/art/galleon-model.js').write_text("/* 이전 갤리온 비교 화면용 호환 이름. */\n(function(G){'use strict';G.GalleonModel={create:function(T){return G.ShipModels.create(T,'galleon');}};})(window.G=window.G||{});\n", encoding='utf-8')
    print(f'{len(items)}종 선박 모형·미술·동작과 three r147 생성 완료')


if __name__ == '__main__':
    main()
