#!/usr/bin/env python3
"""고증한 나라별 지도자(js/data/dominion.js G.NATION_LEADERS)로 후원자 군주 자리(js/data/rulers.js RULERS)를 다시 만든다.
대의 해·이름은 조사 목록을 그대로 따르고, 초상 그림 번호와 폐위 표시('x')만 예전 목록에서 같은 사람을 찾아 옮겨 붙인다.

    python tools/dominion/merge_rulers.py rulers_원본.js   # 원본(예전 RULERS)을 읽어 js/data/rulers.js 를 고쳐 쓴다
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SEATS = {
    'en_king': [('잉글랜드', 1480, 1707), ('영국', 1707, 9999)],
    'fr_king': [('프랑스', 1480, 9999)],
    'es_crown': [('카스티야', 1480, 1516), ('에스파냐', 1516, 9999)],
    'pt_king': [('포르투갈', 1480, 9999)],
    'de_emperor': [('신성로마제국', 1480, 1806), ('오스트리아', 1806, 9999)],
    'it_pope': [('교황령', 1480, 1870), ('교황', 1870, 9999)],
    'ot_sultan': [('오스만 제국', 1480, 9999)],
    'dk_king': [('덴마크', 1480, 9999)],
    'pl_king': [('폴란드', 1480, 1795)],
    'ru_prince': [('모스크바 대공국', 1480, 1547), ('러시아 차르국', 1547, 1721), ('러시아 제국', 1721, 9999)],
    'kr_king': [('조선', 1480, 1897), ('대한제국', 1897, 9999)],
    'jp_shogun': [('일본', 1480, 9999)],
    'in_delhi': [('델리 술탄국', 1480, 1526), ('무굴 제국', 1526, 1858)],
    'it_doge': [('베네치아', 1480, 1797)],
    'pe_shah': [('페르시아', 1480, 1501), ('사파비 왕조', 1501, 1736), ('페르시아', 1736, 9999)],
}
ALIAS = {'페르난도 섭정왕': '페르난도 2세', '무굴 황제 바부르': '바부르', '한스 왕': '한스', '야쿠브 베그': '야쿠브',
         '엔히크 추기경왕': '엔히크', '펠리페 1세 (에스파냐 국왕 겸)': '펠리페 1세'}
GENERIC = re.compile(r'공위|공석|정부|회의|후계자들|여럿|합병|평의회|참사회')


def load(path, var):
    code = "global.window={};require(%r);console.log(JSON.stringify(window.G.%s))" % (os.path.abspath(path), var)
    return json.loads(subprocess.check_output(['node', '-e', code]).decode('utf-8'))


def base(name):
    name = ALIAS.get(name, name)
    return re.sub(r'\s+', '', re.sub(r'\(.*?\)', '', name))


def same(old, new):
    """예전 이름(old)이 고증 이름(new)의 그 사람인가 — 섭정·공동 통치 표기가 붙어도 (예: 이반 4세 ↔ 이반 4세 (섭정 옐레나))"""
    b = base(old)
    if not b:
        return False
    nb = re.sub(r'\s+', '', new)
    head = base(new)
    if b == head:
        return True
    return ('섭정' + b) in nb or ('통치자' + b) in nb or (b in nb and len(b) >= 4 and not head.startswith('후아나'))


def main():
    orig = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'js', 'data', 'rulers.js')
    L = load(os.path.join(ROOT, 'js', 'data', 'dominion.js'), 'NATION_LEADERS')
    old = load(orig, 'RULERS')
    path = os.path.join(ROOT, 'js', 'data', 'rulers.js')
    src = open(orig, encoding='utf-8').read()
    out, report = {}, []
    for seat, parts in SEATS.items():
        o = old[seat]
        lst = []
        for nation, a, b in parts:
            for s, e, name in L.get(nation, []):
                s2, e2 = max(s, a, 1480), min(e, b)
                if not name or e2 < s2 or (e2 == s2 and not (a <= s < b)):
                    continue
                h = [s2, e2, name, 0]
                # 예전 목록의 같은 사람: 그림 번호와 폐위 표시를 옮긴다 (재위가 겹치는 사람만)
                for x in o:
                    if same(x[2], name) and x[0] < e2 + 1 and s2 < x[1] + 1:
                        if x[3] not in (0, None) and not (len(x) > 4 and x[4] == 'g'):
                            h[3] = x[3]
                        if len(x) > 4 and x[4] == 'x':
                            h.append('x')
                        break
                if len(h) < 5 and GENERIC.search(name):
                    h.append('g')
                if seat == 'it_doge' and s2 >= 1538 and h[3] == 0:     # 도제는 시대별 두 그림을 돌려 쓴다
                    h[3] = 5 if s2 < 1600 else 'it_doge'
                if seat == 'jp_shogun' and name.startswith('아시카가'):   # 무로마치 쇼군 공통 그림
                    h[3] = 1
                lst.append(h)
        lst.sort(key=lambda h: (h[0], h[1]))
        merged = []
        for h in lst:                                                # 같은 사람이 나라 이름만 바뀌어 이어지면 하나로
            if merged and merged[-1][2] == h[2] and merged[-1][1] >= h[0] and merged[-1][3] == h[3]:
                merged[-1][1] = max(merged[-1][1], h[1]); continue
            merged.append(h)
        out[seat] = merged
        used = {str(h[3]) for h in merged}
        lost = [x[2] + ' #' + str(x[3]) for x in o if x[3] not in (0, None) and str(x[3]) not in used and not (len(x) > 4 and x[4] == 'g')]
        if lost:
            report.append(seat + ' 그림을 못 붙인 사람: ' + ', '.join(lost))
    start = src.index('  var RULERS = {')
    end = src.index('  };', start) + 4
    body = ['  var RULERS = {']
    seats = list(old.keys())
    for i, k in enumerate(seats):
        lst = out.get(k) or old[k]
        items = ', '.join("[%d, %d, %s, %s%s]" % (h[0], h[1], "'" + h[2].replace("'", "’") + "'", ("'" + h[3] + "'") if isinstance(h[3], str) else h[3],
                                                   (", '" + h[4] + "'") if len(h) > 4 else '') for h in lst)
        body.append('    %s: [%s]%s' % (k, items, ',' if i < len(seats) - 1 else ''))
    body.append('  };')
    src = src[:start] + '\n'.join(body) + src[end:]
    note = "  // 대의 해·이름은 웹으로 고증한 지도자 목록(tools/dominion/out_L.json)을 따르고, 그림 번호는 같은 사람에게 옮겨 붙였다 (tools/dominion/merge_rulers.py)\n"
    src = re.sub(r"  // 1900년까지의 대는[^\n]*\n|  // 대의 해·이름은 웹으로[^\n]*\n", '', src)
    src = src.replace('  var RULERS = {', note + '  var RULERS = {', 1)
    open(path, 'w', encoding='utf-8', newline='\n').write(src)
    for k in SEATS:
        print(k, len(old[k]), '→', len(out[k]))
    print('\n'.join(report) or '그림 번호 모두 옮김')


if __name__ == '__main__':
    main()
