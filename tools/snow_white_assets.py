#!/usr/bin/env python3
"""새 백설공주 원화에서 게임용 얼굴상·무릎상·이벤트 컷을 만든다."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

from portrait_asset_layout import clear_transparent_rgb, defringe, make_face, make_half


ROOT = Path(__file__).resolve().parents[1]
PORTRAIT_SOURCE = ROOT / "artifacts" / "legendary-portraits" / "snow_white_player.png"
EVENT_SOURCE = ROOT / "artifacts" / "legend-events" / "snow-white" / "snow_white_rescue.png"

PORTRAITS = {
    ROOT / "images" / "portraits" / "legendary" / "snow_white_player.webp": (512, 512),
    ROOT / "images" / "portraits" / "legendary" / "snow_white_player_half.webp": (1024, 1536),
    ROOT / "images" / "portraits" / "legendary" / "snow_white.webp": (448, 448),
    ROOT / "images" / "portraits" / "legendary" / "snow_white_half.webp": (1024, 1536),
    ROOT / "images" / "portraits" / "fairy-tales" / "snow_white.webp": (448, 448),
    ROOT / "images" / "portraits" / "fairy-tales" / "snow_white_half.webp": (1024, 1536),
}
EVENT_OUTPUT = ROOT / "images" / "legend-events" / "snow_white_rescue.webp"


def normalize_alpha(image: Image.Image) -> Image.Image:
    """보이지 않는 배경 안개를 지우고 반투명 머리카락 경계는 보존한다."""
    rgba = np.asarray(image.convert("RGBA")).copy()
    alpha = rgba[:, :, 3]
    alpha[alpha <= 6] = 0
    alpha[alpha >= 249] = 255
    rgba[:, :, 3] = alpha
    return clear_transparent_rgb(Image.fromarray(rgba, "RGBA"))


def anchor_half_to_bottom(image: Image.Image) -> Image.Image:
    """무릎상 치맛단을 캔버스 하단에 붙여 게임의 반신상 규칙을 맞춘다."""
    bounds = image.getchannel("A").getbbox()
    if not bounds or bounds[3] >= image.height:
        return image
    canvas = Image.new("RGBA", image.size, (0, 0, 0, 0))
    canvas.alpha_composite(image, (0, image.height - bounds[3]))
    return clear_transparent_rgb(canvas)


def build() -> None:
    if not PORTRAIT_SOURCE.is_file() or not EVENT_SOURCE.is_file():
        raise FileNotFoundError("백설공주 원화 또는 이벤트 원화가 없습니다.")

    master = normalize_alpha(defringe(Image.open(PORTRAIT_SOURCE)))
    half = anchor_half_to_bottom(make_half(master))
    # 고개와 머리카락이 오른쪽으로 흐르는 원화라 얼굴 중심을 46% 지점에 둔다.
    face_512 = make_face(master, 512, face_x=0.46)
    face_448 = face_512.resize((448, 448), Image.Resampling.LANCZOS)
    face_448 = clear_transparent_rgb(face_448)

    for path, size in PORTRAITS.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        if size == (512, 512):
            image = face_512
        elif size == (448, 448):
            image = face_448
        else:
            image = half
        image.save(path, "WEBP", quality=91, method=6, exact=True)

    event = Image.open(EVENT_SOURCE).convert("RGB")
    event = ImageOps.fit(event, (1881, 836), method=Image.Resampling.LANCZOS)
    EVENT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    event.save(EVENT_OUTPUT, "WEBP", quality=92, method=6)


def check() -> None:
    failures: list[str] = []
    for path, expected_size in PORTRAITS.items():
        if not path.is_file():
            failures.append(f"없음: {path.relative_to(ROOT)}")
            continue
        with Image.open(path) as image:
            if image.size != expected_size:
                failures.append(f"크기: {path.relative_to(ROOT)} = {image.size}")
            if image.mode != "RGBA" or image.getchannel("A").getextrema()[0] != 0:
                failures.append(f"투명도: {path.relative_to(ROOT)} = {image.mode}")
    if not EVENT_OUTPUT.is_file():
        failures.append(f"없음: {EVENT_OUTPUT.relative_to(ROOT)}")
    else:
        with Image.open(EVENT_OUTPUT) as image:
            if image.size != (1881, 836):
                failures.append(f"크기: {EVENT_OUTPUT.relative_to(ROOT)} = {image.size}")
    if failures:
        raise RuntimeError("\n".join(failures))
    print("백설공주 얼굴상·무릎상 6장과 이벤트 컷 규격/투명도 확인 완료")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        check()
    else:
        build()
        check()
