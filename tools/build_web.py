#!/usr/bin/env python3
"""웹 서버에 올릴 배포판을 dist/web 폴더에 만듭니다. (GitHub Pages, Netlify, itch.io 등)

사용법 (WebGame 폴더에서):
    python tools/build_web.py              # dist/web + dist/PLUS_ULTRA_web.zip
    python tools/build_web.py --no-minify  # 코드를 줄이지 않고 그대로 묶기

esbuild가 설치되어 있으면(npm i -g esbuild) 자바스크립트와 CSS를 줄여서 더 작게 만듭니다.
"""
import os, shutil, subprocess, sys, zipfile

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


def main():
    try:
        sys.stdout.reconfigure(errors='replace')  # 콘솔 인코딩에 없는 글자는 ? 로
    except Exception:
        pass
    esbuild = None if '--no-minify' in sys.argv else find_esbuild()
    found, dups = imgtool.scan()
    imgtool.write_manifest(found)
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    # images: copy files + a manifest with a version tag for caches
    for k, rel in found.items():
        dst = os.path.join(OUT, 'images', rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(pages.ROOT, 'images', rel), dst)
    mjs, _ = pages.manifest_js(found, embed=False)
    emit('images/manifest.js', mjs)
    manifest_rel = 'images/manifest.js?v=' + pages.short_hash(mjs)
    shutil.copy2(os.path.join(pages.ROOT, 'favicon.svg'), os.path.join(OUT, 'favicon.svg'))
    # 배경 음악 (music/*.mp3) — 그대로 복사
    mdir = os.path.join(pages.ROOT, 'music')
    if os.path.isdir(mdir):
        shutil.copytree(mdir, os.path.join(OUT, 'music'), ignore=shutil.ignore_patterns('*.txt', '*.md'))
    game = build_page('index.html', 'game', 'index.html', 'PLUS ULTRA — 더 먼 바다로', DESC, esbuild, manifest_rel)
    cat = build_page('catalog.html', 'catalog', 'catalog.html', 'PLUS ULTRA 도감', '게임에 나오는 도시·인물·발견물을 그림과 함께 보여 주고, 그림을 바꿀 때 쓸 파일 이름을 알려 주는 도감.', esbuild, manifest_rel)
    emit('.nojekyll', '')
    # zip for itch.io / Netlify drop
    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for dirpath, _, files in os.walk(OUT):
            for fn in sorted(files):
                full = os.path.join(dirpath, fn)
                z.write(full, os.path.relpath(full, OUT).replace(os.sep, '/'))
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
    how = ', 코드 압축' if esbuild else ', 압축 안 함' if '--no-minify' in sys.argv else ', 압축 안 함 — esbuild가 없음'
    print('웹 배포판: dist/web (%s%s)' % (pages.human(total), how))
    for rel in game + cat:
        print('  ' + rel, pages.human(os.path.getsize(os.path.join(OUT, rel))))
    print('  images/ 교체 그림 %d장' % len(found))
    print('업로드용 압축 파일: dist/PLUS_ULTRA_web.zip (%s)' % pages.human(os.path.getsize(ZIP)))


if __name__ == '__main__':
    main()
