import json, os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','js','data')
from cities_src import CITIES
b=json.load(open('world_blobs.json'))
snap={c['id']:c for c in json.load(open('city_snap.json'))}
with open(os.path.join(OUT,'world_data.js'),'w',encoding='utf-8') as f:
    f.write('/* Generated from Natural Earth 50m (public domain). Do not edit by hand. */\n')
    f.write('(function(G){G.WORLD_DATA={W:%d,H:%d,CW:%d,CH:%d,\n'%(b['W'],b['H'],b['CW'],b['CH']))
    for k in ('land','river','climate'):
        f.write('%s:"%s",\n'%(k,b[k]))
    f.write('};})(window.G=window.G||{});\n')
rows=[]
for c in CITIES:
    cid,name,lat,lon,port,region,lang,rel,size,style,nation,founded,goods,flags=c
    s=snap[cid]
    r={'id':cid,'name':name,'lat':s['land'][1],'lon':s['land'][0],'port':port,'region':region,'lang':lang,'rel':rel,'size':size,'style':style,'nation':nation,'founded':founded,'goods':goods,'flags':flags}
    if 'dock' in s: r['dock']=[s['dock'][1],s['dock'][0]]
    rows.append(r)
with open(os.path.join(OUT,'cities.js'),'w',encoding='utf-8') as f:
    f.write('/* City table: real-world coordinates (snapped to the game land mask). */\n(function(G){G.CITY_DATA=[\n')
    for r in rows:
        f.write(json.dumps(r,ensure_ascii=False,separators=(',',':'))+',\n')
    f.write('];})(window.G=window.G||{});\n')
print('ok')
