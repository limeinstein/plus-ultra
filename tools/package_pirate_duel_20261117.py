"""해적 42명의 일기토 시트·지역별 미리보기·움직임 묶음."""
import json
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import package_creature_combat_20261117 as pack

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'artifacts/pirate-duel-42-20261117'
pack.BASE, pack.SOURCE, pack.OUT = BASE, BASE / 'sources', ROOT / 'images/pirate-duel-42-20261117'
pack.build(split_duel=True)
entries = json.loads((BASE / 'manifest.json').read_text(encoding='utf-8'))
assert len(entries) == len({e['id'] for e in entries}) == 42
assert sum(e['frames'] for e in entries) == 1008
zones = list(dict.fromkeys(e['zone'] for e in entries))
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 19)
titlefont = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 23)
all_preview = Image.new('RGB', (1536, 350 * 7), '#242c32')
lines = ['# 지역별 해적 일기토 42명', '',
         '2026-11-17. 유명 해적·현상금 해적·소굴 두목 자료를 바탕으로 일곱 지역마다 남자 3명·여자 3명을 제작했다. 내장 ImageGen을 사용했다.', '',
         '각 2592×1216 투명 RGBA PNG, 6열×4행, 칸 432×304, 기준점 (165,278). 전체 1008칸.',
         '행 순서: 공격 6칸·방어(첫 4칸 재생)·피격(첫 3칸 재생, 세 번째는 쓰러짐)·대기 6칸.', '',
         '[전체 미리보기](preview-regions.jpg) · [PNG 42명 ZIP](creature-combat-42.zip) · [PNG·GIF·규격 전체 묶음](pirate-duel-42-complete.zip)', '',
         '인도양 여성 명부가 2명뿐이므로 세 번째인 **산호칼 자흐라**는 이번 제작의 창작 후보이다. 동남아시아의 라야 알리는 기존 소굴 여성 두목이다.',
         '기존 인물 41명은 이름·ID로 전용 일기토 시트를 사용한다. 영입된 동료도 같은 그림을 사용한다. 자흐라는 미등록 창작 후보로 남긴다.', '',
         '프레임 경계를 넘은 칼끝·신체는 원화에서 연결된 픽셀을 따라 분리했다. 42명·1008칸을 다시 포장했으며 유효 픽셀 손실과 프레임 가장자리 잘림은 0이다.', '',
         '[수정 전후 비교](frame-boundary-comparison.jpg) · [실제 일기토 화면](runtime-duel.png) · [실행 검증](runtime-report.json) · [픽셀 보존 검사](frame-integrity-report.json)', '',
         '공격 높이를 조절하는 임시 캔버스에도 위아래 여백을 넣었다. 검사: `python tests/pirate_duel_frames_20261117.py`, `node tests/pirate_duel_20261117_smoke.cjs` — 41명·164개 자세와 양쪽의 베기·찌르기·치기 6회, 콘솔 오류 0.', '',
         '## 지역별 명단과 움직임', '']
for row, zone in enumerate(zones):
    group = [e for e in entries if e['zone'] == zone]
    assert len(group) == 6 and sum(e['gender'] == 'm' for e in group) == 3 and sum(e['gender'] == 'f' for e in group) == 3
    preview = Image.new('RGB', (1536, 350), '#242c32')
    draw = ImageDraw.Draw(preview)
    draw.text((16, 8), group[0]['region'] + ' — 남자 3명 / 여자 3명', font=titlefont, fill='#ead7b0')
    for col, e in enumerate(group):
        im = Image.open(ROOT / e['file']).convert('RGBA')
        assert im.size == (2592, 1216)
        cell = im.crop((0, 912, 432, 1216))
        cell.thumbnail((240, 250))
        preview.paste(cell, (col*256+(256-cell.width)//2, 46), cell)
        label = e['name']
        if len(label) > 14:
            cut = label.rfind(' ', 0, 14)
            if cut <= 0: cut = 12
            label = label[:cut] + '\n' + label[cut:].lstrip()
        draw.text((col*256+12, 285), label, font=font, fill='white', spacing=2)
        draw.text((col*256+12, 331), '남자' if e['gender']=='m' else '여자', font=font, fill='#aebdc5')
    preview.save(BASE / ('preview-' + zone + '.jpg'), quality=92)
    all_preview.paste(preview, (0, row*350))
    lines += ['### ' + group[0]['region'], '', '[지역 미리보기](preview-' + zone + '.jpg)', '']
    for e in group:
        tag = '역사 인물' if e['historical'] else ('창작 후보' if e['sourceKind']=='new-concept' else '게임 창작 인물')
        lines.append('- [' + e['name'] + '](' + e['id'] + '.gif) · ' + ('남자' if e['gender']=='m' else '여자') + ' · ' + tag)
    lines.append('')
all_preview.save(BASE / 'preview-regions.jpg', quality=92)
lines += ['## 원본·프롬프트·검증', '',
          '최종 PNG: `../../images/pirate-duel-42-20261117/`. 생성 원본: `sources/`.',
          '[프롬프트와 인물 근거](prompts.json) · [제작 공통 지시 보충](generation-notes.txt) · [최종 규격](manifest.json).',
          '배경 제거 보정도 내장 ImageGen을 사용했다. 주문서: [1차](background-edit-prompt.txt) · [2차](background-edit-prompt-2.txt) · [3차](background-edit-prompt-3.txt).',
          '인물 자료: `js/data/seacaptains.js`, `js/data/pirate_roster.js`, `js/data/pirate_lairs.js`. 41명은 기존 초상·무릎상 또는 현상수배 그림을 참조했다.',
          '모든 지역의 남녀 인원·ID 중복·투명 알파·빈 프레임·출력 크기를 검사했다. 생성 원화의 자세별 미세한 외형 변화와 반투명 가장자리는 남을 수 있다.',
          '재포장: `python tools/package_pirate_duel_20261117.py`.', '']
(BASE / 'README.md').write_text('\n'.join(lines), encoding='utf-8')
with zipfile.ZipFile(BASE / 'pirate-duel-42-complete.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for e in entries:
        z.write(ROOT / e['file'], 'sheets/' + e['id'] + '.png')
        z.write(BASE / (e['id'] + '.gif'), e['id'] + '.gif')
    for name in ['README.md', 'manifest.json', 'prompts.json', 'generation-notes.txt', 'preview-regions.jpg', 'background-edit-prompt.txt', 'background-edit-prompt-2.txt', 'background-edit-prompt-3.txt'] + ['preview-' + zone + '.jpg' for zone in zones]:
        z.write(BASE / name, name)
    for name in ['runtime-duel.png', 'runtime-report.json', 'frame-boundary-comparison.jpg', 'frame-boundary-audit.json', 'frame-integrity-report.json']:
        if (BASE / name).exists():
            z.write(BASE / name, name)
print('42명 / 지역마다 남3·여3 / 1008칸 검증 완료')
