#!/usr/bin/env python3
"""제독 생김새 원본을 게임용 얼굴·무릎상으로 나눈다.

각 ``images/characters/<생김새>/master.png``는 왼쪽 젊은 모습과 오른쪽
40대 모습을 같은 크기로 담은 생성 원본이다. 이 도구는 두 사람을 분리하고
얼굴을 찾아 다음 파일을 만든다.

* ``portraits/player/<생김새>.png`` — 만들기·대화창 얼굴
* ``portraits/player-aged/<생김새>.png`` — 40세 이상 얼굴
* ``characters/player_half_<생김새>.png`` — 젊은 무릎상
* ``characters/player_half_<생김새>_old.png`` — 40세 이상 무릎상

기본 제독과 이강희는 기존 젊은 그림을 보존하고 ``old_master.png``에서
40대 파일만 만든다.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "images"
CHARS = IMG / "characters"
LOOKS = (
    "navigator_white",
    "armored_navigator",
    "sea_dog",
    "muscle_swordsman",
    "hat_spinner",
    "charismatic_admiral",
    "battle_vanguard",
    "noble_scholar",
    "casanova",
    "army_officer",
    "sky_adventurer",
    "blackcoat_captain",
)
SIZE = 512
FACE_X = {"charismatic_admiral": 0.46, "casanova": 0.47}
# 손에 든 소품까지 초상에 들어가는 두 모습은 보통 얼굴 크롭보다 넓게 잡는다.
# 원본 한쪽(768x1024)에서 얼굴만 확대하면 망원경/모자가 잘리고 얼굴도 한쪽으로
# 밀려 보이므로, 얼굴은 화면 가운데 가까이 두되 동작을 읽을 여백을 남긴다.
FACE_ACTION = {
    "sea_dog": {"x": 0.51, "side": 0.72},
    "hat_spinner": {"x": 0.51, "side": 0.72},
}
# 무릎상에서도 두 인물의 얼굴이 화면 오른쪽으로 몰리지 않게 약간 왼쪽으로 옮긴다.
HALF_X_SHIFT = {"sea_dog": -20, "hat_spinner": -18}
# 전신으로 생성된 초기 원본만 무릎선에서 자른다. 이후 원본은 애초에 무릎 아래를 그리지 않는다.
KNEE_CROP = {"muscle_swordsman": 0.73, "hat_spinner": 0.73, "sea_dog": 0.76}


def alpha_bounds(im, cutoff=12):
    a = im.getchannel("A").point(lambda v: 255 if v > cutoff else 0)
    box = a.getbbox()
    if not box:
        raise ValueError("불투명한 인물이 없습니다")
    return box


def keep_main_component(im, seed=None):
    """두 인물의 경계를 넘은 작은 조각을 버리고 중심 인물만 남긴다."""
    seed = seed or (im.width // 2, im.height // 2)
    silhouette = im.getchannel("A").point(lambda v: 255 if v > 32 else 0)
    flooded = silhouette.copy()
    ImageDraw.floodfill(flooded, seed, 128, thresh=0)
    component = flooded.point(lambda v: 255 if v == 128 else 0)
    cleaned = im.copy()
    cleaned.putalpha(ImageChops.multiply(im.getchannel("A"), component))
    return cleaned


def square_fit(im, pad=10, crop=1.0, x_shift=0):
    box = alpha_bounds(im)
    if crop < 1.0:
        box = (box[0], box[1], box[2], round(box[1] + (box[3] - box[1]) * crop))
    subject = im.crop(box)
    limit = SIZE - pad * 2
    scale = min(limit / subject.width, limit / subject.height)
    wh = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(wh, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.alpha_composite(subject, ((SIZE - wh[0]) // 2 + x_shift, SIZE - pad - wh[1]))
    return out


def face_square(im, look):
    # 원본은 모두 같은 무릎상 구도다. 얼굴과 윗몸이 들어오는 고정 비율을 쓰면
    # 별도 얼굴 탐지 패키지 없이도 file:// 프로젝트를 다시 만들 수 있다.
    x0, y0, x1, y1 = alpha_bounds(im)
    sw, sh = x1 - x0, y1 - y0
    action = FACE_ACTION.get(look)
    side = min(sw * (0.98 if action else 0.84), sh * (action["side"] if action else 0.58))
    cx = x0 + sw * (action["x"] if action else FACE_X.get(look, 0.5))
    top = y0
    left = round(cx - side / 2)
    top = round(top)
    right, bottom = round(left + side), round(top + side)
    canvas = Image.new("RGBA", (right - left, bottom - top), (0, 0, 0, 0))
    sx0, sy0, sx1, sy1 = max(0, left), max(0, top), min(im.width, right), min(im.height, bottom)
    if sx1 > sx0 and sy1 > sy0:
        canvas.alpha_composite(im.crop((sx0, sy0, sx1, sy1)), (sx0 - left, sy0 - top))
    return canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def save_pair(look):
    source = CHARS / look / "master.png"
    with Image.open(source) as raw:
        master = raw.convert("RGBA")
    middle = master.width // 2
    young, old = master.crop((0, 0, middle, master.height)), master.crop((middle, 0, master.width, master.height))
    if look == "blackcoat_captain":
        old = keep_main_component(old)
    (IMG / "portraits" / "player").mkdir(parents=True, exist_ok=True)
    (IMG / "portraits" / "player-aged").mkdir(parents=True, exist_ok=True)
    face_square(young, look).save(IMG / "portraits" / "player" / f"{look}.png", optimize=True)
    face_square(old, look).save(IMG / "portraits" / "player-aged" / f"{look}.png", optimize=True)
    crop = KNEE_CROP.get(look, 1.0)
    shift = HALF_X_SHIFT.get(look, 0)
    square_fit(young, crop=crop, x_shift=shift).save(CHARS / f"player_half_{look}.png", optimize=True)
    square_fit(old, crop=crop, x_shift=shift).save(CHARS / f"player_half_{look}_old.png", optimize=True)


def save_existing_old(look):
    source = CHARS / look / "old_master.png"
    with Image.open(source) as raw:
        old = raw.convert("RGBA")
    (IMG / "portraits" / "player-aged").mkdir(parents=True, exist_ok=True)
    face_square(old, look).save(IMG / "portraits" / "player-aged" / f"{look}.png", optimize=True)
    # 기본 제독은 예전 파일 이름에 맞추고, 다른 생김새는 접미사를 붙인다.
    name = "player_half_old.png" if look == "admiral" else f"player_half_{look}_old.png"
    square_fit(old).save(CHARS / name, optimize=True)


def main():
    for look in LOOKS:
        save_pair(look)
        print(f"{look}: 젊은/40대 얼굴·무릎상")
    for look in ("admiral", "ganghui"):
        save_existing_old(look)
        print(f"{look}: 40대 얼굴·무릎상")


if __name__ == "__main__":
    main()
