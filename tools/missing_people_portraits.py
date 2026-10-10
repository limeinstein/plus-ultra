#!/usr/bin/env python3
"""빠진 전용 항해사 6명과 얼굴 묶음의 무릎상을 게임 규격으로 만든다.

전용 항해사는 ImageGen 원본에서 배경을 걷어 내고 같은 그림에서 얼굴상을
잘라 낸다. 얼굴 묶음은 기존 512px 흉상을 지역별 무릎상 몸에 이어 붙여
얼굴과 서 있는 모습이 같은 사람으로 보이게 한다.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images" / "portraits"
SOURCES = ROOT / ".work" / "missing_people" / "generated"
NAMED = ("marina", "bokuden", "chen", "kim", "tupac", "kisk")
NATIONS = ("pt", "es", "fr", "de", "en", "nl", "na", "kr", "cn", "jp",
           "ot", "af", "az", "inca", "vn", "eg", "pe", "ind", "se")
STYLE = {
    "pt": "ib", "es": "ib", "fr": "ne", "de": "ne", "en": "ne", "nl": "ne",
    "na": "na", "kr": "kr", "cn": "cn", "jp": "jp", "ot": "tr", "af": "af",
    "az": "az", "inca": "an", "vn": "se", "eg": "is", "pe": "pe", "ind": "in", "se": "se",
}


def largest_component(mask: np.ndarray) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if count <= 1:
        return mask.astype(np.uint8)
    index = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    return (labels == index).astype(np.uint8)


def cutout(path: Path) -> Image.Image:
    """어두운 단색 배경의 생성 그림을 GrabCut으로 투명 인물로 만든다."""
    # OpenCV의 Windows imread는 한글 경로를 읽지 못하므로 바이트로 연다.
    bgr = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)
    if bgr is None:
        raise FileNotFoundError(path)
    full_height, full_width = bgr.shape[:2]
    # GrabCut은 절반 크기에서 계산해 6장을 빠르게 처리하고 알파만 원본 크기로 되돌린다.
    bgr_work = cv2.resize(bgr, (full_width // 2, full_height // 2), interpolation=cv2.INTER_AREA)
    height, width = bgr_work.shape[:2]
    mask = np.full((height, width), cv2.GC_PR_BGD, np.uint8)
    border = max(4, min(width, height) // 180)
    mask[:border, :] = cv2.GC_BGD
    mask[-border:, :] = cv2.GC_BGD
    mask[:, :border] = cv2.GC_BGD
    mask[:, -border:] = cv2.GC_BGD
    # 얼굴과 몸통의 중심은 확실한 전경으로 주어 어두운 옷도 배경에 먹히지 않게 한다.
    cv2.ellipse(mask, (width // 2, int(height * .28)), (int(width * .20), int(height * .25)), 0, 0, 360, cv2.GC_FGD, -1)
    cv2.rectangle(mask, (int(width * .32), int(height * .35)), (int(width * .68), int(height * .88)), cv2.GC_PR_FGD, -1)
    bg_model = np.zeros((1, 65), np.float64)
    fg_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr_work, mask, None, bg_model, fg_model, 4, cv2.GC_INIT_WITH_MASK)
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    alpha = largest_component(alpha)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=2)
    alpha = cv2.GaussianBlur(alpha * 255, (0, 0), 1.15)
    alpha = cv2.resize(alpha, (full_width, full_height), interpolation=cv2.INTER_CUBIC)
    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba)


def alpha_bounds(image: Image.Image, cutoff: int = 12) -> tuple[int, int, int, int]:
    return image.getchannel("A").point(lambda a: 255 if a > cutoff else 0).getbbox() or (0, 0, image.width, image.height)


def named_assets() -> None:
    target = IMAGES / "mates"
    target.mkdir(parents=True, exist_ok=True)
    for name in NAMED:
        subject = cutout(SOURCES / f"{name}.png")
        subject = subject.resize((1024, 1536), Image.Resampling.LANCZOS)
        subject.save(target / f"{name}_half.webp", "WEBP", quality=92, method=6, exact=True)

        x0, y0, x1, y1 = alpha_bounds(subject)
        cx = (x0 + x1) // 2
        side = min(900, subject.width, subject.height)
        top = max(0, y0 - 16)
        left = max(0, min(subject.width - side, cx - side // 2))
        crop = subject.crop((left, top, left + side, top + side)).resize((512, 512), Image.Resampling.LANCZOS)
        crop.save(target / f"{name}.webp", "WEBP", quality=92, method=6, exact=True)


def opaque_mean(image: Image.Image, box: tuple[int, int, int, int]) -> np.ndarray:
    crop = image.crop(box).convert("RGBA")
    arr = np.asarray(crop, dtype=np.float32)
    good = arr[:, :, 3] > 96
    if not np.any(good):
        return np.array([128, 128, 128], dtype=np.float32)
    return np.median(arr[:, :, :3][good], axis=0)


def harmonize(template: Image.Image, bust: Image.Image) -> Image.Image:
    """몸통 천의 전체 색을 흉상 옷 빛에 살짝 맞추되 피부색은 크게 흔들지 않는다."""
    src = opaque_mean(template, (180, 700, 844, 1260))
    dst = opaque_mean(bust, (40, 330, 472, 510))
    shift = np.clip((dst - src) * .28, -24, 24)
    arr = np.asarray(template.convert("RGBA"), dtype=np.int16).copy()
    alpha = arr[:, :, 3]
    cloth = (alpha > 24) & (np.max(arr[:, :, :3], axis=2) - np.min(arr[:, :, :3], axis=2) > 12)
    arr[:, :, :3][cloth] = np.clip(arr[:, :, :3][cloth] + shift.astype(np.int16), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def pool_half(bust_path: Path, template_path: Path, target: Path) -> None:
    bust = Image.open(bust_path).convert("RGBA")
    template = Image.open(template_path).convert("RGBA").resize((1024, 1536), Image.Resampling.LANCZOS)
    template = harmonize(template, bust)

    # 지역별 몸은 어깨 아래부터만 쓴다. 원래 몸의 머리/얼굴은 완전히 숨긴다.
    ta = np.asarray(template.getchannel("A"), dtype=np.float32)
    fade = np.clip((np.arange(1536, dtype=np.float32) - 320) / 200, 0, 1)[:, None]
    template.putalpha(Image.fromarray(np.uint8(ta * fade), "L"))

    # 흉상은 얼굴과 윗가슴까지만 살리고, 아래쪽 손·소품은 몸체로 넘어가기 전에 없앤다.
    bust = bust.resize((720, 720), Image.Resampling.LANCZOS)
    ba = np.asarray(bust.getchannel("A"), dtype=np.float32)
    fade_out = np.clip((520 - np.arange(720, dtype=np.float32)) / 190, 0, 1)[:, None]
    # 원본 흉상의 좌우 어깨가 정사각형 경계에서 잘린 흔적도 아래쪽으로 갈수록 없앤다.
    side = np.minimum(np.arange(720), np.arange(720)[::-1]).astype(np.float32)
    side = np.clip(side / 90, 0, 1)[None, :]
    side_weight = np.clip((np.arange(720, dtype=np.float32) - 270) / 170, 0, 1)[:, None]
    side_fade = 1 - side_weight * (1 - side)
    bust.putalpha(Image.fromarray(np.uint8(ba * fade_out * side_fade), "L"))

    canvas = Image.new("RGBA", (1024, 1536), (0, 0, 0, 0))
    canvas.alpha_composite(template)
    canvas.alpha_composite(bust, ((1024 - bust.width) // 2, 0))
    # 760장을 반복 저장하므로 시각 차이가 거의 없는 빠른 WebP 설정을 쓴다.
    canvas.save(target, "WEBP", quality=84, method=2, exact=True)


def pool_assets(force: bool = False) -> None:
    def ready(path: Path) -> bool:
        if not path.is_file():
            return False
        try:
            with Image.open(path) as image:
                image.verify()
            return True
        except Exception:
            return False

    jobs = []
    for kind in ("mates", "sponsors"):
        for nation in NATIONS:
            style = STYLE[nation]
            for gender in ("f", "m"):
                role = "maid" if gender == "f" else ("captain" if kind == "mates" else "king")
                template = IMAGES / "npc-roles" / style / f"{role}_half.webp"
                if not template.is_file() and gender == "m":
                    template = IMAGES / "npc-roles" / style / "sailor_half.webp"
                for index in range(1, 11):
                    base = IMAGES / "pools" / kind / nation / gender / f"{index:02d}.webp"
                    target = base.with_name(base.stem + "_half.webp")
                    if force or not ready(target):
                        jobs.append((base, template, target))
    # WebP 압축과 이미지 크기 조절은 서로 독립적이고 GIL 밖에서 돌아가므로 병렬 처리한다.
    with ThreadPoolExecutor(max_workers=6) as executor:
        list(executor.map(lambda job: pool_half(*job), jobs))


def check() -> None:
    paths = []
    paths += [IMAGES / "mates" / f"{n}{suffix}.webp" for n in NAMED for suffix in ("", "_half")]
    paths += [IMAGES / "pools" / k / n / g / f"{i:02d}_half.webp"
              for k in ("mates", "sponsors") for n in NATIONS for g in ("f", "m") for i in range(1, 11)]
    bad = []
    for path in paths:
        if not path.is_file():
            bad.append(f"없음: {path}")
            continue
        with Image.open(path) as image:
            expected = (1024, 1536) if "_half" in path.stem else (512, 512)
            rgba = image.convert("RGBA")
            if image.size != expected or rgba.getchannel("A").getextrema()[0] != 0:
                bad.append(f"규격: {path} {image.size} alpha={rgba.getchannel('A').getextrema()}")
    if bad:
        raise SystemExit("\n".join(bad))
    print(f"전용 항해사 12장 + 얼굴 묶음 무릎상 {len(paths) - 12}장: 규격·투명 배경 정상")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("named", "pools", "all", "check"), default="all", nargs="?")
    parser.add_argument("--force", action="store_true", help="이미 만든 얼굴 묶음 무릎상도 다시 만든다")
    args = parser.parse_args()
    if args.command in ("named", "all"):
        named_assets()
    if args.command in ("pools", "all"):
        pool_assets(args.force)
    check()


if __name__ == "__main__":
    main()
