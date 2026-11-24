"""현재 게임의 젊은 제독 초상을 제작 참조와 확인판으로 보존한다."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art_sources/hero-motion-20261124'
IDS = ['admiral', 'ganghui', 'navigator_white', 'armored_navigator', 'sea_dog',
       'muscle_swordsman', 'hat_spinner', 'charismatic_admiral', 'battle_vanguard',
       'noble_scholar', 'casanova', 'army_officer', 'sky_adventurer', 'blackcoat_captain',
       'jessica', 'soyoung']

def main():
    overrides = json.loads((ROOT/'tools/player_portrait_ages_20261123/asset-overrides.json').read_text(encoding='utf-8'))
    board = Image.new('RGB', (1600, 1600), '#ded8cb')
    draw = ImageDraw.Draw(board)
    records = []
    for i, fid in enumerate(IDS):
        key = 'characters/player_half' + (('_'+fid) if fid != 'admiral' else '')
        path = ROOT/'images'/overrides[key] if key in overrides else next((ROOT/'images/characters').glob(key.split('/')[-1]+'.*'))
        image = Image.open(path).convert('RGBA')
        ref = OUT/'references'/f'{fid}.png'
        image.save(ref)
        image.thumbnail((360, 355))
        x, y = (i % 4)*400, (i//4)*400
        board.paste(image, (x+(400-image.width)//2, y+355-image.height), image)
        draw.text((x+18, y+370), fid, fill='#30281f')
        records.append({'id':fid,'reference':str(ref.relative_to(ROOT)).replace('\\','/'),'source':str(path.relative_to(ROOT)).replace('\\','/')})
    board.save(ROOT/'artifacts/hero-motion-20261124/references.jpg', quality=92)
    (ROOT/'tools/hero_motion_20261124/characters.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__ == '__main__':
    main()
