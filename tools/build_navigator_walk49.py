#!/usr/bin/env python3
"""하얀 남방 항해사의 7개 핵심 자세를 49프레임 걷기 아틀라스로 만든다.

ImageGen 핵심 자세는 투명 PNG여도 희미한 배경 후광이 남을 수 있다. 먼저 인물만
분리하고 발밑 피벗을 한 좌표에 맞춘 뒤, 이웃 자세 사이를 양방향 광학 흐름으로
보간한다. 일곱 번째 자세에서 첫 자세로 가는 구간도 같은 간격으로 만들어 루프
경계만 느려지거나 멈추지 않게 한다.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


COLS = ROWS = 7
FRAMES = COLS * ROWS
CELL_W, CELL_H = 200, 300
PIVOT_X, PIVOT_Y = CELL_W // 2, 294


def largest_nearby(mask: np.ndarray) -> np.ndarray:
    """몸통과 이어진 큰 덩어리와 바로 붙은 장비 조각만 남긴다."""
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if n <= 1:
        return mask
    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    keep = labels == main
    near = cv2.dilate(keep.astype(np.uint8), np.ones((17, 17), np.uint8), iterations=1) > 0
    for i in range(1, n):
        if i == main or stats[i, cv2.CC_STAT_AREA] < 18:
            continue
        part = labels == i
        if np.any(part & near):
            keep |= part
    return keep


def cutout(path: Path) -> Image.Image:
    """부드러운 갈색 후광을 버리고 인물과 장비의 알파만 남긴다."""
    src = np.asarray(Image.open(path).convert("RGBA"))
    rgb, alpha = src[:, :, :3], src[:, :, 3]
    h, w = alpha.shape
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    edge = cv2.magnitude(gx, gy)

    yy, xx = np.mgrid[:h, :w]
    center = (xx > w * 0.07) & (xx < w * 0.93) & (yy > h * 0.015) & (yy < h * 0.985)
    visible = alpha > 12
    shirt = (hsv[:, :, 1] < 92) & (hsv[:, :, 2] > 135)
    skin = (hsv[:, :, 0] < 24) & (hsv[:, :, 1] > 35) & (hsv[:, :, 1] < 190) & (hsv[:, :, 2] > 80)
    textured = edge > 34
    sure = visible & center & (alpha > 238) & (shirt | skin | textured)
    sure = cv2.morphologyEx(sure.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0
    probable = cv2.dilate(sure.astype(np.uint8), np.ones((75, 75), np.uint8), iterations=1) > 0

    gc = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    gc[alpha < 8] = cv2.GC_BGD
    gc[visible & probable & center] = cv2.GC_PR_FGD
    gc[sure] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 7, cv2.GC_INIT_WITH_MASK)
    fg = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)) & visible
    fg = largest_nearby(fg)
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))

    # 가장자리 한두 픽셀만 부드럽게 하고, 생성기의 넓은 후광은 되살리지 않는다.
    soft = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 1.15)
    out = src.copy()
    # 투명 픽셀에도 RGB가 들어 있는 PNG가 있다. 새 마스크만 알파로 쓰면 그 숨은
    # 배경색이 되살아나므로 원본 알파를 절대 넘지 않게 교집합으로 제한한다.
    matte = np.clip(soft * 255, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.minimum(alpha, matte)
    ys, xs = np.nonzero(out[:, :, 3] > 8)
    if not len(xs):
        raise ValueError(f"인물을 분리하지 못함: {path}")
    pad = 8
    x0, x1 = max(0, xs.min() - pad), min(w, xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(h, ys.max() + pad + 1)
    return Image.fromarray(out[y0:y1, x0:x1], "RGBA")


def anchor(sprite: Image.Image) -> float:
    """머리·몸통의 가운데. 다리를 크게 벌려도 화면 중심이 흔들리지 않는다."""
    a = np.asarray(sprite)[:, :, 3] > 48
    top = a[: max(1, int(sprite.height * 0.58))]
    xs = np.nonzero(top)[1]
    return float(xs.mean()) if len(xs) else sprite.width / 2


def normalize(keys: list[Image.Image]) -> list[np.ndarray]:
    """모든 자세를 같은 셀, 같은 발밑 피벗, 같은 인물 키로 맞춘다."""
    boxes = [k.getchannel("A").getbbox() for k in keys]
    if any(b is None for b in boxes):
        raise ValueError("빈 핵심 자세")
    heights = [b[3] - b[1] for b in boxes if b]
    target_h = 268
    result = []
    for key, box, height in zip(keys, boxes, heights):
        sprite = key.crop(box)
        scale = target_h / height
        nw = max(1, round(sprite.width * scale))
        sprite = sprite.resize((nw, target_h), Image.Resampling.LANCZOS)
        if sprite.width > CELL_W - 22:
            scale2 = (CELL_W - 22) / sprite.width
            sprite = sprite.resize((CELL_W - 22, max(1, round(sprite.height * scale2))), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
        x = round(PIVOT_X - anchor(sprite))
        x = min(max(11, x), CELL_W - sprite.width - 11)
        y = PIVOT_Y - sprite.height
        canvas.alpha_composite(sprite, (x, y))
        result.append(np.asarray(canvas).copy())
    return result


def composite_gray(rgba: np.ndarray) -> np.ndarray:
    a = rgba[:, :, 3:4].astype(np.float32) / 255.0
    rgb = rgba[:, :, :3].astype(np.float32) * a + 127.0 * (1.0 - a)
    return cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY)


def warp(image: np.ndarray, flow: np.ndarray, amount: float) -> np.ndarray:
    h, w = flow.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    # 도착 쪽에서 원본을 읽는 역방향 근사. 양쪽 결과를 섞어 가려짐 오류를 줄인다.
    mx = gx - flow[:, :, 0] * amount
    my = gy - flow[:, :, 1] * amount
    return cv2.remap(image, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def inbetweens(a: np.ndarray, b: np.ndarray) -> list[np.ndarray]:
    ga, gb = composite_gray(a), composite_gray(b)
    fwd = cv2.calcOpticalFlowFarneback(ga, gb, None, 0.5, 5, 25, 4, 7, 1.5, 0)
    back = cv2.calcOpticalFlowFarneback(gb, ga, None, 0.5, 5, 25, 4, 7, 1.5, 0)
    out = []
    for step in range(7):
        t = step / 7.0
        if step == 0:
            frame = a.copy()
        else:
            wa = warp(a, fwd, t).astype(np.float32)
            wb = warp(b, back, 1.0 - t).astype(np.float32)
            frame = np.clip(wa * (1.0 - t) + wb * t, 0, 255).astype(np.uint8)
            # 작은 보간 찌꺼기를 없애되 옷자락·검끝은 몸 가까이에 있으면 보존한다.
            mask = largest_nearby(frame[:, :, 3] > 10)
            frame[:, :, 3] = np.where(mask, frame[:, :, 3], 0)
        out.append(frame)
    return out


def align_footline(frames: list[np.ndarray]) -> list[np.ndarray]:
    """보간으로 생긴 몇 픽셀의 상하 표류를 없애 발밑 피벗을 고정한다."""
    aligned = []
    for frame in frames:
        ys = np.nonzero(frame[:, :, 3] > 40)[0]
        if not len(ys):
            aligned.append(frame)
            continue
        dy = PIVOT_Y - int(ys.max())
        out = np.zeros_like(frame)
        if dy >= 0:
            out[dy:] = frame[: CELL_H - dy]
        else:
            out[:dy] = frame[-dy:]
        aligned.append(out)
    return aligned


def save_outputs(frames: list[np.ndarray], output: Path, game: Path) -> dict:
    if len(frames) != FRAMES:
        raise ValueError(f"프레임 수 {len(frames)} != {FRAMES}")
    output.mkdir(parents=True, exist_ok=True)
    master = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    strips = []
    for row in range(ROWS):
        strip = Image.new("RGBA", (CELL_W * COLS, CELL_H), (0, 0, 0, 0))
        for col in range(COLS):
            i = row * COLS + col
            frame = Image.fromarray(frames[i], "RGBA")
            strip.alpha_composite(frame, (col * CELL_W, 0))
            master.alpha_composite(frame, (col * CELL_W, row * CELL_H))
        path = output / f"walk_{row + 1:02d}_frames_{row * 7 + 1:02d}-{row * 7 + 7:02d}.png"
        strip.save(path, compress_level=6)
        strips.append(str(path))
    master_path = output / "walk_master_7x7.png"
    master.save(master_path, compress_level=6)
    game.parent.mkdir(parents=True, exist_ok=True)
    master.save(game, "WEBP", lossless=True, method=6)
    return {"master": str(master_path), "strips": strips, "game": str(game)}


def validate(frames: list[np.ndarray]) -> dict:
    boxes = []
    edge = []
    feet = []
    for i, frame in enumerate(frames):
        a = frame[:, :, 3]
        ys, xs = np.nonzero(a > 40)
        if not len(xs):
            raise ValueError(f"빈 프레임 {i + 1}")
        box = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
        boxes.append(box)
        feet.append(box[3] - 1)
        if box[0] <= 1 or box[1] <= 1 or box[2] >= CELL_W - 1 or box[3] >= CELL_H - 1:
            edge.append(i + 1)
    diffs = [float(np.mean(np.abs(frames[(i + 1) % FRAMES].astype(np.int16) - frames[i].astype(np.int16)))) for i in range(FRAMES)]
    if edge:
        raise ValueError(f"셀 가장자리 접촉: {edge}")
    return {
        "frames": FRAMES,
        "cell": [CELL_W, CELL_H],
        "pivot": [PIVOT_X, PIVOT_Y],
        "edge_touches": edge,
        "footline_min": min(feet),
        "footline_max": max(feet),
        "consecutive_mean_delta_min": round(min(diffs), 3),
        "consecutive_mean_delta_max": round(max(diffs), 3),
        "loop_delta": round(diffs[-1], 3),
        "alpha_corner": int(frames[0][0, 0, 3]),
        "boxes": boxes,
    }


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    ap = argparse.ArgumentParser()
    ap.add_argument("keys", nargs=7, type=Path, help="보행 순서의 핵심 자세 PNG 7장")
    ap.add_argument("--output", type=Path, default=root / "artifacts" / "player-motion-sheets" / "navigator_white" / "walk49")
    ap.add_argument("--game", type=Path, default=root / "images" / "characters" / "navigator_white" / "motion" / "walk.webp")
    args = ap.parse_args()

    keys = [cutout(p) for p in args.keys]
    normalized = normalize(keys)
    frames = []
    for i in range(7):
        frames.extend(inbetweens(normalized[i], normalized[(i + 1) % 7]))
    frames = align_footline(frames)
    report = validate(frames)
    report.update(save_outputs(frames, args.output, args.game))
    report_path = args.output / "walk49_report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("frames", "cell", "pivot", "edge_touches", "footline_min", "footline_max", "loop_delta")}, ensure_ascii=False))
    print(report_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
