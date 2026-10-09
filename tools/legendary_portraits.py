#!/usr/bin/env python3
"""전설·역사 인물 원화에서 게임용 얼굴상과 무릎상을 만든다.

원본은 ``artifacts/legendary-portraits/<ID>.png``의 1024×1536 투명 PNG다.
실행 결과는 ``images/portraits/legendary`` 아래에 저장한다.

* ``<ID>.webp`` — 얼굴상 448×448
* ``<ID>_half.webp`` — 무릎상 1024×1536
* ``docs/art/legendary-portraits-preview.jpg`` — 무릎상 점검판
* ``docs/art/legendary-faces-preview.jpg`` — 얼굴상 점검판
"""
from __future__ import annotations

from math import ceil
from pathlib import Path
import shutil
import tempfile

from PIL import Image, ImageDraw, ImageFont

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts" / "legendary-portraits"
OUTPUT = ROOT / "images" / "portraits" / "legendary"
MODEL = ROOT / "tools" / "models" / "face_detection_yunet_2023mar.onnx"
FACE_SIZE = 448

LOOKS = (
    ("liu_bei", "유비", "삼국지"),
    ("guan_yu", "관우", "삼국지"),
    ("zhang_fei", "장비", "삼국지"),
    ("zhuge_liang", "제갈량", "삼국지"),
    ("zhao_yun", "조운", "삼국지"),
    ("cao_cao", "조조", "삼국지"),
    ("d_artagnan", "달타냥", "삼총사"),
    ("athos", "아토스", "삼총사"),
    ("porthos", "포르토스", "삼총사"),
    ("aramis", "아라미스", "삼총사"),
    ("monte_cristo", "몽테크리스토 백작", "유럽 문학"),
    ("luo_guanzhong", "나관중", "중국"),
    ("red_turban_commander", "홍건적 지휘관", "중국"),
    ("red_turban_archer", "홍건적 궁수", "중국"),
    ("red_turban_spearman", "홍건적 창병", "중국"),
    ("aladdin", "알라딘", "아라비안나이트"),
    ("ali_baba", "알리바바", "아라비안나이트"),
    ("scheherazade", "세헤라자드", "아라비안나이트"),
    ("sinbad", "신드바드", "아라비안나이트"),
    ("snow_white", "백설공주", "옛이야기"),
    ("cinderella", "신데렐라", "옛이야기"),
    ("little_mermaid_legs", "인어공주(다리)", "옛이야기"),
    ("sleeping_beauty", "잠자는 숲속의 공주", "옛이야기"),
    ("sim_cheong", "심청", "한국 설화"),
    ("chunhyang", "춘향", "한국 설화"),
    ("lee_mongryong", "이몽룡", "한국 설화"),
    ("janghwa", "장화", "한국 설화"),
    ("hongryeon", "홍련", "한국 설화"),
    ("dragon_king", "용왕", "한국 설화"),
    ("jeon_woochi", "전우치", "한국 설화"),
    ("hong_gildong", "홍길동", "한국 설화"),
    ("im_kkeokjeong", "임꺽정", "한국 설화"),
    ("im_lieutenant", "임꺽정 부장", "한국 설화"),
    ("im_scout", "임꺽정 정찰대", "한국 설화"),
    ("suppression_commander", "토벌대 지휘관", "한국 설화"),
    ("gwak_jaeu", "곽재우", "조선"),
    ("kim_simin", "김시민", "조선"),
    ("gwon_yul", "권율", "조선"),
    ("nongae", "논개", "조선"),
    ("samyeong_daesa", "사명대사", "조선"),
    ("kim_deokryeong", "김덕령", "조선"),
    ("sin_rip", "신립", "조선"),
    ("yi_gwal", "이괄", "조선"),
    ("shin_saimdang", "신사임당", "조선"),
    ("yi_i", "이이", "조선"),
    ("yi_hwang", "이황", "조선"),
    ("heo_nanseolheon", "허난설헌", "조선"),
    ("jang_huibin", "장희빈", "조선"),
    ("jang_noksu", "장녹수", "조선"),
    ("im_sahong", "임사홍", "조선"),
    ("seongjong", "성종", "조선"),
    ("yeonsangun", "연산군", "조선"),
    ("seonjo", "선조", "조선"),
    ("jo_gwangjo", "조광조", "조선"),
    ("sejong", "세종", "조선"),
    ("taejong", "태종", "조선"),
    ("sejo", "세조", "조선"),
    ("danjong", "단종", "조선"),
    ("konishi_yukinaga", "고니시 유키나가", "일본 전국시대"),
    ("toyotomi_hideyoshi", "도요토미 히데요시", "일본 전국시대"),
    ("oda_nobunaga", "오다 노부나가", "일본 전국시대"),
    ("tokugawa_ieyasu", "도쿠가와 이에야스", "일본 전국시대"),
    ("takeda_shingen", "다케다 신겐", "일본 전국시대"),
    ("uesugi_kenshin", "우에스기 겐신", "일본 전국시대"),
    ("date_masamune", "다테 마사무네", "일본 전국시대"),
    ("sanada_yukimura", "사나다 유키무라", "일본 전국시대"),
    ("ishida_mitsunari", "이시다 미쓰나리", "일본 전국시대"),
    ("kato_kiyomasa", "가토 기요마사", "일본 전국시대"),
    ("al_vezas", "알 베자스", "대항해시대"),
    ("sera_alto_salvaraz", "세라 알토스 살바라즈", "대항해시대"),
)


def alpha_bounds(image: Image.Image, cutoff: int = 12) -> tuple[int, int, int, int]:
    box = image.getchannel("A").point(lambda value: 255 if value > cutoff else 0).getbbox()
    if not box:
        raise ValueError("불투명한 인물이 없습니다")
    return box


def detect_face(image: Image.Image) -> tuple[float, float, float, float] | None:
    if cv2 is None or np is None or not MODEL.is_file():
        return None
    backdrop = Image.new("RGBA", image.size, (112, 112, 112, 255))
    backdrop.alpha_composite(image)
    rgb = np.asarray(backdrop.convert("RGB"))
    scale = min(1.0, 960 / max(image.size))
    small = cv2.resize(rgb, (round(image.width * scale), round(image.height * scale)))
    bgr = cv2.cvtColor(small, cv2.COLOR_RGB2BGR)
    # OpenCV의 Windows ONNX 읽기는 경로에 한글이 있으면 실패할 수 있다.
    # 그때만 같은 모델을 임시 영문 경로에 복사해 읽는다.
    runtime_model = Path(tempfile.gettempdir()) / "plus_ultra_yunet_2023mar.onnx"
    if not runtime_model.is_file() or runtime_model.stat().st_size != MODEL.stat().st_size:
        shutil.copyfile(MODEL, runtime_model)
    detector = cv2.FaceDetectorYN.create(
        str(runtime_model), "", (bgr.shape[1], bgr.shape[0]), 0.55, 0.3, 50
    )
    _, faces = detector.detect(bgr)
    if faces is None:
        return None
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
    canvas = Image.new("RGBA", (round(side), round(side)), (0, 0, 0, 0))
    box = (round(left), round(top), round(left + side), round(top + side))
    sx0, sy0 = max(0, box[0]), max(0, box[1])
    sx1, sy1 = min(image.width, box[2]), min(image.height, box[3])
    if sx1 > sx0 and sy1 > sy0:
        crop = image.crop((sx0, sy0, sx1, sy1))
        canvas.alpha_composite(crop, (sx0 - box[0], sy0 - box[1]))
    return canvas.resize((FACE_SIZE, FACE_SIZE), Image.Resampling.LANCZOS)


def font(size: int) -> ImageFont.ImageFont:
    for path in (Path("C:/Windows/Fonts/malgun.ttf"), Path("C:/Windows/Fonts/NanumGothic.ttf")):
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def make_preview(items: list[tuple[str, str, Image.Image]], *, faces: bool) -> Path:
    columns = 5
    if faces:
        cell_w, art_h, label_h = 224, 224, 34
        filename = "legendary-faces-preview.jpg"
    else:
        cell_w, art_h, label_h = 260, 320, 36
        filename = "legendary-portraits-preview.jpg"
    rows = ceil(len(items) / columns)
    sheet = Image.new("RGB", (cell_w * columns, (art_h + label_h) * rows), "#15120f")
    draw = ImageDraw.Draw(sheet)
    label_font = font(16)
    for index, (_, name, portrait) in enumerate(items):
        col, row = index % columns, index // columns
        x, y = col * cell_w, row * (art_h + label_h)
        tile = Image.new("RGBA", (cell_w, art_h), (39, 29, 25, 255))
        display = portrait.copy()
        display.thumbnail((cell_w - 12, art_h - 8), Image.Resampling.LANCZOS)
        tile.alpha_composite(display, ((cell_w - display.width) // 2, art_h - display.height))
        sheet.paste(tile.convert("RGB"), (x, y))
        bounds = draw.textbbox((0, 0), name, font=label_font)
        draw.text(
            (x + (cell_w - (bounds[2] - bounds[0])) / 2, y + art_h + 6),
            name,
            fill="#ead7ac",
            font=label_font,
        )
    output = ROOT / "docs" / "art" / filename
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "JPEG", quality=90, optimize=True)
    return output


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    halves: list[tuple[str, str, Image.Image]] = []
    faces: list[tuple[str, str, Image.Image]] = []
    for look, name, group in LOOKS:
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
        image.save(OUTPUT / f"{look}_half.webp", "WEBP", quality=88, method=4)
        face.save(OUTPUT / f"{look}.webp", "WEBP", quality=90, method=4)
        halves.append((look, name, image))
        faces.append((look, name, face))
        print(f"{group} / {name}: 얼굴상·무릎상")
    portrait_preview = make_preview(halves, faces=False)
    face_preview = make_preview(faces, faces=True)
    print(f"완료: {len(LOOKS)}명 / {len(LOOKS) * 2}개 WebP")
    print(f"무릎상 점검판: {portrait_preview}")
    print(f"얼굴상 점검판: {face_preview}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
