# 자동 플레이 기록(t25)을 읽어 보기 좋은 항해 기록 페이지를 만든다
import json, re, html, collections, sys

RUN = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/bot/t25'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/claude-0/report/voyage.html'
f = json.load(open(RUN + '/final.json'))
ev = f['ev']
DISC = json.load(open('/tmp/claude-0/report/disc.json'))
GOODS = json.load(open('/tmp/claude-0/report/goods.json'))
CITY = json.load(open('/tmp/claude-0/report/cities.json'))
LAND = open('/tmp/claude-0/report/land.txt').read().strip()
E = html.escape

STAGES = {
    'start': ('출발 준비', '#6b7a82'),
    'cape': ('아프리카 남단 탐색', '#c98a2b'),
    'capeBack': ('보고하러 귀환', '#a8763c'),
    'levant': ('지중해·알렉산드리아', '#8a5cc2'),
    'india': ('인도 항로 개척', '#2f8f5b'),
    'indiaBack': ('후추를 싣고 귀환', '#4aa27a'),
    'east': ('말라카·향료제도', '#c2475a'),
    'eastBack': ('향료를 싣고 귀환', '#d0707f'),
    'circ': ('서쪽으로 세계일주', '#2a74c8'),
}
SP_NAME = {'pt_behaim': '마르틴 베하임 (우주지 학자)', 'pt_marchionni': '바르톨로메우 마르키오니 (대상인)', 'pt_king': '주앙 2세 (포르투갈 국왕)', 'pt_casaindia': '기니·미나 상관장', 'pt_queen': '레오노르 왕비'}

# ---- 사건마다 그때의 단계
stage = 'start'
for e in ev:
    if e['type'] == 'mission':
        stage = e['stage']
    e['_st'] = stage

def evs(t):
    return [e for e in ev if e['type'] == t]

def num(x):
    return f"{int(round(x)):,}"

def dnum(x):
    x = str(x)
    return f"{x[:4]}년 {int(x[4:6])}월 {int(x[6:8])}일"

def short(d):
    m = re.match(r'(\d+)년 (\d+)월 (\d+)일', d)
    return f"{m.group(1)}.{int(m.group(2)):02d}.{int(m.group(3)):02d}" if m else d

def chip(st):
    n, c = STAGES.get(st, (st, '#888'))
    return f'<span class="stg" style="--c:{c}">{E(n)}</span>'

start = evs('start')[0]
end = f
visits = evs('visit')
ports = collections.OrderedDict()
for v in visits:
    ports.setdefault(v['cityName'], 0)
    ports[v['cityName']] += 1
buys, sells = evs('buy'), evs('sell')
profit = sum(s['profit'] for s in sells)
pirate = [e for e in evs('note') if '해적에게 금화' in e['text']]
toll = sum(int(re.search(r'금화 ([\d,]+)닢', e['text']).group(1).replace(',', '')) for e in pirate)
storms = [e for e in evs('note') if '폭풍이 지나갔다' in e['text']]
newports = [e for e in evs('journal') if e['text'].startswith('새로운 항구')]
missions = []
for m in evs('mission'):
    if missions and missions[-1]['stage'] == m['stage'] and missions[-1]['date'] == m['date']:
        continue
    missions.append(m)

# ---- 발견 목록 (발견한 날·어디서·어떻게 알렸나)
found = f['found']
for d in found:
    d['date'] = dnum(d['found'])
    meta = DISC.get(d['id'], {})
    where = ''
    if d['how'] == 'trade':
        g = meta.get('good')
        b = [x for x in buys if x['date'] == d['date'] and x['good'] == g]
        where = (b[0]['cityName'] + ' 교역소에서 한 통 사 봄') if b else '교역소에서 사 봄'
    elif d['how'] == 'city':
        v = [x for x in visits if x['date'] == d['date']]
        where = (v[0]['cityName'] + '에 들어가 봄') if v else '도시에 들어가 봄'
    elif d['id'] == 'capegood':
        where = '남위 34.2° 아래, 동경 16~30° 바다를 지남'
    elif d['id'] == 'indiaroute':
        where = '남단을 돌아 인도 서해안(북위 8~20°, 동경 72~78°)에 닿음'
    elif d['id'] == 'circum':
        where = '지구를 한 바퀴(경도 360°) 돌아 리스본에 입항'
    else:
        where = f"그 바다({abs(meta.get('lat', 0)):.1f}°{'N' if meta.get('lat', 0) >= 0 else 'S'}, {abs(meta.get('lon', 0)):.1f}°{'E' if meta.get('lon', 0) >= 0 else 'W'}) 가까이를 지남"
    d['where'] = where
    if d['reported']:
        d['told'] = SP_NAME.get(d['reported'], d['reported']) + '에게 보고'
    elif d['announced']:
        d['told'] = '리스본 항구에서 발표'
    else:
        d['told'] = '(아직 알리지 않음)'
    d['st'] = next((e['_st'] for e in ev if e['type'] == 'journal' and e['date'] == d['date'] and '발견했다' in e['text']), '')

# ---- 항로 지도 (trace의 5일마다 위치 + 입항 항구)
pts = []
tr = open(RUN + '/trace.log', encoding='utf8').read().split('\n')
daystage = []
for e in ev:
    if e['type'] == 'mission':
        daystage.append((e['day'], e['stage']))
def stage_at(day):
    s = 'start'
    for dd, st in daystage:
        if dd <= day:
            s = st
    return s
seq = []
for line in tr:
    m = re.match(r'^(\d+)\tpos\t(-?[\d.]+),(-?[\d.]+)\t', line)
    if m:
        seq.append((int(m.group(1)), float(m.group(2)), float(m.group(3)), 'sea'))
for v in visits:
    c = CITY[str(v['city'])]
    seq.append((v['day'], c['lat'], c['lon'], 'port'))
seq.sort(key=lambda x: (x[0], 0 if x[3] == 'sea' else 1))
def X(lon): return (lon + 180) * 3
def Y(lat): return (90 - lat) * 3
paths = collections.defaultdict(list)
prev = None
for day, lat, lon, kind in seq:
    st = stage_at(day)
    if prev is not None:
        pday, plat, plon, pst = prev
        if abs(lon - plon) < 180:
            paths[st].append(f"M{X(plon):.1f},{Y(plat):.1f}L{X(lon):.1f},{Y(lat):.1f}")
        else:
            # 날짜변경선을 넘는 구간은 양쪽 가장자리로 나누어 그린다
            if plon > 0:
                l2 = lon + 360
                t = (180 - plon) / (l2 - plon)
                mlat = plat + (lat - plat) * t
                paths[st].append(f"M{X(plon):.1f},{Y(plat):.1f}L{X(180):.1f},{Y(mlat):.1f}M{X(-180):.1f},{Y(mlat):.1f}L{X(lon):.1f},{Y(lat):.1f}")
            else:
                l2 = lon - 360
                t = (-180 - plon) / (l2 - plon)
                mlat = plat + (lat - plat) * t
                paths[st].append(f"M{X(plon):.1f},{Y(plat):.1f}L{X(-180):.1f},{Y(mlat):.1f}M{X(180):.1f},{Y(mlat):.1f}L{X(lon):.1f},{Y(lat):.1f}")
    prev = (day, lat, lon, st)
order = ['cape', 'capeBack', 'levant', 'india', 'indiaBack', 'east', 'eastBack', 'circ']
svg_paths = ''.join(f'<path d="{"".join(paths[s])}" stroke="{STAGES[s][1]}" class="rt rt-{s}"/>' for s in order if paths[s])
visited_ids = sorted(set(v['city'] for v in visits))
dots = ''.join(f'<circle cx="{X(CITY[str(i)]["lon"]):.1f}" cy="{Y(CITY[str(i)]["lat"]):.1f}" r="3.2" class="pt"><title>{E(CITY[str(i)]["name"])}</title></circle>' for i in visited_ids)
LABELS = {0: (6, -6), 90: (-8, 14), 100: (8, 4), 101: (6, 12), 108: (8, 4), 152: (6, -6), 160: (6, 12), 172: (6, 12), 224: (-10, 4), 220: (-10, -6), 78: (6, -6)}
labs = ''
for cid, (dx, dy) in LABELS.items():
    if cid in visited_ids:
        c = CITY[str(cid)]
        anchor = 'end' if dx < 0 else 'start'
        labs += f'<text x="{X(c["lon"]) + dx:.1f}" y="{Y(c["lat"]) + dy:.1f}" text-anchor="{anchor}" class="lb">{E(c["name"])}</text>'
disc_marks = ''
for d in found:
    if d['how'] in ('sea', 'special') and d['id'] not in ('circum',):
        meta = DISC[d['id']]
        lat, lon = meta['lat'], meta['lon']
        if d['id'] == 'capegood': lat, lon = -35.2, 19.0
        if d['id'] == 'indiaroute': lat, lon = 11.5, 74.8
        disc_marks += f'<g class="dm" transform="translate({X(lon):.1f},{Y(lat):.1f})"><path d="M0,-7L2,-2L7,0L2,2L0,7L-2,2L-7,0L-2,-2Z"/><title>{E(d["name"])} · {E(d["date"])}</title></g>'
grid = ''.join(f'<line x1="0" x2="1080" y1="{Y(la)}" y2="{Y(la)}" class="{"eq" if la == 0 else "gr"}"/>' for la in (60, 30, 23.44, 0, -23.44, -30, -60))
grid += ''.join(f'<line y1="0" y2="540" x1="{X(lo)}" x2="{X(lo)}" class="gr"/>' for lo in range(-150, 180, 30))
legend = ''.join(f'<span class="lg"><i style="background:{STAGES[s][1]}"></i>{E(STAGES[s][0])}</span>' for s in order)

# ---- 단계 카드
mcards = ''
for i, m in enumerate(missions):
    nxt = missions[i + 1]['date'] if i + 1 < len(missions) else f['date']
    stv = [v for v in visits if v['_st'] == m['stage']]
    got = [d for d in found if d['st'] == m['stage']]
    mcards += f'''<li class="mc" style="--c:{STAGES[m['stage']][1]}">
<div class="mh"><span class="md">{short(m['date'])} → {short(nxt)}</span>{chip(m['stage'])}</div>
<p class="mw">{E(m['why'])}</p>
<p class="mr">{' → '.join(E(x) for x in m['route'])}</p>
<p class="mo">입항 {len(stv)}번 · 발견 {len(got)}건{(' — ' + ', '.join(E(d['name']) for d in got)) if got else ''}</p></li>'''

# ---- 발견 표
drows = ''
for i, d in enumerate(found, 1):
    drows += f'<tr><td class="n">{i}</td><td class="dt">{short(d["date"])}</td><td><b>{E(d["name"])}</b>{("<small> (" + E(d["aka"]) + ")</small>") if d.get("aka") else ""}</td><td>{E(d["cat"])}</td><td>{E(d["where"])}</td><td>{E(d["told"])}</td></tr>'

# ---- 도시 방문 순서 (단계별)
vis_html = ''
for s in order:
    vs = [v for v in visits if v['_st'] == s]
    if not vs:
        continue
    items = ''.join(f'<li><span class="vd">{short(v["date"])}</span>{E(v["cityName"])}{"<em>첫 입항</em>" if v["visits"] == 1 else ""}</li>' for v in vs)
    vis_html += f'<div class="vg" style="--c:{STAGES[s][1]}"><h4>{E(STAGES[s][0])} <small>{len(vs)}곳</small></h4><ol class="vl">{items}</ol></div>'
top_ports = sorted(ports.items(), key=lambda x: -x[1])[:8]

# ---- 교역 표
trows = ''
for e in sorted(buys + sells, key=lambda x: x['day']):
    if e['type'] == 'buy':
        trows += f'<tr class="b"><td class="dt">{short(e["date"])}</td><td>{E(e["cityName"])}</td><td><span class="bs b">매입</span></td><td>{E(e["goodName"])}</td><td class="r">{e["q"]}</td><td class="r">{num(e["unit"])}</td><td class="r">{num(e["paid"])}</td><td class="why">{E(e["why"])}</td></tr>'
    else:
        pc = 'up' if e['profit'] >= 0 else 'dn'
        trows += f'<tr class="s"><td class="dt">{short(e["date"])}</td><td>{E(e["cityName"])}</td><td><span class="bs s">매각</span></td><td>{E(e["goodName"])}</td><td class="r">{e["q"]}</td><td class="r">{num(e["unit"])}</td><td class="r">{num(e["got"])}</td><td class="why"><span class="{pc}">{"+" if e["profit"] >= 0 else ""}{num(e["profit"])}</span> · {E(e["why"])}</td></tr>'
best_sales = sorted(sells, key=lambda x: -x['profit'])[:5]

# ---- 건물 활동
def li(d, t):
    return f'<li><span class="vd">{short(d)}</span>{t}</li>'
lib = ''.join(li(e['date'], f'{E(e["cityName"])} 도서관 — {E(e["book"])} → 단서: {E(", ".join(e["hints"]) or "없음")}') for e in evs('library'))
tav = ''.join(li(e['date'], f'{E(e["cityName"])} 술집 — 소문: {E(", ".join(e["hints"]) or "새 소문 없음")}') for e in evs('tavern_rumour'))
tav += ''.join(li(e['date'], f'{E(e["cityName"])} 술집 — <b>{E(e["mate"])}</b> 고용 ({E(e["skills"])}, 월급 {e["wage"]}닢)') for e in evs('hire'))
tav += ''.join(li(e['date'], f'술집 부하편성 — {E(e["mate"])}을(를) 부관 자리에 (의학·과학이 괴혈병을 늦춘다)') for e in evs('role'))
spn = ''
for e in ev:
    t = e['type']
    if t == 'propose':
        if e['result'].startswith('계약'):
            spn += li(e['date'], f'{E(e["sponsor"])} — 「{E(", ".join(e["want"]))}」 제안 → <b>{E(e["result"])}</b> (선금 {num(e["advance"])}닢, 성공 보수 {num(e["reward"])}닢)')
        elif e['result'].startswith('작은'):
            spn += li(e['date'], f'{E(e["sponsor"])} — <b>{E(e["result"])}</b> (보수 {num(e["reward"])}닢)')
        elif e['result'].startswith('보고'):
            spn += li(e['date'], f'{E(e["sponsor"])} — 앞서 찾은 「{E(e["want"][0])}」을(를) 늦게 알림 → 사례 {num(e["gold"])}닢, 명성 +{num(e["fameGain"])}')
    elif t == 'report':
        spn += li(e['date'], f'{E(e["sponsor"])} — 「{E(e["what"])}」 보고 → 명성 +{num(e["fameGain"])}' + (' (작은 일거리)' if e.get('small') else ''))
    elif t == 'errand_take':
        spn += li(e['date'], f'{E(e["sponsor"])}의 집사 — 명성이 모자라 직접 못 만나 작은 일거리를 받음: <b>{E(e["result"])}</b> (보수 {num(e["reward"])}닢)')
    elif t == 'errand_drop':
        spn += li(e['date'], f'{E(e["sponsor"])} — 끝내지 못한 「{E(e["what"])}」을(를) 정리하고 큰 계약으로')
    elif t == 'announce':
        spn += li(e['date'], f'리스본 항구 — 「{E(e["disc"])}」 발견 발표 (후원자 계약이 없어서) → 명성 +{num(e["fameGain"])}')
yard = ''
for e in ev:
    t = e['type']
    if t == 'ship_buy': yard += li(e['date'], f'{E(e["cityName"])} 조선소 — {E(e["ship"])} {E(e["name"])}호 구입 ({num(e["price"])}닢)')
    elif t == 'repair': yard += li(e['date'], f'{E(e["cityName"])} 조선소 — 수리 ({num(e["cost"])}닢)')
    elif t == 'figurehead': yard += li(e['date'], f'{E(e["cityName"])} 조선소 — {E(e["ship"])}에 {E(e["fig"])} 달기 ({E(e["desc"])})')
mkt = collections.Counter()
mkt_first = {}
for e in evs('item'):
    k = (e['cityName'], e['item'])
    mkt[k] += 1
    mkt_first.setdefault(k, e['date'])
market = ''.join(li(mkt_first[k], f'{E(k[0])} 시장 — {E(k[1])} ×{n}') for k, n in mkt.items())
harbor = f'<li>출항 {len(evs("depart"))}번 — 매번 「출항 준비」로 선원을 채우고 다음 구간 날수의 약 1.45배 + 7일치 식량·물을 실었다.</li>'
harbor += ''.join(li(e['date'], f'{E(e["cityName"])} 항구 — 선원 {e["from"]}→{e["to"]}명 (긴 뱃길 전에 남는 선원을 내려 식량·물을 아낌)') for e in evs('crew_trim')[:6])
harbor += f'<li>그 밖에 선원 줄이기 {max(0, len(evs("crew_trim")) - 6)}번 더</li>' if len(evs('crew_trim')) > 6 else ''
bank = ''.join(li(e['date'], f'리스본 자택 금고 — {E(e["what"])} {num(e["amount"])}닢 (들고 다니는 돈 {num(e["onHand"])}닢 · 금고 {num(e["bank"])}닢)') for e in evs('bank'))
rest = f'<li>여관 숙박 {len(evs("inn"))}번 (먼 길 전에 피로를 0으로), 교회·사원 기도 {len(evs("church"))}번 (폭풍을 조금 덜 만난다)</li>'

# ---- 바다에서
sea = collections.Counter()
for e in evs('note'):
    t = e['text']
    if '폭풍이 지나갔다' in t: sea['폭풍'] += 1
    elif '해적에게 금화' in t: sea['해적 통행료'] += 1
    elif '따돌렸다' in t: sea['해적 따돌림'] += 1
    elif '라임 절임' in t: sea['라임 절임 사용(괴혈병)'] += 1
    elif '돛을 줄이고' in t: sea['붉은 아침 하늘에 대비'] += 1
news = ''.join(li(e['date'], E(e['text'])) for e in evs('news'))
sea_items = ''.join(f'<li><b>{k}</b> {n}번</li>' for k, n in sea.most_common())
sea_items += f'<li><b>새 항구 발견</b> {len(newports)}곳 · <b>해적에게 낸 통행료</b> 합계 {num(toll)}닢 · <b>해전</b> 0번</li>'
milest = ''.join(li(e['date'], E(e['text'])) for e in evs('journal') if re.search(r'처음 (넘었다|들어섰다)|적도제|처음으로 적도', e['text']))
sdiv = ''.join(li(e['date'], f'식량·물이 모자라 {E(e["to"])}(으)로 뱃머리를 돌림 (남은 {e["left"]}일 · 예상 {e["need"]}일)') for e in evs('divert'))
sdiv += ''.join(li(e['date'], f'식량 경고: 남은 {e["left"]}일, 목적지까지 약 {e["eta"]}일 → {E(e["to"])}') for e in evs('supply_short'))

# ---- 세계일주 구간
circ_start = next(m for m in missions if m['stage'] == 'circ')
cev = [e for e in ev if e['_st'] == 'circ' and e['type'] in ('depart', 'leg', 'waypoint', 'journal', 'goal', 'report')]
crow = ''
for e in cev:
    t = e['type']
    if t == 'depart':
        crow += f'<tr><td class="dt">{short(e["date"])}</td><td>출항</td><td>{E(e["cityName"])} → {E(e["next"])}</td><td>식량·물 {e["days"]}일치 (계획 {e["plan"]}일), 선원 {e["crew"]}명</td></tr>'
    elif t == 'leg':
        crow += f'<tr class="lg2"><td class="dt">{short(e["date"])}</td><td>도착</td><td>{E(e["result"])}</td><td>{e.get("days", "")}일 걸림</td></tr>'
    elif t == 'waypoint':
        crow += f'<tr class="wp"><td class="dt">{short(e["date"])}</td><td>지점</td><td>{E(e["label"])}</td><td>{abs(e["lat"]):.1f}°{"N" if e["lat"] >= 0 else "S"} {abs(e["lon"]):.1f}°{"E" if e["lon"] >= 0 else "W"}</td></tr>'
    elif t == 'journal' and re.search(r'발견했다|이름을 붙였다|계약|보고|명성', e['text']) and '새로운 항구' not in e['text']:
        crow += f'<tr class="jn"><td class="dt">{short(e["date"])}</td><td>일지</td><td colspan="2">{E(e["text"])}</td></tr>'
cp = next(e for e in evs('circ_prep'))

# ---- 방법 · 시도
years = f"{start['date']} → {f['date']}"
stats = f['stats']
km = stats['distance'] * 111

page = f'''<title>주앙 다 시우바의 세계일주</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;800&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
:root{{--bg:#eef2f1;--paper:#ffffff;--ink:#17252d;--muted:#56666e;--line:#d3dcdf;--soft:#e4ebea;--accent:#1f6f6a;--brass:#946f1e;--up:#1f7a4a;--dn:#b0412e;--sea:#cfdfe3;--land:#c9bfa6;--route-w:2.2;
--serif:"Noto Serif KR","Nanum Myeongjo",Georgia,serif;--sans:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0e161b;--paper:#142028;--ink:#e1e9ec;--muted:#93a3aa;--line:#24343d;--soft:#1a2831;--accent:#58b6ac;--brass:#d4b062;--up:#5cc28b;--dn:#e98a74;--sea:#12303a;--land:#3d4a44}}}}
:root[data-theme="dark"]{{--bg:#0e161b;--paper:#142028;--ink:#e1e9ec;--muted:#93a3aa;--line:#24343d;--soft:#1a2831;--accent:#58b6ac;--brass:#d4b062;--up:#5cc28b;--dn:#e98a74;--sea:#12303a;--land:#3d4a44}}
*{{box-sizing:border-box}}
body{{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.65;margin:0}}
.wrap{{max-width:1080px;margin:0 auto;padding-inline:18px;padding-block:28px 60px}}
h1,h2,h3{{font-family:var(--serif);text-wrap:balance;margin:0}}
h1{{font-size:clamp(28px,5vw,44px);font-weight:800;letter-spacing:-.01em}}
h2{{font-size:22px;font-weight:800;margin:44px 0 6px;display:flex;align-items:baseline;gap:10px}}
h2 .no{{font-family:var(--sans);font-size:12px;color:var(--brass);letter-spacing:.14em;font-weight:700}}
h3{{font-size:16px;margin:22px 0 6px}}
h4{{margin:0 0 6px;font-size:14px}}
.eyebrow{{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--brass);font-weight:700;margin-bottom:8px}}
.lede{{max-width:70ch;color:var(--muted);margin:10px 0 0}}
.sub{{color:var(--muted);margin:0 0 12px;max-width:74ch}}
.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:22px 0 8px}}
.stat{{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px 14px}}
.stat b{{display:block;font-size:22px;font-variant-numeric:tabular-nums;font-family:var(--serif)}}
.stat span{{font-size:12.5px;color:var(--muted)}}
.mapscroll{{overflow-x:auto;margin-top:14px;border-radius:10px}}
.map{{position:relative;background:var(--sea);border-radius:10px;overflow:hidden;border:1px solid var(--line);aspect-ratio:2/1;width:100%;min-width:0}}
@media (max-width:700px){{.map{{width:720px}}}}
.map .land{{position:absolute;inset:0;background:var(--land);-webkit-mask:url({LAND}) center/100% 100% no-repeat;mask:url({LAND}) center/100% 100% no-repeat}}
.map svg{{position:absolute;inset:0;width:100%;height:100%}}
.gr{{stroke:var(--ink);stroke-opacity:.08;stroke-width:1}} .eq{{stroke:var(--ink);stroke-opacity:.22;stroke-width:1;stroke-dasharray:4 4}}
.rt{{fill:none;stroke-width:var(--route-w);stroke-linecap:round;stroke-linejoin:round;opacity:.92}}
.pt{{fill:var(--paper);stroke:var(--ink);stroke-width:1.2}}
.lb{{font-size:12px;font-family:var(--sans);font-weight:700;fill:var(--ink);paint-order:stroke;stroke:var(--sea);stroke-width:3px}}
.dm path{{fill:var(--brass);stroke:var(--paper);stroke-width:1}}
.legend{{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;font-size:13px;color:var(--muted)}}
.lg i{{display:inline-block;width:18px;height:4px;border-radius:2px;margin-right:6px;vertical-align:middle}}
.stg{{display:inline-block;font-size:12px;font-weight:700;color:var(--c);border:1px solid var(--c);border-radius:999px;padding:0 8px;line-height:20px;white-space:nowrap}}
ol.tl{{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:10px}}
.mc{{background:var(--paper);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:8px;padding:12px 14px}}
.mh{{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}}
.md{{font-variant-numeric:tabular-nums;font-weight:700}}
.mw{{margin:6px 0 2px}} .mr{{margin:0;color:var(--muted);font-size:13.5px}} .mo{{margin:4px 0 0;font-size:13.5px}}
.tbl{{overflow-x:auto;background:var(--paper);border:1px solid var(--line);border-radius:10px;margin-top:10px}}
table{{border-collapse:collapse;width:100%;font-size:14px}}
th,td{{padding:7px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}}
th{{font-size:12.5px;color:var(--muted);font-weight:700;background:var(--soft);position:sticky;top:0}}
tr:last-child td{{border-bottom:0}}
td.n,td.dt,td.r{{font-variant-numeric:tabular-nums;white-space:nowrap}} td.r{{text-align:right}}
td.why{{color:var(--muted);font-size:13px;min-width:180px}}
.bs{{font-size:12px;font-weight:700;border-radius:4px;padding:1px 6px}} .bs.b{{background:var(--soft);color:var(--ink)}} .bs.s{{background:var(--accent);color:var(--paper)}}
.up{{color:var(--up);font-weight:700}} .dn{{color:var(--dn);font-weight:700}}
.vgs{{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:10px}}
.vg{{background:var(--paper);border:1px solid var(--line);border-top:3px solid var(--c);border-radius:8px;padding:10px 12px}}
.vg small{{color:var(--muted);font-weight:500}}
ol.vl{{margin:0;padding-left:20px;font-size:13.5px;columns:1}}
.vl em{{font-style:normal;font-size:11px;color:var(--accent);border:1px solid var(--accent);border-radius:3px;padding:0 4px;margin-left:6px}}
.vd{{display:inline-block;min-width:78px;color:var(--muted);font-variant-numeric:tabular-nums;font-size:12.5px}}
.cols{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-top:10px}}
.box{{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px 14px}}
.box ul{{margin:0;padding-left:0;list-style:none;font-size:13.5px}} .box li{{padding:3px 0;border-bottom:1px dashed var(--line)}} .box li:last-child{{border:0}}
details{{margin-top:10px}} summary{{cursor:pointer;font-weight:700;color:var(--accent)}} summary:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.note{{font-size:13.5px;color:var(--muted);max-width:76ch}}
tr.wp td{{color:var(--muted)}} tr.jn td{{background:var(--soft)}} tr.lg2 td{{font-weight:700}}
.kv{{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:14px}} .kv b{{color:var(--muted);font-weight:500}}
@media (max-width:560px){{th,td{{padding:6px 8px}}}}
@media (prefers-reduced-motion:reduce){{*{{scroll-behavior:auto}}}}
</style>
<div class="wrap">
<div class="eyebrow">PLUS ULTRA · 자동 플레이 기록</div>
<h1>주앙 다 시우바의 세계일주</h1>
<p class="lede">실제 게임 코드를 그대로 돌리면서 대화와 선택만 봇이 대신 골랐습니다. 포르투갈의 탐험가로 1480년 리스본에서 카라벨 한 척과 금화 3,000닢으로 시작했고, {E(f['date'])}에 세계일주 항로를 찾아 국왕에게 보고했습니다. 한 번도 불러오기 없이 이어진 한 판의 기록입니다.</p>
<div class="stats">
<div class="stat"><b>7년 1개월</b><span>{E(years)}</span></div>
<div class="stat"><b>{num(f['player']['fame'])}</b><span>명성 · 칭호 「{E(f['player']['title'])}」</span></div>
<div class="stat"><b>{len(found)}건</b><span>발견 ({E(' · '.join(f"{k} {v}" for k, v in collections.Counter(d['cat'] for d in found).most_common()))})</span></div>
<div class="stat"><b>{len(ports)}곳 / {len(visits)}번</b><span>들른 항구 / 입항</span></div>
<div class="stat"><b>{num(profit)}닢</b><span>교역 이익 (매입 {len(buys)} · 매각 {len(sells)})</span></div>
<div class="stat"><b>{num(km)} km</b><span>항해 거리 · 해전 0번</span></div>
</div>

<h2><span class="no">01</span>항로</h2>
<p class="sub">5일마다 적어 둔 함대의 위치와 입항한 항구를 이었습니다. 색은 단계, 금빛 별은 바다에서 찾은 발견입니다.</p>
<div class="mapscroll"><div class="map"><div class="land"></div><svg viewBox="0 0 1080 540" preserveAspectRatio="none" role="img" aria-label="1480~1487년 항로 지도">{grid}{svg_paths}{dots}{disc_marks}{labs}</svg></div></div>
<div class="legend">{legend}</div>

<h2><span class="no">02</span>단계별 흐름</h2>
<p class="sub">봇은 도시에 닿을 때마다 계약·교역·보급을 처리하고, 한 단계의 항구를 다 돌면 다음 목표를 정했습니다.</p>
<ol class="tl">{mcards}</ol>

<h2><span class="no">03</span>발견 순서</h2>
<p class="sub">경쟁자보다 먼저 찾은 것뿐입니다. 역사 속 경쟁자 연도: 희망봉 1488 · 인도항로 1498 · 말라카 1509 · 향료제도 1512 · 신세계 해협 1520 · 세계일주 1522.</p>
<div class="tbl"><table><thead><tr><th>#</th><th>날짜</th><th>발견</th><th>분류</th><th>어디서 · 어떻게</th><th>알린 곳</th></tr></thead><tbody>{drows}</tbody></table></div>

<h2><span class="no">04</span>도시 방문 순서</h2>
<p class="sub">입항 {len(visits)}번 · 처음 들어간 항구 {len(newports)}곳. 가장 자주 들른 곳: {E(', '.join(f"{k} {v}번" for k, v in top_ports))}.</p>
<div class="vgs">{vis_html}</div>

<h2><span class="no">05</span>상품 매입·매각</h2>
<p class="sub">매입은 들러 본 교역소의 시세 수첩(알려진 최고 매각가)을 보고 1통당 18% 넘게 남는 것만 샀습니다. 처음 보는 교역품은 한 통씩 사 봐서 교역품 발견을 얻었습니다. 가장 많이 남긴 매각: {E(', '.join(f"{s['cityName']} {s['goodName']} +{num(s['profit'])}" for s in best_sales))}.</p>
<details open><summary>교역 {len(buys) + len(sells)}건 전체</summary>
<div class="tbl"><table><thead><tr><th>날짜</th><th>도시</th><th></th><th>품목</th><th class="r">수량</th><th class="r">1통</th><th class="r">금액</th><th>이익 · 까닭</th></tr></thead><tbody>{trows}</tbody></table></div></details>

<h2><span class="no">06</span>건물에서 한 일</h2>
<div class="cols">
<div class="box"><h4>왕궁·저택 (후원자)</h4><ul>{spn}</ul></div>
<div class="box"><h4>도서관</h4><ul>{lib}</ul><h4 style="margin-top:12px">술집</h4><ul>{tav}</ul></div>
<div class="box"><h4>조선소</h4><ul>{yard}</ul><h4 style="margin-top:12px">시장</h4><ul>{market}</ul></div>
<div class="box"><h4>항구 · 자택 · 여관 · 교회</h4><ul>{harbor}{bank}{rest}</ul></div>
</div>

<h2><span class="no">07</span>바다에서 일어난 일</h2>
<div class="cols">
<div class="box"><h4>사건</h4><ul>{sea_items}</ul><h4 style="margin-top:12px">처음 넘은 곳</h4><ul>{milest}</ul></div>
<div class="box"><h4>식량 경고와 뱃머리 돌리기</h4><ul>{sdiv or '<li>없음</li>'}</ul><h4 style="margin-top:12px">세상의 소식</h4><ul>{news}</ul></div>
</div>

<h2><span class="no">08</span>세계일주 구간</h2>
<p class="sub">준비 (1485.06.02 리스본): 국왕 주앙 2세와 세계일주 계약(선금 45,800닢, 성공 보수 106,800닢). 준비한 것은 카라벨 {len(cp['ships'])}척 — {E(', '.join(cp['ships']))}, 폭풍을 {E(cp['stormCut'])} 덜 만남, 라임 절임 {cp['limes']}통, 항해술 {cp['nav']} · 의학 {cp['med']} · 과학 {cp['sci']}. 서쪽으로 대서양 → 신세계 해협 → 태평양 → 향료제도 → 인도양 → 희망봉을 돌아 리스본으로 왔습니다.</p>
<div class="tbl"><table><thead><tr><th>날짜</th><th></th><th>구간 · 지점</th><th>메모</th></tr></thead><tbody>{crow}</tbody></table></div>

<h2><span class="no">09</span>이렇게 돌렸습니다</h2>
<div class="box"><div class="kv">
<b>게임</b><span>개발 중인 PLUS ULTRA 그대로 (규칙·확률·경쟁자·사건은 손대지 않음). 화면 그리기만 끄고 바다 장면의 하루를 직접 돌림.</span>
<b>선택</b><span>대화·선택지·숫자 입력·창을 봇이 규칙대로 골랐습니다. 모든 고른 내용은 기록에 남았습니다.</span>
<b>뱃길</b><span>자동항해(익숙한 항로)는 쓰지 않았습니다. 사람이 해도 위 바다 지점을 차례로 찍듯이 경로점을 잡아 직항 침로로 몰았습니다.</span>
<b>결투</b><span>그림 결투 대신 힘·검술을 견주어 판정했습니다. 이 판에서는 결투가 없었습니다.</span>
<b>시도</b><span>봇을 고쳐 가며 스물일곱 번 돌렸습니다. 마지막 설정으로 돌린 세 판 가운데 두 판이 세계일주를 마쳤고, 이 기록은 그중 먼저 끝난 판입니다. 실패한 판은 주로 신세계 해협~나스카(식량·피로)와 태평양 횡단 끝(토레스 해협 너머 굶주림)에서 선원이 전멸했습니다.</span>
</div></div>
<p class="note" style="margin-top:14px">발견 22건 가운데 신세계 해협과 육두구는 세계일주 도중에 찾아 아직 알리지 않은 채로 기록이 끝났습니다.</p>
</div>
'''
open(OUT, 'w').write(page)
print('ok', len(page), 'found', len(found), 'visits', len(visits), 'trades', len(buys) + len(sells))
