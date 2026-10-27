#!/usr/bin/env python3
"""원본의 거의 투명한 형광 RGB가 여급 추출 중 불투명해지는 회귀를 막는다."""
from pathlib import Path
import sys
import tempfile

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import restore_initial_maid_archive as repair
import restore_maid_portraits as green_repair
import slim


pixels = np.zeros((12, 12, 4), dtype=np.uint8)
pixels[1:11, 1:11] = (255, 0, 0, 1)  # PNG에 남아 있던 진단색
pixels[3:9, 3:9] = (135, 82, 60, 251)  # 원본 피부·옷
pixels[4, 4] = (190, 16, 18, 252)  # 진짜 빨간 옷은 유지
pixels[3, 5] = (90, 60, 40, 128)  # 머리카락·베일의 반투명 경계
source = Image.fromarray(pixels)
rgb = repair.separation_rgb(source)
assert np.all(rgb[1, 1] == 0), "알파 1의 형광색이 분리 입력에 남음"
assert np.all(rgb[0, 0] == 0)

# 분리기가 형광 영역까지 선택하더라도 원본의 색·알파를 복원해야 한다.
selected = Image.new("RGBA", source.size, (255, 0, 0, 255))
restored = np.array(repair.preserve_source_alpha(selected, source))
assert np.all(restored[1, 1] == 0), "분리 마스크가 형광색을 불투명하게 살림"
assert np.array_equal(restored[3:9, 3:9], pixels[3:9, 3:9]), "인물 RGB·알파 변경"

clean = np.array(repair.clean_source(source))
assert clean.shape == (6, 6, 4)
assert clean[0, 2, 3] == 128, "알파를 두 번 곱해 반투명 경계를 손상시킴"
assert np.array_equal(clean[1, 1], pixels[4, 4]), "진짜 빨간 의상 변경"

selected.putalpha(Image.new("L", source.size, 0))
empty = np.array(repair.preserve_source_alpha(selected, source))
assert not empty.any(), "다른 인물의 원본 픽셀이 섞임"

green = np.empty((80, 80, 3), dtype=np.uint8)
green[:] = (3, 249, 10)
green[10:70, 10:70] = (180, 120, 95)
green[40, 40] = (25, 70, 35)  # 진짜 짙은 녹색 옷의 내부
green[10, 40] = (60, 180, 35)  # 배경이 섞인 반투명 가장자리
keyed = np.array(green_repair.remove_green(Image.fromarray(green)))
assert keyed[0, 0, 3] == 0
assert np.array_equal(keyed[30, 30], (180, 120, 95, 255)), "피부색 변경"
assert np.array_equal(keyed[40, 40], (25, 70, 35, 255)), "녹색 의상의 내부 변경"
assert keyed[10, 40, 1] <= max(keyed[10, 40, 0], keyed[10, 40, 2]), "녹색 번짐 잔존"

for key in ('maid-styles/china/25_half', 'portraits/maids/m_lis_half',
            'portraits/npc/librarian_europe_f_half', 'portraits/pools/mates/pt/f/01_half'):
    assert slim.rule_for(key)[0] >= 768, key
    assert slim.hq_for(key)[0] >= 768, key
    assert slim.floor_for(key) >= 640, key
assert slim.rule_for('portraits/maids/m_lis')[0] == 512
assert slim.hq_for('maid-styles/china/25')[0] == 512
assert slim.floor_for('items/rapier') == 256
with tempfile.TemporaryDirectory(prefix='maid-compression-') as directory:
    found = {key: key + '.webp' for key in (
        'maid-styles/china/25_half', 'portraits/maids/m_lis_half',
        'portraits/npc/librarian_europe_f_half')}
    output = slim.build(found, directory, scale=0.2, quiet=True, hq=True)
    for key, filename in output.items():
        with Image.open(Path(directory) / filename) as compressed:
            assert max(compressed.size) == 640, (key, compressed.size)
            assert compressed.mode == 'RGBA' and compressed.getchannel('A').getextrema()[0] == 0
print("원본 알파·형광색 제거·반투명 경계·피부/의상 유지·배포 무릎상 크기 통과")
