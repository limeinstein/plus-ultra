#!/usr/bin/env python3
"""문화권별 정면 시트를 거리 보행 NPC의 투명 대화 초상으로 분할한다.

각 시트는 4×4이며 앞의 13칸이 거리 스프라이트 역할 순서와 정확히 대응한다.
최종 얼굴·무릎상은 인물 분리 모델로 배경을 제거한 RGBA WebP다.
"""
from pathlib import Path

from PIL import Image
from rembg import new_session, remove


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp" / "street-front-sheets"
TARGET = ROOT / "images" / "portraits" / "street-folk"

STYLES = ("ib", "ne", "it", "gr", "ru", "is", "pe", "af", "sw", "in",
          "se", "cn", "kr", "jp", "az", "an", "co", "tr", "st", "na")
ROLES = ("town_man", "town_woman", "boy", "girl", "elder", "grandmother",
         "librarian", "innkeeper", "adventurer", "merchant", "noble_youth",
         "soldier", "navigator")
CELL_W, CELL_H = 256, 384


def isolate(tile: Image.Image, session) -> Image.Image:
    """갈색 시트 배경을 사람 전용 분리 모델로 제거한다."""
    result = remove(tile.convert("RGB"), session=session,
                    alpha_matting=False, post_process_mask=True)
    return result.convert("RGBA")


def write_pair(sheet: Image.Image, index: int, role: str, style: str, session) -> None:
    col, row = index % 4, index // 4
    # 한 픽셀짜리 칸 구분선은 원본에서 제외한다.
    box = (col * CELL_W + 2, row * CELL_H + 2,
           (col + 1) * CELL_W - 2, (row + 1) * CELL_H - 2)
    person = isolate(sheet.crop(box), session)

    half = person.resize((768, 1152), Image.Resampling.LANCZOS)
    # 머리와 어깨 중심의 정사각형 얼굴 자산. 배경 알파는 그대로 유지한다.
    face = person.crop((22, 0, 230, 208)).resize((512, 512), Image.Resampling.LANCZOS)

    face.save(TARGET / f"{role}_{style}.webp", "WEBP", quality=93, method=4, exact=True)
    half.save(TARGET / f"{role}_{style}_half.webp", "WEBP", quality=93, method=4, exact=True)


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    session = new_session("u2net_human_seg")
    made = 0
    for style in STYLES:
        with Image.open(SOURCE / f"{style}.png") as raw:
            sheet = raw.convert("RGB")
        if sheet.size != (1024, 1536):
            raise ValueError(f"{style}: 예상 시트 크기 1024×1536, 실제 {sheet.size}")
        for index, role in enumerate(ROLES):
            write_pair(sheet, index, role, style, session)
            made += 2
    for style in STYLES:
        for role in ROLES:
            for suffix in ("", "_half"):
                path = TARGET / f"{role}_{style}{suffix}.webp"
                with Image.open(path) as image:
                    alpha = image.convert("RGBA").getchannel("A")
                    if alpha.getextrema() != (0, 255):
                        raise ValueError(f"{path.name}: 완전 투명 배경 또는 완전 불투명 인물이 없습니다")
                    transparent = alpha.histogram()[:6]
                    if sum(transparent) < alpha.width * alpha.height * .05:
                        raise ValueError(f"{path.name}: 투명 배경 영역이 너무 적습니다")
    print(f"거리 NPC {len(STYLES) * len(ROLES)}명: 투명 정면 얼굴·무릎상 {made}장 → {TARGET}")


if __name__ == "__main__":
    main()
