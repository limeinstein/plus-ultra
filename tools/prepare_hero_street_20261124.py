"""거리에서 사용하는 제독 16종의 나머지 원화 제작 지시문을 준비한다."""
import json
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art_sources/hero-street-20261124'
RECORD=ROOT/'tools/hero_street_20261124'
PREVIEW=ROOT/'artifacts/hero-street-20261124'
CHARS=json.loads((ROOT/'tools/hero_motion_20261124/characters.json').read_text(encoding='utf-8'))

COMMON='''Use case: stylized-concept. Production transparent animation atlas for a historical maritime RPG. Image 1 is the FULL-BODY costume and boots reference from the character's current street walk. Image 2 is the FACE AND HAIRSTYLE identity reference. Create a NEW sheet with the requested actions; preserve this exact adult person's face, hair, body proportions, costume colors, accessories, garment lengths and footwear. Detailed realistic hand-painted game illustration, consistent identity throughout, not chibi. All equipment secured at waist, any sword SHEATHED throughout; empty hands for movement and gestures. Props must remain attached to the belt or genuinely held by fingers. No floating props. Every full figure including hair, fingers, feet and cloth fits wholly inside its own equal-sized cell with generous clear gutters. No duplicate extra people, grid lines, borders, labels, lettering, ground shadows, floor or background gradients. The entire background outside every silhouette must be truly transparent with actual ALPHA ZERO, not white or gray partly-transparent haze. Do not crop heads, raised hands or boots. Do not change camera zoom or figure scale between frames. '''
RUN='''EXACTLY 8 distinct full-body RUN CYCLE frames, a STRICT 4 columns x 2 rows grid on a landscape 1536x1024 canvas. All figures face RIGHT in consistent side-three-quarter view. Frame order left to right then next row: left-foot forward contact, left-leg compression, left-foot push-off with right knee forward, airborne flight, right-foot forward contact, right-leg compression, right-foot push-off with left knee forward, airborne flight. Arms pump in opposition to legs, natural relaxed five-digit hands, body leans forward modestly, coat and hair follow movement. Show clear alternating left/right strides, not walking poses. No in-place spinning, weapons in hands or acrobatic leaps.'''
BACK='''EXACTLY 8 full-body TURN-AWAY AND ENTER frames in a STRICT 4 columns x 2 rows grid, landscape 1536x1024. A single one-way progression, NOT a looping spin. Frame order: 1 relaxed RIGHT-facing profile; 2 slight turn away from viewer; 3 rear three-quarter view turned 45 degrees away; 4 rear three-quarter almost back view; 5 completely BACK-facing with left foot stepping; 6 completely BACK-facing with right foot passing; 7 completely BACK-facing opposite step; 8 completely BACK-facing standing with BOTH FEET planted. In frames 5 through 8 show only the back of the head: NO eyes, nose or front face. Preserve back of hairstyle, braid or tied hair and exact garment construction. The figure does NOT become smaller or move to the edge of a cell. No doorway, door, building, ground, props or perspective zoom: runtime adds the doorway and distance effect.'''
IDLE='''EXACTLY 18 full-body keyframes in a STRICT 6 columns x 3 rows LANDSCAPE atlas, 1536x1024. All eighteen figures MUST show their entire body from head to BOOT SOLES. NEVER draw waist-up, thigh-up or portrait crops. Use the framing of full-body reference image 1, with every figure occupying at most 75 percent of its cell height, enough margin above raised hands and below boots. Each ROW is one six-keyframe gesture read left-to-right. Row 1, looking around: relaxed RIGHT-facing three-quarter standing; glance around and up; lift one hand toward brow; shade eyes and look into distance; lower hand; return to opening stance. Row 2, greeting: same relaxed stance; lift empty right hand to chest level; lift open hand to shoulder level; small friendly wave with palm out and five natural fingers; smoothly lower hand; return to opening stance. Row 3, stretching: same relaxed stance; hands near waist and shoulders gather; raise arms; comfortable overhead shoulder stretch with hands separated; lower arms; return to opening stance. Body stays in the same position, BOTH FEET planted, same body scale in every cell; no walking, dancing, jumping or combat. All figures face the same RIGHT-side three-quarter camera. Natural hands, attached arms, normal joint angles. Raised arms need extra transparent top margin. NO half-body portraits in any row, keep all 18 pairs of boots visible.'''

def main():
    for folder in (OUT/'raw',OUT/'before',RECORD,PREVIEW):folder.mkdir(parents=True,exist_ok=True)
    jobs=[];board=Image.new('RGB',(1600,1440),'#ded8cb');d=ImageDraw.Draw(board)
    for i,c in enumerate(CHARS):
        fid=c['id'];base=ROOT/'images/characters' if fid=='admiral' else ROOT/'images/characters'/fid
        full=next(base.glob('walk_1.*'))
        im=Image.open(full).convert('RGBA');im.thumbnail((290,310))
        x,y=(i%4)*400,(i//4)*360
        board.paste(im,(x+(400-im.width)//2,y+310-im.height),im);d.text((x+14,y+328),fid,fill='#30281f')
        for kind,spec in [('run',RUN),('back',BACK),('idle',IDLE)]:
            jobs.append({'id':fid,'kind':kind,'key':fid+'_'+kind,'references':[str(full),str(ROOT/c['reference'])],'prompt':COMMON+spec})
    order={c['id']:i for i,c in enumerate([c for c in CHARS if c['id'] in ('jessica','soyoung')]+[c for c in CHARS if c['id'] not in ('jessica','soyoung')])}
    jobs.sort(key=lambda j:order[j['id']])
    (RECORD/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf-8')
    board.save(PREVIEW/'references.jpg',quality=93)
    print('제독 16종 × 달리기·후면·대기 = 원화 48장')

if __name__=='__main__':main()
