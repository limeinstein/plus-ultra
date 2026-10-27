#!/usr/bin/env python3
"""초창기 여급 원본 시트를 얼굴상·무릎상 98쌍으로 무손실 복원한다.

ZIP 안 PNG는 이미 같은 캐릭터의 얼굴상과 무릎상을 짝지어 둔 원본 시트다.
재생성으로 얼굴·의상·포즈가 바뀌지 않도록 원본 알파를 그대로 사용하고,
Lanczos 확대와 아주 약한 선명화만 적용한다.

    python tools/restore_initial_maid_archive.py "D:/download/download 12/여급 초기.zip"
"""
from __future__ import annotations

import argparse
import shutil
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

import import_maid_sheets as sheet_import


ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "images" / "maid-styles"
PREVIEW_ROOT = ROOT / "artifacts" / "maid-initial-restoration"
FACE_MODEL = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"
MASK_ROOT = ROOT / "tools" / "maid-initial-masks"


@dataclass(frozen=True)
class Sheet:
    suffix: str
    style: str
    start: int
    columns: int = 6
    row_pairs: tuple[tuple[int, int], ...] = ((0, 1),)
    row_edges: tuple[int, ...] | None = None


# 원본 시트의 순서와 지역을 바꾸지 않는다. 번호는 기존 그림 뒤에만 붙인다.
SHEETS = (
    Sheet("03", "arabia", 14),
    Sheet("04", "india", 19),
    Sheet("05", "india", 25),
    Sheet("06", "china", 19),
    Sheet("07", "ottoman", 8),
    # 일본 시트 두 장만 다른 검은 배경 시트와 달리 한 줄이 5명이다.
    Sheet("08", "japan", 11, columns=5),
    Sheet("09", "japan", 16, columns=5),
    Sheet("10", "china", 25),
    Sheet("11", "china", 31),
    Sheet("12", "native", 13),
    Sheet("13", "africa", 19),
    Sheet("14", "tropic", 7),
    Sheet("15", "westeurope", 8),
    Sheet("16", "westeurope", 14, row_edges=(0, 416, 1024)),
    Sheet("17", "westeurope", 20, columns=8, row_pairs=((0, 1), (2, 3)), row_edges=(0, 247, 601, 790, 1024)),
)


def cell_box(size: tuple[int, int], columns: int, rows: int, column: int, row: int) -> tuple[int, int, int, int]:
    width, height = size
    return (
        round(width * column / columns),
        round(height * row / rows),
        round(width * (column + 1) / columns),
        round(height * (row + 1) / rows),
    )


def sheet_cell_box(sheet: Sheet, size: tuple[int, int], rows: int, column: int, row: int) -> tuple[int, int, int, int]:
    """균등 격자이거나, 원본 시트에 기록된 실제 행 경계로 한 칸을 돌려준다."""
    box = list(cell_box(size, sheet.columns, rows, column, row))
    if sheet.row_edges is not None:
        if len(sheet.row_edges) != rows + 1 or sheet.row_edges[-1] != size[1]:
            raise RuntimeError(f"시트 {sheet.suffix}의 행 경계가 원본 크기와 맞지 않습니다")
        box[1], box[3] = sheet.row_edges[row], sheet.row_edges[row + 1]
    return tuple(box)


def clean_source(cell: Image.Image) -> Image.Image:
    """원본의 투명도는 보존하고, 완전 투명 픽셀의 색 잡음만 지운다."""
    pixels = np.array(cell.convert("RGBA"))
    # 원본 PNG의 알파 1~4에는 빨강·노랑 등 진단용 RGB가 남아 있다.
    # RGB만 보고 다시 누끼를 따면 이 색이 불투명한 형광 테두리로 살아난다.
    pixels[pixels[:, :, 3] <= 4] = 0
    rgba = Image.fromarray(pixels)
    alpha = rgba.getchannel("A")
    # 카카오톡 PNG는 인물의 최대 알파가 251~255이므로 임계값으로 다시 따지 않는다.
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("빈 원본 칸입니다")
    # paste(..., mask=alpha)는 알파를 두 번 곱해 머리카락·베일을 손상시킨다.
    return rgba.crop(bbox)


def separation_rgb(sheet: Image.Image) -> np.ndarray:
    """인물 분리용 RGB에는 원본 투명도를 검정 위에 한 번만 합성한다."""
    backdrop = Image.new("RGBA", sheet.size, (0, 0, 0, 255))
    backdrop.alpha_composite(clean_source_canvas(sheet))
    return np.asarray(backdrop.convert("RGB"))


def clean_source_canvas(sheet: Image.Image) -> Image.Image:
    """원본 좌표를 유지하면서 거의 투명한 진단색만 지운다."""
    pixels = np.array(sheet.convert("RGBA"))
    pixels[pixels[:, :, 3] <= 4] = 0
    return Image.fromarray(pixels)


def preserve_source_alpha(subject: Image.Image, sheet: Image.Image) -> Image.Image:
    """인물 분리 결과는 영역 선택에만 쓰고 색·알파는 PNG 원본에서 가져온다."""
    pixels = np.array(clean_source_canvas(sheet))
    selected = np.asarray(subject.getchannel("A")) > 0
    pixels[~selected] = 0
    return Image.fromarray(pixels)


def detect_sheet_faces(rgb: np.ndarray, columns: int) -> list[tuple[int, int]]:
    """검은 배경 2줄 시트에서 각 줄의 실제 얼굴만 고른다(장식 오검출 제외)."""
    model = Path(tempfile.gettempdir()) / "maid_initial_sheet_yunet.onnx"
    if not model.is_file() or model.stat().st_size != FACE_MODEL.stat().st_size:
        shutil.copy2(FACE_MODEL, model)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    detector = cv2.FaceDetectorYN.create(str(model), "", (bgr.shape[1], bgr.shape[0]), 0.42, 0.3, 500)
    _, found = detector.detect(bgr)
    if found is None:
        raise RuntimeError("시트 얼굴을 찾지 못했습니다")
    candidates = [r for r in found if float(r[14]) >= 0.30]
    # 위·아래 두 줄을 y 중심으로 나누고, 각 열에 가장 잘 맞는 얼굴 하나를 둔다.
    # 장식 때문에 얼굴을 놓친 열은 시트의 규칙적인 열 중심과 그 줄의 중간 y로 보완한다.
    centers = [(float(r[1] + r[3] / 2), r) for r in candidates]
    split = rgb.shape[0] * 0.5
    top = [r for cy, r in centers if cy < split]
    bottom = [r for cy, r in centers if cy >= split]
    def row_centers(row: list[np.ndarray], fallback_y: float) -> list[tuple[int, int]]:
        chosen: list[np.ndarray | None] = [None] * columns
        for r in sorted(row, key=lambda value: float(value[14]), reverse=True):
            cx = float(r[0] + r[2] / 2)
            column = min(columns - 1, max(0, int(cx * columns / rgb.shape[1])))
            if chosen[column] is None:
                chosen[column] = r
        ys = [float(r[1] + r[3] / 2) for r in chosen if r is not None]
        y = float(np.median(ys)) if ys else fallback_y
        result = []
        for column, r in enumerate(chosen):
            if r is None:
                result.append((round((column + 0.5) * rgb.shape[1] / columns), round(y)))
            else:
                result.append((round(float(r[0] + r[2] / 2)), round(float(r[1] + r[3] / 2))))
        return result
    return row_centers(top, rgb.shape[0] * 0.20) + row_centers(bottom, rgb.shape[0] * 0.67)


def restore(cell: Image.Image, size: tuple[int, int], margin: int, bottom: bool) -> Image.Image:
    """원본 형상은 그대로 둔 채 출력 캔버스에 최대 크기로 배치한다."""
    subject = clean_source(cell)
    max_w, max_h = size[0] - margin * 2, size[1] - margin * 2
    scale = min(max_w / subject.width, max_h / subject.height)
    target = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(target, Image.Resampling.LANCZOS)
    # 확대 뒤 생기는 흐림만 보정한다. 색·형태를 새로 만들지 않는 범위다.
    rgb = subject.convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.15, percent=108, threshold=3))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.015)
    rgb.putalpha(subject.getchannel("A"))
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (size[0] - rgb.width) // 2
    y = size[1] - margin - rgb.height if bottom else (size[1] - rgb.height) // 2
    out.alpha_composite(rgb, (x, y))
    return out


def checker(tile: Image.Image, size: tuple[int, int]) -> Image.Image:
    bg = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(bg)
    step = 16
    for y in range(0, size[1], step):
        for x in range(0, size[0], step):
            c = 78 if (x // step + y // step) % 2 else 112
            draw.rectangle((x, y, x + step - 1, y + step - 1), fill=(c, c, c, 255))
    copy = tile.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    bg.alpha_composite(copy, ((size[0] - copy.width) // 2, size[1] - copy.height))
    return bg.convert("RGB")


def build_preview(items: list[tuple[str, Image.Image, Image.Image]]) -> None:
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    cols, tw, th = 10, 180, 330
    rows = (len(items) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * tw, rows * th), (34, 30, 28))
    draw = ImageDraw.Draw(canvas)
    for i, (key, face, half) in enumerate(items):
        x, y = (i % cols) * tw, (i // cols) * th
        card = checker(half, (tw, th - 72))
        canvas.paste(card, (x, y + 48))
        bust = checker(face, (68, 68))
        canvas.paste(bust, (x + tw - 72, y + 2))
        draw.text((x + 6, y + 8), key, fill=(255, 232, 177))
    canvas.save(PREVIEW_ROOT / "all-restored.jpg", "JPEG", quality=92, optimize=True)

    fw = 160
    faces = Image.new("RGB", (10 * fw, rows * fw), (34, 30, 28))
    for i, (_, face, _) in enumerate(items):
        faces.paste(checker(face, (fw, fw)), ((i % 10) * fw, (i // 10) * fw))
    faces.save(PREVIEW_ROOT / "faces-restored.jpg", "JPEG", quality=92, optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    archive = args.archive.resolve()
    if not archive.is_file():
        raise SystemExit(f"ZIP을 찾지 못했습니다: {archive}")

    output: list[tuple[str, Image.Image, Image.Image]] = []
    with tempfile.TemporaryDirectory(prefix="maid-initial-") as temp_name:
        temp = Path(temp_name)
        with zipfile.ZipFile(archive) as bundle:
            pngs = [name for name in bundle.namelist() if name.lower().endswith(".png")]
            for name in pngs:
                # 문서 안 경로·지시문은 사용하지 않고 PNG 바이트만 안전한 임시 이름으로 꺼낸다.
                target = temp / Path(name).name
                target.write_bytes(bundle.read(name))

        for spec in SHEETS:
            print(f"시트 {spec.suffix} → {spec.style}/{spec.start}", flush=True)
            matches = sorted(temp.glob(f"*_{spec.suffix}.png"))
            if len(matches) != 1:
                raise RuntimeError(f"시트 {spec.suffix}를 하나만 찾을 수 없습니다: {matches}")
            sheet = Image.open(matches[0]).convert("RGBA")
            alpha_sheet = None
            if spec.suffix in {"16", "17"}:
                mask_path = MASK_ROOT / f"{spec.suffix}.png"
                if not mask_path.is_file():
                    raise RuntimeError(f"그라데이션 배경 분리 마스크가 없습니다: {mask_path}")
                alpha_sheet = Image.open(mask_path).convert("L")
                if alpha_sheet.size != sheet.size:
                    raise RuntimeError(f"마스크 크기가 원본과 다릅니다: {mask_path}")
            rows = max(max(pair) for pair in spec.row_pairs) + 1
            separated = None
            if spec.suffix not in {"16", "17"}:
                # 맞닿은 소매·머리카락을 고정 칸으로 자르지 않고 얼굴에서 연결된 객체로 분리한다.
                sheet_import.PEOPLE = spec.columns
                sheet_import.detect_faces = lambda rgb, columns=spec.columns: detect_sheet_faces(rgb, columns)
                separated = sheet_import.individual_subjects(separation_rgb(sheet))
                separated = [[preserve_source_alpha(person, sheet) for person in row]
                             for row in separated]
            index = 0
            for face_row, half_row in spec.row_pairs:
                for column in range(spec.columns):
                    if separated is not None:
                        face_cell = separated[0][column]
                        half_cell = separated[1][column]
                        # 얼굴 검출을 놓친 드문 칸은 그 칸의 원본으로만 되돌린다.
                        if not face_cell.getchannel("A").getbbox():
                            face_cell = sheet.crop(sheet_cell_box(spec, sheet.size, rows, column, face_row))
                        if not half_cell.getchannel("A").getbbox():
                            half_cell = sheet.crop(sheet_cell_box(spec, sheet.size, rows, column, half_row))
                    else:
                        # 마지막 두 시트는 갈색 그라데이션 배경이 있어, 검수한
                        # 전용 알파 마스크만 입힌다. RGB 원본은 한 픽셀도 재생성하지 않는다.
                        face_box = sheet_cell_box(spec, sheet.size, rows, column, face_row)
                        half_box = sheet_cell_box(spec, sheet.size, rows, column, half_row)
                        face_cell = sheet.crop(face_box)
                        half_cell = sheet.crop(half_box)
                        face_cell.putalpha(alpha_sheet.crop(face_box))
                        half_cell.putalpha(alpha_sheet.crop(half_box))
                    face = restore(face_cell, (1024, 1024), 18, bottom=True)
                    half = restore(half_cell, (1024, 1536), 20, bottom=True)
                    number = spec.start + index
                    key = f"{spec.style}/{number}"
                    folder = OUT_ROOT / spec.style
                    folder.mkdir(parents=True, exist_ok=True)
                    face.save(folder / f"{number}.webp", "WEBP", quality=95, method=4, exact=True)
                    half.save(folder / f"{number}_half.webp", "WEBP", quality=95, method=4, exact=True)
                    output.append((key, face, half))
                    index += 1

    if len(output) != 98:
        raise RuntimeError(f"98명이 아니라 {len(output)}명이 복원됐습니다")
    build_preview(output)
    print("초창기 여급 98명: 원본 유지 얼굴상 98장·무릎상 98장 완료")
    print(PREVIEW_ROOT / "all-restored.jpg")
    print(PREVIEW_ROOT / "faces-restored.jpg")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
