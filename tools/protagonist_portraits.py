#!/usr/bin/env python3
"""이름이 정해진 주인공 원본에서 게임용 얼굴·무릎상을 만든다.

원본은 ``images/_extra/protagonists/<ID>.png``에 둔다. 각 파일은
1024×1536 투명 PNG이며 머리부터 무릎까지만 담는다. 실행 결과:

* ``images/portraits/player/<ID>.png`` — 만들기·대화창 얼굴 512×512
* ``images/characters/player_half_<ID>.png`` — 수첩 무릎상 512×512
* ``docs/art/protagonists-preview.jpg`` — 16명 점검판

얼굴은 저장소에 포함된 YuNet 얼굴 찾기 모델로 잡고, 얼굴 찾기에 실패하면
투명 실루엣의 위쪽을 기준으로 자른다.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

try:
    import cv2
    import numpy as np
except ImportError:  # 얼굴 찾기 패키지가 없는 환경에서는 투명 실루엣으로 자른다.
    cv2 = None
    np = None


ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "images"
SOURCE = IMG / "_extra" / "protagonists"
MODEL = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"
SIZE = 512
LOOKS = (
    ("leonardo_de_valenca", "레오나르두 드 발렌사"),
    ("duarte_de_valenca", "두아르트 드 발렌사"),
    ("ines_de_valcarcel", "이네스 데 발카르셀"),
    ("edmund_ashford", "에드먼드 애쉬퍼드"),
    ("matteo_bellandi", "마테오 벨란디"),
    ("laurens_van_der_velder", "로렌스 판 데르 펠더"),
    ("alessio_giorgi", "알레시오 조르지"),
    ("martim_de_sequeira", "마르팀 드 세케이라"),
    ("hernando_de_montemayor", "에르난도 데 몬테마요르"),
    ("gabriel_de_avelar", "가브리엘 드 아벨라르"),
    ("lisbeth_van_acker", "리스베트 판 아커르"),
    ("henrik_stensson", "헨리크 스텐손"),
    ("vittoria_contarini", "비토리아 콘타리니"),
    ("konrad_von_falkenstein", "콘라트 폰 팔켄슈타인"),
    ("adrien_de_montclair", "아드리앵 드 몽클레르"),
    ("katrin_de_kermor", "카트린 드 케르모르"),
)


def alpha_bounds(image: Image.Image, cutoff: int = 12) -> tuple[int, int, int, int]:
    box = image.getchannel("A").point(lambda value: 255 if value > cutoff else 0).getbbox()
    if not box:
        raise ValueError("불투명한 인물이 없습니다")
    return box


def square_fit(image: Image.Image, pad: int = 10) -> Image.Image:
    """머리~무릎 실루엣 전체를 512 정사각형 아래쪽에 맞춘다."""
    subject = image.crop(alpha_bounds(image))
    limit = SIZE - pad * 2
    scale = min(limit / subject.width, limit / subject.height)
    dims = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(dims, Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    result.alpha_composite(subject, ((SIZE - dims[0]) // 2, SIZE - pad - dims[1]))
    return result


def detect_face(image: Image.Image) -> tuple[float, float, float, float] | None:
    if cv2 is None or np is None or not MODEL.is_file():
        return None
    background = Image.new("RGBA", image.size, (112, 112, 112, 255))
    background.alpha_composite(image)
    rgb = np.asarray(background.convert("RGB"))
    scale = min(1.0, 960 / max(image.size))
    small = cv2.resize(rgb, (round(image.width * scale), round(image.height * scale)))
    bgr = cv2.cvtColor(small, cv2.COLOR_RGB2BGR)
    detector = cv2.FaceDetectorYN.create(str(MODEL), "", (bgr.shape[1], bgr.shape[0]), 0.55, 0.3, 50)
    _, faces = detector.detect(bgr)
    if faces is None:
        return None
    # 위쪽에 있고 신뢰도가 높은 얼굴을 고른다. 소품의 원형 무늬 오탐을 피한다.
    face = sorted(faces, key=lambda row: -(row[14] - 0.25 * row[1] / bgr.shape[0]))[0]
    x, y, width, height = face[:4] / scale
    return float(x), float(y), float(width), float(height)


def face_square(image: Image.Image) -> Image.Image:
    face = detect_face(image)
    if face:
        x, y, width, height = face
        side = max(width * 2.65, height * 2.05)
        center_x = x + width / 2
        top = y - height * 0.48
    else:
        x0, y0, x1, y1 = alpha_bounds(image)
        width, height = x1 - x0, y1 - y0
        side = min(width * 0.82, height * 0.52)
        center_x = (x0 + x1) / 2
        top = y0
    left = center_x - side / 2
    # 캔버스 밖은 투명 여백으로 남긴다.
    canvas = Image.new("RGBA", (round(side), round(side)), (0, 0, 0, 0))
    box = (round(left), round(top), round(left + side), round(top + side))
    sx0, sy0 = max(0, box[0]), max(0, box[1])
    sx1, sy1 = min(image.width, box[2]), min(image.height, box[3])
    if sx1 > sx0 and sy1 > sy0:
        canvas.alpha_composite(image.crop((sx0, sy0, sx1, sy1)), (sx0 - box[0], sy0 - box[1]))
    return canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def font(size: int) -> ImageFont.ImageFont:
    for path in (
        Path("C:/Windows/Fonts/malgun.ttf"),
        Path("C:/Windows/Fonts/NanumGothic.ttf"),
    ):
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def build_preview(halves: list[tuple[str, str, Image.Image]]) -> None:
    cell_w, cell_h, label_h = 300, 360, 42
    sheet = Image.new("RGB", (cell_w * 4, (cell_h + label_h) * 4), "#15120f")
    draw = ImageDraw.Draw(sheet)
    label_font = font(20)
    for index, (_, name, portrait) in enumerate(halves):
        col, row = index % 4, index // 4
        x, y = col * cell_w, row * (cell_h + label_h)
        backdrop = Image.new("RGBA", (cell_w, cell_h), (39, 29, 25, 255))
        display = portrait.copy()
        display.thumbnail((cell_w - 16, cell_h - 8), Image.Resampling.LANCZOS)
        backdrop.alpha_composite(display, ((cell_w - display.width) // 2, cell_h - display.height))
        sheet.paste(backdrop.convert("RGB"), (x, y))
        bounds = draw.textbbox((0, 0), name, font=label_font)
        tw = bounds[2] - bounds[0]
        draw.text((x + (cell_w - tw) / 2, y + cell_h + 8), name, fill="#ead7ac", font=label_font)
    output = ROOT / "docs" / "art" / "protagonists-preview.jpg"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "JPEG", quality=90, optimize=True)


def build_face_preview(faces: list[tuple[str, str, Image.Image]]) -> None:
    cell, label_h = 256, 40
    sheet = Image.new("RGB", (cell * 4, (cell + label_h) * 4), "#15120f")
    draw = ImageDraw.Draw(sheet)
    label_font = font(18)
    for index, (_, name, portrait) in enumerate(faces):
        col, row = index % 4, index // 4
        x, y = col * cell, row * (cell + label_h)
        backdrop = Image.new("RGBA", (cell, cell), (39, 29, 25, 255))
        backdrop.alpha_composite(portrait.resize((cell, cell), Image.Resampling.LANCZOS))
        sheet.paste(backdrop.convert("RGB"), (x, y))
        bounds = draw.textbbox((0, 0), name, font=label_font)
        tw = bounds[2] - bounds[0]
        draw.text((x + (cell - tw) / 2, y + cell + 7), name, fill="#ead7ac", font=label_font)
    output = ROOT / "docs" / "art" / "protagonist-faces-preview.jpg"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "JPEG", quality=90, optimize=True)


def main() -> int:
    face_dir = IMG / "portraits" / "player"
    face_dir.mkdir(parents=True, exist_ok=True)
    halves = []
    faces = []
    for look, name in LOOKS:
        source = SOURCE / f"{look}.png"
        if not source.is_file():
            raise FileNotFoundError(f"원본이 없습니다: {source}")
        with Image.open(source) as opened:
            image = opened.convert("RGBA")
        if image.size != (1024, 1536):
            raise ValueError(f"크기 오류: {source} {image.size}")
        if image.getchannel("A").getextrema()[0] >= 250:
            raise ValueError(f"투명 배경이 아닙니다: {source}")
        face = face_square(image)
        half = square_fit(image)
        face.save(face_dir / f"{look}.png", optimize=True)
        half.save(IMG / "characters" / f"player_half_{look}.png", optimize=True)
        halves.append((look, name, half))
        faces.append((look, name, face))
        print(f"{name}: 얼굴·무릎상")
    build_preview(halves)
    build_face_preview(faces)
    print(f"점검판: {ROOT / 'docs' / 'art' / 'protagonists-preview.jpg'}")
    print(f"얼굴 점검판: {ROOT / 'docs' / 'art' / 'protagonist-faces-preview.jpg'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
