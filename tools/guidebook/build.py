# -*- coding: utf-8 -*-
"""게임 안 「플레이 가이드북」 만들기: docs/guidebook.md → js/data/guidebook.js

    python tools/guidebook/build.py

원고 규칙 (따로 설치할 것 없이 이 파일이 직접 HTML로 바꾼다)
  ## 장 제목        — 왼쪽 차례의 한 장
  ### 절 제목       — 장 안의 소제목 (차례에 들여 씀)
  ![설명](guide/이름) — 한 줄에 그림 하나: images/guide/이름.webp (게임은 G.Img 로 읽는다)
  **굵게**, [글](주소), - 목록, 1. 번호 목록, - [ ] 할 일, | 표 |
"""
import html
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'docs', 'guidebook.md')
OUT = os.path.join(ROOT, 'js', 'data', 'guidebook.js')


def unescape_md(s):
    return re.sub(r'\\([\\`*_{}\[\]()#+\-.!~|>])', r'\1', s)


def inline(s):
    """한 줄 안의 꾸밈: 굵게·링크·이스케이프"""
    out, pos = [], 0
    # 링크를 먼저 떼어 둔다
    for m in re.finditer(r'\[([^\]]+)\]\(([^)\s]+)\)', s):
        out.append(('t', s[pos:m.start()]))
        out.append(('a', m.group(1), m.group(2)))
        pos = m.end()
    out.append(('t', s[pos:]))
    res = []
    for part in out:
        if part[0] == 't':
            t = html.escape(unescape_md(part[1]), quote=False)
            t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
            res.append(t)
        else:
            res.append('<a href="%s" target="_blank" rel="noopener">%s</a>' % (html.escape(part[2]), html.escape(unescape_md(part[1]), quote=False)))
    return ''.join(res)


def table(rows):
    cells = [[c.strip() for c in r.strip().strip('|').split('|')] for r in rows]
    head, body = cells[0], [r for r in cells[2:]]
    h = '<table class="gb-table"><thead><tr>' + ''.join('<th>%s</th>' % inline(c) for c in head) + '</tr></thead><tbody>'
    for r in body:
        h += '<tr>' + ''.join('<td>%s</td>' % inline(c) for c in r) + '</tr>'
    return h + '</tbody></table>'


def block_html(lines):
    """한 장(## 아래)의 줄들 → HTML"""
    out, i, n = [], 0, len(lines)
    while i < n:
        ln = lines[i]
        s = ln.strip()
        if not s:
            i += 1
            continue
        m = re.match(r'^!\[([^\]]*)\]\(([^)]+)\)$', s)
        if m:
            alt, key = unescape_md(m.group(1)), m.group(2)
            out.append('<figure class="gb-fig"><img data-gk="%s" alt="%s"><figcaption>%s</figcaption></figure>' % (html.escape(key), html.escape(alt), html.escape(alt, quote=False)))
            i += 1
            continue
        if s.startswith('### '):
            out.append('<h3 data-sec="%d">%s</h3>' % (len([o for o in out if o.startswith('<h3')]), inline(s[4:])))
            i += 1
            continue
        if s.startswith('|'):
            rows = []
            while i < n and lines[i].strip().startswith('|'):
                rows.append(lines[i]); i += 1
            out.append(table(rows))
            continue
        if re.match(r'^(\d+)\.\s', s) or re.match(r'^[-*]\s', s):
            ordered = bool(re.match(r'^\d+\.\s', s))
            items = []
            while i < n and lines[i].strip() and (re.match(r'^(\d+)\.\s', lines[i].strip()) or re.match(r'^[-*]\s', lines[i].strip()) or lines[i].startswith('    ')):
                t = lines[i].strip()
                if lines[i].startswith('    ') and items:
                    items[-1] += ' ' + t
                else:
                    items.append(re.sub(r'^(\d+\.|[-*])\s+', '', t))
                i += 1
            lis = []
            for it in items:
                cm = re.match(r'^\[( |x)\]\s+(.*)$', it)
                if cm:
                    lis.append('<li class="gb-task"><span class="gb-box">%s</span>%s</li>' % ('✔' if cm.group(1) == 'x' else '', inline(cm.group(2))))
                else:
                    lis.append('<li>%s</li>' % inline(it))
            out.append(('<ol>%s</ol>' if ordered else '<ul>%s</ul>') % ''.join(lis))
            continue
        # 문단: 빈 줄까지
        para = []
        while i < n and lines[i].strip() and not lines[i].strip().startswith(('### ', '|', '![')) and not re.match(r'^(\d+\.|[-*])\s', lines[i].strip()):
            para.append(lines[i].strip()); i += 1
        out.append('<p>%s</p>' % inline(' '.join(para)))
    return '\n'.join(out)


def main():
    src = open(SRC, encoding='utf-8').read()
    src = re.sub(r'<!--.*?-->', '', src, flags=re.S)
    chapters, cur = [], None
    for ln in src.split('\n'):
        if ln.startswith('## '):
            cur = {'title': unescape_md(ln[3:].strip()), 'lines': []}
            chapters.append(cur)
        elif cur is not None:
            cur['lines'].append(ln)
    data, keys = [], set()
    for k, ch in enumerate(chapters):
        secs = [unescape_md(l.strip()[4:]) for l in ch['lines'] if l.strip().startswith('### ')]
        body = block_html(ch['lines'])
        keys.update(re.findall(r'data-gk="([^"]+)"', body))
        data.append({'id': 'c%d' % (k + 1), 'title': ch['title'], 'secs': secs, 'html': body})
    missing = [k for k in sorted(keys) if not any(os.path.exists(os.path.join(ROOT, 'images', k + e)) for e in ('.webp', '.jpg', '.png'))]
    js = ('/* 자동 생성 파일입니다 — 원고는 docs/guidebook.md. 고친 뒤 python tools/guidebook/build.py 로 다시 만든다.\n'
          '   게임 안 「플레이 가이드북」(조작 안내 → 플레이 가이드북, js/ui/guidebook.js)의 장(章)들. 그림은 images/guide/ (G.Img 키 data-gk) */\n'
          'window.G = window.G || {};\nG.GUIDEBOOK = {\n  title: %s,\n  chapters: %s\n};\n') % (
        json.dumps('Loop of Good Hope 플레이 가이드북', ensure_ascii=False),
        json.dumps(data, ensure_ascii=False, indent=1))
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)
    print('가이드북 %d장 · 그림 %d장 → js/data/guidebook.js' % (len(data), len(keys)))
    if missing:
        print('그림 파일이 없습니다:', ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
