# js/ui/cabinview.js 의 SPOT(배 그림 속 선실 자리)을 새 그림 좌표로 옮긴다: new = old*s + (ox, oy)
import sys, re, json, os
root=sys.argv[1]; tf=json.load(open(sys.argv[2]))
p=os.path.join(root,'js/ui/cabinview.js'); s=open(p,encoding='utf-8').read()
if 'SPOT 2026-10-09' in s: print('already'); sys.exit()
def fix(m):
    n=m.group(1); t=tf.get(n)
    if not t: return m.group(0)
    k,ox,oy=t['s'],t['ox'],t['oy']
    X=lambda v: str(int(round(float(v)*k+ox))); Y=lambda v: str(int(round(float(v)*k+oy)))
    g=m.groups()
    return "%s: { hull: [%s, %s, %s, %s], deck: %s, mast: [%s, %s], stern: [%s, %s] }" % (n, X(g[1]),Y(g[2]),X(g[3]),Y(g[4]), Y(g[5]), X(g[6]),Y(g[7]), X(g[8]),Y(g[9]))
s2,cnt=re.subn(r"(\w+): \{ hull: \[(\d+), (\d+), (\d+), (\d+)\], deck: (\d+), mast: \[(\d+), (\d+)\], stern: \[(\d+), (\d+)\] \}",fix,s)
s2=s2.replace("     모든 배가 왼쪽이 뱃머리, 오른쪽이 고물이다. 그림을 새로 그리면 여기 값만 다시 재면 된다. */",
 "     모든 배가 왼쪽이 뱃머리, 오른쪽이 고물이다. 그림을 새로 그리면 여기 값만 다시 재면 된다.\n     (SPOT 2026-10-09: 액자처럼 둘러진 흐린 테두리를 걷어 낸 그림에 맞춰 옮김 — tools/ship_unframe/) */",1)
assert 'SPOT 2026-10-09' in s2
open(p,'w',encoding='utf-8',newline='').write(s2); print('ok', cnt)
