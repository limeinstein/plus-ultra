#!/usr/bin/env python3
"""게임을 파일 하나(PLUS_ULTRA.html)로 묶습니다. images 폴더의 교체 그림도 파일 안에 넣습니다.

사용법 (WebGame 폴더에서):
    python tools/bundle.py                      # PLUS_ULTRA.html 다시 만들기
    python tools/bundle.py --artifact 폴더       # Claude 아티팩트용 게임(game.html)·도감(catalog.html)도 만들기
                                                #   그림은 폴더/img/pack-NN-해시.js 묶음으로 따로 — 페이지를 열 때 읽지 않고, 그 묶음의 그림이 처음 필요할 때 읽는다
                                                #   (그래서 화면 크기에 맞는 큰 그림(slim.HQ)을 쓸 수 있다. 한도는 아티팩트 한 판 256MB 안에서 PACK_BUDGET)
                                                #   움직이는 그림(유적 GIF)은 묶음 대신 폴더/images/… 파일로 따로 (필요할 때만 읽힘)
                                                #   올릴 목록은 폴더/publish.json (packs = 올릴 묶음, files = 그림 파일, removed = 아티팩트에서 지울 옛 것)
    python tools/bundle.py --mark-published 폴더 # 아티팩트에 올린 뒤 '올린 목록'을 적어 둔다
    python tools/bundle.py --artifact 폴더 --scale 0.4   # 그림 배율을 이 값부터 시작 (한도를 넘을 걸 알 때 시간 절약)
"""
import json, os, sys

sys.dont_write_bytecode = True  # tools 폴더에 __pycache__ 를 만들지 않음
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import images as imgtool  # noqa: E402
import pages  # noqa: E402

ARTIFACT_LIMIT = 16 * 1024 * 1024      # 아티팩트 페이지 하나·텍스트 파일 하나의 한도 (16MiB)
PACK_BUDGET = 170 * 1000 * 1000        # 그림 묶음 합계 한도. 아티팩트 한 판은 256MB까지 — 장면 판·음악·페이지(약 80MB)를 빼고 남는 만큼
PACK_TARGET = 3 * 1024 * 1024          # 그림 묶음 파일 하나의 크기 (대략) — 작을수록 한 장면에서 덜 받는다


def image_packs(found, base, out_dir):
    """아티팩트용: 그림을 data: 주소로 바꿔 몇 개의 JS 묶음 파일(img/pack-NN-해시.js)에 나눠 담는다.
    페이지(game.html)에는 그림이 들어가지 않으므로 페이지 한도(16MiB)와 상관없이 그림을 늘릴 수 있다.
    돌려주는 값: [(페이지에서 부를 상대 경로, 바이트 수)]"""
    img_dir = os.path.join(out_dir, 'img')
    os.makedirs(img_dir, exist_ok=True)
    for f in os.listdir(img_dir):
        if f.startswith('pack-') and f.endswith('.js'):
            os.remove(os.path.join(img_dir, f))
    packs, cur, n, cat = [], {}, 0, None
    for k, rel in sorted(found.items()):
        uri = pages.data_uri(os.path.join(base or os.path.join(pages.ROOT, 'images'), rel))
        c = k.split('/')[0]
        if cur and (n + len(uri) > PACK_TARGET or (c != cat and n > PACK_TARGET // 4)):
            packs.append(cur)
            cur, n = {}, 0
        cur[k] = uri
        cat = c
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
        out.append((rel, len(js.encode('utf-8')), sorted(pk)))
    return out


def split_anim(found):
    """아티팩트용: 움직이는 그림(유적 GIF → .anim.webp)은 묶음에 넣지 않고 images/ 아래 파일로 따로 올린다.
    묶음은 페이지를 열 때 모두 읽히지만, 따로 올린 파일은 발견 연출·도감에서 필요할 때만 읽힌다.
    발견 장면 판(discovery-sheets/)도 따로 올린다. 장면 판이 있는 발견물의 움직이는 그림은 게임이 쓰지 않으므로 뺀다."""
    sheets = {k[len('discovery-sheets/'):] for k in found if k.startswith('discovery-sheets/')}
    anim = {k: rel for k, rel in found.items() if rel.lower().endswith(('.anim.webp', '.gif')) or k.startswith('discovery-sheets/')}
    anim = {k: rel for k, rel in anim.items() if not (k.startswith('discoveries/') and k[len('discoveries/'):] in sheets)}
    rest = {k: rel for k, rel in found.items() if k not in anim and not (k.startswith('discoveries/') and k[len('discoveries/'):] in sheets and rel.lower().endswith(('.anim.webp', '.gif')))}
    return rest, anim


def inline(page, found, artifact, title=None, extra_css='', base=None, packs=None, files=None):
    p = pages.parse(page)
    css = '\n'.join(pages.read(c) for c in p['css']) + extra_css
    parts = []
    for s in p['scripts']:
        if s == 'images/manifest.js' and packs is not None:
            # 그림은 따로 올린 묶음 파일(img/pack-NN.js)에 있다. 페이지를 열 때는 읽지 않고, 묶음 안의 그림이 처음 필요할 때
            # G.Img가 그 묶음을 읽는다 — 그때까지 G.IMAGE_FILES 에는 'pack:번호' 자리표만 둔다 (has·pick·list는 바로 된다)
            paths = {k: rel for k, rel in sorted(found.items())}
            lazy = {}
            for i, (_, _, keys) in enumerate(packs):
                for k in keys:
                    lazy[k] = 'pack:%d' % i
            lazy.update(files or {})   # 따로 올린 그림 파일(images/…)은 상대 경로로 — G.Img가 images/ 를 붙여 필요할 때 읽는다
            parts.append('<script>/* images (lazy packs) */\nwindow.G = window.G || {};\nG.IMAGE_PACK_URLS = ' + json.dumps([rel for rel, _, _ in packs]) +
                         ';\nG.IMAGE_FILES = Object.assign(G.IMAGE_FILES || {}, ' + json.dumps(lazy, ensure_ascii=False) + ');\nG.IMAGE_PATHS = ' + json.dumps(paths, ensure_ascii=False) + ';\n</script>')
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
    d['published_files'] = d.get('files', [])
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
        scale = float(sys.argv[sys.argv.index('--scale') + 1]) if '--scale' in sys.argv else 1.0
        hq_dir = os.path.join(pages.ROOT, 'dist', 'slim-hq')
        # 장면 판이 있는 발견물의 움직이는 그림은 아티팩트에 넣지 않으므로 줄이지도 않는다 (시간 절약)
        sheet_ids = {k[len('discovery-sheets/'):] for k in found if k.startswith('discovery-sheets/')}
        skip = {k for k, rel in found.items() if k.startswith('discoveries/') and k[len('discoveries/'):] in sheet_ids and rel.lower().endswith('.gif')}
        slim_dir = hq_dir
        while True:
            sfound = slim.build(found, hq_dir, scale, hq=True, skip=skip)
            pfound, afound = split_anim(sfound)
            packs = image_packs(pfound, slim_dir, out)
            import shutil
            if os.path.isdir(os.path.join(out, 'images')):
                shutil.rmtree(os.path.join(out, 'images'))
            for rel in afound.values():
                dst = os.path.join(out, 'images', rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(os.path.join(slim_dir, rel), dst)
            n1 = write(os.path.join(out, 'game.html'), inline('index.html', sfound, True, title='Loop of Good Hope 더 먼 바다로', extra_css='\nhtml, body { height: 100%; }\n', base=slim_dir, packs=packs, files=afound))
            n2 = write(os.path.join(out, 'catalog.html'), inline('catalog.html', sfound, True, base=slim_dir, packs=packs, files=afound))
            nf = sum(os.path.getsize(os.path.join(out, 'images', rel)) for rel in afound.values())
            print('따로 올리는 움직이는 그림 %d장: %s (필요할 때만 읽힘)' % (len(afound), pages.human(nf)))
            total = n1 + sum(b for _, b, _ in packs)
            for rel, b, _ in packs:
                print('%-42s %s' % (rel, pages.human(b)))
            ok = max([n1, n2] + [b for _, b, _ in packs]) <= ARTIFACT_LIMIT and total - n1 <= PACK_BUDGET
            if ok or scale < 0.5:
                break
            scale -= 0.05
            print('한도를 넘어 그림을 더 줄입니다 (배율 %.2f)' % scale)
        print('아티팩트 합계 %s (페이지 %s + 그림 묶음 %d개 %s) — 페이지 한도 %s까지 %s 남음' % (
            pages.human(total), pages.human(n1), len(packs), pages.human(total - n1), pages.human(ARTIFACT_LIMIT), pages.human(ARTIFACT_LIMIT - max(n1, n2))))
        if not ok:
            print('주의: 아티팩트 한도(파일 하나 16MiB, 그림 묶음 합계 %s)를 넘습니다. 그림 수를 줄여야 합니다.' % pages.human(PACK_BUDGET))
        # 올릴 때 쓸 목록: 새 묶음 파일, 지난번에 '올린' 묶음 가운데 이제는 없는 것(아티팩트에서 지울 것)
        # 올린 뒤 python tools/bundle.py --mark-published 로 '올린 목록'을 새로 적는다
        new = [rel for rel, _, _ in packs]
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
        img_files = sorted('images/' + rel for rel in afound.values())
        old_files = old.get('published_files', [])
        removed += [rel for rel in old_files if rel not in img_files]
        with open(pub_path, 'w', encoding='utf-8') as f:
            json.dump({'pages': ['game.html', 'catalog.html'], 'packs': new, 'files': img_files, 'music': music, 'published': published,
                       'published_files': old_files, 'removed': removed, 'bytes': total, 'files_bytes': nf}, f, ensure_ascii=False, indent=1)
        print('올릴 파일 목록: ' + os.path.relpath(pub_path, pages.ROOT) if pub_path.startswith(pages.ROOT) else '올릴 파일 목록: ' + pub_path)


if __name__ == '__main__':
    main()
