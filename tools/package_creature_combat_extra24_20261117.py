"""추가 24종을 정리하고 기존 8종과 합친 배포 묶음을 만든다."""
import json
import zipfile
from pathlib import Path
from PIL import Image
import package_creature_combat_20261117 as pack

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'artifacts/creature-combat-extra24-20261117'
pack.BASE = BASE
pack.SOURCE = BASE / 'sources'
pack.OUT = ROOT / 'images/creature-combat-extra24-20261117'
pack.build()
old = ROOT / 'artifacts/creature-combat-20261117'
entries = json.loads((old / 'manifest.json').read_text(encoding='utf-8')) + json.loads((BASE / 'manifest.json').read_text(encoding='utf-8'))
assert len(entries) == 32 and len({e['id'] for e in entries}) == 32
assert sum(e['frames'] for e in entries) == 320
(BASE / 'manifest-all32.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
with zipfile.ZipFile(BASE / 'creature-combat-all32.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for entry in entries:
        archive.write(ROOT / entry['file'], entry['id'] + '.png')
    archive.write(BASE / 'manifest-all32.json', 'manifest.json')
previews = [Image.open(old / 'preview.jpg'), Image.open(BASE / 'preview.jpg')]
combined = Image.new('RGB', (1024, sum(im.height for im in previews)), '#242c32')
y = 0
for im in previews:
    combined.paste(im, (0, y))
    y += im.height
combined.save(BASE / 'preview-all32.jpg', quality=92)
lines = ['# 육상 탐험 생물 전투 시트 — 추가 24종', '',
         '2026-11-17. 기존 8종의 3배인 24종을 추가해 총 32종으로 늘렸다. 내장 ImageGen으로 개별 시트를 생성했다.', '',
         '추가분은 모두 육상 전투용이다. 각 2048×256 투명 RGBA PNG, 8열×1행, 칸 256×256, 기준점 (128,239).',
         '동작 순서: 대기·걷기 좌·걷기 우·공격 준비·돌진·타격·복귀·피격. 뱀은 걷기 대신 몸통 굴곡을 사용한다.', '',
         '추가 192프레임, 기존 포함 총 320프레임. 원본은 sources/, 최종 시트는 ../../images/creature-combat-extra24-20261117/.', '',
         '[추가 24종 미리보기](preview.jpg) · [전체 32종 미리보기](preview-all32.jpg)', '',
         '[추가 24종 PNG ZIP](creature-combat-24.zip) · [전체 32종 PNG ZIP](creature-combat-all32.zip)', '',
         '## 종별 움직임 미리보기', '']
for e in entries[8:]:
    lines.append('- [' + e['name'] + '](' + e['id'] + '.gif) (`' + e['id'] + '`)')
lines += ['', '## 제작과 검증', '',
          '최초 생성 프롬프트: [prompts.json](prompts.json). 사자 배경 제거 프롬프트: [lion-background-edit.txt](lion-background-edit.txt).',
          '파일별 크기·알파·기준점·프롬프트: [manifest.json](manifest.json). 전체 32종: [manifest-all32.json](manifest-all32.json).',
          '재생성 명령: `python tools/package_creature_combat_extra24_20261117.py`.',
          '32종 ID 중복 없음, 총 320칸, 추가분의 투명 알파와 빈 프레임 여부 및 출력 규격을 검사했다. 게임 전투 발생 규칙·로더 연결은 이번 제작에 포함하지 않았다.',
          '생성 원화에는 자세에 따른 체형·무늬 변화와 미세한 반투명 가장자리가 있을 수 있다. 시트별 동일 배율과 이동량으로 재포장했다.', '']
(BASE / 'README.md').write_text('\n'.join(lines), encoding='utf-8')
print('전체 32종, 320칸, ZIP 2개 생성 완료')
