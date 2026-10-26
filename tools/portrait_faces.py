#!/usr/bin/env python3
"""대화 인물 그림에서 얼굴 자리(두 눈·입·얼굴 상자)를 찾아 js/data/portraitfaces.js 를 만든다.

대화창·술집의 2.5D 리그(js/art/portrait_rig.js)는 그림을 머리·몸통·하체로 나눠 움직이고 눈 깜박임·입 모양을 겹쳐 그린다.
그림마다 얼굴 자리가 다르므로(고개를 기울이거나 한쪽에 치우친 그림), 그 자리를 여기서 미리 재어 둔다.
값은 그림 기준 비율(0~1)이라 그림 크기가 바뀌어도(아티팩트용 축소 등) 그대로 맞는다.

사용법 (WebGame 폴더에서):
    pip install opencv-python-headless pillow
    python tools/portrait_faces.py                     # images/portraits/maids · images/maid-styles
    python tools/portrait_faces.py --model 경로.onnx   # 얼굴 찾기 모델 위치 (기본: tools/models/face_detection_yunet_2023mar.onnx)
    python tools/portrait_faces.py --key portraits/legendary/snow_white --merge

얼굴 찾기 모델은 OpenCV Zoo의 YuNet(MIT 사용권)이다. 없으면 받아 둔다:
    https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet  (face_detection_yunet_2023mar.onnx)
그림을 새로 넣거나 바꾸면 이 도구를 다시 돌린다. 못 찾은 그림은 목록에서 빠지고, 게임은 리그의 기본 자리를 쓴다.
"""
import glob, json, os, shutil, sys, tempfile

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
IMG = os.path.join(ROOT, 'images')
OUT = os.path.join(ROOT, 'js', 'data', 'portraitfaces.js')
DIRS = ['portraits/maids', 'maid-styles', 'portraits/rivals', 'portraits/npc', 'portraits/npc-roles', 'portraits/building-managers', 'portraits/gardeners', 'portraits/mates', 'portraits/sponsors', 'portraits/legendary', 'portraits/history', 'portraits/fairy-tales', 'portraits/street-folk', 'portraits/medici', 'portraits/witches']

def main():
    try:
        import cv2
        import numpy as np
        from PIL import Image
    except ImportError:
        print('opencv-python-headless 와 pillow 가 필요합니다: pip install opencv-python-headless pillow')
        return 1
    model = os.path.join(TOOLS, 'models', 'face_detection_yunet_2023mar.onnx')
    if '--model' in sys.argv:
        model = sys.argv[sys.argv.index('--model') + 1]
    prefix = None
    if '--prefix' in sys.argv:
        prefix = sys.argv[sys.argv.index('--prefix') + 1].strip('/')
    merge = '--merge' in sys.argv
    exact_keys = set()
    for index, arg in enumerate(sys.argv[:-1]):
        if arg == '--key':
            exact_keys.add(sys.argv[index + 1].strip('/'))
    if not os.path.exists(model):
        print('얼굴 찾기 모델이 없습니다: ' + model)
        print('https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet 에서 받아 두세요.')
        return 1
    # OpenCV의 Windows ONNX 읽기는 경로에 한글이 있으면 실패할 수 있다.
    # 그때도 안정적으로 읽도록 모델을 임시 영문 경로에 복사한다.
    runtime_model = os.path.join(tempfile.gettempdir(), 'plus_ultra_yunet_2023mar.onnx')
    if not os.path.exists(runtime_model) or os.path.getsize(runtime_model) != os.path.getsize(model):
        shutil.copyfile(model, runtime_model)
    R = lambda v: round(float(v), 4)
    out, miss = {}, []
    files = []
    for d in DIRS:
        for ext in ('webp', 'png', 'jpg'):
            files += glob.glob(os.path.join(IMG, d, '**', '*.' + ext), recursive=True)
    if prefix:
        files = [f for f in files if os.path.splitext(os.path.relpath(f, IMG))[0].replace('\\', '/').startswith(prefix + '/')]
    if exact_keys:
        files = [f for f in files if os.path.splitext(os.path.relpath(f, IMG))[0].replace('\\', '/') in exact_keys]
    for f in sorted(files):
        key = os.path.splitext(os.path.relpath(f, IMG))[0].replace('\\', '/')
        im = Image.open(f).convert('RGBA')
        W, H = im.size
        bg = Image.new('RGBA', im.size, (128, 128, 128, 255))
        bg.alpha_composite(im)
        img = cv2.cvtColor(np.array(bg.convert('RGB')), cv2.COLOR_RGB2BGR)
        s = 640 / max(W, H)
        sm = cv2.resize(img, (max(1, int(W * s)), max(1, int(H * s))))
        det = cv2.FaceDetectorYN.create(runtime_model, '', (sm.shape[1], sm.shape[0]), 0.5, 0.3, 50)
        _, faces = det.detect(sm)
        if faces is None:
            miss.append(key)
            continue
        # 점수가 높고 위쪽에 있는 얼굴 (손에 든 잔·접시 무늬를 얼굴로 잘못 보지 않게)
        fb = sorted(faces, key=lambda r: -(r[14] - 0.3 * r[1] / sm.shape[0]))[0] / s
        x, y, w, h = fb[:4]
        out[key] = {
            'box': [R(x / W), R(y / H), R(w / W), R(h / H)],
            'eyes': [R(fb[4] / W), R(fb[5] / H), R(fb[6] / W), R(fb[7] / H)],   # 그림에서 왼쪽 눈, 오른쪽 눈
            'mouth': [R((fb[10] + fb[12]) / 2 / W), R((fb[11] + fb[13]) / 2 / H)]
        }
    keys = sorted(out)
    fresh = ['    ' + json.dumps(k, ensure_ascii=False) + ': ' + json.dumps(out[k], separators=(',', ':')) for k in keys]
    if merge:
        if not prefix and not exact_keys:
            print('--merge에는 --prefix 또는 --key가 필요합니다.')
            return 1
        with open(OUT, encoding='utf-8') as fh:
            lines = fh.read().splitlines()
        start = lines.index('  G.PORTRAIT_FACES = {') + 1
        end = lines.index('  };', start)
        old = []
        replaced = set()
        generated = {key: line for key, line in zip(keys, fresh)}
        for line in lines[start:end]:
            entry = line.strip().rstrip(',')
            try:
                old_key = json.loads(entry[:entry.index(':')])
            except (ValueError, json.JSONDecodeError):
                continue
            if prefix and old_key.startswith(prefix + '/'):
                continue
            if old_key in exact_keys:
                old.append(generated[old_key])
                replaced.add(old_key)
                continue
            old.append(entry)
        if prefix:
            old.extend(fresh)
        else:
            old.extend(generated[key] for key in keys if key not in replaced)
        entries = old
        lines[start:end] = [line + (',' if i < len(entries) - 1 else '') for i, line in enumerate(entries)]
        while lines and not lines[-1].strip():
            lines.pop()
        lines.append('')
    else:
        lines = ['/* tools/portrait_faces.py가 만든 얼굴 자리 (그림 기준 비율 0~1). 손으로 고치지 말고 도구를 다시 돌린다.',
                 '   box: [x, y, 너비, 높이] · eyes: [왼눈 x, y, 오른눈 x, y] · mouth: [x, y] */',
                 '(function (G) {', "  'use strict';", '  G.PORTRAIT_FACES = {']
        lines += [line + (',' if i < len(fresh) - 1 else '') for i, line in enumerate(fresh)]
        lines += ['  };', '})(window.G = window.G || {});', '']
    with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(lines))
    print('얼굴 자리 %d장 → %s' % (len(out), os.path.relpath(OUT, ROOT)))
    if miss:
        print('얼굴을 못 찾은 그림 %d장 (리그 기본 자리를 씀): %s' % (len(miss), ', '.join(miss)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
