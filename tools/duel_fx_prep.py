"""먹방울·발먼지 원화를 투명 시트로 정리한다. 검은 바탕의 발광 원화는 --black으로 알파를 분리한다."""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--black', action='store_true')
    args = parser.parse_args()
    image = Image.open(args.source).convert('RGBA')
    if args.black:
        rgb = np.asarray(image, dtype=float)[:, :, :3]
        alpha = rgb.max(axis=2)
        rgb = 255 * rgb / np.maximum(1, alpha[:, :, None])
        Image.fromarray(np.dstack((rgb, alpha)).round().astype('uint8')).save(args.destination)
        return
    args.destination.mkdir(exist_ok=True, parents=True)
    for r, (name, n, w, h) in enumerate([('ink_drops',5,256,256), ('dust_feet',6,256,128), ('dust_deck',6,256,128)]):
        strip = Image.new('RGBA', (n*w,h))
        for c in range(n):
            box = (round(c*image.width/6), round(r*image.height/3), round((c+1)*image.width/6), round((r+1)*image.height/3))
            tile = image.crop(box)
            alpha = np.array(tile.getchannel('A'),dtype=float)
            alpha = np.clip((alpha-3)*255/250, 0, 255)
            # 각 칸의 가장자리 먼지는 부드럽게 지워 다음 장면에 걸치지 않게 한다.
            ys,xs=np.indices(alpha.shape)
            edge=np.minimum.reduce([ys,xs,tile.height-1-ys,tile.width-1-xs])
            alpha *= np.clip(edge/10,0,1) * (1-0.72*(c/(n-1))**2)
            tile.putalpha(Image.fromarray(alpha.astype('uint8')))
            size = (round(w*0.9),round(h*0.94))
            tile = tile.resize(size,Image.Resampling.LANCZOS)
            strip.paste(tile,(c*w+(w-size[0])//2,h-size[1]))
        strip.save(args.destination/(name+'.png'),optimize=True)


if __name__=='__main__':
    main()
