"""곤충 30종의 원화·프레임·표본 연결에 쓰는 끝 장면·배포 목록을 검사한다."""
from pathlib import Path
import json
import re
from PIL import Image, ImageChops, ImageStat

ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'docs/art/insects-20261030-prompts.json').read_text(encoding='utf-8'))['assets']
ids=re.findall(r"^bug\('([^']+)'",(ROOT/'js/data/insects.js').read_text(encoding='utf-8'),re.M)
assert len(rows)==len(ids)==30 and set(ids)=={r['id'] for r in rows}
manifest=(ROOT/'images/manifest.js').read_text(encoding='utf-8')
def delta(a,b):return sum(ImageStat.Stat(ImageChops.difference(a.convert('RGB'),b.convert('RGB'))).mean)/3
for row in rows:
    iid=row['id'];assert (ROOT/row['target']).exists(),iid
    for f in row['files']:
        rel=f.removeprefix('images/'); key=str(Path(rel).with_suffix('')).replace('\\','/')
        assert f'"{key}": "{rel}"' in manifest,(iid,'목록 연결')
    with Image.open(ROOT/f'images/discoveries/{iid}.gif') as im:
        assert im.size==(576,256) and im.n_frames==18 and im.info.get('loop')==0,iid
        first=im.convert('RGB');duration=0
        for i in range(im.n_frames):im.seek(i);duration+=im.info['duration']
        last=im.convert('RGB');assert duration==7200 and delta(first,last)>1,(iid,duration)
    with Image.open(ROOT/f'images/discovery-ends/{iid}.jpg') as end:
        assert end.size==(576,256) and delta(end,last)<20,(iid,'끝 장면')
    with Image.open(ROOT/f'images/discovery-sheets/{iid}.webp') as sheet:
        assert sheet.size==(3456,768),(iid,sheet.size)
        assert delta(sheet.crop((2880,512,3456,768)),last)<20,(iid,'시트 끝 장면')
print('PASS: 곤충 30종 원화·576×256·18장면·7.2초 GIF·끝 장면·6열 시트·목록 연결')
