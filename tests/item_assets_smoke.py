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


def has_art(key):
    """런타임 그림 체인에서 지원하는 어느 확장자든 있으면 된다."""
    return any((ROOT / "images" / f"{key}{ext}").exists()
               for ext in (".webp", ".png", ".jpg", ".jpeg", ".gif"))


def runtime_icon_ids():
    """index.html의 실제 데이터 순서로 교역품·유물 ID를 읽는다."""
    script = r"""
const fs=require('fs'),vm=require('vm');
global.window=global; global.document={}; global.G={};
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
for(const file of scripts) if(file==='js/core/util.js'||file.startsWith('js/data/'))
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
console.log(JSON.stringify({goods:Object.values(G.GOOD||{}).map(g=>({id:g.id,plant:!!g.plant,from:g.from||null})),relics:Object.values(G.RELIC||{}).map(r=>({id:r.id,relic:r.relic||null,kind:r.kind||null}))}));
"""
    raw = subprocess.check_output(['node', '-e', script], cwd=ROOT, text=True, encoding='utf-8')
    return json.loads(raw)


goods = data_ids(ROOT / "js" / "data" / "base.js", "G.GOODS = [", "G.GOOD = {}")
assert goods == flat(atlas.GOODS), "교역품 데이터 순서와 그림 목록이 다릅니다."

item_text = (ROOT / "js" / "data" / "items.js").read_text(encoding="utf-8")
shown_items = [m.group(1) for m in re.finditer(r"\{ id: '([^']+)', name: '[^']+', kind: '(weapon|armor|tool|gift|special)'", item_text)]

check_icons("goods", goods, 192)
check_icons("items", shown_items, 256)
check_icons("relics", flat(atlas.RELICS), 256)

runtime = runtime_icon_ids()
ordinary_goods = [row['id'] for row in runtime['goods'] if not row['plant']]
plant_goods = [row for row in runtime['goods'] if row['plant']]
check_icons("goods", ordinary_goods, 192)
for row in plant_goods:
    source = ROOT / "images" / "discovery-ends" / f"{row['from']}.jpg"
    assert source.exists(), f"식물 교역품 원본이 없습니다: {source.relative_to(ROOT)}"
for row in runtime['relics']:
    chain = [f"relics/{row['id']}", f"items/{row['id']}"]
    if row['relic']:
        chain += [f"discovery-ends/{row['relic']}", f"discoveries/{row['relic']}"]
    if row['kind']:
        chain += [f"relic-kinds/{row['kind']}"]
    assert any(has_art(key) for key in chain), f"유물 그림 체인이 비었습니다: {row['id']} ({chain})"

print(f"교역품 {len(runtime['goods'])}종(전용 아이콘 {len(ordinary_goods)} · 식물 발견 원화 {len(plant_goods)}) · 일반 소지품 {len(shown_items)}종 · 유물 {len(runtime['relics'])}종 정상")
