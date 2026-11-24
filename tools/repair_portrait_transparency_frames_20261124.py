"""배경이 구워진 라이벌 얼굴을 같은 인물의 투명 무릎상 구도로 연결한다. 원화는 바꾸지 않는다."""
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
START = '        // 투명 라이벌 얼굴 시작 — tools/repair_portrait_transparency_frames_20261124.py'
END = '        // 투명 라이벌 얼굴 끝'


def main():
    manifest = (ROOT / 'images/manifest.js').read_text(encoding='utf-8')
    files = json.loads(re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', manifest).group(1))
    text = (ROOT / 'js/data/portraitfaces.js').read_text(encoding='utf-8')
    faces = json.loads(re.search(r'G\.PORTRAIT_FACES = (\{[\s\S]*?\});', text).group(1))
    frames = {}
    for key, file in files.items():
        if not key.startswith('portraits/rivals/') or '_half' in key:
            continue
        with Image.open(ROOT / 'images' / file) as image:
            if image.convert('RGBA').getchannel('A').getextrema()[0] < 255:
                continue
        source = key + '_half'
        face_key = next((alias for alias, path in files.items() if path == files.get(source) and alias in faces), None)
        assert source in files and face_key, (key, '같은 사람의 무릎상·얼굴 자리 필요')
        with Image.open(ROOT / 'images' / files[source]) as image:
            width, height = image.size
            alpha = image.convert('RGBA').getchannel('A')
            assert alpha.getextrema()[0] == 0, source
            bounds = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
        f = faces[face_key]
        # 정수리·관모부터 가슴까지 남기고 눈과 입을 가로 가운데에 둔다.
        top = bounds[1] / height
        h = max(f['box'][2] / .36 * width / height, f['box'][1] + f['box'][3] * 1.75 - top)
        h = min(h, width / height)
        w = h * height / width
        x = (f['eyes'][0] + f['eyes'][2] + f['mouth'][0] * 2) / 4
        left = max(0, min(1 - w, x - w / 2))
        top = max(0, min(1 - h, top - h * .02))
        frames[key] = {'source': source, 'rect': [round(n, 8) for n in [left, top, w, h]]}
    target = ROOT / 'js/data/seafx.js'
    text = target.read_text(encoding='utf-8')
    block = '\n'.join([START, *[
        '        ' + json.dumps(key, ensure_ascii=False) + ': ' + json.dumps(frame, ensure_ascii=False) + ','
        for key, frame in sorted(frames.items())], END])
    if START in text:
        text = re.sub(re.escape(START) + r'[\s\S]*?' + re.escape(END), lambda _: block, text)
    else:
        anchor = '      frames: {\n'
        assert anchor in text
        text = text.replace(anchor, anchor + block + '\n', 1)
    target.write_text(text, encoding='utf-8', newline='\n')
    print('투명 원화로 연결한 라이벌 얼굴:', len(frames))


if __name__ == '__main__':
    main()
