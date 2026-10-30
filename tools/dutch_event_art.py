#!/usr/bin/env python3
"""네덜란드 독립 이벤트의 내장 ImageGen 원화를 게임 규격으로 내보낸다."""
from pathlib import Path
import json
import sys
from PIL import Image
import history_event_art as export

ROOT=Path(__file__).resolve().parents[1]
def materialize_faces():
    """따로 다시 그린 정면 얼굴상은 무릎상에서 잘라낸 옛 얼굴로 덮지 않는다."""
    assets=json.loads(export.SPECS.read_text(encoding='utf-8'))['assets']
    for asset in assets:
        if asset['type']!='portrait' or not asset.get('face_source'):
            continue
        source=ROOT/asset['face_source']
        with Image.open(source) as opened:
            face=opened.convert('RGBA')
        assert face.width==face.height and face.width>=1024, (asset['id'],'얼굴상 규격')
        assert face.getchannel('A').getextrema()==(0,255), (asset['id'],'투명 배경')
        target=ROOT/'images'/asset.get('portrait_dir','portraits/history')/(asset['id']+'.webp')
        export.save_asset(face,target,lossless=True,method=6,exact=True)

if __name__=='__main__':
    export.OUT=ROOT/'artifacts/dutch-event-art-20261028'
    export.SPECS=ROOT/'tools/dutch_event_art_prompts.json'
    if '--faces-only' not in sys.argv:
        export.materialize()
    materialize_faces()
    if '--faces-only' not in sys.argv:
        export.preview()
    print('네덜란드 이벤트 원화 내보내기 완료')
