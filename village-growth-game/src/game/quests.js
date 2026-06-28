// 퀘스트: 메인/서브/일일 + 보상(골드/명성/경험치/아이템)
//  goal.kind: 'stat:<key>' 누적 통계 | 'daily:<key>' 당일 | 'building:<id>' 레벨 | 'pop' | 'workers' | 'money'

import { itemCount } from './crafting';

export const QUESTS = [
  // 메인
  { id: 'm1', type: 'main', name: '첫 수확', desc: '작물을 처음 수확하세요.', goal: { kind: 'stat:harvested', target: 1 }, reward: { gold: 50, exp: 20 } },
  { id: 'm2', type: 'main', name: '보금자리', desc: '집을 1채 건설하세요.', goal: { kind: 'building:house', target: 1 }, reward: { gold: 120, exp: 30, fame: 5 } },
  { id: 'm3', type: 'main', name: '일손 모으기', desc: '일꾼을 1명 고용하세요.', goal: { kind: 'workers', target: 1 }, reward: { gold: 150, exp: 40, fame: 10 } },
  { id: 'm4', type: 'main', name: '풍요로운 마을', desc: '인구를 10명까지 늘리세요.', goal: { kind: 'pop', target: 10 }, reward: { gold: 400, fame: 25, items: [{ id: 'feast', qty: 1 }] } },
  // 서브
  { id: 's1', type: 'sub', name: '벌목꾼', desc: '나무를 15번 베세요.', goal: { kind: 'stat:chopped', target: 15 }, reward: { gold: 80, items: [{ id: 'plank', qty: 3 }] } },
  { id: 's2', type: 'sub', name: '광부', desc: '바위를 10번 캐세요.', goal: { kind: 'stat:mined', target: 10 }, reward: { gold: 80, items: [{ id: 'block', qty: 2 }] } },
  { id: 's3', type: 'sub', name: '어부', desc: '물고기를 10마리 잡으세요.', goal: { kind: 'stat:fished', target: 10 }, reward: { gold: 120, exp: 25 } },
  { id: 's4', type: 'sub', name: '장인', desc: '아이템을 5번 제작하세요.', goal: { kind: 'stat:crafted', target: 5 }, reward: { gold: 100, fame: 8 } },
  // 일일
  { id: 'd1', type: 'daily', name: '오늘의 수확', desc: '오늘 작물 5개 수확.', goal: { kind: 'daily:harvested', target: 5 }, reward: { gold: 60, exp: 15 } },
  { id: 'd2', type: 'daily', name: '오늘의 낚시', desc: '오늘 물고기 5마리.', goal: { kind: 'daily:fished', target: 5 }, reward: { gold: 70, exp: 15 } },
  { id: 'd3', type: 'daily', name: '오늘의 벌목', desc: '오늘 나무 8번 벌목.', goal: { kind: 'daily:chopped', target: 8 }, reward: { gold: 50, items: [{ id: 'wood', qty: 5 }] } },
];

export function questValue(state, derived, kind) {
  if (kind.startsWith('stat:')) return state.stats[kind.slice(5)] || 0;
  if (kind.startsWith('daily:')) { const k = kind.slice(6); return (state.stats[k] || 0) - (state.dailyBase[k] || 0); }
  if (kind.startsWith('building:')) return state.buildings[kind.slice(9)] || 0;
  if (kind.startsWith('have:')) return itemCount(state, kind.slice(5));
  if (kind === 'pop') return Math.floor(state.population);
  if (kind === 'workers') return state.workers.length;
  if (kind === 'money') return state.money;
  return 0;
}

export function questProgress(state, derived, q) {
  const cur = questValue(state, derived, q.goal.kind);
  return { cur: Math.min(cur, q.goal.target), target: q.goal.target, done: cur >= q.goal.target, claimed: state.claimed.includes(q.id) };
}
