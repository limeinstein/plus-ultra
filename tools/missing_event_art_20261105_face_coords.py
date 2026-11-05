"""이사회 단체 초상의 대표 얼굴을 먼저 찾고 원화 좌표로 되돌린다."""
import json
import re
import runpy
import sys
from pathlib import Path
import cv2

ROOT = Path(__file__).resolve().parents[1]
cv2.setNumThreads(2)
KEY = 'portraits/history/cw_heeren'
sys.argv = [str(ROOT / 'tools/portrait_faces.py'), '--key', KEY, '--merge']
namespace = runpy.run_path(str(ROOT / 'tools/portrait_faces.py'), run_name='face_coords')
assert namespace['main']() == 0
file = ROOT / 'js/data/portraitfaces.js'
text = file.read_text(encoding='utf-8')
face = json.loads(re.search(r'"' + KEY + r'": (\{[^\n]+\})', text).group(1))
plan = json.loads((ROOT / 'tools/missing_event_portraits_20261105_prompts.json').read_text(encoding='utf-8'))
crop = next(r['face_crop'] for r in plan['portraits'] if r['id'] == 'cw_heeren')
x, y, right, bottom = crop
w, h = right - x, bottom - y
out = {'box': [round((x + face['box'][0] * w) / 1024, 4), round((y + face['box'][1] * h) / 1536, 4), round(face['box'][2] * w / 1024, 4), round(face['box'][3] * h / 1536, 4)]}
for key in ['eyes', 'mouth']:
    out[key] = [round(((x + v * w) / 1024 if i % 2 == 0 else (y + v * h) / 1536), 4) for i, v in enumerate(face[key])]
text = re.sub(r'"' + KEY + r'_half": \{[^\n]+\}', '"' + KEY + '_half": ' + json.dumps(out, separators=(',', ':')), text)
file.write_text(text, encoding='utf-8', newline='\n')
print('Central director face coordinates mapped to knee portrait.')
