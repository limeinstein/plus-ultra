#!/usr/bin/env python3
"""검은 배경의 여급 그림판(6명×2두 자세)을 지역별 흉상·무릎상으로 나눈다.

위쪽 줄은 흉상, 아래쪽 줄은 같은 인물의 머리부터 무릎까지 그림이다. 단순히
칸 좌표로 잘라 팔·베일·접시가 짤리거나 이웃 인물이 섞이지 않게, 얼굴 12개를 찾은 뒤
검은 배경 위의 연결된 픽셀을 얼굴별로 확장하여 각 인물을 개별 객체 마스크로 분리한다.

사용법:
    pip install opencv-python pillow scikit-image
    python tools/import_maid_sheets.py 그림판.jpg india --start 13
    python tools/import_maid_sheets.py 그림판.jpg westeurope --start 2 --preview tmp/west.png
"""
from __future__ import annotations

import argparse
import shutil
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from skimage.segmentation import expand_labels, watershed


ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "images" / "maid-styles"
PEOPLE = 6


def alpha_from_black(rgb: np.ndarray) -> np.ndarray:
    """JPEG의 검은 배경과 경계 압축 노이즈만 부드럽게 투명화한다."""
    hi = rgb.max(axis=2).astype(np.float32)
    lo = rgb.min(axis=2).astype(np.float32)
    # 채도가 있는 어두운 머리카락·옷은 중성 검정 배경보다 더 많이 살린다.
    signal = hi + (hi - lo) * 1.7
    alpha = np.clip((signal - 8.0) * (255.0 / 24.0), 0, 255)
    return alpha.astype(np.uint8)


def dark_seam(rgb: np.ndarray, nominal_y: int, radius: int) -> np.ndarray:
    """흉상과 무릎상 사이의 검은 배경을 따라가는 가로 경계선."""
    transposed = np.transpose(rgb, (1, 0, 2))
    width, height = transposed.shape[:2]
    y0, y1 = max(1, nominal_y - radius), min(height - 1, nominal_y + radius + 1)
    light = transposed[:, y0:y1].max(axis=2).astype(np.float32) / 255.0
    light = cv2.GaussianBlur(light, (7, 7), 0)
    ys = np.arange(y0, y1, dtype=np.float32)
    cost = light * light * 8.0 + 0.05 * ((ys - nominal_y) / max(1, radius)) ** 2
    n = y1 - y0
    dp = np.empty_like(cost)
    prev = np.zeros((width, n), dtype=np.int16)
    dp[0] = cost[0]
    for x in range(1, width):
        old = dp[x - 1]
        for y in range(n):
            a, b = max(0, y - 2), min(n, y + 3)
            choices = old[a:b] + 0.018 * np.abs(np.arange(a, b) - y)
            k = int(np.argmin(choices)) + a
            dp[x, y] = cost[x, y] + choices[k - a]
            prev[x, y] = k
    seam = np.empty(width, dtype=np.int32)
    seam[-1] = int(np.argmin(dp[-1]))
    for x in range(width - 1, 0, -1):
        seam[x - 1] = prev[x, seam[x]]
    return seam + y0


def pose_boundary(rgb: np.ndarray) -> np.ndarray:
    """여섯 칸을 나누지 않고 흉상 줄과 무릎상 줄만 검은 여백으로 분리한다."""
    h = rgb.shape[0]
    light = rgb.max(axis=2).astype(np.float32)
    ink = np.percentile(light, 70, axis=1)
    ink = np.convolve(ink, np.ones(9, dtype=np.float32) / 9, mode="same")
    lo, hi = int(h * 0.34), int(h * 0.58)
    nominal = lo + int(np.argmin(ink[lo:hi]))
    return dark_seam(rgb, nominal, max(10, round(h * 0.07)))


def detect_faces(rgb: np.ndarray) -> list[tuple[int, int]]:
    """좌표 칸이 아닌 실제 얼굴 12개를 찾아 개별 객체의 시작점으로 쓴다."""
    source = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"
    model = Path(tempfile.gettempdir()) / "codex-yunet-face.onnx"
    if not model.exists() or model.stat().st_size != source.stat().st_size:
        shutil.copyfile(source, model)  # OpenCV가 한글 경로의 ONNX를 못 읽는 문제를 피한다.
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    detector = cv2.FaceDetectorYN.create(str(model), "", (bgr.shape[1], bgr.shape[0]), 0.45, 0.3, 500)
    _, found = detector.detect(bgr)
    if found is None:
        raise RuntimeError("얼굴을 찾지 못했습니다.")
    faces = [r for r in found if float(r[14]) >= 0.7]
    if len(faces) != PEOPLE * 2:
        raise RuntimeError(f"얼굴 {PEOPLE * 2}개가 필요한데 {len(faces)}개를 찾았습니다.")
    return [(round(float(r[0] + r[2] / 2)), round(float(r[1] + r[3] / 2))) for r in faces]


def individual_subjects(rgb: np.ndarray) -> list[list[Image.Image]]:
    """얼굴을 종자로 삼아 검은 배경 위의 픽셀을 12개 인물 객체로 분리한다."""
    alpha = alpha_from_black(rgb)
    foreground = (alpha >= 48).astype(np.uint8)
    foreground = cv2.morphologyEx(foreground, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    faces = detect_faces(rgb)
    order_y = sorted(range(len(faces)), key=lambda i: faces[i][1])
    top = sorted(order_y[:PEOPLE], key=lambda i: faces[i][0])
    bottom = sorted(order_y[PEOPLE:], key=lambda i: faces[i][0])
    boundary = pose_boundary(rgb)
    yy = np.arange(foreground.shape[0])[:, None]
    top_mask = foreground.astype(bool) & (yy < boundary[None, :])
    bottom_mask = foreground.astype(bool) & (yy >= boundary[None, :])
    def body_markers(row_mask: np.ndarray, ids: list[int]) -> np.ndarray:
        """맞닿은 가는 부분을 잠시 줄여, 얼굴과 한 몸인 핵심 덩어리 6개를 찾는다."""
        kernel = np.ones((3, 3), np.uint8)
        for turns in range(1, 7):
            shrunk = cv2.erode(row_mask.astype(np.uint8), kernel, iterations=turns)
            count, comps = cv2.connectedComponents(shrunk, 8)
            owned = [int(comps[faces[i][1], faces[i][0]]) for i in ids]
            if all(owned) and len(set(owned)) == len(ids):
                markers = np.zeros(row_mask.shape, dtype=np.int32)
                for i, comp in zip(ids, owned):
                    markers[comps == comp] = i + 1
                return markers
        # 강한 침식 때문에 핵심 덩어리가 안 나뉘면 얼굴을 안전한 최소 종자로 쓴다.
        markers = np.zeros(row_mask.shape, dtype=np.int32)
        for i in ids:
            cv2.circle(markers, faces[i], 3, i + 1, -1)
        return markers

    top_markers = body_markers(top_mask, top)
    bottom_markers = body_markers(bottom_mask, bottom)
    # 밝기나 칸 경계가 아니라 각 얼굴에서 연결된 픽셀을 따라 동시에 퍼져 나간다.
    # 두 인물의 머리카락이 맞닿아도 좁은 연결부에서 서로 다른 객체로 나뉜다.
    elevation = np.zeros(foreground.shape, dtype=np.uint8)
    labels = watershed(elevation, top_markers, mask=top_mask, watershed_line=True)
    lower = watershed(elevation, bottom_markers, mask=bottom_mask, watershed_line=True)
    labels[lower != 0] = lower[lower != 0]

    # 손에서 떨어진 잔·꽃·장신구 같은 작은 덩어리도 가장 가까운 얼굴의 인물에 붙인다.
    loose = (foreground != 0) & (labels == 0)
    count, comps, stats, centers = cv2.connectedComponentsWithStats(loose.astype(np.uint8), 8)
    face_xy = np.asarray(faces, dtype=np.float32)
    for comp in range(1, count):
        area = stats[comp, cv2.CC_STAT_AREA]
        # 작은 장신구만 붙인다. 여러 인물이 한꺼번에 연결된 큰 덩어리를
        # 특정 한 사람에게 몰아주지 않는다.
        if area < 5 or area > 80:
            continue
        cx, cy = centers[comp]
        d = (face_xy[:, 0] - cx) ** 2 + (face_xy[:, 1] - cy) ** 2 * 1.35
        labels[comps == comp] = 1 + int(np.argmin(d))

    labels = expand_labels(labels, distance=3)

    # 인접 인물이 실제로 맞닿은 곳에서는 얼굴 종자만으로 퍼뜨린 마스크가 옆 소매나
    # 손끝을 조금 가져올 수 있다. 두 얼굴 사이의 검은 여백을 따라가는 가변 경계로
    # 각 객체의 외곽만 제한한다. 고정 폭 칸이나 스프라이트 좌표로 자르는 방식이 아니다.
    corridors: dict[int, np.ndarray] = {}

    def add_corridors(ids: list[int], y0: int, y1: int) -> None:
        crop = rgb[y0:y1]
        turned = np.transpose(crop, (1, 0, 2))
        seams: list[np.ndarray] = []
        for a, b in zip(ids, ids[1:]):
            xa, xb = faces[a][0], faces[b][0]
            nominal = (xa + xb) // 2
            radius = max(14, min(70, (xb - xa) // 3))
            seams.append(dark_seam(turned, nominal, radius))
        xx = np.arange(rgb.shape[1])[None, :]
        for pos, face_id in enumerate(ids):
            mask = np.zeros(foreground.shape, dtype=bool)
            band = np.ones((y1 - y0, rgb.shape[1]), dtype=bool)
            if pos:
                band &= xx >= seams[pos - 1][:, None]
            if pos < len(ids) - 1:
                band &= xx < seams[pos][:, None]
            mask[y0:y1] = band
            corridors[face_id + 1] = mask

    split_y = int(np.median(boundary))
    add_corridors(top, 0, min(rgb.shape[0], split_y + 8))
    add_corridors(bottom, max(0, split_y - 8), rgb.shape[0])
    subjects = []
    for label in range(1, PEOPLE * 2 + 1):
        core = ((labels == label) & (alpha >= 48) & corridors[label]).astype(np.uint8)
        # 서로 맞닿은 두 인물의 머리카락·옷 사이의 아주 가는 다리를 끊고
        # 얼굴과 한 몸으로 이어진 덩어리만 다시 넓힌다.
        separated = cv2.erode(core, np.ones((3, 3), np.uint8), iterations=2)
        count, comps, stats, _ = cv2.connectedComponentsWithStats(separated, 8)
        x, y = faces[label - 1]
        main = int(comps[y, x]) if 0 <= y < comps.shape[0] and 0 <= x < comps.shape[1] else 0
        if main == 0 and count > 1:
            main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        keep = (comps == main).astype(np.uint8) if main else separated
        # 얼굴이 속한 한 덩어리만 남겨, 지척에 있더라도 연결되지 않은
        # 이웃 인물의 손·소매·치마 조각은 버린다.
        keep = cv2.dilate(keep, np.ones((5, 5), np.uint8)) & core
        keep = cv2.dilate(keep, np.ones((7, 7), np.uint8))
        own_alpha = np.where(keep != 0, alpha, 0).astype(np.uint8)
        subjects.append(Image.fromarray(np.dstack((rgb, own_alpha)), "RGBA"))

    # 위쪽 얼굴 6개는 흉상, 아래쪽 얼굴 6개는 같은 순서의 무릎상이다.
    return [[subjects[i] for i in top], [subjects[i] for i in bottom]]


def place(subject: Image.Image, size: tuple[int, int], margin: int) -> Image.Image:
    bbox = subject.getchannel("A").getbbox()
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    if not bbox:
        return out
    cut = subject.crop(bbox)
    max_w, max_h = size[0] - margin * 2, size[1] - margin * 2
    scale = min(max_w / cut.width, max_h / cut.height)
    resized = cut.resize((max(1, round(cut.width * scale)), max(1, round(cut.height * scale))), Image.Resampling.LANCZOS)
    x = (size[0] - resized.width) // 2
    y = size[1] - margin - resized.height
    out.alpha_composite(resized, (x, y))
    return out


def preview_grid(pairs: list[tuple[Image.Image, Image.Image]], path: Path) -> None:
    tile_w, tile_h = 220, 550
    canvas = Image.new("RGB", (tile_w * PEOPLE, tile_h), (63, 63, 67))
    draw = ImageDraw.Draw(canvas)
    for i, (face, half) in enumerate(pairs):
        # 투명 경계와 잘린 부분을 한번에 보기 위한 체크 배경.
        bg = Image.new("RGBA", (tile_w, tile_h), (0, 0, 0, 0))
        for y in range(0, tile_h, 16):
            for x in range(0, tile_w, 16):
                c = 92 if (x // 16 + y // 16) % 2 else 125
                ImageDraw.Draw(bg).rectangle((x, y, x + 15, y + 15), fill=(c, c, c, 255))
        face_small = face.copy()
        face_small.thumbnail((210, 210), Image.Resampling.LANCZOS)
        bg.alpha_composite(face_small, ((tile_w - face_small.width) // 2, 0))
        small = half.copy()
        small.thumbnail((210, 315), Image.Resampling.LANCZOS)
        bg.alpha_composite(small, ((tile_w - small.width) // 2, tile_h - small.height))
        canvas.paste(bg.convert("RGB"), (i * tile_w, 0))
        draw.text((i * tile_w + 8, 8), str(i + 1), fill=(255, 235, 170))
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, quality=92)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("sheet", type=Path)
    ap.add_argument("region")
    ap.add_argument("--start", type=int, required=True, help="첫 출력 번호")
    ap.add_argument("--preview", type=Path)
    args = ap.parse_args()

    rgb = np.asarray(Image.open(args.sheet).convert("RGB"))
    row_subjects = individual_subjects(rgb)

    out_dir = OUT_ROOT / args.region
    out_dir.mkdir(parents=True, exist_ok=True)
    pairs = []
    for i in range(PEOPLE):
        face = place(row_subjects[0][i], (512, 512), 8)
        half = place(row_subjects[1][i], (1024, 1536), 20)
        n = args.start + i
        face.save(out_dir / f"{n}.webp", "WEBP", quality=92, method=4)
        half.save(out_dir / f"{n}_half.webp", "WEBP", quality=92, method=4)
        pairs.append((face, half))

    if args.preview:
        preview_grid(pairs, args.preview)
    print(f"{args.region}: {args.start}~{args.start + PEOPLE - 1} 흉상·무릎상 {PEOPLE}쌍 (인물 객체 마스크)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
