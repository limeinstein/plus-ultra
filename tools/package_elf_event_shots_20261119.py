"""내장 ImageGen 원화 네 장을 보존하고 게임용 WebP와 목록에 연결한다."""
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / 'tools/elf_event_shots_20261119_sources.json').read_text(encoding='utf-8'))
OUT = ROOT / 'artifacts/elf-event-shots-20261119/originals'
DEST = ROOT / 'images/elf-events'
OUT.mkdir(parents=True, exist_ok=True)
DEST.mkdir(parents=True, exist_ok=True)
entries = {}
for kind, source in SOURCES.items():
    original = OUT / (kind + '.png')
    if not original.exists():
        shutil.copy2(source, original)
    with Image.open(original) as image:
        assert image.size == (1881, 836), (kind, image.size)
        image.convert('RGB').save(DEST / (kind + '_20261119.webp'), quality=92, method=6)
    key = 'elf-events/' + kind + '_20261119'
    entries[key] = key + '.webp'
# 다른 작업이 추가한 목록과 우선 교체 연결은 보존한다.
manifest = ROOT / 'images/manifest.js'
text = manifest.read_text(encoding='utf-8')
start = text.index('{', text.index('G.IMAGE_FILES ='))
end = text.rindex('}')
files = json.loads(text[start:end + 1])
files.update(entries)
manifest.write_bytes((text[:start] + json.dumps(files, ensure_ascii=False, indent=2, sort_keys=True) + text[end + 1:]).encode('utf-8'))
print('엘프 사건샷 4장: 원본 보존·1881×836 WebP·게임 목록 연결')
