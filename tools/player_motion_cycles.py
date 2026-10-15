#!/usr/bin/env python3
"""제독 걷기 아틀라스에서 '서 있을 때 쓸 칸'을 골라 js/data/heromotion.js 로 적는다 (python3 tools/player_motion_cycles.py)

거리에서 멈춰 서면 걷기 그림의 한 칸을 보여 준다 (js/scenes/town.js). 예전엔 늘 첫 칸이라
그림에 따라 다리를 크게 벌린 채 멈춰 섰다 → 두 발 사이가 가장 좁은(발을 모은) 칸을 고른다.
G.HERO_MOTION[look] = { idle: 칸 번호, skip: [쓰지 않는 동작] }

skip: 그 생김새의 얼굴(portraits/player · characters/player_half_*)과 다른 사람으로 그려진 동작 아틀라스.
      거리에서는 그 동작 대신 그 생김새의 예전 8장 걷는 그림(characters/<생김새>/walk_*)을 쓴다.
      Codex가 다시 그리면 여기서 빼고 이 도구를 다시 돌린다 (2026-10-15 점검)."""
SKIP = {
    'admiral': ['walk'],                       # 걷기에만 갈색 모자 — 얼굴·달리기·뒤돌기는 모자 없음
    'blackcoat_captain': ['walk'],             # 걷기에만 모자
    'casanova': ['back'],                      # 문 들어가기에만 모자
    'hat_spinner': ['walk', 'run', 'back'],    # 얼굴은 모자를 손가락에 돌리는데 세 동작 모두 모자를 썼다
    'navigator_white': ['run', 'back'],        # 달리기는 모자, 문 들어가기는 파란 코트+모자 (다른 사람)
    'sky_adventurer': ['walk', 'run', 'back'], # 가죽옷 모험가인데 세 동작 모두 파란 코트+모자를 쓴 다른 사람
}
import glob, json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def feet_gap(c):
    bb = c.getbbox(); f = c.crop(bb)
    a = (np.asarray(f)[:, :, 3] > 100).astype(np.uint8); h = a.shape[0]; band = a[int(h * 0.93):]
    n, lab, st, cen = cv2.connectedComponentsWithStats(band, 8)
    cs = sorted([(st[i, cv2.CC_STAT_AREA], cen[i][0]) for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > band.size * 0.004], reverse=True)
    spread = (np.ptp(np.nonzero(band.any(0))[0]) if band.any() else 0) / h      # 발끝에서 발끝까지
    return (abs(cs[0][1] - cs[1][1]) / h if len(cs) >= 2 else 0.0) + spread * 0.5

def main():
    out = {}
    for d in sorted(glob.glob(str(ROOT / 'images/characters/*/motion'))):
        im = Image.open(f'{d}/walk.webp').convert('RGBA'); cw, ch = im.width // 7, im.height // 7
        g = [feet_gap(im.crop(((i % 7) * cw, (i // 7) * ch, (i % 7 + 1) * cw, (i // 7 + 1) * ch))) for i in range(49)]
        look = Path(d).parent.name; rec = {'idle': int(np.argmin(g))}
        if look in SKIP: rec['skip'] = SKIP[look]
        out[look] = rec
    js = ('/* 제독 걷기 아틀라스에서 서 있을 때 쓸 칸 · 얼굴과 다른 사람으로 그려져 쓰지 않는 동작 — tools/player_motion_cycles.py 가 만든다 (js/scenes/town.js) */\n'
          'window.G = window.G || {};\nG.HERO_MOTION = ' + json.dumps(out, separators=(',', ':')) + ';\n')
    (ROOT / 'js/data/heromotion.js').write_text(js, encoding='utf-8')
    print(out)

if __name__ == '__main__':
    main()
