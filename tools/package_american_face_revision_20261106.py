"""두 인물의 참고 얼굴 수정본을 보존하고 22종 제작 목록에 반영한다."""
import json
import shutil
from pathlib import Path
import package_folk_american_women_20261106 as pack

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/american-face-revision-20261106'


def main():
    revisions = json.loads((ART / 'generation-results.json').read_text(encoding='utf-8'))
    plan_path = ROOT / 'tools/folk_american_women_20261106_prompts.json'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    result_path = ROOT / 'artifacts/folk-american-women-20261106/generation-results.json'
    results = json.loads(result_path.read_text(encoding='utf-8'))
    for revised in revisions:
        row = next(r for r in plan['portraits'] if r['id'] == revised['id'])
        source = ART / 'sources' / (row['id'] + '_v2.png')
        source.parent.mkdir(parents=True, exist_ok=True)
        if not source.exists():
            shutil.copy2(revised['source'], source)
        for ref in [revised['target'], revised['reference']]:
            refs = ART / 'references'
            refs.mkdir(exist_ok=True)
            dest = refs / Path(ref).name
            if not dest.exists():
                shutil.copy2(ref, dest)
        shared_ref = ROOT / 'artifacts/folk-american-women-20261106/references' / Path(revised['reference']).name
        if not shared_ref.exists():
            shutil.copy2(revised['reference'], shared_ref)
        if row['face_key'] != revised['face_key']:
            row.setdefault('revisions', []).append({key: row.get(key) for key in ['face_key', 'source', 'workspace_source', 'prompt', 'refs']})
        row.update(face_key=revised['face_key'], source=revised['source'],
            workspace_source=source.relative_to(ROOT).as_posix(), prompt=revised['prompt'], refs=[revised['reference']],
            revision_note='후속 첨부 얼굴로 변경. 의상·몸·자세·소품을 유지하고 무릎상에서 얼굴상을 추출.')
        results[row['id']] = dict(source=revised['source'], prompt=revised['prompt'])
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    result_path.write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    pack.main()
    keys = [r['face_key'] + suffix for r in revisions for suffix in ['', '_half']]
    (ART / 'keys.json').write_text(json.dumps(keys, indent=2) + '\n', encoding='utf-8')
    print('다코타·이누이트 수정 원본과 얼굴상·무릎상 반영 완료')


if __name__ == '__main__':
    main()
