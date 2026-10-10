#!/usr/bin/env python3
"""설치형 게임(Windows 설치 파일)에 넣을 게임 파일을 desktop/app 에 만든다. 설치 파일은 desktop/ 의 Electron이 만든다.

용량 걱정 없이 원본 그림을 그대로 싣되, 게임이 쓰지 않는 것은 뺀다:
  · 그림은 게임이 찾는 이름(images/manifest.js)만 — 원화·미리보기·제작 도구·시험·문서는 넣지 않는다
  · 장면 판(discovery-sheets)이 있는 발견물의 움직이는 GIF(합쳐 약 1GB)는 넣지 않는다 — 게임은 장면 판을 돌리고,
    정지 그림 자리(수첩·카드 미리보기)는 그 발견물의 마지막 장면(discovery-ends)이 대신한다
  · 쓰지 않는 옛 탐험대 시트(js/data/expedition_motion.js에 이름이 없는 것)
  · 무릎상(<그림>_half, 1024×1536)은 긴 변 1280px WebP(품질 82)로 — QHD 전체 화면에서도 또렷하고 30~40% 가볍다.
    한 번 만든 것은 desktop/.imgcache 에 원본 해시로 남겨 다음에는 다시 굽지 않는다
  · 도감(catalog.html)은 웹판에만
글꼴(Google Fonts)은 내려받아 desktop/app/fonts 에 넣는다(인터넷 없이도 같은 글꼴). 받지 못하면 온라인 링크를 그대로 둔다.

사용법 (WebGame 폴더에서):
    python tools/build_desktop.py               # desktop/app 만들기
    python tools/build_desktop.py --no-fonts    # 글꼴 내려받기 건너뛰기
그다음 desktop 폴더에서:  npm install  →  npx electron-builder --win nsis   (GitHub Actions: .github/workflows/desktop.yml)
"""
import os, re, sys, json, shutil, hashlib, urllib.request

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import images as imgtool  # noqa: E402
import pages  # noqa: E402
import build_web as W  # noqa: E402

APP = os.path.join(pages.ROOT, 'desktop', 'app')
FONT_CACHE = os.path.join(pages.ROOT, 'desktop', '.fontcache')
IMG_CACHE = os.path.join(pages.ROOT, 'desktop', '.imgcache')
HALF_SIDE, HALF_Q = 1280, 82
LIMIT = 1900 * 1000 * 1000   # GitHub 릴리스 파일·NSIS 설치 파일 한도(2GB)보다 조금 아래
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
DESC = '대항해 시대를 무대로 한 모험·교역·해전 게임.'


def pick_images(found):
    """게임에 실을 그림: 키 → images 기준 상대 경로. (빼는 그림 수, 줄인 바이트)"""
    out = dict(found)
    sheets = {k[len('discovery-sheets/'):] for k in found if k.startswith('discovery-sheets/')}
    dropped, saved = 0, 0
    for k, rel in found.items():
        if k.startswith('discoveries/') and rel.lower().endswith('.gif') and k[len('discoveries/'):] in sheets:
            end = found.get('discovery-ends/' + k[len('discoveries/'):])
            if end:
                out[k] = end          # 정지 그림 자리는 마지막 장면으로
                dropped += 1
                saved += os.path.getsize(os.path.join(pages.ROOT, 'images', rel))
    try:
        with open(os.path.join(pages.ROOT, 'js', 'data', 'expedition_motion.js'), encoding='utf-8') as f:
            em = f.read()
        for k in [k for k in out if k.startswith('sprites/expedition_') and k[len('sprites/'):] not in em]:
            saved += os.path.getsize(os.path.join(pages.ROOT, 'images', out[k]))
            del out[k]
            dropped += 1
    except OSError:
        pass
    return out, dropped, saved


def is_half(k):
    return k.endswith('_half') and k.startswith(('portraits/', 'maid-styles/', 'characters/'))


def _shrink(job):
    src, dst = job
    from PIL import Image
    im = Image.open(src)
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    s = min(1.0, HALF_SIDE / max(im.size))
    if s < 1.0:
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    im.save(dst + '.part', 'WEBP', quality=HALF_Q, method=4)
    os.replace(dst + '.part', dst)
    return dst


def shrink_halves(use):
    """무릎상을 가볍게: 키 → (원본 경로, 실을 경로, 앱 안 상대 경로). 원본보다 15% 넘게 작아질 때만 바꾼다"""
    try:
        import PIL  # noqa: F401
    except ImportError:
        print('Pillow가 없어 무릎상을 원본 그대로 싣습니다 (pip install pillow)')
        return {}
    os.makedirs(IMG_CACHE, exist_ok=True)
    plan, jobs = {}, []
    taken = set(use.values())
    for k, rel in use.items():
        if not is_half(k) or rel.lower().endswith('.gif'):
            continue
        src = os.path.join(pages.ROOT, 'images', rel)
        with open(src, 'rb') as f:
            h = hashlib.sha1(f.read()).hexdigest()[:20]
        cached = os.path.join(IMG_CACHE, '%s_%d_%d.webp' % (h, HALF_SIDE, HALF_Q))
        new_rel = os.path.splitext(rel)[0] + '.webp'
        if new_rel != rel and new_rel in taken:
            continue
        plan[k] = (src, cached, new_rel)
        if not os.path.exists(cached):
            jobs.append((src, cached))
    if jobs:
        from multiprocessing import Pool
        with Pool(max(1, (os.cpu_count() or 2))) as pool:
            for i, _ in enumerate(pool.imap_unordered(_shrink, jobs, chunksize=8)):
                if i % 200 == 0:
                    print('  무릎상 굽는 중 %d/%d' % (i, len(jobs)))
    return {k: v for k, v in plan.items() if os.path.getsize(v[1]) < os.path.getsize(v[0]) * 0.85}


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def local_fonts(links):
    """<link href="https://fonts.googleapis.com/css2?..."> 의 글꼴을 내려받아 fonts/fonts.css 로. 실패하면 None"""
    hrefs = [m.group(1).replace('&amp;', '&') for l in links for m in [re.search(r'href="(https://fonts\.googleapis\.com/css2[^"]+)"', l)] if m]
    if not hrefs:
        return None
    os.makedirs(FONT_CACHE, exist_ok=True)
    css_all = []
    try:
        for href in hrefs:
            css = fetch(href).decode('utf-8')

            def repl(m):
                url = m.group(1)
                name = hashlib.sha1(url.encode()).hexdigest()[:16] + '.woff2'
                cached = os.path.join(FONT_CACHE, name)
                if not os.path.exists(cached):
                    data = fetch(url)
                    with open(cached + '.part', 'wb') as f:
                        f.write(data)
                    os.replace(cached + '.part', cached)
                os.makedirs(os.path.join(APP, 'fonts'), exist_ok=True)
                W.copy_if_changed(cached, os.path.join(APP, 'fonts', name))
                return 'url(' + name + ')'
            css_all.append(re.sub(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', repl, css))
    except Exception as e:  # 인터넷이 없거나 막힘 — 온라인 링크를 그대로 둔다
        print('글꼴을 받지 못해 온라인 글꼴 링크를 그대로 씁니다:', e)
        return None
    os.makedirs(os.path.join(APP, 'fonts'), exist_ok=True)
    with open(os.path.join(APP, 'fonts', 'fonts.css'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(css_all))
    return len(os.listdir(os.path.join(APP, 'fonts'))) - 1


def main():
    try:
        sys.stdout.reconfigure(errors='replace')
    except Exception:
        pass
    W.OUT = APP          # build_web 의 emit/asset/build_page 가 이 폴더에 쓴다
    esbuild = None if '--no-minify' in sys.argv else W.find_esbuild()
    found, _ = imgtool.scan()
    use, dropped, saved = pick_images(found)
    os.makedirs(APP, exist_ok=True)
    keep = set()
    halves = shrink_halves(use)
    src_of = {}
    for k, rel in use.items():
        if k in halves:
            src, cached, new_rel = halves[k]
            use[k] = new_rel
            src_of[new_rel] = cached
        else:
            src_of.setdefault(rel, os.path.join(pages.ROOT, 'images', rel))
    files = sorted(set(use.values()))
    for rel in files:
        dst = os.path.join(APP, 'images', rel)
        keep.add(os.path.normpath(dst))
        W.copy_if_changed(src_of[rel], dst)
    half_saved = sum(os.path.getsize(v[0]) - os.path.getsize(v[1]) for v in halves.values())
    mjs, _ = pages.manifest_js(use, embed=False)
    W.emit('images/manifest.js', mjs)
    keep.add(os.path.normpath(os.path.join(APP, 'images', 'manifest.js')))
    manifest_rel = 'images/manifest.js?v=' + pages.short_hash(mjs)
    W.copy_if_changed(os.path.join(pages.ROOT, 'favicon.svg'), os.path.join(APP, 'favicon.svg'))
    keep.add(os.path.normpath(os.path.join(APP, 'favicon.svg')))
    mdir = os.path.join(pages.ROOT, 'music')
    if os.path.isdir(mdir):
        for fn in sorted(os.listdir(mdir)):
            src = os.path.join(mdir, fn)
            if os.path.isfile(src) and fn.lower().endswith(('.mp3', '.ogg', '.m4a')):
                dst = os.path.join(APP, 'music', fn)
                keep.add(os.path.normpath(dst))
                W.copy_if_changed(src, dst)
    js_rel, css_rel = W.build_page('index.html', 'game', 'index.html', 'PLUS ULTRA — Loop of Good Hope', DESC, esbuild, manifest_rel)
    for rel in (js_rel, css_rel, 'index.html'):
        keep.add(os.path.normpath(os.path.join(APP, rel)))
    # 글꼴: 온라인 링크 → 내려받은 fonts/fonts.css
    nfont = None if '--no-fonts' in sys.argv else local_fonts(pages.parse('index.html')['fonts'])
    if nfont is not None:
        for fn in os.listdir(os.path.join(APP, 'fonts')):
            keep.add(os.path.normpath(os.path.join(APP, 'fonts', fn)))
        path = os.path.join(APP, 'index.html')
        with open(path, encoding='utf-8') as f:
            html = f.read()
        html = re.sub(r'<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\n?', '', html)
        html = html.replace('<link rel="stylesheet" href="' + css_rel + '">', '<link rel="stylesheet" href="fonts/fonts.css">\n<link rel="stylesheet" href="' + css_rel + '">')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
    # 이번 판에 없는 옛 파일·빈 폴더는 지운다
    for dirpath, _, fns in os.walk(APP):
        for fn in fns:
            full = os.path.normpath(os.path.join(dirpath, fn))
            if full not in keep:
                os.remove(full)
    for dirpath, dirs, fns in sorted(os.walk(APP), key=lambda t: -len(t[0])):
        if dirpath != APP and not os.listdir(dirpath):
            os.rmdir(dirpath)
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(APP) for f in fs)
    nfiles = sum(len(fs) for _, _, fs in os.walk(APP))
    info = {'bytes': total, 'files': nfiles, 'images': len(files), 'dropped': dropped, 'saved': saved, 'halves': len(halves), 'half_saved': half_saved, 'fonts': nfont}
    with open(os.path.join(pages.ROOT, 'desktop', 'app-info.json'), 'w', encoding='utf-8') as f:
        json.dump(info, f)
    print('설치형 게임 파일: desktop/app (%s, 파일 %d개, 그림 %d장%s)' % (pages.human(total), nfiles, len(files), ', 코드 압축' if esbuild else ''))
    print('  뺀 그림 %d장 (%s) — 장면 판이 있는 발견물 GIF·쓰지 않는 탐험대 시트' % (dropped, pages.human(saved)))
    print('  무릎상 %d장을 긴 변 %dpx로 (%s 줄임)' % (len(halves), HALF_SIDE, pages.human(half_saved)))
    print('  글꼴 %s' % ('%d개 파일(내려받음)' % nfont if nfont is not None else '온라인 링크'))
    if total > LIMIT:
        print('설치 파일 한도(2GB)에 가깝습니다: %s — 그림을 줄여야 합니다' % pages.human(total))
        sys.exit(4)


if __name__ == '__main__':
    main()
