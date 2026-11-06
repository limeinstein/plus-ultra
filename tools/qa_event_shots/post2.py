#!/usr/bin/env python3
"""shots2.json: shot.js decides `fired` only from match.json alts (none for pre-1600 / extra systems).
forcelib2.js leaves 'FIRED2=true|false|null RES=…' in the notes (observed) — merge that in as fired2."""
import json, re, sys
p = sys.argv[1] if len(sys.argv) > 1 else '/tmp/qa_event_shots/shots2.json'
R = json.load(open(p))
for r in R:
    m = re.search(r'FIRED2=(true|false|null)', r.get('observed', ''))
    f2 = m.group(1) if m else None
    r['fired_by_alts'] = r.get('fired_by_alts', r['fired'])
    r['fired2'] = {'true': True, 'false': False}.get(f2)
    r['fired'] = bool(r['fired_by_alts'] or r['fired2'])
json.dump(R, open(p, 'w'), ensure_ascii=False, indent=1)
for r in R:
    print(('YES ' if r['fired'] else 'no  ') + r['id'].ljust(24), 'alts=%s f2=%s shots=%d errs=%d %ss' % (r['fired_by_alts'], r['fired2'], len(r['shots']), len(r['errors']), round((r.get('ms') or 0) / 1000)), (r['observed'] or '')[-160:].replace('\n', ' '))
print('fired', sum(r['fired'] for r in R), '/', len(R))
