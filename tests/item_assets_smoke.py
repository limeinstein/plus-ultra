"""교역품·소지품·유물 아이콘의 연결과 투명 배경을 점검한다."""
from pathlib import Path
import json
import re
import subprocess
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import split_item_atlases as atlas  # noqa: E402


def flat(groups):
    return [name for _, _, _, names in groups for name in names]


def data_ids(path, start, end):
    text = path.read_text(encoding="utf-8")
    text = text[text.index(start):text.index(end)]
    return re.findall(r"\{ id: '([^']+)'", text)


def check_icons(folder, names, size):
    for name in names:
        path = ROOT / "images" / folder / f"{name}.webp"
        assert path.exists(), f"그림이 없습니다: {path.relative_to(ROOT)}"
        with Image.open(path) as image:
            assert image.size == (size, size), f"크기가 다릅니다: {path.name} {image.size}"
            assert image.mode == "RGBA", f"투명 그림이 아닙니다: {path.name} {image.mode}"
            alpha = image.getchannel("A")
            lo, hi = alpha.getextrema()
            assert lo == 0 and hi >= 240, f"알파 범위가 이상합니다: {path.name} {(lo, hi)}"
            corners = [alpha.getpixel((0, 0)), alpha.getpixel((size - 1, 0)),
                       alpha.getpixel((0, size - 1)), alpha.getpixel((size - 1, size - 1))]
            assert max(corners) == 0, f"모서리 배경이 투명하지 않습니다: {path.name}"


def runtime_icon_ids():
    """index.html의 실제 데이터 순서로 교역품·유물 ID를 읽는다."""
    script = r"""
const fs=require('fs'),vm=require('vm');
global.window=global; global.document={}; global.G={};
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
for(const file of scripts) if(file==='js/core/util.js'||file.startsWith('js/data/'))
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
console.log(JSON.stringify({goods:Object.keys(G.GOOD||{}),relics:Object.keys(G.RELIC||{})}));
"""
    raw = subprocess.check_output(['node', '-e', script], cwd=ROOT, text=True, encoding='utf-8')
    return json.loads(raw)


goods = data_ids(ROOT / "js" / "data" / "base.js", "G.GOODS = [", "G.GOOD = {}")
assert goods == flat(atlas.GOODS), "교역품 데이터 순서와 그림 목록이 다릅니다."

item_text = (ROOT / "js" / "data" / "items.js").read_text(encoding="utf-8")
shown_items = [m.group(1) for m in re.finditer(r"\{ id: '([^']+)', name: '[^']+', kind: '(weapon|armor|tool|gift|special)'", item_text)]
assert shown_items == atlas.ITEM_ORDER, "소지품 데이터 순서와 그림 목록이 다릅니다."

check_icons("goods", goods, 192)
check_icons("items", shown_items, 256)
check_icons("relics", flat(atlas.RELICS), 256)

runtime = runtime_icon_ids()
assert len(runtime['goods']) == 77, f"교역품 데이터 수가 달라졌습니다: {len(runtime['goods'])}"
assert len(runtime['relics']) == 387, f"유물 데이터 수가 달라졌습니다: {len(runtime['relics'])}"
check_icons("goods", runtime['goods'], 192)
check_icons("relics", runtime['relics'], 256)

print(f"교역품 {len(runtime['goods'])}종 · 일반 소지품 {len(shown_items)}종 · 유물 {len(runtime['relics'])}종 정상")
