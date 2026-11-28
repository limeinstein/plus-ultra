"""사용자 후속 요청: 새 가족 원화의 가려진 얼굴과 표정을 내장 ImageGen으로 다시 그릴 준비."""
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

HERE = Path(__file__).parent
jobs = []
for file in sorted((HERE/'receipts').glob('family_*.json')):
    r = json.loads(file.read_text(encoding='utf-8'))
    if 'faces_v2' in r['id']: continue
    prompt = ('Use case: identity-preserve. EDIT the supplied historical family event painting. '
              'Preserve the SAME people, genders, ages, family roles, period clothes, activities, hands, objects, location, warm painted game art, lighting and ultrawide 9:4 composition. '
              'The user requests that the obscured and blank faces be beautifully drawn WITH readable expressions. '
              'Replace EVERY blank, featureless, hidden or hair-covered PRINCIPAL face with a fully drawn natural face: two coherent expressive eyes, eyebrows, nose, lips and individual facial structure. '
              'Show the female captain protagonist as a BEAUTIFUL ADULT WOMAN with bright intelligent eyes, graceful harmonious features and her existing dark braided hair. '
              'Show adult men as appealing, individual expressive men, retaining facial hair where present. Children must have soft naturally charming AGE-APPROPRIATE CHILD faces, no adult makeup or adult features. '
              'Turn heads and slightly adjust shoulders to clear THREE-QUARTER or frontal views so the woman, partner and children have VISIBLE faces while still interacting naturally with one another. '
              'Do not leave the main woman facing fully away; reveal her eyes and mouth. Do not hide eyes behind hair, heavy shadow, objects or motion blur. '
              'Expressions must fit the action: warm delighted smiles for reunion and celebration, affectionate eyes for romance, tender awe with a newborn, thoughtful attention for teaching, gentle concern for a sick child. '
              'Avoid identical pasted faces or everyone grinning broadly; give each person an individual emotion and gaze. '
              'Keep the narrative scene, not a posed group portrait. Sharp beautiful painted facial detail, natural skin and believable anatomy. '
              'Do not add people, remove people, change gender, change the scene, add text, watermark, collage or panels. '
              'Scene identity and action to preserve: '+r['id']+'.')
    if r['id'].startswith('family_m_'):
        prompt=prompt.replace('Show the female captain protagonist as a BEAUTIFUL ADULT WOMAN with bright intelligent eyes, graceful harmonious features and her existing dark braided hair.', 'The PLAYER protagonist is the existing MALE CAPTAIN FATHER in the navy coat; keep him a handsome adult MAN with his beard. His wife is an adult WOMAN in the existing dress. Preserve these genders and family roles exactly.')
        prompt=prompt.replace('Do not leave the main woman facing fully away; reveal her eyes and mouth.', 'Reveal the male captain father and his wife with clear eyes and mouths while preserving their genders.')
    jobs.append(dict(id=r['id']+'_faces_v2', key=r['key'], title=r.get('title',r['id']), prompt=prompt, refs=[r['source']], replaces=r['id']))
priority = ['family_f_36_adult_siblings_homecoming','family_f_childfriend_join']
jobs.sort(key=lambda j: (priority.index(j['replaces']) if j['replaces'] in priority else 2, j['id']))
(HERE/'face-jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf-8')
out = HERE.parents[1]/'artifacts/life-scenes-20261127'
out.mkdir(parents=True,exist_ok=True)
for start in range(0,len(jobs),12):
    sheet = Image.new('RGB',(1800,1200),'#171c25')
    draw=ImageDraw.Draw(sheet)
    for i,j in enumerate(jobs[start:start+12]):
        with Image.open(j['refs'][0]) as im: thumb=ImageOps.fit(im.convert('RGB'),(600,266))
        x,y=(i%3)*600,(i//3)*300
        sheet.paste(thumb,(x,y));draw.text((x+5,y+270),j['replaces'],fill='white')
    sheet.save(out/f'face-before-{start//12+1}.jpg',quality=94)
print('가족 원화 얼굴·표정 수정 '+str(len(jobs))+'장')
