#!/usr/bin/env python3
"""게임을 파일 하나(PLUS_ULTRA.html)로 묶습니다. images 폴더의 교체 그림도 파일 안에 넣습니다.

사용법 (WebGame 폴더에서):
    python tools/bundle.py                      # PLUS_ULTRA.html 다시 만들기
    python tools/bundle.py --artifact 폴더       # Claude 아티팩트용 게임(game.html)·도감(catalog.html)도 만들기
                                                #   그림은 폴더/img/pack-NN-해시.js 묶음으로 따로 (페이지 16MiB 한도와 상관없게)
                                                #   올릴 목록은 폴더/publish.json (packs = 올릴 묶음, removed = 아티팩트에서 지울 옛 묶음)
    python tools/bundle.py --mark-published 폴더 # 아티팩트에 올린 뒤 '올린 목록'을 적어 둔다
"""
import json, os, sys

sys.dont_write_bytecode = True  # tools 폴더에 __pycache__ 를 만들지 않음
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import images as imgtool  # noqa: E402
import pages  # noqa: E402

ARTIFACT_LIMIT = 16 * 1024 * 1024      # 아티팩트 페이지 하나·텍스트 파일 하나의 한도 (16MiB)
PUBLISH_LIMIT = 60 * 1000 * 1000       # 한 번에 올릴 수 있는 합계 64MB보다 조금 적게
PACK_TARGET = 4 * 1024 * 1024          # 그림 묶음 파일 하나의 크기 (대략)


def image_packs(found, base, out_dir):
    """아티팩트용: 그림을 data: 주소로 바꿔 몇 개의 JS 묶음 파일(img/pack-NN-해시.js)에 나눠 담는다.
    페이지(game.html)에는 그림이 들어가지 않으므로 페이지 한도(16MiB)와 상관없이 그림을 늘릴 수 있다.
    돌려주는 값: [(페이지에서 부를 상대 경로, 바이트 수)]"""
    img_dir = os.path.join(out_dir, 'img')
    os.makedirs(img_dir, exist_ok=True)
    for f in os.listdir(img_dir):
        if f.startswith('pack-') and f.endswith('.js'):
            os.remove(os.path.join(img_dir, f))
    packs, cur, n = [], {}, 0
    for k, rel in sorted(found.items()):
        uri = pages.data_uri(os.path.join(base or os.path.join(pages.ROOT, 'images'), rel))
        if cur and n + len(uri) > PACK_TARGET:
            packs.append(cur)
            cur, n = {}, 0
        cur[k] = uri
        n += len(uri) + len(k) + 8
    if cur:
        packs.append(cur)
    out = []
    for i, pk in enumerate(packs, 1):
        js = ('/* PLUS ULTRA 그림 묶음 %d/%d (tools/bundle.py가 만듦) */\nwindow.G = window.G || {};\n'
              'G.IMAGE_FILES = Object.assign(G.IMAGE_FILES || {}, %s);\n') % (i, len(packs), json.dumps(pk, ensure_ascii=False))
        rel = 'img/pack-%02d-%s.js' % (i, pages.short_hash(js))
        with open(os.path.join(out_dir, rel), 'w', encoding='utf-8', newline='\n') as f:
            f.write(js)
        out.append((rel, len(js.encode('utf-8'))))
    return out


def inline(page, found, artifact, title=None, extra_css='', base=None, packs=None):
    p = pages.parse(page)
    css = '\n'.join(pages.read(c) for c in p['css']) + extra_css
    parts = []
    for s in p['scripts']:
        if s == 'images/manifest.js' and packs is not None:
            # 그림은 따로 올린 묶음 파일에서 읽는다 (차례대로 읽히므로 게임 코드보다 먼저 준비된다)
            paths = {k: rel for k, rel in sorted(found.items())}
            parts.append('<script>/* images (packs) */\nwindow.G = window.G || {};\nG.IMAGE_FILES = G.IMAGE_FILES || {};\nG.IMAGE_PATHS = ' + json.dumps(paths, ensure_ascii=False) + ';\n</script>')
            parts.extend('<script src="' + rel + '"></script>' for rel, _ in packs)
        elif s == 'images/manifest.js':
            js, _ = pages.manifest_js(found, embed=True, base=base)
            # data: 주소만으로는 움직이는 WEBP를 알 수 없어서 그 그림들의 원래 이름을 함께 넣는다 (G.Img.isAnim)
            anim = {k: rel for k, rel in sorted(found.items()) if rel.lower().endswith(('.anim.webp', '.gif'))}
            if anim:
                js += '\nG.IMAGE_PATHS = Object.assign(G.IMAGE_PATHS || {}, ' + json.dumps(anim, ensure_ascii=False) + ');\n'
            parts.append('<script>/* images (embedded) */\n' + js + '</script>')
        else:
            parts.append('<script>/* ' + s + ' */\n' + pages.script_text(s) + '\n</script>')
    icon = '<link rel="icon" href="' + pages.data_uri(os.path.join(pages.ROOT, 'favicon.svg')) + '" type="image/svg+xml">'
    title = title or p['title']
    head = '<title>' + title + '</title>\n' + ('' if artifact else icon + '\n') + '\n'.join(p['fonts']) + '\n<style>\n' + css + '\n</style>\n'
    if artifact:
        return head + p['markup'] + '\n' + '\n'.join(parts) + '\n'
    return ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + head +
            '</head>\n<body>\n' + p['markup'] + '\n' + '\n'.join(parts) + '\n</body>\n</html>\n')


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    n = len(text.encode('utf-8'))
    print('%-42s %s' % (os.path.relpath(path, pages.ROOT) if path.startswith(pages.ROOT) else path, pages.human(n)))
    return n


def mark_published(out):
    """아티팩트에 올린 뒤: 지금 묶음 목록을 '올린 목록'으로 적어 둔다 (다음 번에 지울 옛 묶음을 알 수 있게)"""
    pub_path = os.path.join(out, 'publish.json')
    with open(pub_path, encoding='utf-8') as f:
        d = json.load(f)
    d['published'] = d.get('packs', [])
    d['removed'] = []
    with open(pub_path, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    print('올린 묶음 %d개를 적어 두었습니다.' % len(d['published']))


def main():
    if '--mark-published' in sys.argv:
        i = sys.argv.index('--mark-published')
        mark_published(sys.argv[i + 1] if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith('--') else os.path.join(pages.ROOT, 'dist', 'artifact'))
        return
    try:
        sys.stdout.reconfigure(errors='replace')  # 콘솔 인코딩에 없는 글자는 ? 로
    except Exception:
        pass
    found, dups = imgtool.scan()
    imgtool.write_manifest(found)
    if found:
        print('교체 그림 %d장을 파일 안에 넣습니다.' % len(found))
    # 한 파일짜리 판과 아티팩트는 브라우저가 한 번에 읽어야 하므로 그림을 줄여 넣는다
    import slim
    slim_dir = os.path.join(pages.ROOT, 'dist', 'slim-images')
    sfound = slim.build(found, slim_dir, 1.0)
    write(os.path.join(pages.ROOT, 'PLUS_ULTRA.html'), inline('index.html', sfound, False, base=slim_dir))
    if '--artifact' in sys.argv:
        i = sys.argv.index('--artifact')
        out = sys.argv[i + 1] if i + 1 < len(sys.argv) else os.path.join(pages.ROOT, 'dist', 'artifact')
        os.makedirs(out, exist_ok=True)
        # 아티팩트는 페이지(game.html·catalog.html) + 그림 묶음 파일(img/pack-*.js)로 나눠 올린다.
        # 한도: 페이지·텍스트 파일 하나 16MiB, 한 번에 올리는 합계 64MB → 그림이 늘어도 페이지는 코드만큼만 커진다
        old = {}
        pub_path = os.path.join(out, 'publish.json')
        if os.path.exists(pub_path):
            try:
                with open(pub_path, encoding='utf-8') as f:
                    old = json.load(f)
            except Exception:
                old = {}
        scale = 1.0
        while True:
            if scale != 1.0:
                sfound = slim.build(found, slim_dir, scale)
            packs = image_packs(sfound, slim_dir, out)
            n1 = write(os.path.join(out, 'game.html'), inline('index.html', sfound, True, title='PLUS ULTRA 더 먼 바다로', extra_css='\nhtml, body { height: 100%; }\n', base=slim_dir, packs=packs))
            n2 = write(os.path.join(out, 'catalog.html'), inline('catalog.html', sfound, True, base=slim_dir, packs=packs))
            total = n1 + sum(b for _, b in packs)
            for rel, b in packs:
                print('%-42s %s' % (rel, pages.human(b)))
            ok = max([n1, n2] + [b for _, b in packs]) <= ARTIFACT_LIMIT and total <= PUBLISH_LIMIT
            if ok or scale < 0.4:
                break
            scale -= 0.15
            print('한도를 넘어 그림을 더 줄입니다 (배율 %.2f)' % scale)
        print('아티팩트 합계 %s (페이지 %s + 그림 묶음 %d개 %s) — 페이지 한도 %s까지 %s 남음' % (
            pages.human(total), pages.human(n1), len(packs), pages.human(total - n1), pages.human(ARTIFACT_LIMIT), pages.human(ARTIFACT_LIMIT - max(n1, n2))))
        if not ok:
            print('주의: 아티팩트 한도(파일 하나 16MiB, 합계 64MB)를 넘습니다. 그림 수를 줄여야 합니다.')
        # 올릴 때 쓸 목록: 새 묶음 파일, 지난번에 '올린' 묶음 가운데 이제는 없는 것(아티팩트에서 지울 것)
        # 올린 뒤 python tools/bundle.py --mark-published 로 '올린 목록'을 새로 적는다
        new = [rel for rel, _ in packs]
        # 배경 음악은 페이지에 넣지 않고 music/*.mp3 파일 그대로 아티팩트에 올린다 (한 번에 64MB 한도 — 그림 묶음과 따로 올려도 된다)
        music = []
        mdir = os.path.join(pages.ROOT, 'music')
        if os.path.isdir(mdir):
            import shutil
            os.makedirs(os.path.join(out, 'music'), exist_ok=True)
            for fn in sorted(os.listdir(mdir)):
                if fn.lower().endswith(('.mp3', '.ogg', '.m4a')):
                    shutil.copy2(os.path.join(mdir, fn), os.path.join(out, 'music', fn))
                    music.append('music/' + fn)
            print('배경 음악 %d곡: %s' % (len(music), pages.human(sum(os.path.getsize(os.path.join(out, m)) for m in music))))
        published = old.get('published', [])
        removed = [rel for rel in published if rel not in new]
        with open(pub_path, 'w', encoding='utf-8') as f:
            json.dump({'pages': ['game.html', 'catalog.html'], 'packs': new, 'music': music, 'published': published, 'removed': removed, 'bytes': total}, f, ensure_ascii=False, indent=1)
        print('올릴 파일 목록: ' + os.path.relpath(pub_path, pages.ROOT) if pub_path.startswith(pages.ROOT) else '올릴 파일 목록: ' + pub_path)


if __name__ == '__main__':
    main()
