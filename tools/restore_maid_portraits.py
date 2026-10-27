#!/usr/bin/env python3
"""생성형으로 복원한 구판 여급 30명을 게임용 투명 무릎상·얼굴상으로 만든다.

ImageGen 출력은 원본의 인물·의상·포즈를 참조해 다시 그린 1024x1536 PNG이며,
배경은 순수 녹색이다. 이 스크립트는 녹색을 투명하게 분리하고 같은 무릎상에서
얼굴 중심의 정사각형 흉상을 잘라 두 그림의 인물성이 달라지지 않게 한다.

    python tools/restore_maid_portraits.py \
      --generated-dir C:/Users/User/.codex/generated_images/<task-id>
"""
from __future__ import annotations

import argparse
import shutil
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"

# ImageGen 결과 파일명. 키는 게임 안에서 쓰는 기존 경로와 같다.
GENERATED = {
    "arabia/1": "exec-3488fd01-1069-40a1-96cd-ddc13f1778cc.png",
    "arabia/2": "exec-0632c8e6-1f76-487a-bf0e-38656d4a4970.png",
    "arabia/3": "exec-eb13f095-b27d-405f-8b90-f69317506bc0.png",
    "arabia/4": "exec-2159a848-4a09-4886-9644-52656efc9127.png",
    "arabia/5": "exec-08fab6f1-1297-47ce-8d57-f5c4a250997a.png",
    "arabia/6": "exec-f90f7362-0d5c-4f86-9d52-668d1f38694c.png",
    "ottoman/1": "exec-7a0fc19c-85e3-4f3b-a246-17dc197fac1b.png",
    "ottoman/2": "exec-8882d6af-234f-40a3-90a3-bd09f8ebad09.png",
    "ottoman/3": "exec-fff6ae12-10b8-438e-acb3-3ffae9848dda.png",
    "ottoman/4": "exec-f4f32a9b-20a3-4e8b-afe8-8de81d00f42c.png",
    "ottoman/5": "exec-369bd046-7f85-4c8b-adbf-363fc4f8399a.png",
    "ottoman/6": "exec-a093cdfc-3f2e-4fac-aeab-6f280d42557a.png",
    "persia/1": "exec-b802a0fa-1fc0-4cc7-9f4c-06bea5268447.png",
    "persia/2": "exec-56c4daa5-cd80-4d4f-a1c1-218d986dbac7.png",
    "persia/3": "exec-8ff75c87-8ffe-42d8-b4b2-2c193bae4340.png",
    "persia/4": "exec-f52d6af8-540d-40ed-af60-06b7b3dd62af.png",
    "persia/5": "exec-8cc0aa0a-b9b2-4d6b-8ac2-3e50ed7aa22b.png",
    "persia/6": "exec-907fdc72-cbc4-4d20-9525-0f7550d62c1f.png",
    "seasia/1": "exec-1f1eca66-0a62-456e-9e2b-1a47d4f0cc16.png",
    "seasia/2": "exec-d50afeb0-8a7c-46ce-bca2-14f2ca4d799c.png",
    "seasia/3": "exec-10ecb4c2-dd4d-43ff-ad6f-2217e8fc14ef.png",
    "seasia/4": "exec-9ff2b77e-7924-46be-8b56-0cbbab3e973a.png",
    "seasia/5": "exec-e080bd5b-ce49-4ac5-9e04-d55a03783a14.png",
    "seasia/6": "exec-b3e5d7d3-3d94-45c5-8b57-609431f9f081.png",
    "tropic/1": "exec-53e60558-999a-4b8f-849c-d8aeac59ba5f.png",
    "tropic/2": "exec-770cf84f-d041-459f-9348-fb3eb3894d9d.png",
    "tropic/3": "exec-5835b5ef-d03d-4498-8541-f2f83e3333a2.png",
    "tropic/4": "exec-c74f9836-0182-431f-894c-aaf4c8961b92.png",
    "tropic/5": "exec-1c19bc33-514c-4155-89c7-b57a6ca89280.png",
    "tropic/6": "exec-a5c451fb-b7d7-4a95-bf8f-056ae3c7062d.png",
}


def remove_green(im: Image.Image) -> Image.Image:
    """순수 #00ff00 배경과 가장자리의 녹색 혼합 픽셀을 알파로 복원한다."""
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    dominance = green - np.maximum(red, blue)
    # 인물의 어두운 녹색 천은 보존하고, 밝고 압도적으로 녹색인 배경만 제거한다.
    alpha = 1.0 - np.clip((dominance - 55.0) / 145.0, 0.0, 1.0) * np.clip((green - 105.0) / 120.0, 0.0, 1.0)
    alpha[alpha < 0.035] = 0.0
    alpha[alpha > 0.965] = 1.0

    # 생성 원본의 배경은 #00ff00과 조금 다르다(예: 3,249,10).
    # 실제 배경색으로 역산한 뒤, 경계에 남은 녹색 혼합분만 제거한다.
    background_pixels = rgb[(dominance > 150) & (green > 200)]
    background = (np.median(background_pixels, axis=0) if len(background_pixels)
                  else np.array([0.0, 255.0, 0.0]))
    safe = np.maximum(alpha, 1.0 / 255.0)
    clean = (rgb - (1.0 - alpha[:, :, None]) * background) / safe[:, :, None]
    clean = np.clip(clean, 0, 255).astype(np.uint8)
    clean[alpha == 0.0] = 0
    rgba = np.dstack((clean, np.rint(alpha * 255.0).astype(np.uint8)))
    return despill_green_edges(Image.fromarray(rgba, "RGBA"))


def despill_green_edges(image: Image.Image) -> Image.Image:
    """머리카락 사이의 얇은 녹색 번짐을 지우고 녹색 옷 내부는 보존한다."""
    rgba = np.array(image.convert("RGBA"))
    rgb = rgba[:, :, :3].astype(np.int16)
    alpha = rgba[:, :, 3]
    # 어두운 배경 혼합 픽셀은 알파가 255여도 머리카락 사이에 남을 수 있다.
    # 경계 15px와 반투명 픽셀에 한정하고 알파·인물의 형상은 바꾸지 않는다.
    boundary = (alpha < 255) | (ndimage.distance_transform_edt(alpha > 0) <= 15)
    maximum = np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    spill = boundary & (rgb[:, :, 1] - maximum > 12) & (alpha > 0)
    rgba[:, :, 1][spill] = maximum[spill].astype(np.uint8)
    rgba[alpha == 0] = 0
    return Image.fromarray(rgba)


def detect_face(rgb: Image.Image) -> tuple[float, float, float, float]:
    arr = cv2.cvtColor(np.asarray(rgb.convert("RGB")), cv2.COLOR_RGB2BGR)
    height, width = arr.shape[:2]
    # OpenCV의 Windows ONNX 로더는 한글 경로를 읽지 못해 ASCII 임시 경로를 쓴다.
    model = Path(tempfile.gettempdir()) / "pu_face_detection_yunet.onnx"
    if not model.is_file() or model.stat().st_size != MODEL.stat().st_size:
        shutil.copy2(MODEL, model)
    detector = cv2.FaceDetectorYN.create(str(model), "", (width, height), 0.55, 0.3, 5000)
    _, faces = detector.detect(arr)
    if faces is None or not len(faces):
        raise RuntimeError("얼굴을 찾지 못했습니다")
    # 잔·목걸이·의상 무늬가 큰 얼굴처럼 잡힐 수 있으므로 신뢰도가 높고 위쪽인 후보를 고른다.
    face = max(faces, key=lambda f: float(f[14] - 0.45 * f[1] / height))
    return tuple(float(v) for v in face[:4])


def bust_crop(rgba: Image.Image, face: tuple[float, float, float, float]) -> Image.Image:
    """머리 장식부터 허리까지 보이는 정사각형 얼굴상을 만든다."""
    x, y, w, h = face
    side = max(w * 3.45, h * 3.65)
    cx = x + w * 0.5
    top = y - h * 0.58
    left = cx - side * 0.5
    canvas = Image.new("RGBA", (int(round(side)), int(round(side))), (0, 0, 0, 0))
    src_box = (max(0, int(np.floor(left))), max(0, int(np.floor(top))),
               min(rgba.width, int(np.ceil(left + side))), min(rgba.height, int(np.ceil(top + side))))
    part = rgba.crop(src_box)
    canvas.alpha_composite(part, (int(round(src_box[0] - left)), int(round(src_box[1] - top))))
    return canvas.resize((1024, 1024), Image.Resampling.LANCZOS)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--generated-dir", type=Path, required=True)
    args = ap.parse_args()
    generated = args.generated_dir.resolve()
    missing = [name for name in GENERATED.values() if not (generated / name).is_file()]
    if missing:
        raise SystemExit("생성 결과를 찾지 못했습니다: " + ", ".join(missing))

    for key, filename in GENERATED.items():
        source = Image.open(generated / filename).convert("RGB")
        half = remove_green(source)
        if half.size != (1024, 1536):
            half = half.resize((1024, 1536), Image.Resampling.LANCZOS)
        face = bust_crop(half, detect_face(source))
        target = ROOT / "images" / "maid-styles" / key
        half.save(target.with_name(target.name + "_half.webp"), "WEBP", quality=95, method=6, exact=True)
        face.save(target.with_suffix(".webp"), "WEBP", quality=95, method=6, exact=True)
        print(key)
    print("복원 여급 30명: 투명 무릎상 30장·동일 인물 얼굴상 30장 완료")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
