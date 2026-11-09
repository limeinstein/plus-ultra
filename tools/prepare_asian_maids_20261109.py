"""조선2·중국3·필리핀2·인도네시아3: 사진별 얼굴·표정·자세를 고정한 제작 명세."""
import json,re,shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/asian-maids-20261109'
PLAN=ROOT/'tools/asian_maids_20261109_prompts.json'
ROWS=[
('joseon_01','조선',1,'korea','eb65206a-7068-4931-9b0c-e087de445d09',False,
 'Copy the reference\'s broad toothy smile, lifted cheeks and narrowed smiling eyes, same oblique shoulders and face turned back to meet the viewer. Keep the long loose windblown dark hair and small gold hoops. Keep both hands raised together near the upper chest, but replace the modern camera with a small Korean ceramic tea pot held in the same hands.',
 'A fully opaque azure short jeogori jacket with ivory collar, vivid rose chima skirt and long golden norigae tassel, patterned goreum ribbon. Contemporary game adaptation of Joseon tea-house clothing. Neckline and chest covered by the overlapping jacket, natural unexaggerated figure.'),
('joseon_02','조선',2,'korea','49bca465-f272-4146-9b43-7c4cf42c91f2',False,
 'Preserve the over-shoulder turn of the original photograph, wide attentive eyes, softly parted lips without a smile, long windswept wavy hair and the forward lean through neck, shoulders and torso. Continue that motion to waist and knees, with arms resting naturally low along the angled body. Do not front-face the body.',
 'Ivory silk jeogori with pale apricot embroidery, jade-green chima skirt, coral goreum ribbon and a small gold-and-jade norigae. Fully opaque overlapping jacket covers the chest, comfortable sleeves and graceful flowing skirt, natural body shape.'),
('china_01','중국',1,'china','0db0df38-e519-4ee3-bf9c-6756c6084935',False,
 'Keep the exact head tilt toward screen RIGHT, playful open smile with the same visible teeth, dark eyes toward camera, wispy bangs and low loose side bun with blue flower hairpin and bead drops. Keep the hand at the upper chest lightly touching the garment fastening; continue the same tilted shoulder line into the body.',
 'A fully opaque powder-blue floral Chinese side-fastened blouse with short sleeves, jade trim, coral-pink apron sash and flowing deep-blue skirt. Pearl-and-blue-stone hair ornament and small drop earrings. Keep the blouse fastened and the silhouette natural.'),
('china_02','중국',2,'china','ae600fa5-efcf-4b9a-837e-fd48c40405b9',False,
 'Preserve the exact thoughtful sideways gaze toward screen RIGHT, slightly pursed closed lips, head cupped in BOTH hands, elbows resting on the low wooden rail, and upper body leaning forward. Keep the two side hair rolls, long dark hair, wispy bangs, small pale flowers and long green ribbons. Reconstruct the seated lower body naturally to both knees.',
 'Jade and ivory ruqun-inspired tea-house outfit, opaque soft long-sleeved blouse, embroidered mint over-bodice and full green skirt, small waist sash and pearl hair ornaments. Covered chest and natural figure, no body exaggeration. A narrow wooden rail supports the elbows as in the photo.'),
('china_03','중국',3,'china','339fb4e9-52df-4c96-9625-8a3164fb72b8',False,
 'Match the original\'s near-front face, eyes glancing to screen RIGHT, lips gently parted with a tiny amount of teeth, raised hand on screen RIGHT and other hand on screen LEFT holding a small blossom. Keep the swept-back coiffure and long hair behind the shoulders. Reproduce the original shoulder tilt and sleeve gesture; include only a small blossom sprig in the raised hand, without the surrounding tree.',
 'A fully opaque ivory Chinese tea-house robe with very pale jade edging, flowing long sleeves and a coral sash, light floral embroidery and small jade earrings. Covered neckline and chest, waist and skirt fully clothed, no exaggerated body proportions.'),
('philippines_01','필리핀',1,'seasia','4f2fcf08-d470-4aa4-a5d7-23d9102e4a21',False,
 'Keep the seated forward lean, one cheek resting in the palm on screen LEFT, relaxed other arm extending low across the lap, small closed-lip playful smile and direct gaze. Preserve the long warm-brown hair, straight soft bangs and exact face proportions. Include a small seat edge under the hips if needed, rather than changing to a standing pose.',
 'A fully opaque ivory short-sleeved baro-inspired blouse and deep garnet wrap skirt with woven ochre-gold edging, patterned waist sash and small shell-and-gold earrings. Tea-house worker clothing, covered chest, modest natural figure and skirt covering thighs and knees.'),
('philippines_02','필리핀',2,'seasia','8ee7211f-cf9e-4760-a54f-d528bd3c708b',False,
 'Closely match the reference\'s calm direct eyes, softly closed pink lips and very faint smile, subtly tilted frontal head and long loose straight brown hair with the same parting. Continue the photographed quiet upright shoulders into a naturally clothed body to both knees, arms relaxed low with a folded tea towel at waist height.',
 'A fully opaque blue-and-ivory embroidered blouse with a broad neckline at the collarbones, short comfortable sleeves, patterned red-and-gold woven sash and a long blue wrap skirt. Small shell earrings and woven fabric decoration. Covered chest and natural unaltered figure, no emphasis on curves.'),
('indonesia_01','인도네시아',1,'tropic','791b978b-bca8-4fec-ba90-e5deb4ec5536',True,
 'Preserve the original bright toothy smile, same eye shape, slightly oblique head and shoulders, long half-up wavy brown hair, dangling earrings and both relaxed arms down by the body. Continue the same hip angle naturally to both knees.',
 'Vivid terracotta-red and gold embroidered sleeveless kemben-inspired fitted silk top with a broad shaped neckline and opaque chest coverage, a narrow exposed waist, cobalt batik wrap skirt and gem-set sash. Gold earrings, layered necklaces and bangles. Clearly mature curvy adult fashion silhouette, natural full bust supported and covered by opaque fabric, no erotic action.'),
('indonesia_02','인도네시아',2,'tropic','c23c4601-cba3-4d23-b7fa-0d0af7c492d8',True,
 'Keep the original gentle sideways head tilt and slight backward chin angle, softly parted lips, eyes toward the viewer, two long braids and embroidered cream-and-green head cloth with forehead jewellery. Both arms cradle the large two-handled jug at the waist in the SAME gesture and the torso stays oblique as photographed.',
 'Cream-and-gold embroidered short open kebaya-inspired jacket over an opaque emerald fitted inner top, narrow waist opening, deep green batik skirt, gold brooches, gemstone forehead chain and filigree earrings. The inner garment fully covers the chest and supports a mature full-busted adult figure. A large earthenware tea jug is held at waist height.'),
('indonesia_03','인도네시아',3,'tropic','21de758a-c4e5-43ee-abb8-ed38d0e997dc',True,
 'Follow the reference\'s exact seated pose with one knee raised, the hand on screen RIGHT gently touching the cheek, elbow resting toward that knee, and the opposite forearm resting across the lap. Keep the closed-lip gentle smile, relaxed direct gaze, two braids and dark embroidered head scarf with delicate coin jewellery.',
 'A rich burgundy and teal batik kebaya-inspired jacket with a broad neckline over an opaque dark fitted inner top, patterned wrap skirt covering the lap and thighs, gem brooch and stacks of silver/gold bangles. Mature adult curvy figure with natural full bust covered by opaque fabric, relaxed fully clothed seated pose. Preserve the photograph\'s ornamental scarf style while using batik fabric motifs.')
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
    for id_,group,number,style,uuid,adult,pose,outfit in ROWS:
        ref=Path('C:/Users/User/AppData/Local/Temp')/('codex-clipboard-'+uuid+'.png')
        dest=ART/'references'/ref.name
        if not dest.exists():shutil.copy2(ref,dest)
        key='maid-styles/'+style+'/'+str(nexts[style]);nexts[style]+=1
        assert key not in files
        subject=('A clearly adult woman around age thirty with balanced mature proportions. ' if adult else 'A fully clothed non-sexual historical tea-house worker portrait. Preserve the reference figure naturally without enlarging breasts, adding cleavage or emphasizing sexual features. ')
        prompt=('Use case: identity-preserve / style-transfer. The supplied original photo is the primary face, expression, hairstyle and pose reference. Reconstruct the whole character to the knees around that photographed pose, and dress her in the regional game outfit below. Follow the real eye, nose, mouth and jaw proportions closely, not a generic pretty face. '+subject+'Face and pose: '+pose+' Clothing: '+outfit+' Fine semi-realistic hand-painted historical game illustration. One character, head through both knees, 1024x1536, genuinely transparent alpha background. Natural head/neck/shoulder proportions, no giant head. All hair, elbows and fingers inside frame. No feet, scenery, text, collage, inset, watermark, glow or ground shadow. The clothing must be opaque; keep the original expression rather than adding a generic smile.')
        out.append(dict(id=id_,group=group,number=number,style=style,key=key,reference=dest.relative_to(ROOT).as_posix(),adult_fashion=adult,pose=pose,outfit=outfit,prompt=prompt))
    spec=dict(date='2026-11-09',mode='built-in image_gen edit',scope='조선2·중국3·필리핀2·인도네시아3: 얼굴상·무릎상20장, 이벤트샷 제외',portraits=out)
    PLAN.write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('10명·20장 제작 명세·참고 사진 보관')


if __name__=='__main__':main()
