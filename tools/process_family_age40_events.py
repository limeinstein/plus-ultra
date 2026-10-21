"""Build age-40 family portraits and adult-family event art from ImageGen PNGs."""

from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PORTRAIT_RAW = ROOT / "artifacts" / "portraits" / "family-age40" / "raw"
PORTRAIT_FACES = ROOT / "artifacts" / "portraits" / "family-age40" / "faces"
PORTRAIT_HALVES = ROOT / "artifacts" / "portraits" / "family-age40" / "halves"
PORTRAIT_GAME = ROOT / "images" / "portraits" / "family"
EVENT_RAW = ROOT / "artifacts" / "family-adult-events" / "raw"
EVENT_GAME = ROOT / "images" / "family-events"
MODEL = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"


def detector_model_path() -> Path:
    """Give OpenCV an ASCII-only path because its ONNX loader is not Unicode-safe on Windows."""
    cached = Path(tempfile.gettempdir()) / "codex_face_detection_yunet_2023mar.onnx"
    if not cached.exists() or cached.stat().st_size != MODEL.stat().st_size:
        shutil.copyfile(MODEL, cached)
    return cached


def detect_face(image_path: Path) -> np.ndarray:
    encoded = np.fromfile(image_path, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Cannot decode {image_path}")
    height, width = image.shape[:2]
    detector = cv2.FaceDetectorYN.create(str(detector_model_path()), "", (width, height), 0.55, 0.3, 5000)
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
    return source.crop((round(left), round(top), round(left + side), round(top + side))).resize(
        (448, 448), Image.Resampling.LANCZOS
    )


def normalized_face(face: np.ndarray, width: int, height: int) -> dict[str, list[float]]:
    x, y, w, h = (float(value) for value in face[:4])
    right_eye, left_eye = face[4:6], face[6:8]
    mouth_right, mouth_left = face[10:12], face[12:14]
    return {
        "box": [round(x / width, 4), round(y / height, 4), round(w / width, 4), round(h / height, 4)],
        "eyes": [
            round(float(right_eye[0]) / width, 4), round(float(right_eye[1]) / height, 4),
            round(float(left_eye[0]) / width, 4), round(float(left_eye[1]) / height, 4),
        ],
        "mouth": [
            round(float(mouth_right[0] + mouth_left[0]) / 2 / width, 4),
            round(float(mouth_right[1] + mouth_left[1]) / 2 / height, 4),
        ],
    }


def crop_to_ratio(image: Image.Image, width_ratio: int = 9, height_ratio: int = 4) -> Image.Image:
    target = width_ratio / height_ratio
    current = image.width / image.height
    if current > target:
        width = round(image.height * target)
        left = (image.width - width) // 2
        return image.crop((left, 0, left + width, image.height))
    height = round(image.width / target)
    top = (image.height - height) // 2
    return image.crop((0, top, image.width, top + height))


def build_portraits() -> dict[str, dict[str, list[float]]]:
    for directory in (PORTRAIT_FACES, PORTRAIT_HALVES, PORTRAIT_GAME):
        directory.mkdir(parents=True, exist_ok=True)
    metadata: dict[str, dict[str, list[float]]] = {}
    for sex in ("daughter", "son"):
        for variant in range(1, 6):
            stem = f"{sex}_age40_v{variant}"
            raw = PORTRAIT_RAW / f"{stem}.png"
            source = Image.open(raw).convert("RGBA")
            if source.size != (1024, 1536):
                source = source.resize((1024, 1536), Image.Resampling.LANCZOS)
            half_png = PORTRAIT_HALVES / f"{stem}_half.png"
            source.save(half_png)
            half_webp = PORTRAIT_GAME / f"{stem}_half.webp"
            source.save(half_webp, "WEBP", quality=92, method=4)

            face = crop_face(source, detect_face(raw))
            face_png = PORTRAIT_FACES / f"{stem}.png"
            face.save(face_png)
            face_webp = PORTRAIT_GAME / f"{stem}.webp"
            face.save(face_webp, "WEBP", quality=94, method=4)

            for key, path, size in (
                (f"portraits/family/{stem}", face_webp, (448, 448)),
                (f"portraits/family/{stem}_half", half_webp, (1024, 1536)),
            ):
                metadata[key] = normalized_face(detect_face(path), *size)
    return metadata


def build_events() -> list[Path]:
    EVENT_GAME.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    for raw in sorted(EVENT_RAW.glob("*.png")):
        image = crop_to_ratio(Image.open(raw).convert("RGB"))
        image = image.resize((576, 256), Image.Resampling.LANCZOS)
        output = EVENT_GAME / f"{raw.stem}.webp"
        image.save(output, "WEBP", quality=92, method=4)
        outputs.append(output)
    return outputs


def checker(size: tuple[int, int], step: int = 24) -> Image.Image:
    board = Image.new("RGBA", size, (82, 69, 64, 255))
    draw = ImageDraw.Draw(board)
    for y in range(0, size[1], step):
        for x in range(0, size[0], step):
            if (x // step + y // step) % 2:
                draw.rectangle((x, y, x + step - 1, y + step - 1), fill=(112, 93, 84, 255))
    return board


def build_portrait_sheet() -> None:
    tile_w, face_h, half_h, label_h = 256, 246, 452, 30
    block_h = face_h + half_h + label_h * 2
    sheet = Image.new("RGB", (tile_w * 5, block_h * 2), (30, 24, 23))
    draw = ImageDraw.Draw(sheet)
    for row, sex in enumerate(("daughter", "son")):
        for variant in range(1, 6):
            base_y = row * block_h
            for kind, area_h, y0 in (("face", face_h, base_y), ("half", half_h, base_y + face_h + label_h)):
                suffix = "" if kind == "face" else "_half"
                portrait = Image.open(PORTRAIT_GAME / f"{sex}_age40_v{variant}{suffix}.webp").convert("RGBA")
                portrait.thumbnail((tile_w - 16, area_h - 8), Image.Resampling.LANCZOS)
                board = checker(portrait.size)
                board.alpha_composite(portrait)
                x = (variant - 1) * tile_w + (tile_w - portrait.width) // 2
                y = y0 + (area_h - portrait.height) // 2
                sheet.paste(board.convert("RGB"), (x, y))
                draw.text(((variant - 1) * tile_w + 10, y0 + area_h + 7), f"{sex} 40 v{variant} · {kind}", fill=(246, 226, 196))
    output = ROOT / "docs" / "art" / "family-age40-preview.jpg"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, quality=92)


def build_event_sheet(events: list[Path]) -> None:
    margin, tile_w, tile_h = 16, 576, 256
    sheet = Image.new("RGB", (tile_w * 2 + margin * 3, (tile_h + 34) * 3 + margin * 2), (29, 24, 22))
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(events):
        x = margin + (index % 2) * (tile_w + margin)
        y = margin + (index // 2) * (tile_h + 34)
        sheet.paste(Image.open(path).convert("RGB"), (x, y))
        draw.text((x, y + tile_h + 7), path.stem, fill=(246, 226, 196))
    output = ROOT / "docs" / "art" / "family-adult-events-preview.jpg"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, quality=92)


def main() -> None:
    metadata = build_portraits()
    metadata_path = ROOT / "artifacts" / "portraits" / "family-age40" / "face-metadata.json"
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    events = build_events()
    build_portrait_sheet()
    build_event_sheet(events)
    print(metadata_path)
    print(f"portraits={len(metadata) // 2} events={len(events)}")


if __name__ == "__main__":
    main()
