// 목표(길잡이): 초반부터 후반까지 순서대로 안내하는 단계별 목표
//  done(state) → 달성 여부. 대시보드 '목표' 탭에서 다음 할 일을 보여준다.

import { totalAnimals } from './livestock';

const placed = (s, type) => (s.placed || []).some((p) => p.type === type);

export const GOALS = [
  { id: 'g_harvest', icon: '🌾', name: '첫 수확', desc: '씨앗(4번 도구)으로 밭에 심고 작물을 수확한다', done: (s) => s.stats.harvested >= 1 },
  { id: 'g_chop', icon: '🪓', name: '자원 채집', desc: '도끼로 나무를 베어 목재를 모은다', done: (s) => s.stats.chopped >= 1 },
  { id: 'g_sell', icon: '💰', name: '시장 판매', desc: '시장(또는 상인 NPC)에서 생산물을 판다', done: (s) => s.stats.harvested >= 8 || s.money > 200 },
  { id: 'g_house', icon: '🏠', name: '집 짓기', desc: '건설 핫바에서 집을 설치해 인구 공간을 늘린다', done: (s) => placed(s, 'house') },
  { id: 'g_worker', icon: '👷', name: '일꾼 고용', desc: '고용소에서 일꾼을 1명 고용한다', done: (s) => (s.workers || []).length >= 1 },
  { id: 'g_animal', icon: '🐔', name: '가축 키우기', desc: '축사에서 가축을 1마리 이상 들인다', done: (s) => totalAnimals(s.livestock) >= 1 },
  { id: 'g_trap', icon: '🦐', name: '어업 시설', desc: '통발이나 양식장을 설치한다', done: (s) => placed(s, 'fishtrap') || placed(s, 'fishfarm') },
  { id: 'g_wild', icon: '🌲', name: '들판 탐험', desc: '동쪽 관문으로 들판/숲에 가본다', done: (s) => s.visited && s.visited.wild },
  { id: 'g_town', icon: '🏙️', name: '도시 방문', desc: '서쪽 관문으로 도시에 가본다', done: (s) => s.visited && s.visited.town },
  { id: 'g_lvl2', icon: '🏘️', name: '마을 성장', desc: '건물·인구를 늘려 마을 레벨 2 달성', done: (s) => s.villageLevel >= 2 },
  { id: 'g_rank1', icon: '🧑‍🔧', name: '첫 승급', desc: '인구·자산을 모아 작업반장으로 승급', done: (s) => s.rankIndex >= 1 },
  { id: 'g_pop10', icon: '👥', name: '인구 10명', desc: '행복도를 유지해 인구 10명 달성', done: (s) => s.population >= 10 },
  { id: 'g_mountain', icon: '⛰️', name: '광산 개척', desc: '들판 너머 산에서 광물을 캔다', done: (s) => (s.visited && s.visited.mountain) || (s.inventory.oreIron || 0) > 0 },
  { id: 'g_money2k', icon: '🏆', name: '자산 2,000골드', desc: '안정적인 수입원을 만들어 2,000골드 보유', done: (s) => s.money >= 2000 },
  { id: 'g_general', icon: '⚔️', name: '장수 등용', desc: '촌장으로 승급해 장수를 등용한다', done: (s) => (s.generals || []).length >= 1 },
];

export function goalProgress(state) {
  const done = GOALS.filter((g) => g.done(state)).length;
  return { done, total: GOALS.length };
}
