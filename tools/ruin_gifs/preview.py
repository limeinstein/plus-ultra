#!/usr/bin/env python3
"""Make a still contact sheet for visually checking an animated reconstruction GIF."""
import sys
from pathlib import Path

from PIL import Image, ImageOps


src = Path(sys.argv[1])
dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_name(src.stem + "-preview.jpg")
im = Image.open(src)
last = max(0, im.n_frames - 1)
# Sample the whole animation evenly so construction, color wash, orbit, and
# every lighting phase remain visible even if GIF optimization merges frames.
indices = [round(last * i / 10) for i in range(11)]
frames = []
for i in indices:
    im.seek(min(i, im.n_frames - 1))
    frames.append(im.convert("RGB"))
sheet = Image.new("RGB", (frames[0].width * 4, frames[0].height * 3), "white")
for n, frame in enumerate(frames):
    sheet.paste(ImageOps.expand(frame, border=1, fill=(84, 76, 64)),
                ((n % 4) * frames[0].width, (n // 4) * frames[0].height))
dst.parent.mkdir(parents=True, exist_ok=True)
sheet.save(dst, quality=88, optimize=True)
print(dst)
