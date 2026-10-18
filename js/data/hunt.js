/* 사냥 전리품 — 뭍에서 짐승 떼와 싸워 이기면 그 땅 짐승의 가죽을 얻는다 (js/systems/hunt.js · js/scenes/land.js landBattle). 2026-10-18
   ■ 짐승은 육상전 그림과 같은 짐승 (js/data/landwarart.js 지역별 b: [떼, 우두머리])
     호랑이 → 호피(새 교역품 tigerskin) · 곰·사자·재규어 → 모피(fur) · 멧돼지·하이에나 → 피혁(hides)
   ■ 얻은 가죽은 배의 짐칸에 교역품으로 실린다 (짐칸·품목 수가 모자라면 두고 온다) → 어느 도시 교역소에서든 「매각」으로 판다.
     호피는 호랑이가 사는 인도·중국·동남아시아를 산지로 쳐서(R.origins) 그곳에서는 싸고, 멀리 갈수록(유럽·아메리카) 비싸다.
   ■ 조정값 G.BALANCE.hunt: per 짐승 한 마리당 가죽(통), max 한 번에 얻는 최대 통, lead 우두머리가 더 주는 통 */
(function (G) {
  'use strict';
  // 새 교역품: G.GOODS 끝에 붙인다 (시세 수첩이 순번 idx로 적으므로 앞의 순번은 그대로)
  var g = { id: 'tigerskin', name: '호피', cat: 'gem', p: 115, life: 0, el: 0.95 };
  if (G.GOODS && !G.GOOD[g.id]) { g.idx = G.GOODS.length; G.GOODS.push(g); G.GOOD[g.id] = g; }
  // 호피는 동아시아·유럽 귀족이 탐내는 물건 — 중국(6)·일본(9)·북유럽(1)·지중해(2)·중근동(4)에서 웃돈
  if (G.GOOD_DEMAND) G.GOOD_DEMAND.tigerskin = { 6: 1.25, 9: 1.3, 1: 1.15, 2: 1.1, 4: 1.15 };

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.hunt = G.BALANCE.hunt || {
    origin: [5, 6, 8],   // 호피의 산지로 치는 지역: 인도·중국·동남아시아
    jitter: [0.8, 1.25]  // 얻는 양의 들쭉날쭉
  };
  /** 짐승 → 가죽: good 교역품 · per 한 마리당 통 · max 떼에서 얻는 최대 통 · lead 우두머리가 이 짐승이면 더 주는 통 · ko 이름 */
  G.HUNT_SPOILS = {
    tiger: { ko: '호랑이', good: 'tigerskin', per: 0.2, max: 6, lead: 1 },
    bear: { ko: '곰', good: 'fur', per: 0.35, max: 10, lead: 1 },
    lion: { ko: '사자', good: 'fur', per: 0.3, max: 8, lead: 2 },
    jaguar: { ko: '재규어', good: 'fur', per: 0.3, max: 8, lead: 1 },
    boar: { ko: '멧돼지', good: 'hides', per: 0.5, max: 15, lead: 1 },
    hyena: { ko: '하이에나', good: 'hides', per: 0.45, max: 12, lead: 1 }
  };
})(window.G = window.G || {});
