#!/usr/bin/env python3
"""아티팩트(한 파일 HTML)에 넣을 때 쓰는 '가벼운 그림' 사본을 만듭니다.

claude.ai 아티팩트는 16MB까지라, 원본 그림을 그대로 넣으면 넘칩니다.
이 스크립트는 images 폴더의 그림을 자리별로 알맞게 줄여 dist/slim-images 에 저장합니다.
게임 폴더(WebGame)와 웹 배포판은 원본 그림을 그대로 씁니다.

사용법:  python tools/slim.py [배율]        (배율 1.0 = 기본, 작을수록 더 줄임)
"""
import os, sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pages  # noqa: E402

try:
    from PIL import Image
except ImportError:
    Image = None

# 키 앞부분 → (가장 긴 변, 저장 형식, 품질). 형식 'auto' = 투명하면 WEBP, 아니면 JPEG
RULES = [
    ('minigames/props', 1254, 'webp', 88),   # 작은 소품의 조각·금속 테두리를 남긴다
    ('minigames/boat', 640, 'webp', 85),
    ('minigames/', 1280, 'auto', 84),
    ('exterior-styles/', 225, 'webp', 63),
    ('maid-styles/', 384, 'webp', 68),
    ('portraits/', 384, 'webp', 70),
    ('characters/player_half', 340, 'webp', 76),
    ('characters/', 300, 'webp', 78),
    ('exteriors/', 380, 'webp', 72),
    ('landmarks/', 460, 'webp', 76),
    ('map-discoveries/', 720, 'webp', 82),   # 4×4 지도 유적 시트: 셀마다 작은 투명 모형
    ('bg-styles/', 820, 'auto', 60),
    ('backgrounds/', 1100, 'auto', 66),
    ('cities/', 1100, 'auto', 66),
    ('city-styles/', 1100, 'auto', 66),
    ('discoveries/', 1100, 'auto', 72),   # 움직이는 GIF(유적)는 shrink_anim 이 움직이는 WEBP로
    ('discovery-cats/', 1100, 'auto', 72),
    ('relics/', 256, 'auto', 70),
    ('discovery-ends/', 576, 'auto', 74),
    ('discovery-sheets/', 2304, 'webp', 72),   # 발견 장면 판(6칸 × n줄): 칸 384px — 화면 1094px로 늘어나도 GIF(256색)보다 곱다
    ('ships/', 640, 'webp', 78),
    ('ships-nav/', 3584, 'keep', 88),
    ('sprites/expedition_', 4096, 'webp', 88),   # 탐험대 동작 시트(PNG 38장·54MB): 크기는 그대로 두고 WebP로만 바꾼다 — PNG 그대로면 아티팩트 한도를 넘는다
    ('sprites/', 4096, 'keep', 88),   # 육상전·탐험대·사건 스프라이트 시트: 칸 좌표(js/data/sprites.js)가 원본 크기 기준이라 줄이지 않는다
    ('duel/fighters/', 2592, 'webp', 84),   # 일기토 전투원 시트: 칸이 화면에 390px 안팎으로 커져 원본 크기를 지킨다(게임이 배율을 알아서 맞춤)
    ('duel/backgrounds/', 1400, 'auto', 72),
    ('landwar/backgrounds/', 1400, 'auto', 72),   # 육상전 지형 배경: 1000×430 싸움터에 깔린다
    ('items/', 256, 'webp', 84),      # 소지품 그림 256 — 작은 아이콘이라 품질을 조금 높게
    ('goods/', 192, 'webp', 84),      # 교역품 그림 192
    ('street-ground/', 640, 'webp', 84),   # 거리 앞길 바닥 띠(높이 164): 화면에 그대로 깔려 줄이지 않는다
    ('title', 1100, 'auto', 66),
    ('guide/', 1100, 'auto', 70),   # 플레이 가이드북의 게임 화면 그림 (js/ui/guidebook.js — 창 안 960px 안팎)
]


# 아티팩트(HQ)용 크기: 그림 묶음을 필요할 때만 읽으므로(G.Img 지연 읽기) 화면(1600×900)에 맞는 크기로 남긴다.
# 키 앞부분 → (가장 긴 변, 품질). 여기 없는 자리는 RULES 크기를 그대로 쓴다. 원본보다 크게 늘리지는 않는다.
HQ = [
    ('portraits/maids/', 640, 78),
    ('maid-styles/', 512, 74),
    ('portraits/', 416, 74),
    ('exterior-styles/', 360, 72),
    ('exteriors/', 520, 74),
    ('landmarks/', 640, 76),
    ('map-discoveries/', 1024, 84),
    ('characters/player_half', 520, 78),
    ('characters/', 400, 78),
    ('bg-styles/', 1440, 70),
    ('backgrounds/', 1440, 70),
    ('cities/', 1440, 70),
    ('city-styles/', 1440, 70),
    ('interiors/', 1440, 70),
    ('discovery-cats/', 1440, 74),
    ('discoveries/', 1440, 74),
    ('relics/', 384, 74),
    ('ships/', 880, 78),
    ('duel/backgrounds/', 1600, 74),
    ('landwar/backgrounds/', 1600, 74),
    ('title', 1600, 76),
]


def hq_for(key):
    for pre, side, q in HQ:
        if key.startswith(pre):
            return side, q
    return None


# 전체 배율을 낮춰도 이보다 작게는 줄이지 않는 그림 (가장 긴 변)
FLOOR = {
    'ships-nav/': 3584,       # 8방향 동작 배 시트: 조각 좌표와 피벗을 지키도록 원본 그대로
    'sprites/': 4096,         # 육상전·탐험대·사건 스프라이트 시트도 원본 크기 그대로
    'duel/fighters/': 1944,   # 일기토 전투원: 칸 324px 이상 — 화면 390px로 늘려도 뭉개지지 않게
    'duel/backgrounds/': 1100,  # 일기토 배경: 1060×380 화면에 깔린다
    'landwar/backgrounds/': 1000,  # 육상전 배경: 1000×430 싸움터
    'items/': 256, 'goods/': 192, 'relics/': 256,   # 물건 아이콘은 줄이지 않는다(작아서 묶음 크기에 거의 안 듦)
    'street-ground/': 640,    # 거리 앞길 바닥 띠: 1:1로 깔린다(19장 합쳐 0.4MB)
    'discovery-sheets/': 2304,  # 발견 장면 판: 전체 배율을 낮춰도 칸 384px 아래로 줄이지 않는다
}


def floor_for(key):
    # 무릎상(대화창 위에 640px 높이로 서는 그림): 전체 배율을 낮춰도 긴 변 384px 아래로 줄이지 않는다
    if key.startswith('portraits/') and key.endswith('_half'):
        return 384
    for pre, side in FLOOR.items():
        if key.startswith(pre):
            return side
    return 64


def rule_for(key):
    # 이름 있는 여급은 대화창과 2인 구도에서 크게 보인다. 지역 공용 그림보다 한 단계 선명하게 남긴다.
    if key.startswith('portraits/maids/') and key.endswith('_half'):
        return 768, 'webp', 74
    if key.startswith('portraits/maids/'):
        return 512, 'webp', 74
    if key.startswith('maid-styles/') and key.endswith('_half'):
        return 512, 'webp', 68          # 술집에 서 있는 모습은 580px로 보여 지나치게 줄이지 않는다
    for pre, side, fmt, q in RULES:
        if key.startswith(pre):
            return side, fmt, q
    return 1280, 'auto', 74


def has_alpha(im):
    if im.mode in ('RGBA', 'LA'):
        a = im.getchannel('A')
        return a.getextrema()[0] < 250
    return im.mode == 'P' and 'transparency' in im.info


def shrink_anim(src, dst_noext, side, q):
    """움직이는 GIF(유적 복원) → 움직이는 WEBP. 이름을 .anim.webp 로 해서 게임(G.Img.isAnim)이 <img>로 올리게 한다.
    프레임 수·시간은 그대로 둔다 — 발견 연출이 G.FX.reveal.gifMs 뒤에 마지막 장면으로 멈추기 때문."""
    from PIL import ImageSequence
    im = Image.open(src)
    frames, durs = [], []
    for fr in ImageSequence.Iterator(im):
        f = fr.convert('RGB')
        s = min(1.0, side / max(f.size))
        if s < 1.0:
            f = f.resize((max(1, round(f.width * s)), max(1, round(f.height * s))), Image.LANCZOS)
        frames.append(f)
        durs.append(fr.info.get('duration', 100))
    path = dst_noext + '.anim.webp'
    frames[0].save(path, 'WEBP', save_all=True, append_images=frames[1:], duration=durs, loop=0, quality=min(q, 55), method=4)
    return path


def is_anim(src):
    if not src.lower().endswith('.gif'):
        return False
    try:
        return getattr(Image.open(src), 'n_frames', 1) > 1
    except Exception:
        return False


def shrink_one(src, dst_noext, side, fmt, q):
    if is_anim(src):
        return shrink_anim(src, dst_noext, side, q)
    if src.lower().endswith('.anim.webp'):
        # 이미 움직이는 WEBP(불러오는 그림 등)는 다시 구우면 첫 장면만 남는다 — 그대로 복사한다
        path = dst_noext + '.webp'
        with open(src, 'rb') as a, open(path, 'wb') as b:
            b.write(a.read())
        return path
    im = Image.open(src)
    im = im.convert('RGBA') if has_alpha(im) else im.convert('RGB')
    w, h = im.size
    s = min(1.0, side / max(w, h))
    if s < 1.0:
        im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    if fmt == 'keep':
        if s >= 1.0:                      # 줄일 필요가 없으면 다시 굽지 않고 원본을 그대로 복사한다
            path = dst_noext + os.path.splitext(src)[1]
            with open(src, 'rb') as a, open(path, 'wb') as b:
                b.write(a.read())
            return path
        fmt = 'webp'
    if fmt == 'auto':
        fmt = 'webp' if im.mode == 'RGBA' else 'jpeg'
    if fmt == 'jpeg':
        path = dst_noext + '.jpg'
        im.convert('RGB').save(path, 'JPEG', quality=q, optimize=True, progressive=True)
    else:
        path = dst_noext + '.webp'
        im.save(path, 'WEBP', quality=q, method=3)
    return path


def build(found, out_dir, scale=1.0, quiet=False, hq=False, skip=()):
    """found: 키 → images 기준 상대 경로. 줄인 사본을 out_dir 에 만들고 새 found 를 돌려준다.
    hq=True: 아티팩트용 큰 크기(HQ 표). skip: 만들지 않을 키(쓰지 않는 그림 — 시간 절약)."""
    if Image is None:
        if not quiet:
            print('Pillow 가 없어 그림을 줄이지 못했습니다 (pip install pillow). 원본을 그대로 씁니다.')
        return dict(found)
    src_root = os.path.join(pages.ROOT, 'images')
    out = {}
    total_in = total_out = 0
    import json
    made_path = os.path.join(out_dir, '.made.json')
    try:
        with open(made_path, encoding='utf-8') as f:
            made = json.load(f)
    except Exception:
        made = {}
    for key, rel in sorted(found.items()):
        src = os.path.join(src_root, rel)
        if key in skip:
            continue
        side, fmt, q = rule_for(key)
        if hq and hq_for(key):
            side, q = hq_for(key)
        side = max(floor_for(key), int(side * scale))
        q = max(45, int(q * (0.85 + 0.15 * scale)))
        dst_noext = os.path.join(out_dir, os.path.splitext(rel)[0])
        os.makedirs(os.path.dirname(dst_noext), exist_ok=True)
        st = os.stat(src)
        sig = [int(st.st_mtime), st.st_size, side, fmt, q]
        old = made.get(key)
        if old and old[0] == sig and os.path.exists(os.path.join(out_dir, old[1])):
            total_in += st.st_size
            total_out += os.path.getsize(os.path.join(out_dir, old[1]))
            out[key] = old[1]
            continue
        try:
            path = shrink_one(src, dst_noext, side, fmt, q)
        except Exception as e:  # 못 줄이면 원본 복사
            if not quiet:
                print('  줄이기 실패, 원본 사용: %s (%s)' % (rel, e))
            path = os.path.join(out_dir, rel)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(src, 'rb') as a, open(path, 'wb') as b:
                b.write(a.read())
        total_in += os.path.getsize(src)
        total_out += os.path.getsize(path)
        out[key] = os.path.relpath(path, out_dir).replace('\\', '/')
        made[key] = [sig, out[key]]
    with open(made_path, 'w', encoding='utf-8') as f:
        json.dump(made, f)
    if not quiet:
        print('가벼운 그림 %d장: %s → %s' % (len(out), pages.human(total_in), pages.human(total_out)))
    return out


def main():
    import images as imgtool
    found, _ = imgtool.scan()
    scale = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
    out_dir = os.path.join(pages.ROOT, 'dist', 'slim-images')
    build(found, out_dir, scale)
    print('→ ' + os.path.relpath(out_dir, pages.ROOT))


if __name__ == '__main__':
    main()
