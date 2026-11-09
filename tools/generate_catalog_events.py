#!/usr/bin/env python3
"""게임의 장면 이름과 첫 대사를 도감용 정적 자료로 모은다. 실행 중 소스 읽기는 없다."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUOTED = r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\""
SCENE = re.compile(r"\b(?:withPic|withScene)\(\s*(" + QUOTED + r")\s*,\s*(" + QUOTED + r")")
LINE = re.compile(r"\[\s*(?:null|" + QUOTED + r")\s*,\s*(" + QUOTED + r")\s*\]")


def literal(s):
    # 자료는 문자열 리터럴만 허용한다. 자바스크립트는 실행하지 않는다.
    return re.sub(r"\\(['\"\\nrt])", lambda m: {'n': '\n', 'r': '\r', 't': '\t'}.get(m[1], m[1]), s[1:-1])


def scene_body(tail):
    """호출에 직접 넘긴 함수만 읽어 다음 함수의 대사가 섞이지 않게 한다."""
    start = re.match(r'\s*,\s*(?:async\s+)?function\s*\([^)]*\)\s*\{', tail)
    if not start:
        return ''
    pos, depth = start.end(), 1
    begin = pos
    while pos < len(tail):
        ch = tail[pos]
        if ch in "'\"`":
            quote = ch
            pos += 1
            while pos < len(tail):
                if tail[pos] == '\\':
                    pos += 2
                    continue
                if tail[pos] == quote:
                    break
                pos += 1
        elif tail.startswith('//', pos):
            end = tail.find('\n', pos)
            pos = end if end >= 0 else len(tail)
        elif tail.startswith('/*', pos):
            end = tail.find('*/', pos + 2)
            pos = end + 1 if end >= 0 else len(tail)
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if not depth:
                return tail[begin:pos]
        pos += 1
    return ''


def collect():
    scenes = {}
    for path in sorted((ROOT / 'js/systems').glob('*.js')):
        source = path.read_text(encoding='utf-8-sig')
        header = re.search(r'/\*\s*([^\n]+)', source)
        group = re.split(r' — |[（(]|\s+[-–]\s+', header[1] if header else '모험 이야기')[0].strip(' */')
        for match in SCENE.finditer(source):
            key, title = map(literal, match.groups())
            if not key or not title or re.search(r'[A-Za-z_]\w*\.', title):
                continue
            key = key if '/' in key else 'legend-events/' + key
            # 장면 안의 대사만 읽는다. 다음 장면의 글을 잘못 붙이지 않는다.
            tail = scene_body(source[match.end():])
            lines = [literal(m[1]) for m in LINE.finditer(tail)]
            text = ' '.join(lines[:3])
            text = re.sub(r'<[^>]*>', '', text)
            text = re.sub(r'\{[^}]+\}', '일행', text).strip()
            scenes.setdefault(key, dict(key=key, name=title.rstrip(' ('), story=group, text=text))
    return list(scenes.values())


if __name__ == '__main__':
    scenes = collect()
    target = ROOT / 'js/data/catalogscenes.js'
    target.write_text('/* 사건 도감 자료 — tools/generate_catalog_events.py로 게임 장면에서 모음. */\n'
                      + '(function (G) {\n  \'use strict\';\n  G.CATALOG_SCENES = '
                      + json.dumps(scenes, ensure_ascii=False, indent=2)
                      + ';\n})(window.G = window.G || {});\n', encoding='utf-8', newline='\n')
    print(f'사건 장면 {len(scenes)}개 → {target.relative_to(ROOT)}')
