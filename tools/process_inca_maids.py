"""Build the five Inca maid portrait pairs from ImageGen source PNGs."""

from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "artifacts" / "portraits" / "inca-maids" / "raw"
FACES = ROOT / "artifacts" / "portraits" / "inca-maids" / "faces"
HALVES = ROOT / "artifacts" / "portraits" / "inca-maids" / "halves"
GAME = ROOT / "images" / "maid-styles" / "inca"
MODEL = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"


def detector_model_path() -> Path:
    """Give OpenCV an ASCII-only path because its ONNX loader is not Unicode-safe on Windows."""
    cached = Path(tempfile.gettempdir()) / "codex_face_detection_yunet_2023mar.onnx"
    if not cached.exists() or cached.stat().st_size != MODEL.stat().st_size:
        shutil.copyfile(MODEL, cached)
    return cached


def detect_face(image_path: Path) -> np.ndarray:
    # cv2.imread cannot open this workspace's Korean path on Windows.
    encoded = np.fromfile(image_path, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Cannot decode {image_path}")
    height, width = image.shape[:2]
    detector = cv2.FaceDetectorYN.create(str(detector_model_path()), "", (width, height), 0.6, 0.3, 5000)
    _, faces = detector.detect(image)
    if faces is None:
        raise RuntimeError(f"No face detected in {image_path}")
    return max(faces, key=lambda face: float(face[-1]))


def crop_face(source: Image.Image, face: np.ndarray) -> Image.Image:
    x, y, width, height = (float(value) for value in face[:4])
    side = min(float(source.width), max(width, height) * 3.0)
    center_x = x + width / 2
    center_y = y + height / 2 + height * 0.18
    left = max(0.0, min(source.width - side, center_x - side / 2))
    top = max(0.0, min(source.height - side, center_y - side / 2))
    box = (round(left), round(top), round(left + side), round(top + side))
    return source.crop(box).resize((448, 448), Image.Resampling.LANCZOS)


def normalized_face(face: np.ndarray, width: int, height: int) -> dict[str, list[float]]:
    x, y, w, h = (float(value) for value in face[:4])
    right_eye = face[4:6]
    left_eye = face[6:8]
    mouth_right = face[10:12]
    mouth_left = face[12:14]
    return {
        "box": [round(x / width, 4), round(y / height, 4), round(w / width, 4), round(h / height, 4)],
        "eyes": [
            round(float(right_eye[0]) / width, 4),
            round(float(right_eye[1]) / height, 4),
            round(float(left_eye[0]) / width, 4),
            round(float(left_eye[1]) / height, 4),
        ],
        "mouth": [
            round(float(mouth_right[0] + mouth_left[0]) / 2 / width, 4),
            round(float(mouth_right[1] + mouth_left[1]) / 2 / height, 4),
        ],
    }


def build_contact_sheet(half_paths: list[Path], face_paths: list[Path]) -> None:
    tile_w, face_h, half_h = 260, 260, 390
    sheet = Image.new("RGB", (tile_w * len(half_paths), face_h + half_h + 64), (35, 27, 24))
    draw = ImageDraw.Draw(sheet)
    for index, (face_path, half_path) in enumerate(zip(face_paths, half_paths), 1):
        for row, path, max_h, y0 in (("face", face_path, face_h, 0), ("knee", half_path, half_h, face_h + 32)):
            portrait = Image.open(path).convert("RGBA")
            portrait.thumbnail((tile_w - 8, max_h - 8), Image.Resampling.LANCZOS)
            backdrop = Image.new("RGBA", portrait.size, (105, 78, 61, 255))
            backdrop.alpha_composite(portrait)
            x = (index - 1) * tile_w + (tile_w - portrait.width) // 2
            y = y0 + (max_h - portrait.height) // 2
            sheet.paste(backdrop.convert("RGB"), (x, y))
            draw.text(((index - 1) * tile_w + 8, y0 + max_h + 8), f"{index} · {row}", fill=(244, 226, 195))
    sheet.save(ROOT / "artifacts" / "portraits" / "inca-maids-contact-sheet.jpg", quality=92)


def main() -> None:
    for directory in (FACES, HALVES, GAME):
        directory.mkdir(parents=True, exist_ok=True)

    metadata: dict[str, dict[str, list[float]]] = {}
    half_paths: list[Path] = []
    face_paths: list[Path] = []
    for index in range(1, 6):
        stem = f"inca_maid_{index:02d}"
        source_path = RAW / f"{stem}.png"
        source = Image.open(source_path).convert("RGBA")
        if source.size != (1024, 1536):
            source = source.resize((1024, 1536), Image.Resampling.LANCZOS)

        half_png = HALVES / f"{stem}.png"
        source.save(half_png)
        half_paths.append(half_png)
        half_webp = GAME / f"{index}_half.webp"
        source.save(half_webp, "WEBP", quality=92, method=4)

        face = crop_face(source, detect_face(source_path))
        face_png = FACES / f"{stem}.png"
        face.save(face_png)
        face_paths.append(face_png)
        face_webp = GAME / f"{index}.webp"
        face.save(face_webp, "WEBP", quality=94, method=4)

        face_data = detect_face(face_webp)
        half_data = detect_face(half_webp)
        metadata[f"maid-styles/inca/{index}"] = normalized_face(face_data, 448, 448)
        metadata[f"maid-styles/inca/{index}_half"] = normalized_face(half_data, 1024, 1536)

    metadata_path = ROOT / "artifacts" / "portraits" / "inca-maids" / "face-metadata.json"
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    build_contact_sheet(half_paths, face_paths)
    print(metadata_path)


if __name__ == "__main__":
    main()
