#!/usr/bin/env python3
"""새로 만든 무릎상 PNG를 같은 크기·투명 알파의 게임용 WebP로 바꾼다."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIRS = [ROOT / 'images' / 'portraits' / name for name in ('rivals', 'npc', 'npc-roles', 'courtiers')]


def main() -> int:
    files = sorted(p for root in DIRS for p in root.rglob('*_half.png'))
    before = sum(p.stat().st_size for p in files)
    converted = []
    for src in files:
        dest = src.with_suffix('.webp')
        temp = dest.with_name(dest.name + '.tmp')
        with Image.open(src) as opened:
            image = opened.convert('RGBA')
            if image.size != (1024, 1536):
                raise ValueError(f'크기 오류: {src} {image.size}')
            if image.getchannel('A').getextrema()[0] >= 250:
                raise ValueError(f'투명 알파 없음: {src}')
            image.save(temp, 'WEBP', quality=90, method=3, exact=True)
            # 왕실 신하는 같은 생성 그림의 윗부분을 얼굴 초상으로 써서
            # 서임 장면의 얼굴과 무릎상이 서로 다른 사람처럼 보이지 않게 한다.
            if src.parent.name == 'courtiers':
                bust = image.crop((0, 0, 1024, 1024)).resize((512, 512), Image.Resampling.LANCZOS)
                bust.save(src.with_name(src.stem[:-5] + '.webp'), 'WEBP', quality=90, method=3, exact=True)
        with Image.open(temp) as checked:
            if checked.size != (1024, 1536) or checked.mode != 'RGBA' or checked.getchannel('A').getextrema()[0] >= 250:
                raise ValueError(f'변환 검증 실패: {src}')
        temp.replace(dest)
        src.unlink()
        converted.append(dest)
    after = sum(p.stat().st_size for p in converted)
    print(f'무릎상 {len(converted)}장: {before / 1024 / 1024:.1f} MiB → {after / 1024 / 1024:.1f} MiB')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
