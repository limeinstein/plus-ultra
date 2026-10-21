#!/usr/bin/env python3
"""투명 인물 원화를 얼굴상·무릎상 규격에 일관되게 맞춘다.

배경을 지운 뒤 남은 투명 여백이나 원화 속 인물 위치가 서로 달라도 얼굴 크기와
머리 위 여백이 같게 보이도록 얼굴 검출값과 알파 경계를 함께 사용한다.
"""
from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"
_DETECTOR = None


def alpha_bounds(image: Image.Image, cutoff: int = 12) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bounds = alpha.point(lambda value: 255 if value > cutoff else 0).getbbox()
    return bounds or (0, 0, image.width, image.height)


def defringe(image: Image.Image, opaque_cutoff: int = 235) -> Image.Image:
    """반투명 가장자리의 어두운 배경색을 가까운 인물색으로 바꾼다.

    알파는 건드리지 않는다. 투명 픽셀의 숨은 RGB도 가장자리 색으로 채워 두어
    축소할 때 검거나 붉은 테두리가 다시 섞이지 않게 한다.
    """
    rgba = np.asarray(image.convert("RGBA")).copy()
    alpha = rgba[:, :, 3]
    opaque = alpha >= opaque_cutoff
    if not opaque.any():
        opaque = alpha >= 128
    if not opaque.any():
        return image.convert("RGBA")
    _, nearest = ndimage.distance_transform_edt(~opaque, return_indices=True)
    yy, xx = nearest
    rgb = rgba[:, :, :3]
    fringe = (alpha > 0) & ~opaque
    rgb[fringe] = rgb[yy[fringe], xx[fringe]]
    rgb[alpha == 0] = 0
    rgba[:, :, :3] = rgb
    return Image.fromarray(rgba, "RGBA")


def clear_transparent_rgb(image: Image.Image) -> Image.Image:
    """완전 투명 픽셀의 숨은 색만 지워 뷰어별 표시 차이를 없앤다."""
    rgba = np.asarray(image.convert("RGBA")).copy()
    rgba[rgba[:, :, 3] == 0, :3] = 0
    return Image.fromarray(rgba, "RGBA")


def detect_face(image: Image.Image) -> tuple[float, float, float, float] | None:
    """YuNet으로 가장 확실하면서 위쪽에 있는 얼굴 상자를 찾는다."""
    global _DETECTOR
    import cv2

    if not MODEL.is_file():
        return None
    if _DETECTOR is None:
        runtime = Path(tempfile.gettempdir()) / "plus_ultra_yunet_2023mar.onnx"
        if not runtime.is_file() or runtime.stat().st_size != MODEL.stat().st_size:
            shutil.copyfile(MODEL, runtime)
        _DETECTOR = cv2.FaceDetectorYN.create(str(runtime), "", (320, 320), 0.5, 0.3, 50)

    rgba = image.convert("RGBA")
    backdrop = Image.new("RGBA", rgba.size, (128, 128, 128, 255))
    backdrop.alpha_composite(rgba)
    rgb = np.asarray(backdrop.convert("RGB"))
    scale = 640 / max(image.size)
    width = max(1, round(image.width * scale))
    height = max(1, round(image.height * scale))
    small = cv2.resize(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), (width, height))
    _DETECTOR.setInputSize((width, height))
    _, faces = _DETECTOR.detect(small)
    if faces is None:
        return None
    face = sorted(faces, key=lambda row: -(row[14] - 0.3 * row[1] / height))[0]
    x, y, w, h = (float(value) / scale for value in face[:4])
    return x, y, w, h


def make_face(person: Image.Image, size: int = 512, face_x: float = 0.5) -> Image.Image:
    """얼굴 폭 22%, 얼굴 위 여백 15%인 정사각형 상반신을 만든다.

    face_x는 결과 캔버스에서 얼굴 중심이 놓일 가로 비율이다.
    """
    person = person.convert("RGBA")
    face = detect_face(person)
    if face is None:
        side = min(person.size)
        crop = person.crop(((person.width - side) // 2, 0,
                            (person.width + side) // 2, side))
    else:
        x, y, width, height = face
        side = max(width / 0.22, height / 0.27)
        left = x + width / 2 - side * face_x
        top = y - side * 0.15
        crop = person.crop((round(left), round(top), round(left + side), round(top + side)))
    return clear_transparent_rgb(crop.resize((size, size), Image.Resampling.LANCZOS))


def make_half(person: Image.Image, size: tuple[int, int] = (1024, 1536)) -> Image.Image:
    """실제 인물 경계를 꽉 채우되 얼굴 크기를 일정하게 한 머리~무릎상."""
    person = person.convert("RGBA")
    bounds = alpha_bounds(person)
    left, top, right, bottom = bounds
    box_width = max(1, right - left)
    box_height = max(1, bottom - top)
    face = detect_face(person)

    target_width, target_height = size
    height_scale = (target_height - 8) / box_height
    face_scale = height_scale if face is None else target_width * 0.17 / max(1, face[2])
    width_cap = (target_width - 16) / box_width
    height_cap = target_height * 1.10 / box_height
    scale = min(max(height_scale, face_scale), width_cap, height_cap)

    resized = person.resize((max(1, round(person.width * scale)),
                             max(1, round(person.height * scale))), Image.Resampling.LANCZOS)
    scaled_bounds = alpha_bounds(resized)
    subject_center = (scaled_bounds[0] + scaled_bounds[2]) / 2
    paste_x = round(target_width / 2 - subject_center)
    paste_y = 4 - scaled_bounds[1]
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(resized, (paste_x, paste_y))
    return clear_transparent_rgb(canvas)
