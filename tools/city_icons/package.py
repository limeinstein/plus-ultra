"""투명 지도 스탬프, 원본 렌더 비교판, 로컬 갤러리를 만든다."""
import html
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).resolve().parents[2] / 'artifacts/city-icons-large-20261126'
data = json.loads((OUT / 'cities.json').read_text(encoding='utf-8'))
rows = json.loads((OUT / 'variants.json').read_text(encoding='utf-8'))
quays = json.loads((OUT / 'quays.json').read_text(encoding='utf-8'))
labels = {'landmark': '대표 발견물', 'palace': '후원자 건물', 'harbor': '항구', 'market': '시장',
          'trade': '교역소', 'tavern': '술집', 'inn': '여관', 'library': '도서관'}
order = ('landmark', 'palace', 'harbor', 'market', 'trade', 'library', 'tavern', 'inn')
scale_names = {1: '소', 2: '중', 3: '대'}
stamps = OUT / 'map-stamps'
stamps.mkdir(exist_ok=True)
(OUT / 'renders').mkdir(exist_ok=True)
assets = {}


def fit_stamp(key, width):
    render = Image.open(OUT / 'raw-renders' / (key + '.png')).convert('RGBA')
    alpha = render.getchannel('A')
    if '-quay-' not in key:
        # 넓게 번지는 그림자를 걷어내고 건물 발치의 그림자만 남긴다.
        solid = alpha.point(lambda value: 255 if value >= 155 else 0)
        near = solid.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(6))
        edges = alpha.point(lambda value: value if value >= 155 else 0)
        alpha = ImageChops.lighter(ImageChops.multiply(alpha,near),edges).point(lambda value: value if value >= 5 else 0)
        render.putalpha(alpha)
        render.save(OUT / 'renders' / (key + '.png'))
    bounds = alpha.point(lambda value: 255 if value > 12 else 0).getbbox()
    assert bounds and bounds[0] > 3 and bounds[1] > 3 and bounds[2] < render.width-3 and bounds[3] < render.height-3, (key, bounds)
    crop = render.crop(bounds)
    assert sum(crop.getchannel('A').histogram()[:13]) > crop.width * crop.height * .14, key
    sprite = crop.resize((width, round(crop.height*width/crop.width)), Image.Resampling.LANCZOS)
    dest = stamps / (key + '.webp')
    sprite.save(dest, 'WEBP', quality=91, method=6, exact=True)
    return crop, bounds, dest.stat().st_size


def relative(p, bounds):
    x,y,right,_=bounds
    return [round((p[0]-x)/(right-x),5),round((p[1]-y)/(right-x),5)]


for city in data['cities']:
    selected = [r for r in rows if r['city'] == city['key']]
    assert len(selected) == 5
    for row in selected:
        expected = {'landmark', 'tavern', 'inn'}
        if row['tier'] >= 2:
            expected.update(('market', 'trade'))
        if row['tier'] >= 3:
            expected.update(('palace', 'library'))
        if city['facilities']['harbor']:
            expected.add('harbor')
        assert len(row['roles']) == len(expected) and set(row['roles']) == expected, row['id']
        img, bounds, row['bytes'] = fit_stamp(row['id'],row['zoomWidth']*2)
        assets[row['id']] = img
        row['height'] = round(img.height * row['width'] / img.width, 1)
        if row['variant'] != 'c':
            continue
        layer = row['id']+'-land' if city['facilities']['harbor'] else row['id']
        if layer != row['id']:
            _, bounds, _ = fit_stamp(layer,row['zoomWidth']*2)
        row['land'] = {'id':layer,'origin':relative(row['origin'],bounds),
                       'feet':{role:[relative(p,bounds) for p in coords] for role,coords in row['feet'].items()}}
        for part in quays.get(city['key'],[]):
            img_quay, rect, _ = fit_stamp(part['id'],56)
            part['sizeRatio'] = round(img_quay.width/(bounds[2]-bounds[0]),5)
            for name in ('origin','land','water','ship'):
                part[name]=relative(part[name],rect)
assert len(assets) == 25
summary = {'renders':len(assets), 'mapStampTotalBytes':sum(r['bytes'] for r in rows),
           'mapStampMaxBytes':max(r['bytes'] for r in rows), 'rows':rows, 'quays':quays}
(OUT / 'verified-stamps.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')

def font(n, bold=False):
    return ImageFont.truetype('malgunbd.ttf' if bold else 'malgun.ttf', n)


def put(draw, xy, value, n, fill, bold=False, anchor=None):
    draw.text(xy,value,font=font(n,bold),fill=fill,anchor=anchor)


def fitted(src,w,h):
    pic=src.copy()
    pic.thumbnail((w,h),Image.Resampling.LANCZOS)
    return pic


def sheet():
    paper=Image.new('RGBA',(1500,1484),'#f1ece1')
    d=ImageDraw.Draw(paper)
    put(d,(39,28),'1480년 도시 아이콘 · 지형 합성판',40,'#252c26',True)
    put(d,(41,87),'건물과 그림자만 남긴 블렌더 모형 25종',19,'#526154')
    for i, text in enumerate(('A   소도시','B   중도시','C   광장 중심','D   대로 중심','E   엇갈린 골목')):
        put(d,(264+i*265,151),text,21,'#28382f',True,'mm')
    for j, city in enumerate(data['cities']):
        y=189+j*252
        d.line((40,y,1460,y),fill='#b9b6a8',width=1)
        put(d,(41,y+27),city['name'],25,'#26332a',True,'lm')
        put(d,(41,y+56),'항구' if city['facilities']['harbor'] else '내륙',16,'#656f60',anchor='lm')
        for i,row in enumerate(r for r in rows if r['city']==city['key']):
            x=264+i*265
            img=fitted(assets[row['id']],244,191)
            k = row['width']/112
            img=img.resize((round(img.width*k),round(img.height*k)),Image.Resampling.LANCZOS)
            paper.alpha_composite(img,(x-img.width//2,y+215-img.height))
            put(d,(x,y+234),f"{row['width']} px · 확대 {row['zoomWidth']} px",14,'#546357',anchor='mm')
    paper.convert('RGB').save(OUT/'city-icons-contact.webp','WEBP',quality=93,method=6)


def map_comparison():
    game=OUT/'game'
    if not (game/'report.json').is_file():
        return
    views=json.loads((game/'report.json').read_text(encoding='utf-8'))['report']
    latest={r['key']:r for r in views if r['view']=='close'}
    paper=Image.new('RGB',(1080,695),'#f1ece1')
    d=ImageDraw.Draw(paper)
    put(d,(25,19),'실제 지도에서 본 대도시 크기',29,'#252c26',True)
    put(d,(27,71),'이전 · 확대 66px',18,'#48594f',True)
    put(d,(553,71),'수정 · 확대 132px',18,'#48594f',True)
    for index,(key,name) in enumerate((('paris','파리 · 센강'),('istanbul','이스탄불 · 보스포루스 해협'))):
        bbox=latest[key]['seen']['bounds']
        # 보고서의 좌표는 1600×900 게임 논리 화면, 실제 캡처는 1280×720이다.
        x=round((bbox[0]+bbox[2])*.4)
        y=round((bbox[1]+bbox[3])*.4)+26
        top=100+index*294
        for j,mode in enumerate(('before','proposal')):
            with Image.open(game/f'{key}-close-{mode}.png') as src:
                crop=src.crop((x-191,y-96,x+203,y+96))
                crop=crop.resize((502,245),Image.Resampling.LANCZOS)
                paper.paste(crop,(25+j*526,top+30))
        put(d,(26,top+2),name,16,'#26332a',True)
    paper.save(OUT/'game-terrain-compare.webp','WEBP',quality=93,method=6)


def gallery():
    blocks=[]
    for city in data['cities']:
        selected=[r for r in rows if r['city']==city['key']]
        title=html.escape(city['name'])
        port=selected[0]['water']
        policy='내륙 도시' if port=='내륙' else port+' 항구'
        cards=[]
        for r in selected:
            facilities=' · '.join(labels[k] for k in order if k in r['roles'])
            key=r['id']
            alt=f"{title} {scale_names[r['tier']]} 규모 {r['name']}"
            cards.append(f'''<article>
              <header><strong>{r['variant'].upper()} · {r['name']}</strong> <small>{scale_names[r['tier']]}</small></header>
              <a class="render" href="renders/{key}.png"><img loading="lazy" src="renders/{key}.png" alt="{alt}"></a>
              <div class="map"><img loading="lazy" src="map-stamps/{key}.webp" width="{r['width']}" alt="기본 크기">
                <img loading="lazy" src="map-stamps/{key}.webp" width="{r['zoomWidth']}" alt="확대 크기"></div>
              <p class="sizes">기본 {r['width']} px · 확대 {r['zoomWidth']} px</p>
              <p>{facilities}</p>
            </article>''')
        blocks.append(f'''<section id="{city['key']}">
          <h2>{title} <span>{policy}</span></h2>
          <p>{html.escape(city['landmarkName'])} · {html.escape(city['palace'])}</p>
          <div class="grid">{''.join(cards)}</div></section>''')
    nav=''.join(f"<a href=\"#{c['key']}\">{html.escape(c['name'])}</a>" for c in data['cities'])
    links=('<a href="game/index.html">게임 화면 비교</a> <a href="game-terrain-compare.webp">파리·이스탄불 확대 비교</a>' if (OUT/'game/index.html').exists() else '')
    page=f'''<!doctype html>
<html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>1480년 도시 아이콘 시안</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#f1ece1;color:#252e28;font:15px/1.55 system-ui,sans-serif}}
main{{max-width:1540px;margin:auto;padding:34px clamp(14px,4vw,58px)}}h1{{font-size:clamp(30px,4vw,51px);line-height:1.15;margin:14px 0}}
p{{max-width:74ch;color:#48564c}}a{{color:#2a5e4b;text-underline-offset:.24em}}nav{{display:flex;gap:15px;flex-wrap:wrap;margin:24px 0}}
h2{{font-size:25px;margin:0}}h2 span{{font-size:14px;color:#62715f;margin-left:9px;font-weight:500}}section{{border-top:1px solid #bdb8ac;padding:25px 0 29px}}
.grid{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}}article{{background:#f9f6ee;border:1px solid #d5d0c3;padding:10px;min-width:0;border-radius:7px}}
article header{{display:flex;justify-content:space-between;align-items:center;gap:5px;font-size:14px}}small{{color:#59685f}}.render{{display:block}}
.render img{{display:block;width:100%;aspect-ratio:1;object-fit:contain}}.map{{display:flex;flex-wrap:wrap;min-height:126px;justify-content:center;align-items:center;gap:6px;padding:4px;background:#788267;border:1px solid #677356;border-radius:4px}}.map img{{height:auto}}
article p{{margin:6px 0 0;font-size:12px}}.sizes{{color:#48594f;white-space:normal}}footer{{border-top:1px solid #bdb8ac;padding-top:15px}}
@media(max-width:1050px){{.grid{{grid-template-columns:repeat(3,minmax(0,1fr))}}}}@media(max-width:580px){{.grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}@media(max-width:390px){{.grid{{grid-template-columns:1fr}}}}
</style>
<main><h1>1480년 도시 아이콘 · 지형 합성판</h1>
<p>A·B는 소·중 규모, C·D·E는 대도시 배치안입니다. 대도시 본체는 이전의 가로·세로 두 배입니다. 실제 지도에서는 건물 발치를 육지에 두고 잔교와 배만 물가에 배치합니다. 지도 크기는 1600×900 기준이며 그림을 누르면 투명 렌더 원본이 열립니다.</p>
<nav>{nav}<a href="city-icons.blend">블렌더 원본</a>{links}</nav>
{''.join(blocks)}
<footer>
<p>도시마다 실제 발견물 하나를 골랐습니다. 자택은 제독의 거주 도시에만 붙일 수 있게 블렌더 원본의 별도 장면에 있습니다.</p>
<p>외관 자료 <a href="https://www.notredamedeparis.fr/comprendre/architecture/la-facade-occidentale/">노트르담</a> · <a href="https://colosseo.it/en/southern-ambulatories/">콜로세움</a> · <a href="https://www.ktb.gov.tr/genel/medya/iltanitimbrosuru-eng/istanbul_eng.pdf">성 소피아</a> · <a href="https://www.hrp.org.uk/tower-of-london/whats-on/white-tower/">런던 탑</a> · <a href="https://www.catedraldesevilla.es/en/the-cathedral/building/the-giralda/">히랄다</a></p>
<p>거리와 후원자 건물 참고 <a href="https://www.parismuseescollections.paris.fr/en/node/112463">파리의 15세기 주택</a> · <a href="https://www.louvre.fr/editions/catalogue/le-louvre-un-chateau-du-moyen-age">중세 루브르</a> · <a href="https://www.millisaraylar.gov.tr/Lokasyon/2/Topkapi-Sarayi?culture=en">톱카프</a> · <a href="https://www.parliament.uk/about/living-heritage/building/palace/westminsterhall/architecture/">웨스트민스터 홀</a> · <a href="https://alcazarsevilla.org/historia/">세비야 알카사르</a></p>
</footer></main></html>'''
    (OUT/'index.html').write_text(page,encoding='utf-8')


sheet()
map_comparison()
gallery()
