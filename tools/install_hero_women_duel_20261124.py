"""추가 여성 제독 13종의 일기토·필살기를 기존 전투 포장 규격으로 연결한다."""
import argparse
import json
from pathlib import Path
import install_hero_motion_20261124 as motion

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'art_sources/hero-women-20261124'
OUT=ROOT/'artifacts/hero-women-20261124'
CHARS=json.loads((ROOT/'tools/hero_women_20261124/characters.json').read_text(encoding='utf-8'))

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('ids',nargs='*');ap.add_argument('--partial',action='store_true');args=ap.parse_args()
    OUT.mkdir(parents=True,exist_ok=True)
    motion.SOURCE=BASE;motion.RAW=BASE/'raw';motion.BACKUP=BASE/'before';motion.OUT=OUT
    report=OUT/'install-report.json';results=json.loads(report.read_text(encoding='utf-8')) if report.exists() else {};errors=[]
    for fid in args.ids or [c['id'] for c in CHARS]:
        for name,required,fn in [('combat',['atk','react'],motion.combat),('cutin',['cutin'],motion.cutin)]:
            if not all((motion.RAW/f'{fid}_{kind}.png').exists() for kind in required):
                if not args.partial:errors.append(f'{fid}/{name}: 원화 없음')
                continue
            try:
                results.setdefault(fid,{})[name]=fn(fid) or True
                print(fid,name,'완료',flush=True)
            except (ValueError,OSError) as ex:errors.append(f'{fid}/{name}: {ex}')
    motion.patch_data(results)
    report.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'install-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2),encoding='utf-8')
    if errors:raise SystemExit('\n'.join(errors))

if __name__=='__main__':main()
