"""네덜란드2·벨기에2·독일3: 게임용 여급 초상 제작 명세와 참고 원본 보관."""
import json,re,shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/lowlands-german-maids-20261109'
PLAN=ROOT/'tools/lowlands_german_maids_20261109_prompts.json'
ROWS=[
('netherlands_01','네덜란드',1,'lowlands','480ce7eb-2080-46ba-8e75-75ce4bb5ca2f',
 'Keep the green bandana, shaggy dark-brown hair with wispy bangs and thin decorated braids, pale green-blue eyes, freckles, relaxed slightly parted lips WITHOUT smiling and the frontal slightly tilted face. Seated with one knee raised, forearm resting across that knee and the fingers hanging down. Preserve the face and shoulder angles.',
 'An emerald and burnt-orange brocade laced tavern bodice, ivory blouse falling off the shoulders with short loose sleeves, broad low square neckline, copper-red skirt and a cream linen apron draped over the knees. Layered turquoise-and-bronze necklaces and bracelets; small waist pouch.'),
('netherlands_02','네덜란드',2,'lowlands','d20a70e3-4d36-46c7-ad87-4b8cac9b4172',
 'Keep the head leaning into the palm on screen LEFT, elbow supported on the raised knee, seated leaning torso, pale eyes meeting the viewer, freckles and faint CLOSED-lip half-smile. Preserve shaggy dark hair, wispy bangs and tiny beaded braids. The hand must actually support the cheek with the same head tilt.',
 'A peacock-blue and ochre-gold embroidered fitted tavern bodice, wide sweetheart neckline with opaque fabric over the bust, cream dropped-shoulder sleeves, rust-red skirt and small striped linen apron over the lap. Copper pendants, turquoise beads, rings and stacked bracelets.'),
('belgium_01','벨기에',1,'lowlands','822ca58c-c57b-431a-a85f-d235db3f6eae',
 'Preserve the oblique seated torso, slightly tilted head, direct pale green-blue eyes, freckles, softly parted lips without a smile, shaggy dark hair with thin braids and crescent earrings. Keep the hand on screen LEFT raised near the cheek in the photographed finger gesture, replacing the smoking object with a tiny rosemary sprig. Other arm rests low across the lap.',
 'A deep plum and copper Flemish-inspired tavern bodice with fine floral brocade, broad shaped low neckline and opaque supportive fabric, an ivory short-sleeved blouse slipped slightly off one shoulder, teal skirt and pale gold apron. Layered silver crescent pendants, delicate rings and gem earrings.'),
('belgium_02','벨기에',2,'lowlands','37e0f277-abf4-453f-b8ed-4adb3d4e5e07',
 'Keep the near-profile face turned toward screen RIGHT, thoughtful eyes looking RIGHT, softly parted lips and NO smile, freckles, messy high ponytail with loose bangs and curled face strands. Keep both hands around a black ceramic mug bearing small crescent and star decoration at the lower chest/waist as in the reference. Reconstruct the seated body around that profile, never turn the face front.',
 'A rich burgundy and antique-gold Flemish-inspired tavern dress, fitted laced bodice with a broad low neckline and fully opaque bust, cream off-shoulder sleeves, dark green skirt and ivory apron. Several fine silver crescent-and-turquoise necklaces, earrings and bracelets.'),
('germany_01','독일',1,'germany','aacc9e1d-1a80-4fb5-8d39-8114579fe3d3',
 'Preserve the long straight center-parted black hair, pale blue eyes, freckles, quiet unsmiling expression with slightly parted lips, slightly oblique head and seated body. One raised knee supports the forearm, the hand hanging low in the same gesture; replace the smoking object with a small folded linen serving cloth.',
 'A sapphire and crimson German tavern dress, close-fitting embroidered laced bodice with a broad low square neckline, opaque supportive fabric across the bust, ivory short puff sleeves with open shoulders, ruby skirt and pale blue linen apron over the lap. Layered silver necklaces with dark blue stones, rings and a leather belt pouch.'),
('germany_02','독일',2,'germany','bc5fda90-24f1-4071-88f4-3ad9a927f83d',
 'Keep this specific different face: warm brown eyes, softly arched brows, gently CLOSED lips with a friendly half-smile, slight head tilt, center-parted long loose black waves and direct gaze. Extend the photographed upright shoulders into a relaxed standing body to both knees; both hands hold a folded serving cloth naturally low at the waist. Do not substitute the freckled face from the other references.',
 'A vivid forest-green and gold German tavern bodice with a broad sweetheart neckline, fully opaque bust, ivory off-shoulder short sleeves, rich amber skirt and cream apron. Golden filigree earrings, layered amber necklaces, bracelets and a decorative belt clasp.'),
('germany_03','독일',3,'germany','9cc28c9a-786e-4049-9392-7883ee618a04',
 'Preserve the downward gaze toward the mug, lowered chin, slightly parted relaxed lips, freckles, messy high ponytail, loose bangs and curled strands. Both hands hold the black crescent-and-star mug near her lips, in the SAME positions and orientation. Keep the forward seated lean and reconstruct the lower body through both knees. Do not make eye contact or add a smile.',
 'An aubergine and emerald German tavern dress, embroidered laced bodice with broad low neckline and opaque supportive fabric over the bust, ivory blouse with loose off-shoulder sleeves, dark purple skirt and golden linen apron. Fine silver and turquoise necklaces, earrings and rings.')
]

def main():
    if PLAN.exists():
        print('기존 제작 명세 보존');return
    files=json.loads(re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',(ROOT/'images/manifest.js').read_text(encoding='utf-8')).group(1))
    nexts={}
    for style in {r[3] for r in ROWS}:
        used=[int(k.rsplit('/',1)[1]) for k in files if k.startswith('maid-styles/'+style+'/') and k.rsplit('/',1)[1].isdigit()]
        used += [int(p.stem) for p in (ROOT/'images/maid-styles'/style).glob('*') if p.stem.isdigit()]
        nexts[style]=max(used,default=0)+1
    (ART/'references').mkdir(parents=True,exist_ok=True)
    out=[]
    for id_,group,number,style,uuid,pose,outfit in ROWS:
        ref=Path('C:/Users/User/AppData/Local/Temp')/('codex-clipboard-'+uuid+'.png')
        dest=ART/'references'/ref.name
        if not dest.exists():shutil.copy2(ref,dest)
        key='maid-styles/'+style+'/'+str(nexts[style]);nexts[style]+=1
        style_ref='images/maid-styles/'+style+'/1_half.webp'
        prompt=('Use case: identity-preserve / style-transfer. Create a production portrait for a historical sailing-adventure game. Image 1 is the PRIMARY identity, expression, hairstyle, head direction and gesture reference. Image 2 is ONLY a reference for the game\'s polished semi-realistic painted rendering, material detail and isolated character presentation; do not copy image 2\'s face, hairstyle, pose or high collar. Reconstruct the whole woman around image 1\'s photographed pose, wearing the outfit specified below. She is clearly a mature adult tavern waitress, around age thirty, with an attractive naturally full-busted curvy figure, balanced adult anatomy and a normal small head relative to shoulders/body (about 7.5 heads standing-equivalent). Follow the actual eye, nose, mouth and jaw shapes closely. Face, hair and pose: '+pose+' Costume: '+outfit+' Clothing is a colorful historical game adaptation with open shoulders and a low neckline; all breast tissue remains covered by opaque, fitted supportive clothing. Fine hand-painted game character art, detailed face and fabrics, soft directional light, no photographic background. ONE character from the entire hairdo through BOTH KNEES, 1024x1536 portrait canvas, genuinely transparent alpha background. Keep all hair, elbows, fingers and props inside the frame. No feet, background, ground shadow, glow, labels, text, watermark, collage or inset. Preserve the photographed expression, avoid a generic face or automatic smile. The corresponding face portrait will be cropped from this same artwork.')
        out.append(dict(id=id_,group=group,number=number,style=style,key=key,reference=dest.relative_to(ROOT).as_posix(),style_reference=style_ref,pose=pose,outfit=outfit,prompt=prompt))
    spec=dict(date='2026-11-09',mode='built-in image_gen edit',scope='네덜란드2·벨기에2·독일3: 게임용 얼굴상·무릎상14장',event_shots=False,portraits=out)
    PLAN.write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('7명·14장 제작 명세·참고 사진 보관 완료')

if __name__=='__main__':main()
