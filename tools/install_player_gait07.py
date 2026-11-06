#!/usr/bin/env python3
"""검수한 고정 배율 보행만 게임에 연결하고 교체 전 자료를 보관한다."""
import argparse, json, shutil
from pathlib import Path
from update_player_walk_loops import ROOT, read_config, digest

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',type=Path,required=True);a=p.parse_args()
 cp=ROOT/'js/data/heromotion.js';cfg=read_config(cp);records=[]
 backup=ROOT/'artifacts/player-gait-20261107/before';backup.mkdir(parents=True,exist_ok=True)
 if not (backup/'heromotion.js').exists():shutil.copy2(cp,backup/'heromotion.js')
 for look in cfg:
  for motion in ('walk','run'):
   src=a.input/look/f'stride_{motion}.webp';r=json.loads((a.input/look/f'{motion}-report.json').read_text(encoding='utf8'))
   assert digest(src)==r['output_sha256'] and r['clip']['fixedScale']
   base=ROOT/'images/characters'/look/'motion'
   assert digest(base/'walk.webp')==r['reference_sha256']
   r['original_sha256']={name:digest(base/(name+'.webp')) for name in ('walk','run','idle')}
   records.append(r)
 # 모든 항목의 검증을 끝낸 뒤 교체한다.
 for r in records:
  look,motion=r['look'],r['motion'];target=ROOT/'images/characters'/look/'motion'/f'stride_{motion}.webp'
  old=backup/look/target.name;old.parent.mkdir(parents=True,exist_ok=True)
  if not old.exists():shutil.copy2(target,old)
  shutil.copy2(a.input/look/target.name,target)
 current=read_config(cp)
 for r in records:current[r['look']].setdefault('loops',{})[r['motion']]=r['clip']
 cp.write_text('/* 고정 배율 보행. times·pose의 마지막 값은 한 주기의 끝 1. */\nwindow.G = window.G || {};\nG.HERO_MOTION = '+json.dumps(current,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8',newline='\n')
 (ROOT/'docs/art/player-gait-20261107.json').write_text(json.dumps({'version':1,'clips':records},ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
 print(f'{len(records)}개 걷기·뛰기 시트 연결 완료')

if __name__=='__main__':main()
