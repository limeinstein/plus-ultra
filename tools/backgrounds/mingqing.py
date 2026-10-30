"""명청 시대의 몽골·만주 도시(309~315) 거리 배경 초안: compose.py로 가까운 고장 배경을 뒤집고 당긴다.
   python tools/backgrounds/mingqing.py [도시번호 ...]   → images/backgrounds/<번호>.jpg (mingqing_specs.json)"""
import sys, os, json, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import compose as C
if __name__ == '__main__':
    specs = json.load(open(os.path.join(os.path.dirname(__file__), 'mingqing_specs.json'), encoding='utf8'))
    only = set(sys.argv[1:])
    for k, v in specs.items():
        if k.startswith('_') or (only and k not in only): continue
        C.make(int(k), v)
        shutil.copyfile(C.OUT + '%s.jpg' % k, C.IMG + 'backgrounds/%s.jpg' % k); print('bg', k)
