# -*- coding: utf-8 -*-
"""효과음 묶음 만들기 — sounds/nature/*.ogg → sounds/nature.pack.js (2026-11-04 저작권 QA 8번)

Mixkit·Pixabay 효과음은 「게임 안에서 쓰는 것은 되지만 소리 파일을 따로 떼어 배포하는 것은 안 된다」는 조건이다.
그래서 낱개 .ogg 파일을 공개 저장소·배포판에 싣지 않고, 이 게임만 읽는 묶음 하나(sounds/nature.pack.js)로 합쳐 싣는다.
원본 .ogg는 제작자의 컴퓨터에만 둔다(.gitignore). 소리를 바꾸면 원본을 고친 뒤 이 스크립트를 다시 돌린다.

    python tools/sfx_pack.py            # sounds/nature → sounds/nature.pack.js

게임은 소리가 처음 필요할 때 묶음을 읽는다(js/systems/audio.js G.SFX_BANK — 읽기 전에는 합성음).
"""
import base64, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKS = {'nature': '효과음 묶음 — Mixkit(Mixkit Sound Effects Free License)·Pixabay(Pixabay Content License) 소리를 이 게임 안에서만 쓰도록 합친 것. '
                   '따로 떼어 배포·판매할 수 없다. 출처: sounds/nature/License.txt · THIRD_PARTY_NOTICES.md'}

def build(name):
    src = os.path.join(ROOT, 'sounds', name)
    files = sorted(f for f in os.listdir(src) if f.lower().endswith('.ogg')) if os.path.isdir(src) else []
    if not files:
        print('원본이 없어 건너뜀:', src); return None
    out = os.path.join(ROOT, 'sounds', name + '.pack.js')
    lines = ['/* ' + PACKS[name] + '\n   tools/sfx_pack.py가 만든다 — 손으로 고치지 않는다. */',
             '(function (G) {', "  var B = G.SFX_BANK = G.SFX_BANK || {};"]
    total = 0
    for f in files:
        b = open(os.path.join(src, f), 'rb').read(); total += len(b)
        lines.append("  B['%s/%s'] = '%s';" % (name, f[:-4], base64.b64encode(b).decode('ascii')))
    lines.append("  B.__loaded = (B.__loaded || []).concat(['%s']);" % name)
    lines.append('})(window.G = window.G || {});')
    data = '\n'.join(lines) + '\n'
    old = open(out, encoding='utf-8').read() if os.path.exists(out) else None
    if old != data: open(out, 'w', encoding='utf-8', newline='\n').write(data)
    print('%s: %d개 · 원본 %.1fMB → %s %.1fMB%s' % (name, len(files), total / 1e6, os.path.relpath(out, ROOT), len(data) / 1e6, '' if old != data else ' (그대로)'))
    return out

if __name__ == '__main__':
    for n in (sys.argv[1:] or PACKS.keys()): build(n)
