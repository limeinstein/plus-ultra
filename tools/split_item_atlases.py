"""생성한 아이템 그림판을 게임에서 쓰는 개별 WEBP 그림으로 나눈다.

원본 그림판은 images/_extra/item-src/에 두며, 이 폴더는 배포물에 들어가지 않는다.
각 칸의 투명 여백을 잘라 낸 뒤 같은 크기의 정사각형에 다시 맞춰 작은 화면에서도
물건 크기가 고르게 보이도록 한다.
"""
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "images" / "_extra" / "item-src"


GOODS = [
    ("goods-1.png", 4, 4, [
        "wheat", "rice", "maize", "beans", "potato", "fish", "beef", "dairy",
        "sugar", "honey", "salt", "olive", "palmoil", "wine", "brandy", "rum",
    ]),
    ("goods-2.png", 4, 4, [
        "beer", "pepper", "clove", "nutmeg", "cinnamon", "ginger", "allspice", "tea",
        "coffee", "cacao", "tobacco", "wool", "cotton", "silkraw", "hemp", "woolcloth",
    ]),
    ("goods-3.png", 4, 4, [
        "cottoncloth", "silk", "linen", "chintz", "carpet", "iron", "copper", "tin",
        "mercury", "coal", "gold", "silver", "gems", "pearl", "coral", "amber",
    ]),
    ("goods-4.png", 4, 4, [
        "jade", "ivory", "tortoise", "rhino", "fur", "ambergris", "frankincense", "musk",
        "sandalwood", "glass", "porcelain", "leathergoods", "jewelry", "art", "antique", "guns",
    ]),
    ("goods-5.png", 4, 4, ["cannon", "timber", "dye", "hides", "herbs", "horses"]),
]

ITEMS = [
    ("item-weapons.png", 4, 5, [
        "rapier", "longsword", "broadsword", "estoc", "bastard", "twohand", "flamberge", "saber",
        "shamshir", "katar", "firangi", "shotel", "kris", "guandao", "katana", "macuahuitl",
        "excalibur", "longinus",
    ]),
    ("item-armor-tools.png", 4, 4, [
        "leather", "chain", "brigandine", "scale", "breast", "plate", "lamellar", "samurai",
        "compass", "sextant", "astrolabe", "telescope", "turban", "lime", "cat", "charm",
    ]),
    ("item-gifts.png", 4, 4, [
        "ribbon", "perfume", "hairpin", "shawl", "pearlnk", "rose", "tears", "ring",
    ]),
    ("item-special.png", 4, 1, [
        "rapidgun", "shells", "divebomb", "dango",
    ]),
    # 잠입 변장 도구 (2026-10-05, 임시 그림 — docs/art/sneak_items_order.md)
    ("item-disguise.png", 1, 1, ["mingrobe"]),
]

RELICS = [
    ("relic-weapons.png", 4, 5, [
        "r_qinshi", "r_sacsay", "r_alhambra", "r_tutankh", "r_guanyublade", "excalibur",
        "r_minotaur", "r_troll", "r_aborigine", "r_inuit", "r_eyjafjalla", "r_barringer",
        "r_askia", "r_grandbazaar", "r_ruhr", "r_rushmore", "r_ubudiah",
    ]),
    ("relic-gifts.png", 4, 4, [
        "r_stonehenge", "r_troy", "r_muryeong", "r_sepulchre", "r_cibola", "r_tajmahal",
        "r_shwedagon", "r_tutankh2", "r_urcrown", "r_cloisonne", "r_sillacrown", "r_paradise",
        "r_sable", "r_ostrich", "r_padaung", "r_aztec",
    ]),
]


def sharpen_alpha(im):
    """생성 그림 가장자리의 아주 옅은 색 번짐을 눌러 투명 가장자리를 또렷하게 한다."""
    alpha = im.getchannel("A")
    lut = []
    for value in range(256):
        if value < 9:
            lut.append(0)
        else:
            lut.append(min(255, round(255 * ((value / 255) ** 1.16))))
    im.putalpha(alpha.point(lut))
    return im


def remove_edge_spill(im):
    """이웃 칸에서 넘어와 그림판 칸 경계에 붙은 작은 조각만 지운다."""
    alpha = np.asarray(im.getchannel("A"))
    mask = alpha > 7
    visible = int(mask.sum())
    if not visible:
        return im
    seen = np.zeros(mask.shape, dtype=bool)
    height, width = mask.shape
    starts = [(x, 0) for x in range(width)] + [(x, height - 1) for x in range(width)]
    starts += [(0, y) for y in range(1, height - 1)] + [(width - 1, y) for y in range(1, height - 1)]
    remove = np.zeros(mask.shape, dtype=bool)
    for sx, sy in starts:
        if not mask[sy, sx] or seen[sy, sx]:
            continue
        queue, pixels = deque([(sx, sy)]), []
        seen[sy, sx] = True
        while queue:
            x, y = queue.popleft(); pixels.append((x, y))
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; queue.append((nx, ny))
        if len(pixels) < max(80, visible * 0.12):
            for x, y in pixels:
                remove[y, x] = True
    if remove.any():
        # 가장자리의 반투명 한두 픽셀도 함께 없앤다.
        expanded = remove.copy()
        for _ in range(2):
            expanded[:-1, :] |= expanded[1:, :]
            expanded[1:, :] |= expanded[:-1, :]
            expanded[:, :-1] |= expanded[:, 1:]
            expanded[:, 1:] |= expanded[:, :-1]
        out = np.array(im)
        out[expanded, 3] = 0
        im = Image.fromarray(out, "RGBA")
    return im


def fit_icon(cell, out_path, size):
    """투명 물체 하나를 정사각형 아이콘 안에 같은 여백으로 맞춘다."""
    cell = sharpen_alpha(cell)
    bbox = cell.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"빈 그림입니다: {out_path.name}")
    cell = cell.crop(bbox)
    fit = size - round(size * 0.1)
    scale = min(fit / cell.width, fit / cell.height)
    cell = cell.resize((max(1, round(cell.width * scale)), max(1, round(cell.height * scale))), Image.Resampling.LANCZOS)
    icon = Image.new("RGBA", (size, size))
    icon.alpha_composite(cell, ((size - cell.width) // 2, (size - cell.height) // 2))
    icon.save(out_path, "WEBP", quality=92, method=4, exact=True)


def split_sheet(filename, cols, rows, names, out_dir, size):
    src = SRC / filename
    if not src.exists():
        raise FileNotFoundError(src)
    sheet = Image.open(src).convert("RGBA")
    out_dir.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(names):
        col, row = index % cols, index // cols
        left = round(sheet.width * col / cols)
        top = round(sheet.height * row / rows)
        right = round(sheet.width * (col + 1) / cols)
        bottom = round(sheet.height * (row + 1) / rows)
        cell = remove_edge_spill(sheet.crop((left, top, right, bottom)))
        fit_icon(cell, out_dir / f"{name}.webp", size)


def split_single_objects(filename, cols, rows, names, out_dir, size):
    """긴 무기가 칸을 넘어가도 이웃 무기와 섞이지 않게 연결된 물체별로 나눈다.

    칼날·손잡이는 한 덩어리로 이어져 있으므로 전체 그림판에서 윤곽을 먼저 찾고,
    각 윤곽의 중심이 놓인 칸에 배정한다. 고정 칸 자르기와 달리 비스듬한 장검의
    끝부분도 온전히 보존된다.
    """
    src = SRC / filename
    if not src.exists():
        raise FileNotFoundError(src)
    sheet = Image.open(src).convert("RGBA")
    rgba = np.array(sheet)
    mask = rgba[:, :, 3] > 7
    height, width = mask.shape
    seen = np.zeros(mask.shape, dtype=bool)
    labels = np.zeros(mask.shape, dtype=np.int16)
    groups = [[] for _ in range(cols * rows)]
    label = 0
    for sy in range(height):
        for sx in range(width):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            label += 1
            queue, pixels = deque([(sx, sy)]), []
            seen[sy, sx] = True
            total_x = total_y = 0
            while queue:
                x, y = queue.popleft()
                pixels.append((x, y)); total_x += x; total_y += y
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; queue.append((nx, ny))
            if len(pixels) < 24:  # 생성 과정의 외딴 반투명 점은 버린다.
                continue
            cx, cy = total_x / len(pixels), total_y / len(pixels)
            col = min(cols - 1, int(cx * cols / width))
            row = min(rows - 1, int(cy * rows / height))
            index = row * cols + col
            if index >= len(names):
                continue
            groups[index].append(label)
            for x, y in pixels:
                labels[y, x] = label
    out_dir.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(names):
        if not groups[index]:
            raise RuntimeError(f"물체를 찾지 못했습니다: {filename} #{index + 1} ({name})")
        keep = np.isin(labels, groups[index])
        isolated = rgba.copy()
        isolated[~keep, 3] = 0
        fit_icon(Image.fromarray(isolated, "RGBA"), out_dir / f"{name}.webp", size)


def main():
    for spec in GOODS:
        split_sheet(*spec, ROOT / "images" / "goods", 192)
    for spec in ITEMS:
        if spec[0] == "item-weapons.png":
            split_single_objects(*spec, ROOT / "images" / "items", 256)
        else:
            split_sheet(*spec, ROOT / "images" / "items", 256)
    for spec in RELICS:
        # 유물 무기도 긴 칼·창이 칸을 넘어 이웃 칸에 조각을 남기므로 물체별로 나눈다
        if spec[0] == "relic-weapons.png":
            split_single_objects(*spec, ROOT / "images" / "relics", 256)
        else:
            split_sheet(*spec, ROOT / "images" / "relics", 256)
    print(f"교역품 {sum(len(x[3]) for x in GOODS)}종, 일반 아이템 {sum(len(x[3]) for x in ITEMS)}종, 유물 {sum(len(x[3]) for x in RELICS)}종을 만들었습니다.")


if __name__ == "__main__":
    main()
