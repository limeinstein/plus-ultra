#!/usr/bin/env python3
"""웹 서버에 올릴 배포판을 dist/web 폴더에 만듭니다. (GitHub Pages, Netlify, itch.io 등)

사용법 (WebGame 폴더에서):
    python tools/build_web.py              # dist/web + dist/PLUS_ULTRA_web.zip
    python tools/build_web.py --no-minify  # 코드를 줄이지 않고 그대로 묶기

esbuild가 설치되어 있으면(npm i -g esbuild) 자바스크립트와 CSS를 줄여서 더 작게 만듭니다.
"""
import os, time, shutil, subprocess, sys, zipfile

sys.dont_write_bytecode = True  # tools 폴더에 __pycache__ 를 만들지 않음
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import images as imgtool  # noqa: E402
import pages  # noqa: E402

OUT = os.path.join(pages.ROOT, 'dist', 'web')
ZIP = os.path.join(pages.ROOT, 'dist', 'PLUS_ULTRA_web.zip')
DESC = '대항해 시대를 무대로 한 모험·교역·해전 브라우저 게임. 후원자의 의뢰를 받아 세계의 발견물을 찾아 떠나세요.'


def find_esbuild():
    exe = shutil.which('esbuild')
    if exe:
        return [exe]
    npx = shutil.which('npx')
    if npx:
        try:
            subprocess.run([npx, '--no-install', 'esbuild', '--version'], check=True, capture_output=True, timeout=60)
            return [npx, '--no-install', 'esbuild']
        except Exception:
            pass
    return None


def minify(code, loader, esbuild):
    if not esbuild:
        return code
    r = subprocess.run(esbuild + ['--minify', '--loader=' + loader, '--charset=utf8', '--legal-comments=none'],
                       input=code.encode('utf-8'), capture_output=True, timeout=300)
    if r.returncode != 0:
        print('esbuild 실패, 줄이지 않고 씁니다:', r.stderr.decode('utf-8', 'replace')[:400])
        return code
    return r.stdout.decode('utf-8')


def emit(rel, text):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = text.encode('utf-8') if isinstance(text, str) else text
    with open(path, 'wb') as f:
        f.write(data)
    return len(data)


def asset(name, ext, text):
    h = pages.short_hash(text)
    rel = 'assets/%s.%s.%s' % (name, h, ext)
    emit(rel, text)
    return rel


def head(title, desc, css_rel, fonts, extra=''):
    return ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<title>' + title + '</title>\n'
            '<meta name="description" content="' + desc + '">\n'
            '<meta name="theme-color" content="#1f150e">\n'
            '<meta property="og:type" content="website">\n'
            '<meta property="og:title" content="' + title + '">\n'
            '<meta property="og:description" content="' + desc + '">\n'
            '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n' + '\n'.join(fonts) + '\n'
            '<link rel="stylesheet" href="' + css_rel + '">\n' + extra + '</head>\n')


def build_page(page, name, out_html, title, desc, esbuild, manifest_rel):
    p = pages.parse(page)
    css = '\n'.join(pages.read(c) for c in p['css'])
    css_rel = asset(name, 'css', minify(css, 'css', esbuild))
    js = ';\n'.join('/* %s */\n%s' % (s, pages.read(s)) for s in p['scripts'] if s != 'images/manifest.js')
    js_rel = asset(name, 'js', minify(js, 'js', esbuild))
    html = (head(title, desc, css_rel, p['fonts']) + '<body>\n<noscript><p style="padding:24px;color:#efe5cf;background:#1f150e">이 페이지는 자바스크립트가 필요합니다.</p></noscript>\n' +
            p['markup'] + '\n<script src="' + manifest_rel + '"></script>\n<script src="' + js_rel + '"></script>\n</body>\n</html>\n')
    emit(out_html, html)
    return js_rel, css_rel


def same(src, dst):
    """이미 같은 파일이 있으면 다시 복사하지 않는다 (크기·수정 시각이 같으면 같다고 본다)"""
    try:
        a, b = os.stat(src), os.stat(dst)
    except OSError:
        return False
    return a.st_size == b.st_size and int(a.st_mtime) == int(b.st_mtime)


def copy_if_changed(src, dst):
    if same(src, dst):
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    return True


class OutOfTime(Exception):
    pass


def main():
    try:
        sys.stdout.reconfigure(errors='replace')  # 콘솔 인코딩에 없는 글자는 ? 로
    except Exception:
        pass
    # --budget 초: 그 시간이 지나면 하던 데까지 남기고 멈춘다(종료 코드 3). 다시 실행하면 이어서 한다.
    #   (한 번에 오래 못 도는 셸에서 쓰려고. GitHub Actions처럼 그냥 실행하면 끝까지 한다)
    budget = float(sys.argv[sys.argv.index('--budget') + 1]) if '--budget' in sys.argv else None
    t0 = time.time()

    def tick():
        if budget is not None and time.time() - t0 > budget:
            raise OutOfTime()

    esbuild = None if '--no-minify' in sys.argv else find_esbuild()
    found, dups = imgtool.scan()
    imgtool.write_manifest(found)
    os.makedirs(OUT, exist_ok=True)
    keep = set()
    try:
        # images: 바뀐 것만 복사 (예전에는 dist/web을 지우고 1GB를 통째로 다시 복사했다)
        n_copied = 0
        for k, rel in sorted(found.items()):
            dst = os.path.join(OUT, 'images', rel)
            keep.add(os.path.normpath(dst))
            if copy_if_changed(os.path.join(pages.ROOT, 'images', rel), dst):
                n_copied += 1
                if n_copied % 25 == 0:
                    tick()
        mjs, _ = pages.manifest_js(found, embed=False)
        keep.add(os.path.normpath(os.path.join(OUT, 'images/manifest.js')))
        emit('images/manifest.js', mjs)
        manifest_rel = 'images/manifest.js?v=' + pages.short_hash(mjs)
        keep.add(os.path.normpath(os.path.join(OUT, 'favicon.svg')))
        copy_if_changed(os.path.join(pages.ROOT, 'favicon.svg'), os.path.join(OUT, 'favicon.svg'))
        # 배경 음악 (music/*.mp3) — 그대로 복사
        mdir = os.path.join(pages.ROOT, 'music')
        if os.path.isdir(mdir):
            for fn in sorted(os.listdir(mdir)):
                if fn.lower().endswith(('.txt', '.md')) or not os.path.isfile(os.path.join(mdir, fn)):
                    continue
                dst = os.path.join(OUT, 'music', fn)
                keep.add(os.path.normpath(dst))
                copy_if_changed(os.path.join(mdir, fn), dst)
        tick()
        game = build_page('index.html', 'game', 'index.html', 'Loop of Good Hope — 더 먼 바다로', DESC, esbuild, manifest_rel)
        cat = build_page('catalog.html', 'catalog', 'catalog.html', 'Loop of Good Hope 도감', '게임에 나오는 도시·인물·발견물을 그림과 함께 보여 주고, 그림을 바꿀 때 쓸 파일 이름을 알려 주는 도감.', esbuild, manifest_rel)
        emit('.nojekyll', '')
        for rel in list(game) + list(cat) + ['index.html', 'catalog.html', '.nojekyll']:
            keep.add(os.path.normpath(os.path.join(OUT, rel)))
        # 이번 판에 없는 옛 파일(옛 해시 assets, 빠진 그림)은 지운다
        for dirpath, _, files in os.walk(OUT):
            for fn in files:
                full = os.path.normpath(os.path.join(dirpath, fn))
                if full not in keep:
                    os.remove(full)
        # zip for itch.io / Netlify drop — 그림·음악은 이미 압축된 형식이라 그대로 담고(빠름), 글자 파일만 줄인다.
        # 만드는 동안은 .part 에 쓰고, 끝나면 바꿔 단다. 멈췄다 다시 실행하면 .part 에 없는 것만 더 담는다.
        part = ZIP + '.part'
        want = []
        for dirpath, _, files in os.walk(OUT):
            for fn in sorted(files):
                full = os.path.join(dirpath, fn)
                want.append((full, os.path.relpath(full, OUT).replace(os.sep, '/')))
        have = {}
        if os.path.exists(part):
            try:
                with zipfile.ZipFile(part) as z:
                    have = {i.filename: i for i in z.infolist()}
            except Exception:
                have = None
        wmap = {arc: full for full, arc in want}
        if have is None or any(arc not in wmap or info.file_size != os.path.getsize(wmap[arc]) for arc, info in have.items()):
            if os.path.exists(part):
                os.remove(part)    # 그 사이 바뀐 파일이 있으면 처음부터
            have = {}
        stored = ('.webp', '.jpg', '.jpeg', '.png', '.gif', '.mp3', '.ogg', '.m4a', '.zip')
        with zipfile.ZipFile(part, 'a' if have else 'w') as z:
            for i, (full, arc) in enumerate(want):
                if arc in have:
                    continue
                if arc.lower().endswith(stored):
                    z.write(full, arc, compress_type=zipfile.ZIP_STORED)
                else:
                    z.write(full, arc, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
                if i % 20 == 0:
                    tick()
        os.replace(part, ZIP)
    except OutOfTime:
        print('시간이 다 되어 멈췄습니다 (%.0f초). 다시 실행하면 이어서 합니다.' % (time.time() - t0))
        sys.exit(3)
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
    how = ', 코드 압축' if esbuild else ', 압축 안 함' if '--no-minify' in sys.argv else ', 압축 안 함 — esbuild가 없음'
    print('웹 배포판: dist/web (%s%s)' % (pages.human(total), how))
    for rel in game + cat:
        print('  ' + rel, pages.human(os.path.getsize(os.path.join(OUT, rel))))
    print('  images/ 교체 그림 %d장' % len(found))
    print('업로드용 압축 파일: dist/PLUS_ULTRA_web.zip (%s)' % pages.human(os.path.getsize(ZIP)))


if __name__ == '__main__':
    main()
