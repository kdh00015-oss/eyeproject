// 랜덤 이벤트: 하루 진행 시 낮은 확률로 발생하는 사건들
//  apply(next)는 새 상태(next)를 직접 변형하고, text/kind로 로그를 남긴다.
//  cond(state)가 있으면 조건을 만족할 때만 후보에 오른다.

import { clamp } from './util';

export const EVENTS = [
  // 이로운 사건
  { id: 'caravan', weight: 10, kind: 'good', text: '💰 행상 카라반이 들러 물건을 비싸게 사갔습니다! (+골드)',
    apply: (s) => { s.money += Math.round(40 + s.population * 5); } },
  { id: 'bumper', weight: 9, kind: 'good', text: '🌾 풍년 기운이 돌아 주민들이 활기찹니다. (행복도 +5)',
    apply: (s) => { s.happiness = clamp(s.happiness + 5, 0, 100); } },
  { id: 'migrant', weight: 8, kind: 'good', text: '👪 떠돌이 가족이 마을에 정착했습니다. (인구 +1)',
    apply: (s) => { s.population += 1; } },
  { id: 'goldVein', weight: 7, kind: 'good', text: '⛏️ 인근에서 광맥을 발견해 자원을 얻었습니다. (목재·돌 +)',
    apply: (s) => { s.wood += 15; s.stone += 12; } },
  { id: 'festival', weight: 6, kind: 'good', text: '🎉 깜짝 축제가 열려 주민들이 즐거워합니다. (행복도 +8)',
    apply: (s) => { s.happiness = clamp(s.happiness + 8, 0, 100); } },
  { id: 'treasure', weight: 5, kind: 'good', text: '🎁 길에서 보물상자를 주웠습니다!',
    apply: (s) => { s.money += Math.round(60 + Math.random() * 90); } },
  { id: 'goodCatch', weight: 6, kind: 'good', text: '🐟 강에 물고기 떼가 몰려왔습니다. 신선한 생선을 얻었습니다.',
    apply: (s) => { s.inventory.crucian = (s.inventory.crucian || 0) + 5; } },

  // 해로운 사건
  { id: 'pest', weight: 8, kind: 'warn', text: '🐛 병충해가 돌아 창고의 작물 일부가 상했습니다.',
    apply: (s) => {
      const ids = Object.keys(s.inventory).filter((k) => (s.inventory[k] || 0) > 0);
      if (ids.length) { const id = ids[Math.floor(Math.random() * ids.length)]; s.inventory[id] = Math.floor(s.inventory[id] * 0.7); }
    } },
  { id: 'thief', weight: 6, kind: 'warn', cond: (s) => s.money > 150, text: '🦹 밤사이 도둑이 들어 약간의 골드를 잃었습니다.',
    apply: (s) => { s.money = Math.max(0, s.money - Math.round(s.money * 0.05 + 10)); } },
  { id: 'illness', weight: 5, kind: 'warn', cond: (s) => s.happiness > 30, text: '🤒 가벼운 유행병이 돌아 주민들이 지쳤습니다. (행복도 -6)',
    apply: (s) => { s.happiness = clamp(s.happiness - 6, 0, 100); } },
];

// 하루에 한 번, 약 22% 확률로 이벤트 발생
export function rollEvent(state, chance = 0.22) {
  if (Math.random() > chance) return null;
  const pool = EVENTS.filter((e) => !e.cond || e.cond(state));
  if (!pool.length) return null;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.weight; if (r <= 0) return e; }
  return pool[pool.length - 1];
}
