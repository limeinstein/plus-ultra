"""새 원화의 전체 미리보기·ZIP과 적용 뒤 비율 검사를 만든다."""
import hashlib
import html
import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
OUT=ROOT/'artifacts/event-frame-20261128'
assets=json.loads((HERE/'assets.json').read_text(encoding='utf-8'))
manifest=json.loads(re.search(r'G\.IMAGE_FILES\s*=\s*(\{[\s\S]*?\});',(ROOT/'images/manifest.js').read_text(encoding='utf-8'))[1])
baseline=json.loads((HERE/'audit.json').read_text(encoding='utf-8'))
rows=[]
for old in baseline['rows']:
    key=old['key'];file=manifest[key]
    expected=900/520 if key.startswith('events/home/') else 16/9 if key.startswith('events/colony/') else 2.25
    with Image.open(ROOT/'images'/file) as im:w,h=im.size
    rows.append(dict(key=key,file=file,width=w,height=h,expected=round(expected,6),ratio=round(w/h,6),bad=abs(w/h-expected)>.003))
bad=[r for r in rows if r['bad']]
assert not bad,bad
for a in assets:
    assert manifest[a['key']]==a['file'],a['key']
    assert hashlib.sha256((ROOT/'images'/a['originalFile']).read_bytes()).hexdigest()==a['originalSha256']
    assert hashlib.sha256((ROOT/'images'/a['file']).read_bytes()).hexdigest()==a['sha256']
report=dict(scanned=len(rows),corrected=len(assets),groups=dict(Counter(a['key'].split('/')[0] for a in assets)),nativeHome=22,nativeColony=5,bad=bad,rows=rows)
(OUT/'audit-after.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
cards=[]
for a in assets:
    key=html.escape(a['key']);img='../../images/'+a['file'];old='../../images/'+a['originalFile']
    cards.append(f'<article><h2>{key}</h2><a href="{img}"><img src="{img}" alt="{key}" loading="lazy"></a><p>1881 × 836 · 9:4　<a href="{old}">이전 원화</a>　<a href="{img}" download>새 원화 저장</a></p></article>')
screens=''.join(f'<a href="game-{mode}-1280.png"><img src="game-{mode}-1280.png" alt="게임에서 확인한 {mode} 장면"></a>' for mode in ('gold','jhook'))
doc='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>이벤트 컷신 액자 비율 수정 · 87장</title><style>body{margin:0;background:#12171e;color:#eee6d5;font:16px/1.6 system-ui,sans-serif}header,main{max-width:1500px;margin:auto;padding:24px}a{color:#e7bf73}h1{font-size:28px}h2{font-size:14px;overflow-wrap:anywhere}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}article{background:#202731;padding:14px;border-radius:10px}img{display:block;width:100%;height:auto}p{margin:10px 0}.screens{display:grid;grid-template-columns:1fr 1fr;gap:20px}@media(max-width:700px){.screens{grid-template-columns:1fr}}</style><header><h1>이벤트 컷신 액자 비율 수정 · 87장</h1><p>9:4 액자에 맞춰 배경을 확장한 새 원화입니다. 인물·표정·손·소품을 살리고, 원본도 보관했습니다.</p><p><a href="event-frame-20261128.zip">원화 87장 ZIP</a> · <a href="audit-after.json">전체 비율 검사</a> · <a href="browser-checks.json">실제 게임 검사</a> · <a href="../../tools/event_frame_20261128/prompts.json">제작 지시문</a></p><div class="screens">'''+screens+'</div></header><main class="grid">'+''.join(cards)+'</main></html>'
(OUT/'index.html').write_text(doc.replace('87장',f'{len(assets)}장').replace('/prompts.json','/used-prompts.json'),encoding='utf-8')
with zipfile.ZipFile(OUT/'event-frame-20261128.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
    for a in assets:z.write(ROOT/'images'/a['file'],'images/'+a['file'])
    for name in ('prompts.json','used-prompts.json','assets.json','asset-overrides.json','selection.json'):z.write(HERE/name,'metadata/'+name)
    z.write(OUT/'audit-after.json','metadata/audit-after.json')
print(json.dumps({k:v for k,v in report.items() if k!='rows'},ensure_ascii=True))
