#!/usr/bin/env python3
"""이벤트 장면의 전용 이미지와 manifest 누락을 점검한다."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREFIXES = r"(?:legend-events|family-events|romance-events|achievement-events|events/(?:home|princess|colony))"


def audit() -> dict:
    manifest = (ROOT / 'images/manifest.js').read_text(encoding='utf-8')
    registered = set(re.findall(r'^  "([^"]+)":', manifest, re.M))
    sources: dict[str, set[str]] = {}

    def add(key: str, source: Path) -> None:
        sources.setdefault(key, set()).add(source.relative_to(ROOT).as_posix())

    for source in sorted((ROOT / 'js').rglob('*.js')):
        text = source.read_text(encoding='utf-8')
        text = re.sub(r'/\*.*?\*/|//[^\n]*', '', text, flags=re.S)
        for key in re.findall(r"['\"](" + PREFIXES + r"/[a-z0-9_]*[a-z0-9])['\"](?!\s*\+)", text):
            add(key, source)
        if "img: 'legend-events/' + key" in text:
            for key in re.findall(r"\b(?:pic|withPic)\('([a-z0-9_]+)'", text):
                add('legend-events/' + key, source)
        if "img: 'legend-events/little_prince_' + key" in text:
            for key in re.findall(r"\bshot\('([a-z0-9_]+)'", text):
                add('legend-events/little_prince_' + key, source)

    source = ROOT / 'js/art/eventshot.js'
    for key in ('es_rescued', 'es_return', 'es_wedding', 'eliz_tower', 'eliz_safe', 'eliz_knight', 'court_rescue', 'royal_wedding'):
        add('events/princess/' + key, source)
    source = ROOT / 'js/art/homeart.js'
    text = source.read_text(encoding='utf-8')
    for key in re.findall(r'^    ([a-z_]+): function', text, re.M):
        add('events/home/' + key, source)
    source = ROOT / 'js/systems/colony.js'
    for key in ('found', 'stage2', 'stage3', 'stage4', 'governor'):
        add('events/colony/' + key, source)
    source = ROOT / 'js/data/achievements.js'
    text = source.read_text(encoding='utf-8')
    for key in re.findall(r"\ba\('[^']*',\s*'([a-z0-9_]+)'", text):
        if key not in ('montcrew', 'happily'):
            add('achievement-events/' + key, source)

    rows = []
    for key, refs in sorted(sources.items()):
        paths = [ROOT / 'images' / (key + suffix) for suffix in ('.webp', '.png', '.jpg', '.gif')]
        found = next((p for p in paths if p.is_file()), None)
        rows.append({'key': key, 'sources': sorted(refs), 'file': found.relative_to(ROOT).as_posix() if found else None, 'registered': key in registered})
    return {'total': len(rows), 'missing': [r for r in rows if not r['file']], 'unregistered': [r for r in rows if r['file'] and not r['registered']], 'rows': rows}


if __name__ == '__main__':
    report = audit()
    print(json.dumps({k: v for k, v in report.items() if k != 'rows'}, ensure_ascii=False, indent=2))
