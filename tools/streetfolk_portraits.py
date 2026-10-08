#!/usr/bin/env python3
"""문화권별 정면 시트를 거리 보행 NPC의 투명 대화 초상으로 분할한다.

각 시트는 4×4이며 앞의 13칸이 거리 스프라이트 역할 순서와 정확히 대응한다.
최종 얼굴·무릎상은 GrabCut으로 배경을 제거한 RGBA WebP다.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp" / "street-front-sheets"
TARGET = ROOT / "images" / "portraits" / "street-folk"

STYLES = ("ib", "ne", "it", "gr", "ru", "is", "pe", "af", "sw", "in",
          "se", "cn", "kr", "jp", "az", "an", "co", "tr", "st", "na")
ROLES = ("town_man", "town_woman", "boy", "girl", "elder", "grandmother",
         "librarian", "innkeeper", "adventurer", "merchant", "noble_youth",
         "soldier", "navigator")
CELL_W, CELL_H = 256, 384


def isolate(tile: Image.Image) -> Image.Image:
    """균일한 갈색 시트 배경을 제거하고 인물과 소품만 남긴다."""
    rgb = np.asarray(tile.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]

    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    mask[:4, :] = cv2.GC_BGD
    mask[-4:, :] = cv2.GC_BGD
    mask[:, :4] = cv2.GC_BGD
    mask[:, -4:] = cv2.GC_BGD

    # 모든 생성 시트에서 얼굴과 몸통의 중심은 이 축을 지난다. 확실한 전경 표본만
    # 작은 타원으로 주어 갈색 옷도 배경으로 지워지지 않게 한다.
    for cy, rx, ry in ((62, 18, 24), (168, 22, 42), (275, 20, 50)):
        cv2.ellipse(mask, (w // 2, cy), (rx, ry), 0, 0, 360, cv2.GC_FGD, -1)

    bg_model = np.zeros((1, 65), np.float64)
    fg_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bg_model, fg_model, 6, cv2.GC_INIT_WITH_MASK)
    foreground = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # 인물 중심과 이어진 가장 큰 덩어리를 기준으로 잡되, 창·지팡이처럼 가늘고
    # 살짝 떨어진 소품도 가까우면 유지한다.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(foreground, 8)
    if count > 1:
        center_label = labels[min(80, h - 1), w // 2]
        if center_label == 0:
            center_label = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        keep = labels == center_label
        main = stats[center_label]
        x0 = max(0, main[cv2.CC_STAT_LEFT] - 20)
        y0 = max(0, main[cv2.CC_STAT_TOP] - 20)
        x1 = min(w, x0 + main[cv2.CC_STAT_WIDTH] + 40)
        y1 = min(h, y0 + main[cv2.CC_STAT_HEIGHT] + 40)
        for label in range(1, count):
            if label == center_label or stats[label, cv2.CC_STAT_AREA] < 18:
                continue
            sx, sy, sw, sh = stats[label, :4]
            if sx < x1 and sx + sw > x0 and sy < y1 and sy + sh > y0:
                keep |= labels == label
        foreground = (keep.astype(np.uint8) * 255)

    foreground = cv2.morphologyEx(foreground, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(foreground, (0, 0), 0.8)
    rgba = np.dstack((rgb, alpha))
    return Image.fromarray(rgba, "RGBA")


def write_pair(sheet: Image.Image, index: int, role: str, style: str) -> None:
    col, row = index % 4, index // 4
    # 한 픽셀짜리 칸 구분선은 원본에서 제외한다.
    box = (col * CELL_W + 2, row * CELL_H + 2,
           (col + 1) * CELL_W - 2, (row + 1) * CELL_H - 2)
    person = isolate(sheet.crop(box))

    half = person.resize((768, 1152), Image.Resampling.LANCZOS)
    # 머리와 어깨 중심의 정사각형 얼굴 자산. 배경 알파는 그대로 유지한다.
    face = person.crop((22, 0, 230, 208)).resize((512, 512), Image.Resampling.LANCZOS)

    face.save(TARGET / f"{role}_{style}.webp", "WEBP", quality=93, method=4, exact=True)
    half.save(TARGET / f"{role}_{style}_half.webp", "WEBP", quality=93, method=4, exact=True)


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    made = 0
    for style in STYLES:
        with Image.open(SOURCE / f"{style}.png") as raw:
            sheet = raw.convert("RGB")
        if sheet.size != (1024, 1536):
            raise ValueError(f"{style}: 예상 시트 크기 1024×1536, 실제 {sheet.size}")
        for index, role in enumerate(ROLES):
            write_pair(sheet, index, role, style)
            made += 2
    print(f"거리 NPC {len(STYLES) * len(ROLES)}명: 투명 정면 얼굴·무릎상 {made}장 → {TARGET}")


if __name__ == "__main__":
    main()
