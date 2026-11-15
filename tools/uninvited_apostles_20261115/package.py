"""기존 사도 셋의 투명 초상과 내장 ImageGen 사건·아이템 원화를 게임 자산으로 포장한다."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'artifacts/uninvited-apostles-20261115'
PORTRAITS=ROOT.parent/'output/imagegen/greek-apostles-additions-20261115/webp'

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    entries={}
    for id,source in [('dionysus','13'),('poseidon_grey','08-grey'),('hades','14')]:
        for suffix in ['', '_half']:
            key='portraits/mates/apostle_'+id+suffix
            dst=ROOT/'images'/(key+'.webp');dst.parent.mkdir(parents=True,exist_ok=True)
            src=PORTRAITS/(source+suffix+'.webp')
            if src.exists():dst.write_bytes(src.read_bytes())
            elif not dst.exists():raise FileNotFoundError(src)
            entries[key]=key+'.webp'
    prompts=json.loads((HERE/'prompts.json').read_text(encoding='utf-8'))+json.loads((HERE/'highfive.json').read_text(encoding='utf-8'))
    for a in prompts:
        src=Path(a['source'])
        if not src.exists():src=OUT/(a['id']+'.png')
        key=a['folder']+'/'+a['id']
        dst=ROOT/'images'/(key+'.webp');dst.parent.mkdir(parents=True,exist_ok=True)
        raw=src.read_bytes();im=Image.open(src)
        if a['folder']=='items':
            im=im.convert('RGBA');im.thumbnail((256,256),Image.Resampling.LANCZOS)
            im.save(dst,'WEBP',lossless=True,method=6)
        else:im.convert('RGB').save(dst,'WEBP',quality=93,method=6)
        (OUT/(a['id']+'.png')).write_bytes(raw)
        if a.get('preview_file'):(OUT/a['preview_file']).write_bytes(raw)
        entries[key]=key+'.webp'
    manifest=ROOT/'images/manifest.js';text=manifest.read_text(encoding='utf-8')
    start=text.index('{',text.index('G.IMAGE_FILES ='));end=text.index('\n};',start)+2
    data=json.loads(text[start:end]);data.update(entries)
    manifest.write_text(text[:start]+json.dumps(dict(sorted(data.items())),ensure_ascii=False,indent=2)+text[end:],encoding='utf-8',newline='\n')
    receipts=[]
    for key,rel in entries.items():
        p=ROOT/'images'/rel
        with Image.open(p) as im:
            receipts.append(dict(key=key,file=str(p.relative_to(ROOT)),size=list(im.size),mode=im.mode,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
    (OUT/'assets.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2),encoding='utf-8')
    labels={'uninvited_covenant':'명부에 없던 세 이름','uninvited_two':'술빛 안개와 죽은 배 · 2기 동시 습격','uninvited_three':'세 갈래의 검은 포위 · 3기 동시 습격','uninvited_reconciliation':'초대장 대신 내민 손','ua_ivy_cup':'담쟁이 잔 · 매력 +8','ua_underworld_key':'봉인 열쇠 · 지력 +8','ua_coral_trident':'산호 삼지창 · 공격 41','uninvited_poseidon_highfive':'같은 바다를 치는 두 손 · 니칸드로스와 글라우코스'}
    labels['uninvited_poseidon_highfive']+=' · 사용자 동작 참고 수정본'
    cards=''.join('<figure><a href="'+a.get('preview_file',a['id']+'.png')+'"><img src="'+a.get('preview_file',a['id']+'.png')+'"></a><figcaption>'+labels[a['id']]+'</figcaption></figure>' for a in prompts)
    (OUT/'gallery.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>초대받지 못한 세 사도</title><style>body{background:#16212c;color:#ead4a7;font:18px sans-serif;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:20px}figure{margin:0}img{display:block;width:100%;max-height:430px;object-fit:contain;background:#253440}figcaption{padding:12px}</style><h1>초대받지 못한 세 사도</h1><p>암펠리오스 · 글라우코스 · 멜란티오스 / 사건 원화 5장 · 보상 원화 3장 / 두 포세이돈 사도의 하이파이브 추가</p><main>'+cards+'</main></html>',encoding='utf-8')
    print('사도 초상 6개 · 사건 그림 5개 · 보상 그림 3개:',OUT)

if __name__=='__main__':main()
