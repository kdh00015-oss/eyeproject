// 도감(컬렉션) + 업적(Achievements)
//  - 도감: 작물/어류/축산물을 한 번이라도 얻으면 발견 처리(state.dex), 보유 중이면 자동 발견 취급
//  - 업적: 조건 충족 시 advanceDay에서 자동 달성 + 보상(골드/명성)

import { GOODS_LIST } from './goods';

// 도감 카테고리 (GOODS의 category 기반 자동 구성)
export const DEX_CATEGORIES = [
  { key: 'crop', name: '작물', icon: '🌾' },
  { key: 'fish', name: '어류', icon: '🐟' },
  { key: 'animal', name: '축산물', icon: '🥚' },
].map((c) => ({ ...c, items: GOODS_LIST.filter((g) => g.category === c.key) }));

// 발견 여부: 한 번이라도 얻었거나(dex) 현재 보유 중이면 발견
export function dexHas(state, id) {
  return !!(state.dex && state.dex[id]) || ((state.inventory && state.inventory[id]) || 0) > 0;
}

export function dexProgress(state) {
  const out = {};
  let found = 0, total = 0;
  for (const cat of DEX_CATEGORIES) {
    const f = cat.items.filter((g) => dexHas(state, g.id)).length;
    out[cat.key] = { found: f, total: cat.items.length };
    found += f; total += cat.items.length;
  }
  out.all = { found, total };
  return out;
}

// 전설 어종을 하나라도 발견했는지 (legendary 플래그가 있는 GOODS는 어류 중 일부)
import { FISH } from './fishing';
function hasLegendaryFish(state) {
  return Object.values(FISH).some((f) => f.legendary && dexHas(state, f.id));
}

// 업적 목록 (cond(state) → boolean, reward: {gold, fame})
export const ACHIEVEMENTS = [
  { id: 'firstHarvest', icon: '🌱', name: '첫 수확', desc: '작물을 처음 수확한다', reward: { gold: 30, fame: 1 }, cond: (s) => s.stats.harvested >= 1 },
  { id: 'farmHand', icon: '🌾', name: '농사꾼', desc: '작물을 누적 100개 수확', reward: { gold: 120, fame: 3 }, cond: (s) => s.stats.harvested >= 100 },
  { id: 'angler', icon: '🎣', name: '낚시꾼', desc: '물고기를 누적 50마리 낚기', reward: { gold: 120, fame: 3 }, cond: (s) => s.stats.fished >= 50 },
  { id: 'legendAngler', icon: '✨', name: '전설을 낚다', desc: '전설 등급 물고기를 잡는다', reward: { gold: 400, fame: 10 }, cond: hasLegendaryFish },
  { id: 'lumber', icon: '🪓', name: '벌목왕', desc: '나무를 누적 100번 벤다', reward: { gold: 120, fame: 3 }, cond: (s) => s.stats.chopped >= 100 },
  { id: 'miner', icon: '⛏️', name: '광부왕', desc: '바위를 누적 100번 캔다', reward: { gold: 120, fame: 3 }, cond: (s) => s.stats.mined >= 100 },
  { id: 'crafter', icon: '⚒️', name: '장인', desc: '아이템을 누적 50개 제작', reward: { gold: 150, fame: 4 }, cond: (s) => s.stats.crafted >= 50 },
  { id: 'rich', icon: '💰', name: '부농', desc: '골드 2,000 보유', reward: { gold: 0, fame: 5 }, cond: (s) => s.money >= 2000 },
  { id: 'tycoon', icon: '💎', name: '대부호', desc: '골드 10,000 보유', reward: { gold: 0, fame: 15 }, cond: (s) => s.money >= 10000 },
  { id: 'builder', icon: '🏗️', name: '건축가', desc: '건물을 누적 10채 짓는다', reward: { gold: 150, fame: 4 }, cond: (s) => s.stats.built >= 10 },
  { id: 'town', icon: '🏘️', name: '번성하는 마을', desc: '인구 20명 달성', reward: { gold: 200, fame: 6 }, cond: (s) => s.population >= 20 },
  { id: 'noble', icon: '🎖️', name: '출세', desc: '직위가 촌장 이상으로 승급', reward: { gold: 200, fame: 8 }, cond: (s) => s.rankIndex >= 2 },
  { id: 'general', icon: '⚔️', name: '장수 등용', desc: '장수를 한 명 등용한다', reward: { gold: 150, fame: 5 }, cond: (s) => (s.generals || []).length >= 1 },
  { id: 'conqueror', icon: '🏰', name: '정복자', desc: '다른 마을을 정복한다', reward: { gold: 500, fame: 20 }, cond: (s) => (s.villages || []).some((v) => v.owned) },
  { id: 'cropDex', icon: '📗', name: '작물 도감 완성', desc: '모든 작물을 수집', reward: { gold: 300, fame: 10 }, cond: (s) => DEX_CATEGORIES[0].items.every((g) => dexHas(s, g.id)) },
  { id: 'fishDex', icon: '📘', name: '어류 도감 완성', desc: '모든 어종을 수집', reward: { gold: 600, fame: 20 }, cond: (s) => DEX_CATEGORIES[1].items.every((g) => dexHas(s, g.id)) },
];

// 새로 달성된 업적만 반환 (이미 받은 것 제외)
export function newlyAchieved(state) {
  const got = new Set(state.achieved || []);
  return ACHIEVEMENTS.filter((a) => !got.has(a.id) && a.cond(state));
}
