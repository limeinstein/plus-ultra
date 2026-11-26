"""본편에서 찍은 도시 화면과 검증 요약을 열 수 있는 갤러리를 만든다."""
import html
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT=Path(__file__).resolve().parents[2]/'artifacts/city-icons-world-20261126'
data=json.loads((OUT/'captures.json').read_text(encoding='utf-8'))['done']
city={row['file']:row for row in data}
captions={'london':'런던 탑 · 대도시','goa':'인도 연안 · 중도시','nagasaki':'일본 연안 · 소도시',
          'hanyang':'종묘와 궁궐','beijing':'자금성 일대','istanbul':'성 소피아와 톱카프 궁전',
          'cusco':'안데스 산지','mogadishu':'스와힐리 연안','tenochtitlan':'아즈텍 도읍'}
keys=list(captions)
paper=Image.new('RGB',(1500,911),'#f1ece1')
draw=ImageDraw.Draw(paper)
font=lambda size,bold=False:ImageFont.truetype('malgunbd.ttf' if bold else 'malgun.ttf',size)
draw.text((28,17),'전 세계 도시 아이콘',font=font(39,True),fill='#24352a')
draw.text((29,70),'항해·육상 탐험에서 찍은 실제 게임 화면',font=font(18),fill='#535d50')
for i,key in enumerate(keys):
    entry=city[key]
    x=25+(i%3)*489
    y=111+(i//3)*263
    cx,cy=(round(p*.8) for p in entry['anchor'])
    with Image.open(OUT/(key+'.png')) as im:
        crop=im.crop((cx-226,cy-132,cx+230,cy+79))
        paper.paste(crop.resize((473,219),Image.Resampling.LANCZOS),(x,y+30))
    draw.text((x+1,y),entry['name']+' · '+captions[key],font=font(17,True),fill='#26332a')
paper.save(OUT/'world-city-preview.webp','WEBP',quality=91,method=6)

cards=''.join(f'<figure><a href="{r["file"]}.png"><img loading="lazy" src="{r["file"]}.png" alt="{html.escape(r["name"])}"></a><figcaption>{html.escape(r["name"])}</figcaption></figure>' for r in data)
(OUT/'index.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>전 세계 도시 아이콘</title><style>
body{background:#f2ede2;color:#25322c;font:16px system-ui,sans-serif;margin:0}main{max-width:1480px;margin:auto;padding:25px clamp(15px,4vw,50px)}
a{color:#345c47;text-underline-offset:.2em}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:20px}
figure{margin:0}img{width:100%;display:block;border-radius:5px}figcaption{margin:7px 1px 11px}nav{display:flex;gap:18px;flex-wrap:wrap;margin:8px 0 31px}
</style><main><h1>전 세계 도시 아이콘</h1><p>본편 항해·육상에서 찍은 화면입니다. 그림을 누르면 원본이 열립니다.</p>
<nav><a href="chart.png">해도</a><a href="world-city-models.blend">블렌더 원본</a><a href="data-audit.json">시대별 도시 검사</a><a href="shore-audit.json">건물과 부두 위치 검사</a></nav><section>'''
+cards+'</section></main></html>',encoding='utf-8')
