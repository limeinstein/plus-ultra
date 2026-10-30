#!/usr/bin/env python3
"""나비·곤충 30종의 네 장면 원화와 발견 연출을 제작·등록한다."""
import argparse
import json
import shutil
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps
import addition_art as common

ROOT = common.ROOT
SPEC = ROOT / 'docs/art/insects-20261030-prompts.json'
SCENES = {
    'morpho': 'Morpho butterfly in Amazon riverbank rainforest; adult upper wings brilliant electric sky blue with black margins, underside brown with eyespots',
    'glasswing': 'Greta oto glasswing butterfly in Costa Rican cloud forest; large genuinely transparent wing membranes with delicate dark brown veins and rims, small white and amber forewing accents',
    'hercules': 'male Dynastes hercules beetle on a wet Caribbean rainforest log; tan olive elytra with dark flecks, shiny black head and thorax, two extremely long opposed horns forming a pincer, six legs',
    'titanus': 'Titanus giganteus longhorn beetle in Guianan rainforest; very large dark reddish brown elongated beetle, long segmented antennae and strong jaws, NO rhinoceros horns',
    'monarchwinter': 'overwintering monarch butterflies in a Mexican highland oyamel fir forest; dense orange and black Danaus plexippus butterflies clinging in immense clusters to trunks and branches',
    'silverscarab': 'Chrysina limbata jewel scarab in Central American montane forest; small oval beetle with astonishingly smooth mirror-silver elytra and thorax, dark slender legs, natural metallic reflection',
    'lanternfly': 'Fulgora laternaria lanternfly on a tropical Venezuelan tree trunk; long peanut-shaped head extension, mottled tan folded wings, two large eye spots on exposed hindwings; an insect, not a glowing lantern',
    'lunamoth': 'Actias luna moth in temperate North American deciduous woodland; pale lime-green wings, one small round eye spot on each wing, long slender hindwing tails, feathery antennae',
    'periodical': 'Magicicada periodical cicada emergence in eastern North American oak woods; black adult bodies, bright red eyes, clear orange-veined wings and brown empty nymph shells on tree bark',
    'eightyeight': 'Diaethria clymena eighty-eight butterfly in Peruvian rainforest; underside hindwings cream-white with two black ring-shaped markings resembling a natural 88 pattern, red forewing underside, upper wings black with an iridescent blue band',
    'swallowtail': 'Papilio xuthus swallowtail butterfly beside a Korean meadow; cream-yellow wings with strong black tiger stripes, long hindwing tails, small blue and orange hindwing edge accents',
    'emeraldswallow': 'Papilio palinurus emerald swallowtail butterfly in Southeast Asian rainforest; velvety black wings crossed by a broad glowing emerald green diagonal band, small hindwing tails',
    'birdwing': 'male Ornithoptera alexandrae birdwing butterfly in New Guinea rainforest; extremely broad large black wings with rich emerald and turquoise-green panels, yellow abdomen and fine black antennae',
    'sasakia': 'male Sasakia charonda great purple emperor butterfly in Japanese deciduous forest; dark broad wings with iridescent blue-violet central sheen, cream white spots and small orange hindwing markings',
    'atlasmoth': 'Attacus atlas moth in Malay rainforest; immense rust-brown wings with cream and dark bands, translucent triangular windows, naturally curved forewing tips, feathery antennae',
    'deadleaf': 'Kallima inachus dead-leaf butterfly in Assamese woodland; closed underside exactly resembles a brown dry leaf with midrib and veins, opened upper wings reveal brilliant blue and orange bands',
    'bhutanglory': 'Bhutanitis lidderdalii Bhutan glory butterfly in Himalayan cloud forest; elegant black wings densely crossed by fine cream-white stripes, long hindwing tails, red and yellow spots near hindwing bases',
    'chalcosoma': 'male Chalcosoma chiron Caucasus rhinoceros beetle on a Sumatran forest log; glossy black body, THREE distinct long curved horns: one from head and two from thorax, six stout legs',
    'giraffestag': 'male Prosopocoilus giraffa stag beetle on a Javan tropical log; long dark black-brown body with a very long paired set of serrated antler-like mandibles, NO rhinoceros horn',
    'tamamushi': 'Chrysochroa fulgidissima jewel beetle on a Korean forest leaf; slender elongated metallic emerald-green body with two fine red-copper longitudinal stripes down its smooth elytra',
    'fireflyriver': 'synchronously flashing Pteroptyx fireflies among mangroves lining a quiet Malay river at night; warm yellow-green tiny natural points of light reflected in still water, tropical dark forest silhouettes, no artificial lamps',
    'orchidmantis': 'Hymenopus coronatus orchid mantis on a tropical orchid; white and pale pink body, broad petal-shaped leg lobes, triangular head, two folded raptorial forelegs, anatomically plausible six-legged mantis',
    'rainbowstag': 'male Phalacrognathus muelleri rainbow stag beetle in Queensland rainforest; glossy metallic green, copper-red and purple elytra, paired curved serrated jaws, six legs',
    'sunsetmoth': 'Chrysiridia rhipheus Madagascan sunset moth in Malagasy forest; spectacular iridescent green, blue and orange bands on black wings, elegant short white-fringed hindwing tails',
    'cometmoth': 'male Argema mittrei Madagascan comet moth in Malagasy rainforest; broad pale golden-yellow wings with four red-brown eye spots and extremely long narrow reddish-yellow hindwing tails',
    'giantswallow': 'male Papilio antimachus African giant swallowtail in Cameroonian rainforest; exceptionally long narrow orange-brown wings with bold black reticulated markings, no exaggerated fantasy tails',
    'goliath': 'male Goliathus goliatus beetle on a West African tropical log; large stout beetle with black and white striped thorax, chestnut-brown elytra, small forked Y-shaped head horn and six strong legs',
    'sacredscarab': 'Scarabaeus sacer sacred dung beetle on a sandy Nile bank; stout matt black scarab with a shovel-like head and toothed front legs, pushing a round brown dung ball, a living ordinary insect without gold ornaments',
    'motherpearl': 'Salamis parhassus mother-of-pearl butterfly in East African forest; broad pearly white wings with subtle violet iridescence, dark violet-brown margins and small eye-like markings',
    'peacockbf': 'Aglais io European peacock butterfly on a woodland nettle; rich rusty-red wings with FOUR prominent blue, black, cream and yellow eye spots, one on each wing',
}
BEETLES = {'hercules','titanus','silverscarab','chalcosoma','giraffestag','tamamushi','rainbowstag','goliath','sacredscarab'}

def prepare():
    if SPEC.exists():
        raise FileExistsError('기존 제작 기록은 보존합니다: ' + str(SPEC))
    data = common.runtime()
    disc = {d['id']: d for d in data['discoveries']}
    rows = []
    for iid, subject in SCENES.items():
        if iid == 'monarchwinter':
            sequence = '1 distant shaded fir forest with brown folded-wing clusters camouflaged on trunks; 2 closer clusters of individually visible closed-wing monarchs; 3 orange wings begin opening in sunlight; 4 a magnificent wide view of countless orange monarch butterflies covering trees, with several clear complete adults in foreground'
        elif iid == 'fireflyriver':
            sequence = '1 dark tranquil moonlit mangrove river without visible firefly lights; 2 a few natural firefly points begin glowing among leaves; 3 dozens of flashing points and close individual tiny beetles; 4 hundreds of delicate warm firefly points along the river and their reflections, retaining dark natural night exposure'
        elif iid == 'periodical':
            sequence = '1 small cracks in leaf-covered woodland soil; 2 a brown cicada nymph climbs tree bark; 3 a pale winged adult emerges beside its empty brown shell; 4 several complete black red-eyed adults with transparent wings on a trunk and a woodland emergence behind'
        elif iid == 'orchidmantis':
            sequence = '1 only a camouflaged foreleg and antenna peek from behind an orchid; 2 a small white-pink mantis nymph appears; 3 the adult mantis slowly unfolds its petal-like forelegs; 4 one complete adult orchid mantis stands clearly on an orchid petal'
        elif iid in BEETLES:
            sequence = '1 a concealed beetle antenna or foreleg peeks out of its natural log or leaf shelter; 2 the adult beetle head and thorax emerge; 3 the same adult crawls into view from a side angle showing natural joints; 4 the whole adult beetle in a clear three-quarter macro view with both antennae, all six legs and complete horns or mandibles fully inside the picture'
        elif iid == 'lanternfly':
            sequence = '1 camouflaged mottled folded wings against tree bark; 2 the full head and its peanut-shaped extension come into view; 3 the same adult begins spreading its wings; 4 one complete adult with wings open showing its natural hindwing eye spots'
        elif iid == 'deadleaf':
            sequence = '1 a brown leaf-like shape hidden among dry leaves; 2 the same butterfly with its leaf-veined wings closed is visible in profile; 3 it starts opening wings to reveal blue and orange; 4 the complete adult butterfly has its vivid blue-orange upper wings spread, all wing edges fully visible'
        else:
            sequence = '1 the species is partly concealed as a small natural caterpillar on a leaf; 2 a natural pupa or cocoon hangs in its habitat; 3 the adult has just emerged and begins opening its wings; 4 one complete beautiful adult with fully spread wings, both antennae and all wing tips and long tails fully inside the picture'
        prompt = ('Use case: stylized-concept. Asset type: historical exploration game insect discovery master storyboard. '
                  'Create ONE EXACT regular 2-column by 2-row grid, FOUR equally sized WIDE landscape panels. '
                  'Overall image landscape 9:4, approximately 2304x1024; every panel also wide 9:4. '
                  'Subject: ' + subject + '. Sequence read left to right, top to bottom: ' + sequence + '. '
                  'Each panel is a separate continuous natural scene of this species in the same coherent habitat. '
                  'Detailed hand-painted natural history illustration, delicate watercolor and fine ink with rich believable textures and soft cinematic natural lighting. '
                  'Respect insect anatomy, six legs and two antennae, true wing structure and species markings. '
                  'The final complete insect occupies at most 65 percent of its panel height and 75 percent of width, with ample natural habitat on all sides so wings, tails and horns cannot be cropped. '
                  'No anthropomorphic parent-and-baby scenes, no people, no hands, no pinned specimens, no glass cases, no captions, text, numbers, logos or watermarks. Thin straight grid lines only.')
        d = disc[iid]
        rows.append(dict(id=iid, name=d.get('realName',d['name']), kind='animal', description=d.get('desc',''),
                         target=f'tools/insect_gifs/sources/{iid}.png', prompt=prompt))
    SPEC.write_text(json.dumps(dict(generator='built-in image_gen',assets=rows),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('곤충 원화 계획',len(rows))

def record(iid, source):
    data=json.loads(SPEC.read_text(encoding='utf-8')); row=next(r for r in data['assets'] if r['id']==iid)
    dest=ROOT/row['target']
    if dest.exists(): raise FileExistsError(dest)
    dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
    row['generated_source']=str(source)
    with Image.open(dest) as im:row['source_size']=list(im.size)
    SPEC.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(iid,'원화 저장')

def build():
    data=json.loads(SPEC.read_text(encoding='utf-8'))
    missing=[r['id'] for r in data['assets'] if not (ROOT/r['target']).exists()]
    if missing:raise ValueError('원화 누락: '+','.join(missing))
    animal=common.module('insect_animal','tools/animal_gifs','build.py')
    animal.SOURCES=ROOT/'tools/insect_gifs/sources'
    def panels(src):
        # 생성된 2×2 원화의 실제 칸막이를 찾고, 긴 꼬리·뿔까지 통째로 넣는다.
        red,green,blue=src.convert('RGB').split()
        mask=ImageChops.darker(ImageChops.darker(red,green),blue).point(lambda v:255 if v>200 else 0)
        def boundary(vertical):
            size=src.width if vertical else src.height
            def score(i):
                line=mask.crop((i,0,i+1,src.height) if vertical else (0,i,src.width,i+1))
                return line.histogram()[255],-abs(i-size/2)
            return max(range(int(size*.35),int(size*.65)),key=score)
        xs,ys=[0,boundary(True),src.width],[0,boundary(False),src.height]
        framed=[]
        for y in range(2):
            for x in range(2):
                box=(xs[x]+3,ys[y]+3,xs[x+1]-3,ys[y+1]-3)
                cell=src.crop(box).convert('RGB')
                bg=ImageOps.fit(cell,(576,256),Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(16))
                fg=ImageOps.contain(cell,(576,256),Image.Resampling.LANCZOS)
                bg.paste(fg,((576-fg.width)//2,(256-fg.height)//2))
                framed.append(bg)
        return framed
    animal.split_storyboard=panels
    sheets=common.module('insect_sheets','tools/ruin_gifs','sheets.py')
    for row in data['assets']:
        iid=row['id']
        files=[f'images/discoveries/{iid}.gif',f'images/discovery-ends/{iid}.jpg',f'images/discovery-sheets/{iid}.webp']
        if any((ROOT/f).exists() for f in files):
            if row.get('files')!=files or not all((ROOT/f).exists() for f in files):raise FileExistsError('기존 그림 보존: '+iid)
        else:
            animal.build_one(iid);sheets.build(iid,True)
        row['files']=files
        print(iid,'발견 연출 저장',flush=True)
    SPEC.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    common.register(data['assets'])
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
    out=Image.new('RGB',(1440,6*166),'#283039');draw=ImageDraw.Draw(out)
    for i,row in enumerate(data['assets']):
        x,y=i%5*288,i//5*166
        with Image.open(ROOT/row['files'][1]) as im:
            out.paste(im.resize((276,123),Image.Resampling.LANCZOS),(x+6,y+6))
        draw.text((x+8,y+136),row['name'],font=font,fill='#f4e7c8')
    out.save(ROOT/'docs/art/insects-20261030-preview.jpg',quality=93)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['prepare','record','build']);p.add_argument('--id');p.add_argument('--source',type=Path);a=p.parse_args()
    if a.action=='prepare':prepare()
    elif a.action=='record':record(a.id,a.source)
    else:build()
