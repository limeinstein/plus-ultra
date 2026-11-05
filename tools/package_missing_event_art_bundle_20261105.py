"""검증된 누락 이벤트 그림·지시문·미리보기를 문서와 한 묶음으로 보관한다."""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/missing-event-art-20261105'
PPLAN = ROOT / 'tools/missing_event_portraits_20261105_prompts.json'
SPLAN = ROOT / 'tools/missing_event_scenes_20261105_prompts.json'

def read(file):
    return json.loads(file.read_text(encoding='utf-8'))

def main():
    portraits, scenes = read(PPLAN)['portraits'], read(SPLAN)['scenes']
    checks = read(OUT / 'screenshots/checks.json')
    audit = read(OUT / 'audit-after.json')
    event_audit = read(OUT / 'scene-audit-after.json')
    assert len(portraits) == 67 and len(scenes) == 71
    assert len(checks['portraits']) == 67 and len(checks['scenes']) == 71 and not checks['errors']
    assert not any(audit[k] for k in ['missingFigures', 'missingMates', 'missingScenes', 'errors'])
    assert not event_audit['missing'] and not event_audit['unregistered']
    lines = [
        '# 누락 이벤트 인물화와 이벤트 샷 (2026-11-05~06)', '',
        '전용 이미지가 없던 화자 ID 65개와 리치·알탄 칸의 후기 모습 2개를 채웠다. 얼굴상 67장, 무릎상 67장, 이벤트 샷 71장으로 게임용 새 파일은 총 205장이다. 위충현·객씨처럼 여러 사건에 나오는 동일 인물의 시기별 화자는 따로 센다. 이사회 화자 `cw_heeren`은 이사 다섯 명의 단체 초상이며 얼굴상은 가운데 대표를 잘랐다.', '',
        '게임에 맞춘 미형의 반실사 수작업풍으로 제작했다. 무릎상은 발·신발 없이 무릎 부근에서 끝나며 1024×1536 투명 WebP, 얼굴상은 같은 원화에서 자른 448×448 투명 WebP다. 이벤트 샷은 대사에 맞는 1881×836 가로 그림이다. 연령·문화·역할이 드러나는 복식과 표정을 구분했다.', '',
        '## 범위', '',
        '| 사건 | 새 인물화 모습 | 이벤트 샷 |', '|---|---:|---:|',
        '| 동인도 회사 | 10 | 10 |', '| 식민지 회사 | 10 | 8 |',
        '| 왜구 토벌 | 6 | 6 |', '| 가정제 | 10 (후기 알탄 포함) | 8 |',
        '| 융경개관 | 4 | 3 |', '| 마테오 리치 | 5 (후기 리치 포함) | 4 |',
        '| 신작 항해사 | 기존 인물화 사용 | 16 |', '| 견우와 직녀 | 기존 인물화 사용 | 1 |',
        '| 동림당 | 13 | 9 |', '| 영원성·숭정제 | 9 | 6 |', '| 합계 | 67 | 71 |', '',
        '## 연결', '',
        '- `images/manifest.js`에 205개 경로를 등록하고 `js/data/portraitfaces.js`에 얼굴 자리 134개를 반영했다.',
        '- `js/data/ricci.js`: 1595년부터 수염·선비 복식의 후기 리치를 고른다. 초기 조경 사건은 삭발·회색 승복이다.',
        '- `js/data/jiajing.js`: 1572년부터 회색 수염의 후기 알탄 칸을 고른다.',
        '- `js/systems/gyeonwoo.js`: 한산도 칠석 혼례 전용 그림을 표시하고 두 선택지와 종료 때 정리한다.',
        '- 나머지 사건은 이미 지정된 전용 경로를 채워 원래 대화와 연결했다. 등장 조건·보상·동료 ID는 유지했다.', '',
        '## 전체 미리보기', '', '### 인물화', '',
    ]
    previews = []
    for n in range(1, 7):
        file = ROOT / f'docs/art/missing-event-portraits-20261105-preview-{n}.jpg'
        previews.append(file)
        lines += [f'![인물화 {n}]({file.name})', '']
    lines += ['### 이벤트 샷', '']
    for n in range(1, 10):
        file = ROOT / f'docs/art/missing-event-scenes-20261105-preview-{n}.jpg'
        previews.append(file)
        lines += [f'![이벤트 샷 {n}]({file.name})', '']
    lines += ['## 인물화 목록', '', '| 이름 | 원화·얼굴상·무릎상 이름 |', '|---|---|']
    lines += [f"| {r['name']} | `portraits/{r['group']}/{r['id']}` · `_half` |" for r in portraits]
    lines += ['', '## 이벤트 샷 목록', '', '| 장면 | 이미지 |', '|---|---|']
    lines += [f"| {r['title']} | `{r['key']}` |" for r in scenes]
    lines += ['', '## 원화·생성 지시문·파일 묶음', '',
        '생성 방식은 내장 `image_gen`이다. 개별 인물·장면마다 생성했으며 실제 사용한 지시문과 참조 이미지 경로는 아래 JSON에 남겼다. 원본 생성 파일은 보존하고 프로젝트에 PNG 사본을 보관했다. 얼굴 추출·규격 변환·미리보기에는 Pillow와 OpenCV를 사용했다.', '',
        '- [인물화 지시문·원화 경로](../../tools/missing_event_portraits_20261105_prompts.json)',
        '- [이벤트 샷 지시문·참조·원화 경로](../../tools/missing_event_scenes_20261105_prompts.json)',
        '- 인물 PNG 사본: `artifacts/missing-event-portraits-20261105/sources/`',
        '- 장면 PNG 사본: `artifacts/missing-event-scenes-20261105/sources/`',
        '- [205장 전체 묶음](../../artifacts/missing-event-art-20261105/missing-event-art-20261105.zip)',
        '- [인물화 134장 묶음](../../artifacts/missing-event-portraits-20261105/missing-event-portraits-20261105.zip)',
        '- [이벤트 샷 71장 묶음](../../artifacts/missing-event-scenes-20261105/missing-event-scenes-20261105.zip)', '',
        '검토 중 리치의 초기 복식, 쿠를란트 깃발, 낭선 소품, 덴마크 시대 복식, 마상재의 깃발, 가모가와 그림의 글자 흔적을 수정했다. 생성 당시와 수정 지시문은 제작 자료에 남아 있다.', '',
        '## 검증', '',
        '- `node tests/missing_event_art_20261105_smoke.cjs`: 134개 인물 이미지·71개 장면의 해독·규격·실제 대화 표시·종료 확인. 리치/알탄 시기별 선택, 한산도 혼례 두 선택지 확인. `pageerror`·`console.error` 0.',
        f"- `node tools/audit_missing_event_art_20261105.cjs --after`: 역사 화자 {len(audit['figures'])}개·사건 동료 {len(audit['mates'])}개·정적 장면 {len(audit['scenes'])}개에서 전용 얼굴·무릎상·장면 누락 0.",
        f"- `tools/audit_event_images.py`: 장면 변형 {event_audit['total']}개에서 파일 누락 0·등록 누락 0.",
        '- 이미지 전체 규격·투명도와 미리보기 육안 검토. 검사 브라우저는 `finally`에서 닫았다.',
        '- [대화 화면 검사 결과](../../artifacts/missing-event-art-20261105/screenshots/checks.json)',
        '- [최종 누락 감사](../../artifacts/missing-event-art-20261105/audit-after.json)',
        '- [전체 장면 감사](../../artifacts/missing-event-art-20261105/scene-audit-after.json)', '',
        '감사는 이 시점에 저장소에 있는 사건 자료를 기준으로 했다. 그림 표시는 전수 검사했고, 모든 이벤트의 자연 발생 조건을 장시간 플레이로 재현한 것은 아니다.', '',
    ]
    document = ROOT / 'docs/art/missing-event-art-20261105.md'
    document.write_text('\n'.join(lines), encoding='utf-8')
    assets = [ROOT / r[k] for r in portraits for k in ['face_file', 'half_file']] + [ROOT / r['file'] for r in scenes]
    assert len(assets) == len(set(assets)) == 205
    with zipfile.ZipFile(OUT / 'missing-event-art-20261105.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for file in assets + previews + [PPLAN, SPLAN, document, OUT / 'screenshots/checks.json', OUT / 'audit-after.json', OUT / 'scene-audit-after.json']:
            z.write(file, file.relative_to(ROOT).as_posix())
    print('205 game assets, final prompts, previews and QA bundled.')

if __name__ == '__main__':
    main()
