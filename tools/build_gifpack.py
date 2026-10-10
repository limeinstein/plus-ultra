#!/usr/bin/env python3
"""설치형 게임의 「GIF 팩」 내용물을 desktop/gifpack 에 만든다 (설치 파일은 desktop/gifpack.nsi 로 makensis가 만든다).

본 설치 파일(tools/build_desktop.py)은 2GB 한도 때문에 장면 판(discovery-sheets)이 있는 발견물의 GIF(약 1GB)를 뺀다.
GIF 팩은 그 원본 GIF를 그대로 담아 %APPDATA%\\PLUS ULTRA\\gifpack 에 깔린다.
  · images/discoveries/<ID>.gif  — 원본 그대로
  · images/gifpack-list.js       — 그림 이름 → 팩 안의 file: 주소, G.PREFER_GIF = true (발견 장면을 장면 판 대신 원본 GIF로)
  · pack.json                    — 판·개수·크기
게임(desktop/main.js)은 켤 때 팩이 있으면 preload로 위치를 알려 주고, app/images/gifpack.js 가 목록을 읽는다.
팩이 없거나 지우면 예전처럼 장면 판으로 돈다. 본 게임이 업데이트되어도 팩은 그대로 남는다.

사용법 (WebGame 폴더에서):  python tools/build_gifpack.py [판]
"""
import os, sys, json, shutil

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import images as imgtool  # noqa: E402
import pages  # noqa: E402
import build_desktop as BD  # noqa: E402

OUT = os.path.join(pages.ROOT, 'desktop', 'gifpack')


def main():
    try:
        sys.stdout.reconfigure(errors='replace')
    except Exception:
        pass
    version = sys.argv[1] if len(sys.argv) > 1 else '1.0.0'
    found, _ = imgtool.scan()
    use, _, _ = BD.pick_images(found)
    gifs = {k: rel for k, rel in found.items() if rel.lower().endswith('.gif') and use.get(k) != rel}
    keep = set()
    for k, rel in sorted(gifs.items()):
        dst = os.path.join(OUT, 'images', rel)
        keep.add(os.path.normpath(dst))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        BD.W.copy_if_changed(os.path.join(pages.ROOT, 'images', rel), dst)
    total = sum(os.path.getsize(os.path.join(OUT, 'images', rel)) for rel in gifs.values())
    lst = ('/* 설치형 게임 GIF 팩 %s — tools/build_gifpack.py가 만든다. 발견물 GIF %d개를 팩 안의 원본으로 쓰고, 발견 장면도 원본 GIF로 돌린다 */\n'
           '(function (G) {\n'
           "  var base = ((window.PU_DESKTOP && window.PU_DESKTOP.gifpack) || '') + '/images/';\n"
           '  var list = %s;\n'
           '  G.IMAGE_FILES = G.IMAGE_FILES || {};\n'
           "  for (var k in list) G.IMAGE_FILES[k] = base + list[k].split('/').map(encodeURIComponent).join('/');\n"
           '  G.PREFER_GIF = true;\n'
           "  G.GIF_PACK = { version: '%s', count: %d };\n"
           '})(window.G = window.G || {});\n') % (version, len(gifs), json.dumps(gifs, ensure_ascii=False, sort_keys=True), version, len(gifs))
    with open(os.path.join(OUT, 'images', 'gifpack-list.js'), 'w', encoding='utf-8') as f:
        f.write(lst)
    keep.add(os.path.normpath(os.path.join(OUT, 'images', 'gifpack-list.js')))
    with open(os.path.join(OUT, 'pack.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': version, 'count': len(gifs), 'bytes': total}, f)
    keep.add(os.path.normpath(os.path.join(OUT, 'pack.json')))
    for dirpath, _, fns in os.walk(OUT):
        for fn in fns:
            full = os.path.normpath(os.path.join(dirpath, fn))
            if full not in keep:
                os.remove(full)
    # 설치 파일 아이콘 (desktop/gifpack.nsi 가 쓴다)
    try:
        from PIL import Image
        os.makedirs(os.path.join(pages.ROOT, 'desktop', 'build'), exist_ok=True)
        Image.open(os.path.join(pages.ROOT, 'desktop', 'icon.png')).save(os.path.join(pages.ROOT, 'desktop', 'build', 'icon.ico'), sizes=[(256, 256), (64, 64), (48, 48), (32, 32), (16, 16)])
    except Exception as e:
        print('아이콘을 만들지 못했습니다:', e)
        sys.exit(5)
    print('GIF 팩: desktop/gifpack (발견물 GIF %d개, %s)' % (len(gifs), pages.human(total)))
    if total > BD.LIMIT:
        print('GIF 팩이 설치 파일 한도(2GB)에 가깝습니다')
        sys.exit(4)


if __name__ == '__main__':
    main()
