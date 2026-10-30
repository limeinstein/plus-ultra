#!/usr/bin/env python3
"""10월 30일 추가 발견물과 아직 전용 그림이 없던 사건 소지품의 제작·등록."""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / 'docs/art/additions-20261030-prompts.json'
ART = ROOT / 'artifacts/additions-20261030'

ISLANDS = {
    'samui': 'Koh Samui: ivory crescent beach, coconut groves over low green hills, clear turquoise Gulf of Siam, granite rocks',
    'phuket': 'Phuket west coast: broad sandy bays below lush green headlands, distant steep limestone islets',
    'langkawi': 'Langkawi archipelago: many green limestone islands, mangrove estuaries, forested peaks and a distant waterfall, a small eagle high in the sky',
    'penang': 'Penang northern coast before colonial development: a long pale beach beneath densely wooded rolling hills, freshwater stream between granite boulders',
    'bali': 'Bali: volcanic mountain far behind terraced wet rice fields descending toward a rugged southern coast, breaking surf and a small precolonial stone sea shrine',
    'boracay': 'Boracay White Beach: exceptionally fine white sand along an elongated low palm-covered island, pale green shallows changing through turquoise to navy open sea',
    'cebu': 'Cebu and Mactan: calm narrow tropical channel between two green islands, visible coral patches under clear water, coconut grove and tiny precolonial thatched fishing huts',
    'palawan': 'Palawan El Nido: towering dark jagged limestone karst cliffs rising vertically from jade-green enclosed lagoons, hidden pale beaches and lush jungle',
    'srilanka': 'southern Sri Lanka coast: curved golden sandy bay, coconut palms leaning over the sea, a small sea turtle near the waterline and a very distant whale spout',
    'seychelles': 'Seychelles: massive smooth rounded pale grey granite boulders along a white sand cove, dense tropical foliage, turquoise water and a small giant tortoise on the sand',
    'zanzibar': 'northern Zanzibar: dazzling white coral sand, shallow tidal sea with long exposed seagrass flats, palms and one tiny distant wooden lateen dhow',
    'mauritius': 'Mauritius before settlement: a continuous ring of offshore coral reef with breaking white surf, calm turquoise lagoon, lush island with angular volcanic mountains, a small dodo at the forest edge',
    'okinawa': 'Okinawa west coast: pale jade lagoon within a fringing coral reef, low subtropical hills and a tiny old Ryukyu hamlet with red clay tile roofs',
    'jeju': 'Jeju Hyeopjae western beach: white sand, black basalt shore rocks and dry stone walls, jade to indigo water, small Biyangdo islet offshore, broad distant Hallasan volcano, no coconut palms',
    'mallorca': 'northern Mallorca Formentor: high limestone headlands and pine forest descending to glass-clear tiny coves, olive and almond groves',
    'ibiza': 'Ibiza before modern development: low pine-covered Mediterranean island, broad white sandy cove, clear blue sea and modest traditional salt pans visible in the southern flatlands',
    'sardinia': 'northeastern Sardinia: wind-carved pinkish granite boulders, Mediterranean scrub, tiny emerald-water inlets with clear visible rippled sand',
    'capri': 'Capri Blue Grotto: view from inside the low natural limestone sea cave across intensely luminous blue water toward the small low sea entrance; ancient natural cavern, no constructed doorway',
    'sicily': 'Sicily Taormina coast: Isola Bella rocky green islet joined to shore by a thin sandy tombolo, steep coastal cliffs, distant smoking Mount Etna and citrus groves',
    'malta': 'Malta Comino Blue Lagoon: narrow pale cyan lagoon between low ochre limestone islands, bare rocky headlands, clear water revealing the sandy seabed',
    'milos': 'Milos Sarakiniko: flowing smooth brilliant white volcanic rock formations and small sea caves around deep cobalt-blue water, sparse dry vegetation',
    'santorini': 'Santorini before modern tourism: immense semicircular dark volcanic caldera cliffs surrounding deep blue water, sparse small simple whitewashed medieval houses atop the rim; no modern hotels or swimming pools',
    'madeira': 'Madeira: steep lush green mountains rising directly from the Atlantic, small cultivated terraces and narrow old irrigation channels, tall sea cliffs and native flowering vegetation',
    'azores': 'Azores Sete Cidades: two adjacent blue and green lakes enclosed by one broad lush volcanic caldera, rolling fern-covered slopes, mist and distant Atlantic coastline',
    'skye': 'Isle of Skye: rugged dark Cuillin mountains, sweeping green moorland, steep sea cliffs and a cold indigo inlet under shifting clouds; no palm trees',
    'bahamas': 'Bahamas: low flat sandy islands and mangrove cays, very shallow translucent turquoise banks in long sandbar patterns, darker blue channels',
    'jamaica': 'Jamaica north coast before tourism: lush mountainous green island with broad golden-white sandy bay, coconut groves, small river reaching the turquoise sea',
    'dominica': 'Dominica: steep rainforest-covered volcanic mountains, waterfalls reaching a dark rugged coastal cove, humid mists, deep blue Caribbean Sea; no broad white resort beach',
    'stlucia': 'Saint Lucia: two distinct steep pointed Piton volcanic peaks beside a lush coastal bay, small sandy crescent and dense rainforest',
    'grenada': 'Grenada: green rounded volcanic hills behind a long curved pale beach, tropical rainforest and quiet clear Caribbean water, no modern structures',
    'aruba': 'Aruba: dry low Caribbean island, wind-bent divi-divi trees, cactus and scrub behind white sand, intense turquoise sea; arid landscape, not tropical jungle',
    'goldenisles': 'Georgia Golden Isles before colonial settlement: low Atlantic barrier islands, golden sand dunes, extensive salt marsh tidal creeks, maritime live oak forest draped with Spanish moss',
    'maui': 'Maui: broad Haleakala volcanic mountain in the distance, lush green valleys opening to a long golden sandy bay, offshore deep blue Pacific water and breaking white surf',
    'oahu': 'Oahu north shore, not Waikiki: tall curling white ocean waves approaching an open sandy beach, green sharp ridges far inland, scattered coastal palms, no Diamond Head foreground',
    'fiji': 'Fiji: scattered emerald volcanic islands surrounded by fringing coral reefs, white beaches, clear turquoise lagoons, tiny distant traditional thatched village',
    'tahiti': 'Tahiti: very tall lush jagged volcanic interior mountains behind a palm-fringed dark volcanic shoreline, calm turquoise lagoon inside a reef, no overwater bungalows',
    'borabora': 'Bora Bora before European development: Mount Otemanu dramatic twin volcanic crags inside a luminous turquoise lagoon enclosed by a low white sand coral motu ring, no bungalows',
    'cookisles': 'Cook Islands Aitutaki: broad shallow turquoise triangular lagoon dotted with low palm-covered coral motu and long bright white sandbars, distant low lush main island',
}

RUINS = {
    'constbaths': 'Baths of Constantine on Rome\'s Quirinal Hill: Roman brick barrel vaults, semicircular bath chambers, marble columns and dolphin floor mosaics. Real-world views show the partly collapsed overgrown ruins as encountered around 1500, not a complete modern reconstruction.',
    'septizodium': 'Septizodium at the southern Palatine in Rome: a tall freestanding three-storey theatrical facade of stacked Corinthian marble columns and entablatures, no building behind it, partly ruined as it stood before demolition in 1588. Do not replace it with the Colosseum or a round temple.',
    'worcesterwall': 'Medieval Worcester city walls: red sandstone curtain walls with battlements and a fortified arched town gate beside the River Severn, Worcester Cathedral behind the river-facing wall, late medieval English town. No fantasy castle.',
    'manwoldae': 'Manwoldae Goryeo palace site at Kaesong below Songaksan: tiered grey stone terraces, grand stone stairways and rows of bare foundation stones on a green hillside. Model construction may reconstruct a restrained Goryeo palace with grey tiled hipped roofs; all full-scale views must show the empty ruined palace foundations after the 1361 fire, no standing modern Joseon palace.',
    'somnath': 'Somnath temple on the Gujarat Arabian Sea coast as a modest medieval Hindu stone temple repeatedly damaged and rebuilt: carved sandstone mandapa, shikhara shrine tower, waves and sea-facing enclosure; restrained medieval interpretation, not the modern twentieth-century monumental reconstruction.',
    'alnuri': 'Great al-Nuri Mosque in medieval Mosul: distinctive visibly leaning tall cylindrical brick al-Hadba minaret with seven decorative geometric bands, a low prayer hall and courtyard, old warm-toned Tigris city. Show its intact premodern appearance, not the modern destroyed ruins.',
    'aleppomosque': 'Great Mosque of Aleppo before modern destruction: tall square five-tier carved stone Seljuk minaret, immense courtyard of alternating dark and pale geometric paving, arcaded prayer hall with low roofs, old Aleppo bazaar and citadel beyond. Never use a cylindrical minaret.',
}

ITEMS = {
    'redshoes': 'a pair of worn little red leather shoes with rounded toes and simple straps, lovingly preserved medieval Scandinavian keepsake',
    'pinocchio_doll': 'a small jointed carved wooden boy marionette with a long wooden nose, simple painted cap and clothes, visible wooden joints, handcrafted old Italian toy',
    'buwaya_pearl': 'one magnificent lustrous black pearl with subtle green-violet iridescence, large round smooth pearl, no jewelry setting',
    'babur_page': 'one aged cream manuscript leaf with fine flowing Chagatai calligraphic ink marks and a small Mughal garden illustration, rolled corner, no modern notebook',
    'colon_egg': 'one ordinary boiled white egg standing upright on its slightly cracked flattened bottom, subtle shell crack at base, no cup or stand',
    'cemi': 'a small ancient Taino three-pointed stone cemi idol, triangular rounded grey carved stone body and prominent large carved eyes, museum artifact',
    'luther_note': 'one torn handwritten cream notebook leaf with dense sixteenth-century German ink marks, folded corner and uneven torn binding edge, no readable writing required',
    'principia': 'a small group of three seventeenth-century brown leather-bound mathematical volumes, one open at an engraved geometric diagram of an orbit, gilt tooling and worn cream pages; no invented readable titles',
    'fish_history': 'a large open seventeenth-century natural-history folio showing beautifully engraved full fish specimens on aged cream paper, worn brown leather binding, no modern photographs',
    'teppo_chaire': 'a tiny precious Japanese Sengoku tea caddy chaire: rounded dark brown glazed ceramic jar with a small ivory-colored lid, restrained irregular glaze, no handle or spout',
    'teppo_gourd': 'a palm-sized brilliant gold double-lobed Japanese hyotan gourd ornament with narrow waist, red cord at the neck, finely worked hammered metal',
    'kongo_raffia': 'a folded royal Kongo raffia cloth, rich ochre-brown natural fibers with dense dark geometric zigzag and diamond patterns, soft velvet-like woven texture',
    'kongo_horn': 'an old royal Kongo side-blown ivory oliphant horn carved from one curved tusk, small side mouthpiece and incised geometric ornament with a small cross, aged warm ivory',
    'sky_derev': 'an open sixteenth-century brown leather astronomy book with a simple heliocentric diagram of concentric circular planetary orbits around a small central sun, cream paper and red page edges',
    'sky_kcompass': 'a Renaissance maritime compass in a worn wooden box, fine brass magnetic needle and compass rose, an additional precisely engraved brass declination ring surrounding the dial',
    'sky_rudolph': 'an open seventeenth-century astronomical tables folio, densely ruled orderly columns of tiny numbers, a small star chart in one corner, brown leather binding and aged ivory paper',
    'sky_gscope': 'Galileo-style early seventeenth-century long narrow wooden refracting telescope wrapped in dark russet leather, simple brass lens rims at both ends, diagonal composition, no modern mount',
    'sky_twosci': 'an open seventeenth-century leather-bound scientific book showing simple geometric falling-body and inclined-plane diagrams on warm cream pages, subtle black letterpress marks',
    'glory_banner': 'a folded late-seventeenth-century orange silk House of Orange military banner with a modest crowned blue heraldic shield and small gold lion motif, embroidered edges and natural heavy fabric folds, no invented readable lettering',
    'glory_ring': 'a seventeenth-century English royal gold signet ring, broad oval face engraved with a crowned heraldic shield, deep rich gold patina, three-quarter view showing ring band',
    'glory_decl': 'a single folded seventeenth-century English printed declaration sheet, fine orderly letterpress ink marks on cream rag paper, modest ornamental headpiece, no readable words needed',
    'globe_papers': 'a small open oak manuscript chest rescued from a seventeenth-century theater fire, dark scorched corners and iron straps, bundles of handwritten drama pages tied with ribbon inside, a faint soot handprint',
    'imjin_silk': 'a small open late-sixteenth-century Korean wooden travel chest containing tightly rolled fine silk bolts in muted ivory, indigo, jade and red, iron hinges and traditional Korean clasp, no Chinese dragon motif',
    'imjin_gat': 'one traditional Korean Joseon black gat headdress: tall narrow cylindrical translucent woven horsehair crown and very broad thin circular brim, delicate black chin cords, lightweight black lacquer mesh, no feather',
}


def runtime():
    code = r'''const fs=require('fs'),vm=require('vm');global.window=global;global.document={};global.G={};
for(const m of fs.readFileSync('index.html','utf8').matchAll(/<script src="([^"]+)"/g))
if(m[1]==='js/core/util.js'||m[1].startsWith('js/data/'))vm.runInThisContext(fs.readFileSync(m[1],'utf8'),{filename:m[1]});
console.log(JSON.stringify({discoveries:G.DISCOVERIES,items:G.ITEMS,relics:Object.values(G.RELIC)}));'''
    return json.loads(subprocess.check_output(['node', '-e', code], cwd=ROOT, encoding='utf-8'))


def prepare():
    data = runtime()
    disc = {d['id']: d for d in data['discoveries']}
    items = {d['id']: d for d in data['items']}
    rows = []
    for did, scene in {**ISLANDS, **RUINS}.items():
        d = disc[did]
        kind = 'nature' if did in ISLANDS else 'ruin'
        if kind == 'nature':
            prompt = ('Use case: stylized-concept. Asset type: historical exploration game nature discovery panorama. '
                      'Create one uninterrupted extremely wide 3:1 panoramic landscape of ' + scene + '. '
                      'Richly detailed hand-painted watercolor with delicate ink linework, refined historical travel sketchbook, '
                      'believable geography and natural texture. Distant elevated viewpoint, stable horizon, generous scenery '
                      'extending left and right for a cinematic camera pan. Balanced early daylight. Set before modern development. '
                      'No modern structures, resorts, piers, modern boats, tourists, signs, text, labels, panels, collage, frame, border, logo or watermark. '
                      'Output landscape panorama, approximately 2048x683.')
            target = f'tools/nature_gifs/sources/{did}.png'
        else:
            prompt = ('Use case: historical-scene. Asset type: game discovery animation master storyboard. '
                      'Create ONE EXACT 4-column by 4-row regular grid, exactly 16 equally sized rectangular panels, '
                      'overall landscape 4:3 image at least 2048x1536. Read left to right, top to bottom. '
                      'All panels depict the SAME coherent historical site: ' + scene + ' '
                      'Panels 1-5 only: tabletop miniature construction on an old wooden drafting desk with parchment architectural drawings: '
                      '1 foundations laid out, 2 masonry rising, 3 structure, 4 facade and roof details, 5 complete model. '
                      'Panel 6: match-cut to the full-scale actual historical site in its period condition. '
                      '7 approach its entrance, 8 eye-level view through its actual central space, 9 a second interior view or open ruined precinct if no surviving interior, '
                      '10 exit looking out. Panels 11-16: wide full-building views progressing around the site from different angles, '
                      '11 midday, 12 late afternoon, 13 sunset, 14 moonlit night, 15 blue dawn, 16 sunrise. '
                      'No invented rooms for ruins, facades or walls. Keep historical materials, building silhouette and geography consistent. '
                      'Richly detailed painterly historical illustration, warm cinematic natural light, convincing materials. '
                      'Keep whole roofs and towers inside each panel. Thin straight grid dividers only. '
                      'No text, letters, captions, labels, panel numbers, logos, watermark, modern buildings or modern machines.')
            target = f'tools/ruin_gifs/v3/master/{did}.png'
        rows.append(dict(id=did, name=d.get('realName', d['name']), kind=kind, description=d.get('desc', ''), target=target, prompt=prompt))
    for iid, scene in ITEMS.items():
        d = items[iid]
        rows.append(dict(id=iid, name=d['name'], kind='item', description=d.get('desc', ''),
                         target=f'tools/addition_art/sources/{iid}.png', prompt=icon_prompt(scene)))
    for d in data['relics']:
        if d.get('relic') not in RUINS:
            continue
        rows.append(dict(id=d['id'], name=d['name'], kind='relic', description=d.get('desc', ''),
                         target=f'tools/addition_art/sources/{d["id"]}.png',
                         prompt=icon_prompt(d['name'] + ': ' + d['desc'])))
    SPEC.parent.mkdir(parents=True, exist_ok=True)
    SPEC.write_text(json.dumps(dict(generator='built-in image_gen', assets=rows), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'count': len(rows), 'assets': rows}, ensure_ascii=False))


def icon_prompt(scene):
    return ('Use case: historical-scene. Asset type: isolated transparent inventory icon for a richly illustrated historical exploration game. '
            'Paint ' + scene + '. One object or the specified coherent set only, centered and completely visible, '
            'three-quarter museum catalog view, fill about 80 percent of a square canvas with generous clear margin on every side. '
            'Detailed hand-painted realistic watercolor and fine ink with convincing worn materials, warm natural highlights, '
            'crisp readable silhouette at small icon sizes, matching an old maritime adventure inventory. '
            'Genuinely transparent background, no floor, no scenery, no hands or people, no stand, no cast shadow outside the object, '
            'no frame, no border, no labels, no readable text, no logo, no watermark. Square image.')


def record(iid, source, revision=False):
    data = json.loads(SPEC.read_text(encoding='utf-8'))
    row = next(r for r in data['assets'] if r['id'] == iid)
    destination = ROOT / row['target']
    if revision:
        prompts = json.loads((ROOT / 'docs/art/additions-20261030-revisions.json').read_text(encoding='utf-8'))
        row.setdefault('previous_versions', []).append({k: row[k] for k in ('target', 'prompt', 'generated_source') if k in row})
        row['prompt'] = prompts[iid]
        if destination.exists():
            destination = destination.with_stem(re.sub(r'-v\d+$', '', destination.stem))
            version = 2
            while destination.with_stem(destination.stem + f'-v{version}').exists():
                version += 1
            destination = destination.with_stem(destination.stem + f'-v{version}')
            row['target'] = destination.relative_to(ROOT).as_posix()
    if destination.exists():
        raise FileExistsError(f'기존 원화는 덮지 않음: {destination}')
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    row['generated_source'] = str(source)
    with Image.open(destination) as im:
        row['source_size'] = list(im.size)
    SPEC.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(iid, '원화 저장', row['source_size'])


def module(name, directory, filename):
    sys.path.insert(0, str(ROOT / directory))
    spec = importlib.util.spec_from_file_location(name, ROOT / directory / filename)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


def cinematic_cells(path, fit):
    """생성 원화의 실제 흰 칸막이를 찾아 옆 장면이 끼어들지 않게 자른다."""
    with Image.open(path) as raw:
        src = raw.convert('RGB')
    red, green, blue = src.split()
    white = ImageChops.darker(ImageChops.darker(red, green), blue).point(lambda p: 255 if p > 200 else 0)
    def boundaries(vertical):
        size = src.width if vertical else src.height
        points = [0]
        for i in (1, 2, 3):
            center = size*i/4
            def score(p):
                line = white.crop((p, 0, p+1, src.height) if vertical else (0, p, src.width, p+1))
                return line.histogram()[255], -abs(p-center)
            points.append(max(range(int(center-size*.06), int(center+size*.06)), key=score))
        return points + [size]
    xs, ys = boundaries(True), boundaries(False)
    boxes = [(xs[x]+2, ys[y]+2, xs[x+1]-2, ys[y+1]-2) for y in range(4) for x in range(4)]
    return [fit(src.crop(box)) for box in boxes], boxes


def build(refresh=False):
    data = json.loads(SPEC.read_text(encoding='utf-8'))
    missing = [r['id'] for r in data['assets'] if not (ROOT / r['target']).is_file()]
    if missing:
        raise ValueError('원화 누락: ' + ', '.join(missing))
    nature = module('addition_nature', 'tools/nature_gifs', 'build.py')
    ruin = module('addition_ruin', 'tools/ruin_gifs', 'build_cinematic.py')
    sheets = module('addition_sheets', 'tools/ruin_gifs', 'sheets.py')
    for row in data['assets']:
        iid, kind = row['id'], row['kind']
        source = ROOT / row['target']
        expected = ([ROOT / f'images/discoveries/{iid}.gif', ROOT / f'images/discovery-ends/{iid}.jpg', ROOT / f'images/discovery-sheets/{iid}.webp']
                    if kind in ('nature', 'ruin') else [ROOT / f'images/{"items" if kind == "item" else "relics"}/{iid}.webp'])
        if any(p.exists() for p in expected):
            recorded = [ROOT / f for f in row.get('files', [])]
            if expected != recorded or not all(p.exists() for p in expected):
                raise FileExistsError('이번 제작 기록에 없는 기존 게임 그림: ' + iid)
            recut = kind == 'ruin' and row.get('grid_version') != 1
            if not refresh or (not recut and source.stat().st_mtime <= min(p.stat().st_mtime for p in expected)):
                print(iid, '기존 제작 결과 유지', flush=True)
                continue
            for p in expected:
                backup = ART / 'before-refresh' / p.relative_to(ROOT)
                backup.parent.mkdir(parents=True, exist_ok=True)
                if not backup.exists():
                    shutil.copy2(p, backup)
        if kind in ('nature', 'ruin'):
            destinations = expected
            if kind == 'nature':
                if iid == 'capri':
                    # 푸른 동굴 천장에는 해·달·별을 겹쳐 그리지 않는다.
                    sun, night = nature.sun_layer, nature.night_layer
                    try:
                        nature.sun_layer = lambda *_: Image.new('RGBA', (nature.W, nature.H))
                        nature.night_layer = lambda *_: Image.new('RGBA', (nature.W, nature.H))
                        nature.build_one(iid)
                    finally:
                        nature.sun_layer, nature.night_layer = sun, night
                else:
                    nature.build_one(iid)
            else:
                frames, boxes = cinematic_cells(source, ruin.fit_whole)
                ruin.storyboard_cells = lambda _path, frames=frames: frames
                ruin.build_one(iid, ruin.LIVE_OUT, ruin.LIVE_ENDS)
                row['grid_version'] = 1
                row['source_boxes'] = boxes
            sheets.build(iid, True)
            row['files'] = [p.relative_to(ROOT).as_posix() for p in destinations]
        else:
            destination = ROOT / f'images/{"items" if kind == "item" else "relics"}/{iid}.webp'
            destination.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(ROOT / row['target']) as raw:
                if 'A' not in raw.getbands() or raw.getchannel('A').getextrema()[0] != 0:
                    raise ValueError('투명 배경 원화 필요: ' + iid)
                # 생성 알파를 그대로 살리고 투명한 여백을 더해 모서리 잘림을 막는다.
                im = ImageOps.contain(raw.convert('RGBA'), (240, 240), Image.Resampling.LANCZOS)
                canvas = Image.new('RGBA', (256, 256))
                canvas.paste(im, ((256-im.width)//2, (256-im.height)//2))
                canvas.save(destination, 'WEBP', quality=95, method=6, exact=True)
            row['files'] = [destination.relative_to(ROOT).as_posix()]
        print(iid, kind, flush=True)
    SPEC.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    register(data['assets'])
    preview(data['assets'])


def register(rows):
    # 다른 작업에서 이미 등록한 내용을 보존하고 이번 자산만 더한다.
    path = ROOT / 'images/manifest.js'
    text = path.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match[1])
    for row in rows:
        for filename in row['files']:
            rel = filename.removeprefix('images/')
            files[str(Path(rel).with_suffix('')).replace('\\', '/')] = rel
    replacement = 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';'
    path.write_text(text[:match.start()] + replacement + text[match.end():], encoding='utf-8', newline='\n')


def preview(rows):
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 18)
    small = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 15)
    for group, kinds, width, height, columns in [('discoveries', ('nature', 'ruin'), 288, 164, 5), ('items', ('item', 'relic'), 192, 216, 6)]:
        selected = [r for r in rows if r['kind'] in kinds]
        out = Image.new('RGB', (columns*width, ((len(selected)+columns-1)//columns)*height), '#283039')
        draw = ImageDraw.Draw(out)
        for i, row in enumerate(selected):
            x, y = (i % columns)*width, (i//columns)*height
            path = ROOT / (f'images/discovery-ends/{row["id"]}.jpg' if group == 'discoveries' else row['files'][0])
            # 경관은 밤의 끝 장면보다 원화의 낮 지형이 비교하기 쉽다.
            if row['kind'] == 'nature':
                path = ROOT / row['target']
            with Image.open(path) as im:
                im = ImageOps.contain(im.convert('RGBA'), (width-12, height-36), Image.Resampling.LANCZOS)
                out.paste(im, (x+(width-im.width)//2, y+6), im)
            if group == 'items':
                lines, line = [], ''
                for char in row['name']:
                    if draw.textlength(line+char, font=small) > width-16:
                        lines.append(line); line = char
                    else:
                        line += char
                lines.append(line)
                for j, line in enumerate(lines[:2]):
                    draw.text((x+8, y+height-36+j*17), line, font=small, fill='#f4e7c8')
            else:
                draw.text((x+8, y+height-28), row['name'], font=font, fill='#f4e7c8')
        out.save(ROOT / f'docs/art/additions-20261030-{group}.jpg', quality=92)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'record', 'revise', 'build', 'preview'])
    parser.add_argument('--id')
    parser.add_argument('--source', type=Path)
    parser.add_argument('--refresh', action='store_true', help='이 제작 기록의 원화가 새로 바뀐 결과만 보관 후 다시 굽기')
    args = parser.parse_args()
    if args.action == 'prepare':
        prepare()
    elif args.action in ('record', 'revise'):
        record(args.id, args.source, args.action == 'revise')
    elif args.action == 'build':
        build(args.refresh)
    else:
        preview(json.loads(SPEC.read_text(encoding='utf-8'))['assets'])
