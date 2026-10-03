#!/usr/bin/env python3
"""신규 제독 일기토 원본을 게임용 6×4 시트로 다시 배치한다.

ImageGen 원본의 인물이 256px 안내 칸을 조금 넘어가더라도, 알파 채널에서
각 포즈의 연결된 실루엣을 찾아 온몸을 잘라낸 뒤 432×304 게임 칸에 넣는다.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "art_sources" / "player_duels"
OUT = ROOT / "images" / "duel" / "fighters"
SRC_CELL = 256
DST_CELL, DST_PIVOT = (432, 304), (165, 278)
USED = {0: 6, 1: 4, 2: 3, 3: 6}
ALPHA_CUT = 32
MARGIN = 6


def nearest_ink(mask, anchor, limit=160):
    """기준점이 빈 곳이면 가장 가까운 실루엣 픽셀을 찾는다."""
    px = mask.load()
    width, height = mask.size
    ax, ay = anchor
    if 0 <= ax < width and 0 <= ay < height and px[ax, ay]:
        return anchor
    for radius in range(1, limit + 1):
        x0, x1 = max(0, ax - radius), min(width - 1, ax + radius)
        y0, y1 = max(0, ay - radius), min(height - 1, ay + radius)
        for x in range(x0, x1 + 1):
            if px[x, y0]:
                return x, y0
            if px[x, y1]:
                return x, y1
        for y in range(y0 + 1, y1):
            if px[x0, y]:
                return x0, y
            if px[x1, y]:
                return x1, y
    raise ValueError(f"기준점 {anchor} 주변에서 포즈를 찾지 못했습니다")


def pose_image(source, silhouette, anchor):
    """anchor가 속한 연결 성분만 원본 RGBA로 반환한다."""
    seed = nearest_ink(silhouette, anchor)
    flooded = silhouette.copy()
    ImageDraw.floodfill(flooded, seed, 128, thresh=0)
    component = flooded.point(lambda v: 255 if v == 128 else 0)
    bbox = component.getbbox()
    if not bbox:
        raise ValueError(f"기준점 {anchor}의 포즈가 비었습니다")
    pose = source.crop(bbox)
    alpha = ImageChops.multiply(pose.getchannel("A"), component.crop(bbox))
    pose.putalpha(alpha)
    return pose


def fit_pose(pose):
    """전투 칸 안에 온몸을 보존하고, 발 중앙을 피벗으로 삼는다."""
    width, height = pose.size
    max_width = DST_CELL[0] - MARGIN * 2
    max_height = DST_PIVOT[1] - MARGIN
    scale = min(1.0, max_width / width, max_height / height)
    if scale < 1.0:
        pose = pose.resize((max(1, round(width * scale)), max(1, round(height * scale))), Image.Resampling.LANCZOS)
        width, height = pose.size

    alpha = pose.getchannel("A")
    foot_band = alpha.crop((0, max(0, height - 24), width, height))
    foot_bbox = foot_band.getbbox()
    foot_x = width // 2 if not foot_bbox else (foot_bbox[0] + foot_bbox[2]) // 2
    return pose, foot_x


def repack(path):
    with Image.open(path) as raw:
        source = raw.convert("RGBA")
    if source.size != (1536, 1024):
        raise ValueError(f"{path.name}: 원본은 1536×1024여야 합니다")

    silhouette = source.getchannel("A").point(lambda v: 255 if v > ALPHA_CUT else 0)
    out = Image.new("RGBA", (DST_CELL[0] * 6, DST_CELL[1] * 4), (0, 0, 0, 0))
    for row, count in USED.items():
        for col in range(count):
            anchor = (col * SRC_CELL + SRC_CELL // 2, row * SRC_CELL + SRC_CELL // 2)
            pose, foot_x = fit_pose(pose_image(source, silhouette, anchor))
            cell_x, cell_y = col * DST_CELL[0], row * DST_CELL[1]
            dx = cell_x + DST_PIVOT[0] - foot_x
            dx = max(cell_x + MARGIN, min(dx, cell_x + DST_CELL[0] - MARGIN - pose.width))
            dy = cell_y + DST_PIVOT[1] - pose.height
            out.alpha_composite(pose, (dx, dy))

    target = OUT / path.name
    out.save(target, "PNG", optimize=True)
    print(f"{path.name}: 포즈 19개 → {out.width}×{out.height}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for path in sorted(SRC.glob("*.png")):
        repack(path)


if __name__ == "__main__":
    main()
