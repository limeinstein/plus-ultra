"""공주 여섯 명과 현재 명부의 마녀 전원의 보행 원화 참고 자료를 모은다."""
import json
import re
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/fairy-witch-walks-20261107'
PLAN = ROOT / 'tools/fairy_witch_walks_20261107_prompts.json'


def main():
    manifest = (ROOT/'images/manifest.js').read_text(encoding='utf-8')
    files = json.loads(re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', manifest).group(1))
    rows = []
    for ident, name, pic in [('cinderella','신데렐라','cinderella'), ('snow_white','백설공주','snow_white_player'),
                             ('sleeping_beauty','잠자는 숲속의 공주','sleeping_beauty'), ('little_mermaid','인어공주','little_mermaid_legs'),
                             ('scheherazade','셰헤라자드','scheherazade'), ('elizaveta','엘리자베타','elizaveta')]:
        rows.append({'id':ident,'name':name,'group':'princess','portrait_key':'portraits/legendary/'+pic+'_half'})
    source = (ROOT/'js/data/wanderers.js').read_text(encoding='utf-8')
    source = source[source.index('  var W = ['):source.index('  G.WITCHES = W;')]
    witches = re.findall(r"\{ id: '(w_[a-z]+)',([^\n]+)", source)
    for i, (ident, fields) in enumerate(witches):
        name = re.search(r"name: '([^']+)'", fields).group(1)
        style, role = re.search(r"style: '([^']+)'",fields).group(1), re.search(r"role: '([^']+)'",fields).group(1)
        keys = ['portraits/mates/'+ident+'_half']
        keys.append('portraits/witches/witch_'+str(i+1).zfill(2)+'_half' if i<16 else 'portraits/npc-roles/'+style+'/'+role+'_half')
        key = next(k for k in keys if k in files)
        rows.append({'id':ident,'name':name,'group':'witch','portrait_key':key})
    rows.append({'id':'w_thistle','name':'엉겅퀴 마녀 그리젤다','group':'witch','portrait_key':'portraits/legendary/w_thistle_half'})
    refs = ART/'references';refs.mkdir(parents=True,exist_ok=True)
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',23)
    for row in rows:
        src=ROOT/'images'/files[row['portrait_key']]
        dst=refs/(row['id']+src.suffix)
        shutil.copy2(src,dst)
        row['reference']=str(dst.resolve())
        row['reference_file']='images/'+files[row['portrait_key']]
        row['key']='characters/mates/'+row['id']+'/walk'
        row['source']=None
        row['prompt']=None
    for batch in range((len(rows)+7)//8):
        sheet=Image.new('RGB',(1600,1260),'#26323a');draw=ImageDraw.Draw(sheet)
        for i,row in enumerate(rows[batch*8:batch*8+8]):
            x,y=i%4*400,i//4*630
            with Image.open(row['reference']) as im:
                im=ImageOps.contain(im.convert('RGBA'),(386,586),Image.Resampling.LANCZOS)
                sheet.paste(im,(x+(400-im.width)//2,y+586-im.height),im)
            draw.text((x+8,y+590),row['name'],font=font,fill='#f5e6c8')
        sheet.save(refs/('reference-board-'+str(batch+1)+'.jpg'),quality=94)
    PLAN.write_text(json.dumps({'mode':'built-in image_gen','date':'2026-11-07','columns':4,'rows':2,'frame':[380,444],'characters':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('공주·이야기 인물 6명 + 마녀 '+str(len(witches)+1)+'명 = '+str(len(rows))+'명')


if __name__=='__main__':
    main()
