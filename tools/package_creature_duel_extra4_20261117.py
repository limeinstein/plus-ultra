"""일기토형 괴물 4종과 기존 포함 36종 묶음을 정리한다."""
import json
import zipfile
from pathlib import Path
import package_creature_combat_20261117 as pack

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'artifacts/creature-duel-extra4-20261117'
pack.BASE = BASE
pack.SOURCE = BASE / 'sources'
pack.OUT = ROOT / 'images/creature-duel-extra4-20261117'
pack.build()
extra = json.loads((BASE / 'manifest.json').read_text(encoding='utf-8'))
previous = json.loads((ROOT / 'artifacts/creature-combat-extra24-20261117/manifest-all32.json').read_text(encoding='utf-8'))
all_entries = previous + extra
assert len(all_entries) == len({e['id'] for e in all_entries}) == 36
assert sum(e['frames'] for e in all_entries) == 416
(BASE / 'manifest-all36.json').write_text(json.dumps(all_entries, ensure_ascii=False, indent=2), encoding='utf-8')
with zipfile.ZipFile(BASE / 'creature-combat-all36.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for entry in all_entries:
        archive.write(ROOT / entry['file'], entry['id'] + '.png')
    archive.write(BASE / 'manifest-all36.json', 'manifest.json')
lines = ['# 일기토형 괴물 4종 추가', '',
         '2026-11-17. 흡혈귀·늑대인간·해골 전사·리치를 내장 ImageGen으로 개별 제작했다.', '',
         '각 2592×1216 투명 RGBA PNG, 6열×4행, 칸 432×304, 기준점 (165,278). 행은 공격·방어·피격·대기다.',
         '기존 규약대로 공격 6칸·방어 첫 4칸·피격 첫 3칸·대기 6칸을 재생한다. 피격 3번째 칸은 바닥에 쓰러진 자세다.',
         '추가 96칸. 기존 포함 36종·416칸(일기토 8종, 육상 전투 28종).', '',
         '[4종 미리보기](preview.jpg) · [4종 PNG ZIP](creature-combat-4.zip) · [전체 36종 ZIP](creature-combat-all36.zip)', '',
         '## 움직임', '']
for e in extra:
    lines.append('- [' + e['name'] + '](' + e['id'] + '.gif) (`' + e['id'] + '`)')
lines += ['', '## 파일과 검증', '',
          '최종 시트: `../../images/creature-duel-extra4-20261117/`. 생성 원본: `sources/`.',
          '[프롬프트](prompts.json) · [4종 규격과 프롬프트](manifest.json) · [전체 36종 규격](manifest-all36.json).',
          '배경 제거 프롬프트: [늑대인간](werewolf-background-edit.txt) · [해골 전사 1차](skeleton-background-edit.txt) · [해골 전사 2차](skeleton-background-edit-2.txt). 배경 보정도 내장 ImageGen을 사용했다.',
          '정리 명령: `python tools/package_creature_duel_extra4_20261117.py`.',
          '원본 투명 알파·빈 프레임·최종 크기·36종 ID 중복과 총 416칸을 검사한다. 모든 칸에 같은 배율과 이동량을 적용한다.',
          '게임의 발견물 등록·전투 규칙·시트 로더 연결은 이번 제작에 포함하지 않았다. 생성 그림에는 자세별 작은 외형 차이와 반투명 가장자리가 남을 수 있다.', '']
(BASE / 'README.md').write_text('\n'.join(lines), encoding='utf-8')
print('36종, 416칸 묶음 생성 완료')
