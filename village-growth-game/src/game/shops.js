// 무기상점 판매 목록 + 제작 재료 수급(어디서 얻는지) 안내

// 무기상점에서 골드로 살 수 있는 장비 (id는 items.js의 장비)
export const ARMORY_STOCK = [
  { id: 'woodenSword', price: 80 },
  { id: 'ironSword', price: 260 },
  { id: 'knightBlade', price: 900 },
  { id: 'clothArmor', price: 90 },
  { id: 'leatherArmor', price: 280 },
  { id: 'plateArmor', price: 1000 },
  { id: 'leatherCap', price: 70 },
  { id: 'ironHelm', price: 220 },
  { id: 'leatherGloves', price: 70 },
  { id: 'ironGauntlet', price: 200 },
  { id: 'leatherBoots', price: 70 },
  { id: 'ironBoots', price: 200 },
  { id: 'woodCharm', price: 120 },
  { id: 'copperRing', price: 110 },
  { id: 'sturdyAxe', price: 240 },
  { id: 'sturdyPick', price: 240 },
];

// 제작 재료를 어디서 얻는지 (제작창에서 안내)
export const MATERIAL_SOURCE = {
  wood: '🪓 나무 벌목',
  stone: '⛏️ 바위 채광',
  plank: '⚒️ 제작(목재 3)',
  block: '⚒️ 제작(돌 3)',
  flour: '⚒️ 제작(밀 2)',
  hide: '⚔️ 사냥 드롭',
  bone: '⚔️ 사냥 드롭',
  oreIron: '⛏️ 산에서 채광 / ⚔️ 사냥',
  crystal: '⛏️ 산에서 채광(희귀) / 강화 재료',
  steel: '⚒️ 제련(철광석 3) / 화산 사냥',
  mythril: '⚔️ 화산·빙하·심연 사냥 드롭',
  dragonScale: '⚔️ 화산·심연 보스 드롭',
  feed: '🛒 시장에서 구매',
  milk: '🐄 소 사육',
  goatMilk: '🐐 염소 사육',
  egg: '🐔 닭 사육',
  duckEgg: '🦆 오리 사육',
  honey: '🐝 꿀벌 사육',
  wool: '🐑 양 사육',
  fur: '🐰 토끼 사육',
  truffle: '🐷 돼지 사육',
};

export function materialSource(id) {
  if (MATERIAL_SOURCE[id]) return MATERIAL_SOURCE[id];
  return null; // 작물/생선 등은 이름으로 충분
}
