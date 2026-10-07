"""왕실 신하와 지역별 거리 NPC 그림의 파일·규격·연결을 점검한다."""
from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "images"
COURTIERS = [
    "pt_king", "es_crown", "es_aragon", "fr_king", "en_king", "de_emperor", "it_doge", "it_pope",
    "dk_king", "pl_king", "ru_prince", "hu_king", "ot_sultan", "eg_sultan", "pe_shah", "hr_baykara",
    "in_delhi", "in_gujarat", "my_malacca", "in_vijaya", "th_king", "kr_king",
]
STYLES = ["ib", "ne", "it", "gr", "ru", "is", "pe", "af", "sw", "in", "se", "cn", "kr", "jp", "az", "an", "co", "tr", "st", "na"]
ROLES = ["king", "priest", "noble", "official", "merchant", "scholar", "keeper", "sailor", "soldier", "maid", "native", "captain"]


def check(path: Path, size: tuple[int, int]) -> None:
    assert path.is_file(), f"빠진 그림: {path.relative_to(ROOT)}"
    with Image.open(path) as image:
        assert image.size == size, f"크기 오류: {path.relative_to(ROOT)} {image.size}"
        assert image.mode == "RGBA", f"투명 그림 아님: {path.relative_to(ROOT)} {image.mode}"
        assert image.getchannel("A").getextrema()[0] < 250, f"투명 여백 없음: {path.relative_to(ROOT)}"


for courtier in COURTIERS:
    check(IMG / "portraits" / "courtiers" / f"{courtier}.webp", (512, 512))
    check(IMG / "portraits" / "courtiers" / f"{courtier}_half.webp", (1024, 1536))

for style in STYLES:
    for frame in range(1, 9):
        check(IMG / "street-folk" / f"man_{style}" / f"walk_{frame}.webp", (380, 444))
    for role in ROLES:
        check(IMG / "portraits" / "npc-roles" / style / f"{role}.webp", (512, 512))
        check(IMG / "portraits" / "npc-roles" / style / f"{role}_half.webp", (1024, 1536))

court_system = (ROOT / "js" / "systems" / "court.js").read_text(encoding="utf-8")
street_system = (ROOT / "js" / "systems" / "streetfolk.js").read_text(encoding="utf-8")
assert "CT.courtier = function" in court_system and "portraits/courtiers/" in court_system
assert "의 이름으로 선포합니다" in court_system
assert "'street-folk/' + type + '_' + style + '/walk_'" in street_system
assert "sp.half = G.Img.chain.halfFor" in street_system

print(f"왕실 신하 {len(COURTIERS)}명 얼굴·무릎상, 지역 주민 보행 {len(STYLES)}곳×8장, NPC 역할 얼굴·무릎상 {len(STYLES) * len(ROLES)}종 확인")
